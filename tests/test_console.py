"""The command line of the app (5.0.8, ROADMAP §98, pcl/console.py, engine/console.py): the variables kept between the
commands, a block over many lines, the commands as in MATLAB (whos, clear x, save, load, help), the errors with only the
lines of the user, Tab, the names of the page (p made again only when the circuit changes, sel, net), plot, run, the
kernel of the server (a process per page, Ctrl+C to a command that runs, the answer of each request by its id), the door of
the server (only with the token of the link), and the same answers from the kernel of the page (Pyodide in Node)."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import unittest
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from pcl import console as PC  # noqa: E402
from pcl.core import Project, Result  # noqa: E402

HAS_NODE = shutil.which('node') is not None
HAS_PYODIDE = (ROOT / 'node_modules' / 'pyodide').is_dir()
PROJ = json.dumps({'components': [{'id': 'R1', 'type': 'R', 'params': {'R': 10}}, {'id': 'C1', 'type': 'C', 'params': {'C': 1e-6}}], 'wires': []})


def ex(c, code, block=False, **ctx):
    return c.handle({'op': 'exec', 'code': code, 'block': block, 'ctx': ctx})


class Semantics(unittest.TestCase):
    def setUp(self):
        self.pages = []
        self.c = PC.Console(page=lambda op, d=None: self.pages.append((op, d)))
        self.tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.tmp, True)

    def test_a_variable_stays_from_command_to_command(self):
        self.assertEqual(ex(self.c, 'a = 6 * 7')['out'], '')
        self.assertEqual(ex(self.c, 'a')['out'], '42\n')
        self.assertEqual(ex(self.c, 'b = a + 1; b')['out'], '43\n')
        names = [r['name'] for r in ex(self.c, 'pass')['whos']]
        self.assertIn('a', names)
        self.assertIn('b', names)

    def test_a_block_line_by_line_and_at_once(self):
        self.assertTrue(ex(self.c, 'for i in range(3):')['more'])
        self.assertTrue(ex(self.c, '    print(i * i)')['more'])
        r = ex(self.c, '')                                   # the blank line closes the block
        self.assertEqual((r['more'], r['out']), (False, '0\n1\n4\n'))
        r = ex(self.c, 'x = [1, 2]\ny = sum(x)\ny * 10', block=True)    # the value of the last line is printed
        self.assertEqual(r['out'], '30\n')
        self.assertEqual(ex(self.c, 'def f(n):\n    return 2 * n\n', block=True)['error'], '')
        self.assertEqual(ex(self.c, 'f(4)')['out'], '8\n')
        self.assertTrue(ex(self.c, 'if True:')['more'])
        self.assertEqual(self.c.handle({'op': 'reset'}), {'more': False})    # Ctrl+C at the prompt drops the open block
        self.assertEqual(ex(self.c, '5')['out'], '5\n')

    def test_the_commands_as_in_matlab(self):
        ex(self.c, 'a = 1; b = [1.5, 2.5]; s = "κείμενο"; d = {"k": 2}')
        w = ex(self.c, 'whos')['out']
        for n in ('a', 'b', 's', 'd', 'Όνομα'):
            self.assertIn(n, w)
        self.assertIn('Σβήστηκαν: a', ex(self.c, 'clear a')['out'])
        self.assertNotIn('a', [r['name'] for r in ex(self.c, 'pass')['whos']])
        f = os.path.join(self.tmp, 'ws.json')
        self.assertIn('Αποθηκεύτηκαν 3 μεταβλητές', ex(self.c, f'save {f}')['out'])
        ex(self.c, 'clear')
        self.assertEqual([r['name'] for r in ex(self.c, 'pass')['whos'] if not r['given']], [])
        self.assertIn('Φορτώθηκαν: b, d, s', ex(self.c, f'load {f}')['out'])
        self.assertEqual(ex(self.c, 'b, d, s')['out'], "([1.5, 2.5], {'k': 2}, 'κείμενο')\n")
        m = os.path.join(self.tmp, 'ws.mat')                 # .mat: what the writer of pcl takes; a dict stays out
        r = ex(self.c, f'save {m}')['out']
        self.assertIn('Αποθηκεύτηκαν 2 μεταβλητές', r)
        self.assertIn('χωρίς τις d', r)
        self.assertEqual(Path(m).read_bytes()[:10], b'MATLAB 5.0')
        self.assertIn('set(key, value)', ex(self.c, 'help pcl.set')['out'])
        self.assertIn('Γραμμή εντολών', ex(self.c, 'help')['out'])
        ex(self.c, 'clc')
        self.assertEqual(self.pages[-1], ('clc', {}))
        ex(self.c, "scope('V:C1', 'I:L1')")
        self.assertEqual(self.pages[-1], ('scope', {'keys': ['V:C1', 'I:L1']}))
        # a name the user took is no longer the command
        self.assertEqual(ex(self.c, 'whos = 3\nwhos', block=True)['out'], '3\n')

    def test_errors_with_the_lines_of_the_user(self):
        r = ex(self.c, '1/0')
        self.assertEqual(r['error'], '  γραμμή 1: 1/0\nZeroDivisionError: division by zero')
        ex(self.c, 'def g():\n    return undefined_name', block=True)
        e = ex(self.c, 'g()')['error'].split('\n')
        self.assertEqual(e[0], '  γραμμή 1: g()')
        self.assertTrue(e[1].startswith('  εντολή ') and e[1].endswith(', γραμμή 2: return undefined_name'))
        self.assertTrue(e[-1].startswith('NameError'))
        # an error of pcl: its message only, without the lines of pcl
        e = ex(self.c, "pcl.Project({'components': []}).comp('X9')")['error'].split('\n')
        self.assertEqual(len(e), 2)
        self.assertTrue(e[1].startswith('Δεν υπάρχει στοιχείο «X9»'))
        self.assertIn('KeyboardInterrupt', ex(self.c, 'raise KeyboardInterrupt')['error'])
        self.assertIn('exit()', ex(self.c, 'raise SystemExit')['error'])
        self.assertTrue(ex(self.c, 'x = (', block=True)['error'].startswith('γραμμή 1: SyntaxError'))
        self.assertEqual(ex(self.c, 'x = 2')['error'], '')        # the console goes on

    def test_tab(self):
        r = self.c.handle({'op': 'complete', 'text': 'y = pcl.tut'})
        self.assertEqual(r['start'], 4)
        self.assertEqual(r['matches'], ['pcl.tutorial(', 'pcl.tutorials()'])
        ex(self.c, 'value_one = 1; value_two = 2')
        self.assertEqual(self.c.handle({'op': 'complete', 'text': 'val'})['matches'], ['value_one', 'value_two'])
        self.assertEqual(self.c.handle({'op': 'complete', 'text': '3 + '})['matches'], [])
        self.assertFalse(any('._' in m for m in self.c.handle({'op': 'complete', 'text': 'pcl.'})['matches']))

    def test_the_names_of_the_page(self):
        ex(self.c, 'pass', project=PROJ, name='δοκιμή', sel=['B4', 'B7'], net=None)
        self.assertEqual(ex(self.c, 'p')['out'], '<Project «δοκιμή»: 2 στοιχεία>\n')
        self.assertEqual(ex(self.c, 'pcl.current() is p')['out'], 'True\n')
        ex(self.c, "p.set('R1.R', 22)")
        self.assertEqual(ex(self.c, "p.get('R1.R')", project=PROJ)['out'], '22\n')     # the same circuit: p stays
        changed = json.loads(PROJ)
        changed['components'][0]['params']['R'] = 33
        self.assertEqual(ex(self.c, "p.get('R1.R')", project=json.dumps(changed))['out'], '33\n')   # the screen changed
        self.assertEqual(ex(self.c, 'sel')['out'], "['B4', 'B7']\n")
        self.assertIn('καμία μελέτη δικτύου', ex(self.c, 'net.buses')['error'])
        self.assertEqual(ex(self.c, "print(getattr(net, 'shape', None))")['out'], 'None\n')
        rows = {r['name']: r for r in ex(self.c, 'pass')['whos']}
        self.assertEqual([r['name'] for r in ex(self.c, 'pass')['whos']][:4], ['pcl', 'p', 'net', 'sel'][:4] if 'np' not in rows
                         else ['pcl', 'np', 'p', 'net'])
        self.assertTrue(rows['p']['given'])
        self.assertIn('Σβήστηκαν: p', ex(self.c, 'clear p')['out'])     # p comes back with the next command
        self.assertEqual(ex(self.c, "p.get('R1.R')", project=json.dumps(changed))['out'], '33\n')

    def test_the_network_of_the_study(self):
        r = ex(self.c, 'type(net).__name__, len(net.buses)', net={'case': 'ieee9', 'study': 'pf', 'options': {}})
        self.assertEqual((r['error'], r['out']), ('', "('Network', 9)\n"))
        self.assertIn('δεν φορτώθηκε', ex(self.c, 'net.buses', net={'case': 'no_such_case'})['error'])
        self.assertEqual(ex(self.c, 'net', net=None)['out'][:5], '<net:')

    def test_plot_and_run(self):
        r = ex(self.c, 'plot([1, 4, 9])')
        self.assertEqual(r['out'], '')                       # plot gives a chart, not a value to print
        self.assertEqual(r['shows'][0]['type'], 'xy')
        self.assertEqual(r['shows'][0]['x'], [0.0, 1.0, 2.0])
        r = ex(self.c, "plot([1, 2], {'a': [3, 4], 'b': [5, 6]}, title='τ', xlabel='x')")
        self.assertEqual((r['shows'][0]['series'], r['shows'][0]['title']), ({'a': [3.0, 4.0], 'b': [5.0, 6.0]}, 'τ'))
        self.assertIn('2 τιμές απέναντι σε 3', ex(self.c, 'plot([1, 2, 3], [1, 2])')['error'])
        res = Result([0.0, 1e-3], ['V:C1', 'I:L1'], {'V:C1': [0.0, 1.0], 'I:L1': [2.0, 3.0]}, {}, Project({'components': []}))
        x, ys, xl, _ = PC.plot_data(res, 'V:C1')
        self.assertEqual((x, ys, xl), ([0.0, 1e-3], {'V:C1': [0.0, 1.0]}, 't (s)'))
        with self.assertRaises(PC.ConsoleError):
            PC.plot_data(res, 'V:X')
        self.assertEqual(ex(self.c, 'run()', scen='zz = 5 * 5\nprint("σενάριο", zz)')['out'], 'σενάριο 25\n')
        self.assertEqual(ex(self.c, 'zz')['out'], '25\n')    # run() works on the variables of the command line
        f = os.path.join(self.tmp, 'a.py')
        Path(f).write_text('ww = zz + 1\n', encoding='utf-8')
        ex(self.c, f'run({f!r})')
        self.assertEqual(ex(self.c, 'ww')['out'], '26\n')
        self.assertIn('Δεν βρέθηκε', ex(self.c, "run('/no/such/file.py')")['error'])

    def test_the_answer_is_json_for_the_page(self):
        r = ex(self.c, "x = float('nan'); y = [float('inf'), 1.0]; plot([0, 1], {'y': [float('nan'), 2]})", block=True)
        json.dumps(r, allow_nan=False)                       # NaN and inf as null: JSON.parse reads it
        self.assertEqual(r['shows'][0]['series']['y'], [None, 2.0])

    def test_the_namespace_holds_only_what_it_is_given(self):
        c = PC.Console()
        self.assertEqual(sorted(k for k in c.ns if not k.startswith('__')), sorted(('pcl',) + PC.COMMANDS))
        self.assertNotIn('os', c.ns)
        self.assertNotIn('sys', c.ns)

    def test_the_commands_in_a_script(self):
        f = os.path.join(self.tmp, 'ws.json')
        g = {'__name__': '__main__'}
        import contextlib
        import io
        with contextlib.redirect_stdout(io.StringIO()) as o:
            exec(f"from pcl.console import *\nq = [1, 2]\nr = 'x'\nsave({f!r})\nclear()\nload({f!r})\n", g)
        self.assertIn('Φορτώθηκαν: q, r', o.getvalue())
        self.assertEqual((g['q'], g['r']), ([1, 2], 'x'))


class ServerKernel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.home = tempfile.mkdtemp()
        cls.old = os.environ.get('PCL_HOME')
        os.environ['PCL_HOME'] = cls.home
        from engine import console as K
        cls.K = K

    @classmethod
    def tearDownClass(cls):
        cls.K.close_all()
        if cls.old is None:
            os.environ.pop('PCL_HOME', None)
        else:
            os.environ['PCL_HOME'] = cls.old
        shutil.rmtree(cls.home, True)

    def test_a_process_per_page_with_its_variables(self):
        K = self.K
        a, b = K.handle({'op': 'open'}), K.handle({'op': 'open'})
        self.assertTrue(a['cwd'].endswith('console'))
        K.handle({'op': 'exec', 'session': a['session'], 'code': 'v = 1'})
        K.handle({'op': 'exec', 'session': b['session'], 'code': 'v = 2'})
        self.assertEqual(K.handle({'op': 'exec', 'session': a['session'], 'code': 'v'})['out'], '1\n')
        self.assertEqual(K.handle({'op': 'exec', 'session': b['session'], 'code': 'v'})['out'], '2\n')
        # what a program prints on the standard output of the child is output of the command, not an answer
        r = K.handle({'op': 'exec', 'session': a['session'], 'code': f'import subprocess, sys; _ = subprocess.run([sys.executable, "-c", "print(123)"])'})
        self.assertEqual(r['out'], '123\n')
        self.assertEqual(K.handle({'op': 'complete', 'session': a['session'], 'text': 'pcl.tutor'})['matches'], ['pcl.tutorial(', 'pcl.tutorials()'])
        K.handle({'op': 'close', 'session': b['session']})
        with self.assertRaises(K.ConsoleError):
            K.handle({'op': 'exec', 'session': b['session'], 'code': 'v'})
        with self.assertRaises(K.ConsoleError):
            K.handle({'op': 'nothing'})

    def test_ctrl_c_stops_the_command_not_the_kernel(self):
        K = self.K
        s = K.handle({'op': 'open'})['session']
        K.handle({'op': 'exec', 'session': s, 'code': 'kept = 7'})
        self.assertFalse(K.handle({'op': 'interrupt', 'session': s})['ok'])       # nothing runs: nothing to stop
        threading.Timer(0.8, lambda: K.handle({'op': 'interrupt', 'session': s})).start()
        t = time.time()
        r = K.handle({'op': 'exec', 'session': s, 'code': 'while True:\n    pass', 'block': True})
        self.assertLess(time.time() - t, 30)
        self.assertIn('KeyboardInterrupt', r['error'])
        for i in range(10):                                  # every answer is the answer of its own request
            self.assertEqual(K.handle({'op': 'exec', 'session': s, 'code': f'kept + {i}'})['out'], f'{7 + i}\n')
            K.handle({'op': 'interrupt', 'session': s})

    def test_a_kernel_that_ends_is_opened_again(self):
        K = self.K
        s = K.handle({'op': 'open'})['session']
        with self.assertRaises(K.ConsoleError):              # the process ends in the middle of the command
            K.handle({'op': 'exec', 'session': s, 'code': 'import os; os._exit(3)'})
        with self.assertRaisesRegex(K.ConsoleError, 'συνεδρία'):     # the page reads «συνεδρία» and opens a new one
            K.handle({'op': 'exec', 'session': s, 'code': '1'})
        self.assertNotIn(s, K.SESSIONS)

    def test_at_most_four_pages(self):
        K = self.K
        K.close_all()
        ids = [K.handle({'op': 'open'})['session'] for _ in range(K.MAX_SESSIONS + 1)]
        self.assertEqual(len(K.SESSIONS), K.MAX_SESSIONS)
        self.assertNotIn(ids[0], K.SESSIONS)                 # the one used least lately went


class Door(unittest.TestCase):
    """The route /api/console of run.py: only with application/json and the token of the link."""

    @classmethod
    def setUpClass(cls):
        from http.server import ThreadingHTTPServer
        cls.home = tempfile.mkdtemp()
        cls.old = os.environ.get('PCL_HOME')
        os.environ['PCL_HOME'] = cls.home
        import run as app
        cls.app = app
        cls.srv = ThreadingHTTPServer(('127.0.0.1', 0), type('Quiet', (app.Handler,), {'log_message': lambda *a: None}))
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.url = f'http://127.0.0.1:{cls.srv.server_port}/api/console'

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()
        from engine import console as K
        K.close_all()
        if cls.old is None:
            os.environ.pop('PCL_HOME', None)
        else:
            os.environ['PCL_HOME'] = cls.old
        shutil.rmtree(cls.home, True)

    def call(self, body, kind='application/json'):
        req = urllib.request.Request(self.url, data=json.dumps(body).encode(), headers={'Content-Type': kind}, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b'{}')

    def test_the_token_of_the_link(self):
        self.assertEqual(self.call({'op': 'open'})[0], 403)
        self.assertEqual(self.call({'op': 'open', 'token': 'wrong'})[0], 403)
        self.assertEqual(self.call({'op': 'open', 'token': self.app.LINK.token}, 'text/plain')[0], 415)
        st, r = self.call({'op': 'open', 'token': self.app.LINK.token})
        self.assertEqual(st, 200)
        st, r2 = self.call({'op': 'exec', 'token': self.app.LINK.token, 'session': r['session'], 'code': '2 ** 10'})
        self.assertEqual((st, r2['out']), (200, '1024\n'))
        self.assertEqual(self.call({'op': 'close', 'token': self.app.LINK.token, 'session': r['session']})[0], 200)
        self.assertEqual(self.call({'op': 'exec', 'token': self.app.LINK.token, 'session': r['session'], 'code': '1'})[0], 400)


@unittest.skipIf(not (HAS_NODE and HAS_PYODIDE), 'Node.js and the pyodide package (npm) are needed.')
class SameInBothKernels(unittest.TestCase):
    """The same commands in the kernel of the page (Pyodide in Node) and here give the same answers: the output, the
    kind of an error, the variables (name, type, size, value), the charts and the completions."""

    def test_the_same_answers(self):
        reqs = [
            {'op': 'exec', 'code': 'pass', 'ctx': {'project': PROJ, 'name': 'δοκιμή', 'sel': ['B1'], 'net': None}},
            {'op': 'exec', 'code': 'a = 6 * 7'}, {'op': 'exec', 'code': 'a'},
            {'op': 'exec', 'code': 'for i in range(3):'}, {'op': 'exec', 'code': '    print(i, i ** 2)'}, {'op': 'exec', 'code': ''},
            {'op': 'exec', 'code': 'x = [0.5, 1.5]\nd = {"k": [1, 2]}\nlen(x) + len(d)', 'block': True},
            {'op': 'exec', 'code': 'p'}, {'op': 'exec', 'code': "p.set('R1.R', 47); p.get('R1.R')"}, {'op': 'exec', 'code': 'sel'},
            {'op': 'exec', 'code': '1/0'}, {'op': 'exec', 'code': 'undefined_name'}, {'op': 'exec', 'code': "pcl.parse_value('47u')"},
            {'op': 'exec', 'code': 'whos'}, {'op': 'exec', 'code': 'clear x'}, {'op': 'exec', 'code': "plot([1, 2, 3], {'y': [3, 2, 1]})"},
            {'op': 'exec', 'code': 'save ws.json'}, {'op': 'exec', 'code': 'clear'}, {'op': 'exec', 'code': 'load ws.json'},
            {'op': 'exec', 'code': 'sorted(k for k in dir() if not k.startswith("_"))'},
            {'op': 'complete', 'text': 'pcl.tut'}, {'op': 'complete', 'text': 'p.ge'}, {'op': 'history'},
        ]
        tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, tmp, True)
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'console_cases.js'), json.dumps(reqs)], capture_output=True, text=True,
                             timeout=600, cwd=tmp)
        page = json.loads(out.stdout.strip().splitlines()[-1])
        if 'skipped' in page:
            self.skipTest(page['skipped'])
        self.assertNotIn('error', page)
        # here, also in a process of its own (as the child of the server), with only pcl imported
        code = ('import json, sys\nsys.path.insert(0, sys.argv[1])\nfrom pcl import console\nc = console.Console()\n'
                'print(json.dumps([c.handle(q) for q in json.loads(sys.argv[2])], ensure_ascii=False))')
        mine = json.loads(subprocess.run([sys.executable, '-c', code, str(ROOT), json.dumps(reqs)], capture_output=True, text=True,
                                         timeout=300, cwd=tmp).stdout.strip().splitlines()[-1])

        def norm(r):
            r = dict(r)
            r.pop('page', None)
            if 'whos' in r:
                r['whos'] = [w for w in r['whos'] if w['name'] != 'np']      # numpy is here, not in Pyodide without the CDN
            if r.get('error'):
                r['error'] = r['error'].split('\n')[-1].split(':')[0]       # the kind of the error (texts change with Python)
            if 'out' in r:
                r['out'] = r['out'].replace("'np', ", '').replace(os.path.realpath(tmp) + os.sep, '')     # save: the full path here
            return r
        self.assertEqual(len(page['out']), len(reqs))
        for q, a, b in zip(reqs, page['out'], mine):
            self.assertEqual(norm(a), norm(b), q)


if __name__ == '__main__':
    unittest.main()
