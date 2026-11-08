# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 1323 |
| `web/studio/editor.js` | 506 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 891 |
| `web/studio/parts.js` | 469 |
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
| `tests/test_batch.py` | 178 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 475 |
| `tests/test_templates.py` | 174 |
| `tests/test_tutorials.py` | 411 |
| `tests/js/batch_requests.js` | 67 |
| `tests/js/sim_cases.js` | 246 |
| `tests/js/tutorial_cases.js` | 85 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/wiring_flow.js` | 78 |

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
| 184 | `VP` | Probe τάσης (ως προς τη γη) |
| 186 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 188 | `MEAS` | Μέτρηση στοιχείου |
| 191 | `CONST` | Σταθερά / πρόγραμμα |
| 194 | `GAIN` | Κέρδος |
| 196 | `SUM` | Άθροισμα |
| 199 | `MUL` | Γινόμενο |
| 201 | `DIV` | Διαίρεση a/b |
| 204 | `SAT` | Κορεσμός |
| 207 | `CMP` | Συγκριτής |
| 210 | `LOGIC` | Λογική πύλη |
| 213 | `PIB` | PI διακριτός |
| 219 | `UD` | Καθυστέρηση z⁻¹ |
| 222 | `SR` | SR latch |
| 225 | `CLK` | Ρολόι (τετραγωνικό) |
| 228 | `RAMP` | Φέρον / ράμπα |
| 233 | `EXPR` | Έκφραση |
| 237 | `PY` | Μπλοκ Python |
| 242 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 252 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 267 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 284 | `MOD3` | Διαμορφωτής τριφασικός |
| 287 | `FEST` | Εκτιμητής ροής δρομέα |
| 291 | `INT` | Ολοκληρωτής |
| 295 | `LPF` | Βαθυπερατό 1ης τάξης |
| 298 | `CLARKE` | Clarke abc → αβ |
| 301 | `ICLARKE` | Clarke αβ → abc |
| 304 | `PARK` | Park αβ → dq |
| 306 | `IPARK` | Park dq → αβ |
| 308 | `PLL` | PLL (τριφασικό) |
| 313 | `TAGO` | Ετικέτα: προς (Goto) |
| 316 | `TAGI` | Ετικέτα: από (From) |
| 319 | `DISP` | Ένδειξη |

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
| 415 | const fn | `setD` |
| 426 | const fn | `setPh` |
| 438 | const fn | `pinNow` |
| 445 | const fn | `pinSet` |
| 455 | function | `pinMap` |
| 456 | function | `pinX` |
| 457 | function | `pinV` |
| 460 | function | `closeInspector` |
| 461 | function | `placePopup` |
| 462 | function | `fieldHTML` |
| 469 | function | `openInspector` |
| 476 | const fn | `wired` |
| 482 | const fn | `apply` |
| 492 | function | `openWireInspector` |
| 507 | const fn | `numOf` |
| 513 | function | `psec` |
| 515 | function | `propsOpen` |
| 516 | function | `setProps` |
| 518 | function | `focusComp` |
| 519 | function | `togglePin` |
| 522 | function | `renderProps` |
| 531 | function | `propsComp` |
| 532 | const fn | `secOf` |
| 534 | const fn | `row` |
| 540 | const fn | `wired` |
| 546 | function | `propsJunc` |
| 548 | function | `propsWire` |
| 553 | function | `propsMulti` |
| 555 | function | `propsCircuit` |
| 565 | const fn | `opt` |
| 572 | const fn | `chk` |
| 580 | function | `bindProps` |
| 600 | function | `liveApply` |
| 603 | function | `closeMenu` |
| 604 | function | `openMenu` |
| 620 | function | `updateHover` |
| 634 | function | `renderPalette` |
| 641 | function | `tutorial` |
| 644 | function | `circuitSig` |
| 654 | function | `tutorialRef` |
| 655 | function | `theoryValidity` |
| 661 | function | `staleBanner` |
| 664 | function | `bindRestore` |
| 665 | function | `loadTutorial` |
| 669 | function | `applyProject` |
| 678 | function | `renderTutorial` |
| 688 | function | `gallery` |
| 694 | function | `api` |
| 695 | function | `paramsOf` |
| 696 | function | `avgOver` |
| 699 | function | `simValue` |
| 705 | function | `lastPP` |
| 707 | function | `runTheory` |
| 719 | function | `cmpRows` |
| 720 | function | `stepsHTML` |
| 721 | function | `renderTheory` |
| 751 | function | `rippleDev` |
| 753 | function | `periodAvgAt` |
| 755 | function | `samplingTheory` |
| 764 | const fn | `lastAt` |
| 786 | function | `polyTheory` |
| 793 | const fn | `frac` |
| 822 | function | `lastPeriods` |
| 823 | function | `evalOrderHTML` |
| 826 | function | `blocksTheory` |
| 841 | function | `pcmTheory` |
| 867 | function | `codeTheory` |
| 877 | function | `eisTheory` |
| 879 | const fn | `ser` |
| 892 | function | `imSteady` |
| 895 | function | `imPar` |
| 896 | function | `phaseRms` |
| 897 | function | `vfTheory` |
| 910 | function | `focTheory` |
| 927 | function | `synTheory` |
| 946 | const fn | `need` |
| 966 | function | `pmTheory` |
| 968 | const fn | `mtpa` |
| 984 | function | `srmTheory` |
| 999 | const fn | `curve` |
| 1010 | function | `lgTheory` |
| 1021 | const fn | `cr` |
| 1028 | function | `chaosTheory` |
| 1040 | function | `dcDriveTheory` |
| 1041 | const fn | `per` |
| 1042 | const fn | `cross` |
| 1071 | function | `formulaTheory` |
| 1131 | function | `nodeAvg` |
| 1137 | function | `circuitForMath` |
| 1169 | function | `scheduleMath` |
| 1170 | function | `batteryKey` |
| 1172 | function | `mathChoices` |
| 1173 | const fn | `prim` |
| 1175 | function | `renderMathChoices` |
| 1177 | function | `runTemplate` |
| 1183 | function | `runMath` |
| 1204 | function | `saveLocal` |
| 1205 | function | `download` |
| 1206 | function | `exportCSV` |
| 1212 | function | `syncScopeInputs` |
| 1213 | function | `setSpeed` |
| 1216 | function | `openSettings` |
| 1217 | const fn | `sel` |
| 1218 | const fn | `chk` |
| 1236 | function | `boot` |
| 1269 | const fn | `mv` |
| 1270 | const fn | `up` |
| 1271 | const fn | `navOpen` |
| 1277 | const fn | `probeSel` |
| 1320 | function | `renderTheoryLive` |

### `web/studio/editor.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 12 | const fn | `snap` |
| 13 | const fn | `same` |
| 14 | const fn | `esc` |
| 16 | function | `normalize` |
| 21 | const fn | `orth` |
| 22 | class | `MinHeap` |
| 23 | method | `pop` |
| 26 | class | `Editor` |
| 27 | method | `constructor` |
| 50 | method | `comp` |
| 51 | method | `wire` |
| 52 | method | `newId` |
| 53 | method | `pin` |
| 54 | method | `wirePts` |
| 55 | method | `setWirePts` |
| 56 | method | `snapshot` |
| 57 | method | `remember` |
| 58 | method | `undo` |
| 59 | method | `redo` |
| 60 | method | `cleanSel` |
| 61 | method | `load` |
| 66 | method | `export` |
| 67 | method | `changed` |
| 68 | method | `selection` |
| 69 | method | `select` |
| 70 | method | `addPart` |
| 76 | method | `setParams` |
| 80 | method | `dropDangling` |
| 82 | method | `netKinds` |
| 88 | method | `setSolve` |
| 90 | method | `setDiag` |
| 91 | method | `renderDiag` |
| 93 | method | `kindsOk` |
| 94 | method | `wiresAt` |
| 115 | method | `autoConnect` |
| 132 | method | `insertSeries` |
| 133 | const fn | `pos` |
| 138 | method | `setWireTool` |
| 139 | method | `startFreeWire` |
| 140 | method | `newJunction` |
| 142 | method | `finishFree` |
| 147 | method | `setWireProps` |
| 148 | method | `deleteSel` |
| 154 | method | `tidyJunctions` |
| 164 | method | `rotateSel` |
| 166 | method | `mirrorSel` |
| 168 | method | `captureWires` |
| 169 | method | `refitWires` |
| 170 | method | `copySel` |
| 171 | method | `paste` |
| 181 | method | `astar` |
| 189 | const fn | `idx` |
| 191 | const fn | `dirIndex` |
| 194 | const fn | `h` |
| 208 | method | `simpleRoute` |
| 211 | method | `route` |
| 215 | method | `adjustEnd` |
| 222 | method | `applyView` |
| 226 | method | `fit` |
| 228 | method | `extent` |
| 230 | method | `render` |
| 231 | method | `partSVG` |
| 237 | method | `renderPart` |
| 238 | method | `valueText` |
| 256 | method | `renderLabels` |
| 263 | method | `renderWires` |
| 277 | method | `pathD` |
| 281 | method | `midLabel` |
| 282 | method | `renderPins` |
| 292 | method | `renderSel` |
| 294 | method | `setLive` |
| 295 | method | `updateLive` |
| 302 | method | `drawArrows` |
| 312 | method | `world` |
| 314 | method | `hitAt` |
| 315 | method | `hitOf` |
| 317 | method | `down` |
| 343 | method | `move` |
| 356 | method | `up` |
| 370 | method | `cancelDrag` |
| 371 | method | `hoverPin` |
| 373 | method | `dbl` |
| 374 | method | `menu` |
| 376 | method | `wheel` |
| 381 | method | `key` |
| 403 | method | `beginDrag` |
| 410 | method | `dragMove` |
| 420 | method | `endDrag` |
| 427 | method | `dragSeg` |
| 430 | const fn | `stub` |
| 439 | method | `drawMarquee` |
| 442 | method | `marqueeSelect` |
| 445 | const fn | `inside` |
| 451 | method | `beginPlace` |
| 452 | method | `ghost` |
| 454 | method | `finishPlace` |
| 455 | method | `cancelPlace` |
| 457 | method | `startWire` |
| 458 | method | `startWireFrom` |
| 459 | method | `previewWire` |
| 468 | method | `wireClick` |
| 474 | method | `orthoNext` |
| 475 | method | `finishWire` |
| 491 | method | `cancelWire` |
| 493 | method | `splitWire` |
| 503 | method | `wireNetPin` |

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
| 75 | const fn | `isJ` |
| 95 | const fn | `lbl` |
| 100 | const fn | `node` |
| 101 | const fn | `internal` |
| 104 | const fn | `mkBlock` |
| 111 | const fn | `add` |
| 112 | const fn | `series` |
| 261 | function | `compileSignals` |
| 283 | function | `cmpF` |
| 287 | function | `stampM` |
| 289 | function | `luFactor` |
| 295 | function | `luSolve` |
| 302 | class | `Sim` |
| 303 | method | `constructor` |
| 305 | method | `basePeriod` |
| 307 | method | `setStep` |
| 308 | method | `load` |
| 343 | method | `reset` |
| 346 | method | `imStep` |
| 353 | method | `smStep` |
| 355 | method | `srmStep` |
| 356 | method | `srmOutputs` |
| 357 | method | `smOutputs` |
| 358 | method | `imSources` |
| 359 | method | `pyBlocks` |
| 365 | method | `setMethod` |
| 366 | method | `setControl` |
| 367 | method | `setBlock` |
| 368 | method | `setHold` |
| 370 | method | `markChange` |
| 372 | method | `channelKeys` |
| 390 | method | `allocRecord` |
| 397 | method | `V` |
| 398 | method | `elCurrent` |
| 402 | method | `portI` |
| 404 | method | `computeVals` |
| 429 | method | `recordNow` |
| 437 | method | `closePeriod` |
| 446 | method | `lastPeriod` |
| 447 | method | `now` |
| 452 | method | `gateOf` |
| 458 | method | `rawGate` |
| 469 | method | `carrier` |
| 472 | method | `shGrid` |
| 473 | method | `shNext` |
| 475 | method | `sampleHolds` |
| 480 | method | `samples` |
| 481 | method | `ctrlEdges` |
| 487 | method | `scrU` |
| 488 | method | `scrGate` |
| 489 | method | `scrEdges` |
| 490 | method | `setFiring` |
| 491 | method | `compV` |
| 492 | method | `compI` |
| 494 | method | `dbl` |
| 495 | method | `sampleControllers` |
| 523 | method | `evalBlocks` |
| 587 | method | `blkDue` |
| 589 | method | `zcFrac` |
| 592 | method | `saveState` |
| 594 | method | `restoreState` |
| 597 | method | `gateSig` |
| 601 | method | `values` |
| 616 | method | `assemble` |
| 618 | const fn | `g` |
| 638 | method | `rhs` |
| 640 | const fn | `J` |
| 655 | method | `cplLinearize` |
| 657 | method | `solveOnce` |
| 665 | method | `solve` |
| 675 | method | `check` |
| 682 | method | `commit` |
| 699 | method | `initialSolve` |
| 710 | method | `step` |
| 712 | const fn | `gs` |
| 718 | method | `stepCore` |
| 761 | method | `edgeSolve` |
| 764 | method | `edgePoint` |
| 765 | method | `nextEvent` |
| 771 | const fn | `sch` |
| 787 | method | `spwmCut` |
| 790 | const fn | `sig` |
| 795 | method | `run` |
| 821 | function | `exportForBatch` |
| 830 | const fn | `ci` |
| 831 | const fn | `vd` |
| 832 | const fn | `V` |
| 833 | const fn | `I` |
| 834 | const fn | `portRec` |
| 835 | const fn | `rec` |
| 851 | const fn | `clkOf` |
| 874 | function | `sweepPoint` |
| 882 | function | `eisPoint` |

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
| 323 | function | `defaults` |
| 325 | function | `elPins` |
| 326 | function | `sigPins` |
| 327 | function | `pinsOf` |
| 330 | function | `parseMat` |
| 332 | function | `nPorts` |
| 333 | function | `portY` |
| 334 | function | `portPins` |
| 335 | function | `portBox` |
| 337 | function | `posDef` |
| 339 | function | `symmetric` |
| 340 | function | `matInv` |
| 345 | function | `klMatrix` |
| 356 | function | `kgMatrix` |
| 364 | function | `srmGeo` |
| 366 | function | `srmSpins` |
| 368 | function | `srmPins` |
| 370 | function | `satD` |
| 371 | function | `satDinv` |
| 372 | function | `srmAlignedPsi` |
| 373 | function | `srmModelPsi` |
| 374 | function | `srmTableText` |
| 377 | function | `srmMag` |
| 393 | function | `chkMag` |
| 395 | function | `srmA` |
| 398 | function | `seg` |
| 399 | function | `srmPsi` |
| 401 | function | `srmCur` |
| 403 | function | `srmTorque` |
| 406 | function | `srmCoenergy` |
| 410 | function | `waveShape` |
| 411 | function | `waveAt` |
| 413 | function | `waveMeasure` |
| 416 | const fn | `cross` |
| 419 | function | `waveFit` |
| 420 | const fn | `res` |
| 427 | function | `lightningWave` |
| 431 | function | `pinKind` |
| 433 | function | `xf` |
| 434 | function | `pinPos` |
| 436 | function | `pinDir` |
| 441 | function | `cpeParams` |
| 442 | function | `cpeBank` |
| 446 | function | `cpeZ` |
| 447 | function | `cpeZbank` |
| 448 | function | `boxOf` |
| 449 | function | `bbox` |
| 453 | function | `eng` |
| 457 | function | `parseEng` |
| 460 | function | `parseSched` |

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
