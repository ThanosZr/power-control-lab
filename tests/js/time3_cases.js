// 4.23 (THEORY §8Ι.5, «χρόνος, μέρος 3»): the record of the watched channels only, the base of a refactorization from the
// memory of factors, the WebAssembly kernel of the solve. Usage: node time3_cases.js -> JSON
//  watch:  a watched record against the full one: the same bits in the record and the statistics of every watched channel,
//          now() of a channel that is not recorded equal to the full one, watchAdd keeps the record and starts the new one
//  base:   solve.refBase 'cache' (the default) against 'last' (as up to 4.22): the same bits, fewer columns computed again
//  kernel: the WebAssembly solve against sparse.js: the same bits, in random systems and in tutorials
const path = require('path'), crypto = require('crypto'); const W = path.resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); global.Expr = require(W + '/expr.js'); global.StepCheck = require(W + '/stepcheck.js');
global.LineModels = require(W + '/linemodels.js'); for (const f of ['netlib', 'subcircuit', 'bus', 'units', 'nn']) require(W + '/' + f + '.js');
const SP = require(W + '/sparse.js'), K = require(W + '/kernels.js'), MNA = global.MNA = require(W + '/mna.js'); require(W + '/tutorials.js');
const build = (id, o) => { const t = Tutorials.get(id), opts = { ...Object.fromEntries((t.options || []).map(q => [q.k, q.def])), ...(o || {}) }; return t.build(opts); };
const scopeKeys = pr => { const ks = []; for (const p of pr.scope?.panes || []) for (const c of (Array.isArray(p) ? p : p.ch || [])) ks.push(Array.isArray(c) ? c[0] : c.key || c); return ks; };
const md5 = a => crypto.createHash('md5').update(Buffer.from(Float64Array.from(a).buffer)).digest('hex');
const hashRun = (pr, opts, steps) => { const s = new MNA.Sim(pr, { hDiv: pr.sim?.hDiv, ...opts }); const h = crypto.createHash('md5'); const rec = s.recordNow.bind(s);
  s.recordNow = function () { rec(); h.update(Buffer.from(new Float64Array([s.t]).buffer)); h.update(Buffer.from(Float64Array.from(s.vals).buffer)); };
  const T = steps * s.h; while (s.t < T - 1e-15) s.run(Math.min(37 * s.h, T - s.t)); return { s, hash: h.digest('hex') }; };
const out = {};
// ---------------------------------------------------------------- watch
{
  const ids = ['buck', 'ieee9_emt', 'hvdc_lcc', 'gfm_island', 'blocks_loop', 'gis765_lv'], rows = [];
  for (const id of ids) {
    const pr = build(id), keys = scopeKeys(pr), full = new MNA.Sim(pr, { hDiv: pr.sim?.hDiv }), wat = new MNA.Sim(pr, { hDiv: pr.sim?.hDiv, watch: keys });
    const steps = 1500, T = steps * full.h; for (const s of [full, wat]) while (s.t < T - 1e-15) s.run(Math.min(37 * s.h, T - s.t));
    let ringBad = 0, perBad = 0, nowBad = 0;
    for (const k of wat.recKeys) {
      const i = full.chIndex.get(k), j = wat.chIndex.get(k), R = full.ring, Q = wat.ring;
      for (let q = 0; q < R.n; q++) { const a = (R.head - R.n + q + R.cap) % R.cap, b = (Q.head - Q.n + q + Q.cap) % Q.cap; if (!Object.is(R.d[a * R.nch + i], Q.d[b * Q.nch + j]) || R.t[a] !== Q.t[b]) ringBad++; }
      for (const f of ['avg', 'min', 'max', 'rms', 'end']) { const A = full.per[f], B = wat.per[f]; for (let q = 0; q < full.per.n; q++) if (!Object.is(A[q * full.per.nch + i], B[q * wat.per.nch + j])) perBad++; }
    }
    const other = full.keys.filter(k => !wat.chIndex.has(k)).slice(0, 40);
    for (const k of other) if (!Object.is(full.now(k), wat.now(k))) nowBad++;
    rows.push({ id, keys: full.keys.length, rec: wat.recKeys.length, nch: wat.ring.nch, ringN: wat.ring.n, perN: wat.per.n, samePerN: full.per.n === wat.per.n, ringBad, perBad, other: other.length, nowBad, hasKey: other.every(k => wat.hasKey(k)) });
  }
  // watchAdd in the middle of a run: the record of before stays, the new channel starts with the values of the full run
  const pr = build('buck'), keys = scopeKeys(pr), full = new MNA.Sim(pr, { hDiv: pr.sim?.hDiv }), wat = new MNA.Sim(pr, { hDiv: pr.sim?.hDiv, watch: keys });
  const T1 = 600 * full.h; for (const s of [full, wat]) while (s.t < T1 - 1e-15) s.run(Math.min(37 * s.h, T1 - s.t));
  const nOld = wat.ring.n, newKey = full.keys.find(k => k.startsWith('I:') && !wat.chIndex.has(k)), added = wat.watchAdd([newKey]);
  const T2 = 1200 * full.h; for (const s of [full, wat]) while (s.t < T2 - 1e-15) s.run(Math.min(37 * s.h, T2 - s.t));
  const R = full.ring, Q = wat.ring, i = full.chIndex.get(newKey), j = wat.chIndex.get(newKey); let before = 0, after = 0, afterBad = 0, keptBad = 0;
  for (let q = 0; q < Q.n; q++) { const b = (Q.head - Q.n + q + Q.cap) % Q.cap, a = (R.head - R.n + q + R.cap) % R.cap, v = Q.d[b * Q.nch + j];
    if (q < nOld) { if (Number.isNaN(v)) before++; } else { after++; if (!Object.is(v, R.d[a * R.nch + i])) afterBad++; }
    const k0 = keys.find(k => wat.chIndex.has(k)); if (k0 && !Object.is(Q.d[b * Q.nch + wat.chIndex.get(k0)], R.d[a * R.nch + full.chIndex.get(k0)])) keptBad++; }
  out.watch = { rows, add: { added, nOld, before, after, afterBad, keptBad, opts: wat.opts.watch.length } };
}
// ---------------------------------------------------------------- base of the refactorization
{
  const rows = [];
  for (const [id, o, steps] of [['hvdc_lcc', {}, 3000], ['b4dcs2', {}, 2000], ['hvdc_gfm', {}, 2000], ['big_grid', { k: '8' }, 2200]]) {
    const pr = build(id, o), a = hashRun({ ...pr, solve: { ...(pr.solve || {}), refBase: 'last' } }, {}, steps), b = hashRun(pr, {}, steps);
    const sa = a.s.solverInfo().stats, sb = b.s.solverInfo().stats;
    rows.push({ id, same: a.hash === b.hash, re: [sa.re, sb.re], cols: [sa.cols, sb.cols], full: [sa.full, sb.full], base: sb.base, n: b.s.n });
  }
  out.base = rows;
}
// ---------------------------------------------------------------- the WebAssembly kernel
{
  const avail = K.available(); let bad = 0, systems = 0;
  for (const n of [5, 40, 300, 2000]) {
    const keys = []; for (let i = 0; i < n; i++) { keys.push(i * n + i); for (const d of [1, 4, 9]) if (i + d < n) { keys.push(i * n + i + d); keys.push((i + d) * n + i); } }
    const P = SP.pattern(n, keys), Ax = new Float64Array(P.nnz); for (let j = 0; j < n; j++) for (let p = P.Ap[j]; p < P.Ap[j + 1]; p++) Ax[p] = P.Ai[p] === j ? 7 + Math.sin(j) : Math.cos(3 * p + j) / 3;
    const F = SP.lu(P, Ax, SP.order(P), 0.1), S = new K.Solver();
    for (let r = 0; r < 4; r++) { const b = Float64Array.from({ length: n }, (_, i) => Math.sin(i * 1.3 + r)), c = b.slice(); SP.solve(F, b); S.solve(F, c); systems++; if (!b.every((v, i) => Object.is(v, c[i]))) bad++; }
  }
  const rows = [];
  for (const [id, o, steps] of [['hvdc_lcc', {}, 1500], ['big_grid', { k: '8' }, 1200], ['ieee9_emt', {}, 1500]]) {
    const pr = build(id, o), a = hashRun(pr, { kernel: 'js' }, steps), b = hashRun(pr, { kernel: 'wasm' }, steps);
    rows.push({ id, same: a.hash === b.hash, sparse: b.s.sparse, kernel: [a.s.solverInfo().kernel, b.s.solverInfo().kernel], n: b.s.n });
  }
  const auto = ['4', '16', '24'].map(k => new MNA.Sim(build('big_grid', { k }), { watch: [] }).solverInfo());
  out.kernel = { avail, systems, bad, rows, auto: auto.flatMap(a => [a.n, a.kernel]) };
}
console.log(JSON.stringify(out));
