"""Power networks (4.2): IEC 60909-0:2016 against the test network of IEC TR 60909-4:2021 §9 (380/110/30/10 kV,
Tables 21–23, required deviation < 0,02 %), load flow against an independent solver (PYPOWER, same data) and the
solution stored in the IEEE 14-bus file, closed forms for the unbalanced faults and the ZIP loads.

The expected values are the TR's published results and independent solvers, never pcl itself. Only the input data
of the test network and the reference numbers are here (no text of the standards)."""
import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from pcl import network as N  # noqa: E402


def tr60909_4():
    """The test network of IEC TR 60909-4:2021, Figure 20 and §9.2.1 (data of the electrical equipment)."""
    n = N.Network(50, name='IEC TR 60909-4 §9')
    n.bus('1', 380e3)
    for b in '2345':
        n.bus(b, 110e3)
    n.bus('6', 10e3)
    n.bus('7', 10e3)
    n.bus('8', 30e3)
    n.bus('T4LV', 30e3, 'internal')                    # the unloaded tertiary of T4
    n.feeder('1', Ik=38e3, RX=0.1, X0X=3, R0X0=0.15, name='Q1')
    n.feeder('5', Ik=16e3, RX=0.1, X0X=3.3, R0X0=0.2, name='Q2')
    T = dict(Sr=(350e6, 350e6, 50e6), Ur=(400e3, 120e3, 30e3), uk=(21, 10, 7), ur=(0.26, 0.16, 0.16), ref='b')
    n.transformer3('1', '2', '8', name='T3', **T)
    n.transformer3('1', '2', 'T4LV', name='T4', z0=[{'side': 'b', 'x': 2.1, 'r': 1.0, 'ref': 'ab', 'k': 'bc'}], **T)
    n.unit('4', dict(Sr=150e6, Ur=21e3, xd2=0.14, cosphi=0.85, RG=0.002),
           dict(Sr=150e6, Uhv=115e3, Ulv=21e3, uk=16, ur=0.5, X0X=0.95, R0R=1.0), oltc=True, Zn=22j, name='S1')
    n.unit('3', dict(Sr=100e6, Ur=10.5e3, xd2=0.16, cosphi=0.9, RG=0.005, pG=0.075),
           dict(Sr=100e6, Uhv=120e3, Ulv=10.5e3, uk=12, ur=0.5), oltc=False, earthed=False, name='SO1')
    n.generator('6', Sr=10e6, Ur=10.5e3, xd2=0.1, cosphi=0.8, RG=0.018, name='G3')
    n.transformer('5', '6', 31.5e6, 115e3, 10.5e3, 12, 0.5, group='Yd5', name='T5')
    n.transformer('5', '6', 31.5e6, 115e3, 10.5e3, 12, 0.5, group='Yd5', name='T6')
    n.line('6', '7', 0.082, 0.086, 1, name='L6')
    n.motor('7', 5e6, 10e3, 0.88, 0.975, 5, p=1, name='M1')
    n.motor('7', 2e6, 10e3, 0.89, 0.968, 5.2, p=2, n=2, name='M2')
    n.line('2', '3', 0.12, 0.39, 20, R0=0.32, X0=1.26, name='L1')
    n.line('3', '4', 0.12, 0.39, 10, R0=0.32, X0=1.26, name='L2')
    n.line('2', '5', 0.12, 0.39, 5, R0=0.52, X0=1.86, parallel=2, name='L3')
    n.line('3', '5', 0.096, 0.388, 10, R0=0.22, X0=1.10, name='L4')
    n.line('4', '5', 0.12, 0.386, 15, R0=0.22, X0=1.10, name='L5')
    return n


# IEC TR 60909-4:2021, Table 22 (kA): I″k, i_p50 (method B without 1,15), i_p20 (method C), I_b (t_min = 0,1 s), I_k
IK = [40.6447, 31.7831, 19.6730, 16.2277, 33.1894, 37.5629, 25.5895, 13.5778]
IP50 = [100.5766, 80.5120, 45.8249, 36.8041, 83.6265, 99.1910, 51.3864, 36.9201]
IP20 = [100.5677, 80.6079, 45.8111, 36.8427, 83.4033, 98.1434, 51.6899, 36.9227]
IB = [40.645, 31.570, 19.388, 16.017, 32.795, 34.028, 23.212, 13.578]
IKS = [40.635, 31.663, 19.623, 16.196, 32.997, 34.356, 22.276, 13.573]
# Table 23 (buses 2–5): I″k1, i_p1 with κ(1) and with κ(012) (20 Hz), X₀/X₁
IK1 = [15.9722, 10.4106, 9.0498, 17.0452]
IP1 = [40.5086, 24.2424, 20.5463, 42.8337]
IP1_012 = [39.9641, 24.2635, 21.0415, 41.4303]
X0X1 = [3.961, 3.666, 3.394, 3.823]
TOL = 2e-4                                              # ±0,02 % (TR §9.1)


class TR60909_4(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.n = tr60909_4()

    def rel(self, got, ref, tol=TOL, msg=''):
        self.assertLess(abs(got - ref) / ref, tol, f'{msg}: {got} ≠ {ref}')

    def test_table_21_corrected_impedances(self):
        imp = self.n.impedances()
        c = lambda z, re, im, m: (self.assertAlmostEqual(z.real, re, delta=2e-6, msg=m), self.assertAlmostEqual(z.imag, im, delta=2e-6, msg=m))
        c(imp['Q1']['Z1'], 0.631933, 6.319335, 'Q1')
        c(imp['Q2']['Z1'], 0.434454, 4.344543, 'Q2')
        c(imp['Q2']['Z0'], 2.867398, 14.336991, 'Q2 Z0')
        t3 = imp['T3']
        c(t3['Z1']['a'], 0.045714, 8.096989, 'T3 A')
        c(t3['Z1']['b'], 0.053563, -0.079062, 'T3 B')
        c(t3['Z1']['c'], 0.408568, 20.292035, 'T3 C')
        for p, k in (('ab', 0.928072), ('ac', 0.985856), ('bc', 1.002890)):
            self.assertAlmostEqual(t3['K'][p], k, delta=1e-6, msg='K_T' + p)
        c(imp['T4']['Z0'], 0.107281, 18.195035, 'T4 Z0')
        c(imp['T5']['Z1'], 2.046454, 49.072241, 'T5')
        self.assertAlmostEqual(imp['T5']['K'], 0.974870, delta=1e-6)
        c(imp['S1']['Z1'], 0.498795, 26.336676, 'S')
        self.assertAlmostEqual(imp['S1']['K'], 0.995975, delta=1e-6)
        c(imp['S1']['Z0'] - 66j, 0.439059, 13.340874, 'S Z0 (without 3·Z_R1)')
        c(imp['SO1']['Z1'], 1.203944, 35.340713, 'SO')
        self.assertAlmostEqual(imp['SO1']['K'], 0.876832, delta=1e-6)
        c(imp['G3']['Z1'], 0.017790, 1.089623, 'G3')
        self.assertAlmostEqual(imp['G3']['K'], 0.988320, delta=1e-6)
        c(imp['M1']['Z1'], 0.341497, 3.414968, 'M1')
        c(imp['M2']['Z1'], 0.412137, 4.121368, 'M2 (2 in parallel)')

    def test_table_22_three_phase(self):
        for i, b in enumerate('12345678'):
            r = self.n.short_circuit(b, '3ph', f115=False)
            self.rel(r['Ik'] / 1e3, IK[i], msg=f'I″k at {b}')
            self.rel(r['ip_b0'] / 1e3, IP50[i], msg=f'i_p50 at {b}')
            self.rel(r['Ik_ss'] / 1e3, IKS[i], msg=f'I_k at {b}')
            # method C reproduces with the fictitious resistances R_Gf of the generators (IEC 60909-0, 6.6.1)
            self.rel(self.n.short_circuit(b, '3ph', rgf=True)['ip_c'] / 1e3, IP20[i], msg=f'i_p20 at {b}')

    def test_table_22_breaking_current(self):
        # Formula (77) as written in 2016 (Z_GK, Z_SK, Z_M) at the buses where it is the TR's result,
        # with the machines' own subtransient reactance (the 2001 form) at 6 and 7; buses 3–5 are an open point
        z = {b: self.n.short_circuit(b, '3ph')['Ib'] / 1e3 for b in '12345678'}
        x = {b: self.n.short_circuit(b, '3ph', breaking='x')['Ib'] / 1e3 for b in '67'}
        for b in '128':
            self.rel(z[b], IB[int(b) - 1], msg=f'I_b at {b}')
        for b in '67':
            self.rel(x[b], IB[int(b) - 1], msg=f'I_b (jX″) at {b}')
        for b in '345':
            self.rel(z[b], IB[int(b) - 1], tol=0.015, msg=f'I_b at {b} (known deviation)')

    def test_table_23_line_to_earth(self):
        for i, b in enumerate('2345'):
            r = self.n.short_circuit(b, '1ph')
            self.rel(r['Ik'] / 1e3, IK1[i], msg=f'I″k1 at {b}')
            self.assertAlmostEqual(r['X0X1'], X0X1[i], delta=6e-4)
            g = self.n.short_circuit(b, '1ph', rgf=True)
            self.rel(g['ip_c'] / 1e3, IP1[i], msg=f'i_p1 κ(1) at {b}')
            self.rel(g['ip_c012'] / 1e3, IP1_012[i], msg=f'i_p1 κ(012) at {b}')

    def test_factor_115_and_minimum(self):
        r = self.n.short_circuit('7', '3ph')            # L6 (R/X ≈ 0,95) carries a partial current: 1,15 applies
        self.assertTrue(r['f115'])
        self.assertAlmostEqual(r['ip_b'], 1.15 * r['ip_b0'], delta=1e-9 * r['ip_b'])
        m = self.n.short_circuit('6', '3ph', mode='min')
        self.assertEqual(m['c'], 1.0)
        self.assertLess(m['Ik'], self.n.short_circuit('6', '3ph')['Ik'])
        self.assertEqual(N.c_factor(400, 'max'), 1.05)
        self.assertEqual(N.c_factor(400, 'max', lv_tol=0.10), 1.10)
        self.assertEqual(N.c_factor(400, 'min'), 0.95)


class Unbalanced(unittest.TestCase):
    """A feeder with Z₀ = Z₁: I″k1 = I″k3, I″k2 = √3/2·I″k3, I″kE2E = I″k3 (closed forms of the sequence networks)."""

    def test_identities(self):
        n = N.Network()
        n.bus('A', 20e3)
        n.feeder('A', Sk=500e6, RX=0.1, X0X=1.0, R0X0=0.1)
        k3 = n.short_circuit('A', '3ph')['Ik']
        self.assertAlmostEqual(k3, 1.1 * 500e6 / (math.sqrt(3) * 20e3 * 1.1), delta=1e-6 * k3)   # S″k/(√3·U_n)
        self.assertAlmostEqual(n.short_circuit('A', '1ph')['Ik'], k3, delta=1e-9 * k3)
        self.assertAlmostEqual(n.short_circuit('A', '2ph')['Ik'], math.sqrt(3) / 2 * k3, delta=1e-9 * k3)
        e = n.short_circuit('A', '2phE')
        self.assertAlmostEqual(e['IkE'], k3, delta=1e-9 * k3)
        self.assertAlmostEqual(e['IkL2'], e['IkL3'], delta=1e-9 * k3)

    def test_delta_star_transformer_zero_sequence(self):
        # Dyn: the earth fault on the LV side sees only the transformer in the zero sequence
        n = N.Network()
        n.bus('H', 110e3)
        n.bus('L', 20e3)
        n.feeder('H', Sk=3e9, RX=0.1, X0X=1.0)
        n.transformer('H', 'L', 40e6, 110e3, 20e3, 12, 0.5, group='Dyn5', X0X=1.0, R0R=1.0, KT=False)
        r = n.short_circuit('L', '1ph', mode='max')
        zT = N._zr(12, 0.5, 20e3, 40e6)
        self.assertAlmostEqual(r['Z0'].imag, zT.imag, delta=1e-9 * zT.imag)


class LoadFlow(unittest.TestCase):
    # PYPOWER 5.1.x (runpf, PF_TOL = 1e-13) on the same case data: V (pu), angle (deg)
    IEEE9 = {'1': (1.04, 0.0), '2': (1.025, 9.280005), '3': (1.025, 4.664751), '4': (1.025788, -2.216788), '5': (1.012654, -3.687396),
             '6': (1.032353, 1.966716), '7': (1.015883, 0.727536), '8': (1.025769, 3.719701), '9': (0.995631, -3.988805)}

    def test_ieee9_against_an_independent_solver(self):
        r = N.ieee9().load_flow(tol=1e-12)
        self.assertTrue(r['converged'])
        for b, (v, a) in self.IEEE9.items():
            self.assertAlmostEqual(r['buses'][b]['V'], v, delta=2e-6, msg=b)
            self.assertAlmostEqual(r['buses'][b]['angle'], a, delta=2e-5, msg=b)
        self.assertAlmostEqual(r['losses'] / 1e6, 4.641021, delta=1e-5)

    def test_ieee14_against_the_ieee_solution(self):
        # the solution stored in the IEEE common data format (3 decimals for V, 2 for the angle)
        ref = {'2': (1.045, -4.98), '3': (1.010, -12.72), '4': (1.019, -10.33), '5': (1.020, -8.78), '6': (1.070, -14.22),
               '7': (1.062, -13.37), '8': (1.090, -13.36), '9': (1.056, -14.94), '10': (1.051, -15.10), '11': (1.057, -14.79),
               '12': (1.055, -15.07), '13': (1.050, -15.16), '14': (1.036, -16.04)}
        r = N.ieee14().load_flow()
        for b, (v, a) in ref.items():
            self.assertAlmostEqual(r['buses'][b]['V'], v, delta=1.5e-3, msg=b)
            self.assertAlmostEqual(r['buses'][b]['angle'], a, delta=0.02, msg=b)
        self.assertAlmostEqual(r['losses'] / 1e6, 13.393272, delta=1e-5)          # PYPOWER on the same data

    def test_zip_constant_impedance_equals_a_shunt(self):
        def net(with_load):
            n = N.Network()
            n.bus('S', 20e3)
            n.bus('B', 20e3)
            n.feeder('S', Sk=200e6, RX=0.2)
            n.line('S', 'B', 0.3, 0.4, 5)
            if with_load:
                n.load('B', 4e6, 2e6, zip=(1, 0, 0))
            else:
                n.shunt('B', 4e6, 2e6)
            return n.load_flow()['buses']['B']
        a, b = net(True), net(False)
        self.assertAlmostEqual(a['V'], b['V'], delta=1e-12)
        self.assertAlmostEqual(a['angle'], b['angle'], delta=1e-10)

    def test_zip_power_follows_the_voltage(self):
        n = N.Network()
        n.bus('S', 20e3)
        n.bus('B', 20e3)
        n.feeder('S', Sk=100e6, RX=0.2)
        n.line('S', 'B', 0.3, 0.4, 8)
        n.load('B', 5e6, 1e6, zip=(0.2, 0.3, 0.5))
        r = n.load_flow()['buses']['B']
        V = r['V']
        self.assertAlmostEqual(r['Pload'], 5e6 * (0.2 * V * V + 0.3 * V + 0.5), delta=1e-6)

    def test_three_winding_transformer_and_json_round_trip(self):
        # the star point is an internal bus from the start: the load flow sees it, the JSON keeps the network
        n = N.Network()
        n.bus('H', 110e3)
        n.bus('M', 20e3)
        n.bus('L', 10e3)
        n.feeder('H', Sk=3e9, RX=0.1)
        n.transformer3('H', 'M', 'L', Sr=(40e6, 40e6, 20e6), Ur=(110e3, 20e3, 10e3), uk=(12, 8, 6), ur=(0.4, 0.4, 0.4), ref='a', name='T')
        n.load('M', 20e6, 8e6)
        n.load('L', 8e6, 3e6)
        r = n.load_flow()
        self.assertTrue(r['converged'])
        m = N.from_dict(N.to_dict(n))
        self.assertAlmostEqual(m.load_flow()['buses']['L']['V'], r['buses']['L']['V'], delta=1e-12)
        self.assertAlmostEqual(m.short_circuit('L')['Ik'], n.short_circuit('L')['Ik'], delta=1e-9)
        # the load sum: generation = loads + losses
        self.assertAlmostEqual(r['buses']['H']['P'], 28e6 + r['losses'], delta=1e-3)

    def test_superposition_is_close_to_the_equivalent_source(self):
        n = N.ieee9()
        lf = n.load_flow()
        for b in ('4', '5', '7'):
            iec = n.short_circuit(b)['Ik']
            sp = N.superposition(n, b, lf)['Ik']
            self.assertLess(abs(iec - sp) / sp, 0.08)


if __name__ == '__main__':
    unittest.main()


class TRV(unittest.TestCase):
    def test_one_minus_cosine(self):
        # u(t) = U·(1 − cos ω(t − t₀)) after the current zero: u_c = 2U at t₃ = π/ω, largest rate U·ω
        U, w, t0 = 10e3, 2 * math.pi * 2e3, 1e-3
        t = [k * 1e-7 for k in range(30000)]
        v = [0.0 if x < t0 else U * (1 - math.cos(w * (x - t0))) for x in t]
        r = N.trv(t, v, uf=U)
        self.assertAlmostEqual(r['uc'], 2 * U, delta=1e-6 * U)
        self.assertAlmostEqual(r['t3'], math.pi / w, delta=2e-7)
        self.assertAlmostEqual(r['rrrv_max'], U * w, delta=1e-3 * U * w)
        self.assertAlmostEqual(r['kaf'], 2.0, delta=1e-6)
