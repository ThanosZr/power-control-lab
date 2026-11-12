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
* 'pi': the PI alone (the reference for the comparison), with its bandwidth scaled,
* 'rl' (4.8.1): a policy network (ω_r, α_r, e) → command beside the PI, frozen in each episode and found by
  reinforcement learning with policy search (evolution strategies) on the return −J of the user's own goals.

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
    # 4.8.1: generators: excitation (AVR, PSS) and governor, judged on a fault (Kundur ch. 8–9, tutorial gen_ctl)
    'gen': {'tutorial': 'gen_ctl', 'options': {'ev': 'fault', 'gov': 'none'}, 'gen': True,
            'base': 'γεννήτρια σε άπειρο ζυγό μέσω μετασχηματιστή και δύο γραμμών (P = 0,9, Q = 0,436 pu)· τριφασικό σφάλμα στη γραμμή 2 στο 1 s, '
                    'που απομονώνεται σε 70 ms· διέγερση και ρυθμιστής στροφών από τη βιβλιοθήκη «Δίκτυο» (AVR, PSS, GOV)'},
    # 4.8.1: an electric vehicle with a DC machine: the multi-objective controllers (library part EVC, tutorial ev_drive)
    'ev': {'tutorial': 'ev_drive', 'options': {'cycle': 'urban'}, 'ev': True,
           'base': 'όχημα 115 kg, μπαταρία 18 Ah με OCV(SOC), μετατροπέας με τα όρια της μπαταρίας, φορτίο δρόμου· ένας κύκλος οδήγησης 60 s'},
}
EV_GOALS = [('track', 'Παρακολούθηση της ταχύτητας (RMS σφάλμα)'), ('energy', 'Λιγότερη ενέργεια ανά km (Wh/km)'), ('irms', 'Μικρό ρεύμα RMS'),
            ('peak', 'Μικρή μέγιστη ροπή'), ('rollback', 'Χωρίς κύλιση πίσω στη στάση')]
EV_CONTROLLERS = [('moevc', 'Πολυκριτηριακός συζευγμένος (moevc)'), ('moev', 'Πολυκριτηριακός καταρράκτης (moev)'), ('ai', 'Ελεγκτής AI (PI + νευρωνικό)'),
                  ('auto', 'Αυτόματα: ο καλύτερος για τους στόχους')]
EV_T = 60.0
# 4.8.1: the goals and the controllers of a generator (the speed goals above are for drives)
GEN_GOALS = [('swing', 'Μικρή πρώτη ταλάντωση της γωνίας δ'), ('damp', 'Γρήγορη απόσβεση των ταλαντώσεων'), ('vrec', 'Γρήγορη επαναφορά της τάσης'),
             ('freq', 'Μικρή απόκλιση της ταχύτητας'), ('effort', 'Μικρή προσπάθεια της διέγερσης')]
GEN_CONTROLLERS = [('avr', 'AVR ST1A (K_A = 200)'), ('avr_pss', 'AVR ST1A + PSS'), ('tgr', 'ST1A με μείωση μεταβατικού κέρδους'),
                   ('dc1a', 'AVR DC1A (διεγέρτρια ΣΡ)'), ('auto', 'Αυτόματα: ο καλύτερος για τους στόχους')]
GEN_T = 6.0                                        # the run of a generator design, s (fault at 1 s)


def goals(machine):
    """The goals that the composition measures for this machine: of a drive (speed), a vehicle or a generator."""
    k = (machine or {}).get('kind')
    return GEN_GOALS if k == 'gen' else EV_GOALS if k == 'ev' else GOALS


def controllers(machine):
    k = (machine or {}).get('kind')
    return GEN_CONTROLLERS if k == 'gen' else EV_CONTROLLERS if k == 'ev' else CONTROLLERS
GOALS = [('iae', 'Ελάχιστο IAE (παρακολούθηση)'), ('ise', 'Ελάχιστο ISE (μεγάλα σφάλματα)'), ('overshoot', 'Ελάχιστη υπέρβαση'),
         ('settle', 'Γρήγορη αποκατάσταση'), ('effort', 'Ελάχιστη ενέργεια ελέγχου'), ('load', 'Ανοχή σε αλλαγή φορτίου')]
CONTROLLERS = [('pi', 'PI'), ('pinn', 'PI + νευρωνικό που μαθαίνει online'), ('inv', 'PI + αντίστροφο μοντέλο (νευρωνικό, offline)'),
               ('rl', 'PI + πολιτική από RL (αναζήτηση πολιτικής στους στόχους, δεκάδες επεισόδια)'),
               ('auto', 'Αυτόματα: ο καλύτερος για τους στόχους (χωρίς RL)')]
FC = 5.0                                           # the reference filter, Hz


def machines(app=None):
    """The machines of the app: through the link when an app is given (pcl.link.App), else from parts.js in Node. Each
    DC machine also appears as the drive of an electric vehicle (kind 'ev', 4.8.1)."""
    ms = list(app.machines() if app is not None else _machines_node())
    return ms + [{**m, 'kind': 'ev', 'name': m.get('name', m['type']) + ' · ηλεκτρικό όχημα'} for m in ms if m.get('kind') == 'dc']


def supported(machine):
    return (machine.get('kind') or '') in RULES


def rule_for(machine):
    k = machine.get('kind')
    if k not in RULES:
        raise PclError(f'Δεν υπάρχει ακόμη κανόνας σύνθεσης για μηχανές του είδους «{k}» ({machine.get("name", machine.get("type"))}). '
                       'Υπάρχουν κανόνες για μηχανές ΣΡ, επαγωγής, σύγχρονες, SRM και γεννήτριες.')
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


def compose_gen(machine, controller='avr_pss', params=None, pss=None, gov='none', event='fault'):
    """4.8.1: a generator with its controls: the tutorial gen_ctl (infinite bus, fault on line 2) with the machine's
    parameters, the excitation controller (avr, avr_pss, tgr, dc1a, none), the stabilizer's parameters (pss: dict of the
    PSS part) and the governor (none, steam, hydro)."""
    rule = rule_for(machine)
    ctl = controller if controller in ('none', 'avr', 'avr_pss', 'tgr', 'dc1a') else 'avr_pss'
    p = tutorial(rule['tutorial'], ctl=ctl, gov=gov, ev=event)
    d = p.data
    g = _comp(d, 'SG1')
    if machine.get('type') and g['type'] != machine['type']:
        raise PclError(f'Ο κανόνας «gen» θέλει σύγχρονη γεννήτρια GEN3, όχι {machine["type"]}.')
    if params:
        g['params'].update(params)
    if pss and ctl == 'avr_pss':
        _comp(d, 'PS1')['params'].update(pss)
    d.setdefault('sim', {})['stopT'] = GEN_T
    d['meta'] = {**(d.get('meta') or {}), 'designer': {'machine': machine['type'], 'kind': 'gen', 'controller': ctl, 'pss': pss or {},
                                                     'gov': gov, 'event': event, 'T': GEN_T, 'tf': 1.0, 'tc': 1.07}}
    d.pop('tutorial', None)
    return Project(d, f'{machine["type"]}_{ctl}')


GEN_KEYS = ['Y:SG1:d', 'Y:SG1', 'Y:SG1:vt', 'Y:SG1:ifd']
EV_KEYS = ['Y:REF', 'Y:M1', 'Y:M1:te', 'Y:WHK', 'Y:IRMS', 'Y:DSOC', 'Y:KWH']


def compose_ev(machine, controller='moevc', params=None, mode='balanced', cycle='urban'):
    """4.8.1: the electric vehicle of the tutorial ev_drive with this DC machine (its parameters on M1) and a controller
    (moevc, moev, ai, pi) in a mode (eco, balanced, performance); one driving cycle."""
    rule = rule_for(machine)
    ctl = controller if controller in ('moevc', 'moev', 'ai', 'pi') else 'moevc'
    p = tutorial(rule['tutorial'], ctrl=ctl, mode=mode, cycle=cycle)
    d = p.data
    if params:
        _comp(d, 'M1')['params'].update(params)
    d.setdefault('sim', {})['stopT'] = EV_T
    d['meta'] = {**(d.get('meta') or {}), 'designer': {'machine': machine['type'], 'kind': 'ev', 'controller': ctl, 'mode': mode, 'cycle': cycle, 'T': EV_T}}
    d.pop('tutorial', None)
    return Project(d, f'{machine["type"]}_ev_{ctl}_{mode}')


def metrics_ev(res):
    """RMS of ω* − ω, Wh/km, I_rms and the drop of the SOC at the end, the largest |τ_e| and how far the vehicle rolls
    back at a stop (largest −ω, rad/s)."""
    t, r, w, te = res.t, res['Y:REF'], res['Y:M1'], res['Y:M1:te']
    se = sum((t[i] - t[i - 1]) * (r[i] - w[i]) ** 2 for i in range(1, len(t)))
    return {'track': math.sqrt(se / (t[-1] or 1)), 'energy': res['Y:WHK'][-1], 'irms': res['Y:IRMS'][-1], 'peak': max(abs(x) for x in te),
            'rollback': max(0.0, -min(w)), 'kwh': res['Y:KWH'][-1], 'dsoc': res['Y:DSOC'][-1]}


def design_ev(machine, weights, controller='auto', params=None, workers=3, progress=None):
    """4.8.1: the base (the PI of the speed alone) and the candidates over one driving cycle; J = Σ w·m/m(base)."""
    weights = {k: float(v) for k, v in (weights or {}).items() if float(v or 0) > 0} or {'track': 1.0, 'energy': 1.0}
    say = progress or (lambda s: None)
    cands = {'moevc': [{'controller': 'moevc', 'mode': m} for m in ('eco', 'balanced', 'performance')], 'moev': [{'controller': 'moev', 'mode': 'balanced'}],
             'ai': [{'controller': 'ai', 'mode': 'balanced'}]}
    jobs = [{'controller': 'pi', 'mode': 'balanced', 'base': True}] + (sum(cands.values(), []) if controller == 'auto' else cands.get(controller, cands['moevc']))

    def one(c):
        p = compose_ev(machine, c['controller'], params=params, mode=c['mode'])
        res = p.run(t_end=EV_T, channels=EV_KEYS, max_points=60000)
        lab = dict(EV_CONTROLLERS).get(c['controller'], 'Μόνο PI ταχύτητας') + ('' if c['controller'] in ('pi', 'ai') else f', {c["mode"]}')
        return {**c, 'label': lab, 'project': p, 'metrics': metrics_ev(res), 't': res.t, 'w': res['Y:M1'], 'wr': res['Y:REF']}
    out = []
    say(f'Τρέχουν {len(jobs)} εκδοχές σε {min(workers, len(jobs))} παράλληλες διεργασίες…')
    with cf.ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
        for k, r in enumerate(ex.map(one, jobs)):
            out.append(r)
            say(f'{k + 1}/{len(jobs)}: {r["label"]}')
    base = next(r for r in out if r.get('base'))
    for r in out:
        r['J'] = cost(r['metrics'], base['metrics'], weights, {'rollback': .5, 'track': .1})
    res = sorted(out, key=lambda r: r['J'])
    return {'baseline': base, 'results': res, 'best': res[0], 'weights': weights, 'inverse_error': None}


def metrics_gen(res, meta):
    """A generator after the fault: lost synchronism (|ω − 1| > 2 %), first swing of δ (peak − value before the
    fault, °), time for δ to stay within 2° of its final value, time for |V| to stay within 2 % of its final value
    (after the clearing), largest |ω − 1|, and ∫|i_fd − i_fd,final| dt (the excitation's effort)."""
    t, d, w, v, f = res.t, res['Y:SG1:d'], res['Y:SG1'], res['Y:SG1:vt'], res['Y:SG1:ifd']
    tf, tc, T = meta['tf'], meta['tc'], t[-1]
    slip = any(abs(x - 1) > .02 for x in w)
    d0 = _interp(t, d, tf - 1e-3)
    tail = [i for i, tt in enumerate(t) if tt >= T - .5]
    dend = sum(d[i] for i in tail) / len(tail)
    vend = sum(v[i] for i in tail) / len(tail)
    fend = sum(f[i] for i in tail) / len(tail)
    swing = max((x - d0 for tt, x in zip(t, d) if tf <= tt <= tf + 1.5), default=0.0)
    damp = vrec = 0.0
    for tt, x in zip(t, d):
        if tt >= tc and abs(x - dend) > 2:
            damp = tt - tc
    for tt, x in zip(t, v):
        if tt >= tc and abs(x - vend) > .02 * vend:
            vrec = tt - tc
    eff = 0.0
    for i in range(1, len(t)):
        if t[i] >= tf:
            eff += (t[i] - t[i - 1]) * abs(f[i] - fend)
    return {'slip': slip, 'swing': swing, 'damp': damp, 'vrec': vrec, 'freq': max(abs(x - 1) for x in w), 'effort': eff}


def compose(machine, controller='pi', params=None, cycles=3, kb=1.0, lr=.005, opt='sgd', inv_net=None, profile=None, load_step=True):
    """The circuit for one machine and one controller, as a pcl.Project. params: the machine's parameters (else its
    defaults or the base's); kb: bandwidth of the PI (K_p·kb, K_i·kb²); lr/opt: learning of the online network;
    inv_net: weights of the inverse model (controller 'inv'); profile: the reference schedule (else steps over the
    speed range, cycles × P). A generator (kind 'gen') goes to compose_gen."""
    rule = rule_for(machine)
    if rule.get('gen'):
        return compose_gen(machine, controller, params=params)
    if rule.get('ev'):
        return compose_ev(machine, controller, params=params)
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
    rl = controller == 'rl'
    ys = max(abs(lo), abs(hi)) / (1 if rule.get('sum') else 2) or 1.0
    if rule.get('sum'):
        ys = 100.0                                   # the DC base: volts, as in the tutorial
    amax = wmax * 2 * math.pi * FC
    ins, xs = ('wr, ar, ew', f'{wmax:g}, {amax:.6g}, {.1 * wmax:g}') if rl else ('wr, ar', f'{wmax:g}, {amax:.6g}')
    p = {'ins': ins, 'xs': xs, 'hidden': '8', 'ys': ys, 'ymin': lo, 'ymax': hi,
         'train': 'err' if learn else 'off', 'opt': opt, 'lr': lr, 'clip': 5, 'nl': 400, 'init': 'zero', 'seed': 1,
         'clock': clock, 'trig': pi['params'].get('trig', 'start'), 'y0': 0}
    if not learn:
        if inv_net is None:
            raise PclError('Το αντίστροφο μοντέλο θέλει βάρη (train_inverse)· η πολιτική RL τα βάρη της (train_rl).')
        from .control import nn_text
        p['w'] = nn_text(inv_net)
    _add(d, 'NN1', 'NN', x0 + 100, y0 + 120, p, 'NN (μαθαίνει)' if learn else 'NN πολιτική (RL)' if rl else 'NN αντίστροφο')
    _wire(d, wr, 'NN1:wr')
    _wire(d, ar, 'NN1:ar')
    if rl:                                           # the policy also sees the speed error of the PI
        _wire(d, rule['err'] + ':y', 'NN1:ew')
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
    return {'pi': pi, 'pinn': nn, 'inv': inv, 'rl': [], 'auto': pi + nn + inv}[controller]


def _label(c):
    if c['controller'] == 'pi':
        return f'PI, εύρος ζώνης ×{c["kb"]:g}'
    if c['controller'] == 'pinn':
        return f'PI + νευρωνικό online, η = {c["lr"]:g}'
    if c['controller'] == 'rl':
        return f'PI + πολιτική RL ({c.get("episodes", 0)} επεισόδια)'
    return 'PI + αντίστροφο μοντέλο'


# ------------------------------------------------------------------ RL: policy search on the goals (4.8.1)
def _flat(net):
    return [v for L in net['W'] for row in L for v in row] + [v for q in net['b'] for v in q]


def _unflat(net, flat):
    k, W, b = 0, [], []
    for L in net['W']:
        rows = []
        for row in L:
            rows.append(list(flat[k:k + len(row)]))
            k += len(row)
        W.append(rows)
    for q in net['b']:
        b.append(list(flat[k:k + len(q)]))
        k += len(q)
    return {'sizes': list(net['sizes']), 'W': W, 'b': b}


def train_rl(episode, iters=4, population=6, sigma=.1, lr=.05, seed=1, workers=3, progress=None):
    """Reinforcement learning by policy search (ROADMAP §38, as pcl.control.RLTrainer, here on the designer's goals): the
    policy is the network (ω_r, α_r, e) → command beside the PI, frozen within an episode. Evolution strategies:
    antithetic Gaussian perturbations of the weights, centred ranks of the returns −J, Adam. episode(net) runs one
    episode of the designer's scenario and returns its result with J (lower is better). It starts from a zero output
    (the PI alone, J = Σw), so the policy only adds what helps. Returns (the best result, the history per iteration)."""
    from .control import _mulberry32, nn_init
    say = progress or (lambda s: None)
    net0 = nn_init([3, 8, 1], seed, True)
    th = _flat(net0)
    n, half = len(th), max(1, int(population) // 2)
    g = _mulberry32(seed + 101)

    def gauss():
        u1, u2 = 1 - g(), g()
        return math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
    m1, m2, best, hist = [0.0] * n, [0.0] * n, None, []
    for it in range(int(iters)):
        eps = [[gauss() for _ in range(n)] for _ in range(half)]
        cands = [[t + sigma * e for t, e in zip(th, ep)] for ep in eps] + [[t - sigma * e for t, e in zip(th, ep)] for ep in eps]
        with cf.ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
            res = list(ex.map(lambda f: episode(_unflat(net0, f)), cands))
        for f, r in zip(cands, res):
            if best is None or r['J'] < best['J']:
                best = {**r, 'flat': f}
        R = [-r['J'] if math.isfinite(r['J']) else -1e9 for r in res]
        order = sorted(range(len(R)), key=lambda i: R[i])
        rank = [0.0] * len(R)
        for k, i in enumerate(order):
            rank[i] = k / max(1, len(R) - 1) - .5
        grad = [sum((rank[i] - rank[i + half]) * eps[i][j] for i in range(half)) / (2 * half * sigma) for j in range(n)]
        k = it + 1
        for j in range(n):                                  # Adam, ascent on the return
            m1[j] = .9 * m1[j] + .1 * grad[j]
            m2[j] = .999 * m2[j] + .001 * grad[j] ** 2
            th[j] += lr * (m1[j] / (1 - .9 ** k)) / (math.sqrt(m2[j] / (1 - .999 ** k)) + 1e-8)
        fin = [r['J'] for r in res if math.isfinite(r['J'])]
        hist.append({'iter': k, 'J_best': best['J'], 'J_mean': sum(fin) / len(fin) if fin else math.inf, 'episodes': k * 2 * half})
        say(f'RL: επανάληψη {k}/{iters}, {k * 2 * half} επεισόδια, καλύτερο J = {best["J"]:.4f}')
    best['net'] = _unflat(net0, best['flat'])
    return best, hist


def gen_candidates(controller):
    pss = [{'controller': 'avr_pss', 'pss': {'KS': k}} for k in (10, 20, 40)]
    one = {'avr': [{'controller': 'avr'}], 'avr_pss': pss, 'tgr': [{'controller': 'tgr'}], 'dc1a': []}
    return one.get(controller) if controller != 'auto' else [{'controller': 'avr'}] + pss + [{'controller': 'tgr'}]


def _gen_label(c):
    n = dict(GEN_CONTROLLERS).get(c['controller'], c['controller'])
    return n + (f', K_STAB = {c["pss"]["KS"]:g}' if c.get('pss') else '')


def design_gen(machine, weights, controller='auto', params=None, workers=3, progress=None):
    """4.8.1: the base (DC1A, the classic slow exciter) and the candidates on the same fault; J = Σ w·m/m(base), and a
    candidate that loses synchronism is last (J = ∞)."""
    weights = {k: float(v) for k, v in (weights or {}).items() if float(v or 0) > 0} or {'swing': 1.0, 'damp': 1.0}
    say = progress or (lambda s: None)
    jobs = [{'controller': 'dc1a', 'base': True}] + gen_candidates(controller)

    def one(c):
        p = compose_gen(machine, c['controller'], params=params, pss=c.get('pss'))
        meta = p.data['meta']['designer']
        res = p.run(t_end=meta['T'], channels=GEN_KEYS, max_points=60000)
        return {**c, 'label': _gen_label(c), 'project': p, 'metrics': metrics_gen(res, meta), 't': res.t, 'w': res['Y:SG1:d'], 'wr': res['Y:SG1:vt']}
    out = []
    say(f'Τρέχουν {len(jobs)} εκδοχές σε {min(workers, len(jobs))} παράλληλες διεργασίες…')
    with cf.ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
        for k, r in enumerate(ex.map(one, jobs)):
            out.append(r)
            say(f'{k + 1}/{len(jobs)}: {r["label"]}')
    base = next(r for r in out if r.get('base'))
    for r in out:
        r['J'] = math.inf if r['metrics']['slip'] else cost(r['metrics'], base['metrics'], weights, {'swing': 1.0, 'damp': .05, 'vrec': .05, 'freq': 1e-4, 'effort': 1e-3})
    res = sorted(out, key=lambda r: r['J'])
    return {'baseline': base, 'results': res, 'best': res[0], 'weights': weights, 'inverse_error': None}


def design(machine, weights, controller='auto', cycles=3, params=None, workers=3, progress=None):
    """Runs the base PI and the candidates of the controller family on the same profile, measures the goals and sorts
    by J. progress(text) is told what happens. Returns {'baseline', 'results' (sorted), 'best', 'inverse_error'}.
    A generator goes to design_gen (its own goals and controllers)."""
    if rule_for(machine).get('gen'):
        return design_gen(machine, weights, controller, params=params, workers=workers, progress=progress)
    if rule_for(machine).get('ev'):
        return design_ev(machine, weights, controller, params=params, workers=workers, progress=progress)
    weights = {k: float(v) for k, v in (weights or {}).items() if float(v or 0) > 0} or {'iae': 1.0}
    say = progress or (lambda s: None)
    inv = None
    inv_err = None
    if controller == 'rl':
        return design_rl(machine, weights, cycles=cycles, params=params, workers=workers, progress=progress)
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


def _episode(machine, c, cycles, params, inv=None):
    p = compose(machine, c['controller'], params=params, cycles=cycles, kb=c.get('kb', 1.0), lr=c.get('lr', .005), inv_net=c.get('net', inv))
    meta = p.data['meta']['designer']
    keys = ['Y:M1', 'Y:' + meta['pi'], 'Y:' + ('LP' if RULES[machine['kind']].get('filt') else 'NLP')] + (['Y:NN1'] if c['controller'] != 'pi' else [])
    res = p.run(t_end=meta['cycles'] * meta['P'], channels=keys, max_points=60000)
    return {**{k: v for k, v in c.items() if k != 'net'}, 'label': _label(c), 'project': p, 'metrics': metrics(res, meta), 't': res.t, 'w': res['Y:M1'], 'wr': res[keys[2]]}


def design_rl(machine, weights, cycles=3, params=None, workers=3, progress=None, iters=4, population=6, sigma=.1, lr=.05, seed=1):
    """4.8.1: the base PI, then the policy found by RL (train_rl) on the same scenario and the same J. Results: the
    policy, then the PI."""
    weights = {k: float(v) for k, v in (weights or {}).items() if float(v or 0) > 0} or {'iae': 1.0}
    say = progress or (lambda s: None)
    say('Ο PI μόνος (η βάση του J)…')
    base = _episode(machine, {'controller': 'pi', 'kb': 1.0, 'base': True}, cycles, params)
    dz = base['project'].data['meta']['designer']
    floors = {'settle': .02 * dz['P'], 'load': .01 * dz['wmax']}
    base['J'] = cost(base['metrics'], base['metrics'], weights, floors)

    def episode(net):
        r = _episode(machine, {'controller': 'rl', 'kb': 1.0, 'net': net}, cycles, params)
        r['J'] = cost(r['metrics'], base['metrics'], weights, floors)
        return r
    say(f'RL με αναζήτηση πολιτικής: {iters} επαναλήψεις × {population} επεισόδια σε {workers} παράλληλες διεργασίες…')
    best, hist = train_rl(episode, iters=iters, population=population, sigma=sigma, lr=lr, seed=seed, workers=workers, progress=say)
    best['episodes'] = hist[-1]['episodes'] if hist else 0
    best['label'] = _label(best)
    best['rl'] = hist
    best.pop('flat', None)
    res = [best, base] if best['J'] <= base['J'] else [base, best]
    return {'baseline': base, 'results': res, 'best': res[0], 'weights': weights, 'inverse_error': None, 'rl': hist}


def describe(machine):
    """A short text of what the composition will build for this machine."""
    if not supported(machine):
        return f'{machine.get("name")}: δεν υπάρχει ακόμη κανόνας σύνθεσης για το είδος «{machine.get("kind")}».'
    r = RULES[machine['kind']]
    if r.get('ev'):
        return (f'{machine["name"]}: {r["base"]}. Στόχοι του οχήματος: παρακολούθηση, Wh/km, ρεύμα, ροπή, στάση· βάση ο PI ταχύτητας μόνος. '
                'Ελεγκτές: οι πολυκριτηριακοί του Control Workbench EV/DC (μπλοκ EVC) και ο «Ελεγκτής AI». Βάση: tutorial «ev_drive».')
    if r.get('gen'):
        return (f'{machine["name"]} (είδος gen): {r["base"]}. Οι στόχοι είναι της γεννήτριας: πρώτη ταλάντωση, απόσβεση, τάση, συχνότητα, '
                'προσπάθεια διέγερσης· βάση η διεγέρτρια ΣΡ (DC1A). Βάση: tutorial «gen_ctl».')
    return (f'{machine["name"]} (είδος {machine["kind"]}): {r["base"]}. Βρόχος ταχύτητας με PI ({r["pi"]}), αναφορά φιλτραρισμένη στα '
            f'{FC:g} Hz, και νευρωνικό δίκτυο (ω_r, α_r) → εντολή παράλληλα με τον PI. Βάση: tutorial «{r["tutorial"]}».')


def _copy(project):
    return Project(copy.deepcopy(project.data), project.name)
