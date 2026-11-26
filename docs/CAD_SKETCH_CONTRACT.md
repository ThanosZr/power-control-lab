# CAD-T008 — isolated sketch and constraint engine (0.8.0)

CAD-D034, 26/11/2026. Parent T007 `ebf74a85cdef5d1e617412098c881956dfc8d599`, [CI 45738308465 attempt 2](https://github.com/ThanosZr/power-control-lab/actions/runs/45738308465/attempts/2): exact branch/SHA, completed/success, four successful jobs, dedicated T006/T007 steps successful. Engine 5.0.7 remains pinned. This is a bounded C2 reference, not the final CAD solver or PCL integration.

## Model and API

`experiments/cad_t008/sketch.mjs` is dependency-free ECMAScript shared by browser and Node. Schema 1 has arrays `points` (`id,x,y`), `lines` (`id,a,b` point IDs), `circles` (`id,center,radius`), and `constraints`. Coordinates and lengths are mm. Distinct stable IDs are globally unique, validated and sorted canonically; lines reference shared endpoints, circles share a center point and introduce a radius variable. No exact BRep or production document migration is implied.

| Type | Fields besides `id,type` | Residuals |
| --- | --- | --- |
| fixed | point,x,y | two coordinate differences |
| coincident | a,b (points) | two coordinate differences |
| horizontal / vertical | line | endpoint y / x difference |
| dx / dy | a,b (points),value | signed component of b−a minus value |
| distance | a,b (points),value | distance minus positive value |
| radius | circle,value | radius minus positive value |
| equal_length | a,b (lines) | difference of segment lengths |

`solve(model)` is pure with respect to its input. It returns `{ok,model,diagnostics}` only on success; failure returns diagnostics but no candidate model. `new Sketch(model)` validates and solves its initial state, or throws. `snapshot()` returns a detached copy of revision, model and diagnostics. `apply(candidate,expectedRevision)` is an atomic whole-model transaction: stale, invalid, degenerate and unsatisfied candidates leave exact previous state unchanged. Successful changed canonical model increments revision; unchanged model does not. No history, document file I/O, Python/Java bridge or concurrent owner yet.

~~~js
import {Sketch,sample} from './experiments/cad_t008/sketch.mjs';
const sketch = new Sketch(sample());
const {model,revision} = sketch.snapshot();
model.constraints.find(c => c.id === 'width').value = 100;
const result = sketch.apply(model,revision);
console.log(result.state.diagnostics); // local rank, DoF, etc.
~~~

## Numerical contract and boundaries

- Analytic Jacobian for the supported residuals. Deterministic damped Gauss–Newton: normal equations with positive diagonal damping, pivoted elimination, strict cost reduction; at most 80 iterations, 64 scalar variables, 128 constraints, coordinate/target magnitude ≤10,000 mm. No stochastic restarts or unbounded loops. Circles require positive radius and segment length/radius >10⁻⁶ mm at accepted solution.
- Residual maximum ≤10⁻⁷ mm for success; rank estimated by pivoted elimination of row-normalized Jacobian at tolerance 10⁻⁸. `dof = variables − rank`, `redundantRows = equations − rank`. Consistent redundant rows are accepted but explicit; `fully_constrained` means local rank equals variable count, not uniqueness globally. On failure rank/DoF describe attempted local state, not committed sketch; offending constraint IDs are residual violations, not a minimal conflict set.
- `unsatisfied` distinguishes failure to satisfy residuals from redundancy alone: the cause may be incompatible constraints, local minimum, a singular seed or domain bound. No global infeasibility proof. Coincident seeds for positive distances have no chosen direction; user must choose a nondegenerate seed. No arcs/splines, angles, tangency, perpendicular/parallel, inequalities, closed-profile/self-intersection validation, robust large-scale sparse solve or topology links. Underconstrained solutions can move free geometry during a successful edit; no promise of closest global solution. Circle containment is not imposed.
- Example rectangle + fixed-center circle has 11 variables, rank 11, DoF 0. Removing height gives DoF 1. Adding a conflicting width yields `unsatisfied`; the last valid rectangle is unchanged. The circle center is intentionally fixed rather than automatically centered in the rectangle.

## Demo and tests

From repo root: `python -m http.server 8768 --bind 127.0.0.1`, open `http://127.0.0.1:8768/experiments/cad_t008/`. The SVG demo edits width, height, radius and toggles an underconstrained/conflicting case; it shows committed revision/rank/DoF and separate trial diagnostics. No source duplication between GUI and programmatic usage. No PCL server/routes, GPU backend or integration claim.

`node --test experiments/cad_t008/test_sketch.mjs`: 13 reference cases passed covering free/fully constrained, nonlinear distance/equal length, coincidence, redundancy, inconsistent dimensions with exact rollback, stale/invalid/degenerate candidates, deterministic order, no-op and limits. Local regression: T006 Node 7/7, T003/004/005/007 Python 26/26 with real OCCT, pinned engine dock/live-program/recording 24/24, CODEMAP/API 947 PASS. `node experiments/cad_t008/test_browser.cjs`: actual Playwright dimension edit, rejection with exact SVG retention, underconstraint and reset. CAD-conditional additive CI step; existing checks/thresholds unchanged. Local browser launch blocked by missing Chromium executable, not marked passed. Final remote exact SHA/CI 4/4 and dedicated T008 step required.

## Independent Opus/Fable review backlog (not delegated)

- Opus: extend versioned sketch entities and constraints, units, document/revision integration, profile validity/extrude boundary, edit ownership and persistence; require both private gates before any PCL API/GUI integration.
- Fable: rank-revealing QR/SVD instead of normal equations for ill-conditioned geometry, scaling, analytic-gradient cross-checks, component decomposition, robust singularity/branch selection, minimal conflicts, deterministic multi-solution policy, incremental solve and bounded worker scheduling; benchmark representative sketches and concurrent simulation before performance claims.
- Proposed T009 only after exact T008 certification and fresh authorization: isolated C3 feature history/profile-to-extrude with native geometry, dependency/revision and failed-regeneration contract. C1 production integration remains incomplete; both private gates are open.

## Final certification (26/11/2026)

Remote HEAD `9abc985db1e6fa68c83f9bb4a8808afe2d6d3d56` verified directly against [CI 45747371669](https://github.com/ThanosZr/power-control-lab/actions/runs/45747371669): exact head/branch, completed/success, all four jobs and dedicated T008 Node/browser step successful. T009 starts from this exact certified commit under D035.
