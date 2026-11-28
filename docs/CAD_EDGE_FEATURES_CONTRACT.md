# CAD-T012 — Native Fillet, Chamfer & Edge References

CAD-D040, 28/11/2026. Parent T011 `c7b4fe077d35d8a73c3207b3d70bd18db13fb2a4`, tree `e19d036ef31afe01644631554d65d602fee4811b`; [CI 46018201004](https://github.com/ThanosZr/power-control-lab/actions/runs/46018201004) verified all four jobs and dedicated T011 native/browser PASS. The Playwright job's checkout log explicitly reports this exact SHA. New isolated branch `lab-cad-0.12.0-edge-features`; engine 5.0.7 and both private integration gates unchanged.

## Definition and reference semantics

Schema 4 uses the same document envelope, typed earlier feature DAG and bounded 16-feature/64 KiB definition as T011. Schemas 1–3 retain their original validators and can be opened and saved unchanged; editing from the T012 inspector upgrades to schema 4. All prior feature operations and Boolean operands support the additional solid output kinds.

| Operation | Additional fields | Contract |
| --- | --- | --- |
| fillet | body, edges, radius_mm | Constant-radius native OCCT fillet; 0.01–1000 mm; 1–16 distinct edge references on one earlier solid. |
| chamfer | body, edges, distance_mm | Symmetric native OCCT chamfer; same bounds and reference scope. |

`body` is the earlier feature ID. `edges` is an array of opaque strings received from the native catalogue of that body:

- **Direct extrusion semantic IDs:** `s:<sketch-id>:side:<point-id>` for an extruded polygon vertex; `s:<sketch-id>:base-line:<line-id>` and `top-line` for polygon edges; `base-circle` and `top-circle` for circular rims, including supported holes. Expected world curves are calculated from the solved sketch entity IDs, datum frame and extrusion depth. The reference resolves only to one uniquely matching exact native curve. This permits appropriate dimension/depth/datum edits while retaining entity identity. Removed/replaced IDs or missing/ambiguous curves fail; IDs must not be reused with a different semantic meaning. This is intentionally a narrowly defined naming contract, not arbitrary persistent topology naming.
- **Other bodies:** `g:<SHA-256>` of a canonical geometry descriptor, unordered line endpoints or full-circle centre/radius and unoriented normal, using 10^-6 mm coordinate/radius bins (normal components likewise quantized to 10^-6). Only a unique descriptor on the referenced current body is selectable. Reordering OCCT edges or reversing orientation cannot change the reference. Changing the curve beyond its descriptor invalidates the reference; no nearest-neighbour fallback, implicit migration or promise that coincident geometry conveys persistent topological identity.
- Eligibility is limited to finite straight segments and complete circles having exactly two distinct incident BRep faces. Seam edges, partial arcs, free/boundary edges, unsupported splines and descriptor collisions are excluded. Catalogue bounded to 128 candidates. An eligible candidate is not a promise of a feasible radius/distance.

The worker re-resolves every reference against the actual BRep from the earlier recipe, never the display mesh, never an edge array index. `BRepFilletAPI_MakeFillet` and `BRepFilletAPI_MakeChamfer` execute in the existing isolated native child; kernel contour propagation beyond the explicitly selected edges is rejected. Builders must finish and return one valid, positive-volume solid (a singleton compound may be unwrapped; other compound outputs rejected). The volume must measurably change; volume direction is not prescribed because an operation can be concave. Exact mass/centre via OCCT integrals, tessellation only for display. No variable radius, asymmetric chamfer, arbitrary topology naming or healing.

## History, GUI and GPU

T011 replay is parameterized with schema/validator/dependency/worker hooks; T011 defaults and tests retained. T012 uses its own native catalogue and worker. Native result contains additive `edges` entries (`ref, kind, length_mm, points`); polylines are presentation only. Result/definition envelopes remain 512 KiB and 64 KiB, with a 60 s regeneration deadline. Same independent dependency reuse, optimistic revision, detached results, 12-entry undo/redo, definitions-only save/open, single mutation admission and actual subprocess cancellation. A lost reference or invalid operation leaves the entire committed document unchanged.

The shared isolated inspector adds fillet/chamfer, earlier source selector, multi-select catalogue with semantic name/length/position or geometry descriptor prefix, size, failed-edit diagnostics and native reference highlighting when the source is displayed. Choose the source via Displayed solid before selecting edges to preview them. Native operation uses reference keys, not presentation polyline positions or cursor picks. The custom retained WebGL2 renderer uploads the catalogue polylines as one additional buffer, with indexed ranges by reference. Selection and camera change draw ranges/uniforms, not mesh or edge reuploads; teardown/replacement also frees edge buffer/VAO. Depth-tested highlight; curve sampling is not an exact measurement. No Three.js.

## Run and verify

```sh
python -m pip install -r experiments/cad_t007/requirements-native.txt
python -m experiments.cad_t012.server
python -m unittest experiments.cad_t012.test_history -v
node --test experiments/cad_t012/test_renderer.mjs
node experiments/cad_t012/test_browser.cjs
```

Open the printed loopback URL (default `http://127.0.0.1:8772/experiments/cad_t012/`). Reference block 30 × 20 × 10 mm, volume 6000 mm³. Single vertical R2 fillet: 6000 − 10(4 − π) mm³. Two vertical C2 chamfers: 5960 mm³. Tests also exercise cylinder rims on an oblique datum (analytic annular wedge), semantic references across depth/sketch edits and removed entities, generic references on an already modified body, explicit reselection after lost reference, chain and Boolean downstream use, native failure and rollback, reuse, revisions, legacy schemas and actual native process cancellation. Dedicated T012 CI step retains all previous tests and adds native methods, renderer contract and real Playwright browser; screenshots in existing UI artifacts.

Local environment Python 3.12.14, build123d 0.10.0 / cadquery-ocp 7.8.1.1.post1, Node v24.22.3. The local Chromium wrapper exists but its executable `/usr/lib/chromium/chromium` does not; attempted browser launch fails at that environmental prerequisite. No local browser PASS claimed. Real browser CI is required on the actual final SHA. The pinned 5.0.7 runtime paths are byte-identical; only isolated experiments, CAD docs/README and additive CAD CI change. Actual private checker not available/not executed. No private inputs or PCL integration.

Local T012: eight Python unittest methods passed in 116.391 s (real OCCT and worker subprocesses, with environment-specific elapsed time, not a performance guarantee); 78 preceding CAD/PCL regression methods passed in 230.012 s (54 CAD including all T011, 24 PCL; 86 unique Python methods total). One retained edge range/teardown renderer test passed, plus all 20 preceding viewport/sketch Node tests. CODEMAP and public API (947) checks passed.

## Opus/Fable review (not delegated)

- **Opus:** define robust persistent subshape naming using OCCT Generated/Modified/IsDeleted histories, explicit provenance through Boolean/fillet/chamfer chains, split/merge/ambiguity and migration UI. Preserve semantic sketch IDs and physical datum/port axes for assemblies, Motion Simulation and D036 Digital Twin. Separate geometry, physical identity and rendering IDs. Extend edge coverage, variable-radius/asymmetric operations, tangent-chain policies and preview diagnostics only with separate validation; no silent rebind.
- **Fable:** profile edge-face adjacency, canonical signature resolution, repeated native process startup and recipe replay, BRep handle cache, minimal dirty propagation and cancellation latency/peak RSS. Benchmark tolerance boundary/collision cases, highly segmented shapes, fillet feasibility and native surface/tessellation workloads. Evaluate batched GPU edge visualization, GPU ID/depth picking and adaptive polyline sampling; compare current retained range draw calls at large edge counts with vertex/index batching, progressive upload and hardware NVIDIA/AMD/Intel/Apple. Do not infer acceleration from software WebGL. Production scheduler/CPU-RAM budgets and portable GPU compute with CPU reference/fallback remain open.
- **D036** remains active unchanged: GPU-first multiphysics, coupled electromechanical Motion Simulation, Digital Twin and independent time-scaled playback. Exact OCCT BRep is still CPU; retained rendering is GPU-oriented, not evidence of accelerated physical solves. Both private PCL integration gates mandatory. No main/base changes; next C3 pattern/mirror/shell slice only after exact T012 certification and fresh owner authorization.
