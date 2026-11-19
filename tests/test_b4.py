"""4.20.1 (ROADMAP §83): the start of VSC2 with DC pins from a load flow (decision 221 (b)) and the steady start of a circuit
with DC sources and capacitors. Closed forms of the phasors (with the reactance (2/h)·tan(ωh/2)·L that the trapezoidal rule
sees) and of the DC circuit; the rest is ours."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class StationStart(unittest.TestCase):
    """Two VSC2 with DC pins on one 325 V grid, each with its capacitor at v_dc,0 = 800 V and a floating DC source through
    0.5 Ω set for the steady state of its phasors; the modulation open loop one step ahead (tests/js/vsc_start_cases.js)."""

    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'vsc_start_cases.js')], capture_output=True, text=True, timeout=600, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr)
        cls.js = json.loads(out.stdout)

    def test_the_dc_side_starts_with_the_power_of_the_phasors(self):
        # the DC part of the start: the current of the DC side is P/v_dc,0 of its own group of sources (inverter and rectifier)
        for u in ('VS1', 'VS2'):
            r = self.js['lf']['units'][u]
            self.assertAlmostEqual(-r['idc0'] / r['I0'], 1.0, delta=1e-9)
            self.assertAlmostEqual(r['ia_first'], r['ia0'], delta=1e-6 * r['Ipk'])          # the AC current of the phasors (GMIN: 4e-9)
        self.assertGreater(self.js['lf']['units']['VS1']['P'], 0)
        self.assertLess(self.js['lf']['units']['VS2']['P'], 0)
        self.assertEqual(self.js['lf']['warn'], [])

    def test_it_stays_where_it_starts(self):
        Vd0 = self.js['Vd0']
        for u in ('VS1', 'VS2'):
            r = self.js['lf']['units'][u]
            self.assertLess(max(abs(r['vdc']['max'] - Vd0), abs(r['vdc']['min'] - Vd0)), 0.1)     # 1.25e-4 of v_dc over three cycles
            self.assertLess(r['idc']['max'] - r['idc']['min'], 0.01 * abs(r['I0']))
            for pk in r['ia_peak']:
                self.assertAlmostEqual(pk / r['Ipk'], 1.0, delta=1e-3)
            z = self.js['zero']['units'][u]                                                      # from zero: a transient
            self.assertGreater(z['vdc']['max'] - z['vdc']['min'], 50)
            self.assertGreater(z['ia_peak'][0], 3 * z['Ipk'])

    def test_a_signal_reaches_its_source_one_step_later(self):
        # the same modulation without the step ahead: the start is the same, the steady state of the open loop is not
        for u in ('VS1', 'VS2'):
            a, b = self.js['lf']['units'][u], self.js['lf_nolead']['units'][u]
            self.assertAlmostEqual(b['idc0'], a['idc0'], delta=1e-12 * abs(a['I0']))
            self.assertGreater(abs(b['ia_peak'][2] / b['Ipk'] - 1), 0.05)

    def test_a_dc_current_source_and_a_capacitor_in_the_start(self):
        # 2 A out of the pin p of a source into 5 Ω ∥ 1 mF, beside an AC circuit, started from phasors: 10 V from t = 0 (before
        # 4.20.1 the start had −10 V, the current into the pin n, and the capacitor empty beside its nodes)
        r = self.js['isrc']
        self.assertAlmostEqual(r['v0'], 10.0, delta=1e-6)
        self.assertAlmostEqual(r['min'], 10.0, delta=1e-6)
        self.assertAlmostEqual(r['max'], 10.0, delta=1e-6)


class Cable320(unittest.TestCase):
    """The 320 kV XLPE cable of the four-terminal test system (Leterme et al. 2015, Table 2) from its geometry: the paper gives
    Z_c = 33.73 Ω and 183.5 km/ms; they are its core mode at high frequency with the semiconducting screens in the insulation
    (ε′ = ε·ln(R_o/R_i)/ln(b/a), Martinez-Velasco (ed.) 2010, eq. 3.49). Without the screens: 36.3 Ω and 197 km/ms."""

    @staticmethod
    def wave(data, f):
        import cmath
        import math
        from pcl import lineconst as lc
        Z, Y = lc.phase_matrices(data, f=f)
        z, y = complex(Z[0, 0]), complex(Y[0, 0])
        return abs(cmath.sqrt(z / y)), 2 * math.pi * f / cmath.sqrt(z * y).imag / 1e6      # Ω, km/ms

    def test_the_published_surge_impedance_and_velocity(self):
        from pcl import lineconst as lc
        data = lc.TYPICAL['320kV-xlpe']
        zc, v = self.wave(data, 1e6)
        self.assertAlmostEqual(zc, 33.73, delta=0.005)
        self.assertAlmostEqual(v, 183.5, delta=0.05)
        zc4, v4 = self.wave(data, 1e4)                    # lower in frequency: the internal impedance of core and sheath
        self.assertGreater(zc4, zc)
        self.assertLess(v4, v)
        deep = json.loads(json.dumps(data))
        deep['cables'][0]['y'] = 2.0
        self.assertAlmostEqual(self.wave(deep, 1e4)[0], zc4, delta=1e-6)    # the depth (not given) does not matter

    def test_without_the_screens(self):
        from pcl import lineconst as lc
        data = json.loads(json.dumps(lc.TYPICAL['320kV-xlpe']))
        lay = [L for L in data['cables'][0]['layers'] if L['t'] != 's']
        lay[1]['rout'] = 0.0487                                             # the insulation to the sheath, ε 2.3 as printed
        data['cables'][0]['layers'] = lay
        zc, v = self.wave(data, 1e6)
        self.assertAlmostEqual(zc, 36.27, delta=0.01)
        self.assertAlmostEqual(v, 197.2, delta=0.1)


B4_FIG = {   # Jovcic (2019): the DC voltages (pu) and the DC power flows (MW, sending → receiving) printed in Fig. 27.6 and 27.7
    # (the arrows at the converters are their AC side and are not here; 600 is the DC/DC converter Cd-B1 at the end of its cable)
    '27.6': {'V': {'Bm-A1': 1.0000, 'Bm-C1': 1.0092, 'Bb-A1': 1.0069, 'Bb-C2': 1.0109, 'Bb-D1': 1.0116, 'Bb-E1': 1.0062,
                   'Bb-B1s': 1.0027, 'Bb-B1': 0.9949, 'Bb-B4': 0.9894, 'Bb-B2': 0.9801, 'Bm-B2': 0.9916, 'Bm-B3': 0.9882,
                   'Bm-B5': 0.9997, 'Bm-F1': 1.0079, 'Bm-E1': 1.0126},
             'P': [('Bm-C1', 'Bm-A1', 386), ('Bb-C2', 'Bb-A1', 672), ('Bb-D1', 'Bb-C2', 78), ('Bb-D1', 'Bb-E1', 910),
                   ('Bb-E1', 'Bb-B1s', 603), ('Bb-E1', 'Bb-B1s', 600), ('Bb-A1', 'Bb-B1', 1686), ('Bb-A1', 'Bb-B4', 975),
                   ('Bb-B1', 'Bb-B4', 762), ('Bb-B4', 'Bb-B2', 1718), ('Bm-B2', 'Bm-B3', 142),
                   ('Bm-B5', 'Bm-B3', 683), ('Bm-F1', 'Bm-B5', 690), ('Bm-E1', 'Bm-F1', 198)]},
    '27.7': {'V': {'Bm-A1': 1.0000, 'Bm-C1': 1.0092, 'Bb-A1': 1.0005, 'Bb-C2': 1.0060, 'Bb-D1': 1.0089, 'Bb-E1': 1.0050,
                   'Bb-B1s': 1.0014, 'Bb-B1': 0.9969, 'Bb-B4': 0.9936, 'Bb-B2': 0.9890, 'Bm-B2': 0.9981, 'Bm-B3': 0.9924,
                   'Bm-B5': 0.9999, 'Bm-F1': 1.0053, 'Bm-E1': 1.0042},
             'P': [('Bm-C1', 'Bm-A1', 386), ('Bb-C2', 'Bb-A1', 920), ('Bb-D1', 'Bb-C2', 328), ('Bb-D1', 'Bb-E1', 661),
                   ('Bb-E1', 'Bb-B1s', 603), ('Bb-E1', 'Bb-B1s', 600), ('Bb-A1', 'Bb-B1', 512), ('Bb-A1', 'Bb-B4', 389),
                   ('Bb-B1', 'Bb-B4', 463), ('Bb-B4', 'Bb-B2', 848), ('Bm-B2', 'Bm-B3', 234),
                   ('Bm-B5', 'Bm-B3', 444), ('Bm-F1', 'Bm-B5', 447), ('Bm-F1', 'Bm-E1', 47)]}}


def b4_link(a, b):
    """The loop resistance (Ω, the circuits in parallel) of the B4 link between the buses a and b."""
    from pcl import dcgrid as D
    for x, y, km, kind, n in D.B4_LINES:
        if {x, y} == {a, b}:
            return 2 * D.b4_line_data(x, km, kind)[0] / n
    raise KeyError((a, b))


class B4Grid(unittest.TestCase):
    """The CIGRE B4 DC grid test system as the book of Jovcic (2019, §27.8) gives it (pcl.dcgrid.cigre_b4): the topology and the
    lengths of Fig. 27.6, the per-km data of Table 7.3, the power references of Table 27.11."""

    def test_the_lines_carry_the_printed_flows(self):
        # with the DC voltages printed in each figure, every printed flow lies between the powers at the two ends of its link
        # (the losses) within the rounding of the voltages (1e-4 pu of both) and of the flow (1 MW): topology, double lines, R
        from pcl import dcgrid as D
        worst = 0.0
        for fig, d in B4_FIG.items():
            for a, b, P in d['P']:
                Un = D.B4_UN[D.B4_BUSES[a]]
                Ua, Ub, R = d['V'][a] * Un, d['V'][b] * Un, b4_link(a, b)
                I = (Ua - Ub) / R
                Pa, Pb, tol = Ua * I / 1e6, Ub * I / 1e6, (Ua * 1e-4 * Un / R) / 1e6 + 1.0
                lo, hi = min(Pa, Pb), max(Pa, Pb)
                miss = max(lo - P, P - hi, 0.0)
                worst = max(worst, miss / tol)
                self.assertLessEqual(miss, tol, f'Fig. {fig}: {a} → {b} {P} MW, from the voltages {Pa:.1f} … {Pb:.1f} MW')
        self.assertLess(worst, 0.85)                                          # measured 0.81 (Fig. 27.7, F1 → B5)

    def test_table_7_3(self):
        from pcl import dcgrid as D
        self.assertEqual(D.b4_line_data('Bb-A1', 100, 'ohl')[0], 0.0114 * 100)
        self.assertEqual(D.b4_line_data('Bm-B3', 100, 'ohl')[0], 0.0133 * 100)
        self.assertAlmostEqual(D.b4_line_data('Bm-A1', 200, 'cable')[2], 0.2104e-6 * 200, delta=1e-18)
        g = D.cigre_b4()
        self.assertEqual(len(g.buses), 15)
        self.assertEqual(len(g.lines), 15)                                   # 13 links, two of them double
        self.assertEqual(len(g.converters), 11)
        self.assertEqual([d['name'] for d in g.dcdcs], ['Cd-E1', 'Cd-B1'])                 # 4.21: one element each, not two converters

    def test_the_load_flow_of_the_references(self):
        # Table 27.11: every converter on its reference, Cm-A1, Cm-B3 and Cb-A1 holding 1 pu; the DC/DC converters move their
        # power; the three grids balance with their losses
        from pcl import dcgrid as D
        g = D.cigre_b4()
        r = g.flow(tol=1e-12)
        self.assertTrue(r['converged'])
        c = r['converters']
        for grid in ('DCS1', 'DCS2', 'DCS3'):
            buses = {b for b, x in D.B4_BUSES.items() if x == grid}
            P = sum(q['P'] for q in c.values() if q['bus'] in buses)
            P += sum(d['P'] * ((d['b'] in buses) - (d['a'] in buses)) for d in r['dcdc'].values())   # 4.21: what the DC/DC converters move
            loss = sum(ln['loss'] for ln in r['lines'] if ln['a'] in buses)
            self.assertAlmostEqual(P, loss, delta=1e-3)
        self.assertAlmostEqual(r['dcdc']['Cd-E1']['P'], 300e6, delta=1e-3)
        self.assertEqual((r['dcdc']['Cd-E1']['a'], r['dcdc']['Cd-E1']['b']), ('Bb-E1', 'Bm-E1'))
        for name in ('Cm-A1', 'Cm-B3', 'Cb-A1'):
            self.assertAlmostEqual(r['buses'][c[name]['bus']]['V'], 1.0, delta=1e-12)
        self.assertGreater(c['Cb-A1']['P'], 2000e6)                          # it takes the losses of DCS3
        self.assertGreater(c['Cm-B3']['P'], -900e6)                          # DCS2 is short of 50 MW and its losses

    def test_the_study_sets_a_law(self):
        # 4.20.1: the option set of the study acdc also changes the law of a station (control), as the tutorial b4dcs2 needs
        from pcl import study as S
        r = S.run({'case': 'b4', 'study': 'acdc', 'options': {'set': {'Cm-B3': {'control': 'droop', 'droop': 0.05, 'P': -900e6}}}})['summary']
        st = {x['name']: x for x in r['stations']}
        self.assertEqual(st['Cm-B3']['control'], 'droop')
        with self.assertRaises(S.StudyError):
            S.run({'case': 'b4', 'study': 'acdc', 'options': {'set': {'Cm-B3': {'control': 'X'}}}})

    def test_an_outage(self):
        from pcl import dcgrid as D
        g = D.cigre_b4(out=('Cb-A1',), hold={'DCS3': ('Cb-B1', 1.0)})
        r = g.flow(tol=1e-12)
        self.assertTrue(r['converged'])
        self.assertNotIn('Cb-A1', r['converters'])
        # without the dispatcher of the book the station that holds the voltage gives the 2 GW that Cb-A1 gave: from −1500 MW
        # to +540 MW (the losses fall with the flows)
        self.assertGreater(r['converters']['Cb-B1']['P'], 500e6)
        self.assertLess(r['converters']['Cb-B1']['P'], 600e6)


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class B4Tutorial(unittest.TestCase):
    """The tutorial b4dcs2 (DCS2 of the B4 in EMT, four MMC stations of Model 4 with their AC side, Cd-E1 as a DC current source;
    tests/js/b4_cases.js) against the AC/DC load flow of the case b4 that its card runs, before the event (0.90–0.95 s) and at
    the end (1.95–2.0 s)."""

    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'b4_cases.js')], capture_output=True, text=True, timeout=1500, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr)
        cls.js = json.loads(out.stdout)

    @staticmethod
    def lf(options):
        from pcl import study as S
        q = S.run({'case': 'b4', 'study': 'acdc', 'options': options})['summary']
        return ({x['bus'][3:]: x['U_kV'] * 1e3 for x in q['dc'] if x['bus'].startswith('Bm-')},
                {x['name']: x['Pdc_MW'] for x in q['stations']})

    def test_the_lines_start_on_the_load_flow(self):
        from pcl import dcgrid as D
        r = D.cigre_b4().flow(tol=1e-12)
        st = self.js['runs'][0]['start']
        for k, U in st['U'].items():
            self.assertAlmostEqual(U, r['buses']['Bm-' + k]['U'], delta=1e-4)          # ten significant digits
        I = {ln['name']: ln['I'] for ln in r['lines']}
        self.assertEqual(len(st['I']), 4)
        for q in st['I']:                                                     # from the pin a of the element to its pin b
            a, b = 'Bm-' + q['from'], 'Bm-' + q['to']
            self.assertAlmostEqual(q['i0'], I[f'{a}–{b}'] if f'{a}–{b}' in I else -I[f'{b}–{a}'], delta=1e-6)

    def test_the_card_case_is_the_dc_grid(self):
        # the case b4 of the engine (pcl/data/b4.json) is pcl.dcgrid.b4_network(), and its AC/DC load flow that of cigre_b4()
        from pcl import dcgrid as D
        from pcl import network as N
        self.assertEqual(N.to_dict(N.case_data('b4')), N.to_dict(D.b4_network()))
        U, _ = self.lf({})
        r = D.cigre_b4().flow(tol=1e-12)
        for k, u in U.items():
            self.assertAlmostEqual(u, r['buses']['Bm-' + k]['U'], delta=1e-3)

    def test_the_emt_ends_on_the_load_flow(self):
        # the DC voltages within 0.07 kV (1.75e-4 pu; measured 0.058); the DC powers of the stations within the losses of the
        # stations, which the load flow of the B4 has not (1 MW; with the droop on the AC side 2 MW; the offshore load is a
        # constant impedance behind its transformer, 3 MW after its step)
        for r in self.js['runs']:
            self.assertEqual(r['warn'], [])
            sets = r['study']['options'].get('set', {})
            before = {k: v for k, v in sets.items() if k.startswith('Cm-B')}
            for w, opt in zip(r['win'], ({'set': before} if before else {}, r['study']['options'])):
                U, P = self.lf(opt)
                for k, u in w['U'].items():
                    self.assertAlmostEqual(u, U[k], delta=70, msg=f"{r['ev']} {r['ctl']} U {k}")
                tol = 3.0 if r['ev'] == 'load' and w is r['win'][1] else 2.0 if r['ctl'] == 'droop' else 1.0
                for k in ('B2', 'B3', 'F1', 'E1'):
                    self.assertAlmostEqual(w['P'][k], P['Cm-' + k], delta=tol, msg=f"{r['ev']} {r['ctl']} P {k}")

    def test_the_emt_network_is_the_b4(self):
        # with the DC powers of the EMT itself and the voltage of Cm-B3, the DC load flow of DCS2 gives the EMT voltages within
        # 0.02 kV and the power of Cm-B3 within 0.05 MW: the lines of the EMT are the data of the B4
        from pcl import dcgrid as D
        for r in self.js['runs']:
            for w in r['win']:
                g = D.DCGrid()
                for b in ('B2', 'B3', 'B5', 'F1', 'E1'):
                    g.bus('Bm-' + b, 400e3)
                for a, b, km, kind, n in D.B4_LINES:
                    if a in g.buses and b in g.buses:
                        g.line(a, b, R=D.b4_line_data(a, km, kind)[0], poles=2)
                g.converter('Bm-B3', 'V', V=w['U']['B3'] / 400e3, name='B3')
                for k in ('B2', 'F1', 'E1'):
                    g.converter('Bm-' + k, 'P', P=w['P'][k] * 1e6)
                g.converter('Bm-E1', 'P', P=w['P']['CD'] * 1e6)
                q = g.flow(tol=1e-12)
                for k in ('B2', 'B5', 'F1', 'E1'):
                    self.assertAlmostEqual(q['buses']['Bm-' + k]['U'], w['U'][k], delta=20)
                self.assertAlmostEqual(q['converters']['B3']['P'] / 1e6, w['P']['B3'], delta=0.05)

    def test_who_takes_the_event(self):
        runs = {(r['ev'], r['ctl']): r for r in self.js['runs']}
        v = runs[('cd55', 'vdc')]['win']
        self.assertAlmostEqual(v[1]['P']['CD'] - v[0]['P']['CD'], -245, delta=0.1)
        self.assertAlmostEqual(v[1]['P']['B2'], v[0]['P']['B2'], delta=0.5)            # Cm-B2 keeps its 150 MW
        self.assertGreater(v[1]['P']['B3'] - v[0]['P']['B3'], 230)                    # Cm-B3 takes the rest
        # with the droops not as the ratings (2:3) but as the load flow: the voltage of B3 falls more than that of B2 (77 and
        # 160 MW in the load flow; the voltage drops of the lines change the sharing, as in mtdc5)
        d = runs[('cd55', 'droop')]['win']
        dB2, dB3 = d[1]['P']['B2'] - d[0]['P']['B2'], d[1]['P']['B3'] - d[0]['P']['B3']
        o = runs[('cd55', 'droop')]['study']['options']
        P0, P1 = self.lf({'set': {k: v for k, v in o['set'].items() if k.startswith('Cm-B')}})[1], self.lf(o)[1]
        lB2, lB3 = P1['Cm-B2'] - P0['Cm-B2'], P1['Cm-B3'] - P0['Cm-B3']
        self.assertAlmostEqual(dB2 / dB3, lB2 / lB3, delta=0.02)
        self.assertLess(dB2 / dB3, 0.55)
        self.assertAlmostEqual(dB2 + dB3, lB2 + lB3, delta=3)


if __name__ == '__main__':
    unittest.main()
