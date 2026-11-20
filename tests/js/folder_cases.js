// 5.0 (ROADMAP §91, THEORY §8ΩΕ): the part of the study folder that knows the simulator (web/studio/study.js), and the
// automatic record of decision 343.4. Usage: node folder_cases.js -> JSON
//  rows:    a run with the recorder against the same run without it: the times of the rows are those of the record of
//           the simulation (the scope), every value rounded to float32 is the value of the scope, and the last row is
//           now() of every channel, bit for bit; the run in slices of a deadline (as the worker of the page) the same
//  units:   Study.unitOf against Scope.unitOf for every channel of every tutorial
//  netlist: nodes, elements, parts and blocks of a few tutorials, no state of the run in it, the text with .END
//  auto:    solve.rec 'auto' (a file of version 4): only the watched channels over 1000, every channel up to 1000; an
//           older file and solve.rec = 'all' every channel; the numbers the same in every mode
//  lines:   a line model read back from its JSON (as from the folder) gives the same bits as the model in the project
const path = require('path'); const W = path.resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); global.Expr = require(W + '/expr.js'); global.StepCheck = require(W + '/stepcheck.js');
global.LineModels = require(W + '/linemodels.js'); for (const f of ['netlib', 'subcircuit', 'bus', 'units', 'nn']) require(W + '/' + f + '.js');
require(W + '/sparse.js'); require(W + '/kernels.js'); const MNA = global.MNA = require(W + '/mna.js'); require(W + '/tutorials.js');
const Study = require(W + '/study.js');
const build = (id, o) => { const t = Tutorials.get(id), opts = { ...Object.fromEntries((t.options || []).map(q => [q.k, q.def])), ...(o || {}) }; return t.build(opts); };
const out = {};

// rows: the recorder against the record of the simulation
out.rows = [];
for (const [id, n] of [['buck', 400], ['line_fd', 300], ['ieee9_emt', 300], ['hvdc_mmc', 200], ['big_grid', 60]]) {
  const A = new MNA.Sim(build(id), { cap: 200000 }), B = new MNA.Sim(build(id), { cap: 200000 }), C = new MNA.Sim(build(id), { cap: 200000 });
  const keys = Study.keysFor(B, 'all'), R = new Study.Recorder(B, keys, {}), Rc = new Study.Recorder(C, Study.keysFor(C, 'all'), {});
  R.push(); Rc.push();
  const tEnd = n * A.h; A.run(tEnd); B.run(tEnd);
  while (C.t < tEnd - C.h * 1e-7) C.runUntil(tEnd, Infinity, performance.now() + 2);   // slices of 2 ms, as the worker (250 ms)
  const rows = R.take(), rc = Rc.take(), w = keys.length + 1, nr = rows.length / w;
  // the ring of A: every recorded point (the start point once more in the rows: R.push at t = 0)
  const Rg = A.ring, rk = A.recKeys, ix = rk.map(k => keys.indexOf(k)); let tdiff = 0, vdiff = 0, rn = Rg.n;
  for (let q = 0; q < rn; q++) { const a = (Rg.head - rn + q + Rg.cap) % Rg.cap, r = q;   // row 0 (the push at the start) is the point the constructor recorded
    if (r >= nr || rows[r * w] !== Rg.t[a]) { tdiff++; continue; }
    for (let i = 0; i < rk.length; i++) if (!Object.is(Math.fround(rows[r * w + 1 + ix[i]]), Rg.d[a * Rg.nch + i])) vdiff++; }
  let last = 0; keys.forEach((k, i) => { if (!Object.is(rows[(nr - 1) * w + 1 + i], B.now(k))) last++; });
  let chunks = rc.length === rows.length ? 0 : -1; if (!chunks) for (let i = 0; i < rows.length; i++) if (!Object.is(rows[i], rc[i])) { chunks++; }
  out.rows.push({ id, keys: keys.length, rows: nr, ring: rn, rec: rk.length, tdiff, vdiff, last, chunks, auto: !!A.recAuto });
}

// units: the same rules as the scope (scope.js is loaded without a page: its class only)
out.units = { n: 0, diff: [] };
try {
  global.PlotCore = require(W + '/plotcore.js'); require(W + '/scope.js'); const Scope = globalThis.Scope;
  for (const t of Tutorials.list) { let s; try { s = new MNA.Sim(build(t.id), {}); } catch (e) { continue; }
    for (const k of s.keys) { out.units.n++; const a = Study.unitOf(k, s), b = Scope.unitOf(k, s); if (a !== b) out.units.diff.push([t.id, k, a, b]); } }
} catch (e) { out.units.error = String(e.message || e); }

// netlist
out.netlist = [];
for (const id of ['buck', 'line_fd', 'ieee9_emt', 'blocks_loop']) {
  const s = new MNA.Sim(build(id), {}), nl = Study.netlist(s, { L1: { hash: 'x' } }), txt = Study.netlistText(nl, id), js = JSON.stringify(nl);
  const state = nl.elements.filter(e => Object.keys(e).some(k => /now$|^(Ih|Ihm|iE|vm|q|H|g|J|i1|v1|vPrev|iPrev|evOn)$/.test(k))).length;
  out.netlist.push({ id, nodes: nl.nodes.length, nets: s.net.nets.filter(n => n.index >= 0).length, elements: nl.elements.length, els: s.net.els.length,
    parts: nl.parts.length, byId: s.net.byId.size, blocks: nl.blocks.length, sigBlocks: (s.net.sig.blocks || []).length, unknowns: nl.unknowns, n: s.n,
    state, json: js.length, end: /\n\.END\n$/.test(txt), lines: txt.split('\n').length, model: nl.elements.filter(e => e.model).length, roundtrip: JSON.stringify(JSON.parse(js)) === js });
}

// auto (343.4)
out.auto = [];
for (const [id, mod] of [['big_grid', null], ['big_grid', 3], ['big_grid', 'all'], ['big_grid', 'watched'], ['buck', null], ['b4dcs2', null]]) {
  const pr = build(id); if (mod === 3) pr.version = 3; else if (mod) pr.solve = { ...(pr.solve || {}), rec: mod };
  const s = new MNA.Sim(pr, {}); s.run(40 * s.h);
  out.auto.push({ id, mod, version: pr.version, keys: s.keys.length, rec: s.recKeys.length, auto: !!s.recAuto, mode: s.recMode(), now: s.keys.map(k => s.now(k)) });
}
{ const base = out.auto[2].now; for (const a of out.auto) if (a.id === 'big_grid') a.same = a.now.every((v, i) => Object.is(v, base[i]));
  // for tools/verify.py: one channel that «Αυτόματα» does not record, from now() in both modes
  const s = new MNA.Sim(build('big_grid'), {}), j = s.keys.findIndex(k => k.startsWith('I:') && !s.chIndex.has(k));
  out.ref = { key: s.keys[j], auto: out.auto[0].now[j], all: base[j] };
  for (const a of out.auto) delete a.now; }

// the order of the page: the project without its scope (the page keeps the channels in its scope), the scope adds them
// with watchAdd after the build; with the memory of the scope (opts.mem) the record stays within it; a change to 'all'
// and back takes effect (5.0)
{ const pr = build('big_grid'), keys = (pr.scope?.panes || []).flatMap(q => (Array.isArray(q) ? q : q.ch || []).map(c => Array.isArray(c) ? c[0] : c.key || c));
  const bare = { ...pr }; delete bare.scope;
  const s = new MNA.Sim(bare, { mem: 128 }), r0 = s.recKeys.length; s.watchAdd(keys); s.run(20 * s.h);
  const a = { r0, rec: s.recKeys.length, cap: s.ring.cap, bytes: s.ring.cap * (4 * s.recKeys.length + 9), mem: 128 * 1048576, opts: Array.isArray(s.opts.watch) };
  const t = s.now(s.recKeys[0]), last = s.ring.d[((s.ring.head - 1 + s.ring.cap) % s.ring.cap) * s.ring.nch];
  a.last = Object.is(Math.fround(t), last);
  s.load({ ...bare, solve: { ...(bare.solve || {}), rec: 'all' } }, false); a.all = s.recKeys.length;
  s.load(bare, false); a.back = s.recKeys.length;
  out.page = a; }

// lines: the model from its JSON (as the folder gives it back) against the model of the project
out.lines = [];
for (const id of ['line_fd', 'cable_fd']) {
  const pr = build(id), pr2 = JSON.parse(JSON.stringify(pr)); let n = 0;
  for (const c of pr2.components) if (c.type === 'TLM' && c.params?.mdl) { c.params.mdl = JSON.stringify(JSON.parse(c.params.mdl)); n++; }
  const a = new MNA.Sim(pr, {}), b = new MNA.Sim(pr2, {}); a.run(300 * a.h); b.run(300 * b.h);
  const ms = Study.lineModels(a);
  out.lines.push({ id, models: n, found: ms.length, src: ms.every(m => typeof m.src === 'string' && m.src.length > 0),
    same: a.keys.every(k => Object.is(a.now(k), b.now(k))), keys: a.keys.length });
}
process.stdout.write(JSON.stringify(out));
