# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 992 |
| `web/studio/editor.js` | 416 |
| `web/studio/expr.js` | 54 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 80 |
| `web/studio/mna.js` | 722 |
| `web/studio/parts.js` | 261 |
| `web/studio/pyrt.js` | 55 |
| `web/studio/scope.js` | 165 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 427 |
| `run.py` | 138 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1170 |
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
| `tests/test_studio_sim.py` | 259 |
| `tests/test_templates.py` | 174 |
| `tests/test_tutorials.py` | 238 |
| `tests/js/batch_requests.js` | 42 |
| `tests/js/sim_cases.js` | 173 |
| `tests/js/tutorial_cases.js` | 58 |
| `tests/ui/blocks_flow.js` | 126 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/studio_flow.js` | 39 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 29 | `R` | Αντίσταση |
| 33 | `L` | Πηνίο |
| 37 | `C` | Πυκνωτής |
| 41 | `VDC` | Πηγή DC / μπαταρία |
| 45 | `VAC` | Πηγή AC |
| 49 | `VAC3` | Τριφασική πηγή (Y) |
| 54 | `IDC` | Πηγή ρεύματος |
| 58 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 71 | `D` | Δίοδος |
| 75 | `SCR` | Θυρίστορ (SCR) |
| 85 | `XFMR` | Μετασχηματιστής |
| 92 | `CPL` | Φορτίο σταθερής ισχύος |
| 96 | `SH` | Sample & Hold |
| 105 | `GND` | Γείωση |
| 107 | `JUNC` | Κόμβος |
| 108 | `PWM` | PWM / έλεγχος |
| 130 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 140 | `VM` | Βολτόμετρο |
| 142 | `AM` | Αμπερόμετρο (σε σειρά) |
| 144 | `MEAS` | Μέτρηση στοιχείου |
| 147 | `CONST` | Σταθερά / πρόγραμμα |
| 150 | `GAIN` | Κέρδος |
| 152 | `SUM` | Άθροισμα |
| 155 | `MUL` | Γινόμενο |
| 157 | `DIV` | Διαίρεση a/b |
| 160 | `SAT` | Κορεσμός |
| 163 | `CMP` | Συγκριτής |
| 166 | `LOGIC` | Λογική πύλη |
| 169 | `PIB` | PI διακριτός |
| 175 | `UD` | Καθυστέρηση z⁻¹ |
| 178 | `SR` | SR latch |
| 181 | `CLK` | Ρολόι (τετραγωνικό) |
| 184 | `RAMP` | Φέρον / ράμπα |
| 189 | `EXPR` | Έκφραση |
| 193 | `PY` | Μπλοκ Python |
| 198 | `INT` | Ολοκληρωτής |
| 202 | `LPF` | Βαθυπερατό 1ης τάξης |
| 205 | `CLARKE` | Clarke abc → αβ |
| 208 | `ICLARKE` | Clarke αβ → abc |
| 211 | `PARK` | Park αβ → dq |
| 213 | `IPARK` | Park dq → αβ |
| 215 | `PLL` | PLL (τριφασικό) |
| 220 | `TAGO` | Ετικέτα: προς (Goto) |
| 223 | `TAGI` | Ετικέτα: από (From) |
| 226 | `DISP` | Ένδειξη |

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
| 346 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 368 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 382 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 424 | `empty` | Νέο | Κενό κύκλωμα |

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
| 178 | function | `perSamples` |
| 180 | function | `periodText` |
| 181 | const fn | `svgPlot` |
| 183 | function | `pcmMapFn` |
| 185 | const fn | `z` |
| 188 | function | `renderPoincare` |
| 204 | function | `bfParams` |
| 206 | function | `renderBifurcationForm` |
| 210 | function | `runBifurcation` |
| 217 | function | `drawBifurcation` |
| 227 | function | `niceTop` |
| 230 | function | `btStatus` |
| 231 | function | `parseStep` |
| 232 | function | `runBatch` |
| 248 | function | `clearBatch` |
| 250 | function | `meanPL` |
| 252 | function | `ringTrace` |
| 254 | function | `compareHTML` |
| 264 | function | `renderBatch` |
| 269 | function | `parseCSV` |
| 271 | const fn | `cells` |
| 272 | const fn | `num` |
| 278 | const fn | `normName` |
| 279 | function | `renderCsvMap` |
| 280 | const fn | `auto` |
| 286 | function | `applyCsv` |
| 291 | function | `renderCsv` |
| 293 | function | `clearCsv` |
| 295 | function | `sampleCompareHTML` |
| 308 | function | `liveChange` |
| 310 | function | `renderLiveLog` |
| 316 | function | `changesToSchedule` |
| 318 | const fn | `f` |
| 323 | function | `updateLivePanel` |
| 328 | function | `setLivePanel` |
| 331 | function | `switchesOf` |
| 334 | function | `addPulses` |
| 336 | function | `pulseKeys` |
| 337 | function | `refreshControls` |
| 339 | const fn | `phase` |
| 368 | const fn | `setD` |
| 379 | const fn | `setPh` |
| 395 | function | `closeInspector` |
| 396 | function | `placePopup` |
| 397 | function | `fieldHTML` |
| 404 | function | `openInspector` |
| 411 | const fn | `wired` |
| 417 | const fn | `apply` |
| 427 | function | `openWireInspector` |
| 442 | function | `closeMenu` |
| 443 | function | `openMenu` |
| 458 | function | `updateHover` |
| 472 | function | `renderPalette` |
| 479 | function | `tutorial` |
| 482 | function | `circuitSig` |
| 492 | function | `tutorialRef` |
| 493 | function | `theoryValidity` |
| 499 | function | `staleBanner` |
| 502 | function | `bindRestore` |
| 503 | function | `loadTutorial` |
| 507 | function | `applyProject` |
| 516 | function | `renderTutorial` |
| 526 | function | `gallery` |
| 532 | function | `api` |
| 533 | function | `paramsOf` |
| 534 | function | `avgOver` |
| 537 | function | `simValue` |
| 543 | function | `lastPP` |
| 545 | function | `runTheory` |
| 557 | function | `cmpRows` |
| 558 | function | `stepsHTML` |
| 559 | function | `renderTheory` |
| 589 | function | `rippleDev` |
| 591 | function | `periodAvgAt` |
| 593 | function | `samplingTheory` |
| 602 | const fn | `lastAt` |
| 624 | function | `polyTheory` |
| 631 | const fn | `frac` |
| 660 | function | `lastPeriods` |
| 661 | function | `evalOrderHTML` |
| 664 | function | `blocksTheory` |
| 679 | function | `pcmTheory` |
| 705 | function | `codeTheory` |
| 715 | function | `chaosTheory` |
| 727 | function | `dcDriveTheory` |
| 728 | const fn | `per` |
| 729 | const fn | `cross` |
| 758 | function | `formulaTheory` |
| 811 | function | `nodeAvg` |
| 817 | function | `circuitForMath` |
| 848 | function | `scheduleMath` |
| 849 | function | `batteryKey` |
| 851 | function | `mathChoices` |
| 852 | const fn | `prim` |
| 854 | function | `renderMathChoices` |
| 856 | function | `runTemplate` |
| 862 | function | `runMath` |
| 883 | function | `saveLocal` |
| 884 | function | `download` |
| 885 | function | `exportCSV` |
| 891 | function | `syncScopeInputs` |
| 892 | function | `setSpeed` |
| 895 | function | `openSettings` |
| 896 | const fn | `sel` |
| 897 | const fn | `chk` |
| 913 | function | `boot` |
| 944 | const fn | `mv` |
| 945 | const fn | `up` |
| 946 | const fn | `navOpen` |
| 952 | const fn | `probeSel` |
| 989 | function | `renderTheoryLive` |

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
| 13 | class | `ExprError` |
| 14 | function | `tokens` |
| 18 | function | `parse` |
| 19 | const fn | `peek` |
| 20 | const fn | `expr` |
| 21 | const fn | `bin` |
| 22 | const fn | `unary` |
| 23 | const fn | `power` |
| 25 | function | `atom` |
| 34 | function | `compile` |
| 49 | function | `names` |
| 51 | function | `params` |

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
| 175 | function | `compileSignals` |
| 197 | function | `cmpF` |
| 200 | function | `luFactor` |
| 206 | function | `luSolve` |
| 213 | class | `Sim` |
| 214 | method | `constructor` |
| 216 | method | `basePeriod` |
| 217 | method | `setStep` |
| 218 | method | `load` |
| 246 | method | `reset` |
| 247 | method | `pyBlocks` |
| 253 | method | `setMethod` |
| 254 | method | `setControl` |
| 255 | method | `setBlock` |
| 256 | method | `setHold` |
| 258 | method | `markChange` |
| 260 | method | `channelKeys` |
| 276 | method | `allocRecord` |
| 283 | method | `V` |
| 284 | method | `elCurrent` |
| 288 | method | `computeVals` |
| 311 | method | `recordNow` |
| 319 | method | `closePeriod` |
| 328 | method | `lastPeriod` |
| 329 | method | `now` |
| 334 | method | `gateOf` |
| 340 | method | `rawGate` |
| 351 | method | `carrier` |
| 354 | method | `shGrid` |
| 355 | method | `shNext` |
| 357 | method | `sampleHolds` |
| 362 | method | `samples` |
| 363 | method | `ctrlEdges` |
| 369 | method | `scrU` |
| 370 | method | `scrGate` |
| 371 | method | `scrEdges` |
| 372 | method | `setFiring` |
| 373 | method | `compV` |
| 374 | method | `compI` |
| 376 | method | `dbl` |
| 377 | method | `sampleControllers` |
| 405 | method | `evalBlocks` |
| 460 | method | `blkDue` |
| 462 | method | `zcFrac` |
| 465 | method | `saveState` |
| 467 | method | `restoreState` |
| 469 | method | `gateSig` |
| 473 | method | `values` |
| 481 | method | `assemble` |
| 483 | const fn | `g` |
| 501 | method | `rhs` |
| 503 | const fn | `J` |
| 515 | method | `cplLinearize` |
| 517 | method | `solveOnce` |
| 525 | method | `solve` |
| 535 | method | `check` |
| 542 | method | `commit` |
| 554 | method | `initialSolve` |
| 565 | method | `step` |
| 567 | const fn | `gs` |
| 573 | method | `stepCore` |
| 616 | method | `edgeSolve` |
| 619 | method | `edgePoint` |
| 620 | method | `nextEvent` |
| 626 | const fn | `sch` |
| 642 | method | `spwmCut` |
| 645 | const fn | `sig` |
| 650 | method | `run` |
| 676 | function | `exportForBatch` |
| 680 | const fn | `ci` |
| 681 | const fn | `vd` |
| 682 | const fn | `V` |
| 683 | const fn | `I` |
| 684 | const fn | `rec` |
| 698 | const fn | `clkOf` |
| 715 | function | `sweepPoint` |

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
| 230 | function | `defaults` |
| 232 | function | `sigPins` |
| 233 | function | `pinsOf` |
| 234 | function | `pinKind` |
| 236 | function | `xf` |
| 237 | function | `pinPos` |
| 239 | function | `pinDir` |
| 242 | function | `boxOf` |
| 243 | function | `bbox` |
| 247 | function | `eng` |
| 251 | function | `parseEng` |
| 254 | function | `parseSched` |

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
| 352 | method | `build` |
| 372 | method | `build` |
| 387 | method | `build` |
| 425 | method | `build` |

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
| 32 | class | `BatchError` |
| 36 | function | `sched_at` |
| 50 | function | `_f` |
| 58 | class | `Ctrl` |
| 62 | method | `Ctrl.__init__` |
| 87 | method | `Ctrl.dbl` |
| 90 | method | `Ctrl.raw` |
| 110 | method | `Ctrl.gate` |
| 122 | method | `Ctrl.carrier_at` |
| 133 | method | `Ctrl.edges` |
| 152 | function | `eval_ast` |
| 178 | function | `make_python_block` |
| 209 | class | `Circuit` |
| 210 | method | `Circuit.__init__` |
| 302 | method | `Circuit.R` |
| 305 | method | `Circuit.Vsrc` |
| 311 | method | `Circuit.topo` |
| 321 | method | `Circuit.build` |
| 401 | method | `Circuit.bsrc` |
| 416 | method | `Circuit.solve_z` |
| 441 | method | `Circuit.scr_u` |
| 445 | method | `Circuit.scr_gate` |
| 449 | method | `Circuit.scr_edges` |
| 456 | method | `Circuit.gate_state` |
| 469 | method | `Circuit.set_gates` |
| 477 | method | `Circuit.may_turn_on` |
| 481 | method | `Circuit.tolerances` |
| 487 | method | `Circuit.consistent` |
| 513 | method | `Circuit.value` |
| 546 | method | `Circuit.current` |
| 571 | method | `Circuit.prime` |
| 581 | method | `Circuit.sig_in` |
| 585 | method | `Circuit.sh_grid` |
| 597 | method | `Circuit.sh_next` |
| 604 | method | `Circuit.sh_sample` |
| 623 | method | `Circuit.sample` |
| 682 | method | `Circuit.cmp_f` |
| 688 | method | `Circuit.blk_due` |
| 699 | method | `Circuit.eval_blocks` |
| 889 | method | `Circuit.block_events` |
| 914 | method | `Circuit.next_event` |
| 975 | function | `_decimate` |
| 992 | function | `simulate` |
| 1164 | function | `batch_sim` |

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
