"""New tutorials (voltage loop, thyristor bridges, flyback clamp, real switches) against theory, via Node."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

CASES = Path(__file__).resolve().parent / 'js' / 'tutorial_cases.js'


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed; the browser runs the same files.')
class Tutorials(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=600)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.o = json.loads(run.stdout)

    def test_voltage_loop_pi_vs_pid(self):
        pi, pid = self.o['vloop_pi'], self.o['vloop_pid']
        for r in (pi, pid):
            self.assertAlmostEqual(r['vo_end'], 15, delta=0.05)
            self.assertLess(r['os'], 2)
            self.assertTrue(r['load_disturbance'])
        self.assertLess(pid['ts'], pi['ts'] / 4)                                 # PID settles much faster
        self.assertLess(pid['iae'], pi['iae'] / 2)
        self.assertLess(pid['load_dev'], pi['load_dev'])

    def test_single_phase_thyristor_bridge(self):
        vpk = 230 * math.sqrt(2)
        for a in (0, 60, 90):
            ar = math.radians(a)
            self.assertAlmostEqual(self.o[f'scr1_r_{a}']['vd'], vpk / math.pi * (1 + math.cos(ar)), delta=0.3)
        self.assertAlmostEqual(self.o['scr1_rl_60']['vd'], 2 * vpk / math.pi * .5, delta=0.3)

    def test_three_phase_bridge(self):
        vd0 = 3 * math.sqrt(3) / math.pi * 325
        for dev, a in (('diode', 0), ('30', 30), ('60', 60)):
            for load in ('r', 'rl'):
                self.assertAlmostEqual(self.o[f'b3_{dev}_{load}']['vR'], vd0 * math.cos(math.radians(a)), delta=0.002 * vd0)
        r = self.o['b3_diode_rl']
        self.assertAlmostEqual(r['ia_rms'], math.sqrt(2 / 3) * r['id'], delta=0.01 * r['id'])

    def test_flyback_leakage_clamp(self):
        c, i = self.o['fly_clamp'], self.o['fly_ideal']
        self.assertGreater(c['vsw_max'], i['vsw_max'] + 10)                       # leakage spike, clamped
        self.assertAlmostEqual(c['vsw_max'], 24 + c['vc'], delta=2)
        vr = c['vo'] / .5
        p = .5 * 4e-6 * c['im_pk'] ** 2 * 100e3 * c['vc'] / (c['vc'] - vr)
        self.assertAlmostEqual(c['prc'], p, delta=0.15 * p)

    def test_real_switches_losses(self):
        r = self.o['bat_real_pi']
        self.assertAlmostEqual(r['il'], 800, delta=5)
        self.assertAlmostEqual(r['psw1'] + r['psw2'], 20e3 * 2.1e-3, delta=5)    # one hard-switched device
        self.assertGreater(r['p1'] + r['p2'], 500)                                # I²R + body diodes
        self.assertLess(abs(self.o['bat_real_fixed']['il']), 790)                 # open loop drifts away

    def test_steady_starts_buck_boost(self):
        for key, vo in (('start_buck_10', 12), ('start_buck_50', 24 * 2 / (1 + (1 + 4 * .4 / .25) ** .5)),
                        ('start_boost_20', 24), ('start_boost_200', 12 * (1 + (1 + 4 * .25 / .1) ** .5) / 2)):
            r = self.o[key]
            self.assertAlmostEqual(r['v0'], vo, delta=0.001 * vo, msg=key)              # starts at the right steady state
            self.assertAlmostEqual(r['first'], vo, delta=0.01 * vo, msg=key)            # and stays there
            self.assertAlmostEqual(r['after'], vo, delta=0.01 * vo, msg=key)

    def test_sampling_exercise(self):
        o = self.o
        T, I, dI = o['smp_saw_midoff']['T'], -800, 50 * .5 / (5.6e-6 * 20e3)
        for start in ('midoff', 'midon', 'none'):                                 # 50, 50 and 100 triggers in [0, 50T)
            self.assertEqual(o[f'smp_saw_{start}']['n50'], 50)
            self.assertEqual(o[f'smp_tri1_{start}']['n50'], 50)
            self.assertEqual(o[f'smp_tri2_{start}']['n50'], 100)
        self.assertAlmostEqual(o['smp_saw_midoff']['first'], T / 4, delta=1e-12)  # 90° delay: first reset at 12.5 μs
        self.assertAlmostEqual(o['smp_saw_midon']['first'], .75 * T, delta=1e-12)
        self.assertAlmostEqual(o['smp_tri1_midon']['first'], T / 2, delta=1e-12)
        for start in ('midoff', 'midon'):                                         # i_L(0) = I_avg on the mid-point: mean stays I
            r = o[f'smp_saw_{start}']
            self.assertAlmostEqual(r['avg'], I, delta=0.2)
            self.assertAlmostEqual(r['pp'], dI, delta=0.01)
            self.assertAlmostEqual(r['last'], I - dI / 2, delta=0.2)               # sawtooth reset: the valley
            for kase in ('tri1', 'tri2'):
                self.assertAlmostEqual(o[f'smp_{kase}_{start}']['last'], I, delta=0.2)   # triangle extrema: the mean
        r = o['smp_saw_none']                                                     # i_L(0) = I_avg at the valley: offset Δi/2
        self.assertAlmostEqual(r['avg'], I + dI / 2, delta=0.2)
        self.assertAlmostEqual(r['last'], I, delta=0.2)
        dI2 = 50 * .375 / (5.6e-6 * 20e3)                                         # PI on the sample after V_st 100 → 80 V
        self.assertAlmostEqual(o['smp_pi_saw']['sample'], -400, delta=0.05)
        self.assertAlmostEqual(o['smp_pi_saw']['avg'], -400 + dI2 / 2, delta=0.3)
        self.assertAlmostEqual(o['smp_pi_tri1']['avg'], -400, delta=0.3)
        self.assertAlmostEqual(o['smp_pi_saw']['d'], .375, delta=1e-4)          # feedforward from the measured voltages

    def test_blocks_loop(self):
        o = self.o
        ref = o['bl_builtin_pwm_none']
        for key in ('bl_blocks_pwm_none', 'bl_blocks_cmp_none', 'bl_blocks_pwm_z1', 'bl_blocks_cmp_z1'):
            r = o[key]
            self.assertEqual(r['warn'], [])
            self.assertAlmostEqual(r['valley'], 10, delta=2e-3)                  # the PI holds the sampled valley
            self.assertAlmostEqual(r['avg'], 10 + 1.2, delta=2e-3)               # mean = i_ref + Δi/2, Δi = 2.4 A
        for key in ('bl_blocks_pwm_none', 'bl_blocks_cmp_none'):                 # blocks ≡ built-in PI; comparator ≡ PWM
            self.assertAlmostEqual(o[key]['valley'], ref['valley'], delta=1e-6)
            self.assertAlmostEqual(o[key]['vpk'], ref['vpk'], delta=1e-6)
        self.assertAlmostEqual(o['bl_blocks_cmp_z1']['vpk'], o['bl_blocks_pwm_z1']['vpk'], delta=1e-6)
        os0 = (ref['vpk'] - 10) / 5
        os1 = (o['bl_blocks_pwm_z1']['vpk'] - 10) / 5
        self.assertGreater(os1, os0 + .05)                                       # z⁻¹: less phase margin, more overshoot

    def test_subharmonics_peak_valley_and_period_doubling(self):
        o = self.o
        per = lambda k: o[k]['period']
        self.assertEqual(per('sub_peak_0.4_none'), 1)                           # peak: unstable above D = 0.5
        self.assertNotEqual(per('sub_peak_0.6_none'), 1)
        self.assertEqual(per('sub_peak_0.6_half'), 1)
        self.assertNotEqual(per('sub_valley_0.4_none'), 1)                      # valley: the mirror image, unstable below D = 0.5
        self.assertEqual(per('sub_valley_0.6_none'), 1)
        self.assertEqual(per('sub_valley_0.4_half'), 1)
        for k in ('sub_valley_0.6_none', 'sub_valley_0.4_half'):                # peak at the clock = i_c + m_a(1 − D)T + m₁·D·T
            m = o[k]['meta']
            self.assertAlmostEqual(o[k]['distinct'][0], m['ic'] + m['ma'] * (1 - m['D']) * m['T'] + m['m1'] * m['D'] * m['T'], delta=5e-3)
        m = o['sub_peak_0.6_half']['meta']
        self.assertAlmostEqual(o['sub_peak_0.6_half']['distinct'][0], m['ic'] - m['ma'] * m['D'] * m['T'] - m['m2'] * (1 - m['D']) * m['T'], delta=5e-3)
        c = o['chaos']                                                           # boost with R–C load: 1T → 2T → 4T → 8T → chaos
        self.assertEqual([c[k]['period'] for k in ('1.5', '2', '2.5', '2.65', '3')], [1, 2, 4, 8, 0])
        for k in c:
            self.assertEqual(c[k]['warn'], [])

    def test_code_blocks(self):
        o = self.o
        for ff in ('none', 'expr'):
            r = o[f'code_pib_{ff}']
            self.assertEqual(r['warn'], [])
            self.assertAlmostEqual(r['valley'], 10, delta=2e-3)                  # the PI holds the sampled valley at i_ref
        self.assertLess(o['code_pib_none']['early']['min'], 1)                  # without feedforward the current collapses at the start
        self.assertAlmostEqual(o['code_pib_expr']['early']['min'], 5, delta=.01)  # with d = u + v_o/v_in it stays at the reference
        if 'py_skipped' in o:
            self.skipTest('pyodide (npm) not installed: ' + o['py_skipped'])
        for ff in ('none', 'expr'):                                              # Python code ≡ PI block (same operations, last-bit rounding)
            a, b = o[f'code_python_{ff}'], o[f'code_pib_{ff}']
            self.assertEqual(a['warn'], [])
            self.assertAlmostEqual(a['d'], b['d'], delta=1e-12)
            self.assertAlmostEqual(a['valley'], b['valley'], delta=1e-9)
            self.assertAlmostEqual(a['step']['min'], b['step']['min'], delta=1e-9)
            self.assertEqual(a['calls'], 201)                                    # once per period from t = 0 to 4 ms at 50 kHz

    def test_cell_eis(self):
        o = self.o
        for src in ('vs', 'rl'):
            r, m = o['eis_' + src], o['eis_' + src]['meta']
            self.assertEqual(r['warn'], [])
            w = 2 * math.pi * 200
            d = 1 + (w * m['R1'] * m['C1']) ** 2
            zw = m['sig'] / math.sqrt(w)                                         # Warburg σ(1 − j)/√ω
            re, im = m['R0'] + m['R1'] / d + zw, -w * m['R1'] ** 2 * m['C1'] / d - zw
            self.assertAlmostEqual(r['re'], re, delta=.01 * re)                  # through the converter, ripple and all
            self.assertAlmostEqual(r['im'], im, delta=.02 * abs(im))
            self.assertAlmostEqual(r['soc'], .5, delta=1e-3)
            self.assertAlmostEqual(r['ocv'], 3.7, delta=2e-3)                   # OCV(SOC) from the table at SOC = 0.5
        self.assertLess(o['eis_rl']['Idc'], 0)                                  # discharge
        p = abs(o['eis_rl']['Idc']) * 3.55                                      # the R_L takes the power: v_Ci ≈ √(P·R_L)
        self.assertAlmostEqual(o['eis_rl']['vci'], math.sqrt(p * 20), delta=1.5)

    def test_dc_drive(self):
        o = self.o
        for k in ('dc_speed_active', 'dc_speed_imc', 'dc_current_active', 'dc_open_active'):
            self.assertEqual(o[k]['warn'], [], msg=k)
        a, m = o['dc_speed_active'], o['dc_speed_active']['meta']
        J, b, psi, TL = m['J'], m['bm'], m['psi'], m['TL']
        self.assertAlmostEqual(a['w_at'][1], 150, delta=.05)                     # back-calculation: no wind-up after the 30 A limit
        self.assertLess(a['w_max_pre'], 150.3)
        self.assertAlmostEqual(a['w_at'][0], (.1 - .02) * psi * m['Imax'] / J, delta=3)   # accelerating at ψ·I_max/J
        dpk = TL / (J * m['as'] * math.e)                                        # active damping: drop τ_L/(J·α_s·e)
        self.assertAlmostEqual(150 - a['w_min_post'], dpk, delta=.15 * dpk)
        self.assertAlmostEqual(a['w_end'], 150, delta=.02)
        self.assertAlmostEqual(a['i_end'], (b * 150 + TL) / psi, delta=.02)      # i = (b·ω + τ_L)/ψ
        self.assertAlmostEqual(a['d_end'], (m['Ra'] * 10.3 + psi * 150) / m['Vdc'], delta=1e-3)
        c = o['dc_speed_imc']                                                    # IMC: K_i = α_s·b, drop ≈ τ_L/(J·α_s), recovery with J/b = 10 s
        self.assertAlmostEqual(150 - c['w_min_post'], TL / (J * m['as']), delta=.3)
        self.assertLess(c['w_end'], 147)
        r = o['dc_current_active']
        self.assertAlmostEqual(r['i_at30'], 10, delta=.05)
        self.assertAlmostEqual(r['i_end'], -5, delta=.05)
        self.assertAlmostEqual(r['rise'], math.log(9) / m['ac'], delta=.2 * math.log(9) / m['ac'])   # i/i_ref = α_c/(s + α_c)
        q = o['dc_open_active']                                                  # starting current of the open loop
        Ra, La, U = m['Ra'], m['La'], .5 * m['Vdc']
        sg, wn = Ra / (2 * La), psi / math.sqrt(La * J)
        wd = math.sqrt(wn * wn - sg * sg)
        tp = math.atan2(wd, sg) / wd
        ipk = U / (La * wd) * math.exp(-sg * tp) * math.sin(wd * tp)
        self.assertAlmostEqual(q['i_max'], ipk, delta=.02 * ipk)
        self.assertAlmostEqual(q['w_end'], (U * psi - Ra * TL) / (psi ** 2 + Ra * b), delta=.2)

    def test_peak_current_mode(self):
        o = self.o
        self.assertTrue(all(abs(p - 5) < 1e-6 for p in o['pcm_0.4_none']['pk']))
        self.assertGreater(max(o['pcm_0.6_none']['dd']) - min(o['pcm_0.6_none']['dd']), .3)
        for key in ('pcm_0.6_half', 'pcm_0.7_full'):
            r = o[key]
            m = r['meta']
            self.assertEqual(r['warn'], [])
            pk = m['ic'] - m['ma'] * m['D'] * m['T']
            for p in r['pk']:
                self.assertAlmostEqual(p, pk, delta=5e-4)                         # ideal theory; R_on drops raise D by ~2e-4

    def test_polyphase_exercise(self):
        o = self.o
        r = o['poly_4_shift_mid_20000_design']                                   # fixture: 50 V bus, 40 kW, 20 kHz, N = 4
        self.assertAlmostEqual(r['Lmin'], 20.8333e-6, delta=1e-10)
        self.assertGreaterEqual(r['L'], r['Lmin'])
        self.assertEqual(r['phases'], [0, 90, 180, 270])                         # offsets 0, 12.5, 25, 37.5 μs
        for a in r['legAvg']:
            self.assertAlmostEqual(a, -200, delta=0.05)                          # equal sharing
        self.assertAlmostEqual(r['sumAvg'], -800, delta=0.1)
        frac = lambda x: x - math.floor(x + 1e-9)
        for key in ('poly_4_shift_mid_20000_design', 'poly_5_shift_mid_20000_design', 'poly_4_shift_mid_40000_keep', 'poly_4_shift_mid_40000_design'):
            r = o[key]
            N = len(r['legAvg'])
            dI = 50 * r['D'] / (r['L'] / r['T'])
            rr = frac(N * r['D'])
            self.assertAlmostEqual(r['legPP'][0], dI, delta=0.01 * dI, msg=key)
            self.assertAlmostEqual(r['sumPP'], r['vst'] / r['L'] * r['T'] / N * rr * (1 - rr), delta=0.02, msg=key)
        self.assertAlmostEqual(o['poly_4_shift_mid_20000_design']['sumPP'], 12.0, delta=0.01)
        self.assertAlmostEqual(o['poly_4_common_mid_20000_design']['sumPP'], 4 * 45, delta=0.05)   # in phase: N·Δi_k
        self.assertLess(o['poly_4_shift_cancel_20000_design']['sumPP'], 0.01)                     # 66.7 V: N·D = 1
        self.assertAlmostEqual(o['poly_4_shift_cancel_20000_design']['vst'], 200 / 3, delta=1e-6)
        r = o['poly_4_shift_max_20000_design']                                   # 100 V: N·D = 2, worst leg ripple
        self.assertLess(r['sumPP'], 0.01)
        self.assertAlmostEqual(r['legPk'], 230, delta=0.05)                      # |I_k| + Δi_k/2 = 230 A
        self.assertAlmostEqual(o['poly_4_shift_mid_40000_keep']['legPP'][0], 22.5, delta=0.05)   # same L, double f: half
        self.assertAlmostEqual(o['poly_4_shift_mid_40000_design']['L'], 10.4167e-6, delta=1e-10)  # L·f constant

    def test_current_sharing_and_double_update(self):
        o = self.o
        legs = o['share_open_dcr']['legs']                                       # open loop: I_k = (V_bus − (1 − D)V_st)/R_k
        self.assertAlmostEqual(legs[1], -200 * 5 / 7.5, delta=0.3)
        for k in (0, 2, 3):
            self.assertAlmostEqual(legs[k], -200, delta=0.3)
        for a in o['share_pi_dcr']['legs']:                                       # per-phase PI: equal sharing
            self.assertAlmostEqual(a, -200, delta=0.3)
        for a in o['share_open_L']['legs']:                                       # larger L: same mean, smaller ripple
            self.assertAlmostEqual(a, -200, delta=0.3)
        pp = o['share_open_L']['pp']
        self.assertAlmostEqual(pp[1], pp[0] / 1.2, delta=0.01 * pp[0])
        for a in o['share_pi_toggle']:                                            # live phase change, PI restores sharing
            self.assertAlmostEqual(a, -200, delta=0.1)
        s, d = o['smp_upd_single'], o['smp_upd_double']
        self.assertAlmostEqual(s['end'], -400, delta=0.05)
        self.assertAlmostEqual(d['end'], -400, delta=0.05)
        self.assertLess(abs(d['at24'] + 400), abs(s['at24'] + 400))               # faster with two updates per period


if __name__ == '__main__':
    unittest.main(verbosity=2)
