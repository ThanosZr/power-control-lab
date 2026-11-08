"""Local copy of Pyodide (Python in the browser) for the Python block, so that it works without internet.

    python tools/get_pyodide.py

Copies the files from node_modules/pyodide if it exists (npm install pyodide@0.26.4), otherwise downloads the
package from the npm registry. They go to web/vendor/pyodide/, which the studio tries before the CDN.
"""
import io
import shutil
import sys
import tarfile
import urllib.request
from pathlib import Path

VERSION = '0.26.4'
ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'web' / 'vendor' / 'pyodide'
FILES = ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    local = ROOT / 'node_modules' / 'pyodide'
    if all((local / f).exists() for f in FILES):
        for f in FILES:
            shutil.copy2(local / f, DEST / f)
        print(f'Αντιγράφηκε από {local.relative_to(ROOT)} στο {DEST.relative_to(ROOT)}.')
        return 0
    url = f'https://registry.npmjs.org/pyodide/-/pyodide-{VERSION}.tgz'
    print(f'Λήψη {url} …')
    data = urllib.request.urlopen(url, timeout=120).read()
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as tar:
        for f in FILES:
            member = tar.getmember('package/' + f)
            (DEST / f).write_bytes(tar.extractfile(member).read())
    print(f'Η Python {VERSION} (Pyodide) είναι στο {DEST.relative_to(ROOT)}.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
