// 5.0.14 (ROADMAP §101 step 2): the EMT of the tutorial ieee9_gfm (the unit of bus 3 as a converter) for the comparison with
// the converters of the RMS (tests/test_rms.py): every 2 ms the speeds, the powers and |V| of G1 and G2, and P, ω and |V| of the
// converter. Usage: node rms_gfm_cases.js <unit: droop | vsm | gfl | gfl0> [T] [dp] [options as JSON] [changes of parameters:
// {id: {param: value}}] [hDiv]; then also the flag of the current limit, Q and |i| of the grid-forming control
const path = require('path'); const W = path.resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); global.Expr = require(W + '/expr.js'); global.StepCheck = require(W + '/stepcheck.js');
global.LineModels = require(W + '/linemodels.js'); for (const f of ['netlib', 'subcircuit', 'bus', 'units', 'nn']) require(W + '/' + f + '.js');
const MNA = require(W + '/mna.js'); require(W + '/tutorials.js');
const t = Tutorials.get('ieee9_gfm'), o = {}; for (const q of t.options || []) o[q.k] = q.def;
o.unit = process.argv[2] || 'droop'; if (process.argv[4]) o.dp = process.argv[4]; Object.assign(o, JSON.parse(process.argv[5] || '{}'));
const pr = t.build(o), OV = JSON.parse(process.argv[6] || '{}'); for (const c of pr.components) if (OV[c.id]) Object.assign(c.params, OV[c.id]);
const s = new MNA.Sim(pr, { hDiv: +(process.argv[7] || 0) || pr.sim?.hDiv });
const gfm = !o.unit.startsWith('gfl'), keys = ['Y:G1', 'Y:G2', 'Y:G1:pe', 'Y:G2:pe', 'Y:G1:vt', 'Y:G2:vt', 'Y:CT3/PP', gfm ? 'Y:CT3/WW' : 'Y:CT3/WPU', 'Y:CT3/VG', 'Y:CT3/LR', 'Y:CT3/QQ', 'Y:CT3/IG'];
const val = k => { try { const v = s.now(k); return Number.isFinite(v) ? v : null; } catch (e) { return null; } };
const T = +(process.argv[3] || 6), out = { t: [], y: [], keys, h: s.h, meta: pr.meta?.ieee9gfm || null };
let next = 0; while (s.t < T - 1e-12) { s.run(Math.min(s.h * 24, T - s.t)); if (s.t >= next - 1e-12) { out.t.push(s.t); out.y.push(keys.map(val)); next += 0.002; } }
console.log(JSON.stringify(out));
