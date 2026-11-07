"""Solution templates as data (engine/templates.py, web/studio/exercises/*.template.json)."""
import json
import unittest
from pathlib import Path

from engine.core import InputError
from engine.templates import template_solve

EX = Path(__file__).resolve().parents[1] / 'web' / 'studio' / 'exercises'


def load(name):
    return json.loads((EX / name).read_text(encoding='utf-8'))


class DataTemplates(unittest.TestCase):
    def test_index_lists_valid_templates(self):
        idx = json.loads((EX / 'index.json').read_text(encoding='utf-8'))
        for f in idx['templates']:
            r = template_solve({'template': load(f), 'values': {}})
            self.assertTrue(r['sections'])

    def test_battery_above_matches_pe2(self):
        r = template_solve({'template': load('pe2_battery.template.json'), 'values': {'V_st': 100, 'P': 40e3}})
        v = r['values']
        self.assertAlmostEqual(v['D_0'], .5)
        self.assertAlmostEqual(v['I_L'], -800)
        self.assertAlmostEqual(v['Delta_i_L'], 223.2142857, places=5)
        self.assertAlmostEqual(v['K_p'], 3.4417e-4, delta=1e-8)                 # same as the tutorial's piGains
        self.assertAlmostEqual(v['K_i'], 0.45965, delta=1e-4)
        self.assertTrue(all(c['ok'] for c in r['checks']))
        steps = [s for sec in r['sections'] for b in sec['blocks'] if b['type'] == 'steps' for s in b['steps']]
        d0 = next(s for s in steps if s['id'] == 'D_0')
        self.assertIn('50/100', d0['numeric']['text'])                          # substitution shown, not just the result
        table = next(b for sec in r['sections'] for b in sec['blocks'] if b['type'] == 'table')
        self.assertEqual(len(table['rows']), 6)
        self.assertEqual(table['rows'][0][0], 'A+')

    def test_sampling_exercise(self):
        tpl = load('pe2_sampling.template.json')
        base = {'V_bus': 50, 'V_st': 100, 'P': 40e3, 'L': 5.6e-6, 'f_s': 20e3, 'N': 50}
        v = template_solve({'template': tpl, 'values': {**base, 'saw': 1, 'n_ps': 1, 'phi': 90}})['values']
        self.assertAlmostEqual(v['i_s'], -800 - 223.2142857 / 2, places=4)       # sawtooth reset: the valley
        self.assertAlmostEqual(v['phi_off'], 90)                                 # i_L(0) = I_avg at mid-OFF: 90° delay
        self.assertAlmostEqual(v['phi_on'], 270)
        self.assertAlmostEqual(v['t_1'], 12.5e-6, delta=1e-12)
        self.assertAlmostEqual(v['I_ctrl'], -800 + 223.2142857 / 2, places=4)    # PI on the sample shifts the mean
        r = template_solve({'template': tpl, 'values': {**base, 'saw': 0, 'n_ps': 2, 'phi': 0}})
        v = r['values']
        self.assertAlmostEqual(v['i_s'], -800)
        self.assertAlmostEqual(v['i_s2'], -800)
        self.assertEqual(v['N_s'], 100)                                          # 50 periods, two samples each
        self.assertAlmostEqual(v['phi_on'], 180)
        self.assertTrue(r['checks'][0]['ok'])

    def test_polyphase_design(self):
        tpl = load('pe2_polyphase.template.json')
        base = {'V_bus': 50, 'V_st': 80, 'V_min': 60, 'V_max': 100, 'P': 40e3, 'f_s': 20e3}
        r = template_solve({'template': tpl, 'values': {**base, 'N': 4, 'L': 20.8334e-6}})
        v = r['values']
        self.assertAlmostEqual(v['L_min'], 20.8333e-6, delta=1e-10)
        self.assertAlmostEqual(v['I_pk'], 230)
        self.assertAlmostEqual(v['dt_ph'], 12.5e-6)
        self.assertAlmostEqual(v['dI_sh'], 12.0, delta=1e-3)
        self.assertAlmostEqual(v['V_c1'], 200 / 3, places=6)                     # cancellations at 66.7 V and 100 V
        self.assertAlmostEqual(v['V_c2'], 100, places=6)
        self.assertLess(v['in_3'], 0)
        self.assertTrue(r['checks'][0]['ok'])
        kv = [b['rows'][0][0] for s in r['sections'] if s['id'] == 'cancel' for b in s['blocks'] if b['type'] == 'kv']
        self.assertEqual(kv, ['N·D = 1', 'N·D = 2'])
        v = template_solve({'template': tpl, 'values': {**base, 'N': 5, 'L': 26.05e-6}})['values']
        self.assertAlmostEqual(v['dt_ph'], 10e-6)                                 # N = 5: 10 μs phase step
        self.assertAlmostEqual(v['L_min'] / 20.8333e-6, 5 / 4, delta=1e-4)        # L_min grows with N

    def test_battery_below_uses_other_relations(self):
        r = template_solve({'template': load('pe2_battery.template.json'), 'values': {'V_st': 25, 'P': 40e3}})
        v = r['values']
        self.assertAlmostEqual(v['V_lo'], 25)
        self.assertAlmostEqual(v['I_L'], 1600)
        script = next(b for sec in r['sections'] for b in sec['blocks'] if b['type'] == 'script')['text']
        self.assertIn('D    = 0.5;', script)                                    # MATLAB decimals, not Greek commas

    def test_buck_template_switches_region(self):
        tpl = load('buck_design.template.json')
        ccm = template_solve({'template': tpl, 'values': {'R': 10}})['values']
        dcm = template_solve({'template': tpl, 'values': {'R': 50}})['values']
        self.assertAlmostEqual(ccm['M'], .5)
        K = 2 * 1e-4 * 1e5 / 50
        self.assertAlmostEqual(dcm['M'], 2 / (1 + (1 + 4 * K / .25) ** .5))
        self.assertNotIn('dV_o', dcm)                                           # CCM-only steps are skipped

    def test_expressions_are_restricted(self):
        base = {'schema': 'pcl-template-1', 'id': 'x', 'inputs': [{'name': 'a', 'value': 1}], 'sections': [{'blocks': []}]}
        for bad in ("__import__('os')", 'a.real', "a+'1'", 'b+1', 'a[0]', 'lambda: 1'):
            with self.assertRaises(InputError, msg=bad):
                template_solve({'template': {**base, 'steps': [{'id': 'y', 'expr': bad}]}, 'values': {}})
        with self.assertRaises(InputError):
            template_solve({'template': {**base, 'schema': 'other'}})


if __name__ == '__main__':
    unittest.main(verbosity=2)
