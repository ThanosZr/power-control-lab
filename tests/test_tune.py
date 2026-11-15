"""4.17 (ROADMAP §59, THEORY §8Α): the PI/PID gains of a PWM block from the circuit (web/studio/tune.js).

The converter is recognised in the tutorial's circuit and its averaged CCM model is built from the elements of the list
of roles. Checked here: the model against an independent transcription of the averaged equations (numpy) and, for buck,
boost and buck–boost, against the symbolic models of the engine (engine.models); the model against the simulation itself
(the steady state at two duty ratios, and the response to a sinusoidal duty ratio); the gains in closed loop on the five
families, with PI and PID; the warning for hand-set gains of the wrong sign; the user's list of roles; the
recomputation when an element changes; the same run in the SciPy solver."""
import cmath
import json
import math
import subprocess
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent


def cases(c):
    out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'tune_cases.js'), json.dumps(c)], capture_output=True,
                         text=True, check=True, timeout=900, cwd=ROOT).stdout
    return json.loads(out)


def pi(sensor, ref, **k):
    return {'PWM1': {'mode': 'pi', 'gain': 'auto', 'sensor': sensor, 'qty': 'V', 'ref': ref, 'dmin': 0.05, 'dmax': 0.85, **k}}


# the five families as the tutorials build them, with the PWM in PI mode on the output capacitor
FAM = {
    'buck': {'id': 'buck_vloop', 'opts': {'ctrl': 'pi', 'steps': 'ref'}, 'patch': {'PWM1': {'gain': 'auto'}}, 'out': 'V:C1'},
    'boost': {'id': 'boost', 'opts': {}, 'patch': pi('C1', '0:24, 0.02:30'), 'out': 'V:C1'},
    'buck_boost': {'id': 'buck_boost', 'opts': {'D': '0.4'}, 'patch': pi('C1', '0:-8, 0.02:-10'), 'out': 'V:C1'},
    'cuk': {'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': pi('C2', '0:-8, 0.02:-10'), 'out': 'V:C2'},
    'sepic': {'id': 'sepic', 'opts': {'D': '0.6'}, 'patch': pi('C2', '0:18, 0.02:22.5'), 'out': 'V:C2'},
}


def averaged(key, q, D):
    """The averaged CCM model written again from Kirchhoff's laws (THEORY §8Α): returns A and b_d (∂ẋ/∂d at the
    operating point) and x₀; the output is the last state (v_o, the voltage of the output capacitor).

    buck:        L·i' = d·V_g − v − r·i,                 C·v' = i − v/R
    boost:       L·i' = V_g − (1 − d)·v − r·i,           C·v' = (1 − d)·i − v/R
    buck–boost:  L·i' = d·V_g + (1 − d)·v − r·i,         C·v' = −(1 − d)·i − v/R            (v < 0, i from sw to ground)
    Ćuk:         L₁·i₁' = V_g − (1 − d)·v₁ − r₁·i₁,       C₁·v₁' = (1 − d)·i₁ + d·i₂,
                 L₂·i₂' = −d·v₁ − v − r₂·i₂,             C₂·v' = i₂ − v/R                     (v₁ = v_a − v_b, v < 0)
    SEPIC:       L₁·i₁' = V_g − (1 − d)·(v₁ + v) − r₁·i₁,  C₁·v₁' = (1 − d)·i₁ + d·i₂,
                 L₂·i₂' = −d·v₁ + (1 − d)·v − r₂·i₂,      C₂·v' = (1 − d)·(i₁ − i₂) − v/R      (i₂ from b to ground)
    """
    Vg, R = q['Vg'], q['R']

    def f(x, d):
        if key in ('buck', 'boost', 'buck_boost'):
            i, v = x
            L, r, C = q['L1'], q['r1'], q['C1']
            if key == 'buck':
                return np.array([(d * Vg - v - r * i) / L, (i - v / R) / C])
            if key == 'boost':
                return np.array([(Vg - (1 - d) * v - r * i) / L, ((1 - d) * i - v / R) / C])
            return np.array([(d * Vg + (1 - d) * v - r * i) / L, (-(1 - d) * i - v / R) / C])
        i1, v1, i2, v = x
        L1, r1, C1, L2, r2, C2 = q['L1'], q['r1'], q['C1'], q['L2'], q['r2'], q['C2']
        if key == 'cuk':
            return np.array([(Vg - (1 - d) * v1 - r1 * i1) / L1, ((1 - d) * i1 + d * i2) / C1,
                             (-d * v1 - v - r2 * i2) / L2, (i2 - v / R) / C2])
        return np.array([(Vg - (1 - d) * (v1 + v) - r1 * i1) / L1, ((1 - d) * i1 + d * i2) / C1,
                         (-d * v1 + (1 - d) * v - r2 * i2) / L2, ((1 - d) * (i1 - i2) - v / R) / C2])

    n = 2 if key in ('buck', 'boost', 'buck_boost') else 4
    # the model is affine in x for a fixed d: A from unit vectors, x₀ from A·x₀ + f(0) = 0
    f0 = f(np.zeros(n), D)
    A = np.column_stack([f(np.eye(n)[k], D) - f0 for k in range(n)])
    x0 = np.linalg.solve(A, -f0)
    h = 1e-7
    bd = (f(x0, D + h) - f(x0, D - h)) / (2 * h)
    return A, bd, x0


def gain(A, bd, f):
    n = len(bd)
    return np.linalg.solve(2j * math.pi * f * np.eye(n) - A, bd)[-1]


class Model(unittest.TestCase):
    F = [10.0, 100.0, 300.0, 1000.0, 3000.0]

    @classmethod
    def setUpClass(cls):
        cls.R = dict(zip(FAM, cases([{'kind': 'design', **{k: v for k, v in c.items() if k != 'out'}, 'f': cls.F} for c in FAM.values()])))

    def test_recognised_with_roles(self):
        roles = {'buck': {'Vin': 'V1', 'L1': 'L1', 'C1': 'C1', 'R': 'R1'}, 'cuk': {'Vin': 'V1', 'L1': 'L1', 'C1': 'C1', 'L2': 'L2', 'C2': 'C2', 'R': 'R1'}}
        for key, r in self.R.items():
            d = r['design']
            self.assertEqual(r['warn'], [], key)
            self.assertEqual(d['key'], key)
            self.assertTrue(d['forcedOk'])
            for role, cid in roles.get(key, {}).items():
                self.assertEqual(d['roles'][role], cid, key)

    def test_against_independent_equations(self):
        # the operating point and G(jω) of tune.js against the equations written again here
        for key, r in self.R.items():
            d = r['design']
            A, bd, x0 = averaged(key, d['values'], d['D0'])
            np.testing.assert_allclose(d['x0'], x0, rtol=1e-9, atol=1e-9, err_msg=key)
            self.assertAlmostEqual(d['G0'] / (-np.linalg.solve(A, bd)[-1]), 1, places=7, msg=key)
            for f, g in zip(self.F, d['bode']):
                G = gain(A, bd, f)
                self.assertLess(abs(complex(*g) - G), 1e-7 * abs(G), (key, f))

    def test_dc_gain_closed_forms(self):
        # ideal converters: ∂V_o/∂D = V_g (buck), ±V_g/(1 − D)² (the others; negative for buck–boost and Ćuk)
        for key, r in self.R.items():
            d = r['design']
            Vg, D = d['values']['Vg'], d['D0']
            want = {'buck': Vg, 'boost': Vg / (1 - D) ** 2, 'buck_boost': -Vg / (1 - D) ** 2, 'cuk': -Vg / (1 - D) ** 2,
                    'sepic': Vg / (1 - D) ** 2}[key]
            self.assertAlmostEqual(d['G0'] / want, 1, places=9, msg=key)
            self.assertEqual(math.copysign(1, d['Ki']), math.copysign(1, want), key)   # the gains follow the sign

    def test_against_engine_models(self):
        # buck, boost and buck–boost: G_vd of engine.models (SymPy) with the same values; the engine's buck–boost
        # gives the response of |V_o|, so the opposite sign
        import sympy as sp
        from engine.models import symbolic_model, VIN, D, L, C, R, S
        for key in ('buck', 'boost', 'buck_boost'):
            d, q = self.R[key]['design'], self.R[key]['design']['values']
            G = sp.lambdify(S, symbolic_model(key, 'resistive')['Gvd'].subs({VIN: q['Vg'], D: d['D0'], L: q['L1'], C: q['C1'], R: q['R']}))
            sgn = -1 if key == 'buck_boost' else 1
            for f, g in zip(self.F, d['bode']):
                Ge = sgn * complex(G(2j * math.pi * f))
                self.assertLess(abs(complex(*g) - Ge), 1e-6 * abs(Ge), (key, f))

    def test_margins_of_the_design(self):
        for key, r in self.R.items():
            d = r['design']
            self.assertGreaterEqual(d['pm'], 50 - 1e-6, key)
            self.assertTrue(d['gm'] is None or d['gm'] >= 2 - 1e-9, key)
            self.assertLessEqual(d['ms'], 2 + 1e-9, key)
            self.assertLess(d['fc'], d['fr'], key)            # the crossover below the resonance of the filter


class AgainstSimulation(unittest.TestCase):
    def test_steady_state_slope(self):
        # the open-loop steady state at D and D + 0.02: the secant against the averaged model (the simulation has the
        # switch and diode models of the solver)
        r = cases([{'kind': 'steady', 'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': {'PWM1': {'D': D}}, 'T': 0.04} for D in (0.4, 0.42)]
                  + [{'kind': 'steady', 'id': 'sepic', 'opts': {'D': '0.6'}, 'patch': {'PWM1': {'D': D}}, 'T': 0.04} for D in (0.6, 0.62)])
        for (a, b), D, sign in (((r[0], r[1]), 0.4, -1), ((r[2], r[3]), 0.6, 1)):
            want = sign * 12 * ((D + 0.02) / (0.98 - D) - D / (1 - D))
            got = b['mean']['V:C2'] - a['mean']['V:C2']
            self.assertLess(abs(got / want - 1), 0.03, (D, got, want))
            self.assertLess(abs(a['mean']['V:C2'] / (sign * 12 * D / (1 - D)) - 1), 0.01, a)

    def test_frequency_response(self):
        # d = D + 0.01·sin(2πft) in open loop: the fundamental of the per-period means of V_o over that of d, against
        # G(j2πf) of the model (below and near the resonance of the Ćuk, 898 Hz)
        F = [200.0, 500.0]
        r = cases([{'kind': 'design', 'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': pi('C2', '-8'), 'f': F}]
                  + [{'kind': 'fresp', 'id': 'cuk', 'opts': {'D': '0.4'}, 'D': 0.4, 'a': 0.01, 'f': f, 'out': 'V:C2'} for f in F])
        for f, g, q in zip(F, r[0]['design']['bode'], r[1:]):
            Gs = complex(*q['y']) / complex(*q['d'])
            Gm = complex(*g)
            self.assertLess(abs(abs(Gs) / abs(Gm) - 1), 0.01, (f, Gs, Gm))
            self.assertLess(abs(math.degrees(cmath.phase(Gs / Gm))), 1.0, (f, Gs, Gm))


class ClosedLoop(unittest.TestCase):
    def test_five_families_track_the_reference(self):
        # PI from the circuit: the output at the end of each segment of the reference (step at 20 ms), the duty ratio
        # inside its limits, no warning
        c = []
        for key, f in FAM.items():
            at = [0.0199, 0.05] if key != 'buck' else [0.0039, 0.012]
            c.append({'kind': 'run', 'id': f['id'], 'opts': f['opts'], 'patch': f['patch'], 'at': at, 'keys': [f['out']]})
        for (key, f), r in zip(FAM.items(), cases(c)):
            self.assertEqual(r['warn'], [], key)
            refs = [12, 15] if key == 'buck' else [float(v.split(':')[1]) for v in f['patch']['PWM1']['ref'].split(',')]
            for q, ref in zip(r['out'], refs):
                self.assertLess(abs(q[f['out']] / ref - 1), 0.015, (key, q, ref))
                self.assertTrue(0.06 < q['D'] < 0.84, (key, q))

    def test_pid(self):
        c = [{'kind': 'run', 'id': 'cuk', 'opts': {'D': '0.4', 'ctrl': 'pid'}, 'at': [0.0099, 0.03], 'keys': ['V:C2']},
             {'kind': 'run', 'id': 'sepic', 'opts': {'D': '0.6', 'ctrl': 'pid'}, 'at': [0.0099, 0.03], 'keys': ['V:C2']},
             {'kind': 'run', 'id': 'buck_vloop', 'opts': {'ctrl': 'pid', 'steps': 'ref'}, 'patch': {'PWM1': {'gain': 'auto', 'ctl': 'pid'}}, 'at': [0.0039, 0.012], 'keys': ['V:C1']}]
        r = cases(c)
        for q, refs, key in zip(r, ([-8, -10], [18, 22.5], [12, 15]), ('V:C2', 'V:C2', 'V:C1')):
            self.assertEqual(q['warn'], [])
            self.assertNotEqual(q['ctl']['Kd'], 0)
            for o, ref in zip(q['out'], refs):
                self.assertLess(abs(o[key] / ref - 1), 0.015, (o, ref))

    def test_tutorial_option_signs(self):
        # the Ćuk tutorial with «PI με κέρδη από το κύκλωμα»: negative gains, D₀ of the first reference, the step followed
        r = cases([{'kind': 'run', 'id': 'cuk', 'opts': {'D': '0.4', 'ctrl': 'pi'}, 'at': [0.0099, 0.03], 'keys': ['V:C2']}])[0]
        self.assertLess(r['ctl']['Ki'], 0)
        self.assertLessEqual(r['ctl']['Kp'], 0)
        self.assertAlmostEqual(r['ctl']['D0'], 0.4, places=6)
        self.assertEqual(r['ctl']['ff'], 'const')
        self.assertLess(abs(r['out'][1]['V:C2'] / -10 - 1), 0.015, r)


class Checks(unittest.TestCase):
    def test_hand_set_gains_of_the_wrong_sign(self):
        man = {'mode': 'pi', 'sensor': 'C2', 'qty': 'V', 'ref': '-8', 'dmin': 0.05, 'dmax': 0.85}
        r = cases([{'kind': 'design', 'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': {'PWM1': {**man, 'Kp': 1e-3, 'Ki': 1}}},
                   {'kind': 'design', 'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': {'PWM1': {**man, 'Kp': -1e-3, 'Ki': -20}}},
                   {'kind': 'design', 'id': 'buck_vloop', 'opts': {'ctrl': 'pi', 'steps': 'ref'}},
                   {'kind': 'run', 'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': {'PWM1': {**man, 'Kp': 1e-3, 'Ki': 1}}, 'at': [0.01], 'keys': ['V:C2']}])
        self.assertEqual(len(r[0]['warn']), 1)
        self.assertIn('θετική ανάδραση', r[0]['warn'][0])
        self.assertIn('Ćuk', r[0]['warn'][0])
        self.assertEqual(r[1]['warn'], [])
        self.assertEqual(r[2]['warn'], [])                      # the buck loop of its tutorial: positive gains, positive plant
        self.assertGreater(r[3]['out'][0]['V:C2'], -1)          # and indeed the output runs away from −8 V
        self.assertAlmostEqual(r[3]['out'][0]['D'], 0.05, places=6)

    def test_users_list_of_roles(self):
        # the coupling capacitor's role given to C2 (the output capacitor): the list does not fit the Ćuk, a warning,
        # and the model takes C2's value as C1; an empty role is filled from the circuit
        P = pi('C2', '-8')
        r = cases([{'kind': 'design', 'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': {'PWM1': {**P['PWM1'], 'rC1': 'C2'}}},
                   {'kind': 'design', 'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': {'PWM1': {**P['PWM1'], 'rL1': 'L1', 'rR': ''}}}])
        self.assertFalse(r[0]['design']['forcedOk'])
        self.assertTrue(any('δεν συνδέονται' in w for w in r[0]['warn']))
        self.assertEqual(r[0]['design']['roles']['C1'], 'C2')
        self.assertAlmostEqual(r[0]['design']['values']['C1'], 100e-6)
        self.assertTrue(r[1]['design']['forcedOk'])
        self.assertEqual(r[1]['design']['roles']['R'], 'R1')

    def test_recomputed_when_the_circuit_changes(self):
        # a larger output capacitor and another load: the operating point, the resonance and the gains change
        P = pi('C2', '-8')
        r = cases([{'kind': 'design', 'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': P},
                   {'kind': 'design', 'id': 'cuk', 'opts': {'D': '0.4'}, 'patch': {**P, 'C2': {'C': 470e-6}, 'R1': {'R': 4}}}])
        a, b = r[0]['design'], r[1]['design']
        self.assertAlmostEqual(b['values']['C2'], 470e-6)
        self.assertAlmostEqual(b['values']['R'], 4)
        self.assertLess(b['fr'], a['fr'])
        self.assertNotAlmostEqual(a['Ki'], b['Ki'], places=3)
        self.assertAlmostEqual(b['x0'][2], -8 / 4, places=9)   # i_L2 = V_o/R

    def test_not_recognised(self):
        # the PWM of the battery converter (two switches): no family, the hand-set gains stay, one warning
        r = cases([{'kind': 'design', 'id': 'battery', 'opts': {'ctrl': 'pi'}, 'patch': {'PWM1': {'gain': 'auto'}}}])[0]
        self.assertNotIn('design', r)
        self.assertTrue(any('δεν αναγνωρίζεται' in w for w in r['warn']), r['warn'])


class SciPy(unittest.TestCase):
    def test_same_run(self):
        # the gains from the circuit travel in the netlist: the SciPy solver gives the same output after a reference step
        from engine.batch import simulate
        o = cases([{'kind': 'scipy', 'id': 'cuk', 'opts': {'D': '0.4', 'ctrl': 'pi'}, 'patch': {'PWM1': {'ref': '0:-8, 0.0005:-9'}},
                    'T': 0.002, 'hDiv': 80, 'keys': ['V:C2', 'I:L1']}])[0]
        self.assertEqual(o['warn'], [])
        d = o['batch']
        self.assertAlmostEqual(d['net']['ctrls'][0]['Ki'], o['ctl']['Ki'])
        rec = np.array(o['rec'])
        ts = rec[:, 0]
        r = simulate({'net': d['net'], 'channels': d['channels'], 't_end': float(ts[-1]), 'method': 'Radau', 'rtol': 1e-7,
                      'atol': 1e-9, 'max_points': 400000, '_local': True, 'wall': 900})
        self.assertEqual(r['status'], 'ok', r['message'])
        t = np.array(r['t'])
        for j, k in enumerate(o['keys']):                # at the starts of the periods, where the browser recorded
            a = rec[:, j + 1]
            b = np.interp(ts, t, np.array(r['ch'][k], float))
            self.assertLess(float(np.max(np.abs(a - b))) / float(np.max(np.abs(a))), 0.005, k)


if __name__ == '__main__':
    unittest.main()
