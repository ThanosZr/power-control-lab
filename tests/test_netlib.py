"""Network library (4.1, ROADMAP §31): web/studio/netlib.js through the browser solver and the SciPy solver.

Every expected value is computed here from the formula it names (symmetrical components, IEC 60909, the nameplate of
a transformer), never from the solver."""
import cmath
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

from engine.batch import simulate

CASES = Path(__file__).resolve().parent / 'js' / 'netlib_cases.js'
GRID = dict(Un=20e3, Sk=500e6, XR=10, Z0Z1=1.5, XR0=5, cf=1.1)


def seq(Un=20e3, Sk=500e6, XR=10, Z0Z1=1.5, XR0=5, cf=1.1):
    """Sequence impedances of the equivalent (IEC 60909: Z_Q = c·U_n²/S″k) and the EMF c·U_n/√3."""
    z1 = cf * Un ** 2 / Sk
    Z1 = z1 * complex(1, XR) / math.hypot(1, XR)
    Z0 = Z0Z1 * z1 * complex(1, XR0) / math.hypot(1, XR0)
    return Z1, Z0, cf * Un / math.sqrt(3)


def iec60909(kind, **g):
    """Initial symmetrical short-circuit currents (RMS) by symmetrical components, Z₂ = Z₁, bolted fault."""
    Z1, Z0, E = seq(**{**GRID, **g})
    if kind == 'abc':
        return {'a': abs(E / Z1)}
    if kind == 'ag':
        I0 = E / (2 * Z1 + Z0)
        return {'a': abs(3 * I0), 'g': abs(3 * I0)}
    if kind == 'ab':
        return {'a': abs(math.sqrt(3) * E / (2 * Z1))}
    if kind == 'abg':                                            # I″kE2E = √3·c·U_n/|Z₁ + 2Z₀| for Z₂ = Z₁
        a = cmath.exp(2j * math.pi / 3)
        I1 = E / (Z1 + Z1 * Z0 / (Z1 + Z0))
        I2 = -I1 * Z0 / (Z1 + Z0)
        I0 = -I1 * Z1 / (Z1 + Z0)
        # fault on b, c is the textbook case; on a, b the same magnitudes, rotated
        return {'b': abs(I0 + a * a * I1 + a * I2), 'c': abs(I0 + a * I1 + a * a * I2), 'g': abs(3 * I0),
                'gIEC': abs(3 * E / (Z1 + 2 * Z0))}                  # √3·c·U_n/|Z₁ + 2Z₀|
    raise ValueError(kind)


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the network library is web/studio/netlib.js).')
class NetworkLibrary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=600)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.o = json.loads(run.stdout)

    def test_sequence_impedances(self):
        Z1, Z0, E = seq()
        g = self.o['grid']
        for got, want in ((g['R1'], Z1.real), (g['X1'], Z1.imag), (g['R0'], Z0.real), (g['X0'], Z0.imag), (g['E'], E)):
            self.assertAlmostEqual(got, want, delta=1e-12 * abs(want))

    def test_fault_currents_iec60909(self):
        f = self.o['faults']
        for kind, ph in (('abc', 'abc'), ('abcg', 'abc'), ('ag', 'a'), ('bg', 'b'), ('ab', 'ab'), ('bc', 'bc')):
            ref = iec60909({'abcg': 'abc', 'bg': 'ag', 'bc': 'ab'}.get(kind, kind))['a']
            for x in ph:
                self.assertAlmostEqual(f[kind]['sim'][x], ref, delta=1e-4 * ref, msg=f'{kind} {x}')
            self.assertFalse(f[kind]['warn'], kind)
        self.assertAlmostEqual(f['ag']['sim']['g'], iec60909('ag')['g'], delta=1e-4 * f['ag']['sim']['g'])
        # double line to ground: the phase currents and the earth current 3I₀ (= I″kE2E of IEC 60909)
        r = iec60909('abg')
        for kind, (p, q) in (('bcg', 'bc'), ('abg', 'ab')):
            self.assertAlmostEqual(f[kind]['sim'][p], r['b'], delta=1e-4 * r['b'])
            self.assertAlmostEqual(f[kind]['sim'][q], r['c'], delta=1e-4 * r['c'])
            self.assertAlmostEqual(f[kind]['sim']['g'], r['g'], delta=1e-4 * r['g'])
        self.assertAlmostEqual(r['g'], r['gIEC'], delta=1e-9 * r['g'])
        # the phase-domain solution of netlib.js agrees with the symmetrical components too
        self.assertAlmostEqual(f['bcg']['ref']['g'], r['g'], delta=1e-4 * r['g'])
        # phases outside the fault carry only the leakage of their open pole (R_off = 10 MΩ: about 1 mA)
        for kind, x in (('ag', 'b'), ('ab', 'c'), ('bcg', 'a')):
            self.assertLess(f[kind]['sim'][x], 0.01)

    def test_single_phase_power_and_isolated_neutral(self):
        self.assertAlmostEqual(self.o['sk1']['sim'], 400e6 / (math.sqrt(3) * 20e3), delta=1e-4 * 11547)
        self.assertLess(self.o['iso'], 0.05)                       # only through the 1 MΩ of the neutral

    def test_peak_current(self):
        """Fault at a voltage zero of phase a: i = √2·I″k·(sin(ωt − φ) + sin φ·e^(−t/τ)), and IEC 60909 κ."""
        Z1, _, E = seq()
        I, phi, tau = abs(E / Z1), cmath.phase(Z1), Z1.imag / (Z1.real * 2 * math.pi * 50)
        t = np.linspace(0, 0.03, 300001)
        ip = float(np.max(np.abs(math.sqrt(2) * I * (np.sin(2 * math.pi * 50 * t - phi) + math.sin(phi) * np.exp(-t / tau)))))
        self.assertAlmostEqual(self.o['peak']['ip'], ip, delta=1e-3 * ip)
        kappa = 1.02 + 0.98 * math.exp(-3 / 10)
        self.assertAlmostEqual(self.o['peak']['ip'], kappa * math.sqrt(2) * I, delta=0.01 * ip)

    def test_vector_groups(self):
        shift = {'Yy0': 0, 'YNyn0': 0, 'Yyn0': 0, 'YNy0': 0, 'Dd0': 0, 'Yd1': -30, 'YNd1': -30, 'Dy1': -30, 'Dyn1': -30,
                 'Yd11': 30, 'YNd11': 30, 'Dy11': 30, 'Dyn11': 30}
        for grp, want in shift.items():
            x = self.o['xf'][grp]
            self.assertAlmostEqual(x['shift'], want, delta=0.05, msg=grp)
            self.assertAlmostEqual(x['U2'] / x['U1'], 20 / 150, delta=1e-3 * 20 / 150, msg=grp)   # no load (1 W)
            self.assertFalse(x['warn'], grp)

    def test_transformer_short_circuit(self):
        I1, I2 = 40e6 / (math.sqrt(3) * 150e3 * 0.1), 40e6 / (math.sqrt(3) * 20e3 * 0.1)
        self.assertAlmostEqual(self.o['xfsc']['I1'], I1, delta=1e-3 * I1)
        self.assertAlmostEqual(self.o['xfsc']['Ilv'], I2, delta=1e-3 * I2)

    def test_loads(self):
        for k, v in self.o['load'].items():
            self.assertAlmostEqual(v['P'], 10e6, delta=2e-5 * 10e6, msg=k)
            self.assertAlmostEqual(v['Q'], 3e6 if k.endswith('+') else -3e6, delta=2e-5 * 10e6, msg=k)

    def test_breaker_opens_at_current_zero(self):
        cb = self.o['cb']
        # the first pole within half a period; after it the other currents change through the mutual coupling
        # (Z₀ ≠ Z₁), so each of them within a period
        self.assertLess(min(cb['stop'].values()), 0.3013 + 0.01 + 1e-4)
        for x in 'abc':
            self.assertGreater(cb['stop'][x], 0.3013)                      # after the command
            self.assertLess(cb['stop'][x], 0.3013 + 0.02)
            self.assertLess(abs(cb['before'][x]), 0.005 * cb['pk'])          # the step before: almost zero
            self.assertLess(cb['leak'][x], 0.05)                             # then only through R_off
        self.assertEqual(len({round(cb['stop'][x], 6) for x in 'abc'}), 3)   # each pole at its own zero
        poles = [e for e in cb['events'] if e[1] == 'scr' and e[3] == 0]
        self.assertGreaterEqual(len(poles), 3)                              # in the event log

    def test_bus_and_nesting_give_the_same_numbers(self):
        self.assertLess(self.o['busEq']['maxDiff'], 1e-6)
        self.assertEqual(self.o['busEq']['steps'][0], self.o['busEq']['steps'][1])
        self.assertEqual(self.o['nested']['maxDiff'], 0)
        self.assertTrue(self.o['nested']['inner'])
        self.assertTrue(self.o['untouched'])

    def test_scipy_solver(self):
        for name, events in (('fault', (0.0123, 0.0607)), ('breaker', ())):
            r = simulate({**self.o['req'][name], 't_end': 0.08})
            self.assertEqual(r['status'], 'ok')
            w = self.o['wave'][name]
            tb = np.array(w['t'])
            ok = tb > 1e-3                                                   # not the first step from zero
            for e in events:                                                 # the value on a jump is either side
                ok &= np.abs(tb - e) > 1.5e-4
            for j, k in enumerate(r['ch']):
                y = np.array(w['y'][j])
                ys = np.interp(tb, np.array(r['t']), np.array(r['ch'][k]))
                self.assertLess(float(np.max(np.abs(ys - y)[ok])), 5e-4 * float(np.max(np.abs(y))), msg=f'{name} {k}')
        r = simulate({**self.o['req']['xf'], 't_end': 0.06})
        self.assertEqual(r['status'], 'ok')


if __name__ == '__main__':
    unittest.main()


CASES42 = Path(__file__).resolve().parent / 'js' / 'netlib42_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the network library is web/studio/netlib.js).')
class Additions42(unittest.TestCase):
    """The open points of 4.1, as additions (4.2): EMF U_n/√3 with c only in Z₁, ZIP load (current sources in the frame
    of a PLL with a compensated damping resistor), three-legged core (zero-sequence magnetizing at side 1, Dommel
    ch. 6), voltage across the breaker poles, live parameters of the library parts."""

    @classmethod
    def setUpClass(cls):
        cls.r = json.loads(subprocess.run(['node', str(CASES42)], capture_output=True, text=True, timeout=900, check=True).stdout)

    def test_emf_option(self):
        Ik3 = 500e6 / (math.sqrt(3) * 20e3)                     # c·U_n/√3 over c·U_n²/S″k
        self.assertAlmostEqual(self.r['emf_c'], Ik3, delta=2e-3 * Ik3)
        self.assertAlmostEqual(self.r['emf_un'], Ik3 / 1.1, delta=2e-3 * Ik3)

    def test_zip_powers(self):
        z = self.r['zip']
        for k, (kz, ki, kp) in {'p': (0, 0, 1), 'i': (0, 1, 0), 'mix': (0.4, 0.3, 0.3), 'delta': (0, 0, 1)}.items():
            V = z[k]['V']
            f = kz * V * V + ki * V + kp
            self.assertAlmostEqual(z[k]['P'], 8e6 * f, delta=0.01 * 8e6, msg=k)
            self.assertAlmostEqual(z[k]['Q'], 3e6 * f, delta=0.02 * 3e6, msg=k)
            self.assertFalse(z[k]['warn'], k)
        V = z['z']['V']                                          # constant impedance: P ∝ V² (as in 4.1)
        self.assertAlmostEqual(z['z']['P'], 8e6 * V * V, delta=2e-3 * 8e6)

    def test_three_legged_core(self):
        c = self.r['core']
        Ir = 10e6 / (math.sqrt(3) * 20e3)                      # i₀₀ = 100 %: rated current at the rated phase voltage
        self.assertAlmostEqual(c['zero3leg'], Ir + c['zero3x1'], delta=2e-3 * Ir)
        self.assertAlmostEqual(c['pos3leg'], c['pos3x1'], delta=1e-3 * c['pos3x1'])   # positive sequence unchanged
        self.assertAlmostEqual(c['zero5leg'], c['zero3x1'], delta=1e-9)            # five-legged: as three units
        self.assertAlmostEqual(c['zero3x1'], c['pos3x1'], delta=1e-9)

    def test_pole_voltage(self):
        p = self.r['pole']
        self.assertTrue(p['channel'])
        self.assertLess(p['diff'], 1e-9)
        self.assertLess(p['closed'], 1.0)
        self.assertGreater(p['open'], 1e4)

    def test_live_parameters(self):
        lv = self.r['live']
        st = lv['structural']
        self.assertEqual(st, {'P': False, 'cn': True, 'Sk': False, 'grp': True, 'uk': False, 'cmd': False, 'kind': True})
        self.assertGreater(abs(lv['after'] - lv['fresh']), 1.0)  # the states were carried over, not restarted
