"""Studio simulator (web/studio/mna.js) against closed-form results, via Node."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'sim_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed; the browser runs the same file.')
class StudioSimulator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=600)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.o = json.loads(run.stdout)

    def test_buck_ccm(self):
        r = self.o['buck_ccm']
        self.assertAlmostEqual(r['vo'], 12, delta=0.01)                        # Vo = D Vin
        self.assertAlmostEqual(r['il']['pp'], (24 - 12) * .5 / (100e-6 * 100e3), delta=0.002)

    def test_buck_dcm(self):
        K = 2 * 10e-6 / (50 / 100e3)
        vo = 24 * 2 / (1 + math.sqrt(1 + 4 * K / .3 ** 2))
        self.assertAlmostEqual(self.o['buck_dcm']['vo'], vo, delta=0.02)
        self.assertAlmostEqual(self.o['buck_dcm']['ilmin'], 0, delta=1e-3)    # current rests at zero

    def test_boost_dcm(self):
        K = 2 * 10e-6 / (100 / 50e3)
        vo = 12 * (1 + math.sqrt(1 + 4 * .3 ** 2 / K)) / 2
        self.assertAlmostEqual(self.o['boost_dcm']['vo'], vo, delta=0.05)

    def test_flyback_ccm(self):
        self.assertAlmostEqual(self.o['flyback']['vo'], 24 * .5 * .4 / .6, delta=0.03)

    def test_sample_and_hold(self):
        r, T = self.o['sh_mid'], 50e-6
        self.assertEqual(r['h0'], 'nan')                                          # invalid until the first trigger
        self.assertAlmostEqual(r['first'], T / 2 + 0.1 * T, delta=1e-12)           # triangle minimum, 36° delay
        self.assertEqual(r['n'], 20)
        self.assertAlmostEqual(r['dt'], T, delta=1e-12)
        self.assertEqual(len(r['at']), 2)                                         # two points at the first t_k: vertical step
        old, new = r['at']
        self.assertIsNone(old['h'])                                               # still invalid just before it
        self.assertAlmostEqual(new['h'], new['i'], delta=1e-3)                    # the sample is i_L(t_k)
        self.assertAlmostEqual(new['h'], r['v0'], delta=1e-3)
        self.assertAlmostEqual(new['c'], 0, delta=1e-6)                           # carrier minimum at the trigger
        p = self.o['sh_pi']                                                       # sample before update: PI reads the new sample
        self.assertAlmostEqual(p['meas'], p['hold'], delta=1e-9)
        self.assertAlmostEqual(p['hold'], p['lastSample'], delta=1e-9)

    def test_gate_pulses(self):
        p = self.o['pulses']                                                     # GS:<switch> = gate after dead time
        self.assertTrue(p['keys'])
        self.assertEqual(p['both'], 0)                                           # complementary outputs never overlap
        self.assertAlmostEqual(p['on2'], 0.3 - 0.02, delta=1e-6)                 # D·T − t_d, t_d = T/50
        self.assertAlmostEqual(p['on1'], 0.7 - 0.02, delta=1e-6)
        self.assertTrue(p['vert'])                                               # edges drawn vertically (two points at t_e)

    def test_signal_blocks(self):
        b = self.o['blk_pi']                                                     # PI from blocks ≡ built-in PI, step by step
        self.assertEqual(b['maxdiff'], 0)
        self.assertEqual(b['il'][0], b['il'][1])
        self.assertEqual(b['warn'], [])
        self.assertEqual(b['order'], ['K1', 'M1', 'SUM1', 'PI1'])                # evaluation order follows the wires
        L = self.o['blk_loop']
        self.assertIn('Αλγεβρικός βρόχος', L['err'])                            # reported, not solved with a hidden delay
        self.assertIn('G1 → SUM1 → G1', L['err'])
        self.assertAlmostEqual(L['y'], 2, delta=1e-5)                            # y = 1 + y/2 through z⁻¹ → 2
        self.assertTrue(any('ηλεκτρικό κόμβο' in w for w in L['warnMix']))
        self.assertTrue(any('D1.u' in w for w in L['warnMix']))
        self.assertAlmostEqual(L['vR'], 5, delta=1e-6)                           # the ignored signal wire does not load the circuit
        sh = self.o['blk_sh']                                                    # S&H on a signal, clocked by a clock block
        self.assertEqual(sh['n'], 7)
        for tk, v in zip(sh['t'], sh['v']):
            self.assertAlmostEqual(v, 10 * ((tk / 1e-3) % 1 if abs((tk / 1e-3) % 1 - 1) > 1e-9 else 0), delta=1e-9)
        self.assertAlmostEqual(sh['y0'], 10, delta=1e-12)
        self.assertAlmostEqual(sh['y1'], 15, delta=1e-12)                        # live change of a constant

    def test_connections_without_wire(self):
        r = self.o['nowire']                                                     # a source in the parameters, or Goto/From tags
        for how in ('param', 'tag'):
            self.assertEqual(r[how]['d'], r['wire']['d'])                        # exactly the wired circuit
            self.assertEqual(r[how]['il'], r['wire']['il'])
            self.assertEqual(r[how]['warn'], [])
        self.assertEqual(r['tag']['keys'], 0)                                    # tags are not signals of their own
        w = ' '.join(r['warnBad'])
        self.assertIn('χωρίς ετικέτα «προς»: x', w)
        self.assertIn('ίδιο όνομα: y', w)
        self.assertIn('G1.u ← K9:y', w)

    def test_dc_machine(self):
        r = self.o['dcm']                    # armature + gyrator + mechanical circuit against the two ODEs
        self.assertEqual(r['warn_false'], [])
        self.assertEqual(r['warn_true'], [])
        for kind in ('sched', 'sig'):
            for (t, w, i, te), (_, w0, i0) in zip(r[kind], r['pts']):
                tol = 6e-3 if abs(t - .31) < 1e-9 else 1e-5 * max(1, abs(w0))   # a load step costs at most half a step
                self.assertAlmostEqual(w, w0, delta=tol, msg=f'{kind} ω at {t}')
                self.assertAlmostEqual(i, i0, delta=max(tol, 1e-5 * abs(i0)), msg=f'{kind} i at {t}')
                self.assertAlmostEqual(te, i, delta=1e-9)                      # τ_e = ψ·i with ψ = 1
        w_ss = (100 - .5 * 20) / (1 + .5 * .002)                                # ω = (V·ψ − R_a·τ_L)/(ψ² + R_a·b)
        self.assertAlmostEqual(r['sched'][-1][1], w_ss, delta=.01)

    def test_pll_clarke_park(self):
        r = self.o['pll']                    # locks from 45 Hz; d on the voltage vector: v_a = V̂·sin(ωt + φ) gives θ = ωt + φ − 90°
        self.assertEqual(r['warn'], [])
        self.assertAlmostEqual(r['w'], 2 * math.pi * 50, delta=1e-6)
        self.assertAlmostEqual(r['d'], 100, delta=1e-6)
        self.assertAlmostEqual(r['q'], 0, delta=1e-6)
        self.assertAlmostEqual(r['amp'], 100, delta=1e-6)
        self.assertAlmostEqual(r['dth'], -math.pi / 2, delta=1e-6)
        for e in r['back']:                  # inverse Park and inverse Clarke give back the phase voltages
            self.assertAlmostEqual(e, 0, delta=1e-9)

    def test_continuous_blocks_and_back_calculation(self):
        r = self.o['cont']
        self.assertEqual(r['warn'], [])
        self.assertAlmostEqual(r['i1'], 1 + 2 * r['t'], delta=1e-9)            # ∫2 dt from 1
        self.assertAlmostEqual(r['i2'], 100 * r['t'] % (2 * math.pi), delta=1e-9)
        self.assertAlmostEqual(r['f1'], 1 - math.exp(-2 * math.pi * 100 * (r['t'] - .001)), delta=1e-9)
        self.assertEqual(r['sat'], 2)
        self.assertAlmostEqual(r['pi_track'], 3, delta=1e-6)                   # held at K_p·e + u_sat, does not wind up
        self.assertGreater(r['pi_clamp'], 20)                                  # without back-calculation it winds up
        self.assertLess(r['order'].index('P1'), r['order'].index('D1'))        # tr is read after the pass: no algebraic loop

    def test_harmonics_of_square_wave(self):
        r = self.o['harm']                   # ±5 A square wave: A_h = 4·5/(π·h) for odd h, THD = √(π²/8 − 1)
        self.assertAlmostEqual(r['A1'], 20 / math.pi, delta=2e-3)
        self.assertAlmostEqual(r['A3'], 20 / (3 * math.pi), delta=2e-3)
        self.assertAlmostEqual(r['A2'], 0, delta=2e-3)
        self.assertAlmostEqual(r['rms'], 5, delta=2e-3)
        self.assertAlmostEqual(r['thdAll'], 100 * math.sqrt(math.pi ** 2 / 8 - 1), delta=.05)    # 48.34 %
        odd = sum(1 / h ** 2 for h in range(3, r['H'] + 1, 2))
        self.assertAlmostEqual(r['thd'], 100 * math.sqrt(odd), delta=.05)                        # up to h = 49

    def test_expression_block(self):
        r = self.o['expr']
        v = r['vals']
        exp = {'a*b + 1': 13, 'hypot(a, b)': 5, 'a^2 + b**2': 25, '-a^2': -9, '2^3^2': 512, 'a > b ? a : b': 4, 'clamp(a*b, 0, 10)': 10,
               'mod(-7, 3)': 2, '(a < b) + (a == 3) + !(b != 4)': 3, 'atan2(b, a)': math.atan2(4, 3), 'min(a, b, 1)': 1,
               'round(2.5) + floor(-0.5) + sign(-a)': 1, '10 % 4': 2, 'exp(log(a)) + sqrt(b)': 5, 'pi*e*0 + t': .5, 'lut(a, 0, 0, 10, 100)': 30, 'lut(b, 0, 1, 2, 3, 5, 3.5)': 3 + .5 * 2 / 3}
        for k, x in exp.items():
            self.assertAlmostEqual(v[k], x, places=12, msg=k)
        self.assertTrue(all(r['errs']))                                          # every bad expression is rejected with a message
        self.assertIn('Άγνωστη συνάρτηση «foo»', r['errs'][1])
        self.assertIn('Άγνωστο όνομα «x»', r['errs'][4])
        self.assertAlmostEqual(r['p'], 10 * 2 * 2, delta=1e-5)                   # v·i·k = 10 V · 2 A · 2
        self.assertEqual(r['bad'], 0)
        self.assertTrue(any('EX2' in w for w in r['warn']))

    def test_eis_cpe_and_controlled_sources(self):
        r = self.o['eis']
        for w in r['bank']:                  # the R–C bank follows 1/(Q·(jω)^α) within about 1 % in its band
            self.assertLess(w, .015)
        for q in r['z']:                     # Z = V₁/I₁ against the model (with the bank the solver uses), drift removed
            self.assertAlmostEqual(q['re'], q['tre'], delta=.005 * abs(q['tre']), msg=q['f'])
            self.assertAlmostEqual(q['im'], q['tim'], delta=.01 * abs(q['tim']) + 2e-5, msg=q['f'])
            self.assertAlmostEqual(q['Idc'], 1, delta=1e-3)                    # current source from the expression
            self.assertGreater(q['Vdc'], 3.7)                                  # OCV from a signal (3.7 V) plus the drops

    def test_peak_current_mode(self):
        o, T = self.o, 1e-5
        m1, m2 = lambda D: (24 - 24 * D) / 50e-6, lambda D: 24 * D / 50e-6
        r = o['pcm_0.4_0_500']                                                   # D < 0.5: stable without a ramp
        self.assertTrue(all(abs(p - 5) < 1e-6 for p in r['pk']))
        self.assertLess(max(r['dd']) - min(r['dd']), 1e-6)
        for h in (500, 2000):                                                    # D = 0.6: subharmonic, at any step size
            r = o[f'pcm_0.6_0_{h}']
            self.assertGreater(max(r['dd']) - min(r['dd']), 0.3)
        for ramp in (.5, 1):                                                     # ramp m₂/2 and m₂: stable, Î = i_c − m_a·D·T
            r = o[f'pcm_0.6_{ramp}_500']
            pk = 5 - ramp * m2(.6) * .6 * T
            for p in r['pk']:
                self.assertAlmostEqual(p, pk, delta=5e-4)                         # ideal theory; R_on drops raise D by ~2e-4
            self.assertLess(max(r['dd']) - min(r['dd']), 1e-6)
            self.assertAlmostEqual(r['dd'][-1], .6, delta=5e-4)                  # 0.6 plus the conduction drops

    def test_double_update(self):
        single, double = self.o['upd_single'], self.o['upd_double']
        self.assertAlmostEqual(single[1][0], 10.75, delta=0.003)                 # new D waits for the next period
        self.assertAlmostEqual(double[1][0], 10.8, delta=0.003)                  # (1 + 0.6)/2: off edge of the same period
        self.assertAlmostEqual(single[0][0], 10.25, delta=0.003)                 # turn-on edge keeps the old D in both
        self.assertAlmostEqual(double[0][0], 10.25, delta=0.003)
        self.assertAlmostEqual(double[2][0], 11.2, delta=0.003)

    def test_bridge_rectifier_battery(self):
        vpk, E, R = 230 * math.sqrt(2), 200, 2
        a = math.asin(E / vpk)
        iavg = (2 * vpk * math.cos(a) - E * (math.pi - 2 * a)) / (math.pi * R)
        self.assertAlmostEqual(self.o['rectifier']['iavg'], iavg, delta=0.01 * iavg)
        self.assertAlmostEqual(self.o['rectifier']['ipk'], (vpk - E) / R, delta=0.3)

    def test_bidirectional_matches_pe2(self):
        r = self.o['bidir_open']
        self.assertAlmostEqual(r['iavg'], -800, delta=1)
        self.assertAlmostEqual(r['ripple'], 223.2143, delta=0.05)
        self.assertAlmostEqual(r['pbus'], 40e3, delta=40)
        self.assertAlmostEqual(self.o['bidir_pi']['at5ms'], -800, delta=2)
        self.assertAlmostEqual(self.o['bidir_pi']['at10ms'], 800, delta=2)

    def test_bidirectional_system_load_step(self):
        r = self.o['bidir_system']
        self.assertAlmostEqual(r['vbus_before'], (50 + math.sqrt(50 ** 2 - 4e-3 * 20e3)) / 2, delta=0.08)
        self.assertAlmostEqual(r['isrc_after'], 0, delta=1e-3)                # unidirectional source blocks
        self.assertGreater(r['vbus_after'], 51)

    def test_dead_time_body_diode(self):
        r = self.o['deadtime']
        self.assertAlmostEqual(r['vo'], 24 * (.5 - 500e-9 * 100e3), delta=0.01)   # Vo = Vin (D - t_d f_s)
        self.assertAlmostEqual(r['both_off'], 2 * 500e-9 * 100e3, delta=0.006)

    def test_igbt_and_switching_losses(self):
        r = self.o['igbt']
        self.assertAlmostEqual(r['vo'], .5 * (24 - 1), delta=0.01)                 # Vo = D (Vin - V_ce0)
        self.assertAlmostEqual(r['vce_on'], 1, delta=1e-3)
        psw = 100e3 * (100e-6 * 24 * r['ilmin'] + 150e-6 * 24 * r['ilmax']) / (24 * 1)
        self.assertAlmostEqual(r['psw'], psw, delta=0.002 * psw)
        self.assertAlmostEqual(r['pcond'], 1 * 1.15 * .5, delta=0.01)

    def test_transformer_leakage(self):
        X = 2 * math.pi * 1000 * 2e-3
        self.assertAlmostEqual(self.o['leakage']['vpk'], 100 * 10 / math.hypot(10, X), delta=0.1)

    def test_single_phase_thyristor_bridge(self):
        a = math.radians(60)
        r = self.o['scr1']
        self.assertAlmostEqual(r['vR'], 325 / math.pi * (1 + math.cos(a)), delta=0.3)
        self.assertAlmostEqual(r['vRL'], 2 * 325 / math.pi * math.cos(a), delta=0.3)

    def test_three_phase_bridge(self):
        r = self.o['bridge3']
        vd = 3 * math.sqrt(3) / math.pi * 325
        self.assertAlmostEqual(r['vd'], vd, delta=0.002 * vd)
        self.assertAlmostEqual(r['vmax'], math.sqrt(3) * 325, delta=0.5)
        self.assertAlmostEqual(r['vmin'], math.sqrt(3) * 325 * math.cos(math.pi / 6), delta=0.5)
        self.assertAlmostEqual(r['vscr'], vd * math.cos(math.pi / 6), delta=0.002 * vd)


if __name__ == '__main__':
    unittest.main(verbosity=2)


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed; the browser runs the same file.')
class IntegrationMethods(unittest.TestCase):
    """Gear/BDF2 and backward Euler reproduce the same closed-form results."""
    def run_method(self, method):
        import os
        env = dict(os.environ, PCL_METHOD=method)
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=600, env=env)
        if run.returncode:
            raise RuntimeError(run.stderr)
        return json.loads(run.stdout)

    def test_bdf2_and_backward_euler(self):
        K = 2 * 10e-6 / (50 / 100e3)
        vdcm = 24 * 2 / (1 + math.sqrt(1 + 4 * K / .3 ** 2))
        for method, tol in (('BDF2', 2e-3), ('BE', 5e-3)):
            o = self.run_method(method)
            self.assertAlmostEqual(o['buck_ccm']['vo'], 12, delta=12 * tol)
            self.assertAlmostEqual(o['buck_ccm']['il']['pp'], .6, delta=.6 * tol)
            self.assertAlmostEqual(o['buck_dcm']['vo'], vdcm, delta=vdcm * tol)
            self.assertAlmostEqual(o['flyback']['vo'], 8, delta=8 * tol)
            self.assertAlmostEqual(o['bidir_open']['ripple'], 223.2143, delta=223 * tol)
            self.assertAlmostEqual(o['bidir_pi']['at10ms'], 800, delta=4)
