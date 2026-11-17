# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 116 |
| `web/studio/app.js` | 3165 |
| `web/studio/bus.js` | 197 |
| `web/studio/ctlwin.js` | 78 |
| `web/studio/editor.js` | 697 |
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
| `web/studio/mna.js` | 2432 |
| `web/studio/netlib.js` | 1355 |
| `web/studio/netview.js` | 138 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 1569 |
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
| `web/studio/tutorials.js` | 2125 |
| `web/studio/units.js` | 164 |
| `web/studio/watch.js` | 339 |
| `web/studio/winframe.js` | 63 |
| `pcl/runner.js` | 27 |
| `run.py` | 324 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 3194 |
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
| `pcl/dcgrid.py` | 408 |
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
| `pcl/netview.py` | 813 |
| `pcl/network.py` | 1604 |
| `pcl/nnstart.py` | 388 |
| `pcl/onnxio.py` | 355 |
| `pcl/opf.py` | 417 |
| `pcl/plotting.py` | 340 |
| `pcl/powerflow.py` | 1169 |
| `pcl/psse.py` | 433 |
| `pcl/report.py` | 963 |
| `pcl/scopf.py` | 213 |
| `pcl/se.py` | 563 |
| `pcl/study.py` | 442 |
| `pcl/trv.py` | 433 |
| `pcl/unbalanced.py` | 525 |
| `pcl/wideband.py` | 1279 |
| `pcl/workbench.py` | 485 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 228 |
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
| `tests/test_dcgrid.py` | 393 |
| `tests/test_derivation.py` | 93 |
| `tests/test_designer.py` | 200 |
| `tests/test_engine.py` | 276 |
| `tests/test_ev.py` | 104 |
| `tests/test_ev_weights.py` | 78 |
| `tests/test_gen_ctl.py` | 136 |
| `tests/test_generator.py` | 223 |
| `tests/test_gfm.py` | 222 |
| `tests/test_gfm2.py` | 167 |
| `tests/test_guide.py` | 130 |
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
| `tests/test_meas.py` | 446 |
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
| `tests/test_report.py` | 914 |
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
| `tests/test_unbalanced.py` | 451 |
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
| `tests/js/meas_cases.js` | 131 |
| `tests/js/mmc_cases.js` | 56 |
| `tests/js/mtdc_cases.js` | 13 |
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
| `tests/js/study_cases.js` | 37 |
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
| `tests/ui/blocks_flow.js` | 155 |
| `tests/ui/bus_flow.js` | 90 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/ev_flow.js` | 112 |
| `tests/ui/facts_flow.js` | 93 |
| `tests/ui/features_flow.js` | 355 |
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
| 155 | `R` | Αντίσταση |
| 159 | `CPE` | CPE / Warburg |
| 165 | `L` | Πηνίο |
| 169 | `C` | Πυκνωτής |
| 173 | `VDC` | Πηγή DC / μπαταρία |
| 179 | `VAC` | Πηγή AC |
| 183 | `VAC3` | Τριφασική πηγή (Y) |
| 189 | `IDC` | Πηγή ρεύματος |
| 195 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 208 | `D` | Δίοδος |
| 212 | `SCR` | Θυρίστορ (SCR) |
| 224 | `XFMR` | Μετασχηματιστής |
| 232 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 245 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 258 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 268 | `KL` | Συζευγμένα πηνία (N×N) |
| 279 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 286 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 294 | `SG` | Σπινθηριστής (διάκενο) |
| 307 | `CPL` | Φορτίο σταθερής ισχύος |
| 311 | `SH` | Δειγματοληψία και συγκράτηση (S&H) |
| 320 | `GND` | Γείωση |
| 322 | `JUNC` | Κόμβος |
| 323 | `PWM` | PWM / έλεγχος |
| 361 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 372 | `VM` | Βολτόμετρο |
| 374 | `AM` | Αμπερόμετρο (σε σειρά) |
| 377 | `VP` | Probe τάσης (ως προς τη γη) |
| 379 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 381 | `MEAS` | Μέτρηση στοιχείου |
| 385 | `CONST` | Σταθερά / πρόγραμμα |
| 394 | `GAIN` | Κέρδος |
| 396 | `SUM` | Άθροισμα |
| 399 | `MUL` | Γινόμενο |
| 401 | `DIV` | Διαίρεση a/b |
| 404 | `SAT` | Κορεσμός |
| 407 | `CMP` | Συγκριτής |
| 410 | `LOGIC` | Λογική πύλη |
| 413 | `PIB` | PI διακριτός |
| 419 | `UD` | Καθυστέρηση z⁻¹ |
| 422 | `SR` | Μανδαλωτής SR (latch) |
| 425 | `CLK` | Ρολόι (τετραγωνικό) |
| 428 | `RAMP` | Φέρον / ράμπα |
| 433 | `EXPR` | Έκφραση |
| 437 | `PY` | Μπλοκ Python |
| 445 | `AIC` | Ελεγκτής AI (βρόχος με νευρωνικό) |
| 463 | `AVR` | Διέγερση και ρυθμιστής τάσης (AVR: IEEE ST1A, DC1A) |
| 474 | `PSS` | Σταθεροποιητής συστήματος (PSS) |
| 479 | `GOV` | Ρυθμιστής στροφών και στρόβιλος |
| 492 | `EVC` | Πολυκριτηριακός ελεγκτής οχήματος (ταχύτητα → ροπή → ρεύμα) |
| 502 | `NN` | Νευρωνικό δίκτυο (MLP) |
| 565 | `MOD3` | Διαμορφωτής τριφασικός |
| 569 | `FEST` | Εκτιμητής ροής δρομέα |
| 573 | `INT` | Ολοκληρωτής |
| 577 | `LPF` | Βαθυπερατό 1ης τάξης |
| 581 | `F2` | Φίλτρο 2ης τάξης |
| 586 | `RLIM` | Όριο ρυθμού μεταβολής |
| 590 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 594 | `EDGE` | Ανιχνευτής ακμής |
| 598 | `CLARKE` | Clarke abc → αβ |
| 602 | `ICLARKE` | Clarke αβ → abc |
| 606 | `PARK` | Park αβ → dq |
| 609 | `IPARK` | Park dq → αβ |
| 612 | `PLL` | PLL (τριφασικό) |
| 618 | `TAGO` | Ετικέτα: προς (Goto) |
| 621 | `TAGI` | Ετικέτα: από (From) |
| 625 | `AVG` | Μέση τιμή |
| 628 | `RMS` | Ενεργός τιμή (RMS) |
| 631 | `MNMX` | Ελάχιστο και μέγιστο ανά περίοδο |
| 639 | `FOUR` | Fourier: αρμονική ν |
| 646 | `THD` | Ολική αρμονική παραμόρφωση (THD) |
| 656 | `PQ1` | Ισχύς (μονοφασική) |
| 661 | `PQ3` | Στιγμιαία ισχύς p, q (τριφασική) |
| 668 | `PPOS` | Ισχύς θετικής ακολουθίας |
| 674 | `SEQ` | Αναλυτής ακολουθιών |
| 683 | `PIA` | Περιοδικός μέσος παλμών |
| 687 | `DISP` | Ένδειξη |
| 691 | `SUB` | Υποκύκλωμα |
| 694 | `PORT` | Θύρα (ηλεκτρική) |
| 697 | `SIN` | Θύρα εισόδου σήματος |
| 700 | `SOUT` | Θύρα εξόδου σήματος |
| 704 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 709 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 713 | `BSEL` | Επιλογή από δίαυλο |
| 716 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 722 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 733 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 742 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 752 | `ARCX` | Τμήμα τόξου |
| 756 | `ARC` | Διακόπτης με τόξο (μονοφασικός) |
| 763 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 774 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 819 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 832 | `TLM` | Γραμμή από γεωμετρία (CP / FD / WB) |
| 868 | `TOWER` | Πύργος γραμμής (κεραυνοί) |
| 885 | `SAI` | Αλεξικέραυνο ZnO, μοντέλο IEEE (εξαρτάται από τη συχνότητα) |
| 900 | `SAIX` | Αλεξικέραυνο IEEE (συμπαγές) |
| 904 | `RFX` | Γείωση πύργου R(I) (από τη γραμμή του πύργου) |
| 910 | `CHB` | Αρθρωτός βραχίονας: γέφυρες H σε σειρά (CHB) |
| 918 | `NLC` | Διαμόρφωση πλησιέστερης στάθμης (NLC) με ταξινόμηση |
| 924 | `SPLL` | PLL μονοφασικό (SOGI) |
| 931 | `SSSC` | Έλεγχος αρθρωτού SSSC (m-SSSC) |
| 950 | `SSSC3` | Κεντρικός έλεγχος τριφασικού m-SSSC |
| 974 | `MMC` | Μετατροπέας MMC (HVDC, μοντέλα 1–4) |
| 1003 | `MMCC` | Έλεγχος σταθμού MMC (HVDC) |
| 1050 | `VSC2` | Μετατροπέας VSC δύο επιπέδων (μέσο μοντέλο, φίλτρο L ή LC) |
| 1063 | `GFMC` | Έλεγχος grid-forming (στατικότητα, VSM, PSC) |
| 1103 | `LCC6` | Γέφυρα θυρίστορ 6 παλμών (LCC) |
| 1119 | `LCCS` | Σταθμός LCC 12 παλμών (HVDC) |
| 1134 | `LCCC` | Έλεγχος σταθμού LCC (HVDC) |
| 1159 | `FILT3` | Φίλτρο AC τριφασικό |
| 1165 | `ZSER3` | Τριφασική εμπέδηση σειράς (R + L + (R + L) ∥ R) |
| 1171 | `LCCX` | Γέφυρα 6 παλμών (συμπαγής) |
| 1176 | `LCCM` | Μέτρηση α και γ (γέφυρα 6 παλμών) |
| 1181 | `MMCA` | Βραχίονας MMC (συμπαγής) |
| 1186 | `CHBX` | Αρθρωτός βραχίονας (συμπαγής) |
| 1189 | `SPLX` | PLL μονοφασικό (SOGI, συμπαγές) |
| 1193 | `NOTE` | Σημείωση (κείμενο στο σχέδιο) |

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
| 166 | `pq_rect` | Ανορθωτές | Ανορθωτής με πυκνωτή · αρμονικές και συντελεστής ισχύος |
| 192 | `bridge3` | Ανορθωτές | Τριφασική γέφυρα 6 παλμών |
| 208 | `battery` | Αμφίδρομος · μπαταρία (PE2) | Αμφίδρομος μετατροπέας μπαταρίας |
| 258 | `sampling` | Αμφίδρομος · μπαταρία (PE2) | Άσκηση 2 · Επίδραση δειγματοληψίας |
| 293 | `polyphase` | Αμφίδρομος · μπαταρία (PE2) | Άσκηση 2 · Πολυφασική σχεδίαση |
| 331 | `current_ctl` | Αμφίδρομος · μπαταρία (PE2) | Άσκηση 3 · Έλεγχος ρεύματος από μπλοκ |
| 382 | `blocks_loop` | Μπλοκ σημάτων (3.0) | Βρόχος ρεύματος από μπλοκ |
| 410 | `code_loop` | Μπλοκ κώδικα (3.3) | PI σε Python και πρόσθια τροφοδότηση με έκφραση |
| 435 | `cell_eis` | Μπαταρίες και EIS (3.3.1) | Δοκιμή κυψέλης: EIS με μετατροπέα |
| 478 | `im_vf` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: V/f και διαμόρφωση SPWM, SVPWM, τετραγωνική |
| 491 | `im_foc` | Ηλεκτρική κίνηση (3.4) | Μηχανή επαγωγής: διανυσματικός έλεγχος, εξασθένιση πεδίου, R̂_R |
| 546 | `synrm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μαγνητικής αντίστασης (SynRM): ευθυγράμμιση, έλεγχος dq, MTPA |
| 572 | `pmsm` | Ηλεκτρική κίνηση (3.5) | Σύγχρονη μηχανή μόνιμων μαγνητών (PMSM / IPMSM): i_d = 0 και MTPA |
| 588 | `srm` | Ηλεκτρική κίνηση (3.6) | Μηχανή μεταβλητής μαγνητικής αντίστασης (SRM 8/6): γωνίες, υστέρηση, βρόχος ψ–i |
| 619 | `lightning` | Κεραυνικά (3.5) | Κεραυνικό ρεύμα Heidler: 10/350, 1/200, 0,25/100 μs |
| 631 | `twave` | Υψηλές τάσεις (3.8) | Οδεύοντα κύματα: ανάκλαση σε ανοιχτό, βραχυκυκλωμένο ή ωμικό άκρο, διάγραμμα Bewley |
| 654 | `arrester` | Υψηλές τάσεις (3.9) | Αλεξικέραυνο: παραμένουσα τάση και απόσταση προστασίας |
| 670 | `marx` | Υψηλές τάσεις (3.10) | Γεννήτρια Marx: πολυβάθμια κρουστική γεννήτρια με σπινθηριστές |
| 700 | `chop` | Υψηλές τάσεις (3.10) | Αποκομμένη κρουστική τάση: σπινθηριστής αποκοπής |
| 734 | `hv153` | Υψηλές τάσεις (3.11) | Ασκήσεις 15.3: γεννήτριες κρουστικών τάσεων (βιβλίο, ακριβής λύση, προσομοίωση) |
| 755 | `lossline` | Υψηλές τάσεις (3.11) | Γραμμή με απώλειες: απόσβεση και παραμόρφωση οδεύοντος κύματος |
| 772 | `voltime` | Υψηλές τάσεις (3.11) | Καμπύλη τάσης–χρόνου διακένου (κριτήριο ενέργειας διάσπασης) |
| 788 | `hvdiv` | Υψηλές τάσεις (3.12) | Μέτρηση εναλλασσόμενης υψηλής τάσης: καταμεριστές (ασκήσεις 15.1.3, 15.1.5) |
| 805 | `schering` | Υψηλές τάσεις (3.12) | Γέφυρα Schering: χωρητικότητα και συντελεστής απωλειών (άσκηση 15.5.12) |
| 820 | `peak_cm` | Μπλοκ σημάτων (3.0) | Peak current-mode και υποαρμονική |
| 842 | `pcm_chaos` | Μπλοκ σημάτων (3.0) | Διακλαδώσεις και χάος στο peak current-mode (boost) |
| 856 | `dc_drive` | Ηλεκτρική κίνηση (3.1) | Μηχανή ΣΡ: βρόχοι ρεύματος και ταχύτητας |
| 966 | `nn_compare` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Έλεγχος με νευρωνικό δίκτυο: σύγκριση |
| 972 | `nn_online` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Νευρωνικό που μαθαίνει αμέσως |
| 997 | `ai_block` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Ελεγκτής AI με πρόσοψη |
| 1085 | `ev_drive` | Ηλεκτρικό όχημα (4.8) | Ηλεκτρικό όχημα: πολυκριτηριακός έλεγχος |
| 1092 | `nn_gui` | Έλεγχος με νευρωνικά δίκτυα (4.7) | Σύνθεση ελέγχου από Python: κάθε μηχανή, στόχοι με βάρη |
| 1099 | `sub_legs` | Υποκυκλώματα (3.17) | Πολυφασικός buck από ένα υποκύκλωμα σκέλους |
| 1132 | `bus_dq` | Δίαυλοι (3.18) | Βρόχος ρεύματος dq με διαύλους: τριφασικός μετατροπέας προς δίκτυο |
| 1171 | `net_fault` | Δίκτυο (4.1) | Βραχυκύκλωμα σε δίκτυο: IEC 60909 και συμμετρικές συνιστώσες |
| 1191 | `gen_sc` | Συστήματα ισχύος (4.3) | Τριφασικό βραχυκύκλωμα στα άκρα σύγχρονης γεννήτριας |
| 1207 | `fbm` | Συστήματα ισχύος (4.3) | IEEE First Benchmark Model: υποσύγχρονος συντονισμός (SSR) |
| 1255 | `gen_ctl` | Συστήματα ισχύος (4.8.1) | Γεννήτρια με AVR, PSS και ρυθμιστή στροφών |
| 1305 | `ieee9_emt` | Συστήματα ισχύος (4.3) | IEEE 9 ζυγών σε EMT, από τη ροή φορτίου |
| 1336 | `big_grid` | Μεγάλα δίκτυα (4.19.3) | Πλέγμα k × k ζυγών σε EMT: ο γραμμικός λύτης σε μεγάλο δίκτυο |
| 1351 | `pf_study` | Ροή φορτίου και OPF (4.19.1) | Ροή φορτίου και N−1 σε δίκτυα IEEE |
| 1363 | `opf_study` | Ροή φορτίου και OPF (4.19.1) | Βέλτιστη ροή φορτίου (OPF) σε δίκτυα IEEE |
| 1377 | `cpf_study` | Ροή φορτίου και OPF (4.19.1) | Ευστάθεια τάσης: καμπύλη P–V και περιθώριο φόρτισης (συνεχιζόμενη ροή φορτίου) |
| 1393 | `se_study` | Ροή φορτίου και OPF (4.19.1) | Εκτίμηση κατάστασης: μετρήσεις με σφάλματα και εντοπισμός των λανθασμένων |
| 1412 | `harm_study` | Ροή φορτίου και OPF (4.19.1) | Αρμονικές: παραμόρφωση τάσης και συντονισμοί (αρμονική ροή φορτίου) |
| 1432 | `unb_study` | Ροή φορτίου και OPF (4.19.1) | Ασύμμετρη ροή φορτίου: ένας τροφοδότης διανομής φάση προς φάση |
| 1458 | `ieee9_sssc` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | IEEE 9 ζυγών σε EMT με τριφασικό m-SSSC (κεντρικός έλεγχος) |
| 1488 | `trv_terminal` | Διακόπτες ισχύος (4.9) | TRV σε σφάλμα ακροδεκτών: IEC 62271-100 |
| 1509 | `trv_slf` | Διακόπτες ισχύος (4.9) | Σφάλμα κοντινής γραμμής και τόξο του διακόπτη |
| 1540 | `lightning_gis` | Κεραυνοί και συντονισμός μόνωσης (4.9) | Κεραυνός σε γραμμή 400 kV δίπλα σε υποσταθμό GIS: συντονισμός μόνωσης |
| 1603 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1624 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1673 | `cable_xb` | Καλώδια: wideband και cross-bonding (4.13) | Υπόγειο καλώδιο 150 kV με cross-bonding: αναλυτικό και ομογενές μοντέλο |
| 1716 | `sssc_1ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε γραμμή (μονοφασικό) |
| 1736 | `sssc_3ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε δίκτυο 150 kV (τριφασικό, 4 ζυγοί) |
| 1774 | `ccsc_1ph` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | CCSC: πυκνωτής σειράς ελεγχόμενος από μετατροπέα (μονοφασικό) |
| 1802 | `hvdc_mmc` | HVDC: MMC (4.14) | Σύνδεση HVDC με MMC σημείο προς σημείο (±320 kV, 1000 MW) |
| 1855 | `mtdc5` | Δίκτυα DC πολλών τερματικών (4.20) | Δίκτυο DC πέντε τερματικών με στατικότητα τάσης (EMT και ροή φορτίου AC/DC) |
| 1889 | `hvdc_gfm` | Grid-forming (4.18.1) | Σταθμός MMC ως grid-forming: νησίδα, ασθενές δίκτυο, παράλληλα με άλλη μονάδα |
| 1937 | `hvdc_lcc` | HVDC: LCC (4.16) | Το πρώτο benchmark HVDC της CIGRE (LCC 12 παλμών, 500 kV, 1000 MW) |
| 1991 | `gfm_island` | Grid-forming (4.18) | Νησίδα με δύο μετατροπείς grid-forming: μοιρασιά του φορτίου με τη στατικότητα |
| 2018 | `gfm_sync` | Grid-forming (4.18) | Synchronverter: αντιστροφέας που μιμείται σύγχρονη γεννήτρια (Zhong & Weiss 2011) |
| 2046 | `gfm_weak` | Grid-forming (4.18) | Συγχρονισμός μέσω ισχύος (PSC) σε ασθενές δίκτυο, απέναντι στον έλεγχο ρεύματος με PLL |
| 2083 | `ieee9_gfm` | Grid-forming (4.18.1) | IEEE 9 με μετατροπέα στη θέση της G3: grid-forming ή grid-following (nadir, RoCoF) |
| 2113 | `empty` | Νέο | Κενό κύκλωμα |

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
| 232 | function | `outsOf` |
| 234 | const fn | `vecN` |
| 236 | function | `chanLabel` |
| 246 | function | `chanSrc` |
| 247 | function | `addProbe` |
| 248 | function | `flash` |
| 295 | function | `signalsFor` |
| 311 | const fn | `fold` |
| 313 | function | `fillSignals` |
| 320 | function | `renderChannels` |
| 341 | function | `requestMeasure` |
| 342 | function | `renderMeasure` |
| 354 | function | `MeasureUnit` |
| 357 | function | `simKey` |
| 358 | function | `perSeries` |
| 359 | function | `refFor` |
| 360 | const fn | `sched` |
| 364 | function | `metricsFor` |
| 368 | function | `metricsRows` |
| 373 | function | `eventMetricsHTML` |
| 375 | function | `renderMetricsPanel` |
| 386 | function | `rawSeries` |
| 389 | function | `autoF1` |
| 393 | function | `evRows` |
| 395 | function | `renderEvents` |
| 397 | const fn | `fv` |
| 403 | function | `evMaxSetting` |
| 404 | function | `eventsJson` |
| 405 | function | `eventsCsv` |
| 407 | function | `renderFFT` |
| 429 | function | `cellZ` |
| 431 | function | `renderEISForm` |
| 432 | const fn | `opt` |
| 436 | function | `runEIS` |
| 444 | function | `drawEIS` |
| 463 | function | `perSamples` |
| 465 | function | `periodText` |
| 466 | const fn | `svgPlot` |
| 468 | function | `pcmMapFn` |
| 470 | const fn | `z` |
| 473 | function | `renderPoincare` |
| 489 | function | `bfParams` |
| 491 | function | `renderBifurcationForm` |
| 497 | function | `runBifurcation` |
| 511 | function | `stopBifurcation` |
| 512 | function | `drawBifurcation` |
| 522 | function | `niceTop` |
| 525 | function | `btStatus` |
| 526 | function | `parseStep` |
| 527 | function | `runBatch` |
| 543 | function | `clearBatch` |
| 545 | function | `meanPL` |
| 547 | function | `ringTrace` |
| 549 | function | `compareHTML` |
| 559 | function | `renderBatch` |
| 564 | function | `parseCSV` |
| 566 | const fn | `cells` |
| 567 | const fn | `num` |
| 573 | const fn | `normName` |
| 574 | function | `renderCsvMap` |
| 575 | const fn | `auto` |
| 581 | function | `applyCsv` |
| 586 | function | `renderCsv` |
| 588 | function | `clearCsv` |
| 590 | function | `sampleCompareHTML` |
| 606 | function | `pwmGainsText` |
| 613 | function | `toggleInput` |
| 616 | function | `setInputMeta` |
| 620 | function | `inputsHTML` |
| 621 | const fn | `val` |
| 630 | function | `liveChange` |
| 632 | function | `renderLiveLog` |
| 641 | function | `changesToSchedule` |
| 643 | const fn | `f` |
| 652 | function | `updateLivePanel` |
| 657 | function | `setLivePanel` |
| 660 | function | `switchesOf` |
| 663 | function | `addPulses` |
| 665 | function | `pulseKeys` |
| 666 | function | `refreshControls` |
| 669 | const fn | `phase` |
| 703 | const fn | `setD` |
| 719 | const fn | `setPh` |
| 731 | const fn | `pinNow` |
| 742 | const fn | `pinSet` |
| 754 | function | `pinMap` |
| 755 | function | `pinX` |
| 756 | function | `pinV` |
| 762 | function | `liveParam` |
| 777 | function | `closeInspector` |
| 778 | function | `placePopup` |
| 781 | function | `fieldValue` |
| 786 | function | `fieldHTML` |
| 801 | function | `placeAt` |
| 802 | function | `popupDrag` |
| 811 | function | `nnBlock` |
| 812 | function | `nnBox` |
| 815 | function | `nnLearned` |
| 816 | function | `openInspector` |
| 824 | const fn | `wired` |
| 834 | const fn | `same` |
| 835 | const fn | `apply` |
| 850 | function | `ctlCtx` |
| 855 | function | `openCtlWin` |
| 859 | const fn | `wireWidth` |
| 860 | function | `openWireInspector` |
| 877 | const fn | `numOf` |
| 883 | function | `psec` |
| 885 | function | `propsOpen` |
| 886 | function | `setProps` |
| 888 | function | `focusComp` |
| 889 | function | `togglePin` |
| 892 | function | `renderProps` |
| 901 | function | `propsComp` |
| 902 | const fn | `secOf` |
| 904 | const fn | `exprV` |
| 905 | const fn | `inpB` |
| 906 | const fn | `row` |
| 912 | const fn | `wired` |
| 926 | function | `propsJunc` |
| 928 | function | `propsWire` |
| 934 | function | `propsMulti` |
| 937 | function | `propsCircuit` |
| 948 | const fn | `opt` |
| 958 | const fn | `sv` |
| 977 | const fn | `chk` |
| 988 | function | `bindProps` |
| 1024 | function | `diagItems` |
| 1033 | function | `renderDiag` |
| 1044 | function | `openDiag` |
| 1045 | function | `flashComp` |
| 1053 | function | `stepAdvice` |
| 1065 | function | `stepAdviceShow` |
| 1066 | function | `scheduleStepCheck` |
| 1067 | function | `runStepCheck` |
| 1068 | const fn | `inPage` |
| 1075 | function | `syncStepMode` |
| 1137 | function | `scenSetCode` |
| 1138 | function | `scenState` |
| 1139 | function | `scenTab` |
| 1140 | function | `scenOut` |
| 1141 | function | `scenWorker` |
| 1143 | function | `scenRun` |
| 1151 | function | `scenStop` |
| 1152 | function | `scenDone` |
| 1154 | function | `scenMsg` |
| 1169 | function | `scenBatch` |
| 1174 | function | `scenEval` |
| 1177 | function | `addonDock` |
| 1180 | function | `renderAddons` |
| 1181 | const fn | `vsel` |
| 1195 | function | `knockToast` |
| 1198 | function | `initAddons` |
| 1205 | function | `scenBatchWrite` |
| 1208 | function | `renderScenFiles` |
| 1211 | const fn | `scenNum` |
| 1212 | function | `scenTable` |
| 1213 | function | `scenShow` |
| 1226 | function | `scenTicks` |
| 1227 | function | `scenPlot` |
| 1231 | const fn | `thin` |
| 1238 | const fn | `dig` |
| 1249 | function | `initScenarios` |
| 1256 | function | `liveApply` |
| 1259 | function | `closeMenu` |
| 1260 | function | `openMenu` |
| 1281 | function | `updateHover` |
| 1299 | const fn | `atTop` |
| 1300 | function | `topDoc` |
| 1301 | function | `defsOf` |
| 1302 | const fn | `pid` |
| 1303 | function | `fullDoc` |
| 1305 | function | `commitView` |
| 1307 | function | `viewDiag` |
| 1308 | const fn | `rel` |
| 1311 | function | `compAt` |
| 1316 | function | `allComps` |
| 1317 | const fn | `walk` |
| 1323 | function | `partDef` |
| 1325 | function | `pdefaults` |
| 1326 | function | `subParams` |
| 1328 | function | `placeOk` |
| 1330 | function | `renameChannels` |
| 1332 | function | `levelDoc` |
| 1333 | function | `applyLevel` |
| 1334 | function | `groupSel` |
| 1339 | function | `expandSub` |
| 1343 | function | `libToSub` |
| 1345 | function | `uniqueSub` |
| 1346 | function | `subMenu` |
| 1350 | function | `enterSub` |
| 1356 | function | `leaveSub` |
| 1362 | function | `renderCrumbs` |
| 1370 | function | `curDef` |
| 1371 | function | `publicOf` |
| 1372 | function | `togglePublic` |
| 1380 | function | `propsSub` |
| 1388 | function | `bindSub` |
| 1396 | function | `propsDef` |
| 1411 | function | `bindDef` |
| 1427 | function | `exportDef` |
| 1429 | function | `importDefs` |
| 1440 | function | `palLoad` |
| 1441 | function | `palSave` |
| 1442 | function | `palRecent` |
| 1443 | function | `palItem` |
| 1447 | function | `renderPalette` |
| 1455 | const fn | `isOpen` |
| 1469 | function | `tutorial` |
| 1472 | function | `circuitSig` |
| 1482 | function | `tutorialRef` |
| 1483 | function | `theoryValidity` |
| 1489 | function | `staleBanner` |
| 1492 | function | `bindRestore` |
| 1493 | function | `loadTutorial` |
| 1498 | function | `migrateFile` |
| 1501 | function | `applyProject` |
| 1512 | function | `renderTutorial` |
| 1522 | function | `gallery` |
| 1528 | function | `api` |
| 1529 | function | `paramsOf` |
| 1532 | function | `avgOver` |
| 1535 | function | `simValue` |
| 1541 | function | `lastPP` |
| 1543 | function | `runTheory` |
| 1556 | function | `cmpRows` |
| 1557 | function | `stepsHTML` |
| 1558 | function | `renderTheory` |
| 1590 | function | `rippleDev` |
| 1592 | function | `periodAvgAt` |
| 1594 | function | `samplingTheory` |
| 1603 | const fn | `lastAt` |
| 1625 | function | `polyTheory` |
| 1632 | const fn | `frac` |
| 1661 | function | `lastPeriods` |
| 1662 | function | `evalOrderHTML` |
| 1671 | function | `genScTheory` |
| 1673 | const fn | `Iac` |
| 1681 | function | `shaftModes` |
| 1688 | function | `fbmTheory` |
| 1696 | function | `ieee9Theory` |
| 1704 | function | `schedNow` |
| 1706 | function | `fundOf` |
| 1712 | function | `ssscNet3` |
| 1713 | const fn | `c` |
| 1716 | const fn | `ser` |
| 1717 | const fn | `ln` |
| 1725 | function | `ssscTheory` |
| 1760 | function | `ccscTheory` |
| 1765 | const fn | `cm` |
| 1767 | const fn | `dev` |
| 1770 | const fn | `lineI` |
| 1791 | function | `ieee9ssscTheory` |
| 1806 | function | `hvdcTheory` |
| 1826 | function | `gfmTheory` |
| 1867 | function | `ieee9GfmTheory` |
| 1885 | function | `hvdcGfmTheory` |
| 1898 | function | `lccTheory` |
| 1899 | const fn | `st` |
| 1905 | const fn | `g` |
| 1917 | function | `wbModelHTML` |
| 1925 | function | `cableXbTheory` |
| 1926 | const fn | `rms` |
| 1927 | const fn | `pk` |
| 1939 | const fn | `v` |
| 1944 | function | `lineFdTheory` |
| 1945 | const fn | `lab` |
| 1953 | const fn | `pk` |
| 1960 | function | `trvAfterZero` |
| 1966 | function | `trvSvg` |
| 1968 | const fn | `path` |
| 1975 | function | `trvTerminalTheory` |
| 1988 | function | `trvSlfTheory` |
| 2008 | function | `lightningTheory` |
| 2010 | const fn | `pk` |
| 2028 | function | `netFaultTheory` |
| 2041 | function | `busDqTheory` |
| 2049 | function | `subLegsTheory` |
| 2061 | function | `currentCtlTheory` |
| 2068 | const fn | `R` |
| 2071 | const fn | `over` |
| 2081 | const fn | `row` |
| 2087 | function | `blocksTheory` |
| 2102 | function | `pcmTheory` |
| 2128 | function | `codeTheory` |
| 2138 | function | `eisTheory` |
| 2140 | const fn | `ser` |
| 2153 | function | `imSteady` |
| 2156 | function | `imPar` |
| 2157 | function | `phaseRms` |
| 2158 | function | `vfTheory` |
| 2171 | function | `focTheory` |
| 2188 | function | `synTheory` |
| 2207 | const fn | `need` |
| 2227 | function | `pmTheory` |
| 2229 | const fn | `mtpa` |
| 2245 | function | `srmTheory` |
| 2260 | const fn | `curve` |
| 2271 | function | `lgTheory` |
| 2282 | const fn | `cr` |
| 2289 | function | `chaosTheory` |
| 2304 | function | `nnCycles` |
| 2307 | function | `genCtlTheory` |
| 2320 | function | `evTheory` |
| 2334 | function | `nnTheory` |
| 2351 | function | `nnGuiCode` |
| 2357 | function | `runNNCompare` |
| 2365 | function | `dcDriveTheory` |
| 2366 | const fn | `per` |
| 2367 | const fn | `cross` |
| 2397 | function | `twModel` |
| 2400 | const fn | `g` |
| 2403 | function | `twLattice` |
| 2410 | const fn | `marks` |
| 2413 | function | `twTheory` |
| 2421 | const fn | `at` |
| 2438 | function | `arTheory` |
| 2458 | function | `impulseMeasure` |
| 2460 | const fn | `cross` |
| 2463 | function | `marxTheory` |
| 2481 | function | `chopModel` |
| 2484 | const fn | `f` |
| 2487 | function | `chopTheory` |
| 2501 | function | `cmp3` |
| 2505 | function | `hvExact` |
| 2506 | function | `hv153Theory` |
| 2532 | function | `besI1e` |
| 2534 | function | `heaviside` |
| 2536 | function | `lossTheory` |
| 2555 | function | `vtBreak` |
| 2556 | function | `vtTheory` |
| 2576 | function | `hvdivTheory` |
| 2578 | const fn | `r` |
| 2590 | function | `scheringTheory` |
| 2591 | const fn | `inv` |
| 2600 | const fn | `sr` |
| 2612 | const fn | `studyNet` |
| 2613 | function | `studyQ` |
| 2615 | const fn | `studyKey` |
| 2616 | function | `studyOpen` |
| 2626 | function | `studyAct` |
| 2641 | function | `netViewOpen` |
| 2645 | const fn | `legend` |
| 2660 | function | `nvEdit` |
| 2669 | function | `nvApply` |
| 2670 | const fn | `same` |
| 2671 | const fn | `put` |
| 2685 | function | `mtdcTheory` |
| 2688 | function | `studyTheory` |
| 2706 | const fn | `X` |
| 2777 | function | `formulaTheory` |
| 2886 | function | `nodeAvg` |
| 2892 | function | `circuitForMath` |
| 2928 | function | `scheduleMath` |
| 2929 | function | `batteryKey` |
| 2931 | function | `mathChoices` |
| 2932 | const fn | `prim` |
| 2934 | function | `renderMathChoices` |
| 2936 | function | `runTemplate` |
| 2942 | function | `runMath` |
| 2964 | function | `saveLocal` |
| 2965 | function | `saveLocalSoon` |
| 2967 | function | `download` |
| 2968 | function | `exportCSV` |
| 2974 | function | `syncScopeInputs` |
| 2975 | function | `setSpeed` |
| 2978 | function | `openSettings` |
| 2979 | const fn | `sel` |
| 2980 | const fn | `chk` |
| 3006 | function | `applyLook` |
| 3010 | function | `boot` |
| 3081 | const fn | `mv` |
| 3082 | const fn | `up` |
| 3083 | const fn | `navOpen` |
| 3099 | const fn | `probeSel` |
| 3161 | function | `renderTheoryLive` |

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
| 357 | method | `noteHTML` |
| 362 | method | `lblMeasure` |
| 369 | method | `lvChars` |
| 375 | method | `renderLabels` |
| 381 | const fn | `r1` |
| 382 | const fn | `line` |
| 394 | method | `relabelSoon` |
| 395 | method | `renderWires` |
| 414 | method | `wireSVG` |
| 426 | method | `redrawWire` |
| 427 | method | `pathD` |
| 432 | method | `segDir` |
| 433 | method | `midLabel` |
| 434 | method | `renderPins` |
| 444 | method | `renderSel` |
| 448 | method | `setLive` |
| 450 | method | `updateLive` |
| 462 | method | `drawArrows` |
| 473 | method | `world` |
| 475 | method | `hitAt` |
| 476 | method | `hitOf` |
| 478 | method | `down` |
| 504 | method | `move` |
| 517 | method | `up` |
| 531 | method | `cancelDrag` |
| 532 | method | `hoverPin` |
| 534 | method | `dbl` |
| 535 | method | `menu` |
| 538 | method | `worldNow` |
| 539 | method | `wheel` |
| 546 | method | `letter` |
| 547 | method | `key` |
| 572 | method | `beginDrag` |
| 583 | method | `dragMove` |
| 595 | method | `endDrag` |
| 605 | method | `bakeMove` |
| 610 | method | `dragSeg` |
| 613 | const fn | `stub` |
| 622 | method | `drawMarquee` |
| 625 | method | `marqueeSelect` |
| 628 | const fn | `inside` |
| 635 | method | `escape` |
| 638 | method | `beginPlace` |
| 639 | method | `ghost` |
| 642 | method | `finishPlace` |
| 643 | method | `cancelPlace` |
| 645 | method | `startWire` |
| 646 | method | `startWireFrom` |
| 647 | method | `previewWire` |
| 656 | method | `wireClick` |
| 662 | method | `orthoNext` |
| 663 | method | `finishWire` |
| 679 | method | `cancelWire` |
| 681 | method | `splitWire` |
| 691 | method | `wireNetPin` |
| 693 | method | `canScroll` |

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
| 64 | function | `wmW` |
| 69 | function | `wmInc` |
| 86 | const fn | `cmul` |
| 88 | function | `symc` |
| 91 | function | `wmOut` |
| 95 | const fn | `ph` |
| 108 | const fn | `numList` |
| 120 | function | `b64of` |
| 122 | function | `fromB64` |
| 125 | function | `snapEncode` |
| 126 | const fn | `num` |
| 127 | function | `enc` |
| 137 | function | `snapRestore` |
| 138 | function | `dec` |
| 149 | function | `smPort` |
| 153 | function | `smOut` |
| 157 | const fn | `genCopy` |
| 164 | function | `csolveSp` |
| 182 | function | `csolve` |
| 200 | function | `acInit` |
| 216 | const fn | `y` |
| 265 | const fn | `seq` |
| 314 | class | `NetlistError` |
| 319 | function | `dePiece` |
| 321 | const fn | `F` |
| 322 | function | `deInt` |
| 324 | function | `deFrac` |
| 330 | function | `tlSteady` |
| 332 | const fn | `at` |
| 334 | const fn | `re` |
| 345 | function | `poleG` |
| 346 | function | `tlmModeY` |
| 351 | const fn | `mm` |
| 358 | function | `tlmAcY` |
| 364 | function | `tlmSteady` |
| 365 | const fn | `vm` |
| 379 | function | `tlElement` |
| 386 | function | `tlmElement` |
| 407 | function | `rcCoefC` |
| 409 | const fn | `mul` |
| 414 | function | `wbSet` |
| 419 | function | `wbCo` |
| 423 | function | `wbPoleG` |
| 426 | function | `wbSum` |
| 428 | function | `tlwElement` |
| 447 | function | `tlwAcY` |
| 462 | function | `tlwSteady` |
| 463 | const fn | `mv` |
| 470 | const fn | `st` |
| 480 | function | `piLine` |
| 485 | const fn | `shunt` |
| 493 | function | `rcCoef` |
| 499 | function | `fdCo` |
| 509 | function | `arcF` |
| 515 | function | `arcStep` |
| 522 | function | `arcCur` |
| 527 | function | `nlLimit` |
| 528 | function | `nlSolve` |
| 535 | function | `saiSetup` |
| 536 | const fn | `Lc` |
| 540 | function | `saiCur` |
| 548 | function | `saiCommit` |
| 558 | function | `chbCoef` |
| 563 | function | `chbCommit` |
| 570 | function | `chbStates` |
| 572 | function | `chbCount` |
| 581 | function | `mmcSample` |
| 591 | const fn | `full` |
| 600 | function | `mmcSave` |
| 601 | function | `mmcLoad` |
| 608 | function | `lccCom` |
| 611 | function | `lccMeasInit` |
| 617 | function | `lccMeasure` |
| 634 | function | `lccPlo` |
| 639 | function | `lccU` |
| 641 | function | `lccIn` |
| 644 | function | `lccSetup` |
| 647 | function | `lccEdge` |
| 649 | function | `lccGate` |
| 654 | function | `nlcStep` |
| 657 | const fn | `full` |
| 674 | function | `footLink` |
| 682 | function | `arcStart` |
| 683 | const fn | `r` |
| 686 | function | `buildNetlist` |
| 699 | const fn | `union` |
| 714 | const fn | `nm` |
| 733 | const fn | `sn` |
| 737 | const fn | `isJ` |
| 760 | const fn | `lbl` |
| 765 | const fn | `node` |
| 769 | const fn | `nodeKey` |
| 770 | const fn | `tunePwm` |
| 780 | const fn | `internal` |
| 783 | const fn | `mkBlock` |
| 790 | const fn | `add` |
| 791 | const fn | `series` |
| 1076 | function | `compileSignals` |
| 1109 | function | `f2Phi` |
| 1114 | function | `cmpF` |
| 1118 | function | `stampM` |
| 1120 | function | `luFactor` |
| 1126 | function | `luSolve` |
| 1133 | class | `Sim` |
| 1134 | method | `constructor` |
| 1137 | method | `basePeriod` |
| 1141 | method | `tlMaxStep` |
| 1142 | method | `setStep` |
| 1145 | method | `stIndex` |
| 1160 | method | `stVec` |
| 1161 | method | `stepCfg` |
| 1162 | method | `varSetup` |
| 1168 | method | `setStepMode` |
| 1170 | method | `hGrid` |
| 1174 | method | `modeCap` |
| 1178 | method | `swEls` |
| 1179 | method | `topoKey` |
| 1180 | method | `topoInfo` |
| 1190 | method | `topoCheck` |
| 1207 | method | `lteReset` |
| 1208 | method | `ltePush` |
| 1212 | method | `lteErr` |
| 1222 | method | `varCheck` |
| 1238 | method | `note` |
| 1241 | method | `stepCheck` |
| 1245 | method | `stepInfo` |
| 1248 | method | `diagnostics` |
| 1251 | method | `ringCheck` |
| 1260 | method | `stateMap` |
| 1262 | method | `stateMap0` |
| 1273 | method | `load` |
| 1328 | method | `reset` |
| 1331 | method | `imStep` |
| 1338 | method | `smStep` |
| 1340 | method | `srmStep` |
| 1341 | method | `srmOutputs` |
| 1342 | method | `smOutputs` |
| 1346 | method | `genStep` |
| 1353 | method | `genOutputs` |
| 1358 | method | `genTm` |
| 1359 | method | `genEfd` |
| 1360 | method | `imSources` |
| 1361 | method | `pyBlocks` |
| 1371 | method | `pyLazy` |
| 1373 | method | `pyUpgrade` |
| 1375 | method | `setMethod` |
| 1376 | method | `setControl` |
| 1378 | method | `setBlock` |
| 1380 | method | `setHold` |
| 1382 | method | `markChange` |
| 1387 | method | `progInit` |
| 1388 | method | `addProgram` |
| 1390 | method | `progNext` |
| 1391 | method | `progDue` |
| 1392 | method | `progApply` |
| 1407 | method | `evInit` |
| 1408 | method | `logEv` |
| 1410 | method | `events` |
| 1412 | method | `evSwitches` |
| 1414 | method | `channelKeys` |
| 1433 | method | `allocRecord` |
| 1443 | const fn | `A` |
| 1451 | method | `V` |
| 1452 | method | `elCurrent` |
| 1456 | method | `portI` |
| 1460 | method | `computeVals` |
| 1494 | method | `setRecord` |
| 1495 | method | `recordNow` |
| 1505 | method | `closePeriod` |
| 1516 | method | `lastPeriod` |
| 1517 | method | `now` |
| 1522 | method | `gateOf` |
| 1528 | method | `rawGate` |
| 1539 | method | `carrier` |
| 1542 | method | `shGrid` |
| 1545 | method | `wmCyc` |
| 1546 | method | `shNext` |
| 1548 | method | `sampleHolds` |
| 1553 | method | `samples` |
| 1554 | method | `ctrlEdges` |
| 1560 | method | `scrU` |
| 1561 | method | `scrGate` |
| 1562 | method | `scrEdges` |
| 1563 | method | `setFiring` |
| 1564 | method | `compV` |
| 1565 | method | `compI` |
| 1567 | method | `dbl` |
| 1568 | method | `sampleControllers` |
| 1602 | method | `evalBlocks` |
| 1782 | method | `blkCopy` |
| 1785 | method | `blkAnyDue` |
| 1788 | method | `blkDue` |
| 1790 | method | `zcFrac` |
| 1793 | method | `saveState` |
| 1795 | method | `restoreState` |
| 1804 | method | `snapshot` |
| 1806 | method | `restoreSnapshot` |
| 1808 | method | `gateSigPeek` |
| 1811 | method | `gateSig` |
| 1816 | method | `jumpScheds` |
| 1823 | method | `jumpAt` |
| 1824 | method | `values` |
| 1854 | method | `assemble` |
| 1871 | const fn | `g` |
| 1896 | method | `rhs` |
| 1898 | const fn | `J` |
| 1917 | method | `cplLinearize` |
| 1925 | method | `solverInfo` |
| 1940 | method | `factor` |
| 1953 | method | `spAssemble` |
| 1960 | method | `solveOnce` |
| 1974 | method | `solve` |
| 1992 | method | `nlLinearize` |
| 1995 | method | `check` |
| 2011 | method | `commit` |
| 2036 | method | `initialSolve` |
| 2048 | method | `tlSources` |
| 2052 | method | `tlRecord` |
| 2058 | method | `tlHist` |
| 2064 | method | `tlmG` |
| 2068 | method | `tlmSources` |
| 2082 | method | `tlmRecord` |
| 2097 | method | `tlwG` |
| 2103 | method | `tlwSources` |
| 2118 | method | `tlwRecord` |
| 2135 | method | `tlmHist` |
| 2142 | method | `step` |
| 2144 | const fn | `gs` |
| 2150 | method | `stepCore` |
| 2209 | method | `edgeSolve` |
| 2212 | method | `edgePoint` |
| 2213 | method | `mmcMoved` |
| 2216 | method | `arcGate` |
| 2224 | method | `trRestart` |
| 2232 | method | `nextEvent` |
| 2238 | const fn | `sch` |
| 2262 | method | `spwmCut` |
| 2265 | const fn | `sig` |
| 2270 | method | `run` |
| 2316 | function | `tuneInfo` |
| 2319 | function | `exportForBatch` |
| 2342 | const fn | `hist` |
| 2357 | const fn | `ci` |
| 2358 | const fn | `vd` |
| 2359 | const fn | `V` |
| 2362 | const fn | `linePort` |
| 2364 | const fn | `I` |
| 2365 | const fn | `portRec` |
| 2366 | const fn | `rec` |
| 2383 | const fn | `clkOf` |
| 2409 | function | `sweepPoint` |
| 2414 | function | `setPath` |
| 2420 | function | `eisPoint` |
| 2428 | function | `resume` |

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
| 100 | const fn | `MWIN` |
| 109 | const fn | `mwinF` |
| 116 | function | `subLayout` |
| 118 | const fn | `len` |
| 124 | function | `subDraw` |
| 1199 | function | `noteBox` |
| 1202 | function | `defaults` |
| 1204 | function | `elPins` |
| 1205 | function | `sigPins` |
| 1206 | function | `pinsOf` |
| 1209 | function | `parseMat` |
| 1211 | function | `nPorts` |
| 1212 | function | `portY` |
| 1213 | function | `portPins` |
| 1214 | function | `portBox` |
| 1216 | function | `posDef` |
| 1218 | function | `symmetric` |
| 1219 | function | `matInv` |
| 1224 | function | `klMatrix` |
| 1235 | function | `kgMatrix` |
| 1243 | function | `srmGeo` |
| 1245 | function | `srmSpins` |
| 1247 | function | `srmPins` |
| 1249 | function | `satD` |
| 1250 | function | `satDinv` |
| 1252 | function | `genSpins` |
| 1263 | function | `genTsc` |
| 1268 | function | `genCirc2` |
| 1269 | const fn | `Fn` |
| 1277 | function | `genAxis` |
| 1285 | const fn | `classic` |
| 1291 | const fn | `plist` |
| 1295 | function | `genModel` |
| 1301 | const fn | `w` |
| 1310 | const fn | `grp` |
| 1327 | function | `genGamma` |
| 1335 | function | `genDQ` |
| 1339 | function | `genSteady` |
| 1341 | const fn | `rot` |
| 1348 | function | `srmAlignedPsi` |
| 1349 | function | `srmModelPsi` |
| 1350 | function | `srmTableText` |
| 1353 | function | `srmMag` |
| 1369 | function | `chkMag` |
| 1371 | function | `srmA` |
| 1374 | function | `seg` |
| 1375 | function | `srmPsi` |
| 1377 | function | `srmCur` |
| 1379 | function | `srmTorque` |
| 1382 | function | `srmCoenergy` |
| 1386 | function | `waveShape` |
| 1387 | function | `waveAt` |
| 1390 | function | `waveMeasure` |
| 1393 | const fn | `cross` |
| 1399 | function | `waveFit` |
| 1400 | const fn | `res` |
| 1411 | function | `directWave` |
| 1414 | function | `impulseWave` |
| 1425 | function | `bewley` |
| 1428 | const fn | `at` |
| 1434 | function | `movChar` |
| 1439 | const fn | `pick` |
| 1440 | const fn | `cur` |
| 1441 | const fn | `inv` |
| 1445 | function | `impulseDesign` |
| 1450 | function | `impulseRoots` |
| 1453 | function | `tlParams` |
| 1462 | function | `tlmData` |
| 1464 | function | `tlmM` |
| 1471 | function | `tlmPin` |
| 1472 | function | `tlmPins` |
| 1474 | function | `tlmKey` |
| 1485 | function | `tlmModel` |
| 1493 | function | `lightningWave` |
| 1500 | function | `pinKind` |
| 1511 | function | `structural` |
| 1518 | function | `pinWidth` |
| 1521 | function | `xf` |
| 1522 | function | `pinPos` |
| 1524 | function | `pinDir` |
| 1529 | function | `cpeParams` |
| 1530 | function | `cpeBank` |
| 1534 | function | `cpeZ` |
| 1535 | function | `cpeZbank` |
| 1536 | function | `boxOf` |
| 1537 | function | `bbox` |
| 1542 | function | `fmtNum` |
| 1546 | function | `eng` |
| 1550 | function | `parseEng` |
| 1553 | function | `parseSched` |
| 1561 | function | `machines` |

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
| 174 | method | `build` |
| 196 | method | `build` |
| 197 | const fn | `dev` |
| 217 | method | `build` |
| 228 | const fn | `bus` |
| 256 | function | `samplingPhase` |
| 268 | method | `build` |
| 287 | function | `rippleDev` |
| 290 | function | `polyDesign` |
| 292 | function | `polyCancel` |
| 304 | method | `build` |
| 330 | function | `ccDesign` |
| 338 | method | `build` |
| 388 | method | `build` |
| 415 | method | `build` |
| 440 | method | `build` |
| 467 | function | `invIM` |
| 482 | method | `build` |
| 496 | method | `build` |
| 523 | const fn | `r4` |
| 527 | function | `smFoc` |
| 553 | method | `build` |
| 577 | method | `build` |
| 593 | method | `build` |
| 623 | method | `build` |
| 639 | method | `build` |
| 660 | method | `build` |
| 676 | method | `build` |
| 687 | function | `marxCircuit` |
| 706 | method | `build` |
| 738 | method | `build` |
| 745 | const fn | `down` |
| 762 | method | `build` |
| 779 | method | `build` |
| 792 | method | `build` |
| 809 | method | `build` |
| 826 | method | `build` |
| 846 | method | `build` |
| 861 | method | `build` |
| 907 | function | `nnSched` |
| 908 | function | `nnDrive` |
| 971 | method | `build` |
| 978 | method | `build` |
| 984 | function | `aiBlock` |
| 1003 | method | `build` |
| 1014 | function | `evDrive` |
| 1021 | const fn | `IN` |
| 1060 | const fn | `fix` |
| 1091 | method | `build` |
| 1096 | method | `build` |
| 1105 | method | `build` |
| 1115 | const fn | `y` |
| 1138 | method | `build` |
| 1139 | const fn | `ws` |
| 1178 | method | `build` |
| 1196 | method | `build` |
| 1204 | function | `fbmPoint` |
| 1211 | method | `build` |
| 1230 | function | `smibPoint` |
| 1231 | function | `genCtl` |
| 1233 | const fn | `L` |
| 1261 | method | `build` |
| 1271 | function | `ieee9Build` |
| 1273 | const fn | `GD` |
| 1274 | const fn | `L` |
| 1276 | const fn | `G` |
| 1277 | const fn | `Ld` |
| 1310 | method | `build` |
| 1318 | function | `bigGrid` |
| 1319 | const fn | `B` |
| 1321 | const fn | `w` |
| 1341 | method | `build` |
| 1362 | method | `build` |
| 1374 | method | `build` |
| 1389 | method | `build` |
| 1408 | method | `build` |
| 1427 | method | `build` |
| 1445 | method | `build` |
| 1463 | method | `build` |
| 1479 | const fn | `LM` |
| 1482 | function | `tlmPart` |
| 1496 | method | `build` |
| 1515 | method | `build` |
| 1535 | function | `tlmGW` |
| 1539 | const fn | `note` |
| 1551 | method | `build` |
| 1569 | const fn | `tl` |
| 1597 | const fn | `PANE` |
| 1608 | method | `build` |
| 1610 | const fn | `rig` |
| 1629 | method | `build` |
| 1631 | const fn | `rig` |
| 1651 | function | `xbRig` |
| 1653 | const fn | `bond` |
| 1680 | method | `build` |
| 1715 | function | `ssscChannels` |
| 1724 | method | `build` |
| 1744 | method | `build` |
| 1746 | const fn | `ln` |
| 1780 | method | `build` |
| 1782 | const fn | `sw` |
| 1809 | method | `build` |
| 1813 | const fn | `station` |
| 1864 | method | `build` |
| 1893 | method | `build` |
| 1897 | const fn | `station` |
| 1944 | method | `build` |
| 1981 | const fn | `gfmWire` |
| 1985 | const fn | `busMeter` |
| 1998 | method | `build` |
| 2000 | const fn | `unit` |
| 2023 | method | `build` |
| 2054 | method | `build` |
| 2087 | method | `build` |
| 2114 | method | `build` |
| 2119 | function | `dcdcInputs` |

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
| 113 | function | `expect` |
| 127 | function | `infer` |
| 132 | const fn | `kind` |
| 133 | const fn | `lab` |
| 137 | const fn | `same` |
| 155 | const fn | `out` |
| 159 | class | `UnitError` |
| 160 | function | `check` |

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
| 180 | function | `_wm_w` |
| 200 | function | `_wm_inc` |
| 230 | function | `_symc` |
| 236 | function | `_wm_out` |
| 273 | function | `_f` |
| 288 | function | `conv_step` |
| 306 | function | `conv_start` |
| 316 | class | `Ctrl` |
| 320 | method | `Ctrl.__init__` |
| 349 | method | `Ctrl.dbl` |
| 352 | method | `Ctrl.raw` |
| 372 | method | `Ctrl.gate` |
| 384 | method | `Ctrl.carrier_at` |
| 395 | method | `Ctrl.edges` |
| 415 | function | `_lut` |
| 426 | function | `eval_ast` |
| 455 | function | `_nn_fwd` |
| 471 | function | `_nn_learn` |
| 514 | function | `_nn_jac` |
| 533 | function | `_nn_step` |
| 561 | function | `lcc_com` |
| 569 | function | `lcc_measure` |
| 625 | function | `nlc_step` |
| 676 | function | `make_python_block` |
| 707 | class | `Circuit` |
| 708 | method | `Circuit.__init__` |
| 944 | method | `Circuit.R` |
| 947 | method | `Circuit.im_e` |
| 956 | method | `Circuit.im_deriv` |
| 969 | method | `Circuit.sm_cur` |
| 981 | method | `Circuit.sm_ports` |
| 986 | method | `Circuit.sm_deriv` |
| 1001 | method | `Circuit.srm_A` |
| 1006 | method | `Circuit._seg` |
| 1010 | method | `Circuit.srm_cur` |
| 1017 | method | `Circuit.srm_torque` |
| 1026 | method | `Circuit.srm_currents` |
| 1031 | method | `Circuit.srm_deriv` |
| 1044 | method | `Circuit.gen_cur` |
| 1061 | method | `Circuit.gen_efd` |
| 1068 | method | `Circuit.gen_tm` |
| 1075 | method | `Circuit.gen_deriv` |
| 1093 | method | `Circuit.jac_gen` |
| 1145 | method | `Circuit.gen_out` |
| 1165 | method | `Circuit.Vsrc` |
| 1181 | method | `Circuit.topo` |
| 1191 | method | `Circuit.build` |
| 1298 | method | `Circuit.bsrc` |
| 1348 | method | `Circuit.solve_z` |
| 1392 | method | `Circuit.arc_g` |
| 1397 | method | `Circuit.solve_nl` |
| 1439 | method | `Circuit.tl_hist` |
| 1456 | method | `Circuit.tl_sec` |
| 1463 | method | `Circuit.tl_ih` |
| 1467 | method | `Circuit.tl_record` |
| 1488 | method | `Circuit.tlm_setup` |
| 1583 | method | `Circuit.tlw_setup` |
| 1661 | method | `Circuit.tlw_ix` |
| 1675 | method | `Circuit.tlw_end` |
| 1685 | method | `Circuit.tlm_hist` |
| 1710 | method | `Circuit.tlm_ih` |
| 1723 | method | `Circuit.tlm_force` |
| 1749 | method | `Circuit.tlm_modal` |
| 1768 | method | `Circuit.tlm_record` |
| 1797 | method | `Circuit.scr_u` |
| 1801 | method | `Circuit.scr_gate` |
| 1805 | method | `Circuit.scr_edges` |
| 1812 | method | `Circuit.gate_state` |
| 1825 | method | `Circuit.set_gates` |
| 1833 | method | `Circuit.arc_gates` |
| 1853 | method | `Circuit.may_turn_on` |
| 1857 | method | `Circuit.tolerances` |
| 1863 | method | `Circuit.consistent` |
| 1905 | method | `Circuit.value` |
| 1943 | method | `Circuit.current` |
| 1997 | method | `Circuit.prime` |
| 2007 | method | `Circuit.sig_in` |
| 2011 | method | `Circuit.sh_grid` |
| 2025 | method | `Circuit.sh_next` |
| 2032 | method | `Circuit.log_ev` |
| 2038 | method | `Circuit.ev_switches` |
| 2047 | method | `Circuit.sh_sample` |
| 2067 | method | `Circuit.sample` |
| 2142 | method | `Circuit.cmp_f` |
| 2148 | method | `Circuit.blk_due` |
| 2159 | method | `Circuit.eval_blocks` |
| 2732 | method | `Circuit.block_events` |
| 2761 | method | `Circuit.next_event` |
| 2828 | function | `_decimate` |
| 2845 | function | `_diagnose` |
| 2896 | function | `simulate` |
| 3188 | function | `batch_sim` |

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

### `pcl/dcgrid.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 41 | class | `DCGridError` |
| 45 | class | `DCGrid` |
| 48 | method | `DCGrid.__init__` |
| 54 | method | `DCGrid.bus` |
| 61 | method | `DCGrid._bus` |
| 67 | method | `DCGrid.line` |
| 85 | method | `DCGrid.converter` |
| 106 | method | `DCGrid.remove` |
| 115 | method | `DCGrid.conductance` |
| 129 | method | `DCGrid._parts` |
| 147 | method | `DCGrid.flow` |
| 256 | function | `sensitivity` |
| 281 | function | `station` |
| 298 | function | `station_inverse` |
| 318 | function | `grid_of` |
| 337 | function | `_st` |
| 344 | function | `acdc_flow` |

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
| 38 | class | `ViewError` |
| 43 | function | `_graph` |
| 51 | function | `_components` |
| 59 | function | `_hops` |
| 67 | function | `_tree` |
| 112 | function | `_classical` |
| 128 | function | `_stress` |
| 153 | function | `_stress_sparse` |
| 180 | function | `_spread` |
| 204 | function | `_island` |
| 241 | function | `layout` |
| 258 | function | `_layout` |
| 288 | function | `view` |
| 334 | function | `_scale` |
| 345 | function | `_num` |
| 353 | function | `values` |
| 609 | function | `_maybe_int` |
| 619 | function | `pack` |
| 642 | function | `_esc` |
| 646 | function | `_segments` |
| 662 | function | `_col` |
| 667 | function | `svg` |
| 742 | function | `dxf` |

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
| 269 | method | `Network.dc_bus` |
| 278 | method | `Network._dc` |
| 284 | method | `Network.dc_line` |
| 297 | method | `Network.vsc` |
| 318 | method | `Network.dc_grid` |
| 323 | method | `Network.acdc_flow` |
| 332 | method | `Network.remove` |
| 335 | method | `Network.element` |
| 342 | method | `Network._zb` |
| 346 | method | `Network._ib` |
| 350 | method | `Network._sc_parts` |
| 485 | method | `Network._t3` |
| 520 | method | `Network.impedances` |
| 528 | method | `Network._index` |
| 532 | method | `Network._ybus` |
| 556 | method | `Network._ratios` |
| 591 | method | `Network.short_circuit` |
| 675 | method | `Network._breaking` |
| 707 | method | `Network.iec60909` |
| 712 | method | `Network._lf_model` |
| 827 | method | `Network._sssc_x` |
| 834 | method | `Network.load_flow` |
| 845 | method | `Network._lf_sssc` |
| 874 | method | `Network._lf` |
| 905 | method | `Network._lf_result` |
| 929 | method | `Network._flows` |
| 954 | method | `Network.case` |
| 964 | method | `Network.advice` |
| 973 | method | `Network.power_flow` |
| 995 | method | `Network.dc_flow` |
| 1003 | method | `Network.ptdf` |
| 1009 | method | `Network.lodf` |
| 1016 | method | `Network.contingency` |
| 1094 | method | `Network.batch_flow` |
| 1134 | method | `Network.report` |
| 1140 | method | `Network.scopf` |
| 1146 | method | `Network.cpf` |
| 1153 | method | `Network.estimate` |
| 1160 | method | `Network.harmonics` |
| 1167 | method | `Network.opf` |
| 1189 | method | `Network.to_emt` |
| 1269 | function | `_coo` |
| 1275 | function | `_zip` |
| 1280 | function | `_solve` |
| 1291 | function | `_nr` |
| 1327 | function | `sssc_placement` |
| 1384 | function | `superposition` |
| 1408 | function | `trv` |
| 1442 | function | `_matrix` |
| 1454 | function | `read_matpower` |
| 1491 | function | `ieee` |
| 1501 | function | `case_data` |
| 1512 | function | `case_solution` |
| 1521 | function | `ieee9` |
| 1548 | function | `ieee14` |
| 1561 | function | `to_dict` |
| 1577 | function | `from_dict` |
| 1599 | function | `save` |
| 1603 | function | `load` |

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
| 429 | function | `_acdc` |
| 462 | function | `network_report` |
| 632 | function | `_security` |
| 667 | function | `_cpf` |
| 726 | function | `_se` |
| 814 | function | `_harmonic` |
| 874 | function | `_unbalanced` |
| 951 | function | `_branches` |

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
| 40 | class | `StudyError` |
| 44 | function | `_clean` |
| 63 | function | `_base_network` |
| 84 | function | `_networks_of` |
| 95 | function | `network_of` |
| 100 | function | `open_file` |
| 117 | function | `_feeder_text` |
| 135 | function | `save_file` |
| 156 | function | `_picture` |
| 163 | function | `_study` |
| 212 | function | `summary` |
| 292 | function | `_feeder` |
| 316 | function | `_feeder_summary` |
| 334 | function | `_feeder_run` |
| 354 | function | `run` |
| 382 | function | `view` |
| 412 | function | `_stem` |
| 418 | function | `report` |

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

### `pcl/unbalanced.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 34 | class | `FeederError` |
| 38 | function | `_phases` |
| 45 | class | `Feeder` |
| 49 | method | `Feeder.__init__` |
| 55 | method | `Feeder.bus` |
| 59 | method | `Feeder._bus` |
| 64 | method | `Feeder.set_source` |
| 68 | method | `Feeder.config` |
| 79 | method | `Feeder.line` |
| 84 | method | `Feeder.switch` |
| 87 | method | `Feeder.transformer` |
| 91 | method | `Feeder.regulator` |
| 100 | method | `Feeder.load` |
| 108 | method | `Feeder.distributed` |
| 115 | method | `Feeder.capacitor` |
| 120 | method | `Feeder.to_dict` |
| 127 | method | `Feeder.from_dict` |
| 155 | method | `Feeder.run` |
| 158 | method | `Feeder.report` |
| 168 | function | `case_data` |
| 177 | function | `case_solution` |
| 183 | class | `_Net` |
| 186 | method | `_Net.__init__` |
| 287 | method | `_Net.load_currents` |
| 306 | method | `_Net.solve` |
| 334 | method | `_Net.flows` |
| 339 | function | `_relay` |
| 350 | function | `as_network` |
| 388 | function | `against` |
| 405 | function | `sequence` |
| 411 | function | `run` |

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
