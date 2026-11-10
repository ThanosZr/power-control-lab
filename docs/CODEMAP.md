# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 102 |
| `web/studio/app.js` | 1778 |
| `web/studio/editor.js` | 514 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1129 |
| `web/studio/parts.js` | 577 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 57 |
| `web/studio/scenario.js` | 96 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 167 |
| `web/studio/sim_worker.js` | 9 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 810 |
| `pcl/runner.js` | 15 |
| `run.py` | 263 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 212 |
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
| `pcl/__init__.py` | 14 |
| `pcl/__main__.py` | 203 |
| `pcl/control.py` | 196 |
| `pcl/core.py` | 970 |
| `pcl/formats.py` | 222 |
| `pcl/impulse.py` | 254 |
| `pcl/link.py` | 130 |
| `pcl/plotting.py` | 340 |
| `tests/test_addons.py` | 222 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_batch.py` | 188 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_control.py` | 98 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_matlab.py` | 79 |
| `tests/test_pcl.py` | 288 |
| `tests/test_plotting.py` | 113 |
| `tests/test_step.py` | 109 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 593 |
| `tests/test_templates.py` | 237 |
| `tests/test_tutorials.py` | 703 |
| `tests/js/batch_requests.js` | 84 |
| `tests/js/sim_cases.js` | 330 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/tutorial_cases.js` | 137 |
| `tests/ui/addons_flow.js` | 75 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/scenario_flow.js` | 61 |
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
| 117 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 130 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 140 | `KL` | Συζευγμένα πηνία (N×N) |
| 151 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 158 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 166 | `SG` | Σπινθηριστής (διάκενο) |
| 179 | `CPL` | Φορτίο σταθερής ισχύος |
| 183 | `SH` | Sample & Hold |
| 192 | `GND` | Γείωση |
| 194 | `JUNC` | Κόμβος |
| 195 | `PWM` | PWM / έλεγχος |
| 217 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 227 | `VM` | Βολτόμετρο |
| 229 | `AM` | Αμπερόμετρο (σε σειρά) |
| 232 | `VP` | Probe τάσης (ως προς τη γη) |
| 234 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 236 | `MEAS` | Μέτρηση στοιχείου |
| 239 | `CONST` | Σταθερά / πρόγραμμα |
| 242 | `GAIN` | Κέρδος |
| 244 | `SUM` | Άθροισμα |
| 247 | `MUL` | Γινόμενο |
| 249 | `DIV` | Διαίρεση a/b |
| 252 | `SAT` | Κορεσμός |
| 255 | `CMP` | Συγκριτής |
| 258 | `LOGIC` | Λογική πύλη |
| 261 | `PIB` | PI διακριτός |
| 267 | `UD` | Καθυστέρηση z⁻¹ |
| 270 | `SR` | SR latch |
| 273 | `CLK` | Ρολόι (τετραγωνικό) |
| 276 | `RAMP` | Φέρον / ράμπα |
| 281 | `EXPR` | Έκφραση |
| 285 | `PY` | Μπλοκ Python |
| 290 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 300 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 315 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 332 | `MOD3` | Διαμορφωτής τριφασικός |
| 335 | `FEST` | Εκτιμητής ροής δρομέα |
| 339 | `INT` | Ολοκληρωτής |
| 343 | `LPF` | Βαθυπερατό 1ης τάξης |
| 346 | `CLARKE` | Clarke abc → αβ |
| 349 | `ICLARKE` | Clarke αβ → abc |
| 352 | `PARK` | Park αβ → dq |
| 354 | `IPARK` | Park dq → αβ |
| 356 | `PLL` | PLL (τριφασικό) |
| 361 | `TAGO` | Ετικέτα: προς (Goto) |
| 364 | `TAGI` | Ετικέτα: από (From) |
| 367 | `DISP` | Ένδειξη |

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

### `web/studio/addon_client.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 18 | const fn | `call` |

### `web/studio/addons.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 16 | const fn | `clone` |
| 17 | const fn | `num` |
| 25 | function | `key` |
| 26 | function | `comp` |
| 27 | function | `setOne` |
| 29 | function | `query` |
| 30 | function | `poolOf` |
| 32 | function | `onPage` |
| 33 | function | `solve` |
| 35 | function | `scopeData` |
| 69 | function | `onMessage` |

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
| 258 | function | `runBifurcation` |
| 272 | function | `stopBifurcation` |
| 273 | function | `drawBifurcation` |
| 283 | function | `niceTop` |
| 286 | function | `btStatus` |
| 287 | function | `parseStep` |
| 288 | function | `runBatch` |
| 304 | function | `clearBatch` |
| 306 | function | `meanPL` |
| 308 | function | `ringTrace` |
| 310 | function | `compareHTML` |
| 320 | function | `renderBatch` |
| 325 | function | `parseCSV` |
| 327 | const fn | `cells` |
| 328 | const fn | `num` |
| 334 | const fn | `normName` |
| 335 | function | `renderCsvMap` |
| 336 | const fn | `auto` |
| 342 | function | `applyCsv` |
| 347 | function | `renderCsv` |
| 349 | function | `clearCsv` |
| 351 | function | `sampleCompareHTML` |
| 364 | function | `liveChange` |
| 366 | function | `renderLiveLog` |
| 372 | function | `changesToSchedule` |
| 374 | const fn | `f` |
| 379 | function | `updateLivePanel` |
| 384 | function | `setLivePanel` |
| 387 | function | `switchesOf` |
| 390 | function | `addPulses` |
| 392 | function | `pulseKeys` |
| 393 | function | `refreshControls` |
| 395 | const fn | `phase` |
| 429 | const fn | `setD` |
| 440 | const fn | `setPh` |
| 452 | const fn | `pinNow` |
| 459 | const fn | `pinSet` |
| 469 | function | `pinMap` |
| 470 | function | `pinX` |
| 471 | function | `pinV` |
| 474 | function | `closeInspector` |
| 475 | function | `placePopup` |
| 476 | function | `fieldHTML` |
| 483 | function | `openInspector` |
| 490 | const fn | `wired` |
| 496 | const fn | `apply` |
| 506 | function | `openWireInspector` |
| 521 | const fn | `numOf` |
| 527 | function | `psec` |
| 529 | function | `propsOpen` |
| 530 | function | `setProps` |
| 532 | function | `focusComp` |
| 533 | function | `togglePin` |
| 536 | function | `renderProps` |
| 545 | function | `propsComp` |
| 546 | const fn | `secOf` |
| 548 | const fn | `row` |
| 554 | const fn | `wired` |
| 563 | function | `propsJunc` |
| 565 | function | `propsWire` |
| 570 | function | `propsMulti` |
| 572 | function | `propsCircuit` |
| 582 | const fn | `opt` |
| 590 | const fn | `sv` |
| 596 | const fn | `chk` |
| 604 | function | `bindProps` |
| 629 | function | `diagItems` |
| 638 | function | `renderDiag` |
| 649 | function | `openDiag` |
| 650 | function | `flashComp` |
| 653 | function | `scheduleStepCheck` |
| 654 | function | `syncStepMode` |
| 716 | function | `scenSetCode` |
| 717 | function | `scenState` |
| 718 | function | `scenTab` |
| 719 | function | `scenOut` |
| 720 | function | `scenWorker` |
| 722 | function | `scenRun` |
| 730 | function | `scenStop` |
| 731 | function | `scenDone` |
| 733 | function | `scenMsg` |
| 748 | function | `scenBatch` |
| 753 | function | `scenEval` |
| 756 | function | `addonDock` |
| 759 | function | `renderAddons` |
| 770 | function | `initAddons` |
| 777 | function | `scenBatchWrite` |
| 780 | function | `renderScenFiles` |
| 783 | const fn | `scenNum` |
| 784 | function | `scenTable` |
| 785 | function | `scenShow` |
| 798 | function | `scenTicks` |
| 799 | function | `scenPlot` |
| 803 | const fn | `thin` |
| 810 | const fn | `dig` |
| 821 | function | `initScenarios` |
| 828 | function | `liveApply` |
| 831 | function | `closeMenu` |
| 832 | function | `openMenu` |
| 848 | function | `updateHover` |
| 862 | function | `renderPalette` |
| 869 | function | `tutorial` |
| 872 | function | `circuitSig` |
| 882 | function | `tutorialRef` |
| 883 | function | `theoryValidity` |
| 889 | function | `staleBanner` |
| 892 | function | `bindRestore` |
| 893 | function | `loadTutorial` |
| 897 | function | `applyProject` |
| 907 | function | `renderTutorial` |
| 917 | function | `gallery` |
| 923 | function | `api` |
| 924 | function | `paramsOf` |
| 925 | function | `avgOver` |
| 928 | function | `simValue` |
| 934 | function | `lastPP` |
| 936 | function | `runTheory` |
| 948 | function | `cmpRows` |
| 949 | function | `stepsHTML` |
| 950 | function | `renderTheory` |
| 980 | function | `rippleDev` |
| 982 | function | `periodAvgAt` |
| 984 | function | `samplingTheory` |
| 993 | const fn | `lastAt` |
| 1015 | function | `polyTheory` |
| 1022 | const fn | `frac` |
| 1051 | function | `lastPeriods` |
| 1052 | function | `evalOrderHTML` |
| 1055 | function | `blocksTheory` |
| 1070 | function | `pcmTheory` |
| 1096 | function | `codeTheory` |
| 1106 | function | `eisTheory` |
| 1108 | const fn | `ser` |
| 1121 | function | `imSteady` |
| 1124 | function | `imPar` |
| 1125 | function | `phaseRms` |
| 1126 | function | `vfTheory` |
| 1139 | function | `focTheory` |
| 1156 | function | `synTheory` |
| 1175 | const fn | `need` |
| 1195 | function | `pmTheory` |
| 1197 | const fn | `mtpa` |
| 1213 | function | `srmTheory` |
| 1228 | const fn | `curve` |
| 1239 | function | `lgTheory` |
| 1250 | const fn | `cr` |
| 1257 | function | `chaosTheory` |
| 1269 | function | `dcDriveTheory` |
| 1270 | const fn | `per` |
| 1271 | const fn | `cross` |
| 1301 | function | `twModel` |
| 1304 | const fn | `g` |
| 1307 | function | `twLattice` |
| 1314 | const fn | `marks` |
| 1317 | function | `twTheory` |
| 1325 | const fn | `at` |
| 1342 | function | `arTheory` |
| 1362 | function | `impulseMeasure` |
| 1364 | const fn | `cross` |
| 1367 | function | `marxTheory` |
| 1385 | function | `chopModel` |
| 1388 | const fn | `f` |
| 1391 | function | `chopTheory` |
| 1405 | function | `cmp3` |
| 1409 | function | `hvExact` |
| 1410 | function | `hv153Theory` |
| 1436 | function | `besI1e` |
| 1438 | function | `heaviside` |
| 1440 | function | `lossTheory` |
| 1459 | function | `vtBreak` |
| 1460 | function | `vtTheory` |
| 1480 | function | `hvdivTheory` |
| 1482 | const fn | `r` |
| 1494 | function | `scheringTheory` |
| 1495 | const fn | `inv` |
| 1504 | const fn | `sr` |
| 1510 | function | `formulaTheory` |
| 1579 | function | `nodeAvg` |
| 1585 | function | `circuitForMath` |
| 1617 | function | `scheduleMath` |
| 1618 | function | `batteryKey` |
| 1620 | function | `mathChoices` |
| 1621 | const fn | `prim` |
| 1623 | function | `renderMathChoices` |
| 1625 | function | `runTemplate` |
| 1631 | function | `runMath` |
| 1652 | function | `saveLocal` |
| 1653 | function | `download` |
| 1654 | function | `exportCSV` |
| 1660 | function | `syncScopeInputs` |
| 1661 | function | `setSpeed` |
| 1664 | function | `openSettings` |
| 1665 | const fn | `sel` |
| 1666 | const fn | `chk` |
| 1684 | function | `boot` |
| 1723 | const fn | `mv` |
| 1724 | const fn | `up` |
| 1725 | const fn | `navOpen` |
| 1731 | const fn | `probeSel` |
| 1775 | function | `renderTheoryLive` |

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
| 21 | const fn | `schedAt` |
| 22 | const fn | `num` |
| 24 | const fn | `numList` |
| 29 | function | `smPort` |
| 33 | function | `smOut` |
| 36 | class | `NetlistError` |
| 41 | function | `dePiece` |
| 43 | const fn | `F` |
| 44 | function | `deInt` |
| 46 | function | `deFrac` |
| 49 | function | `tlElement` |
| 52 | function | `buildNetlist` |
| 56 | const fn | `union` |
| 67 | const fn | `nm` |
| 86 | const fn | `sn` |
| 90 | const fn | `isJ` |
| 110 | const fn | `lbl` |
| 115 | const fn | `node` |
| 116 | const fn | `internal` |
| 119 | const fn | `mkBlock` |
| 126 | const fn | `add` |
| 127 | const fn | `series` |
| 294 | function | `compileSignals` |
| 316 | function | `cmpF` |
| 320 | function | `stampM` |
| 322 | function | `luFactor` |
| 328 | function | `luSolve` |
| 335 | class | `Sim` |
| 336 | method | `constructor` |
| 338 | method | `basePeriod` |
| 341 | method | `tlMaxStep` |
| 342 | method | `setStep` |
| 345 | method | `stIndex` |
| 358 | method | `stVec` |
| 359 | method | `stepCfg` |
| 360 | method | `varSetup` |
| 363 | method | `setStepMode` |
| 365 | method | `hGrid` |
| 369 | method | `modeCap` |
| 373 | method | `swEls` |
| 374 | method | `topoKey` |
| 375 | method | `topoInfo` |
| 384 | method | `topoCheck` |
| 401 | method | `lteReset` |
| 402 | method | `ltePush` |
| 406 | method | `lteErr` |
| 416 | method | `varCheck` |
| 431 | method | `note` |
| 434 | method | `stepCheck` |
| 435 | method | `diagnostics` |
| 438 | method | `ringCheck` |
| 447 | method | `stateMap` |
| 449 | method | `stateMap0` |
| 460 | method | `load` |
| 499 | method | `reset` |
| 502 | method | `imStep` |
| 509 | method | `smStep` |
| 511 | method | `srmStep` |
| 512 | method | `srmOutputs` |
| 513 | method | `smOutputs` |
| 514 | method | `imSources` |
| 515 | method | `pyBlocks` |
| 521 | method | `setMethod` |
| 522 | method | `setControl` |
| 523 | method | `setBlock` |
| 524 | method | `setHold` |
| 526 | method | `markChange` |
| 528 | method | `channelKeys` |
| 546 | method | `allocRecord` |
| 553 | method | `V` |
| 554 | method | `elCurrent` |
| 558 | method | `portI` |
| 560 | method | `computeVals` |
| 585 | method | `recordNow` |
| 593 | method | `closePeriod` |
| 602 | method | `lastPeriod` |
| 603 | method | `now` |
| 608 | method | `gateOf` |
| 614 | method | `rawGate` |
| 625 | method | `carrier` |
| 628 | method | `shGrid` |
| 629 | method | `shNext` |
| 631 | method | `sampleHolds` |
| 636 | method | `samples` |
| 637 | method | `ctrlEdges` |
| 643 | method | `scrU` |
| 644 | method | `scrGate` |
| 645 | method | `scrEdges` |
| 646 | method | `setFiring` |
| 647 | method | `compV` |
| 648 | method | `compI` |
| 650 | method | `dbl` |
| 651 | method | `sampleControllers` |
| 679 | method | `evalBlocks` |
| 743 | method | `blkDue` |
| 745 | method | `zcFrac` |
| 748 | method | `saveState` |
| 750 | method | `restoreState` |
| 754 | method | `gateSigPeek` |
| 757 | method | `gateSig` |
| 762 | method | `jumpScheds` |
| 768 | method | `jumpAt` |
| 769 | method | `values` |
| 788 | method | `assemble` |
| 790 | const fn | `g` |
| 812 | method | `rhs` |
| 814 | const fn | `J` |
| 831 | method | `cplLinearize` |
| 833 | method | `solveOnce` |
| 841 | method | `solve` |
| 855 | method | `nlLinearize` |
| 858 | method | `check` |
| 874 | method | `commit` |
| 893 | method | `initialSolve` |
| 903 | method | `tlSources` |
| 907 | method | `tlRecord` |
| 913 | method | `tlHist` |
| 920 | method | `step` |
| 922 | const fn | `gs` |
| 928 | method | `stepCore` |
| 982 | method | `edgeSolve` |
| 985 | method | `edgePoint` |
| 986 | method | `nextEvent` |
| 992 | const fn | `sch` |
| 1012 | method | `spwmCut` |
| 1015 | const fn | `sig` |
| 1020 | method | `run` |
| 1059 | function | `exportForBatch` |
| 1068 | const fn | `ci` |
| 1069 | const fn | `vd` |
| 1070 | const fn | `V` |
| 1071 | const fn | `I` |
| 1072 | const fn | `portRec` |
| 1073 | const fn | `rec` |
| 1089 | const fn | `clkOf` |
| 1112 | function | `sweepPoint` |
| 1120 | function | `eisPoint` |

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
| 371 | function | `defaults` |
| 373 | function | `elPins` |
| 374 | function | `sigPins` |
| 375 | function | `pinsOf` |
| 378 | function | `parseMat` |
| 380 | function | `nPorts` |
| 381 | function | `portY` |
| 382 | function | `portPins` |
| 383 | function | `portBox` |
| 385 | function | `posDef` |
| 387 | function | `symmetric` |
| 388 | function | `matInv` |
| 393 | function | `klMatrix` |
| 404 | function | `kgMatrix` |
| 412 | function | `srmGeo` |
| 414 | function | `srmSpins` |
| 416 | function | `srmPins` |
| 418 | function | `satD` |
| 419 | function | `satDinv` |
| 420 | function | `srmAlignedPsi` |
| 421 | function | `srmModelPsi` |
| 422 | function | `srmTableText` |
| 425 | function | `srmMag` |
| 441 | function | `chkMag` |
| 443 | function | `srmA` |
| 446 | function | `seg` |
| 447 | function | `srmPsi` |
| 449 | function | `srmCur` |
| 451 | function | `srmTorque` |
| 454 | function | `srmCoenergy` |
| 458 | function | `waveShape` |
| 459 | function | `waveAt` |
| 462 | function | `waveMeasure` |
| 465 | const fn | `cross` |
| 471 | function | `waveFit` |
| 472 | const fn | `res` |
| 483 | function | `directWave` |
| 486 | function | `impulseWave` |
| 496 | function | `bewley` |
| 499 | const fn | `at` |
| 505 | function | `movChar` |
| 510 | const fn | `pick` |
| 511 | const fn | `cur` |
| 512 | const fn | `inv` |
| 516 | function | `impulseDesign` |
| 521 | function | `impulseRoots` |
| 524 | function | `tlParams` |
| 532 | function | `lightningWave` |
| 539 | function | `pinKind` |
| 541 | function | `xf` |
| 542 | function | `pinPos` |
| 544 | function | `pinDir` |
| 549 | function | `cpeParams` |
| 550 | function | `cpeBank` |
| 554 | function | `cpeZ` |
| 555 | function | `cpeZbank` |
| 556 | function | `boxOf` |
| 557 | function | `bbox` |
| 561 | function | `eng` |
| 565 | function | `parseEng` |
| 568 | function | `parseSched` |

### `web/studio/pool.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 8 | const fn | `SIZE` |
| 9 | class | `SimPool` |
| 10 | method | `constructor` |
| 11 | method | `ensure` |
| 12 | method | `reply` |
| 13 | method | `fail` |
| 14 | method | `next` |
| 17 | method | `map` |
| 23 | method | `stop` |
| 26 | const fn | `hasPython` |

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
| 16 | const fn | `tut` |
| 19 | function | `defaultKeys` |
| 24 | function | `measure` |
| 36 | function | `decimate` |
| 41 | function | `run` |
| 49 | const fn | `push` |
| 68 | function | `tutorial` |
| 70 | function | `tutorials` |
| 72 | function | `handle` |
| 83 | function | `bifPoint` |
| 84 | function | `bifSpec` |
| 88 | function | `bifurcation` |
| 92 | const fn | `json` |

### `web/studio/scenario_worker.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 11 | const fn | `post` |
| 75 | function | `boot` |
| 95 | function | `batch` |
| 103 | function | `listFiles` |
| 106 | function | `evalAddon` |

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

### `web/studio/sim_worker.js`

_(χωρίς συναρτήσεις)_

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
| 108 | function | `check` |

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
| 57 | function | `scenario` |
| 86 | class | `Handler` |
| 88 | method | `Handler.local` |
| 92 | method | `Handler.alive` |
| 102 | method | `Handler.body` |
| 111 | method | `Handler.addon_get` |
| 134 | method | `Handler.addon_post` |
| 156 | method | `Handler.send` |
| 172 | method | `Handler.do_GET` |
| 203 | method | `Handler.do_POST` |
| 238 | function | `main` |

### `engine/__init__.py`

_(χωρίς συναρτήσεις)_

### `engine/addons.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 33 | class | `AddonError` |
| 37 | function | `_manifest` |
| 57 | function | `listing` |
| 78 | function | `user_file` |
| 88 | function | `install` |
| 133 | function | `remove` |
| 142 | class | `Link` |
| 145 | method | `Link.__init__` |
| 153 | method | `Link.write_file` |
| 167 | method | `Link.ok` |
| 170 | method | `Link.connected` |
| 173 | method | `Link.call` |
| 192 | method | `Link.next` |
| 209 | method | `Link.reply` |

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

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 9 | function | `__getattr__` |

### `pcl/__main__.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 23 | function | `_dumps` |
| 28 | function | `_project` |
| 36 | function | `_kv` |
| 46 | function | `main` |

### `pcl/control.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 77 | function | `_num` |
| 86 | function | `_bbox` |
| 92 | function | `compose` |
| 182 | function | `metrics` |

### `pcl/core.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 45 | class | `PclError` |
| 49 | function | `version` |
| 57 | function | `parse_value` |
| 79 | function | `_node` |
| 92 | function | `tutorials` |
| 97 | function | `tutorial` |
| 102 | function | `load` |
| 113 | function | `use` |
| 120 | function | `current` |
| 127 | function | `set` |
| 131 | function | `get` |
| 135 | function | `run` |
| 139 | function | `sweep` |
| 143 | function | `params` |
| 147 | function | `bifurcation` |
| 151 | class | `Plot` |
| 155 | function | `plot` |
| 164 | function | `show` |
| 217 | function | `_open` |
| 233 | function | `_pairs` |
| 251 | function | `_clean` |
| 262 | function | `job` |
| 297 | class | `Project` |
| 300 | method | `Project.__init__` |
| 306 | method | `Project.comp` |
| 313 | method | `Project.get` |
| 319 | method | `Project.set` |
| 334 | method | `Project.copy` |
| 339 | method | `Project.save` |
| 342 | method | `Project.hash` |
| 346 | method | `Project.params` |
| 350 | method | `Project.channels` |
| 355 | method | `Project._settings` |
| 366 | method | `Project.run` |
| 387 | method | `Project._result` |
| 391 | method | `Project._query` |
| 403 | method | `Project._run_scipy` |
| 432 | method | `Project.sweep` |
| 487 | method | `Project._sweep_meta` |
| 492 | method | `Project.bifurcation` |
| 549 | function | `_sweep_point` |
| 557 | function | `_as_list` |
| 567 | function | `_spec` |
| 583 | function | `_measures` |
| 606 | function | `_base_T` |
| 613 | function | `_unit` |
| 617 | function | `_matname` |
| 622 | class | `Result` |
| 625 | method | `Result.__init__` |
| 634 | method | `Result.__getitem__` |
| 637 | method | `Result.__repr__` |
| 640 | method | `Result.measure` |
| 700 | method | `Result.frame` |
| 709 | method | `Result._meta_lines` |
| 713 | method | `Result.to_csv` |
| 726 | method | `Result._vars` |
| 736 | method | `Result.as_dict` |
| 740 | method | `Result.to_json` |
| 744 | method | `Result.to_mat` |
| 755 | method | `Result.to_parquet` |
| 763 | method | `Result.to_hdf5` |
| 769 | method | `Result.save` |
| 773 | function | `_save` |
| 780 | class | `SweepResult` |
| 783 | method | `SweepResult.__init__` |
| 789 | method | `SweepResult.__repr__` |
| 792 | method | `SweepResult.column` |
| 795 | method | `SweepResult.frame` |
| 802 | method | `SweepResult.to_csv` |
| 814 | method | `SweepResult.to_json` |
| 818 | method | `SweepResult.to_mat` |
| 825 | method | `SweepResult._columns` |
| 829 | method | `SweepResult.to_parquet` |
| 835 | method | `SweepResult.to_hdf5` |
| 840 | method | `SweepResult.save` |
| 844 | class | `BifurcationResult` |
| 848 | method | `BifurcationResult.__init__` |
| 855 | method | `BifurcationResult.__repr__` |
| 858 | method | `BifurcationResult.changes` |
| 867 | method | `BifurcationResult.rows` |
| 871 | method | `BifurcationResult._columns` |
| 875 | method | `BifurcationResult.frame` |
| 882 | method | `BifurcationResult.plot` |
| 885 | method | `BifurcationResult.to_csv` |
| 896 | method | `BifurcationResult.to_json` |
| 900 | method | `BifurcationResult.to_mat` |
| 906 | method | `BifurcationResult.to_parquet` |
| 911 | method | `BifurcationResult.to_hdf5` |
| 916 | method | `BifurcationResult.save` |
| 927 | function | `_el` |
| 932 | function | `_matrix` |
| 937 | function | `_ascii` |
| 944 | function | `_mat_char` |
| 949 | function | `_mat_value` |
| 962 | function | `_savemat` |

### `pcl/formats.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 18 | function | `_varint` |
| 30 | function | `_zz` |
| 34 | class | `_Struct` |
| 37 | method | `_Struct.__init__` |
| 41 | method | `_Struct._head` |
| 50 | method | `_Struct.i32` |
| 55 | method | `_Struct.i64` |
| 60 | method | `_Struct.string` |
| 66 | method | `_Struct.struct` |
| 71 | method | `_Struct.lst` |
| 87 | method | `_Struct.end` |
| 99 | function | `_kind` |
| 109 | function | `_levels` |
| 122 | function | `_page_values` |
| 135 | function | `write_parquet` |
| 180 | function | `write_hdf5` |
| 216 | function | `_h5name` |

### `pcl/impulse.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 19 | function | `heidler` |
| 26 | function | `dexp` |
| 30 | function | `_peak` |
| 48 | function | `_cross` |
| 59 | function | `times` |
| 66 | function | `lightning_times` |
| 74 | function | `voltage_times` |
| 83 | function | `_solve2` |
| 113 | function | `fit_heidler` |
| 150 | function | `_xy` |
| 159 | function | `voltage_measure` |
| 163 | function | `fit_voltage` |
| 197 | function | `_tm` |
| 201 | function | `fit_profile` |
| 206 | function | `check_voltage` |
| 230 | function | `_rows` |
| 235 | function | `read_heidler_csv` |
| 246 | function | `read_voltage_csv` |

### `pcl/link.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 24 | function | `_home` |
| 28 | class | `App` |
| 29 | method | `App.__init__` |
| 34 | method | `App.__repr__` |
| 37 | method | `App.call` |
| 57 | method | `App.info` |
| 60 | method | `App.project` |
| 63 | method | `App.load` |
| 66 | method | `App.params` |
| 69 | method | `App.get` |
| 72 | method | `App.set` |
| 75 | method | `App.set_many` |
| 78 | method | `App.selection` |
| 81 | method | `App.channels` |
| 84 | method | `App.scope` |
| 89 | method | `App.run` |
| 95 | method | `App.python` |
| 100 | method | `App.show` |
| 118 | method | `App.notify` |
| 122 | function | `connect` |

### `pcl/plotting.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 35 | function | `preset` |
| 49 | function | `presets` |
| 54 | function | `_num` |
| 69 | function | `read_table` |
| 111 | function | `read_mapping` |
| 137 | function | `write_mapping` |
| 147 | function | `default_mapping` |
| 154 | function | `signals` |
| 167 | function | `groups` |
| 183 | function | `time_axis` |
| 195 | function | `extremes` |
| 216 | function | `table_text` |
| 232 | function | `_mpl` |
| 251 | function | `_style` |
| 256 | function | `figure` |
