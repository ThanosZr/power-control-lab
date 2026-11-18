"""4.20.3 (ROADMAP §85, §58 part 4): the DC side of every grid-forming law, the current limitation through the power
set-point, and the general form of dVOC.

* The DC current reference of matching control (Tayyebi et al. 2020 (10)) for every law of GFMC (dcc 'on', the output
  idc), with the DC source of (2)-(3) in the circuit. In ieee9_gfm with a DC source of little headroom (±0.8 pu) and the
  load step of +90 MW (§IV-D): droop, VSM and dVOC do not see v_dc, the capacitor gives what the saturated source does
  not, and the DC voltage or the synchronism is lost within 4 s; matching control holds its power at the limit of the
  source and stays in step with the machines.
* The limitation (24) (§IV-E): above |i| = i_th the set-point falls by γ_p·(|i| − i_th) (the paper writes Δp* added; it is
  subtracted here, so that the injection is steered away from the limit). With the paper's limits (±1.2 pu DC and AC) and
  +150 MW the DC source reaches its limit after some 8 s and VSM and matching are lost without (24); with i_th 0.9 and γ_p
  2.3 they hold. Droop stays in step but swings at the limit: written as it is, not tuned to the paper.
* dVOC for any angle κ of the network (21) in polar form, and a start from a small oscillator amplitude (E = 0 is a rest
  point): in gfm_island each unit on its law with κ from its coupling; from E₀ = 0.01 the same state as from V* by 0.2 s.
* The defaults give the definitions of 4.20.2 (dcc 'off', plim 'off', κ = 90°, E₀ empty); SciPy for the new paths.
Headless in Node: tests/js/gfm_cases.js.
"""
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from tests.test_gfm2 import cases, mean  # noqa: E402
from tests.test_gfm3 import scipy_dif  # noqa: E402

K9 = ['Y:CT3/PP', 'Y:CT3/WW', 'Y:VS3/VD', 'Y:LD3', 'Y:CT3/VG', 'Y:G1']
VDC0 = 2 * 345e3 * 2 ** 0.5 / 3 ** 0.5 * 1.3


def at(o, t, key, f='mean'):
    return next(q for q in o['out'] if abs(q['t'] - t) < 1e-6)[key][f]


def lost(o, t):
    """The DC voltage out of ±10 % of its nominal, or the converter out of step with G1 by 1 %."""
    return abs(at(o, t, 'Y:VS3/VD') / VDC0 - 1) > 0.1 or abs(at(o, t, 'Y:CT3/WW') - at(o, t, 'Y:G1')) > 0.01


class Defaults(unittest.TestCase):
    def test_the_definitions_of_4_20_2(self):
        js = ("global.window=globalThis;const W='./web/studio/';global.Parts=require(W+'parts.js');global.Expr=require(W+'expr.js');"
              "for(const f of ['linemodels','netlib'])require(W+f+'.js');const out={};"
              "for(const law of ['droop','vsm','psc','dvoc','match'])for(const inner of ['direct','cascade']){const p={law,inner,conn:'bus'};"
              "const a=NetLib.expand({components:[{id:'CT',type:'GFMC',x:0,y:0,params:p}],wires:[]}),"
              "b=NetLib.expand({components:[{id:'CT',type:'GFMC',x:0,y:0,params:{...p,dcc:'off',plim:'off',ith:0.5,gp:9,kap:90,E0:''}}],wires:[]});"
              "out[law+'/'+inner]=JSON.stringify(a)===JSON.stringify(b);}"
              "const pins=t=>Object.keys(Parts.PARTS.GFMC.spins(t));out.pins=[pins({law:'droop'}).includes('idc'),pins({law:'droop',dcc:'on'}).includes('idc'),pins({law:'match'}).includes('idc')];"
              "console.log(JSON.stringify(out));")
        r = subprocess.run(['node', '-e', js], capture_output=True, text=True, cwd=str(ROOT), timeout=120)
        self.assertEqual(r.returncode, 0, r.stderr[-2000:])
        o = json.loads(r.stdout)
        self.assertEqual(o.pop('pins'), [False, True, True])
        self.assertTrue(all(o.values()), o)


class DcSide(unittest.TestCase):
    def test_large_disturbance_with_little_headroom(self):
        # §IV-D: the DC source at ±0.8 pu (curtailed generation, little headroom), +90 MW at bus 7 at 1 s
        laws = ('droop', 'vsm', 'dvoc', 'match')
        o = cases([{'kind': 'tut', 'id': 'ieee9_gfm', 'opts': {'unit': u, 'dc': 'low', 'dp': '90'}, 'at': [0.9, 4.0], 'keys': K9, 'win': 0.1}
                   for u in laws], timeout=3000)
        res = dict(zip(laws, o))
        for u, q in res.items():
            self.assertEqual(q['warn'], [], u)
            m = q['meta']['ieee9gfm']
            self.assertEqual((m['dcs'], m['dcLim'], m['p24']), (True, 0.8, False), u)
            self.assertLess(abs(at(q, 0.9, 'Y:CT3/PP') - 85 / 128), 0.03, u)   # the load flow before the step
            self.assertFalse(lost(q, 0.9), u)
        for u in ('droop', 'vsm', 'dvoc'):
            self.assertTrue(lost(res[u], 4.0), u)                          # the capacitor gives what the source does not
        mt = res['match']
        self.assertFalse(lost(mt, 4.0))
        self.assertLess(abs(at(mt, 4.0, 'Y:CT3/PP') - 0.79), 0.02)           # at the limit of the source
        self.assertGreater(at(mt, 4.0, 'Y:LD3'), 0.82)                        # whose demand is above it
        self.assertLess(abs(at(mt, 4.0, 'Y:CT3/WW') - at(mt, 4.0, 'Y:G1')), 5e-4)  # in step with the machines
        self.assertGreater(at(mt, 4.0, 'Y:CT3/VG'), 0.95)

    def test_the_limitation_through_the_set_point(self):
        # §IV-E: ±1.2 pu DC and AC, +150 MW; the limitation (24) with i_th 0.9 pu and γ_p 2.3
        runs = (('vsm', 'off'), ('vsm', 'p24'), ('match', 'off'), ('match', 'p24'), ('droop', 'p24'))
        o = cases([{'kind': 'tut', 'id': 'ieee9_gfm', 'opts': {'unit': u, 'dc': 'source', 'dp': '150', 'lim': lim}, 'at': [8.0, 12.0], 'keys': K9, 'win': 0.1}
                   for u, lim in runs], timeout=3000)
        res = dict(zip(runs, o))
        for k, q in res.items():
            self.assertEqual(q['warn'], [], k)
            self.assertEqual(q['meta']['ieee9gfm']['p24'], k[1] == 'p24', k)
        self.assertTrue(lost(res[('vsm', 'off')], 12.0))
        self.assertTrue(lost(res[('match', 'off')], 12.0))                  # the AC limit as large as the DC limit
        for u in ('vsm', 'match'):
            q = res[(u, 'p24')]
            for t in (8.0, 12.0):
                self.assertFalse(lost(q, t), (u, t))
            self.assertLess(at(q, 12.0, 'Y:LD3', 'max'), 1.2, u)            # the source no longer saturated
            self.assertGreater(at(q, 12.0, 'Y:CT3/PP'), 0.95, u)
        dr = res[('droop', 'p24')]                                          # in step, but swinging at the limit
        self.assertFalse(lost(dr, 12.0))
        self.assertGreater(at(dr, 12.0, 'Y:CT3/PP', 'max') - at(dr, 12.0, 'Y:CT3/PP', 'min'), 0.2)

    def test_scipy(self):
        # droop with the DC control (10) and (24) active from the start (i_th 0.1 pu), on the DC side of matching
        o = cases([{'kind': 'scipy', 'match': True, 'tdc': 0.005, 'T': 0.02, 'hDiv': h, 'ct': {'law': 'droop', 'dcc': 'on', 'plim': 'on', 'ith': 0.1},
                    'keys': ['Y:CT/PP', 'I:VS/La', 'Y:VS/VD']} for h in (400, 4000)])
        dif = scipy_dif(o, ('BDF', 1e-7, 1e-9))
        for j in range(3):
            self.assertLess(dif[1][j], 0.4 * dif[0][j], dif)
        self.assertLess(dif[1][0], 0.03, dif)


KI = ['Y:CT1/PP', 'Y:CT2/PP', 'Y:CT1/QQ', 'Y:CT2/QQ', 'Y:CT1/WW', 'Y:CT2/WW', 'Y:CT1/EE', 'Y:CT2/EE']


class DvocGeneral(unittest.TestCase):
    def test_kappa_and_the_start_from_a_small_voltage(self):
        import math
        o = cases([{'kind': 'tut', 'id': 'gfm_island', 'opts': {'law': 'dvoc', 'size': '21', 'dvs': v}, 'at': [0.02, 0.1, 0.45, 0.95, 1.45], 'keys': KI, 'win': 0.02}
                   for v in ('polar', 'kappa', 'black')])
        pol, kap, blk = o
        for q in o:
            self.assertEqual(q['warn'], [])
        ks = kap['meta']['gfm']['kap']
        self.assertEqual(kap['meta']['gfm']['dvs'], 'kappa')
        for k in ('1', '2'):
            self.assertTrue(40 < ks[k] < 60, ks)
        for t, pr in ((0.45, 0.0), (0.95, 0.0), (1.45, 0.2)):
            for k, p0 in ((1, pr), (2, 0.0)):
                p, q_, w, e = (mean(kap, t, f'Y:CT{k}/{n}') for n in ('PP', 'QQ', 'WW', 'EE'))
                sk, ck = math.sin(math.radians(ks[str(k)])), math.cos(math.radians(ks[str(k)]))
                dP, dQ = p0 - p / (e * e), -q_ / (e * e)
                self.assertLess(abs(w - (1 + 0.02 * (sk * dP - ck * dQ))), 2e-4, (t, k))
                self.assertLess(abs(ck * dP + sk * dQ + 10 * (1 - e * e)), 3e-3, (t, k))
            self.assertLess(abs(mean(kap, t, 'Y:CT1/WW') - mean(kap, t, 'Y:CT2/WW')), 1e-5)
            # κ < 90°: the frequency falls less than with κ = 90°, the voltage more
            self.assertGreater(mean(kap, t, 'Y:CT1/WW'), mean(pol, t, 'Y:CT1/WW'))
            self.assertLess(mean(kap, t, 'Y:CT1/EE'), mean(pol, t, 'Y:CT1/EE'))
        self.assertLess(mean(blk, 0.02, 'Y:CT1/EE'), 0.05)                  # from 0.01 pu
        self.assertGreater(mean(blk, 0.1, 'Y:CT1/EE'), 0.8)
        for t in (0.45, 0.95, 1.45):
            for n in KI:
                self.assertLess(abs(mean(blk, t, n) - mean(pol, t, n)), 2e-4, (t, n))

    def test_scipy(self):
        o = cases([{'kind': 'scipy', 'law': 'dvoc', 'ct': {'Rv': 0.05, 'kap': 60}, 'T': 0.02, 'hDiv': h, 'keys': ['Y:CT/PP', 'I:VS/La', 'Y:CT/EE']} for h in (400, 4000)])
        dif = scipy_dif(o)
        for j in range(3):
            self.assertLess(dif[1][j], 0.2 * dif[0][j], dif)
        self.assertLess(dif[1][0], 0.02, dif)


if __name__ == '__main__':
    unittest.main()
