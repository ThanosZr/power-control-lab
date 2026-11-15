# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 116 |
| `web/studio/app.js` | 2747 |
| `web/studio/bus.js` | 197 |
| `web/studio/editor.js` | 642 |
| `web/studio/expr.js` | 73 |
| `web/studio/inside.js` | 143 |
| `web/studio/library.js` | 56 |
| `web/studio/linedata.js` | 659 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 92 |
| `web/studio/live_worker.js` | 88 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 2112 |
| `web/studio/netlib.js` | 1138 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 1385 |
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
| `web/studio/tune.js` | 169 |
| `web/studio/tutorials.js` | 1651 |
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
| `pcl/lineconst.py` | 2400 |
| `pcl/linereport.py` | 836 |
| `pcl/link.py` | 150 |
| `pcl/network.py` | 1206 |
| `pcl/plotting.py` | 340 |
| `pcl/trv.py` | 433 |
| `pcl/wideband.py` | 1279 |
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
| `tests/test_ev.py` | 104 |
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
| `tests/test_sssc.py` | 444 |
| `tests/test_step.py` | 109 |
| `tests/test_stream.py` | 136 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 609 |
| `tests/test_subcircuit.py` | 149 |
| `tests/test_templates.py` | 237 |
| `tests/test_trstart.py` | 26 |
| `tests/test_trv.py` | 248 |
| `tests/test_tune.py` | 277 |
| `tests/test_tutorials.py` | 703 |
| `tests/test_units.py` | 78 |
| `tests/test_watch.py` | 87 |
| `tests/test_wb.py` | 489 |
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
| `tests/js/sssc_cases.js` | 85 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/subcircuit_cases.js` | 87 |
| `tests/js/tlm_ss_cases.js` | 18 |
| `tests/js/trstart_cases.js` | 11 |
| `tests/js/trv_cases.js` | 8 |
| `tests/js/trv_tutorial_cases.js` | 30 |
| `tests/js/tune_cases.js` | 38 |
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
| `tests/ui/facts_flow.js` | 93 |
| `tests/ui/features_flow.js` | 101 |
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
| 316 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 327 | `VM` | Βολτόμετρο |
| 329 | `AM` | Αμπερόμετρο (σε σειρά) |
| 332 | `VP` | Probe τάσης (ως προς τη γη) |
| 334 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 336 | `MEAS` | Μέτρηση στοιχείου |
| 339 | `CONST` | Σταθερά / πρόγραμμα |
| 343 | `GAIN` | Κέρδος |
| 345 | `SUM` | Άθροισμα |
| 348 | `MUL` | Γινόμενο |
| 350 | `DIV` | Διαίρεση a/b |
| 353 | `SAT` | Κορεσμός |
| 356 | `CMP` | Συγκριτής |
| 359 | `LOGIC` | Λογική πύλη |
| 362 | `PIB` | PI διακριτός |
| 368 | `UD` | Καθυστέρηση z⁻¹ |
| 371 | `SR` | Μανδαλωτής SR (latch) |
| 374 | `CLK` | Ρολόι (τετραγωνικό) |
| 377 | `RAMP` | Φέρον / ράμπα |
| 382 | `EXPR` | Έκφραση |
| 386 | `PY` | Μπλοκ Python |
| 394 | `AIC` | Ελεγκτής AI (βρόχος με νευρωνικό) |
| 411 | `AVR` | Διέγερση και ρυθμιστής τάσης (AVR: IEEE ST1A, DC1A) |
| 422 | `PSS` | Σταθεροποιητής συστήματος (PSS) |
| 427 | `GOV` | Ρυθμιστής στροφών και στρόβιλος |
| 440 | `EVC` | Πολυκριτηριακός ελεγκτής οχήματος (ταχύτητα → ροπή → ρεύμα) |
| 450 | `NN` | Νευρωνικό δίκτυο (MLP) |
| 513 | `MOD3` | Διαμορφωτής τριφασικός |
| 517 | `FEST` | Εκτιμητής ροής δρομέα |
| 521 | `INT` | Ολοκληρωτής |
| 525 | `LPF` | Βαθυπερατό 1ης τάξης |
| 529 | `F2` | Φίλτρο 2ης τάξης |
| 534 | `RLIM` | Όριο ρυθμού μεταβολής |
| 538 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 542 | `EDGE` | Ανιχνευτής ακμής |
| 546 | `CLARKE` | Clarke abc → αβ |
| 550 | `ICLARKE` | Clarke αβ → abc |
| 554 | `PARK` | Park αβ → dq |
| 557 | `IPARK` | Park dq → αβ |
| 560 | `PLL` | PLL (τριφασικό) |
| 566 | `TAGO` | Ετικέτα: προς (Goto) |
| 569 | `TAGI` | Ετικέτα: από (From) |
| 572 | `DISP` | Ένδειξη |
| 576 | `SUB` | Υποκύκλωμα |
| 579 | `PORT` | Θύρα (ηλεκτρική) |
| 582 | `SIN` | Θύρα εισόδου σήματος |
| 585 | `SOUT` | Θύρα εξόδου σήματος |
| 589 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 594 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 598 | `BSEL` | Επιλογή από δίαυλο |
| 601 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 607 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 618 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 627 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 637 | `ARCX` | Τμήμα τόξου |
| 641 | `ARC` | Διακόπτης με τόξο (μονοφασικός) |
| 648 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 659 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 704 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 717 | `TLM` | Γραμμή από γεωμετρία (CP / FD / WB) |
| 753 | `TOWER` | Πύργος γραμμής (κεραυνοί) |
| 770 | `SAI` | Αλεξικέραυνο ZnO, μοντέλο IEEE (εξαρτάται από τη συχνότητα) |
| 785 | `SAIX` | Αλεξικέραυνο IEEE (συμπαγές) |
| 789 | `RFX` | Γείωση πύργου R(I) (από τη γραμμή του πύργου) |
| 795 | `CHB` | Αρθρωτός βραχίονας: γέφυρες H σε σειρά (CHB) |
| 803 | `NLC` | Διαμόρφωση πλησιέστερης στάθμης (NLC) με ταξινόμηση |
| 809 | `SPLL` | PLL μονοφασικό (SOGI) |
| 816 | `SSSC` | Έλεγχος αρθρωτού SSSC (m-SSSC) |
| 835 | `SSSC3` | Κεντρικός έλεγχος τριφασικού m-SSSC |
| 859 | `MMC` | Μετατροπέας MMC (HVDC, μοντέλα 1–4) |
| 888 | `MMCC` | Έλεγχος σταθμού MMC (HVDC) |
| 919 | `LCC6` | Γέφυρα θυρίστορ 6 παλμών (LCC) |
| 935 | `LCCS` | Σταθμός LCC 12 παλμών (HVDC) |
| 950 | `LCCC` | Έλεγχος σταθμού LCC (HVDC) |
| 975 | `FILT3` | Φίλτρο AC τριφασικό |
| 981 | `ZSER3` | Τριφασική εμπέδηση σειράς (R + L + (R + L) ∥ R) |
| 987 | `LCCX` | Γέφυρα 6 παλμών (συμπαγής) |
| 992 | `LCCM` | Μέτρηση α και γ (γέφυρα 6 παλμών) |
| 997 | `MMCA` | Βραχίονας MMC (συμπαγής) |
| 1002 | `CHBX` | Αρθρωτός βραχίονας (συμπαγής) |
| 1005 | `SPLX` | PLL μονοφασικό (SOGI, συμπαγές) |
| 1009 | `NOTE` | Σημείωση (κείμενο στο σχέδιο) |

## Tutorials (`web/studio/tutorials.js`)

| Γραμμή | id | Ομάδα | Τίτλος |
|---:|---|---|---|
| 24 | `buck` | DC-DC χωρίς απομόνωση | Buck (υποβιβασμός) |
| 36 | `boost` | DC-DC χωρίς απομόνωση | Boost (ανύψωση) |
| 46 | `buck_boost` | DC-DC χωρίς απομόνωση | Buck–boost (αναστροφής) |
| 56 | `cuk` | DC-DC χωρίς απομόνωση | Ćuk |
| 70 | `sepic` | DC-DC χωρίς απομόνωση | SEPIC |
| 84 | `flyback` | DC-DC με απομόνωση | Flyback |
| 112 | `hbridge` | Γέφυρες | Full-bridge DC-DC (H-γέφυρα) |
| 117 | `inverter` | Γέφυρες | Μονοφασικός αντιστροφέας SPWM |
| 123 | `rectifier` | Ανορθωτές | Ανορθωτής γέφυρας → μπαταρία |
| 137 | `buck_vloop` | Έλεγχος | Buck με βρόχο τάσης (PI / PID) |
| 150 | `scr1` | Ανορθωτές | Ελεγχόμενος ανορθωτής γέφυρας (θυρίστορ) |
| 163 | `bridge3` | Ανορθωτές | Τριφασική γέφυρα 6 παλμών |
| 179 | `battery` | Αμφίδρομος · μπαταρία (PE2) | Αμφίδρομος μετατροπέας μπαταρίας |
| 229 | `sampling` | Αμφίδρομος · μπαταρία (PE2) | Άσκηση 2 · Επίδραση δειγματοληψίας |
| 264 | `polyphase` | Αμφίδρομος · μπαταρία (PE2) | Άσκηση 2 · Πολυφασική σχεδίαση |
| 298 | `blocks_loop` | Μπλοκ σημάτων (3.0) | Βρόχος ρεύματος από μπλοκ |
| 326 | `code_loop` | Μπλοκ κώδικα (3.3) | PI σε Python και πρόσθια τροφοδότηση με έκφραση |
| 351 | `cell_eis` | Μπαταρίες και EIS (3.3.1) | Δοκιμή κυψέλης: EIS με μετατροπέα |
| 394 | `im_vf` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: V/f και διαμόρφωση SPWM, SVPWM, τετραγωνική |
| 407 | `im_foc` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: διανυσματικός έλεγχος, εξασθένιση πεδίου, R̂_R |
| 462 | `synrm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μαγνητικής αντίστασης (SynRM): ευθυγράμμιση, έλεγχος dq, MTPA |
| 488 | `pmsm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μόνιμων μαγνητών (PMSM / IPMSM): i_d = 0 και MTPA |
| 504 | `srm` | Ηλεκτρική κίνηση (3.6) | Μηχανή μεταβλητής μαγνητικής αντίστασης (SRM 8/6): γωνίες, υστέρηση, βρόχος ψ–i |
| 535 | `lightning` | Κεραυνικά (3.5) | Κεραυνικό ρεύμα Heidler: 10/350, 1/200, 0,25/100 μs |
| 547 | `twave` | Υψηλές τάσεις (3.8) | Οδεύοντα κύματα: ανάκλαση σε ανοιχτό, βραχυκυκλωμένο ή ωμικό άκρο, διάγραμμα Bewley |
| 570 | `arrester` | Υψηλές τάσεις (3.9) | Αλεξικέραυνο: παραμένουσα τάση και απόσταση προστασίας |
| 586 | `marx` | Υψηλές τάσεις (3.10) | Γεννήτρια Marx: πολυβάθμια κρουστική γεννήτρια με σπινθηριστές |
| 616 | `chop` | Υψηλές τάσεις (3.10) | Αποκομμένη κρουστική τάση: σπινθηριστής αποκοπής |
| 650 | `hv153` | Υψηλές τάσεις (3.11) | Ασκήσεις 15.3: γεννήτριες κρουστικών τάσεων (βιβλίο, ακριβής λύση, προσομοίωση) |
| 671 | `lossline` | Υψηλές τάσεις (3.11) | Γραμμή με απώλειες: απόσβεση και παραμόρφωση οδεύοντος κύματος |
| 688 | `voltime` | Υψηλές τάσεις (3.11) | Καμπύλη τάσης–χρόνου διακένου (κριτήριο ενέργειας διάσπασης) |
| 704 | `hvdiv` | Υψηλές τάσεις (3.12) | Μέτρηση εναλλασσόμενης υψηλής τάσης: καταμεριστές (ασκήσεις 15.1.3, 15.1.5) |
| 721 | `schering` | Υψηλές τάσεις (3.12) | Γέφυρα Schering: χωρητικότητα και συντελεστής απωλειών (άσκηση 15.5.12) |
| 736 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 758 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 772 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 882 | `nn_compare` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Έλεγχος με νευρωνικό δίκτυο: σύγκριση |
| 888 | `nn_online` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Νευρωνικό που μαθαίνει αμέσως |
| 913 | `ai_block` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Ελεγκτής AI με πρόσοψη |
| 993 | `ev_drive` | Ηλεκτρικό όχημα (4.8) | Ηλεκτρικό όχημα: πολυκριτηριακός έλεγχος |
| 1000 | `nn_gui` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Σύνθεση ελέγχου από Python: κάθε μηχανή, στόχοι με βάρη |
| 1007 | `sub_legs` | Υποκυκλώματα (3.17) | Πολυφασικός buck από ένα υποκύκλωμα σκέλους |
| 1040 | `bus_dq` | Δίαυλοι (3.18) | Βρόχος ρεύματος dq με διαύλους: τριφασικός μετατροπέας προς δίκτυο |
| 1079 | `net_fault` | Δίκτυο (4.1) | Βραχυκύκλωμα σε δίκτυο: IEC 60909 και συμμετρικές συνιστώσες |
| 1099 | `gen_sc` | Συστήματα ισχύος (4.3) | Τριφασικό βραχυκύκλωμα στα άκρα σύγχρονης γεννήτριας |
| 1115 | `fbm` | Συστήματα ισχύος (4.3) | IEEE First Benchmark Model: υποσύγχρονος συντονισμός (SSR) |
| 1163 | `gen_ctl` | Συστήματα ισχύος (4.8.1) | Γεννήτρια με AVR, PSS και ρυθμιστή στροφών |
| 1205 | `ieee9_emt` | Συστήματα ισχύος (4.3) | IEEE 9 ζυγών σε EMT, από τη ροή φορτίου |
| 1222 | `ieee9_sssc` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | IEEE 9 ζυγών σε EMT με τριφασικό m-SSSC (κεντρικός έλεγχος) |
| 1252 | `trv_terminal` | Διακόπτες ισχύος (4.9) | TRV σε σφάλμα ακροδεκτών: IEC 62271-100 |
| 1273 | `trv_slf` | Διακόπτες ισχύος (4.9) | Σφάλμα κοντινής γραμμής και τόξο του διακόπτη |
| 1304 | `lightning_gis` | Κεραυνοί και συντονισμός μόνωσης (4.9) | Κεραυνός σε γραμμή 400 kV δίπλα σε υποσταθμό GIS: συντονισμός μόνωσης |
| 1367 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1388 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1437 | `cable_xb` | Καλώδια: wideband και cross-bonding (4.13) | Υπόγειο καλώδιο 150 kV με cross-bonding: αναλυτικό και ομογενές μοντέλο |
| 1480 | `sssc_1ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε γραμμή (μονοφασικό) |
| 1500 | `sssc_3ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε δίκτυο 150 kV (τριφασικό, 4 ζυγοί) |
| 1538 | `ccsc_1ph` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | CCSC: πυκνωτής σειράς ελεγχόμενος από μετατροπέα (μονοφασικό) |
| 1566 | `hvdc_mmc` | HVDC: MMC (4.14) | Σύνδεση HVDC με MMC σημείο προς σημείο (±320 kV, 1000 MW) |
| 1608 | `hvdc_lcc` | HVDC: LCC (4.16) | Το πρώτο benchmark HVDC της CIGRE (LCC 12 παλμών, 500 kV, 1000 MW) |
| 1648 | `empty` | Νέο | Κενό κύκλωμα |

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
| 206 | function | `blkUnit` |
| 213 | function | `outsOf` |
| 215 | const fn | `vecN` |
| 217 | function | `chanLabel` |
| 225 | function | `addProbe` |
| 226 | function | `flash` |
| 265 | function | `signalsFor` |
| 281 | const fn | `fold` |
| 283 | function | `fillSignals` |
| 290 | function | `renderChannels` |
| 308 | function | `requestMeasure` |
| 309 | function | `renderMeasure` |
| 318 | function | `MeasureUnit` |
| 321 | function | `simKey` |
| 322 | function | `perSeries` |
| 323 | function | `refFor` |
| 324 | const fn | `sched` |
| 328 | function | `metricsFor` |
| 332 | function | `metricsRows` |
| 337 | function | `eventMetricsHTML` |
| 339 | function | `renderMetricsPanel` |
| 350 | function | `rawSeries` |
| 353 | function | `autoF1` |
| 357 | function | `evRows` |
| 359 | function | `renderEvents` |
| 361 | const fn | `fv` |
| 367 | function | `evMaxSetting` |
| 368 | function | `eventsJson` |
| 369 | function | `eventsCsv` |
| 371 | function | `renderFFT` |
| 393 | function | `cellZ` |
| 395 | function | `renderEISForm` |
| 396 | const fn | `opt` |
| 400 | function | `runEIS` |
| 408 | function | `drawEIS` |
| 427 | function | `perSamples` |
| 429 | function | `periodText` |
| 430 | const fn | `svgPlot` |
| 432 | function | `pcmMapFn` |
| 434 | const fn | `z` |
| 437 | function | `renderPoincare` |
| 453 | function | `bfParams` |
| 455 | function | `renderBifurcationForm` |
| 461 | function | `runBifurcation` |
| 475 | function | `stopBifurcation` |
| 476 | function | `drawBifurcation` |
| 486 | function | `niceTop` |
| 489 | function | `btStatus` |
| 490 | function | `parseStep` |
| 491 | function | `runBatch` |
| 507 | function | `clearBatch` |
| 509 | function | `meanPL` |
| 511 | function | `ringTrace` |
| 513 | function | `compareHTML` |
| 523 | function | `renderBatch` |
| 528 | function | `parseCSV` |
| 530 | const fn | `cells` |
| 531 | const fn | `num` |
| 537 | const fn | `normName` |
| 538 | function | `renderCsvMap` |
| 539 | const fn | `auto` |
| 545 | function | `applyCsv` |
| 550 | function | `renderCsv` |
| 552 | function | `clearCsv` |
| 554 | function | `sampleCompareHTML` |
| 570 | function | `pwmGainsText` |
| 575 | function | `liveChange` |
| 577 | function | `renderLiveLog` |
| 586 | function | `changesToSchedule` |
| 588 | const fn | `f` |
| 597 | function | `updateLivePanel` |
| 602 | function | `setLivePanel` |
| 605 | function | `switchesOf` |
| 608 | function | `addPulses` |
| 610 | function | `pulseKeys` |
| 611 | function | `refreshControls` |
| 614 | const fn | `phase` |
| 648 | const fn | `setD` |
| 664 | const fn | `setPh` |
| 676 | const fn | `pinNow` |
| 687 | const fn | `pinSet` |
| 699 | function | `pinMap` |
| 700 | function | `pinX` |
| 701 | function | `pinV` |
| 707 | function | `liveParam` |
| 722 | function | `closeInspector` |
| 723 | function | `placePopup` |
| 726 | function | `fieldValue` |
| 731 | function | `fieldHTML` |
| 746 | function | `placeAt` |
| 747 | function | `popupDrag` |
| 756 | function | `nnBlock` |
| 757 | function | `nnBox` |
| 760 | function | `nnLearned` |
| 761 | function | `openInspector` |
| 769 | const fn | `wired` |
| 778 | const fn | `same` |
| 779 | const fn | `apply` |
| 795 | const fn | `wireWidth` |
| 796 | function | `openWireInspector` |
| 812 | const fn | `numOf` |
| 818 | function | `psec` |
| 820 | function | `propsOpen` |
| 821 | function | `setProps` |
| 823 | function | `focusComp` |
| 824 | function | `togglePin` |
| 827 | function | `renderProps` |
| 836 | function | `propsComp` |
| 837 | const fn | `secOf` |
| 839 | const fn | `row` |
| 845 | const fn | `wired` |
| 859 | function | `propsJunc` |
| 861 | function | `propsWire` |
| 867 | function | `propsMulti` |
| 870 | function | `propsCircuit` |
| 880 | const fn | `opt` |
| 890 | const fn | `sv` |
| 896 | const fn | `chk` |
| 907 | function | `bindProps` |
| 938 | function | `diagItems` |
| 947 | function | `renderDiag` |
| 958 | function | `openDiag` |
| 959 | function | `flashComp` |
| 965 | function | `scheduleStepCheck` |
| 966 | function | `runStepCheck` |
| 967 | const fn | `inPage` |
| 974 | function | `syncStepMode` |
| 1036 | function | `scenSetCode` |
| 1037 | function | `scenState` |
| 1038 | function | `scenTab` |
| 1039 | function | `scenOut` |
| 1040 | function | `scenWorker` |
| 1042 | function | `scenRun` |
| 1050 | function | `scenStop` |
| 1051 | function | `scenDone` |
| 1053 | function | `scenMsg` |
| 1068 | function | `scenBatch` |
| 1073 | function | `scenEval` |
| 1076 | function | `addonDock` |
| 1079 | function | `renderAddons` |
| 1080 | const fn | `vsel` |
| 1094 | function | `knockToast` |
| 1097 | function | `initAddons` |
| 1104 | function | `scenBatchWrite` |
| 1107 | function | `renderScenFiles` |
| 1110 | const fn | `scenNum` |
| 1111 | function | `scenTable` |
| 1112 | function | `scenShow` |
| 1125 | function | `scenTicks` |
| 1126 | function | `scenPlot` |
| 1130 | const fn | `thin` |
| 1137 | const fn | `dig` |
| 1148 | function | `initScenarios` |
| 1155 | function | `liveApply` |
| 1158 | function | `closeMenu` |
| 1159 | function | `openMenu` |
| 1180 | function | `updateHover` |
| 1198 | const fn | `atTop` |
| 1199 | function | `topDoc` |
| 1200 | function | `defsOf` |
| 1201 | const fn | `pid` |
| 1202 | function | `fullDoc` |
| 1204 | function | `commitView` |
| 1206 | function | `viewDiag` |
| 1207 | const fn | `rel` |
| 1210 | function | `compAt` |
| 1215 | function | `allComps` |
| 1216 | const fn | `walk` |
| 1222 | function | `partDef` |
| 1224 | function | `pdefaults` |
| 1225 | function | `subParams` |
| 1227 | function | `placeOk` |
| 1229 | function | `renameChannels` |
| 1231 | function | `levelDoc` |
| 1232 | function | `applyLevel` |
| 1233 | function | `groupSel` |
| 1238 | function | `expandSub` |
| 1242 | function | `libToSub` |
| 1244 | function | `uniqueSub` |
| 1245 | function | `subMenu` |
| 1249 | function | `enterSub` |
| 1255 | function | `leaveSub` |
| 1261 | function | `renderCrumbs` |
| 1269 | function | `curDef` |
| 1270 | function | `publicOf` |
| 1271 | function | `togglePublic` |
| 1279 | function | `propsSub` |
| 1287 | function | `bindSub` |
| 1295 | function | `propsDef` |
| 1310 | function | `bindDef` |
| 1326 | function | `exportDef` |
| 1328 | function | `importDefs` |
| 1339 | function | `palLoad` |
| 1340 | function | `palSave` |
| 1341 | function | `palRecent` |
| 1342 | function | `palItem` |
| 1346 | function | `renderPalette` |
| 1354 | const fn | `isOpen` |
| 1368 | function | `tutorial` |
| 1371 | function | `circuitSig` |
| 1381 | function | `tutorialRef` |
| 1382 | function | `theoryValidity` |
| 1388 | function | `staleBanner` |
| 1391 | function | `bindRestore` |
| 1392 | function | `loadTutorial` |
| 1397 | function | `migrateFile` |
| 1400 | function | `applyProject` |
| 1411 | function | `renderTutorial` |
| 1421 | function | `gallery` |
| 1427 | function | `api` |
| 1428 | function | `paramsOf` |
| 1429 | function | `avgOver` |
| 1432 | function | `simValue` |
| 1438 | function | `lastPP` |
| 1440 | function | `runTheory` |
| 1453 | function | `cmpRows` |
| 1454 | function | `stepsHTML` |
| 1455 | function | `renderTheory` |
| 1487 | function | `rippleDev` |
| 1489 | function | `periodAvgAt` |
| 1491 | function | `samplingTheory` |
| 1500 | const fn | `lastAt` |
| 1522 | function | `polyTheory` |
| 1529 | const fn | `frac` |
| 1558 | function | `lastPeriods` |
| 1559 | function | `evalOrderHTML` |
| 1568 | function | `genScTheory` |
| 1570 | const fn | `Iac` |
| 1578 | function | `shaftModes` |
| 1585 | function | `fbmTheory` |
| 1593 | function | `ieee9Theory` |
| 1601 | function | `schedNow` |
| 1603 | function | `fundOf` |
| 1609 | function | `ssscNet3` |
| 1610 | const fn | `c` |
| 1613 | const fn | `ser` |
| 1614 | const fn | `ln` |
| 1622 | function | `ssscTheory` |
| 1657 | function | `ccscTheory` |
| 1662 | const fn | `cm` |
| 1664 | const fn | `dev` |
| 1667 | const fn | `lineI` |
| 1688 | function | `ieee9ssscTheory` |
| 1703 | function | `hvdcTheory` |
| 1723 | function | `lccTheory` |
| 1724 | const fn | `st` |
| 1730 | const fn | `g` |
| 1742 | function | `wbModelHTML` |
| 1750 | function | `cableXbTheory` |
| 1751 | const fn | `rms` |
| 1752 | const fn | `pk` |
| 1764 | const fn | `v` |
| 1769 | function | `lineFdTheory` |
| 1770 | const fn | `lab` |
| 1778 | const fn | `pk` |
| 1785 | function | `trvAfterZero` |
| 1791 | function | `trvSvg` |
| 1793 | const fn | `path` |
| 1800 | function | `trvTerminalTheory` |
| 1813 | function | `trvSlfTheory` |
| 1833 | function | `lightningTheory` |
| 1835 | const fn | `pk` |
| 1853 | function | `netFaultTheory` |
| 1866 | function | `busDqTheory` |
| 1874 | function | `subLegsTheory` |
| 1883 | function | `blocksTheory` |
| 1898 | function | `pcmTheory` |
| 1924 | function | `codeTheory` |
| 1934 | function | `eisTheory` |
| 1936 | const fn | `ser` |
| 1949 | function | `imSteady` |
| 1952 | function | `imPar` |
| 1953 | function | `phaseRms` |
| 1954 | function | `vfTheory` |
| 1967 | function | `focTheory` |
| 1984 | function | `synTheory` |
| 2003 | const fn | `need` |
| 2023 | function | `pmTheory` |
| 2025 | const fn | `mtpa` |
| 2041 | function | `srmTheory` |
| 2056 | const fn | `curve` |
| 2067 | function | `lgTheory` |
| 2078 | const fn | `cr` |
| 2085 | function | `chaosTheory` |
| 2100 | function | `nnCycles` |
| 2103 | function | `genCtlTheory` |
| 2116 | function | `evTheory` |
| 2130 | function | `nnTheory` |
| 2147 | function | `nnGuiCode` |
| 2153 | function | `runNNCompare` |
| 2161 | function | `dcDriveTheory` |
| 2162 | const fn | `per` |
| 2163 | const fn | `cross` |
| 2193 | function | `twModel` |
| 2196 | const fn | `g` |
| 2199 | function | `twLattice` |
| 2206 | const fn | `marks` |
| 2209 | function | `twTheory` |
| 2217 | const fn | `at` |
| 2234 | function | `arTheory` |
| 2254 | function | `impulseMeasure` |
| 2256 | const fn | `cross` |
| 2259 | function | `marxTheory` |
| 2277 | function | `chopModel` |
| 2280 | const fn | `f` |
| 2283 | function | `chopTheory` |
| 2297 | function | `cmp3` |
| 2301 | function | `hvExact` |
| 2302 | function | `hv153Theory` |
| 2328 | function | `besI1e` |
| 2330 | function | `heaviside` |
| 2332 | function | `lossTheory` |
| 2351 | function | `vtBreak` |
| 2352 | function | `vtTheory` |
| 2372 | function | `hvdivTheory` |
| 2374 | const fn | `r` |
| 2386 | function | `scheringTheory` |
| 2387 | const fn | `inv` |
| 2396 | const fn | `sr` |
| 2402 | function | `formulaTheory` |
| 2497 | function | `nodeAvg` |
| 2503 | function | `circuitForMath` |
| 2535 | function | `scheduleMath` |
| 2536 | function | `batteryKey` |
| 2538 | function | `mathChoices` |
| 2539 | const fn | `prim` |
| 2541 | function | `renderMathChoices` |
| 2543 | function | `runTemplate` |
| 2549 | function | `runMath` |
| 2571 | function | `saveLocal` |
| 2572 | function | `saveLocalSoon` |
| 2574 | function | `download` |
| 2575 | function | `exportCSV` |
| 2581 | function | `syncScopeInputs` |
| 2582 | function | `setSpeed` |
| 2585 | function | `openSettings` |
| 2586 | const fn | `sel` |
| 2587 | const fn | `chk` |
| 2608 | function | `boot` |
| 2668 | const fn | `mv` |
| 2669 | const fn | `up` |
| 2670 | const fn | `navOpen` |
| 2681 | const fn | `probeSel` |
| 2743 | function | `renderTheoryLive` |

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
| 362 | function | `wbPane` |
| 367 | function | `matHTML` |
| 370 | function | `tablesHTML` |
| 371 | const fn | `symLab` |
| 402 | function | `onF` |
| 406 | function | `open` |
| 408 | const fn | `norm` |
| 414 | const fn | `close` |
| 415 | const fn | `pars` |
| 416 | const fn | `snap` |
| 417 | const fn | `doUndo` |
| 420 | const fn | `saveData` |
| 421 | const fn | `scanReq` |
| 425 | const fn | `scanOld` |
| 426 | const fn | `render` |
| 437 | const fn | `pane` |
| 496 | const fn | `scanBar` |
| 497 | const fn | `viewPanel` |
| 504 | const fn | `wireCommon` |
| 513 | const fn | `wirePane` |
| 514 | const fn | `wireModel` |
| 520 | const fn | `drawBox` |
| 521 | const fn | `drawNow` |
| 525 | const fn | `wireDraw` |
| 526 | const fn | `pt` |
| 527 | const fn | `world` |
| 542 | const fn | `up` |
| 544 | const fn | `tipHTML` |
| 547 | const fn | `wireData` |
| 602 | const fn | `wireGraphs` |
| 623 | const fn | `wireTables` |
| 631 | const fn | `expReq` |
| 633 | const fn | `wireExport` |
| 648 | function | `compute` |
| 656 | function | `refresh` |

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
| 32 | function | `nnBuild` |
| 44 | function | `nnStep` |
| 52 | const fn | `schedAt` |
| 53 | const fn | `num` |
| 55 | const fn | `numList` |
| 67 | function | `b64of` |
| 69 | function | `fromB64` |
| 72 | function | `snapEncode` |
| 73 | const fn | `num` |
| 74 | function | `enc` |
| 84 | function | `snapRestore` |
| 85 | function | `dec` |
| 96 | function | `smPort` |
| 100 | function | `smOut` |
| 104 | const fn | `genCopy` |
| 106 | function | `csolve` |
| 124 | function | `acInit` |
| 134 | const fn | `ad` |
| 135 | const fn | `y` |
| 183 | const fn | `seq` |
| 198 | const fn | `dad` |
| 232 | class | `NetlistError` |
| 237 | function | `dePiece` |
| 239 | const fn | `F` |
| 240 | function | `deInt` |
| 242 | function | `deFrac` |
| 248 | function | `tlSteady` |
| 250 | const fn | `at` |
| 252 | const fn | `re` |
| 263 | function | `poleG` |
| 264 | function | `tlmModeY` |
| 269 | const fn | `mm` |
| 276 | function | `tlmAcY` |
| 282 | function | `tlmSteady` |
| 283 | const fn | `vm` |
| 297 | function | `tlElement` |
| 304 | function | `tlmElement` |
| 325 | function | `rcCoefC` |
| 327 | const fn | `mul` |
| 332 | function | `wbSet` |
| 335 | function | `wbCo` |
| 337 | function | `wbPoleG` |
| 340 | function | `wbSum` |
| 342 | function | `tlwElement` |
| 361 | function | `tlwAcY` |
| 376 | function | `tlwSteady` |
| 377 | const fn | `mv` |
| 384 | const fn | `st` |
| 394 | function | `piLine` |
| 399 | const fn | `shunt` |
| 407 | function | `rcCoef` |
| 412 | function | `arcF` |
| 418 | function | `arcStep` |
| 425 | function | `arcCur` |
| 430 | function | `nlLimit` |
| 431 | function | `nlSolve` |
| 438 | function | `saiSetup` |
| 439 | const fn | `Lc` |
| 443 | function | `saiCur` |
| 451 | function | `saiCommit` |
| 461 | function | `chbCoef` |
| 466 | function | `chbCommit` |
| 473 | function | `chbStates` |
| 475 | function | `chbCount` |
| 484 | function | `mmcSample` |
| 494 | const fn | `full` |
| 503 | function | `mmcSave` |
| 504 | function | `mmcLoad` |
| 511 | function | `lccCom` |
| 514 | function | `lccMeasInit` |
| 520 | function | `lccMeasure` |
| 537 | function | `lccPlo` |
| 542 | function | `lccU` |
| 544 | function | `lccIn` |
| 547 | function | `lccSetup` |
| 550 | function | `lccEdge` |
| 552 | function | `lccGate` |
| 557 | function | `nlcStep` |
| 560 | const fn | `full` |
| 577 | function | `footLink` |
| 585 | function | `arcStart` |
| 586 | const fn | `r` |
| 589 | function | `buildNetlist` |
| 599 | const fn | `union` |
| 614 | const fn | `nm` |
| 633 | const fn | `sn` |
| 637 | const fn | `isJ` |
| 658 | const fn | `lbl` |
| 663 | const fn | `node` |
| 667 | const fn | `nodeKey` |
| 668 | const fn | `tunePwm` |
| 673 | const fn | `internal` |
| 676 | const fn | `mkBlock` |
| 683 | const fn | `add` |
| 684 | const fn | `series` |
| 942 | function | `compileSignals` |
| 975 | function | `f2Phi` |
| 980 | function | `cmpF` |
| 984 | function | `stampM` |
| 986 | function | `luFactor` |
| 992 | function | `luSolve` |
| 999 | class | `Sim` |
| 1000 | method | `constructor` |
| 1003 | method | `basePeriod` |
| 1007 | method | `tlMaxStep` |
| 1008 | method | `setStep` |
| 1011 | method | `stIndex` |
| 1026 | method | `stVec` |
| 1027 | method | `stepCfg` |
| 1028 | method | `varSetup` |
| 1031 | method | `setStepMode` |
| 1033 | method | `hGrid` |
| 1037 | method | `modeCap` |
| 1041 | method | `swEls` |
| 1042 | method | `topoKey` |
| 1043 | method | `topoInfo` |
| 1052 | method | `topoCheck` |
| 1069 | method | `lteReset` |
| 1070 | method | `ltePush` |
| 1074 | method | `lteErr` |
| 1084 | method | `varCheck` |
| 1099 | method | `note` |
| 1102 | method | `stepCheck` |
| 1103 | method | `diagnostics` |
| 1106 | method | `ringCheck` |
| 1115 | method | `stateMap` |
| 1117 | method | `stateMap0` |
| 1128 | method | `load` |
| 1171 | method | `reset` |
| 1174 | method | `imStep` |
| 1181 | method | `smStep` |
| 1183 | method | `srmStep` |
| 1184 | method | `srmOutputs` |
| 1185 | method | `smOutputs` |
| 1189 | method | `genStep` |
| 1196 | method | `genOutputs` |
| 1201 | method | `genTm` |
| 1202 | method | `genEfd` |
| 1203 | method | `imSources` |
| 1204 | method | `pyBlocks` |
| 1214 | method | `pyLazy` |
| 1216 | method | `pyUpgrade` |
| 1218 | method | `setMethod` |
| 1219 | method | `setControl` |
| 1221 | method | `setBlock` |
| 1223 | method | `setHold` |
| 1225 | method | `markChange` |
| 1230 | method | `progInit` |
| 1231 | method | `addProgram` |
| 1233 | method | `progNext` |
| 1234 | method | `progDue` |
| 1235 | method | `progApply` |
| 1250 | method | `evInit` |
| 1251 | method | `logEv` |
| 1253 | method | `events` |
| 1255 | method | `evSwitches` |
| 1257 | method | `channelKeys` |
| 1276 | method | `allocRecord` |
| 1282 | const fn | `A` |
| 1290 | method | `V` |
| 1291 | method | `elCurrent` |
| 1295 | method | `portI` |
| 1298 | method | `computeVals` |
| 1328 | method | `setRecord` |
| 1329 | method | `recordNow` |
| 1338 | method | `closePeriod` |
| 1349 | method | `lastPeriod` |
| 1350 | method | `now` |
| 1355 | method | `gateOf` |
| 1361 | method | `rawGate` |
| 1372 | method | `carrier` |
| 1375 | method | `shGrid` |
| 1376 | method | `shNext` |
| 1378 | method | `sampleHolds` |
| 1383 | method | `samples` |
| 1384 | method | `ctrlEdges` |
| 1390 | method | `scrU` |
| 1391 | method | `scrGate` |
| 1392 | method | `scrEdges` |
| 1393 | method | `setFiring` |
| 1394 | method | `compV` |
| 1395 | method | `compI` |
| 1397 | method | `dbl` |
| 1398 | method | `sampleControllers` |
| 1427 | method | `evalBlocks` |
| 1527 | method | `blkCopy` |
| 1530 | method | `blkAnyDue` |
| 1533 | method | `blkDue` |
| 1535 | method | `zcFrac` |
| 1538 | method | `saveState` |
| 1540 | method | `restoreState` |
| 1549 | method | `snapshot` |
| 1551 | method | `restoreSnapshot` |
| 1553 | method | `gateSigPeek` |
| 1556 | method | `gateSig` |
| 1561 | method | `jumpScheds` |
| 1568 | method | `jumpAt` |
| 1569 | method | `values` |
| 1594 | method | `assemble` |
| 1601 | const fn | `g` |
| 1625 | method | `rhs` |
| 1627 | const fn | `J` |
| 1646 | method | `cplLinearize` |
| 1650 | method | `factor` |
| 1656 | method | `spAssemble` |
| 1663 | method | `solveOnce` |
| 1674 | method | `solve` |
| 1692 | method | `nlLinearize` |
| 1695 | method | `check` |
| 1711 | method | `commit` |
| 1736 | method | `initialSolve` |
| 1748 | method | `tlSources` |
| 1752 | method | `tlRecord` |
| 1758 | method | `tlHist` |
| 1764 | method | `tlmG` |
| 1768 | method | `tlmSources` |
| 1780 | method | `tlmRecord` |
| 1793 | method | `tlwG` |
| 1798 | method | `tlwSources` |
| 1812 | method | `tlwRecord` |
| 1828 | method | `tlmHist` |
| 1835 | method | `step` |
| 1837 | const fn | `gs` |
| 1843 | method | `stepCore` |
| 1902 | method | `edgeSolve` |
| 1905 | method | `edgePoint` |
| 1906 | method | `mmcMoved` |
| 1909 | method | `arcGate` |
| 1917 | method | `trRestart` |
| 1921 | method | `nextEvent` |
| 1927 | const fn | `sch` |
| 1950 | method | `spwmCut` |
| 1953 | const fn | `sig` |
| 1958 | method | `run` |
| 2001 | function | `exportForBatch` |
| 2022 | const fn | `hist` |
| 2037 | const fn | `ci` |
| 2038 | const fn | `vd` |
| 2039 | const fn | `V` |
| 2042 | const fn | `linePort` |
| 2044 | const fn | `I` |
| 2045 | const fn | `portRec` |
| 2046 | const fn | `rec` |
| 2063 | const fn | `clkOf` |
| 2089 | function | `sweepPoint` |
| 2094 | function | `setPath` |
| 2100 | function | `eisPoint` |
| 2108 | function | `resume` |

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
| 583 | function | `sssc3Def` |
| 585 | const fn | `sin` |
| 586 | const fn | `E` |
| 589 | const fn | `flt` |
| 604 | const fn | `sched` |
| 618 | const fn | `vf` |
| 647 | function | `mmcDef` |
| 652 | const fn | `sin` |
| 653 | const fn | `w` |
| 659 | const fn | `refs` |
| 661 | const fn | `toU` |
| 662 | const fn | `ccsc` |
| 680 | const fn | `energy` |
| 683 | const fn | `six` |
| 741 | const fn | `arm` |
| 743 | const fn | `sw` |
| 768 | function | `mmccDef` |
| 771 | const fn | `sin` |
| 772 | const fn | `w` |
| 773 | const fn | `pos` |
| 780 | const fn | `dq` |
| 795 | const fn | `integ` |
| 848 | function | `lcc6Def` |
| 849 | const fn | `sin` |
| 877 | function | `lccsDef` |
| 878 | const fn | `sin` |
| 884 | const fn | `xf` |
| 886 | const fn | `br` |
| 944 | function | `lcccDef` |
| 945 | const fn | `sin` |
| 946 | const fn | `pos` |
| 959 | const fn | `pi` |
| 989 | function | `filtDef` |
| 990 | const fn | `pos` |
| 1001 | function | `zserDef` |
| 1013 | function | `defOf` |
| 1019 | function | `forceImpl` |
| 1021 | const fn | `fix` |
| 1025 | const fn | `hasLib` |
| 1026 | function | `needs` |
| 1028 | function | `expand` |
| 1030 | const fn | `conv` |
| 1038 | function | `warnings` |
| 1044 | const fn | `cx` |
| 1046 | function | `csolve` |
| 1051 | function | `faultCurrents` |
| 1070 | function | `behindXF` |
| 1079 | function | `layoutDef` |
| 1082 | const fn | `isG` |
| 1083 | const fn | `isJ` |
| 1092 | const fn | `side` |
| 1096 | const fn | `bfs` |
| 1105 | const fn | `bary` |
| 1111 | const fn | `ctr` |
| 1112 | const fn | `target` |
| 1128 | function | `placedDef` |
| 1133 | function | `sidesOf` |

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
| 1015 | function | `noteBox` |
| 1018 | function | `defaults` |
| 1020 | function | `elPins` |
| 1021 | function | `sigPins` |
| 1022 | function | `pinsOf` |
| 1025 | function | `parseMat` |
| 1027 | function | `nPorts` |
| 1028 | function | `portY` |
| 1029 | function | `portPins` |
| 1030 | function | `portBox` |
| 1032 | function | `posDef` |
| 1034 | function | `symmetric` |
| 1035 | function | `matInv` |
| 1040 | function | `klMatrix` |
| 1051 | function | `kgMatrix` |
| 1059 | function | `srmGeo` |
| 1061 | function | `srmSpins` |
| 1063 | function | `srmPins` |
| 1065 | function | `satD` |
| 1066 | function | `satDinv` |
| 1068 | function | `genSpins` |
| 1079 | function | `genTsc` |
| 1084 | function | `genCirc2` |
| 1085 | const fn | `Fn` |
| 1093 | function | `genAxis` |
| 1101 | const fn | `classic` |
| 1107 | const fn | `plist` |
| 1111 | function | `genModel` |
| 1117 | const fn | `w` |
| 1126 | const fn | `grp` |
| 1143 | function | `genGamma` |
| 1151 | function | `genDQ` |
| 1155 | function | `genSteady` |
| 1157 | const fn | `rot` |
| 1164 | function | `srmAlignedPsi` |
| 1165 | function | `srmModelPsi` |
| 1166 | function | `srmTableText` |
| 1169 | function | `srmMag` |
| 1185 | function | `chkMag` |
| 1187 | function | `srmA` |
| 1190 | function | `seg` |
| 1191 | function | `srmPsi` |
| 1193 | function | `srmCur` |
| 1195 | function | `srmTorque` |
| 1198 | function | `srmCoenergy` |
| 1202 | function | `waveShape` |
| 1203 | function | `waveAt` |
| 1206 | function | `waveMeasure` |
| 1209 | const fn | `cross` |
| 1215 | function | `waveFit` |
| 1216 | const fn | `res` |
| 1227 | function | `directWave` |
| 1230 | function | `impulseWave` |
| 1241 | function | `bewley` |
| 1244 | const fn | `at` |
| 1250 | function | `movChar` |
| 1255 | const fn | `pick` |
| 1256 | const fn | `cur` |
| 1257 | const fn | `inv` |
| 1261 | function | `impulseDesign` |
| 1266 | function | `impulseRoots` |
| 1269 | function | `tlParams` |
| 1278 | function | `tlmData` |
| 1280 | function | `tlmM` |
| 1287 | function | `tlmPin` |
| 1288 | function | `tlmPins` |
| 1290 | function | `tlmKey` |
| 1301 | function | `tlmModel` |
| 1309 | function | `lightningWave` |
| 1316 | function | `pinKind` |
| 1327 | function | `structural` |
| 1334 | function | `pinWidth` |
| 1337 | function | `xf` |
| 1338 | function | `pinPos` |
| 1340 | function | `pinDir` |
| 1345 | function | `cpeParams` |
| 1346 | function | `cpeBank` |
| 1350 | function | `cpeZ` |
| 1351 | function | `cpeZbank` |
| 1352 | function | `boxOf` |
| 1353 | function | `bbox` |
| 1358 | function | `fmtNum` |
| 1362 | function | `eng` |
| 1366 | function | `parseEng` |
| 1369 | function | `parseSched` |
| 1377 | function | `machines` |

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

### `web/studio/tune.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 19 | const fn | `num` |
| 47 | function | `match` |
| 49 | const fn | `put` |
| 50 | const fn | `go` |
| 59 | function | `recognise` |
| 65 | function | `solveR` |
| 70 | function | `solveJ` |
| 73 | const fn | `mix` |
| 75 | function | `model` |
| 76 | const fn | `op` |
| 79 | function | `output` |
| 81 | const fn | `dot` |
| 83 | function | `loopAt` |
| 93 | function | `margins` |
| 105 | function | `design` |
| 122 | const fn | `yOf` |
| 131 | const fn | `Gat` |
| 144 | const fn | `gains` |
| 145 | const fn | `evalK` |

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
| 61 | method | `build` |
| 75 | method | `build` |
| 88 | method | `build` |
| 103 | function | `hbridge` |
| 116 | method | `build` |
| 121 | method | `build` |
| 127 | method | `build` |
| 136 | function | `vloopGains` |
| 141 | method | `build` |
| 154 | method | `build` |
| 167 | method | `build` |
| 168 | const fn | `dev` |
| 188 | method | `build` |
| 199 | const fn | `bus` |
| 227 | function | `samplingPhase` |
| 239 | method | `build` |
| 258 | function | `rippleDev` |
| 261 | function | `polyDesign` |
| 263 | function | `polyCancel` |
| 275 | method | `build` |
| 304 | method | `build` |
| 331 | method | `build` |
| 356 | method | `build` |
| 383 | function | `invIM` |
| 398 | method | `build` |
| 412 | method | `build` |
| 439 | const fn | `r4` |
| 443 | function | `smFoc` |
| 469 | method | `build` |
| 493 | method | `build` |
| 509 | method | `build` |
| 539 | method | `build` |
| 555 | method | `build` |
| 576 | method | `build` |
| 592 | method | `build` |
| 603 | function | `marxCircuit` |
| 622 | method | `build` |
| 654 | method | `build` |
| 661 | const fn | `down` |
| 678 | method | `build` |
| 695 | method | `build` |
| 708 | method | `build` |
| 725 | method | `build` |
| 742 | method | `build` |
| 762 | method | `build` |
| 777 | method | `build` |
| 823 | function | `nnSched` |
| 824 | function | `nnDrive` |
| 887 | method | `build` |
| 894 | method | `build` |
| 900 | function | `aiBlock` |
| 919 | method | `build` |
| 930 | function | `evDrive` |
| 968 | const fn | `fix` |
| 999 | method | `build` |
| 1004 | method | `build` |
| 1013 | method | `build` |
| 1023 | const fn | `y` |
| 1046 | method | `build` |
| 1047 | const fn | `ws` |
| 1086 | method | `build` |
| 1104 | method | `build` |
| 1112 | function | `fbmPoint` |
| 1119 | method | `build` |
| 1138 | function | `smibPoint` |
| 1139 | function | `genCtl` |
| 1141 | const fn | `L` |
| 1169 | method | `build` |
| 1179 | function | `ieee9Build` |
| 1181 | const fn | `GD` |
| 1182 | const fn | `L` |
| 1184 | const fn | `G` |
| 1185 | const fn | `Ld` |
| 1210 | method | `build` |
| 1227 | method | `build` |
| 1243 | const fn | `LM` |
| 1246 | function | `tlmPart` |
| 1260 | method | `build` |
| 1279 | method | `build` |
| 1299 | function | `tlmGW` |
| 1303 | const fn | `note` |
| 1315 | method | `build` |
| 1333 | const fn | `tl` |
| 1361 | const fn | `PANE` |
| 1372 | method | `build` |
| 1374 | const fn | `rig` |
| 1393 | method | `build` |
| 1395 | const fn | `rig` |
| 1415 | function | `xbRig` |
| 1417 | const fn | `bond` |
| 1444 | method | `build` |
| 1479 | function | `ssscChannels` |
| 1488 | method | `build` |
| 1508 | method | `build` |
| 1510 | const fn | `ln` |
| 1544 | method | `build` |
| 1546 | const fn | `sw` |
| 1573 | method | `build` |
| 1577 | const fn | `station` |
| 1615 | method | `build` |
| 1649 | method | `build` |

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
| 2321 | function | `api` |

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
| 51 | class | `WBError` |
| 56 | function | `_full` |
| 68 | function | `_half` |
| 79 | function | `_pack` |
| 85 | function | `_unpack` |
| 92 | function | `_sort_poles` |
| 102 | function | `_kinds` |
| 115 | function | `_basis` |
| 127 | function | `_residues` |
| 139 | function | `start_poles` |
| 159 | function | `_clip` |
| 171 | function | `vfit_relaxed` |
| 247 | function | `_conj_clean` |
| 265 | function | `_fit_residues` |
| 289 | function | `rational` |
| 304 | function | `_sweep` |
| 340 | function | `bode_delay` |
| 373 | function | `_groups` |
| 389 | function | `_fit_scalar` |
| 404 | function | `_hbasis` |
| 416 | function | `_ls_real` |
| 428 | function | `_fit_h_phase` |
| 444 | function | `_fit_h_fdcm` |
| 459 | function | `_ratio` |
| 468 | function | `wb_fit` |
| 597 | function | `_opt_delay` |
| 630 | function | `wb_yc` |
| 637 | function | `wb_h` |
| 646 | function | `nodal` |
| 655 | function | `model_parts` |
| 668 | function | `wb_admittance` |
| 677 | function | `passivity_band` |
| 683 | function | `passivity` |
| 721 | function | `h_weight` |
| 729 | function | `_change` |
| 741 | function | `enforce_passivity` |
| 843 | function | `_coeffs` |
| 855 | function | `_gram` |
| 860 | function | `_ycfull` |
| 864 | function | `_hfull` |
| 868 | function | `_rebuild` |
| 882 | function | `_minima` |
| 896 | function | `_zero_row` |
| 901 | function | `_grad_row` |
| 925 | function | `_flatten_row` |
| 933 | function | `_apply_qinv` |
| 946 | function | `_apply` |
| 971 | function | `wb_model` |
| 1065 | function | `_yn_info` |
| 1075 | function | `to_json` |
| 1092 | function | `errors` |
| 1121 | function | `read_wb_mod` |
| 1192 | function | `import_model` |
| 1219 | function | `write_wb_mod` |
| 1248 | function | `sheath_check` |
| 1265 | function | `fit_report` |

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
