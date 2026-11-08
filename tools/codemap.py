"""Generate docs/CODEMAP.md: an index of the code (files, functions, classes, parts, tutorials, API actions)
with line numbers, so that a change starts from the few places it touches instead of a full read.

    python tools/codemap.py            # rewrite docs/CODEMAP.md
    python tools/codemap.py --check    # exit 1 if docs/CODEMAP.md is out of date (used by CI)

The hand-written guide (what each module does, data flow, "where to change for X") is docs/ARCHITECTURE.md.
"""
import ast
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'CODEMAP.md'
JS_DIR = ROOT / 'web' / 'studio'
PY_FILES = ['run.py', *sorted(str(p.relative_to(ROOT)) for p in (ROOT / 'engine').glob('*.py'))]
SKIP = {'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'else', 'do', 'try', 'with', 'new', 'typeof'}

FUNC = re.compile(r'function\s+([A-Za-z_$][\w$]*)\s*\(')
METHOD = re.compile(r'^ {1,3}(?:static\s+|async\s+)?([A-Za-z_$][\w$]*)\s*\(([^()]*)\)\s*\{')
ARROW = re.compile(r'^\s*(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\([^()]*\)|[A-Za-z_$][\w$]*)\s*=>')
CLASS = re.compile(r'^\s*class\s+([A-Za-z_$][\w$]*)')
PART = re.compile(r"^\s{2}([A-Z][A-Z0-9]*):\{name:'([^']+)'")
TUTORIAL = re.compile(r"T\.push\(\{id:'(\w+)',group:'([^']*)',title:'([^']+)'")


def js_symbols(path):
    rows = []
    for n, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        m = CLASS.match(line)
        if m:
            rows.append((n, 'class', m.group(1)))
        for m in FUNC.finditer(line):
            rows.append((n, 'function', m.group(1)))
        m = METHOD.match(line)
        if m and m.group(1) not in SKIP:
            rows.append((n, 'method', m.group(1)))
        m = ARROW.match(line)
        if m:
            rows.append((n, 'const fn', m.group(1)))
    seen, out = set(), []
    for r in rows:                      # one entry per (line, name)
        if (r[0], r[2]) not in seen:
            seen.add((r[0], r[2]))
            out.append(r)
    return out


def py_symbols(path):
    tree = ast.parse(path.read_text(encoding='utf-8'))
    out = []
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            out.append((node.lineno, 'class', node.name))
            for sub in node.body:
                if isinstance(sub, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    out.append((sub.lineno, 'method', f'{node.name}.{sub.name}'))
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            out.append((node.lineno, 'function', node.name))
    return out


def table(rows):
    if not rows:
        return '_(χωρίς συναρτήσεις)_\n'
    s = '| Γραμμή | Είδος | Όνομα |\n|---:|---|---|\n'
    return s + ''.join(f'| {n} | {k} | `{name}` |\n' for n, k, name in rows)


def build():
    parts = ['# Χάρτης κώδικα (παράγεται αυτόματα)\n',
             'Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).',
             'Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).\n']
    lines = lambda p: len(p.read_text(encoding='utf-8').splitlines())
    # overview
    parts.append('## Αρχεία\n')
    parts.append('| Αρχείο | Γραμμές |\n|---|---:|')
    js = sorted(JS_DIR.glob('*.js'))
    for p in js:
        parts.append(f'| `{p.relative_to(ROOT).as_posix()}` | {lines(p)} |')
    for f in PY_FILES:
        parts.append(f'| `{f}` | {lines(ROOT / f)} |')
    tests = sorted((ROOT / 'tests').glob('test_*.py')) + sorted((ROOT / 'tests').glob('*/*.js'))
    for p in tests:
        parts.append(f'| `{p.relative_to(ROOT).as_posix()}` | {lines(p)} |')
    parts.append('')
    # catalogs
    src = (JS_DIR / 'parts.js').read_text(encoding='utf-8').splitlines()
    parts.append('## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)\n')
    parts.append('| Γραμμή | Τύπος | Όνομα |\n|---:|---|---|')
    for n, line in enumerate(src, 1):
        m = PART.match(line)
        if m:
            parts.append(f'| {n} | `{m.group(1)}` | {m.group(2)} |')
    parts.append('')
    src = (JS_DIR / 'tutorials.js').read_text(encoding='utf-8').splitlines()
    parts.append('## Tutorials (`web/studio/tutorials.js`)\n')
    parts.append('| Γραμμή | id | Ομάδα | Τίτλος |\n|---:|---|---|---|')
    for n, line in enumerate(src, 1):
        m = TUTORIAL.search(line)
        if m:
            parts.append(f'| {n} | `{m.group(1)}` | {m.group(2)} | {m.group(3)} |')
    parts.append('')
    run = (ROOT / 'run.py').read_text(encoding='utf-8')
    acts = sorted(set(re.findall(r"ACTIONS\[['\"](\w+)['\"]\]", run)) | set(re.findall(r"['\"](\w+)['\"]\s*:\s*\w+", run.split('ACTIONS=', 1)[1].split('}', 1)[0])))
    parts.append('## API του server (`run.py`, `/api/<action>`)\n')
    parts.append(', '.join(f'`{a}`' for a in acts) + '\n')
    tpl = sorted(p.name for p in (JS_DIR / 'exercises').glob('*.template.json'))
    parts.append('## Templates δεδομένων (`web/studio/exercises/`)\n')
    parts.append(', '.join(f'`{t}`' for t in tpl) + '\n')
    # symbols
    parts.append('## Συναρτήσεις ανά αρχείο\n')
    for p in js:
        parts.append(f'### `{p.relative_to(ROOT).as_posix()}`\n')
        parts.append(table(js_symbols(p)))
    for f in PY_FILES:
        parts.append(f'### `{f}`\n')
        parts.append(table(py_symbols(ROOT / f)))
    return '\n'.join(parts).rstrip() + '\n'


def main():
    text = build()
    if '--check' in sys.argv:
        old = OUT.read_text(encoding='utf-8') if OUT.exists() else ''
        if old != text:
            print('docs/CODEMAP.md δεν είναι ενημερωμένο: τρέξε `python tools/codemap.py`.')
            return 1
        print('docs/CODEMAP.md: ενημερωμένο.')
        return 0
    OUT.write_text(text, encoding='utf-8')
    print(f'Γράφτηκε {OUT.relative_to(ROOT)} ({len(text.splitlines())} γραμμές).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
