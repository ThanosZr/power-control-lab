# CAD: active handoff

Updated 2026-11-23; documentation revision 0.4, final documentation checkpoint CAD-S011. Start with the [documentation index](CAD_INDEX.md), this file, [baseline](CAD_BASELINE.md), [integration map](CAD_INTEGRATION_MAP.md), and the active planning/decision files in this Git branch.

## Scope and pinned state

- Task: **CAD-T001 — documentation-only completion approved by the owner (D024)**, with SOL and no subagents. Closure takes effect once the final published SHA has successful CI. No new task is authorized.
- Repository: ThanosZr/power-control-lab.
- Branch: lab-cad-0.1.0-baseline.
- Approved engine source: **5.0.7**, dab82e5ff2e6da4bde09e4a38aab32edfffe6d51.
- Keep the approved base, main and engine branches unchanged. Do not start CAD-T002, choose a kernel or implement a CAD viewport here.
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

Update these existing Git files as the project evolves. Once their publication is verified at the remote SHA, tell the owner that repeated uploads of these public CAD docs to project attachments are unnecessary. A saved local file or chat artifact does not prove an attachment changed. Ask for a specific private file only when it is still required and absent.

**D023 — Git-first, no repeated file hunt.** The owner expressly instructed that each next chat must already have what it needs. Maintain every publishable prerequisite and precise public source reference in the canonical Git package. Do not repeat previous-chat, Library, old ZIP/workspace or recovered-draft searches at each handoff. The two outstanding private material sets were rechecked in supplied files, public Git, available file search and previous CAD conversations with no actual originals found. Under D024, they are blockers before implementation, not before documentation-only T001 closure. Do not keep searching for them on every restart or publish private material.

## Version branches

- Every new CAD software version starts on a new lab-cad-<version>-<topic> branch.
- Intermediate commits of the same version stay on that version's branch.
- Documentation revision 0.4 does not itself start a new software version; this remains the existing baseline branch.
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
| CAD-S011 | Owner-approved documentation-only closure (D024), approved 5.0.7 engine development direction and indicative review architecture (D025). Obtain its exact SHA and CI from Git/delivery. |

The original CAD-S007 map/baseline, S007 version entry and all five revision 0.3 planning files were recovered from earlier generated files on 2026-11-23. An older S006 checkpoint was read too. Do not request those originals again, relabel the reconstruction as recovery or add old timings to current test counts. The separate old patch remained unavailable, but is no longer needed to recover the two documents already read.

## Publication scope and unresolved gates

The original owner's exception covered only CAD_BASELINE, CAD_INTEGRATION_MAP and CAD_STATUS. **D020–D021 extend publication to the complete public CAD planning package and the CAD branch README; D024 expressly permits documentation-only T001 closure after successful CI, while retaining both private gates before any CAD implementation.** This does not approve private input publication, runtime changes without their checks, main changes or a claim that either private gate passed.

| Gate / evidence | Current status and next action |
| --- | --- |
| Original CAD-S007/drafts | Recovered and source-reconciled. Resolved; keep provenance/history distinct. |
| Current engine handoff | Still missing; required before any CAD implementation per D024. The available decisions-14 ends at 5.0.5. Public `lab-5.0.10` was inspected read-only for coordination; it does not establish the private handoff. |
| Actual privacy procedure | Checker, instructions and private inputs still missing and not executed; required before any CAD implementation per D024. Do not invent a substitute or claim a pass. |
| Local baseline | Initial full run: 1,167 tests, two missing-Pyodide setup errors and 11 skips; affected control/stream rerun: 19 passed. This continuation: codemap/API/weights/512-value verification passed; 24 dock/program/recording tests passed. Separate results in CAD_BASELINE. |
| Local UI / Octave | Browser launch blocked by environment socket permissions before app assertions; Octave absent. No local CAD timing or hardware-GPU result claimed. |
| Source integrity | Verified at incoming f91ac3c: 437 approved tracked files, 447 CAD tracked files; only approved README differs from the original 437, and ten CAD docs are added. The other 436 original files, including runtime and workflow, must remain identical. |
| Final publication and CI | Audit the final documentation-only diff, publish on this branch, verify remote SHA, then wait for a complete successful CI at that exact SHA. No older run certifies it. |

The real nethash/ERR procedure remains required before a later solver/netlib/parts change; it is not triggered or replaced by this documentation-only checkpoint.

## Future directions, not current implementation

The owner confirmed a specialized efficient renderer without Three.js, with its backend still under evaluation; future general kinematics/dynamics and robotics; AI-assisted acceleration with PINNs as a candidate; and time-scaled playback with independent simulation/presentation clocks, temporal zoom, pause/step/replay and synchronized results.

The full plan and map describe what existing engine infrastructure can be reused and where new contracts are needed. D025 confirms the engine will be developed jointly with the owner from the pinned 5.0.7 repo, with potential later enhancement by Fable and documented engineering questions. The [indicative architecture](CAD_PLAN_DETAILS.md#ενδεικτική-αρχιτεκτονική-για-συνεργασία-και-ενίσχυση) is a discussion aid. No CAD kernel, rendering backend, physics solver, timeline API or AI method is selected or implemented by T001.

## Next action and delivery

Verify publication of CAD-S011 and successful CI at its exact SHA; then CAD-T001 is closed as documentation-only. Stop there. No project reupload is needed for the public plan, and do not repeat the recovered-draft/private-file searches. A later explicitly authorized implementation requires (1) current engine next-steps/decisions/version handoff beyond 5.0.5, including the intended coordination branch, and (2) the actual privacy checker, instructions and required private inputs. Do not publish private material or substitute public Git observations for these gates. Keep the approved source 5.0.7; later engine snapshots are coordination evidence only. Do not start CAD-T002 until explicitly directed.

The branch README/index and CAD_NEXT_STEPS contain the continuation instructions. A final response must provide the real published SHA/run after CI. A document cannot contain its own resulting commit hash; do not create an endless chain of commits solely to record that same commit's CI.
