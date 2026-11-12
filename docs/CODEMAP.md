# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 109 |
| `web/studio/app.js` | 2309 |
| `web/studio/bus.js` | 197 |
| `web/studio/editor.js` | 638 |
| `web/studio/expr.js` | 56 |
| `web/studio/library.js` | 56 |
| `web/studio/linedata.js` | 168 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 92 |
| `web/studio/live_worker.js` | 88 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1530 |
| `web/studio/netlib.js` | 214 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 956 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 87 |
| `web/studio/scenario.js` | 151 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 185 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 113 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 276 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 1099 |
| `web/studio/units.js` | 156 |
| `web/studio/watch.js` | 277 |
| `pcl/runner.js` | 27 |
| `run.py` | 283 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 2096 |
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
| `pcl/__main__.py` | 384 |
| `pcl/control.py` | 953 |
| `pcl/core.py` | 1308 |
| `pcl/designer.py` | 400 |
| `pcl/formats.py` | 222 |
| `pcl/gui.py` | 338 |
| `pcl/impulse.py` | 858 |
| `pcl/lineconst.py` | 1016 |
| `pcl/link.py` | 135 |
| `pcl/network.py` | 1035 |
| `pcl/plotting.py` | 340 |
| `pcl/workbench.py` | 295 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 106 |
| `tests/test_batch.py` | 223 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_bus.py` | 145 |
| `tests/test_control.py` | 213 |
| `tests/test_derivation.py` | 93 |
| `tests/test_designer.py` | 94 |
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
| `tests/test_nn.py` | 118 |
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
| `tests/test_watch.py` | 87 |
| `tests/test_workbench.py` | 78 |
| `tests/js/batch_requests.js` | 105 |
| `tests/js/bus_cases.js` | 127 |
| `tests/js/cable_tutorial.js` | 10 |
| `tests/js/gen_cases.js` | 78 |
| `tests/js/library_cases.js` | 11 |
| `tests/js/line_cases.js` | 15 |
| `tests/js/live_cases.js` | 31 |
| `tests/js/netlib42_cases.js` | 50 |
| `tests/js/netlib_cases.js` | 93 |
| `tests/js/nn_cases.js` | 46 |
| `tests/js/sim_cases.js` | 356 |
| `tests/js/snapshot_cases.js` | 19 |
| `tests/js/sparse_cases.js` | 47 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/subcircuit_cases.js` | 87 |
| `tests/js/tutorial_cases.js` | 137 |
| `tests/js/units_cases.js` | 52 |
| `tests/js/watch_cases.js` | 41 |
| `tests/ui/addons_flow.js` | 126 |
| `tests/ui/blocks_flow.js` | 144 |
| `tests/ui/bus_flow.js` | 90 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/line_flow.js` | 64 |
| `tests/ui/live_flow.js` | 41 |
| `tests/ui/perf_flow.js` | 68 |
| `tests/ui/scenario_flow.js` | 70 |
| `tests/ui/speed_flow.js` | 104 |
| `tests/ui/step_flow.js` | 41 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/subcircuit_flow.js` | 79 |
| `tests/ui/ux_flow.js` | 87 |
| `tests/ui/watch_flow.js` | 95 |
| `tests/ui/wiring_flow.js` | 128 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 71 | `R` | Αντίσταση |
| 75 | `CPE` | CPE / Warburg |
| 81 | `L` | Πηνίο |
| 85 | `C` | Πυκνωτής |
| 89 | `VDC` | Πηγή DC / μπαταρία |
| 95 | `VAC` | Πηγή AC |
| 99 | `VAC3` | Τριφασική πηγή (Y) |
| 105 | `IDC` | Πηγή ρεύματος |
| 111 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 124 | `D` | Δίοδος |
| 128 | `SCR` | Θυρίστορ (SCR) |
| 139 | `XFMR` | Μετασχηματιστής |
| 147 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 160 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 173 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 183 | `KL` | Συζευγμένα πηνία (N×N) |
| 194 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 201 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 209 | `SG` | Σπινθηριστής (διάκενο) |
| 222 | `CPL` | Φορτίο σταθερής ισχύος |
| 226 | `SH` | Δειγματοληψία και συγκράτηση (S&H) |
| 235 | `GND` | Γείωση |
| 237 | `JUNC` | Κόμβος |
| 238 | `PWM` | PWM / έλεγχος |
| 260 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 271 | `VM` | Βολτόμετρο |
| 273 | `AM` | Αμπερόμετρο (σε σειρά) |
| 276 | `VP` | Probe τάσης (ως προς τη γη) |
| 278 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 280 | `MEAS` | Μέτρηση στοιχείου |
| 283 | `CONST` | Σταθερά / πρόγραμμα |
| 287 | `GAIN` | Κέρδος |
| 289 | `SUM` | Άθροισμα |
| 292 | `MUL` | Γινόμενο |
| 294 | `DIV` | Διαίρεση a/b |
| 297 | `SAT` | Κορεσμός |
| 300 | `CMP` | Συγκριτής |
| 303 | `LOGIC` | Λογική πύλη |
| 306 | `PIB` | PI διακριτός |
| 312 | `UD` | Καθυστέρηση z⁻¹ |
| 315 | `SR` | Μανδαλωτής SR (latch) |
| 318 | `CLK` | Ρολόι (τετραγωνικό) |
| 321 | `RAMP` | Φέρον / ράμπα |
| 326 | `EXPR` | Έκφραση |
| 330 | `PY` | Μπλοκ Python |
| 336 | `NN` | Νευρωνικό δίκτυο (MLP) |
| 399 | `MOD3` | Διαμορφωτής τριφασικός |
| 403 | `FEST` | Εκτιμητής ροής δρομέα |
| 407 | `INT` | Ολοκληρωτής |
| 411 | `LPF` | Βαθυπερατό 1ης τάξης |
| 415 | `F2` | Φίλτρο 2ης τάξης |
| 420 | `RLIM` | Όριο ρυθμού μεταβολής |
| 424 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 428 | `EDGE` | Ανιχνευτής ακμής |
| 432 | `CLARKE` | Clarke abc → αβ |
| 436 | `ICLARKE` | Clarke αβ → abc |
| 440 | `PARK` | Park αβ → dq |
| 443 | `IPARK` | Park dq → αβ |
| 446 | `PLL` | PLL (τριφασικό) |
| 452 | `TAGO` | Ετικέτα: προς (Goto) |
| 455 | `TAGI` | Ετικέτα: από (From) |
| 458 | `DISP` | Ένδειξη |
| 462 | `SUB` | Υποκύκλωμα |
| 465 | `PORT` | Θύρα (ηλεκτρική) |
| 468 | `SIN` | Θύρα εισόδου σήματος |
| 471 | `SOUT` | Θύρα εξόδου σήματος |
| 475 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 480 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 484 | `BSEL` | Επιλογή από δίαυλο |
| 487 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 493 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 504 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 512 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 520 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 531 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 576 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 589 | `TLM` | Γραμμή από γεωμετρία (CP / FD) |

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
| 458 | `synrm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μαγνητικής αντίστασης (SynRM): ευθυγράμμιση, έλεγχος dq, MTPA |
| 484 | `pmsm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μόνιμων μαγνητών (PMSM / IPMSM): i_d = 0 και MTPA |
| 500 | `srm` | Ηλεκτρική κίνηση (3.6) | Μηχανή μεταβλητής μαγνητικής αντίστασης (SRM 8/6): γωνίες, υστέρηση, βρόχος ψ–i |
| 531 | `lightning` | Κεραυνικά (3.5) | Κεραυνικό ρεύμα Heidler: 10/350, 1/200, 0,25/100 μs |
| 543 | `twave` | Υψηλές τάσεις (3.8) | Οδεύοντα κύματα: ανάκλαση σε ανοιχτό, βραχυκυκλωμένο ή ωμικό άκρο, διάγραμμα Bewley |
| 566 | `arrester` | Υψηλές τάσεις (3.9) | Αλεξικέραυνο: παραμένουσα τάση και απόσταση προστασίας |
| 582 | `marx` | Υψηλές τάσεις (3.10) | Γεννήτρια Marx: πολυβάθμια κρουστική γεννήτρια με σπινθηριστές |
| 612 | `chop` | Υψηλές τάσεις (3.10) | Αποκομμένη κρουστική τάση: σπινθηριστής αποκοπής |
| 646 | `hv153` | Υψηλές τάσεις (3.11) | Ασκήσεις 15.3: γεννήτριες κρουστικών τάσεων (βιβλίο, ακριβής λύση, προσομοίωση) |
| 667 | `lossline` | Υψηλές τάσεις (3.11) | Γραμμή με απώλειες: απόσβεση και παραμόρφωση οδεύοντος κύματος |
| 684 | `voltime` | Υψηλές τάσεις (3.11) | Καμπύλη τάσης–χρόνου διακένου (κριτήριο ενέργειας διάσπασης) |
| 700 | `hvdiv` | Υψηλές τάσεις (3.12) | Μέτρηση εναλλασσόμενης υψηλής τάσης: καταμεριστές (ασκήσεις 15.1.3, 15.1.5) |
| 717 | `schering` | Υψηλές τάσεις (3.12) | Γέφυρα Schering: χωρητικότητα και συντελεστής απωλειών (άσκηση 15.5.12) |
| 732 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 754 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 768 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 878 | `nn_compare` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Έλεγχος με νευρωνικό δίκτυο: σύγκριση |
| 884 | `nn_online` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Νευρωνικό που μαθαίνει αμέσως |
| 891 | `nn_gui` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Σύνθεση ελέγχου από Python: κάθε μηχανή, στόχοι με βάρη |
| 898 | `sub_legs` | Υποκυκλώματα (3.17) | Πολυφασικός buck από ένα υποκύκλωμα σκέλους |
| 931 | `bus_dq` | Δίαυλοι (3.18) | Βρόχος ρεύματος dq με διαύλους: τριφασικός μετατροπέας προς δίκτυο |
| 970 | `net_fault` | Δίκτυο (4.1) | Βραχυκύκλωμα σε δίκτυο: IEC 60909 και συμμετρικές συνιστώσες |
| 990 | `gen_sc` | Συστήματα ισχύος (4.3) | Τριφασικό βραχυκύκλωμα στα άκρα σύγχρονης γεννήτριας |
| 1006 | `fbm` | Συστήματα ισχύος (4.3) | IEEE First Benchmark Model: υποσύγχρονος συντονισμός (SSR) |
| 1031 | `ieee9_emt` | Συστήματα ισχύος (4.3) | IEEE 9 ζυγών σε EMT, από τη ροή φορτίου |
| 1057 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1078 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1096 | `empty` | Νέο | Κενό κύκλωμα |

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
| 67 | function | `onMessage` |

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
| 49 | function | `pyPage` |
| 53 | function | `runToEnd` |
| 56 | const fn | `chunk` |
| 58 | function | `loop` |
| 86 | function | `draw` |
| 88 | function | `setText` |
| 89 | function | `navRange` |
| 90 | function | `updateClock` |
| 94 | function | `liveOf` |
| 122 | function | `blkUnit` |
| 129 | function | `outsOf` |
| 131 | const fn | `vecN` |
| 133 | function | `chanLabel` |
| 141 | function | `addProbe` |
| 142 | function | `flash` |
| 143 | function | `signalsFor` |
| 157 | const fn | `fold` |
| 159 | function | `fillSignals` |
| 166 | function | `renderChannels` |
| 184 | function | `requestMeasure` |
| 185 | function | `renderMeasure` |
| 194 | function | `MeasureUnit` |
| 197 | function | `simKey` |
| 198 | function | `perSeries` |
| 199 | function | `refFor` |
| 200 | const fn | `sched` |
| 204 | function | `metricsFor` |
| 208 | function | `metricsRows` |
| 213 | function | `eventMetricsHTML` |
| 215 | function | `renderMetricsPanel` |
| 226 | function | `rawSeries` |
| 229 | function | `autoF1` |
| 233 | function | `evRows` |
| 235 | function | `renderEvents` |
| 237 | const fn | `fv` |
| 241 | function | `eventsCsv` |
| 243 | function | `renderFFT` |
| 265 | function | `cellZ` |
| 267 | function | `renderEISForm` |
| 268 | const fn | `opt` |
| 272 | function | `runEIS` |
| 280 | function | `drawEIS` |
| 299 | function | `perSamples` |
| 301 | function | `periodText` |
| 302 | const fn | `svgPlot` |
| 304 | function | `pcmMapFn` |
| 306 | const fn | `z` |
| 309 | function | `renderPoincare` |
| 325 | function | `bfParams` |
| 327 | function | `renderBifurcationForm` |
| 333 | function | `runBifurcation` |
| 347 | function | `stopBifurcation` |
| 348 | function | `drawBifurcation` |
| 358 | function | `niceTop` |
| 361 | function | `btStatus` |
| 362 | function | `parseStep` |
| 363 | function | `runBatch` |
| 379 | function | `clearBatch` |
| 381 | function | `meanPL` |
| 383 | function | `ringTrace` |
| 385 | function | `compareHTML` |
| 395 | function | `renderBatch` |
| 400 | function | `parseCSV` |
| 402 | const fn | `cells` |
| 403 | const fn | `num` |
| 409 | const fn | `normName` |
| 410 | function | `renderCsvMap` |
| 411 | const fn | `auto` |
| 417 | function | `applyCsv` |
| 422 | function | `renderCsv` |
| 424 | function | `clearCsv` |
| 426 | function | `sampleCompareHTML` |
| 440 | function | `liveChange` |
| 442 | function | `renderLiveLog` |
| 451 | function | `changesToSchedule` |
| 453 | const fn | `f` |
| 462 | function | `updateLivePanel` |
| 467 | function | `setLivePanel` |
| 470 | function | `switchesOf` |
| 473 | function | `addPulses` |
| 475 | function | `pulseKeys` |
| 476 | function | `refreshControls` |
| 479 | const fn | `phase` |
| 513 | const fn | `setD` |
| 529 | const fn | `setPh` |
| 541 | const fn | `pinNow` |
| 552 | const fn | `pinSet` |
| 564 | function | `pinMap` |
| 565 | function | `pinX` |
| 566 | function | `pinV` |
| 572 | function | `liveParam` |
| 587 | function | `closeInspector` |
| 588 | function | `placePopup` |
| 591 | function | `fieldValue` |
| 596 | function | `fieldHTML` |
| 610 | function | `placeAt` |
| 611 | function | `popupDrag` |
| 620 | function | `nnBlock` |
| 621 | function | `nnBox` |
| 624 | function | `nnLearned` |
| 625 | function | `openInspector` |
| 633 | const fn | `wired` |
| 642 | const fn | `same` |
| 643 | const fn | `apply` |
| 659 | const fn | `wireWidth` |
| 660 | function | `openWireInspector` |
| 676 | const fn | `numOf` |
| 682 | function | `psec` |
| 684 | function | `propsOpen` |
| 685 | function | `setProps` |
| 687 | function | `focusComp` |
| 688 | function | `togglePin` |
| 691 | function | `renderProps` |
| 700 | function | `propsComp` |
| 701 | const fn | `secOf` |
| 703 | const fn | `row` |
| 709 | const fn | `wired` |
| 723 | function | `propsJunc` |
| 725 | function | `propsWire` |
| 731 | function | `propsMulti` |
| 734 | function | `propsCircuit` |
| 744 | const fn | `opt` |
| 754 | const fn | `sv` |
| 760 | const fn | `chk` |
| 771 | function | `bindProps` |
| 802 | function | `diagItems` |
| 811 | function | `renderDiag` |
| 822 | function | `openDiag` |
| 823 | function | `flashComp` |
| 829 | function | `scheduleStepCheck` |
| 830 | function | `runStepCheck` |
| 831 | const fn | `inPage` |
| 838 | function | `syncStepMode` |
| 900 | function | `scenSetCode` |
| 901 | function | `scenState` |
| 902 | function | `scenTab` |
| 903 | function | `scenOut` |
| 904 | function | `scenWorker` |
| 906 | function | `scenRun` |
| 914 | function | `scenStop` |
| 915 | function | `scenDone` |
| 917 | function | `scenMsg` |
| 932 | function | `scenBatch` |
| 937 | function | `scenEval` |
| 940 | function | `addonDock` |
| 943 | function | `renderAddons` |
| 944 | const fn | `vsel` |
| 958 | function | `knockToast` |
| 961 | function | `initAddons` |
| 968 | function | `scenBatchWrite` |
| 971 | function | `renderScenFiles` |
| 974 | const fn | `scenNum` |
| 975 | function | `scenTable` |
| 976 | function | `scenShow` |
| 989 | function | `scenTicks` |
| 990 | function | `scenPlot` |
| 994 | const fn | `thin` |
| 1001 | const fn | `dig` |
| 1012 | function | `initScenarios` |
| 1019 | function | `liveApply` |
| 1022 | function | `closeMenu` |
| 1023 | function | `openMenu` |
| 1042 | function | `updateHover` |
| 1060 | const fn | `atTop` |
| 1061 | function | `topDoc` |
| 1062 | function | `defsOf` |
| 1063 | const fn | `pid` |
| 1064 | function | `fullDoc` |
| 1066 | function | `commitView` |
| 1068 | function | `viewDiag` |
| 1069 | const fn | `rel` |
| 1072 | function | `compAt` |
| 1077 | function | `allComps` |
| 1078 | const fn | `walk` |
| 1084 | function | `partDef` |
| 1086 | function | `pdefaults` |
| 1087 | function | `subParams` |
| 1089 | function | `placeOk` |
| 1091 | function | `renameChannels` |
| 1093 | function | `levelDoc` |
| 1094 | function | `applyLevel` |
| 1095 | function | `groupSel` |
| 1100 | function | `expandSub` |
| 1103 | function | `uniqueSub` |
| 1104 | function | `subMenu` |
| 1108 | function | `enterSub` |
| 1114 | function | `leaveSub` |
| 1120 | function | `renderCrumbs` |
| 1128 | function | `curDef` |
| 1129 | function | `publicOf` |
| 1130 | function | `togglePublic` |
| 1138 | function | `propsSub` |
| 1146 | function | `bindSub` |
| 1154 | function | `propsDef` |
| 1169 | function | `bindDef` |
| 1185 | function | `exportDef` |
| 1187 | function | `importDefs` |
| 1198 | function | `palLoad` |
| 1199 | function | `palSave` |
| 1200 | function | `palRecent` |
| 1201 | function | `palItem` |
| 1205 | function | `renderPalette` |
| 1213 | const fn | `isOpen` |
| 1227 | function | `tutorial` |
| 1230 | function | `circuitSig` |
| 1240 | function | `tutorialRef` |
| 1241 | function | `theoryValidity` |
| 1247 | function | `staleBanner` |
| 1250 | function | `bindRestore` |
| 1251 | function | `loadTutorial` |
| 1256 | function | `migrateFile` |
| 1259 | function | `applyProject` |
| 1269 | function | `renderTutorial` |
| 1279 | function | `gallery` |
| 1285 | function | `api` |
| 1286 | function | `paramsOf` |
| 1287 | function | `avgOver` |
| 1290 | function | `simValue` |
| 1296 | function | `lastPP` |
| 1298 | function | `runTheory` |
| 1311 | function | `cmpRows` |
| 1312 | function | `stepsHTML` |
| 1313 | function | `renderTheory` |
| 1345 | function | `rippleDev` |
| 1347 | function | `periodAvgAt` |
| 1349 | function | `samplingTheory` |
| 1358 | const fn | `lastAt` |
| 1380 | function | `polyTheory` |
| 1387 | const fn | `frac` |
| 1416 | function | `lastPeriods` |
| 1417 | function | `evalOrderHTML` |
| 1426 | function | `genScTheory` |
| 1428 | const fn | `Iac` |
| 1436 | function | `shaftModes` |
| 1443 | function | `fbmTheory` |
| 1451 | function | `ieee9Theory` |
| 1458 | function | `lineFdTheory` |
| 1459 | const fn | `lab` |
| 1467 | const fn | `pk` |
| 1472 | function | `netFaultTheory` |
| 1485 | function | `busDqTheory` |
| 1493 | function | `subLegsTheory` |
| 1502 | function | `blocksTheory` |
| 1517 | function | `pcmTheory` |
| 1543 | function | `codeTheory` |
| 1553 | function | `eisTheory` |
| 1555 | const fn | `ser` |
| 1568 | function | `imSteady` |
| 1571 | function | `imPar` |
| 1572 | function | `phaseRms` |
| 1573 | function | `vfTheory` |
| 1586 | function | `focTheory` |
| 1603 | function | `synTheory` |
| 1622 | const fn | `need` |
| 1642 | function | `pmTheory` |
| 1644 | const fn | `mtpa` |
| 1660 | function | `srmTheory` |
| 1675 | const fn | `curve` |
| 1686 | function | `lgTheory` |
| 1697 | const fn | `cr` |
| 1704 | function | `chaosTheory` |
| 1719 | function | `nnCycles` |
| 1721 | function | `nnTheory` |
| 1738 | function | `nnGuiCode` |
| 1744 | function | `runNNCompare` |
| 1752 | function | `dcDriveTheory` |
| 1753 | const fn | `per` |
| 1754 | const fn | `cross` |
| 1784 | function | `twModel` |
| 1787 | const fn | `g` |
| 1790 | function | `twLattice` |
| 1797 | const fn | `marks` |
| 1800 | function | `twTheory` |
| 1808 | const fn | `at` |
| 1825 | function | `arTheory` |
| 1845 | function | `impulseMeasure` |
| 1847 | const fn | `cross` |
| 1850 | function | `marxTheory` |
| 1868 | function | `chopModel` |
| 1871 | const fn | `f` |
| 1874 | function | `chopTheory` |
| 1888 | function | `cmp3` |
| 1892 | function | `hvExact` |
| 1893 | function | `hv153Theory` |
| 1919 | function | `besI1e` |
| 1921 | function | `heaviside` |
| 1923 | function | `lossTheory` |
| 1942 | function | `vtBreak` |
| 1943 | function | `vtTheory` |
| 1963 | function | `hvdivTheory` |
| 1965 | const fn | `r` |
| 1977 | function | `scheringTheory` |
| 1978 | const fn | `inv` |
| 1987 | const fn | `sr` |
| 1993 | function | `formulaTheory` |
| 2070 | function | `nodeAvg` |
| 2076 | function | `circuitForMath` |
| 2108 | function | `scheduleMath` |
| 2109 | function | `batteryKey` |
| 2111 | function | `mathChoices` |
| 2112 | const fn | `prim` |
| 2114 | function | `renderMathChoices` |
| 2116 | function | `runTemplate` |
| 2122 | function | `runMath` |
| 2144 | function | `saveLocal` |
| 2145 | function | `saveLocalSoon` |
| 2147 | function | `download` |
| 2148 | function | `exportCSV` |
| 2154 | function | `syncScopeInputs` |
| 2155 | function | `setSpeed` |
| 2158 | function | `openSettings` |
| 2159 | const fn | `sel` |
| 2160 | const fn | `chk` |
| 2181 | function | `boot` |
| 2230 | const fn | `mv` |
| 2231 | const fn | `up` |
| 2232 | const fn | `navOpen` |
| 2243 | const fn | `probeSel` |
| 2305 | function | `renderTheoryLive` |

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
| 66 | method | `comp` |
| 68 | method | `wire` |
| 71 | method | `busy` |
| 72 | method | `newId` |
| 73 | method | `pin` |
| 74 | method | `wirePts` |
| 75 | method | `setWirePts` |
| 76 | method | `snapshot` |
| 79 | method | `remember` |
| 81 | method | `undo` |
| 82 | method | `redo` |
| 83 | method | `cleanSel` |
| 84 | method | `load` |
| 93 | method | `export` |
| 95 | method | `replaceDoc` |
| 99 | method | `changed` |
| 100 | method | `selection` |
| 101 | method | `select` |
| 102 | method | `addPart` |
| 108 | method | `setParams` |
| 112 | method | `dropDangling` |
| 114 | method | `netKinds` |
| 120 | method | `setProgram` |
| 121 | method | `setSolve` |
| 123 | method | `setDiag` |
| 124 | method | `renderDiag` |
| 126 | method | `kindsOk` |
| 127 | method | `wiresAt` |
| 148 | method | `autoConnect` |
| 165 | method | `insertSeries` |
| 166 | const fn | `pos` |
| 171 | method | `setWireTool` |
| 172 | method | `startFreeWire` |
| 173 | method | `newJunction` |
| 175 | method | `finishFree` |
| 180 | method | `setWireProps` |
| 181 | method | `deleteSel` |
| 187 | method | `tidyJunctions` |
| 197 | method | `rotateSel` |
| 199 | method | `mirrorSel` |
| 201 | method | `captureWires` |
| 202 | method | `refitWires` |
| 203 | method | `copySel` |
| 204 | method | `paste` |
| 214 | method | `astar` |
| 222 | const fn | `idx` |
| 224 | const fn | `dirIndex` |
| 227 | const fn | `h` |
| 241 | method | `simpleRoute` |
| 244 | method | `route` |
| 248 | method | `adjustEnd` |
| 256 | method | `areaSize` |
| 263 | method | `requestView` |
| 264 | method | `viewFrame` |
| 271 | method | `applyView` |
| 280 | method | `gridBg` |
| 289 | method | `fit` |
| 291 | method | `extent` |
| 296 | method | `render` |
| 298 | method | `partEls` |
| 299 | method | `partSVG` |
| 305 | method | `renderPart` |
| 306 | method | `valueText` |
| 340 | method | `renderLabels` |
| 345 | const fn | `at` |
| 349 | method | `renderWires` |
| 363 | method | `wireSVG` |
| 374 | method | `redrawWire` |
| 375 | method | `pathD` |
| 380 | method | `segDir` |
| 381 | method | `midLabel` |
| 382 | method | `renderPins` |
| 392 | method | `renderSel` |
| 394 | method | `setLive` |
| 396 | method | `updateLive` |
| 405 | method | `drawArrows` |
| 416 | method | `world` |
| 418 | method | `hitAt` |
| 419 | method | `hitOf` |
| 421 | method | `down` |
| 447 | method | `move` |
| 460 | method | `up` |
| 474 | method | `cancelDrag` |
| 475 | method | `hoverPin` |
| 477 | method | `dbl` |
| 478 | method | `menu` |
| 481 | method | `worldNow` |
| 482 | method | `wheel` |
| 489 | method | `letter` |
| 490 | method | `key` |
| 514 | method | `beginDrag` |
| 525 | method | `dragMove` |
| 537 | method | `endDrag` |
| 547 | method | `bakeMove` |
| 552 | method | `dragSeg` |
| 555 | const fn | `stub` |
| 564 | method | `drawMarquee` |
| 567 | method | `marqueeSelect` |
| 570 | const fn | `inside` |
| 577 | method | `escape` |
| 580 | method | `beginPlace` |
| 581 | method | `ghost` |
| 583 | method | `finishPlace` |
| 584 | method | `cancelPlace` |
| 586 | method | `startWire` |
| 587 | method | `startWireFrom` |
| 588 | method | `previewWire` |
| 597 | method | `wireClick` |
| 603 | method | `orthoNext` |
| 604 | method | `finishWire` |
| 620 | method | `cancelWire` |
| 622 | method | `splitWire` |
| 632 | method | `wireNetPin` |
| 634 | method | `canScroll` |

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
| 29 | function | `worker` |
| 37 | const fn | `share` |
| 38 | function | `shareRec` |
| 41 | function | `apply` |
| 52 | function | `send` |
| 53 | function | `flush` |
| 56 | function | `sameKeys` |
| 57 | function | `wrap` |
| 61 | function | `unwrap` |

### `web/studio/live_worker.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 23 | function | `python` |
| 30 | const fn | `later` |
| 32 | function | `final` |
| 35 | function | `finish` |
| 38 | function | `tick` |
| 46 | function | `loop` |
| 58 | function | `start` |
| 71 | const fn | `startErr` |
| 85 | function | `apply` |
| 86 | const fn | `one` |

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
| 30 | function | `nnBuild` |
| 42 | function | `nnStep` |
| 50 | const fn | `schedAt` |
| 51 | const fn | `num` |
| 53 | const fn | `numList` |
| 65 | function | `b64of` |
| 67 | function | `fromB64` |
| 70 | function | `snapEncode` |
| 71 | const fn | `num` |
| 72 | function | `enc` |
| 82 | function | `snapRestore` |
| 83 | function | `dec` |
| 94 | function | `smPort` |
| 98 | function | `smOut` |
| 102 | const fn | `genCopy` |
| 104 | function | `csolve` |
| 122 | function | `acInit` |
| 129 | const fn | `ad` |
| 130 | const fn | `y` |
| 162 | const fn | `seq` |
| 174 | const fn | `dad` |
| 197 | class | `NetlistError` |
| 202 | function | `dePiece` |
| 204 | const fn | `F` |
| 205 | function | `deInt` |
| 207 | function | `deFrac` |
| 210 | function | `tlElement` |
| 217 | function | `tlmElement` |
| 227 | function | `rcCoef` |
| 229 | function | `buildNetlist` |
| 239 | const fn | `union` |
| 254 | const fn | `nm` |
| 273 | const fn | `sn` |
| 277 | const fn | `isJ` |
| 297 | const fn | `lbl` |
| 302 | const fn | `node` |
| 303 | const fn | `internal` |
| 306 | const fn | `mkBlock` |
| 313 | const fn | `add` |
| 314 | const fn | `series` |
| 510 | function | `compileSignals` |
| 541 | function | `f2Phi` |
| 546 | function | `cmpF` |
| 550 | function | `stampM` |
| 552 | function | `luFactor` |
| 558 | function | `luSolve` |
| 565 | class | `Sim` |
| 566 | method | `constructor` |
| 568 | method | `basePeriod` |
| 572 | method | `tlMaxStep` |
| 573 | method | `setStep` |
| 576 | method | `stIndex` |
| 589 | method | `stVec` |
| 590 | method | `stepCfg` |
| 591 | method | `varSetup` |
| 594 | method | `setStepMode` |
| 596 | method | `hGrid` |
| 600 | method | `modeCap` |
| 604 | method | `swEls` |
| 605 | method | `topoKey` |
| 606 | method | `topoInfo` |
| 615 | method | `topoCheck` |
| 632 | method | `lteReset` |
| 633 | method | `ltePush` |
| 637 | method | `lteErr` |
| 647 | method | `varCheck` |
| 662 | method | `note` |
| 665 | method | `stepCheck` |
| 666 | method | `diagnostics` |
| 669 | method | `ringCheck` |
| 678 | method | `stateMap` |
| 680 | method | `stateMap0` |
| 691 | method | `load` |
| 734 | method | `reset` |
| 737 | method | `imStep` |
| 744 | method | `smStep` |
| 746 | method | `srmStep` |
| 747 | method | `srmOutputs` |
| 748 | method | `smOutputs` |
| 752 | method | `genStep` |
| 759 | method | `genOutputs` |
| 764 | method | `genTm` |
| 765 | method | `genEfd` |
| 766 | method | `imSources` |
| 767 | method | `pyBlocks` |
| 777 | method | `pyLazy` |
| 779 | method | `pyUpgrade` |
| 781 | method | `setMethod` |
| 782 | method | `setControl` |
| 784 | method | `setBlock` |
| 786 | method | `setHold` |
| 788 | method | `markChange` |
| 793 | method | `progInit` |
| 794 | method | `addProgram` |
| 796 | method | `progNext` |
| 797 | method | `progDue` |
| 798 | method | `progApply` |
| 813 | method | `evInit` |
| 814 | method | `logEv` |
| 816 | method | `events` |
| 818 | method | `evSwitches` |
| 820 | method | `channelKeys` |
| 838 | method | `allocRecord` |
| 842 | const fn | `A` |
| 848 | method | `V` |
| 849 | method | `elCurrent` |
| 853 | method | `portI` |
| 855 | method | `computeVals` |
| 881 | method | `recordNow` |
| 889 | method | `closePeriod` |
| 898 | method | `lastPeriod` |
| 899 | method | `now` |
| 904 | method | `gateOf` |
| 910 | method | `rawGate` |
| 921 | method | `carrier` |
| 924 | method | `shGrid` |
| 925 | method | `shNext` |
| 927 | method | `sampleHolds` |
| 932 | method | `samples` |
| 933 | method | `ctrlEdges` |
| 939 | method | `scrU` |
| 940 | method | `scrGate` |
| 941 | method | `scrEdges` |
| 942 | method | `setFiring` |
| 943 | method | `compV` |
| 944 | method | `compI` |
| 946 | method | `dbl` |
| 947 | method | `sampleControllers` |
| 976 | method | `evalBlocks` |
| 1053 | method | `blkDue` |
| 1055 | method | `zcFrac` |
| 1058 | method | `saveState` |
| 1060 | method | `restoreState` |
| 1066 | method | `snapshot` |
| 1067 | method | `restoreSnapshot` |
| 1069 | method | `gateSigPeek` |
| 1072 | method | `gateSig` |
| 1077 | method | `jumpScheds` |
| 1084 | method | `jumpAt` |
| 1085 | method | `values` |
| 1107 | method | `assemble` |
| 1114 | const fn | `g` |
| 1137 | method | `rhs` |
| 1139 | const fn | `J` |
| 1157 | method | `cplLinearize` |
| 1161 | method | `factor` |
| 1167 | method | `spAssemble` |
| 1174 | method | `solveOnce` |
| 1183 | method | `solve` |
| 1197 | method | `nlLinearize` |
| 1200 | method | `check` |
| 1216 | method | `commit` |
| 1237 | method | `initialSolve` |
| 1249 | method | `tlSources` |
| 1253 | method | `tlRecord` |
| 1259 | method | `tlHist` |
| 1265 | method | `tlmG` |
| 1269 | method | `tlmSources` |
| 1281 | method | `tlmRecord` |
| 1294 | method | `tlmHist` |
| 1301 | method | `step` |
| 1303 | const fn | `gs` |
| 1309 | method | `stepCore` |
| 1363 | method | `edgeSolve` |
| 1366 | method | `edgePoint` |
| 1367 | method | `nextEvent` |
| 1373 | const fn | `sch` |
| 1395 | method | `spwmCut` |
| 1398 | const fn | `sig` |
| 1403 | method | `run` |
| 1445 | function | `exportForBatch` |
| 1460 | const fn | `ci` |
| 1461 | const fn | `vd` |
| 1462 | const fn | `V` |
| 1463 | const fn | `I` |
| 1464 | const fn | `portRec` |
| 1465 | const fn | `rec` |
| 1481 | const fn | `clkOf` |
| 1507 | function | `sweepPoint` |
| 1512 | function | `setPath` |
| 1518 | function | `eisPoint` |
| 1526 | function | `resume` |

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

### `web/studio/nn.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 16 | function | `rng` |
| 17 | function | `gauss` |
| 18 | function | `init` |
| 23 | function | `fwd` |
| 29 | function | `count` |
| 30 | function | `learn` |
| 36 | const fn | `step` |
| 39 | function | `jac` |
| 43 | function | `optState` |
| 45 | function | `sizesOf` |
| 46 | function | `parse` |
| 54 | function | `text` |

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
| 31 | const fn | `nnIns` |
| 32 | const fn | `codeDraw` |
| 35 | const fn | `CLOCK` |
| 41 | function | `subLayout` |
| 43 | const fn | `len` |
| 49 | function | `subDraw` |
| 604 | function | `defaults` |
| 606 | function | `elPins` |
| 607 | function | `sigPins` |
| 608 | function | `pinsOf` |
| 611 | function | `parseMat` |
| 613 | function | `nPorts` |
| 614 | function | `portY` |
| 615 | function | `portPins` |
| 616 | function | `portBox` |
| 618 | function | `posDef` |
| 620 | function | `symmetric` |
| 621 | function | `matInv` |
| 626 | function | `klMatrix` |
| 637 | function | `kgMatrix` |
| 645 | function | `srmGeo` |
| 647 | function | `srmSpins` |
| 649 | function | `srmPins` |
| 651 | function | `satD` |
| 652 | function | `satDinv` |
| 654 | function | `genSpins` |
| 665 | function | `genTsc` |
| 670 | function | `genCirc2` |
| 671 | const fn | `Fn` |
| 679 | function | `genAxis` |
| 687 | const fn | `classic` |
| 693 | const fn | `plist` |
| 697 | function | `genModel` |
| 703 | const fn | `w` |
| 712 | const fn | `grp` |
| 729 | function | `genGamma` |
| 737 | function | `genDQ` |
| 741 | function | `genSteady` |
| 743 | const fn | `rot` |
| 750 | function | `srmAlignedPsi` |
| 751 | function | `srmModelPsi` |
| 752 | function | `srmTableText` |
| 755 | function | `srmMag` |
| 771 | function | `chkMag` |
| 773 | function | `srmA` |
| 776 | function | `seg` |
| 777 | function | `srmPsi` |
| 779 | function | `srmCur` |
| 781 | function | `srmTorque` |
| 784 | function | `srmCoenergy` |
| 788 | function | `waveShape` |
| 789 | function | `waveAt` |
| 792 | function | `waveMeasure` |
| 795 | const fn | `cross` |
| 801 | function | `waveFit` |
| 802 | const fn | `res` |
| 813 | function | `directWave` |
| 816 | function | `impulseWave` |
| 826 | function | `bewley` |
| 829 | const fn | `at` |
| 835 | function | `movChar` |
| 840 | const fn | `pick` |
| 841 | const fn | `cur` |
| 842 | const fn | `inv` |
| 846 | function | `impulseDesign` |
| 851 | function | `impulseRoots` |
| 854 | function | `tlParams` |
| 863 | function | `tlmData` |
| 865 | function | `tlmM` |
| 867 | function | `tlmPin` |
| 868 | function | `tlmPins` |
| 870 | function | `tlmKey` |
| 873 | function | `tlmModel` |
| 880 | function | `lightningWave` |
| 887 | function | `pinKind` |
| 898 | function | `structural` |
| 905 | function | `pinWidth` |
| 908 | function | `xf` |
| 909 | function | `pinPos` |
| 911 | function | `pinDir` |
| 916 | function | `cpeParams` |
| 917 | function | `cpeBank` |
| 921 | function | `cpeZ` |
| 922 | function | `cpeZbank` |
| 923 | function | `boxOf` |
| 924 | function | `bbox` |
| 929 | function | `fmtNum` |
| 933 | function | `eng` |
| 937 | function | `parseEng` |
| 940 | function | `parseSched` |
| 948 | function | `machines` |

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
| 59 | function | `pyMessage` |
| 62 | method | `load` |
| 72 | method | `attach` |
| 75 | method | `make` |
| 84 | method | `stub` |
| 85 | method | `getState` |

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
| 138 | function | `bifPoint` |
| 139 | function | `bifSpec` |
| 143 | function | `bifurcation` |
| 147 | const fn | `json` |

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
| 33 | method | `requestDraw` |
| 35 | method | `colors` |
| 37 | method | `setRefs` |
| 38 | method | `refRange` |
| 41 | method | `nav` |
| 42 | const fn | `clamp` |
| 53 | method | `resize` |
| 56 | method | `unitOf` |
| 60 | method | `resolve` |
| 61 | method | `channels` |
| 62 | method | `addChannel` |
| 65 | method | `removeChannel` |
| 66 | method | `moveChannel` |
| 68 | method | `windowSec` |
| 69 | method | `viewRange` |
| 71 | method | `ringIndex` |
| 72 | method | `ringStart` |
| 74 | method | `eachRaw` |
| 77 | method | `rawCount` |
| 78 | method | `eachPeriod` |
| 79 | method | `valueAt` |
| 82 | method | `stats` |
| 87 | method | `usePeriods` |
| 89 | method | `panTo` |
| 90 | method | `zoomAt` |
| 92 | method | `cursorAt` |
| 94 | method | `plotW` |
| 95 | method | `drawSamples` |
| 99 | method | `draw` |
| 127 | const fn | `Y` |
| 150 | const fn | `flush` |

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
| 435 | const fn | `r4` |
| 439 | function | `smFoc` |
| 465 | method | `build` |
| 489 | method | `build` |
| 505 | method | `build` |
| 535 | method | `build` |
| 551 | method | `build` |
| 572 | method | `build` |
| 588 | method | `build` |
| 599 | function | `marxCircuit` |
| 618 | method | `build` |
| 650 | method | `build` |
| 657 | const fn | `down` |
| 674 | method | `build` |
| 691 | method | `build` |
| 704 | method | `build` |
| 721 | method | `build` |
| 738 | method | `build` |
| 758 | method | `build` |
| 773 | method | `build` |
| 819 | function | `nnSched` |
| 820 | function | `nnDrive` |
| 883 | method | `build` |
| 890 | method | `build` |
| 895 | method | `build` |
| 904 | method | `build` |
| 914 | const fn | `y` |
| 937 | method | `build` |
| 938 | const fn | `ws` |
| 977 | method | `build` |
| 995 | method | `build` |
| 1003 | function | `fbmPoint` |
| 1010 | method | `build` |
| 1035 | method | `build` |
| 1037 | const fn | `GD` |
| 1038 | const fn | `L` |
| 1039 | const fn | `G` |
| 1040 | const fn | `Ld` |
| 1054 | const fn | `LM` |
| 1055 | function | `tlmPart` |
| 1062 | method | `build` |
| 1064 | const fn | `rig` |
| 1083 | method | `build` |
| 1085 | const fn | `rig` |
| 1097 | method | `build` |

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
| 105 | function | `expect` |
| 119 | function | `infer` |
| 124 | const fn | `kind` |
| 125 | const fn | `lab` |
| 129 | const fn | `same` |
| 147 | const fn | `out` |
| 151 | class | `UnitError` |
| 152 | function | `check` |

### `web/studio/watch.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 18 | const fn | `esc` |
| 19 | const fn | `num` |
| 28 | function | `norm` |
| 43 | function | `parseStep` |
| 49 | const fn | `applyStep` |
| 52 | function | `satOf` |
| 59 | function | `envelope` |
| 64 | function | `points` |
| 65 | const fn | `Y` |
| 71 | function | `sliderMap` |
| 73 | const fn | `toX` |
| 74 | const fn | `fromX` |
| 79 | const fn | `C` |
| 82 | function | `layout` |
| 84 | function | `newTile` |
| 86 | function | `info` |
| 98 | function | `sampleText` |
| 104 | function | `placeOf` |
| 111 | function | `tileHTML` |
| 122 | function | `bindRefs` |
| 126 | function | `tableHTML` |
| 130 | function | `panelEl` |
| 137 | const fn | `mv` |
| 138 | const fn | `up` |
| 148 | function | `controls` |
| 154 | function | `suggest` |
| 164 | function | `addSug` |
| 170 | function | `tileOf` |
| 171 | function | `bindEvents` |
| 186 | function | `cur` |
| 190 | function | `setNum` |
| 191 | const fn | `go` |
| 194 | function | `showNum` |
| 201 | function | `dragTile` |
| 203 | const fn | `mv` |
| 204 | const fn | `up` |
| 231 | const fn | `setT` |
| 232 | function | `flag` |
| 235 | function | `valueOf` |
| 250 | function | `spark` |
| 256 | const fn | `raw` |
| 259 | const fn | `perIt` |

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
| 290 | function | `_nn_fwd` |
| 306 | function | `_nn_learn` |
| 349 | function | `_nn_jac` |
| 368 | function | `_nn_step` |
| 390 | function | `make_python_block` |
| 421 | class | `Circuit` |
| 422 | method | `Circuit.__init__` |
| 638 | method | `Circuit.R` |
| 641 | method | `Circuit.im_e` |
| 650 | method | `Circuit.im_deriv` |
| 663 | method | `Circuit.sm_cur` |
| 675 | method | `Circuit.sm_ports` |
| 680 | method | `Circuit.sm_deriv` |
| 695 | method | `Circuit.srm_A` |
| 700 | method | `Circuit._seg` |
| 704 | method | `Circuit.srm_cur` |
| 711 | method | `Circuit.srm_torque` |
| 720 | method | `Circuit.srm_currents` |
| 725 | method | `Circuit.srm_deriv` |
| 738 | method | `Circuit.gen_cur` |
| 755 | method | `Circuit.gen_efd` |
| 762 | method | `Circuit.gen_tm` |
| 769 | method | `Circuit.gen_deriv` |
| 787 | method | `Circuit.gen_out` |
| 806 | method | `Circuit.Vsrc` |
| 822 | method | `Circuit.topo` |
| 832 | method | `Circuit.build` |
| 929 | method | `Circuit.bsrc` |
| 969 | method | `Circuit.solve_z` |
| 995 | method | `Circuit.solve_nl` |
| 1037 | method | `Circuit.tl_hist` |
| 1054 | method | `Circuit.tl_sec` |
| 1061 | method | `Circuit.tl_ih` |
| 1065 | method | `Circuit.tl_record` |
| 1084 | method | `Circuit.scr_u` |
| 1088 | method | `Circuit.scr_gate` |
| 1092 | method | `Circuit.scr_edges` |
| 1099 | method | `Circuit.gate_state` |
| 1112 | method | `Circuit.set_gates` |
| 1120 | method | `Circuit.may_turn_on` |
| 1124 | method | `Circuit.tolerances` |
| 1130 | method | `Circuit.consistent` |
| 1172 | method | `Circuit.value` |
| 1208 | method | `Circuit.current` |
| 1251 | method | `Circuit.prime` |
| 1261 | method | `Circuit.sig_in` |
| 1265 | method | `Circuit.sh_grid` |
| 1277 | method | `Circuit.sh_next` |
| 1284 | method | `Circuit.log_ev` |
| 1290 | method | `Circuit.ev_switches` |
| 1299 | method | `Circuit.sh_sample` |
| 1319 | method | `Circuit.sample` |
| 1380 | method | `Circuit.cmp_f` |
| 1386 | method | `Circuit.blk_due` |
| 1397 | method | `Circuit.eval_blocks` |
| 1685 | method | `Circuit.block_events` |
| 1714 | method | `Circuit.next_event` |
| 1781 | function | `_decimate` |
| 1798 | function | `_diagnose` |
| 1849 | function | `simulate` |
| 2090 | function | `batch_sim` |

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
| 242 | function | `_mulberry32` |
| 254 | function | `nn_init` |
| 274 | function | `nn_text` |
| 282 | function | `nn_block` |
| 298 | function | `inv_nn_code` |
| 303 | function | `rl_code` |
| 312 | function | `_num` |
| 321 | function | `_bbox` |
| 327 | function | `compose` |
| 460 | function | `metrics` |
| 478 | function | `rl_theta0` |
| 484 | function | `_project_data` |
| 488 | function | `_chan` |
| 497 | class | `_Runner` |
| 501 | method | `_Runner.__init__` |
| 509 | method | `_Runner._one` |
| 520 | method | `_Runner.map` |
| 541 | method | `_Runner.close` |
| 547 | function | `_query` |
| 557 | function | `_samples` |
| 573 | function | `_program` |
| 582 | function | `_ref_range` |
| 598 | class | `InverseTrainer` |
| 616 | method | `InverseTrainer.__init__` |
| 638 | method | `InverseTrainer.to_dict` |
| 644 | method | `InverseTrainer.from_dict` |
| 654 | method | `InverseTrainer.status` |
| 658 | method | `InverseTrainer.excite` |
| 709 | method | `InverseTrainer._xy` |
| 714 | method | `InverseTrainer.emulator` |
| 730 | method | `InverseTrainer.controller` |
| 746 | method | `InverseTrainer.nets` |
| 749 | method | `InverseTrainer.ctrl_spec` |
| 756 | method | `InverseTrainer.online` |
| 768 | method | `InverseTrainer.run_all` |
| 781 | class | `RLTrainer` |
| 789 | method | `RLTrainer.__init__` |
| 808 | method | `RLTrainer.to_dict` |
| 813 | method | `RLTrainer.from_dict` |
| 819 | method | `RLTrainer.ctrl_spec` |
| 826 | method | `RLTrainer.project` |
| 834 | method | `RLTrainer._queries` |
| 850 | method | `RLTrainer._scores` |
| 866 | method | `RLTrainer._J` |
| 874 | method | `RLTrainer.iterate` |
| 921 | function | `compare` |

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
| 166 | function | `machines` |
| 172 | function | `tutorials` |
| 177 | function | `tutorial` |
| 182 | function | `load` |
| 195 | function | `use` |
| 202 | function | `current` |
| 209 | function | `set` |
| 213 | function | `get` |
| 217 | function | `run` |
| 221 | function | `sweep` |
| 225 | function | `params` |
| 229 | function | `bifurcation` |
| 233 | class | `Plot` |
| 237 | function | `plot` |
| 246 | function | `show` |
| 299 | function | `_open` |
| 315 | function | `_pairs` |
| 333 | function | `_clean` |
| 344 | function | `job` |
| 383 | function | `_inner_parts` |
| 413 | function | `_sub_parts` |
| 433 | class | `Project` |
| 436 | method | `Project.__init__` |
| 442 | method | `Project.comp` |
| 449 | method | `Project.get` |
| 457 | method | `Project.set` |
| 481 | method | `Project.copy` |
| 486 | method | `Project.save` |
| 489 | method | `Project.hash` |
| 493 | method | `Project.params` |
| 497 | method | `Project.channels` |
| 502 | method | `Project._settings` |
| 513 | method | `Project.run` |
| 546 | method | `Project.stream` |
| 627 | method | `Project._result` |
| 634 | method | `Project._query` |
| 646 | method | `Project._run_scipy` |
| 679 | method | `Project.sweep` |
| 753 | method | `Project._sweep_meta` |
| 758 | method | `Project.bifurcation` |
| 815 | class | `_SweepFile` |
| 820 | method | `_SweepFile.__init__` |
| 834 | method | `_SweepFile._val` |
| 842 | method | `_SweepFile._read` |
| 861 | method | `_SweepFile._line` |
| 865 | method | `_SweepFile.add` |
| 869 | method | `_SweepFile.close` |
| 875 | function | `_sweep_point` |
| 883 | function | `_as_list` |
| 893 | function | `_spec` |
| 909 | function | `_measures` |
| 932 | function | `_base_T` |
| 939 | function | `_unit` |
| 943 | function | `_matname` |
| 948 | class | `Result` |
| 951 | method | `Result.__init__` |
| 961 | method | `Result.__getitem__` |
| 964 | method | `Result.__repr__` |
| 967 | method | `Result.events_csv` |
| 978 | method | `Result.measure` |
| 1038 | method | `Result.frame` |
| 1047 | method | `Result._meta_lines` |
| 1051 | method | `Result.to_csv` |
| 1064 | method | `Result._vars` |
| 1074 | method | `Result.as_dict` |
| 1078 | method | `Result.to_json` |
| 1082 | method | `Result.to_mat` |
| 1093 | method | `Result.to_parquet` |
| 1101 | method | `Result.to_hdf5` |
| 1107 | method | `Result.save` |
| 1111 | function | `_save` |
| 1118 | class | `SweepResult` |
| 1121 | method | `SweepResult.__init__` |
| 1127 | method | `SweepResult.__repr__` |
| 1130 | method | `SweepResult.column` |
| 1133 | method | `SweepResult.frame` |
| 1140 | method | `SweepResult.to_csv` |
| 1152 | method | `SweepResult.to_json` |
| 1156 | method | `SweepResult.to_mat` |
| 1163 | method | `SweepResult._columns` |
| 1167 | method | `SweepResult.to_parquet` |
| 1173 | method | `SweepResult.to_hdf5` |
| 1178 | method | `SweepResult.save` |
| 1182 | class | `BifurcationResult` |
| 1186 | method | `BifurcationResult.__init__` |
| 1193 | method | `BifurcationResult.__repr__` |
| 1196 | method | `BifurcationResult.changes` |
| 1205 | method | `BifurcationResult.rows` |
| 1209 | method | `BifurcationResult._columns` |
| 1213 | method | `BifurcationResult.frame` |
| 1220 | method | `BifurcationResult.plot` |
| 1223 | method | `BifurcationResult.to_csv` |
| 1234 | method | `BifurcationResult.to_json` |
| 1238 | method | `BifurcationResult.to_mat` |
| 1244 | method | `BifurcationResult.to_parquet` |
| 1249 | method | `BifurcationResult.to_hdf5` |
| 1254 | method | `BifurcationResult.save` |
| 1265 | function | `_el` |
| 1270 | function | `_matrix` |
| 1275 | function | `_ascii` |
| 1282 | function | `_mat_char` |
| 1287 | function | `_mat_value` |
| 1300 | function | `_savemat` |

### `pcl/designer.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 54 | function | `machines` |
| 59 | function | `supported` |
| 63 | function | `rule_for` |
| 72 | function | `_comp` |
| 79 | function | `_num` |
| 86 | function | `_sched_max` |
| 93 | function | `_wire` |
| 99 | function | `_add` |
| 103 | function | `_profile` |
| 111 | function | `compose` |
| 154 | function | `_augment` |
| 222 | function | `_interp` |
| 238 | function | `metrics` |
| 284 | function | `cost` |
| 296 | function | `train_inverse` |
| 339 | function | `candidates` |
| 346 | function | `_label` |
| 354 | function | `design` |
| 390 | function | `describe` |
| 399 | function | `_copy` |

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

### `pcl/gui.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 33 | function | `_fmt` |
| 40 | class | `DesignerGUI` |
| 41 | method | `DesignerGUI.__init__` |
| 60 | method | `DesignerGUI._build` |
| 125 | method | `DesignerGUI.connect` |
| 139 | method | `DesignerGUI._load_machines` |
| 154 | method | `DesignerGUI.machine` |
| 158 | method | `DesignerGUI._on_machine` |
| 176 | method | `DesignerGUI.params` |
| 187 | method | `DesignerGUI.weights` |
| 190 | method | `DesignerGUI.controller` |
| 195 | method | `DesignerGUI.compose` |
| 212 | method | `DesignerGUI._inv_placeholder` |
| 216 | method | `DesignerGUI.run_design` |
| 236 | method | `DesignerGUI._poll` |
| 261 | method | `DesignerGUI.show` |
| 275 | method | `DesignerGUI._on_row` |
| 285 | method | `DesignerGUI.plot` |
| 310 | method | `DesignerGUI.send` |
| 324 | method | `DesignerGUI.save` |
| 334 | function | `main` |

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
| 90 | method | `App.machines` |
| 94 | method | `App.run` |
| 100 | method | `App.python` |
| 105 | method | `App.show` |
| 123 | method | `App.notify` |
| 127 | function | `connect` |

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
