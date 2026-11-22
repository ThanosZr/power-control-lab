"""The tests in parallel (5.0.8, decision 379): a fixed share of the test files over N shards, each shard as a job of
the CI or as a process here, and a last check that every test ran, once, with the same count as a discovery of all.

    python tools/test_shards.py list [--n 6]                      # the share and the estimated seconds of each shard
    python tools/test_shards.py run I/N [--report r.json] [-v]    # shard I of N, run as `python -m unittest discover -s tests`
    python tools/test_shards.py check r1.json ... [--serial log]  # every file in one shard, every test ran, no failure
    python tools/test_shards.py local [-j 2] [--n 6] [--out dir]  # all the shards here, in -j processes, then the check
    python tools/test_shards.py times LOG ... [--write]           # seconds per file from CI logs of `discover -v`

The share: the files with a time in tools/test_times.json go to the shards largest first, each to the shard with the
least time so far (ties to the lowest shard); the files without a time follow by name, each with the median time.
A file that is added does not move the others; a file that is removed keeps its place in the table until the table
is measured again (`times --write`), so the share changes only when the table does.

A shard loads its files one by one with the loader of `discover` (the same start folder, the same import names, the
folder of the tests first in sys.path, the root of the repo next as with `python -m`) and runs them in name order, as
the serial run does. `local` gives each process its own PCL_HOME and TMPDIR, so two processes never share
~/.pcl (link.json, recordings, models); in the CI each shard is a machine of its own.

`check --serial LOG` compares, test by test, the outcomes of the shards with the -v output of the serial command:
the check of decision 379 the first time (the same tests and the same result both ways).
"""
import argparse
import json
import os
import re
import statistics
import subprocess
import sys
import time
import unittest
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TESTS = ROOT / 'tests'
TIMES = ROOT / 'tools' / 'test_times.json'
SHARDS = 6                                   # the CI (.github/workflows/ci.yml, the matrix of the job «Tests»)
FORMAT = 'pcl-test-shard'


def test_files(tests=TESTS):
    """The files that `python -m unittest discover -s tests` loads: tests/test*.py at the top (tests/js and tests/ui
    are not packages, so discover does not go into them)."""
    return sorted(p.name[:-3] for p in Path(tests).glob('test*.py'))


def load_times(path=TIMES):
    try:
        d = json.loads(Path(path).read_text(encoding='utf-8'))
    except FileNotFoundError:
        return {}
    return {k: float(v) for k, v in d.get('seconds', {}).items()}


def share(files, times, n):
    """The shards (lists of file names, each in name order) and their estimated seconds."""
    if n < 1:
        raise ValueError('n >= 1')
    loads, shards = [0.0] * n, [[] for _ in range(n)]
    for f, t in sorted(times.items(), key=lambda kv: (-kv[1], kv[0])):     # every name of the table, also a removed file
        i = min(range(n), key=lambda j: (loads[j], j))
        loads[i] += t
        shards[i].append(f)
    default = statistics.median(times.values()) if times else 1.0
    for f in sorted(set(files) - set(times)):
        i = min(range(n), key=lambda j: (loads[j], j))
        loads[i] += default
        shards[i].append(f)
    have = set(files)
    out = [sorted(f for f in s if f in have) for s in shards]
    est = [sum(times.get(f, default) for f in s) for s in out]
    return out, est


class _Result(unittest.TextTestResult):
    """TextTestResult that also keeps the outcome of each test by its id."""

    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.outcomes = {}

    def _put(self, test, what):
        tid = test.id()
        if self.outcomes.get(tid) in ('fail', 'error'):
            return
        self.outcomes[tid] = what

    def addSuccess(self, test):
        super().addSuccess(test)
        self._put(test, 'ok')

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self._put(test, 'fail')

    def addError(self, test, err):
        super().addError(test, err)
        self._put(test, 'error')

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        self._put(test, 'skip')

    def addExpectedFailure(self, test, err):
        super().addExpectedFailure(test, err)
        self._put(test, 'xfail')

    def addUnexpectedSuccess(self, test):
        super().addUnexpectedSuccess(test)
        self._put(test, 'xpass')

    def addSubTest(self, test, subtest, err):
        super().addSubTest(test, subtest, err)
        if err is not None:
            self._put(test, 'fail' if issubclass(err[0], test.failureException) else 'error')


def _prepare_path():
    """sys.path as with `python -m unittest` from the root: the root first instead of the folder of this script."""
    here = str(Path(__file__).resolve().parent)
    sys.path[:] = [p for p in sys.path if Path(p or '.').resolve() != Path(here)]
    if str(ROOT) not in sys.path:
        sys.path.insert(0, str(ROOT))
    os.chdir(ROOT)


def run_shard(i, n, report=None, verbosity=1, stream=None):
    """Run shard i of n (1-based) and return the report (also written to `report`)."""
    _prepare_path()
    files = share(test_files(), load_times(), n)[0][i - 1]
    loader = unittest.TestLoader()
    suites = []
    for f in files:
        suites.append((f, loader.discover('tests', pattern=f + '.py')))
    loaded = sum(s.countTestCases() for _, s in suites)
    stream = stream or sys.stderr
    runner = unittest.TextTestRunner(stream=stream, verbosity=verbosity, resultclass=_Result)
    result = runner._makeResult()
    import warnings
    per_file = {}
    t0 = time.perf_counter()
    with warnings.catch_warnings():
        if not sys.warnoptions:
            warnings.simplefilter('default')
        result.startTestRun()
        try:
            for f, s in suites:
                t1 = time.perf_counter()
                s(result)
                per_file[f] = round(time.perf_counter() - t1, 2)
        finally:
            result.stopTestRun()
    dt = time.perf_counter() - t0
    result.printErrors()
    stream.write(result.separator2 + '\n')
    stream.write(f'Ran {result.testsRun} test{"s" if result.testsRun != 1 else ""} in {dt:.3f}s\n\n')
    stream.write(('OK' if result.wasSuccessful() else 'FAILED') +
                 f' (shard {i}/{n}: {len(files)} files, {loaded} loaded, skipped={len(result.skipped)}, '
                 f'failures={len(result.failures)}, errors={len(result.errors)})\n')
    rep = {
        'format': FORMAT, 'version': 1, 'shard': i, 'of': n, 'files': files, 'loaded': loaded,
        'loader_errors': len(loader.errors), 'run': result.testsRun,
        'failures': sorted(t.id() for t, _ in result.failures), 'errors': sorted(t.id() for t, _ in result.errors),
        'skipped': len(result.skipped), 'expected_failures': len(result.expectedFailures),
        'unexpected_successes': sorted(t.id() for t in result.unexpectedSuccesses),
        'outcomes': dict(sorted(result.outcomes.items())), 'seconds': round(dt, 2), 'file_seconds': per_file,
        'python': sys.version.split()[0], 'ok': result.wasSuccessful() and not loader.errors,
    }
    if report:
        Path(report).write_text(json.dumps(rep, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return rep


_DESC = re.compile(r'\((test\w*(?:\.\w+)+)\)')
_OUTCOME = [('ok', re.compile(r'(?:^|\.\.\. )ok$')), ('fail', re.compile(r'(?:^|\.\.\. )FAIL$')),
            ('error', re.compile(r'(?:^|\.\.\. )ERROR$')), ('skip', re.compile(r"(?:^|\.\.\. )skipped\b")),
            ('xfail', re.compile(r'(?:^|\.\.\. )expected failure$')),
            ('xpass', re.compile(r'(?:^|\.\.\. )unexpected success$'))]


def parse_verbose(text):
    """Outcome of each test from the -v output of `python -m unittest` (the description line names the test, the
    outcome is at the end of that line or of the first line after it that is an outcome)."""
    out, cur = {}, None
    for line in text.splitlines():
        line = line.rstrip()
        m = _DESC.search(line)
        if m and (' ... ' in line or line.endswith(')') or line.endswith('...')):
            cur = m.group(1)
        if cur is None:
            continue
        for what, rx in _OUTCOME:
            if rx.search(line):
                if out.get(cur) not in ('fail', 'error'):
                    out[cur] = what
                cur = None
                break
    return out


def check(reports, n=None, serial=None, count=True, files=None, out=sys.stdout):
    """Return a list of problems (empty: every test ran once and passed)."""
    probs = []
    reps = [r if isinstance(r, dict) else json.loads(Path(r).read_text(encoding='utf-8')) for r in reports]
    reps = [r for r in reps if r.get('format') == FORMAT]
    if not reps:
        return ['no report of a shard']
    n = n or reps[0]['of']
    got = sorted(r['shard'] for r in reps)
    if any(r['of'] != n for r in reps):
        probs.append(f'reports of different shares: {sorted({r["of"] for r in reps})}')
    if got != list(range(1, n + 1)):
        probs.append(f'shards {got}, expected 1..{n}')
    seen = {}
    for r in reps:
        for f in r['files']:
            if f in seen:
                probs.append(f'{f} in shards {seen[f]} and {r["shard"]}')
            seen[f] = r['shard']
        if r['run'] != r['loaded']:
            probs.append(f'shard {r["shard"]}: {r["run"]} ran of {r["loaded"]} loaded')
        if r.get('loader_errors'):
            probs.append(f'shard {r["shard"]}: {r["loader_errors"]} errors of the loader')
        for k in ('failures', 'errors', 'unexpected_successes'):
            for t in r.get(k, []):
                probs.append(f'shard {r["shard"]}: {k[:-1] if k != "unexpected_successes" else "unexpected success"} {t}')
    want = set(test_files() if files is None else files)
    for f in sorted(want - set(seen)):
        probs.append(f'{f} in no shard')
    for f in sorted(set(seen) - want):
        probs.append(f'{f} is not a test file here')
    total = sum(r['run'] for r in reps)
    skipped = sum(r['skipped'] for r in reps)
    if count:
        _prepare_path()
        loader = unittest.TestLoader()
        full = loader.discover('tests').countTestCases()
        if loader.errors:
            probs.append(f'{len(loader.errors)} errors of the loader in the discovery of all the tests')
        if full != total:
            probs.append(f'{total} ran in the shards, {full} in a discovery of all the tests')
    outs = {}
    for r in reps:
        outs.update(r.get('outcomes', {}))
    if serial is not None:
        text = serial if isinstance(serial, str) else Path(serial).read_text(encoding='utf-8', errors='replace')
        ser = parse_verbose(text)
        m = re.search(r'^Ran (\d+) tests? in', text, re.M)
        if m and int(m.group(1)) != total:
            probs.append(f'serial: Ran {m.group(1)}, shards: {total}')
        only_s, only_p = sorted(set(ser) - set(outs)), sorted(set(outs) - set(ser))
        for t in only_s[:20]:
            probs.append(f'serial only: {t}')
        for t in only_p[:20]:
            probs.append(f'shards only: {t}')
        for t in sorted(set(ser) & set(outs)):
            if ser[t] != outs[t]:
                probs.append(f'{t}: serial {ser[t]}, shards {outs[t]}')
        out.write(f'serial: {len(ser)} tests with an outcome, {sum(1 for v in ser.values() if v == "skip")} skipped; '
                  f'shards: {len(outs)}; the same outcome in {sum(1 for t in ser if outs.get(t) == ser[t])}\n')
    secs = ', '.join(f'{r["shard"]}: {r["seconds"]:.0f} s' for r in sorted(reps, key=lambda r: r['shard']))
    out.write(f'{n} shards, {len(seen)} files, {total} tests ({skipped} skipped); {secs}\n')
    return probs


def local(n=SHARDS, jobs=None, outdir=None, verbose=True, serial=None):
    """All the shards here, `jobs` at a time, each in its own process with its own PCL_HOME and TMPDIR."""
    jobs = jobs or os.cpu_count() or 2
    outdir = Path(outdir or f'/tmp/pcl-shards-{time.strftime("%Y%m%d-%H%M%S")}')
    outdir.mkdir(parents=True, exist_ok=True)
    est = share(test_files(), load_times(), n)[1]
    order = sorted(range(1, n + 1), key=lambda i: (-est[i - 1], i))       # the longest first
    running, done, t0 = {}, {}, time.time()
    while order or running:
        while order and len(running) < jobs:
            i = order.pop(0)
            env = dict(os.environ)
            for k, sub in (('PCL_HOME', f'home-{i}'), ('TMPDIR', f'tmp-{i}')):
                (outdir / sub).mkdir(exist_ok=True)
                env[k] = str(outdir / sub)
            log = open(outdir / f'shard-{i}.log', 'w', encoding='utf-8')
            cmd = [sys.executable, str(Path(__file__).resolve()), 'run', f'{i}/{n}',
                   '--report', str(outdir / f'shard-{i}.json')] + (['-v'] if verbose else [])
            running[i] = (subprocess.Popen(cmd, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT), log, time.time())
        time.sleep(1)
        for i, (p, log, ts) in list(running.items()):
            if p.poll() is not None:
                log.close()
                done[i] = (p.returncode, time.time() - ts)
                del running[i]
                print(f'shard {i}/{n}: rc {p.returncode}, {done[i][1]:.0f} s', flush=True)
    print(f'{n} shards in {jobs} processes: {time.time() - t0:.0f} s ({outdir})', flush=True)
    reps = [outdir / f'shard-{i}.json' for i in range(1, n + 1) if (outdir / f'shard-{i}.json').exists()]
    probs = check(reps, n=n, serial=serial)
    for p in probs:
        print('PROBLEM:', p)
    return 1 if probs or any(rc for rc, _ in done.values()) else 0


_TS = re.compile(r'^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+)Z (.*)$')


def times_from_log(text):
    """Seconds per test file from a GitHub Actions log of `discover -v` (a timestamp on every line: the time of a
    test is from the line of the test before it to the line of its outcome)."""
    secs, prev, cur, on = {}, None, None, False
    for line in text.splitlines():
        m = _TS.match(line)
        if not m:
            continue
        t, body = datetime.fromisoformat(m.group(1)[:26]), m.group(2)
        if not on:
            if body.startswith('##[group]Run python') and ('unittest discover' in body or 'test_shards.py run' in body):
                on, prev = True, t
            continue
        d = _DESC.search(body)
        if d:
            cur = d.group(1).split('.')[0]
        if any(rx.search(body.rstrip()) for _, rx in _OUTCOME) and cur:
            secs[cur] = secs.get(cur, 0.0) + (t - prev).total_seconds()
            prev = t
        if body.startswith('Ran '):
            break
    return secs


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    sub = ap.add_subparsers(dest='cmd', required=True)
    a = sub.add_parser('list')
    a.add_argument('--n', type=int, default=SHARDS)
    a = sub.add_parser('run')
    a.add_argument('which', help='I/N')
    a.add_argument('--report')
    a.add_argument('-v', '--verbose', action='store_true')
    a = sub.add_parser('check')
    a.add_argument('reports', nargs='+')
    a.add_argument('--n', type=int)
    a.add_argument('--serial', help='the -v output of `python -m unittest discover -s tests -v`')
    a.add_argument('--no-count', action='store_true', help='without the discovery of all the tests')
    a = sub.add_parser('local')
    a.add_argument('-j', '--jobs', type=int)
    a.add_argument('--n', type=int, default=SHARDS)
    a.add_argument('--out')
    a.add_argument('--serial')
    a.add_argument('-q', '--quiet', action='store_true')
    a = sub.add_parser('times')
    a.add_argument('logs', nargs='+')
    a.add_argument('--write', action='store_true')
    args = ap.parse_args(argv)
    if args.cmd == 'list':
        shards, est = share(test_files(), load_times(), args.n)
        for k, (s, e) in enumerate(zip(shards, est), 1):
            print(f'{k}/{args.n}: {len(s):3d} files, ~{e:6.0f} s  ' + ' '.join(s))
        print(f'{sum(len(s) for s in shards)} files, ~{sum(est):.0f} s in all, ~{max(est):.0f} s the longest shard')
        return 0
    if args.cmd == 'run':
        i, n = (int(x) for x in args.which.split('/'))
        if not 1 <= i <= n:
            ap.error('I/N with 1 <= I <= N')
        rep = run_shard(i, n, report=args.report, verbosity=2 if args.verbose else 1)
        return 0 if rep['ok'] else 1
    if args.cmd == 'check':
        probs = check(args.reports, n=args.n, serial=Path(args.serial) if args.serial else None,
                      count=not args.no_count)
        for p in probs:
            print('PROBLEM:', p)
        print('OK' if not probs else f'{len(probs)} problems')
        return 1 if probs else 0
    if args.cmd == 'local':
        return local(n=args.n, jobs=args.jobs, outdir=args.out, verbose=not args.quiet,
                     serial=Path(args.serial) if args.serial else None)
    if args.cmd == 'times':
        runs = [times_from_log(Path(p).read_text(encoding='utf-8', errors='replace')) for p in args.logs]
        names = sorted(set().union(*runs))
        avg = {f: round(statistics.mean(r[f] for r in runs if f in r), 1) for f in names}
        for f, t in sorted(avg.items(), key=lambda kv: -kv[1]):
            print(f'{t:8.1f} s  {f}')
        print(f'{len(avg)} files, {sum(avg.values()):.0f} s, from {len(runs)} logs')
        if args.write:
            TIMES.write_text(json.dumps({
                'note': 'Seconds per test file in the CI (the mean of the logs given to `tools/test_shards.py times`). '
                        'Only the share of the files over the shards reads them; a change here can move files.',
                'logs': len(runs), 'seconds': dict(sorted(avg.items()))}, ensure_ascii=False, indent=1) + '\n',
                encoding='utf-8')
            print(f'written {TIMES.relative_to(ROOT)}')
        return 0


if __name__ == '__main__':
    sys.exit(main())
