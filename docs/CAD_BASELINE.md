# CAD-T001: pinned engine baseline

Recorded 2026-11-22. CAD-T001 is in progress. No CAD kernel or viewport is implemented by this checkpoint.

## Source of truth

| Item | Value |
| --- | --- |
| Repository | `ThanosZr/power-control-lab` |
| CAD branch | `lab-cad-0.1.0-baseline` |
| Engine version | `5.0.7`, from `engine/__init__.py` |
| Approved engine commit | `dab82e5ff2e6da4bde09e4a38aab32edfffe6d51` |
| Approved engine tree | `13edcd98a92adfd561c61010e4af0030130121fe` |
| Tracked files at the approved engine commit | 437, counted with `git ls-files` before adding these documents |

The engine commit remains the baseline even when `main` advances. Read newer engine material for coordination only; do not merge, rebase or change the baseline without a new instruction.

## Existing CI, checked directly

All three runs below returned `completed / success` at the same approved commit on 2026-11-22. They validate the existing engine, not a subsequent CAD documentation commit.

| Ref at run time | Run |
| --- | --- |
| `lab-5.0.7` | [44995758236](https://github.com/ThanosZr/power-control-lab/actions/runs/44995758236) |
| `main` | [45001873759](https://github.com/ThanosZr/power-control-lab/actions/runs/45001873759) |
| `lab-cad-0.1.0-baseline` | [45011321787](https://github.com/ThanosZr/power-control-lab/actions/runs/45011321787) |

The CAD baseline run's four jobs were also checked directly: Python/Node, MATLAB/Octave, Playwright UI and packaging all completed successfully at the approved SHA. The release step was skipped as expected for a branch push. This is existing baseline CI evidence; it is not a local browser measurement or CI for the new documentation.

## Recheck in this session

| Check | Result at the initial checkpoint |
| --- | --- |
| `python tools/codemap.py --check` | Passed |
| `python tools/api_surface.py --check` | Passed; 947 API entries |
| `python tools/nn_weights.py --check` | Passed; weights match, maximum difference 0 |
| `python -m unittest discover -s tests -v` | Completed: 1,167 tests in 2,201.645 s; `FAILED (errors=2, skipped=11)`. Both errors are control-class setup failures with `Cannot find module 'pyodide'`, before installing that package. There were no assertion failures. |
| `python -m unittest tests.test_control tests.test_stream -v` | Passed: 19 tests in 65.807 s after installing the CI-pinned `pyodide@0.26.4`; includes the control classes and the Pyodide-dependent continuation test. |
| `python tools/verify.py --check` | Passed: 512/512 values within their tolerances |
| Browser interaction baseline | Not measured: bundled Playwright browser is absent; system Chromium launch fails with `socket() failed: Operation not permitted` |
| Octave | Not installed locally; local skips must be reported separately from failures |
| Original privacy checker and private comparison inputs | Not available in the approved Git tree or the six supplied project source files; not executed. The owner approved a publication exception on 2026-11-22 for these three documentation files and their check-result updates only. |
| Original CAD-S007/drafts | Not present in the approved Git tree or the six supplied project source files; not recovered |

These files are a fresh reconstruction from the approved source, not recovered CAD-S007 drafts. Earlier uncommitted artifacts and earlier local test results are not asserted here.

The approved source has 217 ancestor commits including itself (`git rev-list --count <approved-SHA>`). A path-history search through that history also found no CAD documents, CAD-S007, privacy checker or nethash script under the searched names. The new local documentation commit is the first matching CAD history in this checkout. This does not establish the contents of an unpublished draft or a private source outside Git.

Local environment: Python 3.12.14, Node v24.22.3, NumPy 2.3.5, SciPy 1.17.0, SymPy 1.14.0. The existing CI uses Python 3.12 and Node 22. Local timing is not a performance measurement for the user's machine.

Pyodide was initially absent and was installed with `npm install --no-save pyodide@0.26.4`, matching the existing workflow. No dependency manifest or lockfile was added to Git. Keep the initial run's errors and discovery-time skips visible even when the affected tests pass in a later process; do not relabel the initial run as a clean pass.

The two failed setup classes were `test_control.OnTheDrive` and `test_control.Stage2OnTheDrive`; all their tests passed in the 19-test rerun. The initial 11 skips were nine Octave tests, one desktop-window test without a display, and one Pyodide continuation test whose availability was evaluated during discovery. The continuation test also passed in the rerun. Octave and the desktop GUI remain untested locally. The full suite was not rerun after the dependency correction; the original full result and successful affected-module rerun are separate evidence.

All numerical tests above ran against the approved engine source; the new Git changes are documentation only. Final documentation checks and a complete diff audit verify that the original tracked engine files remain identical. A new published CAD commit still needs its own CI, identified by its exact SHA.

## Reproduce and review

Run from the repository root on the CAD branch:

```sh
git branch --show-current
git merge-base --is-ancestor dab82e5ff2e6da4bde09e4a38aab32edfffe6d51 HEAD
python -c 'from engine import __version__; assert __version__ == "5.0.7"'
git diff --name-status dab82e5ff2e6da4bde09e4a38aab32edfffe6d51 HEAD
python -m pip install -r requirements.txt
npm install --no-save pyodide@0.26.4
python tools/codemap.py --check
python tools/api_surface.py --check
python -m unittest discover -s tests -v
python tools/verify.py --check
python tools/nn_weights.py --check
git diff --check dab82e5ff2e6da4bde09e4a38aab32edfffe6d51 HEAD
```

For this checkpoint, the diff from the approved baseline may contain only the new `docs/CAD_*.md` files. No solver, netlist, parts catalogue, API, runtime dependency or workflow is changed. The original nethash/ERR comparison is therefore not triggered by this documentation change; it has not been executed or replaced with a new checker.

For the full browser baseline, follow `.github/workflows/ci.yml`: install its pinned Playwright and Pyodide versions, fetch the local Pyodide bundle, start `run.py`, then run the existing UI flows. Keep missing infrastructure, UI assertions and measured timing distinct. Do not claim GPU hardware acceleration from CSS code inspection or a headless screenshot.

## Completion gate

CAD-T001 closes only after the required current engine handoff documents are available and reread, the actual privacy requirement is resolved for task closure, the local baseline has a recorded outcome, and the final published CAD SHA has successful CI. The owner's documentation-only publication exception permits this checkpoint; it does not mean the missing private check was performed or that a future code push is approved. Publishing a checkpoint does not itself close CAD-T001. Do not start CAD-T002 automatically.
