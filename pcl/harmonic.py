"""Harmonic load flow (4.19.5, ROADMAP §80, THEORY §8Ο): the voltage distortion that the harmonic currents of nonlinear loads
make in a balanced network.

- The method is the current injection of the Task Force on Harmonics Modeling and Simulation (1996, Part I): the load flow of
  the fundamental gives the current of every nonlinear load; its harmonics follow from its spectrum, scaled by the magnitude
  and shifted by the angle of that current; for every order the network is a linear circuit, Y_h·V_h = I_h.
- The network at the order h: a series branch is R + j·h·X with its charging as h·B, and a line with charging takes the
  hyperbolic corrections of the distributed-parameter line (the long-line model); a generator is its subtransient reactance,
  a feeder its short-circuit impedance; a capacitor is h·B, a tuned filter R + j(h·X − 1/(h·B)); a load is one of the
  models of the Task Force (A, B, C) from its P and Q in the load flow.
- A phase shift of a transformer turns the other way for the orders of negative sequence (3k − 1) than for those of positive
  sequence (3k + 1). The orders 3k are zero sequence in a balanced network and are left out.
- The frequency scan is the impedance seen from a bus against the order; its peaks are the parallel resonances.

Only NumPy and SciPy. Per unit on the base of the network."""
import math
import time

import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla

from . import powerflow as PF

LOAD_MODELS = ('C', 'A', 'B', 'none')
LINE_MODELS = ('distributed', 'pi')
LOAD_TXT = {'C': 'μοντέλο C: R παράλληλα με L, σε σειρά με την αυτεπαγωγή του μετασχηματιστή', 'A': 'μοντέλο A: R παράλληλα με L από τα P και Q',
            'B': 'μοντέλο B: όπως το A, με R και L διαιρεμένα με 0,1·h + 0,9', 'none': 'χωρίς τα φορτία'}
LINE_TXT = {'distributed': 'κατανεμημένες παραμέτρους (μοντέλο μακριάς γραμμής)', 'pi': 'συγκεντρωμένο ισοδύναμο π'}       # after «με»
# IEEE Std 519-2014, Table 1: the voltage distortion limits by the voltage of the bus: (up to U_n in V, each harmonic in %, THD in %)
LIMITS = ((1e3, 5.0, 8.0), (69e3, 3.0, 5.0), (161e3, 1.5, 2.5), (math.inf, 1.0, 1.5))
# Task Force on Harmonics Modeling and Simulation (1999), Table 1.4: order: (magnitude as a part of the fundamental, angle in degrees)
_HVDC = {1: (1.0, -49.56), 5: (0.1941, -67.77), 7: (0.1309, 11.90), 11: (0.0758, -7.13), 13: (0.0586, 68.57), 17: (0.0379, 46.53), 19: (0.0329, 116.46),
         23: (0.0226, 87.47), 25: (0.0241, 159.32), 29: (0.0193, 126.79)}
_TCR = {1: (1.0, 46.92), 5: (0.0702, -124.40), 7: (0.0250, -29.87), 11: (0.0136, -23.75), 13: (0.0075, 71.50), 17: (0.0062, 77.12), 19: (0.0032, 173.43),
        23: (0.0043, 178.02), 25: (0.0013, -83.45), 29: (0.0040, -80.45)}


class HarmonicError(ValueError):
    pass


def six_pulse(hmax=49):
    """The spectrum of an ideal six-pulse bridge (level direct current, instantaneous commutation, star–star transformer): the
    orders 6k ± 1 with magnitude 1/h, the orders 6k − 1 against the fundamental and the orders 6k + 1 with it:
    i = cos ωt − cos 5ωt/5 + cos 7ωt/7 − cos 11ωt/11 + cos 13ωt/13 − … (behind a star–delta transformer each pair of orders
    6k ± 1 takes the sign of (−1)^k more: that is the `delta` of a source)."""
    s = {1: (1.0, 0.0)}
    for k in range(1, int(hmax) // 6 + 2):
        for h, ang in ((6 * k - 1, 180.0), (6 * k + 1, 0.0)):
            if h <= hmax:
                s[h] = (1.0 / h, ang)
    return s


SPECTRA = {'six_pulse': six_pulse(), 'hvdc': _HVDC, 'tcr': _TCR}
SPECTRUM_TXT = {'six_pulse': 'ιδανική εξαπαλμική γέφυρα (1/h)', 'hvdc': 'εξαπαλμική γέφυρα HVDC (Task Force 1999, Πίν. 1.4)', 'tcr': 'TCR σε τρίγωνο (Task Force 1999, Πίν. 1.4)'}


def spectrum(s):
    """A spectrum as {order: (magnitude, angle in degrees)} with the order 1 in it, from a name of SPECTRA or from a dict (the
    orders may be strings, as a file gives them)."""
    if isinstance(s, str):
        if s not in SPECTRA:
            raise HarmonicError(f'spectrum: one of {", ".join(SPECTRA)}, or a dict of orders')
        return dict(SPECTRA[s])
    try:
        out = {int(h): (float(v[0]), float(v[1])) for h, v in dict(s).items()}
    except (TypeError, ValueError, IndexError, KeyError) as e:
        raise HarmonicError('spectrum: {order: (magnitude, angle in degrees)}') from e
    if 1 not in out or out[1][0] <= 0:
        raise HarmonicError('spectrum: the order 1 (the fundamental, with a magnitude above zero) is the reference of the others')
    if any(h < 1 for h in out):
        raise HarmonicError('spectrum: orders from 1 up')
    return out


def limits(Un):
    """The limits of IEEE Std 519-2014 (Table 1) for a bus of nominal voltage Un (V): (each harmonic in %, THD in %)."""
    for top, one, thd in LIMITS:
        if Un <= top:
            return one, thd
    return LIMITS[-1][1:]


def _sequence(h):
    """+1 for an order of positive sequence (3k + 1), −1 for one of negative sequence (3k − 1), 0 for zero sequence (3k)."""
    return {1: 1, 2: -1, 0: 0}[int(round(h)) % 3] if abs(h - round(h)) < 1e-9 else 1


class Model:
    """The network at any order: what is needed from the network and from its load flow to write Y(h)."""

    def __init__(self, net, lf, load_model='C', line_model='distributed', sources=()):
        if load_model not in LOAD_MODELS:
            raise HarmonicError(f'load_model: one of {", ".join(LOAD_MODELS)}')
        if line_model not in LINE_MODELS:
            raise HarmonicError(f'line_model: one of {", ".join(LINE_MODELS)}')
        self.net, self.case, self.load_model, self.line_model = net, net.case(), load_model, line_model
        c = self.case
        self.V1 = np.asarray(lf['_V'], complex)
        z = 1 / c.y
        self.r, self.x = z.real, z.imag
        self.long = (c.bsh > 0) & (np.abs(np.abs(c.tap) - 1) < 1e-12) & (np.abs(np.angle(c.tap)) < 1e-12)       # lines with charging
        self.sh = []                                             # per shunt: (bus index, kind, parameters)
        self.notes = []
        skip = {s['load'] for s in sources}
        Sb = net.S_base
        for e in net.elements:
            k = e['kind']
            if k in ('branch', 'line', 'transformer'):
                continue                                         # in the arrays of the case
            i = c.idx.get(e.get('bus'))
            if k == 'shunt':
                if e.get('B') is not None:
                    self.sh.append((i, 'rlc', (e['R'], e['X'], e['B'])))
                else:                                            # by its power at 1 pu: a conductance, and a capacitor (Q < 0) or a reactor (Q > 0)
                    self.sh.append((i, 'gb', (e['P'] / Sb, -e['Q'] / Sb)))
            elif k == 'load':
                if e['name'] in skip:
                    continue
                Vm = abs(self.V1[i])
                zf = e['zip'][0] * Vm ** 2 + e['zip'][1] * Vm + e['zip'][2]
                self.sh.append((i, 'load', (e['P'] * zf / Sb, e['Q'] * zf / Sb, Vm)))
            elif k == 'generator':
                x = e['xd2'] * Sb / e['Sr'] * (e['Ur'] / net.buses[e['bus']]['Un']) ** 2
                self.sh.append((i, 'rl', (0.0, x)))
            elif k == 'feeder':
                Sk = e.get('Sk') or (math.sqrt(3) * (e.get('Un') or net.buses[e['bus']]['Un']) * e['Ik'] if e.get('Ik') else None)
                if not Sk:
                    raise HarmonicError(f'feeder {e["name"]}: its short-circuit power is needed for the harmonic model')
                zk = Sb / Sk
                rx = e.get('RX', 0.1) or 0.0
                x = zk / math.sqrt(1 + rx * rx)
                self.sh.append((i, 'rl', (rx * x, x)))
            else:
                raise HarmonicError(f'element {e["name"]} ({k}): no harmonic model for this kind of element yet')

    def _load(self, h, P, Q, Vm):
        m = self.load_model
        if m == 'none' or (P <= 0 and Q == 0):
            return 0.0
        if P <= 0:                                               # reactive power alone: a reactor or a capacitor
            return -1j * Q / Vm ** 2 / h if Q > 0 else 1j * h * (-Q) / Vm ** 2
        R = Vm ** 2 / P
        if m == 'A':
            return 1 / R + (Q / (1j * h * Vm ** 2) if Q > 0 else 1j * h * (-Q) / Vm ** 2 if Q < 0 else 0.0)
        if m == 'B':
            k = 0.1 * h + 0.9
            return k / R + (k * Q / (1j * h * Vm ** 2) if Q > 0 else 1j * h * (-Q) / Vm ** 2 if Q < 0 else 0.0)
        d = 6.7 * Q / P - 0.74                                   # model C, as the Task Force writes it
        par = 1 / R + (d / (1j * h * R) if d != 0 else 0.0)
        return 1 / (1j * 0.073 * h * R + 1 / par)

    def branches(self, h):
        """The four admittances of every branch at the order h: (Yff, Yft, Ytf, Ytt)."""
        c = self.case
        z = self.r + 1j * h * self.x
        ysh = 0.5j * h * c.bsh
        if self.line_model == 'distributed' and self.long.any():
            L = self.long
            g = np.sqrt(z[L] * (1j * h * c.bsh[L]))               # γ·l of every line
            z, ysh = z.copy(), ysh.copy()
            z[L] = z[L] * np.sinh(g) / g
            ysh[L] = ysh[L] * np.tanh(g / 2) / (g / 2)
        y = 1 / z
        s = _sequence(h)
        tap = np.abs(c.tap) * np.exp(1j * (s if s else 1) * np.angle(c.tap))     # a phase shift turns the other way for negative sequence
        return (y + ysh) / np.abs(tap) ** 2, -y / np.conj(tap), -y / tap, y + ysh

    def Y(self, h):
        """The admittance matrix of the network at the order h (sparse)."""
        c = self.case
        n = c.n
        Yff, Yft, Ytf, Ytt = self.branches(h)
        d = np.zeros(n, complex)
        for i, kind, p in self.sh:
            if kind == 'rlc':
                R, X, B = p
                d[i] += 1j * h * B if (R == 0 and X == 0) else 1 / (R + 1j * (h * X - 1 / (h * B)))
            elif kind == 'gb':
                G, B = p
                d[i] += G + (1j * h * B if B > 0 else 1j * B / h)
            elif kind == 'rl':
                d[i] += 1 / (p[0] + 1j * h * p[1])
            else:
                d[i] += self._load(h, *p)
        k = np.arange(n)
        return sp.csc_matrix((np.r_[Yff, Yft, Ytf, Ytt, d], (np.r_[c.f, c.f, c.t, c.t, k], np.r_[c.f, c.t, c.f, c.t, k])), shape=(n, n))


def sources_of(net):
    """The harmonic sources that the network carries: its loads with a spectrum."""
    return [{'load': e['name'], 'spectrum': e['spectrum'], 'delta': bool(e.get('delta'))} for e in net.elements if e['kind'] == 'load' and e.get('spectrum') is not None]


def scan(model, bus, to=40.0, step=0.05):
    """The impedance seen from a bus against the order (the frequency scan): {'h', 'Z' (pu, magnitude), 'angle' (degrees),
    'peaks': the parallel resonances [(order, |Z|)], 'dips': the series resonances}."""
    c = model.case
    if bus not in c.idx:
        raise HarmonicError(f'scan: no bus {bus!r}')
    if not (step > 0 and to > 1 and (to - 1) / step <= 20000):
        raise HarmonicError('scan: a step above zero, up to an order above 1, 20000 points at most')
    hs = np.round(np.arange(1.0, to + step / 2, step), 9)
    e = np.zeros(c.n, complex)
    e[c.idx[bus]] = 1.0
    Z = np.array([spla.splu(model.Y(h)).solve(e)[c.idx[bus]] for h in hs])
    m = np.abs(Z)
    peaks = [(float(hs[i]), float(m[i])) for i in range(1, len(hs) - 1) if m[i] > m[i - 1] and m[i] >= m[i + 1]]
    dips = [(float(hs[i]), float(m[i])) for i in range(1, len(hs) - 1) if m[i] < m[i - 1] and m[i] <= m[i + 1]]
    return {'bus': bus, 'h': hs.tolist(), 'Z': m.tolist(), 'angle': np.degrees(np.angle(Z)).tolist(), 'peaks': peaks, 'dips': dips}


def run(net, sources=None, harmonics=None, load_model='C', line_model='distributed', pulse=None, filters=True, scan_bus=None, scan_to=None,
        scan_step=0.05, tol=1e-10):
    """The harmonic load flow of a network. sources: [{'load': the name of a load, 'spectrum': a name of SPECTRA or {order:
    (magnitude, angle)}, 'delta': behind a star–delta transformer}]; without it, the loads of the network that carry a spectrum.
    harmonics: the orders to solve (default: every order of the spectra). load_model: 'C', 'A', 'B' (Task Force 1996) or
    'none'. line_model: 'distributed' or 'pi'. pulse: 6 takes every source as if behind a star–star transformer (no
    cancellation between two bridges), 12 leaves the sources as given. filters: False takes the tuned filters out (their
    reactive power too: the load flow runs without them). scan_bus: the bus of the frequency scan (default: the bus of the
    largest source; False: no scan), up to the order scan_to with the step scan_step.

    Returns {'converged', 'buses' {bus: V, angle (the fundamental), THD (%), Vh {order: pu}, worst (order), limit, limit_thd,
    over}, 'branches' [{name, a, b, I1 (pu), Ih {order: pu}, THD (%)}], 'sources' [{load, bus, I1, delta, Ih}], 'harmonics',
    'skipped' (orders of zero sequence), 'worst' {bus, THD}, 'over' (buses above their limit), 'scan', 'lf' (the load flow),
    'load_model', 'line_model', 'advice', 'message', 'time'}."""
    t0 = time.perf_counter()
    if pulse not in (None, 6, 12):
        raise HarmonicError('pulse: 6, 12 or nothing')
    if not filters:                                              # the same network without its tuned filters
        from . import network as N
        d = N.to_dict(net)
        d['elements'] = [e for e in d['elements'] if not (e['kind'] == 'shunt' and e.get('B') is not None and (e.get('R') or e.get('X')))]
        net = N.from_dict(d)
    src = sources_of(net) if sources is None else [dict(s) for s in sources]
    if not src:
        raise HarmonicError('Το δίκτυο δεν έχει πηγή αρμονικών: δώσε sources ή ένα φορτίο με spectrum.')
    loads = {e['name']: e for e in net.elements if e['kind'] == 'load'}
    for s in src:
        if s.get('load') not in loads:
            raise HarmonicError(f'source: no load {s.get("load")!r} in the network')
        s['spec'] = spectrum(s.get('spectrum'))
        s['delta'] = bool(s.get('delta')) and pulse != 6
    lf = net.power_flow('nr', tol=tol)
    out = {'converged': False, 'load_model': load_model, 'line_model': line_model, 'pulse': pulse, 'filters': bool(filters), 'message': '', 'S_base': net.S_base}
    if not lf['converged']:
        out.update(message='η ροή φορτίου της θεμελιώδους δεν συγκλίνει' + ('' if filters else ' χωρίς τα φίλτρα (και την άεργό τους)'), time=time.perf_counter() - t0)
        return out
    M = Model(net, lf, load_model, line_model, src)
    c = M.case
    V1 = M.V1
    orders = sorted({h for s in src for h in s['spec'] if h != 1}) if harmonics is None else sorted({int(h) for h in harmonics})
    if any(h < 2 for h in orders):
        raise HarmonicError('harmonics: orders from 2 up')
    skipped = [h for h in orders if _sequence(h) == 0]
    orders = [h for h in orders if _sequence(h) != 0]
    if not orders:
        raise HarmonicError('Καμία τάξη για λύση: οι τάξεις πολλαπλάσιες του 3 είναι ομοπολικές σε συμμετρικό δίκτυο και δεν μοντελοποιούνται.')
    Sb = net.S_base
    info = []
    for s in src:
        e = loads[s['load']]
        i = c.idx[e['bus']]
        Vm = abs(V1[i])
        zf = e['zip'][0] * Vm ** 2 + e['zip'][1] * Vm + e['zip'][2]
        I1 = np.conj(complex(e['P'], e['Q']) * zf / Sb / V1[i])    # the current the load draws at the fundamental
        if abs(I1) == 0:
            raise HarmonicError(f'source {s["load"]}: the load draws no current at the fundamental')
        s.update(i=i, I1=I1)
        info.append({'load': s['load'], 'bus': e['bus'], 'I1': float(abs(I1)), 'delta': s['delta'], 'Ih': {}})
    Vh, Ih = {}, {}
    for h in orders:
        I = np.zeros(c.n, complex)
        for s, q in zip(src, info):
            if h not in s['spec']:
                continue
            mag, ang = s['spec'][h]
            a = math.radians(ang) + h * (np.angle(s['I1']) - math.radians(s['spec'][1][1]))      # the waveform moves with its fundamental
            if s['delta']:                                       # through a star–delta transformer: the sign of (−1)^k for the orders 6k ± 1
                a += math.pi * round(h / 6)
            cur = abs(s['I1']) * mag / s['spec'][1][0] * np.exp(1j * a)
            I[s['i']] -= cur                                     # what the load draws leaves the bus
            q['Ih'][h] = float(abs(cur))
        Vh[h] = spla.splu(M.Y(h)).solve(I)
        Yff, Yft, _, _ = M.branches(h)
        Ih[h] = Yff * Vh[h][c.f] + Yft * Vh[h][c.t]
    A = np.abs(np.array([Vh[h] for h in orders]))                  # orders × buses
    thd = 100 * np.sqrt((A ** 2).sum(axis=0)) / np.abs(V1)
    buses = {}
    for i, b in enumerate(c.names):
        one, tl = limits(net.buses[b]['Un'])
        ind = 100 * A[:, i] / abs(V1[i])
        buses[b] = {'V': float(abs(V1[i])), 'angle': float(np.degrees(np.angle(V1[i]))), 'THD': float(thd[i]), 'Vh': {h: float(A[k, i]) for k, h in enumerate(orders)},
                    'worst': int(orders[int(np.argmax(A[:, i]))]), 'worst_pct': float(ind.max()), 'limit': one, 'limit_thd': tl, 'Un': net.buses[b]['Un'],
                    'over': bool(thd[i] > tl or ind.max() > one)}
    If1 = c.Yf @ V1
    br = []
    for k in range(c.nl):
        ih = {h: float(abs(Ih[h][k])) for h in orders}
        i1 = float(abs(If1[k]))
        br.append({'name': c.br_name[k], 'a': c.names[c.f[k]], 'b': c.names[c.t[k]], 'I1': i1, 'Ih': ih,
                   'THD': float(100 * math.sqrt(sum(v * v for v in ih.values())) / i1) if i1 > 1e-9 else None, 'Irms': float(math.sqrt(i1 * i1 + sum(v * v for v in ih.values())))})
    w = max(buses, key=lambda b: buses[b]['THD'])
    out.update(converged=True, buses=buses, branches=br, sources=info, harmonics=orders, skipped=skipped, worst={'bus': w, 'THD': buses[w]['THD']},
               over=[b for b in c.names if buses[b]['over']], lf={'iterations': lf['iterations'], 'losses': lf['losses']}, _V=V1, _Vh=Vh, _idx=c.idx, types=lf['types'])
    if skipped:
        out['message'] = 'οι τάξεις ' + ', '.join(str(h) for h in skipped) + ' είναι ομοπολικές σε συμμετρικό δίκτυο και δεν λύθηκαν'
    if scan_bus is not False:
        sb = scan_bus or max(info, key=lambda q: q['I1'])['bus']
        up = c.idx.get(sb)
        if up is None:
            raise HarmonicError(f'scan_bus: no bus {sb!r}')
        out['scan'] = scan(M, sb, float(scan_to or (max(orders) + 2)), scan_step)
    out['advice'] = {'why': f'{len(src)} ' + ('πηγή' if len(src) == 1 else 'πηγές') + f' αρμονικών, {len(orders)} τάξεις (ως την {max(orders)}η): ροή φορτίου της θεμελιώδους, και για κάθε τάξη '
                            f'το γραμμικό δίκτυο Y·V = I με τα ρεύματα των πηγών από το φάσμα τους· γραμμές με {LINE_TXT[line_model]}, φορτία με {LOAD_TXT[load_model]}'}
    out['time'] = time.perf_counter() - t0
    return out


__all__ = ['HarmonicError', 'SPECTRA', 'LIMITS', 'LOAD_MODELS', 'LINE_MODELS', 'six_pulse', 'spectrum', 'limits', 'Model', 'sources_of', 'scan', 'run']
