"""Overhead line constants and line models (4.4, ROADMAP §26): from the geometry of the conductors to the per-unit-length
matrices Z′(ω), Y′(ω), and from those to the constant-parameter (CP) and frequency-dependent (FD, J. Marti) models
that the solver in the browser uses, plus the exact frequency-domain line and a numerical Laplace transform as an
independent reference for the time-domain results.

The conventions are those of the EMTP line constants routine (Dommel, EMTP Theory Book, ch. 4):
* every conductor has a phase number; conductors with the same number are connected in parallel (a bundle, or any
  group), phase 0 is a ground wire that is grounded at every tower and eliminated (continuous ground wire),
* the height is the average over the span, h = (2·h_mid + h_tower)/3 when the midspan height is given,
* the internal impedance comes from the tubular conductor (Bessel functions) with the ratio thickness/diameter T/D
  (0.5 = solid), or from the dc resistance with the dc internal inductance when the skin effect is off,
* the earth return from Carson's series (a ≤ 5) or his asymptotic series (a > 5), as in LINE CONSTANTS; Carson's
  integral itself (numerical quadrature) and the complex depth of Deri et al. as options,
* the reduced shunt conductance is diagonal, 0.2·10⁻⁹ S/km by default (as the FD model of the EMTP),
* CP and FD use a constant real current transformation matrix T_i: the eigenvectors of Y′Z′ at one frequency, each
  column normalized (Euclidean), rotated so that the modal conductance is zero, and the imaginary part dropped.

Units of the input data (as in the EMTP dialog): positions and heights in m, radii in cm, resistances in Ω/km, the
earth resistivity in Ω·m, the line length in km. Internally everything is SI (per metre).

Verification: Dommel Table 4.1 (skin effect in a tubular conductor) and Tables 4.3–4.4 (positive and zero sequence
R′, L′ of a 500 kV line from 10⁻⁶ Hz to 100 kHz), Carson's series against his integral, the CP and FD models against
the exact line in the frequency domain, and the time-domain solver against the numerical Laplace transform
(tests/test_lines.py, VERIFICATION.md).
"""
import cmath
import json
import math

import numpy as np

MU0 = 4e-7 * math.pi
C0 = 299792458.0
EPS0 = 1.0 / (MU0 * C0 * C0)
G_DEFAULT = 0.2e-9            # S/km, the default shunt conductance of the reduced phases (EMTP)


class LineError(ValueError):
    pass


def _f(v, d=None):
    if v is None or v == '':
        if d is None:
            raise LineError('λείπει τιμή')
        return float(d)
    try:
        return float(v)
    except (TypeError, ValueError):
        raise LineError(f'μη αριθμητική τιμή: {v!r}')


# ---------------------------------------------------------------- the conductors
def conductors(data):
    """The individual conductors of the line data, in SI: phase, x, average height h, radius r, inner radius q,
    dc resistance per metre, μ_r, and the internal-impedance model. Bundles are expanded into their subconductors."""
    out = []

    def one(w, x, y, ymid):
        r = _f(w.get('r')) / 100.0
        if r <= 0:
            raise LineError('η ακτίνα αγωγού πρέπει να είναι θετική')
        tD = _f(w.get('tD'), 0.5)
        if not 0 < tD <= 0.5:
            raise LineError('ο λόγος T/D πρέπει να είναι στο (0, 0,5]')
        h = y if ymid in (None, '') else (2.0 * _f(ymid) + y) / 3.0
        if h <= r:
            raise LineError('ο αγωγός πρέπει να είναι πάνω από το έδαφος')
        Rdc = _f(w.get('Rdc')) / 1000.0
        if Rdc <= 0:
            raise LineError('η αντίσταση dc πρέπει να είναι θετική')
        out.append({'ph': int(_f(w.get('ph'), 1)), 'x': x, 'h': h, 'r': r, 'q': r * (1 - 2 * tD), 'Rdc': Rdc,
                    'mur': _f(w.get('mur'), 1.0)})

    for w in data.get('wires', []) or []:
        one(w, _f(w.get('x')), _f(w.get('y')), w.get('ymid'))
    for b in data.get('bundles', []) or []:
        n = int(_f(b.get('n'), 2))
        R = _f(b.get('R')) / 100.0
        a0 = math.radians(_f(b.get('ang'), 0.0))
        x0, y0 = _f(b.get('x')), _f(b.get('y'))
        sag = None if b.get('ymid') in (None, '') else y0 - _f(b.get('ymid'))
        for k in range(max(n, 1)):
            a = a0 + 2 * math.pi * k / max(n, 1)
            dx, dy = (R * math.cos(a), R * math.sin(a)) if n > 1 else (0.0, 0.0)
            one(b, x0 + dx, y0 + dy, None if sag is None else y0 + dy - sag)
    if not out:
        raise LineError('δεν δόθηκαν αγωγοί')
    phs = sorted({c['ph'] for c in out if c['ph'] > 0})
    if not phs:
        raise LineError('χρειάζεται τουλάχιστον μία φάση (αριθμός ≥ 1)')
    if phs != list(range(1, len(phs) + 1)):
        raise LineError('οι αριθμοί φάσεων πρέπει να είναι 1, 2, …, M χωρίς κενά (0 = αγωγός προστασίας)')
    for i, a in enumerate(out):
        for b in out[i + 1:]:
            if math.hypot(a['x'] - b['x'], a['h'] - b['h']) <= a['r'] + b['r']:
                raise LineError('δύο αγωγοί επικαλύπτονται')
    return out


def phases(data):
    if data.get('cables'):
        return max(cd['ph'] for c in cables(data) for cd in c['conds'])
    return max(c['ph'] for c in conductors(data))


# ---------------------------------------------------------------- internal impedance
def z_internal(f, r, q, Rdc, mur=1.0, skin=True, s=None):
    """Internal impedance per metre of a tubular conductor (outer radius r, inner q, dc resistance Rdc per metre):
    Bessel functions with the resistivity from Rdc (Dommel eq. 5.7b), or Rdc + jωL_dc when the skin effect is off.
    With s (complex) instead of f the same formulas at that complex frequency (numerical Laplace transform)."""
    s = 2j * math.pi * f if s is None else complex(s)
    if not skin or s == 0:
        if q > 0:
            r2, q2 = r * r, q * q
            L = MU0 * mur / (2 * math.pi) * (q2 * q2 / (r2 - q2) ** 2 * math.log(r / q) - (3 * q2 - r2) / (4 * (r2 - q2)))
        else:
            L = MU0 * mur / (8 * math.pi)
        return Rdc + s * L
    from scipy.special import ive, kve
    rho = Rdc * math.pi * (r * r - q * q)
    m = cmath.sqrt(s * MU0 * mur / rho)
    a = m * r
    if abs(a) < 1e-6:
        return z_internal(0, r, q, Rdc, mur, False, s)
    if q <= 0:
        return rho * m / (2 * math.pi * r) * ive(0, a) / ive(1, a)
    b = m * q
    E = cmath.exp(-(a - b)) * math.exp(-(a.real - b.real))
    num = ive(0, a) * kve(1, b) + kve(0, a) * ive(1, b) * E
    den = ive(1, a) * kve(1, b) - ive(1, b) * kve(1, a) * E
    return rho * m / (2 * math.pi * r) * num / den


# ---------------------------------------------------------------- earth return
def _carson_coeffs(n=200):
    b, c, d = [0.0] * (n + 3), [0.0] * (n + 3), [0.0] * (n + 3)
    b[1], b[2], c[2] = math.sqrt(2) / 6, 1.0 / 16, 1.3659315
    for i in range(3, n + 1):
        sign = 1.0 if ((i - 1) // 4) % 2 == 0 else -1.0     # the sign of b_i itself: + for i = 1…4, − for 5…8, …
        b[i] = sign * abs(b[i - 2]) / (i * (i + 2))
    for i in range(4, n + 1, 2):
        c[i] = c[i - 2] + 1.0 / i + 1.0 / (i + 2)
    for i in range(1, n + 1):
        d[i] = math.pi / 4 * b[i]
    return b, c, d


_CB, _CC, _CD = _carson_coeffs()


A_SWITCH = 10.0


def carson_series(D, phi, f, rho, switch=None):
    """Carson's correction terms ΔR′ + jΔX′ (Ω/m) for the distance D to the image (2h for the self impedance) and
    the angle φ (Dommel eqs. 4.10–4.14): the series for small a, the asymptotic series for large a. LINE CONSTANTS
    switches at a = 5, where the asymptotic series is off by up to 0.4 % (a step in Z′(ω) that spoils the fit of
    the FD model); here the switch is at a = 10, where both agree with Carson's integral within 3·10⁻⁵."""
    w = 2 * math.pi * f
    if f <= 0:
        return 0j
    a = 4 * math.pi * math.sqrt(5) * 1e-4 * D * math.sqrt(f / rho)
    k = w * MU0 / math.pi            # 4ω·10⁻⁴ Ω/km = ωμ₀/π Ω/m
    if a > (A_SWITCH if switch is None else switch):
        c1, c2, c3, c5, c7 = (math.cos(i * phi) for i in (1, 2, 3, 5, 7))
        dR = (c1 / a - math.sqrt(2) * c2 / a ** 2 + c3 / a ** 3 + 3 * c5 / a ** 5 - 45 * c7 / a ** 7) / math.sqrt(2)
        dX = (c1 / a - c3 / a ** 3 + 3 * c5 / a ** 5 + 45 * c7 / a ** 7) / math.sqrt(2)
        return k * complex(dR, dX)
    la = math.log(a)
    dR, dX = math.pi / 8, 0.5 * (0.6159315 - la)
    b, c, d = _CB, _CC, _CD
    ai = 1.0
    for i in range(1, len(b) - 2):
        ai *= a
        ci, si = math.cos(i * phi), math.sin(i * phi)
        m = i % 4
        if m == 1:
            tR, tX = -b[i] * ai * ci, b[i] * ai * ci
        elif m == 2:
            tR = b[i] * ((c[i] - la) * ai * ci + phi * ai * si)
            tX = -d[i] * ai * ci
        elif m == 3:
            tR, tX = b[i] * ai * ci, b[i] * ai * ci
        else:
            tR = -d[i] * ai * ci
            tX = -b[i] * ((c[i] - la) * ai * ci + phi * ai * si)
        dR += tR
        dX += tX
        if i > 8 and abs(tR) + abs(tX) < 1e-16 * (abs(dR) + abs(dX)):
            break
    return k * complex(dR, dX)


def carson_integral(hi, hk, x, f, rho, mu=MU0, s=None):
    """Carson's correction as his integral (Ω/m), by numerical quadrature:
    ΔZ = (sμ₀/π)·∫₀^∞ e^(−(h_i+h_k)λ)·cos(xλ) / (λ + √(λ² + sμ₀/ρ)) dλ, s = jω (or any complex s)."""
    from scipy.integrate import quad
    s = 2j * math.pi * f if s is None else complex(s)
    H = hi + hk
    k2 = s * mu / rho

    def g(lam):
        return math.exp(-H * lam) * math.cos(x * lam) / (lam + cmath.sqrt(lam * lam + k2))

    lim = 60.0 / H
    re = quad(lambda l: g(l).real, 0, lim, limit=400, epsabs=0, epsrel=1e-12)[0]
    im = quad(lambda l: g(l).imag, 0, lim, limit=400, epsabs=0, epsrel=1e-12)[0]
    return s * mu / math.pi * complex(re, im)


# ---------------------------------------------------------------- single-core cables (4.5, Dommel ch. 5)
# A cable is a set of coaxial layers from the centre out: conductors ('c': core, sheath, armor, …, each a tube with
# inner radius rin, outer radius rout, resistivity rho, μ_r) separated by insulations ('i': outer radius rout, ε_r,
# tanδ, μ_r). Radii in m, resistivity in Ω·m, as the EMTP Cable Data. Each conductor has a phase number in 'ph'
# (same rules as the overhead conductors: 0 = grounded at both ends and eliminated, equal numbers = bonded).
# The medium is 'earth' (semi-infinite, Pollaczek; depth y > 0 below the surface) or 'sea' (infinite, ρ ≈ 0.2 Ω·m).

def cables(data):
    """The cables of the line data in SI: position, conductors (rin, rout, ρ, μ_r, phase) and the insulation after
    each conductor (ε_r, tanδ, μ_r, inner and outer radius), and the outer radius R."""
    out = []
    for n, c in enumerate(data.get('cables', []) or []):
        x, y = _f(c.get('x')), _f(c.get('y'))
        lay = c.get('layers') or []
        ph = [int(_f(v)) for v in (c.get('ph') or [])]
        conds, r = [], 0.0
        for L in lay:
            t = L.get('t', 'c')
            ro = _f(L.get('rout'))
            if ro <= r:
                raise LineError(f'καλώδιο {n + 1}: οι ακτίνες των στρωμάτων πρέπει να αυξάνουν')
            if t == 'c':
                ri = _f(L.get('rin'), r)
                if ri < r - 1e-12 or ri >= ro:
                    raise LineError(f'καλώδιο {n + 1}: μη έγκυρη εσωτερική ακτίνα αγωγού')
                if conds and conds[-1]['ins'] is None and ri > r + 1e-12:
                    raise LineError(f'καλώδιο {n + 1}: κενό ανάμεσα σε αγωγούς χωρίς μόνωση')
                conds.append({'rin': ri, 'rout': ro, 'rho': _f(L.get('rho')), 'mur': _f(L.get('mur'), 1.0), 'ins': None})
            else:
                if not conds:
                    raise LineError(f'καλώδιο {n + 1}: το πρώτο στρώμα πρέπει να είναι αγωγός')
                if conds[-1]['ins'] is not None:
                    raise LineError(f'καλώδιο {n + 1}: δύο μονώσεις στη σειρά· ένωσέ τες σε μία')
                conds[-1]['ins'] = {'rin': r, 'rout': ro, 'epsr': _f(L.get('epsr'), 1.0), 'tand': _f(L.get('tand'), 0.0),
                                    'mur': _f(L.get('mur'), 1.0)}
            r = ro
        if not conds:
            raise LineError(f'καλώδιο {n + 1}: χωρίς αγωγούς')
        for k, cd in enumerate(conds):
            if cd['rho'] <= 0:
                raise LineError(f'καλώδιο {n + 1}: η ειδική αντίσταση πρέπει να είναι θετική')
            if k < len(conds) - 1 and cd['ins'] is None:
                raise LineError(f'καλώδιο {n + 1}: χρειάζεται μόνωση ανάμεσα στους αγωγούς')
            cd['ph'] = ph[k] if k < len(ph) else 0
        if conds[-1]['ins'] is None and conds[-1]['ph'] != 0:
            raise LineError(f'καλώδιο {n + 1}: ο εξωτερικός αγωγός χωρίς μόνωση ακουμπά στο μέσο: φάση 0')
        out.append({'x': x, 'y': y, 'conds': conds, 'R': r})
    for i, a in enumerate(out):
        for b in out[i + 1:]:
            if math.hypot(a['x'] - b['x'], a['y'] - b['y']) < a['R'] + b['R'] - 1e-12:
                raise LineError('δύο καλώδια επικαλύπτονται')
    return out


def tube(s, q, r, rho, mur=1.0):
    """Internal impedances of a tubular conductor (inner radius q, outer r) per metre at the complex frequency s:
    (Z_in, Z_out, Z_mutual) of Dommel eq. 5.7, with the scaled Bessel functions (no overflow at high frequencies).
    A solid conductor (q = 0) has only Z_out. At s = 0 the dc limits."""
    from scipy.special import ive, kve
    s = complex(s)
    area = math.pi * (r * r - q * q)
    if s == 0:
        return complex(rho / area), complex(rho / area), complex(rho / area)
    m = cmath.sqrt(s * MU0 * mur / rho)
    a = m * r
    if q <= 0:
        if abs(a) < 1e-6:
            return 0j, complex(rho / area), 0j
        return 0j, rho * m / (2 * math.pi * r) * ive(0, a) / ive(1, a), 0j
    b = m * q
    if abs(a) < 1e-6:
        return complex(rho / area), complex(rho / area), complex(rho / area)
    E = cmath.exp(-(a - b)) * math.exp(-(a.real - b.real))
    D = ive(1, a) * kve(1, b) - ive(1, b) * kve(1, a) * E
    zin = rho * m / (2 * math.pi * q) * (kve(0, b) * ive(1, a) + ive(0, b) * kve(1, a) * E) / D
    zout = rho * m / (2 * math.pi * r) * (ive(0, a) * kve(1, b) + kve(0, a) * ive(1, b) * E) / D
    zmut = rho / (2 * math.pi * q * r) * cmath.exp(-a.real + b) / D
    return zin, zout, zmut


def pollaczek(s, h, y, x, rho, d=None):
    """Earth-return impedance (Ω/m) between the loops of two conductors buried at depths h and y, horizontal distance
    x, in semi-infinite earth (Pollaczek, Dommel eq. 5.22; the self impedance with d = R, x = R, y = h, eq. 5.23):
    (sμ₀/2π)·[K₀(md) − K₀(mD) + 2∫₀^∞ e^(−(h+y)√(α²+m²))·cos(αx)/(α + √(α²+m²)) dα], m = √(sμ₀/ρ)."""
    from scipy.integrate import quad
    from scipy.special import kve
    s = complex(s)
    m = cmath.sqrt(s * MU0 / rho)
    d = math.hypot(x, h - y) if d is None else d
    D = math.hypot(x, h + y)
    H = h + y

    def K0(z):
        return kve(0, z) * cmath.exp(-z)

    def g(al):                           # the cos(αx) goes to the quadrature's weight (QAWO), not in the function
        w = cmath.sqrt(al * al + m * m)
        return cmath.exp(-H * w) / (al + w)

    lim = 40.0 / H + 40.0 * abs(m)
    # the integrand changes fast near α ≈ |m| (small at low frequency): [0, c] by plain adaptive quadrature with the
    # cosine inside, the long tail by QAWO (weight cos(αx)). The bracket is O(1) (the K₀ terms), so an absolute floor
    # of 1e-13 is far below what matters; a relative tolerance alone cannot be met when one part is nearly zero.
    c = min(lim, 50.0 * abs(m))
    tol = {'epsabs': 1e-13, 'epsrel': 1e-11}

    def part(fn):
        v = quad(lambda a: fn(g(a)) * math.cos(a * x), 0, c, limit=400, **tol)[0] if c > 0 else 0.0
        if lim > c:
            kw = {'weight': 'cos', 'wvar': x} if x > 0 else {}
            v += quad(lambda a: fn(g(a)), c, lim, limit=800, **tol, **kw)[0]
        return v

    re, im = part(lambda z: z.real), part(lambda z: z.imag)
    return s * MU0 / (2 * math.pi) * (K0(m * d) - K0(m * D) + 2 * complex(re, im))


def wedepohl(s, h, y, d, rho, self=False):
    """Wedepohl's approximation of the earth-return impedance of buried conductors (Dommel eqs. 5.24, 5.25): good to
    1 % while |m·R| or |m·d| < 0.25. Self: d = R and h = y."""
    s = complex(s)
    m = cmath.sqrt(s * MU0 / rho)
    g = math.exp(0.5772156649015329)     # γ = e^C = 1.781… (C: Euler's constant), as in Wedepohl's formula
    k = s * MU0 / (2 * math.pi)
    if self:
        return k * (-cmath.log(g * m * d / 2) + 0.5 - 4.0 / 3.0 * m * h)
    return k * (-cmath.log(g * m * d / 2) + 0.5 - 2.0 / 3.0 * m * (h + y))


def sea_return(s, Ri, Rk, d, rho):
    """Return through an infinite medium (sea water), Dommel eqs. 5.28–5.29: self ρm·K₀(mR)/(2πR·K₁(mR)) (d = 0),
    mutual ρ·K₀(md)/(2πR_iR_k·K₁(mR_i)·K₁(mR_k))."""
    from scipy.special import kve
    s = complex(s)
    m = cmath.sqrt(s * MU0 / rho)
    if d == 0:
        a = m * Ri
        return rho * m / (2 * math.pi * Ri) * kve(0, a) / kve(1, a)
    ai, ak, ad = m * Ri, m * Rk, m * d
    # K₀(md)/(K₁(mR_i)K₁(mR_k)) with the scaled functions: e^(−md + mR_i + mR_k)
    return rho / (2 * math.pi * Ri * Rk) * kve(0, ad) / (kve(1, ai) * kve(1, ak)) * cmath.exp(-ad + ai + ak)


F_LOSS = (1e-3, 1e12)     # band of the wideband Debye loss (Hz): tanδ is nearly constant well inside it
F_EPS = 50.0               # frequency at which εr and tanδ of an insulation are given (Hz)


def permittivity(s, epsr, tand, fref=F_EPS):
    """Relative permittivity ε(s) with the loss tangent tanδ: wideband Debye model (Djordjevic, Sarkar et al. 2001)
    ε(s) = ε∞ + K·log₁₀((ω₂ + s)/(ω₁ + s)) with ε(j2πf_ref) = εr·(1 − j·tanδ). A constant tanδ at every frequency is not
    causal (its A(s) has no stable rational fit, and the real-time response is not real); this one is, and its real part
    changes by only about εr·tanδ·1.5 per decade. tanδ = 0 gives εr."""
    if not tand:
        return complex(epsr)
    w1, w2 = (2 * math.pi * f for f in F_LOSS)
    sr = 2j * math.pi * fref
    lg = cmath.log((w2 + sr) / (w1 + sr)) / math.log(10)
    K = -epsr * tand / lg.imag
    einf = epsr - K * lg.real
    return einf + K * cmath.log((w2 + s) / (w1 + s)) / math.log(10)


def cable_zy(data, s):
    """Series impedance and shunt admittance (per metre) of all cable conductors at the complex frequency s, from the
    coaxial loops (Dommel eqs. 5.1–5.17) and the earth or sea return of the outer loops (5.18–5.29), and the
    conductors as {ph} for the reduction."""
    cbs = cables(data)
    medium = data.get('medium', 'earth')
    rho = _f(data.get('rho'), 100.0 if medium == 'earth' else 0.2)
    s = complex(s)
    blocks, cs, A_all = [], [], []
    for c in cbs:
        N = len(c['conds'])
        Zl = np.zeros((N, N), complex)
        Yl = np.zeros(N, complex)
        for k, cd in enumerate(c['conds']):
            _, zout, _ = tube(s, cd['rin'], cd['rout'], cd['rho'], cd['mur'])
            Zl[k, k] += zout
            ins = cd['ins']
            if ins:
                Zl[k, k] += s * MU0 * ins['mur'] / (2 * math.pi) * math.log(ins['rout'] / ins['rin'])
                Cp = 2 * math.pi * EPS0 * ins['epsr'] / math.log(ins['rout'] / ins['rin'])
                Yl[k] = s * Cp * permittivity(s, 1.0, ins['tand'])
            else:
                Yl[k] = np.inf
            if k + 1 < N:
                nx = c['conds'][k + 1]
                zin, _, zmut = tube(s, nx['rin'], nx['rout'], nx['rho'], nx['mur'])
                Zl[k, k] += zin
                Zl[k, k + 1] = Zl[k + 1, k] = -zmut
        if medium == 'sea':
            Zl[N - 1, N - 1] += sea_return(s, c['R'], c['R'], 0, rho)
        elif medium == 'perfect':
            pass
        else:
            Zl[N - 1, N - 1] += pollaczek(s, c['y'], c['y'], c['R'], rho, d=c['R'])
        A = np.tril(np.ones((N, N)))       # I_loop = A·I_conductor, V_conductor = Aᵀ·V_loop
        Zc = A.T @ Zl @ A
        if np.isinf(Yl).any():             # the outer conductor touches the medium: its loop voltage is 0
            Yl = np.where(np.isinf(Yl), 1e12, Yl)
        Ainv = np.linalg.inv(A)
        Yc = Ainv @ np.diag(Yl) @ Ainv.T
        blocks.append((Zc, Yc, N))
        for cd in c['conds']:
            cs.append({'ph': cd['ph']})
        A_all.append(A)
    n = len(cs)
    Z = np.zeros((n, n), complex)
    Y = np.zeros((n, n), complex)
    o = []
    k = 0
    for (Zc, Yc, N) in blocks:
        o.append(k)
        Z[k:k + N, k:k + N] = Zc
        Y[k:k + N, k:k + N] = Yc
        k += N
    for i, a in enumerate(cbs):
        for j, b in enumerate(cbs):
            if j <= i:
                continue
            dx = a['x'] - b['x']
            d = math.hypot(dx, a['y'] - b['y'])
            if medium == 'sea':
                zm = sea_return(s, a['R'], b['R'], d, rho)
            elif medium == 'perfect':
                zm = 0j
            else:
                zm = pollaczek(s, a['y'], b['y'], abs(dx), rho)
            Ni, Nj = len(a['conds']), len(b['conds'])
            Z[o[i]:o[i] + Ni, o[j]:o[j] + Nj] = zm   # only the outer loops couple: every conductor pair sees it
            Z[o[j]:o[j] + Nj, o[i]:o[i] + Ni] = zm
    return Z, Y, cs


# ---------------------------------------------------------------- matrices per metre
def zy(data, f=None, earth=None, skin=None, s=None):
    """Series impedance Z′ (Ω/m) and potential coefficients P′ (m/F) of all individual conductors at the frequency f
    (or the complex frequency s), and the conductors themselves. The earth: 'carson' (series, as LINE CONSTANTS),
    'integral' (Carson's integral), 'deri' (complex depth) or 'perfect'. At a complex s, Carson's series does not
    apply and his integral is used."""
    cs = conductors(data)
    earth = earth or data.get('earth', 'carson')
    skin = data.get('skin', True) if skin is None else skin
    rho = _f(data.get('rho'), 100.0)
    s = 2j * math.pi * f if s is None else complex(s)
    imag = s.real == 0
    n = len(cs)
    Z = np.zeros((n, n), complex)
    P = np.zeros((n, n))
    p = cmath.sqrt(rho / (s * MU0)) if (earth == 'deri' and s != 0) else 0
    for i, a in enumerate(cs):
        for k, b in enumerate(cs):
            if k < i:
                continue
            if i == k:
                D, d, ph = 2 * a['h'], a['r'], 0.0
            else:
                dx = a['x'] - b['x']
                D, d = math.hypot(dx, a['h'] + b['h']), math.hypot(dx, a['h'] - b['h'])
                ph = math.asin(abs(dx) / D)
            P[i, k] = math.log(D / d) / (2 * math.pi * EPS0)
            if earth == 'deri' and s != 0:
                Dc = cmath.sqrt((a['h'] + b['h'] + 2 * p) ** 2 + (a['x'] - b['x']) ** 2)
                z = s * MU0 / (2 * math.pi) * cmath.log(Dc / d)
            else:
                z = s * MU0 / (2 * math.pi) * math.log(D / d)
                if s != 0 and earth == 'carson' and imag:
                    z += carson_series(D, ph, s.imag / (2 * math.pi), rho)
                elif s != 0 and earth in ('carson', 'integral'):
                    z += carson_integral(a['h'], b['h'], a['x'] - b['x'], 0, rho, s=s)
            if i == k:
                z += z_internal(0, a['r'], a['q'], a['Rdc'], a['mur'], skin, s)
            Z[i, k] = Z[k, i] = z
            P[k, i] = P[i, k]
    return Z, P, cs


def _groups(cs):
    M = max(c['ph'] for c in cs)
    T = np.zeros((len(cs), M))
    for i, c in enumerate(cs):
        if c['ph'] > 0:
            T[i, c['ph'] - 1] = 1.0
    return T


def reduce_phases(Z, P, cs):
    """Phase matrices after bundling (equal voltage, summed currents) and the elimination of the ground wires (zero
    voltage): Y_s = Z⁻¹ and C = P⁻¹ summed per phase, then inverted back (exact for any geometry)."""
    T = _groups(cs)
    Zr = np.linalg.inv(T.T @ np.linalg.inv(Z) @ T)
    Pr = np.linalg.inv(T.T @ np.linalg.inv(P) @ T)
    return Zr, Pr


def phase_matrices(data, f=None, s=None, **kw):
    """Reduced Z′ (Ω/m) and Y′ = G′ + sC′ (S/m) of the M phases at the frequency f (or the complex frequency s).
    Cables (4.5): Y′ of the insulations (with tanδ), reduced the same way, and G′ only when the data give it."""
    s = 2j * math.pi * f if s is None else complex(s)
    if data.get('cables'):
        if data.get('wires') or data.get('bundles'):
            raise LineError('εναέριοι αγωγοί και καλώδια στην ίδια γραμμή δεν υποστηρίζονται ακόμη')
        Z, Ysh, cs = cable_zy(data, s)
        T = _groups(cs)
        Zr = np.linalg.inv(T.T @ np.linalg.inv(Z) @ T)
        G = _f(data.get('G'), 0.0) / 1000.0         # the insulation losses are in tanδ: no extra G′ unless given
        return Zr, G * np.eye(len(Zr)) + T.T @ Ysh @ T
    Z, P, cs = zy(data, s=s, **kw)
    Zr, Pr = reduce_phases(Z, P, cs)
    G = _f(data.get('G'), G_DEFAULT) / 1000.0
    Y = G * np.eye(len(Zr)) + s * np.linalg.inv(Pr)
    return Zr, Y


def sequence(Z):
    """Positive and zero sequence of a 3-phase matrix after averaging (perfect transposition): Z₁ = Z_s − Z_m,
    Z₀ = Z_s + 2Z_m."""
    Z = np.asarray(Z)
    M = len(Z)
    s = np.trace(Z) / M
    m = (Z.sum() - np.trace(Z)) / (M * (M - 1)) if M > 1 else 0
    return s - m, s + (M - 1) * m


# ---------------------------------------------------------------- modes
def ti_matrix(Z, Y):
    """The current transformation matrix T_i at one frequency: eigenvectors of Y′Z′, sorted from the slowest mode
    (ground mode first), each column normalized and rotated so that the modal conductance is zero, then the
    imaginary part dropped and the column normalized again (as the EMTP)."""
    lam, V = np.linalg.eig(Y @ Z)
    gam = np.sqrt(lam)
    vel = (2 * math.pi) / np.maximum(gam.imag, 1e-300)
    order = np.argsort(vel)
    V = V[:, order]
    V = V / np.linalg.norm(V, axis=0)
    Tv = np.linalg.inv(V).T
    for j in range(V.shape[1]):
        ym = (np.linalg.inv(V)[j] @ Y @ Tv[:, j])
        th = (cmath.phase(ym) - math.pi / 2) / 2
        V[:, j] *= cmath.exp(1j * th)
        Tv = np.linalg.inv(V).T
    Ti = V.real
    Ti = Ti / np.linalg.norm(Ti, axis=0)
    for j in range(Ti.shape[1]):              # sign: the largest element positive
        if Ti[np.argmax(np.abs(Ti[:, j])), j] < 0:
            Ti[:, j] = -Ti[:, j]
    return Ti


def modal(Z, Y, Ti):
    """Diagonals of the modal Z′ = T_iᵀZ′T_i and Y′ = T_i⁻¹Y′T_i⁻ᵀ for a real constant T_i."""
    Tinv = np.linalg.inv(Ti)
    return np.diag(Ti.T @ Z @ Ti).copy(), np.diag(Tinv @ Y @ Tinv.T).copy()


def q_error(Z, Y, Ti):
    """Largest relative off-diagonal coupling left by the real T_i in the modal Y′Z′ (0 = exact decoupling)."""
    Tinv = np.linalg.inv(Ti)
    Am = Tinv @ (Y @ Z) @ Ti
    d = np.abs(np.diag(Am))
    off = np.abs(Am - np.diag(np.diag(Am)))
    return float((off / d[:, None]).max()) if len(d) > 1 else 0.0


# ---------------------------------------------------------------- vector fitting with real poles
def vfit(s, F, n, d=True, weight=None, iters=12, p0=None):
    """Rational approximation F(s) ≈ d + Σ r_k/(s + p_k) with real, positive p_k and real r_k (vector fitting,
    Gustavsen & Semlyen 1999, kept to real poles as in J. Marti's model): pole relocation with σ(s), complex pairs
    replaced by their real parts, unstable poles flipped. Returns (d, r, p, rms error, max error) with the
    weighted error."""
    s = np.asarray(s)
    F = np.asarray(F)
    w = np.ones(len(s)) if weight is None else np.asarray(weight)
    wmax = abs(s.imag).max()
    wmin = max(abs(s.imag).min(), wmax * 1e-12)
    p = np.array(p0, float) if p0 is not None else np.logspace(math.log10(wmin), math.log10(wmax), n)

    def basis(p):
        return 1.0 / (s[:, None] + p[None, :])

    for _ in range(iters):
        B = basis(p)
        cols = [B]
        if d:
            cols.append(np.ones((len(s), 1)))
        A1 = np.hstack(cols)
        A = np.hstack([A1, -F[:, None] * B]) * w[:, None]
        rhs = F * w
        Ar = np.vstack([A.real, A.imag])
        br = np.concatenate([rhs.real, rhs.imag])
        sc = np.linalg.norm(Ar, axis=0)
        sc[sc == 0] = 1
        x = np.linalg.lstsq(Ar / sc, br, rcond=None)[0] / sc
        rt = x[A1.shape[1]:]
        # zeros of σ(s) = 1 + Σ rt_k/(s + p_k): eigenvalues of diag(−p) − 1·rtᵀ
        H = np.diag(-p) - np.outer(np.ones(len(p)), rt)
        z = np.linalg.eigvals(H)
        pn = np.sort(np.maximum(np.abs(z.real), wmin * 1e-3))
        for i in range(1, len(pn)):              # identical poles make the basis singular
            if pn[i] <= pn[i - 1] * (1 + 1e-6):
                pn[i] = pn[i - 1] * 1.01
        if np.allclose(pn, p, rtol=1e-8):
            p = pn
            break
        p = pn
    B = basis(p)
    A1 = np.hstack([B, np.ones((len(s), 1))]) if d else B
    A = A1 * w[:, None]
    Ar = np.vstack([A.real, A.imag])
    br = np.concatenate([(F * w).real, (F * w).imag])
    sc = np.linalg.norm(Ar, axis=0)
    sc[sc == 0] = 1
    x = np.linalg.lstsq(Ar / sc, br, rcond=None)[0] / sc
    r = x[:len(p)]
    dd = float(x[len(p)]) if d else 0.0
    Ff = dd + B @ r
    e = np.abs(Ff - F) * w
    return dd, r, p, float(np.sqrt(np.mean(e ** 2))), float(e.max())


def rational(s, d, r, p):
    s = np.asarray(s)
    return d + (1.0 / (s[:, None] + np.asarray(p)[None, :])) @ np.asarray(r)


# ---------------------------------------------------------------- line models
def freqs(fmin=0.01, decades=9, ppd=10):
    n = int(round(decades * ppd))
    return fmin * 10 ** (np.arange(n + 1) / ppd)


def cp_model(data, f=50.0, length=None):
    """Constant-parameter model: per mode Z_c = √(L′/C′), velocity 1/√(L′C′) and the total modal resistance R′ℓ,
    from the modal matrices at f with the real T_i of that frequency."""
    L = (_f(data.get('length'), 1.0) if length is None else length) * 1000.0
    Z, Y = phase_matrices(data, f)
    Ti = ti_matrix(Z, Y)
    zm, ym = modal(Z, Y, Ti)
    w = 2 * math.pi * f
    modes = []
    for z, y in zip(zm, ym):
        Lp, Cp = z.imag / w, y.imag / w
        modes.append({'Zc': math.sqrt(Lp / Cp), 'tau': L * math.sqrt(Lp * Cp), 'R': z.real * L,
                      'v': 1 / math.sqrt(Lp * Cp)})
    return {'type': 'cp', 'M': len(Z), 'f': f, 'length': L / 1000.0, 'Ti': Ti.tolist(), 'modes': modes,
            'qerr': q_error(Z, Y, Ti)}


def _fit_a(s, A, w, L, tmin, tmax, n, tol):
    """A·e^(sτ) by real poles, with τ chosen in [τ_min, τ_max] for the smallest error (golden section)."""
    def err(tau, nn):
        fit = vfit(s, A * np.exp(s * tau), nn, d=False)
        return fit[4], fit

    def best(nn):
        # the error is not unimodal in τ (cables: |A| is still large at f_max): a coarse grid first, then golden
        # section between the neighbours of the best point
        grid = np.linspace(tmin, tmax, 25)
        errs = [err(t, nn)[0] for t in grid]
        k = int(np.argmin(errs))
        a, b = grid[max(k - 1, 0)], grid[min(k + 1, len(grid) - 1)]
        g = (math.sqrt(5) - 1) / 2
        c, dd = b - g * (b - a), a + g * (b - a)
        ec, ed = err(c, nn)[0], err(dd, nn)[0]
        for _ in range(28):
            if ec < ed:
                b, dd, ed = dd, c, ec
                c = b - g * (b - a)
                ec = err(c, nn)[0]
            else:
                a, c, ec = c, dd, ed
                dd = a + g * (b - a)
                ed = err(dd, nn)[0]
            if b - a < 1e-6 * tmax:
                break
        t = (a + b) / 2
        return t, err(t, nn)[1]

    nn = n
    while True:
        tau, fit = best(nn)
        if fit[4] <= tol or nn >= 30:
            return tau, fit
        nn += 2


def fd_model(data, length=None, fmin=0.01, decades=9, ppd=10, fti=None, tol_zc=0.01, tol_a=0.005, n0=6, curves=False):
    """Frequency-dependent model (J. Marti): constant real T_i (at fti, or 1 kHz), and per mode
    Z_c(s) ≈ k₀ + Σ r_k/(s + p_k) and A(s) ≈ e^(−sτ)·Σ c_k/(s + q_k), fitted over fmin … fmin·10^decades.
    Each fit adds poles until its error is below its tolerance (relative for Z_c, absolute for A)."""
    L = (_f(data.get('length'), 1.0) if length is None else length) * 1000.0
    fti = fti or 1000.0
    Zt, Yt = phase_matrices(data, fti)
    Ti = ti_matrix(Zt, Yt)
    fs = freqs(fmin, decades, ppd)
    s = 2j * math.pi * fs
    M = len(Zt)
    zc = np.zeros((len(fs), M), complex)
    gm = np.zeros((len(fs), M), complex)
    qe = 0.0
    for i, f in enumerate(fs):
        Z, Y = phase_matrices(data, f)
        zm, ym = modal(Z, Y, Ti)
        zc[i] = np.sqrt(zm / ym)
        gm[i] = np.sqrt(zm * ym)
        if i % ppd == 0:
            qe = max(qe, q_error(Z, Y, Ti))
    modes = []
    for k in range(M):
        Zc = zc[:, k]
        A = np.exp(-gm[:, k] * L)
        nz = n0
        while True:
            fz = vfit(s, Zc, nz, d=True, weight=1 / np.abs(Zc))
            if fz[4] <= tol_zc or nz >= 30:
                break
            nz += 2
        vmax = 2 * math.pi * fs[-1] / gm[-1, k].imag
        tmax = L / vmax * 1.0005
        tau, fa = _fit_a(s, A, None, L, max(L / C0, 0.8 * tmax), tmax, n0, tol_a)
        m = {'zc': {'d': fz[0], 'r': fz[1].tolist(), 'p': fz[2].tolist(), 'err': fz[4]},
             'a': {'r': fa[1].tolist(), 'p': fa[2].tolist(), 'err': fa[4]}, 'tau': tau,
             'Zc_inf': fz[0], 'Zc_dc': abs(Zc[0])}
        if curves:                     # exact and fitted |Z_c|, |A| and the phase of A·e^(sτ) for the report
            zf = rational(s, fz[0], fz[1], fz[2])
            af = rational(s, 0, fa[1], fa[2]) * np.exp(-s * tau)
            m['curve'] = {'Zc': np.abs(Zc).tolist(), 'Zc_fit': np.abs(zf).tolist(), 'A': np.abs(A).tolist(),
                          'A_fit': np.abs(af).tolist()}
        modes.append(m)
    out = {'type': 'fd', 'M': M, 'length': L / 1000.0, 'fti': fti, 'fmin': fmin, 'fmax': float(fs[-1]),
           'Ti': Ti.tolist(), 'modes': modes, 'qerr': qe}
    if curves:
        out['f'] = fs.tolist()
    return out


def report(data, f=50.0):
    """Everything the dialog shows at one frequency: reduced matrices, sequence parameters (3 phases),
    and the modal parameters with the real T_i of that frequency."""
    Z, Y = phase_matrices(data, f)
    w = 2 * math.pi * f
    Ti = ti_matrix(Z, Y)
    zm, ym = modal(Z, Y, Ti)
    r = {'f': f, 'M': len(Z), 'R': (Z.real * 1000).tolist(), 'L': (Z.imag / w * 1000).tolist(),
         'C': (Y.imag / w * 1000).tolist(), 'Ti': Ti.tolist(), 'qerr': q_error(Z, Y, Ti),
         'modes': [{'R': z.real * 1000, 'L': z.imag / w * 1000, 'C': y.imag / w * 1000,
                    'Zc': abs(cmath.sqrt(z / y)), 'v': w / cmath.sqrt(z * y).imag,
                    'att': cmath.sqrt(z * y).real * 1000} for z, y in zip(zm, ym)]}
    if len(Z) == 3:
        z1, z0 = sequence(Z)
        c1, c0 = sequence(Y.imag / w)
        r['seq'] = {'R1': z1.real * 1000, 'X1': z1.imag * 1000, 'R0': z0.real * 1000, 'X0': z0.imag * 1000,
                    'C1': c1 * 1000, 'C0': c0 * 1000}
    return r


# ---------------------------------------------------------------- exact line in the frequency domain
def exact_admittance(data, f, length=None):
    """Nodal admittance of the line (2M × 2M, ends 1 and 2) at f, with the exact complex eigenvectors (no fit)."""
    L = (_f(data.get('length'), 1.0) if length is None else length) * 1000.0
    Z, Y = phase_matrices(data, f)
    return line_admittance(Z, Y, L)


def line_admittance(Z, Y, L):
    lam, Ti = np.linalg.eig(Y @ Z)
    g = np.sqrt(lam)
    g = np.where(g.real < 0, -g, g)
    Tinv = np.linalg.inv(Ti)
    Zi = np.linalg.inv(Z)
    gl = g * L
    Ys = Ti @ np.diag(g / np.tanh(gl)) @ Tinv @ Zi
    Ym = -Ti @ np.diag(g / np.sinh(gl)) @ Tinv @ Zi
    return np.block([[Ys, Ym], [Ym, Ys]])


def model_admittance(model, s):
    """The nodal admittance that a CP or FD model represents at s = jω (to compare a model with the exact line)."""
    Ti = np.array(model['Ti'])
    M = len(Ti)
    Ys = np.zeros((M, M), complex)
    Ym = np.zeros((M, M), complex)
    for k, m in enumerate(model['modes']):
        if model['type'] != 'fd':
            return _cp_y(model, s)
        zc = rational([s], m['zc']['d'], m['zc']['r'], m['zc']['p'])[0]
        a = rational([s], 0, m['a']['r'], m['a']['p'])[0] * cmath.exp(-s * m['tau'])
        yk = 1 / zc
        Ys[k, k] = yk * (1 + a * a) / (1 - a * a)
        Ym[k, k] = -yk * 2 * a / (1 - a * a)
    # i = T_i·i_mode and v_mode = T_iᵀ·v, so Y_phase = T_i·Y_mode·T_iᵀ
    return np.block([[Ti @ Ys @ Ti.T, Ti @ Ym @ Ti.T], [Ti @ Ym @ Ti.T, Ti @ Ys @ Ti.T]])


# ---------------------------------------------------------------- numerical Laplace transform
def nlt_solve(network, tmax, n=4096, window='hanning'):
    """Time response of a linear network with lines, by the numerical Laplace transform (modified Fourier
    transform with odd sampling, damping c = ln(n²)/T, window over the frequencies). The window T = 2·tmax keeps the
    wrap-around out of the result. network = {'nodes': N, 'el': [...]} with nodes 1…N (0 = ground) and elements
      ('R', a, b, R), ('L', a, b, L), ('C', a, b, C),
      ('V', a, b, Rs, src) a source behind Rs, src: ('step', V, t0) | ('ramp', V, tr) | ('cos', V, w, phi) |
                                                 ('dexp', V, alpha, beta),
      ('LINE', [ends 1], [ends 2], data, kind) kind 'exact' (the line data) or a model dict (CP/FD as fitted),
    and returns (t, V) with V[node − 1] over t."""
    T = 2.0 * tmax
    dt = T / n
    dw = 2 * math.pi / T
    c = math.log(n * n) / T
    k = np.arange(n)
    w = (k + 0.5) * dw
    s = c + 1j * w
    N = network['nodes']
    Vs = np.zeros((n, N), complex)
    cache = {}
    for i in range(n):
        Yn = np.zeros((N, N), complex)
        I = np.zeros(N, complex)

        def stamp(a, b, y):
            if a:
                Yn[a - 1, a - 1] += y
            if b:
                Yn[b - 1, b - 1] += y
            if a and b:
                Yn[a - 1, b - 1] -= y
                Yn[b - 1, a - 1] -= y

        si = s[i]
        for e in network['el']:
            t = e[0]
            if t == 'R':
                stamp(e[1], e[2], 1 / e[3])
            elif t == 'L':
                stamp(e[1], e[2], 1 / (si * e[3]))
            elif t == 'C':
                stamp(e[1], e[2], si * e[3])
            elif t == 'V':
                a, b, Rs, src = e[1], e[2], e[3], e[4]
                stamp(a, b, 1 / Rs)
                v = _src_laplace(src, si)
                if a:
                    I[a - 1] += v / Rs
                if b:
                    I[b - 1] -= v / Rs
            elif t == 'LINE':
                n1, n2, data, kind = e[1], e[2], e[3], e[4]
                Yl = _line_y(data, kind, si, cache)
                nodes = list(n1) + list(n2)
                for p, a in enumerate(nodes):
                    for q, b in enumerate(nodes):
                        if a and b:
                            Yn[a - 1, b - 1] += Yl[p, q]
        Vs[i] = np.linalg.solve(Yn, I)
    sig = 0.5 * (1 + np.cos(math.pi * (k + 0.5) / n)) if window == 'hanning' else np.ones(n)
    tn = np.arange(n) * dt
    out = np.zeros((N, n))
    for j in range(N):
        z = np.fft.ifft(Vs[:, j] * sig) * n
        out[j] = (dw / math.pi) * np.exp(c * tn) * (np.exp(1j * math.pi * np.arange(n) / n) * z).real
    keep = tn <= tmax + 1e-15
    return tn[keep], out[:, keep]


def _src_laplace(src, s):
    kind = src[0]
    if kind == 'step':
        return src[1] * cmath.exp(-s * src[2]) / s
    if kind == 'ramp':
        V, tr = src[1], src[2]
        return V * (1 - cmath.exp(-s * tr)) / (tr * s * s)
    if kind == 'cos':
        V, w, ph = src[1], src[2], src[3]
        return V * (s * math.cos(ph) - w * math.sin(ph)) / (s * s + w * w)
    if kind == 'dexp':
        V, a, b = src[1], src[2], src[3]
        return V * (1 / (s + a) - 1 / (s + b))
    raise LineError(f'άγνωστη πηγή {kind}')


def _line_y(data, kind, s, cache):
    """Nodal admittance of a line at the complex frequency s: 'exact' from Z′(s), Y′(s) of the line data (Bessel,
    Deri or Carson's integral at the complex s, exact complex eigenvectors), or a CP/FD model as fitted."""
    if kind == 'exact':
        Z, Y = phase_matrices(data, s=s)
        L = _f(data.get('length'), 1.0) * 1000.0
        return line_admittance(Z, Y, L)
    if kind.get('type') == 'cp':
        return _cp_y(kind, s)
    return model_admittance(kind, s)


def _cp_y(model, s):
    """The CP model in the s domain: per mode a lossless line of Z_c, τ with R/4, R/2, R/4 (two halves of τ/2)."""
    Ti = np.array(model['Ti'])
    M = len(Ti)
    Ys = np.zeros((M, M), complex)
    Ym = np.zeros((M, M), complex)
    for k, m in enumerate(model['modes']):
        Zc, tau, R = m['Zc'], m['tau'], m['R']
        h = _half(Zc, tau / 2, s)
        # chain: R/4 – half – R/2 – half – R/4 with ABCD matrices
        def ser(r):
            return np.array([[1, r], [0, 1]], complex)
        Mx = ser(R / 4) @ h @ ser(R / 2) @ h @ ser(R / 4)
        A, B, C, D = Mx[0, 0], Mx[0, 1], Mx[1, 0], Mx[1, 1]
        Ys[k, k] = D / B
        Ym[k, k] = -1 / B
    # i = T_i·i_mode and v_mode = T_iᵀ·v, so Y_phase = T_i·Y_mode·T_iᵀ
    return np.block([[Ti @ Ys @ Ti.T, Ti @ Ym @ Ti.T], [Ti @ Ym @ Ti.T, Ti @ Ys @ Ti.T]])


def _half(Zc, tau, s):
    x = s * tau
    return np.array([[cmath.cosh(x), Zc * cmath.sinh(x)], [cmath.sinh(x) / Zc, cmath.cosh(x)]], complex)


# ---------------------------------------------------------------- data files and typical lines
def load_data(path):
    with open(path, encoding='utf-8') as fh:
        return json.load(fh)


def save_data(data, path):
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)


# typical Greek transmission lines (single circuit): conductor data of the usual ACSR (Grosbeak, Cardinal) and of the
# steel ground wires, tower heads of the usual suspension towers, ruling span 350 m with the sag at 20 °C
TYPICAL = {
    '150kV': {'name': 'Τυπική γραμμή 150 kV, απλό κύκλωμα (ACSR 636 MCM)', 'rho': 100, 'length': 50, 'earth': 'carson',
              'skin': True,
              'wires': [{'ph': 0, 'x': -4.25, 'y': 23.81, 'ymid': 14.01, 'r': 0.4765, 'Rdc': 3.4617, 'tD': 0.5},
                        {'ph': 0, 'x': 4.25, 'y': 23.81, 'ymid': 14.01, 'r': 0.4765, 'Rdc': 3.4617, 'tD': 0.5},
                        {'ph': 1, 'x': -6.28, 'y': 19.95, 'ymid': 10.15, 'r': 1.2575, 'Rdc': 0.0877, 'tD': 0.3157},
                        {'ph': 2, 'x': 0.0, 'y': 19.95, 'ymid': 10.15, 'r': 1.2575, 'Rdc': 0.0877, 'tD': 0.3157},
                        {'ph': 3, 'x': 6.28, 'y': 19.95, 'ymid': 10.15, 'r': 1.2575, 'Rdc': 0.0877, 'tD': 0.3157}]},
    '400kV': {'name': 'Τυπική γραμμή 400 kV, απλό κύκλωμα (2 × ACSR 954 MCM)', 'rho': 100, 'length': 100,
              'earth': 'carson', 'skin': True,
              'wires': [{'ph': 0, 'x': -6.1, 'y': 27.15, 'ymid': 18.35, 'r': 0.63, 'Rdc': 2.0276, 'tD': 0.5},
                        {'ph': 0, 'x': 6.1, 'y': 27.15, 'ymid': 18.35, 'r': 0.63, 'Rdc': 2.0276, 'tD': 0.5}],
              'bundles': [{'ph': 1, 'x': -8.6, 'y': 20, 'ymid': 11.2, 'n': 2, 'R': 20, 'ang': 0, 'r': 1.521,
                           'Rdc': 0.0587, 'tD': 0.3335},
                          {'ph': 2, 'x': 0.0, 'y': 20, 'ymid': 11.2, 'n': 2, 'R': 20, 'ang': 0, 'r': 1.521,
                           'Rdc': 0.0587, 'tD': 0.3335},
                          {'ph': 3, 'x': 8.6, 'y': 20, 'ymid': 11.2, 'n': 2, 'R': 20, 'ang': 0, 'r': 1.521,
                           'Rdc': 0.0587, 'tD': 0.3335}]},
}


def _sc(x, y, ph, core, ins1, sheath, ins2, rho_c=1.72e-8, rho_s=2.8e-8, eps1=2.3, eps2=2.3):
    return {'x': x, 'y': y, 'ph': ph,
            'layers': [{'t': 'c', 'rin': 0, 'rout': core, 'rho': rho_c}, {'t': 'i', 'rout': ins1, 'epsr': eps1, 'tand': 4e-4},
                       {'t': 'c', 'rin': ins1, 'rout': sheath, 'rho': rho_s}, {'t': 'i', 'rout': ins2, 'epsr': eps2}]}


# typical single-core XLPE cables (radii in m): a 220 kV submarine cable (copper core, lead sheath, sea water) and a
# 150 kV land cable (copper core, copper screen as an equivalent tube, flat formation at 1.2 m)
TYPICAL.update({
    '220kV-sea': {'name': 'Τυπικό υποβρύχιο καλώδιο 220 kV (3 μονοπολικά XLPE, θάλασσα)', 'medium': 'sea', 'rho': 0.2,
                  'length': 30, 'cables': [_sc(x, 30, [k + 1, 0], 0.0256, 0.0550, 0.0575, 0.0850, 1.7e-8, 2.8e-8)
                                           for k, x in enumerate((-1.0, 0.0, 1.0))]},
    '150kV-land': {'name': 'Τυπικό υπόγειο καλώδιο 150 kV (3 μονοπολικά XLPE 1000 mm², επίπεδη διάταξη)', 'medium': 'earth',
                   'rho': 100, 'length': 10, 'cables': [_sc(x, 1.2, [k + 1, 0], 0.0189, 0.0380, 0.0384, 0.0480, 1.93e-8,
                                                            1.72e-8, 2.5, 2.3) for k, x in enumerate((-0.25, 0.0, 0.25))]},
})


def typical(key):
    return json.loads(json.dumps(TYPICAL[key]))


# ---------------------------------------------------------------- the server action (/api/line_model)
def api(req):
    """{data, model ('cp'|'fd'), len (km), f (CP), fmin, dec, ppd, fti (FD), src} → {mdl, report, curves}: the model the
    solver uses (with src, the key of what it was computed from), the report at f (CP) or 50 Hz, and for FD the fit."""
    data = req.get('data')
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except ValueError:
            raise LineError('τα δεδομένα της γραμμής δεν είναι JSON')
    if not isinstance(data, dict):
        raise LineError('λείπουν τα δεδομένα της γραμμής')
    L = _f(req.get('len'), _f(data.get('length'), 1.0))
    if not L > 0:
        raise LineError('το μήκος πρέπει να είναι θετικό')
    kind = 'fd' if req.get('model') == 'fd' else 'cp'
    if kind == 'cp':
        f = _f(req.get('f'), 50.0)
        if not f > 0:
            raise LineError('η συχνότητα πρέπει να είναι θετική')
        mdl = cp_model(data, f, L)
        curves = None
        frep = f
    else:
        fmin, dec, ppd = _f(req.get('fmin'), 0.01), _f(req.get('dec'), 9), _f(req.get('ppd'), 10)
        if not (fmin > 0 and 1 <= dec <= 12 and 2 <= ppd <= 40):
            raise LineError('εύρος: f_min > 0, 1–12 δεκάδες, 2–40 σημεία ανά δεκάδα')
        mdl = fd_model(data, L, fmin, dec, ppd, _f(req.get('fti'), 1000.0), curves=True)
        curves = {'f': mdl.pop('f'), 'modes': [m.pop('curve') for m in mdl['modes']]}
        frep = 50.0
    mdl['src'] = req.get('src', '')
    return {'mdl': mdl, 'report': report(data, frep), 'curves': curves,
            'conductors': [] if data.get('cables') else conductors(data)}
