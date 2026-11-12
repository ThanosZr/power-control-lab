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

Rule (approved 10/11/2026, docs/API.md, active from 4.0): nothing of the stable surface is removed or renamed and no
parameter is taken away within 4.x, not even with --allow-removal; what will go is listed in DEPRECATED below in a 4.x,
keeps working and goes in 5.0, where only what was deprecated may go (with --allow-removal). Before 4.0 the surface was
provisional: a removal needed --allow-removal with a reason, and it is listed in docs/API.md. Experimental points are
listed but stay out of the rule.
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
# 3.19 (question 1 of 3.18): what stays out of the rule of 4.x. AI control (§38, stages 3–4 to come) and the Control
# Workbench (§19) still change; they are listed but marked experimental, and a change there needs no --allow-removal.
# When they settle they become stable, which is an addition. Prefixes of keys per surface.
EXPERIMENTAL = {'pcl': ('pcl.control.', 'pcl.workbench.'), 'cli': ('workbench',)}
# 4.0: the first of the two steps of a removal. {surface: {key: (version, what instead)}}: the point keeps working (with a
# message where it runs) to the end of its major version and may go in the next one. A point that is gone leaves this list.
DEPRECATED = {}


def experimental(g, k):
    return any(k.startswith(p) for p in EXPERIMENTAL.get(g, ()))


def deprecated(g, k, deps=None):
    return (DEPRECATED if deps is None else deps).get(g, {}).get(k)
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
    import pcl.lineconst
    import pcl.link
    import pcl.network
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
    for mod in (pcl.link, pcl.control, pcl.workbench, pcl.plotting, pcl.formats, pcl.impulse, pcl.network, pcl.lineconst):
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
    for m in sorted(set(re.findall(r"action[=!]=\s*'(link/[a-z]+|addon_[a-z]+|record)'|'(link/[a-z]+|addon_[a-z]+)'", src))):
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
    out['file'] = {'params': ['version', 'components', 'wires', 'subcircuits', 'solve', 'sim', 'scope', 'meta', 'tutorial', 'program', 'watch']}
    out['file.sim'] = {'params': ['hDiv', 'speed', 'stopT', 'method', 'rec']}                       # rec: {dt} (4.8)
    out['file.watch'] = {'params': ['show', 'tiles', 'panel']}                                      # 4.8, ROADMAP §47
    out['file.watch.tile'] = {'params': ['id', 'key', 'ctl', 'label', 'at', 'al', 'rng', 'steps', 'span']}
    out['file.component'] = {'params': ['id', 'type', 'x', 'y', 'rot', 'flip', 'label', 'params', 'live', 'liveBase', 'liveRate']}
    # 3.19: the program of parameter changes and the options of the solution that it adds
    out['file.program'] = {'params': ['t', 'id', 'k', 'v', 'rate']}
    out['file.solve'] = {'params': ['unconn', 'island', 'rleak', 'tbase', 'step', 'rtol', 'hmax', 'units']}
    out['file.wire'] = {'params': ['id', 'a', 'b', 'pts', 'name', 'color', 'width']}
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
    deps = {g: {k: {'since': v[0], 'instead': v[1]} for k, v in d.items()} for g, d in DEPRECATED.items() if d}
    return {'version': version, 'stable_from': STABLE_FROM, 'experimental': {g: list(v) for g, v in EXPERIMENTAL.items()},
            'deprecated': deps, 'groups': groups, 'removed': removed}


def verdict(old, broken, version, reason=None):
    """None when the removals in `broken` may be written, else why not (the rule of docs/API.md).

    old: the committed snapshot (its version and its deprecated points), version: the version being written."""
    real = [b for b in broken if not experimental(b[0], b[1])]
    if not real:
        return None                                     # experimental points change freely (listed in the removals)
    lst = '\n'.join(f'  {g}: {k} ({w})' for g, k, w in real)
    if not reason:
        return f'Αλλαγή που σπάει το API:\n{lst}\nΑν είναι σκόπιμη: python tools/api_surface.py --allow-removal "λόγος".'
    was = old.get('version', '0')
    if vkey(was) < vkey(STABLE_FROM):
        return None                                     # the surface was still provisional (up to the change to STABLE_FROM)
    major, before = vkey(version)[0], vkey(was)[0]
    if major <= before:
        return (f'Μέσα στην {before}.x δεν αφαιρείται τίποτα, ούτε με --allow-removal:\n{lst}\n'
                f'Βάλ\' το στο DEPRECATED του tools/api_surface.py (δουλεύει ως το τέλος της {before}.x) και αφαίρεσέ το στην {before + 1}.0.')
    deps = old.get('deprecated', {})
    left = [b for b in real if b[1] not in deps.get(b[0], {})]
    if left:
        return ('Στην ' + version + ' φεύγει μόνο ό,τι ήταν παρωχημένο στην ' + f'{before}.x:\n' +
                '\n'.join(f'  {g}: {k} ({w})' for g, k, w in left) + '\nΣημείωσέ το παρωχημένο σε μια ' + f'{major}.x και αφαίρεσέ το στην {major + 1}.0.')
    return None


def stale_deprecations(new):
    """Deprecated points that are no longer in the code: a deprecated point keeps working until it goes."""
    return [(g, k) for g, d in DEPRECATED.items() for k in d if k not in new.get(g, {})]


# ------------------------------------------------------------------------------------------------------------- report
def report(snap):
    n = sum(len(v) for v in snap['groups'].values())
    stable = vkey(snap['version']) >= vkey(snap['stable_from'])
    state = (f'**σταθερό** από την {snap["stable_from"]}: ο κανόνας παρακάτω ισχύει' if stable else
             f'**προσωρινό**. Γίνεται σταθερό από την {snap["stable_from"]}')
    deps = snap.get('deprecated', {})
    out = [
        '# Δημόσιο API',
        '',
        f'Έκδοση {snap["version"]}: {state}. Παράγεται με `python tools/api_surface.py` από τον ίδιο τον κώδικα '
        f'({n} σημεία σε {len(snap["groups"])} επιφάνειες), και ο CI ελέγχει ότι είναι ενημερωμένο (`--check`).',
        '',
        '## Κανόνας για αλλαγές που σπάνε (εγκρίθηκε 10/11/2026, ισχύει από την 4.0)',
        '',
        '- **Τι είναι δημόσιο:** ό,τι είναι σε αυτόν τον κατάλογο: το πακέτο `pcl`, η γραμμή εντολών, οι ενέργειες του server, οι μέθοδοι των πρόσθετων και της σύνδεσης, '
        'οι συναρτήσεις MATLAB/Octave, τα αιτήματα σεναρίων και η μορφή του αρχείου project (τύποι στοιχείων, παράμετροι, ακροδέκτες). Ό,τι ξεκινά με `_` και ό,τι δεν είναι εδώ είναι εσωτερικό.',
        '- **Μέσα σε μία κύρια έκδοση (4.x) μόνο προσθήκες:** νέες μέθοδοι, νέα προαιρετικά ορίσματα, νέα στοιχεία και νέες παράμετροι με προεπιλογή που κρατά την παλιά συμπεριφορά. '
        'Καμία αφαίρεση, μετονομασία ή αλλαγή σημασίας.',
        '- **Αφαίρεση σε δύο βήματα:** ό,τι πρόκειται να φύγει γίνεται «παρωχημένο» σε μια 4.x (στη λίστα `DEPRECATED` του `tools/api_surface.py`, με την εναλλακτική, '
        'και με μήνυμα όπου τρέχει), δουλεύει ως το τέλος της 4.x και φεύγει στην 5.0. Στην 5.0 φεύγει μόνο ό,τι ήταν παρωχημένο.',
        '- **Αρχεία project:** ένα παλιό αρχείο ανοίγει πάντα (ARCHITECTURE §4). Νέα πεδία είναι προαιρετικά. Όταν χρειάζεται μετατροπή, αυξάνεται το `version` του αρχείου '
        'και η μετατροπή γίνεται στο άνοιγμα, με test. Το `version` 3 (3.18): τα σύρματα με το ίδιο όνομα είναι ένας κόμβος· ένα παλιότερο αρχείο ανοίγει ίδιο '
        '(`Bus.migrateNames`: όπου ένα όνομα ήταν ετικέτα σε δύο κόμβους, το δεύτερο γίνεται «όνομα·2»).',
        f'- **Ο έλεγχος:** το `python tools/api_surface.py` σταματά όταν κάτι λείπει ή έχασε όρισμα. Ως την {snap["stable_from"]} περνούσε με '
        '`--allow-removal "λόγος"`, και η αφαίρεση γράφεται παρακάτω. Από την 4.0 μέσα στην ίδια κύρια έκδοση δεν περνά ούτε με `--allow-removal`· '
        'στην επόμενη κύρια περνά μόνο για ό,τι ήταν παρωχημένο. Ένα παρωχημένο σημείο πρέπει να υπάρχει ακόμη στον κώδικα.',
        '',
        '- **Πειραματικά (3.19):** ' + ', '.join(f'`{p}…`' for v in EXPERIMENTAL.values() for p in v) + ' (έλεγχος με AI §38, Control Workbench §19). '
        'Καταγράφονται, αλλά μένουν έξω από τον κανόνα: αλλάζουν χωρίς `--allow-removal` (η αλλαγή γράφεται στις αφαιρέσεις). '
        'Γίνονται σταθερά όταν κλείσει το στάδιο 4 του §38, και η μετάβαση είναι προσθήκη. Στους πίνακες: «πειρ.».',
        '',
        'Στους πίνακες, «Από» είναι η έκδοση της πρώτης καταγραφής: η 3.18 για ό,τι υπήρχε ήδη.',
        '',
        '## Παρωχημένα',
        '',
    ]
    if any(deps.values()):
        out += ['| Επιφάνεια | Σημείο | Από | Αντί γι\' αυτό |', '|---|---|---|---|']
        out += [f'| {g} | `{k}` | {v["since"]} | {v["instead"]} |' for g, d in deps.items() for k, v in d.items()]
    else:
        out += [f'Κανένα στην {snap["version"]}.']
    out += [
        '',
        '## Σημεία επέκτασης (3.19, 4.0): πώς μεγαλώνουν στην 4.x χωρίς να σπάσει τίποτα',
        '',
        '| Τι | Σήμερα | Επέκταση με προσθήκες |',
        '|---|---|---|',
        '| Μονάδες και τύποι θυρών (`units.js`, `project.solve.units`) | V, A, rad, rad/s, N·m, V·s, 1 και ό,τι γράφει ο χρήστης· σύγκριση με δυνάμεις (Wb = V·s)· '
        'γινόμενο και διαίρεση πολλαπλασιάζουν μονάδες, κέρδος «·Ω»/«/V» (4.0)· πλαίσια abc, αβ, dq· `warn`, `strict`, `off` | '
        'νέες μονάδες και πλαίσια είναι νέες λέξεις· κάθε νέο στοιχείο δηλώνει τις δικές του θύρες· ένα στοιχείο χωρίς δήλωση μένει «χωρίς τύπο», '
        'άρα ένα παλιό αρχείο δεν παίρνει νέο σφάλμα από στοιχείο που ήδη είχε· μονάδα σε PI ή μπλοκ κώδικα μόνο με νέα παράμετρο που εξ ορισμού είναι κενή |',
        '| Πρόγραμμα αλλαγών παραμέτρων (`project.program`) | `{t, id, k, v, rate}` στα στοιχεία του κυρίως κυκλώματος (και στις δημόσιες παραμέτρους υποκυκλωμάτων) | '
        'νέα προαιρετικά πεδία (π.χ. διαδρομή `X1/L1`, σχήμα ράμπας)· ένα πεδίο που δεν αναγνωρίζεται αγνοείται |',
        '| Αρχείο συμβάντων (`Sim.events`, `Result.events`, `events` στον server) | είδη switch, diode, scr, gap, cmp, latch, edge, sample, duty, jump, live, program | '
        'νέα είδη και νέα πεδία ανά συμβάν· τα υπάρχοντα δεν αλλάζουν σημασία |',
        '| Ζωντανές και δομικές παράμετροι (`Parts.structural`) | δομική = αλλάζει τους ακροδέκτες, ή είναι στη λίστα `STRUCT` (π.χ. φέρον PWM) | '
        'η λίστα μεγαλώνει με νέα στοιχεία· μια παράμετρος δεν γίνεται δομική από ζωντανή μέσα στην 4.x |',
        '| Ονόματα συρμάτων και Goto/From | τοπικά στο instance, «/όνομα» για το κυρίως κύκλωμα | νέα προθέματα (π.χ. του γονικού instance) ως νέα σύνταξη |',
        '| Αναφορές από μέσα προς τα έξω | δουλεύουν (πρώτα μέσα, μετά έξω)· λίστα στον ορισμό, μετατροπή σε θύρα ή δημόσια | — (καμία αλλαγή σημασίας) |',
        '| Μπλοκ B1 | F2 (lp, hp, bp, notch), RLIM, RT (zoh, delay), EDGE (rise, fall, both) | νέες επιλογές στις ίδιες παραμέτρους (π.χ. all-pass) |',
        '| Λύτης SciPy, συνεχή μπλοκ | T/200, ή T/1000 με πηγές από σήμα· πεδίο `cont_div` | — |',
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
            out += [f'| `{k}` | {", ".join(f"`{p}`" for p in e["params"]) or "—"} | {e["since"]}{" · πειρ." if experimental(g, k) else ""}'
                    f'{" · παρωχ. " + deps[g][k]["since"] if k in deps.get(g, {}) else ""} |' for k, e in entries.items()]
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
    stale = stale_deprecations(new)
    if stale:
        print('Παρωχημένα που δεν υπάρχουν πια στον κώδικα (βγάλ\' τα από το DEPRECATED): ' + ', '.join(f'{g} {k}' for g, k in stale))
        return 1
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
    if broken and not a.allow_removal and all(experimental(g, k) for g, k, _ in broken):
        a.allow_removal = 'πειραματικό σημείο'
    why = verdict(old, broken, __version__, a.allow_removal)
    if why:
        print(why)
        return 1
    snap = merged(old, new, __version__, a.allow_removal, broken)
    SNAP.write_text(json.dumps(snap, ensure_ascii=False, indent=1, sort_keys=False) + '\n', encoding='utf-8')
    OUT.write_text(report(snap), encoding='utf-8')
    print(f'API: {sum(len(v) for v in new.values())} σημεία, {len(added)} νέα, {len(broken)} αφαιρέσεις. {OUT.relative_to(ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
