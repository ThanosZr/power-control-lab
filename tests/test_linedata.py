"""4.11 (ROADMAP §26, «Δεδομένα γραμμής»): the new options of the line constants and their outputs, each against an
independent computation: the layered earth against a per-wavenumber linear solve and a finite-difference field
computation, the balanced and double-circuit lines, the transpositions, the segmented ground wires, the models of the
internal impedance, cables in the air and semiconducting screens, the rebuild from sequence data, tables from a file,
the lossless modes, the fields under the line, the communication line, the Q-error tests, the π circuits and the
frequency scan."""
import cmath
import io
import math
import os
import sys
import unittest

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from pcl import lineconst as lc  # noqa: E402

MU0 = lc.MU0


# ---------------------------------------------------------------- independent references for the layered earth
def _refl(lam, s, L, src, zs, zo):
    """The reflected part of Ã/(μ₀I) at the depth zo for a line source at the depth zs (negative: in the air), by
    solving the four continuity conditions of A and (1/μ)∂A/∂z at the surface and at the boundary as a linear system."""
    D = L[0]['d']
    u = [lam, cmath.sqrt(lam * lam + s * MU0 * L[0]['mur'] / L[0]['rho']), cmath.sqrt(lam * lam + s * MU0 * L[1]['mur'] / L[1]['rho'])]
    mu = [1.0, L[0]['mur'], L[1]['mur']]

    def part(layer, z, der=False):
        if layer != src:
            return 0
        v = mu[src] / (2 * u[src]) * cmath.exp(-u[src] * abs(z - zs))
        return v * (-u[src] * np.sign(z - zs)) if der else v

    A = np.zeros((4, 4), complex)
    b = np.zeros(4, complex)
    u0, u1, u2 = u
    A[0] = [1, -1, -1, 0]
    b[0] = part(1, 0) - part(0, 0)
    A[1] = [u0 / mu[0], -u1 / mu[1], u1 / mu[1], 0]
    b[1] = part(1, 0, True) / mu[1] - part(0, 0, True) / mu[0]
    A[2] = [0, cmath.exp(u1 * D), cmath.exp(-u1 * D), -1]
    b[2] = part(2, D) - part(1, D)
    A[3] = [0, u1 / mu[1] * cmath.exp(u1 * D), -u1 / mu[1] * cmath.exp(-u1 * D), u2 / mu[2]]
    b[3] = part(2, D, True) / mu[2] - part(1, D, True) / mu[1]
    C, P, Q, E = np.linalg.solve(A, b)
    if zo < 0:
        return C * cmath.exp(u0 * zo)
    if zo < D:
        return P * cmath.exp(u1 * zo) + Q * cmath.exp(-u1 * zo)
    return E * cmath.exp(-u2 * (zo - D))


def _z_generic(s, L, zs, zo, x, r):
    from scipy.special import kve
    src = 1 if zs < L[0]['d'] else 2
    obs = 1 if zo < L[0]['d'] else 2
    mmax = max(abs(cmath.sqrt(s * MU0 * q['mur'] / q['rho'])) for q in L)
    I = lc._cosint(lambda lam: _refl(lam, s, L, src, zs, zo), x, 0.3, mmax, rel=1e-10, absol=1e-15)
    z = s * MU0 / math.pi * I
    if src == obs:
        q = L[src - 1]
        m = cmath.sqrt(s * MU0 * q['mur'] / q['rho'])
        z += s * MU0 * q['mur'] / (2 * math.pi) * kve(0, m * r) * cmath.exp(-m * r)
    return z


def _grid1d(anchors, lo, hi, hmin, ratio):
    pts = {lo, hi, *anchors}
    for a in anchors:
        for sgn in (-1, 1):
            x, h = a, hmin
            while lo < x < hi:
                x += sgn * h
                h *= ratio
                if lo < x < hi:
                    pts.add(round(x, 9))
    keep = []
    for p in sorted(pts):
        if not keep or p - keep[-1] > hmin * 0.5:
            keep.append(p)
    return np.array(keep)


def _fd_field(f, layers, src, obs, X=3000.0, Z=3000.0, hmin=0.05, ratio=1.2):
    """A_z/(1 A) at the points obs for a line current at src (x, depth; negative depth = in the air) above and in a
    layered earth [(ρ, thickness)…]: finite volumes on a graded grid, ∇²A − jωμ₀σA = −μ₀J, A = 0 far away. Independent of
    the Fourier integrals of `pcl.lineconst`; its own error is a few 10⁻³."""
    import scipy.sparse as sp
    import scipy.sparse.linalg as spl
    xs = _grid1d([p[0] for p in [src] + obs], -X, X, hmin, ratio)
    bnd, t = [0.0], 0.0
    for _, d in layers[:-1]:
        t += d
        bnd.append(t)
    zs = _grid1d([p[1] for p in [src] + obs] + bnd, -Z, Z, hmin, ratio)
    nx, nz = len(xs), len(zs)
    w = 2 * math.pi * f

    def sigma(z):
        if z < 0:
            return 0.0
        t = 0.0
        for rho, d in layers:
            if z < t + d:
                return 1 / rho
            t += d
        return 1 / layers[-1][0]

    dx, dz = np.diff(xs), np.diff(zs)
    N = nx * nz
    rows, cols, vals = [], [], []
    for i in range(nx):
        for j in range(nz):
            k = i * nz + j
            if i in (0, nx - 1) or j in (0, nz - 1):
                rows.append(k)
                cols.append(k)
                vals.append(1.0)
                continue
            hxm, hxp, hzm, hzp = dx[i - 1], dx[i], dz[j - 1], dz[j]
            wx, wz = (hxm + hxp) / 2, (hzm + hzp) / 2
            sig = (sigma(zs[j] - hzm / 2) * hzm + sigma(zs[j] + hzp / 2) * hzp) / (hzm + hzp)
            rows += [k] * 5
            cols += [k, k - nz, k + nz, k - 1, k + 1]
            vals += [-(wz / hxm + wz / hxp + wx / hzm + wx / hzp) - 1j * w * MU0 * sig * wx * wz, wz / hxm, wz / hxp,
                     wx / hzm, wx / hzp]
    A = sp.csc_matrix((vals, (rows, cols)), shape=(N, N))
    b = np.zeros(N, complex)
    b[int(np.argmin(abs(xs - src[0]))) * nz + int(np.argmin(abs(zs - src[1])))] = -MU0
    sol = spl.spsolve(A, b)
    return [sol[int(np.argmin(abs(xs - ox))) * nz + int(np.argmin(abs(zs - oz)))] for ox, oz in obs]


SOIL2 = [{'rho': 10.0, 'mur': 1.0, 'd': 5.0}, {'rho': 300.0, 'mur': 1.0, 'd': math.inf}]
SOIL1 = [{'rho': 10.0, 'mur': 1.0, 'd': math.inf}]


class LayeredEarth(unittest.TestCase):
    s = 2j * math.pi * 2000

    def test_one_layer_is_carson_and_pollaczek(self):
        for a, b in ((lc.earth_overhead(20, 22, 8, self.s, [{'rho': 100.0, 'mur': 1.0, 'd': math.inf}]),
                      lc.carson_integral(20, 22, 8, 0, 100, s=self.s)),
                     (lc.earth_buried(self.s, 1.2, 1.5, 0.5, [{'rho': 100.0, 'mur': 1.0, 'd': math.inf}]),
                      lc.pollaczek(self.s, 1.2, 1.5, 0.5, 100))):
            self.assertLess(abs(a - b) / abs(b), 1e-12)

    def test_two_equal_layers_are_one(self):
        L = [{'rho': 100.0, 'mur': 1.0, 'd': 3.0}, {'rho': 100.0, 'mur': 1.0, 'd': math.inf}]
        for h, y in ((1.2, 1.5), (1.2, 4.0), (4.0, 4.5)):
            b = lc.pollaczek(self.s, h, y, 0.5, 100)
            self.assertLess(abs(lc.earth_buried(self.s, h, y, 0.5, L) - b) / abs(b), 1e-10, (h, y))

    def test_closed_forms_against_a_linear_solve_per_wavenumber(self):
        for mu in (1.0, 2.0):
            L = [{'rho': 30.0, 'mur': mu, 'd': 3.0}, {'rho': 800.0, 'mur': 1.0, 'd': math.inf}]
            for h, y, x in ((1.2, 1.5, 0.5), (1.2, 4.0, 0.5), (4.0, 4.5, 0.3), (2.5, 2.8, 0.4)):
                a = lc.earth_buried(self.s, h, y, x, L)
                b = _z_generic(self.s, L, h, y, x, math.hypot(x, h - y))
                c = _z_generic(self.s, L, y, h, x, math.hypot(x, h - y))      # reciprocity
                self.assertLess(abs(a - b) / abs(b), 1e-8, (mu, h, y))
                self.assertLess(abs(c - b) / abs(b), 1e-8, (mu, h, y))

    def test_finite_differences(self):
        f = 2000.0
        s = 2j * math.pi * f
        L2, L1 = [(10.0, 5.0), (300.0, math.inf)], [(10.0, math.inf)]
        obs = [(0.0, 1.0), (0.5, 1.5), (0.3, 7.0)]
        A2 = _fd_field(f, L2, (0.0, 1.0), obs)
        A1 = _fd_field(f, L1, (0.0, 1.0), obs)
        dz_fd = s * (A2[0] - A1[0])            # the effect of the second layer: the singular part cancels
        dz = lc.earth_buried(s, 1.0, 1.0, 0.0, SOIL2, d=0.01) - lc.earth_buried(s, 1.0, 1.0, 0.0, SOIL1, d=0.01)
        self.assertLess(abs(dz_fd - dz) / abs(dz), 0.01)
        for k, (h, y, x) in ((1, (1.0, 1.5, 0.5)), (2, (1.0, 7.0, 0.3))):
            z = lc.earth_buried(s, h, y, x, SOIL2)
            self.assertLess(abs(s * A2[k] - z) / abs(z), 0.01, k)
        obs = [(0.0, -12.0), (6.0, -14.0)]
        A2 = _fd_field(f, L2, (0.0, -12.0), obs)
        A1 = _fd_field(f, L1, (0.0, -12.0), obs)
        for k, (hi, hk, x) in enumerate(((12, 12, 0), (12, 14, 6))):
            fd = s * (A2[k] - A1[k])
            cf = lc.earth_overhead(hi, hk, x, s, SOIL2) - lc.earth_overhead(hi, hk, x, s, SOIL1)
            self.assertLess(abs(fd - cf) / abs(cf), 0.01, k)

    def test_line_and_cable_data(self):
        d = lc.typical('400kV')
        Z0 = lc.phase_matrices(d, 1000)[0]
        d2 = dict(d, rho2=100.0, dsoil=4.0)
        self.assertLess(np.abs(lc.phase_matrices(d2, 1000)[0] - Z0).max() / np.abs(Z0).max(), 1e-8)
        d3 = dict(d, rho2=1000.0, dsoil=4.0)
        self.assertGreater(np.abs(lc.phase_matrices(d3, 1000)[0] - Z0).max() / np.abs(Z0).max(), 1e-3)
        c = lc.typical('150kV-land')
        Zc = lc.phase_matrices(c, 1000)[0]
        c2 = dict(c, rho2=100.0, dsoil=3.0)
        self.assertLess(np.abs(lc.phase_matrices(c2, 1000)[0] - Zc).max() / np.abs(Zc).max(), 1e-8)
        with self.assertRaises(lc.LineError):
            lc.phase_matrices(dict(c, rho2=10.0, dsoil=1.2), 50)      # a cable on the boundary


class Options(unittest.TestCase):
    d = lc.typical('400kV')

    def test_clarke_and_balanced(self):
        for M in (2, 3, 6):
            T = lc.clarke(M)
            self.assertLess(np.abs(T.T @ T - np.eye(M)).max(), 1e-14)
        Z, Y = lc.line_zy(self.d, 50, 'balanced')
        T = lc.clarke(3)
        for A in (T.T @ Z @ T, T.T @ Y @ T):
            self.assertLess(np.abs(A - np.diag(np.diag(A))).max(), 1e-14 * np.abs(A).max())
        m = lc.cp_model(self.d, 50, 100, ti='balanced')
        self.assertAlmostEqual(m['modes'][1]['Zc'], m['modes'][2]['Zc'], places=9)

    def test_double_circuit(self):
        d = lc.typical('150kV')
        w = [q for q in d['wires'] if q['ph'] > 0]
        d6 = {'rho': 100, 'wires': [dict(q, x=q['x'] - 8) for q in w] + [dict(q, x=8 - q['x'], ph=q['ph'] + 3) for q in w]}
        Z, Y = lc.line_zy(d6, 50, 'double')
        T = lc.double_ti()
        self.assertLess(np.abs(T.T @ T - np.eye(6)).max(), 1e-14)
        A = T.T @ Z @ T
        self.assertLess(np.abs(A - np.diag(np.diag(A))).max(), 1e-14 * np.abs(A).max())
        with self.assertRaises(lc.LineError):
            lc.balance(Z[:3, :3], 'double')

    def test_ti_rotations_and_auto_frequency(self):
        Z, Y = lc.phase_matrices(self.d, 1000)
        a, b = lc.ti_matrix(Z, Y, 'gm0'), lc.ti_matrix(Z, Y, 'minimag')
        self.assertLess(np.abs(a - b).max(), 1e-6)                 # both rotations agree when G is tiny
        f, q = lc.auto_fti(self.d)
        self.assertTrue(50 <= f <= 5e4)
        Tf = lc.ti_matrix(*lc.phase_matrices(self.d, 1000))
        q1k = max(lc.q_error(*lc.phase_matrices(self.d, fb), Tf) for fb in np.logspace(math.log10(500), math.log10(5000), 6))
        self.assertLessEqual(q, q1k + 1e-12)

    def test_transposition_average(self):
        d = dict(self.d, transp={'order': [[1, 2, 3], [2, 3, 1], [3, 1, 2]], 'len': [30, 30, 30]})
        Z, Y = lc.phase_matrices(d, 50)
        Zb, Yb = lc.line_zy(self.d, 50, 'balanced')
        self.assertLess(np.abs(Z - Zb).max() / np.abs(Z).max(), 1e-14)
        self.assertLess(np.abs(Y - Yb).max() / np.abs(Y).max(), 1e-14)
        with self.assertRaises(lc.LineError):
            lc.phase_matrices(dict(self.d, transp={'order': [[1, 1, 2]]}), 50)

    def test_segmented_ground_wires(self):
        d = dict(self.d, iseg=True)
        Z, Y = lc.phase_matrices(d, 50)
        nog = dict(self.d, wires=[])                           # without the ground wires: the same [Z]
        Zn, Yn = lc.phase_matrices(nog, 50)
        self.assertLess(np.abs(Z - Zn).max() / np.abs(Z).max(), 1e-13)
        Zc, Yc = lc.phase_matrices(self.d, 50)                 # but the same [C] as with continuous ground wires
        self.assertLess(np.abs(Y - Yc).max() / np.abs(Y).max(), 1e-13)

    def test_g_per_phase(self):
        d = dict(self.d, G=[1e-9, '', 3e-9])
        Y = lc.phase_matrices(d, 50)[1]
        self.assertTrue(np.allclose(np.diag(Y.real) * 1000, [1e-9, lc.G_DEFAULT, 3e-9], rtol=1e-12))

    def test_internal_impedance_models(self):
        w = {'ph': 1, 'x': 0, 'y': 20, 'r': 1.5, 'Rdc': 0.06, 'tD': 0.5}
        base = {'rho': 100, 'skin': False, 'wires': [w]}
        rho = 0.06e-3 * math.pi * 0.015 ** 2
        a = lc.phase_matrices(base, 50)[0]
        b = lc.phase_matrices({'rho': 100, 'skin': False, 'wires': [dict(w, Rdc='', rho=rho)]}, 50)[0]
        self.assertLess(abs(a - b) / abs(a), 1e-13)
        g = lc.phase_matrices({'rho': 100, 'wires': [dict(w, zi='gmrr', gmrr=math.exp(-0.25))]}, 50)[0]
        self.assertLess(abs(a - g) / abs(a), 1e-13)          # GMR/r = e^(−1/4) is the solid conductor without skin effect
        X = 2 * math.pi * 50 * MU0 / (2 * math.pi) * math.log(1 / (0.015 * math.exp(-0.25))) * 1000
        x = lc.phase_matrices({'rho': 100, 'wires': [dict(w, zi='xu', xu=X, fx=50)]}, 50)[0]
        self.assertLess(abs(a - x) / abs(a), 1e-12)
        xX = lc.phase_matrices({'rho': 100, 'wires': [dict(w, zi='xu', xu=X, fx=50, xmode='X')]}, 50)[0]
        self.assertLess(abs(a - xX) / abs(a), 1e-12)
        # Galloway–Wedepohl: R = ωL at high frequency (VII.1), the same as VII.2 with R′ of one outer strand
        c = {'ph': 1, 'x': 0, 'y': 20, 'r': 0.79, 'Rdc': 0.223, 'tD': 0.5, 'zi': 'gw', 'ns': 18, 'rs': 0.1125}
        cs = lc.conductors({'wires': [c]})[0]
        f = 1e6
        z = lc.z_int(cs, 2j * math.pi * f)
        self.assertAlmostEqual(z.real / z.imag, 1.0, places=3)     # √(R_dc² + z_GW²) → z_GW
        rho_c = cs['zi']['rho']
        Rs = rho_c / (math.pi * 0.001125 ** 2)
        v2 = 4.5 * math.sqrt(5) * 1e-4 / (2 + 18) * math.sqrt(2 * math.pi * f * Rs)
        self.assertLess(abs(z.real - v2) / v2, 1e-3)
        self.assertAlmostEqual(lc.z_int(cs, 0).real, 0.223e-3, places=15)


class Cables(unittest.TestCase):
    def test_cable_in_the_air_is_an_overhead_conductor(self):
        R = 0.03
        cab = {'medium': 'earth', 'rho': 100, 'cables': [{'x': 0, 'y': -10, 'ph': [1],
                                                           'layers': [{'t': 'c', 'rin': 0, 'rout': R, 'rho': 2.8e-8}]}]}
        ovh = {'rho': 100, 'wires': [{'ph': 1, 'x': 0, 'y': 10, 'r': R * 100, 'rho': 2.8e-8, 'Rdc': '', 'tD': 0.5}]}
        for f in (50.0, 1e4):
            Za, Ya = lc.phase_matrices(cab, f)
            Zo, Yo = lc.phase_matrices(dict(ovh, G=0), f)
            self.assertLess(abs(Za[0, 0] - Zo[0, 0]) / abs(Zo[0, 0]), 1e-10)
            self.assertLess(abs(Ya[0, 0] - Yo[0, 0]) / abs(Yo[0, 0]), 1e-12)
        with self.assertRaises(lc.LineError):
            lc.phase_matrices({'medium': 'earth', 'cables': [cab['cables'][0], dict(cab['cables'][0], x=1, y=1)]}, 50)

    def test_semiconducting_screens(self):
        lay = [{'t': 'c', 'rin': 0, 'rout': 0.02, 'rho': 1.7e-8}, {'t': 's', 'rout': 0.021},
               {'t': 'i', 'rout': 0.038, 'epsr': 2.3}, {'t': 's', 'rout': 0.039}, {'t': 'c', 'rout': 0.040, 'rho': 2.8e-8}]
        c = lc.cables({'cables': [{'x': 0, 'y': 1, 'ph': [1, 0], 'layers': lay}]})[0]
        ins = c['conds'][0]['ins']
        self.assertEqual((ins['rin'], ins['rout']), (0.02, 0.039))
        C_merged = 2 * math.pi * lc.EPS0 * ins['epsr'] / math.log(ins['rout'] / ins['rin'])
        C_ins = 2 * math.pi * lc.EPS0 * 2.3 / math.log(0.038 / 0.021)
        self.assertAlmostEqual(C_merged / C_ins, 1.0, places=13)

    def test_loss_models(self):
        c = lc.typical('150kV-land')
        f = 1000.0
        Yc = lc.phase_matrices(c, f)[1]
        Yf = lc.phase_matrices(dict(c, loss='fg0', fg0=100), f)[1]
        Ys = lc.phase_matrices(dict(c, loss='const'), f)[1]
        cb = lc.cables(c)[0]['conds'][0]['ins']
        C = 2 * math.pi * lc.EPS0 * cb['epsr'] / math.log(cb['rout'] / cb['rin'])
        self.assertAlmostEqual(Yf[0, 0].real / (2 * math.pi * (100 + f) * cb['tand'] * C), 1.0, places=9)
        self.assertAlmostEqual(Ys[0, 0].real / (2 * math.pi * f * cb['tand'] * C), 1.0, places=9)
        self.assertLess(abs(Yc[0, 0].imag - Ys[0, 0].imag) / Ys[0, 0].imag, 1e-2)


class LinesWithoutGeometry(unittest.TestCase):
    def _seq(self, key):
        d = lc.typical(key)
        d['transp'] = {'order': [[1, 2, 3], [2, 3, 1], [3, 1, 2]]}
        Z, Y = lc.phase_matrices(d, 50)
        w = 2 * math.pi * 50
        z1, z0 = lc.sequence(Z)
        c1, c0 = lc.sequence(Y.imag / w)
        return d, {'M': 3, 'f': 50, 'R0': z0.real * 1e3, 'L0': z0.imag / w * 1e6, 'C0': c0 * 1e9, 'R1': z1.real * 1e3,
                   'L1': z1.imag / w * 1e6, 'C1': c1 * 1e9, 'G0': lc.G_DEFAULT, 'G1': lc.G_DEFAULT}

    def test_constant_sequence_parameters(self):
        d, seq = self._seq('400kV')
        Z, Y = lc.phase_matrices({'seq': seq}, 50)
        Za, Ya = lc.phase_matrices(d, 50)
        self.assertLess(np.abs(Z - Za).max() / np.abs(Za).max(), 1e-12)
        self.assertLess(np.abs(Y.imag - Ya.imag).max() / np.abs(Ya.imag).max(), 1e-12)

    def test_rebuild(self):
        for key in ('150kV', '400kV'):
            d, seq = self._seq(key)
            r = lc.rebuild(seq)
            self.assertLess(r['rebuilt']['residual'], 1e-9, key)
            for f in (1e3, 1e4, 1e5):
                a1, a0 = lc.sequence(lc.phase_matrices(d, f)[0])
                b1, b0 = lc.sequence(lc.phase_matrices(r, f)[0])
                self.assertLess(abs(b1 - a1) / abs(a1), 0.03, (key, f))
                self.assertLess(abs(b0 - a0) / abs(a0), 0.10, (key, f))

    def test_tables_from_a_mat_file(self):
        from scipy.io import savemat
        d = lc.typical('400kV')
        fs = lc.freqs(0.1, 7, 10)
        Z = np.stack([lc.phase_matrices(d, f)[0] for f in fs], axis=2) * 1e3     # per km
        Y = np.stack([lc.phase_matrices(d, f)[1] for f in fs], axis=2) * 1e3
        buf = io.BytesIO()
        savemat(buf, {'Z': Z, 'Y': Y, 'f': fs[None, :], 'line_length': 100.0})
        t = lc.load_zy_mat(buf.getvalue(), 'km')
        self.assertEqual(t['length'], 100.0)
        dz = {'zyfile': t}
        for f in fs[::7]:
            a = lc.phase_matrices(dz, f)[0]
            self.assertLess(np.abs(a - lc.phase_matrices(d, f)[0]).max() / np.abs(a).max(), 1e-14)
        m1 = lc.fd_model(dz, 100, fti=1000)
        m2 = lc.fd_model(d, 100, fmin=0.1, decades=7, ppd=10, fti=1000)
        self.assertLess(abs(m1['modes'][0]['tau'] - m2['modes'][0]['tau']) / m2['modes'][0]['tau'], 1e-9)


class Outputs(unittest.TestCase):
    d = lc.typical('400kV')

    def test_lossless_modes(self):
        one = {'rho': 100, 'wires': [{'ph': 1, 'x': 0, 'y': 15, 'r': 1.0, 'Rdc': 0.1, 'tD': 0.5}]}
        hf = lc.lossless_modes(one, 50, 'hf')
        z = MU0 * lc.C0 / (2 * math.pi) * math.log(30 / 0.01)          # 60·ln(2h/r)
        self.assertAlmostEqual(hf['modes'][0]['Zc'] / z, 1.0, places=12)
        self.assertEqual(hf['modes'][0]['v'], lc.C0)
        r0 = lc.lossless_modes(self.d, 50, 'r0')
        self.assertTrue(all(m['att'] == 0 for m in r0['modes']))
        self.assertLess(r0['modes'][0]['v'], r0['modes'][1]['v'])      # the zero mode slower
        m = lc.cp_model(self.d, 1e5, 10, mode='hf')
        self.assertTrue(all(abs(q['v'] - lc.C0) < 1e-6 for q in m['modes']))

    def test_matrices_and_symmetrical_components(self):
        mt = lc.matrices(self.d, 50)
        Zs = mt['sym']['Z']
        z1, z0 = lc.sequence(mt['phase']['Z'])
        dt = dict(self.d, transp={'order': [[1, 2, 3], [2, 3, 1], [3, 1, 2]]})
        Zt = lc.matrices(dt, 50)['sym']['Z']
        self.assertAlmostEqual(Zt[0, 0], z0, places=12)
        self.assertAlmostEqual(Zt[1, 1], z1, places=12)
        self.assertLess(abs(Zt[0, 1]), 1e-12)
        self.assertGreater(abs(Zs[1, 2]), 1e-4)                         # the untransposed line couples 1 and 2
        P = mt['phys']['P']
        self.assertLess(np.abs(P @ mt['phys']['C'] - np.eye(len(P))).max(), 1e-12)

    def test_field_against_the_gradient_of_the_potential(self):
        V = [230.94, 230.94 * lc.A_OP ** 2, 230.94 * lc.A_OP]
        xs = np.array([-30.0, -5.0, 0.0, 12.0])
        for hgt in (0.0, 1.0):
            fl = lc.field(self.d, V, xs, hgt)
            cs = lc.conductors(self.d)
            n = len(cs)
            P = np.array([[math.log(2 * a['h'] / a['r']) if i == k else
                           math.log(math.hypot(a['x'] - b['x'], a['h'] + b['h']) / math.hypot(a['x'] - b['x'], a['h'] - b['h']))
                           for k, b in enumerate(cs)] for i, a in enumerate(cs)])
            q = np.linalg.solve(P, [V[c['ph'] - 1] if c['ph'] else 0 for c in cs])

            def phi(x, y):
                return sum(qq * math.log(math.hypot(x - c['x'], y + c['h']) / math.hypot(x - c['x'], y - c['h']))
                           for qq, c in zip(q, cs))

            e = 1e-5
            for i, x in enumerate(xs):
                Ey = -(phi(x, hgt + e) - phi(x, hgt - e)) / (2 * e)
                Ex = -(phi(x + e, hgt) - phi(x - e, hgt)) / (2 * e)
                self.assertLess(abs(fl['Ey'][i] - Ey) / abs(Ey), 1e-6)
                if hgt == 0:
                    self.assertLess(abs(fl['Ex'][i]), 1e-12 * abs(fl['Ey'][i]) + 1e-12)
                else:
                    self.assertLess(abs(fl['Ex'][i] - Ex), 1e-6 * abs(Ey))

    def test_magnetic_field(self):
        one = {'rho': 100, 'wires': [{'ph': 1, 'x': 0, 'y': 15, 'r': 1.0, 'Rdc': 0.1, 'tD': 0.5}]}
        b = lc.bfield(one, [100.0], [0.0, 10.0], 1.0)
        self.assertAlmostEqual(b['B'][0], MU0 * 100 / (2 * math.pi * 14) * 1e6, places=10)
        self.assertAlmostEqual(b['B'][1], MU0 * 100 / (2 * math.pi * math.hypot(10, 14)) * 1e6, places=10)
        I = [1000, 1000 * lc.A_OP ** 2, 1000 * lc.A_OP]
        with_gw = lc.bfield(self.d, I, [0.0], 1.0)['B'][0]
        self.assertGreater(with_gw, 0)

    def test_communication_line(self):
        d = lc.typical('150kV')
        d['wires'].append({'ph': 4, 'x': 25, 'y': 6, 'r': 0.2, 'Rdc': 50, 'tD': 0.5})
        t = lc.telecom(d, 50, I=[100, 100, 100], V=[1, 1, 1])
        Z, Y = lc.phase_matrices(d, 50)
        self.assertLess(np.abs(t['Z'] - Z[3, :3] * 1e3).max(), 1e-15)
        self.assertAlmostEqual(t['sym'][0]['zero'], t['Z'].sum(), places=14)
        self.assertAlmostEqual(t['dV'], 100 * t['Z'].sum(), places=10)
        C = Y.imag
        self.assertAlmostEqual(t['VN'], -C[3, :3].sum() / C[3, 3], places=12)

    def test_q_error_tests(self):
        dt = dict(self.d, transp={'order': [[1, 2, 3], [2, 3, 1], [3, 1, 2]]})
        q = lc.qerror_tests(dt, lc.clarke(3), [50, 5000], 100)
        self.assertTrue(all(max(r[k] for k in r if k != 'f') < 1e-8 for r in q))
        q = lc.qerror_tests(self.d, lc.ti_matrix(*lc.phase_matrices(self.d, 1000)), [1000], 100)
        self.assertLess(max(v for k, v in q[0].items() if k != 'f'), 1.0)

    def test_pi_circuits(self):
        L = 100.0
        p = lc.exact_pi(self.d, 50, L)
        Yn = lc.exact_admittance(self.d, 50, L)
        M = 3
        self.assertLess(np.abs((p['series'] + p['shunt']) - Yn[:M, :M]).max(), 1e-14)
        n = lc.nominal_pi(self.d, 50, 1.0)
        e = lc.exact_pi(self.d, 50, 1.0)
        self.assertLess(np.abs(np.linalg.inv(e['series']) - n['Z']).max() / np.abs(n['Z']).max(), 1e-5)
        self.assertLess(np.abs(e['shunt'] - n['Y']).max() / np.abs(n['Y']).max(), 1e-5)

    def test_useful_quantities(self):
        u = lc.useful(self.d, 50, 400, 100)
        self.assertAlmostEqual(u['SIL'], 400e3 ** 2 / abs(u['Zc1']) / 1e6, places=9)
        self.assertTrue(1.0 < u['ferranti'] < 1.01)
        self.assertAlmostEqual(u['k0'], (u['Z0'] - u['Z1']) / (3 * u['Z1']), places=14)

    def test_scan(self):
        from scipy.linalg import expm, sqrtm
        m = lc.fd_model(self.d, 100)
        S = lc.scan(self.d, 0.1, 7, 5, length=100, model=m)
        for i in (0, 12, 30):
            self.assertLess(np.abs(S['Zc'][i] @ S['Yc'][i] - np.eye(3)).max(), 1e-10)
            Z, Y = lc.phase_matrices(self.d, S['f'][i])
            H = expm(-sqrtm(Y @ Z) * 100e3)
            self.assertLess(np.abs(S['H'][i] - H).max(), 1e-9)
        self.assertEqual(len(S['qtests']), 8)
        e = max(np.max(q['err_a']) for q in S['fit'])
        self.assertLess(e, 0.01)
        import json
        json.dumps(lc.jsonable(S))

    def test_api(self):
        r = lc.api({'data': self.d, 'model': 'pi', 'len': 10, 'f': 50, 'npi': 4})
        self.assertEqual((r['mdl']['type'], r['mdl']['N']), ('pi', 4))
        seq = {'M': 3, 'f': 50, 'R0': 0.32, 'L0': 3.2, 'C0': 0.0079, 'R1': 0.03, 'L1': 1.0, 'C1': 0.0116, 'mode': 'rebuild'}
        r = lc.api({'data': {'seq': seq}, 'model': 'cp', 'len': 10})
        self.assertLess(r['report']['rebuilt']['residual'], 1e-9)


if __name__ == '__main__':
    unittest.main()
