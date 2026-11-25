# CAD: active handoff

Updated 2026-11-25; documentation revision 0.7, CAD-S014. Start with the [documentation index](CAD_INDEX.md), this file, [worker contract](CAD_WORKER_CONTRACT.md), [document contract](CAD_DOCUMENT_CONTRACT.md), [kernel evaluation](CAD_KERNEL_EVALUATION.md), [baseline](CAD_BASELINE.md), [integration map](CAD_INTEGRATION_MAP.md), and the active planning/decision files in this Git branch.

## Scope and pinned state

- Task: **CAD-T004 — isolated revisioned worker/job coordinator v1 (D029)**, with SOL and no subagents. Local contract complete; final closure requires CI at the actual published SHA.
- Repository: ThanosZr/power-control-lab.
- Branch: lab-cad-0.4.0-workers; parent checkpoint lab-cad-0.3.0-document `c9fe513eb984653741519b93ff177796150a66cd`, CI 45149843737, 4/4 success.
- Approved engine source: **5.0.7**, dab82e5ff2e6da4bde09e4a38aab32edfffe6d51.
- Keep the approved base, main and engine branches unchanged. Do not integrate CAD runtime or implement a viewport. Selected OCCT with initial build123d adapter; native OCP escape path; portable GPU/rendering design separate.
- Author and committer: Thanos Zr, 85298380+ThanosZr@users.noreply.github.com.
- Obtain the actual published CAD HEAD from the remote branch; distinguish it from the approved engine source.

## Canonical documentation is now in Git

Owner instructions on 2026-11-23 authorize keeping **all detailed public CAD planning documentation in this branch**, so it can also be read by the parallel engine project for future integration. The root README must describe the CAD tool's goal and current status. See decisions D020–D022.

The canonical package consists of:

- CAD_PROJECT_INSTRUCTIONS: rules and publication/base boundaries.
- CAD_NEXT_STEPS and CAD_PLAN_DETAILS: product plan, stages, acceptance criteria, dependencies and future directions.
- CAD_DECISIONS_01 and CAD_VERSIONS_01: preserved history and new decisions/checkpoints.
- CAD_SOURCES: source register and outstanding private material.
- CAD_BASELINE and CAD_INTEGRATION_MAP: exact evidence, source findings and extension boundaries.
- CAD_INDEX and the branch README: navigation and integration guidance.
- CAD_KERNEL_EVALUATION and experiments/cad_t002/benchmark.py: isolated, synthetic T002 evidence, architecture boundaries and Fable review.
- CAD_DOCUMENT_CONTRACT and experiments/cad_t003/: isolated synthetic document API, shaft template, demo, tests and Fable review. No native result generation.
- CAD_WORKER_CONTRACT and experiments/cad_t004/: isolated cooperative synthetic worker coordinator, cache, reservations, demo, tests and Fable review. No native process/geometry or integrated solver arbitration.

Update these existing Git files as the project evolves. Once their publication is verified at the remote SHA, tell the owner that repeated uploads of these public CAD docs to project attachments are unnecessary. A saved local file or chat artifact does not prove an attachment changed. Ask for a specific private file only when it is still required and absent.

**D023 — Git-first, no repeated file hunt.** The owner expressly instructed that each next chat must already have what it needs. Maintain every publishable prerequisite and precise public source reference in the canonical Git package. Do not repeat previous-chat, Library, old ZIP/workspace or recovered-draft searches at each handoff. The two outstanding private material sets were rechecked in supplied files, public Git, available file search and previous CAD conversations with no actual originals found. Under D024, they are blockers before implementation, not before documentation-only T001 closure. Do not keep searching for them on every restart or publish private material.

## Version branches

- Every new CAD software version starts on a new lab-cad-<version>-<topic> branch.
- Intermediate commits of the same version stay on that version's branch.
- Documentation revision 0.6 and the isolated T003 reference contract are on a separate CAD milestone branch; not a PCL software release.
- Each final delivered commit needs appropriate local checks and successful CI at that exact SHA.
- Main writes, a merge or a baseline upgrade need a specific owner instruction covering that change. Publishing the CAD plan is not that instruction.

## Published history and recovery

| Checkpoint | Meaning / evidence |
| --- | --- |
| 5660e9bc499d2ec12bb9898724f8b22953fa2cf8 | Fresh reconstruction of the three baseline/map/status docs, not recovered originals. CI 45062057720 passed. |
| c169ffc8121013f0ed9837f983b940e66fe73a1a | Branch-per-version policy. CI 45093234600 rechecked directly: all four jobs successful. |
| f57d02f07895dd0fa1fb73ec221dc70cdac566c1 | Actual earlier CAD-S007 documents recovered/read; source findings reconciled and future directions recorded. CI 45101812370 is the intermediate run, separate from the next final commit. |
| f91ac3cd7852fdb7df651baad3992be91264674c | CAD-S009: full public CAD plan/README. CI 45107396018 independently verified: exact SHA, completed/success, 4/4 jobs. |
| b8fbc8abab4b02c8e01783dee10d0740a9bc32f2 | CAD-S010: source integrity, Git-first rule and read-only 5.0.10 workspace findings. CI 45122428998 is a separate intermediate run and cannot certify S011. |
| e997a3d24f29906be9768e6fc9fb8fce63f4895b | CAD-S011: T001 documentation-only closure, CI 45124099619, 4/4 success. |
| 7fbcc0d63d258f57afd31c0e42acfcf9285405ba | CAD-S012 intermediate benchmark/evaluation published on new branch, CI 45135211023 (intermediate only). Final handoff commit needs its own CI. |
| 43f7fe301122c2942d61a4badc5fb4a4ccf461af | Final T002 checkpoint, CI 45135806207 independently checked: completed/success, exact SHA, four successful jobs. |
| c9fe513eb984653741519b93ff177796150a66cd | Final T003 checkpoint, CI 45149843737 independently checked on 25/11: completed/success, exact SHA, four successful jobs. |

The original CAD-S007 map/baseline, S007 version entry and all five revision 0.3 planning files were recovered from earlier generated files on 2026-11-23. An older S006 checkpoint was read too. Do not request those originals again, relabel the reconstruction as recovery or add old timings to current test counts. The separate old patch remained unavailable, but is no longer needed to recover the two documents already read.

## Publication scope and unresolved gates

The original owner's exception covered only CAD_BASELINE, CAD_INTEGRATION_MAP and CAD_STATUS. D020–D021 extend publication to the complete public CAD planning package and README; D024 permits T001 documentation-only closure. **D026, D028 and D029 authorize the respective isolated synthetic T002/T003/T004 deliverables and documentation, leaving both private gates required before implementation in PCL.** No private input publication, runtime changes without their checks, main changes or claim that either private gate passed.

| Gate / evidence | Current status and next action |
| --- | --- |
| Original CAD-S007/drafts | Recovered and source-reconciled. Resolved; keep provenance/history distinct. |
| Current engine handoff | Still missing; required before CAD implementation in PCL per D024/D026. The available decisions-14 ends at 5.0.5. Public `lab-5.0.10` was inspected read-only for coordination; it does not establish the private handoff. |
| Actual privacy procedure | Checker, instructions and private inputs still missing and not executed; required before CAD implementation in PCL per D024/D026. Do not invent a substitute or claim a pass. |
| Local baseline | Initial full run: 1,167 tests, two missing-Pyodide setup errors and 11 skips; affected control/stream rerun: 19 passed. This continuation: codemap/API/weights/512-value verification passed; 24 dock/program/recording tests passed. Separate results in CAD_BASELINE. |
| Local UI / Octave | Historical T001 environment: browser/Octave unavailable. T002 synthetic CPU timings in CAD_KERNEL_EVALUATION; no GPU or integrated UI timing claimed. |
| Source integrity | Verified at incoming f91ac3c: 437 approved tracked files, 447 CAD tracked files; only approved README differs from the original 437, and ten CAD docs are added. The other 436 original files, including runtime and workflow, must remain identical. |
| Local T002 tests | 15 measured builds and tessellations per wrapper (plus warm-ups); exact geometry/STEP round-trip for 3/3 variants each, pip check PASS. See CAD_KERNEL_EVALUATION. |
| Pinned engine / doc integrity | Engine version 5.0.7, codemap/API (947) PASS, 24 dock/live-program/recording tests PASS, 60 relative file targets checked, git diff --check PASS. Diff excluding README, CAD docs and synthetic benchmark empty against approved base. |
| Local T003 tests | Python 3.12.14: 12 isolated unittest methods passed; synthetic shaft edit 20×100 → 32×180 mm, resolved radius and port location, round-trip, schema and revision validation, atomic failures, bounded undo/redo. CODEMAP/API (947) and 24 existing dock/live-program/recording tests passed. |
| Local T004 tests | Python 3.12.14: 23/23 isolated regression methods (12 T003 + 11 T004), demo miss/miss/hit at revisions 0/1/2, CODEMAP/API 947 and 24 existing dock/live-program/recording tests passed. Logical reserves only, not native process or RSS enforcement. |
| Final publication and CI | Audit isolated experiment + public docs diff, verify unchanged approved runtime, publish only on this branch and check CI at exact SHA. Existing CI protects PCL baseline; it does not run the isolated CAD benchmark or contract suite. No earlier run certifies the final commit. |

The real nethash/ERR procedure remains required before a later solver/netlib/parts change; it is not triggered or replaced by this documentation-only checkpoint.

## Future directions, not current implementation

The owner confirmed a specialized efficient renderer without Three.js, with its backend still under evaluation; future general kinematics/dynamics and robotics; AI-assisted acceleration with PINNs as a candidate; and time-scaled playback with independent simulation/presentation clocks, temporal zoom, pause/step/replay and synchronized results.

The full plan and map describe what existing engine infrastructure can be reused and where new contracts are needed. D025 confirms the engine will be developed jointly with the owner from the pinned 5.0.7 repo, with potential later enhancement by Fable and documented engineering questions. The [indicative architecture](CAD_PLAN_DETAILS.md#ενδεικτική-αρχιτεκτονική-για-συνεργασία-και-ενίσχυση) is a discussion aid. No CAD kernel, rendering backend, physics solver, timeline API or AI method is selected or implemented by T001.

## Next action and delivery

Verify T004 final remote SHA and CI. Next separately authorized task: CAD-T005, isolated native cylinder adapter with actual BRep validity/analytic comparison and native background process execution, only if that scope is approved. Keep SOL per owner unless explicitly changed. No implementation in PCL until (1) current engine next-steps/decisions/version handoff beyond 5.0.5 and coordination branch, and (2) actual privacy checker, instructions and required private inputs. Do not re-search old files or publish private material; no base upgrade/main write and no automatic T005. Fable optimization backlog is in CAD_KERNEL_EVALUATION, CAD_DOCUMENT_CONTRACT and CAD_WORKER_CONTRACT; no automatic delegation.

The branch README/index and CAD_NEXT_STEPS contain the continuation instructions. A final response must provide the real published SHA/run after CI. A document cannot contain its own resulting commit hash; do not create an endless chain of commits solely to record that same commit's CI.
