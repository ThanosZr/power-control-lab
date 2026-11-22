# CAD: active handoff

Updated 2026-11-22. Read this file, `CAD_BASELINE.md` and `CAD_INTEGRATION_MAP.md` at the start of the next CAD session, together with the supplied project instructions and current engine handoff.

## Scope and pinned state

- Active task: **CAD-T001**, in progress.
- Repository: `ThanosZr/power-control-lab`.
- Branch: `lab-cad-0.1.0-baseline`.
- Approved engine source: **5.0.7**, `dab82e5ff2e6da4bde09e4a38aab32edfffe6d51`.
- Do not advance the baseline, change `main`, start CAD-T002, choose a kernel or implement a CAD viewport in this task.
- Git author and committer: `Thanos Zr`, `85298380+ThanosZr@users.noreply.github.com`.
- The next session obtains the latest published CAD HEAD from this branch; it must distinguish that HEAD from the approved engine source above.

The three existing source/main/CAD CI runs are recorded in `CAD_BASELINE.md`. They are all for the engine source and do not certify new commits automatically.

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
| Final CAD commit CI | No new published CAD commit at the start of this session | After an allowed push, wait actively for the run whose `head_sha` equals the final published CAD HEAD. |

## Commit and CI discipline

Prepare reviewable checkpoints and commit on the CAD branch. Before committing, reread the active CAD plan/decisions and the available engine handoff, recording any missing required material. A local commit is not a publication and is not visible to the next session through remote Git until pushed.

Before each push, satisfy the actual privacy requirement or obtain a specific owner decision addressing a missing prerequisite. Restrict the proposed checkpoint to the reviewed paths and inspect the final diff. No old approval to publish engine changes applies to new CAD changes.

After pushing, inspect the remote branch and identify the workflow run by **exact SHA**, branch and event. Poll its current state with individual waits no longer than 60 seconds and concise progress updates. Do not finish with a promised future check. A failed/cancelled CI requires its own diagnosis; a later documentation commit requires CI for that later SHA.

## Next action

Publish the reviewed documentation checkpoint only to the CAD branch under the recorded owner exception. Then wait for the final SHA's CI and report that exact SHA and run. CI is verified after publication; query the latest remote HEAD's run rather than assuming an older recorded run covers it. Obtain the outstanding current engine handoff and actual private checking material before closing CAD-T001 or publishing code. CAD-T001 remains open while its required gates are unresolved.
