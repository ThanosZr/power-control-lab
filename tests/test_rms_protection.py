"""5.1.1 (ROADMAP §101 step 3, THEORY §8ΩΦ): the protection of the MMCC as events of the RMS dynamics (pcl.rms.HVDC with prot):
the block of a station when the AC voltage of its bus falls below V_uv, the deblock t_uv after it is back; the block for good
when its DC current exceeds I_dc,max, and the opening of its AC breaker t_cb later; the events 'block' and 'deblock' by hand.

The checks: the events at their instants (decided at the start of a step, after the events of that moment); a blocked station
without current, with its integrals held, and back to its reference after the deblock; nothing before t_prot; a station with
the protection but no reason to act gives the results without it bit for bit; the grid-forming station blocked against the
closed form of its droop with P = 0; the Jacobian of the device with a blocked station against differences; the translation of
the protection from the drawings (hvdc_mmc, hvdc_gfm, b4dcs2); what is refused. Against our EMT (hvdc_mmc, the AC fault at the
station of V_dc) in tests/test_rms_hvdc.py."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

from pcl import model
from pcl import network as N
from pcl import rms

ROOT = Path(__file__).resolve().parent.parent
HAVE_NODE = shutil.which('node') is not None
FAULT = [{'t': 0.5, 'kind': 'fault', 'bus': 'B'}, {'t': 0.6, 'kind': 'clear', 'bus': 'B'}]


def link(control='P', **data):
    """A link of two stations on a DC grid of two buses (R–L–C): S1 holds V_dc from a stiff AC bus, S2 takes 500 MW from the AC
    bus B (a feeder of 5 GVA) in the mode `control`, with its data (1000 MVA)."""
    net = N.Network(f=50.0, S_base=100e6)
    net.bus('A', 400e3)
    net.feeder('A', Sk=100e9, RX=0.1, name='QA')
    net.bus('B', 400e3)
    if control == 'Vf':
        net.load('B', P=300e6, Q=0.0, name='LD')
    else:
        net.feeder('B', Sk=5e9, RX=0.1, name='QB')
    net.dc_bus('D1', 640e3)
    net.dc_bus('D2', 640e3)
    net.dc_line('D1', 'D2', R=1.2, L=0.09, C=12.8e-6, poles=1, name='CAB')
    net.vsc('A', 'D1', control='V', V=1.0, Prated=1000e6, name='S1')
    if control == 'Vf':
        net.vsc('B', 'D2', control='Vf', Vac=1.0, Prated=1000e6, name='S2')
    else:
        net.vsc('B', 'D2', control='P', P=500e6, Prated=1000e6, name='S2')
    return net, {'S2': dict(data)}


def prot_events(r):
    return [(round(float(e['t']), 9), e['kind'], e['gen'], e['why']) for e in r['events'] if e.get('by') == 'prot']


def at(r, t):
    """The index of the last recorded point at t (after the events there)."""
    return int(np.flatnonzero(np.abs(np.asarray(r['t']) - t) < 1e-9)[-1])


class Undervoltage(unittest.TestCase):
    def test_the_block_and_the_deblock(self):
        # the fault at the bus of S2 (0.5–0.6 s): blocked at 0.5 s, right after the fault (|V| ≈ 0); deblocked t_uv = 20 ms after
        # the clearing; while blocked no current, no power on either side, and the integrals of its controls held
        for data in ({'prot': 1}, {'prot': 1, 'Ldc': 0.03}, {'prot': 1, 'tuv': 0.05}):
            net, st = link(**data)
            r = net.dynamic(1.2, events=FAULT, stations=st, h=0.005, record=0.005)
            self.assertEqual(r['stats']['nonconv'], 0, msg=data)
            tr = 0.6 + data.get('tuv', 0.02)
            self.assertEqual(prot_events(r), [(0.5, 'block', 'S2', 'uv'), (round(tr, 9), 'deblock', 'S2', 'uv')], msg=data)
            q = r['dc']['stations']['S2']
            t = np.asarray(r['t'])
            on = (t > 0.5 + 1e-9) & (t < tr - 1e-9)
            for k in ('P', 'Q', 'Pdc', 'I'):
                self.assertEqual(float(np.max(np.abs(np.asarray(q[k])[on]))), 0.0, msg=(data, k))
            self.assertTrue(np.all(np.asarray(q['blocked'])[on] == 1.0))
            self.assertTrue(np.all(np.asarray(q['blocked'])[t < 0.5 - 1e-9] == 0.0))
            self.assertTrue(np.all(np.asarray(q['blocked'])[t > tr + 1e-9] == 0.0))
            # back to its reference: −500 MW to the AC bus at the end
            self.assertAlmostEqual(float(q['P'][-1]), -500.0, delta=1e-3, msg=data)

    def test_the_integrals_held(self):
        net, st = link(prot=1)
        s = rms.System(net, stations=st)
        s.init()
        r = s.simulate(1.0, events=FAULT, h=0.005)
        K = next(k for k in s.kinds if isinstance(k, rms.HVDC))
        j = K.st_names.index('S2')
        xd, i_d, i_q = (r['x'][:, K.x0 + K.i_g[j, c]] for c in (2, 4, 5))
        t = r['t']
        on = (t > 0.5 + 1e-9) & (t < 0.62 - 1e-9)
        self.assertTrue(np.all(xd[on] == xd[on][0]))
        self.assertTrue(np.all(i_d[on] == 0.0) and np.all(i_q[on] == 0.0))
        self.assertNotEqual(float(xd[on][0]), 0.0)

    def test_nothing_before_t_prot(self):
        net, st = link(prot=1)
        ev = [{'t': 0.2, 'kind': 'fault', 'bus': 'B'}, {'t': 0.25, 'kind': 'clear', 'bus': 'B'}]
        r = net.dynamic(0.6, events=ev, stations=st, h=0.005, record=0.005)
        self.assertEqual(prot_events(r), [])
        r = net.dynamic(0.6, events=ev, stations={'S2': {'prot': 1, 'tprot': 0.1}}, h=0.005, record=0.005)
        self.assertEqual(prot_events(r), [(0.2, 'block', 'S2', 'uv'), (0.27, 'deblock', 'S2', 'uv')])

    def test_without_a_reason_the_same_bit_for_bit(self):
        # a step of P (no fault): with the protection the same results as without it (the block computes nothing while no
        # station is blocked), only the key 'blocked' more
        ev = [{'t': 0.4, 'kind': 'pref', 'gen': 'S2', 'dP': 0.2}]
        r0 = link()[0].dynamic(1.0, events=ev, stations={'S2': {}}, h=0.005, record=0.005)
        r1 = link()[0].dynamic(1.0, events=ev, stations={'S2': {'prot': 1}}, h=0.005, record=0.005)
        self.assertTrue(np.array_equal(r0['t'], r1['t']))
        for nm in ('S1', 'S2'):
            a, b = r0['dc']['stations'][nm], r1['dc']['stations'][nm]
            self.assertEqual(set(b) - set(a), {'blocked'})
            for k in a:
                self.assertTrue(np.array_equal(np.asarray(a[k]), np.asarray(b[k])), msg=(nm, k))
        for b in ('D1', 'D2'):
            self.assertTrue(np.array_equal(r0['dc']['buses'][b]['U'], r1['dc']['buses'][b]['U']))
        self.assertEqual(r0['stats']['newton'], r1['stats']['newton'])


class Overcurrent(unittest.TestCase):
    def test_the_block_for_good_and_the_breaker(self):
        # I_dc,max 0.3 pu with 0.5 pu flowing: at the first look after t_prot (the step that starts at 0.305 s: the check is at
        # the start of a step, t > t_prot) blocked for good, and t_cb = 40 ms later the station out (its AC breaker)
        net, st = link(prot=1, Idcmax=0.3)
        r = net.dynamic(0.8, stations=st, h=0.005, record=0.005)
        self.assertEqual(prot_events(r), [(0.305, 'block', 'S2', 'oc'), (0.345, 'gen', 'S2', 'brk')])
        q = r['dc']['stations']['S2']
        self.assertEqual(float(np.max(np.abs(np.asarray(q['P'])[np.asarray(r['t']) > 0.305 + 1e-9]))), 0.0)
        self.assertEqual(float(q['blocked'][-1]), 1.0)


class ByHand(unittest.TestCase):
    def test_block_and_deblock(self):
        net, st = link()
        ev = [{'t': 0.3, 'kind': 'block', 'gen': 'S2'}, {'t': 0.4, 'kind': 'deblock', 'gen': 'S2'}]
        r = net.dynamic(1.0, events=ev, stations=st, h=0.005, record=0.005)
        self.assertEqual([(e['t'], e['kind']) for e in r['events']], [(0.3, 'block'), (0.4, 'deblock')])
        q = r['dc']['stations']['S2']
        self.assertEqual(float(q['P'][at(r, 0.35)]), 0.0)
        self.assertEqual(float(q['blocked'][at(r, 0.35)]), 1.0)
        self.assertAlmostEqual(float(q['P'][-1]), -500.0, delta=1e-3)

    def test_the_station_that_forms_its_island(self):
        # S2 (Vf) blocked by hand: no current, the island without a source (its voltage zero), the integral of its AC voltage held
        net, st = link('Vf')
        s = rms.System(net, stations=st)
        s.init()
        r = s.simulate(0.5, events=[{'t': 0.2, 'kind': 'block', 'gen': 'S2'}], h=0.005)
        self.assertEqual(r['stats']['nonconv'], 0)
        K = next(k for k in s.kinds if isinstance(k, rms.HVDC))
        xv = r['x'][:, K.x0 + K.i_f[0, 0]]
        late = r['t'] > 0.2 + 1e-9
        self.assertTrue(np.all(xv[late] == xv[late][0]))
        self.assertLess(float(np.max(np.abs(r['V'][late][:, s.idx['B']]))), 1e-9)

    def test_the_grid_forming_station(self):
        # S2 grid-forming (droop) blocked by hand at 0.2 s: its law sees P = 0, so P_f falls as e^(−2π·f_p·τ) and
        # ω = 1 − m_p·(P_f − P_ref) = 1 + m_p·P₀·(1 − e^(−2π·f_p·τ)) (P_ref = P₀ from the load flow); measured with h = 1 ms the
        # largest difference from the closed form 1.7·10⁻⁵ over 0.3 s, with h = 5 ms 8.4·10⁻⁵ (while blocked the steps are
        # backward Euler in half steps, of the first order)
        net, _ = link('Vf')
        st = {'S2': {'model': 'gfm', 'law': 'droop', 'X': 0.15, 'R': 0.002}}
        r = net.dynamic(0.5, events=[{'t': 0.2, 'kind': 'block', 'gen': 'S2'}], stations=st, h=0.001, record=0.001)
        self.assertEqual(r['stats']['nonconv'], 0)
        q = r['dc']['stations']['S2']
        t = np.asarray(r['t'])
        P0 = float(q['P'][0]) / 1000.0
        late = t > 0.2 + 1e-9
        self.assertEqual(float(np.max(np.abs(np.asarray(q['P'])[late]))), 0.0)
        w = 1 + 0.02 * P0 * (1 - np.exp(-2 * math.pi * 5.0 * (t[late] - 0.2)))
        self.assertLess(float(np.max(np.abs(np.asarray(q['f'])[late] / 50.0 - w))), 3e-5)


class Jacobian(unittest.TestCase):
    def test_with_a_blocked_station(self):
        for data in ({'prot': 1}, {'prot': 1, 'Ldc': 0.03}):
            net, st = link(**data)
            s = rms.System(net, stations=st)
            s.init()
            K = next(k for k in s.kinds if isinstance(k, rms.HVDC))
            K._block('g', K.st_names.index('S2'), True)
            x = s._fix(s.x0.copy())
            rng = np.random.default_rng(3)
            x = x + 1e-3 * rng.standard_normal(s.nx)
            y = s.y0 + 1e-3 * rng.standard_normal(s.ny)
            J = s.jac(x, y).toarray()
            z = np.r_[x, y]
            Jn = np.empty_like(J)
            for j in range(len(z)):
                e = np.zeros(len(z))
                e[j] = 1e-6
                fp, gp = s.fg(*np.split(z + e, [s.nx]))
                fm, gm = s.fg(*np.split(z - e, [s.nx]))
                Jn[:, j] = (np.r_[fp, gp] - np.r_[fm, gm]) / 2e-6
            self.assertLess(float(np.max(np.abs(J - Jn) / np.maximum(np.abs(J), 1.0))), 1e-5, msg=data)


@unittest.skipUnless(HAVE_NODE, 'node')
class Drawing(unittest.TestCase):
    @staticmethod
    def drawing(tid, opts):
        out = subprocess.run(['node', str(ROOT / 'tests/js/model_cases.js'), 'build', tid, json.dumps(opts)], capture_output=True, text=True,
                             timeout=300, check=True)
        return model.of(json.loads(out.stdout))

    def test_the_protection_of_the_mmcc(self):
        # hvdc_mmc and hvdc_gfm: the protection on (tprot 0.3 s, I_dc,max 2 pu), also for the grid-forming station; b4dcs2: off
        st, notes = model.stations_of(self.drawing('hvdc_mmc', {'ev': 'acf'}))
        for k in ('MMC1', 'MMC2'):
            self.assertEqual((st[k]['prot'], st[k]['tprot'], st[k]['Idcmax']), (1.0, 0.3, 2.0))
        self.assertEqual(notes, [])
        st, _ = model.stations_of(self.drawing('hvdc_gfm', {'ac': 'island'}))
        self.assertEqual((st['MMC2']['model'], st['MMC2']['prot']), ('gfm', 1.0))
        m = self.drawing('b4dcs2', {})
        st, _ = model.stations_of(m)
        self.assertTrue(st and all(d['prot'] == 0.0 for d in st.values() if 'prot' in d))
        # a VSC2 with an MMCC whose protection is on: a note (only the stations block in the RMS)
        conv, notes = model.converters_of(m)
        self.assertEqual(notes, [])
        for e in m['elements']:
            if e['type'] == 'VSC2' and (e.get('ctl') or {}).get('type') == 'MMCC':
                e['ctl']['params']['prot'] = 'on'
        conv, notes = model.converters_of(m)
        self.assertEqual(len(notes), 1)
        self.assertIn('προστασία του MMCC', notes[0])


class Refused(unittest.TestCase):
    def test_what_is_refused(self):
        net, st = link()
        for bad in ({'t': 0.1, 'kind': 'block', 'gen': 'nope'}, {'t': 0.1, 'kind': 'deblock', 'gen': 'CAB'}):
            with self.assertRaises(rms.RMSError):
                net.dynamic(0.2, events=[bad], stations=st)
        with self.assertRaises(rms.RMSError):                # a generator is not a station
            N.ieee9().dynamic(0.2, events=[{'t': 0.1, 'kind': 'block', 'gen': 'G1'}])
        with self.assertRaises(rms.RMSError):                # an unknown key of the protection
            net.dynamic(0.2, stations={'S2': {'prot': 1, 'Iuv': 0.1}})


if __name__ == '__main__':
    unittest.main()
