"""Solution templates as data (engine/templates.py, web/studio/exercises/*.template.json)."""
import json
import math
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

    def test_peak_current_mode_template(self):
        tpl = load('pcm_slope.template.json')
        qs = lambda r: {q['id']: q for s in r['sections'] for b in s['blocks'] if b['type'] == 'questions' for q in b['items']}
        base = {'V_in': 24, 'L': 50e-6, 'f_s': 100e3, 'i_c': 5}
        r = template_solve({'template': tpl, 'values': {**base, 'V_o': 14.4, 'A_r': 0}})   # D = 0.6, no ramp
        q = qs(r)
        self.assertAlmostEqual(q['lam']['answer'], -1.5, places=9)               # −D/(1 − D)
        self.assertEqual(q['stable']['correct'], 1)                              # subharmonic
        self.assertAlmostEqual(q['mamin']['answer'], (288e3 - 192e3) / 2, places=6)
        self.assertIn(144e3, [round(m['value'], 6) for m in q['mamin']['mistakes']])   # m₂/2: enough for every D
        self.assertAlmostEqual(q['ipk']['answer'], 5, places=9)
        q = qs(template_solve({'template': tpl, 'values': {**base, 'V_o': 14.4, 'A_r': 1.44}}))   # m_a = m₂/2
        self.assertAlmostEqual(q['lam']['answer'], -144 / 336, places=9)
        self.assertEqual(q['stable']['correct'], 0)
        self.assertAlmostEqual(q['ipk']['answer'], 5 - 144e3 * .6 * 1e-5, places=9)
        self.assertEqual(q['ipk']['sim'], {'key': 'Y:AM1', 'stat': 'max', 'periods': 3})
        q = qs(template_solve({'template': tpl, 'values': {**base, 'V_o': 9.6, 'A_r': 0}}))      # D = 0.4
        self.assertEqual(q['stable']['correct'], 0)
        self.assertEqual(q['mamin']['answer'], 0)

    def test_dc_drive_template(self):
        tpl = load('dc_drive.template.json')
        qs = lambda r: {q['id']: q for s in r['sections'] for b in s['blocks'] if b['type'] == 'questions' for q in b['items']}
        ac = 2 * math.pi * 200
        r = template_solve({'template': tpl, 'values': {'act': 1}})              # active resistance and active damping
        v, q = r['values'], qs(r)
        self.assertAlmostEqual(v['K_pc'], ac * .01, places=9)
        self.assertAlmostEqual(v['R_act'], ac * .01 - .5, places=9)
        self.assertAlmostEqual(q['kic']['answer'], ac ** 2 * .01, places=6)
        self.assertIn(round(ac * .5, 6), [round(m['value'], 6) for m in q['kic']['mistakes']])   # the IMC gain is the mistake
        self.assertAlmostEqual(q['iss']['answer'], 10.3, places=9)
        self.assertAlmostEqual(q['dss']['answer'], (.5 * 10.3 + 150) / 220, places=9)
        self.assertAlmostEqual(q['tacc']['answer'], .1, places=9)
        self.assertAlmostEqual(q['dw']['answer'], 10 / (.02 * ac / 10 * math.e), places=9)
        self.assertEqual(q['sep']['correct'], 0)
        self.assertTrue(all(c['ok'] for c in r['checks']))
        q = qs(template_solve({'template': tpl, 'values': {'act': 0}}))          # IMC
        self.assertAlmostEqual(q['kic']['answer'], ac * .5, places=9)
        self.assertAlmostEqual(q['dw']['answer'], 10 / (.02 * ac / 10), places=9)
        self.assertGreater(q['ist']['answer'], 95)                                # open-loop start: about 98 A

    def test_prediction_questions(self):
        tpl = load('pe2_sampling.template.json')
        base = {'V_bus': 50, 'V_st': 100, 'P': 40e3, 'L': 5.6e-6, 'f_s': 20e3, 'N': 50, 'phi': 90}
        qs = lambda r: {q['id']: q for s in r['sections'] for b in s['blocks'] if b['type'] == 'questions' for q in b['items']}
        q = qs(template_solve({'template': tpl, 'values': {**base, 'saw': 1, 'n_ps': 1}}))
        self.assertEqual(q['where']['correct'], 0)                               # sawtooth reset: the valley
        self.assertAlmostEqual(q['value']['answer'], -800 - 223.2142857 / 2, places=4)
        self.assertIn(-800, [round(m['value'], 6) for m in q['value']['mistakes']])   # "this is the mean" mistake
        self.assertEqual(q['count']['answer'], 50)
        self.assertEqual(q['count']['sim'], {'samples': 'SH1', 'periods': 50.0})     # expression evaluated
        self.assertTrue(q['value']['steps'] and 'value' in q['value']['steps'][0])
        q = qs(template_solve({'template': tpl, 'values': {**base, 'saw': 0, 'n_ps': 2}}))
        self.assertEqual(q['where']['correct'], 1)
        self.assertEqual(q['count']['answer'], 100)
        self.assertEqual([round(m['value'], 3) for m in q['value']['mistakes']][:1], [-911.607])  # valley is the mistake now
        q = qs(template_solve({'template': load('pe2_polyphase.template.json'),
                               'values': {'V_bus': 50, 'V_st': 80, 'V_min': 60, 'V_max': 100, 'P': 40e3, 'N': 4, 'f_s': 20e3, 'L': 20.8334e-6}}))
        self.assertAlmostEqual(q['lmin']['answer'], 20.8333e-6, delta=1e-10)
        self.assertAlmostEqual(q['ripple']['answer'], 12.0, delta=1e-3)
        self.assertAlmostEqual(q['cancel']['answer'], 200 / 3, places=6)
        bad = {**tpl, 'questions': [{'id': 'x', 'kind': 'choice', 'choices': ['a'], 'answer': '3', 'text': ''}]}
        with self.assertRaises(InputError):
            template_solve({'template': bad, 'values': {}})

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
