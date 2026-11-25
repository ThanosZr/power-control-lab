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


def gfm_link(law='droop', P=300e6, refs=None):
    """5.0.18: a link of two stations on a DC grid of two buses (R–L–C): S1 holds V_dc from a stiff AC bus, S2 forms the voltage
    of an island with a constant-impedance load (Vf in the load flow), grid-forming in the RMS with the law `law` (1000 MVA, the
    reactor X 0.15, R 0.002 pu). refs: the references of the law, else from the load flow (at rest)."""
    net = N.Network(f=50.0, S_base=100e6)
    net.bus('A', 400e3)
    net.feeder('A', Sk=100e9, RX=0.1, name='QA')
    net.bus('B', 400e3)
    net.load('B', P=P, Q=0.0, name='LD')
    net.dc_bus('D1', 640e3)
    net.dc_bus('D2', 640e3)
    net.dc_line('D1', 'D2', R=1.2, L=0.09, C=12.8e-6, poles=1, name='CAB')
    net.vsc('A', 'D1', control='V', V=1.0, Prated=1000e6, name='S1')
    net.vsc('B', 'D2', control='Vf', Vac=1.0, Prated=1000e6, name='S2')
    return net, {'S2': {'model': 'gfm', 'law': law, 'X': 0.15, 'R': 0.002, **(refs or {})}}


class GridFormingStation(unittest.TestCase):
    """5.0.18 (THEORY §8ΩΤ): a station that forms the voltage of its AC side with a grid-forming law (the GFMC of the MMCC in mode
    gfm: droop, VSM, PSC, as the converters of 5.0.14), its DC side by the balance of power: at rest from the load flow; the laws
    in the steady state after a step of the load against their closed forms; the Jacobian of the device; the link of hvdc_gfm from
    its drawing (an island, a weak grid, a second unit) against its EMT (tests/js/hvdc_gfm_rms_cases.js)."""

    @classmethod
    def setUpClass(cls):
        cases = [{'ac': 'island', 'law': 'droop'}, {'ac': 'island', 'law': 'psc'}, {'ac': 'weak', 'law': 'droop'}, {'ac': 'par', 'law': 'droop'}]
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'hvdc_gfm_rms_cases.js'), json.dumps(cases), '1.2'], capture_output=True,
                             text=True, timeout=1200, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr)
        cls.js = {(e['opts']['ac'], e['opts']['law']): e for e in json.loads(out.stdout)['runs']}

    def test_at_rest_and_the_laws(self):
        # each law from the load flow (its references from there) rests; after +100 MW of load at 0.2 s (an impedance at |V₀|) the
        # station takes it all, and its frequency is that of its law with the P of the station (pu of S_n, to the AC side):
        # droop ω = 1 − m_p·(P − P_ref); VSM 0 = P_ref − P_E/ω − (ω − 1)/m_p; PSC ω = 1 + k_p·(P_ref − P)/ω₀
        for law in ('droop', 'vsm', 'psc'):
            net, st = gfm_link(law)
            s = rms.System(net, stations=st)
            r0 = s.init()
            self.assertLess(r0['f'], 1e-8, msg=law)
            self.assertLess(r0['g'], 1e-12, msg=law)
            r = net.dynamic(1.5, events=[{'t': 0.2, 'kind': 'load', 'bus': 'B', 'P': 100.0}], stations=st, h=0.005, record=0.005)
            self.assertEqual(r['stats']['nonconv'], 0, msg=law)
            q = r['dc']['stations']['S2']
            P0, P, w = q['P'][0] / 1000.0, q['P'][-1] / 1000.0, q['f'][-1] / 50.0
            self.assertLess(abs(q['f'][30] - 50.0), 1e-9, msg=law)                          # at rest before the step
            V, V0 = q['V'][-1], q['V'][0]                                                   # the load (constant impedance) at |V|
            self.assertAlmostEqual(P, (300 * V * V + 100 * V * V / (V0 * V0)) / 1000, delta=1e-6, msg=law)
            if law == 'droop':
                self.assertAlmostEqual(w, 1 - 0.02 * (P - P0), delta=1e-9)
            elif law == 'psc':
                self.assertAlmostEqual(w, 1 + 50.0 * (P0 - P) / (2 * math.pi * 50), delta=1e-9)
            else:
                PE = P + 0.002 * (q['I'][-1]) ** 2                                         # at the EMF: the losses of R_f
                PE0 = P0 + 0.002 * q['I'][0] ** 2
                self.assertAlmostEqual(PE0 - PE / w - (w - 1) / 0.02, 0.0, delta=1e-6)
            # the DC side: the station of V_dc gives what the island takes, less the losses of the cable
            d1, d2 = r['dc']['stations']['S1'], q
            loss = (r['dc']['buses']['D1']['U'][-1] - r['dc']['buses']['D2']['U'][-1]) ** 2 / 1.2                   # kV²/Ω = MW
            self.assertAlmostEqual(d1['Pdc'][-1] + d2['Pdc'][-1], loss, delta=0.05, msg=law)

    def test_the_jacobian(self):
        for law in ('droop', 'vsm', 'psc'):
            net, st = gfm_link(law)
            s = rms.System(net, stations=st)
            s.init()
            rng = np.random.default_rng(7)
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
            self.assertLess(float(np.max(np.abs(J - Jn) / np.maximum(np.abs(J), 1.0))), 1e-5, msg=law)

    def test_the_drawing(self):
        # the start of a grid-forming station: Vf where no other source holds its AC side (an island, also with a second unit, a
        # VSC2 that is a generator of P = 0 in the RMS), else P = P_ref·S (the weak grid); its law from its MMCC, out of the station
        from pcl import model
        drw = {}
        for ac in ('island', 'weak', 'par'):
            drw[ac] = model.of(json.loads(subprocess.run(['node', str(ROOT / 'tests/js/model_cases.js'), 'build', 'hvdc_gfm', json.dumps({'ac': ac})],
                                                         capture_output=True, text=True, timeout=300, check=True).stdout))
            net, info = model.network(drw[ac], 'pf')
            (e,) = [q for q in net.elements if q['kind'] == 'vsc' and q['name'] == 'MMC2']
            self.assertEqual(e['control'], 'P' if ac == 'weak' else 'Vf', msg=ac)
        st, notes = model.stations_of(drw['weak'])
        d = st['MMC2']
        self.assertEqual((d['model'], d['law'], d['Pref'], d['Imax'], d['mp'], d['H']), ('gfm', 'droop', 0.5, 1.1, 2.0, 2.0))
        self.assertAlmostEqual(d['X'], 0.075, delta=1e-4)
        self.assertEqual(notes, [])
        # the load flow of the weak grid: from the flat start a bus near zero voltage behind YNd1; from the start at the shifts the
        # solution (the bus of the station at 0,92 pu, the grid at SCR 1,5 with 0,5 pu)
        net, info = model.network(drw['weak'], 'pf')
        r = net.acdc_flow()
        self.assertLess(min(q['V'] for q in r['buses'].values()), 0.5)
        r = model.load_flow(drw['weak'])
        self.assertGreater(min(q['V'] for q in r['buses'].values()), 0.9)
        self.assertAlmostEqual(r['buses']['J2']['V'], 0.9232, delta=1e-4)

    def test_against_the_emt(self):
        # station 2 of hvdc_gfm from its drawing (h = 5 ms) against the EMT of the same drawing as means over one period centred at
        # each point. Measured: after the step (0.65–1.19 s) |ΔP| 4.7·10⁻⁴ (island, droop), 5.8·10⁻³ (island, PSC), 3.6·10⁻³ (weak,
        # droop), 5.3·10⁻⁴ (second unit, droop) pu; |Δω| 3.5·10⁻⁵, 9.2·10⁻⁴, 9.4·10⁻⁵, 2.6·10⁻⁵; |Δ|v|| ≤ 2.7·10⁻³; the voltages
        # between the poles ≤ 2.1 kV; at the end (1.1–1.19 s) |ΔP| ≤ 1.5·10⁻³ pu
        from pcl import model
        lim = {('island', 'droop'): (1e-3, 1e-4), ('island', 'psc'): (1e-2, 2e-3), ('weak', 'droop'): (6e-3, 2e-4), ('par', 'droop'): (1e-3, 1e-4)}
        for (ac, law), (dp, dw) in lim.items():
            e = self.js[(ac, law)]
            self.assertEqual(e['warn'], [], msg=(ac, law))
            m = model.of(json.loads(subprocess.run(['node', str(ROOT / 'tests/js/model_cases.js'), 'build', 'hvdc_gfm', json.dumps({'ac': ac, 'law': law})],
                                                   capture_output=True, text=True, timeout=300, check=True).stdout))
            r = model.dynamic(m, t_end=1.2, h=0.005, record=0.005, buses=[])
            self.assertEqual(r['stats']['nonconv'], 0, msg=(ac, law))
            te, tr = np.array(e['t']), np.asarray(r['t'])
            q = r['dc']['stations']['MMC2']

            def emt(key, t):
                w = (te > t - 0.01 + 1e-9) & (te <= t + 0.01 + 1e-9)
                return float(np.mean(np.asarray(e[key])[w]))
            post = [i for i, t in enumerate(tr) if 0.65 - 1e-9 <= t <= 1.19 + 1e-9]
            end = [i for i, t in enumerate(tr) if 1.1 - 1e-9 <= t <= 1.19 + 1e-9]
            dP = [abs(q['P'][i] * 1e6 / 1059e6 - emt('P', tr[i])) for i in post]
            dW = [abs(q['f'][i] / 50.0 - emt('w', tr[i])) for i in post]
            dV = [abs(q['V'][i] - emt('v', tr[i])) for i in post]
            dU = [abs(q['Udc'][i] * 640.0 - emt('U2', tr[i])) for i in post]
            self.assertLess(max(dP), dp, msg=(ac, law))
            self.assertLess(max(dW), dw, msg=(ac, law))
            self.assertLess(max(dV), 4e-3, msg=(ac, law))
            self.assertLess(max(dU), 3.0, msg=(ac, law))
            self.assertLess(abs(float(np.mean([q['P'][i] * 1e6 / 1059e6 - emt('P', tr[i]) for i in end]))), 2e-3, msg=(ac, law))

    def test_what_it_refuses(self):
        with self.assertRaises(rms.RMSError):                    # a grid-forming station does not hold the DC voltage
            rms.System(one_bus(), stations={'S1': {'model': 'gfm'}})
        net, st = gfm_link('dvoc')
        with self.assertRaises(rms.RMSError):                    # dVOC and matching are not in the RMS yet
            rms.System(net, stations=st)


if __name__ == '__main__':
    unittest.main()
