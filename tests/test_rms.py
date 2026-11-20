"""The numerical core of RMS dynamics and small-signal stability (4.23, ROADMAP §71, THEORY §8ΩΔ, pcl/rms.py).

Three independent ways for every number: the published three-machine, nine-bus study of the reference book (Power System
Control and Stability: Example 2.6 for the start, Table 2.6 for the reduced networks, Example 3.2 for the modes of the
classical model, §9.12 for the eigenvalues of the two-axis model), a second solution of the same equations (the network
reduced to the internal nodes and integrated by SciPy; QR against Arnoldi), and our EMT of the same fault (ieee9_emt)."""
import json
import math
import subprocess
import unittest
from pathlib import Path

import numpy as np
from scipy.integrate import solve_ivp

from pcl import network as N
from pcl import rms

ROOT = Path(__file__).resolve().parent.parent
KEYS = ('Xd', 'Xdp', 'Xq', 'Xqp', 'Td0p', 'Tq0p', 'Ra', 'H', 'D', 'Sn')
BASE = {g: {k: v for k, v in d.items() if k in KEYS} for g, d in N.IEEE9_MACHINES.items()}
WR = 2 * math.pi * 60
TC = 5 / 60                                               # five cycles


def classical():
    s = rms.System(N.ieee9(), machines={g: {'model': 'classical', **d} for g, d in BASE.items()}, f=60)
    s.init()
    return s


def two_axis(D):
    m = {'G1': {'model': 'classical', **BASE['G1'], 'D': D}}
    for g in ('G2', 'G3'):                                # §9.12 takes X′_q = X′_d (E′_d0 = (x_q − x′_d)·I_q0 in its Table 9.1)
        m[g] = {'model': 'two_axis', **BASE[g], 'Xqp': BASE[g]['Xdp'], 'D': D}
    s = rms.System(N.ieee9(), machines=m, f=60)
    s.init()
    return s


FAULT = [{'t': 0.0, 'kind': 'fault', 'bus': '8'}, {'t': TC, 'kind': 'clear', 'bus': '8'}, {'t': TC, 'kind': 'trip', 'branch': 'br8'}]


class Start(unittest.TestCase):
    def test_equilibrium(self):
        s = classical()
        r = s.init()
        self.assertLess(r['f'], 1e-12)
        self.assertLess(r['g'], 1e-12)
        out = s.simulate(2.0, h=0.01)
        # nothing moves without a disturbance: 0.0 here, 6.9e-18 on a processor of the CI (the BLAS kernel of the processor
        # rounds the residual of the start differently), so the bound is at the level of rounding
        self.assertLess(float(np.max(np.abs(out['x'] - out['x'][0]))), 1e-15)

    def test_example_2_6(self):
        s = classical()
        E = s.internal_emf()
        for g, (m, a) in {'G1': (1.0566, 2.2717), 'G2': (1.0502, 19.7315), 'G3': (1.0170, 13.1752)}.items():
            self.assertAlmostEqual(abs(E[g]), m, delta=1e-4)
            self.assertAlmostEqual(math.degrees(np.angle(E[g])), a, delta=0.01)   # (G3: 0,009° from its rounded load flow)
        yl = s.yload[[8, 4, 6]]                            # loads A, B, C of the book are buses 9, 5, 7 here
        for y, ref in zip(yl, (1.2610 - 0.5044j, 0.8777 - 0.2926j, 0.9690 - 0.3391j)):
            self.assertLess(abs(y - ref), 2e-4)

    def test_table_2_6(self):
        s = classical()
        pre = s.reduced_y()
        flt = s.reduced_y(events=[{'kind': 'fault', 'bus': '8'}])
        post = s.reduced_y(events=[{'kind': 'trip', 'branch': 'br8', 'shunts': 'keep'}])   # the book opens the series part only
        ref = {'pre': [[0.846 - 2.988j, 0.287 + 1.513j, 0.210 + 1.226j], [0, 0.420 - 2.724j, 0.213 + 1.088j], [0, 0, 0.277 - 2.368j]],
               'flt': [[0.657 - 3.816j, 0, 0.070 + 0.631j], [0, -5.486j, 0], [0, 0, 0.174 - 2.796j]],
               'post': [[1.181 - 2.229j, 0.138 + 0.726j, 0.191 + 1.079j], [0, 0.389 - 1.953j, 0.199 + 1.229j], [0, 0, 0.273 - 2.342j]]}
        for Y, R in ((pre, ref['pre']), (flt, ref['flt']), (post, ref['post'])):
            for i in range(3):
                for j in range(i, 3):
                    self.assertLess(abs(Y[i, j] - R[i][j]), 1.2e-3, (i, j))
        full = s.reduced_y(events=[{'kind': 'trip', 'branch': 'br8'}])
        self.assertGreater(abs(full[0, 0] - post[0, 0]), 0.05)   # the whole π model out: the line charging goes too


class Modes(unittest.TestCase):
    def test_example_3_2(self):
        s = classical()
        E, Y, g = s.internal_emf(), s.reduced_y(), ('G1', 'G2', 'G3')
        Ev, H = np.array([E[k] for k in g]), (23.64, 6.40, 3.01)
        Ps = lambda i, j: abs(Ev[i]) * abs(Ev[j]) * Y[i, j].imag * math.cos(np.angle(Ev[i]) - np.angle(Ev[j]))   # G_ij neglected
        P12, P13, P23 = Ps(0, 1), Ps(0, 2), Ps(1, 2)
        for P, ref in ((P12, 1.6015), (P23, 1.1544), (P13, 1.2936)):
            self.assertAlmostEqual(P, ref, delta=5e-4)
        a11 = WR / 2 * (P12 / H[0] + P13 / H[0] + P13 / H[2])
        a12 = WR / 2 * (P23 / H[2] - P12 / H[0])
        a21 = WR / 2 * (P13 / H[2] - P12 / H[1])
        a22 = WR / 2 * (P12 / H[1] + P23 / H[1] + P23 / H[2])
        w = sorted(np.sqrt(-np.roots([1, a11 + a22, a11 * a22 - a12 * a21])).real)
        self.assertAlmostEqual(w[0], 8.807, delta=2e-3)
        self.assertAlmostEqual(w[1], 13.416, delta=2e-3)
        # the full linearization (with G_ij) of the same model: purely imaginary, a little lower
        e = s.eigen('qr')
        osc = sorted({round(abs(m['lambda'].imag), 6) for m in e['modes'] if abs(m['lambda'].imag) > 1})
        self.assertEqual(len(osc), 2)
        self.assertTrue(8.6 < osc[0] < 8.807 and 13.3 < osc[1] < 13.416, osc)
        self.assertLess(max(abs(m['lambda'].real) for m in e['modes']), 1e-9)

    def test_section_9_12(self):
        pub = {1.0: [(-0.002664, 0.034648), (-0.000622, 0.022984), (-0.016644, 0), (-0.010373, 0), (-0.000455, 0), (-0.000199, 0.000129)],
               0.0: [(-0.002459, 0.034636), (-0.000529, 0.022983)]}
        for D, ref in pub.items():
            lam = two_axis(D).eigen('qr')['lambda'] / WR                       # the book in time per unit (ω_R t)
            for re, im in ref:
                best = min(abs(l.real - re) + abs(abs(l.imag) - im) for l in lam)
                self.assertLess(best, 3e-6, (D, re, im))

    def test_arnoldi_against_qr(self):
        for s, sig in ((two_axis(0.0), 2j * math.pi * 1.5), (rms.System(N.ieee(118)), 2j * math.pi * 1.2)):
            s.init()
            q = s.eigen('qr')
            a = s.eigen('arnoldi', sigma=sig, k=6)
            near = sorted(q['lambda'], key=lambda l: abs(l - sig))[:6]
            # (a double zero eigenvalue with D = 0 is a Jordan block: both methods give it only to √ε, so it is left out)
            self.assertLess(max(min(abs(l - n) for n in near) for l in a['lambda'] if abs(l) > 1e-2), 1e-8)
            for m in a['modes']:                                                 # the same participation factors
                mq = min(q['modes'], key=lambda x: abs(x['lambda'] - m['lambda']))
                if abs(m['lambda'].imag) > 1:
                    self.assertAlmostEqual(m['part'][0][2], mq['part'][0][2], delta=1e-6)

    def test_participation_and_shape(self):
        e = two_axis(0.0).eigen('qr')
        m = max((m for m in e['modes'] if m['f'] > 1.9), key=lambda m: m['f'])  # the 2,1 Hz mode: G3 against the others
        self.assertEqual(m['part'][0][0], 'G3')
        self.assertLess(m['shape']['G1'].real, 0)
        self.assertAlmostEqual(abs(m['shape']['G3']), 1.0, delta=1e-12)


class Integration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        s = cls.s = classical()
        E = s.internal_emf()
        g = ('G1', 'G2', 'G3')
        Em, d0, H = np.array([abs(E[k]) for k in g]), np.array([np.angle(E[k]) for k in g]), np.array([23.64, 6.40, 3.01])
        Y0, Yf, Yc = s.reduced_y(), s.reduced_y(events=FAULT[:1]), s.reduced_y(events=FAULT[2:])
        Pm = np.array([np.real(Em[i] * np.exp(1j * d0[i]) * np.conj(Y0[i] @ (Em * np.exp(1j * d0)))) for i in range(3)])

        def rhs(t, z, Y):
            Ev = Em * np.exp(1j * z[:3])
            return np.r_[WR * (z[3:] - 1), (Pm - np.real(Ev * np.conj(Y @ Ev))) / (2 * H)]
        a = solve_ivp(rhs, [0, TC], np.r_[d0, 1, 1, 1], args=(Yf,), method='DOP853', rtol=1e-12, atol=1e-12)
        cls.ref = solve_ivp(rhs, [TC, 2.0], a.y[:, -1], args=(Yc,), method='DOP853', rtol=1e-12, atol=1e-12, dense_output=True)
        cls.ix = [s.state(k, 'delta') for k in g]

    def err(self, r):
        m = r['t'] > TC + 1e-9
        return float(np.max(np.abs(r['x'][m][:, self.ix].T - self.ref.sol(r['t'][m])[:3])))

    def test_second_order_against_scipy(self):
        e = [self.err(self.s.simulate(2.0, events=FAULT, h=h)) for h in (0.004, 0.002, 0.001)]
        self.assertLess(e[2], 4e-5)
        self.assertTrue(3.5 < e[0] / e[1] < 4.5 and 3.5 < e[1] / e[2] < 4.5, e)    # the trapezoidal rule: h²

    def test_alternating_gives_the_same_steps(self):
        a = self.s.simulate(2.0, events=FAULT, h=0.002)
        b = self.s.simulate(2.0, events=FAULT, h=0.002, method='alternating')
        self.assertLess(float(np.max(np.abs(a['x'] - b['x']))), 1e-6)
        self.assertEqual(b['stats']['nonconv'], 0)

    def test_variable_step(self):
        errs, steps = [], []
        for rt in (1e-4, 1e-6):
            r = self.s.simulate(2.0, events=FAULT, h=0.01, step='var', rtol=rt, atol=rt * 1e-2)
            errs.append(self.err(r))
            steps.append(r['stats']['steps'])
        self.assertLess(errs[1], errs[0] / 10)
        self.assertLess(errs[1], 2e-3)
        self.assertGreater(steps[1], steps[0])

    def test_batch_and_critical_clearing(self):
        s = self.s
        fault, clear = {'kind': 'fault', 'bus': '8'}, [{'kind': 'clear', 'bus': '8'}, {'kind': 'trip', 'branch': 'br8'}]
        lo, hi, runs = s.cct(fault, clear, t_fault=0.05, lo=0.05, hi=0.6, t_end=3.0, tol=2e-3, h=0.002)
        self.assertTrue(lo is not None and hi is not None and hi - lo <= 2e-3, (lo, hi))
        out = s.batch([[{**fault, 't': 0.05}] + [{**c, 't': 0.05 + d} for c in clear] for d in (lo - 0.01, hi + 0.01)], 3.0, h=0.002)
        self.assertEqual([o['stable'] for o in out], [True, False])

    def test_against_our_emt(self):
        js = json.loads(subprocess.run(['node', str(ROOT / 'tests/js/rms_emt_cases.js'), '2.1'], capture_output=True, text=True, timeout=900, check=True).stdout)
        te, De = np.array(js['t']), np.degrees(np.unwrap(np.radians(np.array(js['d'])), axis=0))
        ev = [{'t': 0.1, 'kind': 'fault', 'bus': '8'}, {'t': 0.183333, 'kind': 'clear', 'bus': '8'}, {'t': 0.183333, 'kind': 'trip', 'branch': 'br8'}]
        r = self.s.simulate(2.1, events=ev, h=0.0005)
        Dr = np.degrees(r['x'][:, self.ix])
        rel = lambda D: np.c_[D[:, 1] - D[:, 0], D[:, 2] - D[:, 0]] - (D[0, 1] - D[0, 0], D[0, 2] - D[0, 0])
        Re, Rr = rel(De), rel(Dr)
        Ri = np.c_[np.interp(te, r['t'], Rr[:, 0]), np.interp(te, r['t'], Rr[:, 1])]
        self.assertAlmostEqual(Re[:, 0].max(), Ri[:, 0].max(), delta=3.0)          # the first swing of δ21: 70,2° and 68,2°
        self.assertAlmostEqual(te[np.argmax(Re[:, 0])], te[np.argmax(Ri[:, 0])], delta=0.02)
        self.assertLess(float(np.max(np.abs(Re - Ri))), 5.0)                         # over 2 s (the stator and the network in the EMT)


    def test_with_the_full_data_both_lose_synchronism(self):
        """The same fault with the machines of the two-axis model (constant E_fd): unstable in the RMS core and in the EMT
        of ieee9_emt with «the full data» (the same machines with their stator), stable when cleared in 40 ms."""
        js = json.loads(subprocess.run(['node', str(ROOT / 'tests/js/rms_emt_cases.js'), '2.5', 'full'], capture_output=True, text=True, timeout=900, check=True).stdout)
        De = np.degrees(np.unwrap(np.radians(np.array(js['d'])), axis=0))
        self.assertGreater(np.max(De[:, 1] - De[:, 0]) - (De[0, 1] - De[0, 0]), 360)
        m = {'G1': {'model': 'two_axis', **BASE['G1']}, 'G2': {'model': 'two_axis', **BASE['G2']}, 'G3': {'model': 'two_axis', **BASE['G3']}}
        s = rms.System(N.ieee9(), machines=m, f=60)
        s.init()
        mk = lambda d: [{'t': 0.1, 'kind': 'fault', 'bus': '8'}, {'t': 0.1 + d, 'kind': 'clear', 'bus': '8'}, {'t': 0.1 + d, 'kind': 'trip', 'branch': 'br8'}]
        self.assertFalse(s.stable(s.simulate(2.5, events=mk(0.083333), h=0.002)))
        self.assertTrue(s.stable(s.simulate(2.5, events=mk(0.04), h=0.002)))

class Network(unittest.TestCase):
    def test_a_large_network_does_not_move(self):
        s = rms.System(N.ieee(118))
        self.assertLess(s.init()['g'], 1e-9)
        r = s.simulate(2.0, h=0.01)
        self.assertLess(float(np.max(np.abs(r['x'] - r['x'][0]))), 1e-7)

    def test_an_element_without_an_rms_model_is_refused(self):
        net = N.ieee9()
        net.elements.append({'kind': 'sssc', 'name': 'S1', 'bus': '5'})
        with self.assertRaises(rms.RMSError) as c:
            rms.System(net)
        self.assertIn('sssc', str(c.exception))


if __name__ == '__main__':
    unittest.main()
