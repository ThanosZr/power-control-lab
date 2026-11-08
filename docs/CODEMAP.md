# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 900 |
| `web/studio/editor.js` | 415 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 75 |
| `web/studio/mna.js` | 699 |
| `web/studio/parts.js` | 243 |
| `web/studio/scope.js` | 165 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 382 |
| `run.py` | 134 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1087 |
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
| `tests/test_batch.py` | 159 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 244 |
| `tests/test_templates.py` | 168 |
| `tests/test_tutorials.py` | 201 |
| `tests/js/batch_requests.js` | 38 |
| `tests/js/sim_cases.js` | 167 |
| `tests/js/tutorial_cases.js` | 49 |
| `tests/ui/blocks_flow.js` | 94 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/studio_flow.js` | 39 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 21 | `R` | Αντίσταση |
| 25 | `L` | Πηνίο |
| 29 | `C` | Πυκνωτής |
| 33 | `VDC` | Πηγή DC / μπαταρία |
| 37 | `VAC` | Πηγή AC |
| 41 | `VAC3` | Τριφασική πηγή (Y) |
| 46 | `IDC` | Πηγή ρεύματος |
| 50 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 63 | `D` | Δίοδος |
| 67 | `SCR` | Θυρίστορ (SCR) |
| 77 | `XFMR` | Μετασχηματιστής |
| 84 | `CPL` | Φορτίο σταθερής ισχύος |
| 88 | `SH` | Sample & Hold |
| 97 | `GND` | Γείωση |
| 99 | `JUNC` | Κόμβος |
| 100 | `PWM` | PWM / έλεγχος |
| 122 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 132 | `VM` | Βολτόμετρο |
| 134 | `AM` | Αμπερόμετρο (σε σειρά) |
| 136 | `MEAS` | Μέτρηση στοιχείου |
| 139 | `CONST` | Σταθερά / πρόγραμμα |
| 142 | `GAIN` | Κέρδος |
| 144 | `SUM` | Άθροισμα |
| 147 | `MUL` | Γινόμενο |
| 149 | `DIV` | Διαίρεση a/b |
| 152 | `SAT` | Κορεσμός |
| 155 | `CMP` | Συγκριτής |
| 158 | `LOGIC` | Λογική πύλη |
| 161 | `PIB` | PI διακριτός |
| 167 | `UD` | Καθυστέρηση z⁻¹ |
| 170 | `SR` | SR latch |
| 173 | `CLK` | Ρολόι (τετραγωνικό) |
| 176 | `RAMP` | Φέρον / ράμπα |
| 181 | `INT` | Ολοκληρωτής |
| 185 | `LPF` | Βαθυπερατό 1ης τάξης |
| 188 | `CLARKE` | Clarke abc → αβ |
| 191 | `ICLARKE` | Clarke αβ → abc |
| 194 | `PARK` | Park αβ → dq |
| 196 | `IPARK` | Park dq → αβ |
| 198 | `PLL` | PLL (τριφασικό) |
| 203 | `TAGO` | Ετικέτα: προς (Goto) |
| 206 | `TAGI` | Ετικέτα: από (From) |
| 209 | `DISP` | Ένδειξη |

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
| 320 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 337 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 379 | `empty` | Νέο | Κενό κύκλωμα |

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
| 30 | function | `play` |
| 31 | function | `pause` |
| 32 | function | `reset` |
| 33 | function | `stepT` |
| 34 | function | `runToEnd` |
| 35 | const fn | `chunk` |
| 37 | function | `loop` |
| 46 | function | `draw` |
| 47 | function | `navRange` |
| 48 | function | `updateClock` |
| 52 | function | `liveOf` |
| 69 | function | `blkUnit` |
| 74 | function | `outsOf` |
| 76 | function | `chanLabel` |
| 80 | function | `addProbe` |
| 81 | function | `flash` |
| 82 | function | `signalsFor` |
| 88 | function | `renderChannels` |
| 104 | function | `renderMeasure` |
| 113 | function | `MeasureUnit` |
| 116 | function | `simKey` |
| 117 | function | `perSeries` |
| 118 | function | `refFor` |
| 119 | const fn | `sched` |
| 123 | function | `metricsFor` |
| 127 | function | `metricsRows` |
| 132 | function | `eventMetricsHTML` |
| 134 | function | `renderMetricsPanel` |
| 145 | function | `rawSeries` |
| 148 | function | `autoF1` |
| 150 | function | `renderFFT` |
| 169 | function | `niceTop` |
| 172 | function | `btStatus` |
| 173 | function | `parseStep` |
| 174 | function | `runBatch` |
| 190 | function | `clearBatch` |
| 192 | function | `meanPL` |
| 194 | function | `ringTrace` |
| 196 | function | `compareHTML` |
| 206 | function | `renderBatch` |
| 211 | function | `parseCSV` |
| 213 | const fn | `cells` |
| 214 | const fn | `num` |
| 220 | const fn | `normName` |
| 221 | function | `renderCsvMap` |
| 222 | const fn | `auto` |
| 228 | function | `applyCsv` |
| 233 | function | `renderCsv` |
| 235 | function | `clearCsv` |
| 237 | function | `sampleCompareHTML` |
| 250 | function | `liveChange` |
| 252 | function | `renderLiveLog` |
| 258 | function | `changesToSchedule` |
| 260 | const fn | `f` |
| 265 | function | `updateLivePanel` |
| 270 | function | `setLivePanel` |
| 273 | function | `switchesOf` |
| 276 | function | `addPulses` |
| 278 | function | `pulseKeys` |
| 279 | function | `refreshControls` |
| 281 | const fn | `phase` |
| 310 | const fn | `setD` |
| 321 | const fn | `setPh` |
| 337 | function | `closeInspector` |
| 338 | function | `placePopup` |
| 339 | function | `fieldHTML` |
| 345 | function | `openInspector` |
| 352 | const fn | `wired` |
| 358 | const fn | `apply` |
| 368 | function | `openWireInspector` |
| 383 | function | `closeMenu` |
| 384 | function | `openMenu` |
| 399 | function | `updateHover` |
| 413 | function | `renderPalette` |
| 420 | function | `tutorial` |
| 423 | function | `circuitSig` |
| 433 | function | `tutorialRef` |
| 434 | function | `theoryValidity` |
| 440 | function | `staleBanner` |
| 443 | function | `bindRestore` |
| 444 | function | `loadTutorial` |
| 448 | function | `applyProject` |
| 457 | function | `renderTutorial` |
| 467 | function | `gallery` |
| 473 | function | `api` |
| 474 | function | `paramsOf` |
| 475 | function | `avgOver` |
| 478 | function | `simValue` |
| 484 | function | `lastPP` |
| 486 | function | `runTheory` |
| 498 | function | `cmpRows` |
| 499 | function | `stepsHTML` |
| 500 | function | `renderTheory` |
| 530 | function | `rippleDev` |
| 532 | function | `periodAvgAt` |
| 534 | function | `samplingTheory` |
| 543 | const fn | `lastAt` |
| 565 | function | `polyTheory` |
| 572 | const fn | `frac` |
| 601 | function | `lastPeriods` |
| 602 | function | `evalOrderHTML` |
| 605 | function | `blocksTheory` |
| 620 | function | `pcmTheory` |
| 638 | function | `dcDriveTheory` |
| 639 | const fn | `per` |
| 640 | const fn | `cross` |
| 669 | function | `formulaTheory` |
| 720 | function | `nodeAvg` |
| 726 | function | `circuitForMath` |
| 757 | function | `scheduleMath` |
| 758 | function | `batteryKey` |
| 760 | function | `mathChoices` |
| 761 | const fn | `prim` |
| 763 | function | `renderMathChoices` |
| 765 | function | `runTemplate` |
| 771 | function | `runMath` |
| 792 | function | `saveLocal` |
| 793 | function | `download` |
| 794 | function | `exportCSV` |
| 800 | function | `syncScopeInputs` |
| 801 | function | `setSpeed` |
| 804 | function | `openSettings` |
| 805 | const fn | `sel` |
| 806 | const fn | `chk` |
| 822 | function | `boot` |
| 852 | const fn | `mv` |
| 853 | const fn | `up` |
| 854 | const fn | `navOpen` |
| 860 | const fn | `probeSel` |
| 897 | function | `renderTheoryLive` |

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
| 185 | method | `renderLabels` |
| 192 | method | `renderWires` |
| 206 | method | `pathD` |
| 210 | method | `midLabel` |
| 211 | method | `renderPins` |
| 221 | method | `renderSel` |
| 223 | method | `setLive` |
| 224 | method | `updateLive` |
| 231 | method | `drawArrows` |
| 241 | method | `world` |
| 243 | method | `hitAt` |
| 244 | method | `hitOf` |
| 246 | method | `down` |
| 265 | method | `move` |
| 278 | method | `up` |
| 292 | method | `cancelDrag` |
| 293 | method | `hoverPin` |
| 295 | method | `dbl` |
| 296 | method | `menu` |
| 298 | method | `wheel` |
| 303 | method | `key` |
| 322 | method | `beginDrag` |
| 329 | method | `dragMove` |
| 339 | method | `endDrag` |
| 343 | method | `dragSeg` |
| 346 | const fn | `stub` |
| 355 | method | `drawMarquee` |
| 358 | method | `marqueeSelect` |
| 361 | const fn | `inside` |
| 367 | method | `beginPlace` |
| 368 | method | `ghost` |
| 370 | method | `finishPlace` |
| 371 | method | `cancelPlace` |
| 373 | method | `startWire` |
| 374 | method | `startWireFrom` |
| 375 | method | `previewWire` |
| 381 | method | `wireClick` |
| 386 | method | `orthoNext` |
| 387 | method | `finishWire` |
| 400 | method | `cancelWire` |
| 402 | method | `splitWire` |
| 412 | method | `wireNetPin` |

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

### `web/studio/mna.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 18 | const fn | `schedAt` |
| 19 | const fn | `num` |
| 21 | class | `NetlistError` |
| 24 | function | `buildNetlist` |
| 28 | const fn | `union` |
| 39 | const fn | `nm` |
| 58 | const fn | `sn` |
| 67 | const fn | `node` |
| 68 | const fn | `internal` |
| 71 | const fn | `mkBlock` |
| 77 | const fn | `add` |
| 78 | const fn | `series` |
| 170 | function | `compileSignals` |
| 192 | function | `cmpF` |
| 195 | function | `luFactor` |
| 201 | function | `luSolve` |
| 208 | class | `Sim` |
| 209 | method | `constructor` |
| 211 | method | `basePeriod` |
| 212 | method | `setStep` |
| 213 | method | `load` |
| 240 | method | `reset` |
| 241 | method | `setMethod` |
| 242 | method | `setControl` |
| 243 | method | `setBlock` |
| 244 | method | `setHold` |
| 246 | method | `markChange` |
| 248 | method | `channelKeys` |
| 264 | method | `allocRecord` |
| 271 | method | `V` |
| 272 | method | `elCurrent` |
| 276 | method | `computeVals` |
| 299 | method | `recordNow` |
| 307 | method | `closePeriod` |
| 316 | method | `lastPeriod` |
| 317 | method | `now` |
| 322 | method | `gateOf` |
| 328 | method | `rawGate` |
| 339 | method | `carrier` |
| 342 | method | `shGrid` |
| 343 | method | `shNext` |
| 345 | method | `sampleHolds` |
| 350 | method | `samples` |
| 351 | method | `ctrlEdges` |
| 357 | method | `scrU` |
| 358 | method | `scrGate` |
| 359 | method | `scrEdges` |
| 360 | method | `setFiring` |
| 361 | method | `compV` |
| 362 | method | `compI` |
| 364 | method | `dbl` |
| 365 | method | `sampleControllers` |
| 393 | method | `evalBlocks` |
| 444 | method | `blkDue` |
| 446 | method | `zcFrac` |
| 449 | method | `saveState` |
| 451 | method | `restoreState` |
| 453 | method | `gateSig` |
| 457 | method | `values` |
| 465 | method | `assemble` |
| 467 | const fn | `g` |
| 485 | method | `rhs` |
| 487 | const fn | `J` |
| 499 | method | `cplLinearize` |
| 501 | method | `solveOnce` |
| 509 | method | `solve` |
| 519 | method | `check` |
| 526 | method | `commit` |
| 538 | method | `initialSolve` |
| 549 | method | `step` |
| 551 | const fn | `gs` |
| 557 | method | `stepCore` |
| 600 | method | `edgeSolve` |
| 603 | method | `edgePoint` |
| 604 | method | `nextEvent` |
| 610 | const fn | `sch` |
| 626 | method | `spwmCut` |
| 629 | const fn | `sig` |
| 634 | method | `run` |
| 660 | function | `exportForBatch` |
| 664 | const fn | `ci` |
| 665 | const fn | `vd` |
| 666 | const fn | `V` |
| 667 | const fn | `I` |
| 668 | const fn | `rec` |
| 682 | const fn | `clkOf` |

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
| 17 | const fn | `CLOCK` |
| 213 | function | `defaults` |
| 215 | function | `sigPins` |
| 216 | function | `pinsOf` |
| 217 | function | `pinKind` |
| 219 | function | `xf` |
| 220 | function | `pinPos` |
| 222 | function | `pinDir` |
| 225 | function | `bbox` |
| 229 | function | `eng` |
| 233 | function | `parseEng` |
| 236 | function | `parseSched` |

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
| 325 | method | `build` |
| 342 | method | `build` |
| 380 | method | `build` |

### `run.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 50 | class | `Handler` |
| 51 | method | `Handler.send` |
| 63 | method | `Handler.do_GET` |
| 82 | method | `Handler.do_POST` |
| 110 | function | `main` |

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
| 146 | class | `Circuit` |
| 147 | method | `Circuit.__init__` |
| 239 | method | `Circuit.R` |
| 242 | method | `Circuit.Vsrc` |
| 248 | method | `Circuit.topo` |
| 258 | method | `Circuit.build` |
| 338 | method | `Circuit.bsrc` |
| 353 | method | `Circuit.solve_z` |
| 378 | method | `Circuit.scr_u` |
| 382 | method | `Circuit.scr_gate` |
| 386 | method | `Circuit.scr_edges` |
| 393 | method | `Circuit.gate_state` |
| 406 | method | `Circuit.set_gates` |
| 414 | method | `Circuit.may_turn_on` |
| 418 | method | `Circuit.tolerances` |
| 424 | method | `Circuit.consistent` |
| 450 | method | `Circuit.value` |
| 483 | method | `Circuit.current` |
| 508 | method | `Circuit.prime` |
| 518 | method | `Circuit.sig_in` |
| 522 | method | `Circuit.sh_grid` |
| 534 | method | `Circuit.sh_next` |
| 541 | method | `Circuit.sh_sample` |
| 560 | method | `Circuit.sample` |
| 619 | method | `Circuit.cmp_f` |
| 625 | method | `Circuit.blk_due` |
| 636 | method | `Circuit.eval_blocks` |
| 810 | method | `Circuit.block_events` |
| 835 | method | `Circuit.next_event` |
| 896 | function | `_decimate` |
| 913 | function | `simulate` |
| 1081 | function | `batch_sim` |

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
