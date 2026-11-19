"""The numerical core of RMS dynamics and of small-signal stability (4.23, ROADMAP §71, THEORY §8ΩΔ). Experimental.

The network is algebraic, in phasors (Y·V = I); the machines and their controls are differential: a semi-explicit DAE
    x' = f(x, y, t),   0 = g(x, y, t),   y = (V_r, V_i) of every bus.
g is the balance of currents at each bus: the currents the devices inject, less Y_aug·V, with the loads of constant
impedance in Y_aug. The step is milliseconds, not microseconds: large networks and tens of seconds.

What is here (the core, in a separate step from the models and the tutorials):
* the start from a load flow (pcl.powerflow): every device begins with all its derivatives zero, and a run without a
  disturbance does not move (System.init, System.simulate without events);
* the integration of the DAE: the trapezoidal rule with the network and the dynamics solved together (Newton on the whole
  system, the reference), and the alternating solution (the network for given states, the states for given voltages,
  repeated to convergence); a fixed step or a variable one with an estimate of the local error; events (fault, clearing,
  opening of a branch, change of a load) as discontinuities of the algebraic variables, with a consistent new start of
  y and a new factorization;
* the Jacobian with a fixed pattern (that of the network with every branch, the devices on their buses), its values by
  differentiation with a complex step on the variables of each device (exact to rounding), and the sparse LU kept while
  Newton converges (refactorized when it slows, after an event or a new step);
* many disturbances as a batch (System.batch) and the critical clearing time by bisection (System.cct);
* the eigenvalues: the state matrix A = f_x − f_y·g_y⁻¹·g_x, the whole spectrum with QR for small systems, and a few
  eigenvalues near a frequency with the Arnoldi method with shift and invert on the augmented pencil (J − σE)⁻¹E, without
  forming A, for large ones; frequency, damping ratio, participation factors, mode shape.

The devices (enough for the core and its checks; the full library is the next step): the classical machine (E′ behind
X′_d), the two-axis machine (E′_q, E′_d, constant E_fd and P_m), a source behind an impedance (an infinite bus), loads of
constant impedance, current or power (ZIP). Our own formulation from the standard equations (THEORY §8ΩΔ for the
references). An element of the network without an RMS model is refused by name, never left out silently.
"""
import math
import time

import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla

CS = 1e-30                     # the complex step


class RMSError(ValueError):
    pass


# ---------------------------------------------------------------- devices (vectorized over the members of a kind)
class Kind:
    """Devices of one kind. Each member has nx states on one bus. eval(X, Vr, Vi, t) → (F, Ir, Ii): the derivatives of
    the states and the current injected into the bus, for all members at once, in arithmetic that a complex step goes
    through (so the local Jacobian is exact to rounding)."""
    nx = 0
    states = ()

    def __init__(self, names, bus, p):
        self.names, self.bus, self.p = list(names), np.asarray(bus, int), p
        self.m = len(self.names)
        self.x0 = 0                                   # offset in the global state vector

    def eval(self, X, Vr, Vi, t):
        raise NotImplementedError


class Classical(Kind):
    """The classical machine: a constant E′ behind X′_d (and R_a), the swing equation. States δ (rad), ω (pu)."""
    nx, states = 2, ('delta', 'omega')

    def init(self, V, S, wb):
        p = self.p
        I = np.conj(S / V)
        E = V + (p['Ra'] + 1j * p['Xdp']) * I
        p['E'], p['Pm'], p['wb'] = np.abs(E), (E * np.conj(I)).real, wb
        return np.c_[np.angle(E), np.ones(self.m)]

    def eval(self, X, Vr, Vi, t):
        p = self.p
        d, w = X[:, 0], X[:, 1]
        Er, Ei = p['E'] * np.cos(d), p['E'] * np.sin(d)
        z = p['Ra'] ** 2 + p['Xdp'] ** 2
        ar, ai = Er - Vr, Ei - Vi                     # I = (E − V)/(R + jX′)
        Ir = (ar * p['Ra'] + ai * p['Xdp']) / z
        Ii = (ai * p['Ra'] - ar * p['Xdp']) / z
        Pe = Er * Ir + Ei * Ii
        F = np.empty_like(X)
        F[:, 0] = p['wb'] * (w - 1.0)
        F[:, 1] = (p['Pm'] - Pe - p['D'] * (w - 1.0)) / (2.0 * p['H'])
        return F, Ir, Ii

    def power(self, X, Vr, Vi):
        _, Ir, Ii = self.eval(X, Vr, Vi, 0.0)
        return Vr * Ir + Vi * Ii


class TwoAxis(Kind):
    """The two-axis machine: E′_q and E′_d behind X′_d, X′_q (and R_a), constant E_fd and P_m. States δ, ω, E′_q, E′_d.
    The q axis at δ; V_d + jV_q = V·e^(−j(δ − π/2)). Where T′_q0 = 0 there is no q winding: X′_q = X_q and E′_d = 0."""
    nx, states = 4, ('delta', 'omega', 'eq', 'ed')

    def init(self, V, S, wb):
        p = self.p
        noq = p['Tq0p'] <= 0
        p['Xqp'] = np.where(noq, p['Xq'], p['Xqp'])
        I = np.conj(S / V)
        d = np.angle(V + (p['Ra'] + 1j * p['Xq']) * I)
        rot = np.exp(-1j * (d - np.pi / 2))
        v, i = V * rot, I * rot
        Vd, Vq, Id, Iq = v.real, v.imag, i.real, i.imag
        ed = (p['Xq'] - p['Xqp']) * Iq
        eq = Vq + p['Ra'] * Iq + p['Xdp'] * Id
        p['Efd'] = eq + (p['Xd'] - p['Xdp']) * Id
        p['Pm'] = ed * Id + eq * Iq + (p['Xqp'] - p['Xdp']) * Id * Iq   # the air-gap torque at ω = 1
        p['wb'], p['noq'] = wb, noq
        return np.c_[d, np.ones(self.m), eq, ed]

    def currents(self, X, Vr, Vi):
        p = self.p
        d, eq, ed = X[:, 0], X[:, 2], X[:, 3]
        c, s = np.cos(d - np.pi / 2), np.sin(d - np.pi / 2)
        Vd, Vq = Vr * c + Vi * s, -Vr * s + Vi * c
        # E′_d − V_d − R I_d + X′_q I_q = 0,  E′_q − V_q − R I_q − X′_d I_d = 0
        R, xd, xq = p['Ra'], p['Xdp'], p['Xqp']
        a, b = ed - Vd, eq - Vq
        det = R * R + xd * xq                         # [[R, −X′_q], [X′_d, R]]·[I_d, I_q] = [a, b]
        Id = (R * a + xq * b) / det
        Iq = (R * b - xd * a) / det
        return c, s, Vd, Vq, Id, Iq

    def eval(self, X, Vr, Vi, t):
        p = self.p
        w, eq, ed = X[:, 1], X[:, 2], X[:, 3]
        c, s, Vd, Vq, Id, Iq = self.currents(X, Vr, Vi)
        Ir, Ii = Id * c - Iq * s, Id * s + Iq * c
        Te = ed * Id + eq * Iq + (p['Xqp'] - p['Xdp']) * Id * Iq
        F = np.empty_like(X)
        F[:, 0] = p['wb'] * (w - 1.0)
        F[:, 1] = (p['Pm'] - Te - p['D'] * (w - 1.0)) / (2.0 * p['H'])
        F[:, 2] = (p['Efd'] - eq - (p['Xd'] - p['Xdp']) * Id) / p['Td0p']
        Tq = np.where(p['noq'], 1.0, p['Tq0p'])
        F[:, 3] = np.where(p['noq'], 0.0 * ed, (-ed + (p['Xq'] - p['Xqp']) * Iq) / Tq)
        return F, Ir, Ii

    def power(self, X, Vr, Vi):
        _, Ir, Ii = self.eval(X, Vr, Vi, 0.0)
        return Vr * Ir + Vi * Ii


class Source(Kind):
    """A constant voltage behind an impedance (an infinite bus with its Thévenin impedance). No states."""
    nx, states = 0, ()

    def init(self, V, S, wb):
        p = self.p
        I = np.conj(S / V)
        p['E'] = V + (p['R'] + 1j * p['X']) * I
        return np.zeros((self.m, 0))

    def eval(self, X, Vr, Vi, t):
        p = self.p
        z = p['R'] ** 2 + p['X'] ** 2
        ar, ai = p['E'].real - Vr, p['E'].imag - Vi
        return np.zeros((len(Vr), 0), dtype=np.result_type(Vr, float)), (ar * p['R'] + ai * p['X']) / z, (ai * p['R'] - ar * p['X']) / z


class ZIPLoad(Kind):
    """A load of constant current and constant power (the constant impedance part goes into Y_aug), from the voltage of
    the start: S(V) = S_i·|V|/|V_0| + S_p, as an injection −conj(S/V). Below V_min the constant power part is taken as
    an impedance (so that a fault does not ask for infinite currents)."""
    nx, states = 0, ()

    def init(self, V, S, wb):
        self.p['V0'] = np.abs(V)
        return np.zeros((self.m, 0))

    def eval(self, X, Vr, Vi, t):
        p = self.p
        v2 = Vr * Vr + Vi * Vi
        v = np.sqrt(v2)
        vmin = p['Vmin']
        Sp = p['Sp'] * np.where(v.real < vmin, v2 / vmin ** 2, 1.0)
        S = p['Si'] * v / p['V0'] + Sp
        # I = conj(S / V) injected with a minus: −(P − jQ)(Vr + jVi)/|V|²
        Ir = -(S.real * Vr + S.imag * Vi) / v2
        Ii = -(S.real * Vi - S.imag * Vr) / v2
        return np.zeros((len(Vr), 0), dtype=Ir.dtype), Ir, Ii


KINDS = {'classical': Classical, 'two_axis': TwoAxis}
MACHINE_KEYS = ('Xd', 'Xdp', 'Xq', 'Xqp', 'Td0p', 'Tq0p', 'Ra', 'H', 'D')
TYPICAL = {'Xd': 1.8, 'Xdp': 0.3, 'Xq': 1.7, 'Xqp': 0.55, 'Td0p': 8.0, 'Tq0p': 0.4, 'Ra': 0.0, 'H': 4.0, 'D': 0.0}
KNOWN_ELEMENTS = {'generator', 'load', 'branch', 'feeder', 'shunt'}


# ---------------------------------------------------------------- the system
class System:
    """The DAE of a network of pcl.network with machines, from a load flow.

    machines: {name of a generator: {'model': 'classical' | 'two_axis', 'Xd', 'Xdp', 'Xq', 'Xqp', 'Td0p', 'Tq0p', 'Ra',
    'H', 'D', 'Sn'}} in pu on the rating Sn (VA; default the base of the network); a generator not listed gets the model
    `default` with the typical values TYPICAL on its rating Sr (the next step brings the library of models). A feeder
    (an external grid) is a Source behind its short-circuit impedance, or a stiff one (X 10⁻⁴ pu).
    loads: 'Z' (constant impedance, as in a classical study), 'I', 'P', or {'z': a, 'i': b, 'p': c} the shares of P and Q.
    f: the frequency of the network (Hz; default net.f). pf: the result of net.power_flow() (computed if not given)."""

    def __init__(self, net, machines=None, default='two_axis', loads='Z', f=None, pf=None, vmin=0.7):
        bad = sorted({e['kind'] for e in net.elements} - KNOWN_ELEMENTS)
        if bad:
            raise RMSError('δεν ταιριάζουν στον πυρήνα RMS ακόμη, γιατί δεν έχουν μοντέλο RMS: ' + ', '.join(bad))
        self.net, self.f = net, float(f or getattr(net, 'f', 50.0) or 50.0)
        self.wb = 2 * math.pi * self.f
        self.case = c = net.case()
        self.n, self.names, self.idx = c.n, c.names, c.idx
        self.pf = pf or net.power_flow()
        V0 = np.asarray(self.pf['_V'], complex)
        self.V0 = V0
        Sb = c.S_base
        buses = dict(self.pf['buses'])
        # loads: constant impedance into Y_aug, the rest as a ZIP device
        Sl = np.asarray(c.load, complex)
        Sl = Sl[:, 0] * np.abs(V0) ** 2 + Sl[:, 1] * np.abs(V0) + Sl[:, 2] if Sl.ndim == 2 else Sl
        share = {'Z': (1, 0, 0), 'I': (0, 1, 0), 'P': (0, 0, 1)}.get(loads) if isinstance(loads, str) else \
            (loads.get('z', 0), loads.get('i', 0), loads.get('p', 0))
        if share is None or abs(sum(share) - 1) > 1e-9:
            raise RMSError("loads: 'Z', 'I', 'P' or the shares {'z', 'i', 'p'} with sum 1")
        self.yload = share[0] * np.conj(Sl) / np.abs(V0) ** 2
        self.kinds = []
        li = [k for k in range(self.n) if abs(Sl[k]) > 0 and (share[1] or share[2])]
        if li:
            L = ZIPLoad(['load@' + self.names[k] for k in li], li,
                        {'Si': share[1] * Sl[li], 'Sp': share[2] * Sl[li], 'Vmin': vmin})
            self.kinds.append(L)
        # machines and sources
        gens = [e for e in net.elements if e['kind'] == 'generator']
        feeders = [e for e in net.elements if e['kind'] == 'feeder']
        per_bus = {}
        for e in gens + feeders:
            per_bus.setdefault(e['bus'], []).append(e)
        if any(len(v) > 1 for v in per_bus.values()):
            raise RMSError('δύο πηγές στον ίδιο ζυγό: δεν μοιράζεται ακόμη η ισχύς της ροής φορτίου ανάμεσά τους')
        machines = machines or {}
        groups = {}
        for e in gens:
            md = dict(machines.get(e['name'], {}))
            model = md.pop('model', default)
            if model not in KINDS:
                raise RMSError('άγνωστο μοντέλο μηχανής %r (%s)' % (model, ', '.join(KINDS)))
            Sn = float(md.pop('Sn', e.get('Sr') or Sb))
            vals = {k: float(md.get(k, TYPICAL[k])) for k in MACHINE_KEYS}
            k = Sb / Sn                                     # to the system base: impedances ×k, H and D ÷k
            for q in ('Xd', 'Xdp', 'Xq', 'Xqp', 'Ra'):
                vals[q] *= k
            vals['H'] /= k
            vals['D'] /= k
            groups.setdefault(model, []).append((e['name'], self.idx[e['bus']], vals))
        for model, L in groups.items():
            p = {q: np.array([v[q] for _, _, v in L]) for q in MACHINE_KEYS}
            self.kinds.append(KINDS[model]([a for a, _, _ in L], [b for _, b, _ in L], p))
        if feeders:
            X = []
            for e in feeders:
                Sk = e.get('Sk') or e.get('Ssc')
                X.append(Sb / Sk if Sk else 1e-4)
            self.kinds.append(Source([e['name'] for e in feeders], [self.idx[e['bus']] for e in feeders],
                                     {'R': 0.1 * np.array(X), 'X': np.array(X)}))
        # the injections of the sources from the load flow
        Sg = np.zeros(self.n, complex)
        for b, d in buses.items():
            Sg[self.idx[b]] = (d['P'] + 1j * d['Q']) / Sb
        self.Sg = Sg
        # the states
        off = 0
        for K in self.kinds:
            K.x0 = off
            off += K.nx * K.m
        self.nx = off
        self.ny = 2 * self.n
        self.state_names = [(K.names[i], s) for K in self.kinds for i in range(K.m) for s in K.states]
        self._y_build()
        self.events_done = []
        self.x = None

    # ------------------------------------------------------------ network
    def _y_build(self):
        c = self.case
        Y = sp.csr_matrix(c.Y) + sp.diags(self.yload)
        self.Ybase = Y.tocsr()
        self.yshunt = np.zeros(self.n, complex)              # the shunts of events (faults)
        self.dY = sp.csr_matrix((self.n, self.n), dtype=complex)   # the branches opened by events
        self.br_open = set()
        self._ypat()

    def _ypat(self):
        Y = (self.Ybase + self.dY + sp.diags(self.yshunt)).tocsr()
        Y.eliminate_zeros()
        self.Y = Y

    def _yreal(self):
        """−[[G, −B], [B, G]] as the network part of g_y, with the full pattern of the network (every branch)."""
        Y = (self.Ybase + sp.diags(self.yshunt + 1e-300) + self.dY).tocoo()
        n = self.n
        G, B = Y.data.real, Y.data.imag
        r, c = Y.row, Y.col
        rows = np.r_[r, r, r + n, r + n]
        cols = np.r_[c, c + n, c, c + n]
        vals = -np.r_[G, -B, B, G]
        return rows, cols, vals

    # ------------------------------------------------------------ evaluation
    def _split(self, z):
        return z[:self.nx], z[self.nx:self.nx + self.n], z[self.nx + self.n:]

    def fg(self, x, y, t=0.0):
        """f (states) and g (the current balance at every bus) at (x, y)."""
        n = self.n
        Vr, Vi = y[:n], y[n:]
        dt = np.result_type(x, y, float)
        f = np.zeros(self.nx, dt)
        Ir = np.zeros(n, dt)
        Ii = np.zeros(n, dt)
        for K in self.kinds:
            X = x[K.x0:K.x0 + K.nx * K.m].reshape(K.m, K.nx)
            F, ir, ii = K.eval(X, Vr[K.bus], Vi[K.bus], t)
            f[K.x0:K.x0 + K.nx * K.m] = F.reshape(-1)
            np.add.at(Ir, K.bus, ir)
            np.add.at(Ii, K.bus, ii)
        V = Vr + 1j * Vi if dt != complex else None
        if V is not None:
            YV = self.Y @ V
            g = np.r_[Ir - YV.real, Ii - YV.imag]
        else:                                               # (complex step: the network part is linear and real-valued)
            Y = self.Y
            G, B = Y.real, Y.imag
            g = np.r_[Ir - (G @ Vr - B @ Vi), Ii - (B @ Vr + G @ Vi)]
        return f, g

    def jac(self, x, y, t=0.0):
        """The Jacobian [[f_x, f_y], [g_x, g_y]] (sparse, CSC): the network exactly, each device by a complex step on its
        own variables (all members of a kind at once)."""
        n, nx = self.n, self.nx
        rows, cols, vals = self._yreal()
        R, C, Vv = [rows + nx], [cols + nx], [vals]
        Vr, Vi = y[:n], y[n:]
        for K in self.kinds:
            m, k = K.m, K.nx
            X = x[K.x0:K.x0 + k * m].reshape(m, k)
            gi = K.x0 + np.arange(m)[:, None] * k + np.arange(k)[None, :]         # global index of each state
            br, bi = nx + K.bus, nx + n + K.bus
            outs_r = np.c_[gi, br, bi]                                          # rows: f of each state, g_r, g_i of the bus
            for j in range(k + 2):
                Xc = X.astype(complex)
                vr, vi = Vr[K.bus].astype(complex), Vi[K.bus].astype(complex)
                if j < k:
                    Xc[:, j] += 1j * CS
                    col = gi[:, j]
                elif j == k:
                    vr = vr + 1j * CS
                    col = br
                else:
                    vi = vi + 1j * CS
                    col = bi
                F, ir, ii = K.eval(Xc, vr, vi, t)
                D = np.c_[F.imag, ir.imag, ii.imag] / CS                        # (m, k + 2)
                R.append(outs_r.reshape(-1))
                C.append(np.repeat(col, k + 2))
                Vv.append(D.reshape(-1))
        J = sp.coo_matrix((np.concatenate(Vv), (np.concatenate(R), np.concatenate(C))), shape=(nx + 2 * n, nx + 2 * n))
        return J.tocsc()

    # ------------------------------------------------------------ start
    def init(self):
        """Every device from the load flow, with all its derivatives zero. Returns the norms of f and g at the start."""
        V = self.V0
        x = np.zeros(self.nx)
        for K in self.kinds:
            S = self.Sg[K.bus] if not isinstance(K, ZIPLoad) else np.zeros(K.m)
            X0 = K.init(V[K.bus], S, self.wb)
            x[K.x0:K.x0 + K.nx * K.m] = X0.reshape(-1)
        y = np.r_[V.real, V.imag]
        self.x, self.y, self.t = x, y, 0.0
        f, g = self.fg(x, y)
        self.x0, self.y0 = x.copy(), y.copy()
        return {'f': float(np.max(np.abs(f))) if len(f) else 0.0, 'g': float(np.max(np.abs(g)))}

    def state(self, name, which):
        for K in self.kinds:
            if name in K.names and which in K.states:
                return K.x0 + K.names.index(name) * K.nx + K.states.index(which)
        raise KeyError((name, which))

    def internal_emf(self):
        """E′ of every classical machine (complex, rad) at the start: for the check against a published example."""
        out = {}
        for K in self.kinds:
            if isinstance(K, Classical):
                X = self.x0[K.x0:K.x0 + 2 * K.m].reshape(K.m, 2)
                for i, nm in enumerate(K.names):
                    out[nm] = K.p['E'][i] * np.exp(1j * X[i, 0])
        return out

    # ------------------------------------------------------------ events
    def _apply(self, ev):
        k = ev['kind']
        if k == 'fault':
            b = self.idx[str(ev['bus'])]
            z = complex(ev.get('z', 0) or 0)
            self.yshunt[b] += 1e6 if z == 0 else 1 / z
            ev['_y'] = 1e6 if z == 0 else 1 / z
        elif k == 'clear':
            b = self.idx[str(ev['bus'])]
            self.yshunt[b] = 0
        elif k == 'trip':
            c = self.case
            name = ev['branch']
            i = c.br_name.index(name) if isinstance(name, str) else int(name)
            if i in self.br_open:
                return
            f, t = c.f[i], c.t[i]
            Yff, Ytt = c.Yff[i], c.Ytt[i]
            if ev.get('shunts') == 'keep':                  # only the series part (the line charging stays, as some textbooks do)
                Yff, Ytt = c.y[i] / np.abs(c.tap[i]) ** 2, c.y[i]
            d = sp.coo_matrix(([-Yff, -c.Yft[i], -c.Ytf[i], -Ytt], ([f, f, t, t], [f, t, f, t])), shape=(self.n, self.n))
            self.dY = (self.dY + d).tocsr()
            self.br_open.add(i)
        elif k == 'shunt':                                  # a change of a constant-impedance load or shunt (pu)
            b = self.idx[str(ev['bus'])]
            self.Ybase = (self.Ybase + sp.coo_matrix(([complex(ev['y'])], ([b], [b])), shape=(self.n, self.n))).tocsr()
        else:
            raise RMSError('άγνωστο συμβάν %r' % k)
        self._ypat()

    def _consistent(self, x, y, t, tol=1e-10):
        """y with x fixed after a discontinuity: Newton on g(x, y) = 0."""
        nx = self.nx
        for _ in range(30):
            _, g = self.fg(x, y, t)
            if np.max(np.abs(g)) < tol:
                return y, True
            J = self.jac(x, y, t)[nx:, nx:]
            y = y - spla.splu(J.tocsc()).solve(g)
        return y, False

    # ------------------------------------------------------------ integration
    def simulate(self, t_end, events=(), h=0.005, method='simultaneous', step='fixed', rtol=1e-4, atol=1e-6,
                 hmin=1e-5, hmax=0.05, tol=1e-9, record_every=1):
        """From the start (System.init) to t_end (s). events: [{'t', 'kind': 'fault' (bus, z pu), 'clear' (bus),
        'trip' (branch: name or index; shunts: 'keep' removes only the series part), 'shunt' (bus, y pu)}]. method: 'simultaneous' (Newton on the whole system, the
        reference) or 'alternating'. step: 'fixed' (h) or 'var' (from h, with the local error of the states below
        rtol·|x| + atol). Returns {'t', 'x', 'V' (complex bus voltages), 'stats'}."""
        if self.x is None:
            self.init()
        self._y_build()
        x, y, t = self.x0.copy(), self.y0.copy(), 0.0
        evs = sorted([dict(e) for e in events], key=lambda e: e['t'])
        nx, n = self.nx, self.n
        T, Xs, Vs = [0.0], [x.copy()], [y[:n] + 1j * y[n:]]
        st = {'steps': 0, 'newton': 0, 'lu': 0, 'rejected': 0, 'events': 0, 'nonconv': 0}
        f_n, _ = self.fg(x, y, t)
        lu, lu_h, slow = None, None, False
        hist = []                                            # (t, x) of the accepted points since the last event
        h0 = min(h, max(hmin, 1e-3))                         # the first step of the variable step, and after an event
        hc = h0 if step == 'var' else h
        t0 = time.perf_counter()
        ei = 0
        while t < t_end - 1e-12:
            while ei < len(evs) and evs[ei]['t'] <= t + 1e-12:
                self._apply(evs[ei])
                y, ok = self._consistent(x, y, t)
                if not ok:
                    st['nonconv'] += 1
                f_n, _ = self.fg(x, y, t)
                lu, hist, hc = None, [], (min(hc, h, h0) if step == 'var' else hc)
                st['events'] += 1
                ei += 1
                T.append(t); Xs.append(x.copy()); Vs.append(y[:n] + 1j * y[n:])
            tn = evs[ei]['t'] if ei < len(evs) else t_end
            hh = min(hc, tn - t, t_end - t)
            if method == 'alternating':
                xn, yn, it, ok = self._step_alt(x, y, f_n, t, hh, tol)
            else:
                if lu is None or lu_h != hh or slow:
                    M = self._iter_matrix(x, y, t + hh, hh)
                    lu, lu_h = spla.splu(M), hh
                    st['lu'] += 1
                xn, yn, it, ok = self._step_tr(x, y, f_n, t, hh, tol, lu)
                if not ok:                                    # refactorize at the new point and try once more
                    M = self._iter_matrix(x, y, t + hh, hh)
                    lu, lu_h = spla.splu(M), hh
                    st['lu'] += 1
                    xn, yn, it2, ok = self._step_tr(x, y, f_n, t, hh, tol, lu)
                    it += it2
                slow = it > 4
            st['newton'] += it
            if not ok:
                st['nonconv'] += 1
            if step == 'var' and len(hist) >= 2:
                err = self._lte(hist, t, x, t + hh, xn, rtol, atol)
                if err > 1.0 and hh > hmin * 1.0001:
                    hc = max(hmin, hh * max(0.2, 0.9 * err ** (-1 / 3)))
                    st['rejected'] += 1
                    continue
                hc = min(hmax, hh * min(2.0, max(0.2, 0.9 * (err + 1e-12) ** (-1 / 3))))
            elif step == 'var':
                hc = min(hmax, hh)
            hist = (hist + [(t, x)])[-2:]
            x, y, t = xn, yn, t + hh
            f_n, _ = self.fg(x, y, t)
            st['steps'] += 1
            if st['steps'] % record_every == 0 or t >= t_end - 1e-12:
                T.append(t); Xs.append(x.copy()); Vs.append(y[:n] + 1j * y[n:])
        st['time'] = time.perf_counter() - t0
        self.x, self.y, self.t = x, y, t
        return {'t': np.array(T), 'x': np.array(Xs), 'V': np.array(Vs), 'stats': st}

    def _iter_matrix(self, x, y, t, h):
        J = self.jac(x, y, t).tocsr()
        nx = self.nx
        E = sp.diags(np.r_[np.ones(nx), np.zeros(self.ny)])
        S = sp.diags(np.r_[np.full(nx, -0.5 * h), np.ones(self.ny)])
        return (E + S @ J).tocsc()

    def _step_tr(self, x, y, f_n, t, h, tol, lu):
        """One trapezoidal step, network and states together; the iteration matrix lu is kept (Newton with a fixed matrix)."""
        nx = self.nx
        z = np.r_[x + h * f_n, y]                            # Euler predictor
        for it in range(1, 16):
            f, g = self.fg(z[:nx], z[nx:], t + h)
            R = np.r_[z[:nx] - x - 0.5 * h * (f + f_n), g]
            dz = lu.solve(R)
            z -= dz
            if np.max(np.abs(dz)) < tol * (1 + np.max(np.abs(z))):
                return z[:nx], z[nx:], it, True
        return z[:nx], z[nx:], it, False

    def _step_alt(self, x, y, f_n, t, h, tol):
        """One trapezoidal step with the alternating solution: the network for the states (Newton on g with g_y), then the
        states for the voltages (a fixed-point iteration of the trapezoidal rule), repeated to convergence."""
        nx = self.nx
        xk = x + h * f_n
        yk = y
        gy = None
        for it in range(1, 60):
            for _ in range(8):
                _, g = self.fg(xk, yk, t + h)
                if np.max(np.abs(g)) < tol:
                    break
                if gy is None:
                    gy = spla.splu(self.jac(xk, yk, t + h)[nx:, nx:].tocsc())
                yk = yk - gy.solve(g)
            f, _ = self.fg(xk, yk, t + h)
            x1 = x + 0.5 * h * (f + f_n)
            d = np.max(np.abs(x1 - xk)) if nx else 0.0
            xk = x1
            if d < tol * (1 + np.max(np.abs(xk))):
                _, g = self.fg(xk, yk, t + h)
                if np.max(np.abs(g)) < 1e3 * tol:
                    return xk, yk, it, True
        return xk, yk, it, False

    @staticmethod
    def _lte(hist, t, x, t1, x1, rtol, atol):
        """The local error of the trapezoidal step from the quadratic predictor through the last three points
        (Milne): the predictor misses by x‴·(t1−t)(t1−t_a)(t1−t_b)/6, the trapezoid by −x‴·h³/12."""
        (ta, xa), (tb, xb) = hist[-2], hist[-1]
        if not (ta < tb < t < t1):
            return 0.0
        # Newton form through (ta, xa), (tb, xb), (t, x)
        d1 = (xb - xa) / (tb - ta)
        d2 = (x - xb) / (t - tb)
        d12 = (d2 - d1) / (t - ta)
        xp = x + d2 * (t1 - t) + d12 * (t1 - t) * (t1 - tb)
        h = t1 - t
        cp = (t1 - t) * (t1 - tb) * (t1 - ta) / 6.0
        ct = -h ** 3 / 12.0
        lte = (x1 - xp) * ct / (ct - cp)
        sc = rtol * np.maximum(np.abs(x), np.abs(x1)) + atol
        return float(np.max(np.abs(lte) / sc))

    # ------------------------------------------------------------ batch and critical clearing time
    def batch(self, scenarios, t_end, **kw):
        """Many disturbances from the same start: scenarios = [events, …]. Returns the result of each, with 'stable'
        (every rotor angle within 180° of the centre of inertia to the end)."""
        out = []
        for evs in scenarios:
            r = self.simulate(t_end, events=evs, **kw)
            r['stable'] = self.stable(r)
            out.append(r)
        return out

    def stable(self, r, limit=math.pi):
        idx, H = [], []
        for K in self.kinds:
            if 'delta' in K.states:
                for i in range(K.m):
                    idx.append(K.x0 + i * K.nx)
                    H.append(K.p['H'][i])
        if not idx:
            return True
        D = r['x'][:, idx]
        H = np.array(H)
        coi = D @ H / H.sum()
        return bool(np.all(np.isfinite(D)) and np.max(np.abs(D - coi[:, None])) < limit)

    def cct(self, fault, clear, t_fault=0.1, lo=0.0, hi=0.5, t_end=3.0, tol=1e-3, **kw):
        """The critical clearing time by bisection: fault (an event without 't'), clear (the events that clear it, without
        't'), the fault at t_fault. Returns (the longest stable duration, the shortest unstable one, runs)."""
        runs = 0

        def ok(d):
            nonlocal runs
            runs += 1
            evs = [{**fault, 't': t_fault}] + [{**c, 't': t_fault + d} for c in clear]
            return self.stable(self.simulate(t_end, events=evs, **kw))
        if not ok(lo):
            return None, lo, runs
        if ok(hi):
            return hi, None, runs
        while hi - lo > tol:
            mid = 0.5 * (lo + hi)
            if ok(mid):
                lo = mid
            else:
                hi = mid
        return lo, hi, runs

    # ------------------------------------------------------------ small signal
    def linearize(self, x=None, y=None):
        """The blocks of the Jacobian at (x, y) (default the start) and, for a small system, the state matrix
        A = f_x − f_y·g_y⁻¹·g_x."""
        x = self.x0 if x is None else x
        y = self.y0 if y is None else y
        J = self.jac(x, y).tocsc()
        nx = self.nx
        out = {'J': J, 'states': self.state_names}
        if nx <= 2000:
            fx, fy = J[:nx, :nx].toarray(), J[:nx, nx:].toarray()
            gx, gy = J[nx:, :nx].tocsc(), J[nx:, nx:].tocsc()
            out['A'] = fx - fy @ spla.splu(gy).solve(gx.toarray())
        return out

    def eigen(self, method='auto', sigma=None, k=8, x=None, y=None):
        """The eigenvalues of the linearized system with their modes. method: 'qr' (all, from A), 'arnoldi' (k near sigma,
        rad/s complex, by shift and invert on the augmented pencil, without forming A), 'auto' (QR up to 400 states).
        Each mode: lambda, f (Hz), zeta, the states that participate most (participation factors) and the shape on the
        rotor speeds."""
        if method == 'auto':
            method = 'qr' if self.nx <= 400 else 'arnoldi'
        nx = self.nx
        if method == 'qr':
            lam, Vr = np.linalg.eig(self.linearize(x, y)['A'])
            Wl = np.linalg.inv(Vr)                         # rows: the left eigenvectors, W·V = I
        else:
            # J·v = λ·E·v (E = I on the states, 0 on the network): (J − σE)⁻¹·E·v = v/(λ − σ). The left vectors from the
            # adjoint: E·(J − σE)⁻ᴴ·u = u/conj(λ − σ), w = (J − σE)⁻ᴴ·u, ψ = conj(w) on the states.
            J = self.jac(self.x0 if x is None else x, self.y0 if y is None else y).tocsc()
            if sigma is None:
                sigma = 2j * math.pi * 1.0
            E = sp.diags(np.r_[np.ones(nx), np.zeros(self.ny)]).tocsc()
            Ms = (J - sigma * E).astype(complex).tocsc()
            lu, luH = spla.splu(Ms), spla.splu(Ms.conj().T.tocsc())
            N = J.shape[0]
            kk = min(k, nx - 2)
            nu, Vv = spla.eigs(spla.LinearOperator((N, N), matvec=lambda v: lu.solve(E @ v), dtype=complex), k=kk, which='LM', tol=1e-13)
            mu, Uu = spla.eigs(spla.LinearOperator((N, N), matvec=lambda v: E @ luH.solve(v), dtype=complex), k=kk, which='LM', tol=1e-13)
            lam = sigma + 1.0 / nu
            lamL = sigma + 1.0 / np.conj(mu)
            Vr = Vv[:nx, :]
            Wl = np.empty((len(lam), nx), complex)
            for i, l in enumerate(lam):
                j = int(np.argmin(np.abs(lamL - l)))
                w = np.conj(luH.solve(Uu[:, j]))[:nx]
                s = w @ Vr[:, i]
                Wl[i] = w / s if abs(s) > 0 else w
        modes = []
        wi = [i for i, (_, s) in enumerate(self.state_names) if s == 'omega']
        for i in np.argsort(-np.real(lam)):
            l = lam[i]
            p = np.abs(Wl[i] * Vr[:, i])
            p = p / p.sum() if p.sum() > 0 else p
            top = [(self.state_names[j][0], self.state_names[j][1], float(p[j])) for j in np.argsort(-p)[:4]]
            shape = Vr[wi, i]
            if len(shape) and np.max(np.abs(shape)) > 0:
                shape = shape / shape[np.argmax(np.abs(shape))]
            modes.append({'lambda': complex(l), 'f': abs(l.imag) / (2 * math.pi), 'zeta': float(-l.real / abs(l)) if abs(l) > 0 else 1.0,
                          'part': top, 'shape': {self.state_names[j][0]: complex(s) for j, s in zip(wi, shape)}})
        return {'method': method, 'n': nx, 'modes': modes, 'lambda': np.array([m['lambda'] for m in modes])}

    # ------------------------------------------------------------ the classical network reduced to the internal nodes
    def reduced_y(self, which='pre', events=()):
        """The admittance matrix of the network with the loads as impedances and X′_d of the classical machines, reduced
        to their internal nodes (Kron): the classical formulation of a stability study, for its checks."""
        self._y_build()
        for e in events:
            self._apply(dict(e))
        K = next(k for k in self.kinds if isinstance(k, Classical))
        n, m = self.n, K.m
        Y = sp.lil_matrix((n + m, n + m), dtype=complex)
        Y[:n, :n] = self.Y
        for i in range(m):
            y = 1 / (K.p['Ra'][i] + 1j * K.p['Xdp'][i])
            b = K.bus[i]
            Y[n + i, n + i] += y
            Y[b, b] += y
            Y[n + i, b] -= y
            Y[b, n + i] -= y
        Y = Y.toarray()
        Ynn, Ynr, Yrn, Yrr = Y[n:, n:], Y[n:, :n], Y[:n, n:], Y[:n, :n]
        out = Ynn - Ynr @ np.linalg.solve(Yrr, Yrn)
        self._y_build()
        return out
