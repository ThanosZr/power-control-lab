"""5.0.16 (ROADMAP §101 step 2, THEORY §8ΩΠ): the converters and the HVDC stations of the drawing in the RMS dynamics.

The common model (web/studio/model.js, version 4) takes a VSC2 and an MMC with the control on their modulation (a GFMC or an
MMCC) and the DC grids of the stations; pcl.model makes them converters of pcl.rms (converters_of), stations of pcl.rms.HVDC
(stations_of) and the elements of the network (the AC/DC load flow, the current sources of a DC grid: Network.dc_source). The
checks: the translation of the tutorials ieee9_gfm and b4dcs2; a current source of an expression against its closed form, with
the jump in time at its place; the expression evaluator against the solver's (engine/batch.py eval_ast) and its complex step
against differences; the Jacobian of the device with a source; the start of a converter from the load flow of its drawing; the
studies of a drawing. The comparisons with our EMT are in tests/test_rms.py (ieee9_gfm) and tests/test_rms_hvdc.py (b4dcs2)."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

from pcl import model
from pcl import network as N
from pcl import rms

ROOT = Path(__file__).resolve().parent.parent
HAVE_NODE = shutil.which('node') is not None


def node(*args):
    return json.loads(subprocess.run(['node', str(ROOT / 'tests/js/model_cases.js'), *args], capture_output=True, text=True, timeout=300,
                                     check=True).stdout)


def drawing(tid, opts=None):
    return model.of(node('build', tid, json.dumps(opts or {})))


def parse(expr, names):
    """The tree of an expression as the solver parses it (web/studio/expr.js)."""
    js = f'const E=require({json.dumps(str(ROOT / "web/studio/expr.js"))});console.log(JSON.stringify(E.parse({json.dumps(expr)},{json.dumps(names)})))'
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, timeout=60, check=True).stdout)


def one_bus(src=None):
    """A DC bus D1 held at 1 pu by the station S1 from a stiff AC bus (W 30 kJ/MVA on 100 MVA), with a current source J1 on it."""
    net = N.Network(f=50.0, S_base=100e6)
    net.bus('A', 400e3)
    net.feeder('A', Sk=100e9, RX=0.1, name='QA')
    net.dc_bus('D1', 400e3, C=10e-6)
    net.vsc('A', 'D1', control='V', V=1.0, Prated=100e6, name='S1')
    net.dc_source('D1', I=0.0 if src is None else src, name='J1')
    return net


class Expressions(unittest.TestCase):
    @unittest.skipUnless(HAVE_NODE, 'Node.js')
    def test_as_the_solver_and_through_a_complex_step(self):
        from engine import batch
        cases = [('(min(1, max(0, (t - 0.1)/0.2))*(t < 1 ? 300e6 : 55e6))/max(u, 1e5)', ['u']),
                 ('a*sin(2*pi*50*t) + b^2 - abs(a - b)/clamp(b, 1, 2) + lut(a, 0, 0, 1, 2, 3, 3)', ['a', 'b']),
                 ('(a > b && t >= 0.2) ? hypot(a, b) : exp(-a)*sqrt(b) + mod(a, 0.7)', ['a', 'b'])]
        for text, names in cases:
            ast = parse(text, names)
            for t in (0.0, 0.15, 0.25, 1.2):
                for v in ([400e3], [0.3, 1.7], [1.2, 0.4]):
                    if len(v) != len(names):
                        continue
                    self.assertEqual(float(np.real(rms._expr(ast, v, t))), batch.eval_ast(ast, v, t), (text, t, v))
                    # the derivative by a complex step against central differences (away from the kinks)
                    for j in range(len(v)):
                        w = [complex(q) for q in v]
                        w[j] += 1j * 1e-30
                        d = float(np.imag(rms._expr(ast, w, t))) / 1e-30
                        e = 1e-6 * max(1.0, abs(v[j]))
                        hi, lo = list(v), list(v)
                        hi[j] += e
                        lo[j] -= e
                        dn = (batch.eval_ast(ast, hi, t) - batch.eval_ast(ast, lo, t)) / (2 * e)
                        self.assertLess(abs(d - dn), 1e-6 * max(1.0, abs(dn)), (text, t, v, j))
        self.assertEqual(rms._tbreaks(parse('t < 1 ? 300 : 55*(0.3 >= t) + (t == 2)', [])), {1.0, 0.3, 2.0})


class Sources(unittest.TestCase):
    def test_a_constant_source_in_the_acdc_load_flow(self):
        r = one_bus(100.0).acdc_flow(tol=1e-10)
        self.assertTrue(r['converged'])
        self.assertAlmostEqual(r['converters']['S1']['Pdc'], -100.0 * 400e3, delta=1.0)       # S1 takes what J1 brings (W)
        s = rms.System(one_bus(100.0))
        s.init()
        f, g = s.fg(s.x0, s.y0)
        self.assertLess(float(np.max(np.abs(np.r_[f, g]))), 1e-9)

    @unittest.skipUnless(HAVE_NODE, 'Node.js')
    def test_a_source_of_an_expression_through_a_lag(self):
        # i = 100 A after 0.1 s through a low-pass of 20 ms: 100·(1 − e^(−(t − 0.1)/0.02)); the step stops at the jump (a 'tick'),
        # and the step that ends there takes the value before it, so the current starts at 0.1 s, as the EMT's
        ast = parse('t < 0.1 ? 0 : 100', [])
        r = one_bus().dynamic(0.3, stations={'J1': {'expr': ast, 'tau': [0.02]}}, h=0.005, record=0.005, buses=[])
        t, i = np.asarray(r['t']), np.asarray(r['dc']['sources']['J1']['I']) * 1e3
        ex = np.where(t > 0.1, 100 * (1 - np.exp(-(t - 0.1) / 0.02)), 0.0)
        self.assertEqual(float(np.max(np.abs(i[t <= 0.1 + 1e-12]))), 0.0)
        self.assertLess(float(np.max(np.abs(i - ex))), 1.0)                                   # A (the trapezoidal rule, h/τ = 1/4)
        self.assertEqual([e['kind'] for e in r['events']], [])                                # the tick is not an event of the result
        self.assertAlmostEqual(float(r['dc']['sources']['J1']['P'][-1]), 100 * 400e3 * float(r['dc']['buses']['D1']['V'][-1]) / 1e6 * (i[-1] / 100), delta=1e-6)

    def test_what_a_source_refuses(self):
        for bad in ({'J1': {'tau': [0.01]}}, {'J1': {'expr': ['num', 1.0], 'tau': [0.0]}}, {'J1': {'expr': ['var', 0], 'ins': ['D9']}}, {'J1': {'nope': 1}}):
            with self.assertRaises(rms.RMSError, msg=str(bad)):
                rms.System(one_bus(), stations=bad).init()
        with self.assertRaises(rms.RMSError):
            one_bus().dynamic(0.1, events=[{'t': 0.05, 'kind': 'pref', 'gen': 'J1', 'dP': 0.1}])


@unittest.skipUnless(HAVE_NODE, 'Node.js')
class Drawings(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.gfm = drawing('ieee9_gfm')
        cls.b4 = drawing('b4dcs2')

    def test_the_model_of_the_drawings(self):
        m = self.gfm
        self.assertEqual(m['version'], 4)
        vs = [e for e in m['elements'] if e['type'] == 'VSC2']
        self.assertEqual([(e['id'], e['buses'], e['ctl']['type'], e['ctl']['id']) for e in vs], [('VS3', ['B3'], 'GFMC', 'CT3')])
        self.assertEqual(m['skipped'], [])
        m = self.b4
        st = {e['id']: (e['dc'], e['ctl']['params']['mode']) for e in m['elements'] if e['type'] == 'MMC'}
        self.assertEqual(st, {'MMCB3': ('NB3', 'vdc'), 'MMCB2': ('NB2', 'p'), 'MMCE1': ('NE1', 'vf'), 'MMCF1': ('NF1', 'vf')})
        self.assertEqual(sorted(b['id'] for b in m['dc']['buses']), ['NB2', 'NB3', 'NB5', 'NE1', 'NF1'])
        self.assertEqual(sorted((q['a'], q['b']) for q in m['dc']['lines']), [('NB3', 'NB2'), ('NB5', 'NB3'), ('NF1', 'NB5'), ('NF1', 'NE1')])
        (q,) = m['dc']['sources']
        self.assertEqual((q['id'], q['bus'], q['k'], q['expr']['ins'], q['expr']['via']), ('ICD', 'NE1', 1, ['NE1'], 'KCD'))
        self.assertEqual(len(q['expr']['tau']), 1)
        self.assertAlmostEqual(q['expr']['tau'][0], 5e-3, delta=1e-12)
        self.assertEqual((m['skipped'], m['warnings']), ([], []))
        wf = next(e for e in m['elements'] if e['id'] == 'WF')
        self.assertEqual((wf['ctl']['type'], wf['ctl']['params']['mode']), ('MMCC', 'p'))
        # a symmetric monopole (the terminal n not on the ground): not a DC grid yet, and said
        h = drawing('hvdc_mmc')
        self.assertIsNone(h['dc'])
        self.assertEqual(sum('δεν είναι στη γη' in w for w in h['warnings']), 2)

    def test_the_data_of_the_converters_and_the_stations(self):
        conv, notes = model.converters_of(self.gfm)
        c = conv['VS3']
        self.assertEqual((c['model'], c['law'], c['Sn']), ('gfm', 'droop', 128e6))
        self.assertAlmostEqual(c['Xc'], 0.15, delta=1e-5)                                    # the reactor of the VSC2 on the 128 MVA
        self.assertAlmostEqual(c['Rf'], 0.003, delta=1e-6)
        self.assertEqual(notes, [])
        st, notes = model.stations_of(self.b4)
        # as b4_dcs2_stations('model4') of 5.0.15: the arm on the AC side, N·R_on/2, W 30 kJ/MVA, the DC side of Model 4
        from pcl import dcgrid
        ref = dcgrid.b4_dcs2_stations('model4')
        for a, b in (('MMCB3', 'Cm-B3'), ('MMCB2', 'Cm-B2'), ('MMCE1', 'Cm-E1'), ('MMCF1', 'Cm-F1')):
            for k in ('Sn', 'X', 'R', 'W', 'Ldc', 'Rd', 'fd', 'Tp', 'Tq', 'Tvdc', 'H'):
                self.assertAlmostEqual(st[a][k], ref[b][k], delta=1e-6 * max(1.0, abs(ref[b][k])), msg=(a, k))
        self.assertAlmostEqual(st['MMCE1']['Tvf'], 0.05)
        self.assertEqual((st['ICD']['ins'], st['ICD']['k']), (['NE1'], 1))

    def test_the_start_of_a_converter_is_the_load_flow_of_its_drawing(self):
        # the network of the RMS has the converter at its bus at the voltage that its EMF gives there in the load flow of the
        # drawing: the same load flow (the converter then starts from it with the references of its GFMC, as the EMT)
        lf = model.load_flow(self.gfm)
        net = model._rms_network(self.gfm)[0]
        r0 = net.load_flow()
        for b in lf['buses']:
            self.assertAlmostEqual(r0['buses'][b]['V'], lf['buses'][b]['V'], delta=1e-12)
            self.assertAlmostEqual(r0['buses'][b]['angle'], lf['buses'][b]['angle'], delta=1e-9)
        self.assertAlmostEqual(r0['buses']['B3']['P'] / 1e6, lf['elements']['VS3']['P'] / 1e6, delta=1e-6)
        r = model.dynamic(self.gfm, t_end=0.02, h=0.005, record=0.005, buses=[])
        # the load step of the drawing (a breaker that closes onto a LOAD3 alone) as a shunt of 50 MW at 345 kV: y = 0,5 pu
        ev = [e for e in r['drawing']['events'] if e['kind'] == 'shunt']
        self.assertEqual([(e['t'], e['bus'], e['id']) for e in ev], [(1.0, 'B7', 'CBS')])
        self.assertAlmostEqual(complex(ev[0]['y']), 0.5, delta=1e-12)

    def test_the_load_flow_of_a_drawing_with_a_dc_grid(self):
        lf = model.load_flow(self.b4)
        self.assertTrue(lf['converged'])
        self.assertEqual(sorted(lf['dc']), ['NB2', 'NB3', 'NB5', 'NE1', 'NF1'])
        self.assertAlmostEqual(lf['dc']['NB3']['V'], 1.0, delta=1e-9)                       # Cm-B3 holds V_dc
        self.assertAlmostEqual(lf['elements']['MMCB2']['Pdc'], 150e6, delta=1.0)              # Cm-B2 gives the DC grid 150 MW
        # E1: the station of the island gives the load (100 MW of constant impedance at 145 kV) what it takes, at the start
        # without the 300 MW of Cd-E1 (its program starts from zero) and the wind farm (it starts from zero)
        self.assertAlmostEqual(lf['elements']['MMCE1']['P'], 1e8 * lf['buses']['JE1']['V'] ** 2, delta=1e3)

    def test_the_studies_of_a_drawing(self):
        from pcl import study
        r = study.run({'drawing': self.b4, 'study': 'rms', 'options': {'t_end': 0.2}})
        sm = r['summary']
        self.assertEqual((sm['machines'], sm['converters'], sm['stations']), (0, 1, 4))
        self.assertTrue(sm['stable'])
        self.assertIn('sources', r['result']['dc'])
        r = study.run({'drawing': self.b4, 'study': 'pf', 'options': {}})                       # the AC/DC load flow
        self.assertTrue(r['summary']['converged'])
        self.assertIn('Pdc', r['result']['elements']['MMCB3'])
        r = study.run({'drawing': self.b4, 'study': 'sc', 'options': {}})
        self.assertTrue(any('IEC 60909' in n for n in r['network']['drawing']['notes']))


if __name__ == '__main__':
    unittest.main()
