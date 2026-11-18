"""4.20.2 (ROADMAP §58, part 3): the grid-forming MMC station in the detailed models of the MMC.

* The tutorial hvdc_gfm with the option model: Model 4 (the average model, as in 4.18.1), Model 3 (the switching function
  of each arm), Model 2 (the Thévenin equivalent of each arm with every capacitor) and Model 1 (every cell from IGBTs and
  diodes, N = 20). With the energy control of the arms (4.15) the station of the detailed models gives the power, the
  frequency and the DC voltage of Model 4: in the island with droop within 1e-3 of the power and 1e-4 of the frequency, and
  the droop law holds in each. Model 1 needs about 290 s for the 1.2 s of the tutorial here: measured once, not a test.
Headless in Node: tests/js/gfm_cases.js.
"""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from tests.test_gfm2 import cases, mean  # noqa: E402

K = ['Y:CT2/G/PP', 'Y:CT2/G/WW', 'Y:CT2/G/VG', 'Y:CT2/Fvdc']


class MmcModels(unittest.TestCase):
    def test_default_is_model_4(self):
        import json
        import subprocess
        js = ("global.window=globalThis;const W='./web/studio/';global.Parts=require(W+'parts.js');global.Expr=require(W+'expr.js');"
              "for(const f of ['linemodels','netlib','subcircuit','bus','units','nn'])require(W+f+'.js');require(W+'tutorials.js');"
              "const t=Tutorials.get('hvdc_gfm');const d=Object.fromEntries(t.options.map(o=>[o.k,o.def]));"
              "const a=t.build(d),b=t.build({...d,model:'m4'}),c=t.build({...d,model:'m3'});const mm=p=>p.components.find(q=>q.id==='MMC2').params;"
              "console.log(JSON.stringify({def:d.model,same:JSON.stringify(a.components)===JSON.stringify(b.components),m4:mm(a),m3:mm(c),m1:mm(t.build({...d,model:'m1'}))}));")
        r = subprocess.run(['node', '-e', js], capture_output=True, text=True, cwd=str(ROOT), timeout=120)
        self.assertEqual(r.returncode, 0, r.stderr[-2000:])
        o = json.loads(r.stdout)
        self.assertEqual(o['def'], 'm4')
        self.assertTrue(o['same'])
        self.assertEqual((o['m4']['model'], o['m4']['impl'], o['m4']['N'], o['m4']['C']), ('m4', 'fast', 400, 0.01))
        self.assertEqual((o['m3']['model'], o['m3']['ectl']), ('m3', 'energy'))
        self.assertEqual((o['m1']['model'], o['m1']['impl'], o['m1']['N'], o['m1']['C']), ('m2', 'blocks', 20, 0.0005))

    def test_island_models_2_and_3_as_model_4(self):
        o = cases([{'kind': 'tut', 'id': 'hvdc_gfm', 'opts': {'ac': 'island', 'law': 'droop', 'model': m}, 'at': at, 'keys': K, 'win': 0.04}
                   for m, at in (('m4', [0.59, 1.19]), ('m3', [0.59, 1.19]), ('m2', [0.59]))], timeout=3000)
        m4, m3, m2 = o
        for q in o:
            self.assertEqual(q['warn'], [])
        for q, ts in ((m3, (0.59, 1.19)), (m2, (0.59,))):
            for t in ts:
                p, w = mean(q, t, 'Y:CT2/G/PP'), mean(q, t, 'Y:CT2/G/WW')
                self.assertLess(abs(p - mean(m4, t, 'Y:CT2/G/PP')), 1e-3)
                self.assertLess(abs(w - mean(m4, t, 'Y:CT2/G/WW')), 1e-4)
                self.assertLess(abs(mean(q, t, 'Y:CT2/G/VG') - mean(m4, t, 'Y:CT2/G/VG')), 2e-3)
                self.assertLess(abs(mean(q, t, 'Y:CT2/Fvdc') - mean(m4, t, 'Y:CT2/Fvdc')), 5e-4)
                self.assertLess(abs(w - (1 - 0.02 * (p - 0.55))), 3e-4)            # droop: 1 − ω = m_p·(P − P_ref)
        self.assertGreater(mean(m3, 1.19, 'Y:CT2/G/PP') - mean(m3, 0.59, 'Y:CT2/G/PP'), 0.2)   # +300 MW


if __name__ == '__main__':
    unittest.main()
