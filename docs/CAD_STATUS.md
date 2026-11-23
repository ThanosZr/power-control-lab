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

The three existing source/main/CAD CI runs are recorded in `CAD_BASELINE.md`. They are all for the engine source and do not certify new commits automatically.

## Version branches

Owner-confirmed policy, 2026-11-23:

- Every new CAD version starts on a new branch named `lab-cad-<cad-version>-<topic>`, following the active plan.
- Intermediate commits and pushes of the same CAD version stay on that version's existing branch. A documentation update within the current version does not itself start a new software version or require another branch.
- Each version's final delivered commit requires the appropriate local checks and successful GitHub CI at that exact SHA. An older commit's green CI does not cover a later commit.
- Changes to `main` require an explicit owner instruction covering the specific change. Permission to publish a CAD branch is not permission to merge or push to `main`.
- Record the source branch and approved commit when starting the next version. Preserve the existing CAD work and the owner-approved engine baseline; do not automatically adopt a newer `main` or engine version.

The current work remains CAD-T001 on `lab-cad-0.1.0-baseline`. This policy does not start CAD-T002 or authorize a version/base change.

## What this checkpoint contains

Freshly reconstructed, source-grounded baseline and integration documents. Existing UI performance techniques and proposed CAD behavior are distinguished. No tracked application code or dependency manifest is changed. Original CAD-S007 drafts have not been recovered and are not represented as completed work.

Owner decision, 2026-11-22: publish only `docs/CAD_BASELINE.md`, `docs/CAD_INTEGRATION_MAP.md` and `docs/CAD_STATUS.md`, including their check-result updates, despite the unavailable original private checking procedure. This exception is specific to the reviewed documentation checkpoint. It does not approve runtime changes, a different engine baseline, CAD-T002, a `main` change or any later code publication without its required checks.

## Outstanding inputs and gates

| Item | Observed status | Required action |
| --- | --- | --- |
| Original CAD-S007/drafts | Absent from the approved Git tree and the six supplied project source files | Recover from an identified project source or explicitly supersede with this reconstruction; do not invent their contents or reuse unverified measurements. |
| Current engine handoff | Public engine code docs at the approved source are available. The supplied engineering decision file stops at 5.0.5 | Supply/read the active next-steps, decisions and version handoff; public architecture/roadmap do not establish the missing private decisions. |
| Privacy checker and private inputs | Not supplied and not found in the approved tree. Owner approved the three-file documentation exception above | Keep the real procedure pending. Do not publish private input files, invent a replacement checker or claim this check passed. The exception does not carry over to code changes. |
| Local baseline | Code map, API, inverse-model weights and 512-value verification passed. Full discovery: 1,167 tests, 2 missing-Pyodide setup errors, 11 skips. Affected control/stream rerun: 19 tests, all passed | Preserve both outcomes. Nine Octave tests and one desktop-window test remain untested locally; the skipped Pyodide continuation test passed in the rerun. See `CAD_BASELINE.md`. |
| Published CAD checkpoint CI | `5660e9bc499d2ec12bb9898724f8b22953fa2cf8`: [45062057720](https://github.com/ThanosZr/power-control-lab/actions/runs/45062057720), success in Python/Node, Playwright, Octave and packaging. Unit summary: 1,174 tests, 11 skips; verification: 512/512 within tolerance | This result covers that checkpoint only. After a later allowed push, wait actively for CI whose `head_sha` equals the new published CAD HEAD. |

## Commit and CI discipline

Prepare reviewable checkpoints and commit on the CAD branch. Before committing, reread the active CAD plan/decisions and the available engine handoff, recording any missing required material. A local commit is not a publication and is not visible to the next session through remote Git until pushed.

Before each push, satisfy the actual privacy requirement or obtain a specific owner decision addressing a missing prerequisite. Restrict the proposed checkpoint to the reviewed paths and inspect the final diff. No old approval to publish engine changes applies to new CAD changes.

After pushing, inspect the remote branch and identify the workflow run by **exact SHA**, branch and event. Poll its current state with individual waits no longer than 60 seconds and concise progress updates. Do not finish with a promised future check. A failed/cancelled CI requires its own diagnosis; a later documentation commit requires CI for that later SHA.

## Next action

The reviewed documentation checkpoint has been published and its CI passed, as recorded above. Keep this version's documentation updates on the existing CAD branch and verify the new final SHA's CI after any allowed push. Query the latest remote HEAD's run rather than assuming the recorded run covers it. Obtain the outstanding current engine handoff and actual private checking material before closing CAD-T001 or publishing code. CAD-T001 remains open while its required gates are unresolved.
