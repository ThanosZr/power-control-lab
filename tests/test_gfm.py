"""4.18 (ROADMAP §58): grid-forming converters. The two-level VSC as an average model (VSC2) and its grid-forming control
(GFMC): droop P–f/Q–V (Rocabert et al. 2012), the virtual synchronous machine as the synchronverter (Zhong & Weiss 2011),
power-synchronization control (Zhang, Harnefors & Nee 2010); direct voltage or cascaded loops, current limit (THEORY §8Ε).

The cases run headless in Node (tests/js/gfm_cases.js): one converter against a stiff grid (the small-signal modes of the
droop and of the VSM against their closed forms), one converter in an island in overload (the current limit), a converter
on its DC terminals (the powers), and the three tutorials (the island of two converters, the synchronverter, the PSC in a
weak grid) against the steady states that their laws give.
"""
import json
import math
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / 'tests' / 'js' / 'gfm_cases.js'
W0 = 2 * math.pi * 50


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


def mode(out):
    """The slow mode of a step response: the 50 Hz of the electrical transient removed by a 20 ms moving average, then the
    damped frequency from two extrema of the same sign and the damping from their ratio."""
    import numpy as np
    a = np.array(out)
    t, p = a[:, 0], a[:, 1]
    n = int(round(0.02 / (t[1] - t[0])))
    ps = np.convolve(p, np.ones(n) / n, mode='valid')
    ts = t[n - 1:]
    x = ps - ps[-1]
    ext = [i for i in range(1, len(x) - 1) if (x[i] - x[i - 1]) * (x[i + 1] - x[i]) < 0 and abs(x[i]) > 2e-4]
    t0, t2, v0, v2 = ts[ext[0]], ts[ext[2]], x[ext[0]], x[ext[2]]
    dec = math.log(abs(v0 / v2))
    return 2 * math.pi / (t2 - t0), dec / math.sqrt(4 * math.pi ** 2 + dec ** 2)


class Grid(unittest.TestCase):
    # one converter (X_f = 0,1 pu) against a stiff grid behind X_g = 0,1 pu, R = 0,015 pu in all; P_ref 0 → 0,2 pu at 0,3 s.
    # Quasi-static: P = K_s·δ with K_s = E·V/X = 5
    def test_droop_small_signal(self):
        # δ' = −ω₀·m_p·(P_f − P_ref), P_f' = ω_f·(K_s·δ − P_f): s² + ω_f·s + ω_f·ω₀·m_p·K_s = 0
        o = cases([{'kind': 'grid', 'law': 'droop', 'Rg': 0.16, 'T': 1.1}])[0]
        self.assertEqual(o['warn'], [])
        wd, z = mode(o['out'])
        wf, mp, ks = 2 * math.pi * 5, 0.02, 5.0
        wn = math.sqrt(wf * W0 * mp * ks)
        zp = wf / (2 * wn)
        self.assertLess(abs(wd / (wn * math.sqrt(1 - zp * zp)) - 1), 0.04, (wd, z))
        self.assertLess(abs(z - zp), 0.03, (wd, z))
        self.assertLess(abs(o['out'][-1][1] - 0.2), 2e-3)

    def test_vsm_small_signal(self):
        # 2H·ω' = P_ref − P − D_p·(ω − 1), δ' = ω₀·(ω − 1): s² + (D_p/2H)·s + ω₀·K_s/(2H) = 0, D_p = 1/m_p
        o = cases([{'kind': 'grid', 'law': 'vsm', 'Rg': 0.16, 'ct': {'H': 2}, 'T': 1.3}])[0]
        wd, z = mode(o['out'])
        h2, d, ks = 4.0, 50.0, 5.0
        wn = math.sqrt(W0 * ks / h2)
        zp = d / h2 / (2 * wn)
        self.assertLess(abs(wd / (wn * math.sqrt(1 - zp * zp)) - 1), 0.04, (wd, z))
        self.assertLess(abs(z - zp), 0.03, (wd, z))

    def test_droop_follows_the_grid_frequency(self):
        # grid at 49,9 Hz: ω = 1 − m_p·(P − P_ref) ⇒ P = P_ref + (1 − f_g/f₀)/m_p = 0,2 + 0,1
        o = cases([{'kind': 'grid', 'law': 'droop', 'fg': 49.9, 'T': 0.9, 'dt': 0.01, 'keys': ['Y:CT/PP', 'Y:CT/WW']}])[0]
        self.assertLess(abs(o['out'][-1][1] - 0.3), 3e-3, o['out'][-1])
        self.assertLess(abs(o['out'][-1][2] - 0.998), 1e-4, o['out'][-1])


class Island(unittest.TestCase):
    def test_current_limit_in_overload(self):
        # one converter (cascade) with 0,8 pu of load and at 0,3 s another 0,8 pu: |i| = I_max = 1,2 pu, the voltage sags to
        # about I_max/G
        o = cases([{'kind': 'island1', 'cmd': '0:0, 0.3:1', 'at': [0.25, 0.5], 'keys': ['Y:CT/PP', 'Y:CT/IG', 'Y:CT/LR', 'Y:CT/VG', 'Y:CT/WW']}])[0]
        self.assertEqual(o['warn'], [])
        self.assertLess(abs(mean(o, 0.25, 'Y:CT/VG') - 1), 0.005)
        self.assertEqual(mean(o, 0.25, 'Y:CT/LR'), 0)
        self.assertLess(abs(mean(o, 0.5, 'Y:CT/IG') - 1.2), 0.005)
        self.assertEqual(mean(o, 0.5, 'Y:CT/LR'), 1)
        self.assertTrue(0.72 < mean(o, 0.5, 'Y:CT/VG') < 0.78)
        # the P–f law goes on in the limit: ω = 1 − m_p·P
        self.assertLess(abs(mean(o, 0.5, 'Y:CT/WW') - (1 - 0.02 * mean(o, 0.5, 'Y:CT/PP'))), 1e-3)

    def test_dc_terminals_power_balance(self):
        # the DC power v_dc·i_dc against P (6 kW + 2 kvar): within ω·h·Q of the delay of the controlled sources
        o = cases([{'kind': 'dcpins', 'at': [0.3]}])[0]
        r = o['out'][0]
        pdc, pac = r['extra'], r['Y:CT/PP']['mean'] * 10e3
        self.assertLess(abs(pdc / pac - 1), 0.01, (pdc, pac))
        self.assertLess(abs(r['Y:VS/VD']['mean'] - 800), 1)


K_ISL = ['Y:CT1/PP', 'Y:CT2/PP', 'Y:CT1/WW', 'Y:CT2/WW', 'Y:CT1/QQ', 'Y:CT2/QQ', 'Y:CT1/LR', 'Y:CT2/LR']


class IslandTutorial(unittest.TestCase):
    def check(self, o, s1, s2, vsm=False):
        # droop: 1 − ω = m_p·(P − P_ref) in each; VSM: (1 − ω)·ω = m_p·(P − P_ref) (T = P/ω)
        for t, pr in ((0.45, 0), (0.95, 0), (1.45, 0.2)):
            p1, p2, w1, w2 = (mean(o, t, k) for k in K_ISL[:4])
            self.assertLess(abs(w1 - w2), 1e-4, (t, w1, w2))
            pl = p1 * s1 + p2 * s2
            self.assertLess(abs((1 - w1) * (w1 if vsm else 1) - 0.02 * (pl - s1 * pr) / (s1 + s2)), 2e-4, (t, w1))
            # (the VSM: a lightly damped exchange between the two rotors of a few thousandths remains)
            self.assertLess(abs((p1 - p2) - pr), 0.02 if vsm else 0.01, (t, p1, p2))
            self.assertEqual(mean(o, t, 'Y:CT1/LR') + mean(o, t, 'Y:CT2/LR'), 0)

    def test_cascade_shares_with_the_droop(self):
        o = cases([{'kind': 'tut', 'id': 'gfm_island', 'at': [0.45, 0.95, 1.45], 'keys': K_ISL}])[0]
        self.assertEqual(o['warn'], [])
        self.check(o, 10e3, 10e3)

    def test_ratings_two_to_one(self):
        # equal per unit in each converter: 2:1 in watts
        o = cases([{'kind': 'tut', 'id': 'gfm_island', 'opts': {'size': '21'}, 'at': [0.45, 0.95, 1.45], 'keys': K_ISL}])[0]
        self.check(o, 10e3, 5e3)

    def test_direct_and_vsm(self):
        o = cases([{'kind': 'tut', 'id': 'gfm_island', 'opts': {'inner': 'direct'}, 'at': [0.45, 0.95, 1.45], 'keys': K_ISL},
                   {'kind': 'tut', 'id': 'gfm_island', 'opts': {'law': 'vsm'}, 'at': [0.45, 0.95, 1.45], 'keys': K_ISL}])
        self.check(o[0], 10e3, 10e3)
        self.check(o[1], 10e3, 10e3, vsm=True)


K_SYN = ['Y:CT/PP', 'Y:CT/QQ', 'Y:CT/WW', 'Y:CT/VG']


class Synchronverter(unittest.TestCase):
    # Zhong & Weiss (2011), Fig. 5: P and Q at the internal EMF, D_p for 100 % P at −0,5 %, D_q for 100 % Q at −5 %
    def test_set_mode_and_droops(self):
        o = cases([{'kind': 'tut', 'id': 'gfm_sync', 'at': [0.59, 0.89, 1.19, 1.49], 'keys': K_SYN}])[0]
        self.assertEqual(o['warn'], [])
        g = 49.95 / 50
        # set mode: ω_r = the grid frequency, no D_q: T_m = T_e ⇒ P = ω·P_set, Q = Q_set
        self.assertLess(abs(mean(o, 0.59, 'Y:CT/PP') - g * 0.8), 3e-3)
        self.assertLess(abs(mean(o, 0.59, 'Y:CT/QQ')), 3e-3)
        self.assertLess(abs(mean(o, 0.89, 'Y:CT/QQ') - 0.6), 3e-3)
        # droops: P = ω·(P_set + D_p·(1 − ω)) = +20 W at −0,1 %; Q = Q_set + D_q·(V_r − V_m)
        for t in (1.19, 1.49):
            self.assertLess(abs(mean(o, t, 'Y:CT/PP') - g * (0.8 + 200 * (1 - g))), 6e-3, t)
            self.assertLess(abs(mean(o, t, 'Y:CT/QQ') - (0.6 + 20 * (1 - mean(o, t, 'Y:CT/VG')))), 0.01, t)
            self.assertLess(abs(mean(o, t, 'Y:CT/WW') - g), 2e-5, t)
        # above the nominal voltage the droop lowers Q (Fig. 5(a), about −50 var); with the grid 5 % down it is back near 60
        self.assertLess(mean(o, 1.19, 'Y:CT/QQ'), 0.1)
        self.assertTrue(0.6 < mean(o, 1.49, 'Y:CT/QQ') < 0.7)

    def test_nominal_grid_frequency(self):
        o = cases([{'kind': 'tut', 'id': 'gfm_sync', 'opts': {'fg': '50'}, 'at': [1.19], 'keys': K_SYN}])[0]
        self.assertLess(abs(mean(o, 1.19, 'Y:CT/PP') - 0.8), 3e-3)


K_W = ['Y:CT/PP', 'Y:CT/VG', 'Y:CT/IG', 'Y:CT/LR']


class WeakGrid(unittest.TestCase):
    # Zhang, Harnefors & Nee (2010): SCR 1, 0,8 pu, step 0,1 pu; three-phase fault with the current limit
    def test_psc_step_at_scr_1(self):
        o = cases([{'kind': 'tut', 'id': 'gfm_weak', 'at': [1.19, 1.59], 'keys': K_W}])[0]
        self.assertEqual(o['warn'], [])
        self.assertLess(abs(mean(o, 1.19, 'Y:CT/PP') - 0.8), 2e-3)
        self.assertLess(abs(mean(o, 1.59, 'Y:CT/PP') - 0.9), 2e-3)
        for t in (1.19, 1.59):
            self.assertGreater(mean(o, t, 'Y:CT/VG'), 0.98)
            self.assertEqual(mean(o, t, 'Y:CT/LR'), 0)
        self.assertLess(mean(o, 1.59, 'Y:CT/IG'), 1.08)

    def test_psc_fault_ride_through(self):
        o = cases([{'kind': 'tut', 'id': 'gfm_weak', 'opts': {'ev': 'fault', 'scr': s}, 'at': [1.3, 1.59], 'keys': K_W} for s in ('1', '5')])
        for q in o:
            self.assertEqual(mean(q, 1.3, 'Y:CT/LR'), 1)
            self.assertLess(q['out'][0]['Y:CT/IG']['max'], 1.08 * 1.07)
            self.assertLess(abs(mean(q, 1.59, 'Y:CT/PP') - 0.8), 0.01)
            self.assertEqual(mean(q, 1.59, 'Y:CT/LR'), 0)

    def test_vector_current_control_in_a_stronger_grid(self):
        # the control of the MMC station on the same average model: works at SCR 5 (P into the converter)
        o = cases([{'kind': 'tut', 'id': 'gfm_weak', 'opts': {'ctl': 'gfl', 'scr': '5'}, 'at': [1.59], 'keys': ['Y:CT/PP', 'Y:CT/VG']}])[0]
        self.assertLess(abs(mean(o, 1.59, 'Y:CT/PP') + 0.9), 0.01)
        self.assertLess(abs(mean(o, 1.59, 'Y:CT/VG') - 1), 0.01)


class SciPy(unittest.TestCase):
    def test_against_scipy(self):
        # the grid case (droop, filter L) in the SciPy solver. The controlled sources of the browser read the modulation of
        # the previous step: a lag ω·h of the converter voltage, so the difference falls with h (first order)
        import numpy as np
        from engine.batch import simulate
        o = cases([{'kind': 'scipy', 'T': 0.02, 'hDiv': 400}, {'kind': 'scipy', 'T': 0.02, 'hDiv': 4000}])
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
        for j in (0, 2):  # P and the current of phase a
            self.assertLess(dif[1][j], 0.15 * dif[0][j], (dif, j))
        self.assertLess(dif[1][0], 0.02)
        self.assertLess(dif[1][1], 2e-3)


if __name__ == '__main__':
    unittest.main()
