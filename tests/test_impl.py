"""Every library part in two implementations (4.9.1, ROADMAP §52, rule of 13/11): the fast ready-made part and the detailed
one built from basic elements give the same circuit; a library part expanded into an ordinary subcircuit (SubCircuit.fromLib)
gives the same numbers bit for bit; every part has a drawing (NetLib.layoutDef, Inside.drawEl); the L₁ of the IEEE arrester
can be adjusted to U₁₀; the SciPy export takes the detailed implementation."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def cases(c):
    out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'impl_cases.js'), json.dumps(c)], capture_output=True,
                         text=True, check=True, timeout=900, cwd=ROOT).stdout
    return json.loads(out)


class Arrester(unittest.TestCase):
    def test_fast_equals_detailed(self):
        # SAIX (inner nodes eliminated in each iteration) against L0 ∥ R0, L1 ∥ R1, C, A0, A1 in the circuit, all three methods
        cs = [{'kind': 'arr', 'I': 3e3, 'T1': 30e-6, 'T2': 60e-6, 'method': m} for m in ('TR', 'BE', 'BDF2')]
        cs += [{'kind': 'arr', 'I': 10e3, 'T1': 8e-6, 'T2': 20e-6, 'Ll': 5e-6, 'method': 'TR'}]
        for c, r in zip(cs, cases(cs)):
            self.assertEqual(r['n'], r['nf'])
            self.assertLess(r['d'] / r['v'], 1e-9, (c, r))
            self.assertAlmostEqual(r['v'], r['vf'], delta=1e-6 * r['v'])

    def test_l1_adjusted_to_u10(self):
        # the IEEE WG procedure: L₁ lowered until 10 kA 8/20 μs gives U₁₀ (with the initial L₁: 845 kV, test_lightning)
        r = cases([{'kind': 'fit', 'U10': 819e3, 'd': 3.216, 'n': 1}])[0]
        self.assertLess(abs(r['err']), 5e-4, r)
        self.assertLess(abs(r['v'] / 819e3 - 1), 1e-3, r)
        self.assertTrue(0.3 < r['k'] < 0.9, r)


class Lightning(unittest.TestCase):
    def test_tutorial_fast_equals_detailed(self):
        # towers with the footing R(I) solved from the history of their line, arresters as one element each; the same peaks
        # and the same flashovers (at the same step) as the detailed parts of 4.9
        ovs = [{}, {'foot': 'r50', 'I': '100'}, {'strike': 'phase', 'I': '20'}, {'sa': 'none'}]
        for ov, r in zip(ovs, cases([{'kind': 'lightning', 'ov': o} for o in ovs])):
            self.assertLess(r['d'], 1e-6, r)
            self.assertEqual(r['flash'], r['flashFast'], r)
        r = cases([{'kind': 'lightning', 'ov': {'foot': 'r50', 'I': '100'}}])[0]
        self.assertEqual(sorted(r['flash']), ['T2a', 'T2c'])      # the backflashover of test_lightning, unchanged


class Expand(unittest.TestCase):
    def test_library_parts_as_subcircuits(self):
        # every type of the library that a tutorial uses, all parts expanded: the same circuit, the same channels
        cs = [{'kind': 'expand', 'id': 'lightning_gis', 'stop': 5e-6}, {'kind': 'expand', 'id': 'net_fault', 'stop': 0.004},
              {'kind': 'expand', 'id': 'fbm', 'stop': 0.004}, {'kind': 'expand', 'id': 'gen_ctl', 'stop': 0.004},
              {'kind': 'expand', 'id': 'trv_slf', 'stop': 2e-4}, {'kind': 'expand', 'id': 'ai_block', 'stop': 0.004},
              {'kind': 'expand', 'id': 'ev_drive', 'stop': 0.004}]
        seen = set()
        for r in cases(cs):
            self.assertTrue(r['allSub'], r)
            self.assertGreater(r['steps'], 3, r)
            self.assertEqual(r['d'], 0, r)
            seen.update(r['types'])
        self.assertTrue({'TOWER', 'SAI', 'GRID3', 'CB3', 'FLT3', 'LOAD3', 'XF3', 'LINE3', 'AVR', 'PSS', 'ARC', 'AIC', 'EVC'} <= seen, seen)


class Drawing(unittest.TestCase):
    def test_every_part_has_a_drawing(self):
        r = cases([{'kind': 'draw'}])[0]
        for k, v in r.items():
            self.assertIsNone(v['err'], (k, v))
            self.assertEqual(v['bad'], 0, (k, v))
            self.assertEqual(v['ov'], 0, (k, v))                  # no two parts on the same spot
            self.assertGreater(v['svg'], 1000, (k, v))
        for k in ('TOWER', 'TOWER:fast', 'SAI', 'SAI:fast'):       # drawn by hand in the definition
            self.assertTrue(r[k]['placed'], k)
        self.assertEqual(r['SAI']['parts'], 9)                     # I, V, L0, R0, L1, R1, C, A0, A1
        self.assertEqual(r['SAI:fast']['parts'], 3)                # I, V, the compact element
        self.assertEqual(r['TOWER']['parts'], 13)


class Export(unittest.TestCase):
    def test_scipy_gets_the_detailed_parts(self):
        r = cases([{'kind': 'export'}])[0]
        self.assertEqual(r['compact'], 9)                          # 6 arresters + 3 footings, fast, in the browser solver
        self.assertEqual(r['nNLlocal'], 6)
        self.assertEqual(r['nNL'], 15)                             # 12 ZnO + 3 footings R(I) for the server


if __name__ == '__main__':
    unittest.main()
