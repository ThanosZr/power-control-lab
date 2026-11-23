"""Array backends of the steady-state batches (4.19.2, ROADMAP §68 point 5, THEORY §8Θ).

The batches of pcl.powerflow (batch, contingency_ac) are written with matrix operations only. What runs them:

  cpu    NumPy and SciPy: the reference. The numbers of 4.19.1, bit for bit.
  gpu*   CuPy on a CUDA device, in double precision: the same algorithm, with the arrays on the device.

  * EXPERIMENTAL. There is no GPU in the CI of the project, so this path is not covered by the tests: it is checked only
    by `python -m pcl accel` on a machine that has a card (the script compares every solution with that of the CPU).
    A missing or failing GPU never stops a study: the choice falls back to the CPU and says why (Backend.why).

CuPy is optional (it is not in requirements.txt):  pip install "cupy-cuda12x[ctk]"   (Windows and Linux; [ctk] brings the
CUDA libraries and headers with it: without them a machine with no CUDA Toolkit answers «Failed to find CUDA headers»).

The solve of many right-hand sides with the factors of one Jacobian, in three ways (`how`):

  lu       the triangular solves of the factors: SuperLU on the CPU, cuSPARSE on the GPU (from the same factors)
  inv      the explicit inverse (dense N × N, computed once with the factors on the CPU) and one matrix product
  levels   the triangular solves level by level, every level one sparse product (the rows of a level do not depend on
           each other: Wang, Wende-von Berg, Braun 2021, §4.3)

All three run on both backends, so `inv` and `levels` are tested on the CPU against `lu`.
"""
import json
import os
from pathlib import Path

import numpy as np
from scipy import sparse as sp

EXPERIMENTAL = ('* πειραματικό: ο δρόμος GPU δεν ελέγχεται στον CI του έργου· ελέγχεται μόνο με το `python -m pcl accel` '
                'σε μηχάνημα με κάρτα')
HOW = ('lu', 'inv', 'levels')
INV_MAX = 6000            # unknowns up to which the explicit inverse is proposed on a GPU (N² doubles: 290 MB at 6000)
GAIN = 1.2                # the GPU is chosen by «auto» only where it was measured at least this much faster
FILE = 'accel.json'       # the measurement of this machine (written by `python -m pcl accel --save`)


class BackendError(Exception):
    pass


def home():
    return Path(os.environ.get('PCL_HOME') or (Path.home() / '.pcl'))


class Backend:
    """One place for the arrays (name 'cpu' or 'gpu'): xp is the array module, sp the sparse one, info what was found on
    the machine, why the reason of the choice (Greek, shown to the user)."""

    def __init__(self, name, xp, spm, info=None, why=''):
        self.name, self.xp, self.sp, self.info, self.why = name, xp, spm, info or {}, why

    @property
    def gpu(self):
        return self.name == 'gpu'

    @property
    def label(self):
        return 'GPU*' if self.gpu else 'CPU'

    def asarray(self, a):
        return a if self.xp is np else self.xp.asarray(a)

    def numpy(self, a):
        return a if self.xp is np else self.xp.asnumpy(a)

    def csr(self, A):
        return A if self.xp is np else self.sp.csr_matrix(A)

    def chunk(self, N, B):
        """Scenarios per block. CPU: blocks that stay in the cache (measured in 4.19.1). GPU: what fits in a fifth of the
        free memory of the device (about 40 arrays of N doubles per scenario: the voltages, the mismatch and the steps
        of the Broyden memory)."""
        if not self.gpu:
            return int(np.clip(8e4 // max(1, N), 16, 2048))
        free = self.info.get('free') or 2e9
        return int(np.clip(0.2 * free // (40 * 8 * max(1, N)), 64, max(64, B)))

    def how(self, N):
        """The proposed solve for N unknowns: on the CPU the factors; on the GPU what the measurement of this machine
        found best for the nearest size, otherwise the inverse up to INV_MAX unknowns and the factors above."""
        if not self.gpu:
            return 'lu'
        rows = [r for r in (measurement() or {}).get('rows', []) if r.get('how') in HOW]
        if rows:
            return min(rows, key=lambda r: abs(np.log(max(1, r['N']) / max(1, N))))['how']
        return 'inv' if N <= INV_MAX else 'lu'

    def solver(self, lu, how=None):
        """R → J⁻¹·R on this backend, for one or many right-hand sides. lu: the factors as pcl.powerflow keeps them
        (lu.lu the SuperLU object of SciPy, lu.q the column order applied before the factorization, or None)."""
        how = how or self.how(lu.lu.shape[0])
        if how not in HOW:
            raise BackendError(f'how: {HOW}')
        xp = self.xp
        if how == 'lu':
            if xp is np:
                return lu.solve
            from cupyx.scipy.sparse.linalg import SuperLU                       # the same factors, the solves on the device
            g, q = SuperLU(lu.lu), (None if lu.q is None else xp.asarray(lu.q))

            def f(R):
                x = g.solve(xp.asfortranarray(R))
                if q is None:
                    return x
                out = xp.empty_like(x)
                out[q] = x
                return out
            return f
        if how == 'inv':
            Ji = self.asarray(lu.solve(np.eye(lu.lu.shape[0])))
            return lambda R: Ji @ R
        return _levels(self, lu)


def _levels(bk, lu):
    """The two triangular solves of P_r·A·P_c = L·U level by level. The level of a row is one more than the largest level
    of the rows it needs, so all the rows of a level are solved together: one sparse product with what is known and one
    division by the diagonal."""
    xp, s = bk.xp, lu.lu
    n = s.shape[0]

    def plan(T, lower):
        d = np.asarray(T.diagonal())
        S = (T - sp.diags(d)).tocsr()
        S.eliminate_zeros()
        lev = np.zeros(n, int)
        for i in (range(n) if lower else range(n - 1, -1, -1)):
            dep = S.indices[S.indptr[i]:S.indptr[i + 1]]
            if len(dep):
                lev[i] = lev[dep].max() + 1
        out = []
        for k in range(int(lev.max()) + 1 if n else 0):
            rows = np.flatnonzero(lev == k)
            out.append((bk.asarray(rows), bk.csr(S[rows].tocsr()) if k else None, bk.asarray(d[rows][:, None])))
        return out
    PL, PU = plan(s.L.tocsr(), True), plan(s.U.tocsr(), False)
    pr, pc = bk.asarray(s.perm_r), bk.asarray(s.perm_c)
    q = None if lu.q is None else bk.asarray(lu.q)

    def tri(P, c):
        y = xp.zeros_like(c)
        for rows, S, d in P:
            y[rows] = (c[rows] if S is None else c[rows] - S @ y) / d
        return y

    def f(R):
        one = R.ndim == 1
        c = xp.empty_like(R[:, None] if one else R)
        c[pr] = R[:, None] if one else R                     # P_r·b
        z = tri(PU, tri(PL, c))[pc]                          # P_c·U⁻¹·L⁻¹·P_r·b
        if q is not None:
            out = xp.empty_like(z)
            out[q] = z
            z = out
        return z[:, 0] if one else z
    f.levels = (len(PL), len(PU))
    return f


# ------------------------------------------------------------------------------------------------ what there is
_CPU = Backend('cpu', np, sp, {}, 'CPU (NumPy και SciPy)')
_GPU = {}                 # 'bk': the backend once it was found, 'info': what the probe saw


def cpu(why=None):
    return _CPU if why is None else Backend('cpu', np, sp, {}, why)


def probe(fresh=False):
    """What there is on this machine: {'cupy', 'device', 'memory', 'free', 'capability', 'cuda', 'reason'}. reason: why
    there is no GPU backend (Greek), or None when a small computation in double precision ran on the device. Every call of
    CuPy is inside the try: whatever fails becomes the reason, never an exception of a study."""
    if 'info' in _GPU and not fresh:
        return _GPU['info']
    out = {'cupy': None, 'device': None, 'memory': None, 'free': None, 'capability': None, 'cuda': None, 'reason': None}
    _GPU.pop('bk', None)
    try:
        import cupy
        out['cupy'] = getattr(cupy, '__version__', '?')
    except Exception as e:
        out['reason'] = f'το CuPy δεν είναι εγκατεστημένο (pip install "cupy-cuda12x[ctk]"): {type(e).__name__}'
        _GPU['info'] = out
        return out
    try:
        rt = cupy.cuda.runtime
        if rt.getDeviceCount() < 1:
            raise BackendError('δεν βρέθηκε συσκευή CUDA')
        pr = rt.getDeviceProperties(0)
        nm = pr.get('name', b'?')
        out['device'] = nm.decode(errors='replace') if isinstance(nm, bytes) else str(nm)
        out['capability'] = f"{pr.get('major', '?')}.{pr.get('minor', '?')}"
        out['free'], out['memory'] = (int(v) for v in cupy.cuda.Device(0).mem_info)
        try:
            out['cuda'] = int(rt.runtimeGetVersion())
        except Exception:
            pass
        import cupyx.scipy.sparse as csp
        a = cupy.arange(8, dtype=cupy.float64)                                   # a card that the installed CUDA does not
        A = csp.csr_matrix(sp.identity(8, format='csr', dtype=complex))          # support fails here, not inside a study
        if float(cupy.asnumpy(a @ a)) != 140.0 or complex(cupy.asnumpy((A @ a.astype(complex)).sum())) != 28:
            raise BackendError('λάθος αποτέλεσμα σε διπλή ακρίβεια')
        _GPU['bk'] = Backend('gpu', cupy, csp, out, f"GPU* ({out['device']})")
    except Exception as e:
        out['reason'] = f'η κάρτα δεν απάντησε ({type(e).__name__}: {str(e)[:160]})'
    _GPU['info'] = out
    return out


def gpu():
    """The GPU backend, or BackendError with the reason."""
    info = probe()
    if 'bk' not in _GPU:
        raise BackendError(info['reason'] or 'δεν υπάρχει GPU')
    return _GPU['bk']


def status():
    """5.0.10 (decision 386): what the page shows beside «Engine»: the fields of probe() (the card, or the reason there is none),
    and gpu (True when a computation in double precision ran on it), measured (a measurement of this machine exists, from
    `python -m pcl accel --save`) and work (its threshold of unknowns × scenarios from which «auto» chooses the GPU*, or None)."""
    info = dict(probe())
    m = measurement()
    info.update(gpu=info.get('reason') is None, measured=bool(m), work=(m or {}).get('work'))
    return info


def measurement():
    """The measurement of this machine (the file that `python -m pcl accel --save` writes), or None."""
    try:
        d = json.loads((home() / FILE).read_text(encoding='utf-8'))
        return d if isinstance(d, dict) and d.get('format') == 'pcl-accel' else None
    except Exception:
        return None


def rule(rows):
    """From the rows of a measurement ({'N', 'B', 'cpu', 'gpu'}: seconds of the same batch on the two backends) the
    smallest work N·B from which the GPU was at least GAIN times faster in every measured case, or None."""
    rows = sorted((r for r in rows if r.get('cpu') and r.get('gpu')), key=lambda r: r['N'] * r['B'])
    work = None
    for i, r in enumerate(rows):
        if all(q['cpu'] >= GAIN * q['gpu'] for q in rows[i:]):
            work = r['N'] * r['B']
            break
    return work


def choose(want='auto', N=0, B=1):
    """The backend of a batch of B scenarios with N unknowns. want: 'cpu', 'gpu' (falls back to the CPU with the reason
    when there is none) or 'auto': the GPU only where the measurement of this machine found it faster (N·B at least the
    measured threshold); without a measurement the CPU."""
    if want in (None, 'cpu'):
        return cpu()
    if want not in ('auto', 'gpu'):
        raise BackendError("backend: 'auto', 'cpu' ή 'gpu'")
    if want == 'gpu':
        try:
            return gpu()
        except BackendError as e:
            return cpu(f'CPU, γιατί {e}')
    m = measurement()
    if not m:
        return cpu('CPU· η GPU* δεν έχει μετρηθεί σε αυτό το μηχάνημα (python -m pcl accel --save)')
    work = m.get('work')
    if not work:
        return cpu('CPU· στη μέτρηση αυτού του μηχανήματος η GPU* δεν ήταν ταχύτερη')
    if N * B < work:
        return cpu(f'CPU· η GPU* κερδίζει από {work:.3g} αγνώστους × σενάρια (μέτρηση), εδώ {N * B:.3g}')
    try:
        g = gpu()
    except BackendError as e:
        return cpu(f'CPU, γιατί {e}')
    return Backend('gpu', g.xp, g.sp, g.info, f"GPU* ({g.info.get('device')})· {N * B:.3g} άγνωστοι × σενάρια, πάνω από το όριο "
                                              f'{work:.3g} της μέτρησης')


__all__ = ['Backend', 'BackendError', 'EXPERIMENTAL', 'HOW', 'INV_MAX', 'GAIN', 'cpu', 'gpu', 'probe', 'choose', 'measurement',
           'rule', 'home']
