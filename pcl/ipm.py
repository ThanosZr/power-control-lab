"""A primal–dual interior-point solver on sparse matrices for nonlinear programs (4.19.1, ROADMAP §68 point 4):

    minimise f(x)   subject to   g(x) = 0,   h(x) ≤ 0,   l ≤ A·x ≤ u,   xmin ≤ x ≤ xmax

It is the kernel of the optimal power flow of pcl.opf (DC and AC), and it is general: any problem given by its
functions and their first and second derivatives can be solved with it from code.

The method (THEORY §8Η): slacks z > 0 turn the inequalities into h(x) + z = 0, a logarithmic barrier −γ·Σ ln z keeps them
positive, and Newton's method is applied to the first-order conditions of the barrier problem. Each iteration solves one
sparse symmetric system for the step of x and of the multipliers λ of the equalities,

    [ M   G_xᵀ ] [Δx]   [−N]        M = L_xx + H_xᵀ·diag(μ/z)·H_x
    [ G_x  0   ] [Δλ] = [−g],       N = L_x + H_xᵀ·((μ∘h + γ)/z)

then Δz = −h − z − H_x·Δx and Δμ = −μ + (γ − μ∘Δz)/z, with separate primal and dual step lengths that keep z and μ
positive (ξ = 0,99995), and γ = σ·zᵀμ/n_i (σ = 0,1) for the next iteration. It stops when the feasibility, the gradient
of the Lagrangian, the complementarity and the change of the cost are all under their tolerances.

This is the primal–dual interior-point method as described for the optimal power flow by Wang, Murillo-Sánchez,
Zimmerman & Thomas (IEEE Trans. Power Systems 22(3), 2007, §III-B) and in the manual of MATPOWER (its solver MIPS),
written here from the equations.
"""
import time

import numpy as np
from scipy import sparse as sp
from scipy.sparse.linalg import splu


class IpmError(ValueError):
    pass


def ipm(f, x0, gh=None, hess=None, A=None, l=None, u=None, xmin=None, xmax=None, tol=1e-6, max_iter=150, cost_mult=1.0,
        xi=0.99995, sigma=0.1, z0=1.0, record=False, step_control='auto'):
    """f(x) → (value, gradient); gh(x) → (g, G, h, H): the nonlinear equalities and inequalities with their Jacobians (rows =
    constraints; None when there are none); hess(x, lam, mu, cost_mult) → the Hessian of cost_mult·f + lamᵀ·g + muᵀ·h (for a
    problem without gh: of cost_mult·f, or None for a linear cost). A, l, u: linear constraints (a row with l = u is an
    equality; ±inf for a missing side); xmin, xmax: bounds (equal bounds fix the variable).
    step_control: False = the steps as the method gives them (enough for the optimal power flow and for convex problems);
    True = a line search on a merit function (the barrier cost plus a penalty on the violation of the constraints) cuts a
    step that would leave the feasible region far behind; 'auto' = first without and, if that fails, again with it (the
    result then says so in 'message'). There is no further globalization: on a strongly non-convex problem from a poor
    start the iteration can still fail, and the result says so (converged False, with the reason).

    Returns {'x', 'f', 'converged', 'iterations', 'message', 'lam': {'g', 'A_eq', 'x_eq'}, 'mu': {'h', 'A_u', 'A_l', 'x_u',
    'x_l'} (multipliers of the original problem, ≥ 0 for the inequalities), 'cond': the four measures at the end, 'time',
    'history' (with record)}."""
    if step_control == 'auto':
        r = ipm(f, x0, gh, hess, A, l, u, xmin, xmax, tol, max_iter, cost_mult, xi, sigma, z0, record, False)
        if not r['converged']:
            r2 = ipm(f, x0, gh, hess, A, l, u, xmin, xmax, tol, max_iter, cost_mult, xi, sigma, z0, record, True)
            if r2['converged']:
                r2['message'] += ' (with step control, after full steps failed)'
                r2['time'] += r['time']
                return r2
        return r
    t0 = time.perf_counter()
    x = np.array(x0, float)
    nx = len(x)
    xmin = np.full(nx, -np.inf) if xmin is None else np.asarray(xmin, float)
    xmax = np.full(nx, np.inf) if xmax is None else np.asarray(xmax, float)
    if A is not None and A.shape[0]:
        A = sp.csr_matrix(A)
        l = np.full(A.shape[0], -np.inf) if l is None else np.asarray(l, float)
        u = np.full(A.shape[0], np.inf) if u is None else np.asarray(u, float)
    else:
        A, l, u = sp.csr_matrix((0, nx)), np.zeros(0), np.zeros(0)
    eye = sp.identity(nx, format='csr')
    # the linear part: equalities (rows with l = u, fixed variables) and one-sided inequalities
    def split(lo, hi):
        both = np.isfinite(lo) & np.isfinite(hi)
        eq = both & (np.abs(hi - lo) <= 1e-12 * (1 + np.abs(np.where(both, hi, 0.0))))
        return np.flatnonzero(eq), np.flatnonzero(~eq & np.isfinite(hi)), np.flatnonzero(~eq & np.isfinite(lo))
    if np.any(l > u) or np.any(xmin > xmax):
        raise IpmError('a lower limit above its upper limit')
    ae, au, al = split(l, u)
    xe, xu, xl = split(xmin, xmax)
    Ae = sp.vstack([A[ae], eye[xe]], format='csr')
    be = np.r_[u[ae], xmax[xe]]
    Ai = sp.vstack([A[au], -A[al], eye[xu], -eye[xl]], format='csr')
    bi = np.r_[u[au], -l[al], xmax[xu], -xmin[xl]]
    x[xe] = xmax[xe]

    def cons(x):
        if gh is None:
            gn, Gn, hn, Hn = np.zeros(0), sp.csr_matrix((0, nx)), np.zeros(0), sp.csr_matrix((0, nx))
        else:
            gn, Gn, hn, Hn = gh(x)
            gn = np.zeros(0) if gn is None else gn
            hn = np.zeros(0) if hn is None else hn
            Gn = sp.csr_matrix((0, nx)) if Gn is None else sp.csr_matrix(Gn)
            Hn = sp.csr_matrix((0, nx)) if Hn is None else sp.csr_matrix(Hn)
        return (np.r_[gn, Ae @ x - be], sp.vstack([Gn, Ae], format='csr'), np.r_[hn, Ai @ x - bi], sp.vstack([Hn, Ai], format='csr'), len(gn), len(hn))

    fv, df = f(x)
    fv, df = fv * cost_mult, np.asarray(df, float) * cost_mult
    g, G, h, H, ngn, nhn = cons(x)
    neq, niq = len(g), len(h)
    gamma, nu = 1.0, 1.0
    lam = np.zeros(neq)
    z = np.full(niq, z0)
    mu = np.full(niq, z0)
    k = h < -z0
    z[k] = -h[k]
    k = gamma / z > z0
    mu[k] = gamma / z[k]

    def conds(fv, f_old, df, g, h, G, H, x, z, lam, mu):
        Lx = df + G.T @ lam + H.T @ mu
        maxh = np.max(h, initial=-np.inf) if niq else -np.inf
        feas = max(np.max(np.abs(g), initial=0.0), maxh if np.isfinite(maxh) else 0.0, 0.0) / (1 + max(np.max(np.abs(x), initial=0.0), np.max(np.abs(z), initial=0.0)))
        grad = np.max(np.abs(Lx), initial=0.0) / (1 + max(np.max(np.abs(lam), initial=0.0), np.max(np.abs(mu), initial=0.0)))
        comp = (z @ mu) / (1 + np.max(np.abs(x), initial=0.0)) if niq else 0.0
        cost = abs(fv - f_old) / (1 + abs(f_old))
        return Lx, (feas, grad, comp, cost)

    Lx, c = conds(fv, fv, df, g, h, G, H, x, z, lam, mu)
    hist = [{'it': 0, 'f': fv / cost_mult, 'feas': c[0], 'grad': c[1], 'comp': c[2], 'cost': c[3], 'gamma': gamma, 'alpha_p': 0.0, 'alpha_d': 0.0}] if record else None
    it, ok, msg = 0, False, ''
    zero = sp.csr_matrix((neq, neq))
    if c[0] < tol and c[1] < tol and c[2] < tol and c[3] < tol:
        ok, msg = True, 'converged at the start'
    while not ok and it < max_iter:
        it += 1
        if hess is not None:
            Lxx = hess(x, lam[:ngn], mu[:nhn], cost_mult)
            Lxx = sp.csr_matrix((nx, nx)) if Lxx is None else sp.csr_matrix(Lxx)
        else:
            Lxx = sp.csr_matrix((nx, nx))
        Hz = H.T.tocsr() @ sp.diags(mu / z) if niq else sp.csr_matrix((nx, 0))
        M = Lxx + (Hz @ H if niq else sp.csr_matrix((nx, nx)))
        Nv = Lx + (H.T @ ((mu * h + gamma) / z) if niq else 0.0)
        K = sp.bmat([[M, G.T], [G, zero]], format='csc') if neq else M.tocsc()
        try:
            sol = splu(K).solve(np.r_[-Nv, -g])
        except RuntimeError:
            msg = 'the system of the step is singular'
            break
        if not np.all(np.isfinite(sol)):
            msg = 'the step is not finite'
            break
        dx, dlam = sol[:nx], sol[nx:]
        dz = -h - z - H @ dx
        dmu = -mu + (gamma - mu * dz) / z
        k = dz < 0
        ap = min(xi * np.min(z[k] / -dz[k]), 1.0) if k.any() else 1.0
        k = dmu < 0
        ad = min(xi * np.min(mu[k] / -dmu[k]), 1.0) if k.any() else 1.0
        if step_control:
            # a line search on a merit function: the barrier cost plus ν times the violation of the constraints (ν above the
            # multipliers). The primal step is halved until the merit function decreases enough (Armijo), so a step that would
            # throw the iterate far out of the feasible region is cut instead of taken
            nu = max(nu, 1.5 * max(np.max(np.abs(lam + dlam), initial=0.0), np.max(np.abs(mu + dmu), initial=0.0)), 1.0)
            viol = np.sum(np.abs(g)) + np.sum(np.abs(h + z))
            phi0 = fv - gamma * np.sum(np.log(z)) + nu * viol
            D = df @ dx - gamma * np.sum(dz / z) - nu * viol
            for _ in range(30):
                x1, z1 = x + ap * dx, z + ap * dz
                f1, _ = f(x1)
                g1, _, h1, _, _, _ = cons(x1)
                phi1 = f1 * cost_mult - gamma * np.sum(np.log(z1)) + nu * (np.sum(np.abs(g1)) + np.sum(np.abs(h1 + z1)))
                if np.isfinite(phi1) and phi1 <= phi0 + 1e-4 * ap * min(D, 0.0):
                    break
                ap /= 2
        x = x + ap * dx
        z = z + ap * dz
        lam = lam + ad * dlam
        mu = mu + ad * dmu
        if niq:
            gamma = sigma * (z @ mu) / niq
        f_old = fv
        fv, df = f(x)
        fv, df = fv * cost_mult, np.asarray(df, float) * cost_mult
        g, G, h, H, ngn, nhn = cons(x)
        Lx, c = conds(fv, f_old, df, g, h, G, H, x, z, lam, mu)
        if record:
            hist.append({'it': it, 'f': fv / cost_mult, 'feas': c[0], 'grad': c[1], 'comp': c[2], 'cost': c[3], 'gamma': gamma, 'alpha_p': ap, 'alpha_d': ad})
        if c[0] < tol and c[1] < tol and c[2] < tol and c[3] < tol:
            ok, msg = True, 'converged'
        elif not np.all(np.isfinite(x)) or ap < 1e-10 or ad < 1e-10 or gamma < np.finfo(float).eps ** 1.5 or gamma > 1 / np.finfo(float).eps:
            msg = 'numerically failed (a step length or the barrier parameter out of range)'
            break
    if not ok and not msg:
        msg = f'no convergence in {max_iter} iterations'
    lam, mu = lam / cost_mult, mu / cost_mult
    na_e, na_u, na_l, nx_u = len(ae), len(au), len(al), len(xu)
    mA_u, mA_l = np.zeros(A.shape[0]), np.zeros(A.shape[0])
    mA_u[au], mA_l[al] = mu[nhn:nhn + na_u], mu[nhn + na_u:nhn + na_u + na_l]
    mx_u, mx_l = np.zeros(nx), np.zeros(nx)
    o = nhn + na_u + na_l
    mx_u[xu], mx_l[xl] = mu[o:o + nx_u], mu[o + nx_u:]
    lA, lx = np.zeros(A.shape[0]), np.zeros(nx)
    lA[ae], lx[xe] = lam[ngn:ngn + na_e], lam[ngn + na_e:]
    return {'x': x, 'f': fv / cost_mult, 'converged': ok, 'iterations': it, 'message': msg,
            'lam': {'g': lam[:ngn], 'A_eq': lA, 'x_eq': lx}, 'mu': {'h': mu[:nhn], 'A_u': mA_u, 'A_l': mA_l, 'x_u': mx_u, 'x_l': mx_l},
            'cond': {'feasibility': c[0], 'gradient': c[1], 'complementarity': c[2], 'cost': c[3]}, 'time': time.perf_counter() - t0, 'history': hist}


__all__ = ['ipm', 'IpmError']
