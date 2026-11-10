"""Parameters of impulse sources from what the user wants to give (3.15, ROADMAP §35).

A pure-Python port of the two MATLAB tools of the reference material (branch ref-materials):
* Lightning Impulse Manager 1.2.0: Heidler current i = (I_m/η)·(t/τ₁)ⁿ/(1 + (t/τ₁)ⁿ)·e^(−t/τ₂) from T1/T2 and I_m,
  with η the maximum of the shape (AutoH, the peak is I_m) or given (FixedH).
* Voltage Impulse GUI 1.1: v = V_p·K·(e^(−αt) − e^(−βt)) from X/Y and V_p, on three bases (IEC T1/T2, Tp/T2, t10–90/t50),
  with the profiles and tolerances of IEC 60060-1 as that tool has them, and a PASS/FAIL check.

The times are measured on the analytic waveform (golden section for the peak, bisection for the crossings), not on
samples, and the fit is Newton on the logarithms of the time constants. No numpy: it runs in the app's Pyodide as well.
The results match the tools' own CSV files (tests/test_impulse.py), and the app's sources take them as they are
(shape 'direct': τ₁, τ₂, η for the current, α, β, K for the voltage).
"""
import csv
import math
from pathlib import Path

# ---------------------------------------------------------------- shapes and their times
def heidler(t, tau1, tau2, n=10):
    if t <= 0:
        return 0.0
    x = (t / tau1) ** n
    return x / (1 + x) * math.exp(-t / tau2)


def dexp(t, alpha, beta):
    return math.exp(-alpha * t) - math.exp(-beta * t) if t > 0 else 0.0


def _peak(f, a, b):
    N, tp, fp = 800, a, 0.0
    for k in range(N + 1):
        t = a * (b / a) ** (k / N)
        v = f(t)
        if v > fp:
            fp, tp = v, t
    lo, hi = tp * (b / a) ** (-1 / N), tp * (b / a) ** (1 / N)
    for _ in range(70):
        m1, m2 = lo + (hi - lo) * .381966, lo + (hi - lo) * .618034
        if f(m1) < f(m2):
            lo = m1
        else:
            hi = m2
    tp = (lo + hi) / 2
    return tp, f(tp)


def _cross(f, level, x0, x1):
    g0 = f(x0) - level
    for _ in range(90):
        m = (x0 + x1) / 2
        if (f(m) - level > 0) == (g0 > 0):
            x0 = m
        else:
            x1 = m
    return (x0 + x1) / 2


def times(f, t_lo, t_hi):
    """Peak and crossings of a smooth unipolar shape: tp, peak, t10, t30, t90, t50 (tail)."""
    tp, fp = _peak(f, t_lo, t_hi)
    c = {q: _cross(f, q * fp, t_lo, tp) for q in (.1, .3, .9)}
    return {'tp': tp, 'peak': fp, 't10': c[.1], 't30': c[.3], 't90': c[.9], 't50': _cross(f, .5 * fp, tp, t_hi)}


def lightning_times(m):
    """Lightning-current times (IEC 62305-1, as the Lightning Impulse Manager): T1 = 1.25·(t90 − t10),
    virtual origin t10 − 0.1·T1, T2 from there to 50 % on the tail."""
    T1 = 1.25 * (m['t90'] - m['t10'])
    o = m['t10'] - .1 * T1
    return {**m, 'T1': T1, 'O1': o, 'T2': m['t50'] - o}


def voltage_times(m):
    """Impulse-voltage times (IEC 60060-1): T1 = (t90 − t30)/0.6, virtual origin t30 − 0.3·T1, T2 from it; also Tp
    (time to peak), t10–90 and t50 from t = 0 (the other two bases of the Voltage Impulse GUI)."""
    T1 = (m['t90'] - m['t30']) / .6
    o = m['t30'] - .3 * T1
    return {**m, 'T1': T1, 'O1': o, 'T2': m['t50'] - o, 'Tp': m['tp'], 't10_90': m['t90'] - m['t10']}


# ---------------------------------------------------------------- Newton on the logarithms
def _solve2(res, x, tol=1e-12, it=60):
    r = res(x)
    for _ in range(it):
        if math.hypot(*r) < tol:
            break
        d = 1e-7
        J = []
        for j in range(2):
            y = list(x)
            y[j] += d
            q = res(y)
            J.append(((q[0] - r[0]) / d, (q[1] - r[1]) / d))
        det = J[0][0] * J[1][1] - J[1][0] * J[0][1]
        if not det:
            break
        dx = [-(r[0] * J[1][1] - r[1] * J[1][0]) / det, -(J[0][0] * r[1] - J[0][1] * r[0]) / det]
        s = max(1.0, math.hypot(*dx))
        dx = [v / s for v in dx]
        lam = 1.0
        for _ in range(30):
            y = [x[0] + lam * dx[0], x[1] + lam * dx[1]]
            q = res(y)
            if math.hypot(*q) < math.hypot(*r):
                break
            lam /= 2
        x, r = y, q
    return x, math.hypot(*r)


# ---------------------------------------------------------------- Heidler (Lightning Impulse Manager)
def fit_heidler(T1, T2, Im, n=10, H='auto', H_value=None):
    """τ₁, τ₂ (s) for front time T1 and time to half value T2 (s) of a Heidler current with exponent n.
    H='auto': η = the maximum of the shape, so the peak is I_m (AutoH). H='fixed': η = H_value (FixedH); the peak is
    then I_m·max/η. Returns the parameters of the app's source (shape 'direct') and the check of the times."""
    n = float(n)

    def meas(tau1, tau2):
        return lightning_times(times(lambda t: heidler(t, tau1, tau2, n), min(tau1, tau2) * 1e-3, max(tau1, tau2) * 30))

    def res(x):
        m = meas(math.exp(x[0]), math.exp(x[1]))
        return [math.log(m['T1'] / T1), math.log(m['T2'] / T2)]

    x, err = _solve2(res, [math.log(T1 * 1.9), math.log(T2 * 1.39)])
    tau1, tau2 = math.exp(x[0]), math.exp(x[1])
    m = meas(tau1, tau2)
    eta = m['peak'] if str(H).lower().startswith('a') else float(H_value)
    peak = Im / eta * m['peak']
    return {'tau1': tau1, 'tau2': tau2, 'eta': eta, 'n': n, 'Im': Im, 'H_mode': 'AutoH' if str(H).lower().startswith('a') else 'FixedH',
            'T1': m['T1'], 'T2': m['T2'], 'peak': peak, 'T1_err_pct': 100 * (m['T1'] / T1 - 1), 'T2_err_pct': 100 * (m['T2'] / T2 - 1),
            'peak_err_pct': 100 * (peak / Im - 1) if Im else 0.0, 'ok': err < 1e-8,
            'params': {'shape': 'direct', 'model': 'heidler', 'tau1': tau1, 'tau2': tau2, 'eta': eta, 'n': n, 'Ipk': Im}}


# ---------------------------------------------------------------- double exponential (Voltage Impulse GUI)
PROFILES = {
    'IEC2025_LI': {'display': 'IEC 60060-1:2025 full lightning impulse 1.2/50 us', 'method': 'IEC_T1_T2', 'X': 1.2e-6, 'Y': 50e-6,
                   'tol': {'peak': 3, 'T1': 30, 'T2': 20}},
    'IEC2025_SI': {'display': 'IEC 60060-1:2025 switching impulse 170/2500 us', 'method': 'IEC_T1_T2', 'X': 170e-6, 'Y': 2500e-6,
                   'tol': {'peak': 3, 'T1': 20, 'Tp': 20, 'T2': 60}, 'Tp': 250e-6},
    'IEC2010_SI_LEGACY': {'display': 'Legacy switching impulse 250/2500 us (Tp/T2)', 'method': 'TP_T2', 'X': 250e-6, 'Y': 2500e-6,
                          'tol': {'peak': 3, 'Tp': 20, 'T2': 60}},
    'CUSTOM': {'display': 'Custom smooth double-exponential impulse', 'method': 'IEC_T1_T2', 'X': None, 'Y': None, 'tol': {'peak': 3, 'X': 20, 'Y': 20}},
}
METHODS = ('IEC_T1_T2', 'TP_T2', 'T10_90_T50')


def _xy(m, method):
    """The pair the fit aims at: T1/T2 (IEC), Tp/t50 (both from t = 0), or t10–90/t50."""
    if method == 'TP_T2':
        return m['Tp'], m['t50']
    if method == 'T10_90_T50':
        return m['t10_90'], m['t50']
    return m['T1'], m['T2']


def voltage_measure(alpha, beta):
    return voltage_times(times(lambda t: dexp(t, alpha, beta), 1e-3 / beta, 30 / alpha))


def fit_voltage(X, Y, Vp, method='IEC_T1_T2', profile=None):
    """α, β (1/s) and K of v = V_p·K·(e^(−αt) − e^(−βt)) with the pair X, Y (s) of the basis `method`.
    Unknowns ln α and ln(β − α), so β > α always (as the tool). K = 1/max(e^(−αt) − e^(−βt)), so the peak is V_p."""
    if method not in METHODS:
        raise ValueError('method: ' + ', '.join(METHODS))

    def ab(x):
        a = math.exp(x[0])
        return a, a + math.exp(x[1])

    def res(x):
        a, b = ab(x)
        mx, my = _xy(voltage_measure(a, b), method)
        return [math.log(mx / X), math.log(my / Y)]

    starts = {'IEC_T1_T2': (1 / (1.44 * Y), 2.47 / X), 'TP_T2': (1 / (1.3 * Y), 4 / X), 'T10_90_T50': (1 / (1.44 * Y), 2.2 / X)}[method]
    best = None
    for f in (1, 2, .5, 4):          # a few starting points, as the tool's 4
        a0, b0 = starts[0], starts[1] * f
        x, err = _solve2(res, [math.log(a0), math.log(max(b0 - a0, a0 * 1e-3))])
        if best is None or err < best[1]:
            best = (x, err)
        if err < 1e-10:
            break
    alpha, beta = ab(best[0])
    m = voltage_measure(alpha, beta)
    K = 1 / m['peak']
    out = {'alpha': alpha, 'beta': beta, 'K': K, 'Vp': Vp, 'method': method, 'ok': best[1] < 1e-8, **_tm(m),
           'params': {'shape': 'direct', 'alpha': alpha, 'beta': beta, 'K': K, 'Vpk': Vp}}
    if profile:
        out['check'] = check_voltage(alpha, beta, K, Vp, profile, X=X, Y=Y, method=method)
    return out


def _tm(m):
    return {k: m[k] for k in ('T1', 'T2', 'Tp', 't10_90', 't50', 'O1', 't30', 't90')}


def fit_profile(code, Vp):
    p = PROFILES[code]
    return fit_voltage(p['X'], p['Y'], Vp, p['method'], profile=code)


def check_voltage(alpha, beta, K, Vp, profile='IEC2025_LI', X=None, Y=None, method=None, Vpeak=None):
    """PASS/FAIL against the tolerances of a profile: each criterion with its target, value, error (%) and limit (%).
    The peak is V_p·K·max (Vpeak, if the source peak is known otherwise)."""
    p = PROFILES[profile]
    m = voltage_measure(alpha, beta)
    peak = Vpeak if Vpeak is not None else Vp * K * m['peak']
    rows = [('peak', Vp, peak, p['tol']['peak'])]
    if profile == 'CUSTOM':
        mx, my = _xy(m, method or 'IEC_T1_T2')
        rows += [('X', X, mx, p['tol']['X']), ('Y', Y, my, p['tol']['Y'])]
    else:
        if 'T1' in p['tol']:
            rows.append(('T1', p['X'], m['T1'], p['tol']['T1']))
        if 'Tp' in p['tol']:
            rows.append(('Tp', p.get('Tp', p['X']), m['Tp'], p['tol']['Tp']))
        rows.append(('T2', p['Y'], m['T2'] if p['method'] == 'IEC_T1_T2' else m['t50'], p['tol']['T2']))
    crit = []
    for name, target, value, tol in rows:
        e = 100 * (value / target - 1) if target else float('nan')
        crit.append({'name': name, 'target': target, 'value': value, 'err_pct': e, 'tol_pct': tol, 'pass': abs(e) <= tol})
    return {'profile': profile, 'display': p['display'], 'pass': all(c['pass'] for c in crit), 'criteria': crit}


# ---------------------------------------------------------------- the tools' CSV files, read as they are
def _rows(path_or_text):
    t = Path(path_or_text).read_text(encoding='utf-8-sig') if not str(path_or_text).lstrip().startswith('name,') else str(path_or_text)
    return list(csv.DictReader(t.splitlines()))


def read_heidler_csv(path_or_text):
    """A row of ls_params/*.csv (Lightning Impulse Manager) → the parameters of the app's current source."""
    out = []
    for r in _rows(path_or_text):
        tau1, tau2, eta = float(r['tau1_opt_us']) * 1e-6, float(r['tau2_opt_us']) * 1e-6, float(r['H_used'])
        out.append({'name': r.get('name', ''), 'params': {'shape': 'direct', 'model': 'heidler', 'tau1': tau1, 'tau2': tau2, 'eta': eta,
                                                          'n': float(r.get('n') or 10), 'Ipk': float(r['Im_A'])},
                    'T1': float(r['T1_target_us']) * 1e-6, 'T2': float(r['T2_target_us']) * 1e-6, 'H_mode': r.get('H_mode', '')})
    return out


def read_voltage_csv(path_or_text):
    """A row of voltage_impulse_params/*.csv (Voltage Impulse GUI) → the parameters of the app's voltage source."""
    out = []
    for r in _rows(path_or_text):
        sign = -1 if str(r.get('polarity', '')).lower().startswith('neg') else 1
        out.append({'name': r.get('name', ''), 'params': {'shape': 'direct', 'alpha': float(r['alpha_s_inv']), 'beta': float(r['beta_s_inv']),
                                                          'K': float(r['K']), 'Vpk': sign * float(r['Vp_target_kV']) * 1e3},
                    'profile': r.get('standard_code', ''), 'method': r.get('fit_method', ''), 'pass': str(r.get('overall_pass', '')) in ('1', 'true', 'True')})
    return out
