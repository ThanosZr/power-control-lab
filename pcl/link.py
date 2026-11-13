"""The link to the app open in the browser (3.15, ROADMAP §35, §36): a program on this computer reads and changes the
circuit on the screen, runs simulations with the app's solver and sends tables and charts to its panel.

    import pcl
    app = pcl.link.connect()               # ~/.pcl/link.json (written by python run.py); the link is turned on in the app
    app.info()                             # circuit, selection, T
    app.set('R1.R', 10)                    # the change shows in the app (with undo)
    r = app.run(t_end='5m', measure={'Vo': ('V:C1', 'avg', 10)})
    app.show(pcl.plot(...) or a table)     # into the app's «Σενάρια» panel
    p = app.project()                      # a pcl.Project, for local runs and sweeps

The same methods as the add-ons (web/studio/addons.js). Any language with HTTP can call them: POST /api/link/call
with {token, method, args}. MATLAB: pcl_link (matlab/).
"""
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

from .core import PclError, Project, Plot, Result, SweepResult, _clean, _measures, _unit, parse_value


def _home():
    return Path(os.environ.get('PCL_HOME') or (Path.home() / '.pcl'))


class App:
    def __init__(self, url, token, timeout=120, client='Python (pcl.link)'):
        self.url = url.rstrip('/')
        self.token = token
        self.timeout = timeout
        self.client = client          # the name the app shows when it asks «Αποδοχή / Απόρριψη»

    def __repr__(self):
        return f'<pcl.link.App {self.url}>'

    def call(self, method, timeout=None, **args):
        t = float(timeout or self.timeout)
        body = json.dumps({'token': self.token, 'method': method, 'args': _clean(args), 'timeout': t, 'client': self.client}).encode('utf-8')
        req = urllib.request.Request(self.url + '/api/link/call', data=body, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=t + 75) as r:     # + the wait for «Αποδοχή» when the link is closed
                out = json.loads(r.read())
        except urllib.error.HTTPError as e:
            try:
                msg = json.loads(e.read()).get('error')
            except Exception:                    # noqa: BLE001
                msg = None
            raise PclError(msg or f'HTTP {e.code}') from None
        except urllib.error.URLError as e:
            raise PclError(f'Ο server της εφαρμογής δεν απαντά στο {self.url} (python run.py): {e.reason}') from None
        if 'error' in out:
            raise PclError(out['error'])
        return out.get('result')

    # the circuit
    def info(self):
        return self.call('info')

    def project(self):
        return Project(self.call('project.get'), name='app')

    def load(self, project):
        return self.call('project.load', project=project.data if isinstance(project, Project) else project)

    def params(self, cid=None):
        return self.call('params', id=cid)

    def get(self, key):
        return self.call('get', key=key)

    def set(self, key, value, source=None):
        return self.call('set', key=key, value=value, source=source)

    def set_many(self, values, source=None):
        return self.call('set_many', values=values, source=source)

    def selection(self):
        return self.call('selection')

    def channels(self):
        return self.call('channels')

    def scope(self, keys=None):
        """What the app's scope holds now: {keys, t, ch, T, now}."""
        return self.call('scope', keys=keys or [])

    # simulations with the app's solver (its pool of workers)
    def machines(self):
        """The machines of the app (4.7): type, name, kind, outputs, pins, parameters with defaults (pcl.gui reads them)."""
        return self.call('machines')

    def advance(self, dt, set=None, keys=None, draw=False):   # noqa: A002 - the API's word
        """4.9.1: one step of an external controller on the circuit of the screen: the values of set ({'<id>.<param>': value};
        a «Σταθερά» block directly, other parameters as live changes that keep the states), the simulation dt seconds further
        (paused in between, the scope drawn), and {t, values} of the channels keys."""
        return self.call('advance', dt=float(parse_value(dt)), set=set or {}, keys=list(keys or []), draw=bool(draw))

    def reset(self):
        """4.9.1: the simulation of the screen from the start (as ⟲)."""
        return self.call('reset')

    def run(self, t_end=None, channels=None, measure=None, **kw):
        q = {'t_end': float(parse_value(t_end)) if t_end is not None else None, 'channels': channels, 'measure': _measures(measure), **kw}
        out = self.call('run', **{k: v for k, v in q.items() if v is not None})
        return Result(out.get('t') or [], out['keys'], out.get('ch') or {}, {**out['meta'], 'solver': 'browser (η εφαρμογή, μέσω σύνδεσης)'},
                      None, out.get('measure') or {}, out.get('diag') or [])

    def python(self, code, **inputs):
        """Python in the app's worker (the same interpreter as its scenarios); the answer is the variable `result`."""
        return self.call('python', code=code, inputs=inputs)

    # to the app's screen
    def show(self, obj, title=None):
        if isinstance(obj, Plot):
            d = {'type': 'xy', **obj}
        elif isinstance(obj, SweepResult):
            d = {'type': 'sweep', 'params': obj.params, 'names': obj.names, 'rows': obj.rows}
        elif isinstance(obj, Result):
            d = {'type': 'run', 'keys': obj.keys, 'units': [_unit(k) for k in obj.keys], 't': obj.t, 'ch': obj.ch,
                 'measure': obj.measured, 'meta': {}}
        elif isinstance(obj, dict):
            d = {'type': 'table', 'cols': ['', ''], 'rows': [[str(k), v] for k, v in obj.items()]}
        elif isinstance(obj, (list, tuple)) and obj and all(isinstance(r, dict) for r in obj):
            cols = list(dict.fromkeys(k for r in obj for k in r))
            d = {'type': 'table', 'cols': cols, 'rows': [[r.get(c) for c in cols] for r in obj]}
        else:
            d = {'type': 'text', 'text': str(obj)}
        d['title'] = title
        return self.call('show', obj=d)

    def notify(self, msg, sev='info', fix=''):
        return self.call('notify', msg=msg, sev=sev, fix=fix, src='link')


def connect(url=None, token=None, timeout=120, client='Python (pcl.link)'):
    """The app of ~/.pcl/link.json (or the given url and token)."""
    if url is None or token is None:
        f = _home() / 'link.json'
        if not f.is_file():
            raise PclError(f'Δεν βρέθηκε το {f}: ξεκίνα την εφαρμογή με python run.py.')
        d = json.loads(f.read_text(encoding='utf-8'))
        url, token = url or d['url'], token or d['token']
    return App(url, token, timeout, client)
