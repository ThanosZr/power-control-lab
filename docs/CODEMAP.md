# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 116 |
| `web/studio/app.js` | 2529 |
| `web/studio/bus.js` | 197 |
| `web/studio/editor.js` | 642 |
| `web/studio/expr.js` | 73 |
| `web/studio/inside.js` | 143 |
| `web/studio/library.js` | 56 |
| `web/studio/linedata.js` | 578 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 92 |
| `web/studio/live_worker.js` | 88 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 1780 |
| `web/studio/netlib.js` | 695 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 1174 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 87 |
| `web/studio/scenario.js` | 153 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 185 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 113 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 289 |
| `web/studio/templates.js` | 32 |
| `web/studio/trv.js` | 56 |
| `web/studio/tutorials.js` | 1406 |
| `web/studio/units.js` | 156 |
| `web/studio/watch.js` | 339 |
| `pcl/runner.js` | 27 |
| `run.py` | 306 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 2363 |
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
| `pcl/lineconst.py` | 2202 |
| `pcl/linereport.py` | 801 |
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
| `tests/test_impl.py` | 137 |
| `tests/test_impulse_tools.py` | 150 |
| `tests/test_library.py` | 41 |
| `tests/test_lightning.py` | 78 |
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
| `tests/test_recording.py` | 75 |
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
| `tests/js/line_cases.js` | 15 |
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
| `tests/ui/facts_flow.js` | 39 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/line_flow.js` | 131 |
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
| 1313 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1334 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1358 | `sssc_1ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε γραμμή (μονοφασικό) |
| 1378 | `sssc_3ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε δίκτυο 150 kV (τριφασικό, 4 ζυγοί) |
| 1403 | `empty` | Νέο | Κενό κύκλωμα |

## API του server (`run.py`, `/api/<action>`)

`analyze`, `batch_sim`, `bidir`, `boundary`, `capacitance`, `curves`, `derivation`, `design`, `envelope`, `inverse`, `line_export`, `line_load`, `line_model`, `line_scan`, `linearize`, `model_proof`, `problem`, `scenario_run`, `scenario_sweep`, `solve`, `studio_math`, `sweep`, `switching`, `template_solve`, `validate_circuit`

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
| 164 | function | `blkUnit` |
| 171 | function | `outsOf` |
| 173 | const fn | `vecN` |
| 175 | function | `chanLabel` |
| 183 | function | `addProbe` |
| 184 | function | `flash` |
| 197 | function | `signalsFor` |
| 213 | const fn | `fold` |
| 215 | function | `fillSignals` |
| 222 | function | `renderChannels` |
| 240 | function | `requestMeasure` |
| 241 | function | `renderMeasure` |
| 250 | function | `MeasureUnit` |
| 253 | function | `simKey` |
| 254 | function | `perSeries` |
| 255 | function | `refFor` |
| 256 | const fn | `sched` |
| 260 | function | `metricsFor` |
| 264 | function | `metricsRows` |
| 269 | function | `eventMetricsHTML` |
| 271 | function | `renderMetricsPanel` |
| 282 | function | `rawSeries` |
| 285 | function | `autoF1` |
| 289 | function | `evRows` |
| 291 | function | `renderEvents` |
| 293 | const fn | `fv` |
| 297 | function | `eventsCsv` |
| 299 | function | `renderFFT` |
| 321 | function | `cellZ` |
| 323 | function | `renderEISForm` |
| 324 | const fn | `opt` |
| 328 | function | `runEIS` |
| 336 | function | `drawEIS` |
| 355 | function | `perSamples` |
| 357 | function | `periodText` |
| 358 | const fn | `svgPlot` |
| 360 | function | `pcmMapFn` |
| 362 | const fn | `z` |
| 365 | function | `renderPoincare` |
| 381 | function | `bfParams` |
| 383 | function | `renderBifurcationForm` |
| 389 | function | `runBifurcation` |
| 403 | function | `stopBifurcation` |
| 404 | function | `drawBifurcation` |
| 414 | function | `niceTop` |
| 417 | function | `btStatus` |
| 418 | function | `parseStep` |
| 419 | function | `runBatch` |
| 435 | function | `clearBatch` |
| 437 | function | `meanPL` |
| 439 | function | `ringTrace` |
| 441 | function | `compareHTML` |
| 451 | function | `renderBatch` |
| 456 | function | `parseCSV` |
| 458 | const fn | `cells` |
| 459 | const fn | `num` |
| 465 | const fn | `normName` |
| 466 | function | `renderCsvMap` |
| 467 | const fn | `auto` |
| 473 | function | `applyCsv` |
| 478 | function | `renderCsv` |
| 480 | function | `clearCsv` |
| 482 | function | `sampleCompareHTML` |
| 496 | function | `liveChange` |
| 498 | function | `renderLiveLog` |
| 507 | function | `changesToSchedule` |
| 509 | const fn | `f` |
| 518 | function | `updateLivePanel` |
| 523 | function | `setLivePanel` |
| 526 | function | `switchesOf` |
| 529 | function | `addPulses` |
| 531 | function | `pulseKeys` |
| 532 | function | `refreshControls` |
| 535 | const fn | `phase` |
| 569 | const fn | `setD` |
| 585 | const fn | `setPh` |
| 597 | const fn | `pinNow` |
| 608 | const fn | `pinSet` |
| 620 | function | `pinMap` |
| 621 | function | `pinX` |
| 622 | function | `pinV` |
| 628 | function | `liveParam` |
| 643 | function | `closeInspector` |
| 644 | function | `placePopup` |
| 647 | function | `fieldValue` |
| 652 | function | `fieldHTML` |
| 667 | function | `placeAt` |
| 668 | function | `popupDrag` |
| 677 | function | `nnBlock` |
| 678 | function | `nnBox` |
| 681 | function | `nnLearned` |
| 682 | function | `openInspector` |
| 690 | const fn | `wired` |
| 699 | const fn | `same` |
| 700 | const fn | `apply` |
| 716 | const fn | `wireWidth` |
| 717 | function | `openWireInspector` |
| 733 | const fn | `numOf` |
| 739 | function | `psec` |
| 741 | function | `propsOpen` |
| 742 | function | `setProps` |
| 744 | function | `focusComp` |
| 745 | function | `togglePin` |
| 748 | function | `renderProps` |
| 757 | function | `propsComp` |
| 758 | const fn | `secOf` |
| 760 | const fn | `row` |
| 766 | const fn | `wired` |
| 780 | function | `propsJunc` |
| 782 | function | `propsWire` |
| 788 | function | `propsMulti` |
| 791 | function | `propsCircuit` |
| 801 | const fn | `opt` |
| 811 | const fn | `sv` |
| 817 | const fn | `chk` |
| 828 | function | `bindProps` |
| 859 | function | `diagItems` |
| 868 | function | `renderDiag` |
| 879 | function | `openDiag` |
| 880 | function | `flashComp` |
| 886 | function | `scheduleStepCheck` |
| 887 | function | `runStepCheck` |
| 888 | const fn | `inPage` |
| 895 | function | `syncStepMode` |
| 957 | function | `scenSetCode` |
| 958 | function | `scenState` |
| 959 | function | `scenTab` |
| 960 | function | `scenOut` |
| 961 | function | `scenWorker` |
| 963 | function | `scenRun` |
| 971 | function | `scenStop` |
| 972 | function | `scenDone` |
| 974 | function | `scenMsg` |
| 989 | function | `scenBatch` |
| 994 | function | `scenEval` |
| 997 | function | `addonDock` |
| 1000 | function | `renderAddons` |
| 1001 | const fn | `vsel` |
| 1015 | function | `knockToast` |
| 1018 | function | `initAddons` |
| 1025 | function | `scenBatchWrite` |
| 1028 | function | `renderScenFiles` |
| 1031 | const fn | `scenNum` |
| 1032 | function | `scenTable` |
| 1033 | function | `scenShow` |
| 1046 | function | `scenTicks` |
| 1047 | function | `scenPlot` |
| 1051 | const fn | `thin` |
| 1058 | const fn | `dig` |
| 1069 | function | `initScenarios` |
| 1076 | function | `liveApply` |
| 1079 | function | `closeMenu` |
| 1080 | function | `openMenu` |
| 1101 | function | `updateHover` |
| 1119 | const fn | `atTop` |
| 1120 | function | `topDoc` |
| 1121 | function | `defsOf` |
| 1122 | const fn | `pid` |
| 1123 | function | `fullDoc` |
| 1125 | function | `commitView` |
| 1127 | function | `viewDiag` |
| 1128 | const fn | `rel` |
| 1131 | function | `compAt` |
| 1136 | function | `allComps` |
| 1137 | const fn | `walk` |
| 1143 | function | `partDef` |
| 1145 | function | `pdefaults` |
| 1146 | function | `subParams` |
| 1148 | function | `placeOk` |
| 1150 | function | `renameChannels` |
| 1152 | function | `levelDoc` |
| 1153 | function | `applyLevel` |
| 1154 | function | `groupSel` |
| 1159 | function | `expandSub` |
| 1163 | function | `libToSub` |
| 1165 | function | `uniqueSub` |
| 1166 | function | `subMenu` |
| 1170 | function | `enterSub` |
| 1176 | function | `leaveSub` |
| 1182 | function | `renderCrumbs` |
| 1190 | function | `curDef` |
| 1191 | function | `publicOf` |
| 1192 | function | `togglePublic` |
| 1200 | function | `propsSub` |
| 1208 | function | `bindSub` |
| 1216 | function | `propsDef` |
| 1231 | function | `bindDef` |
| 1247 | function | `exportDef` |
| 1249 | function | `importDefs` |
| 1260 | function | `palLoad` |
| 1261 | function | `palSave` |
| 1262 | function | `palRecent` |
| 1263 | function | `palItem` |
| 1267 | function | `renderPalette` |
| 1275 | const fn | `isOpen` |
| 1289 | function | `tutorial` |
| 1292 | function | `circuitSig` |
| 1302 | function | `tutorialRef` |
| 1303 | function | `theoryValidity` |
| 1309 | function | `staleBanner` |
| 1312 | function | `bindRestore` |
| 1313 | function | `loadTutorial` |
| 1318 | function | `migrateFile` |
| 1321 | function | `applyProject` |
| 1332 | function | `renderTutorial` |
| 1342 | function | `gallery` |
| 1348 | function | `api` |
| 1349 | function | `paramsOf` |
| 1350 | function | `avgOver` |
| 1353 | function | `simValue` |
| 1359 | function | `lastPP` |
| 1361 | function | `runTheory` |
| 1374 | function | `cmpRows` |
| 1375 | function | `stepsHTML` |
| 1376 | function | `renderTheory` |
| 1408 | function | `rippleDev` |
| 1410 | function | `periodAvgAt` |
| 1412 | function | `samplingTheory` |
| 1421 | const fn | `lastAt` |
| 1443 | function | `polyTheory` |
| 1450 | const fn | `frac` |
| 1479 | function | `lastPeriods` |
| 1480 | function | `evalOrderHTML` |
| 1489 | function | `genScTheory` |
| 1491 | const fn | `Iac` |
| 1499 | function | `shaftModes` |
| 1506 | function | `fbmTheory` |
| 1514 | function | `ieee9Theory` |
| 1522 | function | `schedNow` |
| 1524 | function | `fundOf` |
| 1530 | function | `ssscNet3` |
| 1531 | const fn | `c` |
| 1534 | const fn | `ser` |
| 1535 | const fn | `ln` |
| 1543 | function | `ssscTheory` |
| 1571 | function | `lineFdTheory` |
| 1572 | const fn | `lab` |
| 1580 | const fn | `pk` |
| 1587 | function | `trvAfterZero` |
| 1593 | function | `trvSvg` |
| 1595 | const fn | `path` |
| 1602 | function | `trvTerminalTheory` |
| 1615 | function | `trvSlfTheory` |
| 1635 | function | `lightningTheory` |
| 1637 | const fn | `pk` |
| 1652 | function | `netFaultTheory` |
| 1665 | function | `busDqTheory` |
| 1673 | function | `subLegsTheory` |
| 1682 | function | `blocksTheory` |
| 1697 | function | `pcmTheory` |
| 1723 | function | `codeTheory` |
| 1733 | function | `eisTheory` |
| 1735 | const fn | `ser` |
| 1748 | function | `imSteady` |
| 1751 | function | `imPar` |
| 1752 | function | `phaseRms` |
| 1753 | function | `vfTheory` |
| 1766 | function | `focTheory` |
| 1783 | function | `synTheory` |
| 1802 | const fn | `need` |
| 1822 | function | `pmTheory` |
| 1824 | const fn | `mtpa` |
| 1840 | function | `srmTheory` |
| 1855 | const fn | `curve` |
| 1866 | function | `lgTheory` |
| 1877 | const fn | `cr` |
| 1884 | function | `chaosTheory` |
| 1899 | function | `nnCycles` |
| 1902 | function | `genCtlTheory` |
| 1915 | function | `evTheory` |
| 1929 | function | `nnTheory` |
| 1946 | function | `nnGuiCode` |
| 1952 | function | `runNNCompare` |
| 1960 | function | `dcDriveTheory` |
| 1961 | const fn | `per` |
| 1962 | const fn | `cross` |
| 1992 | function | `twModel` |
| 1995 | const fn | `g` |
| 1998 | function | `twLattice` |
| 2005 | const fn | `marks` |
| 2008 | function | `twTheory` |
| 2016 | const fn | `at` |
| 2033 | function | `arTheory` |
| 2053 | function | `impulseMeasure` |
| 2055 | const fn | `cross` |
| 2058 | function | `marxTheory` |
| 2076 | function | `chopModel` |
| 2079 | const fn | `f` |
| 2082 | function | `chopTheory` |
| 2096 | function | `cmp3` |
| 2100 | function | `hvExact` |
| 2101 | function | `hv153Theory` |
| 2127 | function | `besI1e` |
| 2129 | function | `heaviside` |
| 2131 | function | `lossTheory` |
| 2150 | function | `vtBreak` |
| 2151 | function | `vtTheory` |
| 2171 | function | `hvdivTheory` |
| 2173 | const fn | `r` |
| 2185 | function | `scheringTheory` |
| 2186 | const fn | `inv` |
| 2195 | const fn | `sr` |
| 2201 | function | `formulaTheory` |
| 2284 | function | `nodeAvg` |
| 2290 | function | `circuitForMath` |
| 2322 | function | `scheduleMath` |
| 2323 | function | `batteryKey` |
| 2325 | function | `mathChoices` |
| 2326 | const fn | `prim` |
| 2328 | function | `renderMathChoices` |
| 2330 | function | `runTemplate` |
| 2336 | function | `runMath` |
| 2358 | function | `saveLocal` |
| 2359 | function | `saveLocalSoon` |
| 2361 | function | `download` |
| 2362 | function | `exportCSV` |
| 2368 | function | `syncScopeInputs` |
| 2369 | function | `setSpeed` |
| 2372 | function | `openSettings` |
| 2373 | const fn | `sel` |
| 2374 | const fn | `chk` |
| 2395 | function | `boot` |
| 2450 | const fn | `mv` |
| 2451 | const fn | `up` |
| 2452 | const fn | `navOpen` |
| 2463 | const fn | `probeSel` |
| 2525 | function | `renderTheoryLive` |

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
| 90 | const fn | `X` |
| 110 | function | `mountChart` |
| 113 | const fn | `wire` |
| 114 | const fn | `px` |
| 134 | const fn | `csvq` |
| 135 | const fn | `svgText` |
| 136 | function | `svgPng` |
| 139 | function | `download` |
| 141 | const fn | `b64blob` |
| 145 | const fn | `rhoOf` |
| 146 | function | `expand` |
| 151 | const fn | `saveView` |
| 154 | const fn | `cmap` |
| 157 | function | `mapImage` |
| 163 | function | `ohSVG` |
| 164 | const fn | `X` |
| 207 | function | `sideSVG` |
| 217 | const fn | `layerCol` |
| 218 | function | `cabSVG` |
| 237 | function | `xsSVG` |
| 248 | function | `legendHTML` |
| 253 | function | `fitView` |
| 262 | function | `table` |
| 268 | function | `cableTables` |
| 280 | function | `seqForm` |
| 286 | function | `fileForm` |
| 290 | function | `optsForm` |
| 303 | function | `plot` |
| 305 | const fn | `X` |
| 311 | function | `reportHTML` |
| 329 | function | `matHTML` |
| 332 | function | `tablesHTML` |
| 333 | const fn | `symLab` |
| 357 | function | `open` |
| 359 | const fn | `norm` |
| 363 | const fn | `close` |
| 364 | const fn | `pars` |
| 365 | const fn | `snap` |
| 366 | const fn | `doUndo` |
| 369 | const fn | `saveData` |
| 370 | const fn | `scanReq` |
| 374 | const fn | `scanOld` |
| 375 | const fn | `render` |
| 386 | const fn | `pane` |
| 434 | const fn | `scanBar` |
| 435 | const fn | `viewPanel` |
| 442 | const fn | `wireCommon` |
| 451 | const fn | `wirePane` |
| 452 | const fn | `wireModel` |
| 455 | const fn | `drawBox` |
| 456 | const fn | `drawNow` |
| 460 | const fn | `wireDraw` |
| 461 | const fn | `pt` |
| 462 | const fn | `world` |
| 477 | const fn | `up` |
| 479 | const fn | `tipHTML` |
| 482 | const fn | `wireData` |
| 536 | const fn | `wireGraphs` |
| 546 | const fn | `wireTables` |
| 553 | const fn | `expReq` |
| 555 | const fn | `wireExport` |
| 570 | function | `compute` |
| 575 | function | `refresh` |

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
| 177 | const fn | `seq` |
| 192 | const fn | `dad` |
| 221 | class | `NetlistError` |
| 226 | function | `dePiece` |
| 228 | const fn | `F` |
| 229 | function | `deInt` |
| 231 | function | `deFrac` |
| 237 | function | `tlSteady` |
| 239 | const fn | `at` |
| 241 | const fn | `re` |
| 245 | function | `tlElement` |
| 252 | function | `tlmElement` |
| 272 | function | `piLine` |
| 277 | const fn | `shunt` |
| 285 | function | `rcCoef` |
| 290 | function | `arcF` |
| 296 | function | `arcStep` |
| 303 | function | `arcCur` |
| 308 | function | `nlLimit` |
| 309 | function | `nlSolve` |
| 316 | function | `saiSetup` |
| 317 | const fn | `Lc` |
| 321 | function | `saiCur` |
| 329 | function | `saiCommit` |
| 339 | function | `chbCoef` |
| 344 | function | `chbCommit` |
| 351 | function | `chbStates` |
| 356 | function | `nlcStep` |
| 359 | const fn | `full` |
| 375 | function | `footLink` |
| 383 | function | `arcStart` |
| 384 | const fn | `r` |
| 387 | function | `buildNetlist` |
| 397 | const fn | `union` |
| 412 | const fn | `nm` |
| 431 | const fn | `sn` |
| 435 | const fn | `isJ` |
| 456 | const fn | `lbl` |
| 461 | const fn | `node` |
| 462 | const fn | `internal` |
| 465 | const fn | `mkBlock` |
| 472 | const fn | `add` |
| 473 | const fn | `series` |
| 693 | function | `compileSignals` |
| 724 | function | `f2Phi` |
| 729 | function | `cmpF` |
| 733 | function | `stampM` |
| 735 | function | `luFactor` |
| 741 | function | `luSolve` |
| 748 | class | `Sim` |
| 749 | method | `constructor` |
| 751 | method | `basePeriod` |
| 755 | method | `tlMaxStep` |
| 756 | method | `setStep` |
| 759 | method | `stIndex` |
| 774 | method | `stVec` |
| 775 | method | `stepCfg` |
| 776 | method | `varSetup` |
| 779 | method | `setStepMode` |
| 781 | method | `hGrid` |
| 785 | method | `modeCap` |
| 789 | method | `swEls` |
| 790 | method | `topoKey` |
| 791 | method | `topoInfo` |
| 800 | method | `topoCheck` |
| 817 | method | `lteReset` |
| 818 | method | `ltePush` |
| 822 | method | `lteErr` |
| 832 | method | `varCheck` |
| 847 | method | `note` |
| 850 | method | `stepCheck` |
| 851 | method | `diagnostics` |
| 854 | method | `ringCheck` |
| 863 | method | `stateMap` |
| 865 | method | `stateMap0` |
| 876 | method | `load` |
| 919 | method | `reset` |
| 922 | method | `imStep` |
| 929 | method | `smStep` |
| 931 | method | `srmStep` |
| 932 | method | `srmOutputs` |
| 933 | method | `smOutputs` |
| 937 | method | `genStep` |
| 944 | method | `genOutputs` |
| 949 | method | `genTm` |
| 950 | method | `genEfd` |
| 951 | method | `imSources` |
| 952 | method | `pyBlocks` |
| 962 | method | `pyLazy` |
| 964 | method | `pyUpgrade` |
| 966 | method | `setMethod` |
| 967 | method | `setControl` |
| 969 | method | `setBlock` |
| 971 | method | `setHold` |
| 973 | method | `markChange` |
| 978 | method | `progInit` |
| 979 | method | `addProgram` |
| 981 | method | `progNext` |
| 982 | method | `progDue` |
| 983 | method | `progApply` |
| 998 | method | `evInit` |
| 999 | method | `logEv` |
| 1001 | method | `events` |
| 1003 | method | `evSwitches` |
| 1005 | method | `channelKeys` |
| 1024 | method | `allocRecord` |
| 1028 | const fn | `A` |
| 1034 | method | `V` |
| 1035 | method | `elCurrent` |
| 1039 | method | `portI` |
| 1041 | method | `computeVals` |
| 1071 | method | `setRecord` |
| 1072 | method | `recordNow` |
| 1081 | method | `closePeriod` |
| 1092 | method | `lastPeriod` |
| 1093 | method | `now` |
| 1098 | method | `gateOf` |
| 1104 | method | `rawGate` |
| 1115 | method | `carrier` |
| 1118 | method | `shGrid` |
| 1119 | method | `shNext` |
| 1121 | method | `sampleHolds` |
| 1126 | method | `samples` |
| 1127 | method | `ctrlEdges` |
| 1133 | method | `scrU` |
| 1134 | method | `scrGate` |
| 1135 | method | `scrEdges` |
| 1136 | method | `setFiring` |
| 1137 | method | `compV` |
| 1138 | method | `compI` |
| 1140 | method | `dbl` |
| 1141 | method | `sampleControllers` |
| 1170 | method | `evalBlocks` |
| 1258 | method | `blkCopy` |
| 1261 | method | `blkAnyDue` |
| 1264 | method | `blkDue` |
| 1266 | method | `zcFrac` |
| 1269 | method | `saveState` |
| 1271 | method | `restoreState` |
| 1277 | method | `snapshot` |
| 1278 | method | `restoreSnapshot` |
| 1280 | method | `gateSigPeek` |
| 1283 | method | `gateSig` |
| 1288 | method | `jumpScheds` |
| 1295 | method | `jumpAt` |
| 1296 | method | `values` |
| 1321 | method | `assemble` |
| 1328 | const fn | `g` |
| 1352 | method | `rhs` |
| 1354 | const fn | `J` |
| 1373 | method | `cplLinearize` |
| 1377 | method | `factor` |
| 1383 | method | `spAssemble` |
| 1390 | method | `solveOnce` |
| 1401 | method | `solve` |
| 1419 | method | `nlLinearize` |
| 1422 | method | `check` |
| 1438 | method | `commit` |
| 1462 | method | `initialSolve` |
| 1474 | method | `tlSources` |
| 1478 | method | `tlRecord` |
| 1484 | method | `tlHist` |
| 1490 | method | `tlmG` |
| 1494 | method | `tlmSources` |
| 1506 | method | `tlmRecord` |
| 1519 | method | `tlmHist` |
| 1526 | method | `step` |
| 1528 | const fn | `gs` |
| 1534 | method | `stepCore` |
| 1590 | method | `edgeSolve` |
| 1593 | method | `edgePoint` |
| 1596 | method | `arcGate` |
| 1604 | method | `trRestart` |
| 1608 | method | `nextEvent` |
| 1614 | const fn | `sch` |
| 1636 | method | `spwmCut` |
| 1639 | const fn | `sig` |
| 1644 | method | `run` |
| 1687 | function | `exportForBatch` |
| 1709 | const fn | `ci` |
| 1710 | const fn | `vd` |
| 1711 | const fn | `V` |
| 1712 | const fn | `I` |
| 1713 | const fn | `portRec` |
| 1714 | const fn | `rec` |
| 1731 | const fn | `clkOf` |
| 1757 | function | `sweepPoint` |
| 1762 | function | `setPath` |
| 1768 | function | `eisPoint` |
| 1776 | function | `resume` |

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
| 1040 | function | `bewley` |
| 1043 | const fn | `at` |
| 1049 | function | `movChar` |
| 1054 | const fn | `pick` |
| 1055 | const fn | `cur` |
| 1056 | const fn | `inv` |
| 1060 | function | `impulseDesign` |
| 1065 | function | `impulseRoots` |
| 1068 | function | `tlParams` |
| 1077 | function | `tlmData` |
| 1079 | function | `tlmM` |
| 1082 | function | `tlmPin` |
| 1083 | function | `tlmPins` |
| 1085 | function | `tlmKey` |
| 1091 | function | `tlmModel` |
| 1098 | function | `lightningWave` |
| 1105 | function | `pinKind` |
| 1116 | function | `structural` |
| 1123 | function | `pinWidth` |
| 1126 | function | `xf` |
| 1127 | function | `pinPos` |
| 1129 | function | `pinDir` |
| 1134 | function | `cpeParams` |
| 1135 | function | `cpeBank` |
| 1139 | function | `cpeZ` |
| 1140 | function | `cpeZbank` |
| 1141 | function | `boxOf` |
| 1142 | function | `bbox` |
| 1147 | function | `fmtNum` |
| 1151 | function | `eng` |
| 1155 | function | `parseEng` |
| 1158 | function | `parseSched` |
| 1166 | function | `machines` |

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
| 1268 | method | `build` |
| 1279 | const fn | `tl` |
| 1307 | const fn | `PANE` |
| 1318 | method | `build` |
| 1320 | const fn | `rig` |
| 1339 | method | `build` |
| 1341 | const fn | `rig` |
| 1357 | function | `ssscChannels` |
| 1366 | method | `build` |
| 1384 | method | `build` |
| 1386 | const fn | `ln` |
| 1404 | method | `build` |

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
| 77 | function | `scenario` |
| 106 | class | `Handler` |
| 108 | method | `Handler.local` |
| 112 | method | `Handler.alive` |
| 122 | method | `Handler.body` |
| 131 | method | `Handler.addon_get` |
| 161 | method | `Handler.addon_post` |
| 188 | method | `Handler.send` |
| 204 | method | `Handler.do_GET` |
| 235 | method | `Handler.do_POST` |
| 281 | function | `main` |

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
| 734 | method | `Circuit.R` |
| 737 | method | `Circuit.im_e` |
| 746 | method | `Circuit.im_deriv` |
| 759 | method | `Circuit.sm_cur` |
| 771 | method | `Circuit.sm_ports` |
| 776 | method | `Circuit.sm_deriv` |
| 791 | method | `Circuit.srm_A` |
| 796 | method | `Circuit._seg` |
| 800 | method | `Circuit.srm_cur` |
| 807 | method | `Circuit.srm_torque` |
| 816 | method | `Circuit.srm_currents` |
| 821 | method | `Circuit.srm_deriv` |
| 834 | method | `Circuit.gen_cur` |
| 851 | method | `Circuit.gen_efd` |
| 858 | method | `Circuit.gen_tm` |
| 865 | method | `Circuit.gen_deriv` |
| 883 | method | `Circuit.jac_gen` |
| 933 | method | `Circuit.gen_out` |
| 953 | method | `Circuit.Vsrc` |
| 969 | method | `Circuit.topo` |
| 979 | method | `Circuit.build` |
| 1076 | method | `Circuit.bsrc` |
| 1116 | method | `Circuit.solve_z` |
| 1160 | method | `Circuit.arc_g` |
| 1165 | method | `Circuit.solve_nl` |
| 1207 | method | `Circuit.tl_hist` |
| 1224 | method | `Circuit.tl_sec` |
| 1231 | method | `Circuit.tl_ih` |
| 1235 | method | `Circuit.tl_record` |
| 1254 | method | `Circuit.scr_u` |
| 1258 | method | `Circuit.scr_gate` |
| 1262 | method | `Circuit.scr_edges` |
| 1269 | method | `Circuit.gate_state` |
| 1282 | method | `Circuit.set_gates` |
| 1290 | method | `Circuit.arc_gates` |
| 1310 | method | `Circuit.may_turn_on` |
| 1314 | method | `Circuit.tolerances` |
| 1320 | method | `Circuit.consistent` |
| 1362 | method | `Circuit.value` |
| 1400 | method | `Circuit.current` |
| 1445 | method | `Circuit.prime` |
| 1455 | method | `Circuit.sig_in` |
| 1459 | method | `Circuit.sh_grid` |
| 1471 | method | `Circuit.sh_next` |
| 1478 | method | `Circuit.log_ev` |
| 1484 | method | `Circuit.ev_switches` |
| 1493 | method | `Circuit.sh_sample` |
| 1513 | method | `Circuit.sample` |
| 1574 | method | `Circuit.cmp_f` |
| 1580 | method | `Circuit.blk_due` |
| 1591 | method | `Circuit.eval_blocks` |
| 1903 | method | `Circuit.block_events` |
| 1932 | method | `Circuit.next_event` |
| 1999 | function | `_decimate` |
| 2016 | function | `_diagnose` |
| 2067 | function | `simulate` |
| 2357 | function | `batch_sim` |

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
| 111 | function | `phases` |
| 118 | function | `z_internal` |
| 150 | function | `_zi_opts` |
| 185 | function | `z_galloway` |
| 192 | function | `z_int` |
| 214 | function | `_carson_coeffs` |
| 233 | function | `carson_series` |
| 273 | function | `carson_integral` |
| 297 | function | `soil_layers` |
| 326 | function | `_tanh` |
| 331 | function | `_soil_w` |
| 342 | function | `_cosint` |
| 360 | function | `earth_overhead` |
| 373 | function | `_layer_of` |
| 382 | function | `earth_buried` |
| 458 | function | `cables` |
| 505 | function | `_merge_semi` |
| 542 | function | `tube` |
| 568 | function | `pollaczek` |
| 605 | function | `wedepohl` |
| 617 | function | `sea_return` |
| 635 | function | `permittivity` |
| 650 | function | `cable_zy` |
| 762 | function | `_ins_y` |
| 776 | function | `_air_z` |
| 791 | function | `zy` |
| 836 | function | `_groups` |
| 845 | function | `reduce_phases` |
| 860 | function | `_gdiag` |
| 871 | function | `transposition` |
| 894 | function | `transpose_avg` |
| 899 | function | `phase_matrices` |
| 925 | function | `sequence` |
| 936 | function | `ti_matrix` |
| 967 | function | `modal` |
| 973 | function | `q_error` |
| 986 | function | `clarke` |
| 997 | function | `double_ti` |
| 1009 | function | `balance` |
| 1031 | function | `line_zy` |
| 1039 | function | `model_ti` |
| 1052 | function | `phases_of` |
| 1064 | function | `auto_fti` |
| 1083 | function | `seq_matrices` |
| 1108 | function | `rebuild` |
| 1180 | function | `zy_from_file` |
| 1208 | function | `load_zy_mat` |
| 1234 | function | `vfit` |
| 1289 | function | `rational` |
| 1295 | function | `freqs` |
| 1303 | function | `cp_model` |
| 1340 | function | `lossless_modes` |
| 1388 | function | `_msqrt` |
| 1396 | function | `_fit_a` |
| 1434 | function | `fd_model` |
| 1494 | function | `report` |
| 1518 | function | `sym_matrix` |
| 1531 | function | `to_sym` |
| 1537 | function | `matrices` |
| 1555 | function | `_phys_currents` |
| 1566 | function | `field` |
| 1600 | function | `bfield` |
| 1625 | function | `telecom` |
| 1653 | function | `_default_sources` |
| 1660 | function | `_modal_admittance` |
| 1674 | function | `_end_tests` |
| 1680 | function | `qerror_tests` |
| 1704 | function | `exact_pi` |
| 1714 | function | `nominal_pi` |
| 1723 | function | `useful` |
| 1751 | function | `_track` |
| 1759 | function | `scan` |
| 1862 | function | `jsonable` |
| 1882 | function | `exact_admittance` |
| 1889 | function | `line_admittance` |
| 1901 | function | `model_admittance` |
| 1922 | function | `nlt_solve` |
| 1990 | function | `_src_laplace` |
| 2006 | function | `_line_y` |
| 2018 | function | `_cp_y` |
| 2043 | function | `_pi_y` |
| 2067 | function | `_half` |
| 2073 | function | `load_data` |
| 2078 | function | `save_data` |
| 2106 | function | `_sc` |
| 2131 | function | `typical` |
| 2136 | function | `_req_data` |
| 2150 | function | `_req_opts` |
| 2162 | function | `api` |

### `pcl/linereport.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 41 | class | `ReportError` |
| 45 | function | `_labels` |
| 50 | function | `series` |
| 100 | function | `_cols` |
| 109 | function | `table` |
| 126 | function | `to_csv` |
| 140 | function | `to_json` |
| 145 | function | `to_mat` |
| 169 | function | `_tri` |
| 174 | function | `_rows` |
| 178 | function | `_untri` |
| 188 | function | `write_exact_pi` |
| 206 | function | `_numbers` |
| 210 | function | `read_exact_pi` |
| 248 | function | `write_nominal_pi` |
| 261 | function | `read_nominal_pi` |
| 279 | function | `_modechar` |
| 283 | function | `write_fd_mod` |
| 309 | function | `read_fd_mod` |
| 352 | function | `write_cp_netlist` |
| 372 | function | `plot` |
| 433 | function | `_svg` |
| 448 | function | `_c` |
| 455 | function | `_mat_html` |
| 466 | function | `_kv_html` |
| 478 | function | `report_html` |
| 569 | function | `_fmt` |
| 579 | function | `report_pdf` |
| 599 | function | `script` |
| 652 | function | `_version` |
| 661 | function | `_phasors` |
| 667 | function | `fields` |
| 700 | function | `_scan_req` |
| 718 | function | `api_scan` |
| 743 | function | `api_load` |
| 764 | function | `api_export` |

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
