# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 110 |
| `web/studio/app.js` | 2469 |
| `web/studio/bus.js` | 197 |
| `web/studio/editor.js` | 642 |
| `web/studio/expr.js` | 73 |
| `web/studio/inside.js` | 143 |
| `web/studio/library.js` | 56 |
| `web/studio/linedata.js` | 168 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 92 |
| `web/studio/live_worker.js` | 88 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1675 |
| `web/studio/netlib.js` | 602 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 1109 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 87 |
| `web/studio/scenario.js` | 153 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 185 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 113 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 288 |
| `web/studio/templates.js` | 32 |
| `web/studio/trv.js` | 56 |
| `web/studio/tutorials.js` | 1355 |
| `web/studio/units.js` | 156 |
| `web/studio/watch.js` | 339 |
| `pcl/runner.js` | 27 |
| `run.py` | 294 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 2151 |
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
| `engine/recording.py` | 77 |
| `engine/studio_math.py` | 81 |
| `engine/templates.py` | 317 |
| `engine/workbench.py` | 129 |
| `pcl/__init__.py` | 14 |
| `pcl/__main__.py` | 400 |
| `pcl/control.py` | 953 |
| `pcl/core.py` | 1312 |
| `pcl/designer.py` | 791 |
| `pcl/formats.py` | 222 |
| `pcl/gui.py` | 409 |
| `pcl/impulse.py` | 858 |
| `pcl/lineconst.py` | 1023 |
| `pcl/link.py` | 145 |
| `pcl/network.py` | 1053 |
| `pcl/plotting.py` | 340 |
| `pcl/trv.py` | 433 |
| `pcl/workbench.py` | 485 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 106 |
| `tests/test_arc.py` | 126 |
| `tests/test_batch.py` | 253 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_boundary.py` | 50 |
| `tests/test_bus.py` | 145 |
| `tests/test_control.py` | 213 |
| `tests/test_derivation.py` | 93 |
| `tests/test_designer.py` | 200 |
| `tests/test_engine.py` | 276 |
| `tests/test_ev.py` | 102 |
| `tests/test_gen_ctl.py` | 128 |
| `tests/test_generator.py` | 223 |
| `tests/test_impl.py` | 89 |
| `tests/test_impulse_tools.py` | 150 |
| `tests/test_library.py` | 41 |
| `tests/test_lightning.py` | 78 |
| `tests/test_lines.py` | 355 |
| `tests/test_live_program.py` | 49 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_matlab.py` | 213 |
| `tests/test_netlib.py` | 209 |
| `tests/test_network.py` | 272 |
| `tests/test_nn.py` | 130 |
| `tests/test_pcl.py` | 312 |
| `tests/test_plotting.py` | 113 |
| `tests/test_recording.py` | 75 |
| `tests/test_sparse.py` | 39 |
| `tests/test_step.py` | 109 |
| `tests/test_stream.py` | 132 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 609 |
| `tests/test_subcircuit.py` | 149 |
| `tests/test_templates.py` | 237 |
| `tests/test_trstart.py` | 26 |
| `tests/test_trv.py` | 248 |
| `tests/test_tutorials.py` | 703 |
| `tests/test_units.py` | 78 |
| `tests/test_watch.py` | 87 |
| `tests/test_workbench.py` | 215 |
| `tests/js/arc_cases.js` | 39 |
| `tests/js/batch_requests.js` | 116 |
| `tests/js/bus_cases.js` | 127 |
| `tests/js/cable_tutorial.js` | 10 |
| `tests/js/ev_cases.js` | 37 |
| `tests/js/gen_cases.js` | 78 |
| `tests/js/gen_ctl_cases.js` | 39 |
| `tests/js/impl_cases.js` | 50 |
| `tests/js/library_cases.js` | 11 |
| `tests/js/lightning_cases.js` | 22 |
| `tests/js/line_cases.js` | 15 |
| `tests/js/live_cases.js` | 31 |
| `tests/js/netlib42_cases.js` | 50 |
| `tests/js/netlib_cases.js` | 93 |
| `tests/js/nn_cases.js` | 48 |
| `tests/js/sim_cases.js` | 356 |
| `tests/js/snapshot_cases.js` | 21 |
| `tests/js/sparse_cases.js` | 47 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/subcircuit_cases.js` | 87 |
| `tests/js/trstart_cases.js` | 11 |
| `tests/js/trv_cases.js` | 8 |
| `tests/js/trv_tutorial_cases.js` | 30 |
| `tests/js/tutorial_cases.js` | 137 |
| `tests/js/units_cases.js` | 52 |
| `tests/js/watch_cases.js` | 41 |
| `tests/ui/addons_flow.js` | 128 |
| `tests/ui/blocks_flow.js` | 144 |
| `tests/ui/bus_flow.js` | 90 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/ev_flow.js` | 89 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/line_flow.js` | 100 |
| `tests/ui/live_flow.js` | 41 |
| `tests/ui/perf_flow.js` | 68 |
| `tests/ui/scenario_flow.js` | 70 |
| `tests/ui/speed_flow.js` | 104 |
| `tests/ui/step_flow.js` | 41 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/subcircuit_flow.js` | 79 |
| `tests/ui/ux_flow.js` | 87 |
| `tests/ui/watch_flow.js` | 113 |
| `tests/ui/wiring_flow.js` | 128 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 101 | `R` | Αντίσταση |
| 105 | `CPE` | CPE / Warburg |
| 111 | `L` | Πηνίο |
| 115 | `C` | Πυκνωτής |
| 119 | `VDC` | Πηγή DC / μπαταρία |
| 125 | `VAC` | Πηγή AC |
| 129 | `VAC3` | Τριφασική πηγή (Y) |
| 135 | `IDC` | Πηγή ρεύματος |
| 141 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 154 | `D` | Δίοδος |
| 158 | `SCR` | Θυρίστορ (SCR) |
| 169 | `XFMR` | Μετασχηματιστής |
| 177 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 190 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 203 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 213 | `KL` | Συζευγμένα πηνία (N×N) |
| 224 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 231 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 239 | `SG` | Σπινθηριστής (διάκενο) |
| 252 | `CPL` | Φορτίο σταθερής ισχύος |
| 256 | `SH` | Δειγματοληψία και συγκράτηση (S&H) |
| 265 | `GND` | Γείωση |
| 267 | `JUNC` | Κόμβος |
| 268 | `PWM` | PWM / έλεγχος |
| 290 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 301 | `VM` | Βολτόμετρο |
| 303 | `AM` | Αμπερόμετρο (σε σειρά) |
| 306 | `VP` | Probe τάσης (ως προς τη γη) |
| 308 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 310 | `MEAS` | Μέτρηση στοιχείου |
| 313 | `CONST` | Σταθερά / πρόγραμμα |
| 317 | `GAIN` | Κέρδος |
| 319 | `SUM` | Άθροισμα |
| 322 | `MUL` | Γινόμενο |
| 324 | `DIV` | Διαίρεση a/b |
| 327 | `SAT` | Κορεσμός |
| 330 | `CMP` | Συγκριτής |
| 333 | `LOGIC` | Λογική πύλη |
| 336 | `PIB` | PI διακριτός |
| 342 | `UD` | Καθυστέρηση z⁻¹ |
| 345 | `SR` | Μανδαλωτής SR (latch) |
| 348 | `CLK` | Ρολόι (τετραγωνικό) |
| 351 | `RAMP` | Φέρον / ράμπα |
| 356 | `EXPR` | Έκφραση |
| 360 | `PY` | Μπλοκ Python |
| 368 | `AIC` | Ελεγκτής AI (βρόχος με νευρωνικό) |
| 385 | `AVR` | Διέγερση και ρυθμιστής τάσης (AVR: IEEE ST1A, DC1A) |
| 396 | `PSS` | Σταθεροποιητής συστήματος (PSS) |
| 401 | `GOV` | Ρυθμιστής στροφών και στρόβιλος |
| 414 | `EVC` | Πολυκριτηριακός ελεγκτής οχήματος (ταχύτητα → ροπή → ρεύμα) |
| 424 | `NN` | Νευρωνικό δίκτυο (MLP) |
| 487 | `MOD3` | Διαμορφωτής τριφασικός |
| 491 | `FEST` | Εκτιμητής ροής δρομέα |
| 495 | `INT` | Ολοκληρωτής |
| 499 | `LPF` | Βαθυπερατό 1ης τάξης |
| 503 | `F2` | Φίλτρο 2ης τάξης |
| 508 | `RLIM` | Όριο ρυθμού μεταβολής |
| 512 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 516 | `EDGE` | Ανιχνευτής ακμής |
| 520 | `CLARKE` | Clarke abc → αβ |
| 524 | `ICLARKE` | Clarke αβ → abc |
| 528 | `PARK` | Park αβ → dq |
| 531 | `IPARK` | Park dq → αβ |
| 534 | `PLL` | PLL (τριφασικό) |
| 540 | `TAGO` | Ετικέτα: προς (Goto) |
| 543 | `TAGI` | Ετικέτα: από (From) |
| 546 | `DISP` | Ένδειξη |
| 550 | `SUB` | Υποκύκλωμα |
| 553 | `PORT` | Θύρα (ηλεκτρική) |
| 556 | `SIN` | Θύρα εισόδου σήματος |
| 559 | `SOUT` | Θύρα εξόδου σήματος |
| 563 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 568 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 572 | `BSEL` | Επιλογή από δίαυλο |
| 575 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 581 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 592 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 600 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 610 | `ARCX` | Τμήμα τόξου |
| 614 | `ARC` | Διακόπτης με τόξο (μονοφασικός) |
| 621 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 632 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 677 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 690 | `TLM` | Γραμμή από γεωμετρία (CP / FD) |
| 708 | `TOWER` | Πύργος γραμμής (κεραυνοί) |
| 725 | `SAI` | Αλεξικέραυνο ZnO, μοντέλο IEEE (εξαρτάται από τη συχνότητα) |
| 740 | `SAIX` | Αλεξικέραυνο IEEE (συμπαγές) |
| 744 | `RFX` | Γείωση πύργου R(I) (από τη γραμμή του πύργου) |
| 748 | `NOTE` | Σημείωση (κείμενο στο σχέδιο) |

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
| 909 | `ai_block` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Ελεγκτής AI με πρόσοψη |
| 989 | `ev_drive` | Ηλεκτρικό όχημα (4.8) | Ηλεκτρικό όχημα: πολυκριτηριακός έλεγχος |
| 996 | `nn_gui` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Σύνθεση ελέγχου από Python: κάθε μηχανή, στόχοι με βάρη |
| 1003 | `sub_legs` | Υποκυκλώματα (3.17) | Πολυφασικός buck από ένα υποκύκλωμα σκέλους |
| 1036 | `bus_dq` | Δίαυλοι (3.18) | Βρόχος ρεύματος dq με διαύλους: τριφασικός μετατροπέας προς δίκτυο |
| 1075 | `net_fault` | Δίκτυο (4.1) | Βραχυκύκλωμα σε δίκτυο: IEC 60909 και συμμετρικές συνιστώσες |
| 1095 | `gen_sc` | Συστήματα ισχύος (4.3) | Τριφασικό βραχυκύκλωμα στα άκρα σύγχρονης γεννήτριας |
| 1111 | `fbm` | Συστήματα ισχύος (4.3) | IEEE First Benchmark Model: υποσύγχρονος συντονισμός (SSR) |
| 1159 | `gen_ctl` | Συστήματα ισχύος (4.8.1) | Γεννήτρια με AVR, PSS και ρυθμιστή στροφών |
| 1171 | `ieee9_emt` | Συστήματα ισχύος (4.3) | IEEE 9 ζυγών σε EMT, από τη ροή φορτίου |
| 1209 | `trv_terminal` | Διακόπτες ισχύος (4.9) | TRV σε σφάλμα ακροδεκτών: IEC 62271-100 |
| 1230 | `trv_slf` | Διακόπτες ισχύος (4.9) | Σφάλμα κοντινής γραμμής και τόξο του διακόπτη |
| 1259 | `lightning_gis` | Κεραυνοί και συντονισμός μόνωσης (4.9) | Κεραυνός σε γραμμή 400 kV δίπλα σε υποσταθμό GIS: συντονισμός μόνωσης |
| 1313 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1334 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1352 | `empty` | Νέο | Κενό κύκλωμα |

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
| 68 | function | `onMessage` |

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
| 46 | function | `linkAdvance` |
| 54 | function | `linkReset` |
| 55 | function | `stepT` |
| 62 | function | `applyRec` |
| 64 | function | `renderRec` |
| 66 | function | `recToggle` |
| 73 | function | `recCollect` |
| 78 | function | `recFlush` |
| 84 | function | `pyPage` |
| 88 | function | `runToEnd` |
| 91 | const fn | `chunk` |
| 93 | function | `loop` |
| 121 | function | `draw` |
| 123 | function | `setText` |
| 124 | function | `navRange` |
| 125 | function | `updateClock` |
| 129 | function | `liveOf` |
| 161 | function | `blkUnit` |
| 168 | function | `outsOf` |
| 170 | const fn | `vecN` |
| 172 | function | `chanLabel` |
| 180 | function | `addProbe` |
| 181 | function | `flash` |
| 189 | function | `signalsFor` |
| 204 | const fn | `fold` |
| 206 | function | `fillSignals` |
| 213 | function | `renderChannels` |
| 231 | function | `requestMeasure` |
| 232 | function | `renderMeasure` |
| 241 | function | `MeasureUnit` |
| 244 | function | `simKey` |
| 245 | function | `perSeries` |
| 246 | function | `refFor` |
| 247 | const fn | `sched` |
| 251 | function | `metricsFor` |
| 255 | function | `metricsRows` |
| 260 | function | `eventMetricsHTML` |
| 262 | function | `renderMetricsPanel` |
| 273 | function | `rawSeries` |
| 276 | function | `autoF1` |
| 280 | function | `evRows` |
| 282 | function | `renderEvents` |
| 284 | const fn | `fv` |
| 288 | function | `eventsCsv` |
| 290 | function | `renderFFT` |
| 312 | function | `cellZ` |
| 314 | function | `renderEISForm` |
| 315 | const fn | `opt` |
| 319 | function | `runEIS` |
| 327 | function | `drawEIS` |
| 346 | function | `perSamples` |
| 348 | function | `periodText` |
| 349 | const fn | `svgPlot` |
| 351 | function | `pcmMapFn` |
| 353 | const fn | `z` |
| 356 | function | `renderPoincare` |
| 372 | function | `bfParams` |
| 374 | function | `renderBifurcationForm` |
| 380 | function | `runBifurcation` |
| 394 | function | `stopBifurcation` |
| 395 | function | `drawBifurcation` |
| 405 | function | `niceTop` |
| 408 | function | `btStatus` |
| 409 | function | `parseStep` |
| 410 | function | `runBatch` |
| 426 | function | `clearBatch` |
| 428 | function | `meanPL` |
| 430 | function | `ringTrace` |
| 432 | function | `compareHTML` |
| 442 | function | `renderBatch` |
| 447 | function | `parseCSV` |
| 449 | const fn | `cells` |
| 450 | const fn | `num` |
| 456 | const fn | `normName` |
| 457 | function | `renderCsvMap` |
| 458 | const fn | `auto` |
| 464 | function | `applyCsv` |
| 469 | function | `renderCsv` |
| 471 | function | `clearCsv` |
| 473 | function | `sampleCompareHTML` |
| 487 | function | `liveChange` |
| 489 | function | `renderLiveLog` |
| 498 | function | `changesToSchedule` |
| 500 | const fn | `f` |
| 509 | function | `updateLivePanel` |
| 514 | function | `setLivePanel` |
| 517 | function | `switchesOf` |
| 520 | function | `addPulses` |
| 522 | function | `pulseKeys` |
| 523 | function | `refreshControls` |
| 526 | const fn | `phase` |
| 560 | const fn | `setD` |
| 576 | const fn | `setPh` |
| 588 | const fn | `pinNow` |
| 599 | const fn | `pinSet` |
| 611 | function | `pinMap` |
| 612 | function | `pinX` |
| 613 | function | `pinV` |
| 619 | function | `liveParam` |
| 634 | function | `closeInspector` |
| 635 | function | `placePopup` |
| 638 | function | `fieldValue` |
| 643 | function | `fieldHTML` |
| 658 | function | `placeAt` |
| 659 | function | `popupDrag` |
| 668 | function | `nnBlock` |
| 669 | function | `nnBox` |
| 672 | function | `nnLearned` |
| 673 | function | `openInspector` |
| 681 | const fn | `wired` |
| 690 | const fn | `same` |
| 691 | const fn | `apply` |
| 707 | const fn | `wireWidth` |
| 708 | function | `openWireInspector` |
| 724 | const fn | `numOf` |
| 730 | function | `psec` |
| 732 | function | `propsOpen` |
| 733 | function | `setProps` |
| 735 | function | `focusComp` |
| 736 | function | `togglePin` |
| 739 | function | `renderProps` |
| 748 | function | `propsComp` |
| 749 | const fn | `secOf` |
| 751 | const fn | `row` |
| 757 | const fn | `wired` |
| 771 | function | `propsJunc` |
| 773 | function | `propsWire` |
| 779 | function | `propsMulti` |
| 782 | function | `propsCircuit` |
| 792 | const fn | `opt` |
| 802 | const fn | `sv` |
| 808 | const fn | `chk` |
| 819 | function | `bindProps` |
| 850 | function | `diagItems` |
| 859 | function | `renderDiag` |
| 870 | function | `openDiag` |
| 871 | function | `flashComp` |
| 877 | function | `scheduleStepCheck` |
| 878 | function | `runStepCheck` |
| 879 | const fn | `inPage` |
| 886 | function | `syncStepMode` |
| 948 | function | `scenSetCode` |
| 949 | function | `scenState` |
| 950 | function | `scenTab` |
| 951 | function | `scenOut` |
| 952 | function | `scenWorker` |
| 954 | function | `scenRun` |
| 962 | function | `scenStop` |
| 963 | function | `scenDone` |
| 965 | function | `scenMsg` |
| 980 | function | `scenBatch` |
| 985 | function | `scenEval` |
| 988 | function | `addonDock` |
| 991 | function | `renderAddons` |
| 992 | const fn | `vsel` |
| 1006 | function | `knockToast` |
| 1009 | function | `initAddons` |
| 1016 | function | `scenBatchWrite` |
| 1019 | function | `renderScenFiles` |
| 1022 | const fn | `scenNum` |
| 1023 | function | `scenTable` |
| 1024 | function | `scenShow` |
| 1037 | function | `scenTicks` |
| 1038 | function | `scenPlot` |
| 1042 | const fn | `thin` |
| 1049 | const fn | `dig` |
| 1060 | function | `initScenarios` |
| 1067 | function | `liveApply` |
| 1070 | function | `closeMenu` |
| 1071 | function | `openMenu` |
| 1092 | function | `updateHover` |
| 1110 | const fn | `atTop` |
| 1111 | function | `topDoc` |
| 1112 | function | `defsOf` |
| 1113 | const fn | `pid` |
| 1114 | function | `fullDoc` |
| 1116 | function | `commitView` |
| 1118 | function | `viewDiag` |
| 1119 | const fn | `rel` |
| 1122 | function | `compAt` |
| 1127 | function | `allComps` |
| 1128 | const fn | `walk` |
| 1134 | function | `partDef` |
| 1136 | function | `pdefaults` |
| 1137 | function | `subParams` |
| 1139 | function | `placeOk` |
| 1141 | function | `renameChannels` |
| 1143 | function | `levelDoc` |
| 1144 | function | `applyLevel` |
| 1145 | function | `groupSel` |
| 1150 | function | `expandSub` |
| 1154 | function | `libToSub` |
| 1156 | function | `uniqueSub` |
| 1157 | function | `subMenu` |
| 1161 | function | `enterSub` |
| 1167 | function | `leaveSub` |
| 1173 | function | `renderCrumbs` |
| 1181 | function | `curDef` |
| 1182 | function | `publicOf` |
| 1183 | function | `togglePublic` |
| 1191 | function | `propsSub` |
| 1199 | function | `bindSub` |
| 1207 | function | `propsDef` |
| 1222 | function | `bindDef` |
| 1238 | function | `exportDef` |
| 1240 | function | `importDefs` |
| 1251 | function | `palLoad` |
| 1252 | function | `palSave` |
| 1253 | function | `palRecent` |
| 1254 | function | `palItem` |
| 1258 | function | `renderPalette` |
| 1266 | const fn | `isOpen` |
| 1280 | function | `tutorial` |
| 1283 | function | `circuitSig` |
| 1293 | function | `tutorialRef` |
| 1294 | function | `theoryValidity` |
| 1300 | function | `staleBanner` |
| 1303 | function | `bindRestore` |
| 1304 | function | `loadTutorial` |
| 1309 | function | `migrateFile` |
| 1312 | function | `applyProject` |
| 1323 | function | `renderTutorial` |
| 1333 | function | `gallery` |
| 1339 | function | `api` |
| 1340 | function | `paramsOf` |
| 1341 | function | `avgOver` |
| 1344 | function | `simValue` |
| 1350 | function | `lastPP` |
| 1352 | function | `runTheory` |
| 1365 | function | `cmpRows` |
| 1366 | function | `stepsHTML` |
| 1367 | function | `renderTheory` |
| 1399 | function | `rippleDev` |
| 1401 | function | `periodAvgAt` |
| 1403 | function | `samplingTheory` |
| 1412 | const fn | `lastAt` |
| 1434 | function | `polyTheory` |
| 1441 | const fn | `frac` |
| 1470 | function | `lastPeriods` |
| 1471 | function | `evalOrderHTML` |
| 1480 | function | `genScTheory` |
| 1482 | const fn | `Iac` |
| 1490 | function | `shaftModes` |
| 1497 | function | `fbmTheory` |
| 1505 | function | `ieee9Theory` |
| 1512 | function | `lineFdTheory` |
| 1513 | const fn | `lab` |
| 1521 | const fn | `pk` |
| 1528 | function | `trvAfterZero` |
| 1534 | function | `trvSvg` |
| 1536 | const fn | `path` |
| 1543 | function | `trvTerminalTheory` |
| 1556 | function | `trvSlfTheory` |
| 1576 | function | `lightningTheory` |
| 1578 | const fn | `pk` |
| 1593 | function | `netFaultTheory` |
| 1606 | function | `busDqTheory` |
| 1614 | function | `subLegsTheory` |
| 1623 | function | `blocksTheory` |
| 1638 | function | `pcmTheory` |
| 1664 | function | `codeTheory` |
| 1674 | function | `eisTheory` |
| 1676 | const fn | `ser` |
| 1689 | function | `imSteady` |
| 1692 | function | `imPar` |
| 1693 | function | `phaseRms` |
| 1694 | function | `vfTheory` |
| 1707 | function | `focTheory` |
| 1724 | function | `synTheory` |
| 1743 | const fn | `need` |
| 1763 | function | `pmTheory` |
| 1765 | const fn | `mtpa` |
| 1781 | function | `srmTheory` |
| 1796 | const fn | `curve` |
| 1807 | function | `lgTheory` |
| 1818 | const fn | `cr` |
| 1825 | function | `chaosTheory` |
| 1840 | function | `nnCycles` |
| 1843 | function | `genCtlTheory` |
| 1856 | function | `evTheory` |
| 1870 | function | `nnTheory` |
| 1887 | function | `nnGuiCode` |
| 1893 | function | `runNNCompare` |
| 1901 | function | `dcDriveTheory` |
| 1902 | const fn | `per` |
| 1903 | const fn | `cross` |
| 1933 | function | `twModel` |
| 1936 | const fn | `g` |
| 1939 | function | `twLattice` |
| 1946 | const fn | `marks` |
| 1949 | function | `twTheory` |
| 1957 | const fn | `at` |
| 1974 | function | `arTheory` |
| 1994 | function | `impulseMeasure` |
| 1996 | const fn | `cross` |
| 1999 | function | `marxTheory` |
| 2017 | function | `chopModel` |
| 2020 | const fn | `f` |
| 2023 | function | `chopTheory` |
| 2037 | function | `cmp3` |
| 2041 | function | `hvExact` |
| 2042 | function | `hv153Theory` |
| 2068 | function | `besI1e` |
| 2070 | function | `heaviside` |
| 2072 | function | `lossTheory` |
| 2091 | function | `vtBreak` |
| 2092 | function | `vtTheory` |
| 2112 | function | `hvdivTheory` |
| 2114 | const fn | `r` |
| 2126 | function | `scheringTheory` |
| 2127 | const fn | `inv` |
| 2136 | const fn | `sr` |
| 2142 | function | `formulaTheory` |
| 2224 | function | `nodeAvg` |
| 2230 | function | `circuitForMath` |
| 2262 | function | `scheduleMath` |
| 2263 | function | `batteryKey` |
| 2265 | function | `mathChoices` |
| 2266 | const fn | `prim` |
| 2268 | function | `renderMathChoices` |
| 2270 | function | `runTemplate` |
| 2276 | function | `runMath` |
| 2298 | function | `saveLocal` |
| 2299 | function | `saveLocalSoon` |
| 2301 | function | `download` |
| 2302 | function | `exportCSV` |
| 2308 | function | `syncScopeInputs` |
| 2309 | function | `setSpeed` |
| 2312 | function | `openSettings` |
| 2313 | const fn | `sel` |
| 2314 | const fn | `chk` |
| 2335 | function | `boot` |
| 2390 | const fn | `mv` |
| 2391 | const fn | `up` |
| 2392 | const fn | `navOpen` |
| 2403 | const fn | `probeSel` |
| 2465 | function | `renderTheoryLive` |

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
| 341 | method | `noteHTML` |
| 344 | method | `renderLabels` |
| 349 | const fn | `at` |
| 353 | method | `renderWires` |
| 367 | method | `wireSVG` |
| 378 | method | `redrawWire` |
| 379 | method | `pathD` |
| 384 | method | `segDir` |
| 385 | method | `midLabel` |
| 386 | method | `renderPins` |
| 396 | method | `renderSel` |
| 398 | method | `setLive` |
| 400 | method | `updateLive` |
| 409 | method | `drawArrows` |
| 420 | method | `world` |
| 422 | method | `hitAt` |
| 423 | method | `hitOf` |
| 425 | method | `down` |
| 451 | method | `move` |
| 464 | method | `up` |
| 478 | method | `cancelDrag` |
| 479 | method | `hoverPin` |
| 481 | method | `dbl` |
| 482 | method | `menu` |
| 485 | method | `worldNow` |
| 486 | method | `wheel` |
| 493 | method | `letter` |
| 494 | method | `key` |
| 518 | method | `beginDrag` |
| 529 | method | `dragMove` |
| 541 | method | `endDrag` |
| 551 | method | `bakeMove` |
| 556 | method | `dragSeg` |
| 559 | const fn | `stub` |
| 568 | method | `drawMarquee` |
| 571 | method | `marqueeSelect` |
| 574 | const fn | `inside` |
| 581 | method | `escape` |
| 584 | method | `beginPlace` |
| 585 | method | `ghost` |
| 587 | method | `finishPlace` |
| 588 | method | `cancelPlace` |
| 590 | method | `startWire` |
| 591 | method | `startWireFrom` |
| 592 | method | `previewWire` |
| 601 | method | `wireClick` |
| 607 | method | `orthoNext` |
| 608 | method | `finishWire` |
| 624 | method | `cancelWire` |
| 626 | method | `splitWire` |
| 636 | method | `wireNetPin` |
| 638 | method | `canScroll` |

### `web/studio/expr.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | function | `lut` |
| 16 | class | `ExprError` |
| 17 | function | `tokens` |
| 21 | function | `parse` |
| 22 | const fn | `peek` |
| 23 | const fn | `expr` |
| 24 | const fn | `bin` |
| 25 | const fn | `unary` |
| 26 | const fn | `power` |
| 28 | function | `atom` |
| 38 | function | `fold` |
| 46 | function | `compile` |
| 47 | function | `raw` |
| 68 | function | `names` |
| 70 | function | `params` |

### `web/studio/inside.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 11 | const fn | `NL` |
| 14 | const fn | `C` |
| 16 | const fn | `esc` |
| 17 | const fn | `short` |
| 18 | const fn | `can` |
| 20 | const fn | `canDbl` |
| 23 | function | `what` |
| 34 | function | `graph` |
| 37 | const fn | `add` |
| 44 | function | `layout` |
| 48 | const fn | `dfs` |
| 54 | const fn | `visit` |
| 63 | const fn | `bary` |
| 71 | function | `keyOf` |
| 81 | function | `draw` |
| 89 | const fn | `kin` |
| 100 | function | `elValue` |
| 102 | function | `drawEl` |
| 124 | function | `update` |
| 129 | function | `open` |
| 139 | function | `close` |

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
| 20 | const fn | `NLIB` |
| 31 | function | `nnBuild` |
| 43 | function | `nnStep` |
| 51 | const fn | `schedAt` |
| 52 | const fn | `num` |
| 54 | const fn | `numList` |
| 66 | function | `b64of` |
| 68 | function | `fromB64` |
| 71 | function | `snapEncode` |
| 72 | const fn | `num` |
| 73 | function | `enc` |
| 83 | function | `snapRestore` |
| 84 | function | `dec` |
| 95 | function | `smPort` |
| 99 | function | `smOut` |
| 103 | const fn | `genCopy` |
| 105 | function | `csolve` |
| 123 | function | `acInit` |
| 130 | const fn | `ad` |
| 131 | const fn | `y` |
| 172 | const fn | `seq` |
| 187 | const fn | `dad` |
| 211 | class | `NetlistError` |
| 216 | function | `dePiece` |
| 218 | const fn | `F` |
| 219 | function | `deInt` |
| 221 | function | `deFrac` |
| 227 | function | `tlSteady` |
| 229 | const fn | `at` |
| 231 | const fn | `re` |
| 235 | function | `tlElement` |
| 242 | function | `tlmElement` |
| 252 | function | `rcCoef` |
| 257 | function | `arcF` |
| 263 | function | `arcStep` |
| 270 | function | `arcCur` |
| 275 | function | `nlLimit` |
| 276 | function | `nlSolve` |
| 283 | function | `saiSetup` |
| 284 | const fn | `Lc` |
| 288 | function | `saiCur` |
| 296 | function | `saiCommit` |
| 302 | function | `footLink` |
| 310 | function | `arcStart` |
| 311 | const fn | `r` |
| 314 | function | `buildNetlist` |
| 324 | const fn | `union` |
| 339 | const fn | `nm` |
| 358 | const fn | `sn` |
| 362 | const fn | `isJ` |
| 382 | const fn | `lbl` |
| 387 | const fn | `node` |
| 388 | const fn | `internal` |
| 391 | const fn | `mkBlock` |
| 398 | const fn | `add` |
| 399 | const fn | `series` |
| 606 | function | `compileSignals` |
| 637 | function | `f2Phi` |
| 642 | function | `cmpF` |
| 646 | function | `stampM` |
| 648 | function | `luFactor` |
| 654 | function | `luSolve` |
| 661 | class | `Sim` |
| 662 | method | `constructor` |
| 664 | method | `basePeriod` |
| 668 | method | `tlMaxStep` |
| 669 | method | `setStep` |
| 672 | method | `stIndex` |
| 686 | method | `stVec` |
| 687 | method | `stepCfg` |
| 688 | method | `varSetup` |
| 691 | method | `setStepMode` |
| 693 | method | `hGrid` |
| 697 | method | `modeCap` |
| 701 | method | `swEls` |
| 702 | method | `topoKey` |
| 703 | method | `topoInfo` |
| 712 | method | `topoCheck` |
| 729 | method | `lteReset` |
| 730 | method | `ltePush` |
| 734 | method | `lteErr` |
| 744 | method | `varCheck` |
| 759 | method | `note` |
| 762 | method | `stepCheck` |
| 763 | method | `diagnostics` |
| 766 | method | `ringCheck` |
| 775 | method | `stateMap` |
| 777 | method | `stateMap0` |
| 788 | method | `load` |
| 831 | method | `reset` |
| 834 | method | `imStep` |
| 841 | method | `smStep` |
| 843 | method | `srmStep` |
| 844 | method | `srmOutputs` |
| 845 | method | `smOutputs` |
| 849 | method | `genStep` |
| 856 | method | `genOutputs` |
| 861 | method | `genTm` |
| 862 | method | `genEfd` |
| 863 | method | `imSources` |
| 864 | method | `pyBlocks` |
| 874 | method | `pyLazy` |
| 876 | method | `pyUpgrade` |
| 878 | method | `setMethod` |
| 879 | method | `setControl` |
| 881 | method | `setBlock` |
| 883 | method | `setHold` |
| 885 | method | `markChange` |
| 890 | method | `progInit` |
| 891 | method | `addProgram` |
| 893 | method | `progNext` |
| 894 | method | `progDue` |
| 895 | method | `progApply` |
| 910 | method | `evInit` |
| 911 | method | `logEv` |
| 913 | method | `events` |
| 915 | method | `evSwitches` |
| 917 | method | `channelKeys` |
| 936 | method | `allocRecord` |
| 940 | const fn | `A` |
| 946 | method | `V` |
| 947 | method | `elCurrent` |
| 951 | method | `portI` |
| 953 | method | `computeVals` |
| 983 | method | `setRecord` |
| 984 | method | `recordNow` |
| 993 | method | `closePeriod` |
| 1004 | method | `lastPeriod` |
| 1005 | method | `now` |
| 1010 | method | `gateOf` |
| 1016 | method | `rawGate` |
| 1027 | method | `carrier` |
| 1030 | method | `shGrid` |
| 1031 | method | `shNext` |
| 1033 | method | `sampleHolds` |
| 1038 | method | `samples` |
| 1039 | method | `ctrlEdges` |
| 1045 | method | `scrU` |
| 1046 | method | `scrGate` |
| 1047 | method | `scrEdges` |
| 1048 | method | `setFiring` |
| 1049 | method | `compV` |
| 1050 | method | `compI` |
| 1052 | method | `dbl` |
| 1053 | method | `sampleControllers` |
| 1082 | method | `evalBlocks` |
| 1161 | method | `blkCopy` |
| 1164 | method | `blkAnyDue` |
| 1167 | method | `blkDue` |
| 1169 | method | `zcFrac` |
| 1172 | method | `saveState` |
| 1174 | method | `restoreState` |
| 1180 | method | `snapshot` |
| 1181 | method | `restoreSnapshot` |
| 1183 | method | `gateSigPeek` |
| 1186 | method | `gateSig` |
| 1191 | method | `jumpScheds` |
| 1198 | method | `jumpAt` |
| 1199 | method | `values` |
| 1224 | method | `assemble` |
| 1231 | const fn | `g` |
| 1254 | method | `rhs` |
| 1256 | const fn | `J` |
| 1274 | method | `cplLinearize` |
| 1278 | method | `factor` |
| 1284 | method | `spAssemble` |
| 1291 | method | `solveOnce` |
| 1301 | method | `solve` |
| 1319 | method | `nlLinearize` |
| 1322 | method | `check` |
| 1338 | method | `commit` |
| 1361 | method | `initialSolve` |
| 1373 | method | `tlSources` |
| 1377 | method | `tlRecord` |
| 1383 | method | `tlHist` |
| 1389 | method | `tlmG` |
| 1393 | method | `tlmSources` |
| 1405 | method | `tlmRecord` |
| 1418 | method | `tlmHist` |
| 1425 | method | `step` |
| 1427 | const fn | `gs` |
| 1433 | method | `stepCore` |
| 1489 | method | `edgeSolve` |
| 1492 | method | `edgePoint` |
| 1495 | method | `arcGate` |
| 1503 | method | `trRestart` |
| 1507 | method | `nextEvent` |
| 1513 | const fn | `sch` |
| 1535 | method | `spwmCut` |
| 1538 | const fn | `sig` |
| 1543 | method | `run` |
| 1586 | function | `exportForBatch` |
| 1605 | const fn | `ci` |
| 1606 | const fn | `vd` |
| 1607 | const fn | `V` |
| 1608 | const fn | `I` |
| 1609 | const fn | `portRec` |
| 1610 | const fn | `rec` |
| 1626 | const fn | `clkOf` |
| 1652 | function | `sweepPoint` |
| 1657 | function | `setPath` |
| 1663 | function | `eisPoint` |
| 1671 | function | `resume` |

### `web/studio/netlib.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 13 | const fn | `isLib` |
| 15 | const fn | `num` |
| 16 | const fn | `prm` |
| 17 | const fn | `s` |
| 18 | const fn | `isBus` |
| 22 | function | `builder` |
| 26 | const fn | `comp` |
| 27 | const fn | `wire` |
| 28 | const fn | `node` |
| 29 | const fn | `gnd` |
| 31 | const fn | `terms` |
| 39 | function | `gridZ` |
| 50 | function | `gridDef` |
| 52 | const fn | `mat` |
| 61 | const fn | `schedOf` |
| 62 | function | `faultDef` |
| 66 | const fn | `sw` |
| 75 | function | `arcSections` |
| 76 | const fn | `S` |
| 84 | function | `arcChain` |
| 88 | function | `arcBreakerDef` |
| 95 | function | `breakerDef` |
| 112 | function | `xfData` |
| 117 | function | `xfDef` |
| 118 | const fn | `star` |
| 119 | const fn | `ends` |
| 137 | function | `loadDef` |
| 170 | function | `lineData` |
| 174 | function | `lineDef` |
| 176 | const fn | `mat` |
| 199 | function | `aicDef` |
| 227 | const fn | `out` |
| 238 | function | `evcDef` |
| 245 | const fn | `io` |
| 246 | const fn | `E` |
| 295 | const fn | `out` |
| 304 | const fn | `fT` |
| 305 | function | `ctlKit` |
| 307 | const fn | `lag` |
| 309 | const fn | `leadlag` |
| 311 | const fn | `wash` |
| 313 | const fn | `nwLag` |
| 320 | const fn | `sched` |
| 322 | function | `avrDef` |
| 323 | const fn | `io` |
| 324 | const fn | `N` |
| 357 | function | `pssDef` |
| 366 | function | `govDef` |
| 406 | const fn | `out` |
| 413 | function | `footTable` |
| 417 | function | `towerDef` |
| 447 | function | `saiTable` |
| 448 | function | `saiParams` |
| 454 | function | `saiV10` |
| 455 | const fn | `W` |
| 460 | function | `saiFitL1` |
| 465 | function | `saiDef` |
| 472 | const fn | `par` |
| 479 | function | `defOf` |
| 484 | function | `forceImpl` |
| 486 | const fn | `fix` |
| 490 | const fn | `hasLib` |
| 491 | function | `needs` |
| 493 | function | `expand` |
| 495 | const fn | `conv` |
| 502 | function | `warnings` |
| 508 | const fn | `cx` |
| 510 | function | `csolve` |
| 515 | function | `faultCurrents` |
| 534 | function | `behindXF` |
| 543 | function | `layoutDef` |
| 546 | const fn | `isG` |
| 547 | const fn | `isJ` |
| 556 | const fn | `side` |
| 560 | const fn | `bfs` |
| 569 | const fn | `bary` |
| 575 | const fn | `ctr` |
| 576 | const fn | `target` |
| 592 | function | `placedDef` |
| 597 | function | `sidesOf` |

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
| 11 | const fn | `area` |
| 13 | const fn | `I` |
| 14 | const fn | `xe` |
| 15 | const fn | `sb` |
| 16 | const fn | `tx` |
| 17 | const fn | `sl` |
| 19 | const fn | `bl` |
| 40 | const fn | `CONN` |
| 41 | const fn | `isBus` |
| 43 | const fn | `nIO` |
| 44 | const fn | `ioY` |
| 47 | const fn | `codeIO` |
| 48 | const fn | `codeH` |
| 49 | const fn | `pyIns` |
| 52 | const fn | `nnIns` |
| 53 | const fn | `codeDraw` |
| 59 | const fn | `IMPL` |
| 60 | const fn | `CLOCK` |
| 66 | function | `subLayout` |
| 68 | const fn | `len` |
| 74 | function | `subDraw` |
| 754 | function | `noteBox` |
| 757 | function | `defaults` |
| 759 | function | `elPins` |
| 760 | function | `sigPins` |
| 761 | function | `pinsOf` |
| 764 | function | `parseMat` |
| 766 | function | `nPorts` |
| 767 | function | `portY` |
| 768 | function | `portPins` |
| 769 | function | `portBox` |
| 771 | function | `posDef` |
| 773 | function | `symmetric` |
| 774 | function | `matInv` |
| 779 | function | `klMatrix` |
| 790 | function | `kgMatrix` |
| 798 | function | `srmGeo` |
| 800 | function | `srmSpins` |
| 802 | function | `srmPins` |
| 804 | function | `satD` |
| 805 | function | `satDinv` |
| 807 | function | `genSpins` |
| 818 | function | `genTsc` |
| 823 | function | `genCirc2` |
| 824 | const fn | `Fn` |
| 832 | function | `genAxis` |
| 840 | const fn | `classic` |
| 846 | const fn | `plist` |
| 850 | function | `genModel` |
| 856 | const fn | `w` |
| 865 | const fn | `grp` |
| 882 | function | `genGamma` |
| 890 | function | `genDQ` |
| 894 | function | `genSteady` |
| 896 | const fn | `rot` |
| 903 | function | `srmAlignedPsi` |
| 904 | function | `srmModelPsi` |
| 905 | function | `srmTableText` |
| 908 | function | `srmMag` |
| 924 | function | `chkMag` |
| 926 | function | `srmA` |
| 929 | function | `seg` |
| 930 | function | `srmPsi` |
| 932 | function | `srmCur` |
| 934 | function | `srmTorque` |
| 937 | function | `srmCoenergy` |
| 941 | function | `waveShape` |
| 942 | function | `waveAt` |
| 945 | function | `waveMeasure` |
| 948 | const fn | `cross` |
| 954 | function | `waveFit` |
| 955 | const fn | `res` |
| 966 | function | `directWave` |
| 969 | function | `impulseWave` |
| 979 | function | `bewley` |
| 982 | const fn | `at` |
| 988 | function | `movChar` |
| 993 | const fn | `pick` |
| 994 | const fn | `cur` |
| 995 | const fn | `inv` |
| 999 | function | `impulseDesign` |
| 1004 | function | `impulseRoots` |
| 1007 | function | `tlParams` |
| 1016 | function | `tlmData` |
| 1018 | function | `tlmM` |
| 1020 | function | `tlmPin` |
| 1021 | function | `tlmPins` |
| 1023 | function | `tlmKey` |
| 1026 | function | `tlmModel` |
| 1033 | function | `lightningWave` |
| 1040 | function | `pinKind` |
| 1051 | function | `structural` |
| 1058 | function | `pinWidth` |
| 1061 | function | `xf` |
| 1062 | function | `pinPos` |
| 1064 | function | `pinDir` |
| 1069 | function | `cpeParams` |
| 1070 | function | `cpeBank` |
| 1074 | function | `cpeZ` |
| 1075 | function | `cpeZbank` |
| 1076 | function | `boxOf` |
| 1077 | function | `bbox` |
| 1082 | function | `fmtNum` |
| 1086 | function | `eng` |
| 1090 | function | `parseEng` |
| 1093 | function | `parseSched` |
| 1101 | function | `machines` |

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
| 80 | function | `open` |
| 87 | const fn | `index` |
| 94 | function | `session` |
| 95 | function | `setLive` |
| 103 | function | `advance` |
| 115 | function | `closeSession` |
| 118 | function | `tutorial` |
| 120 | function | `tutorials` |
| 122 | function | `handle` |
| 140 | function | `bifPoint` |
| 141 | function | `bifSpec` |
| 145 | function | `bifurcation` |
| 149 | const fn | `json` |

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
| 248 | function | `fromLib` |
| 258 | function | `makeUnique` |
| 264 | function | `closure` |
| 270 | function | `externalRefs` |
| 271 | const fn | `head` |
| 277 | function | `refToPort` |
| 283 | const fn | `setIn` |

### `web/studio/templates.js`

_(χωρίς συναρτήσεις)_

### `web/studio/trv.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 14 | function | `lowT3` |
| 17 | function | `defaultKpp` |
| 19 | function | `rated` |
| 38 | function | `referenceLine` |
| 39 | function | `delayLine` |
| 40 | function | `lineValue` |
| 43 | function | `compare` |
| 50 | function | `slf` |

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
| 896 | function | `aiBlock` |
| 915 | method | `build` |
| 926 | function | `evDrive` |
| 964 | const fn | `fix` |
| 995 | method | `build` |
| 1000 | method | `build` |
| 1009 | method | `build` |
| 1019 | const fn | `y` |
| 1042 | method | `build` |
| 1043 | const fn | `ws` |
| 1082 | method | `build` |
| 1100 | method | `build` |
| 1108 | function | `fbmPoint` |
| 1115 | method | `build` |
| 1134 | function | `smibPoint` |
| 1135 | function | `genCtl` |
| 1137 | const fn | `L` |
| 1165 | method | `build` |
| 1176 | method | `build` |
| 1178 | const fn | `GD` |
| 1179 | const fn | `L` |
| 1181 | const fn | `G` |
| 1182 | const fn | `Ld` |
| 1203 | const fn | `LM` |
| 1204 | function | `tlmPart` |
| 1217 | method | `build` |
| 1236 | method | `build` |
| 1256 | function | `tlmGW` |
| 1258 | const fn | `note` |
| 1268 | method | `build` |
| 1279 | const fn | `tl` |
| 1307 | const fn | `PANE` |
| 1318 | method | `build` |
| 1320 | const fn | `rig` |
| 1339 | method | `build` |
| 1341 | const fn | `rig` |
| 1353 | method | `build` |

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
| 233 | const fn | `setT` |
| 234 | function | `flag` |
| 237 | function | `valueOf` |
| 252 | function | `spark` |
| 258 | const fn | `raw` |
| 261 | const fn | `perIt` |
| 273 | const fn | `FT` |
| 275 | function | `facadeEl` |
| 284 | const fn | `head` |
| 286 | const fn | `mv` |
| 287 | const fn | `up` |
| 296 | function | `renderFacade` |
| 307 | function | `facadeUpdate` |
| 313 | function | `trainOffline` |
| 321 | function | `compare` |

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
| 269 | function | `main` |

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
| 787 | method | `Circuit.jac_gen` |
| 837 | method | `Circuit.gen_out` |
| 857 | method | `Circuit.Vsrc` |
| 873 | method | `Circuit.topo` |
| 883 | method | `Circuit.build` |
| 980 | method | `Circuit.bsrc` |
| 1020 | method | `Circuit.solve_z` |
| 1046 | method | `Circuit.solve_nl` |
| 1088 | method | `Circuit.tl_hist` |
| 1105 | method | `Circuit.tl_sec` |
| 1112 | method | `Circuit.tl_ih` |
| 1116 | method | `Circuit.tl_record` |
| 1135 | method | `Circuit.scr_u` |
| 1139 | method | `Circuit.scr_gate` |
| 1143 | method | `Circuit.scr_edges` |
| 1150 | method | `Circuit.gate_state` |
| 1163 | method | `Circuit.set_gates` |
| 1171 | method | `Circuit.may_turn_on` |
| 1175 | method | `Circuit.tolerances` |
| 1181 | method | `Circuit.consistent` |
| 1223 | method | `Circuit.value` |
| 1259 | method | `Circuit.current` |
| 1302 | method | `Circuit.prime` |
| 1312 | method | `Circuit.sig_in` |
| 1316 | method | `Circuit.sh_grid` |
| 1328 | method | `Circuit.sh_next` |
| 1335 | method | `Circuit.log_ev` |
| 1341 | method | `Circuit.ev_switches` |
| 1350 | method | `Circuit.sh_sample` |
| 1370 | method | `Circuit.sample` |
| 1431 | method | `Circuit.cmp_f` |
| 1437 | method | `Circuit.blk_due` |
| 1448 | method | `Circuit.eval_blocks` |
| 1736 | method | `Circuit.block_events` |
| 1765 | method | `Circuit.next_event` |
| 1832 | function | `_decimate` |
| 1849 | function | `_diagnose` |
| 1900 | function | `simulate` |
| 2145 | function | `batch_sim` |

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

### `engine/recording.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 17 | function | `folder` |
| 24 | function | `_safe` |
| 29 | function | `_path` |
| 38 | function | `start` |
| 52 | function | `append` |
| 69 | function | `handle` |

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
| 683 | method | `Project.sweep` |
| 757 | method | `Project._sweep_meta` |
| 762 | method | `Project.bifurcation` |
| 819 | class | `_SweepFile` |
| 824 | method | `_SweepFile.__init__` |
| 838 | method | `_SweepFile._val` |
| 846 | method | `_SweepFile._read` |
| 865 | method | `_SweepFile._line` |
| 869 | method | `_SweepFile.add` |
| 873 | method | `_SweepFile.close` |
| 879 | function | `_sweep_point` |
| 887 | function | `_as_list` |
| 897 | function | `_spec` |
| 913 | function | `_measures` |
| 936 | function | `_base_T` |
| 943 | function | `_unit` |
| 947 | function | `_matname` |
| 952 | class | `Result` |
| 955 | method | `Result.__init__` |
| 965 | method | `Result.__getitem__` |
| 968 | method | `Result.__repr__` |
| 971 | method | `Result.events_csv` |
| 982 | method | `Result.measure` |
| 1042 | method | `Result.frame` |
| 1051 | method | `Result._meta_lines` |
| 1055 | method | `Result.to_csv` |
| 1068 | method | `Result._vars` |
| 1078 | method | `Result.as_dict` |
| 1082 | method | `Result.to_json` |
| 1086 | method | `Result.to_mat` |
| 1097 | method | `Result.to_parquet` |
| 1105 | method | `Result.to_hdf5` |
| 1111 | method | `Result.save` |
| 1115 | function | `_save` |
| 1122 | class | `SweepResult` |
| 1125 | method | `SweepResult.__init__` |
| 1131 | method | `SweepResult.__repr__` |
| 1134 | method | `SweepResult.column` |
| 1137 | method | `SweepResult.frame` |
| 1144 | method | `SweepResult.to_csv` |
| 1156 | method | `SweepResult.to_json` |
| 1160 | method | `SweepResult.to_mat` |
| 1167 | method | `SweepResult._columns` |
| 1171 | method | `SweepResult.to_parquet` |
| 1177 | method | `SweepResult.to_hdf5` |
| 1182 | method | `SweepResult.save` |
| 1186 | class | `BifurcationResult` |
| 1190 | method | `BifurcationResult.__init__` |
| 1197 | method | `BifurcationResult.__repr__` |
| 1200 | method | `BifurcationResult.changes` |
| 1209 | method | `BifurcationResult.rows` |
| 1213 | method | `BifurcationResult._columns` |
| 1217 | method | `BifurcationResult.frame` |
| 1224 | method | `BifurcationResult.plot` |
| 1227 | method | `BifurcationResult.to_csv` |
| 1238 | method | `BifurcationResult.to_json` |
| 1242 | method | `BifurcationResult.to_mat` |
| 1248 | method | `BifurcationResult.to_parquet` |
| 1253 | method | `BifurcationResult.to_hdf5` |
| 1258 | method | `BifurcationResult.save` |
| 1269 | function | `_el` |
| 1274 | function | `_matrix` |
| 1279 | function | `_ascii` |
| 1286 | function | `_mat_char` |
| 1291 | function | `_mat_value` |
| 1304 | function | `_savemat` |

### `pcl/designer.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 71 | function | `goals` |
| 77 | function | `controllers` |
| 88 | function | `machines` |
| 95 | function | `supported` |
| 99 | function | `rule_for` |
| 108 | function | `_comp` |
| 115 | function | `_num` |
| 122 | function | `_sched_max` |
| 129 | function | `_wire` |
| 135 | function | `_add` |
| 139 | function | `_profile` |
| 147 | function | `compose_gen` |
| 173 | function | `compose_ev` |
| 188 | function | `metrics_ev` |
| 197 | function | `design_ev` |
| 223 | function | `metrics_gen` |
| 250 | function | `compose` |
| 297 | function | `_augment` |
| 369 | function | `_interp` |
| 385 | function | `metrics` |
| 431 | function | `cost` |
| 443 | function | `train_inverse` |
| 486 | function | `candidates` |
| 493 | function | `_label` |
| 504 | function | `_flat` |
| 508 | function | `_unflat` |
| 522 | function | `train_rl` |
| 565 | function | `gen_candidates` |
| 571 | function | `_gen_label` |
| 576 | function | `design_gen` |
| 601 | function | `design` |
| 646 | function | `_episode` |
| 654 | function | `design_rl` |
| 680 | function | `compose_gen_rl` |
| 706 | function | `compose_ev_rl` |
| 718 | function | `_gen_rl_cost` |
| 725 | function | `design_rl_kind` |
| 775 | function | `describe` |
| 790 | function | `_copy` |

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
| 38 | function | `_fmt` |
| 45 | class | `DesignerGUI` |
| 46 | method | `DesignerGUI.__init__` |
| 67 | method | `DesignerGUI._build` |
| 124 | method | `DesignerGUI._columns` |
| 130 | method | `DesignerGUI._build_goals` |
| 154 | method | `DesignerGUI.connect` |
| 168 | method | `DesignerGUI._load_machines` |
| 183 | method | `DesignerGUI.machine` |
| 187 | method | `DesignerGUI._on_machine` |
| 208 | method | `DesignerGUI.params` |
| 219 | method | `DesignerGUI.weights` |
| 222 | method | `DesignerGUI.controller` |
| 227 | method | `DesignerGUI.compose` |
| 244 | method | `DesignerGUI._inv_placeholder` |
| 248 | method | `DesignerGUI.run_design` |
| 268 | method | `DesignerGUI._poll` |
| 293 | method | `DesignerGUI.show` |
| 311 | method | `DesignerGUI._on_row` |
| 321 | method | `DesignerGUI.plot` |
| 381 | method | `DesignerGUI.send` |
| 395 | method | `DesignerGUI.save` |
| 405 | function | `main` |

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
| 987 | function | `typical` |
| 992 | function | `api` |

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
| 94 | method | `App.advance` |
| 100 | method | `App.reset` |
| 104 | method | `App.run` |
| 110 | method | `App.python` |
| 115 | method | `App.show` |
| 133 | method | `App.notify` |
| 137 | function | `connect` |

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
| 1002 | function | `ieee14` |
| 1015 | function | `to_dict` |
| 1028 | function | `from_dict` |
| 1048 | function | `save` |
| 1052 | function | `load` |

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

### `pcl/trv.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 49 | class | `TRVError` |
| 53 | function | `_kv` |
| 60 | function | `_low_t3` |
| 76 | function | `default_kpp` |
| 89 | function | `rated` |
| 204 | function | `reference_line` |
| 215 | function | `delay_line` |
| 220 | function | `line_value` |
| 230 | function | `itrv` |
| 243 | function | `line_data` |
| 252 | function | `slf` |
| 302 | function | `pole_factors` |
| 311 | function | `_prep` |
| 327 | function | `envelope_of` |
| 411 | function | `compare` |

### `pcl/workbench.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 35 | function | `_chan` |
| 45 | function | `prepare` |
| 75 | class | `CircuitPlant` |
| 94 | method | `CircuitPlant.__init__` |
| 113 | method | `CircuitPlant._open` |
| 133 | method | `CircuitPlant._read` |
| 142 | method | `CircuitPlant._advance` |
| 151 | method | `CircuitPlant.set_live` |
| 156 | method | `CircuitPlant.close` |
| 165 | method | `CircuitPlant.__del__` |
| 172 | method | `CircuitPlant.step` |
| 182 | method | `CircuitPlant.output` |
| 187 | method | `CircuitPlant.measured` |
| 197 | method | `CircuitPlant.measured_scale` |
| 206 | method | `CircuitPlant.u_range` |
| 209 | method | `CircuitPlant.y_range` |
| 212 | method | `CircuitPlant.reset_state` |
| 226 | method | `CircuitPlant.clone` |
| 229 | method | `CircuitPlant.viz_state` |
| 238 | method | `CircuitPlant.params_dict` |
| 242 | method | `CircuitPlant.initial_state` |
| 245 | method | `CircuitPlant.deriv` |
| 249 | function | `plant_class` |
| 263 | function | `serve` |
| 332 | class | `LivePlant` |
| 341 | method | `LivePlant._open` |
| 361 | method | `LivePlant._advance` |
| 372 | method | `LivePlant.reset_state` |
| 383 | method | `LivePlant.clone` |
| 386 | method | `LivePlant.close` |
| 390 | function | `live_plant_class` |
| 404 | function | `run_live` |
| 435 | function | `register` |
| 449 | function | `run_scheme` |
| 458 | function | `launch` |
