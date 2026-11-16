"""A neural network as the starting point of a solver (4.19.2, ROADMAP §68 point 5, THEORY §8Θ).

The principle of §68: the approximation proposes, the solver verifies. A small feed-forward network per network and study
maps a change of the loads to the solution of the study, and its output is only where the solver starts from:

  study 'opf'   the AC optimal power flow: the point (θ, |V|, P_g, Q_g) of pcl.opf. The interior-point solver starts
                from it with a small barrier parameter (pcl.ipm, warm). Measured on seven networks: about half the
                iterations when the proposal is within one per cent.
  study 'pf'    the load flow of a scenario: the voltages. The batch of pcl.powerflow starts each scenario from them.

A proposal is used only where it is better than the normal start (smaller power mismatch), and a solve that does not
converge from it is done again from the normal start: the answer is the same within the tolerance, and a bad network costs
time only. A model belongs to one network (its fingerprint): on another network, or for a change of the injections at buses
without load, it is not used and the result says why.

The training data are our own solutions (dataset): load factors of P and of Q, independent per bus, uniform within
± spread. Training is plain NumPy in double precision (fit: Adam on mini-batches, the best weights on the validation
part). The model is saved as an ONNX file (pcl.onnxio) with its facts in the metadata; a network trained elsewhere on the
same data and exported to ONNX is loaded with Model.load(path, net, study).
"""
import hashlib
import json
import time
from pathlib import Path

import numpy as np

from . import backend as BK
from . import onnxio as OX
from . import opf as OPF
from . import powerflow as PF

FORMAT, KEY = 'pcl-start', 'pcl-start'
MAX_IT = 60               # iterations per scenario of the training data: a scenario without optimum (a limit that cannot hold) is left out sooner
STUDIES = ('opf', 'pf')


class StartError(ValueError):
    pass


def layout(net, case, study):
    """(buses whose constant-power load is an input, number of sources, number of outputs)."""
    if study not in STUDIES:
        raise StartError(f'study: {STUDIES}')
    ib = np.flatnonzero(np.abs(case.load[:, 2]) > 0)
    ng = int(OPF.sources(net, case)['n']) if study == 'opf' else 0
    return ib, ng, 2 * case.n + 2 * ng


def fingerprint(net, case, study):
    """What a model was trained for: the topology, the admittances, the base loads and set-points and, for the optimal power
    flow, the costs and the limits. Rounded to nine digits, so that it does not depend on the last bits."""
    h = hashlib.sha256(study.encode())

    def add(a):
        a = np.nan_to_num(np.asarray(a), posinf=1e30, neginf=-1e30)
        h.update(np.ascontiguousarray(np.round(a.astype(complex if np.iscomplexobj(a) else float), 9)).tobytes())
    Y = case.Y.tocoo()
    o = np.lexsort((Y.col, Y.row))
    for a in (case.f, case.t, case.typ, Y.row[o], Y.col[o]):
        h.update(np.asarray(a, np.int64).tobytes())
    for a in (Y.data[o], case.load, case.Sg, case.Vset):
        add(a)
    if study == 'opf':
        G = OPF.sources(net, case)
        lo, hi, _ = OPF.vlimits(net, case)
        for a in (G['bus'], G['cost'], G['Pmin'], G['Pmax'], G['Qmin'], G['Qmax'], case.rate, lo, hi):
            add(a)
    return h.hexdigest()[:16]


def features(ib, d):
    """The inputs of a model: the change of the net injection at the load buses, real and imaginary parts (pu). d: B × n."""
    d = np.atleast_2d(d)
    return np.hstack([d[:, ib].real, d[:, ib].imag])


class Model:
    """An ONNX graph (pcl.onnxio) and its facts: {'format', 'version', 'study', 'network', 'fingerprint', 'buses', 'inputs',
    'outputs', 'spread', 'samples', 'error', 'gain', 'foreign'}."""

    def __init__(self, graph, meta):
        self.graph, self.meta = graph, dict(meta)

    @property
    def study(self):
        return self.meta.get('study')

    def predict(self, X):
        y = OX.run(self.graph, np.atleast_2d(np.asarray(X, float)))
        return np.asarray(y[self.graph['outputs'][0][0]], float)

    def save(self, path):
        g = dict(self.graph)
        g['meta'] = {**(self.graph.get('meta') or {}), KEY: json.dumps(self.meta, ensure_ascii=False)}
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        return OX.write(path, g)

    @classmethod
    def load(cls, path, net=None, study=None):
        """A model of this module, or (with net and study) a network trained elsewhere: inputs as features(), outputs the
        point of the study, both in the units of the solver (pu, rad) with any scaling inside the graph."""
        g = OX.read(path)
        raw = (g.get('meta') or {}).get(KEY)
        if raw:
            try:
                meta = json.loads(raw)
            except ValueError:
                raise StartError('the facts of the model are not readable') from None
            if meta.get('format') != FORMAT:
                raise StartError('not a start model of this application')
            return cls(g, meta)
        if net is None or study is None:
            raise StartError('a model without facts: give the network and the study it was trained for')
        case = net.case()
        ib, ng, nout = layout(net, case, study)
        m = cls(g, {'format': FORMAT, 'version': 1, 'study': study, 'network': net.name, 'fingerprint': fingerprint(net, case, study),
                    'buses': int(case.n), 'inputs': int(2 * len(ib)), 'outputs': int(nout), 'foreign': True})
        try:
            y = m.predict(np.zeros((1, 2 * len(ib))))
        except Exception as e:                                                   # noqa: BLE001 (whatever the foreign graph does)
            raise StartError(f'the model does not accept {2 * len(ib)} inputs ({type(e).__name__}: {str(e)[:100]})') from None
        if y.shape != (1, nout):
            raise StartError(f'the model gives {y.shape[-1]} outputs; the study {study} of this network has {nout}')
        return m

    def applies(self, net, case, study):
        """None, or the reason (Greek) why this model is not for this study of this network."""
        if self.study != study:
            return f"το μοντέλο είναι για τη μελέτη «{self.study}», όχι «{study}»"
        if self.meta.get('fingerprint') != fingerprint(net, case, study):
            return 'το μοντέλο εκπαιδεύτηκε για άλλο δίκτυο ή για άλλα δεδομένα αυτού του δικτύου (αποτύπωμα)'
        return None


# ------------------------------------------------------------------------------------------------ data and training
def dataset(net, study='opf', samples=400, spread=0.2, seed=0, progress=None):
    """Our own solutions as training data. Returns (X, Y, facts): X the inputs (features), Y the point of the study per solved
    scenario (opf: θ, |V|, P_g, Q_g; pf: θ, |V|; rad and pu), facts {'ib', 'ng', 'solved', 'time', 'base' (the base point)}."""
    t0 = time.perf_counter()
    case = net.case()
    ib, ng, nout = layout(net, case, study)
    if not len(ib):
        raise StartError('the network has no constant-power load to vary')
    rng = np.random.default_rng(seed)
    S = case.load[ib, 2]
    kP, kQ = rng.uniform(1 - spread, 1 + spread, (samples, len(ib))), rng.uniform(1 - spread, 1 + spread, (samples, len(ib)))
    d = np.zeros((samples, case.n), complex)
    d[:, ib] = -((kP - 1) * S.real + 1j * (kQ - 1) * S.imag)
    if study == 'pf':
        r = PF.batch(case, d, tol=1e-9)
        ok = r['converged']
        Y = np.hstack([np.angle(r['V'][ok]), np.abs(r['V'][ok])])
        base = None
    else:
        b0 = OPF.solve(net, 'ac')
        if not b0['converged']:
            raise StartError(f"the base case has no optimum: {b0['message']}")
        base = b0['_raw']['x']
        rows, ok = [], np.zeros(samples, bool)
        for b in range(samples):
            r = OPF.solve(net, 'ac', dS=d[b] * net.S_base, start={'x': base}, max_iter=MAX_IT)   # from the base optimum; the solver verifies
            ok[b] = r['converged']
            if ok[b]:
                rows.append(r['_raw']['x'])
            if progress and (b + 1) % 50 == 0:
                progress(f'{b + 1}/{samples}')
        Y = np.array(rows).reshape(-1, nout)
    return features(ib, d[ok]), Y, {'ib': ib, 'ng': ng, 'solved': int(ok.sum()), 'time': time.perf_counter() - t0, 'base': base, 'd': d[ok]}


def fit(X, Y, hidden=(64, 64), epochs=400, batch=32, lr=3e-3, seed=0, val=0.15):
    """A feed-forward network (tanh) from X to Y on standardized data: Adam on mini-batches, the learning rate falling to a
    tenth, the weights kept where the error on the validation part was smallest. Returns (W, b, (x_mean, x_scale, y_mean,
    y_scale), validation indices, loss on the validation part)."""
    X, Y = np.asarray(X, float), np.asarray(Y, float)
    B = len(X)
    if B < 20:
        raise StartError('too few solved scenarios to train on (20 at least)')
    rng = np.random.default_rng(seed)
    order = rng.permutation(B)
    nv = max(2, int(round(val * B)))
    iv, it = order[:nv], order[nv:]
    xm, ym = X[it].mean(0), Y[it].mean(0)
    xs, ys = X[it].std(0), Y[it].std(0)
    const = ys <= 1e-9                                                            # an output that never moves (the reference
    xs, ys = np.where(xs > 1e-12, xs, 1.0), np.where(const, 1.0, ys)              # angle, a voltage on its limit) is its mean:
    Xs, Ys = (X - xm) / xs, (Y - ym) / ys                                         # its scale in the model is zero
    sizes = [X.shape[1], *hidden, Y.shape[1]]
    W = [rng.standard_normal((a, c)) * np.sqrt(2.0 / (a + c)) for a, c in zip(sizes[:-1], sizes[1:])]
    b = [np.zeros(c) for c in sizes[1:]]
    P = W + b
    m, v = [np.zeros_like(p) for p in P], [np.zeros_like(p) for p in P]
    nl, step = len(W), 0

    def forward(x):
        hs = [x]
        for k in range(nl):
            a = hs[-1] @ W[k] + b[k]
            hs.append(np.tanh(a) if k < nl - 1 else a)
        return hs
    best, keep = np.inf, None
    steps = epochs * max(1, int(np.ceil(len(it) / batch)))
    for ep in range(epochs):
        p = rng.permutation(it)
        for s0 in range(0, len(p), batch):
            idx = p[s0:s0 + batch]
            hs = forward(Xs[idx])
            g = 2 * (hs[-1] - Ys[idx]) / hs[-1].size
            grads_W, grads_b = [None] * nl, [None] * nl
            for k in range(nl - 1, -1, -1):
                grads_W[k], grads_b[k] = hs[k].T @ g, g.sum(0)
                if k:
                    g = (g @ W[k].T) * (1 - hs[k] ** 2)
            step += 1
            a = lr * 0.1 ** (step / steps) * np.sqrt(1 - 0.999 ** step) / (1 - 0.9 ** step)
            for j, gr in enumerate(grads_W + grads_b):
                m[j] = 0.9 * m[j] + 0.1 * gr
                v[j] = 0.999 * v[j] + 0.001 * gr * gr
                P[j] -= a * m[j] / (np.sqrt(v[j]) + 1e-8)
        if ep % 5 == 4 or ep == epochs - 1:
            e = float(np.mean((forward(Xs[iv])[-1] - Ys[iv]) ** 2))
            if e < best:
                best, keep = e, ([w.copy() for w in W], [q.copy() for q in b])
    return keep[0], keep[1], (xm, xs, ym, np.where(const, 0.0, ys)), iv, best


def train(net, study='opf', samples=400, spread=0.2, hidden=(64, 64), epochs=400, seed=0, check=20, progress=None, name=None):
    """A model for one study of one network, trained on its own solutions. The facts of the model hold what was measured on
    the validation scenarios (never seen in training): 'error' (the largest and the rms error of the angles in rad, of the
    voltages and of the powers in pu) and 'gain' (for 'opf' on up to `check` of them: the mean iterations from the normal start
    and from the proposal, and how many proposals the solver accepted)."""
    t0 = time.perf_counter()
    X, Y, f = dataset(net, study, samples, spread, seed, progress)
    W, b, (xm, xs, ym, ys), iv, _ = fit(X, Y, hidden, epochs, seed=seed)
    case = net.case()
    n, ng = case.n, f['ng']
    meta = {'format': FORMAT, 'version': 1, 'study': study, 'network': name or net.name, 'fingerprint': fingerprint(net, case, study),
            'buses': int(n), 'sources': int(ng), 'inputs': int(X.shape[1]), 'outputs': int(Y.shape[1]), 'hidden': [int(h) for h in hidden],
            'spread': float(spread), 'samples': int(f['solved']), 'asked': int(samples), 'seed': int(seed), 'epochs': int(epochs)}
    model = Model(OX.mlp(W, b, xm, xs, ym, ys), meta)
    E = model.predict(X[iv]) - Y[iv]
    parts = {'angle': slice(0, n), 'V': slice(n, 2 * n)}
    if study == 'opf':
        parts.update(P=slice(2 * n, 2 * n + ng), Q=slice(2 * n + ng, 2 * n + 2 * ng))
    meta['error'] = {k: {'max': float(np.abs(E[:, s]).max()), 'rms': float(np.sqrt(np.mean(E[:, s] ** 2)))} for k, s in parts.items()}
    if study == 'opf' and check:
        cold, warm, used = [], [], 0
        for j in iv[:check]:
            dS = f['d'][j] * net.S_base
            r0 = OPF.solve(net, 'ac', dS=dS)
            st, _ = propose_opf(model, net, dS, case)
            r1 = OPF.solve(net, 'ac', dS=dS, start=st)
            if r0['converged'] and r1['converged']:
                cold.append(r0['iterations'])
                warm.append(r1['iterations'])
                used += r1['start'] == 'warm'
        meta['gain'] = {'scenarios': len(cold), 'cold': float(np.mean(cold)) if cold else None, 'warm': float(np.mean(warm)) if warm else None,
                        'used': int(used)}
    elif study == 'pf' and check:
        d = f['d'][iv]
        r0 = PF.batch(case, d)
        r1 = PF.batch(case, d, Vstart=propose_pf(model, net, case, d))
        meta['gain'] = {'scenarios': int(len(iv)), 'cold': float(r0['iterations'].mean()), 'warm': float(r1['iterations'].mean()),
                        'used': int(r1['proposed'])}
    meta['time'] = time.perf_counter() - t0
    model.meta = meta
    return model


# ------------------------------------------------------------------------------------------------ proposals
def propose_opf(model, net, dS=None, case=None):
    """The start of pcl.opf.solve from a model: ({'x', 'gamma'}, None), or ('auto', the reason) when the model is not for
    this problem. dS: the change of the injections of the scenario (VA per bus), as pcl.opf.solve takes it."""
    case = net.case() if case is None else case
    why = model.applies(net, case, 'opf')
    if why:
        return 'auto', f'νευρωνικό: {why}'
    ib, _, _ = layout(net, case, 'opf')
    d = np.zeros(case.n, complex) if dS is None else np.asarray(dS, complex) / net.S_base
    rest = np.ones(case.n, bool)
    rest[ib] = False
    if np.abs(d[rest]).max(initial=0.0) > 0:
        return 'auto', 'νευρωνικό: το σενάριο αλλάζει εγχύσεις σε ζυγούς χωρίς φορτίο, που το μοντέλο δεν έχει ως είσοδο'
    return {'x': model.predict(features(ib, d))[0], 'gamma': OPF.GAMMA0}, None


def propose_pf(model, net, case, d):
    """Starting voltages (B × n, complex) of the scenarios d (B × n, pu) for pcl.powerflow.batch, or None when the model is
    not for this network. The magnitudes of the PV buses and the slack are those of the case, as the iteration keeps them."""
    if model.applies(net, case, 'pf'):
        return None
    ib, _, _ = layout(net, case, 'pf')
    d = np.atleast_2d(np.asarray(d, complex))
    rest = np.ones(case.n, bool)
    rest[ib] = False
    if np.abs(d[:, rest]).max(initial=0.0) > 0:
        return None
    y = model.predict(features(ib, d))
    ang, Vm = y[:, :case.n].copy(), y[:, case.n:].copy()
    fixed = case.typ != PF.PQ
    Vm[:, fixed] = case.Vset[fixed]
    ref = case.typ == PF.REF
    ang[:, ref] = case.ang0[ref]
    return Vm * np.exp(1j * ang)


def folders():
    """Where models are looked for: those that come with the application (the small networks of the tutorials) and those
    that the user trained (PCL_HOME/models)."""
    return [Path(__file__).parent / 'data' / 'start', BK.home() / 'models']


_FOUND = {}


def find(net, study, case=None):
    """The model of a study of this network among the files of folders(), by fingerprint; None when there is none."""
    case = net.case() if case is None else case
    fp = fingerprint(net, case, study)
    files = sorted(p for d in folders() if d.is_dir() for p in d.glob('*.onnx'))
    key = (fp, tuple((str(p), p.stat().st_mtime_ns) for p in files))
    if key not in _FOUND:
        hit = None
        for p in files:
            try:
                m = Model.load(p)
            except (StartError, OX.OnnxError, OSError):
                continue
            if m.study == study and m.meta.get('fingerprint') == fp:
                hit = m
        _FOUND.clear()
        _FOUND[key] = hit
    return _FOUND[key]


def summary(model):
    """The facts of a model in a few Greek lines (for the command line and the reports)."""
    m, e, g = model.meta, model.meta.get('error') or {}, model.meta.get('gain') or {}
    out = [f"μοντέλο εκκίνησης «{m.get('study')}» για το δίκτυο {m.get('network')}: {m.get('inputs')} είσοδοι, {m.get('outputs')} έξοδοι, "
           f"{m.get('samples')} λύσεις (φορτία ±{100 * m.get('spread', 0):.0f} %)"]
    if e:
        out.append('σφάλμα σε σενάρια που δεν είδε (μέγιστο): ' + ', '.join(f"{k} {v['max']:.1e}" for k, v in e.items()) + ' (rad, pu)')
    if g.get('cold'):
        out.append(f"επαναλήψεις σε {g['scenarios']} σενάρια: {g['cold']:.1f} από την κανονική εκκίνηση, {g['warm']:.1f} από την πρόταση "
                   f"(δεκτές {g['used']} προτάσεις)")
    return out


def network(source):
    """A network from the name of a data case (ieee118), a MATPOWER file (.m) or a file of pcl.network (.json)."""
    from . import network as NW
    s = str(source)
    if s.lower().endswith('.m'):
        return NW.read_matpower(s), Path(s).stem
    if s.lower().endswith('.json'):
        return NW.load(s), Path(s).stem
    return NW.case_data(s), s


def add_arguments(ap):
    ap.add_argument('case', help='δίκτυο: όνομα από τα δεδομένα (π.χ. ieee118), αρχείο MATPOWER (.m) ή αρχείο του pcl.network (.json)')
    ap.add_argument('--study', default='opf', choices=STUDIES, help='opf: βέλτιστη ροή φορτίου AC· pf: παρτίδες ροής φορτίου')
    ap.add_argument('--samples', type=int, default=400, help='σενάρια φορτίου που λύνονται για την εκπαίδευση')
    ap.add_argument('--spread', type=float, default=0.2, help='εύρος των φορτίων γύρω από τη βάση (0.2 = ±20 %%)')
    ap.add_argument('--epochs', type=int, default=400)
    ap.add_argument('--seed', type=int, default=0)
    ap.add_argument('--out', help='αρχείο ONNX (προεπιλογή: PCL_HOME/models/<δίκτυο>_<μελέτη>.onnx, όπου το βρίσκει το start=\'nn\')')


def command(args):
    try:
        net, name = network(args.case)
        model = train(net, args.study, args.samples, args.spread, epochs=args.epochs, seed=args.seed, name=name,
                      progress=lambda s: print(f'  λύσεις {s}', flush=True))
    except (StartError, OSError, ValueError) as e:
        print(f'nnstart: {e}', file=__import__('sys').stderr)
        return 2
    out = Path(args.out) if args.out else BK.home() / 'models' / f'{name}_{args.study}.onnx'
    model.save(out)
    print('\n'.join(summary(model)))
    print(f'γράφτηκε: {out}')
    return 0


__all__ = ['Model', 'StartError', 'STUDIES', 'layout', 'fingerprint', 'features', 'dataset', 'fit', 'train', 'propose_opf', 'propose_pf',
           'find', 'folders', 'summary', 'network']
