"""A light single-line view of the network of a study (4.19.4, ROADMAP §73; decisions 271, 272).

The study tutorials draw the 9-bus network in EMT whatever network the study runs on; a load flow of 300 or 1354 buses
without a picture says little. This module gives the picture as data, so that the browser, the report and a CAD file all
show the same thing:

    layout(net)                  the place of every bus, {bus: (x, y)}; no coordinates are needed in the data
    view(net)                    buses, branches and their places, as plain data (what the browser draws)
    values(view, result, layer)  what a layer shows: a number per bus or per branch, its unit, its scale and its legend
    svg(view, result, layer)     the picture as SVG (the report)
    dxf(view, result, layers)    the picture as a DXF file with one CAD layer per kind of thing (opens in any CAD)

The layout is ours and deterministic (no random numbers): a radial network as a tree from its slack bus; a meshed one from
the graph distances between its buses (classical scaling for the start, stress majorization after it: Gansner, Koren &
North 2004), each island by itself. It shows who is connected to whom, not geography.

4.20.1: a network with DC grids (dc_bus, dc_line, vsc) has them in the same picture. The DC buses are laid out in the same
graph, joined by their lines and by every converter station to its AC bus, so that a DC grid sits among the AC buses it
connects; the view has them apart ('dc': buses, lines, stations), and so do the layers (dc_bus, dc_line, dc_station). A
network without DC parts gives the picture it gave before, bit for bit.
"""
import math
from types import SimpleNamespace

import numpy as np

UNIT = 100.0            # the length of a typical branch in drawing units
FULL = 2500             # buses up to which the stress uses every pair of buses (memory n², time n² per sweep)
PIVOTS = 200            # above it: distances to this many buses only (pivot scaling, Brandes & Pich 2007)
LAYERS = ('base', 'voltage', 'angle', 'loading', 'flow', 'violations', 'n1', 'security', 'collapse', 'residual', 'thd', 'unbalance', 'lmp', 'sc')
TITLES = {'base': 'Επίπεδα τάσης', 'voltage': 'Τάσεις ζυγών', 'angle': 'Γωνίες τάσης', 'loading': 'Φόρτιση κλάδων', 'flow': 'Ροές ενεργού ισχύος',
          'violations': 'Παραβιάσεις', 'n1': 'N−1: τι προκαλεί η απώλεια κάθε κλάδου', 'security': 'Ασφάλεια N−1: η χειρότερη φόρτιση κάθε κλάδου μετά από διαταραχή',
          'collapse': 'Ευστάθεια τάσης: πτώση της τάσης κάθε ζυγού ως το όριο φόρτισης', 'residual': 'Εκτίμηση κατάστασης: το μεγαλύτερο κανονικοποιημένο υπόλοιπο των μετρήσεων κάθε ζυγού και κάθε κλάδου',
          'thd': 'Αρμονική παραμόρφωση τάσης (THD) κάθε ζυγού ως προς το όριό του', 'unbalance': 'Ασυμμετρία τάσης: αρνητική ως προς θετική ακολουθία σε κάθε τριφασικό ζυγό',
          'lmp': 'Οριακές τιμές κόμβων', 'sc': 'Ρεύμα βραχυκύκλωσης I″k κάθε ζυγού (IEC 60909-0)'}
# colours: a diverging scale for a quantity around a centre, a sequential one for a quantity from zero, and the voltage levels
DIVERGING = ['#2166ac', '#67a9cf', '#d1e5f0', '#bdbdbd', '#fddbc7', '#ef8a62', '#b2182b']
SEQUENTIAL = ['#bdbdbd', '#fee08b', '#fdae61', '#f46d43', '#d73027', '#7f0000']
RESIDUAL = ['#1a9850', '#a6d96a', '#fee08b', '#f46d43', '#d73027', '#7f0000']      # from «agrees» to «far off»; grey is «no measurement»
LEVELS = ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666']
GREY, BAD, WARN = '#9e9e9e', '#b2182b', '#ef8a62'
DC_LEVELS = ['#6a3d9a', '#1f78b4', '#b15928', '#33a02c']     # 4.20.1: the DC voltages (pole to pole), apart from the AC levels
STATION = '#5f6b6d'                                         # a converter station and its link to its AC bus
CONTROL = {'P': 'σταθερή ισχύς', 'V': 'κρατά την τάση DC', 'droop': 'στατικότητα', 'idroop': 'στατικότητα ρεύματος', 'I': 'σταθερό ρεύμα'}
DCDC_CONTROL = {'P': 'σταθερή ισχύς a → b', 'V': 'κρατά την τάση της πλευράς b', 'droop': 'στατικότητα στην πλευρά b'}   # 4.21


class ViewError(ValueError):
    pass


# ---------------------------------------------------------------- the graph
def _graph(net):
    """Buses in the order of the load-flow case, the branches as index pairs, and what hangs on every bus."""
    case = net.case()
    names = [str(b) for b in case.names]
    f, t = np.asarray(case.f, int), np.asarray(case.t, int)
    return case, names, f, t


def _components(n, f, t):
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    A = coo_matrix((np.ones(len(f)), (f, t)), shape=(n, n))
    k, lab = connected_components(A, directed=False)
    return [np.flatnonzero(lab == i) for i in range(k)]


def _hops(n, f, t, sources=None):
    """Graph distances in branches: all pairs, or from some buses (rows)."""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import shortest_path
    A = coo_matrix((np.ones(len(f)), (f, t)), shape=(n, n)).tocsr()
    return shortest_path(A, method='D', directed=False, unweighted=True, indices=sources)


def _tree(n, f, t, root):
    """A radial network: depth to the right, every subtree in its own band, the larger subtrees first (a tidy feeder)."""
    nb = [[] for _ in range(n)]
    for a, b in zip(f, t):
        nb[a].append(int(b))
        nb[b].append(int(a))
    parent, order, depth = [-1] * n, [], [0] * n
    seen, stack = [False] * n, [root]
    seen[root] = True
    while stack:
        u = stack.pop()
        order.append(u)
        for v in sorted(nb[u], reverse=True):
            if not seen[v]:
                seen[v] = True
                parent[v], depth[v] = u, depth[u] + 1
                stack.append(v)
    size = [1] * n
    for u in reversed(order):
        if parent[u] >= 0:
            size[parent[u]] += size[u]
    kids = [[] for _ in range(n)]
    for u in order:
        if parent[u] >= 0:
            kids[parent[u]].append(u)
    y, nxt = [0.0] * n, [0.0]

    def place(u):
        # iterative post-order: a leaf takes the next free row, a parent the row of its largest subtree (the main feeder stays straight)
        st = [(u, 0)]
        while st:
            v, i = st.pop()
            ch = sorted(kids[v], key=lambda c: (-size[c], c))
            if i < len(ch):
                st.append((v, i + 1))
                st.append((ch[i], 0))
            elif not ch:
                y[v] = nxt[0]
                nxt[0] += 1.0
            else:
                y[v] = y[ch[0]]
    place(root)
    return np.array([[depth[u], y[u]] for u in range(n)], float)


def _classical(D, dim=2):
    """Classical scaling of a distance matrix (rows: pivots or all buses): the start of the stress iteration."""
    D2 = D.astype(float) ** 2
    C = D2 - D2.mean(axis=0)[None, :] - D2.mean(axis=1)[:, None] + D2.mean()
    C = -0.5 * C.T                                         # n × k
    # the largest directions of C·Cᵀ from the small k × k problem
    w, V = np.linalg.eigh(C.T @ C)
    X = C @ V[:, ::-1][:, :dim]
    for j in range(X.shape[1]):                            # a fixed sign: the first bus that is not at zero looks right and up
        nz = np.flatnonzero(np.abs(X[:, j]) > 1e-9 * (np.abs(X[:, j]).max() or 1.0))
        if len(nz) and X[nz[0], j] < 0:
            X[:, j] = -X[:, j]
    s = np.abs(X).max() or 1.0
    return X / s


def _stress(X, D, sweeps=60, tol=1e-4):
    """Stress majorization with the weights 1/d² (Gansner, Koren & North 2004): every sweep moves each bus to the weighted
    mean of where the others want it. D: all pairs (n × n)."""
    n = len(X)
    with np.errstate(divide='ignore'):
        W = np.where(D > 0, 1.0 / (D * D), 0.0)
    wsum = W.sum(axis=1)
    wsum[wsum == 0] = 1.0
    last = None
    for _ in range(sweeps):
        diff = X[:, None, :] - X[None, :, :]
        dist = np.sqrt((diff * diff).sum(axis=2))
        np.fill_diagonal(dist, 1.0)
        # two buses at the same place (twins: the same neighbours) pull nothing from each other here; _spread parts them later
        B = np.where(dist > 1e-9, W * D / np.maximum(dist, 1e-9), 0.0)
        np.fill_diagonal(B, 0.0)
        Xn = (W @ X + (B.sum(axis=1)[:, None] * X - B @ X)) / wsum[:, None]
        s = float((W * (dist - D) ** 2).sum())
        X = Xn
        if last is not None and abs(last - s) <= tol * max(last, 1e-30):
            break
        last = s
    return X


def _stress_sparse(X, f, t, P, Dp, sweeps=40):
    """A network above FULL buses: the same iteration with the pairs that matter only: every branch (distance 1) and the
    distances to the pivots."""
    n = len(X)
    nbr_w = np.zeros(n)
    np.add.at(nbr_w, f, 1.0)
    np.add.at(nbr_w, t, 1.0)
    with np.errstate(divide='ignore'):
        Wp = np.where(Dp > 0, 1.0 / (Dp * Dp), 0.0)        # k × n
    wsum = nbr_w + Wp.sum(axis=0)
    wsum[wsum == 0] = 1.0
    for _ in range(sweeps):
        num = np.zeros_like(X)
        d = X[f] - X[t]
        L = np.sqrt((d * d).sum(axis=1))
        L[L == 0] = 1.0
        u = d / L[:, None]
        np.add.at(num, f, X[t] + u)
        np.add.at(num, t, X[f] - u)
        dp = X[None, :, :] - X[P][:, None, :]             # k × n × 2
        Lp = np.sqrt((dp * dp).sum(axis=2))
        Lp[Lp == 0] = 1.0
        num += ((Wp[:, :, None]) * (X[P][:, None, :] + dp / Lp[:, :, None] * Dp[:, :, None])).sum(axis=0)
        X = num / wsum[:, None]
    return X


def _spread(X, dmin, sweeps=8):
    """Buses that fell on top of each other move apart (a short pass; the picture keeps its shape)."""
    from scipy.spatial import cKDTree
    X = X.copy()
    for _ in range(sweeps):
        pairs = cKDTree(X).query_pairs(dmin, output_type='ndarray')
        if not len(pairs):
            break
        a, b = pairs[:, 0], pairs[:, 1]
        d = X[a] - X[b]
        L = np.sqrt((d * d).sum(axis=1))
        same = L < 1e-9
        # two buses at one point: apart along a direction fixed by their indices
        ang = (a[same] * 0.7548776662 + b[same] * 0.5698402910) * 2 * math.pi
        d[same] = np.c_[np.cos(ang), np.sin(ang)]
        L[same] = 1.0
        push = 0.5 * (dmin - np.where(same, 0.0, L))[:, None] * d / L[:, None]
        mv = np.zeros_like(X)
        np.add.at(mv, a, push)
        np.add.at(mv, b, -push)
        X += mv
    return X


def _island(n, f, t, root):
    """The places of one connected part: n buses, branches f → t (local indices), root = its slack or first bus."""
    if n == 1:
        return np.zeros((1, 2))
    if n == 2:
        return np.array([[0.0, 0.0], [1.0, 0.0]])
    if len(set(map(lambda p: (min(p), max(p)), zip(f.tolist(), t.tolist())))) == n - 1:
        return _tree(n, f, t, root)
    if n <= FULL:
        D = _hops(n, f, t)
        X = _stress(_classical(D) * (D.max() / 2.0), D)
    else:
        # pivots far from each other (the farthest-first rule from the root): deterministic
        P, far = [root], _hops(n, f, t, sources=[root])[0]
        while len(P) < min(PIVOTS, n):
            nxt = int(np.argmax(far))
            P.append(nxt)
            far = np.minimum(far, _hops(n, f, t, sources=[nxt])[0])
        P = np.array(P)
        Dp = _hops(n, f, t, sources=P)                     # k × n
        X = _stress_sparse(_classical(Dp) * (Dp.max() / 2.0), f, t, P, Dp)
    # the long direction horizontal, the root on the left
    Xc = X - X.mean(axis=0)
    w, V = np.linalg.eigh(Xc.T @ Xc)
    X = Xc @ V[:, ::-1]
    if X[root, 0] > 0:
        X[:, 0] = -X[:, 0]
    if X[root, 1] > 0:
        X[:, 1] = -X[:, 1]
    L = np.sqrt(((X[f] - X[t]) ** 2).sum(axis=1))
    med = float(np.median(L[L > 0])) if (L > 0).any() else 1.0
    return _spread(X / med, 0.45)


_PLACES = {}            # the places of the graphs laid out in this process (a study of the same network asks again and again)


def _dc_parts(net):
    """4.20.1: the DC buses {name: {Un…}}, the DC lines and the converter stations of a network (all empty when it has none)."""
    db = net.__dict__.get('dc_buses') or {}
    return db, [e for e in net.elements if e.get('kind') == 'dc_line'], [e for e in net.elements if e.get('kind') == 'vsc']


def _dcdc(net):
    """4.21: the DC/DC converters of a network (none in a network of before 4.21)."""
    return [e for e in net.elements if e.get('kind') == 'dcdc']


def _with_dc(case, names, f, t, net):
    """The graph of the layout with the DC buses after the AC buses: a DC line joins two DC buses, a station its AC bus and its
    DC bus. None when the network has no DC buses (then the layout is the one of before 4.20.1)."""
    db, dl, st = _dc_parts(net)
    if not db:
        return None
    ix = {b: i for i, b in enumerate(names)}
    for i, b in enumerate(db):
        ix.setdefault(str(b), len(names) + i)              # (pcl.network.dc_bus refuses the name of an AC bus)
    ends = [(ix[str(e['a'])], ix[str(e['b'])]) for e in dl] + [(ix[str(e['bus'])], ix[str(e['dc'])]) for e in st if str(e['bus']) in ix]
    ends += [(ix[str(e['a'])], ix[str(e['b'])]) for e in _dcdc(net)]       # 4.21: a DC/DC converter joins its two DC buses
    fe = np.concatenate([f, np.array([a for a, _ in ends], int)])
    te = np.concatenate([t, np.array([b for _, b in ends], int)])
    typ = np.concatenate([np.asarray(case.typ), np.zeros(len(db), int)])
    return SimpleNamespace(typ=typ), names + [str(b) for b in db], fe, te


def layout(net):
    """The place of every bus of a network, {bus: (x, y)} in drawing units (a typical branch is UNIT long; y grows downwards),
    the DC buses too (4.20.1). Deterministic: the same network gives the same places."""
    case, names, f, t = _graph(net)
    g = _with_dc(case, names, f, t, net)
    if g is not None:
        case, names, f, t = g
    n = len(names)
    if n == 0:
        return {}
    key = hash((tuple(names), f.tobytes(), t.tobytes(), np.asarray(case.typ).tobytes()))
    if key in _PLACES:
        return dict(_PLACES[key])
    xy = _layout(case, names, f, t)
    if len(_PLACES) > 16:
        _PLACES.clear()
    _PLACES[key] = xy
    return dict(xy)


def _layout(case, names, f, t):
    n = len(names)
    typ = np.asarray(case.typ)
    out, x0 = np.zeros((n, 2)), 0.0
    comps = sorted(_components(n, f, t), key=lambda c: (-len(c), int(c[0])))
    row_h, y0, row_w = 0.0, 0.0, 0.0
    width = None
    for c in comps:
        loc = {int(g): i for i, g in enumerate(c)}
        m = np.array([a in loc and b in loc for a, b in zip(f.tolist(), t.tolist())], bool)
        fl = np.array([loc[int(a)] for a in f[m]], int)
        tl = np.array([loc[int(b)] for b in t[m]], int)
        ref = [i for i, g in enumerate(c) if typ[g] == 2]
        X = _island(len(c), fl, tl, ref[0] if ref else 0)
        X = X - X.min(axis=0)
        w, h = X.max(axis=0) if len(X) else (0.0, 0.0)
        if width is None:
            width = max(w, 1.0)                              # the largest part sets the width; the others in rows under it
            out[c] = X
            y0, x0, row_h = h + 2.0, 0.0, 0.0
            continue
        if x0 > 0 and x0 + w > width:
            x0, y0, row_h = 0.0, y0 + row_h + 2.0, 0.0
        out[c] = X + np.array([x0, y0])
        x0, row_h = x0 + w + 2.0, max(row_h, h)
    out *= UNIT
    return {names[i]: (float(out[i, 0]), float(out[i, 1])) for i in range(n)}


# ---------------------------------------------------------------- the view as data
def view(net, off=None):
    """Buses, branches and their places as plain data: what the browser draws and what svg() and dxf() take.

    {'unit', 'bounds': [x0, y0, x1, y1], 'levels': [U_n…], 'buses': [{id, x, y, Un, type, gen, load, shunt}],
     'branches': [{name, a, b, trafo, k, of}]}: k of `of` parallel branches between the same two buses.
    off: names of branches that a change of the network took out of service (pcl.netfile.apply): they stay in the picture
    at their places, marked 'off' and drawn dashed, so that the picture does not move when a branch goes out."""
    off = {str(q) for q in (off or ())}
    case, names, f, t = _graph(net)
    xy = layout(net)
    typ = np.asarray(case.typ)
    gen, load, shunt = set(), set(), set()
    for e in net.elements:
        k = e.get('kind')
        if k in ('generator', 'gen', 'source', 'slack', 'grid'):
            gen.add(str(e.get('bus')))
        elif k == 'load':
            load.add(str(e.get('bus')))
        elif k == 'shunt':
            shunt.add(str(e.get('bus')))
    buses = []
    for i, b in enumerate(names):
        info = net.buses.get(b, net.buses.get(case.names[i], {})) if isinstance(net.buses, dict) else {}
        buses.append({'id': b, 'x': round(xy[b][0], 2), 'y': round(xy[b][1], 2), 'Un': float(info.get('Un', 0.0) or 0.0),
                      'type': {2: 'slack', 1: 'PV'}.get(int(typ[i]), 'PQ'), 'gen': b in gen or int(typ[i]) in (1, 2), 'load': b in load, 'shunt': b in shunt})
        if info.get('label'):                                # 4.19.4: the name of the bus in the file it came from
            buses[-1]['label'] = str(info['label'])
    tap = np.asarray(case.tap) if getattr(case, 'tap', None) is not None else np.ones(len(f), complex)
    count, seen, branches = {}, {}, []
    for a, b in zip(f.tolist(), t.tolist()):
        key = (min(a, b), max(a, b))
        count[key] = count.get(key, 0) + 1
    for j, (a, b) in enumerate(zip(f.tolist(), t.tolist())):
        key = (min(a, b), max(a, b))
        seen[key] = seen.get(key, 0) + 1
        ua, ub = buses[a]['Un'], buses[b]['Un']
        trafo = bool(abs(complex(tap[j]) - 1.0) > 1e-9 or (ua > 0 and ub > 0 and abs(ua - ub) > 1e-6 * max(ua, ub)))
        branches.append({'name': str(case.br_name[j]), 'a': names[a], 'b': names[b], 'trafo': trafo, 'k': seen[key], 'of': count[key]})
        if off and (branches[-1]['name'] in off or branches[-1]['name'].split('#')[0] in off):
            branches[-1]['off'] = True
    xs, ys = [q['x'] for q in buses], [q['y'] for q in buses]
    levels = sorted({q['Un'] for q in buses if q['Un'] > 0}, reverse=True)
    out = {'unit': UNIT, 'bounds': [min(xs), min(ys), max(xs), max(ys)] if buses else [0, 0, 0, 0], 'levels': levels, 'buses': buses, 'branches': branches}
    db, dl, st = _dc_parts(net)
    if db:                                               # 4.20.1: the DC grids, apart from the AC buses and branches
        dcb = [{'id': str(b), 'x': round(xy[str(b)][0], 2), 'y': round(xy[str(b)][1], 2), 'Un': float(d.get('Un', 0.0) or 0.0)} for b, d in db.items()]
        count, seen, lines = {}, {}, []
        dd = _dcdc(net)                                  # 4.21: a DC/DC converter is drawn as a DC link with its mark (kind 'dcdc')
        for e in dl + dd:
            key = tuple(sorted((str(e['a']), str(e['b']))))
            count[key] = count.get(key, 0) + 1
        for e in dl + dd:
            key = tuple(sorted((str(e['a']), str(e['b']))))
            seen[key] = seen.get(key, 0) + 1
            lines.append({'name': str(e['name']), 'a': str(e['a']), 'b': str(e['b']), 'poles': int(e.get('poles', 2)), 'k': seen[key], 'of': count[key]})
            if e.get('kind') == 'dcdc':
                lines[-1].update(kind='dcdc', control=str(e.get('control', 'P')))
        stations = [{'name': str(e['name']), 'ac': str(e['bus']), 'dc': str(e['dc']), 'control': str(e.get('control', 'P'))} for e in st if str(e['bus']) in xy]
        out['dc'] = {'levels': sorted({q['Un'] for q in dcb if q['Un'] > 0}, reverse=True), 'buses': dcb, 'lines': lines, 'stations': stations}
        xs, ys = xs + [q['x'] for q in dcb], ys + [q['y'] for q in dcb]
        out['bounds'] = [min(xs), min(ys), max(xs), max(ys)]
    return out


# ---------------------------------------------------------------- what a layer shows
def _scale(colors, lo, hi):
    def col(v):
        if v is None or not math.isfinite(v):
            return GREY
        if hi <= lo:
            return colors[len(colors) // 2]
        q = (v - lo) / (hi - lo)
        return colors[max(0, min(len(colors) - 1, int(q * len(colors))))]
    return col


def _num(x):
    try:
        v = float(x)
        return v if math.isfinite(v) else None
    except (TypeError, ValueError):
        return None


def values(v, result=None, layer='base', study=None):
    """What a layer shows on a view: {'layer', 'title', 'bus': {id: value}, 'branch': {name: value}, 'bus_color': {…},
    'branch_color': {…}, 'unit_bus', 'unit_branch', 'legend': [(colour, text)…], 'note'}. result: the result of a study as
    pcl.study gives it (load flow or optimal power flow: 'buses', 'branches'; N−1: 'outages'). A layer the result cannot feed
    (no ratings, no prices, no outages) says so in 'note' and draws the base layer."""
    if layer not in LAYERS:
        raise ViewError(f'άγνωστη στρώση {layer!r}: μία από {", ".join(LAYERS)}')
    res = result or {}
    if layer != 'n1' and res.get('outages') is not None and 'buses' not in res and isinstance(res.get('flow'), dict):
        res = res['flow']                                     # 4.21: N−1 AC/DC: the other layers from its load flow before any outage
    rb, rbr = res.get('buses') or {}, res.get('branches') or []
    out = {'layer': layer, 'title': TITLES[layer], 'bus': {}, 'branch': {}, 'bus_color': {}, 'branch_color': {}, 'unit_bus': '', 'unit_branch': '', 'legend': [], 'note': ''}
    lev = {u: LEVELS[i % len(LEVELS)] for i, u in enumerate(v['levels'])}
    dc = v.get('dc')
    rdc = res.get('dc') if isinstance(res.get('dc'), dict) else {}
    if dc:                                                    # 4.20.1: the DC grid, grey unless the layer has something for it
        out.update({'dc_bus': {}, 'dc_line': {}, 'dc_station': {}, 'unit_dc_bus': '', 'unit_dc_line': '', 'unit_dc_station': '',
                    'dc_bus_color': {b['id']: GREY for b in dc['buses']}, 'dc_line_color': {e['name']: GREY for e in dc['lines']},
                    'dc_station_color': {q['name']: STATION for q in dc['stations']}})
        dlev = {u: DC_LEVELS[i % len(DC_LEVELS)] for i, u in enumerate(dc['levels'])}
        dun = {b['id']: b['Un'] for b in dc['buses']}

    def base():
        for b in v['buses']:
            out['bus_color'][b['id']] = lev.get(b['Un'], GREY)
        un = {b['id']: b['Un'] for b in v['buses']}
        for e in v['branches']:
            out['branch_color'][e['name']] = lev.get(max(un.get(e['a'], 0), un.get(e['b'], 0)), GREY)
        out['legend'] = [(lev[u], f'{u / 1e3:g} kV') for u in v['levels']] or [(GREY, 'χωρίς ονομαστική τάση')]
        if dc:                                                # a DC voltage as ± half of the pole-to-pole one
            out['dc_bus_color'] = {b['id']: dlev.get(b['Un'], GREY) for b in dc['buses']}
            out['dc_line_color'] = {e['name']: dlev.get(max(dun.get(e['a'], 0), dun.get(e['b'], 0)), GREY) for e in dc['lines']}
            out['legend'] += [(dlev[u], f'±{u / 2e3:g} kV DC') for u in dc['levels']] + [(STATION, 'σταθμός μετατροπέα')]
            if any(e.get('kind') == 'dcdc' for e in dc['lines']):
                out['legend'] += [(STATION, 'μετατροπέας DC/DC')]

    def missing(what):
        out['note'] = what
        base()
        return out

    if layer == 'base':
        base()
        return out
    cpf = isinstance(res.get('nose'), dict)                   # 4.19.5: the result of a continuation load flow (its 'buses' are at the loading limit)
    if layer == 'collapse':
        # every bus by how far its voltage falls from the load as it is to the loading limit; a bus that holds its voltage falls by nothing
        vals = {str(b): _num(q.get('drop')) for b, q in rb.items() if isinstance(q, dict)} if cpf else {}
        vals = {b: x for b, x in vals.items() if x is not None}
        if not vals:
            return missing('Η στρώση ευστάθειας τάσης θέλει συνεχιζόμενη ροή φορτίου.')
        ns = res['nose']
        top = max(max(vals.values()), 0.06)
        col = _scale(SEQUENTIAL, 0.0, top)
        out['bus'], out['unit_bus'] = vals, 'pu'
        out['bus_color'] = {b['id']: col(vals.get(b['id'])) for b in v['buses']}
        out['branch_color'] = {e['name']: GREY for e in v['branches']}
        out['legend'] = [(col(top * (i + 0.5) / 6), f'{top * i / 6:.3f}–{top * (i + 1) / 6:.3f} pu'.replace('.', ',')) for i in range(6)]
        at = sum(1 for q in rb.values() if isinstance(q, dict) and q.get('limit'))
        out['weak'] = str(ns.get('bus'))
        out['count'] = {'at_limit': int(at)}
        gr = lambda x, d: f'{float(x):.{d}f}'.replace('.', ',')      # noqa: E731
        out['note_base'] = ((f'Όριο φόρτισης: λ = {gr(ns["lambda"], 4)}, {gr(ns["margin_MW"], 1)} MW πάνω από το σημερινό φορτίο. '
                             if _num(ns.get('lambda')) is not None and _num(ns.get('margin_MW')) is not None else '')
                            + f'Ο πιο αδύναμος ζυγός: {ns.get("bus")}.' + (f' Ζυγοί με γεννήτρια σε όριο αέργου εκεί: {at}.' if at else ''))
        return out
    if layer == 'residual':
        # 4.19.5, state estimation: where the measurements disagree with the estimate; what has no measurement stays grey
        mp = res.get('map') if isinstance(res.get('map'), dict) else None
        if not mp or not (mp.get('bus') or mp.get('branch')):
            return missing('Η στρώση των υπολοίπων θέλει εκτίμηση κατάστασης.')
        vb = {str(k): x for k, x in ((k, _num(x)) for k, x in (mp.get('bus') or {}).items()) if x is not None}
        vl = {str(k): x for k, x in ((k, _num(x)) for k, x in (mp.get('branch') or {}).items()) if x is not None}
        thr = _num(res.get('threshold')) or 3.0
        top = max(2 * thr, max(list(vb.values()) + list(vl.values()), default=0.0))
        col = _scale(RESIDUAL, 0.0, 2 * thr)
        out['bus'], out['branch'], out['unit_bus'], out['unit_branch'] = vb, vl, '', ''
        out['bus_color'] = {b['id']: (col(min(vb[b['id']], 2 * thr)) if b['id'] in vb else GREY) for b in v['buses']}
        out['branch_color'] = {e['name']: (col(min(vl[e['name'].split('#')[0]], 2 * thr)) if e['name'].split('#')[0] in vl else GREY) for e in v['branches']}
        out['branch'] = {e['name']: vl[e['name'].split('#')[0]] for e in v['branches'] if e['name'].split('#')[0] in vl}
        gr = lambda x, d=1: f'{float(x):.{d}f}'.replace('.', ',')      # noqa: E731
        out['legend'] = ([(col(thr * (i + 0.5) / 3), f'{gr(thr * i / 3)}–{gr(thr * (i + 1) / 3)}' + (' (πάνω από το κατώφλι)' if i >= 3 else '')) for i in range(5)]
                         + [(col(2 * thr), f'πάνω από {gr(thr * 5 / 3)}'), (GREY, 'χωρίς μέτρηση')])
        bad = res.get('bad') or []
        out['count'] = {'bad': len(bad), 'top': float(top)}
        out['note_base'] = (f'{res.get("m")} μετρήσεις. ' + ('Καμία δεν βγήκε ως λανθασμένη.' if not bad else
                            ('Βγήκε ως λανθασμένη: ' if len(bad) == 1 else f'Βγήκαν ως λανθασμένες {len(bad)}: ') + ', '.join(f'{b["type"]} στο {b["at"]}' for b in bad[:6]) + (' …' if len(bad) > 6 else '') + '.'))
        return out
    if layer == 'sc':
        # 5.0.11, IEC 60909-0: every bus by its initial short-circuit current I″k (kA), from zero to the largest of the network
        vals = {str(b): _num(q.get('Ik')) for b, q in rb.items() if isinstance(q, dict) and q.get('Ik') is not None and 'V' not in q}
        vals = {b: x / 1e3 for b, x in vals.items() if x is not None}
        if not vals or not isinstance(res.get('fault'), str):
            return missing('Η στρώση του βραχυκυκλώματος θέλει τη μελέτη IEC 60909-0.')
        top = max(max(vals.values()), 1e-9)
        col = _scale(SEQUENTIAL, 0.0, top)
        out['bus'], out['unit_bus'] = vals, 'kA'
        out['bus_color'] = {b['id']: col(vals.get(b['id'])) for b in v['buses']}
        out['branch_color'] = {e['name']: GREY for e in v['branches']}
        gr = lambda x: f'{x:.3g}'.replace('.', ',')               # noqa: E731
        out['legend'] = [(col(top * (i + 0.5) / 6), f'{gr(top * i / 6)}–{gr(top * (i + 1) / 6)} kA') for i in range(6)]
        w = max(vals, key=vals.get)
        name = {'3ph': 'τριφασικό', '2ph': 'διφασικό', '1ph': 'μονοφασικό προς γη', '2phE': 'διφασικό προς γη'}.get(res['fault'], res['fault'])
        out['note_base'] = f'Σφάλμα {name}, {"μέγιστα" if res.get("mode") != "min" else "ελάχιστα"} ρεύματα· το μεγαλύτερο I″k: {gr(vals[w])} kA στον ζυγό {w}.'
        return out
    if layer == 'thd':
        # 4.19.5, harmonic load flow: every bus by its voltage distortion against the limit of its voltage level (IEEE Std 519)
        vals = {str(b): (_num(q.get('THD')), _num(q.get('limit_thd'))) for b, q in rb.items() if isinstance(q, dict) and q.get('THD') is not None}
        vals = {b: x for b, x in vals.items() if x[0] is not None and x[1]}
        if not vals:
            return missing('Η στρώση της αρμονικής παραμόρφωσης θέλει αρμονική ροή φορτίου.')
        col = _scale(RESIDUAL, 0.0, 2.0)                          # the ratio to the limit: green below it, red above
        out['bus'], out['unit_bus'] = {b: x[0] for b, x in vals.items()}, '%'
        out['bus_color'] = {b['id']: (col(min(vals[b['id']][0] / vals[b['id']][1], 2.0)) if b['id'] in vals else GREY) for b in v['buses']}
        out['branch_color'] = {e['name']: GREY for e in v['branches']}
        pc = lambda a: f'{round(100 * a)} %'                      # noqa: E731
        out['legend'] = [(col((i + 0.5) / 3), f'{pc(i / 3)}–{pc((i + 1) / 3)} του ορίου' + (' (πάνω από το όριο)' if i >= 3 else '')) for i in range(5)] + [(col(2.0), 'πάνω από 167 % του ορίου')]
        over = res.get('over') or []
        w = res.get('worst') or {}
        gr = lambda x, d=2: f'{float(x):.{d}f}'.replace('.', ',')      # noqa: E731
        out['count'] = {'over': len(over)}
        out['note_base'] = ((f'Μεγαλύτερη παραμόρφωση: {gr(w["THD"])} % στον ζυγό {w["bus"]}. ' if w.get('bus') is not None else '')
                            + ('Κανένας ζυγός πάνω από το όριό του.' if not over else f'Πάνω από το όριό τους: {len(over)} ζυγοί.' if len(over) > 1 else f'Πάνω από το όριό του: ο ζυγός {over[0]}.'))
        return out
    if layer == 'unbalance':
        # 4.19.5, three-phase load flow: the voltage unbalance of every bus of three phases; a bus of one or two phases stays grey
        feeder = any(isinstance(q, dict) and 'phases' in q for q in rb.values())
        if not feeder:
            return missing('Η στρώση της ασυμμετρίας θέλει τριφασική ροή φορτίου.')
        vals = {str(b): _num(q.get('unbalance')) for b, q in rb.items() if isinstance(q, dict) and q.get('unbalance') is not None}
        top = max(3.0, max(vals.values(), default=0.0))
        col = _scale(RESIDUAL, 0.0, top)
        out['bus'], out['unit_bus'] = vals, '%'
        out['bus_color'] = {b['id']: (col(vals[b['id']]) if b['id'] in vals else GREY) for b in v['buses']}
        out['branch_color'] = {e['name']: GREY for e in v['branches']}
        gr = lambda x, d=1: f'{float(x):.{d}f}'.replace('.', ',')      # noqa: E731
        out['legend'] = [(col(top * (i + 0.5) / 6), f'{gr(top * i / 6)}–{gr(top * (i + 1) / 6)} %') for i in range(6)] + [(GREY, 'μία ή δύο φάσεις')]
        w = (res.get('worst') or {}).get('unbalance') or {}
        lo = (res.get('worst') or {}).get('low') or {}
        out['note_base'] = ((f'Μεγαλύτερη ασυμμετρία: {gr(w["value"], 2)} % στον ζυγό {w["bus"]}. ' if w.get('value') is not None else '')
                            + (f'Χαμηλότερη τάση φάσης: {gr(lo["V"], 4)} pu στη φάση {lo["phase"]} του ζυγού {lo["bus"]}.' if lo.get('bus') is not None else ''))
        return out
    if layer == 'violations' and cpf:                         # (the voltages at the loading limit are not an operating state to check against limits)
        return missing('Στη συνεχιζόμενη ροή φορτίου οι τάσεις είναι του ορίου φόρτισης: δες τη στρώση της ευστάθειας τάσης.')
    if layer in ('voltage', 'angle', 'lmp'):
        key = {'voltage': 'V', 'angle': 'angle', 'lmp': 'lmp'}[layer]
        vals = {str(b): _num(q.get(key)) for b, q in rb.items() if isinstance(q, dict)}
        vals = {b: x for b, x in vals.items() if x is not None}
        if not vals:
            return missing({'voltage': 'Η μελέτη δεν έχει τάσεις ζυγών.', 'angle': 'Η μελέτη δεν έχει γωνίες.', 'lmp': 'Οριακές τιμές κόμβων δίνει μόνο η βέλτιστη ροή φορτίου.'}[layer])
        dvals = {}
        if layer == 'voltage' and dc:                         # 4.20.1: the DC voltages in pu of their U_n, on the same scale
            dvals = {str(b): _num(q.get('V')) for b, q in (rdc.get('buses') or {}).items() if isinstance(q, dict)}
            dvals = {b: x for b, x in dvals.items() if x is not None}
        if layer == 'voltage':
            lo, hi, unit, fmt = 0.9, 1.1, 'pu', '{:.2f}'
            lo, hi = min([lo] + list(vals.values()) + list(dvals.values())), max([hi] + list(vals.values()) + list(dvals.values()))
            col = _scale(DIVERGING, 1 - max(1 - lo, hi - 1), 1 + max(1 - lo, hi - 1))
        elif layer == 'angle':
            a = max(abs(x) for x in vals.values()) or 1.0
            lo, hi, unit, fmt = -a, a, '°', '{:.1f}'
            col = _scale(DIVERGING, lo, hi)
        else:
            lo, hi, unit, fmt = min(vals.values()), max(vals.values()), 'ανά MWh', '{:.2f}'
            col = _scale(SEQUENTIAL, lo, hi if hi > lo else lo + 1.0)
        out['bus'], out['unit_bus'] = vals, unit
        if cpf:
            out['title'] += ' στο όριο φόρτισης'
        elif isinstance(res.get('map'), dict) and layer != 'lmp':
            out['title'] += ' (εκτίμηση από τις μετρήσεις)'
        elif isinstance(res.get('harmonics'), list) and layer != 'lmp':
            out['title'] += ' (θεμελιώδης συχνότητα)'
        elif any(isinstance(q, dict) and 'phases' in q for q in rb.values()) and layer == 'voltage':
            out['title'] += ' (η χαμηλότερη φάση κάθε ζυγού)'
        out['bus_color'] = {b['id']: col(vals.get(b['id'])) for b in v['buses']}
        out['branch_color'] = {e['name']: GREY for e in v['branches']}
        if dvals:
            out['dc_bus'], out['unit_dc_bus'] = dvals, 'pu'
            out['dc_bus_color'] = {b['id']: col(dvals.get(b['id'])) for b in dc['buses']}
        a0, a1 = (1 - max(1 - lo, hi - 1), 1 + max(1 - lo, hi - 1)) if layer == 'voltage' else (lo, hi)
        steps = [a0 + (a1 - a0) * (i + 0.5) / 7 for i in range(7)] if layer != 'lmp' else [a0 + (a1 - a0) * (i + 0.5) / 6 for i in range(6)]
        out['legend'] = [(col(s), fmt.format(s).replace('.', ',') + ' ' + unit) for s in steps]
        return out
    dl = [e for e in (rdc.get('lines') or []) if isinstance(e, dict)] if dc else []
    if layer in ('loading', 'flow'):
        if not rbr and not (layer == 'flow' and dl):
            return missing('Η μελέτη δεν έχει ροές κλάδων.')
        if layer == 'loading':
            vals = {str(e.get('name')): _num(e.get('loading')) for e in rbr}
            vals = {k: x for k, x in vals.items() if x is not None}
            if not vals:
                return missing('Φόρτιση υπάρχει μόνο όπου οι κλάδοι έχουν ονομαστική ισχύ και η μελέτη την υπολογίζει (βέλτιστη ροή φορτίου).')
            vals = {k: 100.0 * x for k, x in vals.items()}       # the studies give the loading as a fraction of the rating
            col = _scale(SEQUENTIAL, 0.0, 120.0)
            out['branch'], out['unit_branch'] = vals, '%'
            out['legend'] = [(col(s), f'{int(s - 10)}–{int(s + 10)} %') for s in (10, 30, 50, 70, 90)] + [(col(110), 'πάνω από 100 %')]
        else:
            vals = {str(e.get('name')): _num(e.get('Pa')) for e in rbr}
            vals = {k: x / 1e6 for k, x in vals.items() if x is not None}
            dlv, dsv = {}, {}
            if dl:                                            # 4.20.1: a DC line by the power at its end a, a station by the power it gives the DC grid
                dlv = {str(e.get('name')): _num(e.get('Pa')) for e in dl}
                dlv.update({str(k): _num(q.get('P')) for k, q in (rdc.get('dcdc') or {}).items() if isinstance(q, dict)})   # 4.21: a DC/DC, a → b
                dlv = {k: x / 1e6 for k, x in dlv.items() if x is not None}
                dsv = {str(k): _num(q.get('Pdc')) for k, q in (res.get('converters') or {}).items() if isinstance(q, dict)}
                dsv = {k: x / 1e6 for k, x in dsv.items() if x is not None}
            top = max((abs(x) for x in list(vals.values()) + list(dlv.values()) + list(dsv.values())), default=1.0) or 1.0
            col = _scale(SEQUENTIAL, 0.0, top)
            out['branch'], out['unit_branch'] = vals, 'MW'
            out['legend'] = [(col(top * (i + 0.5) / 6), f'{top * i / 6:.3g}–{top * (i + 1) / 6:.3g} MW'.replace('.', ',')) for i in range(6)]
            col0 = col
            col = lambda x: col0(abs(x)) if x is not None else GREY     # noqa: E731
            if dlv or dsv:
                out['dc_line'], out['dc_station'], out['unit_dc_line'], out['unit_dc_station'] = dlv, dsv, 'MW', 'MW'
                out['dc_line_color'] = {e['name']: col(dlv.get(e['name'])) for e in dc['lines']}
                out['dc_station_color'] = {q['name']: (col(dsv[q['name']]) if q['name'] in dsv else STATION) for q in dc['stations']}
        out['branch_color'] = {e['name']: col(vals.get(e['name'])) for e in v['branches']}
        out['bus_color'] = {b['id']: GREY for b in v['buses']}
        return out
    if layer == 'violations':
        if not rb and not rbr:
            return missing('Η μελέτη δεν έχει τάσεις ή ροές.')
        lim = res.get('limits') or {}
        vmin, vmax = float(lim.get('Vmin', 0.95)), float(lim.get('Vmax', 1.05))
        nb = nbr = 0
        for b in v['buses']:
            q = (rb.get(b['id']) or rb.get(_maybe_int(b['id'])) or {}) if rb else {}
            x = _num(q.get('V')) if rb else None
            if x is not None and 'phases' in q:                 # 4.19.5, a bus of a three-phase feeder: every phase against the limits, and the one farthest from 1 pu shown
                lo_, hi_ = _num(q.get('Vmin')), _num(q.get('Vmax'))
                bad = lo_ < vmin - 1e-9 or hi_ > vmax + 1e-9
                x = hi_ if hi_ - 1 > 1 - lo_ else lo_
            else:
                bad = x is not None and (x < vmin - 1e-9 or x > vmax + 1e-9)
            nb += bad
            out['bus_color'][b['id']] = BAD if bad else GREY
            if x is not None:
                out['bus'][b['id']] = x
        ld = {str(e.get('name')): _num(e.get('loading')) for e in rbr}
        for e in v['branches']:
            x = ld.get(e['name'])
            x = None if x is None else 100.0 * x
            bad = x is not None and x > 100.0 + 1e-6
            nbr += bad
            out['branch_color'][e['name']] = BAD if bad else GREY
            if x is not None:
                out['branch'][e['name']] = x
        out['unit_bus'], out['unit_branch'] = 'pu', '%'
        out['legend'] = [(BAD, f'τάση έξω από {vmin:g}–{vmax:g} pu ({nb} ζυγοί) · φόρτιση πάνω από 100 % ({nbr} κλάδοι)'.replace('.', ',')), (GREY, 'μέσα στα όρια')]
        out['count'] = {'buses': int(nb), 'branches': int(nbr)}
        return out
    if layer == 'security':
        # 4.19.4 (the optimal power flow with security): every rated branch by its highest loading after the loss of any other
        # branch, at the dispatch that was found; 100 % is the rating a branch may carry after an outage
        sec = res.get('security') or {}
        post = sec.get('post') or {}
        if not post:
            return missing('Η στρώση ασφάλειας θέλει βέλτιστη ροή φορτίου με ασφάλεια N−1.')
        bind = {str(q.get('branch')) for q in sec.get('binding') or []}
        left = {str(q.get('branch')) for q in sec.get('unsecured') or []}
        vals = {str(k): 100.0 * float(x[0]) for k, x in post.items() if _num(x[0]) is not None}
        col = _scale(SEQUENTIAL, 0.0, 120.0)
        out['branch'], out['unit_branch'] = vals, '%'
        out['branch_color'] = {e['name']: BAD if e['name'] in left else col(vals.get(e['name'])) for e in v['branches']}
        out['bus_color'] = {b['id']: GREY for b in v['buses']}
        out['worst'] = {str(k): str(x[1]) for k, x in post.items()}
        out['count'] = {'binding': len(bind), 'unsecured': len(left)}
        out['legend'] = [(col(s), f'{int(s - 10)}–{int(s + 10)} %') for s in (10, 30, 50, 70, 90)] + [
            (BAD, f'πάνω από το όριο μετά από διαταραχή: καμία κατανομή δεν το καλύπτει ({len(left)} κλάδοι)')]
        out['note_base'] = f'Στο όριο μετά από διαταραχή (περιορισμοί ασφάλειας που δεσμεύουν): {len(bind)} κλάδοι.'
        return out
    # N−1: every branch coloured by what its loss does ('name' of an outage is the branch that is lost; 'branch' the most
    # loaded one after it). A low voltage counts only when the outage makes it lower than in the base case
    outs = res.get('outages') or []
    if not outs:
        return missing('Η στρώση N−1 θέλει μελέτη N−1.')
    base = res.get('base') or {}
    base_v = _num(base.get('Vmin'))
    # an overload counts when the outage makes it: a branch that was within its rating, or one already over it that goes
    # two points of loading higher (a network whose base case has overloads would otherwise be red everywhere)
    base_ov = {str(q[0]): float(q[1]) for q in (base.get('overloads') or []) if isinstance(q, (list, tuple)) and len(q) == 2}
    by = {}
    for o in outs:
        nm = str(o.get('name'))
        ov, vm = o.get('overloads') or [], _num(o.get('Vmin'))
        new = [q for q in ov if isinstance(q, (list, tuple)) and len(q) == 2 and float(q[1]) > base_ov.get(str(q[0]), 1.0) + (0.02 if str(q[0]) in base_ov else 0.0)]
        if o.get('island'):
            by[nm] = (3.0, '#7570b3')
        elif o.get('converged') is False:
            by[nm] = (4.0, '#000000')
        elif new:
            by[nm] = (2.0, BAD)
        elif vm is not None and vm < 0.95 and (base_v is None or vm < base_v - 0.005):
            by[nm] = (1.0, WARN)
        else:
            by[nm] = (0.0, GREY)
    out['branch'] = {k: x[0] for k, x in by.items()}
    out['branch_color'] = {e['name']: by.get(e['name'], (0.0, GREY))[1] for e in v['branches']}
    out['bus_color'] = {b['id']: GREY for b in v['buses']}
    if dc:                                                    # 4.21: N−1 AC/DC: a DC line, a station, a DC/DC converter lost
        for e in dc['lines']:
            if e['name'] in by:
                out['dc_line_color'][e['name']], out['dc_line'][e['name']] = by[e['name']][1], by[e['name']][0]
        for q in dc['stations']:
            if q['name'] in by:
                out['dc_station_color'][q['name']], out['dc_station'][q['name']] = by[q['name']][1], by[q['name']][0]
    cnt = lambda s: sum(1 for x in by.values() if x[0] == s)     # noqa: E731
    out['count'] = {'failed': cnt(4.0), 'island': cnt(3.0), 'overload': cnt(2.0), 'voltage': cnt(1.0), 'clear': cnt(0.0)}
    if base_ov:
        out['note_base'] = (f'{len(base_ov)} κλάδοι είναι' if len(base_ov) > 1 else 'Ένας κλάδος είναι') + ' πάνω από την ονομαστική του ισχύ ήδη πριν από κάθε διαταραχή· μετρά ό,τι προσθέτει η διαταραχή.'
    out['legend'] = [('#000000', f'δεν συγκλίνει ({cnt(4.0)})'), ('#7570b3', f'αφήνει νησίδα ({cnt(3.0)})'), (BAD, f'υπερφορτίζει άλλον κλάδο ({cnt(2.0)})'),
                     (WARN, f'ρίχνει τάση κάτω από 0,95 pu ({cnt(1.0)})'), (GREY, f'χωρίς παραβίαση ({cnt(0.0)})')]
    return out


def _maybe_int(s):
    try:
        return int(s)
    except (TypeError, ValueError):
        return s


DEFAULT = {'sc': 'sc', 'pf': 'voltage', 'n1': 'n1', 'n1dc': 'n1', 'opf': 'lmp', 'dcopf': 'lmp', 'scopf': 'security', 'cpf': 'collapse', 'se': 'residual', 'harmonic': 'thd', 'unbalanced': 'unbalance'}     # the layer a study opens with


def pack(v, result=None, layers=None):
    """The layers that a result can feed, in a compact form for the browser: per layer the colours as indices into a small
    palette and the values as lists in the order of the buses and of the branches of the view.

    [{'layer', 'title', 'unit_bus', 'unit_branch', 'legend': [[colour, text]…], 'palette': [colour…], 'bus_c': [i…],
      'branch_c': [i…], 'bus_v': [x | None…] or None, 'branch_v': […] or None}]. The base layer is always there."""
    out = []
    for layer in (layers or LAYERS):
        L = values(v, result, layer)
        if L['note'] and layer != 'base':
            continue
        pal = sorted(set(L['bus_color'].values()) | set(L['branch_color'].values()))
        dc = v.get('dc')
        if dc:                                                # 4.20.1: the colours of the DC grid in the same palette
            pal = sorted(set(pal) | set(L['dc_bus_color'].values()) | set(L['dc_line_color'].values()) | set(L['dc_station_color'].values()))
        ix = {c: i for i, c in enumerate(pal)}
        rnd = lambda x: None if x is None else float(f'{x:.6g}')      # noqa: E731
        out.append({'layer': layer, 'title': L['title'], 'unit_bus': L['unit_bus'], 'unit_branch': L['unit_branch'], 'legend': [list(q) for q in L['legend']], 'palette': pal,
                    'bus_c': [ix[L['bus_color'].get(b['id'], GREY)] if L['bus_color'].get(b['id'], GREY) in ix else 0 for b in v['buses']],
                    'branch_c': [ix[L['branch_color'].get(e['name'], GREY)] if L['branch_color'].get(e['name'], GREY) in ix else 0 for e in v['branches']],
                    'bus_v': [rnd(L['bus'].get(b['id'])) for b in v['buses']] if L['bus'] else None,
                    'branch_v': [rnd(L['branch'].get(e['name'])) for e in v['branches']] if L['branch'] else None})
        if dc:
            c = lambda d, k: ix.get(_col(d.get(k, GREY)), ix.get(GREY, 0))     # noqa: E731
            out[-1]['dc'] = {'unit_bus': L['unit_dc_bus'], 'unit_line': L['unit_dc_line'], 'unit_station': L['unit_dc_station'],
                             'bus_c': [c(L['dc_bus_color'], b['id']) for b in dc['buses']], 'line_c': [c(L['dc_line_color'], e['name']) for e in dc['lines']],
                             'station_c': [c(L['dc_station_color'], q['name']) for q in dc['stations']],
                             'bus_v': [rnd(L['dc_bus'].get(b['id'])) for b in dc['buses']] if L['dc_bus'] else None,
                             'line_v': [rnd(L['dc_line'].get(e['name'])) for e in dc['lines']] if L['dc_line'] else None,
                             'station_v': [rnd(L['dc_station'].get(q['name'])) for q in dc['stations']] if L['dc_station'] else None}
    return out


# ---------------------------------------------------------------- SVG
def _esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def _segments(v):
    """The line of every branch: parallel branches side by side, 0,12 of a unit apart."""
    pos = {b['id']: (b['x'], b['y']) for b in v['buses']}
    for e in v['branches']:
        (x1, y1), (x2, y2) = pos[e['a']], pos[e['b']]
        if e['of'] > 1:
            dx, dy = x2 - x1, y2 - y1
            L = math.hypot(dx, dy) or 1.0
            off = (e['k'] - (e['of'] + 1) / 2) * 0.12 * v['unit']
            x1, y1, x2, y2 = x1 - dy / L * off, y1 + dx / L * off, x2 - dy / L * off, y2 + dx / L * off
        yield e, x1, y1, x2, y2


def _dc_segments(v):
    """4.20.1: the line of every DC line, parallel ones side by side as the AC branches."""
    dc = v.get('dc') or {}
    pos = {b['id']: (b['x'], b['y']) for b in dc.get('buses', [])}
    for e in dc.get('lines', []):
        if e['a'] not in pos or e['b'] not in pos:
            continue
        (x1, y1), (x2, y2) = pos[e['a']], pos[e['b']]
        if e.get('of', 1) > 1:
            dx, dy = x2 - x1, y2 - y1
            L = math.hypot(dx, dy) or 1.0
            off = (e['k'] - (e['of'] + 1) / 2) * 0.12 * v['unit']
            x1, y1, x2, y2 = x1 - dy / L * off, y1 + dx / L * off, x2 - dy / L * off, y2 + dx / L * off
        yield e, x1, y1, x2, y2


def _dc_stations(v):
    """4.20.1: every converter station as the link from its AC bus to its DC bus (the station is drawn at its middle)."""
    dc = v.get('dc') or {}
    pos = {b['id']: (b['x'], b['y']) for b in dc.get('buses', [])}
    apos = {b['id']: (b['x'], b['y']) for b in v['buses']}
    for q in dc.get('stations', []):
        if q['ac'] in apos and q['dc'] in pos:
            yield (q,) + tuple(apos[q['ac']]) + tuple(pos[q['dc']])


_HEX = __import__('re').compile(r'^#[0-9a-fA-F]{6}$')


def _col(c):
    """A colour as it goes into the picture: only #rrggbb (a view or a layer may come from a file)."""
    return c if isinstance(c, str) and _HEX.match(c) else GREY


def svg(v, result=None, layer='base', width=900, labels=None, title=None, L=None, standalone=False):
    """The view as an SVG picture (a string): branches, buses (a generator bus as a ring, the slack bus larger), transformers
    with a mark at their middle, a DC grid (4.20.1: DC buses as squares, DC lines thicker, every converter station as a square
    with a diagonal on the link to its AC bus), and the legend under the drawing. labels: None (names where the buses are few), True or
    False. L: the layer as values() gave it (then result and layer are not used). standalone: with the XML namespace, for a
    file of its own; without it the picture goes inside an HTML page."""
    L = L if L is not None else values(v, result, layer)
    layer = L.get('layer', layer)
    x0, y0, x1, y1 = [float(q) for q in v['bounds']]
    u = float(v['unit'])
    pad = 0.6 * u
    w, h = (x1 - x0) + 2 * pad, (y1 - y0) + 2 * pad
    k = w / max(width, 1)                                    # drawing units per pixel
    n = len(v['buses'])
    r = max(0.05 * u, min(0.16 * u, 2.9 * k))                # a bus at least a few pixels wide
    lw = max(0.02 * u, 1.1 * k)
    labels = n <= 120 if labels is None else labels
    fs = max(0.16 * u, 9 * k)
    # the legend under the drawing, in rows that fit the width
    lf, items, rows, cur, used = 12 * k, [(_col(c), str(s)) for c, s in (L.get('legend') or [])], [[]], 0.0, 0.0
    head = str(title or L.get('title') or '')
    cur = (len(head) * 0.62 + 1.5) * lf
    for c, s in items:
        wi = (len(s) * 0.58 + 2.6) * lf
        if cur + wi > w - pad and rows[-1]:
            rows.append([])
            cur = 0.0
        rows[-1].append((cur, c, s))
        cur += wi
    note = str(L.get('note') or L.get('note_base') or '')
    lh = 1.7 * lf
    leg_h = lh * (len(rows) + (1 if note else 0)) + 0.6 * lf
    H = h + leg_h
    ns = ' xmlns="http://www.w3.org/2000/svg"' if standalone else ''
    o = [f'<svg{ns} class="netview" viewBox="{x0 - pad:.1f} {y0 - pad:.1f} {w:.1f} {H:.1f}" width="{width:g}" height="{max(120.0, width * H / w):.0f}" role="img" aria-label="{_esc(head)}">',
         f'<rect x="{x0 - pad:.1f}" y="{y0 - pad:.1f}" width="{w:.1f}" height="{H:.1f}" fill="#ffffff"/>']
    geo = v.get('geo')
    if geo:                                                  # 4.22 (pcl.geo): on the map, the graticule under everything
        o.extend(_graticule(geo, x0 - pad, y0 - pad, w, h, lw, fs))
    routes = (geo or {}).get('routes') or {}
    bv, brv = L.get('bus') or {}, L.get('branch') or {}
    bc, brc = L.get('bus_color') or {}, L.get('branch_color') or {}
    fmt = lambda x, unit: (f' · {float(x):.4g} {_esc(unit)}'.replace('.', ',') if unit else f' · {float(x):.4g}'.replace('.', ','))     # noqa: E731
    for j, (e, ax, ay, bx, by) in enumerate(_segments(v)):
        c = _col(brc.get(e['name'], GREY))
        hot = c != GREY and layer != 'base'
        tip = f'{_esc(e["name"])}: {_esc(e["a"])} – {_esc(e["b"])}' + (fmt(brv[e['name']], L.get('unit_branch', '')) if _num(brv.get(e['name'])) is not None else '')
        rt = routes.get(str(j))
        if rt and not e.get('off'):                          # 4.22: a branch with a route, along its route
            pts = ' '.join(f'{float(p[0]):.2f},{float(p[1]):.2f}' for p in rt)
            o.append(f'<polyline points="{pts}" fill="none" stroke="{c}" stroke-width="{lw * (2.2 if hot else 1):.2f}" stroke-linecap="round" stroke-linejoin="round"><title>{tip}</title></polyline>')
            if e.get('trafo'):
                mx, my = route_mid(rt)
                o.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="{0.6 * r:.2f}" fill="#ffffff" stroke="{c}" stroke-width="{lw:.2f}"/>')
            continue
        if e.get('off'):                                     # out of service: dashed, at its place, without a value
            o.append(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{bx:.1f}" y2="{by:.1f}" stroke="#7a7a7a" stroke-width="{lw:.2f}" stroke-dasharray="{4 * lw:.2f} {4 * lw:.2f}">'
                     f'<title>{_esc(e["name"])}: {_esc(e["a"])} – {_esc(e["b"])} · εκτός λειτουργίας</title></line>')
            continue
        o.append(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{bx:.1f}" y2="{by:.1f}" stroke="{c}" stroke-width="{lw * (2.2 if hot else 1):.2f}" stroke-linecap="round"><title>{tip}</title></line>')
        if e.get('trafo'):
            o.append(f'<circle cx="{(ax + bx) / 2:.1f}" cy="{(ay + by) / 2:.1f}" r="{0.6 * r:.2f}" fill="#ffffff" stroke="{c}" stroke-width="{lw:.2f}"/>')
    dc = v.get('dc')
    if dc:                                                   # 4.20.1: the DC grid: stations on their links, DC lines, DC buses as squares
        dv, dlv, dsv = L.get('dc_bus') or {}, L.get('dc_line') or {}, L.get('dc_station') or {}
        dbc, dlc, dsc = L.get('dc_bus_color') or {}, L.get('dc_line_color') or {}, L.get('dc_station_color') or {}
        st = list(_dc_stations(v))
        for q, ax, ay, bx, by in st:
            o.append(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{bx:.1f}" y2="{by:.1f}" stroke="{STATION}" stroke-width="{lw:.2f}"/>')
        for e, ax, ay, bx, by in _dc_segments(v):
            c = _col(dlc.get(e['name'], GREY))
            hot = c != GREY and layer != 'base'
            tip = f'{_esc(e["name"])}: {_esc(e["a"])} – {_esc(e["b"])} (DC)' + (fmt(dlv[e['name']], L.get('unit_dc_line', '')) if _num(dlv.get(e['name'])) is not None else '')
            if e.get('kind') == 'dcdc':                  # 4.21: a DC/DC converter: its link and a square with both diagonals at its middle
                tip = f'Μετατροπέας DC/DC {_esc(e["name"])}: {_esc(e["a"])} → {_esc(e["b"])} · {_esc(DCDC_CONTROL.get(e.get("control"), e.get("control", "")))}' + (
                    fmt(dlv[e['name']], L.get('unit_dc_line', '')) if _num(dlv.get(e['name'])) is not None else '')
            o.append(f'<line class="dc" x1="{ax:.1f}" y1="{ay:.1f}" x2="{bx:.1f}" y2="{by:.1f}" stroke="{c}" stroke-width="{lw * (2.2 if hot else 1.6):.2f}" stroke-linecap="round"><title>{tip}</title></line>')
            if e.get('kind') == 'dcdc':
                mx, my, hs = (ax + bx) / 2, (ay + by) / 2, 0.75 * r
                o.append(f'<g class="dcdc"><title>{tip}</title><rect x="{mx - hs:.1f}" y="{my - hs:.1f}" width="{2 * hs:.2f}" height="{2 * hs:.2f}" fill="#ffffff" stroke="{c if hot else STATION}" stroke-width="{lw:.2f}"/>'
                         f'<path d="M{mx - hs:.1f},{my + hs:.1f}L{mx + hs:.1f},{my - hs:.1f}M{mx - hs:.1f},{my - hs:.1f}L{mx + hs:.1f},{my + hs:.1f}" stroke="{c if hot else STATION}" stroke-width="{lw:.2f}" fill="none"/></g>')
        for q, ax, ay, bx, by in st:
            c = _col(dsc.get(q['name'], STATION))
            mx, my, hs = (ax + bx) / 2, (ay + by) / 2, 0.75 * r
            tip = (f'{_esc(q["name"])}: {_esc(q["ac"])} – {_esc(q["dc"])} · {_esc(CONTROL.get(q.get("control"), q.get("control", "")))}'
                   + (fmt(dsv[q['name']], L.get('unit_dc_station', '')) if _num(dsv.get(q['name'])) is not None else ''))
            o.append(f'<g class="station"><title>{tip}</title><rect x="{mx - hs:.1f}" y="{my - hs:.1f}" width="{2 * hs:.2f}" height="{2 * hs:.2f}" fill="#ffffff" stroke="{c}" stroke-width="{lw:.2f}"/>'
                     f'<line x1="{mx - hs:.1f}" y1="{my + hs:.1f}" x2="{mx + hs:.1f}" y2="{my - hs:.1f}" stroke="{c}" stroke-width="{lw:.2f}"/></g>')
        for b in dc['buses']:
            c = _col(dbc.get(b['id'], GREY))
            un = _num(b.get('Un')) or 0.0
            tip = _esc(b['id']) + (f' · ±{un / 2e3:g} kV DC' if un else ' · DC') + (fmt(dv[b['id']], L.get('unit_dc_bus', '')) if _num(dv.get(b['id'])) is not None else '')
            hs = 0.8 * r
            o.append(f'<rect class="dc" x="{float(b["x"]) - hs:.1f}" y="{float(b["y"]) - hs:.1f}" width="{2 * hs:.2f}" height="{2 * hs:.2f}" fill="{c}" stroke="#5f6b6d" stroke-width="{0.25 * lw:.2f}"><title>{tip}</title></rect>')
            if labels:
                o.append(f'<text x="{float(b["x"]) + 1.2 * r:.1f}" y="{float(b["y"]) - 1.2 * r:.1f}" font-size="{fs:.1f}" font-family="sans-serif" fill="#333333">{_esc(b["id"])}</text>')
    for b in v['buses']:
        c = _col(bc.get(b['id'], GREY))
        rr = r * (1.5 if b.get('type') == 'slack' else 1.0)
        un = _num(b.get('Un')) or 0.0
        tip = _esc(b['id']) + (f' · {un / 1e3:g} kV' if un else '') + (fmt(bv[b['id']], L.get('unit_bus', '')) if _num(bv.get(b['id'])) is not None else '')
        if b.get('gen'):
            o.append(f'<circle cx="{float(b["x"]):.1f}" cy="{float(b["y"]):.1f}" r="{rr:.2f}" fill="#ffffff" stroke="{c}" stroke-width="{0.45 * rr:.2f}"><title>{tip}</title></circle>')
        else:
            o.append(f'<circle cx="{float(b["x"]):.1f}" cy="{float(b["y"]):.1f}" r="{0.8 * rr:.2f}" fill="{c}" stroke="#5f6b6d" stroke-width="{0.25 * lw:.2f}"><title>{tip}</title></circle>')
        if labels:
            o.append(f'<text x="{float(b["x"]) + 1.2 * rr:.1f}" y="{float(b["y"]) - 1.2 * rr:.1f}" font-size="{fs:.1f}" font-family="sans-serif" fill="#333333">{_esc(b["id"])}</text>')
    if geo:                                                  # 4.22: the scale bar, at the bottom left of the map
        o.extend(_scalebar(x0 - pad, y1 + pad, w, lw, fs))
    ly = y1 + pad + 1.1 * lf
    o.append(f'<text x="{x0 - pad + 0.6 * lf:.1f}" y="{ly:.1f}" font-size="{lf:.1f}" font-family="sans-serif" font-weight="bold" fill="#222222">{_esc(head)}</text>')
    xl = x0 - pad + 0.6 * lf
    for q, row in enumerate(rows):
        for cx_, c, s in row:
            xx = xl + ((len(head) * 0.62 + 1.5) * lf if q == 0 else 0.0) + (cx_ - ((len(head) * 0.62 + 1.5) * lf if q == 0 else 0.0))
            o.append(f'<rect x="{xx:.1f}" y="{ly + q * lh - 0.8 * lf:.1f}" width="{0.9 * lf:.1f}" height="{0.9 * lf:.1f}" fill="{c}"/>'
                     f'<text x="{xx + 1.3 * lf:.1f}" y="{ly + q * lh:.1f}" font-size="{lf:.1f}" font-family="sans-serif" fill="#333333">{_esc(s)}</text>')
    if note:
        o.append(f'<text x="{xl:.1f}" y="{ly + len(rows) * lh:.1f}" font-size="{0.92 * lf:.1f}" font-family="sans-serif" fill="#666666">{_esc(note)}</text>')
    o.append('</svg>')
    return ''.join(o)


def _graticule(geo, X0, Y0, W, H, lw, fs):
    """4.22: the meridians and parallels of a map view (pcl.geo.project), cut to the frame, with their degrees at its edge."""
    o, last = [], -math.inf
    for g in geo.get('grid') or ():
        (ax, ay), (bx, by) = g['pts']
        if g['k'] == 'lon':
            if not X0 <= ax <= X0 + W:
                continue
            o.append(f'<line class="grat" x1="{ax:.2f}" y1="{Y0:.2f}" x2="{bx:.2f}" y2="{Y0 + H:.2f}" stroke="#e3e9e7" stroke-width="{0.6 * lw:.2f}"/>')
            tw = len(g['t']) * 0.58 * 0.8 * fs                # a label where it does not run into the one before
            if ax + 0.3 * fs > last + 0.6 * fs:
                o.append(f'<text x="{ax + 0.3 * fs:.2f}" y="{Y0 + 1.1 * fs:.2f}" font-size="{0.8 * fs:.2f}" font-family="sans-serif" fill="#8a9a96">{_esc(g["t"])}</text>')
                last = ax + 0.3 * fs + tw
        else:
            if not Y0 <= ay <= Y0 + H:
                continue
            o.append(f'<line class="grat" x1="{X0:.2f}" y1="{ay:.2f}" x2="{X0 + W:.2f}" y2="{by:.2f}" stroke="#e3e9e7" stroke-width="{0.6 * lw:.2f}"/>'
                     f'<text x="{X0 + 0.3 * fs:.2f}" y="{ay - 0.3 * fs:.2f}" font-size="{0.8 * fs:.2f}" font-family="sans-serif" fill="#8a9a96">{_esc(g["t"])}</text>')
    return o


def route_mid(pts):
    """4.22: the point half way along a polyline."""
    d = [math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) for i in range(1, len(pts))]
    h, acc = sum(d) / 2, 0.0
    for i, q in enumerate(d):
        if acc + q >= h and q > 0:
            t = (h - acc) / q
            return pts[i][0] + t * (pts[i + 1][0] - pts[i][0]), pts[i][1] + t * (pts[i + 1][1] - pts[i][1])
        acc += q
    return tuple(pts[0])


def scale_bar(width_km):
    """4.22: a round length for a scale bar about a fifth of a map width_km wide: 1, 2 or 5 × 10ⁿ km."""
    t = max(width_km, 1e-9) / 5
    e = 10 ** math.floor(math.log10(t))
    return next(k * e for k in (5, 2, 1) if k * e <= t * 1.0000001)


def _scalebar(X0, Yb, W, lw, fs):
    L = scale_bar(W)
    x, y = X0 + 0.6 * fs, Yb - 0.8 * fs
    t = (f'{L:g} km' if L >= 1 else f'{L * 1e3:g} m').replace('.', ',')
    return [f'<g class="scalebar"><path d="M{x:.2f},{y - 0.4 * fs:.2f}V{y:.2f}H{x + L:.2f}V{y - 0.4 * fs:.2f}" fill="none" stroke="#5f6b6d" stroke-width="{lw:.2f}"/>'
            f'<text x="{x + L / 2:.2f}" y="{y - 0.6 * fs:.2f}" font-size="{0.85 * fs:.2f}" font-family="sans-serif" text-anchor="middle" fill="#5f6b6d">{t}</text></g>']


# ---------------------------------------------------------------- DXF
def dxf(v, result=None, layers=('voltage', 'flow')):
    """The view as a DXF drawing (ASCII, the R12 subset that every CAD program reads; from there it saves as DWG).

    CAD layers: BUSES (circles), BUS_NAMES (text), BRANCHES (lines), TRANSFORMERS (a circle at the middle of the branch),
    GENERATORS (a ring around the bus), LOADS (a short tick), with a DC grid (4.20.1) also DC_BUSES (squares), DC_BUS_NAMES,
    DC_LINES and STATIONS (the link of a station to its AC bus, the station as a square with a diagonal at its middle),
    and for every layer asked a text layer with its values
    (V_PU, ANGLE_DEG, LMP on the buses; FLOW_MW, LOADING_PCT on the branches), so that the user switches on what the drawing
    should show. y grows upwards in a CAD drawing, so the picture is mirrored to look as on the screen."""
    u = v['unit']
    r = 0.14 * u
    th = 0.16 * u
    ent, used = [], []

    def lay(name, color):
        if name not in [q[0] for q in used]:
            used.append((name, color))
        return name

    def line(layer, x1, y1, x2, y2):
        ent.extend(['0', 'LINE', '8', layer, '10', f'{x1:.3f}', '20', f'{-y1:.3f}', '30', '0.0', '11', f'{x2:.3f}', '21', f'{-y2:.3f}', '31', '0.0'])

    def circle(layer, x, y, rad):
        ent.extend(['0', 'CIRCLE', '8', layer, '10', f'{x:.3f}', '20', f'{-y:.3f}', '30', '0.0', '40', f'{rad:.3f}'])

    def text(layer, x, y, s, hgt=th):
        s = ''.join(ch if 31 < ord(ch) < 127 else '?' for ch in str(s))      # R12 text is ASCII
        ent.extend(['0', 'TEXT', '8', layer, '10', f'{x:.3f}', '20', f'{-y:.3f}', '30', '0.0', '40', f'{hgt:.3f}', '1', s])

    lb, lbn, lbr, lt, lg, ll = lay('BUSES', 7), lay('BUS_NAMES', 8), lay('BRANCHES', 5), lay('TRANSFORMERS', 6), lay('GENERATORS', 3), lay('LOADS', 2)
    mid = {}
    for e, ax, ay, bx, by in _segments(v):
        if e.get('off'):                                     # out of service: on a CAD layer of its own
            line(lay('OUT_OF_SERVICE', 8), ax, ay, bx, by)
            continue
        line(lbr, ax, ay, bx, by)
        mid[e['name']] = ((ax + bx) / 2, (ay + by) / 2)
        if e['trafo']:
            circle(lt, *mid[e['name']], 0.6 * r)
    for b in v['buses']:
        circle(lb, b['x'], b['y'], r * (1.5 if b['type'] == 'slack' else 1.0))
        text(lbn, b['x'] + 1.3 * r, b['y'] - 1.3 * r, b['id'])
        if b['gen']:
            circle(lg, b['x'], b['y'], 1.9 * r)
        if b['load']:
            line(ll, b['x'], b['y'] + r, b['x'], b['y'] + 2.6 * r)
    dc = v.get('dc')
    dmid, smid = {}, {}
    if dc:                                                   # 4.20.1: the DC grid on CAD layers of its own

        def square(layer, x, y, hw):
            for (p, q), (p2, q2) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
                line(layer, x + p * hw, y + q * hw, x + p2 * hw, y + q2 * hw)
        lst, ldl, ldb, ldn = lay('STATIONS', 8), lay('DC_LINES', 6), lay('DC_BUSES', 6), lay('DC_BUS_NAMES', 8)
        for q, ax, ay, bx, by in _dc_stations(v):
            line(lst, ax, ay, bx, by)
            mx, my = smid[q['name']] = ((ax + bx) / 2, (ay + by) / 2)
            square(lst, mx, my, 0.75 * r)
            line(lst, mx - 0.75 * r, my + 0.75 * r, mx + 0.75 * r, my - 0.75 * r)
        for e, ax, ay, bx, by in _dc_segments(v):
            line(ldl, ax, ay, bx, by)
            dmid[e['name']] = ((ax + bx) / 2, (ay + by) / 2)
            if e.get('kind') == 'dcdc':                  # 4.21: the mark of a DC/DC converter on the layer of the stations
                mx, my = dmid[e['name']]
                square(lst, mx, my, 0.75 * r)
                line(lst, mx - 0.75 * r, my + 0.75 * r, mx + 0.75 * r, my - 0.75 * r)
                line(lst, mx - 0.75 * r, my - 0.75 * r, mx + 0.75 * r, my + 0.75 * r)
        for b in dc['buses']:
            square(ldb, b['x'], b['y'], 0.8 * r)
            text(ldn, b['x'] + 1.3 * r, b['y'] - 1.3 * r, b['id'])
    names = {'voltage': ('V_PU', 1, '{:.3f}'), 'angle': ('ANGLE_DEG', 4, '{:.2f}'), 'lmp': ('LMP', 30, '{:.2f}'), 'flow': ('FLOW_MW', 1, '{:.1f}'), 'loading': ('LOADING_PCT', 30, '{:.0f}')}
    drawn = []
    for k, layer in enumerate(layers or ()):
        if layer not in names:
            continue
        L = values(v, result, layer)
        nm, col, fmt = names[layer]
        dcs = L.get('dc_bus') or {}, L.get('dc_line') or {}, L.get('dc_station') or {}
        if not L['bus'] and not L['branch'] and not any(dcs):
            continue
        lay(nm, col)
        drawn.append(layer)
        dy = (1.6 + 1.3 * len([q for q in drawn if q in ('voltage', 'angle', 'lmp')])) * th if (L['bus'] or dcs[0]) else 0.0
        for b in v['buses']:
            if b['id'] in L['bus']:
                text(nm, b['x'] + 1.3 * r, b['y'] - 1.3 * r + dy, fmt.format(L['bus'][b['id']]), 0.8 * th)
        dyb = 1.1 * th * len([q for q in drawn if q in ('flow', 'loading')])
        for e in v['branches']:
            if e['name'] in L['branch'] and e['name'] in mid:
                text(nm, mid[e['name']][0] + 0.5 * r, mid[e['name']][1] + dyb, fmt.format(L['branch'][e['name']]), 0.8 * th)
        if dc:                                               # the values of the DC grid on the same CAD layer
            for b in dc['buses']:
                if b['id'] in dcs[0]:
                    text(nm, b['x'] + 1.3 * r, b['y'] - 1.3 * r + dy, fmt.format(dcs[0][b['id']]), 0.8 * th)
            for k, at in ((1, dmid), (2, smid)):
                for q, x in dcs[k].items():
                    if q in at:
                        text(nm, at[q][0] + 0.9 * r, at[q][1] + dyb, fmt.format(x), 0.8 * th)
    x0, y0, x1, y1 = v['bounds']
    head = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '9', '$EXTMIN', '10', f'{x0 - u:.3f}', '20', f'{-y1 - u:.3f}', '9', '$EXTMAX', '10', f'{x1 + u:.3f}', '20',
            f'{-y0 + u:.3f}', '0', 'ENDSEC']
    tab = ['0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LTYPE', '70', '1', '0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0', '0', 'ENDTAB',
           '0', 'TABLE', '2', 'LAYER', '70', str(len(used))]
    for nm, col in used:
        tab.extend(['0', 'LAYER', '2', nm, '70', '0', '62', str(col), '6', 'CONTINUOUS'])
    tab.extend(['0', 'ENDTAB', '0', 'ENDSEC'])
    return '\n'.join(head + tab + ['0', 'SECTION', '2', 'ENTITIES'] + ent + ['0', 'ENDSEC', '0', 'EOF']) + '\n'
