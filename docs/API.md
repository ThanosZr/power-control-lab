# Δημόσιο API

Έκδοση 4.8: **σταθερό** από την 4.0: ο κανόνας παρακάτω ισχύει. Παράγεται με `python tools/api_surface.py` από τον ίδιο τον κώδικα (439 σημεία σε 7 επιφάνειες), και ο CI ελέγχει ότι είναι ενημερωμένο (`--check`).

## Κανόνας για αλλαγές που σπάνε (εγκρίθηκε 10/11/2026, ισχύει από την 4.0)

- **Τι είναι δημόσιο:** ό,τι είναι σε αυτόν τον κατάλογο: το πακέτο `pcl`, η γραμμή εντολών, οι ενέργειες του server, οι μέθοδοι των πρόσθετων και της σύνδεσης, οι συναρτήσεις MATLAB/Octave, τα αιτήματα σεναρίων και η μορφή του αρχείου project (τύποι στοιχείων, παράμετροι, ακροδέκτες). Ό,τι ξεκινά με `_` και ό,τι δεν είναι εδώ είναι εσωτερικό.
- **Μέσα σε μία κύρια έκδοση (4.x) μόνο προσθήκες:** νέες μέθοδοι, νέα προαιρετικά ορίσματα, νέα στοιχεία και νέες παράμετροι με προεπιλογή που κρατά την παλιά συμπεριφορά. Καμία αφαίρεση, μετονομασία ή αλλαγή σημασίας.
- **Αφαίρεση σε δύο βήματα:** ό,τι πρόκειται να φύγει γίνεται «παρωχημένο» σε μια 4.x (στη λίστα `DEPRECATED` του `tools/api_surface.py`, με την εναλλακτική, και με μήνυμα όπου τρέχει), δουλεύει ως το τέλος της 4.x και φεύγει στην 5.0. Στην 5.0 φεύγει μόνο ό,τι ήταν παρωχημένο.
- **Αρχεία project:** ένα παλιό αρχείο ανοίγει πάντα (ARCHITECTURE §4). Νέα πεδία είναι προαιρετικά. Όταν χρειάζεται μετατροπή, αυξάνεται το `version` του αρχείου και η μετατροπή γίνεται στο άνοιγμα, με test. Το `version` 3 (3.18): τα σύρματα με το ίδιο όνομα είναι ένας κόμβος· ένα παλιότερο αρχείο ανοίγει ίδιο (`Bus.migrateNames`: όπου ένα όνομα ήταν ετικέτα σε δύο κόμβους, το δεύτερο γίνεται «όνομα·2»).
- **Ο έλεγχος:** το `python tools/api_surface.py` σταματά όταν κάτι λείπει ή έχασε όρισμα. Ως την 4.0 περνούσε με `--allow-removal "λόγος"`, και η αφαίρεση γράφεται παρακάτω. Από την 4.0 μέσα στην ίδια κύρια έκδοση δεν περνά ούτε με `--allow-removal`· στην επόμενη κύρια περνά μόνο για ό,τι ήταν παρωχημένο. Ένα παρωχημένο σημείο πρέπει να υπάρχει ακόμη στον κώδικα.

- **Πειραματικά (3.19):** `pcl.control.…`, `pcl.workbench.…`, `workbench…` (έλεγχος με AI §38, Control Workbench §19). Καταγράφονται, αλλά μένουν έξω από τον κανόνα: αλλάζουν χωρίς `--allow-removal` (η αλλαγή γράφεται στις αφαιρέσεις). Γίνονται σταθερά όταν κλείσει το στάδιο 4 του §38, και η μετάβαση είναι προσθήκη. Στους πίνακες: «πειρ.».

Στους πίνακες, «Από» είναι η έκδοση της πρώτης καταγραφής: η 3.18 για ό,τι υπήρχε ήδη.

## Παρωχημένα

Κανένα στην 4.8.

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

237 σημεία.

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
| `pcl.Project.params` | — | 3.18 |
| `pcl.Project.run` | `t_end`, `solver`, `channels`, `hdiv`, `method`, `step`, `rtol`, `hmax`, `t_from`, `max_points`, `measure`, `timeout`, `scipy_method`, `waveforms`, `save_state`, `resume`, `events` | 3.18 |
| `pcl.Project.save` | `path` | 3.18 |
| `pcl.Project.set` | `key`, `value` | 3.18 |
| `pcl.Project.stream` | `t_end`, `chunk`, `channels`, `hdiv`, `method`, `step`, `rtol`, `hmax`, `t_from`, `max_points`, `measure`, `state`, `resume`, `to`, `timeout`, `waveforms`, `set` | 3.18 |
| `pcl.Project.sweep` | `grid`, `points`, `t_end`, `measure`, `workers`, `solver`, `mode`, `progress`, `to`, `resume`, `**run_kw` | 3.18 |
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
| `pcl.bifurcation` | `param`, `values`, `**kw` | 3.18 |
| `pcl.control.InverseTrainer` | `project`, `loops`, `actuator`, `loop`, `clock`, `t_excite`, `hold`, `dither`, `seed`, `hidden_emu`, `hidden_ctrl`, `lr_emu`, `lr_ctrl`, `epochs_emu`, `epochs_ctrl`, `alpha`, `max_step`, `lr_emu_online`, `lr_ctrl_online`, `run` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.controller` | `epochs` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.ctrl_spec` | `learn` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.emulator` | `epochs` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.excite` | — | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.nets` | — | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.online` | `learn` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.run_all` | `progress` | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.status` | — | 3.18 · πειρ. |
| `pcl.control.InverseTrainer.to_dict` | — | 3.18 · πειρ. |
| `pcl.control.RLTrainer` | `project`, `loops`, `actuator`, `loop`, `clock`, `t_end`, `base`, `hidden`, `sigma`, `lr`, `population`, `seed`, `w_overshoot`, `w_ise`, `nnmax`, `variants`, `run`, `workers` | 3.18 · πειρ. |
| `pcl.control.RLTrainer.ctrl_spec` | `flat` | 3.18 · πειρ. |
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
| `pcl.current` | — | 3.18 |
| `pcl.formats.write_hdf5` | `path`, `columns`, `meta`, `matrices` | 3.18 |
| `pcl.formats.write_parquet` | `path`, `columns`, `meta`, `compression`, `created_by` | 3.18 |
| `pcl.get` | `key` | 3.18 |
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
| `pcl.job` | `spec`, `allow_paths` | 3.18 |
| `pcl.lineconst.LineError` | — | 4.4 |
| `pcl.lineconst.api` | `req` | 4.4 |
| `pcl.lineconst.cable_zy` | `data`, `s` | 4.5 |
| `pcl.lineconst.cables` | `data` | 4.5 |
| `pcl.lineconst.carson_integral` | `hi`, `hk`, `x`, `f`, `rho`, `mu`, `s` | 4.4 |
| `pcl.lineconst.carson_series` | `D`, `phi`, `f`, `rho`, `switch` | 4.4 |
| `pcl.lineconst.conductors` | `data` | 4.4 |
| `pcl.lineconst.cp_model` | `data`, `f`, `length` | 4.4 |
| `pcl.lineconst.exact_admittance` | `data`, `f`, `length` | 4.4 |
| `pcl.lineconst.fd_model` | `data`, `length`, `fmin`, `decades`, `ppd`, `fti`, `tol_zc`, `tol_a`, `n0`, `curves` | 4.4 |
| `pcl.lineconst.freqs` | `fmin`, `decades`, `ppd` | 4.4 |
| `pcl.lineconst.line_admittance` | `Z`, `Y`, `L` | 4.4 |
| `pcl.lineconst.load_data` | `path` | 4.4 |
| `pcl.lineconst.modal` | `Z`, `Y`, `Ti` | 4.4 |
| `pcl.lineconst.model_admittance` | `model`, `s` | 4.4 |
| `pcl.lineconst.nlt_solve` | `network`, `tmax`, `n`, `window` | 4.4 |
| `pcl.lineconst.permittivity` | `s`, `epsr`, `tand`, `fref` | 4.5 |
| `pcl.lineconst.phase_matrices` | `data`, `f`, `s`, `**kw` | 4.4 |
| `pcl.lineconst.phases` | `data` | 4.4 |
| `pcl.lineconst.pollaczek` | `s`, `h`, `y`, `x`, `rho`, `d` | 4.5 |
| `pcl.lineconst.q_error` | `Z`, `Y`, `Ti` | 4.4 |
| `pcl.lineconst.rational` | `s`, `d`, `r`, `p` | 4.4 |
| `pcl.lineconst.reduce_phases` | `Z`, `P`, `cs` | 4.4 |
| `pcl.lineconst.report` | `data`, `f` | 4.4 |
| `pcl.lineconst.save_data` | `data`, `path` | 4.4 |
| `pcl.lineconst.sea_return` | `s`, `Ri`, `Rk`, `d`, `rho` | 4.5 |
| `pcl.lineconst.sequence` | `Z` | 4.4 |
| `pcl.lineconst.ti_matrix` | `Z`, `Y` | 4.4 |
| `pcl.lineconst.tube` | `s`, `q`, `r`, `rho`, `mur` | 4.5 |
| `pcl.lineconst.typical` | `key` | 4.4 |
| `pcl.lineconst.vfit` | `s`, `F`, `n`, `d`, `weight`, `iters`, `p0` | 4.4 |
| `pcl.lineconst.wedepohl` | `s`, `h`, `y`, `d`, `rho` | 4.5 |
| `pcl.lineconst.z_internal` | `f`, `r`, `q`, `Rdc`, `mur`, `skin`, `s` | 4.4 |
| `pcl.lineconst.zy` | `data`, `f`, `earth`, `skin`, `s` | 4.4 |
| `pcl.link.App` | `url`, `token`, `timeout`, `client` | 3.18 |
| `pcl.link.App.call` | `method`, `timeout`, `**args` | 3.18 |
| `pcl.link.App.channels` | — | 3.18 |
| `pcl.link.App.get` | `key` | 3.18 |
| `pcl.link.App.info` | — | 3.18 |
| `pcl.link.App.load` | `project` | 3.18 |
| `pcl.link.App.machines` | — | 4.7 |
| `pcl.link.App.notify` | `msg`, `sev`, `fix` | 3.18 |
| `pcl.link.App.params` | `cid` | 3.18 |
| `pcl.link.App.project` | — | 3.18 |
| `pcl.link.App.python` | `code`, `**inputs` | 3.18 |
| `pcl.link.App.run` | `t_end`, `channels`, `measure`, `**kw` | 3.18 |
| `pcl.link.App.scope` | `keys` | 3.18 |
| `pcl.link.App.selection` | — | 3.18 |
| `pcl.link.App.set` | `key`, `value`, `source` | 3.18 |
| `pcl.link.App.set_many` | `values`, `source` | 3.18 |
| `pcl.link.App.show` | `obj`, `title` | 3.18 |
| `pcl.link.connect` | `url`, `token`, `timeout`, `client` | 3.18 |
| `pcl.load` | `path` | 3.18 |
| `pcl.network.Network` | `f`, `S_base`, `name` | 4.2 |
| `pcl.network.Network.branch_pu` | `a`, `b`, `r`, `x`, `bc`, `ratio`, `angle`, `name` | 4.2 |
| `pcl.network.Network.bus` | `name`, `Un`, `kind`, `V`, `angle`, `Vmin`, `Vmax` | 4.2 |
| `pcl.network.Network.element` | `name` | 4.2 |
| `pcl.network.Network.feeder` | `bus`, `Ik`, `Sk`, `RX`, `X0X`, `R0X0`, `c`, `Ik_min`, `Un`, `name`, `V`, `angle`, `slack` | 4.2 |
| `pcl.network.Network.generator` | `bus`, `Sr`, `Ur`, `xd2`, `cosphi`, `RG`, `xdsat`, `pG`, `X0`, `earthed`, `P`, `V`, `Qmin`, `Qmax`, `slack`, `name` | 4.2 |
| `pcl.network.Network.iec60909` | `fault`, `buses`, `**kw` | 4.2 |
| `pcl.network.Network.impedances` | `mode` | 4.2 |
| `pcl.network.Network.line` | `a`, `b`, `R`, `X`, `length`, `B`, `R0`, `X0`, `parallel`, `name`, `alpha` | 4.2 |
| `pcl.network.Network.load` | `bus`, `P`, `Q`, `zip`, `name` | 4.2 |
| `pcl.network.Network.load_flow` | `tol`, `max_iter`, `q_limits`, `flat` | 4.2 |
| `pcl.network.Network.motor` | `bus`, `Pr`, `Ur`, `cosphi`, `eta`, `ILR`, `p`, `n`, `RX`, `name` | 4.2 |
| `pcl.network.Network.reactor` | `a`, `X`, `R`, `b`, `X0`, `R0`, `name` | 4.2 |
| `pcl.network.Network.remove` | `name` | 4.2 |
| `pcl.network.Network.short_circuit` | `bus`, `fault`, `mode`, `f115`, `tmin`, `temp`, `lv_tol`, `fc`, `breaking`, `rgf` | 4.2 |
| `pcl.network.Network.shunt` | `bus`, `P`, `Q`, `name` | 4.2 |
| `pcl.network.Network.to_emt` | `lf`, `machines`, `name`, `t_end`, `hdiv` | 4.3 |
| `pcl.network.Network.transformer` | `hv`, `lv`, `Sr`, `Uhv`, `Ulv`, `uk`, `ur`, `group`, `X0X`, `R0R`, `Zn_hv`, `Zn_lv`, `tap`, `KT`, `shift`, `name` | 4.2 |
| `pcl.network.Network.transformer3` | `a`, `b`, `c`, `Sr`, `Ur`, `uk`, `ur`, `group`, `ref`, `z0`, `KT`, `name` | 4.2 |
| `pcl.network.Network.unit` | `bus`, `gen`, `trafo`, `oltc`, `pT`, `Zn`, `earthed`, `name`, `P`, `V`, `Qmin`, `Qmax`, `slack` | 4.2 |
| `pcl.network.NetworkError` | — | 4.2 |
| `pcl.network.c_factor` | `Un`, `which`, `lv_tol` | 4.2 |
| `pcl.network.from_dict` | `d` | 4.2 |
| `pcl.network.ieee` | `case` | 4.2 |
| `pcl.network.ieee14` | — | 4.2 |
| `pcl.network.ieee9` | — | 4.2 |
| `pcl.network.kappa` | `rx` | 4.2 |
| `pcl.network.load` | `path` | 4.2 |
| `pcl.network.mu_factor` | `ratio`, `tmin` | 4.2 |
| `pcl.network.q_factor` | `m_mw`, `tmin` | 4.2 |
| `pcl.network.read_matpower` | `source`, `Un_default` | 4.2 |
| `pcl.network.save` | `net`, `path` | 4.2 |
| `pcl.network.superposition` | `net`, `bus`, `lf`, `loads` | 4.2 |
| `pcl.network.to_dict` | `net` | 4.2 |
| `pcl.network.trv` | `t`, `v`, `t0`, `uf` | 4.2 |
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
| `pcl.run` | `**kw` | 3.18 |
| `pcl.set` | `key`, `value` | 3.18 |
| `pcl.show` | `obj`, `title` | 3.18 |
| `pcl.sweep` | `grid`, `**kw` | 3.18 |
| `pcl.tutorial` | `tid`, `**options` | 3.18 |
| `pcl.tutorials` | — | 3.18 |
| `pcl.use` | `project` | 3.18 |
| `pcl.version` | — | 3.18 |
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
| `pcl.workbench.CircuitPlant.step` | `u`, `dt` | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.u_range` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.viz_state` | — | 3.18 · πειρ. |
| `pcl.workbench.CircuitPlant.y_range` | — | 3.18 · πειρ. |
| `pcl.workbench.launch` | `workbench`, `project`, `input`, `measure`, `state`, `u_range`, `y_range`, `state_scale`, `name`, `solver`, `settle`, `headless`, `dt`, `steps`, `n`, `app` | 3.18 · πειρ. |
| `pcl.workbench.plant_class` | `project`, `input`, `measure`, `state`, `u_range`, `y_range`, `state_scale`, `name`, `pid`, `settle`, `solver`, `params`, `input_name`, `output_name` | 3.18 · πειρ. |
| `pcl.workbench.prepare` | `project`, `input`, `measure`, `state` | 3.18 · πειρ. |
| `pcl.workbench.register` | `workbench` | 3.18 · πειρ. |
| `pcl.workbench.run_scheme` | `plant`, `scheme_cls`, `reference`, `dt`, `params` | 3.18 · πειρ. |

## Γραμμή εντολών `python -m pcl`

14 σημεία.

| Σημείο | Ορίσματα | Από |
|---|---|---|
| `python -m pcl bifurcation` | `<project>`, `<param>`, `--values`, `--channel`, `--stat`, `--transient`, `--record`, `--set`, `--workers`, `--out` | 3.18 |
| `python -m pcl channels` | `<project>` | 3.18 |
| `python -m pcl design` | `--machine`, `--controller`, `--goal`, `--cycles`, `--out` | 4.7 |
| `python -m pcl gui` | `--offline` | 4.7 |
| `python -m pcl job` | `<spec>`, `--out` | 3.18 |
| `python -m pcl link` | `<request>`, `--out` | 3.18 |
| `python -m pcl machines` | — | 4.7 |
| `python -m pcl net` | `<network>`, `--lf`, `--sc`, `--bus`, `--mode`, `--tmin`, `--out`, `--emt` | 4.2 |
| `python -m pcl plot` | `<spec>`, `--preset`, `--mapping`, `--kind`, `--signal`, `--table`, `--out` | 3.18 |
| `python -m pcl run` | `<project>`, `--set`, `--t-end`, `--solver`, `--hdiv`, `--method`, `--step`, `--rtol`, `--hmax`, `--channels`, `--from`, `--measure`, `--sep`, `--decimal`, `--out`, `--chunk`, `--state`, `--resume`, `--events` | 3.18 |
| `python -m pcl sweep` | `<project>`, `--set`, `--t-end`, `--solver`, `--hdiv`, `--method`, `--step`, `--rtol`, `--hmax`, `--channels`, `--from`, `--measure`, `--sep`, `--decimal`, `--out`, `--resume`, `--grid`, `--zip`, `--workers` | 3.18 |
| `python -m pcl tutorial` | `<id>`, `--opt`, `--out` | 3.18 |
| `python -m pcl tutorials` | — | 3.18 |
| `python -m pcl workbench` | `--path`, `<project>`, `--link`, `--set`, `--input`, `--measure`, `--state`, `--state-scale`, `--u`, `--y`, `--hdiv`, `--settle`, `--headless`, `--dt` | 3.18 |

## Server: `/api/<ενέργεια>` και διαδρομές

36 σημεία.

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
| `/api/line_model` | — | 4.4 |
| `/api/linearize` | — | 3.18 |
| `/api/link/call` | — | 3.18 |
| `/api/link/deny` | — | 3.18 |
| `/api/link/knock` | — | 3.18 |
| `/api/link/next` | — | 3.18 |
| `/api/link/reply` | — | 3.18 |
| `/api/link/token` | — | 3.18 |
| `/api/model_proof` | — | 3.18 |
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

20 σημεία.

| Μέθοδος | Άδεια | Από |
|---|---|---|
| `batch` | run | 3.18 |
| `bifurcation` | run | 3.18 |
| `channels` | project.read | 3.18 |
| `download` | files | 3.18 |
| `get` | project.read | 3.18 |
| `info` | — | 3.18 |
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

28 σημεία.

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
| `pcl_bifurcation` | `project`, `param`, `values`, `opts` | 3.18 |
| `pcl_config` | — | 3.18 |
| `pcl_job` | `spec`, `server` | 3.18 |
| `pcl_link` | `method`, `args`, `client` | 3.18 |
| `pcl_measures` | `m` | 3.18 |
| `pcl_read` | `file` | 3.18 |
| `pcl_result` | `j` | 3.18 |
| `pcl_run` | `project`, `params`, `opts` | 3.18 |
| `pcl_spec` | `project`, `params` | 3.18 |
| `pcl_style` | `fig`, `name`, `out` | 3.18 |
| `pcl_sweep` | `project`, `grid`, `opts` | 3.18 |

## Αιτήματα σεναρίων (`web/studio/scenario.js`)

12 σημεία.

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
| `action:tutorial` | — | 3.18 |
| `action:tutorials` | — | 3.18 |

## Αρχείο project: στοιχεία, παράμετροι, ακροδέκτες

92 σημεία.

| Σημείο | Παράμετροι / πεδία | Ακροδέκτες | Από |
|---|---|---|---|
| `file` | version, components, wires, subcircuits, solve, sim, scope, meta, tutorial, program, watch | — | 3.18 |
| `file.component` | id, type, x, y, rot, flip, label, params, live, liveBase, liveRate | — | 3.18 |
| `file.program` | t, id, k, v, rate | — | 3.19 |
| `file.sim` | hDiv, speed, stopT, method, rec | — | 4.8 |
| `file.solve` | unconn, island, rleak, tbase, step, rtol, hmax, units | — | 3.19 |
| `file.subcircuit` | title, desc, version, components, wires, params | — | 3.18 |
| `file.watch` | show, tiles, panel | — | 4.8 |
| `file.watch.tile` | id, key, ctl, label, at, al, rng, steps, span | — | 4.8 |
| `file.wire` | id, a, b, pts, name, color, width | — | 3.18 |
| `part:AIC` | scheme, mode, target, learn, fs, fr, Kp, Ki, umin, umax, rs, dxs, us, hidden, opt, lr, elr, K, ds, seed, w | L, iae, r, sat, u, y, yd | 4.8 |
| `part:AM` | — | a, b, y | 3.18 |
| `part:BSEL` | idx | u, y | 3.18 |
| `part:C` | C, v0, esr | n, p | 3.18 |
| `part:CB3` | ctl, cmd, Ron, Roff, vm, conn | a1, a2, abc1, abc2, b1, b2, c1, c2, cmd | 4.1 |
| `part:CLARKE` | inv, conn | a, ab, abc, al, b, be, c | 3.18 |
| `part:CLK` | f, duty, phase | y | 3.18 |
| `part:CMP` | hys | n, p, y | 3.18 |
| `part:CONST` | v, unit | y | 3.18 |
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
| `part:FLT3` | kind, Rf, Rg, ctl, ton, toff, conn | a, abc, b, c, f | 4.1 |
| `part:GAIN` | K, unit | u, y | 3.18 |
| `part:GEN3` | Sn, Un, f, pp, data, conv, Ra, Xl, X0, Xd, Xdp, Xdpp, Xq, Xqp, Xqpp, Td0p, Td0pp, Tq0p, Tq0pp, cXad, cXfd, cRfd, cXkd, cRkd, cXaq, cX1q, cR1q, cX2q, cR2q, shaft, H, D, Hm, Km, Dm, Dmu, Tfr, gm, exc, Efd, mech, Tm, init, V0, ang0, neut, conn | a, abc, b, c, d, efd, ifd, n, pe, qe, te, tm, ts1, ts2, vt, w | 4.3 |
| `part:GND` | — | g | 3.18 |
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
| `part:LINE3` | unit, Un, Sb, f, R1, X1, B1, z0, R0, X0, B0, conn | a1, a2, abc1, abc2, b1, b2, c1, c2 | 4.3 |
| `part:LOAD3` | cn, Un, f, P, Q, model, kz, ki, kp, Vmin, conn | a, abc, b, c | 4.1 |
| `part:LOGIC` | op | a, b, y | 3.18 |
| `part:LPF` | fc, y0 | u, y | 3.18 |
| `part:MEAS` | src, qty | y | 3.18 |
| `part:MOD3` | mode, conn | d, da, db, dc, v, va, vb, vc, vdc | 3.18 |
| `part:MOV` | model, Uref, Iref, alpha, tbl | a, b | 3.18 |
| `part:MUL` | — | a, b, y | 3.18 |
| `part:MUX` | n, frame | u1, u2, u3, y | 3.18 |
| `part:NN` | ins, xs, hidden, ys, ymin, ymax, train, learn, opt, lr, clip, l2, nl, share, jac, init, seed, w, clock, trig, y0 | L, e, fz, tgt, x1, x2, y | 4.7 |
| `part:PARK` | conn | ab, al, be, d, dq, q, th | 3.18 |
| `part:PIB` | Kp, Ki, clock, trig, y0, aw, ymin, ymax | tr, u, y | 3.18 |
| `part:PLL` | f0, bw, th0, conn | a, abc, amp, b, c, th, w | 3.18 |
| `part:PORT` | name, side, width | p | 3.18 |
| `part:PWM` | fs, mode, D, dsched, carrier, phase, upd, dt, sensor, qty, ref, Kp, Ki, Kd, Tf, ff, ffA, ffB, D0, dmin, dmax, m, fref, refphase | d | 3.18 |
| `part:PY` | code, ins, outs, pars, clock, trig, y0 | e, y | 3.18 |
| `part:R` | R, sched | a, b | 3.18 |
| `part:RAMP` | f, shape, lo, hi, phase | y | 3.18 |
| `part:RLIM` | up, dn, y0 | u, y | 3.19 |
| `part:RT` | clock, trig, mode, y0 | u, y | 3.19 |
| `part:SAT` | lo, hi | u, y | 3.18 |
| `part:SCR` | fire, refsrc, alpha, shift, pw, fref, pwm, out, Ron, Vf, Roff | a, g, k | 3.18 |
| `part:SG` | vt, Ub, U0, kde, Dde, trig, Rarc, ext, Iext, Roff | a, b | 3.18 |
| `part:SH` | in, src, qty, clock, trig, init, h0 | u, y | 3.18 |
| `part:SIN` | name, side, width | y | 3.18 |
| `part:SM` | Rs, Ld, Lq, sat, Ldsat, psikd, psim, pp, J, bm, load, TL, w0, th0, conn | a, abc, b, c, id, iq, te, th, tl, w | 3.18 |
| `part:SOUT` | name, side, width | u | 3.18 |
| `part:SR` | q0 | nq, q, r, s | 3.18 |
| `part:SRM` | geo, Rs, mag, Lu, La, Lsat, psik, Imax, tbl, J, bm, load, TL, w0, th0 | a1, a2, a3, a4, b1, b2, b3, b4, i1, i2, i3, i4, te, th, tl, w | 3.18 |
| `part:SUB` | def | — | 3.18 |
| `part:SUM` | signs | a, b, y | 3.18 |
| `part:SW` | gate, pwm, out, model, Ron, Vce0, Roff, body, Vfd, Rd, Eon, Eoff, Vref, Iref | d, g, s | 3.18 |
| `part:TAGI` | name | y | 3.18 |
| `part:TAGO` | name | u | 3.18 |
| `part:TL` | spec, Z, tau, len, vel, Lp, Cp, Rt, Rp, nsec | a1, a2, b1, b2 | 3.18 |
| `part:TLM` | model, len, f, fmin, dec, ppd, fti, data, mdl, conn | a1, a2, abc1, abc2, b1, b2, c1, c2 | 4.4 |
| `part:UD` | clock, trig, y0 | u, y | 3.18 |
| `part:VAC` | Vpk, f, phase, off, Rs, Ls | n, p | 3.18 |
| `part:VAC3` | Vpk, f, phase, seq, Rs, Ls, conn | a, abc, b, c, n | 3.18 |
| `part:VDC` | ctl, V, Rs, uni, sched | n, p, u | 3.18 |
| `part:VIMP` | shape, Vpk, basis, T1, T2, S, alpha, beta, K, Rs, t0 | n, p | 3.18 |
| `part:VM` | — | n, p, y | 3.18 |
| `part:VP` | — | p, y | 3.18 |
| `part:XF3` | grp, Sn, U1, U2, f, uk, Pk, i0, P0, tap, core, i00, conn | a1, a2, abc1, abc2, b1, b2, c1, c2 | 4.1 |
| `part:XFMR` | n, Lm, im0, Llk1, Llk2, R1, R2, pol | p1, p2, s1, s2 | 3.18 |
