# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 973 |
| `web/studio/editor.js` | 415 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 80 |
| `web/studio/mna.js` | 706 |
| `web/studio/parts.js` | 243 |
| `web/studio/scope.js` | 165 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 401 |
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
| `tests/test_templates.py` | 174 |
| `tests/test_tutorials.py` | 220 |
| `tests/js/batch_requests.js` | 38 |
| `tests/js/sim_cases.js` | 167 |
| `tests/js/tutorial_cases.js` | 53 |
| `tests/ui/blocks_flow.js` | 109 |
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
| 342 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 356 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 398 | `empty` | Νέο | Κενό κύκλωμα |

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
| 171 | function | `perSamples` |
| 173 | function | `periodText` |
| 174 | const fn | `svgPlot` |
| 176 | function | `pcmMapFn` |
| 178 | const fn | `z` |
| 181 | function | `renderPoincare` |
| 197 | function | `bfParams` |
| 199 | function | `renderBifurcationForm` |
| 203 | function | `runBifurcation` |
| 210 | function | `drawBifurcation` |
| 220 | function | `niceTop` |
| 223 | function | `btStatus` |
| 224 | function | `parseStep` |
| 225 | function | `runBatch` |
| 241 | function | `clearBatch` |
| 243 | function | `meanPL` |
| 245 | function | `ringTrace` |
| 247 | function | `compareHTML` |
| 257 | function | `renderBatch` |
| 262 | function | `parseCSV` |
| 264 | const fn | `cells` |
| 265 | const fn | `num` |
| 271 | const fn | `normName` |
| 272 | function | `renderCsvMap` |
| 273 | const fn | `auto` |
| 279 | function | `applyCsv` |
| 284 | function | `renderCsv` |
| 286 | function | `clearCsv` |
| 288 | function | `sampleCompareHTML` |
| 301 | function | `liveChange` |
| 303 | function | `renderLiveLog` |
| 309 | function | `changesToSchedule` |
| 311 | const fn | `f` |
| 316 | function | `updateLivePanel` |
| 321 | function | `setLivePanel` |
| 324 | function | `switchesOf` |
| 327 | function | `addPulses` |
| 329 | function | `pulseKeys` |
| 330 | function | `refreshControls` |
| 332 | const fn | `phase` |
| 361 | const fn | `setD` |
| 372 | const fn | `setPh` |
| 388 | function | `closeInspector` |
| 389 | function | `placePopup` |
| 390 | function | `fieldHTML` |
| 396 | function | `openInspector` |
| 403 | const fn | `wired` |
| 409 | const fn | `apply` |
| 419 | function | `openWireInspector` |
| 434 | function | `closeMenu` |
| 435 | function | `openMenu` |
| 450 | function | `updateHover` |
| 464 | function | `renderPalette` |
| 471 | function | `tutorial` |
| 474 | function | `circuitSig` |
| 484 | function | `tutorialRef` |
| 485 | function | `theoryValidity` |
| 491 | function | `staleBanner` |
| 494 | function | `bindRestore` |
| 495 | function | `loadTutorial` |
| 499 | function | `applyProject` |
| 508 | function | `renderTutorial` |
| 518 | function | `gallery` |
| 524 | function | `api` |
| 525 | function | `paramsOf` |
| 526 | function | `avgOver` |
| 529 | function | `simValue` |
| 535 | function | `lastPP` |
| 537 | function | `runTheory` |
| 549 | function | `cmpRows` |
| 550 | function | `stepsHTML` |
| 551 | function | `renderTheory` |
| 581 | function | `rippleDev` |
| 583 | function | `periodAvgAt` |
| 585 | function | `samplingTheory` |
| 594 | const fn | `lastAt` |
| 616 | function | `polyTheory` |
| 623 | const fn | `frac` |
| 652 | function | `lastPeriods` |
| 653 | function | `evalOrderHTML` |
| 656 | function | `blocksTheory` |
| 671 | function | `pcmTheory` |
| 697 | function | `chaosTheory` |
| 709 | function | `dcDriveTheory` |
| 710 | const fn | `per` |
| 711 | const fn | `cross` |
| 740 | function | `formulaTheory` |
| 792 | function | `nodeAvg` |
| 798 | function | `circuitForMath` |
| 829 | function | `scheduleMath` |
| 830 | function | `batteryKey` |
| 832 | function | `mathChoices` |
| 833 | const fn | `prim` |
| 835 | function | `renderMathChoices` |
| 837 | function | `runTemplate` |
| 843 | function | `runMath` |
| 864 | function | `saveLocal` |
| 865 | function | `download` |
| 866 | function | `exportCSV` |
| 872 | function | `syncScopeInputs` |
| 873 | function | `setSpeed` |
| 876 | function | `openSettings` |
| 877 | const fn | `sel` |
| 878 | const fn | `chk` |
| 894 | function | `boot` |
| 925 | const fn | `mv` |
| 926 | const fn | `up` |
| 927 | const fn | `navOpen` |
| 933 | const fn | `probeSel` |
| 970 | function | `renderTheoryLive` |

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
| 74 | function | `periodicity` |

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
| 699 | function | `sweepPoint` |

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
| 326 | method | `build` |
| 346 | method | `build` |
| 361 | method | `build` |
| 399 | method | `build` |

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
