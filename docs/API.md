# Δημόσιο API

Έκδοση 3.18: **προσωρινό**. Γίνεται σταθερό από την 4.0. Παράγεται με `python tools/api_surface.py` από τον ίδιο τον κώδικα (317 σημεία σε 7 επιφάνειες), και ο CI ελέγχει ότι είναι ενημερωμένο (`--check`).

## Κανόνας για αλλαγές που σπάνε (εγκρίθηκε 10/11/2026, ισχύει από την 4.0)

- **Τι είναι δημόσιο:** ό,τι είναι σε αυτόν τον κατάλογο: το πακέτο `pcl`, η γραμμή εντολών, οι ενέργειες του server, οι μέθοδοι των πρόσθετων και της σύνδεσης, οι συναρτήσεις MATLAB/Octave, τα αιτήματα σεναρίων και η μορφή του αρχείου project (τύποι στοιχείων, παράμετροι, ακροδέκτες). Ό,τι ξεκινά με `_` και ό,τι δεν είναι εδώ είναι εσωτερικό.
- **Μέσα σε μία κύρια έκδοση (4.x) μόνο προσθήκες:** νέες μέθοδοι, νέα προαιρετικά ορίσματα, νέα στοιχεία και νέες παράμετροι με προεπιλογή που κρατά την παλιά συμπεριφορά. Καμία αφαίρεση, μετονομασία ή αλλαγή σημασίας.
- **Αφαίρεση σε δύο βήματα:** ό,τι πρόκειται να φύγει γίνεται «παρωχημένο» σε μια 4.x (με μήνυμα και την εναλλακτική), δουλεύει ως το τέλος της 4.x και φεύγει στην 5.0.
- **Αρχεία project:** ένα παλιό αρχείο ανοίγει πάντα (ARCHITECTURE §4). Νέα πεδία είναι προαιρετικά. Όταν χρειάζεται μετατροπή, αυξάνεται το `version` του αρχείου και η μετατροπή γίνεται στο άνοιγμα, με test. Το `version` 3 (3.18): τα σύρματα με το ίδιο όνομα είναι ένας κόμβος· ένα παλιότερο αρχείο ανοίγει ίδιο (`Bus.migrateNames`: όπου ένα όνομα ήταν ετικέτα σε δύο κόμβους, το δεύτερο γίνεται «όνομα·2»).
- **Ο έλεγχος:** το `python tools/api_surface.py` σταματά όταν κάτι λείπει ή έχασε όρισμα. Πριν από την 4.0 περνά μόνο με `--allow-removal "λόγος"`, και η αφαίρεση γράφεται παρακάτω. Από την 4.0 η αφαίρεση σημείου της ίδιας κύριας έκδοσης δεν περνά.

Στους πίνακες, «Από» είναι η έκδοση της πρώτης καταγραφής: η 3.18 για ό,τι υπήρχε ήδη.

## Αφαιρέσεις και αλλαγές που σπάνε

| Έκδοση | Επιφάνεια | Σημείο | Τι | Λόγος |
|---|---|---|---|---|
| 3.18 | project | `file.wire` | χωρίς link | 3.18: τα σύρματα με το ίδιο όνομα ενώνουν πάντα (version 3), το πεδίο link δεν χρειάζεται |

## Πακέτο Python `pcl`

144 σημεία.

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
| `pcl.Project.run` | `t_end`, `solver`, `channels`, `hdiv`, `method`, `step`, `rtol`, `hmax`, `t_from`, `max_points`, `measure`, `timeout`, `scipy_method`, `waveforms`, `save_state`, `resume` | 3.18 |
| `pcl.Project.save` | `path` | 3.18 |
| `pcl.Project.set` | `key`, `value` | 3.18 |
| `pcl.Project.stream` | `t_end`, `chunk`, `channels`, `hdiv`, `method`, `step`, `rtol`, `hmax`, `t_from`, `max_points`, `measure`, `state`, `resume`, `to`, `timeout`, `waveforms`, `set` | 3.18 |
| `pcl.Project.sweep` | `grid`, `points`, `t_end`, `measure`, `workers`, `solver`, `mode`, `progress`, `to`, `resume`, `**run_kw` | 3.18 |
| `pcl.Result` | `t`, `keys`, `ch`, `meta`, `project`, `measured`, `diag` | 3.18 |
| `pcl.Result.as_dict` | — | 3.18 |
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
| `pcl.control.InverseTrainer` | `project`, `loops`, `actuator`, `loop`, `clock`, `t_excite`, `hold`, `dither`, `seed`, `hidden_emu`, `hidden_ctrl`, `lr_emu`, `lr_ctrl`, `epochs_emu`, `epochs_ctrl`, `alpha`, `max_step`, `lr_emu_online`, `lr_ctrl_online`, `run` | 3.18 |
| `pcl.control.InverseTrainer.controller` | `epochs` | 3.18 |
| `pcl.control.InverseTrainer.ctrl_spec` | `learn` | 3.18 |
| `pcl.control.InverseTrainer.emulator` | `epochs` | 3.18 |
| `pcl.control.InverseTrainer.excite` | — | 3.18 |
| `pcl.control.InverseTrainer.nets` | — | 3.18 |
| `pcl.control.InverseTrainer.online` | `learn` | 3.18 |
| `pcl.control.InverseTrainer.run_all` | `progress` | 3.18 |
| `pcl.control.InverseTrainer.status` | — | 3.18 |
| `pcl.control.InverseTrainer.to_dict` | — | 3.18 |
| `pcl.control.RLTrainer` | `project`, `loops`, `actuator`, `loop`, `clock`, `t_end`, `base`, `hidden`, `sigma`, `lr`, `population`, `seed`, `w_overshoot`, `w_ise`, `nnmax`, `variants`, `run`, `workers` | 3.18 |
| `pcl.control.RLTrainer.ctrl_spec` | `flat` | 3.18 |
| `pcl.control.RLTrainer.iterate` | `n`, `progress` | 3.18 |
| `pcl.control.RLTrainer.project` | `flat` | 3.18 |
| `pcl.control.RLTrainer.to_dict` | — | 3.18 |
| `pcl.control.compare` | `project`, `loops`, `actuator`, `variants`, `t_end`, `clock`, `run`, `workers`, `loop` | 3.18 |
| `pcl.control.compose` | `project`, `loops`, `actuator`, `clock`, `prefix`, `replace` | 3.18 |
| `pcl.control.inv_nn_code` | `nets` | 3.18 |
| `pcl.control.metrics` | `t`, `r`, `y`, `t_from` | 3.18 |
| `pcl.control.rl_code` | `theta` | 3.18 |
| `pcl.control.rl_theta0` | `n_state`, `hidden`, `seed`, `scale` | 3.18 |
| `pcl.current` | — | 3.18 |
| `pcl.formats.write_hdf5` | `path`, `columns`, `meta`, `matrices` | 3.18 |
| `pcl.formats.write_parquet` | `path`, `columns`, `meta`, `compression`, `created_by` | 3.18 |
| `pcl.get` | `key` | 3.18 |
| `pcl.impulse.check_voltage` | `alpha`, `beta`, `K`, `Vp`, `profile`, `X`, `Y`, `method`, `Vpeak` | 3.18 |
| `pcl.impulse.dexp` | `t`, `alpha`, `beta` | 3.18 |
| `pcl.impulse.fit_heidler` | `T1`, `T2`, `Im`, `n`, `H`, `H_value` | 3.18 |
| `pcl.impulse.fit_profile` | `code`, `Vp` | 3.18 |
| `pcl.impulse.fit_voltage` | `X`, `Y`, `Vp`, `method`, `profile` | 3.18 |
| `pcl.impulse.heidler` | `t`, `tau1`, `tau2`, `n` | 3.18 |
| `pcl.impulse.lightning_times` | `m` | 3.18 |
| `pcl.impulse.read_heidler_csv` | `path_or_text` | 3.18 |
| `pcl.impulse.read_voltage_csv` | `path_or_text` | 3.18 |
| `pcl.impulse.times` | `f`, `t_lo`, `t_hi` | 3.18 |
| `pcl.impulse.voltage_measure` | `alpha`, `beta` | 3.18 |
| `pcl.impulse.voltage_times` | `m` | 3.18 |
| `pcl.job` | `spec`, `allow_paths` | 3.18 |
| `pcl.link.App` | `url`, `token`, `timeout`, `client` | 3.18 |
| `pcl.link.App.call` | `method`, `timeout`, `**args` | 3.18 |
| `pcl.link.App.channels` | — | 3.18 |
| `pcl.link.App.get` | `key` | 3.18 |
| `pcl.link.App.info` | — | 3.18 |
| `pcl.link.App.load` | `project` | 3.18 |
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
| `pcl.workbench.CircuitPlant` | `params` | 3.18 |
| `pcl.workbench.CircuitPlant.clone` | — | 3.18 |
| `pcl.workbench.CircuitPlant.close` | — | 3.18 |
| `pcl.workbench.CircuitPlant.deriv` | `x`, `u` | 3.18 |
| `pcl.workbench.CircuitPlant.initial_state` | — | 3.18 |
| `pcl.workbench.CircuitPlant.measured` | — | 3.18 |
| `pcl.workbench.CircuitPlant.measured_scale` | — | 3.18 |
| `pcl.workbench.CircuitPlant.output` | — | 3.18 |
| `pcl.workbench.CircuitPlant.params_dict` | — | 3.18 |
| `pcl.workbench.CircuitPlant.reset_state` | — | 3.18 |
| `pcl.workbench.CircuitPlant.step` | `u`, `dt` | 3.18 |
| `pcl.workbench.CircuitPlant.u_range` | — | 3.18 |
| `pcl.workbench.CircuitPlant.viz_state` | — | 3.18 |
| `pcl.workbench.CircuitPlant.y_range` | — | 3.18 |
| `pcl.workbench.launch` | `workbench`, `project`, `input`, `measure`, `state`, `u_range`, `y_range`, `state_scale`, `name`, `solver`, `settle`, `headless`, `dt`, `steps`, `n`, `app` | 3.18 |
| `pcl.workbench.plant_class` | `project`, `input`, `measure`, `state`, `u_range`, `y_range`, `state_scale`, `name`, `pid`, `settle`, `solver`, `params`, `input_name`, `output_name` | 3.18 |
| `pcl.workbench.prepare` | `project`, `input`, `measure`, `state` | 3.18 |
| `pcl.workbench.register` | `workbench` | 3.18 |
| `pcl.workbench.run_scheme` | `plant`, `scheme_cls`, `reference`, `dt`, `params` | 3.18 |

## Γραμμή εντολών `python -m pcl`

10 σημεία.

| Σημείο | Ορίσματα | Από |
|---|---|---|
| `python -m pcl bifurcation` | `<project>`, `<param>`, `--values`, `--channel`, `--stat`, `--transient`, `--record`, `--set`, `--workers`, `--out` | 3.18 |
| `python -m pcl channels` | `<project>` | 3.18 |
| `python -m pcl job` | `<spec>`, `--out` | 3.18 |
| `python -m pcl link` | `<request>`, `--out` | 3.18 |
| `python -m pcl plot` | `<spec>`, `--preset`, `--mapping`, `--kind`, `--signal`, `--table`, `--out` | 3.18 |
| `python -m pcl run` | `<project>`, `--set`, `--t-end`, `--solver`, `--hdiv`, `--method`, `--step`, `--rtol`, `--hmax`, `--channels`, `--from`, `--measure`, `--sep`, `--decimal`, `--out`, `--chunk`, `--state`, `--resume` | 3.18 |
| `python -m pcl sweep` | `<project>`, `--set`, `--t-end`, `--solver`, `--hdiv`, `--method`, `--step`, `--rtol`, `--hmax`, `--channels`, `--from`, `--measure`, `--sep`, `--decimal`, `--out`, `--resume`, `--grid`, `--zip`, `--workers` | 3.18 |
| `python -m pcl tutorial` | `<id>`, `--opt`, `--out` | 3.18 |
| `python -m pcl tutorials` | — | 3.18 |
| `python -m pcl workbench` | `--path`, `<project>`, `--link`, `--set`, `--input`, `--measure`, `--state`, `--state-scale`, `--u`, `--y`, `--hdiv`, `--settle`, `--headless`, `--dt` | 3.18 |

## Server: `/api/<ενέργεια>` και διαδρομές

34 σημεία.

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
| `/api/scenario_run` | — | 3.18 |
| `/api/scenario_sweep` | — | 3.18 |
| `/api/solve` | — | 3.18 |
| `/api/studio_math` | — | 3.18 |
| `/api/sweep` | — | 3.18 |
| `/api/switching` | — | 3.18 |
| `/api/template_solve` | — | 3.18 |
| `/api/validate_circuit` | — | 3.18 |

## API πρόσθετων και σύνδεσης (`addons.js` M, `pcl.link.App`, `PclApp`)

19 σημεία.

| Μέθοδος | Άδεια | Από |
|---|---|---|
| `batch` | run | 3.18 |
| `bifurcation` | run | 3.18 |
| `channels` | project.read | 3.18 |
| `download` | files | 3.18 |
| `get` | project.read | 3.18 |
| `info` | — | 3.18 |
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

10 σημεία.

| Σημείο | Ορίσματα | Από |
|---|---|---|
| `action:advance` | — | 3.18 |
| `action:bifurcation` | — | 3.18 |
| `action:channels` | — | 3.18 |
| `action:close` | — | 3.18 |
| `action:export` | — | 3.18 |
| `action:open` | — | 3.18 |
| `action:run` | — | 3.18 |
| `action:state` | — | 3.18 |
| `action:tutorial` | — | 3.18 |
| `action:tutorials` | — | 3.18 |

## Αρχείο project: στοιχεία, παράμετροι, ακροδέκτες

72 σημεία.

| Σημείο | Παράμετροι / πεδία | Ακροδέκτες | Από |
|---|---|---|---|
| `file` | version, components, wires, subcircuits, solve, sim, scope, meta, tutorial | — | 3.18 |
| `file.component` | id, type, x, y, rot, flip, label, params, live, liveBase | — | 3.18 |
| `file.subcircuit` | title, desc, version, components, wires, params | — | 3.18 |
| `file.wire` | id, a, b, pts, name, color, width | — | 3.18 |
| `part:AM` | — | a, b, y | 3.18 |
| `part:BSEL` | idx | u, y | 3.18 |
| `part:C` | C, v0, esr | n, p | 3.18 |
| `part:CLARKE` | inv, conn | a, ab, abc, al, b, be, c | 3.18 |
| `part:CLK` | f, duty, phase | y | 3.18 |
| `part:CMP` | hys | n, p, y | 3.18 |
| `part:CONST` | v | y | 3.18 |
| `part:CPE` | kind, sigma, Q, alpha, fmin, fmax, N | a, b | 3.18 |
| `part:CPL` | P, Vmin, sched | n, p | 3.18 |
| `part:D` | Ron, Vf, Roff | a, k | 3.18 |
| `part:DCM` | Ra, La, psi, J, bm, load, TL, w0, ia0 | a, b, te, tl, w | 3.18 |
| `part:DEMUX` | n | u, y1, y2, y3 | 3.18 |
| `part:DISP` | dig | u | 3.18 |
| `part:DIV` | eps | a, b, y | 3.18 |
| `part:EBUS` | n | a, b, bus, c | 3.18 |
| `part:EXPR` | expr, ins, pars | u1, u2, y | 3.18 |
| `part:FEST` | mode, RR, LM, psi0 | al, be, psi, th, w1, wr | 3.18 |
| `part:GAIN` | K | u, y | 3.18 |
| `part:GND` | — | g | 3.18 |
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
| `part:LOGIC` | op | a, b, y | 3.18 |
| `part:LPF` | fc, y0 | u, y | 3.18 |
| `part:MEAS` | src, qty | y | 3.18 |
| `part:MOD3` | mode, conn | d, da, db, dc, v, va, vb, vc, vdc | 3.18 |
| `part:MOV` | model, Uref, Iref, alpha, tbl | a, b | 3.18 |
| `part:MUL` | — | a, b, y | 3.18 |
| `part:MUX` | n | u1, u2, u3, y | 3.18 |
| `part:PARK` | conn | ab, al, be, d, dq, q, th | 3.18 |
| `part:PIB` | Kp, Ki, clock, trig, y0, aw, ymin, ymax | tr, u, y | 3.18 |
| `part:PLL` | f0, bw, th0, conn | a, abc, amp, b, c, th, w | 3.18 |
| `part:PORT` | name, side, width | p | 3.18 |
| `part:PWM` | fs, mode, D, dsched, carrier, phase, upd, dt, sensor, qty, ref, Kp, Ki, Kd, Tf, ff, ffA, ffB, D0, dmin, dmax, m, fref, refphase | d | 3.18 |
| `part:PY` | code, ins, outs, pars, clock, trig, y0 | e, y | 3.18 |
| `part:R` | R, sched | a, b | 3.18 |
| `part:RAMP` | f, shape, lo, hi, phase | y | 3.18 |
| `part:SAT` | lo, hi | u, y | 3.18 |
| `part:SCR` | fire, refsrc, alpha, shift, pw, fref, pwm, out, Ron, Vf, Roff | a, k | 3.18 |
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
| `part:UD` | clock, trig, y0 | u, y | 3.18 |
| `part:VAC` | Vpk, f, phase, off, Rs, Ls | n, p | 3.18 |
| `part:VAC3` | Vpk, f, phase, seq, Rs, Ls, conn | a, abc, b, c, n | 3.18 |
| `part:VDC` | ctl, V, Rs, uni, sched | n, p, u | 3.18 |
| `part:VIMP` | shape, Vpk, basis, T1, T2, S, alpha, beta, K, Rs, t0 | n, p | 3.18 |
| `part:VM` | — | n, p, y | 3.18 |
| `part:VP` | — | p, y | 3.18 |
| `part:XFMR` | n, Lm, im0, Llk1, Llk2, R1, R2, pol | p1, p2, s1, s2 | 3.18 |
