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
        q = r * (1 - 2 * tD)
        if w.get('Rdc') in (None, '') and w.get('rho') not in (None, ''):     # 4.11: resistivity instead of R_dc
            Rdc = _f(w.get('rho')) / (math.pi * (r * r - q * q))
        else:
            Rdc = _f(w.get('Rdc')) / 1000.0
        if Rdc <= 0:
            raise LineError('η αντίσταση dc πρέπει να είναι θετική')
        c = {'ph': int(_f(w.get('ph'), 1)), 'x': x, 'h': h, 'r': r, 'q': q, 'Rdc': Rdc, 'mur': _f(w.get('mur'), 1.0),
             'ht': y, 'hm': y if ymid in (None, '') else _f(ymid)}
        if w.get('dL') not in (None, ''):          # 4.11: an extra internal inductance (mH/km), used by `rebuild`
            c['dL'] = _f(w.get('dL')) * 1e-6
        zi = _zi_opts(w, c)
        if zi:
            c['zi'] = zi
        out.append(c)

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


# 4.11: the other models of the internal impedance of the EMTP LINE CONSTANTS (IXTYPE, line_constants §4.5; Dommel
# §4.1.1.1 and Appendix VII): Galloway–Wedepohl for stranded conductors, GMR, GMR/r, reactance at unit spacing
ZI_KINDS = ('tube', 'gw', 'gmr', 'gmrr', 'xu')


def _zi_opts(w, c):
    """The model of the internal impedance of one conductor ('zi' in the data): None for the tube (Bessel, the default),
    or a dict with what the other models need, in SI."""
    kind = w.get('zi') or 'tube'
    if kind not in ZI_KINDS:
        raise LineError(f'άγνωστο μοντέλο εσωτερικής εμπέδησης «{kind}»')
    if kind == 'tube':
        return None
    if kind == 'gw':
        n = int(_f(w.get('ns')))
        if n < 3:
            raise LineError('Galloway–Wedepohl: χρειάζεται το πλήθος των εξωτερικών συρμάτων (≥ 3)')
        r = c['r']
        rs = _f(w.get('rs'), 0.0) / 100.0 or r / (1.0 + 1.0 / math.sin(math.pi / n))   # n strands touching on a circle
        rho = _f(w.get('rho'), 0.0) or c['Rdc'] * math.pi * (r * r - c['q'] * c['q'])
        return {'kind': 'gw', 'n': n, 'rs': rs, 'rho': rho, 'mus': _f(w.get('mus'), c['mur'])}
    if kind == 'gmr':
        g = _f(w.get('gmr')) / 100.0
    elif kind == 'gmrr':
        g = _f(w.get('gmrr')) * c['r']
    else:
        X, fx = _f(w.get('xu')) / 1000.0, _f(w.get('fx'), 50.0)      # Ω/km at 1 m spacing → Ω/m
        if not fx > 0:
            raise LineError('η συχνότητα της αντίδρασης μοναδιαίας απόστασης πρέπει να είναι θετική')
        g = math.exp(-X / (2 * math.pi * fx * MU0 / (2 * math.pi)))
        if (w.get('xmode') or 'L') == 'X':
            return {'kind': 'xu', 'X': X, 'gmr': g}
    if not 0 < g <= c['r']:
        raise LineError('η GMR πρέπει να είναι θετική και όχι μεγαλύτερη από την ακτίνα')
    return {'kind': 'gmr', 'gmr': g}


GW_K = 2.25          # Galloway et al. 1964 §2.2.3 (electrolytic tank), Dommel eq. VII.1


def z_galloway(s, n, rs, rho, mur=1.0):
    """Galloway–Wedepohl surface impedance of a stranded conductor (Ω/m): K·m·ρ/(r_s·(n + 2)·π), m = √(sμ₀μ_r/ρ),
    n outer strands of radius r_s (R = ωL = 2.25·√(ωμ₀μ_rρ)/(r_s·π·(2 + n)·√2) at s = jω, Dommel eq. VII.1)."""
    m = cmath.sqrt(complex(s) * MU0 * mur / rho)
    return GW_K * m * rho / (rs * (n + 2) * math.pi)


def z_int(c, s, skin=True):
    """Internal impedance (Ω/m) of a conductor of `conductors()` at the complex frequency s, with its model."""
    zi = c.get('zi')
    if not zi:
        return z_internal(0, c['r'], c['q'], c['Rdc'], c['mur'], skin, s)
    s = complex(s)
    if zi['kind'] == 'gmr':
        return c['Rdc'] + s * MU0 / (2 * math.pi) * math.log(c['r'] / zi['gmr'])
    if zi['kind'] == 'xu':          # constant reactance at unit spacing: the GMR follows the frequency (jω only)
        w = abs(s.imag) or 1.0
        g = math.exp(-zi['X'] / (w * MU0 / (2 * math.pi)))
        return c['Rdc'] + s * MU0 / (2 * math.pi) * math.log(c['r'] / g)
    if not skin or s == 0:
        return z_internal(0, c['r'], c['q'], c['Rdc'], c['mur'], False, s)
    # the formula is for frequencies where the current is at the surface (above 2–5 kHz); R_dc at low frequencies,
    # joined smoothly: √(R_dc² + z_GW²) (our choice, analytic in the right half-plane)
    zg = z_galloway(s, zi['n'], zi['rs'], zi['rho'], zi['mus'])
    z = cmath.sqrt(c['Rdc'] ** 2 + zg * zg)
    return z if z.real >= 0 else -z


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


# ---------------------------------------------------------------- 4.11: layered earth, μ_r of the earth
# A stratified earth as layers from the surface down, each with ρ, μ_r and a thickness (the last one infinite). The
# vector potential of a line current is written as a Fourier integral over λ (the wavenumber along x); in each layer
# A ∝ e^(±u·z) with u = √(λ² + sμ₀μ_r/ρ), and A and (1/μ_r)·∂A/∂z are continuous at each boundary. Seen from above, the
# whole stack is one "admittance" W(λ): W = ζ_N for the bottom layer, W_i = ζ_i·(W_{i+1} + ζ_i·t)/(ζ_i + W_{i+1}·t),
# t = tanh(u_i·d_i), ζ = u/μ_r. One layer with μ_r = 1 gives W = u and Carson's integral (Sunde; Nakagawa–Iwamoto 1976).

def soil_layers(data):
    """The earth of the line data as layers [{rho, mur, d}] (the last d infinite), or None for the homogeneous
    non-magnetic earth of 4.4–4.5 (Carson's series, Pollaczek), which keeps its own, faster formulas.
    Keys: rho (Ω·m, top layer), rho2 and dsoil (m, thickness of the top layer) for two layers, mur_e (μ_r of the earth),
    or soil = [{rho, d, mur}, …] for any number of layers."""
    if data.get('soil'):
        L = [{'rho': _f(q.get('rho')), 'mur': _f(q.get('mur'), 1.0), 'd': _f(q.get('d'), math.inf)} for q in data['soil']]
    else:
        rho = _f(data.get('rho'), 100.0)
        mu = _f(data.get('mur_e'), 1.0)
        L = [{'rho': rho, 'mur': mu, 'd': math.inf}]
        if data.get('rho2') not in (None, '') and data.get('dsoil') not in (None, ''):
            d = _f(data.get('dsoil'))
            if not d > 0:
                raise LineError('το πάχος του πάνω στρώματος του εδάφους πρέπει να είναι θετικό')
            L[0]['d'] = d
            L.append({'rho': _f(data.get('rho2')), 'mur': mu, 'd': math.inf})
    for q in L:
        if not q['rho'] > 0 or not q['mur'] > 0:
            raise LineError('η ειδική αντίσταση και το μ_r του εδάφους πρέπει να είναι θετικά')
    for q in L[:-1]:
        if not 0 < q['d'] < math.inf:
            raise LineError('κάθε στρώμα του εδάφους εκτός από το τελευταίο θέλει πεπερασμένο πάχος')
    L[-1]['d'] = math.inf
    if len(L) == 1 and L[0]['mur'] == 1.0:
        return None
    return L


def _tanh(z):
    e = cmath.exp(-2 * z)
    return (1 - e) / (1 + e)


def _soil_w(lam, s, L, top=0):
    """W(λ) of the layers top… seen from above their top boundary, and the u, ζ of every layer."""
    us = [cmath.sqrt(lam * lam + s * MU0 * q['mur'] / q['rho']) for q in L]
    zs = [u / q['mur'] for u, q in zip(us, L)]
    W = zs[-1]
    for i in range(len(L) - 2, top - 1, -1):
        t = _tanh(us[i] * L[i]['d'])
        W = zs[i] * (W + zs[i] * t) / (zs[i] + W * t)
    return W, us, zs


def _cosint(g, x, decay, mmax, rel=1e-11, absol=1e-13):
    """∫₀^∞ g(λ)·cos(λx) dλ for a complex g that decays like e^(−decay·λ): plain adaptive quadrature up to c (where g
    changes fast, near λ ≈ |m|), the tail with the cosine as the weight of QUADPACK (QAWO), as `pollaczek`."""
    from scipy.integrate import quad
    lim = 40.0 / max(decay, 1e-9) + 40.0 * mmax
    c = min(lim, 50.0 * mmax) if mmax > 0 else 0.0
    tol = {'epsabs': absol, 'epsrel': rel}

    def part(fn):
        v = quad(lambda a: fn(g(a)) * math.cos(a * x), 0, c, limit=400, **tol)[0] if c > 0 else 0.0
        if lim > c:
            kw = {'weight': 'cos', 'wvar': x} if x > 0 else {}
            v += quad(lambda a: fn(g(a)), c, lim, limit=800, **tol, **kw)[0]
        return v

    return complex(part(lambda z: z.real), part(lambda z: z.imag))


def earth_overhead(hi, hk, x, s, soil):
    """Earth-return correction ΔZ (Ω/m) between two conductors in the air at heights h_i, h_k, horizontal distance x,
    over layered earth: (sμ₀/π)·∫₀^∞ e^(−(h_i+h_k)λ)·cos(xλ)/(λ + W(λ)) dλ (Carson's integral with W = u for one layer)."""
    s = complex(s)
    H = hi + hk

    def g(lam):
        return cmath.exp(-H * lam) / (lam + _soil_w(lam, s, soil)[0])

    mmax = max(abs(cmath.sqrt(s * MU0 * q['mur'] / q['rho'])) for q in soil)
    return s * MU0 / math.pi * _cosint(g, abs(x), H, min(mmax, 60.0 / H), rel=1e-12, absol=0)


def _layer_of(z, soil):
    top = 0.0
    for i, q in enumerate(soil):
        if z < top + q['d']:
            return i, top
        top += q['d']
    return len(soil) - 1, top


def earth_buried(s, h, y, x, soil, d=None):
    """Earth-return impedance (Ω/m) between the outer loops of two buried conductors at depths h and y, horizontal
    distance x, in an earth of one or two layers (each with ρ, μ_r): the direct field μ_rμ₀·K₀(m·r)/2π in the layer of
    the source and the reflections at the surface and at the boundary, Γ_s = (ζ₁ − λ)/(ζ₁ + λ), Γ_b = (ζ₁ − ζ₂)/(ζ₁ + ζ₂),
    from the Fourier integral (THEORY §8ι). One layer with μ_r = 1 is Pollaczek's formula. Self: d = R, x = R, y = h."""
    from scipy.special import kve
    s = complex(s)
    if len(soil) > 2:
        raise LineError('καλώδια σε έδαφος με περισσότερα από δύο στρώματα δεν υποστηρίζονται ακόμη')
    if h > y:
        h, y = y, h
    li, _ = _layer_of(h, soil)
    lk, _ = _layer_of(y, soil)
    m = [cmath.sqrt(s * MU0 * q['mur'] / q['rho']) for q in soil]
    mmax = max(abs(v) for v in m)
    r = math.hypot(x, h - y) if d is None else d
    k = s * MU0 / (2 * math.pi)

    def K0(z):
        return kve(0, z) * cmath.exp(-z)

    if len(soil) == 1:
        mu = soil[0]['mur']

        def g(lam):
            u = cmath.sqrt(lam * lam + m[0] * m[0])
            z1 = u / mu
            return (z1 - lam) / (z1 + lam) * cmath.exp(-u * (h + y)) / u

        return k * mu * (K0(m[0] * r) + _cosint(g, x, h + y, mmax))
    D = soil[0]['d']
    for zz in (h, y):
        if abs(zz - D) < 1e-6:
            raise LineError('ένα καλώδιο δεν μπορεί να είναι πάνω στο όριο δύο στρωμάτων του εδάφους')
    mu1, mu2 = soil[0]['mur'], soil[1]['mur']

    def parts(lam):
        u1 = cmath.sqrt(lam * lam + m[0] * m[0])
        u2 = cmath.sqrt(lam * lam + m[1] * m[1])
        z1, z2 = u1 / mu1, u2 / mu2
        Gs = (z1 - lam) / (z1 + lam)
        Gb = (z1 - z2) / (z1 + z2)
        e2 = cmath.exp(-2 * u1 * D)
        return u1, u2, z1, z2, Gs, Gb, e2

    if li == 0 and lk == 0:
        def g(lam):
            u1, u2, z1, z2, Gs, Gb, e2 = parts(lam)
            num = (Gs * cmath.exp(-u1 * (h + y)) + Gb * cmath.exp(-u1 * (2 * D - h - y))
                   + Gs * Gb * (cmath.exp(-u1 * (2 * D - h + y)) + cmath.exp(-u1 * (2 * D + h - y))))
            return num / (1 - Gs * Gb * e2) / u1

        return k * mu1 * (K0(m[0] * r) + _cosint(g, x, min(h + y, 2 * D - h - y), mmax))
    if li == 0 and lk == 1:
        def g(lam):
            u1, u2, z1, z2, Gs, Gb, e2 = parts(lam)
            return (2 / (z1 + z2) * (cmath.exp(-u1 * (D - h)) + Gs * cmath.exp(-u1 * (D + h)))
                    * cmath.exp(-u2 * (y - D)) / (1 - Gs * Gb * e2))

        return k * _cosint(g, x, (D - h) + (y - D), mmax)

    def g(lam):
        u1, u2, z1, z2, Gs, Gb, e2 = parts(lam)
        W1 = z1 * (1 - Gs * e2) / (1 + Gs * e2)
        return (z2 - W1) / (z2 + W1) * cmath.exp(-u2 * (h + y - 2 * D)) / u2

    return k * mu2 * (K0(m[1] * r) + _cosint(g, x, h + y - 2 * D, mmax))


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
        lay = _merge_semi(c.get('layers') or [], n)
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
        if conds[-1]['ins'] is None and conds[-1]['ph'] != 0 and y >= 0:     # in the air (4.11) it may be a phase
            raise LineError(f'καλώδιο {n + 1}: ο εξωτερικός αγωγός χωρίς μόνωση ακουμπά στο μέσο: φάση 0')
        out.append({'x': x, 'y': y, 'conds': conds, 'R': r})
    for i, a in enumerate(out):
        for b in out[i + 1:]:
            if math.hypot(a['x'] - b['x'], a['y'] - b['y']) < a['R'] + b['R'] - 1e-12:
                raise LineError('δύο καλώδια επικαλύπτονται')
    return out


def _merge_semi(lay, n):
    """4.11: semiconducting screens ('s' layers, only the outer radius) are merged into the insulation they touch, with
    its ε_r raised so that the capacitance of the whole gap stays that of the insulation alone:
    ε′ = ε_r·ln(R_o/R_i)/ln(b/a), (R_i, R_o) the gap between the conductors, (a, b) the insulation itself
    (Line/Cable Data §2.3.1.2; Gustavsen et al., Part II, eq. 5). The screens add no longitudinal conduction."""
    if not any((L.get('t') or 'c') == 's' for L in lay):
        return lay
    out, r, i = [], 0.0, 0
    while i < len(lay):
        L = lay[i]
        t = L.get('t') or 'c'
        if t == 'c':
            out.append(L)
            r = _f(L.get('rout'))
            i += 1
            continue
        j, ins, Ri = i, None, r
        while j < len(lay) and (lay[j].get('t') or 'c') in ('s', 'i'):
            if (lay[j].get('t') or 'c') == 'i':
                if ins is not None:
                    raise LineError(f'καλώδιο {n + 1}: δύο μονώσεις στη σειρά· ένωσέ τες σε μία')
                ins = (j, r)
            r = _f(lay[j].get('rout'))
            j += 1
        if ins is None:
            raise LineError(f'καλώδιο {n + 1}: ένα ημιαγώγιμο στρώμα χρειάζεται μόνωση δίπλα του')
        L = dict(lay[ins[0]])
        a, b = ins[1], _f(L.get('rout'))
        if not (Ri < r and a < b):
            raise LineError(f'καλώδιο {n + 1}: οι ακτίνες των στρωμάτων πρέπει να αυξάνουν')
        L['epsr'] = _f(L.get('epsr'), 1.0) * math.log(r / Ri) / math.log(b / a) if Ri > 0 else _f(L.get('epsr'), 1.0)
        L['rout'] = r
        out.append(L)
        i = j
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
    soil = soil_layers(data) if medium == 'earth' else None
    air = [c['y'] < 0 for c in cbs]          # 4.11: a negative depth is a height above the ground
    if any(air) and not all(air):
        raise LineError('καλώδια στον αέρα και θαμμένα στο ίδιο σύστημα δεν υποστηρίζονται ακόμη')
    air = bool(air) and air[0]
    if air and medium != 'earth':
        raise LineError('καλώδια πάνω από το έδαφος: μόνο με μέσο «έδαφος»')
    for c in cbs:
        if not air and medium == 'earth' and c['y'] <= c['R']:
            raise LineError('ένα θαμμένο καλώδιο πρέπει να είναι ολόκληρο κάτω από την επιφάνεια')
        if air and -c['y'] <= c['R']:
            raise LineError('ένα καλώδιο στον αέρα πρέπει να είναι ολόκληρο πάνω από το έδαφος')
    loss = data.get('loss') or 'causal'
    fg0 = _f(data.get('fg0'), 100.0)
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
                Yl[k] = _ins_y(s, Cp, ins['tand'], loss, fg0)
            else:
                Yl[k] = np.inf
            if k + 1 < N:
                nx = c['conds'][k + 1]
                zin, _, zmut = tube(s, nx['rin'], nx['rout'], nx['rho'], nx['mur'])
                Zl[k, k] += zin
                Zl[k, k + 1] = Zl[k + 1, k] = -zmut
        if air:                            # the outer loop is an overhead conductor of radius R at the height −y
            Zl[N - 1, N - 1] += _air_z(s, -c['y'], -c['y'], 0.0, c['R'], rho, soil, data)
            Yl[N - 1] = 0.0                # the shunt of the outer conductors comes from the potential coefficients
        elif medium == 'sea':
            Zl[N - 1, N - 1] += sea_return(s, c['R'], c['R'], 0, rho)
        elif medium == 'perfect':
            pass
        elif soil:
            Zl[N - 1, N - 1] += earth_buried(s, c['y'], c['y'], c['R'], soil, d=c['R'])
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
            if air:
                zm = _air_z(s, -a['y'], -b['y'], abs(dx), d, rho, soil, data)
            elif medium == 'sea':
                zm = sea_return(s, a['R'], b['R'], d, rho)
            elif medium == 'perfect':
                zm = 0j
            elif soil:
                zm = earth_buried(s, a['y'], b['y'], abs(dx), soil)
            else:
                zm = pollaczek(s, a['y'], b['y'], abs(dx), rho)
            Ni, Nj = len(a['conds']), len(b['conds'])
            Z[o[i]:o[i] + Ni, o[j]:o[j] + Nj] = zm   # only the outer loops couple: every conductor pair sees it
            Z[o[j]:o[j] + Nj, o[i]:o[i] + Ni] = zm
    if air:                                # potential coefficients of the outer conductors: jacket + air with images
        nc = len(cbs)
        P = np.zeros((nc, nc), complex)
        for i, a in enumerate(cbs):
            out_c = a['conds'][-1]
            ins = out_c['ins']
            P[i, i] = math.log(2 * -a['y'] / a['R']) / (2 * math.pi * EPS0)
            if ins:
                eps = ins['epsr'] * _ins_y(s, 1.0, ins['tand'], loss, fg0) / s if s != 0 else ins['epsr']
                P[i, i] += math.log(ins['rout'] / ins['rin']) / (2 * math.pi * EPS0 * eps)
            for j, b in enumerate(cbs):
                if j > i:
                    dx = a['x'] - b['x']
                    P[i, j] = P[j, i] = math.log(math.hypot(dx, a['y'] + b['y']) / math.hypot(dx, a['y'] - b['y'])) / (2 * math.pi * EPS0)
        Ya = s * np.linalg.inv(P)
        idx = [o[i] + len(c['conds']) - 1 for i, c in enumerate(cbs)]
        Y[np.ix_(idx, idx)] += Ya
    return Z, Y, cs


def _ins_y(s, C, tand, loss='causal', fg0=100.0):
    """Shunt admittance of an insulation of capacitance C (per metre) with the loss tangent tanδ: the causal wideband
    model (4.5, default), a constant tanδ (Y = sC + |ω|·C·tanδ), or the old Cable Data G = 2π(f_G0 + f)·tanδ·C
    (cable_constants §3.4; f_G0 = 100 Hz)."""
    if not tand or loss == 'causal':
        return s * C * permittivity(s, 1.0, tand) if tand else s * C
    w = abs(complex(s).imag)
    if loss == 'const':
        return s * C + w * C * tand
    if loss == 'fg0':
        return s * C + 2 * math.pi * (fg0 + w / (2 * math.pi)) * tand * C
    raise LineError(f'άγνωστο μοντέλο απωλειών μόνωσης «{loss}»')


def _air_z(s, hi, hk, x, d, rho, soil, data):
    """Self (d = R, x = 0, hi = hk) or mutual impedance of two outer loops in the air, as overhead conductors:
    sμ₀/2π·ln(D/d) + the earth correction (Carson's series at s = jω, his integral otherwise, or the layered earth)."""
    D = math.hypot(x, hi + hk)
    z = s * MU0 / (2 * math.pi) * math.log(D / d)
    if s == 0:
        return z
    if soil:
        return z + earth_overhead(hi, hk, x, s, soil)
    if s.real == 0 and (data.get('earth') or 'carson') == 'carson':
        return z + carson_series(D, math.asin(min(1.0, x / D)), s.imag / (2 * math.pi), rho)
    return z + carson_integral(hi, hk, x, 0, rho, s=s)


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
    soil = soil_layers(data)
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
                if s != 0 and soil and earth in ('carson', 'integral'):
                    z += earth_overhead(a['h'], b['h'], a['x'] - b['x'], s, soil)
                elif s != 0 and earth == 'carson' and imag:
                    z += carson_series(D, ph, s.imag / (2 * math.pi), rho)
                elif s != 0 and earth in ('carson', 'integral'):
                    z += carson_integral(a['h'], b['h'], a['x'] - b['x'], 0, rho, s=s)
            if i == k:
                z += z_int(a, s, skin) + s * a.get('dL', 0.0)
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


def reduce_phases(Z, P, cs, iseg=False):
    """Phase matrices after bundling (equal voltage, summed currents) and the elimination of the ground wires (zero
    voltage): Y_s = Z⁻¹ and C = P⁻¹ summed per phase, then inverted back (exact for any geometry). With segmented
    ground wires (iseg, 4.11) they carry no current: they leave [Z] out, but stay at zero potential in [C] (Dommel
    §4.1.2.5 b; LINE CONSTANTS ISEG)."""
    T = _groups(cs)
    if iseg:
        keep = [i for i, c in enumerate(cs) if c['ph'] > 0]
        Zr = np.linalg.inv(T[keep].T @ np.linalg.inv(Z[np.ix_(keep, keep)]) @ T[keep])
    else:
        Zr = np.linalg.inv(T.T @ np.linalg.inv(Z) @ T)
    Pr = np.linalg.inv(T.T @ np.linalg.inv(P) @ T)
    return Zr, Pr


def _gdiag(data, M, default):
    """The shunt conductance of the phases (S/m): a number for all, or a list per phase (S/km; an empty entry is the
    default) as .GPHASE of LINE CONSTANTS."""
    g = data.get('G')
    if isinstance(g, (list, tuple)):
        if len(g) != M:
            raise LineError(f'το G ανά φάση θέλει {M} τιμές')
        return np.diag([_f(v, default) / 1000.0 for v in g])
    return _f(g, default) / 1000.0 * np.eye(M)


def transposition(data, M):
    """The transposition of the line data as [(fraction of the length, permutation)], or None. data['transp'] =
    {'len': [km…], 'order': [[phase carried by position 1, 2, …], …]} (as .TRANSP: the lengths add up to the line)."""
    t = data.get('transp')
    if not t or not t.get('order'):
        return None
    order = [[int(_f(v)) for v in o] for o in t['order']]
    lens = [_f(v) for v in (t.get('len') or [1.0] * len(order))]
    if len(lens) != len(order) or any(not v > 0 for v in lens):
        raise LineError('μεταθέσεις: ένα θετικό μήκος για κάθε τμήμα')
    for o in order:
        if sorted(o) != list(range(1, M + 1)):
            raise LineError(f'μεταθέσεις: κάθε τμήμα θέλει τη σειρά των φάσεων 1…{M} (μετάθεση)')
    tot = sum(lens)
    out = []
    for L, o in zip(lens, order):
        P = np.zeros((M, M))
        for pos, ph in enumerate(o):
            P[ph - 1, pos] = 1.0          # the electrical phase ph is at the geometric position pos
        out.append((L / tot, P))
    return out


def transpose_avg(A, tr):
    """The average of a phase matrix over the transposition sections, weighted by their length."""
    return sum(w * P @ A @ P.T for w, P in tr)


def phase_matrices(data, f=None, s=None, **kw):
    """Reduced Z′ (Ω/m) and Y′ = G′ + sC′ (S/m) of the M phases at the frequency f (or the complex frequency s).
    Cables (4.5): Y′ of the insulations (with tanδ), reduced the same way, and G′ only when the data give it."""
    s = 2j * math.pi * f if s is None else complex(s)
    if data.get('zyfile'):
        return zy_from_file(data, s)
    if data.get('seq'):
        return seq_matrices(data['seq'], s)
    if data.get('cables'):
        if data.get('wires') or data.get('bundles'):
            raise LineError('εναέριοι αγωγοί και καλώδια στην ίδια γραμμή δεν υποστηρίζονται ακόμη')
        Z, Ysh, cs = cable_zy(data, s)
        T = _groups(cs)
        Zr = np.linalg.inv(T.T @ np.linalg.inv(Z) @ T)
        G = _gdiag(data, len(Zr), 0.0)               # the insulation losses are in tanδ: no extra G′ unless given
        Zr, Y = Zr, G + T.T @ Ysh @ T
    else:
        Z, P, cs = zy(data, s=s, **kw)
        Zr, Pr = reduce_phases(Z, P, cs, bool(data.get('iseg')))
        Y = _gdiag(data, len(Zr), G_DEFAULT) + s * np.linalg.inv(Pr)
    tr = transposition(data, len(Zr))
    if tr and (data['transp'].get('mode') or 'avg') == 'avg':
        Zr, Y = transpose_avg(Zr, tr), transpose_avg(Y, tr)
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
def ti_matrix(Z, Y, rot='gm0'):
    """The current transformation matrix T_i at one frequency: eigenvectors of Y′Z′, sorted from the slowest mode
    (ground mode first), each column normalized and rotated so that the modal conductance is zero (rot = 'gm0', the
    default of LINE CONSTANTS, IROT = 1) or so that its imaginary part is smallest (rot = 'minimag', IROT = 2, the
    default of the newer Line/Cable Data), then the imaginary part dropped and the column normalized again."""
    lam, V = np.linalg.eig(Y @ Z)
    gam = np.sqrt(lam)
    vel = (2 * math.pi) / np.maximum(gam.imag, 1e-300)
    order = np.argsort(vel)
    V = V[:, order]
    V = V / np.linalg.norm(V, axis=0)
    if rot == 'minimag':
        for j in range(V.shape[1]):
            a, b = V[:, j].real, V[:, j].imag
            th = 0.5 * math.atan2(-2 * float(a @ b), float(a @ a - b @ b))    # max ‖Re(v·e^{jθ})‖²
            V[:, j] *= cmath.exp(1j * th)
    else:
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


# ---------------------------------------------------------------- 4.11: balanced lines, double circuits, T_i options
TI_KINDS = ('gm0', 'minimag', 'balanced', 'double')


def clarke(M):
    """The generalized Clarke matrix of an M-phase balanced line (cpline eq. 69; Dommel §4.1.3): column 1 = 1/√M (the
    zero mode), column k = (1, …, 1, −(k − 1), 0, …)/√(k(k − 1)). Orthogonal: T⁻¹ = Tᵀ."""
    T = np.zeros((M, M))
    T[:, 0] = 1 / math.sqrt(M)
    for k in range(2, M + 1):
        T[:k - 1, k - 1] = 1 / math.sqrt(k * (k - 1))
        T[k - 1, k - 1] = -(k - 1) / math.sqrt(k * (k - 1))
    return T


def double_ti():
    """T_i of a double-circuit line with only zero-sequence coupling between the circuits (cpline eqs. 70–77): the
    ground mode, the inter-circuit zero-sequence mode, and α, β of each circuit. Orthogonal."""
    T = np.zeros((6, 6))
    T[:, 0] = 1 / math.sqrt(6)
    T[:, 1] = np.array([1, 1, 1, -1, -1, -1]) / math.sqrt(6)
    for c in (0, 1):
        T[3 * c:3 * c + 3, 2 + 2 * c] = np.array([1, -1, 0]) / math.sqrt(2)
        T[3 * c:3 * c + 3, 3 + 2 * c] = np.array([1, 1, -2]) / math.sqrt(6)
    return T


def balance(A, kind='balanced'):
    """A phase matrix averaged as a balanced line (all self and all mutual terms equal) or, for 6 phases, as a double
    circuit balanced within and between the circuits (self, mutual within, mutual between)."""
    A = np.asarray(A)
    M = len(A)
    off = ~np.eye(M, dtype=bool)
    if kind == 'double':
        if M != 6:
            raise LineError('το διπλό κύκλωμα θέλει 6 φάσεις (1–3 και 4–6)')
        same = np.zeros((6, 6), bool)
        same[:3, :3] = same[3:, 3:] = True
        s_, m_, p_ = np.mean(np.diag(A)), A[same & off].mean(), A[~same].mean()
        B = np.where(same, m_, p_).astype(A.dtype)
        np.fill_diagonal(B, s_)
        return B
    if M == 1:
        return A.copy()
    B = np.full_like(A, A[off].mean())
    np.fill_diagonal(B, np.mean(np.diag(A)))
    return B


def line_zy(data, f=None, ti='gm0', s=None):
    """Z′, Y′ of the phases for a model with the T_i option ti: averaged for a balanced line or a double circuit."""
    Z, Y = phase_matrices(data, f, s=s)
    if ti in ('balanced', 'double'):
        return balance(Z, ti), balance(Y, ti)
    return Z, Y


def model_ti(data, f, ti='gm0'):
    """The real constant T_i of a model: Clarke (balanced), the double-circuit matrix, or the eigenvectors at f rotated
    for zero modal conductance ('gm0') or the least imaginary part ('minimag')."""
    if ti not in TI_KINDS:
        raise LineError(f'άγνωστη επιλογή του T_i «{ti}»')
    if ti == 'balanced':
        return clarke(phases_of(data))
    if ti == 'double':
        return double_ti()
    Z, Y = phase_matrices(data, f)
    return ti_matrix(Z, Y, ti)


def phases_of(data):
    """The number of phases of the line data (any kind of data)."""
    if data.get('zyfile'):
        return len(data['zyfile']['Zr'][0])
    if data.get('seq'):
        return int(_f(data['seq'].get('M'), 3))
    return phases(data)


AUTO_TI_BAND = (500.0, 5000.0)      # the switching band where T_i should stay constant (line_constants §6.6)


def auto_fti(data, band=AUTO_TI_BAND, ti='gm0', cands=None):
    """The frequency of the constant real T_i chosen automatically (our procedure, in the spirit of the EMTP: «constancy
    of T_i within the typical frequency range for switching transients», 500 Hz – 5 kHz): the candidate f* (10 per
    decade from band/10 to band·10) whose T_i gives the smallest largest q-error over the band (5 points per decade).
    Returns (f*, q-error)."""
    fb = np.logspace(math.log10(band[0]), math.log10(band[1]), max(3, int(round(5 * math.log10(band[1] / band[0]))) + 1))
    cands = np.logspace(math.log10(band[0]) - 1, math.log10(band[1]) + 1, 31) if cands is None else np.asarray(cands)
    zy_b = [phase_matrices(data, f) for f in fb]
    best = (None, math.inf)
    for fc in cands:
        Z, Y = phase_matrices(data, fc)
        T = ti_matrix(Z, Y, ti)
        e = max(q_error(Zb, Yb, T) for Zb, Yb in zy_b)
        if e < best[1]:
            best = (float(fc), e)
    return best


# ---------------------------------------------------------------- 4.11: lines without geometry
def seq_matrices(seq, s):
    """Z′, Y′ (per metre) of an M-phase balanced line from its zero and positive sequence parameters at the complex
    frequency s, constant with frequency (LINE CONSTANTS «CONSTANT», line_constants §6.5): Z_s = (Z₀ + (M − 1)Z₁)/M,
    Z_m = (Z₀ − Z₁)/M. Units of `seq` as the EMTP cards: R Ω/km, L mH/km, G S/km, C μF/km."""
    M = int(_f(seq.get('M'), 3))
    s = complex(s)
    g = lambda k, sc: _f(seq.get(k), 0.0) * sc
    Z0 = g('R0', 1e-3) + s * g('L0', 1e-6)
    Z1 = g('R1', 1e-3) + s * g('L1', 1e-6)
    Y0 = g('G0', 1e-3) + s * g('C0', 1e-9)
    Y1 = g('G1', 1e-3) + s * g('C1', 1e-9)
    if not (_f(seq.get('L1'), 0) > 0 and _f(seq.get('C1'), 0) > 0 and _f(seq.get('L0'), 0) > 0 and _f(seq.get('C0'), 0) > 0):
        raise LineError('οι ακολουθίες θέλουν θετικά L₀, C₀, L₁, C₁')

    def mat(a0, a1):
        A = np.full((M, M), (a0 - a1) / M, complex)
        np.fill_diagonal(A, (a0 + (M - 1) * a1) / M)
        return A

    return mat(Z0, Z1), mat(Y0, Y1)


RHO_AL = 2.83e-8        # resistivity of aluminium (Ω·m) for the tube of `rebuild`


def rebuild(seq, h0=None):
    """LINE CONSTANTS «LBUILD» (line_constants §6.1, §6.4; conductor_data §2): a balanced line whose zero and positive
    sequence parameters at the frequency f of `seq` match the given ones, so that every frequency-dependent model can
    be made from one-frequency data. Our construction: M identical conductors on a regular polygon at the height h
    (seq['h'], 20 m by default: the sequence data fix the geometry only up to one free length) and one equivalent
    ground wire above them. Unknowns: the polygon radius a, the conductor radius r, an extra internal inductance ΔL
    (so that L₁ and C₁ can both be met), the earth resistivity ρ, R_dc (if not given) and the ground wire's R_dc (its
    circulating current raises R₀; when R₀ needs no ground wire its resistance goes to the upper bound). The skin effect
    is estimated with an aluminium tube of the given R_dc and radius r (solid if that is not enough metal). Least
    squares on ln C₁, C₀, L₁, L₀, R₁, R₀ with Carson's earth; continuously transposed (averaged). First guess from
    C₁ = 2πε₀/ln(D/r) and C₀ = 2πε₀/ln((2h)^M/(r·D^(M−1))). Returns the line data with 'rebuilt' = {got, err, residual}."""
    from scipy.optimize import least_squares
    M = int(_f(seq.get('M'), 3))
    if M < 2:
        raise LineError('η ανακατασκευή θέλει τουλάχιστον 2 φάσεις')
    f = _f(seq.get('f'), 50.0)
    h = _f(seq.get('h'), 20.0) if h0 is None else h0
    w = 2 * math.pi * f
    tgt = {k: _f(seq.get(k)) for k in ('R0', 'L0', 'C0', 'R1', 'L1', 'C1')}
    if any(not tgt[k] > 0 for k in tgt):
        raise LineError('η ανακατασκευή θέλει θετικά R₀, L₀, C₀, R₁, L₁, C₁')
    Rdc_given = _f(seq.get('Rdc'), 0.0)
    k_e = 2 * math.pi * EPS0
    A = k_e / (tgt['C1'] * 1e-9)                       # ln(D/r)
    B = k_e / (tgt['C0'] * 1e-9)                       # ln((2h)^M/(r·D^(M−1)))
    D = min(max(math.exp((M * math.log(2 * h) + A - B) / M), 0.3), 0.8 * h)
    r = min(max(D / math.exp(A), 2e-3), 0.2 * D)
    a = D / (2 * math.sin(math.pi / M))
    x0 = [math.log(a), math.log(r), 0.0, math.log(100.0), math.log(Rdc_given or tgt['R1'] * 0.95), math.log(1.0)]
    lo = [math.log(0.05), math.log(1e-3), -2.0, math.log(1e-2), math.log(1e-6), math.log(1e-3)]
    hi = [math.log(0.9 * h), math.log(0.5 * h), 2.0, math.log(1e6), math.log(1e3), math.log(1e6)]
    x0 = [min(max(v, l + 1e-9), u - 1e-9) for v, l, u in zip(x0, lo, hi)]

    def data_of(x):
        a, r, dL, rho = math.exp(x[0]), math.exp(x[1]), x[2], math.exp(x[3])
        Rdc = Rdc_given or math.exp(x[4])
        area = RHO_AL / (Rdc * 1e-3)                    # Rdc in Ω/km
        tD = 0.5 if area >= math.pi * r * r else 0.5 * (1 - math.sqrt(1 - area / (math.pi * r * r)))
        ang = [2 * math.pi * k / M + math.pi / 2 for k in range(M)]
        wires = [{'ph': k + 1, 'x': a * math.cos(t), 'y': h + a * math.sin(t), 'r': r * 100, 'Rdc': Rdc,
                  'tD': max(tD, 1e-3), 'dL': dL} for k, t in enumerate(ang)]
        wires.append({'ph': 0, 'x': 0.0, 'y': h + a + max(3 * r, 1.0), 'r': 0.5, 'Rdc': math.exp(x[5]), 'tD': 0.5})
        g1 = seq.get('G1')
        return {'rho': rho, 'earth': 'carson', 'skin': True, 'wires': wires,
                **({'G': [_f(g1)] * M} if g1 not in (None, '') else {}),
                'transp': {'order': [[(k + j) % M + 1 for k in range(M)] for j in range(M)], 'mode': 'avg'}}

    keys = ('C1', 'C0', 'L1', 'L0', 'R1', 'R0')
    wts = (1, 1, 1, 1, 0 if Rdc_given else 1, 1)

    def got_of(d):
        Z, Y = phase_matrices(d, f)
        z1, z0 = sequence(Z)
        c1, c0 = sequence(Y.imag / w)
        return {'R0': z0.real * 1e3, 'L0': z0.imag / w * 1e6, 'C0': c0 * 1e9, 'R1': z1.real * 1e3,
                'L1': z1.imag / w * 1e6, 'C1': c1 * 1e9}

    def res(x):
        try:
            g = got_of(data_of(x))
        except LineError:
            return np.full(len(keys), 10.0)
        return np.array([wt * math.log(max(g[k], 1e-30) / tgt[k]) for k, wt in zip(keys, wts)])

    sol = least_squares(res, x0, bounds=(lo, hi), xtol=1e-15, ftol=1e-15, gtol=1e-15, max_nfev=3000)
    out = data_of(sol.x)
    g = got_of(out)
    out['rebuilt'] = {'f': f, 'h': h, 'from': dict(tgt), 'got': g, 'err': {k: g[k] / tgt[k] - 1 for k in tgt},
                      'residual': max(abs(g[k] / tgt[k] - 1) for k in tgt if wts[keys.index(k)])}
    return out


def zy_from_file(data, s):
    """Z′, Y′ of the phases from tabulated matrices (4.11, «Z′ and Y′ from a file», Line/Cable Data §2.4): data['zyfile'] =
    {f: [Hz], Zr, Zi, Yr, Yi: [f][i][j] per unit length, unit: 'km' or 'm'}. At a frequency of the table the values
    themselves, between them interpolated in log f (real and imaginary parts), outside the nearest end."""
    t = data['zyfile']
    fs = np.asarray(t['f'], float)
    k = {'km': 1e-3, 'm': 1.0, 'mile': 1 / 1609.344}[t.get('unit', 'km')]
    s = complex(s)
    f = abs(s.imag) / (2 * math.pi)
    Zr, Zi, Yr, Yi = (np.asarray(t[n], float) for n in ('Zr', 'Zi', 'Yr', 'Yi'))
    if s.real != 0:
        raise LineError('οι πίνακες από αρχείο δεν ορίζονται σε μιγαδική συχνότητα')
    lf = np.log10(fs)
    x = math.log10(min(max(f, fs[0]), fs[-1]))
    j = int(np.clip(np.searchsorted(lf, x) - 1, 0, len(fs) - 2)) if len(fs) > 1 else 0
    if len(fs) == 1 or abs(x - lf[j]) < 1e-12:
        a, wgt = j, 0.0
    elif abs(x - lf[j + 1]) < 1e-12:
        a, wgt = j + 1, 0.0
    else:
        a, wgt = j, (x - lf[j]) / (lf[j + 1] - lf[j])

    def at(A):
        return A[a] if wgt == 0 else A[a] * (1 - wgt) + A[a + 1] * wgt

    return (at(Zr) + 1j * at(Zi)) * k, (at(Yr) + 1j * at(Yi)) * k


def load_zy_mat(path_or_bytes, unit='km'):
    """A MATLAB file with Z (N×N×N_s), Y, f (1×N_s) and line_length (Line/Cable Data §2.4.1) as data['zyfile']."""
    import io
    from scipy.io import loadmat
    src = io.BytesIO(path_or_bytes) if isinstance(path_or_bytes, (bytes, bytearray)) else path_or_bytes
    m = loadmat(src)
    for k in ('Z', 'Y', 'f'):
        if k not in m:
            raise LineError(f'το αρχείο .mat δεν έχει τη μεταβλητή «{k}»')
    Z, Y = np.asarray(m['Z'], complex), np.asarray(m['Y'], complex)
    f = np.asarray(m['f'], float).ravel()
    if Z.ndim == 2:
        Z, Y = Z[:, :, None], Y[:, :, None]
    if Z.shape[2] != len(f) or Y.shape != Z.shape or Z.shape[0] != Z.shape[1]:
        raise LineError('τα Z, Y πρέπει να είναι N×N×N_s και το f 1×N_s')
    o = np.argsort(f)
    Z, Y, f = Z[:, :, o], Y[:, :, o], f[o]
    tr = lambda A: np.transpose(A, (2, 0, 1))
    out = {'f': f.tolist(), 'Zr': tr(Z.real).tolist(), 'Zi': tr(Z.imag).tolist(), 'Yr': tr(Y.real).tolist(),
           'Yi': tr(Y.imag).tolist(), 'unit': unit}
    if 'line_length' in m:
        out['length'] = float(np.asarray(m['line_length']).ravel()[0])
    return out


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


CP_MODES = ('lumped', 'lossless', 'distortionless', 'hf')


def cp_model(data, f=50.0, length=None, ti='gm0', mode='lumped'):
    """Constant-parameter model: per mode Z_c = √(L′/C′), velocity 1/√(L′C′) and the total modal resistance R′ℓ,
    from the modal matrices at f with the real T_i of that frequency (or of the option ti, 4.11). mode (4.11): 'lumped'
    (R/4, R/2, R/4, as the EMTP), 'lossless' (R = 0), 'distortionless' (the attenuation e^(−R/2Z_c) on each wave,
    cpline §1.2.3, Dommel §4.2.2.4), 'hf' (lossless high-frequency approximation, all modes at the speed of light,
    Z_c from 60·ln(2h/r), 60·ln(D/d): for lightning, Dommel §4.1.5.2)."""
    L = (_f(data.get('length'), 1.0) if length is None else length) * 1000.0
    if mode not in CP_MODES:
        raise LineError(f'άγνωστο είδος CP «{mode}»')
    if mode == 'hf':
        lm = lossless_modes(data, f, 'hf', ti)
        modes = [{'Zc': m['Zc'], 'tau': L / m['v'], 'R': 0.0, 'v': m['v']} for m in lm['modes']]
        return {'type': 'cp', 'M': len(modes), 'f': f, 'length': L / 1000.0, 'Ti': lm['Ti'], 'modes': modes,
                'qerr': 0.0, 'cp': mode, 'ti': ti}
    Z, Y = line_zy(data, f, ti)
    Ti = model_ti(data, f, ti) if ti in ('balanced', 'double') else ti_matrix(Z, Y, ti)
    zm, ym = modal(Z, Y, Ti)
    w = 2 * math.pi * f
    modes = []
    for z, y in zip(zm, ym):
        Lp, Cp = z.imag / w, y.imag / w
        if not (Lp > 0 and Cp > 0):
            raise LineError('μη φυσικός ρυθμός (L′ ή C′ ≤ 0) στη συχνότητα του CP')
        m = {'Zc': math.sqrt(Lp / Cp), 'tau': L * math.sqrt(Lp * Cp), 'R': 0.0 if mode == 'lossless' else z.real * L,
             'v': 1 / math.sqrt(Lp * Cp)}
        if mode == 'distortionless':
            m['dl'] = True
        modes.append(m)
    out = {'type': 'cp', 'M': len(Z), 'f': f, 'length': L / 1000.0, 'Ti': Ti.tolist(), 'modes': modes,
           'qerr': q_error(Z, Y, Ti)}
    if ti != 'gm0':
        out['ti'] = ti
    if mode != 'lumped':
        out['cp'] = mode
    return out


def lossless_modes(data, f=50.0, kind='r0', ti='gm0'):
    """Modal parameters without losses (LINE CONSTANTS MODAL, line_constants §4.6; print_modal_parameters):
    'exact' — from the exact Z′, Y′ with G = 0; 'r0' — with R = 0 before the eigen-analysis (the zero mode slower than
    the aerial ones, as the exact case); 'hf' — the lossless high-frequency approximation: no internal inductance and
    perfect earth, L′ = μ₀ε₀·P′, so every mode travels at c and the surge impedances in phase quantities are
    Z_ii = 60·ln(2h/r), Z_ik = 60·ln(D/d) Ω (overhead lines only). Returns {Ti, modes: [{Zc, v, L, C}], Zc (phase
    matrix, Ω)}."""
    w = 2 * math.pi * f
    if kind == 'hf':
        if data.get('cables') or data.get('seq') or data.get('zyfile'):
            raise LineError('η προσέγγιση χωρίς απώλειες στις υψηλές συχνότητες θέλει εναέρια γραμμή από γεωμετρία')
        Z, P, cs = zy(data, f, earth='perfect', skin=False)
        _, Pr = reduce_phases(Z, P, cs)
        tr = transposition(data, len(Pr))
        if tr and (data['transp'].get('mode') or 'avg') == 'avg':
            Pr = transpose_avg(Pr, tr)
        if ti in ('balanced', 'double'):
            Pr = balance(Pr, ti)
        Zcp = Pr / C0                                 # √(L′/C′) = μ₀ε₀·P′·c = P′/c (Ω)
        if ti in ('balanced', 'double'):
            Ti = model_ti(data, f, ti)
            lam = np.diag(Ti.T @ Zcp @ Ti)
        else:
            lam, V = np.linalg.eigh(Zcp)
            o = np.argsort(-lam)                     # the zero mode (largest Z_c) first, as the other models
            lam, Ti = lam[o], V[:, o]
            for j in range(Ti.shape[1]):
                if Ti[np.argmax(np.abs(Ti[:, j])), j] < 0:
                    Ti[:, j] = -Ti[:, j]
        modes = [{'Zc': float(z), 'v': C0, 'L': float(z) / C0, 'C': 1 / (float(z) * C0)} for z in lam]
        return {'kind': kind, 'Ti': Ti.tolist(), 'modes': modes, 'Zc': Zcp.tolist()}
    Z, Y = line_zy(data, f, ti)
    Y = 1j * Y.imag
    if kind == 'r0':
        Z = 1j * Z.imag
    elif kind != 'exact':
        raise LineError(f'άγνωστο είδος ρυθμών «{kind}»')
    Ti = model_ti(data, f, ti) if ti in ('balanced', 'double') else ti_matrix(Z, Y, ti)
    zm, ym = modal(Z, Y, Ti)
    modes = []
    for z, y in zip(zm, ym):
        g = cmath.sqrt(z * y)
        modes.append({'Zc': abs(cmath.sqrt(z / y)), 'v': w / g.imag, 'L': z.imag / w, 'C': y.imag / w,
                      'R': z.real, 'att': g.real})
    Zc = np.linalg.inv(Y) @ _msqrt(Y @ Z)
    return {'kind': kind, 'Ti': Ti.tolist(), 'modes': modes, 'Zc': np.abs(Zc).tolist()}


def _msqrt(A):
    """Principal square root of a diagonalizable matrix (eigenvalues with a positive real part of the root)."""
    lam, V = np.linalg.eig(A)
    g = np.sqrt(lam)
    g = np.where(g.real < 0, -g, g)
    return V @ np.diag(g) @ np.linalg.inv(V)


def _fit_a(s, A, w, L, tmin, tmax, n, tol, nmax=30):
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
        if fit[4] <= tol or nn >= nmax:
            return tau, fit
        nn += 2


def fd_model(data, length=None, fmin=0.01, decades=9, ppd=10, fti=None, tol_zc=0.01, tol_a=0.005, n0=6, curves=False,
             ti='gm0', nmax=30):
    """Frequency-dependent model (J. Marti): constant real T_i (at fti, or 1 kHz; 'auto' chooses it, 4.11; the option
    ti as `model_ti`), and per mode Z_c(s) ≈ k₀ + Σ r_k/(s + p_k) and A(s) ≈ e^(−sτ)·Σ c_k/(s + q_k), fitted over
    fmin … fmin·10^decades (or the frequencies of a table of Z′, Y′). Each fit adds poles until its error is below its
    tolerance (relative for Z_c, absolute for A), at most nmax (as NORMAX of .CTLFIT)."""
    L = (_f(data.get('length'), 1.0) if length is None else length) * 1000.0
    fauto = None
    if fti == 'auto':
        fti, qa = auto_fti(data, ti=ti if ti in ('gm0', 'minimag') else 'gm0')
        fauto = qa
    fti = fti or 1000.0
    Ti = model_ti(data, fti, ti)
    Zt = phase_matrices(data, fti)[0]
    fs = np.asarray(data['zyfile']['f'], float) if data.get('zyfile') else freqs(fmin, decades, ppd)
    s = 2j * math.pi * fs
    M = len(Zt)
    zc = np.zeros((len(fs), M), complex)
    gm = np.zeros((len(fs), M), complex)
    qe = 0.0
    for i, f in enumerate(fs):
        Z, Y = line_zy(data, f, ti)
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
            if fz[4] <= tol_zc or nz >= nmax:
                break
            nz += 2
        vmax = 2 * math.pi * fs[-1] / gm[-1, k].imag
        tmax = L / vmax * 1.0005
        tau, fa = _fit_a(s, A, None, L, max(L / C0, 0.8 * tmax), tmax, n0, tol_a, nmax)
        m = {'zc': {'d': fz[0], 'r': fz[1].tolist(), 'p': fz[2].tolist(), 'err': fz[4]},
             'a': {'r': fa[1].tolist(), 'p': fa[2].tolist(), 'err': fa[4]}, 'tau': tau,
             'Zc_inf': fz[0], 'Zc_dc': abs(Zc[0])}
        if curves:                     # exact and fitted |Z_c|, |A| and the phase of A·e^(sτ) for the report
            zf = rational(s, fz[0], fz[1], fz[2])
            af = rational(s, 0, fa[1], fa[2]) * np.exp(-s * tau)
            m['curve'] = {'Zc': np.abs(Zc).tolist(), 'Zc_fit': np.abs(zf).tolist(), 'A': np.abs(A).tolist(),
                          'A_fit': np.abs(af).tolist()}
        modes.append(m)
    out = {'type': 'fd', 'M': M, 'length': L / 1000.0, 'fti': fti, 'fmin': float(fs[0]), 'fmax': float(fs[-1]),
           'Ti': Ti.tolist(), 'modes': modes, 'qerr': qe}
    if ti != 'gm0':
        out['ti'] = ti
    if fauto is not None:
        out['fti_auto'] = True
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


# ---------------------------------------------------------------- 4.11: outputs of the line constants
A_OP = cmath.exp(2j * math.pi / 3)


def sym_matrix(M):
    """T of the symmetrical components of each three-phase circuit (phases 1–3, 4–6, …): V_abc = T·V_012 with
    T₃ = [[1, 1, 1], [1, a², a], [1, a, a²]] (Fortescue, unnormalized as LINE CONSTANTS). M must be a multiple of 3."""
    if M % 3:
        raise LineError('οι συμμετρικές συνιστώσες θέλουν 3, 6, 9 … φάσεις')
    a = A_OP
    T3 = np.array([[1, 1, 1], [1, a * a, a], [1, a, a * a]])
    T = np.zeros((M, M), complex)
    for k in range(0, M, 3):
        T[k:k + 3, k:k + 3] = T3
    return T


def to_sym(A):
    """A phase matrix in symmetrical components, T⁻¹·A·T (rows and columns 0, 1, 2 of each circuit)."""
    T = sym_matrix(len(A))
    return np.linalg.solve(T, A @ T)


def matrices(data, f=50.0):
    """The matrices of LINE CONSTANTS (line_constants §4.6) at f: for the physical conductors (overhead lines: [Z], the
    potential coefficients [P] and [C] = [P]⁻¹), the equivalent phases ([Z_E], [Y_E], [C_E] = Im[Y_E]/ω, [G_E]) and their
    symmetrical components ([Z_S], [Y_S], [C_S]) when the phases are 3, 6, …; per km (Ω/km, S/km, F/km)."""
    w = 2 * math.pi * f
    out = {'f': f}
    if not (data.get('cables') or data.get('seq') or data.get('zyfile')):
        Z, P, cs = zy(data, f)
        out['phys'] = {'Z': Z * 1e3, 'P': P / 1e3, 'C': np.linalg.inv(P) * 1e3,
                       'labels': [f"{c['ph']}" for c in cs]}
    Ze, Ye = phase_matrices(data, f)
    out['phase'] = {'Z': Ze * 1e3, 'Y': Ye * 1e3, 'C': Ye.imag / w * 1e3, 'G': Ye.real * 1e3}
    if len(Ze) % 3 == 0:
        Zs, Ys = to_sym(Ze), to_sym(Ye)
        out['sym'] = {'Z': Zs * 1e3, 'Y': Ys * 1e3, 'C': Ys.imag / w * 1e3}
    return out


def _phys_currents(data, f, I):
    """Currents of the physical conductors for the phase currents I (A): equal voltage drop in the conductors of a phase,
    zero in the ground wires (continuous: their induced current is part of the answer, Dommel eq. 4.39)."""
    Z, P, cs = zy(data, f)
    T = _groups(cs)
    Zi = np.linalg.inv(Z)
    Ze_inv = T.T @ Zi @ T
    dV = np.linalg.solve(Ze_inv, np.asarray(I, complex))       # the voltage drop per metre of each phase
    return Zi @ (T @ dV), cs


def field(data, V, x, height=0.0, at='avg'):
    """Electric field (kV/m, rms) at the points x (m) at a height above flat ground, from the phase-to-ground voltages V
    (kV rms phasors, one per phase): the charges Q = C·V of all conductors (ground wires at zero, bundles at their phase
    voltage) and their images (line_constants §5.1, eqs. 1–6; at height 0 the field is vertical). at: the conductor
    heights 'avg' (as the line model), 'mid' (midspan, the lowest) or 'tower'. Returns {x, Ex, Ey (complex), E (rms of
    the vector), Emax (the major axis of the field ellipse)}."""
    cs = conductors(data)
    hk = {'avg': 'h', 'mid': 'hm', 'tower': 'ht'}[at]
    n = len(cs)
    P = np.zeros((n, n))
    for i, a in enumerate(cs):
        for k, b in enumerate(cs):
            if i == k:
                P[i, i] = math.log(2 * a[hk] / a['r'])
            else:
                dx = a['x'] - b['x']
                P[i, k] = math.log(math.hypot(dx, a[hk] + b[hk]) / math.hypot(dx, a[hk] - b[hk]))
    V = np.asarray(V, complex)
    Vc = np.array([V[c['ph'] - 1] if c['ph'] > 0 else 0 for c in cs], complex)
    q = np.linalg.solve(P, Vc)                         # q/(2πε₀), in kV
    xs = np.atleast_1d(np.asarray(x, float))
    Ex = np.zeros(len(xs), complex)
    Ey = np.zeros(len(xs), complex)
    for c, qq in zip(cs, q):
        for sgn, yc in ((1, c[hk]), (-1, -c[hk])):
            dx, dy = xs - c['x'], height - yc
            r2 = dx * dx + dy * dy
            Ex += sgn * qq * dx / r2
            Ey += sgn * qq * dy / r2
    Erms = np.sqrt(np.abs(Ex) ** 2 + np.abs(Ey) ** 2)
    Emax = np.sqrt((np.abs(Ex) ** 2 + np.abs(Ey) ** 2 + np.abs(Ex * Ex + Ey * Ey)) / 2)
    return {'x': xs, 'Ex': Ex, 'Ey': Ey, 'E': Erms, 'Emax': Emax}


def bfield(data, I, x, height=1.0, f=50.0, earth='none', at='avg'):
    """Magnetic flux density (μT, rms) at the points x and a height above ground for the phase currents I (A rms
    phasors), with the currents of the bundles and the induced currents of the continuous ground wires; the earth
    currents neglected (earth='none', as the usual right-of-way calculations) or as images at the complex depth
    h + 2p, p = √(ρ/(jωμ₀)) (earth='deri'). Returns {x, Bx, By, B (rms of the vector), Bmax (ellipse major axis)}."""
    Ic, cs = _phys_currents(data, f, I)
    hk = {'avg': 'h', 'mid': 'hm', 'tower': 'ht'}[at]
    rho = _f(data.get('rho'), 100.0)
    p = cmath.sqrt(rho / (2j * math.pi * f * MU0)) if earth == 'deri' else None
    xs = np.atleast_1d(np.asarray(x, float))
    Bx = np.zeros(len(xs), complex)
    By = np.zeros(len(xs), complex)
    k = MU0 / (2 * math.pi) * 1e6
    for c, i in zip(cs, Ic):
        srcs = [(c[hk], i)] + ([(-(c[hk] + 2 * p), -i)] if p is not None else [])
        for yc, ii in srcs:
            dx, dy = xs - c['x'], height - yc
            r2 = dx * dx + dy * dy
            Bx += -k * ii * dy / r2
            By += k * ii * dx / r2
    B = np.sqrt(np.abs(Bx) ** 2 + np.abs(By) ** 2)
    Bmax = np.sqrt((np.abs(Bx) ** 2 + np.abs(By) ** 2 + np.abs(Bx * Bx + By * By)) / 2)
    return {'x': xs, 'Bx': Bx, 'By': By, 'B': B, 'Bmax': Bmax}


def telecom(data, f=50.0, I=None, V=None):
    """Interference with a communication line (line_constants §5.2; Dommel §4.1.2.5 c): the last equivalent phase is the
    communication line. Returns the mutual impedances Z_N,k (Ω/km) from the other phases, with the reduction by the
    continuous ground wires already in them (eq. 4.40a), the same per three-phase circuit in symmetrical components
    (V_N = Z_zero·I_zero + Z_pos·I_pos + Z_neg·I_neg, unnormalized), the longitudinal voltage per km for the phase
    currents I (A), and the electrostatic voltage of the insulated communication line for the phase voltages V (V),
    0 = Σ C_Nk·V_k + C_NN·V_N (eq. 4.40b)."""
    Z, Y = phase_matrices(data, f)
    N = len(Z)
    if N < 2:
        raise LineError('χρειάζεται τουλάχιστον μία φάση ισχύος και η γραμμή τηλεπικοινωνιών (η τελευταία φάση)')
    zN = Z[N - 1, :N - 1] * 1e3
    out = {'Z': zN, 'ZE': Z * 1e3}
    if (N - 1) % 3 == 0:
        T = sym_matrix(N - 1)
        zs = zN @ T
        out['sym'] = [{'zero': zs[k], 'pos': zs[k + 1], 'neg': zs[k + 2]} for k in range(0, N - 1, 3)]
    if I is not None:
        out['dV'] = complex(zN @ np.asarray(I, complex))          # V/km
    if V is not None:
        C = Y.imag
        out['VN'] = complex(-(C[N - 1, :N - 1] @ np.asarray(V, complex)) / C[N - 1, N - 1])
    return out


Q_SOURCES = None      # default test sources: 1∠0°, 1∠0°, 1∠120° for every three phases (line_constants §6.7 .IMBAL)


def _default_sources(M):
    v = []
    for k in range(M):
        v.append(cmath.rect(1.0, math.radians(120.0)) if k % 3 == 2 else 1.0 + 0j)
    return np.array(v, complex)


def _modal_admittance(Z, Y, Ti, L):
    """The nodal admittance (2M × 2M) of the line with a constant real T_i, each mode exact at this frequency but the
    coupling between the modes that T_i leaves out ignored (what CP and FD do)."""
    Tinv = np.linalg.inv(Ti)
    zm = np.diag(Ti.T @ Z @ Ti)
    ym = np.diag(Tinv @ Y @ Tinv.T)
    g = np.sqrt(zm * ym)
    g = np.where(g.real < 0, -g, g)
    yc = ym / g
    Ys = Ti @ np.diag(yc / np.tanh(g * L)) @ Ti.T
    Ym = Ti @ np.diag(-yc / np.sinh(g * L)) @ Ti.T
    return np.block([[Ys, Ym], [Ym, Ys]])


def _end_tests(Yn, M, Vs):
    Y11, Y12, Y21, Y22 = Yn[:M, :M], Yn[:M, M:], Yn[M:, :M], Yn[M:, M:]
    Vr = -np.linalg.solve(Y22, Y21 @ Vs)
    return {'open_v': Vr, 'open_i': Y11 @ Vs + Y12 @ Vr, 'short_i1': Y11 @ Vs, 'short_i2': Y21 @ Vs}


def qerror_tests(data, Ti, freqs_, length, sources=None):
    """The Q-error table of LINE CONSTANTS (line_constants §6.8, Transformation_matrices_and_Qerror §2): at each
    frequency, the steady state of the line with the constant real T_i against the exact line, with sources at the
    sending end and the receiving end open (voltages there, currents at the sending end) or short-circuited (currents at
    both ends); the largest error in % among the quantities that are at least 5 % of the largest. Returns a list of
    {f, open_v, open_i, short_i1, short_i2}."""
    Ti = np.asarray(Ti, float)
    M = len(Ti)
    L = length * 1000.0
    Vs = _default_sources(M) if sources is None else np.asarray(sources, complex)
    out = []
    for f in freqs_:
        Z, Y = phase_matrices(data, f)
        ex = _end_tests(line_admittance(Z, Y, L), M, Vs)
        ap = _end_tests(_modal_admittance(Z, Y, Ti, L), M, Vs)
        row = {'f': float(f)}
        for k in ex:
            a, b = ex[k], ap[k]
            big = np.abs(a) >= 0.05 * np.abs(a).max() if np.abs(a).max() > 0 else np.zeros(M, bool)
            row[k] = float(100 * np.max(np.abs(b[big] - a[big]) / np.abs(a[big]))) if big.any() else 0.0
        out.append(row)
    return out


def exact_pi(data, f, length):
    """The exact π of the line at f (Line/Cable Data eqs. 39–41, Dommel §4.2.1.3): Y_series = Y_c/sinh(Γℓ) and
    Y_shunt = Y_c·tanh(Γℓ/2) as M × M matrices (S), from the exact complex eigenvectors."""
    Z, Y = phase_matrices(data, f)
    M = len(Z)
    Yn = line_admittance(Z, Y, length * 1000.0)
    Ys, Ym = Yn[:M, :M], Yn[:M, M:]
    return {'f': f, 'series': -Ym, 'shunt': Ys + Ym}


def nominal_pi(data, f, length):
    """The nominal π at f (Dommel §4.1.2.4, §4.2.1.1): Z_series = Z′ℓ, Y_shunt = Y′ℓ/2 at each end; R, L, G, C."""
    Z, Y = phase_matrices(data, f)
    L = length * 1000.0
    w = 2 * math.pi * f
    Zs, Yh = Z * L, Y * L / 2
    return {'f': f, 'Z': Zs, 'Y': Yh, 'R': Zs.real, 'L': Zs.imag / w, 'G': Yh.real, 'C': Yh.imag / w}


def useful(data, f=50.0, U=None, length=None):
    """Quantities of the positive and zero sequence that the EMTP does not print but a study needs (3-phase lines):
    Z_c1, the surge impedance loading SIL = U²/Z_c1 (U line-to-line kV → MW), the charging current per km and the
    reactive power per km, the open-end voltage rise (Ferranti) |1/cosh(γ₁ℓ)|, the electrical length, X/R, X₀/X₁,
    R₀/X₁ and the earth compensation factor of distance protection k₀ = (Z₀ − Z₁)/(3·Z₁)."""
    Z, Y = phase_matrices(data, f)
    if len(Z) != 3:
        raise LineError('τα χρήσιμα μεγέθη ορίζονται για τριφασική γραμμή')
    w = 2 * math.pi * f
    z1, z0 = sequence(Z)
    y1, y0 = sequence(Y)
    zc1 = cmath.sqrt(z1 / y1)
    g1 = cmath.sqrt(z1 * y1)
    out = {'f': f, 'Z1': z1 * 1e3, 'Z0': z0 * 1e3, 'Zc1': zc1, 'Zc0': cmath.sqrt(z0 / y0), 'XR1': z1.imag / z1.real,
           'X0X1': z0.imag / z1.imag, 'R0X1': z0.real / z1.imag, 'k0': (z0 - z1) / (3 * z1),
           'v1': w / g1.imag, 'att1': g1.real * 1e3, 'wavelength': 2 * math.pi / g1.imag / 1e3}
    if U is not None:
        U = float(U) * 1e3
        out['SIL'] = U * U / abs(zc1) / 1e6
        out['Ic'] = U / math.sqrt(3) * abs(y1) * 1e3                 # A/km
        out['Qc'] = U * U * (y1.imag) * 1e3 / 1e6                    # Mvar/km
    if length is not None:
        Lm = float(length) * 1e3
        out['ferranti'] = abs(1 / cmath.cosh(g1 * Lm))
        out['theta'] = math.degrees(g1.imag * Lm)
    return out


def _track(V_prev, V):
    """Order of the columns of V that follows the columns of V_prev (largest overlap)."""
    from scipy.optimize import linear_sum_assignment
    O = np.abs(np.conj(V_prev).T @ V)
    r, c = linear_sum_assignment(-O)
    return c[np.argsort(r)]


def scan(data, fmin=0.01, decades=9, ppd=10, length=None, ti='gm0', fti=None, model=None, sources=None):
    """All the parameters of the line against frequency, for the graphs and the exports of the dialog (4.11, ROADMAP §26):
    per frequency (fmin … fmin·10^decades, or the table of a file) Z′ and Y′ of the phases (per km), their symmetrical
    components (3, 6, … phases), the modes with the constant real T_i of the model (ti, fti; 'auto' allowed) and the
    exact modes (complex T_i(f), followed by continuity of the eigenvectors), for both: Z_c, γ = α + jβ, v, τ, A = e^(−γℓ);
    the phase matrices Z_c, Y_c and H = e^(−Γℓ), the error of the constant T_i (q-error and, per mode, 1 − |cos| of the
    angle between the constant and the exact column), the Q-error tests; and, with a FD model, its fit against the
    exact Z_c and A with the error at every frequency. Complex numbers as [re, im] pairs or separate re/im arrays."""
    L = (_f(data.get('length'), 1.0) if length is None else length)
    Lm = L * 1000.0
    if fti == 'auto':
        fti = auto_fti(data, ti=ti if ti in ('gm0', 'minimag') else 'gm0')[0]
    fti = fti or 1000.0
    fs = np.asarray(data['zyfile']['f'], float) if data.get('zyfile') else freqs(fmin, decades, ppd)
    Ti = model_ti(data, fti, ti)
    Tinv = np.linalg.inv(Ti)
    M = len(Ti)
    nf = len(fs)
    Zs = np.zeros((nf, M, M), complex)
    Ys = np.zeros((nf, M, M), complex)
    Zc_ph = np.zeros((nf, M, M), complex)
    Yc_ph = np.zeros((nf, M, M), complex)
    H_ph = np.zeros((nf, M, M), complex)
    cz = np.zeros((nf, M), complex)
    cy = np.zeros((nf, M), complex)
    ez = np.zeros((nf, M), complex)
    ey = np.zeros((nf, M), complex)
    Tex = np.zeros((nf, M, M), complex)
    qerr = np.zeros(nf)
    tierr = np.zeros((nf, M))
    Vp = None
    for i, f in enumerate(fs):
        Z, Y = line_zy(data, f, ti)
        Zs[i], Ys[i] = Z, Y
        zm = np.diag(Ti.T @ Z @ Ti)
        ym = np.diag(Tinv @ Y @ Tinv.T)
        cz[i], cy[i] = zm, ym
        lam, V = np.linalg.eig(Y @ Z)
        V = V / np.linalg.norm(V, axis=0)
        if Vp is None:                                        # the exact mode k starts as the column k of the constant T_i
            o = _track(Ti / np.linalg.norm(Ti, axis=0), V)
        else:
            o = _track(Vp, V)
        lam, V = lam[o], V[:, o]
        for j in range(M):                                    # a phase convention: the largest element real positive
            k = np.argmax(np.abs(V[:, j]))
            V[:, j] *= abs(V[k, j]) / V[k, j]
        Vp = V
        Tex[i] = V
        Vinv = np.linalg.inv(V)
        ez[i] = np.diag(V.T @ Z @ V)
        ey[i] = np.diag(Vinv @ Y @ Vinv.T)
        G = _msqrt(Y @ Z)
        Zc = np.linalg.solve(Y, G)
        Zc_ph[i] = Zc
        Yc_ph[i] = np.linalg.inv(Zc)
        gg = np.sqrt(lam)
        gg = np.where(gg.real < 0, -gg, gg)
        H_ph[i] = V @ np.diag(np.exp(-gg * Lm)) @ Vinv
        qerr[i] = q_error(Z, Y, Ti)
        for j in range(M):
            a, b = Ti[:, j], V[:, j]
            tierr[i, j] = 1 - abs(np.vdot(a, b)) / (np.linalg.norm(a) * np.linalg.norm(b))

    def modes_of(zm, ym):
        g = np.sqrt(zm * ym)
        g = np.where(g.real < 0, -g, g)
        w = 2 * math.pi * fs[:, None]
        v = w / g.imag
        return {'Z': zm * 1e3, 'Y': ym * 1e3, 'Zc': np.sqrt(zm / ym), 'alpha': g.real * 1e3, 'beta': g.imag * 1e3,
                'v': v / 1e3, 'tau': Lm / v * 1e6, 'A': np.exp(-g * Lm), 'R': zm.real * 1e3,
                'L': zm.imag / w * 1e6, 'G': ym.real * 1e9, 'C': ym.imag / w * 1e12}

    out = {'f': fs, 'M': M, 'length': L, 'ti': ti, 'fti': float(fti), 'Ti': Ti, 'Z': Zs * 1e3, 'Y': Ys * 1e3,
           'Zc': Zc_ph, 'Yc': Yc_ph, 'H': H_ph, 'modes': modes_of(cz, cy), 'exact': modes_of(ez, ey), 'Tex': Tex,
           'qerr': qerr, 'tierr': tierr}
    if M % 3 == 0:
        T = sym_matrix(M)
        out['S'] = {'Z': np.array([np.linalg.solve(T, A @ T) for A in Zs]) * 1e3,
                    'Y': np.array([np.linalg.solve(T, A @ T) for A in Ys]) * 1e3}
    qf = fs[::max(1, int(round(ppd)))] if not data.get('zyfile') else fs[::max(1, nf // 10)]
    out['qtests'] = qerror_tests(data, Ti, qf, L, sources)
    if model is not None and model.get('type') == 'fd':
        s = 2j * math.pi * fs
        fit = []
        Tm = np.asarray(model['Ti'])
        Tmi = np.linalg.inv(Tm)
        for k, m in enumerate(model['modes']):
            zm = np.array([float(Tm[:, k] @ (Zs[i] @ Tm[:, k]).real) + 1j * float(Tm[:, k] @ (Zs[i] @ Tm[:, k]).imag) for i in range(nf)])
            ym = np.array([Tmi[k] @ Ys[i] @ Tmi[k] for i in range(nf)])
            g = np.sqrt(zm * ym)
            g = np.where(g.real < 0, -g, g)
            zc_ex, a_ex = np.sqrt(zm / ym), np.exp(-g * model['length'] * 1000.0)
            zc_fit = rational(s, m['zc']['d'], m['zc']['r'], m['zc']['p'])
            a_fit = rational(s, 0, m['a']['r'], m['a']['p']) * np.exp(-s * m['tau'])
            fit.append({'Zc': zc_ex, 'Zc_fit': zc_fit, 'A': a_ex, 'A_fit': a_fit,
                        'err_zc': np.abs(zc_fit - zc_ex) / np.abs(zc_ex), 'err_a': np.abs(a_fit - a_ex),
                        'zc_poles': m['zc']['p'], 'zc_res': m['zc']['r'], 'zc_inf': m['zc']['d'],
                        'a_poles': m['a']['p'], 'a_res': m['a']['r'], 'tau': m['tau']})
        out['fit'] = fit
    return out


def jsonable(x):
    """numpy arrays and complex numbers as JSON: real arrays as lists, complex ones as {re, im}."""
    if isinstance(x, dict):
        return {k: jsonable(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        if x and all(isinstance(v, (complex, np.complexfloating)) for v in x):
            return {'re': [float(v.real) for v in x], 'im': [float(v.imag) for v in x]}
        return [jsonable(v) for v in x]
    if isinstance(x, np.ndarray):
        if np.iscomplexobj(x):
            return {'re': np.round(x.real, 15).tolist(), 'im': np.round(x.imag, 15).tolist()}
        return x.tolist()
    if isinstance(x, (complex, np.complexfloating)):
        return {'re': float(x.real), 'im': float(x.imag)}
    if isinstance(x, np.generic):
        return x.item()
    return x


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
    """The nodal admittance that a CP, FD or π model represents at s = jω (to compare a model with the exact line)."""
    if model.get('type') == 'pi':
        return _pi_y(model, s)
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
        if m.get('dl'):                      # 4.11: without distortion, γℓ = sτ + R/(2Z_c) and Z_c real
            x = s * tau + R / (2 * Zc)
            Ys[k, k] = 1 / (Zc * cmath.tanh(x))
            Ym[k, k] = -1 / (Zc * cmath.sinh(x))
            continue
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


def _pi_y(model, s):
    """4.11: the nominal π in N sections at s (totals R, L, G, C of the model): the nodal matrix of the ladder, series
    admittance ((R + sL)/N)⁻¹ between neighbouring nodes and (G + sC)/(2N) at each end of every section, reduced onto the
    two ends (Kron) — the cascade of ABCD matrices loses its digits for many sections at high frequencies."""
    N = int(model['N'])
    Z = (np.asarray(model['R']) + s * np.asarray(model['L'])) / N
    Y = (np.asarray(model['G']) + s * np.asarray(model['C'])) / (2 * N)
    M = len(Z)
    Ys = np.linalg.inv(Z)
    A = np.zeros(((N + 1) * M, (N + 1) * M), complex)
    for k in range(N):
        a, b = slice(k * M, (k + 1) * M), slice((k + 1) * M, (k + 2) * M)
        A[a, a] += Ys + Y
        A[b, b] += Ys + Y
        A[a, b] -= Ys
        A[b, a] -= Ys
    ends = list(range(M)) + list(range(N * M, (N + 1) * M))
    if N == 1:
        return A[np.ix_(ends, ends)]
    inner = list(range(M, N * M))
    Aee, Aei, Aie, Aii = A[np.ix_(ends, ends)], A[np.ix_(ends, inner)], A[np.ix_(inner, ends)], A[np.ix_(inner, inner)]
    return Aee - Aei @ np.linalg.solve(Aii, Aie)


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

# 4.9: the same 400 kV line with its two ground wires kept as conductors 4 and 5 (they end at the tower tops of a lightning
# study instead of being eliminated)
TYPICAL['400kV-gw'] = dict(json.loads(json.dumps(TYPICAL['400kV'])),
                           name='Τυπική γραμμή 400 kV με τους αγωγούς προστασίας ως αγωγούς 4 και 5 (για κεραυνούς)')
TYPICAL['400kV-gw']['wires'][0]['ph'] = 4
TYPICAL['400kV-gw']['wires'][1]['ph'] = 5


def typical(key):
    return json.loads(json.dumps(TYPICAL[key]))


# ---------------------------------------------------------------- the server action (/api/line_model)
def _req_data(req):
    data = req.get('data')
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except ValueError:
            raise LineError('τα δεδομένα της γραμμής δεν είναι JSON')
    if not isinstance(data, dict):
        raise LineError('λείπουν τα δεδομένα της γραμμής')
    if data.get('seq') and (data['seq'].get('mode') or 'const') == 'rebuild':
        data = dict(rebuild(data['seq']), **{k: v for k, v in data.items() if k in ('length',)})
    return data


def _req_opts(req, data):
    L = _f(req.get('len'), _f(data.get('length'), 1.0))
    if not L > 0:
        raise LineError('το μήκος πρέπει να είναι θετικό')
    ti = req.get('ti') or 'gm0'
    if ti not in TI_KINDS:
        raise LineError(f'άγνωστη επιλογή του T_i «{ti}»')
    fti = req.get('fti')
    fti = 'auto' if (req.get('tiauto') or fti == 'auto') else _f(fti, 1000.0)
    return L, ti, fti


def api(req):
    """{data, model ('cp'|'fd'|'pi'), len (km), f (CP, π), fmin, dec, ppd, fti (FD; 'auto' or tiauto), ti (T_i option),
    cp (the kind of CP), nmax, npi (π sections), src} → {mdl, report, curves}: the model the solver uses (with src, the
    key of what it was computed from), the report at f (CP, π) or 50 Hz, and for FD the fit."""
    data = _req_data(req)
    L, ti, fti = _req_opts(req, data)
    kind = req.get('model') if req.get('model') in ('fd', 'pi') else 'cp'
    curves = None
    if kind == 'cp':
        f = _f(req.get('f'), 50.0)
        if not f > 0:
            raise LineError('η συχνότητα πρέπει να είναι θετική')
        mdl = cp_model(data, f, L, ti, req.get('cp') or 'lumped')
        frep = f
    elif kind == 'pi':
        f = _f(req.get('f'), 50.0)
        n = int(_f(req.get('npi'), 1))
        if not (f > 0 and 1 <= n <= 200):
            raise LineError('π: θετική συχνότητα και 1–200 τμήματα')
        Z, Y = line_zy(data, f, ti if ti in ('balanced', 'double') else 'gm0')
        Lm = L * 1000.0
        w = 2 * math.pi * f
        mdl = {'type': 'pi', 'M': len(Z), 'f': f, 'length': L, 'N': n, 'R': (Z.real * Lm).tolist(),
               'L': (Z.imag / w * Lm).tolist(), 'G': (Y.real * Lm).tolist(), 'C': (Y.imag / w * Lm).tolist(),
               'Ti': np.eye(len(Z)).tolist(), 'modes': [{'tau': 1.0}] * len(Z)}
        frep = f
    else:
        fmin, dec, ppd = _f(req.get('fmin'), 0.01), _f(req.get('dec'), 9), _f(req.get('ppd'), 10)
        if not (fmin > 0 and 1 <= dec <= 12 and 2 <= ppd <= 40):
            raise LineError('εύρος: f_min > 0, 1–12 δεκάδες, 2–40 σημεία ανά δεκάδα')
        nmax = int(_f(req.get('nmax'), 30))
        mdl = fd_model(data, L, fmin, dec, ppd, fti, curves=True, ti=ti, nmax=max(6, min(nmax, 60)))
        curves = {'f': mdl.pop('f'), 'modes': [m.pop('curve') for m in mdl['modes']]}
        frep = 50.0
    # 4.12: transpositions as separate sections in the solver (data['transp']['mode'] == 'sec'): the model above is the
    # untransposed line over the whole length; per section the same line over its length (CP and FD; π scales its
    # totals in the solver) and the order of the phases on the geometric positions
    tr = transposition(data, mdl['M']) if (data.get('transp') or {}).get('mode') == 'sec' else None
    if tr:
        secs, cache = [], {}
        for w, P in tr:
            key = round(w, 12)
            if key not in cache:
                Ls = L * w
                if kind == 'cp':
                    cache[key] = cp_model(data, frep, Ls, ti, req.get('cp') or 'lumped')
                elif kind == 'fd':
                    m = fd_model(data, Ls, fmin, dec, ppd, fti, ti=ti, nmax=max(6, min(nmax, 60)))
                    m.pop('f', None)
                    cache[key] = m
                else:
                    cache[key] = None
            order = [int(np.argmax(P[:, pos])) + 1 for pos in range(P.shape[1])]
            secs.append({'frac': w, 'order': order, 'model': cache[key]})
        mdl['sections'] = secs
    mdl['src'] = req.get('src', '')
    rep = report(data, frep)
    if data.get('rebuilt'):
        rep['rebuilt'] = data['rebuilt']
        mdl['rebuilt'] = {'residual': data['rebuilt']['residual']}
    return {'mdl': mdl, 'report': rep, 'curves': curves,
            'conductors': [] if (data.get('cables') or data.get('seq') or data.get('zyfile')) else conductors(data)}
