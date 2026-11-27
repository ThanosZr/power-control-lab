# CAD-T011 — Native Sweep & Loft, General Planes and Feature References

## T011-A checkpoint — NOT final certification

Parent T010 7341313f68bb75d688686e241d81b9e83367d128, tree 982515912c45201e7e56bc3e5e49c47695939f0f. CI [45991092618](https://github.com/ThanosZr/power-control-lab/actions/runs/45991092618) completed/success at exact SHA, four successful jobs and dedicated T010 step; native 6/6 in 76.177 s, real browser PASS. New branch lab-cad-0.11.0-sweep-loft. Engine 5.0.7 pinned; no integration or main changes.

T011-A uses direct OCP (same OCCT geometry family) for an isolated reference proof. Explicit right-handed datum frames with origin, X direction and normal, optional parent datum and local coordinates. Earlier feature IDs resolve typed plane/profile/path references. Polygon profiles only; 3–64 vertices; straight two-point spine from profile origin along normal; native MakePipe; solid ruled ThruSections loft (2–8 ordered profiles). Every output checked as one nonzero-volume valid BRep; exact OCCT mass and center, not mesh properties. At most 16 features. This is a deliberately bounded geometry proof, not the production feature document contract.

Local: Python 3.13/OCP available, build123d absent; git clone blocked by DNS; five unittest methods passed (0.017 s, no performance claim). Native/test blob hashes checked against locally tested files. No full repository checkout, browser or prior suites executed locally in this turn. Additive dedicated CI step runs in existing CAD native venv. CI of T011-A pending until remote run confirms exact commit.

## T011 continuation — schema 3, implementation candidate

Work Mode rechecked a full clean checkout of the T011-A commit `22dd01e235ae57c455f50110005a0ef1d9b3b5a5`, tree `62838ea1d31a6ce76bfc1cdc9ac2f3dfb471d14a`; repeated all five T011-A OCCT tests successfully. [T011-A CI 46010285091](https://github.com/ThanosZr/power-control-lab/actions/runs/46010285091) at that exact SHA was in progress on observation. The proof files remain intact and their tests stay in CI.

The isolated T011 reference uses the T009 `History` transaction engine, the actual T008 local constraint solver, pinned build123d/OCP and the T006/T007 retained WebGL2 renderer. The public document is `{schema:3,units:'mm',features:[...],output:'solidId'}`. IDs are stable within a document, earlier typed feature references only (no implicit references to tessellated faces). Schema 1 and 2 retain their existing closed contracts; they can be opened/regenerated as-is. The inspector upgrades a definition to schema 3 on edit. No schema downgrade or persistent topological naming is claimed.

| Operation | Fields in addition to `id, op` | Contract / limits |
| --- | --- | --- |
| plane | origin, x, normal, optional parent | Explicit right-handed orthonormal datum; origin and vectors in parent-local coordinates or global XYZ; X perpendicular to normal. |
| sketch | model, optional plane | T008 locally fully constrained 2D model; default XY. T009 polygon or single circle, optional up to four nonoverlapping circular holes in a polygon. |
| path | kind, points, optional plane | `line`: two points; `arc`: three ordered distinct noncollinear points of one exact circular arc ≤180°. Coordinates global or datum-local; positive start tangent required for sweep. |
| extrude | profile, depth_mm | 0.1–1000 mm along sketch normal (also on arbitrary datum). |
| revolve | profile, angle_deg | 1–360° about sketch-local Y axis; profile strictly on positive local X side. |
| sweep | profile, path | Native OCCT MakePipe face sweep, including polygons/circles and supported circular holes; spine starts at sketch origin and tangent follows positive normal. Curved case uses corrected Frenet on a single planar circular arc; conservative profile radius smaller than arc radius. No kink, helix, arbitrary spline or user twist law yet. |
| loft | profiles, ruled | 2–8 distinct ordered sketch IDs; native ThruSections ruled or smooth; matching polygon edge counts or all single circles, with consistent parallel section orientations and strictly increasing normal offsets. Arbitrary global orientations are supported; nonparallel section normals, holes, mixed section topology and explicit vertex correspondence authoring are excluded. OCCT compatibility matching is not a persistent mapping. |
| union / subtract / intersect | left, right | Two earlier distinct solid IDs, including native sweep/loft, T010 Boolean semantics; one valid solid and volume bounds. |

Native geometric validation includes T009 closed loop, normalized winding, edge intersections, hole containment/touching checks, exact native face area and BRep validity. Every solid must be a single valid, positive-volume BRep. For extrude/revolve and straight/circular sweep, independently verify volume against profile area/depth, radial moment or area × arc length adjusted by profile centroid offset. Loft is kernel-validated (not a general mathematical guarantee against all geometric self-intersections); independent analytic frustum/cone tests cover ruled and smooth reference cases. Mesh is display output only, never the source of geometry or exact properties. Fixed tolerances and bounded envelopes; no healing or arbitrary topology claims.

## Transaction and worker contract

- `contract.py` checks exact field sets, typed earlier references, finite bounded frames/paths, limits (16 features, 64 KiB), and output solid. `history.py` resolves recipes in topological order, solves changed sketches via T008, and builds canonical transitive keys with unique ancestors. Independent unchanged results are reused; changing a datum/path/profile rebuilds affected dependencies, changing only output reuses all geometry.
- `worker.py` accepts a bounded schema-3 transitive recipe only; replay is native, not mesh-based, with exact geometry calculated in an isolated subprocess and result limited to 512 KiB. The same T009 60 s overall regeneration deadline and child process termination are used. Worker startup and replay are not yet persistent OCCT handle caching. All validation, sketch solve/render results and history are committed atomically on matching revision. Late, cancelled, invalid or stale edits preserve prior model; bounded 12-entry undo/redo and definitions-only JSON save/open use same regeneration pipeline.
- `server.py`: single-owner loopback API, one active mutation, separate request-ID-scoped cancellation endpoint, no file-write endpoint. Browser may continue orbit/pan/zoom during work. Cancellation is checked through subprocess termination and immediately before commit; a response after commit cannot undo that commit. No unrestricted concurrent native job admission.
- `index.html` / `app.mjs`: typed inspector (datum, sketch model, path, references and operation parameters), feature addition/removal, tree showing rebuilt/reused, displayed-solid chooser, document JSON, undo/redo, save/open and cancel. Existing custom renderer consumes native-feature-mesh v1; deterministic recipe key suppresses duplicate GPU uploads on independent edits, same-geometry reopen or camera changes without geometry reconstruction. No Three.js. Current exact kernel is CPU; retained WebGL2 graphics are GPU-oriented, not evidence of hardware physics/BRep acceleration.

## Run and verify

From repository root with Python 3.12, Node and the pinned CAD-only requirements:

```sh
python -m pip install -r experiments/cad_t007/requirements-native.txt
python -m experiments.cad_t011.server
python -m unittest experiments.cad_t011.test_native experiments.cad_t011.test_history -v
node experiments/cad_t011/test_browser.cjs
```

Open `http://127.0.0.1:8771/experiments/cad_t011/`. Default sample: circular profile radius 2 mm, quarter-circle path radius 20 mm; volume 40π² mm³. Alternative ruled loft with radii 2/4 mm and 10 mm spacing; volume 280π/3 mm³. Tests include oblique/nested datums, swept polygon with hole, offset circular profile, smooth three-section cone, typed/malformed/degenerate references, native failure rollback, independent reuse/output switching, general-plane extrude/revolve, Boolean sweep/prism intersection, legacy opening, undo/redo/save/open and actual process cancellation. Browser test drives typed inspector, native geometry, output change, retention through independent edits/failed edits/camera, history, real file save/open and cancel; screenshot is a CI artifact. The local runtime has OCCT/build123d and Playwright, but no Chromium executable; actual browser launch failed and browser download returned 403. Therefore real browser PASS must come from the dedicated additive CI step at the final SHA. No skipped or replaced CAD tests.

Local evidence at this candidate: Python 3.12.14, OCCT 7.8.1.1.post1 / build123d 0.10.0, Node v24.22.3. 13/13 T011 native tests (5 retained A + 8 integrated, last run 64.711 s), 41/41 prior CAD Python and 24/24 unchanged PCL dock/live-program/recording (78 total unique Python methods), 20/20 T006/T008 Node, CODEMAP/API 947, JavaScript syntax and Python compilation, `git diff --check` passed. T011 cancellation test observes real native child startup and cleanup. Timings describe this environment, not performance guarantees. Original engine runtime paths are byte-identical to pinned 5.0.7; only isolated experiments, public CAD docs/README and additive CAD CI change. Actual private checker unavailable and not claimed; no private material used.

## Opus/Fable optimization and architecture backlog (not delegated)

- **Opus:** unify datum/feature/body/document identity (including local physical port axes and transforms for assemblies and motion); design stable topology/history references with explicit ambiguity, migration, profile section correspondence, robust multi-body semantics and eventual T003/T004 integration. Plan general path/sweep frame and nonparallel loft/holes validation separately. Keep exact model separate from display mesh and physics time from presentation time (D036).
- **Fable:** profile real pinned OCCT/build123d native startup, replay of shared ancestors across process boundaries, canonical key size, cancellation latency/peak RSS and IPC. Compare persistent child process with BRep handle cache and incremental dirty propagation against current detached replay; integrate scheduler/resource budgets. Benchmark path-frame and curvature/tolerance edge cases, section matching/tessellation, retained GPU buffer lifecycle and progressive/adaptive mesh, camera latency on NVIDIA/AMD/Intel/Apple, portable compute backends with CPU reference/fallback. Reuse physical datum transforms for field/circuit/motion coupling and Digital Twin. No performance or physics acceleration claim without measurements.
- **D036 unchanged:** GPU-first multiphysics, electromechanical Motion Simulation, Digital Twin, independent time-scaled playback. No Three.js, no integrated solver, no GPU BRep claim. Both private PCL integration gates unchanged and not passed; only isolated synthetic files and public docs. No main/base change or T012 until actual complete T011 CI and new authorization.
