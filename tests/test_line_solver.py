"""4.12: the line from geometry in the solver (TLM: CP, FD, π): the start from the sinusoidal steady state
(solve.init 'ac') and transpositions as separate sections.

The start is checked against the phasor solution of the same circuit with the model's own admittance at jω₀
(pcl.lineconst.model_admittance, independent of the browser's phasor stamp): without the steady start the line starts
de-energized (error ~0,9 of the peak), with it the waveform is the 50 Hz one from t = 0. The lightning tutorial with the
operating voltage: no transient before the stroke, and the phase voltage adds to the insulator voltage."""
import cmath
import copy
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
from pcl import lineconst as lc  # noqa: E402

VPK = 400e3 * math.sqrt(2 / 3)


def node_ok():
    try:
        return subprocess.run(['node', '--version'], capture_output=True).returncode == 0
    except OSError:
        return False


def run_case(kind, model, params=None, init='ac', h=20e-6, tend=0.04, Rs=1.0, RL=400.0, every=1, data=None):
    d = data or lc.typical('400kV')
    q = {'data': d, 'model': model, 'kind': kind, 'f': 50, 'f0': 50, 'Vpk': VPK, 'Rs': Rs, 'RL': RL, 'h': h, 'tend': tend,
         'init': init, 'params': params or {}, 'every': every}
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as fh:
        json.dump(q, fh)
    try:
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'tlm_ss_cases.js'), fh.name], capture_output=True, text=True,
                             check=True).stdout
    finally:
        os.unlink(fh.name)
    o = json.loads(out)
    w = 2 * math.pi * 50
    Yn = np.array(lc.model_admittance(model, 1j * w), complex)
    I = np.zeros(6, complex)
    for k in range(3):
        Yn[k, k] += 1 / Rs
        I[k] = VPK * cmath.exp(1j * (-2 * math.pi / 3 * k - math.pi / 2)) / Rs
        Yn[3 + k, 3 + k] += 1 / RL
    V = np.linalg.solve(Yn, I)
    t, v = np.array(o['t']), np.array(o['v'])
    err = max(np.abs(v[k] - (V[3 + k] * np.exp(1j * w * t)).real).max() for k in range(3)) / abs(V[3])
    return err, o


@unittest.skipUnless(node_ok(), 'node')
class SteadyStart(unittest.TestCase):
    d = lc.typical('400kV')

    def check(self, kind, model, params=None, tol=2e-5):
        e0, _ = run_case(kind, model, params, init='zero')
        e, o = run_case(kind, model, params)
        self.assertGreater(e0, 0.5)                 # de-energized at t = 0: the receiving end lags by τ and rings
        self.assertLess(e, tol, (kind, params))
        self.assertFalse(any('γραμμές από γεωμετρία' in w for w in o['warn']), o['warn'])

    def test_cp_lumped(self):
        self.check('cp', lc.cp_model(self.d, 50))

    def test_cp_kinds(self):
        for mode in ('lossless', 'distortionless', 'hf'):
            with self.subTest(mode=mode):
                self.check('cp', lc.cp_model(self.d, 50, mode=mode), {'cp': mode})

    def test_fd(self):
        self.check('fd', lc.fd_model(self.d))

    def test_pi(self):
        m = lc.api({'data': self.d, 'model': 'pi', 'len': 100, 'f': 50, 'npi': 10})['mdl']
        self.check('pi', m, {'npi': 10})

    def test_small_step(self):
        # with h = 1 μs the discrete model is the continuous one to (ωh)²: the start matches to 10⁻⁷
        for kind, m in (('cp', lc.cp_model(self.d, 50)), ('fd', lc.fd_model(self.d))):
            with self.subTest(kind=kind):
                e, o = run_case(kind, m, h=1e-6, tend=0.02, every=20)
                self.assertLess(e, 2e-7)

    def test_trapped_charge_keeps_precedence(self):
        # cpline §5: trapped charge and a steady start do not go together; the line starts from its charge
        m = lc.cp_model(self.d, 50)
        e, o = run_case('cp', m, {'vtrap': '1, -0.5, 0'}, tend=0.002)
        self.assertTrue(any('παγιδευμένο φορτίο' in w for w in o['warn']), o['warn'])


def line_case(data, kind, model, params, h=0.3e-6, tend=3e-3, Rs=10.0, tr=20e-6):
    q = {'data': data, 'model': model, 'kind': kind, 'f': 50, 'h': h, 'tend': tend, 'src': {'Vpk': 1.0, 'tr': tr, 'Rs': Rs},
         'R': 1e6, 'params': params}
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as fh:
        json.dump(q, fh)
    try:
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'line_cases.js'), fh.name], capture_output=True, text=True,
                             check=True).stdout
    finally:
        os.unlink(fh.name)
    o = json.loads(out)
    return np.array(o['t']), np.array(o['v']), o['warn']


@unittest.skipUnless(node_ok(), 'node')
class TranspositionSections(unittest.TestCase):
    """A 100 km line transposed in three equal sections (123, 231, 312) energized on phase a through 10 Ω: the solver's
    sections against the NLT of the same three section models with the same permutations (and, for FD, against the
    exact line in three sections, and against the perfectly transposed line, which differs)."""
    L, order, Rs, tr, tend = 100.0, [[1, 2, 3], [2, 3, 1], [3, 1, 2]], 10.0, 20e-6, 3e-3

    @classmethod
    def setUpClass(cls):
        d = lc.typical('400kV')
        d['length'] = cls.L
        cls.sec = copy.deepcopy(d)
        cls.sec['transp'] = {'len': [1, 1, 1], 'order': cls.order, 'mode': 'sec'}
        cls.avg = copy.deepcopy(d)
        cls.avg['transp'] = {'len': [1, 1, 1], 'order': cls.order, 'mode': 'avg'}

    def base(self):
        return [('V', 1, 0, self.Rs, ('ramp', 1.0, self.tr)), ('R', 2, 0, self.Rs), ('R', 3, 0, self.Rs), ('R', 4, 0, 1e6),
                ('R', 5, 0, 1e6), ('R', 6, 0, 1e6)]

    def sections(self, m, kind):
        el, J = self.base(), [[1, 2, 3], [7, 8, 9], [10, 11, 12], [4, 5, 6]]
        for i, sec in enumerate(m['sections']):
            o = sec['order']
            if kind == 'pi':
                f = sec['frac']
                sm = {k: v for k, v in m.items() if k != 'sections'}
                sm.update({k: (np.array(m[k]) * f).tolist() for k in ('R', 'L', 'C', 'G')}, N=max(1, round(m['N'] * f)))
            else:
                sm = sec['model']
            el.append(('LINE', [J[i][p - 1] for p in o], [J[i + 1][p - 1] for p in o], self.sec, sm))
        return {'nodes': 12, 'el': el}

    def err(self, t, V, ref):
        tn, Vr = ref
        pk = np.abs(Vr[:6]).max()
        return max(np.abs(np.interp(t, tn, Vr[j]) - V[j]).max() for j in range(6)) / pk

    def test_the_model_has_the_sections(self):
        m = lc.api({'data': self.sec, 'model': 'cp', 'len': self.L, 'f': 50})['mdl']
        self.assertEqual([s['order'] for s in m['sections']], self.order)
        self.assertAlmostEqual(sum(s['frac'] for s in m['sections']), 1.0)
        self.assertAlmostEqual(m['sections'][0]['model']['modes'][0]['tau'] * 3, m['modes'][0]['tau'], delta=1e-15)
        self.assertNotIn('sections', lc.api({'data': self.avg, 'model': 'cp', 'len': self.L, 'f': 50})['mdl'])

    def test_against_the_same_sections(self):
        for kind in ('cp', 'fd', 'pi'):
            with self.subTest(kind=kind):
                req = {'data': self.sec, 'model': kind, 'len': self.L, 'f': 50}
                if kind == 'pi':
                    req['npi'] = 30
                m = lc.api(req)['mdl']
                ref = lc.nlt_solve(self.sections(m, kind), self.tend, n=8192)
                t, V, w = line_case(self.sec, kind, m, {'npi': 30} if kind == 'pi' else {})
                self.assertLess(self.err(t, V, ref), 3e-3)

    def test_fd_sections_differ_from_the_perfect_transposition(self):
        ms = lc.api({'data': self.sec, 'model': 'fd', 'len': self.L})['mdl']
        ma = lc.api({'data': self.avg, 'model': 'fd', 'len': self.L})['mdl']
        t, Vs, _ = line_case(self.sec, 'fd', ms, {})
        t2, Va, _ = line_case(self.avg, 'fd', ma, {})
        pk = np.abs(Va).max()
        self.assertGreater(np.abs(Vs[3:] - Va[3:]).max() / pk, 0.05)   # the open far end of b and c: the coupling differs

    def test_steady_start_with_sections(self):
        m = lc.api({'data': self.sec, 'model': 'cp', 'len': self.L, 'f': 50})['mdl']
        e0, _ = run_case('cp', m, init='zero', data=self.sec)
        e, o = run_case_sections(m, self.sec)
        self.assertGreater(e0, 0.5)
        self.assertLess(e, 2e-5)


def run_case_sections(m, data):
    """The steady start of the three CP sections against the chained phasor solution of their admittances."""
    q = {'data': data, 'model': m, 'kind': 'cp', 'f': 50, 'f0': 50, 'Vpk': VPK, 'Rs': 1.0, 'RL': 400.0, 'h': 20e-6,
         'tend': 0.04, 'init': 'ac', 'params': {}, 'every': 1}
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as fh:
        json.dump(q, fh)
    try:
        o = json.loads(subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'tlm_ss_cases.js'), fh.name], capture_output=True,
                                      text=True, check=True).stdout)
    finally:
        os.unlink(fh.name)
    w = 2 * math.pi * 50
    Yn = np.zeros((12, 12), complex)
    J = [[0, 1, 2], [6, 7, 8], [9, 10, 11], [3, 4, 5]]
    for i, sec in enumerate(m['sections']):
        Y = np.array(lc.model_admittance(sec['model'], 1j * w), complex)
        idx = [J[i][p - 1] for p in sec['order']] + [J[i + 1][p - 1] for p in sec['order']]
        for a, ia in enumerate(idx):
            for b, ib in enumerate(idx):
                Yn[ia, ib] += Y[a, b]
    I = np.zeros(12, complex)
    for k in range(3):
        Yn[k, k] += 1.0
        I[k] = VPK * cmath.exp(1j * (-2 * math.pi / 3 * k - math.pi / 2))
        Yn[3 + k, 3 + k] += 1 / 400.0
    V = np.linalg.solve(Yn, I)
    t, v = np.array(o['t']), np.array(o['v'])
    return max(np.abs(v[k] - (V[3 + k] * np.exp(1j * w * t)).real).max() for k in range(3)) / abs(V[3]), o


def lightning(cases):
    out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'lightning_cases.js'), json.dumps(cases)], capture_output=True,
                         text=True, check=True).stdout
    return json.loads(out)


@unittest.skipUnless(node_ok(), 'node')
class LightningWithOperatingVoltage(unittest.TestCase):
    """lightning_gis with the option «Τάση λειτουργίας 50 Hz» (4.12)."""

    @classmethod
    def setUpClass(cls):
        cls.r = lightning([{'u50': 'peak', 'I': '0.001'}, {'u50': 'zero', 'I': '0.001'},
                           {'u50': 'peak', 'foot': 'r50', 'I': '100'}, {'foot': 'r50', 'I': '100'}])

    def test_no_transient_before_the_stroke(self):
        vs = 420e3 * math.sqrt(2 / 3)
        quiet = self.r[0]
        lo, hi = quiet['rng']['Y:VEa']
        self.assertGreater(lo, 0.99 * vs)           # phase a at its peak from t = 0 (30 km, light load: Ferranti ~1,0)
        self.assertLess(hi - lo, 1e-3 * vs)         # 50 μs at the crest of the 50 Hz wave (1 A stroke)
        lo, hi = quiet['rng']['Y:VGa']
        self.assertLess(hi - lo, 1e-3 * vs)
        # phase a at zero at the source: at the substation it lags by the 30 km (ω₀τ ≈ 1,8°, about −11 kV) and moves by
        # ω₀·50 μs·V̂ ≈ 5,4 kV; b and c are near ±√3/2 of the peak
        z = self.r[1]['rng']
        self.assertLess(abs(sum(z['Y:VEa']) / 2), 0.05 * vs)
        self.assertLess(z['Y:VEa'][1] - z['Y:VEa'][0], 0.02 * vs)
        self.assertAlmostEqual(sum(z['Y:VEb']) / 2 / vs, -math.sqrt(3) / 2, delta=0.04)
        self.assertAlmostEqual(sum(z['Y:VEc']) / 2 / vs, math.sqrt(3) / 2, delta=0.04)
        self.assertFalse(any('δεν λύνεται' in w for w in self.r[0]['warn']), self.r[0]['warn'])

    def test_phase_voltage_adds_to_the_insulator(self):
        peak, nov = self.r[2], self.r[3]
        # phase a at the crest flashes over first and earlier than without the operating voltage
        self.assertIn('T2a', peak['flash'])
        self.assertLess(peak['flash']['T2a'], nov['flash']['T2a'])
        self.assertGreater(peak['peak']['Y:T2/Ua'], nov['peak']['Y:T2/Ua'] - 1e3)


if __name__ == '__main__':
    unittest.main()
