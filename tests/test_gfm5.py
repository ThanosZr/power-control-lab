"""4.20.4 (ROADMAP §86, §58 part 5): the open points of 4.20.3 that need no new sources.

* A first-order filter on |i| before the limitation (24) (GFMC fpl, Hz; our addition, not in the paper). In ieee9_gfm with
  ±1.2 pu DC and AC and +150 MW, (24) without it leaves droop and dVOC swinging at the limit (a limit cycle of some 55 Hz in
  the frame of the converter); with 20 Hz all four laws are quiet, in step, and the DC source below its limit.
* The modulation (9) on the nominal V_dc for the laws other than matching (GFMC mdc 'nom'): the AC voltage follows v_dc. In
  ieee9_gfm with ±0.8 pu and +90 MW (§IV-D) VSM then stays in step at the limits of the source and of the current, while
  droop and dVOC are lost as with the measured v_dc.
* The angle κ and the oscillator's amplitude at t = 0 of dVOC in the MMC station (MMCC kap, E0): in the island of hvdc_gfm
  the station on the law (21) with κ = 60°, and from E₀ = 0.01 pu the same state as from V*, with a 50 Hz ripple some 20
  times smaller.
* The defaults give the definitions of 4.20.3 (fpl 0, mdc 'meas'; MMCC without kap and E0); SciPy for the new paths.
Headless in Node: tests/js/gfm_cases.js.
"""
import json
import math
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from tests.test_gfm2 import cases, mean  # noqa: E402
from tests.test_gfm3 import scipy_dif  # noqa: E402
from tests.test_gfm4 import K9, at, lost  # noqa: E402


def swing(o, t, key='Y:CT3/PP'):
    return at(o, t, key, 'max') - at(o, t, key, 'min')


class Defaults(unittest.TestCase):
    def test_the_definitions_of_4_20_3(self):
        js = ("global.window=globalThis;const W='./web/studio/';global.Parts=require(W+'parts.js');global.Expr=require(W+'expr.js');"
              "for(const f of ['linemodels','netlib'])require(W+f+'.js');const out={};const X=(type,p)=>JSON.stringify(NetLib.expand({components:[{id:'CT',type,x:0,y:0,params:p}],wires:[]}));"
              "for(const law of ['droop','vsm','psc','dvoc','match'])for(const inner of ['direct','cascade'])for(const plim of ['off','on']){const p={law,inner,plim,dcc:'on',conn:'bus'};"
              "out['G/'+law+'/'+inner+'/'+plim]=X('GFMC',p)===X('GFMC',{...p,fpl:0,mdc:'meas'});}"
              "for(const law of ['droop','vsm','psc','dvoc']){const p={mode:'gfm',law,conn:'bus'};"
              "out['M/'+law]=X('MMCC',p)===X('MMCC',{...p,kap:90,E0:''});if(law!=='dvoc')out['M/'+law+'/60']=X('MMCC',p)===X('MMCC',{...p,kap:60,E0:'0.01'});}"
              "out.dvoc60=X('MMCC',{mode:'gfm',law:'dvoc',conn:'bus'})!==X('MMCC',{mode:'gfm',law:'dvoc',kap:60,conn:'bus'});"
              "out.fpl=X('GFMC',{law:'droop',plim:'on',conn:'bus'})!==X('GFMC',{law:'droop',plim:'on',fpl:20,conn:'bus'});"
              "out.fplOff=X('GFMC',{law:'droop',conn:'bus'})===X('GFMC',{law:'droop',fpl:20,conn:'bus'});"
              "out.nom=X('GFMC',{law:'vsm',conn:'bus'})!==X('GFMC',{law:'vsm',mdc:'nom',conn:'bus'});"
              "out.matchNom=X('GFMC',{law:'match',conn:'bus'})===X('GFMC',{law:'match',mdc:'nom',conn:'bus'});"
              "console.log(JSON.stringify(out));")
        r = subprocess.run(['node', '-e', js], capture_output=True, text=True, cwd=str(ROOT), timeout=120)
        self.assertEqual(r.returncode, 0, r.stderr[-2000:])
        o = json.loads(r.stdout)
        self.assertTrue(all(o.values()), {k: v for k, v in o.items() if not v})


class FilterOf24(unittest.TestCase):
    def test_the_limit_cycle_and_the_filter(self):
        # §IV-E: ±1.2 pu DC and AC, +150 MW, (24) with i_th 0.9 pu and γ_p 2.3, without and with 20 Hz on |i|
        runs = (('droop', 'p24'), ('dvoc', 'p24'), ('droop', 'p24f'), ('dvoc', 'p24f'), ('vsm', 'p24f'), ('match', 'p24f'))
        o = cases([{'kind': 'tut', 'id': 'ieee9_gfm', 'opts': {'unit': u, 'dc': 'source', 'dp': '150', 'lim': lim}, 'at': [8.0, 12.0], 'keys': K9, 'win': 0.1}
                   for u, lim in runs], timeout=3000)
        res = dict(zip(runs, o))
        for k, q in res.items():
            self.assertEqual(q['warn'], [], k)
            m = q['meta']['ieee9gfm']
            self.assertEqual((m['p24'], m['fpl']), (True, 20 if k[1] == 'p24f' else 0), k)
        for u in ('droop', 'dvoc'):
            self.assertGreater(swing(res[(u, 'p24')], 12.0), 0.2, u)           # swinging at the limit without the filter
        for u in ('droop', 'dvoc', 'vsm', 'match'):
            q = res[(u, 'p24f')]
            for t in (8.0, 12.0):
                self.assertFalse(lost(q, t), (u, t))
                self.assertLess(swing(q, t), 0.02, (u, t))                       # quiet
            self.assertLess(at(q, 12.0, 'Y:LD3', 'max'), 1.2, u)                 # the source below its limit
            self.assertGreater(at(q, 12.0, 'Y:CT3/PP'), 0.95, u)

    def test_scipy(self):
        # droop with the DC control (10), (24) active from the start (i_th 0.1 pu) through 50 Hz on |i|, and the modulation (9)
        o = cases([{'kind': 'scipy', 'match': True, 'tdc': 0.005, 'T': 0.02, 'hDiv': h,
                    'ct': {'law': 'droop', 'dcc': 'on', 'plim': 'on', 'ith': 0.1, 'fpl': 50, 'mdc': 'nom'},
                    'keys': ['Y:CT/PP', 'I:VS/La', 'Y:VS/VD']} for h in (400, 4000)])
        dif = scipy_dif(o, ('BDF', 1e-7, 1e-9))
        for j in range(3):
            self.assertLess(dif[1][j], 0.4 * dif[0][j], dif)
        self.assertLess(dif[1][0], 0.03, dif)


class Modulation9(unittest.TestCase):
    def test_large_disturbance_with_the_nominal_v_dc(self):
        # §IV-D: the DC source at ±0.8 pu and +90 MW, the modulation (9) for droop, VSM and dVOC
        runs = (('vsm', [0.9, 4.0, 12.0]), ('droop', [0.9, 4.0]), ('dvoc', [0.9, 4.0]))
        o = cases([{'kind': 'tut', 'id': 'ieee9_gfm', 'opts': {'unit': u, 'dc': 'low', 'dp': '90', 'mod': 'nom'}, 'at': ts,
                    'keys': K9 + ['Y:CT3/LR'], 'win': 0.1} for u, ts in runs], timeout=3000)
        res = dict(zip([r[0] for r in runs], o))
        for u, q in res.items():
            self.assertEqual(q['warn'], [], u)
            self.assertEqual(q['meta']['ieee9gfm']['mdc'], 'nom', u)
            self.assertLess(abs(at(q, 0.9, 'Y:CT3/PP') - 85 / 128), 0.03, u)   # the same load flow before the step
            self.assertFalse(lost(q, 0.9), u)
        vs = res['vsm']
        for t in (4.0, 12.0):
            self.assertFalse(lost(vs, t), t)                                   # in step, v_dc within ±10 %
            self.assertLess(abs(at(vs, t, 'Y:CT3/WW') - at(vs, t, 'Y:G1')), 5e-4, t)
        self.assertEqual(at(vs, 12.0, 'Y:CT3/LR', 'min'), 1.0)                # at the current limit
        self.assertGreater(at(vs, 12.0, 'Y:LD3'), 0.8)                         # the source at its limit
        for u in ('droop', 'dvoc'):
            self.assertTrue(lost(res[u], 4.0), u)


KH = ['Y:CT2/G/PP', 'Y:CT2/G/QQ', 'Y:CT2/G/WW', 'Y:CT2/G/EE']


class MmcDvoc(unittest.TestCase):
    def test_kappa_and_the_start_of_the_island(self):
        o = cases([{'kind': 'tut', 'id': 'hvdc_gfm', 'opts': {'ac': 'island', 'law': 'dvoc', 'e0': e}, 'set': st, 'at': [0.1, 0.55, 1.2], 'keys': KH, 'win': 0.1}
                   for e, st in (('vs', {}), ('small', {}), ('vs', {'CT2': {'kap': 60}}))], timeout=3000)
        vs, sm, kp = o
        for q in o:
            self.assertEqual(q['warn'], [])
        self.assertEqual((vs['meta']['hvdcgfm']['e0'], sm['meta']['hvdcgfm']['e0']), ('vs', 'small'))
        self.assertGreater(at(vs, 0.1, 'Y:CT2/G/EE', 'last'), 0.8)            # from the amplitude at the deblocking (some 0.08)
        self.assertLess(at(sm, 0.1, 'Y:CT2/G/EE', 'last'), 0.05)              # from 0.01 pu, still small at 0.1 s
        for t in (0.55, 1.2):
            for k in KH:
                self.assertLess(abs(mean(sm, t, k) - mean(vs, t, k)), 2e-4, (t, k))
        self.assertLess(swing(sm, 1.2, 'Y:CT2/G/PP'), 0.2 * swing(vs, 1.2, 'Y:CT2/G/PP'))
        # κ = 60°: ω = 1 + η·(sin κ·(P_ref − P/E²) + cos κ·Q/E²), η = m_p = 0,02, P_ref 0.55 (out of the station), Q_ref 0
        sk, ck = math.sin(math.radians(60)), math.cos(math.radians(60))
        for t in (0.55, 1.2):
            p, q_, w, e = (mean(kp, t, k) for k in KH)
            self.assertLess(abs(w - (1 + 0.02 * (sk * (0.55 - p / (e * e)) + ck * q_ / (e * e)))), 5e-4, t)
        self.assertGreater(mean(kp, 1.2, 'Y:CT2/G/WW'), mean(vs, 1.2, 'Y:CT2/G/WW'))   # the frequency falls less


if __name__ == '__main__':
    unittest.main()
