"""5.0.18: the bus voltage control of the fourth exercise of PE2 (tutorial voltage_ctl), via Node: the design of the voltage loop,
the operating points at V_ref, the dip after a step of the load against the estimate from the two poles of the loop, the equal
sharing of the four branches, the limit of a branch with the overload timer, the voltage at which the source gives the rest,
and the options of the measurement and of the controller (THEORY §8ΩΣ, GUIDE §56)."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'vctl_cases.js'


def poles(m, Kp=None, Ki=None):
    """The two poles (s⁻¹) of C·s² + (G + K_p)·s + K_i = 0 with G = 1/R_s − P_d/V_ref²."""
    Kp = m['Kpv'] if Kp is None else Kp
    Ki = m['Kiv'] if Ki is None else Ki
    G = 1 / m['Rs'] - m['Pd'] / m['Vref'] ** 2
    A, C = G + Kp, m['Cb']
    d = math.sqrt(A * A - 4 * C * Ki)
    return (A - d) / (2 * C), (A + d) / (2 * C)


def estimate(m, dP):
    """The deviation after a step ΔP of the load as a step ΔP/V_ref of current into the linear loop: its peak, the instant of
    the peak, and the time until it stays inside the band."""
    p1, p2 = poles(m)
    dI = dP / m['Vref']

    def dev(t):
        return dI / m['Cb'] * (math.exp(-p1 * t) - math.exp(-p2 * t)) / (p2 - p1)
    ts = math.log(p2 / p1) / (p2 - p1)
    t = ts
    while abs(dev(t)) > m['band']:
        t += 1e-6
    return dev(ts), ts, t


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed; the browser runs the same files.')
class VoltageControl(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=900)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.o = json.loads(run.stdout)

    def test_design(self):
        """K_i = ω_v·(G + K_p) with G = 1/R_s − P_d/V_ref²; the slow pole near ω_v; the current loop of exercise 3 (K_p = L(a + b),
        K_i = L·a·b); the operating points: the source at V_ref gives (V_src − V_ref)/R_s, the converter the rest, per branch
        −I_c/N above the bus and P_c/(N·V_st) below it."""
        for key in ('lo_step', 'hi_step', 'lo_int', 'lo_slow'):
            m = self.o[key]['meta']
            G = 1 / m['Rs'] - m['Pd'] / m['Vref'] ** 2
            self.assertAlmostEqual(m['G'], G, delta=1e-9, msg=key)
            self.assertAlmostEqual(m['Kiv'], m['wv'] * (G + m['Kpv']), delta=5e-4 * m['Kiv'], msg=key)   # 4 significant digits
            p1, p2 = poles(m)
            self.assertAlmostEqual(p1, m['wv'], delta=0.05 * m['wv'], msg=key)                         # the slow pole near ω_v
            self.assertGreater(p2, 20 * p1, msg=key)
            self.assertAlmostEqual(m['kp'], m['L'] * (m['a'] + m['b']), delta=1e-6, msg=key)
            self.assertAlmostEqual(m['ki'], m['L'] * m['a'] * m['b'], delta=1e-6, msg=key)
        for key in ('lo_step', 'hi_step'):
            m = self.o[key]['meta']
            Ps = m['Vref'] * (m['Vsrc'] - m['Vref']) / m['Rs']
            self.assertAlmostEqual(m['Ps'], Ps, delta=1e-6)
            for r in m['rows']:
                self.assertAlmostEqual(r['pc'], r['p'] - Ps, delta=1e-6)
                Ik = r['pc'] / (m['N'] * m['Vst']) if m['side'] == 'lo' else -r['pc'] / m['Vref'] / m['N']
                self.assertAlmostEqual(r['Ik'], Ik, delta=1e-9)
                self.assertTrue(r['ok'])

    def test_step(self):
        """The step of the load: back to V_ref (the sampled voltage held there; the mean a few mV off where the bus ripple is
        large), the dip against the estimate from the two poles (deeper by the delays of the sampling and of the current loops),
        the recovery, the four branches equal, the balance of power."""
        for key in ('lo_step', 'hi_step', 'lo_profile', 'hi_profile'):
            r = self.o[key]
            m = r['meta']
            self.assertEqual(r['warn'], [], msg=key)
            self.assertEqual(r['n'], round(m['stopT'] * m['fs']), msg=key)                         # one mean per period
            self.assertAlmostEqual(r['v_end'], m['Vref'], delta=0.012, msg=key)
            q = r['steps'][0]
            dip, ts, tr = estimate(m, q['p'] - m['prof'][0][1])
            meas = m['Vref'] - q['ext']
            self.assertGreater(meas, dip, msg=key)
            self.assertLess(meas, 1.2 * dip, msg=key)
            self.assertAlmostEqual(q['te'], ts, delta=1.5e-4, msg=key)                                   # 3 periods
            self.assertAlmostEqual(q['rec'], tr, delta=0.1 * tr, msg=key)
            self.assertLess(max(r['legs']) - min(r['legs']), 1e-3, msg=key)
            self.assertAlmostEqual(r['legs'][0], r['ref_end'], delta=0.02 * abs(r['ref_end']), msg=key)
            self.assertAlmostEqual(r['p_src'] + r['p_conv'], r['p_load'], delta=1e-3 * r['p_load'], msg=key)
        # the profile: the decreases of the load lift the voltage, and it comes back inside the band
        for key in ('lo_profile', 'hi_profile'):
            for q in self.o[key]['steps'][1:]:
                self.assertGreater(q['ext'], self.o[key]['meta']['Vref'], msg=key)
                self.assertLess(q['rec'], 3e-3, msg=key)
        self.assertAlmostEqual(self.o['hi_step']['v_end'], 49.5, delta=1e-3)

    def test_limit(self):
        """Beyond the converter: the reference of a branch at I_ol until the timer reaches T_ol (counted from the first period
        above I_n), then at I_n; the voltage sits where the source gives the rest: v·(V_src − v)/R_s = P − P_c,max with
        P_c,max = N·I_n·v above the bus, N·I_n·V_st below it."""
        for key in ('lo_limit', 'hi_limit'):
            r = self.o[key]
            m = r['meta']
            sg = 1 if m['side'] == 'lo' else -1
            self.assertEqual(r['warn'], [], msg=key)
            self.assertEqual(r['ref_ol'], {'min': sg * m['Iol'], 'max': sg * m['Iol']}, msg=key)
            self.assertEqual(r['ref_after'], {'min': sg * m['In'], 'max': sg * m['In']}, msg=key)
            self.assertAlmostEqual(r['tol_cross'] - r['over'], m['Tol'], delta=1e-6, msg=key)
            self.assertAlmostEqual(r['tm_end'], 1.2 * m['Tol'], delta=1e-9, msg=key)
            P = m['prof'][-1][1]
            if m['side'] == 'lo':
                b, c = m['Vsrc'], (P - m['N'] * m['In'] * m['Vst']) * m['Rs']
            else:
                b, c = m['Vsrc'] + m['N'] * m['In'] * m['Rs'], P * m['Rs']
            v = (b + math.sqrt(b * b - 4 * c)) / 2
            self.assertAlmostEqual(r['v_end'], v, delta=5e-3, msg=key)
            self.assertLess(r['v_end'], m['Vref'] - m['band'], msg=key)
            self.assertAlmostEqual(r['p_src'] + r['p_conv'], r['p_load'], delta=1e-3 * r['p_load'], msg=key)

    def test_options(self):
        """The measurement of the bus voltage (S&H twice per period, or none) hardly changes the response: the voltage PI reads its
        input on its own clock. Without K_p the dip is deeper; with ω_v = 75 rad/s the recovery is about four times slower, as the
        slow pole."""
        base = self.o['lo_step']['steps'][0]
        for key in ('lo_raw', 'lo_both'):
            q = self.o[key]['steps'][0]
            self.assertAlmostEqual(q['ext'], base['ext'], delta=1e-3, msg=key)
            self.assertEqual(q['rec'], base['rec'], msg=key)
        m = self.o['lo_int']['meta']
        self.assertEqual(m['Kpv'], 0)
        q = self.o['lo_int']['steps'][0]
        self.assertLess(q['ext'], base['ext'] - 0.02)
        dip, ts, tr = estimate(m, q['p'] - m['prof'][0][1])
        self.assertAlmostEqual(m['Vref'] - q['ext'], dip, delta=0.1 * dip)
        m = self.o['lo_slow']['meta']
        q = self.o['lo_slow']['steps'][0]
        dip, ts, tr = estimate(m, q['p'] - m['prof'][0][1])
        self.assertAlmostEqual(q['rec'], tr, delta=0.05 * tr)
        self.assertGreater(q['rec'], 3.5 * base['rec'])


if __name__ == '__main__':
    unittest.main()
