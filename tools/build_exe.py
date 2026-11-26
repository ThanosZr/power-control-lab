"""5.1.3: the application as an executable for Windows, Linux and macOS (PyInstaller, one folder).

    python tools/build_exe.py [--zip] [--smoke] [--pyodide] [--out dist]

In a clean environment with only the packages of the application (`pip install -r requirements.txt pyinstaller`):
PyInstaller takes every package it finds imported, so in an environment with many other packages the folder grows
(in the test of 5.1.2, 463 MB instead of 170 MB).

The folder <out>/pcl-lab/ has the program pcl-lab (pcl-lab.exe on Windows). It starts the local server of run.py and
opens the studio in a window of Chrome or Edge, as `python run.py` does (the same options: --no-browser, --browser,
--port). The web pages, the pcl package (with its data and the Python of the «Σενάρια» panel) and the engine go in as
files, from a copy without __pycache__. Next to the program, LICENSES/ with the licenses of what is in (NOTICE.txt).

    --zip      <out>/Power_Control_Lab_<version>_<system>.zip, with the folder pcl-lab/ inside
    --smoke    the program is started with --no-browser on a free port, and the page, a load flow, an RMS study with the
               modes at the start, the command line of the page (its child process) and, when Node.js is there, a
               scenario of the buck are asked from its server; then it is stopped
    --pyodide  the local copy of Pyodide (web/vendor/pyodide, tools/get_pyodide.py) goes in too, fetched if it is
               missing, so that the Python block works without internet; without it, it goes in only if it is there

PyInstaller builds only for the system it runs on: the CI builds on Windows and Linux (the job «Εκτελέσιμο»), and
attaches the zips to the release of a tag v*. The programs are not signed: Windows may warn before the first start.
"""
import argparse
import importlib.util
import json
import os
import re
import shutil
import socket
import stat
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAME = 'pcl-lab'
PACKAGES = ('pcl', 'engine')                  # imported by run.py, and also copied as files (data, the «Σενάρια» panel)
SKIP = shutil.ignore_patterns('__pycache__', '*.pyc', '*.pyo')


def system_tag(platform=None):
    """windows, linux or macos, for the name of the zip."""
    p = platform or sys.platform
    if p.startswith('win'):
        return 'windows'
    if p == 'darwin':
        return 'macos'
    return 'linux'


def version(root=ROOT):
    """The version of engine/__init__.py, without importing the engine."""
    for line in (root / 'engine' / '__init__.py').read_text(encoding='utf-8').splitlines():
        if line.startswith('__version__'):
            return line.split('=', 1)[1].strip().strip('"\'')
    raise SystemExit('Δεν βρέθηκε το __version__ στο engine/__init__.py.')


def zip_name(ver, tag):
    return f"Power_Control_Lab_{ver.replace('.', '_')}_{tag}.zip"


def stage(root, dest, pyodide=False):
    """A copy of web/, pcl/ and engine/ in dest, without __pycache__; web/vendor only with pyodide."""
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)

    def web_skip(folder, names):
        out = set(SKIP(folder, names))
        if not pyodide and Path(folder).resolve() == (root / 'web').resolve():
            out.add('vendor')
        return out
    shutil.copytree(root / 'web', dest / 'web', ignore=web_skip)
    for pkg in PACKAGES:
        shutil.copytree(root / pkg, dest / pkg, ignore=SKIP)
    return dest


DISTS = ('numpy', 'scipy', 'sympy', 'mpmath')     # the packages that go in (mpmath with SymPy)


def collect_licenses(root, dest, pyodide=False):
    """LICENSES/ next to the program: the license of the application, of Python, the license files of the packages
    that go in (from their metadata), and NOTICE.txt with what is in, its version and where its files are."""
    import importlib.metadata as md
    import platform
    import sysconfig
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copy2(root / 'LICENSE', dest / 'LICENSE-Power-Control-Lab.txt')
    notes = [f'Power & Control Lab {version(root)}: LICENSE-Power-Control-Lab.txt']
    py = Path(sysconfig.get_paths()['stdlib']) / 'LICENSE.txt'
    py = py if py.exists() else Path(sys.base_prefix) / 'LICENSE.txt'
    if py.exists():
        (dest / 'python').mkdir(exist_ok=True)
        shutil.copy2(py, dest / 'python' / 'LICENSE.txt')
    notes.append(f'Python {platform.python_version()}: ' + ('python/LICENSE.txt' if py.exists() else 'https://docs.python.org/3/license.html'))
    for name in DISTS:
        try:
            dist = md.distribution(name)
        except md.PackageNotFoundError:
            continue
        found = []
        for f in dist.files or []:
            if any(k in f.name.upper() for k in ('LICENSE', 'COPYING', 'NOTICE')):
                src = Path(dist.locate_file(f))
                if src.is_file():
                    target = dest / name / Path(*f.parts)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, target)
                    found.append(target)
        notes.append(f"{dist.metadata['Name']} {dist.version}: {name}/ ({len(found)} {'αρχείο' if len(found) == 1 else 'αρχεία'})")
    if pyodide:
        pv = re.search(r"VERSION = '([^']+)'", (root / 'tools' / 'get_pyodide.py').read_text(encoding='utf-8'))
        notes.append(f"Pyodide {pv.group(1) if pv else ''} (MPL-2.0), στο _internal/web/vendor/pyodide: https://github.com/pyodide/pyodide")
    notes.append('Χτισμένο με το PyInstaller (GPL-2.0 με εξαίρεση για τα προγράμματα που χτίζει): https://pyinstaller.org')
    (dest / 'NOTICE.txt').write_text('\n'.join(notes) + '\n', encoding='utf-8')
    return dest


def pyinstaller_cmd(root, staged, out, work, name=NAME, sep=os.pathsep):
    """The command of PyInstaller: one folder, the staged folders as data, every module of pcl and engine."""
    cmd = [sys.executable, '-m', 'PyInstaller', '--noconfirm', '--clean', '--log-level', 'WARN', '--onedir',
           '--name', name, '--distpath', str(out), '--workpath', str(work), '--specpath', str(work),
           '--python-option', 'X utf8']           # UTF-8 mode: the Greek of the server and of the command line on every system
    for folder in ('web',) + PACKAGES:
        cmd += ['--add-data', f'{staged / folder}{sep}{folder}']
    for pkg in PACKAGES:
        cmd += ['--collect-submodules', pkg]
    cmd.append(str(root / 'run.py'))
    return cmd


def program(out, name=NAME, platform=None):
    p = platform or sys.platform
    return Path(out) / name / (name + '.exe' if p.startswith('win') else name)


def folder_size(path):
    """Bytes and number of files; a link (on Linux, PyInstaller links some libraries of NumPy and SciPy) counts once,
    as its target."""
    files = [f for f in Path(path).rglob('*') if f.is_file() and not f.is_symlink()]
    return sum(f.stat().st_size for f in files), len(files)


def make_zip(out, ver, tag, name=NAME):
    target = Path(out) / zip_name(ver, tag)
    base = Path(out) / name
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(base.rglob('*')):
            arc = (Path(name) / f.relative_to(base)).as_posix()
            if f.is_symlink():                    # kept as a link (unzip restores it), not as a second copy
                info = zipfile.ZipInfo(arc)
                info.create_system = 3
                info.external_attr = (stat.S_IFLNK | 0o777) << 16
                z.writestr(info, os.readlink(f))
            elif f.is_file():
                z.write(f, arc)                   # with its mode (the program stays executable)
    return target


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def _post(url, body, timeout):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def smoke(command, cwd=None, timeout=120):
    """Starts the program (a command, e.g. [pcl-lab] or [python, run.py]) with --no-browser on a free port, asks for
    the page, a load flow and an RMS study with the modes, stops it, and returns what it measured. Raises on failure."""
    port = free_port()
    base = f'http://127.0.0.1:{port}'
    home = tempfile.mkdtemp(prefix='pcl-smoke-')    # its own ~/.pcl: the token of the link for the command line
    t0 = time.perf_counter()
    log = open(Path(home) / 'server.log', 'wb')     # a file, not a pipe: a full pipe would stop the server
    proc = subprocess.Popen(list(command) + ['--no-browser', '--port', str(port)], cwd=cwd,
                            env=dict(os.environ, PCL_HOME=home), stdout=log, stderr=subprocess.STDOUT)

    def output():
        log.flush()
        return (Path(home) / 'server.log').read_bytes().decode(errors='replace')[-2000:]
    try:
        while True:
            if proc.poll() is not None:
                raise RuntimeError('Το πρόγραμμα σταμάτησε πριν απαντήσει:\n' + output())
            try:
                with urllib.request.urlopen(base + '/api/health', timeout=2) as r:
                    if r.status == 200:
                        break
            except (urllib.error.URLError, OSError):
                pass
            if time.perf_counter() - t0 > timeout:
                raise RuntimeError(f'Καμία απάντηση από τον server σε {timeout} s:\n' + output())
            time.sleep(0.25)
        started = time.perf_counter() - t0
        with urllib.request.urlopen(base + '/', timeout=30) as r:
            page = r.read()
        if b'<html' not in page.lower():
            raise RuntimeError('Η αρχική σελίδα δεν είναι HTML.')
        pf = _post(base + '/api/network_study', {'case': 'ieee9', 'study': 'pf'}, timeout)
        if not (pf.get('summary') or {}).get('converged'):
            raise RuntimeError('Η ροή φορτίου του IEEE 9 δεν συνέκλινε: ' + json.dumps(pf)[:400])
        rms = _post(base + '/api/network_study',
                    {'case': 'ieee9', 'study': 'rms', 'options': {'t_end': 1.0, 'modes': True}}, timeout)
        res = rms.get('result') or {}
        modes = res.get('modes')
        if not res.get('stable') and not (rms.get('summary') or {}).get('stable'):
            raise RuntimeError('Η μελέτη RMS του IEEE 9 δεν βγήκε ευσταθής: ' + json.dumps(rms)[:400])
        if not isinstance(modes, list) or not modes:
            raise RuntimeError('Η μελέτη RMS δεν έδωσε ιδιοτιμές στην αρχή: ' + json.dumps(modes)[:400])
        token = json.loads((Path(home) / 'link.json').read_text(encoding='utf-8'))['token']
        con = _post(base + '/api/console', {'token': token, 'op': 'open'}, timeout)     # the child of the command line
        if not con.get('session') or not con.get('numpy'):
            raise RuntimeError('Η γραμμή εντολών δεν άνοιξε: ' + json.dumps(con)[:400])
        _post(base + '/api/console', {'token': token, 'op': 'close', 'session': con['session']}, timeout)
        vo = None
        if shutil.which('node'):                  # the «Σενάρια» with the solver of the browser (pcl/runner.js in Node)
            sc = _post(base + '/api/scenario_run', {'project': 'tutorial:buck?start=steady', 'run': {
                't_end': '1m', 'channels': ['V:C1'], 'measure': {'Vo': ['V:C1', 'avg', 10]}, 'waveforms': False}}, timeout)
            vo = (sc.get('measure') or {}).get('Vo')
            if not isinstance(vo, (int, float)) or abs(vo - 12) > 0.1:
                raise RuntimeError('Το σενάριο του buck δεν έδωσε 12 V: ' + json.dumps(sc)[:400])
            vo = round(vo, 4)
        try:                                      # the local Pyodide, when it went in (--pyodide)
            with urllib.request.urlopen(base + '/vendor/pyodide/pyodide.js', timeout=30) as r:
                pyo = r.status == 200
        except (urllib.error.URLError, OSError):
            pyo = False
        return {'start_s': round(started, 2), 'page_bytes': len(page), 'pf_iterations': pf['summary'].get('iterations'),
                'modes': len(modes), 'f_hz': [round(m['f'], 3) for m in modes], 'console_python': con.get('python'),
                'scenario_vo': vo, 'pyodide': pyo}
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
        log.close()
        shutil.rmtree(home, ignore_errors=True)


def main(argv=None):
    ap = argparse.ArgumentParser(description='Η εφαρμογή ως εκτελέσιμο (PyInstaller, ένας φάκελος).')
    ap.add_argument('--out', default=str(ROOT / 'dist'))
    ap.add_argument('--zip', action='store_true')
    ap.add_argument('--smoke', action='store_true')
    ap.add_argument('--pyodide', action='store_true')
    a = ap.parse_args(argv)
    for stream in (sys.stdout, sys.stderr):      # the Greek messages, also on a Windows console or pipe (cp1252)
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, ValueError):
            pass
    if importlib.util.find_spec('PyInstaller') is None:
        raise SystemExit('Χρειάζεται το PyInstaller: pip install -r requirements.txt pyinstaller')
    out = Path(a.out).resolve()
    work = ROOT / 'build' / 'pyinstaller'
    if a.pyodide and not (ROOT / 'web' / 'vendor' / 'pyodide' / 'pyodide.js').exists():
        subprocess.run([sys.executable, str(ROOT / 'tools' / 'get_pyodide.py')], check=True)
    staged = stage(ROOT, work / 'stage', pyodide=a.pyodide or (ROOT / 'web' / 'vendor' / 'pyodide').exists())
    t0 = time.perf_counter()
    subprocess.run(pyinstaller_cmd(ROOT, staged, out, work), check=True, cwd=ROOT)
    built = time.perf_counter() - t0
    collect_licenses(ROOT, out / NAME / 'LICENSES', pyodide=(staged / 'web' / 'vendor').exists())
    exe = program(out)
    size, n = folder_size(out / NAME)
    ver, tag = version(), system_tag()
    print(f'{exe}: {size / 1e6:.1f} MB σε {n} αρχεία, σε {built:.0f} s ({tag}, {ver}).')
    if a.zip:
        z = make_zip(out, ver, tag)
        print(f'{z}: {z.stat().st_size / 1e6:.1f} MB.')
    if a.smoke:
        r = smoke([str(exe)])
        print('Δοκιμή: ' + json.dumps(r, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
