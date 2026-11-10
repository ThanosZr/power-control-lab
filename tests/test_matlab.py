"""MATLAB/Octave functions of the pcl package (3.14, ROADMAP §30), run in Octave when it is installed."""
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HAS = shutil.which('octave') is not None and shutil.which('node') is not None


def octave(code):
    r = subprocess.run(['octave', '--no-gui', '--quiet', '--eval', f"addpath('{(ROOT / 'matlab').as_posix()}'); {code}"],
                       capture_output=True, text=True, timeout=600, cwd=str(ROOT))
    if r.returncode:
        raise RuntimeError(r.stderr + r.stdout)
    out = [x for x in r.stdout.splitlines() if x.startswith('JSON ')]
    return json.loads(out[-1][5:]) if out else r.stdout


@unittest.skipIf(not HAS, 'Octave (και Node.js) δεν είναι εγκατεστημένα· στον CI τρέχει σε δική του εργασία.')
class Octave(unittest.TestCase):
    def test_run_and_measure(self):
        o = octave("r = pcl_run('tutorial:buck?start=steady', {'L1.L', 47e-6}, struct('t_end', 1e-3, 'channels', {{'V:C1', 'I:L1'}}, "
                   "'measure', {{'Vo', 'V:C1', 'avg', 10}})); "
                   "printf('JSON %s\\n', jsonencode(struct('n', numel(r.t), 'vars', {r.vars}, 'vo', r.measure.Vo, 'last', r.V_C1(end), 'L', r.meta.changes.L1_L)));")
        self.assertGreater(o['n'], 10000)
        self.assertEqual(o['vars'], ['V_C1', 'I_L1'])
        self.assertAlmostEqual(o['vo'], 12, delta=0.1)
        self.assertEqual(o['L'], 47e-6)
        import pcl                                           # the same numbers as the Python package
        r = pcl.tutorial('buck', start='steady').set('L1.L', 47e-6).run(t_end=1e-3, channels=['V:C1', 'I:L1'])
        self.assertEqual(o['last'], r['V:C1'][-1])

    def test_sweep_ripple(self):
        o = octave("r = pcl_sweep('tutorial:buck?start=steady', {'L1.L', [50e-6 100e-6 200e-6]}, "
                   "struct('t_end', 8e-3, 'measure', {{'Vo', 'V:C1', 'avg', 10; 'dI', 'I:L1', 'pp', 10}})); "
                   "printf('JSON %s\\n', jsonencode(struct('L', r.L1_L, 'vo', r.Vo, 'di', r.dI)));")
        for L, vo, di in zip(o['L'], o['vo'], o['di']):
            th = vo * 0.5 / (L * 100e3)
            self.assertAlmostEqual(di, th, delta=0.03 * th)

    def test_bifurcation(self):
        # 3.15: the diagram through Octave, the same numbers as the Python package (and the app)
        o = octave("r = pcl_bifurcation('tutorial:pcm_chaos', 'IC.v', [1.5 2.5], struct('channel', 'Y:AM1', 'stat', 'end', 'transient', 300, 'record', 64)); "
                   "printf('JSON %s\\n', jsonencode(struct('p', r.period, 'sz', size(r.Y), 'y', r.Y(2, :))));")
        self.assertEqual(o['p'], [1, 4])
        self.assertEqual(o['sz'], [2, 64])
        import pcl
        b = pcl.tutorial('pcm_chaos').bifurcation('IC.v', [2.5], channel='Y:AM1', stat='end', transient=300, record=64, workers=1)
        for a, x in zip(o['y'], b.y[0]):                    # Octave's jsonencode writes 15–16 digits
            self.assertAlmostEqual(a, x, delta=1e-14 * abs(x))

    def test_read_csv_json_mat(self):
        import pcl
        d = Path(tempfile.mkdtemp(prefix='pcl-oct-'))
        try:
            r = pcl.tutorial('buck', start='steady').run(t_end=2e-4, channels=['V:C1', 'I:L1'])
            r.to_csv(d / 'a.csv')
            r.to_csv(d / 'b.csv', sep=';', decimal=',')
            r.to_json(d / 'a.json')
            r.to_mat(d / 'a.mat')
            o = octave("x = {}; for f = {'a.csv', 'b.csv', 'a.json', 'a.mat'}, q = pcl_read(fullfile('%s', f{1})); "
                       "x{end + 1} = [numel(q.t), q.V_C1(end), q.I_L1(1)]; end; printf('JSON %%s\\n', jsonencode(x));" % d.as_posix())
            for n, v, i0 in o:
                self.assertEqual(n, len(r.t))
                self.assertAlmostEqual(v, r['V:C1'][-1], places=9)
                self.assertAlmostEqual(i0, r['I:L1'][0], places=9)
        finally:
            shutil.rmtree(d, ignore_errors=True)

    def test_errors_come_back(self):
        out = octave("try, pcl_run('tutorial:buck', {'Q9.R', 1}, struct('t_end', 1e-4)); catch e, printf('JSON %s\\n', jsonencode(e.message)); end")
        self.assertIn('Δεν υπάρχει στοιχείο', out)


if __name__ == '__main__':
    unittest.main()
