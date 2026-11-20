// 4.24 (THEORY §8Ι.7): the series that tools/verify.py checks against closed forms. Usage: node split_ref.js -> JSON
//  twave: the voltage at the open end of the line, the network in two groups (one thread)
//  mr:    multirate_lines without losses, with the rates of the engine (1 μs in the fast area, 15 μs in the slow ones): the
//         voltage of the fast capacitor up to the return of the first reflection (1 ms) and the current of the slow
//         inductor L1 up to the arrival of the first wave from the fast area (0.5 ms)
const path = require('path'); const W = path.resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); global.Expr = require(W + '/expr.js'); global.StepCheck = require(W + '/stepcheck.js');
global.LineModels = require(W + '/linemodels.js'); for (const f of ['netlib', 'subcircuit', 'bus', 'units', 'nn']) require(W + '/' + f + '.js');
require(W + '/sparse.js'); require(W + '/kernels.js'); global.MNA = require(W + '/mna.js'); require(W + '/tutorials.js');
const Split = require(W + '/split.js');
const build = (id, o) => { const t = Tutorials.get(id), opts = { ...Object.fromEntries((t.options || []).map(q => [q.k, q.def])), ...(o || {}) }; return t.build(opts); };
const pick = (c, t1) => { const t = [], v = []; for (let q = 0; q < c.t.length; q++) if (c.t[q] <= t1) { t.push(c.t[q]); v.push(c.v[q]); } return { t, v }; };
const out = {};
{ const pr = build('twave'), r = Split.serial(pr, { sim: { hDiv: pr.sim?.hDiv }, tEnd: 25e-6, groups: 2 }); out.twave = { groups: r.plan.groups.length, ...pick(r.channels.get('V2:T1'), 25e-6) }; }
{ const pr = build('multirate_lines', { loss: 'lossless' }), r = Split.serial(pr, { sim: { hDiv: pr.sim.hDiv }, tEnd: 1e-3, rates: 'auto' });
  out.mr = { m: r.plan.groups.map(g => g.m), h: r.stats.h, vC: pick(r.channels.get('V:C1'), 0.95e-3), iL1: pick(r.channels.get('I:L1'), 0.48e-3) }; }
process.stdout.write(JSON.stringify(out));
