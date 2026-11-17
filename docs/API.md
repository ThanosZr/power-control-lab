# Δημόσιο API

Έκδοση 4.19.6: **σταθερό** από την 4.0: ο κανόνας παρακάτω ισχύει. Παράγεται με `python tools/api_surface.py` από τον ίδιο τον κώδικα (814 σημεία σε 7 επιφάνειες), και ο CI ελέγχει ότι είναι ενημερωμένο (`--check`).

## Κανόνας για αλλαγές που σπάνε (εγκρίθηκε 10/11/2026, ισχύει από την 4.0)

- **Τι είναι δημόσιο:** ό,τι είναι σε αυτόν τον κατάλογο: το πακέτο `pcl`, η γραμμή εντολών, οι ενέργειες του server, οι μέθοδοι των πρόσθετων και της σύνδεσης, οι συναρτήσεις MATLAB/Octave, τα αιτήματα σεναρίων και η μορφή του αρχείου project (τύποι στοιχείων, παράμετροι, ακροδέκτες). Ό,τι ξεκινά με `_` και ό,τι δεν είναι εδώ είναι εσωτερικό.
- **Μέσα σε μία κύρια έκδοση (4.x) μόνο προσθήκες:** νέες μέθοδοι, νέα προαιρετικά ορίσματα, νέα στοιχεία και νέες παράμετροι με προεπιλογή που κρατά την παλιά συμπεριφορά. Καμία αφαίρεση, μετονομασία ή αλλαγή σημασίας.
- **Αφαίρεση σε δύο βήματα:** ό,τι πρόκειται να φύγει γίνεται «παρωχημένο» σε μια 4.x (στη λίστα `DEPRECATED` του `tools/api_surface.py`, με την εναλλακτική, και με μήνυμα όπου τρέχει), δουλεύει ως το τέλος της 4.x και φεύγει στην 5.0. Στην 5.0 φεύγει μόνο ό,τι ήταν παρωχημένο.
- **Αρχεία project:** ένα παλιό αρχείο ανοίγει πάντα (ARCHITECTURE §4). Νέα πεδία είναι προαιρετικά. Όταν χρειάζεται μετατροπή, αυξάνεται το `version` του αρχείου και η μετατροπή γίνεται στο άνοιγμα, με test. Το `version` 3 (3.18): τα σύρματα με το ίδιο όνομα είναι ένας κόμβος· ένα παλιότερο αρχείο ανοίγει ίδιο (`Bus.migrateNames`: όπου ένα όνομα ήταν ετικέτα σε δύο κόμβους, το δεύτερο γίνεται «όνομα·2»).
- **Ο έλεγχος:** το `python tools/api_surface.py` σταματά όταν κάτι λείπει ή έχασε όρισμα. Ως την 4.0 περνούσε με `--allow-removal "λόγος"`, και η αφαίρεση γράφεται παρακάτω. Από την 4.0 μέσα στην ίδια κύρια έκδοση δεν περνά ούτε με `--allow-removal`· στην επόμενη κύρια περνά μόνο για ό,τι ήταν παρωχημένο. Ένα παρωχημένο σημείο πρέπει να υπάρχει ακόμη στον κώδικα.

- **Πειραματικά (3.19):** `pcl.control.…`, `pcl.workbench.…`, `pcl.wideband.…`, `pcl.powerflow.…`, `pcl.opf.…`, `pcl.ipm.…`, `pcl.backend.…`, `pcl.accel.…`, `pcl.nnstart.…`, `pcl.onnxio.…`, `pcl.netview.…`, `pcl.netfile.…`, `pcl.psse.…`, `pcl.scopf.…`, `pcl.cpf.…`, `pcl.se.…`, `pcl.harmonic.…`, `pcl.unbalanced.…`, `workbench…`, `python -m pcl accel…`, `python -m pcl nnstart…` (έλεγχος με AI §38, Control Workbench §19, η προσαρμογή wideband της 4.13, οι πυρήνες των λυτών μόνιμης κατάστασης της 4.19.1: ροή φορτίου, βέλτιστη ροή φορτίου, εσωτερικό σημείο· και της 4.19.2: τα backends των παρτίδων με τον δρόμο GPU*, το script του επιταχυντή, τα μοντέλα εκκίνησης και τα αρχεία ONNX). Καταγράφονται, αλλά μένουν έξω από τον κανόνα: αλλάζουν χωρίς `--allow-removal` (η αλλαγή γράφεται στις αφαιρέσεις). Γίνονται σταθερά όταν κλείσει το στάδιο 4 του §38 (το `pcl.wideband` όταν σταθεροποιηθούν οι επιλογές του· οι πυρήνες της 4.19.1 όταν κλείσουν τα επόμενα βήματα του ROADMAP §68 που αλλάζουν τις επιλογές τους), και η μετάβαση είναι προσθήκη. Σταθερά από την αρχή: οι μελέτες του `pcl.network.Network`, το αντικείμενο αναφοράς `pcl.report`, οι μελέτες ως δεδομένα `pcl.study` και οι δύο ενέργειες του server. Στους πίνακες: «πειρ.».

Στους πίνακες, «Από» είναι η έκδοση της πρώτης καταγραφής: η 3.18 για ό,τι υπήρχε ήδη.

## Παρωχημένα

Κανένα στην 4.19.6.

## Σημεία επέκτασης (3.19, 4.0): πώς μεγαλώνουν στην 4.x χωρίς να σπάσει τίποτα

| Τι | Σήμερα | Επέκταση με προσθήκες |
|---|---|---|
| Μονάδες και τύποι θυρών (`units.js`, `project.solve.units`) | V, A, rad, rad/s, N·m, V·s, 1 και ό,τι γράφει ο χρήστης· σύγκριση με δυνάμεις (Wb = V·s)· γινόμενο και διαίρεση πολλαπλασιάζουν μονάδες, κέρδος «·Ω»/«/V» (4.0)· πλαίσια abc, αβ, dq· `warn`, `strict`, `off` | νέες μονάδες και πλαίσια είναι νέες λέξεις· κάθε νέο στοιχείο δηλώνει τις δικές του θύρες· ένα στοιχείο χωρίς δήλωση μένει «χωρίς τύπο», άρα ένα παλιό αρχείο δεν παίρνει νέο σφάλμα από στοιχείο που ήδη είχε· μονάδα σε PI ή μπλοκ κώδικα μόνο με νέα παράμετρο που εξ ορισμού είναι κενή |
| Πρόγραμμα αλλαγών παραμέτρων (`project.program`) | `{t, id, k, v, rate}` στα στοιχεία του κυρίως κυκλώματος (και στις δημόσιες παραμέτρους υποκυκλωμάτων) | νέα προαιρετικά πεδία (π.χ. διαδρομή `X1/L1`, σχήμα ράμπας)· ένα πεδίο που δεν αναγνωρίζεται αγνοείται |
| Αρχείο συμβάντων (`Sim.events`, `Result.events`, `events` στον server) | είδη switch, diode, scr, gap, cmp, latch, edge, sample, duty, jump, live, program | νέα είδη και νέα πεδία ανά συμβάν· τα υπάρχοντα δεν αλλάζουν σημασία |
| Ζωντανές και δομικές παράμετροι (`Parts.structural`) | δομική = αλλάζει τους ακροδέκτες, ή είναι στη λίστα `STRUCT` (π.χ. φέρον PWM) | η λίστα μεγαλώνει με νέα στοιχεία· μια παράμετρος δεν γίνεται δομική από ζωντανή μέσα στην 4.x |
| Ονόματα συρμάτων και Goto/From | τοπικά στο instance, «/όνομα» για το κυρίως κύκλωμα | νέα προθέματα (π.χ. του γονικού instance) ως νέα σύνταξη |
| Αναφορές από μέσα προς τα έξω | δουλεύουν (πρώτα μέσα, μετά έξω)· λίστα στον ορισμό, μετατροπή σε θύρα ή δημόσια | — (καμία αλλαγή σημασίας) |
| Μπλοκ B1 | F2 (lp, hp, bp, notch), RLIM, RT (zoh, delay), EDGE (rise, fall, both) | νέες επιλογές στις ίδιες παραμέτρους (π.χ. all-pass) |
| Λύτης SciPy, συνεχή μπλοκ | T/200, ή T/1000 με πηγές από σήμα· πεδίο `cont_div` | — |

## Αφαιρέσεις και αλλαγές που σπάνε

| Έκδοση | Επιφάνεια | Σημείο | Τι | Λόγος |
|---|---|---|---|---|
| 3.18 | project | `file.wire` | χωρίς link | 3.18: τα σύρματα με το ίδιο όνομα ενώνουν πάντα (version 3), το πεδίο link δεν χρειάζεται |

## Πακέτο Python `pcl`

556 σημεία.

| Σημείο | Ορίσματα | Από |
|---|---|---|
| `pcl.BifurcationResult` | `values`, `y`, `period`, `meta` | 3.18 |
| `pcl.BifurcationResult.changes` | — | 3.18 |
| `pcl.BifurcationResult.frame` | — | 3.18 |
| `pcl.BifurcationResult.plot` | `title` | 3.18 |
| `pcl.BifurcationResult.rows` | — | 3.18 |
| `pcl.BifurcationResult.save` | `path`, `**kw` | 3.18 |
| `pcl.BifurcationResult.to_csv` | `path`, `sep`, `decimal`, `meta` | 3.18 |
| `pcl.BifurcationResult.to_hdf5` | `path` | 3.18 |
| `pcl.BifurcationResult.to_json` | `path` | 3.18 |
| `pcl.BifurcationResult.to_mat` | `path` | 3.18 |
| `pcl.BifurcationResult.to_parquet` | `path`, `compression` | 3.18 |
| `pcl.PclError` | — | 3.18 |
| `pcl.Plot` | — | 3.18 |
| `pcl.Project` | `data`, `name` | 3.18 |
| `pcl.Project.bifurcation` | `param`, `values`, `start`, `stop`, `n`, `channel`, `stat`, `transient`, `record`, `hdiv`, `method`, `workers`, `progress` | 3.18 |
| `pcl.Project.channels` | — | 3.18 |
| `pcl.Project.comp` | `cid` | 3.18 |
| `pcl.Project.copy` | — | 3.18 |
| `pcl.Project.get` | `key` | 3.18 |
| `pcl.Project.hash` | — | 3.18 |
| `pcl.Project.inputs` | — | 4.17.1 |
| `pcl.Project.params` | — | 3.18 |
| `pcl.Project.run` | `t_end`, `solver`, `channels`, `hdiv`, `method`, `step`, `rtol`, `hmax`, `t_from`, `max_points`, `measure`, `timeout`, `scipy_method`, `waveforms`, `save_state`, `resume`, `events`, `hmin` | 3.18 |
| `pcl.Project.save` | `path` | 3.18 |
| `pcl.Project.set` | `key`, `value` | 3.18 |
| `pcl.Project.stream` | `t_end`, `chunk`, `channels`, `hdiv`, `method`, `step`, `rtol`, `hmax`, `t_from`, `max_points`, `measure`, `state`, `resume`, `to`, `timeout`, `waveforms`, `set`, `hmin` | 3.18 |
| `pcl.Project.sweep` | `grid`, `points`, `t_end`, `measure`, `workers`, `solver`, `mode`, `progress`, `to`, `resume`, `**run_kw` | 3.18 |
| `pcl.Project.tune` | `pwm`, `Kp`, `Ki`, `Kd`, `Tf`, `ff`, `kc`, `convN`, `step` | 4.17.4 |
| `pcl.Result` | `t`, `keys`, `ch`, `meta`, `project`, `measured`, `diag` | 3.18 |
| `pcl.Result.as_dict` | — | 3.18 |
| `pcl.Result.events_csv` | `path`, `kinds` | 3.19 |
| `pcl.Result.frame` | — | 3.18 |
| `pcl.Result.measure` | `key`, `stat`, `periods`, `at`, `f1` | 3.18 |
| `pcl.Result.save` | `path`, `**kw` | 3.18 |
| `pcl.Result.to_csv` | `path`, `sep`, `decimal`, `meta` | 3.18 |
| `pcl.Result.to_hdf5` | `path` | 3.18 |
| `pcl.Result.to_json` | `path` | 3.18 |
| `pcl.Result.to_mat` | `path` | 3.18 |
| `pcl.Result.to_parquet` | `path`, `compression` | 3.18 |
| `pcl.SweepResult` | `rows`, `params`, `names`, `meta` | 3.18 |
| `pcl.SweepResult.column` | `name` | 3.18 |
| `pcl.SweepResult.frame` | — | 3.18 |
| `pcl.SweepResult.save` | `path`, `**kw` | 3.18 |
| `pcl.SweepResult.to_csv` | `path`, `sep`, `decimal`, `meta` | 3.18 |
| `pcl.SweepResult.to_hdf5` | `path` | 3.18 |
| `pcl.SweepResult.to_json` | `path` | 3.18 |
| `pcl.SweepResult.to_mat` | `path` | 3.18 |
| `pcl.SweepResult.to_parquet` | `path`, `compression` | 3.18 |
| `pcl.accel.add_arguments` | `ap` | 4.19.2 · πειρ. |
| `pcl.accel.best` | `f`, `k` | 4.19.2 · πειρ. |
| `pcl.accel.command` | `args` | 4.19.2 · πειρ. |
| `pcl.accel.main` | `argv` | 4.19.2 · πειρ. |
| `pcl.accel.measure` | `name`, `net`, `B`, `seed`, `gpu`, `say` | 4.19.2 · πειρ. |
| `pcl.accel.mixed` | `N`, `B` | 4.19.2 · πειρ. |
| `pcl.accel.residual` | `case`, `V`, `dS` | 4.19.2 · πειρ. |
| `pcl.accel.run` | `cases`, `scenarios`, `quick`, `save`, `out` | 4.19.2 · πειρ. |
| `pcl.accel.system` | — | 4.19.2 · πειρ. |
| `pcl.backend.Backend` | `name`, `xp`, `spm`, `info`, `why` | 4.19.2 · πειρ. |
| `pcl.backend.Backend.asarray` | `a` | 4.19.2 · πειρ. |
| `pcl.backend.Backend.chunk` | `N`, `B` | 4.19.2 · πειρ. |
| `pcl.backend.Backend.csr` | `A` | 4.19.2 · πειρ. |
| `pcl.backend.Backend.how` | `N` | 4.19.2 · πειρ. |
| `pcl.backend.Backend.numpy` | `a` | 4.19.2 · πειρ. |
| `pcl.backend.Backend.solver` | `lu`, `how` | 4.19.2 · πειρ. |
| `pcl.backend.BackendError` | — | 4.19.2 · πειρ. |
| `pcl.backend.choose` | `want`, `N`, `B` | 4.19.2 · πειρ. |
| `pcl.backend.cpu` | `why` | 4.19.2 · πειρ. |
| `pcl.backend.gpu` | — | 4.19.2 · πειρ. |
| `pcl.backend.home` | — | 4.19.2 · πειρ. |
| `pcl.backend.measurement` | — | 4.19.2 · πειρ. |
| `pcl.backend.probe` | `fresh` | 4.19.2 · πειρ. |
| `pcl.backend.rule` | `rows` | 4.19.2 · πειρ. |
| `pcl.bifurcation` | `param`, `values`, `**kw` | 3.18 |
| `pcl.control.InverseTrainer` | `project`, `loops`, `actuator`, `loop`, `clock`, `t_excite`, `hold`, `dither`, `seed`, `hidden_emu`, `hidden_ctrl`, `lr_emu`, `lr_ctrl`, `epochs_emu`, `epochs_ctrl`, `alpha`, `max_step`, `lr_emu_online`, `lr_ctrl_online`, `run` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.controller` | `epochs` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.ctrl_spec` | `learn` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.emulator` | `epochs` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.excite` | — | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.from_dict` | `d` | 4.19.1 · πειρ. |
| `pcl.control.InverseTrainer.nets` | — | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.online` | `learn` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.run_all` | `progress` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.status` | — | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.to_dict` | — | 3.18 · πειρ. |
| `pcl.control.RLTrainer` | `project`, `loops`, `actuator`, `loop`, `clock`, `t_end`, `base`, `hidden`, `sigma`, `lr`, `population`, `seed`, `w_overshoot`, `w_ise`, `nnmax`, `variants`, `run`, `workers` | 3.18 · πειρ. |
| `pcl.control.RLTrainer.ctrl_spec` | `flat` | 3.18 · πειρ. |
| `pcl.control.RLTrainer.from_dict` | `d` | 4.19.1 · πειρ. |
| `pcl.control.RLTrainer.iterate` | `n`, `progress` | 3.18 · πειρ. |
| `pcl.control.RLTrainer.project` | `flat` | 3.18 · πειρ. |
| `pcl.control.RLTrainer.to_dict` | — | 3.18 · πειρ. |
| `pcl.control.compare` | `project`, `loops`, `actuator`, `variants`, `t_end`, `clock`, `run`, `workers`, `loop` | 3.18 · πειρ. |
| `pcl.control.compose` | `project`, `loops`, `actuator`, `clock`, `prefix`, `replace` | 3.18 · πειρ. |
| `pcl.control.inv_nn_code` | `nets` | 3.18 · πειρ. |
| `pcl.control.metrics` | `t`, `r`, `y`, `t_from` | 3.18 · πειρ. |
| `pcl.control.nn_block` | `ins`, `net`, `hidden`, `xs`, `ys`, `ymin`, `ymax`, `train`, `clock`, `**kw` | 4.7 · πειρ. |
| `pcl.control.nn_init` | `sizes`, `seed`, `zero_out` | 4.7 · πειρ. |
| `pcl.control.nn_text` | `net` | 4.7 · πειρ. |
| `pcl.control.rl_code` | `theta` | 3.18 · πειρ. |
| `pcl.control.rl_theta0` | `n_state`, `hidden`, `seed`, `scale` | 3.18 · πειρ. |
| `pcl.cpf.CpfError` | — | 4.19.5 · πειρ. |
| `pcl.cpf.run` | `net`, `direction`, `q_limits`, `step`, `dV`, `lower`, `stop`, `V_stop`, `max_points`, `tol` | 4.19.5 · πειρ. |
| `pcl.current` | — | 3.18 |
| `pcl.formats.write_hdf5` | `path`, `columns`, `meta`, `matrices` | 3.18 |
| `pcl.formats.write_parquet` | `path`, `columns`, `meta`, `compression`, `created_by` | 3.18 |
| `pcl.get` | `key` | 3.18 |
| `pcl.harmonic.HarmonicError` | — | 4.19.5 · πειρ. |
| `pcl.harmonic.Model` | `net`, `lf`, `load_model`, `line_model`, `sources` | 4.19.5 · πειρ. |
| `pcl.harmonic.Model.Y` | `h` | 4.19.5 · πειρ. |
| `pcl.harmonic.Model.branches` | `h` | 4.19.5 · πειρ. |
| `pcl.harmonic.limits` | `Un` | 4.19.5 · πειρ. |
| `pcl.harmonic.run` | `net`, `sources`, `harmonics`, `load_model`, `line_model`, `pulse`, `filters`, `scan_bus`, `scan_to`, `scan_step`, `tol` | 4.19.5 · πειρ. |
| `pcl.harmonic.scan` | `model`, `bus`, `to`, `step` | 4.19.5 · πειρ. |
| `pcl.harmonic.six_pulse` | `hmax` | 4.19.5 · πειρ. |
| `pcl.harmonic.sources_of` | `net` | 4.19.5 · πειρ. |
| `pcl.harmonic.spectrum` | `s` | 4.19.5 · πειρ. |
| `pcl.impulse.auto_H` | `tau1_us`, `tau2_us`, `n`, `t` | 4.1.1 |
| `pcl.impulse.check_voltage` | `alpha`, `beta`, `K`, `Vp`, `profile`, `X`, `Y`, `method`, `Vpeak` | 3.18 |
| `pcl.impulse.compare_current` | `row`, `time`, `signal`, `unit`, `shift`, `normalize` | 4.1.1 |
| `pcl.impulse.compare_voltage` | `row`, `time`, `signal`, `unit`, `shift`, `normalize` | 4.1.1 |
| `pcl.impulse.dexp` | `t`, `alpha`, `beta` | 3.18 |
| `pcl.impulse.dexp_characteristics` | `alpha`, `beta` | 4.1.1 |
| `pcl.impulse.fit_heidler` | `T1`, `T2`, `Im`, `n`, `H`, `H_value` | 3.18 |
| `pcl.impulse.fit_profile` | `code`, `Vp` | 3.18 |
| `pcl.impulse.fit_voltage` | `X`, `Y`, `Vp`, `method`, `profile` | 3.18 |
| `pcl.impulse.frontline_geometry` | `I0`, `tau1`, `tau2`, `n`, `eta`, `dt`, `tend` | 4.1.1 |
| `pcl.impulse.heidler` | `t`, `tau1`, `tau2`, `n` | 3.18 |
| `pcl.impulse.heidler_name` | `T1_us`, `T2_us`, `Im_A` | 4.1.1 |
| `pcl.impulse.heidler_reference` | `row`, `dt` | 4.1.1 |
| `pcl.impulse.heidler_row` | `T1_us`, `T2_us`, `Im_A`, `n`, `H_mode`, `H_input`, `tau1_guess_us`, `tau2_guess_us`, `dt`, `tend`, `created_at`, `sampled` | 4.1.1 |
| `pcl.impulse.lightning_current` | `Im`, `H`, `tau1_us`, `tau2_us`, `n`, `t` | 4.1.1 |
| `pcl.impulse.lightning_times` | `m` | 3.18 |
| `pcl.impulse.read_heidler_csv` | `path_or_text` | 3.18 |
| `pcl.impulse.read_rows` | `path_or_text` | 4.1.1 |
| `pcl.impulse.read_signal_csv` | `path_or_text` | 4.1.1 |
| `pcl.impulse.read_voltage_csv` | `path_or_text` | 3.18 |
| `pcl.impulse.rows_csv` | `rows`, `kind` | 4.1.1 |
| `pcl.impulse.save_rows` | `rows`, `folder`, `kind` | 4.1.1 |
| `pcl.impulse.times` | `f`, `t_lo`, `t_hi` | 3.18 |
| `pcl.impulse.validate_voltage` | `exact`, `sampled`, `cfg`, `profile` | 4.1.1 |
| `pcl.impulse.voltage_characteristics` | `t`, `v` | 4.1.1 |
| `pcl.impulse.voltage_measure` | `alpha`, `beta` | 3.18 |
| `pcl.impulse.voltage_name` | `Vp_kV`, `X_us`, `Y_us`, `method` | 4.1.1 |
| `pcl.impulse.voltage_reference` | `row` | 4.1.1 |
| `pcl.impulse.voltage_row` | `X_us`, `Y_us`, `Vp_kV`, `method`, `profile`, `polarity`, `dt`, `tend`, `tol_peak`, `tol_X`, `tol_Y`, `created_at` | 4.1.1 |
| `pcl.impulse.voltage_times` | `m` | 3.18 |
| `pcl.impulse.waveform_characteristics` | `t`, `i` | 4.1.1 |
| `pcl.ipm.IpmError` | — | 4.19.1 · πειρ. |
| `pcl.ipm.ipm` | `f`, `x0`, `gh`, `hess`, `A`, `l`, `u`, `xmin`, `xmax`, `tol`, `max_iter`, `cost_mult`, `xi`, `sigma`, `z0`, `record`, `step_control`, `warm` | 4.19.1 · πειρ. |
| `pcl.job` | `spec`, `allow_paths` | 3.18 |
| `pcl.lineconst.LineError` | — | 4.4 |
| `pcl.lineconst.api` | `req` | 4.4 |
| `pcl.lineconst.auto_fti` | `data`, `band`, `ti`, `cands` | 4.11 |
| `pcl.lineconst.balance` | `A`, `kind` | 4.11 |
| `pcl.lineconst.bfield` | `data`, `I`, `x`, `height`, `f`, `earth`, `at` | 4.11 |
| `pcl.lineconst.cable_zy` | `data`, `s` | 4.5 |
| `pcl.lineconst.cables` | `data` | 4.5 |
| `pcl.lineconst.carson_integral` | `hi`, `hk`, `x`, `f`, `rho`, `mu`, `s` | 4.4 |
| `pcl.lineconst.carson_series` | `D`, `phi`, `f`, `rho`, `switch` | 4.4 |
| `pcl.lineconst.clarke` | `M` | 4.11 |
| `pcl.lineconst.conductors` | `data` | 4.4 |
| `pcl.lineconst.cp_model` | `data`, `f`, `length`, `ti`, `mode` | 4.4 |
| `pcl.lineconst.double_ti` | — | 4.11 |
| `pcl.lineconst.earth_buried` | `s`, `h`, `y`, `x`, `soil`, `d` | 4.11 |
| `pcl.lineconst.earth_overhead` | `hi`, `hk`, `x`, `s`, `soil` | 4.11 |
| `pcl.lineconst.exact_admittance` | `data`, `f`, `length` | 4.4 |
| `pcl.lineconst.exact_pi` | `data`, `f`, `length` | 4.11 |
| `pcl.lineconst.fd_model` | `data`, `length`, `fmin`, `decades`, `ppd`, `fti`, `tol_zc`, `tol_a`, `n0`, `curves`, `ti`, `nmax` | 4.4 |
| `pcl.lineconst.field` | `data`, `V`, `x`, `height`, `at` | 4.11 |
| `pcl.lineconst.freqs` | `fmin`, `decades`, `ppd` | 4.4 |
| `pcl.lineconst.jsonable` | `x` | 4.11 |
| `pcl.lineconst.line_admittance` | `Z`, `Y`, `L` | 4.4 |
| `pcl.lineconst.line_zy` | `data`, `f`, `ti`, `s` | 4.11 |
| `pcl.lineconst.load_data` | `path` | 4.4 |
| `pcl.lineconst.load_zy_mat` | `path_or_bytes`, `unit` | 4.11 |
| `pcl.lineconst.lossless_modes` | `data`, `f`, `kind`, `ti` | 4.11 |
| `pcl.lineconst.matrices` | `data`, `f` | 4.11 |
| `pcl.lineconst.modal` | `Z`, `Y`, `Ti` | 4.4 |
| `pcl.lineconst.model_admittance` | `model`, `s` | 4.4 |
| `pcl.lineconst.model_ti` | `data`, `f`, `ti` | 4.11 |
| `pcl.lineconst.nlt_solve` | `network`, `tmax`, `n`, `window` | 4.4 |
| `pcl.lineconst.nominal_pi` | `data`, `f`, `length` | 4.11 |
| `pcl.lineconst.permittivity` | `s`, `epsr`, `tand`, `fref` | 4.5 |
| `pcl.lineconst.phase_matrices` | `data`, `f`, `s`, `**kw` | 4.4 |
| `pcl.lineconst.phases` | `data` | 4.4 |
| `pcl.lineconst.phases_of` | `data` | 4.11 |
| `pcl.lineconst.pollaczek` | `s`, `h`, `y`, `x`, `rho`, `d` | 4.5 |
| `pcl.lineconst.q_error` | `Z`, `Y`, `Ti` | 4.4 |
| `pcl.lineconst.qerror_tests` | `data`, `Ti`, `freqs_`, `length`, `sources` | 4.11 |
| `pcl.lineconst.rational` | `s`, `d`, `r`, `p` | 4.4 |
| `pcl.lineconst.rebuild` | `seq`, `h0` | 4.11 |
| `pcl.lineconst.reduce_phases` | `Z`, `P`, `cs`, `iseg` | 4.4 |
| `pcl.lineconst.report` | `data`, `f` | 4.4 |
| `pcl.lineconst.save_data` | `data`, `path` | 4.4 |
| `pcl.lineconst.scan` | `data`, `fmin`, `decades`, `ppd`, `length`, `ti`, `fti`, `model`, `sources` | 4.11 |
| `pcl.lineconst.sea_return` | `s`, `Ri`, `Rk`, `d`, `rho` | 4.5 |
| `pcl.lineconst.sensitivity` | `data`, `param`, `values`, `f` | 4.11 |
| `pcl.lineconst.seq_matrices` | `seq`, `s` | 4.11 |
| `pcl.lineconst.sequence` | `Z` | 4.4 |
| `pcl.lineconst.soil_layers` | `data` | 4.11 |
| `pcl.lineconst.sym_matrix` | `M` | 4.11 |
| `pcl.lineconst.telecom` | `data`, `f`, `I`, `V` | 4.11 |
| `pcl.lineconst.ti_matrix` | `Z`, `Y`, `rot` | 4.4 |
| `pcl.lineconst.to_sym` | `A` | 4.11 |
| `pcl.lineconst.transpose_avg` | `A`, `tr` | 4.11 |
| `pcl.lineconst.transposition` | `data`, `M` | 4.11 |
| `pcl.lineconst.tube` | `s`, `q`, `r`, `rho`, `mur` | 4.5 |
| `pcl.lineconst.typical` | `key` | 4.4 |
| `pcl.lineconst.useful` | `data`, `f`, `U`, `length` | 4.11 |
| `pcl.lineconst.vary` | `data`, `param`, `value` | 4.11 |
| `pcl.lineconst.vfit` | `s`, `F`, `n`, `d`, `weight`, `iters`, `p0` | 4.4 |
| `pcl.lineconst.wedepohl` | `s`, `h`, `y`, `d`, `rho` | 4.5 |
| `pcl.lineconst.xbond_avg` | `Z`, `Y`, `cs`, `kind` | 4.13 |
| `pcl.lineconst.z_galloway` | `s`, `n`, `rs`, `rho`, `mur` | 4.11 |
| `pcl.lineconst.z_int` | `c`, `s`, `skin` | 4.11 |
| `pcl.lineconst.z_internal` | `f`, `r`, `q`, `Rdc`, `mur`, `skin`, `s` | 4.4 |
| `pcl.lineconst.zy` | `data`, `f`, `earth`, `skin`, `s` | 4.4 |
| `pcl.lineconst.zy_from_file` | `data`, `s` | 4.11 |
| `pcl.linereport.ReportError` | — | 4.11 |
| `pcl.linereport.api_export` | `req` | 4.11 |
| `pcl.linereport.api_load` | `req` | 4.11 |
| `pcl.linereport.api_scan` | `req` | 4.11 |
| `pcl.linereport.api_sens` | `req` | 4.11 |
| `pcl.linereport.fields` | `data`, `U`, `I`, `f`, `height`, `at`, `earth`, `span`, `n`, `grid`, `map_at` | 4.11 |
| `pcl.linereport.plot` | `sc`, `items`, `preset`, `out`, `form`, `elems`, `style`, `title` | 4.11 |
| `pcl.linereport.read_exact_pi` | `text` | 4.11 |
| `pcl.linereport.read_fd_mod` | `text` | 4.11 |
| `pcl.linereport.read_nominal_pi` | `text` | 4.11 |
| `pcl.linereport.report_html` | `data`, `f`, `length`, `U`, `sc`, `mdl`, `figures`, `title` | 4.11 |
| `pcl.linereport.report_pdf` | `data`, `path`, `f`, `length`, `U`, `sc`, `preset` | 4.11 |
| `pcl.linereport.script` | `req` | 4.11 |
| `pcl.linereport.series` | `sc`, `dom`, `qty`, `elems` | 4.11 |
| `pcl.linereport.table` | `sc`, `items`, `form` | 4.11 |
| `pcl.linereport.to_csv` | `sc`, `items`, `form`, `sep`, `decimal` | 4.11 |
| `pcl.linereport.to_json` | `sc`, `indent` | 4.11 |
| `pcl.linereport.to_mat` | `sc`, `path` | 4.11 |
| `pcl.linereport.write_cp_netlist` | `mdl`, `name`, `k`, `m` | 4.11 |
| `pcl.linereport.write_exact_pi` | `data`, `freqs`, `length` | 4.11 |
| `pcl.linereport.write_fd_mod` | `mdl` | 4.11 |
| `pcl.linereport.write_nominal_pi` | `data`, `f`, `length` | 4.11 |
| `pcl.link.App` | `url`, `token`, `timeout`, `client` | 3.18 |
| `pcl.link.App.advance` | `dt`, `set`, `keys`, `draw` | 4.9.1 |
| `pcl.link.App.call` | `method`, `timeout`, `**args` | 3.18 |
| `pcl.link.App.channels` | — | 3.18 |
| `pcl.link.App.get` | `key` | 3.18 |
| `pcl.link.App.info` | — | 3.18 |
| `pcl.link.App.line` | `cid` | 4.11 |
| `pcl.link.App.load` | `project` | 3.18 |
| `pcl.link.App.machines` | — | 4.7 |
| `pcl.link.App.notify` | `msg`, `sev`, `fix` | 3.18 |
| `pcl.link.App.params` | `cid` | 3.18 |
| `pcl.link.App.project` | — | 3.18 |
| `pcl.link.App.python` | `code`, `**inputs` | 3.18 |
| `pcl.link.App.reset` | — | 4.9.1 |
| `pcl.link.App.run` | `t_end`, `channels`, `measure`, `**kw` | 3.18 |
| `pcl.link.App.scope` | `keys` | 3.18 |
| `pcl.link.App.selection` | — | 3.18 |
| `pcl.link.App.set` | `key`, `value`, `source` | 3.18 |
| `pcl.link.App.set_many` | `values`, `source` | 3.18 |
| `pcl.link.App.show` | `obj`, `title` | 3.18 |
| `pcl.link.connect` | `url`, `token`, `timeout`, `client` | 3.18 |
| `pcl.load` | `path` | 3.18 |
| `pcl.netfile.FileError` | — | 4.19.4 · πειρ. |
| `pcl.netfile.apply` | `net`, `edits` | 4.19.4 · πειρ. |
| `pcl.netfile.describe` | `net` | 4.19.4 · πειρ. |
| `pcl.netfile.out_of_service` | `edits` | 4.19.4 · πειρ. |
| `pcl.netfile.read` | `text`, `name`, `fmt` | 4.19.4 · πειρ. |
| `pcl.netfile.read_file` | `path`, `fmt` | 4.19.4 · πειρ. |
| `pcl.netfile.sniff` | `text`, `name` | 4.19.4 · πειρ. |
| `pcl.netfile.summary` | `net` | 4.19.4 · πειρ. |
| `pcl.netfile.to_matpower` | `net` | 4.19.4 · πειρ. |
| `pcl.netfile.write` | `net`, `fmt` | 4.19.4 · πειρ. |
| `pcl.netview.ViewError` | — | 4.19.4 · πειρ. |
| `pcl.netview.dxf` | `v`, `result`, `layers` | 4.19.4 · πειρ. |
| `pcl.netview.layout` | `net` | 4.19.4 · πειρ. |
| `pcl.netview.pack` | `v`, `result`, `layers` | 4.19.4 · πειρ. |
| `pcl.netview.svg` | `v`, `result`, `layer`, `width`, `labels`, `title`, `L`, `standalone` | 4.19.4 · πειρ. |
| `pcl.netview.values` | `v`, `result`, `layer`, `study` | 4.19.4 · πειρ. |
| `pcl.netview.view` | `net`, `off` | 4.19.4 · πειρ. |
| `pcl.network.Network` | `f`, `S_base`, `name` | 4.2 |
| `pcl.network.Network.advice` | `study`, `scenarios` | 4.19.1 |
| `pcl.network.Network.batch_flow` | `load_scale`, `gen_scale`, `dS`, `tol`, `backend`, `how`, `start` | 4.19.1 |
| `pcl.network.Network.branch_pu` | `a`, `b`, `r`, `x`, `bc`, `ratio`, `angle`, `name`, `rating` | 4.2 |
| `pcl.network.Network.bus` | `name`, `Un`, `kind`, `V`, `angle`, `Vmin`, `Vmax`, `label` | 4.2 |
| `pcl.network.Network.case` | — | 4.19.1 |
| `pcl.network.Network.contingency` | `kind`, `branches`, `ratings`, `tol`, `q_limits`, `backend`, `how` | 4.19.1 |
| `pcl.network.Network.cpf` | `**kw` | 4.19.5 |
| `pcl.network.Network.dc_flow` | — | 4.19.1 |
| `pcl.network.Network.element` | `name` | 4.2 |
| `pcl.network.Network.estimate` | `measurements`, `**kw` | 4.19.5 |
| `pcl.network.Network.feeder` | `bus`, `Ik`, `Sk`, `RX`, `X0X`, `R0X0`, `c`, `Ik_min`, `Un`, `name`, `V`, `angle`, `slack` | 4.2 |
| `pcl.network.Network.generator` | `bus`, `Sr`, `Ur`, `xd2`, `cosphi`, `RG`, `xdsat`, `pG`, `X0`, `earthed`, `P`, `V`, `Qmin`, `Qmax`, `slack`, `name`, `Pmin`, `Pmax`, `cost` | 4.2 |
| `pcl.network.Network.harmonics` | `sources`, `**kw` | 4.19.5 |
| `pcl.network.Network.iec60909` | `fault`, `buses`, `**kw` | 4.2 |
| `pcl.network.Network.impedances` | `mode` | 4.2 |
| `pcl.network.Network.line` | `a`, `b`, `R`, `X`, `length`, `B`, `R0`, `X0`, `parallel`, `name`, `alpha`, `rating` | 4.2 |
| `pcl.network.Network.load` | `bus`, `P`, `Q`, `zip`, `name`, `spectrum`, `delta` | 4.2 |
| `pcl.network.Network.load_flow` | `tol`, `max_iter`, `q_limits`, `flat` | 4.2 |
| `pcl.network.Network.lodf` | — | 4.19.1 |
| `pcl.network.Network.motor` | `bus`, `Pr`, `Ur`, `cosphi`, `eta`, `ILR`, `p`, `n`, `RX`, `name` | 4.2 |
| `pcl.network.Network.opf` | `kind`, `**kw` | 4.19.1 |
| `pcl.network.Network.power_flow` | `method`, `tol`, `max_iter`, `q_limits`, `flat` | 4.19.1 |
| `pcl.network.Network.ptdf` | — | 4.19.1 |
| `pcl.network.Network.reactor` | `a`, `X`, `R`, `b`, `X0`, `R0`, `name` | 4.2 |
| `pcl.network.Network.remove` | `name` | 4.2 |
| `pcl.network.Network.report` | `study`, `result`, `title`, `**kw` | 4.19.1 |
| `pcl.network.Network.scopf` | `**kw` | 4.19.4 |
| `pcl.network.Network.short_circuit` | `bus`, `fault`, `mode`, `f115`, `tmin`, `temp`, `lv_tol`, `fc`, `breaking`, `rgf` | 4.2 |
| `pcl.network.Network.shunt` | `bus`, `P`, `Q`, `name`, `R`, `X`, `B` | 4.2 |
| `pcl.network.Network.sssc` | `line`, `X`, `Vq`, `P`, `Xmax`, `name` | 4.10 |
| `pcl.network.Network.to_emt` | `lf`, `machines`, `name`, `t_end`, `hdiv` | 4.3 |
| `pcl.network.Network.transformer` | `hv`, `lv`, `Sr`, `Uhv`, `Ulv`, `uk`, `ur`, `group`, `X0X`, `R0R`, `Zn_hv`, `Zn_lv`, `tap`, `KT`, `shift`, `name` | 4.2 |
| `pcl.network.Network.transformer3` | `a`, `b`, `c`, `Sr`, `Ur`, `uk`, `ur`, `group`, `ref`, `z0`, `KT`, `name` | 4.2 |
| `pcl.network.Network.unit` | `bus`, `gen`, `trafo`, `oltc`, `pT`, `Zn`, `earthed`, `name`, `P`, `V`, `Qmin`, `Qmax`, `slack` | 4.2 |
| `pcl.network.NetworkError` | — | 4.2 |
| `pcl.network.c_factor` | `Un`, `which`, `lv_tol` | 4.2 |
| `pcl.network.case_data` | `name` | 4.19.1 |
| `pcl.network.case_solution` | `name` | 4.19.1 |
| `pcl.network.from_dict` | `d` | 4.2 |
| `pcl.network.ieee` | `case` | 4.2 |
| `pcl.network.ieee14` | `levels` | 4.2 |
| `pcl.network.ieee9` | — | 4.2 |
| `pcl.network.kappa` | `rx` | 4.2 |
| `pcl.network.load` | `path` | 4.2 |
| `pcl.network.mu_factor` | `ratio`, `tmin` | 4.2 |
| `pcl.network.q_factor` | `m_mw`, `tmin` | 4.2 |
| `pcl.network.read_matpower` | `source`, `Un_default` | 4.2 |
| `pcl.network.save` | `net`, `path` | 4.2 |
| `pcl.network.sssc_placement` | `net`, `lines`, `X`, `ratings`, `weights`, `Smax`, `tol`, `frac` | 4.10 |
| `pcl.network.superposition` | `net`, `bus`, `lf`, `loads` | 4.2 |
| `pcl.network.to_dict` | `net` | 4.2 |
| `pcl.network.trv` | `t`, `v`, `t0`, `uf` | 4.2 |
| `pcl.nnstart.Model` | `graph`, `meta` | 4.19.2 · πειρ. |
| `pcl.nnstart.Model.applies` | `net`, `case`, `study` | 4.19.2 · πειρ. |
| `pcl.nnstart.Model.load` | `path`, `net`, `study` | 4.19.2 · πειρ. |
| `pcl.nnstart.Model.predict` | `X` | 4.19.2 · πειρ. |
| `pcl.nnstart.Model.save` | `path` | 4.19.2 · πειρ. |
| `pcl.nnstart.StartError` | — | 4.19.2 · πειρ. |
| `pcl.nnstart.add_arguments` | `ap` | 4.19.2 · πειρ. |
| `pcl.nnstart.command` | `args` | 4.19.2 · πειρ. |
| `pcl.nnstart.dataset` | `net`, `study`, `samples`, `spread`, `seed`, `progress` | 4.19.2 · πειρ. |
| `pcl.nnstart.features` | `ib`, `d` | 4.19.2 · πειρ. |
| `pcl.nnstart.find` | `net`, `study`, `case` | 4.19.2 · πειρ. |
| `pcl.nnstart.fingerprint` | `net`, `case`, `study` | 4.19.2 · πειρ. |
| `pcl.nnstart.fit` | `X`, `Y`, `hidden`, `epochs`, `batch`, `lr`, `seed`, `val` | 4.19.2 · πειρ. |
| `pcl.nnstart.folders` | — | 4.19.2 · πειρ. |
| `pcl.nnstart.layout` | `net`, `case`, `study` | 4.19.2 · πειρ. |
| `pcl.nnstart.network` | `source` | 4.19.2 · πειρ. |
| `pcl.nnstart.propose_opf` | `model`, `net`, `dS`, `case` | 4.19.2 · πειρ. |
| `pcl.nnstart.propose_pf` | `model`, `net`, `case`, `d` | 4.19.2 · πειρ. |
| `pcl.nnstart.summary` | `model` | 4.19.2 · πειρ. |
| `pcl.nnstart.train` | `net`, `study`, `samples`, `spread`, `hidden`, `epochs`, `seed`, `check`, `progress`, `name` | 4.19.2 · πειρ. |
| `pcl.onnxio.OnnxError` | — | 4.19.2 · πειρ. |
| `pcl.onnxio.dumps` | `model` | 4.19.2 · πειρ. |
| `pcl.onnxio.loads` | `data` | 4.19.2 · πειρ. |
| `pcl.onnxio.mlp` | `W`, `b`, `x_mean`, `x_scale`, `y_mean`, `y_scale`, `meta`, `act`, `dtype` | 4.19.2 · πειρ. |
| `pcl.onnxio.read` | `path` | 4.19.2 · πειρ. |
| `pcl.onnxio.run` | `model`, `feeds` | 4.19.2 · πειρ. |
| `pcl.onnxio.write` | `path`, `model` | 4.19.2 · πειρ. |
| `pcl.opf.OpfError` | — | 4.19.1 · πειρ. |
| `pcl.opf.advise` | `case`, `kind`, `net` | 4.19.1 · πειρ. |
| `pcl.opf.d2ASbr_dV2` | `dSa`, `dSm`, `S`, `Cbr`, `Ybr`, `V`, `mu` | 4.19.1 · πειρ. |
| `pcl.opf.d2Sbr_dV2` | `Cbr`, `Ybr`, `V`, `lam` | 4.19.1 · πειρ. |
| `pcl.opf.d2Sbus_dV2` | `Y`, `V`, `lam` | 4.19.1 · πειρ. |
| `pcl.opf.dSbr_dV` | `Ybr`, `Cbr`, `V` | 4.19.1 · πειρ. |
| `pcl.opf.dSbus_dV` | `Y`, `V` | 4.19.1 · πειρ. |
| `pcl.opf.solve` | `net`, `kind`, `flow_limits`, `start`, `tol`, `max_iter`, `ratings`, `v_default`, `record`, `dS`, `extra` | 4.19.1 · πειρ. |
| `pcl.opf.sources` | `net`, `case` | 4.19.1 · πειρ. |
| `pcl.opf.vlimits` | `net`, `case`, `default` | 4.19.1 · πειρ. |
| `pcl.params` | — | 3.18 |
| `pcl.parse_value` | `v` | 3.18 |
| `pcl.plot` | `x`, `ys`, `title`, `xlabel`, `ylabel` | 3.18 |
| `pcl.plotting.default_mapping` | `table` | 3.18 |
| `pcl.plotting.extremes` | `table`, `mapping`, `file` | 3.18 |
| `pcl.plotting.figure` | `spec` | 3.18 |
| `pcl.plotting.groups` | `sigs` | 3.18 |
| `pcl.plotting.preset` | `name_or_path`, `**override` | 3.18 |
| `pcl.plotting.presets` | — | 3.18 |
| `pcl.plotting.read_mapping` | `path_or_rows` | 3.18 |
| `pcl.plotting.read_table` | `path_or_text` | 3.18 |
| `pcl.plotting.signals` | `table`, `mapping` | 3.18 |
| `pcl.plotting.table_text` | `rows`, `fmt` | 3.18 |
| `pcl.plotting.time_axis` | `t`, `spec` | 3.18 |
| `pcl.plotting.write_mapping` | `path`, `rows` | 3.18 |
| `pcl.powerflow.Case` | `net` | 4.19.1 · πειρ. |
| `pcl.powerflow.Case.err` | `V`, `typ`, `Sg` | 4.19.1 · πειρ. |
| `pcl.powerflow.Case.graph` | — | 4.19.1 · πειρ. |
| `pcl.powerflow.Case.jac` | `typ` | 4.19.1 · πειρ. |
| `pcl.powerflow.Case.link_tree` | `typ` | 4.19.5 · πειρ. |
| `pcl.powerflow.Case.mismatch` | `V`, `Sg` | 4.19.1 · πειρ. |
| `pcl.powerflow.Case.sets` | `typ` | 4.19.1 · πειρ. |
| `pcl.powerflow.Case.start` | `flat` | 4.19.1 · πειρ. |
| `pcl.powerflow.Case.tree` | — | 4.19.1 · πειρ. |
| `pcl.powerflow.Case.zip` | `Vm`, `load` | 4.19.1 · πειρ. |
| `pcl.powerflow.Jacobian` | `case`, `typ` | 4.19.1 · πειρ. |
| `pcl.powerflow.Jacobian.apply` | `V`, `dx` | 4.19.1 · πειρ. |
| `pcl.powerflow.Jacobian.factor` | `reuse` | 4.19.1 · πειρ. |
| `pcl.powerflow.Jacobian.fill` | `V`, `I`, `load`, `J` | 4.19.1 · πειρ. |
| `pcl.powerflow.Jacobian.rhs` | `mis` | 4.19.1 · πειρ. |
| `pcl.powerflow.PowerFlowError` | — | 4.19.1 · πειρ. |
| `pcl.powerflow.Tree` | `case`, `typ` | 4.19.5 · πειρ. |
| `pcl.powerflow.Tree.patterns` | `pv`, `V` | 4.19.5 · πειρ. |
| `pcl.powerflow.Tree.solve` | `J`, `Vroot` | 4.19.5 · πειρ. |
| `pcl.powerflow.advise` | `case`, `study`, `scenarios` | 4.19.1 · πειρ. |
| `pcl.powerflow.batch` | `case`, `dS`, `V0`, `tol`, `max_it`, `typ`, `lu`, `fallback`, `chunk`, `backend`, `how`, `Vstart` | 4.19.1 · πειρ. |
| `pcl.powerflow.branch_flows` | `case`, `V`, `Y` | 4.19.1 · πειρ. |
| `pcl.powerflow.breakpoint_matrix` | `case`, `typ` | 4.19.5 · πειρ. |
| `pcl.powerflow.bridges` | `case` | 4.19.1 · πειρ. |
| `pcl.powerflow.contingency_ac` | `case`, `V0`, `outages`, `tol`, `max_it`, `typ`, `chunk`, `fallback`, `backend`, `how` | 4.19.1 · πειρ. |
| `pcl.powerflow.dc_flow` | `case`, `P` | 4.19.1 · πειρ. |
| `pcl.powerflow.dc_model` | `case` | 4.19.1 · πειρ. |
| `pcl.powerflow.fast_decoupled` | `case`, `V`, `scheme`, `tol`, `max_iter`, `typ`, `Sg` | 4.19.1 · πειρ. |
| `pcl.powerflow.gauss_seidel` | `case`, `V`, `tol`, `max_iter`, `typ`, `Sg`, `accel` | 4.19.1 · πειρ. |
| `pcl.powerflow.lodf` | `case`, `H` | 4.19.1 · πειρ. |
| `pcl.powerflow.newton` | `case`, `V`, `tol`, `max_iter`, `typ`, `Sg`, `reuse`, `damp` | 4.19.1 · πειρ. |
| `pcl.powerflow.newton_ci` | `case`, `V`, `tol`, `max_iter`, `typ`, `Sg` | 4.19.1 · πειρ. |
| `pcl.powerflow.newton_dense` | `case`, `V`, `tol`, `max_iter`, `typ`, `Sg` | 4.19.1 · πειρ. |
| `pcl.powerflow.ptdf` | `case` | 4.19.1 · πειρ. |
| `pcl.powerflow.solve` | `case`, `method`, `tol`, `max_iter`, `q_limits`, `flat`, `V0`, `typ` | 4.19.1 · πειρ. |
| `pcl.powerflow.sweep` | `case`, `V`, `tol`, `max_iter`, `typ`, `Sg` | 4.19.1 · πειρ. |
| `pcl.powerflow.sweep_comp` | `case`, `V`, `tol`, `max_iter`, `typ`, `Sg`, `inner` | 4.19.5 · πειρ. |
| `pcl.powerflow.without` | `case`, `k` | 4.19.1 · πειρ. |
| `pcl.psse.RawError` | — | 4.19.4 · πειρ. |
| `pcl.psse.fields` | `line` | 4.19.4 · πειρ. |
| `pcl.psse.read` | `text` | 4.19.4 · πειρ. |
| `pcl.psse.read_file` | `path` | 4.19.4 · πειρ. |
| `pcl.psse.write` | `net`, `version` | 4.19.4 · πειρ. |
| `pcl.report.Report` | `title`, `subtitle`, `lang`, `meta` | 4.19.1 |
| `pcl.report.Report.chart` | `kind`, `x`, `series`, `title`, `xlabel`, `ylabel`, `limits`, `ymin`, `ymax`, `table` | 4.19.1 |
| `pcl.report.Report.data` | `name`, `obj` | 4.19.1 |
| `pcl.report.Report.extend` | `other` | 4.19.1 |
| `pcl.report.Report.facts` | `pairs`, `title` | 4.19.1 |
| `pcl.report.Report.from_dict` | `d` | 4.19.1 |
| `pcl.report.Report.heading` | `text`, `level` | 4.19.1 |
| `pcl.report.Report.html` | — | 4.19.1 |
| `pcl.report.Report.load` | `path` | 4.19.1 |
| `pcl.report.Report.markdown` | — | 4.19.1 |
| `pcl.report.Report.network` | `view`, `layer`, `title` | 4.19.4 |
| `pcl.report.Report.note` | `body`, `status` | 4.19.1 |
| `pcl.report.Report.save` | `path` | 4.19.1 |
| `pcl.report.Report.table` | `columns`, `rows`, `title`, `digits`, `mark`, `note` | 4.19.1 |
| `pcl.report.Report.text` | `body` | 4.19.1 |
| `pcl.report.Report.to_dict` | — | 4.19.1 |
| `pcl.report.ReportError` | — | 4.19.1 |
| `pcl.report.network_report` | `net`, `study`, `result`, `title`, `**kw` | 4.19.1 |
| `pcl.report.num` | `v`, `digits`, `lang`, `strip` | 4.19.1 |
| `pcl.run` | `**kw` | 3.18 |
| `pcl.scopf.ScopfError` | — | 4.19.4 · πειρ. |
| `pcl.scopf.screen` | `case`, `Pf`, `rate`, `L`, `mon`, `out`, `emergency` | 4.19.4 · πειρ. |
| `pcl.scopf.solve` | `net`, `emergency`, `outages`, `max_rounds`, `per_round`, `tol`, `max_iter`, `ratings`, `margin`, `check`, `penalty` | 4.19.4 · πειρ. |
| `pcl.se.SeError` | — | 4.19.5 · πειρ. |
| `pcl.se.measure` | `net`, `plan`, `noise`, `seed`, `sigma`, `bad`, `zero_injections` | 4.19.5 · πειρ. |
| `pcl.se.observability` | `net`, `measurements`, `zero_injections` | 4.19.5 · πειρ. |
| `pcl.se.quantities` | `case`, `V`, `deriv` | 4.19.5 · πειρ. |
| `pcl.se.residual_covariance` | `H`, `sigma` | 4.19.5 · πειρ. |
| `pcl.se.run` | `net`, `measurements`, `plan`, `noise`, `seed`, `sigma`, `bad`, `zero_injections`, `detect`, `threshold`, `confidence`, `max_bad`, `tol`, `max_iter`, `start` | 4.19.5 · πειρ. |
| `pcl.se.uncovered` | `case`, `meas` | 4.19.5 · πειρ. |
| `pcl.se.zero_injection` | `case` | 4.19.5 · πειρ. |
| `pcl.set` | `key`, `value` | 3.18 |
| `pcl.show` | `obj`, `title` | 3.18 |
| `pcl.study.StudyError` | — | 4.19.1 |
| `pcl.study.network_of` | `data` | 4.19.1 |
| `pcl.study.open_file` | `data` | 4.19.4 |
| `pcl.study.report` | `data` | 4.19.1 |
| `pcl.study.run` | `data` | 4.19.1 |
| `pcl.study.save_file` | `data` | 4.19.4 |
| `pcl.study.summary` | `study`, `res` | 4.19.1 |
| `pcl.study.view` | `data` | 4.19.4 |
| `pcl.sweep` | `grid`, `**kw` | 3.18 |
| `pcl.trv.TRVError` | — | 4.9 |
| `pcl.trv.compare` | `t`, `u`, `spec`, `t0` | 4.9 |
| `pcl.trv.default_kpp` | `Ur`, `earthed`, `duty` | 4.9 |
| `pcl.trv.delay_line` | `spec` | 4.9 |
| `pcl.trv.envelope_of` | `t`, `u`, `t0` | 4.9 |
| `pcl.trv.itrv` | `Ur`, `Isc`, `f` | 4.9 |
| `pcl.trv.line_data` | `Ur`, `f` | 4.9 |
| `pcl.trv.line_value` | `pts`, `t` | 4.9 |
| `pcl.trv.pole_factors` | `kpp` | 4.9 |
| `pcl.trv.rated` | `Ur`, `duty`, `kpp`, `f`, `earthed` | 4.9 |
| `pcl.trv.reference_line` | `spec`, `t_end` | 4.9 |
| `pcl.trv.slf` | `Ur`, `Isc`, `ratio`, `f`, `itrv_req`, `Z`, `k`, `tdL`, `td` | 4.9 |
| `pcl.tutorial` | `tid`, `**options` | 3.18 |
| `pcl.tutorials` | — | 3.18 |
| `pcl.unbalanced.Feeder` | `name`, `f` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.bus` | `name`, `kV` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.capacitor` | `bus`, `kvar`, `name` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.config` | `name`, `phases`, `Z`, `B` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.distributed` | `a`, `b`, `connection`, `model`, `kW`, `kvar`, `name` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.from_dict` | `d` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.line` | `a`, `b`, `length`, `config`, `name` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.load` | `bus`, `connection`, `model`, `kW`, `kvar`, `name` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.regulator` | `a`, `b`, `taps`, `phases`, `pt`, `ct`, `R`, `X`, `level`, `band`, `name` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.report` | `title`, `**kw` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.run` | `**kw` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.set_source` | `bus`, `V` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.switch` | `a`, `b`, `phases`, `name` | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.to_dict` | — | 4.19.5 · πειρ. |
| `pcl.unbalanced.Feeder.transformer` | `hv`, `lv`, `kVA`, `R`, `X`, `phases`, `name` | 4.19.5 · πειρ. |
| `pcl.unbalanced.FeederError` | — | 4.19.5 · πειρ. |
| `pcl.unbalanced.against` | `res`, `published` | 4.19.5 · πειρ. |
| `pcl.unbalanced.as_network` | `fd` | 4.19.5 · πειρ. |
| `pcl.unbalanced.case_data` | `name` | 4.19.5 · πειρ. |
| `pcl.unbalanced.case_solution` | `name` | 4.19.5 · πειρ. |
| `pcl.unbalanced.run` | `feeder`, `regulators`, `spread`, `tol`, `max_iter` | 4.19.5 · πειρ. |
| `pcl.unbalanced.sequence` | `Va`, `Vb`, `Vc` | 4.19.5 · πειρ. |
| `pcl.use` | `project` | 3.18 |
| `pcl.version` | — | 3.18 |
| `pcl.wideband.WBError` | — | 4.13 · πειρ. |
| `pcl.wideband.bode_delay` | `f`, `Hm`, `g`, `L`, `level`, `decades`, `n` | 4.13 · πειρ. |
| `pcl.wideband.enforce_passivity` | `model`, `sw`, `iters`, `delta`, `step`, `log`, `wmax` | 4.13 · πειρ. |
| `pcl.wideband.errors` | `model`, `sw`, `per_f` | 4.13 · πειρ. |
| `pcl.wideband.fit_report` | `model`, `data`, `length`, `bands` | 4.13 · πειρ. |
| `pcl.wideband.h_weight` | `sw`, `wmax` | 4.13 · πειρ. |
| `pcl.wideband.import_model` | `text`, `data`, `length_km`, `passive` | 4.13 · πειρ. |
| `pcl.wideband.model_parts` | `model` | 4.13 · πειρ. |
| `pcl.wideband.nodal` | `Yc`, `H` | 4.13 · πειρ. |
| `pcl.wideband.passivity` | `model`, `fmin`, `fmax`, `ppd`, `extra` | 4.13 · πειρ. |
| `pcl.wideband.passivity_band` | `fmin`, `fmax` | 4.17 · πειρ. |
| `pcl.wideband.rational` | `s`, `p`, `R`, `D` | 4.13 · πειρ. |
| `pcl.wideband.read_wb_mod` | `text`, `length` | 4.13 · πειρ. |
| `pcl.wideband.sheath_check` | `Yn`, `length_km`, `cores`, `sheaths` | 4.13 · πειρ. |
| `pcl.wideband.start_poles` | `fmin`, `fmax`, `n`, `real` | 4.13 · πειρ. |
| `pcl.wideband.to_json` | `fit`, `M`, `L`, `fs` | 4.13 · πειρ. |
| `pcl.wideband.vfit_relaxed` | `s`, `F`, `poles`, `weight`, `d`, `iters`, `stable`, `tol_conv`, `clip` | 4.13 · πειρ. |
| `pcl.wideband.wb_admittance` | `model`, `s` | 4.13 · πειρ. |
| `pcl.wideband.wb_fit` | `sw`, `L`, `tol`, `nmax`, `group`, `fdcm`, `ratio`, `dc`, `opt`, `log`, `lfw`, `wout` | 4.13 · πειρ. |
| `pcl.wideband.wb_h` | `groups`, `s` | 4.13 · πειρ. |
| `pcl.wideband.wb_model` | `data`, `length`, `fmin`, `decades`, `ppd`, `tol`, `nmax`, `group`, `fdcm`, `ratio`, `dc`, `opt`, `passive`, `curves`, `lfw`, `guard` | 4.13 · πειρ. |
| `pcl.wideband.wb_yc` | `yc`, `s` | 4.13 · πειρ. |
| `pcl.wideband.write_wb_mod` | `model` | 4.13 · πειρ. |
| `pcl.workbench.CircuitPlant` | `params` | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.clone` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.close` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.deriv` | `x`, `u` | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.initial_state` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.measured` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.measured_scale` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.output` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.params_dict` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.reset_state` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.set_live` | `values` | 4.8.1 · πειρ. |
| `pcl.workbench.CircuitPlant.step` | `u`, `dt` | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.u_range` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.viz_state` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.y_range` | — | 3.18 · πειρ. |
| `pcl.workbench.LivePlant` | `params` | 4.9.1 · πειρ. |
| `pcl.workbench.LivePlant.clone` | — | 4.9.1 · πειρ. |
| `pcl.workbench.LivePlant.close` | — | 4.9.1 · πειρ. |
| `pcl.workbench.LivePlant.reset_state` | — | 4.9.1 · πειρ. |
| `pcl.workbench.launch` | `workbench`, `project`, `input`, `measure`, `state`, `u_range`, `y_range`, `state_scale`, `name`, `solver`, `settle`, `headless`, `dt`, `steps`, `n`, `app`, `live` | 3.18 · πειρ. |
| `pcl.workbench.live_plant_class` | `app`, `input`, `measure`, `state`, `u_range`, `y_range`, `state_scale`, `name`, `pid`, `settle`, `solver`, `params`, `input_name`, `output_name` | 4.9.1 · πειρ. |
| `pcl.workbench.plant_class` | `project`, `input`, `measure`, `state`, `u_range`, `y_range`, `state_scale`, `name`, `pid`, `settle`, `solver`, `params`, `input_name`, `output_name` | 3.18 · πειρ. |
| `pcl.workbench.prepare` | `project`, `input`, `measure`, `state` | 3.18 · πειρ. |
| `pcl.workbench.register` | `workbench` | 3.18 · πειρ. |
| `pcl.workbench.run_live` | `plant`, `scheme`, `targets`, `dt`, `learn`, `offline` | 4.9.1 · πειρ. |
| `pcl.workbench.run_scheme` | `plant`, `scheme_cls`, `reference`, `dt`, `params` | 3.18 · πειρ. |
| `pcl.workbench.serve` | `inp`, `out` | 4.8.1 · πειρ. |

## Γραμμή εντολών `python -m pcl`

17 σημεία.

| Σημείο | Ορίσματα | Από |
|---|---|---|
| `python -m pcl accel` | `--quick`, `--save`, `--case`, `--scenarios`, `--json` | 4.19.2 · πειρ. |
| `python -m pcl bifurcation` | `<project>`, `<param>`, `--values`, `--channel`, `--stat`, `--transient`, `--record`, `--set`, `--workers`, `--out` | 3.18 |
| `python -m pcl channels` | `<project>` | 3.18 |
| `python -m pcl design` | `--machine`, `--controller`, `--goal`, `--cycles`, `--out` | 4.7 |
| `python -m pcl gui` | `--offline` | 4.7 |
| `python -m pcl job` | `<spec>`, `--out` | 3.18 |
| `python -m pcl link` | `<request>`, `--out` | 3.18 |
| `python -m pcl machines` | — | 4.7 |
| `python -m pcl net` | `<network>`, `--lf`, `--sc`, `--bus`, `--mode`, `--tmin`, `--out`, `--emt` | 4.2 |
| `python -m pcl nnstart` | `<case>`, `--study`, `--samples`, `--spread`, `--epochs`, `--seed`, `--out` | 4.19.2 · πειρ. |
| `python -m pcl plant` | — | 4.8.1 |
| `python -m pcl plot` | `<spec>`, `--preset`, `--mapping`, `--kind`, `--signal`, `--table`, `--out` | 3.18 |
| `python -m pcl run` | `<project>`, `--set`, `--t-end`, `--solver`, `--hdiv`, `--method`, `--step`, `--rtol`, `--hmax`, `--hmin`, `--channels`, `--from`, `--measure`, `--sep`, `--decimal`, `--out`, `--chunk`, `--state`, `--resume`, `--events` | 3.18 |
| `python -m pcl sweep` | `<project>`, `--set`, `--t-end`, `--solver`, `--hdiv`, `--method`, `--step`, `--rtol`, `--hmax`, `--hmin`, `--channels`, `--from`, `--measure`, `--sep`, `--decimal`, `--out`, `--resume`, `--grid`, `--zip`, `--workers` | 3.18 |
| `python -m pcl tutorial` | `<id>`, `--opt`, `--out` | 3.18 |
| `python -m pcl tutorials` | — | 3.18 |
| `python -m pcl workbench` | `--path`, `<project>`, `--link`, `--live`, `--set`, `--input`, `--measure`, `--state`, `--state-scale`, `--u`, `--y`, `--hdiv`, `--settle`, `--headless`, `--dt` | 3.18 |

## Server: `/api/<ενέργεια>` και διαδρομές

45 σημεία.

| Σημείο | Ορίσματα | Από |
|---|---|---|
| `/api/addon_activate` | — | 3.18 |
| `/api/addon_install` | — | 3.18 |
| `/api/addon_remove` | — | 3.18 |
| `/api/addons` | — | 3.18 |
| `/api/analyze` | — | 3.18 |
| `/api/batch_sim` | — | 3.18 |
| `/api/bidir` | — | 3.18 |
| `/api/boundary` | — | 3.18 |
| `/api/capacitance` | — | 3.18 |
| `/api/catalog` | — | 3.18 |
| `/api/curves` | — | 3.18 |
| `/api/derivation` | — | 3.18 |
| `/api/design` | — | 3.18 |
| `/api/envelope` | — | 3.18 |
| `/api/health` | — | 3.18 |
| `/api/inverse` | — | 3.18 |
| `/api/line_export` | — | 4.11 |
| `/api/line_load` | — | 4.11 |
| `/api/line_model` | — | 4.4 |
| `/api/line_scan` | — | 4.11 |
| `/api/line_sens` | — | 4.11 |
| `/api/linearize` | — | 3.18 |
| `/api/link/call` | — | 3.18 |
| `/api/link/deny` | — | 3.18 |
| `/api/link/knock` | — | 3.18 |
| `/api/link/next` | — | 3.18 |
| `/api/link/reply` | — | 3.18 |
| `/api/link/token` | — | 3.18 |
| `/api/model_proof` | — | 3.18 |
| `/api/network_open` | — | 4.19.4 |
| `/api/network_report` | — | 4.19.1 |
| `/api/network_save` | — | 4.19.4 |
| `/api/network_study` | — | 4.19.1 |
| `/api/network_view` | — | 4.19.4 |
| `/api/presets` | — | 3.18 |
| `/api/problem` | — | 3.18 |
| `/api/record` | — | 4.8 |
| `/api/scenario_run` | — | 3.18 |
| `/api/scenario_sweep` | — | 3.18 |
| `/api/solve` | — | 3.18 |
| `/api/studio_math` | — | 3.18 |
| `/api/sweep` | — | 3.18 |
| `/api/switching` | — | 3.18 |
| `/api/template_solve` | — | 3.18 |
| `/api/validate_circuit` | — | 3.18 |

## API πρόσθετων και σύνδεσης (`addons.js` M, `pcl.link.App`, `PclApp`)

22 σημεία.

| Μέθοδος | Άδεια | Από |
|---|---|---|
| `advance` | run | 4.9.1 |
| `batch` | run | 3.18 |
| `bifurcation` | run | 3.18 |
| `channels` | project.read | 3.18 |
| `download` | files | 3.18 |
| `get` | project.read | 3.18 |
| `info` | — | 3.18 |
| `line` | project.read | 4.11 |
| `machines` | project.read | 4.7 |
| `notify` | show | 3.18 |
| `params` | project.read | 3.18 |
| `presets` | — | 3.18 |
| `project.get` | project.read | 3.18 |
| `project.load` | project.write | 3.18 |
| `python` | python | 3.18 |
| `run` | run | 3.18 |
| `scope` | project.read | 3.18 |
| `selection` | project.read | 3.18 |
| `set` | project.write | 3.18 |
| `set_many` | project.write | 3.18 |
| `show` | show | 3.18 |
| `values` | project.read | 3.18 |

## MATLAB / Octave (`matlab/`)

31 σημεία.

| Σημείο | Ορίσματα | Από |
|---|---|---|
| `PclApp.PclApp` | `client` | 3.18 |
| `PclApp.call` | `method`, `args` | 3.18 |
| `PclApp.channels` | — | 3.18 |
| `PclApp.info` | — | 3.18 |
| `PclApp.load` | `project` | 3.18 |
| `PclApp.notify` | `msg`, `sev` | 3.18 |
| `PclApp.param` | `key` | 3.18 |
| `PclApp.params` | `id` | 3.18 |
| `PclApp.project` | — | 3.18 |
| `PclApp.python` | `code`, `inputs` | 3.18 |
| `PclApp.run` | `varargin` | 3.18 |
| `PclApp.scope` | `keys` | 3.18 |
| `PclApp.selection` | — | 3.18 |
| `PclApp.setMany` | `keys`, `values` | 3.18 |
| `PclApp.setParam` | `key`, `value` | 3.18 |
| `PclApp.show` | `what`, `title` | 3.18 |
| `PclApp.values` | `keys` | 3.18 |
| `PclPlant` | `project`, `varargin` | 4.8.1 |
| `pcl_bifurcation` | `project`, `param`, `values`, `opts` | 3.18 |
| `pcl_config` | — | 3.18 |
| `pcl_job` | `spec`, `server` | 3.18 |
| `pcl_link` | `method`, `args`, `client` | 3.18 |
| `pcl_measures` | `m` | 3.18 |
| `pcl_pi` | `r`, `m`, `cs`, `dt` | 4.8.1 |
| `pcl_plant_gui` | `opts` | 4.8.1 |
| `pcl_read` | `file` | 3.18 |
| `pcl_result` | `j` | 3.18 |
| `pcl_run` | `project`, `params`, `opts` | 3.18 |
| `pcl_spec` | `project`, `params` | 3.18 |
| `pcl_style` | `fig`, `name`, `out` | 3.18 |
| `pcl_sweep` | `project`, `grid`, `opts` | 3.18 |

## Αιτήματα σεναρίων (`web/studio/scenario.js`)

13 σημεία.

| Σημείο | Ορίσματα | Από |
|---|---|---|
| `action:advance` | — | 3.18 |
| `action:bifurcation` | — | 3.18 |
| `action:channels` | — | 3.18 |
| `action:close` | — | 3.18 |
| `action:export` | — | 3.18 |
| `action:machines` | — | 4.7 |
| `action:open` | — | 3.18 |
| `action:run` | — | 3.18 |
| `action:state` | — | 3.18 |
| `action:stepcheck` | — | 4.7 |
| `action:tune` | — | 4.17.4 |
| `action:tutorial` | — | 3.18 |
| `action:tutorials` | — | 3.18 |

## Αρχείο project: στοιχεία, παράμετροι, ακροδέκτες

130 σημεία.

| Σημείο | Παράμετροι / πεδία | Ακροδέκτες | Από |
|---|---|---|---|
| `file` | version, components, wires, subcircuits, solve, sim, scope, meta, tutorial, program, watch | — | 3.18 |
| `file.component` | id, type, x, y, rot, flip, label, params, live, liveBase, liveRate | — | 3.18 |
| `file.program` | t, id, k, v, rate | — | 3.19 |
| `file.sim` | hDiv, speed, stopT, method, rec | — | 4.8 |
| `file.solve` | unconn, island, rleak, tbase, step, rtol, hmax, units, solver, refac, hmin, modeVec, initSolver, evSnap | — | 3.19 |
| `file.subcircuit` | title, desc, version, components, wires, params | — | 3.18 |
| `file.watch` | show, tiles, panel | — | 4.8 |
| `file.watch.tile` | id, key, ctl, label, at, al, rng, steps, span | — | 4.8 |
| `file.wire` | id, a, b, pts, name, color, width | — | 3.18 |
| `part:AIC` | scheme, mode, target, learn, fs, fr, ka, Kp, Ki, umin, umax, rs, dxs, us, hidden, opt, lr, elr, K, ds, seed, w | L, iae, r, sat, u, y, yd | 4.8 |
| `part:AM` | — | a, b, y | 3.18 |
| `part:ARC` | ctl, cmd, arc, tau, P0, P1, alpha, beta, tauc, Uc, taum, Pm, tau1, Pi1, Pi2, k1, k2, k3, gmin, Ron, vm | a, b, cmd | 4.8.1 |
| `part:ARCX` | lam, tau0, alpha, P0, P1, beta, Ron, gmin | a, b, g | 4.8.1 |
| `part:AVG` | win, f, np, fsrc, fmin, t0, clock, first, y0 | f, u, y | 4.19.6 |
| `part:AVR` | type, Vref, dV, TR, KA, TA, TC, TB, TC1, TB1, KF, TF, VRMAX, VRMIN, KC, KLR, ILR, KE, TE, AEX, BEX | e0, efd, ifd, v0, vs, vt | 4.8.1 |
| `part:BSEL` | idx | u, y | 3.18 |
| `part:C` | C, v0, esr | n, p | 3.18 |
| `part:CB3` | ctl, cmd, model, arc, tau, P0, P1, alpha, beta, tauc, Uc, taum, Pm, tau1, Pi1, Pi2, k1, k2, k3, gmin, Ron, Roff, vm, conn | a1, a2, abc1, abc2, b1, b2, c1, c2, cmd | 4.1 |
| `part:CHB` | N, cell, C, Vdc, Ron, Rp, fs, norm, sel, band, impl | a, b, n, ref, v, vav | 4.10 |
| `part:CHBX` | N, cell, C, Vdc, Ron, Rp | a, b, i, s1, s10, s2, s3, s4, s5, s6, s7, s8, s9, v, v1, v10, v2, v3, v4, v5, v6, v7, v8, v9 | 4.10 |
| `part:CLARKE` | inv, conn | a, ab, abc, al, b, be, c | 3.18 |
| `part:CLK` | f, duty, phase | y | 3.18 |
| `part:CMP` | hys | n, p, y | 3.18 |
| `part:CONST` | v, unit, input, name, desc | y | 3.18 |
| `part:CPE` | kind, sigma, Q, alpha, fmin, fmax, N | a, b | 3.18 |
| `part:CPL` | P, Vmin, sched | n, p | 3.18 |
| `part:D` | Ron, Vf, Roff | a, k | 3.18 |
| `part:DCM` | Ra, La, psi, J, bm, load, TL, w0, ia0 | a, b, te, tl, w | 3.18 |
| `part:DEMUX` | n | u, y1, y2, y3 | 3.18 |
| `part:DISP` | dig | u | 3.18 |
| `part:DIV` | eps | a, b, y | 3.18 |
| `part:EBUS` | n | a, b, bus, c | 3.18 |
| `part:EDGE` | edge, tw | n, u, y | 3.19 |
| `part:EVC` | scheme, mode, ws, wt, we, Kt, Ke, R, J, B, kpw, kiw, atl, kpa, kia, alim, aff, fr, H, ffg, taulim, ilim, plim, regen, slew, kpi, kii, umin, umax, fs | i, keep, lim, pw, r, rg, soc, tau, tl, u, y | 4.8 |
| `part:EXPR` | expr, ins, pars | u1, u2, y | 3.18 |
| `part:F2` | kind, f0, zeta, u0 | u, y | 3.19 |
| `part:FEST` | mode, RR, LM, psi0 | al, be, psi, th, w1, wr | 3.18 |
| `part:FILT3` | kind, C1, L, R, C2, Rp, conn | a, abc, b, c | 4.16 |
| `part:FLT3` | kind, Rf, Rg, ctl, ton, toff, clr, conn | a, abc, b, c, f | 4.1 |
| `part:FOUR` | nu, ref, win, f, np, fsrc, fmin, t0, clock, first, y0 | a, b, f, mag, ph, rms, u | 4.19.6 |
| `part:GAIN` | K, unit | u, y | 3.18 |
| `part:GEN3` | Sn, Un, f, pp, data, conv, Ra, Xl, X0, Xd, Xdp, Xdpp, Xq, Xqp, Xqpp, Td0p, Td0pp, Tq0p, Tq0pp, cXad, cXfd, cRfd, cXkd, cRkd, cXaq, cX1q, cR1q, cX2q, cR2q, shaft, H, D, Hm, Km, Dm, Dmu, Tfr, gm, exc, Efd, mech, Tm, init, V0, ang0, neut, conn | a, abc, b, c, d, e0, efd, ifd, m0, n, pe, qe, te, tm, ts1, ts2, v0, vt, w | 4.3 |
| `part:GFMC` | law, inner, S, Vac, Vdc, f0, Pref, Qref, Vref, mp, nq, fp, H, tv, tdr, kp, avc, Uref, KE, TE, kv, av, Rv, Xv, Xc, Bf, Tvl, Til, kff, Imax, Ufd, tsoft, fi, ac, vmax, sync, bw, tsync, th0, fm, conn | e, ga, gb, gc, ia, ib, ic, lim, m, ma, mb, mc, meas, oa, ob, oc, p, q, th, va, vb, vc, vdc, w | 4.18 |
| `part:GND` | — | g | 3.18 |
| `part:GOV` | type, dP, Pr, R, TSR, TSM, LC1, LC2, V1, KAX, FHP, FIP, FLP, TCH, TRH, TCO, RP, RT, TR, TP, KS, TG, Ropen, Rclose, Tw, gFL, gNL | g, m0, pm, tm, w | 4.8.1 |
| `part:GRID3` | Un, f, phase, cf, emf, Sk, XR, z0, Z0Z1, Sk1, XR0, Rn, conn | a, abc, b, c | 4.1 |
| `part:ICLARKE` | inv, conn | a, ab, abc, al, b, be, c | 3.18 |
| `part:IDC` | ctl, I, sched | n, p, u | 3.18 |
| `part:ILG` | shape, Ipk, model, tau1, tau2, eta, T1, T2, n, t0 | n, p | 3.18 |
| `part:IM` | Rs, RR, Lsig, LM, pp, J, bm, load, TL, w0, conn | a, abc, b, c, psi, te, thf, thr, tl, w | 3.18 |
| `part:INT` | y0, lo, hi, wrap | u, y | 3.18 |
| `part:IP` | — | a, b, y | 3.18 |
| `part:IPARK` | conn | ab, al, be, d, dq, q, th | 3.18 |
| `part:JUNC` | — | j | 3.18 |
| `part:KG` | kind, mat | a1, a2, b1, b2 | 3.18 |
| `part:KL` | nw, L1, L2, L3, L4, k, kpairs, Lmat, Rw, i0 | a1, a2, a3, a4, b1, b2, b3, b4 | 3.18 |
| `part:L` | L, i0, Rs | a, b | 3.18 |
| `part:LCC6` | impl, sync, shift, f0, bw, ini, th0, pw, Ron, Vf, Roff, Rsn, Csn, tq, Ith, conn | a, abc, am, ao, b, blk, c, cf, gl, gm, n, p, th, va, vb, vc | 4.16 |
| `part:LCCC` | mode, iext, Idn, Vdn, Iord, tramp, Tid, KpR, TiR, aminR, amaxR, KpI, TiI, aminC, KpG, TiG, aminG, amaxI, gref, dI, dgc, gemin, V1, I1, V2, I2, Tv, kc, blks, fr, Vfr, tdet, afr, tfr, tprot | ao, blk, cc, fr, gm, id, iord, iref, vd | 4.16 |
| `part:LCCM` | shift, f0, Ith | am, cf, gl, gm, i1, i2, i3, i4, i5, i6, va, vb, vc, w | 4.16 |
| `part:LCCS` | model, impl, Sn, U1, U2, f, uk, tap, bw, pw, Ron, Vf, Rsn, Csn, tq, fm, conn | a, abc, am, ao, b, blk, c, cf, gm, id, n, p, vd | 4.16 |
| `part:LCCX` | shift, f0, bw, ini, th0, pw, Ron, Vf, Roff, Rsn, Csn, tq | a, am, ao, b, blk, c, cf, gl, gm, n, p, th, va, vb, vc | 4.16 |
| `part:LINE3` | unit, Un, Sb, f, R1, X1, B1, z0, R0, X0, B0, conn | a1, a2, abc1, abc2, b1, b2, c1, c2 | 4.3 |
| `part:LOAD3` | cn, Un, f, P, Q, model, kz, ki, kp, Vmin, conn | a, abc, b, c | 4.1 |
| `part:LOGIC` | op | a, b, y | 3.18 |
| `part:LPF` | fc, y0 | u, y | 3.18 |
| `part:MEAS` | src, qty | y | 3.18 |
| `part:MMC` | impl, model, N, C, Vdc, vc0, Larm, Ron, fs, sel, band, ectl, norm, kh, kv, fe, Rd, fd, ccsc, tcc, f0, disc, conn | a, abc, b, blk, c, ia, ib, ic, idc, ma, mb, mc, n, p, va, vb, vc, vdc, vs | 4.14 |
| `part:MMCA` | N, model, C, Vc, v0, Ron, fs, sel, band, norm, disc | a, b, blk, i, n, ref, v, vav, vs | 4.14 |
| `part:MMCC` | mode, qmode, law, S, Vac, Vdc, f0, Pref, Tp, frq, mf, Tf, Vdcref, Tvdc, kdr, H, Vfref, Tvf, Qref, Tq, Vacref, Tvac, Xpcc, Vref, mp, nq, fp, Hv, tv, kp, avc, KE, TE, kv, av, Rv, Xv, Ufd, tsoft, ac, Ti, cc, acc, Tii, X, R, ovl, Vdcmax, kov, prio, Ilim, Idlim, Iqlim, vmax, bw, th0, fm, prot, Idcmax, tprot, tdb, tbrk | blk, brk, ia, ib, ic, idc, ma, mb, mc, p, q, th, va, vb, vc, vdc, vs | 4.14 |
| `part:MNMX` | f, np, t0, clock, y0 | max, min, pp, u | 4.19.6 |
| `part:MOD3` | mode, conn | d, da, db, dc, v, va, vb, vc, vdc | 3.18 |
| `part:MOV` | model, Uref, Iref, alpha, tbl | a, b | 3.18 |
| `part:MUL` | — | a, b, y | 3.18 |
| `part:MUX` | n, frame | u1, u2, u3, y | 3.18 |
| `part:NLC` | N, cell, Vdc, norm, sel, band, clock, trig | i, n, ref, s1, s10, s2, s3, s4, s5, s6, s7, s8, s9, sw, v1, v10, v2, v3, v4, v5, v6, v7, v8, v9, vav | 4.10 |
| `part:NN` | ins, xs, hidden, ys, ymin, ymax, train, learn, opt, lr, clip, l2, nl, share, jac, init, seed, w, clock, trig, y0 | L, e, fz, tgt, x1, x2, y | 4.7 |
| `part:NOTE` | text, size, bold, color, frame | — | 4.9 |
| `part:PARK` | conn | ab, al, be, d, dq, q, th | 3.18 |
| `part:PIB` | Kp, Ki, clock, trig, y0, aw, ymin, ymax | tr, u, y | 3.18 |
| `part:PLL` | f0, bw, th0, ini, conn | a, abc, amp, b, c, th, w | 3.18 |
| `part:PORT` | name, side, width | p | 3.18 |
| `part:PPOS` | win, f, np, fsrc, fmin, t0, clock, first, y0, conn | f, i, ia, ib, ic, p, q, v, va, vb, vc | 4.19.6 |
| `part:PQ1` | win, f, np, fsrc, fmin, t0, clock, first, y0 | f, i, p, p1, pf, pf1, q1, s, v | 4.19.6 |
| `part:PQ3` | qsign, conn | i, ia, ib, ic, p, p0, q, v, va, vb, vc | 4.19.6 |
| `part:PSS` | KS, TW, T1, T2, T3, T4, VSMAX, VSMIN | vs, w | 4.8.1 |
| `part:PWM` | fs, mode, D, dsched, carrier, phase, upd, dt, sensor, qty, ref, gain, ctl, topo, rVin, rL1, rC1, rL2, rC2, rR, fc, pm, Kp, Ki, Kd, Tf, ff, kc, convN, ffA, ffB, D0, dmin, dmax, m, fref, refphase | d | 3.18 |
| `part:PY` | code, ins, outs, pars, clock, trig, y0 | e, y | 3.18 |
| `part:R` | R, sched | a, b | 3.18 |
| `part:RAMP` | f, shape, lo, hi, phase | y | 3.18 |
| `part:RFX` | R0, tbl, line | a, b | 4.9.1 |
| `part:RLIM` | up, dn, y0 | u, y | 3.19 |
| `part:RMS` | win, f, np, fsrc, fmin, t0, clock, first, y0 | f, u, y | 4.19.6 |
| `part:RT` | clock, trig, mode, y0 | u, y | 3.19 |
| `part:SAI` | U10, d, n, kL1, L1fit, Llead, A0, A1, impl, meas | a, b | 4.9 |
| `part:SAIX` | L0, R0, L1, R1, C, tbl0, tbl1 | a, b | 4.9.1 |
| `part:SAT` | lo, hi | u, y | 3.18 |
| `part:SCR` | fire, refsrc, alpha, shift, pw, fref, pwm, out, Ron, Vf, Roff, tq | a, g, k | 3.18 |
| `part:SEQ` | amp, win, f, np, fsrc, fmin, t0, clock, first, y0, conn | a, abc, b, c, f, neg, phneg, phpos, phzero, pos, unb, zero | 4.19.6 |
| `part:SG` | vt, Ub, U0, kde, Dde, trig, Rarc, ext, Iext, Roff | a, b | 3.18 |
| `part:SH` | in, src, qty, clock, trig, init, h0 | u, y | 3.18 |
| `part:SIN` | name, side, width | y | 3.18 |
| `part:SM` | Rs, Ld, Lq, sat, Ldsat, psikd, psim, pp, J, bm, load, TL, w0, th0, conn | a, abc, b, c, id, iq, te, th, tl, w | 3.18 |
| `part:SOUT` | name, side, width | u | 3.18 |
| `part:SPLL` | f0, bw, k, k0, th0, impl | al, amp, be, th, v, w | 4.10 |
| `part:SPLX` | f0, bw, k, k0, th0 | al, amp, be, th, v, w | 4.10 |
| `part:SR` | q0 | nq, q, r, s | 3.18 |
| `part:SRM` | geo, Rs, mag, Lu, La, Lsat, psik, Imax, tbl, J, bm, load, TL, w0, th0 | a1, a2, a3, a4, b1, b2, b3, b4, i1, i2, i3, i4, te, th, tl, w | 3.18 |
| `part:SSSC` | mode, N, Vdc, ma, sense, X, Iref, Vbref, Kp, Ki, KpI, KiI, KpV, KiV, kpd, fv, kid, dmax, mmax, f0, bw, fx, ton, tadv | dth, i, v, vav, vb, vref, x | 4.10 |
| `part:SSSC3` | mode, sync, N, Vdc, C, ma, sense, X, Iref, Vbref, Kp, Ki, KpI, KiI, KpV, KiV, tv, umax, bal, tb, fv, dmax, imin, mmax, f0, bw, fx, tadv, ton | ca, cb, cc, ia, ib, ic, ra, rb, rc, u, ua, ub, uc, va, vb, vc, x | 4.17 |
| `part:SUB` | def | — | 3.18 |
| `part:SUM` | signs | a, b, y | 3.18 |
| `part:SW` | gate, pwm, out, model, Ron, Vce0, Roff, body, Vfd, Rd, Eon, Eoff, Vref, Iref | d, g, s | 3.18 |
| `part:TAGI` | name | y | 3.18 |
| `part:TAGO` | name | u | 3.18 |
| `part:THD` | dc, scale, win, f, np, fsrc, fmin, t0, clock, first, y0 | f, h1, hh, rms, thd, u | 4.19.6 |
| `part:TL` | spec, Z, tau, len, vel, Lp, Cp, Rt, Rp, nsec | a1, a2, b1, b2 | 3.18 |
| `part:TLM` | model, len, f, cp, npi, fmin, dec, ppd, fti, tiauto, nmax, ti, wsrc, wtol, wgrp, wfdcm, wdc, wlfw, wopt, wpas, wgd, wbref, wbtxt, vtrap, data, mdl, conn | a1, a2, abc1, abc2, b1, b2, c1, c2 | 4.4 |
| `part:TOWER` | h, Zt, vt, foot, R0, rho, E0, ins, Ub, U0, kde, Dde, impl, meas | a1, a2, b1, b2, c1, c2, d1, d2, e1, e2 | 4.9 |
| `part:UD` | clock, trig, y0 | u, y | 3.18 |
| `part:VAC` | Vpk, f, phase, off, Rs, Ls | n, p | 3.18 |
| `part:VAC3` | Vpk, f, phase, seq, Rs, Ls, conn | a, abc, b, c, n | 3.18 |
| `part:VDC` | ctl, V, Rs, uni, sched | n, p, u | 3.18 |
| `part:VIMP` | shape, Vpk, basis, T1, T2, S, alpha, beta, K, Rs, t0 | n, p | 3.18 |
| `part:VM` | — | n, p, y | 3.18 |
| `part:VP` | — | p, y | 3.18 |
| `part:VSC2` | dc, Vdc, mmax, filt, init, E0, th0, Lf, Rf, Cf, conn | a, abc, b, c, ia, ib, ic, m, ma, mb, mc, meas, n, oa, ob, oc, p, va, vb, vc, vdc | 4.18 |
| `part:XF3` | grp, Sn, U1, U2, f, uk, Pk, i0, P0, tap, core, i00, conn | a1, a2, abc1, abc2, b1, b2, c1, c2 | 4.1 |
| `part:XFMR` | n, Lm, im0, Llk1, Llk2, R1, R2, pol | p1, p2, s1, s2 | 3.18 |
| `part:ZSER3` | Rs, Ls, Rp1, Lp, Rp2, conn | a1, a2, abc1, abc2, b1, b2, c1, c2 | 4.16 |
