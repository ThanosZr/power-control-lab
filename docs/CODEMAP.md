# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 108 |
| `web/studio/app.js` | 1984 |
| `web/studio/bus.js` | 169 |
| `web/studio/editor.js` | 532 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1184 |
| `web/studio/parts.js` | 642 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 75 |
| `web/studio/scenario.js` | 146 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 167 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 251 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 883 |
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
| `pcl/core.py` | 1280 |
| `pcl/formats.py` | 222 |
| `pcl/impulse.py` | 254 |
| `pcl/link.py` | 131 |
| `pcl/plotting.py` | 340 |
| `pcl/workbench.py` | 295 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 55 |
| `tests/test_batch.py` | 188 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_bus.py` | 128 |
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
| `tests/js/bus_cases.js` | 107 |
| `tests/js/sim_cases.js` | 345 |
| `tests/js/snapshot_cases.js` | 19 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/subcircuit_cases.js` | 79 |
| `tests/js/tutorial_cases.js` | 137 |
| `tests/ui/addons_flow.js` | 102 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/bus_flow.js` | 70 |
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
| 55 | `R` | Αντίσταση |
| 59 | `CPE` | CPE / Warburg |
| 65 | `L` | Πηνίο |
| 69 | `C` | Πυκνωτής |
| 73 | `VDC` | Πηγή DC / μπαταρία |
| 79 | `VAC` | Πηγή AC |
| 83 | `VAC3` | Τριφασική πηγή (Y) |
| 89 | `IDC` | Πηγή ρεύματος |
| 95 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 108 | `D` | Δίοδος |
| 112 | `SCR` | Θυρίστορ (SCR) |
| 122 | `XFMR` | Μετασχηματιστής |
| 130 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 143 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 156 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 166 | `KL` | Συζευγμένα πηνία (N×N) |
| 177 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 184 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 192 | `SG` | Σπινθηριστής (διάκενο) |
| 205 | `CPL` | Φορτίο σταθερής ισχύος |
| 209 | `SH` | Sample & Hold |
| 218 | `GND` | Γείωση |
| 220 | `JUNC` | Κόμβος |
| 221 | `PWM` | PWM / έλεγχος |
| 243 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 253 | `VM` | Βολτόμετρο |
| 255 | `AM` | Αμπερόμετρο (σε σειρά) |
| 258 | `VP` | Probe τάσης (ως προς τη γη) |
| 260 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 262 | `MEAS` | Μέτρηση στοιχείου |
| 265 | `CONST` | Σταθερά / πρόγραμμα |
| 268 | `GAIN` | Κέρδος |
| 270 | `SUM` | Άθροισμα |
| 273 | `MUL` | Γινόμενο |
| 275 | `DIV` | Διαίρεση a/b |
| 278 | `SAT` | Κορεσμός |
| 281 | `CMP` | Συγκριτής |
| 284 | `LOGIC` | Λογική πύλη |
| 287 | `PIB` | PI διακριτός |
| 293 | `UD` | Καθυστέρηση z⁻¹ |
| 296 | `SR` | SR latch |
| 299 | `CLK` | Ρολόι (τετραγωνικό) |
| 302 | `RAMP` | Φέρον / ράμπα |
| 307 | `EXPR` | Έκφραση |
| 311 | `PY` | Μπλοκ Python |
| 316 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 326 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 341 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 358 | `MOD3` | Διαμορφωτής τριφασικός |
| 362 | `FEST` | Εκτιμητής ροής δρομέα |
| 366 | `INT` | Ολοκληρωτής |
| 370 | `LPF` | Βαθυπερατό 1ης τάξης |
| 373 | `CLARKE` | Clarke abc → αβ |
| 377 | `ICLARKE` | Clarke αβ → abc |
| 381 | `PARK` | Park αβ → dq |
| 384 | `IPARK` | Park dq → αβ |
| 387 | `PLL` | PLL (τριφασικό) |
| 393 | `TAGO` | Ετικέτα: προς (Goto) |
| 396 | `TAGI` | Ετικέτα: από (From) |
| 399 | `DISP` | Ένδειξη |
| 403 | `SUB` | Υποκύκλωμα |
| 406 | `PORT` | Θύρα (ηλεκτρική) |
| 409 | `SIN` | Θύρα εισόδου σήματος |
| 412 | `SOUT` | Θύρα εξόδου σήματος |
| 416 | `MUX` | Mux (σήματα → δίαυλος) |
| 420 | `DEMUX` | Demux (δίαυλος → σήματα) |
| 424 | `BSEL` | Επιλογή από δίαυλο |
| 427 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |

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
| 842 | `bus_dq` | Δίαυλοι (3.18) | Βρόχος ρεύματος dq με διαύλους: τριφασικός μετατροπέας προς δίκτυο |
| 880 | `empty` | Νέο | Κενό κύκλωμα |

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
| 83 | function | `blkUnit` |
| 88 | function | `outsOf` |
| 90 | const fn | `vecN` |
| 92 | function | `chanLabel` |
| 100 | function | `addProbe` |
| 101 | function | `flash` |
| 102 | function | `signalsFor` |
| 114 | function | `renderChannels` |
| 130 | function | `renderMeasure` |
| 139 | function | `MeasureUnit` |
| 142 | function | `simKey` |
| 143 | function | `perSeries` |
| 144 | function | `refFor` |
| 145 | const fn | `sched` |
| 149 | function | `metricsFor` |
| 153 | function | `metricsRows` |
| 158 | function | `eventMetricsHTML` |
| 160 | function | `renderMetricsPanel` |
| 171 | function | `rawSeries` |
| 174 | function | `autoF1` |
| 176 | function | `renderFFT` |
| 198 | function | `cellZ` |
| 200 | function | `renderEISForm` |
| 201 | const fn | `opt` |
| 205 | function | `runEIS` |
| 213 | function | `drawEIS` |
| 232 | function | `perSamples` |
| 234 | function | `periodText` |
| 235 | const fn | `svgPlot` |
| 237 | function | `pcmMapFn` |
| 239 | const fn | `z` |
| 242 | function | `renderPoincare` |
| 258 | function | `bfParams` |
| 260 | function | `renderBifurcationForm` |
| 266 | function | `runBifurcation` |
| 280 | function | `stopBifurcation` |
| 281 | function | `drawBifurcation` |
| 291 | function | `niceTop` |
| 294 | function | `btStatus` |
| 295 | function | `parseStep` |
| 296 | function | `runBatch` |
| 312 | function | `clearBatch` |
| 314 | function | `meanPL` |
| 316 | function | `ringTrace` |
| 318 | function | `compareHTML` |
| 328 | function | `renderBatch` |
| 333 | function | `parseCSV` |
| 335 | const fn | `cells` |
| 336 | const fn | `num` |
| 342 | const fn | `normName` |
| 343 | function | `renderCsvMap` |
| 344 | const fn | `auto` |
| 350 | function | `applyCsv` |
| 355 | function | `renderCsv` |
| 357 | function | `clearCsv` |
| 359 | function | `sampleCompareHTML` |
| 372 | function | `liveChange` |
| 374 | function | `renderLiveLog` |
| 380 | function | `changesToSchedule` |
| 382 | const fn | `f` |
| 387 | function | `updateLivePanel` |
| 392 | function | `setLivePanel` |
| 395 | function | `switchesOf` |
| 398 | function | `addPulses` |
| 400 | function | `pulseKeys` |
| 401 | function | `refreshControls` |
| 404 | const fn | `phase` |
| 438 | const fn | `setD` |
| 454 | const fn | `setPh` |
| 466 | const fn | `pinNow` |
| 473 | const fn | `pinSet` |
| 483 | function | `pinMap` |
| 484 | function | `pinX` |
| 485 | function | `pinV` |
| 488 | function | `closeInspector` |
| 489 | function | `placePopup` |
| 492 | function | `fieldValue` |
| 497 | function | `fieldHTML` |
| 507 | function | `openInspector` |
| 514 | const fn | `wired` |
| 520 | const fn | `apply` |
| 531 | const fn | `wireWidth` |
| 532 | function | `openWireInspector` |
| 549 | const fn | `numOf` |
| 555 | function | `psec` |
| 557 | function | `propsOpen` |
| 558 | function | `setProps` |
| 560 | function | `focusComp` |
| 561 | function | `togglePin` |
| 564 | function | `renderProps` |
| 573 | function | `propsComp` |
| 574 | const fn | `secOf` |
| 576 | const fn | `row` |
| 582 | const fn | `wired` |
| 591 | function | `propsJunc` |
| 593 | function | `propsWire` |
| 599 | function | `propsMulti` |
| 602 | function | `propsCircuit` |
| 612 | const fn | `opt` |
| 620 | const fn | `sv` |
| 626 | const fn | `chk` |
| 634 | function | `bindProps` |
| 663 | function | `diagItems` |
| 672 | function | `renderDiag` |
| 683 | function | `openDiag` |
| 684 | function | `flashComp` |
| 687 | function | `scheduleStepCheck` |
| 688 | function | `syncStepMode` |
| 750 | function | `scenSetCode` |
| 751 | function | `scenState` |
| 752 | function | `scenTab` |
| 753 | function | `scenOut` |
| 754 | function | `scenWorker` |
| 756 | function | `scenRun` |
| 764 | function | `scenStop` |
| 765 | function | `scenDone` |
| 767 | function | `scenMsg` |
| 782 | function | `scenBatch` |
| 787 | function | `scenEval` |
| 790 | function | `addonDock` |
| 793 | function | `renderAddons` |
| 794 | const fn | `vsel` |
| 808 | function | `knockToast` |
| 811 | function | `initAddons` |
| 818 | function | `scenBatchWrite` |
| 821 | function | `renderScenFiles` |
| 824 | const fn | `scenNum` |
| 825 | function | `scenTable` |
| 826 | function | `scenShow` |
| 839 | function | `scenTicks` |
| 840 | function | `scenPlot` |
| 844 | const fn | `thin` |
| 851 | const fn | `dig` |
| 862 | function | `initScenarios` |
| 869 | function | `liveApply` |
| 872 | function | `closeMenu` |
| 873 | function | `openMenu` |
| 891 | function | `updateHover` |
| 909 | const fn | `atTop` |
| 910 | function | `topDoc` |
| 911 | function | `defsOf` |
| 912 | const fn | `pid` |
| 913 | function | `fullDoc` |
| 915 | function | `commitView` |
| 917 | function | `viewDiag` |
| 918 | const fn | `rel` |
| 921 | function | `compAt` |
| 926 | function | `allComps` |
| 927 | const fn | `walk` |
| 931 | function | `partDef` |
| 933 | function | `pdefaults` |
| 934 | function | `subParams` |
| 936 | function | `placeOk` |
| 938 | function | `renameChannels` |
| 940 | function | `levelDoc` |
| 941 | function | `applyLevel` |
| 942 | function | `groupSel` |
| 947 | function | `expandSub` |
| 950 | function | `uniqueSub` |
| 951 | function | `subMenu` |
| 955 | function | `enterSub` |
| 961 | function | `leaveSub` |
| 967 | function | `renderCrumbs` |
| 974 | function | `curDef` |
| 975 | function | `publicOf` |
| 976 | function | `togglePublic` |
| 984 | function | `propsSub` |
| 992 | function | `bindSub` |
| 1000 | function | `propsDef` |
| 1011 | function | `bindDef` |
| 1023 | function | `exportDef` |
| 1025 | function | `importDefs` |
| 1032 | function | `renderPalette` |
| 1046 | function | `tutorial` |
| 1049 | function | `circuitSig` |
| 1059 | function | `tutorialRef` |
| 1060 | function | `theoryValidity` |
| 1066 | function | `staleBanner` |
| 1069 | function | `bindRestore` |
| 1070 | function | `loadTutorial` |
| 1074 | function | `applyProject` |
| 1084 | function | `renderTutorial` |
| 1094 | function | `gallery` |
| 1100 | function | `api` |
| 1101 | function | `paramsOf` |
| 1102 | function | `avgOver` |
| 1105 | function | `simValue` |
| 1111 | function | `lastPP` |
| 1113 | function | `runTheory` |
| 1126 | function | `cmpRows` |
| 1127 | function | `stepsHTML` |
| 1128 | function | `renderTheory` |
| 1160 | function | `rippleDev` |
| 1162 | function | `periodAvgAt` |
| 1164 | function | `samplingTheory` |
| 1173 | const fn | `lastAt` |
| 1195 | function | `polyTheory` |
| 1202 | const fn | `frac` |
| 1231 | function | `lastPeriods` |
| 1232 | function | `evalOrderHTML` |
| 1239 | function | `busDqTheory` |
| 1247 | function | `subLegsTheory` |
| 1256 | function | `blocksTheory` |
| 1271 | function | `pcmTheory` |
| 1297 | function | `codeTheory` |
| 1307 | function | `eisTheory` |
| 1309 | const fn | `ser` |
| 1322 | function | `imSteady` |
| 1325 | function | `imPar` |
| 1326 | function | `phaseRms` |
| 1327 | function | `vfTheory` |
| 1340 | function | `focTheory` |
| 1357 | function | `synTheory` |
| 1376 | const fn | `need` |
| 1396 | function | `pmTheory` |
| 1398 | const fn | `mtpa` |
| 1414 | function | `srmTheory` |
| 1429 | const fn | `curve` |
| 1440 | function | `lgTheory` |
| 1451 | const fn | `cr` |
| 1458 | function | `chaosTheory` |
| 1470 | function | `dcDriveTheory` |
| 1471 | const fn | `per` |
| 1472 | const fn | `cross` |
| 1502 | function | `twModel` |
| 1505 | const fn | `g` |
| 1508 | function | `twLattice` |
| 1515 | const fn | `marks` |
| 1518 | function | `twTheory` |
| 1526 | const fn | `at` |
| 1543 | function | `arTheory` |
| 1563 | function | `impulseMeasure` |
| 1565 | const fn | `cross` |
| 1568 | function | `marxTheory` |
| 1586 | function | `chopModel` |
| 1589 | const fn | `f` |
| 1592 | function | `chopTheory` |
| 1606 | function | `cmp3` |
| 1610 | function | `hvExact` |
| 1611 | function | `hv153Theory` |
| 1637 | function | `besI1e` |
| 1639 | function | `heaviside` |
| 1641 | function | `lossTheory` |
| 1660 | function | `vtBreak` |
| 1661 | function | `vtTheory` |
| 1681 | function | `hvdivTheory` |
| 1683 | const fn | `r` |
| 1695 | function | `scheringTheory` |
| 1696 | const fn | `inv` |
| 1705 | const fn | `sr` |
| 1711 | function | `formulaTheory` |
| 1782 | function | `nodeAvg` |
| 1788 | function | `circuitForMath` |
| 1820 | function | `scheduleMath` |
| 1821 | function | `batteryKey` |
| 1823 | function | `mathChoices` |
| 1824 | const fn | `prim` |
| 1826 | function | `renderMathChoices` |
| 1828 | function | `runTemplate` |
| 1834 | function | `runMath` |
| 1856 | function | `saveLocal` |
| 1857 | function | `download` |
| 1858 | function | `exportCSV` |
| 1864 | function | `syncScopeInputs` |
| 1865 | function | `setSpeed` |
| 1868 | function | `openSettings` |
| 1869 | const fn | `sel` |
| 1870 | const fn | `chk` |
| 1888 | function | `boot` |
| 1929 | const fn | `mv` |
| 1930 | const fn | `up` |
| 1931 | const fn | `navOpen` |
| 1937 | const fn | `probeSel` |
| 1981 | function | `renderTheoryLive` |

### `web/studio/bus.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 26 | class | `BusError` |
| 32 | const fn | `qOf` |
| 33 | const fn | `nOf` |
| 34 | const fn | `lab` |
| 36 | function | `members` |
| 37 | const fn | `splitVec` |
| 38 | function | `constWidth` |
| 39 | function | `selIdx` |
| 40 | const fn | `portWidth` |
| 43 | function | `needs` |
| 54 | function | `graph` |
| 57 | const fn | `union` |
| 59 | const fn | `cidOf` |
| 60 | const fn | `kind` |
| 65 | const fn | `nm` |
| 73 | function | `solve` |
| 75 | const fn | `wOf` |
| 77 | const fn | `pinLab` |
| 78 | const fn | `isEl` |
| 79 | const fn | `set` |
| 83 | const fn | `sig` |
| 95 | const fn | `sum` |
| 115 | function | `widths` |
| 121 | function | `perElement` |
| 129 | function | `expand` |
| 134 | const fn | `add` |
| 135 | const fn | `bit` |

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
| 296 | method | `pathD` |
| 301 | method | `segDir` |
| 302 | method | `midLabel` |
| 303 | method | `renderPins` |
| 313 | method | `renderSel` |
| 315 | method | `setLive` |
| 316 | method | `updateLive` |
| 323 | method | `drawArrows` |
| 333 | method | `world` |
| 335 | method | `hitAt` |
| 336 | method | `hitOf` |
| 338 | method | `down` |
| 364 | method | `move` |
| 377 | method | `up` |
| 391 | method | `cancelDrag` |
| 392 | method | `hoverPin` |
| 394 | method | `dbl` |
| 395 | method | `menu` |
| 397 | method | `wheel` |
| 402 | method | `key` |
| 425 | method | `beginDrag` |
| 432 | method | `dragMove` |
| 442 | method | `endDrag` |
| 449 | method | `dragSeg` |
| 452 | const fn | `stub` |
| 461 | method | `drawMarquee` |
| 464 | method | `marqueeSelect` |
| 467 | const fn | `inside` |
| 474 | method | `escape` |
| 477 | method | `beginPlace` |
| 478 | method | `ghost` |
| 480 | method | `finishPlace` |
| 481 | method | `cancelPlace` |
| 483 | method | `startWire` |
| 484 | method | `startWireFrom` |
| 485 | method | `previewWire` |
| 494 | method | `wireClick` |
| 500 | method | `orthoNext` |
| 501 | method | `finishWire` |
| 517 | method | `cancelWire` |
| 519 | method | `splitWire` |
| 529 | method | `wireNetPin` |

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
| 23 | const fn | `schedAt` |
| 24 | const fn | `num` |
| 26 | const fn | `numList` |
| 38 | function | `b64of` |
| 40 | function | `fromB64` |
| 43 | function | `snapEncode` |
| 44 | const fn | `num` |
| 45 | function | `enc` |
| 55 | function | `snapRestore` |
| 56 | function | `dec` |
| 67 | function | `smPort` |
| 71 | function | `smOut` |
| 74 | class | `NetlistError` |
| 79 | function | `dePiece` |
| 81 | const fn | `F` |
| 82 | function | `deInt` |
| 84 | function | `deFrac` |
| 87 | function | `tlElement` |
| 90 | function | `buildNetlist` |
| 98 | const fn | `union` |
| 111 | const fn | `nm` |
| 130 | const fn | `sn` |
| 134 | const fn | `isJ` |
| 154 | const fn | `lbl` |
| 159 | const fn | `node` |
| 160 | const fn | `internal` |
| 163 | const fn | `mkBlock` |
| 170 | const fn | `add` |
| 171 | const fn | `series` |
| 338 | function | `compileSignals` |
| 360 | function | `cmpF` |
| 364 | function | `stampM` |
| 366 | function | `luFactor` |
| 372 | function | `luSolve` |
| 379 | class | `Sim` |
| 380 | method | `constructor` |
| 382 | method | `basePeriod` |
| 385 | method | `tlMaxStep` |
| 386 | method | `setStep` |
| 389 | method | `stIndex` |
| 402 | method | `stVec` |
| 403 | method | `stepCfg` |
| 404 | method | `varSetup` |
| 407 | method | `setStepMode` |
| 409 | method | `hGrid` |
| 413 | method | `modeCap` |
| 417 | method | `swEls` |
| 418 | method | `topoKey` |
| 419 | method | `topoInfo` |
| 428 | method | `topoCheck` |
| 445 | method | `lteReset` |
| 446 | method | `ltePush` |
| 450 | method | `lteErr` |
| 460 | method | `varCheck` |
| 475 | method | `note` |
| 478 | method | `stepCheck` |
| 479 | method | `diagnostics` |
| 482 | method | `ringCheck` |
| 491 | method | `stateMap` |
| 493 | method | `stateMap0` |
| 504 | method | `load` |
| 543 | method | `reset` |
| 546 | method | `imStep` |
| 553 | method | `smStep` |
| 555 | method | `srmStep` |
| 556 | method | `srmOutputs` |
| 557 | method | `smOutputs` |
| 558 | method | `imSources` |
| 559 | method | `pyBlocks` |
| 565 | method | `setMethod` |
| 566 | method | `setControl` |
| 568 | method | `setBlock` |
| 570 | method | `setHold` |
| 572 | method | `markChange` |
| 574 | method | `channelKeys` |
| 592 | method | `allocRecord` |
| 599 | method | `V` |
| 600 | method | `elCurrent` |
| 604 | method | `portI` |
| 606 | method | `computeVals` |
| 631 | method | `recordNow` |
| 639 | method | `closePeriod` |
| 648 | method | `lastPeriod` |
| 649 | method | `now` |
| 654 | method | `gateOf` |
| 660 | method | `rawGate` |
| 671 | method | `carrier` |
| 674 | method | `shGrid` |
| 675 | method | `shNext` |
| 677 | method | `sampleHolds` |
| 682 | method | `samples` |
| 683 | method | `ctrlEdges` |
| 689 | method | `scrU` |
| 690 | method | `scrGate` |
| 691 | method | `scrEdges` |
| 692 | method | `setFiring` |
| 693 | method | `compV` |
| 694 | method | `compI` |
| 696 | method | `dbl` |
| 697 | method | `sampleControllers` |
| 725 | method | `evalBlocks` |
| 789 | method | `blkDue` |
| 791 | method | `zcFrac` |
| 794 | method | `saveState` |
| 796 | method | `restoreState` |
| 800 | method | `snapshot` |
| 801 | method | `restoreSnapshot` |
| 803 | method | `gateSigPeek` |
| 806 | method | `gateSig` |
| 811 | method | `jumpScheds` |
| 817 | method | `jumpAt` |
| 818 | method | `values` |
| 837 | method | `assemble` |
| 839 | const fn | `g` |
| 861 | method | `rhs` |
| 863 | const fn | `J` |
| 880 | method | `cplLinearize` |
| 882 | method | `solveOnce` |
| 890 | method | `solve` |
| 904 | method | `nlLinearize` |
| 907 | method | `check` |
| 923 | method | `commit` |
| 942 | method | `initialSolve` |
| 952 | method | `tlSources` |
| 956 | method | `tlRecord` |
| 962 | method | `tlHist` |
| 969 | method | `step` |
| 971 | const fn | `gs` |
| 977 | method | `stepCore` |
| 1031 | method | `edgeSolve` |
| 1034 | method | `edgePoint` |
| 1035 | method | `nextEvent` |
| 1041 | const fn | `sch` |
| 1061 | method | `spwmCut` |
| 1064 | const fn | `sig` |
| 1069 | method | `run` |
| 1108 | function | `exportForBatch` |
| 1117 | const fn | `ci` |
| 1118 | const fn | `vd` |
| 1119 | const fn | `V` |
| 1120 | const fn | `I` |
| 1121 | const fn | `portRec` |
| 1122 | const fn | `rec` |
| 1138 | const fn | `clkOf` |
| 1161 | function | `sweepPoint` |
| 1166 | function | `setPath` |
| 1172 | function | `eisPoint` |
| 1180 | function | `resume` |

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
| 18 | const fn | `bl` |
| 19 | const fn | `CONN` |
| 20 | const fn | `isBus` |
| 22 | const fn | `nIO` |
| 23 | const fn | `ioY` |
| 26 | const fn | `codeIO` |
| 27 | const fn | `codeH` |
| 28 | const fn | `pyIns` |
| 29 | const fn | `codeDraw` |
| 32 | const fn | `CLOCK` |
| 38 | function | `subLayout` |
| 40 | const fn | `len` |
| 46 | function | `subDraw` |
| 433 | function | `defaults` |
| 435 | function | `elPins` |
| 436 | function | `sigPins` |
| 437 | function | `pinsOf` |
| 440 | function | `parseMat` |
| 442 | function | `nPorts` |
| 443 | function | `portY` |
| 444 | function | `portPins` |
| 445 | function | `portBox` |
| 447 | function | `posDef` |
| 449 | function | `symmetric` |
| 450 | function | `matInv` |
| 455 | function | `klMatrix` |
| 466 | function | `kgMatrix` |
| 474 | function | `srmGeo` |
| 476 | function | `srmSpins` |
| 478 | function | `srmPins` |
| 480 | function | `satD` |
| 481 | function | `satDinv` |
| 482 | function | `srmAlignedPsi` |
| 483 | function | `srmModelPsi` |
| 484 | function | `srmTableText` |
| 487 | function | `srmMag` |
| 503 | function | `chkMag` |
| 505 | function | `srmA` |
| 508 | function | `seg` |
| 509 | function | `srmPsi` |
| 511 | function | `srmCur` |
| 513 | function | `srmTorque` |
| 516 | function | `srmCoenergy` |
| 520 | function | `waveShape` |
| 521 | function | `waveAt` |
| 524 | function | `waveMeasure` |
| 527 | const fn | `cross` |
| 533 | function | `waveFit` |
| 534 | const fn | `res` |
| 545 | function | `directWave` |
| 548 | function | `impulseWave` |
| 558 | function | `bewley` |
| 561 | const fn | `at` |
| 567 | function | `movChar` |
| 572 | const fn | `pick` |
| 573 | const fn | `cur` |
| 574 | const fn | `inv` |
| 578 | function | `impulseDesign` |
| 583 | function | `impulseRoots` |
| 586 | function | `tlParams` |
| 594 | function | `lightningWave` |
| 601 | function | `pinKind` |
| 603 | function | `pinWidth` |
| 606 | function | `xf` |
| 607 | function | `pinPos` |
| 609 | function | `pinDir` |
| 614 | function | `cpeParams` |
| 615 | function | `cpeBank` |
| 619 | function | `cpeZ` |
| 620 | function | `cpeZbank` |
| 621 | function | `boxOf` |
| 622 | function | `bbox` |
| 626 | function | `eng` |
| 630 | function | `parseEng` |
| 633 | function | `parseSched` |

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
| 42 | const fn | `key` |
| 47 | const fn | `layout` |
| 50 | function | `instances` |
| 51 | const fn | `scan` |
| 55 | function | `cycleOf` |
| 56 | const fn | `visit` |
| 62 | function | `innerParts` |
| 64 | const fn | `set` |
| 73 | const fn | `tagName` |
| 76 | function | `flatten` |
| 80 | const fn | `walk` |
| 82 | const fn | `resolve` |
| 121 | function | `setParam` |
| 133 | function | `paramOf` |
| 139 | function | `sync` |
| 151 | const fn | `uniq` |
| 152 | const fn | `snap` |
| 153 | const fn | `pinKindOf` |
| 154 | function | `newDefName` |
| 160 | function | `create` |
| 200 | const fn | `fix` |
| 208 | function | `expand` |
| 216 | const fn | `loc` |
| 241 | function | `makeUnique` |
| 247 | function | `closure` |

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
| 848 | method | `build` |
| 849 | const fn | `ws` |
| 881 | method | `build` |

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
| 475 | method | `Project.copy` |
| 480 | method | `Project.save` |
| 483 | method | `Project.hash` |
| 487 | method | `Project.params` |
| 491 | method | `Project.channels` |
| 496 | method | `Project._settings` |
| 507 | method | `Project.run` |
| 537 | method | `Project.stream` |
| 618 | method | `Project._result` |
| 622 | method | `Project._query` |
| 634 | method | `Project._run_scipy` |
| 663 | method | `Project.sweep` |
| 737 | method | `Project._sweep_meta` |
| 742 | method | `Project.bifurcation` |
| 799 | class | `_SweepFile` |
| 804 | method | `_SweepFile.__init__` |
| 818 | method | `_SweepFile._val` |
| 826 | method | `_SweepFile._read` |
| 845 | method | `_SweepFile._line` |
| 849 | method | `_SweepFile.add` |
| 853 | method | `_SweepFile.close` |
| 859 | function | `_sweep_point` |
| 867 | function | `_as_list` |
| 877 | function | `_spec` |
| 893 | function | `_measures` |
| 916 | function | `_base_T` |
| 923 | function | `_unit` |
| 927 | function | `_matname` |
| 932 | class | `Result` |
| 935 | method | `Result.__init__` |
| 944 | method | `Result.__getitem__` |
| 947 | method | `Result.__repr__` |
| 950 | method | `Result.measure` |
| 1010 | method | `Result.frame` |
| 1019 | method | `Result._meta_lines` |
| 1023 | method | `Result.to_csv` |
| 1036 | method | `Result._vars` |
| 1046 | method | `Result.as_dict` |
| 1050 | method | `Result.to_json` |
| 1054 | method | `Result.to_mat` |
| 1065 | method | `Result.to_parquet` |
| 1073 | method | `Result.to_hdf5` |
| 1079 | method | `Result.save` |
| 1083 | function | `_save` |
| 1090 | class | `SweepResult` |
| 1093 | method | `SweepResult.__init__` |
| 1099 | method | `SweepResult.__repr__` |
| 1102 | method | `SweepResult.column` |
| 1105 | method | `SweepResult.frame` |
| 1112 | method | `SweepResult.to_csv` |
| 1124 | method | `SweepResult.to_json` |
| 1128 | method | `SweepResult.to_mat` |
| 1135 | method | `SweepResult._columns` |
| 1139 | method | `SweepResult.to_parquet` |
| 1145 | method | `SweepResult.to_hdf5` |
| 1150 | method | `SweepResult.save` |
| 1154 | class | `BifurcationResult` |
| 1158 | method | `BifurcationResult.__init__` |
| 1165 | method | `BifurcationResult.__repr__` |
| 1168 | method | `BifurcationResult.changes` |
| 1177 | method | `BifurcationResult.rows` |
| 1181 | method | `BifurcationResult._columns` |
| 1185 | method | `BifurcationResult.frame` |
| 1192 | method | `BifurcationResult.plot` |
| 1195 | method | `BifurcationResult.to_csv` |
| 1206 | method | `BifurcationResult.to_json` |
| 1210 | method | `BifurcationResult.to_mat` |
| 1216 | method | `BifurcationResult.to_parquet` |
| 1221 | method | `BifurcationResult.to_hdf5` |
| 1226 | method | `BifurcationResult.save` |
| 1237 | function | `_el` |
| 1242 | function | `_matrix` |
| 1247 | function | `_ascii` |
| 1254 | function | `_mat_char` |
| 1259 | function | `_mat_value` |
| 1272 | function | `_savemat` |

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
