# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 826 |
| `web/studio/editor.js` | 412 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 48 |
| `web/studio/mna.js` | 665 |
| `web/studio/parts.js` | 209 |
| `web/studio/scope.js` | 164 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 339 |
| `run.py` | 134 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1010 |
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
| `tests/test_batch.py` | 137 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 199 |
| `tests/test_templates.py` | 146 |
| `tests/test_tutorials.py` | 171 |
| `tests/js/batch_requests.js` | 24 |
| `tests/js/sim_cases.js` | 138 |
| `tests/js/tutorial_cases.js` | 42 |
| `tests/ui/blocks_flow.js` | 79 |
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
| 122 | `VM` | Βολτόμετρο |
| 124 | `AM` | Αμπερόμετρο (σε σειρά) |
| 126 | `MEAS` | Μέτρηση στοιχείου |
| 129 | `CONST` | Σταθερά / πρόγραμμα |
| 132 | `GAIN` | Κέρδος |
| 134 | `SUM` | Άθροισμα |
| 137 | `MUL` | Γινόμενο |
| 139 | `DIV` | Διαίρεση a/b |
| 142 | `SAT` | Κορεσμός |
| 145 | `CMP` | Συγκριτής |
| 148 | `LOGIC` | Λογική πύλη |
| 151 | `PIB` | PI διακριτός |
| 155 | `UD` | Καθυστέρηση z⁻¹ |
| 158 | `SR` | SR latch |
| 161 | `CLK` | Ρολόι (τετραγωνικό) |
| 164 | `RAMP` | Φέρον / ράμπα |
| 169 | `TAGO` | Ετικέτα: προς (Goto) |
| 172 | `TAGI` | Ετικέτα: από (From) |
| 175 | `DISP` | Ένδειξη |

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
| 336 | `empty` | Νέο | Κενό κύκλωμα |

## API του server (`run.py`, `/api/<action>`)

`analyze`, `batch_sim`, `bidir`, `boundary`, `capacitance`, `curves`, `derivation`, `design`, `envelope`, `inverse`, `linearize`, `model_proof`, `problem`, `solve`, `studio_math`, `sweep`, `switching`, `template_solve`, `validate_circuit`

## Templates δεδομένων (`web/studio/exercises/`)

`buck_design.template.json`, `pcm_slope.template.json`, `pe2_battery.template.json`, `pe2_polyphase.template.json`, `pe2_sampling.template.json`

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
| 67 | function | `blkUnit` |
| 69 | function | `chanLabel` |
| 72 | function | `addProbe` |
| 73 | function | `flash` |
| 74 | function | `signalsFor` |
| 79 | function | `renderChannels` |
| 95 | function | `renderMeasure` |
| 104 | function | `MeasureUnit` |
| 107 | function | `simKey` |
| 108 | function | `perSeries` |
| 109 | function | `refFor` |
| 110 | const fn | `sched` |
| 114 | function | `metricsFor` |
| 118 | function | `metricsRows` |
| 123 | function | `eventMetricsHTML` |
| 125 | function | `renderMetricsPanel` |
| 136 | function | `btStatus` |
| 137 | function | `parseStep` |
| 138 | function | `runBatch` |
| 154 | function | `clearBatch` |
| 156 | function | `meanPL` |
| 158 | function | `ringTrace` |
| 160 | function | `compareHTML` |
| 170 | function | `renderBatch` |
| 175 | function | `parseCSV` |
| 177 | const fn | `cells` |
| 178 | const fn | `num` |
| 184 | const fn | `normName` |
| 185 | function | `renderCsvMap` |
| 186 | const fn | `auto` |
| 192 | function | `applyCsv` |
| 197 | function | `renderCsv` |
| 199 | function | `clearCsv` |
| 201 | function | `sampleCompareHTML` |
| 214 | function | `liveChange` |
| 216 | function | `renderLiveLog` |
| 222 | function | `changesToSchedule` |
| 224 | const fn | `f` |
| 229 | function | `updateLivePanel` |
| 234 | function | `setLivePanel` |
| 237 | function | `switchesOf` |
| 240 | function | `addPulses` |
| 242 | function | `pulseKeys` |
| 243 | function | `refreshControls` |
| 245 | const fn | `phase` |
| 274 | const fn | `setD` |
| 285 | const fn | `setPh` |
| 301 | function | `closeInspector` |
| 302 | function | `placePopup` |
| 303 | function | `fieldHTML` |
| 309 | function | `openInspector` |
| 316 | const fn | `wired` |
| 322 | const fn | `apply` |
| 332 | function | `openWireInspector` |
| 347 | function | `closeMenu` |
| 348 | function | `openMenu` |
| 363 | function | `updateHover` |
| 374 | function | `renderPalette` |
| 381 | function | `tutorial` |
| 384 | function | `circuitSig` |
| 394 | function | `tutorialRef` |
| 395 | function | `theoryValidity` |
| 401 | function | `staleBanner` |
| 404 | function | `bindRestore` |
| 405 | function | `loadTutorial` |
| 409 | function | `applyProject` |
| 418 | function | `renderTutorial` |
| 428 | function | `gallery` |
| 434 | function | `api` |
| 435 | function | `paramsOf` |
| 436 | function | `avgOver` |
| 439 | function | `simValue` |
| 445 | function | `lastPP` |
| 447 | function | `runTheory` |
| 459 | function | `cmpRows` |
| 460 | function | `stepsHTML` |
| 461 | function | `renderTheory` |
| 491 | function | `rippleDev` |
| 493 | function | `periodAvgAt` |
| 495 | function | `samplingTheory` |
| 504 | const fn | `lastAt` |
| 526 | function | `polyTheory` |
| 533 | const fn | `frac` |
| 562 | function | `lastPeriods` |
| 563 | function | `evalOrderHTML` |
| 566 | function | `blocksTheory` |
| 581 | function | `pcmTheory` |
| 597 | function | `formulaTheory` |
| 647 | function | `nodeAvg` |
| 653 | function | `circuitForMath` |
| 684 | function | `scheduleMath` |
| 685 | function | `batteryKey` |
| 687 | function | `mathChoices` |
| 688 | const fn | `prim` |
| 690 | function | `renderMathChoices` |
| 692 | function | `runTemplate` |
| 698 | function | `runMath` |
| 719 | function | `saveLocal` |
| 720 | function | `download` |
| 721 | function | `exportCSV` |
| 727 | function | `syncScopeInputs` |
| 728 | function | `setSpeed` |
| 731 | function | `openSettings` |
| 732 | const fn | `sel` |
| 733 | const fn | `chk` |
| 749 | function | `boot` |
| 778 | const fn | `mv` |
| 779 | const fn | `up` |
| 780 | const fn | `navOpen` |
| 786 | const fn | `probeSel` |
| 823 | function | `renderTheoryLive` |

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
| 182 | method | `renderLabels` |
| 189 | method | `renderWires` |
| 203 | method | `pathD` |
| 207 | method | `midLabel` |
| 208 | method | `renderPins` |
| 218 | method | `renderSel` |
| 220 | method | `setLive` |
| 221 | method | `updateLive` |
| 228 | method | `drawArrows` |
| 238 | method | `world` |
| 240 | method | `hitAt` |
| 241 | method | `hitOf` |
| 243 | method | `down` |
| 262 | method | `move` |
| 275 | method | `up` |
| 289 | method | `cancelDrag` |
| 290 | method | `hoverPin` |
| 292 | method | `dbl` |
| 293 | method | `menu` |
| 295 | method | `wheel` |
| 300 | method | `key` |
| 319 | method | `beginDrag` |
| 326 | method | `dragMove` |
| 336 | method | `endDrag` |
| 340 | method | `dragSeg` |
| 343 | const fn | `stub` |
| 352 | method | `drawMarquee` |
| 355 | method | `marqueeSelect` |
| 358 | const fn | `inside` |
| 364 | method | `beginPlace` |
| 365 | method | `ghost` |
| 367 | method | `finishPlace` |
| 368 | method | `cancelPlace` |
| 370 | method | `startWire` |
| 371 | method | `startWireFrom` |
| 372 | method | `previewWire` |
| 378 | method | `wireClick` |
| 383 | method | `orthoNext` |
| 384 | method | `finishWire` |
| 397 | method | `cancelWire` |
| 399 | method | `splitWire` |
| 409 | method | `wireNetPin` |

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
| 157 | function | `compileSignals` |
| 179 | function | `cmpF` |
| 182 | function | `luFactor` |
| 188 | function | `luSolve` |
| 195 | class | `Sim` |
| 196 | method | `constructor` |
| 198 | method | `basePeriod` |
| 199 | method | `setStep` |
| 200 | method | `load` |
| 226 | method | `reset` |
| 227 | method | `setMethod` |
| 228 | method | `setControl` |
| 229 | method | `setBlock` |
| 230 | method | `setHold` |
| 232 | method | `markChange` |
| 234 | method | `channelKeys` |
| 249 | method | `allocRecord` |
| 256 | method | `V` |
| 257 | method | `elCurrent` |
| 261 | method | `computeVals` |
| 283 | method | `recordNow` |
| 291 | method | `closePeriod` |
| 300 | method | `lastPeriod` |
| 301 | method | `now` |
| 306 | method | `gateOf` |
| 312 | method | `rawGate` |
| 323 | method | `carrier` |
| 326 | method | `shGrid` |
| 327 | method | `shNext` |
| 329 | method | `sampleHolds` |
| 334 | method | `samples` |
| 335 | method | `ctrlEdges` |
| 341 | method | `scrU` |
| 342 | method | `scrGate` |
| 343 | method | `scrEdges` |
| 344 | method | `setFiring` |
| 345 | method | `compV` |
| 346 | method | `compI` |
| 348 | method | `dbl` |
| 349 | method | `sampleControllers` |
| 377 | method | `evalBlocks` |
| 412 | method | `blkDue` |
| 414 | method | `zcFrac` |
| 417 | method | `saveState` |
| 419 | method | `restoreState` |
| 421 | method | `gateSig` |
| 425 | method | `values` |
| 433 | method | `assemble` |
| 435 | const fn | `g` |
| 452 | method | `rhs` |
| 454 | const fn | `J` |
| 466 | method | `cplLinearize` |
| 468 | method | `solveOnce` |
| 476 | method | `solve` |
| 486 | method | `check` |
| 493 | method | `commit` |
| 505 | method | `initialSolve` |
| 516 | method | `step` |
| 518 | const fn | `gs` |
| 524 | method | `stepCore` |
| 567 | method | `edgeSolve` |
| 570 | method | `edgePoint` |
| 571 | method | `nextEvent` |
| 577 | const fn | `sch` |
| 593 | method | `spwmCut` |
| 596 | const fn | `sig` |
| 601 | method | `run` |
| 627 | function | `exportForBatch` |
| 631 | const fn | `ci` |
| 632 | const fn | `vd` |
| 633 | const fn | `V` |
| 634 | const fn | `I` |
| 635 | const fn | `rec` |
| 649 | const fn | `clkOf` |

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
| 179 | function | `defaults` |
| 181 | function | `sigPins` |
| 182 | function | `pinsOf` |
| 183 | function | `pinKind` |
| 185 | function | `xf` |
| 186 | function | `pinPos` |
| 188 | function | `pinDir` |
| 191 | function | `bbox` |
| 195 | function | `eng` |
| 199 | function | `parseEng` |
| 202 | function | `parseSched` |

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
| 52 | method | `resolve` |
| 53 | method | `channels` |
| 54 | method | `addChannel` |
| 57 | method | `removeChannel` |
| 58 | method | `moveChannel` |
| 60 | method | `windowSec` |
| 61 | method | `viewRange` |
| 63 | method | `ringIndex` |
| 64 | method | `ringStart` |
| 66 | method | `eachRaw` |
| 68 | method | `eachPeriod` |
| 69 | method | `valueAt` |
| 72 | method | `stats` |
| 77 | method | `usePeriods` |
| 79 | method | `panTo` |
| 80 | method | `zoomAt` |
| 82 | method | `cursorAt` |
| 84 | method | `plotW` |
| 85 | method | `drawSamples` |
| 89 | method | `draw` |
| 112 | const fn | `Y` |
| 129 | const fn | `flush` |

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
| 337 | method | `build` |

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
| 235 | method | `Circuit.R` |
| 238 | method | `Circuit.Vsrc` |
| 244 | method | `Circuit.topo` |
| 254 | method | `Circuit.build` |
| 322 | method | `Circuit.bsrc` |
| 336 | method | `Circuit.solve_z` |
| 361 | method | `Circuit.scr_u` |
| 365 | method | `Circuit.scr_gate` |
| 369 | method | `Circuit.scr_edges` |
| 376 | method | `Circuit.gate_state` |
| 389 | method | `Circuit.set_gates` |
| 397 | method | `Circuit.may_turn_on` |
| 401 | method | `Circuit.tolerances` |
| 407 | method | `Circuit.consistent` |
| 433 | method | `Circuit.value` |
| 463 | method | `Circuit.current` |
| 488 | method | `Circuit.prime` |
| 498 | method | `Circuit.sig_in` |
| 502 | method | `Circuit.sh_grid` |
| 514 | method | `Circuit.sh_next` |
| 521 | method | `Circuit.sh_sample` |
| 540 | method | `Circuit.sample` |
| 599 | method | `Circuit.cmp_f` |
| 605 | method | `Circuit.blk_due` |
| 616 | method | `Circuit.eval_blocks` |
| 735 | method | `Circuit.block_events` |
| 760 | method | `Circuit.next_event` |
| 819 | function | `_decimate` |
| 836 | function | `simulate` |
| 1004 | function | `batch_sim` |

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
