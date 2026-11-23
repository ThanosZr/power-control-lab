# CAD-T001: pinned engine baseline

Initial record 2026-11-22; continuation reviewed 2026-11-23. CAD-T001 documentation-only completion is owner-approved (D024), subject to CI at the final published SHA. No CAD kernel or viewport is implemented.

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

All numerical tests above ran against the approved engine source; those checkpoint changes were documentation only. At f57d02f a complete audit verified that all original tracked files remained identical; the later owner-requested README change is recorded separately below. A new published CAD commit still needs its own CI, identified by its exact SHA.

## Continuation evidence, 2026-11-23

The incoming published CAD HEAD was `c169ffc8121013f0ed9837f983b940e66fe73a1a`. Its [CI 45093234600](https://github.com/ThanosZr/power-control-lab/actions/runs/45093234600) was checked directly: `completed / success`, branch `lab-cad-0.1.0-baseline`, push event, and all four jobs successful (Python/Node, MATLAB/Octave, Playwright, packaging). This is evidence for the incoming HEAD, not a later documentation commit.

### Earlier documents recovered

After the owner requested inspection of earlier generated files, the original CAD-S007 material was located and read on 2026-11-23:

- `CAD_INTEGRATION_MAP.md` and `CAD_BASELINE(1).md`, dated 2026-11-22, are the actual earlier draft documents.
- `CAD_VERSIONS_01(1).md` contains the CAD-S007 entry; the accompanying `CAD_NEXT_STEPS(1).md`, `CAD_DECISIONS_01(1).md`, `CAD_PROJECT_INSTRUCTIONS(1).md` and `CAD_SOURCES(1).md` are revision 0.3. They are newer than the revision 0.2 planning files attached at the start of this session.
- `CAD_T001_S006_CHECKPOINT.md` was also read as an earlier checkpoint. The separately named `CAD_T001_docs_unpublished.patch` could not be resolved through the available file search/read route.

This resolves the specific absence of the original CAD-S007 documents. It does not make the reconstruction in `5660e9b` a recovered original, prove old local timings again, or add those generated files automatically to the project's attachment list. The original reports of 152 tests and earlier unpublished HEADs remain historical evidence in those documents; they are not added to this session's test count. Important persistence and resource findings were rechecked in source and incorporated in `CAD_INTEGRATION_MAP.md`.

All advertised remote branch heads were fetched read-only and their reachable path history was searched for CAD/draft, privacy/private, nethash, engine next-steps/decisions/versions, handoff and AGENTS filenames. The matching CAD history contains the three published CAD documents. Neither this filename/history search nor the earlier-generated-file search supplied the active engine handoff or actual privacy procedure and private inputs. This is a scoped search result, not proof about unpublished or differently named private material. No original private checker has been run or replaced.

### Checks executed in this continuation

| Check | Observed result |
| --- | --- |
| `python tools/codemap.py --check` | Passed |
| `python tools/api_surface.py --check` | Passed; 947 API entries |
| `python tools/nn_weights.py --check` | Passed; weights match, maximum difference 0 |
| `python tools/verify.py --check` | Passed; 512/512 within their existing tolerances |
| `python -m unittest tests.test_dock tests.test_live_program tests.test_recording -v` | Passed; 24 tests, no skips. Covers existing layout invariants, circuit parameter-program replay and recording range behavior. It does not test a CAD renderer or mechanical playback. |
| Local browser availability | Playwright 1.62.1 is installed, but its bundled Chromium executable is absent. Launching the installed `/usr/bin/chromium` fails before app assertions with `socket() failed: Operation not permitted` and SIGABRT. No local UI timing or GPU measurement was obtained. |
| Full local suite / Octave | Not rerun for this documentation-only continuation; Octave is absent. The initial full-suite outcome and affected-module rerun above remain separate evidence. |
| Engine identity / final diff | At that three-file checkpoint, engine version remained 5.0.7 and all original tracked files matched. The later expanded plan/README checkpoint has its own explicit scope and integrity rule below. |

The runtime versions match the previously recorded Python/Node/NumPy/SciPy/SymPy environment. No dependency was installed or changed in this continuation. No application code, runtime manifest, API, solver or workflow was edited. The original nethash/ERR procedure is not triggered by these documentation changes and remains unavailable for any later change that requires it.

At that stage, the publication exception was limited to `CAD_BASELINE.md`, `CAD_INTEGRATION_MAP.md` and `CAD_STATUS.md`. Recovering old documents does not waive the missing engine/private-check requirements for task closure or for code publication. New renderer, robotics, AI/PINN and time-playback directions are recorded as future work only.

## Expanded documentation scope, owner instructions on 2026-11-23

The owner subsequently instructed that the five planning documents and the complete detailed CAD plan be published and maintained in Git, so the parallel engine project can read them for future integration. The owner also explicitly requested that the CAD branch root README describe the CAD tool's purpose instead of the old power-electronics presentation. See CAD_DECISIONS_01 D020–D022.

This later authorization extended the documentation-only publication scope to README.md and the ten canonical docs/CAD_*.md files listed in CAD_INDEX. It did not authorize runtime/dependency/workflow changes, private inputs or a substitute private checker. At that checkpoint the two missing private material sets were still task-closure/code-publication gates; D024 subsequently moved them to the pre-implementation gate.

The recovered revision 0.3 planning files are brought into Git with canonical names and updated to documentation revision 0.4. The old numbered decisions and historical S000/S001/S007 records are retained. CAD_INDEX and CAD_PLAN_DETAILS make the plan and future integration criteria readable without prior chat access.

The root README is now an intentional documentation difference from the approved base. **Of the approved base's 437 tracked files, the other 436 must remain byte-identical.** The original README remains available at the pinned Git SHA. No engine version, solver, existing API, runtime dependency, workflow or license file changes.

The same existing source checks apply; document validation additionally checks links, canonical paths, preserved history, superseded Three.js proposals, consistent publication boundaries and the complete diff. A new published SHA still requires its own CI, identified and awaited after publication.

## CAD-S010: continuity and read-only upstream coordination, 2026-11-23

Incoming CAD HEAD `f91ac3cd7852fdb7df651baad3992be91264674c` was confirmed by the remote ref and a fresh single-branch Git clone. The [CI 45107396018](https://github.com/ThanosZr/power-control-lab/actions/runs/45107396018) API response identifies that exact SHA and branch with `completed/success`; all four jobs were successful. A package-job checkout log independently showed the same commit. The source-to-HEAD diff is exactly the intentional README modification and ten added CAD documentation paths. The pinned Git tree contains 437 files and the incoming CAD tree 447; the other 436 original tracked files are unchanged. The engine reports 5.0.7.

Read-only fetching of `main` and `lab-5.0.10` established the newer engine references and relevant UI findings in CAD_INTEGRATION_MAP. The public 5.0.10 CI 45102252449 is independently successful at 2160a13d7180745e80f7f3fefa07788d30b37d1f; no checkout, merge or base change was made. The available project attachments and the available previous-conversation/file search still did not contain the actual newer private engine handoff or the actual privacy procedure and inputs. Record this once as a blocker rather than repeating the search on each restart (D023).

| Fresh local check (pinned runtime, documentation-only working tree) | Result |
| --- | --- |
| `python tools/codemap.py --check` | PASS |
| `python tools/api_surface.py --check` | PASS; 947 entries |
| `python -m unittest tests.test_dock tests.test_live_program tests.test_recording -q` | PASS; 24 tests, no skips |
| `python tools/verify.py --check` | PASS; 512/512 values within tolerances |
| `python tools/nn_weights.py --check` | PASS; 16,000 samples, maximum weight difference 0 |
| `git diff --check`, relative Markdown links and anchors across README and ten CAD docs | PASS; no missing relative targets/anchors |

Environment: Python 3.12.14, Node v24.22.3, NumPy 2.3.5, SciPy 1.17.0. No full local suite, local browser or Octave rerun was necessary for these documentation-only changes; the earlier limitations remain historical. No new CAD GUI benchmark, privacy check or nethash/ERR pass is claimed. The tests above are fresh results, separate from prior results. The final CAD-S010 SHA and CI are to be confirmed after publication, not inferred from the incoming or parallel-engine runs.

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

For the original checkpoint, the diff from the approved baseline contained only the new `docs/CAD_*.md` files. The expanded documentation checkpoint additionally changes README.md and adds the explicitly authorized planning/index/detail files. No solver, netlist, parts catalogue, API, runtime dependency, workflow or license is changed. The original nethash/ERR comparison is therefore not triggered by this documentation change; it has not been executed or replaced with a new checker.

For the full browser baseline, follow `.github/workflows/ci.yml`: install its pinned Playwright and Pyodide versions, fetch the local Pyodide bundle, start `run.py`, then run the existing UI flows. Keep missing infrastructure, UI assertions and measured timing distinct. Do not claim GPU hardware acceleration from CSS code inspection or a headless screenshot.

## Completion gate

**D024 supersedes the earlier task-closure rule for the two private gates.** On 2026-11-23 the owner approved closing CAD-T001 as documentation-only with the local baseline recorded, documentation/source integrity checked and the exact final published CAD SHA successfully validated by CI. Current private engine handoff and the actual privacy procedure/inputs remain mandatory before any CAD implementation; neither has been performed or waived. No runtime, workflow, license, solver, dependency or API change is authorized. D025 reconfirms that later engine development starts on the repository's pinned 5.0.7 and may be enhanced by Fable; the illustrative design is documentation only. Do not start CAD-T002 automatically.

CAD-S011 follows the published S010 `b8fbc8abab4b02c8e01783dee10d0740a9bc32f2`. S010's CI 45122428998 is intermediate. The S011 closure documentation has the same runtime tree as S010 and the approved base. The fresh S010 numerical checks above therefore remain evidence for the unchanged runtime. A fresh S011 local run confirmed engine 5.0.7, codemap PASS, API PASS (947), 24/24 docking/live-program/recording tests, and 52 relative links/anchors across the README and ten CAD docs with zero failures; `git diff --check` passed. Exact tree/identity are checked again before publication. Only the successful CI for the exact published S011 commit can certify final T001 closure.
