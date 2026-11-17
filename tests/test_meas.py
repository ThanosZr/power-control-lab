"""4.19.6 (ROADMAP §76, THEORY §8Ρ and §8Σ): the blocks that measure a signal inside the simulation and give the result as a signal: mean
value (AVG), RMS, lowest and highest value per period (MNMX), one harmonic (FOUR) and the total harmonic distortion (THD), over a window of
periods that runs with the time or closes once per period (web/studio/mna.js evalBlocks, engine/batch.py eval_blocks). The numbers come
from tests/js/meas_cases.js; every expected value here is a closed form, the period statistics or the harmonics of the scope, or the
other solver."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

from engine.batch import simulate

CASES = Path(__file__).resolve().parent / 'js' / 'meas_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the cases run web/studio/mna.js).')
class MeasuringBlocks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=600)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.o = json.loads(run.stdout)

    def table(self, name):
        """{t: {channel: value}} of one case."""
        c = self.o[name]
        return {row[0]: dict(zip((k.split(':', 1)[1] for k in c['keys']), row[1:])) for row in c['at']}

    def test_sine_with_offset(self):
        # v = 50 + 325·sin(2π·50·t). The mean is 50. Between the points of the solver the input is a straight line, so the mean square of
        # the sine part is (A²/2)·(2 + cos(2π/N))/3 with N points per period: the value the block must give, and 2,0e-5 below the RMS of
        # the sine itself at N = 400
        A, off = 325.0, 50.0
        exact = math.sqrt(off * off + A * A / 2)
        errs = {}
        for N in (400, 1600):
            c = self.o['sine%d' % N]
            self.assertEqual(c['warn'], [])
            t = self.table('sine%d' % N)
            line = math.sqrt(off * off + A * A / 2 * (2 + math.cos(2 * math.pi / N)) / 3)
            for tt in (.02, .0275, .04, .0613, .1, .3):
                r = t[tt]
                for k in ('A1', 'A2', 'A3'):
                    self.assertAlmostEqual(r[k], off, delta=1e-9, msg=(N, tt, k))
                for k in ('Q1', 'Q2', 'Q3'):
                    self.assertAlmostEqual(r[k] / line, 1, delta=1e-10, msg=(N, tt, k))
                self.assertAlmostEqual(r['M1'], off - A, delta=1e-9)
                self.assertAlmostEqual(r['M1:max'], off + A, delta=1e-9)
                self.assertAlmostEqual(r['M1:pp'], 2 * A, delta=1e-9)
                self.assertAlmostEqual(r['Q4'] / line if tt >= .04 else r['Q4'] + 1, 1, delta=1e-10, msg=(N, tt))   # two periods per window
            errs[N] = t[.02]['Q1'] / exact - 1
            # before the first window is full: the initial output, or the measure from the start up to now
            r = t[.005]
            self.assertEqual([r['A1'], r['Q1'], r['A2'], r['Q2'], r['Q4'], r['A3']], [0, 0, 0, 0, 0, 7])
            self.assertEqual([r['M1'], r['M1:max'], r['M1:pp']], [0, 0, 0])
            h, n = .02 / N, N // 4
            u = off + A * np.sin(2 * np.pi * 50 * h * np.arange(n + 1))
            grow = math.sqrt(float(np.sum(h * (u[:-1] ** 2 + u[:-1] * u[1:] + u[1:] ** 2) / 3)) / .005)
            self.assertAlmostEqual(r['Q3'] / grow, 1, delta=1e-10)
            # the ring of the running window keeps the points of one window, not of the whole run (15 periods)
            self.assertLess(c['ring'][0], 2.6 * N)
        self.assertAlmostEqual(errs[400], -1.963e-5, delta=2e-8)
        self.assertAlmostEqual(errs[400] / errs[1600], 16, delta=.01)             # second order in the step

    def test_straight_segments_are_exact(self):
        # triangle and sawtooth 0…1: mean 1/2, RMS 1/√3; a clock with duty 0,3: mean 0,3, RMS √0,3 (a jump at every edge). The value before
        # a reset of the sawtooth is read a millionth of a step before it, which is the 2,5e-9 below
        for name in ('shapes', 'shapes_var'):
            self.assertEqual(self.o[name]['warn'], [])
            t = self.table(name)
            for tt in (.001, .00237, .004, .01, .0503):
                r = t[tt]
                self.assertAlmostEqual(r['At'], .5, delta=1e-12, msg=(name, tt))
                self.assertAlmostEqual(r['Qt'], 1 / math.sqrt(3), delta=1e-9)
                self.assertEqual([r['Mt'], r['Mt:max'], r['Mt:pp']], [0, 1, 1])
                self.assertAlmostEqual(r['As'], .5, delta=1e-8)
                self.assertAlmostEqual(r['Qs'], 1 / math.sqrt(3), delta=1e-8)
                self.assertAlmostEqual(r['Aq'], .3, delta=1e-12)
                self.assertAlmostEqual(r['Qq'], math.sqrt(.3), delta=1e-12)
                self.assertAlmostEqual(r['Aq2'], .3, delta=1e-12)
                self.assertAlmostEqual(r['Qc'], 1 / math.sqrt(3), delta=1e-8)                 # the period from the block Ρολόι
                self.assertEqual([r['Mc'], r['Mc:max']], [0, 1])
                self.assertAlmostEqual(r['Q3'], 1 / math.sqrt(3) if tt >= .003 else 0, delta=1e-9)   # three periods per window
            self.assertTrue(all(v == 0 for v in t[.0005].values()))                           # nothing before the first period ends

    def test_running_window_on_a_step(self):
        # the input goes 0 → 1 at 3,3 ms and 1 → 3 at 8 ms. Window of 1 ms: the mean rises along a straight line for one window. With the
        # frequency as an input (1 kHz, 2 kHz from 6 ms) the second rise takes half the time
        t = self.table('step')
        self.assertEqual(self.o['step']['warn'], [])
        want = {.003: (0, 0, 0), .0035: (.2, .2, math.sqrt(.2)), .0038: (.5, .5, math.sqrt(.5)), .0043: (1, 1, 1), .005: (1, 1, 1),
                .0081: (1.2, 1.4, math.sqrt(1.8)), .00825: (1.5, 2, math.sqrt(3)), .0085: (2, 3, math.sqrt(5)), .0091: (3, 3, 3)}
        for tt, (a1, a2, q1) in want.items():
            self.assertAlmostEqual(t[tt]['A1'], a1, delta=1e-11, msg=tt)
            self.assertAlmostEqual(t[tt]['A2'], a2, delta=1e-11, msg=tt)
            self.assertAlmostEqual(t[tt]['Q1'], q1, delta=1e-11, msg=tt)

    def test_per_period_is_the_statistics_of_the_scope(self):
        # the same integrals as recordNow / closePeriod; the scope keeps its period statistics in single precision
        for name in ('scope_fixed', 'scope_var'):
            for r in self.o[name]:
                for k in ('avg', 'rms', 'min', 'max'):
                    blk, scope = r[k]
                    self.assertAlmostEqual(blk, scope, delta=4e-7 * max(1.0, abs(scope)), msg=(name, r['t'], k))

    def test_saved_state(self):
        # a run continued from a saved state gives the numbers of the run that did not stop, bit for bit (the ring is plain data)
        self.assertEqual(self.o['resume']['diff'], 0)

    def test_scipy_gives_the_same(self):
        # engine/batch.py does the same operations at the ends of its segments. A sine has other points per period there, so its RMS differs
        # in the fifth digit; signals of straight segments agree to the value read before a jump
        for name, tol in (('batch_sine', {'Q': 1e-4}), ('batch_shapes', {})):
            q = self.o[name]
            r = simulate({'net': q['net'], 'channels': q['channels'], 't_end': q['at'][-1][0], 'method': 'Radau'})
            self.assertEqual(r['status'], 'ok')
            t = np.array(r['t'])
            for row in q['at']:
                i = int(np.where(t <= row[0] + 1e-12)[0][-1])
                for k, v in zip(q['keys'], row[1:]):
                    d = tol.get(k.split(':')[1][0], 1e-6)
                    self.assertAlmostEqual(r['ch'][k][i], v, delta=d * max(1.0, abs(v)), msg=(name, row[0], k))

    # ---- Fourier and THD (THEORY §8Σ)
    @staticmethod
    def wrap(d):
        return (d + 180) % 360 - 180

    def check_harmonic(self, r, k, a, b, msg, tol=1e-9, cos=False, nu=1, pt=1e-6):
        """The five outputs of a FOUR block against the coefficients a, b of u ≈ a·cos(νω₁t) + b·sin(νω₁t)."""
        m = math.hypot(a, b) if nu > 0 else abs(a)
        self.assertAlmostEqual(r[k], m, delta=tol, msg=msg)
        self.assertAlmostEqual(r[k + ':a'], a, delta=tol, msg=msg)
        self.assertAlmostEqual(r[k + ':b'], b, delta=tol, msg=msg)
        self.assertAlmostEqual(r[k + ':rms'], m / math.sqrt(2) if nu > 0 else m, delta=tol, msg=msg)
        if m > 1e-6:
            ph = math.degrees(math.atan2(-b, a) if cos else math.atan2(a, b)) if nu > 0 else (180.0 if a < 0 else 0.0)
            self.assertAlmostEqual(self.wrap(r[k + ':ph'] - ph), 0, delta=pt, msg=msg)

    def test_fourier_and_thd_of_straight_segments(self):
        # A clock with duty d = 0,3: a_ν = sin(2πνd)/(πν), b_ν = (1 − cos(2πνd))/(πν), the mean d. A triangle that starts at 1: 1/2 plus
        # 4/(π²ν²)·cos(νω₁t) for odd ν. A sawtooth 0…1: 1/2 − sin(νω₁t)/(πν) (the value before a corner or a reset is read a millionth
        # of a step early: the 1e-8 and the 1e-5° below). All exact over the steps of the solver, with the fixed and with the variable step
        d = .3
        ab = lambda n: (math.sin(2 * math.pi * n * d) / (math.pi * n), (1 - math.cos(2 * math.pi * n * d)) / (math.pi * n)) if n else (d, 0.0)
        V1 = math.hypot(*ab(1)) / math.sqrt(2)
        tri1 = 4 / math.pi ** 2 / math.sqrt(2)
        saw1 = 1 / math.pi / math.sqrt(2)
        for name in ('four', 'four_var'):
            self.assertEqual(self.o[name]['warn'], [])
            t = self.table(name)
            for tt in (.001, .00237, .004, .0103):
                r, msg = t[tt], (name, tt)
                for n in (0, 1, 2, 3, 5):
                    self.check_harmonic(r, 'Fq%d' % n, *ab(n), msg=msg + (n,), nu=n)
                self.check_harmonic(r, 'Fc3', *ab(3), msg=msg, cos=True, nu=3)              # the phase from cos(νω₁t)
                self.check_harmonic(r, 'Fp1', *ab(1), msg=msg)                              # per period
                self.check_harmonic(r, 'Fk2', *ab(2), msg=msg, nu=2)                        # per period, the period from a clock
                self.check_harmonic(r, 'Fi1', *ab(1), msg=msg)                              # 2 kHz from the frequency input
                if tt >= .003:
                    self.check_harmonic(r, 'F3w', *ab(2), msg=msg, nu=2)                    # three periods per window
                self.check_harmonic(r, 'Ft1', 4 / math.pi ** 2, 0, msg=msg, tol=1e-8, cos=True, pt=1e-5)
                self.check_harmonic(r, 'Ft3', 4 / (9 * math.pi ** 2), 0, msg=msg, tol=1e-8, cos=True, nu=3, pt=1e-5)
                self.assertAlmostEqual(r['Ft2'], 0, delta=1e-8)                              # no even harmonics in the triangle
                self.check_harmonic(r, 'Fs1', 0, -1 / math.pi, msg=msg, tol=1e-8, pt=1e-5)
                self.check_harmonic(r, 'Fs4', 0, -1 / (4 * math.pi), msg=msg, tol=1e-8, nu=4, pt=1e-5)
                self.check_harmonic(r, 'Fg', 0, 2 / math.pi, msg=msg)                      # a clock of duty 0,5 once the first window is full
                self.check_harmonic(r, 'Fy', *ab(1), msg=msg)
                # THD: U_H² = U² − U₁² (IEEE Std 1459, with the DC component), or without it, as a ratio or in per cent
                self.assertAlmostEqual(r['Hq'], math.sqrt(d - V1 ** 2) / V1, delta=1e-9, msg=msg)
                self.assertAlmostEqual(r['Hq:h1'], V1, delta=1e-12)
                self.assertAlmostEqual(r['Hq:hh'], math.sqrt(d - V1 ** 2), delta=1e-9)
                self.assertAlmostEqual(r['Hq:rms'], math.sqrt(d), delta=1e-12)
                self.assertAlmostEqual(r['Ho'], 100 * math.sqrt(d - d * d - V1 ** 2) / V1, delta=1e-7, msg=msg)
                self.assertAlmostEqual(r['Hp'], math.sqrt(d - d * d - V1 ** 2) / V1, delta=1e-9, msg=msg)
                self.assertAlmostEqual(r['Ht'], math.sqrt(1 / 12 - tri1 ** 2) / tri1, delta=1e-7, msg=msg)   # triangle: 12,1 %
                self.assertAlmostEqual(r['Hk'], math.sqrt(1 / 12 - saw1 ** 2) / saw1, delta=1e-7, msg=msg)   # sawtooth: 80,3 %
            # before the first window: the initial output (a harmonic of magnitude y0 at the phase 0), or the window from the start
            r = t[.0005]
            self.assertEqual([r['Fq1'], r['Fq1:ph'], r['Fp1'], r['Hq'], r['Hq:h1'], r['Hp']], [0, 0, 0, 0, 0, 0])
            self.assertEqual([r['Fy'], r['Fy:ph'], r['Fy:a'], r['Fy:b']], [2, 0, 0, 2])
            self.assertAlmostEqual(r['Fy:rms'], math.sqrt(2), delta=1e-15)
            self.check_harmonic(r, 'Fg', 0, 4 / math.pi, msg=name)                         # half a period of 1: b = 4/π
            ring = self.o[name]['ring']
            self.assertLess(ring[0], 512 + 2 * 200)                                         # the ring keeps a window, not the run (2060 points)
            self.assertEqual(ring[1], 2 * ring[0])                                          # two terms per point
        self.assertEqual(self.o['four_resume']['diff'], 0)                                  # a saved state, bit for bit

    def test_fourier_and_thd_of_a_voltage(self):
        # v = 50 + 325·sin(ω₁t + 30°) + 30·sin(5ω₁t − 60°) across a resistor. Between the points of the solver the input is a straight
        # line: its harmonic ν is that of the sine times sinc²(πν/N) with N points per period, at the same phase, and its mean square is
        # 50² + Σ (A²/2)·(2 + cos(2πν/N))/3. The harmonics of the scope (Metrics.harmonics on the recorded points) are another code
        for N in (400, 1600):
            c = self.o['harm%d' % N]
            self.assertEqual(c['warn'], [])
            sc = lambda n: (math.sin(math.pi * n / N) / (math.pi * n / N)) ** 2
            A1, A5 = 325 * sc(1), 30 * sc(5)
            V2 = 2500 + 325 ** 2 / 2 * (2 + math.cos(2 * math.pi / N)) / 3 + 30 ** 2 / 2 * (2 + math.cos(10 * math.pi / N)) / 3
            V1 = A1 / math.sqrt(2)
            for row in c['at']:
                r = dict(zip((k.split(':', 1)[1] for k in c['keys']), row[1:]))
                self.assertAlmostEqual(r['A1'] / A1, 1, delta=1e-10, msg=(N, row[0]))
                self.assertAlmostEqual(r['A5'] / A5, 1, delta=1e-10)
                self.assertAlmostEqual(r['C5'] / A5, 1, delta=1e-10)
                self.assertAlmostEqual(self.wrap(r['A1:ph'] - 30), 0, delta=1e-9)
                self.assertAlmostEqual(self.wrap(r['A5:ph'] + 60), 0, delta=1e-9)
                self.assertAlmostEqual(self.wrap(r['C5:ph'] + 150), 0, delta=1e-9)       # cos: the phase of sin minus 90°
                self.assertAlmostEqual(r['A0'], 50, delta=1e-9)
                self.assertAlmostEqual(r['T1:rms'] / math.sqrt(V2), 1, delta=1e-10)
                self.assertAlmostEqual(r['T1:h1'] / V1, 1, delta=1e-10)
                self.assertAlmostEqual(r['T1'], math.sqrt(V2 - V1 * V1) / V1, delta=1e-9)
                self.assertAlmostEqual(r['T0'], math.sqrt(V2 - V1 * V1 - 2500) / V1, delta=1e-8)
                self.assertAlmostEqual(r['TP'], r['T1'], delta=1e-9)
            # 30/325 = 0,0923 for the sine itself; the straight line between the points gives 0,09226 at N = 400
            self.assertAlmostEqual(r['T0'], 30 / 325, delta=(5e-5 if N == 400 else 4e-6))
            s, r = c['scope'], dict(zip((k.split(':', 1)[1] for k in c['keys']), c['at'][-1][1:]))
            self.assertAlmostEqual(r['A1'] / s['A1'], 1, delta=1e-8)
            self.assertAlmostEqual(r['A5'] / s['A5'], 1, delta=1e-7)
            w = 360 * 50 * s['ta']                                                           # the scope: cos, from the start of its window
            self.assertAlmostEqual(self.wrap(r['A1:ph'] - 90 + s['ph1'] + w), 0, delta=1e-6)
            self.assertAlmostEqual(self.wrap(r['A5:ph'] - 90 + s['ph5'] + 5 * w), 0, delta=1e-5)

    def test_interharmonic(self):
        # 325·sin(ω₁t) + 20·sin(2,5·ω₁t + 10°): with two periods per window the 125 Hz line is ν = 2,5, at 20·sinc²(2,5π/N) and 10°
        c = self.o['inter']
        self.assertEqual(c['warn'], [])
        N = c['N']
        sc = lambda n: (math.sin(math.pi * n / N) / (math.pi * n / N)) ** 2
        for row in c['at']:
            r = dict(zip((k.split(':', 1)[1] for k in c['keys']), row[1:]))
            self.assertAlmostEqual(r['F'] / (20 * sc(2.5)), 1, delta=1e-10)
            self.assertAlmostEqual(self.wrap(r['F:ph'] - 10), 0, delta=1e-9)
            self.assertAlmostEqual(r['F1'] / (325 * sc(1)), 1, delta=1e-10)
            self.assertAlmostEqual(self.wrap(r['F1:ph']), 0, delta=1e-9)

    # ---- power and sequences (THEORY §8Τ)
    def power_table(self):
        c = self.o['power']
        self.assertEqual(c['warn'], [])
        N = c['N']
        s2 = (math.sin(math.pi / N) / (math.pi / N)) ** 2                      # a sine sampled N times per period, straight between
        ln = lambda n: (2 + math.cos(2 * math.pi * n / N)) / 3                  # the mean square of the straight line, per A²/2
        return c, N, s2, ln, {row[0]: dict(zip((k.split(':', 1)[1] for k in c['keys']), row[1:])) for row in c['at']}

    def test_single_phase_power(self):
        # v = 325·sin(ω₁t), i = 20·sin(ω₁t − 30°) + 5·sin(3ω₁t + 10°) + 2 (IEEE Std 1459 §3.1.2): P = (1/T)∫v·i, P₁ + jQ₁ = V₁·I₁*
        # (Q₁ > 0: the current lags), S = V·I, PF = P/S, PF₁ = P₁/S₁ = cos 30°. Over the straight lines between the points of the
        # solver: P = 3250·cos 30°·(2 + cos(2π/N))/3, and the fundamentals times sinc²(π/N) each (1e-9: the value before the instant
        # of an expression of t is read a millionth of a step early)
        c, N, s2, ln, t = self.power_table()
        V = 325 / math.sqrt(2) * math.sqrt(ln(1))
        I = math.sqrt(4 + 20 ** 2 / 2 * ln(1) + 5 ** 2 / 2 * ln(3))
        P = 3250 * math.cos(math.pi / 6) * ln(1)
        for tt in (.02, .0313, .06, .1):
            for k in ('W1', 'W2'):                                             # running and per period
                r, msg = t[tt], (tt, k)
                self.assertAlmostEqual(r[k] / P, 1, delta=1e-9, msg=msg)
                self.assertAlmostEqual(r[k + ':p1'] / (3250 * math.cos(math.pi / 6) * s2 * s2), 1, delta=1e-9, msg=msg)
                self.assertAlmostEqual(r[k + ':q1'] / (3250 * .5 * s2 * s2), 1, delta=1e-9, msg=msg)
                self.assertAlmostEqual(r[k + ':s'] / (V * I), 1, delta=1e-9, msg=msg)
                self.assertAlmostEqual(r[k + ':pf'], P / (V * I), delta=1e-9, msg=msg)
                self.assertAlmostEqual(r[k + ':pf1'], math.cos(math.pi / 6), delta=1e-9, msg=msg)
        self.assertEqual([t[.01]['W1'], t[.01]['W1:q1'], t[.01]['W2']], [0, 0, 0])            # before the first window
        # a known load: 325 V on R = 10 Ω and L = 31,83 mH. The trapezoidal rule sees the reactance (2L/h)·tan(ω₁h/2) at the step h,
        # and the solver puts 1e-9 S from every node to ground (GMIN, web/studio/mna.js): the admittance after the ammeter is
        # Y = G + 1/(R + 1/(1/(jX_d) + G)), and P₁ + jQ₁ = (V̂²/2)·Y*·sinc⁴(π/N)
        R, L, w, G = 10.0, .03183, 2 * math.pi * 50, 1e-9
        c = self.o['rl']
        self.assertEqual(c['warn'], [])
        h = c['h']
        Xd = 2 * L / h * math.tan(w * h / 2)
        Y = G + 1 / (R + 1 / (1 / (1j * Xd) + G))
        f4 = ((math.sin(math.pi / 400) / (math.pi / 400)) ** 2) ** 2
        for row in c['at']:
            r = dict(zip((k.split(':', 1)[1] for k in c['keys']), row[1:]))
            self.assertAlmostEqual(r['W:p1'] / (325 ** 2 / 2 * Y.real * f4), 1, delta=1e-10)
            self.assertAlmostEqual(r['W:q1'] / (-325 ** 2 / 2 * Y.imag * f4), 1, delta=1e-10)
            self.assertAlmostEqual(r['W:pf1'], Y.real / abs(Y), delta=1e-10)
        # with the variable step, against the continuous load (ω₁L): within 1e-3
        c = self.o['rl_var']
        self.assertEqual(c['warn'], [])
        Z2 = R * R + (w * L) ** 2
        for row in c['at']:
            r = dict(zip((k.split(':', 1)[1] for k in c['keys']), row[1:]))
            self.assertAlmostEqual(r['W:p1'] / (325 ** 2 / 2 * R / Z2), 1, delta=1e-3)
            self.assertAlmostEqual(r['W:q1'] / (325 ** 2 / 2 * w * L / Z2), 1, delta=1e-3)

    def test_sequences(self):
        # v: 325∠30° positive, 20∠−45° negative, 10∠60° zero sequence; i: 30∠−20°, 4∠15°, 3∠−70° (peak, phase from sin). Fortescue:
        # X⁺ = (Xa + α·Xb + α²·Xc)/3, X⁻ = (Xa + α²·Xb + α·Xc)/3, X⁰ = (Xa + Xb + Xc)/3. Magnitudes times sinc²(π/N); the unbalance
        # |X⁻|/|X⁺| without it. The phases: the value before the instant of an expression of t is read a millionth of a step early, 5e-7°
        c, N, s2, ln, t = self.power_table()
        for tt in (.02, .0313, .06, .1):
            r = t[tt]
            for k, sc, want in (('S1', 1, ((325, 30), (20, -45), (10, 60))), ('S2', 1 / math.sqrt(2), ((325, 30), (20, -45), (10, 60))),
                                ('SI', 1, ((30, -20), (4, 15), (3, -70)))):
                for (m, ph), o, po in zip(want, ('', ':neg', ':zero'), (':phpos', ':phneg', ':phzero')):
                    self.assertAlmostEqual(r[k + o] / (sc * m * s2), 1, delta=1e-10, msg=(tt, k, o))
                    self.assertAlmostEqual(self.wrap(r[k + po] - ph), 0, delta=1e-6, msg=(tt, k, po))
                self.assertAlmostEqual(r[k + ':unb'], want[1][0] / want[0][0], delta=1e-12)
        self.assertEqual(t[.01]['S1'], 0)

    def test_positive_sequence_and_instantaneous_power(self):
        # P⁺ + jQ⁺ = 3·V⁺·I⁺* with RMS phasors (IEEE Std 1459 §3.2.2.2.1, §3.2.2.3.1): 3·(325/√2)·(30/√2)·e^{j50°}, times sinc⁴(π/N).
        # The p-q theory: p + p₀ = va·ia + vb·ib + vc·ic at every instant; over a period the mean of p is (3/2)·(V⁺I⁺·cos 50° +
        # V⁻I⁻·cos(−60°)), of q (3/2)·(V⁺I⁺·sin 50° − V⁻I⁻·sin(−60°)) and of p₀ 3·(V⁰I⁰/2)·cos 130° (peak values; through AVG blocks)
        c, N, s2, ln, t = self.power_table()
        for tt in (.02, .0313, .06, .1):
            r = t[tt]
            self.assertAlmostEqual(r['PP'] / (1.5 * 325 * 30 * math.cos(math.radians(50)) * s2 * s2), 1, delta=1e-9, msg=tt)
            self.assertAlmostEqual(r['PP:q'] / (1.5 * 325 * 30 * math.sin(math.radians(50)) * s2 * s2), 1, delta=1e-9, msg=tt)
            self.assertAlmostEqual(r['PP:v'] / (325 / math.sqrt(2) * s2), 1, delta=1e-10)
            self.assertAlmostEqual(r['PP:i'] / (30 / math.sqrt(2) * s2), 1, delta=1e-10)
            self.assertAlmostEqual(r['Ap'] / (1.5 * (325 * 30 * math.cos(math.radians(50)) + 20 * 4 * math.cos(math.radians(-60)))), 1, delta=1e-9)
            self.assertAlmostEqual(r['Aq'] / (1.5 * (325 * 30 * math.sin(math.radians(50)) - 20 * 4 * math.sin(math.radians(-60)))), 1, delta=1e-9)
            self.assertAlmostEqual(r['A0'] / (3 * 10 * 3 / 2 * math.cos(math.radians(130))), 1, delta=1e-8)
        for tt, r in t.items():
            p3 = r['VA'] * r['IA'] + r['VB'] * r['IB'] + r['VC'] * r['IC']
            self.assertAlmostEqual(r['PQ'] + r['PQ:p0'], p3, delta=1e-9 * 1e4, msg=tt)
            self.assertEqual(r['PO:q'], -r['PQ:q'])                             # the original sign of q
        self.assertEqual(self.o['power_resume']['diff'], 0)

    def test_scipy_gives_the_same_power(self):
        # the same operations in engine/batch.py; the expressions of t are straight between the points there as well
        q = self.o['batch_power']
        got = {}
        items = list(q['channels'].items())
        for c0 in range(0, len(items), 40):
            rr = simulate({'net': json.loads(json.dumps(q['net'])), 'channels': dict(items[c0:c0 + 40]), 't_end': q['at'][-1][0], 'method': 'Radau'})
            self.assertEqual(rr['status'], 'ok')
            t = np.array(rr['t'])
            for k, ys in rr['ch'].items():
                got[k] = {row[0]: ys[int(np.where(t <= row[0] + 1e-12)[0][-1])] for row in q['at']}
        for row in q['at']:
            for k, v in zip(q['keys'], row[1:]):
                w = got[k][row[0]]
                if ':ph' in k:
                    self.assertAlmostEqual(self.wrap(w - v), 0, delta=1e-5, msg=(row[0], k))
                else:
                    self.assertAlmostEqual(w, v, delta=3e-4 * max(1.0, abs(v)), msg=(row[0], k))

    # ---- the periodic average of impulses (THEORY §8Υ)
    def test_periodic_impulse_average(self):
        # a staircase: +2 at 1,3 ms, +3 at 4,2 ms, +0,5 at 6 ms (a boundary of the 1 ms periods: it counts in the period that ends
        # there) and +0,5 at 8,1 ms. Per period: the rise in the period that just ended over 1 ms; with two periods per window over
        # 2 ms; running: the rise in (t − 1 ms, t]. A straight line 3·t gives 3 (the running one reads the value before an instant a
        # millionth of a step early: 5e-9)
        want = {.0005: (0, 0, 0, 0), .0019: (0, 2000, 0, 2000), .002: (2000, 2000, 1000, 2000), .0025: (2000, 0, 1000, 0), .003: (0, 0, 1000, 0),
                .0045: (0, 3000, 0, 3000), .005: (3000, 3000, 0, 3000), .0061: (500, 500, 1750, 500), .007: (0, 0, 1750, 0),
                .0085: (0, 500, 0, 500), .009: (500, 500, 0, 500), .0095: (500, 0, 0, 0), .0123: (0, 0, 0, 0)}
        for name in ('pia', 'pia_var'):
            self.assertEqual(self.o[name]['warn'], [])
            t = self.table(name)
            for tt, (p1, r1, p2, g1) in want.items():
                r = t[tt]
                self.assertAlmostEqual(r['P1'], p1, delta=1e-9, msg=(name, tt))
                self.assertAlmostEqual(r['R1'], r1, delta=1e-9, msg=(name, tt))
                self.assertAlmostEqual(r['P2'], p2, delta=1e-9, msg=(name, tt))
                self.assertAlmostEqual(r['G1'], g1, delta=1e-9, msg=(name, tt))
                if tt > .001:
                    self.assertAlmostEqual(r['PL'], 3, delta=1e-9, msg=(name, tt))
                    self.assertAlmostEqual(r['RL'], 3, delta=1e-7, msg=(name, tt))
        self.assertEqual(self.o['pia_resume']['diff'], 0)
        # the switching energy of a switch (E_on, E_off scaled with |v|·|i|) per period of the PWM: the switching losses of the scope
        c = self.o['sw_loss']
        self.assertEqual(len(c['warn']), 1)                                   # «Μέτρηση στοιχείου» on an inductor: no switching energy
        prev = 0
        for r in c['rows']:
            self.assertAlmostEqual(r['pa'] / r['psw'], 1, delta=1e-12, msg=r['t'])
            self.assertGreater(r['E'], prev)
            self.assertGreater(r['n'], 0)
            self.assertEqual(r['mb'], 0)
            prev = r['E']
        self.assertIn('E_on, E_off', c['batch_error'])                          # the SciPy solver says it has no switching losses

    def test_scipy_gives_the_same_impulse_average(self):
        q = self.o['batch_pia']
        r = simulate({'net': json.loads(json.dumps(q['net'])), 'channels': q['channels'], 't_end': q['at'][-1][0], 'method': 'Radau'})
        self.assertEqual(r['status'], 'ok')
        t = np.array(r['t'])
        for row in q['at']:
            i = int(np.where(t <= row[0] + 1e-12)[0][-1])
            for k, v in zip(q['keys'], row[1:]):
                self.assertAlmostEqual(r['ch'][k][i], v, delta=1e-6 * max(1.0, abs(v)), msg=(row[0], k))

    def test_scipy_gives_the_same_harmonics(self):
        # the same operations in engine/batch.py (_wm_inc, _wm_out). The voltage has fewer points per period there (about 230 on the
        # sine): the fundamental 6e-5 lower and the fifth harmonic (5π/N)²/3 = 1,5e-3 lower, as the straight line between the points gives;
        # the phases are the same
        for name, tol in (('batch_four', {}), ('batch_harm', {'A': 3e-4, 'T': 3e-4, 'A5': 2e-3, 'C5': 2e-3})):
            q = self.o[name]
            got = {}
            items = list(q['channels'].items())
            for c0 in range(0, len(items), 40):                                             # the solver takes 40 channels per run
                # a fresh copy of the request each time: the solver keeps the states of the blocks in it (the rings grow)
                net = json.loads(json.dumps(q['net']))
                rr = simulate({'net': net, 'channels': dict(items[c0:c0 + 40]), 't_end': q['at'][-1][0], 'method': 'Radau'})
                self.assertEqual(rr['status'], 'ok')
                t = np.array(rr['t'])
                for k, ys in rr['ch'].items():
                    got[k] = {row[0]: ys[int(np.where(t <= row[0] + 1e-12)[0][-1])] for row in q['at']}
            for row in q['at']:
                vals = dict(zip(q['keys'], row[1:]))
                for k, v in vals.items():
                    w = got[k][row[0]]
                    if k.endswith(':ph'):
                        if vals[k[:-3]] < 1e-6:
                            continue                                                         # no phase without a magnitude
                        self.assertAlmostEqual(self.wrap(w - v), 0, delta=1e-5, msg=(name, row[0], k))   # the corners: 1e-6 of a step
                    else:
                        id_ = k.split(':')[1]
                        d = tol.get(id_, tol.get(id_[0], 1e-6))
                        self.assertAlmostEqual(w, v, delta=d * max(1.0, abs(v)), msg=(name, row[0], k))


if __name__ == '__main__':
    unittest.main()
