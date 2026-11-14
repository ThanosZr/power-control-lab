"""Recording a long run to a file (4.8, engine/recording.py, POST /api/record): a file named by the server in the folder
of the recordings, rows of numbers appended to it, names that cannot leave the folder, text that is only numbers, and
a file that stops growing at its limit. The page that sends the rows: tests/ui/ev_flow.js.
4.11: a folder the user chose (checked, remembered), the temporary recordings that go beyond their size or age, the
events beside the file, and the reading back of a time range (the rows, or per pixel column first/min/max/last) against
numpy over the same numbers, with the index extended as the file grows."""
import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

from engine import recording


class Recording(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.env = mock.patch.dict(os.environ, {'PCL_HOME': self.tmp.name})
        self.env.start()

    def tearDown(self):
        self.env.stop()
        self.tmp.cleanup()

    def test_start_append_list(self):
        r = recording.handle({'op': 'start', 'title': 'ev_drive', 'header': 't (s),ω,SOC'})
        self.assertRegex(r['name'], r'^\d{8}-\d{6}-ev_drive\.csv$')
        p = Path(r['path'])
        self.assertEqual(p.parent, Path(self.tmp.name) / 'recordings')
        a = recording.handle({'op': 'append', 'name': r['name'], 'rows': '0,0,0.85\n0.001,0.5,0.849999\n'})
        b = recording.handle({'op': 'append', 'name': r['name'], 'rows': '0.002,1e-3,NaN\n0.003,-Infinity,1.5E+2'})
        self.assertFalse(a['full'] or b['full'])
        self.assertEqual(b['bytes'], p.stat().st_size)
        self.assertEqual(p.read_text(encoding='utf-8').splitlines(),
                         ['t (s),ω,SOC', '0,0,0.85', '0.001,0.5,0.849999', '0.002,1e-3,NaN', '0.003,-Infinity,1.5E+2'])
        r2 = recording.handle({'op': 'start', 'title': 'ev_drive', 'header': 't'})    # the same second: a new name
        self.assertNotEqual(r2['name'], r['name'])
        ls = recording.handle({'op': 'list'})
        self.assertEqual(sorted(ls['files']), sorted([r['name'], r2['name']]))
        self.assertEqual(ls['folder'], str(Path(self.tmp.name) / 'recordings'))

    def test_names_stay_in_the_folder(self):
        r = recording.start('../../etc/x y', 't')
        self.assertEqual(Path(r['path']).parent, recording.folder())     # the title is made safe
        self.assertNotIn('/', r['name'].replace(recording.folder().as_posix(), ''))
        for bad in ('../x.csv', '/etc/passwd', 'a/b.csv', 'x.txt', '', None, 5):
            with self.assertRaises(ValueError):
                recording.append(bad, '1,2\n')
        with self.assertRaises(ValueError):
            recording.append('nothere.csv', '1\n')                       # only files that a start made

    def test_only_numbers(self):
        r = recording.start('run', 't,a')
        for bad in ('1,2\n<script>', 'import os', '1;2', '=cmd()'):
            with self.assertRaises(ValueError):
                recording.append(r['name'], bad)
        for bad in ('a\nb', 'x' * 200001, 5):
            with self.assertRaises(ValueError):
                recording.start('run', bad)
        with self.assertRaises(ValueError):
            recording.handle({'op': 'delete', 'name': r['name']})

    def test_a_full_file_stops_growing(self):
        r = recording.start('run', 't')
        with mock.patch.object(recording, 'MAX_FILE', 20):
            a = recording.append(r['name'], '1,2,3\n')
            b = recording.append(r['name'], '4,5,6,7,8,9,10\n')
        self.assertFalse(a['full'])
        self.assertTrue(b['full'])
        self.assertEqual(Path(r['path']).read_text().splitlines(), ['t', '1,2,3'])
        with mock.patch.object(recording, 'MAX_CHUNK', 4):
            with self.assertRaises(ValueError):
                recording.append(r['name'], '1,2,3\n')


if __name__ == '__main__':
    unittest.main()


class ReadBack(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.env = mock.patch.dict(os.environ, {'PCL_HOME': self.tmp.name})
        self.env.start()
        recording._index.clear()
        recording._where.clear()

    def tearDown(self):
        self.env.stop()
        self.tmp.cleanup()

    def test_user_folder_and_settings(self):
        d = os.path.join(self.tmp.name, 'mine', 'runs')
        with self.assertRaises(ValueError):
            recording.start('a', 't,V:R1', 'dir', d)                    # does not exist
        with self.assertRaises(ValueError):
            recording.start('a', 't,V:R1', 'dir', 'relative/path', create=True)
        r = recording.start('a', 't,V:R1', 'dir', d, remember=True, create=True)
        self.assertEqual(Path(r['folder']), Path(d).resolve())
        self.assertTrue(Path(r['path']).is_file())
        s = recording.settings()
        self.assertEqual((s['dest'], Path(s['dir'])), ('dir', Path(d).resolve()))
        recording.append(r['name'], '0,1\n')
        recording._where.clear()                                     # a new session: found through the settings
        self.assertEqual(recording.info(r['name'])['rows'], 1)
        self.assertIn(r['name'], recording.handle({'op': 'list'})['dir_files'])
        out = recording.handle({'op': 'settings', 'auto': True})
        self.assertTrue(out['auto'] and out['disk']['free'] > 0)

    def test_temp_cleanup(self):
        old = recording.start('old', 't,x')
        p = Path(old['path'])
        t = time.time() - 9 * 86400
        os.utime(p, (t, t))
        new = recording.start('new', 't,x')
        self.assertIn(old['name'], new['removed'])
        self.assertFalse(p.exists())
        big = recording.start('big', 't,x')
        recording.append(big['name'], '0,1\n' * 1000)
        self.assertEqual(recording.cleanup_temp(max_bytes=100, keep=(big['name'],)), [new['name']])     # the oldest first
        self.assertTrue(Path(big['path']).exists())

    def test_events_beside_the_file(self):
        r = recording.start('ev', 't,x')
        recording.events(r['name'], [[0.001, 'switch', 'S1', 1], [0.002, 'note', 'a "b"', 'x']])
        txt = (Path(r['path']).parent / (Path(r['name']).stem + '.events.csv')).read_text(encoding='utf-8').splitlines()
        self.assertEqual(txt[0], 't,kind,source,value')
        self.assertEqual(txt[2], '0.002,"note","a ""b""","x"')
        self.assertNotIn(Path(r['name']).stem + '.events.csv', recording.handle({'op': 'list'})['files'])

    def test_range_raw_and_columns(self):
        import numpy as np
        r = recording.start('rng', 't,V:a,I:b')
        t = np.arange(0, 20000) * 1e-5
        rows = ''.join(f'{a:.12g},{np.sin(300 * a):.7g},{a * a:.7g}\n' for a in t[:12345])
        recording.append(r['name'], rows)
        recording.read_range(r['name'], 0, 0.01, n=100)              # an index of the first part
        recording.append(r['name'], ''.join(f'{a:.12g},{np.sin(300 * a):.7g},{a * a:.7g}\n' for a in t[12345:]))
        self.assertEqual(recording.info(r['name'])['rows'], len(t))
        o = recording.read_range(r['name'], 0.1, 0.1005, ['I:b'], n=100)
        self.assertTrue(o['raw'])
        tt = np.array(o['t'])
        self.assertLessEqual(tt[0], 0.1)
        self.assertGreaterEqual(tt[-1], 0.1005)
        np.testing.assert_allclose(o['cols']['I:b']['v'], tt * tt, rtol=1e-6)
        o = recording.read_range(r['name'], 0.02, 0.17, ['V:a'], n=50)
        self.assertFalse(o['raw'])
        tf = np.array([float(f'{a:.12g}') for a in t])               # the times as the file holds them
        v = np.sin(300 * t)
        edges = np.linspace(0.02, 0.17, 51)
        inside = (tf >= 0.02) & (tf <= 0.17)
        b = np.clip(np.searchsorted(edges, tf, side='right') - 1, 0, 49)
        for j in (0, 17, 49):
            m = inside & (b == j)
            self.assertAlmostEqual(o['cols']['V:a']['mx'][j], float(np.round(v[m], 7).max()), places=6)
            self.assertAlmostEqual(o['cols']['V:a']['mn'][j], float(np.round(v[m], 7).min()), places=6)
        o = recording.read_range(r['name'], 5, 6)
        self.assertEqual(o['rows'], 0)
        with self.assertRaises(ValueError):
            recording.read_range('../x.csv', 0, 1)

