# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 116 |
| `web/studio/app.js` | 2922 |
| `web/studio/bus.js` | 197 |
| `web/studio/ctlwin.js` | 78 |
| `web/studio/editor.js` | 684 |
| `web/studio/expr.js` | 73 |
| `web/studio/inputs.js` | 62 |
| `web/studio/inside.js` | 143 |
| `web/studio/lblplace.js` | 145 |
| `web/studio/library.js` | 56 |
| `web/studio/linedata.js` | 659 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 92 |
| `web/studio/live_worker.js` | 88 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 2220 |
| `web/studio/netlib.js` | 1355 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 1492 |
| `web/studio/plotcore.js` | 133 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 87 |
| `web/studio/recview.js` | 84 |
| `web/studio/scenario.js` | 155 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 331 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 165 |
| `web/studio/stepcheck.js` | 167 |
| `web/studio/subcircuit.js` | 293 |
| `web/studio/templates.js` | 32 |
| `web/studio/trv.js` | 56 |
| `web/studio/tune.js` | 237 |
| `web/studio/tutorials.js` | 1853 |
| `web/studio/units.js` | 156 |
| `web/studio/watch.js` | 339 |
| `web/studio/winframe.js` | 63 |
| `pcl/runner.js` | 27 |
| `run.py` | 310 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 2845 |
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
| `engine/recording.py` | 425 |
| `engine/studio_math.py` | 81 |
| `engine/templates.py` | 317 |
| `engine/workbench.py` | 129 |
| `pcl/__init__.py` | 14 |
| `pcl/__main__.py` | 400 |
| `pcl/control.py` | 953 |
| `pcl/core.py` | 1348 |
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
| `tests/test_ctlwin.py` | 147 |
| `tests/test_derivation.py` | 93 |
| `tests/test_designer.py` | 200 |
| `tests/test_engine.py` | 276 |
| `tests/test_ev.py` | 104 |
| `tests/test_ev_weights.py` | 78 |
| `tests/test_gen_ctl.py` | 136 |
| `tests/test_generator.py` | 223 |
| `tests/test_gfm.py` | 222 |
| `tests/test_gfm2.py` | 167 |
| `tests/test_impl.py` | 138 |
| `tests/test_impulse_tools.py` | 150 |
| `tests/test_inputs.py` | 147 |
| `tests/test_lblplace.py` | 70 |
| `tests/test_lcc.py` | 223 |
| `tests/test_library.py` | 41 |
| `tests/test_lightning.py` | 78 |
| `tests/test_line_solver.py` | 385 |
| `tests/test_linedata.py` | 661 |
| `tests/test_lines.py` | 355 |
| `tests/test_live_program.py` | 49 |
| `tests/test_live_sim.py` | 149 |
| `tests/test_look.py` | 41 |
| `tests/test_matlab.py` | 213 |
| `tests/test_mmc.py` | 203 |
| `tests/test_netlib.py` | 209 |
| `tests/test_network.py` | 272 |
| `tests/test_nn.py` | 130 |
| `tests/test_pcl.py` | 312 |
| `tests/test_plotcore.py` | 74 |
| `tests/test_plotting.py` | 113 |
| `tests/test_recording.py` | 211 |
| `tests/test_refac.py` | 78 |
| `tests/test_sparse.py` | 53 |
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
| `tests/js/ctl_cases.js` | 33 |
| `tests/js/ev_cases.js` | 37 |
| `tests/js/ev_weights_cases.js` | 15 |
| `tests/js/gen_cases.js` | 78 |
| `tests/js/gen_ctl_cases.js` | 39 |
| `tests/js/gfm_cases.js` | 63 |
| `tests/js/impl_cases.js` | 63 |
| `tests/js/inputs_cases.js` | 30 |
| `tests/js/lblplace_cases.js` | 44 |
| `tests/js/lcc_cases.js` | 64 |
| `tests/js/library_cases.js` | 11 |
| `tests/js/lightning_cases.js` | 22 |
| `tests/js/line_cases.js` | 17 |
| `tests/js/live_cases.js` | 31 |
| `tests/js/look_cases.js` | 13 |
| `tests/js/mmc_cases.js` | 56 |
| `tests/js/netlib42_cases.js` | 50 |
| `tests/js/netlib_cases.js` | 93 |
| `tests/js/nn_cases.js` | 48 |
| `tests/js/plotcore_cases.js` | 25 |
| `tests/js/refac_cases.js` | 68 |
| `tests/js/sim_cases.js` | 356 |
| `tests/js/snapshot_cases.js` | 22 |
| `tests/js/sparse_cases.js` | 57 |
| `tests/js/sssc_cases.js` | 85 |
| `tests/js/step_cases.js` | 89 |
| `tests/js/subcircuit_cases.js` | 87 |
| `tests/js/tlm_ss_cases.js` | 18 |
| `tests/js/trstart_cases.js` | 11 |
| `tests/js/trv_cases.js` | 8 |
| `tests/js/trv_tutorial_cases.js` | 30 |
| `tests/js/tune_cases.js` | 39 |
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
| `tests/ui/features_flow.js` | 118 |
| `tests/ui/line_flow.js` | 166 |
| `tests/ui/live_flow.js` | 41 |
| `tests/ui/perf_flow.js` | 68 |
| `tests/ui/scenario_flow.js` | 70 |
| `tests/ui/scope_flow.js` | 169 |
| `tests/ui/speed_flow.js` | 104 |
| `tests/ui/step_flow.js` | 53 |
| `tests/ui/studio_flow.js` | 39 |
| `tests/ui/subcircuit_flow.js` | 79 |
| `tests/ui/ux_flow.js` | 87 |
| `tests/ui/watch_flow.js` | 113 |
| `tests/ui/wiring_flow.js` | 128 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 142 | `R` | Αντίσταση |
| 146 | `CPE` | CPE / Warburg |
| 152 | `L` | Πηνίο |
| 156 | `C` | Πυκνωτής |
| 160 | `VDC` | Πηγή DC / μπαταρία |
| 166 | `VAC` | Πηγή AC |
| 170 | `VAC3` | Τριφασική πηγή (Y) |
| 176 | `IDC` | Πηγή ρεύματος |
| 182 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 195 | `D` | Δίοδος |
| 199 | `SCR` | Θυρίστορ (SCR) |
| 211 | `XFMR` | Μετασχηματιστής |
| 219 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 232 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 245 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 255 | `KL` | Συζευγμένα πηνία (N×N) |
| 266 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 273 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 281 | `SG` | Σπινθηριστής (διάκενο) |
| 294 | `CPL` | Φορτίο σταθερής ισχύος |
| 298 | `SH` | Δειγματοληψία και συγκράτηση (S&H) |
| 307 | `GND` | Γείωση |
| 309 | `JUNC` | Κόμβος |
| 310 | `PWM` | PWM / έλεγχος |
| 348 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 359 | `VM` | Βολτόμετρο |
| 361 | `AM` | Αμπερόμετρο (σε σειρά) |
| 364 | `VP` | Probe τάσης (ως προς τη γη) |
| 366 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 368 | `MEAS` | Μέτρηση στοιχείου |
| 371 | `CONST` | Σταθερά / πρόγραμμα |
| 380 | `GAIN` | Κέρδος |
| 382 | `SUM` | Άθροισμα |
| 385 | `MUL` | Γινόμενο |
| 387 | `DIV` | Διαίρεση a/b |
| 390 | `SAT` | Κορεσμός |
| 393 | `CMP` | Συγκριτής |
| 396 | `LOGIC` | Λογική πύλη |
| 399 | `PIB` | PI διακριτός |
| 405 | `UD` | Καθυστέρηση z⁻¹ |
| 408 | `SR` | Μανδαλωτής SR (latch) |
| 411 | `CLK` | Ρολόι (τετραγωνικό) |
| 414 | `RAMP` | Φέρον / ράμπα |
| 419 | `EXPR` | Έκφραση |
| 423 | `PY` | Μπλοκ Python |
| 431 | `AIC` | Ελεγκτής AI (βρόχος με νευρωνικό) |
| 449 | `AVR` | Διέγερση και ρυθμιστής τάσης (AVR: IEEE ST1A, DC1A) |
| 460 | `PSS` | Σταθεροποιητής συστήματος (PSS) |
| 465 | `GOV` | Ρυθμιστής στροφών και στρόβιλος |
| 478 | `EVC` | Πολυκριτηριακός ελεγκτής οχήματος (ταχύτητα → ροπή → ρεύμα) |
| 488 | `NN` | Νευρωνικό δίκτυο (MLP) |
| 551 | `MOD3` | Διαμορφωτής τριφασικός |
| 555 | `FEST` | Εκτιμητής ροής δρομέα |
| 559 | `INT` | Ολοκληρωτής |
| 563 | `LPF` | Βαθυπερατό 1ης τάξης |
| 567 | `F2` | Φίλτρο 2ης τάξης |
| 572 | `RLIM` | Όριο ρυθμού μεταβολής |
| 576 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 580 | `EDGE` | Ανιχνευτής ακμής |
| 584 | `CLARKE` | Clarke abc → αβ |
| 588 | `ICLARKE` | Clarke αβ → abc |
| 592 | `PARK` | Park αβ → dq |
| 595 | `IPARK` | Park dq → αβ |
| 598 | `PLL` | PLL (τριφασικό) |
| 604 | `TAGO` | Ετικέτα: προς (Goto) |
| 607 | `TAGI` | Ετικέτα: από (From) |
| 610 | `DISP` | Ένδειξη |
| 614 | `SUB` | Υποκύκλωμα |
| 617 | `PORT` | Θύρα (ηλεκτρική) |
| 620 | `SIN` | Θύρα εισόδου σήματος |
| 623 | `SOUT` | Θύρα εξόδου σήματος |
| 627 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 632 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 636 | `BSEL` | Επιλογή από δίαυλο |
| 639 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 645 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 656 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 665 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 675 | `ARCX` | Τμήμα τόξου |
| 679 | `ARC` | Διακόπτης με τόξο (μονοφασικός) |
| 686 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 697 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 742 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 755 | `TLM` | Γραμμή από γεωμετρία (CP / FD / WB) |
| 791 | `TOWER` | Πύργος γραμμής (κεραυνοί) |
| 808 | `SAI` | Αλεξικέραυνο ZnO, μοντέλο IEEE (εξαρτάται από τη συχνότητα) |
| 823 | `SAIX` | Αλεξικέραυνο IEEE (συμπαγές) |
| 827 | `RFX` | Γείωση πύργου R(I) (από τη γραμμή του πύργου) |
| 833 | `CHB` | Αρθρωτός βραχίονας: γέφυρες H σε σειρά (CHB) |
| 841 | `NLC` | Διαμόρφωση πλησιέστερης στάθμης (NLC) με ταξινόμηση |
| 847 | `SPLL` | PLL μονοφασικό (SOGI) |
| 854 | `SSSC` | Έλεγχος αρθρωτού SSSC (m-SSSC) |
| 873 | `SSSC3` | Κεντρικός έλεγχος τριφασικού m-SSSC |
| 897 | `MMC` | Μετατροπέας MMC (HVDC, μοντέλα 1–4) |
| 926 | `MMCC` | Έλεγχος σταθμού MMC (HVDC) |
| 973 | `VSC2` | Μετατροπέας VSC δύο επιπέδων (μέσο μοντέλο, φίλτρο L ή LC) |
| 986 | `GFMC` | Έλεγχος grid-forming (στατικότητα, VSM, PSC) |
| 1026 | `LCC6` | Γέφυρα θυρίστορ 6 παλμών (LCC) |
| 1042 | `LCCS` | Σταθμός LCC 12 παλμών (HVDC) |
| 1057 | `LCCC` | Έλεγχος σταθμού LCC (HVDC) |
| 1082 | `FILT3` | Φίλτρο AC τριφασικό |
| 1088 | `ZSER3` | Τριφασική εμπέδηση σειράς (R + L + (R + L) ∥ R) |
| 1094 | `LCCX` | Γέφυρα 6 παλμών (συμπαγής) |
| 1099 | `LCCM` | Μέτρηση α και γ (γέφυρα 6 παλμών) |
| 1104 | `MMCA` | Βραχίονας MMC (συμπαγής) |
| 1109 | `CHBX` | Αρθρωτός βραχίονας (συμπαγής) |
| 1112 | `SPLX` | PLL μονοφασικό (SOGI, συμπαγές) |
| 1116 | `NOTE` | Σημείωση (κείμενο στο σχέδιο) |

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
| 1001 | `ev_drive` | Ηλεκτρικό όχημα (4.8) | Ηλεκτρικό όχημα: πολυκριτηριακός έλεγχος |
| 1008 | `nn_gui` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Σύνθεση ελέγχου από Python: κάθε μηχανή, στόχοι με βάρη |
| 1015 | `sub_legs` | Υποκυκλώματα (3.17) | Πολυφασικός buck από ένα υποκύκλωμα σκέλους |
| 1048 | `bus_dq` | Δίαυλοι (3.18) | Βρόχος ρεύματος dq με διαύλους: τριφασικός μετατροπέας προς δίκτυο |
| 1087 | `net_fault` | Δίκτυο (4.1) | Βραχυκύκλωμα σε δίκτυο: IEC 60909 και συμμετρικές συνιστώσες |
| 1107 | `gen_sc` | Συστήματα ισχύος (4.3) | Τριφασικό βραχυκύκλωμα στα άκρα σύγχρονης γεννήτριας |
| 1123 | `fbm` | Συστήματα ισχύος (4.3) | IEEE First Benchmark Model: υποσύγχρονος συντονισμός (SSR) |
| 1171 | `gen_ctl` | Συστήματα ισχύος (4.8.1) | Γεννήτρια με AVR, PSS και ρυθμιστή στροφών |
| 1213 | `ieee9_emt` | Συστήματα ισχύος (4.3) | IEEE 9 ζυγών σε EMT, από τη ροή φορτίου |
| 1230 | `ieee9_sssc` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | IEEE 9 ζυγών σε EMT με τριφασικό m-SSSC (κεντρικός έλεγχος) |
| 1260 | `trv_terminal` | Διακόπτες ισχύος (4.9) | TRV σε σφάλμα ακροδεκτών: IEC 62271-100 |
| 1281 | `trv_slf` | Διακόπτες ισχύος (4.9) | Σφάλμα κοντινής γραμμής και τόξο του διακόπτη |
| 1312 | `lightning_gis` | Κεραυνοί και συντονισμός μόνωσης (4.9) | Κεραυνός σε γραμμή 400 kV δίπλα σε υποσταθμό GIS: συντονισμός μόνωσης |
| 1375 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1396 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1445 | `cable_xb` | Καλώδια: wideband και cross-bonding (4.13) | Υπόγειο καλώδιο 150 kV με cross-bonding: αναλυτικό και ομογενές μοντέλο |
| 1488 | `sssc_1ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε γραμμή (μονοφασικό) |
| 1508 | `sssc_3ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε δίκτυο 150 kV (τριφασικό, 4 ζυγοί) |
| 1546 | `ccsc_1ph` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | CCSC: πυκνωτής σειράς ελεγχόμενος από μετατροπέα (μονοφασικό) |
| 1574 | `hvdc_mmc` | HVDC: MMC (4.14) | Σύνδεση HVDC με MMC σημείο προς σημείο (±320 kV, 1000 MW) |
| 1617 | `hvdc_gfm` | Grid-forming (4.18.1) | Σταθμός MMC ως grid-forming: νησίδα, ασθενές δίκτυο, παράλληλα με άλλη μονάδα |
| 1665 | `hvdc_lcc` | HVDC: LCC (4.16) | Το πρώτο benchmark HVDC της CIGRE (LCC 12 παλμών, 500 kV, 1000 MW) |
| 1719 | `gfm_island` | Grid-forming (4.18) | Νησίδα με δύο μετατροπείς grid-forming: μοιρασιά του φορτίου με τη στατικότητα |
| 1746 | `gfm_sync` | Grid-forming (4.18) | Synchronverter: αντιστροφέας που μιμείται σύγχρονη γεννήτρια (Zhong & Weiss 2011) |
| 1774 | `gfm_weak` | Grid-forming (4.18) | Συγχρονισμός μέσω ισχύος (PSC) σε ασθενές δίκτυο, απέναντι στον έλεγχο ρεύματος με PLL |
| 1811 | `ieee9_gfm` | Grid-forming (4.18.1) | IEEE 9 με μετατροπέα στη θέση της G3: grid-forming ή grid-following (nadir, RoCoF) |
| 1841 | `empty` | Νέο | Κενό κύκλωμα |

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
| 68 | function | `memAuto` |
| 69 | function | `memChoice` |
| 70 | function | `memSetting` |
| 71 | const fn | `fmtDur` |
| 72 | function | `memEstimate` |
| 77 | function | `recArchive` |
| 80 | function | `recSettings` |
| 82 | function | `renderRecPanel` |
| 95 | function | `renderRec` |
| 97 | function | `recToggle` |
| 108 | function | `recCollect` |
| 113 | function | `recFlush` |
| 122 | function | `pyPage` |
| 126 | function | `runToEnd` |
| 129 | const fn | `chunk` |
| 131 | function | `loop` |
| 159 | function | `draw` |
| 161 | function | `setText` |
| 162 | function | `navRange` |
| 163 | function | `updateClock` |
| 167 | function | `liveOf` |
| 213 | function | `blkUnit` |
| 220 | function | `outsOf` |
| 222 | const fn | `vecN` |
| 224 | function | `chanLabel` |
| 234 | function | `chanSrc` |
| 235 | function | `addProbe` |
| 236 | function | `flash` |
| 283 | function | `signalsFor` |
| 299 | const fn | `fold` |
| 301 | function | `fillSignals` |
| 308 | function | `renderChannels` |
| 329 | function | `requestMeasure` |
| 330 | function | `renderMeasure` |
| 342 | function | `MeasureUnit` |
| 345 | function | `simKey` |
| 346 | function | `perSeries` |
| 347 | function | `refFor` |
| 348 | const fn | `sched` |
| 352 | function | `metricsFor` |
| 356 | function | `metricsRows` |
| 361 | function | `eventMetricsHTML` |
| 363 | function | `renderMetricsPanel` |
| 374 | function | `rawSeries` |
| 377 | function | `autoF1` |
| 381 | function | `evRows` |
| 383 | function | `renderEvents` |
| 385 | const fn | `fv` |
| 391 | function | `evMaxSetting` |
| 392 | function | `eventsJson` |
| 393 | function | `eventsCsv` |
| 395 | function | `renderFFT` |
| 417 | function | `cellZ` |
| 419 | function | `renderEISForm` |
| 420 | const fn | `opt` |
| 424 | function | `runEIS` |
| 432 | function | `drawEIS` |
| 451 | function | `perSamples` |
| 453 | function | `periodText` |
| 454 | const fn | `svgPlot` |
| 456 | function | `pcmMapFn` |
| 458 | const fn | `z` |
| 461 | function | `renderPoincare` |
| 477 | function | `bfParams` |
| 479 | function | `renderBifurcationForm` |
| 485 | function | `runBifurcation` |
| 499 | function | `stopBifurcation` |
| 500 | function | `drawBifurcation` |
| 510 | function | `niceTop` |
| 513 | function | `btStatus` |
| 514 | function | `parseStep` |
| 515 | function | `runBatch` |
| 531 | function | `clearBatch` |
| 533 | function | `meanPL` |
| 535 | function | `ringTrace` |
| 537 | function | `compareHTML` |
| 547 | function | `renderBatch` |
| 552 | function | `parseCSV` |
| 554 | const fn | `cells` |
| 555 | const fn | `num` |
| 561 | const fn | `normName` |
| 562 | function | `renderCsvMap` |
| 563 | const fn | `auto` |
| 569 | function | `applyCsv` |
| 574 | function | `renderCsv` |
| 576 | function | `clearCsv` |
| 578 | function | `sampleCompareHTML` |
| 594 | function | `pwmGainsText` |
| 601 | function | `toggleInput` |
| 604 | function | `setInputMeta` |
| 608 | function | `inputsHTML` |
| 609 | const fn | `val` |
| 618 | function | `liveChange` |
| 620 | function | `renderLiveLog` |
| 629 | function | `changesToSchedule` |
| 631 | const fn | `f` |
| 640 | function | `updateLivePanel` |
| 645 | function | `setLivePanel` |
| 648 | function | `switchesOf` |
| 651 | function | `addPulses` |
| 653 | function | `pulseKeys` |
| 654 | function | `refreshControls` |
| 657 | const fn | `phase` |
| 691 | const fn | `setD` |
| 707 | const fn | `setPh` |
| 719 | const fn | `pinNow` |
| 730 | const fn | `pinSet` |
| 742 | function | `pinMap` |
| 743 | function | `pinX` |
| 744 | function | `pinV` |
| 750 | function | `liveParam` |
| 765 | function | `closeInspector` |
| 766 | function | `placePopup` |
| 769 | function | `fieldValue` |
| 774 | function | `fieldHTML` |
| 789 | function | `placeAt` |
| 790 | function | `popupDrag` |
| 799 | function | `nnBlock` |
| 800 | function | `nnBox` |
| 803 | function | `nnLearned` |
| 804 | function | `openInspector` |
| 812 | const fn | `wired` |
| 822 | const fn | `same` |
| 823 | const fn | `apply` |
| 838 | function | `ctlCtx` |
| 843 | function | `openCtlWin` |
| 847 | const fn | `wireWidth` |
| 848 | function | `openWireInspector` |
| 865 | const fn | `numOf` |
| 871 | function | `psec` |
| 873 | function | `propsOpen` |
| 874 | function | `setProps` |
| 876 | function | `focusComp` |
| 877 | function | `togglePin` |
| 880 | function | `renderProps` |
| 889 | function | `propsComp` |
| 890 | const fn | `secOf` |
| 892 | const fn | `exprV` |
| 893 | const fn | `inpB` |
| 894 | const fn | `row` |
| 900 | const fn | `wired` |
| 914 | function | `propsJunc` |
| 916 | function | `propsWire` |
| 922 | function | `propsMulti` |
| 925 | function | `propsCircuit` |
| 936 | const fn | `opt` |
| 946 | const fn | `sv` |
| 961 | const fn | `chk` |
| 972 | function | `bindProps` |
| 1008 | function | `diagItems` |
| 1017 | function | `renderDiag` |
| 1028 | function | `openDiag` |
| 1029 | function | `flashComp` |
| 1035 | function | `scheduleStepCheck` |
| 1036 | function | `runStepCheck` |
| 1037 | const fn | `inPage` |
| 1044 | function | `syncStepMode` |
| 1106 | function | `scenSetCode` |
| 1107 | function | `scenState` |
| 1108 | function | `scenTab` |
| 1109 | function | `scenOut` |
| 1110 | function | `scenWorker` |
| 1112 | function | `scenRun` |
| 1120 | function | `scenStop` |
| 1121 | function | `scenDone` |
| 1123 | function | `scenMsg` |
| 1138 | function | `scenBatch` |
| 1143 | function | `scenEval` |
| 1146 | function | `addonDock` |
| 1149 | function | `renderAddons` |
| 1150 | const fn | `vsel` |
| 1164 | function | `knockToast` |
| 1167 | function | `initAddons` |
| 1174 | function | `scenBatchWrite` |
| 1177 | function | `renderScenFiles` |
| 1180 | const fn | `scenNum` |
| 1181 | function | `scenTable` |
| 1182 | function | `scenShow` |
| 1195 | function | `scenTicks` |
| 1196 | function | `scenPlot` |
| 1200 | const fn | `thin` |
| 1207 | const fn | `dig` |
| 1218 | function | `initScenarios` |
| 1225 | function | `liveApply` |
| 1228 | function | `closeMenu` |
| 1229 | function | `openMenu` |
| 1250 | function | `updateHover` |
| 1268 | const fn | `atTop` |
| 1269 | function | `topDoc` |
| 1270 | function | `defsOf` |
| 1271 | const fn | `pid` |
| 1272 | function | `fullDoc` |
| 1274 | function | `commitView` |
| 1276 | function | `viewDiag` |
| 1277 | const fn | `rel` |
| 1280 | function | `compAt` |
| 1285 | function | `allComps` |
| 1286 | const fn | `walk` |
| 1292 | function | `partDef` |
| 1294 | function | `pdefaults` |
| 1295 | function | `subParams` |
| 1297 | function | `placeOk` |
| 1299 | function | `renameChannels` |
| 1301 | function | `levelDoc` |
| 1302 | function | `applyLevel` |
| 1303 | function | `groupSel` |
| 1308 | function | `expandSub` |
| 1312 | function | `libToSub` |
| 1314 | function | `uniqueSub` |
| 1315 | function | `subMenu` |
| 1319 | function | `enterSub` |
| 1325 | function | `leaveSub` |
| 1331 | function | `renderCrumbs` |
| 1339 | function | `curDef` |
| 1340 | function | `publicOf` |
| 1341 | function | `togglePublic` |
| 1349 | function | `propsSub` |
| 1357 | function | `bindSub` |
| 1365 | function | `propsDef` |
| 1380 | function | `bindDef` |
| 1396 | function | `exportDef` |
| 1398 | function | `importDefs` |
| 1409 | function | `palLoad` |
| 1410 | function | `palSave` |
| 1411 | function | `palRecent` |
| 1412 | function | `palItem` |
| 1416 | function | `renderPalette` |
| 1424 | const fn | `isOpen` |
| 1438 | function | `tutorial` |
| 1441 | function | `circuitSig` |
| 1451 | function | `tutorialRef` |
| 1452 | function | `theoryValidity` |
| 1458 | function | `staleBanner` |
| 1461 | function | `bindRestore` |
| 1462 | function | `loadTutorial` |
| 1467 | function | `migrateFile` |
| 1470 | function | `applyProject` |
| 1481 | function | `renderTutorial` |
| 1491 | function | `gallery` |
| 1497 | function | `api` |
| 1498 | function | `paramsOf` |
| 1501 | function | `avgOver` |
| 1504 | function | `simValue` |
| 1510 | function | `lastPP` |
| 1512 | function | `runTheory` |
| 1525 | function | `cmpRows` |
| 1526 | function | `stepsHTML` |
| 1527 | function | `renderTheory` |
| 1559 | function | `rippleDev` |
| 1561 | function | `periodAvgAt` |
| 1563 | function | `samplingTheory` |
| 1572 | const fn | `lastAt` |
| 1594 | function | `polyTheory` |
| 1601 | const fn | `frac` |
| 1630 | function | `lastPeriods` |
| 1631 | function | `evalOrderHTML` |
| 1640 | function | `genScTheory` |
| 1642 | const fn | `Iac` |
| 1650 | function | `shaftModes` |
| 1657 | function | `fbmTheory` |
| 1665 | function | `ieee9Theory` |
| 1673 | function | `schedNow` |
| 1675 | function | `fundOf` |
| 1681 | function | `ssscNet3` |
| 1682 | const fn | `c` |
| 1685 | const fn | `ser` |
| 1686 | const fn | `ln` |
| 1694 | function | `ssscTheory` |
| 1729 | function | `ccscTheory` |
| 1734 | const fn | `cm` |
| 1736 | const fn | `dev` |
| 1739 | const fn | `lineI` |
| 1760 | function | `ieee9ssscTheory` |
| 1775 | function | `hvdcTheory` |
| 1795 | function | `gfmTheory` |
| 1836 | function | `ieee9GfmTheory` |
| 1854 | function | `hvdcGfmTheory` |
| 1867 | function | `lccTheory` |
| 1868 | const fn | `st` |
| 1874 | const fn | `g` |
| 1886 | function | `wbModelHTML` |
| 1894 | function | `cableXbTheory` |
| 1895 | const fn | `rms` |
| 1896 | const fn | `pk` |
| 1908 | const fn | `v` |
| 1913 | function | `lineFdTheory` |
| 1914 | const fn | `lab` |
| 1922 | const fn | `pk` |
| 1929 | function | `trvAfterZero` |
| 1935 | function | `trvSvg` |
| 1937 | const fn | `path` |
| 1944 | function | `trvTerminalTheory` |
| 1957 | function | `trvSlfTheory` |
| 1977 | function | `lightningTheory` |
| 1979 | const fn | `pk` |
| 1997 | function | `netFaultTheory` |
| 2010 | function | `busDqTheory` |
| 2018 | function | `subLegsTheory` |
| 2027 | function | `blocksTheory` |
| 2042 | function | `pcmTheory` |
| 2068 | function | `codeTheory` |
| 2078 | function | `eisTheory` |
| 2080 | const fn | `ser` |
| 2093 | function | `imSteady` |
| 2096 | function | `imPar` |
| 2097 | function | `phaseRms` |
| 2098 | function | `vfTheory` |
| 2111 | function | `focTheory` |
| 2128 | function | `synTheory` |
| 2147 | const fn | `need` |
| 2167 | function | `pmTheory` |
| 2169 | const fn | `mtpa` |
| 2185 | function | `srmTheory` |
| 2200 | const fn | `curve` |
| 2211 | function | `lgTheory` |
| 2222 | const fn | `cr` |
| 2229 | function | `chaosTheory` |
| 2244 | function | `nnCycles` |
| 2247 | function | `genCtlTheory` |
| 2260 | function | `evTheory` |
| 2274 | function | `nnTheory` |
| 2291 | function | `nnGuiCode` |
| 2297 | function | `runNNCompare` |
| 2305 | function | `dcDriveTheory` |
| 2306 | const fn | `per` |
| 2307 | const fn | `cross` |
| 2337 | function | `twModel` |
| 2340 | const fn | `g` |
| 2343 | function | `twLattice` |
| 2350 | const fn | `marks` |
| 2353 | function | `twTheory` |
| 2361 | const fn | `at` |
| 2378 | function | `arTheory` |
| 2398 | function | `impulseMeasure` |
| 2400 | const fn | `cross` |
| 2403 | function | `marxTheory` |
| 2421 | function | `chopModel` |
| 2424 | const fn | `f` |
| 2427 | function | `chopTheory` |
| 2441 | function | `cmp3` |
| 2445 | function | `hvExact` |
| 2446 | function | `hv153Theory` |
| 2472 | function | `besI1e` |
| 2474 | function | `heaviside` |
| 2476 | function | `lossTheory` |
| 2495 | function | `vtBreak` |
| 2496 | function | `vtTheory` |
| 2516 | function | `hvdivTheory` |
| 2518 | const fn | `r` |
| 2530 | function | `scheringTheory` |
| 2531 | const fn | `inv` |
| 2540 | const fn | `sr` |
| 2546 | function | `formulaTheory` |
| 2644 | function | `nodeAvg` |
| 2650 | function | `circuitForMath` |
| 2686 | function | `scheduleMath` |
| 2687 | function | `batteryKey` |
| 2689 | function | `mathChoices` |
| 2690 | const fn | `prim` |
| 2692 | function | `renderMathChoices` |
| 2694 | function | `runTemplate` |
| 2700 | function | `runMath` |
| 2722 | function | `saveLocal` |
| 2723 | function | `saveLocalSoon` |
| 2725 | function | `download` |
| 2726 | function | `exportCSV` |
| 2732 | function | `syncScopeInputs` |
| 2733 | function | `setSpeed` |
| 2736 | function | `openSettings` |
| 2737 | const fn | `sel` |
| 2738 | const fn | `chk` |
| 2764 | function | `applyLook` |
| 2768 | function | `boot` |
| 2838 | const fn | `mv` |
| 2839 | const fn | `up` |
| 2840 | const fn | `navOpen` |
| 2856 | const fn | `probeSel` |
| 2918 | function | `renderTheoryLive` |

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

### `web/studio/ctlwin.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | const fn | `PC` |
| 11 | const fn | `esc` |
| 13 | function | `poly` |
| 16 | function | `rootTxt` |
| 18 | function | `open` |
| 21 | const fn | `close` |
| 41 | const fn | `$` |
| 45 | const fn | `num` |
| 46 | function | `read` |
| 47 | function | `vis` |
| 48 | function | `compute` |
| 50 | function | `render` |
| 65 | const fn | `soon` |

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
| 298 | method | `render` |
| 300 | method | `partEls` |
| 301 | method | `partSVG` |
| 307 | method | `renderPart` |
| 308 | method | `valueText` |
| 310 | const fn | `fn` |
| 346 | method | `noteHTML` |
| 351 | method | `lblMeasure` |
| 358 | method | `lvChars` |
| 364 | method | `renderLabels` |
| 370 | const fn | `r1` |
| 371 | const fn | `line` |
| 383 | method | `relabelSoon` |
| 384 | method | `renderWires` |
| 403 | method | `wireSVG` |
| 415 | method | `redrawWire` |
| 416 | method | `pathD` |
| 421 | method | `segDir` |
| 422 | method | `midLabel` |
| 423 | method | `renderPins` |
| 433 | method | `renderSel` |
| 437 | method | `setLive` |
| 439 | method | `updateLive` |
| 451 | method | `drawArrows` |
| 462 | method | `world` |
| 464 | method | `hitAt` |
| 465 | method | `hitOf` |
| 467 | method | `down` |
| 493 | method | `move` |
| 506 | method | `up` |
| 520 | method | `cancelDrag` |
| 521 | method | `hoverPin` |
| 523 | method | `dbl` |
| 524 | method | `menu` |
| 527 | method | `worldNow` |
| 528 | method | `wheel` |
| 535 | method | `letter` |
| 536 | method | `key` |
| 560 | method | `beginDrag` |
| 571 | method | `dragMove` |
| 583 | method | `endDrag` |
| 593 | method | `bakeMove` |
| 598 | method | `dragSeg` |
| 601 | const fn | `stub` |
| 610 | method | `drawMarquee` |
| 613 | method | `marqueeSelect` |
| 616 | const fn | `inside` |
| 623 | method | `escape` |
| 626 | method | `beginPlace` |
| 627 | method | `ghost` |
| 629 | method | `finishPlace` |
| 630 | method | `cancelPlace` |
| 632 | method | `startWire` |
| 633 | method | `startWireFrom` |
| 634 | method | `previewWire` |
| 643 | method | `wireClick` |
| 649 | method | `orthoNext` |
| 650 | method | `finishWire` |
| 666 | method | `cancelWire` |
| 668 | method | `splitWire` |
| 678 | method | `wireNetPin` |
| 680 | method | `canScroll` |

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

### `web/studio/inputs.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 15 | const fn | `isExpr` |
| 16 | const fn | `yes` |
| 17 | const fn | `defsOf` |
| 20 | const fn | `exprAt` |
| 21 | const fn | `safe` |
| 22 | const fn | `numOf` |
| 26 | function | `list` |
| 33 | function | `needs` |
| 35 | function | `evaluate` |
| 38 | function | `resolve` |

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

### `web/studio/lblplace.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 19 | const fn | `asc` |
| 32 | function | `est` |
| 34 | const fn | `ov` |
| 36 | function | `clipLen` |
| 40 | class | `Grid` |
| 42 | method | `add` |
| 43 | method | `del` |
| 44 | method | `near` |
| 45 | const fn | `midLabel` |
| 48 | function | `sideOf` |
| 55 | function | `gather` |
| 80 | function | `stack` |
| 104 | function | `cands` |
| 107 | function | `cost` |
| 111 | function | `place` |
| 115 | const fn | `best0` |
| 118 | const fn | `put` |
| 119 | const fn | `pick` |
| 125 | const fn | `ctr` |
| 134 | function | `layout` |
| 136 | function | `check` |

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
| 37 | function | `nnBuild` |
| 49 | function | `nnStep` |
| 57 | const fn | `schedAt` |
| 58 | const fn | `num` |
| 60 | const fn | `numList` |
| 72 | function | `b64of` |
| 74 | function | `fromB64` |
| 77 | function | `snapEncode` |
| 78 | const fn | `num` |
| 79 | function | `enc` |
| 89 | function | `snapRestore` |
| 90 | function | `dec` |
| 101 | function | `smPort` |
| 105 | function | `smOut` |
| 109 | const fn | `genCopy` |
| 111 | function | `csolve` |
| 129 | function | `acInit` |
| 139 | const fn | `ad` |
| 140 | const fn | `y` |
| 189 | const fn | `seq` |
| 204 | const fn | `dad` |
| 238 | class | `NetlistError` |
| 243 | function | `dePiece` |
| 245 | const fn | `F` |
| 246 | function | `deInt` |
| 248 | function | `deFrac` |
| 254 | function | `tlSteady` |
| 256 | const fn | `at` |
| 258 | const fn | `re` |
| 269 | function | `poleG` |
| 270 | function | `tlmModeY` |
| 275 | const fn | `mm` |
| 282 | function | `tlmAcY` |
| 288 | function | `tlmSteady` |
| 289 | const fn | `vm` |
| 303 | function | `tlElement` |
| 310 | function | `tlmElement` |
| 331 | function | `rcCoefC` |
| 333 | const fn | `mul` |
| 338 | function | `wbSet` |
| 343 | function | `wbCo` |
| 347 | function | `wbPoleG` |
| 350 | function | `wbSum` |
| 352 | function | `tlwElement` |
| 371 | function | `tlwAcY` |
| 386 | function | `tlwSteady` |
| 387 | const fn | `mv` |
| 394 | const fn | `st` |
| 404 | function | `piLine` |
| 409 | const fn | `shunt` |
| 417 | function | `rcCoef` |
| 423 | function | `fdCo` |
| 433 | function | `arcF` |
| 439 | function | `arcStep` |
| 446 | function | `arcCur` |
| 451 | function | `nlLimit` |
| 452 | function | `nlSolve` |
| 459 | function | `saiSetup` |
| 460 | const fn | `Lc` |
| 464 | function | `saiCur` |
| 472 | function | `saiCommit` |
| 482 | function | `chbCoef` |
| 487 | function | `chbCommit` |
| 494 | function | `chbStates` |
| 496 | function | `chbCount` |
| 505 | function | `mmcSample` |
| 515 | const fn | `full` |
| 524 | function | `mmcSave` |
| 525 | function | `mmcLoad` |
| 532 | function | `lccCom` |
| 535 | function | `lccMeasInit` |
| 541 | function | `lccMeasure` |
| 558 | function | `lccPlo` |
| 563 | function | `lccU` |
| 565 | function | `lccIn` |
| 568 | function | `lccSetup` |
| 571 | function | `lccEdge` |
| 573 | function | `lccGate` |
| 578 | function | `nlcStep` |
| 581 | const fn | `full` |
| 598 | function | `footLink` |
| 606 | function | `arcStart` |
| 607 | const fn | `r` |
| 610 | function | `buildNetlist` |
| 623 | const fn | `union` |
| 638 | const fn | `nm` |
| 657 | const fn | `sn` |
| 661 | const fn | `isJ` |
| 684 | const fn | `lbl` |
| 689 | const fn | `node` |
| 693 | const fn | `nodeKey` |
| 694 | const fn | `tunePwm` |
| 704 | const fn | `internal` |
| 707 | const fn | `mkBlock` |
| 714 | const fn | `add` |
| 715 | const fn | `series` |
| 977 | function | `compileSignals` |
| 1010 | function | `f2Phi` |
| 1015 | function | `cmpF` |
| 1019 | function | `stampM` |
| 1021 | function | `luFactor` |
| 1027 | function | `luSolve` |
| 1034 | class | `Sim` |
| 1035 | method | `constructor` |
| 1038 | method | `basePeriod` |
| 1042 | method | `tlMaxStep` |
| 1043 | method | `setStep` |
| 1046 | method | `stIndex` |
| 1061 | method | `stVec` |
| 1062 | method | `stepCfg` |
| 1063 | method | `varSetup` |
| 1066 | method | `setStepMode` |
| 1068 | method | `hGrid` |
| 1072 | method | `modeCap` |
| 1076 | method | `swEls` |
| 1077 | method | `topoKey` |
| 1078 | method | `topoInfo` |
| 1087 | method | `topoCheck` |
| 1104 | method | `lteReset` |
| 1105 | method | `ltePush` |
| 1109 | method | `lteErr` |
| 1119 | method | `varCheck` |
| 1134 | method | `note` |
| 1137 | method | `stepCheck` |
| 1138 | method | `diagnostics` |
| 1141 | method | `ringCheck` |
| 1150 | method | `stateMap` |
| 1152 | method | `stateMap0` |
| 1163 | method | `load` |
| 1215 | method | `reset` |
| 1218 | method | `imStep` |
| 1225 | method | `smStep` |
| 1227 | method | `srmStep` |
| 1228 | method | `srmOutputs` |
| 1229 | method | `smOutputs` |
| 1233 | method | `genStep` |
| 1240 | method | `genOutputs` |
| 1245 | method | `genTm` |
| 1246 | method | `genEfd` |
| 1247 | method | `imSources` |
| 1248 | method | `pyBlocks` |
| 1258 | method | `pyLazy` |
| 1260 | method | `pyUpgrade` |
| 1262 | method | `setMethod` |
| 1263 | method | `setControl` |
| 1265 | method | `setBlock` |
| 1267 | method | `setHold` |
| 1269 | method | `markChange` |
| 1274 | method | `progInit` |
| 1275 | method | `addProgram` |
| 1277 | method | `progNext` |
| 1278 | method | `progDue` |
| 1279 | method | `progApply` |
| 1294 | method | `evInit` |
| 1295 | method | `logEv` |
| 1297 | method | `events` |
| 1299 | method | `evSwitches` |
| 1301 | method | `channelKeys` |
| 1320 | method | `allocRecord` |
| 1326 | const fn | `A` |
| 1334 | method | `V` |
| 1335 | method | `elCurrent` |
| 1339 | method | `portI` |
| 1343 | method | `computeVals` |
| 1377 | method | `setRecord` |
| 1378 | method | `recordNow` |
| 1388 | method | `closePeriod` |
| 1399 | method | `lastPeriod` |
| 1400 | method | `now` |
| 1405 | method | `gateOf` |
| 1411 | method | `rawGate` |
| 1422 | method | `carrier` |
| 1425 | method | `shGrid` |
| 1426 | method | `shNext` |
| 1428 | method | `sampleHolds` |
| 1433 | method | `samples` |
| 1434 | method | `ctrlEdges` |
| 1440 | method | `scrU` |
| 1441 | method | `scrGate` |
| 1442 | method | `scrEdges` |
| 1443 | method | `setFiring` |
| 1444 | method | `compV` |
| 1445 | method | `compI` |
| 1447 | method | `dbl` |
| 1448 | method | `sampleControllers` |
| 1482 | method | `evalBlocks` |
| 1586 | method | `blkCopy` |
| 1589 | method | `blkAnyDue` |
| 1592 | method | `blkDue` |
| 1594 | method | `zcFrac` |
| 1597 | method | `saveState` |
| 1599 | method | `restoreState` |
| 1608 | method | `snapshot` |
| 1610 | method | `restoreSnapshot` |
| 1612 | method | `gateSigPeek` |
| 1615 | method | `gateSig` |
| 1620 | method | `jumpScheds` |
| 1627 | method | `jumpAt` |
| 1628 | method | `values` |
| 1653 | method | `assemble` |
| 1670 | const fn | `g` |
| 1695 | method | `rhs` |
| 1697 | const fn | `J` |
| 1716 | method | `cplLinearize` |
| 1724 | method | `solverInfo` |
| 1739 | method | `factor` |
| 1752 | method | `spAssemble` |
| 1759 | method | `solveOnce` |
| 1770 | method | `solve` |
| 1788 | method | `nlLinearize` |
| 1791 | method | `check` |
| 1807 | method | `commit` |
| 1832 | method | `initialSolve` |
| 1844 | method | `tlSources` |
| 1848 | method | `tlRecord` |
| 1854 | method | `tlHist` |
| 1860 | method | `tlmG` |
| 1864 | method | `tlmSources` |
| 1878 | method | `tlmRecord` |
| 1893 | method | `tlwG` |
| 1899 | method | `tlwSources` |
| 1914 | method | `tlwRecord` |
| 1931 | method | `tlmHist` |
| 1938 | method | `step` |
| 1940 | const fn | `gs` |
| 1946 | method | `stepCore` |
| 2005 | method | `edgeSolve` |
| 2008 | method | `edgePoint` |
| 2009 | method | `mmcMoved` |
| 2012 | method | `arcGate` |
| 2020 | method | `trRestart` |
| 2024 | method | `nextEvent` |
| 2030 | const fn | `sch` |
| 2053 | method | `spwmCut` |
| 2056 | const fn | `sig` |
| 2061 | method | `run` |
| 2106 | function | `tuneInfo` |
| 2109 | function | `exportForBatch` |
| 2130 | const fn | `hist` |
| 2145 | const fn | `ci` |
| 2146 | const fn | `vd` |
| 2147 | const fn | `V` |
| 2150 | const fn | `linePort` |
| 2152 | const fn | `I` |
| 2153 | const fn | `portRec` |
| 2154 | const fn | `rec` |
| 2171 | const fn | `clkOf` |
| 2197 | function | `sweepPoint` |
| 2202 | function | `setPath` |
| 2208 | function | `eisPoint` |
| 2216 | function | `resume` |

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
| 236 | const fn | `out` |
| 247 | function | `evcDef` |
| 260 | const fn | `cl` |
| 264 | const fn | `io` |
| 265 | const fn | `E` |
| 319 | const fn | `out` |
| 328 | const fn | `fT` |
| 329 | function | `ctlKit` |
| 331 | const fn | `lag` |
| 333 | const fn | `leadlag` |
| 335 | const fn | `wash` |
| 337 | const fn | `nwLag` |
| 344 | const fn | `sched` |
| 346 | function | `avrDef` |
| 347 | const fn | `io` |
| 348 | const fn | `N` |
| 381 | function | `pssDef` |
| 390 | function | `govDef` |
| 430 | const fn | `out` |
| 437 | function | `footTable` |
| 441 | function | `towerDef` |
| 471 | function | `saiTable` |
| 472 | function | `saiParams` |
| 478 | function | `saiV10` |
| 479 | const fn | `W` |
| 484 | function | `saiFitL1` |
| 489 | function | `saiDef` |
| 496 | const fn | `par` |
| 506 | const fn | `nCells` |
| 507 | function | `chbDef` |
| 509 | const fn | `out` |
| 520 | const fn | `sw` |
| 521 | const fn | `gate` |
| 535 | function | `spllDef` |
| 540 | const fn | `E` |
| 546 | const fn | `w` |
| 558 | function | `ssscDef` |
| 559 | const fn | `io` |
| 560 | const fn | `E` |
| 575 | const fn | `sched` |
| 603 | function | `sssc3Def` |
| 605 | const fn | `sin` |
| 606 | const fn | `E` |
| 609 | const fn | `flt` |
| 624 | const fn | `sched` |
| 638 | const fn | `vf` |
| 667 | function | `mmcDef` |
| 672 | const fn | `sin` |
| 673 | const fn | `w` |
| 679 | const fn | `refs` |
| 681 | const fn | `toU` |
| 682 | const fn | `ccsc` |
| 700 | const fn | `energy` |
| 703 | const fn | `six` |
| 761 | const fn | `arm` |
| 763 | const fn | `sw` |
| 788 | function | `mmccDef` |
| 791 | const fn | `sin` |
| 792 | const fn | `w` |
| 793 | const fn | `pos` |
| 800 | const fn | `dq` |
| 815 | const fn | `integ` |
| 912 | function | `lcc6Def` |
| 913 | const fn | `sin` |
| 941 | function | `lccsDef` |
| 942 | const fn | `sin` |
| 948 | const fn | `xf` |
| 950 | const fn | `br` |
| 1008 | function | `lcccDef` |
| 1009 | const fn | `sin` |
| 1010 | const fn | `pos` |
| 1023 | const fn | `pi` |
| 1053 | function | `filtDef` |
| 1054 | const fn | `pos` |
| 1065 | function | `zserDef` |
| 1082 | function | `sigPorts` |
| 1083 | const fn | `sin` |
| 1085 | const fn | `out` |
| 1087 | const fn | `close` |
| 1091 | const fn | `busMap` |
| 1096 | function | `vsc2Def` |
| 1098 | const fn | `w` |
| 1132 | function | `gfmcDef` |
| 1136 | const fn | `w` |
| 1137 | const fn | `pos` |
| 1139 | const fn | `integ` |
| 1150 | const fn | `dq` |
| 1157 | const fn | `at0` |
| 1230 | function | `defOf` |
| 1236 | function | `forceImpl` |
| 1238 | const fn | `fix` |
| 1242 | const fn | `hasLib` |
| 1243 | function | `needs` |
| 1245 | function | `expand` |
| 1247 | const fn | `conv` |
| 1255 | function | `warnings` |
| 1261 | const fn | `cx` |
| 1263 | function | `csolve` |
| 1268 | function | `faultCurrents` |
| 1287 | function | `behindXF` |
| 1296 | function | `layoutDef` |
| 1299 | const fn | `isG` |
| 1300 | const fn | `isJ` |
| 1309 | const fn | `side` |
| 1313 | const fn | `bfs` |
| 1322 | const fn | `bary` |
| 1328 | const fn | `ctr` |
| 1329 | const fn | `target` |
| 1345 | function | `placedDef` |
| 1350 | function | `sidesOf` |

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
| 24 | function | `hvPath` |
| 31 | function | `symHV` |
| 39 | function | `phaseSplit` |
| 48 | const fn | `bl` |
| 69 | const fn | `CONN` |
| 70 | const fn | `isBus` |
| 72 | const fn | `nIO` |
| 73 | const fn | `ioY` |
| 76 | const fn | `codeIO` |
| 77 | const fn | `codeH` |
| 79 | const fn | `nCells` |
| 80 | const fn | `chbParams` |
| 83 | const fn | `nlcIns` |
| 84 | const fn | `nlcIO` |
| 85 | const fn | `chbxIO` |
| 86 | const fn | `pyIns` |
| 89 | const fn | `nnIns` |
| 90 | const fn | `codeDraw` |
| 96 | const fn | `IMPL` |
| 97 | const fn | `CLOCK` |
| 103 | function | `subLayout` |
| 105 | const fn | `len` |
| 111 | function | `subDraw` |
| 1122 | function | `noteBox` |
| 1125 | function | `defaults` |
| 1127 | function | `elPins` |
| 1128 | function | `sigPins` |
| 1129 | function | `pinsOf` |
| 1132 | function | `parseMat` |
| 1134 | function | `nPorts` |
| 1135 | function | `portY` |
| 1136 | function | `portPins` |
| 1137 | function | `portBox` |
| 1139 | function | `posDef` |
| 1141 | function | `symmetric` |
| 1142 | function | `matInv` |
| 1147 | function | `klMatrix` |
| 1158 | function | `kgMatrix` |
| 1166 | function | `srmGeo` |
| 1168 | function | `srmSpins` |
| 1170 | function | `srmPins` |
| 1172 | function | `satD` |
| 1173 | function | `satDinv` |
| 1175 | function | `genSpins` |
| 1186 | function | `genTsc` |
| 1191 | function | `genCirc2` |
| 1192 | const fn | `Fn` |
| 1200 | function | `genAxis` |
| 1208 | const fn | `classic` |
| 1214 | const fn | `plist` |
| 1218 | function | `genModel` |
| 1224 | const fn | `w` |
| 1233 | const fn | `grp` |
| 1250 | function | `genGamma` |
| 1258 | function | `genDQ` |
| 1262 | function | `genSteady` |
| 1264 | const fn | `rot` |
| 1271 | function | `srmAlignedPsi` |
| 1272 | function | `srmModelPsi` |
| 1273 | function | `srmTableText` |
| 1276 | function | `srmMag` |
| 1292 | function | `chkMag` |
| 1294 | function | `srmA` |
| 1297 | function | `seg` |
| 1298 | function | `srmPsi` |
| 1300 | function | `srmCur` |
| 1302 | function | `srmTorque` |
| 1305 | function | `srmCoenergy` |
| 1309 | function | `waveShape` |
| 1310 | function | `waveAt` |
| 1313 | function | `waveMeasure` |
| 1316 | const fn | `cross` |
| 1322 | function | `waveFit` |
| 1323 | const fn | `res` |
| 1334 | function | `directWave` |
| 1337 | function | `impulseWave` |
| 1348 | function | `bewley` |
| 1351 | const fn | `at` |
| 1357 | function | `movChar` |
| 1362 | const fn | `pick` |
| 1363 | const fn | `cur` |
| 1364 | const fn | `inv` |
| 1368 | function | `impulseDesign` |
| 1373 | function | `impulseRoots` |
| 1376 | function | `tlParams` |
| 1385 | function | `tlmData` |
| 1387 | function | `tlmM` |
| 1394 | function | `tlmPin` |
| 1395 | function | `tlmPins` |
| 1397 | function | `tlmKey` |
| 1408 | function | `tlmModel` |
| 1416 | function | `lightningWave` |
| 1423 | function | `pinKind` |
| 1434 | function | `structural` |
| 1441 | function | `pinWidth` |
| 1444 | function | `xf` |
| 1445 | function | `pinPos` |
| 1447 | function | `pinDir` |
| 1452 | function | `cpeParams` |
| 1453 | function | `cpeBank` |
| 1457 | function | `cpeZ` |
| 1458 | function | `cpeZbank` |
| 1459 | function | `boxOf` |
| 1460 | function | `bbox` |
| 1465 | function | `fmtNum` |
| 1469 | function | `eng` |
| 1473 | function | `parseEng` |
| 1476 | function | `parseSched` |
| 1484 | function | `machines` |

### `web/studio/plotcore.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 16 | const fn | `fmtNum` |
| 17 | function | `niceStep` |
| 19 | function | `nextStep` |
| 22 | function | `niceRange` |
| 26 | const fn | `decs` |
| 28 | function | `fmtTime` |
| 33 | function | `fmtEng` |
| 37 | function | `ticks` |
| 43 | class | `AutoRange` |
| 44 | method | `constructor` |
| 45 | method | `reset` |
| 48 | method | `update` |
| 50 | const fn | `fit` |
| 65 | function | `bandPath` |
| 69 | function | `meanPath` |
| 72 | const fn | `esc` |
| 73 | class | `Readout` |
| 74 | method | `constructor` |
| 77 | method | `set` |
| 81 | const fn | `put` |
| 88 | function | `fmtPlain` |
| 93 | function | `lineChart` |

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
| 10 | const fn | `api` |
| 12 | const fn | `esc` |
| 13 | const fn | `fmt` |
| 14 | const fn | `PC` |
| 16 | function | `list` |
| 24 | function | `open` |
| 25 | const fn | `close` |
| 36 | const fn | `drawCh` |
| 40 | const fn | `fit` |
| 42 | const fn | `X` |
| 43 | function | `paint` |
| 64 | function | `load` |
| 70 | function | `up` |
| 73 | const fn | `curRange` |

### `web/studio/scenario.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 20 | const fn | `tut` |
| 23 | function | `defaultKeys` |
| 28 | function | `measure` |
| 40 | function | `decimate` |
| 45 | function | `run` |
| 53 | const fn | `push` |
| 81 | function | `open` |
| 88 | const fn | `index` |
| 95 | function | `session` |
| 96 | function | `setLive` |
| 104 | function | `advance` |
| 116 | function | `closeSession` |
| 119 | function | `tutorial` |
| 121 | function | `tutorials` |
| 123 | function | `handle` |
| 142 | function | `bifPoint` |
| 143 | function | `bifSpec` |
| 147 | function | `bifurcation` |
| 151 | const fn | `json` |

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
| 25 | const fn | `isLogic` |
| 28 | const fn | `eng` |
| 35 | class | `Scope` |
| 36 | method | `constructor` |
| 44 | const fn | `cy` |
| 64 | method | `heights` |
| 67 | method | `gapAt` |
| 69 | method | `maxAt` |
| 70 | method | `resizePane` |
| 72 | method | `autoHeights` |
| 74 | method | `toggleMax` |
| 77 | method | `attach` |
| 80 | method | `requestDraw` |
| 82 | method | `colors` |
| 84 | method | `setRefs` |
| 85 | method | `refRange` |
| 89 | method | `histPush` |
| 91 | method | `back` |
| 94 | method | `paneAt` |
| 95 | method | `zoomY` |
| 98 | method | `boxZoom` |
| 103 | method | `nav` |
| 105 | const fn | `clamp` |
| 117 | method | `resize` |
| 124 | method | `unitOf` |
| 128 | method | `resolve` |
| 129 | method | `channels` |
| 130 | method | `addChannel` |
| 133 | method | `removeChannel` |
| 134 | method | `moveChannel` |
| 136 | method | `windowSec` |
| 137 | method | `viewRange` |
| 139 | method | `ringIndex` |
| 140 | method | `ringStart` |
| 142 | method | `eachRaw` |
| 145 | method | `rawCount` |
| 146 | method | `eachPeriod` |
| 147 | method | `valueAt` |
| 150 | method | `stats` |
| 161 | method | `usePeriods` |
| 163 | method | `panTo` |
| 164 | method | `zoomAt` |
| 166 | method | `cursorAt` |
| 168 | method | `plotW` |
| 169 | method | `drawSamples` |
| 176 | method | `envReset` |
| 178 | method | `ingest` |
| 187 | method | `colsOf` |
| 188 | const fn | `put` |
| 197 | method | `archiveFor` |
| 206 | method | `yAuto` |
| 211 | method | `draw` |
| 254 | const fn | `Y` |
| 282 | const fn | `flush` |

### `web/studio/sim_worker.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | function | `python` |

### `web/studio/sparse.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 20 | class | `SparseError` |
| 23 | function | `pattern` |
| 34 | function | `order` |
| 41 | const fn | `move` |
| 56 | function | `grow` |
| 60 | function | `dfs` |
| 72 | function | `lu` |
| 116 | function | `refactor` |
| 136 | function | `diffCols` |
| 144 | function | `affected` |
| 150 | function | `clone` |
| 153 | function | `solve` |

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
| 263 | function | `makeUnique` |
| 269 | function | `closure` |
| 275 | function | `externalRefs` |
| 276 | const fn | `head` |
| 282 | function | `refToPort` |
| 288 | const fn | `setIn` |

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
| 23 | const fn | `num` |
| 51 | function | `match` |
| 53 | const fn | `put` |
| 54 | const fn | `go` |
| 63 | function | `recognise` |
| 69 | function | `solveR` |
| 74 | function | `solveJ` |
| 77 | const fn | `mix` |
| 79 | function | `model` |
| 80 | const fn | `op` |
| 83 | function | `output` |
| 85 | const fn | `dot` |
| 87 | function | `loopAt` |
| 97 | function | `margins` |
| 110 | function | `prep` |
| 127 | const fn | `yOf` |
| 136 | const fn | `Gat` |
| 145 | function | `design` |
| 151 | const fn | `gains` |
| 152 | const fn | `evalK` |
| 181 | function | `convStep` |
| 186 | function | `convAuto` |
| 188 | function | `convStart` |
| 190 | function | `charpoly` |
| 193 | function | `tfOf` |
| 197 | function | `roots` |
| 200 | const fn | `ev` |
| 206 | function | `closedLoop` |
| 207 | const fn | `f` |
| 221 | function | `analyze` |

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
| 937 | const fn | `IN` |
| 976 | const fn | `fix` |
| 1007 | method | `build` |
| 1012 | method | `build` |
| 1021 | method | `build` |
| 1031 | const fn | `y` |
| 1054 | method | `build` |
| 1055 | const fn | `ws` |
| 1094 | method | `build` |
| 1112 | method | `build` |
| 1120 | function | `fbmPoint` |
| 1127 | method | `build` |
| 1146 | function | `smibPoint` |
| 1147 | function | `genCtl` |
| 1149 | const fn | `L` |
| 1177 | method | `build` |
| 1187 | function | `ieee9Build` |
| 1189 | const fn | `GD` |
| 1190 | const fn | `L` |
| 1192 | const fn | `G` |
| 1193 | const fn | `Ld` |
| 1218 | method | `build` |
| 1235 | method | `build` |
| 1251 | const fn | `LM` |
| 1254 | function | `tlmPart` |
| 1268 | method | `build` |
| 1287 | method | `build` |
| 1307 | function | `tlmGW` |
| 1311 | const fn | `note` |
| 1323 | method | `build` |
| 1341 | const fn | `tl` |
| 1369 | const fn | `PANE` |
| 1380 | method | `build` |
| 1382 | const fn | `rig` |
| 1401 | method | `build` |
| 1403 | const fn | `rig` |
| 1423 | function | `xbRig` |
| 1425 | const fn | `bond` |
| 1452 | method | `build` |
| 1487 | function | `ssscChannels` |
| 1496 | method | `build` |
| 1516 | method | `build` |
| 1518 | const fn | `ln` |
| 1552 | method | `build` |
| 1554 | const fn | `sw` |
| 1581 | method | `build` |
| 1585 | const fn | `station` |
| 1621 | method | `build` |
| 1625 | const fn | `station` |
| 1672 | method | `build` |
| 1709 | const fn | `gfmWire` |
| 1713 | const fn | `busMeter` |
| 1726 | method | `build` |
| 1728 | const fn | `unit` |
| 1751 | method | `build` |
| 1782 | method | `build` |
| 1815 | method | `build` |
| 1842 | method | `build` |
| 1847 | function | `dcdcInputs` |

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

### `web/studio/winframe.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 9 | const fn | `load` |
| 10 | const fn | `save` |
| 12 | function | `bounds` |
| 14 | function | `rectOf` |
| 15 | function | `apply` |
| 18 | function | `handles` |
| 20 | function | `start` |
| 30 | function | `remember` |
| 32 | function | `toggleMax` |
| 35 | function | `mover` |
| 42 | function | `frame` |
| 54 | const fn | `size` |
| 57 | function | `watchModals` |

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
| 195 | function | `conv_step` |
| 213 | function | `conv_start` |
| 223 | class | `Ctrl` |
| 227 | method | `Ctrl.__init__` |
| 256 | method | `Ctrl.dbl` |
| 259 | method | `Ctrl.raw` |
| 279 | method | `Ctrl.gate` |
| 291 | method | `Ctrl.carrier_at` |
| 302 | method | `Ctrl.edges` |
| 322 | function | `_lut` |
| 333 | function | `eval_ast` |
| 362 | function | `_nn_fwd` |
| 378 | function | `_nn_learn` |
| 421 | function | `_nn_jac` |
| 440 | function | `_nn_step` |
| 468 | function | `lcc_com` |
| 476 | function | `lcc_measure` |
| 532 | function | `nlc_step` |
| 583 | function | `make_python_block` |
| 614 | class | `Circuit` |
| 615 | method | `Circuit.__init__` |
| 850 | method | `Circuit.R` |
| 853 | method | `Circuit.im_e` |
| 862 | method | `Circuit.im_deriv` |
| 875 | method | `Circuit.sm_cur` |
| 887 | method | `Circuit.sm_ports` |
| 892 | method | `Circuit.sm_deriv` |
| 907 | method | `Circuit.srm_A` |
| 912 | method | `Circuit._seg` |
| 916 | method | `Circuit.srm_cur` |
| 923 | method | `Circuit.srm_torque` |
| 932 | method | `Circuit.srm_currents` |
| 937 | method | `Circuit.srm_deriv` |
| 950 | method | `Circuit.gen_cur` |
| 967 | method | `Circuit.gen_efd` |
| 974 | method | `Circuit.gen_tm` |
| 981 | method | `Circuit.gen_deriv` |
| 999 | method | `Circuit.jac_gen` |
| 1051 | method | `Circuit.gen_out` |
| 1071 | method | `Circuit.Vsrc` |
| 1087 | method | `Circuit.topo` |
| 1097 | method | `Circuit.build` |
| 1204 | method | `Circuit.bsrc` |
| 1254 | method | `Circuit.solve_z` |
| 1298 | method | `Circuit.arc_g` |
| 1303 | method | `Circuit.solve_nl` |
| 1345 | method | `Circuit.tl_hist` |
| 1362 | method | `Circuit.tl_sec` |
| 1369 | method | `Circuit.tl_ih` |
| 1373 | method | `Circuit.tl_record` |
| 1394 | method | `Circuit.tlm_setup` |
| 1489 | method | `Circuit.tlw_setup` |
| 1567 | method | `Circuit.tlw_ix` |
| 1581 | method | `Circuit.tlw_end` |
| 1591 | method | `Circuit.tlm_hist` |
| 1616 | method | `Circuit.tlm_ih` |
| 1629 | method | `Circuit.tlm_force` |
| 1655 | method | `Circuit.tlm_modal` |
| 1674 | method | `Circuit.tlm_record` |
| 1703 | method | `Circuit.scr_u` |
| 1707 | method | `Circuit.scr_gate` |
| 1711 | method | `Circuit.scr_edges` |
| 1718 | method | `Circuit.gate_state` |
| 1731 | method | `Circuit.set_gates` |
| 1739 | method | `Circuit.arc_gates` |
| 1759 | method | `Circuit.may_turn_on` |
| 1763 | method | `Circuit.tolerances` |
| 1769 | method | `Circuit.consistent` |
| 1811 | method | `Circuit.value` |
| 1849 | method | `Circuit.current` |
| 1903 | method | `Circuit.prime` |
| 1913 | method | `Circuit.sig_in` |
| 1917 | method | `Circuit.sh_grid` |
| 1929 | method | `Circuit.sh_next` |
| 1936 | method | `Circuit.log_ev` |
| 1942 | method | `Circuit.ev_switches` |
| 1951 | method | `Circuit.sh_sample` |
| 1971 | method | `Circuit.sample` |
| 2046 | method | `Circuit.cmp_f` |
| 2052 | method | `Circuit.blk_due` |
| 2063 | method | `Circuit.eval_blocks` |
| 2383 | method | `Circuit.block_events` |
| 2412 | method | `Circuit.next_event` |
| 2479 | function | `_decimate` |
| 2496 | function | `_diagnose` |
| 2547 | function | `simulate` |
| 2839 | function | `batch_sim` |

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
| 338 | function | `compress` |
| 361 | function | `listing` |
| 367 | function | `handle` |

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
| 487 | method | `Project.tune` |
| 499 | method | `Project.inputs` |
| 517 | method | `Project.copy` |
| 522 | method | `Project.save` |
| 525 | method | `Project.hash` |
| 529 | method | `Project.params` |
| 533 | method | `Project.channels` |
| 538 | method | `Project._settings` |
| 549 | method | `Project.run` |
| 582 | method | `Project.stream` |
| 663 | method | `Project._result` |
| 670 | method | `Project._query` |
| 682 | method | `Project._run_scipy` |
| 719 | method | `Project.sweep` |
| 793 | method | `Project._sweep_meta` |
| 798 | method | `Project.bifurcation` |
| 855 | class | `_SweepFile` |
| 860 | method | `_SweepFile.__init__` |
| 874 | method | `_SweepFile._val` |
| 882 | method | `_SweepFile._read` |
| 901 | method | `_SweepFile._line` |
| 905 | method | `_SweepFile.add` |
| 909 | method | `_SweepFile.close` |
| 915 | function | `_sweep_point` |
| 923 | function | `_as_list` |
| 933 | function | `_spec` |
| 949 | function | `_measures` |
| 972 | function | `_base_T` |
| 979 | function | `_unit` |
| 983 | function | `_matname` |
| 988 | class | `Result` |
| 991 | method | `Result.__init__` |
| 1001 | method | `Result.__getitem__` |
| 1004 | method | `Result.__repr__` |
| 1007 | method | `Result.events_csv` |
| 1018 | method | `Result.measure` |
| 1078 | method | `Result.frame` |
| 1087 | method | `Result._meta_lines` |
| 1091 | method | `Result.to_csv` |
| 1104 | method | `Result._vars` |
| 1114 | method | `Result.as_dict` |
| 1118 | method | `Result.to_json` |
| 1122 | method | `Result.to_mat` |
| 1133 | method | `Result.to_parquet` |
| 1141 | method | `Result.to_hdf5` |
| 1147 | method | `Result.save` |
| 1151 | function | `_save` |
| 1158 | class | `SweepResult` |
| 1161 | method | `SweepResult.__init__` |
| 1167 | method | `SweepResult.__repr__` |
| 1170 | method | `SweepResult.column` |
| 1173 | method | `SweepResult.frame` |
| 1180 | method | `SweepResult.to_csv` |
| 1192 | method | `SweepResult.to_json` |
| 1196 | method | `SweepResult.to_mat` |
| 1203 | method | `SweepResult._columns` |
| 1207 | method | `SweepResult.to_parquet` |
| 1213 | method | `SweepResult.to_hdf5` |
| 1218 | method | `SweepResult.save` |
| 1222 | class | `BifurcationResult` |
| 1226 | method | `BifurcationResult.__init__` |
| 1233 | method | `BifurcationResult.__repr__` |
| 1236 | method | `BifurcationResult.changes` |
| 1245 | method | `BifurcationResult.rows` |
| 1249 | method | `BifurcationResult._columns` |
| 1253 | method | `BifurcationResult.frame` |
| 1260 | method | `BifurcationResult.plot` |
| 1263 | method | `BifurcationResult.to_csv` |
| 1274 | method | `BifurcationResult.to_json` |
| 1278 | method | `BifurcationResult.to_mat` |
| 1284 | method | `BifurcationResult.to_parquet` |
| 1289 | method | `BifurcationResult.to_hdf5` |
| 1294 | method | `BifurcationResult.save` |
| 1305 | function | `_el` |
| 1310 | function | `_matrix` |
| 1315 | function | `_ascii` |
| 1322 | function | `_mat_char` |
| 1327 | function | `_mat_value` |
| 1340 | function | `_savemat` |

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
