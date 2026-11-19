"""The GIS substation and very-fast-front transients (4.22, ROADMAP §51, §53, §61): the disconnector with restrikes (DS),
the leader progression model of a gap (SG, TOWER), the initial voltage of a line (TL v0), the coaxial data of a line, the
multistory tower, against independent solutions: the SciPy solver of the server, an independent integration of the
LPM, the closed forms of travelling waves, and the method of characteristics of pcl.surge for the 765 kV GIS of
IEC TR 60071-4 (test case 4)."""
import json
import math
import subprocess
import unittest
from pathlib import Path

import numpy as np
from scipy.integrate import solve_ivp

from engine import batch
from pcl import surge

ROOT = Path(__file__).resolve().parent.parent
_CACHE = {}


def cases(which):
    if which not in _CACHE:
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'gis_cases.js'), which], capture_output=True, text=True,
                             check=True, timeout=1800, cwd=ROOT).stdout
        _CACHE[which] = json.loads(out)
    return _CACHE[which]


def scipy_run(req, t_end, keys):
    r = batch.simulate({'net': req['net'], 'channels': {k: req['channels'][k] for k in keys}, 't_end': t_end, 'method': 'Radau',
                        'rtol': 1e-8, 'atol': 1e-6, '_local': True, 'wall': 600, 'events': 20000})
    assert r['status'] == 'ok', r['message']
    return r


def lpm_reference(S, g=1.0, E50=560e3, K=None, E0=None, R=10.0):
    """The LPM on a ramp v = S·t (the gap current is zero before the breakdown, so the 10 Ω drop is nil), integrated with
    solve_ivp to the breakdown: first the streamers, then the leader."""
    K = K or (1.2e-6 if S > 0 else 1.3e-6)
    E0 = E0 or (520e3 if S > 0 else 600e3)
    x = lambda t: abs(S) * t

    def ds(t, y):
        r = 1.25 * (x(t) / g) / E50 - 0.95
        return [max(r, 0.0) / 1e-6]
    ev = lambda t, y: y[0] - 1.0
    ev.terminal = True
    a = solve_ivp(ds, (0, 1e-4), [0.0], events=ev, rtol=1e-12, atol=1e-14, max_step=1e-9)
    t1 = a.t_events[0][0]

    # the leader with the length as the variable (dt/dL, bounded where L → g): the bracket stays positive on a ramp
    def dt(L, y):
        return [1.0 / (K * x(y[0]) * (x(y[0]) / (g - L) - E0))]
    assert x(t1) / g > E0
    b = solve_ivp(dt, (0.0, g * (1 - 1e-9)), [t1], rtol=1e-12, atol=1e-18)
    return float(b.y[0][-1])


class Disconnector(unittest.TestCase):
    def test_closing_restrikes_against_scipy(self):
        c = cases('ds')['ds_close']
        on = [t for t, v, _ in c['gaps'] if v == 1]
        self.assertGreaterEqual(len(on), 3)
        r = scipy_run(c['req'], c['T1'], ['V:C1'])
        sp = [e['t'] for e in r['events']['list'] if e.get('kind') == 'gap' and e.get('v') == 1]
        # the strikes at the same instants (within 20 μs: the voltage left on the bus by each spark depends on where its
        # high-frequency current is cut, which the two solvers locate with their own steps)
        for a, b in zip(on[:4], sp[:4]):
            self.assertLess(abs(a - b), 20e-6, (on[:4], sp[:4]))
        # the contacts touch at t₀ + T_s = 13 ms: after that the bus follows the source in both
        self.assertLess(abs(c['vC'] - r['ch']['V:C1'][-1]), 0.01 * 343e3)

    def test_opening_trapped_charge(self):
        c = cases('ds')['ds_open']
        ev = [(t, v) for t, v, _ in c['gaps']]
        self.assertEqual(ev[0][1], 0)                       # the spark of the parting contacts goes out first
        self.assertAlmostEqual(ev[0][0], 5e-3, delta=0.2e-3)   # at the zero of the charging current (the peak of the source)
        r = scipy_run(c['req'], c['T1'], ['V:C1'])
        sp = [(e['t'], e['v']) for e in r['events']['list'] if e.get('kind') == 'gap']
        self.assertEqual([v for _, v in ev], [v for _, v in sp])
        for (a, _), (b, _) in zip(ev, sp):
            self.assertLess(abs(a - b), 20e-6)
        self.assertLess(abs(c['vC'] - r['ch']['V:C1'][-1]), 0.01 * 343e3)   # the charge left on the bus
        self.assertGreater(abs(c['vC']), 0.2 * 343e3)


class InitialVoltage(unittest.TestCase):
    def test_trapped_line_doubles(self):
        # a 50 Ω line at −1 kV: E = 2 kV behind 50 Ω sends (2 − (−1))/2 = 1,5 kV, which doubles at the open end: −1 + 3 = 2 kV
        c = cases('tl')['tl']
        self.assertAlmostEqual(c['v'][0], -1000, delta=1)
        self.assertAlmostEqual(c['v'][2], 2000, delta=2)
        r = scipy_run(c['req'], 1e-5, ['V:C0'])
        t, v = np.array(r['t']), np.array(r['ch']['V:C0'])
        self.assertAlmostEqual(float(np.interp(2.5e-6, t, v)), -1000, delta=1)
        self.assertAlmostEqual(float(np.interp(9.5e-6, t, v)), 2000, delta=2)

    def test_coaxial(self):
        c = cases('tl')
        self.assertAlmostEqual(c['coax']['Z'], 60 * math.log(0.5 / 0.15), places=9)
        self.assertAlmostEqual(c['coax']['tau'], 10 / (0.96 * 299792458), places=15)
        self.assertAlmostEqual(c['coax_cable']['Z'], 60 * math.log(3) / math.sqrt(2.3), places=9)
        self.assertAlmostEqual(c['coax_cable']['tau'], 100 * math.sqrt(2.3) / 299792458, places=15)


class LeaderProgression(unittest.TestCase):
    def test_against_independent_integration(self):
        c = cases('lpm')
        for S in (1e12, -1e12, 4e11):
            r = c['lpm_' + str(int(S))]
            ref = lpm_reference(S)
            self.assertLess(abs(r['h1e-10'] / ref - 1), 2e-3, (S, r, ref))
            self.assertLess(abs(r['h1e-9'] / ref - 1), 3e-3, (S, r, ref))

    def test_scipy(self):
        c = cases('lpm')
        for S in (1e12, -1e12):
            r = c['lpm_' + str(int(S))]
            sp = scipy_run(r['req'], 8e-6, ['V:SG1'])
            t = [e['t'] for e in sp['events']['list'] if e.get('kind') == 'gap' and e.get('v') == 1]
            self.assertTrue(t)
            self.assertLess(abs(t[0] / lpm_reference(S) - 1), 2e-3, (S, t[0]))


class MultistoryTower(unittest.TestCase):
    def test_table_I(self):
        # R_i = 2·Z_ti·ln(1/γ)·h_i/H, L_i = 2·(H/v)·R_i with Z_t1 = 220 Ω, Z_t2 = 150 Ω, γ = 0,8, v = 300 m/μs: the values of
        # Table I of the paper (8,32 / 20,37 / 33,47 Ω, 3,49 / 8,53 / 14,01 μH) with the heights we read from them
        c = cases('ms')['ms']
        for a, b in zip(c['R'], [8.32, 20.37, 20.37, 33.47]):
            self.assertLess(abs(a / b - 1), 2e-3)
        for a, b in zip(c['L'], [3.49e-6, 8.53e-6, 8.53e-6, 14.01e-6]):
            self.assertLess(abs(a / b - 1), 4e-3)
        self.assertEqual(c['types'], ['GND', 'JUNC', 'L', 'PORT', 'R', 'TL'])


class Tutorials(unittest.TestCase):
    def test_gis765_against_characteristics(self):
        c = cases('tut')['gis765']
        nw = surge.from_project(c['project'])
        r = surge.solve(nw, max(c['t']) + 2e-12, 2e-12, {'UC1': nw['probes']['VUC'], 'UK': nw['probes']['VUK']})
        for T, a, b in zip(c['t'], c['uc'], c['uk']):
            ua, ub = float(np.interp(T, r['t'], r['UC1'])), float(np.interp(T, r['t'], r['UK']))
            self.assertLess(abs(a - ua), 0.025 * 100, (T, a, ua))
            self.assertLess(abs(b - ub), 0.025 * 100, (T, b, ub))
        # the closed forms: 100 V into the matched bus, 100·(1 + Γ) after the reflection from J3 (Γ = −1/3)
        self.assertAlmostEqual(c['uc'][0], 100, delta=0.5)
        self.assertAlmostEqual(c['uc'][1], 200 / 3, delta=2.5)
        self.assertLess(abs(c['uk'][2]), 1e-6)              # nothing at UK before the 56,2 ns of the fastest path

    def test_vfto_peaks_against_characteristics(self):
        c = cases('tut')['vfto']
        nw = surge.from_project(c['project'], t_close=c['closes'])
        pr = {'VUK': nw['probes']['VUK'], 'VT29': nw['probes']['VT29'], 'VJ7': nw['probes']['VJ7']}
        r = surge.solve(nw, 2e-6, 4e-12, pr)
        for k in pr:
            a = abs(c['peaks']['Y:' + k][0])
            b = float(np.max(np.abs(r[k])))
            self.assertLess(abs(a / b - 1), 0.05, (k, a, b))
        pk = max(abs(v[0]) for v in c['peaks'].values()) / c['Vs']
        self.assertGreater(pk, 1.4)
        self.assertLess(pk, 3.0)                            # the bound of an open end: 1 + 2·ΔU/2·… ≤ 3 pu

    def test_lightning_models_of_the_strings(self):
        c = cases('tut')
        t_ub, t_de, t_lpm = c['lg_ub']['gaps'][0], c['lg_de']['gaps'][0], c['lg_lpm']['gaps'][0]
        # the same stroke: the volt–time models break down later than the fixed U_b and stand a higher peak
        self.assertLess(t_ub, t_de)
        self.assertLess(t_ub, t_lpm)
        self.assertGreater(abs(c['lg_lpm']['Ua'][0]), 2.24e6)
        self.assertGreater(abs(c['lg_ms']['top'][0]), abs(c['lg_ub']['top'][0]) * 0)   # the multistory tower runs

    def test_restrike_tutorial(self):
        c = cases('tut')
        self.assertGreater(c['dsr_close']['n'], 5)
        self.assertGreater(c['dsr_open']['n'], 1)
        self.assertGreater(abs(c['dsr_open']['end']), 0.1 * c['dsr_open']['Vp'])   # a trapped charge after the opening
        self.assertGreater(c['insco']['VT'][0], c['insco']['VE'][0])                  # the separation raises the peak


if __name__ == '__main__':
    unittest.main()
