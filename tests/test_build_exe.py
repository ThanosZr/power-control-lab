"""5.1.3: the application as an executable (tools/build_exe.py, PyInstaller). Here without PyInstaller: the names, the
staged copy, the command, the zip (a link stays a link, the program stays executable), the module of the command line in
the frozen program (run.frozen_module), the licenses that go in, the job of the CI, and the smoke test of the program against `python run.py`."""
import os
import re
import stat
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import build_exe as B  # noqa: E402


class Names(unittest.TestCase):
    def test_system_and_zip(self):
        self.assertEqual([B.system_tag(p) for p in ('win32', 'darwin', 'linux')], ['windows', 'macos', 'linux'])
        self.assertEqual(B.zip_name('5.1.3', 'windows'), 'Power_Control_Lab_5_1_3_windows.zip')
        from engine import __version__
        self.assertEqual(B.version(), __version__)

    def test_program(self):
        self.assertEqual(B.program('d', platform='win32'), Path('d') / 'pcl-lab' / 'pcl-lab.exe')
        self.assertEqual(B.program('d', platform='linux'), Path('d') / 'pcl-lab' / 'pcl-lab')


class Stage(unittest.TestCase):
    def test_copy_without_caches_and_vendor(self):
        with tempfile.TemporaryDirectory() as d:
            s = B.stage(ROOT, Path(d) / 'stage')
            for f in ('web/index.html', 'web/studio/app.js', 'pcl/data/two_area.json', 'pcl/__init__.py', 'engine/__init__.py'):
                self.assertTrue((s / f).is_file(), f)
            self.assertFalse((s / 'web' / 'vendor').exists())
            self.assertEqual([p for p in s.rglob('__pycache__')], [])
            self.assertEqual([p for p in s.rglob('*.pyc')], [])
            self.assertEqual(sorted(p.name for p in s.iterdir()), ['engine', 'pcl', 'web'])

    @unittest.skipUnless((ROOT / 'web' / 'vendor').is_dir(), 'χωρίς τοπική Pyodide (tools/get_pyodide.py)')
    def test_vendor_with_pyodide(self):
        with tempfile.TemporaryDirectory() as d:
            s = B.stage(ROOT, Path(d) / 'stage', pyodide=True)
            self.assertTrue((s / 'web' / 'vendor').is_dir())


class Licenses(unittest.TestCase):
    def test_what_is_in(self):
        with tempfile.TemporaryDirectory() as d:
            dest = B.collect_licenses(ROOT, Path(d) / 'LICENSES', pyodide=True)
            self.assertEqual((dest / 'LICENSE-Power-Control-Lab.txt').read_bytes(), (ROOT / 'LICENSE').read_bytes())
            notice = (dest / 'NOTICE.txt').read_text(encoding='utf-8')
            for name in ('numpy', 'scipy', 'sympy'):                           # the packages of requirements.txt
                self.assertRegex(notice, rf'(?im)^{name} [0-9.]+: {name}/ \([1-9]\d* αρχεί[οα]\)$')
                self.assertTrue(any((dest / name).rglob('*')), name)
            self.assertIn('Pyodide 0.26.4 (MPL-2.0)', notice)
            self.assertIn('PyInstaller', notice)


class Command(unittest.TestCase):
    def test_one_folder_with_the_data(self):
        for sep in (';', ':'):
            cmd = B.pyinstaller_cmd(ROOT, Path('st'), Path('out'), Path('wk'), sep=sep)
            self.assertEqual(cmd[1:3], ['-m', 'PyInstaller'])
            self.assertIn('--onedir', cmd)
            self.assertEqual(cmd[cmd.index('--name') + 1], 'pcl-lab')
            self.assertEqual(cmd[cmd.index('--python-option') + 1], 'X utf8')
            data = [cmd[i + 1] for i, x in enumerate(cmd) if x == '--add-data']
            self.assertEqual(data, [f"{Path('st') / f}{sep}{f}" for f in ('web', 'pcl', 'engine')])
            subs = [cmd[i + 1] for i, x in enumerate(cmd) if x == '--collect-submodules']
            self.assertEqual(subs, ['pcl', 'engine'])
            self.assertEqual(cmd[-1], str(ROOT / 'run.py'))


class Zip(unittest.TestCase):
    def test_links_and_modes(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d) / 'pcl-lab'
            (base / '_internal').mkdir(parents=True)
            prog = base / 'pcl-lab'
            prog.write_bytes(b'#!program')
            prog.chmod(0o755)
            (base / '_internal' / 'lib.so').write_bytes(b'x' * 1000)
            links = os.name != 'nt'
            if links:
                os.symlink('lib.so', base / '_internal' / 'lib-link.so')
            z = B.make_zip(d, '5.1.3', 'linux')
            self.assertEqual(z.name, 'Power_Control_Lab_5_1_3_linux.zip')
            with zipfile.ZipFile(z) as zf:
                names = sorted(zf.namelist())
                self.assertTrue(all(n.startswith('pcl-lab/') for n in names))
                self.assertIn('pcl-lab/_internal/lib.so', names)
                if links:
                    info = zf.getinfo('pcl-lab/_internal/lib-link.so')
                    self.assertTrue(stat.S_ISLNK(info.external_attr >> 16))
                    self.assertEqual(zf.read(info), b'lib.so')                  # the target, not a second copy
                    self.assertTrue((zf.getinfo('pcl-lab/pcl-lab').external_attr >> 16) & stat.S_IXUSR)
            size, n = B.folder_size(base)
            self.assertEqual((size, n), (1009, 2))                              # the link counts once, as its target


class FrozenModule(unittest.TestCase):
    def test_only_in_the_frozen_program(self):
        import run
        argv = ['pcl-lab', '-m', 'pcl.console', '--child']
        with mock.patch('runpy.run_module') as rm:
            self.assertFalse(run.frozen_module(list(argv)))                 # from source: run.py as before
            rm.assert_not_called()
            with mock.patch.object(sys, 'frozen', True, create=True), mock.patch.object(sys, 'argv', list(sys.argv)):
                self.assertFalse(run.frozen_module(['pcl-lab', '--no-browser']))
                self.assertTrue(run.frozen_module(list(argv)))
                rm.assert_called_once_with('pcl.console', run_name='__main__', alter_sys=True)
                self.assertEqual(sys.argv, ['pcl-lab', '--child'])


class CI(unittest.TestCase):
    def test_the_job_and_the_release(self):
        y = (ROOT / '.github' / 'workflows' / 'ci.yml').read_text(encoding='utf-8')
        job = y[y.index('\n  exe:'):y.index('\n  package:')]
        self.assertIn('os: windows-latest', job)
        self.assertIn('os: ubuntu-latest', job)
        self.assertIn('pyinstaller==', job)
        self.assertIn('python tools/build_exe.py --zip --smoke --pyodide', job)
        pkg = y[y.index('\n  package:'):]
        self.assertTrue(re.search(r'needs: \[[^\]]*\bexe\b', pkg))
        self.assertIn('pattern: exe-*', pkg)
        self.assertIn('dist/*.zip', pkg)


class Smoke(unittest.TestCase):
    def test_against_run_py(self):
        r = B.smoke([sys.executable, str(ROOT / 'run.py')], cwd=str(ROOT))
        self.assertEqual(r['pf_iterations'], 4)
        self.assertGreaterEqual(r['modes'], 1)
        self.assertTrue(r['console_python'])
        self.assertGreater(r['page_bytes'], 1000)
        if r['scenario_vo'] is not None:                                        # with Node.js: the buck at 12 V
            self.assertAlmostEqual(r['scenario_vo'], 12, delta=0.1)


if __name__ == '__main__':
    unittest.main()
