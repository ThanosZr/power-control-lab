# CAD-T010 — Native Revolve & Boolean Features (0.10.0)

CAD-D037, 27/11/2026. Parent `5490370c8cf7a4ae09ae87a4d0d9888c805a8e8d`, tree `adf401eba2f32729dc18b7a388e02e1012463073`, [CI 45821459611](https://github.com/ThanosZr/power-control-lab/actions/runs/45821459611), exact SHA, completed/success 4/4 and dedicated T009 native/browser step passed. Isolated C3 reference; engine 5.0.7 and both private PCL integration gates unchanged.

## Feature document schema 2

T010 extends the T009 transaction/history contract without changing the T009 schema or its solver. Existing schema-1 documents can be opened and regenerated in T010; new features require schema 2. Millimetres, at most eight features, stable feature IDs, earlier references only, one chosen solid output.

| Operation | Fields beyond `id,op` | Exact kernel operation / limits |
| --- | --- | --- |
| sketch | model | Actual T008 local fully constrained sketch |
| extrude | profile, depth_mm | XY profile, positive Z, 0.1–1000 mm |
| revolve | profile, angle_deg | XY cross-section, positive X side of Y axis, 1–360 degrees, native OCCT revolution |
| union / subtract / intersect | left, right | Earlier distinct solid IDs; exact BRep fuse/cut/common operations |

Profiles use the T009 single-loop/circle/optional interior holes envelope. For revolution the entire section must lie strictly away from the rotation axis. Axis selection, sketch planes/transforms and profiles touching/crossing the axis are later scope. Only one valid nonzero-volume solid per operation is accepted; empty, disjoint multi-body and lower-dimensional results are errors, not silently discarded. Disjoint subtract may be a valid unchanged solid. No fuzzy tolerance adjustment. Primitive volume checked independently against profile area × depth or swept first radial moment × angle; booleans checked for valid BRep, strictly positive volume and set-theoretic volume bounds. Tests compare exact analytical overlap volumes, not mesh volume. Arbitrary topological naming/subshape references, multi-body output and tolerance healing remain open.

## Regeneration and transaction boundaries

`experiments/cad_t010/history.py` extends the shared optimistic T009 History implementation using explicit validation/regeneration hooks. Canonical keys include transitive solved native plans. Changing a precursor invalidates dependent features; disjoint unchanged features reuse committed results. Each changed solid has its own bounded native process, which replays its transitive recipe once per unique ancestor inside that child (no mesh input, no serialized native handle). This is incremental result/cache reuse, **not yet incremental native BRep handle reuse across processes**. Stable feature IDs are retained; no stable face/edge IDs claimed. Atomic commit/rollback, stale revision rejection, deadlines, cooperative cancellation, bounded undo/redo, definitions-only save/open and limits follow T009. Resolved native request max 64 KiB; result max 512 KiB, fixed tessellation, eight features, sixty-second total regeneration deadline. Worker startup and repeated ancestor replay must be profiled before production usage.

```python
from experiments.cad_t010.history import History
h = History()
s = h.snapshot()
s['document']['features'][4]['op'] = 'union'
t = h.apply(s['document'], s['revision'])
print(t['regeneration'], t['results']['result']['volume_mm3'])
```

Default example: two concentric annular cylinders formed by revolving 10–30 mm radius × 20 mm height and 20–35 mm radius × 10 mm height, with the second vertically centered in the first. Exact volumes: base 16000π, cutter 8250π, intersection 5000π, subtract 11000π, union 19250π mm³. Half-angle base gives subtract 5500π mm³. Analytical expectations are verified by real native tests, not measured speed claims.

## Demo and tests

`python -m experiments.cad_t010.server` (default port 8770) reuses the bounded T009 single-owner loopback command server and retained WebGL2 viewport. Edit the angle and operation, inspect dependency tree and exact volume; edit JSON for arbitrary supported chains; undo/redo/save/open. Failed transactions preserve the last valid mesh. Camera manipulation retains uploaded buffers. GPU graphics only; no GPU BRep solve, physics, or rendering benchmark claim. No Three.js.

- `python -m unittest experiments.cad_t010.test_features -v`: real OCCT analytic volumes, three Boolean variants, partial/full angle, transitive and independent reuse, invalid axis/multisolid/empty rollback, schema-1 open, extrude union, stale/cancel, undo/redo/open.
- `node experiments/cad_t010/test_browser.cjs`: real GUI/native commands, dependency reuse, volume, error rollback, history, zoom without re-upload and screenshot. Local Chromium wrapper exists but actual executable is missing; dedicated CI browser verification required. Existing T006–T009 tests retained; dedicated additive T010 UI-job step.

Local executed verification (27/11): 6/6 T010 native tests; 35/35 previous isolated Python tests (T003/T004/T005/T007/T009); 24/24 PCL dock/live-program/recording; 20/20 T006 viewport and T008 sketch Node tests; CODEMAP/API 947 pass. Local browser launch failed because `/usr/lib/chromium/chromium` is absent, not a test pass. GitHub CI at the new exact SHA required.

## Opus/Fable review and future work (not delegated)

- Opus: unify feature/body/document and subshape identity with T003/T008/T009. Formalize arbitrary planes/axes, placements, topology naming and OCCT boolean history (Generated/Modified/IsDeleted) before downstream face references; normalize multi-body and empty-result semantics, support migration. STEP UI exchange/transforms and PCL integration remain separate. Consider next C3 slice sweep/loft and robust feature references after exact T010 CI and owner approval.
- Fable: benchmark persistent native process with exact BRep handles/serialized artifacts, dependency hash and minimal native dirty propagation, robust boolean tolerances and near-tangent/degenerate cases. Profile peak memory/cache/IPC, tessellation, retained GPU buffer lifecycle, concurrent scheduler and real hardware. Compare full replay against incremental kernel handle reuse. No production performance improvement claimed; GPU-first multiphysics objective D036 remains planned.
