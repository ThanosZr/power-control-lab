# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 116 |
| `web/studio/app.js` | 3115 |
| `web/studio/bus.js` | 197 |
| `web/studio/ctlwin.js` | 78 |
| `web/studio/editor.js` | 692 |
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
| `web/studio/mna.js` | 2282 |
| `web/studio/netlib.js` | 1355 |
| `web/studio/netview.js` | 138 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 1492 |
| `web/studio/plotcore.js` | 133 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 87 |
| `web/studio/recview.js` | 84 |
| `web/studio/scenario.js` | 156 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 331 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 165 |
| `web/studio/stepcheck.js` | 315 |
| `web/studio/subcircuit.js` | 293 |
| `web/studio/templates.js` | 32 |
| `web/studio/trv.js` | 56 |
| `web/studio/tune.js` | 237 |
| `web/studio/tutorials.js` | 2034 |
| `web/studio/units.js` | 156 |
| `web/studio/watch.js` | 339 |
| `web/studio/winframe.js` | 63 |
| `pcl/runner.js` | 27 |
| `run.py` | 324 |
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
| `pcl/__main__.py` | 413 |
| `pcl/accel.py` | 202 |
| `pcl/backend.py` | 270 |
| `pcl/control.py` | 953 |
| `pcl/core.py` | 1353 |
| `pcl/cpf.py` | 561 |
| `pcl/designer.py` | 791 |
| `pcl/formats.py` | 222 |
| `pcl/gui.py` | 409 |
| `pcl/harmonic.py` | 322 |
| `pcl/impulse.py` | 858 |
| `pcl/ipm.py` | 220 |
| `pcl/lineconst.py` | 2400 |
| `pcl/linereport.py` | 836 |
| `pcl/link.py` | 150 |
| `pcl/netfile.py` | 490 |
| `pcl/netview.py` | 786 |
| `pcl/network.py` | 1524 |
| `pcl/nnstart.py` | 388 |
| `pcl/onnxio.py` | 355 |
| `pcl/opf.py` | 417 |
| `pcl/plotting.py` | 340 |
| `pcl/powerflow.py` | 1169 |
| `pcl/psse.py` | 433 |
| `pcl/report.py` | 840 |
| `pcl/scopf.py` | 213 |
| `pcl/se.py` | 563 |
| `pcl/study.py` | 303 |
| `pcl/trv.py` | 433 |
| `pcl/wideband.py` | 1279 |
| `pcl/workbench.py` | 485 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 205 |
| `tests/test_arc.py` | 189 |
| `tests/test_backend.py` | 238 |
| `tests/test_batch.py` | 255 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_big.py` | 66 |
| `tests/test_boundary.py` | 50 |
| `tests/test_bus.py` | 145 |
| `tests/test_control.py` | 213 |
| `tests/test_cpf.py` | 401 |
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
| `tests/test_guide.py` | 110 |
| `tests/test_harmonic.py` | 312 |
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
| `tests/test_netfile.py` | 236 |
| `tests/test_netlib.py` | 209 |
| `tests/test_netview.py` | 263 |
| `tests/test_network.py` | 272 |
| `tests/test_nn.py` | 130 |
| `tests/test_nnstart.py` | 315 |
| `tests/test_opf.py` | 262 |
| `tests/test_pcl.py` | 312 |
| `tests/test_pieces.py` | 58 |
| `tests/test_plotcore.py` | 74 |
| `tests/test_plotting.py` | 113 |
| `tests/test_powerflow.py` | 334 |
| `tests/test_psse.py` | 305 |
| `tests/test_recording.py` | 211 |
| `tests/test_refac.py` | 78 |
| `tests/test_report.py` | 844 |
| `tests/test_scopf.py` | 263 |
| `tests/test_se.py` | 366 |
| `tests/test_sparse.py` | 53 |
| `tests/test_sssc.py` | 444 |
| `tests/test_step.py` | 167 |
| `tests/test_stream.py` | 136 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 609 |
| `tests/test_subcircuit.py` | 149 |
| `tests/test_sweepc.py` | 181 |
| `tests/test_templates.py` | 237 |
| `tests/test_trstart.py` | 26 |
| `tests/test_trv.py` | 248 |
| `tests/test_tune.py` | 277 |
| `tests/test_tutorials.py` | 751 |
| `tests/test_units.py` | 78 |
| `tests/test_watch.py` | 87 |
| `tests/test_wb.py` | 489 |
| `tests/test_workbench.py` | 215 |
| `tests/js/arc_cases.js` | 43 |
| `tests/js/batch_requests.js` | 116 |
| `tests/js/big_cases.js` | 53 |
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
| `tests/js/netview_cases.js` | 77 |
| `tests/js/nn_cases.js` | 48 |
| `tests/js/pieces_cases.js` | 45 |
| `tests/js/plotcore_cases.js` | 25 |
| `tests/js/refac_cases.js` | 68 |
| `tests/js/sim_cases.js` | 356 |
| `tests/js/snapshot_cases.js` | 22 |
| `tests/js/sparse_cases.js` | 57 |
| `tests/js/sssc_cases.js` | 85 |
| `tests/js/step_cases.js` | 120 |
| `tests/js/study_cases.js` | 33 |
| `tests/js/subcircuit_cases.js` | 87 |
| `tests/js/tlm_ss_cases.js` | 18 |
| `tests/js/trstart_cases.js` | 11 |
| `tests/js/trv_cases.js` | 8 |
| `tests/js/trv_tutorial_cases.js` | 30 |
| `tests/js/tune_cases.js` | 39 |
| `tests/js/tutorial_cases.js` | 145 |
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
| `tests/ui/features_flow.js` | 325 |
| `tests/ui/line_flow.js` | 166 |
| `tests/ui/live_flow.js` | 41 |
| `tests/ui/perf_flow.js` | 68 |
| `tests/ui/scenario_flow.js` | 70 |
| `tests/ui/scope_flow.js` | 169 |
| `tests/ui/speed_flow.js` | 104 |
| `tests/ui/step_flow.js` | 69 |
| `tests/ui/studio_flow.js` | 45 |
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
| 302 | `current_ctl` | Αμφίδρομος · μπαταρία (PE2) | Άσκηση 3 · Έλεγχος ρεύματος από μπλοκ |
| 353 | `blocks_loop` | Μπλοκ σημάτων (3.0) | Βρόχος ρεύματος από μπλοκ |
| 381 | `code_loop` | Μπλοκ κώδικα (3.3) | PI σε Python και πρόσθια τροφοδότηση με έκφραση |
| 406 | `cell_eis` | Μπαταρίες και EIS (3.3.1) | Δοκιμή κυψέλης: EIS με μετατροπέα |
| 449 | `im_vf` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: V/f και διαμόρφωση SPWM, SVPWM, τετραγωνική |
| 462 | `im_foc` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: διανυσματικός έλεγχος, εξασθένιση πεδίου, R̂_R |
| 517 | `synrm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μαγνητικής αντίστασης (SynRM): ευθυγράμμιση, έλεγχος dq, MTPA |
| 543 | `pmsm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μόνιμων μαγνητών (PMSM / IPMSM): i_d = 0 και MTPA |
| 559 | `srm` | Ηλεκτρική κίνηση (3.6) | Μηχανή μεταβλητής μαγνητικής αντίστασης (SRM 8/6): γωνίες, υστέρηση, βρόχος ψ–i |
| 590 | `lightning` | Κεραυνικά (3.5) | Κεραυνικό ρεύμα Heidler: 10/350, 1/200, 0,25/100 μs |
| 602 | `twave` | Υψηλές τάσεις (3.8) | Οδεύοντα κύματα: ανάκλαση σε ανοιχτό, βραχυκυκλωμένο ή ωμικό άκρο, διάγραμμα Bewley |
| 625 | `arrester` | Υψηλές τάσεις (3.9) | Αλεξικέραυνο: παραμένουσα τάση και απόσταση προστασίας |
| 641 | `marx` | Υψηλές τάσεις (3.10) | Γεννήτρια Marx: πολυβάθμια κρουστική γεννήτρια με σπινθηριστές |
| 671 | `chop` | Υψηλές τάσεις (3.10) | Αποκομμένη κρουστική τάση: σπινθηριστής αποκοπής |
| 705 | `hv153` | Υψηλές τάσεις (3.11) | Ασκήσεις 15.3: γεννήτριες κρουστικών τάσεων (βιβλίο, ακριβής λύση, προσομοίωση) |
| 726 | `lossline` | Υψηλές τάσεις (3.11) | Γραμμή με απώλειες: απόσβεση και παραμόρφωση οδεύοντος κύματος |
| 743 | `voltime` | Υψηλές τάσεις (3.11) | Καμπύλη τάσης–χρόνου διακένου (κριτήριο ενέργειας διάσπασης) |
| 759 | `hvdiv` | Υψηλές τάσεις (3.12) | Μέτρηση εναλλασσόμενης υψηλής τάσης: καταμεριστές (ασκήσεις 15.1.3, 15.1.5) |
| 776 | `schering` | Υψηλές τάσεις (3.12) | Γέφυρα Schering: χωρητικότητα και συντελεστής απωλειών (άσκηση 15.5.12) |
| 791 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 813 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 827 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 937 | `nn_compare` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Έλεγχος με νευρωνικό δίκτυο: σύγκριση |
| 943 | `nn_online` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Νευρωνικό που μαθαίνει αμέσως |
| 968 | `ai_block` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Ελεγκτής AI με πρόσοψη |
| 1056 | `ev_drive` | Ηλεκτρικό όχημα (4.8) | Ηλεκτρικό όχημα: πολυκριτηριακός έλεγχος |
| 1063 | `nn_gui` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Σύνθεση ελέγχου από Python: κάθε μηχανή, στόχοι με βάρη |
| 1070 | `sub_legs` | Υποκυκλώματα (3.17) | Πολυφασικός buck από ένα υποκύκλωμα σκέλους |
| 1103 | `bus_dq` | Δίαυλοι (3.18) | Βρόχος ρεύματος dq με διαύλους: τριφασικός μετατροπέας προς δίκτυο |
| 1142 | `net_fault` | Δίκτυο (4.1) | Βραχυκύκλωμα σε δίκτυο: IEC 60909 και συμμετρικές συνιστώσες |
| 1162 | `gen_sc` | Συστήματα ισχύος (4.3) | Τριφασικό βραχυκύκλωμα στα άκρα σύγχρονης γεννήτριας |
| 1178 | `fbm` | Συστήματα ισχύος (4.3) | IEEE First Benchmark Model: υποσύγχρονος συντονισμός (SSR) |
| 1226 | `gen_ctl` | Συστήματα ισχύος (4.8.1) | Γεννήτρια με AVR, PSS και ρυθμιστή στροφών |
| 1276 | `ieee9_emt` | Συστήματα ισχύος (4.3) | IEEE 9 ζυγών σε EMT, από τη ροή φορτίου |
| 1307 | `big_grid` | Μεγάλα δίκτυα (4.19.3) | Πλέγμα k × k ζυγών σε EMT: ο γραμμικός λύτης σε μεγάλο δίκτυο |
| 1322 | `pf_study` | Ροή φορτίου και OPF (4.19.1) | Ροή φορτίου και N−1 σε δίκτυα IEEE |
| 1334 | `opf_study` | Ροή φορτίου και OPF (4.19.1) | Βέλτιστη ροή φορτίου (OPF) σε δίκτυα IEEE |
| 1348 | `cpf_study` | Ροή φορτίου και OPF (4.19.1) | Ευστάθεια τάσης: καμπύλη P–V και περιθώριο φόρτισης (συνεχιζόμενη ροή φορτίου) |
| 1364 | `se_study` | Ροή φορτίου και OPF (4.19.1) | Εκτίμηση κατάστασης: μετρήσεις με σφάλματα και εντοπισμός των λανθασμένων |
| 1383 | `harm_study` | Ροή φορτίου και OPF (4.19.1) | Αρμονικές: παραμόρφωση τάσης και συντονισμοί (αρμονική ροή φορτίου) |
| 1411 | `ieee9_sssc` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | IEEE 9 ζυγών σε EMT με τριφασικό m-SSSC (κεντρικός έλεγχος) |
| 1441 | `trv_terminal` | Διακόπτες ισχύος (4.9) | TRV σε σφάλμα ακροδεκτών: IEC 62271-100 |
| 1462 | `trv_slf` | Διακόπτες ισχύος (4.9) | Σφάλμα κοντινής γραμμής και τόξο του διακόπτη |
| 1493 | `lightning_gis` | Κεραυνοί και συντονισμός μόνωσης (4.9) | Κεραυνός σε γραμμή 400 kV δίπλα σε υποσταθμό GIS: συντονισμός μόνωσης |
| 1556 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1577 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1626 | `cable_xb` | Καλώδια: wideband και cross-bonding (4.13) | Υπόγειο καλώδιο 150 kV με cross-bonding: αναλυτικό και ομογενές μοντέλο |
| 1669 | `sssc_1ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε γραμμή (μονοφασικό) |
| 1689 | `sssc_3ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε δίκτυο 150 kV (τριφασικό, 4 ζυγοί) |
| 1727 | `ccsc_1ph` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | CCSC: πυκνωτής σειράς ελεγχόμενος από μετατροπέα (μονοφασικό) |
| 1755 | `hvdc_mmc` | HVDC: MMC (4.14) | Σύνδεση HVDC με MMC σημείο προς σημείο (±320 kV, 1000 MW) |
| 1798 | `hvdc_gfm` | Grid-forming (4.18.1) | Σταθμός MMC ως grid-forming: νησίδα, ασθενές δίκτυο, παράλληλα με άλλη μονάδα |
| 1846 | `hvdc_lcc` | HVDC: LCC (4.16) | Το πρώτο benchmark HVDC της CIGRE (LCC 12 παλμών, 500 kV, 1000 MW) |
| 1900 | `gfm_island` | Grid-forming (4.18) | Νησίδα με δύο μετατροπείς grid-forming: μοιρασιά του φορτίου με τη στατικότητα |
| 1927 | `gfm_sync` | Grid-forming (4.18) | Synchronverter: αντιστροφέας που μιμείται σύγχρονη γεννήτρια (Zhong & Weiss 2011) |
| 1955 | `gfm_weak` | Grid-forming (4.18) | Συγχρονισμός μέσω ισχύος (PSC) σε ασθενές δίκτυο, απέναντι στον έλεγχο ρεύματος με PLL |
| 1992 | `ieee9_gfm` | Grid-forming (4.18.1) | IEEE 9 με μετατροπέα στη θέση της G3: grid-forming ή grid-following (nadir, RoCoF) |
| 2022 | `empty` | Νέο | Κενό κύκλωμα |

## API του server (`run.py`, `/api/<action>`)

`analyze`, `batch_sim`, `bidir`, `boundary`, `capacitance`, `curves`, `derivation`, `design`, `envelope`, `inverse`, `line_export`, `line_load`, `line_model`, `line_scan`, `line_sens`, `linearize`, `model_proof`, `network_open`, `network_report`, `network_save`, `network_study`, `network_view`, `problem`, `scenario_run`, `scenario_sweep`, `solve`, `studio_math`, `sweep`, `switching`, `template_solve`, `validate_circuit`

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
| 965 | const fn | `chk` |
| 976 | function | `bindProps` |
| 1012 | function | `diagItems` |
| 1021 | function | `renderDiag` |
| 1032 | function | `openDiag` |
| 1033 | function | `flashComp` |
| 1041 | function | `stepAdvice` |
| 1053 | function | `stepAdviceShow` |
| 1054 | function | `scheduleStepCheck` |
| 1055 | function | `runStepCheck` |
| 1056 | const fn | `inPage` |
| 1063 | function | `syncStepMode` |
| 1125 | function | `scenSetCode` |
| 1126 | function | `scenState` |
| 1127 | function | `scenTab` |
| 1128 | function | `scenOut` |
| 1129 | function | `scenWorker` |
| 1131 | function | `scenRun` |
| 1139 | function | `scenStop` |
| 1140 | function | `scenDone` |
| 1142 | function | `scenMsg` |
| 1157 | function | `scenBatch` |
| 1162 | function | `scenEval` |
| 1165 | function | `addonDock` |
| 1168 | function | `renderAddons` |
| 1169 | const fn | `vsel` |
| 1183 | function | `knockToast` |
| 1186 | function | `initAddons` |
| 1193 | function | `scenBatchWrite` |
| 1196 | function | `renderScenFiles` |
| 1199 | const fn | `scenNum` |
| 1200 | function | `scenTable` |
| 1201 | function | `scenShow` |
| 1214 | function | `scenTicks` |
| 1215 | function | `scenPlot` |
| 1219 | const fn | `thin` |
| 1226 | const fn | `dig` |
| 1237 | function | `initScenarios` |
| 1244 | function | `liveApply` |
| 1247 | function | `closeMenu` |
| 1248 | function | `openMenu` |
| 1269 | function | `updateHover` |
| 1287 | const fn | `atTop` |
| 1288 | function | `topDoc` |
| 1289 | function | `defsOf` |
| 1290 | const fn | `pid` |
| 1291 | function | `fullDoc` |
| 1293 | function | `commitView` |
| 1295 | function | `viewDiag` |
| 1296 | const fn | `rel` |
| 1299 | function | `compAt` |
| 1304 | function | `allComps` |
| 1305 | const fn | `walk` |
| 1311 | function | `partDef` |
| 1313 | function | `pdefaults` |
| 1314 | function | `subParams` |
| 1316 | function | `placeOk` |
| 1318 | function | `renameChannels` |
| 1320 | function | `levelDoc` |
| 1321 | function | `applyLevel` |
| 1322 | function | `groupSel` |
| 1327 | function | `expandSub` |
| 1331 | function | `libToSub` |
| 1333 | function | `uniqueSub` |
| 1334 | function | `subMenu` |
| 1338 | function | `enterSub` |
| 1344 | function | `leaveSub` |
| 1350 | function | `renderCrumbs` |
| 1358 | function | `curDef` |
| 1359 | function | `publicOf` |
| 1360 | function | `togglePublic` |
| 1368 | function | `propsSub` |
| 1376 | function | `bindSub` |
| 1384 | function | `propsDef` |
| 1399 | function | `bindDef` |
| 1415 | function | `exportDef` |
| 1417 | function | `importDefs` |
| 1428 | function | `palLoad` |
| 1429 | function | `palSave` |
| 1430 | function | `palRecent` |
| 1431 | function | `palItem` |
| 1435 | function | `renderPalette` |
| 1443 | const fn | `isOpen` |
| 1457 | function | `tutorial` |
| 1460 | function | `circuitSig` |
| 1470 | function | `tutorialRef` |
| 1471 | function | `theoryValidity` |
| 1477 | function | `staleBanner` |
| 1480 | function | `bindRestore` |
| 1481 | function | `loadTutorial` |
| 1486 | function | `migrateFile` |
| 1489 | function | `applyProject` |
| 1500 | function | `renderTutorial` |
| 1510 | function | `gallery` |
| 1516 | function | `api` |
| 1517 | function | `paramsOf` |
| 1520 | function | `avgOver` |
| 1523 | function | `simValue` |
| 1529 | function | `lastPP` |
| 1531 | function | `runTheory` |
| 1544 | function | `cmpRows` |
| 1545 | function | `stepsHTML` |
| 1546 | function | `renderTheory` |
| 1578 | function | `rippleDev` |
| 1580 | function | `periodAvgAt` |
| 1582 | function | `samplingTheory` |
| 1591 | const fn | `lastAt` |
| 1613 | function | `polyTheory` |
| 1620 | const fn | `frac` |
| 1649 | function | `lastPeriods` |
| 1650 | function | `evalOrderHTML` |
| 1659 | function | `genScTheory` |
| 1661 | const fn | `Iac` |
| 1669 | function | `shaftModes` |
| 1676 | function | `fbmTheory` |
| 1684 | function | `ieee9Theory` |
| 1692 | function | `schedNow` |
| 1694 | function | `fundOf` |
| 1700 | function | `ssscNet3` |
| 1701 | const fn | `c` |
| 1704 | const fn | `ser` |
| 1705 | const fn | `ln` |
| 1713 | function | `ssscTheory` |
| 1748 | function | `ccscTheory` |
| 1753 | const fn | `cm` |
| 1755 | const fn | `dev` |
| 1758 | const fn | `lineI` |
| 1779 | function | `ieee9ssscTheory` |
| 1794 | function | `hvdcTheory` |
| 1814 | function | `gfmTheory` |
| 1855 | function | `ieee9GfmTheory` |
| 1873 | function | `hvdcGfmTheory` |
| 1886 | function | `lccTheory` |
| 1887 | const fn | `st` |
| 1893 | const fn | `g` |
| 1905 | function | `wbModelHTML` |
| 1913 | function | `cableXbTheory` |
| 1914 | const fn | `rms` |
| 1915 | const fn | `pk` |
| 1927 | const fn | `v` |
| 1932 | function | `lineFdTheory` |
| 1933 | const fn | `lab` |
| 1941 | const fn | `pk` |
| 1948 | function | `trvAfterZero` |
| 1954 | function | `trvSvg` |
| 1956 | const fn | `path` |
| 1963 | function | `trvTerminalTheory` |
| 1976 | function | `trvSlfTheory` |
| 1996 | function | `lightningTheory` |
| 1998 | const fn | `pk` |
| 2016 | function | `netFaultTheory` |
| 2029 | function | `busDqTheory` |
| 2037 | function | `subLegsTheory` |
| 2049 | function | `currentCtlTheory` |
| 2056 | const fn | `R` |
| 2059 | const fn | `over` |
| 2069 | const fn | `row` |
| 2075 | function | `blocksTheory` |
| 2090 | function | `pcmTheory` |
| 2116 | function | `codeTheory` |
| 2126 | function | `eisTheory` |
| 2128 | const fn | `ser` |
| 2141 | function | `imSteady` |
| 2144 | function | `imPar` |
| 2145 | function | `phaseRms` |
| 2146 | function | `vfTheory` |
| 2159 | function | `focTheory` |
| 2176 | function | `synTheory` |
| 2195 | const fn | `need` |
| 2215 | function | `pmTheory` |
| 2217 | const fn | `mtpa` |
| 2233 | function | `srmTheory` |
| 2248 | const fn | `curve` |
| 2259 | function | `lgTheory` |
| 2270 | const fn | `cr` |
| 2277 | function | `chaosTheory` |
| 2292 | function | `nnCycles` |
| 2295 | function | `genCtlTheory` |
| 2308 | function | `evTheory` |
| 2322 | function | `nnTheory` |
| 2339 | function | `nnGuiCode` |
| 2345 | function | `runNNCompare` |
| 2353 | function | `dcDriveTheory` |
| 2354 | const fn | `per` |
| 2355 | const fn | `cross` |
| 2385 | function | `twModel` |
| 2388 | const fn | `g` |
| 2391 | function | `twLattice` |
| 2398 | const fn | `marks` |
| 2401 | function | `twTheory` |
| 2409 | const fn | `at` |
| 2426 | function | `arTheory` |
| 2446 | function | `impulseMeasure` |
| 2448 | const fn | `cross` |
| 2451 | function | `marxTheory` |
| 2469 | function | `chopModel` |
| 2472 | const fn | `f` |
| 2475 | function | `chopTheory` |
| 2489 | function | `cmp3` |
| 2493 | function | `hvExact` |
| 2494 | function | `hv153Theory` |
| 2520 | function | `besI1e` |
| 2522 | function | `heaviside` |
| 2524 | function | `lossTheory` |
| 2543 | function | `vtBreak` |
| 2544 | function | `vtTheory` |
| 2564 | function | `hvdivTheory` |
| 2566 | const fn | `r` |
| 2578 | function | `scheringTheory` |
| 2579 | const fn | `inv` |
| 2588 | const fn | `sr` |
| 2600 | const fn | `studyNet` |
| 2601 | function | `studyQ` |
| 2603 | const fn | `studyKey` |
| 2604 | function | `studyOpen` |
| 2613 | function | `studyAct` |
| 2628 | function | `netViewOpen` |
| 2632 | const fn | `legend` |
| 2647 | function | `nvEdit` |
| 2656 | function | `nvApply` |
| 2657 | const fn | `same` |
| 2658 | const fn | `put` |
| 2670 | function | `studyTheory` |
| 2688 | const fn | `X` |
| 2736 | function | `formulaTheory` |
| 2836 | function | `nodeAvg` |
| 2842 | function | `circuitForMath` |
| 2878 | function | `scheduleMath` |
| 2879 | function | `batteryKey` |
| 2881 | function | `mathChoices` |
| 2882 | const fn | `prim` |
| 2884 | function | `renderMathChoices` |
| 2886 | function | `runTemplate` |
| 2892 | function | `runMath` |
| 2914 | function | `saveLocal` |
| 2915 | function | `saveLocalSoon` |
| 2917 | function | `download` |
| 2918 | function | `exportCSV` |
| 2924 | function | `syncScopeInputs` |
| 2925 | function | `setSpeed` |
| 2928 | function | `openSettings` |
| 2929 | const fn | `sel` |
| 2930 | const fn | `chk` |
| 2956 | function | `applyLook` |
| 2960 | function | `boot` |
| 3031 | const fn | `mv` |
| 3032 | const fn | `up` |
| 3033 | const fn | `navOpen` |
| 3049 | const fn | `probeSel` |
| 3111 | function | `renderTheoryLive` |

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
| 206 | method | `cutSel` |
| 207 | method | `beginPaste` |
| 210 | method | `paste` |
| 220 | method | `astar` |
| 228 | const fn | `idx` |
| 230 | const fn | `dirIndex` |
| 233 | const fn | `h` |
| 247 | method | `simpleRoute` |
| 250 | method | `route` |
| 254 | method | `adjustEnd` |
| 262 | method | `areaSize` |
| 269 | method | `requestView` |
| 270 | method | `viewFrame` |
| 277 | method | `applyView` |
| 286 | method | `gridBg` |
| 295 | method | `fit` |
| 297 | method | `extent` |
| 304 | method | `render` |
| 306 | method | `partEls` |
| 307 | method | `partSVG` |
| 313 | method | `renderPart` |
| 314 | method | `valueText` |
| 316 | const fn | `fn` |
| 352 | method | `noteHTML` |
| 357 | method | `lblMeasure` |
| 364 | method | `lvChars` |
| 370 | method | `renderLabels` |
| 376 | const fn | `r1` |
| 377 | const fn | `line` |
| 389 | method | `relabelSoon` |
| 390 | method | `renderWires` |
| 409 | method | `wireSVG` |
| 421 | method | `redrawWire` |
| 422 | method | `pathD` |
| 427 | method | `segDir` |
| 428 | method | `midLabel` |
| 429 | method | `renderPins` |
| 439 | method | `renderSel` |
| 443 | method | `setLive` |
| 445 | method | `updateLive` |
| 457 | method | `drawArrows` |
| 468 | method | `world` |
| 470 | method | `hitAt` |
| 471 | method | `hitOf` |
| 473 | method | `down` |
| 499 | method | `move` |
| 512 | method | `up` |
| 526 | method | `cancelDrag` |
| 527 | method | `hoverPin` |
| 529 | method | `dbl` |
| 530 | method | `menu` |
| 533 | method | `worldNow` |
| 534 | method | `wheel` |
| 541 | method | `letter` |
| 542 | method | `key` |
| 567 | method | `beginDrag` |
| 578 | method | `dragMove` |
| 590 | method | `endDrag` |
| 600 | method | `bakeMove` |
| 605 | method | `dragSeg` |
| 608 | const fn | `stub` |
| 617 | method | `drawMarquee` |
| 620 | method | `marqueeSelect` |
| 623 | const fn | `inside` |
| 630 | method | `escape` |
| 633 | method | `beginPlace` |
| 634 | method | `ghost` |
| 637 | method | `finishPlace` |
| 638 | method | `cancelPlace` |
| 640 | method | `startWire` |
| 641 | method | `startWireFrom` |
| 642 | method | `previewWire` |
| 651 | method | `wireClick` |
| 657 | method | `orthoNext` |
| 658 | method | `finishWire` |
| 674 | method | `cancelWire` |
| 676 | method | `splitWire` |
| 686 | method | `wireNetPin` |
| 688 | method | `canScroll` |

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
| 58 | const fn | `schedAt` |
| 59 | const fn | `num` |
| 61 | const fn | `numList` |
| 73 | function | `b64of` |
| 75 | function | `fromB64` |
| 78 | function | `snapEncode` |
| 79 | const fn | `num` |
| 80 | function | `enc` |
| 90 | function | `snapRestore` |
| 91 | function | `dec` |
| 102 | function | `smPort` |
| 106 | function | `smOut` |
| 110 | const fn | `genCopy` |
| 117 | function | `csolveSp` |
| 135 | function | `csolve` |
| 153 | function | `acInit` |
| 169 | const fn | `y` |
| 218 | const fn | `seq` |
| 267 | class | `NetlistError` |
| 272 | function | `dePiece` |
| 274 | const fn | `F` |
| 275 | function | `deInt` |
| 277 | function | `deFrac` |
| 283 | function | `tlSteady` |
| 285 | const fn | `at` |
| 287 | const fn | `re` |
| 298 | function | `poleG` |
| 299 | function | `tlmModeY` |
| 304 | const fn | `mm` |
| 311 | function | `tlmAcY` |
| 317 | function | `tlmSteady` |
| 318 | const fn | `vm` |
| 332 | function | `tlElement` |
| 339 | function | `tlmElement` |
| 360 | function | `rcCoefC` |
| 362 | const fn | `mul` |
| 367 | function | `wbSet` |
| 372 | function | `wbCo` |
| 376 | function | `wbPoleG` |
| 379 | function | `wbSum` |
| 381 | function | `tlwElement` |
| 400 | function | `tlwAcY` |
| 415 | function | `tlwSteady` |
| 416 | const fn | `mv` |
| 423 | const fn | `st` |
| 433 | function | `piLine` |
| 438 | const fn | `shunt` |
| 446 | function | `rcCoef` |
| 452 | function | `fdCo` |
| 462 | function | `arcF` |
| 468 | function | `arcStep` |
| 475 | function | `arcCur` |
| 480 | function | `nlLimit` |
| 481 | function | `nlSolve` |
| 488 | function | `saiSetup` |
| 489 | const fn | `Lc` |
| 493 | function | `saiCur` |
| 501 | function | `saiCommit` |
| 511 | function | `chbCoef` |
| 516 | function | `chbCommit` |
| 523 | function | `chbStates` |
| 525 | function | `chbCount` |
| 534 | function | `mmcSample` |
| 544 | const fn | `full` |
| 553 | function | `mmcSave` |
| 554 | function | `mmcLoad` |
| 561 | function | `lccCom` |
| 564 | function | `lccMeasInit` |
| 570 | function | `lccMeasure` |
| 587 | function | `lccPlo` |
| 592 | function | `lccU` |
| 594 | function | `lccIn` |
| 597 | function | `lccSetup` |
| 600 | function | `lccEdge` |
| 602 | function | `lccGate` |
| 607 | function | `nlcStep` |
| 610 | const fn | `full` |
| 627 | function | `footLink` |
| 635 | function | `arcStart` |
| 636 | const fn | `r` |
| 639 | function | `buildNetlist` |
| 652 | const fn | `union` |
| 667 | const fn | `nm` |
| 686 | const fn | `sn` |
| 690 | const fn | `isJ` |
| 713 | const fn | `lbl` |
| 718 | const fn | `node` |
| 722 | const fn | `nodeKey` |
| 723 | const fn | `tunePwm` |
| 733 | const fn | `internal` |
| 736 | const fn | `mkBlock` |
| 743 | const fn | `add` |
| 744 | const fn | `series` |
| 1007 | function | `compileSignals` |
| 1040 | function | `f2Phi` |
| 1045 | function | `cmpF` |
| 1049 | function | `stampM` |
| 1051 | function | `luFactor` |
| 1057 | function | `luSolve` |
| 1064 | class | `Sim` |
| 1065 | method | `constructor` |
| 1068 | method | `basePeriod` |
| 1072 | method | `tlMaxStep` |
| 1073 | method | `setStep` |
| 1076 | method | `stIndex` |
| 1091 | method | `stVec` |
| 1092 | method | `stepCfg` |
| 1093 | method | `varSetup` |
| 1099 | method | `setStepMode` |
| 1101 | method | `hGrid` |
| 1105 | method | `modeCap` |
| 1109 | method | `swEls` |
| 1110 | method | `topoKey` |
| 1111 | method | `topoInfo` |
| 1121 | method | `topoCheck` |
| 1138 | method | `lteReset` |
| 1139 | method | `ltePush` |
| 1143 | method | `lteErr` |
| 1153 | method | `varCheck` |
| 1169 | method | `note` |
| 1172 | method | `stepCheck` |
| 1176 | method | `stepInfo` |
| 1179 | method | `diagnostics` |
| 1182 | method | `ringCheck` |
| 1191 | method | `stateMap` |
| 1193 | method | `stateMap0` |
| 1204 | method | `load` |
| 1259 | method | `reset` |
| 1262 | method | `imStep` |
| 1269 | method | `smStep` |
| 1271 | method | `srmStep` |
| 1272 | method | `srmOutputs` |
| 1273 | method | `smOutputs` |
| 1277 | method | `genStep` |
| 1284 | method | `genOutputs` |
| 1289 | method | `genTm` |
| 1290 | method | `genEfd` |
| 1291 | method | `imSources` |
| 1292 | method | `pyBlocks` |
| 1302 | method | `pyLazy` |
| 1304 | method | `pyUpgrade` |
| 1306 | method | `setMethod` |
| 1307 | method | `setControl` |
| 1309 | method | `setBlock` |
| 1311 | method | `setHold` |
| 1313 | method | `markChange` |
| 1318 | method | `progInit` |
| 1319 | method | `addProgram` |
| 1321 | method | `progNext` |
| 1322 | method | `progDue` |
| 1323 | method | `progApply` |
| 1338 | method | `evInit` |
| 1339 | method | `logEv` |
| 1341 | method | `events` |
| 1343 | method | `evSwitches` |
| 1345 | method | `channelKeys` |
| 1364 | method | `allocRecord` |
| 1374 | const fn | `A` |
| 1382 | method | `V` |
| 1383 | method | `elCurrent` |
| 1387 | method | `portI` |
| 1391 | method | `computeVals` |
| 1425 | method | `setRecord` |
| 1426 | method | `recordNow` |
| 1436 | method | `closePeriod` |
| 1447 | method | `lastPeriod` |
| 1448 | method | `now` |
| 1453 | method | `gateOf` |
| 1459 | method | `rawGate` |
| 1470 | method | `carrier` |
| 1473 | method | `shGrid` |
| 1474 | method | `shNext` |
| 1476 | method | `sampleHolds` |
| 1481 | method | `samples` |
| 1482 | method | `ctrlEdges` |
| 1488 | method | `scrU` |
| 1489 | method | `scrGate` |
| 1490 | method | `scrEdges` |
| 1491 | method | `setFiring` |
| 1492 | method | `compV` |
| 1493 | method | `compI` |
| 1495 | method | `dbl` |
| 1496 | method | `sampleControllers` |
| 1530 | method | `evalBlocks` |
| 1634 | method | `blkCopy` |
| 1637 | method | `blkAnyDue` |
| 1640 | method | `blkDue` |
| 1642 | method | `zcFrac` |
| 1645 | method | `saveState` |
| 1647 | method | `restoreState` |
| 1656 | method | `snapshot` |
| 1658 | method | `restoreSnapshot` |
| 1660 | method | `gateSigPeek` |
| 1663 | method | `gateSig` |
| 1668 | method | `jumpScheds` |
| 1675 | method | `jumpAt` |
| 1676 | method | `values` |
| 1706 | method | `assemble` |
| 1723 | const fn | `g` |
| 1748 | method | `rhs` |
| 1750 | const fn | `J` |
| 1769 | method | `cplLinearize` |
| 1777 | method | `solverInfo` |
| 1792 | method | `factor` |
| 1805 | method | `spAssemble` |
| 1812 | method | `solveOnce` |
| 1826 | method | `solve` |
| 1844 | method | `nlLinearize` |
| 1847 | method | `check` |
| 1863 | method | `commit` |
| 1888 | method | `initialSolve` |
| 1900 | method | `tlSources` |
| 1904 | method | `tlRecord` |
| 1910 | method | `tlHist` |
| 1916 | method | `tlmG` |
| 1920 | method | `tlmSources` |
| 1934 | method | `tlmRecord` |
| 1949 | method | `tlwG` |
| 1955 | method | `tlwSources` |
| 1970 | method | `tlwRecord` |
| 1987 | method | `tlmHist` |
| 1994 | method | `step` |
| 1996 | const fn | `gs` |
| 2002 | method | `stepCore` |
| 2061 | method | `edgeSolve` |
| 2064 | method | `edgePoint` |
| 2065 | method | `mmcMoved` |
| 2068 | method | `arcGate` |
| 2076 | method | `trRestart` |
| 2084 | method | `nextEvent` |
| 2090 | const fn | `sch` |
| 2114 | method | `spwmCut` |
| 2117 | const fn | `sig` |
| 2122 | method | `run` |
| 2168 | function | `tuneInfo` |
| 2171 | function | `exportForBatch` |
| 2192 | const fn | `hist` |
| 2207 | const fn | `ci` |
| 2208 | const fn | `vd` |
| 2209 | const fn | `V` |
| 2212 | const fn | `linePort` |
| 2214 | const fn | `I` |
| 2215 | const fn | `portRec` |
| 2216 | const fn | `rec` |
| 2233 | const fn | `clkOf` |
| 2259 | function | `sweepPoint` |
| 2264 | function | `setPath` |
| 2270 | function | `eisPoint` |
| 2278 | function | `resume` |

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

### `web/studio/netview.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 20 | function | `model` |
| 33 | function | `fit` |
| 35 | const fn | `sx` |
| 37 | function | `detail` |
| 38 | function | `pick` |
| 50 | const fn | `num` |
| 52 | function | `describe` |
| 58 | function | `draw` |
| 97 | function | `create` |
| 100 | const fn | `size` |
| 105 | const fn | `paint` |
| 106 | const fn | `ask` |
| 107 | const fn | `at` |
| 109 | const fn | `down` |
| 110 | const fn | `move` |
| 114 | const fn | `up` |
| 115 | const fn | `wheel` |
| 116 | const fn | `dbl` |
| 123 | method | `setLayer` |
| 124 | method | `setNames` |
| 125 | method | `fit` |
| 127 | method | `zoom` |
| 130 | method | `goto` |
| 131 | method | `info` |
| 132 | method | `destroy` |

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
| 143 | function | `bifPoint` |
| 144 | function | `bifSpec` |
| 148 | function | `bifurcation` |
| 152 | const fn | `json` |

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
| 23 | function | `hqr` |
| 57 | function | `eig` |
| 61 | function | `eigKeep` |
| 68 | function | `eigvecHess` |
| 96 | function | `eigvecAbsReal` |
| 114 | function | `eigvecAbs` |
| 137 | const fn | `eng` |
| 140 | function | `divFor` |
| 146 | function | `modes` |
| 148 | const fn | `lam` |
| 173 | function | `vecFor` |
| 175 | function | `owners` |
| 183 | function | `check0` |
| 256 | function | `limit` |
| 257 | const fn | `lab` |
| 258 | const fn | `put` |
| 270 | const fn | `min` |
| 290 | function | `hmaxFor` |
| 295 | function | `check` |

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
| 301 | function | `ccDesign` |
| 309 | method | `build` |
| 359 | method | `build` |
| 386 | method | `build` |
| 411 | method | `build` |
| 438 | function | `invIM` |
| 453 | method | `build` |
| 467 | method | `build` |
| 494 | const fn | `r4` |
| 498 | function | `smFoc` |
| 524 | method | `build` |
| 548 | method | `build` |
| 564 | method | `build` |
| 594 | method | `build` |
| 610 | method | `build` |
| 631 | method | `build` |
| 647 | method | `build` |
| 658 | function | `marxCircuit` |
| 677 | method | `build` |
| 709 | method | `build` |
| 716 | const fn | `down` |
| 733 | method | `build` |
| 750 | method | `build` |
| 763 | method | `build` |
| 780 | method | `build` |
| 797 | method | `build` |
| 817 | method | `build` |
| 832 | method | `build` |
| 878 | function | `nnSched` |
| 879 | function | `nnDrive` |
| 942 | method | `build` |
| 949 | method | `build` |
| 955 | function | `aiBlock` |
| 974 | method | `build` |
| 985 | function | `evDrive` |
| 992 | const fn | `IN` |
| 1031 | const fn | `fix` |
| 1062 | method | `build` |
| 1067 | method | `build` |
| 1076 | method | `build` |
| 1086 | const fn | `y` |
| 1109 | method | `build` |
| 1110 | const fn | `ws` |
| 1149 | method | `build` |
| 1167 | method | `build` |
| 1175 | function | `fbmPoint` |
| 1182 | method | `build` |
| 1201 | function | `smibPoint` |
| 1202 | function | `genCtl` |
| 1204 | const fn | `L` |
| 1232 | method | `build` |
| 1242 | function | `ieee9Build` |
| 1244 | const fn | `GD` |
| 1245 | const fn | `L` |
| 1247 | const fn | `G` |
| 1248 | const fn | `Ld` |
| 1281 | method | `build` |
| 1289 | function | `bigGrid` |
| 1290 | const fn | `B` |
| 1292 | const fn | `w` |
| 1312 | method | `build` |
| 1333 | method | `build` |
| 1345 | method | `build` |
| 1360 | method | `build` |
| 1379 | method | `build` |
| 1398 | method | `build` |
| 1416 | method | `build` |
| 1432 | const fn | `LM` |
| 1435 | function | `tlmPart` |
| 1449 | method | `build` |
| 1468 | method | `build` |
| 1488 | function | `tlmGW` |
| 1492 | const fn | `note` |
| 1504 | method | `build` |
| 1522 | const fn | `tl` |
| 1550 | const fn | `PANE` |
| 1561 | method | `build` |
| 1563 | const fn | `rig` |
| 1582 | method | `build` |
| 1584 | const fn | `rig` |
| 1604 | function | `xbRig` |
| 1606 | const fn | `bond` |
| 1633 | method | `build` |
| 1668 | function | `ssscChannels` |
| 1677 | method | `build` |
| 1697 | method | `build` |
| 1699 | const fn | `ln` |
| 1733 | method | `build` |
| 1735 | const fn | `sw` |
| 1762 | method | `build` |
| 1766 | const fn | `station` |
| 1802 | method | `build` |
| 1806 | const fn | `station` |
| 1853 | method | `build` |
| 1890 | const fn | `gfmWire` |
| 1894 | const fn | `busMeter` |
| 1907 | method | `build` |
| 1909 | const fn | `unit` |
| 1932 | method | `build` |
| 1963 | method | `build` |
| 1996 | method | `build` |
| 2023 | method | `build` |
| 2028 | function | `dcdcInputs` |

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
| 76 | function | `study_action` |
| 93 | function | `scenario` |
| 122 | class | `Handler` |
| 124 | method | `Handler.local` |
| 128 | method | `Handler.alive` |
| 138 | method | `Handler.body` |
| 147 | method | `Handler.addon_get` |
| 177 | method | `Handler.addon_post` |
| 204 | method | `Handler.send` |
| 220 | method | `Handler.do_GET` |
| 251 | method | `Handler.do_POST` |
| 299 | function | `main` |

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

### `pcl/accel.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 29 | function | `best` |
| 38 | function | `system` |
| 58 | function | `residual` |
| 67 | function | `measure` |
| 106 | function | `mixed` |
| 124 | function | `run` |
| 174 | function | `main` |
| 180 | function | `add_arguments` |
| 188 | function | `command` |

### `pcl/backend.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 39 | class | `BackendError` |
| 43 | function | `home` |
| 47 | class | `Backend` |
| 51 | method | `Backend.__init__` |
| 55 | method | `Backend.gpu` |
| 59 | method | `Backend.label` |
| 62 | method | `Backend.asarray` |
| 65 | method | `Backend.numpy` |
| 68 | method | `Backend.csr` |
| 71 | method | `Backend.chunk` |
| 80 | method | `Backend.how` |
| 90 | method | `Backend.solver` |
| 117 | function | `_levels` |
| 167 | function | `cpu` |
| 171 | function | `probe` |
| 211 | function | `gpu` |
| 219 | function | `measurement` |
| 228 | function | `rule` |
| 240 | function | `choose` |

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
| 551 | method | `Project.run` |
| 586 | method | `Project.stream` |
| 668 | method | `Project._result` |
| 675 | method | `Project._query` |
| 687 | method | `Project._run_scipy` |
| 724 | method | `Project.sweep` |
| 798 | method | `Project._sweep_meta` |
| 803 | method | `Project.bifurcation` |
| 860 | class | `_SweepFile` |
| 865 | method | `_SweepFile.__init__` |
| 879 | method | `_SweepFile._val` |
| 887 | method | `_SweepFile._read` |
| 906 | method | `_SweepFile._line` |
| 910 | method | `_SweepFile.add` |
| 914 | method | `_SweepFile.close` |
| 920 | function | `_sweep_point` |
| 928 | function | `_as_list` |
| 938 | function | `_spec` |
| 954 | function | `_measures` |
| 977 | function | `_base_T` |
| 984 | function | `_unit` |
| 988 | function | `_matname` |
| 993 | class | `Result` |
| 996 | method | `Result.__init__` |
| 1006 | method | `Result.__getitem__` |
| 1009 | method | `Result.__repr__` |
| 1012 | method | `Result.events_csv` |
| 1023 | method | `Result.measure` |
| 1083 | method | `Result.frame` |
| 1092 | method | `Result._meta_lines` |
| 1096 | method | `Result.to_csv` |
| 1109 | method | `Result._vars` |
| 1119 | method | `Result.as_dict` |
| 1123 | method | `Result.to_json` |
| 1127 | method | `Result.to_mat` |
| 1138 | method | `Result.to_parquet` |
| 1146 | method | `Result.to_hdf5` |
| 1152 | method | `Result.save` |
| 1156 | function | `_save` |
| 1163 | class | `SweepResult` |
| 1166 | method | `SweepResult.__init__` |
| 1172 | method | `SweepResult.__repr__` |
| 1175 | method | `SweepResult.column` |
| 1178 | method | `SweepResult.frame` |
| 1185 | method | `SweepResult.to_csv` |
| 1197 | method | `SweepResult.to_json` |
| 1201 | method | `SweepResult.to_mat` |
| 1208 | method | `SweepResult._columns` |
| 1212 | method | `SweepResult.to_parquet` |
| 1218 | method | `SweepResult.to_hdf5` |
| 1223 | method | `SweepResult.save` |
| 1227 | class | `BifurcationResult` |
| 1231 | method | `BifurcationResult.__init__` |
| 1238 | method | `BifurcationResult.__repr__` |
| 1241 | method | `BifurcationResult.changes` |
| 1250 | method | `BifurcationResult.rows` |
| 1254 | method | `BifurcationResult._columns` |
| 1258 | method | `BifurcationResult.frame` |
| 1265 | method | `BifurcationResult.plot` |
| 1268 | method | `BifurcationResult.to_csv` |
| 1279 | method | `BifurcationResult.to_json` |
| 1283 | method | `BifurcationResult.to_mat` |
| 1289 | method | `BifurcationResult.to_parquet` |
| 1294 | method | `BifurcationResult.to_hdf5` |
| 1299 | method | `BifurcationResult.save` |
| 1310 | function | `_el` |
| 1315 | function | `_matrix` |
| 1320 | function | `_ascii` |
| 1327 | function | `_mat_char` |
| 1332 | function | `_mat_value` |
| 1345 | function | `_savemat` |

### `pcl/cpf.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 51 | class | `CpfError` |
| 55 | class | `_Sys` |
| 59 | method | `_Sys.__init__` |
| 78 | method | `_Sys.load` |
| 81 | method | `_Sys.F` |
| 90 | method | `_Sys.factor` |
| 103 | method | `_Sys.get` |
| 106 | method | `_Sys.moved` |
| 112 | method | `_Sys.full` |
| 120 | method | `_Sys.name` |
| 125 | function | `_tangent` |
| 137 | function | `_correct` |
| 162 | function | `_mix` |
| 166 | function | `_fold` |
| 194 | function | `_direction` |
| 226 | function | `run` |

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

### `pcl/harmonic.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 39 | class | `HarmonicError` |
| 43 | function | `six_pulse` |
| 60 | function | `spectrum` |
| 78 | function | `limits` |
| 86 | function | `_sequence` |
| 91 | class | `Model` |
| 94 | method | `Model.__init__` |
| 139 | method | `Model._load` |
| 155 | method | `Model.branches` |
| 171 | method | `Model.Y` |
| 192 | function | `sources_of` |
| 197 | function | `scan` |
| 215 | function | `run` |

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

### `pcl/ipm.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 30 | class | `IpmError` |
| 34 | function | `ipm` |

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

### `pcl/netfile.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 36 | class | `FileError` |
| 40 | function | `sniff` |
| 64 | function | `read` |
| 109 | function | `_drop_islands` |
| 136 | function | `read_file` |
| 141 | function | `_matpower` |
| 169 | function | `_matpower_loose` |
| 193 | function | `_mw` |
| 197 | function | `_types` |
| 209 | function | `_numbers` |
| 217 | function | `_only_pu` |
| 227 | function | `to_matpower` |
| 269 | function | `write` |
| 281 | function | `summary` |
| 294 | function | `describe` |
| 313 | function | `_f` |
| 328 | function | `_n` |
| 333 | function | `apply` |
| 350 | function | `_bus` |
| 357 | function | `_op_load` |
| 377 | function | `_shares` |
| 383 | function | `_free` |
| 391 | function | `_op_scale` |
| 410 | function | `_gen` |
| 424 | function | `_op_gen` |
| 446 | function | `_op_rating` |
| 460 | function | `_op_outage` |
| 485 | function | `out_of_service` |

### `pcl/netview.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 37 | class | `ViewError` |
| 42 | function | `_graph` |
| 50 | function | `_components` |
| 58 | function | `_hops` |
| 66 | function | `_tree` |
| 111 | function | `_classical` |
| 127 | function | `_stress` |
| 152 | function | `_stress_sparse` |
| 179 | function | `_spread` |
| 203 | function | `_island` |
| 240 | function | `layout` |
| 257 | function | `_layout` |
| 287 | function | `view` |
| 333 | function | `_scale` |
| 344 | function | `_num` |
| 352 | function | `values` |
| 582 | function | `_maybe_int` |
| 592 | function | `pack` |
| 615 | function | `_esc` |
| 619 | function | `_segments` |
| 635 | function | `_col` |
| 640 | function | `svg` |
| 715 | function | `dxf` |

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
| 135 | method | `Network._add` |
| 154 | method | `Network.feeder` |
| 161 | method | `Network.line` |
| 169 | method | `Network.transformer` |
| 177 | method | `Network.transformer3` |
| 194 | method | `Network.generator` |
| 206 | method | `Network.unit` |
| 213 | method | `Network.motor` |
| 219 | method | `Network.reactor` |
| 223 | method | `Network.load` |
| 235 | method | `Network.shunt` |
| 247 | method | `Network.branch_pu` |
| 253 | method | `Network.sssc` |
| 268 | method | `Network.remove` |
| 271 | method | `Network.element` |
| 278 | method | `Network._zb` |
| 282 | method | `Network._ib` |
| 286 | method | `Network._sc_parts` |
| 421 | method | `Network._t3` |
| 456 | method | `Network.impedances` |
| 464 | method | `Network._index` |
| 468 | method | `Network._ybus` |
| 492 | method | `Network._ratios` |
| 527 | method | `Network.short_circuit` |
| 611 | method | `Network._breaking` |
| 643 | method | `Network.iec60909` |
| 648 | method | `Network._lf_model` |
| 752 | method | `Network._sssc_x` |
| 759 | method | `Network.load_flow` |
| 770 | method | `Network._lf_sssc` |
| 799 | method | `Network._lf` |
| 830 | method | `Network._lf_result` |
| 854 | method | `Network._flows` |
| 879 | method | `Network.case` |
| 889 | method | `Network.advice` |
| 898 | method | `Network.power_flow` |
| 920 | method | `Network.dc_flow` |
| 928 | method | `Network.ptdf` |
| 934 | method | `Network.lodf` |
| 941 | method | `Network.contingency` |
| 1019 | method | `Network.batch_flow` |
| 1059 | method | `Network.report` |
| 1065 | method | `Network.scopf` |
| 1071 | method | `Network.cpf` |
| 1078 | method | `Network.estimate` |
| 1085 | method | `Network.harmonics` |
| 1092 | method | `Network.opf` |
| 1114 | method | `Network.to_emt` |
| 1194 | function | `_coo` |
| 1200 | function | `_zip` |
| 1205 | function | `_solve` |
| 1216 | function | `_nr` |
| 1252 | function | `sssc_placement` |
| 1309 | function | `superposition` |
| 1333 | function | `trv` |
| 1367 | function | `_matrix` |
| 1379 | function | `read_matpower` |
| 1416 | function | `ieee` |
| 1426 | function | `case_data` |
| 1437 | function | `case_solution` |
| 1446 | function | `ieee9` |
| 1473 | function | `ieee14` |
| 1486 | function | `to_dict` |
| 1499 | function | `from_dict` |
| 1519 | function | `save` |
| 1523 | function | `load` |

### `pcl/nnstart.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 38 | class | `StartError` |
| 42 | function | `layout` |
| 51 | function | `fingerprint` |
| 73 | function | `features` |
| 79 | class | `Model` |
| 83 | method | `Model.__init__` |
| 87 | method | `Model.study` |
| 90 | method | `Model.predict` |
| 94 | method | `Model.save` |
| 101 | method | `Model.load` |
| 128 | method | `Model.applies` |
| 138 | function | `dataset` |
| 173 | function | `fit` |
| 229 | function | `train` |
| 273 | function | `propose_opf` |
| 289 | function | `propose_pf` |
| 309 | function | `folders` |
| 318 | function | `find` |
| 338 | function | `summary` |
| 351 | function | `network` |
| 362 | function | `add_arguments` |
| 372 | function | `command` |

### `pcl/onnxio.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 27 | class | `OnnxError` |
| 32 | function | `_varint` |
| 43 | function | `_int` |
| 47 | function | `_bytes` |
| 52 | function | `_tensor` |
| 59 | function | `_value` |
| 64 | function | `_attr` |
| 74 | function | `dumps` |
| 94 | function | `write` |
| 101 | function | `_fields` |
| 144 | function | `_signed` |
| 148 | function | `_ints` |
| 162 | function | `_read_tensor` |
| 191 | function | `_read_value` |
| 209 | function | `_read_attr` |
| 225 | function | `loads` |
| 282 | function | `read` |
| 288 | function | `run` |
| 336 | function | `mlp` |

### `pcl/opf.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 28 | class | `OpfError` |
| 35 | function | `_diag` |
| 40 | function | `dSbus_dV` |
| 49 | function | `d2Sbus_dV2` |
| 64 | function | `dSbr_dV` |
| 74 | function | `d2Sbr_dV2` |
| 87 | function | `d2ASbr_dV2` |
| 96 | function | `sources` |
| 129 | function | `vlimits` |
| 140 | function | `advise` |
| 155 | function | `solve` |

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

### `pcl/powerflow.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 41 | class | `PowerFlowError` |
| 45 | function | `_csr` |
| 52 | class | `Case` |
| 56 | method | `Case.__init__` |
| 102 | method | `Case.sets` |
| 106 | method | `Case.start` |
| 113 | method | `Case.zip` |
| 117 | method | `Case.mismatch` |
| 122 | method | `Case.err` |
| 128 | method | `Case.jac` |
| 139 | method | `Case.graph` |
| 158 | method | `Case.link_tree` |
| 167 | method | `Case.tree` |
| 199 | class | `Jacobian` |
| 205 | method | `Jacobian.__init__` |
| 231 | method | `Jacobian.fill` |
| 244 | method | `Jacobian.factor` |
| 260 | method | `Jacobian.rhs` |
| 263 | method | `Jacobian.apply` |
| 270 | class | `_LU` |
| 273 | method | `_LU.__init__` |
| 277 | method | `_LU.solve` |
| 287 | function | `newton` |
| 320 | function | `newton_dense` |
| 330 | function | `_b_matrices` |
| 348 | function | `fast_decoupled` |
| 380 | function | `newton_ci` |
| 460 | function | `sweep` |
| 501 | class | `Tree` |
| 507 | method | `Tree.__init__` |
| 560 | method | `Tree.solve` |
| 573 | method | `Tree.patterns` |
| 585 | function | `breakpoint_matrix` |
| 605 | function | `sweep_comp` |
| 674 | function | `gauss_seidel` |
| 707 | function | `dc_model` |
| 720 | function | `dc_flow` |
| 735 | function | `ptdf` |
| 746 | function | `lodf` |
| 759 | function | `bridges` |
| 795 | function | `advise` |
| 826 | function | `solve` |
| 874 | function | `_iterate` |
| 937 | function | `_on` |
| 950 | function | `batch` |
| 1025 | function | `_branch_jac` |
| 1041 | function | `contingency_ac` |
| 1147 | function | `without` |
| 1159 | function | `branch_flows` |

### `pcl/psse.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 41 | class | `RawError` |
| 48 | function | `fields` |
| 70 | function | `_split` |
| 84 | class | `_Rec` |
| 89 | method | `_Rec.f` |
| 103 | method | `_Rec.i` |
| 106 | method | `_Rec.s` |
| 110 | function | `_sections` |
| 138 | function | `_version` |
| 150 | function | `read` |
| 359 | function | `read_file` |
| 364 | function | `write` |

### `pcl/report.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 36 | class | `ReportError` |
| 40 | function | `num` |
| 66 | function | `_ticks` |
| 85 | class | `Report` |
| 88 | method | `Report.__init__` |
| 94 | method | `Report._add` |
| 98 | method | `Report.heading` |
| 101 | method | `Report.text` |
| 105 | method | `Report.note` |
| 111 | method | `Report.facts` |
| 116 | method | `Report.table` |
| 128 | method | `Report.chart` |
| 144 | method | `Report.network` |
| 153 | method | `Report.data` |
| 158 | method | `Report.extend` |
| 164 | method | `Report.to_dict` |
| 169 | method | `Report.from_dict` |
| 196 | method | `Report.save` |
| 211 | method | `Report.load` |
| 215 | method | `Report.markdown` |
| 251 | method | `Report.html` |
| 297 | method | `Report._table` |
| 311 | method | `Report._chart` |
| 429 | function | `network_report` |
| 586 | function | `_security` |
| 621 | function | `_cpf` |
| 680 | function | `_se` |
| 768 | function | `_harmonic` |
| 828 | function | `_branches` |

### `pcl/scopf.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 41 | class | `ScopfError` |
| 45 | function | `screen` |
| 55 | function | `solve` |
| 193 | function | `_ac` |

### `pcl/se.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 36 | class | `SeError` |
| 40 | function | `_class` |
| 44 | function | `_chi2` |
| 51 | function | `quantities` |
| 79 | function | `_rows` |
| 105 | function | `zero_injection` |
| 112 | function | `measure` |
| 186 | class | `_Problem` |
| 189 | method | `_Problem.__init__` |
| 197 | method | `_Problem.system` |
| 219 | method | `_Problem.factor` |
| 230 | method | `_Problem.solve` |
| 252 | method | `_Problem.omega` |
| 266 | function | `residual_covariance` |
| 274 | function | `_decoupled` |
| 307 | function | `_matrix` |
| 315 | function | `_regular` |
| 327 | function | `observability` |
| 395 | function | `uncovered` |
| 416 | function | `run` |

### `pcl/study.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 35 | class | `StudyError` |
| 39 | function | `_clean` |
| 58 | function | `_base_network` |
| 77 | function | `_networks_of` |
| 88 | function | `network_of` |
| 93 | function | `open_file` |
| 106 | function | `save_file` |
| 121 | function | `_picture` |
| 128 | function | `_study` |
| 158 | function | `summary` |
| 226 | function | `run` |
| 252 | function | `view` |
| 275 | function | `_stem` |
| 281 | function | `report` |

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
