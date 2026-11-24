"""5.0.15 (ROADMAP §101 step 2, THEORY §8ΩΟ): HVDC and DC grids in the RMS dynamics (pcl.rms.HVDC), the station that forms the
voltage of its island (vsc control 'Vf') in the AC/DC load flow, and the grid-following converter with the control 'pi' of the
MMCC (pcl.rms.Converter, cc 'pi').

The checks: at rest from the AC/DC load flow; two loops with a closed-form solution (the V_dc loop of a station on its own
capacitance, the power loop of the converter 'pi'); the Jacobian of the device across buses against differences; and the
DCS2 of the CIGRE B4 against our EMT of the same network (the tutorial b4dcs2, tests/js/b4_rms_cases.js). 5.0.17: the link of
hvdc_mmc (a symmetric monopole) from its drawing against its EMT (tests/js/hvdc_rms_cases.js), with the limiter of the DC
overvoltage of the MMCC."""
import json
import math
import subprocess
import unittest
from pathlib import Path

import numpy as np

from pcl import dcgrid as D
from pcl import network as N
from pcl import rms

ROOT = Path(__file__).resolve().parent.parent
WF = {'WF': {'model': 'gfl', 'cc': 'pi', 'Sn': 600e6, 'X': 0.15, 'R': 0.003, 'bw': 20.0}}      # the wind farm of b4dcs2 (its MMCC)
EVENTS = {'cd55': [{'t': 1.0, 'kind': 'pref', 'gen': 'Cd-E1', 'dP': -0.245}],                      # 300 → 55 MW of 1000 MVA
          'wind': [{'t': 1.0, 'kind': 'pref', 'gen': 'WF', 'dP': -250 / 600}],                      # 500 → 250 MW of 600 MVA
          'load': [{'t': 1.0, 'kind': 'load', 'bus': 'E1', 'P': 50.0, 'Q': 0.0}]}                   # 100 → 150 MW


def dcs2(ctl='vdc', dcside='model4'):
    s = rms.System(D.b4_dcs2_network(ctl), machines=WF, stations=D.b4_dcs2_stations(dcside))
    s.init()
    return s


def one_bus():
    """One DC bus D1 whose only capacitance is that of its station S1 (W 30 kJ/MVA on 100 MVA: 2H = 0.06 s, the H of its V_dc
    loop), held by S1 from a stiff AC bus; the DC/DC converter DD brings power from D2, held by S2."""
    net = N.Network(f=50.0, S_base=100e6)
    for b in ('A', 'B'):
        net.bus(b, 400e3)
        net.feeder(b, Sk=100e9, RX=0.1, name='Q' + b)
    net.dc_bus('D1', 400e3)
    net.dc_bus('D2', 400e3)
    net.vsc('A', 'D1', control='V', V=1.0, Prated=100e6, name='S1')
    net.vsc('B', 'D2', control='V', V=1.0, Prated=100e6, name='S2')
    net.dcdc('D2', 'D1', control='P', P=0.0, Prated=100e6, name='DD')
    return net


class Islands(unittest.TestCase):
    """The station that forms the voltage of its island (Vf) in the AC/DC load flow."""

    def test_the_island_takes_its_power_from_the_dc_grid(self):
        net = D.b4_dcs2_network()
        r = net.acdc_flow(tol=1e-10)
        self.assertTrue(r['converged'])
        c = r['converters']
        for st, bus in (('Cm-E1', 'E1v'), ('Cm-F1', 'F1v')):
            self.assertEqual(r['types'][bus], 'slack')
            self.assertAlmostEqual(r['buses'][bus]['V'], 1.0, delta=1e-12)
            self.assertAlmostEqual(c[st]['Pdc'], -c[st]['Ps'], delta=1e-3)          # lossless: what it gives the island
        # E1: the load (constant impedance), and the transformer without losses
        self.assertAlmostEqual(c['Cm-E1']['Ps'], r['buses']['E1']['Pload'], delta=1e-3)
        self.assertAlmostEqual(c['Cm-F1']['Ps'], -500e6, delta=1e-3)                # the wind farm
        # the DC load flow sees what the islands take: the slack Cm-B3 takes the rest (losses of the lines in between)
        P = sum(q['Pdc'] for q in c.values() if q['dc'].startswith('Bm-'))
        self.assertAlmostEqual(P + r['dc']['dcdc']['Cd-E1']['P'], sum(q['loss'] for q in r['dc']['lines']), delta=1.0)      # W

    def test_what_is_refused(self):
        net = D.b4_dcs2_network()
        net.generator('E1v', 100e6, 208e3, 0.2, 1.0, P=0.0, name='G')
        with self.assertRaises(N.NetworkError):
            net.acdc_flow()
        with self.assertRaises(N.NetworkError):
            D.b4_dcs2_network().acdc_opf()


class Rest(unittest.TestCase):
    def test_the_start_is_at_rest(self):
        for ctl in ('vdc', 'droop'):
            for side in ('bus', 'model4'):
                s = rms.System(D.b4_dcs2_network(ctl), machines=WF, stations=D.b4_dcs2_stations(side))
                st = s.init()
                # the residual of the AC/DC load flow (tol 10⁻⁸) over the small capacitance of a bus (measured ≤ 1.02·10⁻⁹)
                self.assertLess(st['f'], 1e-8, msg=(ctl, side))
                self.assertLess(st['g'], 1e-12, msg=(ctl, side))
                r = s.simulate(0.5, h=0.005)
                self.assertLess(float(np.max(np.abs(r['x'] - r['x'][0]))), 1e-9, msg=(ctl, side))

    def test_the_whole_b4_starts_at_rest(self):
        # the case b4 of the engine: 15 stations on their own AC buses, three DC grids, the lines with L and C of Table 7.3
        r = N.case_data('b4').dynamic(t_end=0.2, h=0.005)
        self.assertEqual((len(r['dc']['stations']), len(r['dc']['dcdc']), len(r['dc']['buses'])), (11, 2, 15))
        for d in r['dc']['buses'].values():
            self.assertLess(float(np.max(np.abs(np.asarray(d['V']) - d['V'][0]))), 1e-9)


class Loops(unittest.TestCase):
    def test_the_vdc_loop_of_a_station(self):
        # 2H·Δu′ = ΔP − (k_p + k_i/s)·Δu with k_p = 2ζω_n·2H, k_i = 2H·ω_n², ζ = 0.8, ω_n = 3/(ζ·T_vdc): for a step ΔP,
        # Δu(t) = ΔP/(2H·ω_d)·e^(−ζω_n t)·sin(ω_d t). The inner lag τ = 10⁻⁴ s (τ·ω_n = 0.004): the largest difference 0.33 % of the
        # peak (measured)
        st = {'S1': {'inner': 'lag', 'Ti': 3e-4, 'bw': 50.0}, 'S2': {'inner': 'lag', 'Ti': 3e-4}, 'DD': {'Tdc': 0.0}}
        dP, H, zt = 0.01, 0.03, 0.8
        wn = 3 / (zt * 0.1)
        wd = wn * math.sqrt(1 - zt * zt)
        r = one_bus().dynamic(0.6, events=[{'t': 0.1, 'kind': 'pref', 'gen': 'DD', 'dP': dP}], stations=st, h=0.001, record=0.001)
        t = np.asarray(r['t'])
        u = np.asarray(r['dc']['buses']['D1']['V'])
        tt = np.clip(t - 0.1, 0, None)
        ua = 1 + dP / (2 * H * wd) * np.exp(-zt * wn * tt) * np.sin(wd * tt)
        self.assertLess(float(np.max(np.abs(u - ua))), 0.005 * float(np.max(ua - 1)))
        self.assertAlmostEqual(float(u[-1]), 1.0, delta=1e-5)
        self.assertAlmostEqual(float(r['dc']['stations']['S1']['Pdc'][-1]), -dP * 100, delta=1e-3)      # MW: it takes the step

    def test_the_power_loop_of_the_converter_pi(self):
        # x_p′ = (3/T_p)·(P_ref − P) with P = v_d·i_d = x_p (the inner loop fast): P(t) = P₀ + ΔP·(1 − e^(−3t/T_p))
        net = N.Network(f=50.0, S_base=100e6)
        net.bus('S', 400e3)
        net.feeder('S', Sk=100e9, RX=0.1, name='Q')
        net.bus('G', 400e3)
        net.line('S', 'G', 0.0, 1.6, length=1.0)
        net.generator('G', 100e6, 400e3, 0.2, 1.0, P=50e6, name='C')
        r = net.dynamic(0.6, events=[{'t': 0.1, 'kind': 'pref', 'gen': 'C', 'dP': 0.1}], h=0.001, record=0.001,
                        machines={'C': {'model': 'gfl', 'cc': 'pi', 'Ti': 3e-4, 'Sn': 100e6, 'bw': 50.0}})
        t = np.asarray(r['t'])
        P = np.asarray(r['converters']['C']['P'])
        Pa = 50 + 10 * (1 - np.exp(-3 * np.clip(t - 0.1, 0, None) / 0.1))
        self.assertLess(float(np.max(np.abs(P - Pa))), 0.05)                                         # MW (measured 0.024)

    def test_the_jacobian_across_buses(self):
        # the complex step of the device across buses against central differences, at a point away from the start
        s = dcs2('droop')
        rng = np.random.default_rng(5)
        x = s.x0 + 1e-3 * rng.standard_normal(s.nx)
        y = s.y0 + 1e-3 * rng.standard_normal(s.ny)
        J = s.jac(x, y).toarray()
        z = np.r_[x, y]
        Jn = np.empty_like(J)
        for j in range(len(z)):
            e = np.zeros(len(z))
            e[j] = 1e-6
            fp, gp = s.fg(*np.split(z + e, [s.nx]))
            fm, gm = s.fg(*np.split(z - e, [s.nx]))
            Jn[:, j] = (np.r_[fp, gp] - np.r_[fm, gm]) / 2e-6
        sc = np.maximum(np.abs(J), 1.0)
        self.assertLess(float(np.max(np.abs(J - Jn) / sc)), 1e-5)


class Modes(unittest.TestCase):
    def test_the_droop_with_the_capacitances_on_the_buses(self):
        # with the droops (k_d 0.05) the capacitance of each station on its DC bus (CIGRE TB 604, §2.6.1) leaves two modes of
        # 17–22 Hz unstable; with the DC side of Model 4 (the capacitance behind 2L_arm/3 and the active damping) they are
        # damped, as the EMT (measured: λ = 4.9 ± 139j and 1.1 ± 113j; with Model 4 −1.10 ± 111j)
        lam = dcs2('droop', 'bus').eigen('qr')['lambda']
        self.assertGreater(float(np.max(lam.real)), 1.0)
        lam = dcs2('droop', 'model4').eigen('qr')['lambda']
        lam = lam[np.abs(lam) > 1e-6]                       # (the frequency of the wind farm's PLL without its response: λ = 0)
        self.assertLess(float(np.max(lam.real)), -0.5)


class AgainstEMT(unittest.TestCase):
    """The DCS2 of b4dcs2 (b4_dcs2_network, b4_dcs2_stations with the DC side of Model 4, the wind farm as the converter 'pi')
    against its EMT, from 0.5 s: the DC voltages of the five buses and the powers at the terminals of the four stations."""

    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'b4_rms_cases.js')], capture_output=True, text=True, timeout=900, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr)
        cls.js = json.loads(out.stdout)

    def test_the_dcs2(self):
        # measured with h = 5 ms (THEORY §8ΩΟ.7), cd55 vdc, cd55 droop, wind vdc, load vdc: the largest |ΔU| 6.8, 6.8, 1.1, 1.2 kV
        # and |ΔP| 42, 42, 6.2, 6.6 MW (in the first milliseconds of the event); at the end 0.009, 0.09, 0.002, 0.005 kV and
        # 0.8, 1.1, 0.2, 0.8 MW (the losses of the MMC, which the load flow and the RMS have not)
        tol = {'cd55': (8.5, 53.0), 'wind': (1.5, 7.5), 'load': (1.5, 8.5)}
        for e in self.js['runs']:
            self.assertEqual(e['warn'], [])
            r = D.b4_dcs2_network(e['ctl']).dynamic(2.5, events=EVENTS[e['ev']], machines=WF, stations=D.b4_dcs2_stations(), h=0.005, record=0.005)
            te, T = np.array(e['t']), np.asarray(r['t'])
            m, end = te > 0.5, te > 2.4
            tu, tp = tol[e['ev']]
            for k in ('B2', 'B3', 'B5', 'F1', 'E1'):
                d = np.interp(te, T, r['dc']['buses']['Bm-' + k]['U']) - np.array(e['U'][k])
                self.assertLess(float(np.max(np.abs(d[m]))), tu, msg=(e['ev'], e['ctl'], k))
                self.assertLess(abs(float(d[end].mean())), 0.15, msg=(e['ev'], e['ctl'], k))          # kV
            for k in ('B2', 'B3', 'F1', 'E1'):
                d = np.interp(te, T, r['dc']['stations']['Cm-' + k]['Pt']) - np.array(e['P'][k])
                self.assertLess(float(np.max(np.abs(d[m]))), tp, msg=(e['ev'], e['ctl'], k))
                self.assertLess(abs(float(d[end].mean())), 1.5, msg=(e['ev'], e['ctl'], k))           # MW


    def test_the_dcs2_from_the_drawing(self):
        """5.0.16: the same DCS2 in RMS from the drawing of b4dcs2 itself (pcl.model.dynamic: the stations from the MMC with their
        MMCC, the DC grid from its nodes, Cd-E1 as the current source of its expression, the wind farm from its VSC2 and MMCC,
        both from zero as the EMT): measured with h = 5 ms, from 0.5 s, the largest |ΔU| 7.1, 6.9, 0.79, 0.78 kV and |ΔP| 40, 40,
        6.7, 6.7 MW; at the end as the network of the API (THEORY §8ΩΠ.5)."""
        from pcl import model
        tol = {'cd55': (8.5, 53.0), 'wind': (1.5, 7.5), 'load': (1.5, 8.5)}
        for e in self.js['runs']:
            proj = json.loads(subprocess.run(['node', str(ROOT / 'tests/js/model_cases.js'), 'build', 'b4dcs2', json.dumps({'ev': e['ev'], 'ctl': e['ctl']})],
                                             capture_output=True, text=True, timeout=300, check=True).stdout)
            r = model.dynamic(model.of(proj), t_end=2.5, h=0.005, record=0.005, buses=[])
            self.assertEqual(r['stats']['nonconv'], 0)
            self.assertEqual([n for n in r['drawing']['notes'] if not n.startswith('Ζυγοί χωρίς πηγή')], [])          # (the load beyond CBL)
            te, T = np.array(e['t']), np.asarray(r['t'])
            m, end = te > 0.5, te > 2.4
            tu, tp = tol[e['ev']]
            for k in ('B2', 'B3', 'B5', 'F1', 'E1'):
                d = np.interp(te, T, r['dc']['buses']['N' + k]['U']) - np.array(e['U'][k])
                self.assertLess(float(np.max(np.abs(d[m]))), tu, msg=(e['ev'], e['ctl'], k))
                self.assertLess(abs(float(d[end].mean())), 0.15, msg=(e['ev'], e['ctl'], k))          # kV
            for k in ('B2', 'B3', 'F1', 'E1'):
                d = np.interp(te, T, r['dc']['stations']['MMC' + k]['Pt']) - np.array(e['P'][k])
                self.assertLess(float(np.max(np.abs(d[m]))), tp, msg=(e['ev'], e['ctl'], k))
                self.assertLess(abs(float(d[end].mean())), 1.5, msg=(e['ev'], e['ctl'], k))           # MW


class SymmetricMonopole(unittest.TestCase):
    """5.0.17 (THEORY §8ΩΡ.5): the link of hvdc_mmc (two MMC stations, Model 4, a symmetric monopole with the cable pair of the
    tutorial) in RMS from its drawing (pcl.model.dynamic: a grid of two pairs of poles, the cable as a line of two poles) against
    its EMT (tests/js/hvdc_rms_cases.js), from 0.2 s: the voltages between the poles at the two stations and their DC powers."""

    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'hvdc_rms_cases.js'), 'pstep,acf'], capture_output=True, text=True,
                             timeout=900, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr)
        cls.js = {e['ev']: e for e in json.loads(out.stdout)['runs']}

    def run_rms(self, ev, ovl=True):
        from pcl import model
        proj = json.loads(subprocess.run(['node', str(ROOT / 'tests/js/model_cases.js'), 'build', 'hvdc_mmc', json.dumps({'ev': ev})],
                                         capture_output=True, text=True, timeout=300, check=True).stdout)
        m = model.of(proj)
        if not ovl:
            for e in m['elements']:
                if e['type'] == 'MMC':
                    e['ctl']['params']['ovl'] = 'off'
        r = model.dynamic(m, t_end=1.0, h=0.005, record=0.001, buses=[])
        self.assertEqual(r['stats']['nonconv'], 0)
        self.assertEqual(r['drawing']['notes'], [])
        e = self.js[ev]
        te, T = np.array(e['t']), np.asarray(r['t'])
        dU, dP = {}, {}
        for k in ('1', '2'):
            dU[k] = np.interp(te, T, r['dc']['buses']['dc' + k]['U']) - np.array(e['U'][k])
            dP[k] = np.interp(te, T, r['dc']['stations']['MMC' + k]['Pt']) - np.array(e['U'][k]) * np.array(e['I'][k]) / 1e3
        return te, dU, dP

    def test_the_step_of_p(self):
        # measured with h = 5 ms, from 0.2 s (after the start of the tutorial): the largest |ΔU| 1.60 and 1.40 kV, |ΔP| 20.7 and
        # 21.8 MW (in the first ms after the step at 0.5 s); at the end ΔU 0.000 kV and ΔP ±1.44 MW (the losses of the MMC, which
        # the load flow and the RMS have not, THEORY §8ΩΟ.7)
        self.assertEqual(self.js['pstep']['warn'], [])
        te, dU, dP = self.run_rms('pstep')
        m, end = te > 0.2, te > 0.95
        for k in ('1', '2'):
            self.assertLess(float(np.max(np.abs(dU[k][m]))), 2.0, msg=k)               # kV
            self.assertLess(float(np.max(np.abs(dP[k][m]))), 26.0, msg=k)              # MW
            self.assertLess(abs(float(dU[k][end].mean())), 0.02, msg=k)
            self.assertLess(abs(float(dP[k][end].mean())), 2.0, msg=k)

    def test_the_ac_fault_at_the_station_of_vdc(self):
        # the three-phase fault at the station of V_dc (0.5–0.65 s): the station of P cuts its current above V_dc,max 1.1 pu (the
        # limiter of the MMCC, ovl), and the DC voltage stays near 1.2 pu as in the EMT, where the station of V_dc blocks (its
        # protection, which the RMS has not). Measured: during the fault (0.55–0.65 s) |ΔU| 4.3 and 5.1 kV; after it (from 0.7 s)
        # 25 kV, the recovery of the RMS slower; at the end −0.08 and −0.09 kV. Without the limiter the RMS stays at 1164 kV.
        te, dU, dP = self.run_rms('acf')
        f, end = (te > 0.55) & (te < 0.65), te > 0.95
        for k in ('1', '2'):
            self.assertLess(float(np.max(np.abs(dU[k][f]))), 6.5, msg=k)
            self.assertLess(float(np.max(np.abs(dU[k][te > 0.7]))), 32.0, msg=k)
            self.assertLess(abs(float(dU[k][end].mean())), 0.15, msg=k)
            self.assertLess(abs(float(dP[k][end].mean())), 3.5, msg=k)
        te, dU, dP = self.run_rms('acf', ovl=False)
        self.assertGreater(float(dU['1'][end].mean()), 400.0)


class Refused(unittest.TestCase):
    def test_what_the_rms_model_refuses(self):
        with self.assertRaises(rms.RMSError):                # the station chain of mtdc5 (R_tr, X_tr, B_f): elements of the AC network
            N.case_data('mtdc5').dynamic(t_end=0.1)
        net = one_bus()
        for bad in ({'S1': {'nope': 1.0}}, {'S1': {'inner': 'fast'}}):
            with self.assertRaises(rms.RMSError):
                net.dynamic(t_end=0.1, stations=bad)
        with self.assertRaises(rms.RMSError):                # a DC/DC converter has no reference of voltage
            net.dynamic(t_end=0.1, events=[{'t': 0.05, 'kind': 'vref', 'gen': 'DD', 'dV': 0.01}])
        net2 = D.b4_dcs2_network()
        with self.assertRaises(rms.RMSError):                # a Vf station has no reference of P
            net2.dynamic(t_end=0.1, machines=WF, events=[{'t': 0.05, 'kind': 'pref', 'gen': 'Cm-E1', 'dP': 0.1}])
        with self.assertRaises(rms.RMSError):                # a station of P has no reference of V_dc
            net2.dynamic(t_end=0.1, machines=WF, events=[{'t': 0.05, 'kind': 'vref', 'gen': 'Cm-B2', 'dV': 0.01}])
        net3 = one_bus()                                    # a station with a current droop: not in the RMS model yet
        net3.element('S2').update(control='idroop', droop=0.05)
        with self.assertRaises(rms.RMSError):
            rms.System(net3)
        with self.assertRaises(rms.RMSError):                # a converter 'pi' with a store
            rms.System(N.ieee9(), machines={'G3': {'model': 'gfl', 'cc': 'pi', 'storage': {'E': 1.0}}}).init()


if __name__ == '__main__':
    unittest.main()
