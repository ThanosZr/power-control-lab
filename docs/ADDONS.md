# Πρόσθετα (add-ons) και σύνδεση με προγράμματα Python ή MATLAB

Από την 3.15 (ROADMAP §35, §36). Δύο δρόμοι προς το ίδιο API:

- **Πρόσθετο:** μια σελίδα (HTML και JavaScript) που ανοίγει μέσα στην εφαρμογή, σε απομονωμένο πλαίσιο. Παράδειγμα το ενσωματωμένο «Κρουστικές πηγές: παράμετροι από κώδικα» (`web/addons/impulse-params/`).
- **Σύνδεση:** ένα πρόγραμμα σε αυτόν τον υπολογιστή (Python, MATLAB, ή οποιαδήποτε γλώσσα με HTTP) καλεί τις ίδιες μεθόδους πάνω στο κύκλωμα της οθόνης. Έτσι ένα υπάρχον GUI (π.χ. ένα εργαλείο MATLAB ή το Control Workbench σε Python) μένει όπως είναι και μιλά με την εφαρμογή.

## Οι μέθοδοι

| Μέθοδος | Ορίσματα | Απάντηση | Άδεια |
|---|---|---|---|
| `info` | | εφαρμογή, έκδοση, κύκλωμα, επιλογή, T, t | — |
| `project.get` | | το κύκλωμα (όπως το αρχείο της εφαρμογής) | `project.read` |
| `params` | `id` (προαιρετικό) | `{id: {type, label, params, from}}` | `project.read` |
| `get` | `key` (`R1.R`) | η τιμή | `project.read` |
| `selection` | | τα επιλεγμένα στοιχεία | `project.read` |
| `channels` | | τα κανάλια και η περίοδος T | `project.read` |
| `scope` | `keys` (προαιρετικό) | ό,τι κρατά τώρα το scope: `keys, t, ch, T, now` | `project.read` |
| `values` | `keys` | οι τωρινές τιμές των καναλιών: `{t, values}` (για ζωντανές οπτικοποιήσεις) | `project.read` |
| `set` | `key, value, source` | η νέα τιμή (με αναίρεση στην εφαρμογή) | `project.write` |
| `set_many` | `values {key: τιμή}, source` | | `project.write` |
| `project.load` | `project` | φορτώνει άλλο κύκλωμα | `project.write` |
| `run` | `t_end, channels, measure, hdiv, method, step, waveforms, project` | όπως το `pcl` (`keys, t, ch, measure, meta, diag`) | `run` |
| `batch` | `queries [...]` | `[{out} ή {error}]`, παράλληλα στο pool | `run` |
| `bifurcation` | `comp, param, key, stat, transient, record, values` | `points` | `run` |
| `python` | `code, inputs, files` | η μεταβλητή `result` του κώδικα | `python` |
| `show` | `obj` (`{type: 'table'|'xy'|'text'|'run'|'sweep', …}`) | εμφανίζεται στο πάνελ «Σενάρια» | `show` |
| `notify` | `msg, sev, fix, id` | μήνυμα στην κονσόλα διαγνωστικών | `show` |
| `download` | `name, text` ή `base64, mime` | κατέβασμα αρχείου | `files` |

Οι προσομοιώσεις τρέχουν με τον λύτη της εφαρμογής, στο pool από workers (όχι στη σελίδα), άρα δίνουν ίδιους αριθμούς με την εφαρμογή και με το `pcl`. Ένα κύκλωμα με μπλοκ Python λύνεται στη σελίδα.

Το `source` του `set` (π.χ. `{tool: 'impulse-params'}`) μένει στο στοιχείο (`from`) και φαίνεται στο πάνελ παραμέτρων ως «Από εργαλείο».

## Πρόσθετο: πώς γράφεται

Ένας φάκελος με:

```
my-tool/
  pcl-addon.json
  index.html        η σελίδα (entry)
  ui.js             ο κώδικας της σελίδας (σε αρχείο: η εφαρμογή δεν επιτρέπει scripts μέσα στο HTML)
  tool.py           προαιρετικά, κώδικας Python που καλεί η σελίδα με PCL.python(…, files)
```

`pcl-addon.json`:

```json
{
  "id": "my-tool",
  "name": "Το εργαλείο μου",
  "version": "1.0.0",
  "description": "Τι κάνει, σε μία πρόταση.",
  "entry": "index.html",
  "kind": ["params", "panel"],
  "targets": [{"type": "DCM", "label": "Παράμετροι από δεδομένα πινακίδας"}],
  "permissions": ["project.read", "project.write", "python", "show"]
}
```

- `id`: 2–40 χαρακτήρες a–z, 0–9, «-».
- `targets`: τα είδη στοιχείων για τα οποία το πρόσθετο εμφανίζεται ως κουμπί «⚙» στο πάνελ παραμέτρων. Ανοίγει με `PCL.target` το στοιχείο.
- `permissions`: ό,τι δεν δηλώνεται απορρίπτεται. Ένα πρόσθετο που δεν είναι ενσωματωμένο ζητά επιβεβαίωση την πρώτη φορά, με τις άδειές του.

Στη σελίδα:

```html
<script src="/studio/addon_client.js"></script>
<script src="ui.js"></script>
```

```js
// ui.js
const id = PCL.target;                                   // το στοιχείο από το οποίο άνοιξε
const p = await PCL.params(id);
const r = await PCL.python('from pcl import impulse\nresult = impulse.fit_heidler(T1, T2, Im)', {T1: 1e-6, T2: 200e-6, Im: 1e5});
await PCL.setMany({[id + '.shape']: 'direct', [id + '.tau1']: r.tau1}, {tool: 'my-tool'});
const run = await PCL.run({t_end: 5e-3, measure: [{name: 'Vo', key: 'V:C1', stat: 'avg', periods: 10}]});
PCL.on('selection', ids => …);
```

Η σελίδα τρέχει απομονωμένη (`sandbox`, χωρίς πρόσβαση στη σελίδα της εφαρμογής, στα cookies ή στο `localStorage` της). Μιλά μόνο με μηνύματα, και μόνο μέσα από τις άδειές της.

**Εγκατάσταση:** «Πρόσθετα και σύνδεση» → «Εγκατάσταση από zip…». Ο φάκελος πάει στο `~/.pcl/addons/<id>/` και μένει όταν αλλάζει η έκδοση της εφαρμογής. Τα ενσωματωμένα είναι στο `web/addons/`.

## Σύνδεση: Python

Στην εφαρμογή: «Πρόσθετα και σύνδεση» → «Σύνδεση με εξωτερικά προγράμματα». Ο server γράφει τη διεύθυνση και ένα token στο `~/.pcl/link.json` (μόνο για τον χρήστη).

```python
import pcl
app = pcl.link.connect()
app.info()
app.set('R1.R', 20)                                   # φαίνεται αμέσως στο κύκλωμα
r = app.run(t_end='5m', measure={'Vo': ('V:C1', 'avg', 10)})
app.show(pcl.plot([1, 2, 3], {'y': [1, 4, 9]}), 'από την Python')
app.notify('τελείωσε η βελτιστοποίηση')
p = app.project()                                     # pcl.Project: σαρώσεις και τοπικά τρεξίματα
```

Ένα δικό σου GUI (tkinter, Qt, το Control Workbench) κρατά το `app` και καλεί αυτές τις μεθόδους από τα κουμπιά του.

## Σύνδεση: MATLAB

```matlab
info = pcl_link('info');
pcl_link('set', struct('key', 'R1.R', 'value', 20));
r = pcl_link('run', struct('t_end', 5e-3, 'measure', {{struct('name', 'Vo', 'key', 'V:C1', 'stat', 'avg', 'periods', 10)}}));
pcl_link('set_many', struct('values', containers.Map({'I1.tau1', 'I1.tau2'}, {1.83e-6, 284.8e-6})));   % κλειδιά με τελεία: containers.Map
```

Το `pcl_link` θέλει `webwrite` (MATLAB). Από το Octave χρησιμοποιείς τα `pcl_run`/`pcl_sweep` με τη γραμμή εντολών.

## Σύνδεση: οποιαδήποτε γλώσσα

```
POST http://127.0.0.1:8765/api/link/call
{"token": "<από το ~/.pcl/link.json>", "method": "get", "args": {"key": "R1.R"}, "timeout": 120}
→ {"result": 10}   ή   {"error": "…"}
```

## Ασφάλεια

- Μόνο από αυτόν τον υπολογιστή (127.0.0.1), με έλεγχο του Host (όχι DNS rebinding), και με το token για τη σύνδεση.
- Η σύνδεση είναι κλειστή ώσπου να την ανοίξεις, και ανοίγει μόνο για όσο είναι ανοιχτή η σελίδα.
- Τα πρόσθετα τρέχουν απομονωμένα και ζητούν επιβεβαίωση. Ο κώδικας Python ενός πρόσθετου τρέχει στον browser (Pyodide), όχι στον υπολογιστή σου.
