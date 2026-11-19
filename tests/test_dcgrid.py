"""Multi-terminal DC grids in steady state (4.20, ROADMAP §82, pcl/dcgrid.py): the DC load flow with power, slack and droop
converters against the published five-terminal grid of Haileselassie & Uhlen (2012, Tables II–IX: the load flow, the PSCAD
steady states after a step, the linearised sharing), the conductance matrix of the four-terminal grid of Beerten & Belmans
(2013, (40)), the converter station of Beerten, Cole & Belmans (2012, Tables I–III), closed forms, and the sequential AC/DC
load flow on a network of the engine. The input data of the published grids and their reference values only; the rest is ours."""
import cmath
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

from pcl import dcgrid as D
from pcl import network as N
from pcl import study as S

kV, MW = 1e3, 1e6
HU_LEN = {('1', '2'): 80, ('1', '4'): 125, ('1', '3'): 200, ('2', '3'): 160, ('3', '4'): 160, ('4', '5'): 250}
HU_RATED = {'1': 900, '2': 800, '3': 1000, '4': 750, '5': 1200}          # MW (Table II)


def hu_grid(l45=250):
    """The five-terminal grid of Haileselassie & Uhlen (Fig. 3): 400 kV pole to pole, r = 0.01 Ω/km per conductor."""
    g = D.DCGrid(P_base=100 * MW)
    for b in '12345':
        g.bus(b, 400 * kV)
    for (a, b), ln in HU_LEN.items():
        g.line(a, b, r=0.01, length=l45 if (a, b) == ('4', '5') else ln, name=a + b)
    return g


def hu_table4():
    """Table III as given: terminal 2 holds 400 kV, the others their power."""
    g = hu_grid()
    g.converter('1', 'P', P=600 * MW, name='1')
    g.converter('2', 'V', V=1.0, name='2')
    g.converter('3', 'P', P=-750 * MW, name='3')
    g.converter('4', 'P', P=550 * MW, name='4')
    g.converter('5', 'P', P=-900 * MW, name='5')
    return g


def hu_droop(base, rho=0.04, P3=-750 * MW, l45=250):
    """Terminals 1, 2, 4, 5 on the P–V droop ρ (pu) around the state of `base` (Table IV), terminal 3 at a constant power."""
    g = hu_grid(l45)
    for b in '1245':
        g.converter(b, 'droop', P=base['buses'][b]['P'], V=base['buses'][b]['V'], droop=rho, Prated=HU_RATED[b] * MW, name=b)
    g.converter('3', 'P', P=P3, name='3')
    return g


class FiveTerminal(unittest.TestCase):
    """Haileselassie & Uhlen (2012), §VI: the load flow of Table IV, the steps of Tables V–IX."""

    @classmethod
    def setUpClass(cls):
        cls.base = hu_table4().flow(tol=1e-12)

    def test_table4(self):
        r = self.base
        self.assertTrue(r['converged'])
        for b, u in zip('12345', (399.550, 400.000, 396.613, 396.928, 385.247)):
            self.assertAlmostEqual(r['buses'][b]['U'] / kV, u, delta=5e-4)
        self.assertAlmostEqual(r['converters']['2']['P'] / MW, 535.938, delta=5e-4)
        # the power balance: what the converters put in is what the lines lose
        self.assertAlmostEqual(sum(c['P'] for c in r['converters'].values()), r['losses'], delta=1e-3)

    def test_jacobian_35(self):
        J = np.array(self.base['jacobian']) * kV / MW            # MW/kV
        ref = [[510.9277, -249.7186, -99.8874, -159.8199, 0], [-250.0000, 376.3398, -125.0000, 0, 0],
               [-99.1532, -123.9415, 345.1453, -123.9415, 0], [-158.7711, 0, -124.0399, 363.5821, -79.3855],
               [0, 0, 0, -77.0494, 74.7132]]
        self.assertLess(np.max(np.abs(J - np.array(ref))), 1e-4)

    def test_step_table6(self):
        """ΔP*₃ = −50 MW with ρ = 0.04 at terminals 1, 2, 4, 5: the steady state of the PSCAD run (Table VI)."""
        r = hu_droop(self.base, P3=-800 * MW).flow(tol=1e-12)
        for b, u, p in zip('12345', (399.287, 399.726, 396.204, 396.677, 385.118), (614.820, 549.651, -800.0, 561.746, -890.33)):
            self.assertAlmostEqual(r['buses'][b]['U'] / kV, u, delta=1.5e-3)
            self.assertAlmostEqual(r['converters'][b]['P'] / MW, p, delta=0.02)
        for b in '1245':                                   # the droop law holds exactly
            c = r['converters'][b]
            self.assertAlmostEqual(c['P'] - self.base['buses'][b]['P'],
                                   -HU_RATED[b] * MW / (0.04 * 400 * kV) * (c['U'] - self.base['buses'][b]['U']), delta=1e-3)

    def test_sensitivity_table8(self):
        """The linearised sharing of the paper's model (27) at the state of Table V (Table VIII, 'estimation')."""
        g = hu_droop(self.base)
        s = D.sensitivity(g, g.flow(tol=1e-12))
        dP = s['B'] @ np.array([0, 0, -50, 0, 0])
        for v, ref in zip(dP, (14.813, 13.716, -50.000, 11.736, 9.664)):
            self.assertAlmostEqual(v, ref, delta=2e-3)
        dU = s['dU'] @ np.array([0, 0, -50 * MW, 0, 0]) / kV
        for v, ref in zip(dU, (-0.2633, -0.2743, -0.4089, -0.2504, -0.1289)):
            self.assertAlmostEqual(v, ref, delta=2e-4)

    def test_droop_size_table9(self):
        """ΔP*₃ = +250 MW for three droops (Table IX, PSCAD): within 0.7 MW of the dynamic simulation's steady state (measured:
        at most 0.50 MW, at terminal 1 with ρ = 0.08)."""
        ref = {0.08: (-69.622, -63.474, 250.0, -55.644, -60.695), 0.04: (-73.979, -68.444, 250.0, -58.614, -48.442),
               0.02: (-78.213, -73.792, 250.0, -62.638, -34.873)}
        for rho, row in ref.items():
            g = hu_droop(self.base, rho=rho, P3=-500 * MW)
            r = g.flow(tol=1e-12)
            for b, p in zip('12345', row):
                self.assertAlmostEqual((r['converters'][b]['P'] - self.base['buses'][b]['P']) / MW, p, delta=0.7)

    def test_line_length_table10(self):
        """ΔP*₃ = +250 MW with the line 4–5 of 50 and 100 km (Table X): the further terminal 5, the less it takes (within 0.7 MW
        of PSCAD; measured: at most 0.63 MW, terminal 5 with 50 km)."""
        ref = {50: (-67.301, -63.002, 250.0, -50.776, -68.436), 100: (-69.437, -64.743, 250.0, -53.283, -62.037)}
        for l45, row in ref.items():
            b0 = hu_table4()
            b0.lines = [dict(ln, R=0.01 * (l45 if ln['name'] == '45' else ln['R'] / 0.01)) for ln in b0.lines]
            base = b0.flow(tol=1e-12)
            r = hu_droop(base, P3=-500 * MW, l45=l45).flow(tol=1e-12)
            for b, p in zip('12345', row):
                self.assertAlmostEqual((r['converters'][b]['P'] - base['buses'][b]['P']) / MW, p, delta=0.7)


class Closed(unittest.TestCase):
    def test_two_terminals(self):
        """A slack at U₁ and a load P₂ < 0: U₂ = (U₁ + √(U₁² + 4·R_loop·P₂))/2."""
        g = D.DCGrid()
        g.bus('a', 320 * kV)
        g.bus('b', 320 * kV)
        g.line('a', 'b', R=3.0)
        g.converter('a', 'V', V=1.02)
        g.converter('b', 'P', P=-700 * MW)
        r = g.flow(tol=1e-13)
        U1 = 1.02 * 320 * kV
        U2 = (U1 + math.sqrt(U1 ** 2 + 4 * 6.0 * (-700 * MW))) / 2
        self.assertAlmostEqual(r['buses']['b']['U'], U2, delta=1e-6)
        self.assertAlmostEqual(r['converters']['C1']['P'], 700 * MW + r['losses'], delta=1e-3)
        self.assertAlmostEqual(r['lines'][0]['loss'], 6.0 * r['lines'][0]['I'] ** 2, delta=1e-3)

    def test_monopole_ground_return(self):
        g = D.DCGrid()
        g.bus('a', 150 * kV)
        g.bus('b', 150 * kV)
        g.line('a', 'b', R=2.0, poles=1)
        g.converter('a', 'V')
        g.converter('b', 'P', P=-100 * MW)
        r = g.flow(tol=1e-13)
        I = r['lines'][0]['I']
        self.assertAlmostEqual(r['buses']['a']['U'] - r['buses']['b']['U'], 2.0 * I, delta=1e-6)

    def test_current_droop(self):
        """The current droop I = I₀ − g·(U − U₀) at every droop converter, and the equal sharing of equal gains on a grid of no
        resistance between them (Beerten & Belmans 2013, §II)."""
        g = D.DCGrid()
        for b in 'abc':
            g.bus(b, 640 * kV)
        g.line('a', 'b', R=1e-6)
        g.line('b', 'c', R=1e-6)
        g.converter('a', 'idroop', P=400 * MW, V=1.0, R=0.01, name='A')
        g.converter('b', 'idroop', P=400 * MW, V=1.0, R=0.01, name='B')
        g.converter('c', 'P', P=-1000 * MW, name='C')
        r = g.flow(tol=1e-12)
        for n in 'AB':
            c = r['converters'][n]
            U0 = 640 * kV
            self.assertAlmostEqual(c['I'], 400 * MW / U0 - 0.01 * (c['U'] - U0), delta=1e-6)
        self.assertAlmostEqual(r['converters']['A']['P'], r['converters']['B']['P'], delta=50.0)

    def test_errors(self):
        g = D.DCGrid()
        g.bus('a', 1e5)
        g.bus('b', 1e5)
        g.line('a', 'b', R=1.0)
        g.converter('a', 'P', P=1e6)
        with self.assertRaises(D.DCGridError):
            g.flow()
        with self.assertRaises(D.DCGridError):
            g.converter('b', 'droop')                    # a droop without its gain
        g.bus('c', 2e5)
        with self.assertRaises(D.DCGridError):
            g.line('a', 'c', R=1.0)                      # different U_n: not a line

    def test_outage(self):
        """The loss of a droop converter: the others take its power by their droops (the sum stays the losses)."""
        g = hu_droop(hu_table4().flow(tol=1e-12))
        g.remove('5')
        r = g.flow(tol=1e-12)
        self.assertTrue(r['converged'])
        self.assertAlmostEqual(sum(c['P'] for c in r['converters'].values()), r['losses'], delta=1e-3)


class Jovcic(unittest.TestCase):
    """Jovcic, High Voltage Direct Current Transmission, 2nd ed. (2019), Example 26.1 (§26.3, printed p. 394–395): the grid of
    Fig. 26.4 with constant-current terminals (linear), terminal 1 at 400 kV, 3 MΩ to ground at every bus, one conductor per
    line (the voltages and resistances of one pole); Tables 26.1–26.2 to their last digit (0.01 kV, 0.1 A)."""

    def test_example_26_1(self):
        g = D.DCGrid()
        for b in '12345':
            g.bus(b, 400 * kV, R=3e6)
        R = {('1', '2'): 5, ('1', '4'): 2, ('1', '5'): 2, ('2', '3'): 2, ('2', '5'): 2, ('3', '4'): 5, ('3', '5'): 2, ('4', '5'): 1.8}
        for (a, b), r in R.items():
            g.line(a, b, R=r, poles=1, name=a + b)
        g.converter('1', 'V', V=1.0, name='1')
        for b, i in (('2', -650.0), ('3', -1200.0), ('4', 900.0)):
            g.converter(b, 'I', I=i, name=b)
        r = g.flow(tol=1e-12)
        for b, u in zip('12345', (400.00, 398.09, 397.75, 399.90, 398.96)):
            self.assertAlmostEqual(r['buses'][b]['U'] / kV, u, delta=0.0065)       # the book's last digit (397.756 printed 397.75)
        self.assertAlmostEqual(r['converters']['1']['I'], 950.66, delta=0.006)
        I = {q['name']: q['I'] for q in r['lines']}
        for k, v in (('12', 381.8), ('14', 49.9), ('15', 518.7), ('23', 167.6), ('25', -435.9), ('34', -428.9), ('35', -603.6), ('45', 520.8)):
            self.assertAlmostEqual(I[k], v, delta=0.1)
        self.assertAlmostEqual(sum(c['P'] for c in r['converters'].values()), r['losses'], delta=1e-3)     # with the leakage


class FourTerminal(unittest.TestCase):
    def test_conductance_40(self):
        """Beerten & Belmans (2013), Table I and (40): the bus admittance matrix in pu (1200 MW, 320 kV pole to ground) of the
        ±320 kV symmetric monopole is 2·G·Z_b with our G for the voltages pole to pole and the loop of two conductors."""
        Zb = (320 * kV) ** 2 / (1200 * MW)
        g = D.DCGrid()
        for b in '1234':
            g.bus(b, 640 * kV)
        for (a, b), r in {('1', '2'): 0.0411, ('1', '3'): 0.0356, ('1', '4'): 0.0463, ('2', '4'): 0.0349, ('3', '4'): 0.0297}.items():
            g.line(a, b, R=r * Zb)
        Y = 2 * g.conductance()[1] * Zb
        ref = [[74.019, -24.331, -28.090, -21.598], [-24.331, 52.984, 0, -28.653], [-28.090, 0, 61.760, -33.670], [-21.598, -28.653, -33.670, 83.922]]
        self.assertLess(np.max(np.abs(Y - np.array(ref))), 1e-3)


# Beerten, Cole & Belmans (2012), Table I (pu on 100 MVA) and Tables II–III (the solved stations).
BCB = {'Rtr': 0.0015, 'Xtr': 0.1121, 'Rc': 0.0001, 'Xc': 0.16428}
BCB_LOSS = {'12': (1.103, 0.887, 2.885, 4.371), '3': (2.206, 0.887, 1.442, 2.185), '46': (1.103, 1.800, 5.94, 9.0), '57': (2.206, 1.800, 11.88, 18.0)}
BCB_ROWS = {   # converter: (group, kV, filter, P_s, Q_s, U_s, δ_s | P_c, Q_c, U_c, δ_c, P_loss, P_dc)
    1: ('12', 138, 0, 66.84, 0.00, 1.025, -8.93, 66.91, 11.75, 1.042, 1.04, 1.56, -68.47),
    2: ('12', 138, 0, 75.00, 5.86, 1.000, -4.88, 75.09, 21.50, 1.038, 6.63, 1.67, -76.76),
    3: ('3', 138, 0, -150.00, 0.00, 1.050, -0.08, -149.67, 56.40, 1.120, -20.73, 3.52, 146.16),
    4: ('46', 345, 1, 124.43, 0.00, 1.020, 0.00, 124.67, 31.36, 1.061, 18.41, 2.81, -127.49),
    5: ('57', 345, 1, -50.00, 0.00, 1.050, 10.11, -49.96, -3.46, 1.042, 2.90, 1.36, 48.60),
    6: ('46', 345, 1, -135.00, 0.00, 1.014, 10.25, -134.72, 39.26, 1.062, -9.89, 3.04, 131.67),
    7: ('57', 345, 1, 50.00, 0.00, 1.039, 14.60, 50.04, -3.14, 1.033, 21.96, 1.33, -51.37)}


class Station(unittest.TestCase):
    def st(self, grp, filt, swap_a=False):
        a, b, crec, cinv = BCB_LOSS[grp]
        if swap_a:
            a = {'46': 2.206, '57': 1.103}[grp]
        # the losses of the tables come out with c_rec while the station gives power to the AC grid and c_inv while it
        # takes (the other way from our names), and in grid 2 with the a of groups 4,6 and 5,7 the other way round
        return dict(BCB, Bf=0.0887 if filt else 0.0, a=a * MW, b=b * kV, crec=cinv, cinv=crec)

    def test_tables_2_3(self):
        for k, (grp, kv, filt, Ps, Qs, Us, ds, Pc, Qc, Uc, dc, Pl, Pdc) in BCB_ROWS.items():
            f = D.station(Us * cmath.exp(1j * math.radians(ds)), complex(Ps, Qs) / 100, self.st(grp, filt, swap_a=kv == 345), 100 * MW, kv * kV)
            self.assertAlmostEqual(f['Sc'].real * 100, Pc, delta=0.011, msg=k)
            self.assertAlmostEqual(f['Sc'].imag * 100, Qc, delta=0.011, msg=k)
            self.assertAlmostEqual(abs(f['Uc']), Uc, delta=6e-4, msg=k)
            self.assertAlmostEqual(math.degrees(cmath.phase(f['Uc'])), dc, delta=0.011, msg=k)
            self.assertAlmostEqual(f['loss'] / MW, Pl, delta=0.011, msg=k)
            self.assertAlmostEqual(f['Pdc'] / MW, Pdc, delta=0.025, msg=k)

    def test_inverse(self):
        st = self.st('46', 1)
        Us = 1.02 * cmath.exp(0.1j)
        for Pdc in (-150 * MW, -1 * MW, 80 * MW):
            ps, f = D.station_inverse(Us, 0.05, Pdc, st, 100 * MW, 345 * kV)
            self.assertAlmostEqual(f['Pdc'], Pdc, delta=1e-3)


def acdc_net(vac=False, losses=True):
    """Two AC systems of the engine joined by a three-terminal DC grid (values of an example): a 230 kV system with a slack
    feeder at A1 and a load at A2, a 230 kV system with a slack feeder at B1 and a load at B2; converters at A2 (P), B2 (DC
    slack) and B1 (droop)."""
    net = N.Network(name='AC/DC example')
    for b in ('A1', 'A2', 'B1', 'B2'):
        net.bus(b, 230e3)
    net.feeder('A1', Sk=5e9)
    net.feeder('B1', Sk=4e9)
    net.line('A1', 'A2', 0.03, 0.3, 120, B=4e-6)
    net.line('B1', 'B2', 0.03, 0.3, 90, B=4e-6)
    net.load('A2', 150e6, 40e6)
    net.load('B2', 300e6, 80e6)
    for b in ('d1', 'd2', 'd3'):
        net.dc_bus(b, 400e3)
    net.dc_line('d1', 'd2', r=0.0114, length=200)
    net.dc_line('d2', 'd3', r=0.0114, length=150)
    net.dc_line('d1', 'd3', r=0.0114, length=250)
    st = dict(Rtr=0.0015, Xtr=0.1121 / 4, Rc=0.0001, Xc=0.16428 / 4, Bf=0.0887 * 2, a_loss=2.2e6, b_loss=1.8e3, crec=6.0, cinv=9.0) if losses else {}
    net.vsc('A2', 'd1', 'P', P=200e6, Q=20e6, name='CA', **st)
    net.vsc('B2', 'd2', 'V', V=1.0, Vac=1.0 if vac else None, name='CB', **st)
    net.vsc('B1', 'd3', 'droop', P=-50e6, V=1.0, droop=0.05, Prated=400e6, name='CD', **st)
    return net


class ACDC(unittest.TestCase):
    def test_balance(self):
        net = acdc_net()
        r = net.acdc_flow(tol=1e-10)
        self.assertTrue(r['converged'])
        self.assertLessEqual(r['outer'], 6)
        C = r['converters']
        self.assertAlmostEqual(C['CA']['Pdc'], 200e6, delta=1.0)                    # the converter of given power gives it
        self.assertAlmostEqual(sum(c['Pdc'] for c in C.values()), r['dc']['losses'], delta=1.0)
        for c in C.values():                                                       # each station: P_dc = −P_c − loss
            self.assertAlmostEqual(c['Pdc'], -c['Pc'] - c['loss'], delta=1e-3)
        # the AC side took what the stations give: the injections of the converters at the buses of the AC result
        for n, c in C.items():
            self.assertTrue(c['Ps'] < c['Pc'] + 1e-6 if c['Pc'] > 0 else True)
        d = r['dc']['converters']['CD']                                            # the droop holds its law
        self.assertAlmostEqual(d['P'], -50e6 - 400e6 / (0.05 * 400e3) * (d['U'] - 400e3), delta=1.0)

    def test_lossless_is_dc_flow(self):
        net = acdc_net(losses=False)
        r = net.acdc_flow(tol=1e-10)
        for c in r['converters'].values():
            self.assertAlmostEqual(c['Ps'], -c['Pdc'], delta=1e-2)
        alone = net.dc_grid().flow(tol=1e-12)
        self.assertAlmostEqual(r['dc']['converters']['CB']['P'], alone['converters']['CB']['P'], delta=1.0)

    def test_vac_and_methods(self):
        net = acdc_net(vac=True)
        ref = net.acdc_flow(method='nr', tol=1e-10)
        self.assertAlmostEqual(ref['buses']['B2']['V'], 1.0, delta=1e-9)
        for m in ('nr_dense', 'fdxb', 'nr_ci'):
            r = acdc_net(vac=True).acdc_flow(method=m, tol=1e-10)
            for n in ref['converters']:
                self.assertAlmostEqual(r['converters'][n]['Ps'], ref['converters'][n]['Ps'], delta=1e-3 * MW, msg=m)

    def test_roundtrip_and_study(self):
        net = acdc_net()
        r1 = net.acdc_flow(tol=1e-10)
        net2 = N.from_dict(N.to_dict(acdc_net()))
        r2 = net2.acdc_flow(tol=1e-10)
        for n in r1['converters']:
            self.assertAlmostEqual(r1['converters'][n]['Ps'], r2['converters'][n]['Ps'], delta=1e-6)
        out = S.run({'network': N.to_dict(acdc_net()), 'study': 'acdc'})
        self.assertTrue(out['summary']['converged'])
        self.assertEqual(out['summary']['converters'], 3)

    def test_case_mtdc5(self):
        """The case of the five-terminal grid: the AC/DC load flow gives Table IV on its DC side, and with ΔP*₃ = −50 MW
        (the study option 'set') the steady state of Table VI; with the loss of terminal 5 the others take its power."""
        net = N.case_data('mtdc5')
        r = net.acdc_flow(tol=1e-10)
        import json
        sol = json.loads((N.DATA / 'mtdc5.json').read_text(encoding='utf-8'))['dc_solution']
        for b, (u, p) in sol.items():
            self.assertAlmostEqual(r['dc']['buses'][b]['U'] / kV, u, delta=1e-3)
            self.assertAlmostEqual(r['converters']['C' + b]['Pdc'] / MW, p, delta=0.01)
        out = S.run({'case': 'mtdc5', 'study': 'acdc', 'options': {'set': {'C3': -800e6}}})
        got = {q['bus']: q for q in out['summary']['dc']}
        for b, u, p in zip('12345', (399.287, 399.726, 396.204, 396.677, 385.118), (614.820, 549.651, -800.0, 561.746, -890.33)):
            self.assertAlmostEqual(got[b]['U_kV'], u, delta=1.5e-3)
            self.assertAlmostEqual(got[b]['P_MW'], p, delta=0.02)
        lost = S.run({'case': 'mtdc5', 'study': 'acdc', 'options': {'out': ['C5']}})['summary']
        self.assertTrue(lost['converged'])
        self.assertAlmostEqual(sum(q['P_MW'] for q in lost['dc']), lost['losses_dc_MW'], delta=1e-6)
        with self.assertRaises(S.StudyError):
            S.run({'case': 'mtdc5', 'study': 'acdc', 'options': {'set': {'Q1': 1.0}}})

    def test_vac_with_feeder_refused(self):
        net = acdc_net()
        net.vsc('A1', 'd3', 'P', P=0.0, Vac=1.0, name='bad')
        with self.assertRaises(N.NetworkError):
            net.acdc_flow()


ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class Tutorial(unittest.TestCase):
    """The tutorial mtdc5: for every combination of its options the EMT ends on the AC/DC load flow that its card asks of the
    engine (the voltages within 0.2 V, the powers within 2 kW), starts on Table IV, and its tasks say what both give."""

    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'mtdc_cases.js')], capture_output=True, text=True, timeout=600, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr)
        cls.js = json.loads(out.stdout)

    def test_every_option_ends_on_the_load_flow(self):
        runs = self.js['runs']
        self.assertEqual(len(runs), 12)
        for r in runs:
            st = r['study']
            self.assertEqual((st['net'], st['study'], set(st['options']) - set(S.OPTIONS['acdc'])), ('mtdc5', 'acdc', set()))
            q = {d['bus']: d for d in S.run({'case': st['net'], 'study': 'acdc', 'options': st['options']})['summary']['dc']}
            end = r['rows'][-1]
            for k in range(5):
                self.assertAlmostEqual(end['U'][k] / kV, q[str(k + 1)]['U_kV'], delta=2e-4, msg=(r['step'], r['rho'], k))
                self.assertAlmostEqual(end['P'][k], q[str(k + 1)]['P_MW'], delta=2e-3, msg=(r['step'], r['rho'], k))
            first = r['rows'][0]                                   # before the event: the load flow of Table IV
            for k, (u, p) in enumerate(zip((399.550, 400.000, 396.613, 396.928, 385.247), (600.0, 535.938, -750.0, 550.0, -900.0))):
                self.assertAlmostEqual(first['U'][k] / kV, u, delta=1e-3)
                self.assertAlmostEqual(first['P'][k], p, delta=0.02)
            self.assertEqual((r['warn'], r['keys']), ([], 10))

    def test_tasks(self):
        el = lambda x, d: f'{x:.{d}f}'.replace('.', ',')         # noqa: E731
        t = self.js['card']['tasks']
        run = lambda **o: {d['bus']: d for d in S.run({'case': 'mtdc5', 'study': 'acdc', 'options': o})['summary']['dc']}    # noqa: E731
        a = run(set={'C3': -800e6})
        self.assertIn(' / '.join(el(a[b]['U_kV'], 3) for b in '12345') + ' kV', t[0])
        self.assertIn(' / '.join(el(a[b]['P_MW'], 2) for b in '12345').replace('-', '−').replace('−800,00', '−800') + ' MW', t[0])
        self.assertIn(f'{el(a["5"]["P_MW"] + 900, 1)} MW αντί για 16,4 MW', t[1])
        b = run(set={'C3': -500e6, **{c: {'droop': 0.02} for c in ('C1', 'C2', 'C4', 'C5')}})
        self.assertIn(f'(−{el(-(b["5"]["P_MW"] + 900), 1)} MW)', t[2])
        c = run(out=['C5'])
        self.assertEqual(round(max(q['U_kV'] for q in c.values())), 405)
        self.assertEqual(self.js['card']['group'], 'Δίκτυα DC πολλών τερματικών (4.20)')


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class RobustStation(unittest.TestCase):
    """4.20 (decision 221 (a)): the robust current control of the MMC station in the modes V_dc and droop P/V_dc, on the link of
    hvdc_mmc (Model 4, tests/js/robust_cases.js): the station of V_dc holds it as the PI current control does, the droop station
    sits on its law P = P_ref + (V_ref − v_dc)/k_d, and the power of both swings less than 0.2 % of the rating."""

    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'robust_cases.js')], capture_output=True, text=True, timeout=900, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr)
        cls.js = json.loads(out.stdout)

    def test_vdc_mode(self):
        pi, rb = self.js['pi'], self.js['vdc']
        for w in range(2):
            self.assertAlmostEqual(rb['win'][w][2]['mean'], 1.0, delta=1e-4)                       # V_dc of the station 2
            self.assertLess(rb['win'][w][1]['max'] - rb['win'][w][1]['min'], 2e-3)                 # its power does not swing
            self.assertAlmostEqual(rb['win'][w][0]['mean'], pi['win'][w][0]['mean'], delta=1e-3)    # the station 1 gives its P
            self.assertAlmostEqual(rb['win'][w][1]['mean'], pi['win'][w][1]['mean'], delta=3e-3)    # the other station takes it (Q differs)
        self.assertEqual(rb['warn'], [])

    def test_droop_mode(self):
        d = self.js['droop']
        for w in range(2):
            P, v = d['win'][w][1]['mean'], d['win'][w][2]['mean']
            self.assertAlmostEqual(P, -1 + (1 - v) / 0.05, delta=5e-4)
            self.assertLess(d['win'][w][1]['max'] - d['win'][w][1]['min'], 2e-3)
        self.assertAlmostEqual(d['win'][1][2]['mean'], 0.975, delta=1e-3)                          # 0.5 pu less: V_dc 2.5 % lower

    def test_parameters_shown(self):
        """«Έλεγχος ρεύματος», α_c, T_ii: in the modes P, V_dc and droop, not in V/f and grid-forming."""
        self.assertEqual(self.js['parts']['show'], [[True] * 3] * 3 + [[False] * 3] * 2)


if __name__ == '__main__':
    unittest.main()


def jovcic_27(out=()):
    """Jovcic (2019), Examples 27.1–27.2: the four-terminal ±400 kV grid of Example 26.1 (one pole: R of Fig. 26.4, 3 MΩ to ground)."""
    g = D.DCGrid()
    for b in '12345':
        g.bus(b, 400 * kV, R=3e6)
    R = {('1', '2'): 5, ('1', '4'): 2, ('1', '5'): 2, ('2', '3'): 2, ('2', '5'): 2, ('3', '4'): 5, ('3', '5'): 2, ('4', '5'): 1.8}
    for (a, b), r in R.items():
        if a + b not in out:
            g.line(a, b, R=r, poles=1, name=a + b)
    return g


class Dispatcher(unittest.TestCase):
    """4.21: the DC grid dispatcher (Jovcic 2019, §27.6.2, Fig. 27.5) in steady state, and the power flow when the DC powers are
    regulated (§27.7, Examples 27.1, Tables 27.1–27.5, printed p. 406–409). The book's tables come from a time simulation whose
    dispatcher had not settled (the average of the four terminal voltages is 399.95, 398.88, 399.25, 400.05, 400.13 kV, not
    400): with the book's terminal powers (both poles: P/2 per pole here) the network gives its voltages around their average
    and its cable currents to their rounding, and the dispatcher puts the average at 400 kV with a correction under 0.2 MW."""

    TABLES = {   # table: (P of terminals 1–4 in MW, cables out, V of buses 1–5 in kV, cable currents in A)
        '27.1': ((761.6, -518.3, -956.4, 721.3), (), (401.0, 399.1, 398.8, 400.9, 399.9),
                 {'12': 381.5, '14': 49.7, '15': 518.2, '23': 167.6, '25': -435.5, '34': -428.6, '35': -603.1, '45': 520.5}),
        '27.2': ((930.6, -302.9, -737.0, 114.6), (), (399.9, 398.4, 397.9, 399.3, 398.9),
                 {'12': 314.1, '14': 329.6, '15': 519.6, '23': 199.3, '25': -265.6, '34': -261.9, '35': -464.9, '45': 211.1}),
        '27.3': ((0.0, -266.1, -700.1, 970.8), (), (399.6, 398.7, 398.5, 400.2, 399.3),
                 {'12': 173.8, '14': -326.7, '15': 152.8, '23': 121.8, '25': -281.8, '34': -353.2, '35': -403.6, '45': 532.8}),
        '27.4': ((761.5, -516.8, -955.4, 721.1), ('12',), (401.6, 398.7, 398.7, 401.2, 400.1),
                 {'14': 201.0, '15': 747.0, '23': 19.1, '25': -667.2, '34': -492.9, '35': -686.3, '45': 606.7}),
        '27.5': ((762.7, -514.8, -952.9, 721.4), ('12', '15'), (403.2, 398.0, 398.0, 401.3, 399.2),
                 {'14': 945.6, '23': -35.7, '25': -611.2, '34': -657.4, '35': -575.5, '45': 1186.8})}

    def test_tables_27_1_to_27_5(self):
        for tab, (P, out, V, I) in self.TABLES.items():
            g = jovcic_27(out)
            mem = []
            for b, p in zip('1234', P):
                if p:                                              # (Table 27.3: terminal 1 tripped)
                    g.converter(b, 'P', P=p * MW / 2, name=b)
                    mem.append(b)
            g.dispatcher(mem, V=1.0, weights=[1.0 if m == mem[-1] else 0.0 for m in mem], buses='1234', name='D')
            r = g.flow(tol=1e-12)
            self.assertTrue(r['converged'], tab)
            self.assertLessEqual(r['iterations'], 4, tab)
            U = [r['buses'][b]['U'] / kV for b in '12345']
            self.assertAlmostEqual(sum(U[:4]) / 4, 400.0, delta=1e-8, msg=tab)                 # the dispatcher: the average at 1 pu
            for u, v in zip(U, V):                                                             # around the average, to the rounding (0.1 kV)
                self.assertAlmostEqual(u - sum(U[:4]) / 4, v - sum(V[:4]) / 4, delta=0.1, msg=tab)
            Il = {q['name']: q['I'] for q in r['lines']}
            for k, v in I.items():                                                             # measured: at most 1.47 A (Table 27.2)
                self.assertAlmostEqual(Il[k], v, delta=1.6, msg=f'{tab} {k}')
            self.assertLess(abs(r['dispatchers']['D']['x']) * 2 / MW, 0.2, tab)               # the book's powers: balanced with the losses
            self.assertAlmostEqual(r['dispatchers']['D']['V'], 1.0, delta=1e-12, msg=tab)

    def test_shares_and_balance(self):
        """Unbalanced references (Example 27.1b: P4 = −100 MW): the dispatcher shares the unbalance in its weights and holds the
        average; the sum of the powers is the losses."""
        g = jovcic_27()
        for b, p in zip('1234', (760, -520, -960, -100)):
            g.converter(b, 'P', P=p * MW / 2, name=b)
        g.dispatcher('1234', V=1.0, weights=(1, 2, 1, 0), name='D')
        r = g.flow(tol=1e-12)
        c, x = r['converters'], r['dispatchers']['D']['x']
        self.assertTrue(r['converged'])
        for b, p, w in zip('1234', (760, -520, -960, -100), (0.25, 0.5, 0.25, 0.0)):
            self.assertAlmostEqual(c[b]['P'], p * MW / 2 + w * x, delta=1e-6)
        self.assertAlmostEqual(sum(q['P'] for q in c.values()), r['losses'], delta=1e-3)
        self.assertAlmostEqual(sum(r['buses'][b]['V'] for b in '1234') / 4, 1.0, delta=1e-12)
        self.assertAlmostEqual(x * 2 / MW, 820.0 + 2 * r['losses'] / MW, delta=1e-6)           # the 820 MW of unbalance and the losses

    def test_with_droops_and_an_outage(self):
        """Droop members (the 4.20.1 question for b4dcs2): the references move by x and the average holds; a member taken out
        leaves the dispatcher, and the others share its power."""
        g = jovcic_27()
        for b, p in zip('1234', (760, -520, -960, 720)):
            g.converter(b, 'droop', P=p * MW / 2, V=1.0, droop=0.05, Prated=600 * MW, name=b)
        g.dispatcher('1234', V=1.0, name='D')
        r = g.flow(tol=1e-12)
        self.assertAlmostEqual(sum(r['buses'][b]['V'] for b in '1234') / 4, 1.0, delta=1e-12)
        g.remove('1')
        self.assertEqual(g.dispatchers[0]['members'], ['2', '3', '4'])
        self.assertAlmostEqual(sum(g.dispatchers[0]['w']), 1.0, delta=1e-15)
        r = g.flow(tol=1e-12)
        self.assertTrue(r['converged'])
        self.assertAlmostEqual(sum(r['buses'][b]['V'] for b in '234') / 3, 1.0, delta=1e-12)
        self.assertAlmostEqual(sum(q['P'] for q in r['converters'].values()), r['losses'], delta=1e-3)

    def test_errors(self):
        g = jovcic_27()
        g.converter('1', 'V', V=1.0, name='1')
        g.converter('2', 'P', P=-100e6, name='2')
        g.dispatcher(['1'], name='D')
        with self.assertRaises(D.DCGridError):                     # a member that holds the voltage
            g.flow()
        with self.assertRaises(D.DCGridError):
            D.DCGrid().dispatcher([], name='E')
        with self.assertRaises(D.DCGridError):
            g.dispatcher(['2'], weights=(0,), name='F')


class DCDC(unittest.TestCase):
    """4.21: the DC/DC converter as one element (Jovcic 2019, §30.3.3, the averaged model of Fig. 30.7: U_a·I_a = U_b·I_b)."""

    def ex30_3(self, control='V'):
        """Example 30.3 (printed p. 470–471): a 370 kV grid (1 Ω) and a 400 kV grid (2 Ω), the converter holding 397 kV on the
        400 kV side: (400 − 397)/2 = 1.5 kA and 595.5 MW towards the 370 kV grid (the book: '600 MW')."""
        g = D.DCGrid()
        for b, u in (('S2', 400), ('B2', 400), ('B1', 370), ('S1', 370)):
            g.bus(b, u * kV)
        g.line('S2', 'B2', R=2, poles=1, name='c2')
        g.line('B1', 'S1', R=1, poles=1, name='c1')
        g.converter('S2', 'V', V=1.0, name='G2')
        g.converter('S1', 'V', V=1.0, name='G1')
        if control == 'V':
            g.dcdc('B1', 'B2', 'V', V=397 / 400, Prated=1800 * 400 * kV, name='DD')
        else:
            g.dcdc('B1', 'B2', 'P', P=-595.5 * MW, name='DD')
        return g

    def test_example_30_3(self):
        r = self.ex30_3().flow(tol=1e-12)
        d = r['dcdc']['DD']
        self.assertTrue(r['converged'])
        self.assertAlmostEqual(d['Ub'], 397e3, delta=1e-9)
        self.assertAlmostEqual(d['Ib'], -1500.0, delta=1e-9)                                  # into b: −1.5 kA, the power goes b → a
        self.assertAlmostEqual(d['P'], -595.5 * MW, delta=1e-3)
        Ia = (-370e3 + math.sqrt(370e3 ** 2 + 4 * 595.5e6)) / 2                                 # U_a·I_a = 595.5 MW, U_a = 370 kV + 1 Ω·I_a
        self.assertAlmostEqual(-d['Ia'], Ia, delta=1e-6)
        self.assertAlmostEqual(d['Ua'], 370e3 + Ia, delta=1e-6)
        self.assertAlmostEqual(d['loading'], 595.5 / 720, delta=1e-12)
        # with that power given ('P') the same state
        q = self.ex30_3('P').flow(tol=1e-12)['dcdc']['DD']
        self.assertAlmostEqual(q['Ub'], 397e3, delta=1e-4)
        # 'the voltage drop in grid 2 to 395 kV': the power reverses, (397 − 395)/2 = 1 kA into grid 2
        g = self.ex30_3()
        g.converters[0]['V'] = 395 / 400
        d = g.flow(tol=1e-12)['dcdc']['DD']
        self.assertAlmostEqual(d['Ib'], 1000.0, delta=1e-9)
        self.assertAlmostEqual(d['P'], 397 * MW, delta=1e-3)

    def test_droop_and_balance(self):
        g = D.DCGrid()
        g.bus('A', 640 * kV)
        g.bus('B', 400 * kV)
        g.bus('C', 400 * kV)
        g.line('B', 'C', R=2.0, name='BC')
        g.converter('A', 'V', V=1.0, name='GA')
        g.converter('C', 'P', P=-500 * MW, name='LC')
        g.dcdc('A', 'B', 'droop', P=400 * MW, V=1.0, droop=0.05, Prated=1000 * MW, name='DD')
        r = g.flow(tol=1e-12)
        d = r['dcdc']['DD']
        k = 1000 * MW / (0.05 * 400 * kV)
        self.assertTrue(r['converged'])
        self.assertAlmostEqual(d['P'], 400 * MW - k * (d['Ub'] - 400 * kV), delta=1e-3)       # its droop on the side b
        self.assertAlmostEqual(d['P'], 500 * MW + r['lines'][0]['loss'], delta=1e-3)          # the grid of B, C has only it
        self.assertAlmostEqual(r['converters']['GA']['P'], d['P'], delta=1e-3)                # lossless: A gives what B gets

    def test_same_numbers_as_two_converters(self):
        """The B4 of 4.20.1 had each DC/DC converter as two converters 'P'; as one element the DC load flow is the same bit
        for bit (the powers are added in the same order)."""
        g1, g2 = D.cigre_b4(), D.cigre_b4()
        for name, a, b, S, P in D.B4_DCDC:
            g2.remove(name)
            g2.converter(a, 'P', P=-P * 1e6, name=name + '/' + a)
            g2.converter(b, 'P', P=P * 1e6, name=name + '/' + b)
        r1, r2 = g1.flow(tol=1e-12), g2.flow(tol=1e-12)
        self.assertEqual([r1['buses'][b]['U'] for b in r1['buses']], [r2['buses'][b]['U'] for b in r2['buses']])
        self.assertEqual(r1['dcdc']['Cd-E1']['P'], 300e6)

    def test_network_and_study(self):
        net = N.Network(S_base=100e6, name='DC/DC')
        for b in ('A2', 'B2'):
            net.bus(b, 220e3)
        net.feeder('A2', Sk=5e9, name='QA')
        net.feeder('B2', Sk=5e9, name='QB')
        net.dc_bus('d1', 640e3)
        net.dc_bus('d2', 400e3)
        net.dc_bus('d3', 400e3)
        net.dc_line('d2', 'd3', R=2.0, name='L23')
        net.vsc('A2', 'd1', 'V', V=1.0, name='CA')
        net.vsc('B2', 'd3', 'P', P=-300e6, name='CB')
        net.dcdc('d1', 'd2', 'V', V=1.0, Prated=600e6, name='DD')
        r = net.acdc_flow(tol=1e-10)
        self.assertTrue(r['converged'])
        self.assertAlmostEqual(r['dc']['buses']['d2']['V'], 1.0, delta=1e-12)
        self.assertAlmostEqual(r['dc']['dcdc']['DD']['P'], 300e6 + r['dc']['lines'][0]['loss'], delta=1e-2)
        net2 = N.from_dict(N.to_dict(net))
        self.assertEqual(net2.element('DD'), net.element('DD'))
        out = S.run({'network': N.to_dict(net), 'study': 'acdc', 'options': {'set': {'DD': {'V': 0.99}}}})['summary']
        self.assertEqual(out['dcdc'][0]['control'], 'V')
        self.assertAlmostEqual(out['dcdc'][0]['Ub_kV'], 396.0, delta=1e-9)
        with self.assertRaises(S.StudyError):                       # without it the grid of d2, d3 holds no voltage
            S.run({'network': N.to_dict(net), 'study': 'acdc', 'options': {'out': ['DD']}})
        with self.assertRaises(S.StudyError):
            S.run({'network': N.to_dict(net), 'study': 'acdc', 'options': {'set': {'DD': {'control': 'I'}}}})
        with self.assertRaises(N.NetworkError):
            net.dcdc('d1', 'd1', name='X')
        with self.assertRaises(N.NetworkError):
            net.dcdc('d1', 'd2', 'droop', name='Y')


def limits_net(Q=0.0, P=150e6, vac=None, **lim):
    """Two AC buses of 220 kV, each with a strong feeder; a station that holds the DC voltage on A, one of given power on B, with
    only its reactor (X_c 0.15 pu on 100 MVA), so that the capability of Fig. 3 of Beerten, Cole & Belmans (2012) is a pair of
    circles in closed form: the current |S|/|U_s| ≤ I_max and the voltage |U_s + jX_c·conj(S/U_s)| ≤ U_c,max."""
    net = N.Network(S_base=100e6, name='limits')
    for b in ('A', 'B'):
        net.bus(b, 220e3)
        net.feeder(b, Sk=50e9, name='Q' + b)
    net.dc_bus('d1', 400e3)
    net.dc_bus('d2', 400e3)
    net.dc_line('d1', 'd2', R=1.0, name='L')
    net.vsc('A', 'd1', 'V', V=1.0, Xc=0.15, name='CA')
    net.vsc('B', 'd2', 'P', P=P, Q=Q, Vac=vac, Xc=0.15, name='CB', **lim)
    return net


class Limits(unittest.TestCase):
    """4.21: the limits of a station in the sequential AC/DC load flow (Beerten, Cole & Belmans 2012, §II-B and §III-C), against the
    closed forms of a station with its reactor alone."""

    def test_the_current_and_the_voltage_limit(self):
        X, Us = 0.15, 1.0
        Ib = 100e6 / (math.sqrt(3) * 220e3)
        r0 = limits_net(Q=80e6).acdc_flow(tol=1e-11)
        self.assertNotIn('limits', r0)                                                          # without the option: as before
        # the current: I_max 1.0 pu of the base (262.4 A); P_s = −1.5 pu would need 1.5 pu: P is reduced to the circle, Q to 0
        r = limits_net(Q=80e6, Imax=1.0 * Ib).acdc_flow(tol=1e-11, limits=True)
        c = r['converters']['CB']
        self.assertTrue(r['converged'])
        self.assertEqual((c['held'], r['limits']), ('P', ['CB']))
        self.assertAlmostEqual(c['Ic'], Ib, delta=1e-6 * Ib)
        # with room for P: I_max 2 pu, Q asked 1.6 pu, the circle gives Q_max = √(4 − 1.5²) (U_s = 1 within the feeder's drop)
        r = limits_net(Q=160e6, Imax=2.0 * Ib).acdc_flow(tol=1e-11, limits=True)
        c = r['converters']['CB']
        u = c['Us']
        self.assertEqual(c['held'], 'Q')
        self.assertAlmostEqual(c['Qs'] / 100e6, math.sqrt((2.0 * u) ** 2 - (c['Ps'] / 100e6) ** 2), delta=1e-7)
        self.assertAlmostEqual(c['Ic'], 2.0 * Ib, delta=1e-6 * Ib)
        self.assertAlmostEqual(c['Ps'], -150e6, delta=1.0)                                       # the priority to P
        # the voltage of the converter: U_c,max 1.1 pu, Q_max = −U_s²/X + √((U_s·U_c,max/X)² − P²)
        r = limits_net(Q=160e6, Ucmax=1.1).acdc_flow(tol=1e-11, limits=True)
        c = r['converters']['CB']
        u, p = c['Us'], c['Ps'] / 100e6
        self.assertAlmostEqual(c['Qs'] / 100e6, -u * u / X + math.sqrt((u * 1.1 / X) ** 2 - p * p), delta=1e-7)
        self.assertAlmostEqual(c['Uc'], 1.1, delta=1e-9)
        self.assertAlmostEqual(c['Qmax'], c['Qs'], delta=1e-3)
        # the lower voltage limit holds Q from below (U_c,min 0.95 pu, Q asked −1 pu)
        r = limits_net(Q=-100e6, Ucmin=0.95).acdc_flow(tol=1e-11, limits=True)
        self.assertAlmostEqual(r['converters']['CB']['Uc'], 0.95, delta=1e-9)

    def test_a_station_that_holds_its_ac_voltage(self):
        # Vac 1.05 pu against a strong feeder needs much Q: at the current limit it gives up the voltage and stays at Q_max
        Ib = 100e6 / (math.sqrt(3) * 220e3)
        net = limits_net(P=50e6, vac=1.05, Imax=1.2 * Ib)
        net.remove('QB')
        net.bus('C', 220e3)
        net.line('B', 'C', R=1.0, X=20.0, name='BC')
        net.feeder('C', Sk=5e9, name='QC')
        free = net.acdc_flow(tol=1e-11)
        self.assertAlmostEqual(free['buses']['B']['V'], 1.05, delta=1e-9)
        r = net.acdc_flow(tol=1e-11, limits=True, flat=True)
        c = r['converters']['CB']
        self.assertTrue(r['converged'])
        self.assertEqual(c['held'], 'V')
        self.assertLess(r['buses']['B']['V'], 1.05)                                             # at Q_max below its set voltage
        self.assertAlmostEqual(c['Ic'], 1.2 * Ib, delta=1e-5 * Ib)
        self.assertGreater(free['converters']['CB']['Ic'], 1.2 * Ib)
        # the limits are gone in the next run without them
        self.assertAlmostEqual(net.acdc_flow(tol=1e-11)['buses']['B']['V'], 1.05, delta=1e-9)

    def test_q_range_closed_form(self):
        st = {'Xc': 0.15}
        Ib = 100e6 / (math.sqrt(3) * 220e3)
        lo, hi = D.q_range(1.0 + 0j, 0.6, st, 100e6, 220e3, Imax=Ib)
        self.assertAlmostEqual(hi, math.sqrt(1 - 0.36), delta=1e-9)
        self.assertAlmostEqual(lo, -math.sqrt(1 - 0.36), delta=1e-9)
        self.assertIsNone(D.q_range(1.0 + 0j, 1.2, st, 100e6, 220e3, Imax=Ib))
        lo, hi = D.q_range(1.0 + 0j, 0.6, st, 100e6, 220e3, Ucmax=1.1, Ucmin=0.9)
        self.assertAlmostEqual(hi, -1 / 0.15 + math.sqrt((1.1 / 0.15) ** 2 - 0.36), delta=1e-9)
        self.assertAlmostEqual(lo, -1 / 0.15 + math.sqrt((0.9 / 0.15) ** 2 - 0.36), delta=1e-9)
