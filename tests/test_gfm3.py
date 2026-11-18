"""4.20.2 (ROADMAP §58, part 3): the grid-forming MMC station in the detailed models of the MMC.

* The tutorial hvdc_gfm with the option model: Model 4 (the average model, as in 4.18.1), Model 3 (the switching function
  of each arm), Model 2 (the Thévenin equivalent of each arm with every capacitor) and Model 1 (every cell from IGBTs and
  diodes, N = 20). With the energy control of the arms (4.15) the station of the detailed models gives the power, the
  frequency and the DC voltage of Model 4: in the island with droop within 1e-3 of the power and 1e-4 of the frequency, and
  the droop law holds in each. Model 1 needs about 290 s for the 1.2 s of the tutorial here: measured once, not a test.
* dVOC (Tayyebi et al. 2020 (21)–(22); Colombino et al. 2019; Seo et al. 2019): GFMC law 'dvoc' with η = m_p·V*² and
  α = 1/(2·n_q·V*), P and Q at the oscillator's voltage. On a stiff grid the steady state is the closed form of (22) at
  ω and E: P = E²·(P*/V*² + (1 − ω)/η), Q = E²·(Q* + α·(V*² − E²))/V*². With η for 2 % and almost no resistance in the
  connection the oscillator loses step, as Groß et al. (2019) bound η by the time constant of the lines; with η for 0.5 %,
  or a virtual resistance, it holds. In ieee9_gfm (R_v 0.05 pu) it starts from the load flow, and without R_v it swings;
  two units in an island and the MMC station in hvdc_gfm on their laws; SciPy (first order in the step).
* Matching control (Tayyebi et al. 2020 (10), (16)–(19); Arghir et al. 2018): GFMC law 'match', ω = v_dc in pu, the DC
  current reference with the loss feed-forward at the output idc. On a stiff grid with a DC source of 5 ms: ω = v_dc/V_dc
  and P = P* + (1 − ω)/m_p; with the 50 ms of the paper's source the DC voltage swings without settling; in ieee9_gfm from
  the load flow, ω = v_dc/V_dc after the load step; SciPy.
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


def last(o, key):
    return o['out'][-1][1 + o['keys'].index(key)]


def scipy_dif(o, methods=('Radau', 1e-7, 1e-9)):
    import numpy as np
    from engine.batch import simulate
    dif = []
    for q in o:
        d = q['batch']
        rec = np.array(q['rec'])
        ts = rec[:, 0]
        m, rt, at = methods
        r = simulate({'net': d['net'], 'channels': d['channels'], 't_end': float(ts[-1]), 'method': m, 'rtol': rt, 'atol': at,
                      'max_points': 400000, '_local': True, 'wall': 900})
        if r['status'] != 'ok':
            raise AssertionError(r['message'])
        if d['skipped']:
            raise AssertionError(d['skipped'])
        t = np.array(r['t'])
        dif.append([float(np.max(np.abs(rec[:, j + 1] - np.interp(ts, t, np.array(r['ch'][k], float))))) for j, k in enumerate(q['ch'])])
    return dif


KG = ['Y:CT/PP', 'Y:CT/QQ', 'Y:CT/WW', 'Y:CT/EE']


class Dvoc(unittest.TestCase):
    def test_closed_form_on_a_stiff_grid(self):
        # R_v 0.05 pu: the grid 0.2 % low, and the set-points Q* 0.1, V* 1.02 at 50 Hz
        o = cases([{'kind': 'grid', 'law': 'dvoc', 'Pref': '0.3', 'fg': 49.9, 'T': 1.0, 'dt': 0.2, 't0': 0.6, 'ct': {'Rv': 0.05}, 'keys': KG},
                   {'kind': 'grid', 'law': 'dvoc', 'Pref': '0.3', 'fg': 50, 'T': 1.0, 'dt': 0.2, 't0': 0.6, 'ct': {'Rv': 0.05, 'Qref': '0.1', 'Vref': '1.02'}, 'keys': KG}])
        for q, (Ps, Qs, Vs) in zip(o, ((0.3, 0.0, 1.0), (0.3, 0.1, 1.02))):
            self.assertEqual(q['warn'], [])
            P, Q, w, E = (last(q, k) for k in KG)
            eta, al = 0.02 * Vs * Vs, 1 / (2 * 0.05 * Vs)
            self.assertLess(abs(P - E * E * (Ps / Vs ** 2 + (1 - w) / eta)), 1e-4)
            self.assertLess(abs(Q - E * E * (Qs + al * (Vs * Vs - E * E)) / Vs ** 2), 1e-4)
        self.assertLess(abs(last(o[0], 'Y:CT/WW') - 0.998), 1e-6)
        self.assertLess(abs(last(o[0], 'Y:CT/PP') - 0.4), 0.01)            # near the droop of 2 %: 0.3 + 0.002/0.02

    def test_the_gain_and_the_lines(self):
        # Groß et al. (2019), Proposition 2: η below a bound set by the time constant of the lines. R 0.015 pu in all
        o = cases([{'kind': 'grid', 'law': 'dvoc', 'Pref': '0.3', 'fg': 50, 'T': 1.0, 'dt': 0.05, 't0': 0.6, 'keys': KG},
                   {'kind': 'grid', 'law': 'dvoc', 'Pref': '0.3', 'fg': 49.9, 'T': 1.0, 'dt': 0.05, 't0': 0.6, 'ct': {'mp': 0.5}, 'keys': KG}])
        lost, slow = o
        for j, lim in ((1, 0.1), (2, 0.5)):                                    # η for 2 %: P and Q swing without settling
            self.assertGreater(max(r[j] for r in lost['out']) - min(r[j] for r in lost['out']), lim)
        P, Q, w, E = (last(slow, k) for k in KG)
        self.assertLess(abs(w - 0.998), 1e-5)
        self.assertLess(abs(P - E * E * (0.3 + (1 - w) / 0.005)), 1e-3)     # η for 0.5 %: in step, P ≈ 0.7

    def test_ieee9_from_the_load_flow(self):
        from tests.test_gfm2 import mean
        o = cases([{'kind': 'tut', 'id': 'ieee9_gfm', 'opts': {'unit': 'dvoc'}, 'at': [0.5, 0.9], 'keys': ['Y:CT3/PP', 'Y:CT3/QQ', 'Y:CT3/EE', 'Y:G1:pe'], 'win': 0.1},
                   {'kind': 'tut', 'id': 'ieee9_gfm', 'opts': {'unit': 'dvoc'}, 'set': {'CT3': {'Rv': 0}}, 'at': [0.9], 'keys': ['Y:CT3/PP'], 'win': 0.3}])
        q, rv0 = o
        m = q['meta']['ieee9gfm']
        self.assertEqual(q['warn'], [])
        for t in (0.5, 0.9):
            self.assertLess(abs(mean(q, t, 'Y:CT3/PP') - m['Po']), 0.003)
            self.assertLess(abs(mean(q, t, 'Y:CT3/QQ') - m['Qo']), 0.01)
            self.assertLess(abs(mean(q, t, 'Y:CT3/EE') - m['Eo']), 0.002)
            self.assertLess(abs(mean(q, t, 'Y:G1:pe') - 0.7164), 0.01)
        r = rv0['out'][0]['Y:CT3/PP']
        self.assertGreater(r['max'] - r['min'], 0.05)                       # without R_v: the oscillator swings with the lines

    def test_island_and_the_mmc_station(self):
        from tests.test_gfm2 import mean
        K = ['Y:CT1/PP', 'Y:CT2/PP', 'Y:CT1/QQ', 'Y:CT2/QQ', 'Y:CT1/WW', 'Y:CT2/WW', 'Y:CT1/EE', 'Y:CT2/EE']
        o = cases([{'kind': 'tut', 'id': 'gfm_island', 'opts': {'law': 'dvoc', 'size': '21'}, 'at': [0.45, 0.95, 1.45], 'keys': K, 'win': 0.05},
                   {'kind': 'tut', 'id': 'hvdc_gfm', 'opts': {'ac': 'island', 'law': 'dvoc'}, 'at': [0.59, 1.19], 'keys': ['Y:CT2/G/PP', 'Y:CT2/G/WW', 'Y:CT2/G/EE'], 'win': 0.04}])
        isl, st = o
        for q in o:
            self.assertEqual(q['warn'], [])
        for t, pr in ((0.45, 0.0), (0.95, 0.0), (1.45, 0.2)):
            for k, p0 in ((1, pr), (2, 0.0)):
                p, w, e = mean(isl, t, f'Y:CT{k}/PP'), mean(isl, t, f'Y:CT{k}/WW'), mean(isl, t, f'Y:CT{k}/EE')
                self.assertLess(abs(w - (1 + 0.02 * (p0 - p / (e * e)))), 2e-4, (t, k))
                self.assertLess(abs(mean(isl, t, f'Y:CT{k}/QQ') - e * e * 10 * (1 - e * e)), 3e-3, (t, k))
            self.assertLess(abs(mean(isl, t, 'Y:CT1/WW') - mean(isl, t, 'Y:CT2/WW')), 1e-5)
        for t in (0.59, 1.19):
            p, w, e = mean(st, t, 'Y:CT2/G/PP'), mean(st, t, 'Y:CT2/G/WW'), mean(st, t, 'Y:CT2/G/EE')
            self.assertLess(abs(w - (1 - 0.02 * (p / (e * e) - 0.55))), 5e-4, t)
        self.assertGreater(mean(st, 1.19, 'Y:CT2/G/PP') - mean(st, 0.59, 'Y:CT2/G/PP'), 0.2)

    def test_scipy(self):
        o = cases([{'kind': 'scipy', 'law': 'dvoc', 'ct': {'Rv': 0.05}, 'T': 0.02, 'hDiv': h, 'keys': ['Y:CT/PP', 'I:VS/La', 'Y:CT/EE']} for h in (400, 4000)])
        dif = scipy_dif(o)
        for j in range(3):
            self.assertLess(dif[1][j], 0.2 * dif[0][j], dif)
        self.assertLess(dif[1][0], 0.02, dif)


class Ieee9Metrics(unittest.TestCase):
    def test_frequency_metrics(self):
        # +50 MW at bus 7 in 1 s, the speed of G1 per period: RoCoF over 250 ms and the deviation at 4 s (Tayyebi et al. 2020 (23))
        units = ('droop', 'dvoc', 'match', 'gfl0')
        res = {}
        for u, q in zip(units, cases([{'kind': 'cyc', 'id': 'ieee9_gfm', 'opts': {'unit': u}, 'T': 4.0, 'Tc': 1 / 60, 'keys': ['Y:G1']} for u in units])):
            self.assertEqual(q['warn'], [])
            cyc = q['out']
            w0 = sum(r[1] for r in cyc if 0.9 < r[0] <= 1.0) / len([r for r in cyc if 0.9 < r[0] <= 1.0])
            at = lambda t: min(cyc, key=lambda r: abs(r[0] - t))[1]
            res[u] = {'df': w0 - at(4.0), 'rocof': abs(at(1.25) - w0) / 0.25}
        for u in ('dvoc', 'match'):
            self.assertLess(res[u]['df'], res['gfl0']['df'], u)          # both regulate the frequency at once
            self.assertLess(res[u]['rocof'], res['gfl0']['rocof'], u)
        self.assertLess(abs(res['dvoc']['df'] - res['droop']['df']), 0.05 / 60)   # the same slope of 5 %


KM = ['Y:CT/PP', 'Y:CT/WW', 'Y:VS/VD', 'Y:CT/VG']


class Matching(unittest.TestCase):
    def test_stiff_grid(self):
        o = cases([{'kind': 'match1', 'Pref': '0.3', 'fg': 49.9, 'T': 1.2, 'dt': 0.1, 't0': 0.4, 'tdc': 0.005, 'keys': KM},
                   {'kind': 'match1', 'Pref': '0.3', 'fg': 49.9, 'T': 1.5, 'dt': 0.01, 't0': 0.5, 'keys': KM}])
        q, lag = o
        self.assertEqual(q['warn'], [])
        P, w, vd, vg = (last(q, k) for k in KM)
        self.assertLess(abs(w - vd / 800), 1e-5)                              # θ̇ = k_θ·v_dc
        self.assertLess(abs(w - 0.998), 1e-5)
        self.assertLess(abs(P - (0.3 + (1 - w) / 0.02)), 1e-3)               # k_dc = 1/m_p with the loss feed-forward
        self.assertLess(abs(vg - 1), 2e-3)
        ps = [r[1] for r in lag['out']]
        self.assertGreater(max(ps) - min(ps), 0.5)                            # τ_dc 50 ms: the DC loop swings

    def test_ieee9(self):
        o = cases([{'kind': 'cyc', 'id': 'ieee9_gfm', 'opts': {'unit': 'match'}, 'T': 2.0, 'Tc': 1 / 60, 'keys': ['Y:G1', 'Y:G1:pe', 'Y:CT3/PP', 'Y:CT3/WW', 'Y:VS3/VD']}])[0]
        self.assertEqual(o['warn'], [])
        m = o['meta']['ieee9gfm']
        pre = [r for r in o['out'] if 0.7 < r[0] <= 1.0]
        self.assertLess(abs(sum(r[2] for r in pre) / len(pre) - 0.7164), 0.01)
        self.assertLess(abs(sum(r[3] for r in pre) / len(pre) - 85 / 128), 0.01)
        vdc0 = 2 * 345e3 * 2 ** 0.5 / 3 ** 0.5 * 1.3
        for r in o['out']:
            if r[0] > 0.2:
                self.assertLess(abs(r[4] - r[5] / vdc0), 2e-4, r[0])         # ω = v_dc/V_dc, period by period
        end = o['out'][-1]
        self.assertLess(end[4], 0.998)                                       # the frequency falls with the load step
        self.assertGreater(end[3], 85 / 128 + 0.04)                          # and the converter takes its share at once
        self.assertEqual((m['Hdc'], m['tdc']), (0.0476, 0.005))

    def test_scipy(self):
        o = cases([{'kind': 'scipy', 'match': True, 'tdc': 0.005, 'T': 0.02, 'hDiv': h, 'keys': ['Y:CT/PP', 'I:VS/La', 'Y:VS/VD']} for h in (400, 4000)])
        dif = scipy_dif(o, ('BDF', 1e-7, 1e-9))
        for j in range(3):
            self.assertLess(dif[1][j], 0.4 * dif[0][j], dif)
        self.assertLess(dif[1][0], 0.03, dif)


if __name__ == '__main__':
    unittest.main()
