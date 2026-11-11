"""The rest of the two reference impulse tools (4.1.1, ROADMAP §35): result rows with their CSV schema and file
names, characteristics on samples, front-line geometry, validation of a voltage impulse, comparison with an EMTP CSV.
The expected values are the tools' own CSV files (branch ref-materials) and closed forms, never pcl itself."""
import math
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from pcl import impulse as I  # noqa: E402
from tests.test_addons import LIM_CSV, VIG_HEAD, VIG_LI  # noqa: E402

VIG_SI = VIG_HEAD + '''V_30_kV_X_250_Y_2500_TP_T2,IEC2010_SI_LEGACY,Legacy switching impulse 250/2500 us (Tp/T2),TP_T2,Positive,30,30,316.955654538579,16004.3786899236,1.1043334671077,250,2500,250.000000000604,2499.99999999686,2.41539055423345e-10,-1.2572854757309e-10,-1.1842378929335e-14,165.108465835348,2529.17221986057,279.172219864321,247.344160966999,113.362619843215,2499.99999999686,250.000000000604,-29.1722198637172,20.3603198868871,119.425399388096,165.10846198178,2529.17219902637,-2.33396134754779e-06,-8.23755937154228e-07,3,20,60,1e-07,0.005,1,Compatibility profile for the deprecated time-to-peak convention.,computed,2026-09-14 15:37:45
'''


def same(case, ref, got, rel=1e-8, err_abs=1e-8):
    """Every field of a tool row: numbers to rel (percent errors near zero to an absolute 1e-8 %), text exactly."""
    for k, v in ref.items():
        if k == 'created_at':
            continue
        g = got[k]
        if isinstance(v, float):
            if k.endswith('_pct') and abs(v) < 1e-3:
                case.assertLess(abs(g - v), err_abs, k)
            else:
                case.assertAlmostEqual(float(g), v, delta=rel * max(abs(v), 1e-300), msg=k)
        else:
            case.assertEqual(str(g), str(v), k)


class Rows(unittest.TestCase):
    def test_heidler_row_as_the_lightning_impulse_manager(self):
        ref = I.read_rows(LIM_CSV)[0]
        got = I.heidler_row(1, 200, -100000, 10, 'AutoH', 0.93, 1.8319, 284.844)
        same(self, ref, got)
        self.assertEqual(got['name'] + '.csv', 'T1_1_T2_200_Ip_-100000.csv')     # buildSingleImpulseFilename

    def test_voltage_rows_as_the_voltage_impulse_gui(self):
        for text, args in ((VIG_LI, dict(X_us=1.2, Y_us=50, Vp_kV=100, method='IEC_T1_T2', profile='IEC2025_LI', tol_X=30, tol_Y=20)),
                           (VIG_SI, dict(X_us=250, Y_us=2500, Vp_kV=30, method='TP_T2', profile='IEC2010_SI_LEGACY', dt=1e-7, tend=0.005,
                                         tol_X=20, tol_Y=60))):
            ref = I.read_rows(text)[0]
            r = I.voltage_row(**args)
            same(self, ref, r['row'])
            self.assertTrue(all(q['Status'] == 'PASS' for q in r['validation'] if q['Required']))
        self.assertEqual(I.voltage_name(-30, 250, 2500, 'TP_T2'), 'V_m30_kV_X_250_Y_2500_TP_T2')   # the voltage tool: '-' → 'm'

    def test_validation_table(self):
        r = I.voltage_row(1.2, 50, 100, profile='IEC2025_LI')
        names = [q['Metric'] for q in r['validation']]
        self.assertEqual(names[:3], ['Peak voltage', 'IEC front time T1 (30%-90%)', 'Time to half-value T2 from O1'])
        self.assertEqual(len(names), 11)
        req = {q['Metric'] for q in r['validation'] if q['Required']}
        self.assertIn('Sampled-versus-analytic T1', req)
        self.assertNotIn('Legacy peak time Tp from t=0', req)                      # LI: T1/T2 basis
        # a waveform outside the tolerance fails: 1.2/50 checked against the 250/2500 profile
        bad = I.validate_voltage(r['exact'], r['sampled'], dict(Vp_kV=100, targetX_us=1.2, targetY_us=50, fitMethod='IEC_T1_T2',
                                                                tolPeak_pct=3, tolX_pct=30, tolY_pct=20), 'IEC2010_SI_LEGACY')
        self.assertFalse(all(q['Status'] == 'PASS' for q in bad if q['Required']))

    def test_csv_round_trip_and_files(self):
        h = I.heidler_row(10, 350, 200e3, 10, 'FixedH', 0.93, 19, 485, created_at='2026-11-11 05:00:00')
        back = I.read_rows(I.rows_csv([h]))[0]
        same(self, {k: (float(v) if isinstance(v, (int, float)) else v) for k, v in h.items()}, back, rel=1e-14, err_abs=1e-14)
        self.assertEqual(I.rows_csv([h]).splitlines()[0].split(','), list(I.HEIDLER_FIELDS))
        with tempfile.TemporaryDirectory() as d:
            p = I.save_rows([h], d)
            self.assertEqual(Path(p[0]).name, 'T1_10_T2_350_Ip_200000.csv')
            self.assertAlmostEqual(I.read_heidler_csv(p[0])[0]['params']['tau1'], h['tau1_opt_us'] * 1e-6, delta=1e-14 * 2e-5)   # 15 digits, as the tool
        self.assertAlmostEqual(h['peak_opt_A'], 200e3 * I.auto_H(h['tau1_opt_us'], h['tau2_opt_us'], 10, [k * 1e-9 for k in range(60000)]) / 0.93,
                               delta=1)                                                  # FixedH: the peak is I_m·max/η


class Geometry(unittest.TestCase):
    def test_front_line(self):
        """The line through the 10 % and 90 % points: T1_geom/(t90 − t10) = 1/0.8 for any waveform, O1 = the virtual
        origin of IEC 62305-1 (t10 − 0.125·(t90 − t10)); a negative current gives the same times."""
        for I0, tau1, tau2, eta in ((118e3, 5.1002e-6, 65.0497e-6, 0.8746), (100e3, 7.5273e-6, 276.2213e-6, 9.5)):
            g = I.frontline_geometry(I0, tau1, tau2, 10, eta)
            self.assertAlmostEqual(g['ratio'], 1.25, delta=1e-12)
            self.assertAlmostEqual(g['t_O1'], g['t10'] - .125 * g['dt_10_90'], delta=1e-18)
            a = I.lightning_times(I.times(lambda t: I.heidler(t, tau1, tau2), 1e-9, 1e-3))
            self.assertAlmostEqual(g['T1_geom'], a['T1'], delta=1e-4 * a['T1'])           # 1 ns samples vs analytic
            n = I.frontline_geometry(-I0, tau1, tau2, 10, eta)
            self.assertEqual((n['t10'], n['t90'], n['ratio']), (g['t10'], g['t90'], g['ratio']))
            self.assertLess(n['Imax'], 0)


def csv_text(t, cols, names):
    lines = [','.join(names)]
    for k in range(len(t)):
        lines.append(','.join(['%.12g' % t[k]] + [str(c[k]) if isinstance(c[k], str) else '%.12g' % c[k] for c in cols]))
    return '\n'.join(lines) + '\n'


class EmtpComparison(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.row = I.read_rows(LIM_CSV)[0]
        tR, iR = I.heidler_reference(cls.row)
        # "EMTP": the same waveform in kA, 3 μs earlier, every 10 ns up to 400 μs, a text column in between,
        # a column name that says nothing about current, a repeated time
        t = [k * 10e-9 for k in range(40001)]
        y = [x / 1e3 for x in I._interp([q - 3e-6 for q in tR], iR, t)]
        y = [0.0 if math.isnan(v) else v for v in y]
        cls.text = csv_text(t + [t[-1]], [['x'] * (len(t) + 1), y + [123.0], [-v for v in y] + [0.0]], ['time', 'note', 'C1-Bus4a@xyz', 'other'])

    def test_columns_keep_their_numbers(self):
        s = I.read_signal_csv(self.text)
        self.assertEqual([(c['index'], c['name']) for c in s['columns']], [(3, 'C1-Bus4a@xyz'), (4, 'other')])

    def test_same_waveform_shifted_in_kA(self):
        s = I.read_signal_csv(self.text)
        m = I.compare_current(self.row, s['time'], s['data'][3])
        self.assertEqual(m['unit'], 'kA')
        self.assertAlmostEqual(m['shift'], 3e-6, delta=2e-8)                       # the peaks aligned (10 ns samples)
        self.assertLess(m['peak_err_pct'], 1e-3)
        self.assertEqual(m['polarity'], 'Matching')
        self.assertLess(m['nrmse_pct'], 0.05)
        self.assertGreater(m['corr'], 0.99999)
        self.assertGreater(m['n'], 1000)

    def test_opposite_polarity_and_normalization(self):
        s = I.read_signal_csv(self.text)
        m = I.compare_current(self.row, s['time'], s['data'][4])
        self.assertEqual(m['polarity'], 'Opposite')
        self.assertAlmostEqual(m['peak_err_pct'], 200, delta=1e-3)                 # equal magnitudes, opposite signs
        h = I.compare_current(self.row, s['time'], [v * 0.5 for v in s['data'][3]], unit='kA', normalize=True)
        self.assertAlmostEqual(h['factor'], 2, delta=1e-6)                         # never flips the polarity
        self.assertLess(h['nrmse_pct'], 0.05)

    def test_voltage_comparison(self):
        r = I.read_rows(VIG_LI)[0]
        tM, vM, ex = I.voltage_reference(r)
        t = [k * 5e-9 for k in range(30001)]
        v = [x * 1e3 for x in I._interp([q + 1e-6 for q in tM], vM, t)]               # in V, 1 μs later
        v = [0.0 if math.isnan(x) else x for x in v]
        m = I.compare_voltage(r, t, v)
        self.assertEqual(m['unit'], 'V')
        self.assertAlmostEqual(m['shift'], -1e-6, delta=1e-8)
        self.assertLess(abs(m['peak_err_pct']), 1e-3)
        self.assertLess(m['nrmse_pct'], 0.05)
        self.assertGreater(m['corr'], 0.99999)


if __name__ == '__main__':
    unittest.main()
