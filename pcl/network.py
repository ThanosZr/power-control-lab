"""Power networks (4.2, ROADMAP §31/§39): a bus–branch model in physical units, load flow (Newton–Raphson, polar)
and short-circuit currents according to IEC 60909-0:2016 (equivalent voltage source at the fault location).

The model:
* every element is given with the data of its rating plate (V, VA, Ω, %) and placed between buses with a nominal
  voltage U_n; the solvers work in per unit on S_base and U_n per bus, transformers as ideal ratios with their rated
  transformation ratio t_r (off-nominal against U_n), so impedances are transferred with t_r as IEC 60909-0 asks,
* short circuit: impedance correction factors K_T (two- and three-winding), K_G, K_S, K_SO, the voltage factor c
  (Table 1), positive, negative (Z₂ = Z₁) and zero sequence (with the zero-sequence data of each element), I″k for
  three-phase, line-to-line, line-to-earth and two-line-to-earth faults, i_p with method B (R/X at the fault
  location, factor 1,15) and method C (equivalent frequency 20 Hz / 24 Hz), I_b with Formula (77) of IEC 60909-0
  (μ, q from the minimum time delay), I_k = I″kM0 in meshed networks, and minimum currents (c_min, no correction
  factors, no motors, line resistance at the end temperature),
* load flow: slack, PV and PQ buses, loads with the ZIP model, shunts, line charging, transformer taps and phase
  shifts, generators' reactive limits (optional PV → PQ), sparse Jacobian with SciPy when the network is large,
* superposition: the fault current from the load-flow state and the subtransient reactances (compare with the
  equivalent voltage source, as IEC TR 60909-4 does),
* IEEE test cases in the MATPOWER format (read_matpower, ieee9, ieee14).

Verification: IEC TR 60909-4:2021 §9 (the test network 380/110/30/10 kV, Tables 22 and 23, deviation < 0,02 %)
in tests/test_network.py, and the load flow against the IEEE solution and an independent solver (VERIFICATION.md).
"""
import cmath
import json
import math
import re
from pathlib import Path

import numpy as np

SQ3 = math.sqrt(3)
A120 = cmath.exp(2j * math.pi / 3)
DATA = Path(__file__).resolve().parent / 'data'


class NetworkError(ValueError):
    pass


# ---------------------------------------------------------------- IEC 60909-0 factors
def c_factor(Un, which='max', lv_tol=0.06):
    """Voltage factor c (Table 1 of IEC 60909-0): U_n > 1 kV 1,10/1,00; low voltage 1,05/0,95 for a tolerance of +6 %
    and 1,10/0,90 for +10 %."""
    if Un > 1000:
        return 1.10 if which == 'max' else 1.00
    if lv_tol >= 0.1 - 1e-12:
        return 1.10 if which == 'max' else 0.90
    return 1.05 if which == 'max' else 0.95


def kappa(rx):
    """κ = 1,02 + 0,98·e^(−3R/X)."""
    return 1.02 + 0.98 * math.exp(-3 * rx)


_MU = {0.02: (0.84, 0.26, 0.26), 0.05: (0.71, 0.51, 0.30), 0.10: (0.62, 0.72, 0.32), 0.25: (0.56, 0.94, 0.38)}
_Q = {0.02: (1.03, 0.12), 0.05: (0.79, 0.12), 0.10: (0.57, 0.12), 0.25: (0.26, 0.10)}


def _interp(table, t, f):
    keys = sorted(table)
    t = max(t, keys[0])
    if t >= keys[-1]:
        return f(table[keys[-1]])
    for a, b in zip(keys, keys[1:]):
        if a <= t <= b:
            fa, fb = f(table[a]), f(table[b])
            return fa + (fb - fa) * (t - a) / (b - a)
    return f(table[keys[-1]])


def mu_factor(ratio, tmin=0.1):
    """μ of Formula (67) from I″kG/I_rG (or I″kM/I_rM) and the minimum time delay (linear between the curves);
    μ = 1 when the ratio is not greater than 2."""
    if ratio <= 2:
        return 1.0
    return min(1.0, _interp(_MU, tmin, lambda p: p[0] + p[1] * math.exp(-p[2] * ratio)))


def q_factor(m_mw, tmin=0.1):
    """q of Formula (69) from the rated power per pair of poles m (MW); q ≤ 1."""
    m = max(m_mw, 1e-12)
    return min(1.0, _interp(_Q, tmin, lambda p: p[0] + p[1] * math.log(m)))


def _group(g):
    """(HV connection, LV connection) of a vector group such as 'YNd5', 'Dyn11', 'YNyn0', 'Yd1'."""
    m = re.match(r'(YN|Y|D|ZN|Z)(yn|y|d|zn|z)(\d*)', str(g))
    if not m:
        raise NetworkError(f'vector group {g}')
    return m.group(1), m.group(2)


def _zx(Z, rx):
    """R + jX from |Z| and R/X."""
    X = Z / math.sqrt(1 + rx * rx)
    return complex(rx * X, X)


def _zr(uk, ur, U, S):
    """Short-circuit impedance of a transformer pair from u_k, u_R (%) at U (V) and S (VA): (R, X) in Ω."""
    Zb = U * U / S
    Z = uk / 100 * Zb
    R = ur / 100 * Zb
    return complex(R, math.sqrt(max(Z * Z - R * R, 0.0)))


def _kt(z_ohm, U, S, cmax=1.1):
    """K_T = 0,95·c_max/(1 + 0,6·x_T), Formula (12a), x_T relative to U²/S."""
    return 0.95 * cmax / (1 + 0.6 * z_ohm.imag / (U * U / S))


# ---------------------------------------------------------------- the network
class Network:
    """A three-phase network of buses and elements (SI units). Build it with the methods below, then call
    short_circuit / iec60909 or load_flow. Every method returns the element's name."""

    def __init__(self, f=50.0, S_base=100e6, name=''):
        self.f, self.S_base, self.name = float(f), float(S_base), name
        self.buses = {}            # name -> dict(Un, type, V, angle, …)
        self.elements = []         # list of dicts with a 'kind'
        self.warnings = []
        self._imp = {}

    # ------------------------------------------------------------ buses and elements
    def bus(self, name, Un, kind='PQ', V=1.0, angle=0.0, Vmin=None, Vmax=None):
        name = str(name)
        self.buses[name] = {'Un': float(Un), 'type': kind, 'V': float(V), 'angle': float(angle), 'Vmin': Vmin, 'Vmax': Vmax}
        return name

    def _add(self, kind, name, **kw):
        name = str(name or f'{kind}{sum(e["kind"] == kind for e in self.elements) + 1}')
        if any(e['name'] == name for e in self.elements):
            raise NetworkError(f'element {name} exists')
        for k in ('bus', 'a', 'b', 'c', 'hv', 'lv'):
            if kw.get(k) is not None:
                kw[k] = str(kw[k])
                if kw[k] not in self.buses:
                    raise NetworkError(f'{name}: unknown bus {kw[k]}')
        self.elements.append({'kind': kind, 'name': name, **kw})
        return name

    def feeder(self, bus, Ik=None, Sk=None, RX=0.1, X0X=None, R0X0=None, c=None, Ik_min=None, Un=None, name=None,
               V=1.0, angle=0.0, slack=True):
        """Network feeder Q: I″kQ (A) or S″kQ (VA) for c_max (c default from Table 1), R/X, zero sequence X₀/X and R₀/X₀
        (None: not earthed); for the load flow a slack (or PV) bus with V (pu) and angle (deg)."""
        return self._add('feeder', name, bus=bus, Ik=Ik, Sk=Sk, RX=float(RX), X0X=X0X, R0X0=R0X0, c=c, Ik_min=Ik_min,
                         Un=Un, V=V, angle=angle, slack=slack)

    def line(self, a, b, R, X, length=1.0, B=0.0, R0=None, X0=None, parallel=1, name=None, alpha=0.004):
        """Line or cable: R, X (Ω/km), B (S/km, charging, load flow only), R₀, X₀ (Ω/km), length (km), identical
        parallel circuits (no zero-sequence coupling between them)."""
        return self._add('line', name, a=a, b=b, R=float(R), X=float(X), length=float(length), B=float(B), R0=R0, X0=X0,
                         parallel=int(parallel), alpha=alpha)

    def transformer(self, hv, lv, Sr, Uhv, Ulv, uk, ur=0.0, group='YNd5', X0X=1.0, R0R=1.0, Zn_hv=0.0, Zn_lv=0.0,
                    tap=0.0, KT=True, shift=None, name=None):
        """Two-winding transformer: S_rT, U_rTHV, U_rTLV, u_kr, u_Rr (%), vector group (star point earthed where 'N'/'n'),
        zero sequence X₀/X and R₀/R, neutral impedances (Ω, not corrected), tap (% on the HV side, load flow),
        K_T of Formula (12a) for the maximum currents (KT=False: no correction, e.g. inside a power station unit)."""
        return self._add('transformer', name, hv=hv, lv=lv, Sr=float(Sr), Uhv=float(Uhv), Ulv=float(Ulv), uk=float(uk), ur=float(ur),
                         group=group, X0X=X0X, R0R=R0R, Zn_hv=complex(Zn_hv), Zn_lv=complex(Zn_lv), tap=float(tap), KT=KT, shift=shift)

    def transformer3(self, a, b, c, Sr, Ur, uk, ur=(0.0, 0.0, 0.0), group='YNyn0d5', ref='b', z0=None, KT=True, name=None):
        """Three-winding transformer between buses a (HV), b (MV), c (LV): S_r = (S_A, S_B, S_C) or the pair powers
        {'ab':…, 'ac':…, 'bc':…}, U_r = (U_A, U_B, U_C), u_k = (u_AB, u_AC, u_BC), u_R likewise (%); impedances
        referred to side ref; K_TAB, K_TAC, K_TBC (Formula 12a with the pair's power). Zero sequence: z0 = list of
        {'side': 'a'|'b'|'c', 'x': X₀/X_ref, 'r': R₀/R_ref, 'ref': pair, 'k': pair of the correction factor, 'Zn': Ω}
        (a shunt at that side, e.g. a YN winding with a delta tertiary)."""
        if isinstance(Sr, dict):
            S = {k: float(v) for k, v in Sr.items()}
        else:
            SA, SB, SC = (float(x) for x in Sr)
            S = {'ab': min(SA, SB), 'ac': min(SA, SC), 'bc': min(SB, SC)}
        name = self._add('transformer3', name, a=a, b=b, c=c, S=S, Ur=tuple(float(x) for x in Ur), uk=tuple(float(x) for x in uk),
                         ur=tuple(float(x) for x in ur), group=group, ref=ref, z0=z0 or [], KT=KT)
        star = '_' + name + '*'                          # the star point of the equivalent, an internal bus
        self.buses[star] = {'Un': self.buses[str({'a': a, 'b': b, 'c': c}[ref])]['Un'], 'type': 'internal', 'V': 1.0, 'angle': 0.0, 'Vmin': None, 'Vmax': None}
        return name

    def generator(self, bus, Sr, Ur, xd2, cosphi, RG=None, xdsat=None, pG=0.0, X0=None, earthed=False, P=None, V=None,
                  Qmin=None, Qmax=None, slack=False, name=None):
        """Synchronous generator directly connected: S_rG, U_rG, x″d (pu), cos φ_rG, R_G (Ω; None: R_Gf of IEC 60909-0),
        p_G (voltage regulation), x_dsat; load flow: P (W), V (pu) of a PV bus, reactive limits (var)."""
        return self._add('generator', name, bus=bus, Sr=float(Sr), Ur=float(Ur), xd2=float(xd2), cosphi=float(cosphi), RG=RG,
                         xdsat=xdsat, pG=float(pG), X0=X0, earthed=earthed, P=P, V=V, Qmin=Qmin, Qmax=Qmax, slack=slack)

    def unit(self, bus, gen, trafo, oltc=True, pT=0.0, Zn=0.0, earthed=True, name=None, P=None, V=None, Qmin=None, Qmax=None, slack=False):
        """Power station unit S (with on-load tap-changer) or SO (without): gen = dict(Sr, Ur, xd2, cosphi, RG, pG),
        trafo = dict(Sr, Uhv, Ulv, uk, ur, X0X, R0R, group); K_S or K_SO; zero sequence of the unit transformer
        (YN on the HV side) with the neutral impedance Zn (Ω, not corrected)."""
        return self._add('unit', name, bus=bus, gen=dict(gen), trafo=dict(trafo), oltc=oltc, pT=float(pT), Zn=complex(Zn), earthed=earthed,
                         P=P, V=V, Qmin=Qmin, Qmax=Qmax, slack=slack)

    def motor(self, bus, Pr, Ur, cosphi, eta, ILR, p=1, n=1, RX=None, name=None):
        """Asynchronous motor(s): P_rM (W), U_rM, cos φ_rM, η_rM, I_LR/I_rM, pairs of poles p, n identical in
        parallel; R/X from IEC 60909-0 when not given (0,10 / 0,15 above 1 kV, 0,42 low voltage)."""
        return self._add('motor', name, bus=bus, Pr=float(Pr), Ur=float(Ur), cosphi=float(cosphi), eta=float(eta), ILR=float(ILR),
                         p=int(p), n=int(n), RX=RX)

    def reactor(self, a, X, R=0.0, b=None, X0=None, R0=None, name=None):
        """Short-circuit limiting reactor between a and b (or a shunt to earth at a when b is None), Ω."""
        return self._add('reactor', name, a=a, b=b, X=float(X), R=float(R), X0=X0, R0=R0)

    def load(self, bus, P, Q, zip=(0.0, 0.0, 1.0), name=None):
        """Load for the load flow (W, var at V = 1 pu) with the ZIP fractions (constant impedance, current, power).
        Not in the short circuit (IEC 60909-0 neglects non-rotating loads)."""
        z = tuple(float(x) for x in zip)
        if abs(sum(z) - 1) > 1e-9:
            raise NetworkError('ZIP fractions must add up to 1')
        return self._add('load', name, bus=bus, P=float(P), Q=float(Q), zip=z)

    def shunt(self, bus, P=0.0, Q=0.0, name=None):
        """Shunt admittance given by its power at V = 1 pu (W, var; Q > 0 absorbs, as MATPOWER's Gs, −Bs)."""
        return self._add('shunt', name, bus=bus, P=float(P), Q=float(Q))

    def branch_pu(self, a, b, r, x, bc=0.0, ratio=0.0, angle=0.0, name=None):
        """A branch in per unit of S_base and the buses' U_n (the MATPOWER model: tap ratio and shift at bus a)."""
        return self._add('branch', name, a=a, b=b, r=float(r), x=float(x), bc=float(bc), ratio=float(ratio), angle=float(angle))

    def remove(self, name):
        self.elements = [e for e in self.elements if e['name'] != name]

    def element(self, name):
        for e in self.elements:
            if e['name'] == name:
                return e
        raise NetworkError(f'no element {name}')

    # ------------------------------------------------------------ per unit helpers
    def _zb(self, bus):
        Un = self.buses[bus]['Un']
        return Un * Un / self.S_base

    def _ib(self, bus):
        return self.S_base / (SQ3 * self.buses[bus]['Un'])

    # ------------------------------------------------------------ impedances of the elements for the short circuit
    def _sc_parts(self, mode='max', freq=1.0, cmax=1.1, temp=None, rgf=False):
        """The sequence networks as stamps: ('series', a, b, z1, z0, tau_a) or ('shunt', bus, z1, z0, machine)
        with z in per unit, τ the off-nominal ratio at a; freq = f_c/f scales the reactances (method C)."""
        corr = mode == 'max'
        out, machines = [], []
        rec = self._imp = {}
        sc = lambda z: complex(z.real, z.imag * freq)
        B = self.buses
        for e in self.elements:
            k = e['kind']
            if k == 'feeder':
                bus = e['bus']
                Un = e['Un'] or B[bus]['Un']
                c = e['c'] if e['c'] is not None else c_factor(Un, 'max')
                if e['Ik'] is not None:
                    Ik = e['Ik'] if mode == 'max' or e['Ik_min'] is None else e['Ik_min']
                    ZQ = c * Un / (SQ3 * Ik)
                elif e['Sk'] is not None:
                    ZQ = c * Un * Un / e['Sk']
                else:
                    raise NetworkError(f'{e["name"]}: I″kQ or S″kQ')
                if mode == 'min':
                    ZQ *= c_factor(Un, 'min') / c
                z = _zx(ZQ, e['RX'])
                tr = Un / B[bus]['Un']                   # a feeder given at another voltage than its bus' U_n
                z = z / (tr * tr)
                z0 = None
                if e['X0X'] is not None:
                    X0 = e['X0X'] * z.imag
                    z0 = complex((e['R0X0'] or 0.0) * X0, X0)
                zb = self._zb(bus)
                out.append(('shunt', bus, sc(z) / zb, None if z0 is None else sc(z0) / zb, None))
                rec[e['name']] = {'Z1': z, 'Z0': z0, 'K': 1.0}
            elif k == 'line':
                n = e['parallel']
                L = e['length']
                fT = 1.0
                if mode == 'min' and temp is not None:
                    fT = 1 + e['alpha'] * (temp - 20)
                z = complex(e['R'] * fT, e['X']) * L / n
                z0 = None if e['X0'] is None else complex((e['R0'] or 0.0) * fT, e['X0']) * L / n
                zb = self._zb(e['a'])
                out.append(('series', e['a'], e['b'], sc(z) / zb, None if z0 is None else sc(z0) / zb, 1.0))
                rec[e['name']] = {'Z1': z, 'Z0': z0, 'K': 1.0}
            elif k == 'reactor':
                z = complex(e['R'], e['X'])
                z0 = complex(e['R0'] if e['R0'] is not None else e['R'], e['X0'] if e['X0'] is not None else e['X'])
                zb = self._zb(e['a'])
                if e['b'] is None:
                    out.append(('shunt', e['a'], sc(z) / zb, sc(z0) / zb, None))
                else:
                    out.append(('series', e['a'], e['b'], sc(z) / zb, sc(z0) / zb, 1.0))
                rec[e['name']] = {'Z1': z, 'Z0': z0, 'K': 1.0}
            elif k == 'transformer':
                hv, lv = e['hv'], e['lv']
                zT = _zr(e['uk'], e['ur'], e['Uhv'], e['Sr'])        # referred to the HV side
                K = _kt(zT, e['Uhv'], e['Sr'], cmax) if (corr and e['KT']) else 1.0
                tau = (e['Uhv'] / e['Ulv']) / (B[hv]['Un'] / B[lv]['Un'])
                zb = self._zb(hv)
                z = K * zT
                z0 = complex(K * zT.real * (e['R0R'] or 0), K * zT.imag * (e['X0X'] or 0))
                # positive sequence: the impedance on the HV side, the ideal transformer at the LV side
                out.append(('series', lv, hv, sc(z) / zb, None, 1 / tau))
                rec[e['name']] = {'Z1': z, 'Z0': z0 if (e['X0X'] or e['R0R']) else None, 'K': K}
                hc, lc = _group(e['group'])
                if hc == 'YN' and lc == 'd':
                    out.append(('shunt', hv, None, sc(z0 + 3 * e['Zn_hv']) / zb, None))
                elif lc == 'yn' and hc == 'D':
                    out.append(('shunt', lv, None, sc(z0 * (e['Ulv'] / e['Uhv']) ** 2 + 3 * e['Zn_lv']) / self._zb(lv), None))
                elif hc == 'YN' and lc == 'yn':
                    out.append(('series0', lv, hv, sc(z0 + 3 * e['Zn_hv'] + 3 * e['Zn_lv'] * (e['Uhv'] / e['Ulv']) ** 2) / zb, 1 / tau))
            elif k == 'transformer3':
                self._t3(e, out, corr, cmax, sc)
            elif k == 'generator':
                bus = e['bus']
                Ur, Sr = e['Ur'], e['Sr']
                Xd = e['xd2'] * Ur * Ur / Sr
                RGf = Xd * (0.15 if Ur <= 1000 else (0.05 if Sr >= 100e6 else 0.07))      # R_Gf of 6.6.1 (peak current)
                RG = RGf if (rgf or e['RG'] is None) else e['RG']
                sinp = math.sqrt(max(1 - e['cosphi'] ** 2, 0))
                Un = B[bus]['Un']
                K = Un / (Ur * (1 + e['pG'])) * cmax / (1 + e['xd2'] * sinp) if corr else 1.0
                z = K * complex(RG, Xd)
                zb = self._zb(bus)
                z0 = None
                if e['earthed'] and e['X0'] is not None:
                    z0 = K * complex(RG, e['X0'] * Ur * Ur / Sr)
                Ir = Sr / (SQ3 * Ur)
                rec[e['name']] = {'Z1': z, 'Z0': z0, 'K': K}
                out.append(('shunt', bus, sc(z) / zb, None if z0 is None else sc(z0) / zb, ('G', e['name'], Ir, 1.0, None, 1j * K * Xd / zb)))
            elif k == 'unit':
                g, t = e['gen'], e['trafo']
                bus = e['bus']
                Ur, Sr = g['Ur'], g['Sr']
                tr = t['Uhv'] / t['Ulv']
                Xd = g['xd2'] * Ur * Ur / Sr
                RG = g.get('RG')
                if RG is None or rgf:
                    RG = Xd * (0.05 if Sr >= 100e6 else 0.07)
                zT = _zr(t['uk'], t.get('ur', 0.0), t['Uhv'], t['Sr'])
                Un = B[bus]['Un']
                sinp = math.sqrt(max(1 - g['cosphi'] ** 2, 0))
                xT = zT.imag / (t['Uhv'] ** 2 / t['Sr'])
                if not corr:
                    K = 1.0
                elif e['oltc']:
                    K = (Un / Ur) ** 2 * (t['Ulv'] / t['Uhv']) ** 2 * cmax / (1 + abs(g['xd2'] - xT) * sinp)
                else:
                    K = Un / (Ur * (1 + g.get('pG', 0.0))) * t['Ulv'] / t['Uhv'] * (1 + e['pT']) * cmax / (1 + g['xd2'] * sinp)
                z = K * (tr * tr * complex(RG, Xd) + zT)
                z0 = K * complex(zT.real * t.get('R0R', 1.0), zT.imag * t.get('X0X', 1.0)) + 3 * e['Zn'] if e['earthed'] else None
                zb = self._zb(bus)
                Ir = Sr / (SQ3 * Ur)
                rec[e['name']] = {'Z1': z, 'Z0': z0, 'K': K}
                out.append(('shunt', bus, sc(z) / zb, None if z0 is None else sc(z0) / zb, ('S', e['name'], Ir, tr, None, 1j * K * tr * tr * Xd / zb)))
            elif k == 'motor':
                bus = e['bus']
                SrM = e['Pr'] / (e['eta'] * e['cosphi'])
                ZM = 1 / e['ILR'] * e['Ur'] ** 2 / SrM / e['n']
                rx = e['RX']
                if rx is None:
                    rx = 0.42 if e['Ur'] <= 1000 else (0.10 if e['Pr'] / e['p'] >= 1e6 else 0.15)
                z = _zx(ZM, rx)
                tr = e['Ur'] / B[bus]['Un']
                z = z / (tr * tr)
                IrM = SrM / (SQ3 * e['Ur']) * e['n']
                rec[e['name']] = {'Z1': z, 'Z0': None, 'K': 1.0}
                if mode != 'min':
                    out.append(('shunt', bus, sc(z) / self._zb(bus), None, ('M', e['name'], IrM, 1.0, e['Pr'] / e['p'] / 1e6, 1j * z.imag / self._zb(bus))))
            elif k == 'branch':
                z = complex(e['r'], e['x'])
                tau = e['ratio'] or 1.0
                out.append(('series', e['a'], e['b'], sc(z), None, 1 / tau))
        return out

    def _t3(self, e, out, corr, cmax, sc):
        B = self.buses
        side = {'a': 0, 'b': 1, 'c': 2}
        Ur = e['Ur']
        r = side[e['ref']]
        Uref = Ur[r]
        pairs = {'ab': (0, 0), 'ac': (1, 1), 'bc': (2, 2)}
        Z, K = {}, {}
        for p, (i, _) in pairs.items():
            z = _zr(e['uk'][i], e['ur'][i], Uref, e['S'][p])
            Z[p] = z
            K[p] = _kt(z, Uref, e['S'][p], cmax) if (corr and e['KT']) else 1.0
        ZA = 0.5 * (K['ab'] * Z['ab'] + K['ac'] * Z['ac'] - K['bc'] * Z['bc'])
        ZB = 0.5 * (K['ab'] * Z['ab'] + K['bc'] * Z['bc'] - K['ac'] * Z['ac'])
        ZC = 0.5 * (K['ac'] * Z['ac'] + K['bc'] * Z['bc'] - K['ab'] * Z['ab'])
        self._imp[e['name']] = {'Z1': {'a': ZA, 'b': ZB, 'c': ZC}, 'Z0': None, 'K': K, 'pairs': Z}
        star = '_' + e['name'] + '*'
        ref_bus = e[e['ref']]
        if star not in B:
            B[star] = {'Un': B[ref_bus]['Un'], 'type': 'internal', 'V': 1.0, 'angle': 0.0, 'Vmin': None, 'Vmax': None}
        zb = self._zb(star)
        for s, zs in zip('abc', (ZA, ZB, ZC)):
            bus = e[s]
            tau = (Ur[side[s]] / Uref) / (B[bus]['Un'] / B[star]['Un'])
            out.append(('series', bus, star, sc(zs) / zb, None, tau))       # V_star' = V_bus/τ
        for d in e['z0']:
            s = d['side']
            zr = Z[d.get('ref', 'ab')]
            k = K[d['k']] if d.get('k') else 1.0
            z0 = k * complex(d.get('r', 1.0) * zr.real, d.get('x', 1.0) * zr.imag) + 3 * complex(d.get('Zn', 0))
            bus = e[s]
            z0 = z0 * (Ur[side[s]] / Uref) ** 2                 # Ω at the side's own rated voltage
            out.append(('shunt', bus, None, sc(z0) / self._zb(bus), None))
            self._imp[e['name']]['Z0'] = z0

    def impedances(self, mode='max'):
        """The short-circuit impedances of the elements (Ω, at the element's reference side: HV of a transformer and
        of a power station unit, side ref of a three-winding transformer, the bus of a machine) with the correction
        factor: {name: {'Z1', 'Z0', 'K'}}; a three-winding transformer: Z1 = its corrected star {'a','b','c'}, K per pair."""
        self._sc_parts(mode)
        return dict(self._imp)

    # ------------------------------------------------------------ nodal matrices
    def _index(self):
        names = list(self.buses)
        return names, {n: i for i, n in enumerate(names)}

    def _ybus(self, parts, seq, idx, n):
        Y = np.zeros((n, n), complex)
        for p in parts:
            if p[0] == 'series' or (p[0] == 'series0' and seq == 0):
                _, a, b, z1, z0, ta = p if p[0] == 'series' else (p[0], p[1], p[2], None, p[3], p[4])
                z = z1 if seq == 1 else z0
                if z is None:
                    continue
                y = 1 / z
                i, j = idx[a], idx[b]
                Y[i, i] += y / (ta * ta)
                Y[i, j] -= y / ta
                Y[j, i] -= y / ta
                Y[j, j] += y
            elif p[0] == 'shunt':
                z = p[2] if seq == 1 else p[3]
                if z is None:
                    continue
                i = idx[p[1]]
                Y[i, i] += 1 / z
        # a tiny conductance to earth keeps islands (e.g. a zero sequence without earthing) regular
        Y[np.diag_indices(n)] += 1e-12
        return Y

    def _ratios(self, k, idx):
        """ρ_n: voltage at the level of bus k per volt at bus n, through the rated transformation ratios."""
        rho = {k: 1.0}
        adj = {}
        for e in self.elements:
            kind = e['kind']
            if kind in ('line', 'reactor') and e.get('b'):
                adj.setdefault(e['a'], []).append((e['b'], 1.0))
                adj.setdefault(e['b'], []).append((e['a'], 1.0))
            elif kind == 'transformer':
                r = e['Uhv'] / e['Ulv']
                adj.setdefault(e['lv'], []).append((e['hv'], 1 / r))
                adj.setdefault(e['hv'], []).append((e['lv'], r))
            elif kind == 'transformer3':
                U = dict(zip('abc', e['Ur']))
                for s in 'abc':
                    for t in 'abc':
                        if s != t:
                            adj.setdefault(e[s], []).append((e[t], U[s] / U[t]))
            elif kind == 'branch':
                r = e['ratio'] or 1.0
                ra = r * self.buses[e['a']]['Un'] / self.buses[e['b']]['Un'] if e['ratio'] else self.buses[e['a']]['Un'] / self.buses[e['b']]['Un']
                adj.setdefault(e['a'], []).append((e['b'], 1 / ra))
                adj.setdefault(e['b'], []).append((e['a'], ra))
        todo = [k]
        while todo:
            a = todo.pop()
            for b, r in adj.get(a, []):
                # crossing a → b: V_a = V_b·r, so ρ_b = ρ_a·r
                if b not in rho:
                    rho[b] = rho[a] * r
                    todo.append(b)
        return rho

    # ------------------------------------------------------------ short circuit
    def short_circuit(self, bus, fault='3ph', mode='max', f115=None, tmin=0.1, temp=None, lv_tol=0.06, fc=None, breaking='z', rgf=False):
        """IEC 60909-0 at one bus. fault: '3ph', '2ph', '1ph' (line-to-earth), '2phE'; mode 'max' or 'min'.
        Returns a dict (currents in A, impedances in Ω at the bus' voltage level):
          Ik (I″k), ip_b (method B, with the factor 1,15 when f115 is True, or automatically: when R/X ≥ 0,3 in a
          branch), ip_b0 (method B without 1,15), ip_c (method C, f_c = 20 Hz at 50 Hz, 24 Hz at 60 Hz), kappa_b,
          kappa_c, Ib (Formula 77 for three-phase, = I″k otherwise), Ik_ss (I_k = I″kM0), Z1, Z0, X0X1, c,
          contributions of the machines, and for '1ph' ip_c012 (κ from Σ R/Σ X of the three sequences at f_c)."""
        bus = str(bus)
        if bus not in self.buses:
            raise NetworkError(f'unknown bus {bus}')
        Un = self.buses[bus]['Un']
        c = c_factor(Un, mode, lv_tol)
        cmax = c_factor(Un, 'max', lv_tol)
        fcr = (fc or (20.0 if abs(self.f - 50) < 1 else 24.0)) / self.f
        parts = self._sc_parts(mode, 1.0, 1.1, temp)
        names, idx = self._index()
        n = len(names)
        k = idx[bus]
        Y1 = self._ybus(parts, 1, idx, n)
        e = np.zeros(n, complex)
        e[k] = 1
        z1col = np.linalg.solve(Y1, e)
        Z1 = z1col[k]
        zb, ib = self._zb(bus), self._ib(bus)
        out = {'bus': bus, 'fault': fault, 'mode': mode, 'Un': Un, 'c': c, 'Z1': Z1 * zb}
        # method C: the same network with the reactances at f_c
        Yc = self._ybus(self._sc_parts(mode, fcr, 1.1, temp, rgf), 1, idx, n)
        if rgf:
            Zr = np.linalg.solve(self._ybus(self._sc_parts(mode, 1.0, 1.1, temp, True), 1, idx, n), e)[k]
        Zc = np.linalg.solve(Yc, e)[k]
        rx_c = Zc.real / Zc.imag * fcr
        rx_b = (Zr if rgf else Z1).real / (Zr if rgf else Z1).imag
        kb, kc = kappa(rx_b), kappa(rx_c)
        if f115 is None:
            f115 = any(p[0] == 'series' and p[3].imag > 0 and p[3].real / p[3].imag >= 0.3 for p in parts)
        fb = 1.15 if f115 else 1.0
        kb_lim = min(fb * kb, 1.8 if Un <= 1000 else 2.0)
        out.update(kappa_b=kb, kappa_c=kc, RX_b=rx_b, RX_c=rx_c, f115=bool(f115))
        if fault == '3ph':
            If = c / Z1
            Ik = abs(If) * ib
            out['Ik'] = Ik
            out['ip_b'], out['ip_b0'], out['ip_c'] = kb_lim * math.sqrt(2) * Ik, kb * math.sqrt(2) * Ik, kc * math.sqrt(2) * Ik
            out.update(self._breaking(parts, idx, z1col, If, k, bus, c, tmin, breaking))
            # I_k = I″kM0: without motors
            if any(p[0] == 'shunt' and p[4] and p[4][0] == 'M' for p in parts):
                Ym = self._ybus([p for p in parts if not (p[0] == 'shunt' and p[4] and p[4][0] == 'M')], 1, idx, n)
                out['Ik_ss'] = abs(c / np.linalg.solve(Ym, e)[k]) * ib
            else:
                out['Ik_ss'] = Ik
            out['Sk'] = SQ3 * Un * Ik
            return out
        Z2 = Z1
        if fault == '2ph':
            Ik = abs(c / (Z1 + Z2)) * SQ3 * ib
            out.update(Ik=Ik, Ib=Ik, ip_b=kb_lim * math.sqrt(2) * Ik, ip_b0=kb * math.sqrt(2) * Ik, ip_c=kc * math.sqrt(2) * Ik)
            return out
        Y0 = self._ybus(parts, 0, idx, n)
        Z0 = np.linalg.solve(Y0, e)[k]
        out['Z0'] = Z0 * zb
        out['X0X1'] = Z0.imag / Z1.imag
        if fault == '1ph':
            I0 = c / (Z1 + Z2 + Z0)
            Ik = abs(3 * I0) * ib
            Y0c = self._ybus(self._sc_parts(mode, fcr, 1.1, temp, rgf), 0, idx, n)
            Z0c = np.linalg.solve(Y0c, e)[k]
            rx012 = (2 * Zc.real + Z0c.real) / (2 * Zc.imag + Z0c.imag) * fcr
            k012 = kappa(rx012)
            out.update(Ik=Ik, Ib=Ik, ip_b=kb_lim * math.sqrt(2) * Ik, ip_b0=kb * math.sqrt(2) * Ik, ip_c=kc * math.sqrt(2) * Ik,
                       kappa_c012=k012, ip_c012=k012 * math.sqrt(2) * Ik)
            return out
        if fault == '2phE':
            E = c
            D = Z1 * Z2 + Z1 * Z0 + Z2 * Z0
            I1 = E * (Z2 + Z0) / D
            I2 = -E * Z0 / D
            I0 = -E * Z2 / D
            Ib_ = I0 + A120 ** 2 * I1 + A120 * I2
            Ic_ = I0 + A120 * I1 + A120 ** 2 * I2
            out.update(Ik=max(abs(Ib_), abs(Ic_)) * ib, IkL2=abs(Ib_) * ib, IkL3=abs(Ic_) * ib, IkE=abs(3 * I0) * ib)
            out['Ib'] = out['Ik']
            return out
        raise NetworkError(f'unknown fault {fault}')

    def _breaking(self, parts, idx, zcol, If, k, bus, c, tmin, breaking='z'):
        """I_b with Formula (77): the machines' partial currents and impedances referred to the fault's level."""
        rho = self._ratios(bus, idx)
        Unk = self.buses[bus]['Un']
        ib_k = self._ib(bus)
        Ib = If
        contrib = []
        for p in parts:
            if p[0] != 'shunt' or not p[4]:
                continue
            kind, name, Ir, tr, m, xm = p[4]
            nb = p[1]
            Vn = -zcol[idx[nb]] * If                       # node voltage from the fault current (pu of bus nb)
            Im = -Vn / p[2]                                 # from the machine into the network (pu of bus nb)
            Unn = self.buses[nb]['Un']
            I_act = abs(Im) * self._ib(nb)                  # A at bus nb
            r = rho.get(nb, Unk / Unn)
            zdu = p[2] if breaking == 'z' else xm                 # 'z': Z_GK, Z_SK, Z_M (2016); 'x': jX″ of the machine (2001)
            dU = zdu * Im * Unn * r / (c * Unk)             # ΔU″/(c·U_n/√3) at the fault's level
            Iref = Im * Unn / (r * Unk)                     # pu of the fault's bus
            mach = I_act * tr                               # at the machine's terminals (unit: via t_r)
            mu = mu_factor(mach / Ir, tmin)
            if kind == 'M':
                q = q_factor(m, tmin)
                fac = 0.0 if mu >= 1 else 1 - mu * q
            else:
                q = None
                fac = 1 - mu
            Ib = Ib - dU * fac * Iref
            contrib.append({'name': name, 'kind': kind, 'Ik': abs(Iref) * ib_k, 'I_machine': mach, 'ratio': mach / Ir, 'mu': mu, 'q': q})
        return {'Ib': abs(Ib) * ib_k, 'machines': contrib}

    def iec60909(self, fault='3ph', buses=None, **kw):
        """short_circuit at every bus (or the given ones), as a list of dicts."""
        return [self.short_circuit(b, fault, **kw) for b in (buses or [b for b, d in self.buses.items() if d['type'] != 'internal'])]

    # ------------------------------------------------------------ load flow
    def _lf_model(self):
        """Ybus (load flow: uncorrected impedances, line charging, taps, phase shifts), injections, bus types."""
        names = [b for b in self.buses]
        idx = {n: i for i, n in enumerate(names)}
        n = len(names)
        rows, cols, vals = [], [], []

        def add(i, j, v):
            rows.append(i)
            cols.append(j)
            vals.append(v)

        def series(a, b, z, ta=1.0, bsh=0.0):
            # tap ratio ta (complex: shift) at bus a, impedance on the side of b, total charging bsh (pu)
            y = 1 / z
            i, j = idx[a], idx[b]
            add(i, i, (y + 0.5j * bsh) / (abs(ta) ** 2))
            add(i, j, -y / ta.conjugate())
            add(j, i, -y / ta)
            add(j, j, y + 0.5j * bsh)

        Sbus = np.zeros(n, complex)       # specified generation (pu)
        load = np.zeros((n, 3), complex)  # ZIP parts of the loads at V = 1 (pu)
        types = {b: ('PQ' if d['type'] in ('PQ', 'internal') else d['type']) for b, d in self.buses.items()}
        Vset = {b: d['V'] for b, d in self.buses.items()}
        ang = {b: d['angle'] for b, d in self.buses.items()}
        qlim = {}
        for e in self.elements:
            k = e['kind']
            if k == 'line':
                zb = self._zb(e['a'])
                z = complex(e['R'], e['X']) * e['length'] / e['parallel'] / zb
                series(e['a'], e['b'], z, 1.0, e['B'] * e['length'] * e['parallel'] * zb)
            elif k == 'branch':
                ta = (e['ratio'] or 1.0) * cmath.exp(1j * math.radians(e['angle']))
                series(e['a'], e['b'], complex(e['r'], e['x']), ta, e['bc'])
            elif k == 'reactor':
                zb = self._zb(e['a'])
                z = complex(e['R'], e['X']) / zb
                if e['b'] is None:
                    add(idx[e['a']], idx[e['a']], 1 / z)
                else:
                    series(e['a'], e['b'], z)
            elif k == 'transformer':
                hv, lv = e['hv'], e['lv']
                zT = _zr(e['uk'], e['ur'], e['Uhv'], e['Sr']) / self._zb(hv)
                tau = (e['Uhv'] * (1 + e['tap'] / 100) / e['Ulv']) / (self.buses[hv]['Un'] / self.buses[lv]['Un'])
                sh = e['shift'] if e['shift'] is not None else 0.0
                # the ideal transformer at the LV side, the impedance on the HV side: V_lv = V_hv'·e^(j·shift)/τ
                series(lv, hv, zT, cmath.exp(1j * math.radians(sh)) / tau)
            elif k == 'transformer3':
                parts = []
                self._t3(e, parts, False, 1.1, lambda z: z)
                for p in parts:
                    if p[0] == 'series':
                        series(p[1], p[2], p[3], p[5])
            elif k == 'shunt':
                i = idx[e['bus']]
                add(i, i, complex(e['P'], -e['Q']) / self.S_base)     # consumed S = |V|²·Y*
            elif k == 'load':
                i = idx[e['bus']]
                S = complex(e['P'], e['Q']) / self.S_base
                load[i] += np.array(e['zip']) * S
            elif k in ('generator', 'unit', 'feeder'):
                b = e['bus']
                i = idx[b]
                if k == 'feeder':
                    if e['slack']:
                        types[b] = 'slack'
                        Vset[b], ang[b] = e['V'], e['angle']
                    continue
                if e.get('slack'):
                    types[b] = 'slack'
                if e.get('P') is not None:
                    Sbus[i] += e['P'] / self.S_base
                if e.get('V') is not None:
                    if types[b] == 'PQ':
                        types[b] = 'PV'
                    Vset[b] = e['V']
                if e.get('Qmin') is not None or e.get('Qmax') is not None:
                    lo, hi = qlim.get(b, (0.0, 0.0))
                    qlim[b] = (lo + (e['Qmin'] if e['Qmin'] is not None else -1e30) / self.S_base,
                               hi + (e['Qmax'] if e['Qmax'] is not None else 1e30) / self.S_base)
        Y = _coo(n, rows, cols, vals)
        return names, idx, Y, Sbus, load, types, Vset, ang, qlim

    def load_flow(self, tol=1e-10, max_iter=30, q_limits=False, flat=False):
        """Newton–Raphson in polar coordinates. Returns a dict: V (pu) and angle (deg) per bus, P, Q injected by the
        sources (W, var), branch flows, losses, iterations, converged."""
        names, idx, Y, Sg, load, types, Vset, ang, qlim = self._lf_model()
        n = len(names)
        if not any(t == 'slack' for t in types.values()):
            raise NetworkError('no slack bus (a feeder or a generator with slack=True)')
        V = np.array([(1.0 if flat and types[b] == 'PQ' else Vset[b]) * cmath.exp(1j * math.radians(0.0 if flat else ang[b])) for b in names])
        for b in names:
            if types[b] in ('PV', 'slack'):
                V[idx[b]] = Vset[b] * cmath.exp(1j * math.radians(ang[b] if (types[b] == 'slack' or not flat) else 0.0))
        it_total = 0
        typ = dict(types)
        while True:
            V, it, ok = _nr(Y, V, Sg, load, [idx[b] for b in names if typ[b] == 'PV'], [idx[b] for b in names if typ[b] == 'PQ'],
                            tol, max_iter)
            it_total += it
            if not (ok and q_limits and qlim):
                break
            S = V * np.conj(Y @ V) + _zip(load, np.abs(V))
            changed = False
            for b, (lo, hi) in qlim.items():
                if typ[b] != 'PV':
                    continue
                Q = S[idx[b]].imag
                if Q > hi + 1e-9 or Q < lo - 1e-9:
                    typ[b] = 'PQ'
                    Sg[idx[b]] = complex(Sg[idx[b]].real, min(max(Q, lo), hi))
                    changed = True
            if not changed:
                break
        Iinj = Y @ V
        S = V * np.conj(Iinj)                        # net injection
        Sl = _zip(load, np.abs(V))
        Sgen = S + Sl
        res = {'converged': bool(ok), 'iterations': it_total, 'buses': {}, 'branches': [], 'types': typ}
        for b in names:
            i = idx[b]
            res['buses'][b] = {'V': float(abs(V[i])), 'angle': float(math.degrees(cmath.phase(V[i]))),
                               'P': float(Sgen[i].real * self.S_base), 'Q': float(Sgen[i].imag * self.S_base),
                               'Pload': float(Sl[i].real * self.S_base), 'Qload': float(Sl[i].imag * self.S_base)}
        res['losses'] = float((Sgen.sum() - Sl.sum()).real * self.S_base)
        res['_V'] = V
        res['_idx'] = idx
        return res


def _coo(n, rows, cols, vals):
    Y = np.zeros((n, n), complex)
    np.add.at(Y, (np.array(rows, int), np.array(cols, int)), np.array(vals, complex))
    return Y


def _zip(load, Vm):
    """Load power at |V|: S₀·(z·V² + i·V + p) per bus."""
    return load[:, 0] * Vm ** 2 + load[:, 1] * Vm + load[:, 2]


def _solve(J, r):
    if J.shape[0] > 60:
        try:
            from scipy.sparse import csc_matrix
            from scipy.sparse.linalg import spsolve
            return spsolve(csc_matrix(J), r)
        except ImportError:
            pass
    return np.linalg.solve(J, r)


def _nr(Y, V, Sg, load, pv, pq, tol, max_iter):
    """Newton–Raphson (MATPOWER's formulation of the Jacobian with dS/dVa, dS/dVm), ZIP loads in the mismatch and
    their voltage dependence in the Jacobian."""
    pvpq = pv + pq
    it = 0
    for it in range(1, max_iter + 1):
        Vm = np.abs(V)
        Ibus = Y @ V
        S = V * np.conj(Ibus)
        mis = S - (Sg - _zip(load, Vm))
        F = np.r_[mis[pvpq].real, mis[pq].imag]
        if np.max(np.abs(F), initial=0.0) < tol:
            return V, it - 1, True
        diagV = np.diag(V)
        dS_dVm = diagV @ np.conj(Y @ np.diag(V / Vm)) + np.diag(np.conj(Ibus) * V / Vm)
        dS_dVa = 1j * diagV @ np.conj(np.diag(Ibus) - Y @ diagV)
        # ZIP: d(S_load)/dVm = S₀·(2z·Vm + i)
        dS_dVm = dS_dVm + np.diag(2 * load[:, 0] * Vm + load[:, 1])
        J = np.block([[dS_dVa[np.ix_(pvpq, pvpq)].real, dS_dVm[np.ix_(pvpq, pq)].real],
                      [dS_dVa[np.ix_(pq, pvpq)].imag, dS_dVm[np.ix_(pq, pq)].imag]])
        dx = _solve(J, -F)
        Va = np.angle(V)
        Va[pvpq] += dx[:len(pvpq)]
        Vm[pq] += dx[len(pvpq):]
        V = Vm * np.exp(1j * Va)
    Vm = np.abs(V)
    S = V * np.conj(Y @ V)
    mis = S - (Sg - _zip(load, Vm))
    F = np.r_[mis[pvpq].real, mis[pq].imag]
    return V, it, bool(np.max(np.abs(F), initial=0.0) < tol)


# ---------------------------------------------------------------- superposition (pre-fault state from the load flow)
def superposition(net, bus, lf=None, loads=True):
    """Three-phase fault current with the superposition method: the pre-fault voltage of the bus from the load flow
    and the network with the machines behind their subtransient impedances (no correction factors, no c), the loads
    as constant impedances at their load-flow voltage (loads=True), as the comparison in IEC TR 60909-4.
    Returns {'Ik': A, 'U0': pu, 'Zk': Ω}."""
    lf = lf or net.load_flow()
    bus = str(bus)
    parts = net._sc_parts('none', 1.0, 1.1)
    if loads:
        for b, v in lf['buses'].items():
            S = complex(v['Pload'], v['Qload']) / net.S_base
            if abs(S) > 0 and v['V'] > 0:
                parts.append(('shunt', b, (v['V'] ** 2) / S.conjugate(), None, None))
    names, idx = net._index()
    n = len(names)
    Y = net._ybus(parts, 1, idx, n)
    e = np.zeros(n, complex)
    e[idx[bus]] = 1
    Zkk = np.linalg.solve(Y, e)[idx[bus]]
    U0 = lf['buses'][bus]['V']
    return {'Ik': abs(U0 / Zkk) * net._ib(bus), 'U0': U0, 'Zk': Zkk * net._zb(bus)}


# ---------------------------------------------------------------- transient recovery voltage of a waveform
def trv(t, v, t0=None, uf=None):
    """Characteristics of a transient recovery voltage across a breaker pole (e.g. the channel CB1/Va of a CB3 with
    'vm'): t0 the current zero (default: the last sample near zero before the first large peak), u_c the first peak,
    t3 its time from t0, the secant rate u_c/t3 and the largest rate of rise, and the amplitude factor u_c/u_f when
    the peak of the power-frequency recovery voltage u_f is given. Envelopes of IEC 62271-100 are not in here."""
    t = [float(x) for x in t]
    v = [float(x) for x in v]
    if len(t) != len(v) or len(t) < 3:
        raise NetworkError('trv: t and v of the same length (≥ 3)')
    amax = max(abs(x) for x in v)
    if amax <= 0:
        raise NetworkError('trv: no recovery voltage')
    big = next(i for i, x in enumerate(v) if abs(x) >= 0.5 * amax)
    if t0 is None:
        # the last sample at zero before the rise (the pole's voltage while closed), else the last below 1 %
        i0 = max((i for i in range(big + 1) if abs(v[i]) <= 1e-9 * amax), default=None)
        if i0 is None:
            i0 = max((i for i in range(big + 1) if abs(v[i]) <= 0.01 * amax), default=0)
    else:
        i0 = min(range(len(t)), key=lambda i: abs(t[i] - t0))
    sgn = 1 if v[big] >= 0 else -1
    k = big
    while k + 1 < len(v) and sgn * v[k + 1] >= sgn * v[k]:
        k += 1
    uc = abs(v[k])
    t3 = t[k] - t[i0]
    rate = max(abs(v[i + 1] - v[i]) / (t[i + 1] - t[i]) for i in range(i0, max(k, i0 + 1)) if t[i + 1] > t[i])
    out = {'t0': t[i0], 'uc': uc, 't3': t3, 'rrrv_secant': uc / t3 if t3 > 0 else float('inf'), 'rrrv_max': rate, 't_peak': t[k]}
    if uf:
        out['kaf'] = uc / uf
    return out


# ---------------------------------------------------------------- MATPOWER cases
def _matrix(text, name):
    m = re.search(r'mpc\.' + name + r'\s*=\s*\[(.*?)\];', text, re.S)
    if not m:
        return []
    rows = []
    for line in m.group(1).split('\n'):
        line = line.split('%')[0].strip().rstrip(';')
        if line:
            rows.append([float(x) for x in line.replace(';', ' ').split()])
    return rows


def read_matpower(source, Un_default=1e3):
    """A Network from a MATPOWER case (file path or text, version 2): buses with base kV as U_n (U_n_default when 0),
    loads (constant power), shunts, generators (PV/slack with P, V, reactive limits), branches in per unit."""
    text = Path(source).read_text() if (isinstance(source, Path) or (isinstance(source, str) and '\n' not in source and Path(source).exists())) else str(source)
    base = re.search(r'mpc\.baseMVA\s*=\s*([\d.eE+-]+)', text)
    net = Network(S_base=float(base.group(1)) * 1e6 if base else 100e6)
    T = {1: 'PQ', 2: 'PV', 3: 'slack', 4: 'isolated'}
    for r in _matrix(text, 'bus'):
        b = str(int(r[0]))
        net.bus(b, (r[9] * 1e3) if r[9] > 0 else Un_default, T.get(int(r[1]), 'PQ'), V=r[7], angle=r[8], Vmin=r[12] if len(r) > 12 else None,
                Vmax=r[11] if len(r) > 11 else None)
        if r[2] or r[3]:
            net.load(b, r[2] * 1e6, r[3] * 1e6, name=f'load{b}')
        if r[4] or r[5]:
            net.shunt(b, r[4] * 1e6, -r[5] * 1e6, name=f'sh{b}')
    for k, r in enumerate(_matrix(text, 'gen'), 1):
        if len(r) > 7 and r[7] <= 0:
            continue
        b = str(int(r[0]))
        slack = net.buses[b]['type'] == 'slack'
        net.generator(b, Sr=max(r[6], 1) * 1e6, Ur=net.buses[b]['Un'], xd2=0.2, cosphi=0.85, P=r[1] * 1e6, V=r[5],
                      Qmin=r[4] * 1e6, Qmax=r[3] * 1e6, slack=slack, name=f'G{k}')
        net.buses[b]['V'] = r[5]
    for k, r in enumerate(_matrix(text, 'branch'), 1):
        if len(r) > 10 and r[10] <= 0:
            continue
        net.branch_pu(str(int(r[0])), str(int(r[1])), r[2], r[3], r[4], r[8], r[9], name=f'br{k}')
    return net


def ieee(case):
    """The IEEE 9- or 14-bus test case (pcl/data/ieee<case>.json, public data as distributed with MATPOWER)."""
    d = json.loads((DATA / f'ieee{int(case)}.json').read_text())
    return from_dict(d)


def ieee9():
    return ieee(9)


def ieee14():
    return ieee(14)


# ---------------------------------------------------------------- JSON
def to_dict(net):
    els = []
    for e in net.elements:
        d = {}
        for k, v in e.items():
            if k.startswith('_'):
                continue
            d[k] = [v.real, v.imag] if isinstance(v, complex) else v
        els.append(d)
    return {'format': 'pcl-network', 'version': 1, 'f': net.f, 'S_base': net.S_base, 'name': net.name,
            'buses': {b: d for b, d in net.buses.items() if d['type'] != 'internal'}, 'elements': els}


def from_dict(d):
    net = Network(d.get('f', 50.0), d.get('S_base', 100e6), d.get('name', ''))
    for b, v in d['buses'].items():
        net.bus(b, v['Un'], v.get('type', 'PQ'), v.get('V', 1.0), v.get('angle', 0.0), v.get('Vmin'), v.get('Vmax'))
    cplx = {'Zn_hv', 'Zn_lv', 'Zn'}
    for e in d['elements']:
        e = dict(e)
        for k in cplx:
            if isinstance(e.get(k), list):
                e[k] = complex(*e[k])
        kind, name = e.pop('kind'), e.pop('name')
        if kind == 'transformer3':
            e['Sr'] = e.pop('S')
        if kind == 'branch':
            net.branch_pu(e['a'], e['b'], e['r'], e['x'], e.get('bc', 0), e.get('ratio', 0), e.get('angle', 0), name=name)
            continue
        getattr(net, kind)(name=name, **e)
    return net


def save(net, path):
    Path(path).write_text(json.dumps(to_dict(net), indent=1, ensure_ascii=False), encoding='utf-8')


def load(path):
    return from_dict(json.loads(Path(path).read_text(encoding='utf-8')))
