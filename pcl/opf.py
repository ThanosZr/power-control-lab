"""Optimal power flow on pcl.network (4.19.1, ROADMAP §68 point 4): the cheapest dispatch of the generators that the
network can carry.

* AC: the full equations in polar coordinates. Unknowns θ, |V| of every bus and P, Q of every source; equalities the
  balance of P and Q at every bus (with the ZIP loads); inequalities the apparent power at both ends of every branch
  with a rating, and the limits of |V|, P, Q. Exact first and second derivatives in complex matrix notation.
* DC: the linear network (θ and P only): a quadratic programme with the same costs, the limits of P and the ratings.

Both are solved by the interior-point kernel of pcl.ipm, on sparse matrices. The result has the dispatch, the cost,
the marginal price of active and reactive power at every bus, and the constraints that bind with their multipliers.

Sources (THEORY §8Η): R. D. Zimmerman, «AC power flows, generalized OPF costs and their derivatives using complex matrix
notation», MATPOWER Technical Note 2 (§4.2 power injections, §5.2 power flows, §5.4 squared apparent power, §6.1
polynomial costs, §7.2 nodal balance); Wang, Murillo-Sánchez, Zimmerman & Thomas, IEEE Trans. Power Systems 22(3), 2007
(the formulation and the interior-point method). Costs: polynomial up to the second order (the cost of the test cases);
piecewise linear costs are not in this version.
"""
import copy
import time

import numpy as np
from scipy import sparse as sp

from . import powerflow as PF
from .ipm import ipm


class OpfError(ValueError):
    pass


GAMMA0 = 1e-5            # barrier parameter of a warm start (measured: THEORY §8Θ)


def _diag(v):
    return sp.diags(v, format='csr')


# -------------------------------------------------------------------- derivatives (MATPOWER TN2)
def dSbus_dV(Y, V):
    """dS/dθ and dS/d|V| of the bus injections S = V∘conj(Y·V) (TN2 §4.2.1), sparse."""
    I = Y @ V
    Vn = V / np.abs(V)
    dVm = _diag(V) @ np.conj(Y @ _diag(Vn)) + _diag(np.conj(I)) @ _diag(Vn)
    dVa = 1j * _diag(V) @ np.conj(_diag(I) - Y @ _diag(V))
    return dVa.tocsr(), dVm.tocsr()


def d2Sbus_dV2(Y, V, lam):
    """The second derivatives of lamᵀ·S(V) with respect to (θ, |V|): G_θθ, G_θV, G_Vθ, G_VV (TN2 §4.2.2)."""
    I = Y @ V
    A = _diag(lam * V)
    B = Y @ _diag(V)
    C = A @ np.conj(B)
    D = Y.conj().T @ _diag(V)
    E = _diag(np.conj(V)) @ (D @ _diag(lam) - _diag(D @ lam))
    F = C - A @ _diag(np.conj(I))
    Gi = _diag(1 / np.abs(V))
    Gaa = E + F
    Gva = 1j * Gi @ (E - F)
    return Gaa, Gva.T, Gva, Gi @ (C + C.T) @ Gi


def dSbr_dV(Ybr, Cbr, V):
    """S_br = (C_br·V)∘conj(Y_br·V) of a set of branch ends, and its derivatives with respect to θ and |V| (TN2 §5.2.1)."""
    I = Ybr @ V
    Vn = V / np.abs(V)
    Vb = Cbr @ V
    dVa = 1j * (_diag(np.conj(I)) @ Cbr @ _diag(V) - _diag(Vb) @ np.conj(Ybr @ _diag(V)))
    dVm = _diag(Vb) @ np.conj(Ybr @ _diag(Vn)) + _diag(np.conj(I)) @ Cbr @ _diag(Vn)
    return Vb * np.conj(I), dVa.tocsr(), dVm.tocsr()


def d2Sbr_dV2(Cbr, Ybr, V, lam):
    """The second derivatives of lamᵀ·S_br(V) (TN2 §5.2.2)."""
    A = Ybr.conj().T @ _diag(lam) @ Cbr
    B = _diag(np.conj(V)) @ A @ _diag(V)
    D = _diag((A @ V) * np.conj(V))
    E = _diag((A.T @ np.conj(V)) * V)
    F = B + B.T
    Gi = _diag(1 / np.abs(V))
    Haa = F - D - E
    Hva = 1j * Gi @ (B - B.T - D + E)
    return Haa, Hva.T, Hva, Gi @ F @ Gi


def d2ASbr_dV2(dSa, dSm, S, Cbr, Ybr, V, mu):
    """The second derivatives of muᵀ·|S_br|² (TN2 §5.4.2)."""
    Saa, Sav, Sva, Svv = d2Sbr_dV2(Cbr, Ybr, V, np.conj(S) * mu)
    M = _diag(mu)
    return (2 * (Saa + dSa.T @ M @ np.conj(dSa)).real, 2 * (Sav + dSa.T @ M @ np.conj(dSm)).real,
            2 * (Sva + dSm.T @ M @ np.conj(dSa)).real, 2 * (Svv + dSm.T @ M @ np.conj(dSm)).real)


# -------------------------------------------------------------------- the sources and the limits
def sources(net, case):
    """The dispatchable sources: every generator and power-station unit (limits and cost as given: no P limit when missing),
    and a slack feeder as a free source. Arrays in per unit; cost per hour with P in MW."""
    Sb = net.S_base
    out = {'name': [], 'bus': [], 'P0': [], 'Pmin': [], 'Pmax': [], 'Qmin': [], 'Qmax': [], 'cost': [], 'V0': [], 'notes': []}

    def val(v, d):
        return d if v is None else v / Sb
    for e in net.elements:
        k = e['kind']
        if k in ('generator', 'unit') or (k == 'feeder' and e.get('slack')):
            out['name'].append(e['name'])
            out['bus'].append(case.idx[e['bus']])
            out['P0'].append((e.get('P') or 0.0) / Sb)
            out['Pmin'].append(val(e.get('Pmin'), -np.inf))
            out['Pmax'].append(val(e.get('Pmax'), np.inf))
            out['Qmin'].append(val(e.get('Qmin'), -np.inf))
            out['Qmax'].append(val(e.get('Qmax'), np.inf))
            out['cost'].append(list(e.get('cost') or (0.0, 0.0, 0.0)))
            out['V0'].append(e.get('V') or 1.0)
            if k != 'feeder' and e.get('Pmax') is None:
                out['notes'].append(f'{e["name"]}: χωρίς όριο P (δεν δόθηκε Pmax)')
    for key in ('bus',):
        out[key] = np.array(out[key], int)
    for key in ('P0', 'Pmin', 'Pmax', 'Qmin', 'Qmax', 'V0'):
        out[key] = np.array(out[key], float)
    out['cost'] = np.array(out['cost'], float).reshape(-1, 3)
    out['n'] = len(out['name'])
    if not out['n'] or not np.any(out['cost'][:, :2]):
        raise OpfError('the optimal power flow needs a cost on at least one generator: generator(…, cost=(c2, c1, c0))')
    return out


def vlimits(net, case, default=(0.9, 1.1)):
    lo, hi, n = np.empty(case.n), np.empty(case.n), 0
    for i, b in enumerate(case.names):
        d = net.buses[b]
        internal = d['type'] == 'internal'
        lo[i] = d['Vmin'] if d.get('Vmin') is not None else (0.5 if internal else default[0])
        hi[i] = d['Vmax'] if d.get('Vmax') is not None else (1.5 if internal else default[1])
        n += d.get('Vmin') is None and not internal
    return lo, hi, n


def advise(case, kind='ac', net=None):
    """The proposal of the engine for the optimal power flow of this network, with its reason."""
    g = case.graph()
    nr = int(np.isfinite(case.rate).sum())
    if kind == 'dc':
        why = (f'γραμμικό δίκτυο ({case.n} ζυγοί): τετραγωνικό πρόγραμμα με εσωτερικό σημείο σε αραιούς πίνακες' +
               (f', με τα όρια των {nr} κλάδων που έχουν ονομαστική ισχύ' if nr else ', χωρίς όρια ροής (κανένας κλάδος δεν έχει ονομαστική ισχύ)'))
    else:
        why = (f'{case.n} ζυγοί: εσωτερικό σημείο πρωτεύοντος–δυϊκού με ακριβείς Ιακωβιανές και Εσσιανές σε αραιούς πίνακες· εκκίνηση από το μέσο '
               'των ορίων (ένα εσωτερικό σημείο, όπως θέλει η μέθοδος: η λύση της ροής φορτίου κάθεται συνήθως πάνω σε όρια)' +
               (f'· όρια ροής στους {nr} κλάδους με ονομαστική ισχύ' if nr else '· χωρίς όρια ροής (κανένας κλάδος δεν έχει ονομαστική ισχύ)'))
    return {'method': 'ipm', 'kind': kind, 'start': 'mid', 'flow_limits': nr, 'why': why, 'facts': g}


# -------------------------------------------------------------------- the solution
def solve(net, kind='ac', flow_limits=True, start='auto', tol=1e-6, max_iter=150, ratings=None, v_default=(0.9, 1.1), record=False, dS=None, extra=None,
          acdc=None):
    """kind: 'ac' or 'dc'. flow_limits: use the ratings of the branches (ratings: {branch: VA} adds or replaces some).
    start: 'auto' (= 'mid', the middle of the limits), or 'pf' (the voltages and the dispatch of the network as given).
    v_default: the limits of |V| for buses that have none (AC).
    4.19.2 — dS (one complex value per bus, VA): a change of the net constant-power injection (a load that grows by ΔS is
    dS = −ΔS), so that many load scenarios of one network are solved without building it again.
    start may also be a proposed point of the AC problem (a neural start, pcl.nnstart, or a solution of a nearby case):
    {'x': (θ, |V|, P_g, Q_g) in rad and pu, 'lam': the 2·n_b multipliers of the power balance (optional), 'gamma': the barrier
    parameter to start from (default GAMMA0)}. The solver verifies: the proposal is used only if its power mismatch is smaller
    than that of the normal start, and if the iteration from it does not converge the problem is solved again from the
    normal start. The result is the same optimum within tol; a bad proposal costs time only. 'start' in the result says
    what was used ('warm' or 'mid'), 'start_path' how it went, and 'iterations' counts every iteration that was made.
    4.19.4 — extra (DC only): more linear constraints, and more unknowns with a linear cost, for the security constraints of
    pcl.scopf: {'A': rows (m × (n_b + n_g + n_s): θ of every bus in rad, P of every source in pu, then n_s further unknowns),
    'l', 'u', and for the further unknowns 'xmin', 'xmax', 'cost' (per pu)}. The result then has 'mu_extra' (the multipliers of
    the rows, per MW as those of the flow limits) and 'x_extra'; 'cost' is the cost of the generation alone.
    4.21 — acdc (AC only; pcl.dcgrid.acdc_opf builds it): the DC grids and the converters of the stations (Ergun et al. 2019, the
    nonlinear bus-injection form): one more unknown per DC bus (its voltage u, pu) and per converter (its current I, pu), the
    converter a source of the AC problem at its own bus c, and the equalities P_c² + Q_c² = |V_c|²·I² and, per DC bus,
    Σ(−P_c − a − b·I − c·I²) = u·(G′u); the DC lines as linear limits of their current. {'G' (nd × nd, pu), 'Umin', 'Umax' (pu),
    'stations': [{'g' (its source), 'c' (its AC bus), 'd' (its DC bus), 'a', 'b', 'c2' (pu), 'Imax' (pu)}], 'lines': [{'a', 'b',
    'k' (pu of current per pu of voltage), 'Irat' (pu)}]}. The result then has 'acdc': {'u', 'I', 'lam_dc', 'mu_lines'}.

    Returns {'converged', 'iterations', 'message', 'cost' (per hour), 'kind', 'buses': {bus: V, angle, P, Q (sources), Pload,
    Qload, 'lmp' and 'lmp_Q' (cost per MWh and per Mvar·h), 'mu_Vmin', 'mu_Vmax'}, 'sources': [{name, bus, P, Q (W, var), 'mu_Pmin',
    'mu_Pmax', 'mu_Qmin', 'mu_Qmax'}], 'branches' (as load_flow, with 'loading' and 'mu' where a rating exists), 'losses',
    'binding': [{'kind', 'name', 'mu'}], 'advice', 'notes', 'time', 'cond', 'history' (with record)}."""
    if kind not in ('ac', 'dc'):
        raise OpfError("kind: 'ac' or 'dc'")
    if extra is not None and kind != 'dc':
        raise OpfError('extra: for the DC problem only')
    if acdc is not None and kind != 'ac':
        raise OpfError('acdc: for the AC problem only')
    t0 = time.perf_counter()
    case = net.case()
    if dS is not None:
        dS = np.asarray(dS, complex)
        if dS.shape != (case.n,):
            raise OpfError(f'dS: one value per bus ({case.n})')
        case = copy.copy(case)
        case.load = case.load.copy()
        case.load[:, 2] = case.load[:, 2] - dS / net.S_base
    G = sources(net, case)
    nb, ng, nl = case.n, G['n'], case.nl
    base = net.S_base / 1e6                                  # MW per pu
    c2, c1, c0 = G['cost'].T
    Cg = sp.csr_matrix((np.ones(ng), (G['bus'], np.arange(ng))), shape=(nb, ng))
    rate = case.rate.copy()
    for k, v in (ratings or {}).items():
        rate[case.br_name.index(k)] = v / net.S_base
    il = np.flatnonzero(np.isfinite(rate) & (rate > 0)) if flow_limits else np.zeros(0, int)
    ref = np.flatnonzero(case.typ == PF.REF)
    adv = advise(case, kind)
    notes = list(G['notes'])

    def cost(Pg):
        P = Pg * base
        return float(np.sum(c2 * P * P + c1 * P + c0)), (2 * c2 * P + c1) * base
    d2c = 2 * c2 * base * base

    if kind == 'dc':
        Bbus, Bf, Pbi, Pfi = PF.dc_model(case)
        Pd = case.zip(np.ones(nb)).real + case.ysh.real
        x0 = np.r_[np.zeros(nb), np.clip(G['P0'], np.where(np.isfinite(G['Pmin']), G['Pmin'], -1e10), np.where(np.isfinite(G['Pmax']), G['Pmax'], 1e10))]
        xmin = np.r_[np.full(nb, -np.inf), G['Pmin']]
        xmax = np.r_[np.full(nb, np.inf), G['Pmax']]
        xmin[ref] = xmax[ref] = case.ang0[ref]
        x0[ref] = case.ang0[ref]
        A = sp.vstack([sp.hstack([Bbus, -Cg]), sp.hstack([Bf[il], sp.csr_matrix((len(il), ng))])], format='csr')
        lo = np.r_[-(Pd + Pbi), -rate[il] - Pfi[il]]
        up = np.r_[-(Pd + Pbi), rate[il] - Pfi[il]]
        nx = ns = 0
        cs = np.zeros(0)
        if extra is not None and extra['A'].shape[0]:
            Ax = sp.csr_matrix(extra['A'])
            ns = Ax.shape[1] - (nb + ng)
            if ns < 0:
                raise OpfError(f'extra: at least {nb + ng} columns (θ of every bus, P of every source)')
            nx = Ax.shape[0]
            A = sp.vstack([sp.hstack([A, sp.csr_matrix((A.shape[0], ns))]), Ax], format='csr')
            lo, up = np.r_[lo, np.asarray(extra['l'], float)], np.r_[up, np.asarray(extra['u'], float)]
            cs = np.asarray(extra.get('cost', np.zeros(ns)), float)
            xmin, xmax = np.r_[xmin, np.asarray(extra.get('xmin', np.zeros(ns)), float)], np.r_[xmax, np.asarray(extra.get('xmax', np.full(ns, np.inf)), float)]
            x0 = np.r_[x0, np.asarray(extra.get('x0', np.zeros(ns)), float)]

        def f(x):
            v, d = cost(x[nb:nb + ng])
            return v + float(cs @ x[nb + ng:]), np.r_[np.zeros(nb), d, cs]
        Hc = sp.diags(np.r_[np.zeros(nb), d2c, np.zeros(ns)], format='csr')
        r = ipm(f, x0, None, lambda x, lam, mu, cm: Hc * cm, A, lo, up, xmin, xmax, tol=tol, max_iter=max_iter, cost_mult=1e-4, record=record)
        x = r['x']
        th, Pg = x[:nb], x[nb:nb + ng]
        r['f'] = r['f'] - float(cs @ x[nb + ng:])            # the cost of the generation alone
        Pf = Bf @ th + Pfi
        res = {'converged': r['converged'], 'iterations': r['iterations'], 'message': r['message'], 'cost': r['f'], 'kind': 'dc', 'buses': {}, 'sources': [],
               'branches': [], 'binding': []}
        lamP = r['lam']['A_eq'][:nb] / base
        Pgb = Cg @ Pg
        for i, b in enumerate(case.names):
            res['buses'][b] = {'V': 1.0, 'angle': float(np.degrees(th[i])), 'P': float(Pgb[i] * net.S_base), 'Q': 0.0, 'Pload': float(Pd[i] * net.S_base),
                               'Qload': 0.0, 'lmp': float(lamP[i]), 'lmp_Q': 0.0, 'mu_Vmin': 0.0, 'mu_Vmax': 0.0}
        muF = np.zeros(nl)
        muF[il] = (r['mu']['A_u'][nb:nb + len(il)] + r['mu']['A_l'][nb:nb + len(il)]) / base
        if nx:
            res['mu_extra'] = ((r['mu']['A_u'][nb + len(il):] + r['mu']['A_l'][nb + len(il):]) / base).tolist()
            res['x_extra'] = x[nb + ng:].tolist()
        for k in range(nl):
            res['branches'].append({'name': case.br_name[k], 'a': case.names[case.f[k]], 'b': case.names[case.t[k]], 'Pa': float(Pf[k] * net.S_base),
                                    'Pb': float(-Pf[k] * net.S_base), 'Qa': 0.0, 'Qb': 0.0, 'S': float(abs(Pf[k]) * net.S_base), 'loss': 0.0,
                                    'loading': float(abs(Pf[k]) / rate[k]) if np.isfinite(rate[k]) else None, 'mu': float(muF[k])})
        res['losses'] = 0.0
        mPu, mPl = r['mu']['x_u'][nb:nb + ng] / base, r['mu']['x_l'][nb:nb + ng] / base
        Qg = np.zeros(ng)
        mQu = mQl = np.zeros(ng)
        mVu = mVl = np.zeros(nb)
    else:
        Y = case.Y
        L = case.load
        Vlo, Vhi, nodef = vlimits(net, case, v_default)
        if nodef:
            notes.append(f'{nodef} ζυγοί χωρίς όρια τάσης: {v_default[0]}–{v_default[1]} pu')
        k = np.arange(len(il))
        Cf = sp.csr_matrix((np.ones(len(il)), (k, case.f[il])), shape=(len(il), nb))
        Ct = sp.csr_matrix((np.ones(len(il)), (k, case.t[il])), shape=(len(il), nb))
        Yf, Yt = case.Yf[il], case.Yt[il]
        r2 = rate[il] ** 2
        nx = 2 * nb + 2 * ng
        iPg, iQg = slice(2 * nb, 2 * nb + ng), slice(2 * nb + ng, nx)
        Zg = sp.csr_matrix((nb, ng))
        Zl = sp.csr_matrix((len(il), 2 * ng))

        def f(x):
            v, d = cost(x[iPg])
            return v, np.r_[np.zeros(2 * nb), d, np.zeros(ng)]

        def gh(x):
            Va, Vm, Pg, Qg = x[:nb], x[nb:2 * nb], x[iPg], x[iQg]
            V = Vm * np.exp(1j * Va)
            mis = V * np.conj(Y @ V) + (L[:, 0] * Vm ** 2 + L[:, 1] * Vm + L[:, 2]) - Cg @ (Pg + 1j * Qg)
            dSa, dSm = dSbus_dV(Y, V)
            dSm = dSm + _diag(2 * L[:, 0] * Vm + L[:, 1])
            Gm = sp.vstack([sp.hstack([dSa.real, dSm.real, -Cg, Zg]), sp.hstack([dSa.imag, dSm.imag, Zg, -Cg])], format='csr')
            if not len(il):
                return np.r_[mis.real, mis.imag], Gm, None, None
            Sf, dFa, dFm = dSbr_dV(Yf, Cf, V)
            St, dTa, dTm = dSbr_dV(Yt, Ct, V)

            def dA(S, da, dm):
                return 2 * (_diag(S.real) @ da.real + _diag(S.imag) @ da.imag), 2 * (_diag(S.real) @ dm.real + _diag(S.imag) @ dm.imag)
            Afa, Afm = dA(Sf, dFa, dFm)
            Ata, Atm = dA(St, dTa, dTm)
            Hm = sp.vstack([sp.hstack([Afa, Afm, Zl]), sp.hstack([Ata, Atm, Zl])], format='csr')
            return np.r_[mis.real, mis.imag], Gm, np.r_[np.abs(Sf) ** 2 - r2, np.abs(St) ** 2 - r2], Hm

        def hess(x, lam, mu, cm):
            Va, Vm = x[:nb], x[nb:2 * nb]
            V = Vm * np.exp(1j * Va)
            Paa, Pav, Pva, Pvv = d2Sbus_dV2(Y, V, lam[:nb])
            Qaa, Qav, Qva, Qvv = d2Sbus_dV2(Y, V, lam[nb:])
            Haa, Hav, Hva = Paa.real + Qaa.imag, Pav.real + Qav.imag, Pva.real + Qva.imag
            Hvv = Pvv.real + Qvv.imag + _diag(2 * (L[:, 0].real * lam[:nb] + L[:, 0].imag * lam[nb:]))
            if len(il):
                nli = len(il)
                Sf, dFa, dFm = dSbr_dV(Yf, Cf, V)
                St, dTa, dTm = dSbr_dV(Yt, Ct, V)
                for S, da, dm, Cb, Yb, m in ((Sf, dFa, dFm, Cf, Yf, mu[:nli]), (St, dTa, dTm, Ct, Yt, mu[nli:])):
                    a, b, c, d = d2ASbr_dV2(da, dm, S, Cb, Yb, V, m)
                    Haa, Hav, Hva, Hvv = Haa + a, Hav + b, Hva + c, Hvv + d
            Hx = sp.bmat([[Haa, Hav], [Hva, Hvv]], format='csr')
            return sp.block_diag([Hx, sp.diags(np.r_[d2c * cm, np.zeros(ng)])], format='csr')

        big = 1e10
        xmin = np.r_[np.full(nb, -np.inf), Vlo, G['Pmin'], G['Qmin']]
        xmax = np.r_[np.full(nb, np.inf), Vhi, G['Pmax'], G['Qmax']]
        xmin[ref] = xmax[ref] = case.ang0[ref]
        if acdc is not None:                                 # 4.21: the DC grids and the converters (Ergun et al. 2019, NLP)
            f, gh, hess, xmin, xmax = _with_acdc(acdc, nb, ng, iPg, iQg, nx, len(il), f, gh, hess, xmin, xmax)
        warm, path = (start if isinstance(start, dict) else None), []
        if warm is not None:
            start = 'mid'
        if start in ('auto', 'mid'):
            lo_, hi_ = np.where(np.isfinite(xmin), xmin, -big), np.where(np.isfinite(xmax), xmax, big)
            x0 = (lo_ + hi_) / 2
            k1 = ~np.isfinite(xmin) & np.isfinite(xmax)
            x0[k1] = xmax[k1] - 1
            k2 = np.isfinite(xmin) & ~np.isfinite(xmax)
            x0[k2] = xmin[k2] + 1
            x0[~np.isfinite(xmin) & ~np.isfinite(xmax)] = 0.0
            x0[:nb] = case.ang0[ref[0]]
            if acdc is not None:                             # the DC voltages at 1 pu, the currents of the converters at half their limit
                x0[nx:nx + acdc['nd']] = np.clip(1.0, xmin[nx:nx + acdc['nd']], xmax[nx:nx + acdc['nd']])
        elif start == 'pf':
            Qb = np.clip(0.0, np.where(np.isfinite(G['Qmin']), G['Qmin'], -big), np.where(np.isfinite(G['Qmax']), G['Qmax'], big))
            x0 = np.r_[case.ang0, np.clip(case.Vset, Vlo, Vhi), np.clip(G['P0'], np.where(np.isfinite(G['Pmin']), G['Pmin'], -big), np.where(np.isfinite(G['Pmax']), G['Pmax'], big)), Qb]
            if acdc is not None:
                x0 = np.r_[x0, np.clip(1.0, xmin[nx:nx + acdc['nd']], xmax[nx:nx + acdc['nd']]), 0.5 * xmax[nx + acdc['nd']:]]
        else:
            raise OpfError("start: 'auto', 'mid' or 'pf'")
        r, extra = None, 0
        if warm is not None:
            xw = np.asarray(warm.get('x', ()), float)
            if xw.shape != x0.shape or not np.all(np.isfinite(xw)):
                path.append('πρόταση με λάθος διαστάσεις ή μη πεπερασμένες τιμές: αγνοήθηκε')
            else:
                xw = np.minimum(np.maximum(xw, xmin), xmax)                 # inside the limits (and the reference angle as fixed)
                bw, b0 = float(np.abs(gh(xw)[0]).max()), float(np.abs(gh(x0)[0]).max())
                if not bw < b0:
                    path.append(f'πρόταση με υπόλοιπο ισχύος {bw:.2g} pu, όχι μικρότερο από της κανονικής εκκίνησης ({b0:.2g} pu): αγνοήθηκε')
                else:
                    lw = warm.get('lam')
                    w = {'gamma': float(warm.get('gamma', GAMMA0)), 'lam': None if lw is None else {'g': np.asarray(lw, float)}}
                    r = ipm(f, xw, gh, hess, xmin=xmin, xmax=xmax, tol=tol, max_iter=max_iter, cost_mult=1e-4, record=record, warm=w,
                            step_control=False)
                    if r['converged']:
                        path.append(f'από την πρόταση (υπόλοιπο ισχύος {bw:.2g} pu απέναντι σε {b0:.2g} pu)')
                    else:
                        path.append(f"από την πρόταση δεν συνέκλινε ({r['message']}): ξανά από την κανονική εκκίνηση")
                        extra, r = r['iterations'], None
        used = 'warm' if r is not None else 'mid'
        if r is None:
            r = ipm(f, x0, gh, hess, xmin=xmin, xmax=xmax, tol=tol, max_iter=max_iter, cost_mult=1e-4, record=record)
            r['iterations'] += extra
        x = r['x']
        V = x[nb:2 * nb] * np.exp(1j * x[:nb])
        Pg, Qg = x[iPg], x[iQg]
        if acdc is not None:                                 # 4.21: what the DC part found; the AC multipliers stay the first 2·n_b
            nd = acdc['nd']
            mh = r['mu']['h'] if r['mu']['h'] is not None else np.zeros(0)
            acdc_out = {'u': x[nx:nx + nd].copy(), 'I': x[nx + nd:].copy(), 'lam_dc': r['lam']['g'][2 * nb + acdc['ns']:].copy() / base,
                        'mu_lines': np.asarray(mh[2 * len(il):], float).copy() / base}
            r['lam']['g'] = r['lam']['g'][:2 * nb]
            r['mu']['h'] = mh[:2 * len(il)]
        code = {PF.PQ: 'PQ', PF.PV: 'PV', PF.REF: 'slack'}
        res = net._lf_result(case.names, case.idx, V, Y @ V, L, {b: code[int(case.typ[i])] for i, b in enumerate(case.names)}, r['converged'], r['iterations'])
        res.update(message=r['message'], cost=r['f'], kind='ac', sources=[], binding=[])
        res['_raw'] = {'x': x.copy(), 'lam': r['lam']['g'].copy()}        # the point as the solver holds it (for pcl.nnstart)
        res.pop('_V', None)
        res.pop('_idx', None)
        lamP, lamQ = r['lam']['g'][:nb] / base, r['lam']['g'][nb:] / base
        mVu, mVl = r['mu']['x_u'][nb:2 * nb], r['mu']['x_l'][nb:2 * nb]
        for i, b in enumerate(case.names):
            res['buses'][b].update(lmp=float(lamP[i]), lmp_Q=float(lamQ[i]), mu_Vmin=float(mVl[i]), mu_Vmax=float(mVu[i]))
        muF = np.zeros(nl)
        if len(il):
            m = r['mu']['h']
            muF[il] = 2 * (m[:len(il)] + m[len(il):]) * rate[il] / base            # per MVA of the limit (as MATPOWER reports it)
        byname = {q['name']: q for q in res['branches']}
        for kk in range(nl):
            q = byname.get(case.br_name[kk])
            if q is not None:
                q['loading'] = float(q['S'] / (rate[kk] * net.S_base)) if np.isfinite(rate[kk]) else None
                q['mu'] = float(muF[kk])
        mPu, mPl = r['mu']['x_u'][iPg] / base, r['mu']['x_l'][iPg] / base
        mQu, mQl = r['mu']['x_u'][iQg] / base, r['mu']['x_l'][iQg] / base
    for j in range(ng):
        res['sources'].append({'name': G['name'][j], 'bus': case.names[G['bus'][j]], 'P': float(Pg[j] * net.S_base), 'Q': float(Qg[j] * net.S_base),
                               'cost': float(c2[j] * (Pg[j] * base) ** 2 + c1[j] * Pg[j] * base + c0[j]),
                               'mu_Pmin': float(mPl[j]), 'mu_Pmax': float(mPu[j]), 'mu_Qmin': float(mQl[j]), 'mu_Qmax': float(mQu[j])})
    # what binds: a multiplier that is not negligible against the price level
    scale = max(1e-6, float(np.median(np.abs([b['lmp'] for b in res['buses'].values()]))))
    thr = 1e-4 * scale
    for s in res['sources']:
        for key, lab in (('mu_Pmax', 'Pmax'), ('mu_Pmin', 'Pmin'), ('mu_Qmax', 'Qmax'), ('mu_Qmin', 'Qmin')):
            if s[key] > thr:
                res['binding'].append({'kind': lab, 'name': s['name'], 'mu': s[key]})
    for b, d in res['buses'].items():
        for key, lab in (('mu_Vmax', 'Vmax'), ('mu_Vmin', 'Vmin')):
            if d[key] > thr * base:
                res['binding'].append({'kind': lab, 'name': b, 'mu': d[key]})
    for q in res['branches']:
        if q.get('mu', 0.0) > thr:
            res['binding'].append({'kind': 'flow', 'name': q['name'], 'mu': q['mu']})
    res.update(advice=adv, notes=notes, time=time.perf_counter() - t0, cond=r['cond'], method='ipm', start=('mid' if start == 'auto' else start),
               flow_limits=int(len(il)))
    if acdc is not None:
        res['acdc'] = acdc_out
    if kind == 'ac':
        res.update(start=(used if used == 'warm' else res['start']), start_path=path)
    elif isinstance(start, dict):
        raise OpfError('start: a proposed point is for the AC problem only')
    if record:
        res['history'] = r['history']
    return res


def _with_acdc(acdc, nb, ng, iPg, iQg, nx, nli, f, gh, hess, xmin, xmax):
    """4.21: the AC problem with its DC grids (see solve, acdc): x grows by the DC voltages u and the currents I of the
    converters; g by one equality per converter and one per DC bus; h by two rows per rated DC line. The functions of the AC
    problem are used as they are on the first 2·n_b + 2·n_g unknowns, with their own multipliers."""
    nd, ns = acdc['nd'], len(acdc['stations'])
    acdc['ns'] = ns
    Gd = np.asarray(acdc['G'], float)
    iu, iI = slice(nx, nx + nd), slice(nx + nd, nx + nd + ns)
    N = nx + nd + ns
    st = acdc['stations']
    sg = np.array([q['g'] for q in st], int)
    sc = np.array([q['c'] for q in st], int)
    sd = np.array([q['d'] for q in st], int)
    a = np.array([q['a'] for q in st], float)
    b = np.array([q['b'] for q in st], float)
    c2 = np.array([q['c2'] for q in st], float)
    ln = acdc.get('lines') or []
    La = np.array([q['a'] for q in ln], int)
    Lb = np.array([q['b'] for q in ln], int)
    k = np.array([q['k'] / q['Irat'] for q in ln], float)
    nh = 2 * len(ln)
    Hl = sp.csr_matrix((np.r_[k, -k, -k, k], (np.r_[np.arange(len(ln)), np.arange(len(ln)), len(ln) + np.arange(len(ln)), len(ln) + np.arange(len(ln))],
                                               np.r_[nx + La, nx + Lb, nx + La, nx + Lb])), shape=(nh, N)) if nh else None
    Cs = sp.csr_matrix((np.ones(ns), (sd, np.arange(ns))), shape=(nd, ns))       # converters → their DC bus
    xmin = np.r_[xmin, np.asarray(acdc['Umin'], float), np.zeros(ns)]
    xmax = np.r_[xmax, np.asarray(acdc['Umax'], float), np.array([q['Imax'] for q in st], float)]

    def pad(M, rows=None):
        return sp.hstack([M, sp.csr_matrix((M.shape[0], N - M.shape[1]))], format='csr')

    def f2(x):
        v, d = f(x)
        return v, np.r_[d, np.zeros(N - len(d))]

    def gh2(x):
        g0, G0, h0, H0 = gh(x)
        Vm, Pg, Qg, u, I = x[nb:2 * nb], x[iPg], x[iQg], x[iu], x[iI]
        P, Q, Vc = Pg[sg], Qg[sg], Vm[sc]
        gs = P * P + Q * Q - Vc * Vc * I * I                                      # P_c² + Q_c² = |V_c|²·I²
        Gu = Gd @ u
        gd = Cs @ (-P - a - b * I - c2 * I * I) - u * Gu                         # the power balance of every DC bus
        r = np.arange(ns)
        Js = sp.csr_matrix((np.r_[2 * P, 2 * Q, -2 * Vc * I * I, -2 * Vc * Vc * I], (np.r_[r, r, r, r], np.r_[iPg.start + sg, iQg.start + sg, nb + sc, nx + nd + r])), shape=(ns, N))
        Ju = -(sp.diags(Gu) + sp.diags(u) @ sp.csr_matrix(Gd))                   # ∂(−u·(G′u))/∂u
        Jd = sp.csr_matrix((np.r_[-np.ones(ns), -(b + 2 * c2 * I)], (np.r_[sd, sd], np.r_[iPg.start + sg, nx + nd + r])), shape=(nd, N)) \
            + sp.hstack([sp.csr_matrix((nd, nx)), Ju, sp.csr_matrix((nd, ns))], format='csr')
        g = np.r_[g0, gs, gd]
        Gm = sp.vstack([pad(G0), Js, Jd], format='csr')
        if not nh and h0 is None:
            return g, Gm, None, None
        hl = np.r_[k * (u[La] - u[Lb]) - 1.0, -k * (u[La] - u[Lb]) - 1.0] if nh else np.zeros(0)
        hs = [pad(H0)] if h0 is not None else []
        return g, Gm, np.r_[h0 if h0 is not None else np.zeros(0), hl], sp.vstack(hs + ([Hl] if nh else []), format='csr')

    def hess2(x, lam, mu, cm):
        n0 = 2 * nb
        H0 = hess(x, lam[:n0], mu[:2 * nli] if mu is not None else mu, cm)
        H = sp.block_diag([H0, sp.csr_matrix((N - H0.shape[0], N - H0.shape[0]))], format='lil')
        ls, ld = lam[n0:n0 + ns], lam[n0 + ns:]
        Vm, I, u = x[nb:2 * nb], x[iI], x[iu]
        for j in range(ns):
            p, q, vc, ii = iPg.start + sg[j], iQg.start + sg[j], nb + sc[j], nx + nd + j
            H[p, p] += 2 * ls[j]
            H[q, q] += 2 * ls[j]
            H[vc, vc] += -2 * I[j] * I[j] * ls[j]
            H[ii, ii] += -2 * Vm[sc[j]] ** 2 * ls[j] - 2 * c2[j] * ld[sd[j]]
            H[vc, ii] += -4 * Vm[sc[j]] * I[j] * ls[j]
            H[ii, vc] += -4 * Vm[sc[j]] * I[j] * ls[j]
        Huu = -(np.diag(ld) @ Gd + Gd @ np.diag(ld))
        H[iu, iu] = H[iu, iu].toarray() + Huu
        return H.tocsr()
    return f2, gh2, hess2, xmin, xmax


__all__ = ['solve', 'advise', 'sources', 'OpfError', 'GAMMA0', 'dSbus_dV', 'd2Sbus_dV2', 'dSbr_dV', 'd2Sbr_dV2', 'd2ASbr_dV2']
