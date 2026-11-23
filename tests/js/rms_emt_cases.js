// 4.23 (ROADMAP §71): the EMT of the tutorial ieee9_emt with the fault of Example 2.7 of the reference book (classical
// machines), for the comparison with the RMS core (tests/test_rms.py): the rotor angles every 2 ms. Usage: node rms_emt_cases.js [T] [ev: fault | full]
// 5.0.13 (ROADMAP §101 step 1): [ctl: none | avr | avr_pss | full | book] [changes of parameters: {id: {param: value}}] for the models
// of the RMS: then also y, every 2 ms the values of keys (δ, ω, P, |V| of G1–G3 and E_fd of their AVR, null where there is none).
const path = require('path'); const W = path.resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); global.Expr = require(W + '/expr.js'); global.StepCheck = require(W + '/stepcheck.js');
global.LineModels = require(W + '/linemodels.js'); for (const f of ['netlib', 'subcircuit', 'bus', 'units', 'nn']) require(W + '/' + f + '.js');
const MNA = require(W + '/mna.js'); require(W + '/tutorials.js');
const t = Tutorials.get('ieee9_emt'), o = {}; for (const q of t.options || []) o[q.k] = q.def; o.ev = process.argv[3] || 'fault';
if (process.argv[4]) o.ctl = process.argv[4];
const pr = t.build(o), OV = JSON.parse(process.argv[5] || '{}'); for (const c of pr.components) if (OV[c.id]) Object.assign(c.params, OV[c.id]);
const s = new MNA.Sim(pr, { hDiv: pr.sim?.hDiv }), keys = ['Y:G1:d', 'Y:G2:d', 'Y:G3:d'];
const G = ['G1', 'G2', 'G3'], more = process.argv[4] ? [...G.map(g => 'Y:' + g), ...G.map(g => 'Y:' + g + ':pe'), ...G.map(g => 'Y:' + g + ':vt'), ...G.map(g => 'Y:AV' + g.slice(1) + '/EFD')] : [];
const val = k => { try { const v = s.now(k); return Number.isFinite(v) ? v : null; } catch (e) { return null; } };
const T = +(process.argv[2] || 2.1), out = { t: [], d: [], h: s.h, keys, ...(more.length ? { y: [], more } : {}) };
let next = 0; while (s.t < T - 1e-12) { s.run(Math.min(s.h * 20, T - s.t)); if (s.t >= next - 1e-12) { out.t.push(s.t); out.d.push(keys.map(k => s.now(k))); if (more.length) out.y.push(more.map(val)); next += 0.002; } }
console.log(JSON.stringify(out));
