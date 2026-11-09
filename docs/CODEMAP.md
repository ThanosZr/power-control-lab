# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/app.js` | 1705 |
| `web/studio/editor.js` | 514 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1077 |
| `web/studio/parts.js` | 563 |
| `web/studio/pyrt.js` | 57 |
| `web/studio/scenario.js` | 82 |
| `web/studio/scenario_worker.js` | 88 |
| `web/studio/scope.js` | 167 |
| `web/studio/stepcheck.js` | 163 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 810 |
| `pcl/runner.js` | 15 |
| `run.py` | 176 |
| `engine/__init__.py` | 1 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1775 |
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
| `engine/templates.py` | 317 |
| `engine/workbench.py` | 129 |
| `pcl/__init__.py` | 6 |
| `pcl/__main__.py` | 156 |
| `pcl/core.py` | 749 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_batch.py` | 188 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_matlab.py` | 68 |
| `tests/test_pcl.py` | 207 |
| `tests/test_step.py` | 79 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 593 |
| `tests/test_templates.py` | 237 |
| `tests/test_tutorials.py` | 703 |
| `tests/js/batch_requests.js` | 84 |
| `tests/js/sim_cases.js` | 330 |
| `tests/js/step_cases.js` | 61 |
| `tests/js/tutorial_cases.js` | 137 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/scenario_flow.js` | 46 |
| `tests/ui/step_flow.js` | 41 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/wiring_flow.js` | 128 |

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
| 136 | `KL` | Συζευγμένα πηνία (N×N) |
| 147 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 154 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 162 | `SG` | Σπινθηριστής (διάκενο) |
| 175 | `CPL` | Φορτίο σταθερής ισχύος |
| 179 | `SH` | Sample & Hold |
| 188 | `GND` | Γείωση |
| 190 | `JUNC` | Κόμβος |
| 191 | `PWM` | PWM / έλεγχος |
| 213 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 223 | `VM` | Βολτόμετρο |
| 225 | `AM` | Αμπερόμετρο (σε σειρά) |
| 228 | `VP` | Probe τάσης (ως προς τη γη) |
| 230 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 232 | `MEAS` | Μέτρηση στοιχείου |
| 235 | `CONST` | Σταθερά / πρόγραμμα |
| 238 | `GAIN` | Κέρδος |
| 240 | `SUM` | Άθροισμα |
| 243 | `MUL` | Γινόμενο |
| 245 | `DIV` | Διαίρεση a/b |
| 248 | `SAT` | Κορεσμός |
| 251 | `CMP` | Συγκριτής |
| 254 | `LOGIC` | Λογική πύλη |
| 257 | `PIB` | PI διακριτός |
| 263 | `UD` | Καθυστέρηση z⁻¹ |
| 266 | `SR` | SR latch |
| 269 | `CLK` | Ρολόι (τετραγωνικό) |
| 272 | `RAMP` | Φέρον / ράμπα |
| 277 | `EXPR` | Έκφραση |
| 281 | `PY` | Μπλοκ Python |
| 286 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 296 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 311 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 328 | `MOD3` | Διαμορφωτής τριφασικός |
| 331 | `FEST` | Εκτιμητής ροής δρομέα |
| 335 | `INT` | Ολοκληρωτής |
| 339 | `LPF` | Βαθυπερατό 1ης τάξης |
| 342 | `CLARKE` | Clarke abc → αβ |
| 345 | `ICLARKE` | Clarke αβ → abc |
| 348 | `PARK` | Park αβ → dq |
| 350 | `IPARK` | Park dq → αβ |
| 352 | `PLL` | PLL (τριφασικό) |
| 357 | `TAGO` | Ετικέτα: προς (Goto) |
| 360 | `TAGI` | Ετικέτα: από (From) |
| 363 | `DISP` | Ένδειξη |

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
| 609 | `chop` | Υψηλές τάσεις (3.10) | Αποκομμένη κρουστική τάση: σπινθηριστής αποκοπής |
| 643 | `hv153` | Υψηλές τάσεις (3.11) | Ασκήσεις 15.3: γεννήτριες κρουστικών τάσεων (βιβλίο, ακριβής λύση, προσομοίωση) |
| 664 | `lossline` | Υψηλές τάσεις (3.11) | Γραμμή με απώλειες: απόσβεση και παραμόρφωση οδεύοντος κύματος |
| 681 | `voltime` | Υψηλές τάσεις (3.11) | Καμπύλη τάσης–χρόνου διακένου (κριτήριο ενέργειας διάσπασης) |
| 697 | `hvdiv` | Υψηλές τάσεις (3.12) | Μέτρηση εναλλασσόμενης υψηλής τάσης: καταμεριστές (ασκήσεις 15.1.3, 15.1.5) |
| 714 | `schering` | Υψηλές τάσεις (3.12) | Γέφυρα Schering: χωρητικότητα και συντελεστής απωλειών (άσκηση 15.5.12) |
| 729 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 751 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 765 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 807 | `empty` | Νέο | Κενό κύκλωμα |

## API του server (`run.py`, `/api/<action>`)

`analyze`, `batch_sim`, `bidir`, `boundary`, `capacitance`, `curves`, `derivation`, `design`, `envelope`, `inverse`, `linearize`, `model_proof`, `problem`, `scenario_run`, `scenario_sweep`, `solve`, `studio_math`, `sweep`, `switching`, `template_solve`, `validate_circuit`

## Templates δεδομένων (`web/studio/exercises/`)

`buck_design.template.json`, `dc_drive.template.json`, `hv_coax.template.json`, `hv_downconductor.template.json`, `hv_impulse_design.template.json`, `hv_multilevel.template.json`, `hv_risk.template.json`, `hv_successive.template.json`, `hv_two_layer.template.json`, `pcm_slope.template.json`, `pe2_battery.template.json`, `pe2_polyphase.template.json`, `pe2_sampling.template.json`

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
| 577 | const fn | `sv` |
| 583 | const fn | `chk` |
| 591 | function | `bindProps` |
| 615 | function | `diagItems` |
| 623 | function | `renderDiag` |
| 634 | function | `openDiag` |
| 635 | function | `flashComp` |
| 638 | function | `scheduleStepCheck` |
| 639 | function | `syncStepMode` |
| 684 | function | `scenSetCode` |
| 685 | function | `scenState` |
| 686 | function | `scenTab` |
| 687 | function | `scenOut` |
| 688 | function | `scenWorker` |
| 690 | function | `scenRun` |
| 698 | function | `scenStop` |
| 699 | function | `scenDone` |
| 701 | function | `scenMsg` |
| 711 | function | `renderScenFiles` |
| 714 | const fn | `scenNum` |
| 715 | function | `scenTable` |
| 716 | function | `scenShow` |
| 727 | function | `scenTicks` |
| 728 | function | `scenPlot` |
| 732 | const fn | `thin` |
| 739 | const fn | `dig` |
| 748 | function | `initScenarios` |
| 755 | function | `liveApply` |
| 758 | function | `closeMenu` |
| 759 | function | `openMenu` |
| 775 | function | `updateHover` |
| 789 | function | `renderPalette` |
| 796 | function | `tutorial` |
| 799 | function | `circuitSig` |
| 809 | function | `tutorialRef` |
| 810 | function | `theoryValidity` |
| 816 | function | `staleBanner` |
| 819 | function | `bindRestore` |
| 820 | function | `loadTutorial` |
| 824 | function | `applyProject` |
| 834 | function | `renderTutorial` |
| 844 | function | `gallery` |
| 850 | function | `api` |
| 851 | function | `paramsOf` |
| 852 | function | `avgOver` |
| 855 | function | `simValue` |
| 861 | function | `lastPP` |
| 863 | function | `runTheory` |
| 875 | function | `cmpRows` |
| 876 | function | `stepsHTML` |
| 877 | function | `renderTheory` |
| 907 | function | `rippleDev` |
| 909 | function | `periodAvgAt` |
| 911 | function | `samplingTheory` |
| 920 | const fn | `lastAt` |
| 942 | function | `polyTheory` |
| 949 | const fn | `frac` |
| 978 | function | `lastPeriods` |
| 979 | function | `evalOrderHTML` |
| 982 | function | `blocksTheory` |
| 997 | function | `pcmTheory` |
| 1023 | function | `codeTheory` |
| 1033 | function | `eisTheory` |
| 1035 | const fn | `ser` |
| 1048 | function | `imSteady` |
| 1051 | function | `imPar` |
| 1052 | function | `phaseRms` |
| 1053 | function | `vfTheory` |
| 1066 | function | `focTheory` |
| 1083 | function | `synTheory` |
| 1102 | const fn | `need` |
| 1122 | function | `pmTheory` |
| 1124 | const fn | `mtpa` |
| 1140 | function | `srmTheory` |
| 1155 | const fn | `curve` |
| 1166 | function | `lgTheory` |
| 1177 | const fn | `cr` |
| 1184 | function | `chaosTheory` |
| 1196 | function | `dcDriveTheory` |
| 1197 | const fn | `per` |
| 1198 | const fn | `cross` |
| 1228 | function | `twModel` |
| 1231 | const fn | `g` |
| 1234 | function | `twLattice` |
| 1241 | const fn | `marks` |
| 1244 | function | `twTheory` |
| 1252 | const fn | `at` |
| 1269 | function | `arTheory` |
| 1289 | function | `impulseMeasure` |
| 1291 | const fn | `cross` |
| 1294 | function | `marxTheory` |
| 1312 | function | `chopModel` |
| 1315 | const fn | `f` |
| 1318 | function | `chopTheory` |
| 1332 | function | `cmp3` |
| 1336 | function | `hvExact` |
| 1337 | function | `hv153Theory` |
| 1363 | function | `besI1e` |
| 1365 | function | `heaviside` |
| 1367 | function | `lossTheory` |
| 1386 | function | `vtBreak` |
| 1387 | function | `vtTheory` |
| 1407 | function | `hvdivTheory` |
| 1409 | const fn | `r` |
| 1421 | function | `scheringTheory` |
| 1422 | const fn | `inv` |
| 1431 | const fn | `sr` |
| 1437 | function | `formulaTheory` |
| 1506 | function | `nodeAvg` |
| 1512 | function | `circuitForMath` |
| 1544 | function | `scheduleMath` |
| 1545 | function | `batteryKey` |
| 1547 | function | `mathChoices` |
| 1548 | const fn | `prim` |
| 1550 | function | `renderMathChoices` |
| 1552 | function | `runTemplate` |
| 1558 | function | `runMath` |
| 1579 | function | `saveLocal` |
| 1580 | function | `download` |
| 1581 | function | `exportCSV` |
| 1587 | function | `syncScopeInputs` |
| 1588 | function | `setSpeed` |
| 1591 | function | `openSettings` |
| 1592 | const fn | `sel` |
| 1593 | const fn | `chk` |
| 1611 | function | `boot` |
| 1650 | const fn | `mv` |
| 1651 | const fn | `up` |
| 1652 | const fn | `navOpen` |
| 1658 | const fn | `probeSel` |
| 1702 | function | `renderTheoryLive` |

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
| 456 | method | `escape` |
| 459 | method | `beginPlace` |
| 460 | method | `ghost` |
| 462 | method | `finishPlace` |
| 463 | method | `cancelPlace` |
| 465 | method | `startWire` |
| 466 | method | `startWireFrom` |
| 467 | method | `previewWire` |
| 476 | method | `wireClick` |
| 482 | method | `orthoNext` |
| 483 | method | `finishWire` |
| 499 | method | `cancelWire` |
| 501 | method | `splitWire` |
| 511 | method | `wireNetPin` |

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
| 20 | const fn | `schedAt` |
| 21 | const fn | `num` |
| 23 | const fn | `numList` |
| 28 | function | `smPort` |
| 32 | function | `smOut` |
| 35 | class | `NetlistError` |
| 40 | function | `dePiece` |
| 42 | const fn | `F` |
| 43 | function | `deInt` |
| 45 | function | `deFrac` |
| 48 | function | `tlElement` |
| 51 | function | `buildNetlist` |
| 55 | const fn | `union` |
| 66 | const fn | `nm` |
| 85 | const fn | `sn` |
| 89 | const fn | `isJ` |
| 109 | const fn | `lbl` |
| 114 | const fn | `node` |
| 115 | const fn | `internal` |
| 118 | const fn | `mkBlock` |
| 125 | const fn | `add` |
| 126 | const fn | `series` |
| 293 | function | `compileSignals` |
| 315 | function | `cmpF` |
| 319 | function | `stampM` |
| 321 | function | `luFactor` |
| 327 | function | `luSolve` |
| 334 | class | `Sim` |
| 335 | method | `constructor` |
| 337 | method | `basePeriod` |
| 340 | method | `tlMaxStep` |
| 341 | method | `setStep` |
| 344 | method | `stIndex` |
| 357 | method | `stVec` |
| 358 | method | `stepCfg` |
| 359 | method | `varSetup` |
| 362 | method | `setStepMode` |
| 364 | method | `hGrid` |
| 367 | method | `modeCap` |
| 370 | method | `lteReset` |
| 371 | method | `ltePush` |
| 375 | method | `lteErr` |
| 385 | method | `varCheck` |
| 400 | method | `note` |
| 403 | method | `stepCheck` |
| 404 | method | `diagnostics` |
| 406 | method | `ringCheck` |
| 415 | method | `stateMap` |
| 426 | method | `load` |
| 465 | method | `reset` |
| 468 | method | `imStep` |
| 475 | method | `smStep` |
| 477 | method | `srmStep` |
| 478 | method | `srmOutputs` |
| 479 | method | `smOutputs` |
| 480 | method | `imSources` |
| 481 | method | `pyBlocks` |
| 487 | method | `setMethod` |
| 488 | method | `setControl` |
| 489 | method | `setBlock` |
| 490 | method | `setHold` |
| 492 | method | `markChange` |
| 494 | method | `channelKeys` |
| 512 | method | `allocRecord` |
| 519 | method | `V` |
| 520 | method | `elCurrent` |
| 524 | method | `portI` |
| 526 | method | `computeVals` |
| 551 | method | `recordNow` |
| 559 | method | `closePeriod` |
| 568 | method | `lastPeriod` |
| 569 | method | `now` |
| 574 | method | `gateOf` |
| 580 | method | `rawGate` |
| 591 | method | `carrier` |
| 594 | method | `shGrid` |
| 595 | method | `shNext` |
| 597 | method | `sampleHolds` |
| 602 | method | `samples` |
| 603 | method | `ctrlEdges` |
| 609 | method | `scrU` |
| 610 | method | `scrGate` |
| 611 | method | `scrEdges` |
| 612 | method | `setFiring` |
| 613 | method | `compV` |
| 614 | method | `compI` |
| 616 | method | `dbl` |
| 617 | method | `sampleControllers` |
| 645 | method | `evalBlocks` |
| 709 | method | `blkDue` |
| 711 | method | `zcFrac` |
| 714 | method | `saveState` |
| 716 | method | `restoreState` |
| 720 | method | `gateSigPeek` |
| 723 | method | `gateSig` |
| 727 | method | `values` |
| 744 | method | `assemble` |
| 746 | const fn | `g` |
| 768 | method | `rhs` |
| 770 | const fn | `J` |
| 787 | method | `cplLinearize` |
| 789 | method | `solveOnce` |
| 797 | method | `solve` |
| 811 | method | `nlLinearize` |
| 814 | method | `check` |
| 830 | method | `commit` |
| 849 | method | `initialSolve` |
| 859 | method | `tlSources` |
| 863 | method | `tlRecord` |
| 869 | method | `tlHist` |
| 876 | method | `step` |
| 878 | const fn | `gs` |
| 884 | method | `stepCore` |
| 935 | method | `edgeSolve` |
| 938 | method | `edgePoint` |
| 939 | method | `nextEvent` |
| 945 | const fn | `sch` |
| 963 | method | `spwmCut` |
| 966 | const fn | `sig` |
| 971 | method | `run` |
| 1007 | function | `exportForBatch` |
| 1016 | const fn | `ci` |
| 1017 | const fn | `vd` |
| 1018 | const fn | `V` |
| 1019 | const fn | `I` |
| 1020 | const fn | `portRec` |
| 1021 | const fn | `rec` |
| 1037 | const fn | `clkOf` |
| 1060 | function | `sweepPoint` |
| 1068 | function | `eisPoint` |

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
| 367 | function | `defaults` |
| 369 | function | `elPins` |
| 370 | function | `sigPins` |
| 371 | function | `pinsOf` |
| 374 | function | `parseMat` |
| 376 | function | `nPorts` |
| 377 | function | `portY` |
| 378 | function | `portPins` |
| 379 | function | `portBox` |
| 381 | function | `posDef` |
| 383 | function | `symmetric` |
| 384 | function | `matInv` |
| 389 | function | `klMatrix` |
| 400 | function | `kgMatrix` |
| 408 | function | `srmGeo` |
| 410 | function | `srmSpins` |
| 412 | function | `srmPins` |
| 414 | function | `satD` |
| 415 | function | `satDinv` |
| 416 | function | `srmAlignedPsi` |
| 417 | function | `srmModelPsi` |
| 418 | function | `srmTableText` |
| 421 | function | `srmMag` |
| 437 | function | `chkMag` |
| 439 | function | `srmA` |
| 442 | function | `seg` |
| 443 | function | `srmPsi` |
| 445 | function | `srmCur` |
| 447 | function | `srmTorque` |
| 450 | function | `srmCoenergy` |
| 454 | function | `waveShape` |
| 455 | function | `waveAt` |
| 458 | function | `waveMeasure` |
| 461 | const fn | `cross` |
| 467 | function | `waveFit` |
| 468 | const fn | `res` |
| 477 | function | `impulseWave` |
| 485 | function | `bewley` |
| 488 | const fn | `at` |
| 494 | function | `movChar` |
| 499 | const fn | `pick` |
| 500 | const fn | `cur` |
| 501 | const fn | `inv` |
| 505 | function | `impulseDesign` |
| 510 | function | `impulseRoots` |
| 513 | function | `tlParams` |
| 521 | function | `lightningWave` |
| 525 | function | `pinKind` |
| 527 | function | `xf` |
| 528 | function | `pinPos` |
| 530 | function | `pinDir` |
| 535 | function | `cpeParams` |
| 536 | function | `cpeBank` |
| 540 | function | `cpeZ` |
| 541 | function | `cpeZbank` |
| 542 | function | `boxOf` |
| 543 | function | `bbox` |
| 547 | function | `eng` |
| 551 | function | `parseEng` |
| 554 | function | `parseSched` |

### `web/studio/pyrt.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 38 | function | `pyMessage` |
| 41 | method | `load` |
| 51 | method | `attach` |
| 52 | method | `make` |

### `web/studio/scenario.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 14 | const fn | `tut` |
| 17 | function | `defaultKeys` |
| 22 | function | `measure` |
| 34 | function | `decimate` |
| 39 | function | `run` |
| 47 | const fn | `push` |
| 66 | function | `tutorial` |
| 68 | function | `tutorials` |
| 70 | function | `handle` |
| 78 | const fn | `json` |

### `web/studio/scenario_worker.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 11 | const fn | `post` |
| 60 | function | `boot` |
| 78 | function | `listFiles` |

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

### `web/studio/stepcheck.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 14 | function | `balance` |
| 18 | function | `hessenberg` |
| 22 | function | `hqr` |
| 56 | function | `eig` |
| 59 | function | `eigvecAbs` |
| 78 | const fn | `eng` |
| 81 | function | `divFor` |
| 86 | function | `modes` |
| 88 | const fn | `lam` |
| 101 | function | `owners` |
| 107 | function | `check` |

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
| 596 | function | `marxCircuit` |
| 615 | method | `build` |
| 647 | method | `build` |
| 654 | const fn | `down` |
| 671 | method | `build` |
| 688 | method | `build` |
| 701 | method | `build` |
| 718 | method | `build` |
| 735 | method | `build` |
| 755 | method | `build` |
| 770 | method | `build` |
| 808 | method | `build` |

### `pcl/runner.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | function | `main` |

### `run.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 55 | function | `scenario` |
| 84 | class | `Handler` |
| 85 | method | `Handler.send` |
| 97 | method | `Handler.do_GET` |
| 121 | method | `Handler.do_POST` |
| 152 | function | `main` |

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
| 484 | method | `Circuit.R` |
| 487 | method | `Circuit.im_e` |
| 496 | method | `Circuit.im_deriv` |
| 509 | method | `Circuit.sm_cur` |
| 521 | method | `Circuit.sm_ports` |
| 526 | method | `Circuit.sm_deriv` |
| 541 | method | `Circuit.srm_A` |
| 546 | method | `Circuit._seg` |
| 550 | method | `Circuit.srm_cur` |
| 557 | method | `Circuit.srm_torque` |
| 566 | method | `Circuit.srm_currents` |
| 571 | method | `Circuit.srm_deriv` |
| 581 | method | `Circuit.Vsrc` |
| 594 | method | `Circuit.topo` |
| 604 | method | `Circuit.build` |
| 701 | method | `Circuit.bsrc` |
| 735 | method | `Circuit.solve_z` |
| 761 | method | `Circuit.solve_nl` |
| 803 | method | `Circuit.tl_hist` |
| 820 | method | `Circuit.tl_sec` |
| 827 | method | `Circuit.tl_ih` |
| 831 | method | `Circuit.tl_record` |
| 850 | method | `Circuit.scr_u` |
| 854 | method | `Circuit.scr_gate` |
| 858 | method | `Circuit.scr_edges` |
| 865 | method | `Circuit.gate_state` |
| 878 | method | `Circuit.set_gates` |
| 886 | method | `Circuit.may_turn_on` |
| 890 | method | `Circuit.tolerances` |
| 896 | method | `Circuit.consistent` |
| 938 | method | `Circuit.value` |
| 974 | method | `Circuit.current` |
| 1015 | method | `Circuit.prime` |
| 1025 | method | `Circuit.sig_in` |
| 1029 | method | `Circuit.sh_grid` |
| 1041 | method | `Circuit.sh_next` |
| 1048 | method | `Circuit.sh_sample` |
| 1067 | method | `Circuit.sample` |
| 1126 | method | `Circuit.cmp_f` |
| 1132 | method | `Circuit.blk_due` |
| 1143 | method | `Circuit.eval_blocks` |
| 1375 | method | `Circuit.block_events` |
| 1400 | method | `Circuit.next_event` |
| 1467 | function | `_decimate` |
| 1484 | function | `_diagnose` |
| 1535 | function | `simulate` |
| 1769 | function | `batch_sim` |

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
| 51 | function | `eng` |
| 67 | function | `_check_expr` |
| 83 | class | `Evaluator` |
| 84 | method | `Evaluator.__init__` |
| 110 | method | `Evaluator.names` |
| 113 | method | `Evaluator.parse` |
| 122 | method | `Evaluator.num` |
| 136 | method | `Evaluator.truth` |
| 142 | method | `Evaluator.run_steps` |
| 165 | method | `Evaluator.fill` |
| 196 | function | `_case_rows` |
| 218 | function | `_questions` |
| 249 | function | `template_solve` |

### `engine/workbench.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 12 | function | `transition_sweep` |
| 36 | function | `axes` |
| 65 | function | `scenarios` |
| 77 | function | `sweep` |
| 115 | function | `capacitance` |

### `pcl/__init__.py`

_(χωρίς συναρτήσεις)_

### `pcl/__main__.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 19 | function | `_dumps` |
| 24 | function | `_project` |
| 32 | function | `_kv` |
| 42 | function | `main` |

### `pcl/core.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 45 | class | `PclError` |
| 49 | function | `version` |
| 57 | function | `parse_value` |
| 78 | function | `_node` |
| 91 | function | `tutorials` |
| 96 | function | `tutorial` |
| 101 | function | `load` |
| 112 | function | `use` |
| 119 | function | `current` |
| 126 | function | `set` |
| 130 | function | `get` |
| 134 | function | `run` |
| 138 | function | `sweep` |
| 142 | function | `params` |
| 146 | class | `Plot` |
| 150 | function | `plot` |
| 159 | function | `show` |
| 196 | function | `_open` |
| 212 | function | `_pairs` |
| 230 | function | `_clean` |
| 241 | function | `job` |
| 270 | class | `Project` |
| 273 | method | `Project.__init__` |
| 279 | method | `Project.comp` |
| 286 | method | `Project.get` |
| 292 | method | `Project.set` |
| 307 | method | `Project.copy` |
| 312 | method | `Project.save` |
| 315 | method | `Project.hash` |
| 319 | method | `Project.params` |
| 323 | method | `Project.channels` |
| 328 | method | `Project._settings` |
| 339 | method | `Project.run` |
| 361 | method | `Project._run_scipy` |
| 390 | method | `Project.sweep` |
| 442 | function | `_sweep_point` |
| 450 | function | `_as_list` |
| 460 | function | `_spec` |
| 476 | function | `_measures` |
| 499 | function | `_base_T` |
| 506 | function | `_unit` |
| 510 | function | `_matname` |
| 515 | class | `Result` |
| 518 | method | `Result.__init__` |
| 527 | method | `Result.__getitem__` |
| 530 | method | `Result.__repr__` |
| 533 | method | `Result.measure` |
| 593 | method | `Result.frame` |
| 602 | method | `Result._meta_lines` |
| 606 | method | `Result.to_csv` |
| 619 | method | `Result._vars` |
| 629 | method | `Result.as_dict` |
| 633 | method | `Result.to_json` |
| 637 | method | `Result.to_mat` |
| 648 | method | `Result.save` |
| 653 | class | `SweepResult` |
| 656 | method | `SweepResult.__init__` |
| 662 | method | `SweepResult.__repr__` |
| 665 | method | `SweepResult.column` |
| 668 | method | `SweepResult.frame` |
| 675 | method | `SweepResult.to_csv` |
| 687 | method | `SweepResult.to_json` |
| 691 | method | `SweepResult.to_mat` |
| 698 | method | `SweepResult.save` |
| 710 | function | `_el` |
| 715 | function | `_matrix` |
| 720 | function | `_ascii` |
| 727 | function | `_mat_char` |
| 732 | function | `_mat_value` |
| 741 | function | `_savemat` |
