// 4.24 (THEORY §8Ι.7): a network split in subnetworks at its lines (web/studio/split.js), multirate, and the other pieces of
// 4.24 (the exciter of the reference book in ieee9_emt, the other names of a part in the library). Usage: node split_cases.js -> JSON
//  parts:    the subnetworks and the cut lines of some tutorials
//  bits:     the groups in one thread against one simulator: every recorded channel, its times and its values, bit for bit
//  workers:  the same with each group in a Worker (worker_threads), links in shared memory
//  events:   a switching in one group (the fault of big_grid): the same bits before it, a difference within the error after it
//  rates:    multirate on multirate_lines against the run with the small step everywhere and the run with the large one
//  avr:      ieee9_emt with the full data and the exciter of the book on generator 2 (the slip of generators 2 and 3)
//  library:  the grid equivalent found by «πηγή» and «βραχυκύκλωσης»
const path = require('path'); const W = path.resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); global.Expr = require(W + '/expr.js'); global.StepCheck = require(W + '/stepcheck.js');
global.LineModels = require(W + '/linemodels.js'); for (const f of ['netlib', 'subcircuit', 'bus', 'units', 'nn']) require(W + '/' + f + '.js');
require(W + '/sparse.js'); require(W + '/kernels.js'); const MNA = global.MNA = require(W + '/mna.js'); require(W + '/tutorials.js');
const Split = require(W + '/split.js'), Library = require(W + '/library.js');
const build = (id, o) => { const t = Tutorials.get(id), opts = { ...Object.fromEntries((t.options || []).map(q => [q.k, q.def])), ...(o || {}) }; return t.build(opts); };
const ring = (s, k) => { const R = s.ring, i = s.chIndex.get(k), t = [], v = []; for (let q = 0; q < R.n; q++) { const a = (R.head - R.n + q + R.cap) % R.cap; t.push(R.t[a]); v.push(R.d[a * R.nch + i]); } return { t, v }; };
const interp = (T, V, x) => { let lo = 0, hi = T.length - 1; if (x <= T[0]) return V[0]; if (x >= T[hi]) return V[hi]; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= x) lo = m; else hi = m; } return V[lo] + (V[hi] - V[lo]) * (x - T[lo]) / (T[hi] - T[lo]); };
// a split result against one simulator, channel by channel
function compare(one, ch) {
  const R = one.ring, ix = one.chIndex; let n = 0, nan = 0, tdiff = 0, diff = 0, firstT = Infinity;
  for (const [k, c] of ch) { const i = ix.get(k); if (i === undefined) continue; n++; if (c.bad) { nan++; continue; }
    if (c.t.length !== R.n) tdiff++;
    for (let q = 0; q < Math.min(R.n, c.t.length); q++) { const a = (R.head - R.n + q + R.cap) % R.cap;
      if (c.t[q] !== R.t[a]) { tdiff++; firstT = Math.min(firstT, R.t[a]); break; }
      if (!Object.is(c.v[q], R.d[a * R.nch + i])) { diff++; firstT = Math.min(firstT, R.t[a]); break; } } }
  return { n, nan, tdiff, diff, firstT: Number.isFinite(firstT) ? firstT : null, rec: one.recKeys.length };
}
const out = {};
// ---------------------------------------------------------------- parts
{
  const rows = [];
  for (const [id, o] of [['twave', {}], ['gis765_lv', {}], ['hvdc_mmc', {}], ['line_fd', {}], ['cable_xb', {}], ['big_grid', { k: '4' }], ['big_grid', { k: '4', line: 'tl' }], ['multirate_lines', {}]]) {
    const pr = build(id, o), s = new MNA.Sim(pr, { hDiv: pr.sim?.hDiv }), P = Split.partition(s), pl = Split.plan(s, { groups: 2 });
    rows.push({ id, o, n: s.n, parts: P.parts.length, withEls: P.parts.filter(q => q.nEl > 0).length, cuts: P.cuts.length, groups: pl.groups.length, cutsBetween: pl.cuts.length,
      tsOverH: P.cuts.length ? Math.min(...P.cuts.map(c => c.ts / s.h)) : null, proposal: Split.proposal(s) });
  }
  out.parts = rows;
}
// ---------------------------------------------------------------- bits (one thread)
{
  const rows = [];
  for (const [id, o, steps] of [['twave', {}, 1500], ['arrester', {}, 1500], ['lossline', {}, 1500], ['gis765_lv', {}, 1500], ['insco_study', {}, 1500], ['line_fd', {}, 1500], ['cable_fd', {}, 1500],
    ['cable_xb', {}, 1500], ['hvdc_mmc', {}, 1500], ['big_grid', { k: '4', ev: 'none', line: 'tl' }, 600], ['multirate_lines', {}, 1500]]) {
    const pr = build(id, o), so = { hDiv: pr.sim?.hDiv }, one = new MNA.Sim(pr, so), T = steps * one.h; one.runUntil(T);
    for (const G of [2, 99]) { const r = Split.serial(pr, { sim: so, tEnd: T, groups: G });
      // the foreign unknowns of a group are NaN after a step (a part never reads another part's unknowns)
      const fn = r.sims.map(s => s.splitForeign.length ? Number.isNaN(s.x[s.splitForeign[0]]) : true).every(Boolean);
      rows.push({ id, G, groups: r.plan.groups.length, cuts: r.plan.cuts.length, foreignNaN: fn, hSame: r.sims.every(s => s.h === one.h && s.T === one.T), ...compare(one, r.channels) }); }
  }
  out.bits = rows;
}
// ---------------------------------------------------------------- workers
(async () => {
  const rows = [];
  for (const [id, o, steps] of [['gis765_lv', {}, 1500], ['cable_fd', {}, 1500], ['hvdc_mmc', {}, 900], ['big_grid', { k: '8', ev: 'none', line: 'tl' }, 400]]) {
    const pr = build(id, o), so = { hDiv: pr.sim?.hDiv }, one = new MNA.Sim(pr, so), T = steps * one.h; one.runUntil(T);
    const r = await Split.workers(pr, { sim: so, tEnd: T, groups: 2, workerFile: path.join(W, 'split_worker.js') });
    rows.push({ id, groups: r.stats.groups, ...compare(one, r.channels) });
  }
  out.workers = rows;
  // ---------------------------------------------------------------- events
  {
    const pr = build('big_grid', { k: '4', ev: 'fault', line: 'tl' }), so = { hDiv: pr.sim?.hDiv }, one = new MNA.Sim(pr, so), T = 0.08; one.runUntil(T);
    const r = Split.serial(pr, { sim: so, tEnd: T, groups: 2 }), c = compare(one, r.channels);
    // after the fault: the largest difference of every voltage and current at the times of the one simulator, against the
    // largest value of the same kind; and the same for one simulator with half the step (its own error)
    const half = new MNA.Sim(pr, { hDiv: 2 * pr.sim.hDiv }); half.runUntil(T);
    // (rms over 40–80 ms, and the largest difference away from the switching instant: 1 ms after it)
    const kinds = { V: [0, 0, 0, 0, 0, 0], I: [0, 0, 0, 0, 0, 0] };
    for (const [k, ch] of r.channels) { const kd = k[0]; if (!(kd in kinds) || !one.chIndex.has(k) || ch.bad) continue; const a = ring(one, k), b = ring(half, k), t = Array.from(ch.t), v = Array.from(ch.v), K = kinds[kd];
      for (const x of a.v) K[0] = Math.max(K[0], Math.abs(x));
      for (let q = 0; q < a.t.length; q++) { if (a.t[q] < 0.04) continue; const ds = interp(t, v, a.t[q]) - a.v[q], dh = interp(b.t, b.v, a.t[q]) - a.v[q];
        K[1] += ds * ds; K[2] += dh * dh; K[3]++; if (a.t[q] > 0.041) { K[4] = Math.max(K[4], Math.abs(ds)); K[5] = Math.max(K[5], Math.abs(dh)); } } }
    const f = K => ({ rmsSplit: Math.sqrt(K[1] / K[3]) / K[0], rmsHalf: Math.sqrt(K[2] / K[3]) / K[0], maxSplit: K[4] / K[0], maxHalf: K[5] / K[0] });
    out.events = { ...c, V: f(kinds.V), I: f(kinds.I) };
  }
  // ---------------------------------------------------------------- rates
  {
    const fine = build('multirate_lines', { step: 'fine' }), coarse = build('multirate_lines', { step: 'coarse' }), so = p => ({ hDiv: p.sim.hDiv }), T = fine.sim.stopT;
    const F = new MNA.Sim(fine, so(fine)); F.runUntil(T); const Cs = new MNA.Sim(coarse, so(coarse)); Cs.runUntil(T);
    const err = (ref, c) => { let mx = 0, sq = 0, sc = 0; for (const x of ref.v) sc = Math.max(sc, Math.abs(x)); for (let q = 0; q < c.t.length; q++) { const d = c.v[q] - interp(ref.t, ref.v, c.t[q]); mx = Math.max(mx, Math.abs(d)); sq += d * d; } return { max: mx / sc, rms: Math.sqrt(sq / c.t.length) / sc }; };
    const res = { fineSteps: F.steps, coarseSteps: Cs.steps, h: F.h, coarse: {}, smooth: {} };
    const keys = ['V:C1', 'V:L1', 'V:L2', 'I:L1', 'I:L2', 'I:L3'];
    for (const k of keys) res.coarse[k] = err(ring(F, k), ring(Cs, k));
    for (const sm of ['none', 'avg', 'area']) { const M = Split.serial(fine, { sim: so(fine), tEnd: T, rates: 'auto', smooth: sm }); const e = {};
      for (const k of keys) { const c = M.channels.get(k); e[k] = err(ring(F, k), { t: Array.from(c.t), v: Array.from(c.v) }); }
      res.smooth[sm] = { err: e, steps: M.stats.steps, h: M.stats.h, rates: Array.from(M.plan.rate), groups: M.plan.groups.map(g => g.m) }; }
    out.rates = res;
  }
  // ---------------------------------------------------------------- avr (decision 343)
  {
    const rows = [];
    for (const ctl of ['none', 'book', 'avr']) { const pr = build('ieee9_emt', { ev: 'full', ctl }), s = new MNA.Sim(pr, { hDiv: pr.sim?.hDiv });
      const w = x => ((x + 180) % 360 + 360) % 360 - 180; let s21 = null, s31 = null, mxE = 0, mx21 = -Infinity; const dt = 0.002;
      for (let t = 0; t < 2 - 1e-9; t += dt) { s.run(dt); const d21 = w(s.now('Y:G2:d') - s.now('Y:G1:d')), d31 = w(s.now('Y:G3:d') - s.now('Y:G1:d'));
        if (s21 === null && Math.abs(d21) > 170) s21 = s.t; if (s31 === null && Math.abs(d31) > 170) s31 = s.t; mx21 = Math.max(mx21, d21); if (ctl !== 'none') mxE = Math.max(mxE, s.now('Y:AV2/EFD')); }
      rows.push({ ctl, slip21: s21, slip31: s31, maxEfd2: mxE, max21: mx21, avrs: pr.components.filter(c => c.type === 'AVR').map(c => c.id) }); }
    out.avr = rows;
  }
  // ---------------------------------------------------------------- library
  {
    const find = q => Library.view('field', Parts.PARTS, { q }).flatMap(g => g.sub.flatMap(s => s.items));
    out.library = { pigi: find('πηγή'), sk: find('βραχυκύκλωσης'), three: find('τριφασική πηγή'), fault: find('σφάλμα') };
  }
  process.stdout.write(JSON.stringify(out));
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
