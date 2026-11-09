"""Step of the solver (3.13, ROADMAP §40): variable step with error control, step checks and run-time messages, via Node."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'step_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed; the browser runs the same files.')
class SolverStep(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=600)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.o = json.loads(run.stdout)

    def test_rlc_against_closed_form(self):
        r = self.o['rlc']
        self.assertLess(r['var']['err'], 0.02)                       # 0.2 % of 10 V after 5 lightly damped periods
        self.assertLess(r['var']['steps'], r['fixed2000']['steps'] / 3)
        self.assertLess(r['var']['err'], r['fixed200']['err'] / 10)
        self.assertLess(r['var6']['err'], r['fixed2000']['err'])     # tighter tolerance: better than T/2000 with fewer steps
        self.assertLess(r['var6']['steps'], r['fixed2000']['steps'])

    def test_rlc_mode_found(self):
        r = self.o['rlc']
        self.assertAlmostEqual(r['mode_f'], r['f_theory'], delta=1e-6 * r['f_theory'])
        self.assertEqual(sorted(r['mode_ids']), ['C1', 'L1'])

    def test_impulse_generator(self):
        r = self.o['impulse']
        self.assertAlmostEqual(r['var']['pk'], r['vpk'], delta=1e-3 * r['vpk'])
        self.assertLess(r['var']['err'], 1e-3 * r['vpk'])
        self.assertLess(r['var']['steps'] * 10, r['fixed']['steps'])

    def test_flyback_clamp_energy(self):
        r = self.o['flyback']
        ref = r['fixed2000']
        self.assertAlmostEqual(r['var']['vc'], ref['vc'], delta=0.01 * ref['vc'])
        self.assertAlmostEqual(r['var']['prc'], ref['prc'], delta=0.02 * ref['prc'])
        self.assertAlmostEqual(r['var']['vo'], ref['vo'], delta=1e-3 * ref['vo'])
        self.assertLess(r['var']['steps'] * 4, r['fixed400']['steps'])

    def test_marx_generator(self):
        r = self.o['marx']
        self.assertAlmostEqual(r['var']['pk'], r['fixed']['pk'], delta=1e-4 * r['fixed']['pk'])
        self.assertLess(r['var']['steps'], 0.6 * r['fixed']['steps'])

    def test_step_checks(self):
        c = self.o['check']
        w = [d for d in c['rc_coarse'] if d['sev'] == 'warn']
        self.assertEqual(len(w), 1)
        self.assertAlmostEqual(w[0]['tau'], 1e-6, delta=1e-11)       # R₁C₁ ∥ R₂ ≈ 1 µs
        self.assertEqual(w[0]['id'], 'C1')
        self.assertEqual(c['rc_fine'], [])
        self.assertEqual([d['key'] for d in c['rc_alg']], ['alg'])   # τ ≪ h: practically algebraic, information only
        self.assertEqual([(d['sev'], d['key']) for d in c['buck']], [('info', 'par')])   # only the switch models
        s = [d for d in c['schering'] if d['key'].startswith('mode:')]
        self.assertEqual(len(s), 1)
        self.assertEqual(sorted(s[0]['ids']), ['C4', 'CX'])
        self.assertFalse([d for d in c['schering'] if d['sev'] != 'info'])

    def test_runtime_messages(self):
        r = self.o['runtime']
        self.assertEqual([(d['key'], d['sev']) for d in r['tr']], [('ring:C1', 'warn')])
        self.assertGreater(r['tr'][0]['t'], 1e-3)
        self.assertEqual(r['bdf2'], [])                              # Gear/BDF2 damps the fast mode

    def test_mode_switch_keeps_state(self):
        r = self.o['mode_switch']
        self.assertTrue(r['var'])
        self.assertAlmostEqual(r['fixed_then_var'], r['fixed'], delta=1e-4)


if __name__ == '__main__':
    unittest.main()
