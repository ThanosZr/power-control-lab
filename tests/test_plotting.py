"""Figures for publication from CSV (3.15, ROADMAP §36): reading, the mapping of label_mapping.csv, presets, extremes."""
import json
import math
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from pcl import plotting as pp  # noqa: E402

try:
    import matplotlib  # noqa: F401
    HAS_MPL = True
except ImportError:
    HAS_MPL = False

# the first lines of label_mapping.csv of the Lightning Impulse Manager 1.2.0 (branch ref-materials), as the tool writes it
LIM_MAP = ('VariableName;PlotLabel;Unit;Multiplier;LegendName;GroupName;GroupPriority\n'
           'DEV2/cI2;DEV2/cI2;;1;;;NaN\nOHL_phase_a_1;OHL_phase_a_1;;1;;;NaN\nOHL_phase_b_1;OHL_phase_b_1;;1;;;NaN\n')


def sine_csv(n=2001, sep=',', dec='.', amp=10.0, f=50.0, extra=''):
    lines = [sep.join(['t [s]', 'V:C1 [V]', 'I:L1 [A]'])]
    for k in range(n):
        t = k * 0.04 / (n - 1)
        row = [repr(t), repr(amp * math.sin(2 * math.pi * f * t)), repr(1.0 + 0.5 * math.cos(2 * math.pi * f * t))]
        lines.append(sep.join(x.replace('.', dec) for x in row))
    return extra + '\n'.join(lines) + '\n'


class Plotting(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp(prefix='pcl-plot-'))

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_the_tools_mapping_reads_as_it_is(self):
        f = self.tmp / 'label_mapping.csv'
        f.write_text(LIM_MAP, encoding='utf-8')
        rows = pp.read_mapping(f)
        self.assertEqual([r['VariableName'] for r in rows], ['DEV2/cI2', 'OHL_phase_a_1', 'OHL_phase_b_1'])
        self.assertTrue(all(r['Plot'] and r['Multiplier'] == 1 and math.isnan(r['GroupPriority']) and r['Transform'] == 'none' for r in rows))
        g = self.tmp / 'full.csv'
        pp.write_mapping(g, rows)                                   # all the columns of §36; the tool reads its own ones back
        self.assertEqual([r['VariableName'] for r in pp.read_mapping(g)], [r['VariableName'] for r in rows])
        self.assertTrue(g.read_text(encoding='utf-8').startswith('Plot;VariableName;PlotLabel;Unit;Multiplier'))

    def test_read_app_and_greek_csv(self):
        a = pp.read_table(sine_csv(extra='# pcl: "3.15"\n# project: "x"\n'))
        b = pp.read_table(sine_csv(sep=';', dec=','))
        self.assertEqual(a['time'], 't')
        self.assertEqual(a['units'], {'t': 's', 'V:C1': 'V', 'I:L1': 'A'})
        self.assertEqual(a['meta']['pcl'], '3.15')
        self.assertEqual(a['data']['V:C1'], b['data']['V:C1'])

    def test_mapping_transform_groups_and_extremes(self):
        tb = pp.read_table(sine_csv())
        m = [{'VariableName': 'V:C1', 'PlotLabel': 'v_C', 'Unit': 'kV', 'Multiplier': 1e-3, 'GroupName': 'τάσεις', 'GroupPriority': 2},
             {'VariableName': 'I:L1', 'PlotLabel': 'i_L', 'Unit': 'A', 'Transform': '-x', 'GroupName': 'ρεύματα', 'GroupPriority': 1},
             {'VariableName': 'I:L1', 'PlotLabel': 'κρυφό', 'Plot': '0'}]
        s = pp.signals(tb, m)
        self.assertEqual([x['PlotLabel'] for x in s], ['v_C', 'i_L'])
        self.assertEqual([g for g, _ in pp.groups(s)], ['ρεύματα', 'τάσεις'])          # by GroupPriority
        e = {r['signal']: r for r in pp.extremes(tb, m)}
        self.assertAlmostEqual(e['v_C']['max'], 0.01, delta=1e-6)
        self.assertAlmostEqual(e['v_C']['rms'], 0.01 / math.sqrt(2), delta=1e-6)       # two whole periods
        self.assertAlmostEqual(e['i_L']['mean'], -1.0, delta=1e-6)
        self.assertAlmostEqual(e['i_L']['rms'], math.sqrt(1 + 0.125), delta=1e-6)
        tex = pp.table_text(list(e.values()), 'tex')
        self.assertIn('\\begin{tabular}', tex)

    def test_presets(self):
        names = pp.presets()
        self.assertEqual(sorted(names), ['ieee', 'lab', 'slides', 'thesis'])
        for n in names:
            p = pp.preset(n)
            for k in ('width_cm', 'height_cm', 'font', 'size', 'linewidth', 'colors', 'dpi'):
                self.assertIn(k, p, n)
        self.assertEqual(pp.preset('ieee')['width_cm'], 8.8)
        self.assertEqual(pp.preset('ieee', size={'base': 9})['size']['tick'], 7)          # an override keeps the rest

    @unittest.skipIf(not HAS_MPL, 'matplotlib δεν είναι εγκατεστημένο')
    def test_ieee_figure_size_and_repeatability(self):
        f = self.tmp / 'a.csv'
        f.write_text(sine_csv(), encoding='utf-8')
        outs = []
        for k in range(2):
            o = self.tmp / f'f{k}.svg'
            r = pp.figure({'files': [str(f)], 'preset': 'ieee', 'out': str(o), 'table': str(self.tmp / 'max.csv')})
            outs.append(o.read_bytes())
        self.assertAlmostEqual(r['size_cm'][0], 8.8, places=6)
        self.assertIn(b'width="249.448819pt"', outs[0])                # 8.8 cm in points
        self.assertEqual(outs[0], outs[1])                              # the same spec, the same file
        self.assertEqual(r['groups'], ['V', 'A'])
        self.assertTrue((self.tmp / 'max.csv').read_text(encoding='utf-8').startswith('file,signal'))
        files = []
        for k, a in enumerate((5, 10, 15)):
            g = self.tmp / f'w{k}.csv'
            g.write_text(sine_csv(n=401, amp=a), encoding='utf-8')
            files.append(str(g))
        w = pp.figure({'files': files, 'kind': 'waterfall', 'signal': 'V:C1', 'preset': 'thesis', 'out': str(self.tmp / 'w.png')})
        self.assertEqual(w['files'], ['w0', 'w1', 'w2'])
        self.assertAlmostEqual(max(r['max'] for r in w['extremes'] if r['signal'] == 'V:C1'), 15, delta=1e-6)


if __name__ == '__main__':
    unittest.main()
