"""5.1.5 (ROADMAP §101 step 2, THEORY §8ΩΩ): the line-commutated HVDC link (LCC) in the steady state and the data of the
first CIGRE HVDC benchmark as a network of pcl.network. Experimental.

The converter is the quasi-steady-state model of «Power System Stability and Control», §10.9 (the interface with the AC side
at the HT bus of the converter transformer, (10.45)): for B six-pulse bridges in series behind the turns ratio T and the
commutating reactance X_c per bridge,
    V_d0 = (3√2/π)·B·T·E_ac,   V_d = V_d0·cos α − (3/π)·X_c·B·I_d,   cos(α + μ) = cos α − √2·X_c·I_d/(T·E_ac),
an inverter with γ = π − α − μ (V_d = V_d0·cos γ − (3/π)·X_c·B·I_d), and P = V_d·I_d with the reactive power of the exact
power factor with overlap (§10.2.2, as the average model of our EMT, THEORY §8ω), not the cos φ ≈ V_d/V_d0 of (10.45).

The controls are those of the station control LCCC of our EMT (the controls of the example of the benchmark, THEORY §8ω):
the rectifier holds the current order with α ≥ α_min; the inverter holds γ_ref, and the order less the current margin ΔI with
its own current control; its γ reference rises with the current error up to Δγ at ΔI (the modified characteristic, Fig.
10.55); the order is limited by the VDCOL on V_d + k·I_d of the inverter. The steady state is one of the three modes of
§10.9.1 (Fig. 10.53–10.55): 1 rectifier on current, inverter on γ_ref; 2 rectifier at α_min, inverter on current (I_d =
order − ΔI); 3 rectifier at α_min, inverter on the sloped characteristic (γ = γ_ref + Δγ·(order − I_d)/ΔI). No tap changer
(§10.9.3: too slow for a transient stability study).

Per unit of the link: V_d in pu of V_dn, I_d of I_dn (per pole); the AC powers in W and var, taken from the AC bus (a
generator gives them as negative)."""
import math

SQ2, SQ3, SQ6 = math.sqrt(2), math.sqrt(3), math.sqrt(6)
D = math.pi / 180


class LCCError(ValueError):
    pass


def pf_parts(alpha, mu, np=None):
    """The fundamental of the AC current of a bridge per unit of its value without overlap, in phase and in quadrature with
    the commutating voltage (lagging): c = (cos α + cos(α + μ))/2 = cos φ·k (P = V_d0·c·I_d = V_d·I_d exactly) and
    s = (μ − cos(2α + μ)·sin μ)/(4·sin(α + μ/2)·sin(μ/2)) = c·tan φ (Q = V_d0·s·I_d), with s → sin(α + μ/2) as μ → 0. The
    exact relations with overlap («Power System Stability and Control» §10.2.2), as the average model of our EMT. With np
    the numpy module, arrays (and a complex step) go through."""
    m = np if np is not None else math
    c = (m.cos(alpha) + m.cos(alpha + mu)) / 2
    re = (lambda z: z.real) if np is not None else (lambda z: z)
    if np is not None:
        small = abs(re(mu)) < 1e-6
        mu_s = np.where(small, 1.0, mu)
        sa = np.sin(alpha + mu_s / 2)
        sa = np.where(abs(re(sa)) < 1e-3, np.where(re(sa) < 0, -1e-3, 1e-3) + 0 * sa, sa)
        s = np.where(small, np.sin(alpha + mu / 2), (mu_s - np.cos(2 * alpha + mu_s) * np.sin(mu_s)) / (4 * sa * np.sin(mu_s / 2)))
        return c, s
    if abs(mu) < 1e-6:
        return c, math.sin(alpha + mu / 2)
    sa = math.sin(alpha + mu / 2)
    if abs(sa) < 1e-3:
        sa = math.copysign(1e-3, sa)
    return c, (mu - math.cos(2 * alpha + mu) * math.sin(mu)) / (4 * sa * math.sin(mu / 2))


def consts(e, Ur, Ui):
    """The constants of the two stations of the link e (a 'lcc' element of pcl.network) on its base, with the bus voltages
    U_r, U_i (V) of their AC buses: per station ('r', 'i') 'vd0' (V_d0 per pu of |V| of the bus, pu of V_dn), 'rc' (R_c =
    (3/π)·X_c·B, pu of Z_dn = V_dn/I_dn), 'km' (√2·X_c·I_dn/(T·U_bus): cos(α + μ) = cos α − km·i/|V|), 'ki' (the RMS current
    of the fundamental per pu of i, A for all the poles); 'rl' the resistance of the line (pu)."""
    Vdn, Idn = e['Vdn'], e['Idn']
    Zdn = Vdn / Idn
    out = {'rl': e['R'] / Zdn, 'Zdn': Zdn}
    for side, U in (('r', Ur), ('i', Ui)):
        s = e[side]
        T = s['U2'] / (s['U1'] * (1 + s['tap'] / 100))
        Xc = s['uk'] / 100 * s['U2'] ** 2 / s['Sn']
        B = s['B']
        out[side] = {'vd0': 3 * SQ2 / math.pi * B * T * U / Vdn, 'rc': 3 / math.pi * Xc * B / Zdn, 'km': SQ2 * Xc * Idn / (T * U),
                     'ki': e['poles'] * B * SQ6 / math.pi * T * Idn, 'T': T, 'Xc': Xc}
    return out


def vdcol(e, v):
    """The voltage-dependent current order limit of the inverter on v = V_d + k·I_d (pu): I1 up to V1, I2 from V2, linear
    between (the LCCC of the EMT)."""
    V1, V2, I1, I2 = e['V1'], max(e['V2'], e['V1'] + 1e-6), e['I1'], e['I2']
    return I1 if v <= V1 else I2 if v >= V2 else I1 + (I2 - I1) * (v - V1) / (V2 - V1)


def _acos(u):
    return math.acos(min(1.0, max(-1.0, u)))


def _point(e, k, Er, Ei, order):
    """The operating point at the order (pu) and the HT voltages |V| (pu of their buses): the mode (1, 2, 3), i, the DC
    voltages of the two converters (pu, pole to ground: the rectifier's positive, the inverter's as its magnitude), α_r,
    α_i, γ, μ_r, μ_i (rad)."""
    R, I = k['r'], k['i']
    vd0r, vd0i, r = R['vd0'] * Er, I['vd0'] * Ei, k['rl']
    if not (vd0r > 0 and vd0i > 0):
        raise LCCError(f'{e["name"]}: no AC voltage at a converter')
    gr, amin, dI, dgc = e['gref'] * D, e['amin'] * D, e['dI'], e['dgc'] * D
    i = order                                               # mode 1: the rectifier on current, the inverter on γ_ref
    vi = vd0i * math.cos(gr) - I['rc'] * i
    vr = vi + r * i
    ca = (vr + R['rc'] * i) / vd0r
    mode = 1
    if ca > math.cos(amin):                                 # α would be below α_min: mode 2, the inverter on current
        mode = 2
        i = order - dI
        vr = vd0r * math.cos(amin) - R['rc'] * i
        vi = vr - r * i
        g = _acos((vi + I['rc'] * i) / vd0i)
        if g < gr + dgc:                                    # its γ below γ_ref + Δγ: mode 3, the sloped characteristic
            mode = 3

            def F(x):
                return vd0r * math.cos(amin) - R['rc'] * x - r * x - (vd0i * math.cos(gr + dgc * (order - x) / dI) - I['rc'] * x)
            lo, hi = order - dI, order                     # F > 0 at lo, < 0 at hi (F decreases)
            for _ in range(200):
                mid = 0.5 * (lo + hi)
                lo, hi = (mid, hi) if F(mid) > 0 else (lo, mid)
                if hi - lo < 1e-15:
                    break
            i = 0.5 * (lo + hi)
            vr = vd0r * math.cos(amin) - R['rc'] * i
            vi = vr - r * i
        ca = math.cos(amin)
        g = _acos((vi + I['rc'] * i) / vd0i)
    else:
        g = gr
    if i <= 0:
        raise LCCError(f'{e["name"]}: no direct current at these AC voltages')
    if ca < -1 or ca > 1:
        raise LCCError(f'{e["name"]}: the rectifier cannot give V_d = {vr:.4f} pu at |V| = {Er:.4f} pu')
    ar = math.acos(ca)
    ur = math.cos(ar) - R['km'] * i / Er
    ui = -math.cos(g)                                       # cos(α_i + μ_i) = cos(π − γ)
    ai = _acos(ui + I['km'] * i / Ei)
    return {'mode': mode, 'i': i, 'vr': vr, 'vi': vi, 'ar': ar, 'ai': ai, 'g': g, 'mr': _acos(ur) - ar, 'mi': (math.pi - g) - ai,
            'order': order}


def operating_point(e, Ur, Ui, Er, Ei, tol=1e-13, max_iter=200):
    """The steady state of the link e at the HT voltages |V_r| = Er, |V_i| = Ei (pu of the bus voltages Ur, Ui in V), with
    the order limited by the VDCOL (a fixed point of the order and V_d + k·I_d of the inverter). Returns the point of
    _point with 'Pr', 'Qr', 'Pi', 'Qi' (W, var taken from each AC bus), 'Pdr', 'Pdi' (W at the DC terminals of the two
    converters, the inverter's as received), 'Id' (A per pole), 'Vdr', 'Vdi' (V), 'vm' (the midpoint of a T line, pu)."""
    k = consts(e, Ur, Ui)
    order = e['Iord']
    for _ in range(max_iter):
        o = _point(e, k, Er, Ei, order)
        d = min(e['Iord'], vdcol(e, o['vi'] + e['kc'] * o['i']))
        if abs(d - order) <= tol:
            break
        order = d
    else:
        raise LCCError(f'{e["name"]}: the VDCOL and the order do not settle')
    Pb = e['Vdn'] * e['Idn'] * e['poles']
    out = dict(o)
    for side, a, mu, v in (('r', o['ar'], o['mr'], Er), ('i', o['ai'], o['mi'], Ei)):
        c, s = pf_parts(a, mu)
        vd0 = k[side]['vd0'] * v
        out['P' + side] = vd0 * c * o['i'] * Pb
        out['Q' + side] = vd0 * s * o['i'] * Pb
    out.update(Pdr=o['vr'] * o['i'] * Pb, Pdi=o['vi'] * o['i'] * Pb, Id=o['i'] * e['Idn'], Vdr=o['vr'] * e['Vdn'], Vdi=o['vi'] * e['Vdn'],
               vm=o['vr'] - k['rl'] / 2 * o['i'], k=k)
    return out


def _result(e, o):
    """The operating point of a link as the load flow AC/DC returns it (JSON-ready)."""
    return {'rec': e['rec'], 'inv': e['inv'], 'mode': o['mode'], 'Id': o['Id'], 'Vdr': o['Vdr'], 'Vdi': o['Vdi'], 'Pr': o['Pr'],
            'Qr': o['Qr'], 'Pi': o['Pi'], 'Qi': o['Qi'], 'Pdr': o['Pdr'], 'Pdi': o['Pdi'], 'alpha_r': o['ar'] / D, 'alpha_i': o['ai'] / D,
            'gamma': o['g'] / D, 'mu_r': o['mr'] / D, 'mu_i': o['mi'] / D, 'order': o['order'], 'losses': o['Pdr'] - o['Pdi']}


# ---------------------------------------------------------------- the first CIGRE HVDC benchmark (the tutorial hvdc_lcc)
# The data of the tutorial hvdc_lcc (THEORY §8ω) at 50 Hz: the sources and their damped impedances, the filters and capacitors
# at the fundamental as shunts, the two stations (YNy0 and YNd1, u_k 18 %, two bridges in series), the smoothing reactors and
# the T line. The AC systems are two islands, each with its source as its slack (|V| and angle of the EMT).
def _zser(Rs, Ls, Rp1, Lp, Rp2, w):
    zp = complex(Rp1, w * Lp)
    if Rp2 > 0:
        zp = zp * Rp2 / (zp + Rp2)
    return complex(Rs, w * Ls) + zp


def _filt(kind, w, C1, L=0.0, R=0.0, C2=0.0, Rp=0.0):
    z1 = 1 / (1j * w * C1)
    if kind == 'c':
        return 1 / z1
    if kind == 'hp':                                         # C1 in series with L ∥ R
        zl = 1j * w * L
        return 1 / (z1 + zl * R / (zl + R))
    zb = complex(R, w * L) + 1 / (1j * w * C2)                # 'cig': C1 in series with (R + L + C2) ∥ R_p
    return 1 / (z1 + zb * Rp / (zb + Rp))


BENCHMARK = {
    'f': 50.0, 'Vdn': 500e3, 'Idn': 2000.0,
    'rec': {'U': 345e3, 'E': 1.088, 'angle': 22.18, 'z': (3.737, 0.0, 0.0, 0.151, 2160.633),
            'filters': (('c', 3.342e-6), ('cig', 6.685e-6, 0.1364, 29.76, 74.28e-6, 261.87), ('hp', 6.685e-6, 0.0136, 83.32)),
            'st': {'Sn': 603.73e6, 'U1': 345e3, 'U2': 213.4557e3, 'uk': 18.0, 'tap': 0.0, 'B': 2}},
    'inv': {'U': 230e3, 'E': 0.935, 'angle': -23.14, 'z': (0.7406, 0.0365, 0.7406, 0.0365, 24.81),
            'filters': (('c', 7.522e-6), ('cig', 15.04e-6, 0.0606, 13.23, 167.2e-6, 116.38), ('hp', 15.04e-6, 0.0061, 37.03)),
            'st': {'Sn': 591.79e6, 'U1': 230e3, 'U2': 209.2288e3, 'uk': 18.0, 'tap': 0.0, 'B': 2}},
    'R': 5.0, 'L': 0.0, 'C': 26e-6, 'Ld': (0.5968, 0.5968),
}


def benchmark_network(S_base=100e6, C=None, **kw):
    """The first CIGRE HVDC benchmark as the tutorial hvdc_lcc has it, as a network of pcl.network for the load flow AC/DC
    and the RMS dynamics: the buses R0 (source, 345 kV), R (the rectifier), I (the inverter), I0 (source, 230 kV); the
    sources as feeders (stiff: the slack of each island) at |V| and the angle of the EMT; their impedances at 50 Hz as lines; the
    filters at 50 Hz as shunts; the link 'DC' with the T line (C = None: 26 µF at the middle; 0: none) and the reactors.
    kw: more data of the link (Network.lcc)."""
    from .network import Network
    b = BENCHMARK
    w = 2 * math.pi * b['f']
    net = Network(f=b['f'], S_base=S_base, name='cigre_lcc')
    for side, ac, bus in (('rec', 'R0', 'R'), ('inv', 'I0', 'I')):
        d = b[side]
        net.bus(ac, d['U'])
        net.bus(bus, d['U'])
        net.feeder(ac, V=d['E'], angle=d['angle'], name='S' + bus)
        z = _zser(*d['z'], w)
        net.line(ac, bus, z.real, z.imag, name='Z' + bus)
        Y = sum(_filt(f[0], w, *f[1:]) for f in d['filters'])          # siemens, per phase of the star
        S1 = (d['U'] ** 2) * Y.conjugate()                               # taken at the nominal voltage (W, var)
        net.shunt(bus, P=S1.real, Q=S1.imag, name='F' + bus)
    net.lcc('R', 'I', Vdn=b['Vdn'], Idn=b['Idn'], R=b['R'], L=b['L'], C=b['C'] if C is None else C, Ld=b['Ld'],
            sr=b['rec']['st'], si=b['inv']['st'], name='DC', **kw)
    return net
