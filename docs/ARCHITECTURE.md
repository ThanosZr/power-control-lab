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
 exercises/    *.template.json, pe2_battery.js
```

| Αρχείο | Ρόλος | Κύρια σημεία |
|---|---|---|
| `web/studio/parts.js` | Κατάλογος: ακροδέκτες (ηλεκτρικοί `pins`, σημάτων `spins`), παράμετροι, σύμβολο, ομάδα. Κοινός για editor και λύτη. | `PARTS`, `pinsOf`, `sigPins`, `pinKind`, `BLOCKS`, `parseSched`, `eng` |
| `web/studio/mna.js` | Netlist και λύτης MNA: ηλεκτρικοί κόμβοι και κόμβοι σημάτων, στοιχεία, PWM, S&H, μπλοκ, σειρά υπολογισμού, βήματα, συμβάντα, καταγραφή. Εξαγωγή για τον server. | `buildNetlist`, `compileSignals`, `Sim.load`, `Sim.run`, `Sim.stepCore`, `Sim.evalBlocks`, `Sim.sampleControllers`, `Sim.nextEvent`, `Sim.channelKeys`/`computeVals`, `exportForBatch` |
| `web/studio/editor.js` | Σχέδιο: μοντέλο `{components, wires}`, δρομολόγηση A*, σύρματα, κανόνες σύνδεσης, undo/redo, ετικέτες. | `Editor.render*`, `finishWire`, `setParams`, `dropDangling`, `netKinds`, `paste`, `valueText` |
| `web/studio/scope.js` | Σχεδιάζει κανάλια από τα buffers του λύτη. Λωρίδες για λογικά σήματα. | `Scope.draw`, `unitOf`, `isLogic` |
| `web/studio/app.js` | Κατάσταση `S`, δημιουργία λύτη, ζωντανές παράμετροι, inspector, θεωρία ανά tutorial, πάνελ μαθηματικών, server και CSV. | `buildSim`, `refreshControls`, `openInspector`, `liveOf`, `signalsFor`, `chanLabel`, `formulaTheory` και `*Theory`, `circuitForMath`, `runBatch`, `simValue` |
| `web/studio/tutorials.js` | Κάθε tutorial: επιλογές → project (στοιχεία, σύρματα, scope, `meta`). | `T.push({id, options, build})`, βοηθοί `C`, `J`, `project`, `piGains` |
| `web/studio/expr.js` | Parser του μπλοκ έκφρασης (χωρίς eval), δέντρο που πάει και στον server. Ονόματα ακροδεκτών και παράμετροι των μπλοκ κώδικα. | `parse`, `compile`, `names`, `params` |
| `web/studio/pyrt.js` | Python για το μπλοκ Python: φόρτωση Pyodide (τοπικό αντίγραφο ή CDN, ή το πακέτο npm στο Node), `make` → `step(t, u)`. | `PyRT.load`, `PyRT.make` |
| `web/studio/metrics.js` | Δείκτες από δεδομένα, χωρίς DOM (τρέχει και στο Node): απόκριση σε βήμα, προγράμματα, σειρά Fourier και THD. | `responseMetrics`, `scheduleEvents`, `harmonics` |
| `web/studio/math.js` | Εμφάνιση αποτελεσμάτων των templates και των ερωτήσεων με πρόβλεψη. | `renderTemplate`, `questionsHTML`, `bindQuestions` |
| `engine/batch.py` | Ο ίδιος κύκλος με το `mna.js`, με `solve_ivp`. Δίοδοι και συγκριτές ως συμβάντα. | `Circuit`, `Ctrl`, `eval_blocks`, `sample`, `next_event`, `simulate` |
| `engine/templates.py` | Υπολογίζει ένα template: εισόδους, βήματα, ελέγχους, πίνακες, ερωτήσεις. | `template_solve`, `_questions` |
| `run.py` | Server: στατικά αρχεία και `ACTIONS` (π.χ. `batch_sim`, `template_solve`, `studio_math`). | `ACTIONS` |

## 2. Ροή δεδομένων

1. **Σχέδιο → project.** Ο `Editor` κρατά `doc = {components, wires}`. Το `project()` στο `app.js` προσθέτει ρυθμίσεις λύτη και scope.
2. **Project → netlist.** Το `MNA.buildNetlist(project)`:
   - ενώνει ακροδέκτες με union-find (σύρματα, πεδία «Πηγή» `in_<pin>`, ετικέτες Goto/From),
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

## 5. Tests

| Τι | Πώς τρέχει | Τι καλύπτει |
|---|---|---|
| Python unittest | `python -m unittest discover -s tests` | αναλυτικούς engines, templates, server |
| Λύτης browser μέσω Node | από τα `test_studio_sim.py`, `test_tutorials.py`, `test_batch.py`, που καλούν `tests/js/*.js` | `mna.js`, tutorials, ισοδυναμία με SciPy |
| Περιβάλλον (Playwright) | με server στο 8765: `node tests/ui/<flow>.js http://127.0.0.1:8765/` από άλλον φάκελο | `studio_flow`, `editor_interactions`, `features_flow`, `blocks_flow`, `wiring_flow` |
| Χάρτης κώδικα | `python tools/codemap.py --check` | ότι το `CODEMAP.md` είναι ενημερωμένο |
| Αναφορά επαλήθευσης | `python tools/verify.py` (γράφει) ή `--check` (ελέγχει) | ότι κάθε τιμή του `VERIFICATION.md` είναι μέσα στην ανοχή της |

Ο CI (`.github/workflows/ci.yml`) τα τρέχει όλα σε κάθε push στα `main` και `lab-*` και σε κάθε pull request. Σε κάθε push φτιάχνει και το zip της έκδοσης ως artifact. Σε tag `v*` το ανεβάζει και ως release.

## 6. Ροή εργασίας

1. Νέο branch για κάθε έκδοση: `lab-<έκδοση>`. Το `main` αλλάζει μόνο με έγκριση.
2. Πριν από την αλλαγή: εντοπισμός στο §3 και στο `CODEMAP.md`, και ανάγνωση μόνο αυτών των σημείων.
3. Μετά την αλλαγή:
   - tests, τα 4 UI flows,
   - `python tools/codemap.py`,
   - ενημέρωση README (πίνακας εκδόσεων) και ROADMAP (§0),
   - έκδοση στο `engine/__init__.py` και στο footer του `web/index.html`.
4. Zip: `git archive --format=zip --prefix=Power_Converter_Lab_<έκδοση>/ -o Power_Converter_Lab_<έκδοση>.zip lab-<έκδοση>`. Το φτιάχνει και ο CI.
