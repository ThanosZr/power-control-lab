"""The controls of a synchronous generator (4.8.1, library parts AVR, PSS and GOV; Kundur ch. 8 §8.6 and ch. 9;
tutorials gen_ctl and ieee9_emt): a start in equilibrium for every combination (the generator gives e0, v0, m0 of its
load flow), the classic picture of a fault (constant E_fd and the AVR alone lose synchronism, the PSS keeps it), steps of
V_ref (ST1A fast, DC1A slow), steps of the load reference (steam in two time scales, hydro first the wrong way), DC1A
with a given K_E, and IEEE 9 with the full machine data that keeps synchronism with AVRs."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'gen_ctl_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the solver runs in web/studio/mna.js).')
class GeneratorControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=900)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.R = json.loads(run.stdout)

    def test_start_in_equilibrium(self):
        for c in self.R['steady']:
            self.assertEqual(c['warn'], [], c)
            self.assertLess(c['dev']['pe'], 5e-4, c)               # P_e within 0.05 % over 1 s (TR with the consistent restart, T/400)
            self.assertLess(c['dev']['efd'], 1e-2, c)              # E_fd (the AVR's gain of 200 included)
            if c['gov'] != 'none':
                self.assertLess(c['dev']['tm'], 1e-5, c)
                self.assertAlmostEqual(c['m0'], c['Tm0'], places=12)    # the generator's m0 is its T_m of the load flow
                self.assertAlmostEqual(c['tm'], c['Tm0'], delta=1e-4)
            if c['ctl'] != 'none':
                self.assertAlmostEqual(c['e0'], c['Efd0'], places=12)
                self.assertEqual(c['v0'], 1)

    def test_fault_with_and_without_the_stabilizer(self):
        f = self.R['fault']
        self.assertTrue(f['none']['slip'])                       # constant E_fd: first swing lost
        self.assertTrue(f['avr']['slip'])                        # high-gain AVR alone: the first swing holds (lower peak)
        self.assertLess(f['avr']['dmax'], f['none']['dmax'])     # but the oscillation grows and it is lost later
        p = f['avr_pss']
        self.assertFalse(p['slip'])                              # with the PSS: stable, the angle settles
        self.assertLess(p['dSpread'], 1.0)
        self.assertTrue(70 < p['dEnd'] < 90)                     # line 2 out: a larger angle than the 70° before
        self.assertAlmostEqual(p['vEnd'], 1.0, delta=0.01)
        self.assertEqual(p['vs'], [-0.1, 0.1])                   # the PSS output reaches its limits during the swing

    def test_voltage_reference_step(self):
        a, b = self.R['vref']['st1a'], self.R['vref']['dc1a']
        self.assertAlmostEqual(a['0.9'], 1.0, delta=1e-3)
        self.assertGreater(a['1.2'], 1.02)                       # ST1A: most of the 5 % in 0.2 s
        self.assertLess(b['1.2'], 1.01)                          # DC1A: the exciter's time constants
        for r in (a, b):
            self.assertAlmostEqual(r['3'], 1.05, delta=0.004)

    def test_load_reference_step(self):
        s, h = self.R['load']['steam'], self.R['load']['hydro']
        self.assertAlmostEqual(s['pmin'], s['p0'], delta=1e-5)   # steam: never below the start
        self.assertLess(s['p2'] - s['p0'], 0.02)                 # the reheater (T_RH = 7 s): most of the change comes later
        self.assertGreater(s['pT'] - s['p0'], 0.04)
        self.assertLess(h['pmin'], h['p0'] - 1e-3)               # hydro: first the wrong way (the water column, T_W)
        self.assertGreater(h['pT'] - h['p0'], 0.005)             # then up, slowly (transient droop)
        for r in (s, h):
            self.assertAlmostEqual(r['w'], 1.0, delta=1e-4)      # on the infinite bus the speed stays

    def test_dc1a_with_given_ke(self):
        k = self.R['dc1aKE']
        self.assertLess(k['d'], 1e-3)                            # V_R starts at (K_E + S_E(E_fd0))·E_fd0, so no drift
        self.assertGreater(k['vr0'], 1)

    def test_ieee9_with_avrs(self):
        n, a = self.R['ieee9']['none'], self.R['ieee9']['avr']
        self.assertTrue(n['slip'])
        self.assertFalse(a['slip'])
        self.assertLess(abs(a['d21']), 90)
        self.assertLess(abs(a['d31']), 90)
        self.assertEqual(a['warn'], [])



@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the project is built by web/studio in Node).')
class SciPyEquivalence(unittest.TestCase):
    """4.9.1 (4.8.2 b): the generator controls in the SciPy solver (engine/batch.py), against the browser solver at T/1000.
    Possible since the Jacobian of SciPy has the generator's terms (Circuit.jac_gen): without them a generator behind a
    transformer and lines (nodes joined only by inductors, a mode (Σ1/L)/G_min) did not finish 5 ms in 5 minutes."""

    @staticmethod
    def _pair(ctl, gov, dv, dp, t_end, ch):
        import pcl
        pr = pcl.tutorial('gen_ctl', ctl=ctl, gov=gov, ev='none')
        pr.set('AV1.dV', dv)
        pr.set('GV1.dP', dp)
        rb = pr.run(t_end, channels=ch, hdiv=1000)
        rs = pr.run(t_end, channels=ch, solver='scipy', rtol=1e-7, timeout=900)
        return rb, rs

    def test_st1a_pss_steam(self):
        # the small scenario of the ROADMAP: ST1A + PSS + steam with reheat, a step of V_ref at 20 ms and of the load
        # reference at 30 ms, values at 19, 40, 80 and 150 ms
        import numpy as np
        ch = ['Y:SG1', 'Y:SG1:pe', 'Y:SG1:vt', 'Y:SG1:d', 'Y:AV1/EFD', 'Y:PS1/VS', 'Y:GV1/TM']
        rb, rs = self._pair('avr_pss', 'steam', '0:0, 0.02:0.02', '0:0, 0.03:0.05', 0.15, ch)
        self.assertEqual(rs.meta['status'], 'ok', rs.meta)
        tol = {'Y:SG1': 2e-6, 'Y:SG1:pe': 1e-4, 'Y:SG1:vt': 1e-4, 'Y:SG1:d': 2e-3, 'Y:PS1/VS': 1e-4, 'Y:GV1/TM': 1e-4}
        for k in ch:
            for tq in (0.019, 0.04, 0.08, 0.15):
                b, s = float(np.interp(tq, rb.t, rb[k])), float(np.interp(tq, rs.t, rs[k]))
                if k == 'Y:AV1/EFD':                # gain 200: SciPy holds the inputs of the blocks over T/1000
                    self.assertLess(abs(b - s), 5e-3 * abs(b) + 1e-3, (k, tq, b, s))
                else:
                    self.assertLess(abs(b - s), tol[k], (k, tq, b, s))
        self.assertGreater(float(np.interp(0.04, rb.t, rb['Y:AV1/EFD'])), 5)       # the step of V_ref is there

    def test_dc1a_hydro(self):
        import numpy as np
        ch = ['Y:SG1:pe', 'Y:SG1:vt', 'Y:AV1/EFD', 'Y:GV1/TM', 'Y:GV1/G']
        rb, rs = self._pair('dc1a', 'hydro', '0:0, 0.01:0.02', '0:0, 0.02:0.05', 0.06, ch)
        self.assertEqual(rs.meta['status'], 'ok', rs.meta)
        tol = {'Y:SG1:pe': 5e-4, 'Y:SG1:vt': 5e-4, 'Y:AV1/EFD': 1e-3, 'Y:GV1/TM': 1e-4, 'Y:GV1/G': 1e-4}
        for k in ch:
            for tq in (0.009, 0.03, 0.06):
                b, s = float(np.interp(tq, rb.t, rb[k])), float(np.interp(tq, rs.t, rs[k]))
                self.assertLess(abs(b - s), tol[k], (k, tq, b, s))


if __name__ == '__main__':
    unittest.main()
