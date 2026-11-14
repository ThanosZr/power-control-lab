# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 116 |
| `web/studio/app.js` | 2575 |
| `web/studio/bus.js` | 197 |
| `web/studio/editor.js` | 642 |
| `web/studio/expr.js` | 73 |
| `web/studio/inside.js` | 143 |
| `web/studio/library.js` | 56 |
| `web/studio/linedata.js` | 622 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 92 |
| `web/studio/live_worker.js` | 88 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1859 |
| `web/studio/netlib.js` | 695 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 1175 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 87 |
| `web/studio/recview.js` | 69 |
| `web/studio/scenario.js` | 153 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 245 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 113 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 289 |
| `web/studio/templates.js` | 32 |
| `web/studio/trv.js` | 56 |
| `web/studio/tutorials.js` | 1414 |
| `web/studio/units.js` | 156 |
| `web/studio/watch.js` | 339 |
| `pcl/runner.js` | 27 |
| `run.py` | 307 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 2572 |
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
| `engine/recording.py` | 417 |
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
| `pcl/lineconst.py` | 2286 |
| `pcl/linereport.py` | 831 |
| `pcl/link.py` | 150 |
| `pcl/network.py` | 1206 |
| `pcl/plotting.py` | 340 |
| `pcl/trv.py` | 433 |
| `pcl/workbench.py` | 485 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 106 |
| `tests/test_arc.py` | 189 |
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
| `tests/test_gen_ctl.py` | 136 |
| `tests/test_generator.py` | 223 |
| `tests/test_impl.py` | 138 |
| `tests/test_impulse_tools.py` | 150 |
| `tests/test_library.py` | 41 |
| `tests/test_lightning.py` | 78 |
| `tests/test_line_solver.py` | 379 |
| `tests/test_linedata.py` | 661 |
| `tests/test_lines.py` | 355 |
| `tests/test_live_program.py` | 49 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_matlab.py` | 213 |
| `tests/test_netlib.py` | 209 |
| `tests/test_network.py` | 272 |
| `tests/test_nn.py` | 130 |
| `tests/test_pcl.py` | 312 |
| `tests/test_plotting.py` | 113 |
| `tests/test_recording.py` | 209 |
| `tests/test_sparse.py` | 39 |
| `tests/test_sssc.py` | 255 |
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
| `tests/js/arc_cases.js` | 43 |
| `tests/js/batch_requests.js` | 116 |
| `tests/js/bus_cases.js` | 127 |
| `tests/js/cable_tutorial.js` | 10 |
| `tests/js/ev_cases.js` | 37 |
| `tests/js/gen_cases.js` | 78 |
| `tests/js/gen_ctl_cases.js` | 39 |
| `tests/js/impl_cases.js` | 63 |
| `tests/js/library_cases.js` | 11 |
| `tests/js/lightning_cases.js` | 22 |
| `tests/js/line_cases.js` | 17 |
| `tests/js/live_cases.js` | 31 |
| `tests/js/netlib42_cases.js` | 50 |
| `tests/js/netlib_cases.js` | 93 |
| `tests/js/nn_cases.js` | 48 |
| `tests/js/sim_cases.js` | 356 |
| `tests/js/snapshot_cases.js` | 21 |
| `tests/js/sparse_cases.js` | 47 |
| `tests/js/sssc_cases.js` | 67 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/subcircuit_cases.js` | 87 |
| `tests/js/tlm_ss_cases.js` | 18 |
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
| `tests/ui/ev_flow.js` | 112 |
| `tests/ui/facts_flow.js` | 39 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/line_flow.js` | 138 |
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
| 109 | `R` | Αντίσταση |
| 113 | `CPE` | CPE / Warburg |
| 119 | `L` | Πηνίο |
| 123 | `C` | Πυκνωτής |
| 127 | `VDC` | Πηγή DC / μπαταρία |
| 133 | `VAC` | Πηγή AC |
| 137 | `VAC3` | Τριφασική πηγή (Y) |
| 143 | `IDC` | Πηγή ρεύματος |
| 149 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 162 | `D` | Δίοδος |
| 166 | `SCR` | Θυρίστορ (SCR) |
| 177 | `XFMR` | Μετασχηματιστής |
| 185 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 198 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 211 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 221 | `KL` | Συζευγμένα πηνία (N×N) |
| 232 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 239 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 247 | `SG` | Σπινθηριστής (διάκενο) |
| 260 | `CPL` | Φορτίο σταθερής ισχύος |
| 264 | `SH` | Δειγματοληψία και συγκράτηση (S&H) |
| 273 | `GND` | Γείωση |
| 275 | `JUNC` | Κόμβος |
| 276 | `PWM` | PWM / έλεγχος |
| 298 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 309 | `VM` | Βολτόμετρο |
| 311 | `AM` | Αμπερόμετρο (σε σειρά) |
| 314 | `VP` | Probe τάσης (ως προς τη γη) |
| 316 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 318 | `MEAS` | Μέτρηση στοιχείου |
| 321 | `CONST` | Σταθερά / πρόγραμμα |
| 325 | `GAIN` | Κέρδος |
| 327 | `SUM` | Άθροισμα |
| 330 | `MUL` | Γινόμενο |
| 332 | `DIV` | Διαίρεση a/b |
| 335 | `SAT` | Κορεσμός |
| 338 | `CMP` | Συγκριτής |
| 341 | `LOGIC` | Λογική πύλη |
| 344 | `PIB` | PI διακριτός |
| 350 | `UD` | Καθυστέρηση z⁻¹ |
| 353 | `SR` | Μανδαλωτής SR (latch) |
| 356 | `CLK` | Ρολόι (τετραγωνικό) |
| 359 | `RAMP` | Φέρον / ράμπα |
| 364 | `EXPR` | Έκφραση |
| 368 | `PY` | Μπλοκ Python |
| 376 | `AIC` | Ελεγκτής AI (βρόχος με νευρωνικό) |
| 393 | `AVR` | Διέγερση και ρυθμιστής τάσης (AVR: IEEE ST1A, DC1A) |
| 404 | `PSS` | Σταθεροποιητής συστήματος (PSS) |
| 409 | `GOV` | Ρυθμιστής στροφών και στρόβιλος |
| 422 | `EVC` | Πολυκριτηριακός ελεγκτής οχήματος (ταχύτητα → ροπή → ρεύμα) |
| 432 | `NN` | Νευρωνικό δίκτυο (MLP) |
| 495 | `MOD3` | Διαμορφωτής τριφασικός |
| 499 | `FEST` | Εκτιμητής ροής δρομέα |
| 503 | `INT` | Ολοκληρωτής |
| 507 | `LPF` | Βαθυπερατό 1ης τάξης |
| 511 | `F2` | Φίλτρο 2ης τάξης |
| 516 | `RLIM` | Όριο ρυθμού μεταβολής |
| 520 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 524 | `EDGE` | Ανιχνευτής ακμής |
| 528 | `CLARKE` | Clarke abc → αβ |
| 532 | `ICLARKE` | Clarke αβ → abc |
| 536 | `PARK` | Park αβ → dq |
| 539 | `IPARK` | Park dq → αβ |
| 542 | `PLL` | PLL (τριφασικό) |
| 548 | `TAGO` | Ετικέτα: προς (Goto) |
| 551 | `TAGI` | Ετικέτα: από (From) |
| 554 | `DISP` | Ένδειξη |
| 558 | `SUB` | Υποκύκλωμα |
| 561 | `PORT` | Θύρα (ηλεκτρική) |
| 564 | `SIN` | Θύρα εισόδου σήματος |
| 567 | `SOUT` | Θύρα εξόδου σήματος |
| 571 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 576 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 580 | `BSEL` | Επιλογή από δίαυλο |
| 583 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 589 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 600 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 608 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 618 | `ARCX` | Τμήμα τόξου |
| 622 | `ARC` | Διακόπτης με τόξο (μονοφασικός) |
| 629 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 640 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 685 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 698 | `TLM` | Γραμμή από γεωμετρία (CP / FD) |
| 722 | `TOWER` | Πύργος γραμμής (κεραυνοί) |
| 739 | `SAI` | Αλεξικέραυνο ZnO, μοντέλο IEEE (εξαρτάται από τη συχνότητα) |
| 754 | `SAIX` | Αλεξικέραυνο IEEE (συμπαγές) |
| 758 | `RFX` | Γείωση πύργου R(I) (από τη γραμμή του πύργου) |
| 764 | `CHB` | Αρθρωτός βραχίονας: γέφυρες H σε σειρά (CHB) |
| 772 | `NLC` | Διαμόρφωση πλησιέστερης στάθμης (NLC) με ταξινόμηση |
| 778 | `SPLL` | PLL μονοφασικό (SOGI) |
| 785 | `SSSC` | Έλεγχος αρθρωτού SSSC (m-SSSC) |
| 802 | `CHBX` | Αρθρωτός βραχίονας (συμπαγής) |
| 805 | `SPLX` | PLL μονοφασικό (SOGI, συμπαγές) |
| 809 | `NOTE` | Σημείωση (κείμενο στο σχέδιο) |

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
| 1321 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1342 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1366 | `sssc_1ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε γραμμή (μονοφασικό) |
| 1386 | `sssc_3ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε δίκτυο 150 kV (τριφασικό, 4 ζυγοί) |
| 1411 | `empty` | Νέο | Κενό κύκλωμα |

## API του server (`run.py`, `/api/<action>`)

`analyze`, `batch_sim`, `bidir`, `boundary`, `capacitance`, `curves`, `derivation`, `design`, `envelope`, `inverse`, `line_export`, `line_load`, `line_model`, `line_scan`, `line_sens`, `linearize`, `model_proof`, `problem`, `scenario_run`, `scenario_sweep`, `solve`, `studio_math`, `sweep`, `switching`, `template_solve`, `validate_circuit`

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
| 74 | function | `onMessage` |

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
| 66 | function | `memSetting` |
| 67 | const fn | `fmtDur` |
| 68 | function | `memEstimate` |
| 73 | function | `recArchive` |
| 76 | function | `recSettings` |
| 78 | function | `renderRecPanel` |
| 91 | function | `renderRec` |
| 93 | function | `recToggle` |
| 104 | function | `recCollect` |
| 109 | function | `recFlush` |
| 118 | function | `pyPage` |
| 122 | function | `runToEnd` |
| 125 | const fn | `chunk` |
| 127 | function | `loop` |
| 155 | function | `draw` |
| 157 | function | `setText` |
| 158 | function | `navRange` |
| 159 | function | `updateClock` |
| 163 | function | `liveOf` |
| 198 | function | `blkUnit` |
| 205 | function | `outsOf` |
| 207 | const fn | `vecN` |
| 209 | function | `chanLabel` |
| 217 | function | `addProbe` |
| 218 | function | `flash` |
| 231 | function | `signalsFor` |
| 247 | const fn | `fold` |
| 249 | function | `fillSignals` |
| 256 | function | `renderChannels` |
| 274 | function | `requestMeasure` |
| 275 | function | `renderMeasure` |
| 284 | function | `MeasureUnit` |
| 287 | function | `simKey` |
| 288 | function | `perSeries` |
| 289 | function | `refFor` |
| 290 | const fn | `sched` |
| 294 | function | `metricsFor` |
| 298 | function | `metricsRows` |
| 303 | function | `eventMetricsHTML` |
| 305 | function | `renderMetricsPanel` |
| 316 | function | `rawSeries` |
| 319 | function | `autoF1` |
| 323 | function | `evRows` |
| 325 | function | `renderEvents` |
| 327 | const fn | `fv` |
| 333 | function | `evMaxSetting` |
| 334 | function | `eventsJson` |
| 335 | function | `eventsCsv` |
| 337 | function | `renderFFT` |
| 359 | function | `cellZ` |
| 361 | function | `renderEISForm` |
| 362 | const fn | `opt` |
| 366 | function | `runEIS` |
| 374 | function | `drawEIS` |
| 393 | function | `perSamples` |
| 395 | function | `periodText` |
| 396 | const fn | `svgPlot` |
| 398 | function | `pcmMapFn` |
| 400 | const fn | `z` |
| 403 | function | `renderPoincare` |
| 419 | function | `bfParams` |
| 421 | function | `renderBifurcationForm` |
| 427 | function | `runBifurcation` |
| 441 | function | `stopBifurcation` |
| 442 | function | `drawBifurcation` |
| 452 | function | `niceTop` |
| 455 | function | `btStatus` |
| 456 | function | `parseStep` |
| 457 | function | `runBatch` |
| 473 | function | `clearBatch` |
| 475 | function | `meanPL` |
| 477 | function | `ringTrace` |
| 479 | function | `compareHTML` |
| 489 | function | `renderBatch` |
| 494 | function | `parseCSV` |
| 496 | const fn | `cells` |
| 497 | const fn | `num` |
| 503 | const fn | `normName` |
| 504 | function | `renderCsvMap` |
| 505 | const fn | `auto` |
| 511 | function | `applyCsv` |
| 516 | function | `renderCsv` |
| 518 | function | `clearCsv` |
| 520 | function | `sampleCompareHTML` |
| 534 | function | `liveChange` |
| 536 | function | `renderLiveLog` |
| 545 | function | `changesToSchedule` |
| 547 | const fn | `f` |
| 556 | function | `updateLivePanel` |
| 561 | function | `setLivePanel` |
| 564 | function | `switchesOf` |
| 567 | function | `addPulses` |
| 569 | function | `pulseKeys` |
| 570 | function | `refreshControls` |
| 573 | const fn | `phase` |
| 607 | const fn | `setD` |
| 623 | const fn | `setPh` |
| 635 | const fn | `pinNow` |
| 646 | const fn | `pinSet` |
| 658 | function | `pinMap` |
| 659 | function | `pinX` |
| 660 | function | `pinV` |
| 666 | function | `liveParam` |
| 681 | function | `closeInspector` |
| 682 | function | `placePopup` |
| 685 | function | `fieldValue` |
| 690 | function | `fieldHTML` |
| 705 | function | `placeAt` |
| 706 | function | `popupDrag` |
| 715 | function | `nnBlock` |
| 716 | function | `nnBox` |
| 719 | function | `nnLearned` |
| 720 | function | `openInspector` |
| 728 | const fn | `wired` |
| 737 | const fn | `same` |
| 738 | const fn | `apply` |
| 754 | const fn | `wireWidth` |
| 755 | function | `openWireInspector` |
| 771 | const fn | `numOf` |
| 777 | function | `psec` |
| 779 | function | `propsOpen` |
| 780 | function | `setProps` |
| 782 | function | `focusComp` |
| 783 | function | `togglePin` |
| 786 | function | `renderProps` |
| 795 | function | `propsComp` |
| 796 | const fn | `secOf` |
| 798 | const fn | `row` |
| 804 | const fn | `wired` |
| 818 | function | `propsJunc` |
| 820 | function | `propsWire` |
| 826 | function | `propsMulti` |
| 829 | function | `propsCircuit` |
| 839 | const fn | `opt` |
| 849 | const fn | `sv` |
| 855 | const fn | `chk` |
| 866 | function | `bindProps` |
| 897 | function | `diagItems` |
| 906 | function | `renderDiag` |
| 917 | function | `openDiag` |
| 918 | function | `flashComp` |
| 924 | function | `scheduleStepCheck` |
| 925 | function | `runStepCheck` |
| 926 | const fn | `inPage` |
| 933 | function | `syncStepMode` |
| 995 | function | `scenSetCode` |
| 996 | function | `scenState` |
| 997 | function | `scenTab` |
| 998 | function | `scenOut` |
| 999 | function | `scenWorker` |
| 1001 | function | `scenRun` |
| 1009 | function | `scenStop` |
| 1010 | function | `scenDone` |
| 1012 | function | `scenMsg` |
| 1027 | function | `scenBatch` |
| 1032 | function | `scenEval` |
| 1035 | function | `addonDock` |
| 1038 | function | `renderAddons` |
| 1039 | const fn | `vsel` |
| 1053 | function | `knockToast` |
| 1056 | function | `initAddons` |
| 1063 | function | `scenBatchWrite` |
| 1066 | function | `renderScenFiles` |
| 1069 | const fn | `scenNum` |
| 1070 | function | `scenTable` |
| 1071 | function | `scenShow` |
| 1084 | function | `scenTicks` |
| 1085 | function | `scenPlot` |
| 1089 | const fn | `thin` |
| 1096 | const fn | `dig` |
| 1107 | function | `initScenarios` |
| 1114 | function | `liveApply` |
| 1117 | function | `closeMenu` |
| 1118 | function | `openMenu` |
| 1139 | function | `updateHover` |
| 1157 | const fn | `atTop` |
| 1158 | function | `topDoc` |
| 1159 | function | `defsOf` |
| 1160 | const fn | `pid` |
| 1161 | function | `fullDoc` |
| 1163 | function | `commitView` |
| 1165 | function | `viewDiag` |
| 1166 | const fn | `rel` |
| 1169 | function | `compAt` |
| 1174 | function | `allComps` |
| 1175 | const fn | `walk` |
| 1181 | function | `partDef` |
| 1183 | function | `pdefaults` |
| 1184 | function | `subParams` |
| 1186 | function | `placeOk` |
| 1188 | function | `renameChannels` |
| 1190 | function | `levelDoc` |
| 1191 | function | `applyLevel` |
| 1192 | function | `groupSel` |
| 1197 | function | `expandSub` |
| 1201 | function | `libToSub` |
| 1203 | function | `uniqueSub` |
| 1204 | function | `subMenu` |
| 1208 | function | `enterSub` |
| 1214 | function | `leaveSub` |
| 1220 | function | `renderCrumbs` |
| 1228 | function | `curDef` |
| 1229 | function | `publicOf` |
| 1230 | function | `togglePublic` |
| 1238 | function | `propsSub` |
| 1246 | function | `bindSub` |
| 1254 | function | `propsDef` |
| 1269 | function | `bindDef` |
| 1285 | function | `exportDef` |
| 1287 | function | `importDefs` |
| 1298 | function | `palLoad` |
| 1299 | function | `palSave` |
| 1300 | function | `palRecent` |
| 1301 | function | `palItem` |
| 1305 | function | `renderPalette` |
| 1313 | const fn | `isOpen` |
| 1327 | function | `tutorial` |
| 1330 | function | `circuitSig` |
| 1340 | function | `tutorialRef` |
| 1341 | function | `theoryValidity` |
| 1347 | function | `staleBanner` |
| 1350 | function | `bindRestore` |
| 1351 | function | `loadTutorial` |
| 1356 | function | `migrateFile` |
| 1359 | function | `applyProject` |
| 1370 | function | `renderTutorial` |
| 1380 | function | `gallery` |
| 1386 | function | `api` |
| 1387 | function | `paramsOf` |
| 1388 | function | `avgOver` |
| 1391 | function | `simValue` |
| 1397 | function | `lastPP` |
| 1399 | function | `runTheory` |
| 1412 | function | `cmpRows` |
| 1413 | function | `stepsHTML` |
| 1414 | function | `renderTheory` |
| 1446 | function | `rippleDev` |
| 1448 | function | `periodAvgAt` |
| 1450 | function | `samplingTheory` |
| 1459 | const fn | `lastAt` |
| 1481 | function | `polyTheory` |
| 1488 | const fn | `frac` |
| 1517 | function | `lastPeriods` |
| 1518 | function | `evalOrderHTML` |
| 1527 | function | `genScTheory` |
| 1529 | const fn | `Iac` |
| 1537 | function | `shaftModes` |
| 1544 | function | `fbmTheory` |
| 1552 | function | `ieee9Theory` |
| 1560 | function | `schedNow` |
| 1562 | function | `fundOf` |
| 1568 | function | `ssscNet3` |
| 1569 | const fn | `c` |
| 1572 | const fn | `ser` |
| 1573 | const fn | `ln` |
| 1581 | function | `ssscTheory` |
| 1609 | function | `lineFdTheory` |
| 1610 | const fn | `lab` |
| 1618 | const fn | `pk` |
| 1625 | function | `trvAfterZero` |
| 1631 | function | `trvSvg` |
| 1633 | const fn | `path` |
| 1640 | function | `trvTerminalTheory` |
| 1653 | function | `trvSlfTheory` |
| 1673 | function | `lightningTheory` |
| 1675 | const fn | `pk` |
| 1693 | function | `netFaultTheory` |
| 1706 | function | `busDqTheory` |
| 1714 | function | `subLegsTheory` |
| 1723 | function | `blocksTheory` |
| 1738 | function | `pcmTheory` |
| 1764 | function | `codeTheory` |
| 1774 | function | `eisTheory` |
| 1776 | const fn | `ser` |
| 1789 | function | `imSteady` |
| 1792 | function | `imPar` |
| 1793 | function | `phaseRms` |
| 1794 | function | `vfTheory` |
| 1807 | function | `focTheory` |
| 1824 | function | `synTheory` |
| 1843 | const fn | `need` |
| 1863 | function | `pmTheory` |
| 1865 | const fn | `mtpa` |
| 1881 | function | `srmTheory` |
| 1896 | const fn | `curve` |
| 1907 | function | `lgTheory` |
| 1918 | const fn | `cr` |
| 1925 | function | `chaosTheory` |
| 1940 | function | `nnCycles` |
| 1943 | function | `genCtlTheory` |
| 1956 | function | `evTheory` |
| 1970 | function | `nnTheory` |
| 1987 | function | `nnGuiCode` |
| 1993 | function | `runNNCompare` |
| 2001 | function | `dcDriveTheory` |
| 2002 | const fn | `per` |
| 2003 | const fn | `cross` |
| 2033 | function | `twModel` |
| 2036 | const fn | `g` |
| 2039 | function | `twLattice` |
| 2046 | const fn | `marks` |
| 2049 | function | `twTheory` |
| 2057 | const fn | `at` |
| 2074 | function | `arTheory` |
| 2094 | function | `impulseMeasure` |
| 2096 | const fn | `cross` |
| 2099 | function | `marxTheory` |
| 2117 | function | `chopModel` |
| 2120 | const fn | `f` |
| 2123 | function | `chopTheory` |
| 2137 | function | `cmp3` |
| 2141 | function | `hvExact` |
| 2142 | function | `hv153Theory` |
| 2168 | function | `besI1e` |
| 2170 | function | `heaviside` |
| 2172 | function | `lossTheory` |
| 2191 | function | `vtBreak` |
| 2192 | function | `vtTheory` |
| 2212 | function | `hvdivTheory` |
| 2214 | const fn | `r` |
| 2226 | function | `scheringTheory` |
| 2227 | const fn | `inv` |
| 2236 | const fn | `sr` |
| 2242 | function | `formulaTheory` |
| 2325 | function | `nodeAvg` |
| 2331 | function | `circuitForMath` |
| 2363 | function | `scheduleMath` |
| 2364 | function | `batteryKey` |
| 2366 | function | `mathChoices` |
| 2367 | const fn | `prim` |
| 2369 | function | `renderMathChoices` |
| 2371 | function | `runTemplate` |
| 2377 | function | `runMath` |
| 2399 | function | `saveLocal` |
| 2400 | function | `saveLocalSoon` |
| 2402 | function | `download` |
| 2403 | function | `exportCSV` |
| 2409 | function | `syncScopeInputs` |
| 2410 | function | `setSpeed` |
| 2413 | function | `openSettings` |
| 2414 | const fn | `sel` |
| 2415 | const fn | `chk` |
| 2436 | function | `boot` |
| 2496 | const fn | `mv` |
| 2497 | const fn | `up` |
| 2498 | const fn | `navOpen` |
| 2509 | const fn | `probeSel` |
| 2571 | function | `renderTheoryLive` |

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
| 21 | const fn | `esc` |
| 38 | const fn | `isCable` |
| 39 | const fn | `mm` |
| 40 | const fn | `phList` |
| 41 | const fn | `EMPTY_OH` |
| 42 | const fn | `EMPTY_CAB` |
| 43 | const fn | `EMPTY_SEQ` |
| 44 | const fn | `NEW_CABLE` |
| 48 | const fn | `num` |
| 49 | const fn | `fmt` |
| 51 | const fn | `pow10` |
| 52 | const fn | `cfmt` |
| 63 | const fn | `at` |
| 64 | function | `pick` |
| 66 | function | `seriesOf` |
| 67 | const fn | `col` |
| 79 | function | `valOf` |
| 82 | function | `niceStep` |
| 83 | function | `chartSVG` |
| 91 | const fn | `X` |
| 111 | function | `mountChart` |
| 114 | const fn | `wire` |
| 115 | const fn | `px` |
| 117 | const fn | `push` |
| 142 | const fn | `csvq` |
| 143 | const fn | `svgText` |
| 144 | function | `svgPng` |
| 147 | function | `download` |
| 149 | const fn | `b64blob` |
| 153 | const fn | `rhoOf` |
| 154 | function | `expand` |
| 159 | const fn | `saveView` |
| 162 | const fn | `cmap` |
| 165 | function | `mapImage` |
| 171 | function | `ohSVG` |
| 172 | const fn | `X` |
| 215 | function | `sideSVG` |
| 225 | const fn | `layerCol` |
| 226 | function | `cabSVG` |
| 245 | function | `xsSVG` |
| 256 | function | `legendHTML` |
| 261 | function | `fitView` |
| 270 | function | `table` |
| 276 | function | `cableTables` |
| 288 | function | `seqForm` |
| 294 | function | `fileForm` |
| 298 | function | `optsForm` |
| 312 | function | `plot` |
| 314 | const fn | `X` |
| 320 | function | `reportHTML` |
| 338 | function | `matHTML` |
| 341 | function | `tablesHTML` |
| 342 | const fn | `symLab` |
| 373 | function | `onF` |
| 377 | function | `open` |
| 379 | const fn | `norm` |
| 385 | const fn | `close` |
| 386 | const fn | `pars` |
| 387 | const fn | `snap` |
| 388 | const fn | `doUndo` |
| 391 | const fn | `saveData` |
| 392 | const fn | `scanReq` |
| 396 | const fn | `scanOld` |
| 397 | const fn | `render` |
| 408 | const fn | `pane` |
| 465 | const fn | `scanBar` |
| 466 | const fn | `viewPanel` |
| 473 | const fn | `wireCommon` |
| 482 | const fn | `wirePane` |
| 483 | const fn | `wireModel` |
| 486 | const fn | `drawBox` |
| 487 | const fn | `drawNow` |
| 491 | const fn | `wireDraw` |
| 492 | const fn | `pt` |
| 493 | const fn | `world` |
| 508 | const fn | `up` |
| 510 | const fn | `tipHTML` |
| 513 | const fn | `wireData` |
| 568 | const fn | `wireGraphs` |
| 589 | const fn | `wireTables` |
| 597 | const fn | `expReq` |
| 599 | const fn | `wireExport` |
| 614 | function | `compute` |
| 619 | function | `refresh` |

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
| 133 | const fn | `ad` |
| 134 | const fn | `y` |
| 182 | const fn | `seq` |
| 197 | const fn | `dad` |
| 231 | class | `NetlistError` |
| 236 | function | `dePiece` |
| 238 | const fn | `F` |
| 239 | function | `deInt` |
| 241 | function | `deFrac` |
| 247 | function | `tlSteady` |
| 249 | const fn | `at` |
| 251 | const fn | `re` |
| 262 | function | `poleG` |
| 263 | function | `tlmModeY` |
| 268 | const fn | `mm` |
| 275 | function | `tlmAcY` |
| 281 | function | `tlmSteady` |
| 282 | const fn | `vm` |
| 296 | function | `tlElement` |
| 303 | function | `tlmElement` |
| 323 | function | `piLine` |
| 328 | const fn | `shunt` |
| 336 | function | `rcCoef` |
| 341 | function | `arcF` |
| 347 | function | `arcStep` |
| 354 | function | `arcCur` |
| 359 | function | `nlLimit` |
| 360 | function | `nlSolve` |
| 367 | function | `saiSetup` |
| 368 | const fn | `Lc` |
| 372 | function | `saiCur` |
| 380 | function | `saiCommit` |
| 390 | function | `chbCoef` |
| 395 | function | `chbCommit` |
| 402 | function | `chbStates` |
| 407 | function | `nlcStep` |
| 410 | const fn | `full` |
| 426 | function | `footLink` |
| 434 | function | `arcStart` |
| 435 | const fn | `r` |
| 438 | function | `buildNetlist` |
| 448 | const fn | `union` |
| 463 | const fn | `nm` |
| 482 | const fn | `sn` |
| 486 | const fn | `isJ` |
| 507 | const fn | `lbl` |
| 512 | const fn | `node` |
| 513 | const fn | `internal` |
| 516 | const fn | `mkBlock` |
| 523 | const fn | `add` |
| 524 | const fn | `series` |
| 755 | function | `compileSignals` |
| 786 | function | `f2Phi` |
| 791 | function | `cmpF` |
| 795 | function | `stampM` |
| 797 | function | `luFactor` |
| 803 | function | `luSolve` |
| 810 | class | `Sim` |
| 811 | method | `constructor` |
| 813 | method | `basePeriod` |
| 817 | method | `tlMaxStep` |
| 818 | method | `setStep` |
| 821 | method | `stIndex` |
| 836 | method | `stVec` |
| 837 | method | `stepCfg` |
| 838 | method | `varSetup` |
| 841 | method | `setStepMode` |
| 843 | method | `hGrid` |
| 847 | method | `modeCap` |
| 851 | method | `swEls` |
| 852 | method | `topoKey` |
| 853 | method | `topoInfo` |
| 862 | method | `topoCheck` |
| 879 | method | `lteReset` |
| 880 | method | `ltePush` |
| 884 | method | `lteErr` |
| 894 | method | `varCheck` |
| 909 | method | `note` |
| 912 | method | `stepCheck` |
| 913 | method | `diagnostics` |
| 916 | method | `ringCheck` |
| 925 | method | `stateMap` |
| 927 | method | `stateMap0` |
| 938 | method | `load` |
| 981 | method | `reset` |
| 984 | method | `imStep` |
| 991 | method | `smStep` |
| 993 | method | `srmStep` |
| 994 | method | `srmOutputs` |
| 995 | method | `smOutputs` |
| 999 | method | `genStep` |
| 1006 | method | `genOutputs` |
| 1011 | method | `genTm` |
| 1012 | method | `genEfd` |
| 1013 | method | `imSources` |
| 1014 | method | `pyBlocks` |
| 1024 | method | `pyLazy` |
| 1026 | method | `pyUpgrade` |
| 1028 | method | `setMethod` |
| 1029 | method | `setControl` |
| 1031 | method | `setBlock` |
| 1033 | method | `setHold` |
| 1035 | method | `markChange` |
| 1040 | method | `progInit` |
| 1041 | method | `addProgram` |
| 1043 | method | `progNext` |
| 1044 | method | `progDue` |
| 1045 | method | `progApply` |
| 1060 | method | `evInit` |
| 1061 | method | `logEv` |
| 1063 | method | `events` |
| 1065 | method | `evSwitches` |
| 1067 | method | `channelKeys` |
| 1086 | method | `allocRecord` |
| 1092 | const fn | `A` |
| 1100 | method | `V` |
| 1101 | method | `elCurrent` |
| 1105 | method | `portI` |
| 1108 | method | `computeVals` |
| 1138 | method | `setRecord` |
| 1139 | method | `recordNow` |
| 1148 | method | `closePeriod` |
| 1159 | method | `lastPeriod` |
| 1160 | method | `now` |
| 1165 | method | `gateOf` |
| 1171 | method | `rawGate` |
| 1182 | method | `carrier` |
| 1185 | method | `shGrid` |
| 1186 | method | `shNext` |
| 1188 | method | `sampleHolds` |
| 1193 | method | `samples` |
| 1194 | method | `ctrlEdges` |
| 1200 | method | `scrU` |
| 1201 | method | `scrGate` |
| 1202 | method | `scrEdges` |
| 1203 | method | `setFiring` |
| 1204 | method | `compV` |
| 1205 | method | `compI` |
| 1207 | method | `dbl` |
| 1208 | method | `sampleControllers` |
| 1237 | method | `evalBlocks` |
| 1325 | method | `blkCopy` |
| 1328 | method | `blkAnyDue` |
| 1331 | method | `blkDue` |
| 1333 | method | `zcFrac` |
| 1336 | method | `saveState` |
| 1338 | method | `restoreState` |
| 1344 | method | `snapshot` |
| 1345 | method | `restoreSnapshot` |
| 1347 | method | `gateSigPeek` |
| 1350 | method | `gateSig` |
| 1355 | method | `jumpScheds` |
| 1362 | method | `jumpAt` |
| 1363 | method | `values` |
| 1388 | method | `assemble` |
| 1395 | const fn | `g` |
| 1419 | method | `rhs` |
| 1421 | const fn | `J` |
| 1440 | method | `cplLinearize` |
| 1444 | method | `factor` |
| 1450 | method | `spAssemble` |
| 1457 | method | `solveOnce` |
| 1468 | method | `solve` |
| 1486 | method | `nlLinearize` |
| 1489 | method | `check` |
| 1505 | method | `commit` |
| 1529 | method | `initialSolve` |
| 1541 | method | `tlSources` |
| 1545 | method | `tlRecord` |
| 1551 | method | `tlHist` |
| 1557 | method | `tlmG` |
| 1561 | method | `tlmSources` |
| 1573 | method | `tlmRecord` |
| 1586 | method | `tlmHist` |
| 1593 | method | `step` |
| 1595 | const fn | `gs` |
| 1601 | method | `stepCore` |
| 1657 | method | `edgeSolve` |
| 1660 | method | `edgePoint` |
| 1663 | method | `arcGate` |
| 1671 | method | `trRestart` |
| 1675 | method | `nextEvent` |
| 1681 | const fn | `sch` |
| 1703 | method | `spwmCut` |
| 1706 | const fn | `sig` |
| 1711 | method | `run` |
| 1754 | function | `exportForBatch` |
| 1773 | const fn | `hist` |
| 1784 | const fn | `ci` |
| 1785 | const fn | `vd` |
| 1786 | const fn | `V` |
| 1789 | const fn | `linePort` |
| 1791 | const fn | `I` |
| 1792 | const fn | `portRec` |
| 1793 | const fn | `rec` |
| 1810 | const fn | `clkOf` |
| 1836 | function | `sweepPoint` |
| 1841 | function | `setPath` |
| 1847 | function | `eisPoint` |
| 1855 | function | `resume` |

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
| 482 | const fn | `nCells` |
| 483 | function | `chbDef` |
| 485 | const fn | `out` |
| 496 | const fn | `sw` |
| 497 | const fn | `gate` |
| 511 | function | `spllDef` |
| 516 | const fn | `E` |
| 522 | const fn | `w` |
| 534 | function | `ssscDef` |
| 535 | const fn | `io` |
| 536 | const fn | `E` |
| 551 | const fn | `sched` |
| 570 | function | `defOf` |
| 576 | function | `forceImpl` |
| 578 | const fn | `fix` |
| 582 | const fn | `hasLib` |
| 583 | function | `needs` |
| 585 | function | `expand` |
| 587 | const fn | `conv` |
| 595 | function | `warnings` |
| 601 | const fn | `cx` |
| 603 | function | `csolve` |
| 608 | function | `faultCurrents` |
| 627 | function | `behindXF` |
| 636 | function | `layoutDef` |
| 639 | const fn | `isG` |
| 640 | const fn | `isJ` |
| 649 | const fn | `side` |
| 653 | const fn | `bfs` |
| 662 | const fn | `bary` |
| 668 | const fn | `ctr` |
| 669 | const fn | `target` |
| 685 | function | `placedDef` |
| 690 | function | `sidesOf` |

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
| 50 | const fn | `nCells` |
| 51 | const fn | `chbParams` |
| 54 | const fn | `nlcIns` |
| 55 | const fn | `nlcIO` |
| 56 | const fn | `chbxIO` |
| 57 | const fn | `pyIns` |
| 60 | const fn | `nnIns` |
| 61 | const fn | `codeDraw` |
| 67 | const fn | `IMPL` |
| 68 | const fn | `CLOCK` |
| 74 | function | `subLayout` |
| 76 | const fn | `len` |
| 82 | function | `subDraw` |
| 815 | function | `noteBox` |
| 818 | function | `defaults` |
| 820 | function | `elPins` |
| 821 | function | `sigPins` |
| 822 | function | `pinsOf` |
| 825 | function | `parseMat` |
| 827 | function | `nPorts` |
| 828 | function | `portY` |
| 829 | function | `portPins` |
| 830 | function | `portBox` |
| 832 | function | `posDef` |
| 834 | function | `symmetric` |
| 835 | function | `matInv` |
| 840 | function | `klMatrix` |
| 851 | function | `kgMatrix` |
| 859 | function | `srmGeo` |
| 861 | function | `srmSpins` |
| 863 | function | `srmPins` |
| 865 | function | `satD` |
| 866 | function | `satDinv` |
| 868 | function | `genSpins` |
| 879 | function | `genTsc` |
| 884 | function | `genCirc2` |
| 885 | const fn | `Fn` |
| 893 | function | `genAxis` |
| 901 | const fn | `classic` |
| 907 | const fn | `plist` |
| 911 | function | `genModel` |
| 917 | const fn | `w` |
| 926 | const fn | `grp` |
| 943 | function | `genGamma` |
| 951 | function | `genDQ` |
| 955 | function | `genSteady` |
| 957 | const fn | `rot` |
| 964 | function | `srmAlignedPsi` |
| 965 | function | `srmModelPsi` |
| 966 | function | `srmTableText` |
| 969 | function | `srmMag` |
| 985 | function | `chkMag` |
| 987 | function | `srmA` |
| 990 | function | `seg` |
| 991 | function | `srmPsi` |
| 993 | function | `srmCur` |
| 995 | function | `srmTorque` |
| 998 | function | `srmCoenergy` |
| 1002 | function | `waveShape` |
| 1003 | function | `waveAt` |
| 1006 | function | `waveMeasure` |
| 1009 | const fn | `cross` |
| 1015 | function | `waveFit` |
| 1016 | const fn | `res` |
| 1027 | function | `directWave` |
| 1030 | function | `impulseWave` |
| 1041 | function | `bewley` |
| 1044 | const fn | `at` |
| 1050 | function | `movChar` |
| 1055 | const fn | `pick` |
| 1056 | const fn | `cur` |
| 1057 | const fn | `inv` |
| 1061 | function | `impulseDesign` |
| 1066 | function | `impulseRoots` |
| 1069 | function | `tlParams` |
| 1078 | function | `tlmData` |
| 1080 | function | `tlmM` |
| 1083 | function | `tlmPin` |
| 1084 | function | `tlmPins` |
| 1086 | function | `tlmKey` |
| 1092 | function | `tlmModel` |
| 1099 | function | `lightningWave` |
| 1106 | function | `pinKind` |
| 1117 | function | `structural` |
| 1124 | function | `pinWidth` |
| 1127 | function | `xf` |
| 1128 | function | `pinPos` |
| 1130 | function | `pinDir` |
| 1135 | function | `cpeParams` |
| 1136 | function | `cpeBank` |
| 1140 | function | `cpeZ` |
| 1141 | function | `cpeZbank` |
| 1142 | function | `boxOf` |
| 1143 | function | `bbox` |
| 1148 | function | `fmtNum` |
| 1152 | function | `eng` |
| 1156 | function | `parseEng` |
| 1159 | function | `parseSched` |
| 1167 | function | `machines` |

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

### `web/studio/recview.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 7 | const fn | `api` |
| 9 | const fn | `esc` |
| 10 | const fn | `fmt` |
| 11 | function | `niceStep` |
| 13 | function | `list` |
| 21 | function | `open` |
| 22 | const fn | `close` |
| 33 | const fn | `drawCh` |
| 36 | const fn | `X` |
| 37 | function | `paint` |
| 51 | function | `load` |
| 55 | function | `up` |
| 58 | const fn | `curRange` |

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
| 18 | const fn | `isLogic` |
| 19 | function | `niceStep` |
| 20 | function | `fmtT` |
| 21 | const fn | `eng` |
| 23 | class | `Scope` |
| 24 | method | `constructor` |
| 38 | method | `attach` |
| 41 | method | `requestDraw` |
| 43 | method | `colors` |
| 45 | method | `setRefs` |
| 46 | method | `refRange` |
| 50 | method | `histPush` |
| 52 | method | `back` |
| 55 | method | `paneAt` |
| 56 | method | `zoomY` |
| 59 | method | `boxZoom` |
| 64 | method | `nav` |
| 66 | const fn | `clamp` |
| 77 | method | `resize` |
| 80 | method | `unitOf` |
| 84 | method | `resolve` |
| 85 | method | `channels` |
| 86 | method | `addChannel` |
| 89 | method | `removeChannel` |
| 90 | method | `moveChannel` |
| 92 | method | `windowSec` |
| 93 | method | `viewRange` |
| 95 | method | `ringIndex` |
| 96 | method | `ringStart` |
| 98 | method | `eachRaw` |
| 101 | method | `rawCount` |
| 102 | method | `eachPeriod` |
| 103 | method | `valueAt` |
| 106 | method | `stats` |
| 111 | method | `usePeriods` |
| 113 | method | `panTo` |
| 114 | method | `zoomAt` |
| 116 | method | `cursorAt` |
| 118 | method | `plotW` |
| 119 | method | `drawSamples` |
| 125 | method | `envReset` |
| 126 | method | `ingest` |
| 135 | method | `colsOf` |
| 136 | const fn | `put` |
| 145 | method | `archiveFor` |
| 150 | method | `draw` |
| 185 | const fn | `Y` |
| 208 | const fn | `flush` |

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
| 127 | function | `setParam` |
| 139 | function | `paramOf` |
| 145 | function | `sync` |
| 157 | const fn | `uniq` |
| 158 | const fn | `snap` |
| 159 | const fn | `pinKindOf` |
| 160 | function | `newDefName` |
| 166 | function | `create` |
| 206 | const fn | `fix` |
| 214 | function | `expand` |
| 222 | const fn | `loc` |
| 249 | function | `fromLib` |
| 259 | function | `makeUnique` |
| 265 | function | `closure` |
| 271 | function | `externalRefs` |
| 272 | const fn | `head` |
| 278 | function | `refToPort` |
| 284 | const fn | `setIn` |

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
| 1269 | method | `build` |
| 1287 | const fn | `tl` |
| 1315 | const fn | `PANE` |
| 1326 | method | `build` |
| 1328 | const fn | `rig` |
| 1347 | method | `build` |
| 1349 | const fn | `rig` |
| 1365 | function | `ssscChannels` |
| 1374 | method | `build` |
| 1392 | method | `build` |
| 1394 | const fn | `ln` |
| 1412 | method | `build` |

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
| 62 | function | `line_action` |
| 78 | function | `scenario` |
| 107 | class | `Handler` |
| 109 | method | `Handler.local` |
| 113 | method | `Handler.alive` |
| 123 | method | `Handler.body` |
| 132 | method | `Handler.addon_get` |
| 162 | method | `Handler.addon_post` |
| 189 | method | `Handler.send` |
| 205 | method | `Handler.do_GET` |
| 236 | method | `Handler.do_POST` |
| 282 | function | `main` |

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
| 44 | class | `BatchError` |
| 48 | function | `sched_at` |
| 62 | function | `wave_at` |
| 76 | function | `mov_seg` |
| 81 | function | `_powr` |
| 85 | function | `mov_cur` |
| 99 | function | `mov_inv` |
| 111 | function | `arc_F` |
| 120 | function | `arc_start` |
| 140 | function | `sat_d` |
| 147 | function | `sat_d_inv` |
| 159 | function | `f2_phi` |
| 178 | function | `_f` |
| 186 | class | `Ctrl` |
| 190 | method | `Ctrl.__init__` |
| 215 | method | `Ctrl.dbl` |
| 218 | method | `Ctrl.raw` |
| 238 | method | `Ctrl.gate` |
| 250 | method | `Ctrl.carrier_at` |
| 261 | method | `Ctrl.edges` |
| 281 | function | `_lut` |
| 292 | function | `eval_ast` |
| 321 | function | `_nn_fwd` |
| 337 | function | `_nn_learn` |
| 380 | function | `_nn_jac` |
| 399 | function | `_nn_step` |
| 421 | function | `nlc_step` |
| 470 | function | `make_python_block` |
| 501 | class | `Circuit` |
| 502 | method | `Circuit.__init__` |
| 737 | method | `Circuit.R` |
| 740 | method | `Circuit.im_e` |
| 749 | method | `Circuit.im_deriv` |
| 762 | method | `Circuit.sm_cur` |
| 774 | method | `Circuit.sm_ports` |
| 779 | method | `Circuit.sm_deriv` |
| 794 | method | `Circuit.srm_A` |
| 799 | method | `Circuit._seg` |
| 803 | method | `Circuit.srm_cur` |
| 810 | method | `Circuit.srm_torque` |
| 819 | method | `Circuit.srm_currents` |
| 824 | method | `Circuit.srm_deriv` |
| 837 | method | `Circuit.gen_cur` |
| 854 | method | `Circuit.gen_efd` |
| 861 | method | `Circuit.gen_tm` |
| 868 | method | `Circuit.gen_deriv` |
| 886 | method | `Circuit.jac_gen` |
| 938 | method | `Circuit.gen_out` |
| 958 | method | `Circuit.Vsrc` |
| 974 | method | `Circuit.topo` |
| 984 | method | `Circuit.build` |
| 1091 | method | `Circuit.bsrc` |
| 1141 | method | `Circuit.solve_z` |
| 1185 | method | `Circuit.arc_g` |
| 1190 | method | `Circuit.solve_nl` |
| 1232 | method | `Circuit.tl_hist` |
| 1249 | method | `Circuit.tl_sec` |
| 1256 | method | `Circuit.tl_ih` |
| 1260 | method | `Circuit.tl_record` |
| 1281 | method | `Circuit.tlm_setup` |
| 1364 | method | `Circuit.tlm_hist` |
| 1387 | method | `Circuit.tlm_ih` |
| 1400 | method | `Circuit.tlm_force` |
| 1415 | method | `Circuit.tlm_modal` |
| 1434 | method | `Circuit.tlm_record` |
| 1456 | method | `Circuit.scr_u` |
| 1460 | method | `Circuit.scr_gate` |
| 1464 | method | `Circuit.scr_edges` |
| 1471 | method | `Circuit.gate_state` |
| 1484 | method | `Circuit.set_gates` |
| 1492 | method | `Circuit.arc_gates` |
| 1512 | method | `Circuit.may_turn_on` |
| 1516 | method | `Circuit.tolerances` |
| 1522 | method | `Circuit.consistent` |
| 1564 | method | `Circuit.value` |
| 1602 | method | `Circuit.current` |
| 1652 | method | `Circuit.prime` |
| 1662 | method | `Circuit.sig_in` |
| 1666 | method | `Circuit.sh_grid` |
| 1678 | method | `Circuit.sh_next` |
| 1685 | method | `Circuit.log_ev` |
| 1691 | method | `Circuit.ev_switches` |
| 1700 | method | `Circuit.sh_sample` |
| 1720 | method | `Circuit.sample` |
| 1781 | method | `Circuit.cmp_f` |
| 1787 | method | `Circuit.blk_due` |
| 1798 | method | `Circuit.eval_blocks` |
| 2110 | method | `Circuit.block_events` |
| 2139 | method | `Circuit.next_event` |
| 2206 | function | `_decimate` |
| 2223 | function | `_diagnose` |
| 2274 | function | `simulate` |
| 2566 | function | `batch_sim` |

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
| 39 | function | `home` |
| 43 | function | `folder` |
| 49 | function | `settings` |
| 61 | function | `save_settings` |
| 76 | function | `user_folder` |
| 98 | function | `_safe` |
| 103 | function | `_path` |
| 117 | function | `cleanup_temp` |
| 138 | function | `disk` |
| 145 | function | `start` |
| 171 | function | `append` |
| 188 | function | `events` |
| 210 | function | `_extend_index` |
| 245 | function | `info` |
| 254 | function | `read_range` |
| 330 | function | `compress` |
| 353 | function | `listing` |
| 359 | function | `handle` |

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
| 39 | class | `LineError` |
| 43 | function | `_f` |
| 58 | function | `conductors` |
| 123 | function | `phases` |
| 130 | function | `z_internal` |
| 162 | function | `_zi_opts` |
| 197 | function | `z_galloway` |
| 204 | function | `z_int` |
| 226 | function | `_carson_coeffs` |
| 245 | function | `carson_series` |
| 285 | function | `carson_integral` |
| 309 | function | `soil_layers` |
| 338 | function | `_tanh` |
| 343 | function | `_soil_w` |
| 354 | function | `_cosint` |
| 372 | function | `earth_overhead` |
| 385 | function | `_layer_of` |
| 394 | function | `earth_buried` |
| 470 | function | `cables` |
| 517 | function | `_merge_semi` |
| 554 | function | `tube` |
| 580 | function | `pollaczek` |
| 617 | function | `wedepohl` |
| 629 | function | `sea_return` |
| 647 | function | `permittivity` |
| 662 | function | `cable_zy` |
| 774 | function | `_ins_y` |
| 788 | function | `_air_z` |
| 803 | function | `zy` |
| 848 | function | `_groups` |
| 857 | function | `reduce_phases` |
| 872 | function | `_gdiag` |
| 883 | function | `transposition` |
| 906 | function | `transpose_avg` |
| 911 | function | `phase_matrices` |
| 937 | function | `sequence` |
| 948 | function | `ti_matrix` |
| 979 | function | `modal` |
| 985 | function | `q_error` |
| 998 | function | `clarke` |
| 1009 | function | `double_ti` |
| 1021 | function | `balance` |
| 1043 | function | `line_zy` |
| 1051 | function | `model_ti` |
| 1064 | function | `phases_of` |
| 1076 | function | `auto_fti` |
| 1095 | function | `seq_matrices` |
| 1120 | function | `rebuild` |
| 1192 | function | `zy_from_file` |
| 1220 | function | `load_zy_mat` |
| 1246 | function | `vfit` |
| 1301 | function | `rational` |
| 1307 | function | `freqs` |
| 1315 | function | `cp_model` |
| 1352 | function | `lossless_modes` |
| 1400 | function | `_msqrt` |
| 1408 | function | `_fit_a` |
| 1446 | function | `fd_model` |
| 1509 | function | `vary` |
| 1540 | function | `sensitivity` |
| 1557 | function | `report` |
| 1581 | function | `sym_matrix` |
| 1594 | function | `to_sym` |
| 1600 | function | `matrices` |
| 1618 | function | `_phys_currents` |
| 1629 | function | `field` |
| 1663 | function | `bfield` |
| 1688 | function | `telecom` |
| 1716 | function | `_default_sources` |
| 1723 | function | `_modal_admittance` |
| 1737 | function | `_end_tests` |
| 1743 | function | `qerror_tests` |
| 1767 | function | `exact_pi` |
| 1777 | function | `nominal_pi` |
| 1786 | function | `useful` |
| 1814 | function | `_track` |
| 1822 | function | `scan` |
| 1925 | function | `jsonable` |
| 1945 | function | `exact_admittance` |
| 1952 | function | `line_admittance` |
| 1964 | function | `model_admittance` |
| 1985 | function | `nlt_solve` |
| 2053 | function | `_src_laplace` |
| 2069 | function | `_line_y` |
| 2081 | function | `_cp_y` |
| 2106 | function | `_pi_y` |
| 2130 | function | `_half` |
| 2136 | function | `load_data` |
| 2141 | function | `save_data` |
| 2169 | function | `_sc` |
| 2194 | function | `typical` |
| 2199 | function | `_req_data` |
| 2213 | function | `_req_opts` |
| 2225 | function | `api` |

### `pcl/linereport.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 42 | class | `ReportError` |
| 46 | function | `_labels` |
| 51 | function | `series` |
| 101 | function | `_cols` |
| 110 | function | `table` |
| 127 | function | `to_csv` |
| 141 | function | `to_json` |
| 146 | function | `to_mat` |
| 170 | function | `_tri` |
| 175 | function | `_rows` |
| 179 | function | `_untri` |
| 189 | function | `write_exact_pi` |
| 207 | function | `_numbers` |
| 211 | function | `read_exact_pi` |
| 249 | function | `write_nominal_pi` |
| 262 | function | `read_nominal_pi` |
| 280 | function | `_modechar` |
| 284 | function | `write_fd_mod` |
| 310 | function | `read_fd_mod` |
| 353 | function | `write_cp_netlist` |
| 373 | function | `plot` |
| 434 | function | `_svg` |
| 449 | function | `_c` |
| 456 | function | `_mat_html` |
| 467 | function | `_kv_html` |
| 479 | function | `report_html` |
| 570 | function | `_fmt` |
| 580 | function | `report_pdf` |
| 600 | function | `script` |
| 653 | function | `_version` |
| 662 | function | `_phasors` |
| 668 | function | `fields` |
| 701 | function | `_scan_req` |
| 719 | function | `api_scan` |
| 756 | function | `api_sens` |
| 773 | function | `api_load` |
| 794 | function | `api_export` |

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
| 89 | method | `App.line` |
| 95 | method | `App.machines` |
| 99 | method | `App.advance` |
| 105 | method | `App.reset` |
| 109 | method | `App.run` |
| 115 | method | `App.python` |
| 120 | method | `App.show` |
| 138 | method | `App.notify` |
| 142 | function | `connect` |

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
| 221 | method | `Network.sssc` |
| 236 | method | `Network.remove` |
| 239 | method | `Network.element` |
| 246 | method | `Network._zb` |
| 250 | method | `Network._ib` |
| 254 | method | `Network._sc_parts` |
| 389 | method | `Network._t3` |
| 424 | method | `Network.impedances` |
| 432 | method | `Network._index` |
| 436 | method | `Network._ybus` |
| 460 | method | `Network._ratios` |
| 495 | method | `Network.short_circuit` |
| 579 | method | `Network._breaking` |
| 611 | method | `Network.iec60909` |
| 616 | method | `Network._lf_model` |
| 703 | method | `Network._sssc_x` |
| 710 | method | `Network.load_flow` |
| 721 | method | `Network._lf_sssc` |
| 750 | method | `Network._lf` |
| 802 | method | `Network._flows` |
| 827 | method | `Network.to_emt` |
| 907 | function | `_coo` |
| 913 | function | `_zip` |
| 918 | function | `_solve` |
| 929 | function | `_nr` |
| 965 | function | `sssc_placement` |
| 1022 | function | `superposition` |
| 1046 | function | `trv` |
| 1080 | function | `_matrix` |
| 1092 | function | `read_matpower` |
| 1122 | function | `ieee` |
| 1128 | function | `ieee9` |
| 1155 | function | `ieee14` |
| 1168 | function | `to_dict` |
| 1181 | function | `from_dict` |
| 1201 | function | `save` |
| 1205 | function | `load` |

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
