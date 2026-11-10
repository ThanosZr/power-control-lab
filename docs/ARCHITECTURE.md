# Αρχιτεκτονική και χάρτης υλοποίησης

Οδηγός για όποιον αλλάζει τον κώδικα: τι κάνει κάθε κομμάτι, πώς ρέουν τα δεδομένα από τη διεπαφή ως τον λύτη, και **ποια αρχεία και συναρτήσεις αγγίζει κάθε είδος αλλαγής**. Στόχος είναι να διαβάζεις το ελάχιστο δυνατό.

- Αριθμοί γραμμών για κάθε συνάρτηση, στοιχείο, tutorial και API: [CODEMAP.md](CODEMAP.md), που παράγεται με `python tools/codemap.py`.
- Οδικός χάρτης: [ROADMAP.md](ROADMAP.md).
- Εξισώσεις και παραδοχές του λύτη και των μοντέλων: [THEORY.md](THEORY.md). Επαλήθευση: [VERIFICATION.md](VERIFICATION.md).

## 1. Τα κομμάτια

```
Browser (web/)                                          Server (run.py → engine/)
──────────────────────────────────────────────          ─────────────────────────────────────
index.html  φορτώνει τα studio/*.js με τη σειρά:        run.py       HTTP, στατικά αρχεία, /api/<action>
 parts.js      κατάλογος στοιχείων και μπλοκ             engine/batch.py      λύτης αναφοράς SciPy
 mna.js        netlist + λύτης πραγματικού χρόνου        engine/templates.py  templates δεδομένων (SymPy)
 editor.js     επεξεργαστής σχεδίου                      engine/studio_math.py, derivation.py
 scope.js      παλμογράφος                                              συμβολική λύση (4 οικογένειες)
 tutorials.js  τα tutorials (project JSON)               engine/bidir.py      άσκηση μπαταρίας PE2
 templates.js  καταχωρητής templates                     engine/analysis, core, design, dynamics,
 metrics.js    δείκτες απόκρισης                          boundary, models, problem, proof,
 math.js       υπολογισμοί, ερωτήσεις                     workbench, curves   αναλυτικοί πάγκοι (/converter/)
 app.js        κόλλα: κατάσταση, πίνακες, θεωρία
 stepcheck.js  έλεγχος βήματος (3.13)
 subcircuit.js υποκυκλώματα (3.17): ορισμοί, flatten, δημιουργία/ανάπτυξη
 bus.js        δίαυλοι και διανύσματα (3.18): πλάτη, ανάπτυξη σε βαθμωτά σύρματα
 scenario.js   αιτήματα σεναρίων (3.14, κοινό με το pcl/runner.js)
 scenario_worker.js  πάνελ «Σενάρια»: Pyodide + pcl/core.py σε Worker
 exercises/    *.template.json, pe2_battery.js

Python από έξω (pcl/, 3.13): core.py (Project, Result, sweep, job) → runner.js → scenario.js (mna.js στο Node) ή engine/batch.py
MATLAB/Octave (matlab/, 3.14): pcl_run, pcl_sweep → python -m pcl job (ή /api/scenario_run, _sweep)
```

| Αρχείο | Ρόλος | Κύρια σημεία |
|---|---|---|
| `web/studio/parts.js` | Κατάλογος: ακροδέκτες (ηλεκτρικοί `pins`, σημάτων `spins`), παράμετροι, σύμβολο, ομάδα. Κοινός για editor και λύτη. | `PARTS`, `pinsOf`, `sigPins`, `pinKind`, `BLOCKS`, `parseSched`, `eng` |
| `web/studio/mna.js` | Netlist και λύτης MNA: ηλεκτρικοί κόμβοι και κόμβοι σημάτων, στοιχεία, PWM, S&H, μπλοκ, σειρά υπολογισμού, βήματα, συμβάντα, καταγραφή. Εξαγωγή για τον server. | `buildNetlist`, `compileSignals`, `Sim.load`, `Sim.run`, `Sim.stepCore`, `Sim.evalBlocks`, `Sim.sampleControllers`, `Sim.nextEvent`, `Sim.channelKeys`/`computeVals`, `exportForBatch` |
| `web/studio/subcircuit.js` | Υποκυκλώματα (3.17, ROADMAP §9), χωρίς DOM: ορισμοί στο `project.subcircuits`, θύρες, το «ισοπεδωμένο» κύκλωμα για τους λύτες, τιμές με διαδρομή, δημιουργία από επιλογή, ανάπτυξη. | `flatten`, `portsOf`, `innerParts`, `setParam`, `paramOf`, `sync`, `create`, `expand`, `makeUnique`, `closure` |
| `web/studio/bus.js` | Δίαυλοι και διανύσματα (3.18, ROADMAP §3), χωρίς DOM: πλάτος κάθε ακροδέκτη και σύρματος από ό,τι ενώνει, και το ίδιο κύκλωμα με βαθμωτά σύρματα για τους λύτες (Mux, Demux, επιλογή, δίαυλος αγωγών φεύγουν, ακροδέκτες διαύλου γίνονται χωριστοί, μπλοκ ανά στοιχείο γίνονται `<id>[k]`). | `needs`, `widths`, `expand`, `members`, `graph`, `solve`, `perElement` |
| `web/studio/editor.js` | Σχέδιο: μοντέλο `{components, wires}`, δρομολόγηση A*, σύρματα, κανόνες σύνδεσης, undo/redo, ετικέτες. | `Editor.render*`, `finishWire`, `setParams`, `dropDangling`, `netKinds`, `paste`, `valueText` |
| `web/studio/scope.js` | Σχεδιάζει κανάλια από τα buffers του λύτη. Λωρίδες για λογικά σήματα. | `Scope.draw`, `unitOf`, `isLogic` |
| `web/studio/app.js` | Κατάσταση `S`, δημιουργία λύτη, ζωντανές παράμετροι, inspector, θεωρία ανά tutorial, πάνελ μαθηματικών, server και CSV. | `buildSim`, `refreshControls`, `openInspector`, `liveOf`, `signalsFor`, `chanLabel`, `formulaTheory` και `*Theory`, `circuitForMath`, `runBatch`, `simValue` |
| `web/studio/tutorials.js` | Κάθε tutorial: επιλογές → project (στοιχεία, σύρματα, scope, `meta`). | `T.push({id, options, build})`, βοηθοί `C`, `J`, `project`, `piGains` |
| `web/studio/expr.js` | Parser του μπλοκ έκφρασης (χωρίς eval), δέντρο που πάει και στον server. Ονόματα ακροδεκτών και παράμετροι των μπλοκ κώδικα. | `parse`, `compile`, `names`, `params` |
| `web/studio/pyrt.js` | Python για το μπλοκ Python: φόρτωση Pyodide (τοπικό αντίγραφο ή CDN, ή το πακέτο npm στο Node), `make` → `step(t, u)`. | `PyRT.load`, `PyRT.make` |
| `web/studio/metrics.js` | Δείκτες από δεδομένα, χωρίς DOM (τρέχει και στο Node): απόκριση σε βήμα, προγράμματα, σειρά Fourier και THD. | `responseMetrics`, `scheduleEvents`, `harmonics` |
| `web/studio/math.js` | Εμφάνιση αποτελεσμάτων των templates και των ερωτήσεων με πρόβλεψη. | `renderTemplate`, `questionsHTML`, `bindQuestions` |
| `web/studio/stepcheck.js` | Έλεγχος βήματος (3.13): ιδιοτιμές του χάρτη BE των καταστάσεων, παρασιτικές των διακοπτών, πηγές, γραμμές, μηνύματα. Χωρίς DOM. | `eig`, `eigvecAbs`, `modes`, `check` |
| `engine/batch.py` | Ο ίδιος κύκλος με το `mna.js`, με `solve_ivp`. Δίοδοι και συγκριτές ως συμβάντα. Μηνύματα για την κονσόλα (3.13). | `Circuit`, `Ctrl`, `eval_blocks`, `sample`, `next_event`, `simulate`, `_diagnose` |
| `pcl/` | Σενάρια από κώδικα (3.13–3.16): `core.py` (Project: `set`, `run`, `stream`, `sweep`· Result: `measure`, `to_csv`/`to_json`/`to_mat` (`_savemat`)· `job`, `use`, `show`, `plot`, hooks για το πάνελ, `_Session`), `runner.js` (Node, πάνω στο `web/studio/scenario.js`, και `--session`), `__main__.py` (γραμμή εντολών, και `job`), `control.py` (σύνθεση ελέγχου, AI), `workbench.py` (φυτό για το Control Workbench). | `load`, `tutorial`, `Project.run`, `Project.stream`, `Project.sweep`, `job` |
| `web/studio/scenario.js` | Αιτήματα σεναρίων (3.14): run (με μετρήσεις, αραίωση, κομμάτια ακέραιων περιόδων), export, tutorial(s), channels. Χωρίς DOM: Node και Worker. | `handle`, `run`, `measure`, `decimate` |
| `matlab/` | MATLAB/Octave (3.14): `pcl_run`, `pcl_sweep`, `pcl_read`, `pcl_config`. | |
| `engine/templates.py` | Υπολογίζει ένα template: εισόδους, βήματα, ελέγχους, πίνακες, ερωτήσεις. | `template_solve`, `_questions` |
| `run.py` | Server: στατικά αρχεία και `ACTIONS` (π.χ. `batch_sim`, `template_solve`, `studio_math`). | `ACTIONS` |

## 2. Ροή δεδομένων

1. **Σχέδιο → project.** Ο `Editor` κρατά `doc = {components, wires}`. Το `project()` στο `app.js` προσθέτει ρυθμίσεις λύτη και scope.
2. **Project → netlist.** Το `MNA.buildNetlist(project)`:
   - πρώτα, αν υπάρχουν υποκυκλώματα (3.17), τα «ισοπεδώνει» με το `SubCircuit.flatten`: τα στοιχεία του instance X1 γίνονται `X1/<id>`, οι θύρες κόμβοι `JUNC`. Ό,τι ακολουθεί δεν ξέρει για υποκυκλώματα,
   - μετά, αν υπάρχουν δίαυλοι (3.18), τους αναπτύσσει με το `Bus.expand`: κάθε δίαυλος γίνεται βαθμωτά σύρματα (μέσω κόμβων `~J<n>`), τα στοιχεία με ακροδέκτη διαύλου παίρνουν `conn:'sep'`, τα μπλοκ ανά στοιχείο γίνονται `<id>[k]` (`net.vec`). Ό,τι ακολουθεί δεν ξέρει για διαύλους,
   - ενώνει ακροδέκτες με union-find (σύρματα, σύρματα με όνομα και `link` (3.18), πεδία «Πηγή» `in_<pin>`, ετικέτες Goto/From),
   - χωρίζει ηλεκτρικούς κόμβους και κόμβους σημάτων,
   - φτιάχνει στοιχεία (`els`), PWM (`ctrls`), S&H (`shs`) και μπλοκ,
   - με το `compileSignals` βγάζει τη σειρά υπολογισμού, βρίσκει τους αλγεβρικούς βρόχους και γράφει τις προειδοποιήσεις.
3. **Λύτης.** Το `Sim.run(διάρκεια)` κάνει σε κάθε επανάληψη:
   1. `nextEvent`: το επόμενο συμβάν (ακμές PWM, δείγματα, ρολόγια, προγράμματα).
   2. `step` → `stepCore`: βήμα trapezoidal/BE με εντοπισμό μετάβασης διόδου ή συγκριτή μέσα στο βήμα.
   3. Στην ίδια στιγμή, με αυτή τη σειρά: `evalBlocks('commit')` → `recordNow` → `sampleHolds` → `evalBlocks('sample')` → `sampleControllers` → `recordNow`.
   4. Μέσα στο `evalBlocks`, μετά το πέρασμα: οι z⁻¹ κρατούν την είσοδό τους και οι PI με back-calculation διαβάζουν το `tr` (λίστα `pend`). Τα συνεχή μπλοκ (ολοκληρωτής, βαθυπερατό, PLL) γράφουν την κατάστασή τους (λίστα `cont`), με την είσοδο κρατημένη από την προηγούμενη αποτίμηση. Ο server κόβει τα διαστήματα στο T/200 όταν υπάρχουν τέτοια μπλοκ.
   5. Μπλοκ με πολλές εξόδους (`b.outList`): η πρώτη έξοδος είναι το κανάλι `Y:id`, οι άλλες `Y:id:pin`.
4. **Καταγραφή → scope και θεωρία.** Ring buffer ανά κανάλι (`ring`) και στατιστικά ανά περίοδο (`per`). Το `Scope` και οι κάρτες θεωρίας διαβάζουν από εκεί (`now`, `lastPeriod`, `avgOver`). Οι αρμονικές (`app.js` `renderFFT`) παίρνουν τα σημεία του `ring` (`rawSeries`) και καλούν το `Metrics.harmonics`.
   - **Πολυθυρικά στοιχεία (3.5).** Στοιχείο `F` (ροής): θύρες `ports`, ροές `psi`, i = Γ·(ψ − ψ₀). Στο `assemble` ο πίνακας c·Γ (`stampM`), στο `rhs` οι πηγές ιστορικού, στο `commit` οι νέες ροές. Για τα συζευγμένα πηνία Γ = L⁻¹ σταθερό. Στοιχείο `MG`: σταθερός πίνακας αγωγιμοτήτων.
   - **SRM και κορεσμός (3.6).** Μη γραμμικό i(θ, ψ): το `values(t)` γραμμικοποιεί γύρω από τη ροή του προηγούμενου βήματος (Γ = di/dψ, ψ₀ = ψ − i/Γ), στο ίδιο στοιχείο `F`. Η μαγνήτιση της SRM ζει στο `parts.js` (`srmMag`, `srmCur`, `srmTorque`), ώστε ο browser, η κάρτα θεωρίας και η εξαγωγή να έχουν την ίδια αναπαράσταση.
   - **Σύγχρονη μηχανή (3.5).** Το ίδιο στοιχείο `F` με δύο θύρες (a → c, b → c) και Γ(θ), ψ₀(θ) από το `smPort`, που υπολογίζονται στο `values(t)` με τη γωνία στο τέλος του βήματος. Τότε `hasTV` και το `solveOnce` δεν κρατά παραγοντοποιήσεις. Οι ω, θ προχωρούν στο `smStep` μετά το `commit`.
   - **Μηχανές (3.1).** Το μηχανικό μέρος είναι κύκλωμα στον ίδιο λύτη: στοιχείο `GY` (γυρατής, μία γραμμή στο MNA) ανάμεσα στο τύμπανο και σε κόμβο του οποίου η τάση είναι το ω, πυκνωτής J, αγωγιμότητα b, πηγή ρεύματος τ_L (με `sigIn` όταν έρχεται από σήμα). Ένα μπλοκ τύπου `DCM` (`ft:false`) δίνει τις εξόδους ω και τ_e.
5. **Server.**
   - Το `exportForBatch` στέλνει το ίδιο netlist στο `/api/batch_sim` → `batch.simulate`. Τα αποτελέσματα επιστρέφουν ως διακεκομμένες καμπύλες στο scope.
   - Τα templates πάνε στο `/api/template_solve`.
   - Η συμβολική λύση πάει από το `circuitForMath` στο `/api/studio_math`.

## 3. Πού αλλάζεις τι

| Αλλαγή | Αρχεία και σημεία (με τη σειρά) | Tests |
|---|---|---|
| **Νέο ηλεκτρικό στοιχείο** | `parts.js` `PARTS` → `mna.js` `buildNetlist` (κλάδος του τύπου) → αν έχει νέα κανάλια `channelKeys`/`computeVals` → `app.js` `liveOf`, `signalsFor`, `chanLabel` → `editor.js` `valueText` → αν είναι νέο είδος στοιχείου (`k`), `batch.py` `Circuit` και `exportForBatch` | `tests/js/sim_cases.js` + `test_studio_sim.py`, `tests/js/batch_requests.js` + `test_batch.py` |
| **Νέο μπλοκ σημάτων** | `parts.js` (`blk:true`, `spins`, παράμετροι, σύμβολο) → `mna.js` `buildNetlist` (παράμετροι μπλοκ) και `evalBlocks` (case) → αν εξαρτάται από τον χρόνο `nextEvent`, αν αλλάζει απότομα `compileSignals.zc` → `exportForBatch` (λίστα πεδίων) → `batch.py` `eval_blocks`, `block_events` → `app.js` `LOGIC_BLK`/`blkUnit` → `editor.js` `valueText` | ίδια με το προηγούμενο, και ισοδυναμία browser–SciPy |
| **Νέος τρόπος σύνδεσης σημάτων** | `mna.js` `buildNetlist` (η ένωση με union-find) → `editor.js` `netKinds`, `renderPins` | `test_studio_sim.py` `test_connections_without_wire` |
| **Νέα μηχανή ή ηλεκτρομηχανικό στοιχείο** | `parts.js` (ομάδα «Μηχανές», `pins` και `spins`) → `mna.js` `buildNetlist` (ηλεκτρικό μέρος, μηχανικό κύκλωμα ή καταστάσεις της μηχανής όπως το `IM`: `imStep`/`imSources` στο `commit`, ή στοιχείο ροής `F` με Γ(θ) όπως το `SM`: `smPort` στο `values`, `smStep` στο `commit`, μεταφορά καταστάσεων στο `load` και στο `saveState`/`restoreState`) → `evalBlocks` (case) → `exportForBatch` (`F`, `rec`, `ims`) → `batch.py` (`iGY`, ή καταστάσεις στο τέλος του διανύσματος: `im_deriv`, `im_e`, `Vsrc`, ή `sm_cur`, `sm_deriv` και πηγές ρεύματος στο `bsrc`, `eval_blocks`) → `app.js` `OUT_SYM`/`OUT_TXT`/`blkUnit`/`liveOf` → `scope.js` `unitOf` → `editor.js` `valueText` | `sim_cases.js` (σύγκριση με τις ΔΕ), `test_batch.py` |
| **Πολυθυρικό στοιχείο** (πίνακας L ή G) | `parts.js` (`pins` ως συνάρτηση: `portPins`, `nPorts`, έλεγχος πίνακα όπως `klMatrix`) → `mna.js` `buildNetlist` (στοιχείο `F` ή `MG`, `info.ports`) → κανάλια `V2`/`I2`… στο `channelKeys`/`computeVals` (`portI`) → `exportForBatch` (`ports`, `Gam`/`Gm`, `portRec`) → `batch.py` (`cur`, `iMG`, `current(…, port)`) → `app.js` `signalsFor`, `chanLabel` → `editor.js` `valueText` | `sim_cases.js` (`mport`) + `test_studio_sim.py`, `batch_requests.js` (`mp_*`) |
| **Εμπέδηση (EIS)** | `mna.js` `eisPoint` (ένα σημείο: παράμετρος = f, αποκατάσταση, μέσες τιμές ανά περίοδο) → `metrics.js` `impedance` (αφαίρεση ολίσθησης, φασιθέτες της θεμελιώδους) → `app.js` `runEIS`/`drawEIS`, `cellZ` | `sim_cases.js` (`eis`), `tutorial_cases.js` (`eis_*`), `test_batch.py` (`eis_cell`) |
| **Σάρωση παραμέτρου / διάγραμμα διακλάδωσης** | `mna.js` `sweepPoint` (ένα σημείο: νέος λύτης, μεταβατικό, καταγραφή ανά περίοδο) → `app.js` `runBifurcation`/`drawBifurcation`, `renderPoincare` (δείγματα από `per`, π.χ. `per.end`) → `metrics.js` `periodicity` | `tutorial_cases.js` (`sub_*`, `chaos`), `blocks_flow.js` |
| **Ανάλυση σήματος (π.χ. αρμονικές)** | `metrics.js` (συνάρτηση χωρίς DOM) → `app.js` (πάνελ, όπως `renderFFT`) → `index.html` (`side-block`) | test στο Node, `blocks_flow.js` |
| **Μπλοκ κώδικα ή νέα γλώσσα** | `parts.js` (`EXPR`, `PY`: `codeIO`, `box` ως συνάρτηση) → `mna.js` `buildNetlist`, `evalBlocks`, `Sim.pyBlocks` (μεταγλώττιση στη φόρτωση, `needPython`) → `pyrt.js` (ή αντίστοιχο runtime) → `batch.py` `eval_ast`, `make_python_block` (και ο έλεγχος `_local` στο `run.py`) → `app.js` `buildSim` (φόρτωση), inspector τύπου `code` | `sim_cases.js` (`expr`), `tutorial_cases.js` (`code_*`), `test_batch.py` `test_code_blocks_parity` |
| **Νέο tutorial** | `tutorials.js` `T.push` → θεωρία στο `app.js` `formulaTheory` (dispatch με `topology`) → README | `tests/js/tutorial_cases.js` + `test_tutorials.py` |
| **Template ή ερωτήσεις** | `web/studio/exercises/*.template.json` + `index.json`. Το `tutorial` είναι ένα id ή λίστα (3.11, `templates.js` `allFor`). Νέα συνάρτηση στις εκφράσεις: `engine/templates.py` `FUNCS`. Νέος τύπος block: `engine/templates.py` και `math.js` `renderTemplate` | `test_templates.py` |
| **Κανάλι στο scope** | `mna.js` `channelKeys`/`computeVals` → `app.js` `chanLabel`/`signalsFor` → `scope.js` `UNIT`/`unitOf`. Για τον server: `exportForBatch` `rec` και `batch.py` `value` | `sim_cases.js`, `test_batch.py` |
| **Ζωντανή παράμετρος** | `app.js` `refreshControls` → `Sim.setControl`/`setHold`/`setBlock` → `liveChange` (για να γίνει πρόγραμμα t:τιμή) | `features_flow.js` |
| **Αλληλεπίδραση στο σχέδιο** | `editor.js` `down`/`move`/`up`, `finishWire`, `setParams`. Από την 3.7: εργαλείο σύρματος (`wireTool`, `finishFree`), κούμπωμα (`nearTarget`), ελεύθερα άκρα (κόμβος `JUNC` με ένα σύρμα, `mergeJunction`), σύνδεση στοιχείων που πέφτουν σε σύρμα (`autoConnect`, `insertSeries`) | `editor_interactions.js`, `blocks_flow.js`, `wiring_flow.js` |
| **Στοιχείο με καθυστέρηση (γραμμή Bergeron, 3.8· απώλειες 3.11)** | `parts.js` (`TL`, `tlParams`: Z, τ, R, N) → `mna.js` `tlElement` (Z_e, h, N τμήματα, στήλες ιστορικού), `buildNetlist` (στοιχείο `TL`, `info.line`), `values` → `tlSources` (πηγές κάθε τμήματος από `tlHist` στο t − τ/N), `assemble`/`rhs` (1/Z_e και I_h στα άκρα), `commit` → `tlRecord` (εσωτερικοί κόμβοι από τον νόμο ρευμάτων), `saveState`/`restoreState` (μήκος ιστορικού και `cut`), `tlMaxStep` (βήμα ≤ τ/N), μεταφορά στο `load` (ίδιο N). Αναλυτική λύση: `Parts.bewley`. Στον SciPy (3.10, 3.11): `batch.py` `tl_hist`/`tl_sec`/`tl_ih`/`tl_record`, πηγές στο `bsrc`, τμήματα ≤ τ/N στο `next_event` | `sim_cases.js` (`tl38`, `tl311`), `tutorial_cases.js` (`tw_*`, `ll_*`), `batch_requests.js` (`tw_*`, `arr_*`, `ll_*`) |
| **Μη γραμμικό στοιχείο (αλεξικέραυνο, 3.9)** | `parts.js` (`MOV`, `movChar`: i(v), di/dv, v(i)) → `mna.js` `buildNetlist` (στοιχείο `NL`), `solve` (επανάληψη Newton με `nlLinearize` και περιορισμό τάσης), `assemble`/`rhs` (g, J), `elCurrent`, `saveState`. Νέα μη γραμμικά: ίδιο μοτίβο (γραμμικοποίηση γύρω από `v0`). Στον SciPy (3.10): έγχυση στο `inj`, Newton στο `solve_nl` (`mov_cur`, `mov_inv`) | `sim_cases.js` (`mov39`), `tutorial_cases.js` (`ar_*`), `batch_requests.js` (`mov_ramp`) |
| **Στοιχείο που κλείνει από τάση ή χρόνο (σπινθηριστής, 3.10)** | `parts.js` (`SG`) → `mna.js` `buildNetlist` (δίοδος `D` με `gap`: U_b, trig, ext, I_ext), `check` (κλείσιμο στο |v| = U_b ή στο t_trig από την αρχή του βήματος, άνοιγμα στο μηδέν ή στο I_ext, `tOff` για το υπόλοιπο ρεύμα), έλεγχος `ok` στο `stepCore`, `commit` (`trigDone`), `nextEvent` (t_trig) → `batch.py` `iSG`, `consistent`, συμβάντα στο `simulate`, `just_off`. Χρόνος βάσης χωρίς πηγές: `project.solve.tbase` → `basePeriod` και `base_T`. Καμπύλη τάσης–χρόνου (3.11): `gap.de` (U₀, k, D), `deInt`/`deFrac`, `Dacc` στο `commit`, κόψιμο ως το τέλος του βήματος στο `stepCore`, `tOn`· στον SciPy κατάσταση `kD` (`iDE`) με συμβάντα D = D_c και |v| = U₀ | `sim_cases.js` (`sg310`, `vt311`), `tutorial_cases.js` (`mx_*`, `ch_*`, `vt_*`, `hv_*`), `batch_requests.js` (`sg_*`, `marx`, `chop`, `vt_*`, `hv*`) |
| **Αναφορά επαλήθευσης (3.8)** | `tools/verify.py` `checks` (αναμενόμενη τιμή από την αναφορά, στην Python) → `docs/VERIFICATION.md`. Νέο μοντέλο: μία γραμμή εκεί, με αναφορά που δεν είναι ο ίδιος ο λύτης | `python tools/verify.py --check` στον CI |
| **Ασύνδετα και αιωρούμενα (3.7)** | `mna.js` `buildNetlist`: επιλογές `project.solve` (`unconn`, `island`, `rleak`), σύνολο `skip`, κλάδεμα νεκρών κλαδιών, κόμβοι χωρίς στοιχείο, νησιά με union-find, `net.diag` → `editor.setDiag`, `app.js` `propsCircuit` | `sim_cases.js` (`solve37`), `test_batch.py` (`isl_*`), `wiring_flow.js` |
| **Πάνελ παραμέτρων και 📌 (3.7)** | `app.js` `renderProps` (`propsComp`, `propsWire`, `propsCircuit`, ενότητες με `psec`), `togglePin` (`c.live`, `c.liveBase`), ρυθμιστές στο `refreshControls`, `liveApply` (φόρτωση με καταστάσεις χωρίς ανανέωση πάνελ) | `wiring_flow.js` |
| **Βήμα του λύτη (3.13)** | `mna.js`: `buildNetlist` (`step` από `project.solve`), `Sim.varSetup`/`hGrid`/`modeCap` (όρια, πλέγμα, 2τ για τον τραπεζοειδή), `stIndex`/`stVec` (καταστάσεις: νέο είδος κατάστασης μπαίνει εκεί και στο `stKind`), `lteErr`, `varCheck` (μετά από κάθε βήμα στο `run`), `gateSigPeek` και `endFlip` (μικρό βήμα μετά από μεταγωγή), σημαίες `lastSmooth`/`lastDisc` στο `stepCore`, `evStat` στο `nextEvent` | `tests/js/step_cases.js` + `test_step.py` |
| **Μήνυμα στην κονσόλα διαγνωστικών (3.13)** | Πριν από το τρέξιμο: `stepcheck.js` `check` (πεδία `sev`, `grp`, `id`, `key`, `msg`, `fix`). Κατά το τρέξιμο: `Sim.note(key, {...})` (ίδια πεδία, μετρά επαναλήψεις, `up` για αναβάθμιση σε προειδοποίηση). Server: `batch.py` `_diagnose` ή `diag` στο αποτέλεσμα. Εμφάνιση: `app.js` `diagItems`, `renderDiag` | `step_cases.js`, `step_flow.js`, `test_pcl.py` (server) |
| **Πάνελ «Σενάρια» (3.14)** | `index.html` (`#scen-card`) → `app.js` (`SCEN`, `scenRun`, `scenMsg`, `scenShow`, `scenPlot`, `SCEN_EX` για τα παραδείγματα) → `scenario_worker.js` (Pyodide, `GLUE`: `_backend`, `_show_hook`, `_run_user`) → `scenario.js` `handle`. Νέος τύπος εμφάνισης: `pcl.core` (π.χ. `Plot`), `_show_hook` στο `GLUE`, `scenShow` | `scenario_flow.js` |
| **MATLAB/Octave (3.14)** | `matlab/pcl_run.m`, `pcl_sweep.m` → `pcl_spec`, `pcl_measures` → `pcl_job` (CLI ή server) → `pcl_result` (struct από το JSON) | `test_matlab.py` (Octave) |
| **Σενάρια από κώδικα (3.13)** | `pcl/core.py` (`Project`, `_measures`, `Result`, `SweepResult`) → `pcl/runner.js` (ενέργειες `run`, `export`, `tutorial`, `tutorials`, `channels`· μετρήσεις στο `measure`) → `pcl/__main__.py` (γραμμή εντολών). Νέα μέτρηση: `STATS`, `runner.js` `measure` και `Result.measure` | `test_pcl.py` |
| **Διακλάδωση ως σάρωση (3.15)** | `scenario.js` `bifPoint`/`bifSpec`, ενέργεια `bifurcation` (→ `MNA.sweepPoint`, `Metrics.periodicity`) → `pcl/core.py` `Project.bifurcation`, `BifurcationResult` → `__main__.py` `bifurcation`, `job()` → `matlab/pcl_bifurcation.m`, `pcl_result` (kind `bifurcation`). Η εφαρμογή: `app.js` `runBifurcation` με το ίδιο `Scenario.bifPoint` | `test_pcl.py` `test_bifurcation_*`, `test_matlab.py`, `scenario_flow.js` |
| **Pool από workers (3.15)** | `pool.js` `SimPool` (`map` με `settle`, `stop`) → `sim_worker.js` (`Scenario.handle`, χωρίς Python). Από το πάνελ: `scenario_worker.js` `batch` (SharedArrayBuffer, `Atomics.wait`) → `app.js` `scenBatch`/`scenBatchWrite` → `pcl/core.py` `_batch_hook` (στο `sweep` και στο `bifurcation`). Προϋπόθεση: COOP/COEP στο `run.py` `send` | `scenario_flow.js` |
| **Νέο format εξαγωγής (3.15: Parquet, HDF5)** | `pcl/formats.py` (`write_parquet`: Thrift compact στο footer, μία ομάδα γραμμών, PLAIN, GZIP· `write_hdf5`: h5py) → `to_<format>` στα `Result`, `SweepResult`, `BifurcationResult` και `_save` (κατάληξη) → `scenario_worker.js` (λίστα αρχείων του πακέτου) και `run.py` (`/pcl/` λίστα) → `matlab/pcl_read.m` | `test_pcl.py` `test_parquet_and_hdf5` |
| **Άλματα από πρόγραμμα και έλεγχος ανά τοπολογία (3.15)** | `mna.js`: `schedAt(…, left)`, `jumpScheds`/`jumpAt`, `evJump` στο `nextEvent`, `leftAt` στο `values`, `jumpNow` στο `run` και στο `stepCore` (σαν μεταγωγή). Τοπολογίες: `swEls`, `topoKey`, `topoInfo` (ιδιομορφές και όριο 2τ ανά τοπολογία), `topoCheck` (μετά από κάθε μεταγωγή), `stepcheck.js` `check(sim, {modesOnly, md, cap})` | `step_cases.js` (`jump`, `topo`) + `test_step.py` |
| **Πρόσθετο (add-on, 3.15)** | φάκελος στο `web/addons/<id>/` (ενσωματωμένο) ή `~/.pcl/addons/<id>/` (του χρήστη): `pcl-addon.json` (id, entry, kind, targets, permissions), σελίδα και JS σε αρχεία (η CSP δεν δέχεται inline scripts) με `/studio/addon_client.js` → `engine/addons.py` (`listing`, `install`, `remove`, `user_file`) → `run.py` (`/api/addons`, `/addons/…`, `local()`) → `addons.js` (`open`, `onMessage`, άδειες `PERM`) → `app.js` (`initAddons`, `addonDock`, `renderAddons`, κουμπιά `data-tool` στο `propsComp`). Οδηγός: `docs/ADDONS.md` | `test_addons.py`, `addons_flow.js` |
| **Νέα μέθοδος του API πρόσθετων και σύνδεσης (3.15)** | `addons.js` `M` (και `PERM` αν θέλει άδεια) → `addon_client.js` (συντόμευση) → `pcl/link.py` `App` → `matlab/pcl_link.m` (σχόλιο) → `docs/ADDONS.md` (πίνακας) | `addons_flow.js` |
| **Σύνδεση με εξωτερικά προγράμματα (3.15)** | `engine/addons.py` `Link` (`call` περιμένει, `next` με `alive`, `reply`, `~/.pcl/link.json`) → `run.py` (`/api/link/token|next|call|reply`, token, `local()`) → `addons.js` `linkOn` (long poll) → `pcl/link.py`, `matlab/pcl_link.m` | `test_addons.py` `test_link`, `Server`, `addons_flow.js` |
| **Python ενός πρόσθετου (3.15)** | `addons.js` `python` → `app.js` `scenEval` → `scenario_worker.js` `evalAddon` (`_eval_addon` στο `GLUE`, αρχεία του πρόσθετου στο `/addon_pkg/<id>`) → απάντηση `evalres`. Νέο module του `pcl` για τον browser: λίστα αρχείων στο `boot()` του worker | `addons_flow.js` |
| **Εργαλείο παραμέτρων στοιχείου (3.15, π.χ. κρουστικές)** | υπολογισμός σε `pcl/<module>.py` (καθαρή Python, χωρίς numpy, για να τρέχει και στο Pyodide) → μορφή «από παραμέτρους» στο στοιχείο (`parts.js`: `shape:'direct'`, `directWave`) → πρόσθετο με `targets` | `test_addons.py` `Impulse` |
| **Σύνθεση ελέγχου και νέος τύπος ελεγκτή (3.15)** | `pcl/control.py` (`TYPES`, κώδικας μπλοκ όπως `PY_PI_NN`, `compose`, `metrics`) → λίστα αρχείων του `scenario_worker.js` (`control.py`) → πρόσθετο `web/addons/control-composer/ui.js` (`TYPES`, `draw`, `diagram`, `compare`). Νέα οπτικοποίηση: συνάρτηση σαν το `diagram` πάνω στο `PCL.values` | `test_control.py`, `addons_flow.js` |
| **Γραφικές για δημοσίευση (3.15)** | `pcl/plotting.py` (`read_table`, `read_mapping`, `figure`, `extremes`), πρότυπα `pcl/presets/*.json` (και `run.py` `/api/presets`) → `matlab/pcl_style.m` → πρόσθετο `web/addons/publication-plot/ui.js` | `test_plotting.py`, `addons_flow.js` |
| **Αποθηκευμένη κατάσταση και συνέχεια (3.16)** | `mna.js` `snapEncode`/`snapRestore` (περπάτημα στα δεδομένα του λύτη, χωρίς `project`, `cache`, `ring`, `per`), `Sim.snapshot`/`restoreSnapshot`, `resume` (με άλλο project: `load` χωρίς `fresh`). Νέο είδος κατάστασης δεν θέλει αλλαγή εδώ, αρκεί να είναι δεδομένα (όχι συνάρτηση) σε αντικείμενο του λύτη· ένα αντικείμενο με `getState`/`setState` (μπλοκ Python: `pyrt.js`) κρατά μόνο του την κατάστασή του | `tests/js/snapshot_cases.js` + `test_stream.py` |
| **Συνεδρίες λύτη και αποτελέσματα σε κομμάτια (3.16)** | `scenario.js` `open`/`advance`/`state`/`close`, `setLive` → `pcl/runner.js --session` → `pcl/core.py` `_Session`, `Project.stream`, `run(save_state, resume)`, `read_state`, `_SweepFile` (`sweep(to, resume)`) → `__main__.py` (`--chunk`, `--state`, `--resume`) → `matlab/pcl_run.m` | `test_stream.py`, `scenario_flow.js` |
| **Python στους workers του pool (3.16)** | `sim_worker.js` `python()` (Pyodide στον worker, μία φορά) → οι καλούντες στέλνουν και κυκλώματα με μπλοκ Python: `addons.js` `solve`/`batch`, `app.js` `runBifurcation`, `scenario_worker.js` `batch` | `scenario_flow.js`, `addons_flow.js` |
| **Ελεγκτής AI σε βρόχο και εκπαίδευση (3.16)** | `pcl/control.py`: `MLP_SRC` (δίκτυα σε καθαρή Python, κοινά για εκπαίδευση και μπλοκ), πρότυπα κώδικα `PY_INV_NN`/`PY_RL` (`inv_nn_code`, `rl_code`), `compose` (`Ts`, `state`, `dither`, `TYPES`), `InverseTrainer` (φάσεις, `to_dict`), `RLTrainer` (`iterate`), `_Runner` (pool ή διεργασίες Node), `compare` → πρόσθετο `control-composer/ui.js` (`TYPES`, `train`, `run`, `variants`) | `test_control.py`, `addons_flow.js` |
| **Το Control Workbench με φυτό ένα κύκλωμα (3.16)** | `pcl/workbench.py` (`prepare`, `CircuitPlant`, `plant_class`, `register`, `run_scheme`, `launch`) → `__main__.py` `workbench` | `test_workbench.py` |
| **Υποκυκλώματα (3.17)** | Δεδομένα και λύτες: `subcircuit.js` (`flatten`: ids, ετικέτες, αναφορές `type:'ref'` και `in_`, Goto/From, θύρες· `innerParts`: δημόσιες και τιμές του instance) → `mna.js` `buildNetlist` (καλεί το `flatten`), `setPath`. Σύμβολο: `parts.js` `SUB`, `PORT`, `SIN`, `SOUT`, `subLayout`, `subDraw`. Εφαρμογή: `app.js` ενότητα «subcircuits» (`fullDoc`, `enterSub`/`leaveSub`, `groupSel`, `expandSub`, `propsSub`, `propsDef`, `togglePublic`, `renderCrumbs`, `viewDiag`, `allComps`, `compAt`), `editor.js` `replaceDoc`, `beginPlace(type, params)`, `opt.ongroup`/`canPlace`/`subParams`. `pcl`: `core.py` `_inner_parts`, `_sub_parts` | `test_subcircuit.py` (`subcircuit_cases.js`), `subcircuit_flow.js` |
| **Δίαυλοι (3.18)** | Πυρήνας: `bus.js` (`graph`: ενώσεις σε επίπεδο ακροδέκτη· `solve`: σταθερά πλάτη, μετά Mux/Demux/μπλοκ ανά στοιχείο ως να μην αλλάζει τίποτα· `expand`: ένωση ανά στοιχείο, αντίγραφα, κόμβοι `~J<n>`) → `mna.js` `buildNetlist` (καλεί το `expand`, ενώνει σύρματα με `link`), `setBlock` (σε όλα τα `<id>[k]`). Σύμβολα: `parts.js` `MUX`, `DEMUX`, `BSEL`, `EBUS`, `bl`/`sbl`, `CONN`, `WIDTH`, `pinWidth`. Editor: `editor.js` `renderWires` (`Bus.widths`, `.wire.bus`, `bslash`/`bwidth`), `renderPins` (`buspin`), `setWireProps` (`link`). Εφαρμογή: `app.js` `fieldValue` (τιμές με «;»), `vecN`/`vecBase`, `signalsFor`, `chanLabel`, `liveOf`, `wireWidth`, `openWireInspector`/`propsWire` (`data-wlink`), ζωντανή σταθερά-διάνυσμα (`data-kapply`). Υποκυκλώματα: `subcircuit.js` `portsOf` (`w`), `flatten` (`$w`), `create` (πλάτος θύρας) | `test_bus.py` (`bus_cases.js`), `bus_flow.js` |
| **Στοιχείο ή μπλοκ με ακροδέκτη διαύλου** | `parts.js`: παράμετρος `CONN(…)` (`conn`: `sep`/`bus`), `pins`/`spins` ως συνάρτηση του `conn`, και `bus: p => ({<ακροδέκτης διαύλου>: [<χωριστοί ακροδέκτες>]})`. Ο λύτης δεν αλλάζει: παίρνει το στοιχείο με `conn:'sep'`. Στην εφαρμογή τα κανάλια βγαίνουν από τη χωριστή μορφή (`outsOf`) | `test_bus.py`, `test_api_surface.py` (οι ακροδέκτες μπαίνουν στο API) |
| **Μπλοκ που δουλεύει ανά στοιχείο διανύσματος** | `bus.js` `ELEMENTWISE` (και, αν έχει κατάσταση, τίποτα άλλο: κάθε αντίγραφο έχει τη δική του). Μια παράμετρος που δεν μπορεί να είναι ανά στοιχείο (π.χ. αναφορά σε ρολόι) δεν γράφεται με «;» | `test_bus.py` `test_vector_pi_is_two_scalar_loops` |
| **Δημόσιο API (3.18, βάση για την 4.0)** | Ό,τι αλλάζει στο `pcl`, στη γραμμή εντολών, στον server (`run.py`), στο `addons.js` `M`, στο `matlab/`, στα αιτήματα του `scenario.js` ή στον κατάλογο των στοιχείων (τύποι, παράμετροι, ακροδέκτες) → `python tools/api_surface.py` (ξαναγράφει `docs/API.md` και `tools/api_surface.json`). Αφαίρεση ή χαμένο όρισμα: μόνο με `--allow-removal "λόγος"`, και από την 4.0 όχι μέσα στην ίδια κύρια έκδοση | `test_api_surface.py`, `python tools/api_surface.py --check` στον CI |
| **Νέα παράμετρος που δείχνει σε άλλο στοιχείο** | στο `parts.js` πάντα με `ref(...)` (`type:'ref'`): μόνο έτσι το `flatten` τη μεταφράζει μέσα σε υποκύκλωμα και το `create` την κάνει διαδρομή | `test_subcircuit.py` |
| **API του server** | `run.py` `ACTIONS` → συνάρτηση στο `engine/` | `test_api.py` |
| **Κείμενα διεπαφής** | `web/index.html`, `app.js` | UI flows |

## 4. Κανόνες που δεν σπάνε

- **Ίδια συμπεριφορά στον browser και στον server.** Κάθε αλλαγή στη σημασία στοιχείου, PWM ή μπλοκ γίνεται και στο `mna.js` και στο `batch.py`, με test σύγκρισης στο `test_batch.py`.
- **Σειρά σε μία στιγμή:** δείγματα πριν από την ενημέρωση του ελεγκτή, και μετά οι μεταγωγές (§2.3). Τα δείγματα παίρνουν την τιμή πριν από τη στιγμή (t⁻).
- **Κανένας ειδικός κώδικας για μία άσκηση στον λύτη.** Τα φαινόμενα βγαίνουν από τη σύνθεση στοιχείων.
- **Τα παλιά projects ανοίγουν πάντα.** Οι συνδέσεις μέσω ID (διακόπτης → PWM, αισθητήρας → στοιχείο) συνεχίζουν να δουλεύουν.
- **Σύρμα σήματος δεν ενώνεται ποτέ με ηλεκτρικό κόμβο** (`editor.js` `finishWire`, `kindsOk`, `mna.js` `buildNetlist`).
- **Καμία εξαίρεση πια στην ισοδυναμία browser–server** (από την 3.10): γραμμή, αλεξικέραυνο και σπινθηριστής υπάρχουν και στο `batch.py`. Κάθε νέο στοιχείο μπαίνει και στους δύο, με test στο `test_batch.py`.
- **Κάθε νέο μοντέλο μπαίνει και στην αναφορά επαλήθευσης** (`tools/verify.py`), με αναμενόμενη τιμή από ανεξάρτητη αναφορά.
- **Ό,τι μένει εκτός λύσης φαίνεται** (3.7): στο `net.diag`, στο σχέδιο και στο πάνελ παραμέτρων. Ο λύτης SciPy παίρνει το ίδιο netlist από το `exportForBatch`, οπότε και τις ίδιες επιλογές.
- **Αλγεβρικός βρόχος = σφάλμα** με τα μπλοκ του βρόχου, ποτέ κρυφή καθυστέρηση.
- **Οι λύτες βλέπουν μόνο ισοπεδωμένο κύκλωμα** (3.17): κανένα `SUB` δεν φτάνει στο `buildNetlist` μετά το `flatten`, κανένας κώδικας λύτη δεν ξέρει για υποκυκλώματα. Ό,τι δείχνει σε άλλο στοιχείο είναι `type:'ref'` ή `in_<pin>`.
- **Οι λύτες βλέπουν μόνο βαθμωτά σύρματα** (3.18): κανένας δίαυλος, Mux/Demux ή ακροδέκτης διαύλου δεν φτάνει στο union-find του `buildNetlist` μετά το `Bus.expand`. Ένα κύκλωμα χωρίς δίαυλο περνά αυτούσιο (ίδιοι αριθμοί με πριν). Δύο πλάτη στον ίδιο κόμβο είναι σφάλμα, ποτέ κρυφή μετατροπή.
- **Το δημόσιο API δεν χάνει τίποτα χωρίς καταγραφή** (3.18): `tools/api_surface.py --check` στον CI. Από την 4.0: μέσα σε μία κύρια έκδοση μόνο προσθήκες (`docs/API.md`).
- **Στον editor ένα επίπεδο κάθε φορά** (3.17): οι λειτουργίες της προσομοίωσης (`buildSim`, `project`, `liveApply`, server) παίρνουν πάντα το `fullDoc()`, όχι το `editor.export()`.

## 5. Tests

| Τι | Πώς τρέχει | Τι καλύπτει |
|---|---|---|
| Python unittest | `python -m unittest discover -s tests` | αναλυτικούς engines, templates, server |
| Λύτης browser μέσω Node | από τα `test_studio_sim.py`, `test_tutorials.py`, `test_batch.py`, που καλούν `tests/js/*.js` | `mna.js`, tutorials, ισοδυναμία με SciPy |
| Περιβάλλον (Playwright) | με server στο 8765: `node tests/ui/<flow>.js http://127.0.0.1:8765/` από άλλον φάκελο | `studio_flow`, `editor_interactions`, `features_flow`, `blocks_flow`, `wiring_flow`, `step_flow`, `scenario_flow`, `addons_flow`, `subcircuit_flow`, `bus_flow` |
| Χάρτης κώδικα | `python tools/codemap.py --check` | ότι το `CODEMAP.md` είναι ενημερωμένο |
| Αναφορά επαλήθευσης | `python tools/verify.py` (γράφει) ή `--check` (ελέγχει) | ότι κάθε τιμή του `VERIFICATION.md` είναι μέσα στην ανοχή της |
| Δημόσιο API (3.18) | `python tools/api_surface.py` (γράφει) ή `--check` (ελέγχει) | ότι το `docs/API.md` είναι ενημερωμένο και ότι τίποτα δεν χάθηκε χωρίς καταγραφή |

Ο CI (`.github/workflows/ci.yml`) τα τρέχει όλα σε κάθε push στα `main` και `lab-*` και σε κάθε pull request. Σε κάθε push φτιάχνει και το zip της έκδοσης ως artifact. Σε tag `v*` το ανεβάζει και ως release.

## 6. Ροή εργασίας

1. Νέο branch για κάθε έκδοση: `lab-<έκδοση>`. Το `main` αλλάζει μόνο με έγκριση.
2. Πριν από την αλλαγή: εντοπισμός στο §3 και στο `CODEMAP.md`, και ανάγνωση μόνο αυτών των σημείων.
3. Μετά την αλλαγή:
   - tests, τα 10 UI flows,
   - `python tools/codemap.py` και `python tools/api_surface.py`,
   - ενημέρωση README (πίνακας εκδόσεων) και ROADMAP (§0),
   - έκδοση στο `engine/__init__.py` και στο footer του `web/index.html`.
4. Zip: `git archive --format=zip --prefix=Power_Converter_Lab_<έκδοση>/ -o Power_Converter_Lab_<έκδοση>.zip lab-<έκδοση>`. Το φτιάχνει και ο CI.
