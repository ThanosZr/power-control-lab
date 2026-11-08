"""Server reference solver (engine/batch.py) on netlists exported by the studio."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

from engine.batch import simulate, BatchError

REQ = Path(__file__).resolve().parent / 'js' / 'batch_requests.js'


def mean_window(r, key, a, b):
    t, y = np.array(r['t']), np.array(r['ch'][key])
    grid = np.linspace(a, b, 20001)
    return float(np.mean(np.interp(grid, t, y)))


@unittest.skipIf(shutil.which('node') is None, 'Node.js not installed (the requests come from web/studio/mna.js).')
class BatchSolver(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run(['node', str(REQ)], capture_output=True, text=True, timeout=120)
        if run.returncode:
            raise RuntimeError(run.stderr)
        cls.req = json.loads(run.stdout)

    def run_case(self, name, t_end, method='Radau', **kw):
        return simulate({**self.req[name], 't_end': t_end, 'method': method, **kw})

    def test_buck_dcm_matches_closed_form(self):
        K = 2 * 10e-6 * 100e3 / 50
        vo = 24 * 2 / (1 + math.sqrt(1 + 4 * K / .3 ** 2))
        for method in ('Radau', 'BDF', 'LSODA'):
            r = self.run_case('buck_dcm', 3e-3, method)
            self.assertEqual(r['status'], 'ok')
            self.assertGreater(r['stats']['diode_events'], 100)               # DCM: diode turns off every period
            self.assertAlmostEqual(mean_window(r, 'V:C1', 2.5e-3, 3e-3), vo, delta=0.004 * vo)

    def test_rectifier_without_states(self):
        r = self.run_case('rectifier', 0.04)
        vpk, E, R = 230 * math.sqrt(2), 200, 2
        a = math.asin(E / vpk)
        iavg = (2 * vpk * math.cos(a) - E * (math.pi - 2 * a)) / (math.pi * R)
        self.assertAlmostEqual(mean_window(r, 'I:R1', 0.02, 0.04), iavg, delta=0.003 * iavg)

    def test_three_phase_thyristor_bridge(self):
        r = self.run_case('bridge3_scr', 0.04)
        vd = 3 * math.sqrt(3) / math.pi * 325 * math.cos(math.pi / 6)
        self.assertAlmostEqual(mean_window(r, 'V:R1', 0.02, 0.04), vd, delta=0.002 * vd)

    def test_pi_controller_and_dead_time(self):
        r = self.run_case('battery_pi', 0.01, 'LSODA')
        self.assertAlmostEqual(mean_window(r, 'I:L1', 0.0095, 0.01), 800, delta=2)    # reference reversed at 3 ms
        r = self.run_case('deadtime', 0.01, 'LSODA')
        self.assertAlmostEqual(mean_window(r, 'I:L1', 0.0095, 0.01), 800, delta=3)

    def test_sample_and_hold(self):
        T, I, dI = 50e-6, -800, 50 * .5 / (5.6e-6 * 20e3)
        r = self.run_case('sampling_saw', 50 * T, 'LSODA')
        sm = r['samples']['SH1']
        self.assertEqual(len([t for t in sm['t'] if t < 50 * T - 1e-12]), 50)
        self.assertAlmostEqual(sm['t'][0], T / 4, delta=1e-12)                    # 90° delay: first reset at 12.5 μs
        for k, t in enumerate(sm['t']):
            self.assertAlmostEqual(t, T / 4 + k * T, delta=1e-12)
        self.assertAlmostEqual(sm['v'][-1], I - dI / 2, delta=0.2)               # valley
        self.assertAlmostEqual(r['ch']['H:SH1'][-1], sm['v'][-1], delta=1e-6)
        r = self.run_case('sampling_tri2', 50 * T, 'LSODA')
        sm = r['samples']['SH1']
        self.assertEqual(len([t for t in sm['t'] if t < 50 * T - 1e-12]), 100)
        self.assertAlmostEqual(sm['v'][-1], I, delta=0.2)
        r = self.run_case('sampling_pi', 0.012, 'LSODA')                         # PI on the sample, as in the browser
        self.assertAlmostEqual(r['samples']['SH1']['v'][-1], -400, delta=0.05)
        self.assertAlmostEqual(mean_window(r, 'I:L1', 0.0115, 0.012), -400 + 50 * .375 / (5.6e-6 * 20e3) / 2, delta=0.5)

    def test_polyphase_interleaved(self):
        T = 50e-6
        r = self.run_case('poly4', 10 * T, 'LSODA')
        t, y = np.array(r['t']), np.array(r['ch']['I:VB'])
        win = t >= 9 * T
        self.assertAlmostEqual(float(y[win].max() - y[win].min()), 12.0, delta=0.05)   # summed ripple, 4 shifted legs
        self.assertAlmostEqual(mean_window(r, 'I:L3', 9 * T, 10 * T), -200, delta=0.1)
        self.assertAlmostEqual(mean_window(r, 'I:VB', 9 * T, 10 * T), -800, delta=0.2)

    def test_double_update_and_sharing(self):
        r = self.run_case('sampling_double', 0.012, 'LSODA')                    # PI at T/2, two samples per period
        self.assertAlmostEqual(r['samples']['SH1']['v'][-1], -400, delta=0.05)
        t, d = np.array(r['t']), np.array(r['ch']['D:PWM1'])
        ch = t[1:][(np.abs(np.diff(d)) > 1e-9) & (t[1:] > 0.002) & (t[1:] < 0.0025)]   # after the reference step
        self.assertGreater(len(ch), 10)
        self.assertAlmostEqual(float(np.min(np.diff(ch))), 25e-6, delta=1e-9)  # duty updates every T/2
        r = self.run_case('share_dcr', 0.02, 'LSODA')
        self.assertAlmostEqual(mean_window(r, 'I:L2', 0.0195, 0.02), -200 * 5 / 7.5, delta=0.3)

    def test_gate_pulses(self):
        r = self.run_case('pulses', 0.0005, 'LSODA')                             # 200 ns dead time, T = 50 μs
        t, g1, g2 = np.array(r['t']), np.array(r['ch']['GS:S1']), np.array(r['ch']['GS:S2'])
        self.assertFalse(np.any((g1 > .5) & (g2 > .5)))                          # never both ON
        D, T = r['ch']['D:PWM1'][-1], 50e-6
        w = (t >= 0.0005 - T - 1e-12)
        tw, gw = t[w], g2[w]
        on2 = float(np.sum(np.diff(tw) * (gw[1:] + gw[:-1]) / 2)) / T
        self.assertAlmostEqual(on2, D - 200e-9 / T, delta=1e-6)                  # D·T − t_d, as in the browser

    def test_signal_blocks_parity(self):
        # 3.0: blocks, comparator roots (events of the ODE solver) and the latch give the browser's waveforms
        for name, tol in (('pcm_half', 1e-5), ('pcm_sub', 1e-4), ('blk_cmp_z1', 1e-4), ('blk_pwm', 1e-4)):
            js = self.req[name]['js']
            T = js['T']
            r = self.run_case(name, round(js['pk'][-1]['t'] / T) * T, 'LSODA', rtol=1e-8, atol=1e-10)
            self.assertEqual(r['status'], 'ok')
            t, y = np.array(r['t']), np.array(r['ch']['Y:AM1'])
            for q in js['pk']:
                w = (t >= q['t'] - T - 1e-12) & (t <= q['t'] + 1e-12)
                self.assertAlmostEqual(float(y[w].max()), q['max'], delta=tol, msg=name)
                self.assertAlmostEqual(float(y[w].min()), q['min'], delta=tol, msg=name)
            if name.startswith('pcm'):
                self.assertGreater(r['stats']['cmp_events'], 20)                 # resets found as roots, not on a grid

    def test_machine_and_control_blocks_parity(self):
        # 3.1: DC machine (gyrator + mechanical circuit), PLL / Clarke / Park, integrator, low-pass, PI with back-calculation
        # eis_cell (3.3.1): CPE bank, sources from signals; t held over T/200 in the server. 3.5: multiports, synchronous machine, lightning current
        for name, tol in (('dcm', 2e-3), ('pll', 1e-3), ('cont', 2e-3), ('eis_cell', 5e-3), ('im_dol', 3e-3),
                          ('mp_kl', 5e-5), ('mp_kg', 1e-5), ('sm_align', 2e-4), ('sm_pm', 3e-4), ('mp_lg', 1e-4),
                          ('srm_m', 3e-4), ('srm_t', 3e-4), ('sm_sat', 3e-4)):
            req = self.req[name]
            keys = list(req['channels'].keys()) if isinstance(req['channels'], dict) else [c['key'] for c in req['channels']]
            r = self.run_case(name, req['at'][-1][0], 'LSODA', rtol=1e-9, atol=1e-11)
            self.assertEqual(r['status'], 'ok', msg=name)
            t = np.array(r['t'])
            for row in req['at']:
                for k, v in zip(keys, row[1:]):
                    y = float(np.interp(row[0], t, np.array(r['ch'][k])))
                    self.assertAlmostEqual(y, v, delta=tol * max(1, abs(v)), msg=f'{name} {k} at {row[0]}')
        js = self.req['dc_cur']['js']           # the drive: PWM with input d, saturation, tags, PI with tracking, machine
        T = js['T']
        r = self.run_case('dc_cur', round(js['pk'][-1]['t'] / T) * T, 'LSODA', rtol=1e-8, atol=1e-10)
        self.assertEqual(r['status'], 'ok')
        t, y = np.array(r['t']), np.array(r['ch']['Y:AM1'])
        for q in js['pk']:
            w = (t >= q['t'] - T - 1e-12) & (t <= q['t'] + 1e-12)
            self.assertAlmostEqual(float(y[w].max()), q['max'], delta=1e-3)
            self.assertAlmostEqual(float(y[w].min()), q['min'], delta=1e-3)

    def test_code_blocks_parity(self):
        # 3.3: the Python block runs natively on the server, the expression tree is evaluated by eval_ast;
        # the browser reference is the same circuit with the PI block (identical operations)
        js = self.req['code_py']['js']
        T = js['T']
        r = self.run_case('code_py', round(js['pk'][-1]['t'] / T) * T, 'LSODA', rtol=1e-8, atol=1e-10, _local=True)
        self.assertEqual(r['status'], 'ok')
        t, y = np.array(r['t']), np.array(r['ch']['Y:AM1'])
        for q in js['pk']:
            w = (t >= q['t'] - T - 1e-12) & (t <= q['t'] + 1e-12)
            self.assertAlmostEqual(float(y[w].max()), q['max'], delta=1e-4)
            self.assertAlmostEqual(float(y[w].min()), q['min'], delta=1e-4)
        with self.assertRaises(BatchError):                                        # not from another machine
            self.run_case('code_py', 1e-4, 'LSODA')

    def test_explicit_method_reports_stiffness(self):
        r = self.run_case('buck_dcm', 2e-3, 'RK45', wall=2)
        self.assertIn(r['status'], ('ok', 'timeout'))
        if r['status'] == 'timeout':
            self.assertIn('Radau', r['message'])

    def test_input_checks(self):
        with self.assertRaises(BatchError):
            self.run_case('buck_dcm', 1e-3, 'Euler')
        with self.assertRaises(BatchError):
            self.run_case('buck_dcm', 100.0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
