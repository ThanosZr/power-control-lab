"""5.1.7: the LCC link as a part of the drawing and in the card «Δυναμική RMS» (web/studio/model.js lcc, pcl.model, pcl.rms.LCC;
ROADMAP §101 step 2, THEORY §8ΩΩΒ). The common model (version 6) takes two LCCS with the LCCC on their α, the DC path between
them (L and R in series, one node with a C to the ground: the T line) and the switches at that node (the faults of the line);
pcl.model makes them a link of pcl.network (Network.lcc) with the data of the drawing, the dynamic data of pcl.rms.LCC and the
events (the program of the order, the faults). The checks: the translation of the tutorial hvdc_lcc and what stays out; the load
flow AC/DC of the drawing against the same link from the API (pcl.lcc.benchmark_network with the sources of the drawing); the RMS
of the drawing against the API (a step of the order and a DC fault: to the rounding; a three-phase fault at the inverter: the same
events, and the points apart for 0,35 s after the bypass ends, THEORY §8ΩΩΒ.4) and against the EMT of the same drawing (the
events at 2,5 s, as tests/test_rms_lcc.py); the studies and the report of the drawing; a breaker that takes a station out."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

from pcl import lcc, model, study

ROOT = Path(__file__).resolve().parent.parent
HAVE_NODE = shutil.which('node') is not None
STEP = [{'t': 1.0, 'kind': 'iord', 'gen': 'DC', 'dI': -0.1}]
DCF = [{'t': 1.0, 'kind': 'dcfault', 'gen': 'DC', 'R': 0.1}, {'t': 1.15, 'kind': 'dcclear', 'gen': 'DC'}]
AC3 = [{'t': 1.0, 'kind': 'fault', 'bus': 'I', 'z': 0.1 / (230e3 ** 2 / 100e6)}, {'t': 1.15, 'kind': 'clear', 'bus': 'I'}]
SETS = {'step': {'CI': {'Iord': '0:1, 2.5:0.9'}}, 'dcf': {'KDC': {'v': '0:0, 2.5:1, 2.65:0'}}, 'ac3': {'FAC': {'ton': 2.5, 'toff': 2.65}}}


def build(opts=None):
    return json.loads(subprocess.run(['node', str(ROOT / 'tests/js/model_cases.js'), 'build', 'hvdc_lcc', json.dumps(opts or {})], capture_output=True,
                                     text=True, timeout=300, check=True).stdout)


def drawing(opts=None, sets=None, edit=None):
    """The model of the tutorial hvdc_lcc with its options, the parameters `sets` ({id: {k: v}}) and an edit of the project."""
    pr = build(opts)
    for cid, ps in (sets or {}).items():
        next(c for c in pr['components'] if c['id'] == cid)['params'].update(ps)
    if edit:
        edit(pr)
    return model.of(pr)


def api(m, **kw):
    """The benchmark from the API with the two sources at the voltages of the drawing (the tutorial gives V̂ to 8 digits)."""
    net = lcc.benchmark_network(**kw)
    r = model.load_flow(m)
    for e, b in (('SR', 'SR.abc'), ('SI', 'SI.abc')):
        net.element(e)['V'] = r['buses'][b]['V']
    return net


def emt(cases, timeout=2400):
    r = subprocess.run(['node', str(ROOT / 'tests/js/lcc_rms_cases.js'), json.dumps(cases)], capture_output=True, text=True, timeout=timeout, cwd=str(ROOT))
    if r.returncode:
        raise RuntimeError(r.stderr[-2000:])
    out = json.loads(r.stdout)
    for o in out:
        if 'error' in o:
            raise RuntimeError(o['error'][:2000])
    return out


def windows(L, T, te):
    """The RMS over the windows (t − 5 ms, t] of the EMT: the mean of its points by the trapezoidal rule."""
    T = np.round(np.asarray(T), 9)

    def wm(key):
        y, out = np.asarray(L[key]), []
        for t in te:
            m = (T >= t - 0.005 - 1e-9) & (T <= t + 1e-9)
            tt, yy = T[m], y[m]
            _, last = np.unique(tt[::-1], return_index=True)
            i = len(tt) - 1 - last
            out.append(np.trapezoid(yy[i], tt[i]) / 0.005)
        return np.array(out)
    return {'vdr': wm('Vdr'), 'vdi': wm('Vdi'), 'ir': wm('Id_r'), 'ii': wm('Id_i'), 'gm': wm('gamma')}


def rm(a, b, keys, sel=None):
    """The largest difference of each key of two results of a link."""
    return {k: float(np.max(np.abs(np.asarray(a[k]) - np.asarray(b[k]))[sel if sel is not None else slice(None)])) for k in keys}


@unittest.skipUnless(HAVE_NODE, 'Node.js')
class TheModel(unittest.TestCase):
    def test_the_link_of_the_tutorial(self):
        """The two stations with their controls, the line as a T (2 × (2,5 Ω, 0,5968 H), 26 µF), the buses at the levels of the
        stations (345 and 230 kV: a VAC3 at 1,088 pu behind a ZSER3 no longer gives its amplitude), the fault switch of 'dcf'."""
        m = drawing({'model': 'avg', 'ev': 'dcf'})
        self.assertEqual(m['version'], 6)
        self.assertEqual(m['warnings'], [])
        self.assertEqual(m['skipped'], [])
        st = {e['id']: e for e in m['elements'] if e['type'] == 'LCCS'}
        self.assertEqual({k: (e['ctl']['type'], e['ctl']['id'], e['link']) for k, e in st.items()}, {'STR': ('LCCC', 'CR', 'STR'), 'STI': ('LCCC', 'CI', 'STR')})
        self.assertEqual(sorted((b['id'], b['Un']) for b in m['buses']), [('JI', 230e3), ('JR', 345e3), ('SI.abc', 230e3), ('SR.abc', 345e3)])
        q, = m['lcc']
        self.assertEqual((q['id'], q['rec'], q['inv'], q['pole']), ('STR', 'STR', 'STI', 1))
        for k, v in (('Ra', 2.5), ('La', 0.5968), ('Rb', 2.5), ('Lb', 0.5968), ('C', 26e-6)):
            self.assertAlmostEqual(q[k], v, delta=1e-12 * max(v, 1), msg=k)
        self.assertEqual(q['faults'], [{'id': 'FDC', 'label': 'σφάλμα DC', 'R': 0.1, 'prog': '0:0, 1:1, 1.15:0'}])
        self.assertEqual(sum(e['type'] == 'FILT3' for e in m['elements']), 6)
        self.assertEqual(drawing({'ev': 'ss'})['lcc'][0]['faults'], [])

    def test_what_stays_out(self):
        """Without the C one series path; without the inverter's LCCC, with an R to the ground on the line, or with a C at a second
        node, no link and a warning; a fault switch that is always on: the link without it, and a warning."""
        def drop(*ids):
            def f(pr):
                pr['components'] = [c for c in pr['components'] if c['id'] not in ids]
                pr['wires'] = [w for w in pr['wires'] if w['a']['c'] not in ids and w['b']['c'] not in ids]
            return f

        def add(*items):
            def f(pr):
                for c, ws in items:
                    pr['components'].append({'id': c[0], 'type': c[1], 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': c[0], 'params': c[2]})
                    for k, (a, b) in enumerate(ws):
                        pr['wires'].append({'id': f'x{c[0]}{k}', 'a': {'c': a[0], 'p': a[1]}, 'b': {'c': b[0], 'p': b[1]}, 'pts': []})
            return f
        q, = drawing(edit=drop('CM', 'GM'))['lcc']
        self.assertEqual((q['C'], q['Ra'], q['Rb'], q['Lb']), (0, 5.0, 0, 0))
        self.assertAlmostEqual(q['La'], 2 * 0.5968, delta=1e-12)
        for edit, why in ((drop('CI'), 'LCCC'), (add((('RX', 'R', {'R': 1e4}), [(('RX', 'a'), ('JM', 'j')), (('RX', 'b'), ('GM', 'g'))])), 'RX (R)'),
                          (add((('CX', 'C', {'C': 1e-6}), [(('CX', 'p'), ('LR', 'b')), (('CX', 'n'), ('GM', 'g'))])), 'πάνω από έναν κόμβο')):
            m = drawing(edit=edit)
            self.assertNotIn('lcc', m, why)
            self.assertTrue(any(why in w for w in m['warnings']), (why, m['warnings']))
        m = drawing({'ev': 'dcf'}, {'FDC': {'gate': 'on'}})
        self.assertEqual(m['lcc'][0]['faults'], [])
        self.assertTrue(any('από την αρχή' in w for w in m['warnings']))


@unittest.skipUnless(HAVE_NODE, 'Node.js')
class LoadFlow(unittest.TestCase):
    def test_against_the_api(self):
        """The load flow AC/DC of the drawing (avg: no losses; fast: the valves as R_eq = 4·R_on = 0,04 Ω) against
        benchmark_network with the same sources: V_d to 10⁻³ V (measured 6,9·10⁻⁵), α and γ to 10⁻⁶° (1,4·10⁻⁸), Q to 1 var (0,12),
        |V| of the HT buses to 10⁻⁹ pu (1,3·10⁻¹⁰); the results by the ids of the drawing."""
        for mdl, kw in (('avg', {}), ('fast', {'sr': {'Req': 0.04, 'Vdrop': 0.0}, 'si': {'Req': 0.04, 'Vdrop': 0.0}})):
            m = drawing({'model': mdl, 'ev': 'ss'})
            r = model.load_flow(m)
            self.assertTrue(r['converged'])
            q = api(m, **kw).acdc_flow()
            o, p = r['lcc']['STR'], q['lcc']['DC']
            self.assertEqual(o['mode'], 1)
            for k, tol in (('Vdr', 1e-3), ('Vdi', 1e-3), ('Id', 1e-9), ('alpha_r', 1e-6), ('alpha_i', 1e-6), ('gamma', 1e-6), ('Pr', 1.0), ('Qr', 1.0), ('Pi', 1.0), ('Qi', 1.0)):
                self.assertAlmostEqual(o[k], p[k], delta=tol, msg=(mdl, k))
            for b, a in (('JR', 'R'), ('JI', 'I')):
                self.assertAlmostEqual(r['buses'][b]['V'], q['buses'][a]['V'], delta=1e-9)
            el = r['elements']
            self.assertAlmostEqual(el['STR']['P'], -p['Pr'], delta=1.0)
            self.assertAlmostEqual(el['STI']['P'], -p['Pi'], delta=1.0)
            self.assertAlmostEqual(el['STI']['gamma'], 15.0, delta=1e-9)
            self.assertAlmostEqual(el['STR']['Pdc'] + el['STI']['Pdc'], p['Pdr'] - p['Pdi'], delta=1.0)     # the losses of the line
            self.assertLess(el['FR1']['Q'], 0)                                                             # a capacitor gives Q
        s = study.run({'drawing': m, 'study': 'pf'})
        self.assertTrue(s['summary']['converged'])
        self.assertAlmostEqual(s['result']['elements']['STI']['gamma'], 15.0, delta=1e-9)


@unittest.skipUnless(HAVE_NODE, 'Node.js')
class AgainstTheAPI(unittest.TestCase):
    """The RMS of the drawing (h = 1 ms, its own events at 1,0 s) against benchmark_network with the same events (THEORY
    §8ΩΩΒ.4)."""

    def test_step_and_dc_fault(self):
        """To the rounding: measured 9,1·10⁻¹³ kV, 3,6·10⁻¹⁵ kA, 1,3·10⁻¹³°."""
        for ev, evs in (('step', STEP), ('dcf', DCF)):
            m = drawing({'model': 'avg', 'ev': ev})
            d = model.dynamic(m, t_end=1.5, h=0.001, record=0.001)
            a = api(m).dynamic(t_end=1.5, events=evs, h=0.001, record=0.001)
            self.assertEqual([(round(e['t'], 9), e['kind']) for e in d['events']], [(round(e['t'], 9), e['kind']) for e in a['events']])
            x = rm(d['lcc']['STR'], a['lcc']['DC'], ('Vdr', 'Vdi', 'Id_r', 'Id_i', 'gamma'))
            self.assertLess(max(x['Vdr'], x['Vdi']), 1e-9, ev)
            self.assertLess(max(x['Id_r'], x['Id_i']), 1e-12, ev)
            self.assertLess(x['gamma'], 1e-10, ev)

    def test_three_phase_fault_at_the_inverter(self):
        """The same events (the fault, the commutation failures and their ends) and to the rounding up to the end of the first bypass
        (1,02 s); after it a difference at the rounding grows (with 0,5 % of voltage at the inverter its γ and the loop γ → β → α
        divide by |V|): 0,32 kV during the fault, 7,9 kV within 0,35 s of its clearing; from 1,5 s V_d within 0,5 kV (measured
        0,0072 here and 0,055 in the CI; with relative changes of 10⁻¹⁶–10⁻⁸ in the source of the rectifier up to 0,058), I_d
        10⁻³ kA (2,9·10⁻⁵; up to 1,0·10⁻⁴), γ 0,1° (0,0014; up to 0,0093). See THEORY §8ΩΩΒ.4 (and decision 442: for later)."""
        m = drawing({'model': 'avg', 'ev': 'ac3'})
        d = model.dynamic(m, t_end=2.0, h=0.001, record=0.001)
        a = api(m).dynamic(t_end=2.0, events=AC3, h=0.001, record=0.001)
        self.assertEqual([(round(e['t'], 9), e['kind']) for e in d['events']], [(round(e['t'], 9), e['kind']) for e in a['events']])
        self.assertEqual(sum(e['kind'] == 'cf' for e in d['events']), 4)
        T = np.asarray(d['t'])
        x = rm(d['lcc']['STR'], a['lcc']['DC'], ('Vdr', 'Vdi', 'Id_r', 'Id_i'), T <= 1.02 + 1e-9)
        self.assertLess(max(x.values()), 1e-9)
        x = rm(d['lcc']['STR'], a['lcc']['DC'], ('Vdr', 'Vdi', 'Id_r', 'Id_i', 'gamma'), T > 1.5)
        self.assertLess(max(x['Vdr'], x['Vdi']), 0.5)
        self.assertLess(max(x['Id_r'], x['Id_i']), 1e-3)
        self.assertLess(x['gamma'], 0.1)


@unittest.skipUnless(HAVE_NODE, 'Node.js')
class AgainstTheEMT(unittest.TestCase):
    """The RMS of the drawing (h = 1 ms) against the EMT of the same drawing (tests/js/lcc_rms_cases.js), its events at 2,5 s (the
    PLLs of the EMT settled), windows of 5 ms from 2,0 s. The bounds are those of tests/test_rms_lcc.py (the link from the API);
    the measured values are in THEORY §8ΩΩΒ.4."""

    @classmethod
    def setUpClass(cls):
        cases = [{'opts': {'model': 'avg', 'ev': ev}, 'set': s, 't0': 2.0, 't1': 4.0, 'win': 0.005} for ev, s in SETS.items()]
        cases.append({'opts': {'model': 'fast', 'ev': 'step'}, 'set': SETS['step'], 't0': 2.0, 't1': 4.0, 'win': 0.005})
        cls.e = dict(zip(('step', 'dcf', 'ac3', 'step_det'), emt(cases)))
        cls.r = {}
        for key, mdl, ev in (('step', 'avg', 'step'), ('dcf', 'avg', 'dcf'), ('ac3', 'avg', 'ac3'), ('step_det', 'fast', 'step')):
            m = drawing({'model': mdl, 'ev': ev}, SETS[ev])
            st = None
            if ev == 'ac3':                                 # the average model of the EMT has no bypass (as tests/test_rms_lcc.py)
                st = {'STR': {**model.stations_of(m)[0]['STR'], 'cf': 'off'}}
            cls.r[key] = model.dynamic(m, t_end=4.0, h=0.001, record=0.001, stations=st)

    def diff(self, key, lo, hi):
        e, d = self.e[key], self.r[key]
        te = np.round(np.asarray(e['t']) - 2.0, 9)
        sel = (te > lo + 1e-9) & (te <= hi + 1e-9)
        w = windows(d['lcc']['STR'], np.asarray(d['t']) - 2.0, te[sel])
        out = {k: float(np.max(np.abs(w[k] - np.asarray(e[k])[sel] * sc))) for k, sc in (('vdr', 500.0), ('vdi', 500.0), ('ir', 1e-3), ('ii', 1e-3), ('gm', 1.0))}
        return {'v': max(out['vdr'], out['vdi']), 'i': max(out['ir'], out['ii']), 'gm': out['gm'], 'ii': out['ii'], 'ir': out['ir']}

    def test_the_events_of_the_drawing(self):
        self.assertEqual([(round(e['t'], 9), e['kind']) for e in self.r['dcf']['drawing']['events']], [(2.5, 'dcfault'), (2.65, 'dcclear')])
        self.assertEqual([(e['kind'], e['dI']) for e in self.r['step']['drawing']['events']], [('iord', -0.09999999999999998)])
        self.assertEqual(self.e['step']['warn'], [])

    def test_step_of_the_order(self):
        """From 150 ms after it V_d within 0,6 kV, I_d 0,002 kA, γ 0,1° (measured 0,52, 0,0008, 0,083); the detailed model (R_eq of
        its valves in the RMS) from 0,7 s within 6 kV, 0,005 kA, 0,3° (5,28, 0,0042, 0,23)."""
        d = self.diff('step', 0.65, 2.0)
        self.assertLess(d['v'], 0.6)
        self.assertLess(d['i'], 0.002)
        self.assertLess(d['gm'], 0.1)
        d = self.diff('step_det', 1.2, 2.0)
        self.assertLess(d['v'], 6.0)
        self.assertLess(d['i'], 0.005)
        self.assertLess(d['gm'], 0.3)

    def test_dc_fault(self):
        """The switch of the drawing as the fault of the line: from 50 ms after it V_d within 5 kV, I_d 0,012 kA (measured 4,13,
        0,0093); the recovery 3,5 kV, 0,015 kA (2,47, 0,0108); from 0,55 s after the clearing 1 kV, 0,002 kA (0,51, 0,0005)."""
        for lo, hi, v, i in ((0.55, 0.65, 5.0, 0.012), (0.85, 1.2, 3.5, 0.015), (1.2, 2.0, 1.0, 0.002)):
            d = self.diff('dcf', lo, hi)
            self.assertLess(d['v'], v, (lo, hi))
            self.assertLess(d['i'], i, (lo, hi))

    def test_three_phase_fault(self):
        """The FLT3 of the drawing, with the commutation failure off: during it I_d of the rectifier within 0,05 kA (measured
        0,033), of the inverter 0,3 kA (0,24); from 0,2 s after the clearing V_d within 2 kV, I_d 0,05 kA (1,49, 0,037; the RMS
        itself moves there up to 0,20 kV and 6,6·10⁻⁴ kA with relative changes of 10⁻¹⁵–10⁻⁸ in a source, THEORY §8ΩΩΒ.4), from
        0,55 s 1 kV, 0,002 kA (0,61, 0,0006; up to 0,056 kV)."""
        d = self.diff('ac3', 0.55, 0.65)
        self.assertLess(d['ir'], 0.05)
        self.assertLess(d['ii'], 0.3)
        for lo, hi, v, i in ((0.85, 1.2, 2.0, 0.05), (1.2, 2.0, 1.0, 0.002)):
            d = self.diff('ac3', lo, hi)
            self.assertLess(d['v'], v, (lo, hi))
            self.assertLess(d['i'], i, (lo, hi))


@unittest.skipUnless(HAVE_NODE, 'Node.js')
class StudiesOfTheDrawing(unittest.TestCase):
    def test_rms_study_and_report(self):
        """The study 'rms' of the drawing (as the card asks it): the link by its name, the events of the drawing, the note of the
        start; the report with its section; an event of the card (a step of the order) on top of those of the drawing."""
        m = drawing({'model': 'avg', 'ev': 'dcf'})
        q = {'drawing': m, 'study': 'rms', 'options': {'t_end': 1.3, 'h': 0.001, 'record': 0.001, 'drawing_events': True,
                                                        'events': [{'t': 1.2, 'kind': 'iord', 'gen': 'STR', 'dI': -0.1}]}}
        r = study.run(q)
        res = r['result']
        self.assertEqual(list(res['lcc']), ['STR'])
        self.assertEqual([e['kind'] for e in res['events'] if e['kind'] not in ('cf', 'cfend')], ['dcfault', 'dcclear', 'iord'])
        self.assertTrue(any('εκκίνηση' in n for n in r['network']['drawing']['notes']))
        x = study.report(q)
        self.assertIn('Ζεύξεις LCC', x['html'])

    def test_a_breaker_takes_a_station_out(self):
        """A CB3 between the inverter and its bus that opens at 1 s: the link out (the event gen) from the side of the station."""
        def brk(pr):
            pr['wires'] = [w for w in pr['wires'] if not ({w['a']['c'], w['b']['c']} == {'STI', 'JI'})]
            pr['components'].append({'id': 'BI', 'type': 'CB3', 'x': 0, 'y': 0, 'rot': 0, 'flip': False, 'label': 'BI', 'params': {'cmd': '0:1, 1:0', 'conn': 'bus'}})
            pr['wires'] += [{'id': 'xb1', 'a': {'c': 'BI', 'p': 'abc1'}, 'b': {'c': 'JI', 'p': 'j'}, 'pts': []},
                            {'id': 'xb2', 'a': {'c': 'BI', 'p': 'abc2'}, 'b': {'c': 'STI', 'p': 'abc'}, 'pts': []}]
        m = drawing({'ev': 'ss'}, edit=brk)
        net, info, conv, st, notes = model._rms_network(m)
        ev, n = model.events_of(m, net, info)
        self.assertEqual([(e['t'], e['kind'], e['gen']) for e in ev], [(1.0, 'gen', 'STR')])


if __name__ == '__main__':
    unittest.main()
