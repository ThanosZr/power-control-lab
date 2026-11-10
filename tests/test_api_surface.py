"""The public API written down (3.18, a base for 4.0): tools/api_surface.py reads it from the code, the committed copy is
up to date, and a removal or a lost parameter stops it."""
import json
import shutil
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import api_surface  # noqa: E402


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the parts catalog is read in Node).')
class ApiSurface(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.now = api_surface.current()

    def test_committed_copy_is_up_to_date(self):
        self.assertEqual(api_surface.main(['--check']), 0)

    def test_every_surface_is_read(self):
        n = {g: len(v) for g, v in self.now.items()}
        self.assertEqual(set(n), set(api_surface.GROUPS))
        self.assertTrue(all(v > 0 for v in n.values()), n)
        self.assertIn('t_end', self.now['pcl']['pcl.Project.run']['params'])
        self.assertIn('python -m pcl run', self.now['cli'])
        self.assertIn('/api/batch_sim', self.now['server'])
        self.assertEqual(self.now['link']['M.set']['perm'], 'project.write')
        self.assertIn('PclApp.setParam', self.now['matlab'])
        self.assertIn('action:run', self.now['scenario'])
        # the project file: a part's parameters and every pin it can have (3.18: the bus pin of the three-phase source)
        self.assertIn('conn', self.now['project']['part:VAC3']['params'])
        self.assertEqual(set(self.now['project']['part:VAC3']['pins']), {'a', 'b', 'c', 'n', 'abc'})
        self.assertIn('link', self.now['project']['file.wire']['params'])

    def test_a_removal_or_a_lost_parameter_breaks(self):
        old = json.loads(json.dumps(api_surface.merged({'groups': {}, 'removed': []}, self.now, '3.18')))
        old['groups']['pcl']['pcl.Project.run']['params'].append('gone')
        old['groups']['server']['/api/old'] = {'params': [], 'since': '3.0'}
        added, broken = api_surface.compare(old, self.now)
        self.assertEqual(sorted(b[1] for b in broken), ['/api/old', 'pcl.Project.run'])
        self.assertEqual(added, [])
        # adding a parameter or an entry never breaks
        new = {g: {k: dict(e) for k, e in v.items()} for g, v in self.now.items()}
        new['pcl']['pcl.Project.run'] = {'params': self.now['pcl']['pcl.Project.run']['params'] + ['extra']}
        new['server']['/api/new'] = {'params': []}
        added, broken = api_surface.compare(api_surface.merged({'groups': {}, 'removed': []}, self.now, '3.18'), new)
        self.assertEqual(broken, [])
        self.assertEqual(added, [('server', '/api/new')])


if __name__ == '__main__':
    unittest.main()
