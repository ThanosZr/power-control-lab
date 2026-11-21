"""5.0.3 (ROADMAP §96 B.2, THEORY §8ΩΗ): the rest of the network as an equivalent at the fundamental (pcl/equivalent.py).
Ward and extended Ward give the base case of the full network at every kept bus; the branch of the Kron reduction is the one
of an independent implementation (pandapower 3.5.6, grid_equivalents, on its case9 with the boundary buses 5 and 9: the
same network as our IEEE 9); the extended Ward answers outages better than the Ward when the external generators hold
their voltages (the case its paper was written for); the Norton of the boundary gives the current that flows into the
external network in the full solution; the equivalent for the short circuit gives the same I″k of IEC 60909-0 at every
kept bus, for every kind of fault, and the values of IEC TR 60909-4 with the reduced network.

5.0.4 (THEORY §8ΩΘ): the equivalent in EMT after CIGRE TB 39, Fig. 15 (pcl.equivalent.emt_ports and to_emt, the part EQV3):
its admittances are those of the load flow, the current at the boundary is the one of the full solution, the study area
starts in the steady state of the load flow, a fault in it gives the current of the full network in EMT, and one port of
EQV3 is the GRID3 with the same data."""
import copy
import shutil
import unittest

import numpy as np

from pcl import network as N
from pcl import equivalent as Q
from tests.test_network import tr60909_4, IK, IK1


def base_error(net, eq, lf):
    r = eq['net'].power_flow(tol=1e-12)
    keep = eq['internal'] + eq['boundary']
    return r['converged'], max(abs(Q._v(r, k) - Q._v(lf, k)) for k in keep)


class TestEquivalent(unittest.TestCase):

    def test_split(self):
        net = N.ieee(14)
        I, B, E = Q.split(net, ['4', '5'])               # the side with the slack (bus 1) is external
        self.assertEqual(sorted(E, key=int), ['1', '2', '3'])
        self.assertEqual(B, ['4', '5'])
        self.assertEqual(len(I), 9)
        I, B, E = Q.split(net, ['4', '5'], internal=['1'])
        self.assertEqual(sorted(I, key=int), ['1', '2', '3'])
        self.assertEqual(len(E), 9)
        with self.assertRaises(Q.EquivalentError):
            Q.split(net, ['99'])
        with self.assertRaises(Q.EquivalentError):
            Q.split(net, ['4'], internal=['1'])          # bus 5 joins the two sides: no boundary between them

    def test_base_case_exact(self):
        for case, B, I in ((14, ['4', '5'], ['1']), (14, ['6', '7', '9'], None), (30, ['9', '10', '12', '27'], None), (30, ['4', '6', '28'], ['1'])):
            net = N.ieee(case)
            lf = net.power_flow(tol=1e-12)
            for kind in ('ward', 'xward'):
                eq = net.equivalent(B, I, kind=kind, lf=lf, tol=1e-12)
                ok, err = base_error(net, eq, lf)
                self.assertTrue(ok, (case, B, kind))
                self.assertLess(err, 1e-10, (case, B, kind, err))
                if eq['slack']:
                    self.assertIn(eq['slack'], B)
                    self.assertTrue(any(e['kind'] == 'feeder' and e['bus'] == eq['slack'] for e in eq['net'].elements))

    def test_kron_branch_as_pandapower(self):
        # pandapower 3.5.6, grid_equivalents.get_equivalent(case9, 'ward', boundary_buses=[4, 8], internal_buses=[0]):
        # the impedance between the boundary buses, rft_pu, xft_pu
        net = N.ieee(9)
        eq = net.equivalent(['5', '9'], ['1'], kind='ward', tol=1e-12)
        self.assertEqual(sorted(eq['external'], key=int), ['2', '3', '6', '7', '8'])
        z = 1 / (-eq['Y'][0, 1])
        self.assertAlmostEqual(z.real, 0.076758735506354, delta=1e-12)
        self.assertAlmostEqual(z.imag, 0.4658190326112427, delta=1e-12)
        self.assertLess(eq['asym'], 1e-12)

    def test_extended_ward_answers_outages(self):
        # IEEE 30: the slack inside, the generators 11 and 13 beyond the boundary (the 33 kV side): every outage of a branch
        # of the study area. Measured (5.0.3): Ward 0.0327 pu at most, extended Ward 0.0049
        net = N.ieee(30)
        lf = net.power_flow(tol=1e-12)
        res = {}
        for kind in ('ward', 'xward'):
            eq = net.equivalent(['4', '6', '28'], ['1'], kind=kind, lf=lf, tol=1e-12)
            c = Q.compare(net, eq, tol=1e-10)
            ok = [o for o in c['outages'] if 'dV' in o]
            self.assertEqual(len(ok), len(c['outages']))
            self.assertLess(c['base']['dV'], 1e-10)
            res[kind] = (max(o['dV'] for o in ok), max(o['dA'] for o in ok))
        self.assertEqual(len(eq['fictitious']), 3)
        self.assertAlmostEqual(res['ward'][0], 0.0327, delta=5e-4)
        self.assertLess(res['xward'][0], 0.006)
        self.assertLess(res['xward'][0], res['ward'][0] / 5)
        self.assertLess(res['xward'][1], res['ward'][1] / 5)

    def test_norton_current(self):
        # the current that flows from the boundary buses into the external network in the full solution = Y_eq·V_B − I_eq
        for case, B, I in ((14, ['4', '5'], ['1']), (30, ['9', '10', '12', '27'], None)):
            net = N.ieee(case)
            lf = net.power_flow(tol=1e-12)
            eq = net.equivalent(B, I, kind='norton', lf=lf, tol=1e-12)
            self.assertIsNone(eq['net'])
            names, idx, Y = Q._ymat(net)
            V = np.array([Q._v(lf, b) for b in names])
            ret = Q._retained(net, eq['external'])
            rn, ridx, Yr = Q._ymat(ret)
            Vr = np.array([Q._v(lf, b) for b in rn])
            Iext = (Y @ V)[[idx[b] for b in B]] - (Yr @ Vr)[[ridx[b] for b in B]]
            VB = V[[idx[b] for b in B]]
            self.assertLess(np.max(np.abs(eq['Y'] @ VB - eq['I'] - Iext)), 1e-10)
            # with the machines (generators behind x″d, loads as admittances): the same current at the base case
            self.assertLess(np.max(np.abs(eq['Ym'] @ VB - eq['Im'] - Iext)), 1e-10)
            # the Thevenin: open circuit voltages and the short-circuit power of each port
            self.assertLess(np.max(np.abs(eq['Z'] @ eq['Im'] - eq['E'])), 1e-12)
            self.assertTrue(all(v and v > 0 for v in eq['Sk'].values()))
            with self.assertRaises(Q.EquivalentError):
                Q.compare(net, eq)

    def test_short_circuit_equivalent(self):
        # the sequence networks of IEC 60909-0 reduced to the boundary: the same I″k at every kept bus, four kinds of fault,
        # in the test network of IEC TR 60909-4 (zero sequence with earthing, a three-winding transformer, motors beyond)
        net = tr60909_4()
        for B, I in ((['2', '5'], ['3']), (['5'], ['3']), (['2'], ['3']), (['5'], ['6'])):
            for mode in ('max', 'min'):
                eq = net.equivalent(B, I, kind='sc', mode=mode)
                red = eq['net']
                self.assertEqual(sorted(b for b in red.buses if not b.startswith('~')), sorted(eq['internal'] + eq['boundary']))
                kept = [b for b in red.buses if not b.startswith('~') and red.buses[b]['type'] != 'internal']
                for f in ('3ph', '2ph', '1ph', '2phE'):
                    for b in kept:
                        a = net.short_circuit(b, fault=f, mode=mode)['Ik']
                        self.assertLess(abs(red.short_circuit(b, fault=f, mode=mode)['Ik'] - a) / a, 1e-12, (B, mode, f, b))
        # and the published values with the reduced network (Tables 22 and 23, ±0,02 %)
        red = net.equivalent(['2', '5'], ['3'], kind='sc')['net']
        for k, b in enumerate('2345'):
            self.assertLess(abs(red.short_circuit(b)['Ik'] / 1e3 - IK[k + 1]) / IK[k + 1], 2e-4, b)
            self.assertLess(abs(red.short_circuit(b, fault='1ph')['Ik'] / 1e3 - IK1[k]) / IK1[k], 2e-4, b)
        # IEEE 30: the same three-phase I″k
        net = N.ieee(30)
        red = net.equivalent(['4', '6', '28'], ['1'], kind='sc')['net']
        for b in [b for b in red.buses if not b.startswith('~')]:
            a = net.short_circuit(b)['Ik']
            self.assertLess(abs(red.short_circuit(b)['Ik'] - a) / a, 1e-12, b)


def _fault(pr, bus, kind, t0=0.05, t1=0.12):
    pr = copy.deepcopy(pr)
    pr['components'].append({'id': 'F1', 'type': 'FLT3', 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': 'F1',
                             'params': {'kind': kind, 'ton': t0, 'toff': t1, 'Rf': 0, 'Rg': 0, 'conn': 'bus'}})
    pr['wires'].append({'id': 'wf', 'a': {'c': 'F1', 'p': 'abc'}, 'b': {'c': 'B' + bus, 'p': 'j'}, 'pts': []})
    return pr


class TestEMTPorts(unittest.TestCase):

    def test_admittances_and_boundary_current(self):
        # the stamps of the export are the load flow's Y (without the machines and the loads)
        for case in (9, 14, 30):
            net = N.ieee(case)
            lf = net.load_flow()
            names, idx, Y = Q._ext_y(net, lf, list(net.buses), None, 1)
            for e in net.elements:
                i = idx.get(e.get('bus'))
                if e['kind'] == 'generator':
                    Y[i, i] -= Q._gen3(net, e, None)[0]
                elif e['kind'] == 'load':
                    Vm = abs(Q._v(lf, e['bus']))
                    zz, ii, pp = e['zip']
                    Y[i, i] -= complex(e['P'], -e['Q']) / net.S_base * (zz + ii / Vm + pp / Vm ** 2)
            self.assertLess(np.abs(Y - net.case().Y.toarray()).max(), 1e-12, case)
        # the current into the boundary buses is the one that the external elements draw in the full load flow; the
        # impedances are symmetric, with R ≥ 0 and X > 0 (as matrices) in both sequences; E holds the base case in each figure
        for case, B, I in ((9, ['5', '9'], ['1']), (14, ['6', '7', '9'], None), (30, ['9', '10', '12', '27'], None), (30, ['4', '6', '28'], ['1'])):
            net = N.ieee(case)
            lf = net.load_flow()
            names, idx, Y = Q._ext_y(net, lf, Q.split(net, B, I)[2], None, 1)
            V = np.array([Q._v(lf, b) for b in names])
            iB = [idx[b] for b in B]
            for fig in Q.FIGS:
                q = Q.emt_ports(net, B, I, lf=lf, fig=fig)
                self.assertLess(np.abs(q['I'] + Y[iB] @ V).max(), 1e-10, (case, fig))
                for Z in (q['Z1'], q['Z0']):
                    self.assertGreater(np.linalg.eigvalsh(Z.real).min(), -1e-12)
                    self.assertGreater(np.linalg.eigvalsh(Z.imag).min(), 0)
                if fig == '50':
                    self.assertLess(np.abs(q['V'] - (q['E'] - q['Z1'] @ q['I'])).max(), 1e-12)
        with self.assertRaises(Q.EquivalentError):
            Q.emt_ports(N.ieee(9), ['5', '9'], ['1'], fig='15a')

    def test_surge_impedance_and_capacitance(self):
        # IEEE 9 (345 kV here), boundary 5 and 9 with bus 1 inside: R_s is the lossless surge impedance √(x/b)·Z_b of the one
        # external line at each (5–6, 9–8), C the charging of the external network, all of it shared by the two ports
        net = N.ieee(9)
        q = Q.emt_ports(net, ['5', '9'], ['1'], fig='15b')
        zb = 345e3 ** 2 / 100e6
        br = {(e['a'], e['b']): e for e in net.elements if e['kind'] == 'branch'}
        for k, (a, b) in enumerate((('5', '6'), ('8', '9'))):
            e = br[(a, b)]
            self.assertAlmostEqual(q['Rs'][k], np.sqrt(e['x'] / e['bc']) * zb, delta=1e-9)
        ext = Q.split(net, ['5', '9'], ['1'])[2]
        btot = sum(e['bc'] for e in net.elements if e['kind'] == 'branch' and (e['a'] in ext or e['b'] in ext))
        self.assertAlmostEqual(sum(q['C']), btot / (2 * np.pi * 50 * zb), delta=1e-15)


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class TestEMTArea(unittest.TestCase):

    def test_one_port_is_grid3(self):
        # one port of EQV3 and a GRID3 with the same E, Z₁, Z₀: the same phase currents in a fault at the terminals
        import pcl
        Un, Sb, E, ang = 150e3, 100e6, 1.05, 20.0
        z1, z0 = complex(0.004, 0.05), complex(0.012, 0.16)
        zb = Un * Un / Sb

        def C(cid, typ, params):
            return {'id': cid, 'type': typ, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': cid, 'params': params}
        src = {'EQV3': C('S', 'EQV3', {'Un': repr(Un), 'Sb': Sb, 'E': repr(E), 'ang': repr(ang), 'R1': repr(z1.real), 'X1': repr(z1.imag),
                                       'R0': repr(z0.real), 'X0': repr(z0.imag), 'conn': 'bus'}),
               'GRID3': C('S', 'GRID3', {'Un': Un, 'phase': ang, 'cf': E, 'emf': 'c', 'Sk': E * Un * Un / (abs(z1) * zb), 'XR': z1.imag / z1.real,
                                         'z0': 'ratio', 'Z0Z1': abs(z0) / abs(z1), 'XR0': z0.imag / z0.real, 'conn': 'bus'})}
        out = {}
        for t, c in src.items():
            pr = {'version': 4, 'components': [c, C('J', 'JUNC', {}), C('F1', 'FLT3', {'kind': 'ag', 'ton': 0.012, 'conn': 'bus'})],
                  'wires': [{'id': 'w1', 'a': {'c': 'S', 'p': 'abc1' if t == 'EQV3' else 'abc'}, 'b': {'c': 'J', 'p': 'j'}, 'pts': []},
                            {'id': 'w2', 'a': {'c': 'F1', 'p': 'abc'}, 'b': {'c': 'J', 'p': 'j'}, 'pts': []}]}
            out[t] = pcl.Project(pr).run(0.05, channels=['Y:F1/Ia', 'Y:F1/Ig'], hdiv=400)
        for k in ('Y:F1/Ia', 'Y:F1/Ig'):
            a, b = np.array(out['EQV3'][k]), np.array(out['GRID3'][k])
            self.assertLess(np.max(np.abs(a - b)) / np.max(np.abs(b)), 1e-9, k)

    def test_area_starts_in_the_load_flow(self):
        # IEEE 9, the study area {1, 4} with the boundary 5 and 9: generator 1 keeps the P and Q of the load flow in each figure
        import pcl
        net = N.ieee(9)
        lf = net.load_flow()
        for fig in Q.FIGS:
            pr = net.to_emt(lf, machines=N.IEEE9_MACHINES, boundary=['5', '9'], internal=['1'], fig=fig)
            self.assertEqual(sum(c['type'] == 'EQV3' for c in pr['components']), 1)
            res = pcl.Project(pr).run(0.1, channels=['Y:G1:pe', 'Y:G1:qe'])
            self.assertLess(abs(res['Y:G1:pe'][-1] - lf['buses']['1']['P'] / 100e6), 1e-4, fig)
            self.assertLess(abs(res['Y:G1:qe'][-1] - lf['buses']['1']['Q'] / 100e6), 1e-4, fig)

    def test_fault_against_the_full_network(self):
        # a fault at bus 4 at 50 ms, in the full network in EMT and in the area with the equivalent: the first peak and the rms
        # of the second cycle of i_a within 2 % and 3 % (Fig. 15 at 50 Hz and 15b: the external machines as constant sources behind X″d)
        import pcl
        net = N.ieee(9)
        lf = net.load_flow()
        full = net.to_emt(lf, machines=N.IEEE9_MACHINES)
        for fig in ('50', '15b'):
            area = net.to_emt(lf, machines=N.IEEE9_MACHINES, boundary=['5', '9'], internal=['1'], fig=fig)
            for kind in ('abcg', 'ag'):
                rf = pcl.Project(_fault(full, '4', kind)).run(0.1, channels=['Y:F1/Ia'])
                ra = pcl.Project(_fault(area, '4', kind)).run(0.1, channels=['Y:F1/Ia'])
                t, a, b = np.array(rf.t), np.array(rf['Y:F1/Ia']), np.array(ra['Y:F1/Ia'])
                m1, m2 = (t > 0.05) & (t < 0.07), (t > 0.07) & (t < 0.09)
                self.assertLess(abs(np.abs(b[m1]).max() / np.abs(a[m1]).max() - 1), 0.02, (fig, kind))
                self.assertLess(abs(np.sqrt(np.mean(b[m2] ** 2)) / np.sqrt(np.mean(a[m2] ** 2)) - 1), 0.03, (fig, kind))

    def test_scipy(self):
        # two ports of EQV3 with Fig. 15b, a load, a line between the ports and a fault on one: the browser solver and SciPy give the
        # same fault current from 1,5 ms after the fault on (the instant of the switch itself is handled differently)
        import pcl

        def C(cid, typ, params):
            return {'id': cid, 'type': typ, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': cid, 'params': params}

        def W(a, pa, b, pb, n):
            return {'id': f'w{n}', 'a': {'c': a, 'p': pa}, 'b': {'c': b, 'p': pb}, 'pts': []}
        comps = [C('S', 'EQV3', {'Un': '150e3; 150e3', 'Sb': 100e6, 'E': '1.03; 1.01', 'ang': '5; -3', 'R1': '0.004, -0.001; -0.001, 0.006',
                                 'X1': '0.05, 0.02; 0.02, 0.07', 'R0': '0.012, 0.002; 0.002, 0.015', 'X0': '0.16, 0.05; 0.05, 0.2', 'fig': '15b',
                                 'Rs': '400; 450', 'C': '2e-6; 1.5e-6', 'conn': 'bus'}),
                 C('J1', 'JUNC', {}), C('J2', 'JUNC', {}), C('L1', 'LOAD3', {'Un': 150e3, 'P': 80e6, 'Q': 20e6, 'conn': 'bus'}),
                 C('LN', 'LINE3', {'Un': 150e3, 'R1': 2, 'X1': 20, 'B1': 0, 'conn': 'bus'}), C('F1', 'FLT3', {'kind': 'ag', 'ton': 0.012, 'conn': 'bus'})]
        wires = [W('S', 'abc1', 'J1', 'j', 1), W('S', 'abc2', 'J2', 'j', 2), W('L1', 'abc', 'J1', 'j', 3), W('LN', 'abc1', 'J1', 'j', 4),
                 W('LN', 'abc2', 'J2', 'j', 5), W('F1', 'abc', 'J2', 'j', 6)]
        pr = pcl.Project({'version': 4, 'components': comps, 'wires': wires})
        rb = pr.run(0.04, channels=['Y:F1/Ia'], hdiv=2000)
        rs = pr.run(0.04, channels=['Y:F1/Ia'], solver='scipy', rtol=1e-9)
        t, yb = np.array(rb.t), np.array(rb['Y:F1/Ia'])
        ys = np.interp(t, rs.t, rs['Y:F1/Ia'])
        m = t > 0.0135
        self.assertLess(np.max(np.abs(yb[m] - ys[m])) / np.max(np.abs(yb)), 1e-4)

    def test_tutorial(self):
        # ieee9_eq: the data of its EQV3 are those of emt_ports (at 60 Hz), its reference is the option «Όλο το δίκτυο», and the area
        # with the equivalent at the fundamental gives its fault current within 2 % (first peak) and 3 % (rms of the second cycle)
        import json
        import subprocess
        from pathlib import Path
        import pcl
        W = Path(__file__).resolve().parent.parent / 'web' / 'studio'
        js = ("global.window=globalThis;global.Parts=require(%r);require(%r);require(%r);const t=Tutorials.get('ieee9_eq'),a=JSON.parse(process.argv[1]),o={};"
              "for(const q of t.options)o[q.k]=a[q.k]??q.def;process.stdout.write(JSON.stringify(t.build(o)));") % (str(W / 'parts.js'), str(W / 'netlib.js'), str(W / 'tutorials.js'))

        def tut(**o):
            return json.loads(subprocess.run(['node', '-e', js, json.dumps(o)], capture_output=True, text=True, check=True).stdout)
        net = N.ieee(9)
        net.f = 60.0
        lf = net.load_flow()
        for fig in Q.FIGS:
            q = Q.emt_ports(net, ['5', '9'], ['1'], lf=lf, machines=N.IEEE9_MACHINES, fig=fig)
            p = next(c for c in tut(fig=fig)['components'] if c['type'] == 'EQV3')['params']
            num = lambda v: np.array([float(x) for x in str(v).split(';')])
            mat = lambda v: np.array([[float(x) for x in r.split(',')] for r in str(v).split(';')])
            self.assertLess(np.max(np.abs(num(p['E']) - np.abs(q['E']))), 1e-9, fig)
            self.assertLess(np.max(np.abs(num(p['ang']) - np.degrees(np.angle(q['E'])))), 1e-7, fig)
            for k, Z in (('R1', q['Z1'].real), ('X1', q['Z1'].imag), ('R0', q['Z0'].real), ('X0', q['Z0'].imag)):
                self.assertLess(np.max(np.abs(mat(p[k]) - Z)), 1e-9, (fig, k))
            self.assertLess(np.max(np.abs(num(p['Rs']) - q['Rs'])), 1e-6, fig)
            self.assertLess(np.max(np.abs(num(p['C']) - q['C'])), 1e-15, fig)

        def measure(pr):
            r = pcl.Project(pr).run(0.1, channels=['Y:F1/Ia'])
            t, y = np.array(r.t), np.array(r['Y:F1/Ia'])
            T, t0 = 1 / 60, 0.05
            m = (t > t0 + T) & (t <= t0 + 2 * T)
            return np.abs(y[(t > t0) & (t <= t0 + T)]).max(), np.sqrt(np.trapezoid(y[m] ** 2, t[m]) / (t[m][-1] - t[m][0]))
        for kind in ('abcg', 'ag'):
            full = tut(net='full', fault=kind)
            ref = full['meta']['eq']['ref'][kind]
            pk, rms = measure(full)
            self.assertLess(abs(pk / ref['pk'] - 1), 1e-6, kind)
            self.assertLess(abs(rms / ref['rms'] - 1), 1e-6, kind)
            pk, rms = measure(tut(net='eq', fig='50', fault=kind))
            self.assertLess(abs(pk / ref['pk'] - 1), 0.02, kind)
            self.assertLess(abs(rms / ref['rms'] - 1), 0.03, kind)


if __name__ == '__main__':
    unittest.main()
