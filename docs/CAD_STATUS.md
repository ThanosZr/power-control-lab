# CAD: active handoff

Updated 2026-11-27; revision 0.14, CAD-S022. **Active T010, lab-cad-0.10.0-native-features.** Isolated exact revolve/union/subtract/intersect, transitive native recipes, atomic regeneration, history and retained viewport. Parent T009 exact `5490370c8cf7a4ae09ae87a4d0d9888c805a8e8d` / CI 45821459611, completed/success 4/4, dedicated T009 step success. Final T010 CI required on actual HEAD. No PCL integration; both private gates remain open. [Contract](CAD_NATIVE_FEATURES_CONTRACT.md).

## Scope and pinned state

- Task: CAD-T010 isolated native feature expansion (D037); SOL, no subagents.
- Repository: ThanosZr/power-control-lab.
- Branch: lab-cad-0.10.0-native-features; parent T009 `5490370c8cf7a4ae09ae87a4d0d9888c805a8e8d` / CI 45821459611, exact SHA and 4/4 verified.
- Approved engine source: **5.0.7**, dab82e5ff2e6da4bde09e4a38aab32edfffe6d51.
- Keep the approved base, main and engine branches unchanged. Do not integrate CAD runtime. Isolated WebGL2 viewport using actual native mesh only; no final GPU backend selection.
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
- CAD_SKETCH_CONTRACT and experiments/cad_t008/: standalone 2D sketch model, bounded algebraic solver, rank/DoF, transactional API and SVG demo; no production solver selection.
- CAD_FEATURE_HISTORY_CONTRACT and experiments/cad_t009/: isolated feature history, T008 bridge, exact native extrusion, retained GPU demo and regression tests; no final topology naming or integrated scheduler.
- CAD_NATIVE_FEATURES_CONTRACT and experiments/cad_t010/: native revolution/booleans, transitive regeneration, schema 2 and schema-1 document compatibility; no production BRep-handle caching or topology naming.

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
| 1af4de0fba3f2b20ffd4c16cb276df6b9323d9aa | Final T004 checkpoint, CI 45561734591 independently checked 4/4. |
| fb25e821419831a109db4b9e5a043e4a9aabad9d | T005 remote commit with byte-identical locally tested tree 07f2d1a9e9e6b24d5dcb074667bf085ca7bcd2b9; CI 45599503711 independently verified 25/11: completed/success, exact SHA, 4/4 jobs. API publication confirmed author/committer matched. |
| 68a465be4df460e7918fa0d849a0bddc8f931a8d | T006 certified, CI 45649705613 4/4. |
| ebf74a85cdef5d1e617412098c881956dfc8d599 | T007 certified, CI 45738308465 attempt 2, exact head, completed/success 4/4; dedicated T006/T007 success. Attempt 1 failed unchanged PCL speed_flow tutorial sampling (379ms >250ms); successful retry without threshold or engine changes. |
| 9abc985db1e6fa68c83f9bb4a8808afe2d6d3d56 | T008 certified, CI 45747371669, exact head, completed/success 4/4; dedicated T008 Node/browser success. |
| 5490370c8cf7a4ae09ae87a4d0d9888c805a8e8d | T009 certified at D036 documentation checkpoint, CI 45821459611, exact head, completed/success 4/4; dedicated T009 native/browser success. |

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
| Final publication and CI | Audit isolated experiment + public docs diff, verify unchanged approved runtime, publish only on this branch when publication gates are satisfied or explicitly scoped by the owner, and check CI at exact SHA. T006 adds a CAD-conditional viewport contract and real-browser smoke to the existing UI job; no earlier run certifies the final commit. |
| Later Opus/Fable review | Record compatibility, integration and performance issues for later independent review in the contract docs. SOL continues the isolated development; no delegation or claim of external review. The two actual private checks remain distinct obligations. |

The real nethash/ERR procedure remains required before a later solver/netlib/parts change; it is not triggered or replaced by this documentation-only checkpoint.

## Future directions, not current implementation

The owner confirmed a specialized efficient renderer without Three.js, with its backend still under evaluation; future general kinematics/dynamics and robotics; AI-assisted acceleration with PINNs as a candidate; and time-scaled playback with independent simulation/presentation clocks, temporal zoom, pause/step/replay and synchronized results.

The full plan and map describe what existing engine infrastructure can be reused and where new contracts are needed. D025 confirms the engine will be developed jointly with the owner from the pinned 5.0.7 repo, with potential later enhancement by Fable and documented engineering questions. The [indicative architecture](CAD_PLAN_DETAILS.md#ενδεικτική-αρχιτεκτονική-για-συνεργασία-και-ενίσχυση) is a discussion aid. No CAD kernel, rendering backend, physics solver, timeline API or AI method is selected or implemented by T001.

## Next action and delivery

Confirm actual T010 HEAD, four CI jobs and dedicated T010 native/browser step. Local Python 65/65 (35 preceding CAD + 6 T010 + 24 PCL), T006/T008 Node 20/20, CODEMAP/API 947 pass. Browser launch attempted; local Chromium wrapper has no executable, so browser pending CI. Proposed T011/C3 sweep/loft/general planes and feature references only after exact T010 certification and fresh authorization. Both private gates mandatory before PCL integration; no main/base change. Opus/Fable backlog in CAD_NATIVE_FEATURES_CONTRACT. D036 GPU-first multiphysics/Digital Twin/Motion plan remains active.

### T007 CI correction (26/11/2026)

Run 45731477841 / e8003d0 failed at T005 native + T007 initial build; 23/26 passed, unit and Octave green, package skipped. Pin CAD-only native dependencies, isolate in venv, retain native stderr, add actual import/demo checks and retain all tests. New exact HEAD/CI must be checked; no claimed pass.


## Active T011-A handoff (27/11/2026; supersedes previous next-action text)

T010 certified at 7341313f68bb75d688686e241d81b9e83367d128 / CI 45991092618, exact SHA, 4/4 success and dedicated native/browser PASS. T011 is authorized on lab-cad-0.11.0-sweep-loft, isolated only. T011-A is a partial native geometry checkpoint; see [CAD_SWEEP_LOFT_CONTRACT.md](CAD_SWEEP_LOFT_CONTRACT.md) for proof, limitations and remaining implementation. Do not start T012 until T011 is complete and certified. D036 and both private integration gates remain unchanged.
