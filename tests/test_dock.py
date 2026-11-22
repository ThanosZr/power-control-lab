"""5.0.5 (ROADMAP §94 step β): the model of the layout of the cards (web/studio/dock.js), without a page. A card goes to a
region (left, right, bottom), floats, goes as a tab next to another card (not into a floating window, which is one card),
comes back to its place in the page; a group of many cards in the page goes to the place of its first card; a layout from
the storage keeps only known cards in known regions, each once, and brings back a card it does not have. 5.0.6 (§94 step γ):
two cards of a group side by side, and the first place of a document (a tab next to the circuit). A random walk of 4000
actions keeps every card in exactly one group. The page itself is checked in tests/ui/dock_flow.js."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class DockModel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'dock_cases.js')], capture_output=True, text=True,
                             check=True, timeout=120, cwd=ROOT).stdout
        cls.R = json.loads(out)
        cls.C = cls.R['cases']

    def test_fresh_is_the_page_of_before(self):
        f = self.C['fresh']
        self.assertEqual(f['n'], 6)
        self.assertTrue(f['allMain'])
        self.assertEqual(f['order'], ['circuit', 'scope', 'scen', 'addons', 'math', 'theory'])
        self.assertEqual(f['inv'], '')

    def test_region_and_tab(self):
        self.assertEqual(self.C['left']['w']['at'], 'left')
        t = self.C['tab']
        self.assertEqual(t['scope']['group'], t['math']['group'])
        self.assertEqual((t['scope']['tabs'], t['math']['active'], t['scope']['active']), (2, True, False))
        a = self.C['activate']
        self.assertEqual((a['scope']['active'], a['math']['active']), (True, False))

    def test_no_tab_into_a_floating_window(self):
        c = self.C['noTabIntoFloat']
        self.assertEqual(c['addons']['at'], 'float')
        self.assertEqual(c['addons']['tabs'], 1)
        self.assertEqual(c['theory']['at'], 'main')

    def test_back_to_the_page_from_a_tab(self):
        c = self.C['backFromTab']
        self.assertEqual((c['math']['at'], c['math']['tabs']), ('main', 1))
        self.assertEqual((c['scope']['at'], c['scope']['tabs']), ('left', 1))

    def test_groups_in_order(self):
        self.assertEqual(self.C['bottomTwo']['groups'], [['scen'], ['theory', 'circuit', 'scope']])
        # the page: a group of many at the place of its first card (the circuit, first in the page)
        self.assertEqual(self.C['pageGroupPlace']['order'], [['theory', 'circuit'], ['scope'], ['scen'], ['addons'], ['math']])
        self.assertTrue(self.C['pageGroupPlace']['active'])

    def test_layout_from_the_storage(self):
        self.assertEqual(self.C['normGarbage'], {'a': '', 'b': '', 'c': ''})
        n = self.C['normBad']
        self.assertEqual(n['inv'], '')
        self.assertEqual((n['scope']['at'], n['scope']['tabs'], n['math']['group']), ('left', 2, n['scope']['group']))
        self.assertEqual((n['scen']['at'], n['addons']['at']), ('float', 'float'))       # a floating group of two: two windows
        self.assertNotEqual(n['scen']['group'], n['addons']['group'])
        self.assertEqual((n['theory']['at'], n['circuit']['at']), ('main', 'main'))     # an unknown region, a missing card
        self.assertEqual(n['size'], {'left': 160, 'right': 460, 'bottom': 4000})        # clamped; not a number: the first size
        self.assertEqual(n['float'], ['scen'])                                           # only known cards with a whole rectangle
        self.assertIsNone(n['max'])
        self.assertEqual(self.C['normNewCard']['w']['at'], 'main')
        self.assertEqual(self.C['normNewCard']['n'], 1)
        self.assertIn('no region sky', self.C['unknownRegion'])

    def test_side_by_side(self):
        # 5.0.6 (§94 step γ): two cards of a group shown together, the shown one on the left
        c = self.C['side']
        self.assertEqual(c['inv'], '')
        self.assertEqual((c['c']['active'], c['c']['two'], c['t']['side'], c['t']['group']), (True, True, True, c['c']['group']))
        self.assertEqual(c['r'], 0.5)
        self.assertEqual(c['order'], [['circuit', 'theory'], ['scope'], ['scen'], ['addons'], ['math']])
        a = self.C['sideActivate']                                   # the card on the right is already shown: nothing moves
        self.assertEqual((a['c']['active'], a['t']['side']), (True, True))
        t = self.C['sideThird']                                      # a third tab takes the place on the left
        self.assertEqual((t['s']['active'], t['t']['side'], t['c']['active'], t['c']['side'], t['s']['tabs']), (True, True, False, False, 3))
        self.assertEqual(t['inv'], '')
        self.assertEqual(self.C['sideRatio']['r'], 0.8)              # the share of the width within 0.2–0.8

    def test_a_card_that_leaves_two_side_by_side(self):
        s = self.C['sideLeaves']                                     # the one on the right leaves: one card at a time
        self.assertEqual((s['s']['active'], s['s']['two'], s['c']['two']), (True, False, False))
        self.assertEqual(self.C['activeLeaves']['c'], {'at': 'main', 'group': 'g0', 'tabs': 1, 'index': 0, 'active': True, 'side': False, 'two': False})
        self.assertEqual((self.C['sideOff']['c']['two'], self.C['sideOff']['m']['tabs']), (False, 2))
        self.assertEqual((self.C['noSideInFloat']['a']['at'], self.C['noSideInFloat']['a']['two']), ('float', False))
        for k in ('sideLeaves', 'activeLeaves', 'sideOff', 'noSideInFloat'):
            self.assertEqual(self.C[k]['inv'], '', k)

    def test_side_by_side_from_the_storage(self):
        n = self.C['normSide']
        self.assertEqual((n['a'], n['r'], n['b'], n['c']), ('theory', 0.8, True, True))
        self.assertEqual(n['docs'], ['scope'])
        self.assertEqual(n['inv'], '')

    def test_the_first_place_of_a_document(self):
        f = self.C['firstAs']                                        # the first time: a tab next to the circuit, and shown
        self.assertEqual((f['f1']['at'], f['f1']['tabs'], f['f1']['active'], f['f1']['group']), ('main', 2, True, 'g0'))
        self.assertEqual(f['f2']['at'], 'right')                     # after that it stays where the user put it
        self.assertEqual(f['moved']['at'], 'bottom')                 # a card the user had already placed is not moved
        self.assertEqual((f['docs'], f['fresh']), (['theory'], 0))

    def test_random_walk(self):
        w = self.R['walk']
        self.assertEqual(w['steps'], 4000)
        self.assertEqual(w['bad'], '')
        self.assertEqual(w['end'], '')


if __name__ == '__main__':
    unittest.main()
