// 4.23 (ROADMAP §71): the EMT of the tutorial ieee9_emt with the fault of Example 2.7 of the reference book (classical
// machines), for the comparison with the RMS core (tests/test_rms.py): the rotor angles every 2 ms. Usage: node rms_emt_cases.js [T] [ev: fault | full]
const path = require('path'); const W = path.resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); global.Expr = require(W + '/expr.js'); global.StepCheck = require(W + '/stepcheck.js');
global.LineModels = require(W + '/linemodels.js'); for (const f of ['netlib', 'subcircuit', 'bus', 'units', 'nn']) require(W + '/' + f + '.js');
const MNA = require(W + '/mna.js'); require(W + '/tutorials.js');
const t = Tutorials.get('ieee9_emt'), o = {}; for (const q of t.options || []) o[q.k] = q.def; o.ev = process.argv[3] || 'fault';
const pr = t.build(o), s = new MNA.Sim(pr, { hDiv: pr.sim?.hDiv }), keys = ['Y:G1:d', 'Y:G2:d', 'Y:G3:d'];
const T = +(process.argv[2] || 2.1), out = { t: [], d: [], h: s.h, keys };
let next = 0; while (s.t < T - 1e-12) { s.run(Math.min(s.h * 20, T - s.t)); if (s.t >= next - 1e-12) { out.t.push(s.t); out.d.push(keys.map(k => s.now(k))); next += 0.002; } }
console.log(JSON.stringify(out));
