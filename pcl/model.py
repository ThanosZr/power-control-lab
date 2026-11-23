"""The common model, step 1 (5.0.11, ROADMAP §70 point 1, THEORY §8ΩΛ): the network of a drawing for the studies of
pcl.network, with the identity of the drawing. Step 2 (5.0.12, THEORY §8ΩΜ): the parts inside subcircuits, the line from
geometry (TLM) and the equivalent of a network (EQV3). Experimental.

The drawing of the app (its parts GEN3, GRID3, VAC3, LINE3, XF3, ZSER3, LOAD3, CB3, FLT3 and the wires between them) becomes
buses and elements by web/studio/model.js (Model.of; from Python with of(project), through Node). Here that model becomes a
pcl.network.Network in one of two ways:

* 'pf', the load flow as the EMT start of the drawing solves it (mna.js acInit): a GEN3 is a source |V|∠θ at its terminals
  (V0, ang0), a GRID3 its EMF behind Z₁ = c·U_n²/S″k, a VAC3 its EMF behind R_s + jωL_s, a LINE3 its π section (the exact π of
  the line with model «tl»), an XF3 its three single-phase units (the leakage split, the magnetizing branch where the part has it,
  the iron losses at side 1, the tap at side 1 and the phase shift of the group), a ZSER3 its impedance, a LOAD3 its P(V);
  (5.0.12) a TLM its exact π at f from the geometry (pcl.lineconst) or from its data per mode, in the positive sequence; an EQV3
  its sources E_k∠θ_k behind the circuit of its kind (Fig. 50, 15b, 15c, 15a, the FDNE) in the positive sequence, as a nodal
  admittance in per unit made of branches and shunts;
* 'sc', the elements of IEC 60909-0: a GRID3 a network feeder (S″k, R/X, its c, the zero sequence), a GEN3 a generator (S_n, U_n,
  x″d, cos φ_rG for K_G, THEORY §8στ), an XF3 a transformer (u_k, u_R, the group with its earthing, K_T), a LINE3 a line, a
  ZSER3 a reactor, a VAC3 a feeder with Z_Q = R_s + jωL_s; the loads are left out (IEC 60909-0 neglects non-rotating loads);
  (5.0.12) a TLM a line with Z₁ and Z₀ of Z′·ℓ in symmetrical components; an EQV3 the passive network between its ports and the
  earth (its sources short-circuited), positive and zero sequence, as reactors without a correction factor.

A closed breaker (its state at t = 0) joins two buses (its R_on is left out). Buses that no source reaches are left out of
the study, with a note.

    m = model.of(project)                    # the model of a drawing (a dict as the app saves it, or a pcl.Project)
    net, info = model.network(m, 'pf')       # the buses by the drawing's names; info: the ids of the drawing → the elements
    r = model.load_flow(m)                   # the load flow by the ids of the drawing
    s = model.short_circuit(m, '3ph')        # IEC 60909-0 at every bus, and at each FLT3 of the drawing (its kind of fault)
"""
import cmath
import math

import numpy as np

from . import network as N

VERSION = 3                                  # 2 (5.0.12): TLM, EQV3, the parts inside subcircuits (ids X1/<id>); 3 (5.0.13): the
                                             # controls of a GEN3 (ctl: avr, pss, gov) for the RMS dynamics
SQ3 = math.sqrt(3)
STUDIES = ('pf', 'sc')
TYPES = ('GEN3', 'GRID3', 'VAC3', 'LINE3', 'XF3', 'ZSER3', 'LOAD3', 'CB3', 'FLT3', 'TLM', 'EQV3')
SOURCES = ('GEN3', 'GRID3', 'VAC3', 'EQV3')
SERIES = ('LINE3', 'XF3', 'ZSER3', 'TLM')
PFX = {'G': 1e9, 'M': 1e6, 'k': 1e3, 'K': 1e3, 'm': 1e-3, 'u': 1e-6, 'μ': 1e-6, 'µ': 1e-6, 'n': 1e-9, 'p': 1e-12}
# the groups of XF3 (netlib.js GROUPS): the connection of side 1 and side 2, star points earthed; the clock number gives the shift
GROUPS = {'Yy0': ('Y', 'Y', 0, 0, 0), 'YNyn0': ('Y', 'Y', 1, 1, 0), 'Yyn0': ('Y', 'Y', 0, 1, 0), 'YNy0': ('Y', 'Y', 1, 0, 0),
          'Yd1': ('Y', 'D', 0, 0, 1), 'Yd11': ('Y', 'D', 0, 0, 11), 'YNd1': ('Y', 'D', 1, 0, 1), 'YNd11': ('Y', 'D', 1, 0, 11),
          'Dy1': ('D', 'Y', 0, 0, 1), 'Dy11': ('D', 'Y', 0, 0, 11), 'Dyn1': ('D', 'Y', 0, 1, 1), 'Dyn11': ('D', 'Y', 0, 1, 11), 'Dd0': ('D', 'D', 0, 0, 0)}
# an FLT3 of the drawing as a fault of IEC 60909-0
FAULTS = {'abc': '3ph', 'abcg': '3ph', 'ab': '2ph', 'bc': '2ph', 'ca': '2ph', 'ag': '1ph', 'bg': '1ph', 'cg': '1ph',
          'abg': '2phE', 'bcg': '2phE', 'cag': '2phE'}


class ModelError(ValueError):
    pass


def _num(p, k, d=0.0):
    try:
        v = float(p.get(k, d))
    except (TypeError, ValueError):
        return float(d)
    return v if math.isfinite(v) else float(d)


def of(project):
    """The common model of a drawing: a project dict (as the app saves it) or a pcl.Project, through Node (web/studio/model.js);
    a model already (a dict with 'buses' and 'elements') is returned as it is."""
    if isinstance(project, dict) and 'buses' in project and 'elements' in project:
        return _check(project)
    from . import core
    data = project.data if isinstance(project, core.Project) else project
    if not isinstance(data, dict) or 'components' not in data:
        raise ModelError('of: ένα κύκλωμα της εφαρμογής (components, wires) ή ένα pcl.Project')
    return _check(core._node({'action': 'model', 'project': data}))


def _check(m):
    if not isinstance(m, dict) or not isinstance(m.get('buses'), list) or not isinstance(m.get('elements'), list):
        raise ModelError('Το μοντέλο του σχεδίου θέλει buses και elements (web/studio/model.js).')
    if int(m.get('version') or 0) > VERSION:
        raise ModelError(f'Μοντέλο σχεδίου έκδοσης {m.get("version")}: αυτή η Python διαβάζει ως την {VERSION}.')
    for b in m['buses']:
        if not isinstance(b, dict) or not b.get('id'):
            raise ModelError('Κάθε ζυγός του μοντέλου θέλει id.')
    for e in m['elements']:
        if not isinstance(e, dict) or e.get('type') not in TYPES or not isinstance(e.get('buses'), list):
            raise ModelError(f'Στοιχείο του μοντέλου που δεν διαβάζεται: {e.get("id") if isinstance(e, dict) else e}')
    return m


# ---------------------------------------------------------------- the data of the parts, as netlib.js has them
def _grid_z(p):
    """Z₁, Z₀ (Ω), the EMF (V, phase) of a GRID3 (netlib.js gridZ), and its neutral."""
    Un, cf, Sk, XR = max(_num(p, 'Un', 20e3), 1e-9), max(_num(p, 'cf', 1.1), 1e-9), max(_num(p, 'Sk', 500e6), 1e-9), max(_num(p, 'XR', 10), 0.0)
    Z1 = cf * Un * Un / Sk
    R1 = Z1 / math.sqrt(1 + XR * XR)
    X1 = R1 * XR
    XR0 = max(_num(p, 'XR0', 10), 0.0)
    c0, s0 = 1 / math.sqrt(1 + XR0 * XR0), XR0 / math.sqrt(1 + XR0 * XR0)
    mode = p.get('z0') or 'ratio'
    if mode == 'iso':
        R0, X0 = R1, X1
    elif mode == 'sk1':
        K = 3 * cf * Un * Un / max(_num(p, 'Sk1', 400e6), 1e-9)
        Ar, Ai = 2 * R1, 2 * X1
        b = Ar * c0 + Ai * s0
        d = b * b - (Ar * Ar + Ai * Ai - K * K)
        r = -b + math.sqrt(d) if d >= 0 else float('nan')
        R0, X0 = (r * c0, r * s0) if r > 0 else (R1, X1)
    else:
        Z0 = max(_num(p, 'Z0Z1', 1), 1e-9) * Z1
        R0, X0 = Z0 * c0 + 3 * max(_num(p, 'Rn', 0), 0.0), Z0 * s0
    neut = 'iso' if mode == 'iso' else (p.get('neut') if p.get('neut') in ('gnd', 'z', 'iso', 'pin') else 'gnd')
    E = (1.0 if p.get('emf') == 'un' else cf) * Un / SQ3
    return {'Un': Un, 'cf': cf, 'Sk': Sk, 'R1': R1, 'X1': X1, 'R0': R0, 'X0': X0, 'E': E, 'neut': neut,
            'Zn': complex(max(_num(p, 'Rng', 0), 0.0), max(_num(p, 'Xng', 0), 0.0)) if neut == 'z' else 0j}


def _line_data(p):
    """R₁, X₁, B₁, R₀, X₀, B₀ of a LINE3 in Ω and S (netlib.js lineData: pu on S_b and U_n when unit = 'pu')."""
    Un = max(_num(p, 'Un', 150e3), 1e-9)
    k = Un * Un / max(_num(p, 'Sb', 100e6), 1e-9) if p.get('unit') == 'pu' else 1.0
    R1, X1, B1 = max(_num(p, 'R1'), 0.0) * k, max(_num(p, 'X1'), 1e-9) * k, max(_num(p, 'B1'), 0.0) / k
    g = p.get('z0') == 'given'
    R0, X0, B0 = (max(_num(p, 'R0'), 0.0) * k, max(_num(p, 'X0'), 1e-9) * k, max(_num(p, 'B0'), 0.0) / k) if g else (R1, X1, B1)
    return {'Un': Un, 'R1': R1, 'X1': X1, 'B1': B1, 'R0': R0, 'X0': X0, 'B0': B0, 'tl': p.get('model') == 'tl' and not g}


def _xf_data(p):
    """The data of an XF3 (netlib.js xfData) in per unit of S_n and the windings: the leakage z_k, the share of side 1, the
    magnetizing x_m and its place, the iron losses g_fe at side 1, the tap, the group."""
    grp = p.get('grp') if p.get('grp') in GROUPS else 'Dyn11'
    U1, U2, Sn = max(_num(p, 'U1', 150e3), 1e-9), max(_num(p, 'U2', 20e3), 1e-9), max(_num(p, 'Sn', 40e6), 1e-9)
    t = _num(p, 'tap', 0.0) / 100
    uk, Pk, i0, P0 = max(_num(p, 'uk', 10), 0.0) / 100, max(_num(p, 'Pk', 0), 0.0), max(_num(p, 'i0', 0.5), 0.0), max(_num(p, 'P0', 0), 0.0)
    rk = Pk / Sn
    xk = math.sqrt(max(uk * uk - rk * rk, 0.0))
    sh = min(max(_num(p, 'xs1', 50), 0.0), 100.0) / 100
    return {'grp': grp, 'G': GROUPS[grp], 'U1': U1, 'U2': U2, 'Sn': Sn, 'tap': t, 'Uw1': U1 * (1 + t), 'uk': uk, 'rk': rk, 'xk': xk, 'sh': sh,
            'xm': 100 / i0 if i0 > 0 else 1e6, 'gfe': P0 / Sn, 'mpos': p.get('mpos') if p.get('mpos') in ('w1', 'w2') else 'mid', 'Pk': Pk}


def _zser_z(p, w):
    """The impedance of a ZSER3 at ω (netlib.js zserDef): R_s + jωL_s in series with (R_p1 + jωL_p) ∥ R_p2."""
    Rs, Ls, Rp1, Lp, Rp2 = (max(_num(p, k, d), 0.0) for k, d in (('Rs', 1), ('Ls', 0), ('Rp1', 0), ('Lp', 0.1), ('Rp2', 0)))
    z = complex(Rs, w * Ls)
    if Lp > 0 or Rp1 > 0 or Rp2 > 0:
        y = (1 / complex(Rp1, w * Lp) if (Lp > 0 or Rp1 > 0) else 0) + (1 / Rp2 if Rp2 > 0 else 0)
        z += 1 / y
    return z


def _eng(v, d=float('nan')):
    """A number as the app writes it (parts.js parseEng): «20k», «2.2e5», «0,5»."""
    if isinstance(v, (int, float)):
        return float(v)
    t = str(v if v is not None else '').strip().replace(',', '.', 1).replace(' ', '')
    import re
    m = re.match(r'^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)([GMkKmuμµnp]?)[A-Za-zΩ°]*$', t)
    if not m:
        return float(d)
    return float(m.group(1)) * (PFX[m.group(2)] if m.group(2) else 1.0)


def _list(v, n, d):
    """n numbers of a list with «;» (netlib.js eqvData list): a missing or bad one is d."""
    a = [_eng(x.strip()) for x in str(v if v is not None else '').split(';') if x.strip()]
    return [a[k] if k < len(a) and math.isfinite(a[k]) else float(d) for k in range(n)]


def _rows(v):
    """The rows of a table as the app writes it («;» or new lines between rows, «,» or spaces between the numbers)."""
    import re
    return [[_eng(x) for x in re.split(r'[,\s]+', r.strip()) if x] for r in re.split(r'[;\n]+', str(v or '')) if r.strip()]


# ---------------------------------------------------------------- 5.0.12: the line from geometry
def _clarke(M):
    """The built-in T_i of a continuously transposed line of M conductors (parts.js clarkeTi)."""
    T = np.zeros((M, M))
    for r in range(M):
        for c in range(M):
            if c == 0:
                T[r, c] = 1 / math.sqrt(M)
            else:
                j = c + 1
                dd = math.sqrt(j * (j - 1))
                T[r, c] = 1 / dd if r < c else (-(j - 1) / dd if r == c else 0.0)
    return T


def _tlm_zy(p, f):
    """Z′ (Ω/m), Y′ (S/m) of the phases of a TLM at f and its length (m): from the geometry (pcl.lineconst.phase_matrices,
    with the transposition and the reduction of the data), or from the data per mode (src 'modal', parts.js tlcpModel):
    Z′ = T_i⁻ᵀ·diag(R′ + jωL′)·T_i⁻¹, Y′ = T_i·diag(jωC′)·T_iᵀ (i = T_i·i_mode, v_mode = T_iᵀ·v)."""
    w = 2 * math.pi * f
    if p.get('src') == 'modal':
        M = max(1, min(12, int(round(_eng(p.get('nph'), 3)))))
        u = 1000.0 if (p.get('lu') or 'km') == 'km' else 1.0
        n = _eng(p.get('mlen'), 100)
        if not n > 0:
            raise ModelError('το μήκος πρέπει να είναι θετικό')
        rows = _rows(p.get('mdata'))
        tr = p.get('transp') != '0' or M == 1
        need = 1 if M == 1 else (2 if tr else M)
        if len(rows) != need or any(len(r) != 3 or not all(math.isfinite(x) for x in r) for r in rows):
            raise ModelError(f'τα δεδομένα ανά ρυθμό θέλουν {need} γραμμές με τρεις αριθμούς')
        sp = p.get('mspec') if p.get('mspec') in ('zt', 'lc') else 'zv'
        z, y = [], []
        for Rp, a, b in rows:
            if sp == 'lc':
                Lp, Cp = a, b
            else:
                v = b if sp == 'zv' else n / b
                Lp, Cp = a / v, 1 / (a * v)
            z.append(complex(Rp, w * Lp))
            y.append(complex(0, w * Cp))
        if M == 1:
            T = np.ones((1, 1))
        elif tr:
            T = _clarke(M)
            z += [z[1]] * (M - 2)
            y += [y[1]] * (M - 2)
        else:
            T = np.array(_rows(p.get('mti')), float)
            if T.shape != (M, M):
                raise ModelError(f'ο T_i θέλει {M} γραμμές με {M} αριθμούς')
        Ti = np.linalg.inv(T)
        return Ti.T @ np.diag(z) @ Ti / u, T @ np.diag(y) @ T.T / u, n * u
    import json
    from . import lineconst as LC
    data = p.get('data')
    data = json.loads(data) if isinstance(data, str) else dict(data or {})
    L = _eng(p.get('len'), 100)
    if not L > 0:
        raise ModelError('το μήκος πρέπει να είναι θετικό')
    # the T_i «balanced» or «double circuit» of the model averages the matrices (pcl.lineconst.line_zy): the line as the solver has it
    ti = p.get('ti') if p.get('model') not in ('pi', 'wb') else None
    Z, Y = LC.line_zy(data, f, ti) if ti in ('balanced', 'double') else LC.phase_matrices(data, f)
    return Z, Y, L * 1000.0


def _tlm(p, f):
    """A TLM at f in symmetrical components: the exact π of its phases (Y_series = −Y_m, Y_shunt = Y_s + Y_m, pcl.lineconst
    line_admittance) in the positive sequence, Z′·ℓ in the positive and the zero sequence (IEC 60909-0), and how much the
    sequences are coupled (0 for a balanced line)."""
    from . import lineconst as LC
    Z, Y, L = _tlm_zy(p, f)
    if Z.shape != (3, 3):
        raise ModelError(f'{len(Z)} φάσεις: μόνο τρεις')
    Yn = LC.line_admittance(Z, Y, L)
    ser, sh = LC.to_sym(-Yn[:3, 3:]), LC.to_sym(Yn[:3, :3] + Yn[:3, 3:])
    Zs = LC.to_sym(Z) * L
    off = max(abs(ser[i, j]) for i in range(3) for j in range(3) if i != j and 1 in (i, j)) / abs(ser[1, 1])
    return {'y1': complex(ser[1, 1]), 'ysh1': complex(sh[1, 1]), 'Z1': complex(Zs[1, 1]), 'Z0': complex(Zs[0, 0]), 'coupling': float(off)}


# ---------------------------------------------------------------- 5.0.12: the equivalent of a network
def _eqv(p, w_used):
    """An EQV3 (netlib.js eqvData, eqvDef, eqvFoster, eqvFdne) at ω = w_used as single branches of the positive and the zero
    sequence, in S: {(u, v): [y₁, y₀]} between the nodes ('E', k) (the source of port k), ('V', k) (port k) and the earth
    (v None); with N, U_n, E, θ of the ports. The inductances and the capacitances of the part are its X at its own f."""
    N = max(1, min(32, len([x for x in str(p.get('Un') if p.get('Un') is not None else '150e3').split(';') if x.strip()]) or 1))
    fq = max(_eng(p.get('f'), 50), 1e-9)
    weq = 2 * math.pi * fq
    r = w_used / weq                                         # the reactances of the part are at its own f
    Sb = max(_eng(p.get('Sb'), 100e6), 1e-9)
    Un = [max(v, 1e-9) for v in _list(p.get('Un'), N, 150e3)]
    E, ang = _list(p.get('E'), N, 1), _list(p.get('ang'), N, 0)
    Rs, C = [max(v, 0.0) for v in _list(p.get('Rs'), N, 0)], [max(v, 0.0) for v in _list(p.get('C'), N, 0)]
    br = {}

    def put(u, v, y1, y0):
        q = br.setdefault((u, v), [0j, 0j])
        q[0] += y1
        q[1] += y0
    fig = p.get('fig') if p.get('fig') in ('15a', 'fdne', '15b', '15c') else '50'
    if fig == '15a':
        if N != 1:
            raise ModelError('το Σχ. 15a είναι για μία θύρα')
        rows = _rows(p.get('F'))
        if not rows or any(len(x) != 8 or not all(math.isfinite(v) and v >= 0 for v in x) or not (x[0] > 0 and x[2] > 0) for x in rows):
            raise ModelError('κάθε κλάδος Foster θέλει 8 μη αρνητικούς αριθμούς, με L₁, L₀ > 0')
        z = [0j, 0j]
        for L1, R1, L0, R0, Cb, R2, P1, P0 in rows:
            m, pm = max(R1, R0), max(P1, P0)
            for k, (L, R, Pp) in enumerate(((L1, R1, P1), (L0, R0, P0))):
                y = 1 / complex(max(R, 1e-9 * m) if m > 0 else 0.0, w_used * L)
                if Cb > 0:
                    y += 1 / complex(R2, -1 / (w_used * Cb))
                if pm > 0:
                    y += 1 / (Pp if Pp > 0 else 1e6 * pm)
                z[k] += 1 / y
        put(('E', 0), ('V', 0), 1 / z[0], 1 / z[1])
    elif fig == 'fdne':
        m = N * (N + 1) // 2
        rows = _rows(p.get('FD'))
        if not rows or any(len(x) != 4 + m or not all(math.isfinite(v) for v in x) or x[0] not in (0, 1, 2, 3, 4) or x[1] not in (0, 1)
                           or (x[0] > 0 and not x[2] > 0) or (x[0] in (2, 3) and not x[3] > 0) for x in rows):
            raise ModelError(f'κάθε όρος του FDNE θέλει {4 + m} αριθμούς')
        jw = 1j * w_used
        for x in rows:
            kind, sq, P, Q = int(x[0]), int(x[1]), x[2] * weq, x[3] * weq * weq
            sc = weq if 1 <= kind <= 3 else 1.0
            Cm = np.zeros((N, N))
            o = 4
            for i in range(N):
                for j in range(i, N):
                    Cm[i, j] = Cm[j, i] = x[o] * sc * Sb / (Un[i] * Un[j])
                    o += 1
            b = {0: 1.0, 1: 1 / (P + jw), 2: 1 / (2 * P + jw + Q / jw), 3: 1 / (jw + Q / (jw + 2 * P)), 4: jw / (jw + P)}[kind]
            for k in range(N):
                y = Cm[k].sum() * b
                put(('E', k), ('V', k), y if sq == 1 else 0j, y if sq == 0 else 0j)
            for i in range(N):
                for j in range(i + 1, N):
                    y = -Cm[i, j] * b
                    put(('V', i), ('V', j), y if sq == 1 else 0j, y if sq == 0 else 0j)
    else:
        mats = {}
        for k in ('R1', 'X1', 'R0', 'X0'):
            a = _rows(p.get(k) if p.get(k) is not None else {'R1': '0.002', 'X1': '0.05', 'R0': '0.004', 'X0': '0.15'}[k])
            if len(a) != N or any(len(x) != N or not all(math.isfinite(v) for v in x) for x in a):
                raise ModelError(f'ο πίνακας {k} πρέπει να είναι {N}×{N}')
            mats[k] = np.array(a, float)
        zb = np.outer(Un, Un) / Sb
        Y1 = np.linalg.inv((mats['R1'] + 1j * r * mats['X1']) * zb)
        Y0 = np.linalg.inv((mats['R0'] + 1j * r * mats['X0']) * zb)
        for i in range(N):
            for j in range(N):
                put(('E', i), ('V', j), Y1[i, j], Y0[i, j])
                if j > i:
                    put(('E', i), ('E', j), -Y1[i, j], -Y0[i, j])
                    put(('V', i), ('V', j), -Y1[i, j], -Y0[i, j])
        for k in range(N):
            if fig == '15c' and Rs[k] > 0:
                put(('E', k), ('V', k), 1 / Rs[k], 1 / Rs[k])
            if fig == '15b' and Rs[k] > 0 and C[k] > 0:
                y = 1 / complex(Rs[k], -1 / (w_used * C[k]))
                put(('V', k), None, y, y)
    return {'N': N, 'Un': Un, 'E': E, 'ang': ang, 'fig': fig, 'branches': br}


def _nodal(br, nodes, U, S_base, seq):
    """The nodal admittance in per unit (the bases U of the nodes, line to line) of single branches in S: a branch y between
    u and v adds y·U_u²/S_b, y·U_v²/S_b on the diagonal and −y·U_u·U_v/S_b off it; one to the earth only on the diagonal.
    Nodes outside `nodes` (the sources in the short circuit) are the earth."""
    ix = {n: i for i, n in enumerate(nodes)}
    A = np.zeros((len(nodes), len(nodes)), complex)
    for (u, v), ys in br.items():
        y = ys[seq]
        if y == 0:
            continue
        iu, iv = ix.get(u), ix.get(v)
        if iu is not None:
            A[iu, iu] += y * U[iu] ** 2 / S_base
        if iv is not None:
            A[iv, iv] += y * U[iv] ** 2 / S_base
        if iu is not None and iv is not None:
            A[iu, iv] -= y * U[iu] * U[iv] / S_base
            A[iv, iu] -= y * U[iu] * U[iv] / S_base
    return A


def _pieces(A, tol=1e-12):
    """A symmetric nodal admittance as branches (−A_pq between p and q) and shunts (the row sums), in per unit; what is
    below tol of the largest entry of its row is left out."""
    n = len(A)
    out = []
    for i in range(n):
        big = max(abs(A[i]).max(), 1e-300)
        for j in range(i + 1, n):
            if abs(A[i, j]) > tol * big:
                out.append((i, j, -A[i, j]))
        s = A[i].sum()
        if abs(s) > tol * big:
            out.append((i, None, s))
    return out


def _gen_xd2(p):
    """x″d of a GEN3: the given one, or from the circuit of the rotor (data «circ»): X_l + (1/X_ad + 1/X_fd + 1/X_kd)⁻¹."""
    if p.get('data') != 'circ':
        return max(_num(p, 'Xdpp', 0.23), 1e-6)
    inv = 1 / max(_num(p, 'cXad', 1.66), 1e-9) + 1 / max(_num(p, 'cXfd', 0.062), 1e-9)
    if _num(p, 'cRkd', 0.0041) > 0 and _num(p, 'cXkd', 0.0055) > 0:
        inv += 1 / _num(p, 'cXkd', 0.0055)
    return max(_num(p, 'Xl', 0.15), 0.0) + 1 / inv


# ---------------------------------------------------------------- what a study takes in: the buses that a source reaches
def _sources(e, study):
    p, t = e['params'], e['type']
    if t == 'GEN3':
        return study == 'sc' or p.get('init') != 'zero'
    if t == 'VAC3':
        return p.get('seq', 'abc') == 'abc' and (study == 'pf' or _num(p, 'Rs') > 0 or _num(p, 'Ls') > 0)
    return t in ('GRID3', 'EQV3')


def _reached(m, study, bad=()):
    adj = {b['id']: set() for b in m['buses']}
    for e in m['elements']:
        if e['type'] in SERIES and len(e['buses']) == 2 and str(e['id']) not in bad:
            a, b = e['buses']
            adj.setdefault(a, set()).add(b)
            adj.setdefault(b, set()).add(a)
    seen = set()
    todo = [b for e in m['elements'] if _sources(e, study) and str(e['id']) not in bad for b in e['buses']]
    while todo:
        b = todo.pop()
        if b in seen:
            continue
        seen.add(b)
        todo.extend(adj.get(b, ()))
    return seen


# ---------------------------------------------------------------- the network
def network(m, study='pf', fe=None, S_base=100e6):
    """The network of the model for a study: 'pf' (the load flow as the EMT start) or 'sc' (IEC 60909-0).
    fe ('pf'): the frequency of the reactances, as the EMT start with the trapezoidal rule takes them, ω_e = (2/h)·tan(ωh/2)
    (None: the frequency of the drawing). Returns (net, info): info['elements'] the ids of the drawing → the names of the
    network's elements, info['helpers'] the buses of the network that the drawing does not have (the EMF behind a GRID3 or a
    VAC3), info['out'] the buses that no source reaches, info['notes'] what the translation left out or changed."""
    m = _check(m)
    if study not in STUDIES:
        raise ModelError(f'study: {", ".join(STUDIES)}')
    f = float(m.get('f') or 50)
    w = 2 * math.pi * f
    kx = (float(fe) / f) if fe else 1.0
    net = N.Network(f=f, S_base=S_base, name=m.get('name') or 'σχέδιο')
    notes, out, els, helpers, shunts, eqv = [], [], {}, {}, {}, {}
    # 5.0.12: the data of the lines from geometry and of the equivalents first, so that a part whose data do not read is out
    # of the topology too
    prep, bad = {}, set()
    for e in m['elements']:
        eid = str(e['id'])
        try:
            if e['type'] == 'TLM':
                prep[eid] = _tlm(e['params'], f)
            elif e['type'] == 'EQV3':
                prep[eid] = _eqv(e['params'], w * (kx if study == 'pf' else 1.0))
                if len(e['buses']) != prep[eid]['N']:
                    raise ModelError('οι θύρες δεν είναι όσες οι ζυγοί')
        except Exception as x:                               # the reader of the data says why (LineError, ModelError, numpy)
            bad.add(eid)
            notes.append(f'{e.get("label") or eid}: τα δεδομένα δεν διαβάζονται ({x}): εκτός μελέτης.')
    reached = _reached(m, study, bad)
    labels = {b['id']: b.get('label') or b['id'] for b in m['buses']}
    for b in m['buses']:
        if b['id'] in reached:
            net.bus(b['id'], float(b['Un']), label=b.get('label') if b.get('label') and b.get('label') != b['id'] else None)
        else:
            out.append(b['id'])
    if out:
        notes.append('Ζυγοί χωρίς πηγή, εκτός μελέτης: ' + ', '.join(labels[b] for b in out[:12]) + ('…' if len(out) > 12 else '') + '.')

    def lab(e):
        return e.get('label') or e['id']

    def Ub(b):
        return net.buses[b]['Un']

    def pu(z, b):
        return z / (Ub(b) ** 2 / S_base)

    def shunt(eid, b, y_pu, name):
        """A shunt admittance y (pu on S_base and the bus) as a pcl.network shunt (its power at V = 1 pu)."""
        S = np.conj(y_pu) * S_base                          # consumed at |V| = 1 pu: P + jQ (Q > 0 absorbs)
        net.shunt(b, P=float(S.real), Q=float(S.imag), name=name)
        shunts.setdefault(eid, []).append((name, b, complex(y_pu)))

    def slack(eid, b, V, ang, what):
        bb = net.buses[b]
        if bb['type'] == 'slack':
            if abs(bb['V'] - V) > 1e-9 or abs(bb['angle'] - ang) > 1e-9:
                notes.append(f'{what}: στον ζυγό {labels.get(b, b)} υπάρχει ήδη πηγή με άλλη τάση· κρατήθηκε η πρώτη.')
            return False
        bb.update(type='slack', V=float(V), angle=float(ang))
        return True

    for e in m['elements']:
        t, p, bs, eid = e['type'], e['params'], [str(x) for x in e['buses']], str(e['id'])
        if any(b not in net.buses for b in bs) or eid in bad:
            continue
        names = []
        if t == 'GEN3':
            b = bs[0]
            xd2, cosr = _gen_xd2(p), min(max(_num(p, 'cosr', 0.85), 0.05), 1.0)
            if study == 'pf':
                if p.get('init') == 'zero':
                    notes.append(f'{lab(e)}: ξεκινά από το μηδέν (όχι από τη ροή φορτίου), άρα δεν είναι πηγή στη ροή φορτίου.')
                    continue
                V, ang = _num(p, 'V0', 1.0) * _num(p, 'Un', 13.8e3) / Ub(b), _num(p, 'ang0', 0.0)
                first = slack(eid, b, V, ang, lab(e))           # a second source on the bus gives what the first leaves
                names.append(net.generator(b, Sr=_num(p, 'Sn', 100e6), Ur=_num(p, 'Un', 13.8e3), xd2=xd2, cosphi=cosr,
                                           V=V if first else None, slack=first, name=eid))
            else:
                neut = p.get('neut') if p.get('neut') in ('gnd', 'z', 'iso', 'pin') else 'gnd'
                if neut in ('z', 'pin'):
                    notes.append(f'{lab(e)}: ο ουδέτερος {"μέσω Z_n" if neut == "z" else "σε ακροδέκτη"} δεν μπαίνει ακόμη στη μηδενική ακολουθία: γειωμένος στερεά.')
                names.append(net.generator(b, Sr=_num(p, 'Sn', 100e6), Ur=_num(p, 'Un', 13.8e3), xd2=xd2, cosphi=cosr,
                                           X0=max(_num(p, 'X0', 0.15), 1e-6), earthed=neut != 'iso', name=eid))
        elif t in ('GRID3', 'VAC3'):
            b = bs[0]
            if t == 'GRID3':
                g = _grid_z(p)
                z = complex(g['R1'], g['X1'])
                E, ang = g['E'], _num(p, 'phase', 0.0)
            else:
                if p.get('seq', 'abc') != 'abc':
                    notes.append(f'{lab(e)}: πηγή με διαδοχή a → c → b (αρνητική ακολουθία): εκτός μελέτης.')
                    continue
                z = complex(_num(p, 'Rs'), w * _num(p, 'Ls'))
                E, ang = _num(p, 'Vpk', 325) / math.sqrt(2), _num(p, 'phase', 0.0)
            if study == 'pf':
                zz = complex(z.real, z.imag * kx)
                Vpu = E * SQ3 / Ub(b)
                if abs(zz) <= 0:
                    first = slack(eid, b, Vpu, ang, lab(e))
                    names.append(net.feeder(b, Sk=None, V=Vpu, angle=ang, slack=first, name=eid))
                else:
                    h = f'{eid}~E'
                    net.bus(h, Ub(b), kind='slack', V=Vpu, angle=ang, label=f'E {lab(e)}')
                    helpers[h] = eid
                    names.append(net.feeder(h, Sk=None, V=Vpu, angle=ang, slack=True, name=eid))
                    zp = pu(zz, b)
                    names.append(net.branch_pu(h, b, zp.real, zp.imag, name=f'{eid}~Z'))
            elif t == 'GRID3':
                X0X = None if g['neut'] in ('iso', 'pin') else (g['X0'] + 3 * g['Zn'].imag) / g['X1'] if g['X1'] > 0 else None
                R0X0 = None if X0X is None else (g['R0'] + 3 * g['Zn'].real) / max(g['X0'] + 3 * g['Zn'].imag, 1e-12)
                if g['neut'] == 'pin':
                    notes.append(f'{lab(e)}: ουδέτερος σε ακροδέκτη: στη μηδενική ακολουθία ως μονωμένος.')
                # Z_Q = c·U_n²/S″k with the c of the part: the feeder takes the c of Table 1, so S″k goes over as S″k·c_T1/c
                # (Network.feeder(c=…) takes the key c for a bus in Network._add)
                Sk = g['Sk'] * N.c_factor(g['Un'], 'max') / g['cf']
                names.append(net.feeder(b, Sk=Sk, RX=g['R1'] / g['X1'] if g['X1'] > 0 else 1e3, X0X=X0X, R0X0=R0X0, Un=g['Un'], name=eid))
            else:
                if abs(z) <= 0:
                    notes.append(f'{lab(e)}: ιδανική πηγή (R_s = L_s = 0), άπειρο ρεύμα βραχυκύκλωσης: εκτός του IEC 60909.')
                    continue
                X0X = 1.0 if p.get('neut') == 'gnd' else None
                cT = N.c_factor(Ub(b), 'max')
                names.append(net.feeder(b, Sk=cT * Ub(b) ** 2 / abs(z), RX=z.real / z.imag if z.imag > 0 else 1e3, X0X=X0X,
                                        R0X0=(z.real / z.imag if z.imag > 0 else 1e3) if X0X else None, name=eid))
                notes.append(f'{lab(e)}: η πηγή ως ισοδύναμο δικτύου με Z_Q = R_s + jωL_s ({abs(z):.4g} Ω).')
        elif t == 'LINE3':
            a, b = bs
            d = _line_data(p)
            if study == 'sc':
                names.append(net.line(a, b, d['R1'], d['X1'], length=1.0, R0=d['R0'], X0=d['X0'], name=eid))
            elif d['tl']:
                # the exact π of the line (the series R spread along it): Z·sinh(γℓ)/γℓ, Y·tanh(γℓ/2)/(γℓ/2)
                Z, Y = complex(d['R1'], d['X1'] * kx), 1j * d['B1'] * kx
                gl = cmath.sqrt(Z * Y)
                Zp = Z * (cmath.sinh(gl) / gl if abs(gl) > 1e-12 else 1)
                Yp = Y * (cmath.tanh(gl / 2) / (gl / 2) if abs(gl) > 1e-12 else 1)
                names.append(net.line(a, b, Zp.real, Zp.imag, length=1.0, B=0.0, name=eid))
                for x, k in ((a, 1), (b, 2)):
                    shunt(eid, x, Yp / 2 * Ub(x) ** 2 / S_base, f'{eid}~Y{k}')
                    names.append(f'{eid}~Y{k}')
            else:
                names.append(net.line(a, b, d['R1'], d['X1'] * kx, length=1.0, B=max(d['B1'], d['B0']) * kx, name=eid))
        elif t == 'TLM':
            a, b = bs
            q = prep[eid]
            if study == 'sc':
                names.append(net.line(a, b, q['Z1'].real, q['Z1'].imag, length=1.0, R0=q['Z0'].real, X0=q['Z0'].imag, name=eid))
            else:
                # the exact π at f (the EMT starts its line at ω too, not at ω_e: mna.js tlmAcY), positive sequence
                z = 1 / q['y1']
                names.append(net.line(a, b, z.real, z.imag, length=1.0, B=0.0, name=eid))
                for x, k in ((a, 1), (b, 2)):
                    shunt(eid, x, q['ysh1'] * Ub(x) ** 2 / S_base, f'{eid}~Y{k}')
                    names.append(f'{eid}~Y{k}')
                if q['coupling'] > 1e-3:
                    notes.append(f'{lab(e)}: γραμμή χωρίς μετάθεση· οι ακολουθίες συζεύγνυνται ως {100 * q["coupling"]:.2g} % της θετικής, '
                                 'και η ροή φορτίου κρατά μόνο τη θετική.')
        elif t == 'EQV3':
            names += _eqv_net(net, e, prep[eid], bs, study, S_base, notes, helpers, shunt, eqv)
        elif t == 'XF3':
            a, b = bs
            d = _xf_data(p)
            if study == 'sc':
                names.append(_xf_sc(net, e, d, a, b, notes))
            else:
                names += _xf_pf(net, e, d, a, b, kx, S_base, shunt)
        elif t == 'ZSER3':
            a, b = bs
            z = _zser_z(p, w * kx)
            if abs(z) <= 0:
                notes.append(f'{lab(e)}: μηδενική εμπέδηση: εκτός μελέτης (ένωσε τους δύο ζυγούς).')
                continue
            if study == 'pf':
                zp = pu(z, a)
                names.append(net.branch_pu(a, b, zp.real, zp.imag, name=eid))
            else:
                names.append(net.reactor(a, z.imag, z.real, b=b, X0=z.imag, R0=z.real, name=eid))
        elif t == 'LOAD3':
            b = bs[0]
            k = Ub(b) / max(_num(p, 'Un', 20e3), 1e-9)
            P0, Q0 = _num(p, 'P', 10e6), _num(p, 'Q', 3e6)
            if p.get('model') == 'zip':
                cz, ci, cp = max(_num(p, 'kz'), 0.0) / 100 * k * k, max(_num(p, 'ki'), 0.0) / 100 * k, max(_num(p, 'kp', 100), 0.0) / 100
            else:
                cz, ci, cp = k * k, 0.0, 0.0
            s = cz + ci + cp
            if s <= 0 or (P0 == 0 and Q0 == 0):
                continue
            if kx != 1 and cz > 0 and study == 'pf':
                # the constant-impedance part is R ∥ L (or C) in the EMT: its Q at ω_e is Q·ω/ω_e (an inductor) or Q·ω_e/ω (a capacitor)
                Qz = Q0 * cz * (1 / kx if Q0 > 0 else kx)
                Q0 = (Qz + Q0 * (ci + cp)) / s
            names.append(net.load(b, P0 * s, Q0 * s, zip=(cz / s, ci / s, cp / s), name=eid))
        elif t == 'FLT3':
            if study == 'pf' and p.get('ctl') != 'sig' and _num(p, 'ton', 0.04) <= 0:
                notes.append(f'{lab(e)}: το σφάλμα υπάρχει από το t = 0· η ροή φορτίου είναι χωρίς αυτό.')
        if names:
            els[eid] = names
    coupling = {k: v['coupling'] for k, v in prep.items() if 'coupling' in v}
    return net, {'study': study, 'elements': els, 'helpers': helpers, 'shunts': shunts, 'eqv': eqv, 'coupling': coupling, 'out': out,
                 'notes': notes, 'fe': fe}


def _eqv_net(net, e, q, bs, study, S_base, notes, helpers, shunt, eqv):
    """An EQV3 in the network. 'pf': a bus of its own for the source of each port (|E_k|·U_n,k/U_b∠θ_k, a reference bus, as
    the source behind a GRID3), and the nodal admittance of the sources and the ports in the positive sequence as branches and
    shunts in per unit (the bases of the buses: a branch between two levels needs no ratio, its shunts carry the difference).
    'sc': the sources short-circuited, the ports with the positive and the zero sequence as reactors (series and to the earth),
    without a correction factor (the equivalent is passive impedances, not a network feeder of IEC 60909-0)."""
    eid, N = str(e['id']), q['N']
    names = []
    U = [net.buses[b]['Un'] for b in bs]
    if study == 'pf':
        hs = []
        for k in range(N):
            h = f'{eid}~E{k + 1}'
            Vpu = q['E'][k] * q['Un'][k] / U[k]
            net.bus(h, U[k], kind='slack', V=Vpu, angle=q['ang'][k], label=f'E{k + 1} {e.get("label") or eid}')
            helpers[h] = eid
            names.append(net.feeder(h, Sk=None, V=Vpu, angle=q['ang'][k], slack=True, name=f'{eid}~S{k + 1}'))
            hs.append(h)
        nodes = [('E', k) for k in range(N)] + [('V', k) for k in range(N)]
        A = _nodal(q['branches'], nodes, U + U, S_base, 0)
        where = hs + list(bs)
        for i, j, y in _pieces(A):
            nm = f'{eid}~{i + 1}' + (f'-{j + 1}' if j is not None else '')
            if j is None:
                shunt(eid, where[i], y, nm)
            else:
                z = 1 / y
                net.branch_pu(where[i], where[j], z.real, z.imag, name=nm)
            names.append(nm)
        eqv[eid] = {'nodes': where, 'A': A, 'ports': list(bs)}
    else:
        nodes = [('V', k) for k in range(N)]
        A1, A0 = _nodal(q['branches'], nodes, U, S_base, 0), _nodal(q['branches'], nodes, U, S_base, 1)
        pieces = {}
        for A, sq in ((A1, 0), (A0, 1)):
            for i, j, y in _pieces(A):
                pieces.setdefault((i, j), [0j, 0j])[sq] = y
        for (i, j), (y1, y0) in pieces.items():
            zb = U[i] ** 2 / S_base
            z1 = zb / y1 if y1 != 0 else complex(0, 1e12)
            z0 = zb / y0 if y0 != 0 else complex(0, 1e12)
            nm = f'{eid}~{i + 1}' + (f'-{j + 1}' if j is not None else '')
            names.append(net.reactor(bs[i], z1.imag, z1.real, b=None if j is None else bs[j], X0=z0.imag, R0=z0.real, name=nm))
        notes.append(f'{e.get("label") or eid}: το ισοδύναμο ως παθητικές εμπεδήσεις ανάμεσα στις θύρες και στη γη (οι πηγές του '
                     'βραχυκυκλωμένες), χωρίς συντελεστή διόρθωσης.')
    return names


def _xf_pf(net, e, d, a, b, kx, S_base, shunt):
    """An XF3 for the load flow, as its three single-phase units (netlib.js xfDef): side 1 → R_k/2 + j·s·x_k → the magnetizing
    branch (at the middle, or at a side) → R_k/2 + j·(1 − s)·x_k → the ideal ratio and the shift of the group → side 2, and the
    iron losses at side 1. In per unit of the windings (side 1 at U₁·(1 + tap), side 2 at U₂); the T made a π (the series branch with
    the ratio at side 1 and two shunts), so the network needs no bus of its own for the middle."""
    eid, Sn = str(e['id']), d['Sn']
    Ua, Ubb = net.buses[a]['Un'], net.buses[b]['Un']
    z1 = complex(d['rk'] / 2, d['xk'] * d['sh'] * kx)
    z2 = complex(d['rk'] / 2, d['xk'] * (1 - d['sh']) * kx)
    ym = 1 / complex(0, d['xm'] * kx)
    # the winding base of side 2 is U₂; the ideal transformer at side 1 carries U_w1/U_a over U₂/U_b and the shift of the group
    shift = 30.0 * d['G'][4]
    tau = (d['Uw1'] / Ua) / (d['U2'] / Ubb)
    # per unit of S_base and the bus of side 2 (the side of the series branch); r² = (U₂/U_b)²
    r2 = (d['U2'] / Ubb) ** 2
    to_b = r2 * S_base / Sn
    if d['mpos'] == 'mid':
        Z = z1 + z2 + z1 * z2 * ym
        YA, YB = z2 * ym / Z, z1 * ym / Z
    else:
        Z, YA, YB = z1 + z2, (ym if d['mpos'] == 'w1' else 0), (ym if d['mpos'] == 'w2' else 0)
    Zs = Z * to_b
    names = [net.branch_pu(a, b, Zs.real, Zs.imag, ratio=tau, angle=shift, name=eid)]
    # the shunt at the inner node of side 1 (winding base) seen from bus a: Y/|τ|² in the base of bus a; the iron losses at side 1
    ya = (YA / to_b) / tau ** 2 + d['gfe'] * Sn / S_base * (Ua / d['Uw1']) ** 2
    if abs(ya) > 0:
        shunt(eid, a, ya, f'{eid}~Y1')
        names.append(f'{eid}~Y1')
    if abs(YB) > 0:
        shunt(eid, b, YB / to_b, f'{eid}~Y2')
        names.append(f'{eid}~Y2')
    return names


def _xf_sc(net, e, d, a, b, notes):
    """An XF3 as a transformer of IEC 60909-0: the HV side first; the group with the earthing of its star points (the neutral
    options of the part), the neutral impedances, the tap at the HV side."""
    p = e['params']
    c1, c2, g1, g2, n = d['G']

    def side(k, conn, grounded):
        if conn == 'D':
            return 'D', 0j
        m = p.get(f'neut{k}') if p.get(f'neut{k}') in ('gnd', 'z', 'iso', 'pin', 'auto') else 'auto'
        if m == 'pin':
            notes.append(f'{e.get("label") or e["id"]}: ουδέτερος της πλευράς {k} σε ακροδέκτη: στη μηδενική ακολουθία ως μονωμένος.')
        earthed = grounded if m == 'auto' else m in ('gnd', 'z')
        zn = complex(max(_num(p, f'Rng{k}'), 0.0), max(_num(p, f'Xng{k}'), 0.0)) if m == 'z' else 0j
        return ('YN' if earthed else 'Y'), zn
    s1, zn1 = side(1, c1, g1)
    s2, zn2 = side(2, c2, g2)
    if p.get('core') == '3leg' and ('YN' in (s1, s2)):
        notes.append(f'{e.get("label") or e["id"]}: πυρήνας τριών σκελών: στη μηδενική ακολουθία ως τρεις μονοφασικοί (X₀/X = 1).')
    if d['U1'] >= d['U2']:
        hv, lv, Uhv, Ulv, gh, gl, nh, zh, zl, tap = a, b, d['U1'], d['U2'], s1, s2, n, zn1, zn2, 100 * d['tap']
    else:
        hv, lv, Uhv, Ulv, gh, gl, nh, zh, zl = b, a, d['U2'], d['U1'], s2, s1, (12 - n) % 12, zn2, zn1
        tap = 100 * (1 / (1 + d['tap']) - 1)
    group = gh.upper() + gl.lower() + str(nh)
    return net.transformer(hv, lv, d['Sn'], Uhv, Ulv, 100 * d['uk'], 100 * d['rk'], group=group, Zn_hv=zh, Zn_lv=zl, tap=tap, name=str(e['id']))


# ---------------------------------------------------------------- the studies, by the ids of the drawing
def _bus_out(m, info):
    return {b['id']: {'label': b.get('label') or b['id'], 'Un': b.get('Un')} for b in m['buses'] if b['id'] not in info['out']}


def elements_of(m, net, info, r):
    """The results of a load flow of the drawing's network by the ids of the drawing: GEN3, GRID3, VAC3: P, Q they give to their bus
    (and Pe, Qe at the EMF behind the impedance); LINE3, XF3, ZSER3, TLM: Pa, Qa, Pb, Qb into the part at its terminals 1 and 2 (the
    shunts of the part with them), I (A at terminal 1), loss (TLM: and coupling, how much its sequences are coupled); EQV3: P, Q it
    gives to its buses, and ports [{bus, P, Q}]; LOAD3: P, Q at its voltage; CB3: closed."""
    flows = {x['name']: x for x in r['branches']}
    V = {b: r['buses'][b]['V'] * cmath.exp(1j * math.radians(r['buses'][b]['angle'])) for b in r['buses']}
    S_b = net.S_base
    els = {}
    for e in m['elements']:
        eid, t = str(e['id']), e['type']
        if t == 'CB3':
            els[eid] = {'closed': bool(e.get('closed'))}
            continue
        if eid not in info['elements']:
            continue
        nm = info['elements'][eid]
        if t == 'EQV3':
            q = info['eqv'][eid]
            Vn = np.array([V[b] for b in q['nodes']])
            I = q['A'] @ Vn                                  # into the equivalent at each node, per unit
            n = len(q['ports'])
            S = [-(Vn[n + k] * np.conj(I[n + k])) * S_b for k in range(n)]
            els[eid] = {'P': float(sum(x.real for x in S)), 'Q': float(sum(x.imag for x in S)),
                        'ports': [{'bus': b, 'P': float(x.real), 'Q': float(x.imag)} for b, x in zip(q['ports'], S)]}
        elif t in ('GEN3', 'GRID3', 'VAC3'):
            if f'{eid}~Z' in flows:
                x = flows[f'{eid}~Z']
                els[eid] = {'P': -x['Pb'], 'Q': -x['Qb'], 'Pe': x['Pa'], 'Qe': x['Qa']}
            else:
                b = e['buses'][0]
                els[eid] = {'P': r['buses'][b]['P'], 'Q': r['buses'][b]['Q']}
                if sum(1 for q in m['elements'] if q['buses'] and q['buses'][0] == b and q['type'] in ('GEN3', 'GRID3', 'VAC3') and str(q['id']) in info['elements']) > 1:
                    els[eid]['shared'] = True
        elif t in SERIES:
            x = flows[nm[0]]
            Sa, Sb = complex(x['Pa'], x['Qa']), complex(x['Pb'], x['Qb'])
            for name, b, y in info['shunts'].get(eid, []):          # the shunts of the part at its terminals
                s = abs(V[b]) ** 2 * np.conj(y) * S_b
                if b == e['buses'][0]:
                    Sa += s
                else:
                    Sb += s
            I = abs(Sa) / (SQ3 * max(abs(V[e['buses'][0]]), 1e-12) * net.buses[e['buses'][0]]['Un'])
            els[eid] = {'Pa': Sa.real, 'Qa': Sa.imag, 'Pb': Sb.real, 'Qb': Sb.imag, 'I': I, 'loss': (Sa + Sb).real}
            if t == 'TLM':
                els[eid]['coupling'] = info['coupling'].get(eid, 0.0)
        elif t == 'LOAD3':
            ld = net.element(nm[0])
            Vm = abs(V[ld['bus']])
            k = ld['zip'][0] * Vm * Vm + ld['zip'][1] * Vm + ld['zip'][2]
            els[eid] = {'P': ld['P'] * k, 'Q': ld['Q'] * k}
    return els


def load_flow(m, fe=None, tol=1e-10, max_iter=30):
    """The load flow of the drawing, as the EMT start solves it (network(m, 'pf')). Returns {'converged', 'iterations',
    'buses': {bus id: {label, Un, V (pu), angle (deg), U (V, line)}}, 'elements': {id: …} (as elements_of), 'losses', 'out',
    'notes'}."""
    m = _check(m)
    net, info = network(m, 'pf', fe=fe)
    if not any(d['type'] == 'slack' for d in net.buses.values()):
        raise ModelError('Το σχέδιο δεν έχει πηγή για τη ροή φορτίου (GEN3 από τη ροή φορτίου, GRID3, VAC3 ή EQV3).')
    r = net.load_flow(tol=tol, max_iter=max_iter)
    buses = _bus_out(m, info)
    for b, d in buses.items():
        d.update(V=r['buses'][b]['V'], angle=r['buses'][b]['angle'], U=r['buses'][b]['V'] * net.buses[b]['Un'])
    els = elements_of(m, net, info, r)
    return {'study': 'pf', 'converged': r['converged'], 'iterations': r['iterations'], 'buses': buses, 'elements': els,
            'losses': r['losses'], 'out': info['out'], 'notes': info['notes'], 'helpers': sorted(info['helpers'])}


def _sc_at(net, b, fault, mode, **kw):
    try:
        return net.short_circuit(b, fault, mode=mode, **kw)
    except np.linalg.LinAlgError:                           # a bus without a path of the zero sequence to the earth
        return {'bus': b, 'fault': fault, 'mode': mode, 'Un': net.buses[b]['Un'], 'Ik': 0.0, 'isolated': True}


def _sc_all(net, fault='3ph', mode='max', faults=None, buses=None, **kw):
    """IEC 60909-0 at every bus of a network that is not internal (or the given ones), and at the faults of a drawing
    (faults: {id: (bus, kind of the FLT3)}). → {'fault', 'mode', 'buses': {bus: result}, 'faults': {id: …}, 'worst'}."""
    if fault not in ('3ph', '2ph', '1ph', '2phE'):
        raise ModelError("fault: '3ph', '2ph', '1ph' ή '2phE'")
    if mode not in ('max', 'min'):
        raise ModelError("mode: 'max' ή 'min'")
    out = {}
    for b in (buses or [b for b, d in net.buses.items() if d['type'] != 'internal']):
        if b in net.buses:
            out[b] = _sc_at(net, b, fault, mode, **kw)
    fl = {}
    for fid, (b, kind) in (faults or {}).items():
        if b in net.buses:
            ft = FAULTS.get(kind, '3ph')
            fl[fid] = {**_sc_at(net, b, ft, mode, **kw), 'bus': b, 'kind': kind, 'fault': ft}
    worst = max(out, key=lambda b: out[b]['Ik']) if out else None
    return {'fault': fault, 'mode': mode, 'buses': out, 'faults': fl, 'worst': worst}


def faults_of(m):
    """The faults of a drawing: {FLT3 id: (bus, kind)}."""
    return {str(e['id']): (e['buses'][0], e['params'].get('kind') or 'abc') for e in _check(m)['elements'] if e['type'] == 'FLT3'}


def short_circuit(m, fault='3ph', mode='max', buses=None, **kw):
    """IEC 60909-0 of the drawing (network(m, 'sc')) at every bus (or the given ones): {'buses': {bus id: the result of
    Network.short_circuit, with its label}, 'faults': {FLT3 id: {bus, kind, fault (the kind as a fault of IEC 60909) and the result
    there}}, 'worst', 'out', 'notes'}. fault: '3ph', '2ph', '1ph', '2phE'; mode: 'max', 'min'; the other keywords as
    Network.short_circuit."""
    m = _check(m)
    net, info = network(m, 'sc')
    if not net.buses:
        raise ModelError('Το σχέδιο δεν έχει πηγή για το βραχυκύκλωμα (GEN3, GRID3, EQV3, VAC3 με R_s ή L_s).')
    r = _sc_all(net, fault, mode, faults_of(m), buses, **kw)
    lab = {b['id']: b.get('label') or b['id'] for b in m['buses']}
    for d in r['buses'].values():
        d['label'] = lab.get(d['bus'], d['bus'])
    return {'study': 'sc', **r, 'out': info['out'], 'notes': info['notes']}


# ---------------------------------------------------------------- 5.0.13: the RMS dynamics of a drawing (ROADMAP §101 step 1)
GEN_KEYS = ('Xd', 'Xdp', 'Xdpp', 'Xq', 'Xqp', 'Xqpp', 'Xl', 'Td0p', 'Td0pp', 'Tq0p', 'Tq0pp', 'Ra', 'H', 'D')
AVR_KEYS = ('TR', 'TC', 'TB', 'TC1', 'TB1', 'KA', 'TA', 'VAMIN', 'VAMAX', 'VIMIN', 'VIMAX', 'VRMIN', 'VRMAX', 'KC', 'KLR', 'ILR', 'KF',
            'TF', 'KE', 'TE', 'AEX', 'BEX')
PSS_KEYS = ('KS', 'TW', 'T1', 'T2', 'T3', 'T4', 'VSMIN', 'VSMAX')
GOV_KEYS = ('Pr', 'R', 'KAX', 'V1', 'TSR', 'TSM', 'LC1', 'LC2', 'TCH', 'TRH', 'TCO', 'FHP', 'FIP', 'FLP', 'gFL', 'gNL', 'RP', 'RT', 'TR',
            'TP', 'KS', 'Rclose', 'Ropen', 'TG', 'Tw')


def _given(p, keys):
    """The keys of a part that hold a number (an empty text is «not given»: the default of pcl.rms)."""
    out = {}
    for k in keys:
        v = p.get(k)
        if v is None or (isinstance(v, str) and v.strip() == ''):
            continue
        try:
            out[k] = float(v)
        except (TypeError, ValueError):
            continue
    return out


def machines_of(m):
    """5.0.13: the machines of the drawing for pcl.rms.System: each GEN3 (by its id) with its data (the standard data of the part:
    X_d … T″_q0, H, D on its S_n) and the controls that drive it in the drawing (model.js ctl: the AVR, the PSS on its input, the
    GOV), in the same parameters as the EMT. 'subtransient' when the part has a damper (T″_d0 or T″_q0 > 0), else 'two_axis'.
    Returns (machines, notes)."""
    m = _check(m)
    out, notes = {}, []
    for e in m['elements']:
        if e['type'] != 'GEN3':
            continue
        p, lab = e['params'], e.get('label') or e['id']
        if p.get('init') == 'zero':
            continue
        if p.get('data') == 'circ':
            notes.append(f'{lab}: δεδομένα κυκλώματος του δρομέα: το RMS θέλει ακόμη τα τυπικά (X_d, X′_d, …)· τυπικές τιμές.')
            d = {'Sn': _num(p, 'Sn', 100e6)}
        else:
            d = {'Sn': _num(p, 'Sn', 100e6), **_given(p, GEN_KEYS)}
        if p.get('shaft') == 'multi':                       # one mass in the RMS: the sum of the inertias
            try:
                d['H'] = sum(float(x) for x in str(p.get('Hm', '')).split(';') if x.strip())
            except ValueError:
                pass
            notes.append(f'{lab}: άξονας πολλών μαζών: στο RMS μία μάζα με H = {d.get("H", 0):g} s (χωρίς τις στρεπτικές ταλαντώσεις).')
        damp = d.get('Td0pp', 0.03) > 0 or d.get('Tq0pp', 0.07) > 0
        d['model'] = 'subtransient' if damp else 'two_axis'
        c = e.get('ctl') or {}
        if c.get('avr'):
            d['avr'] = {'type': c['avr']['type'], **_given(c['avr']['params'], AVR_KEYS)}
            if 'KE' not in d['avr']:
                d['avr']['KE'] = None
            vr = c['avr']['params'].get('Vref')
            if vr not in (None, '') and str(vr).strip() != '':
                d['avr']['Vref'] = float(vr)
        if c.get('pss'):
            d['pss'] = _given(c['pss']['params'], PSS_KEYS) or True
        if c.get('gov'):
            d['gov'] = {'type': c['gov']['type'], **_given(c['gov']['params'], GOV_KEYS)}
        out[str(e['id'])] = d
    return out, notes


def _sched(v):
    """The changes of a program of values «t:v, t:v» (P.parseSched): [(t, v)] after t = 0, and the value at t = 0."""
    out, v0 = [], None
    for part in str(v or '').split(','):
        if ':' not in part:
            continue
        a, b = part.split(':', 1)
        try:
            t, x = float(a), float(b)
        except ValueError:
            continue
        if t <= 0:
            v0 = x
        else:
            out.append((t, x))
    return v0, sorted(out)


def events_of(m, net, info):
    """5.0.13: the events of the drawing for the RMS: a three-phase FLT3 (its time of start, and of clearing), the opening of a CB3
    (what is on the side that reaches the fewer parts goes out: the branches there trip, a fault there clears, a generator there
    trips), the
    program of the reference of an AVR (dV) and of a GOV (dP). Returns (events, notes)."""
    m = _check(m)
    ev, notes = [], []
    byid = {str(e['id']): e for e in m['elements']}
    case = net.case()
    branches = set(case.br_name)
    gen_ctl = {}
    for e in m['elements']:
        c = e.get('ctl') or {}
        for k in ('avr', 'gov'):
            if c.get(k):
                gen_ctl[str(c[k]['id'])] = (str(e['id']), k)
    for e in m['elements']:
        t, p, eid, lab = e['type'], e['params'], str(e['id']), e.get('label') or e['id']
        if t == 'FLT3':
            if p.get('ctl') == 'sig':
                notes.append(f'{lab}: σφάλμα από σήμα: όχι στο RMS.')
                continue
            if p.get('kind', 'abc') not in ('abc', 'abcg'):
                notes.append(f'{lab}: ασύμμετρο σφάλμα: το RMS είναι στη θετική ακολουθία (μόνο τριφασικά).')
                continue
            b = str(e['buses'][0])
            if b not in net.buses:
                continue
            z = _num(p, 'Rf', 0.0) / (net.buses[b]['Un'] ** 2 / net.S_base)
            ev.append({'t': _num(p, 'ton', 0.04), 'kind': 'fault', 'bus': b, 'z': z, 'id': eid})
            if _num(p, 'toff', 0.0) > 0:
                ev.append({'t': _num(p, 'toff', 0.0), 'kind': 'clear', 'bus': b, 'id': eid})
        elif t == 'CB3':
            if p.get('ctl') == 'sig':
                continue
            v0, ch = _sched(p.get('cmd', '0:1'))
            state = 1.0 if v0 is None else v0
            for tt, x in ch:
                if x < 0.5 <= state:
                    sides = e.get('sides') or [[], []]
                    reach = next((o['reach'] for o in e.get('opens') or [] if abs(o['t'] - tt) < 1e-9), [len(q) for q in sides])
                    if len(sides) != 2 or reach[0] == reach[1]:
                        notes.append(f'{lab}: οι δύο πλευρές του φτάνουν όσα στοιχεία η μία όσο η άλλη: το άνοιγμα δεν μπαίνει στο RMS.')
                        break
                    stub = sides[0] if reach[0] < reach[1] else sides[1]
                    if any(byid.get(str(i), {}).get('type') in ('GRID3', 'VAC3', 'EQV3') for i, _ in stub):
                        notes.append(f'{lab}: το άνοιγμα χωρίζει πηγή από το δίκτυο: όχι ακόμη στο RMS.')
                        break
                    for i, _ in stub:
                        q = byid.get(str(i))
                        if not q:
                            continue
                        if q['type'] in ('LINE3', 'XF3', 'TLM', 'ZSER3'):
                            for nm in info['elements'].get(str(i), []):
                                if nm in branches:
                                    ev.append({'t': tt, 'kind': 'trip', 'branch': nm, 'id': eid})
                        elif q['type'] == 'FLT3' and str(q['buses'][0]) in net.buses:
                            ev.append({'t': tt, 'kind': 'clear', 'bus': str(q['buses'][0]), 'id': eid})
                        elif q['type'] == 'GEN3':
                            ev.append({'t': tt, 'kind': 'gen', 'gen': str(i), 'id': eid})
                        elif q['type'] == 'LOAD3':
                            notes.append(f'{lab}: το φορτίο {q.get("label") or i} στην πλευρά που ανοίγει μένει στο RMS.')
                elif x >= 0.5 > state:
                    notes.append(f'{lab}: επανακλείσιμο στα {tt:g} s: όχι ακόμη στο RMS.')
                state = x
        elif t in ('AVR', 'GOV'):
            pass
    # the programs of the references, from the controls of each GEN3 (the parts AVR and GOV are not elements of the model)
    for e in m['elements']:
        c = e.get('ctl') or {}
        for k, key, kind in (('avr', 'dV', 'vref'), ('gov', 'dP', 'pref')):
            if c.get(k):
                v0, ch = _sched(c[k]['params'].get(key, '0'))
                if v0 not in (None, 0.0):
                    ev.append({'t': 1e-9, 'kind': kind, 'gen': str(e['id']), key: v0, 'id': str(c[k]['id'])})
                for tt, x in ch:
                    ev.append({'t': tt, 'kind': kind, 'gen': str(e['id']), key: x, 'id': str(c[k]['id'])})
    return sorted(ev, key=lambda q: q['t']), notes


def dynamic(m, t_end=5.0, events=None, loads='Z', h=0.005, record=0.01, **kw):
    """5.0.13: the RMS dynamics of a drawing (pcl.network.Network.dynamic on the network of the load flow of the drawing): the
    machines and their controls from the drawing, its events (events_of) and the events given here. Returns the result of
    Network.dynamic with 'drawing': the notes of the translation."""
    net, info = network(m, 'pf')
    mach, n1 = machines_of(m)
    ev, n2 = events_of(m, net, info)
    r = net.dynamic(t_end=t_end, events=ev + list(events or []), machines=mach, loads=loads, h=h, record=record, **kw)
    r['drawing'] = {'notes': info['notes'] + n1 + n2, 'events': ev}
    return r
