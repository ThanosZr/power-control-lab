# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 109 |
| `web/studio/app.js` | 2258 |
| `web/studio/bus.js` | 197 |
| `web/studio/editor.js` | 630 |
| `web/studio/expr.js` | 56 |
| `web/studio/library.js` | 56 |
| `web/studio/linedata.js` | 168 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 77 |
| `web/studio/live_worker.js` | 61 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1510 |
| `web/studio/netlib.js` | 214 |
| `web/studio/nn.js` | 51 |
| `web/studio/parts.js` | 954 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 75 |
| `web/studio/scenario.js` | 151 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 185 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 113 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 276 |
| `web/studio/templates.js` | 32 |
| `web/studio/tutorials.js` | 1074 |
| `web/studio/units.js` | 156 |
| `pcl/runner.js` | 27 |
| `run.py` | 283 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 2065 |
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
| `tests/test_nn.py` | 105 |
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
| `tests/js/batch_requests.js` | 103 |
| `tests/js/bus_cases.js` | 127 |
| `tests/js/cable_tutorial.js` | 10 |
| `tests/js/gen_cases.js` | 78 |
| `tests/js/library_cases.js` | 11 |
| `tests/js/line_cases.js` | 15 |
| `tests/js/live_cases.js` | 31 |
| `tests/js/netlib42_cases.js` | 50 |
| `tests/js/netlib_cases.js` | 93 |
| `tests/js/nn_cases.js` | 42 |
| `tests/js/sim_cases.js` | 356 |
| `tests/js/snapshot_cases.js` | 19 |
| `tests/js/sparse_cases.js` | 47 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/subcircuit_cases.js` | 87 |
| `tests/js/tutorial_cases.js` | 137 |
| `tests/js/units_cases.js` | 52 |
| `tests/ui/addons_flow.js` | 126 |
| `tests/ui/blocks_flow.js` | 140 |
| `tests/ui/bus_flow.js` | 90 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/line_flow.js` | 64 |
| `tests/ui/live_flow.js` | 41 |
| `tests/ui/perf_flow.js` | 68 |
| `tests/ui/scenario_flow.js` | 70 |
| `tests/ui/speed_flow.js` | 98 |
| `tests/ui/step_flow.js` | 41 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/subcircuit_flow.js` | 79 |
| `tests/ui/ux_flow.js` | 87 |
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
| 397 | `MOD3` | Διαμορφωτής τριφασικός |
| 401 | `FEST` | Εκτιμητής ροής δρομέα |
| 405 | `INT` | Ολοκληρωτής |
| 409 | `LPF` | Βαθυπερατό 1ης τάξης |
| 413 | `F2` | Φίλτρο 2ης τάξης |
| 418 | `RLIM` | Όριο ρυθμού μεταβολής |
| 422 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 426 | `EDGE` | Ανιχνευτής ακμής |
| 430 | `CLARKE` | Clarke abc → αβ |
| 434 | `ICLARKE` | Clarke αβ → abc |
| 438 | `PARK` | Park αβ → dq |
| 441 | `IPARK` | Park dq → αβ |
| 444 | `PLL` | PLL (τριφασικό) |
| 450 | `TAGO` | Ετικέτα: προς (Goto) |
| 453 | `TAGI` | Ετικέτα: από (From) |
| 456 | `DISP` | Ένδειξη |
| 460 | `SUB` | Υποκύκλωμα |
| 463 | `PORT` | Θύρα (ηλεκτρική) |
| 466 | `SIN` | Θύρα εισόδου σήματος |
| 469 | `SOUT` | Θύρα εξόδου σήματος |
| 473 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 478 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 482 | `BSEL` | Επιλογή από δίαυλο |
| 485 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 491 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 502 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 510 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 518 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 529 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 574 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 587 | `TLM` | Γραμμή από γεωμετρία (CP / FD) |

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
| 853 | `nn_compare` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Έλεγχος με νευρωνικό δίκτυο: σύγκριση |
| 859 | `nn_online` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Νευρωνικό που μαθαίνει αμέσως |
| 866 | `nn_gui` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Σύνθεση ελέγχου από Python: κάθε μηχανή, στόχοι με βάρη |
| 873 | `sub_legs` | Υποκυκλώματα (3.17) | Πολυφασικός buck από ένα υποκύκλωμα σκέλους |
| 906 | `bus_dq` | Δίαυλοι (3.18) | Βρόχος ρεύματος dq με διαύλους: τριφασικός μετατροπέας προς δίκτυο |
| 945 | `net_fault` | Δίκτυο (4.1) | Βραχυκύκλωμα σε δίκτυο: IEC 60909 και συμμετρικές συνιστώσες |
| 965 | `gen_sc` | Συστήματα ισχύος (4.3) | Τριφασικό βραχυκύκλωμα στα άκρα σύγχρονης γεννήτριας |
| 981 | `fbm` | Συστήματα ισχύος (4.3) | IEEE First Benchmark Model: υποσύγχρονος συντονισμός (SSR) |
| 1006 | `ieee9_emt` | Συστήματα ισχύος (4.3) | IEEE 9 ζυγών σε EMT, από τη ροή φορτίου |
| 1032 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1053 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1071 | `empty` | Νέο | Κενό κύκλωμα |

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
| 151 | function | `renderChannels` |
| 169 | function | `requestMeasure` |
| 170 | function | `renderMeasure` |
| 179 | function | `MeasureUnit` |
| 182 | function | `simKey` |
| 183 | function | `perSeries` |
| 184 | function | `refFor` |
| 185 | const fn | `sched` |
| 189 | function | `metricsFor` |
| 193 | function | `metricsRows` |
| 198 | function | `eventMetricsHTML` |
| 200 | function | `renderMetricsPanel` |
| 211 | function | `rawSeries` |
| 214 | function | `autoF1` |
| 218 | function | `evRows` |
| 220 | function | `renderEvents` |
| 222 | const fn | `fv` |
| 226 | function | `eventsCsv` |
| 228 | function | `renderFFT` |
| 250 | function | `cellZ` |
| 252 | function | `renderEISForm` |
| 253 | const fn | `opt` |
| 257 | function | `runEIS` |
| 265 | function | `drawEIS` |
| 284 | function | `perSamples` |
| 286 | function | `periodText` |
| 287 | const fn | `svgPlot` |
| 289 | function | `pcmMapFn` |
| 291 | const fn | `z` |
| 294 | function | `renderPoincare` |
| 310 | function | `bfParams` |
| 312 | function | `renderBifurcationForm` |
| 318 | function | `runBifurcation` |
| 332 | function | `stopBifurcation` |
| 333 | function | `drawBifurcation` |
| 343 | function | `niceTop` |
| 346 | function | `btStatus` |
| 347 | function | `parseStep` |
| 348 | function | `runBatch` |
| 364 | function | `clearBatch` |
| 366 | function | `meanPL` |
| 368 | function | `ringTrace` |
| 370 | function | `compareHTML` |
| 380 | function | `renderBatch` |
| 385 | function | `parseCSV` |
| 387 | const fn | `cells` |
| 388 | const fn | `num` |
| 394 | const fn | `normName` |
| 395 | function | `renderCsvMap` |
| 396 | const fn | `auto` |
| 402 | function | `applyCsv` |
| 407 | function | `renderCsv` |
| 409 | function | `clearCsv` |
| 411 | function | `sampleCompareHTML` |
| 425 | function | `liveChange` |
| 427 | function | `renderLiveLog` |
| 436 | function | `changesToSchedule` |
| 438 | const fn | `f` |
| 447 | function | `updateLivePanel` |
| 452 | function | `setLivePanel` |
| 455 | function | `switchesOf` |
| 458 | function | `addPulses` |
| 460 | function | `pulseKeys` |
| 461 | function | `refreshControls` |
| 464 | const fn | `phase` |
| 498 | const fn | `setD` |
| 514 | const fn | `setPh` |
| 526 | const fn | `pinNow` |
| 537 | const fn | `pinSet` |
| 549 | function | `pinMap` |
| 550 | function | `pinX` |
| 551 | function | `pinV` |
| 554 | function | `closeInspector` |
| 555 | function | `placePopup` |
| 558 | function | `fieldValue` |
| 563 | function | `fieldHTML` |
| 577 | function | `placeAt` |
| 578 | function | `popupDrag` |
| 587 | function | `nnBlock` |
| 588 | function | `nnBox` |
| 591 | function | `nnLearned` |
| 592 | function | `openInspector` |
| 600 | const fn | `wired` |
| 609 | const fn | `same` |
| 610 | const fn | `apply` |
| 626 | const fn | `wireWidth` |
| 627 | function | `openWireInspector` |
| 643 | const fn | `numOf` |
| 649 | function | `psec` |
| 651 | function | `propsOpen` |
| 652 | function | `setProps` |
| 654 | function | `focusComp` |
| 655 | function | `togglePin` |
| 658 | function | `renderProps` |
| 667 | function | `propsComp` |
| 668 | const fn | `secOf` |
| 670 | const fn | `row` |
| 676 | const fn | `wired` |
| 690 | function | `propsJunc` |
| 692 | function | `propsWire` |
| 698 | function | `propsMulti` |
| 701 | function | `propsCircuit` |
| 711 | const fn | `opt` |
| 721 | const fn | `sv` |
| 727 | const fn | `chk` |
| 738 | function | `bindProps` |
| 768 | function | `diagItems` |
| 777 | function | `renderDiag` |
| 788 | function | `openDiag` |
| 789 | function | `flashComp` |
| 795 | function | `scheduleStepCheck` |
| 796 | function | `runStepCheck` |
| 797 | const fn | `inPage` |
| 803 | function | `syncStepMode` |
| 865 | function | `scenSetCode` |
| 866 | function | `scenState` |
| 867 | function | `scenTab` |
| 868 | function | `scenOut` |
| 869 | function | `scenWorker` |
| 871 | function | `scenRun` |
| 879 | function | `scenStop` |
| 880 | function | `scenDone` |
| 882 | function | `scenMsg` |
| 897 | function | `scenBatch` |
| 902 | function | `scenEval` |
| 905 | function | `addonDock` |
| 908 | function | `renderAddons` |
| 909 | const fn | `vsel` |
| 923 | function | `knockToast` |
| 926 | function | `initAddons` |
| 933 | function | `scenBatchWrite` |
| 936 | function | `renderScenFiles` |
| 939 | const fn | `scenNum` |
| 940 | function | `scenTable` |
| 941 | function | `scenShow` |
| 954 | function | `scenTicks` |
| 955 | function | `scenPlot` |
| 959 | const fn | `thin` |
| 966 | const fn | `dig` |
| 977 | function | `initScenarios` |
| 984 | function | `liveApply` |
| 987 | function | `closeMenu` |
| 988 | function | `openMenu` |
| 1006 | function | `updateHover` |
| 1024 | const fn | `atTop` |
| 1025 | function | `topDoc` |
| 1026 | function | `defsOf` |
| 1027 | const fn | `pid` |
| 1028 | function | `fullDoc` |
| 1030 | function | `commitView` |
| 1032 | function | `viewDiag` |
| 1033 | const fn | `rel` |
| 1036 | function | `compAt` |
| 1041 | function | `allComps` |
| 1042 | const fn | `walk` |
| 1048 | function | `partDef` |
| 1050 | function | `pdefaults` |
| 1051 | function | `subParams` |
| 1053 | function | `placeOk` |
| 1055 | function | `renameChannels` |
| 1057 | function | `levelDoc` |
| 1058 | function | `applyLevel` |
| 1059 | function | `groupSel` |
| 1064 | function | `expandSub` |
| 1067 | function | `uniqueSub` |
| 1068 | function | `subMenu` |
| 1072 | function | `enterSub` |
| 1078 | function | `leaveSub` |
| 1084 | function | `renderCrumbs` |
| 1091 | function | `curDef` |
| 1092 | function | `publicOf` |
| 1093 | function | `togglePublic` |
| 1101 | function | `propsSub` |
| 1109 | function | `bindSub` |
| 1117 | function | `propsDef` |
| 1132 | function | `bindDef` |
| 1148 | function | `exportDef` |
| 1150 | function | `importDefs` |
| 1161 | function | `palLoad` |
| 1162 | function | `palSave` |
| 1163 | function | `palRecent` |
| 1164 | function | `palItem` |
| 1168 | function | `renderPalette` |
| 1176 | const fn | `isOpen` |
| 1190 | function | `tutorial` |
| 1193 | function | `circuitSig` |
| 1203 | function | `tutorialRef` |
| 1204 | function | `theoryValidity` |
| 1210 | function | `staleBanner` |
| 1213 | function | `bindRestore` |
| 1214 | function | `loadTutorial` |
| 1219 | function | `migrateFile` |
| 1222 | function | `applyProject` |
| 1232 | function | `renderTutorial` |
| 1242 | function | `gallery` |
| 1248 | function | `api` |
| 1249 | function | `paramsOf` |
| 1250 | function | `avgOver` |
| 1253 | function | `simValue` |
| 1259 | function | `lastPP` |
| 1261 | function | `runTheory` |
| 1274 | function | `cmpRows` |
| 1275 | function | `stepsHTML` |
| 1276 | function | `renderTheory` |
| 1308 | function | `rippleDev` |
| 1310 | function | `periodAvgAt` |
| 1312 | function | `samplingTheory` |
| 1321 | const fn | `lastAt` |
| 1343 | function | `polyTheory` |
| 1350 | const fn | `frac` |
| 1379 | function | `lastPeriods` |
| 1380 | function | `evalOrderHTML` |
| 1389 | function | `genScTheory` |
| 1391 | const fn | `Iac` |
| 1399 | function | `shaftModes` |
| 1406 | function | `fbmTheory` |
| 1414 | function | `ieee9Theory` |
| 1421 | function | `lineFdTheory` |
| 1422 | const fn | `lab` |
| 1430 | const fn | `pk` |
| 1435 | function | `netFaultTheory` |
| 1448 | function | `busDqTheory` |
| 1456 | function | `subLegsTheory` |
| 1465 | function | `blocksTheory` |
| 1480 | function | `pcmTheory` |
| 1506 | function | `codeTheory` |
| 1516 | function | `eisTheory` |
| 1518 | const fn | `ser` |
| 1531 | function | `imSteady` |
| 1534 | function | `imPar` |
| 1535 | function | `phaseRms` |
| 1536 | function | `vfTheory` |
| 1549 | function | `focTheory` |
| 1566 | function | `synTheory` |
| 1585 | const fn | `need` |
| 1605 | function | `pmTheory` |
| 1607 | const fn | `mtpa` |
| 1623 | function | `srmTheory` |
| 1638 | const fn | `curve` |
| 1649 | function | `lgTheory` |
| 1660 | const fn | `cr` |
| 1667 | function | `chaosTheory` |
| 1682 | function | `nnCycles` |
| 1684 | function | `nnTheory` |
| 1699 | function | `nnGuiCode` |
| 1705 | function | `runNNCompare` |
| 1713 | function | `dcDriveTheory` |
| 1714 | const fn | `per` |
| 1715 | const fn | `cross` |
| 1745 | function | `twModel` |
| 1748 | const fn | `g` |
| 1751 | function | `twLattice` |
| 1758 | const fn | `marks` |
| 1761 | function | `twTheory` |
| 1769 | const fn | `at` |
| 1786 | function | `arTheory` |
| 1806 | function | `impulseMeasure` |
| 1808 | const fn | `cross` |
| 1811 | function | `marxTheory` |
| 1829 | function | `chopModel` |
| 1832 | const fn | `f` |
| 1835 | function | `chopTheory` |
| 1849 | function | `cmp3` |
| 1853 | function | `hvExact` |
| 1854 | function | `hv153Theory` |
| 1880 | function | `besI1e` |
| 1882 | function | `heaviside` |
| 1884 | function | `lossTheory` |
| 1903 | function | `vtBreak` |
| 1904 | function | `vtTheory` |
| 1924 | function | `hvdivTheory` |
| 1926 | const fn | `r` |
| 1938 | function | `scheringTheory` |
| 1939 | const fn | `inv` |
| 1948 | const fn | `sr` |
| 1954 | function | `formulaTheory` |
| 2031 | function | `nodeAvg` |
| 2037 | function | `circuitForMath` |
| 2069 | function | `scheduleMath` |
| 2070 | function | `batteryKey` |
| 2072 | function | `mathChoices` |
| 2073 | const fn | `prim` |
| 2075 | function | `renderMathChoices` |
| 2077 | function | `runTemplate` |
| 2083 | function | `runMath` |
| 2105 | function | `saveLocal` |
| 2106 | function | `saveLocalSoon` |
| 2108 | function | `download` |
| 2109 | function | `exportCSV` |
| 2115 | function | `syncScopeInputs` |
| 2116 | function | `setSpeed` |
| 2119 | function | `openSettings` |
| 2120 | const fn | `sel` |
| 2121 | const fn | `chk` |
| 2142 | function | `boot` |
| 2186 | const fn | `mv` |
| 2187 | const fn | `up` |
| 2188 | const fn | `navOpen` |
| 2199 | const fn | `probeSel` |
| 2254 | function | `renderTheoryLive` |

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
| 332 | method | `renderLabels` |
| 337 | const fn | `at` |
| 341 | method | `renderWires` |
| 355 | method | `wireSVG` |
| 366 | method | `redrawWire` |
| 367 | method | `pathD` |
| 372 | method | `segDir` |
| 373 | method | `midLabel` |
| 374 | method | `renderPins` |
| 384 | method | `renderSel` |
| 386 | method | `setLive` |
| 388 | method | `updateLive` |
| 397 | method | `drawArrows` |
| 408 | method | `world` |
| 410 | method | `hitAt` |
| 411 | method | `hitOf` |
| 413 | method | `down` |
| 439 | method | `move` |
| 452 | method | `up` |
| 466 | method | `cancelDrag` |
| 467 | method | `hoverPin` |
| 469 | method | `dbl` |
| 470 | method | `menu` |
| 473 | method | `worldNow` |
| 474 | method | `wheel` |
| 481 | method | `letter` |
| 482 | method | `key` |
| 506 | method | `beginDrag` |
| 517 | method | `dragMove` |
| 529 | method | `endDrag` |
| 539 | method | `bakeMove` |
| 544 | method | `dragSeg` |
| 547 | const fn | `stub` |
| 556 | method | `drawMarquee` |
| 559 | method | `marqueeSelect` |
| 562 | const fn | `inside` |
| 569 | method | `escape` |
| 572 | method | `beginPlace` |
| 573 | method | `ghost` |
| 575 | method | `finishPlace` |
| 576 | method | `cancelPlace` |
| 578 | method | `startWire` |
| 579 | method | `startWireFrom` |
| 580 | method | `previewWire` |
| 589 | method | `wireClick` |
| 595 | method | `orthoNext` |
| 596 | method | `finishWire` |
| 612 | method | `cancelWire` |
| 614 | method | `splitWire` |
| 624 | method | `wireNetPin` |
| 626 | method | `canScroll` |

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
| 30 | function | `nnBuild` |
| 39 | function | `nnStep` |
| 46 | const fn | `schedAt` |
| 47 | const fn | `num` |
| 49 | const fn | `numList` |
| 61 | function | `b64of` |
| 63 | function | `fromB64` |
| 66 | function | `snapEncode` |
| 67 | const fn | `num` |
| 68 | function | `enc` |
| 78 | function | `snapRestore` |
| 79 | function | `dec` |
| 90 | function | `smPort` |
| 94 | function | `smOut` |
| 98 | const fn | `genCopy` |
| 100 | function | `csolve` |
| 118 | function | `acInit` |
| 125 | const fn | `ad` |
| 126 | const fn | `y` |
| 158 | const fn | `seq` |
| 170 | const fn | `dad` |
| 193 | class | `NetlistError` |
| 198 | function | `dePiece` |
| 200 | const fn | `F` |
| 201 | function | `deInt` |
| 203 | function | `deFrac` |
| 206 | function | `tlElement` |
| 213 | function | `tlmElement` |
| 223 | function | `rcCoef` |
| 225 | function | `buildNetlist` |
| 235 | const fn | `union` |
| 250 | const fn | `nm` |
| 269 | const fn | `sn` |
| 273 | const fn | `isJ` |
| 293 | const fn | `lbl` |
| 298 | const fn | `node` |
| 299 | const fn | `internal` |
| 302 | const fn | `mkBlock` |
| 309 | const fn | `add` |
| 310 | const fn | `series` |
| 506 | function | `compileSignals` |
| 531 | function | `f2Phi` |
| 536 | function | `cmpF` |
| 540 | function | `stampM` |
| 542 | function | `luFactor` |
| 548 | function | `luSolve` |
| 555 | class | `Sim` |
| 556 | method | `constructor` |
| 558 | method | `basePeriod` |
| 562 | method | `tlMaxStep` |
| 563 | method | `setStep` |
| 566 | method | `stIndex` |
| 579 | method | `stVec` |
| 580 | method | `stepCfg` |
| 581 | method | `varSetup` |
| 584 | method | `setStepMode` |
| 586 | method | `hGrid` |
| 590 | method | `modeCap` |
| 594 | method | `swEls` |
| 595 | method | `topoKey` |
| 596 | method | `topoInfo` |
| 605 | method | `topoCheck` |
| 622 | method | `lteReset` |
| 623 | method | `ltePush` |
| 627 | method | `lteErr` |
| 637 | method | `varCheck` |
| 652 | method | `note` |
| 655 | method | `stepCheck` |
| 656 | method | `diagnostics` |
| 659 | method | `ringCheck` |
| 668 | method | `stateMap` |
| 670 | method | `stateMap0` |
| 681 | method | `load` |
| 724 | method | `reset` |
| 727 | method | `imStep` |
| 734 | method | `smStep` |
| 736 | method | `srmStep` |
| 737 | method | `srmOutputs` |
| 738 | method | `smOutputs` |
| 742 | method | `genStep` |
| 749 | method | `genOutputs` |
| 754 | method | `genTm` |
| 755 | method | `genEfd` |
| 756 | method | `imSources` |
| 757 | method | `pyBlocks` |
| 763 | method | `setMethod` |
| 764 | method | `setControl` |
| 766 | method | `setBlock` |
| 768 | method | `setHold` |
| 770 | method | `markChange` |
| 775 | method | `progInit` |
| 776 | method | `addProgram` |
| 778 | method | `progNext` |
| 779 | method | `progDue` |
| 780 | method | `progApply` |
| 793 | method | `evInit` |
| 794 | method | `logEv` |
| 796 | method | `events` |
| 798 | method | `evSwitches` |
| 800 | method | `channelKeys` |
| 818 | method | `allocRecord` |
| 822 | const fn | `A` |
| 828 | method | `V` |
| 829 | method | `elCurrent` |
| 833 | method | `portI` |
| 835 | method | `computeVals` |
| 861 | method | `recordNow` |
| 869 | method | `closePeriod` |
| 878 | method | `lastPeriod` |
| 879 | method | `now` |
| 884 | method | `gateOf` |
| 890 | method | `rawGate` |
| 901 | method | `carrier` |
| 904 | method | `shGrid` |
| 905 | method | `shNext` |
| 907 | method | `sampleHolds` |
| 912 | method | `samples` |
| 913 | method | `ctrlEdges` |
| 919 | method | `scrU` |
| 920 | method | `scrGate` |
| 921 | method | `scrEdges` |
| 922 | method | `setFiring` |
| 923 | method | `compV` |
| 924 | method | `compI` |
| 926 | method | `dbl` |
| 927 | method | `sampleControllers` |
| 956 | method | `evalBlocks` |
| 1033 | method | `blkDue` |
| 1035 | method | `zcFrac` |
| 1038 | method | `saveState` |
| 1040 | method | `restoreState` |
| 1046 | method | `snapshot` |
| 1047 | method | `restoreSnapshot` |
| 1049 | method | `gateSigPeek` |
| 1052 | method | `gateSig` |
| 1057 | method | `jumpScheds` |
| 1064 | method | `jumpAt` |
| 1065 | method | `values` |
| 1087 | method | `assemble` |
| 1094 | const fn | `g` |
| 1117 | method | `rhs` |
| 1119 | const fn | `J` |
| 1137 | method | `cplLinearize` |
| 1141 | method | `factor` |
| 1147 | method | `spAssemble` |
| 1154 | method | `solveOnce` |
| 1163 | method | `solve` |
| 1177 | method | `nlLinearize` |
| 1180 | method | `check` |
| 1196 | method | `commit` |
| 1217 | method | `initialSolve` |
| 1229 | method | `tlSources` |
| 1233 | method | `tlRecord` |
| 1239 | method | `tlHist` |
| 1245 | method | `tlmG` |
| 1249 | method | `tlmSources` |
| 1261 | method | `tlmRecord` |
| 1274 | method | `tlmHist` |
| 1281 | method | `step` |
| 1283 | const fn | `gs` |
| 1289 | method | `stepCore` |
| 1343 | method | `edgeSolve` |
| 1346 | method | `edgePoint` |
| 1347 | method | `nextEvent` |
| 1353 | const fn | `sch` |
| 1375 | method | `spwmCut` |
| 1378 | const fn | `sig` |
| 1383 | method | `run` |
| 1425 | function | `exportForBatch` |
| 1440 | const fn | `ci` |
| 1441 | const fn | `vd` |
| 1442 | const fn | `V` |
| 1443 | const fn | `I` |
| 1444 | const fn | `portRec` |
| 1445 | const fn | `rec` |
| 1461 | const fn | `clkOf` |
| 1487 | function | `sweepPoint` |
| 1492 | function | `setPath` |
| 1498 | function | `eisPoint` |
| 1506 | function | `resume` |

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
| 14 | function | `rng` |
| 15 | function | `gauss` |
| 16 | function | `init` |
| 21 | function | `fwd` |
| 27 | function | `count` |
| 28 | function | `learn` |
| 34 | const fn | `step` |
| 37 | function | `optState` |
| 39 | function | `sizesOf` |
| 40 | function | `parse` |
| 48 | function | `text` |

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
| 602 | function | `defaults` |
| 604 | function | `elPins` |
| 605 | function | `sigPins` |
| 606 | function | `pinsOf` |
| 609 | function | `parseMat` |
| 611 | function | `nPorts` |
| 612 | function | `portY` |
| 613 | function | `portPins` |
| 614 | function | `portBox` |
| 616 | function | `posDef` |
| 618 | function | `symmetric` |
| 619 | function | `matInv` |
| 624 | function | `klMatrix` |
| 635 | function | `kgMatrix` |
| 643 | function | `srmGeo` |
| 645 | function | `srmSpins` |
| 647 | function | `srmPins` |
| 649 | function | `satD` |
| 650 | function | `satDinv` |
| 652 | function | `genSpins` |
| 663 | function | `genTsc` |
| 668 | function | `genCirc2` |
| 669 | const fn | `Fn` |
| 677 | function | `genAxis` |
| 685 | const fn | `classic` |
| 691 | const fn | `plist` |
| 695 | function | `genModel` |
| 701 | const fn | `w` |
| 710 | const fn | `grp` |
| 727 | function | `genGamma` |
| 735 | function | `genDQ` |
| 739 | function | `genSteady` |
| 741 | const fn | `rot` |
| 748 | function | `srmAlignedPsi` |
| 749 | function | `srmModelPsi` |
| 750 | function | `srmTableText` |
| 753 | function | `srmMag` |
| 769 | function | `chkMag` |
| 771 | function | `srmA` |
| 774 | function | `seg` |
| 775 | function | `srmPsi` |
| 777 | function | `srmCur` |
| 779 | function | `srmTorque` |
| 782 | function | `srmCoenergy` |
| 786 | function | `waveShape` |
| 787 | function | `waveAt` |
| 790 | function | `waveMeasure` |
| 793 | const fn | `cross` |
| 799 | function | `waveFit` |
| 800 | const fn | `res` |
| 811 | function | `directWave` |
| 814 | function | `impulseWave` |
| 824 | function | `bewley` |
| 827 | const fn | `at` |
| 833 | function | `movChar` |
| 838 | const fn | `pick` |
| 839 | const fn | `cur` |
| 840 | const fn | `inv` |
| 844 | function | `impulseDesign` |
| 849 | function | `impulseRoots` |
| 852 | function | `tlParams` |
| 861 | function | `tlmData` |
| 863 | function | `tlmM` |
| 865 | function | `tlmPin` |
| 866 | function | `tlmPins` |
| 868 | function | `tlmKey` |
| 871 | function | `tlmModel` |
| 878 | function | `lightningWave` |
| 885 | function | `pinKind` |
| 896 | function | `structural` |
| 903 | function | `pinWidth` |
| 906 | function | `xf` |
| 907 | function | `pinPos` |
| 909 | function | `pinDir` |
| 914 | function | `cpeParams` |
| 915 | function | `cpeBank` |
| 919 | function | `cpeZ` |
| 920 | function | `cpeZbank` |
| 921 | function | `boxOf` |
| 922 | function | `bbox` |
| 927 | function | `fmtNum` |
| 931 | function | `eng` |
| 935 | function | `parseEng` |
| 938 | function | `parseSched` |
| 946 | function | `machines` |

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
| 817 | function | `nnSched` |
| 818 | function | `nnDrive` |
| 858 | method | `build` |
| 865 | method | `build` |
| 870 | method | `build` |
| 879 | method | `build` |
| 889 | const fn | `y` |
| 912 | method | `build` |
| 913 | const fn | `ws` |
| 952 | method | `build` |
| 970 | method | `build` |
| 978 | function | `fbmPoint` |
| 985 | method | `build` |
| 1010 | method | `build` |
| 1012 | const fn | `GD` |
| 1013 | const fn | `L` |
| 1014 | const fn | `G` |
| 1015 | const fn | `Ld` |
| 1029 | const fn | `LM` |
| 1030 | function | `tlmPart` |
| 1037 | method | `build` |
| 1039 | const fn | `rig` |
| 1058 | method | `build` |
| 1060 | const fn | `rig` |
| 1072 | method | `build` |

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
| 349 | function | `_nn_step` |
| 366 | function | `make_python_block` |
| 397 | class | `Circuit` |
| 398 | method | `Circuit.__init__` |
| 607 | method | `Circuit.R` |
| 610 | method | `Circuit.im_e` |
| 619 | method | `Circuit.im_deriv` |
| 632 | method | `Circuit.sm_cur` |
| 644 | method | `Circuit.sm_ports` |
| 649 | method | `Circuit.sm_deriv` |
| 664 | method | `Circuit.srm_A` |
| 669 | method | `Circuit._seg` |
| 673 | method | `Circuit.srm_cur` |
| 680 | method | `Circuit.srm_torque` |
| 689 | method | `Circuit.srm_currents` |
| 694 | method | `Circuit.srm_deriv` |
| 707 | method | `Circuit.gen_cur` |
| 724 | method | `Circuit.gen_efd` |
| 731 | method | `Circuit.gen_tm` |
| 738 | method | `Circuit.gen_deriv` |
| 756 | method | `Circuit.gen_out` |
| 775 | method | `Circuit.Vsrc` |
| 791 | method | `Circuit.topo` |
| 801 | method | `Circuit.build` |
| 898 | method | `Circuit.bsrc` |
| 938 | method | `Circuit.solve_z` |
| 964 | method | `Circuit.solve_nl` |
| 1006 | method | `Circuit.tl_hist` |
| 1023 | method | `Circuit.tl_sec` |
| 1030 | method | `Circuit.tl_ih` |
| 1034 | method | `Circuit.tl_record` |
| 1053 | method | `Circuit.scr_u` |
| 1057 | method | `Circuit.scr_gate` |
| 1061 | method | `Circuit.scr_edges` |
| 1068 | method | `Circuit.gate_state` |
| 1081 | method | `Circuit.set_gates` |
| 1089 | method | `Circuit.may_turn_on` |
| 1093 | method | `Circuit.tolerances` |
| 1099 | method | `Circuit.consistent` |
| 1141 | method | `Circuit.value` |
| 1177 | method | `Circuit.current` |
| 1220 | method | `Circuit.prime` |
| 1230 | method | `Circuit.sig_in` |
| 1234 | method | `Circuit.sh_grid` |
| 1246 | method | `Circuit.sh_next` |
| 1253 | method | `Circuit.log_ev` |
| 1259 | method | `Circuit.ev_switches` |
| 1268 | method | `Circuit.sh_sample` |
| 1288 | method | `Circuit.sample` |
| 1349 | method | `Circuit.cmp_f` |
| 1355 | method | `Circuit.blk_due` |
| 1366 | method | `Circuit.eval_blocks` |
| 1654 | method | `Circuit.block_events` |
| 1683 | method | `Circuit.next_event` |
| 1750 | function | `_decimate` |
| 1767 | function | `_diagnose` |
| 1818 | function | `simulate` |
| 2059 | function | `batch_sim` |

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
