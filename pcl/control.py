"""Control loops composed from choices, with classical and neural controllers (3.15, ROADMAP §38).

Thanos' request (10/11): not one fixed package (as the Control Workbench EV/DC), but loops you choose, from a single loop
to the whole chain, each with its own controller, built from the choices:

    loops = [{'name': 'ω', 'measure': 'M1:w', 'ref': '0:0, 0.05:100', 'ctrl': {'type': 'pi_nn', 'Kp': 2.5, 'Ki': 316, 'lo': -30, 'hi': 30}},
             {'name': 'i', 'measure': 'AM1:y', 'ctrl': {'type': 'pi', 'Kp': 12.6, 'Ki': 628, 'lo': 0, 'hi': 220}, 'scale': 1 / 220}]
    p2 = pcl.control.compose(p, loops, actuator='PWM1:d', clock='PWM1')

Loops go from the outermost to the innermost. Each one is a reference (a constant or a program t:value for the outermost,
the output of the loop around it otherwise), an error e = r − y and a controller; the last output, times `scale`, drives
the actuator (a PWM's duty, a controlled source). The blocks are connected through their "Πηγή" fields (no wires), and
the plant is whatever the circuit is: a machine, a converter, a battery, switched or averaged.

Controllers ('type'):
  pi       the app's discrete PI block (anti-windup by clamping), sampled by the clock
  pi_nn    the same PI plus a small neural network that learns online the residual u_nn (direct adaptive control with
           the sign of the plant gain): u = u_PI + u_nn. With learn = 0 or untrained weights u_nn = 0, so it is the PI
           exactly; the PI stays as the safe base, the network only adds.
  code     your own Python block code (init/step), with inputs e, r, y and output u
The neural network is plain Python (no numpy), inside the block's code, so it runs the same in the browser, in Node and
on the server's SciPy solver, and it can be read and changed in the app (double click on the block).
"""
import copy
import json

PY_PI_NN = '''# PI + νευρωνικό δίκτυο που μαθαίνει online το υπόλοιπο (pcl.control, 3.15, ROADMAP §38).
# u = u_PI + u_nn. Το δίκτυο: είσοδοι r, y, e και η μεταβολή του y (κανονικοποιημένες), ένα κρυφό στρώμα tanh, γραμμική έξοδος.
# Μάθηση (άμεσος προσαρμοστικός έλεγχος με το πρόσημο του κέρδους του φυτού): μετά από κάθε δείγμα τα βάρη κινούνται ώστε
# το u_nn να μειώνει το επόμενο σφάλμα: Δw = lr·sgn(K)·e_{k+1}·∂u_nn/∂w, όχι όσο η έξοδος είναι στον κορεσμό.
# Με learn = 0 ή μηδενικά βάρη εξόδου: ίδιο με τον PI.
import math, random

def init(p):
    rnd = random.Random(int(p.get("seed", 1)))
    H = int(p.get("hidden", 8))
    W1 = [[rnd.uniform(-0.5, 0.5) for _ in range(5)] for _ in range(H)]     # 4 inputs + bias
    return {"xi": 0.0, "W1": W1, "W2": [0.0] * (H + 1), "x": None, "h": None, "yp": None, "unn": 0.0, "n": 0}

def _net(s, x):
    h = [math.tanh(sum(w * v for w, v in zip(row, x + [1.0]))) for row in s["W1"]]
    return h, sum(w * v for w, v in zip(s["W2"], h + [1.0]))

def step(t, u, s, p):
    e, r, y = u["e"], u["r"], u["y"]
    ys, us = p.get("yscale", 1.0) or 1.0, p.get("uscale", 1.0) or 1.0
    # learning from the last sample: its error now is the result of the u_nn it chose
    # no learning while the output was saturated: the error then says nothing about u_nn (anti-windup of the learning)
    if p.get("learn", 1) and s["x"] is not None and not s.get("sat"):
        g = p.get("lr", 0.01) * p.get("sign", 1.0) * max(-1.0, min(1.0, e / ys))
        h = s["h"]
        for j in range(len(h)):
            d2 = s["W2"][j]
            s["W2"][j] += g * h[j]
            dh = g * d2 * (1 - h[j] * h[j])
            for k in range(5):
                s["W1"][j][k] += dh * (s["x"] + [1.0])[k]
        s["W2"][-1] += g
        s["n"] += 1
    dy = 0.0 if s["yp"] is None else (y - s["yp"]) / ys
    x = [r / ys, y / ys, e / ys, max(-1.0, min(1.0, 10 * dy))]
    h, o = _net(s, x)
    unn = max(-p.get("nnmax", 0.3), min(p.get("nnmax", 0.3), o)) * us
    # PI with clamping (as the app's discrete PI): the integrator stops when the total output saturates
    s["xi"] += p["Ki"] * p["Ts"] * e
    v = p["Kp"] * e + s["xi"] + unn
    if v > p["ymax"] or v < p["ymin"]:
        s["xi"] -= p["Ki"] * p["Ts"] * e
        v = min(p["ymax"], max(p["ymin"], p["Kp"] * e + s["xi"] + unn))
    s["x"], s["h"], s["yp"], s["unn"], s["sat"] = x, h, y, unn, v >= p["ymax"] or v <= p["ymin"]
    return {"u": v, "nn": unn}
'''

TYPES = ('pi', 'pi_nn', 'code')


def _num(v, d=None):
    if v is None:
        return d
    try:
        return float(v)
    except (TypeError, ValueError):
        return d


def _bbox(pr):
    xs = [c.get('x', 0) for c in pr['components']] or [0]
    ys = [c.get('y', 0) for c in pr['components']] or [0]
    return min(xs), min(ys), max(xs), max(ys)


def compose(project, loops, actuator, clock=None, prefix='AC', replace=True):
    """A copy of `project` (a pcl.Project or the app's JSON) with the loops added. `actuator` is '<id>:<pin>' of a signal
    input (a PWM in 'ext' mode gets its duty there). `clock` is the PWM (or clock block) that samples the controllers.
    With replace, blocks of an earlier composition (ids starting with `prefix`) are removed first.
    Returns the project (same kind as given) and a description of what was added."""
    is_obj = hasattr(project, 'data')
    pr = copy.deepcopy(project.data if is_obj else project)
    if not loops:
        raise ValueError('Δώσε τουλάχιστον έναν βρόχο.')
    comps = pr['components']
    if replace:
        comps[:] = [c for c in comps if not str(c['id']).startswith(prefix)]
        for c in comps:
            for k in [k for k, v in (c.get('params') or {}).items() if k.startswith('in_') and str(v).startswith(prefix)]:
                del c['params'][k]
    ids = {c['id'] for c in comps}
    act_id, _, act_pin = str(actuator).partition(':')
    if act_id not in ids or not act_pin:
        raise ValueError(f'Δεν υπάρχει ο ενεργοποιητής «{actuator}» (γράφεται <id>:<ακροδέκτης>, π.χ. PWM1:d).')
    act = next(c for c in comps if c['id'] == act_id)
    if act['type'] == 'PWM':
        act['params']['mode'] = 'ext'
    clk = clock or (act_id if act['type'] == 'PWM' else None)
    x0, y0, _, _ = _bbox(pr)
    added, desc = [], []
    prev_out = None
    n = len(loops)
    for i, lp in enumerate(loops):
        name = str(lp.get('name') or f'βρόχος {i + 1}')
        meas = str(lp.get('measure') or '')
        mid = meas.partition(':')[0]
        if mid not in ids:
            raise ValueError(f'Βρόχος «{name}»: δεν υπάρχει η μέτρηση «{meas}» (π.χ. AM1:y, M1:w).')
        ct = dict(lp.get('ctrl') or {'type': 'pi'})
        typ = ct.get('type', 'pi')
        if typ not in TYPES:
            raise ValueError(f'Βρόχος «{name}»: ελεγκτής «{typ}» (υπάρχουν: {", ".join(TYPES)}).')
        k = i + 1
        y = y0 - 140 - 90 * (n - i)
        base = f'{prefix}{k}'
        # the reference: a constant/program for the outermost loop, the outer controller's output otherwise
        if prev_out is None:
            added.append({'id': base + 'R', 'type': 'CONST', 'x': x0, 'y': y, 'rot': 0, 'flip': False, 'label': f'{name}*',
                          'params': {'v': str(lp.get('ref', 0))}})
            ref = base + 'R:y'
        else:
            ref = prev_out
        added.append({'id': base + 'E', 'type': 'SUM', 'x': x0 + 110, 'y': y, 'rot': 0, 'flip': False, 'label': f'e_{name}',
                      'params': {'signs': '+-', 'in_a': ref, 'in_b': meas}})
        lo, hi = _num(ct.get('lo'), -1e9), _num(ct.get('hi'), 1e9)
        kp, ki = _num(ct.get('Kp'), 1.0), _num(ct.get('Ki'), 0.0)
        cid = base + 'C'
        if typ == 'pi':
            blk = {'type': 'PIB', 'params': {'Kp': kp, 'Ki': ki, 'ymin': lo, 'ymax': hi, 'y0': 0, 'in_u': base + 'E:y'}}
            out = cid + ':y'
        else:
            code = PY_PI_NN if typ == 'pi_nn' else str(ct.get('code') or '')
            if typ == 'code' and 'def step' not in code:
                raise ValueError(f'Βρόχος «{name}»: ο κώδικας θέλει init(p) και step(t, u, s, p).')
            pars = {'Kp': kp, 'Ki': ki, 'ymin': lo, 'ymax': hi}
            if typ == 'pi_nn':
                span = (hi - lo) if hi < 1e8 and lo > -1e8 else 1.0
                pars.update({'lr': _num(ct.get('lr'), 0.02), 'learn': 1 if ct.get('learn', True) else 0, 'hidden': int(_num(ct.get('hidden'), 8)),
                             'seed': int(_num(ct.get('seed'), 1)), 'sign': _num(ct.get('sign'), 1.0), 'nnmax': _num(ct.get('nnmax'), 0.3),
                             'yscale': _num(ct.get('yscale'), max(1e-12, abs(_num(lp.get('yscale'), 1.0)))), 'uscale': _num(ct.get('uscale'), span)})
            pars.update({k2: v for k2, v in (ct.get('pars') or {}).items()})
            blk = {'type': 'PY', 'params': {'code': code, 'ins': 'e, r, y', 'outs': 'u, nn' if typ == 'pi_nn' else 'u',
                                            'pars': ', '.join(f'{a} = {json.dumps(b)}' for a, b in pars.items()), 'y0': 0,
                                            'in_e': base + 'E:y', 'in_r': ref, 'in_y': meas}}
            out = cid + ':u'
        if clk:
            blk['params'].update({'clock': clk, 'trig': 'start'})
        added.append({'id': cid, 'x': x0 + 230, 'y': y, 'rot': 0, 'flip': False, 'label': f'{ {"pi": "PI", "pi_nn": "PI + NN", "code": "κώδικας"}[typ]} {name}', **blk})
        scale = _num(lp.get('scale'), 1.0)
        if scale != 1.0:
            added.append({'id': base + 'G', 'type': 'GAIN', 'x': x0 + 360, 'y': y, 'rot': 0, 'flip': False, 'label': f'×{scale:.4g}',
                          'params': {'K': scale, 'in_u': out}})
            out = base + 'G:y'
        desc.append({'loop': name, 'measure': meas, 'ctrl': typ, 'block': cid, 'out': out, 'ref': ref})
        prev_out = out
    act['params']['in_' + act_pin] = prev_out
    comps.extend(added)
    pr.setdefault('control', {})['composed'] = {'actuator': actuator, 'clock': clk, 'prefix': prefix, 'loops': json.loads(json.dumps(loops))}
    if is_obj:
        q = project.copy()
        q.data = pr
        return q, desc
    return pr, desc


def metrics(t, r, y, t_from=0.0):
    """IAE, ISE, overshoot (% of the final reference step) and the final error of y against r, from t_from on."""
    iae = ise = 0.0
    pts = [(a, b, c) for a, b, c in zip(t, r, y) if a >= t_from]
    for (t0, r0, y0), (t1, r1, y1) in zip(pts, pts[1:]):
        h = t1 - t0
        e0, e1 = r0 - y0, r1 - y1
        iae += h * (abs(e0) + abs(e1)) / 2
        ise += h * (e0 * e0 + e1 * e1) / 2
    rf = pts[-1][1] if pts else 0
    r0 = pts[0][1] if pts else 0
    step = rf - r0 if rf != r0 else rf
    peak = max((c for _, _, c in pts), default=0) if step >= 0 else min((c for _, _, c in pts), default=0)
    over = 100 * (peak - rf) / step if step else 0.0
    return {'IAE': iae, 'ISE': ise, 'overshoot_pct': max(0.0, over), 'final_error': (rf - pts[-1][2]) if pts else 0.0}
