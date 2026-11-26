# CAD-T007 — isolated parametric editing (0.7.0)

D033, 26/11/2026. Parent T006 68a465be4df460e7918fa0d849a0bddc8f931a8d / CI 45649705613, exact head and all four jobs verified. Engine 5.0.7 unchanged. No PCL runtime integration.

- One T003 straight-shaft document, diameter and length in mm. Python Editor and loopback GUI share the same transaction API. Candidate document/history is copied, checked and rebuilt by T004/T005 native OCCT in a child process; document and mesh commit together only on a successful current completion. No-op edits do not rebuild. The previous valid geometry and history survive failed edits, undo, redo and open. Cache reuses exact successful payloads; editing session is separate from temporary native-job sessions.
- Save/open uses the versioned document schema, not mesh serialization. Open validates the exact straight-shaft template, rebuilds native geometry and establishes a new session. History is in memory (T003 bounded stacks); not persisted. Python save uses same-directory atomic replacement; GUI downloads JSON and opens a selected local file.
- A single-owner local HTTP server serializes commands, binds loopback, rejects foreign Host/Origin, serves only fixed static paths, accepts bounded JSON, and does not write user-selected paths. It is a prototype, not an authenticated multi-user service. Requests wait for worker completion; browser event loop remains responsive, edits disabled during pending transaction. No concurrent editing, interrupt button, persistent BRep, or OS resource limit claim.
- Retained T006 WebGL2 renderer; camera gestures do not regenerate native geometry or upload buffers. New document revision replaces mesh and fits camera; stable body ID, not face topology.

## Run

~~~sh
python -m pip install 'build123d==0.10.0' 'cadquery-ocp==7.8.1.1.post1'
python -m experiments.cad_t007.server
~~~

Open http://127.0.0.1:8767/experiments/cad_t007/ .

~~~python
from experiments.cad_t007.editor import Editor
with Editor() as editor:
    s = editor.state()
    s = editor.edit({"diameter": 32, "length": 180},
                    session=s["session"], revision=s["document"]["revision"])
    editor.save("shaft.cad.json")
    s = editor.undo(session=s["session"], revision=s["document"]["revision"])
    s = editor.open("shaft.cad.json", session=s["session"],
                    revision=s["document"]["revision"])
~~~

Tests: python -m unittest experiments.cad_t003.test_document experiments.cad_t004.test_worker experiments.cad_t005.test_native experiments.cad_t007.test_editor -v; node experiments/cad_t007/test_browser.cjs. CI includes a CAD-conditional native dependency and test step on T007-capable branches. Local checkout/native dependency unavailable in this environment; no local native or browser pass asserted. Final CI at actual remote SHA is required.

## Opus/Fable independent review (not delegated)

- Opus: integration and session ownership across current engine console, document lifecycle, dock/inspector, shared scheduler and privacy gates; do not merge before both private gates.
- Fable: candidate transaction copy/history memory, cache granularity, failed native build cleanup, persistent process and binary transport, nonblocking command queue/cancellation, GPU buffer/fit continuity, topology references, cross-platform persistence, session races and p50/p95 latency under simultaneous PCL simulation. No measured optimization or hardware performance claims.
- Next proposed work, separately authorized: isolated sketch/constraint contract (C2); no claim that C1 is fully complete (STEP UI exchange, transforms and production docking still outstanding).
