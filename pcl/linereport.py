"""The outputs of the «Δεδομένα γραμμής» window (4.11, ROADMAP §26): tables of every parameter against frequency, the
report, the data files (CSV, JSON, MATLAB .mat as the Line/Cable Data input of §2.4.1), the model files in the layout of
the EMTP (Exact-PI and Nominal-PI, Line/Cable Data §3.2.4–3.2.5; FD, Line Model options §2.1; the _TLM block of the CP
m-phase device, cpline §4), a Python script that recomputes everything with pcl.lineconst and draws it with the
presets of pcl.plotting, and the graphs themselves.

    from pcl import lineconst as lc, linereport as lr
    data = lc.typical('400kV')
    sc = lc.scan(data, fmin=1, decades=6, ppd=10, length=100, fti='auto')
    lr.plot(sc, [('modes', 'Zc'), ('modes', 'alpha')], preset='ieee', out='modes.pdf')
    open('line.csv', 'w').write(lr.to_csv(sc, [('modes', 'Zc'), ('phase', 'Z')]))

The EMTP layouts follow the published descriptions; reading them back here is tested, reading them in the EMTP is not
(without the EMTP; the poles and residues of the FD file are in rad/s, as pcl.lineconst keeps them).
"""
import base64
import html
import io
import json
import math

import numpy as np

from . import lineconst as lc

# quantity → (title, unit, kind): 'mat' symmetric matrix, 'full' every element, 'mode' one value per mode
PHASE = {'Z': ('Z′ σειράς', 'Ω/km', 'mat'), 'Y': ('Y′ εγκάρσια', 'S/km', 'mat'), 'Zc': ('Z_c', 'Ω', 'mat'),
         'Yc': ('Y_c', 'S', 'mat'), 'H': ('H = e^(−Γℓ)', '', 'full')}
SYM = {'Z': ('Z′ συμμετρικών συνιστωσών', 'Ω/km', 'full'), 'Y': ('Y′ συμμετρικών συνιστωσών', 'S/km', 'full')}
MODE = {'Zc': ('Z_c', 'Ω'), 'alpha': ('α', 'Np/km'), 'beta': ('β', 'rad/km'), 'v': ('v', 'km/s'), 'tau': ('τ', 'μs'),
        'A': ('A = e^(−γℓ)', ''), 'R': ('R′', 'Ω/km'), 'L': ('L′', 'mH/km'), 'G': ('G′', 'μS/km'), 'C': ('C′', 'nF/km'),
        'Z': ('z′', 'Ω/km'), 'Y': ('y′', 'S/km')}
FIT = {'Zc': ('Z_c ακριβής', 'Ω'), 'Zc_fit': ('Z_c προσαρμογής', 'Ω'), 'A': ('A ακριβής', ''), 'A_fit': ('A προσαρμογής', ''),
       'err_zc': ('σφάλμα Z_c (σχετικό)', ''), 'err_a': ('σφάλμα A (απόλυτο)', '')}
DOMAINS = {'phase': PHASE, 'sym': SYM, 'modes': MODE, 'exact': MODE, 'fit': FIT,
           'ti': {'qerr': ('q-error του T_i', ''), 'tierr': ('απόκλιση στήλης T_i (1 − |cos|)', '')}}
DEFAULT = [('phase', 'Z'), ('phase', 'Y'), ('modes', 'Zc'), ('modes', 'alpha'), ('modes', 'v'), ('modes', 'A'),
           ('exact', 'Zc'), ('exact', 'v'), ('ti', 'qerr'), ('ti', 'tierr')]


class ReportError(ValueError):
    pass


def _labels(sc):
    M = sc['M']
    return [str(k + 1) for k in range(M)]


def series(sc, dom, qty, elems=None):
    """[(label, unit, array over f)] of one quantity: matrices by element (i, j) (the symmetric ones i ≤ j), modes by
    mode, the FD fit by mode, q-error once and the T_i deviation by mode. elems: a list of (i, j) or of mode numbers
    (from 1) to keep."""
    if dom not in DOMAINS or qty not in DOMAINS[dom]:
        raise ReportError(f'άγνωστο μέγεθος {dom}.{qty}')
    title, unit = DOMAINS[dom][qty][:2]
    M = sc['M']
    out = []
    if dom in ('phase', 'sym'):
        if dom == 'sym' and 'S' not in sc:
            raise ReportError('οι συμμετρικές συνιστώσες θέλουν 3, 6, 9 … φάσεις')
        A = np.asarray(sc['S'][qty] if dom == 'sym' else sc[qty])
        kind = DOMAINS[dom][qty][2]
        names = ['0', '1', '2'] if dom == 'sym' else None
        for i in range(M):
            for j in range(M):
                if kind == 'mat' and j < i:
                    continue
                if elems and (i + 1, j + 1) not in [tuple(e) for e in elems]:
                    continue
                if names:
                    lab = f'{title} {names[i % 3]}{names[j % 3]}' + (f' ({i // 3 + 1},{j // 3 + 1})' if M > 3 else '')
                else:
                    lab = f'{title} {i + 1},{j + 1}'
                out.append((lab, unit, A[:, i, j]))
    elif dom in ('modes', 'exact'):
        A = np.asarray(sc[dom][qty])
        for k in range(M):
            if elems and (k + 1) not in elems:
                continue
            out.append((f'{title} ρυθμός {k + 1}' + (' (ακριβής)' if dom == 'exact' else ''), unit, A[:, k]))
    elif dom == 'fit':
        if not sc.get('fit'):
            raise ReportError('δεν υπάρχει μοντέλο FD στη σάρωση')
        for k, m in enumerate(sc['fit']):
            if elems and (k + 1) not in elems:
                continue
            out.append((f'{title} ρυθμός {k + 1}', unit, np.asarray(m[qty])))
    else:
        if qty == 'qerr':
            out.append((title, unit, np.asarray(sc['qerr'])))
        else:
            A = np.asarray(sc['tierr'])
            for k in range(M):
                if not elems or (k + 1) in elems:
                    out.append((f'{title} ρυθμός {k + 1}', unit, A[:, k]))
    return out


def _cols(lab, unit, v, form):
    u = f' [{unit}]' if unit else ''
    if np.iscomplexobj(v):
        if form == 'reim':
            return [(f'Re {lab}{u}', v.real), (f'Im {lab}{u}', v.imag)]
        return [(f'|{lab}|{u}', np.abs(v)), (f'∠{lab} [°]', np.degrees(np.angle(v)))]
    return [(lab + u, np.asarray(v, float))]


def table(sc, items=None, form='magang'):
    """(header, rows) with f first and the columns of the quantities items [(domain, quantity), …]."""
    head, cols = ['f [Hz]'], [np.asarray(sc['f'], float)]
    for dom, qty in (items or DEFAULT):
        try:
            ss = series(sc, dom, qty)
        except ReportError:
            if items:
                raise
            continue
        for lab, unit, v in ss:
            for h, c in _cols(lab, unit, np.asarray(v), form):
                head.append(h)
                cols.append(c)
    return head, np.column_stack(cols)


def to_csv(sc, items=None, form='magang', sep=',', decimal='.'):
    """The table as CSV text (UTF-8, a header line; sep ';' and decimal ',' for a spreadsheet in Greek)."""
    head, rows = table(sc, items, form)

    def num(x):
        s = f'{x:.10g}'
        return s.replace('.', decimal) if decimal != '.' else s

    q = lambda h: '"' + h.replace('"', '""') + '"' if (sep in h or '"' in h) else h
    lines = [sep.join(q(h) for h in head)]
    lines += [sep.join(num(x) for x in r) for r in rows]
    return '\n'.join(lines) + '\n'


def to_json(sc, indent=None):
    """The whole scan as JSON (complex numbers as {re, im})."""
    return json.dumps(lc.jsonable(sc), ensure_ascii=False, indent=indent, allow_nan=False)


def to_mat(sc, path=None):
    """A MATLAB file: Z, Y (N × N × N_s, per km), f (1 × N_s), line_length (km) — the input of Line/Cable Data §2.4.1, so
    lineconst.load_zy_mat reads it back — and the rest of the scan (Zc, Yc, H, T_i, modes, exact modes, q-error).
    Returns the bytes (and writes path when given)."""
    from scipy.io import savemat
    tr = lambda A: np.transpose(np.asarray(A), (1, 2, 0))
    d = {'f': np.asarray(sc['f'], float)[None, :], 'line_length': float(sc['length']), 'Z': tr(sc['Z']), 'Y': tr(sc['Y']),
         'Zc': tr(sc['Zc']), 'Yc': tr(sc['Yc']), 'H': tr(sc['H']), 'Ti': np.asarray(sc['Ti']), 'fti': sc['fti'],
         'Tex': tr(sc['Tex']), 'qerr': np.asarray(sc['qerr']), 'tierr': np.asarray(sc['tierr']),
         'modes': {k: np.asarray(v) for k, v in sc['modes'].items()},
         'exact': {k: np.asarray(v) for k, v in sc['exact'].items()},
         'units': 'Z Ohm/km, Y S/km, modes: Z Ohm/km, alpha Np/km, beta rad/km, v km/s, tau us, L mH/km, G uS/km, C nF/km'}
    if 'S' in sc:
        d['Zsym'], d['Ysym'] = tr(sc['S']['Z']), tr(sc['S']['Y'])
    buf = io.BytesIO()
    savemat(buf, d, do_compression=True, oned_as='row')
    b = buf.getvalue()
    if path:
        with open(path, 'wb') as fh:
            fh.write(b)
    return b


# ---------------------------------------------------------------- the model files in the layout of the EMTP
def _tri(A):
    """Y(1,1) Y(2,1) Y(2,2) Y(3,1) … (the lower triangle by rows)."""
    return [A[i, j] for i in range(len(A)) for j in range(i + 1)]


def _rows(vals, n=6, fmt='{: .10E}'):
    return [' ' + ' '.join(fmt.format(v) for v in vals[k:k + n]) for k in range(0, len(vals), n)]


def _untri(vals, M):
    A = np.zeros((M, M))
    k = 0
    for i in range(M):
        for j in range(i + 1):
            A[i, j] = A[j, i] = vals[k]
            k += 1
    return A


def write_exact_pi(data, freqs, length):
    """The Exact-PI file (name_Exact_PI.mod, Line/Cable Data §3.2.4, Line Model options §4): per frequency the series
    and shunt admittances (S) of the exact π, real and imaginary parts, lower triangle, six numbers per line."""
    freqs = np.atleast_1d(np.asarray(freqs, float))
    M = len(lc.phase_matrices(data, float(freqs[0]))[0])
    out = [f'C LINE DATA, EXACT-PI, {M}', 'C                    === PI-EXACT LINE EQUIVALENTS ===', 'C',
           'C     MATRICES SHOWN AS Y(1,1) Y(2,1) Y(2,2) Y(3,1) Y(3,2) Y(3,3)',
           'C                        Y(4,1) Y(4,2) ......... IN MHOS.', f'C     LINE LENGTH = {length:.6E} KM (Power & Control Lab)', 'C']
    for f in freqs:
        p = lc.exact_pi(data, float(f), length)
        for k, (name, A) in enumerate((('SERIES-REAL', p['series'].real), ('SERIES-IMAG', p['series'].imag),
                                       ('SHUNT -REAL', p['shunt'].real), ('SHUNT -IMAG', p['shunt'].imag))):
            out.append((f' {f:.10E} HZ. ---> ' if k == 0 else '                    ---> ') + name + ':')
            out += _rows(_tri(A))
        out.append('C')
    return '\n'.join(out) + '\n'


def _numbers(line):
    return [float(t.replace('D', 'E').replace('d', 'e')) for t in line.split()]


def read_exact_pi(text):
    """{M, f, series, shunt} (lists of complex M × M matrices) from an Exact-PI file."""
    lines = text.splitlines()
    M = None
    for ln in lines:
        if ln.upper().startswith('C LINE DATA'):
            M = int(ln.split(',')[-1])
            break
    if not M:
        raise ReportError('το αρχείο δεν αρχίζει με «C LINE DATA, EXACT-PI, M»')
    n = M * (M + 1) // 2
    fs, parts, cur, buf, f = [], [], None, [], None
    for ln in lines:
        if not ln.strip() or ln.lstrip().upper().startswith('C ') or ln.strip().upper() == 'C':
            continue
        if '--->' in ln:
            if cur is not None:
                parts[-1][cur] = buf
            head, name = ln.split('--->')
            if 'HZ' in head.upper():
                f = float(head.upper().replace('HZ.', '').replace('HZ', ''))
                fs.append(f)
                parts.append({})
            cur = name.strip().rstrip(':').replace(' ', '')
            buf = []
        else:
            buf += _numbers(ln)
    if cur is not None:
        parts[-1][cur] = buf
    S, H = [], []
    for p in parts:
        if any(len(p.get(k, [])) != n for k in ('SERIES-REAL', 'SERIES-IMAG', 'SHUNT-REAL', 'SHUNT-IMAG')):
            raise ReportError(f'λάθος πλήθος στοιχείων (θέλω {n} ανά πίνακα)')
        S.append(_untri(p['SERIES-REAL'], M) + 1j * _untri(p['SERIES-IMAG'], M))
        H.append(_untri(p['SHUNT-REAL'], M) + 1j * _untri(p['SHUNT-IMAG'], M))
    return {'M': M, 'f': fs, 'series': S, 'shunt': H}


def write_nominal_pi(data, f, length):
    """The Nominal-PI file (name_Nominal_PI.mod, Line/Cable Data §3.2.5) for the PI multiphase device: the frequency, then
    R (Ω), L (H), G (S), C (F) of the whole line, lower triangle, six per line; the shunt G and C are the totals, half at
    each end as in the π branch of the EMTP."""
    p = lc.nominal_pi(data, f, length)
    M = len(p['R'])
    out = [f'C LINE DATA, NOMINAL-PI, {M}', f'C     LINE LENGTH = {length:.6E} KM, R OHM, L H, G S, C F (TOTALS)',
           f' {f:.10E}']
    for A in (p['R'], p['L'], 2 * p['G'], 2 * p['C']):
        out += _rows(_tri(np.asarray(A)))
    return '\n'.join(out) + '\n'


def read_nominal_pi(text):
    """{M, f, R, L, G, C} (totals) from a Nominal-PI file."""
    nums, M = [], None
    for ln in text.splitlines():
        if ln.upper().startswith('C LINE DATA'):
            M = int(ln.split(',')[-1])
        elif ln.strip() and not ln.lstrip().upper().startswith('C'):
            nums += _numbers(ln)
    if not M:
        raise ReportError('το αρχείο δεν αρχίζει με «C LINE DATA, NOMINAL-PI, M»')
    n = M * (M + 1) // 2
    if len(nums) != 1 + 4 * n:
        raise ReportError(f'λάθος πλήθος αριθμών ({len(nums)}, θέλω {1 + 4 * n})')
    f = nums[0]
    R, L, G, C = (_untri(nums[1 + k * n:1 + (k + 1) * n], M) for k in range(4))
    return {'M': M, 'f': f, 'R': R, 'L': L, 'G': G, 'C': C}


def _modechar(k):
    return str(k + 1) if k < 9 else chr(ord('A') + k - 9)


def write_fd_mod(mdl):
    """The FD model file (name_FD.mod, Line Model options §2.1, Figure 2–1): per mode −k, the number of poles of Z_c and
    Z_c(∞), the residues, the poles; the number of poles of A and the travel time, the residues, the poles; a comment
    line and the real T_i by rows, each followed by its imaginary part (zeros). Poles and residues in rad/s."""
    if mdl.get('type') != 'fd':
        raise ReportError('θέλω μοντέλο FD')
    M = len(mdl['modes'])
    D = lambda v: f'{v: .18E}'.replace('E', 'D')
    out = [f'C LINE DATA, FD, {M}', f'C LINE LENGTH = {mdl["length"]:.4E} KM',
           f'C TRANSFORMATION MATRIX AT F = {mdl.get("fti", 0):.4E} HZ', 'C POLES AND RESIDUES IN RAD/S (Power & Control Lab)']
    for k, m in enumerate(mdl['modes']):
        out.append(f'-{_modechar(k)}')
        z, a = m['zc'], m['a']
        out.append(f'{len(z["p"]):8d}      {z["d"]:.20E}')
        out += [' ' + ' '.join(D(v) for v in z['r'][i:i + 3]) for i in range(0, len(z['r']), 3)]
        out += [' ' + ' '.join(D(v) for v in z['p'][i:i + 3]) for i in range(0, len(z['p']), 3)]
        out.append(f'{len(a["p"]):8d}      {m["tau"]:.20E}')
        out += [' ' + ' '.join(D(v) for v in a['r'][i:i + 3]) for i in range(0, len(a['r']), 3)]
        out += [' ' + ' '.join(D(v) for v in a['p'][i:i + 3]) for i in range(0, len(a['p']), 3)]
    out.append('C   Q MATRIX BY ROWS (IMAGINARY PART = 0)')
    for row in np.asarray(mdl['Ti'], float):
        out.append(' ' + ' '.join(f'{v: .12f}' for v in row))
        out.append(' ' + ' '.join(f'{0.0: .12f}' for _ in row))
    return '\n'.join(out) + '\n'


def read_fd_mod(text):
    """The model dict of pcl.lineconst (type 'fd', modes with zc {d, r, p} and a {r, p}, τ, T_i) from an FD file."""
    lines = [ln for ln in text.splitlines() if ln.strip()]
    if not lines or not lines[0].upper().startswith('C LINE DATA'):
        raise ReportError('το αρχείο δεν αρχίζει με «C LINE DATA, FD, M»')
    M = int(lines[0].split(',')[-1])
    length = None
    for ln in lines:
        if 'LINE LENGTH' in ln.upper():
            try:
                length = float(ln.split('=')[1].split()[0])
            except (IndexError, ValueError):
                pass
    body = [ln for ln in lines if not ln.lstrip().upper().startswith('C')]
    i, modes = 0, []

    def take(n):
        nonlocal i
        vals = []
        while len(vals) < n:
            vals += _numbers(body[i])
            i += 1
        return vals

    for _ in range(M):
        if not body[i].strip().startswith('-'):
            raise ReportError(f'περιμένω τη γραμμή του ρυθμού (−k), βρήκα «{body[i].strip()[:20]}»')
        i += 1
        nz, d = body[i].split()[:2]
        i += 1
        nz = int(nz)
        rz, pz = take(nz), take(nz)
        na, tau = body[i].split()[:2]
        i += 1
        na = int(na)
        ra, pa = take(na), take(na)
        modes.append({'zc': {'d': float(d.replace('D', 'E')), 'r': rz, 'p': pz}, 'a': {'r': ra, 'p': pa},
                      'tau': float(tau.replace('D', 'E'))})
    T = np.array([take(M) for _ in range(2 * M)])
    Ti = T[0::2]
    return {'type': 'fd', 'M': M, 'length': length, 'Ti': Ti.tolist(), 'modes': modes}


def write_cp_netlist(mdl, name='TLM1', k='k', m='m'):
    """The netlist block of the CP m-phase device (cpline §4): _TLM;name;2M;2M;pins, the options (phases, distortionless,
    not transposed, input type 3 = R′, Z_c, τ), a line per mode (length km, R′ Ω/km, Z_c Ω, τ s), T_i by rows and zero
    initial conditions."""
    if mdl.get('type') != 'cp':
        raise ReportError('θέλω μοντέλο CP')
    M, L = mdl['M'], float(mdl['length'])
    ph = 'abcdefghijklmnopqrstuvwxyz'
    pins = [f'{k}{ph[j] if M <= 26 else j + 1}' for j in range(M)] + [f'{m}{ph[j] if M <= 26 else j + 1}' for j in range(M)]
    dl = 1 if any(x.get('dl') for x in mdl['modes']) else 0
    out = [f'_TLM;{name};{2 * M};{2 * M};' + ','.join(pins) + ',', f'{M},{dl},0,3,1,1,1,1,']
    for x in mdl['modes']:
        out.append(f'{L:.5E} {x["R"] / L:.5E} {x["Zc"]:.5E} {x["tau"]:.5E}')
    for row in np.asarray(mdl['Ti'], float):
        out.append(' '.join(f'{v:.8f}' for v in row))
    out += ['0'] * M
    return '\n'.join(out) + '\n'


# ---------------------------------------------------------------- the graphs (matplotlib, pcl.plotting presets)
def plot(sc, items=None, preset='ieee', out=None, form='magang', elems=None, style=None, title=None):
    """One figure with a panel per quantity (domain, quantity) against f, logarithmic axes where the values are positive;
    complex quantities as |x| (form 'magang', with the angle on a second panel when there is one quantity) or Re/Im.
    preset: a name of pcl/presets or a dict of pcl.plotting.preset; out: a file (pdf, svg, png, eps) or None (the figure)."""
    from . import plotting
    st = plotting.preset(preset, **(style or {})) if isinstance(preset, str) else preset
    plt = plotting._mpl(st)
    items = items or [('modes', 'Zc'), ('modes', 'alpha')]
    panels = []
    for dom, qty in items:
        ss = series(sc, dom, qty, elems)
        if form == 'magang' and len(items) == 1 and any(np.iscomplexobj(v) for _, _, v in ss):
            panels.append((dom, qty, ss, 'mag'))
            panels.append((dom, qty, ss, 'ang'))
        else:
            panels.append((dom, qty, ss, 'mag' if form == 'magang' else 'reim'))
    n = len(panels)
    w, h = st['width_cm'] / 2.54, st['height_cm'] / 2.54
    fig, axs = plt.subplots(n, 1, figsize=(w, h * (1 if n == 1 else 0.62 * n)), sharex=True, squeeze=False)
    f = np.asarray(sc['f'], float)
    ls = st.get('linestyles') or ['-']
    for ax, (dom, qty, ss, what) in zip(axs[:, 0], panels):
        title_, unit = DOMAINS[dom][qty][:2]
        pos = True
        short = lambda lab: lab[len(title_) + 1:] if lab.startswith(title_ + ' ') else lab
        for k, (lab, _, v) in enumerate(ss):
            lab = short(lab)
            v = np.asarray(v)
            if what == 'ang':
                y = np.degrees(np.angle(v))
                pos = False
            elif what == 'reim' and np.iscomplexobj(v):
                ax.plot(f, v.real, ls[k % len(ls)], label='Re ' + lab)
                ax.plot(f, v.imag, ls[(k + 1) % len(ls)], label='Im ' + lab)
                pos = pos and bool(np.all(v.real > 0) and np.all(v.imag > 0))
                continue
            else:
                y = np.abs(v) if np.iscomplexobj(v) else v
                pos = pos and bool(np.all(y > 0))
            ax.plot(f, y, ls[(k // len(st['colors'])) % len(ls)], label=lab)
        ax.set_xscale('log')
        if pos and what != 'ang':
            yv = np.concatenate([np.abs(np.asarray(v)).ravel() for _, _, v in ss])
            if yv.max() / max(yv.min(), 1e-300) > 30:
                ax.set_yscale('log')
        ylab = ('∠' + title_ + ' [°]') if what == 'ang' else (('|' + title_ + '|' if what == 'mag' and any(np.iscomplexobj(v) for _, _, v in ss) else title_)
                                                               + (f' [{unit}]' if unit else ''))
        ax.set_ylabel(ylab)
        if len(ss) > 1 and len(ss) <= 12:
            ax.legend(loc=st.get('legend', 'best'), ncol=1 if len(ss) <= 4 else 2)
    axs[-1, 0].set_xlabel('f [Hz]')
    if title:
        axs[0, 0].set_title(title)
    fig.tight_layout()
    if out:
        fig.savefig(out, dpi=st.get('dpi', 300))
        plt.close(fig)
        return out
    return fig


def _svg(sc, items, preset='slides'):
    """An inline SVG of the graphs (for the HTML report), or '' without matplotlib."""
    try:
        fig = plot(sc, items, preset=preset)
    except (RuntimeError, ImportError):
        return ''
    import matplotlib.pyplot as plt
    buf = io.StringIO()
    fig.savefig(buf, format='svg')
    plt.close(fig)
    s = buf.getvalue()
    return s[s.find('<svg'):]


# ---------------------------------------------------------------- the report
def _c(z, d=5):
    z = complex(z)
    if abs(z.imag) < 1e-15 * max(abs(z.real), 1e-300):
        return f'{z.real:.{d}g}'
    return f'{z.real:.{d}g} {"+" if z.imag >= 0 else "−"} j{abs(z.imag):.{d}g}'


def _mat_html(A, labels=None, cap=''):
    A = np.asarray(A)
    M = len(A)
    labels = labels or [str(k + 1) for k in range(M)]
    h = [f'<table class="m"><caption>{html.escape(cap)}</caption><tr><th></th>'
         + ''.join(f'<th>{html.escape(x)}</th>' for x in labels) + '</tr>']
    for i in range(M):
        h.append(f'<tr><th>{html.escape(labels[i])}</th>' + ''.join(f'<td>{_c(A[i, j])}</td>' for j in range(M)) + '</tr>')
    return ''.join(h) + '</table>'


def _kv_html(rows, cap=''):
    return (f'<table class="kv"><caption>{html.escape(cap)}</caption>'
            + ''.join(f'<tr><th>{html.escape(k)}</th><td>{v}</td></tr>' for k, v in rows) + '</table>')


CSS = ('body{font:14px/1.45 system-ui,sans-serif;max-width:60em;margin:2em auto;color:#222}h1{font-size:1.4em}'
       'h2{font-size:1.15em;border-bottom:1px solid #ccc;margin-top:1.6em}table{border-collapse:collapse;margin:.6em 0 1em}'
       'td,th{border:1px solid #ddd;padding:.15em .5em;font-variant-numeric:tabular-nums;text-align:right}'
       'caption{text-align:left;font-weight:600;padding:.2em 0}table.kv th{text-align:left;font-weight:500}'
       '.note{color:#555;font-size:.92em}svg{max-width:100%;height:auto}@media print{h2{break-after:avoid}}')


def report_html(data, f=50.0, length=None, U=None, sc=None, mdl=None, figures=True, title=None):
    """The report of the line as a self-contained HTML page: the data, the matrices at f (conductors, phases, symmetrical
    components), the sequence and the useful quantities, the modes at f, the Q-error tests, the model and, with a scan,
    its graphs (SVG through matplotlib). Print it to PDF from the browser."""
    L = length if length is not None else lc._f(data.get('length'), 1.0)
    name = title or data.get('name') or 'Γραμμή'
    h = [f'<!DOCTYPE html><html lang="el"><head><meta charset="utf-8"><title>{html.escape(name)}</title>'
         f'<style>{CSS}</style></head><body><h1>{html.escape(name)}</h1>',
         f'<p class="note">Power &amp; Control Lab — Δεδομένα γραμμής. Μήκος {L:g} km, f = {f:g} Hz, '
         f'ρ = {data.get("rho", "—")} Ω·m.</p>']
    try:
        cs = lc.conductors(data) if not (data.get('cables') or data.get('seq') or data.get('zyfile')) else []
    except lc.LineError:
        cs = []
    if cs:
        h.append('<h2>Αγωγοί</h2><table><tr><th>#</th><th>φάση</th><th>x [m]</th><th>ύψος πύργου [m]</th><th>μέσο ύψος [m]</th>'
                 '<th>r [cm]</th><th>R_dc [Ω/km]</th></tr>')
        for k, c in enumerate(cs):
            h.append(f'<tr><td>{k + 1}</td><td>{c["ph"] or "αγ. προστασίας"}</td><td>{c["x"]:.3f}</td>'
                     f'<td>{c.get("ht", c["h"]):.3f}</td><td>{c["h"]:.3f}</td><td>{c["r"] * 100:.4g}</td>'
                     f'<td>{c["Rdc"] * 1e3:.5g}</td></tr>')
        h.append('</table>')
    m = lc.matrices(data, f)
    h.append('<h2>Πίνακες ανά km</h2>')
    if 'phys' in m:
        h.append(_mat_html(m['phys']['Z'], m['phys']['labels'], 'Z των αγωγών [Ω/km]'))
        h.append(_mat_html(m['phys']['C'] * 1e9, m['phys']['labels'], 'C των αγωγών [nF/km]'))
    h.append(_mat_html(m['phase']['Z'], None, 'Z_E των φάσεων [Ω/km]'))
    h.append(_mat_html(m['phase']['C'] * 1e9, None, 'C_E των φάσεων [nF/km]'))
    if 'sym' in m:
        lab = [f'{"012"[k % 3]}' + (f'({k // 3 + 1})' if len(m['sym']['Z']) > 3 else '') for k in range(len(m['sym']['Z']))]
        h.append(_mat_html(m['sym']['Z'], lab, 'Z_S συμμετρικών συνιστωσών [Ω/km]'))
        h.append(_mat_html(m['sym']['C'] * 1e9, lab, 'C_S συμμετρικών συνιστωσών [nF/km]'))
    rep = lc.report(data, f)
    if 'seq' in rep:
        s = rep['seq']
        h.append(_kv_html([('R₁, X₁ [Ω/km]', f'{s["R1"]:.5g}, {s["X1"]:.5g}'), ('R₀, X₀ [Ω/km]', f'{s["R0"]:.5g}, {s["X0"]:.5g}'),
                           ('C₁, C₀ [nF/km]', f'{s["C1"] * 1e6:.5g}, {s["C0"] * 1e6:.5g}')], 'Ακολουθίες'))
        try:
            u = lc.useful(data, f, U, L)
            rows = [('Z_c1 [Ω]', _c(u['Zc1'])), ('Z_c0 [Ω]', _c(u['Zc0'])), ('X₁/R₁', f'{u["XR1"]:.4g}'),
                    ('X₀/X₁', f'{u["X0X1"]:.4g}'), ('R₀/X₁', f'{u["R0X1"]:.4g}'), ('k₀', _c(u['k0'], 4)),
                    ('v₁ [km/s]', f'{u["v1"] / 1e3:.6g}'), ('μήκος κύματος [km]', f'{u["wavelength"]:.5g}')]
            if 'SIL' in u:
                rows += [('SIL [MW]', f'{u["SIL"]:.4g}'), ('I_c [A/km]', f'{u["Ic"]:.4g}'), ('Q_c [Mvar/km]', f'{u["Qc"]:.4g}')]
            if 'ferranti' in u:
                rows += [('άνοδος τάσης ανοικτού άκρου', f'{u["ferranti"]:.5g}'), ('ηλεκτρικό μήκος [°]', f'{u["theta"]:.4g}')]
            h.append(_kv_html(rows, 'Χρήσιμα μεγέθη'))
        except lc.LineError:
            pass
    h.append('<h2>Ρυθμοί στη συχνότητα f</h2><table><tr><th>ρυθμός</th><th>R′ [Ω/km]</th><th>L′ [mH/km]</th>'
             '<th>C′ [nF/km]</th><th>|Z_c| [Ω]</th><th>v [km/s]</th><th>α [Np/km]</th></tr>')
    for k, md in enumerate(rep['modes']):
        h.append(f'<tr><td>{k + 1}</td><td>{md["R"]:.5g}</td><td>{md["L"]:.5g}</td><td>{md["C"] * 1e6:.5g}</td>'
                 f'<td>{md["Zc"]:.5g}</td><td>{md["v"] / 1e3:.6g}</td><td>{md["att"]:.4g}</td></tr>')
    h.append('</table>')
    h.append(_mat_html(rep['Ti'], None, f'T_i στα {f:g} Hz (q-error {rep["qerr"]:.3g})'))
    if sc is not None:
        h.append('<h2>Έλεγχος του T_i (δοκιμές Q-error)</h2>')
        qt = sc.get('qtests') or []
        if qt:
            keys = [k for k in qt[0] if k != 'f']
            h.append('<table><tr><th>f [Hz]</th>' + ''.join(f'<th>{html.escape(k)}</th>' for k in keys) + '</tr>')
            for r in qt:
                h.append(f'<tr><td>{r["f"]:.4g}</td>' + ''.join(f'<td>{_fmt(r[k])}</td>' for k in keys) + '</tr>')
            h.append('</table>')
        if figures:
            for items, cap in (([('modes', 'Zc'), ('modes', 'alpha'), ('modes', 'v')], 'Ρυθμοί (σταθερός T_i)'),
                               ([('phase', 'Z')], 'Z′ των φάσεων'), ([('ti', 'qerr'), ('ti', 'tierr')], 'Σφάλμα του T_i')):
                s = _svg(sc, items)
                if s:
                    h.append(f'<figure>{s}<figcaption>{html.escape(cap)}</figcaption></figure>')
    if mdl is not None:
        h.append('<h2>Μοντέλο</h2>')
        if mdl.get('type') == 'fd':
            h.append('<table><tr><th>ρυθμός</th><th>πόλοι Z_c</th><th>σφάλμα Z_c</th><th>πόλοι A</th><th>σφάλμα A</th>'
                     '<th>τ [μs]</th></tr>')
            for k, md in enumerate(mdl['modes']):
                h.append(f'<tr><td>{k + 1}</td><td>{len(md["zc"]["p"])}</td><td>{md["zc"].get("err", float("nan")):.3g}</td>'
                         f'<td>{len(md["a"]["p"])}</td><td>{md["a"].get("err", float("nan")):.3g}</td>'
                         f'<td>{md["tau"] * 1e6:.6g}</td></tr>')
            h.append('</table>')
        elif mdl.get('type') == 'cp':
            h.append('<table><tr><th>ρυθμός</th><th>Z_c [Ω]</th><th>τ [μs]</th><th>R [Ω]</th></tr>')
            for k, md in enumerate(mdl['modes']):
                h.append(f'<tr><td>{k + 1}</td><td>{md["Zc"]:.6g}</td><td>{md["tau"] * 1e6:.6g}</td><td>{md["R"]:.5g}</td></tr>')
            h.append('</table>')
    h.append('</body></html>')
    return '\n'.join(h)


def _fmt(v):
    if isinstance(v, (int, float)):
        return f'{v:.4g}'
    if isinstance(v, complex):
        return _c(v, 4)
    if isinstance(v, (list, tuple)):
        return ', '.join(_fmt(x) for x in v)
    return html.escape(str(v))


def report_pdf(data, path, f=50.0, length=None, U=None, sc=None, preset='slides'):
    """A PDF with the graphs of the scan, a page per group (matplotlib PdfPages); the tables are in report_html."""
    from matplotlib.backends.backend_pdf import PdfPages
    import matplotlib.pyplot as plt
    sc = sc if sc is not None else lc.scan(data, length=length)
    groups = [[('modes', 'Zc'), ('modes', 'alpha'), ('modes', 'v')], [('exact', 'Zc'), ('exact', 'alpha'), ('exact', 'v')],
              [('phase', 'Z')], [('phase', 'Y')], [('phase', 'H')], [('ti', 'qerr'), ('ti', 'tierr')]]
    if 'S' in sc:
        groups.insert(3, [('sym', 'Z')])
    if sc.get('fit'):
        groups.append([('fit', 'err_zc'), ('fit', 'err_a')])
    with PdfPages(path) as pdf:
        for g in groups:
            fig = plot(sc, g, preset=preset, title=data.get('name'))
            pdf.savefig(fig)
            plt.close(fig)
    return path


# ---------------------------------------------------------------- the Python script
def script(req):
    """A Python script that recomputes what the window shows: the data of the line, the scan with the same options, the
    graphs with a preset of pcl.plotting, the CSV and the model files, and (commented out) the link to the app."""
    data = lc._req_data(req)
    L, ti, fti = lc._req_opts(req, data)
    fmin, dec, ppd = lc._f(req.get('fmin'), 0.01), lc._f(req.get('dec'), 9), lc._f(req.get('ppd'), 10)
    preset = req.get('preset') or 'ieee'
    kind = req.get('model') if req.get('model') in ('fd', 'pi') else 'cp'
    items = req.get('items') or [('modes', 'Zc'), ('modes', 'alpha'), ('modes', 'v')]
    items = [tuple(x) for x in items]
    name = str(data.get('name') or 'γραμμή').replace('\n', ' ')
    js = json.dumps(data, ensure_ascii=False, indent=1)
    if "'''" in js:
        js = js.replace("'''", "\\'\\'\\'")
    fti_s = repr(fti) if fti == 'auto' else f'{float(fti):g}'
    m = {'cp': f"mdl = lc.cp_model(data, f={lc._f(req.get('f'), 50.0):g}, length=L, ti={ti!r}, mode={req.get('cp') or 'lumped'!r})\n"
               "open('line_CP.txt', 'w').write(lr.write_cp_netlist(mdl))",
         'pi': f"open('line_Nominal_PI.mod', 'w').write(lr.write_nominal_pi(data, {lc._f(req.get('f'), 50.0):g}, L))\nmdl = None",
         'fd': f"mdl = lc.fd_model(data, L, {fmin:g}, {dec:g}, {ppd:g}, {fti_s}, ti={ti!r})\n"
               "open('line_FD.mod', 'w').write(lr.write_fd_mod(mdl))"}[kind]
    return f'''"""{name}: οι παράμετροι της γραμμής συναρτήσει της συχνότητας (Power & Control Lab {_version()}, «Δεδομένα γραμμής»).

Τρέχει με το πακέτο pcl του repo (python -m pip install numpy scipy matplotlib): python {req.get('file') or 'line_scan.py'}
"""
import json

from pcl import lineconst as lc, linereport as lr

data = json.loads(r\'\'\'{js}\'\'\')
L = {L:g}                     # km
f = {lc._f(req.get('f'), 50.0):g}                    # Hz, για τους πίνακες και τα μοντέλα CP / π

# όλα τα μεγέθη από {fmin:g} Hz, {dec:g} δεκάδες, {ppd:g} σημεία ανά δεκάδα, T_i {ti} στα {fti_s} Hz
{m}
sc = lc.scan(data, fmin={fmin:g}, decades={dec:g}, ppd={ppd:g}, length=L, ti={ti!r}, fti={fti_s}, model=mdl)

m = lc.matrices(data, f)                 # Z, C των αγωγών, των φάσεων και των συμμετρικών συνιστωσών (ανά km)
print(lc.report(data, f)['modes'])
lr.plot(sc, {items!r}, preset={preset!r}, out='line_modes.pdf')
lr.plot(sc, [('phase', 'Z')], preset={preset!r}, out='line_Z.pdf')
open('line_scan.csv', 'w', encoding='utf-8').write(lr.to_csv(sc))
lr.to_mat(sc, 'line_scan.mat')            # Z, Y, f, line_length όπως το Line/Cable Data (§2.4.1)
open('line_report.html', 'w', encoding='utf-8').write(lr.report_html(data, f, L, sc=sc, mdl=mdl))
open('line_Exact_PI.mod', 'w').write(lr.write_exact_pi(data, sc['f'], L))

# στην εφαρμογή (η σύνδεση ανοιχτή, python run.py):
# import pcl
# app = pcl.link.connect()
# app.show({{'q-error': float(sc['qerr'].max())}}, title='{name}')
# d = app.line()                          # ό,τι έστειλε το παράθυρο «Δεδομένα γραμμής» με «Στην Python»
'''


def _version():
    try:
        from engine import __version__
        return __version__
    except ImportError:
        return ''


# ---------------------------------------------------------------- the fields around the line (for the drawing and the profiles)
def _phasors(M, mag=1.0):
    """1∠0°, 1∠−120°, 1∠120° for each three phases (a, b, c of every circuit), times mag."""
    a = [complex(math.cos(-2 * math.pi * k / 3), math.sin(-2 * math.pi * k / 3)) for k in range(3)]
    return [mag * a[k % 3] for k in range(M)]


def fields(data, U=400.0, I=1000.0, f=50.0, height=1.0, at='avg', earth='none', span=None, n=241, grid=(121, 73), map_at='tower'):
    """E (kV/m) and B (μT) of an overhead line for the line-to-line voltage U (kV rms) and the phase current I (A rms) of
    balanced three-phase sets (a, b, c of every circuit): the profiles at height over x (the ellipse major axes, as the
    guidelines take them, with the conductor heights at: 'avg' as the line model and the EMTP, 'mid' the lowest) and two
    maps over the cross-section (rms of the vector; heights map_at, the tower as the drawing shows it). Both scale linearly with
    U and I, so the drawing rescales them without asking again. The reference values of ICNIRP 2010 for the public at
    50 Hz (5 kV/m, 200 μT) come along for the profile."""
    cs = lc.conductors(data)
    M = max(c['ph'] for c in cs)
    xs_c = [c['x'] for c in cs]
    hk = {'avg': 'h', 'mid': 'hm', 'tower': 'ht'}[at]
    hmax = max(c[hk] for c in cs)
    hmap = {'avg': 'h', 'mid': 'hm', 'tower': 'ht'}[map_at]
    hmax_map = max(c[hmap] for c in cs)
    half = span or (max(abs(min(xs_c)), abs(max(xs_c))) + max(30.0, hmax))
    x = np.linspace(-half, half, n)
    V = _phasors(M, U / math.sqrt(3))
    Ip = _phasors(M, I)
    E = lc.field(data, V, x, height, at)
    B = lc.bfield(data, Ip, x, height, f, earth, at)
    nx, ny = grid
    gx = np.linspace(-half, half, nx)
    gy = np.linspace(0.0, hmax_map * 1.25 + 2.0, ny)
    Em = np.zeros((ny, nx))
    Bm = np.zeros((ny, nx))
    for j, y in enumerate(gy):
        Em[j] = lc.field(data, V, gx, float(y), map_at)['E']
        Bm[j] = lc.bfield(data, Ip, gx, float(y), f, earth, map_at)['B']
    return {'U': U, 'I': I, 'f': f, 'height': height, 'at': at, 'map_at': map_at, 'x': x, 'E': E['Emax'], 'B': B['Bmax'],
            'gx': gx, 'gy': gy, 'Emap': Em, 'Bmap': Bm, 'limits': {'E': 5.0, 'B': 200.0} if abs(f - 50.0) < 1e-9 else None}


# ---------------------------------------------------------------- the server actions (/api/line_scan, /api/line_export)
def _scan_req(req):
    data = lc._req_data(req)
    L, ti, fti = lc._req_opts(req, data)
    fmin, dec, ppd = lc._f(req.get('fmin'), 0.01), lc._f(req.get('dec'), 9), lc._f(req.get('ppd'), 10)
    if not (fmin > 0 and 1 <= dec <= 12 and 2 <= ppd <= 40):
        raise lc.LineError('εύρος: f_min > 0, 1–12 δεκάδες, 2–40 σημεία ανά δεκάδα')
    mdl = req.get('mdl') if isinstance(req.get('mdl'), dict) else None
    src = req.get('sources')
    if src is not None:
        try:
            src = [complex(x['re'], x.get('im', 0)) if isinstance(x, dict) else complex(*x) if isinstance(x, (list, tuple))
                   else complex(x) for x in src]
        except (TypeError, ValueError, KeyError):
            raise lc.LineError('οι πηγές της δοκιμής Q-error: αριθμοί ή {re, im}')
    sc = lc.scan(data, fmin, dec, ppd, L, ti, fti, model=mdl if (mdl and mdl.get('type') == 'fd') else None, sources=src)
    return data, L, sc, mdl


def api_scan(req):
    """{data, len, fmin, dec, ppd, ti, fti | tiauto, mdl (an FD model to compare), f, U} → the scan as JSON, with the
    matrices, the useful quantities at f and the lossless modes."""
    data, L, sc, mdl = _scan_req(req)
    f = lc._f(req.get('f'), 50.0)
    out = lc.jsonable(sc)
    out['matrices'] = lc.jsonable(lc.matrices(data, f))
    try:
        out['useful'] = lc.jsonable(lc.useful(data, f, req.get('U'), L))
    except lc.LineError:
        pass
    try:
        out['lossless'] = lc.jsonable(lc.lossless_modes(data, f, req.get('lossless') or 'r0'))
    except lc.LineError:
        pass
    if not (data.get('cables') or data.get('seq') or data.get('zyfile')):
        fq = req.get('field') if isinstance(req.get('field'), dict) else {}
        try:
            out['fields'] = lc.jsonable(fields(data, lc._f(fq.get('U'), 400.0), lc._f(fq.get('I'), 1000.0), f,
                                               lc._f(fq.get('height'), 1.0), fq.get('at') or 'avg', fq.get('earth') or 'none'))
        except (lc.LineError, KeyError, np.linalg.LinAlgError):
            pass
    return out


def api_load(req):
    """{base64 (a MATLAB file with Z, Y, f, line_length), unit} → {zyfile} for the line data (Line/Cable Data §2.4.1)."""
    try:
        raw = base64.b64decode(str(req.get('base64') or ''), validate=True)
    except ValueError:
        raise lc.LineError('το αρχείο δεν διαβάζεται')
    if not raw:
        raise lc.LineError('κενό αρχείο')
    unit = req.get('unit') or 'km'
    if unit not in ('km', 'm', 'mile'):
        raise lc.LineError(f'άγνωστη μονάδα μήκους «{unit}»')
    try:
        z = lc.load_zy_mat(raw, unit)
    except (ValueError, TypeError, NotImplementedError, OSError) as e:
        raise lc.LineError(f'το αρχείο .mat δεν διαβάζεται ({e})')
    return {'zyfile': lc.jsonable(z)}


EXPORTS = ('csv', 'json', 'mat', 'html', 'pdf', 'script', 'exact_pi', 'nominal_pi', 'fd_mod', 'cp_netlist')


def api_export(req):
    """{fmt, … as api_scan, items, form, sep, decimal, preset} → {name, mime, text | base64}."""
    fmt = req.get('fmt')
    if fmt not in EXPORTS:
        raise lc.LineError(f'άγνωστη εξαγωγή «{fmt}»')
    base = ''.join(ch for ch in str(req.get('name') or 'line') if ch.isalnum() or ch in '-_') or 'line'
    if fmt == 'script':
        return {'name': base + '.py', 'mime': 'text/x-python', 'text': script(req)}
    if fmt in ('fd_mod', 'cp_netlist'):
        mdl = req.get('mdl')
        if not isinstance(mdl, dict):
            raise lc.LineError('λείπει το μοντέλο (υπολόγισέ το πρώτα)')
        if fmt == 'fd_mod':
            return {'name': base + '_FD.mod', 'mime': 'text/plain', 'text': write_fd_mod(mdl)}
        return {'name': base + '_CP.txt', 'mime': 'text/plain', 'text': write_cp_netlist(mdl, base[:16] or 'TLM1')}
    data = lc._req_data(req)
    L, _, _ = lc._req_opts(req, data)
    f = lc._f(req.get('f'), 50.0)
    if fmt == 'nominal_pi':
        return {'name': base + '_Nominal_PI.mod', 'mime': 'text/plain', 'text': write_nominal_pi(data, f, L)}
    data, L, sc, mdl = _scan_req(req)
    if fmt == 'exact_pi':
        fs = req.get('freqs') or sc['f']
        return {'name': base + '_Exact_PI.mod', 'mime': 'text/plain', 'text': write_exact_pi(data, fs, L)}
    items = [tuple(x) for x in req['items']] if req.get('items') else None
    if fmt == 'csv':
        return {'name': base + '.csv', 'mime': 'text/csv',
                'text': to_csv(sc, items, req.get('form') or 'magang', req.get('sep') or ',', req.get('decimal') or '.')}
    if fmt == 'json':
        return {'name': base + '.json', 'mime': 'application/json', 'text': to_json(sc)}
    if fmt == 'mat':
        return {'name': base + '.mat', 'mime': 'application/octet-stream', 'base64': base64.b64encode(to_mat(sc)).decode()}
    if fmt == 'html':
        return {'name': base + '.html', 'mime': 'text/html',
                'text': report_html(data, f, L, req.get('U'), sc, mdl, figures=bool(req.get('figures', True)))}
    buf = io.BytesIO()
    report_pdf(data, buf, f, L, req.get('U'), sc, req.get('preset') or 'slides')
    return {'name': base + '.pdf', 'mime': 'application/pdf', 'base64': base64.b64encode(buf.getvalue()).decode()}
