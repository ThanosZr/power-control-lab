# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 1043 |
| `web/studio/editor.js` | 416 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 735 |
| `web/studio/parts.js` | 280 |
| `web/studio/pyrt.js` | 55 |
| `web/studio/scope.js` | 165 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 458 |
| `run.py` | 138 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1187 |
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
| `tests/test_studio_sim.py` | 269 |
| `tests/test_templates.py` | 174 |
| `tests/test_tutorials.py` | 255 |
| `tests/js/batch_requests.js` | 47 |
| `tests/js/sim_cases.js` | 185 |
| `tests/js/tutorial_cases.js` | 61 |
| `tests/ui/blocks_flow.js` | 134 |
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
| 208 | `INT` | Ολοκληρωτής |
| 212 | `LPF` | Βαθυπερατό 1ης τάξης |
| 215 | `CLARKE` | Clarke abc → αβ |
| 218 | `ICLARKE` | Clarke αβ → abc |
| 221 | `PARK` | Park αβ → dq |
| 223 | `IPARK` | Park dq → αβ |
| 225 | `PLL` | PLL (τριφασικό) |
| 230 | `TAGO` | Ετικέτα: προς (Goto) |
| 233 | `TAGI` | Ετικέτα: από (From) |
| 236 | `DISP` | Ένδειξη |

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
| 377 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 399 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 413 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 455 | `empty` | Νέο | Κενό κύκλωμα |

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
| 74 | function | `blkUnit` |
| 79 | function | `outsOf` |
| 81 | function | `chanLabel` |
| 86 | function | `addProbe` |
| 87 | function | `flash` |
| 88 | function | `signalsFor` |
| 95 | function | `renderChannels` |
| 111 | function | `renderMeasure` |
| 120 | function | `MeasureUnit` |
| 123 | function | `simKey` |
| 124 | function | `perSeries` |
| 125 | function | `refFor` |
| 126 | const fn | `sched` |
| 130 | function | `metricsFor` |
| 134 | function | `metricsRows` |
| 139 | function | `eventMetricsHTML` |
| 141 | function | `renderMetricsPanel` |
| 152 | function | `rawSeries` |
| 155 | function | `autoF1` |
| 157 | function | `renderFFT` |
| 179 | function | `cellZ` |
| 181 | function | `renderEISForm` |
| 182 | const fn | `opt` |
| 186 | function | `runEIS` |
| 194 | function | `drawEIS` |
| 213 | function | `perSamples` |
| 215 | function | `periodText` |
| 216 | const fn | `svgPlot` |
| 218 | function | `pcmMapFn` |
| 220 | const fn | `z` |
| 223 | function | `renderPoincare` |
| 239 | function | `bfParams` |
| 241 | function | `renderBifurcationForm` |
| 245 | function | `runBifurcation` |
| 252 | function | `drawBifurcation` |
| 262 | function | `niceTop` |
| 265 | function | `btStatus` |
| 266 | function | `parseStep` |
| 267 | function | `runBatch` |
| 283 | function | `clearBatch` |
| 285 | function | `meanPL` |
| 287 | function | `ringTrace` |
| 289 | function | `compareHTML` |
| 299 | function | `renderBatch` |
| 304 | function | `parseCSV` |
| 306 | const fn | `cells` |
| 307 | const fn | `num` |
| 313 | const fn | `normName` |
| 314 | function | `renderCsvMap` |
| 315 | const fn | `auto` |
| 321 | function | `applyCsv` |
| 326 | function | `renderCsv` |
| 328 | function | `clearCsv` |
| 330 | function | `sampleCompareHTML` |
| 343 | function | `liveChange` |
| 345 | function | `renderLiveLog` |
| 351 | function | `changesToSchedule` |
| 353 | const fn | `f` |
| 358 | function | `updateLivePanel` |
| 363 | function | `setLivePanel` |
| 366 | function | `switchesOf` |
| 369 | function | `addPulses` |
| 371 | function | `pulseKeys` |
| 372 | function | `refreshControls` |
| 374 | const fn | `phase` |
| 403 | const fn | `setD` |
| 414 | const fn | `setPh` |
| 430 | function | `closeInspector` |
| 431 | function | `placePopup` |
| 432 | function | `fieldHTML` |
| 439 | function | `openInspector` |
| 446 | const fn | `wired` |
| 452 | const fn | `apply` |
| 462 | function | `openWireInspector` |
| 477 | function | `closeMenu` |
| 478 | function | `openMenu` |
| 493 | function | `updateHover` |
| 507 | function | `renderPalette` |
| 514 | function | `tutorial` |
| 517 | function | `circuitSig` |
| 527 | function | `tutorialRef` |
| 528 | function | `theoryValidity` |
| 534 | function | `staleBanner` |
| 537 | function | `bindRestore` |
| 538 | function | `loadTutorial` |
| 542 | function | `applyProject` |
| 551 | function | `renderTutorial` |
| 561 | function | `gallery` |
| 567 | function | `api` |
| 568 | function | `paramsOf` |
| 569 | function | `avgOver` |
| 572 | function | `simValue` |
| 578 | function | `lastPP` |
| 580 | function | `runTheory` |
| 592 | function | `cmpRows` |
| 593 | function | `stepsHTML` |
| 594 | function | `renderTheory` |
| 624 | function | `rippleDev` |
| 626 | function | `periodAvgAt` |
| 628 | function | `samplingTheory` |
| 637 | const fn | `lastAt` |
| 659 | function | `polyTheory` |
| 666 | const fn | `frac` |
| 695 | function | `lastPeriods` |
| 696 | function | `evalOrderHTML` |
| 699 | function | `blocksTheory` |
| 714 | function | `pcmTheory` |
| 740 | function | `codeTheory` |
| 750 | function | `eisTheory` |
| 752 | const fn | `ser` |
| 764 | function | `chaosTheory` |
| 776 | function | `dcDriveTheory` |
| 777 | const fn | `per` |
| 778 | const fn | `cross` |
| 807 | function | `formulaTheory` |
| 861 | function | `nodeAvg` |
| 867 | function | `circuitForMath` |
| 898 | function | `scheduleMath` |
| 899 | function | `batteryKey` |
| 901 | function | `mathChoices` |
| 902 | const fn | `prim` |
| 904 | function | `renderMathChoices` |
| 906 | function | `runTemplate` |
| 912 | function | `runMath` |
| 933 | function | `saveLocal` |
| 934 | function | `download` |
| 935 | function | `exportCSV` |
| 941 | function | `syncScopeInputs` |
| 942 | function | `setSpeed` |
| 945 | function | `openSettings` |
| 946 | const fn | `sel` |
| 947 | const fn | `chk` |
| 963 | function | `boot` |
| 995 | const fn | `mv` |
| 996 | const fn | `up` |
| 997 | const fn | `navOpen` |
| 1003 | const fn | `probeSel` |
| 1040 | function | `renderTheoryLive` |

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
| 186 | method | `renderLabels` |
| 193 | method | `renderWires` |
| 207 | method | `pathD` |
| 211 | method | `midLabel` |
| 212 | method | `renderPins` |
| 222 | method | `renderSel` |
| 224 | method | `setLive` |
| 225 | method | `updateLive` |
| 232 | method | `drawArrows` |
| 242 | method | `world` |
| 244 | method | `hitAt` |
| 245 | method | `hitOf` |
| 247 | method | `down` |
| 266 | method | `move` |
| 279 | method | `up` |
| 293 | method | `cancelDrag` |
| 294 | method | `hoverPin` |
| 296 | method | `dbl` |
| 297 | method | `menu` |
| 299 | method | `wheel` |
| 304 | method | `key` |
| 323 | method | `beginDrag` |
| 330 | method | `dragMove` |
| 340 | method | `endDrag` |
| 344 | method | `dragSeg` |
| 347 | const fn | `stub` |
| 356 | method | `drawMarquee` |
| 359 | method | `marqueeSelect` |
| 362 | const fn | `inside` |
| 368 | method | `beginPlace` |
| 369 | method | `ghost` |
| 371 | method | `finishPlace` |
| 372 | method | `cancelPlace` |
| 374 | method | `startWire` |
| 375 | method | `startWireFrom` |
| 376 | method | `previewWire` |
| 382 | method | `wireClick` |
| 387 | method | `orthoNext` |
| 388 | method | `finishWire` |
| 401 | method | `cancelWire` |
| 403 | method | `splitWire` |
| 413 | method | `wireNetPin` |

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
| 178 | function | `compileSignals` |
| 200 | function | `cmpF` |
| 203 | function | `luFactor` |
| 209 | function | `luSolve` |
| 216 | class | `Sim` |
| 217 | method | `constructor` |
| 219 | method | `basePeriod` |
| 220 | method | `setStep` |
| 221 | method | `load` |
| 249 | method | `reset` |
| 250 | method | `pyBlocks` |
| 256 | method | `setMethod` |
| 257 | method | `setControl` |
| 258 | method | `setBlock` |
| 259 | method | `setHold` |
| 261 | method | `markChange` |
| 263 | method | `channelKeys` |
| 279 | method | `allocRecord` |
| 286 | method | `V` |
| 287 | method | `elCurrent` |
| 291 | method | `computeVals` |
| 314 | method | `recordNow` |
| 322 | method | `closePeriod` |
| 331 | method | `lastPeriod` |
| 332 | method | `now` |
| 337 | method | `gateOf` |
| 343 | method | `rawGate` |
| 354 | method | `carrier` |
| 357 | method | `shGrid` |
| 358 | method | `shNext` |
| 360 | method | `sampleHolds` |
| 365 | method | `samples` |
| 366 | method | `ctrlEdges` |
| 372 | method | `scrU` |
| 373 | method | `scrGate` |
| 374 | method | `scrEdges` |
| 375 | method | `setFiring` |
| 376 | method | `compV` |
| 377 | method | `compI` |
| 379 | method | `dbl` |
| 380 | method | `sampleControllers` |
| 408 | method | `evalBlocks` |
| 463 | method | `blkDue` |
| 465 | method | `zcFrac` |
| 468 | method | `saveState` |
| 470 | method | `restoreState` |
| 472 | method | `gateSig` |
| 476 | method | `values` |
| 484 | method | `assemble` |
| 486 | const fn | `g` |
| 504 | method | `rhs` |
| 506 | const fn | `J` |
| 518 | method | `cplLinearize` |
| 520 | method | `solveOnce` |
| 528 | method | `solve` |
| 538 | method | `check` |
| 545 | method | `commit` |
| 557 | method | `initialSolve` |
| 568 | method | `step` |
| 570 | const fn | `gs` |
| 576 | method | `stepCore` |
| 619 | method | `edgeSolve` |
| 622 | method | `edgePoint` |
| 623 | method | `nextEvent` |
| 629 | const fn | `sch` |
| 645 | method | `spwmCut` |
| 648 | const fn | `sig` |
| 653 | method | `run` |
| 679 | function | `exportForBatch` |
| 683 | const fn | `ci` |
| 684 | const fn | `vd` |
| 685 | const fn | `V` |
| 686 | const fn | `I` |
| 687 | const fn | `rec` |
| 701 | const fn | `clkOf` |
| 718 | function | `sweepPoint` |
| 726 | function | `eisPoint` |

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
| 240 | function | `defaults` |
| 242 | function | `sigPins` |
| 243 | function | `pinsOf` |
| 244 | function | `pinKind` |
| 246 | function | `xf` |
| 247 | function | `pinPos` |
| 249 | function | `pinDir` |
| 254 | function | `cpeParams` |
| 255 | function | `cpeBank` |
| 259 | function | `cpeZ` |
| 260 | function | `cpeZbank` |
| 261 | function | `boxOf` |
| 262 | function | `bbox` |
| 266 | function | `eng` |
| 270 | function | `parseEng` |
| 273 | function | `parseSched` |

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
| 383 | method | `build` |
| 403 | method | `build` |
| 418 | method | `build` |
| 456 | method | `build` |

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
| 316 | method | `Circuit.R` |
| 319 | method | `Circuit.Vsrc` |
| 328 | method | `Circuit.topo` |
| 338 | method | `Circuit.build` |
| 418 | method | `Circuit.bsrc` |
| 433 | method | `Circuit.solve_z` |
| 458 | method | `Circuit.scr_u` |
| 462 | method | `Circuit.scr_gate` |
| 466 | method | `Circuit.scr_edges` |
| 473 | method | `Circuit.gate_state` |
| 486 | method | `Circuit.set_gates` |
| 494 | method | `Circuit.may_turn_on` |
| 498 | method | `Circuit.tolerances` |
| 504 | method | `Circuit.consistent` |
| 530 | method | `Circuit.value` |
| 563 | method | `Circuit.current` |
| 588 | method | `Circuit.prime` |
| 598 | method | `Circuit.sig_in` |
| 602 | method | `Circuit.sh_grid` |
| 614 | method | `Circuit.sh_next` |
| 621 | method | `Circuit.sh_sample` |
| 640 | method | `Circuit.sample` |
| 699 | method | `Circuit.cmp_f` |
| 705 | method | `Circuit.blk_due` |
| 716 | method | `Circuit.eval_blocks` |
| 906 | method | `Circuit.block_events` |
| 931 | method | `Circuit.next_event` |
| 992 | function | `_decimate` |
| 1009 | function | `simulate` |
| 1181 | function | `batch_sim` |

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
