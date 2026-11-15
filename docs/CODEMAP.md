# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 116 |
| `web/studio/app.js` | 2674 |
| `web/studio/bus.js` | 197 |
| `web/studio/editor.js` | 642 |
| `web/studio/expr.js` | 73 |
| `web/studio/inside.js` | 143 |
| `web/studio/library.js` | 56 |
| `web/studio/linedata.js` | 658 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 92 |
| `web/studio/live_worker.js` | 88 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 2102 |
| `web/studio/netlib.js` | 1071 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 1349 |
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
| `web/studio/tutorials.js` | 1574 |
| `web/studio/units.js` | 156 |
| `web/studio/watch.js` | 339 |
| `pcl/runner.js` | 27 |
| `run.py` | 310 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 2792 |
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
| `pcl/lineconst.py` | 2399 |
| `pcl/linereport.py` | 836 |
| `pcl/link.py` | 150 |
| `pcl/network.py` | 1206 |
| `pcl/plotting.py` | 340 |
| `pcl/trv.py` | 433 |
| `pcl/wideband.py` | 1219 |
| `pcl/workbench.py` | 485 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 106 |
| `tests/test_arc.py` | 189 |
| `tests/test_batch.py` | 255 |
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
| `tests/test_lcc.py` | 223 |
| `tests/test_library.py` | 41 |
| `tests/test_lightning.py` | 78 |
| `tests/test_line_solver.py` | 385 |
| `tests/test_linedata.py` | 661 |
| `tests/test_lines.py` | 355 |
| `tests/test_live_program.py` | 49 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_matlab.py` | 213 |
| `tests/test_mmc.py` | 203 |
| `tests/test_netlib.py` | 209 |
| `tests/test_network.py` | 272 |
| `tests/test_nn.py` | 130 |
| `tests/test_pcl.py` | 312 |
| `tests/test_plotting.py` | 113 |
| `tests/test_recording.py` | 209 |
| `tests/test_sparse.py` | 39 |
| `tests/test_sssc.py` | 255 |
| `tests/test_step.py` | 109 |
| `tests/test_stream.py` | 136 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 609 |
| `tests/test_subcircuit.py` | 149 |
| `tests/test_templates.py` | 237 |
| `tests/test_trstart.py` | 26 |
| `tests/test_trv.py` | 248 |
| `tests/test_tutorials.py` | 703 |
| `tests/test_units.py` | 78 |
| `tests/test_watch.py` | 87 |
| `tests/test_wb.py` | 466 |
| `tests/test_workbench.py` | 215 |
| `tests/js/arc_cases.js` | 43 |
| `tests/js/batch_requests.js` | 116 |
| `tests/js/bus_cases.js` | 127 |
| `tests/js/cable_tutorial.js` | 10 |
| `tests/js/ev_cases.js` | 37 |
| `tests/js/gen_cases.js` | 78 |
| `tests/js/gen_ctl_cases.js` | 39 |
| `tests/js/impl_cases.js` | 63 |
| `tests/js/lcc_cases.js` | 64 |
| `tests/js/library_cases.js` | 11 |
| `tests/js/lightning_cases.js` | 22 |
| `tests/js/line_cases.js` | 17 |
| `tests/js/live_cases.js` | 31 |
| `tests/js/mmc_cases.js` | 56 |
| `tests/js/netlib42_cases.js` | 50 |
| `tests/js/netlib_cases.js` | 93 |
| `tests/js/nn_cases.js` | 48 |
| `tests/js/sim_cases.js` | 356 |
| `tests/js/snapshot_cases.js` | 22 |
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
| `tests/js/wb_cases.js` | 21 |
| `tests/js/xb_cases.js` | 19 |
| `tests/ui/addons_flow.js` | 128 |
| `tests/ui/blocks_flow.js` | 144 |
| `tests/ui/bus_flow.js` | 90 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/ev_flow.js` | 112 |
| `tests/ui/facts_flow.js` | 67 |
| `tests/ui/features_flow.js` | 84 |
| `tests/ui/line_flow.js` | 166 |
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
| 113 | `R` | Αντίσταση |
| 117 | `CPE` | CPE / Warburg |
| 123 | `L` | Πηνίο |
| 127 | `C` | Πυκνωτής |
| 131 | `VDC` | Πηγή DC / μπαταρία |
| 137 | `VAC` | Πηγή AC |
| 141 | `VAC3` | Τριφασική πηγή (Y) |
| 147 | `IDC` | Πηγή ρεύματος |
| 153 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 166 | `D` | Δίοδος |
| 170 | `SCR` | Θυρίστορ (SCR) |
| 182 | `XFMR` | Μετασχηματιστής |
| 190 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 203 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 216 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 226 | `KL` | Συζευγμένα πηνία (N×N) |
| 237 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 244 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 252 | `SG` | Σπινθηριστής (διάκενο) |
| 265 | `CPL` | Φορτίο σταθερής ισχύος |
| 269 | `SH` | Δειγματοληψία και συγκράτηση (S&H) |
| 278 | `GND` | Γείωση |
| 280 | `JUNC` | Κόμβος |
| 281 | `PWM` | PWM / έλεγχος |
| 303 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 314 | `VM` | Βολτόμετρο |
| 316 | `AM` | Αμπερόμετρο (σε σειρά) |
| 319 | `VP` | Probe τάσης (ως προς τη γη) |
| 321 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 323 | `MEAS` | Μέτρηση στοιχείου |
| 326 | `CONST` | Σταθερά / πρόγραμμα |
| 330 | `GAIN` | Κέρδος |
| 332 | `SUM` | Άθροισμα |
| 335 | `MUL` | Γινόμενο |
| 337 | `DIV` | Διαίρεση a/b |
| 340 | `SAT` | Κορεσμός |
| 343 | `CMP` | Συγκριτής |
| 346 | `LOGIC` | Λογική πύλη |
| 349 | `PIB` | PI διακριτός |
| 355 | `UD` | Καθυστέρηση z⁻¹ |
| 358 | `SR` | Μανδαλωτής SR (latch) |
| 361 | `CLK` | Ρολόι (τετραγωνικό) |
| 364 | `RAMP` | Φέρον / ράμπα |
| 369 | `EXPR` | Έκφραση |
| 373 | `PY` | Μπλοκ Python |
| 381 | `AIC` | Ελεγκτής AI (βρόχος με νευρωνικό) |
| 398 | `AVR` | Διέγερση και ρυθμιστής τάσης (AVR: IEEE ST1A, DC1A) |
| 409 | `PSS` | Σταθεροποιητής συστήματος (PSS) |
| 414 | `GOV` | Ρυθμιστής στροφών και στρόβιλος |
| 427 | `EVC` | Πολυκριτηριακός ελεγκτής οχήματος (ταχύτητα → ροπή → ρεύμα) |
| 437 | `NN` | Νευρωνικό δίκτυο (MLP) |
| 500 | `MOD3` | Διαμορφωτής τριφασικός |
| 504 | `FEST` | Εκτιμητής ροής δρομέα |
| 508 | `INT` | Ολοκληρωτής |
| 512 | `LPF` | Βαθυπερατό 1ης τάξης |
| 516 | `F2` | Φίλτρο 2ης τάξης |
| 521 | `RLIM` | Όριο ρυθμού μεταβολής |
| 525 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 529 | `EDGE` | Ανιχνευτής ακμής |
| 533 | `CLARKE` | Clarke abc → αβ |
| 537 | `ICLARKE` | Clarke αβ → abc |
| 541 | `PARK` | Park αβ → dq |
| 544 | `IPARK` | Park dq → αβ |
| 547 | `PLL` | PLL (τριφασικό) |
| 553 | `TAGO` | Ετικέτα: προς (Goto) |
| 556 | `TAGI` | Ετικέτα: από (From) |
| 559 | `DISP` | Ένδειξη |
| 563 | `SUB` | Υποκύκλωμα |
| 566 | `PORT` | Θύρα (ηλεκτρική) |
| 569 | `SIN` | Θύρα εισόδου σήματος |
| 572 | `SOUT` | Θύρα εξόδου σήματος |
| 576 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 581 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 585 | `BSEL` | Επιλογή από δίαυλο |
| 588 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 594 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 605 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 614 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 624 | `ARCX` | Τμήμα τόξου |
| 628 | `ARC` | Διακόπτης με τόξο (μονοφασικός) |
| 635 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 646 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 691 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 704 | `TLM` | Γραμμή από γεωμετρία (CP / FD / WB) |
| 739 | `TOWER` | Πύργος γραμμής (κεραυνοί) |
| 756 | `SAI` | Αλεξικέραυνο ZnO, μοντέλο IEEE (εξαρτάται από τη συχνότητα) |
| 771 | `SAIX` | Αλεξικέραυνο IEEE (συμπαγές) |
| 775 | `RFX` | Γείωση πύργου R(I) (από τη γραμμή του πύργου) |
| 781 | `CHB` | Αρθρωτός βραχίονας: γέφυρες H σε σειρά (CHB) |
| 789 | `NLC` | Διαμόρφωση πλησιέστερης στάθμης (NLC) με ταξινόμηση |
| 795 | `SPLL` | PLL μονοφασικό (SOGI) |
| 802 | `SSSC` | Έλεγχος αρθρωτού SSSC (m-SSSC) |
| 823 | `MMC` | Μετατροπέας MMC (HVDC, μοντέλα 1–4) |
| 852 | `MMCC` | Έλεγχος σταθμού MMC (HVDC) |
| 883 | `LCC6` | Γέφυρα θυρίστορ 6 παλμών (LCC) |
| 899 | `LCCS` | Σταθμός LCC 12 παλμών (HVDC) |
| 914 | `LCCC` | Έλεγχος σταθμού LCC (HVDC) |
| 939 | `FILT3` | Φίλτρο AC τριφασικό |
| 945 | `ZSER3` | Τριφασική εμπέδηση σειράς (R + L + (R + L) ∥ R) |
| 951 | `LCCX` | Γέφυρα 6 παλμών (συμπαγής) |
| 956 | `LCCM` | Μέτρηση α και γ (γέφυρα 6 παλμών) |
| 961 | `MMCA` | Βραχίονας MMC (συμπαγής) |
| 966 | `CHBX` | Αρθρωτός βραχίονας (συμπαγής) |
| 969 | `SPLX` | PLL μονοφασικό (SOGI, συμπαγές) |
| 973 | `NOTE` | Σημείωση (κείμενο στο σχέδιο) |

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
| 1212 | `trv_terminal` | Διακόπτες ισχύος (4.9) | TRV σε σφάλμα ακροδεκτών: IEC 62271-100 |
| 1233 | `trv_slf` | Διακόπτες ισχύος (4.9) | Σφάλμα κοντινής γραμμής και τόξο του διακόπτη |
| 1264 | `lightning_gis` | Κεραυνοί και συντονισμός μόνωσης (4.9) | Κεραυνός σε γραμμή 400 kV δίπλα σε υποσταθμό GIS: συντονισμός μόνωσης |
| 1327 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1348 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1397 | `cable_xb` | Καλώδια: wideband και cross-bonding (4.13) | Υπόγειο καλώδιο 150 kV με cross-bonding: αναλυτικό και ομογενές μοντέλο |
| 1440 | `sssc_1ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε γραμμή (μονοφασικό) |
| 1460 | `sssc_3ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε δίκτυο 150 kV (τριφασικό, 4 ζυγοί) |
| 1489 | `hvdc_mmc` | HVDC: MMC (4.14) | Σύνδεση HVDC με MMC σημείο προς σημείο (±320 kV, 1000 MW) |
| 1531 | `hvdc_lcc` | HVDC: LCC (4.16) | Το πρώτο benchmark HVDC της CIGRE (LCC 12 παλμών, 500 kV, 1000 MW) |
| 1571 | `empty` | Νέο | Κενό κύκλωμα |

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
| 205 | function | `blkUnit` |
| 212 | function | `outsOf` |
| 214 | const fn | `vecN` |
| 216 | function | `chanLabel` |
| 224 | function | `addProbe` |
| 225 | function | `flash` |
| 259 | function | `signalsFor` |
| 275 | const fn | `fold` |
| 277 | function | `fillSignals` |
| 284 | function | `renderChannels` |
| 302 | function | `requestMeasure` |
| 303 | function | `renderMeasure` |
| 312 | function | `MeasureUnit` |
| 315 | function | `simKey` |
| 316 | function | `perSeries` |
| 317 | function | `refFor` |
| 318 | const fn | `sched` |
| 322 | function | `metricsFor` |
| 326 | function | `metricsRows` |
| 331 | function | `eventMetricsHTML` |
| 333 | function | `renderMetricsPanel` |
| 344 | function | `rawSeries` |
| 347 | function | `autoF1` |
| 351 | function | `evRows` |
| 353 | function | `renderEvents` |
| 355 | const fn | `fv` |
| 361 | function | `evMaxSetting` |
| 362 | function | `eventsJson` |
| 363 | function | `eventsCsv` |
| 365 | function | `renderFFT` |
| 387 | function | `cellZ` |
| 389 | function | `renderEISForm` |
| 390 | const fn | `opt` |
| 394 | function | `runEIS` |
| 402 | function | `drawEIS` |
| 421 | function | `perSamples` |
| 423 | function | `periodText` |
| 424 | const fn | `svgPlot` |
| 426 | function | `pcmMapFn` |
| 428 | const fn | `z` |
| 431 | function | `renderPoincare` |
| 447 | function | `bfParams` |
| 449 | function | `renderBifurcationForm` |
| 455 | function | `runBifurcation` |
| 469 | function | `stopBifurcation` |
| 470 | function | `drawBifurcation` |
| 480 | function | `niceTop` |
| 483 | function | `btStatus` |
| 484 | function | `parseStep` |
| 485 | function | `runBatch` |
| 501 | function | `clearBatch` |
| 503 | function | `meanPL` |
| 505 | function | `ringTrace` |
| 507 | function | `compareHTML` |
| 517 | function | `renderBatch` |
| 522 | function | `parseCSV` |
| 524 | const fn | `cells` |
| 525 | const fn | `num` |
| 531 | const fn | `normName` |
| 532 | function | `renderCsvMap` |
| 533 | const fn | `auto` |
| 539 | function | `applyCsv` |
| 544 | function | `renderCsv` |
| 546 | function | `clearCsv` |
| 548 | function | `sampleCompareHTML` |
| 562 | function | `liveChange` |
| 564 | function | `renderLiveLog` |
| 573 | function | `changesToSchedule` |
| 575 | const fn | `f` |
| 584 | function | `updateLivePanel` |
| 589 | function | `setLivePanel` |
| 592 | function | `switchesOf` |
| 595 | function | `addPulses` |
| 597 | function | `pulseKeys` |
| 598 | function | `refreshControls` |
| 601 | const fn | `phase` |
| 635 | const fn | `setD` |
| 651 | const fn | `setPh` |
| 663 | const fn | `pinNow` |
| 674 | const fn | `pinSet` |
| 686 | function | `pinMap` |
| 687 | function | `pinX` |
| 688 | function | `pinV` |
| 694 | function | `liveParam` |
| 709 | function | `closeInspector` |
| 710 | function | `placePopup` |
| 713 | function | `fieldValue` |
| 718 | function | `fieldHTML` |
| 733 | function | `placeAt` |
| 734 | function | `popupDrag` |
| 743 | function | `nnBlock` |
| 744 | function | `nnBox` |
| 747 | function | `nnLearned` |
| 748 | function | `openInspector` |
| 756 | const fn | `wired` |
| 765 | const fn | `same` |
| 766 | const fn | `apply` |
| 782 | const fn | `wireWidth` |
| 783 | function | `openWireInspector` |
| 799 | const fn | `numOf` |
| 805 | function | `psec` |
| 807 | function | `propsOpen` |
| 808 | function | `setProps` |
| 810 | function | `focusComp` |
| 811 | function | `togglePin` |
| 814 | function | `renderProps` |
| 823 | function | `propsComp` |
| 824 | const fn | `secOf` |
| 826 | const fn | `row` |
| 832 | const fn | `wired` |
| 846 | function | `propsJunc` |
| 848 | function | `propsWire` |
| 854 | function | `propsMulti` |
| 857 | function | `propsCircuit` |
| 867 | const fn | `opt` |
| 877 | const fn | `sv` |
| 883 | const fn | `chk` |
| 894 | function | `bindProps` |
| 925 | function | `diagItems` |
| 934 | function | `renderDiag` |
| 945 | function | `openDiag` |
| 946 | function | `flashComp` |
| 952 | function | `scheduleStepCheck` |
| 953 | function | `runStepCheck` |
| 954 | const fn | `inPage` |
| 961 | function | `syncStepMode` |
| 1023 | function | `scenSetCode` |
| 1024 | function | `scenState` |
| 1025 | function | `scenTab` |
| 1026 | function | `scenOut` |
| 1027 | function | `scenWorker` |
| 1029 | function | `scenRun` |
| 1037 | function | `scenStop` |
| 1038 | function | `scenDone` |
| 1040 | function | `scenMsg` |
| 1055 | function | `scenBatch` |
| 1060 | function | `scenEval` |
| 1063 | function | `addonDock` |
| 1066 | function | `renderAddons` |
| 1067 | const fn | `vsel` |
| 1081 | function | `knockToast` |
| 1084 | function | `initAddons` |
| 1091 | function | `scenBatchWrite` |
| 1094 | function | `renderScenFiles` |
| 1097 | const fn | `scenNum` |
| 1098 | function | `scenTable` |
| 1099 | function | `scenShow` |
| 1112 | function | `scenTicks` |
| 1113 | function | `scenPlot` |
| 1117 | const fn | `thin` |
| 1124 | const fn | `dig` |
| 1135 | function | `initScenarios` |
| 1142 | function | `liveApply` |
| 1145 | function | `closeMenu` |
| 1146 | function | `openMenu` |
| 1167 | function | `updateHover` |
| 1185 | const fn | `atTop` |
| 1186 | function | `topDoc` |
| 1187 | function | `defsOf` |
| 1188 | const fn | `pid` |
| 1189 | function | `fullDoc` |
| 1191 | function | `commitView` |
| 1193 | function | `viewDiag` |
| 1194 | const fn | `rel` |
| 1197 | function | `compAt` |
| 1202 | function | `allComps` |
| 1203 | const fn | `walk` |
| 1209 | function | `partDef` |
| 1211 | function | `pdefaults` |
| 1212 | function | `subParams` |
| 1214 | function | `placeOk` |
| 1216 | function | `renameChannels` |
| 1218 | function | `levelDoc` |
| 1219 | function | `applyLevel` |
| 1220 | function | `groupSel` |
| 1225 | function | `expandSub` |
| 1229 | function | `libToSub` |
| 1231 | function | `uniqueSub` |
| 1232 | function | `subMenu` |
| 1236 | function | `enterSub` |
| 1242 | function | `leaveSub` |
| 1248 | function | `renderCrumbs` |
| 1256 | function | `curDef` |
| 1257 | function | `publicOf` |
| 1258 | function | `togglePublic` |
| 1266 | function | `propsSub` |
| 1274 | function | `bindSub` |
| 1282 | function | `propsDef` |
| 1297 | function | `bindDef` |
| 1313 | function | `exportDef` |
| 1315 | function | `importDefs` |
| 1326 | function | `palLoad` |
| 1327 | function | `palSave` |
| 1328 | function | `palRecent` |
| 1329 | function | `palItem` |
| 1333 | function | `renderPalette` |
| 1341 | const fn | `isOpen` |
| 1355 | function | `tutorial` |
| 1358 | function | `circuitSig` |
| 1368 | function | `tutorialRef` |
| 1369 | function | `theoryValidity` |
| 1375 | function | `staleBanner` |
| 1378 | function | `bindRestore` |
| 1379 | function | `loadTutorial` |
| 1384 | function | `migrateFile` |
| 1387 | function | `applyProject` |
| 1398 | function | `renderTutorial` |
| 1408 | function | `gallery` |
| 1414 | function | `api` |
| 1415 | function | `paramsOf` |
| 1416 | function | `avgOver` |
| 1419 | function | `simValue` |
| 1425 | function | `lastPP` |
| 1427 | function | `runTheory` |
| 1440 | function | `cmpRows` |
| 1441 | function | `stepsHTML` |
| 1442 | function | `renderTheory` |
| 1474 | function | `rippleDev` |
| 1476 | function | `periodAvgAt` |
| 1478 | function | `samplingTheory` |
| 1487 | const fn | `lastAt` |
| 1509 | function | `polyTheory` |
| 1516 | const fn | `frac` |
| 1545 | function | `lastPeriods` |
| 1546 | function | `evalOrderHTML` |
| 1555 | function | `genScTheory` |
| 1557 | const fn | `Iac` |
| 1565 | function | `shaftModes` |
| 1572 | function | `fbmTheory` |
| 1580 | function | `ieee9Theory` |
| 1588 | function | `schedNow` |
| 1590 | function | `fundOf` |
| 1596 | function | `ssscNet3` |
| 1597 | const fn | `c` |
| 1600 | const fn | `ser` |
| 1601 | const fn | `ln` |
| 1609 | function | `ssscTheory` |
| 1639 | function | `hvdcTheory` |
| 1659 | function | `lccTheory` |
| 1660 | const fn | `st` |
| 1666 | const fn | `g` |
| 1678 | function | `wbModelHTML` |
| 1686 | function | `cableXbTheory` |
| 1687 | const fn | `rms` |
| 1688 | const fn | `pk` |
| 1700 | const fn | `v` |
| 1705 | function | `lineFdTheory` |
| 1706 | const fn | `lab` |
| 1714 | const fn | `pk` |
| 1721 | function | `trvAfterZero` |
| 1727 | function | `trvSvg` |
| 1729 | const fn | `path` |
| 1736 | function | `trvTerminalTheory` |
| 1749 | function | `trvSlfTheory` |
| 1769 | function | `lightningTheory` |
| 1771 | const fn | `pk` |
| 1789 | function | `netFaultTheory` |
| 1802 | function | `busDqTheory` |
| 1810 | function | `subLegsTheory` |
| 1819 | function | `blocksTheory` |
| 1834 | function | `pcmTheory` |
| 1860 | function | `codeTheory` |
| 1870 | function | `eisTheory` |
| 1872 | const fn | `ser` |
| 1885 | function | `imSteady` |
| 1888 | function | `imPar` |
| 1889 | function | `phaseRms` |
| 1890 | function | `vfTheory` |
| 1903 | function | `focTheory` |
| 1920 | function | `synTheory` |
| 1939 | const fn | `need` |
| 1959 | function | `pmTheory` |
| 1961 | const fn | `mtpa` |
| 1977 | function | `srmTheory` |
| 1992 | const fn | `curve` |
| 2003 | function | `lgTheory` |
| 2014 | const fn | `cr` |
| 2021 | function | `chaosTheory` |
| 2036 | function | `nnCycles` |
| 2039 | function | `genCtlTheory` |
| 2052 | function | `evTheory` |
| 2066 | function | `nnTheory` |
| 2083 | function | `nnGuiCode` |
| 2089 | function | `runNNCompare` |
| 2097 | function | `dcDriveTheory` |
| 2098 | const fn | `per` |
| 2099 | const fn | `cross` |
| 2129 | function | `twModel` |
| 2132 | const fn | `g` |
| 2135 | function | `twLattice` |
| 2142 | const fn | `marks` |
| 2145 | function | `twTheory` |
| 2153 | const fn | `at` |
| 2170 | function | `arTheory` |
| 2190 | function | `impulseMeasure` |
| 2192 | const fn | `cross` |
| 2195 | function | `marxTheory` |
| 2213 | function | `chopModel` |
| 2216 | const fn | `f` |
| 2219 | function | `chopTheory` |
| 2233 | function | `cmp3` |
| 2237 | function | `hvExact` |
| 2238 | function | `hv153Theory` |
| 2264 | function | `besI1e` |
| 2266 | function | `heaviside` |
| 2268 | function | `lossTheory` |
| 2287 | function | `vtBreak` |
| 2288 | function | `vtTheory` |
| 2308 | function | `hvdivTheory` |
| 2310 | const fn | `r` |
| 2322 | function | `scheringTheory` |
| 2323 | const fn | `inv` |
| 2332 | const fn | `sr` |
| 2338 | function | `formulaTheory` |
| 2424 | function | `nodeAvg` |
| 2430 | function | `circuitForMath` |
| 2462 | function | `scheduleMath` |
| 2463 | function | `batteryKey` |
| 2465 | function | `mathChoices` |
| 2466 | const fn | `prim` |
| 2468 | function | `renderMathChoices` |
| 2470 | function | `runTemplate` |
| 2476 | function | `runMath` |
| 2498 | function | `saveLocal` |
| 2499 | function | `saveLocalSoon` |
| 2501 | function | `download` |
| 2502 | function | `exportCSV` |
| 2508 | function | `syncScopeInputs` |
| 2509 | function | `setSpeed` |
| 2512 | function | `openSettings` |
| 2513 | const fn | `sel` |
| 2514 | const fn | `chk` |
| 2535 | function | `boot` |
| 2595 | const fn | `mv` |
| 2596 | const fn | `up` |
| 2597 | const fn | `navOpen` |
| 2608 | const fn | `probeSel` |
| 2670 | function | `renderTheoryLive` |

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
| 313 | function | `plot` |
| 315 | const fn | `X` |
| 321 | function | `reportHTML` |
| 339 | const fn | `hashText` |
| 340 | const fn | `wsel` |
| 341 | function | `wbOptsHTML` |
| 352 | function | `wbReport` |
| 361 | function | `wbPane` |
| 366 | function | `matHTML` |
| 369 | function | `tablesHTML` |
| 370 | const fn | `symLab` |
| 401 | function | `onF` |
| 405 | function | `open` |
| 407 | const fn | `norm` |
| 413 | const fn | `close` |
| 414 | const fn | `pars` |
| 415 | const fn | `snap` |
| 416 | const fn | `doUndo` |
| 419 | const fn | `saveData` |
| 420 | const fn | `scanReq` |
| 424 | const fn | `scanOld` |
| 425 | const fn | `render` |
| 436 | const fn | `pane` |
| 495 | const fn | `scanBar` |
| 496 | const fn | `viewPanel` |
| 503 | const fn | `wireCommon` |
| 512 | const fn | `wirePane` |
| 513 | const fn | `wireModel` |
| 519 | const fn | `drawBox` |
| 520 | const fn | `drawNow` |
| 524 | const fn | `wireDraw` |
| 525 | const fn | `pt` |
| 526 | const fn | `world` |
| 541 | const fn | `up` |
| 543 | const fn | `tipHTML` |
| 546 | const fn | `wireData` |
| 601 | const fn | `wireGraphs` |
| 622 | const fn | `wireTables` |
| 630 | const fn | `expReq` |
| 632 | const fn | `wireExport` |
| 647 | function | `compute` |
| 655 | function | `refresh` |

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
| 324 | function | `rcCoefC` |
| 326 | const fn | `mul` |
| 331 | function | `wbSet` |
| 334 | function | `wbCo` |
| 336 | function | `wbPoleG` |
| 339 | function | `wbSum` |
| 341 | function | `tlwElement` |
| 360 | function | `tlwAcY` |
| 375 | function | `tlwSteady` |
| 376 | const fn | `mv` |
| 383 | const fn | `st` |
| 393 | function | `piLine` |
| 398 | const fn | `shunt` |
| 406 | function | `rcCoef` |
| 411 | function | `arcF` |
| 417 | function | `arcStep` |
| 424 | function | `arcCur` |
| 429 | function | `nlLimit` |
| 430 | function | `nlSolve` |
| 437 | function | `saiSetup` |
| 438 | const fn | `Lc` |
| 442 | function | `saiCur` |
| 450 | function | `saiCommit` |
| 460 | function | `chbCoef` |
| 465 | function | `chbCommit` |
| 472 | function | `chbStates` |
| 474 | function | `chbCount` |
| 483 | function | `mmcSample` |
| 493 | const fn | `full` |
| 502 | function | `mmcSave` |
| 503 | function | `mmcLoad` |
| 510 | function | `lccCom` |
| 513 | function | `lccMeasInit` |
| 519 | function | `lccMeasure` |
| 536 | function | `lccPlo` |
| 541 | function | `lccU` |
| 543 | function | `lccIn` |
| 546 | function | `lccSetup` |
| 549 | function | `lccEdge` |
| 551 | function | `lccGate` |
| 556 | function | `nlcStep` |
| 559 | const fn | `full` |
| 576 | function | `footLink` |
| 584 | function | `arcStart` |
| 585 | const fn | `r` |
| 588 | function | `buildNetlist` |
| 598 | const fn | `union` |
| 613 | const fn | `nm` |
| 632 | const fn | `sn` |
| 636 | const fn | `isJ` |
| 657 | const fn | `lbl` |
| 662 | const fn | `node` |
| 663 | const fn | `internal` |
| 666 | const fn | `mkBlock` |
| 673 | const fn | `add` |
| 674 | const fn | `series` |
| 932 | function | `compileSignals` |
| 965 | function | `f2Phi` |
| 970 | function | `cmpF` |
| 974 | function | `stampM` |
| 976 | function | `luFactor` |
| 982 | function | `luSolve` |
| 989 | class | `Sim` |
| 990 | method | `constructor` |
| 993 | method | `basePeriod` |
| 997 | method | `tlMaxStep` |
| 998 | method | `setStep` |
| 1001 | method | `stIndex` |
| 1016 | method | `stVec` |
| 1017 | method | `stepCfg` |
| 1018 | method | `varSetup` |
| 1021 | method | `setStepMode` |
| 1023 | method | `hGrid` |
| 1027 | method | `modeCap` |
| 1031 | method | `swEls` |
| 1032 | method | `topoKey` |
| 1033 | method | `topoInfo` |
| 1042 | method | `topoCheck` |
| 1059 | method | `lteReset` |
| 1060 | method | `ltePush` |
| 1064 | method | `lteErr` |
| 1074 | method | `varCheck` |
| 1089 | method | `note` |
| 1092 | method | `stepCheck` |
| 1093 | method | `diagnostics` |
| 1096 | method | `ringCheck` |
| 1105 | method | `stateMap` |
| 1107 | method | `stateMap0` |
| 1118 | method | `load` |
| 1161 | method | `reset` |
| 1164 | method | `imStep` |
| 1171 | method | `smStep` |
| 1173 | method | `srmStep` |
| 1174 | method | `srmOutputs` |
| 1175 | method | `smOutputs` |
| 1179 | method | `genStep` |
| 1186 | method | `genOutputs` |
| 1191 | method | `genTm` |
| 1192 | method | `genEfd` |
| 1193 | method | `imSources` |
| 1194 | method | `pyBlocks` |
| 1204 | method | `pyLazy` |
| 1206 | method | `pyUpgrade` |
| 1208 | method | `setMethod` |
| 1209 | method | `setControl` |
| 1211 | method | `setBlock` |
| 1213 | method | `setHold` |
| 1215 | method | `markChange` |
| 1220 | method | `progInit` |
| 1221 | method | `addProgram` |
| 1223 | method | `progNext` |
| 1224 | method | `progDue` |
| 1225 | method | `progApply` |
| 1240 | method | `evInit` |
| 1241 | method | `logEv` |
| 1243 | method | `events` |
| 1245 | method | `evSwitches` |
| 1247 | method | `channelKeys` |
| 1266 | method | `allocRecord` |
| 1272 | const fn | `A` |
| 1280 | method | `V` |
| 1281 | method | `elCurrent` |
| 1285 | method | `portI` |
| 1288 | method | `computeVals` |
| 1318 | method | `setRecord` |
| 1319 | method | `recordNow` |
| 1328 | method | `closePeriod` |
| 1339 | method | `lastPeriod` |
| 1340 | method | `now` |
| 1345 | method | `gateOf` |
| 1351 | method | `rawGate` |
| 1362 | method | `carrier` |
| 1365 | method | `shGrid` |
| 1366 | method | `shNext` |
| 1368 | method | `sampleHolds` |
| 1373 | method | `samples` |
| 1374 | method | `ctrlEdges` |
| 1380 | method | `scrU` |
| 1381 | method | `scrGate` |
| 1382 | method | `scrEdges` |
| 1383 | method | `setFiring` |
| 1384 | method | `compV` |
| 1385 | method | `compI` |
| 1387 | method | `dbl` |
| 1388 | method | `sampleControllers` |
| 1417 | method | `evalBlocks` |
| 1517 | method | `blkCopy` |
| 1520 | method | `blkAnyDue` |
| 1523 | method | `blkDue` |
| 1525 | method | `zcFrac` |
| 1528 | method | `saveState` |
| 1530 | method | `restoreState` |
| 1539 | method | `snapshot` |
| 1541 | method | `restoreSnapshot` |
| 1543 | method | `gateSigPeek` |
| 1546 | method | `gateSig` |
| 1551 | method | `jumpScheds` |
| 1558 | method | `jumpAt` |
| 1559 | method | `values` |
| 1584 | method | `assemble` |
| 1591 | const fn | `g` |
| 1615 | method | `rhs` |
| 1617 | const fn | `J` |
| 1636 | method | `cplLinearize` |
| 1640 | method | `factor` |
| 1646 | method | `spAssemble` |
| 1653 | method | `solveOnce` |
| 1664 | method | `solve` |
| 1682 | method | `nlLinearize` |
| 1685 | method | `check` |
| 1701 | method | `commit` |
| 1726 | method | `initialSolve` |
| 1738 | method | `tlSources` |
| 1742 | method | `tlRecord` |
| 1748 | method | `tlHist` |
| 1754 | method | `tlmG` |
| 1758 | method | `tlmSources` |
| 1770 | method | `tlmRecord` |
| 1783 | method | `tlwG` |
| 1788 | method | `tlwSources` |
| 1802 | method | `tlwRecord` |
| 1818 | method | `tlmHist` |
| 1825 | method | `step` |
| 1827 | const fn | `gs` |
| 1833 | method | `stepCore` |
| 1892 | method | `edgeSolve` |
| 1895 | method | `edgePoint` |
| 1896 | method | `mmcMoved` |
| 1899 | method | `arcGate` |
| 1907 | method | `trRestart` |
| 1911 | method | `nextEvent` |
| 1917 | const fn | `sch` |
| 1940 | method | `spwmCut` |
| 1943 | const fn | `sig` |
| 1948 | method | `run` |
| 1991 | function | `exportForBatch` |
| 2012 | const fn | `hist` |
| 2027 | const fn | `ci` |
| 2028 | const fn | `vd` |
| 2029 | const fn | `V` |
| 2032 | const fn | `linePort` |
| 2034 | const fn | `I` |
| 2035 | const fn | `portRec` |
| 2036 | const fn | `rec` |
| 2053 | const fn | `clkOf` |
| 2079 | function | `sweepPoint` |
| 2084 | function | `setPath` |
| 2090 | function | `eisPoint` |
| 2098 | function | `resume` |

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
| 68 | const fn | `sw` |
| 79 | function | `arcSections` |
| 80 | const fn | `S` |
| 88 | function | `arcChain` |
| 92 | function | `arcBreakerDef` |
| 99 | function | `breakerDef` |
| 116 | function | `xfData` |
| 121 | function | `xfDef` |
| 122 | const fn | `star` |
| 123 | const fn | `ends` |
| 141 | function | `loadDef` |
| 174 | function | `lineData` |
| 178 | function | `lineDef` |
| 180 | const fn | `mat` |
| 203 | function | `aicDef` |
| 231 | const fn | `out` |
| 242 | function | `evcDef` |
| 249 | const fn | `io` |
| 250 | const fn | `E` |
| 299 | const fn | `out` |
| 308 | const fn | `fT` |
| 309 | function | `ctlKit` |
| 311 | const fn | `lag` |
| 313 | const fn | `leadlag` |
| 315 | const fn | `wash` |
| 317 | const fn | `nwLag` |
| 324 | const fn | `sched` |
| 326 | function | `avrDef` |
| 327 | const fn | `io` |
| 328 | const fn | `N` |
| 361 | function | `pssDef` |
| 370 | function | `govDef` |
| 410 | const fn | `out` |
| 417 | function | `footTable` |
| 421 | function | `towerDef` |
| 451 | function | `saiTable` |
| 452 | function | `saiParams` |
| 458 | function | `saiV10` |
| 459 | const fn | `W` |
| 464 | function | `saiFitL1` |
| 469 | function | `saiDef` |
| 476 | const fn | `par` |
| 486 | const fn | `nCells` |
| 487 | function | `chbDef` |
| 489 | const fn | `out` |
| 500 | const fn | `sw` |
| 501 | const fn | `gate` |
| 515 | function | `spllDef` |
| 520 | const fn | `E` |
| 526 | const fn | `w` |
| 538 | function | `ssscDef` |
| 539 | const fn | `io` |
| 540 | const fn | `E` |
| 555 | const fn | `sched` |
| 580 | function | `mmcDef` |
| 585 | const fn | `sin` |
| 586 | const fn | `w` |
| 592 | const fn | `refs` |
| 594 | const fn | `toU` |
| 595 | const fn | `ccsc` |
| 613 | const fn | `energy` |
| 616 | const fn | `six` |
| 674 | const fn | `arm` |
| 676 | const fn | `sw` |
| 701 | function | `mmccDef` |
| 704 | const fn | `sin` |
| 705 | const fn | `w` |
| 706 | const fn | `pos` |
| 713 | const fn | `dq` |
| 728 | const fn | `integ` |
| 781 | function | `lcc6Def` |
| 782 | const fn | `sin` |
| 810 | function | `lccsDef` |
| 811 | const fn | `sin` |
| 817 | const fn | `xf` |
| 819 | const fn | `br` |
| 877 | function | `lcccDef` |
| 878 | const fn | `sin` |
| 879 | const fn | `pos` |
| 892 | const fn | `pi` |
| 922 | function | `filtDef` |
| 923 | const fn | `pos` |
| 934 | function | `zserDef` |
| 946 | function | `defOf` |
| 952 | function | `forceImpl` |
| 954 | const fn | `fix` |
| 958 | const fn | `hasLib` |
| 959 | function | `needs` |
| 961 | function | `expand` |
| 963 | const fn | `conv` |
| 971 | function | `warnings` |
| 977 | const fn | `cx` |
| 979 | function | `csolve` |
| 984 | function | `faultCurrents` |
| 1003 | function | `behindXF` |
| 1012 | function | `layoutDef` |
| 1015 | const fn | `isG` |
| 1016 | const fn | `isJ` |
| 1025 | const fn | `side` |
| 1029 | const fn | `bfs` |
| 1038 | const fn | `bary` |
| 1044 | const fn | `ctr` |
| 1045 | const fn | `target` |
| 1061 | function | `placedDef` |
| 1066 | function | `sidesOf` |

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
| 979 | function | `noteBox` |
| 982 | function | `defaults` |
| 984 | function | `elPins` |
| 985 | function | `sigPins` |
| 986 | function | `pinsOf` |
| 989 | function | `parseMat` |
| 991 | function | `nPorts` |
| 992 | function | `portY` |
| 993 | function | `portPins` |
| 994 | function | `portBox` |
| 996 | function | `posDef` |
| 998 | function | `symmetric` |
| 999 | function | `matInv` |
| 1004 | function | `klMatrix` |
| 1015 | function | `kgMatrix` |
| 1023 | function | `srmGeo` |
| 1025 | function | `srmSpins` |
| 1027 | function | `srmPins` |
| 1029 | function | `satD` |
| 1030 | function | `satDinv` |
| 1032 | function | `genSpins` |
| 1043 | function | `genTsc` |
| 1048 | function | `genCirc2` |
| 1049 | const fn | `Fn` |
| 1057 | function | `genAxis` |
| 1065 | const fn | `classic` |
| 1071 | const fn | `plist` |
| 1075 | function | `genModel` |
| 1081 | const fn | `w` |
| 1090 | const fn | `grp` |
| 1107 | function | `genGamma` |
| 1115 | function | `genDQ` |
| 1119 | function | `genSteady` |
| 1121 | const fn | `rot` |
| 1128 | function | `srmAlignedPsi` |
| 1129 | function | `srmModelPsi` |
| 1130 | function | `srmTableText` |
| 1133 | function | `srmMag` |
| 1149 | function | `chkMag` |
| 1151 | function | `srmA` |
| 1154 | function | `seg` |
| 1155 | function | `srmPsi` |
| 1157 | function | `srmCur` |
| 1159 | function | `srmTorque` |
| 1162 | function | `srmCoenergy` |
| 1166 | function | `waveShape` |
| 1167 | function | `waveAt` |
| 1170 | function | `waveMeasure` |
| 1173 | const fn | `cross` |
| 1179 | function | `waveFit` |
| 1180 | const fn | `res` |
| 1191 | function | `directWave` |
| 1194 | function | `impulseWave` |
| 1205 | function | `bewley` |
| 1208 | const fn | `at` |
| 1214 | function | `movChar` |
| 1219 | const fn | `pick` |
| 1220 | const fn | `cur` |
| 1221 | const fn | `inv` |
| 1225 | function | `impulseDesign` |
| 1230 | function | `impulseRoots` |
| 1233 | function | `tlParams` |
| 1242 | function | `tlmData` |
| 1244 | function | `tlmM` |
| 1251 | function | `tlmPin` |
| 1252 | function | `tlmPins` |
| 1254 | function | `tlmKey` |
| 1265 | function | `tlmModel` |
| 1273 | function | `lightningWave` |
| 1280 | function | `pinKind` |
| 1291 | function | `structural` |
| 1298 | function | `pinWidth` |
| 1301 | function | `xf` |
| 1302 | function | `pinPos` |
| 1304 | function | `pinDir` |
| 1309 | function | `cpeParams` |
| 1310 | function | `cpeBank` |
| 1314 | function | `cpeZ` |
| 1315 | function | `cpeZbank` |
| 1316 | function | `boxOf` |
| 1317 | function | `bbox` |
| 1322 | function | `fmtNum` |
| 1326 | function | `eng` |
| 1330 | function | `parseEng` |
| 1333 | function | `parseSched` |
| 1341 | function | `machines` |

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
| 1206 | function | `tlmPart` |
| 1220 | method | `build` |
| 1239 | method | `build` |
| 1259 | function | `tlmGW` |
| 1263 | const fn | `note` |
| 1275 | method | `build` |
| 1293 | const fn | `tl` |
| 1321 | const fn | `PANE` |
| 1332 | method | `build` |
| 1334 | const fn | `rig` |
| 1353 | method | `build` |
| 1355 | const fn | `rig` |
| 1375 | function | `xbRig` |
| 1377 | const fn | `bond` |
| 1404 | method | `build` |
| 1439 | function | `ssscChannels` |
| 1448 | method | `build` |
| 1466 | method | `build` |
| 1468 | const fn | `ln` |
| 1496 | method | `build` |
| 1500 | const fn | `station` |
| 1538 | method | `build` |
| 1572 | method | `build` |

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
| 55 | function | `line_model` |
| 63 | function | `line_action` |
| 79 | function | `scenario` |
| 108 | class | `Handler` |
| 110 | method | `Handler.local` |
| 114 | method | `Handler.alive` |
| 124 | method | `Handler.body` |
| 133 | method | `Handler.addon_get` |
| 163 | method | `Handler.addon_post` |
| 190 | method | `Handler.send` |
| 206 | method | `Handler.do_GET` |
| 237 | method | `Handler.do_POST` |
| 285 | function | `main` |

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
| 87 | function | `mov_cur` |
| 101 | function | `mov_inv` |
| 113 | function | `arc_F` |
| 122 | function | `arc_start` |
| 142 | function | `sat_d` |
| 149 | function | `sat_d_inv` |
| 161 | function | `f2_phi` |
| 180 | function | `_f` |
| 188 | class | `Ctrl` |
| 192 | method | `Ctrl.__init__` |
| 217 | method | `Ctrl.dbl` |
| 220 | method | `Ctrl.raw` |
| 240 | method | `Ctrl.gate` |
| 252 | method | `Ctrl.carrier_at` |
| 263 | method | `Ctrl.edges` |
| 283 | function | `_lut` |
| 294 | function | `eval_ast` |
| 323 | function | `_nn_fwd` |
| 339 | function | `_nn_learn` |
| 382 | function | `_nn_jac` |
| 401 | function | `_nn_step` |
| 429 | function | `lcc_com` |
| 437 | function | `lcc_measure` |
| 493 | function | `nlc_step` |
| 544 | function | `make_python_block` |
| 575 | class | `Circuit` |
| 576 | method | `Circuit.__init__` |
| 811 | method | `Circuit.R` |
| 814 | method | `Circuit.im_e` |
| 823 | method | `Circuit.im_deriv` |
| 836 | method | `Circuit.sm_cur` |
| 848 | method | `Circuit.sm_ports` |
| 853 | method | `Circuit.sm_deriv` |
| 868 | method | `Circuit.srm_A` |
| 873 | method | `Circuit._seg` |
| 877 | method | `Circuit.srm_cur` |
| 884 | method | `Circuit.srm_torque` |
| 893 | method | `Circuit.srm_currents` |
| 898 | method | `Circuit.srm_deriv` |
| 911 | method | `Circuit.gen_cur` |
| 928 | method | `Circuit.gen_efd` |
| 935 | method | `Circuit.gen_tm` |
| 942 | method | `Circuit.gen_deriv` |
| 960 | method | `Circuit.jac_gen` |
| 1012 | method | `Circuit.gen_out` |
| 1032 | method | `Circuit.Vsrc` |
| 1048 | method | `Circuit.topo` |
| 1058 | method | `Circuit.build` |
| 1165 | method | `Circuit.bsrc` |
| 1215 | method | `Circuit.solve_z` |
| 1259 | method | `Circuit.arc_g` |
| 1264 | method | `Circuit.solve_nl` |
| 1306 | method | `Circuit.tl_hist` |
| 1323 | method | `Circuit.tl_sec` |
| 1330 | method | `Circuit.tl_ih` |
| 1334 | method | `Circuit.tl_record` |
| 1355 | method | `Circuit.tlm_setup` |
| 1450 | method | `Circuit.tlw_setup` |
| 1528 | method | `Circuit.tlw_ix` |
| 1542 | method | `Circuit.tlw_end` |
| 1552 | method | `Circuit.tlm_hist` |
| 1577 | method | `Circuit.tlm_ih` |
| 1590 | method | `Circuit.tlm_force` |
| 1616 | method | `Circuit.tlm_modal` |
| 1635 | method | `Circuit.tlm_record` |
| 1664 | method | `Circuit.scr_u` |
| 1668 | method | `Circuit.scr_gate` |
| 1672 | method | `Circuit.scr_edges` |
| 1679 | method | `Circuit.gate_state` |
| 1692 | method | `Circuit.set_gates` |
| 1700 | method | `Circuit.arc_gates` |
| 1720 | method | `Circuit.may_turn_on` |
| 1724 | method | `Circuit.tolerances` |
| 1730 | method | `Circuit.consistent` |
| 1772 | method | `Circuit.value` |
| 1810 | method | `Circuit.current` |
| 1864 | method | `Circuit.prime` |
| 1874 | method | `Circuit.sig_in` |
| 1878 | method | `Circuit.sh_grid` |
| 1890 | method | `Circuit.sh_next` |
| 1897 | method | `Circuit.log_ev` |
| 1903 | method | `Circuit.ev_switches` |
| 1912 | method | `Circuit.sh_sample` |
| 1932 | method | `Circuit.sample` |
| 1993 | method | `Circuit.cmp_f` |
| 1999 | method | `Circuit.blk_due` |
| 2010 | method | `Circuit.eval_blocks` |
| 2330 | method | `Circuit.block_events` |
| 2359 | method | `Circuit.next_event` |
| 2426 | function | `_decimate` |
| 2443 | function | `_diagnose` |
| 2494 | function | `simulate` |
| 2786 | function | `batch_sim` |

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
| 909 | function | `xbond_avg` |
| 944 | function | `transpose_avg` |
| 949 | function | `phase_matrices` |
| 977 | function | `sequence` |
| 988 | function | `ti_matrix` |
| 1019 | function | `modal` |
| 1025 | function | `q_error` |
| 1038 | function | `clarke` |
| 1049 | function | `double_ti` |
| 1061 | function | `balance` |
| 1083 | function | `line_zy` |
| 1091 | function | `model_ti` |
| 1104 | function | `phases_of` |
| 1116 | function | `auto_fti` |
| 1135 | function | `seq_matrices` |
| 1160 | function | `rebuild` |
| 1232 | function | `zy_from_file` |
| 1260 | function | `load_zy_mat` |
| 1295 | function | `vfit` |
| 1350 | function | `rational` |
| 1356 | function | `freqs` |
| 1364 | function | `cp_model` |
| 1401 | function | `lossless_modes` |
| 1449 | function | `_msqrt` |
| 1457 | function | `_fit_a` |
| 1495 | function | `fd_model` |
| 1558 | function | `vary` |
| 1593 | function | `sensitivity` |
| 1610 | function | `report` |
| 1634 | function | `sym_matrix` |
| 1647 | function | `to_sym` |
| 1653 | function | `matrices` |
| 1671 | function | `_phys_currents` |
| 1682 | function | `field` |
| 1716 | function | `bfield` |
| 1741 | function | `telecom` |
| 1769 | function | `_default_sources` |
| 1776 | function | `_modal_admittance` |
| 1790 | function | `_end_tests` |
| 1796 | function | `qerror_tests` |
| 1820 | function | `exact_pi` |
| 1830 | function | `nominal_pi` |
| 1839 | function | `useful` |
| 1867 | function | `_track` |
| 1875 | function | `scan` |
| 1978 | function | `jsonable` |
| 1998 | function | `exact_admittance` |
| 2005 | function | `line_admittance` |
| 2018 | function | `model_admittance` |
| 2042 | function | `nlt_solve` |
| 2110 | function | `_src_laplace` |
| 2126 | function | `_line_y` |
| 2138 | function | `_line_y1` |
| 2148 | function | `_cp_y` |
| 2173 | function | `_pi_y` |
| 2197 | function | `_half` |
| 2203 | function | `load_data` |
| 2208 | function | `save_data` |
| 2236 | function | `_sc` |
| 2271 | function | `typical` |
| 2276 | function | `_req_data` |
| 2290 | function | `_req_opts` |
| 2302 | function | `_wb_opts` |
| 2320 | function | `api` |

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

### `pcl/wideband.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 46 | class | `WBError` |
| 51 | function | `_full` |
| 63 | function | `_half` |
| 74 | function | `_pack` |
| 80 | function | `_unpack` |
| 87 | function | `_sort_poles` |
| 97 | function | `_kinds` |
| 110 | function | `_basis` |
| 122 | function | `_residues` |
| 134 | function | `start_poles` |
| 154 | function | `_clip` |
| 166 | function | `vfit_relaxed` |
| 242 | function | `_conj_clean` |
| 260 | function | `_fit_residues` |
| 284 | function | `rational` |
| 299 | function | `_sweep` |
| 335 | function | `bode_delay` |
| 368 | function | `_groups` |
| 384 | function | `_fit_scalar` |
| 399 | function | `_hbasis` |
| 411 | function | `_ls_real` |
| 423 | function | `_fit_h_phase` |
| 439 | function | `_fit_h_fdcm` |
| 454 | function | `_ratio` |
| 463 | function | `wb_fit` |
| 584 | function | `_opt_delay` |
| 617 | function | `wb_yc` |
| 624 | function | `wb_h` |
| 633 | function | `nodal` |
| 642 | function | `model_parts` |
| 655 | function | `wb_admittance` |
| 664 | function | `passivity` |
| 702 | function | `h_weight` |
| 710 | function | `_change` |
| 722 | function | `enforce_passivity` |
| 810 | function | `_coeffs` |
| 822 | function | `_gram` |
| 827 | function | `_ycfull` |
| 831 | function | `_hfull` |
| 835 | function | `_rebuild` |
| 849 | function | `_minima` |
| 863 | function | `_zero_row` |
| 868 | function | `_grad_row` |
| 892 | function | `_flatten_row` |
| 900 | function | `_apply_qinv` |
| 913 | function | `_apply` |
| 938 | function | `wb_model` |
| 1011 | function | `_yn_info` |
| 1021 | function | `to_json` |
| 1038 | function | `errors` |
| 1061 | function | `read_wb_mod` |
| 1132 | function | `import_model` |
| 1159 | function | `write_wb_mod` |
| 1188 | function | `sheath_check` |
| 1205 | function | `fit_report` |

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
