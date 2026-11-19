"""Insulation co-ordination (4.22, pcl.insulation, study 'insulation'): the worked example of IEC 60071-2:2023 Annex G.2
(a 245 kV station at 1000 m, Table G.1), the protective zones of IEC 60099-5:2018 Table 4, the earth fault factor
against its known limits, the standard levels of IEC 60071-1:2019 and the study with its report."""
import math
import unittest

from pcl import insulation as I
from pcl import study

US = 245
PU = math.sqrt(2) * US / math.sqrt(3)


class AnnexG2(unittest.TestCase):
    """The numbers of the example (kV) as the standard prints them, to its rounding (1 kV; K_cd read from Figure 7)."""

    def test_representative(self):
        self.assertAlmostEqual(1.5 * US / math.sqrt(3), 212, delta=0.5)
        self.assertAlmostEqual(I.truncation(3.0) * PU, 700, delta=0.5)
        self.assertAlmostEqual(I.truncation(4.5, 'pp') * PU, 1039, delta=0.5)
        self.assertAlmostEqual(I.truncation(1.9) * PU, 425, delta=0.5)
        self.assertAlmostEqual(I.truncation(2.9, 'pp') * PU, 639, delta=0.5)

    def test_coordination_factors(self):
        self.assertEqual(I.kcd(410 / 600), 1.10)
        self.assertEqual(I.kcd(820 / 900, 'pp'), 1.00)
        self.assertAlmostEqual(I.kcd(410 / 380), 1.03, delta=0.01)       # the standard reads 1,03 on its figure
        u, La = I.lightning_ucw(500, 4500, 2, 30, 300, 1 / 400, 1 / 100 / 1000)
        self.assertAlmostEqual(La, 250, delta=1e-9)
        self.assertAlmostEqual(u, 622, delta=1)
        self.assertAlmostEqual(I.lightning_ucw(500, 4500, 2, 60, 300, 1 / 400, 1e-5)[0], 745, delta=1)

    def test_altitude_and_required(self):
        self.assertAlmostEqual(I.m_si(451), 0.94, delta=0.005)
        self.assertEqual(I.m_si(820, 'pp'), 1.0)
        self.assertAlmostEqual(I.ka(1000, 0.5), 1.063, delta=5e-4)
        self.assertAlmostEqual(I.ka(1000, I.m_si(451)), 1.122, delta=1e-3)
        self.assertAlmostEqual(I.ka(1000, 1.0), 1.130, delta=1e-3)
        self.assertAlmostEqual(I.required(451, 'external', 1000, I.m_si(451)), 531, delta=1)
        self.assertAlmostEqual(I.required(820, 'external', 1000, 1.0), 973, delta=1)
        self.assertAlmostEqual(I.required(745, 'external', 1000, 1.0), 884, delta=1)
        self.assertAlmostEqual(I.required(622, 'liquid'), 715, delta=1)

    def test_conversion(self):
        for got, want in ((I.convert_range_I(531, 'external', 'pe'), (352, 690)), (I.convert_range_I(973, 'external', 'pp'), (658, 1127)),
                          (I.convert_range_I(497, 'external', 'pe'), (327, 646)), (I.convert_range_I(758, 'external', 'pp'), (500, 860)),
                          (I.convert_range_I(485, 'liquid'), (243, 534)), (I.convert_range_I(735, 'liquid'), (367, 808))):
            self.assertAlmostEqual(got[0], want[0], delta=1)
            self.assertAlmostEqual(got[1], want[1], delta=1)

    def test_whole_procedure(self):
        r = I.coordinate(US, H=1000, tov={'k': 1.5, 'lr': 1.4, 'polluted': True}, slow={'Ue2': 1.9, 'Up2': 2.9, 'Ups': 410},
                         fast={'Upl': 500, 'A': 4500, 'n': 2, 'Lsp': 300, 'Ra': 1 / 400, 'r': 1e-5, 'L': {'external': 60, 'liquid': 30}},
                         insulations=('external', 'liquid'))
        ext = r['insulation']['external']
        self.assertAlmostEqual(ext['required']['sd']['pe'], 237, delta=1)
        self.assertAlmostEqual(ext['required']['sd']['pp'], 383, delta=1)
        self.assertAlmostEqual(ext['required']['li']['pe'], 884, delta=1)
        self.assertEqual((ext['level']['sd'], ext['level']['li']), (395, 950))      # the level that the example selects
        liq = r['insulation']['liquid']
        self.assertAlmostEqual(liq['required']['sd']['pe'], 243, delta=1.5)   # 212 × 1,15 = 243,8: the standard writes 243
        self.assertAlmostEqual(liq['required']['li']['pe'], 715, delta=1.5)   # 622,7 × 1,15: the example rounds U_cw to 622 first
        self.assertTrue(liq['level']['covered'])


class Arresters(unittest.TestCase):
    def test_protective_zones_of_table_4(self):
        # IEC 60099-5:2018 Table 4, 420 kV: U_pl 800 kV, LIWV 1425 kV, span 400 m, A = 11 000 kV, R_a = 0,25 %/year
        z = lambda N, r: I.protective_zone(1425, 800, 11000, N, 400, 0.0025, r / 100 / 1000)
        self.assertAlmostEqual(z(1, 0.5), 36, delta=0.5)
        self.assertAlmostEqual(z(2, 0.5), 72, delta=0.5)
        self.assertAlmostEqual(z(2, 2), 42, delta=0.5)

    def test_rated_voltage(self):
        a = I.arrester(420, tov=[(1.4 * 420 / math.sqrt(3), 1.0)], T10=1.0)
        self.assertAlmostEqual(a['Uc'], 1.05 * 420 / math.sqrt(3), places=9)
        self.assertGreaterEqual(a['Ur'], a['Uc'] / 0.8)
        self.assertLess(a['tov'][0]['Ur'], 1.4 * 420 / math.sqrt(3))   # 1 s is shorter than 10 s: the arrester stands more


class Factors(unittest.TestCase):
    def test_earth_fault_factor(self):
        self.assertAlmostEqual(I.earth_fault_factor(0, 1e9, 0, 1)['k'], math.sqrt(3), places=6)   # isolated neutral
        self.assertAlmostEqual(I.earth_fault_factor(0, 1, 0, 1)['k'], 1.0, places=12)               # Z₀ = Z₁
        self.assertLessEqual(I.earth_fault_factor(1, 3, 0, 1)['k'], 1.4)   # X₀/X₁ = 3, R₀/X₁ = 1: still effectively earthed

    def test_standard_levels(self):
        self.assertEqual(I.select_level(420, {'si': 1000, 'li': 1350})['li'], 1425)
        self.assertEqual(I.select_level(420, {'si': 1000, 'li': 1350})['si'], 1050)
        self.assertEqual(I.select_level(123, {'sd': 200, 'li': 500})['li'], 550)
        self.assertFalse(I.select_level(245, {'sd': 500, 'li': 1100})['covered'])

    def test_statistical(self):
        # a higher withstand lowers the risk; the 10 % withstand for a risk of 10⁻³ lies above U_e2
        r1 = I.risk(2.5, 0.25, 3.0, 0.18)
        r2 = I.risk(2.5, 0.25, 3.3, 0.198)
        self.assertGreater(r1, r2)
        self.assertGreater(I.statistical_ucw(2.5, 0.25, 1e-3), 2.5)


class Study(unittest.TestCase):
    def test_run_and_report(self):
        q = {'study': 'insulation', 'options': {'Us': 420, 'H': 0, 'tov': {'k': 1.3, 'lr': 1.2}, 'slow': {'Ue2': 2.2, 'Up2': 3.4, 'Ups': 700},
                                                 'peaks': {'fast': 1100, 'vffo': 1200}, 'insulations': ['external', 'gis'],
                                                 'zone': {'Upl': 820, 'A': 11000, 'N': 2, 'Lsp': 400, 'Ra': 0.0025, 'r': 5e-6}}}
        r = study.run(q)
        self.assertEqual(r['study'], 'insulation')
        g = r['summary']['insulation']['gis']
        self.assertTrue(g['covered'])
        self.assertGreaterEqual(g['level']['li'], 1100 * 1.15)
        self.assertGreaterEqual(g['level']['li'], 1200 * 1.15)
        rep = study.report(q)
        self.assertTrue(rep['name'].endswith('.html'))
        self.assertIn('IEC 60071', rep['html'])
        self.assertIn('Ζώνη προστασίας', rep['html'])

    def test_k_from_the_network(self):
        r = study.run({'study': 'insulation', 'case': 'ieee9', 'options': {'Us': 245, 'tov': {'bus': '1'}, 'slow': {'Ue2': 2.0, 'Up2': 3.0}}})
        self.assertIsNotNone(r['summary']['k'])
        self.assertGreaterEqual(r['summary']['k'], 1.0)

    def test_errors(self):
        with self.assertRaises(study.StudyError):
            study.run({'study': 'insulation', 'options': {'Us': 5000}})


if __name__ == '__main__':
    unittest.main()
