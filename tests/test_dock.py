"""5.0.5 (ROADMAP §94 step β): the model of the layout of the cards (web/studio/dock.js), without a page. A card goes to a
region (left, right, bottom), floats, goes as a tab next to another card (not into a floating window, which is one card),
comes back to its place in the page; a group of many cards in the page goes to the place of its first card; a layout from
the storage keeps only known cards in known regions, each once, and brings back a card it does not have. 5.0.6 (§94 step γ):
two cards of a group side by side, and the first place of a document (a tab next to the circuit). A random walk of 4000
actions keeps every card in exactly one group. The page itself is checked in tests/ui/dock_flow.js.
5.0.10 (§94 steps δ and ε): the four ready layouts from the cards there are, where a layout came from (the first page, a
layout of the list, a tutorial, a saved one, the user's own; an older layout without it is the first page only when it is
one), and the second screen as a region of one card (no tab into it, no side by side there, its window's rectangle kept)."""
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

    def test_ready_layouts(self):
        # 5.0.10 (§94 step δ): the four ready layouts, each a valid layout of all the cards of the page
        p = self.C['presets']
        self.assertEqual(p['names'], ['home', 'design', 'study', 'analysis'])
        self.assertEqual(p['titles'], ['Αρχική', 'Σχέδιο', 'Μελέτη δικτύου', 'Ανάλυση'])
        self.assertEqual(p['inv'], ['', '', '', ''])
        self.assertEqual(p['from'], [{'kind': 'home'}, {'kind': 'preset', 'name': 'design'}, {'kind': 'preset', 'name': 'study'}, {'kind': 'preset', 'name': 'analysis'}])
        self.assertTrue(p['home'])                                   # «Αρχική» is the first page
        self.assertIsNone(p['unknown'])
        d = self.C['presetDesign']                                   # the circuit in the page, the scopes under it
        self.assertEqual((d['scope']['at'], d['bottom']), ('bottom', 440))
        self.assertEqual(d['main'][0], 'circuit')
        s = self.C['presetStudy']                                    # the diagram in the place of the circuit, the description right
        self.assertEqual((s['nv']['group'], s['nv']['active'], s['c']['index']), (s['c']['group'], True, 0))
        self.assertEqual((s['th']['at'], s['right'], s['docs']), ('right', 480, ['netview']))
        a = self.C['presetAnalysis']                                 # the circuit and the scopes side by side, the rest in tabs below
        self.assertEqual((a['c']['active'], a['s']['side'], a['r'], a['c']['group']), (True, True, 0.36, a['s']['group']))
        self.assertEqual(a['bottom'], [[['math', 'cmd', 'scen'], 'math']])
        self.assertEqual(a['size'], 320)
        f = self.C['presetFew']                                      # a card that is not there is left out
        self.assertEqual(f['inv'], ['', '', '', ''])
        self.assertEqual(f['study']['tabs'], 1)
        self.assertEqual(f['analysis'], [['math', 'scen']])

    def test_where_a_layout_came_from(self):
        f = self.C['from']
        self.assertEqual((f['fresh'], f['kept']), ({'kind': 'home'}, {'kind': 'preset', 'name': 'design'}))
        self.assertEqual(f['bad'], {'kind': 'user'})                 # not a kind: as an older layout that is not the first page
        self.assertEqual((f['oldHome'], f['oldUser'], f['oldTabs']), ({'kind': 'home'}, {'kind': 'user'}, {'kind': 'user'}))
        self.assertEqual(f['name'], 60)
        self.assertEqual((f['sameIds'], f['notSame']), (True, False))

    def test_the_second_screen_in_the_model(self):
        # 5.0.10 (§94 step ε): a group of one card, as a floating window
        s = self.C['screen']
        self.assertEqual((s['w']['at'], s['w']['tabs'], s['inv']), ('screen', 1, ''))
        n = self.C['noTabIntoScreen']
        self.assertEqual((n['math']['at'], n['scope']['tabs']), ('main', 1))
        self.assertEqual(self.C['noSideOnScreen']['scope']['two'], False)
        self.assertEqual(self.C['screenAgain']['w']['group'], s['w']['group'])     # again: the same group
        t = self.C['screenToTab']                                    # from the second screen as a tab in the page
        self.assertEqual((t['scope']['at'], t['scope']['group'], t['inv']), ('main', t['math']['group'], ''))
        q = self.C['normScreen']                                     # from the storage: two windows, only a whole rectangle
        self.assertEqual((q['scope']['at'], q['math']['at'], q['inv']), ('screen', 'screen', ''))
        self.assertNotEqual(q['scope']['group'], q['math']['group'])
        self.assertEqual((q['screen'], q['rect']), (['scope'], {'x': 1, 'y': 2, 'w': 800, 'h': 600}))
        self.assertIsNone(self.C['screenMax']['max'])

    def test_random_walk(self):
        w = self.R['walk']
        self.assertEqual(w['steps'], 4000)
        self.assertEqual(w['bad'], '')
        self.assertEqual(w['end'], '')


class ScreenWindow(unittest.TestCase):
    """5.0.10 (§94 step ε): the window of the second screen (web/studio/screen.js) without a browser, against a stand-in page:
    it says hello until the page takes the card, waits again after a reload of the page (another Dock), closes when the page
    no longer has the card there or closed. The window with the real page is checked in tests/ui/dock_flow.js (§13)."""
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'screen_cases.js')], capture_output=True, text=True,
                             check=True, timeout=120, cwd=ROOT).stdout
        cls.R = json.loads(out)

    def test_alone_it_says_where_it_opens_from(self):
        a = self.R['alone']
        self.assertEqual((a['first'], a['closed'], a['ticks']), ('', 0, 1))
        self.assertIn('Σε δεύτερη οθόνη', a['later'])

    def test_the_hello_until_the_page_takes_the_card(self):
        self.assertEqual(self.R['ready'], {'calls': 3, 'card': 'scope', 'cleared': 0, 'closed': 0})

    def test_a_reload_of_the_page(self):
        r = self.R['reload']
        self.assertEqual(r['before'], 1)                              # taken once, then no more hello
        self.assertEqual((r['mid']['cleared'], r['mid']['wait']), (1, False))   # the old card leaves, the window waits
        self.assertIn('ξαναφορτώνει', r['mid']['msg'])
        self.assertEqual((r['again'], r['card'], r['cleared'], r['closed']), (2, 'netview', 1, 0))

    def test_it_closes_when_the_page_lets_it_go(self):
        self.assertEqual(self.R['close'], {'closed': 1, 'cleared': 1})
        g = self.R['gone']
        self.assertEqual((g['closed'], g['cleared']), (1, 1))
        self.assertIn('έκλεισε', g['msg'])
        self.assertEqual(self.R['foreign']['closed'], 0)


if __name__ == '__main__':
    unittest.main()
