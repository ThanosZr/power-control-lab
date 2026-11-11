# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 108 |
| `web/studio/app.js` | 2053 |
| `web/studio/bus.js` | 197 |
| `web/studio/editor.js` | 546 |
| `web/studio/expr.js` | 56 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1275 |
| `web/studio/netlib.js` | 194 |
| `web/studio/parts.js` | 727 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 75 |
| `web/studio/scenario.js` | 148 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 167 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 113 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 276 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 902 |
| `web/studio/units.js` | 154 |
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
| `pcl/__main__.py` | 341 |
| `pcl/control.py` | 893 |
| `pcl/core.py` | 1302 |
| `pcl/formats.py` | 222 |
| `pcl/impulse.py` | 858 |
| `pcl/link.py` | 131 |
| `pcl/network.py` | 942 |
| `pcl/plotting.py` | 340 |
| `pcl/workbench.py` | 295 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 106 |
| `tests/test_batch.py` | 208 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_bus.py` | 145 |
| `tests/test_control.py` | 213 |
| `tests/test_derivation.py` | 93 |
| `tests/test_engine.py` | 276 |
| `tests/test_impulse_tools.py` | 150 |
| `tests/test_live_program.py` | 49 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_matlab.py` | 150 |
| `tests/test_netlib.py` | 209 |
| `tests/test_network.py` | 258 |
| `tests/test_pcl.py` | 312 |
| `tests/test_plotting.py` | 113 |
| `tests/test_sparse.py` | 39 |
| `tests/test_step.py` | 109 |
| `tests/test_stream.py` | 132 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 609 |
| `tests/test_subcircuit.py` | 149 |
| `tests/test_templates.py` | 237 |
| `tests/test_tutorials.py` | 703 |
| `tests/test_units.py` | 78 |
| `tests/test_workbench.py` | 78 |
| `tests/js/batch_requests.js` | 94 |
| `tests/js/bus_cases.js` | 127 |
| `tests/js/live_cases.js` | 31 |
| `tests/js/netlib42_cases.js` | 50 |
| `tests/js/netlib_cases.js` | 93 |
| `tests/js/sim_cases.js` | 356 |
| `tests/js/snapshot_cases.js` | 19 |
| `tests/js/sparse_cases.js` | 47 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/subcircuit_cases.js` | 87 |
| `tests/js/tutorial_cases.js` | 137 |
| `tests/js/units_cases.js` | 52 |
| `tests/ui/addons_flow.js` | 125 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/bus_flow.js` | 90 |
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
| 123 | `XFMR` | Μετασχηματιστής |
| 131 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 144 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 157 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 167 | `KL` | Συζευγμένα πηνία (N×N) |
| 178 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 185 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 193 | `SG` | Σπινθηριστής (διάκενο) |
| 206 | `CPL` | Φορτίο σταθερής ισχύος |
| 210 | `SH` | Sample & Hold |
| 219 | `GND` | Γείωση |
| 221 | `JUNC` | Κόμβος |
| 222 | `PWM` | PWM / έλεγχος |
| 244 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 254 | `VM` | Βολτόμετρο |
| 256 | `AM` | Αμπερόμετρο (σε σειρά) |
| 259 | `VP` | Probe τάσης (ως προς τη γη) |
| 261 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 263 | `MEAS` | Μέτρηση στοιχείου |
| 266 | `CONST` | Σταθερά / πρόγραμμα |
| 270 | `GAIN` | Κέρδος |
| 272 | `SUM` | Άθροισμα |
| 275 | `MUL` | Γινόμενο |
| 277 | `DIV` | Διαίρεση a/b |
| 280 | `SAT` | Κορεσμός |
| 283 | `CMP` | Συγκριτής |
| 286 | `LOGIC` | Λογική πύλη |
| 289 | `PIB` | PI διακριτός |
| 295 | `UD` | Καθυστέρηση z⁻¹ |
| 298 | `SR` | SR latch |
| 301 | `CLK` | Ρολόι (τετραγωνικό) |
| 304 | `RAMP` | Φέρον / ράμπα |
| 309 | `EXPR` | Έκφραση |
| 313 | `PY` | Μπλοκ Python |
| 318 | `IM` | Μηχανή επαγωγής (ανάστροφο-Γ) |
| 328 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 343 | `SRM` | Μηχανή μαγνητικής αντίστασης με διακόπτες (SRM) |
| 360 | `MOD3` | Διαμορφωτής τριφασικός |
| 364 | `FEST` | Εκτιμητής ροής δρομέα |
| 368 | `INT` | Ολοκληρωτής |
| 372 | `LPF` | Βαθυπερατό 1ης τάξης |
| 376 | `F2` | Φίλτρο 2ης τάξης |
| 381 | `RLIM` | Όριο ρυθμού μεταβολής |
| 385 | `RT` | Μετάβαση ρυθμού |
| 389 | `EDGE` | Ανιχνευτής ακμής |
| 393 | `CLARKE` | Clarke abc → αβ |
| 397 | `ICLARKE` | Clarke αβ → abc |
| 401 | `PARK` | Park αβ → dq |
| 404 | `IPARK` | Park dq → αβ |
| 407 | `PLL` | PLL (τριφασικό) |
| 413 | `TAGO` | Ετικέτα: προς (Goto) |
| 416 | `TAGI` | Ετικέτα: από (From) |
| 419 | `DISP` | Ένδειξη |
| 423 | `SUB` | Υποκύκλωμα |
| 426 | `PORT` | Θύρα (ηλεκτρική) |
| 429 | `SIN` | Θύρα εισόδου σήματος |
| 432 | `SOUT` | Θύρα εξόδου σήματος |
| 436 | `MUX` | Mux (σήματα → δίαυλος) |
| 441 | `DEMUX` | Demux (δίαυλος → σήματα) |
| 445 | `BSEL` | Επιλογή από δίαυλο |
| 448 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 454 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 465 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 473 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 481 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 492 | `LOAD3` | Τριφασικό φορτίο (P, Q) |

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
| 882 | `net_fault` | Δίκτυο (4.1) | Βραχυκύκλωμα σε δίκτυο: IEC 60909 και συμμετρικές συνιστώσες |
| 899 | `empty` | Νέο | Κενό κύκλωμα |

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
| 971 | function | `partDef` |
| 973 | function | `pdefaults` |
| 974 | function | `subParams` |
| 976 | function | `placeOk` |
| 978 | function | `renameChannels` |
| 980 | function | `levelDoc` |
| 981 | function | `applyLevel` |
| 982 | function | `groupSel` |
| 987 | function | `expandSub` |
| 990 | function | `uniqueSub` |
| 991 | function | `subMenu` |
| 995 | function | `enterSub` |
| 1001 | function | `leaveSub` |
| 1007 | function | `renderCrumbs` |
| 1014 | function | `curDef` |
| 1015 | function | `publicOf` |
| 1016 | function | `togglePublic` |
| 1024 | function | `propsSub` |
| 1032 | function | `bindSub` |
| 1040 | function | `propsDef` |
| 1055 | function | `bindDef` |
| 1071 | function | `exportDef` |
| 1073 | function | `importDefs` |
| 1080 | function | `renderPalette` |
| 1094 | function | `tutorial` |
| 1097 | function | `circuitSig` |
| 1107 | function | `tutorialRef` |
| 1108 | function | `theoryValidity` |
| 1114 | function | `staleBanner` |
| 1117 | function | `bindRestore` |
| 1118 | function | `loadTutorial` |
| 1123 | function | `migrateFile` |
| 1126 | function | `applyProject` |
| 1136 | function | `renderTutorial` |
| 1146 | function | `gallery` |
| 1152 | function | `api` |
| 1153 | function | `paramsOf` |
| 1154 | function | `avgOver` |
| 1157 | function | `simValue` |
| 1163 | function | `lastPP` |
| 1165 | function | `runTheory` |
| 1178 | function | `cmpRows` |
| 1179 | function | `stepsHTML` |
| 1180 | function | `renderTheory` |
| 1212 | function | `rippleDev` |
| 1214 | function | `periodAvgAt` |
| 1216 | function | `samplingTheory` |
| 1225 | const fn | `lastAt` |
| 1247 | function | `polyTheory` |
| 1254 | const fn | `frac` |
| 1283 | function | `lastPeriods` |
| 1284 | function | `evalOrderHTML` |
| 1292 | function | `netFaultTheory` |
| 1305 | function | `busDqTheory` |
| 1313 | function | `subLegsTheory` |
| 1322 | function | `blocksTheory` |
| 1337 | function | `pcmTheory` |
| 1363 | function | `codeTheory` |
| 1373 | function | `eisTheory` |
| 1375 | const fn | `ser` |
| 1388 | function | `imSteady` |
| 1391 | function | `imPar` |
| 1392 | function | `phaseRms` |
| 1393 | function | `vfTheory` |
| 1406 | function | `focTheory` |
| 1423 | function | `synTheory` |
| 1442 | const fn | `need` |
| 1462 | function | `pmTheory` |
| 1464 | const fn | `mtpa` |
| 1480 | function | `srmTheory` |
| 1495 | const fn | `curve` |
| 1506 | function | `lgTheory` |
| 1517 | const fn | `cr` |
| 1524 | function | `chaosTheory` |
| 1536 | function | `dcDriveTheory` |
| 1537 | const fn | `per` |
| 1538 | const fn | `cross` |
| 1568 | function | `twModel` |
| 1571 | const fn | `g` |
| 1574 | function | `twLattice` |
| 1581 | const fn | `marks` |
| 1584 | function | `twTheory` |
| 1592 | const fn | `at` |
| 1609 | function | `arTheory` |
| 1629 | function | `impulseMeasure` |
| 1631 | const fn | `cross` |
| 1634 | function | `marxTheory` |
| 1652 | function | `chopModel` |
| 1655 | const fn | `f` |
| 1658 | function | `chopTheory` |
| 1672 | function | `cmp3` |
| 1676 | function | `hvExact` |
| 1677 | function | `hv153Theory` |
| 1703 | function | `besI1e` |
| 1705 | function | `heaviside` |
| 1707 | function | `lossTheory` |
| 1726 | function | `vtBreak` |
| 1727 | function | `vtTheory` |
| 1747 | function | `hvdivTheory` |
| 1749 | const fn | `r` |
| 1761 | function | `scheringTheory` |
| 1762 | const fn | `inv` |
| 1771 | const fn | `sr` |
| 1777 | function | `formulaTheory` |
| 1849 | function | `nodeAvg` |
| 1855 | function | `circuitForMath` |
| 1887 | function | `scheduleMath` |
| 1888 | function | `batteryKey` |
| 1890 | function | `mathChoices` |
| 1891 | const fn | `prim` |
| 1893 | function | `renderMathChoices` |
| 1895 | function | `runTemplate` |
| 1901 | function | `runMath` |
| 1923 | function | `saveLocal` |
| 1924 | function | `download` |
| 1925 | function | `exportCSV` |
| 1931 | function | `syncScopeInputs` |
| 1932 | function | `setSpeed` |
| 1935 | function | `openSettings` |
| 1936 | const fn | `sel` |
| 1937 | const fn | `chk` |
| 1955 | function | `boot` |
| 1997 | const fn | `mv` |
| 1998 | const fn | `up` |
| 1999 | const fn | `navOpen` |
| 2005 | const fn | `probeSel` |
| 2049 | function | `renderTheoryLive` |

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
| 281 | method | `renderLabels` |
| 288 | method | `renderWires` |
| 310 | method | `pathD` |
| 315 | method | `segDir` |
| 316 | method | `midLabel` |
| 317 | method | `renderPins` |
| 327 | method | `renderSel` |
| 329 | method | `setLive` |
| 330 | method | `updateLive` |
| 337 | method | `drawArrows` |
| 347 | method | `world` |
| 349 | method | `hitAt` |
| 350 | method | `hitOf` |
| 352 | method | `down` |
| 378 | method | `move` |
| 391 | method | `up` |
| 405 | method | `cancelDrag` |
| 406 | method | `hoverPin` |
| 408 | method | `dbl` |
| 409 | method | `menu` |
| 411 | method | `wheel` |
| 416 | method | `key` |
| 439 | method | `beginDrag` |
| 446 | method | `dragMove` |
| 456 | method | `endDrag` |
| 463 | method | `dragSeg` |
| 466 | const fn | `stub` |
| 475 | method | `drawMarquee` |
| 478 | method | `marqueeSelect` |
| 481 | const fn | `inside` |
| 488 | method | `escape` |
| 491 | method | `beginPlace` |
| 492 | method | `ghost` |
| 494 | method | `finishPlace` |
| 495 | method | `cancelPlace` |
| 497 | method | `startWire` |
| 498 | method | `startWireFrom` |
| 499 | method | `previewWire` |
| 508 | method | `wireClick` |
| 514 | method | `orthoNext` |
| 515 | method | `finishWire` |
| 531 | method | `cancelWire` |
| 533 | method | `splitWire` |
| 543 | method | `wireNetPin` |

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
| 27 | const fn | `schedAt` |
| 28 | const fn | `num` |
| 30 | const fn | `numList` |
| 42 | function | `b64of` |
| 44 | function | `fromB64` |
| 47 | function | `snapEncode` |
| 48 | const fn | `num` |
| 49 | function | `enc` |
| 59 | function | `snapRestore` |
| 60 | function | `dec` |
| 71 | function | `smPort` |
| 75 | function | `smOut` |
| 78 | class | `NetlistError` |
| 83 | function | `dePiece` |
| 85 | const fn | `F` |
| 86 | function | `deInt` |
| 88 | function | `deFrac` |
| 91 | function | `tlElement` |
| 94 | function | `buildNetlist` |
| 104 | const fn | `union` |
| 119 | const fn | `nm` |
| 138 | const fn | `sn` |
| 142 | const fn | `isJ` |
| 162 | const fn | `lbl` |
| 167 | const fn | `node` |
| 168 | const fn | `internal` |
| 171 | const fn | `mkBlock` |
| 178 | const fn | `add` |
| 179 | const fn | `series` |
| 354 | function | `compileSignals` |
| 379 | function | `f2Phi` |
| 384 | function | `cmpF` |
| 388 | function | `stampM` |
| 390 | function | `luFactor` |
| 396 | function | `luSolve` |
| 403 | class | `Sim` |
| 404 | method | `constructor` |
| 406 | method | `basePeriod` |
| 409 | method | `tlMaxStep` |
| 410 | method | `setStep` |
| 413 | method | `stIndex` |
| 426 | method | `stVec` |
| 427 | method | `stepCfg` |
| 428 | method | `varSetup` |
| 431 | method | `setStepMode` |
| 433 | method | `hGrid` |
| 437 | method | `modeCap` |
| 441 | method | `swEls` |
| 442 | method | `topoKey` |
| 443 | method | `topoInfo` |
| 452 | method | `topoCheck` |
| 469 | method | `lteReset` |
| 470 | method | `ltePush` |
| 474 | method | `lteErr` |
| 484 | method | `varCheck` |
| 499 | method | `note` |
| 502 | method | `stepCheck` |
| 503 | method | `diagnostics` |
| 506 | method | `ringCheck` |
| 515 | method | `stateMap` |
| 517 | method | `stateMap0` |
| 528 | method | `load` |
| 568 | method | `reset` |
| 571 | method | `imStep` |
| 578 | method | `smStep` |
| 580 | method | `srmStep` |
| 581 | method | `srmOutputs` |
| 582 | method | `smOutputs` |
| 583 | method | `imSources` |
| 584 | method | `pyBlocks` |
| 590 | method | `setMethod` |
| 591 | method | `setControl` |
| 593 | method | `setBlock` |
| 595 | method | `setHold` |
| 597 | method | `markChange` |
| 602 | method | `progInit` |
| 603 | method | `addProgram` |
| 605 | method | `progNext` |
| 606 | method | `progDue` |
| 607 | method | `progApply` |
| 620 | method | `evInit` |
| 621 | method | `logEv` |
| 623 | method | `events` |
| 625 | method | `evSwitches` |
| 627 | method | `channelKeys` |
| 645 | method | `allocRecord` |
| 652 | method | `V` |
| 653 | method | `elCurrent` |
| 657 | method | `portI` |
| 659 | method | `computeVals` |
| 684 | method | `recordNow` |
| 692 | method | `closePeriod` |
| 701 | method | `lastPeriod` |
| 702 | method | `now` |
| 707 | method | `gateOf` |
| 713 | method | `rawGate` |
| 724 | method | `carrier` |
| 727 | method | `shGrid` |
| 728 | method | `shNext` |
| 730 | method | `sampleHolds` |
| 735 | method | `samples` |
| 736 | method | `ctrlEdges` |
| 742 | method | `scrU` |
| 743 | method | `scrGate` |
| 744 | method | `scrEdges` |
| 745 | method | `setFiring` |
| 746 | method | `compV` |
| 747 | method | `compI` |
| 749 | method | `dbl` |
| 750 | method | `sampleControllers` |
| 779 | method | `evalBlocks` |
| 852 | method | `blkDue` |
| 854 | method | `zcFrac` |
| 857 | method | `saveState` |
| 859 | method | `restoreState` |
| 863 | method | `snapshot` |
| 864 | method | `restoreSnapshot` |
| 866 | method | `gateSigPeek` |
| 869 | method | `gateSig` |
| 874 | method | `jumpScheds` |
| 881 | method | `jumpAt` |
| 882 | method | `values` |
| 901 | method | `assemble` |
| 908 | const fn | `g` |
| 930 | method | `rhs` |
| 932 | const fn | `J` |
| 949 | method | `cplLinearize` |
| 953 | method | `factor` |
| 959 | method | `spAssemble` |
| 966 | method | `solveOnce` |
| 975 | method | `solve` |
| 989 | method | `nlLinearize` |
| 992 | method | `check` |
| 1008 | method | `commit` |
| 1027 | method | `initialSolve` |
| 1037 | method | `tlSources` |
| 1041 | method | `tlRecord` |
| 1047 | method | `tlHist` |
| 1054 | method | `step` |
| 1056 | const fn | `gs` |
| 1062 | method | `stepCore` |
| 1116 | method | `edgeSolve` |
| 1119 | method | `edgePoint` |
| 1120 | method | `nextEvent` |
| 1126 | const fn | `sch` |
| 1148 | method | `spwmCut` |
| 1151 | const fn | `sig` |
| 1156 | method | `run` |
| 1197 | function | `exportForBatch` |
| 1206 | const fn | `ci` |
| 1207 | const fn | `vd` |
| 1208 | const fn | `V` |
| 1209 | const fn | `I` |
| 1210 | const fn | `portRec` |
| 1211 | const fn | `rec` |
| 1227 | const fn | `clkOf` |
| 1252 | function | `sweepPoint` |
| 1257 | function | `setPath` |
| 1263 | function | `eisPoint` |
| 1271 | function | `resume` |

### `web/studio/netlib.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 13 | const fn | `isLib` |
| 15 | const fn | `num` |
| 16 | const fn | `prm` |
| 17 | const fn | `s` |
| 18 | const fn | `isBus` |
| 22 | function | `builder` |
| 24 | const fn | `comp` |
| 25 | const fn | `wire` |
| 26 | const fn | `node` |
| 27 | const fn | `gnd` |
| 29 | const fn | `terms` |
| 37 | function | `gridZ` |
| 48 | function | `gridDef` |
| 50 | const fn | `mat` |
| 59 | const fn | `schedOf` |
| 60 | function | `faultDef` |
| 64 | const fn | `sw` |
| 70 | function | `breakerDef` |
| 84 | function | `xfData` |
| 89 | function | `xfDef` |
| 90 | const fn | `star` |
| 91 | const fn | `ends` |
| 109 | function | `loadDef` |
| 140 | function | `defOf` |
| 143 | const fn | `hasLib` |
| 144 | function | `needs` |
| 146 | function | `expand` |
| 148 | const fn | `conv` |
| 155 | function | `warnings` |
| 161 | const fn | `cx` |
| 163 | function | `csolve` |
| 168 | function | `faultCurrents` |
| 187 | function | `behindXF` |

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
| 503 | function | `defaults` |
| 505 | function | `elPins` |
| 506 | function | `sigPins` |
| 507 | function | `pinsOf` |
| 510 | function | `parseMat` |
| 512 | function | `nPorts` |
| 513 | function | `portY` |
| 514 | function | `portPins` |
| 515 | function | `portBox` |
| 517 | function | `posDef` |
| 519 | function | `symmetric` |
| 520 | function | `matInv` |
| 525 | function | `klMatrix` |
| 536 | function | `kgMatrix` |
| 544 | function | `srmGeo` |
| 546 | function | `srmSpins` |
| 548 | function | `srmPins` |
| 550 | function | `satD` |
| 551 | function | `satDinv` |
| 552 | function | `srmAlignedPsi` |
| 553 | function | `srmModelPsi` |
| 554 | function | `srmTableText` |
| 557 | function | `srmMag` |
| 573 | function | `chkMag` |
| 575 | function | `srmA` |
| 578 | function | `seg` |
| 579 | function | `srmPsi` |
| 581 | function | `srmCur` |
| 583 | function | `srmTorque` |
| 586 | function | `srmCoenergy` |
| 590 | function | `waveShape` |
| 591 | function | `waveAt` |
| 594 | function | `waveMeasure` |
| 597 | const fn | `cross` |
| 603 | function | `waveFit` |
| 604 | const fn | `res` |
| 615 | function | `directWave` |
| 618 | function | `impulseWave` |
| 628 | function | `bewley` |
| 631 | const fn | `at` |
| 637 | function | `movChar` |
| 642 | const fn | `pick` |
| 643 | const fn | `cur` |
| 644 | const fn | `inv` |
| 648 | function | `impulseDesign` |
| 653 | function | `impulseRoots` |
| 656 | function | `tlParams` |
| 664 | function | `lightningWave` |
| 671 | function | `pinKind` |
| 681 | function | `structural` |
| 688 | function | `pinWidth` |
| 691 | function | `xf` |
| 692 | function | `pinPos` |
| 694 | function | `pinDir` |
| 699 | function | `cpeParams` |
| 700 | function | `cpeBank` |
| 704 | function | `cpeZ` |
| 705 | function | `cpeZbank` |
| 706 | function | `boxOf` |
| 707 | function | `bbox` |
| 711 | function | `eng` |
| 715 | function | `parseEng` |
| 718 | function | `parseSched` |

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

### `web/studio/sparse.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 14 | class | `SparseError` |
| 17 | function | `pattern` |
| 28 | function | `order` |
| 35 | const fn | `move` |
| 50 | function | `grow` |
| 54 | function | `dfs` |
| 66 | function | `lu` |
| 101 | function | `solve` |

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
| 28 | const fn | `clone` |
| 29 | const fn | `isPort` |
| 30 | const fn | `okName` |
| 31 | class | `SubcircuitError` |
| 33 | function | `needs` |
| 36 | function | `portsOf` |
| 45 | const fn | `key` |
| 50 | const fn | `layout` |
| 53 | function | `instances` |
| 54 | const fn | `scan` |
| 58 | function | `cycleOf` |
| 59 | const fn | `visit` |
| 65 | function | `innerParts` |
| 67 | const fn | `set` |
| 76 | const fn | `tagName` |
| 79 | function | `flatten` |
| 84 | const fn | `walk` |
| 86 | const fn | `resolve` |
| 126 | function | `setParam` |
| 138 | function | `paramOf` |
| 144 | function | `sync` |
| 156 | const fn | `uniq` |
| 157 | const fn | `snap` |
| 158 | const fn | `pinKindOf` |
| 159 | function | `newDefName` |
| 165 | function | `create` |
| 205 | const fn | `fix` |
| 213 | function | `expand` |
| 221 | const fn | `loc` |
| 246 | function | `makeUnique` |
| 252 | function | `closure` |
| 258 | function | `externalRefs` |
| 259 | const fn | `head` |
| 265 | function | `refToPort` |
| 271 | const fn | `setIn` |

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
| 889 | method | `build` |
| 900 | method | `build` |

### `web/studio/units.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 36 | const fn | `T` |
| 38 | const fn | `qOf` |
| 39 | const fn | `isBus` |
| 40 | const fn | `txt` |
| 42 | const fn | `agree` |
| 43 | const fn | `intU` |
| 44 | const fn | `unitParam` |
| 51 | const fn | `clean` |
| 52 | const fn | `addP` |
| 54 | function | `dims` |
| 56 | const fn | `term` |
| 58 | const fn | `parts` |
| 60 | const fn | `sameD` |
| 62 | const fn | `eqU` |
| 63 | function | `fmtU` |
| 65 | const fn | `w` |
| 68 | const fn | `mulU` |
| 70 | const fn | `agreeU` |
| 72 | function | `outType` |
| 73 | const fn | `pass` |
| 74 | const fn | `sepU` |
| 103 | function | `expect` |
| 117 | function | `infer` |
| 122 | const fn | `kind` |
| 123 | const fn | `lab` |
| 127 | const fn | `same` |
| 145 | const fn | `out` |
| 149 | class | `UnitError` |
| 150 | function | `check` |

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
| 50 | function | `_net` |
| 89 | function | `main` |

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
| 294 | function | `_num_name` |
| 300 | function | `heidler_name` |
| 304 | function | `voltage_name` |
| 308 | function | `_grid` |
| 313 | function | `_xing` |
| 320 | function | `lightning_current` |
| 330 | function | `waveform_characteristics` |
| 358 | function | `auto_H` |
| 363 | function | `_sampled_times` |
| 383 | function | `_refine_heidler` |
| 393 | function | `_now` |
| 397 | function | `heidler_row` |
| 425 | function | `frontline_geometry` |
| 450 | function | `dexp_characteristics` |
| 466 | function | `_dexp_derived` |
| 476 | function | `voltage_characteristics` |
| 493 | function | `_selected` |
| 501 | function | `_refine_voltage` |
| 511 | function | `validate_voltage` |
| 590 | function | `voltage_row` |
| 630 | function | `_cell` |
| 640 | function | `rows_csv` |
| 654 | function | `save_rows` |
| 667 | function | `read_rows` |
| 682 | function | `read_signal_csv` |
| 714 | function | `_clean` |
| 726 | function | `_interp` |
| 742 | function | `_corr` |
| 756 | function | `_auto_unit` |
| 763 | function | `heidler_reference` |
| 775 | function | `voltage_reference` |
| 791 | function | `compare_current` |
| 826 | function | `compare_voltage` |

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

### `pcl/network.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 36 | class | `NetworkError` |
| 41 | function | `c_factor` |
| 51 | function | `kappa` |
| 60 | function | `_interp` |
| 72 | function | `mu_factor` |
| 80 | function | `q_factor` |
| 86 | function | `_group` |
| 94 | function | `_zx` |
| 100 | function | `_zr` |
| 108 | function | `_kt` |
| 114 | class | `Network` |
| 118 | method | `Network.__init__` |
| 126 | method | `Network.bus` |
| 131 | method | `Network._add` |
| 143 | method | `Network.feeder` |
| 150 | method | `Network.line` |
| 156 | method | `Network.transformer` |
| 164 | method | `Network.transformer3` |
| 181 | method | `Network.generator` |
| 188 | method | `Network.unit` |
| 195 | method | `Network.motor` |
| 201 | method | `Network.reactor` |
| 205 | method | `Network.load` |
| 213 | method | `Network.shunt` |
| 217 | method | `Network.branch_pu` |
| 221 | method | `Network.remove` |
| 224 | method | `Network.element` |
| 231 | method | `Network._zb` |
| 235 | method | `Network._ib` |
| 239 | method | `Network._sc_parts` |
| 374 | method | `Network._t3` |
| 409 | method | `Network.impedances` |
| 417 | method | `Network._index` |
| 421 | method | `Network._ybus` |
| 445 | method | `Network._ratios` |
| 480 | method | `Network.short_circuit` |
| 564 | method | `Network._breaking` |
| 596 | method | `Network.iec60909` |
| 601 | method | `Network._lf_model` |
| 687 | method | `Network.load_flow` |
| 734 | function | `_coo` |
| 740 | function | `_zip` |
| 745 | function | `_solve` |
| 756 | function | `_nr` |
| 789 | function | `superposition` |
| 813 | function | `trv` |
| 847 | function | `_matrix` |
| 859 | function | `read_matpower` |
| 889 | function | `ieee` |
| 895 | function | `ieee9` |
| 899 | function | `ieee14` |
| 904 | function | `to_dict` |
| 917 | function | `from_dict` |
| 937 | function | `save` |
| 941 | function | `load` |

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
