"""5.0.5 (ROADMAP §97 step 1): `python run.py` opens the studio in the window of an application of a Chromium browser
(engine/appwin.py), with a profile of its own, without opening anything here: the browser is found on Windows, macOS and
Linux (PCL_BROWSER first), the command has --app and --user-data-dir, and with no browser, a program that does not start,
or --browser, the page opens in a tab as before. The manifest and the icons of the application are served."""
import json
import tempfile
import unittest
from pathlib import Path

from engine import appwin

ROOT = Path(__file__).resolve().parent.parent


def fake(files=(), path=()):
    return (lambda p: p in files), (lambda n: '/usr/bin/' + n if n in path else None)


class FindBrowser(unittest.TestCase):
    def test_windows(self):
        env = {'PROGRAMFILES': r'C:\Program Files', 'PROGRAMFILES(X86)': r'C:\Program Files (x86)', 'LOCALAPPDATA': r'C:\Users\me\AppData\Local'}
        edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
        ex, wh = fake({edge})
        self.assertEqual(appwin.find_browser('win32', env, wh, ex), edge)
        chrome = env['LOCALAPPDATA'] + r'\Google\Chrome\Application\chrome.exe'
        ex, wh = fake({edge, chrome})
        self.assertEqual(appwin.find_browser('win32', env, wh, ex), edge)          # the order of the places
        ex, wh = fake({chrome})
        self.assertEqual(appwin.find_browser('win32', env, wh, ex), chrome)

    def test_mac(self):
        env = {'HOME': '/Users/me'}
        p = env['HOME'] + '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ex, wh = fake({p})
        self.assertEqual(appwin.find_browser('darwin', env, wh, ex), p)
        self.assertIn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', appwin.candidates('darwin', env))

    def test_linux_path_names(self):
        ex, wh = fake(path={'chromium'})
        self.assertEqual(appwin.find_browser('linux', {}, wh, ex), '/usr/bin/chromium')
        ex, wh = fake(path={'chromium', 'google-chrome'})
        self.assertEqual(appwin.find_browser('linux', {}, wh, ex), '/usr/bin/google-chrome')
        ex, wh = fake()
        self.assertIsNone(appwin.find_browser('linux', {}, wh, ex))

    def test_pcl_browser_first(self):
        ex, wh = fake({'/opt/x/brave'}, {'chromium', 'vivaldi'})
        self.assertEqual(appwin.find_browser('linux', {'PCL_BROWSER': '/opt/x/brave'}, wh, ex), '/opt/x/brave')
        self.assertEqual(appwin.find_browser('linux', {'PCL_BROWSER': 'vivaldi'}, wh, ex), '/usr/bin/vivaldi')
        self.assertIsNone(appwin.find_browser('linux', {'PCL_BROWSER': 'nothing'}, wh, ex))   # named but absent: a tab


class OpenApp(unittest.TestCase):
    def run_open(self, tab=False, files=(), path=(), popen_error=None, env=None):
        calls = {'popen': [], 'tab': [], 'say': []}

        def popen(cmd, **kw):
            if popen_error:
                raise popen_error
            calls['popen'].append((cmd, kw))

        ex, wh = fake(files, path)
        self.home = tempfile.mkdtemp(prefix='pcl-appwin-')
        env = {'PCL_HOME': self.home} if env is None else env
        r = appwin.open_app('http://127.0.0.1:8765', tab=tab, platform='linux', env=env, which=wh, exists=ex, popen=popen,
                            open_tab=calls['tab'].append, say=calls['say'].append)
        return r, calls

    def test_window_of_its_own(self):
        r, c = self.run_open(path={'chromium'})
        self.assertEqual(r, 'app')
        cmd, kw = c['popen'][0]
        self.assertEqual(cmd[0], '/usr/bin/chromium')
        self.assertIn('--app=http://127.0.0.1:8765', cmd)
        self.assertIn('--user-data-dir=' + str(Path(self.home) / 'browser'), cmd)
        self.assertTrue((Path(self.home) / 'browser').is_dir())
        self.assertIn('--no-first-run', cmd)
        self.assertTrue(kw.get('start_new_session'))                 # it does not stop with the terminal's signals
        self.assertEqual(c['tab'], [])
        self.assertIn('window of its own', c['say'][0])

    def test_the_way_of_before(self):
        r, c = self.run_open(tab=True, path={'chromium'})
        self.assertEqual((r, c['tab'], c['popen']), ('tab', ['http://127.0.0.1:8765'], []))

    def test_no_browser_a_tab(self):
        r, c = self.run_open()
        self.assertEqual((r, c['tab']), ('fallback', ['http://127.0.0.1:8765']))
        self.assertIn('PCL_BROWSER', c['say'][0])

    def test_does_not_start_a_tab(self):
        r, c = self.run_open(path={'chromium'}, popen_error=OSError('denied'))
        self.assertEqual((r, c['tab']), ('fallback', ['http://127.0.0.1:8765']))
        self.assertIn('denied', c['say'][0])

    def test_profile_in_the_folder_of_the_application(self):
        self.assertEqual(appwin.profile_dir({'PCL_HOME': '/x/y'}), Path('/x/y/browser'))
        self.assertEqual(appwin.profile_dir({}), Path.home() / '.pcl' / 'browser')


class RunAndManifest(unittest.TestCase):
    def test_run_py(self):
        src = (ROOT / 'run.py').read_text(encoding='utf-8')
        self.assertIn("add_argument('--browser'", src)
        self.assertIn('open_app(url,tab=args.browser)', src)
        self.assertNotIn('webbrowser.open(', src)

    def test_manifest_and_icons(self):
        m = json.loads((ROOT / 'web' / 'manifest.webmanifest').read_text(encoding='utf-8'))
        self.assertEqual((m['start_url'], m['display']), ('/', 'standalone'))
        for i in m['icons']:
            self.assertTrue((ROOT / 'web' / i['src']).is_file(), i)
        for n in (192, 512):
            b = (ROOT / 'web' / f'icon-{n}.png').read_bytes()
            self.assertEqual(b[:8], b'\x89PNG\r\n\x1a\n')
            self.assertEqual((int.from_bytes(b[16:20], 'big'), int.from_bytes(b[20:24], 'big')), (n, n))
        page = (ROOT / 'web' / 'index.html').read_text(encoding='utf-8')
        self.assertIn('<link rel="manifest" href="manifest.webmanifest">', page)


if __name__ == '__main__':
    unittest.main()
