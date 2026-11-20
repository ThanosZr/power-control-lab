// 5.0.1 (ROADMAP §92, THEORY §8ΩΖ): the saturable core: the curve, the open-circuit test in rms values, the nonlinear inductor
// (LSAT), the transformer with a saturable core (XFMR, XF3 in every group), the residual flux held until the core is excited,
// the steady start, and the circuits for the SciPy solver (engine/batch.py). Usage: node sat_cases.js -> JSON
//  curve    Parts.magChar: i(ψ) and ψ(i) on and between the points, odd; the errors of a curve that is not monotonic
//  rms      Parts.magRms: a curve -> its mean square under ψ = Ψ·sin θ (exact, per segment) -> back to the curve; and the
//           mean squares of the result by a midpoint rule on 200 000 points (a second quadrature)
//  same     the default (linear core, branch in the middle, 50 % of the leakage on side 1) gives the netlist of before, the
//           same netlist with the options set to their defaults explicitly
//  linear   a saturable core whose knee is never reached against the linear L_m: the same numbers to rounding
//  ideal    LSAT across an ideal source v = V·sin ωt: ψ(T/2) = ψ₀ + 2V/ω exactly (the trapezoidal rule of a sine), i from the
//           curve minus the holding current, with A = ∫|v|dt = 2V/ω
//  rl       LSAT behind R from v = V·sin ωt, ψ₀ = 0: the first peak of the current (an independent closed form per
//           segment in test_sat.py)
//  hold     LSAT with a residual flux behind an open switch: the flux stays (no current at ψ₀); XF3 energized at t = 0 with
//           residual fluxes: the first step starts from them, with no current in the windings before
//  groups   XF3 in each of the 13 groups with residual flux, energized at t = 0: it runs, the largest magnetizing current
//           against the rated peak, and after a second the holding currents are 0 (the hold is gone)
//  ss       solve.init 'ac' with a saturable XF3 (no residual flux): the core starts on its first slope, the flux of the first
//           period without DC (max ≈ −min) and with the rated amplitude
//  errs     the messages: X_ac below the leakage to the branch, a table that is not monotonic, an open-circuit test
//           below its loss current
//  modes    the same energization with the trapezoidal rule (reference, small step), backward Euler, BDF2 and the variable step
//  snap     a snapshot in the middle of an inrush: the run that continues from it gives the same bits
//  batch    circuits for the SciPy solver with the browser's results on a fine step (LSAT, XFMR at side 1 and 2, XF3)
const path = require('path'); const W = path.resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); global.Expr = require(W + '/expr.js'); global.StepCheck = require(W + '/stepcheck.js'); global.LineModels = require(W + '/linemodels.js');
for (const f of ['netlib', 'subcircuit', 'bus', 'units', 'nn']) require(W + '/' + f + '.js'); require(W + '/tutorials.js');
require(W + '/sparse.js'); const MNA = require(W + '/mna.js'); const P = global.Parts;
const out = {};
function project(comps, conns, step = 2e-5, extra = {}) {
  let n = 0; return { version: 4, components: comps.map(c => ({ x: 0, y: 0, rot: 0, ...c })),
    wires: conns.map(([a, b]) => { const [ac, ap] = a.split(':'), [bc, bp] = b.split(':'); return { id: 'w' + (n++), a: { c: ac, p: ap }, b: { c: bc, p: bp }, pts: [] }; }), solve: { step }, ...extra };
}
const three = (a, b, s1 = '', s2 = '') => ['a', 'b', 'c'].map(x => [`${a}:${x}${s1}`, `${b}:${x}${s2}`]);
const ser = v => JSON.stringify(v, (k, x) => typeof x === 'function' ? undefined : ArrayBuffer.isView(x) ? Array.from(x) : x);
const netOf = prj => { const n = MNA.buildNetlist(prj); return ser({ els: n.els, size: n.size, nNodes: n.nNodes }); };
const run = (prj, T, keys, opts = {}, every = 1) => { const s = new MNA.Sim(prj, { h: prj.solve.step, ...opts }), rec = [], h = s.h; let k = 0;
  while (s.t < T - 1e-12) { s.run(h); if (k++ % every === 0) rec.push([s.t, ...keys.map(q => s.now(q))]); } return { s, rec }; };

// ---------------------------------------------------------------- curve
{ const c = P.magChar([[0.01, 1], [0.1, 1.2]], 0.2), o = { L0: c.L0, Lend: c.Lend, pts: [] };
  for (const psi of [0, 0.3, 1, 1.1, 1.2, 1.5, -0.7, -1.3]) { const q = c.cur(psi); o.pts.push([psi, q.i, q.g, c.inv(q.i)]); }
  o.err = [P.magChar([[0.1, 1], [0.05, 1.2]], 0).err, P.magChar([[0.1, 1], [0.2, 0.9]], 0).err, P.magChar([], 0).err];
  out.curve = o; }

// ---------------------------------------------------------------- rms
{ const pts = [[0.004, 0.9], [0.007, 1.0], [0.02, 1.1], [0.09, 1.2], [0.5, 1.3]], ch = P.magChar(pts, 0.3);
  const rows = pts.map(([, f]) => [Math.sqrt(2 * P.magMeanSq(ch.I, ch.F, ch.s, ch.N, f)), f]), r = P.magRms(rows), c2 = P.magChar(r.pts, 0.3);
  const mid = Psi => { const N = 200000; let s = 0; for (let k = 0; k < N; k++) { const th = (k + 0.5) * (Math.PI / 2) / N, i = c2.cur(Psi * Math.sin(th)).i; s += i * i; } return s / N; };
  out.rms = { pts, back: r.pts, rows, check: rows.map(([I, U]) => [I * I / 2, mid(U)]), err: P.magRms([[0.5, 1], [0.4, 1.1]]).err }; }

// ---------------------------------------------------------------- same
{ const X = { grp: 'Dyn11', Sn: 40e6, U1: 150e3, U2: 20e3, uk: 10, Pk: 200e3, i0: 0.5, P0: 20e3 };
  const net = x => netOf(project([{ id: 'G1', type: 'GRID3', params: { Un: 150e3, Sk: 5e9, XR: 10 } }, { id: 'T1', type: 'XF3', params: x }, { id: 'L1', type: 'LOAD3', params: { Un: 20e3, P: 5e6, Q: 1e6 } }],
    [...three('G1', 'T1', '', '1'), ...three('T1', 'L1', '2', '')]));
  const xfmr = x => netOf(project([{ id: 'V1', type: 'VAC', params: { Vpk: 325 } }, { id: 'T1', type: 'XFMR', params: { n: 0.5, Lm: 1, Llk1: 1e-3, Llk2: 2e-4, R1: 0.1, R2: 0.02, ...x } }, { id: 'R1', type: 'R', params: { R: 10 } }, { id: 'G', type: 'GND' }],
    [['V1:p', 'T1:p1'], ['V1:n', 'G:g'], ['T1:p2', 'G:g'], ['T1:s1', 'R1:a'], ['R1:b', 'G:g'], ['T1:s2', 'G:g']]));
  out.same = { xf3: net(X) === net({ ...X, sat: 'lin', mpos: 'mid', xs1: 50, psiK: 1.3, psiRa: 0.5 }), xfmr: xfmr({}) === xfmr({ sat: 'lin', mpos: 'mid', psiK: 0.3, psi0: 0.1 }),
    xf3split: net(X) !== net({ ...X, xs1: 80 }), xf3pos: net(X) !== net({ ...X, mpos: 'w2' }) }; }

// ---------------------------------------------------------------- linear
{ const w = 2 * Math.PI * 50, Lm = 10e3 / w / 0.5, mk = sat => project([{ id: 'V1', type: 'VAC', params: { Vpk: 10e3, f: 50, Rs: 0.5, Ls: 5e-3 } },
    { id: 'T1', type: 'XFMR', params: { n: 0.1, Lm, Llk1: 0.02, Llk2: 2e-4, R1: 0.3, R2: 0.003, ...(sat ? { sat: 'sat', psiK: 1e3, Lair: 0.15 } : {}) } },
    { id: 'R2', type: 'R', params: { R: 200 } }, { id: 'G', type: 'GND' }], [['V1:p', 'T1:p1'], ['V1:n', 'G:g'], ['T1:p2', 'G:g'], ['T1:s1', 'R2:a'], ['R2:b', 'G:g'], ['T1:s2', 'G:g']]);
  const keys = ['I:T1', 'I2:T1', 'Im:T1', 'V2:T1'], a = run(mk(false), 0.06, keys).rec, b = run(mk(true), 0.06, keys).rec;
  out.linear = keys.map((k, j) => { let m = 0, sc = 0; for (let i = 0; i < a.length; i++) { m = Math.max(m, Math.abs(a[i][j + 1] - b[i][j + 1])); sc = Math.max(sc, Math.abs(a[i][j + 1])); } return [k, m / sc]; }); }

// ---------------------------------------------------------------- ideal
{ const V = 100, w = 2 * Math.PI * 50, o = [];
  for (const psi0 of [0, 0.25, -0.25]) for (const h of [2e-5, 1e-5]) {
    const prj = project([{ id: 'V1', type: 'VAC', params: { Vpk: V, f: 50 } }, { id: 'L1', type: 'LSAT', params: { tab: '0.5: 0.3, 2: 0.35', Lair: 0.002, init: 'psi0', psi0 } }, { id: 'G', type: 'GND' }],
      [['V1:p', 'L1:a'], ['L1:b', 'G:g'], ['V1:n', 'G:g']], h);
    const s = new MNA.Sim(prj, { h }); while (s.t < 0.01 - 1e-12) s.run(h);
    o.push({ psi0, h, t: s.t, psi: s.now('PSIm:L1'), i: s.now('I:L1'), A: s.net.els.find(e => e.sat).sat.A }); }
  out.ideal = { V, w, tab: [[0.5, 0.3], [2, 0.35]], Lair: 0.002, runs: o }; }

// ---------------------------------------------------------------- rl
{ const V = 100, R = 5, h = 1e-6;
  const prj = project([{ id: 'V1', type: 'VAC', params: { Vpk: V, f: 50 } }, { id: 'R1', type: 'R', params: { R } }, { id: 'L1', type: 'LSAT', params: { tab: '0.5: 0.3', Lair: 0.002, init: 'psi0', psi0: 0 } }, { id: 'G', type: 'GND' }],
    [['V1:p', 'R1:a'], ['R1:b', 'L1:a'], ['L1:b', 'G:g'], ['V1:n', 'G:g']], h);
  const { rec } = run(prj, 0.02, ['I:L1']); let pk = 0, tp = 0; for (const [t, i] of rec) if (i > pk) { pk = i; tp = t; }
  out.rl = { V, R, f: 50, I1: 0.5, F1: 0.3, Lair: 0.002, peak: pk, tpeak: tp }; }

// ---------------------------------------------------------------- hold, groups
const GROUPS = ['Yy0', 'YNyn0', 'Yyn0', 'YNy0', 'Yd1', 'Yd11', 'YNd1', 'YNd11', 'Dy1', 'Dy11', 'Dyn1', 'Dyn11', 'Dd0'];
// energized at t = 0 by the network (the three poles at once), v_a = 0 then: a breaker that starts open would be latched by
// the start of the solver where its voltage is positive (a thyristor pair), so the energization here has none
const xfEnergize = (grp, extra = {}, load = true) => { const X = { grp, Sn: 40e6, U1: 150e3, U2: 20e3, uk: 10, Pk: 100e3, i0: 0.5, P0: 20e3, sat: 'two', psiK: 1.2, psiRa: 0.8, psiRb: -0.8, psiRc: 0, ...extra };
  return project([{ id: 'G1', type: 'GRID3', params: { Un: 150e3, Sk: 5e9, XR: 10 } }, { id: 'T1', type: 'XF3', params: X },
    ...(load ? [{ id: 'L1', type: 'LOAD3', params: { Un: 20e3, P: 1e6, Q: 0.2e6 } }] : [])],
  [...three('G1', 'T1', '', '1'), ...(load ? three('T1', 'L1', '2', '') : [])], 2e-5); };
{ const o = {};
  { const prj = project([{ id: 'V1', type: 'VAC', params: { Vpk: 100, f: 50 } }, { id: 'S1', type: 'SW', params: { gate: 'off', Roff: 1e6, body: false } }, { id: 'L1', type: 'LSAT', params: { tab: '0.5: 0.3, 2: 0.35', Lair: 0.002, init: 'psi0', psi0: 0.25 } }, { id: 'G', type: 'GND' }],
      [['V1:p', 'S1:d'], ['S1:s', 'L1:a'], ['L1:b', 'G:g'], ['V1:n', 'G:g']], 2e-5);
    const { rec } = run(prj, 0.05, ['PSIm:L1', 'I:L1']); o.lsat = { psi0: 0.25, psi: [Math.min(...rec.map(r => r[1])), Math.max(...rec.map(r => r[1]))], i: Math.max(...rec.map(r => Math.abs(r[2]))) }; }
  for (const grp of ['YNd1', 'Dyn11']) { const ub = grp[0] === 'D' ? 150e3 : 150e3 / Math.sqrt(3), pb = Math.SQRT2 * ub / (2 * Math.PI * 50);
    const prj = xfEnergize(grp), s = new MNA.Sim(prj); const i0 = ['I:T1/Ta', 'I:T1/Tb', 'I:T1/Tc', 'Im:T1/Ta', 'Im:T1/Tb', 'Im:T1/Tc'].map(k => s.now(k));
    const p0 = ['PSIm:T1/Ta', 'PSIm:T1/Tb', 'PSIm:T1/Tc'].map(k => s.now(k)); s.run(s.h); const p1 = ['PSIm:T1/Ta', 'PSIm:T1/Tb', 'PSIm:T1/Tc'].map(k => s.now(k));
    o[grp] = { pb, i0, p0, p1, h: s.h }; }
  out.hold = { psiR: [0.8, -0.8, 0], ...o }; }
{ const o = {}, Ir = 40e6 / 3;
  for (const grp of GROUPS) { try { const ub = grp[0] === 'D' ? 150e3 : 150e3 / Math.sqrt(3), ipk = Math.SQRT2 * Ir / ub;
      const prj = xfEnergize(grp, {}, false), s = new MNA.Sim(prj), h = s.h, ki = ['Im:T1/Ta', 'Im:T1/Tb', 'Im:T1/Tc'];
      let mx = 0; while (s.t < 0.1 - 1e-12) { s.run(h); for (const k of ki) mx = Math.max(mx, Math.abs(s.now(k))); }
      while (s.t < 1.0 - 1e-12) s.run(h);
      o[grp] = { ipk, peak: mx, Ir: s.net.els.filter(e => e.sat).map(e => e.sat.Ir), A: s.net.els.filter(e => e.sat).map(e => e.sat.A / e.sat.Ar), warn: s.net.warnings }; }
    catch (e) { o[grp] = { err: String(e.message || e) }; } }
  out.groups = o; }

// ---------------------------------------------------------------- ss
{ const X = { grp: 'YNd11', Sn: 40e6, U1: 150e3, U2: 20e3, uk: 10, Pk: 100e3, i0: 0.5, P0: 20e3, sat: 'two', psiK: 1.2 };
  const prj = project([{ id: 'G1', type: 'GRID3', params: { Un: 150e3, Sk: 5e9, XR: 10 } }, { id: 'T1', type: 'XF3', params: X }, { id: 'L1', type: 'LOAD3', params: { Un: 20e3, P: 10e6, Q: 2e6 } }],
    [...three('G1', 'T1', '', '1'), ...three('T1', 'L1', '2', '')], 2e-5, { sim: { method: 'TR' } }); prj.solve.init = 'ac';
  const { rec } = run(prj, 0.02, ['PSIm:T1/Ta', 'Im:T1/Ta']); const ps = rec.map(r => r[1]);
  out.ss = { max: Math.max(...ps), min: Math.min(...ps), pb: Math.SQRT2 * 150e3 / Math.sqrt(3) / (2 * Math.PI * 50), imax: Math.max(...rec.map(r => Math.abs(r[2]))) }; }

// ---------------------------------------------------------------- errs
{ const err = x => { try { MNA.buildNetlist(xfEnergize('YNd1', x)); return null; } catch (e) { return { name: e.constructor.name, msg: String(e.message) }; } };
  out.errs = { xac: err({ Xac: 0.03 }), tab: err({ sat: 'tab', satTab: '0.1: 1, 0.05: 1.2' }), rms: err({ sat: 'rms', satRms: '0.001: 1', P0: 200e3 }), ok: err({ sat: 'rms' }), okTab: err({ sat: 'tab' }) }; }

// ---------------------------------------------------------------- modes
{ const keys = ['Im:T1/Ta', 'Im:T1/Tb', 'Im:T1/Tc'], peak = (o, step) => { const prj = xfEnergize('YNd1', {}, false); prj.solve.step = step;
    const s = new MNA.Sim(prj, { ...o, h: step }); let mx = [0, 0, 0]; while (s.t < 0.04 - 1e-12) { s.run(Math.min(s.h, 0.04 - s.t)); keys.forEach((k, j) => mx[j] = Math.max(mx[j], Math.abs(s.now(k)))); } return mx; };
  out.modes = { ref: peak({}, 2e-6), TR: peak({}, 2e-5), BE: peak({ method: 'BE' }, 2e-6), BDF2: peak({ method: 'BDF2' }, 2e-5), var: peak({ step: { mode: 'var' } }, 2e-5) }; }

// ---------------------------------------------------------------- snap
{ const keys = ['Im:T1/Ta', 'PSIm:T1/Tb', 'I:T1/Tc'], a = new MNA.Sim(xfEnergize('YNd1')); a.run(0.013); const st = JSON.parse(JSON.stringify(a.snapshot()));
  const b = MNA.resume(xfEnergize('YNd1'), st); a.run(0.01); b.run(0.01); out.snap = { a: keys.map(k => a.now(k)), b: keys.map(k => b.now(k)), same: keys.every(k => Object.is(a.now(k), b.now(k))) }; }

// ---------------------------------------------------------------- batch (SciPy, engine/batch.py)
{ const cases = [];
  const add = (name, prj, keys, T, h) => { prj.solve.step = h; const { rec } = run(prj, T, keys, {}, Math.max(1, Math.round(2e-5 / h))); cases.push({ name, keys, T, rec, batch: MNA.exportForBatch(prj, keys) }); };
  const lsat = psi0 => project([{ id: 'V1', type: 'VAC', params: { Vpk: 100, f: 50 } }, { id: 'R1', type: 'R', params: { R: 5 } }, { id: 'L1', type: 'LSAT', params: { tab: '0.5: 0.3, 2: 0.35', Lair: 0.002, init: 'psi0', psi0 } }, { id: 'G', type: 'GND' }],
    [['V1:p', 'R1:a'], ['R1:b', 'L1:a'], ['L1:b', 'G:g'], ['V1:n', 'G:g']]);
  add('lsat', lsat(0.25), ['I:L1', 'V:L1', 'PSIm:L1'], 0.06, 2e-6);
  const w = 2 * Math.PI * 50, xfmr = mpos => project([{ id: 'V1', type: 'VAC', params: { Vpk: 10e3, f: 50, Rs: 0.5, Ls: 5e-3 } },
    { id: 'T1', type: 'XFMR', params: { n: 0.1, Lm: 10e3 / w / 0.5, Llk1: 0.02, Llk2: 2e-4, R1: 0.3, R2: 0.003, mpos, sat: 'sat', psiK: 1.15 * 10e3 / w, Lair: 0.15, psi0: 25 } },
    { id: 'R2', type: 'R', params: { R: 200 } }, { id: 'G', type: 'GND' }], [['V1:p', 'T1:p1'], ['V1:n', 'G:g'], ['T1:p2', 'G:g'], ['T1:s1', 'R2:a'], ['R2:b', 'G:g'], ['T1:s2', 'G:g']]);
  add('xfmr_w1', xfmr('w1'), ['I:T1', 'Im:T1', 'PSIm:T1', 'I2:T1'], 0.04, 1e-6);
  add('xfmr_w2', xfmr('w2'), ['I:T1', 'Im:T1', 'PSIm:T1', 'I2:T1'], 0.04, 1e-6);
  const xf3 = (mpos, grp) => project([{ id: 'G1', type: 'GRID3', params: { Un: 150e3, Sk: 5e9, XR: 10 } },
    { id: 'T1', type: 'XF3', params: { grp, Sn: 40e6, U1: 150e3, U2: 20e3, uk: 10, Pk: 100e3, i0: 0.5, P0: 20e3, sat: 'two', psiK: 1.2, psiRa: 0.8, psiRb: -0.8, psiRc: 0, mpos } },
    { id: 'L1', type: 'LOAD3', params: { Un: 20e3, P: 1e6, Q: 0.2e6 } }], [...three('G1', 'T1', '', '1'), ...three('T1', 'L1', '2', '')]);
  const k3 = ['Im:T1/Ta', 'Im:T1/Tb', 'Im:T1/Tc', 'PSIm:T1/Ta', 'PSIm:T1/Tb', 'PSIm:T1/Tc'];
  add('xf3_mid', xf3('mid', 'YNd1'), k3, 0.04, 2e-6);
  add('xf3_w2', xf3('w2', 'Dyn11'), k3, 0.04, 2e-6);
  out.batch = cases; }

process.stdout.write(JSON.stringify(out));
