# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 108 |
| `web/studio/app.js` | 2036 |
| `web/studio/bus.js` | 197 |
| `web/studio/editor.js` | 540 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1250 |
| `web/studio/parts.js` | 673 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 75 |
| `web/studio/scenario.js` | 148 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 167 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 273 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 884 |
| `web/studio/units.js` | 121 |
| `pcl/runner.js` | 27 |
| `run.py` | 275 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1876 |
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
| `pcl/__main__.py` | 292 |
| `pcl/control.py` | 893 |
| `pcl/core.py` | 1302 |
| `pcl/formats.py` | 222 |
| `pcl/impulse.py` | 254 |
| `pcl/link.py` | 131 |
| `pcl/plotting.py` | 340 |
| `pcl/workbench.py` | 295 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 71 |
| `tests/test_batch.py` | 208 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_bus.py` | 145 |
| `tests/test_control.py` | 213 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_live_program.py` | 49 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_matlab.py` | 150 |
| `tests/test_pcl.py` | 312 |
| `tests/test_plotting.py` | 113 |
| `tests/test_step.py` | 109 |
| `tests/test_stream.py` | 132 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 609 |
| `tests/test_subcircuit.py` | 149 |
| `tests/test_templates.py` | 237 |
| `tests/test_tutorials.py` | 703 |
| `tests/test_units.py` | 64 |
| `tests/test_workbench.py` | 78 |
| `tests/js/batch_requests.js` | 94 |
| `tests/js/bus_cases.js` | 127 |
| `tests/js/live_cases.js` | 31 |
| `tests/js/sim_cases.js` | 356 |
| `tests/js/snapshot_cases.js` | 19 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/subcircuit_cases.js` | 87 |
| `tests/js/tutorial_cases.js` | 137 |
| `tests/js/units_cases.js` | 40 |
| `tests/ui/addons_flow.js` | 102 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/bus_flow.js` | 80 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/live_flow.js` | 41 |
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
| 269 | `GAIN` | Κέρδος |
| 271 | `SUM` | Άθροισμα |
| 274 | `MUL` | Γινόμενο |
| 276 | `DIV` | Διαίρεση a/b |
| 279 | `SAT` | Κορεσμός |
| 282 | `CMP` | Συγκριτής |
| 285 | `LOGIC` | Λογική πύλη |
| 288 | `PIB` | PI διακριτός |
| 294 | `UD` | Καθυστέρηση z⁻¹ |
| 297 | `SR` | SR latch |
| 300 | `CLK` | Ρολόι (τετραγωνικό) |
| 303 | `RAMP` | Φέρον / ράμπα |
| 308 | `EXPR` | Έκφραση |
| 312 | `PY` | Μπλοκ Python |
| 317 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 327 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 342 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 359 | `MOD3` | Διαμορφωτής τριφασικός |
| 363 | `FEST` | Εκτιμητής ροής δρομέα |
| 367 | `INT` | Ολοκληρωτής |
| 371 | `LPF` | Βαθυπερατό 1ης τάξης |
| 375 | `F2` | Φίλτρο 2ης τάξης |
| 380 | `RLIM` | Όριο ρυθμού μεταβολής |
| 384 | `RT` | Μετάβαση ρυθμού |
| 388 | `EDGE` | Ανιχνευτής ακμής |
| 392 | `CLARKE` | Clarke abc → αβ |
| 396 | `ICLARKE` | Clarke αβ → abc |
| 400 | `PARK` | Park αβ → dq |
| 403 | `IPARK` | Park dq → αβ |
| 406 | `PLL` | PLL (τριφασικό) |
| 412 | `TAGO` | Ετικέτα: προς (Goto) |
| 415 | `TAGI` | Ετικέτα: από (From) |
| 418 | `DISP` | Ένδειξη |
| 422 | `SUB` | Υποκύκλωμα |
| 425 | `PORT` | Θύρα (ηλεκτρική) |
| 428 | `SIN` | Θύρα εισόδου σήματος |
| 431 | `SOUT` | Θύρα εξόδου σήματος |
| 435 | `MUX` | Mux (σήματα → δίαυλος) |
| 440 | `DEMUX` | Demux (δίαυλος → σήματα) |
| 444 | `BSEL` | Επιλογή από δίαυλο |
| 447 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |

## Tutorials (`web/studio/tutorials.js`)

| Γραμμή | id | Ομάδα | Τίτλος |
|---:|---|---|---|
| 24 | `buck` | DC-DC χωρίς απομόνωση | Buck (υποβιβασμός) |
| 36 | `boost` | DC-DC χωρίς απομόνωση | Boost (ανύψωση) |
| 46 | `buck_boost` | DC-DC χωρίς απομόνωση | Buck–boost (αναστροφής) |
| 56 | `cuk` | DC-DC χωρίς απομόνωση | Ćuk |
| 68 | `sepic` | DC-DC χωρίς απομόνωση | SEPIC |
| 80 | `flyback` | DC-DC με απομόνωση | Flyback |
| 108 | `hbridge` | Γέφυρες | Full-bridge DC-DC (H-γέφυρα) |
| 113 | `inverter` | Γέφυρες | Μονοφασικός αντιστροφέας SPWM |
| 119 | `rectifier` | Ανορθωτές | Ανορθωτής γέφυρας → μπαταρία |
| 133 | `buck_vloop` | Έλεγχος | Buck με βρόχο τάσης (PI / PID) |
| 146 | `scr1` | Ανορθωτές | Ελεγχόμενος ανορθωτής γέφυρας (θυρίστορ) |
| 159 | `bridge3` | Ανορθωτές | Τριφασική γέφυρα 6 παλμών |
| 175 | `battery` | Αμφίδρομος · μπαταρία (PE2) | Αμφίδρομος μετατροπέας μπαταρίας |
| 225 | `sampling` | Αμφίδρομος · μπαταρία (PE2) | Άσκηση 2 · Επίδραση δειγματοληψίας |
| 260 | `polyphase` | Αμφίδρομος · μπαταρία (PE2) | Άσκηση 2 · Πολυφασική σχεδίαση |
| 294 | `blocks_loop` | Μπλοκ σημάτων (3.0) | Βρόχος ρεύματος από μπλοκ |
| 322 | `code_loop` | Μπλοκ κώδικα (3.3) | PI σε Python και feedforward με έκφραση |
| 347 | `cell_eis` | Μπαταρίες και EIS (3.3.1) | Δοκιμή κυψέλης: EIS με μετατροπέα |
| 390 | `im_vf` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: V/f και διαμόρφωση SPWM, SVPWM, τετραγωνική |
| 403 | `im_foc` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: διανυσματικός έλεγχος, εξασθένιση πεδίου, R̂_R |
| 456 | `synrm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μαγνητικής αντίστασης (SynRM): ευθυγράμμιση, έλεγχος dq, MTPA |
| 482 | `pmsm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μόνιμων μαγνητών (PMSM / IPMSM): i_d = 0 και MTPA |
| 498 | `srm` | Ηλεκτρική κίνηση (3.6) | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM 8/6): γωνίες, υστέρηση, βρόχος ψ–i |
| 529 | `lightning` | Κεραυνικά (3.5) | Κεραυνικό ρεύμα Heidler: 10/350, 1/200, 0,25/100 μs |
| 541 | `twave` | Υψηλές τάσεις (3.8) | Οδεύοντα κύματα: ανάκλαση σε ανοιχτό, βραχυκυκλωμένο ή ωμικό άκρο, διάγραμμα Bewley |
| 564 | `arrester` | Υψηλές τάσεις (3.9) | Αλεξικέραυνο: παραμένουσα τάση και απόσταση προστασίας |
| 580 | `marx` | Υψηλές τάσεις (3.10) | Γεννήτρια Marx: πολυβάθμια κρουστική γεννήτρια με σπινθηριστές |
| 610 | `chop` | Υψηλές τάσεις (3.10) | Αποκομμένη κρουστική τάση: σπινθηριστής αποκοπής |
| 644 | `hv153` | Υψηλές τάσεις (3.11) | Ασκήσεις 15.3: γεννήτριες κρουστικών τάσεων (βιβλίο, ακριβής λύση, προσομοίωση) |
| 665 | `lossline` | Υψηλές τάσεις (3.11) | Γραμμή με απώλειες: απόσβεση και παραμόρφωση οδεύοντος κύματος |
| 682 | `voltime` | Υψηλές τάσεις (3.11) | Καμπύλη τάσης–χρόνου διακένου (κριτήριο ενέργειας διάσπασης) |
| 698 | `hvdiv` | Υψηλές τάσεις (3.12) | Μέτρηση εναλλασσόμενης υψηλής τάσης: καταμεριστές (ασκήσεις 15.1.3, 15.1.5) |
| 715 | `schering` | Υψηλές τάσεις (3.12) | Γέφυρα Schering: χωρητικότητα και συντελεστής απωλειών (άσκηση 15.5.12) |
| 730 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 752 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 766 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 810 | `sub_legs` | Υποκυκλώματα (3.17) | Πολυφασικός buck από ένα υποκύκλωμα σκέλους |
| 843 | `bus_dq` | Δίαυλοι (3.18) | Βρόχος ρεύματος dq με διαύλους: τριφασικός μετατροπέας προς δίκτυο |
| 881 | `empty` | Νέο | Κενό κύκλωμα |

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
| 84 | function | `blkUnit` |
| 90 | function | `outsOf` |
| 92 | const fn | `vecN` |
| 94 | function | `chanLabel` |
| 102 | function | `addProbe` |
| 103 | function | `flash` |
| 104 | function | `signalsFor` |
| 116 | function | `renderChannels` |
| 132 | function | `renderMeasure` |
| 141 | function | `MeasureUnit` |
| 144 | function | `simKey` |
| 145 | function | `perSeries` |
| 146 | function | `refFor` |
| 147 | const fn | `sched` |
| 151 | function | `metricsFor` |
| 155 | function | `metricsRows` |
| 160 | function | `eventMetricsHTML` |
| 162 | function | `renderMetricsPanel` |
| 173 | function | `rawSeries` |
| 176 | function | `autoF1` |
| 180 | function | `evRows` |
| 182 | function | `renderEvents` |
| 184 | const fn | `fv` |
| 188 | function | `eventsCsv` |
| 190 | function | `renderFFT` |
| 212 | function | `cellZ` |
| 214 | function | `renderEISForm` |
| 215 | const fn | `opt` |
| 219 | function | `runEIS` |
| 227 | function | `drawEIS` |
| 246 | function | `perSamples` |
| 248 | function | `periodText` |
| 249 | const fn | `svgPlot` |
| 251 | function | `pcmMapFn` |
| 253 | const fn | `z` |
| 256 | function | `renderPoincare` |
| 272 | function | `bfParams` |
| 274 | function | `renderBifurcationForm` |
| 280 | function | `runBifurcation` |
| 294 | function | `stopBifurcation` |
| 295 | function | `drawBifurcation` |
| 305 | function | `niceTop` |
| 308 | function | `btStatus` |
| 309 | function | `parseStep` |
| 310 | function | `runBatch` |
| 326 | function | `clearBatch` |
| 328 | function | `meanPL` |
| 330 | function | `ringTrace` |
| 332 | function | `compareHTML` |
| 342 | function | `renderBatch` |
| 347 | function | `parseCSV` |
| 349 | const fn | `cells` |
| 350 | const fn | `num` |
| 356 | const fn | `normName` |
| 357 | function | `renderCsvMap` |
| 358 | const fn | `auto` |
| 364 | function | `applyCsv` |
| 369 | function | `renderCsv` |
| 371 | function | `clearCsv` |
| 373 | function | `sampleCompareHTML` |
| 387 | function | `liveChange` |
| 389 | function | `renderLiveLog` |
| 398 | function | `changesToSchedule` |
| 400 | const fn | `f` |
| 409 | function | `updateLivePanel` |
| 414 | function | `setLivePanel` |
| 417 | function | `switchesOf` |
| 420 | function | `addPulses` |
| 422 | function | `pulseKeys` |
| 423 | function | `refreshControls` |
| 426 | const fn | `phase` |
| 460 | const fn | `setD` |
| 476 | const fn | `setPh` |
| 488 | const fn | `pinNow` |
| 499 | const fn | `pinSet` |
| 511 | function | `pinMap` |
| 512 | function | `pinX` |
| 513 | function | `pinV` |
| 516 | function | `closeInspector` |
| 517 | function | `placePopup` |
| 520 | function | `fieldValue` |
| 525 | function | `fieldHTML` |
| 535 | function | `openInspector` |
| 542 | const fn | `wired` |
| 548 | const fn | `apply` |
| 559 | const fn | `wireWidth` |
| 560 | function | `openWireInspector` |
| 576 | const fn | `numOf` |
| 582 | function | `psec` |
| 584 | function | `propsOpen` |
| 585 | function | `setProps` |
| 587 | function | `focusComp` |
| 588 | function | `togglePin` |
| 591 | function | `renderProps` |
| 600 | function | `propsComp` |
| 601 | const fn | `secOf` |
| 603 | const fn | `row` |
| 609 | const fn | `wired` |
| 623 | function | `propsJunc` |
| 625 | function | `propsWire` |
| 631 | function | `propsMulti` |
| 634 | function | `propsCircuit` |
| 644 | const fn | `opt` |
| 654 | const fn | `sv` |
| 660 | const fn | `chk` |
| 671 | function | `bindProps` |
| 701 | function | `diagItems` |
| 710 | function | `renderDiag` |
| 721 | function | `openDiag` |
| 722 | function | `flashComp` |
| 725 | function | `scheduleStepCheck` |
| 726 | function | `syncStepMode` |
| 788 | function | `scenSetCode` |
| 789 | function | `scenState` |
| 790 | function | `scenTab` |
| 791 | function | `scenOut` |
| 792 | function | `scenWorker` |
| 794 | function | `scenRun` |
| 802 | function | `scenStop` |
| 803 | function | `scenDone` |
| 805 | function | `scenMsg` |
| 820 | function | `scenBatch` |
| 825 | function | `scenEval` |
| 828 | function | `addonDock` |
| 831 | function | `renderAddons` |
| 832 | const fn | `vsel` |
| 846 | function | `knockToast` |
| 849 | function | `initAddons` |
| 856 | function | `scenBatchWrite` |
| 859 | function | `renderScenFiles` |
| 862 | const fn | `scenNum` |
| 863 | function | `scenTable` |
| 864 | function | `scenShow` |
| 877 | function | `scenTicks` |
| 878 | function | `scenPlot` |
| 882 | const fn | `thin` |
| 889 | const fn | `dig` |
| 900 | function | `initScenarios` |
| 907 | function | `liveApply` |
| 910 | function | `closeMenu` |
| 911 | function | `openMenu` |
| 929 | function | `updateHover` |
| 947 | const fn | `atTop` |
| 948 | function | `topDoc` |
| 949 | function | `defsOf` |
| 950 | const fn | `pid` |
| 951 | function | `fullDoc` |
| 953 | function | `commitView` |
| 955 | function | `viewDiag` |
| 956 | const fn | `rel` |
| 959 | function | `compAt` |
| 964 | function | `allComps` |
| 965 | const fn | `walk` |
| 969 | function | `partDef` |
| 971 | function | `pdefaults` |
| 972 | function | `subParams` |
| 974 | function | `placeOk` |
| 976 | function | `renameChannels` |
| 978 | function | `levelDoc` |
| 979 | function | `applyLevel` |
| 980 | function | `groupSel` |
| 985 | function | `expandSub` |
| 988 | function | `uniqueSub` |
| 989 | function | `subMenu` |
| 993 | function | `enterSub` |
| 999 | function | `leaveSub` |
| 1005 | function | `renderCrumbs` |
| 1012 | function | `curDef` |
| 1013 | function | `publicOf` |
| 1014 | function | `togglePublic` |
| 1022 | function | `propsSub` |
| 1030 | function | `bindSub` |
| 1038 | function | `propsDef` |
| 1053 | function | `bindDef` |
| 1069 | function | `exportDef` |
| 1071 | function | `importDefs` |
| 1078 | function | `renderPalette` |
| 1092 | function | `tutorial` |
| 1095 | function | `circuitSig` |
| 1105 | function | `tutorialRef` |
| 1106 | function | `theoryValidity` |
| 1112 | function | `staleBanner` |
| 1115 | function | `bindRestore` |
| 1116 | function | `loadTutorial` |
| 1121 | function | `migrateFile` |
| 1124 | function | `applyProject` |
| 1134 | function | `renderTutorial` |
| 1144 | function | `gallery` |
| 1150 | function | `api` |
| 1151 | function | `paramsOf` |
| 1152 | function | `avgOver` |
| 1155 | function | `simValue` |
| 1161 | function | `lastPP` |
| 1163 | function | `runTheory` |
| 1176 | function | `cmpRows` |
| 1177 | function | `stepsHTML` |
| 1178 | function | `renderTheory` |
| 1210 | function | `rippleDev` |
| 1212 | function | `periodAvgAt` |
| 1214 | function | `samplingTheory` |
| 1223 | const fn | `lastAt` |
| 1245 | function | `polyTheory` |
| 1252 | const fn | `frac` |
| 1281 | function | `lastPeriods` |
| 1282 | function | `evalOrderHTML` |
| 1289 | function | `busDqTheory` |
| 1297 | function | `subLegsTheory` |
| 1306 | function | `blocksTheory` |
| 1321 | function | `pcmTheory` |
| 1347 | function | `codeTheory` |
| 1357 | function | `eisTheory` |
| 1359 | const fn | `ser` |
| 1372 | function | `imSteady` |
| 1375 | function | `imPar` |
| 1376 | function | `phaseRms` |
| 1377 | function | `vfTheory` |
| 1390 | function | `focTheory` |
| 1407 | function | `synTheory` |
| 1426 | const fn | `need` |
| 1446 | function | `pmTheory` |
| 1448 | const fn | `mtpa` |
| 1464 | function | `srmTheory` |
| 1479 | const fn | `curve` |
| 1490 | function | `lgTheory` |
| 1501 | const fn | `cr` |
| 1508 | function | `chaosTheory` |
| 1520 | function | `dcDriveTheory` |
| 1521 | const fn | `per` |
| 1522 | const fn | `cross` |
| 1552 | function | `twModel` |
| 1555 | const fn | `g` |
| 1558 | function | `twLattice` |
| 1565 | const fn | `marks` |
| 1568 | function | `twTheory` |
| 1576 | const fn | `at` |
| 1593 | function | `arTheory` |
| 1613 | function | `impulseMeasure` |
| 1615 | const fn | `cross` |
| 1618 | function | `marxTheory` |
| 1636 | function | `chopModel` |
| 1639 | const fn | `f` |
| 1642 | function | `chopTheory` |
| 1656 | function | `cmp3` |
| 1660 | function | `hvExact` |
| 1661 | function | `hv153Theory` |
| 1687 | function | `besI1e` |
| 1689 | function | `heaviside` |
| 1691 | function | `lossTheory` |
| 1710 | function | `vtBreak` |
| 1711 | function | `vtTheory` |
| 1731 | function | `hvdivTheory` |
| 1733 | const fn | `r` |
| 1745 | function | `scheringTheory` |
| 1746 | const fn | `inv` |
| 1755 | const fn | `sr` |
| 1761 | function | `formulaTheory` |
| 1832 | function | `nodeAvg` |
| 1838 | function | `circuitForMath` |
| 1870 | function | `scheduleMath` |
| 1871 | function | `batteryKey` |
| 1873 | function | `mathChoices` |
| 1874 | const fn | `prim` |
| 1876 | function | `renderMathChoices` |
| 1878 | function | `runTemplate` |
| 1884 | function | `runMath` |
| 1906 | function | `saveLocal` |
| 1907 | function | `download` |
| 1908 | function | `exportCSV` |
| 1914 | function | `syncScopeInputs` |
| 1915 | function | `setSpeed` |
| 1918 | function | `openSettings` |
| 1919 | const fn | `sel` |
| 1920 | const fn | `chk` |
| 1938 | function | `boot` |
| 1980 | const fn | `mv` |
| 1981 | const fn | `up` |
| 1982 | const fn | `navOpen` |
| 1988 | const fn | `probeSel` |
| 2032 | function | `renderTheoryLive` |

### `web/studio/bus.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 28 | class | `BusError` |
| 34 | const fn | `qOf` |
| 35 | const fn | `nOf` |
| 36 | const fn | `lab` |
| 38 | function | `members` |
| 39 | const fn | `splitVec` |
| 40 | function | `constWidth` |
| 41 | function | `selIdx` |
| 42 | const fn | `portWidth` |
| 45 | function | `needs` |
| 56 | function | `graph` |
| 59 | const fn | `union` |
| 61 | const fn | `cidOf` |
| 62 | const fn | `kind` |
| 67 | const fn | `nm` |
| 74 | function | `namesJoin` |
| 75 | function | `netKind` |
| 82 | function | `migrateNames` |
| 85 | const fn | `fix` |
| 89 | const fn | `kind` |
| 101 | function | `solve` |
| 103 | const fn | `wOf` |
| 105 | const fn | `pinLab` |
| 106 | const fn | `isEl` |
| 107 | const fn | `set` |
| 111 | const fn | `sig` |
| 123 | const fn | `sum` |
| 143 | function | `widths` |
| 149 | function | `perElement` |
| 157 | function | `expand` |
| 162 | const fn | `add` |
| 163 | const fn | `bit` |

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
| 72 | method | `export` |
| 74 | method | `replaceDoc` |
| 78 | method | `changed` |
| 79 | method | `selection` |
| 80 | method | `select` |
| 81 | method | `addPart` |
| 87 | method | `setParams` |
| 91 | method | `dropDangling` |
| 93 | method | `netKinds` |
| 99 | method | `setProgram` |
| 100 | method | `setSolve` |
| 102 | method | `setDiag` |
| 103 | method | `renderDiag` |
| 105 | method | `kindsOk` |
| 106 | method | `wiresAt` |
| 127 | method | `autoConnect` |
| 144 | method | `insertSeries` |
| 145 | const fn | `pos` |
| 150 | method | `setWireTool` |
| 151 | method | `startFreeWire` |
| 152 | method | `newJunction` |
| 154 | method | `finishFree` |
| 159 | method | `setWireProps` |
| 160 | method | `deleteSel` |
| 166 | method | `tidyJunctions` |
| 176 | method | `rotateSel` |
| 178 | method | `mirrorSel` |
| 180 | method | `captureWires` |
| 181 | method | `refitWires` |
| 182 | method | `copySel` |
| 183 | method | `paste` |
| 193 | method | `astar` |
| 201 | const fn | `idx` |
| 203 | const fn | `dirIndex` |
| 206 | const fn | `h` |
| 220 | method | `simpleRoute` |
| 223 | method | `route` |
| 227 | method | `adjustEnd` |
| 234 | method | `applyView` |
| 238 | method | `fit` |
| 240 | method | `extent` |
| 242 | method | `render` |
| 243 | method | `partSVG` |
| 249 | method | `renderPart` |
| 250 | method | `valueText` |
| 275 | method | `renderLabels` |
| 282 | method | `renderWires` |
| 304 | method | `pathD` |
| 309 | method | `segDir` |
| 310 | method | `midLabel` |
| 311 | method | `renderPins` |
| 321 | method | `renderSel` |
| 323 | method | `setLive` |
| 324 | method | `updateLive` |
| 331 | method | `drawArrows` |
| 341 | method | `world` |
| 343 | method | `hitAt` |
| 344 | method | `hitOf` |
| 346 | method | `down` |
| 372 | method | `move` |
| 385 | method | `up` |
| 399 | method | `cancelDrag` |
| 400 | method | `hoverPin` |
| 402 | method | `dbl` |
| 403 | method | `menu` |
| 405 | method | `wheel` |
| 410 | method | `key` |
| 433 | method | `beginDrag` |
| 440 | method | `dragMove` |
| 450 | method | `endDrag` |
| 457 | method | `dragSeg` |
| 460 | const fn | `stub` |
| 469 | method | `drawMarquee` |
| 472 | method | `marqueeSelect` |
| 475 | const fn | `inside` |
| 482 | method | `escape` |
| 485 | method | `beginPlace` |
| 486 | method | `ghost` |
| 488 | method | `finishPlace` |
| 489 | method | `cancelPlace` |
| 491 | method | `startWire` |
| 492 | method | `startWireFrom` |
| 493 | method | `previewWire` |
| 502 | method | `wireClick` |
| 508 | method | `orthoNext` |
| 509 | method | `finishWire` |
| 525 | method | `cancelWire` |
| 527 | method | `splitWire` |
| 537 | method | `wireNetPin` |

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
| 24 | const fn | `schedAt` |
| 25 | const fn | `num` |
| 27 | const fn | `numList` |
| 39 | function | `b64of` |
| 41 | function | `fromB64` |
| 44 | function | `snapEncode` |
| 45 | const fn | `num` |
| 46 | function | `enc` |
| 56 | function | `snapRestore` |
| 57 | function | `dec` |
| 68 | function | `smPort` |
| 72 | function | `smOut` |
| 75 | class | `NetlistError` |
| 80 | function | `dePiece` |
| 82 | const fn | `F` |
| 83 | function | `deInt` |
| 85 | function | `deFrac` |
| 88 | function | `tlElement` |
| 91 | function | `buildNetlist` |
| 101 | const fn | `union` |
| 116 | const fn | `nm` |
| 135 | const fn | `sn` |
| 139 | const fn | `isJ` |
| 159 | const fn | `lbl` |
| 164 | const fn | `node` |
| 165 | const fn | `internal` |
| 168 | const fn | `mkBlock` |
| 175 | const fn | `add` |
| 176 | const fn | `series` |
| 350 | function | `compileSignals` |
| 375 | function | `f2Phi` |
| 380 | function | `cmpF` |
| 384 | function | `stampM` |
| 386 | function | `luFactor` |
| 392 | function | `luSolve` |
| 399 | class | `Sim` |
| 400 | method | `constructor` |
| 402 | method | `basePeriod` |
| 405 | method | `tlMaxStep` |
| 406 | method | `setStep` |
| 409 | method | `stIndex` |
| 422 | method | `stVec` |
| 423 | method | `stepCfg` |
| 424 | method | `varSetup` |
| 427 | method | `setStepMode` |
| 429 | method | `hGrid` |
| 433 | method | `modeCap` |
| 437 | method | `swEls` |
| 438 | method | `topoKey` |
| 439 | method | `topoInfo` |
| 448 | method | `topoCheck` |
| 465 | method | `lteReset` |
| 466 | method | `ltePush` |
| 470 | method | `lteErr` |
| 480 | method | `varCheck` |
| 495 | method | `note` |
| 498 | method | `stepCheck` |
| 499 | method | `diagnostics` |
| 502 | method | `ringCheck` |
| 511 | method | `stateMap` |
| 513 | method | `stateMap0` |
| 524 | method | `load` |
| 564 | method | `reset` |
| 567 | method | `imStep` |
| 574 | method | `smStep` |
| 576 | method | `srmStep` |
| 577 | method | `srmOutputs` |
| 578 | method | `smOutputs` |
| 579 | method | `imSources` |
| 580 | method | `pyBlocks` |
| 586 | method | `setMethod` |
| 587 | method | `setControl` |
| 589 | method | `setBlock` |
| 591 | method | `setHold` |
| 593 | method | `markChange` |
| 598 | method | `progInit` |
| 599 | method | `addProgram` |
| 601 | method | `progNext` |
| 602 | method | `progDue` |
| 603 | method | `progApply` |
| 616 | method | `evInit` |
| 617 | method | `logEv` |
| 619 | method | `events` |
| 621 | method | `evSwitches` |
| 623 | method | `channelKeys` |
| 641 | method | `allocRecord` |
| 648 | method | `V` |
| 649 | method | `elCurrent` |
| 653 | method | `portI` |
| 655 | method | `computeVals` |
| 680 | method | `recordNow` |
| 688 | method | `closePeriod` |
| 697 | method | `lastPeriod` |
| 698 | method | `now` |
| 703 | method | `gateOf` |
| 709 | method | `rawGate` |
| 720 | method | `carrier` |
| 723 | method | `shGrid` |
| 724 | method | `shNext` |
| 726 | method | `sampleHolds` |
| 731 | method | `samples` |
| 732 | method | `ctrlEdges` |
| 738 | method | `scrU` |
| 739 | method | `scrGate` |
| 740 | method | `scrEdges` |
| 741 | method | `setFiring` |
| 742 | method | `compV` |
| 743 | method | `compI` |
| 745 | method | `dbl` |
| 746 | method | `sampleControllers` |
| 775 | method | `evalBlocks` |
| 848 | method | `blkDue` |
| 850 | method | `zcFrac` |
| 853 | method | `saveState` |
| 855 | method | `restoreState` |
| 859 | method | `snapshot` |
| 860 | method | `restoreSnapshot` |
| 862 | method | `gateSigPeek` |
| 865 | method | `gateSig` |
| 870 | method | `jumpScheds` |
| 877 | method | `jumpAt` |
| 878 | method | `values` |
| 897 | method | `assemble` |
| 899 | const fn | `g` |
| 921 | method | `rhs` |
| 923 | const fn | `J` |
| 940 | method | `cplLinearize` |
| 942 | method | `solveOnce` |
| 950 | method | `solve` |
| 964 | method | `nlLinearize` |
| 967 | method | `check` |
| 983 | method | `commit` |
| 1002 | method | `initialSolve` |
| 1012 | method | `tlSources` |
| 1016 | method | `tlRecord` |
| 1022 | method | `tlHist` |
| 1029 | method | `step` |
| 1031 | const fn | `gs` |
| 1037 | method | `stepCore` |
| 1091 | method | `edgeSolve` |
| 1094 | method | `edgePoint` |
| 1095 | method | `nextEvent` |
| 1101 | const fn | `sch` |
| 1123 | method | `spwmCut` |
| 1126 | const fn | `sig` |
| 1131 | method | `run` |
| 1172 | function | `exportForBatch` |
| 1181 | const fn | `ci` |
| 1182 | const fn | `vd` |
| 1183 | const fn | `V` |
| 1184 | const fn | `I` |
| 1185 | const fn | `portRec` |
| 1186 | const fn | `rec` |
| 1202 | const fn | `clkOf` |
| 1227 | function | `sweepPoint` |
| 1232 | function | `setPath` |
| 1238 | function | `eisPoint` |
| 1246 | function | `resume` |

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
| 453 | function | `defaults` |
| 455 | function | `elPins` |
| 456 | function | `sigPins` |
| 457 | function | `pinsOf` |
| 460 | function | `parseMat` |
| 462 | function | `nPorts` |
| 463 | function | `portY` |
| 464 | function | `portPins` |
| 465 | function | `portBox` |
| 467 | function | `posDef` |
| 469 | function | `symmetric` |
| 470 | function | `matInv` |
| 475 | function | `klMatrix` |
| 486 | function | `kgMatrix` |
| 494 | function | `srmGeo` |
| 496 | function | `srmSpins` |
| 498 | function | `srmPins` |
| 500 | function | `satD` |
| 501 | function | `satDinv` |
| 502 | function | `srmAlignedPsi` |
| 503 | function | `srmModelPsi` |
| 504 | function | `srmTableText` |
| 507 | function | `srmMag` |
| 523 | function | `chkMag` |
| 525 | function | `srmA` |
| 528 | function | `seg` |
| 529 | function | `srmPsi` |
| 531 | function | `srmCur` |
| 533 | function | `srmTorque` |
| 536 | function | `srmCoenergy` |
| 540 | function | `waveShape` |
| 541 | function | `waveAt` |
| 544 | function | `waveMeasure` |
| 547 | const fn | `cross` |
| 553 | function | `waveFit` |
| 554 | const fn | `res` |
| 565 | function | `directWave` |
| 568 | function | `impulseWave` |
| 578 | function | `bewley` |
| 581 | const fn | `at` |
| 587 | function | `movChar` |
| 592 | const fn | `pick` |
| 593 | const fn | `cur` |
| 594 | const fn | `inv` |
| 598 | function | `impulseDesign` |
| 603 | function | `impulseRoots` |
| 606 | function | `tlParams` |
| 614 | function | `lightningWave` |
| 621 | function | `pinKind` |
| 627 | function | `structural` |
| 634 | function | `pinWidth` |
| 637 | function | `xf` |
| 638 | function | `pinPos` |
| 640 | function | `pinDir` |
| 645 | function | `cpeParams` |
| 646 | function | `cpeBank` |
| 650 | function | `cpeZ` |
| 651 | function | `cpeZbank` |
| 652 | function | `boxOf` |
| 653 | function | `bbox` |
| 657 | function | `eng` |
| 661 | function | `parseEng` |
| 664 | function | `parseSched` |

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
| 78 | function | `open` |
| 85 | const fn | `index` |
| 92 | function | `session` |
| 93 | function | `setLive` |
| 101 | function | `advance` |
| 113 | function | `closeSession` |
| 116 | function | `tutorial` |
| 118 | function | `tutorials` |
| 120 | function | `handle` |
| 135 | function | `bifPoint` |
| 136 | function | `bifSpec` |
| 140 | function | `bifurcation` |
| 144 | const fn | `json` |

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
| 26 | const fn | `clone` |
| 27 | const fn | `isPort` |
| 28 | const fn | `okName` |
| 29 | class | `SubcircuitError` |
| 31 | function | `needs` |
| 34 | function | `portsOf` |
| 43 | const fn | `key` |
| 48 | const fn | `layout` |
| 51 | function | `instances` |
| 52 | const fn | `scan` |
| 56 | function | `cycleOf` |
| 57 | const fn | `visit` |
| 63 | function | `innerParts` |
| 65 | const fn | `set` |
| 74 | const fn | `tagName` |
| 77 | function | `flatten` |
| 81 | const fn | `walk` |
| 83 | const fn | `resolve` |
| 123 | function | `setParam` |
| 135 | function | `paramOf` |
| 141 | function | `sync` |
| 153 | const fn | `uniq` |
| 154 | const fn | `snap` |
| 155 | const fn | `pinKindOf` |
| 156 | function | `newDefName` |
| 162 | function | `create` |
| 202 | const fn | `fix` |
| 210 | function | `expand` |
| 218 | const fn | `loc` |
| 243 | function | `makeUnique` |
| 249 | function | `closure` |
| 255 | function | `externalRefs` |
| 256 | const fn | `head` |
| 262 | function | `refToPort` |
| 268 | const fn | `setIn` |

### `web/studio/templates.js`

_(χωρίς συναρτήσεις)_

### `web/studio/tutorials.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 5 | const fn | `C` |
| 6 | const fn | `J` |
| 7 | const fn | `pin` |
| 9 | const fn | `project` |
| 10 | const fn | `gnd` |
| 12 | function | `piGains` |
| 17 | function | `steadyStart` |
| 28 | method | `build` |
| 40 | method | `build` |
| 50 | method | `build` |
| 60 | method | `build` |
| 72 | method | `build` |
| 84 | method | `build` |
| 99 | function | `hbridge` |
| 112 | method | `build` |
| 117 | method | `build` |
| 123 | method | `build` |
| 132 | function | `vloopGains` |
| 137 | method | `build` |
| 150 | method | `build` |
| 163 | method | `build` |
| 164 | const fn | `dev` |
| 184 | method | `build` |
| 195 | const fn | `bus` |
| 223 | function | `samplingPhase` |
| 235 | method | `build` |
| 254 | function | `rippleDev` |
| 257 | function | `polyDesign` |
| 259 | function | `polyCancel` |
| 271 | method | `build` |
| 300 | method | `build` |
| 327 | method | `build` |
| 352 | method | `build` |
| 379 | function | `invIM` |
| 394 | method | `build` |
| 408 | method | `build` |
| 433 | const fn | `r4` |
| 437 | function | `smFoc` |
| 463 | method | `build` |
| 487 | method | `build` |
| 503 | method | `build` |
| 533 | method | `build` |
| 549 | method | `build` |
| 570 | method | `build` |
| 586 | method | `build` |
| 597 | function | `marxCircuit` |
| 616 | method | `build` |
| 648 | method | `build` |
| 655 | const fn | `down` |
| 672 | method | `build` |
| 689 | method | `build` |
| 702 | method | `build` |
| 719 | method | `build` |
| 736 | method | `build` |
| 756 | method | `build` |
| 771 | method | `build` |
| 816 | method | `build` |
| 826 | const fn | `y` |
| 849 | method | `build` |
| 850 | const fn | `ws` |
| 882 | method | `build` |

### `web/studio/units.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 30 | const fn | `T` |
| 32 | const fn | `qOf` |
| 33 | const fn | `isBus` |
| 34 | const fn | `txt` |
| 36 | const fn | `agree` |
| 37 | const fn | `intU` |
| 38 | const fn | `unitParam` |
| 40 | function | `outType` |
| 41 | const fn | `pass` |
| 42 | const fn | `sepU` |
| 70 | function | `expect` |
| 84 | function | `infer` |
| 89 | const fn | `kind` |
| 90 | const fn | `lab` |
| 94 | const fn | `same` |
| 112 | const fn | `out` |
| 116 | class | `UnitError` |
| 117 | function | `check` |

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
| 128 | function | `f2_phi` |
| 147 | function | `_f` |
| 155 | class | `Ctrl` |
| 159 | method | `Ctrl.__init__` |
| 184 | method | `Ctrl.dbl` |
| 187 | method | `Ctrl.raw` |
| 207 | method | `Ctrl.gate` |
| 219 | method | `Ctrl.carrier_at` |
| 230 | method | `Ctrl.edges` |
| 250 | function | `_lut` |
| 261 | function | `eval_ast` |
| 287 | function | `make_python_block` |
| 318 | class | `Circuit` |
| 319 | method | `Circuit.__init__` |
| 511 | method | `Circuit.R` |
| 514 | method | `Circuit.im_e` |
| 523 | method | `Circuit.im_deriv` |
| 536 | method | `Circuit.sm_cur` |
| 548 | method | `Circuit.sm_ports` |
| 553 | method | `Circuit.sm_deriv` |
| 568 | method | `Circuit.srm_A` |
| 573 | method | `Circuit._seg` |
| 577 | method | `Circuit.srm_cur` |
| 584 | method | `Circuit.srm_torque` |
| 593 | method | `Circuit.srm_currents` |
| 598 | method | `Circuit.srm_deriv` |
| 608 | method | `Circuit.Vsrc` |
| 621 | method | `Circuit.topo` |
| 631 | method | `Circuit.build` |
| 728 | method | `Circuit.bsrc` |
| 762 | method | `Circuit.solve_z` |
| 788 | method | `Circuit.solve_nl` |
| 830 | method | `Circuit.tl_hist` |
| 847 | method | `Circuit.tl_sec` |
| 854 | method | `Circuit.tl_ih` |
| 858 | method | `Circuit.tl_record` |
| 877 | method | `Circuit.scr_u` |
| 881 | method | `Circuit.scr_gate` |
| 885 | method | `Circuit.scr_edges` |
| 892 | method | `Circuit.gate_state` |
| 905 | method | `Circuit.set_gates` |
| 913 | method | `Circuit.may_turn_on` |
| 917 | method | `Circuit.tolerances` |
| 923 | method | `Circuit.consistent` |
| 965 | method | `Circuit.value` |
| 1001 | method | `Circuit.current` |
| 1042 | method | `Circuit.prime` |
| 1052 | method | `Circuit.sig_in` |
| 1056 | method | `Circuit.sh_grid` |
| 1068 | method | `Circuit.sh_next` |
| 1075 | method | `Circuit.log_ev` |
| 1081 | method | `Circuit.ev_switches` |
| 1090 | method | `Circuit.sh_sample` |
| 1110 | method | `Circuit.sample` |
| 1171 | method | `Circuit.cmp_f` |
| 1177 | method | `Circuit.blk_due` |
| 1188 | method | `Circuit.eval_blocks` |
| 1467 | method | `Circuit.block_events` |
| 1496 | method | `Circuit.next_event` |
| 1563 | function | `_decimate` |
| 1580 | function | `_diagnose` |
| 1631 | function | `simulate` |
| 1870 | function | `batch_sim` |

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
| 540 | method | `Project.stream` |
| 621 | method | `Project._result` |
| 628 | method | `Project._query` |
| 640 | method | `Project._run_scipy` |
| 673 | method | `Project.sweep` |
| 747 | method | `Project._sweep_meta` |
| 752 | method | `Project.bifurcation` |
| 809 | class | `_SweepFile` |
| 814 | method | `_SweepFile.__init__` |
| 828 | method | `_SweepFile._val` |
| 836 | method | `_SweepFile._read` |
| 855 | method | `_SweepFile._line` |
| 859 | method | `_SweepFile.add` |
| 863 | method | `_SweepFile.close` |
| 869 | function | `_sweep_point` |
| 877 | function | `_as_list` |
| 887 | function | `_spec` |
| 903 | function | `_measures` |
| 926 | function | `_base_T` |
| 933 | function | `_unit` |
| 937 | function | `_matname` |
| 942 | class | `Result` |
| 945 | method | `Result.__init__` |
| 955 | method | `Result.__getitem__` |
| 958 | method | `Result.__repr__` |
| 961 | method | `Result.events_csv` |
| 972 | method | `Result.measure` |
| 1032 | method | `Result.frame` |
| 1041 | method | `Result._meta_lines` |
| 1045 | method | `Result.to_csv` |
| 1058 | method | `Result._vars` |
| 1068 | method | `Result.as_dict` |
| 1072 | method | `Result.to_json` |
| 1076 | method | `Result.to_mat` |
| 1087 | method | `Result.to_parquet` |
| 1095 | method | `Result.to_hdf5` |
| 1101 | method | `Result.save` |
| 1105 | function | `_save` |
| 1112 | class | `SweepResult` |
| 1115 | method | `SweepResult.__init__` |
| 1121 | method | `SweepResult.__repr__` |
| 1124 | method | `SweepResult.column` |
| 1127 | method | `SweepResult.frame` |
| 1134 | method | `SweepResult.to_csv` |
| 1146 | method | `SweepResult.to_json` |
| 1150 | method | `SweepResult.to_mat` |
| 1157 | method | `SweepResult._columns` |
| 1161 | method | `SweepResult.to_parquet` |
| 1167 | method | `SweepResult.to_hdf5` |
| 1172 | method | `SweepResult.save` |
| 1176 | class | `BifurcationResult` |
| 1180 | method | `BifurcationResult.__init__` |
| 1187 | method | `BifurcationResult.__repr__` |
| 1190 | method | `BifurcationResult.changes` |
| 1199 | method | `BifurcationResult.rows` |
| 1203 | method | `BifurcationResult._columns` |
| 1207 | method | `BifurcationResult.frame` |
| 1214 | method | `BifurcationResult.plot` |
| 1217 | method | `BifurcationResult.to_csv` |
| 1228 | method | `BifurcationResult.to_json` |
| 1232 | method | `BifurcationResult.to_mat` |
| 1238 | method | `BifurcationResult.to_parquet` |
| 1243 | method | `BifurcationResult.to_hdf5` |
| 1248 | method | `BifurcationResult.save` |
| 1259 | function | `_el` |
| 1264 | function | `_matrix` |
| 1269 | function | `_ascii` |
| 1276 | function | `_mat_char` |
| 1281 | function | `_mat_value` |
| 1294 | function | `_savemat` |

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
