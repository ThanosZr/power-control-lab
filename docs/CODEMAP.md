# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 1388 |
| `web/studio/editor.js` | 509 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 926 |
| `web/studio/parts.js` | 534 |
| `web/studio/pyrt.js` | 55 |
| `web/studio/scope.js` | 167 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 658 |
| `run.py` | 138 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1454 |
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
| `tests/test_studio_sim.py` | 532 |
| `tests/test_templates.py` | 174 |
| `tests/test_tutorials.py` | 471 |
| `tests/js/batch_requests.js` | 70 |
| `tests/js/sim_cases.js` | 264 |
| `tests/js/tutorial_cases.js` | 106 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/wiring_flow.js` | 93 |

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
| 115 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 126 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 133 | `KL` | Συζευγμένα πηνία (N×N) |
| 144 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 151 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 157 | `CPL` | Φορτίο σταθερής ισχύος |
| 161 | `SH` | Sample & Hold |
| 170 | `GND` | Γείωση |
| 172 | `JUNC` | Κόμβος |
| 173 | `PWM` | PWM / έλεγχος |
| 195 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 205 | `VM` | Βολτόμετρο |
| 207 | `AM` | Αμπερόμετρο (σε σειρά) |
| 210 | `VP` | Probe τάσης (ως προς τη γη) |
| 212 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 214 | `MEAS` | Μέτρηση στοιχείου |
| 217 | `CONST` | Σταθερά / πρόγραμμα |
| 220 | `GAIN` | Κέρδος |
| 222 | `SUM` | Άθροισμα |
| 225 | `MUL` | Γινόμενο |
| 227 | `DIV` | Διαίρεση a/b |
| 230 | `SAT` | Κορεσμός |
| 233 | `CMP` | Συγκριτής |
| 236 | `LOGIC` | Λογική πύλη |
| 239 | `PIB` | PI διακριτός |
| 245 | `UD` | Καθυστέρηση z⁻¹ |
| 248 | `SR` | SR latch |
| 251 | `CLK` | Ρολόι (τετραγωνικό) |
| 254 | `RAMP` | Φέρον / ράμπα |
| 259 | `EXPR` | Έκφραση |
| 263 | `PY` | Μπλοκ Python |
| 268 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 278 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 293 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 310 | `MOD3` | Διαμορφωτής τριφασικός |
| 313 | `FEST` | Εκτιμητής ροής δρομέα |
| 317 | `INT` | Ολοκληρωτής |
| 321 | `LPF` | Βαθυπερατό 1ης τάξης |
| 324 | `CLARKE` | Clarke abc → αβ |
| 327 | `ICLARKE` | Clarke αβ → abc |
| 330 | `PARK` | Park αβ → dq |
| 332 | `IPARK` | Park dq → αβ |
| 334 | `PLL` | PLL (τριφασικό) |
| 339 | `TAGO` | Ετικέτα: προς (Goto) |
| 342 | `TAGI` | Ετικέτα: από (From) |
| 345 | `DISP` | Ένδειξη |

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
| 540 | `twave` | Υψηλές τάσεις (3.8) | Οδεύοντα κύματα: ανάκλαση σε ανοιχτό, βραχυκυκλωμένο ή ωμικό άκρο, διάγραμμα Bewley |
| 563 | `arrester` | Υψηλές τάσεις (3.9) | Αλεξικέραυνο: παραμένουσα τάση και απόσταση προστασίας |
| 577 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 599 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 613 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 655 | `empty` | Νέο | Κενό κύκλωμα |

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
| 79 | function | `blkUnit` |
| 84 | function | `outsOf` |
| 86 | function | `chanLabel` |
| 93 | function | `addProbe` |
| 94 | function | `flash` |
| 95 | function | `signalsFor` |
| 105 | function | `renderChannels` |
| 121 | function | `renderMeasure` |
| 130 | function | `MeasureUnit` |
| 133 | function | `simKey` |
| 134 | function | `perSeries` |
| 135 | function | `refFor` |
| 136 | const fn | `sched` |
| 140 | function | `metricsFor` |
| 144 | function | `metricsRows` |
| 149 | function | `eventMetricsHTML` |
| 151 | function | `renderMetricsPanel` |
| 162 | function | `rawSeries` |
| 165 | function | `autoF1` |
| 167 | function | `renderFFT` |
| 189 | function | `cellZ` |
| 191 | function | `renderEISForm` |
| 192 | const fn | `opt` |
| 196 | function | `runEIS` |
| 204 | function | `drawEIS` |
| 223 | function | `perSamples` |
| 225 | function | `periodText` |
| 226 | const fn | `svgPlot` |
| 228 | function | `pcmMapFn` |
| 230 | const fn | `z` |
| 233 | function | `renderPoincare` |
| 249 | function | `bfParams` |
| 251 | function | `renderBifurcationForm` |
| 255 | function | `runBifurcation` |
| 262 | function | `drawBifurcation` |
| 272 | function | `niceTop` |
| 275 | function | `btStatus` |
| 276 | function | `parseStep` |
| 277 | function | `runBatch` |
| 293 | function | `clearBatch` |
| 295 | function | `meanPL` |
| 297 | function | `ringTrace` |
| 299 | function | `compareHTML` |
| 309 | function | `renderBatch` |
| 314 | function | `parseCSV` |
| 316 | const fn | `cells` |
| 317 | const fn | `num` |
| 323 | const fn | `normName` |
| 324 | function | `renderCsvMap` |
| 325 | const fn | `auto` |
| 331 | function | `applyCsv` |
| 336 | function | `renderCsv` |
| 338 | function | `clearCsv` |
| 340 | function | `sampleCompareHTML` |
| 353 | function | `liveChange` |
| 355 | function | `renderLiveLog` |
| 361 | function | `changesToSchedule` |
| 363 | const fn | `f` |
| 368 | function | `updateLivePanel` |
| 373 | function | `setLivePanel` |
| 376 | function | `switchesOf` |
| 379 | function | `addPulses` |
| 381 | function | `pulseKeys` |
| 382 | function | `refreshControls` |
| 384 | const fn | `phase` |
| 418 | const fn | `setD` |
| 429 | const fn | `setPh` |
| 441 | const fn | `pinNow` |
| 448 | const fn | `pinSet` |
| 458 | function | `pinMap` |
| 459 | function | `pinX` |
| 460 | function | `pinV` |
| 463 | function | `closeInspector` |
| 464 | function | `placePopup` |
| 465 | function | `fieldHTML` |
| 472 | function | `openInspector` |
| 479 | const fn | `wired` |
| 485 | const fn | `apply` |
| 495 | function | `openWireInspector` |
| 510 | const fn | `numOf` |
| 516 | function | `psec` |
| 518 | function | `propsOpen` |
| 519 | function | `setProps` |
| 521 | function | `focusComp` |
| 522 | function | `togglePin` |
| 525 | function | `renderProps` |
| 534 | function | `propsComp` |
| 535 | const fn | `secOf` |
| 537 | const fn | `row` |
| 543 | const fn | `wired` |
| 549 | function | `propsJunc` |
| 551 | function | `propsWire` |
| 556 | function | `propsMulti` |
| 558 | function | `propsCircuit` |
| 568 | const fn | `opt` |
| 575 | const fn | `chk` |
| 583 | function | `bindProps` |
| 603 | function | `liveApply` |
| 606 | function | `closeMenu` |
| 607 | function | `openMenu` |
| 623 | function | `updateHover` |
| 637 | function | `renderPalette` |
| 644 | function | `tutorial` |
| 647 | function | `circuitSig` |
| 657 | function | `tutorialRef` |
| 658 | function | `theoryValidity` |
| 664 | function | `staleBanner` |
| 667 | function | `bindRestore` |
| 668 | function | `loadTutorial` |
| 672 | function | `applyProject` |
| 681 | function | `renderTutorial` |
| 691 | function | `gallery` |
| 697 | function | `api` |
| 698 | function | `paramsOf` |
| 699 | function | `avgOver` |
| 702 | function | `simValue` |
| 708 | function | `lastPP` |
| 710 | function | `runTheory` |
| 722 | function | `cmpRows` |
| 723 | function | `stepsHTML` |
| 724 | function | `renderTheory` |
| 754 | function | `rippleDev` |
| 756 | function | `periodAvgAt` |
| 758 | function | `samplingTheory` |
| 767 | const fn | `lastAt` |
| 789 | function | `polyTheory` |
| 796 | const fn | `frac` |
| 825 | function | `lastPeriods` |
| 826 | function | `evalOrderHTML` |
| 829 | function | `blocksTheory` |
| 844 | function | `pcmTheory` |
| 870 | function | `codeTheory` |
| 880 | function | `eisTheory` |
| 882 | const fn | `ser` |
| 895 | function | `imSteady` |
| 898 | function | `imPar` |
| 899 | function | `phaseRms` |
| 900 | function | `vfTheory` |
| 913 | function | `focTheory` |
| 930 | function | `synTheory` |
| 949 | const fn | `need` |
| 969 | function | `pmTheory` |
| 971 | const fn | `mtpa` |
| 987 | function | `srmTheory` |
| 1002 | const fn | `curve` |
| 1013 | function | `lgTheory` |
| 1024 | const fn | `cr` |
| 1031 | function | `chaosTheory` |
| 1043 | function | `dcDriveTheory` |
| 1044 | const fn | `per` |
| 1045 | const fn | `cross` |
| 1075 | function | `twModel` |
| 1078 | const fn | `g` |
| 1081 | function | `twLattice` |
| 1088 | const fn | `marks` |
| 1091 | function | `twTheory` |
| 1099 | const fn | `at` |
| 1116 | function | `arTheory` |
| 1134 | function | `formulaTheory` |
| 1196 | function | `nodeAvg` |
| 1202 | function | `circuitForMath` |
| 1234 | function | `scheduleMath` |
| 1235 | function | `batteryKey` |
| 1237 | function | `mathChoices` |
| 1238 | const fn | `prim` |
| 1240 | function | `renderMathChoices` |
| 1242 | function | `runTemplate` |
| 1248 | function | `runMath` |
| 1269 | function | `saveLocal` |
| 1270 | function | `download` |
| 1271 | function | `exportCSV` |
| 1277 | function | `syncScopeInputs` |
| 1278 | function | `setSpeed` |
| 1281 | function | `openSettings` |
| 1282 | const fn | `sel` |
| 1283 | const fn | `chk` |
| 1301 | function | `boot` |
| 1334 | const fn | `mv` |
| 1335 | const fn | `up` |
| 1336 | const fn | `navOpen` |
| 1342 | const fn | `probeSel` |
| 1385 | function | `renderTheoryLive` |

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
| 259 | method | `renderLabels` |
| 266 | method | `renderWires` |
| 280 | method | `pathD` |
| 284 | method | `midLabel` |
| 285 | method | `renderPins` |
| 295 | method | `renderSel` |
| 297 | method | `setLive` |
| 298 | method | `updateLive` |
| 305 | method | `drawArrows` |
| 315 | method | `world` |
| 317 | method | `hitAt` |
| 318 | method | `hitOf` |
| 320 | method | `down` |
| 346 | method | `move` |
| 359 | method | `up` |
| 373 | method | `cancelDrag` |
| 374 | method | `hoverPin` |
| 376 | method | `dbl` |
| 377 | method | `menu` |
| 379 | method | `wheel` |
| 384 | method | `key` |
| 406 | method | `beginDrag` |
| 413 | method | `dragMove` |
| 423 | method | `endDrag` |
| 430 | method | `dragSeg` |
| 433 | const fn | `stub` |
| 442 | method | `drawMarquee` |
| 445 | method | `marqueeSelect` |
| 448 | const fn | `inside` |
| 454 | method | `beginPlace` |
| 455 | method | `ghost` |
| 457 | method | `finishPlace` |
| 458 | method | `cancelPlace` |
| 460 | method | `startWire` |
| 461 | method | `startWireFrom` |
| 462 | method | `previewWire` |
| 471 | method | `wireClick` |
| 477 | method | `orthoNext` |
| 478 | method | `finishWire` |
| 494 | method | `cancelWire` |
| 496 | method | `splitWire` |
| 506 | method | `wireNetPin` |

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
| 270 | function | `compileSignals` |
| 292 | function | `cmpF` |
| 296 | function | `stampM` |
| 298 | function | `luFactor` |
| 304 | function | `luSolve` |
| 311 | class | `Sim` |
| 312 | method | `constructor` |
| 314 | method | `basePeriod` |
| 317 | method | `tlMaxStep` |
| 318 | method | `setStep` |
| 319 | method | `load` |
| 356 | method | `reset` |
| 359 | method | `imStep` |
| 366 | method | `smStep` |
| 368 | method | `srmStep` |
| 369 | method | `srmOutputs` |
| 370 | method | `smOutputs` |
| 371 | method | `imSources` |
| 372 | method | `pyBlocks` |
| 378 | method | `setMethod` |
| 379 | method | `setControl` |
| 380 | method | `setBlock` |
| 381 | method | `setHold` |
| 383 | method | `markChange` |
| 385 | method | `channelKeys` |
| 403 | method | `allocRecord` |
| 410 | method | `V` |
| 411 | method | `elCurrent` |
| 415 | method | `portI` |
| 417 | method | `computeVals` |
| 442 | method | `recordNow` |
| 450 | method | `closePeriod` |
| 459 | method | `lastPeriod` |
| 460 | method | `now` |
| 465 | method | `gateOf` |
| 471 | method | `rawGate` |
| 482 | method | `carrier` |
| 485 | method | `shGrid` |
| 486 | method | `shNext` |
| 488 | method | `sampleHolds` |
| 493 | method | `samples` |
| 494 | method | `ctrlEdges` |
| 500 | method | `scrU` |
| 501 | method | `scrGate` |
| 502 | method | `scrEdges` |
| 503 | method | `setFiring` |
| 504 | method | `compV` |
| 505 | method | `compI` |
| 507 | method | `dbl` |
| 508 | method | `sampleControllers` |
| 536 | method | `evalBlocks` |
| 600 | method | `blkDue` |
| 602 | method | `zcFrac` |
| 605 | method | `saveState` |
| 607 | method | `restoreState` |
| 610 | method | `gateSig` |
| 614 | method | `values` |
| 630 | method | `assemble` |
| 632 | const fn | `g` |
| 654 | method | `rhs` |
| 656 | const fn | `J` |
| 673 | method | `cplLinearize` |
| 675 | method | `solveOnce` |
| 683 | method | `solve` |
| 695 | method | `nlLinearize` |
| 698 | method | `check` |
| 705 | method | `commit` |
| 723 | method | `initialSolve` |
| 732 | method | `tlRecord` |
| 736 | method | `tlHist` |
| 743 | method | `step` |
| 745 | const fn | `gs` |
| 751 | method | `stepCore` |
| 794 | method | `edgeSolve` |
| 797 | method | `edgePoint` |
| 798 | method | `nextEvent` |
| 804 | const fn | `sch` |
| 820 | method | `spwmCut` |
| 823 | const fn | `sig` |
| 828 | method | `run` |
| 854 | function | `exportForBatch` |
| 865 | const fn | `ci` |
| 866 | const fn | `vd` |
| 867 | const fn | `V` |
| 868 | const fn | `I` |
| 869 | const fn | `portRec` |
| 870 | const fn | `rec` |
| 886 | const fn | `clkOf` |
| 909 | function | `sweepPoint` |
| 917 | function | `eisPoint` |

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
| 349 | function | `defaults` |
| 351 | function | `elPins` |
| 352 | function | `sigPins` |
| 353 | function | `pinsOf` |
| 356 | function | `parseMat` |
| 358 | function | `nPorts` |
| 359 | function | `portY` |
| 360 | function | `portPins` |
| 361 | function | `portBox` |
| 363 | function | `posDef` |
| 365 | function | `symmetric` |
| 366 | function | `matInv` |
| 371 | function | `klMatrix` |
| 382 | function | `kgMatrix` |
| 390 | function | `srmGeo` |
| 392 | function | `srmSpins` |
| 394 | function | `srmPins` |
| 396 | function | `satD` |
| 397 | function | `satDinv` |
| 398 | function | `srmAlignedPsi` |
| 399 | function | `srmModelPsi` |
| 400 | function | `srmTableText` |
| 403 | function | `srmMag` |
| 419 | function | `chkMag` |
| 421 | function | `srmA` |
| 424 | function | `seg` |
| 425 | function | `srmPsi` |
| 427 | function | `srmCur` |
| 429 | function | `srmTorque` |
| 432 | function | `srmCoenergy` |
| 436 | function | `waveShape` |
| 437 | function | `waveAt` |
| 440 | function | `waveMeasure` |
| 443 | const fn | `cross` |
| 449 | function | `waveFit` |
| 450 | const fn | `res` |
| 459 | function | `impulseWave` |
| 467 | function | `bewley` |
| 470 | const fn | `at` |
| 476 | function | `movChar` |
| 481 | const fn | `pick` |
| 482 | const fn | `cur` |
| 483 | const fn | `inv` |
| 486 | function | `tlParams` |
| 492 | function | `lightningWave` |
| 496 | function | `pinKind` |
| 498 | function | `xf` |
| 499 | function | `pinPos` |
| 501 | function | `pinDir` |
| 506 | function | `cpeParams` |
| 507 | function | `cpeBank` |
| 511 | function | `cpeZ` |
| 512 | function | `cpeZbank` |
| 513 | function | `boxOf` |
| 514 | function | `bbox` |
| 518 | function | `eng` |
| 522 | function | `parseEng` |
| 525 | function | `parseSched` |

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
| 548 | method | `build` |
| 569 | method | `build` |
| 583 | method | `build` |
| 603 | method | `build` |
| 618 | method | `build` |
| 656 | method | `build` |

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
| 65 | function | `sat_d` |
| 72 | function | `sat_d_inv` |
| 84 | function | `_f` |
| 92 | class | `Ctrl` |
| 96 | method | `Ctrl.__init__` |
| 121 | method | `Ctrl.dbl` |
| 124 | method | `Ctrl.raw` |
| 144 | method | `Ctrl.gate` |
| 156 | method | `Ctrl.carrier_at` |
| 167 | method | `Ctrl.edges` |
| 187 | function | `_lut` |
| 198 | function | `eval_ast` |
| 224 | function | `make_python_block` |
| 255 | class | `Circuit` |
| 256 | method | `Circuit.__init__` |
| 402 | method | `Circuit.R` |
| 405 | method | `Circuit.im_e` |
| 414 | method | `Circuit.im_deriv` |
| 427 | method | `Circuit.sm_cur` |
| 439 | method | `Circuit.sm_ports` |
| 444 | method | `Circuit.sm_deriv` |
| 459 | method | `Circuit.srm_A` |
| 464 | method | `Circuit._seg` |
| 468 | method | `Circuit.srm_cur` |
| 475 | method | `Circuit.srm_torque` |
| 484 | method | `Circuit.srm_currents` |
| 489 | method | `Circuit.srm_deriv` |
| 499 | method | `Circuit.Vsrc` |
| 512 | method | `Circuit.topo` |
| 522 | method | `Circuit.build` |
| 612 | method | `Circuit.bsrc` |
| 639 | method | `Circuit.solve_z` |
| 664 | method | `Circuit.scr_u` |
| 668 | method | `Circuit.scr_gate` |
| 672 | method | `Circuit.scr_edges` |
| 679 | method | `Circuit.gate_state` |
| 692 | method | `Circuit.set_gates` |
| 700 | method | `Circuit.may_turn_on` |
| 704 | method | `Circuit.tolerances` |
| 710 | method | `Circuit.consistent` |
| 736 | method | `Circuit.value` |
| 772 | method | `Circuit.current` |
| 808 | method | `Circuit.prime` |
| 818 | method | `Circuit.sig_in` |
| 822 | method | `Circuit.sh_grid` |
| 834 | method | `Circuit.sh_next` |
| 841 | method | `Circuit.sh_sample` |
| 860 | method | `Circuit.sample` |
| 919 | method | `Circuit.cmp_f` |
| 925 | method | `Circuit.blk_due` |
| 936 | method | `Circuit.eval_blocks` |
| 1168 | method | `Circuit.block_events` |
| 1193 | method | `Circuit.next_event` |
| 1254 | function | `_decimate` |
| 1271 | function | `simulate` |
| 1448 | function | `batch_sim` |

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
