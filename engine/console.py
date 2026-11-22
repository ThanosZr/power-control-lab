"""The kernel of the command line on the local server (5.0.8, ROADMAP §98): one child process per page,
`python -m pcl.console --child`, with its variables kept between the commands, and Ctrl+C as a signal to it.

Only for this computer and the page of this server (run.py checks the address, the Host, the type and the token of the
link): the commands are Python of the user on his own machine, as the scenarios of §30. The child runs in
$PCL_HOME/console (~/.pcl/console), so save and load find their files there unless a path says otherwise.

    {'op': 'open'}                                → {'session', 'python', 'cwd', 'numpy', 'node'}
    {'op': 'exec', 'session', 'code', 'block', 'ctx'} → the answer of pcl.console.Console.handle (out, error, shows, whos, page)
    {'op': 'complete' | 'whos' | 'reset' | 'history', 'session', …}
    {'op': 'interrupt', 'session'}                → Ctrl+C to the command that runs
    {'op': 'close', 'session'}
"""
import json
import os
import secrets
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_SESSIONS = 4
MAX_CODE = 1_000_000          # characters of one command
OPS = ('open', 'exec', 'complete', 'whos', 'reset', 'history', 'interrupt', 'close')


class ConsoleError(ValueError):
    pass


def home():
    return Path(os.environ.get('PCL_HOME') or (Path.home() / '.pcl'))


class Session:
    """A child process and the lock of its pipe: one request at a time; interrupt does not take the lock."""

    def __init__(self):
        self.mark = '\x1e' + secrets.token_hex(8) + '\x1e'
        self.id = secrets.token_hex(12)
        cwd = home() / 'console'
        cwd.mkdir(parents=True, exist_ok=True)
        env = dict(os.environ, PCL_CONSOLE_MARK=self.mark, PYTHONIOENCODING='utf-8', PYTHONUNBUFFERED='1')
        env['PYTHONPATH'] = str(ROOT) + (os.pathsep + env['PYTHONPATH'] if env.get('PYTHONPATH') else '')
        kw = {'creationflags': subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == 'nt' else {}
        self.proc = subprocess.Popen([sys.executable, '-m', 'pcl.console', '--child'], cwd=str(cwd), env=env,
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                                     encoding='utf-8', errors='replace', bufsize=1, **kw)
        self.lock = threading.Lock()
        self.used = time.time()
        self.busy = False
        self.seq = 0
        self.hello = self._read(None)

    def _read(self, want):
        """The answer with the id of the request (an answer to another request is dropped); other lines are output."""
        extra = []
        while True:
            line = self.proc.stdout.readline()
            if not line:
                self.proc.wait(timeout=5)
                raise ConsoleError('Ο πυρήνας της Python σταμάτησε' + (': ' + ''.join(extra)[-400:] if extra else '.'))
            if line.startswith(self.mark):
                r = json.loads(line[len(self.mark):])
                if r.get('id') != want:
                    continue
                if extra:
                    r['out'] = ''.join(extra) + r.get('out', '')
                return r
            extra.append(line)

    def ask(self, req):
        with self.lock:
            self.busy = True
            self.seq += 1
            try:
                self.proc.stdin.write(json.dumps({**req, 'id': self.seq}, ensure_ascii=False) + '\n')
                self.proc.stdin.flush()
                return self._read(self.seq)
            except (BrokenPipeError, OSError) as e:
                raise ConsoleError(f'Ο πυρήνας της Python δεν απαντά ({e}).') from None
            finally:
                self.busy = False
                self.used = time.time()

    def interrupt(self):
        if self.proc.poll() is not None or not self.busy:
            return False
        if os.name == 'nt':
            self.proc.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            self.proc.send_signal(signal.SIGINT)
        return True

    def close(self):
        if self.proc.poll() is None:
            self.proc.kill()
            try:
                self.proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                pass
        for f in (self.proc.stdin, self.proc.stdout):
            try:
                f.close()
            except OSError:
                pass


SESSIONS = {}
_LOCK = threading.Lock()


def _session(data):
    sid = str(data.get('session') or '')
    s = SESSIONS.get(sid)
    if s is not None and s.proc.poll() is not None:     # the process ended (os._exit, a crash): the page opens a new one
        with _LOCK:
            SESSIONS.pop(sid, None)
        s.close()
        s = None
    if s is None:
        raise ConsoleError('Άγνωστη συνεδρία: η γραμμή εντολών ξανανοίγει τον πυρήνα.')
    return s


def handle(data):
    op = data.get('op')
    if op not in OPS:
        raise ConsoleError('op: ένα από ' + ', '.join(OPS))
    if op == 'open':
        with _LOCK:
            while len(SESSIONS) >= MAX_SESSIONS:           # the one used least lately goes
                old = min(SESSIONS.values(), key=lambda s: s.used)
                SESSIONS.pop(old.id).close()
            s = Session()
            SESSIONS[s.id] = s
        return {'session': s.id, **{k: s.hello.get(k) for k in ('python', 'cwd', 'numpy', 'node')}}
    if op == 'close':
        with _LOCK:
            s = SESSIONS.pop(str(data.get('session') or ''), None)
        if s:
            s.close()
        return {'ok': True}
    s = _session(data)
    if op == 'interrupt':
        return {'ok': s.interrupt(), 'busy': s.busy}
    code = data.get('code')
    if code is not None and (not isinstance(code, str) or len(code) > MAX_CODE):
        raise ConsoleError('code: κείμενο ως 1 000 000 χαρακτήρες')
    req = {k: data[k] for k in ('op', 'code', 'block', 'ctx', 'text') if k in data}
    return s.ask(req)


def close_all():
    with _LOCK:
        for s in list(SESSIONS.values()):
            s.close()
        SESSIONS.clear()
