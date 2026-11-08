# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 1193 |
| `web/studio/editor.js` | 423 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 858 |
| `web/studio/parts.js` | 464 |
| `web/studio/pyrt.js` | 55 |
| `web/studio/scope.js` | 167 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 621 |
| `run.py` | 138 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1449 |
| `engine/bidir.py` | 564 |
| `engine/boundary.py` | 97 |
| `engine/circuit.py` | 75 |
| `engine/core.py` | 175 |
| `engine/curves.py` | 43 |
| `engine/derivation.py` | 165 |
| `engine/design.py` | 82 |
| `engine/dynamics.py` | 172 |
| `engine/models.py` | 85 |
| `engine/problem.py` | 192 |
| `engine/proof.py` | 65 |
| `engine/studio_math.py` | 81 |
| `engine/templates.py` | 316 |
| `engine/workbench.py` | 129 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_batch.py` | 177 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 443 |
| `tests/test_templates.py` | 174 |
| `tests/test_tutorials.py` | 411 |
| `tests/js/batch_requests.js` | 63 |
| `tests/js/sim_cases.js` | 230 |
| `tests/js/tutorial_cases.js` | 85 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/studio_flow.js` | 39 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 30 | `R` | Αντίσταση |
| 34 | `CPE` | CPE / Warburg |
| 40 | `L` | Πηνίο |
| 44 | `C` | Πυκνωτής |
| 48 | `VDC` | Πηγή DC / μπαταρία |
| 54 | `VAC` | Πηγή AC |
| 58 | `VAC3` | Τριφασική πηγή (Y) |
| 63 | `IDC` | Πηγή ρεύματος |
| 69 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 82 | `D` | Δίοδος |
| 86 | `SCR` | Θυρίστορ (SCR) |
| 96 | `XFMR` | Μετασχηματιστής |
| 104 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 114 | `KL` | Συζευγμένα πηνία (N×N) |
| 125 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 131 | `CPL` | Φορτίο σταθερής ισχύος |
| 135 | `SH` | Sample & Hold |
| 144 | `GND` | Γείωση |
| 146 | `JUNC` | Κόμβος |
| 147 | `PWM` | PWM / έλεγχος |
| 169 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 179 | `VM` | Βολτόμετρο |
| 181 | `AM` | Αμπερόμετρο (σε σειρά) |
| 183 | `MEAS` | Μέτρηση στοιχείου |
| 186 | `CONST` | Σταθερά / πρόγραμμα |
| 189 | `GAIN` | Κέρδος |
| 191 | `SUM` | Άθροισμα |
| 194 | `MUL` | Γινόμενο |
| 196 | `DIV` | Διαίρεση a/b |
| 199 | `SAT` | Κορεσμός |
| 202 | `CMP` | Συγκριτής |
| 205 | `LOGIC` | Λογική πύλη |
| 208 | `PIB` | PI διακριτός |
| 214 | `UD` | Καθυστέρηση z⁻¹ |
| 217 | `SR` | SR latch |
| 220 | `CLK` | Ρολόι (τετραγωνικό) |
| 223 | `RAMP` | Φέρον / ράμπα |
| 228 | `EXPR` | Έκφραση |
| 232 | `PY` | Μπλοκ Python |
| 237 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 247 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 262 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 279 | `MOD3` | Διαμορφωτής τριφασικός |
| 282 | `FEST` | Εκτιμητής ροής δρομέα |
| 286 | `INT` | Ολοκληρωτής |
| 290 | `LPF` | Βαθυπερατό 1ης τάξης |
| 293 | `CLARKE` | Clarke abc → αβ |
| 296 | `ICLARKE` | Clarke αβ → abc |
| 299 | `PARK` | Park αβ → dq |
| 301 | `IPARK` | Park dq → αβ |
| 303 | `PLL` | PLL (τριφασικό) |
| 308 | `TAGO` | Ετικέτα: προς (Goto) |
| 311 | `TAGI` | Ετικέτα: από (From) |
| 314 | `DISP` | Ένδειξη |

## Tutorials (`web/studio/tutorials.js`)

| Γραμμή | id | Ομάδα | Τίτλος |
|---:|---|---|---|
| 23 | `buck` | DC-DC χωρίς απομόνωση | Buck (υποβιβασμός) |
| 35 | `boost` | DC-DC χωρίς απομόνωση | Boost (ανύψωση) |
| 45 | `buck_boost` | DC-DC χωρίς απομόνωση | Buck–boost (αναστροφής) |
| 55 | `cuk` | DC-DC χωρίς απομόνωση | Ćuk |
| 67 | `sepic` | DC-DC χωρίς απομόνωση | SEPIC |
| 79 | `flyback` | DC-DC με απομόνωση | Flyback |
| 107 | `hbridge` | Γέφυρες | Full-bridge DC-DC (H-γέφυρα) |
| 112 | `inverter` | Γέφυρες | Μονοφασικός αντιστροφέας SPWM |
| 118 | `rectifier` | Ανορθωτές | Ανορθωτής γέφυρας → μπαταρία |
| 132 | `buck_vloop` | Έλεγχος | Buck με βρόχο τάσης (PI / PID) |
| 145 | `scr1` | Ανορθωτές | Ελεγχόμενος ανορθωτής γέφυρας (θυρίστορ) |
| 158 | `bridge3` | Ανορθωτές | Τριφασική γέφυρα 6 παλμών |
| 174 | `battery` | Αμφίδρομος · μπαταρία (PE2) | Αμφίδρομος μετατροπέας μπαταρίας |
| 224 | `sampling` | Αμφίδρομος · μπαταρία (PE2) | Άσκηση 2 · Επίδραση δειγματοληψίας |
| 259 | `polyphase` | Αμφίδρομος · μπαταρία (PE2) | Άσκηση 2 · Πολυφασική σχεδίαση |
| 293 | `blocks_loop` | Μπλοκ σημάτων (3.0) | Βρόχος ρεύματος από μπλοκ |
| 321 | `code_loop` | Μπλοκ κώδικα (3.3) | PI σε Python και feedforward με έκφραση |
| 346 | `cell_eis` | Μπαταρίες και EIS (3.3.1) | Δοκιμή κυψέλης: EIS με μετατροπέα |
| 389 | `im_vf` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: V/f και διαμόρφωση SPWM, SVPWM, τετραγωνική |
| 402 | `im_foc` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: διανυσματικός έλεγχος, εξασθένιση πεδίου, R̂_R |
| 455 | `synrm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μαγνητικής αντίστασης (SynRM): ευθυγράμμιση, έλεγχος dq, MTPA |
| 481 | `pmsm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μόνιμων μαγνητών (PMSM / IPMSM): i_d = 0 και MTPA |
| 497 | `srm` | Ηλεκτρική κίνηση (3.6) | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM 8/6): γωνίες, υστέρηση, βρόχος ψ–i |
| 528 | `lightning` | Κεραυνικά (3.5) | Κεραυνικό ρεύμα Heidler: 10/350, 1/200, 0,25/100 μs |
| 540 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 562 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 576 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 618 | `empty` | Νέο | Κενό κύκλωμα |

## API του server (`run.py`, `/api/<action>`)

`analyze`, `batch_sim`, `bidir`, `boundary`, `capacitance`, `curves`, `derivation`, `design`, `envelope`, `inverse`, `linearize`, `model_proof`, `problem`, `solve`, `studio_math`, `sweep`, `switching`, `template_solve`, `validate_circuit`

## Templates δεδομένων (`web/studio/exercises/`)

`buck_design.template.json`, `dc_drive.template.json`, `pcm_slope.template.json`, `pe2_battery.template.json`, `pe2_polyphase.template.json`, `pe2_sampling.template.json`

## Συναρτήσεις ανά αρχείο

### `web/studio/app.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 3 | const fn | `$` |
| 5 | const fn | `esc` |
| 6 | const fn | `fmt` |
| 12 | function | `loadSettings` |
| 13 | function | `saveSettings` |
| 16 | function | `notice` |
| 17 | function | `warnings` |
| 20 | function | `project` |
| 21 | function | `buildSim` |
| 34 | function | `play` |
| 35 | function | `pause` |
| 36 | function | `reset` |
| 37 | function | `stepT` |
| 38 | function | `runToEnd` |
| 39 | const fn | `chunk` |
| 41 | function | `loop` |
| 50 | function | `draw` |
| 51 | function | `navRange` |
| 52 | function | `updateClock` |
| 56 | function | `liveOf` |
| 78 | function | `blkUnit` |
| 83 | function | `outsOf` |
| 85 | function | `chanLabel` |
| 92 | function | `addProbe` |
| 93 | function | `flash` |
| 94 | function | `signalsFor` |
| 102 | function | `renderChannels` |
| 118 | function | `renderMeasure` |
| 127 | function | `MeasureUnit` |
| 130 | function | `simKey` |
| 131 | function | `perSeries` |
| 132 | function | `refFor` |
| 133 | const fn | `sched` |
| 137 | function | `metricsFor` |
| 141 | function | `metricsRows` |
| 146 | function | `eventMetricsHTML` |
| 148 | function | `renderMetricsPanel` |
| 159 | function | `rawSeries` |
| 162 | function | `autoF1` |
| 164 | function | `renderFFT` |
| 186 | function | `cellZ` |
| 188 | function | `renderEISForm` |
| 189 | const fn | `opt` |
| 193 | function | `runEIS` |
| 201 | function | `drawEIS` |
| 220 | function | `perSamples` |
| 222 | function | `periodText` |
| 223 | const fn | `svgPlot` |
| 225 | function | `pcmMapFn` |
| 227 | const fn | `z` |
| 230 | function | `renderPoincare` |
| 246 | function | `bfParams` |
| 248 | function | `renderBifurcationForm` |
| 252 | function | `runBifurcation` |
| 259 | function | `drawBifurcation` |
| 269 | function | `niceTop` |
| 272 | function | `btStatus` |
| 273 | function | `parseStep` |
| 274 | function | `runBatch` |
| 290 | function | `clearBatch` |
| 292 | function | `meanPL` |
| 294 | function | `ringTrace` |
| 296 | function | `compareHTML` |
| 306 | function | `renderBatch` |
| 311 | function | `parseCSV` |
| 313 | const fn | `cells` |
| 314 | const fn | `num` |
| 320 | const fn | `normName` |
| 321 | function | `renderCsvMap` |
| 322 | const fn | `auto` |
| 328 | function | `applyCsv` |
| 333 | function | `renderCsv` |
| 335 | function | `clearCsv` |
| 337 | function | `sampleCompareHTML` |
| 350 | function | `liveChange` |
| 352 | function | `renderLiveLog` |
| 358 | function | `changesToSchedule` |
| 360 | const fn | `f` |
| 365 | function | `updateLivePanel` |
| 370 | function | `setLivePanel` |
| 373 | function | `switchesOf` |
| 376 | function | `addPulses` |
| 378 | function | `pulseKeys` |
| 379 | function | `refreshControls` |
| 381 | const fn | `phase` |
| 410 | const fn | `setD` |
| 421 | const fn | `setPh` |
| 437 | function | `closeInspector` |
| 438 | function | `placePopup` |
| 439 | function | `fieldHTML` |
| 446 | function | `openInspector` |
| 453 | const fn | `wired` |
| 459 | const fn | `apply` |
| 469 | function | `openWireInspector` |
| 484 | function | `closeMenu` |
| 485 | function | `openMenu` |
| 500 | function | `updateHover` |
| 514 | function | `renderPalette` |
| 521 | function | `tutorial` |
| 524 | function | `circuitSig` |
| 534 | function | `tutorialRef` |
| 535 | function | `theoryValidity` |
| 541 | function | `staleBanner` |
| 544 | function | `bindRestore` |
| 545 | function | `loadTutorial` |
| 549 | function | `applyProject` |
| 558 | function | `renderTutorial` |
| 568 | function | `gallery` |
| 574 | function | `api` |
| 575 | function | `paramsOf` |
| 576 | function | `avgOver` |
| 579 | function | `simValue` |
| 585 | function | `lastPP` |
| 587 | function | `runTheory` |
| 599 | function | `cmpRows` |
| 600 | function | `stepsHTML` |
| 601 | function | `renderTheory` |
| 631 | function | `rippleDev` |
| 633 | function | `periodAvgAt` |
| 635 | function | `samplingTheory` |
| 644 | const fn | `lastAt` |
| 666 | function | `polyTheory` |
| 673 | const fn | `frac` |
| 702 | function | `lastPeriods` |
| 703 | function | `evalOrderHTML` |
| 706 | function | `blocksTheory` |
| 721 | function | `pcmTheory` |
| 747 | function | `codeTheory` |
| 757 | function | `eisTheory` |
| 759 | const fn | `ser` |
| 772 | function | `imSteady` |
| 775 | function | `imPar` |
| 776 | function | `phaseRms` |
| 777 | function | `vfTheory` |
| 790 | function | `focTheory` |
| 807 | function | `synTheory` |
| 826 | const fn | `need` |
| 846 | function | `pmTheory` |
| 848 | const fn | `mtpa` |
| 864 | function | `srmTheory` |
| 879 | const fn | `curve` |
| 890 | function | `lgTheory` |
| 901 | const fn | `cr` |
| 908 | function | `chaosTheory` |
| 920 | function | `dcDriveTheory` |
| 921 | const fn | `per` |
| 922 | const fn | `cross` |
| 951 | function | `formulaTheory` |
| 1011 | function | `nodeAvg` |
| 1017 | function | `circuitForMath` |
| 1048 | function | `scheduleMath` |
| 1049 | function | `batteryKey` |
| 1051 | function | `mathChoices` |
| 1052 | const fn | `prim` |
| 1054 | function | `renderMathChoices` |
| 1056 | function | `runTemplate` |
| 1062 | function | `runMath` |
| 1083 | function | `saveLocal` |
| 1084 | function | `download` |
| 1085 | function | `exportCSV` |
| 1091 | function | `syncScopeInputs` |
| 1092 | function | `setSpeed` |
| 1095 | function | `openSettings` |
| 1096 | const fn | `sel` |
| 1097 | const fn | `chk` |
| 1113 | function | `boot` |
| 1145 | const fn | `mv` |
| 1146 | const fn | `up` |
| 1147 | const fn | `navOpen` |
| 1153 | const fn | `probeSel` |
| 1190 | function | `renderTheoryLive` |

### `web/studio/editor.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | const fn | `snap` |
| 11 | const fn | `same` |
| 12 | const fn | `esc` |
| 14 | function | `normalize` |
| 19 | const fn | `orth` |
| 20 | class | `MinHeap` |
| 21 | method | `pop` |
| 24 | class | `Editor` |
| 25 | method | `constructor` |
| 48 | method | `comp` |
| 49 | method | `wire` |
| 50 | method | `newId` |
| 51 | method | `pin` |
| 52 | method | `wirePts` |
| 53 | method | `setWirePts` |
| 54 | method | `snapshot` |
| 55 | method | `remember` |
| 56 | method | `undo` |
| 57 | method | `redo` |
| 58 | method | `cleanSel` |
| 59 | method | `load` |
| 63 | method | `export` |
| 64 | method | `changed` |
| 65 | method | `selection` |
| 66 | method | `select` |
| 67 | method | `addPart` |
| 73 | method | `setParams` |
| 77 | method | `dropDangling` |
| 79 | method | `netKinds` |
| 84 | method | `setWireProps` |
| 85 | method | `deleteSel` |
| 91 | method | `tidyJunctions` |
| 101 | method | `rotateSel` |
| 103 | method | `mirrorSel` |
| 105 | method | `captureWires` |
| 106 | method | `refitWires` |
| 107 | method | `copySel` |
| 108 | method | `paste` |
| 118 | method | `astar` |
| 126 | const fn | `idx` |
| 128 | const fn | `dirIndex` |
| 131 | const fn | `h` |
| 145 | method | `simpleRoute` |
| 148 | method | `route` |
| 152 | method | `adjustEnd` |
| 159 | method | `applyView` |
| 163 | method | `fit` |
| 165 | method | `extent` |
| 167 | method | `render` |
| 168 | method | `partSVG` |
| 174 | method | `renderPart` |
| 175 | method | `valueText` |
| 193 | method | `renderLabels` |
| 200 | method | `renderWires` |
| 214 | method | `pathD` |
| 218 | method | `midLabel` |
| 219 | method | `renderPins` |
| 229 | method | `renderSel` |
| 231 | method | `setLive` |
| 232 | method | `updateLive` |
| 239 | method | `drawArrows` |
| 249 | method | `world` |
| 251 | method | `hitAt` |
| 252 | method | `hitOf` |
| 254 | method | `down` |
| 273 | method | `move` |
| 286 | method | `up` |
| 300 | method | `cancelDrag` |
| 301 | method | `hoverPin` |
| 303 | method | `dbl` |
| 304 | method | `menu` |
| 306 | method | `wheel` |
| 311 | method | `key` |
| 330 | method | `beginDrag` |
| 337 | method | `dragMove` |
| 347 | method | `endDrag` |
| 351 | method | `dragSeg` |
| 354 | const fn | `stub` |
| 363 | method | `drawMarquee` |
| 366 | method | `marqueeSelect` |
| 369 | const fn | `inside` |
| 375 | method | `beginPlace` |
| 376 | method | `ghost` |
| 378 | method | `finishPlace` |
| 379 | method | `cancelPlace` |
| 381 | method | `startWire` |
| 382 | method | `startWireFrom` |
| 383 | method | `previewWire` |
| 389 | method | `wireClick` |
| 394 | method | `orthoNext` |
| 395 | method | `finishWire` |
| 408 | method | `cancelWire` |
| 410 | method | `splitWire` |
| 420 | method | `wireNetPin` |

### `web/studio/expr.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 9 | function | `lut` |
| 15 | class | `ExprError` |
| 16 | function | `tokens` |
| 20 | function | `parse` |
| 21 | const fn | `peek` |
| 22 | const fn | `expr` |
| 23 | const fn | `bin` |
| 24 | const fn | `unary` |
| 25 | const fn | `power` |
| 27 | function | `atom` |
| 36 | function | `compile` |
| 51 | function | `names` |
| 53 | function | `params` |

### `web/studio/math.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 7 | const fn | `esc` |
| 8 | const fn | `fmt` |
| 9 | const fn | `eng` |
| 10 | const fn | `mm` |
| 11 | const fn | `step` |
| 18 | const fn | `canvas` |
| 19 | function | `nice` |
| 20 | function | `draw` |
| 22 | const fn | `tx` |
| 25 | const fn | `X` |
| 37 | function | `drawAll` |
| 39 | function | `tabs` |
| 46 | function | `renderConverter` |
| 72 | function | `renderExercise` |
| 85 | const fn | `progLoad` |
| 86 | const fn | `progSave` |
| 87 | function | `progMark` |
| 88 | const fn | `near` |
| 89 | function | `qCard` |
| 94 | function | `questionsHTML` |
| 96 | function | `bindQuestions` |
| 97 | const fn | `fmtA` |
| 98 | const fn | `simLine` |
| 99 | const fn | `solution` |
| 101 | const fn | `set` |
| 121 | function | `renderTemplate` |
| 122 | const fn | `srcBadge` |
| 125 | const fn | `block` |

### `web/studio/metrics.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 13 | function | `responseMetrics` |
| 40 | function | `scheduleEvents` |
| 42 | const fn | `add` |
| 50 | function | `harmonics` |
| 56 | const fn | `at` |
| 74 | function | `periodicity` |
| 81 | function | `detrend` |
| 82 | function | `impedance` |

### `web/studio/mna.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 19 | const fn | `schedAt` |
| 20 | const fn | `num` |
| 22 | const fn | `numList` |
| 27 | function | `smPort` |
| 31 | function | `smOut` |
| 34 | class | `NetlistError` |
| 37 | function | `buildNetlist` |
| 41 | const fn | `union` |
| 52 | const fn | `nm` |
| 71 | const fn | `sn` |
| 80 | const fn | `node` |
| 81 | const fn | `internal` |
| 84 | const fn | `mkBlock` |
| 90 | const fn | `add` |
| 91 | const fn | `series` |
| 228 | function | `compileSignals` |
| 250 | function | `cmpF` |
| 254 | function | `stampM` |
| 256 | function | `luFactor` |
| 262 | function | `luSolve` |
| 269 | class | `Sim` |
| 270 | method | `constructor` |
| 272 | method | `basePeriod` |
| 274 | method | `setStep` |
| 275 | method | `load` |
| 310 | method | `reset` |
| 313 | method | `imStep` |
| 320 | method | `smStep` |
| 322 | method | `srmStep` |
| 323 | method | `srmOutputs` |
| 324 | method | `smOutputs` |
| 325 | method | `imSources` |
| 326 | method | `pyBlocks` |
| 332 | method | `setMethod` |
| 333 | method | `setControl` |
| 334 | method | `setBlock` |
| 335 | method | `setHold` |
| 337 | method | `markChange` |
| 339 | method | `channelKeys` |
| 357 | method | `allocRecord` |
| 364 | method | `V` |
| 365 | method | `elCurrent` |
| 369 | method | `portI` |
| 371 | method | `computeVals` |
| 396 | method | `recordNow` |
| 404 | method | `closePeriod` |
| 413 | method | `lastPeriod` |
| 414 | method | `now` |
| 419 | method | `gateOf` |
| 425 | method | `rawGate` |
| 436 | method | `carrier` |
| 439 | method | `shGrid` |
| 440 | method | `shNext` |
| 442 | method | `sampleHolds` |
| 447 | method | `samples` |
| 448 | method | `ctrlEdges` |
| 454 | method | `scrU` |
| 455 | method | `scrGate` |
| 456 | method | `scrEdges` |
| 457 | method | `setFiring` |
| 458 | method | `compV` |
| 459 | method | `compI` |
| 461 | method | `dbl` |
| 462 | method | `sampleControllers` |
| 490 | method | `evalBlocks` |
| 554 | method | `blkDue` |
| 556 | method | `zcFrac` |
| 559 | method | `saveState` |
| 561 | method | `restoreState` |
| 564 | method | `gateSig` |
| 568 | method | `values` |
| 583 | method | `assemble` |
| 585 | const fn | `g` |
| 605 | method | `rhs` |
| 607 | const fn | `J` |
| 622 | method | `cplLinearize` |
| 624 | method | `solveOnce` |
| 632 | method | `solve` |
| 642 | method | `check` |
| 649 | method | `commit` |
| 666 | method | `initialSolve` |
| 677 | method | `step` |
| 679 | const fn | `gs` |
| 685 | method | `stepCore` |
| 728 | method | `edgeSolve` |
| 731 | method | `edgePoint` |
| 732 | method | `nextEvent` |
| 738 | const fn | `sch` |
| 754 | method | `spwmCut` |
| 757 | const fn | `sig` |
| 762 | method | `run` |
| 788 | function | `exportForBatch` |
| 797 | const fn | `ci` |
| 798 | const fn | `vd` |
| 799 | const fn | `V` |
| 800 | const fn | `I` |
| 801 | const fn | `portRec` |
| 802 | const fn | `rec` |
| 818 | const fn | `clkOf` |
| 841 | function | `sweepPoint` |
| 849 | function | `eisPoint` |

### `web/studio/parts.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 6 | const fn | `num` |
| 7 | const fn | `sel` |
| 8 | const fn | `txt` |
| 9 | const fn | `ref` |
| 10 | const fn | `bool` |
| 12 | const fn | `I` |
| 13 | const fn | `xe` |
| 14 | const fn | `sb` |
| 15 | const fn | `tx` |
| 16 | const fn | `sl` |
| 19 | const fn | `codeIO` |
| 20 | const fn | `codeH` |
| 21 | const fn | `pyIns` |
| 22 | const fn | `codeDraw` |
| 25 | const fn | `CLOCK` |
| 318 | function | `defaults` |
| 320 | function | `elPins` |
| 321 | function | `sigPins` |
| 322 | function | `pinsOf` |
| 325 | function | `parseMat` |
| 327 | function | `nPorts` |
| 328 | function | `portY` |
| 329 | function | `portPins` |
| 330 | function | `portBox` |
| 332 | function | `posDef` |
| 334 | function | `symmetric` |
| 335 | function | `matInv` |
| 340 | function | `klMatrix` |
| 351 | function | `kgMatrix` |
| 359 | function | `srmGeo` |
| 361 | function | `srmSpins` |
| 363 | function | `srmPins` |
| 365 | function | `satD` |
| 366 | function | `satDinv` |
| 367 | function | `srmAlignedPsi` |
| 368 | function | `srmModelPsi` |
| 369 | function | `srmTableText` |
| 372 | function | `srmMag` |
| 388 | function | `chkMag` |
| 390 | function | `srmA` |
| 393 | function | `seg` |
| 394 | function | `srmPsi` |
| 396 | function | `srmCur` |
| 398 | function | `srmTorque` |
| 401 | function | `srmCoenergy` |
| 405 | function | `waveShape` |
| 406 | function | `waveAt` |
| 408 | function | `waveMeasure` |
| 411 | const fn | `cross` |
| 414 | function | `waveFit` |
| 415 | const fn | `res` |
| 422 | function | `lightningWave` |
| 426 | function | `pinKind` |
| 428 | function | `xf` |
| 429 | function | `pinPos` |
| 431 | function | `pinDir` |
| 436 | function | `cpeParams` |
| 437 | function | `cpeBank` |
| 441 | function | `cpeZ` |
| 442 | function | `cpeZbank` |
| 443 | function | `boxOf` |
| 444 | function | `bbox` |
| 448 | function | `eng` |
| 452 | function | `parseEng` |
| 455 | function | `parseSched` |

### `web/studio/pyrt.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 38 | function | `pyMessage` |
| 41 | method | `load` |
| 50 | method | `make` |

### `web/studio/scope.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 14 | const fn | `isLogic` |
| 15 | function | `niceStep` |
| 16 | function | `fmtT` |
| 17 | const fn | `eng` |
| 18 | class | `Scope` |
| 19 | method | `constructor` |
| 30 | method | `attach` |
| 32 | method | `setRefs` |
| 33 | method | `refRange` |
| 36 | method | `nav` |
| 37 | const fn | `clamp` |
| 48 | method | `resize` |
| 51 | method | `unitOf` |
| 55 | method | `resolve` |
| 56 | method | `channels` |
| 57 | method | `addChannel` |
| 60 | method | `removeChannel` |
| 61 | method | `moveChannel` |
| 63 | method | `windowSec` |
| 64 | method | `viewRange` |
| 66 | method | `ringIndex` |
| 67 | method | `ringStart` |
| 69 | method | `eachRaw` |
| 71 | method | `eachPeriod` |
| 72 | method | `valueAt` |
| 75 | method | `stats` |
| 80 | method | `usePeriods` |
| 82 | method | `panTo` |
| 83 | method | `zoomAt` |
| 85 | method | `cursorAt` |
| 87 | method | `plotW` |
| 88 | method | `drawSamples` |
| 92 | method | `draw` |
| 115 | const fn | `Y` |
| 132 | const fn | `flush` |

### `web/studio/templates.js`

_(χωρίς συναρτήσεις)_

### `web/studio/tutorials.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 5 | const fn | `C` |
| 6 | const fn | `J` |
| 7 | const fn | `pin` |
| 8 | const fn | `project` |
| 9 | const fn | `gnd` |
| 11 | function | `piGains` |
| 16 | function | `steadyStart` |
| 27 | method | `build` |
| 39 | method | `build` |
| 49 | method | `build` |
| 59 | method | `build` |
| 71 | method | `build` |
| 83 | method | `build` |
| 98 | function | `hbridge` |
| 111 | method | `build` |
| 116 | method | `build` |
| 122 | method | `build` |
| 131 | function | `vloopGains` |
| 136 | method | `build` |
| 149 | method | `build` |
| 162 | method | `build` |
| 163 | const fn | `dev` |
| 183 | method | `build` |
| 194 | const fn | `bus` |
| 222 | function | `samplingPhase` |
| 234 | method | `build` |
| 253 | function | `rippleDev` |
| 256 | function | `polyDesign` |
| 258 | function | `polyCancel` |
| 270 | method | `build` |
| 299 | method | `build` |
| 326 | method | `build` |
| 351 | method | `build` |
| 378 | function | `invIM` |
| 393 | method | `build` |
| 407 | method | `build` |
| 432 | const fn | `r4` |
| 436 | function | `smFoc` |
| 462 | method | `build` |
| 486 | method | `build` |
| 502 | method | `build` |
| 532 | method | `build` |
| 546 | method | `build` |
| 566 | method | `build` |
| 581 | method | `build` |
| 619 | method | `build` |

### `run.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 51 | class | `Handler` |
| 52 | method | `Handler.send` |
| 64 | method | `Handler.do_GET` |
| 83 | method | `Handler.do_POST` |
| 114 | function | `main` |

### `engine/__init__.py`

_(χωρίς συναρτήσεις)_

### `engine/analysis.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 12 | class | `InputError` |
| 16 | function | `number` |
| 29 | function | `config` |
| 53 | function | `resolve_fixed_duty` |
| 91 | function | `math_record` |
| 97 | function | `duty_and_boundary` |
| 116 | function | `steady` |
| 225 | function | `solution_steps` |
| 253 | function | `inverse` |

### `engine/batch.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 33 | class | `BatchError` |
| 37 | function | `sched_at` |
| 51 | function | `wave_at` |
| 63 | function | `sat_d` |
| 70 | function | `sat_d_inv` |
| 82 | function | `_f` |
| 90 | class | `Ctrl` |
| 94 | method | `Ctrl.__init__` |
| 119 | method | `Ctrl.dbl` |
| 122 | method | `Ctrl.raw` |
| 142 | method | `Ctrl.gate` |
| 154 | method | `Ctrl.carrier_at` |
| 165 | method | `Ctrl.edges` |
| 185 | function | `_lut` |
| 196 | function | `eval_ast` |
| 222 | function | `make_python_block` |
| 253 | class | `Circuit` |
| 254 | method | `Circuit.__init__` |
| 399 | method | `Circuit.R` |
| 402 | method | `Circuit.im_e` |
| 411 | method | `Circuit.im_deriv` |
| 424 | method | `Circuit.sm_cur` |
| 436 | method | `Circuit.sm_ports` |
| 441 | method | `Circuit.sm_deriv` |
| 456 | method | `Circuit.srm_A` |
| 461 | method | `Circuit._seg` |
| 465 | method | `Circuit.srm_cur` |
| 472 | method | `Circuit.srm_torque` |
| 481 | method | `Circuit.srm_currents` |
| 486 | method | `Circuit.srm_deriv` |
| 496 | method | `Circuit.Vsrc` |
| 507 | method | `Circuit.topo` |
| 517 | method | `Circuit.build` |
| 607 | method | `Circuit.bsrc` |
| 634 | method | `Circuit.solve_z` |
| 659 | method | `Circuit.scr_u` |
| 663 | method | `Circuit.scr_gate` |
| 667 | method | `Circuit.scr_edges` |
| 674 | method | `Circuit.gate_state` |
| 687 | method | `Circuit.set_gates` |
| 695 | method | `Circuit.may_turn_on` |
| 699 | method | `Circuit.tolerances` |
| 705 | method | `Circuit.consistent` |
| 731 | method | `Circuit.value` |
| 767 | method | `Circuit.current` |
| 803 | method | `Circuit.prime` |
| 813 | method | `Circuit.sig_in` |
| 817 | method | `Circuit.sh_grid` |
| 829 | method | `Circuit.sh_next` |
| 836 | method | `Circuit.sh_sample` |
| 855 | method | `Circuit.sample` |
| 914 | method | `Circuit.cmp_f` |
| 920 | method | `Circuit.blk_due` |
| 931 | method | `Circuit.eval_blocks` |
| 1163 | method | `Circuit.block_events` |
| 1188 | method | `Circuit.next_event` |
| 1249 | function | `_decimate` |
| 1266 | function | `simulate` |
| 1443 | function | `batch_sim` |

### `engine/bidir.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 43 | function | `config` |
| 97 | function | `above` |
| 101 | function | `sides` |
| 105 | function | `il_from_pbus` |
| 110 | function | `mode` |
| 121 | function | `op` |
| 140 | function | `vst_points` |
| 144 | function | `labels` |
| 150 | function | `maximize_on_window` |
| 165 | function | `load_average` |
| 189 | function | `q2` |
| 213 | function | `grid` |
| 218 | function | `worst` |
| 223 | function | `q3` |
| 285 | function | `q4` |
| 375 | function | `q5` |
| 405 | function | `control` |
| 467 | function | `v_bus_from_source` |
| 474 | function | `profile_at` |
| 481 | function | `system` |
| 552 | function | `solve` |

### `engine/boundary.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 18 | function | `solve_boundary` |

### `engine/circuit.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 24 | function | `recognize` |
| 68 | function | `validated` |

### `engine/core.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 13 | class | `InputError` |
| 17 | function | `number` |
| 31 | class | `_MathML` |
| 33 | method | `_MathML._print_UnevaluatedExpr` |
| 48 | method | `_MathML._print_Mul` |
| 76 | function | `math_record` |
| 85 | function | `n` |
| 101 | function | `held` |
| 153 | function | `equation` |
| 157 | function | `step` |
| 171 | function | `note` |

### `engine/curves.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 8 | function | `operating_curves` |

### `engine/derivation.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 13 | function | `equation` |
| 17 | function | `entry` |
| 23 | function | `explain_operating_point` |
| 162 | function | `derive` |

### `engine/design.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 9 | function | `envelope` |
| 45 | function | `size_components` |

### `engine/dynamics.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | function | `linearize` |
| 45 | function | `dcm_model` |
| 59 | function | `linearize_dcm` |
| 86 | function | `switching` |

### `engine/models.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 17 | class | `Model` |
| 23 | method | `Model.fields` |
| 35 | method | `Model.ccm_gain` |
| 41 | method | `Model.critical` |
| 59 | function | `symbolic_model` |
| 80 | function | `public_catalog` |

### `engine/problem.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 12 | function | `step` |
| 16 | function | `inductance_problem` |
| 115 | function | `capacitor_problem` |
| 146 | function | `solve_problem` |

### `engine/proof.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 9 | function | `model_proof` |

### `engine/studio_math.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 18 | function | `region_steps` |
| 49 | function | `studio_math` |

### `engine/templates.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 50 | function | `eng` |
| 66 | function | `_check_expr` |
| 82 | class | `Evaluator` |
| 83 | method | `Evaluator.__init__` |
| 109 | method | `Evaluator.names` |
| 112 | method | `Evaluator.parse` |
| 121 | method | `Evaluator.num` |
| 135 | method | `Evaluator.truth` |
| 141 | method | `Evaluator.run_steps` |
| 164 | method | `Evaluator.fill` |
| 195 | function | `_case_rows` |
| 217 | function | `_questions` |
| 248 | function | `template_solve` |

### `engine/workbench.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 12 | function | `transition_sweep` |
| 36 | function | `axes` |
| 65 | function | `scenarios` |
| 77 | function | `sweep` |
| 115 | function | `capacitance` |
