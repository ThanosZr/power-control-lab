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
        self.assertEqual(len(g.converters), 11 + 4)

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
            loss = sum(ln['loss'] for ln in r['lines'] if ln['a'] in buses)
            self.assertAlmostEqual(P, loss, delta=1e-3)
        self.assertAlmostEqual(c['Cd-E1/Bb-E1']['P'], -300e6, delta=1e-3)
        self.assertAlmostEqual(c['Cd-E1/Bm-E1']['P'], 300e6, delta=1e-3)
        for name in ('Cm-A1', 'Cm-B3', 'Cb-A1'):
            self.assertAlmostEqual(r['buses'][c[name]['bus']]['V'], 1.0, delta=1e-12)
        self.assertGreater(c['Cb-A1']['P'], 2000e6)                          # it takes the losses of DCS3
        self.assertGreater(c['Cm-B3']['P'], -900e6)                          # DCS2 is short of 50 MW and its losses

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


if __name__ == '__main__':
    unittest.main()
