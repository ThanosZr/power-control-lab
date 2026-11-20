# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 116 |
| `web/studio/app.js` | 3433 |
| `web/studio/bus.js` | 197 |
| `web/studio/ctlwin.js` | 78 |
| `web/studio/editor.js` | 742 |
| `web/studio/expr.js` | 73 |
| `web/studio/inputs.js` | 62 |
| `web/studio/inside.js` | 143 |
| `web/studio/kernels.js` | 30 |
| `web/studio/lblplace.js` | 162 |
| `web/studio/library.js` | 57 |
| `web/studio/linedata.js` | 666 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 92 |
| `web/studio/live_worker.js` | 88 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 2727 |
| `web/studio/netlib.js` | 1563 |
| `web/studio/netview.js` | 227 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 1766 |
| `web/studio/plotcore.js` | 150 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 87 |
| `web/studio/recview.js` | 84 |
| `web/studio/scenario.js` | 188 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 339 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 165 |
| `web/studio/split.js` | 305 |
| `web/studio/split_worker.js` | 26 |
| `web/studio/splitwin.js` | 45 |
| `web/studio/stepcheck.js` | 315 |
| `web/studio/study.js` | 114 |
| `web/studio/study_worker.js` | 40 |
| `web/studio/subcircuit.js` | 293 |
| `web/studio/templates.js` | 32 |
| `web/studio/trv.js` | 56 |
| `web/studio/tune.js` | 237 |
| `web/studio/tutorials.js` | 2503 |
| `web/studio/units.js` | 164 |
| `web/studio/watch.js` | 339 |
| `web/studio/winframe.js` | 63 |
| `pcl/runner.js` | 27 |
| `run.py` | 361 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 3476 |
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
| `engine/studyfolder.py` | 892 |
| `engine/templates.py` | 317 |
| `engine/workbench.py` | 129 |
| `pcl/__init__.py` | 14 |
| `pcl/__main__.py` | 413 |
| `pcl/accel.py` | 202 |
| `pcl/backend.py` | 270 |
| `pcl/control.py` | 953 |
| `pcl/core.py` | 1451 |
| `pcl/cpf.py` | 561 |
| `pcl/dcgrid.py` | 980 |
| `pcl/designer.py` | 791 |
| `pcl/formats.py` | 222 |
| `pcl/geo.py` | 360 |
| `pcl/gui.py` | 409 |
| `pcl/harmonic.py` | 361 |
| `pcl/impulse.py` | 858 |
| `pcl/insulation.py` | 336 |
| `pcl/ipm.py` | 220 |
| `pcl/lineconst.py` | 2411 |
| `pcl/linereport.py` | 836 |
| `pcl/link.py` | 150 |
| `pcl/netfile.py` | 490 |
| `pcl/netview.py` | 1084 |
| `pcl/network.py` | 1680 |
| `pcl/nnstart.py` | 388 |
| `pcl/onnxio.py` | 355 |
| `pcl/opf.py` | 515 |
| `pcl/plotting.py` | 340 |
| `pcl/powerflow.py` | 1203 |
| `pcl/psse.py` | 433 |
| `pcl/report.py` | 1034 |
| `pcl/results.py` | 88 |
| `pcl/rms.py` | 704 |
| `pcl/scopf.py` | 213 |
| `pcl/se.py` | 788 |
| `pcl/study.py` | 670 |
| `pcl/surge.py` | 184 |
| `pcl/trv.py` | 433 |
| `pcl/unbalanced.py` | 525 |
| `pcl/wideband.py` | 1279 |
| `pcl/workbench.py` | 485 |
| `tests/test_acdc_opf.py` | 111 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 343 |
| `tests/test_arc.py` | 189 |
| `tests/test_b4.py` | 300 |
| `tests/test_backend.py` | 238 |
| `tests/test_batch.py` | 255 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_big.py` | 71 |
| `tests/test_boundary.py` | 50 |
| `tests/test_bus.py` | 145 |
| `tests/test_control.py` | 213 |
| `tests/test_cp_modal.py` | 102 |
| `tests/test_cpf.py` | 401 |
| `tests/test_ctlwin.py` | 147 |
| `tests/test_dcdc.py` | 96 |
| `tests/test_dcgrid.py` | 735 |
| `tests/test_derivation.py` | 93 |
| `tests/test_designer.py` | 200 |
| `tests/test_emt_harmonic.py` | 139 |
| `tests/test_emt_se.py` | 141 |
| `tests/test_engine.py` | 276 |
| `tests/test_ev.py` | 104 |
| `tests/test_ev_weights.py` | 78 |
| `tests/test_gen_ctl.py` | 136 |
| `tests/test_generator.py` | 223 |
| `tests/test_geo.py` | 254 |
| `tests/test_gfm.py` | 222 |
| `tests/test_gfm2.py` | 167 |
| `tests/test_gfm3.py` | 219 |
| `tests/test_gfm4.py` | 153 |
| `tests/test_gfm5.py` | 179 |
| `tests/test_gis.py` | 183 |
| `tests/test_guide.py` | 228 |
| `tests/test_harmonic.py` | 312 |
| `tests/test_impl.py` | 138 |
| `tests/test_impulse_tools.py` | 150 |
| `tests/test_inputs.py` | 147 |
| `tests/test_insulation.py` | 128 |
| `tests/test_lblplace.py` | 89 |
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
| `tests/test_netview.py` | 400 |
| `tests/test_network.py` | 272 |
| `tests/test_neutral.py` | 76 |
| `tests/test_nn.py` | 130 |
| `tests/test_nnstart.py` | 315 |
| `tests/test_opf.py` | 262 |
| `tests/test_pcl.py` | 312 |
| `tests/test_pieces.py` | 58 |
| `tests/test_plotcore.py` | 96 |
| `tests/test_plotting.py` | 113 |
| `tests/test_pmu.py` | 148 |
| `tests/test_powerflow.py` | 334 |
| `tests/test_psse.py` | 305 |
| `tests/test_qside.py` | 99 |
| `tests/test_recording.py` | 211 |
| `tests/test_refac.py` | 78 |
| `tests/test_report.py` | 914 |
| `tests/test_rms.py` | 227 |
| `tests/test_sat.py` | 180 |
| `tests/test_scopf.py` | 263 |
| `tests/test_se.py` | 366 |
| `tests/test_sparse.py` | 53 |
| `tests/test_split.py` | 97 |
| `tests/test_sssc.py` | 444 |
| `tests/test_step.py` | 167 |
| `tests/test_stream.py` | 136 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 609 |
| `tests/test_study.py` | 256 |
| `tests/test_subcircuit.py` | 149 |
| `tests/test_sweepc.py` | 181 |
| `tests/test_templates.py` | 237 |
| `tests/test_time3.py` | 64 |
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
| `tests/js/b4_cases.js` | 20 |
| `tests/js/batch_requests.js` | 116 |
| `tests/js/big_cases.js` | 56 |
| `tests/js/bus_cases.js` | 127 |
| `tests/js/cable_tutorial.js` | 10 |
| `tests/js/cp_cases.js` | 58 |
| `tests/js/ctl_cases.js` | 33 |
| `tests/js/dcdc_cases.js` | 13 |
| `tests/js/ev_cases.js` | 37 |
| `tests/js/ev_weights_cases.js` | 15 |
| `tests/js/folder_cases.js` | 92 |
| `tests/js/gen_cases.js` | 78 |
| `tests/js/gen_ctl_cases.js` | 39 |
| `tests/js/geo_cases.js` | 15 |
| `tests/js/gfm_cases.js` | 84 |
| `tests/js/gis_cases.js` | 42 |
| `tests/js/harm_emt_cases.js` | 15 |
| `tests/js/impl_cases.js` | 63 |
| `tests/js/inputs_cases.js` | 30 |
| `tests/js/lblplace_cases.js` | 60 |
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
| `tests/js/netview_cases.js` | 91 |
| `tests/js/neut_cases.js` | 92 |
| `tests/js/nn_cases.js` | 48 |
| `tests/js/pieces_cases.js` | 45 |
| `tests/js/plotcore_cases.js` | 34 |
| `tests/js/pmu_cases.js` | 21 |
| `tests/js/refac_cases.js` | 68 |
| `tests/js/rms_emt_cases.js` | 11 |
| `tests/js/robust_cases.js` | 17 |
| `tests/js/sat_cases.js` | 149 |
| `tests/js/sim_cases.js` | 356 |
| `tests/js/snapshot_cases.js` | 22 |
| `tests/js/sparse_cases.js` | 57 |
| `tests/js/split_cases.js` | 106 |
| `tests/js/split_ref.js` | 17 |
| `tests/js/sssc_cases.js` | 85 |
| `tests/js/step_cases.js` | 120 |
| `tests/js/study_cases.js` | 37 |
| `tests/js/subcircuit_cases.js` | 87 |
| `tests/js/time3_cases.js` | 72 |
| `tests/js/tlm_ss_cases.js` | 18 |
| `tests/js/trstart_cases.js` | 11 |
| `tests/js/trv_cases.js` | 8 |
| `tests/js/trv_tutorial_cases.js` | 30 |
| `tests/js/tune_cases.js` | 39 |
| `tests/js/tutorial_cases.js` | 145 |
| `tests/js/units_cases.js` | 52 |
| `tests/js/vsc_start_cases.js` | 37 |
| `tests/js/watch_cases.js` | 41 |
| `tests/js/wb_cases.js` | 21 |
| `tests/js/xb_cases.js` | 19 |
| `tests/ui/addons_flow.js` | 128 |
| `tests/ui/blocks_flow.js` | 155 |
| `tests/ui/bus_flow.js` | 91 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/ev_flow.js` | 112 |
| `tests/ui/facts_flow.js` | 93 |
| `tests/ui/features_flow.js` | 389 |
| `tests/ui/gis_flow.js` | 80 |
| `tests/ui/line_flow.js` | 166 |
| `tests/ui/live_flow.js` | 41 |
| `tests/ui/perf_flow.js` | 68 |
| `tests/ui/scenario_flow.js` | 70 |
| `tests/ui/scope_flow.js` | 169 |
| `tests/ui/speed_flow.js` | 104 |
| `tests/ui/step_flow.js` | 91 |
| `tests/ui/studio_flow.js` | 45 |
| `tests/ui/study_flow.js` | 60 |
| `tests/ui/subcircuit_flow.js` | 79 |
| `tests/ui/ux_flow.js` | 87 |
| `tests/ui/watch_flow.js` | 113 |
| `tests/ui/wiring_flow.js` | 128 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 189 | `R` | Αντίσταση |
| 193 | `CPE` | CPE / Warburg |
| 199 | `L` | Πηνίο |
| 203 | `C` | Πυκνωτής |
| 207 | `VDC` | Πηγή DC / μπαταρία |
| 213 | `VAC` | Πηγή AC |
| 217 | `VAC3` | Τριφασική πηγή (Y) |
| 224 | `IDC` | Πηγή ρεύματος |
| 230 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 243 | `D` | Δίοδος |
| 247 | `SCR` | Θυρίστορ (SCR) |
| 259 | `XFMR` | Μετασχηματιστής |
| 276 | `LSAT` | Μη γραμμικό πηνίο (ψ–i) |
| 284 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 297 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 310 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 324 | `KL` | Συζευγμένα πηνία (N×N) |
| 335 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 342 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 350 | `SG` | Σπινθηριστής (διάκενο) |
| 367 | `DS` | Αποζεύκτης με επαναναύσεις (GIS) |
| 376 | `CPL` | Φορτίο σταθερής ισχύος |
| 380 | `SH` | Δειγματοληψία και συγκράτηση (S&H) |
| 389 | `GND` | Γείωση |
| 391 | `JUNC` | Κόμβος |
| 392 | `PWM` | PWM / έλεγχος |
| 430 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 441 | `VM` | Βολτόμετρο |
| 443 | `AM` | Αμπερόμετρο (σε σειρά) |
| 446 | `VP` | Probe τάσης (ως προς τη γη) |
| 448 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 450 | `MEAS` | Μέτρηση στοιχείου |
| 454 | `CONST` | Σταθερά / πρόγραμμα |
| 463 | `GAIN` | Κέρδος |
| 465 | `SUM` | Άθροισμα |
| 468 | `MUL` | Γινόμενο |
| 470 | `DIV` | Διαίρεση a/b |
| 473 | `SAT` | Κορεσμός |
| 476 | `CMP` | Συγκριτής |
| 479 | `LOGIC` | Λογική πύλη |
| 482 | `PIB` | PI διακριτός |
| 488 | `UD` | Καθυστέρηση z⁻¹ |
| 491 | `SR` | Μανδαλωτής SR (latch) |
| 494 | `CLK` | Ρολόι (τετραγωνικό) |
| 497 | `RAMP` | Φέρον / ράμπα |
| 502 | `EXPR` | Έκφραση |
| 506 | `PY` | Μπλοκ Python |
| 514 | `AIC` | Ελεγκτής AI (βρόχος με νευρωνικό) |
| 532 | `AVR` | Διέγερση και ρυθμιστής τάσης (AVR: IEEE ST1A, DC1A) |
| 543 | `PSS` | Σταθεροποιητής συστήματος (PSS) |
| 548 | `GOV` | Ρυθμιστής στροφών και στρόβιλος |
| 561 | `EVC` | Πολυκριτηριακός ελεγκτής οχήματος (ταχύτητα → ροπή → ρεύμα) |
| 571 | `NN` | Νευρωνικό δίκτυο (MLP) |
| 634 | `MOD3` | Διαμορφωτής τριφασικός |
| 638 | `FEST` | Εκτιμητής ροής δρομέα |
| 642 | `INT` | Ολοκληρωτής |
| 646 | `LPF` | Βαθυπερατό 1ης τάξης |
| 650 | `F2` | Φίλτρο 2ης τάξης |
| 655 | `RLIM` | Όριο ρυθμού μεταβολής |
| 659 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 663 | `EDGE` | Ανιχνευτής ακμής |
| 667 | `CLARKE` | Clarke abc → αβ |
| 671 | `ICLARKE` | Clarke αβ → abc |
| 675 | `PARK` | Park αβ → dq |
| 678 | `IPARK` | Park dq → αβ |
| 681 | `PLL` | PLL (τριφασικό) |
| 687 | `TAGO` | Ετικέτα: προς (Goto) |
| 690 | `TAGI` | Ετικέτα: από (From) |
| 694 | `AVG` | Μέση τιμή |
| 697 | `RMS` | Ενεργός τιμή (RMS) |
| 700 | `MNMX` | Ελάχιστο και μέγιστο ανά περίοδο |
| 708 | `FOUR` | Fourier: αρμονική ν |
| 715 | `THD` | Ολική αρμονική παραμόρφωση (THD) |
| 725 | `PQ1` | Ισχύς (μονοφασική) |
| 730 | `PQ3` | Στιγμιαία ισχύς p, q (τριφασική) |
| 737 | `PPOS` | Ισχύς θετικής ακολουθίας |
| 743 | `SEQ` | Αναλυτής ακολουθιών |
| 752 | `PIA` | Περιοδικός μέσος παλμών |
| 756 | `DISP` | Ένδειξη |
| 760 | `SUB` | Υποκύκλωμα |
| 763 | `PORT` | Θύρα (ηλεκτρική) |
| 766 | `SIN` | Θύρα εισόδου σήματος |
| 769 | `SOUT` | Θύρα εξόδου σήματος |
| 773 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 778 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 782 | `BSEL` | Επιλογή από δίαυλο |
| 785 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 792 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 804 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 813 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 823 | `ARCX` | Τμήμα τόξου |
| 827 | `ARC` | Διακόπτης με τόξο (μονοφασικός) |
| 834 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 859 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 905 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 919 | `TLM` | Γραμμή από γεωμετρία (CP / FD / WB) |
| 957 | `TOWER` | Πύργος γραμμής (κεραυνοί) |
| 981 | `SAI` | Αλεξικέραυνο ZnO, μοντέλο IEEE (εξαρτάται από τη συχνότητα) |
| 996 | `SAIX` | Αλεξικέραυνο IEEE (συμπαγές) |
| 1000 | `RFX` | Γείωση πύργου R(I) (από τη γραμμή του πύργου) |
| 1006 | `CHB` | Αρθρωτός βραχίονας: γέφυρες H σε σειρά (CHB) |
| 1014 | `NLC` | Διαμόρφωση πλησιέστερης στάθμης (NLC) με ταξινόμηση |
| 1020 | `SPLL` | PLL μονοφασικό (SOGI) |
| 1027 | `SSSC` | Έλεγχος αρθρωτού SSSC (m-SSSC) |
| 1046 | `SSSC3` | Κεντρικός έλεγχος τριφασικού m-SSSC |
| 1070 | `MMC` | Μετατροπέας MMC (HVDC, μοντέλα 1–4) |
| 1099 | `MMCC` | Έλεγχος σταθμού MMC (HVDC) |
| 1147 | `VSC2` | Μετατροπέας VSC δύο επιπέδων (μέσο μοντέλο, φίλτρο L ή LC) |
| 1162 | `DCDC` | Μετατροπέας DC/DC (μέσο μοντέλο, χωρίς απώλειες) |
| 1178 | `PMU3` | Μονάδα μέτρησης φασιθετών (PMU, θετική ακολουθία) |
| 1190 | `GFMC` | Έλεγχος grid-forming (στατικότητα, VSM, PSC, dVOC, matching) |
| 1240 | `LCC6` | Γέφυρα θυρίστορ 6 παλμών (LCC) |
| 1256 | `LCCS` | Σταθμός LCC 12 παλμών (HVDC) |
| 1271 | `LCCC` | Έλεγχος σταθμού LCC (HVDC) |
| 1296 | `FILT3` | Φίλτρο AC τριφασικό |
| 1302 | `ZSER3` | Τριφασική εμπέδηση σειράς (R + L + (R + L) ∥ R) |
| 1308 | `LCCX` | Γέφυρα 6 παλμών (συμπαγής) |
| 1313 | `LCCM` | Μέτρηση α και γ (γέφυρα 6 παλμών) |
| 1318 | `MMCA` | Βραχίονας MMC (συμπαγής) |
| 1323 | `CHBX` | Αρθρωτός βραχίονας (συμπαγής) |
| 1326 | `SPLX` | PLL μονοφασικό (SOGI, συμπαγές) |
| 1330 | `NOTE` | Σημείωση (κείμενο στο σχέδιο) |

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
| 1318 | `se_emt` | Ροή φορτίου και OPF (4.19.1) | Εκτίμηση κατάστασης από μετρήσεις του EMT: φασιθέτες (PMU), SCADA και μέτρα ρεύματος |
| 1335 | `ieee9_emt` | Συστήματα ισχύος (4.3) | IEEE 9 ζυγών σε EMT, από τη ροή φορτίου |
| 1367 | `big_grid` | Μεγάλα δίκτυα (4.19.3) | Πλέγμα k × k ζυγών σε EMT: ο γραμμικός λύτης σε μεγάλο δίκτυο |
| 1380 | `multirate_lines` | Μεγάλα δίκτυα (4.24) | Πολλαπλοί ρυθμοί: γρήγορο και αργά υποδίκτυα με γραμμές ανάμεσα |
| 1407 | `pf_study` | Ροή φορτίου και OPF (4.19.1) | Ροή φορτίου και N−1 σε δίκτυα IEEE |
| 1419 | `opf_study` | Ροή φορτίου και OPF (4.19.1) | Βέλτιστη ροή φορτίου (OPF) σε δίκτυα IEEE |
| 1433 | `cpf_study` | Ροή φορτίου και OPF (4.19.1) | Ευστάθεια τάσης: καμπύλη P–V και περιθώριο φόρτισης (συνεχιζόμενη ροή φορτίου) |
| 1449 | `se_study` | Ροή φορτίου και OPF (4.19.1) | Εκτίμηση κατάστασης: μετρήσεις με σφάλματα και εντοπισμός των λανθασμένων |
| 1470 | `acdc_study` | Ροή φορτίου και OPF (4.19.1) | Δίκτυο AC/DC: όρια σταθμών, βέλτιστη ροή φορτίου AC/DC, N−1 AC/DC |
| 1483 | `harm_emt` | Ροή φορτίου και OPF (4.19.1) | Φάσμα από το EMT για την αρμονική ροή φορτίου: γέφυρα 6 παλμών με μετάβαση |
| 1506 | `harm_study` | Ροή φορτίου και OPF (4.19.1) | Αρμονικές: παραμόρφωση τάσης και συντονισμοί (αρμονική ροή φορτίου) |
| 1526 | `unb_study` | Ροή φορτίου και OPF (4.19.1) | Ασύμμετρη ροή φορτίου: ένας τροφοδότης διανομής φάση προς φάση |
| 1552 | `ieee9_sssc` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | IEEE 9 ζυγών σε EMT με τριφασικό m-SSSC (κεντρικός έλεγχος) |
| 1582 | `trv_terminal` | Διακόπτες ισχύος (4.9) | TRV σε σφάλμα ακροδεκτών: IEC 62271-100 |
| 1603 | `trv_slf` | Διακόπτες ισχύος (4.9) | Σφάλμα κοντινής γραμμής και τόξο του διακόπτη |
| 1634 | `lightning_gis` | Κεραυνοί και συντονισμός μόνωσης (4.9) | Κεραυνός σε γραμμή 400 kV δίπλα σε υποσταθμό GIS: συντονισμός μόνωσης |
| 1724 | `gis765_lv` | Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22) | GIS 765 kV: δοκιμή με βηματική τάση 100 V (IEC TR 60071-4, περίπτωση 4) |
| 1742 | `gis_vfto` | Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22) | Πολύ γρήγορα μεταβατικά (VFTO) από τον αποζεύκτη ενός GIS 800 kV |
| 1767 | `ds_restrike` | Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22) | Αποζεύκτης GIS 420 kV: επαναναύσεις στο κλείσιμο και στο άνοιγμα |
| 1789 | `insco_study` | Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22) | Συντονισμός μόνωσης υποσταθμού κατά IEC 60071-2 (με αναφορά) |
| 1806 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1827 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1876 | `cable_xb` | Καλώδια: wideband και cross-bonding (4.13) | Υπόγειο καλώδιο 150 kV με cross-bonding: αναλυτικό και ομογενές μοντέλο |
| 1919 | `sssc_1ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε γραμμή (μονοφασικό) |
| 1939 | `sssc_3ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε δίκτυο 150 kV (τριφασικό, 4 ζυγοί) |
| 1977 | `ccsc_1ph` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | CCSC: πυκνωτής σειράς ελεγχόμενος από μετατροπέα (μονοφασικό) |
| 2005 | `hvdc_mmc` | HVDC: MMC (4.14) | Σύνδεση HVDC με MMC σημείο προς σημείο (±320 kV, 1000 MW) |
| 2061 | `mtdc5` | Δίκτυα DC πολλών τερματικών (4.20) | Δίκτυο DC πέντε τερματικών με στατικότητα τάσης (EMT και ροή φορτίου AC/DC) |
| 2116 | `b4dcs2` | Δίκτυα DC πολλών τερματικών (4.20) | Το DCS2 του B4 της CIGRE: πέντε τερματικά ±200 kV με σταθμούς MMC (EMT και ροή φορτίου) |
| 2188 | `dcdc_ex303` | Δίκτυα DC πολλών τερματικών (4.20) | Μετατροπέας DC/DC ανάμεσα σε δύο δίκτυα DC 370 και 400 kV (Παράδειγμα 30.3) |
| 2208 | `hvdc_gfm` | Grid-forming (4.18.1) | Σταθμός MMC ως grid-forming: νησίδα, ασθενές δίκτυο, παράλληλα με άλλη μονάδα |
| 2266 | `hvdc_lcc` | HVDC: LCC (4.16) | Το πρώτο benchmark HVDC της CIGRE (LCC 12 παλμών, 500 kV, 1000 MW) |
| 2320 | `gfm_island` | Grid-forming (4.18) | Νησίδα με δύο μετατροπείς grid-forming: μοιρασιά του φορτίου με τη στατικότητα |
| 2351 | `gfm_sync` | Grid-forming (4.18) | Synchronverter: αντιστροφέας που μιμείται σύγχρονη γεννήτρια (Zhong & Weiss 2011) |
| 2379 | `gfm_weak` | Grid-forming (4.18) | Συγχρονισμός μέσω ισχύος (PSC) σε ασθενές δίκτυο, απέναντι στον έλεγχο ρεύματος με PLL |
| 2418 | `ieee9_gfm` | Grid-forming (4.18.1) | IEEE 9 με μετατροπέα στη θέση της G3: grid-forming ή grid-following (nadir, RoCoF) |
| 2469 | `empty` | Νέο | Κενό κύκλωμα |
| 2475 | `xf_inrush` | Μετασχηματιστές (5.0.1) | Ζεύξη μετασχηματιστή: ρεύμα ζεύξης και παραμένουσα ροή |

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
| 96 | function | `renderRec` |
| 98 | function | `recToggle` |
| 109 | function | `recCollect` |
| 114 | function | `recFlush` |
| 126 | function | `studySettings` |
| 128 | function | `studyEstimate` |
| 130 | function | `renderStudy` |
| 132 | const fn | `o` |
| 141 | const fn | `g` |
| 147 | function | `renderStudyBtn` |
| 148 | function | `studyView` |
| 149 | function | `studyRun` |
| 167 | function | `pyPage` |
| 171 | function | `runToEnd` |
| 174 | const fn | `chunk` |
| 176 | function | `loop` |
| 204 | function | `draw` |
| 206 | function | `setText` |
| 207 | function | `navRange` |
| 208 | function | `updateClock` |
| 212 | function | `liveOf` |
| 258 | function | `blkUnit` |
| 277 | function | `outsOf` |
| 279 | const fn | `vecN` |
| 281 | function | `chanLabel` |
| 291 | function | `chanSrc` |
| 292 | function | `addProbe` |
| 293 | function | `flash` |
| 345 | function | `signalsFor` |
| 362 | const fn | `fold` |
| 364 | function | `fillSignals` |
| 371 | function | `renderChannels` |
| 392 | function | `requestMeasure` |
| 393 | function | `renderMeasure` |
| 405 | function | `MeasureUnit` |
| 408 | function | `simKey` |
| 409 | function | `perSeries` |
| 410 | function | `refFor` |
| 411 | const fn | `sched` |
| 415 | function | `metricsFor` |
| 419 | function | `metricsRows` |
| 424 | function | `eventMetricsHTML` |
| 426 | function | `renderMetricsPanel` |
| 437 | function | `rawSeries` |
| 440 | function | `autoF1` |
| 444 | function | `evRows` |
| 446 | function | `renderEvents` |
| 448 | const fn | `fv` |
| 454 | function | `evMaxSetting` |
| 455 | function | `eventsJson` |
| 456 | function | `eventsCsv` |
| 458 | function | `renderFFT` |
| 481 | function | `cellZ` |
| 483 | function | `renderEISForm` |
| 484 | const fn | `opt` |
| 488 | function | `runEIS` |
| 496 | function | `drawEIS` |
| 515 | function | `perSamples` |
| 517 | function | `periodText` |
| 518 | const fn | `svgPlot` |
| 520 | function | `pcmMapFn` |
| 522 | const fn | `z` |
| 525 | function | `renderPoincare` |
| 541 | function | `bfParams` |
| 543 | function | `renderBifurcationForm` |
| 549 | function | `runBifurcation` |
| 563 | function | `stopBifurcation` |
| 564 | function | `drawBifurcation` |
| 574 | function | `niceTop` |
| 577 | function | `btStatus` |
| 578 | function | `parseStep` |
| 579 | function | `runBatch` |
| 595 | function | `clearBatch` |
| 597 | function | `meanPL` |
| 599 | function | `ringTrace` |
| 601 | function | `compareHTML` |
| 611 | function | `renderBatch` |
| 616 | function | `parseCSV` |
| 618 | const fn | `cells` |
| 619 | const fn | `num` |
| 625 | const fn | `normName` |
| 626 | function | `renderCsvMap` |
| 627 | const fn | `auto` |
| 633 | function | `applyCsv` |
| 638 | function | `renderCsv` |
| 640 | function | `clearCsv` |
| 642 | function | `sampleCompareHTML` |
| 658 | function | `pwmGainsText` |
| 665 | function | `toggleInput` |
| 668 | function | `setInputMeta` |
| 672 | function | `inputsHTML` |
| 673 | const fn | `val` |
| 682 | function | `liveChange` |
| 684 | function | `renderLiveLog` |
| 693 | function | `changesToSchedule` |
| 695 | const fn | `f` |
| 704 | function | `updateLivePanel` |
| 709 | function | `setLivePanel` |
| 712 | function | `switchesOf` |
| 715 | function | `addPulses` |
| 717 | function | `pulseKeys` |
| 718 | function | `refreshControls` |
| 721 | const fn | `phase` |
| 755 | const fn | `setD` |
| 771 | const fn | `setPh` |
| 783 | const fn | `pinNow` |
| 794 | const fn | `pinSet` |
| 806 | function | `pinMap` |
| 807 | function | `pinX` |
| 808 | function | `pinV` |
| 814 | function | `liveParam` |
| 829 | function | `closeInspector` |
| 830 | function | `placePopup` |
| 833 | function | `fieldValue` |
| 838 | function | `fieldHTML` |
| 853 | function | `placeAt` |
| 854 | function | `popupDrag` |
| 863 | function | `nnBlock` |
| 864 | function | `nnBox` |
| 867 | function | `nnLearned` |
| 868 | function | `openInspector` |
| 876 | const fn | `wired` |
| 886 | const fn | `same` |
| 887 | const fn | `apply` |
| 902 | function | `ctlCtx` |
| 910 | function | `splitProposal` |
| 912 | function | `openSplitWin` |
| 915 | const fn | `single` |
| 918 | function | `openCtlWin` |
| 922 | const fn | `wireWidth` |
| 923 | function | `openWireInspector` |
| 940 | const fn | `numOf` |
| 946 | function | `psec` |
| 948 | function | `propsOpen` |
| 949 | function | `setProps` |
| 951 | function | `focusComp` |
| 952 | function | `togglePin` |
| 955 | function | `renderProps` |
| 964 | function | `propsComp` |
| 965 | const fn | `secOf` |
| 967 | const fn | `exprV` |
| 968 | const fn | `inpB` |
| 969 | const fn | `row` |
| 975 | const fn | `wired` |
| 989 | function | `propsJunc` |
| 991 | function | `propsWire` |
| 997 | function | `propsMulti` |
| 1000 | function | `propsCircuit` |
| 1011 | const fn | `opt` |
| 1021 | const fn | `sv` |
| 1057 | const fn | `chk` |
| 1068 | function | `bindProps` |
| 1105 | function | `diagItems` |
| 1114 | function | `renderDiag` |
| 1125 | function | `openDiag` |
| 1126 | function | `flashComp` |
| 1134 | function | `stepAdvice` |
| 1146 | function | `stepAdviceShow` |
| 1147 | function | `scheduleStepCheck` |
| 1148 | function | `runStepCheck` |
| 1149 | const fn | `inPage` |
| 1156 | function | `syncStepMode` |
| 1218 | function | `scenSetCode` |
| 1219 | function | `scenState` |
| 1220 | function | `scenTab` |
| 1221 | function | `scenOut` |
| 1222 | function | `scenWorker` |
| 1224 | function | `scenRun` |
| 1232 | function | `scenStop` |
| 1233 | function | `scenDone` |
| 1235 | function | `scenMsg` |
| 1250 | function | `scenBatch` |
| 1255 | function | `scenEval` |
| 1258 | function | `addonDock` |
| 1261 | function | `renderAddons` |
| 1262 | const fn | `vsel` |
| 1276 | function | `knockToast` |
| 1279 | function | `initAddons` |
| 1286 | function | `scenBatchWrite` |
| 1289 | function | `renderScenFiles` |
| 1292 | const fn | `scenNum` |
| 1293 | function | `scenTable` |
| 1294 | function | `scenShow` |
| 1307 | function | `scenTicks` |
| 1308 | function | `scenPlot` |
| 1312 | const fn | `thin` |
| 1319 | const fn | `dig` |
| 1330 | function | `initScenarios` |
| 1337 | function | `liveApply` |
| 1340 | function | `closeMenu` |
| 1341 | function | `openMenu` |
| 1365 | function | `updateHover` |
| 1383 | const fn | `atTop` |
| 1384 | function | `topDoc` |
| 1385 | function | `defsOf` |
| 1386 | const fn | `pid` |
| 1387 | function | `fullDoc` |
| 1389 | function | `commitView` |
| 1391 | function | `viewDiag` |
| 1392 | const fn | `rel` |
| 1395 | function | `compAt` |
| 1400 | function | `allComps` |
| 1401 | const fn | `walk` |
| 1407 | function | `partDef` |
| 1409 | function | `pdefaults` |
| 1410 | function | `subParams` |
| 1412 | function | `placeOk` |
| 1414 | function | `renameChannels` |
| 1416 | function | `levelDoc` |
| 1417 | function | `applyLevel` |
| 1418 | function | `groupSel` |
| 1423 | function | `expandSub` |
| 1427 | function | `libToSub` |
| 1429 | function | `uniqueSub` |
| 1430 | function | `subMenu` |
| 1434 | function | `enterSub` |
| 1440 | function | `leaveSub` |
| 1446 | function | `renderCrumbs` |
| 1454 | function | `curDef` |
| 1455 | function | `publicOf` |
| 1456 | function | `togglePublic` |
| 1464 | function | `propsSub` |
| 1472 | function | `bindSub` |
| 1480 | function | `propsDef` |
| 1495 | function | `bindDef` |
| 1511 | function | `exportDef` |
| 1513 | function | `importDefs` |
| 1524 | function | `palLoad` |
| 1525 | function | `palSave` |
| 1526 | function | `palRecent` |
| 1527 | function | `palItem` |
| 1531 | function | `renderPalette` |
| 1539 | const fn | `isOpen` |
| 1553 | function | `tutorial` |
| 1556 | function | `circuitSig` |
| 1566 | function | `tutorialRef` |
| 1567 | function | `theoryValidity` |
| 1573 | function | `staleBanner` |
| 1576 | function | `bindRestore` |
| 1577 | function | `loadTutorial` |
| 1582 | function | `migrateFile` |
| 1585 | function | `applyProject` |
| 1596 | function | `renderTutorial` |
| 1606 | function | `gallery` |
| 1612 | function | `api` |
| 1613 | function | `paramsOf` |
| 1616 | function | `avgOver` |
| 1619 | function | `simValue` |
| 1625 | function | `lastPP` |
| 1627 | function | `runTheory` |
| 1640 | function | `cmpRows` |
| 1641 | function | `stepsHTML` |
| 1642 | function | `renderTheory` |
| 1674 | function | `rippleDev` |
| 1676 | function | `periodAvgAt` |
| 1678 | function | `samplingTheory` |
| 1687 | const fn | `lastAt` |
| 1709 | function | `polyTheory` |
| 1716 | const fn | `frac` |
| 1745 | function | `lastPeriods` |
| 1746 | function | `evalOrderHTML` |
| 1755 | function | `genScTheory` |
| 1757 | const fn | `Iac` |
| 1765 | function | `shaftModes` |
| 1772 | function | `fbmTheory` |
| 1780 | function | `ieee9Theory` |
| 1788 | function | `schedNow` |
| 1790 | function | `fundOf` |
| 1796 | function | `ssscNet3` |
| 1797 | const fn | `c` |
| 1800 | const fn | `ser` |
| 1801 | const fn | `ln` |
| 1809 | function | `ssscTheory` |
| 1844 | function | `ccscTheory` |
| 1849 | const fn | `cm` |
| 1851 | const fn | `dev` |
| 1854 | const fn | `lineI` |
| 1875 | function | `ieee9ssscTheory` |
| 1890 | function | `hvdcTheory` |
| 1915 | function | `gfmIslandDvoc` |
| 1928 | function | `gfmTheory` |
| 1970 | function | `ieee9GfmTheory` |
| 1989 | function | `hvdcGfmTheory` |
| 2002 | function | `lccTheory` |
| 2003 | const fn | `st` |
| 2009 | const fn | `g` |
| 2021 | function | `wbModelHTML` |
| 2029 | function | `cableXbTheory` |
| 2030 | const fn | `rms` |
| 2031 | const fn | `pk` |
| 2043 | const fn | `v` |
| 2048 | function | `lineFdTheory` |
| 2049 | const fn | `lab` |
| 2057 | const fn | `pk` |
| 2064 | function | `trvAfterZero` |
| 2070 | function | `trvSvg` |
| 2072 | const fn | `path` |
| 2079 | function | `trvTerminalTheory` |
| 2092 | function | `trvSlfTheory` |
| 2112 | function | `lightningTheory` |
| 2114 | const fn | `pk` |
| 2135 | function | `gisPeaks` |
| 2136 | function | `atT` |
| 2138 | function | `gisPath` |
| 2142 | function | `gis765Theory` |
| 2153 | function | `gisVftoTheory` |
| 2162 | function | `dsRestrikeTheory` |
| 2177 | function | `inscoHTML` |
| 2188 | function | `inscoAct` |
| 2193 | function | `inscoTheory` |
| 2199 | function | `netFaultTheory` |
| 2218 | function | `inrushTheory` |
| 2232 | function | `busDqTheory` |
| 2240 | function | `subLegsTheory` |
| 2252 | function | `currentCtlTheory` |
| 2259 | const fn | `R` |
| 2262 | const fn | `over` |
| 2272 | const fn | `row` |
| 2278 | function | `blocksTheory` |
| 2293 | function | `pcmTheory` |
| 2319 | function | `codeTheory` |
| 2329 | function | `eisTheory` |
| 2331 | const fn | `ser` |
| 2344 | function | `imSteady` |
| 2347 | function | `imPar` |
| 2348 | function | `phaseRms` |
| 2349 | function | `vfTheory` |
| 2362 | function | `focTheory` |
| 2379 | function | `synTheory` |
| 2398 | const fn | `need` |
| 2418 | function | `pmTheory` |
| 2420 | const fn | `mtpa` |
| 2436 | function | `srmTheory` |
| 2451 | const fn | `curve` |
| 2462 | function | `lgTheory` |
| 2473 | const fn | `cr` |
| 2480 | function | `chaosTheory` |
| 2495 | function | `nnCycles` |
| 2498 | function | `genCtlTheory` |
| 2511 | function | `evTheory` |
| 2525 | function | `nnTheory` |
| 2542 | function | `nnGuiCode` |
| 2548 | function | `runNNCompare` |
| 2556 | function | `dcDriveTheory` |
| 2557 | const fn | `per` |
| 2558 | const fn | `cross` |
| 2588 | function | `twModel` |
| 2591 | const fn | `g` |
| 2594 | function | `twLattice` |
| 2601 | const fn | `marks` |
| 2604 | function | `twTheory` |
| 2612 | const fn | `at` |
| 2629 | function | `arTheory` |
| 2649 | function | `impulseMeasure` |
| 2651 | const fn | `cross` |
| 2654 | function | `marxTheory` |
| 2672 | function | `chopModel` |
| 2675 | const fn | `f` |
| 2678 | function | `chopTheory` |
| 2692 | function | `cmp3` |
| 2696 | function | `hvExact` |
| 2697 | function | `hv153Theory` |
| 2723 | function | `besI1e` |
| 2725 | function | `heaviside` |
| 2727 | function | `lossTheory` |
| 2746 | function | `vtBreak` |
| 2747 | function | `vtTheory` |
| 2768 | function | `hvdivTheory` |
| 2770 | const fn | `r` |
| 2782 | function | `scheringTheory` |
| 2783 | const fn | `inv` |
| 2792 | const fn | `sr` |
| 2804 | const fn | `studyNet` |
| 2805 | function | `studyQ` |
| 2812 | function | `emtSpectra` |
| 2815 | function | `emtReadings` |
| 2818 | const fn | `studyKey` |
| 2819 | function | `studyOpen` |
| 2832 | function | `studyAct` |
| 2854 | function | `netViewOpen` |
| 2858 | const fn | `legend` |
| 2882 | function | `nvEdit` |
| 2891 | function | `nvApply` |
| 2892 | const fn | `same` |
| 2893 | const fn | `put` |
| 2907 | function | `mtdcTheory` |
| 2913 | function | `dcdcSteady` |
| 2918 | function | `dcdcTheory` |
| 2919 | const fn | `row` |
| 2923 | function | `b4Theory` |
| 2928 | function | `studyTheory` |
| 2946 | const fn | `X` |
| 3033 | function | `formulaTheory` |
| 3149 | function | `nodeAvg` |
| 3155 | function | `circuitForMath` |
| 3191 | function | `scheduleMath` |
| 3192 | function | `batteryKey` |
| 3194 | function | `mathChoices` |
| 3195 | const fn | `prim` |
| 3197 | function | `renderMathChoices` |
| 3199 | function | `runTemplate` |
| 3205 | function | `runMath` |
| 3232 | function | `saveLocal` |
| 3233 | function | `saveLocalSoon` |
| 3235 | function | `download` |
| 3236 | function | `exportCSV` |
| 3242 | function | `syncScopeInputs` |
| 3243 | function | `setSpeed` |
| 3246 | function | `openSettings` |
| 3247 | const fn | `sel` |
| 3248 | const fn | `chk` |
| 3274 | function | `applyLook` |
| 3278 | function | `boot` |
| 3349 | const fn | `mv` |
| 3350 | const fn | `up` |
| 3351 | const fn | `navOpen` |
| 3367 | const fn | `probeSel` |
| 3429 | function | `renderTheoryLive` |

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
| 29 | class | `MinHeap` |
| 30 | method | `clear` |
| 31 | method | `push` |
| 34 | method | `pop` |
| 38 | function | `rtArrays` |
| 43 | class | `Editor` |
| 44 | method | `constructor` |
| 79 | method | `comp` |
| 81 | method | `wire` |
| 84 | method | `busy` |
| 85 | method | `newId` |
| 86 | method | `pin` |
| 88 | method | `wirePts` |
| 89 | method | `setWirePts` |
| 90 | method | `snapshot` |
| 93 | method | `remember` |
| 95 | method | `undo` |
| 96 | method | `redo` |
| 97 | method | `cleanSel` |
| 98 | method | `load` |
| 107 | method | `export` |
| 109 | method | `replaceDoc` |
| 113 | method | `changed` |
| 114 | method | `selection` |
| 115 | method | `select` |
| 116 | method | `addPart` |
| 122 | method | `setParams` |
| 126 | method | `dropDangling` |
| 128 | method | `netKinds` |
| 134 | method | `setProgram` |
| 135 | method | `setSolve` |
| 137 | method | `setDiag` |
| 138 | method | `renderDiag` |
| 140 | method | `kindsOk` |
| 141 | method | `wiresAt` |
| 162 | method | `autoConnect` |
| 179 | method | `insertSeries` |
| 180 | const fn | `pos` |
| 185 | method | `setWireTool` |
| 186 | method | `startFreeWire` |
| 187 | method | `newJunction` |
| 189 | method | `finishFree` |
| 194 | method | `setWireProps` |
| 195 | method | `deleteSel` |
| 201 | method | `tidyJunctions` |
| 211 | method | `rotateSel` |
| 213 | method | `mirrorSel` |
| 215 | method | `captureWires` |
| 216 | method | `refitWires` |
| 217 | method | `copySel` |
| 220 | method | `cutSel` |
| 221 | method | `beginPaste` |
| 224 | method | `paste` |
| 237 | method | `routeAll` |
| 239 | method | `astar` |
| 247 | const fn | `idx` |
| 249 | const fn | `dirIndex` |
| 251 | const fn | `h` |
| 267 | method | `simpleRoute` |
| 270 | method | `route` |
| 274 | method | `adjustEnd` |
| 282 | method | `areaSize` |
| 289 | method | `requestView` |
| 290 | method | `viewFrame` |
| 297 | method | `applyView` |
| 306 | method | `gridBg` |
| 315 | method | `fit` |
| 317 | method | `extent` |
| 324 | method | `render` |
| 326 | method | `partEls` |
| 327 | method | `partSVG` |
| 333 | method | `renderPart` |
| 334 | method | `valueText` |
| 336 | const fn | `fn` |
| 380 | method | `noteHTML` |
| 385 | method | `lblMeasure` |
| 392 | method | `lvChars` |
| 398 | method | `renderLabels` |
| 404 | const fn | `r1` |
| 405 | const fn | `line` |
| 419 | method | `lblHit` |
| 422 | method | `dragLbl` |
| 425 | method | `dropLbl` |
| 429 | method | `resetLabels` |
| 432 | method | `relabelSoon` |
| 433 | method | `renderWires` |
| 452 | method | `wireSVG` |
| 464 | method | `redrawWire` |
| 465 | method | `pathD` |
| 470 | method | `segDir` |
| 471 | method | `midLabel` |
| 472 | method | `renderPins` |
| 482 | method | `renderSel` |
| 486 | method | `setLive` |
| 488 | method | `updateLive` |
| 500 | method | `drawArrows` |
| 511 | method | `world` |
| 513 | method | `hitAt` |
| 514 | method | `hitOf` |
| 516 | method | `down` |
| 544 | method | `move` |
| 558 | method | `up` |
| 573 | method | `cancelDrag` |
| 574 | method | `hoverPin` |
| 576 | method | `dbl` |
| 577 | method | `menu` |
| 581 | method | `worldNow` |
| 582 | method | `wheel` |
| 589 | method | `letter` |
| 590 | method | `key` |
| 615 | method | `beginDrag` |
| 628 | method | `dragMove` |
| 640 | method | `endDrag` |
| 650 | method | `bakeMove` |
| 655 | method | `dragSeg` |
| 658 | const fn | `stub` |
| 667 | method | `drawMarquee` |
| 670 | method | `marqueeSelect` |
| 673 | const fn | `inside` |
| 680 | method | `escape` |
| 683 | method | `beginPlace` |
| 684 | method | `ghost` |
| 687 | method | `finishPlace` |
| 688 | method | `cancelPlace` |
| 690 | method | `startWire` |
| 691 | method | `startWireFrom` |
| 692 | method | `previewWire` |
| 701 | method | `wireClick` |
| 707 | method | `orthoNext` |
| 708 | method | `finishWire` |
| 724 | method | `cancelWire` |
| 726 | method | `splitWire` |
| 736 | method | `wireNetPin` |
| 738 | method | `canScroll` |

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

### `web/studio/kernels.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 10 | function | `load` |
| 12 | class | `Solver` |
| 13 | method | `constructor` |
| 15 | method | `put` |
| 25 | method | `solve` |

### `web/studio/lblplace.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 19 | const fn | `asc` |
| 33 | function | `est` |
| 35 | const fn | `ov` |
| 37 | function | `clipLen` |
| 41 | class | `Grid` |
| 43 | method | `add` |
| 44 | method | `del` |
| 45 | method | `near` |
| 46 | const fn | `midLabel` |
| 49 | function | `sideOf` |
| 58 | function | `pinOf` |
| 60 | function | `gather` |
| 86 | function | `stack` |
| 112 | function | `cands` |
| 115 | function | `cost` |
| 119 | function | `place` |
| 123 | const fn | `best0` |
| 127 | const fn | `put` |
| 128 | const fn | `pick` |
| 134 | const fn | `ctr` |
| 147 | function | `lead` |
| 148 | const fn | `near` |
| 151 | function | `layout` |
| 153 | function | `check` |

### `web/studio/library.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 11 | const fn | `S` |
| 39 | const fn | `strip` |
| 40 | function | `match` |
| 42 | function | `view` |
| 46 | const fn | `by` |

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
| 82 | const fn | `PCore` |
| 83 | function | `niceStep` |
| 84 | function | `chartSVG` |
| 92 | const fn | `X` |
| 116 | function | `mountChart` |
| 119 | const fn | `wire` |
| 120 | const fn | `px` |
| 122 | const fn | `push` |
| 147 | const fn | `csvq` |
| 148 | const fn | `svgText` |
| 149 | function | `svgPng` |
| 152 | function | `download` |
| 154 | const fn | `b64blob` |
| 158 | const fn | `rhoOf` |
| 159 | function | `expand` |
| 164 | const fn | `saveView` |
| 167 | const fn | `cmap` |
| 170 | function | `mapImage` |
| 176 | function | `ohSVG` |
| 177 | const fn | `X` |
| 220 | function | `sideSVG` |
| 230 | const fn | `layerCol` |
| 231 | function | `cabSVG` |
| 250 | function | `xsSVG` |
| 261 | function | `legendHTML` |
| 266 | function | `fitView` |
| 275 | function | `table` |
| 281 | function | `cableTables` |
| 293 | function | `seqForm` |
| 299 | function | `fileForm` |
| 303 | function | `optsForm` |
| 318 | function | `plot` |
| 320 | const fn | `X` |
| 326 | function | `reportHTML` |
| 344 | const fn | `hashText` |
| 345 | const fn | `wsel` |
| 346 | function | `wbOptsHTML` |
| 357 | function | `wbReport` |
| 367 | function | `wbPane` |
| 372 | function | `matHTML` |
| 375 | function | `tablesHTML` |
| 376 | const fn | `symLab` |
| 407 | function | `onF` |
| 411 | function | `open` |
| 413 | const fn | `norm` |
| 419 | const fn | `close` |
| 420 | const fn | `pars` |
| 421 | const fn | `snap` |
| 422 | const fn | `doUndo` |
| 425 | const fn | `saveData` |
| 426 | const fn | `scanReq` |
| 430 | const fn | `scanOld` |
| 431 | const fn | `render` |
| 442 | const fn | `pane` |
| 501 | const fn | `scanBar` |
| 502 | const fn | `viewPanel` |
| 509 | const fn | `wireCommon` |
| 518 | const fn | `wirePane` |
| 519 | const fn | `wireModel` |
| 525 | const fn | `drawBox` |
| 526 | const fn | `drawNow` |
| 530 | const fn | `wireDraw` |
| 531 | const fn | `pt` |
| 532 | const fn | `world` |
| 547 | const fn | `up` |
| 549 | const fn | `tipHTML` |
| 552 | const fn | `wireData` |
| 607 | const fn | `wireGraphs` |
| 628 | const fn | `wireTables` |
| 636 | const fn | `expReq` |
| 638 | const fn | `wireExport` |
| 653 | function | `compute` |
| 663 | function | `refresh` |

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
| 39 | function | `nnBuild` |
| 51 | function | `nnStep` |
| 62 | function | `scopeKeysOf` |
| 63 | const fn | `schedAt` |
| 64 | const fn | `num` |
| 69 | function | `wmW` |
| 74 | function | `wmInc` |
| 91 | const fn | `cmul` |
| 93 | function | `symc` |
| 96 | function | `wmOut` |
| 100 | const fn | `ph` |
| 113 | const fn | `numList` |
| 125 | function | `b64of` |
| 127 | function | `fromB64` |
| 130 | function | `snapEncode` |
| 131 | const fn | `num` |
| 132 | function | `enc` |
| 142 | function | `snapRestore` |
| 143 | function | `dec` |
| 154 | function | `smPort` |
| 158 | function | `smOut` |
| 162 | const fn | `genCopy` |
| 170 | function | `csolveSp` |
| 188 | function | `csolve` |
| 203 | const fn | `grpKey` |
| 210 | function | `acInit` |
| 226 | const fn | `y` |
| 280 | const fn | `seq` |
| 300 | const fn | `pAbs` |
| 341 | class | `NetlistError` |
| 346 | function | `dePiece` |
| 348 | const fn | `F` |
| 349 | function | `deInt` |
| 351 | function | `deFrac` |
| 356 | function | `lpmRun` |
| 365 | function | `lpmParams` |
| 368 | function | `gapUb` |
| 374 | function | `tlSteady` |
| 376 | const fn | `at` |
| 378 | const fn | `re` |
| 384 | function | `tlDlY` |
| 386 | function | `tlSteadyDl` |
| 388 | const fn | `re` |
| 398 | function | `poleG` |
| 399 | function | `tlmModeY` |
| 404 | const fn | `mm` |
| 411 | function | `tlmAcY` |
| 417 | function | `tlmSteady` |
| 418 | const fn | `vm` |
| 432 | function | `tlElement` |
| 441 | function | `tlmElement` |
| 462 | function | `rcCoefC` |
| 464 | const fn | `mul` |
| 469 | function | `wbSet` |
| 474 | function | `wbCo` |
| 478 | function | `wbPoleG` |
| 481 | function | `wbSum` |
| 483 | function | `tlwElement` |
| 502 | function | `tlwAcY` |
| 517 | function | `tlwSteady` |
| 518 | const fn | `mv` |
| 525 | const fn | `st` |
| 535 | function | `piLine` |
| 540 | const fn | `shunt` |
| 548 | function | `rcCoef` |
| 554 | function | `fdCo` |
| 564 | function | `arcF` |
| 570 | function | `arcStep` |
| 577 | function | `arcCur` |
| 582 | function | `nlLimit` |
| 583 | function | `nlSolve` |
| 590 | function | `saiSetup` |
| 591 | const fn | `Lc` |
| 595 | function | `saiCur` |
| 603 | function | `saiCommit` |
| 612 | function | `satSetup` |
| 614 | function | `satCur` |
| 615 | function | `satCommit` |
| 619 | function | `satEl` |
| 624 | function | `xfmrSat` |
| 638 | function | `chbCoef` |
| 643 | function | `chbCommit` |
| 650 | function | `chbStates` |
| 652 | function | `chbCount` |
| 661 | function | `mmcSample` |
| 671 | const fn | `full` |
| 680 | function | `mmcSave` |
| 681 | function | `mmcLoad` |
| 688 | function | `lccCom` |
| 691 | function | `lccMeasInit` |
| 697 | function | `lccMeasure` |
| 714 | function | `lccPlo` |
| 719 | function | `lccU` |
| 721 | function | `lccIn` |
| 724 | function | `lccSetup` |
| 727 | function | `lccEdge` |
| 729 | function | `lccGate` |
| 734 | function | `nlcStep` |
| 737 | const fn | `full` |
| 754 | function | `footLink` |
| 762 | function | `arcStart` |
| 763 | const fn | `r` |
| 766 | function | `buildNetlist` |
| 779 | const fn | `union` |
| 794 | const fn | `nm` |
| 813 | const fn | `sn` |
| 817 | const fn | `isJ` |
| 840 | const fn | `lbl` |
| 845 | const fn | `node` |
| 849 | const fn | `nodeKey` |
| 850 | const fn | `tunePwm` |
| 860 | const fn | `internal` |
| 863 | const fn | `neutNode` |
| 869 | const fn | `mkBlock` |
| 876 | const fn | `add` |
| 877 | const fn | `series` |
| 1182 | function | `compileSignals` |
| 1204 | const fn | `less` |
| 1205 | const fn | `push` |
| 1206 | const fn | `pop` |
| 1221 | function | `f2Phi` |
| 1226 | function | `cmpF` |
| 1230 | function | `stampM` |
| 1232 | function | `luFactor` |
| 1238 | function | `luSolve` |
| 1245 | class | `Sim` |
| 1246 | method | `constructor` |
| 1249 | method | `basePeriod` |
| 1253 | method | `tlMaxStep` |
| 1254 | method | `setStep` |
| 1257 | method | `stIndex` |
| 1273 | method | `stVec` |
| 1274 | method | `stepCfg` |
| 1275 | method | `varSetup` |
| 1281 | method | `setStepMode` |
| 1283 | method | `hGrid` |
| 1287 | method | `modeCap` |
| 1291 | method | `swEls` |
| 1292 | method | `topoKey` |
| 1293 | method | `topoInfo` |
| 1303 | method | `topoCheck` |
| 1320 | method | `lteReset` |
| 1321 | method | `ltePush` |
| 1325 | method | `lteErr` |
| 1335 | method | `varCheck` |
| 1351 | method | `note` |
| 1354 | method | `stepCheck` |
| 1358 | method | `stepInfo` |
| 1361 | method | `diagnostics` |
| 1364 | method | `ringCheck` |
| 1373 | method | `stateMap` |
| 1375 | method | `stateMap0` |
| 1386 | method | `load` |
| 1442 | method | `reset` |
| 1449 | method | `restrict` |
| 1457 | const fn | `own` |
| 1471 | method | `imStep` |
| 1478 | method | `smStep` |
| 1480 | method | `srmStep` |
| 1481 | method | `srmOutputs` |
| 1482 | method | `smOutputs` |
| 1486 | method | `genStep` |
| 1493 | method | `genOutputs` |
| 1498 | method | `genTm` |
| 1499 | method | `genEfd` |
| 1500 | method | `imSources` |
| 1501 | method | `pyBlocks` |
| 1511 | method | `pyLazy` |
| 1513 | method | `pyUpgrade` |
| 1515 | method | `setMethod` |
| 1516 | method | `setControl` |
| 1518 | method | `setBlock` |
| 1520 | method | `setHold` |
| 1522 | method | `markChange` |
| 1527 | method | `progInit` |
| 1528 | method | `addProgram` |
| 1530 | method | `progNext` |
| 1531 | method | `progDue` |
| 1532 | method | `progApply` |
| 1547 | method | `evInit` |
| 1548 | method | `logEv` |
| 1550 | method | `events` |
| 1552 | method | `evSwitches` |
| 1554 | method | `channelKeys` |
| 1560 | method | `compKeys` |
| 1584 | method | `recMode` |
| 1585 | method | `watchList` |
| 1596 | method | `watchAdd` |
| 1616 | const fn | `g` |
| 1623 | method | `allocRecord` |
| 1636 | const fn | `A` |
| 1644 | method | `V` |
| 1645 | method | `elCurrent` |
| 1649 | method | `portI` |
| 1653 | method | `computeVals` |
| 1687 | method | `partVals` |
| 1712 | method | `watchLists` |
| 1721 | method | `computeWatched` |
| 1730 | method | `fullVals` |
| 1740 | method | `setRecord` |
| 1741 | method | `recordNow` |
| 1752 | method | `closePeriod` |
| 1763 | method | `lastPeriod` |
| 1764 | method | `now` |
| 1766 | method | `hasKey` |
| 1771 | method | `gateOf` |
| 1777 | method | `rawGate` |
| 1788 | method | `carrier` |
| 1791 | method | `shGrid` |
| 1794 | method | `wmCyc` |
| 1795 | method | `shNext` |
| 1797 | method | `sampleHolds` |
| 1802 | method | `samples` |
| 1803 | method | `ctrlEdges` |
| 1809 | method | `scrU` |
| 1810 | method | `scrGate` |
| 1811 | method | `scrEdges` |
| 1812 | method | `setFiring` |
| 1813 | method | `compV` |
| 1814 | method | `compI` |
| 1816 | method | `dbl` |
| 1817 | method | `sampleControllers` |
| 1851 | method | `evalBlocks` |
| 2031 | method | `blkCopy` |
| 2034 | method | `blkAnyDue` |
| 2037 | method | `blkDue` |
| 2039 | method | `zcFrac` |
| 2042 | method | `saveState` |
| 2044 | method | `restoreState` |
| 2053 | method | `snapshot` |
| 2055 | method | `restoreSnapshot` |
| 2057 | method | `gateSigPeek` |
| 2060 | method | `gateSig` |
| 2065 | method | `jumpScheds` |
| 2072 | method | `jumpAt` |
| 2073 | method | `values` |
| 2103 | method | `assemble` |
| 2120 | const fn | `g` |
| 2146 | method | `rhs` |
| 2148 | const fn | `J` |
| 2167 | method | `cplLinearize` |
| 2175 | method | `solverInfo` |
| 2190 | method | `factor` |
| 2212 | method | `baseFromCache` |
| 2215 | const fn | `cnt` |
| 2223 | method | `spAssemble` |
| 2230 | method | `solveOnce` |
| 2245 | method | `solve` |
| 2268 | method | `nlLinearize` |
| 2271 | method | `check` |
| 2291 | method | `commit` |
| 2318 | method | `initialSolve` |
| 2330 | method | `tlSources` |
| 2335 | method | `tlRecord` |
| 2342 | method | `tlHist` |
| 2348 | method | `tlmG` |
| 2352 | method | `tlmSources` |
| 2366 | method | `tlmRecord` |
| 2381 | method | `tlwG` |
| 2387 | method | `tlwSources` |
| 2402 | method | `tlwRecord` |
| 2419 | method | `tlmHist` |
| 2426 | method | `step` |
| 2428 | const fn | `gs` |
| 2434 | method | `stepCore` |
| 2495 | method | `edgeSolve` |
| 2498 | method | `edgePoint` |
| 2499 | method | `mmcMoved` |
| 2502 | method | `arcGate` |
| 2510 | method | `trRestart` |
| 2519 | method | `nextEvent` |
| 2525 | const fn | `sch` |
| 2550 | method | `spwmCut` |
| 2553 | const fn | `sig` |
| 2558 | method | `run` |
| 2561 | method | `runUntil` |
| 2607 | function | `tuneInfo` |
| 2610 | function | `exportForBatch` |
| 2635 | const fn | `hist` |
| 2651 | const fn | `ci` |
| 2652 | const fn | `vd` |
| 2653 | const fn | `V` |
| 2656 | const fn | `linePort` |
| 2658 | const fn | `I` |
| 2659 | const fn | `portRec` |
| 2660 | const fn | `rec` |
| 2678 | const fn | `clkOf` |
| 2704 | function | `sweepPoint` |
| 2709 | function | `setPath` |
| 2715 | function | `eisPoint` |
| 2723 | function | `resume` |

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
| 41 | function | `starPoint` |
| 52 | function | `gridZ` |
| 65 | function | `gridDef` |
| 67 | const fn | `mat` |
| 78 | const fn | `schedOf` |
| 79 | function | `faultDef` |
| 85 | const fn | `sw` |
| 96 | function | `arcSections` |
| 97 | const fn | `S` |
| 105 | function | `arcChain` |
| 109 | function | `arcBreakerDef` |
| 116 | function | `breakerDef` |
| 133 | function | `xfData` |
| 145 | const fn | `libErr` |
| 146 | function | `xfSat` |
| 158 | function | `xfCore` |
| 161 | function | `xfDef` |
| 165 | const fn | `star` |
| 167 | const fn | `ends` |
| 190 | function | `loadDef` |
| 193 | const fn | `starN` |
| 226 | function | `lineData` |
| 230 | function | `lineDef` |
| 232 | const fn | `mat` |
| 260 | function | `aicDef` |
| 293 | const fn | `out` |
| 304 | function | `evcDef` |
| 317 | const fn | `cl` |
| 321 | const fn | `io` |
| 322 | const fn | `E` |
| 376 | const fn | `out` |
| 385 | const fn | `fT` |
| 386 | function | `ctlKit` |
| 388 | const fn | `lag` |
| 390 | const fn | `leadlag` |
| 392 | const fn | `wash` |
| 394 | const fn | `nwLag` |
| 401 | const fn | `sched` |
| 403 | function | `avrDef` |
| 404 | const fn | `io` |
| 405 | const fn | `N` |
| 438 | function | `pssDef` |
| 447 | function | `govDef` |
| 487 | const fn | `out` |
| 494 | function | `footTable` |
| 499 | function | `lpmOf` |
| 501 | function | `msTower` |
| 514 | function | `msFoot` |
| 518 | function | `towerDef` |
| 552 | function | `saiTable` |
| 553 | function | `saiParams` |
| 559 | function | `saiV10` |
| 560 | const fn | `W` |
| 565 | function | `saiFitL1` |
| 570 | function | `saiDef` |
| 577 | const fn | `par` |
| 587 | const fn | `nCells` |
| 588 | function | `chbDef` |
| 590 | const fn | `out` |
| 601 | const fn | `sw` |
| 602 | const fn | `gate` |
| 616 | function | `spllDef` |
| 621 | const fn | `E` |
| 627 | const fn | `w` |
| 639 | function | `ssscDef` |
| 640 | const fn | `io` |
| 641 | const fn | `E` |
| 656 | const fn | `sched` |
| 684 | function | `sssc3Def` |
| 686 | const fn | `sin` |
| 687 | const fn | `E` |
| 690 | const fn | `flt` |
| 705 | const fn | `sched` |
| 719 | const fn | `vf` |
| 748 | function | `mmcDef` |
| 753 | const fn | `sin` |
| 754 | const fn | `w` |
| 760 | const fn | `refs` |
| 762 | const fn | `toU` |
| 763 | const fn | `ccsc` |
| 781 | const fn | `energy` |
| 784 | const fn | `six` |
| 842 | const fn | `arm` |
| 844 | const fn | `sw` |
| 869 | function | `mmccDef` |
| 872 | const fn | `sin` |
| 873 | const fn | `w` |
| 874 | const fn | `pos` |
| 881 | const fn | `dq` |
| 896 | const fn | `integ` |
| 1004 | function | `lcc6Def` |
| 1005 | const fn | `sin` |
| 1033 | function | `lccsDef` |
| 1034 | const fn | `sin` |
| 1040 | const fn | `xf` |
| 1042 | const fn | `br` |
| 1100 | function | `lcccDef` |
| 1101 | const fn | `sin` |
| 1102 | const fn | `pos` |
| 1115 | const fn | `pi` |
| 1145 | function | `filtDef` |
| 1146 | const fn | `pos` |
| 1149 | const fn | `G` |
| 1160 | function | `zserDef` |
| 1177 | function | `sigPorts` |
| 1178 | const fn | `sin` |
| 1180 | const fn | `out` |
| 1182 | const fn | `close` |
| 1186 | const fn | `busMap` |
| 1191 | function | `vsc2Def` |
| 1193 | const fn | `w` |
| 1221 | function | `dcdcDef` |
| 1222 | const fn | `w` |
| 1223 | const fn | `out` |
| 1250 | function | `pmuDef` |
| 1252 | const fn | `out` |
| 1277 | function | `gfmcDef` |
| 1281 | const fn | `w` |
| 1282 | const fn | `pos` |
| 1284 | const fn | `integ` |
| 1295 | const fn | `dq` |
| 1312 | const fn | `at0` |
| 1435 | function | `defOf` |
| 1441 | function | `forceImpl` |
| 1443 | const fn | `fix` |
| 1447 | const fn | `hasLib` |
| 1448 | function | `needs` |
| 1450 | function | `expand` |
| 1452 | const fn | `conv` |
| 1460 | function | `warnings` |
| 1466 | const fn | `cx` |
| 1468 | function | `csolve` |
| 1473 | function | `faultCurrents` |
| 1493 | function | `behindXF` |
| 1504 | function | `layoutDef` |
| 1507 | const fn | `isG` |
| 1508 | const fn | `isJ` |
| 1517 | const fn | `side` |
| 1521 | const fn | `bfs` |
| 1530 | const fn | `bary` |
| 1536 | const fn | `ctr` |
| 1537 | const fn | `target` |
| 1553 | function | `placedDef` |
| 1558 | function | `sidesOf` |

### `web/studio/netview.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 30 | function | `model` |
| 46 | function | `dcModel` |
| 57 | function | `fit` |
| 59 | const fn | `sx` |
| 61 | function | `detail` |
| 62 | function | `pick` |
| 74 | const fn | `near` |
| 84 | const fn | `num` |
| 86 | function | `describe` |
| 101 | function | `draw` |
| 107 | const fn | `seg` |
| 109 | const fn | `mid` |
| 130 | const fn | `lines` |
| 160 | const fn | `put` |
| 172 | function | `routeMid` |
| 176 | function | `graticule` |
| 182 | function | `scaleLen` |
| 183 | function | `scaleBar` |
| 186 | function | `create` |
| 189 | const fn | `size` |
| 194 | const fn | `paint` |
| 195 | const fn | `ask` |
| 196 | const fn | `at` |
| 198 | const fn | `down` |
| 199 | const fn | `move` |
| 203 | const fn | `up` |
| 204 | const fn | `wheel` |
| 205 | const fn | `dbl` |
| 212 | method | `setLayer` |
| 213 | method | `setNames` |
| 214 | method | `fit` |
| 216 | method | `zoom` |
| 219 | method | `goto` |
| 220 | method | `info` |
| 221 | method | `destroy` |

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
| 73 | const fn | `NEUT` |
| 77 | const fn | `neutOf` |
| 79 | const fn | `xfGrp` |
| 80 | const fn | `xfStar` |
| 81 | const fn | `xfNeut` |
| 82 | const fn | `isBus` |
| 84 | const fn | `nIO` |
| 85 | const fn | `ioY` |
| 88 | const fn | `codeIO` |
| 89 | const fn | `codeH` |
| 91 | const fn | `nCells` |
| 92 | const fn | `chbParams` |
| 95 | const fn | `nlcIns` |
| 96 | const fn | `nlcIO` |
| 97 | const fn | `chbxIO` |
| 98 | const fn | `pyIns` |
| 101 | const fn | `nnIns` |
| 102 | const fn | `codeDraw` |
| 108 | const fn | `IMPL` |
| 109 | const fn | `CLOCK` |
| 112 | const fn | `MWIN` |
| 121 | const fn | `mwinF` |
| 128 | function | `subLayout` |
| 130 | const fn | `len` |
| 136 | function | `subDraw` |
| 172 | function | `LPM_PARAMS` |
| 177 | const fn | `isModal` |
| 187 | const fn | `geoOnly` |
| 1336 | function | `noteBox` |
| 1339 | function | `defaults` |
| 1341 | function | `elPins` |
| 1342 | function | `sigPins` |
| 1343 | function | `pinsOf` |
| 1346 | function | `parseMat` |
| 1348 | function | `nPorts` |
| 1349 | function | `portY` |
| 1350 | function | `portPins` |
| 1351 | function | `portBox` |
| 1353 | function | `posDef` |
| 1355 | function | `symmetric` |
| 1356 | function | `matInv` |
| 1361 | function | `klMatrix` |
| 1372 | function | `kgMatrix` |
| 1380 | function | `srmGeo` |
| 1382 | function | `srmSpins` |
| 1384 | function | `srmPins` |
| 1386 | function | `satD` |
| 1387 | function | `satDinv` |
| 1389 | function | `genSpins` |
| 1400 | function | `genTsc` |
| 1405 | function | `genCirc2` |
| 1406 | const fn | `Fn` |
| 1414 | function | `genAxis` |
| 1422 | const fn | `classic` |
| 1428 | const fn | `plist` |
| 1432 | function | `genModel` |
| 1438 | const fn | `w` |
| 1447 | const fn | `grp` |
| 1464 | function | `genGamma` |
| 1472 | function | `genDQ` |
| 1476 | function | `genSteady` |
| 1478 | const fn | `rot` |
| 1485 | function | `srmAlignedPsi` |
| 1486 | function | `srmModelPsi` |
| 1487 | function | `srmTableText` |
| 1490 | function | `srmMag` |
| 1506 | function | `chkMag` |
| 1508 | function | `srmA` |
| 1511 | function | `seg` |
| 1512 | function | `srmPsi` |
| 1514 | function | `srmCur` |
| 1516 | function | `srmTorque` |
| 1519 | function | `srmCoenergy` |
| 1523 | function | `waveShape` |
| 1524 | function | `waveAt` |
| 1527 | function | `waveMeasure` |
| 1530 | const fn | `cross` |
| 1536 | function | `waveFit` |
| 1537 | const fn | `res` |
| 1548 | function | `directWave` |
| 1551 | function | `impulseWave` |
| 1562 | function | `bewley` |
| 1565 | const fn | `at` |
| 1571 | function | `movChar` |
| 1576 | const fn | `pick` |
| 1577 | const fn | `cur` |
| 1578 | const fn | `inv` |
| 1583 | function | `magChar` |
| 1590 | const fn | `cur` |
| 1591 | const fn | `inv` |
| 1594 | function | `pairTable` |
| 1597 | function | `magMeanSq` |
| 1599 | const fn | `P` |
| 1606 | function | `magRms` |
| 1611 | const fn | `g` |
| 1619 | function | `impulseDesign` |
| 1624 | function | `impulseRoots` |
| 1627 | function | `tlParams` |
| 1640 | function | `tlmData` |
| 1642 | function | `tlmM` |
| 1649 | function | `tlmPin` |
| 1650 | function | `tlmPins` |
| 1652 | function | `tlmKey` |
| 1666 | function | `clarkeTi` |
| 1667 | function | `tlcpModel` |
| 1682 | function | `tlmModel` |
| 1690 | function | `lightningWave` |
| 1697 | function | `pinKind` |
| 1708 | function | `structural` |
| 1715 | function | `pinWidth` |
| 1718 | function | `xf` |
| 1719 | function | `pinPos` |
| 1721 | function | `pinDir` |
| 1726 | function | `cpeParams` |
| 1727 | function | `cpeBank` |
| 1731 | function | `cpeZ` |
| 1732 | function | `cpeZbank` |
| 1733 | function | `boxOf` |
| 1734 | function | `bbox` |
| 1739 | function | `fmtNum` |
| 1743 | function | `eng` |
| 1747 | function | `parseEng` |
| 1750 | function | `parseSched` |
| 1758 | function | `machines` |

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
| 135 | function | `svgFrame` |

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
| 21 | const fn | `Study` |
| 27 | function | `folderStart` |
| 30 | const fn | `put` |
| 34 | const fn | `lines` |
| 40 | function | `folderEnd` |
| 45 | function | `defaultKeys` |
| 50 | function | `measure` |
| 62 | function | `decimate` |
| 67 | function | `run` |
| 75 | const fn | `push` |
| 105 | function | `open` |
| 112 | const fn | `index` |
| 119 | function | `session` |
| 120 | function | `setLive` |
| 128 | function | `advance` |
| 140 | function | `closeSession` |
| 143 | function | `tutorial` |
| 145 | function | `tutorials` |
| 147 | function | `handle` |
| 166 | const fn | `sk` |
| 175 | function | `bifPoint` |
| 176 | function | `bifSpec` |
| 180 | function | `bifurcation` |
| 184 | const fn | `json` |

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
| 181 | method | `ingest` |
| 195 | method | `colsOf` |
| 196 | const fn | `put` |
| 205 | method | `archiveFor` |
| 214 | method | `yAuto` |
| 219 | method | `draw` |
| 262 | const fn | `Y` |
| 290 | const fn | `flush` |

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

### `web/studio/split.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 31 | const fn | `isLine` |
| 32 | const fn | `endsOf` |
| 33 | function | `unk` |
| 38 | function | `colsOf` |
| 43 | function | `UF` |
| 44 | const fn | `f` |
| 52 | function | `partition` |
| 58 | const fn | `join` |
| 60 | const fn | `compU` |
| 61 | const fn | `refId` |
| 63 | const fn | `scan` |
| 88 | const fn | `pOf` |
| 97 | const fn | `sigPart` |
| 115 | function | `plan` |
| 145 | const fn | `ringRows` |
| 146 | function | `newLink` |
| 147 | class | `Link` |
| 148 | method | `constructor` |
| 149 | method | `write` |
| 153 | method | `done` |
| 155 | method | `drain` |
| 158 | method | `waitMore` |
| 159 | method | `finished` |
| 163 | function | `attach` |
| 199 | function | `publish` |
| 203 | function | `ready` |
| 205 | function | `fill` |
| 209 | function | `addRow` |
| 212 | function | `smoothFill` |
| 216 | const fn | `at` |
| 223 | function | `farHist` |
| 239 | function | `withSolve` |
| 244 | function | `gather` |
| 249 | function | `stats` |
| 254 | function | `serial` |
| 269 | function | `workers` |
| 273 | const fn | `spawn` |
| 282 | function | `runGroup` |
| 290 | function | `summary` |
| 298 | function | `proposal` |

### `web/studio/split_worker.js`

_(χωρίς συναρτήσεις)_

### `web/studio/splitwin.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 8 | const fn | `esc` |
| 9 | const fn | `eng` |
| 11 | function | `open` |
| 13 | const fn | `close` |

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

### `web/studio/study.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 12 | const fn | `Pa` |
| 16 | function | `unitOf` |
| 25 | function | `kindOf` |
| 27 | function | `channels` |
| 35 | function | `keysFor` |
| 45 | function | `plain` |
| 51 | function | `netlist` |
| 66 | function | `netlistText` |
| 79 | function | `summary` |
| 90 | class | `Recorder` |
| 91 | method | `constructor` |
| 95 | method | `alloc` |
| 96 | method | `push` |
| 100 | method | `take` |
| 103 | method | `events` |
| 104 | method | `stop` |
| 108 | function | `lineModels` |
| 111 | function | `dataInfo` |

### `web/studio/study_worker.js`

_(χωρίς συναρτήσεις)_

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
| 1276 | function | `ieee9Build` |
| 1278 | const fn | `GD` |
| 1279 | const fn | `L` |
| 1284 | const fn | `G` |
| 1285 | const fn | `Ld` |
| 1330 | method | `build` |
| 1340 | method | `build` |
| 1348 | function | `bigGrid` |
| 1349 | const fn | `B` |
| 1351 | const fn | `w` |
| 1373 | method | `build` |
| 1385 | method | `build` |
| 1386 | const fn | `tl` |
| 1418 | method | `build` |
| 1430 | method | `build` |
| 1445 | method | `build` |
| 1464 | method | `build` |
| 1477 | method | `build` |
| 1490 | method | `build` |
| 1491 | const fn | `dev` |
| 1521 | method | `build` |
| 1539 | method | `build` |
| 1557 | method | `build` |
| 1573 | const fn | `LM` |
| 1576 | function | `tlmPart` |
| 1590 | method | `build` |
| 1609 | method | `build` |
| 1629 | function | `tlmGW` |
| 1633 | const fn | `note` |
| 1647 | method | `build` |
| 1667 | const fn | `tl` |
| 1695 | const fn | `PANE` |
| 1716 | function | `gisLines` |
| 1728 | method | `build` |
| 1749 | method | `build` |
| 1773 | method | `build` |
| 1794 | method | `build` |
| 1811 | method | `build` |
| 1813 | const fn | `rig` |
| 1832 | method | `build` |
| 1834 | const fn | `rig` |
| 1854 | function | `xbRig` |
| 1856 | const fn | `bond` |
| 1883 | method | `build` |
| 1918 | function | `ssscChannels` |
| 1927 | method | `build` |
| 1947 | method | `build` |
| 1949 | const fn | `ln` |
| 1983 | method | `build` |
| 1985 | const fn | `sw` |
| 2013 | method | `build` |
| 2017 | const fn | `station` |
| 2070 | method | `build` |
| 2111 | function | `b4Study` |
| 2121 | method | `build` |
| 2125 | const fn | `dcbus` |
| 2131 | const fn | `mmcp` |
| 2132 | const fn | `station` |
| 2196 | method | `build` |
| 2218 | method | `build` |
| 2223 | const fn | `station` |
| 2273 | method | `build` |
| 2310 | const fn | `gfmWire` |
| 2314 | const fn | `busMeter` |
| 2328 | method | `build` |
| 2333 | const fn | `unit` |
| 2356 | method | `build` |
| 2387 | method | `build` |
| 2425 | method | `build` |
| 2470 | method | `build` |
| 2484 | method | `build` |
| 2497 | function | `dcdcInputs` |

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
| 81 | function | `line_action` |
| 94 | function | `study_action` |
| 111 | function | `scenario` |
| 140 | class | `Handler` |
| 142 | method | `Handler.local` |
| 146 | method | `Handler.alive` |
| 156 | method | `Handler.body` |
| 165 | method | `Handler.addon_get` |
| 195 | method | `Handler.addon_post` |
| 222 | method | `Handler.send` |
| 238 | method | `Handler.do_GET` |
| 269 | method | `Handler.do_POST` |
| 336 | function | `main` |

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
| 76 | function | `sat_curve` |
| 86 | function | `sat_i` |
| 96 | function | `mov_seg` |
| 101 | function | `_powr` |
| 107 | function | `mov_cur` |
| 121 | function | `mov_inv` |
| 133 | function | `arc_F` |
| 142 | function | `arc_start` |
| 162 | function | `sat_d` |
| 169 | function | `sat_d_inv` |
| 181 | function | `f2_phi` |
| 200 | function | `_wm_w` |
| 220 | function | `_wm_inc` |
| 250 | function | `_symc` |
| 256 | function | `_wm_out` |
| 293 | function | `_f` |
| 308 | function | `conv_step` |
| 326 | function | `conv_start` |
| 336 | class | `Ctrl` |
| 340 | method | `Ctrl.__init__` |
| 369 | method | `Ctrl.dbl` |
| 372 | method | `Ctrl.raw` |
| 392 | method | `Ctrl.gate` |
| 404 | method | `Ctrl.carrier_at` |
| 415 | method | `Ctrl.edges` |
| 435 | function | `_lut` |
| 446 | function | `eval_ast` |
| 475 | function | `_nn_fwd` |
| 491 | function | `_nn_learn` |
| 534 | function | `_nn_jac` |
| 553 | function | `_nn_step` |
| 581 | function | `lcc_com` |
| 589 | function | `lcc_measure` |
| 645 | function | `nlc_step` |
| 696 | function | `make_python_block` |
| 728 | function | `gap_ub` |
| 739 | function | `lpm_rates` |
| 751 | class | `Circuit` |
| 752 | method | `Circuit.__init__` |
| 1034 | method | `Circuit.R` |
| 1037 | method | `Circuit.im_e` |
| 1046 | method | `Circuit.im_deriv` |
| 1059 | method | `Circuit.sm_cur` |
| 1071 | method | `Circuit.sm_ports` |
| 1076 | method | `Circuit.sm_deriv` |
| 1091 | method | `Circuit.srm_A` |
| 1096 | method | `Circuit._seg` |
| 1100 | method | `Circuit.srm_cur` |
| 1107 | method | `Circuit.srm_torque` |
| 1116 | method | `Circuit.srm_currents` |
| 1121 | method | `Circuit.srm_deriv` |
| 1134 | method | `Circuit.gen_cur` |
| 1151 | method | `Circuit.gen_efd` |
| 1158 | method | `Circuit.gen_tm` |
| 1165 | method | `Circuit.gen_deriv` |
| 1183 | method | `Circuit.jac_gen` |
| 1235 | method | `Circuit.gen_out` |
| 1255 | method | `Circuit.Vsrc` |
| 1271 | method | `Circuit.topo` |
| 1282 | method | `Circuit.build` |
| 1389 | method | `Circuit.bsrc` |
| 1447 | method | `Circuit.sat_cur` |
| 1454 | method | `Circuit.sat_psi` |
| 1464 | method | `Circuit.sat_vtol` |
| 1468 | method | `Circuit.sat_dir` |
| 1486 | method | `Circuit.sat_update` |
| 1533 | method | `Circuit.solve_z` |
| 1577 | method | `Circuit.arc_g` |
| 1582 | method | `Circuit.solve_nl` |
| 1624 | method | `Circuit.tl_hist` |
| 1645 | method | `Circuit.tl_sec` |
| 1654 | method | `Circuit.tl_ih` |
| 1658 | method | `Circuit.tl_record` |
| 1679 | method | `Circuit.tlm_setup` |
| 1774 | method | `Circuit.tlw_setup` |
| 1852 | method | `Circuit.tlw_ix` |
| 1866 | method | `Circuit.tlw_end` |
| 1876 | method | `Circuit.tlm_hist` |
| 1901 | method | `Circuit.tlm_ih` |
| 1914 | method | `Circuit.tlm_force` |
| 1940 | method | `Circuit.tlm_modal` |
| 1959 | method | `Circuit.tlm_record` |
| 1988 | method | `Circuit.scr_u` |
| 1992 | method | `Circuit.scr_gate` |
| 1996 | method | `Circuit.scr_edges` |
| 2003 | method | `Circuit.gate_state` |
| 2016 | method | `Circuit.set_gates` |
| 2024 | method | `Circuit.arc_gates` |
| 2044 | method | `Circuit.may_turn_on` |
| 2048 | method | `Circuit.tolerances` |
| 2054 | method | `Circuit.consistent` |
| 2063 | method | `Circuit._consistent` |
| 2109 | method | `Circuit.value` |
| 2150 | method | `Circuit.current` |
| 2206 | method | `Circuit.prime` |
| 2216 | method | `Circuit.sig_in` |
| 2220 | method | `Circuit.sh_grid` |
| 2234 | method | `Circuit.sh_next` |
| 2241 | method | `Circuit.log_ev` |
| 2247 | method | `Circuit.ev_switches` |
| 2256 | method | `Circuit.sh_sample` |
| 2276 | method | `Circuit.sample` |
| 2351 | method | `Circuit.cmp_f` |
| 2357 | method | `Circuit.blk_due` |
| 2368 | method | `Circuit.eval_blocks` |
| 2941 | method | `Circuit.block_events` |
| 2970 | method | `Circuit.next_event` |
| 3041 | function | `_decimate` |
| 3058 | function | `_diagnose` |
| 3109 | function | `simulate` |
| 3470 | function | `batch_sim` |

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

### `engine/studyfolder.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 42 | function | `home` |
| 47 | function | `now_iso` |
| 51 | function | `_safe` |
| 56 | function | `_write_json` |
| 63 | function | `_read_json` |
| 71 | function | `settings` |
| 85 | function | `save_settings` |
| 101 | function | `settings_clean` |
| 107 | function | `folder` |
| 113 | function | `default_folder` |
| 119 | function | `open_study` |
| 132 | function | `_study_dir` |
| 139 | function | `_run_dir` |
| 149 | function | `list_runs` |
| 165 | function | `_prune` |
| 172 | function | `project_hash` |
| 176 | function | `begin_run` |
| 213 | function | `put` |
| 233 | function | `append` |
| 248 | function | `append_lines` |
| 258 | function | `end_run` |
| 280 | function | `tag_run` |
| 288 | function | `_last_t` |
| 300 | function | `line_hash` |
| 304 | function | `line_models_of` |
| 328 | function | `_model_dir` |
| 337 | function | `lookup_line_model` |
| 357 | function | `store_line_model` |
| 383 | function | `_emtp_file` |
| 404 | function | `_model_report` |
| 431 | function | `summary_html` |
| 490 | class | `Source` |
| 494 | method | `Source.info` |
| 497 | method | `Source.arrays` |
| 502 | class | `RunSource` |
| 505 | method | `RunSource.__init__` |
| 513 | method | `RunSource._mm` |
| 521 | method | `RunSource.info` |
| 528 | method | `RunSource.arrays` |
| 532 | method | `RunSource.events` |
| 544 | class | `EmtpSource` |
| 549 | method | `EmtpSource.__init__` |
| 610 | method | `EmtpSource.info` |
| 615 | method | `EmtpSource.arrays` |
| 620 | class | `PscadSource` |
| 626 | method | `PscadSource.__init__` |
| 654 | method | `PscadSource.info` |
| 659 | method | `PscadSource.arrays` |
| 664 | function | `_numeric_table` |
| 685 | class | `CsvSource` |
| 690 | method | `CsvSource.__init__` |
| 715 | method | `CsvSource.info` |
| 720 | method | `CsvSource.arrays` |
| 725 | function | `_csv_unit` |
| 730 | function | `source` |
| 769 | function | `read_range` |
| 790 | function | `read_diff` |
| 816 | function | `_reduce` |
| 854 | function | `handle` |

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
| 609 | method | `Project._folder_begin` |
| 630 | method | `Project.split` |
| 649 | method | `Project.stream` |
| 731 | method | `Project._result` |
| 738 | method | `Project._query` |
| 750 | method | `Project._run_scipy` |
| 787 | method | `Project.sweep` |
| 861 | method | `Project._sweep_meta` |
| 866 | method | `Project.bifurcation` |
| 923 | class | `_SweepFile` |
| 928 | method | `_SweepFile.__init__` |
| 942 | method | `_SweepFile._val` |
| 950 | method | `_SweepFile._read` |
| 969 | method | `_SweepFile._line` |
| 973 | method | `_SweepFile.add` |
| 977 | method | `_SweepFile.close` |
| 983 | function | `_sweep_point` |
| 991 | function | `_as_list` |
| 1001 | function | `_spec` |
| 1017 | function | `_measures` |
| 1040 | function | `_base_T` |
| 1047 | function | `_unit` |
| 1051 | function | `_matname` |
| 1056 | class | `Result` |
| 1059 | method | `Result.__init__` |
| 1069 | method | `Result.__getitem__` |
| 1072 | method | `Result.__repr__` |
| 1075 | method | `Result.events_csv` |
| 1086 | method | `Result.measure` |
| 1146 | method | `Result.frame` |
| 1155 | method | `Result._meta_lines` |
| 1159 | method | `Result.to_csv` |
| 1172 | method | `Result._vars` |
| 1182 | method | `Result.as_dict` |
| 1186 | method | `Result.to_json` |
| 1190 | method | `Result.to_mat` |
| 1201 | method | `Result.to_parquet` |
| 1209 | method | `Result.to_hdf5` |
| 1215 | method | `Result.save` |
| 1219 | function | `_save` |
| 1226 | class | `SplitResult` |
| 1230 | method | `SplitResult.__init__` |
| 1238 | method | `SplitResult.series` |
| 1243 | method | `SplitResult.__getitem__` |
| 1246 | method | `SplitResult.at` |
| 1257 | method | `SplitResult.__repr__` |
| 1261 | class | `SweepResult` |
| 1264 | method | `SweepResult.__init__` |
| 1270 | method | `SweepResult.__repr__` |
| 1273 | method | `SweepResult.column` |
| 1276 | method | `SweepResult.frame` |
| 1283 | method | `SweepResult.to_csv` |
| 1295 | method | `SweepResult.to_json` |
| 1299 | method | `SweepResult.to_mat` |
| 1306 | method | `SweepResult._columns` |
| 1310 | method | `SweepResult.to_parquet` |
| 1316 | method | `SweepResult.to_hdf5` |
| 1321 | method | `SweepResult.save` |
| 1325 | class | `BifurcationResult` |
| 1329 | method | `BifurcationResult.__init__` |
| 1336 | method | `BifurcationResult.__repr__` |
| 1339 | method | `BifurcationResult.changes` |
| 1348 | method | `BifurcationResult.rows` |
| 1352 | method | `BifurcationResult._columns` |
| 1356 | method | `BifurcationResult.frame` |
| 1363 | method | `BifurcationResult.plot` |
| 1366 | method | `BifurcationResult.to_csv` |
| 1377 | method | `BifurcationResult.to_json` |
| 1381 | method | `BifurcationResult.to_mat` |
| 1387 | method | `BifurcationResult.to_parquet` |
| 1392 | method | `BifurcationResult.to_hdf5` |
| 1397 | method | `BifurcationResult.save` |
| 1408 | function | `_el` |
| 1413 | function | `_matrix` |
| 1418 | function | `_ascii` |
| 1425 | function | `_mat_char` |
| 1430 | function | `_mat_value` |
| 1443 | function | `_savemat` |

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
| 43 | class | `DCGridError` |
| 47 | class | `DCGrid` |
| 50 | method | `DCGrid.__init__` |
| 58 | method | `DCGrid.bus` |
| 66 | method | `DCGrid._bus` |
| 72 | method | `DCGrid.line` |
| 90 | method | `DCGrid.converter` |
| 111 | method | `DCGrid.dcdc` |
| 138 | method | `DCGrid.dispatcher` |
| 158 | method | `DCGrid.remove` |
| 176 | method | `DCGrid.conductance` |
| 193 | method | `DCGrid._parts` |
| 211 | method | `DCGrid.flow` |
| 442 | function | `sensitivity` |
| 467 | function | `station` |
| 484 | function | `station_inverse` |
| 504 | function | `grid_of` |
| 533 | function | `_st` |
| 543 | function | `q_range` |
| 585 | function | `_hold_limits` |
| 638 | function | `acdc_flow` |
| 722 | function | `_station_parts` |
| 727 | function | `acdc_opf` |
| 828 | function | `acdc_contingency` |
| 921 | function | `b4_line_data` |
| 927 | function | `cigre_b4` |
| 955 | function | `b4_network` |

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

### `pcl/geo.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 39 | class | `GeoError` |
| 44 | function | `_point` |
| 54 | function | `haversine` |
| 61 | function | `route_length` |
| 66 | function | `mercator` |
| 73 | function | `of` |
| 78 | function | `attach` |
| 100 | function | `builtin` |
| 108 | function | `coverage` |
| 118 | function | `_ends` |
| 126 | function | `lengths` |
| 146 | function | `_route` |
| 160 | function | `to_geojson` |
| 214 | function | `_features` |
| 233 | function | `from_geojson` |
| 287 | function | `_step` |
| 294 | function | `_deg` |
| 300 | function | `project` |

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
| 42 | class | `HarmonicError` |
| 46 | function | `six_pulse` |
| 63 | function | `spectrum` |
| 81 | function | `spectrum_from` |
| 106 | function | `limits` |
| 114 | function | `_sequence` |
| 119 | class | `Model` |
| 122 | method | `Model.__init__` |
| 167 | method | `Model._load` |
| 183 | method | `Model.branches` |
| 199 | method | `Model.Y` |
| 220 | function | `sources_of` |
| 225 | function | `scan` |
| 243 | function | `run` |

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

### `pcl/insulation.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 67 | function | `_interp` |
| 77 | function | `earth_fault_factor` |
| 96 | function | `truncation` |
| 102 | function | `kcd` |
| 123 | function | `m_si` |
| 127 | function | `ka` |
| 132 | function | `lightning_ucw` |
| 140 | function | `protective_zone` |
| 148 | function | `_phi` |
| 152 | function | `weibull_p` |
| 159 | function | `risk` |
| 175 | function | `statistical_ucw` |
| 190 | function | `required` |
| 196 | function | `convert_range_I` |
| 210 | function | `convert_range_II` |
| 217 | function | `_um_key` |
| 225 | function | `select_level` |
| 246 | function | `arrester` |
| 261 | function | `coordinate` |

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
| 2282 | function | `typical` |
| 2287 | function | `_req_data` |
| 2301 | function | `_req_opts` |
| 2313 | function | `_wb_opts` |
| 2332 | function | `api` |

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
| 48 | class | `ViewError` |
| 53 | function | `_graph` |
| 61 | function | `_components` |
| 69 | function | `_hops` |
| 77 | function | `_tree` |
| 122 | function | `_classical` |
| 138 | function | `_stress` |
| 163 | function | `_stress_sparse` |
| 190 | function | `_spread` |
| 214 | function | `_island` |
| 251 | function | `_dc_parts` |
| 257 | function | `_dcdc` |
| 262 | function | `_with_dc` |
| 279 | function | `layout` |
| 299 | function | `_layout` |
| 329 | function | `view` |
| 394 | function | `_scale` |
| 405 | function | `_num` |
| 413 | function | `values` |
| 711 | function | `_maybe_int` |
| 721 | function | `pack` |
| 755 | function | `_esc` |
| 759 | function | `_segments` |
| 772 | function | `_dc_segments` |
| 788 | function | `_dc_stations` |
| 801 | function | `_col` |
| 806 | function | `svg` |
| 929 | function | `_graticule` |
| 950 | function | `route_mid` |
| 962 | function | `scale_bar` |
| 969 | function | `_scalebar` |
| 978 | function | `dxf` |

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
| 279 | method | `Network._dc` |
| 285 | method | `Network.dc_line` |
| 298 | method | `Network.vsc` |
| 324 | method | `Network.dcdc` |
| 342 | method | `Network.dc_dispatcher` |
| 360 | method | `Network.dc_grid` |
| 365 | method | `Network.acdc_flow` |
| 374 | method | `Network.acdc_opf` |
| 383 | method | `Network.acdc_contingency` |
| 389 | method | `Network.remove` |
| 392 | method | `Network.element` |
| 399 | method | `Network._zb` |
| 403 | method | `Network._ib` |
| 407 | method | `Network._sc_parts` |
| 542 | method | `Network._t3` |
| 577 | method | `Network.impedances` |
| 585 | method | `Network._index` |
| 589 | method | `Network._ybus` |
| 613 | method | `Network._ratios` |
| 648 | method | `Network.short_circuit` |
| 732 | method | `Network._breaking` |
| 764 | method | `Network.iec60909` |
| 769 | method | `Network._lf_model` |
| 885 | method | `Network._sssc_x` |
| 892 | method | `Network.load_flow` |
| 905 | method | `Network._lf_sssc` |
| 934 | method | `Network._lf` |
| 965 | method | `Network._lf_result` |
| 989 | method | `Network._flows` |
| 1014 | method | `Network.case` |
| 1024 | method | `Network.advice` |
| 1033 | method | `Network.power_flow` |
| 1061 | method | `Network.dc_flow` |
| 1069 | method | `Network.ptdf` |
| 1075 | method | `Network.lodf` |
| 1082 | method | `Network.contingency` |
| 1160 | method | `Network.batch_flow` |
| 1200 | method | `Network.report` |
| 1206 | method | `Network.scopf` |
| 1212 | method | `Network.cpf` |
| 1219 | method | `Network.estimate` |
| 1226 | method | `Network.harmonics` |
| 1233 | method | `Network.opf` |
| 1255 | method | `Network.to_emt` |
| 1335 | function | `_coo` |
| 1341 | function | `_zip` |
| 1346 | function | `_solve` |
| 1357 | function | `_nr` |
| 1393 | function | `sssc_placement` |
| 1450 | function | `superposition` |
| 1474 | function | `trv` |
| 1508 | function | `_matrix` |
| 1520 | function | `read_matpower` |
| 1557 | function | `ieee` |
| 1567 | function | `case_data` |
| 1578 | function | `case_solution` |
| 1587 | function | `ieee9` |
| 1614 | function | `ieee14` |
| 1627 | function | `to_dict` |
| 1647 | function | `from_dict` |
| 1675 | function | `save` |
| 1679 | function | `load` |

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
| 441 | function | `_with_acdc` |

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
| 898 | function | `_wrong_side` |
| 908 | function | `_iterate` |
| 971 | function | `_on` |
| 984 | function | `batch` |
| 1059 | function | `_branch_jac` |
| 1075 | function | `contingency_ac` |
| 1181 | function | `without` |
| 1193 | function | `branch_flows` |

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
| 429 | function | `_acdc_opf` |
| 455 | function | `_acdc_n1` |
| 471 | function | `_acdc` |
| 513 | function | `network_report` |
| 692 | function | `_security` |
| 727 | function | `_cpf` |
| 786 | function | `_se` |
| 885 | function | `_harmonic` |
| 945 | function | `_unbalanced` |
| 1022 | function | `_branches` |

### `pcl/results.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 21 | class | `Source` |
| 24 | method | `Source.__init__` |
| 29 | method | `Source.info` |
| 33 | method | `Source.channels` |
| 37 | method | `Source.keys` |
| 40 | method | `Source.read` |
| 55 | method | `Source.range` |
| 59 | method | `Source.events` |
| 62 | method | `Source.to_csv` |
| 71 | method | `Source.__repr__` |
| 76 | function | `open` |
| 81 | function | `runs` |
| 86 | function | `diff` |

### `pcl/rms.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 39 | class | `RMSError` |
| 44 | class | `Kind` |
| 51 | method | `Kind.__init__` |
| 56 | method | `Kind.eval` |
| 60 | class | `Classical` |
| 64 | method | `Classical.init` |
| 71 | method | `Classical.eval` |
| 85 | method | `Classical.power` |
| 90 | class | `TwoAxis` |
| 95 | method | `TwoAxis.init` |
| 111 | method | `TwoAxis.currents` |
| 124 | method | `TwoAxis.eval` |
| 138 | method | `TwoAxis.power` |
| 143 | class | `Source` |
| 147 | method | `Source.init` |
| 153 | method | `Source.eval` |
| 160 | class | `ZIPLoad` |
| 166 | method | `ZIPLoad.init` |
| 170 | method | `ZIPLoad.eval` |
| 190 | class | `System` |
| 200 | method | `System.__init__` |
| 278 | method | `System._y_build` |
| 287 | method | `System._ypat` |
| 292 | method | `System._yreal` |
| 304 | method | `System._split` |
| 307 | method | `System.fg` |
| 331 | method | `System.jac` |
| 365 | method | `System.init` |
| 379 | method | `System.state` |
| 385 | method | `System.internal_emf` |
| 396 | method | `System._apply` |
| 426 | method | `System._consistent` |
| 438 | method | `System.simulate` |
| 509 | method | `System._iter_matrix` |
| 516 | method | `System._step_tr` |
| 529 | method | `System._step_alt` |
| 555 | method | `System._lte` |
| 574 | method | `System.batch` |
| 584 | method | `System.stable` |
| 598 | method | `System.cct` |
| 621 | method | `System.linearize` |
| 635 | method | `System.eigen` |
| 683 | method | `System.reduced_y` |

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
| 53 | class | `SeError` |
| 57 | function | `_class` |
| 61 | function | `_at_bus` |
| 65 | function | `_chi2` |
| 72 | function | `quantities` |
| 113 | function | `_rows` |
| 141 | function | `zero_injection` |
| 148 | function | `measure` |
| 215 | function | `_plant` |
| 243 | function | `tve` |
| 249 | function | `from_emt` |
| 334 | class | `_Problem` |
| 337 | method | `_Problem.__init__` |
| 347 | method | `_Problem.system` |
| 369 | method | `_Problem.factor` |
| 380 | method | `_Problem.solve` |
| 402 | method | `_Problem.omega` |
| 416 | function | `residual_covariance` |
| 424 | function | `_decoupled` |
| 457 | function | `_matrix` |
| 465 | function | `_regular` |
| 477 | function | `observability` |
| 547 | function | `_absolute` |
| 555 | function | `pmu_start` |
| 585 | function | `uncovered` |
| 606 | function | `run` |

### `pcl/study.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 41 | class | `StudyError` |
| 45 | function | `_clean` |
| 64 | function | `_base_network` |
| 85 | function | `_geo_of` |
| 101 | function | `_networks_of` |
| 114 | function | `network_of` |
| 119 | function | `open_file` |
| 136 | function | `_feeder_text` |
| 154 | function | `save_file` |
| 175 | function | `_picture` |
| 192 | function | `_geo_summary` |
| 200 | function | `_study` |
| 271 | function | `summary` |
| 377 | function | `_feeder` |
| 401 | function | `_feeder_summary` |
| 419 | function | `_feeder_run` |
| 444 | function | `_station` |
| 497 | function | `_station_summary` |
| 508 | function | `_station_run` |
| 518 | function | `_station_report` |
| 559 | function | `run` |
| 598 | function | `view` |
| 638 | function | `_stem` |
| 644 | function | `report` |

### `pcl/surge.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 23 | function | `eng` |
| 33 | function | `tl_params` |
| 49 | function | `from_project` |
| 101 | function | `solve` |

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
