"""The three-phase load flow of a feeder (4.19.5, ROADMAP §81, pcl/unbalanced.py). References that do not use its code: the
published results of the IEEE 13 node test feeder (voltages, currents, input, losses per section, the power of the loads that
follow the voltage), the equations of a coupled line solved directly, the exact line model for a cable without load, the
positive-sequence load flow of pcl.network for a balanced feeder (radial and with a loop), 200 spot loads for a load spread
along a section, closed forms for a load on one phase (constant impedance, current, power) and for a load between two phases
of a coupled line, and the equations of the regulator and of its compensator written out here."""
import json
import math
import unittest

import numpy as np

from pcl import netview
from pcl import network as N
from pcl import study as S
from pcl import unbalanced as U

A = np.exp(-2j * np.pi / 3 * np.arange(3))                      # a balanced set: 0°, −120°, 120°
REF = {'a': 0.0, 'b': -120.0, 'c': 120.0}
ZS, ZM = 0.3465 + 1.0179j, 0.1560 + 0.5017j                     # Ω per mile: the self and the mutual impedance of a transposed line
BS, BM = 6.2998, -1.2595                                        # µS per mile
PUB = U.case_solution('feeder13')


def phasor(r, bus, p):
    q = r['buses'][bus]['phases'][p]
    return q['volts'] * np.exp(1j * np.radians(q['angle']))


def two(kV=4.16, Z=None, B=None, phases='abc', length=4000.0):
    """A source bus S and a bus L at the end of one line section."""
    fd = U.Feeder('two')
    fd.bus('S', kV)
    fd.bus('L', kV)
    fd.set_source('S', 1.0)
    k = len(phases)
    fd.config('c', phases, np.full((k, k), ZM) + np.eye(k) * (ZS - ZM) if Z is None else Z, B)
    fd.line('S', 'L', length, 'c')
    return fd


def balanced(loop=False):
    """A feeder with transposed lines, a transformer and balanced loads of every model in star and in delta, and the same network
    in positive sequence written by hand as a pcl.network.Network."""
    fd = U.Feeder('balanced')
    net = N.Network(60, 1e6, name='balanced')
    for b in ('S', 'A', 'B', 'C'):
        fd.bus(b, 12.47)
        net.bus(b, 12.47e3)
    fd.bus('D', 0.48)
    net.bus('D', 480.0)
    fd.set_source('S', 1.02)
    net.feeder('S', Sk=1e15, V=1.02, slack=True)
    fd.config('t', 'abc', np.full((3, 3), ZM) + np.eye(3) * (ZS - ZM), np.full((3, 3), BM) + np.eye(3) * (BS - BM))
    zb, z1, b1 = 12.47e3 ** 2 / 1e6, ZS - ZM, (BS - BM) * 1e-6
    for a, b, ft in (('S', 'A', 8000), ('A', 'B', 6000), ('A', 'C', 9000)) + ((('B', 'C', 7000),) if loop else ()):
        fd.line(a, b, ft, 't')
        net.branch_pu(a, b, z1.real * ft / 5280 / zb, z1.imag * ft / 5280 / zb, b1 * ft / 5280 * zb)
    fd.transformer('C', 'D', 1000, 1.0, 5.0)
    net.branch_pu('C', 'D', 0.01, 0.05)
    fd.load('B', 'Y', 'PQ', [700] * 3, [300] * 3)
    fd.load('C', 'D', 'PQ', [400] * 3, [150] * 3)
    fd.load('D', 'Y', 'Z', [250] * 3, [100] * 3)
    fd.load('A', 'Y', 'I', [300] * 3, [100] * 3)
    fd.capacitor('B', [200] * 3)
    net.load('B', 2100e3, 900e3)
    net.load('C', 1200e3, 450e3)
    net.load('D', 750e3, 300e3, zip=(1, 0, 0))
    net.load('A', 900e3, 300e3, zip=(0, 1, 0))
    net.shunt('B', Q=-600e3)
    return fd, net


def spot_loads(model, n, kW, kvar, Z, length=10000.0):
    """A load spread evenly along a section as n equal spot loads at the centres of n equal pieces of it."""
    fd = U.Feeder('spots')
    fd.bus('S', 4.16)
    fd.set_source('S', 1.0)
    fd.config('c', 'abc', Z)
    prev = 'S'
    for i in range(n):
        b = fd.bus(f'n{i}', 4.16)
        fd.line(prev, b, length / n * (0.5 if i == 0 else 1.0), 'c')
        fd.load(b, 'Y', model, [x / n for x in kW], [x / n for x in kvar])
        prev = b
    fd.bus('E', 4.16)
    fd.line(prev, 'E', length / n * 0.5, 'c')
    return fd


class Unbalanced(unittest.TestCase):
    def test_the_published_feeder(self):
        fd = U.case_data('feeder13')
        self.assertEqual((len(fd.buses), len(fd.lines), len(fd.loads), len(fd.spread), len(fd.caps), fd.regulators[0]['taps']), (14, 10, 8, 1, 2, {'a': 10, 'b': 8, 'c': 11}))
        r = U.run(fd)
        self.assertEqual((r['converged'], r['nodes'], r['settled']), (True, 38, True))
        for tol, n in ((1e-6, 7), (1e-9, 10), (1e-12, 14)):     # the convergence is linear: about three iterations for a thousand times less
            self.assertLessEqual(abs(U.run(fd, tol=tol)['iterations'] - n), 1)
        B = r['buses']
        # the voltage profile: every published value (35 of them), to the four decimals and the two decimals of a degree of the document
        pairs = [(B[b]['phases'][p], q) for b, rows in PUB['V'].items() for p, q in zip('abc', rows) if q]
        self.assertEqual(len(pairs), 35)
        self.assertLess(max(abs(x['V'] - q[0]) for x, q in pairs), 2e-4)
        self.assertLess(max(abs(x['angle'] - q[1]) for x, q in pairs), 0.02)
        self.assertEqual({b: ''.join(sorted(d['phases'])) for b, d in B.items() if len(d['phases']) < 3}, {'645': 'bc', '646': 'bc', '684': 'ac', '611': 'c', '652': 'a'})
        # the currents at the source and behind the regulator, the input per phase
        reg = next(s for s in r['sections'] if s['name'] == 'RG60')
        for j, p in enumerate('abc'):
            self.assertAlmostEqual(reg['I'][p], PUB['source_A'][j][0], delta=0.1)
            self.assertAlmostEqual(reg['angle'][p], PUB['source_A'][j][1], delta=0.02)
            self.assertAlmostEqual(reg['I_b'][p], PUB['regulated_A'][j][0], delta=0.1)
            self.assertAlmostEqual(r['input']['A'][p], PUB['source_A'][j][0], delta=0.1)
            self.assertAlmostEqual(r['input']['kW'][p], PUB['input_kW'][j], delta=0.04)
            self.assertAlmostEqual(r['input']['kvar'][p], PUB['input_kvar'][j], delta=0.35)
        # the losses: the total within 0,07 kW of 111,063, every section within 0,09 kW, and the sign of every phase (phase b gives
        # power to the other two through the coupling: its «losses» are negative in the document too)
        self.assertAlmostEqual(r['losses_kW'], PUB['losses_kW'], delta=0.07)
        sec = {}
        for s in r['sections']:
            sec[s['parent']] = sec.get(s['parent'], 0.0) + s['loss']
        for k, v in PUB['section_kW'].items():
            self.assertAlmostEqual(sec[k], v, delta=0.09, msg=k)
        for j, p in enumerate('abc'):
            self.assertAlmostEqual(sum(s['loss_kW'].get(p, 0.0) for s in r['sections']), PUB['losses_phase_kW'][j], delta=0.07)
        self.assertLess(sum(s['loss_kW'].get('b', 0.0) for s in r['sections']), 0)
        # the currents of four sections
        by = {s['name']: s for s in r['sections']}
        n = 0
        for k, rows in PUB['section_A'].items():
            s = by.get(k) or by[k + ' (1/4)']
            for p, q in zip('abc', rows):
                if q:
                    self.assertAlmostEqual(s['I'][p], q[0], delta=0.08, msg=k)
                    self.assertAlmostEqual(s['angle'][p], q[1], delta=0.025, msg=k)
                    n += 1
        self.assertEqual(n, 11)
        # the loads that follow the voltage (constant impedance, constant current) and the capacitors
        kW = {}
        for q in r['loads']:
            kW[q['bus']] = kW.get(q['bus'], 0.0) + q['kW']
        for b, v in PUB['load_kW'].items():
            self.assertAlmostEqual(kW[b], v, delta=0.03, msg=b)
        for b, rows in PUB['cap_kvar'].items():
            for p, v in zip('abc', rows):
                if v:
                    self.assertAlmostEqual(next(q['kvar'] for q in r['capacitors'] if q['bus'] == b and q['phase'] == p), v, delta=0.06)
        # what goes in is what the loads take and what is lost
        self.assertAlmostEqual(r['input']['kW_total'], r['load_kW'] + r['losses_kW'], delta=1e-5)
        # the lowest voltage and the largest unbalance
        self.assertEqual((r['worst']['low']['bus'], r['worst']['low']['phase'], r['worst']['unbalance']['bus']), ('611', 'c', '675'))
        self.assertAlmostEqual(r['worst']['low']['V'], 0.9739, delta=1e-4)
        self.assertAlmostEqual(r['worst']['unbalance']['value'], 2.056, delta=2e-3)
        self.assertGreater(B['675']['phases']['b']['V'], B['RG60']['phases']['b']['V'])       # phase b ends higher than it starts
        # with the load spread put at the middle of its section the profile is the published one all the same
        m = U.run(fd, spread='middle')
        self.assertLess(max(abs(m['buses'][b]['phases'][p]['V'] - q[0]) for b, rows in PUB['V'].items() for p, q in zip('abc', rows) if q), 2.5e-4)

    def test_a_coupled_line_against_its_equations(self):
        c = U.case_data('feeder13').configs
        # an untransposed line with unequal loads of constant power: V = V_s − Z·I, I = (S/V)*, iterated here
        Z, kW, kvar = c['601']['Z'], [800.0, 300.0, 600.0], [300.0, 250.0, 100.0]
        fd = two(Z=Z)
        fd.load('L', 'Y', 'PQ', kW, kvar)
        r = U.run(fd, tol=1e-13)
        Vs, Sl, Zl = 4160 / math.sqrt(3) * A, (np.array(kW) + 1j * np.array(kvar)) * 1e3, Z * 4000 / 5280
        V = Vs.copy()
        for _ in range(200):
            V = Vs - Zl @ np.conj(Sl / V)
        self.assertLess(max(abs(phasor(r, 'L', p) - V[j]) for j, p in enumerate('abc')) / abs(Vs[0]), 1e-12)
        self.assertAlmostEqual(abs(V[0]) / abs(Vs[0]), 0.95183, delta=1e-5)
        self.assertAlmostEqual(r['buses']['L']['unbalance'], 1.8026, delta=1e-4)
        v0, v1, v2 = U.sequence(*V)
        self.assertAlmostEqual(r['buses']['L']['unbalance'], 100 * abs(v2) / abs(v1), delta=1e-9)
        # a cable of 20 miles without load: the voltage at its end by the exact line model, V_s = (1 + Z·Y/2)·V_r
        fd = two(Z=c['606']['Z'], B=c['606']['B'], length=20 * 5280.0)
        r = U.run(fd, tol=1e-13)
        Vr = np.linalg.solve(np.eye(3) + c['606']['Z'] * 20 @ (1j * c['606']['B'] * 1e-6 * 20) / 2, Vs)
        self.assertLess(max(abs(phasor(r, 'L', p) - Vr[j]) for j, p in enumerate('abc')) / abs(Vs[0]), 1e-12)
        self.assertGreater(min(abs(Vr)) / abs(Vs[0]), 1.007)                                   # the charging raises the voltage of every phase

    def test_a_balanced_feeder_is_the_positive_sequence_load_flow(self):
        for loop in (False, True):
            fd, net = balanced(loop)
            r = U.run(fd, tol=1e-13)
            lf = net.power_flow('nr', tol=1e-12)
            self.assertTrue(r['converged'] and lf['converged'])
            self.assertLess(max(abs(r['buses'][b]['phases'][p]['V'] - q['V']) for b, q in lf['buses'].items() for p in 'abc'), 1e-12)
            self.assertLess(max(abs((r['buses'][b]['phases'][p]['angle'] - REF[p] + 180) % 360 - 180 - q['angle']) for b, q in lf['buses'].items() for p in 'abc'), 1e-10)
            self.assertLess(max(d['unbalance'] for d in r['buses'].values()), 1e-10)
            self.assertLess(max(d['zero'] for d in r['buses'].values()), 1e-10)
            self.assertAlmostEqual(r['losses_kW'] * 1e3, lf['losses'], delta=1e-5)
            # the picture network of the feeder is that positive-sequence network
            pic = U.as_network(fd).power_flow('nr', tol=1e-12)
            self.assertLess(max(abs(pic['buses'][b]['V'] - q['V']) for b, q in lf['buses'].items()), 1e-12)
            self.assertAlmostEqual(lf['buses']['D']['V'], 0.97447 if loop else 0.97274, delta=1e-5)      # the loop changes the answer: it is in the solution

    def test_a_load_spread_along_a_section(self):
        Z, kW, kvar = U.case_data('feeder13').configs['601']['Z'], (300.0, 200.0, 400.0), (130.0, 70.0, 170.0)
        got = {}
        for model in U.MODELS:
            ref = U.run(spot_loads(model, 200, kW, kvar, Z), tol=1e-12)
            for how in ('exact', 'middle'):
                fd = two(Z=Z, length=10000.0)
                fd.distributed('S', 'L', 'Y', model, kW, kvar)
                q = U.run(fd, spread=how, tol=1e-12)
                got[model, how] = (max(abs(q['buses']['L']['phases'][p]['V'] - ref['buses']['E']['phases'][p]['V']) for p in 'abc'), q['losses_kW'] / ref['losses_kW'] - 1)
                self.assertEqual(q['spread'], how)
        # two thirds at a quarter of the section and one third at its end: the voltage at the end within 3e-6 pu of the 200 loads for
        # every model, the losses within 2e-5 for constant current (the case the model is derived for) and within 0,4 % otherwise
        for model in U.MODELS:
            self.assertLess(got[model, 'exact'][0], 3e-6)
            self.assertLess(abs(got[model, 'exact'][1]), 2e-5 if model == 'I' else 4e-3)
            # all of it at the middle: the voltage within 8e-4 pu, the losses half as much again
            self.assertLess(got[model, 'middle'][0], 8e-4)
            self.assertGreater(got[model, 'middle'][0], 100 * got[model, 'exact'][0])
            self.assertAlmostEqual(got[model, 'middle'][1], 0.5, delta=0.03)
        with self.assertRaises(U.FeederError):
            fd = two()
            fd.bus('X', 4.16)
            fd.distributed('S', 'X', 'Y', 'PQ', kW, kvar)
            U.run(fd)

    def test_one_phase_in_closed_form(self):
        z, P, Q = (1.3292 + 1.3475j) * 3000 / 5280, 150e3, 70e3
        Vn = 4160 / math.sqrt(3)
        Vs = Vn * A[2]
        for model in U.MODELS:
            fd = two(Z=[[1.3292 + 1.3475j]], phases='c', length=3000.0)
            fd.load('L', 'Y', model, [0, 0, P / 1e3], [0, 0, Q / 1e3])
            r = U.run(fd, tol=1e-13)
            self.assertEqual((list(r['buses']['L']['phases']), r['nodes'], 'unbalance' in r['buses']['L']), (['c'], 2, False))
            v = abs(phasor(r, 'L', 'c'))
            if model == 'Z':                                       # a voltage divider
                Zl = Vn ** 2 / complex(P, -Q)
                self.assertLess(abs(phasor(r, 'L', 'c') - Vs * Zl / (z + Zl)) / Vn, 1e-12)
                want = abs(Vs * Zl / (z + Zl))
            elif model == 'PQ':                                    # the upper root of the biquadratic of two buses
                k = Vn ** 2 - 2 * (P * z.real + Q * z.imag)
                want = math.sqrt((k + math.sqrt(k * k - 4 * abs(z) ** 2 * (P * P + Q * Q))) / 2)
            else:                                                  # a current of fixed magnitude at the power factor of the load, against its own voltage
                w = z * math.hypot(P, Q) / Vn * np.exp(-1j * math.atan2(Q, P))
                want = -w.real + math.sqrt(Vn ** 2 - w.imag ** 2)
            self.assertLess(abs(v - want) / Vn, 1e-12, model)
            ld = r['loads'][0]
            self.assertAlmostEqual(ld['kW'], P / 1e3 * {'PQ': 1.0, 'I': v / Vn, 'Z': (v / Vn) ** 2}[model], delta=1e-8)
        self.assertAlmostEqual(want / Vn, 0.97183, delta=1e-5)       # the last one: constant impedance

    def test_loads_between_two_phases(self):
        c = U.case_data('feeder13').configs['601']
        Z = c['Z'] * 4000 / 5280
        Vs, Vll = 4160 / math.sqrt(3) * A, 4160.0
        # one load of constant impedance between a and b at the end of a coupled line: the loop a–b in closed form, and the voltage
        # that its current induces in the phase c, which carries nothing
        fd = two(Z=c['Z'])
        fd.load('L', 'D', 'Z', [600, 0, 0], [250, 0, 0])
        r = U.run(fd, tol=1e-13)
        Zl = Vll ** 2 / complex(600e3, -250e3)
        I = (Vs[0] - Vs[1]) / (Z[0, 0] + Z[1, 1] - Z[0, 1] - Z[1, 0] + Zl)
        want = [Vs[0] - (Z[0, 0] - Z[0, 1]) * I, Vs[1] - (Z[1, 0] - Z[1, 1]) * I, Vs[2] - (Z[2, 0] - Z[2, 1]) * I]
        self.assertLess(max(abs(phasor(r, 'L', p) - want[j]) for j, p in enumerate('abc')) / abs(Vs[0]), 1e-12)
        s = r['sections'][0]
        self.assertAlmostEqual(s['I']['a'], abs(I), delta=1e-9)
        self.assertAlmostEqual(s['I']['b'], abs(I), delta=1e-9)
        self.assertLess(s['I']['c'], 1e-9)
        self.assertGreater(abs(abs(want[2]) / abs(Vs[2]) - 1), 1e-3)                            # the phase without current moves all the same
        # the same load of constant power takes exactly its power at the voltage between its two phases
        fd = two(Z=c['Z'])
        fd.load('L', 'D', 'PQ', [600, 0, 0], [250, 0, 0])
        r = U.run(fd, tol=1e-13)
        s = r['sections'][0]
        Ia = s['I_b']['a'] * np.exp(1j * np.radians(s['angle_b']['a']))
        Sab = (phasor(r, 'L', 'a') - phasor(r, 'L', 'b')) * np.conj(Ia)
        self.assertLess(abs(Sab - complex(600e3, 250e3)), 1e-6)
        # equal loads in delta and in star with the same power per branch are the same load, for every model
        for model in U.MODELS:
            out = []
            for conn in ('Y', 'D'):
                fd = two()
                fd.load('L', conn, model, [500] * 3, [200] * 3)
                out.append(U.run(fd, tol=1e-13))
            self.assertLess(max(abs(phasor(out[0], 'L', p) - phasor(out[1], 'L', p)) for p in 'abc') / abs(Vs[0]), 1e-12, model)
        with self.assertRaises(U.FeederError) as err:                # a load between two phases wants both of them at its bus
            fd = two(Z=[[1.3292 + 1.3475j]], phases='c')
            fd.load('L', 'D', 'PQ', [0, 100, 0], [0, 40, 0])
            U.run(fd)
        self.assertIn('no phase', str(err.exception))

    def test_the_regulators(self):
        # without load a regulator is its ratio: 1 + 0,00625 per tap, each phase on its own
        fd = two()
        fd.bus('R', 4.16)
        fd.lines[0]['a'] = 'R'
        fd.regulator('S', 'R', taps={'a': 10, 'b': -3, 'c': 16})
        r = U.run(fd)
        for p, t in (('a', 10), ('b', -3), ('c', 16)):
            self.assertAlmostEqual(r['buses']['L']['phases'][p]['V'], 1 + 0.00625 * t, delta=1e-12)
        self.assertEqual(U.STEP, 0.00625)
        # with load: the current on the source side is the ratio times the current on the regulated side, and the voltage the other way
        fd13 = U.case_data('feeder13')
        r = U.run(fd13)
        reg = next(s for s in r['sections'] if s['name'] == 'RG60')
        for p, t in PUB['taps'].items():
            self.assertAlmostEqual(reg['I'][p] / reg['I_b'][p], 1 + 0.00625 * t, delta=1e-9)
            self.assertAlmostEqual(r['buses']['RG60']['phases'][p]['V'], 1 + 0.00625 * t, delta=5e-6)
        # the relay: the regulated voltage through the potential transformer less the drop of the compensator, written out here
        e = fd13.regulators[0]
        for p in 'abc':
            Ib = reg['I_b'][p] * np.exp(1j * np.radians(reg['angle_b'][p]))
            self.assertAlmostEqual(r['relay']['RG60'][p], abs(phasor(r, 'RG60', p) / e['pt'] - complex(e['R'], e['X']) * Ib / e['ct']), delta=1e-9)
        # the taps of the document hold the relay within its band of 121 to 123 V
        self.assertEqual(r['band']['RG60'], [121.0, 123.0])
        self.assertTrue(all(121.0 <= v <= 123.0 for v in r['relay']['RG60'].values()))
        self.assertAlmostEqual(r['relay']['RG60']['c'], 122.869, delta=2e-3)
        # found by the control, one tap at a time from neutral: 9, 6, 9 and not the 10, 8, 11 of the document. Both are inside the
        # band; the control stops at the first position inside it, and with one tap less every phase is below it
        ctl = U.run(fd13, regulators='control')
        self.assertEqual((ctl['taps']['RG60'], ctl['rounds'], ctl['settled']), ({'a': 9, 'b': 6, 'c': 9}, 10, True))
        self.assertTrue(all(121.0 <= v <= 123.0 for v in ctl['relay']['RG60'].values()))
        for p in 'abc':
            d = fd13.to_dict()
            d['regulators'][0]['taps'] = dict(ctl['taps']['RG60'], **{p: ctl['taps']['RG60'][p] - 1})
            self.assertLess(U.run(U.Feeder.from_dict(d))['relay']['RG60'][p], 121.0)
        self.assertLess(ctl['worst']['low']['V'], r['worst']['low']['V'])
        # the rule of one tap per 0,75 V, from the relay voltage at neutral to the lower edge of the band, gives 10, 7, 10: one more
        # on every phase, because with loads of constant power the current falls as the voltage rises and a tap is worth 0,79 V
        z = U.run(fd13, regulators='neutral')
        self.assertEqual([math.ceil((121.0 - z['relay']['RG60'][p]) / 0.75) for p in 'abc'], [10, 7, 10])
        for p in 'abc':
            self.assertAlmostEqual((ctl['relay']['RG60'][p] - z['relay']['RG60'][p]) / ctl['taps']['RG60'][p], 0.79, delta=0.01)
        # a regulator written without taps is found by its control whatever the option
        d = fd13.to_dict()
        d['regulators'][0]['taps'] = None
        self.assertEqual(U.run(U.Feeder.from_dict(d))['taps'], ctl['taps'])
        # every tap at zero: the feeder as it is without regulation; phase b still ends above the voltage of the source
        self.assertEqual(set(z['taps']['RG60'].values()), {0})
        self.assertAlmostEqual(z['worst']['low']['V'], 0.8954, delta=1e-4)
        self.assertEqual((z['worst']['high']['bus'], z['worst']['high']['phase']), ('675', 'b'))
        self.assertAlmostEqual(z['worst']['high']['V'], 1.0041, delta=1e-4)
        self.assertAlmostEqual(z['worst']['unbalance']['value'], 2.75, delta=0.01)
        self.assertAlmostEqual(z['losses_kW'], 124.6, delta=0.05)
        self.assertAlmostEqual(z['relay']['RG60']['a'], 114.235, delta=2e-3)
        # a band narrower than the voltage of one tap: the regulator hunts, and the result says so
        d['regulators'][0]['band'] = 0.3
        h = U.run(U.Feeder.from_dict(d))
        self.assertEqual((h['converged'], h['settled'], h['rounds']), (True, False, 35))
        self.assertIn('did not settle', h['message'])
        self.assertAlmostEqual(h['buses']['RG60']['phases']['a']['V'], 1 + 0.00625 * h['taps']['RG60']['a'], delta=5e-6)     # the taps written are those of the voltages written

    def test_as_data_and_what_is_refused(self):
        fd = U.case_data('feeder13')
        back = U.Feeder.from_dict(json.loads(json.dumps(fd.to_dict())))
        r, q = U.run(fd), U.run(back)
        self.assertTrue(np.array_equal(r['_V'], q['_V']))
        self.assertEqual(back.to_dict(), fd.to_dict())
        d = fd.to_dict()                                         # the data are a copy: changing them does not change the feeder
        d['regulators'][0]['taps'] = None
        d['loads'][0]['kW'][0] = 0.0
        self.assertEqual((fd.regulators[0]['taps'], fd.loads[0]['kW'][0]), ({'a': 10, 'b': 8, 'c': 11}, 160.0))
        self.assertIsNone(back.published)                        # the published results stay with the file of the test feeder
        self.assertNotIn('published', fd.to_dict())
        self.assertEqual(U.CASES, ('feeder13',))
        self.assertEqual(sorted(PUB), ['V', 'cap_kvar', 'input_kW', 'input_kvar', 'load_kW', 'losses_kW', 'losses_phase_kW', 'regulated_A', 'section_A', 'section_kW', 'source_A', 'taps'])
        # the rows of a configuration are taken in the order of its phases as written
        f1, f2 = two(Z=[[1, 2], [2, 3]], phases='ac'), two(Z=[[3, 2], [2, 1]], phases='ca')
        self.assertTrue(np.array_equal(f1.configs['c']['Z'], f2.configs['c']['Z']))
        for bad, what in ((lambda: U.case_data('feeder99'), 'unknown feeder'), (lambda: U.run(U.Feeder('x')), 'no source'), (lambda: fd.line('650', '999', 100, '601'), 'unknown bus'),
                          (lambda: fd.line('650', '632', 100, '999'), 'unknown line configuration'), (lambda: fd.load('650', 'X', 'PQ', [1, 1, 1], [0, 0, 0]), 'connection'),
                          (lambda: U.run(fd, regulators='auto'), 'regulators'), (lambda: U.run(fd, spread='thirds'), 'spread'), (lambda: U.run({'a': 1}), 'Feeder'),
                          (lambda: U.Feeder.from_dict({'format': 'pcl-network'}), 'not a feeder'), (lambda: fd.config('x', 'abd', np.eye(3)), 'phases')):
            with self.assertRaises(U.FeederError) as err:
                bad()
            self.assertIn(what, str(err.exception))
        # a load too heavy for its line: no solution, and the result says so instead of raising
        heavy = two(length=40000.0)
        heavy.load('L', 'Y', 'PQ', [9000] * 3, [4000] * 3)
        h = U.run(heavy, max_iter=60)
        self.assertEqual((h['converged'], 'buses' in h), (False, False))
        self.assertIn('did not converge', h['message'])
        # the test feeder with every load two and a half times as large still has a solution (the lowest voltage 0,71 pu, 27
        # iterations for 10 at its own load); with three times it has none
        def scaled(k):
            d = fd.to_dict()
            for e in d['loads'] + d['distributed']:
                e['kW'], e['kvar'] = [x * k for x in e['kW']], [x * k for x in e['kvar']]
            return U.run(U.Feeder.from_dict(d), max_iter=300)
        for k, v, n in ((2.0, 0.812, 17), (2.5, 0.706, 27)):
            x = scaled(k)
            self.assertTrue(x['converged'])
            self.assertAlmostEqual(x['worst']['low']['V'], v, delta=1e-3)
            self.assertLessEqual(abs(x['iterations'] - n), 2)
        self.assertFalse(scaled(3.0)['converged'])

    def test_through_the_study_and_the_report(self):
        q = S.run({'case': 'feeder13', 'study': 'unbalanced', 'view': True})
        s = q['summary']
        self.assertEqual((s['converged'], s['nodes'], s['buses'], s['low']['bus'], s['low']['phase'], s['unbalance']['bus'], s['published']['values'], s['taps']['RG60']),
                         (True, 38, 14, '611', 'c', '675', 35, {'a': 10, 'b': 8, 'c': 11}))
        self.assertLess(s['published']['dV'], 2e-4)
        self.assertLess(s['published']['dangle'], 0.02)
        self.assertEqual(q['layer'], 'unbalance')
        L = next(x for x in q['layers'] if x['layer'] == 'unbalance')
        self.assertIn('μία ή δύο φάσεις', L['legend'][-1][1])
        self.assertEqual([x['layer'] for x in q['layers']], ['base', 'voltage', 'angle', 'violations', 'unbalance'])
        self.assertAlmostEqual(L['bus_v'][list(U.case_data('feeder13').buses).index('675')], s['unbalance']['value'], delta=1e-5)
        self.assertIsNone(L['bus_v'][list(U.case_data('feeder13').buses).index('611')])
        self.assertIn('στον ζυγό 675', netview.values(q['view'], q['result'], 'unbalance')['note_base'])
        # the limits are checked on every phase: the regulator holds its end above 1,05 pu, and phase b stays there at the far end
        viol = netview.values(q['view'], q['result'], 'violations')
        self.assertEqual(sorted(b for b, c in viol['bus_color'].items() if c == netview.BAD), ['671', '675', '680', '692', 'RG60'])
        self.assertAlmostEqual(viol['bus']['675'], 1.0553, delta=2e-4)
        self.assertIn('χαμηλότερη φάση', next(x for x in q['layers'] if x['layer'] == 'voltage')['title'])
        self.assertEqual(len(s['profile']), 14)
        self.assertIsNone(next(x for x in s['profile'] if x['bus'] == '611')['a'])
        # the options reach the engine, and a feeder may come as data
        c = S.run({'case': 'feeder13', 'study': 'unbalanced', 'options': {'regulators': 'control', 'spread': 'middle'}})['summary']
        self.assertEqual((c['taps']['RG60'], c['spread'], c['regulators']), ({'a': 9, 'b': 6, 'c': 9}, 'middle', 'control'))
        d = S.run({'feeder': U.case_data('feeder13').to_dict(), 'study': 'unbalanced'})['summary']
        self.assertAlmostEqual(d['losses_kW'], s['losses_kW'], delta=1e-12)
        self.assertNotIn('published', d)
        rep = S.report({'case': 'feeder13', 'study': 'unbalanced'})
        for part in ('Ασύμμετρη (τριφασική) ροή φορτίου τροφοδότη', 'Τάση ανά φάση', 'Απέναντι στη δημοσίευση', 'Ρυθμιστές τάσης', 'Ζώνη (V)', 'Είσοδος ανά φάση', 'Τμήματα', 'Φορτία και πυκνωτές'):
            self.assertIn(part, rep['html'])
        self.assertTrue(rep['name'].endswith('_unbalanced.html'))
        for bad in ({'case': 'ieee14', 'study': 'unbalanced'}, {'study': 'unbalanced'}, {'case': 'feeder13', 'study': 'unbalanced', 'options': {'regulators': 'x'}},
                    {'feeder': {'format': 'x'}, 'study': 'unbalanced'}):
            with self.assertRaises(S.StudyError):
                S.run(bad)
        # the feeder is not a network of the other studies
        self.assertNotIn('feeder13', N.CASES + N.MORE)
        self.assertEqual(S.FEEDER_STUDIES, ('unbalanced',))
        self.assertNotIn('unbalanced', S.STUDIES)


if __name__ == '__main__':
    unittest.main()
