"""4.17.3 (ROADMAP §65, THEORY §8Γ): the technical look, headless: the paths of a symbol made only of horizontal and
vertical segments are found (drawn without antialiasing: no grey edge), the IEC resistor is a rectangle and the ANSI one
a zig-zag, and every symbol of the library goes through the marking. In the browser: tests/ui/scope_flow.js (block 9)."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Look(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'look_cases.js')], capture_output=True, text=True,
                             check=True, timeout=300, cwd=ROOT).stdout
        cls.R = json.loads(out)

    def test_axis_aligned_paths(self):
        # zig-zag (no), plates of a capacitor (yes), a rectangle (yes), arcs (no), L in absolute and relative (yes), a slant
        self.assertEqual(self.R['hv'], [False, True, True, False, True, True, False])
        m = self.R['marked']
        self.assertIn('<path class="hv" d="M0,0 H10"/>', m)
        self.assertIn('class="thin hv"', m)
        self.assertIn('<path d="M0,0 L5,5"/>', m)          # a slanted line keeps its antialiasing
        self.assertIn('<circle r="3"/>', m)

    def test_resistor_styles(self):
        self.assertEqual((self.R['style1'], self.R['style2']), ('iec', 'ansi'))
        self.assertIn('H15 V6 H-15 Z', self.R['iec'])         # IEC: a rectangle
        self.assertIn('l2.5,-7', self.R['ansi'])              # ANSI: the zig-zag of before

    def test_every_symbol(self):
        L = self.R['lib']
        self.assertEqual(L['bad'], [])
        self.assertGreater(L['n'], 150)
        self.assertGreater(L['hv'], 0.4 * L['n'])               # most paths of the library are crisp lines


if __name__ == '__main__':
    unittest.main()
