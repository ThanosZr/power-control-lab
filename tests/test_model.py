"""5.0.11 (ROADMAP §70 point 1, THEORY §8ΩΛ): the common model, step 1: the load flow and IEC 60909-0 from the drawing.

The drawing becomes buses and elements with its own ids (web/studio/model.js) and a pcl.network.Network (pcl.model):
* every tutorial reads, and what is left out is said (a subcircuit, a part of the network not in the model yet, crossed phases);
* the load flow of the drawing is the EMT start of the drawing (mna.js acInit), an independent solver of the same circuit: with
  the reactances at ω_e = (2/h)·tan(ωh/2) of the trapezoidal rule the two agree to the G_min of 1 nS that the EMT puts on every
  node (THEORY §8ΩΛ.3); for the IEEE 9 and 14 and for an XF3 in every kind of group, with the magnetizing branch in its three
  places, the iron losses, the tap and a step-up;
* a network written by Network.to_emt comes back as the same load flow (IEEE 9: to the rounding);
* IEC 60909-0 of the drawing is the fault current of the phase-domain solution of the same equivalent (netlib.js faultCurrents)
  for the four kinds of fault, and its translation is the network built by hand from the same data (the HV side first, the group
  with its earthing, the tap at the LV side, K_G with cos φ_rG);
* the studies of pcl.study take a drawing ('drawing'), with the results by its ids, the layer of the short circuit and a report.

5.0.12 (THEORY §8ΩΜ), the second step:
* the parts inside subcircuits are in the model with the ids X1/<id>, and a station inside a subcircuit is the same load flow as
  the flat drawing (and the EMT start through the subcircuit);
* an EQV3 gives the load flow of the network it stands for (IEEE 9, Fig. 50, 15b, 15c), is the EMT start of its circuit at ω_e
  for every kind (Fig. 15a: to the 10⁻⁹ that the EMT puts in a zero R; the FDNE: to its G_min), also with ports at two levels,
  and in IEC 60909-0 is its passive network (c·U_n/√3 over Z₁,kk, and Z₀,kk for the single-phase fault);
* a TLM is its exact π at f in the positive sequence: against the EMT start of its CP model the difference is the CP model and
  the step (THEORY §8ΩΜ.3); an untransposed line says how much its sequences are coupled; in IEC 60909-0 its Z′·ℓ."""
import cmath
import copy
import json
import math
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from pcl import model as M
from pcl import network as N
from pcl import study as S

ROOT = Path(__file__).resolve().parents[1]
CASES = ROOT / 'tests' / 'js' / 'model_cases.js'
HAVE_NODE = shutil.which('node') is not None


def node(*args):
    return json.loads(subprocess.run(['node', str(CASES), *args], capture_output=True, text=True, timeout=600, check=True, cwd=str(ROOT)).stdout)


def with_file(what, pr):
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / 'p.json'
        p.write_text(json.dumps(pr), encoding='utf-8')
        return node(what, str(p))


def C(i, t, p):
    return {'id': i, 'type': t, 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': i, 'params': {**p, 'conn': 'bus'}}


def W(k, a, b):
    return {'id': f'w{k}', 'a': {'c': a[0], 'p': a[1]}, 'b': {'c': b[0], 'p': b[1]}, 'pts': []}


def xf_drawing(grp='Dyn11', tap=2.5, mpos='mid', xs1=70, U1=150e3, U2=20e3, i0=1.0, P0=30e3):
    """A GRID3, an XF3, a load, a line and a load; the EMT starts from the phasors (solve.init 'ac')."""
    comps = [C('NET', 'GRID3', {'Un': U1, 'Sk': 3e9, 'XR': 12, 'phase': 10}), C('B1', 'JUNC', {}),
             C('TR', 'XF3', {'grp': grp, 'Sn': 40e6, 'U1': U1, 'U2': U2, 'uk': 11, 'Pk': 150e3, 'i0': i0, 'P0': P0, 'tap': tap, 'mpos': mpos, 'xs1': xs1}),
             C('B2', 'JUNC', {}), C('LD1', 'LOAD3', {'Un': U2, 'P': 20e6, 'Q': 8e6}), C('LN', 'LINE3', {'Un': U2, 'R1': 1.2 * (U2 / 20e3) ** 2, 'X1': 3.5 * (U2 / 20e3) ** 2, 'B1': 40e-6}),
             C('B3', 'JUNC', {}), C('LD2', 'LOAD3', {'Un': U2, 'P': 6e6, 'Q': -1e6})]
    ws = [W(1, ('NET', 'abc'), ('B1', 'j')), W(2, ('TR', 'abc1'), ('B1', 'j')), W(3, ('TR', 'abc2'), ('B2', 'j')), W(4, ('LD1', 'abc'), ('B2', 'j')),
          W(5, ('LN', 'abc1'), ('B2', 'j')), W(6, ('LN', 'abc2'), ('B3', 'j')), W(7, ('LD2', 'abc'), ('B3', 'j'))]
    return {'version': 4, 'components': comps, 'wires': ws, 'solve': {'init': 'ac'}, 'sim': {'hDiv': 400}}


def station_flat():
    """A GRID3, an XF3 and a load (the first half of xf_drawing)."""
    pr = xf_drawing()
    keep = {'NET', 'B1', 'TR', 'B2', 'LD1'}
    pr['components'] = [c for c in pr['components'] if c['id'] in keep]
    pr['wires'] = [w for w in pr['wires'] if w['a']['c'] in keep and w['b']['c'] in keep]
    return pr


def station_in_sub():
    """The same station with the transformer and the load inside a subcircuit (a port of width 3)."""
    flat = station_flat()
    inner = [{'id': 'P1', 'type': 'PORT', 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': 'P1', 'params': {'name': 'hv', 'width': 3}}]
    inner += [c for c in flat['components'] if c['id'] in ('TR', 'B2', 'LD1')]
    iw = [W(1, ('P1', 'p'), ('TR', 'abc1')), W(2, ('TR', 'abc2'), ('B2', 'j')), W(3, ('LD1', 'abc'), ('B2', 'j'))]
    comps = [c for c in flat['components'] if c['id'] in ('NET', 'B1')]
    comps.append({'id': 'X1', 'type': 'SUB', 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': 'Υ/Σ', 'params': {'def': 'stn'}})
    return {**flat, 'components': comps, 'wires': [W(1, ('NET', 'abc'), ('B1', 'j')), W(2, ('X1', 'hv'), ('B1', 'j'))],
            'subcircuits': {'stn': {'title': 'υποσταθμός', 'components': inner, 'wires': iw}}}


EQ_R1, EQ_X1 = [[0.004, 0.001], [0.001, 0.006]], [[0.08, 0.03], [0.03, 0.12]]
EQ_R0, EQ_X0 = [[0.008, 0.002], [0.002, 0.01]], [[0.2, 0.05], [0.05, 0.3]]


def eq_drawing(fig='50', **more):
    """An EQV3 with ports at 150 kV and 20 kV, coupled, and a load at each."""
    mat = lambda a: '; '.join(', '.join(str(x) for x in r) for r in a)
    p = {'Un': '150e3; 20e3', 'Sb': 100e6, 'E': '1.05; 1.02', 'ang': '0; -3', 'R1': mat(EQ_R1), 'X1': mat(EQ_X1), 'R0': mat(EQ_R0), 'X0': mat(EQ_X0),
         'fig': fig, **more}
    comps = [C('EQ', 'EQV3', p), C('A', 'JUNC', {}), C('B', 'JUNC', {}), C('LA', 'LOAD3', {'Un': 150e3, 'P': 60e6, 'Q': 20e6}),
             C('LB', 'LOAD3', {'Un': 20e3, 'P': 15e6, 'Q': 5e6})]
    ws = [W(1, ('EQ', 'abc1'), ('A', 'j')), W(2, ('EQ', 'abc2'), ('B', 'j')), W(3, ('LA', 'abc'), ('A', 'j')), W(4, ('LB', 'abc'), ('B', 'j'))]
    return {'version': 4, 'components': comps, 'wires': ws, 'solve': {'init': 'ac'}, 'sim': {'hDiv': 400}}


def tlm_drawing(tl, U=400e3):
    """A GRID3, a TLM (its parameters tl) and a load."""
    comps = [C('NET', 'GRID3', {'Un': U, 'Sk': 10e9, 'XR': 12, 'phase': 5}), C('B1', 'JUNC', {}), C('LN', 'TLM', tl), C('B2', 'JUNC', {}),
             C('LD', 'LOAD3', {'Un': U, 'P': 400e6, 'Q': 100e6})]
    ws = [W(1, ('NET', 'abc'), ('B1', 'j')), W(2, ('LN', 'abc1'), ('B1', 'j')), W(3, ('LN', 'abc2'), ('B2', 'j')), W(4, ('LD', 'abc'), ('B2', 'j'))]
    return {'version': 4, 'components': comps, 'wires': ws, 'solve': {'init': 'ac'}, 'sim': {'hDiv': 400}}


def filt_drawing():
    """5.1.7: a GRID3 of 20 kV with a load and a FILT3 of each kind on its bus (the cig one with its star isolated)."""
    comps = [C('NET', 'GRID3', {'Un': 20e3, 'Sk': 200e6, 'XR': 8, 'phase': 5}), C('B1', 'JUNC', {}), C('LD', 'LOAD3', {'Un': 20e3, 'P': 8e6, 'Q': 4e6}),
             C('F1', 'FILT3', {'kind': 'c', 'C1': 2e-6}), C('F2', 'FILT3', {'kind': 'st', 'C1': 1e-6, 'L': 0.4, 'R': 5}),
             C('F3', 'FILT3', {'kind': 'hp', 'C1': 1e-6, 'L': 0.05, 'R': 80}), C('F4', 'FILT3', {'kind': 'cig', 'C1': 1e-6, 'L': 0.2, 'R': 10, 'C2': 20e-6, 'Rp': 150, 'neut': 'iso'})]
    ws = [W(1, ('NET', 'abc'), ('B1', 'j')), W(2, ('LD', 'abc'), ('B1', 'j'))] + [W(2 + k, (f'F{k}', 'abc'), ('B1', 'j')) for k in range(1, 5)]
    return {'version': 4, 'components': comps, 'wires': ws, 'solve': {'init': 'ac'}, 'sim': {'hDiv': 400}}


def level_drawing(src):
    """5.1.7: a source, a ZSER3 and a load: src 'vac' a VAC3 at 1,05 pu of 20 kV (behind R_s + jωL_s) and a load of 20 kV; 'grid' a
    GRID3 of 20 kV and a load of 22 kV."""
    s = C('S', 'VAC3', {'Vpk': 1.05 * 20e3 * math.sqrt(2 / 3), 'f': 50, 'phase': 0, 'Rs': 0.1, 'Ls': 2e-3}) if src == 'vac' else \
        C('S', 'GRID3', {'Un': 20e3, 'Sk': 300e6, 'XR': 10, 'phase': 0})
    comps = [s, C('B1', 'JUNC', {}), C('Z', 'ZSER3', {'Rs': 0.4, 'Ls': 8e-3, 'Rp1': 0, 'Lp': 0, 'Rp2': 0}), C('B2', 'JUNC', {}),
             C('LD', 'LOAD3', {'Un': 20e3 if src == 'vac' else 22e3, 'P': 6e6, 'Q': 2e6})]
    ws = [W(1, ('S', 'abc'), ('B1', 'j')), W(2, ('Z', 'abc1'), ('B1', 'j')), W(3, ('Z', 'abc2'), ('B2', 'j')), W(4, ('LD', 'abc'), ('B2', 'j'))]
    if src == 'vac':
        comps.append(C('G0', 'GND', {}))
        ws.append(W(5, ('S', 'n'), ('G0', 'g')))
    return {'version': 4, 'components': comps, 'wires': ws, 'solve': {'init': 'ac'}, 'sim': {'hDiv': 400}}


def tut(tid, **opts):
    """A tutorial with its defaults and the given options."""
    return node('build', tid, json.dumps(opts))


def start_error(test, pr, warped=True):
    """The largest difference (pu and rad) of the voltages of the loads between the load flow of the drawing and its EMT start."""
    o = with_file('start', pr)
    m = with_file('model', pr)
    w = 2 * math.pi * o['f']
    fe = (2 / o['h'] * math.tan(w * o['h'] / 2)) / (2 * math.pi) if warped else None
    r = M.load_flow(m, fe=fe)
    test.assertTrue(r['converged'])
    worst = 0.0
    Un = {b['id']: b['Un'] for b in m['buses']}
    for c in m['elements']:                                 # 5.0.12: the loads inside subcircuits too (ids X1/<id>)
        if c['type'] != 'LOAD3':
            continue
        v0, v1 = o['v'][c['id']]
        if v0 is None or v1 is None:                        # a load of Q only has no resistor (a shunt capacitor)
            continue
        ph = complex(v0, -v1)                               # the samples at 0 and T/4 of √2·|V|·sin(ωt + θ)
        b = c['buses'][0]
        V = abs(ph) / math.sqrt(2) / (Un[b] / math.sqrt(3))  # (5.1.7: per unit of its bus, as the load flow; the load's U_n may differ)
        ang = math.degrees(cmath.phase(ph)) + 90
        q = r['buses'][b]
        worst = max(worst, abs(q['V'] - V), abs((q['angle'] - ang + 180) % 360 - 180) * math.pi / 180)
    return worst


@unittest.skipUnless(HAVE_NODE, 'Node.js')
class TestModel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tut = node('tutorials')

    def test_every_tutorial_reads(self):
        self.assertEqual([k for k, v in self.tut.items() if 'error' in v], [])
        t = self.tut['ieee9_emt']
        self.assertEqual((t['buses'], t['types'], t['skipped']), (9, {'GEN3': 3, 'LINE3': 9, 'LOAD3': 3}, []))
        self.assertEqual(self.tut['net_fault']['buses'], 1)                    # the closed breaker joins its two sides
        self.assertEqual(self.tut['se_emt']['buses'], 9)                       # a PMU in each line is a meter in series
        self.assertEqual((self.tut['ieee9_eq']['types'].get('EQV3'), self.tut['ieee9_eq']['skipped']), (1, []))   # 5.0.12
        self.assertEqual(self.tut['sub_legs']['skipped'], [])                  # the legs inside the subcircuits: no part of a network
        self.assertEqual(self.tut['cable_xb']['types'].get('TLM'), 1)           # the line of three phases; the others have six
        self.assertIn('TLM:mph', self.tut['cable_xb']['skipped'])
        self.assertEqual(self.tut['hvdc_lcc']['types'].get('ZSER3'), 2)        # the level of a bus beyond a series impedance
        t = self.tut['hvdc_lcc']                                               # 5.1.7: the LCC stations and the filters are in the model
        self.assertEqual((t['types'].get('LCCS'), t['types'].get('FILT3'), t['skipped'], t['warnings']), (2, 6, [], 0))

    def test_filters_against_the_emt_start(self):
        """5.1.7: a FILT3 of each kind (c, st, hp, cig; one with its star isolated) is its admittance at ω_e as a shunt: against the
        EMT start as an XF3 is (the G_min of the EMT)."""
        e = start_error(self, filt_drawing())
        self.assertLess(e, 1e-6)
        self.assertGreater(start_error(self, filt_drawing(), warped=False), 2 * e)           # at ω instead of ω_e the difference is larger

    def test_the_level_across_a_series_impedance(self):
        """5.1.7: the buses joined by a ZSER3 are at one level, that of the better rank: a VAC3 at 1,05 pu behind it gives the level
        of the load beyond (no warning: the amplitude of a source is not its level), a GRID3 of 20 kV that of a load of 22 kV beyond
        it (said); the load flow is the EMT start in both. Before 5.1.7 the two buses kept 21 and 20 kV, and the ZSER3 joined them as
        a branch in per unit, an off-nominal ratio that the circuit does not have."""
        pr = level_drawing('vac')
        m = with_file('model', pr)
        self.assertEqual(sorted(b['Un'] for b in m['buses']), [20e3, 20e3])
        self.assertEqual(m['warnings'], [])
        self.assertLess(start_error(self, pr), 1e-6)
        pr = level_drawing('grid')
        m = with_file('model', pr)
        self.assertEqual(sorted(b['Un'] for b in m['buses']), [20e3, 20e3])
        self.assertEqual(len(m['warnings']), 1)
        self.assertIn('χωρίς μετασχηματιστή ανάμεσα', m['warnings'][0])
        self.assertLess(start_error(self, pr), 1e-6)

    def test_round_trip_of_to_emt(self):
        net = N.case_data('ieee9')
        lf = net.load_flow()
        r = M.load_flow(M.of(net.to_emt(lf=lf)))
        self.assertEqual(len(r['buses']), 9)
        for b, v in lf['buses'].items():
            q = r['buses']['B' + b]
            self.assertAlmostEqual(q['V'], v['V'], delta=1e-12)
            self.assertAlmostEqual(q['angle'], v['angle'], delta=1e-10)

    def test_the_emt_start(self):
        for case in ('ieee9', 'ieee14'):
            net = N.case_data(case)
            pr = net.to_emt(lf=net.load_flow())
            e = start_error(self, pr)
            self.assertLess(e, 1e-6, case)                                     # the G_min of the EMT: 4·10⁻⁷ at 345 kV
            self.assertGreater(start_error(self, pr, warped=False), 2 * e, case)   # at ω instead of ω_e the difference is larger

    def test_transformers_against_the_emt_start(self):
        cases = [dict(grp='Dyn11'), dict(grp='Yd1'), dict(grp='YNyn0'), dict(grp='Dd0'), dict(grp='Dyn11', mpos='w1'), dict(grp='Dyn11', mpos='w2'),
                 dict(grp='Yd1', U1=20e3, U2=150e3), dict(grp='Dyn11', U1=20e3, U2=150e3, tap=-5)]
        for kw in cases:
            self.assertLess(start_error(self, xf_drawing(**kw)), 1e-6, kw)

    def test_iec60909_against_the_phase_domain(self):
        o = node('faults')
        m = o['model']
        for kind, ft in (('abc', '3ph'), ('ag', '1ph'), ('ab', '2ph'), ('abg', '2phE')):
            for e in m['elements']:
                if e['type'] == 'FLT3':
                    e['params']['kind'] = kind
            s = M.short_circuit(m, ft)
            f = next(iter(s['faults'].values()))
            cur = o['cur'][kind]
            ref = max(cur['a'], cur['b']) if ft != '1ph' else cur['a']
            self.assertAlmostEqual(f['Ik'] / ref, 1, delta=2e-4, msg=kind)      # the phase domain has R = 10⁻⁴ Ω in the fault
            if ft == '2phE':
                self.assertAlmostEqual(f['IkE'] / cur['g'], 1, delta=2e-4)

    def test_iec60909_translation(self):
        comps = [C('Q', 'GRID3', {'Un': 110e3, 'Sk': 5e9, 'XR': 10, 'Z0Z1': 1.2, 'XR0': 8}), C('A', 'JUNC', {}),
                 C('T1', 'XF3', {'grp': 'Dyn11', 'Sn': 40e6, 'U1': 110e3, 'U2': 20e3, 'uk': 12, 'Pk': 160e3, 'neut2': 'z', 'Rng2': 5, 'Xng2': 0}), C('B', 'JUNC', {}),
                 C('T2', 'XF3', {'grp': 'Dyn1', 'Sn': 30e6, 'U1': 10.5e3, 'U2': 20e3, 'uk': 10, 'Pk': 90e3, 'tap': 2.5}), C('G', 'JUNC', {}),
                 C('G1', 'GEN3', {'Sn': 25e6, 'Un': 10.5e3, 'Xdpp': 0.15, 'cosr': 0.8, 'X0': 0.08, 'neut': 'iso'}),
                 C('L1', 'LINE3', {'Un': 20e3, 'R1': 0.8, 'X1': 2.4, 'B1': 0, 'z0': 'given', 'R0': 2.4, 'X0': 7.2, 'B0': 0}), C('Cb', 'JUNC', {}),
                 C('LD', 'LOAD3', {'Un': 20e3, 'P': 5e6, 'Q': 2e6})]
        ws = [W(1, ('Q', 'abc'), ('A', 'j')), W(2, ('T1', 'abc1'), ('A', 'j')), W(3, ('T1', 'abc2'), ('B', 'j')), W(4, ('T2', 'abc2'), ('B', 'j')),
              W(5, ('T2', 'abc1'), ('G', 'j')), W(6, ('G1', 'abc'), ('G', 'j')), W(7, ('L1', 'abc1'), ('B', 'j')), W(8, ('L1', 'abc2'), ('Cb', 'j')),
              W(9, ('LD', 'abc'), ('Cb', 'j'))]
        m = with_file('model', {'version': 4, 'components': comps, 'wires': ws})
        net = N.Network()
        for b, U in (('A', 110e3), ('B', 20e3), ('G', 10.5e3), ('Cb', 20e3)):
            net.bus(b, U)
        Z1 = 1.1 * 110e3 ** 2 / 5e9
        X1 = Z1 * 10 / math.sqrt(101)
        X0 = 1.2 * Z1 * 8 / math.sqrt(65)
        net.feeder('A', Sk=5e9, RX=0.1, X0X=X0 / X1, R0X0=1 / 8)
        net.transformer('A', 'B', 40e6, 110e3, 20e3, 12, 0.4, group='Dyn11', Zn_lv=5)
        net.transformer('B', 'G', 30e6, 20e3, 10.5e3, 10, 0.3, group='YNd11', tap=100 * (1 / 1.025 - 1))
        net.generator('G', 25e6, 10.5e3, 0.15, 0.8, X0=0.08, earthed=False)
        net.line('B', 'Cb', 0.8, 2.4, 1, R0=2.4, X0=7.2)
        for ft in ('3ph', '1ph', '2phE'):
            s = M.short_circuit(m, ft)
            for b in ('A', 'B', 'G', 'Cb'):
                ref = net.short_circuit(b, ft)
                self.assertAlmostEqual(s['buses'][b]['Ik'] / ref['Ik'], 1, delta=1e-12, msg=(ft, b))
        self.assertEqual(s['notes'], [])

    def test_studies_of_a_drawing(self):
        net = N.case_data('ieee9')
        m = M.of(net.to_emt())
        r = S.run({'drawing': m, 'study': 'pf', 'view': True})
        self.assertTrue(r['summary']['converged'])
        self.assertEqual(sorted(r['result']['elements']), sorted(e['id'] for e in m['elements']))
        g = r['result']['elements']['G2']
        self.assertAlmostEqual(g['P'] / 1e6, 163, delta=1e-6)                  # the dispatch of the case, through the drawing
        x = r['result']['elements']['br1']
        self.assertAlmostEqual(x['Pa'] + x['Pb'], x['loss'], delta=1e-6)
        f = S.run({'drawing': node('faults')['model'], 'study': 'sc', 'options': {'fault': '1ph'}, 'view': True})
        self.assertEqual(f['layer'], 'sc')
        self.assertEqual([q['id'] for q in f['summary']['faults']], ['F1'])
        self.assertIn('IEC 60909-0', S.report({'drawing': node('faults')['model'], 'study': 'sc'})['html'])
        with self.assertRaises(S.StudyError):                                   # the test networks have no data of the machines
            S.run({'case': 'ieee14', 'study': 'sc'})

    def test_topology(self):
        pr = xf_drawing()
        open_cb = copy.deepcopy(pr)                                             # a breaker open at t = 0 between B2 and the line
        open_cb['components'].append(C('CB', 'CB3', {'cmd': '0:0, 0.1:1'}))
        open_cb['wires'] = [w for w in open_cb['wires'] if w['id'] != 'w5'] + [W(8, ('CB', 'abc1'), ('B2', 'j')), W(9, ('CB', 'abc2'), ('LN', 'abc1'))]
        m = with_file('model', open_cb)
        self.assertEqual(len(m['buses']), 4)
        r = M.load_flow(m)
        self.assertEqual(sorted(r['out']), ['B3', 'CB.abc2'])                 # beyond the open breaker no source: out of the study
        self.assertEqual(r['elements']['CB'], {'closed': False})
        crossed = copy.deepcopy(pr)                                             # phases b and c swapped on one side of the line
        for c in crossed['components']:
            if c['id'] in ('LN', 'B3', 'LD2'):
                c['params']['conn'] = 'abc'
        crossed['components'] = [c for c in crossed['components'] if c['id'] != 'B3']
        crossed['wires'] = [w for w in crossed['wires'] if w['id'] not in ('w5', 'w6', 'w7')] + [W(8, ('LN', 'a2'), ('LD2', 'a')), W(9, ('LN', 'b2'), ('LD2', 'c')), W(10, ('LN', 'c2'), ('LD2', 'b'))]
        crossed['components'].append(C('EB', 'EBUS', {}))
        crossed['wires'] += [W(11, ('EB', 'bus'), ('B2', 'j')), W(12, ('EB', 'a'), ('LN', 'a1')), W(13, ('EB', 'b'), ('LN', 'b1')), W(14, ('EB', 'c'), ('LN', 'c1'))]
        m = with_file('model', crossed)
        self.assertEqual(sorted(s['id'] for s in m['skipped'] if s['why'] == 'phases'), ['LD2', 'LN'])

    def test_subcircuits(self):
        sub = station_in_sub()
        m = with_file('model', sub)
        self.assertEqual(sorted(e['id'] for e in m['elements']), ['NET', 'X1/LD1', 'X1/TR'])
        self.assertEqual((sorted(b['id'] for b in m['buses']), m['skipped']), (['B1', 'X1/B2'], []))
        flat = with_file('model', station_flat())
        r, q = M.load_flow(m), M.load_flow(flat)
        for b, b0 in (('B1', 'B1'), ('X1/B2', 'B2')):
            self.assertAlmostEqual(r['buses'][b]['V'], q['buses'][b0]['V'], delta=1e-12)
            self.assertAlmostEqual(r['buses'][b]['angle'], q['buses'][b0]['angle'], delta=1e-10)
        self.assertEqual(r['elements']['X1/LD1'], q['elements']['LD1'])
        self.assertLess(start_error(self, sub), 1e-6)                          # the EMT start through the subcircuit

    def test_equivalents(self):
        full = M.load_flow(with_file('model', tut('ieee9_eq', net='full', fault='none')))
        for fig in ('50', '15b', '15c'):
            pr = tut('ieee9_eq', fig=fig, fault='none')
            r = M.load_flow(with_file('model', pr))
            for b, v in r['buses'].items():                                    # the network it stands for, at the buses kept
                self.assertAlmostEqual(v['V'], full['buses'][b]['V'], delta=1e-8, msg=(fig, b))
                self.assertAlmostEqual(v['angle'], full['buses'][b]['angle'], delta=1e-6, msg=(fig, b))
            self.assertLess(start_error(self, pr), 1e-6, fig)
        net = N.case_data('ieee9')
        lf = net.load_flow()
        # Fig. 15a: the EMT lifts the zero R′ of one sequence to 10⁻⁹ of the other (a conductance of 10⁸ S); with R′₀ = R′₁/10
        # in the same branches the two agree to 10⁻¹² (THEORY §8ΩΜ.4)
        self.assertLess(start_error(self, net.to_emt(lf=lf, boundary=['4'], fig='15a')), 1e-5)
        self.assertLess(start_error(self, net.to_emt(lf=lf, boundary=['5', '9'], fig='fdne')), 5e-5)   # the G_min of 1 073 nodes

    def test_equivalent_at_two_levels(self):
        for fig, more in (('50', {}), ('15b', {'Rs': '300; 40', 'C': '1e-6; 5e-6'}), ('15c', {'Rs': '2000; 50'})):
            self.assertLess(start_error(self, eq_drawing(fig, **more)), 1e-6, fig)
        m = with_file('model', eq_drawing())
        s3, s1 = M.short_circuit(m, '3ph'), M.short_circuit(m, '1ph')
        for k, (b, U) in enumerate((('A', 150e3), ('B', 20e3))):
            zb = U * U / 100e6
            Z1, Z0 = complex(EQ_R1[k][k], EQ_X1[k][k]) * zb, complex(EQ_R0[k][k], EQ_X0[k][k]) * zb
            self.assertAlmostEqual(s3['buses'][b]['Ik'] / (1.1 * U / math.sqrt(3) / abs(Z1)), 1, delta=1e-12)
            self.assertAlmostEqual(s1['buses'][b]['Ik'] / (3 * 1.1 * U / math.sqrt(3) / abs(2 * Z1 + Z0)), 1, delta=1e-12)

    def test_lines_from_geometry(self):
        from pcl import lineconst as LC
        typ = node('typical')['400kV']
        modal = {'src': 'modal', 'nph': 3, 'mlen': 100, 'lu': 'km', 'mspec': 'zv', 'transp': '1', 'mdata': '0.25, 650, 2.2e5; 0.03, 280, 2.95e5'}
        self.assertLess(start_error(self, tlm_drawing(modal)), 3e-5)           # the CP model and the step (THEORY §8ΩΜ.3)
        for ti, most in (('balanced', 3e-5), ('gm0', None)):
            tl = {'model': 'cp', 'f': 50, 'len': 100, 'data': json.dumps(typ), 'ti': ti}
            tl['mdl'] = json.dumps({**LC.jsonable(LC.cp_model(typ, 50.0, 100.0, ti=ti)), 'src': with_file('key', tl)['key']})
            pr = tlm_drawing(tl)
            r = M.load_flow(with_file('model', pr))
            c = r['elements']['LN']['coupling']
            if most:
                self.assertLess(c, 1e-9)
                self.assertLess(start_error(self, pr), most)
            else:
                self.assertGreater(c, 0.05)                                    # the horizontal line without transposition
        # IEC 60909-0: the line with Z₁ and Z₀ of Z′·ℓ in symmetrical components
        tl = {'model': 'cp', 'f': 50, 'len': 100, 'data': json.dumps(typ)}
        s = M.short_circuit(with_file('model', tlm_drawing(tl)), '1ph')
        Zs = LC.to_sym(LC.phase_matrices(typ, 50.0)[0]) * 100e3
        net = N.Network()
        net.bus('B1', 400e3)
        net.bus('B2', 400e3)
        X0X = (10 / math.sqrt(101)) / (12 / math.sqrt(145))                     # the GRID3: Z₀ = Z₁ with X₀/R₀ = 10, X/R = 12
        net.feeder('B1', Sk=10e9 * N.c_factor(400e3, 'max') / 1.1, RX=1 / 12, X0X=X0X, R0X0=0.1, Un=400e3)
        net.line('B1', 'B2', Zs[1, 1].real, Zs[1, 1].imag, 1, R0=Zs[0, 0].real, X0=Zs[0, 0].imag)
        self.assertAlmostEqual(s['buses']['B2']['Ik'] / net.short_circuit('B2', '1ph')['Ik'], 1, delta=1e-12)

    def test_project_model(self):
        from pcl import core
        pr = xf_drawing()
        self.assertEqual(core.Project(pr).model(), with_file('model', pr))


if __name__ == '__main__':
    unittest.main()
