"""4.18.1 (ROADMAP §58, part 2): grid-forming converters in a power system and the weak grid.

* A current control for a weak grid: the control of the MMC station (PI, 10 ms, PLL 20 Hz) oscillates at SCR 1 already
  without power; the robust vector current control of Harnefors et al. (2021) (MMCC cc = 'robust': no integral in the
  current loop, the PCC voltage fed forward through the loop bandwidth, a proportional AC-voltage path in d and an integral
  one in q) works with the same tuning at SCR 1, 2 and 5; near the static limit (0,9 pu at SCR 1) with a slow PLL (2 Hz).
* The MMC station as a grid-forming converter (MMCC mode 'gfm', the law of GFMC inside): the same numbers as GFMC; an
  island (droop, VSM), two grid-forming units in parallel (the load shared in proportion), a weak grid (droop, PSC).
* IEEE 9 with the unit at bus 3 a converter of 128 MVA from the load flow: a start without transient, and the frequency
  metrics of Tayyebi et al. (2020) after a load step: grid-following without frequency response the worst, the VSM with the
  inertia of G3 the RoCoF of G3, the droop of 5 % less deviation than the synchronous machine with its steam governor.
* SciPy: the robust current control in the SciPy solver (first-order convergence with the step).
Headless in Node: tests/js/gfm_cases.js.
"""
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
JS = ROOT / 'tests' / 'js' / 'gfm_cases.js'


def cases(cs, timeout=1800):
    r = subprocess.run(['node', str(JS), json.dumps(cs)], capture_output=True, text=True, timeout=timeout, cwd=str(ROOT))
    if r.returncode:
        raise RuntimeError(r.stderr[-3000:])
    out = json.loads(r.stdout)
    for o in out:
        if 'error' in o:
            raise RuntimeError(o['error'][:3000])
    return out


def mean(o, t, key):
    return next(q for q in o['out'] if abs(q['t'] - t) < 1e-6)[key]['mean']

K_W = ['Y:CT/PP', 'Y:CT/VG']


def ext(o, t, key, f):
    return next(q for q in o['out'] if abs(q['t'] - t) < 1e-6)[key][f]


class WeakCurrentControl(unittest.TestCase):
    def test_classic_control_oscillates_at_scr_1(self):
        o = cases([{'kind': 'tut', 'id': 'gfm_weak', 'opts': {'ctl': 'gfl', 'scr': '1', 'p0': '0.5'}, 'at': [0.4], 'keys': K_W, 'win': 0.1}])[0]
        self.assertGreater(ext(o, 0.4, 'Y:CT/PP', 'max') - ext(o, 0.4, 'Y:CT/PP', 'min'), 0.5)

    def test_robust_control_at_any_scr(self):
        o = cases([{'kind': 'tut', 'id': 'gfm_weak', 'opts': {'ctl': 'gflw', 'scr': s, 'p0': '0.8'}, 'at': [1.19, 1.59], 'keys': K_W, 'win': 0.05}
                   for s in ('1', '2', '5')])
        for s, q in zip(('1', '2', '5'), o):
            self.assertEqual(q['warn'], [])
            self.assertLess(abs(mean(q, 1.19, 'Y:CT/PP') + 0.8), 3e-3, s)
            self.assertLess(abs(mean(q, 1.19, 'Y:CT/VG') - 1), 5e-3, s)
            self.assertLess(ext(q, 1.19, 'Y:CT/PP', 'max') - ext(q, 1.19, 'Y:CT/PP', 'min'), 0.01, s)
            if s != '1':   # 0,9 pu at SCR 1 needs a slower PLL (next test)
                self.assertLess(abs(mean(q, 1.59, 'Y:CT/PP') + 0.9), 3e-3, s)

    def test_static_limit_with_a_slow_pll(self):
        # SCR 1: P_max = 1/(X_T + X_g) = 0,906 pu from the PCC; 0,9 pu with the PLL at 2 Hz (Zhou et al. 2014)
        o = cases([{'kind': 'tut', 'id': 'gfm_weak', 'opts': {'ctl': 'gflw', 'scr': '1', 'p0': '0.8', 'pll': '2'}, 'at': [1.59], 'keys': K_W, 'win': 0.05}])[0]
        self.assertLess(abs(mean(o, 1.59, 'Y:CT/PP') + 0.9), 0.03)
        self.assertLess(abs(mean(o, 1.59, 'Y:CT/VG') - 1), 0.01)


K_H = ['Y:CT2/G/PP', 'Y:CT2/G/WW', 'Y:CT2/G/VG', 'Y:CTB/PP', 'Y:CTB/WW']


class MmcGridForming(unittest.TestCase):
    def test_station_law_is_the_gfmc(self):
        # the station control in mode 'gfm' with the PSC of gfm_weak on the same VSC: the numbers of GFMC itself
        st = {'mode': 'gfm', 'law': 'psc', 'kp': 130, 'avc': 'vac', 'Vacref': '1', 'KE': 10, 'TE': 0.05, 'kv': 0.477, 'av': 40, 'Ilim': 1.08, 'tsoft': 0.05, 'ac': 600}
        o = cases([{'kind': 'tut', 'id': 'gfm_weak', 'at': [1.19, 1.59], 'keys': ['Y:CT/PP', 'Y:CT/VG']},
                   {'kind': 'tut', 'id': 'gfm_weak', 'opts': {'ctl': 'gfl'}, 'set': {'CT': st}, 'at': [1.19, 1.59], 'keys': ['Y:CT/G/PP', 'Y:CT/G/VG']}])
        for t in (1.19, 1.59):
            self.assertLess(abs(mean(o[0], t, 'Y:CT/PP') - mean(o[1], t, 'Y:CT/G/PP')), 1e-9)
            self.assertLess(abs(mean(o[0], t, 'Y:CT/VG') - mean(o[1], t, 'Y:CT/G/VG')), 1e-9)

    def test_island_and_two_units(self):
        o = cases([{'kind': 'tut', 'id': 'hvdc_gfm', 'opts': {'ac': ac, 'law': law}, 'at': [0.59, 1.19], 'keys': K_H, 'win': 0.04}
                   for ac, law in (('island', 'droop'), ('par', 'droop'), ('island', 'vsm'))])
        isl, par, vsm = o
        for q in o:
            self.assertEqual(q['warn'], [])
        for t in (0.59, 1.19):
            p, w = mean(isl, t, 'Y:CT2/G/PP'), mean(isl, t, 'Y:CT2/G/WW')
            self.assertLess(abs(w - (1 - 0.02 * (p - 0.55))), 3e-4)            # droop: 1 − ω = m_p·(P − P_ref)
            p2, pb = mean(par, t, 'Y:CT2/G/PP'), mean(par, t, 'Y:CTB/PP')
            self.assertLess(abs((p2 - 0.55) - (pb - 0.55)), 3e-3)              # the same pu on 1059 and 500 MVA
            self.assertLess(abs(mean(par, t, 'Y:CT2/G/WW') - mean(par, t, 'Y:CTB/WW')), 1e-4)
        self.assertGreater(mean(isl, 1.19, 'Y:CT2/G/PP') - mean(isl, 0.59, 'Y:CT2/G/PP'), 0.2)   # +300 MW
        # VSM: P/ω = P_ref − (ω − 1)/m_p (P at the internal EMF), once the slow mode 2H·m_p = 0,08 s has settled after the step
        p, w = mean(vsm, 1.19, 'Y:CT2/G/PP'), mean(vsm, 1.19, 'Y:CT2/G/WW')
        self.assertLess(abs(p / w - (0.55 - (w - 1) / 0.02)), 1e-3)

    def test_weak_grid(self):
        o = cases([{'kind': 'tut', 'id': 'hvdc_gfm', 'opts': {'ac': 'weak', 'law': law}, 'at': [0.59, 1.19], 'keys': K_H, 'win': 0.04} for law in ('droop', 'psc')])
        dr, ps = o
        for t, ref in ((0.59, 0.5), (1.19, 0.9)):
            p, w = mean(dr, t, 'Y:CT2/G/PP'), mean(dr, t, 'Y:CT2/G/WW')
            self.assertLess(abs(p - (ref + (1 - w) / 0.02)), 0.01)
            self.assertLess(abs(mean(ps, t, 'Y:CT2/G/PP') - ref), 0.01)


class Ieee9(unittest.TestCase):
    K = ['Y:G1', 'Y:G1:pe']

    def run_cyc(self, units, T):
        return cases([{'kind': 'cyc', 'id': 'ieee9_gfm', 'opts': {'unit': u}, 'T': T, 'Tc': 1 / 60, 'keys': self.K + (['Y:CT3/PP'] if u != 'sm' else [])} for u in units])

    def test_start_from_the_load_flow(self):
        for u, q in zip(('droop', 'gfl'), self.run_cyc(('droop', 'gfl'), 1.0)):
            self.assertEqual(q['warn'], [])
            pre = [r for r in q['out'] if 0.7 < r[0] <= 1.0]
            w1 = sum(r[1] for r in pre) / len(pre)
            p1 = sum(r[2] for r in pre) / len(pre)
            p3 = sum(r[3] for r in pre) / len(pre)
            self.assertLess(abs(w1 - 1), 3e-4, u)
            self.assertLess(abs(p1 - 0.7164), 0.01, u)
            self.assertLess(abs(abs(p3) - 85 / 128), 0.01, u)

    def test_frequency_metrics(self):
        units = ('sm', 'droop', 'vsm', 'gfl', 'gfl0')
        res = {}
        for u, q in zip(units, self.run_cyc(units, 4.0)):
            cyc = q['out']
            w0 = sum(r[1] for r in cyc if 0.9 < r[0] <= 1.0) / len([r for r in cyc if 0.9 < r[0] <= 1.0])
            at = lambda t: min(cyc, key=lambda r: abs(r[0] - t))[1]
            res[u] = {'df': w0 - at(4.0), 'rocof': abs(at(1.25) - w0) / 0.25}
        r = res
        self.assertGreater(r['gfl0']['df'], r['sm']['df'])          # no inertia, no regulation at bus 3
        self.assertLess(r['droop']['df'], r['sm']['df'])            # the droop of 5 % at once instead of the steam governor
        self.assertLess(r['vsm']['df'], r['sm']['df'])
        self.assertGreater(r['gfl0']['rocof'], r['gfl']['rocof'])
        self.assertGreater(r['gfl']['rocof'], r['vsm']['rocof'])
        self.assertLess(r['vsm']['rocof'], r['droop']['rocof'])     # the inertia of G3 against 2H = 1/(m_p·ω_f) ≈ 0,64 s
        self.assertLess(abs(r['vsm']['rocof'] / r['sm']['rocof'] - 1), 0.1)


class SciPy(unittest.TestCase):
    def test_robust_current_control(self):
        import numpy as np
        from engine.batch import simulate
        o = cases([{'kind': 'scipyTut', 'id': 'gfm_weak', 'opts': {'ctl': 'gflw', 'scr': '2', 'p0': '0.5'}, 'T': 0.01, 'keys': ['Y:CT/PP', 'Y:CT/ID'], 'hDiv': h} for h in (400, 4000)])
        dif = []
        for q in o:
            self.assertEqual(q['warn'], [])
            d = q['batch']
            self.assertEqual(d['skipped'], [])
            rec = np.array(q['rec'])
            ts = rec[:, 0]
            r = simulate({'net': d['net'], 'channels': d['channels'], 't_end': float(ts[-1]), 'method': 'Radau', 'rtol': 1e-7,
                          'atol': 1e-9, 'max_points': 400000, '_local': True, 'wall': 900})
            self.assertEqual(r['status'], 'ok', r['message'])
            t = np.array(r['t'])
            dif.append([float(np.max(np.abs(rec[:, j + 1] - np.interp(ts, t, np.array(r['ch'][k], float))))) for j, k in enumerate(q['ch'])])
        for j in (0, 1):
            self.assertLess(dif[1][j], 0.5 * dif[0][j], dif)
            self.assertLess(dif[1][j], 0.01, dif)


if __name__ == '__main__':
    unittest.main()
