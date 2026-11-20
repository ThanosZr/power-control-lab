"""Subnetworks and multirate (4.24, THEORY §8Ι.7): tests/js/split_cases.js on web/studio/split.js.

A line with τ ≥ h splits the network; each group of subnetworks in its own simulator (Sim.restrict), in one thread or in
Workers, gives the numbers of one simulator bit for bit while the steps are the same; a switching changes the steps of its
own group only. Multirate: the slow groups take m·h. Also the other pieces of 4.24: the exciter of the reference book in
ieee9_emt and the other names of a part in the library."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Split(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', '--max-old-space-size=6000', str(ROOT / 'tests/js/split_cases.js')],
                             capture_output=True, text=True, timeout=1800, check=True)
        cls.r = json.loads(out.stdout)

    def test_the_subnetworks(self):
        p = {(x['id'], x['o'].get('line', '')): x for x in self.r['parts']}
        self.assertEqual((p[('twave', '')]['parts'], p[('twave', '')]['cuts']), (2, 1))
        self.assertEqual(p[('gis765_lv', '')]['cuts'], 39)                 # every coaxial section of the GIS
        self.assertEqual(p[('hvdc_mmc', '')]['parts'], 2)                  # the two stations, each with its control
        self.assertEqual((p[('big_grid', '')]['parts'], p[('big_grid', '')]['cuts']), (1, 0))   # π sections: nothing to cut
        self.assertEqual(p[('big_grid', 'tl')]['parts'], 44)
        self.assertEqual(p[('multirate_lines', '')]['parts'], 3)
        for x in self.r['parts']:
            if x['cuts']:
                self.assertGreaterEqual(x['tsOverH'], 1)                  # the step never exceeds τ
            self.assertFalse(x['proposal']['use'], x['id'])                # «Αυτόματα»: one simulator (the measurement)

    def test_the_groups_give_the_same_bits(self):
        rows = self.r['bits']
        self.assertEqual(len(rows), 22)
        for x in rows:
            k = (x['id'], x['G'])
            self.assertEqual((x['nan'], x['tdiff'], x['diff']), (0, 0, 0), k)
            self.assertEqual(x['n'], x['rec'], k)                            # every channel comes from one group
            self.assertTrue(x['foreignNaN'] and x['hSame'], k)
        g = {(x['id'], x['G']): x['groups'] for x in rows}
        self.assertEqual(g[('gis765_lv', 99)], 38)
        self.assertEqual(g[('big_grid', 99)], 44)

    def test_workers_give_the_same_bits(self):
        rows = self.r['workers']
        self.assertEqual(len(rows), 4)
        for x in rows:
            self.assertEqual((x['groups'], x['nan'], x['tdiff'], x['diff']), (2, 0, 0, 0), x['id'])
            self.assertEqual(x['n'], x['rec'], x['id'])

    def test_a_switching_changes_only_its_group(self):
        e = self.r['events']
        self.assertAlmostEqual(e['firstT'], 0.04, places=12)              # the same bits up to the fault
        for k in ('V', 'I'):
            self.assertLess(e[k]['rmsSplit'], e[k]['rmsHalf'], k)        # less than the error of the integration
            self.assertLess(e[k]['maxSplit'], 1e-5, k)                    # 1 ms after the switching
            self.assertGreater(e[k]['maxHalf'], 1e-2, k)

    def test_multirate(self):
        r = self.r['rates']
        self.assertEqual((r['fineSteps'], r['coarseSteps']), (2001, 134))
        n = r['smooth']['none']
        self.assertEqual(n['groups'], [1, 15])
        self.assertEqual(n['steps'], [2001, 134])
        e, c = n['err'], r['coarse']
        self.assertLess(e['V:C1']['rms'], 0.011)                          # the fast area with 1 μs
        self.assertGreater(c['V:C1']['rms'], 0.08)                        # and with 15 μs everywhere
        for k in ('I:L1', 'I:L2', 'I:L3', 'V:L1', 'V:L2'):
            self.assertLess(e[k]['rms'], c[k]['rms'], k)                  # better than 15 μs everywhere
        self.assertLess(e['I:L1']['rms'], 0.009)
        # the smoothing of equal area (Eq. (10) of the dual time step paper) makes the slow side worse here
        a = r['smooth']['area']['err']
        self.assertGreater(a['V:L2']['rms'], 5 * e['V:L2']['rms'])

    def test_the_exciter_of_the_book(self):
        a = {x['ctl']: x for x in self.r['avr']}
        self.assertEqual(a['book']['avrs'], ['AV2'])
        self.assertAlmostEqual(a['none']['slip21'], 0.636, places=3)
        self.assertAlmostEqual(a['book']['slip21'], 0.686, places=3)      # later, but generator 2 still slips
        self.assertAlmostEqual(a['book']['slip31'], 0.828, places=3)
        self.assertAlmostEqual(a['book']['maxEfd2'], 3.644, places=2)
        self.assertIsNone(a['avr']['slip21'])                              # ST1A on every generator holds them
        self.assertIsNone(a['avr']['slip31'])

    def test_the_library_finds_the_grid_equivalent(self):
        L = self.r['library']
        self.assertIn('GRID3', L['pigi'])
        self.assertEqual(L['sk'], ['GRID3'])
        self.assertEqual(L['three'], ['VAC3', 'GRID3'])
        self.assertEqual(L['fault'], ['FLT3'])


if __name__ == '__main__':
    unittest.main()
