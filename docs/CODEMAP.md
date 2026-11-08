# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 1367 |
| `web/studio/editor.js` | 508 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 916 |
| `web/studio/parts.js` | 515 |
| `web/studio/pyrt.js` | 55 |
| `web/studio/scope.js` | 167 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 644 |
| `run.py` | 138 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1452 |
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
| `tests/test_studio_sim.py` | 506 |
| `tests/test_templates.py` | 174 |
| `tests/test_tutorials.py` | 447 |
| `tests/js/batch_requests.js` | 70 |
| `tests/js/sim_cases.js` | 258 |
| `tests/js/tutorial_cases.js` | 98 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/wiring_flow.js` | 87 |

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
| 125 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 132 | `KL` | Συζευγμένα πηνία (N×N) |
| 143 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 149 | `CPL` | Φορτίο σταθερής ισχύος |
| 153 | `SH` | Sample & Hold |
| 162 | `GND` | Γείωση |
| 164 | `JUNC` | Κόμβος |
| 165 | `PWM` | PWM / έλεγχος |
| 187 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 197 | `VM` | Βολτόμετρο |
| 199 | `AM` | Αμπερόμετρο (σε σειρά) |
| 202 | `VP` | Probe τάσης (ως προς τη γη) |
| 204 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 206 | `MEAS` | Μέτρηση στοιχείου |
| 209 | `CONST` | Σταθερά / πρόγραμμα |
| 212 | `GAIN` | Κέρδος |
| 214 | `SUM` | Άθροισμα |
| 217 | `MUL` | Γινόμενο |
| 219 | `DIV` | Διαίρεση a/b |
| 222 | `SAT` | Κορεσμός |
| 225 | `CMP` | Συγκριτής |
| 228 | `LOGIC` | Λογική πύλη |
| 231 | `PIB` | PI διακριτός |
| 237 | `UD` | Καθυστέρηση z⁻¹ |
| 240 | `SR` | SR latch |
| 243 | `CLK` | Ρολόι (τετραγωνικό) |
| 246 | `RAMP` | Φέρον / ράμπα |
| 251 | `EXPR` | Έκφραση |
| 255 | `PY` | Μπλοκ Python |
| 260 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 270 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 285 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 302 | `MOD3` | Διαμορφωτής τριφασικός |
| 305 | `FEST` | Εκτιμητής ροής δρομέα |
| 309 | `INT` | Ολοκληρωτής |
| 313 | `LPF` | Βαθυπερατό 1ης τάξης |
| 316 | `CLARKE` | Clarke abc → αβ |
| 319 | `ICLARKE` | Clarke αβ → abc |
| 322 | `PARK` | Park αβ → dq |
| 324 | `IPARK` | Park dq → αβ |
| 326 | `PLL` | PLL (τριφασικό) |
| 331 | `TAGO` | Ετικέτα: προς (Goto) |
| 334 | `TAGI` | Ετικέτα: από (From) |
| 337 | `DISP` | Ένδειξη |

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
| 563 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 585 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 599 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 641 | `empty` | Νέο | Κενό κύκλωμα |

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
| 104 | function | `renderChannels` |
| 120 | function | `renderMeasure` |
| 129 | function | `MeasureUnit` |
| 132 | function | `simKey` |
| 133 | function | `perSeries` |
| 134 | function | `refFor` |
| 135 | const fn | `sched` |
| 139 | function | `metricsFor` |
| 143 | function | `metricsRows` |
| 148 | function | `eventMetricsHTML` |
| 150 | function | `renderMetricsPanel` |
| 161 | function | `rawSeries` |
| 164 | function | `autoF1` |
| 166 | function | `renderFFT` |
| 188 | function | `cellZ` |
| 190 | function | `renderEISForm` |
| 191 | const fn | `opt` |
| 195 | function | `runEIS` |
| 203 | function | `drawEIS` |
| 222 | function | `perSamples` |
| 224 | function | `periodText` |
| 225 | const fn | `svgPlot` |
| 227 | function | `pcmMapFn` |
| 229 | const fn | `z` |
| 232 | function | `renderPoincare` |
| 248 | function | `bfParams` |
| 250 | function | `renderBifurcationForm` |
| 254 | function | `runBifurcation` |
| 261 | function | `drawBifurcation` |
| 271 | function | `niceTop` |
| 274 | function | `btStatus` |
| 275 | function | `parseStep` |
| 276 | function | `runBatch` |
| 292 | function | `clearBatch` |
| 294 | function | `meanPL` |
| 296 | function | `ringTrace` |
| 298 | function | `compareHTML` |
| 308 | function | `renderBatch` |
| 313 | function | `parseCSV` |
| 315 | const fn | `cells` |
| 316 | const fn | `num` |
| 322 | const fn | `normName` |
| 323 | function | `renderCsvMap` |
| 324 | const fn | `auto` |
| 330 | function | `applyCsv` |
| 335 | function | `renderCsv` |
| 337 | function | `clearCsv` |
| 339 | function | `sampleCompareHTML` |
| 352 | function | `liveChange` |
| 354 | function | `renderLiveLog` |
| 360 | function | `changesToSchedule` |
| 362 | const fn | `f` |
| 367 | function | `updateLivePanel` |
| 372 | function | `setLivePanel` |
| 375 | function | `switchesOf` |
| 378 | function | `addPulses` |
| 380 | function | `pulseKeys` |
| 381 | function | `refreshControls` |
| 383 | const fn | `phase` |
| 417 | const fn | `setD` |
| 428 | const fn | `setPh` |
| 440 | const fn | `pinNow` |
| 447 | const fn | `pinSet` |
| 457 | function | `pinMap` |
| 458 | function | `pinX` |
| 459 | function | `pinV` |
| 462 | function | `closeInspector` |
| 463 | function | `placePopup` |
| 464 | function | `fieldHTML` |
| 471 | function | `openInspector` |
| 478 | const fn | `wired` |
| 484 | const fn | `apply` |
| 494 | function | `openWireInspector` |
| 509 | const fn | `numOf` |
| 515 | function | `psec` |
| 517 | function | `propsOpen` |
| 518 | function | `setProps` |
| 520 | function | `focusComp` |
| 521 | function | `togglePin` |
| 524 | function | `renderProps` |
| 533 | function | `propsComp` |
| 534 | const fn | `secOf` |
| 536 | const fn | `row` |
| 542 | const fn | `wired` |
| 548 | function | `propsJunc` |
| 550 | function | `propsWire` |
| 555 | function | `propsMulti` |
| 557 | function | `propsCircuit` |
| 567 | const fn | `opt` |
| 574 | const fn | `chk` |
| 582 | function | `bindProps` |
| 602 | function | `liveApply` |
| 605 | function | `closeMenu` |
| 606 | function | `openMenu` |
| 622 | function | `updateHover` |
| 636 | function | `renderPalette` |
| 643 | function | `tutorial` |
| 646 | function | `circuitSig` |
| 656 | function | `tutorialRef` |
| 657 | function | `theoryValidity` |
| 663 | function | `staleBanner` |
| 666 | function | `bindRestore` |
| 667 | function | `loadTutorial` |
| 671 | function | `applyProject` |
| 680 | function | `renderTutorial` |
| 690 | function | `gallery` |
| 696 | function | `api` |
| 697 | function | `paramsOf` |
| 698 | function | `avgOver` |
| 701 | function | `simValue` |
| 707 | function | `lastPP` |
| 709 | function | `runTheory` |
| 721 | function | `cmpRows` |
| 722 | function | `stepsHTML` |
| 723 | function | `renderTheory` |
| 753 | function | `rippleDev` |
| 755 | function | `periodAvgAt` |
| 757 | function | `samplingTheory` |
| 766 | const fn | `lastAt` |
| 788 | function | `polyTheory` |
| 795 | const fn | `frac` |
| 824 | function | `lastPeriods` |
| 825 | function | `evalOrderHTML` |
| 828 | function | `blocksTheory` |
| 843 | function | `pcmTheory` |
| 869 | function | `codeTheory` |
| 879 | function | `eisTheory` |
| 881 | const fn | `ser` |
| 894 | function | `imSteady` |
| 897 | function | `imPar` |
| 898 | function | `phaseRms` |
| 899 | function | `vfTheory` |
| 912 | function | `focTheory` |
| 929 | function | `synTheory` |
| 948 | const fn | `need` |
| 968 | function | `pmTheory` |
| 970 | const fn | `mtpa` |
| 986 | function | `srmTheory` |
| 1001 | const fn | `curve` |
| 1012 | function | `lgTheory` |
| 1023 | const fn | `cr` |
| 1030 | function | `chaosTheory` |
| 1042 | function | `dcDriveTheory` |
| 1043 | const fn | `per` |
| 1044 | const fn | `cross` |
| 1074 | function | `twModel` |
| 1077 | const fn | `g` |
| 1080 | function | `twLattice` |
| 1087 | const fn | `marks` |
| 1090 | function | `twTheory` |
| 1098 | const fn | `at` |
| 1114 | function | `formulaTheory` |
| 1175 | function | `nodeAvg` |
| 1181 | function | `circuitForMath` |
| 1213 | function | `scheduleMath` |
| 1214 | function | `batteryKey` |
| 1216 | function | `mathChoices` |
| 1217 | const fn | `prim` |
| 1219 | function | `renderMathChoices` |
| 1221 | function | `runTemplate` |
| 1227 | function | `runMath` |
| 1248 | function | `saveLocal` |
| 1249 | function | `download` |
| 1250 | function | `exportCSV` |
| 1256 | function | `syncScopeInputs` |
| 1257 | function | `setSpeed` |
| 1260 | function | `openSettings` |
| 1261 | const fn | `sel` |
| 1262 | const fn | `chk` |
| 1280 | function | `boot` |
| 1313 | const fn | `mv` |
| 1314 | const fn | `up` |
| 1315 | const fn | `navOpen` |
| 1321 | const fn | `probeSel` |
| 1364 | function | `renderTheoryLive` |

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
| 258 | method | `renderLabels` |
| 265 | method | `renderWires` |
| 279 | method | `pathD` |
| 283 | method | `midLabel` |
| 284 | method | `renderPins` |
| 294 | method | `renderSel` |
| 296 | method | `setLive` |
| 297 | method | `updateLive` |
| 304 | method | `drawArrows` |
| 314 | method | `world` |
| 316 | method | `hitAt` |
| 317 | method | `hitOf` |
| 319 | method | `down` |
| 345 | method | `move` |
| 358 | method | `up` |
| 372 | method | `cancelDrag` |
| 373 | method | `hoverPin` |
| 375 | method | `dbl` |
| 376 | method | `menu` |
| 378 | method | `wheel` |
| 383 | method | `key` |
| 405 | method | `beginDrag` |
| 412 | method | `dragMove` |
| 422 | method | `endDrag` |
| 429 | method | `dragSeg` |
| 432 | const fn | `stub` |
| 441 | method | `drawMarquee` |
| 444 | method | `marqueeSelect` |
| 447 | const fn | `inside` |
| 453 | method | `beginPlace` |
| 454 | method | `ghost` |
| 456 | method | `finishPlace` |
| 457 | method | `cancelPlace` |
| 459 | method | `startWire` |
| 460 | method | `startWireFrom` |
| 461 | method | `previewWire` |
| 470 | method | `wireClick` |
| 476 | method | `orthoNext` |
| 477 | method | `finishWire` |
| 493 | method | `cancelWire` |
| 495 | method | `splitWire` |
| 505 | method | `wireNetPin` |

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
| 269 | function | `compileSignals` |
| 291 | function | `cmpF` |
| 295 | function | `stampM` |
| 297 | function | `luFactor` |
| 303 | function | `luSolve` |
| 310 | class | `Sim` |
| 311 | method | `constructor` |
| 313 | method | `basePeriod` |
| 316 | method | `tlMaxStep` |
| 317 | method | `setStep` |
| 318 | method | `load` |
| 354 | method | `reset` |
| 357 | method | `imStep` |
| 364 | method | `smStep` |
| 366 | method | `srmStep` |
| 367 | method | `srmOutputs` |
| 368 | method | `smOutputs` |
| 369 | method | `imSources` |
| 370 | method | `pyBlocks` |
| 376 | method | `setMethod` |
| 377 | method | `setControl` |
| 378 | method | `setBlock` |
| 379 | method | `setHold` |
| 381 | method | `markChange` |
| 383 | method | `channelKeys` |
| 401 | method | `allocRecord` |
| 408 | method | `V` |
| 409 | method | `elCurrent` |
| 413 | method | `portI` |
| 415 | method | `computeVals` |
| 440 | method | `recordNow` |
| 448 | method | `closePeriod` |
| 457 | method | `lastPeriod` |
| 458 | method | `now` |
| 463 | method | `gateOf` |
| 469 | method | `rawGate` |
| 480 | method | `carrier` |
| 483 | method | `shGrid` |
| 484 | method | `shNext` |
| 486 | method | `sampleHolds` |
| 491 | method | `samples` |
| 492 | method | `ctrlEdges` |
| 498 | method | `scrU` |
| 499 | method | `scrGate` |
| 500 | method | `scrEdges` |
| 501 | method | `setFiring` |
| 502 | method | `compV` |
| 503 | method | `compI` |
| 505 | method | `dbl` |
| 506 | method | `sampleControllers` |
| 534 | method | `evalBlocks` |
| 598 | method | `blkDue` |
| 600 | method | `zcFrac` |
| 603 | method | `saveState` |
| 605 | method | `restoreState` |
| 608 | method | `gateSig` |
| 612 | method | `values` |
| 628 | method | `assemble` |
| 630 | const fn | `g` |
| 651 | method | `rhs` |
| 653 | const fn | `J` |
| 669 | method | `cplLinearize` |
| 671 | method | `solveOnce` |
| 679 | method | `solve` |
| 689 | method | `check` |
| 696 | method | `commit` |
| 714 | method | `initialSolve` |
| 723 | method | `tlRecord` |
| 727 | method | `tlHist` |
| 734 | method | `step` |
| 736 | const fn | `gs` |
| 742 | method | `stepCore` |
| 785 | method | `edgeSolve` |
| 788 | method | `edgePoint` |
| 789 | method | `nextEvent` |
| 795 | const fn | `sch` |
| 811 | method | `spwmCut` |
| 814 | const fn | `sig` |
| 819 | method | `run` |
| 845 | function | `exportForBatch` |
| 855 | const fn | `ci` |
| 856 | const fn | `vd` |
| 857 | const fn | `V` |
| 858 | const fn | `I` |
| 859 | const fn | `portRec` |
| 860 | const fn | `rec` |
| 876 | const fn | `clkOf` |
| 899 | function | `sweepPoint` |
| 907 | function | `eisPoint` |

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
| 341 | function | `defaults` |
| 343 | function | `elPins` |
| 344 | function | `sigPins` |
| 345 | function | `pinsOf` |
| 348 | function | `parseMat` |
| 350 | function | `nPorts` |
| 351 | function | `portY` |
| 352 | function | `portPins` |
| 353 | function | `portBox` |
| 355 | function | `posDef` |
| 357 | function | `symmetric` |
| 358 | function | `matInv` |
| 363 | function | `klMatrix` |
| 374 | function | `kgMatrix` |
| 382 | function | `srmGeo` |
| 384 | function | `srmSpins` |
| 386 | function | `srmPins` |
| 388 | function | `satD` |
| 389 | function | `satDinv` |
| 390 | function | `srmAlignedPsi` |
| 391 | function | `srmModelPsi` |
| 392 | function | `srmTableText` |
| 395 | function | `srmMag` |
| 411 | function | `chkMag` |
| 413 | function | `srmA` |
| 416 | function | `seg` |
| 417 | function | `srmPsi` |
| 419 | function | `srmCur` |
| 421 | function | `srmTorque` |
| 424 | function | `srmCoenergy` |
| 428 | function | `waveShape` |
| 429 | function | `waveAt` |
| 432 | function | `waveMeasure` |
| 435 | const fn | `cross` |
| 441 | function | `waveFit` |
| 442 | const fn | `res` |
| 451 | function | `impulseWave` |
| 458 | function | `bewley` |
| 461 | const fn | `at` |
| 467 | function | `tlParams` |
| 473 | function | `lightningWave` |
| 477 | function | `pinKind` |
| 479 | function | `xf` |
| 480 | function | `pinPos` |
| 482 | function | `pinDir` |
| 487 | function | `cpeParams` |
| 488 | function | `cpeBank` |
| 492 | function | `cpeZ` |
| 493 | function | `cpeZbank` |
| 494 | function | `boxOf` |
| 495 | function | `bbox` |
| 499 | function | `eng` |
| 503 | function | `parseEng` |
| 506 | function | `parseSched` |

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
| 589 | method | `build` |
| 604 | method | `build` |
| 642 | method | `build` |

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
| 400 | method | `Circuit.R` |
| 403 | method | `Circuit.im_e` |
| 412 | method | `Circuit.im_deriv` |
| 425 | method | `Circuit.sm_cur` |
| 437 | method | `Circuit.sm_ports` |
| 442 | method | `Circuit.sm_deriv` |
| 457 | method | `Circuit.srm_A` |
| 462 | method | `Circuit._seg` |
| 466 | method | `Circuit.srm_cur` |
| 473 | method | `Circuit.srm_torque` |
| 482 | method | `Circuit.srm_currents` |
| 487 | method | `Circuit.srm_deriv` |
| 497 | method | `Circuit.Vsrc` |
| 510 | method | `Circuit.topo` |
| 520 | method | `Circuit.build` |
| 610 | method | `Circuit.bsrc` |
| 637 | method | `Circuit.solve_z` |
| 662 | method | `Circuit.scr_u` |
| 666 | method | `Circuit.scr_gate` |
| 670 | method | `Circuit.scr_edges` |
| 677 | method | `Circuit.gate_state` |
| 690 | method | `Circuit.set_gates` |
| 698 | method | `Circuit.may_turn_on` |
| 702 | method | `Circuit.tolerances` |
| 708 | method | `Circuit.consistent` |
| 734 | method | `Circuit.value` |
| 770 | method | `Circuit.current` |
| 806 | method | `Circuit.prime` |
| 816 | method | `Circuit.sig_in` |
| 820 | method | `Circuit.sh_grid` |
| 832 | method | `Circuit.sh_next` |
| 839 | method | `Circuit.sh_sample` |
| 858 | method | `Circuit.sample` |
| 917 | method | `Circuit.cmp_f` |
| 923 | method | `Circuit.blk_due` |
| 934 | method | `Circuit.eval_blocks` |
| 1166 | method | `Circuit.block_events` |
| 1191 | method | `Circuit.next_event` |
| 1252 | function | `_decimate` |
| 1269 | function | `simulate` |
| 1446 | function | `batch_sim` |

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
