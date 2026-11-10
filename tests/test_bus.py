"""Buses and vectors (3.18, ROADMAP §3): web/studio/bus.js through the browser solver, the SciPy solver and pcl."""
import json
import math
import shutil
import subprocess
import sys
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import pcl  # noqa: E402
from engine.batch import simulate  # noqa: E402

CASES = ROOT / 'tests' / 'js' / 'bus_cases.js'
HAS_NODE = shutil.which('node') is not None


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the buses are expanded by web/studio/bus.js).')
class Buses(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=300)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.R = json.loads(run.stdout)

    def test_same_results_as_separate_wires(self):
        # §3: a three-phase source, an electrical bus, ammeters into a Mux, Clarke on buses: bit for bit the drawing with
        # three wires, and the gain on the αβ bus is two gains
        r = self.R['threePhase']
        self.assertTrue(r['same'])
        self.assertEqual(r['steps'][0], r['steps'][1])
        self.assertEqual(r['vec'], {'GN': 2})
        self.assertFalse(r['warnings'])
        # R–L load, 100 V, 50 Hz: |Z| = √(5² + (2π·50·0,01)²)
        self.assertAlmostEqual(r['ia'], 100 / math.hypot(5, 2 * math.pi * 50 * .01), delta=.02)

    def test_subcircuit_ports_with_a_width(self):
        s = self.R['sub']
        self.assertEqual(s['ports'], [{'id': 'P1', 'name': 'abc', 'kind': 'el', 'side': 'r', 'w': 3}])
        self.assertLess(s['maxDiff'], 1e-9)
        # Ctrl+G across the bus wire: the port takes the width of the bus, same currents
        self.assertIn({'type': 'PORT', 'width': '3'}, s['create']['ports'])
        self.assertLess(s['create']['maxDiff'], 1e-9)

    def test_display_of_a_vector(self):
        self.assertEqual(self.R['vecDisp'], {'vec': 3, 'v': [1, 2, 3]})

    def test_vector_b1_blocks_are_scalar_copies(self):
        # 3.19: second-order filter, rate limiter and edge detector per element, parameters with ';'
        v = self.R['vecB1']
        self.assertEqual(v['vec'], v['sep'])

    def test_vector_pi_is_two_scalar_loops(self):
        v = self.R['vecPI']
        self.assertTrue(v['same'])
        self.assertEqual(v['steps'][0], v['steps'][1])
        self.assertEqual(set(v['vec']), {'RF', 'E', 'KP', 'KI', 'I', 'S', 'P', 'PG', 'PY'})
        for x, y in zip(v['display'], v['end']):
            self.assertAlmostEqual(x, y, delta=1e-12 * abs(y))
        # a live change by the id of the drawing reaches both elements
        self.assertTrue(v['setBlock'])
        self.assertEqual(v['liveK'], [5, 5])

    def test_demux_selector_vector_constant_tags(self):
        w = self.R['wiring']
        # K1 = (1, 2, 3), gain (10, 20, 30) → (10, 40, 90); selector «3, 1» → (90, 10), a − b = 80; a bus through Goto/From
        # into a Mux with a scalar: 4 elements, the fourth is 7
        self.assertEqual(w['y'], [2, 10, 90, 90, 80, 7, 40])
        self.assertEqual(w['vec'], {'K1': 3, 'GN': 3})
        self.assertEqual(w['w'], {'gn': 3, 'bs': 2, 'm2': 4, 'd6': 1, 'errors': []})
        self.assertFalse(w['warnings'])

    def test_wire_names_join(self):
        # version 3: one name = one node (electrical with electrical, signal with signal); an older file: only a label
        n = self.R['named']
        self.assertEqual((n['vm'], n['i'], n['apart'], n['signal'], n['elec']), (10, 1, 0, 4, 3))
        self.assertFalse(n['warnings'])
        # an older file opens the same: «v» on two nodes becomes «v», «v·2»; joined as they are, the two sources would short
        m = n['migrate']
        self.assertEqual(m['renamed'], [{'where': None, 'name': 'v', 'to': ['v', 'v·2']}])
        self.assertEqual((m['version'], sorted(m['names'])), (3, ['v', 'v·2']))
        self.assertEqual(m['now'], m['old'])
        self.assertIsNotNone(m['joined'])
        self.assertEqual(m['again'], 0)

    def test_widths_that_do_not_fit(self):
        e = self.R['errors']
        self.assertIn('πλάτος 3 (K1.y) και 1 (D1.vdc)', e['scalarIn'])
        self.assertIn('δεν χωρίζεται σε 2', e['demux'])
        self.assertIn('η είσοδος a έχει πλάτος 2', e['elementwise'])
        self.assertIn('ζητά το στοιχείο 3', e['select'])
        self.assertIn('2 τιμές για 3 στοιχεία', e['perElement'])
        self.assertIn('δίαυλο αγωγών', e['electrical'])
        self.assertIn('πλάτος 2 (X1/u) και 3 (K1.y)', e['port'])
        self.assertEqual(e['editor'], [e['scalarIn']])

    def test_tutorial_widths_and_old_tutorials(self):
        t = self.R['tutorial']
        self.assertEqual(t['widths'], {'inv': 3, 'i': 3, 'ab': 2, 'dq': 2, 'th': 1, 'ref': 2})
        self.assertFalse(t['errors'])
        # no other tutorial has a bus: their circuits reach the solver exactly as before
        self.assertEqual(t['untouched'], [])
        self.assertEqual((t['flat']['wiring'], t['flat']['busPins']), (0, 0))
        self.assertEqual(t['flat']['copies'], 18)

    def test_scipy_gets_the_scalar_circuit(self):
        b = self.R['batch']
        rs = simulate({**b['sep'], 't_end': .03})
        rb = simulate({**b['bus'], 't_end': .03})
        self.assertEqual(rb['status'], 'ok')
        grid = np.linspace(1e-3, .03, 3001)
        for ks, kb in (('I:La', 'I:La'), ('Y:GA', 'Y:GN[1]'), ('Y:GB', 'Y:GN[2]')):
            gs = np.interp(grid, rs['t'], rs['ch'][ks])
            gb = np.interp(grid, rb['t'], rb['ch'][kb])
            self.assertLess(float(np.max(np.abs(gs - gb))), 1e-6 * max(1, float(np.max(np.abs(gs)))), ks)
        # the tutorial (vector PI, buses, average model) at 40 ms: SciPy and the browser on the references. SciPy holds the
        # continuous blocks over T/200 = 100 μs (a ZOH on v*), so its transients differ by a few tenths of an ampere.
        t = self.R['tutorial']
        r = simulate({**t['req'], 't_end': .04})
        self.assertEqual(r['status'], 'ok')
        for got in ((r['ch']['Y:PK'][-1], r['ch']['Y:PK:q'][-1]), (t['browser']['id'], t['browser']['iq'])):
            self.assertAlmostEqual(got[0], 10, delta=.02)
            self.assertAlmostEqual(got[1], 5, delta=.02)


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the browser solver runs in Node).')
class PclVectors(unittest.TestCase):
    """pcl on a project with buses: a list sets one value per element, the channels of the copies are <id>[k]."""

    def test_list_values_and_channels(self):
        p = pcl.tutorial('bus_dq')
        self.assertIn('Y:KP[1]', p.channels()['keys'])
        p.set('IR.v', ['0:0, 0.005:8', '0:0, 0.012:-4'])
        self.assertEqual(p.get('IR.v'), '0:0, 0.005:8; 0:0, 0.012:-4')
        m = p.run(t_end='20m', measure={'id': ('Y:PK', 'end', 1), 'iq': ('Y:PK:q', 'end', 1)}).measured
        self.assertAlmostEqual(m['id'], 8, delta=.02)
        self.assertAlmostEqual(m['iq'], -4, delta=.02)


if __name__ == '__main__':
    unittest.main()
