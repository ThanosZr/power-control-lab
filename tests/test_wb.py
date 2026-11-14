"""4.13: the wideband line and cable model (pcl.wideband, the universal line model as the WB fitter of the EMTP) and
its solver in the browser and in SciPy, the homogeneous cross-bonding of Cable Constants and the tutorial cable_xb.

The fitter is checked on synthetic rational functions (vector fitting), on the typical lines and cables (errors of H,
Y_c and of the nodal admittance against the exact line, passivity), and on what it writes and reads (the model file of
the EMTP). The solver is checked against the numerical Laplace transform of the same model and of the exact line, the
steady start against the phasor solution, the trapped charge, and SciPy against the browser. The cross-bonded cable of
the tutorial (nine minor sections) is checked at 50 Hz against the phasor solution of the exact sections with the same
connections, and with a step against the numerical Laplace transform of the exact sections."""
import json
import math
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'tests'))
from pcl import lineconst as lc, wideband as wb  # noqa: E402


def node_ok():
    try:
        return subprocess.run(['node', '--version'], capture_output=True).returncode == 0
    except OSError:
        return False


def stored(key):
    """A model of web/studio/linemodels.js (tools/line_models.py), as the tutorials use it."""
    t = (ROOT / 'web' / 'studio' / 'linemodels.js').read_text(encoding='utf-8')
    return json.loads(t[t.index('const M=') + 8:t.index(';root.LineModels')])[key]


def node_json(script, *args, timeout=900):
    r = subprocess.run(['node', str(ROOT / 'tests' / 'js' / script), *args], capture_output=True, text=True,
                       timeout=timeout)
    if r.returncode:
        raise AssertionError(r.stderr[-3000:])
    return json.loads(r.stdout)


def node_case(script, q, timeout=900):
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as fh:
        json.dump(q, fh)
    try:
        return node_json(script, fh.name, timeout=timeout)
    finally:
        os.unlink(fh.name)


def band(model, a, b):
    """The nodal error of a model in its band [a, b) (fit info yn_bands)."""
    for lo, hi, e in model['fit']['yn_bands']:
        if lo == a and (hi == b or (hi is None and b is None)):
            return e
    raise KeyError((a, b))


class VectorFitting(unittest.TestCase):
    def test_relaxed_vf_recovers_poles(self):
        """Two real poles and two complex pairs, three responses with common poles, from poles a decade off."""
        p = np.array([-30.0, -2e3, -1e2 + 4e3j, -1e2 - 4e3j, -5e3 + 6e4j, -5e3 - 6e4j])
        f = np.logspace(0, 5, 120)
        s = 2j * math.pi * f
        rng = np.random.default_rng(3)
        R = (rng.normal(size=(6, 3)) * np.abs(p)[:, None]).astype(complex)
        for k in (2, 4):                                 # the pairs: conjugate residues
            R[k] = R[k] + 1j * rng.normal(size=3) * abs(p[k])
            R[k + 1] = R[k].conj()
        F = (1.0 / (s[:, None] - p[None, :])) @ R + np.array([0.1, -0.2, 0.3])
        a, r, d, rms, emax = wb.vfit_relaxed(s, F, wb.start_poles(1, 1e5, 6), d=True, iters=20)
        self.assertLess(emax / np.abs(F).max(), 1e-9)
        got = np.sort_complex(a)
        for q in np.sort_complex(p):
            self.assertLess(np.abs(got - q).min() / abs(q), 1e-6)
        np.testing.assert_allclose(d, [0.1, -0.2, 0.3], atol=1e-6)

    def test_bode_delays(self):
        """The delays of the 400 kV line (100 km): every mode at least ℓ/c, the aerial modes within 0,2 % of it."""
        d = lc.typical('400kV')
        fs = lc.freqs(0.01, 8, 10)
        sw = wb._sweep(d, fs, 100e3)
        c0 = 100e3 / 299792458.0
        taus = [wb.bode_delay(fs, sw['Hm'][:, k], sw['g'][:, k], 100e3)[0] for k in range(3)]
        for t in taus:
            self.assertGreater(t, c0 * 0.999)
        self.assertLess(sorted(taus)[1], c0 * 1.002)
        self.assertGreater(max(taus), c0 * 1.005)       # the earth mode is slower


class Fit(unittest.TestCase):
    def test_typical_models(self):
        """The stored models of the tutorials: errors of H (absolute) and Y_c (relative) within twice the tolerance,
        passive, the nodal admittance within 1 % from 1 Hz to 100 Hz and within 0,5 % from 100 Hz to 10 kHz."""
        for key in ('400kV|100|wb', '220kV-sea|30|wb', '150kV-land-s|0.5|wb', '150kV-land-s+bond|1.5|wb',
                    '150kV-land-s+gnd|4.5|wb', '150kV-land|4.5|wb', '400kV-gw|30|wb', '400kV-gw|0.3|wb'):
            with self.subTest(key=key):
                m = stored(key)
                self.assertEqual(m['type'], 'wb')
                self.assertLessEqual(m['fit']['h_err'], 2 * m['fit']['tol'])
                self.assertLessEqual(m['fit']['yc_err'], 2 * m['fit']['tol'])
                self.assertTrue(m['passive']['passive'])
                self.assertLess(band(m, 1.0, 100.0), 0.014)
                self.assertLess(band(m, 100.0, 1e4), 0.005)

    def test_low_frequency_weight(self):
        """A minor section of 0,5 km: with the plain ULM (lfw 0) the series impedance at 1–100 Hz is several per cent
        off (the error of H is larger than |1 − H| there); with the weight it is within 1 %."""
        d = lc.typical('150kV-land-s')
        m0 = wb.wb_model(d, 0.5, decades=8, passive='none', lfw=0)
        m1 = wb.wb_model(d, 0.5, decades=8, passive='none', lfw=100)
        self.assertGreater(band(m0, 1.0, 100.0), 0.05)
        self.assertLess(band(m1, 1.0, 100.0), 0.01)
        self.assertEqual(m1['fit']['lfw'], 100.0)
        self.assertLessEqual(m1['fit']['h_err'], 2 * 0.002)

    def test_weight_falls_back(self):
        """The 400 kV line with its ground wires (30 km): with lfw 100 the poles cancel (residue/pole ratio above the
        threshold, as the cable correction would see it); the fitter lowers the weight and keeps a fit within the
        tolerance and the ratio."""
        m = wb.wb_model(lc.typical('400kV-gw'), 30, decades=9, passive='none', lfw=100)
        self.assertLess(m['fit']['lfw'], 100)
        self.assertLessEqual(m['fit']['ratio'], 1000)
        self.assertLessEqual(m['fit']['h_err'], 2 * 0.002)

    def test_enforcement_keeps_the_nodal_admittance(self):
        """Passivity enforcement on the plain fit of the minor section: without the weight of the change of H
        (wmax 1) the nodal admittance at 50 Hz moves by tens of per cent while |ΔH| stays tiny; with it (wmax 1000)
        it stays within 1 %."""
        d = lc.typical('150kV-land-s')
        fs = lc.freqs(0.01, 8, 10)
        sw = wb._sweep(d, fs, 500.0)
        m = wb.wb_model(d, 0.5, decades=8, passive='check', lfw=0)
        self.assertFalse(m['passive']['passive'])
        i50 = int(np.argmin(np.abs(fs - 50)))
        out = {}
        for w in (1.0, 1e3):
            m2, rep = wb.enforce_passivity(m, sw, step=5e-4, wmax=w)
            e = wb.errors(m2, sw, per_f=True)
            out[w] = (rep['passive'], e['yn_f'][i50], e['h'])
        self.assertTrue(out[1.0][0] and out[1e3][0])
        self.assertGreater(out[1.0][1], 0.1)
        self.assertLess(out[1e3][1], 0.01)
        self.assertLess(out[1.0][2], 2e-3)               # what the old criterion saw: H within the tolerance

    def test_mod_file_roundtrip(self):
        """Our model written as the model file of the EMTP and read back: the same nodal admittance."""
        m = stored('220kV-sea|30|wb')
        m2 = wb.read_wb_mod(wb.write_wb_mod(m), length=30)
        for f in (0.1, 50.0, 1e3, 1e5):
            a = wb.wb_admittance(m, 2j * math.pi * f)
            b = wb.wb_admittance(m2, 2j * math.pi * f)
            self.assertLess(np.abs(a - b).max() / np.abs(a).max(), 1e-9)

    def test_import_report(self):
        """A model file read against the line data: the report of its errors and passivity, as for our own fit."""
        d = lc.typical('220kV-sea')
        m = stored('220kV-sea|30|wb')
        r = wb.import_model(wb.write_wb_mod(m), d, 30, 'check')
        self.assertLessEqual(r['fit']['h_err'], m['fit']['h_err'] + 1e-4)   # its band: 0,01 Hz – 100 kHz (7 decades)
        self.assertTrue(r['passive']['passive'])
        self.assertIn('yn_bands', r['fit'])
        self.assertIn('yn_err', r['curves'])


class CrossBonding(unittest.TestCase):
    d = lc.typical('150kV-land-s')

    def matrices(self, kind):
        d = dict(self.d, xbond=kind)
        return lc.phase_matrices(d, f=50.0)

    def test_average(self):
        """'avg': the matrices of the six conductors are invariant under the rotation of the sheaths; 'gnd' is the
        Kron reduction of 'bond' with the bonded sheath grounded."""
        Za, Ya = self.matrices('avg')
        self.assertEqual(Za.shape, (6, 6))
        P = np.eye(6)
        P[[3, 4, 5]] = P[[5, 3, 4]]
        np.testing.assert_allclose(P @ Za @ P.T, Za, rtol=1e-12, atol=1e-15)
        Zb, Yb = self.matrices('bond')
        Zg, Yg = self.matrices('gnd')
        self.assertEqual(Zb.shape, (4, 4))
        self.assertEqual(Zg.shape, (3, 3))
        Zk = Zb[:3, :3] - np.outer(Zb[:3, 3], Zb[3, :3]) / Zb[3, 3]
        np.testing.assert_allclose(Zk, Zg, rtol=1e-9)

    def test_positive_sequence(self):
        """'gnd': the positive-sequence impedance of the cross-bonded cable (cores with the sheath currents cancelled
        over a major section): R₁ ≈ 0,021 Ω/km (the cores only), X₁ ≈ 0,19 Ω/km (the loop of the flat formation)."""
        Zg, _ = self.matrices('gnd')
        a = np.exp(2j * math.pi / 3)
        A = np.array([[1, 1, 1], [1, a * a, a], [1, a, a * a]])
        Zs = np.linalg.solve(A, Zg @ A) * 1000.0
        self.assertAlmostEqual(Zs[1, 1].real, 0.0212, delta=0.002)
        self.assertAlmostEqual(Zs[1, 1].imag, 0.1906, delta=0.01)

    def test_sheath_check(self):
        """The standing voltage per A and km of a minor section and the ratio of the sheath current with solid bonding
        (wideband.sheath_check): the outer cables alike, the middle one less; about the same per km for 1 km."""
        Z, Y = lc.phase_matrices(self.d, f=50.0)
        r1 = wb.sheath_check(lc.line_admittance(Z, Y, 500.0), 0.5, [0, 1, 2], [3, 4, 5])
        r2 = wb.sheath_check(lc.line_admittance(Z, Y, 1000.0), 1.0, [0, 1, 2], [3, 4, 5])
        self.assertAlmostEqual(r1['E'][0], r1['E'][2], delta=1e-6)
        self.assertLess(r1['E'][1], r1['E'][0])
        self.assertTrue(0.05 < r1['E'][0] < 0.3)
        np.testing.assert_allclose(r1['E'], r2['E'], rtol=2e-3)
        self.assertTrue(all(0.3 < x < 0.9 for x in r1['Is']))
        np.testing.assert_allclose(r1['E'], stored('150kV-land-s|0.5|wb')['sheath']['E'], rtol=1e-6)


class Api(unittest.TestCase):
    def test_line_model_and_export(self):
        """The action line_model with model 'wb' (options as the WB fitter, tolerance in %), its export as _WB.mod and
        the same file read back through line_model (wbmod)."""
        from pcl import linereport as lr
        d = lc.typical('220kV-sea')
        r = lc.api({'data': d, 'model': 'wb', 'len': 30, 'dec': 7, 'tol': 0.5, 'passive': 'check', 'lfw': 30, 'src': 'k'})
        m = r['mdl']
        self.assertEqual(m['type'], 'wb')
        self.assertEqual(m['opts']['lfw'], 30.0)
        self.assertEqual(m['src'], 'k')
        self.assertIn('yn_err', r['curves'])
        x = lr.api_export({'data': d, 'len': 30, 'fmt': 'wb_mod', 'name': 'C1', 'mdl': m})
        self.assertTrue(x['name'].endswith('_WB.mod'))
        r2 = lc.api({'data': d, 'model': 'wb', 'len': 30, 'wbmod': x['text'], 'wbref': 'C1_WB.mod|1', 'src': 'e'})
        self.assertEqual(r2['mdl']['wbref'], 'C1_WB.mod|1')
        s = 2j * math.pi * 1e3
        a, b = wb.wb_admittance(m, s), wb.wb_admittance(r2['mdl'], s)
        self.assertLess(np.abs(a - b).max() / np.abs(a).max(), 1e-9)
        with self.assertRaises(lc.LineError):
            lc.api({'data': d, 'model': 'wb', 'len': 30, 'lfw': -1})


def nlt_err(d, m, tend, M, R, Rs, src_tr, out):
    """The browser solver (wb_cases.js) against the numerical Laplace transform of the same model and of the exact
    line: a ramp on conductor 1 of end 1 behind Rs, terminations R (2M, None = open). Returns (vs model, vs exact)."""
    nodes = 2 * M + 0
    el = [('V', 1, 0, Rs, ('ramp', 1.0, src_tr))]
    for i, r in enumerate(R):
        if r is not None:
            el.append(('R', i + 1, 0, r))
    ends = list(range(1, M + 1)), list(range(M + 1, 2 * M + 1))

    def net(kind):
        return {'nodes': nodes, 'el': el + [('LINE', ends[0], ends[1], d, kind)]}
    ref = lc.nlt_solve(net(m), tend, n=8192)
    ex = lc.nlt_solve(net('exact'), tend, n=8192)
    q = {'data': d, 'model': m, 'kind': 'wb', 'params': out, 'h': min(0.2e-6, m['tau_min'] / 4), 'tend': tend,
         'src': {'Vpk': 1.0, 'tr': src_tr, 'Rs': Rs}, 'R': [None] + list(R[1:])}
    o = node_case('wb_cases.js', q)
    t, V = np.array(o['t']), np.array(o['v'], float)

    def err(r):
        tn, Vr = r
        pk = np.abs(Vr).max()
        return max(np.nanmax(np.abs(np.interp(t, tn, Vr[j]) - V[j])) / pk for j in range(2 * M)
                   if np.isfinite(V[j]).all())
    return err(ref), err(ex), o


@unittest.skipUnless(node_ok(), 'node')
class Solver(unittest.TestCase):
    def test_line_against_nlt(self):
        """400 kV, 100 km, open at the far end: the browser within 0,3 % of the peak of the same model by NLT and
        within 1 % of the exact line."""
        d = lc.typical('400kV')
        m = stored('400kV|100|wb')
        R = [None, 10.0, 10.0, 1e6, 1e6, 1e6]
        e1, e2, o = nlt_err(d, m, 2e-3, 3, R, 10.0, 20e-6, {'dec': 8, 'wpas': 'enforce'})
        self.assertLess(e1, 3e-3)
        self.assertLess(e2, 1e-2)
        self.assertEqual(o['warn'], [])

    def test_cable_with_sheaths_against_nlt(self):
        """The land cable with its sheaths as conductors (0,5 km, six conductors), the sheaths open: the browser
        against the NLT of the same model and of the exact cable (within 1 % of the peak: the fronts of 1 μs with
        delays of 2,4 μs, and the window of the NLT, give the larger part)."""
        d = dict(lc.typical('150kV-land-s'), length=0.5)
        m = stored('150kV-land-s|0.5|wb')
        R = [None, 30.0, 30.0, None, None, None, 1e6, 1e6, 1e6, None, None, None]
        R = [r if r is not None or i == 0 else 1e9 for i, r in enumerate(R)]
        e1, e2, _ = nlt_err(d, m, 150e-6, 6, R, 30.0, 1e-6, {'dec': 8, 'wpas': 'enforce'})
        self.assertLess(e1, 1e-2)
        self.assertLess(e2, 1e-2)

    def test_steady_start(self):
        """The 400 kV line from the 50 Hz steady state (tlm_ss_cases.js): the waveform of the phasor solution of the
        model from t = 0 (and not from a de-energized line)."""
        import test_line_solver as T
        m = stored('400kV|100|wb')
        e, o = T.run_case('wb', m, {'dec': 8, 'wpas': 'enforce'}, h=20e-6, tend=0.02)
        self.assertLess(e, 1e-4)
        e0, _ = T.run_case('wb', m, {'dec': 8, 'wpas': 'enforce'}, init='zero', h=20e-6, tend=0.02)
        self.assertGreater(e0, 0.1)

    def test_trapped_charge(self):
        """The line charged to (1, −0,5, 0) V and left open: the voltages stay (passive model, DC of the fit)."""
        d = lc.typical('400kV')
        m = stored('400kV|100|wb')
        q = {'data': d, 'model': m, 'kind': 'wb', 'h': 1e-6, 'tend': 4e-3,
             'params': {'vtrap': '1, -0.5, 0', 'dec': 8, 'wpas': 'enforce'},
             'src': {'Vpk': 1e-9, 'tr': 20e-6, 'Rs': 1e9}, 'R': [None] + [1e9] * 5}
        o = node_case('wb_cases.js', q)
        V = np.array(o['v'], float)
        want = [1, -0.5, 0, 1, -0.5, 0]
        for j in range(1, 6):
            self.assertLess(np.abs(V[j] - want[j]).max(), 5e-3)

    def test_scipy_steady(self):
        """The steady start in SciPy (engine/batch.py, the convolutions as states) against the browser."""
        import test_line_solver as T
        from engine.batch import simulate
        m = stored('220kV-sea|30|wb')
        d = lc.typical('220kV-sea')
        _, o, V = T.run_case('wb', m, {'dec': 8, 'wpas': 'enforce'}, tend=0.01, batch=True, full=True, data=d, RL=200.0)
        res = simulate({'net': o['batch']['net'], 'channels': o['batch']['channels'], 't_end': 0.01, 'method': 'Radau',
                        'rtol': 1e-6, 'atol': 1e-3, 'max_points': 200000, 'wall': 600, '_local': True})
        self.assertEqual(res['status'], 'ok', res.get('message'))
        tb = np.array(res['t'])
        w = 2 * math.pi * 50
        for k, key in enumerate(['V:Ra', 'V:Rb', 'V:Rc']):
            dev = np.abs(np.array(res['ch'][key], float) - (V[3 + k] * np.exp(1j * w * tb)).real).max() / abs(V[3])
            self.assertLess(dev, 1e-3)


@unittest.skipUnless(node_ok(), 'node')
class Tutorial(unittest.TestCase):
    """cable_xb (tests/js/xb_cases.js), as the studio builds it."""

    @staticmethod
    def phasor(kind, Rs=1.0, RL=108.0, Rsrc=0.5, N=9):
        """The 50 Hz solution of the explicit cable from the exact nodal admittance of the minor sections."""
        d = lc.typical('150kV-land-s')
        Z, Y = lc.phase_matrices(d, f=50.0)
        Yn = lc.line_admittance(Z, Y, 500.0)
        cnt = [0]

        def new():
            cnt[0] += 1
            return cnt[0] - 1
        C = [[new() for q in range(3)] for j in range(N + 1)]
        major = {0, 3, 6, 9}
        G = {j: new() for j in sorted(major)}
        SN = {j: [new() for q in range(3)] for j in range(N + 1) if j not in major}
        src = [new() for q in range(3)]

        def s1(k, q):
            return G[k] if k in major else (SN[k][(q - 1) % 3] if kind == 'xb' else SN[k][q])

        def s2(k, q):
            return G[k + 1] if k + 1 in major else SN[k + 1][q]
        A = np.zeros((cnt[0], cnt[0]), complex)
        b = np.zeros(cnt[0], complex)
        P = []
        for k in range(N):
            p = C[k] + [s1(k, q) for q in range(3)] + C[k + 1] + [s2(k, q) for q in range(3)]
            P.append(p)
            np.add.at(A, np.ix_(p, p), Yn)
        for j in major:
            A[G[j], G[j]] += 1 / Rs
        a = np.exp(2j * math.pi / 3)
        E = 150e3 * math.sqrt(2 / 3) * np.array([1, a * a, a])
        for q in range(3):
            s, c0, cN = src[q], C[0][q], C[N][q]
            A[s, s] += 1e12
            b[s] += 1e12 * E[q]
            g = 1 / Rsrc
            A[s, s] += g
            A[c0, c0] += g
            A[s, c0] -= g
            A[c0, s] -= g
            A[cN, cN] += 1 / RL
        V = np.linalg.solve(A, b)
        I1 = Yn @ V[P[0]]
        r = abs
        return {'I': r(I1[0]), 'Vj1a': r(V[P[0][9]]), 'Vj1b': r(V[P[0][10]]), 'Vj2a': r(V[P[1][9]]),
                'Is': [r(I1[3]), r(I1[4]), r(I1[5])]}

    def test_load(self):
        """Load at 50 Hz from the steady state, cross-bonded and solid-bonded side by side: the RMS of the core current,
        of the sheath voltages at the joints and of the sheath currents as the phasor solution of the exact sections
        (the core current within 0,1 %, the sheath voltages within 1 %, the sheath currents within 3 % or 0,1 A)."""
        o = node_json('xb_cases.js', json.dumps([{'cmp': 'xb_solid', 'ev': 'load'}]))[0]
        r = o['rms']
        x, s = self.phasor('xb'), self.phasor('solid')
        q = 1 / math.sqrt(2)
        self.assertEqual(o['warn'], [])
        self.assertAlmostEqual(r['I:XS1'], x['I'] * q, delta=1e-3 * x['I'] * q)
        self.assertAlmostEqual(r['I:YS1'], s['I'] * q, delta=1e-3 * s['I'] * q)
        for key, ref in (('V10:XS1', x['Vj1a']), ('V11:XS1', x['Vj1b']), ('V10:XS2', x['Vj2a']), ('V10:YS1', s['Vj1a'])):
            self.assertAlmostEqual(r[key], ref * q, delta=0.01 * ref * q, msg=key)
        for k, key in enumerate(('I4:XS1', 'I5:XS1', 'I6:XS1')):
            self.assertAlmostEqual(r[key], x['Is'][k] * q, delta=max(0.03 * x['Is'][k] * q, 0.1), msg=key)
        self.assertAlmostEqual(r['I4:YS1'], s['Is'][0] * q, delta=0.01 * s['Is'][0] * q)
        # what the tutorial is about: with solid bonding more than half the load current in the sheath, with
        # cross-bonding about 1 %
        self.assertGreater(r['I4:YS1'] / r['I:YS1'], 0.5)
        self.assertLess(max(r['I4:XS1'], r['I5:XS1'], r['I6:XS1']) / r['I:XS1'], 0.02)

    def test_step_against_nlt(self):
        """A 1 kV step on core a (1 μs front): the core at the open end and the sheath at joint 1 against the
        numerical Laplace transform of the nine exact sections with the same connections."""
        d = dict(lc.typical('150kV-land-s'), length=0.5)
        N = 9
        cnt = [0]

        def new():
            cnt[0] += 1
            return cnt[0]
        C = [[new() for q in range(3)] for j in range(N + 1)]
        major = {0, 3, 6, 9}
        G = {j: new() for j in sorted(major)}
        SN = {j: [new() for q in range(3)] for j in range(N + 1) if j not in major}
        el = [('V', C[0][0], 0, 30.0, ('ramp', 1000.0, 1e-6)), ('R', C[0][1], 0, 30.0), ('R', C[0][2], 0, 30.0)]
        el += [('R', G[j], 0, 1.0) for j in sorted(major)]
        for k in range(N):
            s1 = [G[k] if k in major else SN[k][(q - 1) % 3] for q in range(3)]
            s2 = [G[k + 1] if k + 1 in major else SN[k + 1][q] for q in range(3)]
            el.append(('LINE', C[k] + s1, C[k + 1] + s2, d, 'exact'))
        t, V = lc.nlt_solve({'nodes': cnt[0], 'el': el}, 3e-4, n=2048)
        o = node_json('xb_cases.js', json.dumps([{'cmp': 'xb', 'ev': 'step', 'trace': ['V7:XS9', 'V10:XS1'], 'every': 5}]))[0]
        tb = np.array(o['trace']['t'])
        a = np.interp(tb, t, V[C[9][0] - 1])
        b = np.interp(tb, t, V[SN[1][0] - 1])
        ya, yb = np.array(o['trace']['V7:XS9']), np.array(o['trace']['V10:XS1'])
        self.assertLess(np.abs(ya - a).max() / np.abs(a).max(), 0.01)
        self.assertLess(np.abs(yb - b).max() / np.abs(b).max(), 0.08)
        self.assertAlmostEqual(np.abs(yb).max(), np.abs(b).max(), delta=0.02 * np.abs(b).max())

    def test_energize(self):
        """Energizing the open cable at the peak of v_a: explicit and homogeneous (sheaths grounded) both run; the
        sheath at the cross-bonding joint takes tens of kV (why the link boxes have arresters), the homogeneous
        model has no joints to show it."""
        o = node_json('xb_cases.js', json.dumps([{'cmp': 'xb_gnd', 'ev': 'energize'}]))[0]
        pk = o['peak']
        U = 150e3 * math.sqrt(2 / 3)
        self.assertEqual(o['warn'], [])
        self.assertTrue(1.8 * U < pk['V7:XS9'] < 2.7 * U)
        self.assertTrue(1.6 * U < pk['V4:YS1'] < 2.2 * U)
        self.assertGreater(pk['V10:XS1'], 10e3)

    def test_other_tutorials(self):
        """The wideband option of line_fd, cable_fd (beside FD) and lightning_gis: the model is WB, and the
        lightning tutorial gives the peaks of its FD lines within 3 % (the substation, the tower top, the string)."""
        src = ("const W=%r;global.window=globalThis;global.Parts=require(W+'/parts.js');global.LineModels=require(W+'/linemodels.js');"
               "require(W+'/mna.js');require(W+'/tutorials.js');const T=globalThis.Tutorials,o=[];"
               "for(const id of ['line_fd','cable_fd']){const t=T.get(id),q={};for(const x of t.options)q[x.k]=x.def;q.cmp='wbfd';"
               "const pr=t.build(q);const c=pr.components.find(c=>c.id==='L1');o.push([id,c.params.model,JSON.parse(c.params.mdl).type]);}"
               "console.log(JSON.stringify(o));") % str(ROOT / 'web' / 'studio')
        r = subprocess.run(['node', '-e', src], capture_output=True, text=True, timeout=120)
        self.assertEqual(r.returncode, 0, r.stderr[-2000:])
        self.assertEqual(json.loads(r.stdout), [['line_fd', 'wb', 'wb'], ['cable_fd', 'wb', 'wb']])
        out = node_json('lightning_cases.js', json.dumps([{'lm': 'fd'}, {'lm': 'wb'}]), timeout=1500)
        for k in ('Y:VGa', 'Y:VEb', 'Y:T2/Vtop', 'Y:T2/Ua', 'Y:SEa/I'):
            self.assertAlmostEqual(out[1]['peak'][k], out[0]['peak'][k], delta=0.03 * out[0]['peak'][k], msg=k)


if __name__ == '__main__':
    unittest.main()
