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
