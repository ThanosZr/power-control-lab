# CAD: active handoff

Updated 2026-11-23. Read this file, `CAD_BASELINE.md` and `CAD_INTEGRATION_MAP.md` at the start of the next CAD session, together with the supplied project instructions and current engine handoff.

## Scope and pinned state

- Active task: **CAD-T001**, in progress.
- Repository: `ThanosZr/power-control-lab`.
- Branch: `lab-cad-0.1.0-baseline`.
- Approved engine source: **5.0.7**, `dab82e5ff2e6da4bde09e4a38aab32edfffe6d51`.
- Do not advance the baseline, change `main`, start CAD-T002, choose a kernel or implement a CAD viewport in this task.
- Git author and committer: `Thanos Zr`, `85298380+ThanosZr@users.noreply.github.com`.
- The next session obtains the latest published CAD HEAD from this branch; it must distinguish that HEAD from the approved engine source above.

The three source/main/CAD baseline runs and subsequent published-checkpoint evidence are recorded in `CAD_BASELINE.md`. The incoming HEAD in this continuation was `c169ffc8121013f0ed9837f983b940e66fe73a1a`, with [CI 45093234600](https://github.com/ThanosZr/power-control-lab/actions/runs/45093234600) successful in all four jobs. A successful run covers only its exact SHA.

## Version branches

Owner-confirmed policy, 2026-11-23:

- Every new CAD version starts on a new branch named `lab-cad-<cad-version>-<topic>`, following the active plan.
- Intermediate commits and pushes of the same CAD version stay on that version's existing branch. A documentation update within the current version does not itself start a new software version or require another branch.
- Each version's final delivered commit requires the appropriate local checks and successful GitHub CI at that exact SHA. An older commit's green CI does not cover a later commit.
- Changes to `main` require an explicit owner instruction covering the specific change. Permission to publish a CAD branch is not permission to merge or push to `main`.
- Record the source branch and approved commit when starting the next version. Preserve the existing CAD work and the owner-approved engine baseline; do not automatically adopt a newer `main` or engine version.

The current work remains CAD-T001 on `lab-cad-0.1.0-baseline`. This policy does not start CAD-T002 or authorize a version/base change.

## What this checkpoint contains

The published `5660e9b` checkpoint contains freshly reconstructed, source-grounded baseline and integration documents. Existing UI performance techniques and proposed CAD behavior are distinguished. No tracked application code or dependency manifest is changed.

In this continuation, the owner requested review of files generated in earlier conversations. The actual CAD-S007 map/baseline and revision 0.3 planning documents were found and read, along with an earlier CAD-S006 checkpoint. Recovery of those documents is now confirmed separately from the published reconstruction. Their source findings were reconciled with the pinned code; historical test timings and unpublished-HEAD statements were not relabeled as current results. See the recovery and validation record in `CAD_BASELINE.md`.

Owner decision, 2026-11-22: publish only `docs/CAD_BASELINE.md`, `docs/CAD_INTEGRATION_MAP.md` and `docs/CAD_STATUS.md`, including their check-result updates, despite the unavailable original private checking procedure. This exception is specific to the reviewed documentation checkpoint. It does not approve runtime changes, a different engine baseline, CAD-T002, a `main` change or any later code publication without its required checks.

## Outstanding inputs and gates

| Item | Observed status | Required action |
| --- | --- | --- |
| Original CAD-S007/drafts | Recovered and read from earlier generated files on 2026-11-23: original map, baseline and CAD-S007 version entry; all five planning documents at revision 0.3 | Recovery gate resolved. Preserve provenance and historical results; do not ask for these drafts again. The old patch remains unavailable, but is no longer needed to recover these two original documents. |
| Current engine handoff | Public engine code docs at the approved source are available. The supplied engineering decision file stops at 5.0.5 | Supply/read the active next-steps, decisions and version handoff; public architecture/roadmap do not establish the missing private decisions. |
| Privacy checker and private inputs | Not supplied and not found in the approved tree. Owner approved the three-file documentation exception above | Keep the real procedure pending. Do not publish private input files, invent a replacement checker or claim this check passed. The exception does not carry over to code changes. |
| Local baseline | Initial full discovery: 1,167 tests, 2 missing-Pyodide setup errors, 11 skips; affected control/stream rerun: 19 passed. This continuation: codemap/API/weights/512-value verification passed; 24 dock/program/recording tests passed | Preserve the separate runs. Local browser launch is still blocked by the environment and Octave is absent. No new full local suite, CAD performance or hardware-GPU result is claimed. |
| Published CAD checkpoint CI | `c169ffc8121013f0ed9837f983b940e66fe73a1a`: [45093234600](https://github.com/ThanosZr/power-control-lab/actions/runs/45093234600), success in Python/Node, Playwright, Octave and packaging, rechecked directly in this continuation | This result covers the incoming HEAD only. After this documentation continuation is pushed, wait actively for CI whose `head_sha` equals the new published CAD HEAD and report that SHA/run together. |

## Current directions and project attachments

Owner-confirmed directions, 2026-11-23: a specialized efficient renderer without Three.js (backend pending evaluation); later general kinematics/dynamics and robotics; AI-assisted acceleration with PINNs as a candidate; and time-scaled playback with independent simulation/presentation times, temporal zoom, pause/step/replay and synchronized results. These are future work only. The integration map records the existing mechanisms to reuse and their limits. The old Three.js proposal is superseded; no rendering backend or geometry kernel is selected.

The owner's current instructions and this Git handoff govern the present state. Historical project files may still say that no CAD commit exists or suggest Three.js. The five files attached at the start of this session are revision 0.2; the recovered revision 0.3 files are newer historical planning sources. Neither revision describes this newly published continuation automatically.

For project continuity, keep the latest `docs/CAD_STATUS.md`, `docs/CAD_BASELINE.md` and `docs/CAD_INTEGRATION_MAP.md` available from the CAD branch, plus the five revision 0.3 planning documents. The generated files needing addition/replacement in the project are named explicitly in the delivery. Active engine next-steps/decisions/versions and the real checker/instructions/private inputs are still needed privately; never publish those inputs to the public repository. Adding or linking a file in a chat is not confirmation that it has become a project attachment.

## Commit and CI discipline

Prepare reviewable checkpoints and commit on the CAD branch. Before committing, reread the active CAD plan/decisions and the available engine handoff, recording any missing required material. A local commit is not a publication and is not visible to the next session through remote Git until pushed.

Before each push, satisfy the actual privacy requirement or obtain a specific owner decision addressing a missing prerequisite. Restrict the proposed checkpoint to the reviewed paths and inspect the final diff. No old approval to publish engine changes applies to new CAD changes.

After pushing, inspect the remote branch and identify the workflow run by **exact SHA**, branch and event. Poll its current state with individual waits no longer than 60 seconds and concise progress updates. Do not finish with a promised future check. A failed/cancelled CI requires its own diagnosis; a later documentation commit requires CI for that later SHA.

## Next action

Complete this allowed three-file documentation checkpoint on the current version's branch, verify the final remote SHA and wait for its own CI. Then continue only CAD-T001 when the active engine handoff and actual private checking material are available. Do not repeat the now-completed CAD-S007 recovery or restart kernel research to work around the missing inputs. CAD-T001 remains open while its two remaining required input gates are unresolved.

Suggested next-session handoff (replace the publication placeholders with the exact result reported after CI):

```text
Continue only CAD-T001 with SOL and no subagents in ThanosZr/power-control-lab.
Branch: lab-cad-0.1.0-baseline. Final published HEAD and CI: use the exact SHA/run from the last delivery and recheck the remote ref.
Approved engine: 5.0.7 at dab82e5ff2e6da4bde09e4a38aab32edfffe6d51; never advance it automatically.
Read docs/CAD_BASELINE.md, docs/CAD_INTEGRATION_MAP.md, docs/CAD_STATUS.md and project files first.
The original CAD-S007 drafts and revision 0.3 planning files have been recovered and reconciled; do not describe the older reconstruction as the recovered originals or ask for those drafts again.
Still missing: active engine next-steps/decisions/versions and the actual privacy checker with private inputs/instructions. Keep CAD-T001 open until resolved; do not publish code under the three-file documentation exception.
Future directions: specialized renderer without Three.js, later motion/robotics, AI/PINN evaluation and independent simulation/presentation times with synchronized playback. No implementation of those directions now.
Stay on this branch for this version; each new CAD version needs lab-cad-<version>-<topic>. No main/engine writes, base upgrade or CAD-T002.
```
