"""The command line of the app (5.0.8, ROADMAP §98, decision 372): one command at a time, with the variables kept between
the commands, as in the Command Window of MATLAB.

The same class runs in both kernels of the card «Γραμμή εντολών»: Pyodide in a worker of the page
(web/studio/console_worker.js), and the Python of the local server, one child process per page (engine/console.py starts
`python -m pcl.console --child` and speaks to it in lines of JSON). So one command gives the same answer in both, apart from
what only one of them has (the network of the study `net` and the files of the computer only on the server).

Names the page gives: `pcl`, `p` (a copy of the circuit on the screen, made again when the screen changes), `net` (the
network of the study of the diagram), `sel` (the buses chosen on the diagram), and `np` (numpy, when it is there). The
commands of the console: clc, whos, clear, save, load, help, plot, scope, run. A line with only a command and plain words
is read as a call, as in MATLAB: `whos`, `clear x y`, `save ws.json`, `help pcl.run`.

The same functions work in a script, on the variables of the script (`from pcl.console import *`): the commands saved
from the card («💾 .py») run again in the panel «Σενάρια» or from the command line of the system.
"""
import builtins
import codeop
import contextlib
import io
import json
import math
import os
import pydoc
import re
import rlcompleter
import sys
import traceback
import types
from pathlib import Path

FILE = '<εντολή'        # every command its own «file» <εντολή N>, kept in linecache for the lines of the tracebacks
GIVEN = ('pcl', 'np', 'p', 'net', 'sel')
COMMANDS = ('clc', 'whos', 'clear', 'save', 'load', 'help', 'plot', 'scope', 'run')
_WORD_CMD = re.compile(r'^(clc|whos|clear|save|load|help|run|scope)((?:[ \t]+[^\s(),=\'"]+)*)[ \t]*$')
MAX_MATCHES = 200


class ConsoleError(RuntimeError):
    pass


class _MissingName(ConsoleError, AttributeError):
    """The use of a name the kernel does not have (also an AttributeError, so getattr(x, k, default) still works)."""


class _Missing:
    """A name the page gives that this kernel does not have (net in Pyodide, or a network that did not load): any use
    says why."""

    def __init__(self, name, why):
        self._name, self._why = name, why

    def __getattr__(self, k):
        raise _MissingName(f'{self._name}: {self._why}')

    def __repr__(self):
        return f'<{self._name}: {self._why}>'

    __str__ = __repr__


# ---------------------------------------------------------------- what pcl.show gives the page
def show_data(obj, title=None):
    """The table or chart of pcl.show as data for the page (the same forms as the panel «Σενάρια»)."""
    from . import core as _c
    if isinstance(obj, _c.Plot):
        d = {'type': 'xy', **obj}
    elif isinstance(obj, _c.BifurcationResult):
        d = {'type': 'bifurcation', 'values': obj.values, 'y': obj.y, 'period': obj.period, 'xlabel': obj.param,
             'ylabel': obj.meta.get('key', '')}
    elif isinstance(obj, _c.SweepResult):
        d = {'type': 'sweep', 'params': obj.params, 'names': obj.names, 'rows': obj.rows}
    elif isinstance(obj, _c.Result):
        d = {'type': 'run', 'keys': obj.keys, 'units': [_c._unit(k) for k in obj.keys], 't': obj.t, 'ch': obj.ch,
             'measure': obj.measured, 'meta': obj.meta}
    elif isinstance(obj, dict):
        d = {'type': 'table', 'cols': ['', ''], 'rows': [[str(k), v] for k, v in obj.items()]}
    elif isinstance(obj, (list, tuple)) and obj and all(isinstance(r, dict) for r in obj):
        cols = list(dict.fromkeys(k for r in obj for k in r))
        d = {'type': 'table', 'cols': cols, 'rows': [[r.get(c) for c in cols] for r in obj]}
    else:
        d = {'type': 'text', 'text': str(obj)}
    d['title'] = title
    return _c._clean(json.loads(json.dumps(d, default=_plain)))


def _plain(v):
    """numpy and other values in JSON: arrays as lists, scalars as numbers, the rest as text."""
    if hasattr(v, 'tolist'):
        return v.tolist()
    if hasattr(v, 'item'):
        return v.item()
    return str(v)


# ---------------------------------------------------------------- the commands, on a namespace
def _user_names(ns):
    """The variables of the user: not the given names, not the commands, not modules, not names with _."""
    return [k for k, v in ns.items() if not k.startswith('_') and k not in GIVEN and k not in COMMANDS
            and not isinstance(v, types.ModuleType)]


def _size(v):
    shape = getattr(v, 'shape', None)
    if isinstance(shape, tuple) and not isinstance(v, (str, bytes)):
        return '×'.join(str(n) for n in shape) or '1'
    if isinstance(v, (str, bytes, list, tuple, dict, set, frozenset)):
        return str(len(v))
    if isinstance(v, (int, float, complex, bool)):
        return '1'
    try:
        return str(len(v))
    except Exception:
        return ''


def _short(v, n=60):
    try:
        if isinstance(v, types.ModuleType):
            return f'<module {v.__name__}>'
        s = repr(v)
    except Exception as e:          # an object whose repr fails is still listed
        s = f'<{type(v).__name__}: {type(e).__name__}>'
    s = ' '.join(s.split())
    return s if len(s) <= n else s[:n - 1] + '…'


def _whos_rows(ns):
    """name, type, size and a short value of every variable, the given names first."""
    rows = []
    for k in [g for g in GIVEN if g in ns] + sorted(_user_names(ns), key=str.lower):
        v = ns[k]
        rows.append({'name': k, 'type': type(v).__name__, 'size': _size(v), 'value': _short(v), 'given': k in GIVEN})
    return rows


def _whos_text(ns):
    rows = _whos_rows(ns)
    if not rows:
        return 'Καμία μεταβλητή.'
    w = [max(len(h), *(len(r[k]) for r in rows)) for h, k in (('Όνομα', 'name'), ('Τύπος', 'type'), ('Μέγεθος', 'size'))]
    out = [f'{"Όνομα":<{w[0]}}  {"Τύπος":<{w[1]}}  {"Μέγεθος":<{w[2]}}  Τιμή']
    for r in rows:
        out.append(f'{r["name"]:<{w[0]}}  {r["type"]:<{w[1]}}  {r["size"]:<{w[2]}}  {r["value"]}')
    return '\n'.join(out)


def _clear_names(ns, names=()):
    """Removes the given variables, or all the variables of the user. The names of the page come back with the next
    command; the commands stay."""
    gone = []
    for k in (names or _user_names(ns)):
        if k in COMMANDS:
            continue
        if k in ns:
            del ns[k]
            gone.append(k)
    return gone


def _jsonable(v):
    if v is None or isinstance(v, (bool, int, str)):
        return v
    if isinstance(v, float):
        if not math.isfinite(v):
            raise TypeError('μη πεπερασμένος αριθμός')
        return v
    if hasattr(v, 'tolist') and not isinstance(v, (list, tuple)):
        return _jsonable(v.tolist())
    if isinstance(v, (list, tuple)):
        return [_jsonable(x) for x in v]
    if isinstance(v, dict) and all(isinstance(k, str) for k in v):
        return {k: _jsonable(x) for k, x in v.items()}
    raise TypeError(type(v).__name__)


def _mat_ok(v):
    """A value as the .mat writer of pcl takes it (a number, a vector, a matrix as rows, a text, a list of texts)."""
    if hasattr(v, 'tolist') and not isinstance(v, (str, list, tuple)):
        v = v.tolist()
    if isinstance(v, bool):
        return [float(v)]
    if isinstance(v, (int, float)):
        return [float(v)]
    if isinstance(v, str):
        return v
    if isinstance(v, (list, tuple)) and v:
        if all(isinstance(x, str) for x in v):
            return list(v)
        if all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in v):
            return [float(x) for x in v]
        if all(isinstance(r, (list, tuple)) and all(isinstance(x, (int, float)) for x in r) for r in v):
            return [[float(x) for x in r] for r in v]
    raise TypeError(type(v).__name__)


def _save_names(ns, path='workspace.json', names=()):
    """The variables (all of the user, or the given ones) in a JSON or .mat file; returns (saved, skipped)."""
    from . import core as _c
    path = str(path)
    names = list(names) or sorted(_user_names(ns), key=str.lower)
    missing = [k for k in names if k not in ns]
    if missing:
        raise ConsoleError('Δεν υπάρχει: ' + ', '.join(missing))
    saved, skipped = {}, []
    mat = path.lower().endswith('.mat')
    for k in names:
        try:
            saved[k] = _mat_ok(ns[k]) if mat else _jsonable(ns[k])
        except (TypeError, ValueError):
            skipped.append(k)
    if mat:
        _c._savemat(path, list(saved.items()))
    else:
        Path(path).write_text(json.dumps({'format': 'pcl-workspace', 'version': 1, 'variables': saved}, ensure_ascii=False,
                                         indent=1), encoding='utf-8')
    return list(saved), skipped


def _load_names(ns, path='workspace.json'):
    """The variables of a JSON file of save (or any JSON object), or of a .mat file when SciPy is there."""
    path = str(path)
    if not Path(path).is_file():
        raise ConsoleError(f'Δεν βρέθηκε το αρχείο «{path}» (φάκελος: {os.getcwd()}).')
    if path.lower().endswith('.mat'):
        try:
            from scipy.io import loadmat
        except ImportError:
            raise ConsoleError('Ένα .mat διαβάζεται με το SciPy: στον πυρήνα του server, ή σε JSON με save(\'…\'.json).') from None
        d = {k: v for k, v in loadmat(path, squeeze_me=True).items() if not k.startswith('__')}
    else:
        d = json.loads(Path(path).read_text(encoding='utf-8'))
        if isinstance(d, dict) and d.get('format') == 'pcl-workspace':
            d = d.get('variables') or {}
        if not isinstance(d, dict):
            raise ConsoleError('Το JSON πρέπει να είναι αντικείμενο {όνομα: τιμή}.')
    bad = [k for k in d if not (isinstance(k, str) and k.isidentifier()) or k in COMMANDS]
    if bad:
        raise ConsoleError('Μη έγκυρα ονόματα μεταβλητών: ' + ', '.join(map(str, bad)))
    ns.update(d)
    return list(d)


def plot_data(*args, title=None, xlabel='', ylabel=''):
    """The arguments of plot as (x, {name: y}, xlabel, ylabel): plot(y), plot(x, y), plot(x, {'a': ya, 'b': yb}),
    plot(r, 'V:C1', 'I:L1') for a pcl.Result (all its channels without keys)."""
    from . import core as _c
    if not args:
        raise ConsoleError('plot(y), plot(x, y), plot(x, {"όνομα": y}) ή plot(r, "V:C1")')

    def vec(v):
        v = v.tolist() if hasattr(v, 'tolist') else v
        return [None if x is None else float(x) for x in v]

    if isinstance(args[0], _c.Result):
        r = args[0]
        keys = list(args[1:]) or list(r.keys)
        bad = [k for k in keys if k not in r.ch]
        if bad:
            raise ConsoleError(f'Το αποτέλεσμα δεν έχει τα κανάλια {", ".join(bad)}· έχει: {", ".join(r.keys)}')
        return vec(r.t), {k: vec(r.ch[k]) for k in keys}, xlabel or 't (s)', ylabel
    if len(args) == 1:
        y = vec(args[0])
        return [float(i) for i in range(len(y))], {ylabel or 'y': y}, xlabel, ylabel
    x, ys = vec(args[0]), args[1]
    if not isinstance(ys, dict):
        ys = {ylabel or 'y': ys}
    out = {str(k): vec(v) for k, v in ys.items()}
    for k, v in out.items():
        if len(v) != len(x):
            raise ConsoleError(f'«{k}»: {len(v)} τιμές απέναντι σε {len(x)} του x')
    return x, out, xlabel, ylabel


HELP = """Γραμμή εντολών (5.0.8): μία εντολή τη φορά· οι μεταβλητές μένουν ως την ανανέωση της σελίδας.
Ονόματα της σελίδας:
  p      αντίγραφο του κυκλώματος της οθόνης (pcl.current()): p.params(), p.channels(), p.set('L1.L', '47u'), r = p.run(t_end='5m')
  net    το δίκτυο της μελέτης του διαγράμματος (pcl.network.Network, στον πυρήνα του server)
  sel    οι ζυγοί που διάλεξες στο διάγραμμα
  pcl    το πακέτο των σεναρίων· np το numpy, όπου υπάρχει
Εντολές:
  whos               οι μεταβλητές (και στον πίνακα δίπλα)        clear [x y]     σβήνει όλες ή κάποιες
  save [αρχείο]      σε JSON ή .mat (workspace.json)               load [αρχείο]   από JSON (ή .mat με το SciPy)
  plot(x, y)         γράφημα· plot(r, 'V:C1') ένα αποτέλεσμα       scope('V:C1')   ένα κανάλι στο scope της σελίδας
  run()              ο κώδικας των «Σεναρίων»· run('αρχείο.py')     help(pcl.run)   το κείμενο μιας συνάρτησης
  clc                καθαρίζει την οθόνη
Πλήκτρα: Enter εκτέλεση (σε μπλοκ, μια κενή γραμμή στο τέλος), Shift+Enter νέα γραμμή, ↑ ↓ ιστορικό, Tab συμπλήρωση, Ctrl+C διακοπή."""


def _help_text(obj=None):
    if obj is None:
        return HELP
    if isinstance(obj, str) and obj in COMMANDS:
        return HELP
    try:
        return pydoc.render_doc(obj, title='%s', renderer=pydoc.plaintext)
    except ImportError as e:
        raise ConsoleError(str(e)) from None


# ---------------------------------------------------------------- the console
class Console:
    """One namespace, kept between the commands. `page(op, data)` takes what goes to the page (clc, scope)."""

    def __init__(self, page=None, names=None):
        import pcl
        self.page = page or (lambda op, data=None: None)
        self.buf = []
        self.n = 0
        self.shows = []
        self.history = []
        self.ctx = {'project': None, 'net': None, 'sel': None}
        self.scen = ''
        self.ns = {'__name__': '__console__', '__builtins__': builtins, 'pcl': pcl}
        self.ns.update({k: getattr(self, k) for k in COMMANDS})
        self.ns.update(names or {})
        self._hook()

    def _hook(self):
        from . import core as _c

        def show(obj, title=None):
            self.shows.append(show_data(obj, title))
            return obj
        _c._show_hook = show

    # ------------------------------------------------------------ the names of the page
    def set_context(self, **ctx):
        """What the page sends with a command: 'project' (the JSON of the circuit), 'name', 'net' (the request of the study
        of the diagram, or None), 'sel', 'scen'. A key that is not there leaves its name as it was; p is made again only
        when the circuit changed, so p.set(...) stays until the screen changes."""
        from . import core as _c
        project = ctx.get('project')
        if project is not None and (project != self.ctx['project'] or 'p' not in self.ns):
            self.ctx['project'] = project
            p = _c.Project(json.loads(project) if isinstance(project, str) else project, name=ctx.get('name') or 'κύκλωμα')
            _c._default = p
            self.ns['p'] = p
        if 'net' in ctx or 'net' not in self.ns:
            key = json.dumps(ctx.get('net'), sort_keys=True, default=str)
            if key != self.ctx['net'] or 'net' not in self.ns:
                self.ctx['net'] = key
                self.ns['net'] = self._network(ctx.get('net'))
        if ctx.get('sel') is not None:
            self.ns['sel'] = list(ctx['sel'])
        elif 'sel' not in self.ns:
            self.ns['sel'] = []
        if ctx.get('scen') is not None:
            self.scen = ctx['scen']
        if 'np' not in self.ns and 'numpy' in sys.modules:
            self.ns['np'] = sys.modules['numpy']

    def _network(self, q):
        if not q:
            return _Missing('net', 'καμία μελέτη δικτύου στη σελίδα (άνοιξε ένα tutorial μελέτης και το «🗺 Διάγραμμα του δικτύου»)')
        if sys.platform == 'emscripten':
            return _Missing('net', 'οι μελέτες δικτύου τρέχουν στον server: διάλεξε τον πυρήνα «Python του server» (python run.py)')
        try:
            from . import study
            return study.network_of(q)
        except Exception as e:          # the error of the network, kept for the first use
            return _Missing('net', f'δεν φορτώθηκε ({e})')

    # ------------------------------------------------------------ one line, or a block
    def push(self, line):
        """One line, as in the REPL of Python: {'more': True} while a block is open (a blank line closes it)."""
        self.buf.append(line)
        src = '\n'.join(self.buf)
        run = _word_command(src, self.ns) if len(self.buf) == 1 else src
        try:
            code = codeop.compile_command(run, self._name(), 'single')
        except (SyntaxError, OverflowError, ValueError) as e:
            self.buf = []
            return self._reply(error=_syntax(e))
        if code is None:
            return {'more': True}
        self.buf = []
        return self._run([code], src, run)

    def block(self, src):
        """Many lines at once (pasted, or written with Shift+Enter): run as a script, and the value of the last line,
        when it is an expression, is printed, as for one line."""
        self.buf = []
        run = _word_command(src, self.ns) if '\n' not in src.strip() else src
        import ast
        name = self._name()
        try:
            tree = ast.parse(run, name, 'exec')
        except (SyntaxError, OverflowError, ValueError) as e:
            return self._reply(error=_syntax(e))
        codes = []
        try:
            if tree.body and isinstance(tree.body[-1], ast.Expr):
                head = ast.Module(body=tree.body[:-1], type_ignores=[])
                if head.body:
                    codes.append(compile(head, name, 'exec'))
                codes.append(compile(ast.Interactive(body=[tree.body[-1]]), name, 'single'))
            else:
                codes.append(compile(tree, name, 'exec'))
        except (SyntaxError, ValueError) as e:
            return self._reply(error=_syntax(e))
        return self._run(codes, src, run)

    def reset(self):
        """Ctrl+C at the prompt: the open block is dropped."""
        self.buf = []
        return {'more': False}

    def _name(self):
        return f'{FILE} {self.n + 1}>'

    def _run(self, codes, src, run):
        import linecache
        self.n += 1
        name = f'{FILE} {self.n}>'
        linecache.cache[name] = (len(run), None, [ln + '\n' for ln in run.split('\n')], name)
        out, err = io.StringIO(), io.StringIO()
        self.shows = []
        error = ''
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            try:
                for c in codes:
                    exec(c, self.ns)
            except KeyboardInterrupt:
                error = 'KeyboardInterrupt: διακόπηκε (Ctrl+C).'
            except SystemExit:
                error = 'Η γραμμή εντολών δεν κλείνει με exit(): κλείσε την κάρτα, ή ανανέωσε τη σελίδα για νέο χώρο.'
            except BaseException as e:
                error = _format(e, name)
        if not error and src.strip():
            self.history.append(src)
        return self._reply(out=out.getvalue(), err=err.getvalue(), error=error)

    def _reply(self, out='', err='', error=''):
        return {'more': False, 'out': out, 'err': err, 'error': error, 'shows': self.shows, 'whos': _whos_rows(self.ns)}

    # ------------------------------------------------------------ Tab
    def complete(self, text):
        """The names that complete the last word of `text` (from the namespace, its attributes, the built-ins and the keywords)."""
        m = re.search(r'[A-Za-z_][\w.]*$', text)
        if not m:
            return {'start': len(text), 'matches': []}
        word = m.group(0)
        c = rlcompleter.Completer(self.ns)
        out, i = [], 0
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            while len(out) < MAX_MATCHES:
                try:
                    s = c.complete(word, i)
                except Exception:
                    break
                if s is None:
                    break
                if '._' not in s[len(word):] or word.split('.')[-1].startswith('_'):
                    out.append(s)
                i += 1
        return {'start': m.start(), 'matches': sorted(set(out), key=lambda s: (s.lower(), s))}

    # ------------------------------------------------------------ the commands
    def clc(self):
        """Clears the screen of the card."""
        self.page('clc', {})

    def whos(self):
        """The variables: name, type, size and value (also in the table next to the command line)."""
        print(_whos_text(self.ns))

    def clear(self, *names):
        """clear: all the variables; clear x y (or clear('x', 'y')): some. p, net, sel come back with the next command."""
        gone = _clear_names(self.ns, names)
        if 'p' in gone:
            self.ctx['project'] = None
        if 'net' in gone:
            self.ctx['net'] = None
        print(f'Σβήστηκαν: {", ".join(gone)}' if gone else 'Καμία μεταβλητή για σβήσιμο.')

    def save(self, path='workspace.json', *names):
        """save, save ws.mat, save('ws.json', 'x', 'y'): the variables in JSON (the default) or .mat."""
        saved, skipped = _save_names(self.ns, path, names)
        where = os.path.abspath(path) if sys.platform != 'emscripten' else path
        print(f'Αποθηκεύτηκαν {len(saved)} μεταβλητές στο {where}' + (f' · χωρίς τις {", ".join(skipped)} (δεν γράφονται σε αυτή τη μορφή)' if skipped else ''))

    def load(self, path='workspace.json'):
        """load, load ws.json: the variables of the file."""
        got = _load_names(self.ns, path)
        print('Φορτώθηκαν: ' + (', '.join(got) if got else 'καμία μεταβλητή'))

    def help(self, obj=None):
        """help: the command line; help(pcl.run) or help pcl.run: the text of a function."""
        print(_help_text(obj))

    def plot(self, *args, title=None, xlabel='', ylabel=''):
        """plot(y), plot(x, y), plot(x, {'όνομα': y}), plot(r, 'V:C1', …) for a result: a chart under the command."""
        from . import core as _c
        x, ys, xl, yl = plot_data(*args, title=title, xlabel=xlabel, ylabel=ylabel)
        _c.plot(x, ys, title, xl, yl)

    def scope(self, *keys):
        """scope('V:C1', 'I:L1'): the channels on the scope of the page (the simulation that runs there)."""
        keys = [str(k) for k in keys]
        if not keys:
            raise ConsoleError("scope('V:C1'): ένα ή περισσότερα κανάλια (p.channels()['keys'])")
        self.page('scope', {'keys': keys})

    def run(self, path=None):
        """run(): the code of the panel «Σενάρια»; run('αρχείο.py'): a file. Both on the variables of the command line."""
        if path is None:
            src, fname = self.scen, '<σενάριο>'
            if not src.strip():
                raise ConsoleError('Τα «Σενάρια» δεν έχουν κώδικα· run(\'αρχείο.py\') για ένα αρχείο.')
        else:
            fname = str(path)
            if not Path(fname).is_file():
                raise ConsoleError(f'Δεν βρέθηκε το «{fname}» (φάκελος: {os.getcwd()}).')
            src = Path(fname).read_text(encoding='utf-8')
        exec(compile(src, fname, 'exec'), self.ns)

    # ------------------------------------------------------------ one request (both kernels)
    def handle(self, req):
        """{'op': 'exec' | 'complete' | 'whos' | 'reset' | 'history', …} → the answer (JSON-able)."""
        op = req.get('op')
        if op == 'exec':
            self.set_context(**(req.get('ctx') or {}))
            code = str(req.get('code') or '')
            r = self.block(code) if req.get('block') else self.push(code)
        elif op == 'complete':
            self.set_context(**(req.get('ctx') or {}))
            r = self.complete(str(req.get('text') or ''))
        elif op == 'whos':
            r = {'whos': _whos_rows(self.ns)}
        elif op == 'reset':
            r = self.reset()
        elif op == 'history':
            r = {'history': list(self.history)}
        else:
            r = {'error': f'άγνωστη ενέργεια «{op}»'}
        return _finite(json.loads(json.dumps(r, default=_plain, ensure_ascii=False)))

    def handle_json(self, s):
        return json.dumps(self.handle(json.loads(s)), ensure_ascii=False)


def _finite(x):
    """NaN and ±inf as null, so that the answer is JSON for the page (JSON.parse does not read NaN)."""
    if isinstance(x, float):
        return x if math.isfinite(x) else None
    if isinstance(x, list):
        return [_finite(v) for v in x]
    if isinstance(x, dict):
        return {k: _finite(v) for k, v in x.items()}
    return x


def _word_command(src, ns):
    """`whos`, `clear x y`, `save ws.json`, `help pcl.run`: a call, as in MATLAB, when the name is still the command."""
    m = _WORD_CMD.match(src.strip())
    if not m or src.strip() != src.strip().split('\n')[0]:
        return src
    name, rest = m.group(1), m.group(2).split()
    if ns.get(name) is None or not callable(ns.get(name)) or getattr(ns[name], '__self__', None) is None:
        return src
    if name == 'help' and rest:
        return f'help({rest[0]})'
    return f'{name}({", ".join(repr(a) for a in rest)})'


def _syntax(e):
    where = f'γραμμή {e.lineno}: ' if getattr(e, 'lineno', None) else ''
    return f'{where}{type(e).__name__}: {e.msg if hasattr(e, "msg") else e}'


_PKG = str(Path(__file__).resolve().parent)


def _format(e, cur=None):
    """The error as Python writes it, with only the lines of the user in the traceback: the commands (the one that ran:
    «γραμμή L»; an earlier one, e.g. of a function defined there: «εντολή N, γραμμή L»), the code of run() and the files it
    ran (not the lines of pcl or of Python itself)."""
    from .core import PclError
    lines = []
    for f in traceback.extract_tb(e.__traceback__):
        cmd = f.filename.startswith(FILE)
        mine = cmd or f.filename == '<σενάριο>' or not (f.filename.startswith(('<', _PKG)) or
                                                         f.filename.startswith((sys.prefix, sys.base_prefix)))
        if mine:
            where = 'γραμμή' if f.filename == cur else (f.filename.strip('<>') + ', γραμμή' if cmd or f.filename.startswith('<') else f'{f.filename}, γραμμή')
            lines.append(f'  {where} {f.lineno}' + (f': {f.line}' if f.line else ''))
    if isinstance(e, (PclError, ConsoleError)):
        what = str(e)
    else:
        what = ''.join(traceback.format_exception_only(type(e), e)).strip()
    return '\n'.join(lines + [what])


# ---------------------------------------------------------------- in a script: the same commands on its variables
def _caller():
    return sys._getframe(2).f_globals


def whos():
    """The variables of the script."""
    print(_whos_text(_caller()))


def clear(*names):
    """Removes variables of the script (all of the user without names)."""
    gone = _clear_names(_caller(), names)
    print(f'Σβήστηκαν: {", ".join(gone)}' if gone else 'Καμία μεταβλητή για σβήσιμο.')


def save(path='workspace.json', *names):
    saved, skipped = _save_names(_caller(), path, names)
    print(f'Αποθηκεύτηκαν {len(saved)} μεταβλητές στο {os.path.abspath(path)}' + (f' · χωρίς τις {", ".join(skipped)}' if skipped else ''))


def load(path='workspace.json'):
    print('Φορτώθηκαν: ' + ', '.join(_load_names(_caller(), path)))


def plot(*args, title=None, xlabel='', ylabel=''):
    from . import core as _c
    x, ys, xl, yl = plot_data(*args, title=title, xlabel=xlabel, ylabel=ylabel)
    _c.plot(x, ys, title, xl, yl)


def scope(*keys):
    print('scope(' + ', '.join(map(repr, keys)) + '): μόνο στη γραμμή εντολών της εφαρμογής.')


def clc():
    pass


def run(path):
    exec(compile(Path(path).read_text(encoding='utf-8'), str(path), 'exec'), _caller())


help = lambda obj=None: print(_help_text(obj))       # noqa: E731,A001 - the name of the command

__all__ = list(COMMANDS)


# ---------------------------------------------------------------- the child process of the server kernel
def child():
    """One line of JSON in, one line out, behind the mark the server gave (PCL_CONSOLE_MARK), so that anything else on
    the standard output (a program the command starts) is output of the command and not an answer. Ctrl+C reaches here as
    SIGINT (CTRL_BREAK on Windows) and stops the command, not the process."""
    import signal
    import shutil
    mark = os.environ.get('PCL_CONSOLE_MARK', '')
    proto = sys.stdout
    pages = []
    state = {'run': False}
    con = Console(page=lambda op, data=None: pages.append({'op': op, **(data or {})}))

    def _int(*_):                           # Ctrl+C stops a command; between commands (reading, answering) it is ignored
        if state['run']:
            raise KeyboardInterrupt
    signal.signal(signal.SIGINT, _int)
    if hasattr(signal, 'SIGBREAK'):         # Windows: the server sends CTRL_BREAK_EVENT to the process group of the child
        signal.signal(signal.SIGBREAK, _int)
    try:
        import numpy
        con.ns['np'] = numpy
    except ImportError:
        pass
    hello = {'ready': True, 'python': sys.version.split()[0], 'cwd': os.getcwd(), 'numpy': 'np' in con.ns,
             'node': shutil.which('node') is not None}
    proto.write(mark + json.dumps(hello) + '\n')
    proto.flush()
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        req = {}
        try:
            req = json.loads(line)
            pages.clear()
            state['run'] = True
            try:
                r = con.handle(req)
            finally:
                state['run'] = False
            r['page'] = list(pages)
        except KeyboardInterrupt:
            state['run'] = False
            r = {'more': False, 'error': 'KeyboardInterrupt: διακόπηκε (Ctrl+C).', 'whos': _whos_rows(con.ns), 'page': []}
        except Exception as e:              # a fault of the console itself, not of the command
            r = {'more': False, 'error': f'{type(e).__name__}: {e}', 'page': []}
        r['id'] = req.get('id')
        proto.write(mark + json.dumps(r, ensure_ascii=False, default=str) + '\n')
        proto.flush()


if __name__ == '__main__':
    if '--child' in sys.argv:
        child()
    else:
        print(__doc__)
