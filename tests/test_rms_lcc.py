"""5.1.5: the line-commutated HVDC link (LCC) in the load flow AC/DC and in RMS (pcl.lcc, pcl.rms.LCC, ROADMAP §101 step 2,
THEORY §8ΩΩ). The checks: the steady state against Example 10.2 of «Power System Stability and Control» (modes 1 and 2) and
against the average model of our EMT of the first CIGRE HVDC benchmark (the tutorial hvdc_lcc, settled at 3 s); the three
modes and the VDCOL of the steady state; the start at rest; the DC circuit with the controls held against its closed solution
(a linear circuit after a fault at the middle of the line); the firing PLLs on a stiff network against their second-order
poles; the Jacobian against central differences; and the RMS against our EMT of the benchmark (the average model: a step of
the order, a DC fault, a three-phase fault at the inverter; the detailed model: the step), from tests/js/lcc_rms_cases.js."""
import json
import math
import subprocess
import unittest
from pathlib import Path

import numpy as np
import scipy.linalg as sla

from pcl import lcc, rms
from pcl import network as N

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / 'tests' / 'js' / 'lcc_rms_cases.js'
D = 180 / math.pi
STEP = [{'t': 0.5, 'kind': 'iord', 'gen': 'DC', 'dI': -0.1}]
DCF = [{'t': 0.5, 'kind': 'dcfault', 'gen': 'DC', 'R': 0.1}, {'t': 0.65, 'kind': 'dcclear', 'gen': 'DC'}]
AC3 = [{'t': 0.5, 'kind': 'fault', 'bus': 'I', 'z': 0.1 / (230e3 ** 2 / 100e6)}, {'t': 0.65, 'kind': 'clear', 'bus': 'I'}]


def emt(cases, timeout=1800):
    r = subprocess.run(['node', str(JS), json.dumps(cases)], capture_output=True, text=True, timeout=timeout, cwd=str(ROOT))
    if r.returncode:
        raise RuntimeError(r.stderr[-3000:])
    out = json.loads(r.stdout)
    for o in out:
        if 'error' in o:
            raise RuntimeError(o['error'][:3000])
    return out


def example_10_2(Er_drop=1.0):
    """Example 10.2 of the book: a bipole of 1000 MW, ±250 kV as a monopole of 500 kV, 2 kA, line 20 Ω, B = 4 bridges with
    R_c = 6 Ω each (X_c = 2π Ω), turns ratio 0,5 (220/110 kV), γ₀ = 18,167°, α_min = 5°, I_m = 15 %, no rise of γ with the
    error (dgc 0) and no VDCOL; the HT voltages of (a): E_acr = 229,12 kV, E_aci from V_d0i = (500 + 4·6·2)/cos γ₀."""
    net = N.Network(f=50)
    net.bus('A', 220e3)
    net.bus('B', 220e3)
    st = {'Sn': 0.1 * 110e3 ** 2 / (2 * math.pi), 'U1': 220e3, 'U2': 110e3, 'uk': 10.0, 'B': 4}
    net.lcc('A', 'B', Vdn=500e3, Idn=2000, R=20.0, sr=st, si=st, gref=18.167, amin=5.0, dI=0.15, dgc=0.0, vdcol=(0.4, 1.0, 0.9, 1.0),
            name='L')
    Vd0i = (500 + 4 * 6 * 2) / math.cos(18.167 / D)
    Ei = Vd0i * 1e3 / (3 * math.sqrt(2) / math.pi * 4 * 0.5) / 220e3
    e = net.element('L')
    return e, lcc.operating_point(e, 220e3, 220e3, Er_drop * 229.12 / 220, Ei), lcc.consts(e, 220e3, 220e3)


def approx_q(o, k, side, E):
    """Q = P·tan φ with cos φ ≈ V_d/V_d0 ((10.45), the approximation of the book's power flow)."""
    vd, vd0 = (o['Vdr'], k['r']['vd0']) if side == 'r' else (o['Vdi'], k['i']['vd0'])
    P = abs(o['P' + side])
    return P * math.tan(math.acos(vd / (vd0 * E * 500e3)))


class SteadyState(unittest.TestCase):
    def test_example_10_2(self):
        """(a) mode 1: V_d0r 618,85 kV, μ_i 20,232°, Q with the book's cos φ 604,57 and 574,94 Mvar; (b) the rectifier's AC voltage
        20 % down, mode 2: α 5°, I_d 1,7 kA, V_dr 452,39, V_di 418,39 kV, γ 37,23°, μ 11,87°, P 769,06 and 711,26 MW, Q 341,87 and
        674,85 Mvar. Our Q is that of the exact power factor: 1,9 % below the book's in (a), and 5,3 % (rectifier) in (b)."""
        e, o, k = example_10_2()
        self.assertEqual(o['mode'], 1)
        self.assertAlmostEqual(k['r']['vd0'] * 229.12 / 220 * 500, 618.85, delta=0.02)
        self.assertAlmostEqual(o['Vdr'] / 1e3, 540.0, delta=1e-9)
        self.assertAlmostEqual(o['Vdi'] / 1e3, 500.0, delta=1e-9)
        self.assertAlmostEqual(o['ar'] * D, 18.167, delta=0.003)
        self.assertAlmostEqual(o['mi'] * D, 20.232, delta=0.001)
        self.assertAlmostEqual(approx_q(o, k, 'r', 229.12 / 220) / 1e6, 604.57, delta=0.05)
        Ei = (500 + 48) / math.cos(18.167 / D) * 1e3 / (3 * math.sqrt(2) / math.pi * 2) / 220e3
        self.assertAlmostEqual(approx_q(o, k, 'i', Ei) / 1e6, 574.94, delta=0.02)
        self.assertAlmostEqual(o['Qr'] / approx_q(o, k, 'r', 229.12 / 220), 0.981, delta=0.001)
        e, o, k = example_10_2(0.8)
        self.assertEqual(o['mode'], 2)
        self.assertAlmostEqual(o['ar'] * D, 5.0, delta=1e-9)
        self.assertAlmostEqual(o['Id'], 1700.0, delta=1e-9)
        self.assertAlmostEqual(o['Vdr'] / 1e3, 452.39, delta=0.005)
        self.assertAlmostEqual(o['Vdi'] / 1e3, 418.39, delta=0.005)
        self.assertAlmostEqual(o['g'] * D, 37.23, delta=0.005)
        self.assertAlmostEqual(o['mi'] * D, 11.87, delta=0.005)
        self.assertAlmostEqual(o['Pr'] / 1e6, 769.06, delta=0.01)
        self.assertAlmostEqual(-o['Pi'] / 1e6, 711.26, delta=0.01)
        self.assertAlmostEqual(approx_q(o, k, 'r', 0.8 * 229.12 / 220) / 1e6, 341.87, delta=0.05)
        self.assertAlmostEqual(approx_q(o, k, 'i', Ei) / 1e6, 674.85, delta=0.05)
        self.assertAlmostEqual(o['Qr'] / approx_q(o, k, 'r', 0.8 * 229.12 / 220), 0.947, delta=0.001)

    def test_mode_3_and_the_vdcol(self):
        """Mode 3: with dgc 16° the rectifier at α_min and the inverter on γ = γ_ref + Δγ·(order − I_d)/ΔI, between the two currents;
        the VDCOL: at a low inverter voltage the order is the VDCOL at V_d + k·I_d of the same point."""
        e, o, k = example_10_2(0.8)
        e['dgc'] = 30.0                                     # mode 2 would need γ ≥ 48,167°; its γ is 37,23°
        Ei = (500 + 48) / math.cos(18.167 / D) * 1e3 / (3 * math.sqrt(2) / math.pi * 2) / 220e3
        o = lcc.operating_point(e, 220e3, 220e3, 0.8 * 229.12 / 220, Ei)
        self.assertEqual(o['mode'], 3)
        self.assertTrue(0.85 < o['i'] < 1.0)
        self.assertAlmostEqual(o['g'] * D, 18.167 + 30.0 * (1.0 - o['i']) / 0.15, delta=1e-9)
        self.assertAlmostEqual(o['ar'] * D, 5.0, delta=1e-9)
        net = lcc.benchmark_network()
        e = net.element('DC')
        o = lcc.operating_point(e, 345e3, 230e3, 1.0, 0.55)
        self.assertLess(o['order'], 0.99)
        self.assertAlmostEqual(o['order'], lcc.vdcol(e, o['vi'] + e['kc'] * o['i']), delta=1e-12)

    def test_benchmark_against_the_emt(self):
        """The load flow AC/DC of the benchmark (Newton on the HT voltages: the alternation diverges) against the average model of
        our EMT at 3 s (the PLLs of the EMT settle in about 2,5 s): V_d 2·10⁻⁴ pu, α and γ 0,01°, the powers of the sources 0,1 MW
        and Mvar."""
        net = lcc.benchmark_network()
        r = net.acdc_flow()
        self.assertTrue(r['converged'])
        o = r['lcc']['DC']
        self.assertEqual(o['mode'], 1)
        m = emt([{'opts': {'model': 'avg', 'ev': 'ss'}, 't0': 2.95, 't1': 3.0, 'win': 0.05}])[0]
        self.assertEqual(m['warn'], [])
        self.assertAlmostEqual(o['Vdr'] / 500e3, m['vdr'][-1], delta=2e-4)
        self.assertAlmostEqual(o['Vdi'] / 500e3, m['vdi'][-1], delta=2e-4)
        self.assertAlmostEqual(o['alpha_r'], m['aor'][-1], delta=0.01)
        self.assertAlmostEqual(o['alpha_i'], m['aoi'][-1], delta=0.01)
        self.assertAlmostEqual(o['gamma'], m['gm'][-1], delta=0.01)
        b = r['buses']
        for bus, P, Q in (('R0', 'Psr', 'Qsr'), ('I0', 'Psi', 'Qsi')):
            self.assertAlmostEqual(b[bus]['P'] / 1e6, m[P][-1] / 1e6, delta=0.1)
            self.assertAlmostEqual(b[bus]['Q'] / 1e6, m[Q][-1] / 1e6, delta=0.1)

    def test_what_is_refused(self):
        st = {'Sn': 600e6, 'U1': 345e3, 'U2': 213e3, 'uk': 18.0}
        net = N.Network(f=50)
        net.bus('A', 345e3)
        net.bus('B', 345e3)
        for kw, why in (({'sr': {**st, 'X': 1}, 'si': st}, 'unknown'), ({'sr': {'Sn': 1e6}, 'si': st}, 'needs'),
                        ({'sr': st, 'si': st, 'poles': 3}, 'poles'), ({'sr': st, 'si': st, 'dI': 1.5}, 'ΔI')):
            with self.assertRaises(N.NetworkError, msg=why) as c:
                net.lcc('A', 'B', 500e3, 2000, 5.0, **kw)
            self.assertIn(why, str(c.exception))
        with self.assertRaises(N.NetworkError):
            net.lcc('A', 'A', 500e3, 2000, 5.0, st, st)
        net = lcc.benchmark_network()                       # (5.1.6: with VSC stations too, tests/test_rms_lcc_516.py)
        with self.assertRaises(rms.RMSError):              # the RMS of a link starts from the load flow AC/DC
            rms.System(net, pf=net.power_flow())
        with self.assertRaises(rms.RMSError):
            rms.System(net, stations={'DC': {'Kp': 1.0}})
        with self.assertRaises(rms.RMSError):
            rms.System(net, stations={'XX': {}})
        s = rms.System(lcc.benchmark_network(C=0.0))
        s.init()
        with self.assertRaises(rms.RMSError):              # no midpoint without C
            s.simulate(0.1, events=[{'t': 0.05, 'kind': 'dcfault', 'gen': 'DC', 'R': 1.0}], h=0.001)


def stiff(C=26e-6, **st):
    """The link of the benchmark between two stiff sources at the HT buses (S_base 100 GVA: X 10⁻⁴ pu is 1,2·10⁻⁴ Ω, and the AC
    voltages move by about 10⁻⁶ pu), with its dynamic data st."""
    net = N.Network(f=50, S_base=1e11)
    b = lcc.BENCHMARK
    for bus, d in (('R', b['rec']), ('I', b['inv'])):
        net.bus(bus, d['U'])
        net.feeder(bus, V=1.0, angle=0.0, name='S' + bus)
    net.lcc('R', 'I', Vdn=500e3, Idn=2000, R=5.0, C=C, Ld=b['Ld'], sr=b['rec']['st'], si=b['inv']['st'], name='DC')
    return net, rms.System(net, stations={'DC': st} if st else None)


class RMS(unittest.TestCase):
    def test_at_rest(self):
        for C in (None, 0.0):
            s = rms.System(lcc.benchmark_network(C=C))
            start = s.init()
            self.assertLess(start['f'], 1e-12)
            self.assertLess(start['g'], 1e-8)
            r = s.simulate(1.0, h=0.005)
            self.assertLess(float(np.max(np.abs(r['x'][-1] - r['x'][0]))), 1e-8)

    def test_dc_circuit_against_its_closed_solution(self):
        """The controls held (K_p 0: β constant, no PLL), the AC voltages stiff: after a fault of 250 Ω at the middle of the line the
        DC side is linear, x′ = A·x + b (the converters V_d0·cos α − R_c·I_d, the T line; its modes −100,5 ± j355,0/s and
        −47,2/s): the RMS against expm. The error of the trapezoidal rule falls as h² (4,0 times from h = 0,5 to 0,25 ms), and
        with 0,25 ms it is 4,7·10⁻⁴ pu of the currents (of 1). (5.1.6: without the half steps of backward Euler after the fault,
        cda 0, for the order of the trapezoidal rule alone.)"""
        errs = []
        for h in (0.0005, 0.00025):
            net, s = stiff(KpR=0.0, KpI=0.0, KpG=0.0, bw=0.0, cda=0.0)
            s.init()
            K = [k for k in s.kinds if isinstance(k, rms.LCC)][0]
            x0 = s.x0[K.x0:K.x0 + K.nx]
            r = s.simulate(0.3, events=[{'t': 0.1, 'kind': 'dcfault', 'gen': 'DC', 'R': 250.0}], h=h)
            p, j = K.p, K.j
            E = np.abs(s.V0[K.bus])
            ar, ai = math.pi - x0[j['xr']], math.pi - x0[j['xg']]
            Vr, Vi = p['vd0'][0] * E[0] * math.cos(ar), p['vd0'][1] * E[1] * math.cos(ai)
            gf = 500e3 / 2000 / 250.0
            A = np.array([[-(p['rc'][0] + p['rl'] / 2) / p['l1'], -1 / p['l1'], 0.0], [1 / p['c'], -gf / p['c'], -1 / p['c']],
                          [0.0, 1 / p['l2'], -(p['rc'][1] + p['rl'] / 2) / p['l2']]])
            M = np.zeros((4, 4))
            M[:3, :3], M[:3, 3] = A, [Vr / p['l1'], 0.0, Vi / p['l2']]
            z0 = np.r_[x0[[j['ir'], j['vm'], j['ii']]], 1.0]
            X = r['x'][:, K.x0:K.x0 + K.nx][:, [j['ir'], j['vm'], j['ii']]]
            err = 0.0
            for k, t in enumerate(r['t']):
                if t > 0.1 + 1e-9:
                    err = max(err, float(np.max(np.abs(X[k] - (sla.expm(M * (t - 0.1)) @ z0)[:3]))))
            self.assertGreater(float(np.min(X[:, 2])), 0.3)     # (the inverter keeps conducting: linear throughout)
            errs.append(err)
        self.assertAlmostEqual(errs[0] / errs[1], 4.0, delta=0.1)
        self.assertLess(errs[1], 6e-4)

    def test_firing_plls_against_their_poles(self):
        """On a stiff network the PLLs (bandwidth 1,125 Hz, ζ 0,7071) decouple: two pairs λ = −ζω_n ± jω_n·√(1 − ζ²) within 10⁻³."""
        net, s = stiff()
        s.init()
        lam = np.asarray(s.eigen(method='qr')['lambda'])
        wn = 2 * math.pi * 1.125
        want = complex(-0.7071 * wn, wn * math.sqrt(1 - 0.7071 ** 2))
        near = sorted(lam[np.abs(lam - want) < 0.5], key=lambda z: abs(z - want))
        self.assertEqual(len(near), 2)
        for z in near:
            self.assertLess(abs(z - want), 1e-3)
        self.assertLessEqual(float(np.max(lam.real)), 1e-9)        # (the integral at its limit: λ = 0)

    def test_jacobian(self):
        """The Jacobian of the device (complex steps, and the γ loop solved inside) against central differences, the holds of the
        step held, in the middle of the step of the order: to 10⁻⁷ relative."""
        for C in (None, 0.0):
            s = rms.System(lcc.benchmark_network(C=C))
            s.init()
            r = s.simulate(0.53, events=STEP, h=0.001)
            x, y, t = r['x'][-1], np.r_[r['V'][-1].real, r['V'][-1].imag], 0.53
            s._freeze(x, y, t)
            J = s.jac(x, y, t).toarray()
            z, nx = np.r_[x, y], s.nx
            K = [k for k in s.kinds if isinstance(k, rms.LCC)][0]
            worst = 0.0
            for c in list(range(K.x0, K.x0 + K.nx)) + [nx + b for b in K.bus] + [nx + s.n + b for b in K.bus]:
                e = 1e-7 * max(1.0, abs(z[c]))
                zp, zm = z.copy(), z.copy()
                zp[c] += e
                zm[c] -= e
                d = (np.r_[s.fg(zp[:nx], zp[nx:], t)] - np.r_[s.fg(zm[:nx], zm[nx:], t)]) / (2 * e)
                worst = max(worst, float(np.max(np.abs(d - J[:, c])) / max(float(np.max(np.abs(d))), 1e-12)))
            s._thaw()
            self.assertLess(worst, 1e-7, C)

    def test_trip_of_the_link(self):
        """The event gen: no current on either side from its time; the AC powers zero."""
        net = lcc.benchmark_network()
        d = net.dynamic(t_end=0.3, events=[{'t': 0.1, 'kind': 'gen', 'gen': 'DC'}], h=0.001, record=0.001)
        L, T = d['lcc']['DC'], np.asarray(d['t'])
        late = T > 0.1 + 1e-9
        for k in ('Id_r', 'Id_i', 'Pr', 'Qr', 'Pi', 'Qi'):
            self.assertLess(float(np.max(np.abs(np.asarray(L[k])[late]))), 1e-9, k)
        self.assertEqual([e['kind'] for e in d['events']], ['gen'])


def windows(d, te):
    """The RMS of a result over the windows (t − 5 ms, t] of the EMT: the mean of its points by the trapezoidal rule (at an event
    the point after it)."""
    L, T = d['lcc']['DC'], np.round(np.asarray(d['t']), 9)

    def wm(key):
        y, out = np.asarray(L[key]), []
        for t in te:
            m = (T >= t - 0.005 - 1e-9) & (T <= t + 1e-9)
            tt, yy = T[m], y[m]
            _, last = np.unique(tt[::-1], return_index=True)
            i = len(tt) - 1 - last
            out.append(np.trapezoid(yy[i], tt[i]) / 0.005)
        return np.array(out)
    return {'vdr': wm('Vdr'), 'vdi': wm('Vdi'), 'ir': wm('Id_r'), 'ii': wm('Id_i'), 'gm': wm('gamma')}


class AgainstEMT(unittest.TestCase):
    """The benchmark in RMS (h = 1 ms) against our EMT (the tutorial hvdc_lcc with its event at 2,5 s, its PLLs settled; windows of
    5 ms from 2,0 s) as the same events at 0,5 s. The bounds are the measured maxima (THEORY §8ΩΩ.4) with a margin."""

    @classmethod
    def setUpClass(cls):
        sets = {'step': {'CI': {'Iord': '0:1, 2.5:0.9'}}, 'dcf': {'KDC': {'v': '0:0, 2.5:1, 2.65:0'}}, 'ac3': {'FAC': {'ton': 2.5, 'toff': 2.65}}}
        cases = [{'opts': {'model': 'avg', 'ev': ev}, 'set': s, 't0': 2.0, 't1': 4.0, 'win': 0.005} for ev, s in sets.items()]
        cases.append({'opts': {'model': 'fast', 'ev': 'step'}, 'set': sets['step'], 't0': 2.0, 't1': 4.0, 'win': 0.005})
        cls.e = dict(zip(('step', 'dcf', 'ac3', 'step_det'), emt(cases)))
        net = lcc.benchmark_network()
        cls.r = {ev: net.dynamic(t_end=2.0, events=evs, h=0.001, record=0.001, stations=st) for ev, evs, st in
                 (('step', STEP, None), ('dcf', DCF, None), ('ac3', AC3, {'DC': {'cf': 'off'}}))}
        cls.r['dcf5'] = net.dynamic(t_end=2.0, events=DCF, h=0.005, record=0.005)      # 5.1.6: with the half steps of BE

    def diff(self, rms_ev, emt_ev, lo, hi):
        e = self.e[emt_ev]
        te = np.round(np.asarray(e['t']) - 2.0, 9)
        sel = (te > lo + 1e-9) & (te <= hi + 1e-9)
        w = windows(self.r[rms_ev], te[sel])
        out = {}
        for k, sc in (('vdr', 500.0), ('vdi', 500.0), ('ir', 1e-3), ('ii', 1e-3), ('gm', 1.0)):
            emt_v = np.asarray(e[k])[sel] * sc
            out[k] = float(np.max(np.abs(w[k] - emt_v)))
        out['v'], out['i'] = max(out['vdr'], out['vdi']), max(out['ir'], out['ii'])
        return out

    def test_step_of_the_order(self):
        """1 → 0,9 pu: from 150 ms after it V_d within 0,6 kV, I_d 0,002 kA, γ 0,1° (from 20 ms after it 20 kV and 0,04 kA); against the
        detailed model, which is 1 % below the average one in V_d (THEORY §8ω), from 0,7 s V_d within 6 kV, I_d 0,005 kA, γ 0,3°."""
        d = self.diff('step', 'step', 0.52, 2.0)
        self.assertLess(d['v'], 20.0)
        self.assertLess(d['i'], 0.04)
        d = self.diff('step', 'step', 0.65, 2.0)
        self.assertLess(d['v'], 0.6)
        self.assertLess(d['i'], 0.002)
        self.assertLess(d['gm'], 0.1)
        d = self.diff('step', 'step_det', 1.2, 2.0)
        self.assertLess(d['v'], 6.0)
        self.assertLess(d['i'], 0.005)
        self.assertLess(d['gm'], 0.3)
        L = self.r['step']['lcc']['DC']
        self.assertAlmostEqual(L['Id_r'][-1], 1.8, delta=1e-4)
        self.assertAlmostEqual(L['gamma'][-1], 15.0, delta=0.01)

    def test_dc_fault(self):
        """0,1 Ω at the middle of the line for 150 ms: from 50 ms after it V_d within 5 kV, I_d 0,012 kA, γ 0,2°; the VDCOL at its
        0,55 pu; from 0,55 s after the clearing V_d within 1 kV, I_d 0,002 kA. Between them, the recovery: V_d within 3,5 kV, I_d 0,015
        kA (5.1.6: with two half steps of backward Euler after the fault and its clearing; 5.1.5 without them 15 kV, 0,06 kA).
        With h = 5 ms: the recovery V_d within 3,5 kV, I_d 0,015 kA (5.1.5: 62 kV)."""
        d = self.diff('dcf', 'dcf', 0.55, 0.65)
        self.assertLess(d['v'], 5.0)
        self.assertLess(d['i'], 0.012)
        self.assertLess(d['gm'], 0.2)
        d = self.diff('dcf', 'dcf', 0.85, 1.2)
        self.assertLess(d['v'], 3.5)
        self.assertLess(d['i'], 0.015)
        d = self.diff('dcf', 'dcf', 1.2, 2.0)
        self.assertLess(d['v'], 1.0)
        self.assertLess(d['i'], 0.002)
        d = self.diff('dcf5', 'dcf', 0.85, 1.2)
        self.assertLess(d['v'], 3.5)
        self.assertLess(d['i'], 0.015)
        L, T = self.r['dcf']['lcc']['DC'], np.asarray(self.r['dcf']['t'])
        self.assertAlmostEqual(float(L['order'][int(np.argmin(np.abs(T - 0.6)))]), 0.55, delta=1e-9)

    def test_ac_fault_at_the_inverter(self):
        """(5.1.6: with the commutation failure off, cf 'off': the average model of the EMT has no bypass; against the detailed one,
        tests/test_rms_lcc_516.py.) Three phases to ground through 0,1 Ω for 150 ms: during it I_d of the rectifier within 0,05 kA (of the inverter 0,3 kA:
        its AC voltage is 0,5 % and the phase of its current that of what is left); from 0,2 s after the clearing V_d within
        1,5 kV and I_d 0,05 kA, from 0,55 s 1 kV and 0,002 kA. The first 0,2 s after the clearing differ (THEORY §8ΩΩ.4)."""
        d = self.diff('ac3', 'ac3', 0.55, 0.65)
        self.assertLess(d['ir'], 0.05)
        self.assertLess(d['ii'], 0.3)
        d = self.diff('ac3', 'ac3', 0.85, 1.2)
        self.assertLess(d['v'], 1.5)
        self.assertLess(d['i'], 0.05)
        d = self.diff('ac3', 'ac3', 1.2, 2.0)
        self.assertLess(d['v'], 1.0)
        self.assertLess(d['i'], 0.002)


if __name__ == '__main__':
    unittest.main()
