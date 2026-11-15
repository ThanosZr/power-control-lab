"""4.17.5 (ROADMAP §66, THEORY §8Δ): the labels of the parts on a dense drawing, headless (lblplace.js with estimated
widths): a sparse drawing keeps the places of before; a column of inputs takes one side and nothing falls on anything; a
long expression is cut to its block (whole in the tooltip); a wire or the pins of the part push the label away; the same
drawing gives the same layout; in every tutorial no label lies on another label or on a part (before 4.17.5: tens and
hundreds); the parameters «= …» show numbers, not NaN. In the browser, with the fonts of the page: tests/ui/scope_flow.js
(block 11)."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Labels(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'lblplace_cases.js')], capture_output=True, text=True,
                             check=True, timeout=600, cwd=ROOT).stdout
        cls.R = json.loads(out)

    def test_sparse_keeps_the_places_of_before(self):
        for it in self.R['sparse']:
            self.assertEqual((it['form'], it['cost'], it['cut']), (0, 0, False), it)
        self.assertEqual(self.R['sparse'][0]['side'], 'above')

    def test_column_of_inputs(self):
        c = self.R['column']
        self.assertEqual(len(c['sides']), 1)
        self.assertEqual((c['check']['ll'], c['check']['lp']), (0, 0), c['check']['bad'])

    def test_long_expression_cut_to_its_block(self):
        e = self.R['expr']
        self.assertTrue(e['cut1'])
        self.assertLessEqual(e['mw'], max(e['bw'] + 24, 96) + 1e-9)
        self.assertTrue(e['full'].startswith('(vk/3.6') and e['full'].endswith('0.85)'))   # the whole text for the tooltip
        self.assertFalse(e['cut2'])
        self.assertEqual(e['mw2'], 0)

    def test_wire_and_pins_push_the_label(self):
        self.assertNotEqual(self.R['wire']['side'], 'above')
        self.assertEqual(self.R['wire']['check']['wire'], 0)
        p = self.R['pins']['check']
        self.assertEqual((p['ll'], p['lp']), (0, 0), p['bad'])

    def test_deterministic(self):
        self.assertTrue(self.R['same'])

    def test_every_tutorial(self):
        a = self.R['all']
        self.assertGreaterEqual(a['n'], 61)
        self.assertEqual((a['ll'], a['lp']), (0, 0), a['bad'])
        # before 4.17.5, the same measure: labels on labels and on parts in most tutorials
        self.assertGreater(a['old']['ll'], 20)
        self.assertGreater(a['old']['lp'], 100)
        self.assertGreater(a['old']['tuts'], 30)
        self.assertLess(a['ms'], 400)

    def test_values_of_expressions(self):
        v = self.R['values']
        self.assertIn('J 0,171', v['m1'])
        self.assertEqual(v['gv'], 'K = 36,4 m')
        self.assertNotIn('NaN', v['m1raw'])
        self.assertIn('—', v['m1raw'])
        self.assertEqual(v['gvraw'], 'K = —')
        self.assertEqual(v['ref'], v['refExpr'])            # the whole expression: the layout cuts it, not valueText


if __name__ == '__main__':
    unittest.main()
