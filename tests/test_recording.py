"""Recording a long run to a file (4.8, engine/recording.py, POST /api/record): a file named by the server in the folder
of the recordings, rows of numbers appended to it, names that cannot leave the folder, text that is only numbers, and
a file that stops growing at its limit. The page that sends the rows: tests/ui/ev_flow.js."""
import os
import tempfile
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
