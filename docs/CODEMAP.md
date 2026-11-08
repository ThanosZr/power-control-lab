# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 1079 |
| `web/studio/editor.js` | 417 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 768 |
| `web/studio/parts.js` | 296 |
| `web/studio/pyrt.js` | 55 |
| `web/studio/scope.js` | 165 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 511 |
| `run.py` | 138 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1256 |
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
| `tests/test_batch.py` | 174 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 289 |
| `tests/test_templates.py` | 174 |
| `tests/test_tutorials.py` | 292 |
| `tests/js/batch_requests.js` | 50 |
| `tests/js/sim_cases.js` | 197 |
| `tests/js/tutorial_cases.js` | 65 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/studio_flow.js` | 39 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 29 | `R` | Αντίσταση |
| 33 | `CPE` | CPE / Warburg |
| 39 | `L` | Πηνίο |
| 43 | `C` | Πυκνωτής |
| 47 | `VDC` | Πηγή DC / μπαταρία |
| 53 | `VAC` | Πηγή AC |
| 57 | `VAC3` | Τριφασική πηγή (Y) |
| 62 | `IDC` | Πηγή ρεύματος |
| 68 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 81 | `D` | Δίοδος |
| 85 | `SCR` | Θυρίστορ (SCR) |
| 95 | `XFMR` | Μετασχηματιστής |
| 102 | `CPL` | Φορτίο σταθερής ισχύος |
| 106 | `SH` | Sample & Hold |
| 115 | `GND` | Γείωση |
| 117 | `JUNC` | Κόμβος |
| 118 | `PWM` | PWM / έλεγχος |
| 140 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 150 | `VM` | Βολτόμετρο |
| 152 | `AM` | Αμπερόμετρο (σε σειρά) |
| 154 | `MEAS` | Μέτρηση στοιχείου |
| 157 | `CONST` | Σταθερά / πρόγραμμα |
| 160 | `GAIN` | Κέρδος |
| 162 | `SUM` | Άθροισμα |
| 165 | `MUL` | Γινόμενο |
| 167 | `DIV` | Διαίρεση a/b |
| 170 | `SAT` | Κορεσμός |
| 173 | `CMP` | Συγκριτής |
| 176 | `LOGIC` | Λογική πύλη |
| 179 | `PIB` | PI διακριτός |
| 185 | `UD` | Καθυστέρηση z⁻¹ |
| 188 | `SR` | SR latch |
| 191 | `CLK` | Ρολόι (τετραγωνικό) |
| 194 | `RAMP` | Φέρον / ράμπα |
| 199 | `EXPR` | Έκφραση |
| 203 | `PY` | Μπλοκ Python |
| 208 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 217 | `MOD3` | Διαμορφωτής τριφασικός |
| 220 | `FEST` | Εκτιμητής ροής δρομέα |
| 224 | `INT` | Ολοκληρωτής |
| 228 | `LPF` | Βαθυπερατό 1ης τάξης |
| 231 | `CLARKE` | Clarke abc → αβ |
| 234 | `ICLARKE` | Clarke αβ → abc |
| 237 | `PARK` | Park αβ → dq |
| 239 | `IPARK` | Park dq → αβ |
| 241 | `PLL` | PLL (τριφασικό) |
| 246 | `TAGO` | Ετικέτα: προς (Goto) |
| 249 | `TAGI` | Ετικέτα: από (From) |
| 252 | `DISP` | Ένδειξη |

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
| 387 | `im_vf` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: V/f και διαμόρφωση SPWM, SVPWM, τετραγωνική |
| 400 | `im_foc` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: διανυσματικός έλεγχος, εξασθένιση πεδίου, R̂_R |
| 430 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 452 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 466 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 508 | `empty` | Νέο | Κενό κύκλωμα |

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
| 75 | function | `blkUnit` |
| 80 | function | `outsOf` |
| 82 | function | `chanLabel` |
| 87 | function | `addProbe` |
| 88 | function | `flash` |
| 89 | function | `signalsFor` |
| 96 | function | `renderChannels` |
| 112 | function | `renderMeasure` |
| 121 | function | `MeasureUnit` |
| 124 | function | `simKey` |
| 125 | function | `perSeries` |
| 126 | function | `refFor` |
| 127 | const fn | `sched` |
| 131 | function | `metricsFor` |
| 135 | function | `metricsRows` |
| 140 | function | `eventMetricsHTML` |
| 142 | function | `renderMetricsPanel` |
| 153 | function | `rawSeries` |
| 156 | function | `autoF1` |
| 158 | function | `renderFFT` |
| 180 | function | `cellZ` |
| 182 | function | `renderEISForm` |
| 183 | const fn | `opt` |
| 187 | function | `runEIS` |
| 195 | function | `drawEIS` |
| 214 | function | `perSamples` |
| 216 | function | `periodText` |
| 217 | const fn | `svgPlot` |
| 219 | function | `pcmMapFn` |
| 221 | const fn | `z` |
| 224 | function | `renderPoincare` |
| 240 | function | `bfParams` |
| 242 | function | `renderBifurcationForm` |
| 246 | function | `runBifurcation` |
| 253 | function | `drawBifurcation` |
| 263 | function | `niceTop` |
| 266 | function | `btStatus` |
| 267 | function | `parseStep` |
| 268 | function | `runBatch` |
| 284 | function | `clearBatch` |
| 286 | function | `meanPL` |
| 288 | function | `ringTrace` |
| 290 | function | `compareHTML` |
| 300 | function | `renderBatch` |
| 305 | function | `parseCSV` |
| 307 | const fn | `cells` |
| 308 | const fn | `num` |
| 314 | const fn | `normName` |
| 315 | function | `renderCsvMap` |
| 316 | const fn | `auto` |
| 322 | function | `applyCsv` |
| 327 | function | `renderCsv` |
| 329 | function | `clearCsv` |
| 331 | function | `sampleCompareHTML` |
| 344 | function | `liveChange` |
| 346 | function | `renderLiveLog` |
| 352 | function | `changesToSchedule` |
| 354 | const fn | `f` |
| 359 | function | `updateLivePanel` |
| 364 | function | `setLivePanel` |
| 367 | function | `switchesOf` |
| 370 | function | `addPulses` |
| 372 | function | `pulseKeys` |
| 373 | function | `refreshControls` |
| 375 | const fn | `phase` |
| 404 | const fn | `setD` |
| 415 | const fn | `setPh` |
| 431 | function | `closeInspector` |
| 432 | function | `placePopup` |
| 433 | function | `fieldHTML` |
| 440 | function | `openInspector` |
| 447 | const fn | `wired` |
| 453 | const fn | `apply` |
| 463 | function | `openWireInspector` |
| 478 | function | `closeMenu` |
| 479 | function | `openMenu` |
| 494 | function | `updateHover` |
| 508 | function | `renderPalette` |
| 515 | function | `tutorial` |
| 518 | function | `circuitSig` |
| 528 | function | `tutorialRef` |
| 529 | function | `theoryValidity` |
| 535 | function | `staleBanner` |
| 538 | function | `bindRestore` |
| 539 | function | `loadTutorial` |
| 543 | function | `applyProject` |
| 552 | function | `renderTutorial` |
| 562 | function | `gallery` |
| 568 | function | `api` |
| 569 | function | `paramsOf` |
| 570 | function | `avgOver` |
| 573 | function | `simValue` |
| 579 | function | `lastPP` |
| 581 | function | `runTheory` |
| 593 | function | `cmpRows` |
| 594 | function | `stepsHTML` |
| 595 | function | `renderTheory` |
| 625 | function | `rippleDev` |
| 627 | function | `periodAvgAt` |
| 629 | function | `samplingTheory` |
| 638 | const fn | `lastAt` |
| 660 | function | `polyTheory` |
| 667 | const fn | `frac` |
| 696 | function | `lastPeriods` |
| 697 | function | `evalOrderHTML` |
| 700 | function | `blocksTheory` |
| 715 | function | `pcmTheory` |
| 741 | function | `codeTheory` |
| 751 | function | `eisTheory` |
| 753 | const fn | `ser` |
| 766 | function | `imSteady` |
| 769 | function | `imPar` |
| 770 | function | `phaseRms` |
| 771 | function | `vfTheory` |
| 784 | function | `focTheory` |
| 798 | function | `chaosTheory` |
| 810 | function | `dcDriveTheory` |
| 811 | const fn | `per` |
| 812 | const fn | `cross` |
| 841 | function | `formulaTheory` |
| 897 | function | `nodeAvg` |
| 903 | function | `circuitForMath` |
| 934 | function | `scheduleMath` |
| 935 | function | `batteryKey` |
| 937 | function | `mathChoices` |
| 938 | const fn | `prim` |
| 940 | function | `renderMathChoices` |
| 942 | function | `runTemplate` |
| 948 | function | `runMath` |
| 969 | function | `saveLocal` |
| 970 | function | `download` |
| 971 | function | `exportCSV` |
| 977 | function | `syncScopeInputs` |
| 978 | function | `setSpeed` |
| 981 | function | `openSettings` |
| 982 | const fn | `sel` |
| 983 | const fn | `chk` |
| 999 | function | `boot` |
| 1031 | const fn | `mv` |
| 1032 | const fn | `up` |
| 1033 | const fn | `navOpen` |
| 1039 | const fn | `probeSel` |
| 1076 | function | `renderTheoryLive` |

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
| 171 | method | `renderPart` |
| 172 | method | `valueText` |
| 187 | method | `renderLabels` |
| 194 | method | `renderWires` |
| 208 | method | `pathD` |
| 212 | method | `midLabel` |
| 213 | method | `renderPins` |
| 223 | method | `renderSel` |
| 225 | method | `setLive` |
| 226 | method | `updateLive` |
| 233 | method | `drawArrows` |
| 243 | method | `world` |
| 245 | method | `hitAt` |
| 246 | method | `hitOf` |
| 248 | method | `down` |
| 267 | method | `move` |
| 280 | method | `up` |
| 294 | method | `cancelDrag` |
| 295 | method | `hoverPin` |
| 297 | method | `dbl` |
| 298 | method | `menu` |
| 300 | method | `wheel` |
| 305 | method | `key` |
| 324 | method | `beginDrag` |
| 331 | method | `dragMove` |
| 341 | method | `endDrag` |
| 345 | method | `dragSeg` |
| 348 | const fn | `stub` |
| 357 | method | `drawMarquee` |
| 360 | method | `marqueeSelect` |
| 363 | const fn | `inside` |
| 369 | method | `beginPlace` |
| 370 | method | `ghost` |
| 372 | method | `finishPlace` |
| 373 | method | `cancelPlace` |
| 375 | method | `startWire` |
| 376 | method | `startWireFrom` |
| 377 | method | `previewWire` |
| 383 | method | `wireClick` |
| 388 | method | `orthoNext` |
| 389 | method | `finishWire` |
| 402 | method | `cancelWire` |
| 404 | method | `splitWire` |
| 414 | method | `wireNetPin` |

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
| 22 | class | `NetlistError` |
| 25 | function | `buildNetlist` |
| 29 | const fn | `union` |
| 40 | const fn | `nm` |
| 59 | const fn | `sn` |
| 68 | const fn | `node` |
| 69 | const fn | `internal` |
| 72 | const fn | `mkBlock` |
| 78 | const fn | `add` |
| 79 | const fn | `series` |
| 188 | function | `compileSignals` |
| 210 | function | `cmpF` |
| 213 | function | `luFactor` |
| 219 | function | `luSolve` |
| 226 | class | `Sim` |
| 227 | method | `constructor` |
| 229 | method | `basePeriod` |
| 230 | method | `setStep` |
| 231 | method | `load` |
| 261 | method | `reset` |
| 264 | method | `imStep` |
| 269 | method | `imSources` |
| 270 | method | `pyBlocks` |
| 276 | method | `setMethod` |
| 277 | method | `setControl` |
| 278 | method | `setBlock` |
| 279 | method | `setHold` |
| 281 | method | `markChange` |
| 283 | method | `channelKeys` |
| 299 | method | `allocRecord` |
| 306 | method | `V` |
| 307 | method | `elCurrent` |
| 311 | method | `computeVals` |
| 334 | method | `recordNow` |
| 342 | method | `closePeriod` |
| 351 | method | `lastPeriod` |
| 352 | method | `now` |
| 357 | method | `gateOf` |
| 363 | method | `rawGate` |
| 374 | method | `carrier` |
| 377 | method | `shGrid` |
| 378 | method | `shNext` |
| 380 | method | `sampleHolds` |
| 385 | method | `samples` |
| 386 | method | `ctrlEdges` |
| 392 | method | `scrU` |
| 393 | method | `scrGate` |
| 394 | method | `scrEdges` |
| 395 | method | `setFiring` |
| 396 | method | `compV` |
| 397 | method | `compI` |
| 399 | method | `dbl` |
| 400 | method | `sampleControllers` |
| 428 | method | `evalBlocks` |
| 490 | method | `blkDue` |
| 492 | method | `zcFrac` |
| 495 | method | `saveState` |
| 497 | method | `restoreState` |
| 499 | method | `gateSig` |
| 503 | method | `values` |
| 512 | method | `assemble` |
| 514 | const fn | `g` |
| 532 | method | `rhs` |
| 534 | const fn | `J` |
| 546 | method | `cplLinearize` |
| 548 | method | `solveOnce` |
| 556 | method | `solve` |
| 566 | method | `check` |
| 573 | method | `commit` |
| 586 | method | `initialSolve` |
| 597 | method | `step` |
| 599 | const fn | `gs` |
| 605 | method | `stepCore` |
| 648 | method | `edgeSolve` |
| 651 | method | `edgePoint` |
| 652 | method | `nextEvent` |
| 658 | const fn | `sch` |
| 674 | method | `spwmCut` |
| 677 | const fn | `sig` |
| 682 | method | `run` |
| 708 | function | `exportForBatch` |
| 712 | const fn | `ci` |
| 713 | const fn | `vd` |
| 714 | const fn | `V` |
| 715 | const fn | `I` |
| 716 | const fn | `rec` |
| 730 | const fn | `clkOf` |
| 751 | function | `sweepPoint` |
| 759 | function | `eisPoint` |

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
| 256 | function | `defaults` |
| 258 | function | `sigPins` |
| 259 | function | `pinsOf` |
| 260 | function | `pinKind` |
| 262 | function | `xf` |
| 263 | function | `pinPos` |
| 265 | function | `pinDir` |
| 270 | function | `cpeParams` |
| 271 | function | `cpeBank` |
| 275 | function | `cpeZ` |
| 276 | function | `cpeZbank` |
| 277 | function | `boxOf` |
| 278 | function | `bbox` |
| 282 | function | `eng` |
| 286 | function | `parseEng` |
| 289 | function | `parseSched` |

### `web/studio/pyrt.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 38 | function | `pyMessage` |
| 41 | method | `load` |
| 50 | method | `make` |

### `web/studio/scope.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 12 | const fn | `isLogic` |
| 13 | function | `niceStep` |
| 14 | function | `fmtT` |
| 15 | const fn | `eng` |
| 16 | class | `Scope` |
| 17 | method | `constructor` |
| 28 | method | `attach` |
| 30 | method | `setRefs` |
| 31 | method | `refRange` |
| 34 | method | `nav` |
| 35 | const fn | `clamp` |
| 46 | method | `resize` |
| 49 | method | `unitOf` |
| 53 | method | `resolve` |
| 54 | method | `channels` |
| 55 | method | `addChannel` |
| 58 | method | `removeChannel` |
| 59 | method | `moveChannel` |
| 61 | method | `windowSec` |
| 62 | method | `viewRange` |
| 64 | method | `ringIndex` |
| 65 | method | `ringStart` |
| 67 | method | `eachRaw` |
| 69 | method | `eachPeriod` |
| 70 | method | `valueAt` |
| 73 | method | `stats` |
| 78 | method | `usePeriods` |
| 80 | method | `panTo` |
| 81 | method | `zoomAt` |
| 83 | method | `cursorAt` |
| 85 | method | `plotW` |
| 86 | method | `drawSamples` |
| 90 | method | `draw` |
| 113 | const fn | `Y` |
| 130 | const fn | `flush` |

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
| 391 | method | `build` |
| 405 | method | `build` |
| 436 | method | `build` |
| 456 | method | `build` |
| 471 | method | `build` |
| 509 | method | `build` |

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
| 51 | function | `_f` |
| 59 | class | `Ctrl` |
| 63 | method | `Ctrl.__init__` |
| 88 | method | `Ctrl.dbl` |
| 91 | method | `Ctrl.raw` |
| 111 | method | `Ctrl.gate` |
| 123 | method | `Ctrl.carrier_at` |
| 134 | method | `Ctrl.edges` |
| 154 | function | `_lut` |
| 165 | function | `eval_ast` |
| 191 | function | `make_python_block` |
| 222 | class | `Circuit` |
| 223 | method | `Circuit.__init__` |
| 331 | method | `Circuit.R` |
| 334 | method | `Circuit.im_e` |
| 343 | method | `Circuit.im_deriv` |
| 354 | method | `Circuit.Vsrc` |
| 365 | method | `Circuit.topo` |
| 375 | method | `Circuit.build` |
| 455 | method | `Circuit.bsrc` |
| 470 | method | `Circuit.solve_z` |
| 495 | method | `Circuit.scr_u` |
| 499 | method | `Circuit.scr_gate` |
| 503 | method | `Circuit.scr_edges` |
| 510 | method | `Circuit.gate_state` |
| 523 | method | `Circuit.set_gates` |
| 531 | method | `Circuit.may_turn_on` |
| 535 | method | `Circuit.tolerances` |
| 541 | method | `Circuit.consistent` |
| 567 | method | `Circuit.value` |
| 600 | method | `Circuit.current` |
| 625 | method | `Circuit.prime` |
| 635 | method | `Circuit.sig_in` |
| 639 | method | `Circuit.sh_grid` |
| 651 | method | `Circuit.sh_next` |
| 658 | method | `Circuit.sh_sample` |
| 677 | method | `Circuit.sample` |
| 736 | method | `Circuit.cmp_f` |
| 742 | method | `Circuit.blk_due` |
| 753 | method | `Circuit.eval_blocks` |
| 974 | method | `Circuit.block_events` |
| 999 | method | `Circuit.next_event` |
| 1060 | function | `_decimate` |
| 1077 | function | `simulate` |
| 1250 | function | `batch_sim` |

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
