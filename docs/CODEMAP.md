# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 1155 |
| `web/studio/editor.js` | 423 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 832 |
| `web/studio/parts.js` | 392 |
| `web/studio/pyrt.js` | 55 |
| `web/studio/scope.js` | 165 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 586 |
| `run.py` | 138 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1353 |
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
| `tests/test_batch.py` | 176 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 389 |
| `tests/test_templates.py` | 174 |
| `tests/test_tutorials.py` | 371 |
| `tests/js/batch_requests.js` | 59 |
| `tests/js/sim_cases.js` | 222 |
| `tests/js/tutorial_cases.js` | 75 |
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
| 103 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 113 | `KL` | Συζευγμένα πηνία (N×N) |
| 124 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 130 | `CPL` | Φορτίο σταθερής ισχύος |
| 134 | `SH` | Sample & Hold |
| 143 | `GND` | Γείωση |
| 145 | `JUNC` | Κόμβος |
| 146 | `PWM` | PWM / έλεγχος |
| 168 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 178 | `VM` | Βολτόμετρο |
| 180 | `AM` | Αμπερόμετρο (σε σειρά) |
| 182 | `MEAS` | Μέτρηση στοιχείου |
| 185 | `CONST` | Σταθερά / πρόγραμμα |
| 188 | `GAIN` | Κέρδος |
| 190 | `SUM` | Άθροισμα |
| 193 | `MUL` | Γινόμενο |
| 195 | `DIV` | Διαίρεση a/b |
| 198 | `SAT` | Κορεσμός |
| 201 | `CMP` | Συγκριτής |
| 204 | `LOGIC` | Λογική πύλη |
| 207 | `PIB` | PI διακριτός |
| 213 | `UD` | Καθυστέρηση z⁻¹ |
| 216 | `SR` | SR latch |
| 219 | `CLK` | Ρολόι (τετραγωνικό) |
| 222 | `RAMP` | Φέρον / ράμπα |
| 227 | `EXPR` | Έκφραση |
| 231 | `PY` | Μπλοκ Python |
| 236 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 246 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 256 | `MOD3` | Διαμορφωτής τριφασικός |
| 259 | `FEST` | Εκτιμητής ροής δρομέα |
| 263 | `INT` | Ολοκληρωτής |
| 267 | `LPF` | Βαθυπερατό 1ης τάξης |
| 270 | `CLARKE` | Clarke abc → αβ |
| 273 | `ICLARKE` | Clarke αβ → abc |
| 276 | `PARK` | Park αβ → dq |
| 278 | `IPARK` | Park dq → αβ |
| 280 | `PLL` | PLL (τριφασικό) |
| 285 | `TAGO` | Ετικέτα: προς (Goto) |
| 288 | `TAGI` | Ετικέτα: από (From) |
| 291 | `DISP` | Ένδειξη |

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
| 480 | `pmsm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μόνιμων μαγνητών (PMSM / IPMSM): i_d = 0 και MTPA |
| 493 | `lightning` | Κεραυνικά (3.5) | Κεραυνικό ρεύμα Heidler: 10/350, 1/200, 0,25/100 μs |
| 505 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 527 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 541 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 583 | `empty` | Νέο | Κενό κύκλωμα |

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
| 77 | function | `blkUnit` |
| 82 | function | `outsOf` |
| 84 | function | `chanLabel` |
| 90 | function | `addProbe` |
| 91 | function | `flash` |
| 92 | function | `signalsFor` |
| 100 | function | `renderChannels` |
| 116 | function | `renderMeasure` |
| 125 | function | `MeasureUnit` |
| 128 | function | `simKey` |
| 129 | function | `perSeries` |
| 130 | function | `refFor` |
| 131 | const fn | `sched` |
| 135 | function | `metricsFor` |
| 139 | function | `metricsRows` |
| 144 | function | `eventMetricsHTML` |
| 146 | function | `renderMetricsPanel` |
| 157 | function | `rawSeries` |
| 160 | function | `autoF1` |
| 162 | function | `renderFFT` |
| 184 | function | `cellZ` |
| 186 | function | `renderEISForm` |
| 187 | const fn | `opt` |
| 191 | function | `runEIS` |
| 199 | function | `drawEIS` |
| 218 | function | `perSamples` |
| 220 | function | `periodText` |
| 221 | const fn | `svgPlot` |
| 223 | function | `pcmMapFn` |
| 225 | const fn | `z` |
| 228 | function | `renderPoincare` |
| 244 | function | `bfParams` |
| 246 | function | `renderBifurcationForm` |
| 250 | function | `runBifurcation` |
| 257 | function | `drawBifurcation` |
| 267 | function | `niceTop` |
| 270 | function | `btStatus` |
| 271 | function | `parseStep` |
| 272 | function | `runBatch` |
| 288 | function | `clearBatch` |
| 290 | function | `meanPL` |
| 292 | function | `ringTrace` |
| 294 | function | `compareHTML` |
| 304 | function | `renderBatch` |
| 309 | function | `parseCSV` |
| 311 | const fn | `cells` |
| 312 | const fn | `num` |
| 318 | const fn | `normName` |
| 319 | function | `renderCsvMap` |
| 320 | const fn | `auto` |
| 326 | function | `applyCsv` |
| 331 | function | `renderCsv` |
| 333 | function | `clearCsv` |
| 335 | function | `sampleCompareHTML` |
| 348 | function | `liveChange` |
| 350 | function | `renderLiveLog` |
| 356 | function | `changesToSchedule` |
| 358 | const fn | `f` |
| 363 | function | `updateLivePanel` |
| 368 | function | `setLivePanel` |
| 371 | function | `switchesOf` |
| 374 | function | `addPulses` |
| 376 | function | `pulseKeys` |
| 377 | function | `refreshControls` |
| 379 | const fn | `phase` |
| 408 | const fn | `setD` |
| 419 | const fn | `setPh` |
| 435 | function | `closeInspector` |
| 436 | function | `placePopup` |
| 437 | function | `fieldHTML` |
| 444 | function | `openInspector` |
| 451 | const fn | `wired` |
| 457 | const fn | `apply` |
| 467 | function | `openWireInspector` |
| 482 | function | `closeMenu` |
| 483 | function | `openMenu` |
| 498 | function | `updateHover` |
| 512 | function | `renderPalette` |
| 519 | function | `tutorial` |
| 522 | function | `circuitSig` |
| 532 | function | `tutorialRef` |
| 533 | function | `theoryValidity` |
| 539 | function | `staleBanner` |
| 542 | function | `bindRestore` |
| 543 | function | `loadTutorial` |
| 547 | function | `applyProject` |
| 556 | function | `renderTutorial` |
| 566 | function | `gallery` |
| 572 | function | `api` |
| 573 | function | `paramsOf` |
| 574 | function | `avgOver` |
| 577 | function | `simValue` |
| 583 | function | `lastPP` |
| 585 | function | `runTheory` |
| 597 | function | `cmpRows` |
| 598 | function | `stepsHTML` |
| 599 | function | `renderTheory` |
| 629 | function | `rippleDev` |
| 631 | function | `periodAvgAt` |
| 633 | function | `samplingTheory` |
| 642 | const fn | `lastAt` |
| 664 | function | `polyTheory` |
| 671 | const fn | `frac` |
| 700 | function | `lastPeriods` |
| 701 | function | `evalOrderHTML` |
| 704 | function | `blocksTheory` |
| 719 | function | `pcmTheory` |
| 745 | function | `codeTheory` |
| 755 | function | `eisTheory` |
| 757 | const fn | `ser` |
| 770 | function | `imSteady` |
| 773 | function | `imPar` |
| 774 | function | `phaseRms` |
| 775 | function | `vfTheory` |
| 788 | function | `focTheory` |
| 805 | function | `synTheory` |
| 835 | function | `pmTheory` |
| 837 | const fn | `mtpa` |
| 853 | function | `lgTheory` |
| 864 | const fn | `cr` |
| 871 | function | `chaosTheory` |
| 883 | function | `dcDriveTheory` |
| 884 | const fn | `per` |
| 885 | const fn | `cross` |
| 914 | function | `formulaTheory` |
| 973 | function | `nodeAvg` |
| 979 | function | `circuitForMath` |
| 1010 | function | `scheduleMath` |
| 1011 | function | `batteryKey` |
| 1013 | function | `mathChoices` |
| 1014 | const fn | `prim` |
| 1016 | function | `renderMathChoices` |
| 1018 | function | `runTemplate` |
| 1024 | function | `runMath` |
| 1045 | function | `saveLocal` |
| 1046 | function | `download` |
| 1047 | function | `exportCSV` |
| 1053 | function | `syncScopeInputs` |
| 1054 | function | `setSpeed` |
| 1057 | function | `openSettings` |
| 1058 | const fn | `sel` |
| 1059 | const fn | `chk` |
| 1075 | function | `boot` |
| 1107 | const fn | `mv` |
| 1108 | const fn | `up` |
| 1109 | const fn | `navOpen` |
| 1115 | const fn | `probeSel` |
| 1152 | function | `renderTheoryLive` |

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
| 220 | function | `compileSignals` |
| 242 | function | `cmpF` |
| 246 | function | `stampM` |
| 248 | function | `luFactor` |
| 254 | function | `luSolve` |
| 261 | class | `Sim` |
| 262 | method | `constructor` |
| 264 | method | `basePeriod` |
| 266 | method | `setStep` |
| 267 | method | `load` |
| 300 | method | `reset` |
| 303 | method | `imStep` |
| 310 | method | `smStep` |
| 311 | method | `smOutputs` |
| 312 | method | `imSources` |
| 313 | method | `pyBlocks` |
| 319 | method | `setMethod` |
| 320 | method | `setControl` |
| 321 | method | `setBlock` |
| 322 | method | `setHold` |
| 324 | method | `markChange` |
| 326 | method | `channelKeys` |
| 343 | method | `allocRecord` |
| 350 | method | `V` |
| 351 | method | `elCurrent` |
| 355 | method | `portI` |
| 357 | method | `computeVals` |
| 381 | method | `recordNow` |
| 389 | method | `closePeriod` |
| 398 | method | `lastPeriod` |
| 399 | method | `now` |
| 404 | method | `gateOf` |
| 410 | method | `rawGate` |
| 421 | method | `carrier` |
| 424 | method | `shGrid` |
| 425 | method | `shNext` |
| 427 | method | `sampleHolds` |
| 432 | method | `samples` |
| 433 | method | `ctrlEdges` |
| 439 | method | `scrU` |
| 440 | method | `scrGate` |
| 441 | method | `scrEdges` |
| 442 | method | `setFiring` |
| 443 | method | `compV` |
| 444 | method | `compI` |
| 446 | method | `dbl` |
| 447 | method | `sampleControllers` |
| 475 | method | `evalBlocks` |
| 538 | method | `blkDue` |
| 540 | method | `zcFrac` |
| 543 | method | `saveState` |
| 545 | method | `restoreState` |
| 548 | method | `gateSig` |
| 552 | method | `values` |
| 562 | method | `assemble` |
| 564 | const fn | `g` |
| 584 | method | `rhs` |
| 586 | const fn | `J` |
| 601 | method | `cplLinearize` |
| 603 | method | `solveOnce` |
| 611 | method | `solve` |
| 621 | method | `check` |
| 628 | method | `commit` |
| 644 | method | `initialSolve` |
| 655 | method | `step` |
| 657 | const fn | `gs` |
| 663 | method | `stepCore` |
| 706 | method | `edgeSolve` |
| 709 | method | `edgePoint` |
| 710 | method | `nextEvent` |
| 716 | const fn | `sch` |
| 732 | method | `spwmCut` |
| 735 | const fn | `sig` |
| 740 | method | `run` |
| 766 | function | `exportForBatch` |
| 773 | const fn | `ci` |
| 774 | const fn | `vd` |
| 775 | const fn | `V` |
| 776 | const fn | `I` |
| 777 | const fn | `portRec` |
| 778 | const fn | `rec` |
| 793 | const fn | `clkOf` |
| 815 | function | `sweepPoint` |
| 823 | function | `eisPoint` |

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
| 295 | function | `defaults` |
| 297 | function | `elPins` |
| 298 | function | `sigPins` |
| 299 | function | `pinsOf` |
| 302 | function | `parseMat` |
| 304 | function | `nPorts` |
| 305 | function | `portY` |
| 306 | function | `portPins` |
| 307 | function | `portBox` |
| 309 | function | `posDef` |
| 311 | function | `symmetric` |
| 312 | function | `matInv` |
| 317 | function | `klMatrix` |
| 328 | function | `kgMatrix` |
| 334 | function | `waveShape` |
| 335 | function | `waveAt` |
| 337 | function | `waveMeasure` |
| 340 | const fn | `cross` |
| 343 | function | `waveFit` |
| 344 | const fn | `res` |
| 351 | function | `lightningWave` |
| 355 | function | `pinKind` |
| 357 | function | `xf` |
| 358 | function | `pinPos` |
| 360 | function | `pinDir` |
| 365 | function | `cpeParams` |
| 366 | function | `cpeBank` |
| 370 | function | `cpeZ` |
| 371 | function | `cpeZbank` |
| 372 | function | `boxOf` |
| 373 | function | `bbox` |
| 377 | function | `eng` |
| 381 | function | `parseEng` |
| 384 | function | `parseSched` |

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
| 393 | method | `build` |
| 407 | method | `build` |
| 432 | const fn | `r4` |
| 436 | function | `smFoc` |
| 461 | method | `build` |
| 485 | method | `build` |
| 497 | method | `build` |
| 511 | method | `build` |
| 531 | method | `build` |
| 546 | method | `build` |
| 584 | method | `build` |

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
| 63 | function | `_f` |
| 71 | class | `Ctrl` |
| 75 | method | `Ctrl.__init__` |
| 100 | method | `Ctrl.dbl` |
| 103 | method | `Ctrl.raw` |
| 123 | method | `Ctrl.gate` |
| 135 | method | `Ctrl.carrier_at` |
| 146 | method | `Ctrl.edges` |
| 166 | function | `_lut` |
| 177 | function | `eval_ast` |
| 203 | function | `make_python_block` |
| 234 | class | `Circuit` |
| 235 | method | `Circuit.__init__` |
| 368 | method | `Circuit.R` |
| 371 | method | `Circuit.im_e` |
| 380 | method | `Circuit.im_deriv` |
| 393 | method | `Circuit.sm_cur` |
| 401 | method | `Circuit.sm_ports` |
| 406 | method | `Circuit.sm_deriv` |
| 418 | method | `Circuit.Vsrc` |
| 429 | method | `Circuit.topo` |
| 439 | method | `Circuit.build` |
| 529 | method | `Circuit.bsrc` |
| 550 | method | `Circuit.solve_z` |
| 575 | method | `Circuit.scr_u` |
| 579 | method | `Circuit.scr_gate` |
| 583 | method | `Circuit.scr_edges` |
| 590 | method | `Circuit.gate_state` |
| 603 | method | `Circuit.set_gates` |
| 611 | method | `Circuit.may_turn_on` |
| 615 | method | `Circuit.tolerances` |
| 621 | method | `Circuit.consistent` |
| 647 | method | `Circuit.value` |
| 680 | method | `Circuit.current` |
| 714 | method | `Circuit.prime` |
| 724 | method | `Circuit.sig_in` |
| 728 | method | `Circuit.sh_grid` |
| 740 | method | `Circuit.sh_next` |
| 747 | method | `Circuit.sh_sample` |
| 766 | method | `Circuit.sample` |
| 825 | method | `Circuit.cmp_f` |
| 831 | method | `Circuit.blk_due` |
| 842 | method | `Circuit.eval_blocks` |
| 1069 | method | `Circuit.block_events` |
| 1094 | method | `Circuit.next_event` |
| 1155 | function | `_decimate` |
| 1172 | function | `simulate` |
| 1347 | function | `batch_sim` |

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
