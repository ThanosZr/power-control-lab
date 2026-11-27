"""5.0.16 (ROADMAP §101 step 2, THEORY §8ΩΠ): the converters and the HVDC stations of the drawing in the RMS dynamics.

The common model (web/studio/model.js, version 4; 5 from 5.0.17) takes a VSC2 and an MMC with the control on their modulation (a GFMC or an
MMCC) and the DC grids of the stations; pcl.model makes them converters of pcl.rms (converters_of), stations of pcl.rms.HVDC
(stations_of) and the elements of the network (the AC/DC load flow, the current sources of a DC grid: Network.dc_source). The
checks: the translation of the tutorials ieee9_gfm and b4dcs2; a current source of an expression against its closed form, with
the jump in time at its place; the expression evaluator against the solver's (engine/batch.py eval_ast) and its complex step
against differences; the Jacobian of the device with a source; the start of a converter from the load flow of its drawing; the
studies of a drawing. The comparisons with our EMT are in tests/test_rms.py (ieee9_gfm) and tests/test_rms_hvdc.py (b4dcs2).
5.0.17 (THEORY §8ΩΡ): the stations with the terminal n off the ground (a symmetric monopole) and their grid of pairs of poles: the
translation of hvdc_mmc and of drawings made from it, the cable as a line of two poles against its closed forms, the load flow
against its closed form (class PairsOfPoles); against the EMT in tests/test_rms_hvdc.py."""
import json
import math
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
        self.assertEqual(m['version'], 6)                   # (5.1.7: 6, with LCCS, FILT3 and the LCC links)
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
        # a symmetric monopole (the terminal n not on the ground): 5.0.17, a grid of pairs of poles (class PairsOfPoles)
        h = drawing('hvdc_mmc')
        self.assertEqual([b['poles'] for b in h['dc']['buses']], [2, 2])

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


def _hvdc(opts=None):
    return node('build', 'hvdc_mmc', json.dumps(opts or {}))


def _rewire(pr, drop, comps, wires):
    """A drawing made from another: without the parts drop (and their wires), with comps and wires (pairs 'id:pin')."""
    pr = json.loads(json.dumps(pr))
    pr['components'] = [c for c in pr['components'] if c['id'] not in drop] + [dict({'x': 0, 'y': 0}, **c) for c in comps]
    pr['wires'] = [w for w in pr['wires'] if w['a']['c'] not in drop and w['b']['c'] not in drop]
    for a, b in wires:
        (ca, pa), (cb, pb) = a.split(':'), b.split(':')
        pr['wires'].append({'a': {'c': ca, 'p': pa}, 'b': {'c': cb, 'p': pb}})
    return pr


@unittest.skipUnless(HAVE_NODE, 'Node.js')
class PairsOfPoles(unittest.TestCase):
    """5.0.17 (THEORY §8ΩΡ): the stations with the terminal n off the ground. Their DC grid is a grid of pairs of poles: each bus
    a pair of nodes (p, n) at the voltage between them, a line a TLM of two conductors (or an L or R on each pole)."""

    @classmethod
    def setUpClass(cls):
        cls.pr = _hvdc()
        cls.m = model.of(cls.pr)

    def test_the_grid_of_a_symmetric_monopole(self):
        m = self.m
        self.assertEqual(m['version'], 6)
        self.assertEqual([(b['id'], b['Un'], b['U0'], b['C'], b['G'], b['poles']) for b in m['dc']['buses']],
                         [('dc1', 640e3, 640e3, 0, 0, 2), ('dc2', 640e3, 640e3, 0, 0, 2)])
        (ln,) = m['dc']['lines']
        self.assertEqual((ln['id'], ln['a'], ln['b'], ln['poles']), ('CAB', 'dc1', 'dc2', 2))
        self.assertEqual((ln['tlm']['model'], ln['tlm']['len']), ('wb', 70))
        self.assertNotIn('mdl', ln['tlm'])                                                    # (the fitted model: not needed here)
        self.assertEqual({e['id']: e['dc'] for e in m['elements'] if e['type'] == 'MMC'}, {'MMC1': 'dc1', 'MMC2': 'dc2'})
        self.assertEqual(m['skipped'], [])                                                    # the cable is a DC line, not a line of «mph»
        self.assertEqual(len(m['warnings']), 2)                                               # the two AC breakers on a signal
        # the DC fault of the tutorial (a switch between the poles) is said, and the grid stays; the ammeter of hvdc_gfm is a wire
        d = model.of(_hvdc({'ev': 'dcf'}))
        self.assertEqual(len(d['dc']['buses']), 2)
        self.assertEqual(sum('(SW)' in w for w in d['warnings']), 1)
        g = drawing('hvdc_gfm')
        self.assertEqual([(q['id'], q['a'], q['b']) for q in g['dc']['lines']], [('CAB', 'dc1', 'dc2')])
        self.assertFalse(any('(AM)' in w for w in g['warnings']))

    def test_the_cable_as_a_line_of_two_poles(self):
        # R, L, C per conductor at 1 mHz against their closed forms from the data of the cable (pcl.lineconst TYPICAL['320kV-dc']):
        # the core ρ·ℓ/(πr²), the loop of two solid cores 0,5 m apart (μ₀/π)·ln(D/(r·e^(−1/4)))·ℓ/2 per conductor (the sheaths
        # carry nothing at this frequency), the coaxial insulation 2πε₀ε_r/ln(r₂/r₁)·ℓ (the permittivity of the data at 1 mHz
        # is a little above ε_r: 0,27 %)
        R, L, C = model._tlm_dc(self.m['dc']['lines'][0]['tlm'])
        ell, r1, r2 = 70e3, 0.0265, 0.0535
        self.assertAlmostEqual(R, 1.9e-8 * ell / (math.pi * r1 * r1), delta=1e-6 * R)
        self.assertAlmostEqual(L, 4e-7 * math.log(0.5 / (r1 * math.exp(-0.25))) * ell / 2, delta=2e-4 * L)
        self.assertAlmostEqual(C, 2 * math.pi * 8.8541878128e-12 * 2.3 / math.log(r2 / r1) * ell, delta=5e-3 * C)
        # in the network: a line of two poles (the loop is 2R, 2L; the capacitance between the poles C/4 at each end, pcl.rms)
        net, info = model.network(self.m, 'pf')
        (e,) = [q for q in net.elements if q['kind'] == 'dc_line']
        self.assertEqual((e['name'], e['poles'], e['R'], e['L'], e['C']), ('CAB', 2, R, L, C))

    def test_the_load_flow_between_two_poles(self):
        # station 1 gives 1 pu (1059 MW) into the DC grid, station 2 holds 640 kV: U₁ = (U₂ + √(U₂² + 4·2R·P))/2
        m = json.loads(json.dumps(self.m))
        next(e for e in m['elements'] if e['id'] == 'MMC1')['ctl']['params']['Pref'] = '1'
        r = model.load_flow(m)
        R = model._tlm_dc(m['dc']['lines'][0]['tlm'])[0]
        U1 = (640e3 + math.sqrt(640e3 ** 2 + 8 * R * 1059e6)) / 2
        self.assertAlmostEqual(r['dc']['dc2']['U'], 640e3, delta=1e-6)
        self.assertAlmostEqual(r['dc']['dc1']['U'], U1, delta=1e-6)
        self.assertAlmostEqual(r['elements']['MMC2']['Pdc'], -(1059e6 - 2 * R * (1059e6 / U1) ** 2), delta=1e-3)

    def test_lines_on_each_pole_and_the_capacitances(self):
        # the cable as an L on each pole (L and R_s), capacitors from each pole to the ground at station 1, one between the poles
        # at station 2: a line of the loop (R_p + R_n, L_p + L_n), (C_p + C_n)/4 at bus 1, C between the poles at bus 2
        comps = [{'id': 'LP', 'type': 'L', 'params': {'L': 0.05, 'Rs': 0.6}}, {'id': 'LN', 'type': 'L', 'params': {'L': 0.04, 'Rs': 0.5}},
                 {'id': 'CP', 'type': 'C', 'params': {'C': 10e-6}}, {'id': 'CN', 'type': 'C', 'params': {'C': 10e-6}},
                 {'id': 'CPN', 'type': 'C', 'params': {'C': 20e-6}}, {'id': 'G0', 'type': 'GND', 'params': {}}]
        wires = [('MMC1:p', 'LP:a'), ('LP:b', 'MMC2:p'), ('MMC1:n', 'LN:a'), ('LN:b', 'MMC2:n'), ('MMC1:p', 'CP:p'), ('CP:n', 'G0:g'),
                 ('MMC1:n', 'CN:p'), ('CN:n', 'G0:g'), ('MMC2:p', 'CPN:p'), ('CPN:n', 'MMC2:n')]
        m = model.of(_rewire(self.pr, {'CAB'}, comps, wires))
        self.assertEqual([(q['a'], q['b'], q['poles'], q['R'], q['L']) for q in m['dc']['lines']], [('dc1', 'dc2', 1, 1.1, 0.09)])
        self.assertEqual({b['id']: b['C'] for b in m['dc']['buses']}, {'dc1': 5e-6, 'dc2': 20e-6})
        self.assertEqual(len(m['warnings']), 2)
        # different capacitances to the ground on the two poles: their mean, said
        comps[3]['params']['C'] = 6e-6
        m = model.of(_rewire(self.pr, {'CAB'}, comps, wires))
        self.assertAlmostEqual(m['dc']['buses'][0]['C'], 4e-6, delta=1e-18)
        self.assertEqual(sum('μέσος όρος' in w for w in m['warnings']), 1)
        r = model.load_flow(m)
        self.assertAlmostEqual(r['dc']['dc2']['U'], 640e3, delta=1e-6)

    def test_what_a_grid_of_pairs_refuses(self):
        # two L on one pole: which goes with which on the other pole does not follow; said, and the grid stays out
        comps = [{'id': 'LP', 'type': 'L', 'params': {'L': 0.05, 'Rs': 0.6}}, {'id': 'LQ', 'type': 'L', 'params': {'L': 0.05, 'Rs': 0.6}},
                 {'id': 'LN', 'type': 'L', 'params': {'L': 0.04, 'Rs': 0.5}}]
        wires = [('MMC1:p', 'LP:a'), ('LP:b', 'MMC2:p'), ('MMC1:p', 'LQ:a'), ('LQ:b', 'MMC2:p'), ('MMC1:n', 'LN:a'), ('LN:b', 'MMC2:n')]
        m = model.of(_rewire(self.pr, {'CAB'}, comps, wires))
        self.assertEqual(sum('πάνω από ένα L ή R' in w for w in m['warnings']), 1)
        self.assertEqual([e.get('dc') for e in m['elements'] if e['id'] == 'MMC1'], [None])
        self.assertEqual(m['dc']['lines'], [])
        # a node in two pairs (a bipole with a common neutral: a third station between the pole n of station 1 and a node of
        # its own): said, and those pairs stay out
        mm = next(c for c in self.pr['components'] if c['id'] == 'MMC1')
        comps = [dict(mm, id='MMC3'), {'id': 'LX', 'type': 'L', 'params': {'L': 0.05, 'Rs': 0.6}}]
        wires = [('J1:j', 'MMC3:abc'), ('MMC3:p', 'MMC1:n'), ('MMC3:n', 'LX:a'), ('LX:b', 'MMC2:n')]
        m = model.of(_rewire(self.pr, set(), comps, wires))
        self.assertTrue(any('κοινό ουδέτερο' in w for w in m['warnings']))
        self.assertFalse(any(e.get('dc') for e in m['elements'] if e['id'] in ('MMC1', 'MMC3')))


if __name__ == '__main__':
    unittest.main()
