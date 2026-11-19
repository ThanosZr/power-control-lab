"""4.21 (ROADMAP §87): the state estimation from an EMT run (pcl.se.from_emt), the bridge of §79 to the EMT of the studio. The
tutorial se_emt runs headless (tests/js/pmu_cases.js): the IEEE 9 network in EMT from its load flow, with a phasor measurement unit
(PMU3) at the «from» end of every branch. Its synchrophasor is the one IEC/IEEE 60255-118-1 defines (§4.2–4.3: RMS, the phase on
cos(2πf₀t) from a UTC second, here t = 0 of the run); the estimate of it is our own (one-cycle windows; no compliance with the classes
P and M is claimed). The references: a sinusoid fitted by least squares to the samples of the last period of every unit (the total
vector error, (9) of the standard, of the unit itself), the load flow the run started from (the truth of the estimate), the largest
normalized residual test with a gross error planted in each plan, the measured angles of the phasors."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

from pcl import network as N
from pcl import se
from pcl import study as S

ROOT = Path(__file__).resolve().parents[1]


def wrap(a):
    return (a + 180.0) % 360.0 - 180.0


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class EmtSe(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'pmu_cases.js'), '0.1'], capture_output=True, text=True, timeout=900, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr[-2000:])
        cls.js = json.loads(out.stdout)
        cls.net = N.case_data('ieee9')
        cls.lf = cls.net.power_flow('nr', tol=1e-12)
        cls.pts = [{k: p[k] for k in ('branch', 'end', 'V', 'thV', 'I', 'thI', 'P', 'Q')} for p in cls.js['points']]
        cls.sin = [dict(q, thV=p['thV_sin'], thI=p['thI_sin']) for q, p in zip(cls.pts, cls.js['points'])]

    def test_the_run(self):
        js = self.js
        self.assertEqual(js['warn'], [])
        self.assertEqual(js['keys'], js['panes'])                                  # every trace of the scope is a channel
        self.assertEqual(len(js['points']), 9)
        self.assertEqual([p['branch'] for p in js['points']], [f'br{k}' for k in range(1, 10)])

    def test_the_unit_against_the_sinusoid_of_its_samples(self):
        # the waveforms are sinusoids (residual of the fit below 1e-9 of the peak); the unit integrates the straight lines between
        # the steps over one period, so its phasors are smaller by (ωh)²/12 = 2.06e-5 at 400 steps per period, at every unit
        w, h = 2 * math.pi * self.js['f'], self.js['h']
        al = np.exp(2j * np.pi / 3)
        for p in self.js['points']:
            t = np.array(p['wave']['t'])
            A = np.c_[np.sin(w * t), np.cos(w * t)]
            ph = {}
            for k in ('va', 'vb', 'vc', 'ia', 'ib', 'ic'):
                x = np.array(p['wave'][k])
                c = np.linalg.lstsq(A, x, rcond=None)[0]
                self.assertLess(np.abs(x - A @ c).max(), 1e-9 * np.abs(x).max(), (p['id'], k))
                ph[k] = complex(c[0], c[1]) / math.sqrt(2)                          # x = √2·|X|·sin(ωt + φ)
            V1 = (ph['va'] + al * ph['vb'] + al ** 2 * ph['vc']) / 3
            I1 = (ph['ia'] + al * ph['ib'] + al ** 2 * ph['ic']) / 3
            Vu, Iu = p['V'] * np.exp(1j * math.radians(p['thV'])), p['I'] * np.exp(1j * math.radians(p['thI']))      # on the cosine
            V1, I1 = V1 * np.exp(-0.5j * math.pi), I1 * np.exp(-0.5j * math.pi)       # sin(ωt + φ) = cos(ωt + φ − 90°)
            self.assertAlmostEqual(wrap(p['thV'] - p['thV_sin'] + 90.0), 0.0, delta=1e-9)
            for X, ref in ((Vu, V1), (Iu, I1)):
                self.assertAlmostEqual(se.tve(X, ref), (w * h) ** 2 / 12, delta=2e-8, msg=p['id'])
                self.assertAlmostEqual(abs(X) / abs(ref), 1 - (w * h) ** 2 / 12, delta=2e-8, msg=p['id'])       # in the magnitude alone
            k = self.net.case().br_name.index(p['branch'])                          # the EMT itself against the load flow: below 4e-6
            Vl = self.lf['_V'][self.net.case().f[k]] * 345e3 / math.sqrt(3) * np.exp(-0.5j * math.pi)     # θ of the load flow: θ − 90° on the cosine
            self.assertLess(se.tve(V1, Vl), 4e-6, p['id'])
            S1 = 3 * Vu * Iu.conjugate()
            self.assertAlmostEqual(p['P'], S1.real, delta=1e-6 * abs(S1))
            self.assertAlmostEqual(p['Q'], S1.imag, delta=1e-6 * abs(S1))

    def test_every_plan_finds_the_load_flow(self):
        # measured: the estimate within 2.2e-5 pu of the load flow (the unit's own 2.06e-5 above), the angles within 2.2e-4°
        for plan in se.EMT_PLANS:
            m = se.from_emt(self.net, self.pts, plan)
            self.assertLess(m['tve']['V'], 2.1e-5)
            self.assertLess(m['tve']['I'], 5e-5)
            r = se.run(self.net, m)
            self.assertTrue(r['converged'], plan)
            self.assertEqual(r['plan'], 'emt-' + plan)
            self.assertLess(r['error']['vector_max'], 2.5e-5, plan)
            self.assertLess(r['error']['angle_max'], 3e-4, plan)
            self.assertFalse(r['suspect'], plan)
            self.assertEqual(r['bad'], [], plan)
            self.assertEqual(r.get('absolute', False), plan != 'scada', plan)
            self.assertEqual(r['n'], 18 if plan != 'scada' else 17, plan)
            if plan == 'current':
                self.assertEqual(r['start'], 'pmu')
        # the same units on the sine of the studio give the same estimate; on the cosine read as the sine, every angle 90° off
        for plan in ('pmu', 'current'):
            a = se.run(self.net, se.from_emt(self.net, self.pts, plan))['_V']
            np.testing.assert_allclose(se.run(self.net, se.from_emt(self.net, self.sin, plan, ref='sin'))['_V'], a, atol=1e-12)
            b = se.run(self.net, se.from_emt(self.net, self.pts, plan, ref='sin'))
            self.assertAlmostEqual(abs(b['error']['angle_max']), 90.0, delta=1e-3)

    def test_a_gross_error_in_each_plan(self):
        for plan, bad, t in (('scada', 'flow', 'Pf'), ('pmu', 'phasor', 'Vi'), ('current', 'current', 'If'), ('current', 'phasor', 'Vi')):
            m = se.from_emt(self.net, self.pts, plan, bad=bad)
            r = se.run(self.net, m)
            self.assertTrue(r['converged'], (plan, bad))
            self.assertEqual(r['bad'][0]['index'], m['bad'][0], (plan, bad))
            self.assertEqual(r['bad'][0]['type'], t)
            self.assertLess(r['error']['vector_max'], 1e-4, (plan, bad))
        # one voltage phasor alone (mixed) is the only angle on the common time reference: its gross error turns every angle and
        # is hardly seen (measured: 20σ in its imaginary part, normalized residual 0.31, every angle 2.2° off)
        m = se.from_emt(self.net, self.pts, 'mixed', bad='phasor')
        r = se.run(self.net, m)
        self.assertEqual(r['bad'], [])
        self.assertLess(r['measurements'][m['bad'][0]]['rN'], 0.5)
        self.assertGreater(r['error']['angle_max'], 2.0)

    def test_study_and_refusals(self):
        out = S.run({'case': 'ieee9', 'study': 'se', 'options': {'emt': {'points': self.pts, 'plan': 'pmu'}}})
        sm = out['summary']
        self.assertTrue(sm['converged'])
        self.assertEqual(sm['plan'], 'emt-pmu')
        self.assertTrue(sm['absolute'])
        self.assertLess(sm['tve']['V'], 2.1e-5)
        with self.assertRaises(S.StudyError):
            S.run({'case': 'ieee9', 'study': 'se', 'options': {'emt': {'points': self.pts, 'plan': 'everything'}}})
        with self.assertRaises(S.StudyError):
            S.run({'case': 'ieee9', 'study': 'se', 'options': {'emt': {'points': [dict(self.pts[0], V=0.0)], 'plan': 'pmu'}}})
        with self.assertRaises(S.StudyError):
            S.run({'case': 'ieee9', 'study': 'se', 'options': {'emt': {'points': self.pts, 'when': 1}}})
        with self.assertRaises(S.StudyError):
            S.run({'case': 'ieee9', 'study': 'se', 'options': {'emt': {'points': self.pts, 'ref': 'tan'}}})

    def test_the_card(self):
        c = self.js['card']
        self.assertEqual([q['k'] for q in c['options']], ['plan', 'bad'])
        self.assertEqual(c['options'][0]['values'], list(se.EMT_PLANS)[1:2] + ['scada', 'mixed', 'current'])
        self.assertEqual((self.js['meta']['emt']['f'], self.js['meta']['emt']['ref']), (60, 'cos'))


if __name__ == '__main__':
    unittest.main()
