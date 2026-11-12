"""Composition of speed control for any machine of the app, with a neural network (4.7, ROADMAP «Τι προτείνω» 4.7.4, §46).

The logic of the external Python GUI (pcl/gui.py), without a window, so that it is tested headless:

    import pcl.designer as D
    ms = D.machines()                                    # from the app (link) or from web/studio/parts.js (Node)
    p = D.compose(ms[0], 'pinn')                         # a pcl.Project: the circuit with real wires
    out = D.design(ms[0], {'iae': 1, 'overshoot': .5}, controller='auto')
    out['best']['project'].save('design.pcl.json')       # or app.load(...) through the link

Rules of composition by KIND of machine (not by machine): each kind has a base circuit, the app's tutorial with the
power stage and the inner loops of that kind (DC: voltage from a signal; induction: inverter and field-oriented
control; synchronous: inverter, dq control and MTPA; SRM: asymmetric converter with hysteresis), whose speed loop is a
PI (block PIS, or PI1). A machine added later to web/studio/parts.js with a descriptor of a known kind is put in place
of the base machine (its own type and parameters) and gets the same control. The speed loop is then augmented:

* the reference ω* goes through a first-order filter (ω_r, and its derivative α_r = (ω* − ω_r)·2π·f_c), and the PI
  follows ω_r,
* 'pinn': a network block NN gives a command from (ω_r, α_r), added to the PI's output, learning online from the PI's
  output (feedback-error learning, as in the tutorial nn_compare),
* 'inv': the same network with fixed weights of an inverse model, learned offline from a run with excitation (ω, α
  measured → the command the PI gave),
* 'pi': the PI alone (the reference for the comparison), with its bandwidth scaled.

The goals (IAE, ISE, overshoot, settling, control effort, load disturbance) are measured on the same reference profile
(steps over the speed range, a load step in the last cycle), each divided by its value for the base PI, and weighted:
J = Σ w_k·m_k/m_k(PI). design() tries a few candidates (the PI's bandwidth, the network's learning rate, the inverse
model) in parallel and returns them sorted by J.
"""
import concurrent.futures as cf
import copy
import math

from .core import PclError, Project, machines as _machines_node, tutorial

# ------------------------------------------------------------------ rules by kind
RULES = {
    'dc': {'tutorial': 'nn_compare', 'options': {'ctrl': 'pi', 'load': 'fan'}, 'pi': 'PI1', 'err': 'E1', 'ref': 'KW',
           'filt': ('LP', 'GA'), 'sum': 'U1', 'P': 1.6, 'wmax': 150, 'loadk': 'KL', 'base': 'μηχανή ΣΡ από πηγή τάσης ελεγχόμενη από σήμα (μέση τιμή τσόπερ)'},
    'induction': {'tutorial': 'im_foc', 'options': {'wref': '100', 'rr': '1'}, 'pi': 'PIS', 'err': 'SW1', 'ref': 'KW', 'P': .5, 'wmax': 100,
                  'base': 'αντιστροφέας 600 V, διανυσματικός έλεγχος με εκτιμητή ροής, βρόχοι i_d, i_q'},
    'sync': {'tutorial': 'pmsm', 'options': {'mach': 'ipm', 'strat': 'mtpa'}, 'pi': 'PIS', 'err': 'SW1', 'ref': 'KW', 'P': .4, 'wmax': 100,
             'base': 'αντιστροφέας 600 V, έλεγχος dq με MTPA'},
    'srm': {'tutorial': 'srm', 'options': {}, 'pi': 'PIS', 'err': 'SW1', 'ref': 'KW', 'P': .4, 'wmax': None,
            'base': 'ασύμμετρος μετατροπέας ανά φάση, ρεύμα με υστέρηση, γωνίες αγωγής'},
}
GOALS = [('iae', 'Ελάχιστο IAE (παρακολούθηση)'), ('ise', 'Ελάχιστο ISE (μεγάλα σφάλματα)'), ('overshoot', 'Ελάχιστη υπέρβαση'),
         ('settle', 'Γρήγορη αποκατάσταση'), ('effort', 'Ελάχιστη ενέργεια ελέγχου'), ('load', 'Ανοχή σε αλλαγή φορτίου')]
CONTROLLERS = [('pi', 'PI'), ('pinn', 'PI + νευρωνικό που μαθαίνει online'), ('inv', 'PI + αντίστροφο μοντέλο (νευρωνικό, offline)'),
               ('auto', 'Αυτόματα: ο καλύτερος για τους στόχους')]
FC = 5.0                                           # the reference filter, Hz


def machines(app=None):
    """The machines of the app: through the link when an app is given (pcl.link.App), else from parts.js in Node."""
    return app.machines() if app is not None else _machines_node()


def supported(machine):
    return (machine.get('kind') or '') in RULES


def rule_for(machine):
    k = machine.get('kind')
    if k not in RULES:
        raise PclError(f'Δεν υπάρχει ακόμη κανόνας σύνθεσης για μηχανές του είδους «{k}» ({machine.get("name", machine.get("type"))}). '
                       'Οι γεννήτριες έρχονται στην 4.8 (ROADMAP §46).')
    return RULES[k]


# ------------------------------------------------------------------ editing a project
def _comp(d, cid):
    for c in d['components']:
        if c['id'] == cid:
            return c
    raise PclError(f'Το κύκλωμα βάσης δεν έχει το {cid}.')


def _num(v, dflt=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return dflt


def _sched_max(v):
    try:
        return max(_num(x.split(':')[-1]) for x in str(v).split(','))
    except ValueError:
        return 0.0


def _wire(d, a, b, pts=None):
    n = 1 + max([int(w['id'][1:]) for w in d['wires'] if str(w['id']).startswith('w') and str(w['id'])[1:].isdigit()] or [0])
    (ac, ap), (bc, bp) = a.split(':'), b.split(':')
    d['wires'].append({'id': f'w{n}', 'a': {'c': ac, 'p': ap}, 'b': {'c': bc, 'p': bp}, 'pts': pts or []})


def _add(d, cid, typ, x, y, params, label=None):
    d['components'].append({'id': cid, 'type': typ, 'x': x, 'y': y, 'rot': 0, 'flip': False, 'label': label or cid, 'params': params})


def _profile(cycles, P, wmax, seed_pat=(0, .67, 1.0, .33, .8)):
    out = []
    for r in range(cycles):
        for k, f in enumerate(seed_pat):
            out.append(f'{r * P + k * P / len(seed_pat):.4f}:{round(f * wmax, 3)}')
    return ', '.join(out)


def compose(machine, controller='pi', params=None, cycles=3, kb=1.0, lr=.005, opt='sgd', inv_net=None, profile=None, load_step=True):
    """The circuit for one machine and one controller, as a pcl.Project. params: the machine's parameters (else its
    defaults or the base's); kb: bandwidth of the PI (K_p·kb, K_i·kb²); lr/opt: learning of the online network;
    inv_net: weights of the inverse model (controller 'inv'); profile: the reference schedule (else steps over the
    speed range, cycles × P)."""
    rule = rule_for(machine)
    p = tutorial(rule['tutorial'], **rule['options'])
    d = p.data
    m1 = _comp(d, 'M1')
    if m1['type'] != machine['type']:                   # a machine of the same kind put in place of the base one
        defaults = {q['k']: q['def'] for q in machine.get('params', [])}
        keep = {k: v for k, v in m1['params'].items() if k in defaults and k in ('load', 'TL', 'w0', 'conn')}
        m1['type'], m1['params'] = machine['type'], {**defaults, **keep}
    if params:
        m1['params'].update(params)
    P = rule['P']
    wmax = rule['wmax'] or _sched_max(_comp(d, rule['ref'])['params'].get('v')) or 100.0
    T = cycles * P
    _comp(d, rule['ref'])['params']['v'] = profile or _profile(cycles, P, wmax)
    # a load step at the start of the last cycle (the goal «ανοχή σε αλλαγή φορτίου» measures it)
    tl = max(0.0, (cycles - 1) * P)
    if rule.get('loadk'):
        _comp(d, rule['loadk'])['params']['v'] = f'0:1, {tl:.4f}:2' if load_step and cycles > 1 else '1'
    elif 'TL' in m1['params']:
        TLb = _sched_max(m1['params']['TL']) or 1.0
        m1['params']['TL'] = f'0:0, {tl:.4f}:{TLb:g}' if load_step and cycles > 1 else '0'
    pi = _comp(d, rule['pi'])
    pi['params']['Kp'] = round(_num(pi['params'].get('Kp')) * kb, 6)
    pi['params']['Ki'] = round(_num(pi['params'].get('Ki')) * kb * kb, 6)
    _augment(d, rule, controller, lr, opt, inv_net, wmax)
    d.setdefault('sim', {})['stopT'] = round(T, 6)
    d['sim']['speed'] = d['sim'].get('speed') or 200
    wr = 'Y:' + (rule['filt'][0] if rule.get('filt') else 'NLP')
    panes = [[[wr, 'ω_r'], ['Y:M1', 'ω']], [['Y:' + rule['pi'], 'u_PI']] + ([['Y:NN1', 'u_NN']] if controller != 'pi' else [])]
    if controller == 'pinn':
        panes.append([['Y:NN1:L', 'L']])
    d['scope'] = {'panes': panes, 'window': {'unit': 's', 'n': T}}
    d['meta'] = {**(d.get('meta') or {}), 'designer': {'machine': machine['type'], 'kind': machine['kind'], 'controller': controller, 'kb': kb,
                                                     'lr': lr, 'cycles': cycles, 'P': P, 'wmax': wmax, 'tload': tl, 'pi': rule['pi']}}
    d.pop('tutorial', None)
    return Project(d, f'{machine["type"]}_{controller}')


def _augment(d, rule, controller, lr, opt, inv_net, wmax):
    """The reference filter (when the base has none) and the network block in parallel with the speed PI."""
    pi = _comp(d, rule['pi'])
    clock = pi['params'].get('clock')
    lo, hi = _num(pi['params'].get('ymin'), -1), _num(pi['params'].get('ymax'), 1)
    x0, y0 = pi.get('x', 0), pi.get('y', 0)
    if rule.get('filt'):
        wr, ar = rule['filt'][0] + ':y', rule['filt'][1] + ':y'
    else:                                           # ω* → LPF → ω_r (the PI follows it), α_r = (ω* − ω_r)·2π·f_c
        ref = rule['ref']
        _add(d, 'NLP', 'LPF', x0 - 120, y0 - 110, {'fc': FC}, f'{FC:g} Hz')
        _add(d, 'NDA', 'SUM', x0 - 20, y0 - 110, {'signs': '+-'}, 'ω* − ω_r')
        _add(d, 'NGA', 'GAIN', x0 + 80, y0 - 110, {'K': round(2 * math.pi * FC, 6)}, '2π·f_c')
        for w in d['wires']:                         # the PI's error from ω_r instead of ω*
            for e, f in (('a', 'b'), ('b', 'a')):
                if w[e]['c'] == ref and w[f]['c'] == rule['err']:
                    w[e] = {'c': 'NLP', 'p': 'y'}
        _wire(d, ref + ':y', 'NLP:u')
        _wire(d, ref + ':y', 'NDA:a')
        _wire(d, 'NLP:y', 'NDA:b')
        _wire(d, 'NDA:y', 'NGA:u')
        wr, ar = 'NLP:y', 'NGA:y'
    if controller == 'pi':
        return
    learn = controller == 'pinn'
    ys = max(abs(lo), abs(hi)) / (1 if rule.get('sum') else 2) or 1.0
    if rule.get('sum'):
        ys = 100.0                                   # the DC base: volts, as in the tutorial
    amax = wmax * 2 * math.pi * FC
    p = {'ins': 'wr, ar', 'xs': f'{wmax:g}, {amax:.6g}', 'hidden': '8', 'ys': ys, 'ymin': lo, 'ymax': hi,
         'train': 'err' if learn else 'off', 'opt': opt, 'lr': lr, 'clip': 5, 'nl': 400, 'init': 'zero', 'seed': 1,
         'clock': clock, 'trig': pi['params'].get('trig', 'start'), 'y0': 0}
    if not learn:
        if inv_net is None:
            raise PclError('Το αντίστροφο μοντέλο θέλει βάρη (train_inverse).')
        from .control import nn_text
        p['w'] = nn_text(inv_net)
    _add(d, 'NN1', 'NN', x0 + 100, y0 + 120, p, 'NN (μαθαίνει)' if learn else 'NN αντίστροφο')
    _wire(d, wr, 'NN1:wr')
    _wire(d, ar, 'NN1:ar')
    if learn:
        _wire(d, rule['pi'] + ':y', 'NN1:e')
    if rule.get('sum'):                             # the DC base already adds a second command at U1:b
        d['components'] = [c for c in d['components'] if c['id'] != 'K0']
        d['wires'] = [w for w in d['wires'] if 'K0' not in (w['a']['c'], w['b']['c'])]
        _wire(d, 'NN1:y', rule['sum'] + ':b')
        return
    # a sum after the PI: every wire from the PI's output (and every source parameter in_… = PI:y) now from the sum
    pid = rule['pi']
    _add(d, 'NNS', 'SUM', x0 + 90, y0 + 30, {'signs': '++'}, 'u_PI + u_NN')
    for w in d['wires']:
        for e in ('a', 'b'):
            if w[e]['c'] == pid and w[e]['p'] == 'y':
                w[e] = {'c': 'NNS', 'p': 'y'}
    for c in d['components']:
        for k, v in list((c.get('params') or {}).items()):
            if k.startswith('in_') and v == pid + ':y' and c['id'] not in ('NN1', 'NNS'):
                c['params'][k] = 'NNS:y'
    _wire(d, pid + ':y', 'NNS:a')
    _wire(d, 'NN1:y', 'NNS:b')
    if learn:                                        # the wire to NN1:e was moved with the others: back to the PI
        for w in d['wires']:
            for e, f in (('a', 'b'), ('b', 'a')):
                if w[e] == {'c': 'NNS', 'p': 'y'} and w[f] == {'c': 'NN1', 'p': 'e'}:
                    w[e] = {'c': pid, 'p': 'y'}


# ------------------------------------------------------------------ measurements and cost
def _interp(t, y, x):
    lo, hi = 0, len(t) - 1
    if x <= t[0]:
        return y[0]
    if x >= t[hi]:
        return y[hi]
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if t[mid] <= x:
            lo = mid
        else:
            hi = mid
    a = (x - t[lo]) / ((t[hi] - t[lo]) or 1)
    return y[lo] + a * (y[hi] - y[lo])


def metrics(res, meta):
    """IAE, ISE, overshoot (% of each step of the reference), settling (mean time to stay within 2 % of each step),
    control effort ∫u_PI² + u_NN² dt (normalised by the duration), largest speed dip after the load step."""
    t, w = res.t, res['Y:M1']
    wr = res['Y:LP'] if 'Y:LP' in res.keys else res['Y:NLP']
    u = res['Y:' + meta['pi']]
    un = res['Y:NN1'] if 'Y:NN1' in res.keys else [0.0] * len(t)
    iae = ise = eff = 0.0
    for i in range(1, len(t)):
        h = t[i] - t[i - 1]
        e0, e1 = wr[i - 1] - w[i - 1], wr[i] - w[i]
        iae += h * (abs(e0) + abs(e1)) / 2
        ise += h * (e0 * e0 + e1 * e1) / 2
        eff += h * ((u[i] + un[i]) ** 2)
    P, n, wmax, tl = meta['P'], 5, meta['wmax'], meta['tload']
    ov, st = [], []
    for r in range(meta['cycles']):
        for k in range(n):
            a = r * P + k * P / n
            b = a + P / n
            fin = _interp(t, wr, b - 1e-6)
            prev = _interp(t, wr, a - 1e-6) if a > 0 else 0.0
            step = fin - prev
            if abs(step) < .05 * wmax:
                continue
            seg = [(tt, ww) for tt, ww in zip(t, w) if a <= tt < b]
            if not seg:
                continue
            peak = max((ww - fin) * (1 if step > 0 else -1) for _, ww in seg)
            ov.append(max(0.0, 100 * peak / abs(step)))
            band, ts = .02 * abs(step), b - a
            for tt, ww in reversed(seg):
                if abs(ww - fin) > band:
                    ts = tt - a
                    break
            else:
                ts = 0.0
            st.append(ts)
    dip = 0.0
    if meta['cycles'] > 1:
        dip = max((abs(_interp(t, wr, tt) - ww) for tt, ww in zip(t, w) if tl <= tt < tl + .3 * P / n), default=0.0)
    T = t[-1] or 1.0
    return {'iae': iae, 'ise': ise, 'overshoot': sum(ov) / len(ov) if ov else 0.0, 'settle': sum(st) / len(st) if st else 0.0,
            'effort': eff / T, 'load': dip}


def cost(m, base, weights, floors=None):
    """J = Σ w_k·m_k/max(m_k(base), floor_k), over the goals with a weight; the base PI has J ≤ Σ w_k. The floors keep a
    goal the base already meets (no overshoot, no dip) from dividing by zero: 5 % overshoot, 2 % of a cycle, 1 % of ω_max."""
    fl = {'overshoot': 5.0, **(floors or {})}
    J = 0.0
    for k, wk in weights.items():
        if wk:
            J += wk * m[k] / max(base[k], fl.get(k, 1e-12), 1e-12)
    return J


# ------------------------------------------------------------------ the inverse model, offline
def train_inverse(machine, cycles=4, epochs=30, lr=3e-3, seed=1):
    """Data from the PI alone on a reference with random steps (ω and dω/dt at the PI's samples → the PI's command),
    and a 2–8–1 network trained on them with the block's arithmetic (Adam). Returns the weights and the RMS error."""
    from engine.batch import _nn_fwd, _nn_learn
    from .control import _mulberry32, nn_init
    rule = rule_for(machine)
    r = _mulberry32(seed + 11)
    P = rule['P']
    probe = compose(machine, 'pi', cycles=1, load_step=False)
    wmax = probe.data['meta']['designer']['wmax']
    steps = [f'{k * P / 2:.4f}:{round(wmax * r(), 3)}' for k in range(2 * cycles)]
    p = compose(machine, 'pi', cycles=cycles, profile=', '.join(['0:0'] + steps[1:]), load_step=False)
    meta = p.data['meta']['designer']
    res = p.run(t_end=cycles * P, channels=['Y:M1', 'Y:' + meta['pi']], max_points=10 ** 7)
    t, w, u = res.t, res['Y:M1'], res['Y:' + meta['pi']]
    pi = _comp(p.data, rule['pi'])['params']
    lo, hi = _num(pi.get('ymin'), -1), _num(pi.get('ymax'), 1)
    ys = 100.0 if rule.get('sum') else (max(abs(lo), abs(hi)) / 2 or 1.0)
    amax = wmax * 2 * math.pi * FC
    # samples every 1 ms, α from a central difference over ±5 ms (the switching ripple averages out)
    grid = [k * 1e-3 for k in range(6, int(t[-1] / 1e-3) - 6)]
    X, Y = [], []
    for tk in grid:
        a = (_interp(t, w, tk + 5e-3) - _interp(t, w, tk - 5e-3)) / 1e-2
        X.append([_interp(t, w, tk) / wmax, a / amax])
        Y.append(_interp(t, u, tk) / ys)
    net = nn_init([2, 8, 1], seed, False)
    npar = sum(len(L) * len(L[0]) for L in net['W']) + sum(len(q) for q in net['b'])
    opt = {'k': 0, 'm': [0.0] * npar, 'v': [0.0] * npar}
    g = _mulberry32(seed + 7)
    idx = list(range(len(X)))
    for _ in range(epochs):
        for i in range(len(idx) - 1, 0, -1):
            j = int(g() * (i + 1))
            idx[i], idx[j] = idx[j], idx[i]
        for i in idx:
            acts = _nn_fwd(net, X[i])
            _nn_learn(net, opt, acts, acts[-1][0] - Y[i], lr, 5.0, 0.0, 'adam')
    err = math.sqrt(sum((_nn_fwd(net, x)[-1][0] - y) ** 2 for x, y in zip(X, Y)) / max(1, len(X))) * ys
    return net, err


# ------------------------------------------------------------------ the design
def candidates(controller):
    pi = [{'controller': 'pi', 'kb': k} for k in (.7, 1.0, 1.4)]
    nn = [{'controller': 'pinn', 'kb': 1.0, 'lr': lr} for lr in (.002, .005, .02)]
    inv = [{'controller': 'inv', 'kb': 1.0}]
    return {'pi': pi, 'pinn': nn, 'inv': inv, 'auto': pi + nn + inv}[controller]


def _label(c):
    if c['controller'] == 'pi':
        return f'PI, εύρος ζώνης ×{c["kb"]:g}'
    if c['controller'] == 'pinn':
        return f'PI + νευρωνικό online, η = {c["lr"]:g}'
    return 'PI + αντίστροφο μοντέλο'


def design(machine, weights, controller='auto', cycles=3, params=None, workers=3, progress=None):
    """Runs the base PI and the candidates of the controller family on the same profile, measures the goals and sorts
    by J. progress(text) is told what happens. Returns {'baseline', 'results' (sorted), 'best', 'inverse_error'}."""
    weights = {k: float(v) for k, v in (weights or {}).items() if float(v or 0) > 0} or {'iae': 1.0}
    say = progress or (lambda s: None)
    inv = None
    inv_err = None
    cands = candidates(controller)
    if any(c['controller'] == 'inv' for c in cands):
        say('Εκπαίδευση του αντίστροφου μοντέλου (προσομοίωση με διέγερση, μετά Adam)…')
        inv, inv_err = train_inverse(machine)
    jobs = [{'controller': 'pi', 'kb': 1.0, 'base': True}] + [c for c in cands if not (c['controller'] == 'pi' and c['kb'] == 1.0)]

    def one(c):
        p = compose(machine, c['controller'], params=params, cycles=cycles, kb=c.get('kb', 1.0), lr=c.get('lr', .005), inv_net=inv)
        meta = p.data['meta']['designer']
        keys = ['Y:M1', 'Y:' + meta['pi'], 'Y:' + ('LP' if RULES[machine['kind']].get('filt') else 'NLP')] + (['Y:NN1'] if c['controller'] != 'pi' else [])
        res = p.run(t_end=meta['cycles'] * meta['P'], channels=keys, max_points=60000)
        return {**c, 'label': _label(c), 'project': p, 'metrics': metrics(res, meta), 't': res.t, 'w': res['Y:M1'], 'wr': res[keys[2]]}
    out = []
    say(f'Τρέχουν {len(jobs)} εκδοχές σε {min(workers, len(jobs))} παράλληλες διεργασίες…')
    with cf.ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
        for k, r in enumerate(ex.map(one, jobs)):
            out.append(r)
            say(f'{k + 1}/{len(jobs)}: {r["label"]}')
    base = next(r for r in out if r.get('base'))
    P, wmax = base['project'].data['meta']['designer']['P'], base['project'].data['meta']['designer']['wmax']
    for r in out:
        r['J'] = cost(r['metrics'], base['metrics'], weights, {'settle': .02 * P, 'load': .01 * wmax})
    if controller in ('pi', 'auto'):
        res = sorted(out, key=lambda r: r['J'])
    else:
        res = sorted([r for r in out if not r.get('base')], key=lambda r: r['J']) + [base]
    return {'baseline': base, 'results': res, 'best': res[0], 'weights': weights, 'inverse_error': inv_err}


def describe(machine):
    """A short text of what the composition will build for this machine."""
    if not supported(machine):
        return f'{machine.get("name")}: δεν υπάρχει ακόμη κανόνας σύνθεσης για το είδος «{machine.get("kind")}».'
    r = RULES[machine['kind']]
    return (f'{machine["name"]} (είδος {machine["kind"]}): {r["base"]}. Βρόχος ταχύτητας με PI ({r["pi"]}), αναφορά φιλτραρισμένη στα '
            f'{FC:g} Hz, και νευρωνικό δίκτυο (ω_r, α_r) → εντολή παράλληλα με τον PI. Βάση: tutorial «{r["tutorial"]}».')


def _copy(project):
    return Project(copy.deepcopy(project.data), project.name)
