# Χάρτης κώδικα (παράγεται αυτόματα)

Παράγεται με `python tools/codemap.py`. Μην τον αλλάζεις με το χέρι. Ο CI ελέγχει ότι είναι ενημερωμένος (`--check`).
Τι κάνει κάθε κομμάτι και πού αλλάζεις τι: [ARCHITECTURE.md](ARCHITECTURE.md).

## Αρχεία

| Αρχείο | Γραμμές |
|---|---:|
| `web/studio/addon_client.js` | 30 |
| `web/studio/addons.js` | 116 |
| `web/studio/app.js` | 3359 |
| `web/studio/bus.js` | 197 |
| `web/studio/ctlwin.js` | 78 |
| `web/studio/editor.js` | 742 |
| `web/studio/expr.js` | 73 |
| `web/studio/inputs.js` | 62 |
| `web/studio/inside.js` | 143 |
| `web/studio/kernels.js` | 30 |
| `web/studio/lblplace.js` | 162 |
| `web/studio/library.js` | 57 |
| `web/studio/linedata.js` | 664 |
| `web/studio/linemodels.js` | 4 |
| `web/studio/live.js` | 92 |
| `web/studio/live_worker.js` | 88 |
| `web/studio/math.js` | 144 |
| `web/studio/metrics.js` | 89 |
| `web/studio/mna.js` | 2639 |
| `web/studio/netlib.js` | 1535 |
| `web/studio/netview.js` | 227 |
| `web/studio/nn.js` | 57 |
| `web/studio/parts.js` | 1665 |
| `web/studio/plotcore.js` | 150 |
| `web/studio/pool.js` | 29 |
| `web/studio/pyrt.js` | 87 |
| `web/studio/recview.js` | 84 |
| `web/studio/scenario.js` | 164 |
| `web/studio/scenario_worker.js` | 122 |
| `web/studio/scope.js` | 339 |
| `web/studio/sim_worker.js` | 17 |
| `web/studio/sparse.js` | 165 |
| `web/studio/split.js` | 305 |
| `web/studio/split_worker.js` | 26 |
| `web/studio/splitwin.js` | 45 |
| `web/studio/stepcheck.js` | 315 |
| `web/studio/subcircuit.js` | 293 |
| `web/studio/templates.js` | 32 |
| `web/studio/trv.js` | 56 |
| `web/studio/tune.js` | 237 |
| `web/studio/tutorials.js` | 2481 |
| `web/studio/units.js` | 164 |
| `web/studio/watch.js` | 339 |
| `web/studio/winframe.js` | 63 |
| `pcl/runner.js` | 27 |
| `run.py` | 324 |
| `engine/__init__.py` | 1 |
| `engine/addons.py` | 322 |
| `engine/analysis.py` | 307 |
| `engine/batch.py` | 3286 |
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
| `pcl/core.py` | 1407 |
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
| `tests/test_api_surface.py` | 318 |
| `tests/test_arc.py` | 189 |
| `tests/test_b4.py` | 300 |
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
| `tests/test_guide.py` | 197 |
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
| `tests/test_rms.py` | 225 |
| `tests/test_scopf.py` | 263 |
| `tests/test_se.py` | 366 |
| `tests/test_sparse.py` | 53 |
| `tests/test_split.py` | 97 |
| `tests/test_sssc.py` | 444 |
| `tests/test_step.py` | 167 |
| `tests/test_stream.py` | 136 |
| `tests/test_studio_math.py` | 50 |
| `tests/test_studio_sim.py` | 609 |
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
| `tests/js/big_cases.js` | 53 |
| `tests/js/bus_cases.js` | 127 |
| `tests/js/cable_tutorial.js` | 10 |
| `tests/js/ctl_cases.js` | 33 |
| `tests/js/dcdc_cases.js` | 13 |
| `tests/js/ev_cases.js` | 37 |
| `tests/js/ev_weights_cases.js` | 15 |
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
| `tests/ui/bus_flow.js` | 90 |
| `tests/ui/editor_interactions.js` | 45 |
| `tests/ui/ev_flow.js` | 112 |
| `tests/ui/facts_flow.js` | 93 |
| `tests/ui/features_flow.js` | 366 |
| `tests/ui/gis_flow.js` | 80 |
| `tests/ui/line_flow.js` | 166 |
| `tests/ui/live_flow.js` | 41 |
| `tests/ui/perf_flow.js` | 68 |
| `tests/ui/scenario_flow.js` | 70 |
| `tests/ui/scope_flow.js` | 169 |
| `tests/ui/speed_flow.js` | 104 |
| `tests/ui/step_flow.js` | 91 |
| `tests/ui/studio_flow.js` | 45 |
| `tests/ui/subcircuit_flow.js` | 79 |
| `tests/ui/ux_flow.js` | 87 |
| `tests/ui/watch_flow.js` | 113 |
| `tests/ui/wiring_flow.js` | 128 |

## Στοιχεία και μπλοκ (`web/studio/parts.js`, `PARTS`)

| Γραμμή | Τύπος | Όνομα |
|---:|---|---|
| 176 | `R` | Αντίσταση |
| 180 | `CPE` | CPE / Warburg |
| 186 | `L` | Πηνίο |
| 190 | `C` | Πυκνωτής |
| 194 | `VDC` | Πηγή DC / μπαταρία |
| 200 | `VAC` | Πηγή AC |
| 204 | `VAC3` | Τριφασική πηγή (Y) |
| 211 | `IDC` | Πηγή ρεύματος |
| 217 | `SW` | Διακόπτης (MOSFET / IGBT) |
| 230 | `D` | Δίοδος |
| 234 | `SCR` | Θυρίστορ (SCR) |
| 246 | `XFMR` | Μετασχηματιστής |
| 254 | `ILG` | Κεραυνικό ρεύμα (Heidler) |
| 267 | `VIMP` | Κρουστική τάση (1,2/50, 250/2500) |
| 280 | `TL` | Γραμμή μεταφοράς (οδεύοντα κύματα) |
| 293 | `KL` | Συζευγμένα πηνία (N×N) |
| 304 | `KG` | Πολυθυρική αντίσταση / αγωγιμότητα |
| 311 | `MOV` | Αλεξικέραυνο (MOV, μη γραμμική αντίσταση) |
| 319 | `SG` | Σπινθηριστής (διάκενο) |
| 336 | `DS` | Αποζεύκτης με επαναναύσεις (GIS) |
| 345 | `CPL` | Φορτίο σταθερής ισχύος |
| 349 | `SH` | Δειγματοληψία και συγκράτηση (S&H) |
| 358 | `GND` | Γείωση |
| 360 | `JUNC` | Κόμβος |
| 361 | `PWM` | PWM / έλεγχος |
| 399 | `DCM` | Μηχανή ΣΡ (ανεξάρτητη διέγερση) |
| 410 | `VM` | Βολτόμετρο |
| 412 | `AM` | Αμπερόμετρο (σε σειρά) |
| 415 | `VP` | Probe τάσης (ως προς τη γη) |
| 417 | `IP` | Probe ρεύματος (τσιμπίδα) |
| 419 | `MEAS` | Μέτρηση στοιχείου |
| 423 | `CONST` | Σταθερά / πρόγραμμα |
| 432 | `GAIN` | Κέρδος |
| 434 | `SUM` | Άθροισμα |
| 437 | `MUL` | Γινόμενο |
| 439 | `DIV` | Διαίρεση a/b |
| 442 | `SAT` | Κορεσμός |
| 445 | `CMP` | Συγκριτής |
| 448 | `LOGIC` | Λογική πύλη |
| 451 | `PIB` | PI διακριτός |
| 457 | `UD` | Καθυστέρηση z⁻¹ |
| 460 | `SR` | Μανδαλωτής SR (latch) |
| 463 | `CLK` | Ρολόι (τετραγωνικό) |
| 466 | `RAMP` | Φέρον / ράμπα |
| 471 | `EXPR` | Έκφραση |
| 475 | `PY` | Μπλοκ Python |
| 483 | `AIC` | Ελεγκτής AI (βρόχος με νευρωνικό) |
| 501 | `AVR` | Διέγερση και ρυθμιστής τάσης (AVR: IEEE ST1A, DC1A) |
| 512 | `PSS` | Σταθεροποιητής συστήματος (PSS) |
| 517 | `GOV` | Ρυθμιστής στροφών και στρόβιλος |
| 530 | `EVC` | Πολυκριτηριακός ελεγκτής οχήματος (ταχύτητα → ροπή → ρεύμα) |
| 540 | `NN` | Νευρωνικό δίκτυο (MLP) |
| 603 | `MOD3` | Διαμορφωτής τριφασικός |
| 607 | `FEST` | Εκτιμητής ροής δρομέα |
| 611 | `INT` | Ολοκληρωτής |
| 615 | `LPF` | Βαθυπερατό 1ης τάξης |
| 619 | `F2` | Φίλτρο 2ης τάξης |
| 624 | `RLIM` | Όριο ρυθμού μεταβολής |
| 628 | `RT` | Αλλαγή ρυθμού δειγματοληψίας |
| 632 | `EDGE` | Ανιχνευτής ακμής |
| 636 | `CLARKE` | Clarke abc → αβ |
| 640 | `ICLARKE` | Clarke αβ → abc |
| 644 | `PARK` | Park αβ → dq |
| 647 | `IPARK` | Park dq → αβ |
| 650 | `PLL` | PLL (τριφασικό) |
| 656 | `TAGO` | Ετικέτα: προς (Goto) |
| 659 | `TAGI` | Ετικέτα: από (From) |
| 663 | `AVG` | Μέση τιμή |
| 666 | `RMS` | Ενεργός τιμή (RMS) |
| 669 | `MNMX` | Ελάχιστο και μέγιστο ανά περίοδο |
| 677 | `FOUR` | Fourier: αρμονική ν |
| 684 | `THD` | Ολική αρμονική παραμόρφωση (THD) |
| 694 | `PQ1` | Ισχύς (μονοφασική) |
| 699 | `PQ3` | Στιγμιαία ισχύς p, q (τριφασική) |
| 706 | `PPOS` | Ισχύς θετικής ακολουθίας |
| 712 | `SEQ` | Αναλυτής ακολουθιών |
| 721 | `PIA` | Περιοδικός μέσος παλμών |
| 725 | `DISP` | Ένδειξη |
| 729 | `SUB` | Υποκύκλωμα |
| 732 | `PORT` | Θύρα (ηλεκτρική) |
| 735 | `SIN` | Θύρα εισόδου σήματος |
| 738 | `SOUT` | Θύρα εξόδου σήματος |
| 742 | `MUX` | Πολυπλέκτης (Mux): σήματα → δίαυλος |
| 747 | `DEMUX` | Αποπολυπλέκτης (Demux): δίαυλος → σήματα |
| 751 | `BSEL` | Επιλογή από δίαυλο |
| 754 | `EBUS` | Δίαυλος αγωγών (π.χ. τριφασικός) |
| 761 | `GRID3` | Ισοδύναμο δικτύου (S″k, X/R, Z₀) |
| 773 | `FLT3` | Σφάλμα (βραχυκύκλωμα) |
| 782 | `CB3` | Διακόπτης ισχύος (τριφασικός) |
| 792 | `ARCX` | Τμήμα τόξου |
| 796 | `ARC` | Διακόπτης με τόξο (μονοφασικός) |
| 803 | `XF3` | Μετασχηματιστής τριφασικός (ομάδα σύνδεσης) |
| 817 | `LOAD3` | Τριφασικό φορτίο (P, Q) |
| 863 | `LINE3` | Γραμμή (τμήμα π, ακολουθίες) |
| 877 | `TLM` | Γραμμή από γεωμετρία (CP / FD / WB) |
| 913 | `TOWER` | Πύργος γραμμής (κεραυνοί) |
| 937 | `SAI` | Αλεξικέραυνο ZnO, μοντέλο IEEE (εξαρτάται από τη συχνότητα) |
| 952 | `SAIX` | Αλεξικέραυνο IEEE (συμπαγές) |
| 956 | `RFX` | Γείωση πύργου R(I) (από τη γραμμή του πύργου) |
| 962 | `CHB` | Αρθρωτός βραχίονας: γέφυρες H σε σειρά (CHB) |
| 970 | `NLC` | Διαμόρφωση πλησιέστερης στάθμης (NLC) με ταξινόμηση |
| 976 | `SPLL` | PLL μονοφασικό (SOGI) |
| 983 | `SSSC` | Έλεγχος αρθρωτού SSSC (m-SSSC) |
| 1002 | `SSSC3` | Κεντρικός έλεγχος τριφασικού m-SSSC |
| 1026 | `MMC` | Μετατροπέας MMC (HVDC, μοντέλα 1–4) |
| 1055 | `MMCC` | Έλεγχος σταθμού MMC (HVDC) |
| 1103 | `VSC2` | Μετατροπέας VSC δύο επιπέδων (μέσο μοντέλο, φίλτρο L ή LC) |
| 1118 | `DCDC` | Μετατροπέας DC/DC (μέσο μοντέλο, χωρίς απώλειες) |
| 1134 | `PMU3` | Μονάδα μέτρησης φασιθετών (PMU, θετική ακολουθία) |
| 1146 | `GFMC` | Έλεγχος grid-forming (στατικότητα, VSM, PSC, dVOC, matching) |
| 1196 | `LCC6` | Γέφυρα θυρίστορ 6 παλμών (LCC) |
| 1212 | `LCCS` | Σταθμός LCC 12 παλμών (HVDC) |
| 1227 | `LCCC` | Έλεγχος σταθμού LCC (HVDC) |
| 1252 | `FILT3` | Φίλτρο AC τριφασικό |
| 1258 | `ZSER3` | Τριφασική εμπέδηση σειράς (R + L + (R + L) ∥ R) |
| 1264 | `LCCX` | Γέφυρα 6 παλμών (συμπαγής) |
| 1269 | `LCCM` | Μέτρηση α και γ (γέφυρα 6 παλμών) |
| 1274 | `MMCA` | Βραχίονας MMC (συμπαγής) |
| 1279 | `CHBX` | Αρθρωτός βραχίονας (συμπαγής) |
| 1282 | `SPLX` | PLL μονοφασικό (SOGI, συμπαγές) |
| 1286 | `NOTE` | Σημείωση (κείμενο στο σχέδιο) |

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
| 300 | function | `signalsFor` |
| 317 | const fn | `fold` |
| 319 | function | `fillSignals` |
| 326 | function | `renderChannels` |
| 347 | function | `requestMeasure` |
| 348 | function | `renderMeasure` |
| 360 | function | `MeasureUnit` |
| 363 | function | `simKey` |
| 364 | function | `perSeries` |
| 365 | function | `refFor` |
| 366 | const fn | `sched` |
| 370 | function | `metricsFor` |
| 374 | function | `metricsRows` |
| 379 | function | `eventMetricsHTML` |
| 381 | function | `renderMetricsPanel` |
| 392 | function | `rawSeries` |
| 395 | function | `autoF1` |
| 399 | function | `evRows` |
| 401 | function | `renderEvents` |
| 403 | const fn | `fv` |
| 409 | function | `evMaxSetting` |
| 410 | function | `eventsJson` |
| 411 | function | `eventsCsv` |
| 413 | function | `renderFFT` |
| 436 | function | `cellZ` |
| 438 | function | `renderEISForm` |
| 439 | const fn | `opt` |
| 443 | function | `runEIS` |
| 451 | function | `drawEIS` |
| 470 | function | `perSamples` |
| 472 | function | `periodText` |
| 473 | const fn | `svgPlot` |
| 475 | function | `pcmMapFn` |
| 477 | const fn | `z` |
| 480 | function | `renderPoincare` |
| 496 | function | `bfParams` |
| 498 | function | `renderBifurcationForm` |
| 504 | function | `runBifurcation` |
| 518 | function | `stopBifurcation` |
| 519 | function | `drawBifurcation` |
| 529 | function | `niceTop` |
| 532 | function | `btStatus` |
| 533 | function | `parseStep` |
| 534 | function | `runBatch` |
| 550 | function | `clearBatch` |
| 552 | function | `meanPL` |
| 554 | function | `ringTrace` |
| 556 | function | `compareHTML` |
| 566 | function | `renderBatch` |
| 571 | function | `parseCSV` |
| 573 | const fn | `cells` |
| 574 | const fn | `num` |
| 580 | const fn | `normName` |
| 581 | function | `renderCsvMap` |
| 582 | const fn | `auto` |
| 588 | function | `applyCsv` |
| 593 | function | `renderCsv` |
| 595 | function | `clearCsv` |
| 597 | function | `sampleCompareHTML` |
| 613 | function | `pwmGainsText` |
| 620 | function | `toggleInput` |
| 623 | function | `setInputMeta` |
| 627 | function | `inputsHTML` |
| 628 | const fn | `val` |
| 637 | function | `liveChange` |
| 639 | function | `renderLiveLog` |
| 648 | function | `changesToSchedule` |
| 650 | const fn | `f` |
| 659 | function | `updateLivePanel` |
| 664 | function | `setLivePanel` |
| 667 | function | `switchesOf` |
| 670 | function | `addPulses` |
| 672 | function | `pulseKeys` |
| 673 | function | `refreshControls` |
| 676 | const fn | `phase` |
| 710 | const fn | `setD` |
| 726 | const fn | `setPh` |
| 738 | const fn | `pinNow` |
| 749 | const fn | `pinSet` |
| 761 | function | `pinMap` |
| 762 | function | `pinX` |
| 763 | function | `pinV` |
| 769 | function | `liveParam` |
| 784 | function | `closeInspector` |
| 785 | function | `placePopup` |
| 788 | function | `fieldValue` |
| 793 | function | `fieldHTML` |
| 808 | function | `placeAt` |
| 809 | function | `popupDrag` |
| 818 | function | `nnBlock` |
| 819 | function | `nnBox` |
| 822 | function | `nnLearned` |
| 823 | function | `openInspector` |
| 831 | const fn | `wired` |
| 841 | const fn | `same` |
| 842 | const fn | `apply` |
| 857 | function | `ctlCtx` |
| 865 | function | `splitProposal` |
| 867 | function | `openSplitWin` |
| 870 | const fn | `single` |
| 873 | function | `openCtlWin` |
| 877 | const fn | `wireWidth` |
| 878 | function | `openWireInspector` |
| 895 | const fn | `numOf` |
| 901 | function | `psec` |
| 903 | function | `propsOpen` |
| 904 | function | `setProps` |
| 906 | function | `focusComp` |
| 907 | function | `togglePin` |
| 910 | function | `renderProps` |
| 919 | function | `propsComp` |
| 920 | const fn | `secOf` |
| 922 | const fn | `exprV` |
| 923 | const fn | `inpB` |
| 924 | const fn | `row` |
| 930 | const fn | `wired` |
| 944 | function | `propsJunc` |
| 946 | function | `propsWire` |
| 952 | function | `propsMulti` |
| 955 | function | `propsCircuit` |
| 966 | const fn | `opt` |
| 976 | const fn | `sv` |
| 1012 | const fn | `chk` |
| 1023 | function | `bindProps` |
| 1060 | function | `diagItems` |
| 1069 | function | `renderDiag` |
| 1080 | function | `openDiag` |
| 1081 | function | `flashComp` |
| 1089 | function | `stepAdvice` |
| 1101 | function | `stepAdviceShow` |
| 1102 | function | `scheduleStepCheck` |
| 1103 | function | `runStepCheck` |
| 1104 | const fn | `inPage` |
| 1111 | function | `syncStepMode` |
| 1173 | function | `scenSetCode` |
| 1174 | function | `scenState` |
| 1175 | function | `scenTab` |
| 1176 | function | `scenOut` |
| 1177 | function | `scenWorker` |
| 1179 | function | `scenRun` |
| 1187 | function | `scenStop` |
| 1188 | function | `scenDone` |
| 1190 | function | `scenMsg` |
| 1205 | function | `scenBatch` |
| 1210 | function | `scenEval` |
| 1213 | function | `addonDock` |
| 1216 | function | `renderAddons` |
| 1217 | const fn | `vsel` |
| 1231 | function | `knockToast` |
| 1234 | function | `initAddons` |
| 1241 | function | `scenBatchWrite` |
| 1244 | function | `renderScenFiles` |
| 1247 | const fn | `scenNum` |
| 1248 | function | `scenTable` |
| 1249 | function | `scenShow` |
| 1262 | function | `scenTicks` |
| 1263 | function | `scenPlot` |
| 1267 | const fn | `thin` |
| 1274 | const fn | `dig` |
| 1285 | function | `initScenarios` |
| 1292 | function | `liveApply` |
| 1295 | function | `closeMenu` |
| 1296 | function | `openMenu` |
| 1320 | function | `updateHover` |
| 1338 | const fn | `atTop` |
| 1339 | function | `topDoc` |
| 1340 | function | `defsOf` |
| 1341 | const fn | `pid` |
| 1342 | function | `fullDoc` |
| 1344 | function | `commitView` |
| 1346 | function | `viewDiag` |
| 1347 | const fn | `rel` |
| 1350 | function | `compAt` |
| 1355 | function | `allComps` |
| 1356 | const fn | `walk` |
| 1362 | function | `partDef` |
| 1364 | function | `pdefaults` |
| 1365 | function | `subParams` |
| 1367 | function | `placeOk` |
| 1369 | function | `renameChannels` |
| 1371 | function | `levelDoc` |
| 1372 | function | `applyLevel` |
| 1373 | function | `groupSel` |
| 1378 | function | `expandSub` |
| 1382 | function | `libToSub` |
| 1384 | function | `uniqueSub` |
| 1385 | function | `subMenu` |
| 1389 | function | `enterSub` |
| 1395 | function | `leaveSub` |
| 1401 | function | `renderCrumbs` |
| 1409 | function | `curDef` |
| 1410 | function | `publicOf` |
| 1411 | function | `togglePublic` |
| 1419 | function | `propsSub` |
| 1427 | function | `bindSub` |
| 1435 | function | `propsDef` |
| 1450 | function | `bindDef` |
| 1466 | function | `exportDef` |
| 1468 | function | `importDefs` |
| 1479 | function | `palLoad` |
| 1480 | function | `palSave` |
| 1481 | function | `palRecent` |
| 1482 | function | `palItem` |
| 1486 | function | `renderPalette` |
| 1494 | const fn | `isOpen` |
| 1508 | function | `tutorial` |
| 1511 | function | `circuitSig` |
| 1521 | function | `tutorialRef` |
| 1522 | function | `theoryValidity` |
| 1528 | function | `staleBanner` |
| 1531 | function | `bindRestore` |
| 1532 | function | `loadTutorial` |
| 1537 | function | `migrateFile` |
| 1540 | function | `applyProject` |
| 1551 | function | `renderTutorial` |
| 1561 | function | `gallery` |
| 1567 | function | `api` |
| 1568 | function | `paramsOf` |
| 1571 | function | `avgOver` |
| 1574 | function | `simValue` |
| 1580 | function | `lastPP` |
| 1582 | function | `runTheory` |
| 1595 | function | `cmpRows` |
| 1596 | function | `stepsHTML` |
| 1597 | function | `renderTheory` |
| 1629 | function | `rippleDev` |
| 1631 | function | `periodAvgAt` |
| 1633 | function | `samplingTheory` |
| 1642 | const fn | `lastAt` |
| 1664 | function | `polyTheory` |
| 1671 | const fn | `frac` |
| 1700 | function | `lastPeriods` |
| 1701 | function | `evalOrderHTML` |
| 1710 | function | `genScTheory` |
| 1712 | const fn | `Iac` |
| 1720 | function | `shaftModes` |
| 1727 | function | `fbmTheory` |
| 1735 | function | `ieee9Theory` |
| 1743 | function | `schedNow` |
| 1745 | function | `fundOf` |
| 1751 | function | `ssscNet3` |
| 1752 | const fn | `c` |
| 1755 | const fn | `ser` |
| 1756 | const fn | `ln` |
| 1764 | function | `ssscTheory` |
| 1799 | function | `ccscTheory` |
| 1804 | const fn | `cm` |
| 1806 | const fn | `dev` |
| 1809 | const fn | `lineI` |
| 1830 | function | `ieee9ssscTheory` |
| 1845 | function | `hvdcTheory` |
| 1870 | function | `gfmIslandDvoc` |
| 1883 | function | `gfmTheory` |
| 1925 | function | `ieee9GfmTheory` |
| 1944 | function | `hvdcGfmTheory` |
| 1957 | function | `lccTheory` |
| 1958 | const fn | `st` |
| 1964 | const fn | `g` |
| 1976 | function | `wbModelHTML` |
| 1984 | function | `cableXbTheory` |
| 1985 | const fn | `rms` |
| 1986 | const fn | `pk` |
| 1998 | const fn | `v` |
| 2003 | function | `lineFdTheory` |
| 2004 | const fn | `lab` |
| 2012 | const fn | `pk` |
| 2019 | function | `trvAfterZero` |
| 2025 | function | `trvSvg` |
| 2027 | const fn | `path` |
| 2034 | function | `trvTerminalTheory` |
| 2047 | function | `trvSlfTheory` |
| 2067 | function | `lightningTheory` |
| 2069 | const fn | `pk` |
| 2090 | function | `gisPeaks` |
| 2091 | function | `atT` |
| 2093 | function | `gisPath` |
| 2097 | function | `gis765Theory` |
| 2108 | function | `gisVftoTheory` |
| 2117 | function | `dsRestrikeTheory` |
| 2132 | function | `inscoHTML` |
| 2143 | function | `inscoAct` |
| 2148 | function | `inscoTheory` |
| 2154 | function | `netFaultTheory` |
| 2169 | function | `busDqTheory` |
| 2177 | function | `subLegsTheory` |
| 2189 | function | `currentCtlTheory` |
| 2196 | const fn | `R` |
| 2199 | const fn | `over` |
| 2209 | const fn | `row` |
| 2215 | function | `blocksTheory` |
| 2230 | function | `pcmTheory` |
| 2256 | function | `codeTheory` |
| 2266 | function | `eisTheory` |
| 2268 | const fn | `ser` |
| 2281 | function | `imSteady` |
| 2284 | function | `imPar` |
| 2285 | function | `phaseRms` |
| 2286 | function | `vfTheory` |
| 2299 | function | `focTheory` |
| 2316 | function | `synTheory` |
| 2335 | const fn | `need` |
| 2355 | function | `pmTheory` |
| 2357 | const fn | `mtpa` |
| 2373 | function | `srmTheory` |
| 2388 | const fn | `curve` |
| 2399 | function | `lgTheory` |
| 2410 | const fn | `cr` |
| 2417 | function | `chaosTheory` |
| 2432 | function | `nnCycles` |
| 2435 | function | `genCtlTheory` |
| 2448 | function | `evTheory` |
| 2462 | function | `nnTheory` |
| 2479 | function | `nnGuiCode` |
| 2485 | function | `runNNCompare` |
| 2493 | function | `dcDriveTheory` |
| 2494 | const fn | `per` |
| 2495 | const fn | `cross` |
| 2525 | function | `twModel` |
| 2528 | const fn | `g` |
| 2531 | function | `twLattice` |
| 2538 | const fn | `marks` |
| 2541 | function | `twTheory` |
| 2549 | const fn | `at` |
| 2566 | function | `arTheory` |
| 2586 | function | `impulseMeasure` |
| 2588 | const fn | `cross` |
| 2591 | function | `marxTheory` |
| 2609 | function | `chopModel` |
| 2612 | const fn | `f` |
| 2615 | function | `chopTheory` |
| 2629 | function | `cmp3` |
| 2633 | function | `hvExact` |
| 2634 | function | `hv153Theory` |
| 2660 | function | `besI1e` |
| 2662 | function | `heaviside` |
| 2664 | function | `lossTheory` |
| 2683 | function | `vtBreak` |
| 2684 | function | `vtTheory` |
| 2705 | function | `hvdivTheory` |
| 2707 | const fn | `r` |
| 2719 | function | `scheringTheory` |
| 2720 | const fn | `inv` |
| 2729 | const fn | `sr` |
| 2741 | const fn | `studyNet` |
| 2742 | function | `studyQ` |
| 2749 | function | `emtSpectra` |
| 2752 | function | `emtReadings` |
| 2755 | const fn | `studyKey` |
| 2756 | function | `studyOpen` |
| 2769 | function | `studyAct` |
| 2786 | function | `netViewOpen` |
| 2790 | const fn | `legend` |
| 2814 | function | `nvEdit` |
| 2823 | function | `nvApply` |
| 2824 | const fn | `same` |
| 2825 | const fn | `put` |
| 2839 | function | `mtdcTheory` |
| 2845 | function | `dcdcSteady` |
| 2850 | function | `dcdcTheory` |
| 2851 | const fn | `row` |
| 2855 | function | `b4Theory` |
| 2860 | function | `studyTheory` |
| 2878 | const fn | `X` |
| 2965 | function | `formulaTheory` |
| 3080 | function | `nodeAvg` |
| 3086 | function | `circuitForMath` |
| 3122 | function | `scheduleMath` |
| 3123 | function | `batteryKey` |
| 3125 | function | `mathChoices` |
| 3126 | const fn | `prim` |
| 3128 | function | `renderMathChoices` |
| 3130 | function | `runTemplate` |
| 3136 | function | `runMath` |
| 3158 | function | `saveLocal` |
| 3159 | function | `saveLocalSoon` |
| 3161 | function | `download` |
| 3162 | function | `exportCSV` |
| 3168 | function | `syncScopeInputs` |
| 3169 | function | `setSpeed` |
| 3172 | function | `openSettings` |
| 3173 | const fn | `sel` |
| 3174 | const fn | `chk` |
| 3200 | function | `applyLook` |
| 3204 | function | `boot` |
| 3275 | const fn | `mv` |
| 3276 | const fn | `up` |
| 3277 | const fn | `navOpen` |
| 3293 | const fn | `probeSel` |
| 3355 | function | `renderTheoryLive` |

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
| 661 | function | `refresh` |

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
| 61 | function | `scopeKeysOf` |
| 62 | const fn | `schedAt` |
| 63 | const fn | `num` |
| 68 | function | `wmW` |
| 73 | function | `wmInc` |
| 90 | const fn | `cmul` |
| 92 | function | `symc` |
| 95 | function | `wmOut` |
| 99 | const fn | `ph` |
| 112 | const fn | `numList` |
| 124 | function | `b64of` |
| 126 | function | `fromB64` |
| 129 | function | `snapEncode` |
| 130 | const fn | `num` |
| 131 | function | `enc` |
| 141 | function | `snapRestore` |
| 142 | function | `dec` |
| 153 | function | `smPort` |
| 157 | function | `smOut` |
| 161 | const fn | `genCopy` |
| 169 | function | `csolveSp` |
| 187 | function | `csolve` |
| 202 | const fn | `grpKey` |
| 209 | function | `acInit` |
| 225 | const fn | `y` |
| 275 | const fn | `seq` |
| 295 | const fn | `pAbs` |
| 334 | class | `NetlistError` |
| 339 | function | `dePiece` |
| 341 | const fn | `F` |
| 342 | function | `deInt` |
| 344 | function | `deFrac` |
| 349 | function | `lpmRun` |
| 358 | function | `lpmParams` |
| 361 | function | `gapUb` |
| 367 | function | `tlSteady` |
| 369 | const fn | `at` |
| 371 | const fn | `re` |
| 382 | function | `poleG` |
| 383 | function | `tlmModeY` |
| 388 | const fn | `mm` |
| 395 | function | `tlmAcY` |
| 401 | function | `tlmSteady` |
| 402 | const fn | `vm` |
| 416 | function | `tlElement` |
| 423 | function | `tlmElement` |
| 444 | function | `rcCoefC` |
| 446 | const fn | `mul` |
| 451 | function | `wbSet` |
| 456 | function | `wbCo` |
| 460 | function | `wbPoleG` |
| 463 | function | `wbSum` |
| 465 | function | `tlwElement` |
| 484 | function | `tlwAcY` |
| 499 | function | `tlwSteady` |
| 500 | const fn | `mv` |
| 507 | const fn | `st` |
| 517 | function | `piLine` |
| 522 | const fn | `shunt` |
| 530 | function | `rcCoef` |
| 536 | function | `fdCo` |
| 546 | function | `arcF` |
| 552 | function | `arcStep` |
| 559 | function | `arcCur` |
| 564 | function | `nlLimit` |
| 565 | function | `nlSolve` |
| 572 | function | `saiSetup` |
| 573 | const fn | `Lc` |
| 577 | function | `saiCur` |
| 585 | function | `saiCommit` |
| 595 | function | `chbCoef` |
| 600 | function | `chbCommit` |
| 607 | function | `chbStates` |
| 609 | function | `chbCount` |
| 618 | function | `mmcSample` |
| 628 | const fn | `full` |
| 637 | function | `mmcSave` |
| 638 | function | `mmcLoad` |
| 645 | function | `lccCom` |
| 648 | function | `lccMeasInit` |
| 654 | function | `lccMeasure` |
| 671 | function | `lccPlo` |
| 676 | function | `lccU` |
| 678 | function | `lccIn` |
| 681 | function | `lccSetup` |
| 684 | function | `lccEdge` |
| 686 | function | `lccGate` |
| 691 | function | `nlcStep` |
| 694 | const fn | `full` |
| 711 | function | `footLink` |
| 719 | function | `arcStart` |
| 720 | const fn | `r` |
| 723 | function | `buildNetlist` |
| 736 | const fn | `union` |
| 751 | const fn | `nm` |
| 770 | const fn | `sn` |
| 774 | const fn | `isJ` |
| 797 | const fn | `lbl` |
| 802 | const fn | `node` |
| 806 | const fn | `nodeKey` |
| 807 | const fn | `tunePwm` |
| 817 | const fn | `internal` |
| 820 | const fn | `neutNode` |
| 826 | const fn | `mkBlock` |
| 833 | const fn | `add` |
| 834 | const fn | `series` |
| 1130 | function | `compileSignals` |
| 1152 | const fn | `less` |
| 1153 | const fn | `push` |
| 1154 | const fn | `pop` |
| 1169 | function | `f2Phi` |
| 1174 | function | `cmpF` |
| 1178 | function | `stampM` |
| 1180 | function | `luFactor` |
| 1186 | function | `luSolve` |
| 1193 | class | `Sim` |
| 1194 | method | `constructor` |
| 1197 | method | `basePeriod` |
| 1201 | method | `tlMaxStep` |
| 1202 | method | `setStep` |
| 1205 | method | `stIndex` |
| 1220 | method | `stVec` |
| 1221 | method | `stepCfg` |
| 1222 | method | `varSetup` |
| 1228 | method | `setStepMode` |
| 1230 | method | `hGrid` |
| 1234 | method | `modeCap` |
| 1238 | method | `swEls` |
| 1239 | method | `topoKey` |
| 1240 | method | `topoInfo` |
| 1250 | method | `topoCheck` |
| 1267 | method | `lteReset` |
| 1268 | method | `ltePush` |
| 1272 | method | `lteErr` |
| 1282 | method | `varCheck` |
| 1298 | method | `note` |
| 1301 | method | `stepCheck` |
| 1305 | method | `stepInfo` |
| 1308 | method | `diagnostics` |
| 1311 | method | `ringCheck` |
| 1320 | method | `stateMap` |
| 1322 | method | `stateMap0` |
| 1333 | method | `load` |
| 1389 | method | `reset` |
| 1396 | method | `restrict` |
| 1404 | const fn | `own` |
| 1418 | method | `imStep` |
| 1425 | method | `smStep` |
| 1427 | method | `srmStep` |
| 1428 | method | `srmOutputs` |
| 1429 | method | `smOutputs` |
| 1433 | method | `genStep` |
| 1440 | method | `genOutputs` |
| 1445 | method | `genTm` |
| 1446 | method | `genEfd` |
| 1447 | method | `imSources` |
| 1448 | method | `pyBlocks` |
| 1458 | method | `pyLazy` |
| 1460 | method | `pyUpgrade` |
| 1462 | method | `setMethod` |
| 1463 | method | `setControl` |
| 1465 | method | `setBlock` |
| 1467 | method | `setHold` |
| 1469 | method | `markChange` |
| 1474 | method | `progInit` |
| 1475 | method | `addProgram` |
| 1477 | method | `progNext` |
| 1478 | method | `progDue` |
| 1479 | method | `progApply` |
| 1494 | method | `evInit` |
| 1495 | method | `logEv` |
| 1497 | method | `events` |
| 1499 | method | `evSwitches` |
| 1501 | method | `channelKeys` |
| 1507 | method | `compKeys` |
| 1527 | method | `watchList` |
| 1535 | method | `watchAdd` |
| 1545 | const fn | `g` |
| 1552 | method | `allocRecord` |
| 1562 | const fn | `A` |
| 1570 | method | `V` |
| 1571 | method | `elCurrent` |
| 1575 | method | `portI` |
| 1579 | method | `computeVals` |
| 1612 | method | `partVals` |
| 1636 | method | `watchLists` |
| 1645 | method | `computeWatched` |
| 1654 | method | `fullVals` |
| 1664 | method | `setRecord` |
| 1665 | method | `recordNow` |
| 1675 | method | `closePeriod` |
| 1686 | method | `lastPeriod` |
| 1687 | method | `now` |
| 1689 | method | `hasKey` |
| 1694 | method | `gateOf` |
| 1700 | method | `rawGate` |
| 1711 | method | `carrier` |
| 1714 | method | `shGrid` |
| 1717 | method | `wmCyc` |
| 1718 | method | `shNext` |
| 1720 | method | `sampleHolds` |
| 1725 | method | `samples` |
| 1726 | method | `ctrlEdges` |
| 1732 | method | `scrU` |
| 1733 | method | `scrGate` |
| 1734 | method | `scrEdges` |
| 1735 | method | `setFiring` |
| 1736 | method | `compV` |
| 1737 | method | `compI` |
| 1739 | method | `dbl` |
| 1740 | method | `sampleControllers` |
| 1774 | method | `evalBlocks` |
| 1954 | method | `blkCopy` |
| 1957 | method | `blkAnyDue` |
| 1960 | method | `blkDue` |
| 1962 | method | `zcFrac` |
| 1965 | method | `saveState` |
| 1967 | method | `restoreState` |
| 1976 | method | `snapshot` |
| 1978 | method | `restoreSnapshot` |
| 1980 | method | `gateSigPeek` |
| 1983 | method | `gateSig` |
| 1988 | method | `jumpScheds` |
| 1995 | method | `jumpAt` |
| 1996 | method | `values` |
| 2026 | method | `assemble` |
| 2043 | const fn | `g` |
| 2069 | method | `rhs` |
| 2071 | const fn | `J` |
| 2090 | method | `cplLinearize` |
| 2098 | method | `solverInfo` |
| 2113 | method | `factor` |
| 2135 | method | `baseFromCache` |
| 2138 | const fn | `cnt` |
| 2146 | method | `spAssemble` |
| 2153 | method | `solveOnce` |
| 2168 | method | `solve` |
| 2186 | method | `nlLinearize` |
| 2189 | method | `check` |
| 2209 | method | `commit` |
| 2235 | method | `initialSolve` |
| 2247 | method | `tlSources` |
| 2251 | method | `tlRecord` |
| 2258 | method | `tlHist` |
| 2264 | method | `tlmG` |
| 2268 | method | `tlmSources` |
| 2282 | method | `tlmRecord` |
| 2297 | method | `tlwG` |
| 2303 | method | `tlwSources` |
| 2318 | method | `tlwRecord` |
| 2335 | method | `tlmHist` |
| 2342 | method | `step` |
| 2344 | const fn | `gs` |
| 2350 | method | `stepCore` |
| 2411 | method | `edgeSolve` |
| 2414 | method | `edgePoint` |
| 2415 | method | `mmcMoved` |
| 2418 | method | `arcGate` |
| 2426 | method | `trRestart` |
| 2434 | method | `nextEvent` |
| 2440 | const fn | `sch` |
| 2465 | method | `spwmCut` |
| 2468 | const fn | `sig` |
| 2473 | method | `run` |
| 2476 | method | `runUntil` |
| 2522 | function | `tuneInfo` |
| 2525 | function | `exportForBatch` |
| 2548 | const fn | `hist` |
| 2564 | const fn | `ci` |
| 2565 | const fn | `vd` |
| 2566 | const fn | `V` |
| 2569 | const fn | `linePort` |
| 2571 | const fn | `I` |
| 2572 | const fn | `portRec` |
| 2573 | const fn | `rec` |
| 2590 | const fn | `clkOf` |
| 2616 | function | `sweepPoint` |
| 2621 | function | `setPath` |
| 2627 | function | `eisPoint` |
| 2635 | function | `resume` |

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
| 138 | function | `xfDef` |
| 142 | const fn | `star` |
| 144 | const fn | `ends` |
| 162 | function | `loadDef` |
| 165 | const fn | `starN` |
| 198 | function | `lineData` |
| 202 | function | `lineDef` |
| 204 | const fn | `mat` |
| 232 | function | `aicDef` |
| 265 | const fn | `out` |
| 276 | function | `evcDef` |
| 289 | const fn | `cl` |
| 293 | const fn | `io` |
| 294 | const fn | `E` |
| 348 | const fn | `out` |
| 357 | const fn | `fT` |
| 358 | function | `ctlKit` |
| 360 | const fn | `lag` |
| 362 | const fn | `leadlag` |
| 364 | const fn | `wash` |
| 366 | const fn | `nwLag` |
| 373 | const fn | `sched` |
| 375 | function | `avrDef` |
| 376 | const fn | `io` |
| 377 | const fn | `N` |
| 410 | function | `pssDef` |
| 419 | function | `govDef` |
| 459 | const fn | `out` |
| 466 | function | `footTable` |
| 471 | function | `lpmOf` |
| 473 | function | `msTower` |
| 486 | function | `msFoot` |
| 490 | function | `towerDef` |
| 524 | function | `saiTable` |
| 525 | function | `saiParams` |
| 531 | function | `saiV10` |
| 532 | const fn | `W` |
| 537 | function | `saiFitL1` |
| 542 | function | `saiDef` |
| 549 | const fn | `par` |
| 559 | const fn | `nCells` |
| 560 | function | `chbDef` |
| 562 | const fn | `out` |
| 573 | const fn | `sw` |
| 574 | const fn | `gate` |
| 588 | function | `spllDef` |
| 593 | const fn | `E` |
| 599 | const fn | `w` |
| 611 | function | `ssscDef` |
| 612 | const fn | `io` |
| 613 | const fn | `E` |
| 628 | const fn | `sched` |
| 656 | function | `sssc3Def` |
| 658 | const fn | `sin` |
| 659 | const fn | `E` |
| 662 | const fn | `flt` |
| 677 | const fn | `sched` |
| 691 | const fn | `vf` |
| 720 | function | `mmcDef` |
| 725 | const fn | `sin` |
| 726 | const fn | `w` |
| 732 | const fn | `refs` |
| 734 | const fn | `toU` |
| 735 | const fn | `ccsc` |
| 753 | const fn | `energy` |
| 756 | const fn | `six` |
| 814 | const fn | `arm` |
| 816 | const fn | `sw` |
| 841 | function | `mmccDef` |
| 844 | const fn | `sin` |
| 845 | const fn | `w` |
| 846 | const fn | `pos` |
| 853 | const fn | `dq` |
| 868 | const fn | `integ` |
| 976 | function | `lcc6Def` |
| 977 | const fn | `sin` |
| 1005 | function | `lccsDef` |
| 1006 | const fn | `sin` |
| 1012 | const fn | `xf` |
| 1014 | const fn | `br` |
| 1072 | function | `lcccDef` |
| 1073 | const fn | `sin` |
| 1074 | const fn | `pos` |
| 1087 | const fn | `pi` |
| 1117 | function | `filtDef` |
| 1118 | const fn | `pos` |
| 1121 | const fn | `G` |
| 1132 | function | `zserDef` |
| 1149 | function | `sigPorts` |
| 1150 | const fn | `sin` |
| 1152 | const fn | `out` |
| 1154 | const fn | `close` |
| 1158 | const fn | `busMap` |
| 1163 | function | `vsc2Def` |
| 1165 | const fn | `w` |
| 1193 | function | `dcdcDef` |
| 1194 | const fn | `w` |
| 1195 | const fn | `out` |
| 1222 | function | `pmuDef` |
| 1224 | const fn | `out` |
| 1249 | function | `gfmcDef` |
| 1253 | const fn | `w` |
| 1254 | const fn | `pos` |
| 1256 | const fn | `integ` |
| 1267 | const fn | `dq` |
| 1284 | const fn | `at0` |
| 1407 | function | `defOf` |
| 1413 | function | `forceImpl` |
| 1415 | const fn | `fix` |
| 1419 | const fn | `hasLib` |
| 1420 | function | `needs` |
| 1422 | function | `expand` |
| 1424 | const fn | `conv` |
| 1432 | function | `warnings` |
| 1438 | const fn | `cx` |
| 1440 | function | `csolve` |
| 1445 | function | `faultCurrents` |
| 1465 | function | `behindXF` |
| 1476 | function | `layoutDef` |
| 1479 | const fn | `isG` |
| 1480 | const fn | `isJ` |
| 1489 | const fn | `side` |
| 1493 | const fn | `bfs` |
| 1502 | const fn | `bary` |
| 1508 | const fn | `ctr` |
| 1509 | const fn | `target` |
| 1525 | function | `placedDef` |
| 1530 | function | `sidesOf` |

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
| 1292 | function | `noteBox` |
| 1295 | function | `defaults` |
| 1297 | function | `elPins` |
| 1298 | function | `sigPins` |
| 1299 | function | `pinsOf` |
| 1302 | function | `parseMat` |
| 1304 | function | `nPorts` |
| 1305 | function | `portY` |
| 1306 | function | `portPins` |
| 1307 | function | `portBox` |
| 1309 | function | `posDef` |
| 1311 | function | `symmetric` |
| 1312 | function | `matInv` |
| 1317 | function | `klMatrix` |
| 1328 | function | `kgMatrix` |
| 1336 | function | `srmGeo` |
| 1338 | function | `srmSpins` |
| 1340 | function | `srmPins` |
| 1342 | function | `satD` |
| 1343 | function | `satDinv` |
| 1345 | function | `genSpins` |
| 1356 | function | `genTsc` |
| 1361 | function | `genCirc2` |
| 1362 | const fn | `Fn` |
| 1370 | function | `genAxis` |
| 1378 | const fn | `classic` |
| 1384 | const fn | `plist` |
| 1388 | function | `genModel` |
| 1394 | const fn | `w` |
| 1403 | const fn | `grp` |
| 1420 | function | `genGamma` |
| 1428 | function | `genDQ` |
| 1432 | function | `genSteady` |
| 1434 | const fn | `rot` |
| 1441 | function | `srmAlignedPsi` |
| 1442 | function | `srmModelPsi` |
| 1443 | function | `srmTableText` |
| 1446 | function | `srmMag` |
| 1462 | function | `chkMag` |
| 1464 | function | `srmA` |
| 1467 | function | `seg` |
| 1468 | function | `srmPsi` |
| 1470 | function | `srmCur` |
| 1472 | function | `srmTorque` |
| 1475 | function | `srmCoenergy` |
| 1479 | function | `waveShape` |
| 1480 | function | `waveAt` |
| 1483 | function | `waveMeasure` |
| 1486 | const fn | `cross` |
| 1492 | function | `waveFit` |
| 1493 | const fn | `res` |
| 1504 | function | `directWave` |
| 1507 | function | `impulseWave` |
| 1518 | function | `bewley` |
| 1521 | const fn | `at` |
| 1527 | function | `movChar` |
| 1532 | const fn | `pick` |
| 1533 | const fn | `cur` |
| 1534 | const fn | `inv` |
| 1538 | function | `impulseDesign` |
| 1543 | function | `impulseRoots` |
| 1546 | function | `tlParams` |
| 1558 | function | `tlmData` |
| 1560 | function | `tlmM` |
| 1567 | function | `tlmPin` |
| 1568 | function | `tlmPins` |
| 1570 | function | `tlmKey` |
| 1581 | function | `tlmModel` |
| 1589 | function | `lightningWave` |
| 1596 | function | `pinKind` |
| 1607 | function | `structural` |
| 1614 | function | `pinWidth` |
| 1617 | function | `xf` |
| 1618 | function | `pinPos` |
| 1620 | function | `pinDir` |
| 1625 | function | `cpeParams` |
| 1626 | function | `cpeBank` |
| 1630 | function | `cpeZ` |
| 1631 | function | `cpeZbank` |
| 1632 | function | `boxOf` |
| 1633 | function | `bbox` |
| 1638 | function | `fmtNum` |
| 1642 | function | `eng` |
| 1646 | function | `parseEng` |
| 1649 | function | `parseSched` |
| 1657 | function | `machines` |

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
| 142 | const fn | `sk` |
| 151 | function | `bifPoint` |
| 152 | function | `bifSpec` |
| 156 | function | `bifurcation` |
| 160 | const fn | `json` |

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
| 2475 | function | `dcdcInputs` |

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
| 708 | function | `gap_ub` |
| 719 | function | `lpm_rates` |
| 731 | class | `Circuit` |
| 732 | method | `Circuit.__init__` |
| 987 | method | `Circuit.R` |
| 990 | method | `Circuit.im_e` |
| 999 | method | `Circuit.im_deriv` |
| 1012 | method | `Circuit.sm_cur` |
| 1024 | method | `Circuit.sm_ports` |
| 1029 | method | `Circuit.sm_deriv` |
| 1044 | method | `Circuit.srm_A` |
| 1049 | method | `Circuit._seg` |
| 1053 | method | `Circuit.srm_cur` |
| 1060 | method | `Circuit.srm_torque` |
| 1069 | method | `Circuit.srm_currents` |
| 1074 | method | `Circuit.srm_deriv` |
| 1087 | method | `Circuit.gen_cur` |
| 1104 | method | `Circuit.gen_efd` |
| 1111 | method | `Circuit.gen_tm` |
| 1118 | method | `Circuit.gen_deriv` |
| 1136 | method | `Circuit.jac_gen` |
| 1188 | method | `Circuit.gen_out` |
| 1208 | method | `Circuit.Vsrc` |
| 1224 | method | `Circuit.topo` |
| 1234 | method | `Circuit.build` |
| 1341 | method | `Circuit.bsrc` |
| 1391 | method | `Circuit.solve_z` |
| 1435 | method | `Circuit.arc_g` |
| 1440 | method | `Circuit.solve_nl` |
| 1482 | method | `Circuit.tl_hist` |
| 1503 | method | `Circuit.tl_sec` |
| 1510 | method | `Circuit.tl_ih` |
| 1514 | method | `Circuit.tl_record` |
| 1535 | method | `Circuit.tlm_setup` |
| 1630 | method | `Circuit.tlw_setup` |
| 1708 | method | `Circuit.tlw_ix` |
| 1722 | method | `Circuit.tlw_end` |
| 1732 | method | `Circuit.tlm_hist` |
| 1757 | method | `Circuit.tlm_ih` |
| 1770 | method | `Circuit.tlm_force` |
| 1796 | method | `Circuit.tlm_modal` |
| 1815 | method | `Circuit.tlm_record` |
| 1844 | method | `Circuit.scr_u` |
| 1848 | method | `Circuit.scr_gate` |
| 1852 | method | `Circuit.scr_edges` |
| 1859 | method | `Circuit.gate_state` |
| 1872 | method | `Circuit.set_gates` |
| 1880 | method | `Circuit.arc_gates` |
| 1900 | method | `Circuit.may_turn_on` |
| 1904 | method | `Circuit.tolerances` |
| 1910 | method | `Circuit.consistent` |
| 1956 | method | `Circuit.value` |
| 1994 | method | `Circuit.current` |
| 2048 | method | `Circuit.prime` |
| 2058 | method | `Circuit.sig_in` |
| 2062 | method | `Circuit.sh_grid` |
| 2076 | method | `Circuit.sh_next` |
| 2083 | method | `Circuit.log_ev` |
| 2089 | method | `Circuit.ev_switches` |
| 2098 | method | `Circuit.sh_sample` |
| 2118 | method | `Circuit.sample` |
| 2193 | method | `Circuit.cmp_f` |
| 2199 | method | `Circuit.blk_due` |
| 2210 | method | `Circuit.eval_blocks` |
| 2783 | method | `Circuit.block_events` |
| 2812 | method | `Circuit.next_event` |
| 2883 | function | `_decimate` |
| 2900 | function | `_diagnose` |
| 2951 | function | `simulate` |
| 3280 | function | `batch_sim` |

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
| 586 | method | `Project.split` |
| 605 | method | `Project.stream` |
| 687 | method | `Project._result` |
| 694 | method | `Project._query` |
| 706 | method | `Project._run_scipy` |
| 743 | method | `Project.sweep` |
| 817 | method | `Project._sweep_meta` |
| 822 | method | `Project.bifurcation` |
| 879 | class | `_SweepFile` |
| 884 | method | `_SweepFile.__init__` |
| 898 | method | `_SweepFile._val` |
| 906 | method | `_SweepFile._read` |
| 925 | method | `_SweepFile._line` |
| 929 | method | `_SweepFile.add` |
| 933 | method | `_SweepFile.close` |
| 939 | function | `_sweep_point` |
| 947 | function | `_as_list` |
| 957 | function | `_spec` |
| 973 | function | `_measures` |
| 996 | function | `_base_T` |
| 1003 | function | `_unit` |
| 1007 | function | `_matname` |
| 1012 | class | `Result` |
| 1015 | method | `Result.__init__` |
| 1025 | method | `Result.__getitem__` |
| 1028 | method | `Result.__repr__` |
| 1031 | method | `Result.events_csv` |
| 1042 | method | `Result.measure` |
| 1102 | method | `Result.frame` |
| 1111 | method | `Result._meta_lines` |
| 1115 | method | `Result.to_csv` |
| 1128 | method | `Result._vars` |
| 1138 | method | `Result.as_dict` |
| 1142 | method | `Result.to_json` |
| 1146 | method | `Result.to_mat` |
| 1157 | method | `Result.to_parquet` |
| 1165 | method | `Result.to_hdf5` |
| 1171 | method | `Result.save` |
| 1175 | function | `_save` |
| 1182 | class | `SplitResult` |
| 1186 | method | `SplitResult.__init__` |
| 1194 | method | `SplitResult.series` |
| 1199 | method | `SplitResult.__getitem__` |
| 1202 | method | `SplitResult.at` |
| 1213 | method | `SplitResult.__repr__` |
| 1217 | class | `SweepResult` |
| 1220 | method | `SweepResult.__init__` |
| 1226 | method | `SweepResult.__repr__` |
| 1229 | method | `SweepResult.column` |
| 1232 | method | `SweepResult.frame` |
| 1239 | method | `SweepResult.to_csv` |
| 1251 | method | `SweepResult.to_json` |
| 1255 | method | `SweepResult.to_mat` |
| 1262 | method | `SweepResult._columns` |
| 1266 | method | `SweepResult.to_parquet` |
| 1272 | method | `SweepResult.to_hdf5` |
| 1277 | method | `SweepResult.save` |
| 1281 | class | `BifurcationResult` |
| 1285 | method | `BifurcationResult.__init__` |
| 1292 | method | `BifurcationResult.__repr__` |
| 1295 | method | `BifurcationResult.changes` |
| 1304 | method | `BifurcationResult.rows` |
| 1308 | method | `BifurcationResult._columns` |
| 1312 | method | `BifurcationResult.frame` |
| 1319 | method | `BifurcationResult.plot` |
| 1322 | method | `BifurcationResult.to_csv` |
| 1333 | method | `BifurcationResult.to_json` |
| 1337 | method | `BifurcationResult.to_mat` |
| 1343 | method | `BifurcationResult.to_parquet` |
| 1348 | method | `BifurcationResult.to_hdf5` |
| 1353 | method | `BifurcationResult.save` |
| 1364 | function | `_el` |
| 1369 | function | `_matrix` |
| 1374 | function | `_ascii` |
| 1381 | function | `_mat_char` |
| 1386 | function | `_mat_value` |
| 1399 | function | `_savemat` |

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
