"""Security-constrained optimal power flow (4.19.4, ROADMAP §73): the cheapest dispatch with which no branch goes over its
rating when any one branch is lost. Preventive: the dispatch is not changed after the outage.

    solve(net)      → the result of the DC optimal power flow with its security constraints, and what they cost

The network model is the linear one (DC: angles and active power) for the base case and for every outage, so that the flow
of branch l after the loss of branch k is the flow before it plus a fixed part of the flow of k (the line outage
distribution factor of pcl.powerflow.lodf):

    P_l after k = P_l + L[l, k]·P_k ,        |P_l after k| ≤ emergency · rating_l

Every such pair is one more linear constraint on the angles. There are (branches)² of them and almost none binds, so they
are not all written: the problem is solved, the outages are screened, the constraints that are violated are added, and the
problem is solved again, until no outage overloads a branch (the scheme of Alsac & Stott 1974: solve, monitor the security,
introduce the constraints of the insecure outage cases, continue; here with the linear model in both steps). An outage that
splits the network has no distribution factor: it is left out of the screening and reported.

A network may have outages that no dispatch can cover (a load fed through two branches, each too small for all of it). The
problem would then have no solution and say nothing more. So every security constraint has a slack with a high price: the
overload that cannot be removed. The result is the dispatch that covers what can be covered, and the list of the pairs
that stay overloaded with by how much ('unsecured'); 'secure' is true only when that list is empty.

What it is not: the reactive power and the voltages are not in the model (the result says how the AC load flow of the
dispatch looks, see check); the generators do not move after the outage (no corrective rescheduling: Monticelli, Pereira &
Granville 1987); outages of generators are not screened.

Sources (THEORY §8Λ): O. Alsac, B. Stott, «Optimal load flow with steady-state security», IEEE Trans. PAS 93(3), 1974;
A. Monticelli, M. V. F. Pereira, S. Granville, «Security-constrained optimal power flow with post-contingency corrective
rescheduling», IEEE Trans. Power Systems 2(1), 1987 (what is not done here); the distribution factors of THEORY §8Ζ."""
import time

import numpy as np
from scipy import sparse as sp

from . import opf as OPF
from . import powerflow as PF

MAX_PAIRS = 4_000_000        # monitored branches × outages screened at once (above it: in blocks of outages)


class ScopfError(ValueError):
    pass


def screen(case, Pf, rate, L, mon, out, emergency=1.0):
    """The flows after every outage: (worst loading per outage, the branch that carries it, the matrix of loadings).
    Pf, rate in pu; L the distribution factors; mon the monitored branches, out the outages (indices)."""
    post = Pf[mon][:, None] + L[np.ix_(mon, out)] * Pf[out][None, :]
    post[np.isin(mon, out)[:, None] & (np.asarray(mon)[:, None] == np.asarray(out)[None, :])] = 0.0      # the branch that is out carries nothing
    load = np.abs(post) / (emergency * rate[mon])[:, None]
    j = np.argmax(load, axis=0)
    return load[j, np.arange(len(out))], np.asarray(mon)[j], load, post


def solve(net, emergency=1.0, outages=None, max_rounds=30, per_round=None, tol=1e-6, max_iter=150, ratings=None, margin=1e-4, check=True, penalty=None):
    """emergency: the rating a branch may carry after an outage, as a multiple of its rating (1.0: the same as before it).
    outages: names of the branches to lose (default: every branch whose loss does not split the network).
    per_round: at most this many new constraints per round (default: the worst pair of every insecure outage).
    margin: a loading above 1 + margin after an outage counts as insecure (the tolerance of the screening).
    check: also solve the AC load flow of the dispatch that was found, and say what the linear model missed.
    penalty: the price of a MW of overload that stays after an outage (default: 100 times the highest marginal cost of a
    generator at its maximum): high enough that an overload is removed whenever the generators can remove it.

    Returns the result of pcl.opf.solve(net, 'dc') for the secure dispatch, and
    'security': {'outages' (screened), 'islands' (names left out), 'rounds', 'constraints' (added), 'binding': [{'branch',
    'outage', 'mu' (per MW), 'loading'}], 'cost_base' (the cost without security), 'cost_security' (the difference),
    'worst_before', 'worst_after': {'outage', 'branch', 'loading'} (the worst outage of the dispatch without and with security),
    'insecure_before' (outages that overload a branch at the dispatch without security), 'secure', 'unsecured': [{'branch',
    'outage', 'overload' (MW above the emergency rating), 'loading'}] (what no dispatch covers), 'history': [(round, constraints,
    worst loading, cost)], 'ac': what the AC load flow of the dispatch says (with check)}."""
    t0 = time.perf_counter()
    if not emergency > 0:
        raise ScopfError('emergency: a positive multiple of the rating')
    case = net.case()
    nb, nl = case.n, case.nl
    rate = case.rate.copy()
    for k, v in (ratings or {}).items():
        rate[case.br_name.index(k)] = v / net.S_base
    mon = np.flatnonzero(np.isfinite(rate) & (rate > 0))
    if not len(mon):
        raise ScopfError('the security-constrained optimal power flow needs a rating on at least one branch')
    Bbus, Bf, Pbi, Pfi = PF.dc_model(case)
    L = PF.lodf(case)
    bridge = np.flatnonzero(np.isnan(L).any(axis=0))
    if outages is None:
        out = np.setdiff1d(np.arange(nl), bridge)
    else:
        try:
            want = np.array([case.br_name.index(str(k)) for k in outages], int)
        except ValueError as e:
            raise ScopfError(f'outages: {e}') from None
        out = np.setdiff1d(want, bridge)
        bridge = np.intersect1d(want, bridge)
    if not len(out):
        raise ScopfError('every outage asked for splits the network: there is nothing to secure')
    Lz = np.nan_to_num(L, nan=0.0)
    Bfd = Bf.tocsr()
    G = OPF.sources(net, case)
    ng = G['n']
    pairs, rows, lo, up = [], [], [], []
    seen = set()
    MWpu = net.S_base / 1e6
    if penalty is None:
        c2, c1 = G['cost'][:, 0], G['cost'][:, 1]
        pm = np.where(np.isfinite(G['Pmax']), G['Pmax'], 0.0) * MWpu
        penalty = 100.0 * max(1.0, float(np.max(np.abs(2 * c2 * pm + c1))) if ng else 1.0)

    def run():
        extra = None
        m = len(rows)
        if m:                                                 # row·θ − s ≤ up and row·θ + s ≥ lo, with s ≥ 0 the overload that stays (pu)
            R = sp.vstack(rows, format='csr')
            Z, I = sp.csr_matrix((m, ng)), sp.identity(m, format='csr')
            extra = {'A': sp.vstack([sp.hstack([R, Z, -I]), sp.hstack([R, Z, I])], format='csr'), 'l': np.r_[np.full(m, -np.inf), np.array(lo)],
                     'u': np.r_[np.array(up), np.full(m, np.inf)], 'cost': np.full(m, penalty * MWpu), 'xmin': np.zeros(m), 'xmax': np.full(m, np.inf)}
        r = OPF.solve(net, 'dc', tol=tol, max_iter=max_iter, ratings=ratings, extra=extra)
        if not r['converged']:
            return r, None
        Pf = np.array([q['Pa'] for q in r['branches']]) / net.S_base
        return r, Pf

    base, Pf = run()
    if Pf is None:
        raise ScopfError('the optimal power flow without security constraints has no solution: ' + str(base.get('message')))
    w0, b0, load0, _ = screen(case, Pf, rate, Lz, mon, out, emergency)
    k0 = int(np.argmax(w0))
    worst_before = {'outage': case.br_name[out[k0]], 'branch': case.br_name[b0[k0]], 'loading': float(w0[k0])}
    insecure_before = int((w0 > 1 + margin).sum())
    res, history, rounds = base, [(0, 0, float(w0[k0]), float(base['cost']))], 0
    w, bw, load = w0, b0, load0
    while (w > 1 + margin).any() and rounds < max_rounds:
        rounds += 1
        bad = np.flatnonzero(w > 1 + margin)
        new = [(int(bw[j]), int(out[j]), float(w[j])) for j in bad if (int(bw[j]), int(out[j])) not in seen]
        if not new:                                           # every worst pair is in already: take every violated pair that is not
            ii, jj = np.nonzero(load > 1 + margin)
            new = [(int(mon[i]), int(out[j]), float(load[i, j])) for i, j in zip(ii, jj) if (int(mon[i]), int(out[j])) not in seen]
            if not new:
                break
        new.sort(key=lambda q: -q[2])
        for l, k, _ in new[:per_round] if per_round else new:
            seen.add((l, k))
            pairs.append((l, k))
            rows.append(Bfd[l] + Lz[l, k] * Bfd[k])
            c = Pfi[l] + Lz[l, k] * Pfi[k]
            lo.append(-emergency * rate[l] - c)
            up.append(emergency * rate[l] - c)
        res, Pf = run()
        if Pf is None:
            break
        w, bw, load, _ = screen(case, Pf, rate, Lz, mon, out, emergency)
        history.append((rounds, len(pairs), float(w.max()), float(res['cost'])))
    sec = {'outages': int(len(out)), 'islands': [case.br_name[k] for k in bridge], 'rounds': rounds, 'constraints': len(pairs), 'emergency': float(emergency),
           'cost_base': float(base['cost']), 'insecure_before': insecure_before, 'worst_before': worst_before, 'history': history, 'monitored': int(len(mon))}
    if Pf is None:
        res = dict(res, converged=False, message='με τους περιορισμούς ασφάλειας το πρόβλημα δεν έχει λύση: ' + str(res.get('message')))
        sec.update(secure=False, cost_security=None, binding=[], unsecured=[], worst_after=None)
    else:
        k1 = int(np.argmax(w))
        sec['worst_after'] = {'outage': case.br_name[out[k1]], 'branch': case.br_name[bw[k1]], 'loading': float(w[k1])}
        sec['secure'] = bool(w[k1] <= 1 + margin)
        sec['cost_security'] = float(res['cost'] - base['cost'])
        mu = np.array(res.pop('mu_extra', None) or [])
        sl = np.array(res.pop('x_extra', None) or [])
        m = len(pairs)
        mu = (mu[:m] + mu[m:]) if m else mu
        scale = max(1e-6, float(np.median(np.abs([b['lmp'] for b in res['buses'].values()]))))
        Pfn = np.array([q['Pa'] for q in res['branches']]) / net.S_base
        ld = lambda l, k: float(abs(Pfn[l] + Lz[l, k] * Pfn[k]) / (emergency * rate[l]))      # noqa: E731
        sec['binding'] = sorted(({'branch': case.br_name[l], 'outage': case.br_name[k], 'mu': float(x), 'loading': ld(l, k)}
                                 for (l, k), x in zip(pairs, mu) if x > 1e-4 * scale), key=lambda q: -q['mu'])
        sec['unsecured'] = sorted(({'branch': case.br_name[l], 'outage': case.br_name[k], 'overload': float(x * net.S_base), 'loading': ld(l, k)}
                                   for (l, k), x in zip(pairs, sl) if x > 1e-6 and ld(l, k) > 1 + margin), key=lambda q: -q['overload'])
        sec['penalty'] = float(penalty)
        if not sec['secure']:
            res['message'] = (f"{len(sec['unsecured'])} ζεύγη κλάδου και διαταραχής μένουν πάνω από το όριο: καμία κατανομή δεν τα καλύπτει" if sec['unsecured']
                              else f'μετά από {rounds} γύρους μένουν διαταραχές με υπερφόρτιση (max_rounds)')
    res.pop('x_extra', None)
    res['security'] = sec
    res['kind'] = 'scopf'
    res['notes'] = list(res.get('notes') or []) + ([f'{len(bridge)} διαταραχές χωρίζουν το δίκτυο και δεν μπαίνουν στον έλεγχο ασφάλειας'] if len(bridge) else [])
    if check and Pf is not None:
        sec['ac'] = _ac(net, res)
    res['time'] = time.perf_counter() - t0
    return res


def _ac(net, res):
    """The AC load flow of the secure dispatch: what the linear model does not see (losses, voltages, reactive power)."""
    from . import netfile
    edits = [{'op': 'gen', 'name': s['name'], 'P_MW': s['P'] / 1e6} for s in res['sources']]
    try:
        net2, _ = netfile.apply(net, edits)
        r = net2.power_flow()
    except Exception as e:                                    # the check must not take the result with it
        return {'converged': False, 'message': str(e)}
    if not r['converged']:
        return {'converged': False, 'message': 'η ροή φορτίου AC της κατανομής δεν συνέκλινε'}
    V = [d['V'] for d in r['buses'].values()]
    case = net2.case()
    rate = {case.br_name[k]: case.rate[k] * net.S_base for k in range(case.nl) if np.isfinite(case.rate[k]) and case.rate[k] > 0}
    over = [(q['name'], max(abs(complex(q['Pa'], q['Qa'])), abs(complex(q['Pb'], q['Qb']))) / rate[q['name']]) for q in r['branches'] if q['name'] in rate]
    worst = max(over, key=lambda q: q[1]) if over else (None, 0.0)
    return {'converged': True, 'losses': float(r['losses']), 'Vmin': float(min(V)), 'Vmax': float(max(V)), 'overloads': int(sum(x > 1 + 1e-6 for _, x in over)),
            'worst_branch': worst[0], 'worst_loading': float(worst[1])}


__all__ = ['solve', 'screen', 'ScopfError']
