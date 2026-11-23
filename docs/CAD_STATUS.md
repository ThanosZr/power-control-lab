# CAD: active handoff

Updated 2026-11-23; documentation revision 0.4. Start with the [documentation index](CAD_INDEX.md), this file, [baseline](CAD_BASELINE.md), [integration map](CAD_INTEGRATION_MAP.md), and the active planning/decision files in this Git branch.

## Scope and pinned state

- Active task: **CAD-T001**, in progress, with SOL and no subagents.
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
| This expanded documentation checkpoint | Five recovered planning docs migrated to canonical Git paths and updated to 0.4; detailed plan/index added; root README changed to the CAD tool's purpose. Get the resulting SHA and its own CI from Git/delivery. |

The original CAD-S007 map/baseline, S007 version entry and all five revision 0.3 planning files were recovered from earlier generated files on 2026-11-23. An older S006 checkpoint was read too. Do not request those originals again, relabel the reconstruction as recovery or add old timings to current test counts. The separate old patch remained unavailable, but is no longer needed to recover the two documents already read.

## Publication scope and unresolved gates

The original owner's exception covered only CAD_BASELINE, CAD_INTEGRATION_MAP and CAD_STATUS. **The later explicit instructions D020–D021 extend publication to the complete public CAD planning package and the CAD branch README.** This permits the present documentation checkpoint despite the still-missing private procedure. It does not approve private input publication, runtime changes without their checks, main changes or task closure with unresolved required gates.

| Gate / evidence | Current status and next action |
| --- | --- |
| Original CAD-S007/drafts | Recovered and source-reconciled. Resolved; keep provenance/history distinct. |
| Current engine handoff | Still missing: active next-steps, latest decisions and latest version handoff. The available decisions-14 ends at 5.0.5. Public code/roadmap do not establish missing private decisions. |
| Actual privacy procedure | Checker, instructions and private inputs still missing and not executed. Keep this pending; do not invent a substitute or claim a pass. |
| Local baseline | Initial full run: 1,167 tests, two missing-Pyodide setup errors and 11 skips; affected control/stream rerun: 19 passed. This continuation: codemap/API/weights/512-value verification passed; 24 dock/program/recording tests passed. Separate results in CAD_BASELINE. |
| Local UI / Octave | Browser launch blocked by environment socket permissions before app assertions; Octave absent. No local CAD timing or hardware-GPU result claimed. |
| Source integrity | At f57d02f all 437 original tracked files matched the approved base. In this expanded checkpoint the root README intentionally changes as documentation; the other 436 original files, including runtime and workflow, must remain identical. |
| Final publication and CI | Audit the final documentation-only diff, publish on this branch, verify remote SHA, then wait for a complete successful CI at that exact SHA. No older run certifies it. |

The real nethash/ERR procedure remains required before a later solver/netlib/parts change; it is not triggered or replaced by this documentation-only checkpoint.

## Future directions, not current implementation

The owner confirmed a specialized efficient renderer without Three.js, with its backend still under evaluation; future general kinematics/dynamics and robotics; AI-assisted acceleration with PINNs as a candidate; and time-scaled playback with independent simulation/presentation clocks, temporal zoom, pause/step/replay and synchronized results.

The full plan and map describe what existing engine infrastructure can be reused and where new contracts are needed. No CAD kernel, rendering backend, physics solver, timeline API or AI method is selected or implemented by T001.

## Next action and delivery

Finish the public documentation checkpoint, verify the final SHA/CI and report that the active CAD plan is available in Git without another project upload. Then continue only CAD-T001 when the two outstanding private material sets become available. Read existing private project material before requesting it. Keep task closure pending while the required engine/privacy gates remain unresolved.

The branch README/index and CAD_NEXT_STEPS contain the continuation instructions. A final response must provide the real published SHA/run after CI. A document cannot contain its own resulting commit hash; do not create an endless chain of commits solely to record that same commit's CI.
