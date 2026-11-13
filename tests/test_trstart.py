"""The trapezoidal rule restarts from consistent derivatives after backward-Euler steps (4.9, 4.8.2 γ; THEORY §8κ):
on the generator of gen_ctl with an AVR and a step of V_ref, the Nyquist ripple of |V| that the old restart leaves
(solve.trStart 'be') is gone and |V| agrees with BDF2 at a ten times smaller step."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'trstart_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the solver runs in web/studio/mna.js).')
class TrapezoidalRestart(unittest.TestCase):
    def test_no_nyquist_ripple_after_an_event(self):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=600)
        self.assertEqual(run.returncode, 0, run.stderr)
        r = json.loads(run.stdout)
        self.assertGreater(r['be']['nyq'], 3e-3)                       # the old restart: a ripple of a few 10⁻³ pu
        self.assertLess(r['state']['nyq'], 1e-3)
        self.assertLess(abs(r['state']['vt'] - r['ref']['vt']), 5e-5)   # |V| at 1,2 s as with BDF2 at T/4000
        self.assertGreater(abs(r['be']['vt'] - r['ref']['vt']), 5e-4)  # the ripple through the AVR biased |V|


if __name__ == '__main__':
    unittest.main()
