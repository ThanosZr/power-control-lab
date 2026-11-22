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
EQV3 is the GRID3 with the same data.

5.0.6 (ROADMAP §94 step γ, §96 B.1): the study area as the buses chosen in the diagram (pcl.equivalent.area, pcl.study.area):
the boundary is every chosen bus that touches one that was not chosen, the hidden buses of the three-winding transformers
follow the buses around them, and what the page asks of the engine (the split, the comparison in N−1, the circuit in EMT) is
what the library gives for the same boundary.

5.0.7 (ROADMAP §96 B.3, THEORY §8ΩΙ): the frequency scan of the network beyond the boundary (pcl.equivalent.scan) is the
Thevenin of emt_ports at the fundamental and the input impedance of a line by its formula at every frequency; the Foster
circuit of CIGRE TB 39 Fig. 15a fitted to it (pcl.equivalent.foster) has every element ≥ 0, the EQV3 that the browser builds
from its blocks has their impedance in both sequences, the area starts in the load flow, and a fault in it gives the current
of the full network closer than the equivalent at the fundamental.

5.0.9 (ROADMAP §96 B.3, THEORY §8ΩΚ): the FDNE of many ports (pcl.equivalent.fdne, EQV3 'fdne'), after the paper on
multi-port frequency dependent network equivalents for the EMTP (1993): the fit follows the driving-point impedances of the
scan, the module of its Fig. 1 alone misses them by more, the passivity enforcement leaves no negative eigenvalue of Re Y and
keeps the fit, the circuit of the browser (a π of single branches, some of them negative) has the admittance of the fit in
both sequences, the area starts in the load flow, and a fault gives the current of the full network as close as Fig. 15a for
one port and closer than the equivalent at the fundamental for three."""
import copy
import json
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


class TestAreaFromTheDiagram(unittest.TestCase):
    def test_the_boundary_of_the_chosen_buses(self):
        net = N.ieee9()
        # the area of the tutorial ieee9_eq and of GUIDE §42: the buses 1, 4, 5, 9
        self.assertEqual(Q.area(net, ['1', '4', '5', '9']), Q.split(net, ['5', '9'], ['1']))
        self.assertEqual(Q.area(net, ['9', 5, '4', '1', '4']), (['1', '4'], ['5', '9'], ['2', '3', '6', '7', '8']))   # order, repeats, numbers
        # the area of GUIDE §41 (IEEE 30, boundary 4, 6, 28 around bus 1): chosen as its buses, it gives the same split
        n30 = N.ieee(30)
        I, B, E = Q.split(n30, ['4', '6', '28'], ['1'])
        self.assertEqual(Q.area(n30, I + B), (I, B, E))

    def test_the_hidden_buses_follow_the_buses_around_them(self):
        net = tr60909_4()
        I, B, E = Q.area(net, ['1', '2', '8', '3', '4'])          # every winding of T3 and of T4 chosen: their star points inside
        self.assertEqual((B, E), (['2', '3', '4'], ['5', '6', '7']))
        self.assertTrue({'_T3*', '_T4*', 'T4LV'} <= set(I))
        I, B, E = Q.area(net, ['2', '3', '4', '5', '_T3*', 'T4LV'])  # chosen or not, a hidden bus goes where its neighbours are
        self.assertEqual((I, B), (['3', '4'], ['2', '5']))
        self.assertTrue({'_T3*', '_T4*', 'T4LV'} <= set(E))

    def test_what_is_refused(self):
        net = N.ieee9()
        for buses, why in ((['4', '5'], 'all are boundary buses'), (list(net.buses), 'nothing lies beyond'), (['x'], 'unknown bus x'), ([], 'no bus chosen')):
            with self.assertRaises(Q.EquivalentError) as c:
                Q.area(net, buses)
            self.assertIn(why, str(c.exception))

    def test_what_the_page_asks(self):
        from pcl import study as S
        r = S.area({'case': 'ieee9', 'buses': ['1', '4', '5', '9']})
        self.assertEqual(r, {'what': 'split', 'chosen': 4, 'internal': ['1', '4'], 'boundary': ['5', '9'], 'external': 5, 'branches': 3, 'slack': 'internal'})
        self.assertEqual(S.area({'case': 'ieee9', 'buses': ['5', '6', '7', '8', '9', '2', '3']})['slack'], 'external')
        # the comparison in N−1 is pcl.equivalent.compare on the same equivalent: exact in the base case
        c = S.area({'case': 'ieee9', 'buses': ['1', '4', '5', '9'], 'what': 'compare'})
        net = N.ieee9()
        lf = net.power_flow(tol=1e-10)
        ref = Q.compare(net, net.equivalent(['5', '9'], ['1'], kind='xward', lf=lf, tol=1e-10))
        self.assertEqual((c['kind'], c['fictitious'], c['slack_bus']), ('xward', 2, None))
        self.assertLess(c['compare']['base']['dV'], 1e-9)
        self.assertEqual([o['outage'] for o in c['compare']['outages']], ['br1', 'br2', 'br9'])
        for a, b in zip(c['compare']['outages'], ref['outages']):
            self.assertEqual(a.get('error'), b.get('error'))
            for k in ('dV', 'dA', 'dP'):
                if k in b:
                    self.assertEqual(a[k], b[k], k)
        self.assertEqual(S.area({'case': 'ieee9', 'buses': ['1', '4', '5', '9'], 'what': 'compare', 'kind': 'ward'})['fictitious'], 0)
        # the circuit in EMT is Network.to_emt with the same boundary (and the machines of the IEEE 9)
        e = S.area({'case': 'ieee9', 'buses': ['1', '4', '5', '9'], 'what': 'emt', 'fig': '15b'})
        pr = net.to_emt(machines=N.IEEE9_MACHINES, boundary=['5', '9'], internal=['1', '4'], fig='15b')
        self.assertEqual(json.dumps(e['project'], sort_keys=True), json.dumps(S._clean(pr), sort_keys=True))
        self.assertEqual([c['type'] for c in e['project']['components']].count('EQV3'), 1)
        self.assertEqual(e['project']['meta']['equivalent']['boundary'], ['5', '9'])

    def test_an_island_is_no_convergence_on_every_processor(self):
        # 5.0.7: with br1 out generator 1 is an island; the factorization of the singular Jacobian raises («Factor is exactly
        # singular») on some processors and Newton stops on others (CI 44989872623): compare says «no convergence» both ways
        from unittest import mock
        net = N.ieee9()
        lf = net.power_flow(tol=1e-10)
        eq = net.equivalent(['5', '9'], ['1'], kind='xward', lf=lf, tol=1e-10)
        orig = N.Network.power_flow

        def pf(self, *a, **k):
            if 'br1' not in [e['name'] for e in self.elements]:
                raise RuntimeError('Factor is exactly singular')
            return orig(self, *a, **k)
        self.assertEqual(Q.compare(net, eq)['outages'][0].get('error'), 'no convergence')
        with mock.patch.object(N.Network, 'power_flow', pf):
            out = Q.compare(net, eq)['outages']
        self.assertEqual([o.get('error') for o in out], ['no convergence', None, None])

    def test_what_the_page_is_told_when_it_cannot(self):
        from pcl import study as S
        for q, why in (({'buses': ['4', '5']}, 'όλοι είναι ζυγοί του συνόρου'), ({'buses': ['x']}, 'Άγνωστος ζυγός: x'), ({'buses': []}, 'buses:'),
                       ({'buses': ['1', '4', '5', '9'], 'what': 'sky'}, 'what:'), ({'buses': ['1', '4', '5', '9'], 'what': 'compare', 'kind': 'norton'}, 'kind:'),
                       ({'buses': ['1', '4', '5', '9'], 'what': 'emt', 'fig': '15x'}, 'fig:'),
                       ({'buses': ['1', '4', '5', '9'], 'what': 'emt', 'fig': '15a'}, 'Σχ. 15a είναι για έναν ζυγό στο σύνορο (εδώ 2)'),     # 5.0.7
                       ({'buses': ['1', '4'], 'what': 'emt', 'fig': '15a', 'fmax': 50}, 'fmax: από 100 ως 20000 Hz')):
            with self.assertRaises(S.StudyError) as c:
                S.area({'case': 'ieee9', **q})
            self.assertIn(why, str(c.exception))
        with self.assertRaises(S.StudyError) as c:                 # networks with DC parts are not reduced yet
            S.area({'case': 'mtdc5', 'buses': ['1', '2'], 'what': 'compare'})



class TestFoster(unittest.TestCase):
    """5.0.7: the scan and Fig. 15a (one boundary bus: bus 4 of the IEEE 9, the area {1, 4})."""

    @classmethod
    def setUpClass(cls):
        cls.net = N.ieee(9)
        cls.lf = cls.net.load_flow()
        cls.q = Q.emt_ports(cls.net, ['4'], ['1'], lf=cls.lf, machines=N.IEEE9_MACHINES, fig='15a')

    def test_scan_is_the_thevenin_at_the_fundamental(self):
        # at f₀ the scan gives the Z₁, Z₀ of emt_ports (fig '50'), for one port and for two
        for B, I in ((['4'], ['1']), (['5', '9'], ['1'])):
            S = Q.scan(self.net, B, I, lf=self.lf, machines=N.IEEE9_MACHINES, f=[self.net.f, 300.0])
            q = Q.emt_ports(self.net, B, I, lf=self.lf, machines=N.IEEE9_MACHINES)
            for k in ('Z1', 'Z0'):
                self.assertLess(np.max(np.abs(S[k][0] - q[k])) / np.max(np.abs(q[k])), 1e-12, (B, k))
        S = Q.scan(self.net, ['4'], ['1'], lf=self.lf, machines=N.IEEE9_MACHINES)
        self.assertEqual((len(S['f']), S['f'][0], S['f'][-1]), (301, 5.0, 2000.0))
        self.assertIn(50.0, S['f'].tolist())
        self.assertEqual([round(x) for x in S['peaks'][0]], [123, 329, 678])

    def test_scan_of_a_line_by_its_formula(self):
        # boundary bus A, a 300 km line with charging to the external bus X with a feeder: Z(f) seen from A is the input
        # impedance of the line closed on the feeder, by the formula of the long line (line 'distributed') and of one π section
        net = N.Network(f=50.0)
        for b in ('I', 'A', 'X'):
            net.bus(b, 220e3)
        net.feeder('X', Sk=5e9, RX=0.1, slack=True)
        net.line('I', 'A', 0.05, 0.4, length=50, B=2.8e-6)
        net.line('A', 'X', 0.03, 0.32, length=300, B=3.6e-6)
        net.load('I', 50e6, 10e6)
        zb = 220e3 ** 2 / 100e6
        zf = (0.1 + 1j) / np.hypot(0.1, 1) * 1.1 * 100e6 / 5e9 * zb
        fs = np.array([10.0, 50.0, 137.0, 480.0, 1500.0])
        for line in ('distributed', 'pi'):
            S = Q.scan(net, ['A'], ['I'], f=fs, line=line)
            for f, Z in zip(fs, S['Z1'][:, 0, 0] * zb):
                h = f / 50
                zl = complex(zf.real, zf.imag * h)
                z, y = complex(0.03, 0.32 * h) * 300, 1j * 3.6e-6 * h * 300          # B: S/km at f₀
                if line == 'pi':
                    want = 1 / (y / 2 + 1 / (z + 1 / (y / 2 + 1 / zl)))
                else:
                    zc, gl = np.sqrt(z / y), np.sqrt(z * y)
                    want = zc * (zl + zc * np.tanh(gl)) / (zc + zl * np.tanh(gl))
                self.assertLess(abs(Z / want - 1), 1e-10, (line, f))

    def test_the_fit(self):
        # IEEE 9, bus 4, 5 Hz to 2 kHz: within 5 % rms in each sequence and 0,5 % at f₀, every element ≥ 0; the blocks
        # of the figure alone (no R_p) cannot follow the scan: Z(∞) = ΣR″ against a capacitive network
        F = self.q['foster']
        self.assertLess(F['err1']['rms'], 0.05)
        self.assertLess(F['err0']['rms'], 0.05)
        self.assertLess(max(F['err1']['max'], F['err0']['max']), 0.1)
        self.assertLess(max(F['err1']['f0'], F['err0']['f0']), 0.005)
        b = np.array(F['blocks'])
        self.assertTrue((b >= 0).all() and (b[:, [0, 2]] > 0).all())
        S = Q.scan(self.net, ['4'], ['1'], lf=self.lf, machines=N.IEEE9_MACHINES)
        i0 = S['f'].tolist().index(self.net.f)                     # the matrices of EQV3 at the fundamental: the scan there
        self.assertLess(abs(self.q['Z1'][0, 0] - S['Z1'][i0, 0, 0]) + abs(self.q['Z0'][0, 0] - S['Z0'][i0, 0, 0]), 1e-12)
        P = Q.foster(S['f'], S['Z1'][:, 0, 0], S['Z0'][:, 0, 0], self.net.f, pure=True)
        self.assertGreater(P['err1']['rms'], 0.2)
        self.assertTrue((P['X'][:, 6:] == 0).all())

    def test_the_circuit_is_the_blocks(self):
        # EQV3 with fig '15a' and the blocks of the fit, shorted at its terminals from the steady state (init 'ac'): the current
        # is V/Z₁ (three phases to earth) and 3V/(2Z₁ + Z₀) (phase a to earth) of the blocks at 50, 150, 400 and 700 Hz
        import pcl
        F, zb, Un = self.q['foster'], self.q['foster']['zb'], self.q['Un'][0]
        w = 2 * np.pi * self.net.f
        X = [[b[0] * w / zb, b[1] / zb, b[2] * w / zb, b[3] / zb, b[4] * w * zb, b[5] / zb, zb / b[6] if b[6] else 0.0, zb / b[7] if b[7] else 0.0] for b in F['blocks']]

        def C(cid, typ, params):
            return {'id': cid, 'type': typ, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': cid, 'params': params}
        for f in (50.0, 150.0, 400.0, 700.0):
            z1, z0 = (v[0] * zb for v in Q.foster_z(np.array([1j * f / self.net.f]), X))
            for kind, want in (('abcg', 1 / abs(z1)), ('ag', 3 / abs(2 * z1 + z0))):
                pr = {'version': 4, 'solve': {'init': 'ac'},
                      'components': [C('S', 'EQV3', {'Un': repr(Un), 'f': f, 'fig': '15a', 'F': Q._mat(F['blocks']), 'conn': 'bus'}),
                                     C('J', 'JUNC', {}), C('F1', 'FLT3', {'kind': kind, 'ton': 0, 'conn': 'bus'})],
                      'wires': [{'id': 'w1', 'a': {'c': 'S', 'p': 'abc1'}, 'b': {'c': 'J', 'p': 'j'}, 'pts': []},
                                {'id': 'w2', 'a': {'c': 'F1', 'p': 'abc'}, 'b': {'c': 'J', 'p': 'j'}, 'pts': []}]}
                r = pcl.Project(pr).run(2 / f, channels=['Y:F1/Ia'], hdiv=2000)
                t, y = np.array(r.t), np.array(r['Y:F1/Ia'])
                pk = np.abs(y[t > 1 / f]).max() / (Un / np.sqrt(3) * np.sqrt(2))
                self.assertLess(abs(pk / want - 1), 2e-5, (f, kind))

    def test_area_starts_in_the_load_flow(self):
        import pcl
        pr = self.net.to_emt(self.lf, machines=N.IEEE9_MACHINES, boundary=['4'], internal=['1'], fig='15a')
        eq = [c for c in pr['components'] if c['type'] == 'EQV3']
        self.assertEqual((len(eq), eq[0]['params']['fig'], len(eq[0]['params']['F'].split(';'))), (1, '15a', len(self.q['foster']['blocks'])))
        res = pcl.Project(pr).run(0.1, channels=['Y:G1:pe', 'Y:G1:qe'])
        self.assertLess(abs(res['Y:G1:pe'][-1] - self.lf['buses']['1']['P'] / 100e6), 1e-4)
        self.assertLess(abs(res['Y:G1:qe'][-1] - self.lf['buses']['1']['Q'] / 100e6), 1e-4)

    def test_fault_against_the_full_network(self):
        # a fault at 50 ms at the boundary bus 4 and at bus 1: the first peak and the rms of the second cycle of i_a within 2,5 %
        # of the full network in EMT with Fig. 15a, and the largest difference in the first cycle below that of Fig. 50
        import pcl
        full = self.net.to_emt(self.lf, machines=N.IEEE9_MACHINES)
        areas = {fig: self.net.to_emt(self.lf, machines=N.IEEE9_MACHINES, boundary=['4'], internal=['1'], fig=fig) for fig in ('15a', '50')}
        for bus in ('4', '1'):
            for kind in ('abcg', 'ag'):
                rf = pcl.Project(_fault(full, bus, kind)).run(0.1, channels=['Y:F1/Ia'])
                t, a = np.array(rf.t), np.array(rf['Y:F1/Ia'])
                m1, m2 = (t > 0.05) & (t < 0.07), (t > 0.07) & (t < 0.09)
                dev = {}
                for fig, pr in areas.items():
                    b = np.interp(t, *(np.array(v) for v in (lambda r: (r.t, r['Y:F1/Ia']))(pcl.Project(_fault(pr, bus, kind)).run(0.1, channels=['Y:F1/Ia']))))
                    dev[fig] = np.max(np.abs(b[m1] - a[m1])) / np.max(np.abs(a[m1]))
                    if fig == '15a':
                        self.assertLess(abs(np.abs(b[m1]).max() / np.abs(a[m1]).max() - 1), 0.025, (bus, kind))
                        self.assertLess(abs(np.sqrt(np.mean(b[m2] ** 2)) / np.sqrt(np.mean(a[m2] ** 2)) - 1), 0.025, (bus, kind))
                self.assertLess(dev['15a'], dev['50'], (bus, kind, dev))

    def test_what_is_refused(self):
        for kw, why in (({'boundary': ['5', '9'], 'internal': ['1']}, 'Fig. 15a is for one boundary bus (2 here)'),
                        ({'boundary': ['4'], 'internal': ['1'], 'line': 'bezier'}, 'line: one of pi, distributed'),
                        ({'boundary': ['4'], 'internal': ['1'], 'fmax': 1.0}, 'scan: 0 < fmin < fmax')):
            with self.assertRaises(Q.EquivalentError) as c:
                Q.emt_ports(self.net, lf=self.lf, machines=N.IEEE9_MACHINES, fig='15a', **kw)
            self.assertIn(why, str(c.exception))
        with self.assertRaises(N.NetworkError):
            self.net.to_emt(self.lf, fmax=3000.0)                 # the keywords of the fit only with a boundary

    def test_what_the_browser_refuses(self):
        # the EQV3 of the page: Fig. 15a with two ports, a block without its eight numbers, a block without inductance
        import pcl

        def C(cid, typ, params):
            return {'id': cid, 'type': typ, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': cid, 'params': params}
        two = {'Un': '150e3; 150e3', 'R1': '0.01, 0; 0, 0.01', 'X1': '0.1, 0; 0, 0.1', 'R0': '0.01, 0; 0, 0.01', 'X0': '0.1, 0; 0, 0.1'}
        for prm, why in ((dict(two, F='0.1, 0, 0.1, 0, 1e-6, 0, 0, 0'), 'για μία θύρα'), ({'F': '0.1, 0, 0.1, 0, 1e-6, 0, 0'}, '8 μη αρνητικούς αριθμούς'),
                         ({'F': '0.1, 0, 0.1, 0, -1e-6, 0, 0, 0'}, '8 μη αρνητικούς αριθμούς'), ({'F': '0.1, 0, 0, 0, 1e-6, 0, 0, 0'}, 'L₁ > 0 και L₀ > 0')):
            pr = {'version': 4, 'components': [C('S', 'EQV3', {'fig': '15a', 'conn': 'bus', **prm}), C('R', 'LOAD3', {'Un': 150e3, 'P': 1e6, 'Q': 0, 'conn': 'bus'})],
                  'wires': [{'id': 'w1', 'a': {'c': 'S', 'p': 'abc1'}, 'b': {'c': 'R', 'p': 'abc'}, 'pts': []}]}
            with self.assertRaises(pcl.PclError) as c:
                pcl.Project(pr).run(0.01, channels=['t'])
            self.assertIn(why, str(c.exception))

    def test_what_the_page_asks(self):
        from pcl import study as S
        e = S.area({'case': 'ieee9', 'buses': ['1', '4'], 'what': 'emt', 'fig': '15a'})
        self.assertEqual((e['boundary'], e['fig'], len(e['foster']['blocks'])), (['4'], '15a', len(self.q['foster']['blocks'])))
        self.assertEqual(e['foster']['err1'], self.q['foster']['err1'])
        self.assertEqual(len(e['foster']['f']), len(e['foster']['Z1fit']))
        q = next(c for c in e['project']['components'] if c['type'] == 'EQV3')['params']
        self.assertEqual((q['fig'], q['F']), ('15a', Q._mat(self.q['foster']['blocks'])))



def _rows_at(rows, f0, f):
    """The rows of an FDNE (EQV3 'FD', normalized to f₀) normalized to f: with r = f/f₀ every pole goes as p/r, q/r² and the
    coefficients of the kinds 1–3 as c/r (so that EQV3 can run its sources, here zero, at f)."""
    r = f / f0
    out = []
    for row in rows.split(';'):
        v = [float(x) for x in row.split(',')]
        k = int(v[0])
        p, q = (v[2] / r, v[3] / r ** 2) if k else (v[2], v[3])
        c = [x / r for x in v[4:]] if k in (1, 2, 3) else v[4:]
        out.append(', '.join(repr(x) for x in [v[0], v[1], p, q] + c))
    return '; '.join(out)


class TestFDNE(unittest.TestCase):
    """5.0.9: the FDNE of many ports (IEEE 9 with the boundary 5 and 9, the area {1, 4}; IEEE 14 with 6, 7, 9)."""

    @classmethod
    def setUpClass(cls):
        cls.net = N.ieee(9)
        cls.lf = cls.net.load_flow()
        cls.S = Q.scan(cls.net, ['5', '9'], ['1'], lf=cls.lf, machines=N.IEEE9_MACHINES)
        cls.Y1, cls.Y0 = np.linalg.inv(cls.S['Z1']), np.linalg.inv(cls.S['Z0'])
        cls.F = Q.fdne(cls.S['f'], cls.Y1, cls.Y0, cls.net.f)
        cls.q = Q.emt_ports(cls.net, ['5', '9'], ['1'], lf=cls.lf, machines=N.IEEE9_MACHINES, fig='fdne')

    def test_the_fit(self):
        # Z_kk within 3 % rms, 10 % at most and 0,5 % at f₀ in both sequences, ‖ΔY‖/‖Y‖ within 3 % rms, passive as fitted; the
        # model at f₀ is the scan there; the module of Fig. 1 alone (one RL, one RC, RLC in series: numerators s only) misses more
        F = self.F
        for e in (F['err1'], F['err0']):
            self.assertLess(e['rms'], 0.03)
            self.assertLess(e['max'], 0.1)
            self.assertLess(e['f0'], 0.005)
            self.assertLess(e['Y'], 0.03)
        self.assertTrue(F['is_passive'])
        Y1, Y0 = Q.fdne_y(np.array([1j]), F)
        self.assertLess(np.abs(Y1[0] - np.linalg.inv(self.q['Z1'])).max() / np.abs(Y1[0]).max(), 0.005)
        kinds = [t[0] for t in F['terms']]
        self.assertEqual((kinds.count(0), kinds.count(2), kinds.count(3), kinds.count(4)), (1, F['k'], F['k'], 0))
        P = Q.fdne(self.S['f'], self.Y1, self.Y0, self.net.f, pure=True)
        kinds = [t[0] for t in P['terms']]
        self.assertEqual((kinds.count(0), kinds.count(1), kinds.count(3), kinds.count(4)), (0, 1, 0, 1))
        self.assertGreater(max(P['err1']['max'], P['err0']['max']), 2 * max(F['err1']['max'], F['err0']['max']))

    def test_the_passivity(self):
        # IEEE 14 with three ports: with passive=True no eigenvalue of Re Y is negative from fmin/10 to 10·fmax nor at f → ∞,
        # and the driving-point impedances move by less than 0,5 % rms
        net = N.ieee(14)
        S = Q.scan(net, ['6', '7', '9'], lf=net.load_flow())
        Y1, Y0 = np.linalg.inv(S['Z1']), np.linalg.inv(S['Z0'])
        a = Q.fdne(S['f'], Y1, Y0, net.f)
        b = Q.fdne(S['f'], Y1, Y0, net.f, passive=True)
        self.assertTrue(b['is_passive'] and b['passive'])
        self.assertGreaterEqual(min(b['lam1'], b['lam0']), -1e-9)
        fp = np.logspace(np.log10(0.5), np.log10(2e4), 500)
        for Yp in Q.fdne_y(1j * fp / net.f, b):
            self.assertGreaterEqual(np.linalg.eigvalsh(Yp.real).min(), -1e-9 * np.abs(Yp).max())
        for k in ('err1', 'err0'):
            self.assertLess(abs(b[k]['rms'] - a[k]['rms']), 0.005)

    def test_the_circuit_is_the_fit(self):
        # EQV3 with fig 'fdne' and its sources at zero, port 1 fed by a positive-sequence source and port 2 shorted (a, b, c to
        # earth, or a alone), from the steady state (init 'ac'): the current in phase a at port 2 is the one of the fitted
        # admittance matrices of both sequences at 50, 150, 400 and 700 Hz
        import pcl
        Un, rows = self.q['Un'], self.q['fdne']['rows']
        V = Un[0] / np.sqrt(3) * np.sqrt(2)

        def C(cid, typ, params):
            return {'id': cid, 'type': typ, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': cid, 'params': params}
        for f in (50.0, 150.0, 400.0, 700.0):
            Y1, Y0 = (y[0] for y in Q.fdne_y(np.array([1j * f / self.net.f]), self.F))
            Ya = np.zeros((6, 6), complex)                     # the phase matrix in S: (Y₀ + 2Y₁)/3 on the diagonal of each block
            for i in range(2):
                for j in range(2):
                    k = 100e6 / (Un[i] * Un[j])
                    Ya[3 * i:3 * i + 3, 3 * j:3 * j + 3] = k * ((Y0[i, j] - Y1[i, j]) / 3 * np.ones((3, 3)) + Y1[i, j] * np.eye(3))
            V1 = V * np.array([1, np.exp(-2j * np.pi / 3), np.exp(2j * np.pi / 3)])
            for kind in ('abcg', 'ag'):
                if kind == 'abcg':
                    want = abs((Ya[3:, :3] @ V1)[0])
                else:                                          # phase a of port 2 at earth, b and c open
                    Vbc = np.linalg.solve(Ya[4:, 4:], -Ya[4:, :3] @ V1)
                    want = abs(Ya[3, :3] @ V1 + Ya[3, 4:] @ Vbc)
                prm = {'Un': f'{Un[0]!r}; {Un[1]!r}', 'f': f, 'E': '0; 0', 'R1': '0.01, 0; 0, 0.01', 'X1': '0.1, 0; 0, 0.1',
                       'R0': '0.01, 0; 0, 0.01', 'X0': '0.1, 0; 0, 0.1', 'fig': 'fdne', 'FD': _rows_at(rows, self.net.f, f), 'conn': 'bus'}
                pr = {'version': 4, 'solve': {'init': 'ac'},
                      'components': [C('S', 'EQV3', prm), C('V', 'VAC3', {'Vpk': V, 'f': f, 'phase': 0, 'seq': 'abc', 'Rs': 0, 'Ls': 0, 'conn': 'bus', 'neut': 'gnd'}),
                                     C('J1', 'JUNC', {}), C('J2', 'JUNC', {}), C('F1', 'FLT3', {'kind': kind, 'ton': 0, 'conn': 'bus'})],
                      'wires': [{'id': 'w1', 'a': {'c': 'S', 'p': 'abc1'}, 'b': {'c': 'J1', 'p': 'j'}, 'pts': []},
                                {'id': 'w2', 'a': {'c': 'V', 'p': 'abc'}, 'b': {'c': 'J1', 'p': 'j'}, 'pts': []},
                                {'id': 'w3', 'a': {'c': 'S', 'p': 'abc2'}, 'b': {'c': 'J2', 'p': 'j'}, 'pts': []},
                                {'id': 'w4', 'a': {'c': 'F1', 'p': 'abc'}, 'b': {'c': 'J2', 'p': 'j'}, 'pts': []}]}
                r = pcl.Project(pr).run(2 / f, channels=['Y:F1/Ia'], hdiv=2000)
                t, y = np.array(r.t), np.array(r['Y:F1/Ia'])
                pk = np.abs(y[t > 1 / f]).max()
                self.assertLess(abs(pk / want - 1), 1e-4, (f, kind))

    def test_area_starts_in_the_load_flow(self):
        import pcl
        pr = self.net.to_emt(self.lf, machines=N.IEEE9_MACHINES, boundary=['5', '9'], internal=['1'], fig='fdne')
        eq = [c for c in pr['components'] if c['type'] == 'EQV3']
        self.assertEqual((len(eq), eq[0]['params']['fig'], eq[0]['params']['FD']), (1, 'fdne', self.q['fdne']['rows']))
        res = pcl.Project(pr).run(0.1, channels=['Y:G1:pe', 'Y:G1:qe'])
        self.assertLess(abs(res['Y:G1:pe'][-1] - self.lf['buses']['1']['P'] / 100e6), 1e-4)
        self.assertLess(abs(res['Y:G1:qe'][-1] - self.lf['buses']['1']['Q'] / 100e6), 1e-4)

    def test_fault_against_the_full_network(self):
        # a fault at 50 ms, the first peak and the rms of the second cycle of i_a against the full network in EMT:
        # IEEE 9 with the boundary bus 4 (one port), at buses 4 and 1: within 2,5 %, and within 1 % of Fig. 15a;
        # IEEE 14 with the boundary 6, 7, 9 (three ports, passive), at buses 9 and 13: the peak within 1 %, the rms within 3 %,
        # and the largest difference in the first cycle below that of Fig. 50
        import pcl

        def ia(pr, bus, kind, t=None):
            r = pcl.Project(_fault(pr, bus, kind)).run(0.1, channels=['Y:F1/Ia'])
            return (np.array(r.t), np.array(r['Y:F1/Ia'])) if t is None else np.interp(t, np.array(r.t), np.array(r['Y:F1/Ia']))
        for case, B, I, mach, buses, kw in ((9, ['4'], ['1'], N.IEEE9_MACHINES, ('4', '1'), {}), (14, ['6', '7', '9'], None, None, ('9', '13'), {'passive': True})):
            net = N.ieee(case)
            lf = net.load_flow()
            full = net.to_emt(lf, machines=mach)
            figs = ('fdne', '15a') if case == 9 else ('fdne', '50')
            areas = {fig: net.to_emt(lf, machines=mach, boundary=B, internal=I, fig=fig, **(kw if fig == 'fdne' else {})) for fig in figs}
            for bus in buses:
                for kind in ('abcg', 'ag'):
                    t, a = ia(full, bus, kind)
                    m1, m2 = (t > 0.05) & (t < 0.07), (t > 0.07) & (t < 0.09)
                    pk, rms, dev = {}, {}, {}
                    for fig, pr in areas.items():
                        b = ia(pr, bus, kind, t)
                        pk[fig] = np.abs(b[m1]).max() / np.abs(a[m1]).max() - 1
                        rms[fig] = np.sqrt(np.mean(b[m2] ** 2)) / np.sqrt(np.mean(a[m2] ** 2)) - 1
                        dev[fig] = np.max(np.abs(b[m1] - a[m1])) / np.max(np.abs(a[m1]))
                    if case == 9:
                        self.assertLess(max(abs(pk['fdne']), abs(rms['fdne'])), 0.025, (bus, kind))
                        self.assertLess(max(abs(pk['fdne'] - pk['15a']), abs(rms['fdne'] - rms['15a'])), 0.01, (bus, kind))
                    else:
                        self.assertLess(abs(pk['fdne']), 0.01, (bus, kind))
                        self.assertLess(abs(rms['fdne']), 0.03, (bus, kind))
                        self.assertLess(dev['fdne'], dev['50'], (bus, kind, dev))

    def test_what_is_refused(self):
        import pcl
        with self.assertRaises(Q.EquivalentError) as c:
            Q.emt_ports(self.net, ['5', '9'], ['1'], lf=self.lf, machines=N.IEEE9_MACHINES, fig='fdne', fmax=1.0)
        self.assertIn('scan: 0 < fmin < fmax', str(c.exception))

        def C(cid, typ, params):
            return {'id': cid, 'type': typ, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': cid, 'params': params}

        def pr(fd):
            return {'version': 4, 'components': [C('S', 'EQV3', {'fig': 'fdne', 'FD': fd, 'conn': 'bus'}), C('R', 'LOAD3', {'Un': 150e3, 'P': 1e6, 'Q': 0, 'conn': 'bus'})],
                    'wires': [{'id': 'w1', 'a': {'c': 'S', 'p': 'abc1'}, 'b': {'c': 'R', 'p': 'abc'}, 'pts': []}]}
        for fd in ('2, 1, 0.1, 9.0', '7, 1, 0.1, 9.0, 0.01', '2, 1, 0.1, 0, 0.01', '1, 1, -0.1, 0, 0.01', '2, 2, 0.1, 9.0, 0.01', ''):
            with self.assertRaises(pcl.PclError) as c:
                pcl.Project(pr(fd)).run(0.01, channels=['t'])
            self.assertIn('κάθε όρος του FDNE θέλει 5 αριθμούς', str(c.exception))
        self.assertGreater(len(pcl.Project(pr('2, 1, 0.1, 9.0, 0.01; 2, 0, 0.1, 9.0, -0.01')).run(0.01).t), 1)    # one negative branch runs

    def test_scipy(self):
        # one port of EQV3 with fig 'fdne' and a term of every kind (one of them negative), a load and a fault: the browser solver and
        # SciPy (the flag neg reaches its resistors too) give the same fault current from 1,5 ms after the fault on
        import pcl

        def C(cid, typ, params):
            return {'id': cid, 'type': typ, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': cid, 'params': params}
        fd = '0, 1, 0, 0, 0.5; 1, 1, 0.1, 0, 5; 2, 1, 0.05, 4, 0.2; 3, 1, 0.05, 4, 0.05; 4, 1, 40, 0, 0.3; 1, 0, 0.2, 0, 3; 2, 0, 0.08, 9, 0.1; 3, 0, 0.08, 9, -0.02'
        comps = [C('S', 'EQV3', {'Un': '150e3', 'Sb': 100e6, 'E': '1.02', 'ang': '4', 'fig': 'fdne', 'FD': fd, 'conn': 'bus'}), C('J', 'JUNC', {}),
                 C('L1', 'LOAD3', {'Un': 150e3, 'P': 60e6, 'Q': 15e6, 'conn': 'bus'}), C('F1', 'FLT3', {'kind': 'ag', 'ton': 0.012, 'conn': 'bus'})]
        wires = [{'id': f'w{k}', 'a': {'c': c, 'p': p}, 'b': {'c': 'J', 'p': 'j'}, 'pts': []} for k, (c, p) in enumerate((('S', 'abc1'), ('L1', 'abc'), ('F1', 'abc')))]
        pr = pcl.Project({'version': 4, 'components': comps, 'wires': wires})
        rb = pr.run(0.04, channels=['Y:F1/Ia'], hdiv=2000)
        rs = pr.run(0.04, channels=['Y:F1/Ia'], solver='scipy', rtol=1e-9)
        t, yb = np.array(rb.t), np.array(rb['Y:F1/Ia'])
        ys = np.interp(t, rs.t, rs['Y:F1/Ia'])
        m = t > 0.0135
        self.assertLess(np.max(np.abs(yb[m] - ys[m])) / np.max(np.abs(yb)), 1e-4)

    def test_what_the_page_asks(self):
        from pcl import study as S
        e = S.area({'case': 'ieee9', 'buses': ['1', '4', '5', '9'], 'what': 'emt', 'fig': 'fdne'})
        self.assertEqual((e['boundary'], e['fig'], len(e['fdne']['ports'])), (['5', '9'], 'fdne', 2))
        self.assertEqual(e['fdne']['err1'], self.q['fdne']['err1'])
        self.assertEqual(len(e['fdne']['f']), len(e['fdne']['ports'][1]['Z0fit']))
        q = next(c for c in e['project']['components'] if c['type'] == 'EQV3')['params']
        self.assertEqual((q['fig'], q['FD']), ('fdne', self.q['fdne']['rows']))
        p = S.area({'case': 'ieee9', 'buses': ['1', '4', '5', '9'], 'what': 'emt', 'fig': 'fdne', 'passive': True, 'fmax': 1000})
        self.assertTrue(p['fdne']['passive'] and p['fdne']['is_passive'])
        self.assertEqual(p['fdne']['f'][-1], 1000.0)

if __name__ == '__main__':
    unittest.main()
