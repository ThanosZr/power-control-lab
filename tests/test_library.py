"""The library of parts in taxonomies (4.6, decision 55; web/studio/library.js): every visible part appears in every
taxonomy (exactly once, except «Κατά μάθημα» where a part may belong to more than one course), a part that no taxonomy
names goes to «Άλλα», the search ignores accents, favourites and recent parts are their own taxonomy, alphabetical in the
Greek order. The drawing of the list and the remembered choices are checked in the browser (tests/ui/ux_flow.js)."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Library(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests/js/library_cases.js')], capture_output=True, text=True, timeout=120, check=True)
        cls.r = json.loads(out.stdout)

    def test_every_part_in_every_taxonomy(self):
        vis = set(self.r['visible'])
        self.assertGreater(len(vis), 70)
        for tid, t in self.r['tax'].items():
            if tid == 'mine':
                continue
            self.assertEqual(set(t['items']), vis, tid)
            if not t['multi']:
                self.assertEqual(len(t['items']), len(vis), tid + ': a part twice')
        self.assertEqual(self.r['tax']['level']['groups'], ['Βασικά', 'Προχωρημένα'])

    def test_search_favourites_and_new_parts(self):
        self.assertEqual(self.r['search']['pinio'], ['L'])
        self.assertIn('SW', self.r['search']['sw'])
        self.assertIn('CB3', self.r['search']['sw'])
        self.assertEqual(self.r['search']['none'], 0)
        self.assertEqual(self.r['tax']['mine']['items'], ['R', 'CPL', 'SCR', 'L'])
        self.assertEqual(self.r['extra'], ['NEWX'])
        self.assertEqual(self.r['abcOrder'][:2], ['Άθροισμα', 'Αλεξικέραυνο (MOV, μη γραμμική αντίσταση)'])   # Ά sorts with Α


if __name__ == '__main__':
    unittest.main()
