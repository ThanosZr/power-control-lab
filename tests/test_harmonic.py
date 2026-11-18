"""The harmonic load flow (4.19.5, ROADMAP §80, pcl/harmonic.py). References that do not use its code: the published load
flow and voltage distortion of the first test system of the Task Force on Harmonics Modeling and Simulation (1999), closed
forms of a two-bus circuit (the harmonic voltage, the order of the parallel resonance, a tuned filter), a line cut into many
short sections for the long-line model, the Fourier series of the ideal bridge currents for the spectra and for the
star–delta rule, a phase-shifting branch for the same rule, and Kirchhoff's current law at every order."""
import json
import math
import unittest

import numpy as np

from pcl import harmonic as H
from pcl import network as N
from pcl import study as S

PUB = json.loads((N.DATA / 'harmonic14.json').read_text(encoding='utf-8'))


def two_bus(Sk=2000e6, x=0.05, B=0.3, P=40e6, Q=10e6, spectrum='six_pulse', R=0.0, X=0.0):
    """A stiff source behind its short-circuit reactance, a branch of reactance x (pu on 100 MVA) to a bus with a capacitor B (or
    a filter R, X, B) and a converter."""
    net = N.Network(50, 100e6, name='two')
    net.bus('A', 110e3)
    net.bus('B', 110e3)
    net.feeder('A', Sk=Sk, RX=0.0, V=1.0, slack=True)
    net.branch_pu('A', 'B', 0.0, x, name='L')
    net.shunt('B', R=R, X=X, B=B, name='C')
    net.load('B', P, Q, name='conv', spectrum=spectrum)
    return net


def wave(delta, n=7200):
    """The line current of an ideal six-pulse bridge over one period (level direct current, no overlap), behind a star–star
    transformer (blocks of 120°) or behind a star–delta one (the stepped wave), as an even function of the angle."""
    th = (np.arange(n) + 0.5) * 2 * np.pi / n
    a = np.degrees(np.arccos(np.cos(th)))                         # the distance from 0° (0…180)
    if not delta:
        return np.where(a < 60, 1.0, np.where(a > 120, -1.0, 0.0)), th
    return np.where(a < 30, 2.0, np.where(a < 90, 1.0, np.where(a < 150, -1.0, -2.0))) / math.sqrt(3), th


class Harmonics(unittest.TestCase):
    def test_the_published_test_system(self):
        net = N.case_data('harmonic14')
        self.assertEqual((len(net.buses), sum(e['kind'] == 'branch' for e in net.elements), [s['load'] for s in H.sources_of(net)]), (16, 22, ['hvdc1', 'hvdc2', 'tcr']))
        # the load flow of the paper (Table 1.1), to its four decimals and two decimals of a degree
        lf = net.power_flow('nr', tol=1e-10)
        sol = N.case_solution('harmonic14')
        self.assertLess(max(abs(lf['buses'][b]['V'] - v) for b, (v, a) in sol.items()), 6e-5)
        self.assertLess(max(abs(lf['buses'][b]['angle'] - a) for b, (v, a) in sol.items()), 0.011)
        r = H.run(net, scan_bus='3')
        self.assertEqual((r['converged'], r['harmonics'], r['skipped']), (True, [5, 7, 11, 13, 17, 19, 23, 25, 29], []))
        thd, pub = {b: q['THD'] for b, q in r['buses'].items()}, PUB['thd']
        # its voltage distortion (Table 1.1). The paper solves with a harmonic iteration and says that current injection «should give
        # close results»: at the HVDC bus and at the SVC bus they are the published ones; the 230 kV buses are within 8 %, the
        # 115 kV buses within 15 %
        self.assertAlmostEqual(thd['3'], pub['3'], delta=0.01)
        self.assertAlmostEqual(thd['8'], pub['8'], delta=0.01)
        self.assertAlmostEqual(thd['2'], pub['2'], delta=0.05)
        for b in ('1', '2', '3', '4', '5', '8'):
            self.assertLess(abs(thd[b] / pub[b] - 1), 0.08, b)
        for b in ('6', '7', '9', '10', '11', '12', '13', '14'):
            self.assertLess(abs(thd[b] / pub[b] - 1), 0.15, b)
        rel = np.array([thd[b] / pub[b] - 1 for b in pub if b not in ('301', '302')])
        self.assertLess(float(np.sqrt(np.mean(rel ** 2))), 0.09)
        # what is not reproduced, written down so that a change is seen: the two converter buses (a fixed current source here, the
        # converter itself in the paper)
        for b in ('301', '302'):
            self.assertAlmostEqual(thd[b] / pub[b], 0.45, delta=0.02)
        # the limits of IEEE Std 519 by voltage level, and who is above them
        self.assertEqual(r['over'], ['1', '2', '3', '5'])
        self.assertEqual([(r['buses'][b]['limit'], r['buses'][b]['limit_thd']) for b in ('3', '9', '8', '301')], [(1.0, 1.5), (1.5, 2.5), (3.0, 5.0), (3.0, 5.0)])
        self.assertEqual((H.limits(400.0), H.limits(20e3), H.limits(69e3), H.limits(110e3), H.limits(161e3), H.limits(400e3)), ((5.0, 8.0), (3.0, 5.0), (3.0, 5.0), (1.5, 2.5), (1.5, 2.5), (1.0, 1.5)))
        self.assertEqual((r['worst']['bus'], r['buses']['3']['worst']), ('301', 25))
        pk = [h for h, _ in r['scan']['peaks']]
        self.assertTrue(any(abs(h - 25.25) < 0.051 for h in pk), pk)        # the resonance that makes the 25th the largest harmonic at bus 3

    def test_twelve_pulse_cancellation(self):
        net = N.case_data('harmonic14')
        src = H.sources_of(net)
        quiet = {'1': (1.0, 0.0)}                                            # a source that injects nothing (it stays out of the passive loads)
        both = H.run(net, [dict(s, spectrum=quiet) if s['load'] == 'tcr' else s for s in src], scan_bus=False)
        one = H.run(net, [s if s['load'] == 'hvdc1' else dict(s, spectrum=quiet) for s in src], scan_bus=False, harmonics=both['harmonics'])
        two = H.run(net, [s if s['load'] == 'hvdc2' else dict(s, spectrum=quiet) for s in src], scan_bus=False, harmonics=both['harmonics'])
        v3 = both['buses']['3']['Vh']
        for h in (5, 7, 17, 19, 29):                                         # the orders 6k ± 1 with k odd cancel at the common bus
            self.assertLess(v3[h], 1e-12, h)
            self.assertGreater(one['buses']['3']['Vh'][h], 1e-4, h)
        for h in (11, 13, 23, 25):                                           # the orders 12k ± 1 add
            self.assertAlmostEqual(v3[h], 2 * one['buses']['3']['Vh'][h], delta=1e-12)
        # superposition, with phases: the voltages of the two bridges alone add to those of both
        for h in both['harmonics']:
            self.assertLess(np.abs(one['_Vh'][h] + two['_Vh'][h] - both['_Vh'][h]).max(), 1e-13, h)
        # as six-pulse (both behind star–star) nothing cancels, and the fifth is the largest
        six = H.run(net, pulse=6, scan_bus=False)
        self.assertEqual((six['buses']['3']['worst'], all(not s['delta'] for s in six['sources'])), (5, True))
        self.assertGreater(six['buses']['3']['THD'], 6 * H.run(net, scan_bus=False)['buses']['3']['THD'])
        # the same star–delta transformers written as phase-shifting branches (±30°), without the flag on the sources: the same
        # harmonic voltages, since a shift turns the other way for the orders of negative sequence
        base = H.run(net, scan_bus=False)
        for ang in (30.0, -30.0):
            d = N.to_dict(net)
            for e in d['elements']:
                if e['name'] in ('T3-302', 'T7-8'):
                    e['angle'] = ang
                if e['name'] in ('hvdc2', 'tcr'):
                    e['delta'] = False
            for b, q in d['buses'].items():                                  # (the load flow needs a start near the shifted angles)
                q['V'], q['angle'] = base['buses'][b]['V'], base['buses'][b]['angle'] - (ang if b in ('302', '8') else 0.0)
            r = H.run(N.from_dict(d), scan_bus=False)
            self.assertTrue(r['converged'])
            self.assertAlmostEqual(r['buses']['302']['angle'] - base['buses']['302']['angle'], -ang, delta=1e-8)
            self.assertLess(max(abs(r['buses'][b]['Vh'][h] - base['buses'][b]['Vh'][h]) for b in base['buses'] for h in base['harmonics']), 1e-13)

    def test_closed_forms_of_two_buses(self):
        Sk, x, B = 2000e6, 0.05, 0.3
        net = two_bus(Sk, x, B)
        r = H.run(net, load_model='none', scan_to=20, scan_step=0.01)
        xs = 100e6 / Sk
        lf = net.power_flow('nr', tol=1e-12)
        I1 = abs(complex(40e6, 10e6) / 100e6 / lf['buses']['B']['V'])
        for h in r['harmonics']:
            Z = 1 / (1j * h * B + 1 / (1j * h * (xs + x)))                   # the capacitor in parallel with the two reactances
            self.assertAlmostEqual(r['buses']['B']['Vh'][h], I1 / h * abs(Z), delta=1e-12)
            self.assertAlmostEqual(r['buses']['A']['Vh'][h], I1 / h * abs(Z) * xs / (xs + x), delta=1e-12)      # the divider of the two reactances
        self.assertAlmostEqual(r['sources'][0]['I1'], I1, delta=1e-12)
        hr = 1 / math.sqrt(B * (xs + x))                                     # the parallel resonance: √(S_k'/Q_c)
        self.assertEqual(len(r['scan']['peaks']), 1)
        self.assertAlmostEqual(r['scan']['peaks'][0][0], hr, delta=0.006)
        self.assertAlmostEqual(hr, math.sqrt((100e6 / (xs + x)) / (B * 100e6)), delta=1e-12)
        self.assertEqual(r['scan']['bus'], 'B')
        # the THD is the root of the sum of the squares over the fundamental
        self.assertAlmostEqual(r['buses']['B']['THD'], 100 * math.sqrt(sum(v * v for v in r['buses']['B']['Vh'].values())) / r['buses']['B']['V'], delta=1e-12)
        # a filter tuned at the fifth order: at that order the bus sees its resistance, and the scan has its dip there
        Rf, Bf = 0.002, 0.3
        f = two_bus(Sk, x, Bf, R=Rf, X=1 / (25 * Bf))
        self.assertAlmostEqual([e for e in f.elements if e['name'] == 'C'][0]['X'] * Bf, 1 / 25)
        q = H.run(f, load_model='none', scan_to=12, scan_step=0.01)
        Z5 = 1 / (1 / Rf + 1 / (5j * (xs + x)))
        self.assertAlmostEqual(q['buses']['B']['Vh'][5], q['sources'][0]['I1'] / 5 * abs(Z5), delta=1e-12)
        self.assertLess(q['buses']['B']['Vh'][5], 0.02 * r['buses']['B']['Vh'][5] + 1e-3)
        self.assertTrue(any(abs(h - 5.0) < 0.011 for h, _ in q['scan']['dips']))
        # the filter gives its reactive power at the fundamental: the load flow has it
        y1 = 1 / complex(Rf, 1 / (25 * Bf) - 1 / Bf)
        e = [e for e in f.elements if e['name'] == 'C'][0]
        self.assertAlmostEqual(e['Q'], -y1.imag * 100e6, delta=1e-3)
        self.assertLess(e['Q'], 0.0)
        # without its filters (and their reactive power) the same network is another load flow
        self.assertFalse(H.run(f, filters=False, scan_bus=False)['filters'])
        self.assertLess(H.run(f, filters=False, scan_bus=False)['buses']['B']['V'], q['buses']['B']['V'])

    def test_the_long_line_against_many_sections(self):
        # a 230 kV line of the test system (2–3) at the 25th order: the hyperbolic corrections against the same line as 400 short sections
        R, X, Bc, n = 0.04697, 0.19794, 0.04380, 400

        def line(sections):
            net = N.Network(60, 100e6)
            for k in range(sections + 1):
                net.bus(f'b{k}', 230e3)
            net.feeder('b0', Sk=5000e6, RX=0.0, V=1.0, slack=True)
            for k in range(sections):
                net.branch_pu(f'b{k}', f'b{k + 1}', R / sections, X / sections, Bc / sections, name=f'L{k}')
            net.load(f'b{sections}', 30e6, 5e6, name='conv', spectrum='six_pulse')
            return net

        one = H.run(line(1), load_model='none', scan_bus=False, harmonics=[5, 11, 25, 37])
        many = H.run(line(n), load_model='none', line_model='pi', scan_bus=False, harmonics=[5, 11, 25, 37])
        lump = H.run(line(1), load_model='none', line_model='pi', scan_bus=False, harmonics=[5, 11, 25, 37])
        for h in (5, 11, 25, 37):
            a, b, c = one['buses']['b1']['Vh'][h], many['buses'][f'b{n}']['Vh'][h], lump['buses']['b1']['Vh'][h]
            self.assertLess(abs(a / b - 1), 2e-4, h)                          # the sections converge to the hyperbolic form (what is left, 6e-5, is the
            _ = c                                                             # fundamental: the load flow of one branch is the nominal π)
        off = {h: abs(lump['buses']['b1']['Vh'][h] / one['buses']['b1']['Vh'][h] - 1) for h in (5, 11, 25, 37)}
        self.assertLess(off[5], 0.05)                                        # one lumped π: a few per cent at the fifth order (γl = 0,47) …
        self.assertGreater(off[11], 0.2)                                     # … 28 % at the eleventh (γl = 1,0) …
        self.assertGreater(off[25], 0.5)                                     # … and nothing like the line at the 25th (γl = 2,3)
        # the corrections themselves: Z' = Z·sinh(γl)/(γl), Y'/2 = (Y/2)·tanh(γl/2)/(γl/2)
        M = H.Model(line(1), line(1).power_flow('nr', tol=1e-10), 'none', 'distributed')
        Yff, Yft, _, _ = M.branches(25)
        z, y = R + 25j * X, 25j * Bc
        g = np.sqrt(z * y)
        self.assertAlmostEqual(abs(-1 / Yft[0] - z * np.sinh(g) / g), 0.0, delta=1e-12)
        self.assertAlmostEqual(abs((Yff[0] + Yft[0]) - y / 2 * np.tanh(g / 2) / (g / 2)), 0.0, delta=1e-12)

    def test_the_spectra_against_fourier(self):
        for delta in (False, True):
            w, th = wave(delta)
            a = {h: 2 * np.mean(w * np.cos(h * th)) for h in range(1, 50)}
            sp = H.six_pulse(49)
            for h in range(2, 50):
                if h in sp:
                    mag, ang = sp[h]
                    want = mag * (1 if ang == 0 else -1) * ((-1) ** round(h / 6) if delta else 1)       # the rule of a source behind a star–delta transformer
                    self.assertAlmostEqual(a[h] / a[1], want, delta=2e-3, msg=(delta, h))
                else:
                    self.assertLess(abs(a[h] / a[1]), 2e-3, (delta, h))       # no even orders, no multiples of three
            self.assertAlmostEqual(a[1], 2 * math.sqrt(3) / math.pi, delta=1e-4)
        self.assertEqual(sorted(H.six_pulse(25)), [1, 5, 7, 11, 13, 17, 19, 23, 25])
        self.assertEqual((H.six_pulse()[5], H.six_pulse()[7], H.six_pulse()[11], H.six_pulse()[13]), ((0.2, 180.0), (1 / 7, 0.0), (1 / 11, 180.0), (1 / 13, 0.0)))
        # a spectrum by name, as a dict, and from a file (orders as strings); what is refused
        self.assertEqual(H.spectrum('hvdc')[5], (0.1941, -67.77))
        self.assertEqual(H.spectrum({'1': [1.0, 0.0], '5': [0.2, 180]}), {1: (1.0, 0.0), 5: (0.2, 180.0)})
        for bad in ('nine_pulse', {5: (0.2, 0.0)}, {1: (0.0, 0.0)}, {1: (1.0, 0.0), 0: (0.1, 0.0)}, {1: 'x'}):
            with self.assertRaises(H.HarmonicError):
                H.spectrum(bad)
        # the angle of a harmonic moves with the fundamental, h times: the same converter at another angle of its current
        net = two_bus()
        base = H.run(net, load_model='none', scan_bus=False)
        turned = H.run(net, [{'load': 'conv', 'spectrum': {h: (m, a + 37.0 * h) for h, (m, a) in H.six_pulse().items()}}], load_model='none', scan_bus=False)
        for h in turned['harmonics']:                                         # a spectrum given against another time origin is the same waveform
            self.assertLess(np.abs(turned['_Vh'][h] - base['_Vh'][h]).max(), 1e-12, h)

    def test_the_load_models(self):
        net = N.Network(50, 100e6)
        net.bus('A', 20e3)
        net.bus('B', 20e3)
        net.feeder('A', Sk=500e6, RX=0.0, V=1.0, slack=True)
        net.branch_pu('A', 'B', 0.0, 0.1, name='L')
        net.load('B', 30e6, 12e6, name='plain')
        net.load('B', 5e6, 1e6, name='conv', spectrum='six_pulse')
        lf = net.power_flow('nr', tol=1e-12)
        V = lf['buses']['B']['V']
        P, Q, h = 0.30, 0.12, 7
        R = V * V / P
        want = {'A': 1 / R + 1 / (1j * h * V * V / Q), 'B': (0.1 * h + 0.9) * (1 / R + 1 / (1j * h * V * V / Q)), 'none': 0.0,
                'C': 1 / (1j * 0.073 * h * R + 1 / (1 / R + 1 / (1j * h * R / (6.7 * Q / P - 0.74))))}
        for m, y in want.items():
            M = H.Model(net, lf, m, 'pi', [{'load': 'conv'}])
            Y = M.Y(h).toarray()
            self.assertAlmostEqual(abs(Y[1, 1] - (1 / (1j * h * 0.1) + y)), 0.0, delta=1e-12, msg=m)       # the branch and the load; the converter is not a load
            self.assertAlmostEqual(abs(Y[0, 0] - (1 / (1j * h * 0.1) + 1 / (1j * h * 0.2))), 0.0, delta=1e-12, msg=m)   # the branch and the source (100/500 pu)
        # a load damps: with it the distortion is lower than without
        thd = {m: H.run(net, load_model=m, scan_bus=False)['buses']['B']['THD'] for m in H.LOAD_MODELS}
        self.assertLess(max(thd['A'], thd['B'], thd['C']), thd['none'])
        self.assertLess(thd['B'], thd['A'])                                   # model B takes more as the order grows
        for kw in ({'load_model': 'D'}, {'line_model': 'exact'}, {'pulse': 24}, {'harmonics': [1, 5]}, {'scan_bus': 'Z'}, {'scan_step': 0.0}):
            with self.assertRaises(H.HarmonicError):
                H.run(net, **kw)

    def test_the_orders_and_kirchhoff(self):
        net = N.case_data('harmonic14')
        r = H.run(net, scan_bus=False)
        M = H.Model(net, net.power_flow('nr', tol=1e-10), 'C', 'distributed', H.sources_of(net))
        c = M.case
        for h in r['harmonics']:
            Yff, Yft, Ytf, Ytt = M.branches(h)
            V = r['_Vh'][h]
            If, It = Yff * V[c.f] + Yft * V[c.t], Ytf * V[c.f] + Ytt * V[c.t]
            out = np.zeros(c.n, complex)
            np.add.at(out, c.f, If)
            np.add.at(out, c.t, It)
            self.assertLess(abs(out[c.idx['7']]), 1e-13, h)                   # a bus with branches only: what comes in goes out
            k = c.br_name.index('T3-301')                                     # the stub of a bridge carries its current, and nothing else
            self.assertAlmostEqual(abs(It[k]), r['sources'][0]['Ih'][h], delta=1e-12)
            self.assertAlmostEqual(r['branches'][k]['Ih'][h], abs(If[k]), delta=1e-15)
        k = c.br_name.index('T3-301')
        b = r['branches'][k]
        self.assertAlmostEqual(b['THD'], 100 * math.sqrt(sum((m / 1.0) ** 2 for h, (m, a) in H.SPECTRA['hvdc'].items() if h > 1)), delta=1e-9)     # the THD of the spectrum itself
        self.assertAlmostEqual(b['Irms'], b['I1'] * math.sqrt(1 + (b['THD'] / 100) ** 2), delta=1e-12)
        # chosen orders; an order of zero sequence is left out and said; nothing left is refused
        q = H.run(net, harmonics=[3, 5, 7, 9], scan_bus=False)
        self.assertEqual((q['harmonics'], q['skipped']), ([5, 7], [3, 9]))
        self.assertIn('ομοπολικές', q['message'])
        self.assertAlmostEqual(q['buses']['3']['Vh'][5], r['buses']['3']['Vh'][5], delta=1e-15)
        with self.assertRaises(H.HarmonicError) as e:
            H.run(net, harmonics=[3, 9])
        self.assertIn('ομοπολικές', str(e.exception))
        # a network without a source, and a source that is not a load of the network
        with self.assertRaises(H.HarmonicError) as e:
            H.run(N.case_data('ieee14'))
        self.assertIn('πηγή αρμονικών', str(e.exception))
        with self.assertRaises(H.HarmonicError):
            H.run(net, [{'load': 'nothing', 'spectrum': 'hvdc'}])
        # a converter on a load of another network: IEEE 14 with an ideal six-pulse bridge in the place of the load of bus 9
        q = N.case_data('ieee14').harmonics([{'load': 'load9', 'spectrum': 'six_pulse'}], harmonics=[5, 7, 11, 13])
        self.assertTrue(q['converged'])
        self.assertEqual((q['scan']['bus'], q['worst']['bus']), ('9', '9'))
        self.assertGreater(q['buses']['9']['THD'], q['buses']['1']['THD'])

    def test_through_the_study_and_the_report(self):
        q = S.run({'case': 'harmonic14', 'study': 'harmonic', 'view': True})
        s = q['summary']
        self.assertEqual((s['converged'], s['over'], s['over_buses'], s['buses'], s['worst']['bus'], s['at']['bus'], s['at']['worst'], s['scan']['bus']), (True, 4, ['1', '2', '3', '5'], 16, '301', '3', 25, '3'))
        self.assertLessEqual(len(s['scan']['h']), 410)
        self.assertEqual(q['layer'], 'thd')
        L = next(x for x in q['layers'] if x['layer'] == 'thd')
        self.assertAlmostEqual(L['bus_v'][list(N.case_data('harmonic14').buses).index('3')], s['at']['THD'], delta=1e-5)
        self.assertIn('πάνω από το όριο', L['legend'][3][1])
        self.assertIn('θεμελιώδης', next(x for x in q['layers'] if x['layer'] == 'voltage')['title'])
        # with a change from the picture the sources stay with the network (a load carries its spectrum)
        e = S.run({'case': 'harmonic14', 'study': 'harmonic', 'edits': [{'op': 'load', 'bus': '9', 'P_MW': 40.0, 'Q_Mvar': 16.6}]})
        self.assertTrue(e['summary']['converged'])
        self.assertEqual(len(e['summary']['sources']), 3)
        self.assertNotAlmostEqual(e['summary']['at']['THD'], s['at']['THD'], places=4)
        # the network as a file and back keeps the filters and the spectra
        back = N.from_dict(json.loads(json.dumps(N.to_dict(N.case_data('harmonic14')))))
        self.assertAlmostEqual(H.run(back, scan_bus='3')['buses']['3']['THD'], s['at']['THD'], delta=1e-12)
        html = N.case_data('harmonic14').report('harmonic', scan_bus='3').html()
        for part in ('Αρμονική ροή φορτίου', 'IEEE Std 519-2014', 'Σάρωση συχνότητας', 'Παράλληλοι συντονισμοί', 'Πηγές αρμονικών', 'Κλάδοι με το πιο παραμορφωμένο ρεύμα'):
            self.assertIn(part, html)
        self.assertIn('Χωρίς τα συντονισμένα φίλτρα', S.report({'case': 'harmonic14', 'study': 'harmonic', 'options': {'filters': False}})['html'])
        with self.assertRaises(S.StudyError) as err:
            S.run({'case': 'ieee14', 'study': 'harmonic'})
        self.assertIn('πηγή αρμονικών', str(err.exception))
        # the test network is not in the lists of the other studies, and it is still a network like the others
        self.assertNotIn('harmonic14', N.CASES)
        self.assertEqual(N.MORE[0], 'harmonic14')                 # (4.20 and 4.20.1 put the DC test networks after it)
        self.assertTrue(S.run({'case': 'harmonic14', 'study': 'pf'})['summary']['converged'])


if __name__ == '__main__':
    unittest.main()
