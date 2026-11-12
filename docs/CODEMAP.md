# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 108 |
| `web/studio/app.js` | 2176 |
| `web/studio/bus.js` | 197 |
| `web/studio/editor.js` | 629 |
| `web/studio/expr.js` | 56 |
| `web/studio/library.js` | 56 |
| `web/studio/linedata.js` | 168 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 77 |
| `web/studio/live_worker.js` | 61 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1485 |
| `web/studio/netlib.js` | 214 |
| `web/studio/parts.js` | 924 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 75 |
| `web/studio/scenario.js` | 148 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 171 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 113 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 276 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 1011 |
| `web/studio/units.js` | 155 |
| `pcl/runner.js` | 27 |
| `run.py` | 283 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 1979 |
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
| `pcl/__main__.py` | 347 |
| `pcl/control.py` | 893 |
| `pcl/core.py` | 1302 |
| `pcl/formats.py` | 222 |
| `pcl/impulse.py` | 858 |
| `pcl/lineconst.py` | 1016 |
| `pcl/link.py` | 131 |
| `pcl/network.py` | 1035 |
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
| `tests/test_generator.py` | 223 |
| `tests/test_impulse_tools.py` | 150 |
| `tests/test_library.py` | 41 |
| `tests/test_lines.py` | 355 |
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
| `tests/js/cable_tutorial.js` | 10 |
| `tests/js/gen_cases.js` | 78 |
| `tests/js/library_cases.js` | 11 |
| `tests/js/line_cases.js` | 15 |
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
| `tests/ui/line_flow.js` | 64 |
| `tests/ui/live_flow.js` | 41 |
| `tests/ui/perf_flow.js` | 68 |
| `tests/ui/scenario_flow.js` | 70 |
| `tests/ui/step_flow.js` | 41 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/subcircuit_flow.js` | 79 |
| `tests/ui/ux_flow.js` | 87 |
| `tests/ui/wiring_flow.js` | 128 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 68 | `R` | Αντίσταση |
| 72 | `CPE` | CPE / Warburg |
| 78 | `L` | Πηνίο |
| 82 | `C` | Πυκνωτής |
| 86 | `VDC` | Πηγή DC / μπαταρία |
| 92 | `VAC` | Πηγή AC |
| 96 | `VAC3` | Τριφασική πηγή (Y) |
| 102 | `IDC` | Πηγή ρεύματος |
| 108 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 121 | `D` | Δίοδος |
| 125 | `SCR` | Θυρίστορ (SCR) |
| 136 | `XFMR` | Μετασχηματιστής |
| 144 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 157 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 170 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 180 | `KL` | Συζευγμένα πηνία (N×N) |
| 191 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 198 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 206 | `SG` | Σπινθηριστής (διάκενο) |
| 219 | `CPL` | Φορτίο σταθερής ισχύος |
| 223 | `SH` | Δειγματοληψία και συγκράτηση (S&H) |
| 232 | `GND` | Γείωση |
| 234 | `JUNC` | Κόμβος |
| 235 | `PWM` | PWM / έλεγχος |
| 257 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 267 | `VM` | Βολτόμετρο |
| 269 | `AM` | Αμπερόμετρο (σε σειρά) |
| 272 | `VP` | Probe τάσης (ως προς τη γη) |
| 274 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 276 | `MEAS` | Μέτρηση στοιχείου |
| 279 | `CONST` | Σταθερά / πρόγραμμα |
| 283 | `GAIN` | Κέρδος |
| 285 | `SUM` | Άθροισμα |
| 288 | `MUL` | Γινόμενο |
| 290 | `DIV` | Διαίρεση a/b |
| 293 | `SAT` | Κορεσμός |
| 296 | `CMP` | Συγκριτής |
| 299 | `LOGIC` | Λογική πύλη |
| 302 | `PIB` | PI διακριτός |
| 308 | `UD` | Καθυστέρηση z⁻¹ |
| 311 | `SR` | Μανδαλωτής SR (latch) |
| 314 | `CLK` | Ρολόι (τετραγωνικό) |
| 317 | `RAMP` | Φέρον / ράμπα |
| 322 | `EXPR` | Έκφραση |
| 326 | `PY` | Μπλοκ Python |
| 331 | `IM` | Μηχανή επαγωγής (ισοδύναμο αντίστροφου Γ) |
| 341 | `SM` | Σύγχρονη μηχανή (SynRM / PMSM) |
| 356 | `SRM` | Μηχανή μεταβλητής μαγνητικής αντίστασης (SRM) |
| 373 | `MOD3` | Διαμορφωτής τριφασικός |
| 377 | `FEST` | Εκτιμητής ροής δρομέα |
| 381 | `INT` | Ολοκληρωτής |
| 385 | `LPF` | Βαθυπερατό 1ης τάξης |
| 389 | `F2` | Φίλτρο 2ης τάξης |
| 394 | `RLIM` | Όριο ρυθμού μεταβολής |
| 398 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 402 | `EDGE` | Ανιχνευτής ακμής |
| 406 | `CLARKE` | Clarke abc → αβ |
| 410 | `ICLARKE` | Clarke αβ → abc |
| 414 | `PARK` | Park αβ → dq |
| 417 | `IPARK` | Park dq → αβ |
| 420 | `PLL` | PLL (τριφασικό) |
| 426 | `TAGO` | Ετικέτα: προς (Goto) |
| 429 | `TAGI` | Ετικέτα: από (From) |
| 432 | `DISP` | Ένδειξη |
| 436 | `SUB` | Υποκύκλωμα |
| 439 | `PORT` | Θύρα (ηλεκτρική) |
| 442 | `SIN` | Θύρα εισόδου σήματος |
| 445 | `SOUT` | Θύρα εξόδου σήματος |
| 449 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 454 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 458 | `BSEL` | Επιλογή από δίαυλο |
| 461 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 467 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 478 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 486 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 494 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 505 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 516 | `GEN3` | Σύγχρονη γεννήτρια (διέγερση, αποσβεστήρες, άξονας) |
| 550 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 563 | `TLM` | Γραμμή από γεωμετρία (CP / FD) |

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
| 322 | `code_loop` | Μπλοκ κώδικα (3.3) | PI σε Python και πρόσθια τροφοδότηση με έκφραση |
| 347 | `cell_eis` | Μπαταρίες και EIS (3.3.1) | Δοκιμή κυψέλης: EIS με μετατροπέα |
| 390 | `im_vf` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: V/f και διαμόρφωση SPWM, SVPWM, τετραγωνική |
| 403 | `im_foc` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: διανυσματικός έλεγχος, εξασθένιση πεδίου, R̂_R |
| 456 | `synrm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μαγνητικής αντίστασης (SynRM): ευθυγράμμιση, έλεγχος dq, MTPA |
| 482 | `pmsm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μόνιμων μαγνητών (PMSM / IPMSM): i_d = 0 και MTPA |
| 498 | `srm` | Ηλεκτρική κίνηση (3.6) | Μηχανή μεταβλητής μαγνητικής αντίστασης (SRM 8/6): γωνίες, υστέρηση, βρόχος ψ–i |
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
| 902 | `gen_sc` | Συστήματα ισχύος (4.3) | Τριφασικό βραχυκύκλωμα στα άκρα σύγχρονης γεννήτριας |
| 918 | `fbm` | Συστήματα ισχύος (4.3) | IEEE First Benchmark Model: υποσύγχρονος συντονισμός (SSR) |
| 943 | `ieee9_emt` | Συστήματα ισχύος (4.3) | IEEE 9 ζυγών σε EMT, από τη ροή φορτίου |
| 969 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 990 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1008 | `empty` | Νέο | Κενό κύκλωμα |

## API του server (`run.py`, `/api/<action>`)

`analyze`, `batch_sim`, `bidir`, `boundary`, `capacitance`, `curves`, `derivation`, `design`, `envelope`, `inverse`, `line_model`, `linearize`, `model_proof`, `problem`, `scenario_run`, `scenario_sweep`, `solve`, `studio_math`, `sweep`, `switching`, `template_solve`, `validate_circuit`

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
| 13 | function | `loadSettings` |
| 14 | function | `saveSettings` |
| 17 | function | `notice` |
| 18 | function | `warnings` |
| 21 | function | `project` |
| 22 | function | `buildSim` |
| 39 | function | `lineCtx` |
| 40 | function | `play` |
| 41 | function | `pause` |
| 42 | function | `reset` |
| 43 | function | `stepT` |
| 44 | function | `runToEnd` |
| 45 | const fn | `chunk` |
| 47 | function | `loop` |
| 71 | function | `draw` |
| 73 | function | `setText` |
| 74 | function | `navRange` |
| 75 | function | `updateClock` |
| 79 | function | `liveOf` |
| 107 | function | `blkUnit` |
| 114 | function | `outsOf` |
| 116 | const fn | `vecN` |
| 118 | function | `chanLabel` |
| 126 | function | `addProbe` |
| 127 | function | `flash` |
| 128 | function | `signalsFor` |
| 142 | const fn | `fold` |
| 144 | function | `fillSignals` |
| 149 | function | `renderChannels` |
| 165 | function | `renderMeasure` |
| 174 | function | `MeasureUnit` |
| 177 | function | `simKey` |
| 178 | function | `perSeries` |
| 179 | function | `refFor` |
| 180 | const fn | `sched` |
| 184 | function | `metricsFor` |
| 188 | function | `metricsRows` |
| 193 | function | `eventMetricsHTML` |
| 195 | function | `renderMetricsPanel` |
| 206 | function | `rawSeries` |
| 209 | function | `autoF1` |
| 213 | function | `evRows` |
| 215 | function | `renderEvents` |
| 217 | const fn | `fv` |
| 221 | function | `eventsCsv` |
| 223 | function | `renderFFT` |
| 245 | function | `cellZ` |
| 247 | function | `renderEISForm` |
| 248 | const fn | `opt` |
| 252 | function | `runEIS` |
| 260 | function | `drawEIS` |
| 279 | function | `perSamples` |
| 281 | function | `periodText` |
| 282 | const fn | `svgPlot` |
| 284 | function | `pcmMapFn` |
| 286 | const fn | `z` |
| 289 | function | `renderPoincare` |
| 305 | function | `bfParams` |
| 307 | function | `renderBifurcationForm` |
| 313 | function | `runBifurcation` |
| 327 | function | `stopBifurcation` |
| 328 | function | `drawBifurcation` |
| 338 | function | `niceTop` |
| 341 | function | `btStatus` |
| 342 | function | `parseStep` |
| 343 | function | `runBatch` |
| 359 | function | `clearBatch` |
| 361 | function | `meanPL` |
| 363 | function | `ringTrace` |
| 365 | function | `compareHTML` |
| 375 | function | `renderBatch` |
| 380 | function | `parseCSV` |
| 382 | const fn | `cells` |
| 383 | const fn | `num` |
| 389 | const fn | `normName` |
| 390 | function | `renderCsvMap` |
| 391 | const fn | `auto` |
| 397 | function | `applyCsv` |
| 402 | function | `renderCsv` |
| 404 | function | `clearCsv` |
| 406 | function | `sampleCompareHTML` |
| 420 | function | `liveChange` |
| 422 | function | `renderLiveLog` |
| 431 | function | `changesToSchedule` |
| 433 | const fn | `f` |
| 442 | function | `updateLivePanel` |
| 447 | function | `setLivePanel` |
| 450 | function | `switchesOf` |
| 453 | function | `addPulses` |
| 455 | function | `pulseKeys` |
| 456 | function | `refreshControls` |
| 459 | const fn | `phase` |
| 493 | const fn | `setD` |
| 509 | const fn | `setPh` |
| 521 | const fn | `pinNow` |
| 532 | const fn | `pinSet` |
| 544 | function | `pinMap` |
| 545 | function | `pinX` |
| 546 | function | `pinV` |
| 549 | function | `closeInspector` |
| 550 | function | `placePopup` |
| 553 | function | `fieldValue` |
| 558 | function | `fieldHTML` |
| 568 | function | `openInspector` |
| 575 | const fn | `wired` |
| 581 | const fn | `apply` |
| 593 | const fn | `wireWidth` |
| 594 | function | `openWireInspector` |
| 610 | const fn | `numOf` |
| 616 | function | `psec` |
| 618 | function | `propsOpen` |
| 619 | function | `setProps` |
| 621 | function | `focusComp` |
| 622 | function | `togglePin` |
| 625 | function | `renderProps` |
| 634 | function | `propsComp` |
| 635 | const fn | `secOf` |
| 637 | const fn | `row` |
| 643 | const fn | `wired` |
| 657 | function | `propsJunc` |
| 659 | function | `propsWire` |
| 665 | function | `propsMulti` |
| 668 | function | `propsCircuit` |
| 678 | const fn | `opt` |
| 688 | const fn | `sv` |
| 694 | const fn | `chk` |
| 705 | function | `bindProps` |
| 735 | function | `diagItems` |
| 744 | function | `renderDiag` |
| 755 | function | `openDiag` |
| 756 | function | `flashComp` |
| 759 | function | `scheduleStepCheck` |
| 760 | function | `syncStepMode` |
| 822 | function | `scenSetCode` |
| 823 | function | `scenState` |
| 824 | function | `scenTab` |
| 825 | function | `scenOut` |
| 826 | function | `scenWorker` |
| 828 | function | `scenRun` |
| 836 | function | `scenStop` |
| 837 | function | `scenDone` |
| 839 | function | `scenMsg` |
| 854 | function | `scenBatch` |
| 859 | function | `scenEval` |
| 862 | function | `addonDock` |
| 865 | function | `renderAddons` |
| 866 | const fn | `vsel` |
| 880 | function | `knockToast` |
| 883 | function | `initAddons` |
| 890 | function | `scenBatchWrite` |
| 893 | function | `renderScenFiles` |
| 896 | const fn | `scenNum` |
| 897 | function | `scenTable` |
| 898 | function | `scenShow` |
| 911 | function | `scenTicks` |
| 912 | function | `scenPlot` |
| 916 | const fn | `thin` |
| 923 | const fn | `dig` |
| 934 | function | `initScenarios` |
| 941 | function | `liveApply` |
| 944 | function | `closeMenu` |
| 945 | function | `openMenu` |
| 963 | function | `updateHover` |
| 981 | const fn | `atTop` |
| 982 | function | `topDoc` |
| 983 | function | `defsOf` |
| 984 | const fn | `pid` |
| 985 | function | `fullDoc` |
| 987 | function | `commitView` |
| 989 | function | `viewDiag` |
| 990 | const fn | `rel` |
| 993 | function | `compAt` |
| 998 | function | `allComps` |
| 999 | const fn | `walk` |
| 1005 | function | `partDef` |
| 1007 | function | `pdefaults` |
| 1008 | function | `subParams` |
| 1010 | function | `placeOk` |
| 1012 | function | `renameChannels` |
| 1014 | function | `levelDoc` |
| 1015 | function | `applyLevel` |
| 1016 | function | `groupSel` |
| 1021 | function | `expandSub` |
| 1024 | function | `uniqueSub` |
| 1025 | function | `subMenu` |
| 1029 | function | `enterSub` |
| 1035 | function | `leaveSub` |
| 1041 | function | `renderCrumbs` |
| 1048 | function | `curDef` |
| 1049 | function | `publicOf` |
| 1050 | function | `togglePublic` |
| 1058 | function | `propsSub` |
| 1066 | function | `bindSub` |
| 1074 | function | `propsDef` |
| 1089 | function | `bindDef` |
| 1105 | function | `exportDef` |
| 1107 | function | `importDefs` |
| 1118 | function | `palLoad` |
| 1119 | function | `palSave` |
| 1120 | function | `palRecent` |
| 1121 | function | `palItem` |
| 1122 | function | `renderPalette` |
| 1129 | const fn | `isOpen` |
| 1143 | function | `tutorial` |
| 1146 | function | `circuitSig` |
| 1156 | function | `tutorialRef` |
| 1157 | function | `theoryValidity` |
| 1163 | function | `staleBanner` |
| 1166 | function | `bindRestore` |
| 1167 | function | `loadTutorial` |
| 1172 | function | `migrateFile` |
| 1175 | function | `applyProject` |
| 1185 | function | `renderTutorial` |
| 1195 | function | `gallery` |
| 1201 | function | `api` |
| 1202 | function | `paramsOf` |
| 1203 | function | `avgOver` |
| 1206 | function | `simValue` |
| 1212 | function | `lastPP` |
| 1214 | function | `runTheory` |
| 1227 | function | `cmpRows` |
| 1228 | function | `stepsHTML` |
| 1229 | function | `renderTheory` |
| 1261 | function | `rippleDev` |
| 1263 | function | `periodAvgAt` |
| 1265 | function | `samplingTheory` |
| 1274 | const fn | `lastAt` |
| 1296 | function | `polyTheory` |
| 1303 | const fn | `frac` |
| 1332 | function | `lastPeriods` |
| 1333 | function | `evalOrderHTML` |
| 1342 | function | `genScTheory` |
| 1344 | const fn | `Iac` |
| 1352 | function | `shaftModes` |
| 1359 | function | `fbmTheory` |
| 1367 | function | `ieee9Theory` |
| 1374 | function | `lineFdTheory` |
| 1375 | const fn | `lab` |
| 1383 | const fn | `pk` |
| 1388 | function | `netFaultTheory` |
| 1401 | function | `busDqTheory` |
| 1409 | function | `subLegsTheory` |
| 1418 | function | `blocksTheory` |
| 1433 | function | `pcmTheory` |
| 1459 | function | `codeTheory` |
| 1469 | function | `eisTheory` |
| 1471 | const fn | `ser` |
| 1484 | function | `imSteady` |
| 1487 | function | `imPar` |
| 1488 | function | `phaseRms` |
| 1489 | function | `vfTheory` |
| 1502 | function | `focTheory` |
| 1519 | function | `synTheory` |
| 1538 | const fn | `need` |
| 1558 | function | `pmTheory` |
| 1560 | const fn | `mtpa` |
| 1576 | function | `srmTheory` |
| 1591 | const fn | `curve` |
| 1602 | function | `lgTheory` |
| 1613 | const fn | `cr` |
| 1620 | function | `chaosTheory` |
| 1632 | function | `dcDriveTheory` |
| 1633 | const fn | `per` |
| 1634 | const fn | `cross` |
| 1664 | function | `twModel` |
| 1667 | const fn | `g` |
| 1670 | function | `twLattice` |
| 1677 | const fn | `marks` |
| 1680 | function | `twTheory` |
| 1688 | const fn | `at` |
| 1705 | function | `arTheory` |
| 1725 | function | `impulseMeasure` |
| 1727 | const fn | `cross` |
| 1730 | function | `marxTheory` |
| 1748 | function | `chopModel` |
| 1751 | const fn | `f` |
| 1754 | function | `chopTheory` |
| 1768 | function | `cmp3` |
| 1772 | function | `hvExact` |
| 1773 | function | `hv153Theory` |
| 1799 | function | `besI1e` |
| 1801 | function | `heaviside` |
| 1803 | function | `lossTheory` |
| 1822 | function | `vtBreak` |
| 1823 | function | `vtTheory` |
| 1843 | function | `hvdivTheory` |
| 1845 | const fn | `r` |
| 1857 | function | `scheringTheory` |
| 1858 | const fn | `inv` |
| 1867 | const fn | `sr` |
| 1873 | function | `formulaTheory` |
| 1949 | function | `nodeAvg` |
| 1955 | function | `circuitForMath` |
| 1987 | function | `scheduleMath` |
| 1988 | function | `batteryKey` |
| 1990 | function | `mathChoices` |
| 1991 | const fn | `prim` |
| 1993 | function | `renderMathChoices` |
| 1995 | function | `runTemplate` |
| 2001 | function | `runMath` |
| 2023 | function | `saveLocal` |
| 2024 | function | `saveLocalSoon` |
| 2026 | function | `download` |
| 2027 | function | `exportCSV` |
| 2033 | function | `syncScopeInputs` |
| 2034 | function | `setSpeed` |
| 2037 | function | `openSettings` |
| 2038 | const fn | `sel` |
| 2039 | const fn | `chk` |
| 2060 | function | `boot` |
| 2104 | const fn | `mv` |
| 2105 | const fn | `up` |
| 2106 | const fn | `navOpen` |
| 2117 | const fn | `probeSel` |
| 2172 | function | `renderTheoryLive` |

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
| 16 | const fn | `snap` |
| 17 | const fn | `same` |
| 18 | const fn | `esc` |
| 20 | function | `normalize` |
| 25 | const fn | `orth` |
| 26 | class | `MinHeap` |
| 27 | method | `pop` |
| 30 | class | `Editor` |
| 31 | method | `constructor` |
| 64 | method | `comp` |
| 66 | method | `wire` |
| 69 | method | `busy` |
| 70 | method | `newId` |
| 71 | method | `pin` |
| 72 | method | `wirePts` |
| 73 | method | `setWirePts` |
| 74 | method | `snapshot` |
| 77 | method | `remember` |
| 79 | method | `undo` |
| 80 | method | `redo` |
| 81 | method | `cleanSel` |
| 82 | method | `load` |
| 90 | method | `export` |
| 92 | method | `replaceDoc` |
| 96 | method | `changed` |
| 97 | method | `selection` |
| 98 | method | `select` |
| 99 | method | `addPart` |
| 105 | method | `setParams` |
| 109 | method | `dropDangling` |
| 111 | method | `netKinds` |
| 117 | method | `setProgram` |
| 118 | method | `setSolve` |
| 120 | method | `setDiag` |
| 121 | method | `renderDiag` |
| 123 | method | `kindsOk` |
| 124 | method | `wiresAt` |
| 145 | method | `autoConnect` |
| 162 | method | `insertSeries` |
| 163 | const fn | `pos` |
| 168 | method | `setWireTool` |
| 169 | method | `startFreeWire` |
| 170 | method | `newJunction` |
| 172 | method | `finishFree` |
| 177 | method | `setWireProps` |
| 178 | method | `deleteSel` |
| 184 | method | `tidyJunctions` |
| 194 | method | `rotateSel` |
| 196 | method | `mirrorSel` |
| 198 | method | `captureWires` |
| 199 | method | `refitWires` |
| 200 | method | `copySel` |
| 201 | method | `paste` |
| 211 | method | `astar` |
| 219 | const fn | `idx` |
| 221 | const fn | `dirIndex` |
| 224 | const fn | `h` |
| 238 | method | `simpleRoute` |
| 241 | method | `route` |
| 245 | method | `adjustEnd` |
| 253 | method | `areaSize` |
| 260 | method | `requestView` |
| 261 | method | `viewFrame` |
| 268 | method | `applyView` |
| 275 | method | `gridBg` |
| 284 | method | `fit` |
| 286 | method | `extent` |
| 288 | method | `render` |
| 290 | method | `partEls` |
| 291 | method | `partSVG` |
| 297 | method | `renderPart` |
| 298 | method | `valueText` |
| 331 | method | `renderLabels` |
| 336 | const fn | `at` |
| 340 | method | `renderWires` |
| 354 | method | `wireSVG` |
| 365 | method | `redrawWire` |
| 366 | method | `pathD` |
| 371 | method | `segDir` |
| 372 | method | `midLabel` |
| 373 | method | `renderPins` |
| 383 | method | `renderSel` |
| 385 | method | `setLive` |
| 387 | method | `updateLive` |
| 396 | method | `drawArrows` |
| 407 | method | `world` |
| 409 | method | `hitAt` |
| 410 | method | `hitOf` |
| 412 | method | `down` |
| 438 | method | `move` |
| 451 | method | `up` |
| 465 | method | `cancelDrag` |
| 466 | method | `hoverPin` |
| 468 | method | `dbl` |
| 469 | method | `menu` |
| 472 | method | `worldNow` |
| 473 | method | `wheel` |
| 480 | method | `letter` |
| 481 | method | `key` |
| 505 | method | `beginDrag` |
| 516 | method | `dragMove` |
| 528 | method | `endDrag` |
| 538 | method | `bakeMove` |
| 543 | method | `dragSeg` |
| 546 | const fn | `stub` |
| 555 | method | `drawMarquee` |
| 558 | method | `marqueeSelect` |
| 561 | const fn | `inside` |
| 568 | method | `escape` |
| 571 | method | `beginPlace` |
| 572 | method | `ghost` |
| 574 | method | `finishPlace` |
| 575 | method | `cancelPlace` |
| 577 | method | `startWire` |
| 578 | method | `startWireFrom` |
| 579 | method | `previewWire` |
| 588 | method | `wireClick` |
| 594 | method | `orthoNext` |
| 595 | method | `finishWire` |
| 611 | method | `cancelWire` |
| 613 | method | `splitWire` |
| 623 | method | `wireNetPin` |
| 625 | method | `canScroll` |

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

### `web/studio/library.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | const fn | `S` |
| 38 | const fn | `strip` |
| 39 | function | `match` |
| 41 | function | `view` |
| 45 | const fn | `by` |

### `web/studio/linedata.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 11 | const fn | `esc` |
| 19 | const fn | `isCable` |
| 20 | const fn | `mm` |
| 21 | const fn | `phList` |
| 22 | const fn | `EMPTY_OH` |
| 23 | const fn | `EMPTY_CAB` |
| 24 | const fn | `NEW_CABLE` |
| 27 | const fn | `num` |
| 28 | const fn | `fmt` |
| 31 | function | `expand` |
| 34 | function | `drawing` |
| 36 | const fn | `X` |
| 43 | function | `cableDrawing` |
| 44 | const fn | `R` |
| 48 | const fn | `X` |
| 65 | function | `cableTables` |
| 74 | function | `table` |
| 78 | function | `plot` |
| 80 | const fn | `X` |
| 86 | function | `reportHTML` |
| 98 | function | `open` |
| 100 | const fn | `norm` |
| 102 | const fn | `close` |
| 103 | const fn | `pars` |
| 106 | const fn | `render` |
| 132 | const fn | `saveData` |
| 161 | function | `compute` |
| 165 | function | `refresh` |

### `web/studio/linemodels.js`

_(χωρίς συναρτήσεις)_

### `web/studio/live.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 24 | function | `worker` |
| 31 | const fn | `share` |
| 32 | function | `shareRec` |
| 35 | function | `apply` |
| 46 | function | `sameKeys` |
| 47 | function | `wrap` |
| 51 | function | `unwrap` |

### `web/studio/live_worker.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 19 | const fn | `later` |
| 21 | function | `final` |
| 24 | function | `finish` |
| 27 | function | `tick` |
| 35 | function | `loop` |
| 47 | function | `start` |

### `web/studio/math.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 7 | const fn | `esc` |
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
| 79 | const fn | `genCopy` |
| 81 | function | `csolve` |
| 99 | function | `acInit` |
| 106 | const fn | `ad` |
| 107 | const fn | `y` |
| 139 | const fn | `seq` |
| 151 | const fn | `dad` |
| 174 | class | `NetlistError` |
| 179 | function | `dePiece` |
| 181 | const fn | `F` |
| 182 | function | `deInt` |
| 184 | function | `deFrac` |
| 187 | function | `tlElement` |
| 194 | function | `tlmElement` |
| 204 | function | `rcCoef` |
| 206 | function | `buildNetlist` |
| 216 | const fn | `union` |
| 231 | const fn | `nm` |
| 250 | const fn | `sn` |
| 254 | const fn | `isJ` |
| 274 | const fn | `lbl` |
| 279 | const fn | `node` |
| 280 | const fn | `internal` |
| 283 | const fn | `mkBlock` |
| 290 | const fn | `add` |
| 291 | const fn | `series` |
| 486 | function | `compileSignals` |
| 511 | function | `f2Phi` |
| 516 | function | `cmpF` |
| 520 | function | `stampM` |
| 522 | function | `luFactor` |
| 528 | function | `luSolve` |
| 535 | class | `Sim` |
| 536 | method | `constructor` |
| 538 | method | `basePeriod` |
| 542 | method | `tlMaxStep` |
| 543 | method | `setStep` |
| 546 | method | `stIndex` |
| 559 | method | `stVec` |
| 560 | method | `stepCfg` |
| 561 | method | `varSetup` |
| 564 | method | `setStepMode` |
| 566 | method | `hGrid` |
| 570 | method | `modeCap` |
| 574 | method | `swEls` |
| 575 | method | `topoKey` |
| 576 | method | `topoInfo` |
| 585 | method | `topoCheck` |
| 602 | method | `lteReset` |
| 603 | method | `ltePush` |
| 607 | method | `lteErr` |
| 617 | method | `varCheck` |
| 632 | method | `note` |
| 635 | method | `stepCheck` |
| 636 | method | `diagnostics` |
| 639 | method | `ringCheck` |
| 648 | method | `stateMap` |
| 650 | method | `stateMap0` |
| 661 | method | `load` |
| 704 | method | `reset` |
| 707 | method | `imStep` |
| 714 | method | `smStep` |
| 716 | method | `srmStep` |
| 717 | method | `srmOutputs` |
| 718 | method | `smOutputs` |
| 722 | method | `genStep` |
| 729 | method | `genOutputs` |
| 734 | method | `genTm` |
| 735 | method | `genEfd` |
| 736 | method | `imSources` |
| 737 | method | `pyBlocks` |
| 743 | method | `setMethod` |
| 744 | method | `setControl` |
| 746 | method | `setBlock` |
| 748 | method | `setHold` |
| 750 | method | `markChange` |
| 755 | method | `progInit` |
| 756 | method | `addProgram` |
| 758 | method | `progNext` |
| 759 | method | `progDue` |
| 760 | method | `progApply` |
| 773 | method | `evInit` |
| 774 | method | `logEv` |
| 776 | method | `events` |
| 778 | method | `evSwitches` |
| 780 | method | `channelKeys` |
| 798 | method | `allocRecord` |
| 805 | method | `V` |
| 806 | method | `elCurrent` |
| 810 | method | `portI` |
| 812 | method | `computeVals` |
| 838 | method | `recordNow` |
| 846 | method | `closePeriod` |
| 855 | method | `lastPeriod` |
| 856 | method | `now` |
| 861 | method | `gateOf` |
| 867 | method | `rawGate` |
| 878 | method | `carrier` |
| 881 | method | `shGrid` |
| 882 | method | `shNext` |
| 884 | method | `sampleHolds` |
| 889 | method | `samples` |
| 890 | method | `ctrlEdges` |
| 896 | method | `scrU` |
| 897 | method | `scrGate` |
| 898 | method | `scrEdges` |
| 899 | method | `setFiring` |
| 900 | method | `compV` |
| 901 | method | `compI` |
| 903 | method | `dbl` |
| 904 | method | `sampleControllers` |
| 933 | method | `evalBlocks` |
| 1008 | method | `blkDue` |
| 1010 | method | `zcFrac` |
| 1013 | method | `saveState` |
| 1015 | method | `restoreState` |
| 1021 | method | `snapshot` |
| 1022 | method | `restoreSnapshot` |
| 1024 | method | `gateSigPeek` |
| 1027 | method | `gateSig` |
| 1032 | method | `jumpScheds` |
| 1039 | method | `jumpAt` |
| 1040 | method | `values` |
| 1062 | method | `assemble` |
| 1069 | const fn | `g` |
| 1092 | method | `rhs` |
| 1094 | const fn | `J` |
| 1112 | method | `cplLinearize` |
| 1116 | method | `factor` |
| 1122 | method | `spAssemble` |
| 1129 | method | `solveOnce` |
| 1138 | method | `solve` |
| 1152 | method | `nlLinearize` |
| 1155 | method | `check` |
| 1171 | method | `commit` |
| 1192 | method | `initialSolve` |
| 1204 | method | `tlSources` |
| 1208 | method | `tlRecord` |
| 1214 | method | `tlHist` |
| 1220 | method | `tlmG` |
| 1224 | method | `tlmSources` |
| 1236 | method | `tlmRecord` |
| 1249 | method | `tlmHist` |
| 1256 | method | `step` |
| 1258 | const fn | `gs` |
| 1264 | method | `stepCore` |
| 1318 | method | `edgeSolve` |
| 1321 | method | `edgePoint` |
| 1322 | method | `nextEvent` |
| 1328 | const fn | `sch` |
| 1350 | method | `spwmCut` |
| 1353 | const fn | `sig` |
| 1358 | method | `run` |
| 1400 | function | `exportForBatch` |
| 1415 | const fn | `ci` |
| 1416 | const fn | `vd` |
| 1417 | const fn | `V` |
| 1418 | const fn | `I` |
| 1419 | const fn | `portRec` |
| 1420 | const fn | `rec` |
| 1436 | const fn | `clkOf` |
| 1462 | function | `sweepPoint` |
| 1467 | function | `setPath` |
| 1473 | function | `eisPoint` |
| 1481 | function | `resume` |

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
| 142 | function | `lineData` |
| 146 | function | `lineDef` |
| 148 | const fn | `mat` |
| 160 | function | `defOf` |
| 163 | const fn | `hasLib` |
| 164 | function | `needs` |
| 166 | function | `expand` |
| 168 | const fn | `conv` |
| 175 | function | `warnings` |
| 181 | const fn | `cx` |
| 183 | function | `csolve` |
| 188 | function | `faultCurrents` |
| 207 | function | `behindXF` |

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
| 578 | function | `defaults` |
| 580 | function | `elPins` |
| 581 | function | `sigPins` |
| 582 | function | `pinsOf` |
| 585 | function | `parseMat` |
| 587 | function | `nPorts` |
| 588 | function | `portY` |
| 589 | function | `portPins` |
| 590 | function | `portBox` |
| 592 | function | `posDef` |
| 594 | function | `symmetric` |
| 595 | function | `matInv` |
| 600 | function | `klMatrix` |
| 611 | function | `kgMatrix` |
| 619 | function | `srmGeo` |
| 621 | function | `srmSpins` |
| 623 | function | `srmPins` |
| 625 | function | `satD` |
| 626 | function | `satDinv` |
| 628 | function | `genSpins` |
| 639 | function | `genTsc` |
| 644 | function | `genCirc2` |
| 645 | const fn | `Fn` |
| 653 | function | `genAxis` |
| 661 | const fn | `classic` |
| 667 | const fn | `plist` |
| 671 | function | `genModel` |
| 677 | const fn | `w` |
| 686 | const fn | `grp` |
| 703 | function | `genGamma` |
| 711 | function | `genDQ` |
| 715 | function | `genSteady` |
| 717 | const fn | `rot` |
| 724 | function | `srmAlignedPsi` |
| 725 | function | `srmModelPsi` |
| 726 | function | `srmTableText` |
| 729 | function | `srmMag` |
| 745 | function | `chkMag` |
| 747 | function | `srmA` |
| 750 | function | `seg` |
| 751 | function | `srmPsi` |
| 753 | function | `srmCur` |
| 755 | function | `srmTorque` |
| 758 | function | `srmCoenergy` |
| 762 | function | `waveShape` |
| 763 | function | `waveAt` |
| 766 | function | `waveMeasure` |
| 769 | const fn | `cross` |
| 775 | function | `waveFit` |
| 776 | const fn | `res` |
| 787 | function | `directWave` |
| 790 | function | `impulseWave` |
| 800 | function | `bewley` |
| 803 | const fn | `at` |
| 809 | function | `movChar` |
| 814 | const fn | `pick` |
| 815 | const fn | `cur` |
| 816 | const fn | `inv` |
| 820 | function | `impulseDesign` |
| 825 | function | `impulseRoots` |
| 828 | function | `tlParams` |
| 837 | function | `tlmData` |
| 839 | function | `tlmM` |
| 841 | function | `tlmPin` |
| 842 | function | `tlmPins` |
| 844 | function | `tlmKey` |
| 847 | function | `tlmModel` |
| 854 | function | `lightningWave` |
| 861 | function | `pinKind` |
| 872 | function | `structural` |
| 879 | function | `pinWidth` |
| 882 | function | `xf` |
| 883 | function | `pinPos` |
| 885 | function | `pinDir` |
| 890 | function | `cpeParams` |
| 891 | function | `cpeBank` |
| 895 | function | `cpeZ` |
| 896 | function | `cpeZbank` |
| 897 | function | `boxOf` |
| 898 | function | `bbox` |
| 903 | function | `fmtNum` |
| 907 | function | `eng` |
| 911 | function | `parseEng` |
| 914 | function | `parseSched` |

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
| 32 | method | `requestDraw` |
| 34 | method | `colors` |
| 36 | method | `setRefs` |
| 37 | method | `refRange` |
| 40 | method | `nav` |
| 41 | const fn | `clamp` |
| 52 | method | `resize` |
| 55 | method | `unitOf` |
| 59 | method | `resolve` |
| 60 | method | `channels` |
| 61 | method | `addChannel` |
| 64 | method | `removeChannel` |
| 65 | method | `moveChannel` |
| 67 | method | `windowSec` |
| 68 | method | `viewRange` |
| 70 | method | `ringIndex` |
| 71 | method | `ringStart` |
| 73 | method | `eachRaw` |
| 75 | method | `eachPeriod` |
| 76 | method | `valueAt` |
| 79 | method | `stats` |
| 84 | method | `usePeriods` |
| 86 | method | `panTo` |
| 87 | method | `zoomAt` |
| 89 | method | `cursorAt` |
| 91 | method | `plotW` |
| 92 | method | `drawSamples` |
| 96 | method | `draw` |
| 119 | const fn | `Y` |
| 136 | const fn | `flush` |

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
| 907 | method | `build` |
| 915 | function | `fbmPoint` |
| 922 | method | `build` |
| 947 | method | `build` |
| 949 | const fn | `GD` |
| 950 | const fn | `L` |
| 951 | const fn | `G` |
| 952 | const fn | `Ld` |
| 966 | const fn | `LM` |
| 967 | function | `tlmPart` |
| 974 | method | `build` |
| 976 | const fn | `rig` |
| 995 | method | `build` |
| 997 | const fn | `rig` |
| 1009 | method | `build` |

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
| 104 | function | `expect` |
| 118 | function | `infer` |
| 123 | const fn | `kind` |
| 124 | const fn | `lab` |
| 128 | const fn | `same` |
| 146 | const fn | `out` |
| 150 | class | `UnitError` |
| 151 | function | `check` |

### `pcl/runner.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | function | `answer` |
| 14 | function | `main` |
| 20 | function | `serve` |

### `run.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 54 | function | `line_model` |
| 65 | function | `scenario` |
| 94 | class | `Handler` |
| 96 | method | `Handler.local` |
| 100 | method | `Handler.alive` |
| 110 | method | `Handler.body` |
| 119 | method | `Handler.addon_get` |
| 149 | method | `Handler.addon_post` |
| 176 | method | `Handler.send` |
| 192 | method | `Handler.do_GET` |
| 223 | method | `Handler.do_POST` |
| 258 | function | `main` |

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
| 528 | method | `Circuit.R` |
| 531 | method | `Circuit.im_e` |
| 540 | method | `Circuit.im_deriv` |
| 553 | method | `Circuit.sm_cur` |
| 565 | method | `Circuit.sm_ports` |
| 570 | method | `Circuit.sm_deriv` |
| 585 | method | `Circuit.srm_A` |
| 590 | method | `Circuit._seg` |
| 594 | method | `Circuit.srm_cur` |
| 601 | method | `Circuit.srm_torque` |
| 610 | method | `Circuit.srm_currents` |
| 615 | method | `Circuit.srm_deriv` |
| 628 | method | `Circuit.gen_cur` |
| 645 | method | `Circuit.gen_efd` |
| 652 | method | `Circuit.gen_tm` |
| 659 | method | `Circuit.gen_deriv` |
| 677 | method | `Circuit.gen_out` |
| 696 | method | `Circuit.Vsrc` |
| 712 | method | `Circuit.topo` |
| 722 | method | `Circuit.build` |
| 819 | method | `Circuit.bsrc` |
| 859 | method | `Circuit.solve_z` |
| 885 | method | `Circuit.solve_nl` |
| 927 | method | `Circuit.tl_hist` |
| 944 | method | `Circuit.tl_sec` |
| 951 | method | `Circuit.tl_ih` |
| 955 | method | `Circuit.tl_record` |
| 974 | method | `Circuit.scr_u` |
| 978 | method | `Circuit.scr_gate` |
| 982 | method | `Circuit.scr_edges` |
| 989 | method | `Circuit.gate_state` |
| 1002 | method | `Circuit.set_gates` |
| 1010 | method | `Circuit.may_turn_on` |
| 1014 | method | `Circuit.tolerances` |
| 1020 | method | `Circuit.consistent` |
| 1062 | method | `Circuit.value` |
| 1098 | method | `Circuit.current` |
| 1141 | method | `Circuit.prime` |
| 1151 | method | `Circuit.sig_in` |
| 1155 | method | `Circuit.sh_grid` |
| 1167 | method | `Circuit.sh_next` |
| 1174 | method | `Circuit.log_ev` |
| 1180 | method | `Circuit.ev_switches` |
| 1189 | method | `Circuit.sh_sample` |
| 1209 | method | `Circuit.sample` |
| 1270 | method | `Circuit.cmp_f` |
| 1276 | method | `Circuit.blk_due` |
| 1287 | method | `Circuit.eval_blocks` |
| 1568 | method | `Circuit.block_events` |
| 1597 | method | `Circuit.next_event` |
| 1664 | function | `_decimate` |
| 1681 | function | `_diagnose` |
| 1732 | function | `simulate` |
| 1973 | function | `batch_sim` |

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
| 94 | function | `main` |

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

### `pcl/lineconst.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 38 | class | `LineError` |
| 42 | function | `_f` |
| 54 | function | `conductors` |
| 101 | function | `phases` |
| 108 | function | `z_internal` |
| 136 | function | `_carson_coeffs` |
| 155 | function | `carson_series` |
| 195 | function | `carson_integral` |
| 219 | function | `cables` |
| 266 | function | `tube` |
| 292 | function | `pollaczek` |
| 329 | function | `wedepohl` |
| 341 | function | `sea_return` |
| 359 | function | `permittivity` |
| 374 | function | `cable_zy` |
| 447 | function | `zy` |
| 489 | function | `_groups` |
| 498 | function | `reduce_phases` |
| 507 | function | `phase_matrices` |
| 526 | function | `sequence` |
| 537 | function | `ti_matrix` |
| 561 | function | `modal` |
| 567 | function | `q_error` |
| 577 | function | `vfit` |
| 632 | function | `rational` |
| 638 | function | `freqs` |
| 643 | function | `cp_model` |
| 660 | function | `_fit_a` |
| 698 | function | `fd_model` |
| 748 | function | `report` |
| 769 | function | `exact_admittance` |
| 776 | function | `line_admittance` |
| 788 | function | `model_admittance` |
| 807 | function | `nlt_solve` |
| 875 | function | `_src_laplace` |
| 891 | function | `_line_y` |
| 903 | function | `_cp_y` |
| 923 | function | `_half` |
| 929 | function | `load_data` |
| 934 | function | `save_data` |
| 962 | function | `_sc` |
| 980 | function | `typical` |
| 985 | function | `api` |

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
| 734 | method | `Network.to_emt` |
| 814 | function | `_coo` |
| 820 | function | `_zip` |
| 825 | function | `_solve` |
| 836 | function | `_nr` |
| 869 | function | `superposition` |
| 893 | function | `trv` |
| 927 | function | `_matrix` |
| 939 | function | `read_matpower` |
| 969 | function | `ieee` |
| 975 | function | `ieee9` |
| 992 | function | `ieee14` |
| 997 | function | `to_dict` |
| 1010 | function | `from_dict` |
| 1030 | function | `save` |
| 1034 | function | `load` |

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
