# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 116 |
| `web/studio/app.js` | 3810 |
| `web/studio/bus.js` | 197 |
| `web/studio/console.js` | 151 |
| `web/studio/console_worker.js` | 56 |
| `web/studio/ctlwin.js` | 78 |
| `web/studio/dock.js` | 430 |
| `web/studio/editor.js` | 744 |
| `web/studio/expr.js` | 73 |
| `web/studio/inputs.js` | 62 |
| `web/studio/inside.js` | 170 |
| `web/studio/kernels.js` | 30 |
| `web/studio/lblplace.js` | 162 |
| `web/studio/library.js` | 57 |
| `web/studio/linedata.js` | 666 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 92 |
| `web/studio/live_worker.js` | 88 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 2731 |
| `web/studio/model.js` | 137 |
| `web/studio/netlib.js` | 1650 |
| `web/studio/netview.js` | 279 |
| `web/studio/nn.js` | 57 |
| `web/studio/panels.js` | 78 |
| `web/studio/parts.js` | 1792 |
| `web/studio/plotcore.js` | 150 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 87 |
| `web/studio/recview.js` | 84 |
| `web/studio/scenario.js` | 193 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 380 |
| `web/studio/screen.js` | 23 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 165 |
| `web/studio/split.js` | 305 |
| `web/studio/split_worker.js` | 26 |
| `web/studio/splitwin.js` | 45 |
| `web/studio/stepcheck.js` | 315 |
| `web/studio/study.js` | 114 |
| `web/studio/study_worker.js` | 40 |
| `web/studio/subcircuit.js` | 296 |
| `web/studio/templates.js` | 32 |
| `web/studio/trv.js` | 56 |
| `web/studio/tune.js` | 237 |
| `web/studio/tutorials.js` | 2533 |
| `web/studio/units.js` | 164 |
| `web/studio/watch.js` | 338 |
| `web/studio/winframe.js` | 103 |
| `pcl/runner.js` | 27 |
| `run.py` | 385 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/appwin.py` | 115 |
| `engine/batch.py` | 3479 |
| `engine/bidir.py` | 564 |
| `engine/boundary.py` | 97 |
| `engine/circuit.py` | 75 |
| `engine/console.py` | 161 |
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
| `pcl/backend.py` | 280 |
| `pcl/console.py` | 700 |
| `pcl/control.py` | 953 |
| `pcl/core.py` | 1461 |
| `pcl/cpf.py` | 561 |
| `pcl/dcgrid.py` | 980 |
| `pcl/designer.py` | 791 |
| `pcl/equivalent.py` | 1338 |
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
| `pcl/model.py` | 858 |
| `pcl/netfile.py` | 490 |
| `pcl/netview.py` | 1101 |
| `pcl/network.py` | 1699 |
| `pcl/nnstart.py` | 388 |
| `pcl/onnxio.py` | 355 |
| `pcl/opf.py` | 515 |
| `pcl/plotting.py` | 340 |
| `pcl/powerflow.py` | 1203 |
| `pcl/psse.py` | 433 |
| `pcl/report.py` | 1065 |
| `pcl/results.py` | 88 |
| `pcl/rms.py` | 704 |
| `pcl/scopf.py` | 213 |
| `pcl/se.py` | 788 |
| `pcl/study.py` | 810 |
| `pcl/surge.py` | 184 |
| `pcl/trv.py` | 433 |
| `pcl/unbalanced.py` | 525 |
| `pcl/wideband.py` | 1279 |
| `pcl/workbench.py` | 485 |
| `tests/test_acdc_opf.py` | 111 |
| `tests/test_addons.py` | 258 |
| `tests/test_advanced.py` | 120 |
| `tests/test_api.py` | 73 |
| `tests/test_api_surface.py` | 455 |
| `tests/test_appwin.py` | 122 |
| `tests/test_arc.py` | 189 |
| `tests/test_b4.py` | 300 |
| `tests/test_backend.py` | 263 |
| `tests/test_batch.py` | 255 |
| `tests/test_bidir_engine.py` | 103 |
| `tests/test_bidir_sim.py` | 70 |
| `tests/test_big.py` | 71 |
| `tests/test_boundary.py` | 50 |
| `tests/test_bus.py` | 145 |
| `tests/test_console.py` | 343 |
| `tests/test_control.py` | 213 |
| `tests/test_cp_modal.py` | 102 |
| `tests/test_cpf.py` | 401 |
| `tests/test_ctlwin.py` | 147 |
| `tests/test_dcdc.py` | 96 |
| `tests/test_dcgrid.py` | 735 |
| `tests/test_derivation.py` | 93 |
| `tests/test_designer.py` | 200 |
| `tests/test_dock.py` | 198 |
| `tests/test_emt_harmonic.py` | 139 |
| `tests/test_emt_se.py` | 141 |
| `tests/test_engine.py` | 276 |
| `tests/test_equivalent.py` | 772 |
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
| `tests/test_guide.py` | 348 |
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
| `tests/test_model.py` | 344 |
| `tests/test_netfile.py` | 236 |
| `tests/test_netlib.py` | 209 |
| `tests/test_netview.py` | 429 |
| `tests/test_network.py` | 272 |
| `tests/test_neutral.py` | 76 |
| `tests/test_nn.py` | 130 |
| `tests/test_nnstart.py` | 315 |
| `tests/test_opf.py` | 262 |
| `tests/test_parallel.py` | 159 |
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
| `tests/js/console_cases.js` | 23 |
| `tests/js/cp_cases.js` | 58 |
| `tests/js/ctl_cases.js` | 33 |
| `tests/js/dcdc_cases.js` | 13 |
| `tests/js/dock_cases.js` | 83 |
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
| `tests/js/model_cases.js` | 30 |
| `tests/js/mtdc_cases.js` | 13 |
| `tests/js/netlib42_cases.js` | 50 |
| `tests/js/netlib_cases.js` | 93 |
| `tests/js/netview_cases.js` | 123 |
| `tests/js/neut_cases.js` | 92 |
| `tests/js/nn_cases.js` | 48 |
| `tests/js/pieces_cases.js` | 45 |
| `tests/js/plotcore_cases.js` | 34 |
| `tests/js/pmu_cases.js` | 21 |
| `tests/js/refac_cases.js` | 68 |
| `tests/js/rms_emt_cases.js` | 11 |
| `tests/js/robust_cases.js` | 17 |
| `tests/js/sat_cases.js` | 149 |
| `tests/js/screen_cases.js` | 37 |
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
| `tests/ui/dock_flow.js` | 338 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/ev_flow.js` | 112 |
| `tests/ui/facts_flow.js` | 93 |
| `tests/ui/features_flow.js` | 413 |
| `tests/ui/gis_flow.js` | 80 |
| `tests/ui/line_flow.js` | 166 |
| `tests/ui/live_flow.js` | 41 |
| `tests/ui/perf_flow.js` | 68 |
| `tests/ui/scenario_flow.js` | 92 |
| `tests/ui/scope_flow.js` | 198 |
| `tests/ui/speed_flow.js` | 104 |
| `tests/ui/step_flow.js` | 91 |
| `tests/ui/studio_flow.js` | 45 |
| `tests/ui/study_flow.js` | 60 |
| `tests/ui/subcircuit_flow.js` | 79 |
| `tests/ui/ux_flow.js` | 94 |
| `tests/ui/watch_flow.js` | 113 |
| `tests/ui/window_flow.js` | 174 |
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
| 807 | `EQV3` | Ισοδύναμο δικτύου πολλών θυρών (CIGRE TB 39, Σχ. 15) |
| 826 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 835 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 845 | `ARCX` | Τμήμα τόξου |
| 849 | `ARC` | Διακόπτης με τόξο (μονοφασικός) |
| 856 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 881 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 929 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 943 | `TLM` | Γραμμή από γεωμετρία (CP / FD / WB) |
| 981 | `TOWER` | Πύργος γραμμής (κεραυνοί) |
| 1005 | `SAI` | Αλεξικέραυνο ZnO, μοντέλο IEEE (εξαρτάται από τη συχνότητα) |
| 1020 | `SAIX` | Αλεξικέραυνο IEEE (συμπαγές) |
| 1024 | `RFX` | Γείωση πύργου R(I) (από τη γραμμή του πύργου) |
| 1030 | `CHB` | Αρθρωτός βραχίονας: γέφυρες H σε σειρά (CHB) |
| 1038 | `NLC` | Διαμόρφωση πλησιέστερης στάθμης (NLC) με ταξινόμηση |
| 1044 | `SPLL` | PLL μονοφασικό (SOGI) |
| 1051 | `SSSC` | Έλεγχος αρθρωτού SSSC (m-SSSC) |
| 1070 | `SSSC3` | Κεντρικός έλεγχος τριφασικού m-SSSC |
| 1094 | `MMC` | Μετατροπέας MMC (HVDC, μοντέλα 1–4) |
| 1123 | `MMCC` | Έλεγχος σταθμού MMC (HVDC) |
| 1171 | `VSC2` | Μετατροπέας VSC δύο επιπέδων (μέσο μοντέλο, φίλτρο L ή LC) |
| 1186 | `DCDC` | Μετατροπέας DC/DC (μέσο μοντέλο, χωρίς απώλειες) |
| 1202 | `PMU3` | Μονάδα μέτρησης φασιθετών (PMU, θετική ακολουθία) |
| 1214 | `GFMC` | Έλεγχος grid-forming (στατικότητα, VSM, PSC, dVOC, matching) |
| 1264 | `LCC6` | Γέφυρα θυρίστορ 6 παλμών (LCC) |
| 1280 | `LCCS` | Σταθμός LCC 12 παλμών (HVDC) |
| 1295 | `LCCC` | Έλεγχος σταθμού LCC (HVDC) |
| 1320 | `FILT3` | Φίλτρο AC τριφασικό |
| 1326 | `ZSER3` | Τριφασική εμπέδηση σειράς (R + L + (R + L) ∥ R) |
| 1332 | `LCCX` | Γέφυρα 6 παλμών (συμπαγής) |
| 1337 | `LCCM` | Μέτρηση α και γ (γέφυρα 6 παλμών) |
| 1342 | `MMCA` | Βραχίονας MMC (συμπαγής) |
| 1347 | `CHBX` | Αρθρωτός βραχίονας (συμπαγής) |
| 1350 | `SPLX` | PLL μονοφασικό (SOGI, συμπαγές) |
| 1354 | `NOTE` | Σημείωση (κείμενο στο σχέδιο) |

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
| 1348 | `ieee9_eq` | Συστήματα ισχύος (4.3) | Το υπόλοιπο δίκτυο ως ισοδύναμο σε EMT (CIGRE TB 39, Σχ. 15): η περιοχή του ζυγού 4 στο IEEE 9 |
| 1397 | `big_grid` | Μεγάλα δίκτυα (4.19.3) | Πλέγμα k × k ζυγών σε EMT: ο γραμμικός λύτης σε μεγάλο δίκτυο |
| 1410 | `multirate_lines` | Μεγάλα δίκτυα (4.24) | Πολλαπλοί ρυθμοί: γρήγορο και αργά υποδίκτυα με γραμμές ανάμεσα |
| 1437 | `pf_study` | Ροή φορτίου και OPF (4.19.1) | Ροή φορτίου και N−1 σε δίκτυα IEEE |
| 1449 | `opf_study` | Ροή φορτίου και OPF (4.19.1) | Βέλτιστη ροή φορτίου (OPF) σε δίκτυα IEEE |
| 1463 | `cpf_study` | Ροή φορτίου και OPF (4.19.1) | Ευστάθεια τάσης: καμπύλη P–V και περιθώριο φόρτισης (συνεχιζόμενη ροή φορτίου) |
| 1479 | `se_study` | Ροή φορτίου και OPF (4.19.1) | Εκτίμηση κατάστασης: μετρήσεις με σφάλματα και εντοπισμός των λανθασμένων |
| 1500 | `acdc_study` | Ροή φορτίου και OPF (4.19.1) | Δίκτυο AC/DC: όρια σταθμών, βέλτιστη ροή φορτίου AC/DC, N−1 AC/DC |
| 1513 | `harm_emt` | Ροή φορτίου και OPF (4.19.1) | Φάσμα από το EMT για την αρμονική ροή φορτίου: γέφυρα 6 παλμών με μετάβαση |
| 1536 | `harm_study` | Ροή φορτίου και OPF (4.19.1) | Αρμονικές: παραμόρφωση τάσης και συντονισμοί (αρμονική ροή φορτίου) |
| 1556 | `unb_study` | Ροή φορτίου και OPF (4.19.1) | Ασύμμετρη ροή φορτίου: ένας τροφοδότης διανομής φάση προς φάση |
| 1582 | `ieee9_sssc` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | IEEE 9 ζυγών σε EMT με τριφασικό m-SSSC (κεντρικός έλεγχος) |
| 1612 | `trv_terminal` | Διακόπτες ισχύος (4.9) | TRV σε σφάλμα ακροδεκτών: IEC 62271-100 |
| 1633 | `trv_slf` | Διακόπτες ισχύος (4.9) | Σφάλμα κοντινής γραμμής και τόξο του διακόπτη |
| 1664 | `lightning_gis` | Κεραυνοί και συντονισμός μόνωσης (4.9) | Κεραυνός σε γραμμή 400 kV δίπλα σε υποσταθμό GIS: συντονισμός μόνωσης |
| 1754 | `gis765_lv` | Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22) | GIS 765 kV: δοκιμή με βηματική τάση 100 V (IEC TR 60071-4, περίπτωση 4) |
| 1772 | `gis_vfto` | Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22) | Πολύ γρήγορα μεταβατικά (VFTO) από τον αποζεύκτη ενός GIS 800 kV |
| 1797 | `ds_restrike` | Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22) | Αποζεύκτης GIS 420 kV: επαναναύσεις στο κλείσιμο και στο άνοιγμα |
| 1819 | `insco_study` | Υποσταθμός GIS και πολύ γρήγορα μεταβατικά (4.22) | Συντονισμός μόνωσης υποσταθμού κατά IEC 60071-2 (με αναφορά) |
| 1836 | `line_fd` | Γραμμές (4.4) | Ζεύξη γραμμής 400 kV: σταθερές παράμετροι (CP) και εξάρτηση από τη συχνότητα (FD) |
| 1857 | `cable_fd` | Καλώδια (4.5) | Ζεύξη υποβρύχιου καλωδίου 220 kV: CP και FD |
| 1906 | `cable_xb` | Καλώδια: wideband και cross-bonding (4.13) | Υπόγειο καλώδιο 150 kV με cross-bonding: αναλυτικό και ομογενές μοντέλο |
| 1949 | `sssc_1ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε γραμμή (μονοφασικό) |
| 1969 | `sssc_3ph` | FACTS: αρθρωτός SSSC (4.10) | Αρθρωτός SSSC σε δίκτυο 150 kV (τριφασικό, 4 ζυγοί) |
| 2007 | `ccsc_1ph` | FACTS: CCSC και IEEE 9 με m-SSSC (4.17) | CCSC: πυκνωτής σειράς ελεγχόμενος από μετατροπέα (μονοφασικό) |
| 2035 | `hvdc_mmc` | HVDC: MMC (4.14) | Σύνδεση HVDC με MMC σημείο προς σημείο (±320 kV, 1000 MW) |
| 2091 | `mtdc5` | Δίκτυα DC πολλών τερματικών (4.20) | Δίκτυο DC πέντε τερματικών με στατικότητα τάσης (EMT και ροή φορτίου AC/DC) |
| 2146 | `b4dcs2` | Δίκτυα DC πολλών τερματικών (4.20) | Το DCS2 του B4 της CIGRE: πέντε τερματικά ±200 kV με σταθμούς MMC (EMT και ροή φορτίου) |
| 2218 | `dcdc_ex303` | Δίκτυα DC πολλών τερματικών (4.20) | Μετατροπέας DC/DC ανάμεσα σε δύο δίκτυα DC 370 και 400 kV (Παράδειγμα 30.3) |
| 2238 | `hvdc_gfm` | Grid-forming (4.18.1) | Σταθμός MMC ως grid-forming: νησίδα, ασθενές δίκτυο, παράλληλα με άλλη μονάδα |
| 2296 | `hvdc_lcc` | HVDC: LCC (4.16) | Το πρώτο benchmark HVDC της CIGRE (LCC 12 παλμών, 500 kV, 1000 MW) |
| 2350 | `gfm_island` | Grid-forming (4.18) | Νησίδα με δύο μετατροπείς grid-forming: μοιρασιά του φορτίου με τη στατικότητα |
| 2381 | `gfm_sync` | Grid-forming (4.18) | Synchronverter: αντιστροφέας που μιμείται σύγχρονη γεννήτρια (Zhong & Weiss 2011) |
| 2409 | `gfm_weak` | Grid-forming (4.18) | Συγχρονισμός μέσω ισχύος (PSC) σε ασθενές δίκτυο, απέναντι στον έλεγχο ρεύματος με PLL |
| 2448 | `ieee9_gfm` | Grid-forming (4.18.1) | IEEE 9 με μετατροπέα στη θέση της G3: grid-forming ή grid-following (nadir, RoCoF) |
| 2499 | `empty` | Νέο | Κενό κύκλωμα |
| 2505 | `xf_inrush` | Μετασχηματιστές (5.0.1) | Ζεύξη μετασχηματιστή: ρεύμα ζεύξης και παραμένουσα ροή |

## API του server (`run.py`, `/api/<action>`)

`accel_info`, `analyze`, `batch_sim`, `bidir`, `boundary`, `capacitance`, `curves`, `derivation`, `design`, `envelope`, `inverse`, `line_export`, `line_load`, `line_model`, `line_scan`, `line_sens`, `linearize`, `model_proof`, `network_area`, `network_open`, `network_report`, `network_save`, `network_study`, `network_view`, `problem`, `scenario_run`, `scenario_sweep`, `solve`, `studio_math`, `sweep`, `switching`, `template_solve`, `validate_circuit`

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
| 5 | const fn | `$` |
| 8 | const fn | `frame` |
| 10 | const fn | `esc` |
| 18 | function | `loadSettings` |
| 19 | function | `saveSettings` |
| 22 | function | `notice` |
| 23 | function | `warnings` |
| 26 | function | `project` |
| 27 | function | `buildSim` |
| 44 | function | `lineCtx` |
| 45 | function | `play` |
| 46 | function | `pause` |
| 47 | function | `reset` |
| 51 | function | `linkAdvance` |
| 59 | function | `linkReset` |
| 60 | function | `stepT` |
| 67 | function | `applyRec` |
| 73 | function | `memAuto` |
| 74 | function | `memChoice` |
| 75 | function | `memSetting` |
| 76 | const fn | `fmtDur` |
| 77 | function | `memEstimate` |
| 82 | function | `recArchive` |
| 85 | function | `recSettings` |
| 87 | function | `renderRecPanel` |
| 101 | function | `renderRec` |
| 103 | function | `recToggle` |
| 114 | function | `recCollect` |
| 119 | function | `recFlush` |
| 131 | function | `studySettings` |
| 133 | function | `studyEstimate` |
| 135 | function | `renderStudy` |
| 137 | const fn | `o` |
| 146 | const fn | `g` |
| 152 | function | `renderStudyBtn` |
| 153 | function | `studyView` |
| 154 | function | `studyRun` |
| 172 | function | `pyPage` |
| 176 | function | `runToEnd` |
| 179 | const fn | `chunk` |
| 181 | function | `loop` |
| 209 | function | `draw` |
| 211 | function | `setText` |
| 212 | function | `navRange` |
| 213 | function | `updateClock` |
| 217 | function | `liveOf` |
| 263 | function | `blkUnit` |
| 282 | function | `outsOf` |
| 284 | const fn | `vecN` |
| 286 | function | `chanLabel` |
| 296 | function | `chanSrc` |
| 297 | function | `addProbe` |
| 298 | function | `flash` |
| 350 | function | `signalsFor` |
| 367 | const fn | `fold` |
| 369 | function | `fillSignals` |
| 376 | function | `renderChannels` |
| 400 | function | `renderSel` |
| 405 | function | `selCSV` |
| 409 | function | `paneMode` |
| 410 | function | `paneCfgHTML` |
| 411 | const fn | `r` |
| 423 | function | `paneCfgApply` |
| 425 | const fn | `keep` |
| 437 | function | `openPaneCfg` |
| 445 | function | `requestMeasure` |
| 446 | function | `renderMeasure` |
| 458 | function | `MeasureUnit` |
| 461 | function | `simKey` |
| 462 | function | `perSeries` |
| 463 | function | `refFor` |
| 464 | const fn | `sched` |
| 468 | function | `metricsFor` |
| 472 | function | `metricsRows` |
| 477 | function | `eventMetricsHTML` |
| 479 | function | `renderMetricsPanel` |
| 490 | function | `rawSeries` |
| 493 | function | `autoF1` |
| 497 | function | `evRows` |
| 499 | function | `renderEvents` |
| 501 | const fn | `fv` |
| 507 | function | `evMaxSetting` |
| 508 | function | `eventsJson` |
| 509 | function | `eventsCsv` |
| 511 | function | `renderFFT` |
| 534 | function | `cellZ` |
| 536 | function | `renderEISForm` |
| 537 | const fn | `opt` |
| 541 | function | `runEIS` |
| 549 | function | `drawEIS` |
| 568 | function | `perSamples` |
| 570 | function | `periodText` |
| 571 | const fn | `svgPlot` |
| 573 | function | `pcmMapFn` |
| 575 | const fn | `z` |
| 578 | function | `renderPoincare` |
| 594 | function | `bfParams` |
| 596 | function | `renderBifurcationForm` |
| 602 | function | `runBifurcation` |
| 616 | function | `stopBifurcation` |
| 617 | function | `drawBifurcation` |
| 627 | function | `niceTop` |
| 630 | function | `btStatus` |
| 631 | function | `parseStep` |
| 632 | function | `runBatch` |
| 648 | function | `clearBatch` |
| 650 | function | `meanPL` |
| 652 | function | `ringTrace` |
| 654 | function | `compareHTML` |
| 664 | function | `renderBatch` |
| 669 | function | `parseCSV` |
| 671 | const fn | `cells` |
| 672 | const fn | `num` |
| 678 | const fn | `normName` |
| 679 | function | `renderCsvMap` |
| 680 | const fn | `auto` |
| 686 | function | `applyCsv` |
| 691 | function | `renderCsv` |
| 693 | function | `clearCsv` |
| 695 | function | `sampleCompareHTML` |
| 711 | function | `pwmGainsText` |
| 718 | function | `toggleInput` |
| 721 | function | `setInputMeta` |
| 725 | function | `inputsHTML` |
| 726 | const fn | `val` |
| 735 | function | `liveChange` |
| 737 | function | `renderLiveLog` |
| 746 | function | `changesToSchedule` |
| 748 | const fn | `f` |
| 757 | function | `updateLivePanel` |
| 762 | function | `setLivePanel` |
| 765 | function | `switchesOf` |
| 768 | function | `addPulses` |
| 770 | function | `pulseKeys` |
| 771 | function | `refreshControls` |
| 774 | const fn | `phase` |
| 808 | const fn | `setD` |
| 824 | const fn | `setPh` |
| 836 | const fn | `pinNow` |
| 847 | const fn | `pinSet` |
| 859 | function | `pinMap` |
| 860 | function | `pinX` |
| 861 | function | `pinV` |
| 867 | function | `liveParam` |
| 882 | function | `closeInspector` |
| 883 | function | `placePopup` |
| 886 | function | `fieldValue` |
| 891 | function | `fieldHTML` |
| 906 | function | `placeAt` |
| 907 | function | `popupDrag` |
| 916 | function | `nnBlock` |
| 917 | function | `nnBox` |
| 920 | function | `nnLearned` |
| 921 | function | `openInspector` |
| 929 | const fn | `wired` |
| 939 | const fn | `same` |
| 940 | const fn | `apply` |
| 955 | function | `ctlCtx` |
| 963 | function | `splitProposal` |
| 965 | function | `openSplitWin` |
| 968 | const fn | `single` |
| 971 | function | `openCtlWin` |
| 975 | const fn | `wireWidth` |
| 976 | function | `openWireInspector` |
| 993 | const fn | `numOf` |
| 999 | function | `psec` |
| 1001 | function | `propsOpen` |
| 1002 | function | `setProps` |
| 1004 | function | `focusComp` |
| 1005 | function | `togglePin` |
| 1008 | function | `renderProps` |
| 1017 | function | `propsComp` |
| 1018 | const fn | `secOf` |
| 1020 | const fn | `exprV` |
| 1021 | const fn | `inpB` |
| 1022 | const fn | `row` |
| 1028 | const fn | `wired` |
| 1042 | function | `propsJunc` |
| 1044 | function | `propsWire` |
| 1050 | function | `propsMulti` |
| 1053 | function | `propsCircuit` |
| 1065 | const fn | `opt` |
| 1075 | const fn | `sv` |
| 1111 | const fn | `chk` |
| 1128 | function | `dmModel` |
| 1129 | function | `dmKey` |
| 1132 | function | `dmSection` |
| 1136 | function | `dmHTML` |
| 1143 | const fn | `sel` |
| 1163 | function | `bindDm` |
| 1168 | function | `dmLabels` |
| 1176 | function | `dmRun` |
| 1180 | function | `dmAct` |
| 1183 | function | `bindProps` |
| 1220 | function | `diagItems` |
| 1229 | function | `renderDiag` |
| 1240 | function | `openDiag` |
| 1241 | function | `flashComp` |
| 1249 | function | `stepAdvice` |
| 1261 | function | `stepAdviceShow` |
| 1262 | function | `scheduleStepCheck` |
| 1263 | function | `runStepCheck` |
| 1264 | const fn | `inPage` |
| 1271 | function | `syncStepMode` |
| 1333 | function | `scenSetCode` |
| 1334 | function | `scenState` |
| 1335 | function | `scenTab` |
| 1336 | function | `scenOut` |
| 1337 | function | `scenWorker` |
| 1339 | function | `scenRun` |
| 1347 | function | `scenStop` |
| 1348 | function | `scenDone` |
| 1350 | function | `scenMsg` |
| 1365 | function | `scenBatch` |
| 1370 | function | `scenEval` |
| 1373 | function | `addonDock` |
| 1380 | function | `renderAddons` |
| 1381 | const fn | `vsel` |
| 1395 | function | `knockToast` |
| 1398 | function | `initAddons` |
| 1405 | function | `scenBatchWrite` |
| 1408 | function | `renderScenFiles` |
| 1411 | const fn | `scenNum` |
| 1412 | function | `scenTable` |
| 1413 | function | `scenShow` |
| 1426 | function | `scenTicks` |
| 1427 | function | `scenPlot` |
| 1431 | const fn | `thin` |
| 1438 | const fn | `dig` |
| 1452 | function | `cmdShow` |
| 1462 | function | `cmdScope` |
| 1464 | function | `initConsole` |
| 1466 | function | `initScenarios` |
| 1473 | function | `liveApply` |
| 1476 | function | `closeMenu` |
| 1477 | function | `openMenu` |
| 1507 | const fn | `PS_WORD` |
| 1509 | const fn | `psSym` |
| 1510 | function | `pinScopeOf` |
| 1513 | const fn | `word` |
| 1526 | const fn | `side` |
| 1528 | const fn | `inScope` |
| 1530 | function | `liveVal` |
| 1532 | function | `scopeToggle` |
| 1534 | function | `openScopeSub` |
| 1546 | function | `pinScopeHtml` |
| 1547 | const fn | `chip` |
| 1548 | const fn | `pin` |
| 1550 | const fn | `col` |
| 1558 | function | `pinScopeTick` |
| 1564 | function | `openPinScope` |
| 1578 | function | `closePinScope` |
| 1582 | function | `updateHover` |
| 1600 | const fn | `atTop` |
| 1601 | function | `topDoc` |
| 1602 | function | `defsOf` |
| 1603 | const fn | `pid` |
| 1604 | function | `fullDoc` |
| 1606 | function | `commitView` |
| 1608 | function | `viewDiag` |
| 1609 | const fn | `rel` |
| 1612 | function | `compAt` |
| 1617 | function | `allComps` |
| 1618 | const fn | `walk` |
| 1624 | function | `partDef` |
| 1626 | function | `pdefaults` |
| 1627 | function | `subParams` |
| 1629 | function | `placeOk` |
| 1631 | function | `renameChannels` |
| 1633 | function | `levelDoc` |
| 1634 | function | `applyLevel` |
| 1635 | function | `groupSel` |
| 1640 | function | `expandSub` |
| 1644 | function | `libToSub` |
| 1646 | function | `uniqueSub` |
| 1647 | function | `subMenu` |
| 1651 | function | `enterSub` |
| 1657 | function | `leaveSub` |
| 1663 | function | `renderCrumbs` |
| 1671 | function | `curDef` |
| 1672 | function | `publicOf` |
| 1673 | function | `togglePublic` |
| 1681 | function | `propsSub` |
| 1689 | function | `bindSub` |
| 1697 | function | `propsDef` |
| 1712 | function | `bindDef` |
| 1728 | function | `exportDef` |
| 1730 | function | `importDefs` |
| 1741 | function | `palLoad` |
| 1742 | function | `palSave` |
| 1743 | function | `palRecent` |
| 1744 | function | `palItem` |
| 1748 | function | `renderPalette` |
| 1756 | const fn | `isOpen` |
| 1770 | function | `tutorial` |
| 1773 | function | `circuitSig` |
| 1783 | function | `tutorialRef` |
| 1784 | function | `theoryValidity` |
| 1790 | function | `staleBanner` |
| 1793 | function | `bindRestore` |
| 1794 | function | `loadTutorial` |
| 1802 | function | `migrateFile` |
| 1805 | function | `applyProject` |
| 1816 | function | `renderTutorial` |
| 1826 | function | `gallery` |
| 1832 | function | `api` |
| 1833 | function | `paramsOf` |
| 1836 | function | `avgOver` |
| 1839 | function | `simValue` |
| 1845 | function | `lastPP` |
| 1847 | function | `runTheory` |
| 1860 | function | `cmpRows` |
| 1861 | function | `stepsHTML` |
| 1862 | function | `renderTheory` |
| 1894 | function | `rippleDev` |
| 1896 | function | `periodAvgAt` |
| 1898 | function | `samplingTheory` |
| 1907 | const fn | `lastAt` |
| 1929 | function | `polyTheory` |
| 1936 | const fn | `frac` |
| 1965 | function | `lastPeriods` |
| 1966 | function | `evalOrderHTML` |
| 1975 | function | `genScTheory` |
| 1977 | const fn | `Iac` |
| 1985 | function | `shaftModes` |
| 1992 | function | `fbmTheory` |
| 2000 | function | `ieee9Theory` |
| 2009 | function | `ieee9EqTheory` |
| 2021 | function | `schedNow` |
| 2023 | function | `fundOf` |
| 2029 | function | `ssscNet3` |
| 2030 | const fn | `c` |
| 2033 | const fn | `ser` |
| 2034 | const fn | `ln` |
| 2042 | function | `ssscTheory` |
| 2077 | function | `ccscTheory` |
| 2082 | const fn | `cm` |
| 2084 | const fn | `dev` |
| 2087 | const fn | `lineI` |
| 2108 | function | `ieee9ssscTheory` |
| 2123 | function | `hvdcTheory` |
| 2148 | function | `gfmIslandDvoc` |
| 2161 | function | `gfmTheory` |
| 2203 | function | `ieee9GfmTheory` |
| 2222 | function | `hvdcGfmTheory` |
| 2235 | function | `lccTheory` |
| 2236 | const fn | `st` |
| 2242 | const fn | `g` |
| 2254 | function | `wbModelHTML` |
| 2262 | function | `cableXbTheory` |
| 2263 | const fn | `rms` |
| 2264 | const fn | `pk` |
| 2276 | const fn | `v` |
| 2281 | function | `lineFdTheory` |
| 2282 | const fn | `lab` |
| 2290 | const fn | `pk` |
| 2297 | function | `trvAfterZero` |
| 2303 | function | `trvSvg` |
| 2305 | const fn | `path` |
| 2312 | function | `trvTerminalTheory` |
| 2325 | function | `trvSlfTheory` |
| 2345 | function | `lightningTheory` |
| 2347 | const fn | `pk` |
| 2368 | function | `gisPeaks` |
| 2369 | function | `atT` |
| 2371 | function | `gisPath` |
| 2375 | function | `gis765Theory` |
| 2386 | function | `gisVftoTheory` |
| 2395 | function | `dsRestrikeTheory` |
| 2410 | function | `inscoHTML` |
| 2421 | function | `inscoAct` |
| 2426 | function | `inscoTheory` |
| 2432 | function | `netFaultTheory` |
| 2451 | function | `inrushTheory` |
| 2465 | function | `busDqTheory` |
| 2473 | function | `subLegsTheory` |
| 2485 | function | `currentCtlTheory` |
| 2492 | const fn | `R` |
| 2495 | const fn | `over` |
| 2505 | const fn | `row` |
| 2511 | function | `blocksTheory` |
| 2526 | function | `pcmTheory` |
| 2552 | function | `codeTheory` |
| 2562 | function | `eisTheory` |
| 2564 | const fn | `ser` |
| 2577 | function | `imSteady` |
| 2580 | function | `imPar` |
| 2581 | function | `phaseRms` |
| 2582 | function | `vfTheory` |
| 2595 | function | `focTheory` |
| 2612 | function | `synTheory` |
| 2631 | const fn | `need` |
| 2651 | function | `pmTheory` |
| 2653 | const fn | `mtpa` |
| 2669 | function | `srmTheory` |
| 2684 | const fn | `curve` |
| 2695 | function | `lgTheory` |
| 2706 | const fn | `cr` |
| 2713 | function | `chaosTheory` |
| 2728 | function | `nnCycles` |
| 2731 | function | `genCtlTheory` |
| 2744 | function | `evTheory` |
| 2758 | function | `nnTheory` |
| 2775 | function | `nnGuiCode` |
| 2781 | function | `runNNCompare` |
| 2789 | function | `dcDriveTheory` |
| 2790 | const fn | `per` |
| 2791 | const fn | `cross` |
| 2821 | function | `twModel` |
| 2824 | const fn | `g` |
| 2827 | function | `twLattice` |
| 2834 | const fn | `marks` |
| 2837 | function | `twTheory` |
| 2845 | const fn | `at` |
| 2862 | function | `arTheory` |
| 2882 | function | `impulseMeasure` |
| 2884 | const fn | `cross` |
| 2887 | function | `marxTheory` |
| 2905 | function | `chopModel` |
| 2908 | const fn | `f` |
| 2911 | function | `chopTheory` |
| 2925 | function | `cmp3` |
| 2929 | function | `hvExact` |
| 2930 | function | `hv153Theory` |
| 2956 | function | `besI1e` |
| 2958 | function | `heaviside` |
| 2960 | function | `lossTheory` |
| 2979 | function | `vtBreak` |
| 2980 | function | `vtTheory` |
| 3001 | function | `hvdivTheory` |
| 3003 | const fn | `r` |
| 3015 | function | `scheringTheory` |
| 3016 | const fn | `inv` |
| 3025 | const fn | `sr` |
| 3037 | const fn | `studyNet` |
| 3038 | function | `studyQ` |
| 3045 | function | `emtSpectra` |
| 3048 | function | `emtReadings` |
| 3051 | const fn | `studyKey` |
| 3052 | function | `studyOpen` |
| 3065 | function | `studyAct` |
| 3090 | function | `netViewOpen` |
| 3097 | const fn | `legend` |
| 3121 | function | `nvEdit` |
| 3130 | function | `nvApply` |
| 3131 | const fn | `same` |
| 3132 | const fn | `put` |
| 3149 | function | `areaBind` |
| 3157 | function | `areaChosen` |
| 3158 | function | `areaSplit` |
| 3162 | function | `areaShow` |
| 3174 | function | `areaCompare` |
| 3186 | function | `areaEmt` |
| 3197 | function | `fosterPlot` |
| 3199 | const fn | `X` |
| 3200 | const fn | `line` |
| 3206 | function | `fosterShow` |
| 3215 | function | `fdneShow` |
| 3221 | function | `areaBack` |
| 3224 | function | `mtdcTheory` |
| 3230 | function | `dcdcSteady` |
| 3235 | function | `dcdcTheory` |
| 3236 | const fn | `row` |
| 3240 | function | `b4Theory` |
| 3245 | function | `studyTheory` |
| 3263 | const fn | `X` |
| 3350 | function | `formulaTheory` |
| 3467 | function | `nodeAvg` |
| 3473 | function | `circuitForMath` |
| 3509 | function | `scheduleMath` |
| 3510 | function | `batteryKey` |
| 3512 | function | `mathChoices` |
| 3513 | const fn | `prim` |
| 3515 | function | `renderMathChoices` |
| 3517 | function | `runTemplate` |
| 3523 | function | `runMath` |
| 3550 | function | `saveLocal` |
| 3551 | function | `saveLocalSoon` |
| 3553 | function | `download` |
| 3554 | function | `exportCSV` |
| 3560 | function | `syncScopeInputs` |
| 3561 | function | `setSpeed` |
| 3564 | function | `openSettings` |
| 3565 | const fn | `sel` |
| 3566 | const fn | `chk` |
| 3593 | function | `applyLook` |
| 3597 | function | `boot` |
| 3668 | const fn | `navOpen` |
| 3684 | const fn | `probeSel` |
| 3752 | function | `gpuBadge` |
| 3758 | function | `renderTheoryLive` |
| 3762 | function | `initPanels` |
| 3763 | const fn | `one` |
| 3764 | const fn | `pick` |
| 3765 | const fn | `shut` |
| 3766 | const fn | `live` |

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

### `web/studio/console.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 9 | const fn | `$` |
| 13 | const fn | `esc` |
| 16 | function | `init` |
| 27 | function | `label` |
| 28 | function | `state` |
| 29 | function | `kinfo` |
| 30 | function | `prompt` |
| 31 | function | `fit` |
| 32 | function | `out` |
| 33 | function | `echo` |
| 34 | function | `clc` |
| 37 | function | `start` |
| 43 | function | `open` |
| 52 | function | `openServer` |
| 54 | function | `closeServer` |
| 55 | function | `post` |
| 57 | function | `worker` |
| 59 | function | `msg` |
| 67 | function | `batch` |
| 70 | function | `write` |
| 73 | function | `ask` |
| 76 | function | `context` |
| 78 | function | `request` |
| 84 | function | `submit` |
| 91 | function | `done` |
| 99 | function | `page` |
| 100 | function | `remember` |
| 102 | function | `interrupt` |
| 108 | function | `complete` |
| 116 | function | `key` |
| 129 | function | `whos` |
| 131 | function | `file` |
| 134 | function | `upload` |
| 138 | function | `script` |
| 146 | function | `saveScript` |
| 148 | function | `toScen` |

### `web/studio/console_worker.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 12 | function | `start` |
| 33 | function | `packages` |
| 43 | function | `newFiles` |

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

### `web/studio/dock.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 45 | const fn | `gid` |
| 46 | const fn | `rects` |
| 48 | const fn | `shape` |
| 71 | function | `take` |
| 93 | const fn | `first` |
| 110 | const fn | `doc` |
| 111 | const fn | `esc` |
| 114 | const fn | `ids` |
| 115 | const fn | `open` |
| 116 | function | `load` |
| 117 | function | `save` |
| 118 | const fn | `note` |
| 120 | function | `top` |
| 121 | function | `region` |
| 125 | function | `wrapper` |
| 134 | function | `tabsHtml` |
| 139 | function | `floatRect` |
| 141 | function | `clampRect` |
| 143 | function | `setFloat` |
| 147 | function | `keepFloat` |
| 151 | function | `openWin` |
| 160 | const fn | `winOf` |
| 163 | function | `forward` |
| 169 | function | `keepScreen` |
| 171 | function | `adopt` |
| 185 | function | `lost` |
| 189 | function | `unscreen` |
| 193 | function | `screenHello` |
| 197 | function | `tick` |
| 203 | const fn | `q` |
| 204 | const fn | `qa` |
| 205 | const fn | `screenDocs` |
| 207 | const fn | `screenWin` |
| 209 | function | `render` |
| 242 | function | `sizes` |
| 246 | function | `fill` |
| 256 | function | `tools` |
| 262 | function | `change` |
| 263 | const fn | `place` |
| 267 | const fn | `tab` |
| 268 | const fn | `activate` |
| 270 | const fn | `side` |
| 271 | const fn | `firstAs` |
| 273 | const fn | `max` |
| 275 | const fn | `reveal` |
| 276 | const fn | `reset` |
| 277 | const fn | `where` |
| 278 | const fn | `label` |
| 280 | function | `lload` |
| 282 | function | `lsave` |
| 283 | const fn | `presetOf` |
| 285 | function | `use` |
| 287 | const fn | `layout` |
| 288 | const fn | `saveAs` |
| 290 | const fn | `loadSaved` |
| 291 | const fn | `drop` |
| 292 | const fn | `auto` |
| 294 | const fn | `propose` |
| 298 | const fn | `nowText` |
| 300 | const fn | `layouts` |
| 302 | function | `layoutsHtml` |
| 313 | function | `layoutsClick` |
| 317 | function | `menuHtml` |
| 333 | function | `closeMenu` |
| 335 | function | `openMenu` |
| 347 | function | `zoneAt` |
| 354 | function | `zones` |
| 357 | function | `hiRect` |
| 363 | function | `dragStart` |
| 365 | const fn | `mv` |
| 372 | const fn | `end` |
| 378 | const fn | `up` |
| 381 | function | `splitStart` |
| 391 | function | `vsplitStart` |
| 400 | function | `init` |
| 425 | const fn | `onChange` |
| 426 | const fn | `state` |

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
| 337 | const fn | `fn` |
| 382 | method | `noteHTML` |
| 387 | method | `lblMeasure` |
| 394 | method | `lvChars` |
| 400 | method | `renderLabels` |
| 406 | const fn | `r1` |
| 407 | const fn | `line` |
| 421 | method | `lblHit` |
| 424 | method | `dragLbl` |
| 427 | method | `dropLbl` |
| 431 | method | `resetLabels` |
| 434 | method | `relabelSoon` |
| 435 | method | `renderWires` |
| 454 | method | `wireSVG` |
| 466 | method | `redrawWire` |
| 467 | method | `pathD` |
| 472 | method | `segDir` |
| 473 | method | `midLabel` |
| 474 | method | `renderPins` |
| 484 | method | `renderSel` |
| 488 | method | `setLive` |
| 490 | method | `updateLive` |
| 502 | method | `drawArrows` |
| 513 | method | `world` |
| 515 | method | `hitAt` |
| 516 | method | `hitOf` |
| 518 | method | `down` |
| 546 | method | `move` |
| 560 | method | `up` |
| 575 | method | `cancelDrag` |
| 576 | method | `hoverPin` |
| 578 | method | `dbl` |
| 579 | method | `menu` |
| 583 | method | `worldNow` |
| 584 | method | `wheel` |
| 591 | method | `letter` |
| 592 | method | `key` |
| 617 | method | `beginDrag` |
| 630 | method | `dragMove` |
| 642 | method | `endDrag` |
| 652 | method | `bakeMove` |
| 657 | method | `dragSeg` |
| 660 | const fn | `stub` |
| 669 | method | `drawMarquee` |
| 672 | method | `marqueeSelect` |
| 675 | const fn | `inside` |
| 682 | method | `escape` |
| 685 | method | `beginPlace` |
| 686 | method | `ghost` |
| 689 | method | `finishPlace` |
| 690 | method | `cancelPlace` |
| 692 | method | `startWire` |
| 693 | method | `startWireFrom` |
| 694 | method | `previewWire` |
| 703 | method | `wireClick` |
| 709 | method | `orthoNext` |
| 710 | method | `finishWire` |
| 726 | method | `cancelWire` |
| 728 | method | `splitWire` |
| 738 | method | `wireNetPin` |
| 740 | method | `canScroll` |

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
| 140 | const fn | `mv` |
| 141 | const fn | `up` |
| 156 | function | `natural` |
| 157 | function | `zoomAt` |
| 159 | const fn | `off` |
| 164 | function | `fitNow` |
| 166 | function | `close` |

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
| 74 | const fn | `negFloor` |
| 76 | function | `wmInc` |
| 93 | const fn | `cmul` |
| 95 | function | `symc` |
| 98 | function | `wmOut` |
| 102 | const fn | `ph` |
| 115 | const fn | `numList` |
| 127 | function | `b64of` |
| 129 | function | `fromB64` |
| 132 | function | `snapEncode` |
| 133 | const fn | `num` |
| 134 | function | `enc` |
| 144 | function | `snapRestore` |
| 145 | function | `dec` |
| 156 | function | `smPort` |
| 160 | function | `smOut` |
| 164 | const fn | `genCopy` |
| 172 | function | `csolveSp` |
| 190 | function | `csolve` |
| 205 | const fn | `grpKey` |
| 212 | function | `acInit` |
| 228 | const fn | `y` |
| 282 | const fn | `seq` |
| 302 | const fn | `pAbs` |
| 343 | class | `NetlistError` |
| 348 | function | `dePiece` |
| 350 | const fn | `F` |
| 351 | function | `deInt` |
| 353 | function | `deFrac` |
| 358 | function | `lpmRun` |
| 367 | function | `lpmParams` |
| 370 | function | `gapUb` |
| 376 | function | `tlSteady` |
| 378 | const fn | `at` |
| 380 | const fn | `re` |
| 386 | function | `tlDlY` |
| 388 | function | `tlSteadyDl` |
| 390 | const fn | `re` |
| 400 | function | `poleG` |
| 401 | function | `tlmModeY` |
| 406 | const fn | `mm` |
| 413 | function | `tlmAcY` |
| 419 | function | `tlmSteady` |
| 420 | const fn | `vm` |
| 434 | function | `tlElement` |
| 443 | function | `tlmElement` |
| 464 | function | `rcCoefC` |
| 466 | const fn | `mul` |
| 471 | function | `wbSet` |
| 476 | function | `wbCo` |
| 480 | function | `wbPoleG` |
| 483 | function | `wbSum` |
| 485 | function | `tlwElement` |
| 504 | function | `tlwAcY` |
| 519 | function | `tlwSteady` |
| 520 | const fn | `mv` |
| 527 | const fn | `st` |
| 537 | function | `piLine` |
| 542 | const fn | `shunt` |
| 550 | function | `rcCoef` |
| 556 | function | `fdCo` |
| 566 | function | `arcF` |
| 572 | function | `arcStep` |
| 579 | function | `arcCur` |
| 584 | function | `nlLimit` |
| 585 | function | `nlSolve` |
| 592 | function | `saiSetup` |
| 593 | const fn | `Lc` |
| 597 | function | `saiCur` |
| 605 | function | `saiCommit` |
| 614 | function | `satSetup` |
| 616 | function | `satCur` |
| 617 | function | `satCommit` |
| 621 | function | `satEl` |
| 626 | function | `xfmrSat` |
| 640 | function | `chbCoef` |
| 645 | function | `chbCommit` |
| 652 | function | `chbStates` |
| 654 | function | `chbCount` |
| 663 | function | `mmcSample` |
| 673 | const fn | `full` |
| 682 | function | `mmcSave` |
| 683 | function | `mmcLoad` |
| 690 | function | `lccCom` |
| 693 | function | `lccMeasInit` |
| 699 | function | `lccMeasure` |
| 716 | function | `lccPlo` |
| 721 | function | `lccU` |
| 723 | function | `lccIn` |
| 726 | function | `lccSetup` |
| 729 | function | `lccEdge` |
| 731 | function | `lccGate` |
| 736 | function | `nlcStep` |
| 739 | const fn | `full` |
| 756 | function | `footLink` |
| 764 | function | `arcStart` |
| 765 | const fn | `r` |
| 768 | function | `buildNetlist` |
| 781 | const fn | `union` |
| 796 | const fn | `nm` |
| 815 | const fn | `sn` |
| 819 | const fn | `isJ` |
| 842 | const fn | `lbl` |
| 847 | const fn | `node` |
| 851 | const fn | `nodeKey` |
| 852 | const fn | `tunePwm` |
| 862 | const fn | `internal` |
| 865 | const fn | `neutNode` |
| 871 | const fn | `mkBlock` |
| 878 | const fn | `add` |
| 879 | const fn | `series` |
| 1186 | function | `compileSignals` |
| 1208 | const fn | `less` |
| 1209 | const fn | `push` |
| 1210 | const fn | `pop` |
| 1225 | function | `f2Phi` |
| 1230 | function | `cmpF` |
| 1234 | function | `stampM` |
| 1236 | function | `luFactor` |
| 1242 | function | `luSolve` |
| 1249 | class | `Sim` |
| 1250 | method | `constructor` |
| 1253 | method | `basePeriod` |
| 1257 | method | `tlMaxStep` |
| 1258 | method | `setStep` |
| 1261 | method | `stIndex` |
| 1277 | method | `stVec` |
| 1278 | method | `stepCfg` |
| 1279 | method | `varSetup` |
| 1285 | method | `setStepMode` |
| 1287 | method | `hGrid` |
| 1291 | method | `modeCap` |
| 1295 | method | `swEls` |
| 1296 | method | `topoKey` |
| 1297 | method | `topoInfo` |
| 1307 | method | `topoCheck` |
| 1324 | method | `lteReset` |
| 1325 | method | `ltePush` |
| 1329 | method | `lteErr` |
| 1339 | method | `varCheck` |
| 1355 | method | `note` |
| 1358 | method | `stepCheck` |
| 1362 | method | `stepInfo` |
| 1365 | method | `diagnostics` |
| 1368 | method | `ringCheck` |
| 1377 | method | `stateMap` |
| 1379 | method | `stateMap0` |
| 1390 | method | `load` |
| 1446 | method | `reset` |
| 1453 | method | `restrict` |
| 1461 | const fn | `own` |
| 1475 | method | `imStep` |
| 1482 | method | `smStep` |
| 1484 | method | `srmStep` |
| 1485 | method | `srmOutputs` |
| 1486 | method | `smOutputs` |
| 1490 | method | `genStep` |
| 1497 | method | `genOutputs` |
| 1502 | method | `genTm` |
| 1503 | method | `genEfd` |
| 1504 | method | `imSources` |
| 1505 | method | `pyBlocks` |
| 1515 | method | `pyLazy` |
| 1517 | method | `pyUpgrade` |
| 1519 | method | `setMethod` |
| 1520 | method | `setControl` |
| 1522 | method | `setBlock` |
| 1524 | method | `setHold` |
| 1526 | method | `markChange` |
| 1531 | method | `progInit` |
| 1532 | method | `addProgram` |
| 1534 | method | `progNext` |
| 1535 | method | `progDue` |
| 1536 | method | `progApply` |
| 1551 | method | `evInit` |
| 1552 | method | `logEv` |
| 1554 | method | `events` |
| 1556 | method | `evSwitches` |
| 1558 | method | `channelKeys` |
| 1564 | method | `compKeys` |
| 1588 | method | `recMode` |
| 1589 | method | `watchList` |
| 1600 | method | `watchAdd` |
| 1620 | const fn | `g` |
| 1627 | method | `allocRecord` |
| 1640 | const fn | `A` |
| 1648 | method | `V` |
| 1649 | method | `elCurrent` |
| 1653 | method | `portI` |
| 1657 | method | `computeVals` |
| 1691 | method | `partVals` |
| 1716 | method | `watchLists` |
| 1725 | method | `computeWatched` |
| 1734 | method | `fullVals` |
| 1744 | method | `setRecord` |
| 1745 | method | `recordNow` |
| 1756 | method | `closePeriod` |
| 1767 | method | `lastPeriod` |
| 1768 | method | `now` |
| 1770 | method | `hasKey` |
| 1775 | method | `gateOf` |
| 1781 | method | `rawGate` |
| 1792 | method | `carrier` |
| 1795 | method | `shGrid` |
| 1798 | method | `wmCyc` |
| 1799 | method | `shNext` |
| 1801 | method | `sampleHolds` |
| 1806 | method | `samples` |
| 1807 | method | `ctrlEdges` |
| 1813 | method | `scrU` |
| 1814 | method | `scrGate` |
| 1815 | method | `scrEdges` |
| 1816 | method | `setFiring` |
| 1817 | method | `compV` |
| 1818 | method | `compI` |
| 1820 | method | `dbl` |
| 1821 | method | `sampleControllers` |
| 1855 | method | `evalBlocks` |
| 2035 | method | `blkCopy` |
| 2038 | method | `blkAnyDue` |
| 2041 | method | `blkDue` |
| 2043 | method | `zcFrac` |
| 2046 | method | `saveState` |
| 2048 | method | `restoreState` |
| 2057 | method | `snapshot` |
| 2059 | method | `restoreSnapshot` |
| 2061 | method | `gateSigPeek` |
| 2064 | method | `gateSig` |
| 2069 | method | `jumpScheds` |
| 2076 | method | `jumpAt` |
| 2077 | method | `values` |
| 2107 | method | `assemble` |
| 2124 | const fn | `g` |
| 2150 | method | `rhs` |
| 2152 | const fn | `J` |
| 2171 | method | `cplLinearize` |
| 2179 | method | `solverInfo` |
| 2194 | method | `factor` |
| 2216 | method | `baseFromCache` |
| 2219 | const fn | `cnt` |
| 2227 | method | `spAssemble` |
| 2234 | method | `solveOnce` |
| 2249 | method | `solve` |
| 2272 | method | `nlLinearize` |
| 2275 | method | `check` |
| 2295 | method | `commit` |
| 2322 | method | `initialSolve` |
| 2334 | method | `tlSources` |
| 2339 | method | `tlRecord` |
| 2346 | method | `tlHist` |
| 2352 | method | `tlmG` |
| 2356 | method | `tlmSources` |
| 2370 | method | `tlmRecord` |
| 2385 | method | `tlwG` |
| 2391 | method | `tlwSources` |
| 2406 | method | `tlwRecord` |
| 2423 | method | `tlmHist` |
| 2430 | method | `step` |
| 2432 | const fn | `gs` |
| 2438 | method | `stepCore` |
| 2499 | method | `edgeSolve` |
| 2502 | method | `edgePoint` |
| 2503 | method | `mmcMoved` |
| 2506 | method | `arcGate` |
| 2514 | method | `trRestart` |
| 2523 | method | `nextEvent` |
| 2529 | const fn | `sch` |
| 2554 | method | `spwmCut` |
| 2557 | const fn | `sig` |
| 2562 | method | `run` |
| 2565 | method | `runUntil` |
| 2611 | function | `tuneInfo` |
| 2614 | function | `exportForBatch` |
| 2639 | const fn | `hist` |
| 2655 | const fn | `ci` |
| 2656 | const fn | `vd` |
| 2657 | const fn | `V` |
| 2660 | const fn | `linePort` |
| 2662 | const fn | `I` |
| 2663 | const fn | `portRec` |
| 2664 | const fn | `rec` |
| 2682 | const fn | `clkOf` |
| 2708 | function | `sweepPoint` |
| 2713 | function | `setPath` |
| 2719 | function | `eisPoint` |
| 2727 | function | `resume` |

### `web/studio/model.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 27 | function | `termsOf` |
| 39 | class | `ModelError` |
| 40 | function | `uf` |
| 43 | function | `params` |
| 48 | function | `levelOf` |
| 51 | function | `closedAt0` |
| 53 | function | `of` |
| 65 | const fn | `join` |
| 132 | function | `summary` |

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
| 84 | function | `eqvData` |
| 85 | const fn | `list` |
| 87 | const fn | `mat` |
| 99 | const fn | `seq3` |
| 100 | function | `eqvFoster` |
| 123 | function | `eqvFdne` |
| 125 | const fn | `bad` |
| 132 | const fn | `part` |
| 152 | function | `eqvDef` |
| 155 | const fn | `str` |
| 165 | const fn | `schedOf` |
| 166 | function | `faultDef` |
| 172 | const fn | `sw` |
| 183 | function | `arcSections` |
| 184 | const fn | `S` |
| 192 | function | `arcChain` |
| 196 | function | `arcBreakerDef` |
| 203 | function | `breakerDef` |
| 220 | function | `xfData` |
| 232 | const fn | `libErr` |
| 233 | function | `xfSat` |
| 245 | function | `xfCore` |
| 248 | function | `xfDef` |
| 252 | const fn | `star` |
| 254 | const fn | `ends` |
| 277 | function | `loadDef` |
| 280 | const fn | `starN` |
| 313 | function | `lineData` |
| 317 | function | `lineDef` |
| 319 | const fn | `mat` |
| 347 | function | `aicDef` |
| 380 | const fn | `out` |
| 391 | function | `evcDef` |
| 404 | const fn | `cl` |
| 408 | const fn | `io` |
| 409 | const fn | `E` |
| 463 | const fn | `out` |
| 472 | const fn | `fT` |
| 473 | function | `ctlKit` |
| 475 | const fn | `lag` |
| 477 | const fn | `leadlag` |
| 479 | const fn | `wash` |
| 481 | const fn | `nwLag` |
| 488 | const fn | `sched` |
| 490 | function | `avrDef` |
| 491 | const fn | `io` |
| 492 | const fn | `N` |
| 525 | function | `pssDef` |
| 534 | function | `govDef` |
| 574 | const fn | `out` |
| 581 | function | `footTable` |
| 586 | function | `lpmOf` |
| 588 | function | `msTower` |
| 601 | function | `msFoot` |
| 605 | function | `towerDef` |
| 639 | function | `saiTable` |
| 640 | function | `saiParams` |
| 646 | function | `saiV10` |
| 647 | const fn | `W` |
| 652 | function | `saiFitL1` |
| 657 | function | `saiDef` |
| 664 | const fn | `par` |
| 674 | const fn | `nCells` |
| 675 | function | `chbDef` |
| 677 | const fn | `out` |
| 688 | const fn | `sw` |
| 689 | const fn | `gate` |
| 703 | function | `spllDef` |
| 708 | const fn | `E` |
| 714 | const fn | `w` |
| 726 | function | `ssscDef` |
| 727 | const fn | `io` |
| 728 | const fn | `E` |
| 743 | const fn | `sched` |
| 771 | function | `sssc3Def` |
| 773 | const fn | `sin` |
| 774 | const fn | `E` |
| 777 | const fn | `flt` |
| 792 | const fn | `sched` |
| 806 | const fn | `vf` |
| 835 | function | `mmcDef` |
| 840 | const fn | `sin` |
| 841 | const fn | `w` |
| 847 | const fn | `refs` |
| 849 | const fn | `toU` |
| 850 | const fn | `ccsc` |
| 868 | const fn | `energy` |
| 871 | const fn | `six` |
| 929 | const fn | `arm` |
| 931 | const fn | `sw` |
| 956 | function | `mmccDef` |
| 959 | const fn | `sin` |
| 960 | const fn | `w` |
| 961 | const fn | `pos` |
| 968 | const fn | `dq` |
| 983 | const fn | `integ` |
| 1091 | function | `lcc6Def` |
| 1092 | const fn | `sin` |
| 1120 | function | `lccsDef` |
| 1121 | const fn | `sin` |
| 1127 | const fn | `xf` |
| 1129 | const fn | `br` |
| 1187 | function | `lcccDef` |
| 1188 | const fn | `sin` |
| 1189 | const fn | `pos` |
| 1202 | const fn | `pi` |
| 1232 | function | `filtDef` |
| 1233 | const fn | `pos` |
| 1236 | const fn | `G` |
| 1247 | function | `zserDef` |
| 1264 | function | `sigPorts` |
| 1265 | const fn | `sin` |
| 1267 | const fn | `out` |
| 1269 | const fn | `close` |
| 1273 | const fn | `busMap` |
| 1278 | function | `vsc2Def` |
| 1280 | const fn | `w` |
| 1308 | function | `dcdcDef` |
| 1309 | const fn | `w` |
| 1310 | const fn | `out` |
| 1337 | function | `pmuDef` |
| 1339 | const fn | `out` |
| 1364 | function | `gfmcDef` |
| 1368 | const fn | `w` |
| 1369 | const fn | `pos` |
| 1371 | const fn | `integ` |
| 1382 | const fn | `dq` |
| 1399 | const fn | `at0` |
| 1522 | function | `defOf` |
| 1528 | function | `forceImpl` |
| 1530 | const fn | `fix` |
| 1534 | const fn | `hasLib` |
| 1535 | function | `needs` |
| 1537 | function | `expand` |
| 1539 | const fn | `conv` |
| 1547 | function | `warnings` |
| 1553 | const fn | `cx` |
| 1555 | function | `csolve` |
| 1560 | function | `faultCurrents` |
| 1580 | function | `behindXF` |
| 1591 | function | `layoutDef` |
| 1594 | const fn | `isG` |
| 1595 | const fn | `isJ` |
| 1604 | const fn | `side` |
| 1608 | const fn | `bfs` |
| 1617 | const fn | `bary` |
| 1623 | const fn | `ctr` |
| 1624 | const fn | `target` |
| 1640 | function | `placedDef` |
| 1645 | function | `sidesOf` |

### `web/studio/netview.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 37 | function | `model` |
| 53 | function | `dcModel` |
| 64 | function | `fit` |
| 66 | const fn | `sx` |
| 68 | function | `detail` |
| 69 | function | `pick` |
| 81 | const fn | `near` |
| 92 | function | `inPoly` |
| 94 | function | `within` |
| 99 | const fn | `num` |
| 101 | function | `describe` |
| 116 | function | `draw` |
| 122 | const fn | `seg` |
| 124 | const fn | `mid` |
| 145 | const fn | `lines` |
| 175 | const fn | `put` |
| 196 | function | `routeMid` |
| 200 | function | `graticule` |
| 206 | function | `scaleLen` |
| 207 | function | `scaleBar` |
| 210 | function | `create` |
| 214 | const fn | `win` |
| 215 | const fn | `size` |
| 220 | const fn | `paint` |
| 222 | const fn | `at` |
| 225 | const fn | `chosen` |
| 226 | const fn | `told` |
| 228 | const fn | `kindOf` |
| 229 | const fn | `down` |
| 231 | const fn | `move` |
| 238 | const fn | `up` |
| 245 | const fn | `cancel` |
| 246 | const fn | `wheel` |
| 247 | const fn | `dbl` |
| 254 | method | `setLayer` |
| 255 | method | `setNames` |
| 256 | method | `fit` |
| 258 | method | `zoom` |
| 261 | method | `goto` |
| 262 | method | `info` |
| 264 | method | `setMode` |
| 267 | method | `setSelection` |
| 269 | method | `setBoundary` |
| 270 | method | `clearSelection` |
| 272 | method | `choose` |
| 273 | method | `destroy` |

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

### `web/studio/panels.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 14 | const fn | `esc` |
| 15 | const fn | `doc` |
| 19 | function | `register` |
| 21 | const fn | `source` |
| 22 | const fn | `all` |
| 23 | const fn | `find` |
| 24 | const fn | `el` |
| 25 | const fn | `shown` |
| 26 | function | `hidden` |
| 27 | function | `keep` |
| 28 | function | `state` |
| 31 | const fn | `list` |
| 33 | function | `setCard` |
| 35 | function | `restore` |
| 37 | function | `toggle` |
| 41 | function | `reset` |
| 48 | function | `check` |
| 55 | function | `html` |
| 61 | function | `closeMenu` |
| 63 | function | `openMenu` |

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
| 1360 | function | `noteBox` |
| 1363 | function | `defaults` |
| 1365 | function | `elPins` |
| 1366 | function | `sigPins` |
| 1367 | function | `pinsOf` |
| 1370 | function | `parseMat` |
| 1373 | function | `nPorts` |
| 1374 | function | `eqN` |
| 1375 | function | `portY` |
| 1376 | function | `portPins` |
| 1377 | function | `portBox` |
| 1379 | function | `posDef` |
| 1381 | function | `symmetric` |
| 1382 | function | `matInv` |
| 1387 | function | `klMatrix` |
| 1398 | function | `kgMatrix` |
| 1406 | function | `srmGeo` |
| 1408 | function | `srmSpins` |
| 1410 | function | `srmPins` |
| 1412 | function | `satD` |
| 1413 | function | `satDinv` |
| 1415 | function | `genSpins` |
| 1426 | function | `genTsc` |
| 1431 | function | `genCirc2` |
| 1432 | const fn | `Fn` |
| 1440 | function | `genAxis` |
| 1448 | const fn | `classic` |
| 1454 | const fn | `plist` |
| 1458 | function | `genModel` |
| 1464 | const fn | `w` |
| 1473 | const fn | `grp` |
| 1490 | function | `genGamma` |
| 1498 | function | `genDQ` |
| 1502 | function | `genSteady` |
| 1504 | const fn | `rot` |
| 1511 | function | `srmAlignedPsi` |
| 1512 | function | `srmModelPsi` |
| 1513 | function | `srmTableText` |
| 1516 | function | `srmMag` |
| 1532 | function | `chkMag` |
| 1534 | function | `srmA` |
| 1537 | function | `seg` |
| 1538 | function | `srmPsi` |
| 1540 | function | `srmCur` |
| 1542 | function | `srmTorque` |
| 1545 | function | `srmCoenergy` |
| 1549 | function | `waveShape` |
| 1550 | function | `waveAt` |
| 1553 | function | `waveMeasure` |
| 1556 | const fn | `cross` |
| 1562 | function | `waveFit` |
| 1563 | const fn | `res` |
| 1574 | function | `directWave` |
| 1577 | function | `impulseWave` |
| 1588 | function | `bewley` |
| 1591 | const fn | `at` |
| 1597 | function | `movChar` |
| 1602 | const fn | `pick` |
| 1603 | const fn | `cur` |
| 1604 | const fn | `inv` |
| 1609 | function | `magChar` |
| 1616 | const fn | `cur` |
| 1617 | const fn | `inv` |
| 1620 | function | `pairTable` |
| 1623 | function | `magMeanSq` |
| 1625 | const fn | `P` |
| 1632 | function | `magRms` |
| 1637 | const fn | `g` |
| 1645 | function | `impulseDesign` |
| 1650 | function | `impulseRoots` |
| 1653 | function | `tlParams` |
| 1666 | function | `tlmData` |
| 1668 | function | `tlmM` |
| 1675 | function | `tlmPin` |
| 1676 | function | `tlmPins` |
| 1678 | function | `tlmKey` |
| 1692 | function | `clarkeTi` |
| 1693 | function | `tlcpModel` |
| 1708 | function | `tlmModel` |
| 1716 | function | `lightningWave` |
| 1723 | function | `pinKind` |
| 1734 | function | `structural` |
| 1741 | function | `pinWidth` |
| 1744 | function | `xf` |
| 1745 | function | `pinPos` |
| 1747 | function | `pinDir` |
| 1752 | function | `cpeParams` |
| 1753 | function | `cpeBank` |
| 1757 | function | `cpeZ` |
| 1758 | function | `cpeZbank` |
| 1759 | function | `boxOf` |
| 1760 | function | `bbox` |
| 1765 | function | `fmtNum` |
| 1769 | function | `eng` |
| 1773 | function | `parseEng` |
| 1776 | function | `parseSched` |
| 1784 | function | `machines` |

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
| 21 | const fn | `tut` |
| 22 | const fn | `Study` |
| 28 | function | `folderStart` |
| 31 | const fn | `put` |
| 35 | const fn | `lines` |
| 41 | function | `folderEnd` |
| 46 | function | `defaultKeys` |
| 51 | function | `measure` |
| 63 | function | `decimate` |
| 68 | function | `run` |
| 78 | const fn | `push` |
| 108 | function | `open` |
| 116 | const fn | `index` |
| 123 | function | `session` |
| 124 | function | `setLive` |
| 132 | function | `advance` |
| 144 | function | `closeSession` |
| 147 | function | `tutorial` |
| 149 | function | `tutorials` |
| 151 | function | `handle` |
| 171 | const fn | `sk` |
| 180 | function | `bifPoint` |
| 181 | function | `bifSpec` |
| 185 | function | `bifurcation` |
| 189 | const fn | `json` |

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
| 68 | method | `heights` |
| 71 | method | `gapAt` |
| 73 | method | `maxAt` |
| 76 | method | `gearAt` |
| 77 | method | `resizePane` |
| 79 | method | `autoHeights` |
| 81 | method | `toggleMax` |
| 84 | method | `attach` |
| 88 | method | `requestDraw` |
| 90 | method | `colors` |
| 92 | method | `setRefs` |
| 93 | method | `refRange` |
| 97 | method | `histPush` |
| 99 | method | `back` |
| 102 | method | `paneAt` |
| 103 | method | `zoomY` |
| 106 | method | `zoomed` |
| 107 | method | `unzoomY` |
| 109 | method | `unzoom` |
| 111 | method | `boxZoom` |
| 116 | method | `nav` |
| 121 | const fn | `clamp` |
| 134 | method | `resize` |
| 141 | method | `unitOf` |
| 145 | method | `resolve` |
| 146 | method | `channels` |
| 147 | method | `addChannel` |
| 150 | method | `removeChannel` |
| 151 | method | `moveChannel` |
| 153 | method | `windowSec` |
| 154 | method | `viewRange` |
| 156 | method | `ringIndex` |
| 157 | method | `ringStart` |
| 159 | method | `eachRaw` |
| 162 | method | `rawCount` |
| 163 | method | `eachPeriod` |
| 164 | method | `valueAt` |
| 167 | method | `stats` |
| 177 | method | `selectAt` |
| 180 | method | `selStats` |
| 184 | method | `usePeriods` |
| 186 | method | `panTo` |
| 187 | method | `zoomAt` |
| 189 | method | `cursorAt` |
| 191 | method | `plotW` |
| 192 | method | `drawSamples` |
| 199 | method | `envReset` |
| 204 | method | `ingest` |
| 218 | method | `colsOf` |
| 219 | const fn | `put` |
| 228 | method | `archiveFor` |
| 237 | method | `yAuto` |
| 253 | method | `draw` |
| 296 | const fn | `Y` |
| 324 | const fn | `flush` |

### `web/studio/screen.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 11 | const fn | `$` |
| 12 | const fn | `say` |
| 14 | function | `clear` |
| 15 | function | `tick` |

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
| 81 | function | `flatten` |
| 87 | const fn | `walk` |
| 89 | const fn | `resolve` |
| 130 | function | `setParam` |
| 142 | function | `paramOf` |
| 148 | function | `sync` |
| 160 | const fn | `uniq` |
| 161 | const fn | `snap` |
| 162 | const fn | `pinKindOf` |
| 163 | function | `newDefName` |
| 169 | function | `create` |
| 209 | const fn | `fix` |
| 217 | function | `expand` |
| 225 | const fn | `loc` |
| 252 | function | `fromLib` |
| 266 | function | `makeUnique` |
| 272 | function | `closure` |
| 278 | function | `externalRefs` |
| 279 | const fn | `head` |
| 285 | function | `refToPort` |
| 291 | const fn | `setIn` |

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
| 1354 | method | `build` |
| 1357 | const fn | `Ld` |
| 1378 | function | `bigGrid` |
| 1379 | const fn | `B` |
| 1381 | const fn | `w` |
| 1403 | method | `build` |
| 1415 | method | `build` |
| 1416 | const fn | `tl` |
| 1448 | method | `build` |
| 1460 | method | `build` |
| 1475 | method | `build` |
| 1494 | method | `build` |
| 1507 | method | `build` |
| 1520 | method | `build` |
| 1521 | const fn | `dev` |
| 1551 | method | `build` |
| 1569 | method | `build` |
| 1587 | method | `build` |
| 1603 | const fn | `LM` |
| 1606 | function | `tlmPart` |
| 1620 | method | `build` |
| 1639 | method | `build` |
| 1659 | function | `tlmGW` |
| 1663 | const fn | `note` |
| 1677 | method | `build` |
| 1697 | const fn | `tl` |
| 1725 | const fn | `PANE` |
| 1746 | function | `gisLines` |
| 1758 | method | `build` |
| 1779 | method | `build` |
| 1803 | method | `build` |
| 1824 | method | `build` |
| 1841 | method | `build` |
| 1843 | const fn | `rig` |
| 1862 | method | `build` |
| 1864 | const fn | `rig` |
| 1884 | function | `xbRig` |
| 1886 | const fn | `bond` |
| 1913 | method | `build` |
| 1948 | function | `ssscChannels` |
| 1957 | method | `build` |
| 1977 | method | `build` |
| 1979 | const fn | `ln` |
| 2013 | method | `build` |
| 2015 | const fn | `sw` |
| 2043 | method | `build` |
| 2047 | const fn | `station` |
| 2100 | method | `build` |
| 2141 | function | `b4Study` |
| 2151 | method | `build` |
| 2155 | const fn | `dcbus` |
| 2161 | const fn | `mmcp` |
| 2162 | const fn | `station` |
| 2226 | method | `build` |
| 2248 | method | `build` |
| 2253 | const fn | `station` |
| 2303 | method | `build` |
| 2340 | const fn | `gfmWire` |
| 2344 | const fn | `busMeter` |
| 2358 | method | `build` |
| 2363 | const fn | `unit` |
| 2386 | method | `build` |
| 2417 | method | `build` |
| 2455 | method | `build` |
| 2500 | method | `build` |
| 2514 | method | `build` |
| 2527 | function | `dcdcInputs` |

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
| 131 | function | `frameOf` |
| 133 | function | `panelEl` |
| 149 | function | `controls` |
| 155 | function | `suggest` |
| 165 | function | `addSug` |
| 171 | function | `tileOf` |
| 172 | function | `bindEvents` |
| 187 | function | `cur` |
| 191 | function | `setNum` |
| 192 | const fn | `go` |
| 195 | function | `showNum` |
| 202 | function | `dragTile` |
| 204 | const fn | `mv` |
| 205 | const fn | `up` |
| 234 | const fn | `setT` |
| 235 | function | `flag` |
| 238 | function | `valueOf` |
| 253 | function | `spark` |
| 259 | const fn | `raw` |
| 262 | const fn | `perIt` |
| 274 | const fn | `FT` |
| 276 | function | `facadeEl` |
| 293 | function | `renderFacade` |
| 306 | function | `facadeUpdate` |
| 312 | function | `trainOffline` |
| 320 | function | `compare` |

### `web/studio/winframe.js`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 17 | const fn | `load` |
| 18 | const fn | `save` |
| 20 | function | `bounds` |
| 22 | function | `rectOf` |
| 23 | function | `apply` |
| 26 | function | `lift` |
| 29 | function | `handles` |
| 31 | function | `start` |
| 41 | function | `remember` |
| 43 | function | `toggleMax` |
| 46 | function | `headOf` |
| 49 | function | `moveStart` |
| 52 | const fn | `mv` |
| 54 | const fn | `up` |
| 59 | function | `keepIn` |
| 61 | function | `bind` |
| 65 | function | `unframe` |
| 69 | function | `frame` |
| 88 | const fn | `size` |
| 90 | const fn | `max` |
| 93 | function | `frameModal` |
| 96 | function | `watchModals` |

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
| 108 | function | `accel_info` |
| 117 | function | `scenario` |
| 146 | class | `Handler` |
| 148 | method | `Handler.local` |
| 152 | method | `Handler.alive` |
| 162 | method | `Handler.body` |
| 171 | method | `Handler.addon_get` |
| 201 | method | `Handler.addon_post` |
| 228 | method | `Handler.send` |
| 244 | method | `Handler.do_GET` |
| 275 | method | `Handler.do_POST` |
| 356 | function | `main` |

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

### `engine/appwin.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 25 | function | `_win_paths` |
| 36 | function | `_mac_paths` |
| 45 | function | `candidates` |
| 56 | function | `find_browser` |
| 74 | function | `profile_dir` |
| 80 | function | `app_command` |
| 85 | function | `open_app` |

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
| 1040 | method | `Circuit.im_e` |
| 1049 | method | `Circuit.im_deriv` |
| 1062 | method | `Circuit.sm_cur` |
| 1074 | method | `Circuit.sm_ports` |
| 1079 | method | `Circuit.sm_deriv` |
| 1094 | method | `Circuit.srm_A` |
| 1099 | method | `Circuit._seg` |
| 1103 | method | `Circuit.srm_cur` |
| 1110 | method | `Circuit.srm_torque` |
| 1119 | method | `Circuit.srm_currents` |
| 1124 | method | `Circuit.srm_deriv` |
| 1137 | method | `Circuit.gen_cur` |
| 1154 | method | `Circuit.gen_efd` |
| 1161 | method | `Circuit.gen_tm` |
| 1168 | method | `Circuit.gen_deriv` |
| 1186 | method | `Circuit.jac_gen` |
| 1238 | method | `Circuit.gen_out` |
| 1258 | method | `Circuit.Vsrc` |
| 1274 | method | `Circuit.topo` |
| 1285 | method | `Circuit.build` |
| 1392 | method | `Circuit.bsrc` |
| 1450 | method | `Circuit.sat_cur` |
| 1457 | method | `Circuit.sat_psi` |
| 1467 | method | `Circuit.sat_vtol` |
| 1471 | method | `Circuit.sat_dir` |
| 1489 | method | `Circuit.sat_update` |
| 1536 | method | `Circuit.solve_z` |
| 1580 | method | `Circuit.arc_g` |
| 1585 | method | `Circuit.solve_nl` |
| 1627 | method | `Circuit.tl_hist` |
| 1648 | method | `Circuit.tl_sec` |
| 1657 | method | `Circuit.tl_ih` |
| 1661 | method | `Circuit.tl_record` |
| 1682 | method | `Circuit.tlm_setup` |
| 1777 | method | `Circuit.tlw_setup` |
| 1855 | method | `Circuit.tlw_ix` |
| 1869 | method | `Circuit.tlw_end` |
| 1879 | method | `Circuit.tlm_hist` |
| 1904 | method | `Circuit.tlm_ih` |
| 1917 | method | `Circuit.tlm_force` |
| 1943 | method | `Circuit.tlm_modal` |
| 1962 | method | `Circuit.tlm_record` |
| 1991 | method | `Circuit.scr_u` |
| 1995 | method | `Circuit.scr_gate` |
| 1999 | method | `Circuit.scr_edges` |
| 2006 | method | `Circuit.gate_state` |
| 2019 | method | `Circuit.set_gates` |
| 2027 | method | `Circuit.arc_gates` |
| 2047 | method | `Circuit.may_turn_on` |
| 2051 | method | `Circuit.tolerances` |
| 2057 | method | `Circuit.consistent` |
| 2066 | method | `Circuit._consistent` |
| 2112 | method | `Circuit.value` |
| 2153 | method | `Circuit.current` |
| 2209 | method | `Circuit.prime` |
| 2219 | method | `Circuit.sig_in` |
| 2223 | method | `Circuit.sh_grid` |
| 2237 | method | `Circuit.sh_next` |
| 2244 | method | `Circuit.log_ev` |
| 2250 | method | `Circuit.ev_switches` |
| 2259 | method | `Circuit.sh_sample` |
| 2279 | method | `Circuit.sample` |
| 2354 | method | `Circuit.cmp_f` |
| 2360 | method | `Circuit.blk_due` |
| 2371 | method | `Circuit.eval_blocks` |
| 2944 | method | `Circuit.block_events` |
| 2973 | method | `Circuit.next_event` |
| 3044 | function | `_decimate` |
| 3061 | function | `_diagnose` |
| 3112 | function | `simulate` |
| 3473 | function | `batch_sim` |

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

### `engine/console.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 30 | class | `ConsoleError` |
| 34 | function | `home` |
| 38 | class | `Session` |
| 41 | method | `Session.__init__` |
| 58 | method | `Session._read` |
| 75 | method | `Session.ask` |
| 89 | method | `Session.interrupt` |
| 98 | method | `Session.close` |
| 116 | function | `_session` |
| 129 | function | `handle` |
| 157 | function | `close_all` |

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
| 219 | function | `status` |
| 229 | function | `measurement` |
| 238 | function | `rule` |
| 250 | function | `choose` |

### `pcl/console.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 39 | class | `ConsoleError` |
| 43 | class | `_MissingName` |
| 47 | class | `_Missing` |
| 51 | method | `_Missing.__init__` |
| 54 | method | `_Missing.__getattr__` |
| 57 | method | `_Missing.__repr__` |
| 64 | function | `show_data` |
| 88 | function | `_plain` |
| 98 | function | `_user_names` |
| 104 | function | `_size` |
| 118 | function | `_short` |
| 129 | function | `_whos_rows` |
| 138 | function | `_whos_text` |
| 149 | function | `_clear_names` |
| 162 | function | `_jsonable` |
| 178 | function | `_mat_ok` |
| 198 | function | `_save_names` |
| 221 | function | `_load_names` |
| 245 | function | `plot_data` |
| 291 | function | `_help_text` |
| 303 | class | `Console` |
| 306 | method | `Console.__init__` |
| 320 | method | `Console._hook` |
| 329 | method | `Console.set_context` |
| 354 | method | `Console._network` |
| 366 | method | `Console.push` |
| 381 | method | `Console.block` |
| 405 | method | `Console.reset` |
| 410 | method | `Console._name` |
| 413 | method | `Console._run` |
| 435 | method | `Console._reply` |
| 439 | method | `Console.complete` |
| 461 | method | `Console.clc` |
| 465 | method | `Console.whos` |
| 469 | method | `Console.clear` |
| 478 | method | `Console.save` |
| 484 | method | `Console.load` |
| 489 | method | `Console.help` |
| 493 | method | `Console.plot` |
| 499 | method | `Console.scope` |
| 506 | method | `Console.run` |
| 520 | method | `Console.handle` |
| 540 | method | `Console.handle_json` |
| 544 | function | `_finite` |
| 555 | function | `_word_command` |
| 568 | function | `_syntax` |
| 576 | function | `_format` |
| 597 | function | `_caller` |
| 601 | function | `whos` |
| 606 | function | `clear` |
| 612 | function | `save` |
| 617 | function | `load` |
| 621 | function | `plot` |
| 627 | function | `scope` |
| 631 | function | `clc` |
| 635 | function | `run` |
| 645 | function | `child` |

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
| 441 | method | `Project.__repr__` |
| 445 | method | `Project.model` |
| 452 | method | `Project.comp` |
| 459 | method | `Project.get` |
| 467 | method | `Project.set` |
| 497 | method | `Project.tune` |
| 509 | method | `Project.inputs` |
| 527 | method | `Project.copy` |
| 532 | method | `Project.save` |
| 535 | method | `Project.hash` |
| 539 | method | `Project.params` |
| 543 | method | `Project.channels` |
| 548 | method | `Project._settings` |
| 561 | method | `Project.run` |
| 619 | method | `Project._folder_begin` |
| 640 | method | `Project.split` |
| 659 | method | `Project.stream` |
| 741 | method | `Project._result` |
| 748 | method | `Project._query` |
| 760 | method | `Project._run_scipy` |
| 797 | method | `Project.sweep` |
| 871 | method | `Project._sweep_meta` |
| 876 | method | `Project.bifurcation` |
| 933 | class | `_SweepFile` |
| 938 | method | `_SweepFile.__init__` |
| 952 | method | `_SweepFile._val` |
| 960 | method | `_SweepFile._read` |
| 979 | method | `_SweepFile._line` |
| 983 | method | `_SweepFile.add` |
| 987 | method | `_SweepFile.close` |
| 993 | function | `_sweep_point` |
| 1001 | function | `_as_list` |
| 1011 | function | `_spec` |
| 1027 | function | `_measures` |
| 1050 | function | `_base_T` |
| 1057 | function | `_unit` |
| 1061 | function | `_matname` |
| 1066 | class | `Result` |
| 1069 | method | `Result.__init__` |
| 1079 | method | `Result.__getitem__` |
| 1082 | method | `Result.__repr__` |
| 1085 | method | `Result.events_csv` |
| 1096 | method | `Result.measure` |
| 1156 | method | `Result.frame` |
| 1165 | method | `Result._meta_lines` |
| 1169 | method | `Result.to_csv` |
| 1182 | method | `Result._vars` |
| 1192 | method | `Result.as_dict` |
| 1196 | method | `Result.to_json` |
| 1200 | method | `Result.to_mat` |
| 1211 | method | `Result.to_parquet` |
| 1219 | method | `Result.to_hdf5` |
| 1225 | method | `Result.save` |
| 1229 | function | `_save` |
| 1236 | class | `SplitResult` |
| 1240 | method | `SplitResult.__init__` |
| 1248 | method | `SplitResult.series` |
| 1253 | method | `SplitResult.__getitem__` |
| 1256 | method | `SplitResult.at` |
| 1267 | method | `SplitResult.__repr__` |
| 1271 | class | `SweepResult` |
| 1274 | method | `SweepResult.__init__` |
| 1280 | method | `SweepResult.__repr__` |
| 1283 | method | `SweepResult.column` |
| 1286 | method | `SweepResult.frame` |
| 1293 | method | `SweepResult.to_csv` |
| 1305 | method | `SweepResult.to_json` |
| 1309 | method | `SweepResult.to_mat` |
| 1316 | method | `SweepResult._columns` |
| 1320 | method | `SweepResult.to_parquet` |
| 1326 | method | `SweepResult.to_hdf5` |
| 1331 | method | `SweepResult.save` |
| 1335 | class | `BifurcationResult` |
| 1339 | method | `BifurcationResult.__init__` |
| 1346 | method | `BifurcationResult.__repr__` |
| 1349 | method | `BifurcationResult.changes` |
| 1358 | method | `BifurcationResult.rows` |
| 1362 | method | `BifurcationResult._columns` |
| 1366 | method | `BifurcationResult.frame` |
| 1373 | method | `BifurcationResult.plot` |
| 1376 | method | `BifurcationResult.to_csv` |
| 1387 | method | `BifurcationResult.to_json` |
| 1391 | method | `BifurcationResult.to_mat` |
| 1397 | method | `BifurcationResult.to_parquet` |
| 1402 | method | `BifurcationResult.to_hdf5` |
| 1407 | method | `BifurcationResult.save` |
| 1418 | function | `_el` |
| 1423 | function | `_matrix` |
| 1428 | function | `_ascii` |
| 1435 | function | `_mat_char` |
| 1440 | function | `_mat_value` |
| 1453 | function | `_savemat` |

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

### `pcl/equivalent.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 65 | class | `EquivalentError` |
| 69 | function | `_buses_of` |
| 76 | function | `split` |
| 139 | function | `area` |
| 177 | function | `_copy` |
| 187 | function | `_retained` |
| 198 | function | `_short_circuit` |
| 238 | function | `reduce` |
| 364 | function | `_v` |
| 372 | function | `_ymat` |
| 381 | function | `compare` |
| 435 | function | `_gen3` |
| 447 | function | `_ext_y` |
| 510 | function | `_kron` |
| 521 | class | `_Ext` |
| 529 | method | `_Ext.__init__` |
| 604 | method | `_Ext.Y` |
| 630 | function | `scan` |
| 683 | function | `_yblock` |
| 687 | function | `foster_z` |
| 697 | function | `_pr_blocks` |
| 730 | function | `_refine` |
| 766 | function | `_fit_one` |
| 794 | function | `foster` |
| 898 | function | `fdne_basis` |
| 917 | function | `_fd_coef` |
| 927 | function | `_fd_mats` |
| 936 | function | `fdne_y` |
| 951 | function | `_fd_reG` |
| 963 | function | `_fd_passive` |
| 1036 | function | `fdne` |
| 1138 | function | `emt_ports` |
| 1261 | function | `_fdne_out` |
| 1287 | function | `_foster_out` |
| 1302 | function | `_mat` |
| 1306 | function | `to_emt` |

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

### `pcl/model.py`

| Γραμμή | Είδος | Όνομα |
|---:|---|---|
| 53 | class | `ModelError` |
| 57 | function | `_num` |
| 65 | function | `of` |
| 77 | function | `_check` |
| 92 | function | `_grid_z` |
| 119 | function | `_line_data` |
| 129 | function | `_xf_data` |
| 143 | function | `_zser_z` |
| 153 | function | `_eng` |
| 165 | function | `_list` |
| 171 | function | `_rows` |
| 178 | function | `_clarke` |
| 192 | function | `_tlm_zy` |
| 243 | function | `_tlm` |
| 259 | function | `_eqv` |
| 344 | function | `_nodal` |
| 365 | function | `_pieces` |
| 381 | function | `_gen_xd2` |
| 392 | function | `_sources` |
| 401 | function | `_reached` |
| 420 | function | `network` |
| 626 | function | `_eqv_net` |
| 674 | function | `_xf_pf` |
| 708 | function | `_xf_sc` |
| 737 | function | `_bus_out` |
| 741 | function | `elements_of` |
| 796 | function | `load_flow` |
| 813 | function | `_sc_at` |
| 820 | function | `_sc_all` |
| 840 | function | `faults_of` |
| 845 | function | `short_circuit` |

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
| 728 | function | `_maybe_int` |
| 738 | function | `pack` |
| 772 | function | `_esc` |
| 776 | function | `_segments` |
| 789 | function | `_dc_segments` |
| 805 | function | `_dc_stations` |
| 818 | function | `_col` |
| 823 | function | `svg` |
| 946 | function | `_graticule` |
| 967 | function | `route_mid` |
| 979 | function | `scale_bar` |
| 986 | function | `_scalebar` |
| 995 | function | `dxf` |

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
| 1255 | method | `Network.equivalent` |
| 1265 | method | `Network.to_emt` |
| 1354 | function | `_coo` |
| 1360 | function | `_zip` |
| 1365 | function | `_solve` |
| 1376 | function | `_nr` |
| 1412 | function | `sssc_placement` |
| 1469 | function | `superposition` |
| 1493 | function | `trv` |
| 1527 | function | `_matrix` |
| 1539 | function | `read_matpower` |
| 1576 | function | `ieee` |
| 1586 | function | `case_data` |
| 1597 | function | `case_solution` |
| 1606 | function | `ieee9` |
| 1633 | function | `ieee14` |
| 1646 | function | `to_dict` |
| 1666 | function | `from_dict` |
| 1694 | function | `save` |
| 1698 | function | `load` |

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
| 516 | function | `_sc` |
| 540 | function | `network_report` |
| 723 | function | `_security` |
| 758 | function | `_cpf` |
| 817 | function | `_se` |
| 916 | function | `_harmonic` |
| 976 | function | `_unbalanced` |
| 1053 | function | `_branches` |

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
| 46 | class | `StudyError` |
| 50 | function | `_clean` |
| 69 | function | `_base_network` |
| 101 | function | `_geo_of` |
| 117 | function | `_networks_of` |
| 130 | function | `network_of` |
| 135 | function | `open_file` |
| 152 | function | `_feeder_text` |
| 170 | function | `save_file` |
| 191 | function | `_picture` |
| 208 | function | `_geo_summary` |
| 216 | function | `_study` |
| 290 | function | `_faults` |
| 298 | function | `summary` |
| 412 | function | `_feeder` |
| 436 | function | `_feeder_summary` |
| 454 | function | `_feeder_run` |
| 479 | function | `_station` |
| 532 | function | `_station_summary` |
| 543 | function | `_station_run` |
| 553 | function | `_station_report` |
| 594 | function | `run` |
| 644 | function | `view` |
| 684 | function | `_stem` |
| 690 | function | `report` |
| 726 | function | `area` |

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
