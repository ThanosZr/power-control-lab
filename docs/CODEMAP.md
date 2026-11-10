# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 108 |
| `web/studio/app.js` | 1950 |
| `web/studio/editor.js` | 525 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1177 |
| `web/studio/parts.js` | 609 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 75 |
| `web/studio/scenario.js` | 146 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 167 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 247 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 840 |
| `pcl/runner.js` | 27 |
| `run.py` | 275 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
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
| `pcl/__main__.py` | 289 |
| `pcl/control.py` | 893 |
| `pcl/core.py` | 1277 |
| `pcl/formats.py` | 222 |
| `pcl/impulse.py` | 254 |
| `pcl/link.py` | 131 |
| `pcl/plotting.py` | 340 |
| `pcl/workbench.py` | 295 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_batch.py` | 188 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_control.py` | 213 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_matlab.py` | 150 |
| `tests/test_pcl.py` | 288 |
| `tests/test_plotting.py` | 113 |
| `tests/test_step.py` | 109 |
| `tests/test_stream.py` | 132 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 593 |
| `tests/test_subcircuit.py` | 136 |
| `tests/test_templates.py` | 237 |
| `tests/test_tutorials.py` | 703 |
| `tests/test_workbench.py` | 78 |
| `tests/js/batch_requests.js` | 84 |
| `tests/js/sim_cases.js` | 335 |
| `tests/js/snapshot_cases.js` | 19 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/subcircuit_cases.js` | 79 |
| `tests/js/tutorial_cases.js` | 137 |
| `tests/ui/addons_flow.js` | 102 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/scenario_flow.js` | 70 |
| `tests/ui/step_flow.js` | 41 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/subcircuit_flow.js` | 79 |
| `tests/ui/wiring_flow.js` | 128 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 48 | `R` | Αντίσταση |
| 52 | `CPE` | CPE / Warburg |
| 58 | `L` | Πηνίο |
| 62 | `C` | Πυκνωτής |
| 66 | `VDC` | Πηγή DC / μπαταρία |
| 72 | `VAC` | Πηγή AC |
| 76 | `VAC3` | Τριφασική πηγή (Y) |
| 81 | `IDC` | Πηγή ρεύματος |
| 87 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 100 | `D` | Δίοδος |
| 104 | `SCR` | Θυρίστορ (SCR) |
| 114 | `XFMR` | Μετασχηματιστής |
| 122 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 135 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 148 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 158 | `KL` | Συζευγμένα πηνία (N×N) |
| 169 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 176 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 184 | `SG` | Σπινθηριστής (διάκενο) |
| 197 | `CPL` | Φορτίο σταθερής ισχύος |
| 201 | `SH` | Sample & Hold |
| 210 | `GND` | Γείωση |
| 212 | `JUNC` | Κόμβος |
| 213 | `PWM` | PWM / έλεγχος |
| 235 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 245 | `VM` | Βολτόμετρο |
| 247 | `AM` | Αμπερόμετρο (σε σειρά) |
| 250 | `VP` | Probe τάσης (ως προς τη γη) |
| 252 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 254 | `MEAS` | Μέτρηση στοιχείου |
| 257 | `CONST` | Σταθερά / πρόγραμμα |
| 260 | `GAIN` | Κέρδος |
| 262 | `SUM` | Άθροισμα |
| 265 | `MUL` | Γινόμενο |
| 267 | `DIV` | Διαίρεση a/b |
| 270 | `SAT` | Κορεσμός |
| 273 | `CMP` | Συγκριτής |
| 276 | `LOGIC` | Λογική πύλη |
| 279 | `PIB` | PI διακριτός |
| 285 | `UD` | Καθυστέρηση z⁻¹ |
| 288 | `SR` | SR latch |
| 291 | `CLK` | Ρολόι (τετραγωνικό) |
| 294 | `RAMP` | Φέρον / ράμπα |
| 299 | `EXPR` | Έκφραση |
| 303 | `PY` | Μπλοκ Python |
| 308 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 318 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 333 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 350 | `MOD3` | Διαμορφωτής τριφασικός |
| 353 | `FEST` | Εκτιμητής ροής δρομέα |
| 357 | `INT` | Ολοκληρωτής |
| 361 | `LPF` | Βαθυπερατό 1ης τάξης |
| 364 | `CLARKE` | Clarke abc → αβ |
| 367 | `ICLARKE` | Clarke αβ → abc |
| 370 | `PARK` | Park αβ → dq |
| 372 | `IPARK` | Park dq → αβ |
| 374 | `PLL` | PLL (τριφασικό) |
| 379 | `TAGO` | Ετικέτα: προς (Goto) |
| 382 | `TAGI` | Ετικέτα: από (From) |
| 385 | `DISP` | Ένδειξη |
| 389 | `SUB` | Υποκύκλωμα |
| 392 | `PORT` | Θύρα (ηλεκτρική) |
| 395 | `SIN` | Θύρα εισόδου σήματος |
| 398 | `SOUT` | Θύρα εξόδου σήματος |

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
| 809 | `sub_legs` | Υποκυκλώματα (3.17) | Πολυφασικός buck από ένα υποκύκλωμα σκέλους |
| 837 | `empty` | Νέο | Κενό κύκλωμα |

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
| 32 | function | `solve` |
| 33 | function | `scopeData` |
| 66 | function | `onMessage` |

### `web/studio/app.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 3 | const fn | `$` |
| 5 | const fn | `esc` |
| 6 | const fn | `fmt` |
| 13 | function | `loadSettings` |
| 14 | function | `saveSettings` |
| 17 | function | `notice` |
| 18 | function | `warnings` |
| 21 | function | `project` |
| 22 | function | `buildSim` |
| 35 | function | `play` |
| 36 | function | `pause` |
| 37 | function | `reset` |
| 38 | function | `stepT` |
| 39 | function | `runToEnd` |
| 40 | const fn | `chunk` |
| 42 | function | `loop` |
| 51 | function | `draw` |
| 52 | function | `navRange` |
| 53 | function | `updateClock` |
| 57 | function | `liveOf` |
| 81 | function | `blkUnit` |
| 86 | function | `outsOf` |
| 88 | function | `chanLabel` |
| 95 | function | `addProbe` |
| 96 | function | `flash` |
| 97 | function | `signalsFor` |
| 108 | function | `renderChannels` |
| 124 | function | `renderMeasure` |
| 133 | function | `MeasureUnit` |
| 136 | function | `simKey` |
| 137 | function | `perSeries` |
| 138 | function | `refFor` |
| 139 | const fn | `sched` |
| 143 | function | `metricsFor` |
| 147 | function | `metricsRows` |
| 152 | function | `eventMetricsHTML` |
| 154 | function | `renderMetricsPanel` |
| 165 | function | `rawSeries` |
| 168 | function | `autoF1` |
| 170 | function | `renderFFT` |
| 192 | function | `cellZ` |
| 194 | function | `renderEISForm` |
| 195 | const fn | `opt` |
| 199 | function | `runEIS` |
| 207 | function | `drawEIS` |
| 226 | function | `perSamples` |
| 228 | function | `periodText` |
| 229 | const fn | `svgPlot` |
| 231 | function | `pcmMapFn` |
| 233 | const fn | `z` |
| 236 | function | `renderPoincare` |
| 252 | function | `bfParams` |
| 254 | function | `renderBifurcationForm` |
| 260 | function | `runBifurcation` |
| 274 | function | `stopBifurcation` |
| 275 | function | `drawBifurcation` |
| 285 | function | `niceTop` |
| 288 | function | `btStatus` |
| 289 | function | `parseStep` |
| 290 | function | `runBatch` |
| 306 | function | `clearBatch` |
| 308 | function | `meanPL` |
| 310 | function | `ringTrace` |
| 312 | function | `compareHTML` |
| 322 | function | `renderBatch` |
| 327 | function | `parseCSV` |
| 329 | const fn | `cells` |
| 330 | const fn | `num` |
| 336 | const fn | `normName` |
| 337 | function | `renderCsvMap` |
| 338 | const fn | `auto` |
| 344 | function | `applyCsv` |
| 349 | function | `renderCsv` |
| 351 | function | `clearCsv` |
| 353 | function | `sampleCompareHTML` |
| 366 | function | `liveChange` |
| 368 | function | `renderLiveLog` |
| 374 | function | `changesToSchedule` |
| 376 | const fn | `f` |
| 381 | function | `updateLivePanel` |
| 386 | function | `setLivePanel` |
| 389 | function | `switchesOf` |
| 392 | function | `addPulses` |
| 394 | function | `pulseKeys` |
| 395 | function | `refreshControls` |
| 398 | const fn | `phase` |
| 432 | const fn | `setD` |
| 443 | const fn | `setPh` |
| 455 | const fn | `pinNow` |
| 462 | const fn | `pinSet` |
| 472 | function | `pinMap` |
| 473 | function | `pinX` |
| 474 | function | `pinV` |
| 477 | function | `closeInspector` |
| 478 | function | `placePopup` |
| 479 | function | `fieldHTML` |
| 489 | function | `openInspector` |
| 496 | const fn | `wired` |
| 502 | const fn | `apply` |
| 512 | function | `openWireInspector` |
| 527 | const fn | `numOf` |
| 533 | function | `psec` |
| 535 | function | `propsOpen` |
| 536 | function | `setProps` |
| 538 | function | `focusComp` |
| 539 | function | `togglePin` |
| 542 | function | `renderProps` |
| 551 | function | `propsComp` |
| 552 | const fn | `secOf` |
| 554 | const fn | `row` |
| 560 | const fn | `wired` |
| 569 | function | `propsJunc` |
| 571 | function | `propsWire` |
| 576 | function | `propsMulti` |
| 579 | function | `propsCircuit` |
| 589 | const fn | `opt` |
| 597 | const fn | `sv` |
| 603 | const fn | `chk` |
| 611 | function | `bindProps` |
| 640 | function | `diagItems` |
| 649 | function | `renderDiag` |
| 660 | function | `openDiag` |
| 661 | function | `flashComp` |
| 664 | function | `scheduleStepCheck` |
| 665 | function | `syncStepMode` |
| 727 | function | `scenSetCode` |
| 728 | function | `scenState` |
| 729 | function | `scenTab` |
| 730 | function | `scenOut` |
| 731 | function | `scenWorker` |
| 733 | function | `scenRun` |
| 741 | function | `scenStop` |
| 742 | function | `scenDone` |
| 744 | function | `scenMsg` |
| 759 | function | `scenBatch` |
| 764 | function | `scenEval` |
| 767 | function | `addonDock` |
| 770 | function | `renderAddons` |
| 771 | const fn | `vsel` |
| 785 | function | `knockToast` |
| 788 | function | `initAddons` |
| 795 | function | `scenBatchWrite` |
| 798 | function | `renderScenFiles` |
| 801 | const fn | `scenNum` |
| 802 | function | `scenTable` |
| 803 | function | `scenShow` |
| 816 | function | `scenTicks` |
| 817 | function | `scenPlot` |
| 821 | const fn | `thin` |
| 828 | const fn | `dig` |
| 839 | function | `initScenarios` |
| 846 | function | `liveApply` |
| 849 | function | `closeMenu` |
| 850 | function | `openMenu` |
| 868 | function | `updateHover` |
| 886 | const fn | `atTop` |
| 887 | function | `topDoc` |
| 888 | function | `defsOf` |
| 889 | const fn | `pid` |
| 890 | function | `fullDoc` |
| 892 | function | `commitView` |
| 894 | function | `viewDiag` |
| 895 | const fn | `rel` |
| 898 | function | `compAt` |
| 903 | function | `allComps` |
| 904 | const fn | `walk` |
| 908 | function | `partDef` |
| 910 | function | `pdefaults` |
| 911 | function | `subParams` |
| 913 | function | `placeOk` |
| 915 | function | `renameChannels` |
| 917 | function | `levelDoc` |
| 918 | function | `applyLevel` |
| 919 | function | `groupSel` |
| 924 | function | `expandSub` |
| 927 | function | `uniqueSub` |
| 928 | function | `subMenu` |
| 932 | function | `enterSub` |
| 938 | function | `leaveSub` |
| 944 | function | `renderCrumbs` |
| 951 | function | `curDef` |
| 952 | function | `publicOf` |
| 953 | function | `togglePublic` |
| 961 | function | `propsSub` |
| 969 | function | `bindSub` |
| 977 | function | `propsDef` |
| 988 | function | `bindDef` |
| 1000 | function | `exportDef` |
| 1002 | function | `importDefs` |
| 1009 | function | `renderPalette` |
| 1023 | function | `tutorial` |
| 1026 | function | `circuitSig` |
| 1036 | function | `tutorialRef` |
| 1037 | function | `theoryValidity` |
| 1043 | function | `staleBanner` |
| 1046 | function | `bindRestore` |
| 1047 | function | `loadTutorial` |
| 1051 | function | `applyProject` |
| 1061 | function | `renderTutorial` |
| 1071 | function | `gallery` |
| 1077 | function | `api` |
| 1078 | function | `paramsOf` |
| 1079 | function | `avgOver` |
| 1082 | function | `simValue` |
| 1088 | function | `lastPP` |
| 1090 | function | `runTheory` |
| 1103 | function | `cmpRows` |
| 1104 | function | `stepsHTML` |
| 1105 | function | `renderTheory` |
| 1137 | function | `rippleDev` |
| 1139 | function | `periodAvgAt` |
| 1141 | function | `samplingTheory` |
| 1150 | const fn | `lastAt` |
| 1172 | function | `polyTheory` |
| 1179 | const fn | `frac` |
| 1208 | function | `lastPeriods` |
| 1209 | function | `evalOrderHTML` |
| 1214 | function | `subLegsTheory` |
| 1223 | function | `blocksTheory` |
| 1238 | function | `pcmTheory` |
| 1264 | function | `codeTheory` |
| 1274 | function | `eisTheory` |
| 1276 | const fn | `ser` |
| 1289 | function | `imSteady` |
| 1292 | function | `imPar` |
| 1293 | function | `phaseRms` |
| 1294 | function | `vfTheory` |
| 1307 | function | `focTheory` |
| 1324 | function | `synTheory` |
| 1343 | const fn | `need` |
| 1363 | function | `pmTheory` |
| 1365 | const fn | `mtpa` |
| 1381 | function | `srmTheory` |
| 1396 | const fn | `curve` |
| 1407 | function | `lgTheory` |
| 1418 | const fn | `cr` |
| 1425 | function | `chaosTheory` |
| 1437 | function | `dcDriveTheory` |
| 1438 | const fn | `per` |
| 1439 | const fn | `cross` |
| 1469 | function | `twModel` |
| 1472 | const fn | `g` |
| 1475 | function | `twLattice` |
| 1482 | const fn | `marks` |
| 1485 | function | `twTheory` |
| 1493 | const fn | `at` |
| 1510 | function | `arTheory` |
| 1530 | function | `impulseMeasure` |
| 1532 | const fn | `cross` |
| 1535 | function | `marxTheory` |
| 1553 | function | `chopModel` |
| 1556 | const fn | `f` |
| 1559 | function | `chopTheory` |
| 1573 | function | `cmp3` |
| 1577 | function | `hvExact` |
| 1578 | function | `hv153Theory` |
| 1604 | function | `besI1e` |
| 1606 | function | `heaviside` |
| 1608 | function | `lossTheory` |
| 1627 | function | `vtBreak` |
| 1628 | function | `vtTheory` |
| 1648 | function | `hvdivTheory` |
| 1650 | const fn | `r` |
| 1662 | function | `scheringTheory` |
| 1663 | const fn | `inv` |
| 1672 | const fn | `sr` |
| 1678 | function | `formulaTheory` |
| 1748 | function | `nodeAvg` |
| 1754 | function | `circuitForMath` |
| 1786 | function | `scheduleMath` |
| 1787 | function | `batteryKey` |
| 1789 | function | `mathChoices` |
| 1790 | const fn | `prim` |
| 1792 | function | `renderMathChoices` |
| 1794 | function | `runTemplate` |
| 1800 | function | `runMath` |
| 1822 | function | `saveLocal` |
| 1823 | function | `download` |
| 1824 | function | `exportCSV` |
| 1830 | function | `syncScopeInputs` |
| 1831 | function | `setSpeed` |
| 1834 | function | `openSettings` |
| 1835 | const fn | `sel` |
| 1836 | const fn | `chk` |
| 1854 | function | `boot` |
| 1895 | const fn | `mv` |
| 1896 | const fn | `up` |
| 1897 | const fn | `navOpen` |
| 1903 | const fn | `probeSel` |
| 1947 | function | `renderTheoryLive` |

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
| 53 | method | `comp` |
| 54 | method | `wire` |
| 55 | method | `newId` |
| 56 | method | `pin` |
| 57 | method | `wirePts` |
| 58 | method | `setWirePts` |
| 59 | method | `snapshot` |
| 60 | method | `remember` |
| 61 | method | `undo` |
| 62 | method | `redo` |
| 63 | method | `cleanSel` |
| 64 | method | `load` |
| 70 | method | `export` |
| 72 | method | `replaceDoc` |
| 76 | method | `changed` |
| 77 | method | `selection` |
| 78 | method | `select` |
| 79 | method | `addPart` |
| 85 | method | `setParams` |
| 89 | method | `dropDangling` |
| 91 | method | `netKinds` |
| 97 | method | `setSolve` |
| 99 | method | `setDiag` |
| 100 | method | `renderDiag` |
| 102 | method | `kindsOk` |
| 103 | method | `wiresAt` |
| 124 | method | `autoConnect` |
| 141 | method | `insertSeries` |
| 142 | const fn | `pos` |
| 147 | method | `setWireTool` |
| 148 | method | `startFreeWire` |
| 149 | method | `newJunction` |
| 151 | method | `finishFree` |
| 156 | method | `setWireProps` |
| 157 | method | `deleteSel` |
| 163 | method | `tidyJunctions` |
| 173 | method | `rotateSel` |
| 175 | method | `mirrorSel` |
| 177 | method | `captureWires` |
| 178 | method | `refitWires` |
| 179 | method | `copySel` |
| 180 | method | `paste` |
| 190 | method | `astar` |
| 198 | const fn | `idx` |
| 200 | const fn | `dirIndex` |
| 203 | const fn | `h` |
| 217 | method | `simpleRoute` |
| 220 | method | `route` |
| 224 | method | `adjustEnd` |
| 231 | method | `applyView` |
| 235 | method | `fit` |
| 237 | method | `extent` |
| 239 | method | `render` |
| 240 | method | `partSVG` |
| 246 | method | `renderPart` |
| 247 | method | `valueText` |
| 270 | method | `renderLabels` |
| 277 | method | `renderWires` |
| 291 | method | `pathD` |
| 295 | method | `midLabel` |
| 296 | method | `renderPins` |
| 306 | method | `renderSel` |
| 308 | method | `setLive` |
| 309 | method | `updateLive` |
| 316 | method | `drawArrows` |
| 326 | method | `world` |
| 328 | method | `hitAt` |
| 329 | method | `hitOf` |
| 331 | method | `down` |
| 357 | method | `move` |
| 370 | method | `up` |
| 384 | method | `cancelDrag` |
| 385 | method | `hoverPin` |
| 387 | method | `dbl` |
| 388 | method | `menu` |
| 390 | method | `wheel` |
| 395 | method | `key` |
| 418 | method | `beginDrag` |
| 425 | method | `dragMove` |
| 435 | method | `endDrag` |
| 442 | method | `dragSeg` |
| 445 | const fn | `stub` |
| 454 | method | `drawMarquee` |
| 457 | method | `marqueeSelect` |
| 460 | const fn | `inside` |
| 467 | method | `escape` |
| 470 | method | `beginPlace` |
| 471 | method | `ghost` |
| 473 | method | `finishPlace` |
| 474 | method | `cancelPlace` |
| 476 | method | `startWire` |
| 477 | method | `startWireFrom` |
| 478 | method | `previewWire` |
| 487 | method | `wireClick` |
| 493 | method | `orthoNext` |
| 494 | method | `finishWire` |
| 510 | method | `cancelWire` |
| 512 | method | `splitWire` |
| 522 | method | `wireNetPin` |

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
| 22 | const fn | `schedAt` |
| 23 | const fn | `num` |
| 25 | const fn | `numList` |
| 37 | function | `b64of` |
| 39 | function | `fromB64` |
| 42 | function | `snapEncode` |
| 43 | const fn | `num` |
| 44 | function | `enc` |
| 54 | function | `snapRestore` |
| 55 | function | `dec` |
| 66 | function | `smPort` |
| 70 | function | `smOut` |
| 73 | class | `NetlistError` |
| 78 | function | `dePiece` |
| 80 | const fn | `F` |
| 81 | function | `deInt` |
| 83 | function | `deFrac` |
| 86 | function | `tlElement` |
| 89 | function | `buildNetlist` |
| 95 | const fn | `union` |
| 106 | const fn | `nm` |
| 125 | const fn | `sn` |
| 129 | const fn | `isJ` |
| 149 | const fn | `lbl` |
| 154 | const fn | `node` |
| 155 | const fn | `internal` |
| 158 | const fn | `mkBlock` |
| 165 | const fn | `add` |
| 166 | const fn | `series` |
| 333 | function | `compileSignals` |
| 355 | function | `cmpF` |
| 359 | function | `stampM` |
| 361 | function | `luFactor` |
| 367 | function | `luSolve` |
| 374 | class | `Sim` |
| 375 | method | `constructor` |
| 377 | method | `basePeriod` |
| 380 | method | `tlMaxStep` |
| 381 | method | `setStep` |
| 384 | method | `stIndex` |
| 397 | method | `stVec` |
| 398 | method | `stepCfg` |
| 399 | method | `varSetup` |
| 402 | method | `setStepMode` |
| 404 | method | `hGrid` |
| 408 | method | `modeCap` |
| 412 | method | `swEls` |
| 413 | method | `topoKey` |
| 414 | method | `topoInfo` |
| 423 | method | `topoCheck` |
| 440 | method | `lteReset` |
| 441 | method | `ltePush` |
| 445 | method | `lteErr` |
| 455 | method | `varCheck` |
| 470 | method | `note` |
| 473 | method | `stepCheck` |
| 474 | method | `diagnostics` |
| 477 | method | `ringCheck` |
| 486 | method | `stateMap` |
| 488 | method | `stateMap0` |
| 499 | method | `load` |
| 538 | method | `reset` |
| 541 | method | `imStep` |
| 548 | method | `smStep` |
| 550 | method | `srmStep` |
| 551 | method | `srmOutputs` |
| 552 | method | `smOutputs` |
| 553 | method | `imSources` |
| 554 | method | `pyBlocks` |
| 560 | method | `setMethod` |
| 561 | method | `setControl` |
| 562 | method | `setBlock` |
| 563 | method | `setHold` |
| 565 | method | `markChange` |
| 567 | method | `channelKeys` |
| 585 | method | `allocRecord` |
| 592 | method | `V` |
| 593 | method | `elCurrent` |
| 597 | method | `portI` |
| 599 | method | `computeVals` |
| 624 | method | `recordNow` |
| 632 | method | `closePeriod` |
| 641 | method | `lastPeriod` |
| 642 | method | `now` |
| 647 | method | `gateOf` |
| 653 | method | `rawGate` |
| 664 | method | `carrier` |
| 667 | method | `shGrid` |
| 668 | method | `shNext` |
| 670 | method | `sampleHolds` |
| 675 | method | `samples` |
| 676 | method | `ctrlEdges` |
| 682 | method | `scrU` |
| 683 | method | `scrGate` |
| 684 | method | `scrEdges` |
| 685 | method | `setFiring` |
| 686 | method | `compV` |
| 687 | method | `compI` |
| 689 | method | `dbl` |
| 690 | method | `sampleControllers` |
| 718 | method | `evalBlocks` |
| 782 | method | `blkDue` |
| 784 | method | `zcFrac` |
| 787 | method | `saveState` |
| 789 | method | `restoreState` |
| 793 | method | `snapshot` |
| 794 | method | `restoreSnapshot` |
| 796 | method | `gateSigPeek` |
| 799 | method | `gateSig` |
| 804 | method | `jumpScheds` |
| 810 | method | `jumpAt` |
| 811 | method | `values` |
| 830 | method | `assemble` |
| 832 | const fn | `g` |
| 854 | method | `rhs` |
| 856 | const fn | `J` |
| 873 | method | `cplLinearize` |
| 875 | method | `solveOnce` |
| 883 | method | `solve` |
| 897 | method | `nlLinearize` |
| 900 | method | `check` |
| 916 | method | `commit` |
| 935 | method | `initialSolve` |
| 945 | method | `tlSources` |
| 949 | method | `tlRecord` |
| 955 | method | `tlHist` |
| 962 | method | `step` |
| 964 | const fn | `gs` |
| 970 | method | `stepCore` |
| 1024 | method | `edgeSolve` |
| 1027 | method | `edgePoint` |
| 1028 | method | `nextEvent` |
| 1034 | const fn | `sch` |
| 1054 | method | `spwmCut` |
| 1057 | const fn | `sig` |
| 1062 | method | `run` |
| 1101 | function | `exportForBatch` |
| 1110 | const fn | `ci` |
| 1111 | const fn | `vd` |
| 1112 | const fn | `V` |
| 1113 | const fn | `I` |
| 1114 | const fn | `portRec` |
| 1115 | const fn | `rec` |
| 1131 | const fn | `clkOf` |
| 1154 | function | `sweepPoint` |
| 1159 | function | `setPath` |
| 1165 | function | `eisPoint` |
| 1173 | function | `resume` |

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
| 31 | function | `subLayout` |
| 33 | const fn | `len` |
| 39 | function | `subDraw` |
| 403 | function | `defaults` |
| 405 | function | `elPins` |
| 406 | function | `sigPins` |
| 407 | function | `pinsOf` |
| 410 | function | `parseMat` |
| 412 | function | `nPorts` |
| 413 | function | `portY` |
| 414 | function | `portPins` |
| 415 | function | `portBox` |
| 417 | function | `posDef` |
| 419 | function | `symmetric` |
| 420 | function | `matInv` |
| 425 | function | `klMatrix` |
| 436 | function | `kgMatrix` |
| 444 | function | `srmGeo` |
| 446 | function | `srmSpins` |
| 448 | function | `srmPins` |
| 450 | function | `satD` |
| 451 | function | `satDinv` |
| 452 | function | `srmAlignedPsi` |
| 453 | function | `srmModelPsi` |
| 454 | function | `srmTableText` |
| 457 | function | `srmMag` |
| 473 | function | `chkMag` |
| 475 | function | `srmA` |
| 478 | function | `seg` |
| 479 | function | `srmPsi` |
| 481 | function | `srmCur` |
| 483 | function | `srmTorque` |
| 486 | function | `srmCoenergy` |
| 490 | function | `waveShape` |
| 491 | function | `waveAt` |
| 494 | function | `waveMeasure` |
| 497 | const fn | `cross` |
| 503 | function | `waveFit` |
| 504 | const fn | `res` |
| 515 | function | `directWave` |
| 518 | function | `impulseWave` |
| 528 | function | `bewley` |
| 531 | const fn | `at` |
| 537 | function | `movChar` |
| 542 | const fn | `pick` |
| 543 | const fn | `cur` |
| 544 | const fn | `inv` |
| 548 | function | `impulseDesign` |
| 553 | function | `impulseRoots` |
| 556 | function | `tlParams` |
| 564 | function | `lightningWave` |
| 571 | function | `pinKind` |
| 573 | function | `xf` |
| 574 | function | `pinPos` |
| 576 | function | `pinDir` |
| 581 | function | `cpeParams` |
| 582 | function | `cpeBank` |
| 586 | function | `cpeZ` |
| 587 | function | `cpeZbank` |
| 588 | function | `boxOf` |
| 589 | function | `bbox` |
| 593 | function | `eng` |
| 597 | function | `parseEng` |
| 600 | function | `parseSched` |

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
| 54 | function | `pyMessage` |
| 57 | method | `load` |
| 67 | method | `attach` |
| 68 | method | `make` |

### `web/studio/scenario.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 20 | const fn | `tut` |
| 23 | function | `defaultKeys` |
| 28 | function | `measure` |
| 40 | function | `decimate` |
| 45 | function | `run` |
| 53 | const fn | `push` |
| 76 | function | `open` |
| 83 | const fn | `index` |
| 90 | function | `session` |
| 91 | function | `setLive` |
| 99 | function | `advance` |
| 111 | function | `closeSession` |
| 114 | function | `tutorial` |
| 116 | function | `tutorials` |
| 118 | function | `handle` |
| 133 | function | `bifPoint` |
| 134 | function | `bifSpec` |
| 138 | function | `bifurcation` |
| 142 | const fn | `json` |

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

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | function | `python` |

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

### `web/studio/subcircuit.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 25 | const fn | `clone` |
| 26 | const fn | `isPort` |
| 27 | const fn | `okName` |
| 28 | class | `SubcircuitError` |
| 30 | function | `needs` |
| 33 | function | `portsOf` |
| 41 | const fn | `key` |
| 46 | const fn | `layout` |
| 49 | function | `instances` |
| 50 | const fn | `scan` |
| 54 | function | `cycleOf` |
| 55 | const fn | `visit` |
| 61 | function | `innerParts` |
| 63 | const fn | `set` |
| 72 | const fn | `tagName` |
| 75 | function | `flatten` |
| 79 | const fn | `walk` |
| 81 | const fn | `resolve` |
| 119 | function | `setParam` |
| 131 | function | `paramOf` |
| 137 | function | `sync` |
| 149 | const fn | `uniq` |
| 150 | const fn | `snap` |
| 151 | const fn | `pinKindOf` |
| 152 | function | `newDefName` |
| 158 | function | `create` |
| 196 | const fn | `fix` |
| 204 | function | `expand` |
| 212 | const fn | `loc` |
| 237 | function | `makeUnique` |
| 243 | function | `closure` |

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
| 815 | method | `build` |
| 825 | const fn | `y` |
| 838 | method | `build` |

### `pcl/runner.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | function | `answer` |
| 14 | function | `main` |
| 20 | function | `serve` |

### `run.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 57 | function | `scenario` |
| 86 | class | `Handler` |
| 88 | method | `Handler.local` |
| 92 | method | `Handler.alive` |
| 102 | method | `Handler.body` |
| 111 | method | `Handler.addon_get` |
| 141 | method | `Handler.addon_post` |
| 168 | method | `Handler.send` |
| 184 | method | `Handler.do_GET` |
| 215 | method | `Handler.do_POST` |
| 250 | function | `main` |

### `engine/__init__.py`

_(χωρίς συναρτήσεις)_

### `engine/addons.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 36 | class | `AddonError` |
| 40 | function | `_manifest` |
| 60 | function | `_vkey` |
| 65 | function | `versions` |
| 72 | function | `active` |
| 79 | function | `listing` |
| 110 | function | `user_file` |
| 120 | function | `activate` |
| 128 | function | `install` |
| 180 | function | `remove` |
| 197 | class | `Link` |
| 200 | method | `Link.__init__` |
| 211 | method | `Link.write_file` |
| 226 | method | `Link.ok` |
| 229 | method | `Link.connected` |
| 234 | method | `Link.call` |
| 255 | method | `Link.knock` |
| 274 | method | `Link.knock_next` |
| 290 | method | `Link.deny` |
| 297 | method | `Link.next` |
| 319 | method | `Link.reply` |

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
| 27 | function | `_dumps` |
| 32 | function | `_project` |
| 40 | function | `_kv` |
| 50 | function | `main` |

### `pcl/control.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 238 | function | `inv_nn_code` |
| 243 | function | `rl_code` |
| 252 | function | `_num` |
| 261 | function | `_bbox` |
| 267 | function | `compose` |
| 400 | function | `metrics` |
| 418 | function | `rl_theta0` |
| 424 | function | `_project_data` |
| 428 | function | `_chan` |
| 437 | class | `_Runner` |
| 441 | method | `_Runner.__init__` |
| 449 | method | `_Runner._one` |
| 460 | method | `_Runner.map` |
| 481 | method | `_Runner.close` |
| 487 | function | `_query` |
| 497 | function | `_samples` |
| 513 | function | `_program` |
| 522 | function | `_ref_range` |
| 538 | class | `InverseTrainer` |
| 556 | method | `InverseTrainer.__init__` |
| 578 | method | `InverseTrainer.to_dict` |
| 584 | method | `InverseTrainer.from_dict` |
| 594 | method | `InverseTrainer.status` |
| 598 | method | `InverseTrainer.excite` |
| 649 | method | `InverseTrainer._xy` |
| 654 | method | `InverseTrainer.emulator` |
| 670 | method | `InverseTrainer.controller` |
| 686 | method | `InverseTrainer.nets` |
| 689 | method | `InverseTrainer.ctrl_spec` |
| 696 | method | `InverseTrainer.online` |
| 708 | method | `InverseTrainer.run_all` |
| 721 | class | `RLTrainer` |
| 729 | method | `RLTrainer.__init__` |
| 748 | method | `RLTrainer.to_dict` |
| 753 | method | `RLTrainer.from_dict` |
| 759 | method | `RLTrainer.ctrl_spec` |
| 766 | method | `RLTrainer.project` |
| 774 | method | `RLTrainer._queries` |
| 790 | method | `RLTrainer._scores` |
| 806 | method | `RLTrainer._J` |
| 814 | method | `RLTrainer.iterate` |
| 861 | function | `compare` |

### `pcl/core.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 48 | class | `PclError` |
| 52 | function | `version` |
| 60 | function | `parse_value` |
| 82 | function | `_node` |
| 95 | class | `_Session` |
| 99 | method | `_Session.__init__` |
| 113 | method | `_Session.__call__` |
| 130 | method | `_Session.close` |
| 142 | method | `_Session.__enter__` |
| 145 | method | `_Session.__exit__` |
| 152 | function | `read_state` |
| 160 | function | `_write_atomic` |
| 166 | function | `tutorials` |
| 171 | function | `tutorial` |
| 176 | function | `load` |
| 189 | function | `use` |
| 196 | function | `current` |
| 203 | function | `set` |
| 207 | function | `get` |
| 211 | function | `run` |
| 215 | function | `sweep` |
| 219 | function | `params` |
| 223 | function | `bifurcation` |
| 227 | class | `Plot` |
| 231 | function | `plot` |
| 240 | function | `show` |
| 293 | function | `_open` |
| 309 | function | `_pairs` |
| 327 | function | `_clean` |
| 338 | function | `job` |
| 377 | function | `_inner_parts` |
| 407 | function | `_sub_parts` |
| 427 | class | `Project` |
| 430 | method | `Project.__init__` |
| 436 | method | `Project.comp` |
| 443 | method | `Project.get` |
| 451 | method | `Project.set` |
| 472 | method | `Project.copy` |
| 477 | method | `Project.save` |
| 480 | method | `Project.hash` |
| 484 | method | `Project.params` |
| 488 | method | `Project.channels` |
| 493 | method | `Project._settings` |
| 504 | method | `Project.run` |
| 534 | method | `Project.stream` |
| 615 | method | `Project._result` |
| 619 | method | `Project._query` |
| 631 | method | `Project._run_scipy` |
| 660 | method | `Project.sweep` |
| 734 | method | `Project._sweep_meta` |
| 739 | method | `Project.bifurcation` |
| 796 | class | `_SweepFile` |
| 801 | method | `_SweepFile.__init__` |
| 815 | method | `_SweepFile._val` |
| 823 | method | `_SweepFile._read` |
| 842 | method | `_SweepFile._line` |
| 846 | method | `_SweepFile.add` |
| 850 | method | `_SweepFile.close` |
| 856 | function | `_sweep_point` |
| 864 | function | `_as_list` |
| 874 | function | `_spec` |
| 890 | function | `_measures` |
| 913 | function | `_base_T` |
| 920 | function | `_unit` |
| 924 | function | `_matname` |
| 929 | class | `Result` |
| 932 | method | `Result.__init__` |
| 941 | method | `Result.__getitem__` |
| 944 | method | `Result.__repr__` |
| 947 | method | `Result.measure` |
| 1007 | method | `Result.frame` |
| 1016 | method | `Result._meta_lines` |
| 1020 | method | `Result.to_csv` |
| 1033 | method | `Result._vars` |
| 1043 | method | `Result.as_dict` |
| 1047 | method | `Result.to_json` |
| 1051 | method | `Result.to_mat` |
| 1062 | method | `Result.to_parquet` |
| 1070 | method | `Result.to_hdf5` |
| 1076 | method | `Result.save` |
| 1080 | function | `_save` |
| 1087 | class | `SweepResult` |
| 1090 | method | `SweepResult.__init__` |
| 1096 | method | `SweepResult.__repr__` |
| 1099 | method | `SweepResult.column` |
| 1102 | method | `SweepResult.frame` |
| 1109 | method | `SweepResult.to_csv` |
| 1121 | method | `SweepResult.to_json` |
| 1125 | method | `SweepResult.to_mat` |
| 1132 | method | `SweepResult._columns` |
| 1136 | method | `SweepResult.to_parquet` |
| 1142 | method | `SweepResult.to_hdf5` |
| 1147 | method | `SweepResult.save` |
| 1151 | class | `BifurcationResult` |
| 1155 | method | `BifurcationResult.__init__` |
| 1162 | method | `BifurcationResult.__repr__` |
| 1165 | method | `BifurcationResult.changes` |
| 1174 | method | `BifurcationResult.rows` |
| 1178 | method | `BifurcationResult._columns` |
| 1182 | method | `BifurcationResult.frame` |
| 1189 | method | `BifurcationResult.plot` |
| 1192 | method | `BifurcationResult.to_csv` |
| 1203 | method | `BifurcationResult.to_json` |
| 1207 | method | `BifurcationResult.to_mat` |
| 1213 | method | `BifurcationResult.to_parquet` |
| 1218 | method | `BifurcationResult.to_hdf5` |
| 1223 | method | `BifurcationResult.save` |
| 1234 | function | `_el` |
| 1239 | function | `_matrix` |
| 1244 | function | `_ascii` |
| 1251 | function | `_mat_char` |
| 1256 | function | `_mat_value` |
| 1269 | function | `_savemat` |

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
| 35 | method | `App.__repr__` |
| 38 | method | `App.call` |
| 58 | method | `App.info` |
| 61 | method | `App.project` |
| 64 | method | `App.load` |
| 67 | method | `App.params` |
| 70 | method | `App.get` |
| 73 | method | `App.set` |
| 76 | method | `App.set_many` |
| 79 | method | `App.selection` |
| 82 | method | `App.channels` |
| 85 | method | `App.scope` |
| 90 | method | `App.run` |
| 96 | method | `App.python` |
| 101 | method | `App.show` |
| 119 | method | `App.notify` |
| 123 | function | `connect` |

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

### `pcl/workbench.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 27 | function | `_chan` |
| 37 | function | `prepare` |
| 67 | class | `CircuitPlant` |
| 86 | method | `CircuitPlant.__init__` |
| 104 | method | `CircuitPlant._open` |
| 124 | method | `CircuitPlant._read` |
| 133 | method | `CircuitPlant._advance` |
| 141 | method | `CircuitPlant.close` |
| 150 | method | `CircuitPlant.__del__` |
| 157 | method | `CircuitPlant.step` |
| 167 | method | `CircuitPlant.output` |
| 172 | method | `CircuitPlant.measured` |
| 182 | method | `CircuitPlant.measured_scale` |
| 191 | method | `CircuitPlant.u_range` |
| 194 | method | `CircuitPlant.y_range` |
| 197 | method | `CircuitPlant.reset_state` |
| 210 | method | `CircuitPlant.clone` |
| 213 | method | `CircuitPlant.viz_state` |
| 222 | method | `CircuitPlant.params_dict` |
| 226 | method | `CircuitPlant.initial_state` |
| 229 | method | `CircuitPlant.deriv` |
| 233 | function | `plant_class` |
| 247 | function | `register` |
| 261 | function | `run_scheme` |
| 270 | function | `launch` |
