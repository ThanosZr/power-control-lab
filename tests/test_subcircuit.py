"""Subcircuits (3.17, ROADMAP §9): web/studio/subcircuit.js through the browser solver, the SciPy solver and pcl."""
import json
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

CASES = ROOT / 'tests' / 'js' / 'subcircuit_cases.js'
HAS_NODE = shutil.which('node') is not None


def close(a, b, rel=1e-9):
    return abs(a - b) <= rel * max(1.0, abs(b))


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the subcircuits are built by web/studio/subcircuit.js).')
class Subcircuits(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=300)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.R = json.loads(run.stdout)

    def test_same_results_as_the_drawn_circuit(self):
        # §9: the same circuit drawn open, as an instance (three different selections) and expanded back
        b = self.R['buck']
        for case in b['sub'] + b['exp']:
            self.assertEqual(case['steps'], b['open']['steps'])
            for x, y in zip(case['v'], b['openV']):
                self.assertTrue(close(x, y), (case, b['openV']))
        self.assertEqual([c['ports'] for c in b['sub']], [3, 2, 2])
        self.assertTrue(all(not c['warnings'] for c in b['sub']))
        self.assertTrue(all(c['sub'] == 0 for c in b['exp']))
        # the PI's sensor moved into the instance: its reference became a path; saved and opened, the same numbers
        self.assertEqual(b['sensor'], 'X1/C1')
        self.assertTrue(close(b['json'], b['openV'][0]))

    def test_pwm_from_blocks_as_a_subcircuit(self):
        # §9 test: carrier + comparator → subcircuit, the waveform unchanged (signal ports, bit for bit)
        q = self.R['pwmBlocks']
        self.assertEqual(q['open'], q['sub'])
        self.assertEqual(q['steps'][0], q['steps'][1])
        self.assertEqual(q['ports'], ['in', 'out'])

    def test_two_instances_without_shared_state(self):
        # §9 test: two instances with different f_s and slope = two separate drawn modulators, sample for sample
        q = self.R['twoInst']
        self.assertTrue(q['same'])
        self.assertTrue(q['differ'])
        self.assertAlmostEqual(q['dutyA'], 0.4, delta=0.03)      # d = 0.4 against a 0…1 carrier
        self.assertAlmostEqual(q['dutyB'], 0.2, delta=0.03)      # against 0…2

    def test_nested_and_paths(self):
        q = self.R['nested']
        self.assertTrue(q['same'])
        self.assertEqual(q['flatIds'], ['L1/D', 'L1/G', 'L1/M/CMP', 'L1/M/D', 'L1/M/G', 'L1/M/RMP'])
        self.assertTrue(q['path'])                                # L1/M.hi and L1.fs set by path
        self.assertEqual(q['paramOf'], [2, 35000, 20000])
        self.assertIn('L1/Q', q['badPath'])

    def test_recursion_and_missing_definition(self):
        self.assertIn('Αναδρομικό υποκύκλωμα', self.R['recursion'])
        self.assertEqual(self.R['cycle'][0], self.R['cycle'][-1])
        m = self.R['missing']
        self.assertTrue(any('δεν υπάρχει ο ορισμός' in w for w in m['warnings']))
        self.assertAlmostEqual(m['i'], 1.0, places=9)            # the rest of the circuit still solves

    def test_renamed_port_and_wireless_sources(self):
        q = self.R['rename']
        self.assertTrue(q['changed'])
        self.assertEqual(q['wires'], ['d', 'gate'])
        self.assertTrue(q['same'])
        self.assertTrue(self.R['wireless'])

    def test_tags_are_local(self):
        t = self.R['tags']
        self.assertEqual((t['y1'], t['y2'], t['top']), (1, 2, 7))
        self.assertFalse(t['warnings'])

    def test_scipy_gets_the_flat_circuit(self):
        b = self.R['batch']
        rs = simulate({**b['sub'], 't_end': 2e-4})
        ro = simulate({**b['open'], 't_end': 2e-4})
        self.assertEqual(rs['status'], 'ok')
        for ks, ko in (('Y:XA/CMP', 'Y:CA'), ('Y:XB/CMP', 'Y:CB')):
            gs = np.interp(np.linspace(1e-5, 2e-4, 4001), rs['t'], rs['ch'][ks])
            go = np.interp(np.linspace(1e-5, 2e-4, 4001), ro['t'], ro['ch'][ko])
            self.assertLess(float(np.mean(np.abs(gs - go))), 1e-3, ks)
        # a buck whose power stage is an instance: SciPy as for the drawn circuit, and close to the browser
        q = self.R['batchBuck']
        r1 = simulate({**q['req'], 't_end': 2e-3})
        r0 = simulate({**q['open'], 't_end': 2e-3})
        v1, v0 = r1['ch']['V:C1'][-1], r0['ch']['V:C1'][-1]
        self.assertTrue(close(v1, v0, 1e-6), (v1, v0))
        self.assertAlmostEqual(v1, q['browser']['V:C1']['now'], delta=2e-3 * abs(v1))


@unittest.skipIf(not HAS_NODE, 'Node.js not installed (the browser solver runs in Node).')
class PclPaths(unittest.TestCase):
    """pcl.set('X1/L1.L', …): a value of one instance only, as the app's 'values of this instance'."""

    def test_set_inside_an_instance(self):
        js = ("const W=%r;global.window=globalThis;global.Parts=require(W+'/parts.js');const S=require(W+'/subcircuit.js');"
              "require(W+'/mna.js');require(W+'/tutorials.js');const t=globalThis.Tutorials.get('buck');const o={};for(const x of t.options)o[x.k]=x.def;"
              "o.start='steady';const pr=t.build(o);process.stdout.write(JSON.stringify({open:pr,sub:S.create(pr,['S1','D1','L1']).project}));"
              % str(ROOT / 'web' / 'studio'))
        both = json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, timeout=60, check=True).stdout)
        p = pcl.Project(both['sub'], 'sub')
        p.set('X1/L1.L', '200u')
        self.assertEqual(p.get('X1/L1.L'), 200e-6)
        self.assertEqual(p.data['components'][-1]['params']['L1.L'], 200e-6)
        with self.assertRaises(pcl.PclError):
            p.set('X1/Q9.L', 1)
        q = pcl.Project(both['open'], 'open').set('L1.L', '200u')
        meas = {'Vo': ('V:C1', 'avg', 5)}
        a = p.run(t_end='2m', measure={**meas, 'dI': ('I:X1/L1', 'pp', 5)}).measured
        b = q.run(t_end='2m', measure={**meas, 'dI': ('I:L1', 'pp', 5)}).measured
        self.assertAlmostEqual(a['Vo'], b['Vo'], delta=1e-9 * abs(b['Vo']))
        self.assertAlmostEqual(a['dI'], b['dI'], delta=1e-9 * abs(b['dI']))
        # the hash of a project sees its definitions
        p2 = p.copy()
        p2.data['subcircuits'][next(iter(p2.data['subcircuits']))]['title'] = 'άλλος'
        self.assertNotEqual(p.hash(), p2.hash())


if __name__ == '__main__':
    unittest.main()

    def test_slash_names_and_outward_references(self):
        # 3.19: «/vbus» on a wire inside a definition joins the top level's «vbus» (questions 6 of 3.18 and 3 of 3.17);
        # what a definition takes from outside is listed, and a signal source becomes a port with the same numbers
        r = self.R['slashName']
        self.assertAlmostEqual(r['i'], 12 / 4, delta=1e-9)
        self.assertEqual(r['gn'], 6)
        self.assertEqual(r['ext'], [{'id': 'GN', 'k': 'in_u', 'ref': 'K1:y', 'kind': 'in'}])
        self.assertEqual(r['port'], 'u')
        self.assertEqual(r['inst']['in_u'], 'K1:y')
        self.assertEqual(r['gn2'], 6)
        self.assertEqual(r['ext2'], [])
        self.assertIn(['u', 'in'], r['ports'])
