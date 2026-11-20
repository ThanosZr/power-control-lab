// The option «Ουδέτερος» of the three-phase parts (4.24, decisions 208 and 345): solidly grounded, through R_n + jX_n,
// isolated, or a terminal n. Usage: node neut_cases.js -> JSON
//  pins:     the terminal n (n1, n2) only with «Ακροδέκτης n»
//  same:     a terminal n wired to a ground gives the currents of «Στερεά γειωμένος», for every part
//  grid:     a line-to-earth fault at a network equivalent with R_n + jX_n against the phase-domain solution with 3Z_n
//            (IEC 60909: Z₀ with the neutral impedance), the same current as R_n inside Z₀, and almost none when isolated
//  xf:       the same behind a Dyn11 transformer with Z_n at its star point
//  vac3:     an unbalanced star of resistors: the currents against the closed form with Z_n, and Σi = 0 when isolated
//  gen:      the generator with R_n + jX_n: its netlist has the two branches
const path = require('path'); const W = path.resolve(__dirname, '../../web/studio');
global.window = globalThis; global.Parts = require(W + '/parts.js'); const NL = require(W + '/netlib.js'); require(W + '/subcircuit.js'); require(W + '/bus.js'); require(W + '/units.js');
const MNA = require(W + '/mna.js'); const P = global.Parts;
function project(comps, conns, step = 1e-5) {
  let n = 0; return { version: 3, components: comps.map(c => ({ x: 0, y: 0, rot: 0, ...c })),
    wires: conns.map(([a, b]) => { const [ac, ap] = a.split(':'), [bc, bp] = b.split(':'); return { id: 'w' + (n++), a: { c: ac, p: ap }, b: { c: bc, p: bp }, pts: [] }; }), solve: { step } };
}
const three = (a, b, s1 = '', s2 = '') => ['a', 'b', 'c'].map(x => [`${a}:${x}${s1}`, `${b}:${x}${s2}`]);
const rms = (s, keys) => keys.map(k => s.lastPeriod(k).rms);
// RMS of the fundamental over one period of 50 Hz, stepping the solver (a DC part, slow behind a transformer, does not count)
function fund(s, k, f = 50, N = 2000) { const T = 1 / f, h = T / N, w = 2 * Math.PI * f; let re = 0, im = 0;
  for (let i = 0; i < N; i++) { s.run(h); const v = s.now(k); re += v * Math.cos(w * s.t); im -= v * Math.sin(w * s.t); } return Math.hypot(re, im) * 2 / N / Math.SQRT2; }
const out = {};

// pins
out.pins = {};
for (const [t, k, vals] of [['VAC3', 'neut', ['gnd', 'z', 'iso', 'pin']], ['GRID3', 'neut', ['gnd', 'z', 'iso', 'pin']], ['LOAD3', 'neut', ['auto', 'gnd', 'z', 'iso', 'pin']],
  ['FILT3', 'neut', ['gnd', 'z', 'iso', 'pin']], ['GEN3', 'neut', ['gnd', 'z', 'iso', 'pin']], ['XF3', 'neut2', ['auto', 'gnd', 'z', 'iso', 'pin']]])
  out.pins[t] = Object.fromEntries(vals.map(v => [v, Object.keys(P.elPins({ type: t, params: { ...P.defaults(t), grp: 'YNyn0', [k]: v } })).filter(p => /^n/.test(p))]));
out.pins.XF3d = Object.keys(P.elPins({ type: 'XF3', params: { ...P.defaults('XF3'), neut1: 'pin' } })).filter(p => /^n/.test(p));   // Dyn11: side 1 is a delta
out.pins.LOAD3d = Object.keys(P.elPins({ type: 'LOAD3', params: { ...P.defaults('LOAD3'), cn: 'd', neut: 'pin' } })).filter(p => /^n/.test(p));

// a terminal n wired to a ground = solidly grounded
const GRID = { Un: 20e3, Sk: 500e6, XR: 10, z0: 'ratio', Z0Z1: 1.5, XR0: 5 };
const fault = (g, kind, extra = [], ec = []) => { const s = new MNA.Sim(project([{ id: 'G1', type: 'GRID3', params: g }, { id: 'F1', type: 'FLT3', params: { kind, ton: 0.02 } }, ...extra], [...three('G1', 'F1'), ...ec])); s.run(0.3); return s; };
out.same = {};
{ const a = fault(GRID, 'ag'), b = fault({ ...GRID, neut: 'pin' }, 'ag', [{ id: 'GN', type: 'GND' }], [['G1:n', 'GN:g']]);
  out.same.grid = [rms(a, ['Y:F1/Ia'])[0], rms(b, ['Y:F1/Ia'])[0]]; }
const vsrc = (q, extra = [], ec = []) => {
  const s = new MNA.Sim(project([{ id: 'V1', type: 'VAC3', params: { Vpk: 325, f: 50, ...q } }, { id: 'Ra', type: 'R', params: { R: 10 } }, { id: 'Rb', type: 'R', params: { R: 20 } }, { id: 'Rc', type: 'R', params: { R: 40 } },
    { id: 'G0', type: 'GND' }, ...extra], [['V1:a', 'Ra:a'], ['V1:b', 'Rb:a'], ['V1:c', 'Rc:a'], ['Ra:b', 'G0:g'], ['Rb:b', 'G0:g'], ['Rc:b', 'G0:g'], ...ec], 2e-5)); s.run(0.2); return s; };
{ const a = vsrc({ neut: 'gnd' }), b = vsrc({}, [], [['V1:n', 'G0:g']]); out.same.vac3 = [rms(a, ['I:Ra', 'I:Rb', 'I:Rc']), rms(b, ['I:Ra', 'I:Rb', 'I:Rc'])]; }
const load = (q, gnd) => {
  const s = new MNA.Sim(project([{ id: 'G1', type: 'GRID3', params: GRID }, { id: 'L1', type: 'LOAD3', params: { P: 10e6, Q: 3e6, ...q } }, { id: 'F1', type: 'FLT3', params: { kind: 'ag', ton: 0.02, Rf: 5 } }, ...(gnd ? [{ id: 'GN', type: 'GND' }] : [])],
    [...three('G1', 'L1'), ...three('G1', 'F1'), ...(gnd ? [['L1:n', 'GN:g']] : [])])); s.run(0.2); return rms(s, ['Y:F1/Ia', 'Y:F1/Ib']); };
out.same.load = { yn: load({ cn: 'yn' }), gnd: load({ cn: 'y', neut: 'gnd' }), pin: load({ cn: 'yn', neut: 'pin' }, true), y: load({ cn: 'y' }), iso: load({ cn: 'yn', neut: 'iso' }) };
const filt = (q, gnd) => {
  const s = new MNA.Sim(project([{ id: 'G1', type: 'GRID3', params: GRID }, { id: 'FL', type: 'FILT3', params: { kind: 'st', C1: 2e-6, L: 0.2, R: 5, ...q } }, { id: 'F1', type: 'FLT3', params: { kind: 'ag', ton: 0.02, Rf: 5 } }, ...(gnd ? [{ id: 'GN', type: 'GND' }] : [])],
    [...three('G1', 'FL'), ...three('G1', 'F1'), ...(gnd ? [['FL:n', 'GN:g']] : [])])); s.run(0.2); return rms(s, ['Y:F1/Ia', 'Y:F1/Ib']); };
out.same.filt = { gnd: filt({}), pin: filt({ neut: 'pin' }, true), iso: filt({ neut: 'iso' }) };
const xf = (q, gnd, kind = 'ag') => {
  const X = { grp: 'Dyn11', Sn: 40e6, U1: 150e3, U2: 20e3, uk: 10, Pk: 200e3, ...q }, G = { ...GRID, Un: 150e3, Sk: 5e9 };
  const s = new MNA.Sim(project([{ id: 'G1', type: 'GRID3', params: G }, { id: 'T1', type: 'XF3', params: X }, { id: 'F1', type: 'FLT3', params: { kind, ton: 0.02 } }, ...(gnd ? [{ id: 'GN', type: 'GND' }] : [])],
    [...three('G1', 'T1', '', '1'), ...three('T1', 'F1', '2', ''), ...(gnd ? [['T1:n2', 'GN:g']] : [])])); s.run(0.6);
  return { sim: fund(s, 'Y:F1/Ia'), ref: NL.faultCurrents(NL.behindXF(G, X), { kind }).a }; };
out.same.xf = [xf({}).sim, xf({ neut2: 'pin' }, true).sim];

// the network equivalent with Z_n: a line-to-earth fault against the phase-domain solution with 3Z_n
out.grid = {};
for (const [k, q] of [['z', { neut: 'z', Rng: 10, Xng: 20 }], ['zr', { neut: 'z', Rng: 10, Xng: 0 }], ['rin', { Rn: 10 }], ['iso', { neut: 'iso' }]]) {
  const g = { ...GRID, ...q }, s = fault(g, 'ag'); out.grid[k] = { sim: rms(s, ['Y:F1/Ia'])[0], ref: NL.faultCurrents(g, { kind: 'ag' }).a };
}
out.grid.abc = (() => { const g = { ...GRID, neut: 'z', Rng: 10, Xng: 20 }; return [rms(fault(g, 'abc'), ['Y:F1/Ia'])[0], NL.faultCurrents(g, { kind: 'abc' }).a, NL.faultCurrents(GRID, { kind: 'abc' }).a]; })();
out.xf = { auto: xf({}), z: xf({ neut2: 'z', Rng2: 4, Xng2: 2 }), iso: xf({ neut2: 'iso' }) };

// VAC3 with Z_n into an unbalanced star of resistors: I_k = (E_k + V_n)/R_k, V_n = −Z_n·ΣE_k/R_k / (1 + Z_n·Σ1/R_k)
{ const Rn = 5, Xn = 8, R = [10, 20, 40], E = [0, -1, 1].map(k => [325 / Math.SQRT2 * Math.cos(k * 2 * Math.PI / 3), 325 / Math.SQRT2 * Math.sin(k * 2 * Math.PI / 3)]);
  const cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const Zn = [Rn, Xn]; let sE = [0, 0], sG = 0; E.forEach((e, k) => { sE = [sE[0] + e[0] / R[k], sE[1] + e[1] / R[k]]; sG += 1 / R[k]; });
  const Vn = cdiv(cm([-Zn[0], -Zn[1]], sE), [1 + Zn[0] * sG, Zn[1] * sG]), ref = E.map((e, k) => Math.hypot(e[0] + Vn[0], e[1] + Vn[1]) / R[k]);
  const s = vsrc({ neut: 'z', Rng: Rn, Xng: Xn }); out.vac3 = { sim: rms(s, ['I:Ra', 'I:Rb', 'I:Rc']), ref };
  const si = vsrc({ neut: 'iso' }); let mx = 0, sc = 0; for (let i = 0; i < 1000; i++) { si.run(2e-5); const v = si.now('I:Ra') + si.now('I:Rb') + si.now('I:Rc'); mx = Math.max(mx, Math.abs(v)); sc = Math.max(sc, Math.abs(si.now('I:Ra'))); }
  out.vac3.iso = { sum: mx, scale: sc }; }

// the generator: R_n and L_n in its netlist
{ const n = MNA.buildNetlist(project([{ id: 'G1', type: 'GEN3', params: { neut: 'z', Rng: 3, Xng: 4 } }, { id: 'L1', type: 'LOAD3', params: {} }], three('G1', 'L1')));
  const f = P.defaults('GEN3').f; out.gen = { G: n.els.filter(e => e.cid === 'G1' && e.k === 'G').map(e => e.R), L: n.els.filter(e => e.cid === 'G1' && e.k === 'L' && /#Ln$/.test(e.key || '')).map(e => e.L * 2 * Math.PI * f) }; }
// the default of the option is the part of before 4.24: the same netlist with and without the key
{ // typed arrays, Map, Set, shared and circular objects (a machine refers to itself), functions as 'fn'
  const sv = (v, seen) => { if (typeof v === 'function') return 'fn'; if (v === null || typeof v !== 'object') return typeof v === 'number' && !Number.isFinite(v) ? String(v) : v;
    if (seen.has(v)) return '#' + seen.get(v); seen.set(v, seen.size); if (ArrayBuffer.isView(v)) return Array.from(v);
    if (v instanceof Map) return { M: [...v].map(([k, x]) => [sv(k, seen), sv(x, seen)]) }; if (v instanceof Set) return { S: [...v].map(x => sv(x, seen)) };
    if (Array.isArray(v)) return v.map(x => sv(x, seen)); const o = {}; for (const k of Object.keys(v)) if (k !== 'H' && k !== 'cut') o[k] = sv(v[k], seen); return o; };
  const ser = n => JSON.stringify(sv(n.els, new Map()));
  const net = (t, q, pins) => ser(MNA.buildNetlist(project([{ id: 'X1', type: t, params: q }, { id: 'R1', type: 'LOAD3', params: {} }, ...(pins.includes('a1') ? [{ id: 'R2', type: 'LOAD3', params: {} }] : [])],
    pins.includes('a1') ? [...three('X1', 'R1', '1', ''), ...three('X1', 'R2', '2', '')] : three('X1', 'R1'))));
  out.defaults = {};
  for (const [t, ks, extra] of [['VAC3', ['neut'], {}], ['GRID3', ['neut'], {}], ['LOAD3', ['neut'], { cn: 'y' }], ['LOAD3', ['neut'], { model: 'zip', cn: 'y' }], ['FILT3', ['neut'], { kind: 'cig' }],
    ['XF3', ['neut1', 'neut2'], { grp: 'YNyn0', core: '3leg' }], ['GEN3', ['neut'], {}]]) {
    const pins = Object.keys(P.elPins({ type: t, params: { ...P.defaults(t), ...extra } })), d = P.defaults(t);
    out.defaults[t + (extra.model ? '/zip' : '')] = net(t, extra, pins) === net(t, { ...extra, ...Object.fromEntries(ks.map(k => [k, d[k]])) }, pins);
  } }
process.stdout.write(JSON.stringify(out));
