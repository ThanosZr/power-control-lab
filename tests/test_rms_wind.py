"""5.1.4: the wind turbines of IEC 61400-27-1:2020 in RMS (pcl.rms.Wind, ROADMAP §101, THEORY §8ΩΨ): the types 4A and 4B.
The standard gives the block diagrams of its modules, not results, and our EMT has no wind turbine: the checks are the start
at rest, the loops with a closed solution (a cascade of lags, the ramp limits, the drive train linearized by hand, the integral
of the Q and the voltage loops), the formulas of the modules at points of the result (the FRT injection in each mode, the
delay flag, the freeze, the current limitation, the reference frame rotation), the trip of the protection at the time of its
table, the Jacobian against central differences, and a fault in the IEEE 9 with a turbine in the place of G3."""
import math
import unittest

import numpy as np

from pcl import network as N
from pcl import rms


def behind(X=0.1, P=80e6, V=1.0):
    """A wind turbine WT of 100 MVA at bus B behind X (pu on 100 MVA) from a stiff source at 1 pu; P (W) and |V| from the load flow."""
    n = N.Network(f=50, S_base=100e6)
    n.bus('S', 33e3, kind='slack', V=1.0)
    n.bus('B', 33e3)
    n.feeder('S', Sk=None, V=1.0, slack=True, name='grid')
    n.branch_pu('S', 'B', 0.0, X, name='x')
    n.generator('B', Sr=100e6, Ur=33e3, xd2=0.2, cosphi=0.9, P=P, V=V, name='WT')
    return n


def run(md, ev, T=0.5, h=0.001, X=0.1):
    s = rms.System(behind(X), machines={'WT': {'Sn': 100e6, **md}}, f=50)
    start = s.init()
    r = s.simulate(T, events=ev, h=h)
    return s, start, r, s.quantities(r)['WT']


def wind(s):
    return [K for K in s.kinds if isinstance(K, rms.Wind)][0]


def at(r, t):
    return int(np.argmin(np.abs(r['t'] - t)))


class Start(unittest.TestCase):
    def test_every_variant_starts_at_rest(self):
        """In the place of G3 of the IEEE 9: each type in each Q control mode, and with the protection and the QP/QU limitation."""
        cases = [{'model': m, 'MqG': q} for m in rms.WIND_MODELS for q in range(5)]
        cases += [{'model': m, 'prot': 1, 'qlim': 'qpqu', 'MpUscale': 1} for m in rms.WIND_MODELS]
        for md in cases:
            s = rms.System(N.ieee9(), machines={'G3': {'Sn': 100e6, **md}}, f=60)
            start = s.init()
            r = s.simulate(1.0, h=0.01)
            self.assertLess(start['f'], 1e-12, md)
            self.assertLess(float(np.max(np.abs(r['x'][-1] - r['x'][0]))), 1e-12, md)

    def test_what_is_refused(self):
        net = N.ieee9()
        for md, why in (({'model': 'wt4a', 'Xd': 1.0}, 'άγνωστα'), ({'model': 'wt4a', 'xes': 0.1}, 'ηλεκτρικό σύστημα'),
                        ({'model': 'wt4a', 'MqFRT': 3}, 'ορισμός του χρήστη'), ({'model': 'wt4a', 'MqG': 5}, 'MqG'),
                        ({'model': 'wt4a', 'Tg': 0.0}, 'σταθερές χρόνου'), ({'model': 'wt4b', 'kdrt': 0.0}, 'k_drt'),
                        ({'model': 'wt4a', 'qlim': 'pq'}, 'qlim'), ({'model': 'wt4a', 'ipmaxu': 1.1}, 'ζευγών'),
                        ({'model': 'wt4a', 'qmin': -0.05}, 'q_WTmax')):
            with self.assertRaises(rms.RMSError, msg=str(md)) as c:
                rms.System(net, machines={'G3': {'Sn': 100e6, **md}}).init()
            self.assertIn(why, str(c.exception), md)
        self.assertIsNotNone(rms.System(net, machines={'G3': {'Sn': 100e6, 'model': 'wt4a', 'xes': 0.0}}))   # zero: only the breaker
        s = rms.System(net, machines={'G3': {'Sn': 100e6, 'model': 'wt4a', 'MqG': 1}})
        s.init()
        with self.assertRaises(rms.RMSError):                # M_qG 1: the reference is Q, not a voltage
            s.simulate(0.1, events=[{'t': 0.05, 'kind': 'vref', 'gen': 'G3', 'dV': 0.01}])
        s = rms.System(net, machines={'G3': {'Sn': 100e6, 'model': 'wt4a', 'MqG': 0}})
        s.init()
        with self.assertRaises(rms.RMSError):
            s.simulate(0.1, events=[{'t': 0.05, 'kind': 'qref', 'gen': 'G3', 'dQ': 0.01}])
        with self.assertRaises(rms.RMSError):                # qref only for the wind turbines
            s.simulate(0.1, events=[{'t': 0.05, 'kind': 'qref', 'gen': 'G1', 'dQ': 0.01}])


class Loops(unittest.TestCase):
    def test_the_active_current_against_three_lags(self):
        """4A, a small step of p_WTref (no ramp limit reached) behind a stiff source: i_p is the step through T_pWTref, T_pordp and T_g,
        1 − Σ T_i²/Π(T_i − T_j)·e^(−t/T_i); with h = 1 ms the trapezoidal rule to 4·10⁻⁷ (of a step of 0,01)."""
        T = (0.05, 0.02, 0.01)
        dP = 0.01
        s, start, r, q = run({'model': 'wt4a', 'MqG': 2, 'TpWTref': T[0], 'Tpordp': T[1], 'Tg': T[2]},
                             [{'t': 0.0, 'kind': 'pref', 'gen': 'WT', 'dP': dP}], T=0.3, h=0.001, X=1e-6)
        t = r['t']
        cf = 1.0 - sum(T[i] ** 2 / math.prod(T[i] - T[j] for j in range(3) if j != i) * np.exp(-t / T[i]) for i in range(3))
        self.assertLess(float(np.max(np.abs(q['ip'] - q['ip'][0] - dP * cf))), 1e-6)

    def test_the_reactive_current_in_open_loop_against_two_lags(self):
        """M_qG 2: a step of x_WTref (Q) through T_qord and T_g over u (stiff): to 2·10⁻⁶ of a step of 0,02 with h = 1 ms."""
        T2, Tg, dQ = 0.05, 0.01, 0.02
        s, start, r, q = run({'model': 'wt4a', 'MqG': 2, 'Tqord': T2, 'Tg': Tg}, [{'t': 0.0, 'kind': 'qref', 'gen': 'WT', 'dQ': dQ}],
                             T=0.3, h=0.001, X=1e-6)
        t = r['t']
        cf = 1 - (T2 * np.exp(-t / T2) - Tg * np.exp(-t / Tg)) / (T2 - Tg)
        self.assertLess(float(np.max(np.abs(q['iq'] - q['iq'][0] - dQ * cf))), 2e-6)

    def test_the_ramps_are_exact(self):
        """A step of −0,5 pu with dp_refmin −1 pu/s: the reference falls at exactly 1 pu/s, through the lag with its rate limit (4A)
        and through the stand-alone ramp limiter of Annex D.4 (4B), and ends at the new value."""
        for model, key in (('wt4a', 'pr'), ('wt4b', 'pl')):
            s, start, r, q = run({'model': model, 'MqG': 2, 'dprefmin': -1.0}, [{'t': 0.1, 'kind': 'pref', 'gen': 'WT', 'dP': -0.5}],
                                 T=1.0, h=0.005)
            t, y = r['t'], q[key]
            i1, i2 = at(r, 0.2), at(r, 0.5)
            sl = np.diff(y[i1:i2]) / np.diff(t[i1:i2])
            self.assertLess(float(np.max(np.abs(sl + 1.0))), 1e-9, model)
            self.assertAlmostEqual(float(y[-1]), 0.3, delta=1e-4)

    def test_the_closed_loops_reach_their_references(self):
        """M_qG 1: Q to its reference (the integral of the Q loop); M_qG 0 with the voltage drop (1): the voltage at r_drop + jx_drop
        from the terminals to u_ref (the integral of the voltage loop)."""
        s, start, r, q = run({'model': 'wt4a', 'MqG': 1}, [{'t': 0.1, 'kind': 'qref', 'gen': 'WT', 'dQ': 0.1}], T=20.0, h=0.01)
        self.assertAlmostEqual(float(q['Q'][-1]), float(q['Q'][0]) + 0.1, delta=1e-9)
        rd, xd = 0.01, 0.05
        s, start, r, q = run({'model': 'wt4a', 'MqG': 0, 'rdrop': rd, 'xdrop': xd}, [{'t': 0.1, 'kind': 'vref', 'gen': 'WT', 'dV': 0.02}],
                             T=20.0, h=0.01)
        u, p_, q_ = q['uf'][-1], q['pf'][-1], q['qf'][-1]
        uc = math.hypot(u - rd * p_ / u - xd * q_ / u, xd * p_ / u - rd * q_ / u)
        K = wind(s)
        self.assertAlmostEqual(uc, float(K.p['uref0'][0] + K.p['Xref'][0]) + 0.02, delta=1e-9)

    def test_the_drive_train_against_its_hand_linearization(self):
        """4B behind a stiff source: the states ω_WTR, ω_gen, the torsion, the power order and i_p linearized by hand (p = u·i_p,
        the order of p·ω_gen, p_aero constant): the torsional mode (about 1,75 Hz with our defaults) and the slow mode of the
        speed are eigenvalues of the whole System to 10⁻⁶."""
        s = rms.System(behind(1e-6, 80e6), machines={'WT': {'Sn': 100e6, 'model': 'wt4b', 'MqG': 2}}, f=50)
        s.init()
        lam = np.array(s.eigen('qr')['lambda'])
        p = {q: float(v[0]) for q, v in wind(s).p.items() if isinstance(v, np.ndarray) and v.shape == (1,)}
        p0, H1, H2, k, c, T2, Tg = 0.8, p['HWTR'], p['Hgen'], p['kdrt'], p['cdrt'], p['Tpordp'], p['Tg']
        A = np.array([[(-p0 - c) / (2 * H1), c / (2 * H1), -1 / (2 * H1), 0, 0],
                      [c / (2 * H2), (p0 - c) / (2 * H2), 1 / (2 * H2), 0, -1 / (2 * H2)],
                      [k, -k, 0, 0, 0],
                      [0, p0 / T2, 0, -1 / T2, 0],
                      [0, 0, 0, 1 / Tg, -1 / Tg]])
        mu = np.linalg.eigvals(A)
        for m in mu:
            if abs(m) < 50:                                  # (the fast two sit among the lags of 0,01 s of the other modules)
                self.assertLess(float(np.min(np.abs(lam - m))), 1e-6, m)
        tors = [abs(m.imag) / (2 * math.pi) for m in mu if m.imag > 1]
        self.assertAlmostEqual(tors[0], 1.75, delta=0.01)

    def test_the_jacobian_by_complex_step(self):
        """In a transient of 4B with the protection, away from the limits: against central differences, to 10⁻⁸ of the largest."""
        s, start, r, q = run({'model': 'wt4b', 'MqG': 1, 'prot': 1}, [{'t': 0.1, 'kind': 'pref', 'gen': 'WT', 'dP': -0.2}], T=0.15, h=0.005)
        x, y = r['x'][-1], np.r_[r['V'][-1].real, r['V'][-1].imag]
        J = s.jac(x, y).toarray()
        z, nx = np.r_[x, y], s.nx
        Jn = np.zeros_like(J)
        for c in range(len(z)):
            h = 1e-7 * max(1.0, abs(z[c]))
            zp, zm = z.copy(), z.copy()
            zp[c] += h
            zm[c] -= h
            fp, gp = s.fg(zp[:nx], zp[nx:])
            fm, gm = s.fg(zm[:nx], zm[nx:])
            Jn[:, c] = (np.r_[fp, gp] - np.r_[fm, gm]) / (2 * h)
        self.assertLess(float(np.max(np.abs(J - Jn))), 1e-8 * float(np.max(np.abs(J))))


class FaultRideThrough(unittest.TestCase):
    EV = [{'t': 0.2, 'kind': 'fault', 'bus': 'B', 'z': 0.1j}, {'t': 0.4, 'kind': 'clear', 'bus': 'B'}]

    def test_the_injection_in_each_mode(self):
        """A dip to about 0,53 pu for 0,2 s with T_post 0,2 s: during the dip i_qcmd is K_qv·Δu (M_qFRT 0) or the pre-fault i_qbase
        plus it (1, 2), Δu the dead band of the washout of u_WTCfilt; F_FRT 2 for T_post after it, with i_qbase + i_qpost (2); the
        integrators frozen while F_FRT ≥ 1. The formulas at the points of the result, to 10⁻¹²."""
        for mf in (0, 1, 2):
            s, start, r, q = run({'model': 'wt4a', 'MqG': 1, 'MqFRT': mf, 'Tpost': 0.2, 'iqpost': 0.1}, self.EV, T=1.0, h=0.005)
            p = {k: float(v[0]) for k, v in wind(s).p.items() if isinstance(v, np.ndarray) and v.shape == (1,)}
            t = r['t']
            i = at(r, 0.3)
            du = q['uf'][i] - q['us'][i]
            iqv = p['Kqv'] * (du - p['udb1'] if du < p['udb1'] else du - p['udb2'] if du > p['udb2'] else 0.0)
            base = q['ui'][i]                                # the frozen integral (K_PuFRT 0)
            want = iqv if mf == 0 else iqv + base
            self.assertEqual(int(q['frt'][i]), 1)
            self.assertAlmostEqual(float(q['iqcmd'][i]), min(max(want, p['iqmin']), p['iqh1']), delta=1e-12)
            post = (t > 0.42) & (t < 0.6)                   # (u_WTCfilt back above u_qdip at 0,41 s: T_post from there)
            self.assertTrue(np.all(q['frt'][post] == 2), mf)
            self.assertTrue(np.all(q['frt'][t > 0.62] == 0), mf)
            j = at(r, 0.5)
            self.assertAlmostEqual(float(q['iqcmd'][j]), {0: 0.0, 1: base, 2: base + p['iqpost']}[mf], delta=1e-12)
            frz = (t > 0.21) & (t < 0.6)
            for st in ('qi', 'ui'):
                self.assertEqual(float(np.ptp(q[st][frz])), 0.0, (mf, st))

    def test_the_current_limitation(self):
        """During the dip with M_qpri 1 (the reactive current first) i_pmax = √(i_maxdip² − min(|i_qcmd|, i_qmax(u))²); with M_qpri 0
        i_qmax = √(i_max² − min(i_pcmd, i_pmax(u))²) (the tables constant): to 10⁻¹²."""
        s, start, r, q = run({'model': 'wt4a', 'imaxdip': 1.2}, self.EV, T=0.5, h=0.005)
        i = at(r, 0.3)
        self.assertAlmostEqual(float(q['ipmax'][i]), math.sqrt(1.2 ** 2 - min(abs(q['iqcmd'][i]), 1.05) ** 2), delta=1e-12)
        self.assertAlmostEqual(float(q['ip'][i]), float(q['ipmax'][i]), delta=1e-3)          # (the order above it: at the limit)
        s, start, r, q = run({'model': 'wt4a', 'Mqpri': 0}, self.EV, T=0.5, h=0.005)
        i = at(r, 0.3)
        self.assertAlmostEqual(float(q['iqmax'][i]), min(math.sqrt(1.1 ** 2 - min(q['ipcmd'][i], 1.1) ** 2), 1.05), delta=1e-12)

    def test_the_reference_frame_rotation(self):
        """|u| below u_PLL2: the angle of the current is the frozen filter φ; between u_PLL2 and u_PLL1 the filter, moving; above
        u_PLL1 the angle of u itself (the current at the angles of i_p − j·i_q, to 10⁻¹⁵)."""
        for z, frozen, filt in ((0.002j, True, True), (0.008j, False, True), (0.05j, False, False)):
            s, start, r, q = run({'model': 'wt4a'}, [{'t': 0.1, 'kind': 'fault', 'bus': 'B', 'z': z}, {'t': 0.3, 'kind': 'clear', 'bus': 'B'}],
                                 T=0.4, h=0.005)
            K = wind(s)
            i1, i2 = at(r, 0.15), at(r, 0.29)
            V = r['V'][i1:i2, K.bus[0]]
            I = np.conj((q['P'][i1:i2] + 1j * q['Q'][i1:i2]) * K.p['k'][0] / V)
            ref = np.exp(1j * q['phi'][i1:i2]) if filt else V / np.abs(V)
            d = np.angle(I / ((q['ip'][i1:i2] - 1j * q['iq'][i1:i2]) * ref))
            self.assertLess(float(np.max(np.abs(d))), 1e-12, z)
            self.assertEqual(float(np.ptp(q['phi'][i1:i2])) == 0.0, frozen, z)

    def test_the_protection_trips_at_its_table(self):
        """prot 1, a dip that stays (about 0,53 pu): the under-voltage trip at t_fault + T_uunder(u_WTPfilt) of its table (linear
        between (0, 0,15 s) and (0,85, 3 s)), within a step; then P = Q = 0, no reconnection."""
        s, start, r, q = run({'model': 'wt4a', 'prot': 1}, [{'t': 0.2, 'kind': 'fault', 'bus': 'B', 'z': 0.1j}], T=3.0, h=0.005)
        trip = [e for e in r['events'] if e['kind'] == 'gen']
        self.assertEqual(len(trip), 1)
        self.assertEqual((trip[0]['by'], trip[0]['why']), ('prot', 'uu'))
        up = float(q['up'][at(r, 1.0)])
        self.assertAlmostEqual(trip[0]['t'], 0.2 + 0.15 + up / 0.85 * 2.85, delta=0.005)
        late = r['t'] > trip[0]['t'] + 1e-9
        self.assertEqual(float(np.max(np.abs(q['P'][late]))), 0.0)
        self.assertTrue(np.all(q['tripped'][late] == 1))

    def test_the_frequency_of_the_protection(self):
        """The frequency of the angle of u (Fig. 39) in the IEEE 9 with typical machines after a step of load: the speed of G2 once
        the filters have settled (to 2·10⁻⁴ pu after 5 s: bus 9 is not the rotor of G2 while the machines still swing)."""
        net = N.ieee9()
        mach = rms.typical(net, kind='af')
        mach['G3'] = {'model': 'wt4a', 'Sn': 100e6, 'prot': 1}
        s = rms.System(net, machines=mach, f=60)
        s.init()
        r = s.simulate(6.0, events=[{'t': 0.5, 'kind': 'load', 'bus': '5', 'P': 60.0}], h=0.005)
        q = s.quantities(r)
        late = r['t'] > 5.0
        self.assertLess(float(np.max(np.abs(q['G3']['fP'][late] - q['G2']['omega'][late]))), 2e-4)
        self.assertLess(float(q['G3']['fP'].min()), 0.98)


class InANetwork(unittest.TestCase):
    def test_the_ieee9_with_a_wind_turbine(self):
        """Network.dynamic with G3 as a turbine of type 4A and 4B (100 MVA): a fault of 0,15 s near it; the dip at bus 9, the FRT
        flag, the power back to its value, the result in 'converters' with the signals of the model."""
        for model in rms.WIND_MODELS:
            r = N.ieee9().dynamic(t_end=3.0, machines={'G3': {'model': model, 'Sn': 100e6}}, f=60, h=0.005,
                                  events=[{'t': 0.5, 'kind': 'fault', 'bus': '9', 'z': 0.05j}, {'t': 0.65, 'kind': 'clear', 'bus': '9'}])
            c = r['converters']['G3']
            self.assertEqual(c['model'], model)
            for k in ('P', 'Q', 'V', 'I', 'ip', 'iq', 'frt'):
                self.assertIn(k, c)
            t = np.asarray(r['t'])
            self.assertLess(float(np.min(r['buses']['9'])), 0.6)
            self.assertEqual(float(np.max(c['frt'])), 1.0)
            self.assertAlmostEqual(float(c['P'][-1]), 85.0, delta=3.0)
            self.assertTrue(r['stable'])
            self.assertEqual(r['stats']['nonconv'], 0)
            if model == 'wt4b':
                self.assertIn('omega_gen', c)
                self.assertGreater(float(np.max(c['omega_gen'])), 1.02)
            self.assertLess(abs(float(r['buses']['9'][-1]) - float(r['buses']['9'][0])), 0.05)   # (the swing of G1 and G2 goes on)
            self.assertEqual(len(t), len(c['P']))


if __name__ == '__main__':
    unittest.main()
