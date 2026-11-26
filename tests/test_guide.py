"""The code of the guide runs as it is written (docs/GUIDE.md): every Python block of the sections of 4.19.4 and 4.19.5 is run here in an
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
    def test_the_python_example_of_5_0_runs_as_written(self):
        # §36: the study folder from Python and pcl.results
        bl = blocks('5.0')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('36. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('36. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)
            self.assertTrue((pathlib.Path(d) / 'μελέτη' / 'study.json').is_file())

    def test_the_python_example_of_5_0_8_runs_as_written(self):
        # §46: the command line from code: a variable that stays, a block, the commands as in MATLAB, an error, Tab
        bl = blocks('5.0.8')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('46. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('46. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_9_runs_as_written(self):
        # §47: the FDNE of the IEEE 9 at the buses 5 and 9, passive, and the area in EMT that starts in the load flow
        bl = blocks('5.0.9')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('47. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('47. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_11_runs_as_written(self):
        # §49: the load flow of the drawing of the IEEE 9, and IEC 60909-0 of the drawing «Βραχυκύκλωμα σε δίκτυο»
        bl = blocks('5.0.11')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('49. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('49. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_12_runs_as_written(self):
        # §50: the EQV3 of «ieee9_eq» in the load flow and the short circuit, and the line from geometry of «cable_xb»
        bl = blocks('5.0.12')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('50. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('50. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_13_runs_as_written(self):
        # §51: the RMS dynamics of the drawing of «ieee9_emt», its events and controls, and the loss of a unit
        bl = blocks('5.0.13')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('51. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('51. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_14_runs_as_written(self):
        # §52: the unit of bus 3 of the IEEE 9 as a synchronous machine and as converters of every kind, +50 MW at bus 7
        bl = blocks('5.0.14')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('52. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=900)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('52. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_15_runs_as_written(self):
        # §53: the DCS2 of the B4 as the tutorial b4dcs2 in RMS, with V_dc control or droops, Cd-E1 300 → 55 MW
        bl = blocks('5.0.15')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('53. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('53. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_16_runs_as_written(self):
        # §54: the converters and the stations of the drawings ieee9_gfm and b4dcs2 in RMS, as the drawings are
        bl = blocks('5.0.16')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('54. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=900)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('54. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_1_4_runs_as_written(self):
        # §62: the wind turbines of IEC 61400-27-1 in RMS: G3 of the IEEE 9 as type 4A and 4B with a fault next to it
        bl = blocks('5.1.4')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('62. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=900)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('62. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_1_2_runs_as_written(self):
        # §60: the two-area system in EMT (the drawing of two_area_emt) in RMS: the interarea mode at the start with each excitation, the fault
        bl = blocks('5.1.2')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('60. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=900)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('60. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_1_1_runs_as_written(self):
        # §59: the protection of the MMCC as events in RMS: a station P with a fault at its bus, the block for good, by hand
        bl = blocks('5.1.1')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('59. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=900)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('59. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_1_runs_as_written(self):
        # §58: the two-area system of Example 12.6 of Power System Stability and Control: the interarea mode with each excitation
        bl = blocks('5.1')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('58. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=900)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('58. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_18_runs_as_written(self):
        # §57: the grid-forming station of hvdc_gfm in RMS: an island with droop, a weak grid with PSC, an island with a second unit
        bl = blocks('5.0.18')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('57. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=900)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('57. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_17_runs_as_written(self):
        # §55: the stations with the terminal n off the ground: hvdc_mmc, its cable as a line of two poles, two events in RMS
        bl = blocks('5.0.17')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('55. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=900)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('55. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_7_runs_as_written(self):
        # §45: the scan of the network beyond bus 4 of the IEEE 9, the Foster circuit of Fig. 15a, the area in EMT
        bl = blocks('5.0.7')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('45. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('45. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_6_runs_as_written(self):
        # §44: the study area chosen as buses, its equivalent in N−1, its circuit in EMT (pcl.study.area)
        bl = blocks('5.0.6')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('44. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('44. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_4_runs_as_written(self):
        # §42: the study area of the IEEE 9 case in EMT with the rest as one EQV3 (CIGRE TB 39, Fig. 15)
        bl = blocks('5.0.4')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('42. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('42. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_3_runs_as_written(self):
        # §41: Ward, extended Ward and Norton of the IEEE 30
        bl = blocks('5.0.3')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('41. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('41. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_5_0_1_runs_as_written(self):
        # §37: the inrush of the tutorial xf_inrush, saturable and linear core
        bl = blocks('5.0.1')
        self.assertEqual(len(bl), 1)
        head, code = bl[0]
        self.assertTrue(head.startswith('37. '), head)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8', PCL_HOME=d)
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('37. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_examples_of_4_24_run_as_written(self):
        # §34 (subnetworks and multirate) and §35 (the neutral of the three-phase parts)
        bl = blocks('4.24')
        self.assertEqual(len(bl), 2)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
        for (head, code), n in zip(bl, ('34. ', '35. ')):
            self.assertTrue(head.startswith(n), head)
            with tempfile.TemporaryDirectory() as d:
                env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8')
                r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
                self.assertEqual(r.returncode, 0, r.stderr[-2000:])
                sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith(n)][0]
                said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
                self.assertEqual(r.stdout.strip(), said, n)

    def test_the_python_example_of_4_23_runs_as_written(self):
        bl = blocks('4.23')
        self.assertEqual(len(bl), 1)
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8')
            r = subprocess.run([sys.executable, '-c', bl[0][1]], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('33. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)

    def test_the_python_example_of_4_22_runs_as_written(self):
        bl = blocks('4.22')
        self.assertEqual(len(bl), 1)
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8')
            r = subprocess.run([sys.executable, '-c', bl[0][1]], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')            # what the guide says it prints
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('32. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)
            self.assertTrue((pathlib.Path(d) / 'network_ieee14_pf.geojson').stat().st_size > 5000)

    def test_the_python_example_of_4_21_runs_as_written(self):
        bl = blocks('4.21')
        self.assertEqual(len(bl), 1)
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8')
            r = subprocess.run([sys.executable, '-c', bl[0][1]], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=600)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')            # what the guide says it prints
            sec = [q for q in re.split(r'(?m)^## ', text) if q.startswith('31. ')][0]
            said = re.search(r'Τυπώνει:\n\n```\n(.*?)```', sec, re.S).group(1).strip()
            self.assertEqual(r.stdout.strip(), said)
            self.assertTrue((pathlib.Path(d) / 'acdc_opf.html').stat().st_size > 10000)

    def test_the_python_example_of_4_20_runs_as_written(self):
        bl = blocks('4.20')
        self.assertEqual(len(bl), 1)
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8')
            r = subprocess.run([sys.executable, '-c', bl[0][1]], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=300)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            out = r.stdout.strip().split('\n')
            self.assertEqual(out[0], 'επαναλήψεις AC/DC: 2')
            self.assertEqual([q.split(': ')[1].split(' kV')[0] for q in out[1:6]], ['399.550', '400.000', '396.613', '396.928', '385.247'])
            self.assertEqual(out[6], 'μετά: C1 614.82, C2 549.65, C3 -800.00, C4 561.75, C5 -890.33 MW')
            self.assertEqual(out[7], 'χωρίς τον 5: C1 306.6, C2 298.4, C3 -800.0, C4 199.6 MW')
            self.assertTrue((pathlib.Path(d) / 'acdc.html').stat().st_size > 10000)
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')            # what the guide says it prints
        for part in ('399,550 / 400,000 / 396,613 / 396,928 / 385,247 kV', '614,82 / 549,65 / −800,00 / 561,75 / −890,33 MW', '306,6 / 298,4 / −800,0 / 199,6 MW'):
            self.assertIn(part, text)

    def test_the_python_example_of_4_20_1_runs_as_written(self):
        bl = blocks('4.20.1')
        self.assertEqual(len(bl), 1)
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8')
            r = subprocess.run([sys.executable, '-c', bl[0][1]], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=300)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            out = r.stdout.strip().split('\n')
            self.assertEqual(out, ['επαναλήψεις: 3', 'Cm-A1: -494.2 MW', 'Cm-B3: -835.2 MW', 'Cb-A1: 2066.8 MW', 'απώλειες: 87.4 MW',
                                   'χωρίς τον Cb-A1: Cb-B1 540.5 MW'])
        text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')            # what the guide says it prints
        for part in ('3 επαναλήψεις και −494,2 / −835,2 / 2066,8 MW', '87,4 MW', '540,5 MW', '33,73 Ω και 183,5 km/ms'):
            self.assertIn(part, text)

    def test_the_python_example_of_4_19_4_runs_as_written(self):
        bl = blocks('4.19.4')
        self.assertEqual(len(bl), 2)                         # §15, and the security study of §16 (its own test below)
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

    def test_the_security_example_of_4_19_4_runs_as_written(self):
        head, code = blocks('4.19.4')[1]
        self.assertIn('ασφάλεια', head)
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8')
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=300)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            self.assertEqual(r.stdout.strip().split('\n'), ['κόστος 565.35 ανά ώρα · χωρίς ασφάλεια 565.21 · διαφορά 0.147', '38 διαταραχές · 1 γύρος · 1 περιορισμός · ασφαλής: True',
                                                            'δεσμεύει: br35 όταν χάνεται ο br36 · μ = 0.0882 ανά MWh', 'ασφαλής: False · 6 ζεύγη μένουν πάνω από το όριο',
                                                            'το χειρότερο: 4.4 MW πάνω από το όριο'])           # the lines the guide prints
            self.assertEqual(os.listdir(d), ['scopf.html'])
            self.assertIn('Ασφάλεια N−1', pathlib.Path(d, 'scopf.html').read_text(encoding='utf-8'))

    def as_written(self, number, title, lines, files=()):
        """Runs the Python block of section `number` of 4.19.5 in an empty folder: it prints the lines the guide says it prints
        («Γράφει:»), `lines` of them, and leaves `files`. Returns the folder's texts {name: text}."""
        head, code = next((h, c) for h, c in blocks('4.19.5') if h.startswith(f'{number}.'))
        self.assertIn(title, head)
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, PYTHONPATH=str(ROOT), PYTHONIOENCODING='utf-8')
            r = subprocess.run([sys.executable, '-c', code], cwd=d, env=env, capture_output=True, text=True, encoding='utf-8', timeout=300)
            self.assertEqual(r.returncode, 0, r.stderr[-2000:])
            text = (ROOT / 'docs' / 'GUIDE.md').read_text(encoding='utf-8')
            sec = next(s for s in re.split(r'(?m)^## ', text) if s.startswith(f'{number}.'))
            said = [ln[4:] for ln in sec.split('Γράφει:')[1].split('\n- **')[0].split('\n') if ln.startswith('    ')]
            self.assertEqual(r.stdout.strip().split('\n'), said)                                     # the lines the guide prints, as it prints them
            self.assertEqual(len(said), lines)
            self.assertEqual(sorted(os.listdir(d)), sorted(files))
            return {f: pathlib.Path(d, f).read_text(encoding='utf-8') for f in files}

    def test_the_continuation_example_of_4_19_5_runs_as_written(self):
        self.assertIn('Καμπύλη P–V', self.as_written(17, 'Συνεχιζόμενη ροή φορτίου', 9, ['cpf.html'])['cpf.html'])

    def test_the_compensation_example_of_4_19_5_runs_as_written(self):
        self.as_written(18, 'Σάρωση με αντιστάθμιση', 6)

    def test_the_estimation_example_of_4_19_5_runs_as_written(self):
        self.assertIn('Μετρήσεις που βγήκαν', self.as_written(19, 'Εκτίμηση κατάστασης', 7, ['se.html'])['se.html'])

    def test_the_harmonic_example_of_4_19_5_runs_as_written(self):
        self.assertIn('Σάρωση συχνότητας', self.as_written(20, 'Αρμονικές', 7, ['harmonics.html'])['harmonics.html'])

    def test_the_three_phase_example_of_4_19_5_runs_as_written(self):
        self.assertIn('Απέναντι στη δημοσίευση', self.as_written(21, 'Ασύμμετρη ροή φορτίου', 6, ['feeder.html'])['feeder.html'])

    def test_every_python_block_of_4_19_5_has_its_test(self):
        self.assertEqual([h.split('.')[0] for h, _ in blocks('4.19.5')], ['17', '18', '19', '20', '21'])

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
