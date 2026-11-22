"""The browser scenarios of tests/ui (Playwright), with one list for the CI and for a run here (5.0.8, decision 379).

    python tools/ui_flows.py --url http://127.0.0.1:8765/ --out ui-out             # all, one after the other (the CI)
    python tools/ui_flows.py --serve --lanes 2 [--out dir] [--port 8765]          # a server of its own, two lanes
    python tools/ui_flows.py --serve --only perf_flow,speed_flow                   # some of them

With --lanes 2 the scenarios without a time limit run in two lanes at the same time, and after them the scenarios
with a limit (they measure times: perf_flow, speed_flow, watch_flow, and addons_flow with the start of a Python
program) one at a time, with nothing else running. With --lanes 1 they all run in the order of FLOWS, as the CI has
always run them. Each scenario runs from the folder --out (its pictures go there), with NODE_PATH at the node_modules
of the repo and the PCL_HOME of the server, so that addons_flow finds the link.json the server writes. The exit code
is 1 if a scenario ends with an exit code other than 0 (some of them print no PASS: the code is the result).
"""
import argparse
import os
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UI = ROOT / 'tests' / 'ui'
FLOWS = ['studio_flow', 'editor_interactions', 'features_flow', 'blocks_flow', 'wiring_flow', 'step_flow',
         'scenario_flow', 'addons_flow', 'subcircuit_flow', 'bus_flow', 'live_flow', 'line_flow', 'ux_flow',
         'perf_flow', 'speed_flow', 'watch_flow', 'ev_flow', 'facts_flow', 'scope_flow', 'gis_flow', 'study_flow',
         'window_flow', 'dock_flow']
TIMED = ['addons_flow', 'perf_flow', 'speed_flow', 'watch_flow']      # with a time limit: alone


def lanes_of(flows, n):
    """The untimed scenarios in n lanes (round robin in the order of FLOWS), and the timed ones after them."""
    free = [f for f in flows if f not in TIMED]
    lanes = [free[k::n] for k in range(n)] if n > 1 else [list(flows)]
    timed = [f for f in flows if f in TIMED] if n > 1 else []
    return lanes, timed


def run_flow(flow, url, out, env, echo=False):
    """One scenario; its output in <out>/<flow>.log, and also on the screen with echo (one lane)."""
    t0 = time.time()
    with open(Path(out) / f'{flow}.log', 'w', encoding='utf-8') as log:
        p = subprocess.Popen(['node', str(UI / f'{flow}.js'), url, '.'], cwd=out, env=env, stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
        for line in p.stdout:
            log.write(line)
            if echo:
                sys.stdout.write(line)
                sys.stdout.flush()
        rc = p.wait()
    return rc, time.time() - t0


def wait_health(url, seconds=60):
    for _ in range(seconds):
        try:
            with urllib.request.urlopen(url.rstrip('/') + '/api/health', timeout=2) as r:
                if r.status == 200:
                    return True
        except OSError:
            pass
        time.sleep(1)
    return False


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--url', default='http://127.0.0.1:8765/')
    ap.add_argument('--serve', action='store_true', help='start `python run.py --no-browser` with a PCL_HOME of its own')
    ap.add_argument('--port', type=int, default=8765)
    ap.add_argument('--home', help='PCL_HOME of the server and the scenarios (with --serve: a new folder)')
    ap.add_argument('--lanes', type=int, default=1)
    ap.add_argument('--only', help='scenarios, separated by commas')
    ap.add_argument('--out', default='ui-out')
    args = ap.parse_args(argv)
    flows = FLOWS if not args.only else [f for f in FLOWS if f in args.only.split(',')]
    unknown = sorted(set((args.only or '').split(',')) - set(FLOWS) - {''})
    if unknown:
        ap.error('unknown scenarios: ' + ', '.join(unknown))
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ)
    env.setdefault('NODE_PATH', str(ROOT / 'node_modules'))
    server = None
    if args.serve:
        home = Path(args.home or tempfile.mkdtemp(prefix='pclhome-'))
        home.mkdir(parents=True, exist_ok=True)
        env['PCL_HOME'] = str(home)
        env.setdefault('PCL_ADDONS', str(home / 'addons'))
        args.url = f'http://127.0.0.1:{args.port}/'
        slog = open(out / 'server.log', 'w', encoding='utf-8')
        server = subprocess.Popen([sys.executable, 'run.py', '--no-browser', '--port', str(args.port)], cwd=ROOT,
                                  env=env, stdout=slog, stderr=subprocess.STDOUT)
        if not wait_health(args.url):
            server.terminate()
            print('the server did not answer /api/health', flush=True)
            return 1
    elif args.home:
        env['PCL_HOME'] = args.home
    results, lock = {}, threading.Lock()
    echo = args.lanes <= 1

    def lane(fl):
        for f in fl:
            print(f'== {f}', flush=True)
            rc, dt = run_flow(f, args.url, out, env, echo=echo)
            with lock:
                results[f] = (rc, dt)
            print(f'{"ok  " if rc == 0 else "FAIL"} {f} ({dt:.0f} s)', flush=True)

    t0 = time.time()
    try:
        lanes, timed = lanes_of(flows, max(1, args.lanes))
        threads = [threading.Thread(target=lane, args=(fl,)) for fl in lanes if fl]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        lane(timed)
    finally:
        if server:
            server.terminate()
            server.wait(timeout=20)
    bad = [f for f in flows if results.get(f, (1,))[0] != 0]
    print(f'{len(flows) - len(bad)}/{len(flows)} scenarios ok in {time.time() - t0:.0f} s'
          + (f' (lanes {args.lanes})' if args.lanes > 1 else '') + ('; failed: ' + ', '.join(bad) if bad else ''))
    if bad and not echo:
        for f in bad:
            print(f'--- {f}.log (end)')
            print(''.join((out / f'{f}.log').read_text(encoding='utf-8', errors='replace').splitlines(True)[-15:]))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
