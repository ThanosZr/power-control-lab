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


# ================================================================ 4.1.1: the rest of the two tools (ref-materials)
# Result rows with the tools' CSV schema and file names, characteristics on the sampled waveform (as the tools measure
# them), the front-line geometry of a Heidler current, the validation table of a voltage impulse, and the comparison
# with a waveform from EMTP (or any CSV with time in column 1). Pure Python, as above.
import datetime as _dt
import io as _io

HEIDLER_FIELDS = ('name', 'H_mode', 'H_input', 'H_used', 'Im_A', 'peak_guess_A', 'n', 'tau1_guess_us', 'tau2_guess_us',
                  'tau1_opt_us', 'tau2_opt_us', 'T1_target_us', 'T2_target_us', 'T1_guess_calc_us', 'T2_guess_calc_us',
                  'T1_guess_err_pct', 'T2_guess_err_pct', 'Peak_guess_err_pct', 'peak_opt_A', 'T1_opt_calc_us',
                  'T2_opt_calc_us', 'T1_opt_err_pct', 'T2_opt_err_pct', 'Peak_opt_err_pct', 'source', 'created_at')
VOLTAGE_FIELDS = ('name', 'standard_code', 'standard_name', 'fit_method', 'polarity', 'Vp_target_kV', 'Vpeak_calc_kV',
                  'alpha_s_inv', 'beta_s_inv', 'K', 'target_X_us', 'target_Y_us', 'selected_X_calc_us',
                  'selected_Y_calc_us', 'selected_X_err_pct', 'selected_Y_err_pct', 'peak_err_pct', 'T1_IEC_us',
                  'T2_IEC_us', 'Tp_virtual_us', 'Tp_AnnexF_us', 't10_90_us', 't50_actual_us', 't_peak_actual_us',
                  'virtual_origin_us', 't30_us', 't90_us', 'T1_sampled_us', 'T2_sampled_us',
                  'analytic_sample_T1_diff_pct', 'analytic_sample_T2_diff_pct', 'tol_peak_pct', 'tol_X_pct',
                  'tol_Y_pct', 'dt_effective_s', 'tend_effective_s', 'overall_pass', 'standard_note', 'source',
                  'created_at')

# the profiles as the Voltage Impulse GUI has them (voltage_impulse_standard_profile.m)
VPROFILES = {
    'IEC2025_LI': dict(display=PROFILES['IEC2025_LI']['display'], method='IEC_T1_T2', X=1.2, Y=50, T1=1.2, Tp=None, T2=50,
                       tolT1=(30, 30), tolTp=None, tolT2=20, overshoot=10, basis='T1_T2',
                       note='Current standard LI: T1 by 30%-90% virtual-front geometry.'),
    'IEC2025_SI': dict(display=PROFILES['IEC2025_SI']['display'], method='IEC_T1_T2', X=170, Y=2500, T1=170, Tp=250, T2=2500,
                       tolT1=(20, 20), tolTp=20, tolT2=60, overshoot=None, basis='T1_T2',
                       note='Current standard SI. Tp is retained as an informative compatibility metric.'),
    'IEC2010_SI_LEGACY': dict(display=PROFILES['IEC2010_SI_LEGACY']['display'], method='TP_T2', X=250, Y=2500, T1=165, Tp=250,
                              T2=2500, tolT1=None, tolTp=20, tolT2=60, overshoot=None, basis='TP_T2',
                              note='Compatibility profile for the deprecated time-to-peak convention.'),
    'CUSTOM': dict(display=PROFILES['CUSTOM']['display'], method='IEC_T1_T2', X=1.2, Y=50, T1=None, Tp=None, T2=None,
                   tolT1=None, tolTp=None, tolT2=None, overshoot=None, basis='CUSTOM',
                   note='User targets and symmetric tolerances are applied to the selected fitting basis.'),
}


def _num_name(x, minus=None):
    """sanitizeNum / clean of the tools: %.6g, '.' → 'p', no '+' (and '-' → 'm' in the voltage tool)."""
    s = ('%.6g' % x).replace('.', 'p').replace('+', '')
    return s.replace('-', minus) if minus else s


def heidler_name(T1_us, T2_us, Im_A):
    return 'T1_%s_T2_%s_Ip_%s' % (_num_name(T1_us), _num_name(T2_us), _num_name(Im_A))


def voltage_name(Vp_kV, X_us, Y_us, method):
    return 'V_%s_kV_X_%s_Y_%s_%s' % (_num_name(Vp_kV, 'm'), _num_name(X_us, 'm'), _num_name(Y_us, 'm'), method)


def _grid(dt, tend):
    """t = 0:dt:tend of MATLAB (k·dt)."""
    return [k * dt for k in range(int(math.floor(tend / dt * (1 + 1e-12))) + 1)]


def _xing(t, y, level, k):
    if k <= 0:
        return t[k]
    y1, y2 = y[k - 1], y[k]
    return t[k] if y2 == y1 else t[k - 1] + (level - y1) * (t[k] - t[k - 1]) / (y2 - y1)


def lightning_current(Im, H, tau1_us, tau2_us, n, t):
    """lightning_current.m: (I_m/H)·(t/τ₁)ⁿ/(1 + (t/τ₁)ⁿ)·e^(−t/τ₂), τ in μs, on a list of times (s)."""
    a, t1, t2 = Im / H, tau1_us * 1e-6, tau2_us * 1e-6
    out = []
    for x in t:
        r = (x / t1) ** n
        out.append(a * r / (1 + r) * math.exp(-x / t2))
    return out


def waveform_characteristics(t, i):
    """waveform_characteristics.m: on samples, with the sign of the dominant peak (T1 = 1.25·(t90 − t10))."""
    c = dict(Ipeak=float('nan'), t_peak=float('nan'), T1=float('nan'), T2=float('nan'), t10=float('nan'),
             t90=float('nan'), t50=float('nan'), t_virtual_origin=float('nan'))
    if len(i) < 2:
        return c
    k = max(range(len(i)), key=lambda q: abs(i[q]))
    P = abs(i[k])
    if P <= 0:
        return c
    c['Ipeak'], c['t_peak'] = i[k], t[k]
    s = 1 if i[k] > 0 else -1
    y = [s * v for v in i]
    k10 = next((q for q, v in enumerate(y) if v >= .1 * P), None)
    k90 = next((q for q, v in enumerate(y) if v >= .9 * P), None)
    if k10 is None or k90 is None or k90 <= k10:
        return c
    c['t10'], c['t90'] = _xing(t, y, .1 * P, k10), _xing(t, y, .9 * P, k90)
    c['T1'] = 1.25 * (c['t90'] - c['t10'])
    c['t_virtual_origin'] = c['t10'] - .125 * (c['t90'] - c['t10'])
    k50 = next((q for q in range(k, len(y)) if y[q] <= .5 * P), None)
    if k50 is None:
        return c
    c['t50'] = _xing(t, y, .5 * P, k50)
    c['T2'] = c['t50'] - c['t_virtual_origin']
    return c


def auto_H(tau1_us, tau2_us, n, t):
    """compute_auto_H of the tools: the maximum of the sampled shape."""
    return max(lightning_current(1, 1, tau1_us, tau2_us, n, t))


def _sampled_times(tau1_us, tau2_us, n, dt):
    """T1, T2 (μs) of the sampled shape, stopping after the 50 % tail crossing (the peak is before it)."""
    t1, t2, t, y, k, pk, kp = tau1_us * 1e-6, tau2_us * 1e-6, [], [], 0, 0.0, 0
    while True:
        x = k * dt
        r = (x / t1) ** n
        v = r / (1 + r) * math.exp(-x / t2)
        t.append(x)
        y.append(v)
        if v > pk:
            pk, kp = v, k
        elif v <= .5 * pk and k > kp:
            break
        k += 1
        if k > 5e7:
            raise ValueError('Το δείγμα δεν φτάνει στο 50 % της ουράς.')
    c = waveform_characteristics(t, y)
    return c['T1'] * 1e6, c['T2'] * 1e6


def _refine_heidler(tau1_us, tau2_us, T1_us, T2_us, n, dt):
    """As fit_heidler_impulse.m: the targets hit by the times of the sampled waveform (Newton on the logarithms,
    from the analytic optimum, which is already within 10⁻⁶)."""
    def res(x):
        a, b = _sampled_times(math.exp(x[0]), math.exp(x[1]), n, dt)
        return [math.log(a / T1_us), math.log(b / T2_us)]
    x, _ = _solve2(res, [math.log(tau1_us), math.log(tau2_us)], tol=1e-13, it=8)
    return math.exp(x[0]), math.exp(x[1])


def _now():
    return _dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def heidler_row(T1_us, T2_us, Im_A, n=10, H_mode='AutoH', H_input=0.93, tau1_guess_us=5, tau2_guess_us=200,
                dt=1e-9, tend=None, created_at=None, sampled=True):
    """A result row of the Lightning Impulse Manager (fit_heidler_impulse.m): the guess and the optimum, each measured on
    the sampled waveform t = 0:dt:tend, with the tool's errors. I_m may be negative. The optimum: fit_heidler (Newton on
    the analytic times), then, as the tool (sampled=True), the times of the samples on the targets."""
    if not Im_A:
        raise ValueError('Im_A: όχι μηδέν')
    auto = str(H_mode).lower().startswith('a')
    tend = tend if tend else max(500e-6, 1.5 * T2_us * 1e-6)
    t = _grid(dt, tend)
    Hg = auto_H(tau1_guess_us, tau2_guess_us, n, t) if auto else H_input
    cg = waveform_characteristics(t, lightning_current(Im_A, Hg, tau1_guess_us, tau2_guess_us, n, t))
    f = fit_heidler(T1_us * 1e-6, T2_us * 1e-6, abs(Im_A), n, 'auto' if auto else 'fixed', H_input)
    tau1, tau2 = _refine_heidler(f['tau1'] * 1e6, f['tau2'] * 1e6, T1_us, T2_us, n, dt) if sampled else (f['tau1'] * 1e6, f['tau2'] * 1e6)
    Hu = auto_H(tau1, tau2, n, t) if auto else H_input
    co = waveform_characteristics(t, lightning_current(Im_A, Hu, tau1, tau2, n, t))
    e = lambda a, b: abs(a - b) / abs(b) * 100
    return dict(name=heidler_name(T1_us, T2_us, Im_A), H_mode='AutoH' if auto else 'FixedH', H_input=H_input, H_used=Hu,
                Im_A=Im_A, peak_guess_A=cg['Ipeak'], n=n, tau1_guess_us=tau1_guess_us, tau2_guess_us=tau2_guess_us,
                tau1_opt_us=tau1, tau2_opt_us=tau2, T1_target_us=T1_us, T2_target_us=T2_us,
                T1_guess_calc_us=cg['T1'] * 1e6, T2_guess_calc_us=cg['T2'] * 1e6,
                T1_guess_err_pct=e(cg['T1'] * 1e6, T1_us), T2_guess_err_pct=e(cg['T2'] * 1e6, T2_us),
                Peak_guess_err_pct=e(cg['Ipeak'], Im_A), peak_opt_A=co['Ipeak'], T1_opt_calc_us=co['T1'] * 1e6,
                T2_opt_calc_us=co['T2'] * 1e6, T1_opt_err_pct=e(co['T1'] * 1e6, T1_us),
                T2_opt_err_pct=e(co['T2'] * 1e6, T2_us), Peak_opt_err_pct=e(co['Ipeak'], Im_A), source='computed',
                created_at=created_at or _now())


def frontline_geometry(I0, tau1, tau2, n=10, eta=1.0, dt=1e-9, tend=500e-6):
    """heidler_frontline_geometry_analysis.m: the straight line through the 10 % and 90 % points of the sampled
    waveform, its zero O1 and its crossing t_top with the peak level; T1_geom = t_top − O1 and ratio T1_geom/(t90 − t10)
    (1.25 for any waveform). Times in s, I0 signed. Also the points to draw it."""
    if not I0:
        raise ValueError('I0: όχι μηδέν')
    t = _grid(dt, tend)
    i = [I0 / eta * (x / tau1) ** n / (1 + (x / tau1) ** n) * math.exp(-x / tau2) for x in t]
    k = max(range(len(i)), key=lambda q: abs(i[q]))
    Imax = i[k]
    s = 1 if Imax > 0 else -1
    I10, I90 = .1 * Imax, .9 * Imax
    k10 = next((q for q, v in enumerate(i) if s * v >= s * I10), None)
    k90 = next((q for q, v in enumerate(i) if s * v >= s * I90), None)
    if not k10 or not k90:
        raise ValueError('Δεν βρέθηκαν τα t10 και t90.')
    t10, t90 = _xing(t, i, I10, k10), _xing(t, i, I90, k90)
    m = (I90 - I10) / (t90 - t10)
    b = I10 - m * t10
    tO1, ttop = -b / m, (Imax - b) / m
    return dict(Imax=Imax, t_peak=t[k], t10=t10, t90=t90, t_O1=tO1, t_top=ttop, T1_geom=ttop - tO1,
                ratio=(ttop - tO1) / (t90 - t10), dt_10_90=t90 - t10, slope=m, I10=I10, I90=I90)


# ---------------------------------------------------------------- double exponential: exact and sampled characteristics
def dexp_characteristics(alpha, beta):
    """double_exponential_characteristics.m (s): peak at ln(β/α)/(β − α), crossings, IEC T1/T2 with the virtual origin
    t30 − 0.5·(t90 − t30), Tp from O1, Tp of Annex F, t10–90, t50 from t = 0."""
    if not (0 < alpha < beta):
        raise ValueError('Χρειάζεται β > α > 0.')
    tp = math.log(beta / alpha) / (beta - alpha)
    pk = dexp(tp, alpha, beta)
    f = lambda x: dexp(x, alpha, beta) / pk
    c = {q: _cross(f, q, 0.0, tp) for q in (.1, .3, .9)}
    hi = max(2 * tp, 2 / alpha)
    while f(hi) > .5:
        hi *= 2
    t50 = _cross(f, .5, tp, hi)
    return _dexp_derived(dict(t_peak=tp, K=1 / pk, t10=c[.1], t30=c[.3], t90=c[.9], t50_tail=t50))


def _dexp_derived(c):
    TAB = c['t90'] - c['t30']
    o = c['t30'] - .5 * TAB
    c.update(TAB=TAB, T1=TAB / .6, virtual_origin=o, T2=c['t50_tail'] - o, Tp_virtual=c['t_peak'] - o,
             t10_90=c['t90'] - c['t10'], t50_actual=c['t50_tail'])
    TABu, T2u = TAB * 1e6, c['T2'] * 1e6
    c['Tp_annexF'] = (2.42 - 3.08e-3 * TABu + 1.51e-4 * T2u) * TABu * 1e-6
    return c


def voltage_characteristics(t, v):
    """voltage_impulse_characteristics.m: the same on samples (|v|, first crossings, linear interpolation)."""
    y = [abs(x) for x in v]
    k = max(range(len(y)), key=lambda q: y[q])
    P = y[k]
    rise = lambda L: next((q for q in range(k + 1) if y[q] >= L), None)
    k10, k30, k90 = rise(.1 * P), rise(.3 * P), rise(.9 * P)
    k50 = next((q for q in range(k, len(y)) if y[q] <= .5 * P), None)
    if None in (k10, k30, k90, k50) or min(k10, k30, k90) < 1:
        raise ValueError('Οι διαβάσεις δεν βρέθηκαν στο δείγμα (μεγαλύτερο t_end ή μικρότερο dt).')
    c = dict(Vpeak=P, t_peak=t[k], t10=_xing(t, y, .1 * P, k10), t30=_xing(t, y, .3 * P, k30),
             t90=_xing(t, y, .9 * P, k90), t50_tail=_xing(t, y, .5 * P, k50))
    c = _dexp_derived(c)
    c['overshoot_pct'] = 0.0
    return c


def _selected(c, method):
    if method == 'TP_T2':
        return c['t_peak'], c['t50_actual']
    if method == 'T10_90_T50':
        return c['t10_90'], c['t50_actual']
    return c['T1'], c['T2']


def _refine_voltage(a, b, X, Y, method):
    """The targets hit by the exact characteristics of the tool (closed-form peak), from the fit of fit_voltage."""
    def res(x):
        al = math.exp(x[0])
        mx, my = _selected(dexp_characteristics(al, al + math.exp(x[1])), method)
        return [math.log(mx / X), math.log(my / Y)]
    x, _ = _solve2(res, [math.log(a), math.log(b - a)], tol=1e-14, it=8)
    return math.exp(x[0]), math.exp(x[0]) + math.exp(x[1])


def validate_voltage(exact, sampled, cfg, profile):
    """validate_voltage_impulse_result.m: rows {Metric, Actual, Target, Deviation_pct, Tolerance, Status, Required,
    Basis} in μs / kV / %. cfg: Vp_kV, targetX_us, targetY_us, fitMethod, tolPeak_pct, tolX_pct, tolY_pct."""
    p = VPROFILES[profile] if isinstance(profile, str) else profile
    code = profile if isinstance(profile, str) else 'CUSTOM'
    nan = float('nan')
    err = lambda a, t: 100 * (a - t) / t if t else nan
    eon = lambda a, t: err(a, t) if t is not None and math.isfinite(t) else nan
    rows = []

    def add(m, a, t, e, tol, ok, req, basis):
        rows.append(dict(Metric=m, Actual=a, Target=nan if t is None else t, Deviation_pct=e, Tolerance=tol,
                         Status='PASS' if ok else 'FAIL', Required=bool(req), Basis=basis))
    custom, meth = code == 'CUSTOM', cfg['fitMethod']
    e = err(sampled['Vpeak'] / 1e3, cfg['Vp_kV'])
    add('Peak voltage', sampled['Vpeak'] / 1e3, cfg['Vp_kV'], e, '+/- %.3g %%' % cfg['tolPeak_pct'],
        abs(e) <= cfg['tolPeak_pct'], True, 'Sampled waveform')
    tT1, reqT1 = p['T1'], p['basis'] == 'T1_T2'
    if custom and meth == 'IEC_T1_T2':
        tT1, reqT1 = cfg['targetX_us'], True
    if tT1 is not None:
        e = err(exact['T1'] * 1e6, tT1)
        tm, tp = (cfg['tolX_pct'], cfg['tolX_pct']) if custom else (p['tolT1'] or (nan, nan))
        if math.isfinite(tm) and math.isfinite(tp):
            ok, tol = -tm <= e <= tp, '-%.3g/+%.3g %%' % (tm, tp)
        else:
            ok, tol = True, 'informative'
    else:
        e, ok, tol = nan, True, 'informative'
    add('IEC front time T1 (30%-90%)', exact['T1'] * 1e6, tT1, e, tol, ok, reqT1, 'Analytic geometry')
    tT2 = cfg['targetY_us'] if custom else p['T2']
    if tT2 is not None:
        e = err(exact['T2'] * 1e6, tT2)
        tY = cfg['tolY_pct'] if custom else p['tolT2']
        ok, tol = abs(e) <= tY, '+/- %.3g %%' % tY
    else:
        e, ok, tol = nan, True, 'informative'
    add('Time to half-value T2 from O1', exact['T2'] * 1e6, tT2, e, tol, ok,
        p['basis'] == 'T1_T2' or (custom and meth == 'IEC_T1_T2'), 'Analytic geometry')
    tTp, reqTp = p['Tp'], p['basis'] == 'TP_T2'
    if custom and meth == 'TP_T2':
        tTp, reqTp = cfg['targetX_us'], True
    if tTp is not None:
        e = err(exact['t_peak'] * 1e6, tTp)
        tP = cfg['tolX_pct'] if custom else p['tolTp']
        ok, tol = abs(e) <= tP, '+/- %.3g %%' % tP
    else:
        e, ok, tol = nan, True, 'informative'
    add('Legacy peak time Tp from t=0', exact['t_peak'] * 1e6, tTp, e, tol, ok, reqTp, 'Peak of analytic curve')
    add('Peak time measured from O1', exact['Tp_virtual'] * 1e6, None, nan, 'informative', True, False,
        'Current virtual-origin diagnostic')
    add('IEC 2025 Annex F estimated Tp', exact['Tp_annexF'] * 1e6, tTp, eon(exact['Tp_annexF'] * 1e6, tTp),
        'informative', True, False, 'Switching-impulse compatibility')
    eng = custom and meth == 'T10_90_T50'
    tRise = cfg['targetX_us'] if eng else None
    ctol = lambda t, tl: '+/- %.3g %%' % tl if t is not None else 'informative'
    pot = lambda a, t, tl: abs(err(a, t)) <= tl if t is not None else True
    add('Engineering rise t10-90', exact['t10_90'] * 1e6, tRise, eon(exact['t10_90'] * 1e6, tRise),
        ctol(tRise, cfg['tolX_pct']), pot(exact['t10_90'] * 1e6, tRise, cfg['tolX_pct']), eng, 'Non-standard diagnostic')
    lt, req_lt, ltol = None, False, cfg['tolY_pct']
    if p['basis'] == 'TP_T2':
        lt, req_lt, ltol = p['T2'], True, p['tolT2']
    elif custom and meth == 'TP_T2':
        lt, req_lt = cfg['targetY_us'], True
    elif eng:
        lt = cfg['targetY_us']
    add('Tail crossing t50 from t=0', exact['t50_actual'] * 1e6, lt, eon(exact['t50_actual'] * 1e6, lt), ctol(lt, ltol),
        pot(exact['t50_actual'] * 1e6, lt, ltol), req_lt or eng, 'Actual-origin diagnostic')
    for q in ('T1', 'T2'):
        e = err(sampled[q], exact[q])
        add('Sampled-versus-analytic ' + q, sampled[q] * 1e6, exact[q] * 1e6, e, '+/- 0.1 %', abs(e) <= .1, True,
            'Independent sampled check')
    if p['overshoot'] is not None:
        add('Relative overshoot', 0.0, p['overshoot'], nan, '<= %.3g %%' % p['overshoot'], True, True, 'Smooth double exponential')
    else:
        add('Relative overshoot', 0.0, None, nan, 'informative', True, False, 'Smooth double exponential')
    return rows


def voltage_row(X_us, Y_us, Vp_kV, method='IEC_T1_T2', profile='IEC2025_LI', polarity=1, dt=1e-9, tend=100e-6,
                tol_peak=3, tol_X=None, tol_Y=None, created_at=None):
    """A result row of the Voltage Impulse GUI (fit_voltage_impulse.m) and its validation table: the fit, the exact
    characteristics, the sampled waveform on t = 0:dt:t_end (t_end ≥ 1.25·t50, at most 2·10⁶ points)."""
    p = VPROFILES[profile]
    if tol_X is None:
        tol_X = (p['tolTp'] if p['basis'] == 'TP_T2' else (p['tolT1'] or (30, 30))[0]) if profile != 'CUSTOM' else 30
    if tol_Y is None:
        tol_Y = p['tolT2'] if p['tolT2'] is not None else 20
    f = fit_voltage(X_us * 1e-6, Y_us * 1e-6, Vp_kV * 1e3, method)
    a, b = _refine_voltage(f['alpha'], f['beta'], X_us * 1e-6, Y_us * 1e-6, method)
    ex = dexp_characteristics(a, b)
    tend = max(tend, 1.25 * ex['t50_tail'])
    if tend / dt + 1 > 2e6:
        dt = tend / (2e6 - 1)
    t = _grid(dt, tend)
    s = -1 if polarity < 0 else 1
    v = [s * Vp_kV * 1e3 * ex['K'] * dexp(x, a, b) for x in t]
    sm = voltage_characteristics(t, v)
    X, Y = _selected(ex, method)
    e = lambda a1, b1: 100 * (a1 - b1) / b1
    cfg = dict(Vp_kV=Vp_kV, targetX_us=X_us, targetY_us=Y_us, fitMethod=method, tolPeak_pct=tol_peak, tolX_pct=tol_X, tolY_pct=tol_Y)
    table = validate_voltage(ex, sm, cfg, profile)
    row = dict(name=voltage_name(Vp_kV, X_us, Y_us, method), standard_code=profile, standard_name=p['display'],
               fit_method=method, polarity='Negative' if s < 0 else 'Positive', Vp_target_kV=Vp_kV,
               Vpeak_calc_kV=sm['Vpeak'] / 1e3, alpha_s_inv=a, beta_s_inv=b, K=ex['K'], target_X_us=X_us, target_Y_us=Y_us,
               selected_X_calc_us=X * 1e6, selected_Y_calc_us=Y * 1e6, selected_X_err_pct=e(X * 1e6, X_us),
               selected_Y_err_pct=e(Y * 1e6, Y_us), peak_err_pct=e(sm['Vpeak'] / 1e3, Vp_kV), T1_IEC_us=ex['T1'] * 1e6,
               T2_IEC_us=ex['T2'] * 1e6, Tp_virtual_us=ex['Tp_virtual'] * 1e6, Tp_AnnexF_us=ex['Tp_annexF'] * 1e6,
               t10_90_us=ex['t10_90'] * 1e6, t50_actual_us=ex['t50_actual'] * 1e6, t_peak_actual_us=ex['t_peak'] * 1e6,
               virtual_origin_us=ex['virtual_origin'] * 1e6, t30_us=ex['t30'] * 1e6, t90_us=ex['t90'] * 1e6,
               T1_sampled_us=sm['T1'] * 1e6, T2_sampled_us=sm['T2'] * 1e6,
               analytic_sample_T1_diff_pct=e(sm['T1'], ex['T1']), analytic_sample_T2_diff_pct=e(sm['T2'], ex['T2']),
               tol_peak_pct=tol_peak, tol_X_pct=tol_X, tol_Y_pct=tol_Y, dt_effective_s=dt, tend_effective_s=tend,
               overall_pass=int(all(r['Status'] == 'PASS' for r in table if r['Required'])), standard_note=p['note'],
               source='computed', created_at=created_at or _now())
    return {'row': row, 'validation': table, 'exact': ex, 'sampled': sm}


# ---------------------------------------------------------------- CSV files with the tools' schema and names
def _cell(v):
    if isinstance(v, bool):
        return '1' if v else '0'
    if isinstance(v, int):
        return str(v)
    if isinstance(v, float):
        return '%.15g' % v if math.isfinite(v) else 'NaN'
    return str(v)


def rows_csv(rows, kind=None):
    """Rows → CSV text in the column order of the tool (kind 'i' or 'v', from the first row if omitted)."""
    if not rows:
        return ''
    kind = kind or ('i' if 'tau1_opt_us' in rows[0] else 'v')
    fields = HEIDLER_FIELDS if kind == 'i' else VOLTAGE_FIELDS
    out = _io.StringIO()
    w = csv.writer(out, lineterminator='\n')
    w.writerow(fields)
    for r in rows:
        w.writerow([_cell(r.get(k, '')) for k in fields])
    return out.getvalue()


def save_rows(rows, folder, kind=None):
    """buildSingleImpulseFilename / buildSingleVoltageImpulseFilename: one file per row, name of the row + .csv
    (ls_params/ and voltage_impulse_params/ of the tools). Returns the paths."""
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    paths = []
    for r in rows:
        p = folder / (str(r['name']) + '.csv')
        p.write_text(rows_csv([r], kind), encoding='utf-8')
        paths.append(str(p))
    return paths


def read_rows(path_or_text):
    """Saved rows of either tool, as they are (numbers as float where they parse)."""
    out = []
    for r in _rows(path_or_text):
        q = {}
        for k, v in r.items():
            try:
                q[k] = float(v)
            except (TypeError, ValueError):
                q[k] = v
        out.append(q)
    return out


# ---------------------------------------------------------------- comparison with EMTP (or any waveform CSV)
def read_signal_csv(path_or_text):
    """verify_emtp_gui.m loadCSV: column 1 = time (s), the other columns signals with their original names. Eligible
    columns have at least two finite (time, value) pairs at distinct times; their numbers stay the physical ones
    (1-based, as in the tool). Returns {'names', 'time', 'columns': [{index, name, valid}], 'data': {index: values}}."""
    s = str(path_or_text)
    text = Path(s).read_text(encoding='utf-8-sig') if '\n' not in s and Path(s).exists() else s
    rows = list(csv.reader(text.splitlines()))
    if not rows or len(rows[0]) < 2:
        raise ValueError('Το CSV θέλει χρόνο στη στήλη 1 και τουλάχιστον μία στήλη σήματος.')
    names, body = rows[0], rows[1:]

    def num(x):
        try:
            v = float(x)
            return v if math.isfinite(v) else float('nan')
        except (TypeError, ValueError):
            return float('nan')
    cols = [[num(r[j]) if j < len(r) else float('nan') for r in body] for j in range(len(names))]
    tm = cols[0]
    if sum(1 for x in tm if math.isfinite(x)) < 2:
        raise ValueError('Η στήλη 1 πρέπει να έχει αριθμητικούς χρόνους σε s.')
    info, data = [], {}
    for j in range(1, len(names)):
        ok = [(a, b) for a, b in zip(tm, cols[j]) if math.isfinite(a) and math.isfinite(b)]
        if len(ok) >= 2 and len({a for a, _ in ok}) >= 2:
            info.append({'index': j + 1, 'name': names[j], 'valid': len(ok)})
            data[j + 1] = cols[j]
    if not info:
        raise ValueError('Καμία στήλη δεν έχει δύο αριθμητικά δείγματα σε διαφορετικούς χρόνους.')
    return {'names': names, 'time': tm, 'columns': info, 'data': data}


def _clean(tm, y):
    """selectedSignal: finite pairs, sorted by time, the first sample of a repeated time."""
    pairs = sorted(((a, b) for a, b in zip(tm, y) if math.isfinite(a) and math.isfinite(b)), key=lambda p: p[0])
    t, v, last = [], [], None
    for a, b in pairs:
        if a != last:
            t.append(a)
            v.append(b)
            last = a
    return t, v


def _interp(tx, yx, tq):
    """interp1 linear, NaN outside (tx sorted)."""
    out, j, n = [], 0, len(tx)
    for x in tq:
        if x < tx[0] or x > tx[-1]:
            out.append(float('nan'))
            continue
        while j < n - 2 and tx[j + 1] < x:
            j += 1
        while j > 0 and tx[j] > x:
            j -= 1
        x0, x1 = tx[j], tx[min(j + 1, n - 1)]
        out.append(yx[j] if x1 == x0 else yx[j] + (yx[min(j + 1, n - 1)] - yx[j]) * (x - x0) / (x1 - x0))
    return out


def _corr(a, b):
    n = len(a)
    ma, mb = sum(a) / n, sum(b) / n
    sa = math.sqrt(sum((x - ma) ** 2 for x in a))
    sb = math.sqrt(sum((x - mb) ** 2 for x in b))
    if not sa or not sb:
        return float('nan')
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / (sa * sb)


CURRENT_UNITS = {'A': 1.0, 'kA': 1e3, 'mA': 1e-3, 'MA': 1e6}
VOLTAGE_UNITS = {'kV': 1.0, 'V': 1e-3, 'MV': 1e3, 'mV': 1e-6}     # to kV, as the voltage tool


def _auto_unit(y, ref_peak, units):
    p = max((abs(x) for x in y), default=0.0)
    if p <= 0 or ref_peak <= 0:
        return next(iter(units))
    return min(units, key=lambda u: abs(math.log10(max(p * units[u], 1e-300) / ref_peak)))


def heidler_reference(row, dt=1e-9):
    """The GUI waveform of a row (verify_emtp_gui.m): t = 0:1 ns:max(500 μs, 1.5·T2), H_used (AutoH again if missing)."""
    g = lambda k, d=float('nan'): float(row[k]) if k in row and row[k] not in ('', None) else d
    T2, Im, n = g('T2_target_us', 200), g('Im_A'), g('n')
    tau1, tau2 = g('tau1_opt_us', g('tau1_guess_us')), g('tau2_opt_us', g('tau2_guess_us'))
    t = _grid(dt, max(500e-6, 1.5 * T2 * 1e-6))
    H = g('H_used', g('H_input'))
    if not (H > 0) and str(row.get('H_mode', '')).lower().startswith('a'):
        H = auto_H(tau1, tau2, n, t)
    return t, lightning_current(Im, H, tau1, tau2, n, t)


def voltage_reference(row):
    """The GUI waveform of a row (open_voltage_impulse_verification_gui.m): t = 0:dt:t_end of the row, in kV."""
    g = lambda k, d=float('nan'): float(row[k]) if k in row and row[k] not in ('', None) else d
    a, b, Vp = g('alpha_s_inv'), g('beta_s_inv'), g('Vp_target_kV')
    ex = dexp_characteristics(a, b)
    tend = max(g('tend_effective_s', 1.25 * ex['t50_tail']), 1.25 * ex['t50_tail'])
    dt = g('dt_effective_s', tend / 2e5)
    if not (dt > 0):
        dt = tend / 2e5
    if tend / dt > 5e5:
        dt = tend / 5e5
    s = -1 if str(row.get('polarity', 'Positive')).lower().startswith('neg') else 1
    t = _grid(dt, tend)
    return t, [s * Vp * ex['K'] * dexp(x, a, b) for x in t], ex


def compare_current(row, time, signal, unit='auto', shift=None, normalize=False):
    """verify_emtp_gui.m refreshAll: the EMTP current (unit A, kA, mA, MA or auto by the peak), shifted in time (None:
    the peaks aligned by max |i|), optionally scaled to the GUI peak magnitude (never flipped). Metrics over the common
    interval on the GUI time grid: signed peaks, signed peak error, polarity, RMSE, normalized RMSE (% of the GUI peak),
    correlation, samples."""
    tR, iR = heidler_reference(row)
    tE, y = _clean(time, signal)
    ref_peak = max(abs(x) for x in iR)
    u = _auto_unit(y, ref_peak, CURRENT_UNITS) if unit in (None, 'auto', 'Auto detect') else unit
    iE = [x * CURRENT_UNITS[u] for x in y]
    kE = max(range(len(iE)), key=lambda q: abs(iE[q]))
    kR = max(range(len(iR)), key=lambda q: abs(iR[q]))
    if shift is None:
        shift = tR[kR] - tE[kE]
    raw_peak, ref_signed = iE[kE], iR[kR]
    fac = ref_peak / abs(raw_peak) if normalize and raw_peak else 1.0
    iP = [x * fac for x in iE]
    ts = [x + shift for x in tE]
    lo, hi = max(tR[0], ts[0]), min(tR[-1], ts[-1])
    idx = [k for k, x in enumerate(tR) if lo <= x <= hi]
    e = _interp(ts, iP, [tR[k] for k in idx])
    r = [iR[k] for k in idx]
    pairs = [(a, b) for a, b in zip(r, e) if math.isfinite(a) and math.isfinite(b)]
    out = dict(unit=u, shift=shift, factor=fac, gui_peak=ref_signed, emtp_peak=raw_peak,
               peak_err_pct=abs(raw_peak - ref_signed) / ref_peak * 100,
               polarity='EMTP signal is zero' if not raw_peak else ('Matching' if (raw_peak > 0) == (ref_signed > 0) else 'Opposite'),
               rmse=float('nan'), nrmse_pct=float('nan'), corr=float('nan'), n=len(pairs))
    if len(pairs) >= 2:
        a, b = [p[0] for p in pairs], [p[1] for p in pairs]
        out['rmse'] = math.sqrt(sum((q - p) ** 2 for p, q in pairs) / len(pairs))
        out['nrmse_pct'] = out['rmse'] / ref_peak * 100
        out['corr'] = _corr(a, b)
    return out


def compare_voltage(row, time, signal, unit='auto', shift=None, normalize=False):
    """open_voltage_impulse_verification_gui.m: the CSV voltage in kV (unit kV, V, MV, mV or auto), shifted (None: its
    peak on the analytic t_peak), optionally scaled to |V_p|; the model interpolated at the CSV times in the overlap
    (at most 2·10⁵ points). Peak error by magnitude (%), RMSE (kV), normalized RMSE (% of V_p), correlation."""
    tM, vM, ex = voltage_reference(row)
    Vp = float(row['Vp_target_kV'])
    s = -1 if str(row.get('polarity', 'Positive')).lower().startswith('neg') else 1
    tE, y = _clean(time, signal)
    u = _auto_unit(y, abs(Vp), VOLTAGE_UNITS) if unit in (None, 'auto', 'AUTO') else unit
    v = [x * VOLTAGE_UNITS[u] for x in y]
    k = max(range(len(v)), key=lambda q: abs(v[q]))
    if shift is None:
        shift = ex['t_peak'] - tE[k]
    raw = max(abs(x) for x in v)
    fac = abs(Vp) / raw if normalize and raw else 1.0
    td = [x + shift for x in tE]
    vd = [x * fac for x in v]
    sel = [(a, b) for a, b in zip(td, vd) if tM[0] <= a <= tM[-1]]
    if len(sel) > 2e5:
        step = (len(sel) - 1) / (2e5 - 1)
        sel = [sel[int(round(q * step))] for q in range(int(2e5))]
    out = dict(unit=u, shift=shift, factor=fac, gui_peak=s * Vp, emtp_peak=v[k],
               peak_err_pct=100 * (abs(v[k]) - abs(Vp)) / abs(Vp), rmse=float('nan'), nrmse_pct=float('nan'),
               corr=float('nan'), n=0)
    if len(sel) >= 3:
        m = _interp(tM, vM, [a for a, _ in sel])
        pairs = [(b, q) for (_, b), q in zip(sel, m) if math.isfinite(b) and math.isfinite(q)]
        out['rmse'] = math.sqrt(sum((b - q) ** 2 for b, q in pairs) / len(pairs))
        out['nrmse_pct'] = 100 * out['rmse'] / abs(Vp)
        if len(pairs) >= 3:
            out['corr'] = _corr([b for b, _ in pairs], [q for _, q in pairs])
        out['n'] = len(pairs)
    return out
