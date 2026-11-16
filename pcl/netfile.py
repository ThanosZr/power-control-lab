"""Network files and changes of a network as data (4.19.4, ROADMAP §73, decision 273).

    net = read(text, name='case118.m')          a network from the text of a file: our JSON (pcl.network.to_dict), a MATPOWER
                                                 case (.m, version 2) or a PSS/E RAW file (versions 29 to 35, pcl.psse)
    net = read_file('grid.raw')                 the same from a path
    summary(net)                                what a file holds, in a few numbers, and what was left out of it (net.warnings)
    describe(net)                               what can be changed from the picture: loads, generators, ratings
    net2, done = apply(net, edits)              a copy of the network with a list of changes, and one sentence per change
    text = write(net, 'matpower')               the network as the text of a file: 'pcl' (JSON), 'matpower' or 'raw' (PSS/E 33)

The changes are data, so that the page, a request to the server and a script say the same thing (units in the names of
the keys: MW, Mvar, MVA, pu):

    {'op': 'load',   'bus': '5', 'P_MW': 12.0, 'Q_Mvar': 3.0}    the load of a bus (its loads keep their shares; a new one if none)
    {'op': 'load',   'bus': '5', 'scale': 1.2}                    the load of a bus times a factor
    {'op': 'scale',  'load': 1.1, 'gen': 1.1}                     every load, and the active power of every generator, times a factor
    {'op': 'gen',    'name': 'G2', 'P_MW': 80.0, 'V_pu': 1.02}    a generator by its name (or 'bus', when the bus has one): also Pmin_MW, Pmax_MW
    {'op': 'rating', 'branch': 'br7', 'rating_MVA': 60.0}         the rating of a branch (None or 0: no limit)
    {'op': 'outage', 'element': 'br7'}                            a branch, a generator, a load or a shunt out of service

The network that is given is never changed: apply works on a copy. A change that cannot be made (an unknown name, the last
source of the slack bus) is refused with a message that names it."""
import json
import math
from pathlib import Path

from . import network as N

FORMATS = ('pcl', 'matpower', 'raw')
OPS = ('load', 'scale', 'gen', 'rating', 'outage')
MAX_TEXT = 60_000_000          # characters of a file (a RAW file of 80 000 buses is about 25 MB)
SERIES = ('line', 'branch', 'transformer', 'transformer3', 'reactor')
SOURCES = ('generator', 'unit', 'feeder')


class FileError(N.NetworkError):
    """A file that is not read, or a change that is not made (the message is for the user, in Greek)."""


def sniff(text, name=''):
    """The format of a file from its name and its first characters: 'pcl', 'matpower' or 'raw'."""
    ext = Path(str(name)).suffix.lower()
    head = text.lstrip()[:400]
    if head.startswith('{'):
        return 'pcl'
    if 'mpc.' in text[:200000] and ('mpc.bus' in text or 'mpc.baseMVA' in text):
        return 'matpower'
    if ext == '.raw':
        return 'raw'
    if ext == '.m':
        return 'matpower'
    if ext == '.json':
        return 'pcl'
    first = head.split('\n', 1)[0]
    if first.count(',') >= 2:                  # the first record of a RAW file: IC, SBASE, REV, …
        try:
            float(first.split(',')[1].split('/')[0])
            return 'raw'
        except ValueError:
            pass
    raise FileError('Το αρχείο δεν αναγνωρίζεται: δεκτά είναι MATPOWER (.m), PSS/E RAW (.raw) και το JSON του pcl.network.')


def read(text, name='', fmt=None):
    """A Network from the text of a file. net.name is the name of the file without its extension; net.warnings says what
    the file had that the network does not carry."""
    if not isinstance(text, str) or not text.strip():
        raise FileError('Το αρχείο είναι κενό.')
    if len(text) > MAX_TEXT:
        raise FileError('Το αρχείο είναι πολύ μεγάλο.')
    fmt = fmt or sniff(text, name)
    stem = Path(str(name)).stem or 'network'
    try:
        if fmt == 'pcl':
            try:
                d = json.loads(text)
            except ValueError as e:
                raise FileError(f'Το JSON δεν διαβάζεται: {e}') from e
            if not isinstance(d, dict) or 'buses' not in d or 'elements' not in d:
                raise FileError('Το JSON δεν είναι δίκτυο του pcl.network (λείπουν τα buses και elements).')
            net = N.from_dict(d)
            net.name = net.name or stem
        elif fmt == 'matpower':
            net = _matpower(text)
            net.name = stem
        elif fmt == 'raw':
            from . import psse
            net = psse.read(text)
            net.name = stem
        else:
            raise FileError('Μορφή: pcl, matpower ή raw.')
    except FileError:
        raise
    except N.NetworkError as e:
        if type(e).__name__ == 'RawError':                # the messages of the RAW reader are already for the user
            raise FileError(str(e)) from e
        raise FileError(f'Το αρχείο δεν διαβάζεται ως {fmt}: {e}') from e
    except (KeyError, IndexError, TypeError, ValueError) as e:
        raise FileError(f'Το αρχείο δεν διαβάζεται ως {fmt}: {e}') from e
    if not net.buses:
        raise FileError('Το αρχείο δεν έχει ζυγούς.')
    if not any(d['type'] == 'slack' for d in net.buses.values()) and not any(e.get('slack') for e in net.elements):
        raise FileError('Το δίκτυο δεν έχει ζυγό ταλάντωσης.')
    if fmt != 'pcl':
        _drop_islands(net)
    return net


def _drop_islands(net):
    """A file from another program may leave buses that no branch in service ties to a slack bus (a winding out of service, a
    line open at both ends): a load flow has no solution for them. They are left out with what is connected to them, and
    net.warnings says how many."""
    adj = {b: [] for b in net.buses}
    for e in net.elements:
        if e['kind'] in SERIES:
            ends = [e[k] for k in ('a', 'b', 'c', 'hv', 'lv') if e.get(k) is not None]
            for p in ends:
                adj[p].extend(q for q in ends if q != p)
    seen = {b for b, d in net.buses.items() if d['type'] == 'slack'} | {e['bus'] for e in net.elements if e.get('slack')}
    todo = list(seen)
    while todo:
        for q in adj[todo.pop()]:
            if q not in seen:
                seen.add(q)
                todo.append(q)
    lost = [b for b, d in net.buses.items() if b not in seen and d['type'] != 'internal']
    if not lost:
        return
    gone = set(lost)
    net.elements = [e for e in net.elements if not any(e.get(k) in gone for k in ('bus', 'a', 'b', 'c', 'hv', 'lv'))]
    for b in lost:
        del net.buses[b]
    net.warnings = list(net.warnings) + [f'{len(lost)} ζυγοί δεν συνδέονται με ζυγό ταλάντωσης μέσα από κλάδους σε λειτουργία: δεν διαβάστηκαν, ούτε ό,τι συνδέεται σε αυτούς.']


def read_file(path, fmt=None):
    p = Path(path)
    return read(p.read_text(encoding='utf-8', errors='replace'), p.name, fmt)


def _matpower(text):
    """A MATPOWER case with what a file from outside may carry: buses out of service (type 4) are left out with what is
    connected to them, generator costs that are not polynomials are left out (the optimal power flow then has no cost
    for those generators), DC lines are not read. Each of these is said in net.warnings."""
    if 'mpc.bus' not in text:
        raise FileError('Δεν βρέθηκε ο πίνακας mpc.bus.')
    rows = N._matrix(text, 'bus')
    off = {str(int(r[0])) for r in rows if int(r[1]) == 4}
    warn = []
    gc = N._matrix(text, 'gencost')
    bad_cost = [k for k, c in enumerate(gc, 1) if not (int(c[0]) == 2 and int(c[3]) <= 3)]
    try:
        if not off and not bad_cost:
            net = N.read_matpower(text if '\n' in text else text + '\n')
        else:
            net = _matpower_loose(text, off, set(bad_cost))
    except IndexError as e:
        raise FileError('Ένας πίνακας του αρχείου έχει λιγότερες στήλες από όσες ορίζει η μορφή.') from e
    if off:
        warn.append(f'{len(off)} ζυγοί εκτός λειτουργίας (τύπος 4) δεν διαβάστηκαν, ούτε ό,τι συνδέεται σε αυτούς.')
    if bad_cost:
        warn.append(f'{len(bad_cost)} γεννήτριες έχουν κόστος που δεν είναι πολυώνυμο ως δεύτερου βαθμού: διαβάστηκαν χωρίς κόστος.')
    if N._matrix(text, 'dcline'):
        warn.append('Οι γραμμές DC του αρχείου (mpc.dcline) δεν διαβάστηκαν.')
    net.warnings = list(net.warnings) + warn
    return net


def _matpower_loose(text, off, bad_cost):
    import re
    keep = []
    for name in ('bus', 'gen', 'branch', 'gencost'):
        rows = N._matrix(text, name)
        if name == 'bus':
            rows = [r for r in rows if str(int(r[0])) not in off]
        elif name == 'gen':
            alive = [str(int(r[0])) not in off for r in rows]
            rows = [r for r, a in zip(rows, alive) if a]
        elif name == 'branch':
            rows = [r for r in rows if str(int(r[0])) not in off and str(int(r[1])) not in off]
        else:
            gens = N._matrix(text, 'gen')
            rows = [([2.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0] if k in bad_cost else r) for k, r in enumerate(rows[:len(gens)], 1) if str(int(gens[k - 1][0])) not in off]
        keep.append('mpc.%s = [\n%s\n];' % (name, '\n'.join(' '.join(repr(x) for x in r) + ';' for r in rows)))
    base = re.search(r'mpc\.baseMVA\s*=\s*([\d.eE+-]+)', text)
    net = N.read_matpower('mpc.baseMVA = %s;\n' % (base.group(1) if base else '100') + '\n'.join(keep) + '\n')
    for e in net.elements:                       # a cost that was not read is no cost, not a cost of zero
        if e['kind'] == 'generator' and e['name'].startswith('G') and int(e['name'][1:]) in bad_cost:
            e['cost'] = None
    return net


def _mw(x):
    return None if x is None else float(x) / 1e6


def _types(net):
    """The type of every bus as the load flow sees it: 3 slack, 2 voltage-controlled, 1 load bus (MATPOWER and PSS/E codes)."""
    t = {b: {'slack': 3, 'PV': 2}.get(d['type'], 1) for b, d in net.buses.items() if d['type'] != 'internal'}
    for e in net.elements:
        if e['kind'] in ('generator', 'unit'):
            if e.get('slack'):
                t[e['bus']] = 3
            elif e.get('V') is not None and t[e['bus']] == 1:
                t[e['bus']] = 2
    return t


def _numbers(net):
    """A number for every bus: its own name when all names are whole numbers, else 1, 2, … in the order of the network."""
    names = [b for b, d in net.buses.items() if d['type'] != 'internal']
    if all(b.isdigit() and 0 < int(b) < 10 ** 6 for b in names) and len({int(b) for b in names}) == len(names):
        return {b: int(b) for b in names}
    return {b: k for k, b in enumerate(names, 1)}


def _only_pu(net, fmt):
    """The file formats of the per-unit data carry branches in per unit: a network built from lines in Ω and transformers
    from their rating plates is written only as our JSON."""
    bad = sorted({e['kind'] for e in net.elements if e['kind'] not in ('branch', 'load', 'shunt', 'generator')})
    if bad:
        raise FileError(f'Το δίκτυο έχει στοιχεία ({", ".join(bad)}) που η μορφή {fmt} δεν κρατά: αποθήκευσέ το ως JSON.')
    if any(e['kind'] == 'load' and tuple(e.get('zip', (0, 0, 1))) != (0.0, 0.0, 1.0) for e in net.elements):
        raise FileError(f'Το δίκτυο έχει φορτία που δεν είναι σταθερής ισχύος: η μορφή {fmt} δεν τα κρατά, αποθήκευσέ το ως JSON.')


def to_matpower(net):
    """The network as a MATPOWER case (version 2), for networks of per-unit branches, constant-power loads, shunts and
    generators (what read_matpower gives). Every number is written so that it reads back as the same number."""
    _only_pu(net, 'MATPOWER')
    num, typ, S = _numbers(net), _types(net), net.S_base / 1e6
    g = lambda x: repr(float(x))                                        # noqa: E731  (the shortest text that reads back as the same number)
    Pd, Qd, Gs, Bs = ({b: 0.0 for b in num} for _ in range(4))
    for e in net.elements:
        if e['kind'] == 'load':
            Pd[e['bus']] += e['P'] / 1e6
            Qd[e['bus']] += e['Q'] / 1e6
        elif e['kind'] == 'shunt':
            Gs[e['bus']] += e['P'] / 1e6
            Bs[e['bus']] -= e['Q'] / 1e6
    fn = ''.join(ch if ch.isalnum() or ch == '_' else '_' for ch in (net.name or 'network')) or 'network'
    o = [f'function mpc = {fn if fn[0].isalpha() else "case_" + fn}', "mpc.version = '2';", f'mpc.baseMVA = {g(S)};', '',
         '%% bus_i type Pd Qd Gs Bs area Vm Va baseKV zone Vmax Vmin', 'mpc.bus = [']
    for b, d in net.buses.items():
        if b in num:
            o.append('\t' + '\t'.join([str(num[b]), str(typ[b]), g(Pd[b]), g(Qd[b]), g(Gs[b]), g(Bs[b]), '1', g(d.get('V', 1.0)), g(d.get('angle', 0.0)), g(d['Un'] / 1e3), '1',
                                         g(d['Vmax'] if d.get('Vmax') is not None else 1.1), g(d['Vmin'] if d.get('Vmin') is not None else 0.9)]) + ';')
    o += ['];', '', '%% bus Pg Qg Qmax Qmin Vg mBase status Pmax Pmin', 'mpc.gen = [']
    gens = [e for e in net.elements if e['kind'] == 'generator']
    for e in gens:
        o.append('\t' + '\t'.join([str(num[e['bus']]), g((e.get('P') or 0.0) / 1e6), '0', g((e['Qmax'] if e.get('Qmax') is not None else 9999e6) / 1e6),
                                     g((e['Qmin'] if e.get('Qmin') is not None else -9999e6) / 1e6), g(e['V'] if e.get('V') is not None else net.buses[e['bus']].get('V', 1.0)),
                                     g(e['Sr'] / 1e6), '1', g((e['Pmax'] if e.get('Pmax') is not None else e['Sr']) / 1e6), g((e.get('Pmin') or 0.0) / 1e6)]) + ';')
    o += ['];', '', '%% fbus tbus r x b rateA rateB rateC ratio angle status angmin angmax', 'mpc.branch = [']
    for e in net.elements:
        if e['kind'] == 'branch':
            rt = g((e.get('rating') or 0.0) / 1e6)
            o.append('\t' + '\t'.join([str(num[e['a']]), str(num[e['b']]), g(e['r']), g(e['x']), g(e['bc']), rt, rt, rt, g(e['ratio']), g(e['angle']), '1', '-360', '360']) + ';')
    o.append('];')
    if gens and all(e.get('cost') for e in gens):
        o += ['', '%% 2 startup shutdown n c2 c1 c0', 'mpc.gencost = [']
        for e in gens:
            c = ([0.0, 0.0, 0.0] + [float(x) for x in e['cost']])[-3:]
            o.append('\t2\t0\t0\t3\t' + '\t'.join(g(x) for x in c) + ';')
        o.append('];')
    return '\n'.join(o) + '\n'


def write(net, fmt='pcl'):
    """The network as the text of a file: 'pcl' (our JSON, every network), 'matpower' (.m) or 'raw' (PSS/E version 33)."""
    if fmt == 'pcl':
        return json.dumps(N.to_dict(net), indent=1, ensure_ascii=False) + '\n'
    if fmt == 'matpower':
        return to_matpower(net)
    if fmt == 'raw':
        from . import psse
        return psse.write(net)
    raise FileError('Μορφή: pcl, matpower ή raw.')


def summary(net):
    """What a network holds, in a few numbers (for the card of a study after a file is opened)."""
    k = lambda *kinds: sum(e['kind'] in kinds for e in net.elements)       # noqa: E731
    levels = sorted({round(d['Un'] / 1e3, 3) for d in net.buses.values() if d['type'] != 'internal'}, reverse=True)
    Pl = sum(e['P'] for e in net.elements if e['kind'] == 'load')
    Pg = sum((e.get('P') or 0.0) for e in net.elements if e['kind'] in ('generator', 'unit'))
    return {'name': net.name, 'buses': sum(d['type'] != 'internal' for d in net.buses.values()), 'branches': k(*SERIES), 'transformers': k('transformer', 'transformer3') + sum(
        1 for e in net.elements if e['kind'] == 'branch' and e.get('ratio') not in (0, 0.0, 1, 1.0, None)), 'generators': k('generator', 'unit'), 'loads': k('load'), 'shunts': k('shunt'),
            'levels_kV': levels[:12], 'load_MW': Pl / 1e6, 'gen_MW': Pg / 1e6, 'rated': sum(1 for e in net.elements if e['kind'] in SERIES and e.get('rating')),
            'costs': sum(1 for e in net.elements if e['kind'] in ('generator', 'unit') and e.get('cost')), 'S_base_MVA': net.S_base / 1e6, 'f': net.f,
            'warnings': [str(w) for w in net.warnings][:20]}


def describe(net):
    """What the picture lets one change, as it is now: {'load': {bus: [P MW, Q Mvar]}, 'gen': {bus: [[name, P MW, V pu, Pmin MW,
    Pmax MW, slack]…]}, 'rating': {branch: MVA or None}}."""
    load, gen, rating = {}, {}, {}
    for e in net.elements:
        k = e['kind']
        if k == 'load':
            p = load.setdefault(e['bus'], [0.0, 0.0])
            p[0] += e['P'] / 1e6
            p[1] += e['Q'] / 1e6
        elif k in ('generator', 'unit'):
            gen.setdefault(e['bus'], []).append([e['name'], _mw(e.get('P')), e.get('V'), _mw(e.get('Pmin')), _mw(e.get('Pmax')), bool(e.get('slack') or net.buses[e['bus']]['type'] == 'slack')])
        elif k in SERIES:
            rating[e['name']] = _mw(e.get('rating'))
    r6 = lambda x: None if x is None else float(f'{x:.7g}')              # noqa: E731
    return {'load': {b: [r6(p), r6(q)] for b, (p, q) in load.items()}, 'gen': {b: [[g[0], r6(g[1]), r6(g[2]), r6(g[3]), r6(g[4]), g[5]] for g in v] for b, v in gen.items()},
            'rating': {b: r6(x) for b, x in rating.items()}}


def _f(d, key, lo=None, hi=None, none=False):
    x = d.get(key)
    if x is None or x == '':
        if none:
            return None
        raise FileError(f'Αλλαγή {d.get("op")}: λείπει το {key}.')
    try:
        x = float(x)
    except (TypeError, ValueError):
        raise FileError(f'Αλλαγή {d.get("op")}: το {key} δεν είναι αριθμός.') from None
    if not math.isfinite(x) or (lo is not None and x < lo) or (hi is not None and x > hi):
        raise FileError(f'Αλλαγή {d.get("op")}: το {key} = {x:g} είναι έξω από τα όρια.')
    return x


def _n(x, unit=''):
    s = f'{x:.6g}'.replace('.', ',')
    return s + (' ' + unit if unit else '')


def apply(net, edits):
    """A copy of the network with the changes of the list, in their order, and one sentence for each change that was made.
    A later change of the same thing wins."""
    if not edits:
        return net, []
    if not isinstance(edits, (list, tuple)) or len(edits) > 5000:
        raise FileError('edits: μια λίστα αλλαγών.')
    net2 = N.from_dict(N.to_dict(net))
    net2.warnings = list(net.warnings)
    done = []
    for d in edits:
        if not isinstance(d, dict) or d.get('op') not in OPS:
            raise FileError('Κάθε αλλαγή έχει op: ' + ', '.join(OPS) + '.')
        done.append(globals()['_op_' + d['op']](net2, d))
    return net2, done


def _bus(net, d):
    b = str(d.get('bus'))
    if b not in net.buses or net.buses[b]['type'] == 'internal':
        raise FileError(f'Αλλαγή {d["op"]}: δεν υπάρχει ζυγός {b}.')
    return b


def _op_load(net, d):
    b = _bus(net, d)
    ls = [e for e in net.elements if e['kind'] == 'load' and e['bus'] == b]
    P0, Q0 = sum(e['P'] for e in ls), sum(e['Q'] for e in ls)
    if d.get('scale') is not None:
        s = _f(d, 'scale', 0.0, 100.0)
        P, Q = P0 * s, Q0 * s
    else:
        P = _f(d, 'P_MW', -1e6, 1e6) * 1e6
        Q = _f(d, 'Q_Mvar', -1e6, 1e6, none=True)
        Q = Q0 * (P / P0) if (Q is None and P0) else (0.0 if Q is None else Q * 1e6)      # without Q: the power factor stays
    if not ls:
        if P or Q:
            net.load(b, P, Q, name=_free(net, f'load{b}'))
    else:
        for e, (p, q) in zip(ls, _shares(ls, P, Q)):
            e['P'], e['Q'] = p, q
    return f'Φορτίο του ζυγού {b}: {_n(P0 / 1e6)} MW και {_n(Q0 / 1e6)} Mvar → {_n(P / 1e6)} MW και {_n(Q / 1e6)} Mvar.'


def _shares(ls, P, Q):
    """The new total split among the loads of a bus as the old one was (equally when the old total was zero)."""
    P0, Q0, n = sum(e['P'] for e in ls), sum(e['Q'] for e in ls), len(ls)
    return [((e['P'] / P0 * P) if P0 else P / n, (e['Q'] / Q0 * Q) if Q0 else Q / n) for e in ls]


def _free(net, name):
    names, k, out = {e['name'] for e in net.elements}, 1, name
    while out in names:
        k += 1
        out = f'{name}_{k}'
    return out


def _op_scale(net, d):
    sl, sg = _f(d, 'load', 0.0, 100.0, none=True), _f(d, 'gen', 0.0, 100.0, none=True)
    if sl is None and sg is None:
        raise FileError('Αλλαγή scale: δώσε load ή gen.')
    out = []
    if sl is not None:
        for e in net.elements:
            if e['kind'] == 'load':
                e['P'], e['Q'] = e['P'] * sl, e['Q'] * sl
        out.append(f'όλα τα φορτία × {_n(sl)}')
    if sg is not None:
        for e in net.elements:
            if e['kind'] in ('generator', 'unit') and e.get('P') is not None:
                p = e['P'] * sg
                e['P'] = min(p, e['Pmax']) if e.get('Pmax') is not None and sg > 1 else p
        out.append(f'η ενεργός ισχύς όλων των γεννητριών × {_n(sg)} (ως το μέγιστό τους)')
    return ('Κλίμακα: ' + ', '.join(out) + '.')


def _gen(net, d):
    gs = [e for e in net.elements if e['kind'] in ('generator', 'unit')]
    if d.get('name') not in (None, ''):
        g = [e for e in gs if e['name'] == str(d['name'])]
        if not g:
            raise FileError(f'Αλλαγή gen: δεν υπάρχει γεννήτρια {d["name"]}.')
        return g[0]
    b = _bus(net, d)
    g = [e for e in gs if e['bus'] == b]
    if len(g) != 1:
        raise FileError(f'Αλλαγή gen: ο ζυγός {b} έχει {len(g)} γεννήτριες· δώσε το όνομα (name).')
    return g[0]


def _op_gen(net, d):
    e = _gen(net, d)
    out = []
    for key, unit, field, k in (('P_MW', 'MW', 'P', 1e6), ('Pmin_MW', 'MW', 'Pmin', 1e6), ('Pmax_MW', 'MW', 'Pmax', 1e6), ('V_pu', 'pu', 'V', 1.0)):
        if d.get(key) is None or d.get(key) == '':
            continue
        x = _f(d, key, 0.5 if field == 'V' else -1e6, 1.5 if field == 'V' else 1e6)
        old = e.get(field)
        e[field] = x * k
        out.append(f'{field} {"—" if old is None else _n(old / k)} → {_n(x, unit)}')
        if field == 'V':
            for g in net.elements:               # the generators of a bus hold one voltage
                if g['kind'] in ('generator', 'unit') and g['bus'] == e['bus'] and g.get('V') is not None:
                    g['V'] = x
            net.buses[e['bus']]['V'] = x
    if not out:
        raise FileError('Αλλαγή gen: δώσε P_MW, V_pu, Pmin_MW ή Pmax_MW.')
    if e.get('Pmin') is not None and e.get('Pmax') is not None and e['Pmin'] > e['Pmax']:
        raise FileError(f'Αλλαγή gen: η γεννήτρια {e["name"]} θα είχε Pmin πάνω από Pmax.')
    return f'Γεννήτρια {e["name"]} (ζυγός {e["bus"]}): ' + ', '.join(out) + '.'


def _op_rating(net, d):
    name = str(d.get('branch'))
    e = next((q for q in net.elements if q['name'] == name and q['kind'] in SERIES), None)
    if e is None:
        raise FileError(f'Αλλαγή rating: δεν υπάρχει κλάδος {name}.')
    x = _f(d, 'rating_MVA', 0.0, 1e7, none=True)
    old = e.get('rating')
    if x:
        e['rating'] = x * 1e6
    else:
        e.pop('rating', None)
    return f'Όριο του κλάδου {name}: {"χωρίς όριο" if not old else _n(old / 1e6, "MVA")} → {"χωρίς όριο" if not x else _n(x, "MVA")}.'


def _op_outage(net, d):
    name = str(d.get('element') if d.get('element') not in (None, '') else d.get('branch'))
    e = next((q for q in net.elements if q['name'] == name), None)
    if e is None:
        raise FileError(f'Αλλαγή outage: δεν υπάρχει στοιχείο {name}.')
    k = e['kind']
    if k in SOURCES:
        b = e['bus']
        rest = [q for q in net.elements if q['kind'] in SOURCES and q['bus'] == b and q['name'] != name]
        slack = net.buses[b]['type'] == 'slack' or e.get('slack')
        if slack and not rest:
            raise FileError(f'Αλλαγή outage: το {name} είναι η μόνη πηγή του ζυγού ταλάντωσης {b}.')
        if slack and rest and e.get('slack') and not any(q.get('slack') for q in rest):
            rest[0]['slack'] = True
        if not rest and net.buses[b]['type'] == 'PV':
            net.buses[b]['type'] = 'PQ'                    # nothing holds the voltage of the bus any more
    net.remove(name)
    for q in [q for q in net.elements if q['kind'] == 'sssc' and q.get('line') == name]:
        net.remove(q['name'])
    what = {'line': 'Γραμμή', 'branch': 'Κλάδος', 'transformer': 'Μετασχηματιστής', 'transformer3': 'Μετασχηματιστής', 'reactor': 'Πηνίο', 'generator': 'Γεννήτρια',
            'unit': 'Μονάδα', 'feeder': 'Τροφοδότηση', 'load': 'Φορτίο', 'shunt': 'Εγκάρσιο στοιχείο', 'motor': 'Κινητήρας'}.get(k, 'Στοιχείο')
    ends = f' ({e["a"]} – {e["b"]})' if e.get('a') is not None and e.get('b') is not None else (f' (ζυγός {e["bus"]})' if e.get('bus') else '')
    return f'{what} {name}{ends}: εκτός λειτουργίας.'


def out_of_service(edits):
    """The names of the elements that a list of changes takes out (for the picture: drawn dashed, at their places)."""
    return [str(d.get('element') if d.get('element') not in (None, '') else d.get('branch')) for d in (edits or []) if isinstance(d, dict) and d.get('op') == 'outage']


__all__ = ['read', 'read_file', 'write', 'to_matpower', 'sniff', 'summary', 'describe', 'apply', 'out_of_service', 'FileError', 'FORMATS', 'OPS']
