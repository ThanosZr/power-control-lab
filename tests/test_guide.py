"""The code of the guide runs as it is written (docs/GUIDE.md): every Python block of the sections of 4.19.4 is run here in an
empty folder, and what it says it writes is there afterwards. A block that stops working with a change of the engine fails
this test, not the reader of the guide."""
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]


def blocks(version):
    """The Python blocks of the sections of the guide whose heading names the version: [(heading, code)]."""
    text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
    out = []
    for sec in re.split(r'(?m)^## ', text)[1:]:
        head = sec.split('\n', 1)[0]
        if f'({version})' in head:
            out += [(head, m.group(1)) for m in re.finditer(r'```python\n(.*?)```', sec, re.S)]
    return out


class Guide(unittest.TestCase):
    def test_the_python_example_of_4_19_4_runs_as_written(self):
        bl = blocks('4.19.4')
        self.assertEqual(len(bl), 1)
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8')
            r = subprocess.run([sys.executable, '-c', bl[0][1]], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=300)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            out = r.stdout.strip().split('\n')
            self.assertEqual(out[0], '30 ζυγοί · απώλειες 2.444 MW')
            self.assertEqual(out[1:6], ['Κλίμακα: όλα τα φορτία × 1,1.', 'Φορτίο του ζυγού 8: 33 MW και 33 Mvar → 40 MW και 30 Mvar.', 'Γεννήτρια G2 (ζυγός 2): P 60,97 → 70 MW, V 1 → 1,01 pu.',
                                        'Όριο του κλάδου br10: 32 MVA → 40 MVA.', 'Κλάδος br5 (2 – 5): εκτός λειτουργίας.'])
            self.assertEqual(out[6], 'ροή φορτίου: 4.214 MW απώλειες · χαμηλότερη τάση 0.9501 pu στον ζυγό 7')      # the numbers the guide quotes
            self.assertTrue(out[7].startswith('N−1: 40 διαταραχές · χειρότερη: br10'))
            self.assertTrue(out[8].startswith('βέλτιστη ροή φορτίου: κόστος 679.7 ανά ώρα'))
            self.assertEqual(sorted(os.listdir(d)), ['case30_changed.m', 'n1.html', 'network.dxf', 'network.svg'])
            svg = ET.parse(os.path.join(d, 'network.svg')).getroot()
            self.assertEqual(sum(1 for e in svg.iter() if e.tag.endswith('line')), 41)                    # the branch that is out stays in the picture
            self.assertIn('stroke-dasharray', pathlib.Path(d, 'network.svg').read_text(encoding='utf-8'))
            self.assertIn('OUT_OF_SERVICE', pathlib.Path(d, 'network.dxf').read_text(encoding='ascii'))
            from pcl import netfile
            back = netfile.read_file(os.path.join(d, 'case30_changed.m'))
            self.assertEqual((netfile.describe(back)['load']['8'], sum(e['kind'] == 'branch' for e in back.elements)), ([40.0, 30.0], 40))

    def test_the_other_ways_the_guide_names(self):
        from pcl import network as N, study
        net = N.case_data('case30')
        net.element('load8')['P'] = 40e6                                                          # straight on the object, in SI
        net.remove('br5')
        net.element('br10')['rating'] = 40e6
        self.assertTrue(net.power_flow()['converged'])
        edits = [{'op': 'outage', 'element': 'br5'}]
        r = study.run({'case': 'case30', 'study': 'n1', 'edits': edits, 'view': True})
        self.assertEqual(sorted(k for k in r if k in ('view', 'layers', 'result', 'edit')), ['edit', 'layers', 'result', 'view'])
        self.assertEqual(study.save_file({'case': 'case30', 'edits': edits, 'format': 'raw'})['name'], 'case30.raw')


if __name__ == '__main__':
    unittest.main()
