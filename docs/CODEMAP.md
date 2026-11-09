# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 1436 |
| `web/studio/editor.js` | 510 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 942 |
| `web/studio/parts.js` | 554 |
| `web/studio/pyrt.js` | 55 |
| `web/studio/scope.js` | 167 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 705 |
| `run.py` | 138 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1668 |
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
| `tests/test_batch.py` | 182 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 561 |
| `tests/test_templates.py` | 174 |
| `tests/test_tutorials.py` | 563 |
| `tests/js/batch_requests.js` | 81 |
| `tests/js/sim_cases.js` | 291 |
| `tests/js/tutorial_cases.js` | 123 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/wiring_flow.js` | 104 |

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
| 159 | `SG` | Σπινθηριστής (διάκενο) |
| 168 | `CPL` | Φορτίο σταθερής ισχύος |
| 172 | `SH` | Sample & Hold |
| 181 | `GND` | Γείωση |
| 183 | `JUNC` | Κόμβος |
| 184 | `PWM` | PWM / έλεγχος |
| 206 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 216 | `VM` | Βολτόμετρο |
| 218 | `AM` | Αμπερόμετρο (σε σειρά) |
| 221 | `VP` | Probe τάσης (ως προς τη γη) |
| 223 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 225 | `MEAS` | Μέτρηση στοιχείου |
| 228 | `CONST` | Σταθερά / πρόγραμμα |
| 231 | `GAIN` | Κέρδος |
| 233 | `SUM` | Άθροισμα |
| 236 | `MUL` | Γινόμενο |
| 238 | `DIV` | Διαίρεση a/b |
| 241 | `SAT` | Κορεσμός |
| 244 | `CMP` | Συγκριτής |
| 247 | `LOGIC` | Λογική πύλη |
| 250 | `PIB` | PI διακριτός |
| 256 | `UD` | Καθυστέρηση z⁻¹ |
| 259 | `SR` | SR latch |
| 262 | `CLK` | Ρολόι (τετραγωνικό) |
| 265 | `RAMP` | Φέρον / ράμπα |
| 270 | `EXPR` | Έκφραση |
| 274 | `PY` | Μπλοκ Python |
| 279 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 289 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 304 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 321 | `MOD3` | Διαμορφωτής τριφασικός |
| 324 | `FEST` | Εκτιμητής ροής δρομέα |
| 328 | `INT` | Ολοκληρωτής |
| 332 | `LPF` | Βαθυπερατό 1ης τάξης |
| 335 | `CLARKE` | Clarke abc → αβ |
| 338 | `ICLARKE` | Clarke αβ → abc |
| 341 | `PARK` | Park αβ → dq |
| 343 | `IPARK` | Park dq → αβ |
| 345 | `PLL` | PLL (τριφασικό) |
| 350 | `TAGO` | Ετικέτα: προς (Goto) |
| 353 | `TAGI` | Ετικέτα: από (From) |
| 356 | `DISP` | Ένδειξη |

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
| 579 | `marx` | Υψηλές τάσεις (3.10) | Γεννήτρια Marx: πολυβάθμια κρουστική γεννήτρια με σπινθηριστές |
| 604 | `chop` | Υψηλές τάσεις (3.10) | Αποκομμένη κρουστική τάση: σπινθηριστής αποκοπής |
| 624 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 646 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 660 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 702 | `empty` | Νέο | Κενό κύκλωμα |

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
| 106 | function | `renderChannels` |
| 122 | function | `renderMeasure` |
| 131 | function | `MeasureUnit` |
| 134 | function | `simKey` |
| 135 | function | `perSeries` |
| 136 | function | `refFor` |
| 137 | const fn | `sched` |
| 141 | function | `metricsFor` |
| 145 | function | `metricsRows` |
| 150 | function | `eventMetricsHTML` |
| 152 | function | `renderMetricsPanel` |
| 163 | function | `rawSeries` |
| 166 | function | `autoF1` |
| 168 | function | `renderFFT` |
| 190 | function | `cellZ` |
| 192 | function | `renderEISForm` |
| 193 | const fn | `opt` |
| 197 | function | `runEIS` |
| 205 | function | `drawEIS` |
| 224 | function | `perSamples` |
| 226 | function | `periodText` |
| 227 | const fn | `svgPlot` |
| 229 | function | `pcmMapFn` |
| 231 | const fn | `z` |
| 234 | function | `renderPoincare` |
| 250 | function | `bfParams` |
| 252 | function | `renderBifurcationForm` |
| 256 | function | `runBifurcation` |
| 263 | function | `drawBifurcation` |
| 273 | function | `niceTop` |
| 276 | function | `btStatus` |
| 277 | function | `parseStep` |
| 278 | function | `runBatch` |
| 294 | function | `clearBatch` |
| 296 | function | `meanPL` |
| 298 | function | `ringTrace` |
| 300 | function | `compareHTML` |
| 310 | function | `renderBatch` |
| 315 | function | `parseCSV` |
| 317 | const fn | `cells` |
| 318 | const fn | `num` |
| 324 | const fn | `normName` |
| 325 | function | `renderCsvMap` |
| 326 | const fn | `auto` |
| 332 | function | `applyCsv` |
| 337 | function | `renderCsv` |
| 339 | function | `clearCsv` |
| 341 | function | `sampleCompareHTML` |
| 354 | function | `liveChange` |
| 356 | function | `renderLiveLog` |
| 362 | function | `changesToSchedule` |
| 364 | const fn | `f` |
| 369 | function | `updateLivePanel` |
| 374 | function | `setLivePanel` |
| 377 | function | `switchesOf` |
| 380 | function | `addPulses` |
| 382 | function | `pulseKeys` |
| 383 | function | `refreshControls` |
| 385 | const fn | `phase` |
| 419 | const fn | `setD` |
| 430 | const fn | `setPh` |
| 442 | const fn | `pinNow` |
| 449 | const fn | `pinSet` |
| 459 | function | `pinMap` |
| 460 | function | `pinX` |
| 461 | function | `pinV` |
| 464 | function | `closeInspector` |
| 465 | function | `placePopup` |
| 466 | function | `fieldHTML` |
| 473 | function | `openInspector` |
| 480 | const fn | `wired` |
| 486 | const fn | `apply` |
| 496 | function | `openWireInspector` |
| 511 | const fn | `numOf` |
| 517 | function | `psec` |
| 519 | function | `propsOpen` |
| 520 | function | `setProps` |
| 522 | function | `focusComp` |
| 523 | function | `togglePin` |
| 526 | function | `renderProps` |
| 535 | function | `propsComp` |
| 536 | const fn | `secOf` |
| 538 | const fn | `row` |
| 544 | const fn | `wired` |
| 550 | function | `propsJunc` |
| 552 | function | `propsWire` |
| 557 | function | `propsMulti` |
| 559 | function | `propsCircuit` |
| 569 | const fn | `opt` |
| 577 | const fn | `chk` |
| 585 | function | `bindProps` |
| 605 | function | `liveApply` |
| 608 | function | `closeMenu` |
| 609 | function | `openMenu` |
| 625 | function | `updateHover` |
| 639 | function | `renderPalette` |
| 646 | function | `tutorial` |
| 649 | function | `circuitSig` |
| 659 | function | `tutorialRef` |
| 660 | function | `theoryValidity` |
| 666 | function | `staleBanner` |
| 669 | function | `bindRestore` |
| 670 | function | `loadTutorial` |
| 674 | function | `applyProject` |
| 683 | function | `renderTutorial` |
| 693 | function | `gallery` |
| 699 | function | `api` |
| 700 | function | `paramsOf` |
| 701 | function | `avgOver` |
| 704 | function | `simValue` |
| 710 | function | `lastPP` |
| 712 | function | `runTheory` |
| 724 | function | `cmpRows` |
| 725 | function | `stepsHTML` |
| 726 | function | `renderTheory` |
| 756 | function | `rippleDev` |
| 758 | function | `periodAvgAt` |
| 760 | function | `samplingTheory` |
| 769 | const fn | `lastAt` |
| 791 | function | `polyTheory` |
| 798 | const fn | `frac` |
| 827 | function | `lastPeriods` |
| 828 | function | `evalOrderHTML` |
| 831 | function | `blocksTheory` |
| 846 | function | `pcmTheory` |
| 872 | function | `codeTheory` |
| 882 | function | `eisTheory` |
| 884 | const fn | `ser` |
| 897 | function | `imSteady` |
| 900 | function | `imPar` |
| 901 | function | `phaseRms` |
| 902 | function | `vfTheory` |
| 915 | function | `focTheory` |
| 932 | function | `synTheory` |
| 951 | const fn | `need` |
| 971 | function | `pmTheory` |
| 973 | const fn | `mtpa` |
| 989 | function | `srmTheory` |
| 1004 | const fn | `curve` |
| 1015 | function | `lgTheory` |
| 1026 | const fn | `cr` |
| 1033 | function | `chaosTheory` |
| 1045 | function | `dcDriveTheory` |
| 1046 | const fn | `per` |
| 1047 | const fn | `cross` |
| 1077 | function | `twModel` |
| 1080 | const fn | `g` |
| 1083 | function | `twLattice` |
| 1090 | const fn | `marks` |
| 1093 | function | `twTheory` |
| 1101 | const fn | `at` |
| 1118 | function | `arTheory` |
| 1138 | function | `impulseMeasure` |
| 1140 | const fn | `cross` |
| 1143 | function | `marxTheory` |
| 1161 | function | `chopModel` |
| 1164 | const fn | `f` |
| 1167 | function | `chopTheory` |
| 1180 | function | `formulaTheory` |
| 1244 | function | `nodeAvg` |
| 1250 | function | `circuitForMath` |
| 1282 | function | `scheduleMath` |
| 1283 | function | `batteryKey` |
| 1285 | function | `mathChoices` |
| 1286 | const fn | `prim` |
| 1288 | function | `renderMathChoices` |
| 1290 | function | `runTemplate` |
| 1296 | function | `runMath` |
| 1317 | function | `saveLocal` |
| 1318 | function | `download` |
| 1319 | function | `exportCSV` |
| 1325 | function | `syncScopeInputs` |
| 1326 | function | `setSpeed` |
| 1329 | function | `openSettings` |
| 1330 | const fn | `sel` |
| 1331 | const fn | `chk` |
| 1349 | function | `boot` |
| 1382 | const fn | `mv` |
| 1383 | const fn | `up` |
| 1384 | const fn | `navOpen` |
| 1390 | const fn | `probeSel` |
| 1433 | function | `renderTheoryLive` |

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
| 260 | method | `renderLabels` |
| 267 | method | `renderWires` |
| 281 | method | `pathD` |
| 285 | method | `midLabel` |
| 286 | method | `renderPins` |
| 296 | method | `renderSel` |
| 298 | method | `setLive` |
| 299 | method | `updateLive` |
| 306 | method | `drawArrows` |
| 316 | method | `world` |
| 318 | method | `hitAt` |
| 319 | method | `hitOf` |
| 321 | method | `down` |
| 347 | method | `move` |
| 360 | method | `up` |
| 374 | method | `cancelDrag` |
| 375 | method | `hoverPin` |
| 377 | method | `dbl` |
| 378 | method | `menu` |
| 380 | method | `wheel` |
| 385 | method | `key` |
| 407 | method | `beginDrag` |
| 414 | method | `dragMove` |
| 424 | method | `endDrag` |
| 431 | method | `dragSeg` |
| 434 | const fn | `stub` |
| 443 | method | `drawMarquee` |
| 446 | method | `marqueeSelect` |
| 449 | const fn | `inside` |
| 455 | method | `beginPlace` |
| 456 | method | `ghost` |
| 458 | method | `finishPlace` |
| 459 | method | `cancelPlace` |
| 461 | method | `startWire` |
| 462 | method | `startWireFrom` |
| 463 | method | `previewWire` |
| 472 | method | `wireClick` |
| 478 | method | `orthoNext` |
| 479 | method | `finishWire` |
| 495 | method | `cancelWire` |
| 497 | method | `splitWire` |
| 507 | method | `wireNetPin` |

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
| 275 | function | `compileSignals` |
| 297 | function | `cmpF` |
| 301 | function | `stampM` |
| 303 | function | `luFactor` |
| 309 | function | `luSolve` |
| 316 | class | `Sim` |
| 317 | method | `constructor` |
| 319 | method | `basePeriod` |
| 322 | method | `tlMaxStep` |
| 323 | method | `setStep` |
| 324 | method | `load` |
| 361 | method | `reset` |
| 364 | method | `imStep` |
| 371 | method | `smStep` |
| 373 | method | `srmStep` |
| 374 | method | `srmOutputs` |
| 375 | method | `smOutputs` |
| 376 | method | `imSources` |
| 377 | method | `pyBlocks` |
| 383 | method | `setMethod` |
| 384 | method | `setControl` |
| 385 | method | `setBlock` |
| 386 | method | `setHold` |
| 388 | method | `markChange` |
| 390 | method | `channelKeys` |
| 408 | method | `allocRecord` |
| 415 | method | `V` |
| 416 | method | `elCurrent` |
| 420 | method | `portI` |
| 422 | method | `computeVals` |
| 447 | method | `recordNow` |
| 455 | method | `closePeriod` |
| 464 | method | `lastPeriod` |
| 465 | method | `now` |
| 470 | method | `gateOf` |
| 476 | method | `rawGate` |
| 487 | method | `carrier` |
| 490 | method | `shGrid` |
| 491 | method | `shNext` |
| 493 | method | `sampleHolds` |
| 498 | method | `samples` |
| 499 | method | `ctrlEdges` |
| 505 | method | `scrU` |
| 506 | method | `scrGate` |
| 507 | method | `scrEdges` |
| 508 | method | `setFiring` |
| 509 | method | `compV` |
| 510 | method | `compI` |
| 512 | method | `dbl` |
| 513 | method | `sampleControllers` |
| 541 | method | `evalBlocks` |
| 605 | method | `blkDue` |
| 607 | method | `zcFrac` |
| 610 | method | `saveState` |
| 612 | method | `restoreState` |
| 615 | method | `gateSig` |
| 619 | method | `values` |
| 636 | method | `assemble` |
| 638 | const fn | `g` |
| 660 | method | `rhs` |
| 662 | const fn | `J` |
| 679 | method | `cplLinearize` |
| 681 | method | `solveOnce` |
| 689 | method | `solve` |
| 701 | method | `nlLinearize` |
| 704 | method | `check` |
| 719 | method | `commit` |
| 737 | method | `initialSolve` |
| 746 | method | `tlRecord` |
| 750 | method | `tlHist` |
| 757 | method | `step` |
| 759 | const fn | `gs` |
| 765 | method | `stepCore` |
| 811 | method | `edgeSolve` |
| 814 | method | `edgePoint` |
| 815 | method | `nextEvent` |
| 821 | const fn | `sch` |
| 838 | method | `spwmCut` |
| 841 | const fn | `sig` |
| 846 | method | `run` |
| 872 | function | `exportForBatch` |
| 881 | const fn | `ci` |
| 882 | const fn | `vd` |
| 883 | const fn | `V` |
| 884 | const fn | `I` |
| 885 | const fn | `portRec` |
| 886 | const fn | `rec` |
| 902 | const fn | `clkOf` |
| 925 | function | `sweepPoint` |
| 933 | function | `eisPoint` |

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
| 360 | function | `defaults` |
| 362 | function | `elPins` |
| 363 | function | `sigPins` |
| 364 | function | `pinsOf` |
| 367 | function | `parseMat` |
| 369 | function | `nPorts` |
| 370 | function | `portY` |
| 371 | function | `portPins` |
| 372 | function | `portBox` |
| 374 | function | `posDef` |
| 376 | function | `symmetric` |
| 377 | function | `matInv` |
| 382 | function | `klMatrix` |
| 393 | function | `kgMatrix` |
| 401 | function | `srmGeo` |
| 403 | function | `srmSpins` |
| 405 | function | `srmPins` |
| 407 | function | `satD` |
| 408 | function | `satDinv` |
| 409 | function | `srmAlignedPsi` |
| 410 | function | `srmModelPsi` |
| 411 | function | `srmTableText` |
| 414 | function | `srmMag` |
| 430 | function | `chkMag` |
| 432 | function | `srmA` |
| 435 | function | `seg` |
| 436 | function | `srmPsi` |
| 438 | function | `srmCur` |
| 440 | function | `srmTorque` |
| 443 | function | `srmCoenergy` |
| 447 | function | `waveShape` |
| 448 | function | `waveAt` |
| 451 | function | `waveMeasure` |
| 454 | const fn | `cross` |
| 460 | function | `waveFit` |
| 461 | const fn | `res` |
| 470 | function | `impulseWave` |
| 478 | function | `bewley` |
| 481 | const fn | `at` |
| 487 | function | `movChar` |
| 492 | const fn | `pick` |
| 493 | const fn | `cur` |
| 494 | const fn | `inv` |
| 498 | function | `impulseDesign` |
| 503 | function | `impulseRoots` |
| 506 | function | `tlParams` |
| 512 | function | `lightningWave` |
| 516 | function | `pinKind` |
| 518 | function | `xf` |
| 519 | function | `pinPos` |
| 521 | function | `pinDir` |
| 526 | function | `cpeParams` |
| 527 | function | `cpeBank` |
| 531 | function | `cpeZ` |
| 532 | function | `cpeZbank` |
| 533 | function | `boxOf` |
| 534 | function | `bbox` |
| 538 | function | `eng` |
| 542 | function | `parseEng` |
| 545 | function | `parseSched` |

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
| 585 | method | `build` |
| 610 | method | `build` |
| 630 | method | `build` |
| 650 | method | `build` |
| 665 | method | `build` |
| 703 | method | `build` |

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
| 42 | class | `BatchError` |
| 46 | function | `sched_at` |
| 60 | function | `wave_at` |
| 74 | function | `mov_seg` |
| 79 | function | `_powr` |
| 83 | function | `mov_cur` |
| 97 | function | `mov_inv` |
| 109 | function | `sat_d` |
| 116 | function | `sat_d_inv` |
| 128 | function | `_f` |
| 136 | class | `Ctrl` |
| 140 | method | `Ctrl.__init__` |
| 165 | method | `Ctrl.dbl` |
| 168 | method | `Ctrl.raw` |
| 188 | method | `Ctrl.gate` |
| 200 | method | `Ctrl.carrier_at` |
| 211 | method | `Ctrl.edges` |
| 231 | function | `_lut` |
| 242 | function | `eval_ast` |
| 268 | function | `make_python_block` |
| 299 | class | `Circuit` |
| 300 | method | `Circuit.__init__` |
| 467 | method | `Circuit.R` |
| 470 | method | `Circuit.im_e` |
| 479 | method | `Circuit.im_deriv` |
| 492 | method | `Circuit.sm_cur` |
| 504 | method | `Circuit.sm_ports` |
| 509 | method | `Circuit.sm_deriv` |
| 524 | method | `Circuit.srm_A` |
| 529 | method | `Circuit._seg` |
| 533 | method | `Circuit.srm_cur` |
| 540 | method | `Circuit.srm_torque` |
| 549 | method | `Circuit.srm_currents` |
| 554 | method | `Circuit.srm_deriv` |
| 564 | method | `Circuit.Vsrc` |
| 577 | method | `Circuit.topo` |
| 587 | method | `Circuit.build` |
| 684 | method | `Circuit.bsrc` |
| 718 | method | `Circuit.solve_z` |
| 744 | method | `Circuit.solve_nl` |
| 786 | method | `Circuit.tl_hist` |
| 801 | method | `Circuit.tl_ih` |
| 806 | method | `Circuit.tl_record` |
| 822 | method | `Circuit.scr_u` |
| 826 | method | `Circuit.scr_gate` |
| 830 | method | `Circuit.scr_edges` |
| 837 | method | `Circuit.gate_state` |
| 850 | method | `Circuit.set_gates` |
| 858 | method | `Circuit.may_turn_on` |
| 862 | method | `Circuit.tolerances` |
| 868 | method | `Circuit.consistent` |
| 910 | method | `Circuit.value` |
| 946 | method | `Circuit.current` |
| 987 | method | `Circuit.prime` |
| 997 | method | `Circuit.sig_in` |
| 1001 | method | `Circuit.sh_grid` |
| 1013 | method | `Circuit.sh_next` |
| 1020 | method | `Circuit.sh_sample` |
| 1039 | method | `Circuit.sample` |
| 1098 | method | `Circuit.cmp_f` |
| 1104 | method | `Circuit.blk_due` |
| 1115 | method | `Circuit.eval_blocks` |
| 1347 | method | `Circuit.block_events` |
| 1372 | method | `Circuit.next_event` |
| 1439 | function | `_decimate` |
| 1456 | function | `simulate` |
| 1662 | function | `batch_sim` |

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
