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


# ---------------------------------------------------------------- 5.0.13 (ROADMAP §101 step 1, THEORY §8ΩΝ): the library of models
FULL = {g: {k: v for k, v in d.items() if k in ('Sn',) + rms.SUB_KEYS} for g, d in N.IEEE9_MACHINES.items()}
PR = {'G1': 2.475, 'G2': 1.92, 'G3': 1.28}                # the ratings of the turbines of ieee9_emt (pu of 100 MVA)
DAMP = {'G1': {'Xdpp': 0.045, 'Xqpp': 0.05, 'Td0pp': 0.035, 'Tq0pp': 0.06},       # dampers on the machines of the reference book
        'G2': {'Xdpp': 0.09, 'Xqpp': 0.09, 'Td0pp': 0.03, 'Tq0pp': 0.05},         # (our values, for the checks of the subtransient
        'G3': {'Xdpp': 0.13, 'Xqpp': 0.13, 'Td0pp': 0.03, 'Tq0pp': 0.05}}         # model against the GEN3 of the EMT)


def emt(T, ev, ctl, over=None):
    args = ['node', str(ROOT / 'tests/js/rms_emt_cases.js'), str(T), ev, ctl] + ([json.dumps(over)] if over else [])
    js = json.loads(subprocess.run(args, capture_output=True, text=True, timeout=900, check=True).stdout)
    return np.array(js['t']), np.degrees(np.unwrap(np.radians(np.array(js['d'])), axis=0)), np.array([[np.nan if v is None else v for v in r] for r in js['y']])


def drawing(opts):
    from pcl import model
    proj = json.loads(subprocess.run(['node', str(ROOT / 'tests/js/model_cases.js'), 'build', 'ieee9_emt', json.dumps(opts)], capture_output=True, text=True,
                                     timeout=300, check=True).stdout)
    return model.of(proj)


class Models(unittest.TestCase):
    def run_fault(self, machines, h=0.002, T=2.0, loads='Z'):
        s = rms.System(N.ieee9(), machines=machines, f=60, loads=loads)
        s.init()
        r = s.simulate(T, events=FAULT, h=h)
        return s, r, np.degrees(r['x'][:, [s.state(g, 'delta') for g in ('G1', 'G2', 'G3')]])

    def test_the_unit_is_the_two_axis_core(self):
        """The machine of a Unit with X″ = X′ is the two-axis machine of 4.23, and the subtransient model without dampers too."""
        _, _, D0 = self.run_fault({g: {'model': 'two_axis', **BASE[g]} for g in BASE})
        _, _, D1 = self.run_fault({g: {'model': 'two_axis', **FULL[g], 'pss': {'KS': 0.0}} for g in BASE})     # a PSS without gain: a Unit
        _, _, D2 = self.run_fault({g: {'model': 'subtransient', **FULL[g]} for g in BASE})                   # T″ = 0 in the data
        self.assertLess(float(np.max(np.abs(D1 - D0))), 1e-7)
        self.assertLess(float(np.max(np.abs(D2 - D0))), 1e-7)

    def test_short_circuit_time_constants(self):
        """At V = 0 the circuits of each axis decay with the short-circuit time constants: their product is T′_0·T″_0·X″/X exactly
        (the operational reactance at infinite frequency is X″), and each is within 1 % of the classical T′_0·X′/X, T″_0·X″/X′."""
        d = {'Xd': 1.81, 'Xdp': 0.3, 'Xdpp': 0.23, 'Xq': 1.76, 'Xqp': 0.65, 'Xqpp': 0.25, 'Xl': 0.15, 'Td0p': 8.0, 'Td0pp': 0.03, 'Tq0p': 1.0,
             'Tq0pp': 0.07, 'Ra': 0.0, 'H': 3.5, 'D': 0.0, 'SG10': 0.0, 'SG12': 0.0}
        U = rms.Unit(['G'], [0], {k: np.array([v]) for k, v in d.items()}, model='subtransient')
        U.init(np.array([1.0 + 0j]), np.array([0j]), WR)
        x0 = np.array([0.3, 1.0, 1.0, 0.1, 0.9, -0.1])
        J = np.zeros((6, 6))
        for j in range(6):
            X = np.zeros((1, U.nx), complex)
            X[0, :6] = x0
            X[0, j] += 1e-30j
            J[:, j] = U.eval(X, np.zeros(1, complex), np.zeros(1, complex), 0.0)[0][0, :6].imag / 1e-30
        for ix, (Xs, Xp, Xpp, T1, T2) in (([2, 4], (d['Xd'], d['Xdp'], d['Xdpp'], d['Td0p'], d['Td0pp'])), ([3, 5], (d['Xq'], d['Xqp'], d['Xqpp'], d['Tq0p'], d['Tq0pp']))):
            T = sorted(-1 / np.linalg.eigvals(J[np.ix_(ix, ix)]).real)
            self.assertAlmostEqual(T[0] * T[1] / (T1 * T2 * Xpp / Xs), 1.0, delta=1e-12)
            self.assertAlmostEqual(T[0] / (T2 * Xpp / Xp), 1.0, delta=0.01)
            self.assertAlmostEqual(T[1] / (T1 * Xp / Xs), 1.0, delta=0.01)

    def test_the_jacobian_by_complex_step(self):
        """The Jacobian of a Unit with every control, by the complex step, against central differences away from rest (and
        away from a limit: the V_R of the DC1A with wide limits, since a state held at its limit is a corner of f)."""
        m = {'G1': {'model': 'subtransient', **FULL['G1'], **DAMP['G1'], 'avr': {'type': 'dc1a', 'VRMAX': 50.0, 'VRMIN': -50.0},
                    'gov': {'type': 'hydro', 'Pr': PR['G1']}},
             'G2': {'model': 'subtransient', **FULL['G2'], **DAMP['G2'], 'SG10': 0.1, 'SG12': 0.4, 'avr': {'type': 'st1a', 'TA': 0.02, 'KF': 0.05, 'TB': 1.0, 'TC': 0.5},
                    'pss': True, 'gov': {'type': 'steam', 'Pr': PR['G2']}},
             'G3': {'model': 'two_axis', **FULL['G3'], 'avr': {'type': 'st1a'}, 'pss': True}}
        s = rms.System(N.ieee9(), machines=m, f=60)
        s.init()
        r = s.simulate(0.15, events=FAULT[:1], h=0.002)                 # a point inside the fault
        x, y = r['x'][-1], np.r_[r['V'][-1].real, r['V'][-1].imag]
        J = s.jac(x, y).toarray()
        z = np.r_[x, y]
        worst = 0.0
        for j in range(s.nx):
            e = np.zeros_like(z)
            e[j] = 1e-6 * max(1.0, abs(z[j]))
            fp, gp = s.fg((z + e)[:s.nx], (z + e)[s.nx:])
            fm, gm = s.fg((z - e)[:s.nx], (z - e)[s.nx:])
            col = (np.r_[fp, gp] - np.r_[fm, gm]) / (2 * e[j])
            worst = max(worst, float(np.max(np.abs(col - J[:, j])) / (1 + np.max(np.abs(col)))))
        self.assertLess(worst, 1e-5)

    def test_a_limit_reached_inside_a_step(self):
        """The holds of the limits without windup are those of the start of each step, and a state that passes its limit
        inside the step stops there: on the IEEE 118 with typical data, after the loss of its largest unit, the valve of a
        steam governor reaches its full opening inside a step. Decided at every Newton iteration, that step had no solution
        (the valve landed below the limit when held and above it when not)."""
        net = N.ieee(118)
        pf = net.power_flow()
        ty = rms.typical(net, pf=pf)
        s = rms.System(net, machines=ty, pf=pf)
        s.init()
        big = max(ty, key=lambda g: pf['buses'][net.element(g)['bus']]['P'])
        r = s.simulate(2.0, events=[{'t': 0.1, 'kind': 'gen', 'gen': big}], h=0.01, slow_after=8)
        self.assertEqual(r['stats']['nonconv'], 0)
        at = 0
        for K in s.kinds:
            if isinstance(K, rms.Unit):
                for j, base, lo, hi, on in K.limits():
                    v = base + r['x'][:, K.x0:K.x0 + K.nx * K.m].reshape(len(r['t']), K.m, K.nx)[:, :, j]
                    self.assertTrue(np.all((v >= lo - 1e-12) & (v <= hi + 1e-12)))
                    at += int(np.sum(np.any(np.abs(v - hi) < 1e-12, axis=0)))
        self.assertGreater(at, 0)                                                                   # valves at full opening

    def test_nothing_moves_with_every_control(self):
        """From the load flow every model starts at rest: ST1A (with lead–lag, T_A, rate feedback) and DC1A, PSS, steam and water."""
        m = {'G1': {'model': 'subtransient', **FULL['G1'], **DAMP['G1'], 'avr': {'type': 'dc1a'}, 'gov': {'type': 'hydro', 'Pr': PR['G1']}},
             'G2': {'model': 'subtransient', **FULL['G2'], **DAMP['G2'], 'SG10': 0.1, 'SG12': 0.4, 'avr': {'type': 'st1a', 'TA': 0.02, 'KF': 0.05, 'TB': 1.0, 'TC': 0.5},
                    'pss': True, 'gov': {'type': 'steam', 'Pr': PR['G2']}},
             'G3': {'model': 'two_axis', **FULL['G3'], 'avr': {'type': 'st1a'}, 'pss': True, 'gov': {'type': 'steam', 'Pr': PR['G3']}}}
        s = rms.System(N.ieee9(), machines=m, f=60)
        r0 = s.init()
        self.assertLess(max(r0['f'], r0['g']), 1e-12)
        r = s.simulate(5.0, h=0.01)
        self.assertLess(float(np.max(np.abs(r['x'] - r['x'][0]))), 1e-12)

    def test_saturation_on_the_field(self):
        """With the saturation factors S_G1,0 and S_G1,2 the field needs E_Δ = S(|E″|)·E″_q/|E″| more at the start, S through
        S_G1,0 at 1,0 pu and 1,2·S_G1,2 at 1,2 pu (the reference book, §5.10 and App. D)."""
        base = {'model': 'subtransient', **FULL['G2'], **DAMP['G2']}
        q = {}
        for sat in ((0.0, 0.0), (0.1, 0.4)):
            s = rms.System(N.ieee9(), machines={'G2': {**base, 'SG10': sat[0], 'SG12': sat[1], 'avr': {'type': 'st1a'}}}, f=60)
            s.init()
            K = next(k for k in s.kinds if isinstance(k, rms.Unit))
            X = s.x0[K.x0:K.x0 + K.nx].reshape(1, K.nx)
            out = K._machine(X, s.V0[K.bus].real, s.V0[K.bus].imag)
            q[sat] = (float(K.p['Efd0'][0]), float(out[8][0]), float(out[9][0]))
        e0, (e1, Eq, Ed) = q[(0.0, 0.0)][0], q[(0.1, 0.4)]
        Ag, Bg = 0.1 ** 2 / (1.2 * 0.4), 5 * math.log(1.2 * 0.4 / 0.1)
        self.assertAlmostEqual(Ag * math.exp(Bg * (1.0 - 0.8)), 0.1, delta=1e-12)                   # through the two points
        self.assertAlmostEqual(Ag * math.exp(Bg * (1.2 - 0.8)), 1.2 * 0.4, delta=1e-12)
        E2 = math.hypot(Eq, Ed)
        self.assertAlmostEqual(e1 - e0, Ag * math.exp(Bg * (E2 - 0.8)) * Eq / E2, delta=1e-12)

    def test_exponential_loads(self):
        """P ∝ |V|^a, Q ∝ |V|^b with a = b = 2 is the constant impedance."""
        m = {g: {'model': 'two_axis', **FULL[g], 'avr': {'type': 'st1a'}} for g in FULL}
        _, _, Dz = self.run_fault(m)
        _, _, De = self.run_fault(m, loads={'a': 2.0, 'b': 2.0})
        self.assertLess(float(np.max(np.abs(Dz - De))), 1e-7)

    def test_events_of_the_units(self):
        """The trip of a unit (out of the centre of inertia): the frequency falls and the steam governor opens; a step of the
        reference of an AVR moves its E_fd and its voltage; of a governor, its power."""
        m = {g: {'model': 'two_axis', **FULL[g], 'avr': {'type': 'st1a'}, 'pss': True, 'gov': {'type': 'hydro' if g == 'G1' else 'steam', 'Pr': PR[g]}} for g in FULL}
        net = N.ieee9()
        r = net.dynamic(t_end=4.0, h=0.02, machines=m, f=60, events=[{'t': 0.5, 'kind': 'gen', 'gen': 'G3'}], buses=[])
        f, t = np.array(r['f_coi']), np.array(r['t'])
        self.assertTrue(r['stable'])
        self.assertLess(f[-1], 59.5)                                                                # 85 MW of 315 out
        Tm = np.array(r['machines']['G2']['Tm'])
        self.assertGreater(Tm[-1], Tm[0] + 0.1)                                                     # the steam governor opens
        self.assertEqual(float(np.max(np.abs(np.array(r['machines']['G3']['P'])[t > 0.5]))), 0.0)
        r = net.dynamic(t_end=2.0, h=0.01, machines=m, f=60, events=[{'t': 0.1, 'kind': 'vref', 'gen': 'G2', 'dV': 0.02}], buses=[])
        E, V = np.array(r['machines']['G2']['Efd']), np.array(r['machines']['G2']['V'])
        self.assertGreater(E.max(), E[0] + 1.0)                                                     # K_A·ΔV at the step
        self.assertGreater(V[-1], V[0] + 0.01)
        r = net.dynamic(t_end=5.0, h=0.02, machines=m, f=60, events=[{'t': 0.1, 'kind': 'pref', 'gen': 'G2', 'dP': 0.05}], buses=[])
        P = np.array(r['machines']['G2']['P'])
        self.assertGreater(P[-1], P[0] + 1.0)                                                       # MW
        with self.assertRaises(rms.RMSError):
            net.dynamic(t_end=0.2, machines={'G1': {'model': 'two_axis', **FULL['G1'], 'pss': True}}, f=60, events=[{'t': 0.1, 'kind': 'vref', 'gen': 'G1', 'dV': 0.01}])

    def test_what_is_refused(self):
        net = N.ieee9()
        for m in ({'G1': {'model': 'classical', 'avr': {'type': 'st1a'}}}, {'G1': {'model': 'two_axis', 'avr': {'type': 'st1a', 'KF': 0.1, 'TF': 1.0}}},
                  {'G1': {'model': 'two_axis', 'avr': {'type': 'ac9z'}}}, {'G1': {'model': 'two_axis', 'gov': {'type': 'gas'}}}):
            with self.assertRaises(rms.RMSError):
                rms.System(net, machines=m, f=60)

    def test_typical_data_of_a_large_network(self):
        """typical='af': every generator of the IEEE 118 with the machine of the reference book on its own rating, an ST1A and a
        governor; at rest from its load flow, stable after a fault, and every unit that absorbs Q within its limit."""
        net = N.ieee(118)
        pf = net.power_flow()
        ty = rms.typical(net, pf=pf)
        self.assertEqual(len(ty), 54)
        for g, d in ty.items():
            e = net.element(g)
            Q = pf['buses'][e['bus']]['Q']
            self.assertLessEqual(max(-Q, 0.0) / d['Sn'], 1 / (2 * d['Xd']) + 1e-12)
        bus = max(ty, key=lambda g: pf['buses'][net.element(g)['bus']]['P'])
        b = net.element(bus)['bus']
        r = net.dynamic(t_end=2.0, h=0.01, typical='af', pf=pf, events=[{'t': 0.1, 'kind': 'fault', 'bus': b, 'z': 0.01j}, {'t': 0.2, 'kind': 'clear', 'bus': b}], buses=[])
        self.assertLess(max(r['start']['f'], r['start']['g']), 1e-9)
        self.assertTrue(r['stable'])
        self.assertEqual(r['stats']['nonconv'], 0)


class Drawing(unittest.TestCase):
    """The RMS of a drawing (pcl.model, the card «Δυναμική RMS»): the machines and their controls, the events of the drawing, and
    the EMT of the same drawing."""

    def test_the_drawing_and_its_emt(self):
        from pcl import model, study
        m = drawing({'ev': 'full', 'ctl': 'avr_pss'})
        mach, notes = model.machines_of(m)
        self.assertEqual({g: (d['model'], d['avr']['type'], bool(d.get('pss')), d.get('gov')) for g, d in mach.items()},
                         {g: ('two_axis', 'st1a', True, None) for g in ('G1', 'G2', 'G3')})
        q = study.run({'drawing': m, 'study': 'rms', 'options': {'t_end': 5.0, 'h': 0.005, 'record': 0.002}})
        json.dumps(q, allow_nan=False)
        res = q['result']
        self.assertTrue(res['stable'])
        self.assertEqual([e['kind'] for e in res['events']], ['fault', 'trip', 'clear', 'trip'])  # the fault, and the breakers CB8 and CB9 open
        te, De, _ = emt(5.0, 'full', 'avr_pss')
        t, M = np.array(res['t']), res['machines']
        for j, g in ((1, 'G2'), (2, 'G3')):
            R = np.interp(te, t, np.array(M[g]['delta']) - np.array(M['G1']['delta']))
            E = De[:, j] - De[:, 0]
            self.assertAlmostEqual(R.max(), E.max(), delta=1.5)                                     # the first swing: 119,2° and 119,8° (G2)
            self.assertAlmostEqual(te[np.argmax(R)], te[np.argmax(E)], delta=0.02)
            self.assertLess(float(np.max(np.abs(R - E))), 3.0)                                      # over 5 s: 2,0° and 1,3°
        rep = study.report({'drawing': m, 'study': 'rms', 'options': {'t_end': 1.0, 'h': 0.01}})
        self.assertIn('Γωνίες των δρομέων', rep['html'])
        self.assertEqual(rep['name'], 'report_network_rms.html')

    def test_the_governors_and_the_dampers_against_the_emt(self):
        """With the governors of the drawing (water on G1, steam on G2 and G3); and the subtransient model with the dampers of
        DAMP on both sides, after a step of the reference of the AVR of G2."""
        from pcl import study
        m = drawing({'ev': 'full', 'ctl': 'full'})
        res = study.run({'drawing': m, 'study': 'rms', 'options': {'t_end': 3.0, 'h': 0.005, 'record': 0.002}})['result']
        self.assertEqual({g: res['machines'][g]['controls']['gov'] for g in ('G1', 'G2', 'G3')}, {'G1': 'hydro', 'G2': 'steam', 'G3': 'steam'})
        te, De, _ = emt(3.0, 'full', 'full')
        R = np.interp(te, np.array(res['t']), np.array(res['machines']['G2']['delta']) - np.array(res['machines']['G1']['delta']))
        self.assertLess(float(np.max(np.abs(R - (De[:, 1] - De[:, 0])))), 3.0)
        over = {**{g: dict(v, Xl=N.IEEE9_MACHINES[g]['Xl']) for g, v in DAMP.items()}, 'AV2': {'dV': '0:0, 0.1:0.03'}}
        te, De, Ye = emt(3.0, 'none', 'avr_pss', over)
        mm = {g: {'model': 'subtransient', **FULL[g], **DAMP[g], 'avr': {'type': 'st1a'}, 'pss': True} for g in FULL}
        r = N.ieee9().dynamic(t_end=3.0, h=0.002, record=0.002, machines=mm, f=60, events=[{'t': 0.1, 'kind': 'vref', 'gen': 'G2', 'dV': 0.03}], buses=[])
        t, M = np.array(r['t']), r['machines']
        for j, g in ((1, 'G2'), (2, 'G3')):
            R = np.interp(te, t, np.array(M[g]['delta']) - np.array(M['G1']['delta']))
            self.assertLess(float(np.max(np.abs(R - (De[:, j] - De[:, 0])))), 0.5)                 # of swings of 5° and 4°
        for i, g in enumerate(('G1', 'G2', 'G3')):
            self.assertLess(float(np.max(np.abs(np.interp(te, t, M[g]['V']) - Ye[:, 6 + i]))), 3e-3)


if __name__ == '__main__':
    unittest.main()
