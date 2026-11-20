// 5.0.1 (decision 355, THEORY §8ΩΖ.10): the line without distortion (TL, loss 'dl') and the CP line from data per mode
// (TLM, src 'modal', as the 'CP m-phase' of the EMTP). Usage: node cp_cases.js -> JSON
//  dl       TL without distortion, matched source, open end: the far voltage att·V on (τ, 3τ), att = e^(−R/2Z)
//  modal1   TLM with one mode, the same data: the same numbers as the TL (lumped R/4, R/2, R/4 and without distortion)
//  zero     three-phase, continuously transposed, without distortion: all phases V through Z_c0: att₀·V at the far end after τ₀
//  aerial   the same line, a: +V and b: −V through Z_c1 (aerial modes only): ±att₁·V after τ₁, c stays 0
//  ti       the same line with T_i = the Clarke matrix given by the user (not transposed, three equal aerial rows): the same bits
//  lc       data as R′, L′, C′ and as R′, Z_c, τ give the model of R′, Z_c, v
//  ss       TL without distortion from the steady state (solve.init 'ac'): the far voltage of the first period against the
//           phasor solution of its two-port (γℓ = R/2Z + jωτ, y₁₁ = coth(γℓ)/Z, y₁₂ = −1/(Z·sinh γℓ))
//  errs     the messages of the data per mode
//  batch    TL without distortion and the three-phase line for the SciPy solver (engine/batch.py)
const W = require('path').resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); global.Expr = require(W + '/expr.js'); global.StepCheck = require(W + '/stepcheck.js'); global.LineModels = require(W + '/linemodels.js');
for (const f of ['netlib', 'subcircuit', 'bus', 'units', 'nn']) require(W + '/' + f + '.js'); require(W + '/tutorials.js');
require(W + '/sparse.js'); const MNA = require(W + '/mna.js'); const P = global.Parts;
const out = {};
let nw = 0;
const project = (comps, conns, step) => ({ version: 4, components: comps.map(c => ({ x: 0, y: 0, rot: 0, ...c })),
  wires: conns.map(([a, b]) => { const [ac, ap] = a.split(':'), [bc, bp] = b.split(':'); return { id: 'w' + (nw++), a: { c: ac, p: ap }, b: { c: bc, p: bp }, pts: [] }; }), solve: { step } });
const run = (prj, T, keys, h) => { const s = new MNA.Sim(prj, { h }), rec = []; while (s.t < T - 1e-12) { s.run(h); rec.push([s.t, ...keys.map(k => s.now(k))]); } return rec; };
const V = 1000, Z = 300, len = 30e3, v = 3e8, Rp = 0.01, h = 1e-6;
const tlLine = (loss, extra = {}) => project([{ id: 'V1', type: 'VDC', params: { V } }, { id: 'R1', type: 'R', params: { R: Z } }, { id: 'T1', type: 'TL', params: { spec: 'zl', Z, len, vel: v, Rp, loss, ...extra } }, { id: 'G', type: 'GND' }],
  [['V1:p', 'R1:a'], ['R1:b', 'T1:a1'], ['V1:n', 'G:g'], ['T1:b1', 'G:g'], ['T1:b2', 'G:g']], h);
const mLine = (mloss, extra = {}) => project([{ id: 'V1', type: 'VDC', params: { V } }, { id: 'R1', type: 'R', params: { R: Z } }, { id: 'T1', type: 'TLM', params: { src: 'modal', nph: 1, lu: 'm', mlen: len, mspec: 'zv', mdata: `${Rp}, ${Z}, ${v}`, mloss, ...extra } }, { id: 'G', type: 'GND' }],
  [['V1:p', 'R1:a'], ['R1:b', 'T1:a1'], ['V1:n', 'G:g']], h);
const tau = len / v;
{ const r = run(tlLine('dl'), 3 * tau, ['V2:T1'], h); out.dl = { att: Math.exp(-Rp * len / (2 * Z)), V, tau, rec: r.filter(q => q[0] > tau + 2 * h && q[0] < 3 * tau - 2 * h).map(q => q[1]) }; }
{ const T = 5 * tau, a = run(tlLine('lumped'), T, ['V2:T1', 'I:T1'], h), b = run(mLine('lumped'), T, ['V2:T1', 'I:T1'], h), c = run(tlLine('dl'), T, ['V2:T1', 'I:T1'], h), d = run(mLine('dl'), T, ['V2:T1', 'I:T1'], h);
  const md = (x, y) => Math.max(...x.map((q, i) => Math.max(Math.abs(q[1] - y[i][1]), Math.abs(q[2] - y[i][2]) * Z)));
  out.modal1 = { lumped: md(a, b), dl: md(c, d), scale: V }; }
const Z0 = 600, v0 = 2e5, Z1 = 280, v1 = 2.95e5, R0 = 0.2, R1 = 0.03, L = 100;     // per km, km/s
const three = (Va, Vb, Vc, Rs, extra = {}) => project([{ id: 'Va', type: 'VDC', params: { V: Va } }, { id: 'Vb', type: 'VDC', params: { V: Vb } }, { id: 'Vc', type: 'VDC', params: { V: Vc } },
  { id: 'Ra', type: 'R', params: { R: Rs } }, { id: 'Rb', type: 'R', params: { R: Rs } }, { id: 'Rc', type: 'R', params: { R: Rs } },
  { id: 'T1', type: 'TLM', params: { src: 'modal', nph: 3, lu: 'km', mlen: L, mspec: 'zv', mdata: `${R0}, ${Z0}, ${v0}; ${R1}, ${Z1}, ${v1}`, mloss: 'dl', ...extra } }, { id: 'G', type: 'GND' }],
  [['Va:p', 'Ra:a'], ['Vb:p', 'Rb:a'], ['Vc:p', 'Rc:a'], ['Ra:b', 'T1:a1'], ['Rb:b', 'T1:b1'], ['Rc:b', 'T1:c1'], ['Va:n', 'G:g'], ['Vb:n', 'G:g'], ['Vc:n', 'G:g']], h);
const t0 = L / v0, t1 = L / v1, ends = ['V4:T1', 'V5:T1', 'V6:T1'];
{ const r = run(three(V, V, V, Z0), 2.5 * t0, ends, h); out.zero = { att: Math.exp(-R0 * L / (2 * Z0)), V, t: t0, rec: r.filter(q => q[0] > t0 + 2 * h && q[0] < 2.5 * t0).map(q => q.slice(1)) }; }
{ const r = run(three(V, -V, 0, Z1), 2.5 * t1, ends, h); out.aerial = { att: Math.exp(-R1 * L / (2 * Z1)), V, t: t1, rec: r.filter(q => q[0] > t1 + 2 * h && q[0] < 2.5 * t1).map(q => q.slice(1)) }; }
{ const C = P.clarkeTi(3).map(r => r.join(', ')).join('; ');
  const a = run(three(V, 0.3 * V, -0.5 * V, 400), 3 * t0, ends, h), b = run(three(V, 0.3 * V, -0.5 * V, 400, { transp: '0', mti: C, mdata: `${R0}, ${Z0}, ${v0}; ${R1}, ${Z1}, ${v1}; ${R1}, ${Z1}, ${v1}` }), 3 * t0, ends, h);
  out.ti = { same: a.every((q, i) => q.every((x, j) => Object.is(x, b[i][j]))), clarke: P.clarkeTi(3) }; }
{ const base = { nph: 3, lu: 'km', mlen: L, src: 'modal' }, m = o => P.tlmModel({ ...P.defaults('TLM'), ...base, ...o });
  const lp = Z1 / (v1), cp = 1 / (Z1 * v1), lp0 = Z0 / v0, cp0 = 1 / (Z0 * v0);
  out.lc = { zv: m({ mspec: 'zv', mdata: `${R0}, ${Z0}, ${v0}; ${R1}, ${Z1}, ${v1}` }), lc: m({ mspec: 'lc', mdata: `${R0}, ${lp0}, ${cp0}; ${R1}, ${lp}, ${cp}` }), zt: m({ mspec: 'zt', mdata: `${R0}, ${Z0}, ${t0}; ${R1}, ${Z1}, ${t1}` }) }; }
{ const f = 50, w = 2 * Math.PI * f, Vp = 100e3, Rs = 5, RL = 2000, hs = 1e-6;
  const prj = project([{ id: 'V1', type: 'VAC', params: { Vpk: Vp, f } }, { id: 'R1', type: 'R', params: { R: Rs } }, { id: 'T1', type: 'TL', params: { spec: 'zl', Z, len: 300e3, vel: v, Rp: 0.05e-3, loss: 'dl' } },
    { id: 'RL', type: 'R', params: { R: RL } }, { id: 'G', type: 'GND' }], [['V1:p', 'R1:a'], ['R1:b', 'T1:a1'], ['T1:a2', 'RL:a'], ['RL:b', 'G:g'], ['V1:n', 'G:g'], ['T1:b1', 'G:g'], ['T1:b2', 'G:g']], hs);
  prj.solve.init = 'ac'; const r = run(prj, 0.04, ['V2:T1', 'I:T1'], hs);
  out.ss = { f, Vp, Rs, RL, Z, len: 300e3, v, Rp: 0.05e-3, rec: r.filter((q, i) => i % 20 === 0) }; }
{ const err = o => P.tlmModel({ ...P.defaults('TLM'), src: 'modal', nph: 3, lu: 'km', mlen: 100, ...o }).err || null;
  out.errs = { rows: err({ mdata: '0.2, 600, 2e5' }), three: err({ mdata: '0.2, 600; 0.03, 280, 2.95e5' }), ti: err({ transp: '0', mdata: '0.2,600,2e5; 0.03,280,2.95e5; 0.03,280,2.95e5', mti: '1,1,1; 1,1,1; 1,-1,0' }),
    zc: err({ mdata: '0.2, 0, 2e5; 0.03, 280, 2.95e5' }), ok: err({ mdata: '0.2, 600, 2e5; 0.03, 280, 2.95e5' }) }; }
{ const cases = [], add = (name, prj, keys, T) => { cases.push({ name, keys, T, rec: run(prj, T, keys, h).filter((q, i) => i % 2 === 0), batch: MNA.exportForBatch(prj, keys) }); };
  add('tl_dl', tlLine('dl'), ['V2:T1', 'I:T1'], 5 * tau);
  add('three', three(V, 0.3 * V, -0.5 * V, 400), ends.concat(['I:T1']), 3 * t0);
  out.batch = cases; }
process.stdout.write(JSON.stringify(out));
