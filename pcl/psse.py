"""PSS/E power flow raw data (RAW) files, read and written (4.19.4, ROADMAP §73, decision 273).

    net = read(text)          a pcl.network.Network from the text of a RAW file, versions 29 to 35
    text = write(net)         a network of per-unit branches, loads, shunts and generators as a RAW file of version 33

What is read: buses (number, name as a label, base kV, type, voltage, limits), loads (constant power, current and admittance
parts), fixed shunts and the shunts of the bus records of the old versions, switched shunts at their initial value, machines
(P, voltage set-point, reactive and active limits), branches with their line shunts and ratings, and transformers of two and
three windings (the three codes of the units of the turns ratio CW, of the impedances CZ and of the magnetising admittance
CM; a three-winding transformer as three branches to a star bus). What a RAW file has and the network does not carry is not
dropped silently: net.warnings says it (buses out of service, DC lines, FACTS devices, remote voltage regulation, …).

The conversion of a transformer follows the model of the format: an ideal transformer t1 : t2 with the impedance between
the two; in the branch model of pcl.network (ratio and shift at the first bus, the impedance on the side of the second) this
is ratio = t1/t2, shift = ANG1 and Z·t2². A record is a line of fields separated by commas or blanks, names in single
quotes, a comment after «/»; a section ends with a record whose first field is 0, and the file with Q.

The format is described in the documentation of PSS/E (Siemens PTI, «Data Formats Reference Manual», chapter «Power Flow
Data Contents»); the conversions are those of the reader of MATPOWER (psse2mpc: Zimmerman, Murillo-Sánchez)."""
import math
import re

from . import network as N

VERSIONS = (29, 30, 31, 32, 33, 34, 35)
# the sections of a file in their order, per version; 'BUS' is first (after the system-wide data from 34 on)
ORDER = {30: ('BUS', 'LOAD', 'GENERATOR', 'BRANCH', 'TRANSFORMER', 'AREA', 'TWO-TERMINAL DC', 'VSC DC', 'SWITCHED SHUNT', 'IMPEDANCE CORRECTION', 'MULTI-TERMINAL DC',
               'MULTI-SECTION LINE', 'ZONE', 'INTER-AREA TRANSFER', 'OWNER', 'FACTS'),
         31: ('BUS', 'LOAD', 'FIXED SHUNT', 'GENERATOR', 'BRANCH', 'TRANSFORMER', 'AREA', 'TWO-TERMINAL DC', 'VSC DC', 'IMPEDANCE CORRECTION', 'MULTI-TERMINAL DC',
               'MULTI-SECTION LINE', 'ZONE', 'INTER-AREA TRANSFER', 'OWNER', 'FACTS', 'SWITCHED SHUNT', 'GNE', 'INDUCTION MACHINE'),
         34: ('SYSTEM-WIDE', 'BUS', 'LOAD', 'FIXED SHUNT', 'GENERATOR', 'BRANCH', 'SYSTEM SWITCHING DEVICE', 'TRANSFORMER', 'AREA', 'TWO-TERMINAL DC', 'VSC DC',
               'IMPEDANCE CORRECTION', 'MULTI-TERMINAL DC', 'MULTI-SECTION LINE', 'ZONE', 'INTER-AREA TRANSFER', 'OWNER', 'FACTS', 'SWITCHED SHUNT', 'GNE',
               'INDUCTION MACHINE', 'SUBSTATION')}
KEYS = ('SYSTEM-WIDE', 'SYSTEM SWITCHING DEVICE', 'FIXED SHUNT', 'SWITCHED SHUNT', 'TWO-TERMINAL DC', 'MULTI-TERMINAL DC', 'VSC DC', 'VOLTAGE SOURCE CONVERTER', 'IMPEDANCE CORRECTION',
        'MULTI-SECTION LINE', 'INTER-AREA TRANSFER', 'INDUCTION MACHINE', 'SUBSTATION', 'GENERATOR', 'TRANSFORMER', 'BRANCH', 'LOAD', 'AREA', 'ZONE', 'OWNER', 'FACTS', 'GNE', 'BUS')
NOT_READ = {'TWO-TERMINAL DC': ('γραμμές DC δύο άκρων', 3), 'VSC DC': ('γραμμές DC με μετατροπείς πηγής τάσης', 3), 'MULTI-TERMINAL DC': ('γραμμές DC πολλών άκρων', None),
            'FACTS': ('διατάξεις FACTS', 1), 'GNE': ('στοιχεία GNE', None), 'INDUCTION MACHINE': ('επαγωγικές μηχανές', 1), 'MULTI-SECTION LINE': ('ομάδες γραμμών πολλών τμημάτων', 1),
            'SYSTEM SWITCHING DEVICE': ('διακόπτες', 1), 'IMPEDANCE CORRECTION': ('πίνακες διόρθωσης της σύνθετης αντίστασης μετασχηματιστών', None)}


class RawError(N.NetworkError):
    """A RAW file that is not read (the message is for the user, in Greek)."""


_FIELD = re.compile(r"\s*(?:'([^']*)'|\"([^\"]*)\"|([^,\s/][^,/]*?|))\s*(?:,|(?=/)|$)")


def fields(line):
    """The fields of a record: [(text, quoted)]. Commas separate (blanks too, where a record has no commas); a name in quotes
    is kept as it is, without the blanks at its end; «/» outside quotes starts a comment."""
    cut, q = len(line), False
    for i, ch in enumerate(line):
        if ch == "'":
            q = not q
        elif ch == '/' and not q:
            cut = i
            break
    body = line[:cut].rstrip()
    if not body.strip():
        return []
    if ',' not in body:                                   # free format with blanks
        return [((m.group(1).rstrip(), True) if m.group(1) is not None else (m.group(2), False)) for m in re.finditer(r"'([^']*)'|(\S+)", body)]
    out = []
    for part in _split(body):
        p = part.strip()
        out.append((p[1:-1].rstrip(), True) if len(p) >= 2 and p[0] == "'" and p[-1] == "'" else (p, False))
    return out


def _split(body):
    out, cur, q = [], [], False
    for ch in body:
        if ch == "'":
            q = not q
        if ch == ',' and not q:
            out.append(''.join(cur))
            cur = []
        else:
            cur.append(ch)
    out.append(''.join(cur))
    return out


class _Rec(list):
    """The fields of a record, read with defaults: a field that is missing, empty or printed as asterisks (a number that did
    not fit the column of the program that wrote the file) gives the default, and the reader counts the asterisks."""
    stars = 0

    def f(self, k, default=0.0):
        if k >= len(self):
            return default
        t = self[k][0].strip()
        if not t:
            return default
        if '*' in t:
            _Rec.stars += 1
            return default
        try:
            return float(t.replace('D', 'E').replace('d', 'e'))
        except ValueError:
            raise RawError(f'Το πεδίο {k + 1} μιας εγγραφής δεν είναι αριθμός: «{t[:20]}».') from None

    def i(self, k, default=0):
        return int(round(self.f(k, default)))

    def s(self, k, default=''):
        return self[k][0].strip() if k < len(self) else default


def _sections(lines, ver):
    """{section: [records]} from the lines after the three of the header. The name of a section comes from the comment of
    the record that ends the one before it («… BEGIN GENERATOR DATA»), and from the order of the version where a file has
    no such comments."""
    order = ORDER[34] if ver >= 34 else ORDER[31] if ver >= 31 else ORDER[30]
    out, k, name, cur = {}, 0, order[0], []
    for raw in lines:
        s = raw.strip()
        if not s or s.startswith('@!'):                   # column headers of the files of versions 34 and 35
            continue
        if s.upper() == 'Q':
            break
        head = s.split('/', 1)[0].strip().rstrip(',').strip()
        if head == '0':
            out.setdefault(name, []).extend(cur)
            cur, k = [], k + 1
            m = re.search(r'BEGIN\s+(.+?)\s+DATA', s.upper())
            nxt = None
            if m:
                nxt = next((key for key in KEYS if key in m.group(1)), None)
                nxt = 'VSC DC' if nxt == 'VOLTAGE SOURCE CONVERTER' else nxt
            name = nxt or (order[k] if k < len(order) else f'?{k}')
            continue
        cur.append(_Rec(fields(raw)))
    out.setdefault(name, []).extend(cur)
    return out


def _version(first, lines):
    f = _Rec(fields(first))
    if len(f) >= 3 and f.s(2):
        v = f.i(2)
    else:
        m = re.search(r'PSS.{0,4}E-(\d\d)', first)
        v = int(m.group(1)) if m else (33 if any('FIXED SHUNT' in ln.upper() for ln in lines[:200000]) else 30)
    if v not in VERSIONS:
        raise RawError(f'Η έκδοση {v} του αρχείου RAW δεν διαβάζεται (διαβάζονται οι {VERSIONS[0]} ως {VERSIONS[-1]}).')
    return v, f.f(1, 100.0), (f.f(5, 50.0) if len(f) >= 6 else 50.0)


def read(text):
    """A Network from the text of a RAW file. The buses are named by their numbers (the names of the file are their labels);
    a branch is «L<from>-<to>-<circuit>», a transformer «T…», a machine «G<bus>-<id>»."""
    lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    while lines and not lines[0].strip():
        lines.pop(0)
    if len(lines) < 4:
        raise RawError('Το αρχείο RAW έχει λιγότερες από τέσσερις γραμμές.')
    try:
        ver, sbase, freq = _version(lines[0], lines)
    except RawError as e:
        if 'έκδοση' in str(e):
            raise
        raise RawError('Η πρώτη γραμμή δεν είναι η επικεφαλίδα ενός αρχείου RAW (IC, SBASE, REV, …).') from None
    except (ValueError, IndexError):
        raise RawError('Η πρώτη γραμμή δεν είναι η επικεφαλίδα ενός αρχείου RAW (IC, SBASE, REV, …).') from None
    if not sbase > 0:
        raise RawError('Η ισχύς βάσης του αρχείου (SBASE) δεν είναι θετική.')
    _Rec.stars = 0
    sec = _sections(lines[3:], ver)
    net = N.Network(f=freq if freq > 0 else 50.0, S_base=sbase * 1e6)
    warn, MW = [], 1e6
    # ---- buses
    kv, vm, ide, off = {}, {}, {}, set()
    old = ver <= 30                                       # the shunt of a bus is in its record
    for r in sec.get('BUS', []):
        if len(r) < 4:
            continue
        b = str(r.i(0))
        if b in kv or b in off:
            raise RawError(f'Ο ζυγός {b} υπάρχει δύο φορές.')
        t = r.i(3, 1)
        if t == 4:
            off.add(b)
            continue
        base = r.f(2)
        kv[b], ide[b] = base, t
        V, A = (r.f(8, 1.0), r.f(9)) if old else (r.f(7, 1.0), r.f(8))
        vm[b] = V
        hi, lo = (r.f(9, 0.0), r.f(10, 0.0)) if ver >= 33 and len(r) >= 11 else (0.0, 0.0)
        net.bus(b, base * 1e3 if base > 0 else 1e3, 'slack' if t == 3 else 'PQ', V=V if V > 0 else 1.0, angle=A, Vmax=hi if hi > 0 else None, Vmin=lo if lo > 0 else None,
                label=r.s(1) or None)
        if old and (r.f(4) or r.f(5)):
            net.shunt(b, r.f(4) * MW, -r.f(5) * MW, name=f'sh{b}')
    if not kv:
        raise RawError('Το αρχείο RAW δεν έχει ζυγούς σε λειτουργία.')
    if off:
        warn.append(f'{len(off)} ζυγοί εκτός λειτουργίας (τύπος 4) δεν διαβάστηκαν, ούτε ό,τι συνδέεται σε αυτούς.')
    names = set()

    def uniq(nm):
        k, out = 1, nm
        while out in names:
            k += 1
            out = f'{nm}~{k}'
        names.add(out)
        return out
    # ---- loads: constant power, current and admittance parts (MW and Mvar at 1 pu; YQ < 0 for an inductive load)
    for r in sec.get('LOAD', []):
        b = str(r.i(0))
        if b not in kv or r.i(2, 1) <= 0:
            continue
        nm = f'load{b}-{r.s(1) or "1"}'
        parts = [((0.0, 0.0, 1.0), r.f(5), r.f(6)), ((0.0, 1.0, 0.0), r.f(7), r.f(8)), ((1.0, 0.0, 0.0), r.f(9), -r.f(10))]
        live = [q for q in parts if q[1] or q[2]] or parts[:1]
        for z, P, Q in live:
            net.load(b, P * MW, Q * MW, zip=z, name=uniq(nm if z[2] else nm + ('.I' if z[1] else '.Z')))
    # ---- fixed shunts (G MW and B Mvar at 1 pu, B > 0 for a capacitor)
    for r in sec.get('FIXED SHUNT', []):
        b = str(r.i(0))
        if b in kv and r.i(2, 1) > 0 and (r.f(3) or r.f(4)):
            net.shunt(b, r.f(3) * MW, -r.f(4) * MW, name=uniq(f'sh{b}-{r.s(1) or "1"}'))
    # ---- switched shunts: at their initial value BINIT (the field after the name of the regulated bus)
    nsw = 0
    for r in sec.get('SWITCHED SHUNT', []):
        b = str(r.i(0))
        q = [k for k, (_, quoted) in enumerate(r) if quoted and k > 1]
        kb = (q[-1] + 1) if q else (7 if ver <= 31 else 9)
        stat = r.i(4 if ver >= 35 else 3, 1) if ver >= 32 else 1
        if b in kv and stat > 0:
            nsw += 1
            if r.f(kb):
                net.shunt(b, 0.0, -r.f(kb) * MW, name=uniq(f'sw{b}'))
    if nsw:
        warn.append(f'{nsw} εγκάρσια στοιχεία με βαθμίδες διαβάστηκαν σταθερά, στην αρχική τους τιμή (BINIT).')
    # ---- machines
    g0 = 9 if ver >= 35 else 8                            # MBASE: after IREG (and NREG from 35 on)
    remote, fixedq, ngen = 0, 0, 0
    for r in sec.get('GENERATOR', []):
        b = str(r.i(0))
        if b not in kv or r.i(g0 + 6, 1) <= 0:
            continue
        ngen += 1
        nm = uniq(f'G{b}-{r.s(1) or "1"}')
        PG, QG, QT, QB, VS, reg = r.f(2), r.f(3), r.f(4, 9999.0), r.f(5, -9999.0), r.f(6, 1.0), r.i(7)
        mbase, PT, PB = r.f(g0, sbase) or sbase, r.f(g0 + 8, 9999.0), r.f(g0 + 9, -9999.0)
        far = reg not in (0, int(b)) and str(reg) in kv
        fixed = abs(QT - QB) < 1e-9
        holds = ide[b] == 3 or (ide[b] == 2 and not fixed)
        V = None
        if holds:
            V = vm[b] if far else VS                      # a remote bus cannot be regulated here: the machine holds its own bus where the file left it
            remote += far
        net.generator(b, Sr=abs(mbase) * MW, Ur=net.buses[b]['Un'], xd2=0.2, cosphi=0.85, P=PG * MW, V=V, Qmin=QB * MW, Qmax=QT * MW, slack=ide[b] == 3, name=nm,
                      Pmin=PB * MW if PB > -9000 else None, Pmax=PT * MW if PT < 9000 else None)
        if not holds:                                     # a machine that does not hold the voltage gives the reactive power of the file
            fixedq += 1
            if QG:
                net.load(b, 0.0, -QG * MW, name=uniq(nm + '.Q'))
    if remote:
        warn.append(f'{remote} μηχανές ρυθμίζουν την τάση άλλου ζυγού: διαβάστηκαν να κρατούν την τάση του δικού τους ζυγού στην τιμή που έχει στο αρχείο.')
    if fixedq:
        warn.append(f'{fixedq} μηχανές δεν ρυθμίζουν τάση (ζυγός φορτίου ή ίσα όρια αέργου): διαβάστηκαν με την άεργο ισχύ του αρχείου, ως φορτίο «….Q» δίπλα στη μηχανή.')
    # ---- branches
    b0 = 19 if ver >= 34 else 9                           # GI: after the three ratings, or after the name and the twelve ratings
    zero = 0
    for r in sec.get('BRANCH', []):
        a, b = str(abs(r.i(0))), str(abs(r.i(1)))
        if a not in kv or b not in kv or r.i(b0 + 4, 1) <= 0:
            continue
        nm = uniq(f'L{a}-{b}-{r.s(2) or "1"}')
        R, X = r.f(3), r.f(4)
        if abs(complex(R, X)) < 1e-6:
            zero += 1
            X = 1e-4
        rate = r.f(7 if ver >= 34 else 6)
        net.branch_pu(a, b, R, X, r.f(5), name=nm, rating=rate * MW if rate > 0 else None)
        for bus, kk, tag in ((a, b0, '.i'), (b, b0 + 2, '.j')):
            if r.f(kk) or r.f(kk + 1):
                net.shunt(bus, r.f(kk) * sbase * MW, -r.f(kk + 1) * sbase * MW, name=uniq(nm + tag))
    if zero:
        warn.append(f'{zero} κλάδοι μηδενικής σύνθετης αντίστασης διαβάστηκαν με X = 0,0001 pu.')
    # ---- transformers
    nrate = 12 if ver >= 34 else 3
    recs, k, lost = sec.get('TRANSFORMER', []), 0, 0
    while k < len(recs):
        h = recs[k]
        three = h.i(2) != 0
        n = 5 if three else 4
        blk = recs[k:k + n]
        k += n
        if len(blk) < n:
            raise RawError('Η τελευταία εγγραφή μετασχηματιστή του αρχείου είναι μισή.')
        bus = [str(abs(h.i(0))), str(abs(h.i(1)))] + ([str(abs(h.i(2)))] if three else [])
        stat = h.i(11, 1)
        if stat <= 0 or any(q not in kv for q in bus):
            continue
        CW, CZ, CM, ckt = h.i(4, 1), h.i(5, 1), h.i(6, 1), h.s(3) or '1'
        if CW not in (1, 2, 3) or CZ not in (1, 2, 3) or CM not in (1, 2):
            lost += 1
            continue
        z = blk[1]
        wind = blk[2:]

        def tap(w, q):
            base, nom = kv[q], w.f(1)
            v = w.f(0, 1.0)
            if CW == 1 or base <= 0:
                return v if CW != 2 else 1.0
            return v / base if CW == 2 else v * (nom if nom > 0 else base) / base

        def imp(kr, ks):
            R, X, S = z.f(kr), z.f(kr + 1), z.f(ks, sbase) or sbase
            if CZ == 3:                                   # load loss in W and |Z| in pu of the winding base
                R = R / (S * MW)
                X = math.sqrt(max(X * X - R * R, 0.0))
            return complex(R, X) * (sbase / S if CZ != 1 else 1.0)
        nm = uniq('T' + '-'.join(bus) + f'-{ckt}')
        # the magnetising admittance, at the bus of the first winding
        G, B = h.f(7), h.f(8)
        if CM == 2 and (G or B):
            S = z.f(2, sbase) or sbase
            g = G / (S * MW)
            G, B = g * S / sbase, -math.sqrt(max(B * B - g * g, 0.0)) * S / sbase
        if (G or B) and not (three and stat == 4):
            net.shunt(bus[0], G * sbase * MW, -B * sbase * MW, name=uniq(nm + '.m'))
        if not three:
            t1, t2 = tap(wind[0], bus[0]), tap(wind[1], bus[1])
            Z = imp(0, 2) * t2 * t2
            if abs(Z) < 1e-9:
                Z = complex(0.0, 1e-4)
            rate = wind[0].f(3)
            net.branch_pu(bus[0], bus[1], Z.real, Z.imag, 0.0, ratio=t1 / t2, angle=wind[0].f(2), name=nm, rating=rate * MW if rate > 0 else None)
            continue
        Z12, Z23, Z31 = imp(0, 2), imp(3, 5), imp(6, 8)
        Zs = [(Z12 + Z31 - Z23) / 2, (Z12 + Z23 - Z31) / 2, (Z23 + Z31 - Z12) / 2]
        star = f'{nm}*'
        vs, an = z.f(9, 1.0), z.f(10)
        net.bus(star, net.buses[bus[0]]['Un'], 'PQ', V=vs if vs > 0 else 1.0, angle=an, label='άστρο ' + nm)
        outw = {2: 1, 3: 2, 4: 0}.get(stat)               # the winding that is out of service
        for w in range(3):
            if w == outw:
                continue
            Z = Zs[w] if abs(Zs[w]) > 1e-9 else complex(0.0, 1e-4)
            rate = wind[w].f(3)
            net.branch_pu(bus[w], star, Z.real, Z.imag, 0.0, ratio=tap(wind[w], bus[w]), angle=wind[w].f(2), name=uniq(f'{nm}.{w + 1}'), rating=rate * MW if rate > 0 else None)
    if lost:
        warn.append(f'{lost} μετασχηματιστές με κωδικούς CW, CZ ή CM που δεν ορίζει η μορφή δεν διαβάστηκαν.')
    # ---- what the network does not carry
    for key, (what, per) in NOT_READ.items():
        m = len(sec.get(key, []))
        if m:
            warn.append(f'Δεν διαβάστηκαν: {what}' + (f' ({m // per})' if per else '') + '.')
    if _Rec.stars:
        warn.append(f'{_Rec.stars} πεδία του αρχείου είναι αστερίσκοι (αριθμός που δεν χώρεσε στη στήλη του): διαβάστηκαν ως κενά.')
    net.warnings = warn
    return net


def read_file(path):
    from pathlib import Path
    return read(Path(path).read_text(encoding='latin-1'))


def write(net, version=33):
    """The network as a RAW file of version 33: per-unit branches (a branch with a ratio or a shift as a two-winding
    transformer with CW = CZ = CM = 1, and its line charging, which a transformer record does not have, as two fixed shunts),
    loads with their constant power, current and admittance parts, shunts, generators.
    The costs of the generators have no place in the format. Every number is written so that it reads back as itself."""
    from . import netfile
    if version != 33:
        raise RawError('Γράφεται μόνο η έκδοση 33.')
    bad = sorted({e['kind'] for e in net.elements if e['kind'] not in ('branch', 'load', 'shunt', 'generator')})
    if bad:
        raise RawError(f'Το δίκτυο έχει στοιχεία ({", ".join(bad)}) που η μορφή RAW δεν κρατά όπως είναι: αποθήκευσέ το ως JSON.')
    num, typ, S = netfile._numbers(net), netfile._types(net), net.S_base / 1e6
    g = lambda x: repr(float(x))                                        # noqa: E731
    nm = lambda s: "'" + ''.join(ch if 31 < ord(ch) < 127 and ch != "'" else '?' for ch in str(s))[:12].ljust(12) + "'"      # noqa: E731
    o = [f'0, {g(S)}, 33, 0, 0, {g(net.f)} / Power & Control Lab', (net.name or 'network')[:60].encode('ascii', 'replace').decode(), 'written by pcl.psse']
    for b, d in net.buses.items():
        if b in num:
            o.append(f"{num[b]}, {nm(d.get('label') or b)}, {g(d['Un'] / 1e3)}, {typ[b]}, 1, 1, 1, {g(d.get('V', 1.0))}, {g(d.get('angle', 0.0))}, "
                     f"{g(d['Vmax'] if d.get('Vmax') is not None else 1.1)}, {g(d['Vmin'] if d.get('Vmin') is not None else 0.9)}, 1.1, 0.9")
    o.append('0 / END OF BUS DATA, BEGIN LOAD DATA')
    cnt = {}
    trafo = lambda e: e['ratio'] not in (0.0, 1.0) or e['angle'] != 0.0      # noqa: E731

    def ident(b):
        cnt[b] = cnt.get(b, 0) + 1
        return f"'{cnt[b]}'" if cnt[b] < 100 else f"'{chr(65 + (cnt[b] // 36) % 26)}{'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[cnt[b] % 36]}'"
    for e in net.elements:
        if e['kind'] == 'load':
            zz, zi, zp = (float(x) for x in e.get('zip', (0.0, 0.0, 1.0)))
            P, Q = e['P'] / 1e6, e['Q'] / 1e6
            o.append(f"{num[e['bus']]}, {ident(('L', e['bus']))}, 1, 1, 1, {g(P * zp)}, {g(Q * zp)}, {g(P * zi)}, {g(Q * zi)}, {g(P * zz)}, {g(-Q * zz)}, 1, 1, 0")
    o.append('0 / END OF LOAD DATA, BEGIN FIXED SHUNT DATA')
    for e in net.elements:
        if e['kind'] == 'shunt':
            o.append(f"{num[e['bus']]}, {ident(('S', e['bus']))}, 1, {g(e['P'] / 1e6)}, {g(-e['Q'] / 1e6)}")
    for e in net.elements:                                # a transformer record has no line charging: half at each bus, as the branch model has it
        if e['kind'] == 'branch' and trafo(e) and e['bc']:
            o.append(f"{num[e['a']]}, {ident(('S', e['a']))}, 1, 0.0, {g(0.5 * e['bc'] * S / (e['ratio'] or 1.0) ** 2)}")
            o.append(f"{num[e['b']]}, {ident(('S', e['b']))}, 1, 0.0, {g(0.5 * e['bc'] * S)}")
    o.append('0 / END OF FIXED SHUNT DATA, BEGIN GENERATOR DATA')
    for e in net.elements:
        if e['kind'] == 'generator':
            V = e['V'] if e.get('V') is not None else net.buses[e['bus']].get('V', 1.0)
            qt, qb = (e['Qmax'] if e.get('Qmax') is not None else 9999e6) / 1e6, (e['Qmin'] if e.get('Qmin') is not None else -9999e6) / 1e6
            if e.get('V') is None and not e.get('slack'):              # a machine that holds no voltage: equal limits say so
                qt = qb = 0.0
            o.append(f"{num[e['bus']]}, {ident(('G', e['bus']))}, {g((e.get('P') or 0.0) / 1e6)}, 0.0, {g(qt)}, {g(qb)}, {g(V)}, 0, {g(e['Sr'] / 1e6)}, 0.0, 1.0, 0.0, 0.0, 1.0, 1, 100.0, "
                     f"{g((e['Pmax'] if e.get('Pmax') is not None else 9999e6) / 1e6)}, {g((e['Pmin'] if e.get('Pmin') is not None else -9999e6) / 1e6)}, 1, 1.0")
    o.append('0 / END OF GENERATOR DATA, BEGIN BRANCH DATA')
    for e in net.elements:
        if e['kind'] == 'branch' and not trafo(e):
            r = g((e.get('rating') or 0.0) / 1e6)
            o.append(f"{num[e['a']]}, {num[e['b']]}, {ident(('B', min(e['a'], e['b']), max(e['a'], e['b'])))}, {g(e['r'])}, {g(e['x'])}, {g(e['bc'])}, {r}, {r}, {r}, 0.0, 0.0, 0.0, 0.0, 1, 1, 0.0, 1, 1.0")
    o.append('0 / END OF BRANCH DATA, BEGIN TRANSFORMER DATA')
    for e in net.elements:
        if e['kind'] == 'branch' and trafo(e):
            r = g((e.get('rating') or 0.0) / 1e6)
            o.append(f"{num[e['a']]}, {num[e['b']]}, 0, {ident(('B', min(e['a'], e['b']), max(e['a'], e['b'])))}, 1, 1, 1, 0.0, 0.0, 2, {nm(e['name'])}, 1, 1, 1.0")
            o.append(f"{g(e['r'])}, {g(e['x'])}, {g(S)}")
            o.append(f"{g(e['ratio'] or 1.0)}, 0.0, {g(e['angle'])}, {r}, {r}, {r}, 0, 0, 1.1, 0.9, 1.1, 0.9, 33, 0, 0.0, 0.0, 0.0")
            o.append('1.0, 0.0')
    for a, b in (('TRANSFORMER', 'AREA'), ('AREA', 'TWO-TERMINAL DC'), ('TWO-TERMINAL DC', 'VSC DC LINE'), ('VSC DC LINE', 'IMPEDANCE CORRECTION'), ('IMPEDANCE CORRECTION', 'MULTI-TERMINAL DC'),
                 ('MULTI-TERMINAL DC', 'MULTI-SECTION LINE'), ('MULTI-SECTION LINE', 'ZONE'), ('ZONE', 'INTER-AREA TRANSFER'), ('INTER-AREA TRANSFER', 'OWNER'), ('OWNER', 'FACTS DEVICE'),
                 ('FACTS DEVICE', 'SWITCHED SHUNT'), ('SWITCHED SHUNT', 'GNE'), ('GNE', 'INDUCTION MACHINE')):
        o.append(f'0 / END OF {a} DATA, BEGIN {b} DATA')
    o += ['0 / END OF INDUCTION MACHINE DATA', 'Q']
    return '\n'.join(o) + '\n'


__all__ = ['read', 'read_file', 'write', 'fields', 'RawError', 'VERSIONS']
