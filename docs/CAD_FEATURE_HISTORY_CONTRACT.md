# CAD-T009 — Feature History & Native Extrusion (0.9.0)

CAD-D035, 26/11/2026. Parent T008 `9abc985db1e6fa68c83f9bb4a8808afe2d6d3d56`, [CI 45747371669](https://github.com/ThanosZr/power-control-lab/actions/runs/45747371669): exact branch/SHA, completed/success, all four jobs and dedicated T008 Node/browser step successful. Engine 5.0.7 pinned; both private gates remain open. No PCL integration.

## Isolated document contract

`experiments/cad_t009/history.py` owns a schema-1 definition document in mm: `{schema,units,features,output}` with stable feature IDs and an ordered dependency DAG. At most eight features, earlier references only, unique IDs, output must be an extrusion. Supported operations:

| Operation | Fields besides `id,op` | Result |
| --- | --- | --- |
| `sketch` | `model`: T008 schema | Canonical solved sketch and diagnostics from the actual T008 JS solver in Node; requires local DoF=0. |
| `extrude` | `profile`: earlier sketch ID, `depth_mm`: 0.1–1000 | Exact OCCT planar face and positive-Z prism; BRep validation, volume, center, display mesh. |

Separate definitions, resolved state and display mesh; no topology naming guarantee beyond stable feature IDs. Multiple independent extrusions supported, one selected output displayed; no union, subtract, face references, sketch planes other than XY or multibody assembly yet. The profile must be a single closed shared-point line loop (convex or concave) with zero to four strictly interior, nonintersecting circular holes, or a single circle. Coincident but distinct endpoint IDs do not implicitly weld. Reject open/disconnected/self-touching loops, touching/intersecting holes, areas ≤1e-6 mm², unsupported sketches and failed solves. Fully constrained means local T008 rank, not global uniqueness. Native `Face` and `Solid.extrude` use build123d/OCCT and `BRepCheck_Analyzer`; area/volume validated against shoelace minus exact circle areas to relative 1e-8 or absolute 1e-6; no mesh-volume claim. Tessellation is solely display geometry.

~~~python
from experiments.cad_t009.history import History
h = History()                    # Rectangle 80 × 45 mm, hole radius 10 mm, depth 12 mm
s = h.snapshot()
doc = s['document']
doc['features'][1]['depth_mm'] = 20
new = h.apply(doc, s['revision']) # Only extrusion rebuilt, sketch reused
print(new['regeneration'], new['results']['plate']['volume_mm3'])
h.undo(new['revision'])
~~~

## Transaction and resource boundaries

- All candidates validated and rebuilt before committing document, results, cache, undo/redo together. Error identifies failed feature; stale revisions, native/solver errors, cancelled candidates and invalid graph leave exact committed snapshot intact. Recheck revision/cancel under lock at publication. Cancellation is cooperative at the commit boundary (a commit already published is not reversible by cancellation). Child processes killed/reaped on cancellation or timeout. No production session/job scheduler yet; caller must serialize or bound concurrent operations. Demo server is single-owner and loopback only.
- Canonical JSON input keys and solved upstream geometry control reuse; only unchanged results from the currently committed document reused. Cache is bounded by eight results, no persistent/distributed cache or kernel handle retention; process/kernel version and tessellation tolerance fixed for lifetime. A fresh open deliberately rebuilds all results, clears undo/redo, increments revision. At most 12 undo and redo definitions; no mesh history persisted. Save JSON stores definitions only; no file-system write route. No-op edit retains revision and state. Reference envelope: 64 KiB document and per-child request, 512 KiB per-child response, 60 s regeneration deadline; each process inherits single-thread numerical-library limits. Not an RSS/OS resource guarantee; native startup per changed feature is expensive.
- Native result includes feature ID, version and exact kernel metadata, area, volume, center and tessellation. The isolated T006 viewport accepts `native-extrusion-mesh` v1 in addition to `native-cylinder-mesh`; retained GPU buffers stay unchanged on camera motion and failed transactions. No Three.js.

## Run and checks

Use the existing isolated CAD-only requirements `experiments/cad_t007/requirements-native.txt`, Python and Node. `python -m experiments.cad_t009.server` opens `http://127.0.0.1:8769/experiments/cad_t009/`. Edit width/depth or whole JSON document; inspect per-feature rebuilt/reused status, exact volume and native viewport, undo/redo, save/open. Example volume 39,430.08881569225 mm³. The same Python History API drives the GUI; T008 solver not reimplemented.

`python -m unittest experiments.cad_t009.test_history -v` exercises real native plate/circle/concave polygon, analytical volume, upstream rebuild, independent reuse, failed native/constraint/graph edit, stale/cancelled result, undo/redo and serialized round-trip. Local regression: 59/59 Python (26 previous CAD + 9 T009 + 24 existing PCL), 20/20 Node (T006 and T008), CODEMAP/API 947 pass. `node experiments/cad_t009/test_browser.cjs` tests real edits, rollback without GPU upload, history and save/open, retained zoom, screenshot. Local Chromium distribution missing its executable; only CI can certify browser. Dedicated additive CAD-only CI step on the existing UI job; no threshold, PCL runtime or dependency changes. Exact final SHA and four-job success required.

## Opus/Fable independent review backlog (not delegated)

- Opus: consolidate schemas T003/T008/T009; feature/body vs subshape IDs and persistent topology naming, profile plane/units migration, sketch dependency edges plus document session ownership, document/UI transaction lifecycle and explicit failure visualization. Evolve native kernel ownership to persistent handles with worker revision safety; require both private gates before PCL integration. STEP UI exchange and transforms remain open.
- Fable: benchmark persistent isolated native processes vs per-feature startup, dependency-key hashing and minimal dirty propagation, OCCT tolerance/robust healing policies and adaptive tessellation. Test concave/near-degenerate profiles and multi-loop classification, kernel-version cache key, deterministic property validation, memory pressure and progressive mesh uploads; use actual p50/p95 against representative sketches with concurrent simulation. Reuse T004 resource scheduler rather than concurrent unrestricted processes; profile CPU/GPU latency and retain camera buffers. No performance guarantees yet.
- Proposed T010 after exact T009 certification and fresh authorization: extend C3 with native revolve/boolean feature primitives and multi-stage dependency/naming/regeneration review; do not auto-start. C1 production integration remains incomplete.
