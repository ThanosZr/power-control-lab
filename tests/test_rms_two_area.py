"""5.1 (ROADMAP §101 step 1, THEORY §8ΩΥ): the two-area system and the excitation systems of IEEE Std 421.5 in RMS.

The two-area system of Example 12.6 of Power System Stability and Control (pcl.network case 'two_area', pcl.rms.two_area_machines)
against the book: its load flow (p. 813), the modes with manual excitation (Table E12.3) and with four excitation systems
(Table E12.4). The differences are written as they are (our machine is the model E″ of §8ΩΝ, not the model of the book) and
checked as such. The new models (the AC1A, the saturation of the DC exciter by two points or as (8.21) of the book, the PSS1A
and the PSS2B of the standard) against closed forms: the small-signal gain and time constant of the DC exciter ((8.22)–(8.23)),
the rectifier regulation of Annex D, the frequency response of each stabilizer as the product of its blocks; and at rest, and
their Jacobian by complex step against central differences."""
import math
import unittest

import numpy as np

from pcl import network as N
from pcl import rms

ST = {'type': 'st1a', 'KA': 200.0, 'TR': 0.01, 'VRMIN': -99.0, 'VRMAX': 99.0}
PSS = {'KS': 20.0, 'TW': 10.0, 'T1': 0.05, 'T2': 0.02, 'T3': 3.0, 'T4': 5.4, 'VSMIN': -99.0, 'VSMAX': 99.0}
# Table E12.3 (the three rotor modes) and Table E12.4 (interarea, area 1, area 2): λ of the book
BOOK_MANUAL = (complex(-0.111, 3.43), complex(-0.492, 6.82), complex(-0.506, 7.02))
BOOK_EXC = {'dc': (complex(-0.018, 3.27), complex(-0.485, 6.81), complex(-0.500, 7.00)),
            'thyristor': (complex(0.031, 3.84), complex(-0.490, 7.15), complex(-0.496, 7.35)),
            'tgr': (complex(0.123, 3.46), complex(-0.450, 6.86), complex(-0.462, 7.05)),
            'pss': (complex(-0.501, 3.77), complex(-1.826, 8.05), complex(-1.895, 8.35))}


def system(machines, loads=rms.TWO_AREA_LOADS):
    s = rms.System(N.case_data('two_area'), machines=machines, loads=loads)
    s.init()
    return s


def rotor_modes(s):
    """The three rotor modes (interarea, area 1, area 2) by their shapes on the speeds."""
    e = s.eigen('qr')
    osc = [m for m in e['modes'] if 0.3 < m['f'] < 2.0 and m['lambda'].imag > 0 and m['zeta'] < 0.5]
    out = {}
    for m in osc:
        sh = m['shape']
        same1 = (sh['G1'] * np.conj(sh['G2'])).real > 0
        same2 = (sh['G3'] * np.conj(sh['G4'])).real > 0
        if same1 and same2 and (sh['G1'] * np.conj(sh['G3'])).real < 0:
            out['inter'] = m
        elif not same1 and abs(sh['G1']) > abs(sh['G3']):
            out['area1'] = m
        elif not same2 and abs(sh['G3']) > abs(sh['G1']):
            out['area2'] = m
    return out


class TwoArea(unittest.TestCase):
    def test_the_load_flow_of_the_example(self):
        """P, Q and E_t of the four units as on p. 813 (to the digits of the book; G3 is the slack bus)."""
        pf = N.case_data('two_area').power_flow()
        book = {'1': (700, 185, 1.03, 20.2), '2': (700, 235, 1.01, 10.5), '3': (719, 176, 1.03, -6.8), '4': (700, 202, 1.01, -17.0)}
        for b, (P, Q, V, a) in book.items():
            d = pf['buses'][b]
            self.assertAlmostEqual(d['P'] / 1e6, P, delta=0.5)
            self.assertAlmostEqual(d['Q'] / 1e6, Q, delta=0.5)
            self.assertAlmostEqual(d['V'], V, delta=1e-9)
            self.assertAlmostEqual(d['angle'], a, delta=0.08)

    def test_the_modes_with_manual_excitation(self):
        """Table E12.3: the interarea mode (G1, G2 against G3, G4) and the two local ones, with the shapes of Figure E12.10.
        Ours: the frequencies within 0,01 Hz, the real parts within 0,1/s (more damping in the local modes: our machine model)."""
        m = rotor_modes(system(rms.two_area_machines('manual')))
        for key, lam in zip(('inter', 'area1', 'area2'), BOOK_MANUAL):
            self.assertAlmostEqual(m[key]['f'], lam.imag / (2 * math.pi), delta=0.01)
            self.assertAlmostEqual(m[key]['lambda'].real, lam.real, delta=0.1)
        self.assertLess(m['inter']['zeta'], 0.04)

    def test_the_modes_with_each_excitation(self):
        """Table E12.4: the interarea mode a little damped with the DC exciter, unstable with the thyristor exciter and more
        with the transient gain reduction, damped with the PSS (and the local modes with it); frequencies within 0,05 Hz."""
        re = {}
        for exc, book in BOOK_EXC.items():
            m = rotor_modes(system(rms.two_area_machines(exc)))
            for key, lam in zip(('inter', 'area1', 'area2'), book):
                self.assertAlmostEqual(m[key]['f'], lam.imag / (2 * math.pi), delta=0.05, msg=(exc, key))
                self.assertAlmostEqual(m[key]['lambda'].real, lam.real, delta=0.35, msg=(exc, key))
            re[exc] = m['inter']['lambda'].real
        self.assertLess(re['dc'], 0)
        self.assertLess(re['pss'], -0.4)
        self.assertGreater(re['thyristor'], 0)
        self.assertGreater(re['tgr'], re['thyristor'])

    def test_the_interarea_mode_in_time(self):
        """The simulation and the eigenvalues agree: after a pulse of load (10 MW on bus 9 for 0,1 s), the period of δ₁ − δ₃
        between 6 and 26 s (the local modes have decayed) is that of the interarea mode within 0,5 %."""
        s = system(rms.two_area_machines('manual'))
        f = rotor_modes(s)['inter']['f']
        r = s.simulate(26.0, events=[{'t': 0.0, 'kind': 'load', 'bus': '9', 'P': 10.0, 'Q': 0.0},
                                     {'t': 0.1, 'kind': 'load', 'bus': '9', 'P': -10.0, 'Q': 0.0}], h=0.01)
        t = r['t']
        d = r['x'][:, s.state('G1', 'delta')] - r['x'][:, s.state('G3', 'delta')]
        k = t >= 6.0
        z = d[k] - np.mean(d[k])
        tk = t[k]
        up = [tk[i] - z[i] * (tk[i + 1] - tk[i]) / (z[i + 1] - z[i]) for i in range(len(z) - 1) if z[i] < 0 <= z[i + 1]]
        T = (up[-1] - up[0]) / (len(up) - 1)
        self.assertAlmostEqual(1 / T / f, 1.0, delta=0.005)


class Exciters(unittest.TestCase):
    def unit(self, avr=None, pss=None, gov=None):
        m = rms.two_area_machines('manual')
        for g in m:
            if avr:
                m[g]['avr'] = dict(avr)
            if pss:
                m[g]['pss'] = dict(pss)
        return system(m)

    def test_every_new_model_starts_at_rest(self):
        """AC1A (Table H.8), the DC exciter of the example with V_X of (8.21), DC1A with two points of saturation, PSS1A on the
        power and with every block, PSS2B (Table H.24): 5 s without a disturbance, nothing moves."""
        cases = [({'type': 'ac1a'}, None), (rms.TWO_AREA_EXCITATION['dc']['avr'], None),
                 ({'type': 'dc1a', 'E1': 3.1, 'SE1': 0.33, 'E2': 2.3, 'SE2': 0.10, 'KE': None}, None),
                 (ST, {**PSS, 'type': 'pss1a', 'INPUT': 2, 'KS': -1.0, 'T6': 0.02, 'A1': 0.01, 'A2': 1e-4}),
                 (ST, {'type': 'pss2b'}), ({'type': 'ac1a'}, {'type': 'pss2b', 'TW4': 5.0})]
        for avr, pss in cases:
            s = self.unit(avr, pss)
            r = s.simulate(5.0, h=0.01)
            self.assertLess(float(np.max(np.abs(r['x'] - r['x'][0]))), 1e-11, msg=(avr, pss))

    def test_the_pss1a_with_its_defaults_is_the_pss(self):
        """PSS1A with T6 = A1 = A2 = 0 on the speed is the stabilizer of the EMT (the PSS of 5.0.13): the same eigenvalues."""
        a = np.sort_complex(self.unit(ST, PSS).eigen('qr')['lambda'])
        b = self.unit(ST, {**PSS, 'type': 'pss1a'}).eigen('qr')['lambda']
        self.assertEqual(len(b), len(a) + 12)                     # T6 and the second-order block: three states per unit, at 0
        for lam in a:                                              # (the two near 0, of the reference of the angles, to 10⁻⁷)
            self.assertLess(float(np.min(np.abs(b - lam))), 1e-6 if abs(lam) < 1e-3 else 1e-9 * (1 + abs(lam)))

    def test_the_dc_exciter_small_signal(self):
        """(8.22)–(8.23) of the book: with V_X = A_EX·e^(B_EX·E) the exciter alone is K/(1 + sT), K = 1/(B_EX·S_E + K_E),
        T = T_E·K, S_E = A_EX·e^(B_EX·E_FD0); with V_X = E·S_E(E) the slope is K_E + S_E + E·S_E′ instead."""
        for vx in (1.0, 0.0):
            s = self.unit({**rms.TWO_AREA_EXCITATION['dc']['avr'], 'KE': 0.05, 'VXEXP': vx})
            K = next(k for k in s.kinds if isinstance(k, rms.Unit))
            q = K.p['avr']
            ie = K.states.index('avr_efd')
            X = s.x0[K.x0:K.x0 + K.nx * K.m].reshape(K.m, K.nx).astype(complex)
            X[:, ie] += 1e-30j
            V = s.y0[:s.n][K.bus] + 1j * s.y0[s.n:][K.bus]
            dfe = K.eval(X, V.real.astype(complex), V.imag.astype(complex), 0.0)[0][:, ie].imag / 1e-30
            e0, A, B, TE = q['e0'], q['SA'], q['SB'], q['TE']
            SE = A * np.exp(B * e0)
            slope = (B * SE + 0.05) if vx else (0.05 + SE + e0 * B * SE)
            np.testing.assert_allclose(dfe, -slope / TE, rtol=1e-12)

    def test_the_two_points_of_saturation(self):
        """S_E = A·e^(B·E) passes through (E1, S_E(E1)) and (E2, S_E(E2)) of IEEE Std 421.5 Annex C (Table H.2 of DC1C)."""
        q = {'E1': np.array([3.1]), 'SE1': np.array([0.33]), 'E2': np.array([2.3]), 'SE2': np.array([0.10]), 'AEX': np.array([0.0]),
             'BEX': np.array([0.0])}
        A, B = rms._exc_ab(q)
        self.assertAlmostEqual(float((A * np.exp(B * 3.1))[0]), 0.33, delta=1e-14)
        self.assertAlmostEqual(float((A * np.exp(B * 2.3))[0]), 0.10, delta=1e-14)

    def test_the_rectifier_regulation(self):
        """Annex D (Fig. D.2): F_EX in its three modes, continuous at I_N = 0,433 and 0,75 to the digits of its constants, 0 at
        and above 1; and the start of the AC1A: V_E·F_EX(K_C·I_FD/V_E) = E_FD in each mode."""
        f = rms._fex
        self.assertAlmostEqual(float(f(np.array(0.2))), 1 - 0.577 * 0.2, delta=1e-15)
        self.assertAlmostEqual(float(f(np.array(0.433))) - math.sqrt(0.75 - 0.433 ** 2), 0, delta=3e-4)
        self.assertAlmostEqual(float(f(np.array(0.75))) - math.sqrt(0.75 - 0.75 ** 2), 0, delta=3e-4)
        self.assertEqual(float(f(np.array(1.0))), 0.0)
        self.assertEqual(float(f(np.array(1.2))), 0.0)
        for efd, ifd, kc in ((2.0, 2.0, 0.2), (1.0, 3.0, 0.5), (0.3, 3.0, 0.5), (1.5, 1.2, 0.0)):
            ve = rms._ve0(np.array(efd), np.array(ifd), kc)
            self.assertAlmostEqual(float(ve * f(kc * ifd / ve)), efd, delta=1e-12)
        modes = [float(kc * ifd / rms._ve0(np.array(efd), np.array(ifd), kc)) for efd, ifd, kc in ((2.0, 2.0, 0.2), (1.0, 3.0, 0.5), (0.3, 3.0, 0.5))]
        self.assertLess(modes[0], 0.433)
        self.assertTrue(0.433 < modes[1] < 0.75)
        self.assertGreater(modes[2], 0.75)

    def pss_response(self, pss, w_list):
        """The stabilizer alone, linearized by the complex step: H(jω) = C·(jωI − A)⁻¹·B + D from the speed and the power."""
        s = self.unit(ST, pss)
        K = next(k for k in s.kinds if isinstance(k, rms.Unit))
        Z0 = np.zeros((1, K.i_gov - K.i_pss))
        q = {k: (v[:1] if isinstance(v, np.ndarray) else v) for k, v in K.p['pss'].items()}
        keep = K.p['pss']
        K.p['pss'] = q
        try:
            n = Z0.shape[1]

            def f(Z, w, pe):
                y, F = K._pss(Z, w, pe)
                return F[0], y[0]
            A, C = np.zeros((n, n)), np.zeros(n)
            for j in range(n):
                Z = Z0.astype(complex)
                Z[0, j] += 1e-30j
                F, y = f(Z, np.array([1.0 + 0j]), np.array(q['pe0'], complex))
                A[:, j], C[j] = F.imag / 1e-30, y.imag / 1e-30
            out = []
            for which in (0, 1):
                w = np.array([1.0 + (1e-30j if which == 0 else 0)])
                pe = np.array(q['pe0'] + (1e-30j if which == 1 else 0), complex)
                F, y = f(Z0.astype(complex), w, pe)
                B, D = F.imag / 1e-30, float(y.imag / 1e-30)
                out.append([C @ np.linalg.solve(1j * om * np.eye(n) - A, B) + D for om in w_list])
            return q, out
        finally:
            K.p['pss'] = keep

    def test_the_pss1a_frequency_response(self):
        """PSS1A on the speed: 1/(1 + sT6)·K_S·sT5/(1 + sT5)·1/(1 + A1·s + A2·s²)·(1 + sT1)/(1 + sT2)·(1 + sT3)/(1 + sT4)."""
        p = {**PSS, 'type': 'pss1a', 'T6': 0.02, 'A1': 0.01, 'A2': 1e-4}
        ws = (0.5, 3.0, 10.0, 60.0)
        q, (Hw, _) = self.pss_response(p, ws)
        for om, h in zip(ws, Hw):
            s = 1j * om
            ref = 20.0 * s * 10 / (1 + s * 10) / (1 + 0.02 * s) / (1 + 0.01 * s + 1e-4 * s * s) * (1 + 0.05 * s) / (1 + 0.02 * s) * (1 + 3 * s) / (1 + 5.4 * s)
            self.assertLess(abs(h - ref), 1e-9 * abs(ref))

    def test_the_pss2b_frequency_response(self):
        """PSS2B of Table H.24 (M = 2, N = 4, T_W4 bypassed): from the speed K_S1·W1·W2·RTF·LL, from the power
        K_S1·(K_S3·RTF − 1)·K_S2/(1 + sT7)·W3·LL, with the power on the rating of the machine (900 MVA, the base 100 MVA)."""
        ws = (0.3, 2.0, 8.0, 40.0)
        q, (Hw, Hp) = self.pss_response({'type': 'pss2b'}, ws)
        ks2 = 10.0 / (2 * 6.5)
        self.assertAlmostEqual(float(q['KS2'][0]), ks2, delta=1e-15)
        for om, hw, hp in zip(ws, Hw, Hp):
            s = 1j * om
            W = s * 10 / (1 + s * 10)
            rtf = ((1 + 0.3 * s) / (1 + 0.15 * s) ** 2) ** 4
            ll = ((1 + 0.16 * s) / (1 + 0.02 * s)) ** 2
            self.assertLess(abs(hw - 20 * W * W * rtf * ll), 1e-9 * abs(hw))
            ref = 20 * (rtf - 1) * ks2 / (1 + 10 * s) * W * ll / 9.0     # 1 pu of the system base is 1/9 pu of the machine
            self.assertLess(abs(hp - ref), 1e-9 * abs(ref))

    def test_the_jacobian_by_complex_step(self):
        """The Jacobian with AC1A (wide limits), PSS1A on the power with every block, PSS2B with both washouts and DC1A with V_X
        of (8.21), inside a fault on bus 8, against central differences."""
        m = rms.two_area_machines('manual')
        m['G1']['avr'] = {'type': 'ac1a', 'VAMAX': 1e3, 'VAMIN': -1e3, 'VRMAX': 1e3, 'VRMIN': -1e3}
        m['G1']['pss'] = {**PSS, 'type': 'pss1a', 'INPUT': 2, 'KS': -1.0, 'T6': 0.02, 'A1': 0.01, 'A2': 1e-4}
        m['G2']['avr'] = dict(ST)
        m['G2']['pss'] = {'type': 'pss2b', 'TW4': 5.0, 'VSTMAX': 9.0, 'VSTMIN': -9.0, 'VSI1MAX': 9.0, 'VSI1MIN': -9.0,
                          'VSI2MAX': 99.0, 'VSI2MIN': -99.0}
        m['G3']['avr'] = {**rms.TWO_AREA_EXCITATION['dc']['avr']}
        s = system(m)
        r = s.simulate(0.12, events=[{'t': 0.0, 'kind': 'fault', 'bus': '8', 'z': 0.02}], h=0.004)
        x, y = r['x'][-1], np.r_[r['V'][-1].real, r['V'][-1].imag]
        J = s.jac(x, y).toarray()
        z = np.r_[x, y]
        worst = 0.0
        for j in range(s.nx):
            e = np.zeros_like(z)
            e[j] = 1e-6 * max(1.0, abs(z[j]))
            fp, gp = s.fg((z + e)[:s.nx], (z + e)[s.nx:])
            fm, gm = s.fg((z - e)[:s.nx], (z - e)[s.nx:])
            col = (np.r_[fp, gp] - np.r_[fm, gm]) / (2 * e[j])
            worst = max(worst, float(np.max(np.abs(col - J[:, j])) / (1 + np.max(np.abs(col)))))
        self.assertLess(worst, 1e-5)

    def test_what_is_refused(self):
        m = rms.two_area_machines('manual')
        m['G1']['pss'] = {'type': 'pss3b'}
        with self.assertRaises(rms.RMSError):
            system(m)
        m['G1']['pss'] = {'type': 'pss2b', 'M': 0}
        with self.assertRaises(rms.RMSError):
            system(m)
        with self.assertRaises(rms.RMSError):
            rms.two_area_machines('static')


if __name__ == '__main__':
    unittest.main()
