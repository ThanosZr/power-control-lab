"""Wideband line and cable model in the phase domain (universal line model, ULM) — 4.13, ROADMAP §26 step 4.

The line or cable is described by two matrix functions of the frequency (Morched, Gustavsen, Tartibi 1999):
the characteristic admittance Y_c(s) = (√(Y′Z′))⁻¹·Y′ and the propagation function H(s) = e^(−√(Y′Z′)·ℓ) (both act on
currents, the convention of the EMTP). At each end k, with the other end m,

    i_k = Y_c ⊛ v_k − H ⊛ (i_m + Y_c ⊛ v_m),

so the nodal admittance of the line is M⁻¹·N with M = [I H; H I] and N = [Y_c −H·Y_c; −H·Y_c Y_c].

The fit, as the wideband fitter of the EMTP describes it (WidebandLineCableFitter, Line/Cable Data §3.2.3):
  · Y_c(s) ≈ G₀ + Σ_i R_i/(s − q_i): poles common to every element, found from the trace, residues by least squares;
  · H(s) ≈ Σ_g e^(−sτ_g)·Σ_k R_gk/(s − p_gk) in two stages: the modes of Y′Z′ (eigenvectors followed over the
    frequency), a delay per mode from Bode's magnitude–phase relation for a minimum-phase function (Kocar & Mahseredjian
    2016), modes with (nearly) equal delays in one group, the poles of each group from the sum of its modal functions,
    then the residue matrices of all groups in the phase domain by least squares;
  · options: the fit of each group's modal contribution matrix on its own when the residue/pole ratio is large (the
    cable model correction of Kocar & Mahseredjian 2016, FDCM), a correction term for the frequencies close to DC
    (Cervantes, Kocar, Mahseredjian, Ramirez 2018), the delays optimized around the Bode estimate;
  · the rational fits by relaxed vector fitting (Gustavsen & Semlyen 1999, Gustavsen 2006) with complex poles;
  · passivity: the eigenvalues of the real part of the nodal admittance over a sweep (as the EMTP), and optionally its
    enforcement by perturbing the residues (in the spirit of Gustavsen 2008: linearized eigenvalue constraints at the
    violations, the least change of Y_c and H at the samples, repeated until passive).

Storage (JSON of the solver, «mdl»): each set of poles keeps the real poles and one pole of each complex pair (Im > 0);
the conjugate pole and residue are implied. Residues are M×M matrices (real and imaginary parts).
"""
import cmath
import math

import numpy as np

from . import lineconst as lc

WB_DEFAULTS = {'fmin': 0.01, 'dec': 9, 'ppd': 10, 'tol': 0.002, 'nmax': 40, 'group': True, 'fdcm': 'auto',
               'ratio': 1000.0, 'dc': False, 'opt': False, 'passive': 'check', 'lfw': 100.0}
FDCM_KINDS = ('auto', 'always', 'never')
PASSIVE_KINDS = ('check', 'enforce', 'none')
DC_SPLIT = 1.0                  # Hz: the band below this is fitted as the DC correction (Cervantes et al. 2018)
PASSIVE_EPS = 1e-8              # an eigenvalue of Re Y below −ε·(the largest) is a violation (smaller ones are
                                # below the precision of the 2M × 2M solution and of the conductance GMIN of the solver)
GROUP_PHASE = 0.2             # rad: two modes go in one group when ω·|τ_i − τ_j| is below this at their frequency
BODE_LEVEL = 0.25               # the delay is evaluated where the modal function has decayed to this (Kocar 2016)


class WBError(lc.LineError):
    pass


# ---------------------------------------------------------------- poles in the stored ("half") form
def _full(p, R):
    """From the stored form (real poles and the poles with Im > 0, residues R[k]) to every pole and residue."""
    P, RR = [], []
    for k, q in enumerate(p):
        P.append(q)
        RR.append(R[k])
        if q.imag > 0:
            P.append(q.conjugate())
            RR.append(np.conj(R[k]))
    return np.array(P, complex), np.array(RR)


def _half(p, R, tol=1e-9):
    """Keep the real poles and one pole of each conjugate pair (the one with Im > 0)."""
    keep = []
    for k, q in enumerate(p):
        if abs(q.imag) <= tol * max(abs(q), 1.0):
            keep.append((complex(q.real, 0.0), np.real(R[k]).astype(complex)))
        elif q.imag > 0:
            keep.append((q, R[k]))
    return np.array([a for a, _ in keep], complex), np.array([b for _, b in keep])


def _pack(p, R):
    """JSON of a set of poles and their M×M residues (half form)."""
    return {'p': [[float(q.real), float(q.imag)] for q in p],
            'rr': [np.real(r).tolist() for r in R], 'ri': [np.imag(r).tolist() for r in R]}


def _unpack(o):
    p = np.array([complex(a, b) for a, b in o['p']], complex)
    R = np.array(o['rr'], float) + 1j * np.array(o['ri'], float) if len(o['p']) else np.zeros((0, 0, 0))
    return p, R


# ---------------------------------------------------------------- relaxed vector fitting
def _sort_poles(a):
    """Real poles first (by magnitude), then complex pairs (Im > 0 then its conjugate), by magnitude."""
    re = sorted([q for q in a if abs(q.imag) <= 1e-12 * max(abs(q), 1)], key=lambda q: abs(q))
    cx = sorted([q for q in a if q.imag > 1e-12 * max(abs(q), 1)], key=lambda q: abs(q))
    out = [complex(q.real, 0) for q in re]
    for q in cx:
        out += [q, q.conjugate()]
    return np.array(out, complex)


def _kinds(a):
    """0 real pole, 1 first of a complex pair, 2 its conjugate."""
    k = np.zeros(len(a), int)
    i = 0
    while i < len(a):
        if abs(a[i].imag) > 0:
            k[i], k[i + 1] = 1, 2
            i += 2
        else:
            i += 1
    return k


def _basis(s, a, kind):
    """Real-coefficient basis: 1/(s − a) for a real pole; 1/(s − a) + 1/(s − a*) and j/(s − a) − j/(s − a*) for a pair."""
    B = np.zeros((len(s), len(a)), complex)
    for n in range(len(a)):
        if kind[n] == 0:
            B[:, n] = 1.0 / (s - a[n])
        elif kind[n] == 1:
            B[:, n] = 1.0 / (s - a[n]) + 1.0 / (s - np.conj(a[n]))
            B[:, n + 1] = 1j / (s - a[n]) - 1j / (s - np.conj(a[n]))
    return B


def _residues(x, a, kind):
    """Complex residues of every pole from the real coefficients of the basis (x: n_poles × …)."""
    r = np.zeros(x.shape, complex)
    for n in range(len(a)):
        if kind[n] == 0:
            r[n] = x[n]
        elif kind[n] == 1:
            r[n] = x[n] + 1j * x[n + 1]
            r[n + 1] = x[n] - 1j * x[n + 1]
    return r


def start_poles(fmin, fmax, n, real=True):
    """Initial poles over the band: real and logarithmically spaced (the choice for lines, Gustavsen 2006 §VI), or
    lightly damped complex pairs (β/100 ± jβ)."""
    w1, w2 = 2 * math.pi * fmin, 2 * math.pi * fmax
    if real:
        return -np.logspace(math.log10(w1), math.log10(w2), n).astype(complex)
    m = max(1, n // 2)
    b = np.logspace(math.log10(w1), math.log10(w2), m)
    out = []
    for x in b:
        out += [complex(-x / 100, x), complex(-x / 100, -x)]
    if n % 2:
        out.append(complex(-w2, 0))
    return np.array(out, complex)


POLE_CLIP = 5.0                 # poles kept within [ω_min/5, 5·ω_max] of the fitted band (out-of-band poles of the
                                # relocation would leave H undamped above the band)


def _clip(z, wlo, whi):
    out = []
    for k, q in enumerate(z):
        m = abs(q)
        if whi and m > whi:
            q = complex(-whi * (1 + 0.013 * k), 0.0)
        elif wlo and m < wlo:
            q = complex(-wlo * (1 + 0.013 * k), 0.0)
        out.append(q)
    return np.array(out, complex)


def vfit_relaxed(s, F, poles, weight=None, d=True, iters=10, stable=True, tol_conv=1e-10, clip=POLE_CLIP):
    """Relaxed vector fitting (Gustavsen & Semlyen 1999; Gustavsen 2006) of the responses F (N_s × N_c) with common
    poles: F(s) ≈ d + Σ r_n/(s − a_n). The scaling function σ(s) = d̃ + Σ c̃_n/(s − a_n) has a free d̃ and the relaxed
    condition Re Σ_k σ(s_k) = N_s instead of σ(∞) = 1. weight: N_s or N_s × N_c (absolute weights of the fit).
    Returns (poles, residues (N × N_c), d (N_c), the weighted rms and max errors)."""
    s = np.asarray(s, complex)
    F = np.asarray(F, complex)
    if F.ndim == 1:
        F = F[:, None]
    Ns, Nc = F.shape
    W = np.ones((Ns, Nc)) if weight is None else np.asarray(weight, float)
    if W.ndim == 1:
        W = np.repeat(W[:, None], Nc, axis=1)
    a = _sort_poles(np.asarray(poles, complex))
    for _ in range(iters):
        kind = _kinds(a)
        N = len(a)
        B = _basis(s, a, kind)
        n1 = N + (1 if d else 0)
        rows = []
        scale = 0.0
        for c in range(Nc):
            w = W[:, c]
            scale += np.linalg.norm(w * F[:, c]) ** 2
            A1 = B * w[:, None]
            cols = [A1]
            if d:
                cols.append(w[:, None].astype(complex))
            Ac = np.hstack(cols + [-(w * F[:, c])[:, None] * B, -(w * F[:, c])[:, None]])
            Ar = np.vstack([Ac.real, Ac.imag])
            R = np.linalg.qr(Ar, mode='r')          # fast VF: only the rows of σ's unknowns
            rows.append(R[n1:, n1:])
        scale = math.sqrt(scale) / Ns
        last = np.concatenate([np.real(B.sum(axis=0)), [float(Ns)]]) * scale
        A = np.vstack(rows + [last[None, :]])
        b = np.zeros(A.shape[0])
        b[-1] = Ns * scale
        col = np.linalg.norm(A, axis=0)
        col[col == 0] = 1
        x = np.linalg.lstsq(A / col, b, rcond=None)[0] / col
        ct, dt = x[:N], x[N]
        if abs(dt) < 1e-8:              # Gustavsen 2006 §IV: discard and solve again with d̃ fixed
            dt = 1e-8 * (1 if dt >= 0 else -1)
            A2 = np.vstack(rows)
            col2 = np.linalg.norm(A2[:, :N], axis=0)
            col2[col2 == 0] = 1
            ct = np.linalg.lstsq(A2[:, :N] / col2, -A2[:, N] * dt, rcond=None)[0] / col2
        # zeros of σ: eigenvalues of Λ − b·c̃ᵀ/d̃ (real realization of the pairs)
        L = np.zeros((N, N))
        bvec = np.zeros(N)
        for n in range(N):
            if kind[n] == 0:
                L[n, n] = a[n].real
                bvec[n] = 1.0
            elif kind[n] == 1:
                L[n, n] = L[n + 1, n + 1] = a[n].real
                L[n, n + 1] = a[n].imag
                L[n + 1, n] = -a[n].imag
                bvec[n] = 2.0
        z = np.linalg.eigvals(L - np.outer(bvec, ct) / dt)
        if stable:
            z = np.where(z.real > 0, -z.real + 1j * z.imag, z)
        z = np.where(np.abs(z.real) < 1e-12 * np.abs(z), -1e-6 * np.abs(z) + 1j * z.imag, z)
        z = _conj_clean(z)
        if clip:
            wb_ = np.abs(s.imag)
            z = _clip(z, wb_.min() / clip, wb_.max() * clip)
        an = _sort_poles(_conj_clean(z))
        done = len(an) == len(a) and np.allclose(np.sort_complex(an), np.sort_complex(a), rtol=tol_conv, atol=0)
        a = an
        if done:
            break
    r, dd, err = _fit_residues(s, F, a, W, d)
    return a, r, dd, err[0], err[1]


def _conj_clean(z, tol=1e-9):
    """Make the eigenvalues exact conjugate pairs (and real ones exactly real)."""
    out = []
    used = np.zeros(len(z), bool)
    for i, q in enumerate(z):
        if used[i]:
            continue
        used[i] = True
        if abs(q.imag) <= tol * max(abs(q), 1):
            out.append(complex(q.real, 0))
            continue
        j = np.argmin(np.where(used, np.inf, np.abs(z - np.conj(q))))
        used[j] = True
        m = (q + np.conj(z[j])) / 2
        out += [m, np.conj(m)]
    return np.array(out, complex)


def _fit_residues(s, F, a, W, d=True):
    """Residues (and d) of fixed poles by weighted least squares; returns (r (N × N_c), d (N_c), (rms, max))."""
    kind = _kinds(a)
    B = _basis(s, a, kind)
    N = len(a)
    Ns, Nc = F.shape
    X = np.zeros((N + (1 if d else 0), Nc))
    for c in range(Nc):
        w = W[:, c]
        A = B * w[:, None]
        if d:
            A = np.hstack([A, w[:, None].astype(complex)])
        Ar = np.vstack([A.real, A.imag])
        br = np.concatenate([(w * F[:, c]).real, (w * F[:, c]).imag])
        col = np.linalg.norm(Ar, axis=0)
        col[col == 0] = 1
        X[:, c] = np.linalg.lstsq(Ar / col, br, rcond=None)[0] / col
    r = _residues(X[:N], a, kind)
    dd = X[N] if d else np.zeros(Nc)
    Ff = dd[None, :] + B @ X[:N]
    e = np.abs(Ff - F) * W
    return r, dd, (float(np.sqrt(np.mean(e ** 2))), float(e.max()))


def rational(s, p, R, D=None):
    """Σ_k R_k/(s − p_k) (+ D) for poles and M×M residues in the half form, at the complex frequencies s (array).
    Returns an array N_s × M × M."""
    s = np.atleast_1d(np.asarray(s, complex))
    P, RR = _full(p, R)
    if len(P) == 0:
        out = np.zeros((len(s),) + np.shape(D), complex) if D is not None else None
        return out if D is None else out + np.asarray(D)[None]
    out = np.einsum('sk,kij->sij', 1.0 / (s[:, None] - P[None, :]), RR)
    if D is not None:
        out = out + np.asarray(D)[None]
    return out


# ---------------------------------------------------------------- the line over the band
def _sweep(data, fs, L):
    """Z′, Y′ and the modes of Y′Z′ over the frequencies fs (eigenvectors followed from one frequency to the next).
    Returns a dict with Yc, H (N_s × M × M), the modal propagation functions Hm (N_s × M), γ (N_s × M), T and T⁻¹."""
    Ns = len(fs)
    Z0, Y0 = lc.phase_matrices(data, fs[0])
    M = len(Z0)
    Yc = np.zeros((Ns, M, M), complex)
    H = np.zeros((Ns, M, M), complex)
    Hm = np.zeros((Ns, M), complex)
    G = np.zeros((Ns, M), complex)
    T = np.zeros((Ns, M, M), complex)
    Tinv = np.zeros((Ns, M, M), complex)
    prev = None
    for i, f in enumerate(fs):
        Z, Y = (Z0, Y0) if i == 0 else lc.phase_matrices(data, f)
        lam, V = np.linalg.eig(Y @ Z)
        V = V / np.linalg.norm(V, axis=0)[None, :]
        if prev is not None:
            o = lc._track(prev, V)
            lam, V = lam[o], V[:, o]
            ph = np.sum(np.conj(prev) * V, axis=0)       # keep the sign/phase of each column continuous
            V = V * np.exp(-1j * np.angle(ph))[None, :]
        prev = V
        g = np.sqrt(lam)
        g = np.where(g.real < 0, -g, g)
        Vi = np.linalg.inv(V)
        Yc[i] = V @ np.diag(1.0 / g) @ Vi @ Y
        e = np.exp(-g * L)
        H[i] = V @ np.diag(e) @ Vi
        Hm[i] = e
        G[i] = g
        T[i] = V
        Tinv[i] = Vi
    return {'f': np.asarray(fs, float), 'M': M, 'Yc': Yc, 'H': H, 'Hm': Hm, 'g': G, 'T': T, 'Tinv': Tinv}


def bode_delay(f, Hm, g, L, level=BODE_LEVEL, decades=2.0, n=4001):
    """Delay of one modal propagation function by Bode's magnitude–phase relation (minimum phase, Kocar &
    Mahseredjian 2016, eq. 24–25): at ω₀ where |H| decays to `level` (or the top of the band), the minimum phase
    φ(ω₀) = (1/π)·∫ (d ln|H|/du)·ln coth(|u|/2) du, u = ln(ω/ω₀), over ±2 decades (the magnitude extrapolated with its
    end slope outside the band); τ = τ_true(ω₀) + φ(ω₀)/ω₀ with τ_true = ℓ·Im γ(ω₀)/ω₀. Returns (τ, f₀, τ_true)."""
    from scipy.interpolate import CubicSpline
    f = np.asarray(f, float)
    lf = np.log(f)
    A = np.log(np.maximum(np.abs(Hm), 1e-300))
    k = np.nonzero(np.abs(Hm) < level)[0]
    if len(k) and k[0] > 0:
        j = k[0]
        x0 = lf[j - 1] + (math.log(level) - A[j - 1]) * (lf[j] - lf[j - 1]) / (A[j] - A[j - 1])
    else:
        x0 = lf[-1]
    spA = CubicSpline(lf, A)
    beta = np.imag(np.asarray(g)) * L
    spB = CubicSpline(lf, beta / (2 * np.pi * f))
    w = decades * math.log(10)
    u = np.linspace(-w, w, n)
    um = (u[1:] + u[:-1]) / 2
    du = u[1] - u[0]
    x = x0 + um
    lo, hi = lf[0], lf[-1]
    sl0 = (A[1] - A[0]) / (lf[1] - lf[0])
    sl1 = (A[-1] - A[-2]) / (lf[-1] - lf[-2])
    dA = np.where(x < lo, sl0, np.where(x > hi, sl1, spA(np.clip(x, lo, hi), 1)))
    phi = np.sum(dA * np.log(1.0 / np.tanh(np.abs(um) / 2))) * du / math.pi
    f0 = math.exp(x0)                       # u is ln f: the same as ln ω up to a constant
    ttrue = float(spB(min(max(x0, lo), hi)))
    return ttrue + phi / (2 * math.pi * f0), f0, ttrue


def _groups(taus, f0s, on=True):
    """Modes with nearly equal delays in one group: ω₀·|τ_i − τ_j| below GROUP_PHASE (sorted by delay)."""
    o = np.argsort(taus)
    groups = []
    for i in o:
        if on and groups:
            g = groups[-1]
            j = g[0]
            w0 = 2 * math.pi * min(f0s[i], f0s[j])
            if w0 * abs(taus[i] - taus[j]) < GROUP_PHASE:
                g.append(int(i))
                continue
        groups.append([int(i)])
    return groups


def _fit_scalar(s, F, n0, nmax, tol, weight=None, d=False, fmin=None, fmax=None, iters=10):
    """A scalar response by relaxed VF, adding two poles at a time until the max error is below tol (or nmax)."""
    fmin = fmin or abs(s[0].imag) / (2 * math.pi)
    fmax = fmax or abs(s[-1].imag) / (2 * math.pi)
    n = n0
    best = None
    while True:
        a, r, dd, rms, emax = vfit_relaxed(s, F, start_poles(fmin, fmax, n), weight=weight, d=d, iters=iters)
        if best is None or emax < best[4]:
            best = (a, r, dd, rms, emax)
        if emax <= tol or n >= nmax:
            return best
        n += 2


def _hbasis(s, groups):
    """The phase-domain basis of H: per group its poles × e^(−sτ_g) (real coefficients)."""
    cols, meta = [], []
    for gi, g in enumerate(groups):
        a = g['a']
        kind = _kinds(a)
        B = _basis(s, a, kind) * np.exp(-s * g['tau'])[:, None]
        cols.append(B)
        meta.append((gi, a, kind))
    return np.hstack(cols) if cols else np.zeros((len(s), 0)), meta


def _ls_real(B, F, W=None):
    """min ‖W·(B·x − F)‖ for real x and complex B, F (F: N_s × N_c)."""
    if W is not None:
        B = B * W[:, None]
        F = F * W[:, None]
    Ar = np.vstack([B.real, B.imag])
    br = np.vstack([F.real, F.imag])
    col = np.linalg.norm(Ar, axis=0)
    col[col == 0] = 1
    return np.linalg.lstsq(Ar / col, br, rcond=None)[0] / col[:, None]


def _fit_h_phase(s, H, groups, W=None):
    """Residue matrices of every group in the phase domain (ULM): one least-squares problem for all elements
    (weights W per sample, or none)."""
    Ns, M, _ = H.shape
    B, meta = _hbasis(s, groups)
    X = _ls_real(B, H.reshape(Ns, M * M), W)
    out, i0 = [], 0
    for gi, a, kind in meta:
        n = len(a)
        r = _residues(X[i0:i0 + n], a, kind).reshape(n, M, M)
        out.append(r)
        i0 += n
    Hf = (B @ X).reshape(Ns, M, M)
    return out, Hf


def _fit_h_fdcm(s, D, groups, W=None):
    """FDCM (Kocar & Mahseredjian 2016): each group's modal contribution matrix D_g on its own basis."""
    Ns = len(s)
    out, Hf = [], 0
    for gi, g in enumerate(groups):
        a = g['a']
        kind = _kinds(a)
        B = _basis(s, a, kind) * np.exp(-s * g['tau'])[:, None]
        M = D[gi].shape[1]
        X = _ls_real(B, D[gi].reshape(Ns, M * M), W)
        out.append(_residues(X, a, kind).reshape(len(a), M, M))
        Hf = Hf + (B @ X).reshape(Ns, M, M)
    return out, Hf


def _ratio(groups, res):
    """The largest residue/pole ratio of the propagation fit (an indicator of cancelling modal groups)."""
    m = 0.0
    for g, R in zip(groups, res):
        for k, q in enumerate(g['a']):
            m = max(m, float(np.abs(R[k]).max() / abs(q)))
    return m


def wb_fit(sw, L, tol=0.002, nmax=40, group=True, fdcm='auto', ratio=1000.0, dc=False, opt=False, log=None, lfw=0.0):
    """The wideband fit of a sweep (see the module text). L in m. Returns the model in its internal form.
    lfw > 0 (4.13): the fit of H weighted by h_weight(sw, lfw), the error of H relative to |1 − H| of the least
    damped mode up to the factor lfw, so that a short section keeps its series impedance at low frequencies."""
    f = sw['f']
    s = 2j * math.pi * f
    M = sw['M']
    Ns = len(f)
    info = {'tol': tol}
    # ---- characteristic admittance: poles from the trace, residues of every element (relative to ‖Y_c‖)
    tr = np.trace(sw['Yc'], axis1=1, axis2=2)
    nrm = np.abs(sw['Yc']).reshape(Ns, -1).max(axis=1)
    iu = np.triu_indices(M)
    Fy = sw['Yc'][:, iu[0], iu[1]]
    n = 4
    best = None
    while True:
        a, *_ = vfit_relaxed(s, tr, start_poles(f[0], f[-1], n), weight=1 / np.abs(tr), d=True)
        r, dd, err = _fit_residues(s, Fy, a, np.repeat((1 / nrm)[:, None], Fy.shape[1], axis=1), d=True)
        if best is None or err[1] < best[3]:
            best = (a, r, dd, err[1])
        if err[1] <= tol or n >= nmax:
            break
        n += 2
    a, r, dd, ey = best
    Ry = np.zeros((len(a), M, M), complex)
    G0 = np.zeros((M, M))
    for c, (i, j) in enumerate(zip(*iu)):
        Ry[:, i, j] = Ry[:, j, i] = r[:, c]
        G0[i, j] = G0[j, i] = dd[c]
    info['yc_err'] = ey
    yc = {'p': a, 'R': Ry, 'D': G0}
    # ---- propagation: delays, groups, poles per group, residues in the phase domain
    taus, f0s, tts = [], [], []
    for k in range(M):
        t, f0, tt = bode_delay(f, sw['Hm'][:, k], sw['g'][:, k], L)
        taus.append(max(t, 1e-12))
        f0s.append(f0)
        tts.append(tt)
    taus, f0s = np.array(taus), np.array(f0s)
    gl = _groups(taus, f0s, group)
    sel = f >= DC_SPLIT if dc and f[0] < DC_SPLIT and (f >= DC_SPLIT).sum() > 10 else np.ones(Ns, bool)
    sh = s[sel]
    Wh = h_weight(sw, lfw)[sel] if lfw and lfw > 1 else None
    werr = (lambda E: float((np.abs(E).reshape(len(sh), -1).max(axis=1) * (1 if Wh is None else Wh)).max()))
    groups = []
    for g in gl:
        tau = float(np.mean(taus[g]))
        Hs = sw['Hm'][sel][:, g].sum(axis=1)
        Fm = Hs * np.exp(sh * tau)
        # the Bode estimate needs the function to decay inside the band; when it does not (its frequency is the top of
        # the band, the upper half of the integral extrapolated) or when asked, the delay is searched around it
        edge = any(f0s[i] >= f[-1] * 0.999 for i in g)
        if opt or edge:
            tau, Fm, _ = _opt_delay(sh, Hs, tau, min(tts[i] for i in g), len(g))
        wg = None if Wh is None else np.clip(1.0 / np.maximum(np.abs(1.0 - sw['Hm'][sel][:, g]).min(axis=1), 1.0 / lfw),
                                             1.0, lfw)
        fit = _fit_scalar(sh, Fm, 4, nmax, tol * len(g) / 2, weight=wg, d=False)
        groups.append({'modes': g, 'tau': tau, 'a': fit[0], 'merr': fit[4] / len(g), 'n': len(fit[0]),
                       'searched': bool(opt or edge), 'w': wg})
    used = 'ulm'
    res, Hf = _fit_h_phase(sh, sw['H'][sel], groups, Wh)
    eh = werr(Hf - sw['H'][sel])
    for _ in range(8):                  # add poles to the group with the worst modal error while the phase fit misses
        if eh <= tol:
            break
        gi = int(np.argmax([g['merr'] / max(len(g['modes']), 1) if g['n'] < nmax else -1 for g in groups]))
        g = groups[gi]
        if g['n'] >= nmax:
            break
        Fm = sw['Hm'][sel][:, g['modes']].sum(axis=1) * np.exp(sh * g['tau'])
        fit = vfit_relaxed(sh, Fm, start_poles(sh[0].imag / 2 / math.pi, sh[-1].imag / 2 / math.pi, g['n'] + 2),
                           weight=g['w'], d=False)
        g.update(a=fit[0], merr=fit[4] / len(g['modes']), n=len(fit[0]))
        res, Hf = _fit_h_phase(sh, sw['H'][sel], groups, Wh)
        eh = werr(Hf - sw['H'][sel])
    rat = _ratio(groups, res)
    if fdcm == 'always' or (fdcm == 'auto' and rat > ratio):
        D = [np.einsum('sik,sk,skj->sij', sw['T'][sel][:, :, g['modes']], sw['Hm'][sel][:, g['modes']],
                       sw['Tinv'][sel][:, g['modes'], :]) for g in groups]
        gsave = [dict(g) for g in groups]
        for g, Dg in zip(groups, D):            # FDCM needs more poles: up to the error of each contribution
            Fm = np.trace(Dg, axis1=1, axis2=2) * np.exp(sh * g['tau'])
            nn = g['n']
            while True:
                a2 = vfit_relaxed(sh, Dg.reshape(len(sh), -1) * np.exp(sh * g['tau'])[:, None],
                                  start_poles(sh[0].imag / 2 / math.pi, sh[-1].imag / 2 / math.pi, nn), weight=g['w'],
                                  d=False)[0]
                g2 = dict(g, a=a2)
                _, Hg = _fit_h_fdcm(sh, [Dg], [g2], Wh)
                e2 = werr(Hg - Dg)
                if e2 <= tol / len(groups) or nn >= nmax:
                    break
                nn += 2
            g.update(a=a2, n=len(a2))
        res2, Hf2 = _fit_h_fdcm(sh, D, groups, Wh)
        rat2 = _ratio(groups, res2)
        eh2 = werr(Hf2 - sw['H'][sel])
        if fdcm == 'always' or (rat2 < rat and eh2 <= max(tol, 2 * eh)):
            res, Hf, eh, rat, used = res2, Hf2, eh2, rat2, 'fdcm'
        else:                                   # the plain fit stays, with its poles
            groups = gsave
    hgroups = [{'tau': g['tau'], 'p': g['a'], 'R': R, 'modes': g['modes']} for g, R in zip(groups, res)]
    if dc and not sel.all():            # Cervantes et al. 2018: the error below DC_SPLIT as an extra group
        lo = ~sel
        sl = s[lo]
        tau1 = min(g['tau'] for g in hgroups)
        Hl = sum(np.exp(-sl * g['tau'])[:, None, None] * rational(sl, *_half(g['p'], g['R'])) for g in hgroups)
        dH = (sw['H'][lo] - Hl) * np.exp(sl * tau1)[:, None, None]
        nlow = min(8, max(2, int(lo.sum()) // 3))
        a3, r3, _, _, _ = vfit_relaxed(sl, dH.reshape(len(sl), -1), start_poles(f[lo][0], f[lo][-1], nlow), d=False)
        hgroups.append({'tau': tau1, 'p': a3, 'R': r3.reshape(len(a3), M, M), 'modes': [], 'dc': True})
    Hall = wb_h(hgroups, s)
    info.update(h_err=float(np.abs(Hall - sw['H']).max()), ratio=rat, method=used,
                h_err_band=float(np.abs(Hall[sel] - sw['H'][sel]).max()))
    if Wh is not None:
        info.update(lfw=float(lfw), h_err_w=eh)
    modes = [{'tau': float(taus[k]), 'tau_true': float(tts[k]), 'f0': float(f0s[k])} for k in range(M)]
    return {'yc': yc, 'groups': hgroups, 'modes': modes, 'info': info}


def _opt_delay(s, Hsum, tau0, ttrue, ng, lo=0.9, hi=1.005, n=12, grid=31):
    """The delay of a group by a search around the Bode estimate (the 'advanced' option of the EMTP fitter; Kocar &
    Mahseredjian 2016 §III: the error is not unimodal, so a grid over [lo·τ, min(hi·τ, τ_true)] at a fixed order, then a
    golden-section refinement between the neighbours of the best point). Returns (τ, H_sum·e^(sτ), error)."""
    f1, f2 = abs(s[0].imag) / 2 / math.pi, abs(s[-1].imag) / 2 / math.pi
    p0 = start_poles(f1, f2, n)

    def err(t):
        return vfit_relaxed(s, Hsum * np.exp(s * t), p0, d=False, iters=6)[4] / ng
    a, b = lo * tau0, max(min(hi * tau0, ttrue), lo * tau0 * 1.001)
    ts = np.linspace(a, b, grid)
    es = np.array([err(t) for t in ts])
    k = int(np.argmin(es))
    x, y = ts[max(k - 1, 0)], ts[min(k + 1, len(ts) - 1)]
    g = (math.sqrt(5) - 1) / 2
    c, d = y - g * (y - x), x + g * (y - x)
    ec, ed = err(c), err(d)
    for _ in range(14):
        if ec < ed:
            y, d, ed = d, c, ec
            c = y - g * (y - x)
            ec = err(c)
        else:
            x, c, ec = c, d, ed
            d = x + g * (y - x)
            ed = err(d)
    t, e = (c, ec) if ec < ed else (d, ed)
    if es[k] < e:
        t, e = ts[k], es[k]
    return float(t), Hsum * np.exp(s * t), float(e)


# ---------------------------------------------------------------- evaluation
def wb_yc(yc, s):
    """Y_c at s (array): N_s × M × M; yc with full poles 'p', residues 'R' and 'D'."""
    s = np.atleast_1d(np.asarray(s, complex))
    out = np.einsum('sk,kij->sij', 1.0 / (s[:, None] - yc['p'][None, :]), yc['R'])
    return out + yc['D'][None]


def wb_h(groups, s):
    s = np.atleast_1d(np.asarray(s, complex))
    out = 0
    for g in groups:
        out = out + np.exp(-s * g['tau'])[:, None, None] * np.einsum('sk,kij->sij', 1.0 / (s[:, None] - g['p'][None, :]),
                                                                     g['R'])
    return out


def nodal(Yc, H):
    """The nodal admittance of the line (2M × 2M) from Y_c and H: M⁻¹·N, M = [I H; H I], N = [Y_c −HY_c; −HY_c Y_c]."""
    M = len(Yc)
    I = np.eye(M)
    A = np.block([[I, H], [H, I]])
    B = np.block([[Yc, -H @ Yc], [-H @ Yc, Yc]])
    return np.linalg.solve(A, B)


def model_parts(model):
    """The model of the solver (JSON) as full poles and residues: (yc, groups)."""
    p, R = _unpack(model['yc'])
    P, RR = _full(p, R)
    yc = {'p': P, 'R': RR, 'D': np.asarray(model['yc']['d'], float)}
    groups = []
    for g in model['groups']:
        p, R = _unpack(g)
        P, RR = _full(p, R)
        groups.append({'tau': float(g['tau']), 'p': P, 'R': RR})
    return yc, groups


def wb_admittance(model, s):
    """The nodal admittance that a WB model represents at the complex frequency s (scalar)."""
    yc, groups = model.get('_parts') or model_parts(model)
    Yc = wb_yc(yc, s)[0]
    H = wb_h(groups, s)[0]
    return nodal(Yc, H)


# ---------------------------------------------------------------- passivity
def passivity(model, fmin, fmax, ppd=30, extra=None):
    """The eigenvalues of the real part (Hermitian part) of the nodal admittance over a sweep from fmin/10 to 10·fmax
    (ppd points per decade, plus the frequencies `extra`). Returns {f, lmin (per frequency, the smallest eigenvalue
    over the largest), passive, worst, bands}."""
    parts = model_parts(model)
    m = dict(model, _parts=parts)
    fs = lc.freqs(fmin / 10, math.log10(fmax / fmin) + 2, ppd)
    if extra is not None:
        fs = np.unique(np.concatenate([fs, np.asarray(extra, float)]))
    lm, worst = [], (0.0, None)
    for f in fs:
        Y = wb_admittance(m, 2j * math.pi * f)
        G = (Y + Y.conj().T) / 2
        ev = np.linalg.eigvalsh(G)
        sc = max(abs(ev).max(), 1e-300)
        lm.append(ev.min() / sc)
        if ev.min() / sc < worst[0]:
            worst = (ev.min() / sc, f)
    lm = np.array(lm)
    bad = lm < -PASSIVE_EPS
    bands = []
    i = 0
    while i < len(fs):
        if bad[i]:
            j = i
            while j + 1 < len(fs) and bad[j + 1]:
                j += 1
            bands.append([float(fs[i]), float(fs[j])])
            i = j + 1
        else:
            i += 1
    # G₀ (Y at infinite frequency) must be positive definite as well
    G0 = np.asarray(model['yc']['d'], float)
    g0min = float(np.linalg.eigvalsh((G0 + G0.T) / 2).min())
    return {'f': fs.tolist(), 'lmin': lm.tolist(), 'passive': bool(not bad.any() and g0min > 0), 'worst': worst[0],
            'fworst': worst[1], 'bands': bands, 'g0min': g0min}


def h_weight(sw, wmax=1e4):
    """The sensitivity of the nodal admittance to an absolute change of H at each sample: 1/min_k |1 − H_k| (the
    least damped mode; Y_s, Y_m and the shunt part all change by about ΔH/(1 − H) while H is near 1, as in a short
    section at low frequencies), at least 1 and at most wmax."""
    d = np.abs(1.0 - sw['Hm']).min(axis=1)
    return np.clip(1.0 / np.maximum(d, 1.0 / wmax), 1.0, wmax)


def _change(sw, yc0, groups0, xy, D, xh, xy2, D2, xh2, ka, hk, nrm, wh=None):
    """The largest change of the fit at the samples between two sets of coefficients (Y_c relative, H absolute or
    weighted by h_weight)."""
    s = 2j * math.pi * sw['f']
    a = wb_yc(_ycfull(yc0, xy, D, ka), s) - wb_yc(_ycfull(yc0, xy2, D2, ka), s)
    b = wb_h(_hfull(groups0, xh, hk), s) - wb_h(_hfull(groups0, xh2, hk), s)
    eb = np.abs(b).reshape(len(s), -1).max(axis=1)
    if wh is not None:
        eb = eb * wh
    return max(float((np.abs(a).reshape(len(s), -1).max(axis=1) / nrm).max()), float(eb.max()))


def enforce_passivity(model, sw, iters=24, delta=1e-7, step=5e-4, log=None, wmax=1e3):
    """Perturbs the residues of Y_c (symmetric) and of H (and G₀) so that the real part of the nodal admittance has no
    negative eigenvalues, with the least change of Y_c (relative to ‖Y_c‖) and of H at the samples of the fit.
    Linearized constraints at the minima of the violating eigenvalues, the quadratic problem solved through its dual
    (bounded least squares), repeated until the sweep is passive (the robust iterations of Gustavsen 2008).
    4.13: the change of H is weighted by h_weight, so that the perturbation keeps the relative accuracy of the nodal
    admittance (the aim of the modal perturbation of the same paper): without it a short section loses its series
    impedance at 50 Hz while |ΔH| stays inside the tolerance."""
    from scipy.optimize import lsq_linear
    yc0, groups0 = model_parts(model)
    M = model['M']
    f = sw['f']
    s = 2j * math.pi * f
    Ns = len(f)
    nrm = np.abs(sw['Yc']).reshape(Ns, -1).max(axis=1)
    # parameters: Y_c — per pole (real basis) × upper triangle, plus G₀ upper triangle; H — per pole × M²
    ka = _kinds(yc0['p'])
    By = _basis(s, yc0['p'], ka)
    xy = _coeffs(yc0['R'], ka)                       # (Nyc, M, M) real coefficients
    hk = [_kinds(g['p']) for g in groups0]
    Bh = [_basis(s, g['p'], k) * np.exp(-s * g['tau'])[:, None] for g, k in zip(groups0, hk)]
    xh = [_coeffs(g['R'], k) for g, k in zip(groups0, hk)]
    iu = np.triu_indices(M)
    mult = np.where(iu[0] == iu[1], 1.0, 2.0)
    # the Gram matrices (the change of a function at the samples per unit coefficient), common to all elements
    wh = h_weight(sw, wmax)
    Gy = _gram(np.hstack([By, np.ones((Ns, 1))]) / nrm[:, None])
    Gh = _gram(np.hstack(Bh) * wh[:, None]) if Bh else np.zeros((0, 0))
    Gy_i = np.linalg.inv(Gy + 1e-12 * np.trace(Gy) / len(Gy) * np.eye(len(Gy)))
    Gh_i = np.linalg.inv(Gh + 1e-12 * np.trace(Gh) / max(len(Gh), 1) * np.eye(len(Gh))) if len(Gh) else Gh
    D = np.asarray(model['yc']['d'], float).copy()
    rep = []
    for it in range(iters):
        cur = _rebuild(model, yc0, groups0, xy, D, xh, ka, hk)
        P = passivity(cur, f[0], f[-1], 30)
        rep.append(P['worst'])
        if P['passive']:
            return cur, {'iters': it, 'passive': True, 'worst': rep}
        fv = _minima(P)
        rows, rhs = [], []
        for fq in fv:
            sq = 2j * math.pi * fq
            Yc = wb_yc(_ycfull(yc0, xy, D, ka), sq)[0]
            Hm = wb_h(_hfull(groups0, xh, hk), sq)[0]
            Yn = nodal(Yc, Hm)
            Gm = (Yn + Yn.conj().T) / 2
            ev, V = np.linalg.eigh(Gm)
            sc = abs(ev).max()
            Amat = np.block([[np.eye(M), Hm], [Hm, np.eye(M)]])
            for q in range(len(ev)):
                if ev[q] >= delta * sc:
                    continue
                v = V[:, q]
                u = np.linalg.solve(Amat.conj().T, v)       # uᴴ = vᴴ·A⁻¹
                rows.append(_grad_row(sq, v, u, Yc, Hm, Yn, yc0, ka, groups0, hk, M, iu))
                rhs.append(delta * sc - ev[q])
        # G₀ positive definite (Y at s → ∞ is diag(G₀, G₀))
        e0, V0 = np.linalg.eigh(D)
        for q in range(M):
            if e0[q] < delta * abs(e0).max():
                v = V0[:, q]
                row = _zero_row(len(ka), groups0, M, iu)
                row['D'] = np.outer(v, v)[iu] * mult
                rows.append(row)
                rhs.append(delta * abs(e0).max() - e0[q])
        if not rows:
            return cur, {'iters': it, 'passive': P['passive'], 'worst': rep}
        # dual of min ½xᵀQx s.t. C·x ≥ d with block-diagonal Q (Kronecker structure of the Gram matrices)
        C = [_flatten_row(r, len(ka), [len(k) for k in hk], M, iu) for r in rows]
        C = np.array(C)
        Qi_C = np.array([_apply_qinv(c, Gy_i, Gh_i, len(ka), [len(k) for k in hk], M, iu, mult) for c in C])
        K = C @ Qi_C.T
        K = (K + K.T) / 2 + 1e-14 * np.trace(K) * np.eye(len(K))
        Lc = np.linalg.cholesky(K)
        d = np.array(rhs)
        mu = lsq_linear(Lc.T, np.linalg.solve(Lc, d), bounds=(0, np.inf)).x
        x = Qi_C.T @ mu
        # a step that changes the fit by more than `step` (near a resonance the linearization is poor) is shortened;
        # the next iteration continues from there
        xy2, D2, xh2 = _apply(x, xy, D, xh, len(ka), [len(k) for k in hk], M, iu)
        dch = _change(sw, yc0, groups0, xy, D, xh, xy2, D2, xh2, ka, hk, nrm, wh)
        alpha = min(1.0, step / dch) if dch > 0 else 1.0
        xy, D, xh = _apply(alpha * x, xy, D, xh, len(ka), [len(k) for k in hk], M, iu)
    cur = _rebuild(model, yc0, groups0, xy, D, xh, ka, hk)
    P = passivity(cur, f[0], f[-1], 30)
    return cur, {'iters': iters, 'passive': P['passive'], 'worst': rep + [P['worst']]}


def _coeffs(R, kind):
    """Real coefficients of the basis from complex residues (N × M × M)."""
    x = np.zeros(R.shape)
    for n in range(len(kind)):
        if kind[n] == 0:
            x[n] = R[n].real
        elif kind[n] == 1:
            x[n] = R[n].real
            x[n + 1] = R[n].imag
    return x


def _gram(B):
    Ar = np.vstack([B.real, B.imag])
    return Ar.T @ Ar


def _ycfull(yc0, xy, D, ka):
    return {'p': yc0['p'], 'R': _residues(xy, yc0['p'], ka), 'D': D}


def _hfull(groups0, xh, hk):
    return [{'tau': g['tau'], 'p': g['p'], 'R': _residues(x, g['p'], k)} for g, x, k in zip(groups0, xh, hk)]


def _rebuild(model, yc0, groups0, xy, D, xh, ka, hk):
    out = dict(model)
    out.pop('_parts', None)
    yc = _ycfull(yc0, xy, D, ka)
    p, R = _half(yc['p'], yc['R'])
    out['yc'] = dict(_pack(p, R), d=((D + D.T) / 2).tolist())
    gs = []
    for g0, g in zip(model['groups'], _hfull(groups0, xh, hk)):
        p, R = _half(g['p'], g['R'])
        gs.append(dict(g0, **_pack(p, R)))
    out['groups'] = gs
    return out


def _minima(P):
    """Frequencies of the minima of the smallest eigenvalue inside each violating band (and the band ends)."""
    f = np.array(P['f'])
    lm = np.array(P['lmin'])
    out = []
    for a, b in P['bands']:
        m = (f >= a) & (f <= b)
        idx = np.nonzero(m)[0]
        out.append(float(f[idx[np.argmin(lm[idx])]]))
        if len(idx) > 2:
            out += [float(f[idx[0]]), float(f[idx[-1]])]
    return sorted(set(out))


def _zero_row(ny, groups0, M, iu):
    return {'yc': np.zeros((ny, len(iu[0]))), 'D': np.zeros(len(iu[0])),
            'h': [np.zeros((len(g['p']), M, M)) for g in groups0]}


def _grad_row(s, v, u, Yc, H, Yn, yc0, ka, groups0, hk, M, iu):
    """dλ/dθ = Re(uᴴ·(dN − dM·Y)·v) for every real coefficient θ (see the module text)."""
    v1, v2 = v[:M], v[M:]
    u1, u2 = u[:M], u[M:]
    Y11, Y12, Y21, Y22 = Yn[:M, :M], Yn[:M, M:], Yn[M:, :M], Yn[M:, M:]
    # Y_c element (r, c): dY_c = φ·E_rc → φ·[ū1_r v1_c + ū2_r v2_c − (conj(Hᴴu1))_r v2_c − (conj(Hᴴu2))_r v1_c]
    w1 = np.conj(H.conj().T @ u1)
    w2 = np.conj(H.conj().T @ u2)
    Sy = np.outer(np.conj(u1), v1) + np.outer(np.conj(u2), v2) - np.outer(w1, v2) - np.outer(w2, v1)
    Sy = Sy + Sy.T          # the symmetric element (r, c) = (c, r); the diagonal is counted twice
    Sy[np.diag_indices(M)] /= 2
    By = _basis(np.array([s]), yc0['p'], ka)[0]
    row = {'yc': np.real(By[:, None] * Sy[iu][None, :]), 'D': np.real(Sy[iu])}
    # H element (r, c): dH = ψ·E_rc → −ψ·[ū1_r a_c + ū2_r b_c], a = Y21 v1 + (Y_c + Y22) v2, b = (Y_c + Y11) v1 + Y12 v2
    a = Y21 @ v1 + (Yc + Y22) @ v2
    b = (Yc + Y11) @ v1 + Y12 @ v2
    Sh = -(np.outer(np.conj(u1), a) + np.outer(np.conj(u2), b))
    row['h'] = []
    for g, k in zip(groups0, hk):
        Bg = _basis(np.array([s]), g['p'], k)[0] * np.exp(-s * g['tau'])
        row['h'].append(np.real(Bg[:, None, None] * Sh[None, :, :]))
    return row


def _flatten_row(r, ny, nh, M, iu):
    parts = [np.concatenate([r['yc'], r['D'][None, :]], axis=0).T.ravel()]      # element-major: (elem, pole+D)
    if nh:
        H = np.concatenate(r['h'], axis=0)                                      # (Nh, M, M)
        parts.append(H.reshape(sum(nh), M * M).T.ravel())                      # (elem, pole)
    return np.concatenate(parts)


def _apply_qinv(c, Gy_i, Gh_i, ny, nh, M, iu, mult):
    ne = len(iu[0])
    k = ny + 1
    cy = c[:ne * k].reshape(ne, k)
    oy = (cy @ Gy_i.T) / mult[:, None]           # Q = diag(mult)⊗G_y (the off-diagonal elements count twice)
    out = [oy.ravel()]
    if nh:
        nH = sum(nh)
        ch = c[ne * k:].reshape(M * M, nH)
        out.append((ch @ Gh_i.T).ravel())
    return np.concatenate(out)


def _apply(x, xy, D, xh, ny, nh, M, iu):
    ne = len(iu[0])
    k = ny + 1
    dy = x[:ne * k].reshape(ne, k)
    xy = xy.copy()
    D = D.copy()
    for e, (i, j) in enumerate(zip(*iu)):
        xy[:, i, j] += dy[e, :ny]
        if i != j:
            xy[:, j, i] += dy[e, :ny]
        D[i, j] += dy[e, ny]
        if i != j:
            D[j, i] += dy[e, ny]
    if nh:
        nH = sum(nh)
        dh = x[ne * k:].reshape(M * M, nH).T.reshape(nH, M, M)
        out, i0 = [], 0
        for g, n in zip(xh, nh):
            out.append(g + dh[i0:i0 + n])
            i0 += n
        xh = out
    return xy, D, xh


# ---------------------------------------------------------------- the model of the solver
def wb_model(data, length=None, fmin=0.01, decades=9, ppd=10, tol=0.002, nmax=40, group=True, fdcm='auto',
             ratio=1000.0, dc=False, opt=False, passive='check', curves=False, lfw=100.0):
    """The WB model of a line or cable (JSON for the solver, type 'wb'), fitted over fmin … fmin·10^decades (or the
    frequencies of a table of Z′, Y′). passive: 'check' (as the EMTP: a sweep, the result in the report), 'enforce'
    (the residues perturbed until passive), 'none'. lfw: the weight of the fit of H at low frequencies (wb_fit; 0 or 1:
    none, the plain ULM)."""
    if fdcm not in FDCM_KINDS:
        raise WBError(f'άγνωστη επιλογή FDCM «{fdcm}»')
    if passive not in PASSIVE_KINDS:
        raise WBError(f'άγνωστη επιλογή παθητικότητας «{passive}»')
    L = (lc._f(data.get('length'), 1.0) if length is None else length) * 1000.0
    fs = np.asarray(data['zyfile']['f'], float) if data.get('zyfile') else lc.freqs(fmin, decades, ppd)
    if len(fs) < 12:
        raise WBError('η προσαρμογή wideband θέλει τουλάχιστον 12 συχνότητες (το EMTP προτείνει 40 και πάνω)')
    sw = _sweep(data, fs, L)
    # the weighted fit (lfw) asks for more poles; when they cancel (a residue/pole ratio above the threshold of the cable
    # correction, even after it) or the fit misses the tolerance, the weight is lowered (÷3) down to the plain ULM
    lf = float(lfw or 0)
    while True:
        fit = wb_fit(sw, L, tol=tol, nmax=nmax, group=group, fdcm=fdcm, ratio=ratio, dc=dc, opt=opt, lfw=lf)
        inf = fit['info']
        if lf <= 1 or (inf['ratio'] <= ratio and inf['h_err'] <= 2 * tol):
            break
        lf = lf / 3 if lf / 3 > 3 else 0.0
    fit['info']['lfw'] = lf
    model = to_json(fit, sw['M'], L, fs)
    _yn_info(model, sw)
    model['opts'] = {'tol': tol, 'nmax': nmax, 'group': bool(group), 'fdcm': fdcm, 'ratio': ratio, 'dc': bool(dc),
                     'opt': bool(opt), 'passive': passive, 'lfw': float(lfw or 0)}
    if passive in ('check', 'enforce'):
        P = passivity(model, fs[0], fs[-1])
        model['passive'] = {'passive': P['passive'], 'worst': P['worst'], 'fworst': P['fworst'], 'bands': P['bands'],
                            'g0min': P['g0min']}
        if passive == 'enforce' and not P['passive']:
            # the weight of the change of H at low frequencies (h_weight) from large to small: the first that gives a
            # passive model within the tolerance keeps the most of the nodal admittance of a short section
            e0 = errors(model, sw, per_f=True)
            last = None
            for wmax in ENFORCE_WMAX:
                m2, rep = enforce_passivity(model, sw, step=max(tol / 4, 1e-5), wmax=wmax)
                e = errors(m2, sw, per_f=True)
                # kept only when passive, within twice the tolerance of the fit and without a worse nodal admittance at
                # any sample (otherwise the model stays as fitted and the report says so: change the band, the
                # samples or the tolerance, as the EMTP)
                nod = all(a <= 1.5 * b + 2 * tol for a, b in zip(e['yn_f'], e0['yn_f']))
                ok = max(e['yc'], e['h']) <= max(2 * tol, 1.5 * max(model['fit']['yc_err'], model['fit']['h_err']))
                last = e
                if rep['passive'] and nod and ok:
                    P2 = passivity(m2, fs[0], fs[-1])
                    m2['fit'] = dict(m2['fit'], yc_err=e['yc'], h_err=e['h'], enforced=True, before=model['passive'],
                                     enforce_w=wmax)
                    _yn_info(m2, sw, e)
                    m2['passive'] = {'passive': P2['passive'], 'worst': P2['worst'], 'fworst': P2['fworst'],
                                     'bands': P2['bands'], 'g0min': P2['g0min'], 'iters': rep['iters']}
                    model = m2
                    break
            else:
                model['fit'] = dict(model['fit'], enforced=False, enforce_err=max(last['yc'], last['h']),
                                    enforce_yn=last['yn'])
        if curves:
            P = passivity(model, fs[0], fs[-1])
    if curves:
        e = errors(model, sw, per_f=True)
        model['curves'] = {'f': fs.tolist(), 'yc_err': e['yc_f'], 'h_err': e['h_f'], 'yn_err': e['yn_f'],
                           'Hm': np.abs(sw['Hm']).T.tolist(), 'pf': P['f'] if passive != 'none' else [],
                           'plmin': P['lmin'] if passive != 'none' else []}
    return model


ENFORCE_WMAX = (1e3, 1e2, 30.0, 1.0)
YN_BANDS = ((0.0, 1.0), (1.0, 100.0), (100.0, 1e4), (1e4, math.inf))


def _yn_info(model, sw, e=None):
    """The nodal error of the model in its fit info: the largest and per band of frequencies (below 1 Hz a short
    section is ill-conditioned: |1 − H| is then smaller than the error of the fit of H)."""
    e = e or errors(model, sw, per_f=True)
    f, yn = np.asarray(sw['f'], float), np.array(e['yn_f'])
    model['fit']['yn_err'] = float(yn.max())
    model['fit']['yn_bands'] = [[a, b if math.isfinite(b) else None, float(yn[(f >= a) & (f < b)].max())]
                                for a, b in YN_BANDS if ((f >= a) & (f < b)).any()]


def to_json(fit, M, L, fs):
    yc = fit['yc']
    p, R = _half(yc['p'], yc['R'])
    groups = []
    for g in fit['groups']:
        gp, gR = _half(g['p'], g['R'])
        q = dict(_pack(gp, gR), tau=float(g['tau']), modes=[int(k) for k in g['modes']])
        if g.get('dc'):
            q['dc'] = True
        groups.append(q)
    taus = [m['tau'] for m in fit['modes']]
    return {'type': 'wb', 'M': M, 'length': L / 1000.0, 'fmin': float(fs[0]), 'fmax': float(fs[-1]),
            'yc': dict(_pack(p, R), d=yc['D'].tolist()), 'groups': groups,
            'modes': fit['modes'], 'Ti': np.eye(M).tolist(), 'tau_min': float(min(g['tau'] for g in groups)),
            'fit': {k: v for k, v in fit['info'].items()}, 'npoles': {'yc': len(p), 'h': [len(g['p']) for g in groups]}}


def errors(model, sw, per_f=False):
    """Max errors of the model against the sweep: Y_c relative to ‖Y_c‖ at each frequency, H absolute, and (4.13) the
    nodal admittance relative to its largest element (what a short section at low frequencies is sensitive to)."""
    yc, groups = model_parts(model)
    s = 2j * math.pi * sw['f']
    Ns = len(s)
    nrm = np.abs(sw['Yc']).reshape(Ns, -1).max(axis=1)
    Yf, Hf = wb_yc(yc, s), wb_h(groups, s)
    ey = np.abs(Yf - sw['Yc']).reshape(Ns, -1).max(axis=1) / nrm
    eh = np.abs(Hf - sw['H']).reshape(Ns, -1).max(axis=1)
    en = np.zeros(Ns)
    for k in range(Ns):
        Ye = nodal(sw['Yc'][k], sw['H'][k])
        en[k] = np.abs(nodal(Yf[k], Hf[k]) - Ye).max() / np.abs(Ye).max()
    out = {'yc': float(ey.max()), 'h': float(eh.max()), 'yn': float(en.max())}
    if per_f:
        out['yc_f'] = ey.tolist()
        out['h_f'] = eh.tolist()
        out['yn_f'] = en.tolist()
    return out


# ---------------------------------------------------------------- the model file of the EMTP (<device>_WB.mod)
def read_wb_mod(text, length=None):
    """A wideband model file of the EMTP (WB fitter output): Y_c poles and residues per row, D, then the delay groups of
    H with their poles and residues. Returns the model of the solver (type 'wb'). The length is not in the file."""
    L = [x.strip() for x in str(text).splitlines()]
    L = [x for x in L if x]
    try:
        k0 = next(i for i, x in enumerate(L) if x.lower().startswith('number of'))
        n = int(float(L[k0 + 1]))
        i = next(i for i, x in enumerate(L) if x.lower().startswith('residues and poles')) + 1
        num = lambda j: float(L[j].replace('D', 'E'))
        rows_p, rows_r = [], []
        for r in range(n):
            N = int(num(i))
            i += 1
            p = np.zeros(N, complex)
            R = np.zeros((N, n), complex)
            for k in range(N):
                p[k] = complex(num(i), num(i + 1))
                i += 2
                for c in range(n):
                    R[k, c] = complex(num(i), num(i + 1))
                    i += 2
            rows_p.append(p)
            rows_r.append(R)
        Dm = np.array([num(i + j) for j in range(n * n)]).reshape(n, n)
        i += n * n
        if not L[i].lower().startswith('fitting parameters for the propagation'):
            raise WBError('λείπει η ενότητα της συνάρτησης διάδοσης')
        G = int(num(i + 2))
        i += 4
        tau = np.array([num(i + j) for j in range(G)])
        i += G
        if L[i].lower() != 'poles':
            raise WBError('λείπουν οι πόλοι της συνάρτησης διάδοσης')
        i += 1
        pH = []
        for g in range(G):
            N = int(num(i))
            i += 1
            v = np.array([num(i + j) for j in range(2 * N)])
            i += 2 * N
            pH.append(v[0::2] + 1j * v[1::2])
        if L[i].lower() != 'residues':
            raise WBError('λείπουν τα υπόλοιπα της συνάρτησης διάδοσης')
        i += 1
        RH = []
        for g in range(G):
            N = len(pH[g])
            v = np.array([num(i + j) for j in range(2 * n * n * N)])
            i += 2 * n * n * N
            v = v[0::2] + 1j * v[1::2]
            A = v.reshape((n, n, N))               # file order: column, row, pole
            RH.append(np.transpose(A, (2, 1, 0)))  # (pole, row, column)
    except (StopIteration, IndexError, ValueError) as ex:
        raise WBError(f'μη αναμενόμενη μορφή αρχείου WB του EMTP ({ex})')
    p0 = rows_p[0]
    if not all(len(p) == len(p0) and np.allclose(p, p0, rtol=1e-12, atol=0) for p in rows_p):
        raise WBError('οι πόλοι του Y_c διαφέρουν ανά γραμμή· δεν υποστηρίζεται ακόμη')
    Ry = np.transpose(np.array(rows_r), (1, 0, 2))      # (pole, row, column)
    yp, yR = _half(p0, Ry)
    groups = []
    for g in range(G):
        gp, gR = _half(pH[g], RH[g])
        groups.append(dict(_pack(gp, gR), tau=float(tau[g]), modes=[]))
    M = n
    out = {'type': 'wb', 'M': M, 'length': length, 'yc': dict(_pack(yp, yR), d=Dm.tolist()), 'groups': groups,
           'modes': [{'tau': float(t)} for t in np.repeat(tau, int(math.ceil(M / G)))[:M]], 'Ti': np.eye(M).tolist(),
           'tau_min': float(tau.min()), 'fit': {'source': 'EMTP'}, 'npoles': {'yc': len(yp), 'h': [len(g['p']) for g in groups]}}
    return out


def import_model(text, data, length_km, passive='check'):
    """A model file of the EMTP as the model of the solver, with its accuracy against the line data (the same Z′, Y′:
    a table from Line/Cable Data, or the geometry) and its passivity, as the report of our own fit."""
    m = read_wb_mod(text, length_km)
    fit = m['fit']
    try:
        r = fit_report(m, data, length_km)
        fit.update(h_err=r['h'], yc_err=r['yc'], bands=r['bands'])
        fs = np.asarray(r['f'])
        m['fmin'], m['fmax'] = float(fs[0]), float(fs[-1])
        _yn_info(m, {'f': fs}, {'yn_f': r['yn_f']})
        curves = {'f': r['f'], 'yc_err': r['yc_f'], 'h_err': r['h_f'], 'yn_err': r['yn_f'], 'Hm': [], 'pf': [], 'plmin': []}
    except (lc.LineError, ValueError, np.linalg.LinAlgError):
        fs = None
        curves = None
    if passive != 'none':
        f1, f2 = (m.get('fmin') or 0.01), (m.get('fmax') or 1e6)
        P = passivity(m, f1, f2)
        m['passive'] = {'passive': P['passive'], 'worst': P['worst'], 'fworst': P['fworst'], 'bands': P['bands'],
                        'g0min': P['g0min']}
        if curves is not None:
            curves.update(pf=P['f'], plmin=P['lmin'])
    if curves is not None:
        m['curves'] = curves
    return m


def write_wb_mod(model):
    """The model in the layout of the EMTP wideband model file (every pole and its conjugate written out)."""
    yc, groups = model_parts(model)
    M = model['M']
    o = ['Fitting parameters for the char. admittance:', 'Number of. conductors:', f' {M}', 'Residues and Poles:']
    fmt = lambda x: f'{x: .12E}'
    for r in range(M):
        o.append(str(len(yc['p'])))
        for k, q in enumerate(yc['p']):
            o += [fmt(q.real), fmt(q.imag)]
            for c in range(M):
                o += [fmt(yc['R'][k, r, c].real), fmt(yc['R'][k, r, c].imag)]
    o += [fmt(x) for x in yc['D'].ravel()]
    o += ['Fitting parameters for the propagation function', 'N.o. of delay groups:', f' {len(groups)}', 'Time Delays']
    o += [fmt(g['tau']) for g in groups]
    o.append('Poles')
    for g in groups:
        o.append(str(len(g['p'])))
        for q in g['p']:
            o += [fmt(q.real), fmt(q.imag)]
    o.append('Residues')
    for g in groups:
        R = np.transpose(g['R'], (2, 1, 0))         # (column, row, pole)
        for v in R.ravel():
            o += [fmt(v.real), fmt(v.imag)]
    return '\n'.join(o) + '\n'


# ---------------------------------------------------------------- checks of a cable model (sheath voltages)
def sheath_check(Yn, length_km, cores, sheaths):
    """For three single-core cables (cores and sheaths: three indices each) and the nodal admittance of the line:
    the standing sheath voltage per A and km with a balanced 1 A in the cores, the sheaths grounded at the sending end
    and open at the receiving end, the cores shorted at the receiving end (a minor section of cross-bonding or a
    single-point bonded section), and the sheath current ratio |I_s/I| with solid bonding (sheaths grounded at both
    ends). Other conductors are grounded at both ends. Returns {'E': [V/(A·km)] ×3, 'Is': [ratio] ×3}."""
    n = len(Yn) // 2
    a = cmath.exp(2j * math.pi / 3)
    Ic = np.array([1, a * a, a])
    u = list(cores) + [n + k for k in sheaths]
    V = np.linalg.solve(Yn[np.ix_(u, u)], np.concatenate([Ic, np.zeros(len(sheaths))]))
    E = np.abs(V[len(cores):]) / length_km
    Vc = np.linalg.solve(Yn[np.ix_(cores, cores)], Ic)
    Is = np.abs(Yn[np.ix_(sheaths, cores)] @ Vc)
    return {'E': E.tolist(), 'Is': Is.tolist()}


def fit_report(model, data, length=None, bands=((0.01, 100), (100, 1e3), (1e3, 1e4), (1e4, 1e5), (1e5, 1e6), (1e6, 1e7))):
    """The accuracy of a WB model (ours or one read from the EMTP) against the exact Y_c, H of the line data at their
    frequencies: max |H_fit − H| and the relative error of Y_c per band of frequencies."""
    L = (lc._f(data.get('length'), 1.0) if length is None else length) * 1000.0
    fs = np.asarray(data['zyfile']['f'], float) if data.get('zyfile') else lc.freqs(model.get('fmin', 0.01), 7, 10)
    sw = _sweep(data, fs, L)
    e = errors(model, sw, per_f=True)
    out = []
    for a, b in bands:
        m = (fs >= a) & (fs < b)
        if m.any():
            out.append({'band': [a, b], 'h': float(np.max(np.array(e['h_f'])[m])),
                        'yc': float(np.max(np.array(e['yc_f'])[m])), 'yn': float(np.max(np.array(e['yn_f'])[m]))})
    return {'h': e['h'], 'yc': e['yc'], 'yn': e['yn'], 'bands': out, 'f': fs.tolist(), 'h_f': e['h_f'], 'yc_f': e['yc_f'],
            'yn_f': e['yn_f']}
