# Πρόσθετα (add-ons) και σύνδεση με προγράμματα Python ή MATLAB

Από την 3.15 (ROADMAP §35, §36). Δύο δρόμοι προς το ίδιο API:

- **Πρόσθετο:** μια σελίδα (HTML και JavaScript) που ανοίγει μέσα στην εφαρμογή, σε απομονωμένο πλαίσιο. Παράδειγμα το ενσωματωμένο «Κρουστικές πηγές: παράμετροι από κώδικα» (`web/addons/impulse-params/`).
- **Σύνδεση:** ένα πρόγραμμα σε αυτόν τον υπολογιστή (Python, MATLAB, ή οποιαδήποτε γλώσσα με HTTP) καλεί τις ίδιες μεθόδους πάνω στο κύκλωμα της οθόνης. Έτσι ένα υπάρχον GUI (π.χ. ένα εργαλείο MATLAB ή το Control Workbench σε Python) μένει όπως είναι και μιλά με την εφαρμογή.

## Οι μέθοδοι

| Μέθοδος | Ορίσματα | Απάντηση | Άδεια |
|---|---|---|---|
| `info` | | εφαρμογή, έκδοση, `api` (η κύρια έκδοση του σταθερού API, 4 από την 4.0), κύκλωμα, επιλογή, T, t | — |
| `project.get` | | το κύκλωμα (όπως το αρχείο της εφαρμογής) | `project.read` |
| `params` | `id` (προαιρετικό) | `{id: {type, label, params, from}}` | `project.read` |
| `get` | `key` (`R1.R`) | η τιμή | `project.read` |
| `selection` | | τα επιλεγμένα στοιχεία | `project.read` |
| `channels` | | τα κανάλια και η περίοδος T | `project.read` |
| `machines` | | 4.7: οι μηχανές της εφαρμογής: τύπος, όνομα, είδος (`dc`, `induction`, `sync`, `srm`, `gen`), έξοδοι, ακροδέκτες, παράμετροι με προεπιλογές (το διαβάζει το `pcl.gui`) | `project.read` |
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

Οι προσομοιώσεις τρέχουν με τον λύτη της εφαρμογής, στο pool από workers (όχι στη σελίδα), άρα δίνουν ίδιους αριθμούς με την εφαρμογή και με το `pcl`. Από την 3.16 και ένα κύκλωμα με μπλοκ Python (π.χ. ελεγκτές με νευρωνικά δίκτυα): κάθε worker φορτώνει την Python την πρώτη φορά που τη χρειάζεται.

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

**Εγκατάσταση και εκδόσεις:** «Πρόσθετα και σύνδεση» → «Εγκατάσταση από zip…». Ο φάκελος πάει στο `addons/<id>/<version>/` μέσα στον φάκελο της εφαρμογής (αλλού με τη μεταβλητή `PCL_ADDONS`). Κάθε έκδοση ενός πρόσθετου μένει δίπλα στις άλλες: στο πάνελ διαλέγεις ποια είναι ενεργή και σβήνεις μία έκδοση ή όλο το πρόσθετο. Ο φάκελος `addons/` δεν μπαίνει στο git (`.gitignore`), ώστε το repo να μη κουβαλά μεγάλα αρχεία. Τα ενσωματωμένα είναι στο `web/addons/`.

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

**Κατά παραγγελία:** με τη σύνδεση κλειστή, η πρώτη κλήση ενός προγράμματος «χτυπά την πόρτα». Η εφαρμογή δείχνει μήνυμα με το όνομα του προγράμματος και «Αποδοχή / Απόρριψη». Με «Αποδοχή» η σύνδεση ανοίγει και η κλήση συνεχίζει. Με τη σύνδεση ήδη ανοιχτή η κλήση μπαίνει κατευθείαν. Το `connect(client='Το GUI μου')` δίνει το όνομα που βλέπει το μήνυμα.

## Σύνδεση: MATLAB

```matlab
info = pcl_link('info');
pcl_link('set', struct('key', 'R1.R', 'value', 20));
r = pcl_link('run', struct('t_end', 5e-3, 'measure', {{struct('name', 'Vo', 'key', 'V:C1', 'stat', 'avg', 'periods', 10)}}));
pcl_link('set_many', struct('values', containers.Map({'I1.tau1', 'I1.tau2'}, {1.83e-6, 284.8e-6})));   % κλειδιά με τελεία: containers.Map
```

Η σαφής διεπαφή είναι η κλάση `PclApp` (`matlab/PclApp.m`), με τις ίδιες μεθόδους:

```matlab
app = PclApp('MATLAB');
app.info()
app.setParam('R1.R', 20);
r = app.run('t_end', 5e-3, 'measure', {'Vo', 'V:C1', 'avg', 10});   r.measure.Vo
s = app.scope();
app.show('τέλος');
```

Στο MATLAB το `pcl_link` καλεί με `webwrite`. Στο Octave περνά από την Python (`python -m pcl link`), γιατί το `webwrite` του Octave δεν στέλνει JSON. Το αποτέλεσμα είναι το ίδιο και στα δύο.

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
