# CAD-T005 — isolated native cylinder adapter (0.5.0)

D030: real geometry, no PCL runtime integration. `experiments/cad_t005/` composes the T003 shaft and T004 coordinator without modifying either. Heavy build123d/OCCT import and geometry run in a separate Python child per cache miss. The coordinator thread transports bounded JSON, observes cancellation and reaps the child. Fixed module, no shell. A 45 s deadline and cancellation kill the owned child; reservation remains until exit. No general sandbox or OS RAM enforcement is claimed.

One resolved cylinder (positive-Z axis, base at `origin_mm`). Require native BRep validity and one solid. Compare volume, centroid and centroidal unit-density inertia to independent analytic cylinder formulas (relative 1e-8, center absolute 1e-6 mm; off-diagonal inertia tolerance scales with principal moments). BRep tessellation 0.05 mm / 0.1 rad, finite coordinates, valid indices, signed-volume relative error <0.5%. BRep is authoritative, not retained across jobs; mesh is not exact CAD exchange. Versioned result includes units, stable feature ID, kernel version and arrays; T004 completion supplies revision/session. Cached PID refers to the original build.

```sh
python -m pip install 'build123d==0.10.0' 'cadquery-ocp==7.8.1.1.post1'
python -m unittest experiments.cad_t003.test_document experiments.cad_t004.test_worker experiments.cad_t005.test_native -v
python -m experiments.cad_t005.demo --mesh shaft.json
```

Local Linux/Python 3.12, build123d 0.10.0/OCP 7.8.1.1.post1: 25/25 isolated tests passed. Default 20 × 100 mm cylinder: 31415.926535897932 mm³, centroid z=50 mm, 506 vertices/500 triangles, mesh relative volume error 0.000414394. One cold process demo: 2416 ms wall and 29617 JSON bytes (not a distribution/SLA). Revision edits and undo cache, cancellation/stale rejection, separate PID tested. CODEMAP/API 947 PASS. Existing four-job PCL CI unchanged: it tests pinned runtime, not isolated CAD suite. No fresh cross-platform packaging claim.

## Fable optimization review (not delegated)

- Persistent spawn workers with explicit OCCT ownership, timed termination/restart, bounded binary transport; compare cold/warm p50/p95 including IPC, import and peak RSS. Cache exact and display geometry separately.
- Measure resident/peak memory and enforce shared solver/geometry budgets; test crash, cancellation inside OCCT and Windows packaging. Current thread-count environment advisory, not OS cap.
- Stable topology naming, face-to-triangle mapping, multi-feature bodies and STEP round-trip are future contracts. Preserve analytic invariants.
- Measure mesh packing, LOD and transfer. Keep document semantics independent of wrappers and GPU backend.

Both private integration gates remain outstanding; no solver/netlib/parts changes or nethash claim.
