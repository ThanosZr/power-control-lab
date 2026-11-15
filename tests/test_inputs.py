"""4.17.1 (ROADMAP §59, THEORY §8Β): the inputs of a circuit and the parameters computed from them (web/studio/inputs.js).

An input is a parameter marked «Είσοδος» or a constant (CONST) with «Είσοδος»; a parameter «= …» is an expression of the
inputs, computed at every build of the netlist; the expression blocks see the inputs by name. Checked here: the values in
the netlist and in the SciPy export, chains of inputs, the warnings (unknown name, cycle, two inputs with one name, a bad
name), the inputs of the tutorials (the electric vehicle, the DC-DC converters), the gains from the circuit on
parameters from expressions, and the pcl package (Project.inputs, set by name)."""
import json
import math
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def cases(c):
    out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'inputs_cases.js'), json.dumps(c)], capture_output=True,
                         text=True, check=True, timeout=900, cwd=ROOT).stdout
    return json.loads(out)


KL = {'id': 'KL', 'type': 'CONST', 'params': {'v': '47u', 'input': True, 'name': 'Lf', 'desc': 'αυτεπαγωγή φίλτρου'}}


class Resolve(unittest.TestCase):
    def test_constant_parameter_and_expression(self):
        # a constant input Lf, a parameter input (R1.R as Rload), L1.L = 2·Lf, an expression block Lf·10⁶ + Rload
        r = cases([{'kind': 'resolve', 'id': 'buck', 'patch': {'L1': {'L': '=2*Lf'}},
                    'fields': {'R1': {'inp': ['R'], 'inpName': {'R': 'Rload'}}},
                    'add': [KL, {'id': 'EXq', 'type': 'EXPR', 'params': {'expr': 'Lf*1e6 + Rload', 'ins': '', 'pars': ''}}],
                    'T': 1e-5, 'keys': ['Y:EXq']}])[0]
        self.assertEqual(r['warn'], [])
        env = r['inputs']['env']
        self.assertAlmostEqual(env['Lf'], 47e-6)
        self.assertEqual(env['Rload'], 10)
        der = {(d['id'], d['k']): d for d in r['inputs']['derived']}
        self.assertAlmostEqual(der[('L1', 'L')]['value'], 94e-6)
        self.assertEqual(der[('L1', 'L')]['expr'], '2*Lf')
        self.assertAlmostEqual(list(r['els'].values())[0], 94e-6)          # the inductor of the netlist
        self.assertAlmostEqual(r['now']['Y:EXq'], 57.0)
        q = next(i for i in r['inputs']['inputs'] if i['name'] == 'Lf')
        self.assertEqual((q['kind'], q['desc']), ('const', 'αυτεπαγωγή φίλτρου'))

    def test_chain_and_export(self):
        # an input of other inputs (Lf2 = 3·Lf, as a constant «= …»), used by L1; the SciPy export carries the numbers
        add = [KL, {'id': 'K2', 'type': 'CONST', 'params': {'v': '=3*Lf', 'input': True, 'name': 'Lf2'}},
               {'id': 'EXq', 'type': 'EXPR', 'params': {'expr': 'Lf2', 'ins': '', 'pars': 'a = 1'}}]
        r = cases([{'kind': 'resolve', 'id': 'buck', 'patch': {'L1': {'L': '=Lf2'}}, 'add': add},
                   {'kind': 'export', 'id': 'buck', 'patch': {'L1': {'L': '=Lf2'}}, 'add': add, 'keys': ['I:L1']}])
        self.assertEqual(r[0]['warn'], [])
        self.assertAlmostEqual(r[0]['inputs']['env']['Lf2'], 141e-6)
        self.assertAlmostEqual(next(e['L'] for e in r[1]['els'] if e['k'] == 'L'), 141e-6)
        pv = r[1]['blocks'][0]['parVals']
        self.assertEqual(pv[0], 1)                                          # the block's own parameter first
        self.assertTrue(any(abs(v - 141e-6) < 1e-15 for v in pv[1:]))     # then the inputs

    def test_warnings(self):
        bad = [{'id': 'A', 'type': 'CONST', 'params': {'v': '=Bq + 1', 'input': True, 'name': 'Aq'}},
               {'id': 'B', 'type': 'CONST', 'params': {'v': '=Aq*2', 'input': True, 'name': 'Bq'}},
               {'id': 'D1x', 'type': 'CONST', 'params': {'v': '1', 'input': True, 'name': 'Lf'}},
               {'id': 'E', 'type': 'CONST', 'params': {'v': '1', 'input': True, 'name': '2x'}},
               {'id': 'F', 'type': 'CONST', 'params': {'v': '1', 'input': True, 'name': 'pi'}}]
        r = cases([{'kind': 'resolve', 'id': 'buck', 'patch': {'S1': {'Ron': '=nothere*2'}}, 'add': [KL] + bad}])[0]
        w = ' | '.join(r['warn'])
        self.assertIn('«Aq»', w)
        self.assertIn('κυκλική εξάρτηση ή άγνωστη είσοδος', w)
        self.assertIn('ίδιο όνομα «Lf»', w)
        self.assertIn('«2x»', w)
        self.assertIn('δεσμευμένο', w)
        self.assertIn('S1: η παράμετρος Ron', w)                          # unknown name: the default of the part
        self.assertEqual(w.count('Είσοδος «Aq»'), 1)                       # one warning per failed input
        der = next(d for d in r['inputs']['derived'] if d['id'] == 'S1')
        self.assertIsNone(der['value'])
        self.assertAlmostEqual(r['inputs']['env']['Lf'], 47e-6)            # the first of the two with one name


class Tutorials(unittest.TestCase):
    def test_dcdc_inputs(self):
        names = {'buck': ['Vin', 'L1', 'C1', 'R', 'fs', 'D'], 'cuk': ['Vin', 'L1', 'C1', 'L2', 'C2', 'R', 'fs', 'D'],
                 'buck_vloop': ['Vin', 'L1', 'C1', 'R', 'fs']}
        r = cases([{'kind': 'resolve', 'id': k} for k in names])
        for (k, want), q in zip(names.items(), r):
            self.assertEqual(q['warn'], [], k)
            self.assertEqual([i['name'] for i in q['inputs']['inputs']], want, k)
            self.assertTrue(all(i['desc'] for i in q['inputs']['inputs']), k)

    def test_gains_from_expressions(self):
        # the Ćuk in closed loop with R = 2·Rb (Rb = 4 Ω, a constant input): the averaged model reads R = 8 Ω
        r = cases([{'kind': 'resolve', 'id': 'cuk', 'opts': {'ctrl': 'pi'}, 'patch': {'R1': {'R': '=2*Rb'}},
                    'add': [{'id': 'KR', 'type': 'CONST', 'params': {'v': 4, 'input': True, 'name': 'Rb'}}]}])[0]
        self.assertEqual(r['warn'], [])
        self.assertEqual(r['ctl']['design']['values']['R'], 8)
        self.assertLess(r['ctl']['Ki'], 0)

    def test_electric_vehicle(self):
        # the vehicle as inputs: J of the machine and of the controller, the friction, the gear of the speed and the road
        # load from them; a heavier vehicle (m = 150 kg instead of 115) has a larger inertia at the shaft
        r = cases([{'kind': 'resolve', 'id': 'ev_drive'},
                   {'kind': 'resolve', 'id': 'ev_drive', 'patch': {'IN_m': {'v': 150}}}])
        for q in r:
            self.assertEqual(q['warn'], [])
        names = [i['name'] for i in r[0]['inputs']['inputs']]
        self.assertEqual(names, ['m', 'B', 'Jm', 'rw', 'n', 'eta', 'Crr', 'CdA', 'vk'])
        env = r[0]['inputs']['env']
        der = {(d['id'], d['k']): d['value'] for d in r[0]['inputs']['derived']}
        J = env['Jm'] + env['m'] * (env['rw'] / env['n']) ** 2
        self.assertAlmostEqual(der[('M1', 'J')], J, places=12)
        self.assertAlmostEqual(der[('MO1', 'J')], J, places=12)
        self.assertEqual(der[('M1', 'bm')], env['B'])
        self.assertAlmostEqual(der[('GV', 'K')], env['rw'] / env['n'], places=12)
        der2 = {(d['id'], d['k']): d['value'] for d in r[1]['inputs']['derived']}
        self.assertAlmostEqual(der2[('M1', 'J')] - der[('M1', 'J')], 35 * (env['rw'] / env['n']) ** 2, places=12)

    def test_library_part_to_subcircuit_and_text_parameters(self):
        # the multi-objective controller of the vehicle (J, B «= …») made a subcircuit: the values of now go in, and an input
        # declared on it goes away; the unit «=» of a gain (the unit of its input) stays text, its gain «= 2*3» is computed
        r = cases([{'kind': 'fromlib', 'id': 'ev_drive', 'lib': 'MO1', 'fields': {'MO1': {'inp': ['umax'], 'inpName': {'umax': 'Umax'}}}}])[0]
        self.assertEqual(sorted(r['frozen']), ['B', 'J'])
        self.assertEqual(r['lost'], ['umax'])
        self.assertEqual(r['type'], 'SUB')
        self.assertIsNone(r['inp'])
        self.assertEqual((r['gain']['K'], r['gain']['unit']), (True, False))
        self.assertEqual(r['gain']['resolved'], {'K': 6, 'unit': '='})


class Pcl(unittest.TestCase):
    def test_inputs_and_set_by_name(self):
        import pcl
        p = pcl.tutorial('ev_drive')
        q = {i['name']: i for i in p.inputs()}
        self.assertEqual(q['m']['value'], 115)
        self.assertIn('μάζα', q['m']['desc'])
        p.set('m', 150)
        self.assertEqual(p.comp('IN_m')['params']['v'], 150)
        b = pcl.tutorial('buck')
        self.assertEqual([i['name'] for i in b.inputs()], ['Vin', 'L1', 'C1', 'R', 'fs', 'D'])
        b.set('Vin', 48).set('R', '=2*Vin')
        self.assertEqual(b.comp('V1')['params']['V'], 48)
        self.assertEqual(b.comp('R1')['params']['R'], '=2*Vin')
        r = b.run(t_end=2e-4, channels=['V:R1', 'I:R1'])
        f = r.frame()
        ratio = (f['V:R1'] / f['I:R1']).iloc[-1]                          # the solver's R is 2·V_in = 96 Ω
        self.assertAlmostEqual(ratio, 96.0, places=6)


if __name__ == '__main__':
    unittest.main()
