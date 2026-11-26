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
    def bus(self, name, Un, kind='PQ', V=1.0, angle=0.0, Vmin=None, Vmax=None, label=None):
        """4.19.4: label = a name to show beside the bus (the bus names of a file whose buses are numbers); it is kept only
        when given, so a network without labels is written as before."""
        name = str(name)
        self.buses[name] = {'Un': float(Un), 'type': kind, 'V': float(V), 'angle': float(angle), 'Vmin': Vmin, 'Vmax': Vmax}
        if label:
            self.buses[name]['label'] = str(label)
        return name

    def _add(self, kind, name, **kw):
        name = str(name or f'{kind}{sum(e["kind"] == kind for e in self.elements) + 1}')
        # 4.19.4: the names in a set that follows the list (a file of thousands of elements was read in time that grew with
        # the square of their number); the set is made again whenever the list is another one or has another length
        c = self.__dict__.get('_names')
        if c is None or c[0] is not self.elements or c[1] != len(self.elements):
            c = self.__dict__['_names'] = [self.elements, len(self.elements), {e['name'] for e in self.elements}]
        if name in c[2]:
            raise NetworkError(f'element {name} exists')
        c[2].add(name)
        c[1] += 1
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

    def line(self, a, b, R, X, length=1.0, B=0.0, R0=None, X0=None, parallel=1, name=None, alpha=0.004, rating=None):
        """Line or cable: R, X (Ω/km), B (S/km, charging, load flow only), R₀, X₀ (Ω/km), length (km), identical
        parallel circuits (no zero-sequence coupling between them). 4.19.1: rating (VA, all the parallel circuits together)
        for the optimal power flow and the N−1 screening."""
        opf = {} if rating is None else {'rating': float(rating)}
        return self._add('line', name, a=a, b=b, R=float(R), X=float(X), length=float(length), B=float(B), R0=R0, X0=X0,
                         parallel=int(parallel), alpha=alpha, **opf)

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
                  Qmin=None, Qmax=None, slack=False, name=None, Pmin=None, Pmax=None, cost=None):
        """Synchronous generator directly connected: S_rG, U_rG, x″d (pu), cos φ_rG, R_G (Ω; None: R_Gf of IEC 60909-0),
        p_G (voltage regulation), x_dsat; load flow: P (W), V (pu) of a PV bus, reactive limits (var).
        4.19.1, optimal power flow: Pmin, Pmax (W) and cost = (c2, c1, c0), the cost per hour c2·P² + c1·P + c0 with P in MW
        (the polynomial cost of the MATPOWER cases)."""
        opf = {k: v for k, v in (('Pmin', Pmin), ('Pmax', Pmax), ('cost', None if cost is None else [float(c) for c in cost])) if v is not None}
        if cost is not None and len(opf['cost']) != 3:
            raise NetworkError('cost = (c2, c1, c0): three coefficients')
        return self._add('generator', name, bus=bus, Sr=float(Sr), Ur=float(Ur), xd2=float(xd2), cosphi=float(cosphi), RG=RG,
                         xdsat=xdsat, pG=float(pG), X0=X0, earthed=earthed, P=P, V=V, Qmin=Qmin, Qmax=Qmax, slack=slack, **opf)

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

    def load(self, bus, P, Q, zip=(0.0, 0.0, 1.0), name=None, spectrum=None, delta=False):
        """Load for the load flow (W, var at V = 1 pu) with the ZIP fractions (constant impedance, current, power).
        Not in the short circuit (IEC 60909-0 neglects non-rotating loads).
        4.19.5, harmonic load flow (pcl.harmonic): spectrum makes the load a source of harmonic currents: a name of
        pcl.harmonic.SPECTRA or {order: (magnitude as a part of the fundamental, angle in degrees)} with the order 1 in it;
        delta: the load is behind a star–delta transformer that the network does not show as a phase shift."""
        z = tuple(float(x) for x in zip)
        if abs(sum(z) - 1) > 1e-9:
            raise NetworkError('ZIP fractions must add up to 1')
        more = {} if spectrum is None else {'spectrum': spectrum, 'delta': bool(delta)}
        return self._add('load', name, bus=bus, P=float(P), Q=float(Q), zip=z, **more)

    def shunt(self, bus, P=0.0, Q=0.0, name=None, R=None, X=None, B=None):
        """Shunt admittance given by its power at V = 1 pu (W, var; Q > 0 absorbs, as MATPOWER's Gs, −Bs).
        4.19.5: or by what it is made of, in per unit of S_base at the fundamental: a capacitor B alone, or a tuned filter, R and X
        in series with the capacitor B (tuned at the order 1/√(X·B)). P and Q follow from them; the harmonic load flow uses R, X, B."""
        if B is not None:
            R, X, B = float(R or 0.0), float(X or 0.0), float(B)
            if B <= 0 or R < 0 or X < 0:
                raise NetworkError('shunt: B above zero, R and X not below zero (per unit)')
            y = 1 / complex(R, X - 1 / B)
            return self._add('shunt', name, bus=bus, P=y.real * self.S_base, Q=-y.imag * self.S_base, R=R, X=X, B=B)
        return self._add('shunt', name, bus=bus, P=float(P), Q=float(Q))

    def branch_pu(self, a, b, r, x, bc=0.0, ratio=0.0, angle=0.0, name=None, rating=None):
        """A branch in per unit of S_base and the buses' U_n (the MATPOWER model: tap ratio and shift at bus a).
        4.19.1: rating (VA) = the limit of the apparent power at both ends for the optimal power flow and the N−1 screening."""
        opf = {} if rating is None else {'rating': float(rating)}
        return self._add('branch', name, a=a, b=b, r=float(r), x=float(x), bc=float(bc), ratio=float(ratio), angle=float(angle), **opf)

    def sssc(self, line, X=None, Vq=None, P=None, Xmax=None, name=None):
        """4.10 (ROADMAP §50): a static synchronous series compensator (or its modular form, the m-SSSC) in series with a line
        or a branch, in the load flow as a series reactance that adds −jX (Ω on the base of the line's end a; X > 0
        capacitive, X < 0 inductive): a given X, or a voltage V_q (V, per phase, positive capacitive) in quadrature with the
        line current (X = V_q/I), or the X that makes the active power from end a equal to P (W), within ±Xmax (Ω).
        Hingorani & Gyugyi, Understanding FACTS, §6.3; the variable series reactance of Acha et al., FACTS, §5.4.1, here
        with an outer secant iteration around the Newton–Raphson load flow. Not in the short-circuit calculation (bypassed)."""
        if sum(v is not None for v in (X, Vq, P)) != 1:
            raise NetworkError('sssc: give exactly one of X, Vq, P')
        e = self.element(line)
        if e['kind'] not in ('line', 'branch'):
            raise NetworkError(f'sssc: {line} is not a line or a branch')
        return self._add('sssc', name, line=str(line), X=None if X is None else float(X), Vq=None if Vq is None else float(Vq),
                         P=None if P is None else float(P), Xmax=None if Xmax is None else float(Xmax))

    # ------------------------------------------------------------ 4.20: multi-terminal DC grids (pcl.dcgrid, ROADMAP §82)
    def dc_bus(self, name, Un, V=1.0, R=None, C=None):
        """A bus of a DC grid: U_n (V, pole to pole for a bipole or a symmetric monopole), V (pu) the start of the load flow,
        R (Ω) a resistance to ground (leakage) or None.
        The DC buses are kept apart from the AC buses (self.dc_buses), so that the AC studies do not see them.
        5.0.16, for the RMS dynamics (pcl.rms.HVDC): C (F) a capacitance of the bus to ground (as a capacitor of a drawing on
        its node); the steady state does not see it."""
        name = str(name)
        if name in self.buses:
            raise NetworkError(f'DC bus {name}: there is an AC bus with this name')
        if C is not None and float(C) < 0:
            raise NetworkError(f'DC bus {name}: C ≥ 0')
        self.__dict__.setdefault('dc_buses', {})[name] = {'Un': float(Un), 'V': float(V), **({} if R is None else {'R': float(R)}),
                                                          **({} if C is None else {'C': float(C)})}
        return name

    def _dc(self, b, who):
        b = str(b)
        if b not in self.__dict__.get('dc_buses', {}):
            raise NetworkError(f'{who}: unknown DC bus {b}')
        return b

    def dc_line(self, a, b, R=None, r=None, length=1.0, poles=2, name=None, rating=None, L=None, C=None):
        """A DC line or cable between two DC buses: R (Ω, one conductor) or r (Ω/km) × length (km); poles = 2 the loop of
        two conductors, 1 one conductor with a return of no resistance; rating (A) for the report (pcl.dcgrid.DCGrid.line).
        5.0.15, for the RMS dynamics (pcl.rms.HVDC): L (H) and C (F, to ground) of one conductor, the whole length; the
        steady state does not see them."""
        if (R is None) == (r is None):
            raise NetworkError('dc_line: give R or r')
        Rt = float(R) if R is not None else float(r) * float(length)
        nm = str(name or f'dc_line{sum(e["kind"] == "dc_line" for e in self.elements) + 1}')
        a, b = self._dc(a, nm), self._dc(b, nm)
        kw = {} if rating is None else {'rating': float(rating)}
        for k, v in (('L', L), ('C', C)):
            if v is not None:
                if float(v) < 0:
                    raise NetworkError(f'{nm}: {k} ≥ 0')
                kw[k] = float(v)
        self._add('dc_line', nm, R=Rt, poles=int(poles), **kw)
        self.elements[-1].update(a=a, b=b)                 # (DC buses: not the AC buses that _add checks)
        return nm

    def vsc(self, bus, dc, control='P', P=0.0, V=1.0, droop=None, Prated=None, R=None, Q=0.0, Vac=None, side='dc', I=None,
            Rtr=0.0, Xtr=0.0, Bf=0.0, Rc=0.0, Xc=0.0, a_loss=0.0, b_loss=0.0, crec=0.0, cinv=0.0, name=None, Imax=None, Ucmax=None, Ucmin=None,
            Qmin=None, Qmax=None):
        """A converter station between the AC bus `bus` and the DC bus `dc` (4.20, pcl.dcgrid). DC side: control 'P' (P in W
        into the DC grid; with side = 'ac' P is the power it gives to the AC bus), 'V' (the DC slack at V pu), 'droop'
        (P = P_0 − R·(U − U_0), P_0 = P, U_0 = V·U_n, R in W/V or droop ρ in pu with P_rated in W), 'idroop' (current droop),
        'I' (a constant DC current I in A into the DC grid).
        AC side: Q (var, given to the AC bus) or Vac (pu: the station holds the voltage of its bus, a PV bus; then no other
        source may hold that bus). The station: Rtr + jXtr, the filter Bf, the reactor Rc + jXc (pu on S_base and the AC
        bus base), the losses a_loss (W) + b_loss (V)·I + c (Ω)·I² (I in A), c = crec while it takes power from the AC grid, cinv while it
        gives. In the AC solvers it is a fixed injection: the one of its last AC/DC load flow (acdc_flow), or before that
        −P (side 'dc') or P (side 'ac') for control 'P' and nothing for the others.
        4.21, the limits of the station (Beerten, Cole & Belmans 2012, §II-B, Fig. 3; only where given): Imax (A) the current of
        the converter, Ucmax, Ucmin (pu of the AC bus base) its voltage; acdc_flow(limits=True) holds them. Qmin, Qmax (var, at
        the converter) and ±P_rated (at the converter) bound it in the optimal power flow AC/DC (acdc_opf).
        5.0.15 — control 'Vf': the station forms the voltage and the frequency of its AC bus (an offshore island: CIGRE TB 604,
        §6.6.2): the slack of its AC island at |V| = Vac (1 pu if not given) and the angle 0, and its DC side gives the DC
        grid what the island takes (as a converter 'P' with side 'ac'); no other source may be on its AC island bus."""
        if control not in ('P', 'V', 'droop', 'idroop', 'I', 'Vf'):
            raise NetworkError('vsc: control one of P, V, droop, idroop, I, Vf')
        if control in ('droop', 'idroop') and R is None and (droop is None or Prated is None):
            raise NetworkError('vsc: a droop needs R, or droop and Prated')
        nm = str(name or f'vsc{sum(e["kind"] == "vsc" for e in self.elements) + 1}')
        dc = self._dc(dc, nm)
        opt = {k: float(v) for k, v in (('droop', droop), ('Prated', Prated), ('R', R), ('Vac', Vac), ('I', I), ('Imax', Imax), ('Ucmax', Ucmax), ('Ucmin', Ucmin), ('Qmin', Qmin), ('Qmax', Qmax)) if v is not None}
        self._add('vsc', nm, bus=bus, dc=dc, control=control, P=float(P), V=float(V), Q=float(Q), side=side, Rtr=float(Rtr), Xtr=float(Xtr),
                  Bf=float(Bf), Rc=float(Rc), Xc=float(Xc), a_loss=float(a_loss), b_loss=float(b_loss), crec=float(crec), cinv=float(cinv), **opt)
        return nm

    def dcdc(self, a, b, control='P', P=0.0, V=1.0, droop=None, Prated=None, R=None, name=None):
        """4.21: a DC/DC converter from the DC bus a to the DC bus b (pcl.dcgrid.DCGrid.dcdc; Jovcic 2019, §30.3.3, lossless):
        control 'P' (P in W from a to b), 'V' (holds the voltage of b at V pu), 'droop' (P = P_0 − R·(U_b − U_0), R in W/V or
        droop ρ in pu with P_rated in W). The buses may be of two DC grids with different U_n. It has no AC side, so the AC
        studies do not see it."""
        if control not in ('P', 'V', 'droop'):
            raise NetworkError('dcdc: control one of P, V, droop')
        if control == 'droop' and R is None and (droop is None or Prated is None):
            raise NetworkError('dcdc: a droop needs R, or droop and Prated')
        nm = str(name or f'dcdc{sum(e["kind"] == "dcdc" for e in self.elements) + 1}')
        a, b = self._dc(a, nm), self._dc(b, nm)
        if a == b:
            raise NetworkError(f'{nm}: a DC/DC converter needs two DC buses')
        opt = {k: float(v) for k, v in (('droop', droop), ('Prated', Prated), ('R', R)) if v is not None}
        self._add('dcdc', nm, control=control, P=float(P), V=float(V), **opt)
        self.elements[-1].update(a=a, b=b)                 # (DC buses: not the AC buses that _add checks)
        return nm

    def dc_source(self, bus, I=0.0, name=None):
        """5.0.16: a current source into a DC bus (A; a current source of a drawing on its node, the other terminal on the
        ground). In the AC/DC load flow a converter of constant current of the DC grid (pcl.dcgrid, control 'I'); in the RMS
        dynamics (pcl.rms.HVDC) constant, or with dynamic data the current of an expression of the DC voltages and of t."""
        nm = str(name or f'dc_source{sum(e["kind"] == "dc_source" for e in self.elements) + 1}')
        b = self._dc(bus, nm)
        self._add('dc_source', nm, I=float(I))
        self.elements[-1].update(bus=b)                    # (a DC bus: not the AC buses that _add checks)
        return nm

    def dc_dispatcher(self, members, V=1.0, weights=None, buses=None, name=None):
        """4.21: the dispatcher of a DC grid (pcl.dcgrid.DCGrid.dispatcher; Jovcic 2019, §27.6.2, Fig. 27.5, in steady state): the
        converters `members` (vsc with control P or droop, side 'dc') share x in the shares `weights` (equal by default), so
        that the average DC voltage of their buses (or of `buses`) is V (pu)."""
        nm = str(name or f'dc_dispatcher{sum(e["kind"] == "dc_dispatcher" for e in self.elements) + 1}')
        members = [str(m) for m in members]
        for m in members:
            e = self.element(m)
            if e['kind'] != 'vsc' or e['control'] not in ('P', 'droop') or e.get('side', 'dc') != 'dc':
                raise NetworkError(f'{nm}: {m} is not a converter (vsc) with control P or droop on its DC side')
        opt = {}
        if weights is not None:
            opt['weights'] = [float(x) for x in weights]
        if buses is not None:
            opt['buses'] = [self._dc(x, nm) for x in buses]
        self._add('dc_dispatcher', nm, members=members, V=float(V), **opt)
        return nm

    def dc_grid(self):
        """The DC part as a pcl.dcgrid.DCGrid (for the DC load flow alone, with the converters' DC-side controls)."""
        from . import dcgrid
        return dcgrid.grid_of(self)

    def acdc_flow(self, method='auto', tol=1e-8, max_iter=None, flat=False, q_limits=False, limits=False):
        """4.20: the sequential AC/DC load flow (pcl.dcgrid.acdc_flow): the result of power_flow for the AC part with 'dc',
        'converters', 'outer' (the AC/DC iterations). 4.21 — limits: hold the limits of the stations (vsc Imax, Ucmax, Ucmin)."""
        from . import dcgrid
        try:
            return dcgrid.acdc_flow(self, method=method, tol=tol, max_iter=max_iter, flat=flat, q_limits=q_limits, limits=limits)
        except dcgrid.DCGridError as e:
            raise NetworkError(str(e)) from e

    def acdc_opf(self, flow_limits=True, tol=1e-6, max_iter=150, start='auto', dc_limits=(0.9, 1.1)):
        """4.21: the optimal power flow AC/DC (pcl.dcgrid.acdc_opf): every converter station's power is chosen with the
        generation, within the limits of the stations, of the DC voltages (dc_limits, pu) and of the DC lines."""
        from . import dcgrid
        try:
            return dcgrid.acdc_opf(self, flow_limits=flow_limits, tol=tol, max_iter=max_iter, start=start, dc_limits=dc_limits)
        except dcgrid.DCGridError as e:
            raise NetworkError(str(e)) from e

    def acdc_contingency(self, outages=None, limits=True, tol=1e-8, method='auto'):
        """4.21: N−1 with the sequential AC/DC load flow after every outage of an AC branch, DC line, station or DC/DC
        converter (pcl.dcgrid.acdc_contingency)."""
        from . import dcgrid
        return dcgrid.acdc_contingency(self, outages=outages, limits=limits, tol=tol, method=method)

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
    def _lf_model(self, raw=None):
        """Ybus (load flow: uncorrected impedances, line charging, taps, phase shifts), injections, bus types.
        4.19.1: with raw = {} the stamps are not summed into a dense matrix: raw gets 'stamps' = (rows, cols, vals), 'branches' =
        [(name, i, j, y, bsh, ta, rating in pu or None)] for every series element (the π model of series() below) and
        'shunts' = [(i, y)]; the place of Y in the result is None. The sparse solvers of pcl.powerflow build on these."""
        names = [b for b in self.buses]
        idx = {n: i for i, n in enumerate(names)}
        n = len(names)
        rows, cols, vals = [], [], []
        brs, shs, cur = [], [], [None, None]

        def add(i, j, v):
            rows.append(i)
            cols.append(j)
            vals.append(v)
            if i == j and cur[0] is None:
                shs.append((i, v))

        def series(a, b, z, ta=1.0, bsh=0.0):
            # tap ratio ta (complex: shift) at bus a, impedance on the side of b, total charging bsh (pu)
            y = 1 / z
            i, j = idx[a], idx[b]
            ta = complex(ta)
            brs.append((cur[0] if not cur[1] else f'{cur[0]}#{cur[1]}', i, j, y, bsh, ta, cur[2] if len(cur) > 2 else None))
            cur[1] = (cur[1] or 0) + 1
            cur[0], keep = '', cur[0]                      # the four stamps below belong to the branch, not to the shunts
            add(i, i, (y + 0.5j * bsh) / (abs(ta) ** 2))
            add(i, j, -y / ta.conjugate())
            add(j, i, -y / ta)
            add(j, j, y + 0.5j * bsh)
            cur[0] = keep

        Sbus = np.zeros(n, complex)       # specified generation (pu)
        load = np.zeros((n, 3), complex)  # ZIP parts of the loads at V = 1 (pu)
        types = {b: ('PQ' if d['type'] in ('PQ', 'internal') else d['type']) for b, d in self.buses.items()}
        Vset = {b: d['V'] for b, d in self.buses.items()}
        ang = {b: d['angle'] for b, d in self.buses.items()}
        qlim = {}
        xs = self._sssc_x()            # 4.10: Ω of the series compensators on each line, X > 0 capacitive
        for e in self.elements:
            k = e['kind']
            cur[:] = [e['name'] if k in ('line', 'branch', 'reactor', 'transformer', 'transformer3') else None, 0,
                      (e['rating'] / self.S_base) if e.get('rating') else None]
            if k == 'line':
                zb = self._zb(e['a'])
                z = complex(e['R'], e['X']) * e['length'] / e['parallel'] / zb - 1j * xs.get(e['name'], 0.0) / zb
                series(e['a'], e['b'], z, 1.0, e['B'] * e['length'] * e['parallel'] * zb)
            elif k == 'branch':
                ta = (e['ratio'] or 1.0) * cmath.exp(1j * math.radians(e['angle']))
                series(e['a'], e['b'], complex(e['r'], e['x']) - 1j * xs.get(e['name'], 0.0) / self._zb(e['a']), ta, e['bc'])
            elif k == 'reactor':
                zb = self._zb(e['a'])
                z = complex(e['R'], e['X']) / zb
                if e['b'] is None:
                    cur[0] = None
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
            elif k == 'vsc' and e['control'] == 'Vf':        # 5.0.15: a station that forms the voltage of its island: its slack
                b = e['bus']
                if types[b] != 'PQ' or any(q['kind'] in ('generator', 'unit', 'feeder') and q.get('bus') == b for q in self.elements):
                    raise NetworkError(f'{e["name"]}: forms the voltage of bus {b} (Vf), where another source is; only one source may hold a bus')
                types[b] = 'slack'
                Vset[b], ang[b] = (e.get('Vac') if e.get('Vac') is not None else 1.0), 0.0
            elif k == 'vsc':                                 # 4.20: a converter station is the injection of its last AC/DC flow
                b, i = e['bus'], idx[e['bus']]
                ps = e.get('_Ps')
                if ps is None:
                    ps = (e['P'] if e.get('side') == 'ac' else -e['P']) / self.S_base if e['control'] == 'P' else 0.0
                vac = e.get('Vac') if e.get('_Qfix') is None else None   # 4.21: a station that holds its AC voltage, at a limit of Q
                Sbus[i] += complex(ps, 0.0 if vac is not None else (e['_Qfix'] if e.get('_Qfix') is not None else e['_Qs'] if e.get('_Qs') is not None else e['Q'] / self.S_base))
                if vac is not None:
                    if types[b] != 'PQ' or any(q['kind'] in ('generator', 'unit', 'feeder') and q.get('bus') == b for q in self.elements):
                        raise NetworkError(f'{e["name"]}: holds the AC voltage of bus {b}, where another source is; only one source may hold a bus')
                    types[b] = 'PV'
                    Vset[b] = e['Vac']
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
        if raw is not None:
            raw.update(stamps=(rows, cols, vals), branches=brs, shunts=shs)
            return names, idx, None, Sbus, load, types, Vset, ang, qlim
        Y = _coo(n, rows, cols, vals)
        return names, idx, Y, Sbus, load, types, Vset, ang, qlim

    def _sssc_x(self):
        out = {}
        for e in self.elements:
            if e['kind'] == 'sssc':
                out[e['line']] = out.get(e['line'], 0.0) + (e.get('_X') if e.get('_X') is not None else (e['X'] or 0.0))
        return out

    def load_flow(self, tol=1e-10, max_iter=30, q_limits=False, flat=False):
        """Newton–Raphson in polar coordinates. Returns a dict: V (pu) and angle (deg) per bus, P, Q injected by the
        sources (W, var), branch flows (4.10: lines and branches, both ends), losses, iterations, converged; with series
        compensators (sssc) also 'sssc': X, V_q, I, Q per compensator. (q_limits 'side', 4.21: only in power_flow.)"""
        if q_limits == 'side':
            raise NetworkError("load_flow: q_limits='side' is in power_flow (pcl.powerflow.solve)")
        sc = [e for e in self.elements if e['kind'] == 'sssc']
        for e in sc:
            e['_X'] = e['X'] if e['X'] is not None else 0.0
        if any(e['X'] is None for e in sc):
            return self._lf_sssc(sc, tol, max_iter, q_limits, flat)
        return self._lf(tol, max_iter, q_limits, flat)

    def _lf_sssc(self, sc, tol, max_iter, q_limits, flat, it_max=60):
        """4.10: X of the compensators with a target (V_q or P) by a secant iteration, one compensator at a time
        (Gauss–Seidel over the compensators), each X within ±Xmax."""
        def g(e, res):
            f = next(b for b in res['branches'] if b['name'] == e['line'])
            return (e['_X'] * f['I'] - e['Vq']) if e['Vq'] is not None else (f['Pa'] - e['P'])
        res = self._lf(tol, max_iter, q_limits, flat)
        for _ in range(it_max):
            worst = 0.0
            for e in sc:
                if e['X'] is not None:
                    continue
                lim = abs(e['Xmax']) if e['Xmax'] is not None else math.inf
                scale = (abs(e['Vq']) if e['Vq'] is not None else abs(e['P'])) or 1.0
                x0, g0 = e['_X'], g(e, res)
                x1 = min(max(x0 + (1.0 if g0 < 0 else -1.0) * (0.05 * self._zb(self.element(e['line'])['a'])) * (1 if e['Vq'] is None or e['Vq'] >= 0 else -1), -lim), lim)
                for _k in range(40):
                    e['_X'] = x1
                    res = self._lf(tol, max_iter, q_limits, flat)
                    g1 = g(e, res)
                    if abs(g1) < 1e-9 * scale or x1 == x0:
                        break
                    x2 = x1 - g1 * (x1 - x0) / (g1 - g0) if g1 != g0 else x1
                    x0, g0, x1 = x1, g1, min(max(x2, -lim), lim)
                worst = max(worst, abs(g(e, res)) / scale)
            if worst < 1e-8:
                break
        return res

    def _lf(self, tol=1e-10, max_iter=30, q_limits=False, flat=False):
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
        return self._lf_result(names, idx, V, Y @ V, load, typ, ok, it_total)

    def _lf_result(self, names, idx, V, Iinj, load, typ, ok, it_total):
        """The result of a load flow from the bus voltages (the dict that load_flow and power_flow return)."""
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
        res['branches'] = self._flows(V, idx)
        sc = [e for e in self.elements if e['kind'] == 'sssc']
        if sc:
            res['sssc'] = {}
            for e in sc:
                f = next(b for b in res['branches'] if b['name'] == e['line'])
                X = e['_X'] if e.get('_X') is not None else e['X']
                res['sssc'][e['name']] = {'line': e['line'], 'X': float(X), 'Vq': float(X * f['I']), 'I': f['I'], 'Q': float(-3 * X * f['I'] ** 2)}
        return res

    def _flows(self, V, idx):
        """4.10: the flows of the lines and branches at both ends (W, var, the current in A at end a), with the
        compensators' reactance, as stamped in _lf_model."""
        xs, out = self._sssc_x(), []
        for e in self.elements:
            k = e['kind']
            if k not in ('line', 'branch'):
                continue
            zb = self._zb(e['a'])
            if k == 'line':
                z = complex(e['R'], e['X']) * e['length'] / e['parallel'] / zb - 1j * xs.get(e['name'], 0.0) / zb
                ta, bsh = 1.0 + 0j, e['B'] * e['length'] * e['parallel'] * zb
            else:
                z = complex(e['r'], e['x']) - 1j * xs.get(e['name'], 0.0) / zb
                ta, bsh = (e['ratio'] or 1.0) * cmath.exp(1j * math.radians(e['angle'])), e['bc']
            y, va, vb = 1 / z, V[idx[e['a']]], V[idx[e['b']]]
            ia = (y + 0.5j * bsh) / abs(ta) ** 2 * va - y / ta.conjugate() * vb
            ib = -y / ta * va + (y + 0.5j * bsh) * vb
            sa, sb = va * ia.conjugate() * self.S_base, vb * ib.conjugate() * self.S_base
            Ib = self.S_base / (math.sqrt(3) * self.buses[e['a']]['Un'])
            out.append({'name': e['name'], 'a': e['a'], 'b': e['b'], 'Pa': float(sa.real), 'Qa': float(sa.imag), 'Pb': float(sb.real),
                        'Qb': float(sb.imag), 'S': float(max(abs(sa), abs(sb))), 'I': float(abs(ia) * Ib), 'loss': float((sa + sb).real)})
        return out

    # ------------------------------------------------------------ 4.19.1: the sparse solvers (pcl.powerflow, pcl.opf)
    def case(self):
        """The network as arrays in per unit for the solvers of pcl.powerflow (a pcl.powerflow.Case)."""
        from . import powerflow
        if any(e['kind'] == 'sssc' and e['X'] is None for e in self.elements):
            raise NetworkError('a series compensator with a target (V_q or P) is solved by load_flow; give it a reactance X for the sparse solvers')
        for e in self.elements:
            if e['kind'] == 'sssc':
                e['_X'] = e['X']
        return powerflow.Case(self)

    def advice(self, study='pf', scenarios=1):
        """What the engine proposes for this network: {'method', 'why' (the reason, in Greek), 'facts'}. study: 'pf' one load flow,
        'batch' many load flows of this topology, 'n1' the outage of every branch, 'opf' / 'dcopf' the optimal power flow."""
        from . import powerflow
        if study in ('opf', 'dcopf'):
            from . import opf
            return opf.advise(self.case(), 'ac' if study == 'opf' else 'dc')
        return powerflow.advise(self.case(), study, scenarios)

    def power_flow(self, method='auto', tol=1e-8, max_iter=None, q_limits=False, flat=False):
        """The load flow with the sparse solvers (4.19.1, ROADMAP §68). method: 'auto' (the proposal of the engine from the
        network, in the result with its reason), 'nr' (Newton–Raphson on a sparse Jacobian), 'nr_dense' (the path of load_flow),
        'nr_ci' (current injections), 'fdxb' / 'fdbx' (fast decoupled), 'sweep' (backward/forward, radial networks without PV
        buses), 'sweepc' (the sweep with compensation: radial and weakly meshed networks, PV buses; never chosen by 'auto'),
        'gs' (Gauss–Seidel, for teaching), 'dc' (the linear DC approximation: angles only).
        Every method but 'dc' ends on the same mismatch tolerance tol (pu), so the result is the same within it.
        q_limits: False, True (a PV bus past a reactive limit becomes PQ at it), or 'side' (4.21: and a bus at a limit on the
        wrong side of its set voltage holds it again; pcl.powerflow.solve).
        Returns the dict of load_flow, and 'method', 'path' (what ran, with fallbacks), 'advice', 'time' (s); with 'side' also
        'q_side': {'back', 'cycle', 'wrong'}."""
        from . import powerflow
        c = self.case()
        r = powerflow.solve(c, method, tol=tol, max_iter=max_iter, q_limits=q_limits, flat=flat)
        code = {powerflow.PQ: 'PQ', powerflow.PV: 'PV', powerflow.REF: 'slack'}
        typ = {b: code[int(r['typ'][i])] for i, b in enumerate(c.names)}
        V = r['V']
        # (the dense path sums the currents as load_flow does, so that «auto» on a small network gives its numbers bit for bit)
        Iinj = (_coo(c.n, *c.stamps) if r['method'] == 'nr_dense' else c.Y) @ V
        res = self._lf_result(c.names, c.idx, V, Iinj, c.load, typ, r['converged'], r['iterations'])
        res.update(method=r['method'], path=r['path'], advice=r['advice'], time=r['time'])
        if r['method'] == 'dc':
            res['dc'] = True
        if 'side' in r:                        # 4.21: q_limits='side': the buses that held their voltage again, and why it stopped
            q = r['side']
            res['q_side'] = {'back': [c.names[i] for i in q['back']], 'cycle': q['cycle'], 'wrong': [c.names[i] for i in q['wrong']]}
        return res

    def dc_flow(self):
        """The DC load flow: {'buses': {bus: angle in degrees}, 'branches': [{'name', 'a', 'b', 'P' (W)}]}."""
        from . import powerflow
        c = self.case()
        th, Pf = powerflow.dc_flow(c)
        return {'buses': {b: float(math.degrees(th[i])) for i, b in enumerate(c.names)},
                'branches': [{'name': c.br_name[k], 'a': c.names[c.f[k]], 'b': c.names[c.t[k]], 'P': float(Pf[k] * self.S_base)} for k in range(c.nl)]}

    def ptdf(self):
        """Power transfer distribution factors: {'branches', 'buses', 'H' (branches × buses)}; injection at a bus, taken out at the slack."""
        from . import powerflow
        c = self.case()
        return {'branches': list(c.br_name), 'buses': list(c.names), 'H': powerflow.ptdf(c)}

    def lodf(self):
        """Line outage distribution factors: {'branches', 'L'}: L[l, k] = the part of the flow of k that passes to l when k goes
        out (a column of NaN: the outage splits the network)."""
        from . import powerflow
        c = self.case()
        return {'branches': list(c.br_name), 'L': powerflow.lodf(c)}

    def contingency(self, kind='ac', branches=None, ratings=None, tol=1e-8, q_limits=False, backend='auto', how=None):
        """N−1: the outage of every branch (or of those named), one at a time.
        kind='dc': the flows after each outage from the DC load flow and the LODF (linear, a screening).
        kind='ac': the full load flow after each outage, all the outages as a batch on the factors of the base case
        (pcl.powerflow.contingency_ac); every outage is checked on its own mismatch, and one that does not converge on the
        common factors is solved alone by Newton–Raphson.
        ratings: {branch: VA} (default the 'rating' of each branch); without any rating the loading is not judged.
        Returns {'kind', 'base', 'outages': [{'name', 'island', 'converged', 'Smax' (VA) and 'branch' (the most loaded one, by
        loading where ratings exist), 'loading', 'overloads': [(branch, loading)], 'Vmin', 'Vmax' (pu, AC)}], 'worst', 'time',
        'base': {…, 'overloads': the branches over their rating before any outage (4.19.4)},
        'advice', 'chord', 'newton', 'backend', 'how', 'backend_why'}.
        4.19.2, kind 'ac': backend 'auto' (pcl.backend.choose: the CPU, unless the measurement of this machine found the GPU*
        faster for a batch of this size), 'cpu' or 'gpu' (experimental*: falls back to the CPU with the reason in
        'backend_why'); how: the solve of the right-hand sides ('lu', 'inv', 'levels'; default what the backend proposes)."""
        from . import powerflow
        c = self.case()
        if kind not in ('ac', 'dc'):
            raise NetworkError("contingency: kind 'ac' or 'dc'")
        t0 = powerflow.time.perf_counter()
        sel = np.arange(c.nl) if branches is None else np.array([c.br_name.index(b) for b in branches], int)
        rate = c.rate.copy()
        for k, v in (ratings or {}).items():
            rate[c.br_name.index(k)] = v / self.S_base
        base = powerflow.solve(c, 'nr' if c.n > powerflow.DENSE_MAX else 'nr_dense', tol=min(tol, 1e-10), q_limits=q_limits)
        if not base['converged']:
            raise NetworkError('the base case does not converge')
        V0, typ = base['V'], base['typ']
        out = {'kind': kind, 'advice': powerflow.advise(c, 'n1'), 'outages': []}
        isl = powerflow.bridges(c)

        def row(k, S, extra):
            S = np.array(S, float)
            S[k] = 0.0
            ld = S / rate
            j = int(np.nanargmax(ld)) if np.isfinite(ld).any() else int(np.argmax(S))
            return {'name': c.br_name[k], 'island': False, 'converged': True, 'branch': c.br_name[j], 'Smax': float(S[j] * self.S_base),
                    'loading': float(ld[j]) if np.isfinite(ld[j]) else None,
                    'overloads': sorted(((c.br_name[i], float(ld[i])) for i in np.flatnonzero(ld > 1 + 1e-9)), key=lambda q: -q[1]), **extra}
        if kind == 'dc':
            th, Pf = powerflow.dc_flow(c)
            Lm = powerflow.lodf(c)
            out['base'] = {'P': {c.br_name[k]: float(Pf[k] * self.S_base) for k in range(c.nl)}}
            # 4.19.4: the branches already over their rating before any outage, so that an outage can be judged by what it adds
            with np.errstate(invalid='ignore'):
                ld0 = np.abs(Pf) / rate
            out['base']['overloads'] = sorted(((c.br_name[i], float(ld0[i])) for i in np.flatnonzero(ld0 > 1 + 1e-9)), key=lambda q: -q[1])
            for k in sel:
                if isl[k]:
                    out['outages'].append({'name': c.br_name[k], 'island': True, 'converged': False})
                    continue
                out['outages'].append(row(k, np.abs(Pf + Lm[:, k] * Pf[k]), {}))
            out.update(chord=0, newton=0, backend='cpu', how=None, backend_why='γραμμικό (LODF): δεν έχει παρτίδα επαναλήψεων')
        else:
            Sf, St = powerflow.branch_flows(c, V0)
            out['base'] = {'S': {c.br_name[k]: float(max(abs(Sf[k]), abs(St[k])) * self.S_base) for k in range(c.nl)},
                           'Vmin': float(np.abs(V0).min()), 'Vmax': float(np.abs(V0).max())}
            with np.errstate(invalid='ignore'):
                ld0 = np.maximum(np.abs(Sf), np.abs(St)) / rate
            out['base']['overloads'] = sorted(((c.br_name[i], float(ld0[i])) for i in np.flatnonzero(ld0 > 1 + 1e-9)), key=lambda q: -q[1])
            r = powerflow.contingency_ac(c, V0, sel, tol=tol, typ=typ, backend=backend, how=how)
            for j, k in enumerate(sel):
                if r['island'][j] or not r['converged'][j]:
                    out['outages'].append({'name': c.br_name[k], 'island': bool(r['island'][j]), 'converged': False})
                    continue
                V = r['V'][j]
                Sf, St = powerflow.branch_flows(c, V)
                i, m = int(np.argmin(np.abs(V))), int(np.argmax(np.abs(V)))
                out['outages'].append(row(k, np.maximum(np.abs(Sf), np.abs(St)),
                                          {'Vmin': float(abs(V[i])), 'Vmin_bus': c.names[i], 'Vmax': float(abs(V[m])), 'Vmax_bus': c.names[m]}))
            out.update(chord=r['chord'], newton=r['newton'], backend=r['backend'], how=r['how'], backend_why=r['why'])
        ok = [o for o in out['outages'] if o['converged']]
        key = (lambda o: o['loading']) if any(o.get('loading') is not None for o in ok) else (lambda o: o['Smax'])
        out['worst'] = max(ok, key=lambda o: key(o) or 0.0)['name'] if ok else None
        out['islands'] = [o['name'] for o in out['outages'] if o['island']]
        out['failed'] = [o['name'] for o in out['outages'] if not o['island'] and not o['converged']]
        out['time'] = powerflow.time.perf_counter() - t0
        return out

    def batch_flow(self, load_scale=None, gen_scale=None, dS=None, tol=1e-8, backend='auto', how=None, start=None):
        """Many load flows of this network at once (time series, Monte Carlo): pcl.powerflow.batch on the factors of the base case.
        load_scale: B factors (one per scenario) or B × loads (one per load element, in the order of the elements) on the
        constant-power part of the loads; gen_scale: the same on the active power of the generators; or dS (B × buses, VA):
        a change of the net constant-power injection per bus. The slack covers the balance.
        4.19.2: backend and how as in contingency ('auto', 'cpu', 'gpu'*); start: a model of pcl.nnstart for the load flow of
        this network, which proposes the starting voltages of every scenario (used per scenario only where its mismatch is
        smaller than at the base solution).
        Returns {'V' (B × buses, pu), 'angle' (degrees), 'buses', 'converged' (B), 'iterations', 'chord', 'newton', 'time', 'advice',
        'backend', 'how', 'why', 'proposed'}."""
        from . import powerflow
        c = self.case()
        d = None
        loads = [e for e in self.elements if e['kind'] == 'load']
        gens = [e for e in self.elements if e['kind'] in ('generator', 'unit') and e.get('P') is not None]
        for sc, els, sign in ((load_scale, loads, -1.0), (gen_scale, gens, 1.0)):
            if sc is None:
                continue
            sc = np.asarray(sc, float)
            sc = np.repeat(sc[:, None], len(els), axis=1) if sc.ndim == 1 else sc
            if sc.shape[1] != len(els):
                raise NetworkError(f'scale: one column per element ({len(els)}), or one factor per scenario')
            M = np.zeros((len(els), c.n), complex)
            for j, e in enumerate(els):
                M[j, c.idx[e['bus']]] = (complex(e['P'], e['Q']) * e['zip'][2] if sign < 0 else e['P']) / self.S_base
            d = (0 if d is None else d) + sign * (sc - 1) @ M
        if dS is not None:
            d = (0 if d is None else d) + np.asarray(dS, complex) / self.S_base
        if d is None:
            raise NetworkError('batch_flow: give load_scale, gen_scale or dS')
        Vs = None
        if start is not None:
            from . import nnstart
            model = nnstart.find(self, 'pf', c) if isinstance(start, str) else start
            Vs = None if model is None else nnstart.propose_pf(model, self, c, d)
        r = powerflow.batch(c, d, tol=tol, backend=backend, how=how, Vstart=Vs)
        r.update(buses=list(c.names), angle=np.degrees(np.angle(r['V'])), advice=powerflow.advise(c, 'batch', len(r['converged'])))
        r['V'] = np.abs(r['V'])
        return r

    def report(self, study='pf', result=None, title=None, **kw):
        """A report of a study of this network (pcl.report.Report): study 'pf', 'n1', 'n1dc', 'opf' or 'dcopf'; result: the result
        of the study if it has run already (else it runs here with the options kw). net.report('opf').save('report.html')."""
        from . import report
        return report.network_report(self, study, result, title, **kw)

    def scopf(self, **kw):
        """The optimal power flow that stays within the ratings when any one branch is lost (pcl.scopf.solve, 4.19.4): the linear
        network, preventive (the dispatch does not change after the outage). See pcl.scopf.solve for the options and the result."""
        from . import scopf
        return scopf.solve(self, **kw)

    def cpf(self, **kw):
        """The continuation load flow (pcl.cpf.run, 4.19.5): the curve of the load-flow solutions as the load grows, its nose (the
        loading margin) and the weakest buses, with or without the reactive limits of the generators. See pcl.cpf.run for the
        options and the result."""
        from . import cpf
        return cpf.run(self, **kw)

    def estimate(self, measurements=None, **kw):
        """State estimation (pcl.se.run, 4.19.5): the voltages of the network from measurements with errors by weighted least
        squares, with the χ² test and the largest normalized residual test for bad data. Without measurements a set is made
        from the load flow of the network (plan, noise, seed, bad). See pcl.se.run for the options and the result."""
        from . import se
        return se.run(self, measurements, **kw)

    def harmonics(self, sources=None, **kw):
        """The harmonic load flow (pcl.harmonic.run, 4.19.5): the voltage distortion that the harmonic currents of the nonlinear
        loads make, order by order on the linear network, and the frequency scan seen from a bus. The sources are the loads with a
        spectrum, or the list given. See pcl.harmonic.run for the options and the result."""
        from . import harmonic
        return harmonic.run(self, sources, **kw)

    def opf(self, kind='ac', **kw):
        """The optimal power flow (pcl.opf): kind='ac' (interior point on the full equations) or 'dc' (the linear network).
        See pcl.opf.solve for the options and the result. 4.19.2: dS (a change of the injections, VA per bus) and start='nn' or
        start=model (pcl.nnstart): a neural network proposes the starting point and the solver verifies."""
        from . import opf
        st = kw.get('start')
        if st is None or isinstance(st, dict) or (isinstance(st, str) and st != 'nn'):
            return opf.solve(self, kind, **kw)
        # 4.19.2: start='nn' (the model of this network among those of pcl.nnstart.folders) or a model of pcl.nnstart. The
        # model proposes the starting point; the solver verifies (see pcl.opf.solve)
        from . import nnstart
        model = nnstart.find(self, 'opf') if isinstance(st, str) else st
        if model is None:
            kw['start'], note = 'auto', 'νευρωνικό: δεν υπάρχει μοντέλο για αυτό το δίκτυο (python -m pcl nnstart …)'
        else:
            kw['start'], note = nnstart.propose_opf(model, self, kw.get('dS')) if kind == 'ac' else ('auto', 'νευρωνικό: μόνο για το πρόβλημα AC')
        r = opf.solve(self, kind, **kw)
        if note:
            r['start_path'] = [note] + list(r.get('start_path') or [])
        return r

    # ------------------------------------------------------------ to the EMT solver (4.3)
    def equivalent(self, boundary, internal=None, kind='ward', lf=None, slack=None, tol=1e-10, mode='max'):
        """5.0.3 (ROADMAP §96 B.2): the network beyond the boundary buses as an equivalent at the fundamental, from the load
        flow lf (computed when None): 'ward' (exact at the base case), 'xward' (extended Ward: with fictitious PV buses for the
        reactive support of the external generators), 'norton' (the admittance and the currents at the boundary, and the
        Thevenin of many ports) or 'sc' (the sequence networks of IEC 60909-0, mode 'max' or 'min': the same I″k at every kept
        bus). internal: buses of the study area (None: the side without the slack). Returns the dict of
        pcl.equivalent.reduce, with the reduced Network in 'net' for 'ward', 'xward' and 'sc' (pcl.equivalent is experimental)."""
        from . import equivalent
        return equivalent.reduce(self, boundary, internal, kind=kind, lf=lf, slack=slack, tol=tol, mode=mode)

    def dynamic(self, t_end=5.0, events=(), machines=None, default='two_axis', loads='Z', h=0.005, record=0.01,
                method='simultaneous', step='fixed', buses=None, f=None, pf=None, typical=None, slow_after=8, stations=None,
                modes=False):
        """5.0.13 (ROADMAP §101 step 1, THEORY §8ΩΝ): the RMS dynamics of the network from its load flow (pcl.rms, experimental).
        machines: {generator: {'model': 'classical' | 'two_axis' | 'subtransient', the data on its S_n (Xd, Xdp, Xdpp, Xq, Xqp,
        Xqpp, Xl, Td0p, Td0pp, Tq0p, Tq0pp, Ra, H, D, SG10, SG12), 'avr': {'type': 'st1a' | 'dc1a', …}, 'pss': {…},
        'gov': {'type': 'steam' | 'hydro', 'Pr', …}}} (the parameters as the AVR, PSS and GOV of the EMT); a generator not
        listed: `default` with the typical values, or typical='af' (pcl.rms.typical: by its rating, with an ST1A and a governor).
        5.0.14 (§101 step 2, THEORY §8ΩΞ): a generator can be a converter: {'model': 'gfm', 'law': 'droop' | 'vsm' | 'psc', …},
        {'model': 'gfl', 'frq': 'droop', 'pv': True, …}, {'model': 'statcom', …} or {'model': 'svc', …}, with 'storage': {'E' (MWh),
        'soc0', 'smin', 'smax'} for a store of energy (the parameters as the GFMC and the MMCC of the EMT; pcl.rms.Converter).
        events: [{'t', 'kind': 'fault' (bus, z pu), 'clear' (bus), 'trip' (branch), 'gen' (gen: a unit out), 'vref' (gen, dV),
        'pref' (gen, dP), 'load' (bus, P, Q in MW, Mvar), 'shunt' (bus, y pu)}]. loads: 'Z', 'I', 'P', {'z', 'i', 'p'} or
        {'a', 'b'}. record: the interval of the results (s); buses: the buses whose |V| is returned (None: all up to 200).
        slow_after: the Newton iterations of a step above which the next one refactorizes (8 here; 4 in pcl.rms, the core of
        4.23: with the controls 8 saves about half of the factorizations, and the results move less than 10⁻⁷).
        Returns a JSON-ready dict: 't', 'machines' (per generator δ in degrees, ω, f in Hz, P and Q in MW and Mvar, |V|,
        and with controls E_fd, T_m), 'converters' (5.0.14: P, Q, |V|, |I|, ω and f, the current limit, E, soc, B), 'buses',
        'Vmin' (the lowest |V| at each moment), 'stable', 'events', 'stats', 'start'. The centre of inertia is that of the
        machines (a VSM is not in it).
        5.0.15 (§101 step 2, THEORY §8ΩΟ): a network with DC grids (dc_bus, dc_line with L and C, vsc, dcdc) starts from its
        AC/DC load flow, and its stations and DC/DC converters are one device (pcl.rms.HVDC); stations: {station or DC/DC
        converter: its dynamic data (pcl.rms.STATION_DEFAULTS, DCDC_DEFAULTS: the gains of the MMCC of the EMT, W in kJ/MVA,
        Sn)}. Events 'gen' (a station blocked), 'pref' (dP pu of its S_n), 'vref' (dV: of V_dc, or of the AC voltage of a Vf
        station) and 'trip' (branch: a DC line). The result then has 'dc': 'buses' (per DC bus U in kV and V in pu),
        'stations' (P and Q to the AC bus, P_dc into the DC grid in MW, |V|, U_dc in pu, |I| on S_n, f, the current limit),
        'lines' (I in kA, from a to b), 'dcdc' (P in MW, from a to b).
        5.0.16: the current sources of a DC grid (dc_source; stations: {source: {'expr', 'ins', 'pars', 'gain', 'tau', 'k'}} for the
        current of an expression, as pcl.rms.HVDC) in 'dc' 'sources' (I in kA into the bus, P in MW); and a network without
        machines has a 'summary' too (the converters, the stations, the DC voltages).
        5.1 (§101 step 1, THEORY §8ΩΥ): the excitation 'ac1a' of IEEE Std 421.5 ('avr': {'type': 'ac1a', …}, pcl.rms.AVR_DEFAULTS), the
        saturation of the DC1A by two points (E1, SE1, E2, SE2) or as V_X = A_EX·e^(B_EX·E_FD) (VXEXP 1), and the stabilizers
        'pss': {'type': 'pss1a' | 'pss2b', …} (PSS1A_DEFAULTS, PSS2B_DEFAULTS); the case 'two_area' with
        machines=pcl.rms.two_area_machines(…) and loads=pcl.rms.TWO_AREA_LOADS.
        5.1.1 (§101 step 3, THEORY §8ΩΦ): the protection of the MMCC as events, with stations={station: {'prot': 1, 'tprot',
        'Idcmax', 'Vuv', 'tuv', 'tcb'}} (pcl.rms.STATION_DEFAULTS; from a drawing as its MMCC): the events 'block', 'deblock' and 'gen'
        of the protection in 'events' with 'by': 'prot' and 'why' ('uv', 'oc', 'brk'), and 'blocked' (1 while blocked) in 'dc'
        'stations'; and the events 'block' and 'deblock' (gen: a station) by hand.
        5.1.2 (§101 step 1, THEORY §8ΩΧ): modes=True adds 'modes', the electromechanical modes at the start (pcl.rms.System.eigen,
        before the events): the oscillatory ones from 0,05 to 4 Hz with a rotor angle or speed among the four states that take most
        part, each {'lambda': [σ, ω] in 1/s and rad/s, 'f' (Hz), 'zeta', 'shape': {unit: [|·|, angle in degrees]} on the speeds,
        the largest 1, 'part': [[unit, state, participation]]}, by frequency; or {'error': why} when they cannot be had."""
        from . import rms
        if typical is not None:
            machines = {**rms.typical(self, kind=typical), **(machines or {})}
        s = rms.System(self, machines=machines, default=default, loads=loads, f=f, pf=pf, stations=stations)
        start = s.init()
        em = _rotor_modes(s) if modes else None             # 5.1.2: at the start, before the events
        rec = max(1, int(round(float(record) / float(h)))) if record else 1
        r = s.simulate(float(t_end), events=[dict(e) for e in events or ()], h=float(h), method=method, step=step, record_every=rec,
                       slow_after=int(slow_after))
        q = s.quantities(r)
        Sb = self.S_base / 1e6
        fr = s.f
        mach = {}
        for K in s.kinds:
            if 'delta' not in K.states:
                continue
            for nm in K.names:
                d = q[nm]
                o = {'model': getattr(K, 'model', None) or ('classical' if isinstance(K, rms.Classical) else 'two_axis'),
                     'bus': s.names[K.bus[K.names.index(nm)]], 'delta': np.degrees(d['delta']), 'omega': d['omega'],
                     'f': d['omega'] * fr, 'P': d['P'] * Sb, 'Q': d['Q'] * Sb, 'V': d['V']}
                for k in ('Efd', 'Tm', 'Ifd', 'vs'):
                    if k in d:
                        o[k] = d[k]
                if isinstance(K, rms.Unit):
                    o['controls'] = {'avr': K.avr, 'pss': K.pss, 'gov': K.gov}
                mach[nm] = o
        # 5.0.14: the converters (pcl.rms.Converter, Statcom, SVC): P and Q in MW and Mvar, |V|, |I| on their rating, f (Hz) of
        # their EMF (grid-forming) or of their PLL (grid-following), the flag of the current limit, E, the state of charge, B (SVC)
        conv = {}
        for K in s.kinds:
            if not isinstance(K, (rms.Converter, rms.SVC, rms.Statcom)):
                continue
            for nm in K.names:
                d = q[nm]
                kind = 'svc' if isinstance(K, rms.SVC) else 'statcom' if isinstance(K, rms.Statcom) else K.kind
                o = {'model': kind, 'law': K.law if isinstance(K, rms.Converter) else None,
                     'bus': s.names[K.bus[K.names.index(nm)]], 'P': d['P'] * Sb, 'Q': d['Q'] * Sb, 'V': d['V'], 'I': d['I']}
                if 'omega' in d:
                    o['omega'], o['f'] = d['omega'], d['omega'] * fr
                for k in ('limited', 'E', 'soc', 'B'):
                    if k in d:
                        o[k] = d[k]
                conv[nm] = o
        # the centre of inertia: the angles relative to it, the largest spread, the frequency of the system
        out_ = {e['gen'] for e in r['events'] if e['kind'] == 'gen'}   # a tripped unit is out of the centre of inertia
        Hs = {nm: float(K.p['H'][K.names.index(nm)]) for K in s.kinds if 'delta' in K.states for nm in K.names if nm not in out_}
        tot = sum(Hs.values())
        if mach and tot > 0:
            coi = sum(Hs[nm] * np.asarray(o['delta']) for nm, o in mach.items() if nm in Hs) / tot
            fcoi = sum(Hs[nm] * np.asarray(o['f']) for nm, o in mach.items() if nm in Hs) / tot
            for o in mach.values():
                o['delta_coi'] = np.asarray(o['delta']) - coi
        else:
            fcoi = None
        nb = len(s.names)
        sel = list(s.names) if buses is None and nb <= 200 else [str(b) for b in (buses or [])]
        Vabs = np.abs(r['V'])
        if 'dc' in q:                                       # 5.0.15: the DC grids
            K = q['dc']['device']
            dc = {'buses': {b: {'U': q['dc']['buses'][b] * K.Un[k] / 1e3, 'V': q['dc']['buses'][b]} for k, b in enumerate(K.dc_names)},
                  'stations': {}, 'lines': {}, 'dcdc': {nm: v * Sb for nm, v in q['dc']['dcdc'].items()}}
            ctl = {e['name']: e['control'] for e in self.elements if e['kind'] == 'vsc'}
            for nm, d in q['dc']['stations'].items():
                o = {'control': ctl[nm], 'P': d['P'] * Sb, 'Q': d['Q'] * Sb, 'Pdc': d['Pdc'] * Sb, 'Pt': d['Pt'] * Sb, 'V': d['V'], 'Udc': d['Udc'], 'I': d['I'],
                     'f': d['omega'] * fr, 'limited': d['limited']}
                if 'E' in d:
                    o['E'] = d['E']
                if 'blocked' in d:                          # 5.1.1: 1 while blocked (the protection of the MMCC or an event)
                    o['blocked'] = d['blocked']
                dc['stations'][nm] = o
            for j, ln in enumerate(K.lines):
                dc['lines'][ln['name']] = q['dc']['lines'][ln['name']] * self.S_base / K.Un[ln['a']] / 1e3
            if K.sr_names:                                  # 5.0.16: the current sources
                dc['sources'] = {}
                for sq in K.src:
                    i, u = q['dc']['sources'][sq['name']], q['dc']['buses'][K.dc_names[sq['bus']]]
                    dc['sources'][sq['name']] = {'bus': K.dc_names[sq['bus']], 'I': i * self.S_base / K.Un[sq['bus']] / 1e3, 'P': u * i * Sb}
        out = {'t': r['t'], 'machines': mach, 'converters': conv, 'buses': {b: Vabs[:, s.idx[b]] for b in sel if b in s.idx},
               'Vmin': Vabs.min(axis=1), 'Vmin_bus': [s.names[i] for i in Vabs.argmin(axis=1)], 'f_coi': fcoi,
               'stable': s.stable(r), 'events': [{k: v for k, v in e.items() if k != 'i'} for e in r['events']],
               'stats': r['stats'], 'start': start, 'h': float(h), 'method': method, 'step': step, 'loads': loads, 'f': fr,
               'S_base_MVA': Sb, 'n_states': s.nx, 'n_buses': nb}
        if 'dc' in q:
            out['dc'] = dc
        if mach:
            spread = max(float(np.max(np.abs(o['delta_coi']))) for nm, o in mach.items() if nm in Hs) if fcoi is not None else None
            out['summary'] = {'stable': out['stable'], 'max_angle_coi': spread, 'f_min': float(np.min(fcoi)) if fcoi is not None else None,
                              'f_max': float(np.max(fcoi)) if fcoi is not None else None, 'V_min': float(np.min(out['Vmin'])),
                              'V_min_bus': out['Vmin_bus'][int(np.argmin(out['Vmin']))], 'time_s': r['stats']['time'],
                              't_end': float(r['t'][-1]), 'machines': len(mach), 'converters': len(conv), 'states': s.nx}
        elif conv or 'dc' in q:                             # 5.0.16: converters and DC grids without machines
            fs = [np.asarray(o['f']) for o in conv.values() if 'f' in o] + \
                 [np.asarray(o['f']) for o in (out.get('dc') or {}).get('stations', {}).values() if o.get('control') != 'Vf']
            Ud = [np.asarray(d['V']) for d in (out.get('dc') or {}).get('buses', {}).values()]
            out['summary'] = {'stable': out['stable'], 'max_angle_coi': None, 'f_min': float(min(np.min(f) for f in fs)) if fs else None,
                              'f_max': float(max(np.max(f) for f in fs)) if fs else None, 'V_min': float(np.min(out['Vmin'])),
                              'V_min_bus': out['Vmin_bus'][int(np.argmin(out['Vmin']))], 'time_s': r['stats']['time'],
                              't_end': float(r['t'][-1]), 'machines': 0, 'converters': len(conv), 'states': s.nx,
                              **({'Udc_min': float(min(np.min(u) for u in Ud)), 'Udc_max': float(max(np.max(u) for u in Ud)),
                                  'stations': len(out['dc']['stations'])} if Ud else {})}
        if em is not None:
            out['modes'] = em
        return out

    def to_emt(self, lf=None, machines=None, name=None, t_end=0.5, hdiv=400, boundary=None, internal=None, fig='50', **foster_kw):
        """The network as a project of the app for an EMT run that starts in the steady state of the load flow (4.3):
        each generator a GEN3 whose terminal voltage |V|∠θ is the load-flow result at its bus (the EMT start solves the
        circuit with phasors around it, see THEORY), each branch a LINE3 π section in per unit (a branch with a tap a YNyn0
        XF3), each load a LOAD3 of constant impedance equal to the load at its load-flow voltage (P·(z + i/V + p/V²)), each
        shunt a LOAD3 at U_n. machines: {generator name: GEN3 parameters} (e.g. IEEE9_MACHINES); the rest typical values.
        lf: a result of load_flow (computed when None). Returns the project dict (pcl.Project(net.to_emt())).
        5.0.4 (ROADMAP §96 B.2): with boundary (bus names), only the study area (internal: its buses, None: the side without the
        slack) and the rest of the network as one EQV3 at the boundary buses, after CIGRE TB 39, Fig. 15: fig '50' (exact at
        the fundamental), '15b' or '15c' (pcl.equivalent.to_emt; experimental); 5.0.7: '15a' for one boundary bus, the Foster
        circuit fitted to the frequency scan (keywords fmin, fmax, n, line, pure of pcl.equivalent.emt_ports)."""
        if boundary is not None:
            from . import equivalent
            return equivalent.to_emt(self, boundary, internal, lf=lf, machines=machines, fig=fig, name=name, t_end=t_end, hdiv=hdiv, **foster_kw)
        if foster_kw:
            raise NetworkError(f'to_emt: {", ".join(sorted(foster_kw))} only with a boundary (fig 15a)')
        lf = lf or self.load_flow()
        if not lf.get('converged'):
            raise NetworkError('the load flow did not converge')
        machines = machines or {}
        names = [b for b in self.buses if self.buses[b]['type'] != 'internal']
        ncol = max(1, math.ceil(math.sqrt(len(names))))
        pos = {b: (240 + 520 * (i % ncol), 200 + 420 * (i // ncol)) for i, b in enumerate(names)}
        comps, wires, notes = [], [], []

        def C(cid, typ, x, y, params, rot=0, label=None):
            comps.append({'id': cid, 'type': typ, 'x': x, 'y': y, 'rot': rot, 'flip': False, 'label': label or cid, 'params': params})
            return cid

        def W(a, b):
            wires.append({'id': f'w{len(wires) + 1}', 'a': {'c': a[0], 'p': a[1]}, 'b': {'c': b[0], 'p': b[1]}, 'pts': []})

        jid = {b: C('B' + b, 'JUNC', *pos[b], {}, label='') for b in names}
        f = self.f
        for e in self.elements:
            k, nm = e['kind'], e['name']
            if k == 'generator':
                b = e['bus']
                x, y = pos[b]
                r = lf['buses'][b]
                prm = {'Sn': e['Sr'], 'Un': self.buses[b]['Un'], 'f': f, 'conn': 'bus', 'V0': r['V'], 'ang0': r['angle']}
                prm.update(machines.get(nm, {}))
                C(nm, 'GEN3', x - 160, y - 120, prm)
                W((nm, 'abc'), (jid[b], 'j'))
            elif k == 'branch':
                a, b = e['a'], e['b']
                (xa, ya), (xb, yb) = pos[a], pos[b]
                xm, ym = (xa + xb) // 2 // 10 * 10, (ya + yb) // 2 // 10 * 10 + 60
                Un = self.buses[a]['Un']
                if e['angle'] or (e['ratio'] and abs(e['ratio'] - 1) > 1e-12):
                    if e['angle']:
                        raise NetworkError(f'{nm}: phase-shifting branches are not in the EMT export yet')
                    z = math.hypot(e['r'], e['x'])
                    C(nm, 'XF3', xm, ym, {'grp': 'YNyn0', 'Sn': self.S_base, 'U1': Un, 'U2': self.buses[b]['Un'], 'f': f, 'uk': 100 * z,
                                          'Pk': e['r'] * self.S_base, 'i0': 0, 'P0': 0, 'tap': 100 * (e['ratio'] - 1), 'conn': 'bus'})
                    notes.append(f'{nm}: tap {e["ratio"]}: XF3 with half of the leakage on each side (the load flow has it after the tap)')
                else:
                    C(nm, 'LINE3', xm, ym, {'unit': 'pu', 'Un': Un, 'Sb': self.S_base, 'f': f, 'R1': e['r'], 'X1': e['x'], 'B1': e['bc'],
                                            'z0': 'same', 'conn': 'bus'})
                W((nm, 'abc1'), (jid[a], 'j'))
                W((nm, 'abc2'), (jid[b], 'j'))
            elif k == 'line':
                a, b = e['a'], e['b']
                (xa, ya), (xb, yb) = pos[a], pos[b]
                L, n = e['length'], max(1, e['parallel'])
                prm = {'unit': 'ohm', 'Un': self.buses[a]['Un'], 'f': f, 'R1': e['R'] * L / n, 'X1': e['X'] * L / n, 'B1': e['B'] * L * n, 'conn': 'bus'}
                if e.get('R0') is not None and e.get('X0') is not None:
                    prm.update({'z0': 'given', 'R0': e['R0'] * L / n, 'X0': e['X0'] * L / n, 'B0': e['B'] * L * n})
                C(nm, 'LINE3', (xa + xb) // 2 // 10 * 10, (ya + yb) // 2 // 10 * 10 + 60, prm)
                W((nm, 'abc1'), (jid[a], 'j'))
                W((nm, 'abc2'), (jid[b], 'j'))
            elif k in ('load', 'shunt'):
                b = e['bus']
                x, y = pos[b]
                V = lf['buses'][b]['V']
                zz, ii, pp = e.get('zip', (1.0, 0.0, 0.0)) if k == 'load' else (1.0, 0.0, 0.0)
                kk = zz + ii / V + pp / (V * V)
                C(nm, 'LOAD3', x + (100 if k == 'load' else -100), y + 120, {'cn': 'yn', 'Un': self.buses[b]['Un'], 'f': f,
                                                                           'P': e['P'] * kk, 'Q': e['Q'] * kk, 'model': 'z', 'conn': 'bus'})
                W((nm, 'abc'), (jid[b], 'j'))
            else:
                raise NetworkError(f'{nm}: {k} is not in the EMT export yet (generator, branch, line, load, shunt)')
        scope = [[['Y:' + e['name'], 'ω ' + e['name']] for e in self.elements if e['kind'] == 'generator'],
                 [['Y:' + e['name'] + ':pe', 'P ' + e['name']] for e in self.elements if e['kind'] == 'generator']]
        return {'version': 4, 'components': comps, 'wires': wires, 'name': name or self.name or 'network',
                'sim': {'hDiv': int(hdiv), 'speed': 5, 'stopT': float(t_end)}, 'scope': {'panes': scope, 'window': {'unit': 'T', 'n': 10}},
                'meta': {'lf': {b: {'V': lf['buses'][b]['V'], 'angle': lf['buses'][b]['angle']} for b in names}, 'notes': notes}}


def _rotor_modes(s):
    """5.1.2: the electromechanical modes of a pcl.rms.System at its start (Network.dynamic(modes=True)): from 0,05 to 4 Hz, with
    a rotor angle or speed among the states that take most part, by frequency, as JSON; {'error': why} if the linearization or the
    eigenvalues fail (a network with discrete states that the linearization does not take)."""
    try:
        E = s.eigen('auto')
    except Exception as ex:                                # the card shows why; the time domain still runs
        return {'error': str(ex) or type(ex).__name__}
    out = []
    for q in E['modes']:
        lam = complex(q['lambda'])
        if lam.imag <= 0 or not 0.05 <= q['f'] <= 4.0 or not any(st in ('delta', 'omega') for _, st, _ in q['part']):
            continue
        out.append({'lambda': [lam.real, lam.imag], 'f': float(q['f']), 'zeta': float(q['zeta']),
                    'shape': {nm: [abs(v), math.degrees(cmath.phase(v))] for nm, v in q['shape'].items()},
                    'part': [[nm, st, float(p)] for nm, st, p in q['part']]})
    return sorted(out, key=lambda m: m['f'])


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


# ---------------------------------------------------------------- 4.10: where to put a series compensator
SSSC_GOALS = ('loading', 'losses', 'vdev', 'size')


def sssc_placement(net, lines=None, X=None, ratings=None, weights=None, Smax=None, tol=1e-10, frac=(-0.3, -0.15, 0.15, 0.3, 0.5)):
    """4.10 (ROADMAP §50): a series compensator (sssc, a series reactance in the load flow) on each candidate line and at
    each reactance of X (Ω, > 0 capacitive; without X the fractions frac of each line's own reactance), the criteria of
    every case and the weighted choice and its Pareto front.

    Criteria (smaller is better): 'loading' = the largest |S|/rating over the lines and branches (rating: ratings[name] in
    VA, else the largest |S| of the case without compensator, the same for all); 'losses' (W); 'vdev' = the largest |V − 1|
    (pu) over the PQ buses; 'size' = |Q| of the compensator (var, 3·|X|·I²). weights: {criterion: w} on the criteria
    divided by their values without compensator ('size' by the largest size of the cases), default all 1. Smax (var):
    cases whose compensator would be larger are left out. Returns {'base', 'cases', 'best', 'pareto'}: every case
    {line, X, loading, losses, vdev, size, I, score, pareto}; cases that do not converge are left out."""
    def crit(res, Xc=0.0, line=None):
        fl = res['branches']
        rt = ratings or {}
        smax = base_s if base_s else max(b['S'] for b in fl)
        load = max(b['S'] / (rt.get(b['name']) or smax) for b in fl)
        vdev = max((abs(v['V'] - 1) for k, v in res['buses'].items() if res['types'].get(k) == 'PQ'), default=0.0)
        I = next((b['I'] for b in fl if b['name'] == line), 0.0)
        return {'loading': float(load), 'losses': float(res['losses']), 'vdev': float(vdev), 'size': float(3 * abs(Xc) * I * I), 'I': float(I)}
    base_s = None
    work = from_dict(to_dict(net))
    r0 = work.load_flow(tol=tol)
    base_s = max(b['S'] for b in r0['branches'])
    base = crit(r0)
    cand = list(lines) if lines is not None else [e['name'] for e in work.elements if e['kind'] in ('line', 'branch')]
    def xline(ln):
        e = work.element(ln)
        return e['X'] * e['length'] / e['parallel'] if e['kind'] == 'line' else e['x'] * work._zb(e['a'])
    cases = []
    for ln in cand:
        for x in (list(X) if X is not None else [f * xline(ln) for f in frac]):
            w = from_dict(to_dict(net))
            w.sssc(ln, X=x, name='_SSSC')
            try:
                r = w.load_flow(tol=tol)
            except (NetworkError, np.linalg.LinAlgError):
                continue
            if not r['converged']:
                continue
            c = crit(r, x, ln)
            if Smax is not None and c['size'] > Smax:
                continue
            cases.append({'line': ln, 'X': float(x), **c})
    W = {k: 1.0 for k in SSSC_GOALS}
    W.update(weights or {})
    smax = max((c['size'] for c in cases), default=1.0) or 1.0
    norm = {'loading': base['loading'] or 1.0, 'losses': base['losses'] or 1.0, 'vdev': base['vdev'] or 1.0, 'size': smax}
    for c in cases:
        c['score'] = float(sum(W[k] * c[k] / norm[k] for k in SSSC_GOALS))
    # the Pareto front: no other case at least as good in every criterion and better in one
    for c in cases:
        c['pareto'] = not any(all(d[k] <= c[k] for k in SSSC_GOALS) and any(d[k] < c[k] for k in SSSC_GOALS) for d in cases if d is not c)
    best = min(cases, key=lambda c: c['score']) if cases else None
    return {'base': base, 'cases': cases, 'best': best, 'pareto': [c for c in cases if c['pareto']]}


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
    gc = _matrix(text, 'gencost')        # 4.19.1: the cost of each generator (same order as the generators)
    for k, r in enumerate(_matrix(text, 'gen'), 1):
        if len(r) > 7 and r[7] <= 0:
            continue
        b = str(int(r[0]))
        slack = net.buses[b]['type'] == 'slack'
        c = gc[k - 1] if k <= len(gc) else None
        if c is not None and not (int(c[0]) == 2 and int(c[3]) <= 3):
            raise NetworkError(f'generator {k}: only polynomial costs up to the second order are read (MATPOWER model 2)')
        cost = None if c is None else ([0.0] * (3 - int(c[3])) + list(c[4:4 + int(c[3])]))
        net.generator(b, Sr=max(r[6], 1) * 1e6, Ur=net.buses[b]['Un'], xd2=0.2, cosphi=0.85, P=r[1] * 1e6, V=r[5],
                      Qmin=r[4] * 1e6, Qmax=r[3] * 1e6, slack=slack, name=f'G{k}',
                      Pmin=r[9] * 1e6 if len(r) > 9 else None, Pmax=r[8] * 1e6 if len(r) > 8 else None, cost=cost)
        net.buses[b]['V'] = r[5]
    for k, r in enumerate(_matrix(text, 'branch'), 1):
        if len(r) > 10 and r[10] <= 0:
            continue
        net.branch_pu(str(int(r[0])), str(int(r[1])), r[2], r[3], r[4], r[8], r[9], name=f'br{k}',
                      rating=r[5] * 1e6 if len(r) > 5 and r[5] > 0 else None)
    return net


def ieee(case):
    """An IEEE test case: 9, 14, 30, 57, 118 or 300 buses (pcl/data/ieee<case>.json: public IEEE test data as distributed with
    MATPOWER, with the generator costs and limits of those files for the optimal power flow, 4.19.1)."""
    return case_data(f'ieee{int(case)}')


CASES = ('ieee9', 'ieee14', 'ieee30', 'ieee57', 'ieee118', 'ieee300', 'case30', 'case33bw', 'case69', 'pegase1354')
MORE = ('harmonic14', 'mtdc5', 'b4', 'case5_acdc', 'two_area')   # 4.19.5: networks made for one study (they are not in the lists of the other studies); 4.20: mtdc5 (AC/DC); 4.20.1: b4 (pcl.dcgrid.b4_network); 4.21: case5_acdc (the AC/DC OPF); 5.1: two_area (the RMS dynamics, pcl.rms.two_area_machines)


def case_data(name):
    """A test network of pcl/data by its name (CASES): the IEEE cases, 'case30' (the 30-bus case with line ratings of Alsac &
    Stott, for the optimal power flow), the radial feeders 'case33bw' (Baran & Wu) and 'case69', and 'pegase1354' (4.19.3: the
    1354-bus case of the PEGASE project, fictitious data of the size of a part of the European network, CC BY 4.0: the source
    and the licence are in the file). The bus voltages of each file are the published solution of its load flow."""
    f = DATA / f'{name}.json'
    if name not in CASES + MORE or not f.exists():
        raise NetworkError(f'unknown case {name!r}: one of {", ".join(CASES + MORE)}')
    return from_dict(json.loads(f.read_text(encoding='utf-8')))


def case_solution(name):
    """The published load-flow solution of a test network, {bus: (|V| in pu, angle in degrees)}: the bus voltages of the case
    file (3–4 digits). None for the cases whose file has no solved voltages (ieee9, case30)."""
    if name not in CASES + MORE:
        raise NetworkError(f'unknown case {name!r}: one of {", ".join(CASES + MORE)}')
    sol = json.loads((DATA / f'{name}.json').read_text(encoding='utf-8')).get('solution')
    return {b: (v[0], v[1]) for b, v in sol.items()} if sol else None


def ieee9():
    return ieee(9)


# 4.3: the machines of the WSCC 9-bus system on the 100 MVA base (Anderson & Fouad, Power System Control and Stability,
# Table 2.1): X_d, X′_d, X_q, X′_q, X_l, T′_d0, T′_q0 and H = stored energy / 100 MVA. No subtransient data: one field
# winding, one q winding where T′_q0 > 0 (generator 1 is a hydro unit without). Names as in ieee9().
IEEE9_MACHINES = {
    'G1': {'Sn': 100e6, 'data': 'std', 'Xd': 0.1460, 'Xdp': 0.0608, 'Xdpp': 0.0608, 'Xq': 0.0969, 'Xqp': 0.0969, 'Xqpp': 0.0969, 'Xl': 0.0336,
           'X0': 0.0336, 'Td0p': 8.96, 'Td0pp': 0, 'Tq0p': 0, 'Tq0pp': 0, 'Ra': 0, 'shaft': 'one', 'H': 23.64, 'D': 0},
    'G2': {'Sn': 100e6, 'data': 'std', 'Xd': 0.8958, 'Xdp': 0.1198, 'Xdpp': 0.1198, 'Xq': 0.8645, 'Xqp': 0.1969, 'Xqpp': 0.1969, 'Xl': 0.0521,
           'X0': 0.0521, 'Td0p': 6.00, 'Td0pp': 0, 'Tq0p': 0.535, 'Tq0pp': 0, 'Ra': 0, 'shaft': 'one', 'H': 6.40, 'D': 0},
    'G3': {'Sn': 100e6, 'data': 'std', 'Xd': 1.3125, 'Xdp': 0.1813, 'Xdpp': 0.1813, 'Xq': 1.2578, 'Xqp': 0.25, 'Xqpp': 0.25, 'Xl': 0.0742,
           'X0': 0.0742, 'Td0p': 5.89, 'Td0pp': 0, 'Tq0p': 0.600, 'Tq0pp': 0, 'Ra': 0, 'shaft': 'one', 'H': 3.01, 'D': 0},
}


# 4.9 (decision 35): nominal voltages of the IEEE 14-bus case, whose data are per unit only (MATPOWER base kV 0).
# 'pf': 132 kV for buses 1–5, 33 kV for 6 and 9–14, 11 kV for 8, 1 kV for 7 (the levels of a published PowerFactory
# model of the case); '138': every bus at 138 kV (a published PSCAD model, terminal voltages 1,06·138 = 146,28 kV …).
# The branches stay per unit, so the load flow in per unit is the same; only the physical values (A, Ω, kV) change.
IEEE14_LEVELS = {
    'pf': {**{str(b): 132e3 for b in (1, 2, 3, 4, 5)}, **{str(b): 33e3 for b in (6, 9, 10, 11, 12, 13, 14)}, '7': 1e3, '8': 11e3},
    '138': {str(b): 138e3 for b in range(1, 15)},
}


def ieee14(levels=None):
    """The IEEE 14-bus case. levels: None (U_n = 1 kV on every bus, the per-unit data as published), 'pf' (132/33/11/1 kV)
    or '138' (138 kV everywhere): see IEEE14_LEVELS."""
    net = ieee(14)
    if levels is not None:
        if levels not in IEEE14_LEVELS:
            raise NetworkError(f'ieee14: levels one of {sorted(IEEE14_LEVELS)} or None')
        for b, U in IEEE14_LEVELS[levels].items():
            net.buses[b]['Un'] = U
    return net


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
    out = {'format': 'pcl-network', 'version': 1, 'f': net.f, 'S_base': net.S_base, 'name': net.name,
           'buses': {b: d for b, d in net.buses.items() if d['type'] != 'internal'}, 'elements': els}
    if net.__dict__.get('dc_buses'):                   # 4.20: only a network with a DC grid writes them
        out['dc_buses'] = dict(net.dc_buses)
    g = net.__dict__.get('geo')
    if g and (g.get('buses') or g.get('routes')):      # 4.22 (pcl.geo): only a network with places writes them
        out['geo'] = {'buses': {b: list(p) for b, p in (g.get('buses') or {}).items()},
                      'routes': {n: [list(p) for p in r] for n, r in (g.get('routes') or {}).items()}}
    return out


def from_dict(d):
    net = Network(d.get('f', 50.0), d.get('S_base', 100e6), d.get('name', ''))
    for b, v in d['buses'].items():
        net.bus(b, v['Un'], v.get('type', 'PQ'), v.get('V', 1.0), v.get('angle', 0.0), v.get('Vmin'), v.get('Vmax'), v.get('label'))
    for b, v in (d.get('dc_buses') or {}).items():
        net.dc_bus(b, v['Un'], v.get('V', 1.0), v.get('R'))
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
            net.branch_pu(e['a'], e['b'], e['r'], e['x'], e.get('bc', 0), e.get('ratio', 0), e.get('angle', 0), name=name, rating=e.get('rating'))
            continue
        getattr(net, kind)(name=name, **e)
    if isinstance(d.get('geo'), dict):                 # 4.22: the places of the buses and the routes (checked by pcl.geo)
        from . import geo
        try:
            geo.attach(net, d['geo'].get('buses'), d['geo'].get('routes'))
        except geo.GeoError as e:
            raise NetworkError(str(e)) from e
    return net


def save(net, path):
    Path(path).write_text(json.dumps(to_dict(net), indent=1, ensure_ascii=False), encoding='utf-8')


def load(path):
    return from_dict(json.loads(Path(path).read_text(encoding='utf-8')))
