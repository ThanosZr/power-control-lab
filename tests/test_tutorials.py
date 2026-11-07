"""New tutorials (voltage loop, thyristor bridges, flyback clamp, real switches) against theory, via Node."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'tutorial_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed; the browser runs the same files.')
class Tutorials(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=600)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.o = json.loads(run.stdout)

    def test_voltage_loop_pi_vs_pid(self):
        pi, pid = self.o['vloop_pi'], self.o['vloop_pid']
        for r in (pi, pid):
            self.assertAlmostEqual(r['vo_end'], 15, delta=0.05)
            self.assertLess(r['os'], 2)
            self.assertTrue(r['load_disturbance'])
        self.assertLess(pid['ts'], pi['ts'] / 4)                                 # PID settles much faster
        self.assertLess(pid['iae'], pi['iae'] / 2)
        self.assertLess(pid['load_dev'], pi['load_dev'])

    def test_single_phase_thyristor_bridge(self):
        vpk = 230 * math.sqrt(2)
        for a in (0, 60, 90):
            ar = math.radians(a)
            self.assertAlmostEqual(self.o[f'scr1_r_{a}']['vd'], vpk / math.pi * (1 + math.cos(ar)), delta=0.3)
        self.assertAlmostEqual(self.o['scr1_rl_60']['vd'], 2 * vpk / math.pi * .5, delta=0.3)

    def test_three_phase_bridge(self):
        vd0 = 3 * math.sqrt(3) / math.pi * 325
        for dev, a in (('diode', 0), ('30', 30), ('60', 60)):
            for load in ('r', 'rl'):
                self.assertAlmostEqual(self.o[f'b3_{dev}_{load}']['vR'], vd0 * math.cos(math.radians(a)), delta=0.002 * vd0)
        r = self.o['b3_diode_rl']
        self.assertAlmostEqual(r['ia_rms'], math.sqrt(2 / 3) * r['id'], delta=0.01 * r['id'])

    def test_flyback_leakage_clamp(self):
        c, i = self.o['fly_clamp'], self.o['fly_ideal']
        self.assertGreater(c['vsw_max'], i['vsw_max'] + 10)                       # leakage spike, clamped
        self.assertAlmostEqual(c['vsw_max'], 24 + c['vc'], delta=2)
        vr = c['vo'] / .5
        p = .5 * 4e-6 * c['im_pk'] ** 2 * 100e3 * c['vc'] / (c['vc'] - vr)
        self.assertAlmostEqual(c['prc'], p, delta=0.15 * p)

    def test_real_switches_losses(self):
        r = self.o['bat_real_pi']
        self.assertAlmostEqual(r['il'], 800, delta=5)
        self.assertAlmostEqual(r['psw1'] + r['psw2'], 20e3 * 2.1e-3, delta=5)    # one hard-switched device
        self.assertGreater(r['p1'] + r['p2'], 500)                                # I²R + body diodes
        self.assertLess(abs(self.o['bat_real_fixed']['il']), 790)                 # open loop drifts away

    def test_steady_starts_buck_boost(self):
        for key, vo in (('start_buck_10', 12), ('start_buck_50', 24 * 2 / (1 + (1 + 4 * .4 / .25) ** .5)),
                        ('start_boost_20', 24), ('start_boost_200', 12 * (1 + (1 + 4 * .25 / .1) ** .5) / 2)):
            r = self.o[key]
            self.assertAlmostEqual(r['v0'], vo, delta=0.001 * vo, msg=key)              # starts at the right steady state
            self.assertAlmostEqual(r['first'], vo, delta=0.01 * vo, msg=key)            # and stays there
            self.assertAlmostEqual(r['after'], vo, delta=0.01 * vo, msg=key)

    def test_sampling_exercise(self):
        o = self.o
        T, I, dI = o['smp_saw_midoff']['T'], -800, 50 * .5 / (5.6e-6 * 20e3)
        for start in ('midoff', 'midon', 'none'):                                 # 50, 50 and 100 triggers in [0, 50T)
            self.assertEqual(o[f'smp_saw_{start}']['n50'], 50)
            self.assertEqual(o[f'smp_tri1_{start}']['n50'], 50)
            self.assertEqual(o[f'smp_tri2_{start}']['n50'], 100)
        self.assertAlmostEqual(o['smp_saw_midoff']['first'], T / 4, delta=1e-12)  # 90° delay: first reset at 12.5 μs
        self.assertAlmostEqual(o['smp_saw_midon']['first'], .75 * T, delta=1e-12)
        self.assertAlmostEqual(o['smp_tri1_midon']['first'], T / 2, delta=1e-12)
        for start in ('midoff', 'midon'):                                         # i_L(0) = I_avg on the mid-point: mean stays I
            r = o[f'smp_saw_{start}']
            self.assertAlmostEqual(r['avg'], I, delta=0.2)
            self.assertAlmostEqual(r['pp'], dI, delta=0.01)
            self.assertAlmostEqual(r['last'], I - dI / 2, delta=0.2)               # sawtooth reset: the valley
            for kase in ('tri1', 'tri2'):
                self.assertAlmostEqual(o[f'smp_{kase}_{start}']['last'], I, delta=0.2)   # triangle extrema: the mean
        r = o['smp_saw_none']                                                     # i_L(0) = I_avg at the valley: offset Δi/2
        self.assertAlmostEqual(r['avg'], I + dI / 2, delta=0.2)
        self.assertAlmostEqual(r['last'], I, delta=0.2)
        dI2 = 50 * .375 / (5.6e-6 * 20e3)                                         # PI on the sample after V_st 100 → 80 V
        self.assertAlmostEqual(o['smp_pi_saw']['sample'], -400, delta=0.05)
        self.assertAlmostEqual(o['smp_pi_saw']['avg'], -400 + dI2 / 2, delta=0.3)
        self.assertAlmostEqual(o['smp_pi_tri1']['avg'], -400, delta=0.3)
        self.assertAlmostEqual(o['smp_pi_saw']['d'], .375, delta=1e-4)          # feedforward from the measured voltages


if __name__ == '__main__':
    unittest.main(verbosity=2)
