// 5.1.2 (ROADMAP §101 step 1, THEORY §8ΩΧ): the EMT of the tutorial two_area_emt (the two-area system of Example 12.6), for the
// comparison with the RMS of the same drawing (tests/test_two_area_emt.py). Usage: node two_area_cases.js T '<options>' [every]
// → {t, keys, y, h}: every `every` s (default 2 ms) δ (degrees, as the channel: within ±180°), P_e (pu of the 900 MVA), ω (pu) and
// |V| (pu) of G1–G4, and E_fd of their AVR (null where there is none).
const path = require('path'); const W = path.resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); global.Expr = require(W + '/expr.js'); global.StepCheck = require(W + '/stepcheck.js');
global.LineModels = require(W + '/linemodels.js'); for (const f of ['netlib', 'subcircuit', 'bus', 'units', 'nn']) require(W + '/' + f + '.js');
const MNA = require(W + '/mna.js'); require(W + '/tutorials.js');
const t = Tutorials.get('two_area_emt'), o = {}; for (const q of t.options || []) o[q.k] = q.def; Object.assign(o, JSON.parse(process.argv[3] || '{}'));
const pr = t.build(o), s = new MNA.Sim(pr, { hDiv: pr.sim?.hDiv });
const G = ['G1', 'G2', 'G3', 'G4'], keys = [...G.map(g => 'Y:' + g + ':d'), ...G.map(g => 'Y:' + g + ':pe'), ...G.map(g => 'Y:' + g), ...G.map(g => 'Y:' + g + ':vt'), ...G.map((g, i) => 'Y:AV' + (i + 1) + '/EFD')];
const val = k => { try { const v = s.now(k); return Number.isFinite(v) ? v : null; } catch (e) { return null; } };
const T = +(process.argv[2] || 1), every = +(process.argv[4] || 0.002), out = { t: [], y: [], keys, h: s.h };
let next = 0; while (s.t < T - 1e-12) { s.run(Math.min(s.h * 20, T - s.t)); if (s.t >= next - 1e-12) { out.t.push(s.t); out.y.push(keys.map(val)); next += every; } }
console.log(JSON.stringify(out));
