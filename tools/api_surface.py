"""The public API of the app, written down so that a change that breaks it cannot go unnoticed (3.18, a base for 4.0).

    python tools/api_surface.py                          # rewrite docs/API.md and tools/api_surface.json
    python tools/api_surface.py --allow-removal "why"    # the same, when something was removed or lost a parameter
    python tools/api_surface.py --check                  # exit 1 if the API changed and the files were not rewritten (CI)

Seven surfaces, read from the code itself (never typed by hand):
  pcl       the Python package: pcl.* and the public methods of its classes, with their parameter names,
  cli       python -m pcl <command> and its options,
  server    the actions of /api/<action> and the routes of run.py,
  link      the methods of the add-on API and of the link (Python pcl.link, MATLAB PclApp), with their permission,
  matlab    the functions of matlab/*.m and the methods of PclApp, with their arguments,
  scenario  the requests of web/studio/scenario.js (Node, Worker, pcl/runner.js),
  project   the project file: part types, their parameters and their pins (a saved circuit names them).

Rule (proposal for 4.0, docs/API.md): from 4.0 nothing of the stable surface is removed or renamed and no parameter is
taken away within 4.x; what will go is marked deprecated, keeps working and goes in 5.0. Before 4.0 the surface is
provisional: a removal needs --allow-removal with a reason, and it is listed in docs/API.md.
"""
import argparse
import inspect
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from engine import __version__  # noqa: E402

SNAP = ROOT / 'tools' / 'api_surface.json'
OUT = ROOT / 'docs' / 'API.md'
STABLE_FROM = '4.0'           # the major version from which the surface is stable
GROUPS = {
    'pcl': 'Πακέτο Python `pcl`',
    'cli': 'Γραμμή εντολών `python -m pcl`',
    'server': 'Server: `/api/<ενέργεια>` και διαδρομές',
    'link': 'API πρόσθετων και σύνδεσης (`addons.js` M, `pcl.link.App`, `PclApp`)',
    'matlab': 'MATLAB / Octave (`matlab/`)',
    'scenario': 'Αιτήματα σεναρίων (`web/studio/scenario.js`)',
    'project': 'Αρχείο project: στοιχεία, παράμετροι, ακροδέκτες',
}


def vkey(v):
    return tuple(int(x) for x in re.findall(r'\d+', v)[:2])


# ------------------------------------------------------------------------------------------------------------- reading
def sig(obj):
    try:
        ps = inspect.signature(obj).parameters.values()
    except (TypeError, ValueError):
        return []
    out = []
    for p in ps:
        if p.name in ('self', 'cls'):
            continue
        out.append(('*' if p.kind == p.VAR_POSITIONAL else '**' if p.kind == p.VAR_KEYWORD else '') + p.name)
    return out


def surface_pcl():
    import pcl
    import pcl.control
    import pcl.formats
    import pcl.impulse
    import pcl.link
    import pcl.plotting
    import pcl.workbench
    out = {}
    for name in pcl.__all__:
        obj = getattr(pcl, name)
        if inspect.isclass(obj):
            out['pcl.' + name] = {'params': sig(obj)}
            for m, f in inspect.getmembers(obj):
                if m.startswith('_') or not (inspect.isfunction(f) or isinstance(inspect.getattr_static(obj, m, None), property)):
                    continue
                out[f'pcl.{name}.{m}'] = {'params': sig(f) if inspect.isfunction(f) else ['(property)']}
        elif callable(obj):
            out['pcl.' + name] = {'params': sig(obj)}
    for mod in (pcl.link, pcl.control, pcl.workbench, pcl.plotting, pcl.formats, pcl.impulse):
        short = mod.__name__
        for name, obj in vars(mod).items():
            if name.startswith('_') or getattr(obj, '__module__', None) != mod.__name__ or not (inspect.isfunction(obj) or inspect.isclass(obj)):
                continue
            out[f'{short}.{name}'] = {'params': sig(obj)}
            if inspect.isclass(obj):
                for m, f in vars(obj).items():
                    if not m.startswith('_') and inspect.isfunction(f):
                        out[f'{short}.{name}.{m}'] = {'params': sig(f)}
    return out


def surface_cli():
    import pcl.__main__ as cli
    box = {}

    class Stop(Exception):
        pass

    orig = argparse.ArgumentParser.parse_args

    def grab(self, *a, **k):
        box['p'] = self
        raise Stop

    argparse.ArgumentParser.parse_args = grab
    try:
        cli.main(['tutorials'])
    except Stop:
        pass
    finally:
        argparse.ArgumentParser.parse_args = orig
    out = {}
    subs = [a for a in box['p']._actions if isinstance(a, argparse._SubParsersAction)][0]
    for name, sp in subs.choices.items():
        opts = []
        for a in sp._actions:
            if isinstance(a, argparse._HelpAction):
                continue
            opts.append(max(a.option_strings, key=len) if a.option_strings else '<' + a.dest + '>')
        out['python -m pcl ' + name] = {'params': opts}
    return out


def surface_server():
    import run
    out = {f'/api/{k}': {'params': []} for k in run.ACTIONS}
    src = (ROOT / 'run.py').read_text(encoding='utf-8')
    for m in sorted(set(re.findall(r"'/api/(link/[a-z]+|addons|catalog|health|presets)'", src))):
        out['/api/' + m] = {'params': []}
    for m in sorted(set(re.findall(r"action[=!]=\s*'(link/[a-z]+|addon_[a-z]+)'|'(link/[a-z]+|addon_[a-z]+)'", src))):
        for g in m:
            if g:
                out['/api/' + g] = {'params': []}
    return out


def surface_link():
    src = (ROOT / 'web' / 'studio' / 'addons.js').read_text(encoding='utf-8')
    block = src[src.index(' const M={'):src.index(' A.call=')]
    names = re.findall(r"^  (?:'([\w.]+)'|(\w+)):", block, flags=re.M)
    perm_src = src[src.index(' const PERM={'):src.index('};', src.index(' const PERM={'))]
    perm = dict(re.findall(r"'?([\w.]+)'?:'([\w.]+)'", perm_src))
    out = {}
    for a, b in names:
        n = a or b
        out['M.' + n] = {'params': [], 'perm': perm.get(n, '')}
    return out


def surface_matlab():
    out = {}
    for f in sorted((ROOT / 'matlab').glob('*.m')):
        txt = f.read_text(encoding='utf-8', errors='replace')
        m = re.search(r'^\s*function\s+(?:\[?[\w,\s]*\]?\s*=\s*)?(\w+)\s*\(([^)]*)\)', txt, flags=re.M)
        if f.stem == 'PclApp':
            for mm in re.finditer(r'^\s+function\s+(?:\[?[\w,\s]*\]?\s*=\s*)?(\w+)\s*\(([^)]*)\)', txt, flags=re.M):
                if mm.group(1) in ('columns', 'cs'):         # private helpers of the class
                    continue
                args = [a.strip() for a in mm.group(2).split(',') if a.strip() and a.strip() != 'obj']
                out['PclApp.' + mm.group(1)] = {'params': args}
        elif m and not f.stem.startswith('example'):
            out[m.group(1)] = {'params': [a.strip() for a in m.group(2).split(',') if a.strip()]}
    return out


def surface_scenario():
    src = (ROOT / 'web' / 'studio' / 'scenario.js').read_text(encoding='utf-8')
    return {f'action:{a}': {'params': []} for a in sorted(set(re.findall(r"q\.action==='(\w+)'", src)))}


def surface_project():
    js = r"""
const W=process.argv[1];global.window=globalThis;global.Expr=require(W+'/expr.js');const P=require(W+'/parts.js');const out={};
for(const [t,d] of Object.entries(P.PARTS)){const pins=new Set(),base=P.defaults(t),add=q=>{for(const k of Object.keys(P.pinsOf({type:t,params:q})))pins.add(k);};
 add(base);for(const p of d.params)if(p.type==='select')for(const [v] of p.options)add({...base,[p.k]:v});
 out['part:'+t]={params:d.params.map(p=>p.k),pins:[...pins].sort()};}
process.stdout.write(JSON.stringify(out));"""
    r = subprocess.run(['node', '-e', js, str(ROOT / 'web' / 'studio')], capture_output=True, text=True, timeout=60)
    if r.returncode:
        raise SystemExit(r.stderr)
    out = json.loads(r.stdout)
    # the fields of the file itself (docs/ARCHITECTURE.md §2): new fields are optional, an old file always opens
    out['file'] = {'params': ['version', 'components', 'wires', 'subcircuits', 'solve', 'sim', 'scope', 'meta', 'tutorial']}
    out['file.component'] = {'params': ['id', 'type', 'x', 'y', 'rot', 'flip', 'label', 'params', 'live', 'liveBase']}
    out['file.wire'] = {'params': ['id', 'a', 'b', 'pts', 'name', 'link', 'color', 'width']}
    out['file.subcircuit'] = {'params': ['title', 'desc', 'version', 'components', 'wires', 'params']}
    return out


def current():
    return {'pcl': surface_pcl(), 'cli': surface_cli(), 'server': surface_server(), 'link': surface_link(),
            'matlab': surface_matlab(), 'scenario': surface_scenario(), 'project': surface_project()}


# ------------------------------------------------------------------------------------------------------------- comparing
def compare(old, new):
    """(added, broken): broken = an entry that is gone, or lost one of its parameters (adding is never breaking)."""
    added, broken = [], []
    for g, entries in old.get('groups', {}).items():
        for k, e in entries.items():
            n = new.get(g, {}).get(k)
            if n is None:
                broken.append((g, k, 'λείπει'))
                continue
            gone = [p for p in e.get('params', []) if p not in n.get('params', []) and not p.startswith('*')]
            if gone:
                broken.append((g, k, 'χωρίς ' + ', '.join(gone)))
    for g, entries in new.items():
        for k in entries:
            if k not in old.get('groups', {}).get(g, {}):
                added.append((g, k))
    return added, broken


def merged(old, new, version, removal_reason=None, broken=()):
    groups = {}
    for g, entries in new.items():
        groups[g] = {}
        for k, e in sorted(entries.items()):
            since = old.get('groups', {}).get(g, {}).get(k, {}).get('since', version)
            groups[g][k] = {**e, 'since': since}
    removed = list(old.get('removed', []))
    for g, k, why in broken:
        removed.append({'group': g, 'key': k, 'what': why, 'version': version, 'reason': removal_reason or ''})
    return {'version': version, 'stable_from': STABLE_FROM, 'groups': groups, 'removed': removed}


# ------------------------------------------------------------------------------------------------------------- report
def report(snap):
    n = sum(len(v) for v in snap['groups'].values())
    out = [
        '# Δημόσιο API',
        '',
        f'Έκδοση {snap["version"]}: **προσωρινό**. Γίνεται σταθερό από την {snap["stable_from"]}. Παράγεται με `python tools/api_surface.py` από τον ίδιο τον κώδικα '
        f'({n} σημεία σε {len(snap["groups"])} επιφάνειες), και ο CI ελέγχει ότι είναι ενημερωμένο (`--check`).',
        '',
        '## Κανόνας για αλλαγές που σπάνε (πρόταση για την 4.0)',
        '',
        '- **Τι είναι δημόσιο:** ό,τι είναι σε αυτόν τον κατάλογο: το πακέτο `pcl`, η γραμμή εντολών, οι ενέργειες του server, οι μέθοδοι των πρόσθετων και της σύνδεσης, '
        'οι συναρτήσεις MATLAB/Octave, τα αιτήματα σεναρίων και η μορφή του αρχείου project (τύποι στοιχείων, παράμετροι, ακροδέκτες). Ό,τι ξεκινά με `_` και ό,τι δεν είναι εδώ είναι εσωτερικό.',
        '- **Μέσα σε μία κύρια έκδοση (4.x) μόνο προσθήκες:** νέες μέθοδοι, νέα προαιρετικά ορίσματα, νέα στοιχεία και νέες παράμετροι με προεπιλογή που κρατά την παλιά συμπεριφορά. '
        'Καμία αφαίρεση, μετονομασία ή αλλαγή σημασίας.',
        '- **Αφαίρεση σε δύο βήματα:** ό,τι πρόκειται να φύγει γίνεται «παρωχημένο» σε μια 4.x (με μήνυμα και την εναλλακτική), δουλεύει ως το τέλος της 4.x και φεύγει στην 5.0.',
        '- **Αρχεία project:** ένα παλιό αρχείο ανοίγει πάντα (ARCHITECTURE §4). Νέα πεδία είναι προαιρετικά. Όταν χρειάζεται μετατροπή, αυξάνεται το `version` του αρχείου '
        'και η μετατροπή γίνεται στο άνοιγμα, με test.',
        f'- **Ο έλεγχος:** το `python tools/api_surface.py` σταματά όταν κάτι λείπει ή έχασε όρισμα. Πριν από την {snap["stable_from"]} περνά μόνο με '
        '`--allow-removal "λόγος"`, και η αφαίρεση γράφεται παρακάτω. Από την 4.0 η αφαίρεση σημείου της ίδιας κύριας έκδοσης δεν περνά.',
        '',
        'Στους πίνακες, «Από» είναι η έκδοση της πρώτης καταγραφής: η 3.18 για ό,τι υπήρχε ήδη.',
        '',
    ]
    if snap['removed']:
        out += ['## Αφαιρέσεις και αλλαγές που σπάνε', '', '| Έκδοση | Επιφάνεια | Σημείο | Τι | Λόγος |', '|---|---|---|---|---|']
        out += [f'| {r["version"]} | {r["group"]} | `{r["key"]}` | {r["what"]} | {r["reason"]} |' for r in snap['removed']]
        out += ['']
    for g, title in GROUPS.items():
        entries = snap['groups'].get(g, {})
        out += [f'## {title}', '', f'{len(entries)} σημεία.', '']
        if g == 'project':
            out += ['| Σημείο | Παράμετροι / πεδία | Ακροδέκτες | Από |', '|---|---|---|---|']
            out += [f'| `{k}` | {", ".join(e["params"]) or "—"} | {", ".join(e.get("pins", [])) or "—"} | {e["since"]} |' for k, e in entries.items()]
        elif g == 'link':
            out += ['| Μέθοδος | Άδεια | Από |', '|---|---|---|']
            out += [f'| `{k[2:]}` | {e.get("perm") or "—"} | {e["since"]} |' for k, e in entries.items()]
        else:
            out += ['| Σημείο | Ορίσματα | Από |', '|---|---|---|']
            out += [f'| `{k}` | {", ".join(f"`{p}`" for p in e["params"]) or "—"} | {e["since"]} |' for k, e in entries.items()]
        out += ['']
    return '\n'.join(out)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--allow-removal', metavar='ΛΟΓΟΣ')
    a = ap.parse_args(argv)
    old = json.loads(SNAP.read_text(encoding='utf-8')) if SNAP.exists() else {'groups': {}, 'removed': []}
    new = current()
    added, broken = compare(old, new)
    if a.check:
        snap = merged(old, new, old.get('version', __version__))
        bad = []
        if broken:
            bad.append('Λείπουν ή έχασαν όρισμα: ' + '; '.join(f'{g} {k} ({w})' for g, k, w in broken))
        if added:
            bad.append('Νέα σημεία που δεν έχουν γραφτεί: ' + ', '.join(f'{g} {k}' for g, k in added[:20]))
        if old.get('version') != __version__ and not added and not broken:
            pass            # a new version with the same API: nothing to write
        if not bad and OUT.exists() and OUT.read_text(encoding='utf-8') != report(snap):
            bad.append('Το docs/API.md δεν είναι ενημερωμένο.')
        if bad:
            print('\n'.join(bad) + '\nΤρέξε: python tools/api_surface.py (και --allow-removal "λόγος" για αφαίρεση).')
            return 1
        print(f'API: {sum(len(v) for v in new.values())} σημεία, ενημερωμένο.')
        return 0
    if broken:
        if not a.allow_removal:
            print('Αλλαγή που σπάει το API:\n' + '\n'.join(f'  {g}: {k} ({w})' for g, k, w in broken) +
                  '\nΑν είναι σκόπιμη: python tools/api_surface.py --allow-removal "λόγος".')
            return 1
        if vkey(__version__) >= vkey(STABLE_FROM):
            same = [b for b in broken if vkey(old['groups'][b[0]][b[1]]['since'])[0] == vkey(__version__)[0] or vkey(old.get('version', '0'))[0] == vkey(__version__)[0]]
            if same:
                print('Μέσα στην ίδια κύρια έκδοση δεν αφαιρείται τίποτα: σημείωσέ το παρωχημένο και αφαίρεσέ το στην επόμενη κύρια έκδοση.')
                return 1
    snap = merged(old, new, __version__, a.allow_removal, broken)
    SNAP.write_text(json.dumps(snap, ensure_ascii=False, indent=1, sort_keys=False) + '\n', encoding='utf-8')
    OUT.write_text(report(snap), encoding='utf-8')
    print(f'API: {sum(len(v) for v in new.values())} σημεία, {len(added)} νέα, {len(broken)} αφαιρέσεις. {OUT.relative_to(ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
