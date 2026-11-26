"""5.1.6: the LCC link, continued (pcl.lcc, pcl.rms.LCC, pcl.dcgrid.acdc_flow; THEORY §8ΩΩΑ). The checks: the losses of the
stations, (10.57)–(10.58) of «Power System Stability and Control», against their closed form and the energy balance; the tap
changers against Example 10.2 (c) and Table E10.1 of the book, in the load flow AC/DC and in RMS (the steps settle where the
load flow puts them); the commutation failure of the inverter against the detailed model of our EMT (three-phase faults at the
inverter through 0,1, 150 and 200 Ω: whether it fails, and the energy through the inverter); the voltage criterion; the
Jacobian with the bypass and the losses; and a link together with a VSC link in the load flow AC/DC (against the two parts
solved apart) and in RMS (at rest, a step of the order)."""
import json
import math
import subprocess
import unittest
from pathlib import Path

import numpy as np

from pcl import dcgrid, lcc, rms
from pcl import network as N

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / 'tests' / 'js' / 'lcc_rms_cases.js'


def emt(cases, timeout=2400):
    r = subprocess.run(['node', str(JS), json.dumps(cases)], capture_output=True, text=True, timeout=timeout, cwd=str(ROOT))
    if r.returncode:
        raise RuntimeError(r.stderr[-2000:])
    out = json.loads(r.stdout)
    for o in out:
        if 'error' in o:
            raise RuntimeError(o['error'])
    return out


def example_10_2_c():
    """Example 10.2 (c): the link of (a) (tests/test_rms_lcc.py), the inverter's AC voltage 15 % down, with the tap changers of
    the book: the rectifier's holds α in 15°–20°, the inverter's V_d in 500–510 kV, steps of 0,01 pu."""
    net = N.Network(f=50)
    net.bus('A', 220e3)
    net.bus('B', 220e3)
    st = {'Sn': 0.1 * 110e3 ** 2 / (2 * math.pi), 'U1': 220e3, 'U2': 110e3, 'uk': 10.0, 'B': 4}
    net.lcc('A', 'B', Vdn=500e3, Idn=2000, R=20.0, sr=dict(st, oltc={'ctl': 'alpha', 'band': (15, 20)}),
            si=dict(st, oltc={'ctl': 'vd', 'band': (1.0, 1.02)}), gref=18.167, amin=5.0, dI=0.15, dgc=0.0,
            vdcol=(0.4, 1.0, 0.9, 1.0), name='L')
    Ei = (500 + 4 * 6 * 2) / math.cos(math.radians(18.167)) * 1e3 / (3 * math.sqrt(2) / math.pi * 4 * 0.5) / 220e3
    return net.element('L'), 229.12 / 220, 0.85 * Ei


def with_losses(Req=1.0, Vdrop=2000.0):
    net = lcc.benchmark_network()
    e = net.element('DC')
    for s in ('r', 'i'):
        e[s]['Req'], e[s]['Vdrop'] = Req, Vdrop
    return net


def hybrid():
    """The benchmark with a VSC link of 100 MW in parallel (the rectifier's bus to the inverter's, a DC cable of 5 Ω)."""
    net = lcc.benchmark_network()
    net.dc_bus('D1', 320e3)
    net.dc_bus('D2', 320e3)
    net.dc_line('D1', 'D2', R=5.0, L=0.1, C=10e-6, poles=2, name='DL')
    net.vsc('R', 'D1', control='P', P=100e6, Rc=0.0005, Xc=0.05, Q=0.0, name='VR')
    net.vsc('I', 'D2', control='V', V=1.0, Rc=0.0005, Xc=0.05, Q=0.0, name='VI')
    return net


class Losses(unittest.TestCase):
    def test_closed_form_and_balance(self):
        """R_eq 1 Ω and V_drop 2 kV at each station, 2 kA: 2·(R_eq·I² + V_drop·I) = 16 MW of converter losses, the line 20 MW, and
        P_r − |P_i| their sum; the DC voltages of (10.57)–(10.58) from the bridge; the RMS at rest at the load flow."""
        net = with_losses()
        d = net.acdc_flow()['lcc']['DC']
        self.assertAlmostEqual(d['losses_conv'], 16e6, delta=1e-3)
        self.assertAlmostEqual(d['losses'], 5.0 * d['Id'] ** 2, delta=1e-3)
        self.assertAlmostEqual(d['Pr'] + d['Pi'], d['losses'] + d['losses_conv'], delta=1e-3)
        e = net.element('DC')
        k = lcc.consts(e, 345e3, 230e3)
        pf = net.acdc_flow()
        V, idx = pf['_V'], pf['_idx']
        Er, Ei = abs(V[idx['R']]), abs(V[idx['I']])
        o = lcc.operating_point(e, 345e3, 230e3, Er, Ei)
        i = o['i']
        self.assertAlmostEqual(o['vr'], k['r']['vd0'] * Er * math.cos(o['ar']) - (k['r']['rc'] + k['r']['req']) * i - k['r']['vdrop'], delta=1e-12)
        self.assertAlmostEqual(o['vi'], k['i']['vd0'] * Ei * math.cos(o['g']) - (k['i']['rc'] - k['i']['req']) * i + k['i']['vdrop'], delta=1e-12)
        s = rms.System(net)
        start = s.init()
        self.assertLess(start['f'], 1e-12)
        r = s.simulate(0.5, h=0.005)
        self.assertLess(float(np.max(np.abs(r['x'][-1] - r['x'][0]))), 1e-8)

    def test_neglecting_them(self):
        """§10.9.1 (after (10.58)): neglecting the losses gives a small error in P and a larger one in Q. Here, with R_eq 1 Ω and
        V_drop 2 kV at each station: the rectifier's P 1,6 % (the 16 MW of the losses) and its Q 2,7 % (15 Mvar, down: the bridge
        at a smaller α); the inverter's, on γ, the same."""
        a = lcc.benchmark_network().acdc_flow()['lcc']['DC']
        b = with_losses().acdc_flow()['lcc']['DC']
        dP, dQ = abs(b['Pr'] / a['Pr'] - 1), abs(b['Qr'] / a['Qr'] - 1)
        self.assertLess(dP, 0.02)
        self.assertGreater(dQ, 1.5 * dP)
        self.assertAlmostEqual(b['Pr'] - a['Pr'], 16e6, delta=1e3)
        self.assertAlmostEqual(b['Pi'], a['Pi'], delta=1.0)


class Taps(unittest.TestCase):
    def test_example_10_2_c(self):
        """The book's result: the inverter's tap at 1,18 pu (V_di 501,55 kV), the rectifier's at 0,99 (α 15,8°); ours 501,64 kV
        and 15,75° (the book rounds V_d0 and the constants). And rows of Table E10.1 on the way (the inverter's tap first, then
        the rectifier's): (1,08, 0,93) 455,0 kV, 19,4°; (1,13, 0,95) 478,3 kV, 15,6°; (1,17, 0,98) 496,9 kV, 15,3°."""
        e, Er, Ei = example_10_2_c()
        o = lcc.operating_point(e, 220e3, 220e3, Er, Ei)
        rows = {}
        for _ in range(100):
            moved = False
            for side in ('i', 'r'):
                if lcc.tap_step(e, o, side):
                    moved = True
                    o = lcc.operating_point(e, 220e3, 220e3, Er, Ei)
            rows[(o['n']['i'], o['n']['r'])] = (o['Vdi'] / 1e3, math.degrees(o['ar']))
            if not moved:
                break
        self.assertEqual((o['n']['i'], o['n']['r']), (1.18, 0.99))
        self.assertAlmostEqual(o['Vdi'] / 1e3, 501.55, delta=0.2)
        self.assertAlmostEqual(math.degrees(o['ar']), 15.8, delta=0.06)
        for key, (v, a) in (((1.08, 0.93), (455.0, 19.4)), ((1.13, 0.95), (478.3, 15.6)), ((1.17, 0.98), (496.9, 15.3))):
            self.assertIn(key, rows)
            self.assertAlmostEqual(rows[key][0], v, delta=0.2)
            self.assertAlmostEqual(rows[key][1], a, delta=0.11)
        e2, Er, Ei = example_10_2_c()
        o2 = lcc.operating_point_taps(e2, 220e3, 220e3, Er, Ei)
        self.assertEqual((o2['n']['i'], o2['n']['r']), (1.18, 0.99))

    def test_load_flow_and_rms(self):
        """The benchmark with tap changers (the rectifier's α in 12,5°–17,5°, the inverter's V_d in 0,995–1,005 pu, steps of
        0,625 %, 1 s each in RMS): the load flow AC/DC puts the inverter's at 1,0125 (two steps) and V_di in its band; the RMS
        from the load flow without them takes the same two steps, at 1 and 2 s, and settles at the same point."""
        net = lcc.benchmark_network()
        pf0 = net.acdc_flow()
        e = net.element('DC')
        e['r']['oltc'] = {'ctl': 'alpha', 'band': (12.5, 17.5), 'step': 0.00625, 'nmin': 0.8, 'nmax': 1.2, 'T': 1.0}
        e['i']['oltc'] = {'ctl': 'vd', 'band': (0.995, 1.005), 'step': 0.00625, 'nmin': 0.8, 'nmax': 1.2, 'T': 1.0}
        pf1 = net.acdc_flow()
        d = pf1['lcc']['DC']
        self.assertTrue(pf1['converged'])
        self.assertEqual((d['n_r'], d['n_i']), (1.0, 1.0125))
        self.assertTrue(0.995 <= d['Vdi'] / 500e3 <= 1.005)
        e.pop('_n')
        r = net.dynamic(t_end=10.0, h=0.005, record=0.05, pf=pf0)
        taps = [(round(x['t'], 6), x['side'], x['n']) for x in r['events'] if x['kind'] == 'tap']
        self.assertEqual(taps, [(1.0, 'i', 1.00625), (2.0, 'i', 1.0125)])
        L = r['lcc']['DC']
        self.assertEqual((L['n_r'][-1], L['n_i'][-1]), (1.0, 1.0125))
        self.assertAlmostEqual(L['Vdi'][-1] * 1e3, d['Vdi'], delta=0.05e3)
        self.assertAlmostEqual(L['alpha_r'][-1], d['alpha_r'], delta=0.02)


class CommutationFailure(unittest.TestCase):
    """Three-phase faults at the inverter's bus for 150 ms, in RMS (h = 1 ms, the event at 0,5 s) and in the detailed model of
    our EMT (the tutorial hvdc_lcc, model fast, the event at 2,5 s)."""
    RF = (0.1, 150.0, 200.0)

    @classmethod
    def setUpClass(cls):
        cases = [{'opts': {'model': 'fast', 'ev': 'ac3'}, 'set': {'FAC': {'ton': 2.5, 'toff': 2.65, 'Rf': R}}, 't0': 2.4, 't1': 3.3,
                  'win': 0.001} for R in cls.RF]
        cls.e = dict(zip(cls.RF, emt(cases)))
        cls.r = {}
        for R in cls.RF:
            ev = [{'t': 0.5, 'kind': 'fault', 'bus': 'I', 'z': R / (230e3 ** 2 / 100e6)}, {'t': 0.65, 'kind': 'clear', 'bus': 'I'}]
            for cf in ('gamma', 'off', 'voltage'):
                cls.r[(R, cf)] = lcc.benchmark_network().dynamic(t_end=1.3, events=ev, h=0.001, record=0.001, stations={'DC': {'cf': cf}})

    def energy(self, R, cf=None):
        """The energy through the inverter's DC side from 0,5 to 1,2 s after the fault (MJ): of the RMS, or (cf None) of the EMT."""
        if cf is None:
            e = self.e[R]
            t, p = np.asarray(e['t']) - 2.0, np.asarray(e['vdi']) * 500 * np.asarray(e['ii']) / 1e3
        else:
            r = self.r[(R, cf)]
            t, p = np.asarray(r['t']), np.asarray(r['lcc']['DC']['Pdi'])
        m = (t >= 0.5) & (t <= 1.2)
        return float(np.trapezoid(p[m], t[m]))

    def fails(self, R):
        """When the detailed EMT fails to commute (its flag, ms windows), as times after the fault."""
        e = self.e[R]
        t = np.asarray(e['t']) - 2.0
        return t[np.asarray(e['cf']) > 0.01]

    def test_deep_fault(self):
        """0,1 Ω (0,5 % voltage): a failure at the start, the inverter bypassed through the fault (V_d and its AC power 0); the
        energy 5 % below that of the detailed EMT (339 and 357 MJ; the bound 8 %), where without the model it is 29 % above."""
        r = self.r[(0.1, 'gamma')]
        cf = [x for x in r['events'] if x['kind'] == 'cf']
        self.assertAlmostEqual(cf[0]['t'], 0.5, delta=1e-9)
        L, t = r['lcc']['DC'], np.asarray(r['t'])
        on = np.asarray(L['cfon']) > 0
        self.assertGreater(np.mean(on[(t > 0.53) & (t < 0.65)]), 0.9)
        self.assertLess(float(np.max(np.abs(np.asarray(L['Vdi'])[on]))), 0.5)          # kV: only the drop of R_eq (0 here)
        self.assertLess(float(np.max(np.abs(np.asarray(L['Pi'])[on]))), 1e-6)
        self.assertGreater(len(self.fails(0.1)), 100)
        We, Wg, Wo = self.energy(0.1), self.energy(0.1, 'gamma'), self.energy(0.1, 'off')
        self.assertLess(abs(Wg / We - 1), 0.08)
        self.assertGreater(Wo / We - 1, 0.2)

    def test_at_the_clearing_and_none(self):
        """150 Ω: the detailed EMT fails at the clearing, and so does the RMS (its γ below 7,2° there); 200 Ω: neither fails. The
        RMS misses the failure at the start of the 150 Ω fault (the EMT fails there from the waveforms, a positive-sequence model
        cannot see it: §10.9.3 of the book)."""
        f = self.fails(150.0)
        self.assertTrue(np.any((f > 0.65) & (f < 0.75)))
        self.assertTrue(np.any(f < 0.53))
        cf = [x['t'] for x in self.r[(150.0, 'gamma')]['events'] if x['kind'] == 'cf']
        self.assertTrue(cf and all(0.65 - 1e-9 <= t < 0.75 for t in cf))
        self.assertEqual(len(self.fails(200.0)), 0)
        self.assertFalse([x for x in self.r[(200.0, 'gamma')]['events'] if x['kind'] == 'cf'])
        self.assertAlmostEqual(self.energy(200.0, 'gamma'), self.energy(200.0, 'off'), delta=1e-9)

    def test_voltage_criterion(self):
        """cf 'voltage' (|V| below 85 % of the load flow): the deep fault fails at its start; 150 Ω and 200 Ω (|V| above 98 %) do not."""
        cf = [x['t'] for x in self.r[(0.1, 'voltage')]['events'] if x['kind'] == 'cf']
        self.assertAlmostEqual(cf[0], 0.5, delta=1e-9)
        for R in (150.0, 200.0):
            self.assertFalse([x for x in self.r[(R, 'voltage')]['events'] if x['kind'] == 'cf'])


class Jacobian(unittest.TestCase):
    def test_with_the_bypass_and_the_losses(self):
        """The Jacobian of the device (complex steps) against central differences, the holds held: in a commutation failure (the
        bypass of the inverter) and with the losses of the stations, to 10⁻⁷ relative."""
        for net, events, t in ((lcc.benchmark_network(), [{'t': 0.5, 'kind': 'fault', 'bus': 'I', 'z': 0.1 / 529.0}], 0.51),
                               (with_losses(), [{'t': 0.5, 'kind': 'iord', 'gen': 'DC', 'dI': -0.1}], 0.53)):
            s = rms.System(net)
            s.init()
            r = s.simulate(t, events=events, h=0.001)
            x, y = r['x'][-1], np.r_[r['V'][-1].real, r['V'][-1].imag]
            K = [k for k in s.kinds if isinstance(k, rms.LCC)][0]
            if t == 0.51:
                self.assertEqual(K.p['cfon'], 1.0)
            s._freeze(x, y, t)
            J = s.jac(x, y, t).toarray()
            z, nx = np.r_[x, y], s.nx
            worst = 0.0
            for c in list(range(K.x0, K.x0 + K.nx)) + [nx + b for b in K.bus] + [nx + s.n + b for b in K.bus]:
                e = 1e-7 * max(1.0, abs(z[c]))
                zp, zm = z.copy(), z.copy()
                zp[c] += e
                zm[c] -= e
                d = (np.r_[s.fg(zp[:nx], zp[nx:], t)] - np.r_[s.fg(zm[:nx], zm[nx:], t)]) / (2 * e)
                worst = max(worst, float(np.max(np.abs(d - J[:, c])) / max(float(np.max(np.abs(d))), 1e-12)))
            s._thaw()
            self.assertLess(worst, 1e-7, t)


class WithVSC(unittest.TestCase):
    def test_load_flow_against_the_parts(self):
        """The link and a VSC link of 100 MW: the load flow AC/DC converges, and each part solved alone with the other's powers
        fixed (the VSC flow, _vsc_flow; the links' Newton, _lcc_flow without VSC) gives the same voltages, to 10⁻⁸ pu."""
        net = hybrid()
        pf = net.acdc_flow()
        self.assertTrue(pf['converged'])
        self.assertAlmostEqual(pf['converters']['VR']['Pdc'], 100e6, delta=1.0)
        V = np.asarray(pf['_V'])
        vs = [e for e in net.elements if e['kind'] == 'vsc']
        lc = [e for e in net.elements if e['kind'] == 'lcc']
        a = dcgrid._vsc_flow(net, vs, 'auto', 1e-10, None, False, 30, False, False, 0.0)
        self.assertTrue(a['converged'])
        self.assertLess(float(np.max(np.abs(np.asarray(a['_V']) - V))), 1e-8)
        b = dcgrid._lcc_flow(net, lc, [], 'auto', 1e-10, None, False, 30, False, False, 0.0)
        self.assertTrue(b['converged'])
        self.assertLess(float(np.max(np.abs(np.asarray(b['_V']) - V))), 1e-8)

    def test_rms(self):
        """At rest from that load flow; a step of the link's order to 0,9 pu: its current settles there, and the VSC link's
        power (control P) moves by 3,2 MW at the step (the AC voltage of its bus jumps) and is back at that of the load flow."""
        net = hybrid()
        s = rms.System(net)
        start = s.init()
        self.assertLess(start['f'], 1e-9)
        r = net.dynamic(t_end=1.5, events=[{'t': 0.3, 'kind': 'iord', 'gen': 'DC', 'dI': -0.1}], h=0.002, record=0.01)
        self.assertAlmostEqual(r['lcc']['DC']['Id_r'][-1], 1.8, delta=2e-3)
        P = np.asarray(r['dc']['stations']['VR']['P'])
        P0 = net.acdc_flow()['converters']['VR']['Ps'] / 1e6
        self.assertLess(float(np.max(np.abs(P - P0))), 4.0)
        self.assertLess(abs(P[-1] - P0), 0.01)


if __name__ == '__main__':
    unittest.main()
