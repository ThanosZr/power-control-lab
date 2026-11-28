# CAD-T013 — Native Patterns, Mirror & Shell

CAD-D041, 28/11/2026; isolated C3 slice on `lab-cad-0.13.0-patterns-shell`. Parent T012 `9bb31d9b09dc7d3178c34ee87c0c597104de4d7e`, tree `dd1f064f393b3d628d5501ed9878e23cf710b7c8`, [CI 46099782512](https://github.com/ThanosZr/power-control-lab/actions/runs/46099782512) verified 4/4 success; Playwright checkout log contains the exact SHA and explicit T012 real native/browser PASS. Approved PCL engine 5.0.7 unchanged; both private gates remain required before PCL integration.

## Definition and exact geometry

Schema 5 retains the 16-feature / 64 KiB document envelope, earlier typed DAG, millimetres/degrees and closed validators for schemas 1–4. Older definitions open/save unchanged; inspector edits opt into schema 5. Every operation consumes an earlier solid and produces exactly one valid, positive-volume BRep solid. New outputs are valid inputs to all earlier solid operations and vice versa.

| Operation | Additional definition fields | Native contract |
| --- | --- | --- |
| `linear_pattern` | `body`, `step` (world XYZ mm), `count` | Original plus translations `i*step` for `i=1..count-1`, exact OCCT transform and ordered fuse. Step magnitude 0.01–1000 mm. |
| `circular_pattern` | `body`, `origin` (world XYZ mm), `axis` (nonzero XYZ), `angle_deg`, `count` | Original plus rigid rotations about normalized world axis through origin, step 1–359°, `(count-1)*angle_deg < 360°`. |
| `mirror` | `body`, `plane` (earlier datum feature) | Exact plane reflection using resolved datum frame, returns the reflected solid (not implicitly unioned with the source). Volume and analytically reflected centroid checked. |
| `shell` | `body`, `faces`, `thickness_mm` | Inward constant wall thickness 0.01–1000 mm, removes 1–4 distinct native planar faces, OCCT thick solid via intersection join. Validity, strict positive material removal and source envelope checked. |

Patterns include the source in count (integer 2–8); up to 24 added copies in a document. Each copy must contribute material and form one connected solid at its insertion step. Exact transform volume, monotonic union volume bounds and validity checked; disconnected, point/edge-only contact if not a single valid solid, redundant, failed or over-budget copies are rejected atomically. `BRepBuilderAPI_Transform`, `BRepAlgoAPI_Fuse` and same-domain simplification perform the exact operations, not repeated display meshes. Native pattern/shell inputs/intermediate results capped at 256 faces / 512 edges in addition to existing catalogue and mesh limits. This is **connected whole-body additive patterns**, not an assembly instance array, pattern of arbitrary operations/cuts, or general multi-solid document. Use an explicit Boolean for mirror union or another valid downstream operation. Exact CAD remains CPU kernel work; no claim of GPU-accelerated BRep/physics.

Shell uses `BRepOffsetAPI_MakeThickSolid.MakeThickSolidByJoin` with negative offset, 1e-7 mm kernel tolerance, intersection join and default intersection/self-intersection options; no implicit healing. Exact builder failure, invalid/multiple/empty result, missing face or bad thickness must fail. Supported boundary subset and native offset feasibility limit shellable geometry; not general outward, variable-thickness or closed-shell offset. Bounds/volume/validity are not a proof of arbitrary offset wall quality; analytic cases below verify actual thickness/material removal.

## Native face references and retained viewport

- Direct extrusions: `s:<sketch-id>:base-face` and `s:<sketch-id>:top-face` resolve to uniquely identified planar cap parallel to the solved sketch frame at local z=0/depth. Therefore suitable profile, datum and depth edits follow the cap role. No persistent arbitrary topology identity is promised.
- Other planar faces: `f:<SHA-256>` over unoriented quantized normal, area centroid, area and sorted canonical boundary curve descriptors (straight segments or full circles only). Coordinates, normals and area quantized at 10^-6 in their respective units. Reordering or reversing boundary edges does not change identity; unsupported curves, collisions and ambiguous matches rejected. Native faces re-resolved from the source BRep on every build; geometry changes may require explicit reselection. No mesh ordinal, nearest-face match or silent rebind.
- Native `faces` catalogue (<=128 candidate descriptors) adds `ref`, `area_mm2`, `center_mm`, `normal`, `edge_refs`. The last field identifies supported existing T012 native boundary polylines for **display only**. In the inspector select the source as displayed solid, choose planar face(s) by reference/area/centroid, see supported boundary highlights, and apply wall thickness. Highlight is an outline, not GPU face picking or a tessellation-derived face reference. Selection and camera changes use retained edge ranges and uniforms; no mesh uploads. Earlier fillet/chamfer catalogue and inspector unchanged outside T013. No Three.js.

T011 replay has an additive optional face catalogue hook; T013 validator, dependencies, worker, shell faces and operations are isolated. T009 transactional history, T011 solved dependency recipes, revision CAS, 12-entry undo/redo, 60 s regeneration deadline, one mutation at a time, actual process cancellation, 512 KiB native result limit and definitions-only save/open retained. Mirror dependencies include both source and datum. Shape keys include the complete dependency recipe; independent sibling reuse and display-only changes do not rebuild/upload unchanged geometry. New browser UI uses earlier custom WebGL2 without a new framework or backend selection.

## Run and verify

```sh
python -m pip install -r experiments/cad_t007/requirements-native.txt
python -m experiments.cad_t013.server
python -m unittest experiments.cad_t013.test_history -v
node experiments/cad_t013/test_browser.cjs
```

Open printed loopback URL (default `http://127.0.0.1:8773/experiments/cad_t013/`).

| Synthetic reference on 30 × 20 × 10 mm block | Expected exact volume (mm³) |
| --- | ---: |
| Original | 6000 |
| Linear, 3 copies including source, 25 mm step X | 16000 |
| Circular, 4 copies including source, 90° about corner Z axis | 24000 |
| Mirror about YZ plane | 6000, centroid (-15, 10, 5) mm |
| Open top, 2 mm walls/bottom | 6000 − 26×16×8 = 2672 |
| Open both caps, 2 mm walls | 6000 − 26×16×10 = 1840 |

Tests cover analytical volumes and centroid, oblique reflection, translated reversed rotation axis, cylindrical shell, multiple removed caps, transitive regeneration and stable cap roles, generic face reference loss and explicit reselection, Boolean and chamfer downstream use, copy/definition bounds, legacy documents, stale revision/rejection/rollback and actual native worker cancellation/admission. Browser test checks native output volumes, edit and add operations, face selection/outline, retained buffer counters, independent reuse, failed native edit, mirror dependencies, undo/redo, definition save/open and cancel; additive CAD-conditional Playwright step with screenshots. Final certification requires successful four-job CI and explicit dedicated T013 native/browser PASS on actual remote HEAD. Local checks and exact CI evidence are tracked in CAD_STATUS / CAD_VERSIONS_01.

Local Python 3.12.14, pinned build123d/OCP above, Node v24.22.3: 8/8 T013 native methods (136.016 s), 86/86 preceding CAD and PCL regression methods (324.520 s), 21/21 Node checks; CODEMAP/API 947 and 119 relative Markdown file targets pass. These suite elapsed times are environment-specific, not an acceleration benchmark. Actual local Playwright launch attempted but `/usr/lib/chromium/chromium` absent; real native/browser CI mandatory, no local browser PASS claim.

## Opus/Fable optimization backlog (not delegated)

- **Opus:** persistent subshape naming with transformed instance provenance, stable copy IDs, OCCT history across fuse/shell/face splits/merges; design distinct body vs feature pattern vs assembly instance definitions. Introduce robust topology migration and face diagnostics, richer shell options and exact wall thickness verification with analytic and adversarial offset cases. Keep physical datum/port identities separate from mesh/render IDs for D036 assembly, Motion Simulation, Digital Twin and multiphysics coupling.
- **Fable:** profile rigid copy location vs deep-copy cost, sequential fuse vs multi-argument fuse, same-domain simplification, repeated recipe replay/import startup, face/edge catalogue duplicated enumeration and hashing, tessellation/IPC/RSS. Benchmark copy-count scaling, nested patterns and shell failure/cancel latency. Evaluate persistent native BRep cache with bounded ownership and dirty DAG, batch exact kernel operations where certified, adaptive GPU instancing/LOD for preview (never substitute for fused exact mass), retained face/edge range batching, GPU ID/depth picking and measured uploads/frame times across NVIDIA/AMD/Intel/Apple. Preserve portable backend/CPU reference/fallback; no inference of hardware acceleration from SwiftShader.
- D036 remains unchanged: GPU-first rendering/compute across coupled electromechanical physics, Motion Simulation and Digital Twin independent of live vs time-scaled playback. T013 does not implement physics, production shared CPU/RAM scheduler, OS hard memory quotas, C1 PCL integration, STEP exchange or assemblies. Both original private gates remain mandatory and unmet; no private material used; no solver/netlib/parts change or main/base write.
