# CAD-T011 — Native Sweep & Loft, General Planes and Feature References

## T011-A checkpoint — NOT final certification

Parent T010 7341313f68bb75d688686e241d81b9e83367d128, tree 982515912c45201e7e56bc3e5e49c47695939f0f. CI [45991092618](https://github.com/ThanosZr/power-control-lab/actions/runs/45991092618) completed/success at exact SHA, four successful jobs and dedicated T010 step; native 6/6 in 76.177 s, real browser PASS. New branch lab-cad-0.11.0-sweep-loft. Engine 5.0.7 pinned; no integration or main changes.

T011-A uses direct OCP (same OCCT geometry family) for an isolated reference proof. Explicit right-handed datum frames with origin, X direction and normal, optional parent datum and local coordinates. Earlier feature IDs resolve typed plane/profile/path references. Polygon profiles only; 3–64 vertices; straight two-point spine from profile origin along normal; native MakePipe; solid ruled ThruSections loft (2–8 ordered profiles). Every output checked as one nonzero-volume valid BRep; exact OCCT mass and center, not mesh properties. At most 16 features. This is a deliberately bounded geometry proof, not the production feature document contract.

Local: Python 3.13/OCP available, build123d absent; git clone blocked by DNS; five unittest methods passed (0.017 s, no performance claim). Native/test blob hashes checked against locally tested files. No full repository checkout, browser or prior suites executed locally in this turn. Additive dedicated CI step runs in existing CAD native venv. CI of T011-A pending until remote run confirms exact commit.

## Required continuation before T011 closure

- Integrate into T009/T010 transactional history, schema migration/compatibility, real T008 sketch bridge, bounded worker process, strict document/recipe validation, revision/cancellation and rollback, undo/redo/save/open, dependency keys and native recipes. Do not accept loose low-level input as public document schema.
- Generalize native sweep to curved spines and supported frame/twist rules; add profile circles/holes with explicit support limits; improve loft section correspondence, check winding/self-intersections/tolerances, add valid/invalid cases. General planes must also apply to supported existing extrude/revolve operations.
- Return tessellated display mesh with same retained WebGL2 contract, extend GUI and dedicated real browser test. No Three.js; keep GPU-first D036, multiphysics, Motion Simulation and Digital Twin requirements unchanged. No claim of GPU BRep or physics acceleration.
- Opus: shared datum/feature/body identity, stable reference schema and explicit topology ambiguity (no stable face/edge ID claim), migration and common physical frames for ports/motion.
- Fable: profile OCCT native API versus build123d, persistent process and BRep cache, incremental dependency propagation, tolerance and path frame robustness, mesh/IPC/GPU buffer reuse, memory/cancellation/concurrency. No delegation.
- Both private gates remain mandatory before CAD integration into PCL. Publish only isolated synthetic work; actual private checker not run; no private input. No main/base change. Final exact-SHA CI and local appropriate tests required before T012.

Run: python -m unittest experiments.cad_t011.test_native -v.
