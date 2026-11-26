"""5.1.2 (ROADMAP §101 step 1, THEORY §8ΩΧ): the two-area system in EMT (the tutorial two_area_emt) and in the card «Δυναμική RMS».

The tutorial builds the two-area system of Example 12.6 of Power System Stability and Control (pcl.network case 'two_area') in EMT from
its load flow, with the units of the example without their saturation and the excitation of part (b). Checked here: its load flow
against the case, the machines of its drawing in the RMS against pcl.rms.two_area_machines (the same eigenvalues), at rest in the EMT
and in the RMS, and the RMS of the same drawing against its EMT in the fault, the pulse of load (the interarea mode against the
eigenvalue) and the opening of a circuit; the breaker that opens again onto the load of the pulse (a step of the shunt back), and the
electromechanical modes at the start (Network.dynamic(modes=True)) in the result and in the report of the card."""
import functools
import json
import subprocess
import unittest
from pathlib import Path

import numpy as np

from pcl import model, rms, study
from pcl import network as N

ROOT = Path(__file__).resolve().parent.parent


@functools.lru_cache(maxsize=None)
def project(opts):
    return json.loads(subprocess.run(['node', str(ROOT / 'tests/js/model_cases.js'), 'build', 'two_area_emt', opts], capture_output=True, text=True,
                                     timeout=300, check=True).stdout)


def drawing(**o):
    return model.of(project(json.dumps(o, sort_keys=True)))


@functools.lru_cache(maxsize=None)
def emt(T, opts):
    """The EMT of the tutorial (tests/js/two_area_cases.js): t, and every 2 ms δ (unwrapped), P_e, ω, |V| of G1–G4 and E_fd."""
    js = json.loads(subprocess.run(['node', str(ROOT / 'tests/js/two_area_cases.js'), str(T), opts], capture_output=True, text=True, timeout=900,
                                   check=True).stdout)
    y = np.array([[np.nan if v is None else v for v in r] for r in js['y']])
    y[:, :4] = np.degrees(np.unwrap(np.radians(y[:, :4]), axis=0))
    return np.array(js['t']), y


def rms_of(m, T, **kw):
    return study.run({'drawing': m, 'study': 'rms', 'options': {'t_end': T, 'h': 0.005, 'record': 0.002, **kw}})['result']


def angle(r, a, b, te):
    M = r['machines']
    return np.interp(te, np.array(r['t']), np.array(M[a]['delta']) - np.array(M[b]['delta']))


def interarea(modes):
    """The interarea mode of a list of modes (Network.dynamic(modes=True)): G1, G2 against G3, G4 on the speeds."""
    for q in modes:
        sh = q['shape']
        if abs(((sh['G1'][1] - sh['G3'][1] + 180) % 360) - 180) > 90 and abs(((sh['G1'][1] - sh['G2'][1] + 180) % 360) - 180) < 90:
            return q
    return None


def fit(t, x, t1):
    """x(t) = c + a·e^(σt)·cos(ωt + φ) from t1 by least squares: σ and the frequency in Hz."""
    from scipy.optimize import least_squares
    k = t >= t1
    t, x = t[k] - t1, x[k]
    y = x - x.mean()
    z = np.where(np.diff(np.sign(y)) != 0)[0]
    w0 = np.pi / np.mean(np.diff(t[z]))
    p = least_squares(lambda p: p[0] + p[1] * np.exp(p[2] * t) * np.cos(p[3] * t + p[4]) - x, [x.mean(), np.max(np.abs(y)), 0.0, w0, 0.0]).x
    return p[2], p[3] / (2 * np.pi)


class TwoAreaEMT(unittest.TestCase):
    def test_the_load_flow_of_the_tutorial_is_that_of_the_case(self):
        """The |V|∠θ of the tutorial (TWO_AREA_LF) are the load flow of the case two_area (to their six decimals), and the load flow of
        its drawing (every GEN3 a source |V|∠θ, the loads at their voltage) is that load flow again."""
        pf = N.case_data('two_area').power_flow()
        lf = project('{}')['meta']['lf']
        self.assertEqual(sorted(lf, key=int), sorted(pf['buses'], key=int))
        for b, (V, a) in lf.items():
            self.assertAlmostEqual(V, pf['buses'][b]['V'], delta=5e-7)                                  # 4,3·10⁻⁷
            self.assertAlmostEqual(a, pf['buses'][b]['angle'], delta=5e-7)                              # 4,5·10⁻⁷°
        net = model.network(drawing(exc='pss', ev='none'), 'pf')[0]
        dpf = net.power_flow()
        for b in lf:
            self.assertAlmostEqual(dpf['buses']['B' + b]['V'], pf['buses'][b]['V'], delta=1e-6)        # 7,5·10⁻⁸
            self.assertAlmostEqual(dpf['buses']['B' + b]['angle'], pf['buses'][b]['angle'], delta=5e-5)  # 8,8·10⁻⁶°

    def test_the_machines_of_the_drawing_are_those_of_the_example(self):
        """With each excitation the machines of the drawing in the RMS have the eigenvalues of pcl.rms.two_area_machines(…, limits=True)
        without the saturation, on the case with constant-impedance loads (the six decimals of the tutorial: ≤ 4,4·10⁻⁶)."""
        for exc, n in (('manual', 24), ('thyristor', 44), ('tgr', 44), ('pss', 56)):
            with self.subTest(exc=exc):
                m = drawing(exc=exc, ev='none')
                mach, notes = model.machines_of(m)
                self.assertEqual(notes, [])
                s1 = rms.System(model._rms_network(m)[0], machines=mach, loads='Z', f=60)
                s1.init()
                ma = {g: {k: v for k, v in d.items() if k not in ('SG10', 'SG12')} for g, d in rms.two_area_machines(exc, limits=True).items()}
                s2 = rms.System(N.case_data('two_area'), machines=ma, loads='Z')
                s2.init()
                l1, l2 = np.sort_complex(s1.eigen('qr')['lambda']), np.sort_complex(s2.eigen('qr')['lambda'])
                self.assertEqual((len(l1), len(l2)), (n, n))
                self.assertLess(float(np.max(np.abs(l1 - l2))), 2e-5)

    def test_at_rest(self):
        """Without a disturbance the EMT stays at the load flow (1 s), and the RMS of its drawing too."""
        te, y = emt(1.0, json.dumps({'exc': 'pss', 'ev': 'none'}))
        self.assertLess(float(np.ptp(y[:, 0] - y[:, 2])), 1e-6)                                          # 1,2·10⁻¹⁰°
        self.assertLess(float(np.max(np.ptp(y[:, 4:8], axis=0))) * 900, 1e-3)                            # 8,2·10⁻⁷ MW
        for P, Pl in zip(y[-1, 4:8] * 900, (700.0, 700.0, 719.09, 700.0)):
            self.assertAlmostEqual(P, Pl, delta=0.5)                                                       # ως 0,19 MW
        for V, Vl in zip(y[-1, 12:16], (1.03, 1.01, 1.03, 1.01)):
            self.assertAlmostEqual(V, Vl, delta=1e-6)
        r = rms_of(drawing(exc='pss', ev='none'), 1.0)
        d = np.array(r['machines']['G1']['delta']) - np.array(r['machines']['G3']['delta'])
        self.assertLess(float(np.ptp(d)), 1e-8)
        self.assertAlmostEqual(float(d[0]), float(y[-1, 0] - y[-1, 2]), delta=0.01)                      # 25,954° and 25,952°

    def test_the_fault_against_the_emt(self):
        """The fault on bus 8 for 0,1 s with the PSS: the first swing of δ₁ − δ₃ (EMT 30,84° at 1,497 s, RMS 30,62° at 1,493 s), and over
        10 s δ₁ − δ₃ and δ₂ − δ₄ within 0,26° and 0,30°."""
        te, y = emt(10.0, json.dumps({'exc': 'pss', 'ev': 'fault'}))
        r = rms_of(drawing(exc='pss', ev='fault'), 10.0)
        self.assertEqual([(e['kind'], e['bus']) for e in r['events']], [('fault', 'B8'), ('clear', 'B8')])
        R, E = angle(r, 'G1', 'G3', te), y[:, 0] - y[:, 2]
        self.assertAlmostEqual(R.max(), E.max(), delta=0.5)
        self.assertAlmostEqual(te[np.argmax(R)], te[np.argmax(E)], delta=0.02)
        self.assertLess(float(np.max(np.abs(R - E))), 0.5)
        self.assertLess(float(np.max(np.abs(angle(r, 'G2', 'G4', te) - (y[:, 1] - y[:, 3])))), 0.5)
        self.assertTrue(r['stable'])

    def test_the_pulse_and_the_interarea_mode(self):
        """The pulse of 10 MW on bus 9 (a load behind a breaker that closes at 1 s and opens at 1,1 s) with manual excitation: in the RMS a
        step of the shunt and the same step back; δ₁ − δ₃ within 0,06° of the EMT; the interarea mode in the result (modes=True) is the
        eigenvalue, and the EMT oscillates at its frequency (0,5437 Hz against 0,5426 Hz, from 3 s by least squares) with a little more
        damping (σ −0,111/s against −0,092/s)."""
        m = drawing(exc='manual', ev='pulse')
        net, info = model._rms_network(m)[:2]
        ev = [e for e in model.events_of(m, net, info)[0] if e['kind'] == 'shunt']
        self.assertEqual([(e['t'], e['bus']) for e in ev], [(1.0, 'B9'), (1.1, 'B9')])
        self.assertAlmostEqual(complex(ev[0]['y']), complex(0.1, 0.0), delta=1e-12)                    # 10 MW at 230 kV on 100 MVA
        self.assertEqual(complex(ev[1]['y']), -complex(ev[0]['y']))
        te, y = emt(20.0, json.dumps({'exc': 'manual', 'ev': 'pulse'}))
        r = rms_of(m, 20.0, modes=True)
        R, E = angle(r, 'G1', 'G3', te), y[:, 0] - y[:, 2]
        self.assertLess(float(np.max(np.abs(R - E))), 0.1)                                                # 0,055°
        q = interarea(r['modes'])
        s = rms.System(net, machines=model.machines_of(m)[0], loads='Z', f=60)
        s.init()
        lam = [x['lambda'] for x in s.eigen('qr')['modes'] if abs(x['lambda'] - complex(*q['lambda'])) < 1e-9]
        self.assertEqual(len(lam), 1)
        self.assertAlmostEqual(q['f'], 0.5426, delta=5e-4)
        sr, fr = fit(te, R, 3.0)
        se, fe = fit(te, E, 3.0)
        self.assertAlmostEqual(fr, q['f'], delta=5e-4)                                                    # the RMS in time against its eigenvalue
        self.assertAlmostEqual(sr, q['lambda'][0], delta=5e-3)
        self.assertAlmostEqual(fe, q['f'], delta=3e-3)                                                    # 0,5437 Hz
        self.assertTrue(-0.15 < se < q['lambda'][0])                                                      # −0,111/s: more damping in the EMT

    def test_the_opening_of_a_circuit(self):
        """Circuit 2 of 7–8 opens at 1 s with a breaker at each end: in the RMS the branch trips; with the PSS δ₁ − δ₃ goes up to 52,9°
        (EMT) and 52,4° (RMS), and over 10 s they stay within 0,51°."""
        te, y = emt(10.0, json.dumps({'exc': 'pss', 'ev': 'trip'}))
        r = rms_of(drawing(exc='pss', ev='trip'), 10.0)
        self.assertEqual([(e['kind'], e['t']) for e in r['events']], [('trip', 1.0), ('trip', 1.0)])
        self.assertEqual(len({e['branch'] for e in r['events']}), 1)
        R, E = angle(r, 'G1', 'G3', te), y[:, 0] - y[:, 2]
        self.assertAlmostEqual(R.max(), E.max(), delta=1.0)
        self.assertLess(float(np.max(np.abs(R - E))), 1.0)

    def test_the_modes_in_the_card_and_in_the_report(self):
        """The study 'rms' of the drawing with modes (the card «Δυναμική RMS»): the three rotor modes of the example with the PSS, the
        interarea one first (G1, G2 against G3, G4), as JSON; without modes none; and the report has their table."""
        m = drawing(exc='pss', ev='none')
        q = study.run({'drawing': m, 'study': 'rms', 'options': {'t_end': 0.1, 'h': 0.005, 'modes': True}})
        json.dumps(q, allow_nan=False)
        md = q['result']['modes']
        self.assertEqual(len(md), 3)
        self.assertIs(interarea(md), md[0])
        self.assertAlmostEqual(md[0]['f'], 0.6040, delta=5e-4)
        self.assertAlmostEqual(md[0]['zeta'], 0.185, delta=5e-3)
        self.assertTrue(all(0.05 <= x['f'] <= 4.0 and x['lambda'][1] > 0 for x in md))
        self.assertEqual(max(v[0] for v in md[0]['shape'].values()), 1.0)
        self.assertNotIn('modes', rms_of(m, 0.1))
        rep = study.report({'drawing': m, 'study': 'rms', 'options': {'t_end': 0.1, 'h': 0.005, 'modes': True}})
        self.assertIn('Ιδιοτιμές στην αρχή', rep['html'])
        self.assertIn('απέναντι σε', rep['html'])


if __name__ == '__main__':
    unittest.main()
