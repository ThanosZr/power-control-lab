"""The rated TRV of IEC 62271-100:2021 (pcl.trv, 4.9): the rules of 7.105.5 against values of the tables (reference
values: Tables 16–21, 22–24, 27, 30, rounded to three digits in the standard), the short-line fault of Annex A against its
worked example (A.4.2, A.4.3: 245 kV, 50 kA, 50 Hz), the ITRV of Table 9, the pole multipliers of Table 14, and the
envelope of Annex D on curves of known shape."""
import math
import unittest

from pcl import trv as T


def kv(x):
    return x / 1e3


def us(x):
    return x * 1e6


class Rated(unittest.TestCase):
    def check(self, r, ref, tol=0.012):
        for k, v in ref.items():
            got = {'uc': kv(r['uc']), 't3': us(r.get('t3', 0)), 'td': us(r['td']), 'u1': kv(r.get('u1', 0)),
                   't1': us(r.get('t1', 0)), 't2': us(r.get('t2', 0)), 'ud': kv(r['ud']), 'tdp': us(r['tdp']),
                   'rrrv': r['rrrv'] * 1e-9, 'kaf': r['kaf'], 'kpp': r['kpp']}[k]
            self.assertLessEqual(abs(got - v), tol * abs(v) + 1e-9, f'{r["Ur"]} {r["duty"]} {k}: {got} vs {v}')

    def test_class_s1_below_100kv(self):
        # Table 16 (k_pp 1,5) and Table 17 (k_pp 1,3)
        self.check(T.rated(3.6e3, 'T100', 1.5, 'S1'), {'uc': 6.17, 't3': 40.7, 'td': 6.10, 'ud': 2.06, 'rrrv': 0.152})   # t′ 19,1 in the table, t_d + t_3/3 = 19,7
        self.check(T.rated(12e3, 'T100', 1.5, 'S1'), {'uc': 20.6, 't3': 61.2, 'td': 9.18, 'ud': 6.86, 'tdp': 29.6, 'rrrv': 0.336})
        self.check(T.rated(12e3, 'T60', 1.5, 'S1'), {'uc': 22.1, 't3': 26.9, 'td': 4.04, 'ud': 7.35, 'tdp': 13.0, 'rrrv': 0.819})
        self.check(T.rated(72.5e3, 'T10', 1.5, 'S1'), {'uc': 151, 't3': 36.2, 'td': 5.43, 'ud': 50.3, 'tdp': 17.5, 'rrrv': 4.17})
        self.check(T.rated(3.6e3, 'T100', 1.3, 'S1'), {'uc': 5.35, 't3': 35.3, 'td': 5.29, 'ud': 1.78, 'tdp': 17.0, 'rrrv': 0.152})
        self.check(T.rated(24e3, 'T30', 1.3, 'S1'), {'uc': 40.8, 't3': 16.4, 'td': 2.46, 'rrrv': 2.48})
        r = T.rated(12e3, 'T10', 1.3, 'S1')                     # T10 at k_pp 1,5 also for a breaker rated 1,3
        self.assertEqual(r['kpp'], 1.5)
        self.check(r, {'uc': 25.0, 't3': 13.5, 'td': 2.02})

    def test_class_s2_below_100kv(self):
        # Table 18 (k_pp 1,5) and Table 19 (k_pp 1,3); T100: t_d = 0,05·t_3, up to 0,15·t_3
        r = T.rated(12e3, 'T100', 1.5, 'S2')
        self.check(r, {'uc': 22.6, 't3': 26.5, 'td': 1.32, 'ud': 7.54, 'tdp': 10.2, 'rrrv': 0.855})
        self.assertAlmostEqual(us(r['td_max']), 3.97, delta=0.02)
        self.check(T.rated(36e3, 'T60', 1.5, 'S2'), {'uc': 72.8, 't3': 38.3, 'td': 5.74, 'rrrv': 1.90})
        self.check(T.rated(12e3, 'T100', 1.3, 'S2'), {'uc': 19.6, 't3': 23.0, 'td': 1.15, 'rrrv': 0.855})
        self.check(T.rated(72.5e3, 'T30', 1.3, 'S2'), {'uc': 134, 't3': 32.3, 'td': 4.85, 'rrrv': 4.14})

    def test_out_of_phase_below_100kv(self):
        # Tables 22 (S1, 2,5), 23 (S1, 2,0), 24 (S2, 2,5)
        self.check(T.rated(3.6e3, 'OP', 2.5, 'S1'), {'uc': 9.19, 't3': 81.4, 'td': 12.2, 'rrrv': 0.113})
        self.check(T.rated(36e3, 'OP', 2.0, 'S1'), {'uc': 73.5, 't3': 171, 'td': 25.7, 'rrrv': 0.429})
        self.check(T.rated(12e3, 'OP', 2.5, 'S2'), {'uc': 30.6, 't3': 53.0, 'td': 7.94, 'rrrv': 0.578})

    def test_100_to_800kv(self):
        # Table 20 (k_pp 1,3) and Table 21 (k_pp 1,5)
        self.check(T.rated(145e3, 'T100'), {'u1': 115, 't1': 58, 'uc': 215, 't2': 232, 'td': 2, 'ud': 58, 'tdp': 31, 'kpp': 1.3})
        self.check(T.rated(145e3, 'T60'), {'u1': 115, 't1': 38, 'uc': 231, 'td': 2, 'ud': 58}, tol=0.015)
        self.check(T.rated(145e3, 'T30'), {'uc': 237, 't3': 47, 'td': 7, 'ud': 79, 'tdp': 23}, tol=0.03)
        self.check(T.rated(245e3, 'T10'), {'uc': 459, 't3': 66, 'td': 10, 'ud': 153, 'tdp': 32}, tol=0.02)
        self.check(T.rated(420e3, 'T100'), {'u1': 334, 't1': 167, 'uc': 624, 't2': 668})
        self.check(T.rated(170e3, 'T100', 1.5), {'u1': 156, 't1': 78, 'uc': 291, 't2': 312})
        self.check(T.rated(123e3, 'T10', 1.5), {'uc': 230, 't3': 33, 'kaf': 1.53}, tol=0.02)
        self.assertAlmostEqual(T.rated(145e3, 'T100')['td_max'] * 1e6, 16, delta=0.3)       # 0,28·t_1 (in brackets)

    def test_above_800kv_and_out_of_phase(self):
        self.check(T.rated(1100e3, 'T100'), {'u1': 808, 't1': 404, 'uc': 1617, 't2': 1212, 'kpp': 1.2})
        self.check(T.rated(1200e3, 'T60'), {'u1': 882, 't1': 294, 'uc': 1764, 't2': 1323}, tol=0.015)
        self.check(T.rated(145e3, 'OP'), {'u1': 178, 't1': 116, 'uc': 296, 't2': 232, 'rrrv': 1.54})   # Table 27
        self.check(T.rated(1100e3, 'OP'), {'uc': 2245, 't3': 1458, 'rrrv': 1.54})

    def test_short_line_fault_supply(self):
        # Table 30: k_pp = 1; two parameters below 100 kV (t_3 of S2 T100 / 1,5), four from 100 kV
        self.check(T.rated(15e3, 'SLF'), {'uc': 18.9, 't3': 20.6, 'td': 1.03, 'ud': 6.29, 'tdp': 7.91, 'rrrv': 0.914}, tol=0.015)
        self.check(T.rated(245e3, 'SLF'), {'u1': 150, 't1': 75, 'uc': 280, 't2': 300, 'td': 2, 'ud': 75, 'tdp': 40, 'kpp': 1.0}, tol=0.015)
        self.check(T.rated(1100e3, 'SLF'), {'u1': 674, 't1': 337, 'uc': 1347, 't2': 1011})

    def test_defaults_and_errors(self):
        self.assertEqual(T.default_kpp(145e3), 1.3)
        self.assertEqual(T.default_kpp(145e3, earthed=False), 1.5)
        self.assertEqual(T.default_kpp(245e3, earthed=False), 1.3)     # above 170 kV: effectively earthed
        self.assertEqual(T.default_kpp(1100e3), 1.2)
        self.assertEqual(T.default_kpp(36e3, False, 'OP'), 2.5)
        r = T.rated(20e3, 'T100')                                      # not a rating of the tables: interpolated
        self.assertFalse(r['standard'])
        self.assertTrue(T.rated(12e3)['standard'])
        with self.assertRaises(T.TRVError):
            T.rated(145e3, 'T200')
        with self.assertRaises(T.TRVError):
            T.rated(0)


class ShortLineFault(unittest.TestCase):
    def test_annex_a_example(self):
        # A.4.2: 245 kV, 50 kA, 50 Hz, L90 and L75
        for ratio, ref in ((0.9, dict(LS=9.01, IL=45, didt=20, LL=1.0, u0=20, uL=32, rate=9, tL=3.56, rrrv=1.8, ux=180, u1t=155, tm=162, um=272, f=1.36)),
                           (0.75, dict(LS=9.01, IL=37.5, didt=16.7, LL=3.0, u0=50, uL=80, rate=7.5, tL=10.7, rrrv=1.5, ux=150, u1t=162.5, tm=162, um=260, f=1.3))):
            s = T.slf(245e3, 50e3, ratio)
            got = dict(LS=s['LS'] * 1e3, IL=s['IL'] / 1e3, didt=s['didt'] * 1e-6, LL=s['LL'] * 1e3, u0=kv(s['u0']), uL=kv(s['uL']),
                       rate=s['rate_line'] * 1e-9, tL=us(s['tL']), rrrv=s['rrrv_slf'] * 1e-9, ux=kv(s['ux']), u1t=kv(s['u1_test']),
                       tm=us(s['tm']), um=kv(s['um']), f=s['um'] / s['Um'])
            for k, v in ref.items():
                self.assertLessEqual(abs(got[k] - v), 0.006 * abs(v) + 0.01, f'L{int(ratio * 100)} {k}: {got[k]} vs {v}')
        # A.4.3: the ITRV on the source side (Table 9: t_i = 0,6 µs, f_i = 0,069 kV/kA), u_i with I_L
        s = T.slf(245e3, 50e3, 0.9, itrv_req=True)
        self.assertAlmostEqual(s['itrv']['fi'] * 1e3 / 1e3, 0.069, delta=0.0005)
        self.assertAlmostEqual(kv(s['itrv']['ui']), 3.1, delta=0.03)
        self.assertAlmostEqual(kv(s['itrv']['ui0']), 2.21, delta=0.03)
        self.assertAlmostEqual(s['itrv']['LB'] * 1e6, 111, delta=1.5)
        # the line length that corresponds (A.17)
        self.assertAlmostEqual(T.slf(245e3, 50e3, 0.9)['L'], 534, delta=2)

    def test_line_data_and_itrv(self):
        d = T.line_data(245e3)
        self.assertEqual((d['Z'], d['k'], d['tdL']), (450.0, 1.6, 0.5e-6))
        self.assertAlmostEqual(d['s'] * 1e-9 * 1e3, 0.200, delta=0.0005)      # kV/(µs·kA)
        self.assertAlmostEqual(T.line_data(245e3, 60)['s'] * 1e-6, 0.240, delta=0.0005)
        self.assertEqual(T.line_data(1100e3)['Z'], 330.0)
        self.assertAlmostEqual(T.line_data(1100e3)['s'] * 1e-6, 0.147, delta=0.0005)
        for U, fi50, fi60 in ((145e3, 0.046, 0.055), (550e3, 0.116, 0.139), (800e3, 0.159, 0.191)):
            self.assertAlmostEqual(T.itrv(U, 1, 50)['fi'], fi50, delta=0.0006)
            self.assertAlmostEqual(T.itrv(U, 1, 60)['fi'], fi60, delta=0.0007)
        self.assertIsNone(T.itrv(72.5e3, 31.5e3))

    def test_pole_factors(self):
        self.assertEqual(T.pole_factors(1.3)['third'], {'rrrv': 0.70, 'uc': 0.77})
        self.assertEqual(T.pole_factors(1.5)['second'], {'rrrv': 0.70, 'uc': 0.58})
        self.assertEqual(T.pole_factors(1.2)['second'], {'rrrv': 0.95, 'uc': 0.95})


class Envelope(unittest.TestCase):
    def test_single_frequency_is_two_parameters(self):
        # 1 − cos: the first tangent touches near ωt = 2,33, close to the peak at π: two parameters (D.2 c) 3) ii))
        w, U = 2 * math.pi * 20e3, 100e3
        t = [i * 1e-8 for i in range(4000)]
        u = [U * (1 - math.cos(w * x)) for x in t]
        e = T.envelope_of(t, u)
        self.assertEqual(e['params'], '2p')
        self.assertAlmostEqual(e['uc'], 2 * U, delta=1)
        x = max(0.1 + 0.01 * k for k in range(300) if (1 - math.cos(0.1 + 0.01 * k)) / (0.1 + 0.01 * k) >= max((1 - math.cos(0.1 + 0.01 * j)) / (0.1 + 0.01 * j) for j in range(300)) - 1e-12)
        self.assertAlmostEqual(e['rrrv'], U * w * (1 - math.cos(x)) / x, delta=0.002 * U * w)

    def test_exponential_is_four_parameters(self):
        # 1 − e^(−t/τ) with a fast oscillation on top early: contact far from the (asymptotic) peak → four parameters
        tau = 50e-6
        t = [i * 2e-8 for i in range(20000)]
        u = [100e3 * (1 - math.exp(-x / tau)) for x in t]
        e = T.envelope_of(t, u)
        self.assertEqual(e['params'], '4p')
        self.assertTrue(0 < e['t1'] < e['t2'])
        self.assertLess(e['u1'], e['uc'])

    def test_two_frequencies_four_parameters_and_compare(self):
        # a slow and a fast oscillation (source side with a bus): an envelope O, B, A, C; the rated T100 of 145 kV over it
        t = [i * 1e-7 for i in range(6000)]
        u = [80e3 * (1 - math.cos(2 * math.pi * 2.5e3 * x)) + 10e3 * (1 - math.cos(2 * math.pi * 25e3 * x)) for x in t]
        e = T.envelope_of(t, u)
        self.assertEqual(e['params'], '4p')
        spec = T.rated(145e3, 'T100')
        c = T.compare(t, u, spec)
        self.assertTrue(c['ok'])
        self.assertGreater(c['margin'], 0)
        big = [3 * x for x in u]
        c2 = T.compare(t, big, spec)
        self.assertFalse(c2['ok'])
        self.assertIsNotNone(c2['t_first'])


if __name__ == '__main__':
    unittest.main()
