"""4.18.1 (an issue of Thanos: «δες αν δουλεύουν σωστά τα βάρη»): the weights of the multi-objective controller of the
vehicle. In the scheme of 4.8 (moevc, as the workbench) the allocation keep reached its ceiling 1.15 with the default
weights: a larger speed or torque weight and the mode «performance» changed nothing, keep > 1 asked for more torque than
needed (a larger speed weight tracked worse) and the energy weight acted only below 45 % SOC. The scheme moevc2: the speed
weight on the gains of the speed loop, the torque weight on the slew rate and the limit of the torque, the energy weight
on a smoothing of the reference, on the power limit and on the regeneration, keep ≤ 1; the modes shift the weights.
The runs: one cycle (60 s) of the urban driving of ev_drive (tests/js/ev_weights_cases.js).
"""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / 'tests' / 'js' / 'ev_weights_cases.js'


def cases(cs, timeout=900):
    r = subprocess.run(['node', str(JS), json.dumps(cs)], capture_output=True, text=True, timeout=timeout, cwd=str(ROOT))
    if r.returncode:
        raise RuntimeError(r.stderr[-3000:])
    out = json.loads(r.stdout)
    for o in out:
        if 'error' in o:
            raise RuntimeError(o['error'][:3000])
    return out


class Weights(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        names = ['base', 'ws05', 'ws15', 'we0', 'we15', 'eco', 'perf', 'soc30', 'old', 'old_ws15']
        cs = [{}, {'set': {'ws': 0.5}}, {'set': {'ws': 1.5}}, {'set': {'we': 0}}, {'set': {'we': 1.5}},
              {'opts': {'mode': 'eco'}}, {'opts': {'mode': 'performance'}}, {'soc': 0.3},
              {'opts': {'ctrl': 'moevc'}}, {'opts': {'ctrl': 'moevc'}, 'set': {'ws': 1.5}}]
        cls.r = dict(zip(names, cases(cs)))

    def test_default_is_the_new_scheme(self):
        self.assertEqual(self.r['base']['scheme'], 'moevc2')
        for o in self.r.values():
            self.assertEqual(o['warn'], [])

    def test_speed_weight_tracks_better(self):
        r = self.r
        self.assertGreater(r['ws05']['iae'], r['base']['iae'])
        self.assertLess(r['ws15']['iae'], r['base']['iae'])

    def test_energy_weight_saves_energy_at_any_soc(self):
        r = self.r
        self.assertGreater(r['we0']['whk'], r['base']['whk'])
        self.assertLess(r['we15']['whk'], r['base']['whk'])
        self.assertLess(r['we0']['iae'], r['base']['iae'])
        self.assertGreater(r['we15']['iae'], r['base']['iae'])

    def test_modes_in_order(self):
        r = self.r
        self.assertLess(r['eco']['whk'], r['base']['whk'])
        self.assertLess(r['base']['whk'], r['perf']['whk'])
        self.assertGreater(r['eco']['iae'], r['base']['iae'])
        self.assertGreater(r['base']['iae'], r['perf']['iae'])

    def test_keep_never_above_one(self):
        for k, o in self.r.items():
            if k.startswith('old'):
                continue
            self.assertLessEqual(o['keepMax'], 1 + 1e-12, k)
        self.assertGreater(self.r['base']['keep'], 0.999)
        self.assertLess(self.r['soc30']['keep'], 0.99)   # the low SOC derates

    def test_old_scheme_kept(self):
        # moevc as in 4.8 (old files): keep at its ceiling, the speed weight above the default changes nothing
        r = self.r
        self.assertAlmostEqual(r['old']['keep'], 1.15, places=6)
        self.assertAlmostEqual(r['old']['iae'], r['old_ws15']['iae'], places=9)


if __name__ == '__main__':
    unittest.main()
