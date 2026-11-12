"""Control loops composed from choices, with classical and neural controllers (3.15, ROADMAP §38; stage 2 in 3.16).

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
  code     your own Python block code (init/step), with inputs e, r, y (and the loop's state s1, s2, …) and output u
  inv_nn   (3.16) indirect adaptive inverse control, as the workbench's indirect_inverse: an emulator (ANN 2) learns
           y(k+1) from the measured state and u, the controller (ANN 1) gives u(k) for a reachable one-step target
           y* = y + clip(α·(r − y)); online both adapt every sample. Trained in phases by InverseTrainer
           (excite → emulator → controller → online), the weights travel inside the block's code.
  rl       (3.16) reinforcement learning by policy search: a small policy network π_θ(r, y, e, Δy, state) on top of
           the PI (or alone), θ found by evolution strategies over episodes on the circuit itself (RLTrainer).
The neural networks are plain Python (no numpy), inside the block's code, so they run the same in the browser, in Node
and on the server's SciPy solver, and they can be read and changed in the app (double click on the block).

Per loop also (3.16): 'Ts' (its own sampling, a clock block), 'state' (more measurements for the AI controllers, e.g.
the current under the speed) and 'dither' (a program t:value added to the controller's output, for excitation).
The rule of ROADMAP §38: every AI controller is compared with a classical one on the same circuit (compare()), and the
protections stay in the circuit.
"""
import copy
import json
import math
import os
import random
import threading

PY_PI_NN = '''# PI + νευρωνικό δίκτυο που μαθαίνει online το υπόλοιπο (pcl.control, 3.15, ROADMAP §38).
# u = u_PI + u_nn. Το δίκτυο: είσοδοι r, y, e και η μεταβολή του y (κανονικοποιημένες), ένα κρυφό στρώμα tanh, γραμμική έξοδος.
# Μάθηση (άμεσος προσαρμοστικός έλεγχος με το πρόσημο του κέρδους του συστήματος υπό έλεγχο): μετά από κάθε δείγμα τα βάρη κινούνται ώστε
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

# ------------------------------------------------------------------ 3.16: networks in plain Python
# One copy of the code: the trainers below exec it, and the blocks carry it in their code, so training and the block
# compute with the same functions. Weights as lists of rows (out × in), tanh hidden layers, linear output.
MLP_SRC = '''
def mlp_new(sizes, seed, zero_out=False):
    import random as _rnd
    g = _rnd.Random(int(seed))
    W, b = [], []
    for i in range(len(sizes) - 1):
        last = i == len(sizes) - 2
        sd = (1.0 / sizes[i]) ** 0.5
        W.append([[0.0 if (zero_out and last) else g.gauss(0.0, sd) for _ in range(sizes[i])] for _ in range(sizes[i + 1])])
        b.append([0.0] * sizes[i + 1])
    return {"sizes": list(sizes), "W": W, "b": b}

def mlp_fwd(net, x):
    acts = [list(x)]
    a = acts[0]
    L = len(net["W"])
    for i in range(L):
        z = [bi + sum(w * v for w, v in zip(row, a)) for row, bi in zip(net["W"][i], net["b"][i])]
        a = [math.tanh(v) for v in z] if i < L - 1 else z
        acts.append(a)
    return acts

def mlp_back(net, acts, dout):
    L = len(net["W"])
    gW, gb = [None] * L, [None] * L
    delta = list(dout)
    for i in range(L - 1, -1, -1):
        a = acts[i]
        gW[i] = [[d * v for v in a] for d in delta]
        gb[i] = list(delta)
        W = net["W"][i]
        da = [sum(W[o][j] * delta[o] for o in range(len(delta))) for j in range(len(a))]
        delta = [g * (1.0 - v * v) for g, v in zip(da, a)] if i > 0 else da
    return gW, gb, delta

def mlp_apply(net, gW, gb, lr, clip=5.0):
    for i in range(len(net["W"])):
        for o, row in enumerate(net["W"][i]):
            g = gW[i][o]
            for j in range(len(row)):
                row[j] -= lr * max(-clip, min(clip, g[j]))
            net["b"][i][o] -= lr * max(-clip, min(clip, gb[i][o]))

def mlp_train(net, x, target, lr):
    acts = mlp_fwd(net, x)
    err = [q - t for q, t in zip(acts[-1], target)]
    gW, gb, _ = mlp_back(net, acts, err)
    mlp_apply(net, gW, gb, lr)
    return sum(e * e for e in err)

def mlp_flat(net):
    out = []
    for W, b in zip(net["W"], net["b"]):
        for row in W:
            out.extend(row)
        out.extend(b)
    return out

def mlp_set(net, flat):
    k = 0
    for W, b in zip(net["W"], net["b"]):
        for row in W:
            for j in range(len(row)):
                row[j] = flat[k]
                k += 1
        for j in range(len(b)):
            b[j] = flat[k]
            k += 1
    return net
'''
_NS = {'math': math}
exec(compile(MLP_SRC, '<pcl.control MLP>', 'exec'), _NS)       # noqa: S102 - our own code, the same the blocks carry
mlp_new, mlp_fwd, mlp_back, mlp_apply, mlp_train, mlp_flat, mlp_set = (
    _NS[k] for k in ('mlp_new', 'mlp_fwd', 'mlp_back', 'mlp_apply', 'mlp_train', 'mlp_flat', 'mlp_set'))

PY_INV_NN = '''# Αντίστροφος νευρωνικός έλεγχος με εξομοιωτή (indirect adaptive inverse control, pcl.control 3.16, ROADMAP §38 στάδιο 2).
# ANN 2 (εξομοιωτής): [κατάσταση(k), u(k)] -> Δy(k+1) = y(k+1) - y(k). ANN 1 (ελεγκτής): [στόχος Δy*, κατάσταση(k)] -> u(k).
# Μεταβολές κανονικοποιημένες με D, τη μεγαλύτερη μεταβολή ανά δείγμα στη διέγερση (καλύτερη κατάσταση από το y(k+1) σε κλίμακα Y).
# Στόχος ενός βήματος, προσβάσιμος: Δy* = clip(alpha*(r - y), +-max_step*D). Online σε κάθε δείγμα: ο εξομοιωτής από το
# σφάλμα πρόβλεψης e* = y - y^, ο ελεγκτής από το σφάλμα Δy* - Δy μέσω του εξομοιωτή (dy^/du, ψευδοαντίστροφο με φύλαξη).
# Δεν μαθαίνει ο ελεγκτής όσο η έξοδος είναι στον κορεσμό. Τα βάρη της εκπαίδευσης σε φάσεις (pcl.control.InverseTrainer) στο NETS.
import json, math
NETS = json.loads(r\'\'\'@NETS@\'\'\')
@MLP@
def init(p):
    d = json.loads(json.dumps(NETS))
    return {"emu": d["emu"], "ctrl": d["ctrl"], "prev": None, "n": 0}

def step(t, u, s, p):
    sc, UN, D = NETS["scale"], NETS["UN"], NETS["D"]
    meas = [u["y"]] + [u["s%d" % (k + 1)] for k in range(len(sc) - 1)]
    m = [v / c for v, c in zip(meas, sc)]
    r, y = u["r"], u["y"]
    pv = s["prev"]
    if pv is not None and p.get("learn", 1):
        dyn = (y - pv["y"]) / D
        if p.get("lr_emu", 0) > 0:
            mlp_train(s["emu"], pv["evec"], [dyn], p["lr_emu"])
        if p.get("lr_ctrl", 0) > 0 and not pv["sat"]:
            _, _, dx = mlp_back(s["emu"], mlp_fwd(s["emu"], pv["evec"]), [1.0])
            Ju = dx[-1]
            dc = -(pv["tn"] - dyn) * Ju / (Ju * Ju + 1e-3)
            gW, gb, _ = mlp_back(s["ctrl"], mlp_fwd(s["ctrl"], pv["cvec"]), [dc])
            mlp_apply(s["ctrl"], gW, gb, p["lr_ctrl"])
        s["n"] += 1
    inc = p["max_step"] * D
    tn = max(-inc, min(inc, p["alpha"] * (r - y))) / D
    cvec = [tn] + m
    v = mlp_fwd(s["ctrl"], cvec)[-1][0] * UN
    sat = v >= p["ymax"] or v <= p["ymin"]
    v = min(p["ymax"], max(p["ymin"], v))
    evec = m + [v / UN]
    yhat = y + mlp_fwd(s["emu"], evec)[-1][0] * D
    s["prev"] = {"evec": evec, "cvec": cvec, "tn": tn, "sat": sat, "y": y}
    return {"u": v, "yhat": yhat}
'''

PY_RL = '''# Ενισχυτική μάθηση (RL) με αναζήτηση πολιτικής (pcl.control.RLTrainer, 3.16, ROADMAP §38 στάδιο 2).
# Πολιτική: μικρό νευρωνικό δίκτυο pi_theta(r, y, e, Δy, κατάσταση) -> u_pi, φραγμένο με tanh, πάνω από τον PI (base = 1)
# ή μόνο του (base = 0). Τα theta τα βρίσκει η εκπαίδευση με evolution strategies: επεισόδια στο ίδιο κύκλωμα,
# ανταμοιβή -(IAE/IAE_PI + w*υπερύψωση). Με theta = 0 στην έξοδο είναι ακριβώς ο PI. Τα theta στο THETA.
import json, math
THETA = json.loads(r\'\'\'@THETA@\'\'\')
@MLP@
def init(p):
    return {"net": mlp_set(mlp_new(THETA["sizes"], 0), THETA["flat"]), "xi": 0.0, "yp": None}

def step(t, u, s, p):
    e, r, y = u["e"], u["r"], u["y"]
    sc = THETA["scale"]
    ys = sc[0]
    dy = 0.0 if s["yp"] is None else (y - s["yp"]) / ys
    x = [r / ys, y / ys, e / ys, max(-1.0, min(1.0, 10 * dy))] + [u["s%d" % (k + 1)] / sc[k + 1] for k in range(len(sc) - 1)]
    upi = p["nnmax"] * p["uscale"] * math.tanh(mlp_fwd(s["net"], x)[-1][0])
    s["yp"] = y
    if not p.get("base", 1):
        return {"u": min(p["ymax"], max(p["ymin"], upi)), "pi": upi}
    s["xi"] += p["Ki"] * p["Ts"] * e
    v = p["Kp"] * e + s["xi"] + upi
    if v > p["ymax"] or v < p["ymin"]:
        s["xi"] -= p["Ki"] * p["Ts"] * e
        v = min(p["ymax"], max(p["ymin"], p["Kp"] * e + s["xi"] + upi))
    return {"u": v, "pi": upi}
'''


# ------------------------------------------------------------------ 4.7: the neural network block of the app (NN)
# The block computes in JavaScript (web/studio/nn.js) and in the SciPy solver (engine/batch.py); its weights have the
# format of the networks above. These helpers make the weights the block starts from, with the same generator as the
# app (so a block with empty weights and a given seed starts from exactly these), and its parameters.
def _mulberry32(seed):
    a = [int(seed) & 0xFFFFFFFF]

    def r():
        a[0] = (a[0] + 0x6D2B79F5) & 0xFFFFFFFF
        t = a[0]
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t = (t ^ ((t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return r


def nn_init(sizes, seed=1, zero_out=True):
    """Weights N(0, 1/n_in) as the app's NN block draws them for this seed (zero_out: last layer zero, output 0)."""
    r = _mulberry32(seed)
    W, b = [], []
    for i in range(len(sizes) - 1):
        last = i == len(sizes) - 2
        sd = math.sqrt(1 / sizes[i])
        L = []
        for _ in range(sizes[i + 1]):
            row = []
            for _ in range(sizes[i]):
                u1, u2 = 1 - r(), r()
                z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
                row.append(0.0 if (zero_out and last) else sd * z)
            L.append(row)
        W.append(L)
        b.append([0.0] * sizes[i + 1])
    return {'sizes': list(sizes), 'W': W, 'b': b}


def nn_text(net):
    """The weights as the text of the block's parameter «Βάρη» (9 significant digits, as the app writes them)."""
    r = lambda v: float(f'{float(v):.9g}')
    sizes = net.get('sizes') or [len(net['W'][0][0])] + [len(L) for L in net['W']]
    return json.dumps({'sizes': list(sizes), 'W': [[[r(v) for v in row] for row in L] for L in net['W']],
                       'b': [[r(v) for v in row] for row in net['b']]}, separators=(',', ':'))


def nn_block(ins, net=None, hidden=(8,), xs=1, ys=1.0, ymin=-1.0, ymax=1.0, train='off', clock=None, **kw):
    """Parameters of an NN block: inputs (names), weights (a network as above, or None for random ones from 'seed'),
    scales of the inputs and the output, limits, learning ('off', 'err' or 'tgt') and the other parameters by name
    (lr, opt, clip, l2, nl, init, seed, learn, trig, y0)."""
    names = [k.strip() for k in (ins.split(',') if isinstance(ins, str) else ins) if k.strip()]
    if net is not None and len(net['W'][0][0]) != len(names):
        raise ValueError(f'το δίκτυο έχει {len(net["W"][0][0])} εισόδους, το μπλοκ {len(names)}')
    p = {'ins': ', '.join(names), 'xs': ', '.join(f'{v:g}' for v in xs) if isinstance(xs, (list, tuple)) else f'{xs:g}',
         'hidden': ', '.join(str(int(h)) for h in hidden), 'ys': ys, 'ymin': ymin, 'ymax': ymax, 'train': train,
         'w': nn_text(net) if net is not None else ''}
    if clock:
        p['clock'] = clock
    p.update(kw)
    return p


def inv_nn_code(nets):
    """The block code of an inverse controller with its trained networks (emu, ctrl, scale, UN)."""
    return PY_INV_NN.replace('@NETS@', json.dumps(nets)).replace('@MLP@', MLP_SRC)


def rl_code(theta):
    """The block code of an RL policy with its parameters (sizes, flat, scale)."""
    return PY_RL.replace('@THETA@', json.dumps(theta)).replace('@MLP@', MLP_SRC)


TYPES = ('pi', 'pi_nn', 'code', 'inv_nn', 'rl')
LABELS = {'pi': 'PI', 'pi_nn': 'PI + NN', 'code': 'κώδικας', 'inv_nn': 'αντίστροφο NN', 'rl': 'RL'}


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
        state = [str(x) for x in (lp.get('state') or [])]
        for sk in state:
            if sk.partition(':')[0] not in ids:
                raise ValueError(f'Βρόχος «{name}»: δεν υπάρχει η μέτρηση κατάστασης «{sk}».')
        lclk = clk
        if lp.get('Ts'):                      # 3.16: its own sampling, from a clock block
            Ts = _num(lp['Ts'])
            if not Ts or Ts <= 0:
                raise ValueError(f'Βρόχος «{name}»: Ts > 0 σε s.')
            added.append({'id': base + 'K', 'type': 'CLK', 'x': x0 - 110, 'y': y, 'rot': 0, 'flip': False, 'label': f'T_s {name}',
                          'params': {'f': 1 / Ts, 'duty': 0.5, 'phase': 0}})
            lclk = base + 'K'
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
        span = (hi - lo) if hi < 1e8 and lo > -1e8 else 1.0
        if typ == 'pi':
            blk = {'type': 'PIB', 'params': {'Kp': kp, 'Ki': ki, 'ymin': lo, 'ymax': hi, 'y0': 0, 'in_u': base + 'E:y'}}
            out = cid + ':y'
        else:
            pars = {'Kp': kp, 'Ki': ki, 'ymin': lo, 'ymax': hi}
            outs = 'u'
            if typ == 'pi_nn':
                code, outs = PY_PI_NN, 'u, nn'
                pars.update({'lr': _num(ct.get('lr'), 0.02), 'learn': 1 if ct.get('learn', True) else 0, 'hidden': int(_num(ct.get('hidden'), 8)),
                             'seed': int(_num(ct.get('seed'), 1)), 'sign': _num(ct.get('sign'), 1.0), 'nnmax': _num(ct.get('nnmax'), 0.3),
                             'yscale': _num(ct.get('yscale'), max(1e-12, abs(_num(lp.get('yscale'), 1.0)))), 'uscale': _num(ct.get('uscale'), span)})
            elif typ == 'inv_nn':
                nets = ct.get('nets')
                if not nets:
                    raise ValueError(f'Βρόχος «{name}»: ο αντίστροφος ελεγκτής θέλει πρώτα εκπαίδευση σε φάσεις (InverseTrainer ή «Εκπαίδευση» στο πρόσθετο).')
                if len(nets['scale']) != 1 + len(state):
                    raise ValueError(f'Βρόχος «{name}»: τα δίκτυα εκπαιδεύτηκαν με {len(nets["scale"]) - 1} μετρήσεις κατάστασης, ο βρόχος έχει {len(state)}.')
                code, outs = inv_nn_code(nets), 'u, yhat'
                pars.update({'alpha': _num(ct.get('alpha'), 0.5), 'max_step': _num(ct.get('max_step'), 0.8), 'learn': 1 if ct.get('learn', True) else 0,
                             'lr_emu': _num(ct.get('lr_emu'), 0.01), 'lr_ctrl': _num(ct.get('lr_ctrl'), 0.02)})
            elif typ == 'rl':
                ys = max(1e-12, abs(_num(lp.get('yscale'), 1.0)))
                theta = ct.get('theta') or rl_theta0(len(state), int(_num(ct.get('hidden'), 8)), int(_num(ct.get('seed'), 1)),
                                                     [ys] + [abs(_num(v, 1.0)) or 1.0 for v in (lp.get('state_scale') or [1.0] * len(state))])
                if len(theta['scale']) != 1 + len(state):
                    raise ValueError(f'Βρόχος «{name}»: η πολιτική εκπαιδεύτηκε με {len(theta["scale"]) - 1} μετρήσεις κατάστασης, ο βρόχος έχει {len(state)}.')
                base_pi = 0 if str(ct.get('base', 'pi')) in ('none', '0', 'False') else 1
                code, outs = rl_code(theta), 'u, pi'
                pars.update({'base': base_pi, 'nnmax': _num(ct.get('nnmax'), 0.3 if base_pi else 1.0),
                             'uscale': _num(ct.get('uscale'), span if base_pi else max(abs(lo), abs(hi)) if span != 1.0 else 1.0)})
            else:
                code = str(ct.get('code') or '')
                if 'def step' not in code:
                    raise ValueError(f'Βρόχος «{name}»: ο κώδικας θέλει init(p) και step(t, u, s, p).')
            pars.update({k2: v for k2, v in (ct.get('pars') or {}).items()})
            ins = ['e', 'r', 'y'] + [f's{j + 1}' for j in range(len(state))]
            blk = {'type': 'PY', 'params': {'code': code, 'ins': ', '.join(ins), 'outs': outs,
                                            'pars': ', '.join(f'{a} = {json.dumps(b)}' for a, b in pars.items()), 'y0': 0,
                                            'in_e': base + 'E:y', 'in_r': ref, 'in_y': meas,
                                            **{f'in_s{j + 1}': sk for j, sk in enumerate(state)}}}
            out = cid + ':u'
        if lclk:
            blk['params'].update({'clock': lclk, 'trig': 'start'})
        added.append({'id': cid, 'x': x0 + 230, 'y': y, 'rot': 0, 'flip': False, 'label': f'{LABELS[typ]} {name}', **blk})
        if lp.get('dither'):                  # 3.16: a program added to the controller's output (excitation)
            added.append({'id': base + 'D', 'type': 'CONST', 'x': x0 + 300, 'y': y + 40, 'rot': 0, 'flip': False, 'label': f'διέγερση {name}',
                          'params': {'v': str(lp['dither'])}})
            added.append({'id': base + 'U', 'type': 'SUM', 'x': x0 + 330, 'y': y, 'rot': 0, 'flip': False, 'label': f'u_{name}',
                          'params': {'signs': '++', 'in_a': out, 'in_b': base + 'D:y'}})
            out = base + 'U:y'
        scale = _num(lp.get('scale'), 1.0)
        if scale != 1.0:
            added.append({'id': base + 'G', 'type': 'GAIN', 'x': x0 + 360, 'y': y, 'rot': 0, 'flip': False, 'label': f'×{scale:.4g}',
                          'params': {'K': scale, 'in_u': out}})
            out = base + 'G:y'
        desc.append({'loop': name, 'measure': meas, 'ctrl': typ, 'block': cid, 'out': out, 'ref': ref, 'state': state, 'clock': lclk,
                     'u': out if scale == 1.0 else (base + 'U:y' if lp.get('dither') else cid + (':y' if typ == 'pi' else ':u'))})
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


# ====================================================================== 3.16: training and comparison (ROADMAP §38 stage 2)
def rl_theta0(n_state, hidden=8, seed=1, scale=None):
    """The starting policy: random hidden layer, zero output, so π = 0 and the controller is the PI (or 0 without it)."""
    net = mlp_new([4 + n_state, int(hidden), 1], seed, zero_out=True)
    return {'sizes': net['sizes'], 'flat': mlp_flat(net), 'scale': list(scale or [1.0] * (1 + n_state))}


def _project_data(project):
    return copy.deepcopy(project.data if hasattr(project, 'data') else project)


def _chan(keys, sig):
    """The scope channel of a signal pin '<id>:<pin>': Y:<id>:<pin>, or Y:<id> for the block's first output."""
    cid, _, pin = str(sig).partition(':')
    for k in (f'Y:{cid}:{pin}', f'Y:{cid}'):
        if k in keys:
            return k
    raise ValueError(f'Δεν βρέθηκε κανάλι για το σήμα «{sig}».')


class _Runner:
    """Many runs of the browser's solver at once (3.16): in the app, the page's pool of workers (with Python since 3.16);
    here, threads with one open Node process each (Python is loaded once per process, not once per run)."""

    def __init__(self, workers=None):
        from . import core
        self.core = core
        self.workers = workers
        self.local = threading.local()
        self.sessions = []
        self.lock = threading.Lock()

    def _one(self, q):
        s = getattr(self.local, 's', None)
        if s is None:
            s = self.local.s = self.core._Session()
            with self.lock:
                self.sessions.append(s)
        try:
            return {'out': s(q)}
        except self.core.PclError as e:
            return {'error': str(e)}

    def map(self, qs):
        c = self.core
        if c.IN_BROWSER:
            if c._batch_hook is not None and len(qs) > 1:
                res = c._batch_hook(qs)
                if res is not None:
                    return res['outs']
            out = []
            for q in qs:
                try:
                    out.append({'out': c._backend(q)})
                except c.PclError as e:
                    out.append({'error': str(e)})
            return out
        nw = max(1, min(int(self.workers or os.cpu_count() or 1), len(qs)))
        if nw == 1:
            return [self._one(q) for q in qs]
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=nw) as ex:
            return list(ex.map(self._one, qs))

    def close(self):
        for s in self.sessions:
            s.close()
        self.sessions = []


def _query(data, t_end, channels, run=None):
    r = dict(run or {})
    sim = data.get('sim') or {}
    q = {'action': 'run', 'project': data, 't_end': float(t_end), 'channels': list(channels), 'hdiv': int(r.get('hdiv') or sim.get('hDiv') or 200),
         'method': r.get('method') or sim.get('method') or 'TR', 'max_points': int(r.get('max_points') or 20000), 'check': False}
    if r.get('step'):
        q['step'] = {'mode': r['step']}
    return q


def _samples(t, y, tk, last):
    """y at the sample instants tk: the first record at t ≥ t_k (the measurement, t⁻ = t), or with last the last
    record at t ≤ t_k (a controller output, which changes at t_k)."""
    out, j, n = [], 0, len(t)
    for x in tk:
        eps = 1e-9 * max(1e-12, abs(x))
        if last:
            while j + 1 < n and t[j + 1] <= x + eps:
                j += 1
        else:
            while j < n - 1 and t[j] < x - eps:
                j += 1
        out.append(y[j])
    return out


def _program(rng, t_end, lo, hi, hold):
    """A random piecewise-constant program t:value (levels in lo … hi, each held hold[0] … hold[1] s)."""
    pts, t = [], 0.0
    while t < t_end:
        pts.append(f'{t:.9g}:{rng.uniform(lo, hi):.6g}')
        t += rng.uniform(hold[0], hold[1])
    return ', '.join(pts)


def _ref_range(lp):
    """The output range of a loop: 'yrange', else from its reference program (0 … the largest value)."""
    if lp.get('yrange'):
        a, b = (float(v) for v in lp['yrange'])
        return min(a, b), max(a, b)
    vals = []
    for part in str(lp.get('ref', '0')).split(','):
        v = part.split(':')[-1].strip()
        try:
            vals.append(float(v))
        except ValueError:
            pass
    lo, hi = min(vals + [0.0]), max(vals + [0.0])
    return (lo, hi) if hi > lo else (lo - 1.0, hi + 1.0)


class InverseTrainer:
    """Indirect adaptive inverse control trained in phases on the circuit (3.16, ROADMAP §38 stage 2), as the steps of
    the workbench's indirect_inverse: excite → emulator → controller → online.

      excite      the circuit runs with the loop's classical PI and a random reference (the outermost loop) plus a random
                  dither on its output, so the plant stays in its range; samples y, the state and u at every T_s
      emulator    ANN 2 learns Δy(k+1) = y(k+1) − y(k) from [state(k), u(k)], off-line, epoch by epoch (MSE of e*/D)
      controller  ANN 1 learns u(k) from [Δy(k+1), state(k)] (direct inverse regression), the start of the online stage
    The changes are normalised by D, the largest change per sample in the excitation: the one-step map is far better
    conditioned than y(k+1) on the scale of y (the workbench's form), when T_s is short against the plant.
      online      the loop gets the inv_nn controller with these weights; in the circuit both networks keep adapting

    Every phase can run alone (the add-on shows each one and its progress) and the whole trainer is JSON (to_dict),
    so the phases can run in separate calls. `loops`, `actuator`, `clock` as in compose; `loop` the AI loop (index or
    name), which needs the classical gains Kp, Ki and the output limits lo, hi in its ctrl, and 'Ts' and 'state'."""

    STEPS = (('excite', 'Διέγερση του κυκλώματος'), ('emulator', 'Εξομοιωτής (ANN 2)'), ('controller', 'Ελεγκτής (ANN 1)'), ('online', 'Online στο κύκλωμα'))

    def __init__(self, project, loops, actuator, loop=0, clock=None, t_excite=0.6, hold=(0.02, 0.1), dither=0.15, seed=1,
                 hidden_emu=12, hidden_ctrl=12, lr_emu=0.05, lr_ctrl=0.05, epochs_emu=40, epochs_ctrl=40,
                 alpha=0.5, max_step=0.8, lr_emu_online=0.01, lr_ctrl_online=0.02, run=None):
        self.data = _project_data(project)
        self.loops = json.loads(json.dumps(loops))
        self.actuator, self.clock = actuator, clock
        self.li = loop if isinstance(loop, int) else next(i for i, x in enumerate(self.loops) if x.get('name') == loop)
        self.lp = self.loops[self.li]
        ct = self.lp.get('ctrl') or {}
        self.lo, self.hi = _num(ct.get('lo'), -1.0), _num(ct.get('hi'), 1.0)
        if not (self.hi < 1e8 and self.lo > -1e8):
            raise ValueError('Ο βρόχος του αντίστροφου ελεγκτή θέλει όρια εξόδου lo, hi (η περιοχή του u).')
        self.o = {'t_excite': float(t_excite), 'hold': list(hold), 'dither': float(dither), 'seed': int(seed), 'hidden_emu': int(hidden_emu),
                  'hidden_ctrl': int(hidden_ctrl), 'lr_emu': float(lr_emu), 'lr_ctrl': float(lr_ctrl), 'epochs_emu': int(epochs_emu),
                  'epochs_ctrl': int(epochs_ctrl), 'alpha': float(alpha), 'max_step': float(max_step), 'lr_emu_online': float(lr_emu_online),
                  'lr_ctrl_online': float(lr_ctrl_online), 'run': dict(run or {})}
        self.done, self.data_set, self.emu, self.ctrl, self.scale, self.D = [], None, None, None, None, None
        self.UN = max(abs(self.lo), abs(self.hi)) or 1.0
        self.hist = {'emulator': [], 'controller': []}
        self.info = {}

    # --------------------------------------------------------------- state as JSON (the add-on keeps it between phases)
    def to_dict(self):
        return {'kind': 'inv_nn', 'data': self.data, 'loops': self.loops, 'actuator': self.actuator, 'clock': self.clock, 'li': self.li,
                'o': self.o, 'done': self.done, 'set': self.data_set, 'emu': self.emu, 'ctrl': self.ctrl, 'scale': self.scale, 'UN': self.UN, 'D': self.D,
                'hist': self.hist, 'info': self.info}

    @classmethod
    def from_dict(cls, d):
        t = cls.__new__(cls)
        t.data, t.loops, t.actuator, t.clock, t.li, t.o = d['data'], d['loops'], d['actuator'], d.get('clock'), d['li'], d['o']
        t.lp = t.loops[t.li]
        ct = t.lp.get('ctrl') or {}
        t.lo, t.hi = _num(ct.get('lo'), -1.0), _num(ct.get('hi'), 1.0)
        t.done, t.data_set, t.emu, t.ctrl, t.scale, t.UN, t.D = d['done'], d['set'], d['emu'], d['ctrl'], d['scale'], d['UN'], d.get('D')
        t.hist, t.info = d['hist'], d.get('info', {})
        return t

    def status(self):
        return [{'id': k, 'title': v, 'done': k in self.done} for k, v in self.STEPS]

    # --------------------------------------------------------------- phases
    def excite(self):
        """Phase 1: one run of the circuit with the classical loop, a random reference and a dither; the samples."""
        from . import core
        rng = random.Random(self.o['seed'])
        L = json.loads(json.dumps(self.loops))
        lp = L[self.li]
        te = self.o['t_excite']
        ylo, yhi = _ref_range(self.loops[0])
        if self.li == 0:
            pad = 0.05 * (yhi - ylo)
            lp['ref'] = _program(rng, te, ylo + pad, yhi - pad, self.o['hold'])
        ct = dict(lp.get('ctrl') or {})
        ct['type'] = 'pi'
        lp['ctrl'] = ct
        Ts = _num(lp.get('Ts'))
        a = self.o['dither'] * (self.hi - self.lo)
        lp['dither'] = _program(rng, te, -a / 2, a / 2, [max(2, 1) * (Ts or 1e-3), 8 * (Ts or 1e-3)])
        pr, desc = compose(self.data, L, self.actuator, self.clock)
        d = desc[self.li]
        keys = core.Project(pr).channels()
        T = keys['T']
        Ts = Ts or T
        ch_y = _chan(keys['keys'], d['measure'])
        ch_s = [_chan(keys['keys'], sk) for sk in d['state']]
        ch_u = _chan(keys['keys'], d['u'])
        runner = _Runner()
        try:
            r = runner.map([_query(pr, te, [ch_y] + ch_s + [ch_u], {**self.o['run'], 'max_points': 10 ** 7})])[0]
        finally:
            runner.close()
        if r.get('error'):
            raise ValueError('Διέγερση: ' + r['error'])
        out = r['out']
        t = out['t']
        tk = [k * Ts for k in range(1, int(te / Ts + 1e-9) + 1) if k * Ts <= t[-1] * (1 + 1e-12)]
        Y = _samples(t, out['ch'][ch_y], tk, False)
        S = [_samples(t, out['ch'][c], tk, False) for c in ch_s]
        U = _samples(t, out['ch'][ch_u], tk, True)
        ys = max(abs(ylo), abs(yhi)) if self.li == 0 else max(1e-12, max(abs(v) for v in Y) * 1.2)
        st_sc = [_num(v) for v in (self.lp.get('state_scale') or [])]
        self.scale = [ys] + [st_sc[j] if j < len(st_sc) and st_sc[j] else max(1e-12, 1.2 * max(abs(v) for v in col)) for j, col in enumerate(S)]
        M = [[Y[k] / self.scale[0]] + [S[j][k] / self.scale[j + 1] for j in range(len(S))] for k in range(len(tk))]
        self.D = max(1e-12, 1.2 * max(abs(Y[k + 1] - Y[k]) for k in range(len(Y) - 1)))      # the largest change per sample
        self.data_set = {'M': M, 'U': [u / self.UN for u in U], 'dY': [(Y[k + 1] - Y[k]) / self.D for k in range(len(Y) - 1)], 'Ts': Ts}
        self.info.update({'samples': len(tk), 'Ts': Ts, 'y_range': [min(Y), max(Y)], 'u_range': [min(U), max(U)], 'D': self.D, 'wall_s': out['meta'].get('wall_s')})
        self.emu = mlp_new([len(self.scale) + 1, self.o['hidden_emu'], 1], self.o['seed'])
        self.ctrl = mlp_new([len(self.scale) + 1, self.o['hidden_ctrl'], 1], self.o['seed'] + 99)
        self.hist = {'emulator': [], 'controller': []}
        self.done = ['excite']
        return {'samples': len(tk), 'Ts': Ts, 'y': [min(Y), max(Y)], 'u': [min(U), max(U)]}

    def _xy(self):
        """(emulator input [state(k), u(k)], its target Δy(k+1)/D, state(k)) per sample."""
        M, U, dY = self.data_set['M'], self.data_set['U'], self.data_set['dY']
        return [(M[k] + [U[k]], dY[k], M[k]) for k in range(len(M) - 1)]

    def emulator(self, epochs=None):
        """Phase 2: `epochs` passes (default all that remain) of ANN 2 over the samples. MSE of e* per epoch."""
        if 'excite' not in self.done:
            raise ValueError('Πρώτα η διέγερση.')
        rows = self._xy()
        n = self.o['epochs_emu'] - len(self.hist['emulator']) if epochs is None else int(epochs)
        for _ in range(max(0, n)):
            rng = random.Random(self.o['seed'] + len(self.hist['emulator']))
            idx = list(range(len(rows)))
            rng.shuffle(idx)
            se = sum(mlp_train(self.emu, rows[j][0], [rows[j][1]], self.o['lr_emu']) for j in idx)
            self.hist['emulator'].append(se / len(rows))
        if len(self.hist['emulator']) >= self.o['epochs_emu'] and 'emulator' not in self.done:
            self.done.append('emulator')
        return self.hist['emulator']

    def controller(self, epochs=None):
        """Phase 3: ANN 1 as the direct inverse, [Δy(k+1), state(k)] → u(k), over the samples. MSE of u per epoch."""
        if 'emulator' not in self.done:
            raise ValueError('Πρώτα ο εξομοιωτής.')
        rows = self._xy()
        n = self.o['epochs_ctrl'] - len(self.hist['controller']) if epochs is None else int(epochs)
        for _ in range(max(0, n)):
            rng = random.Random(self.o['seed'] + 1000 + len(self.hist['controller']))
            idx = list(range(len(rows)))
            rng.shuffle(idx)
            se = sum(mlp_train(self.ctrl, [rows[j][1]] + rows[j][2], [rows[j][0][-1]], self.o['lr_ctrl']) for j in idx)
            self.hist['controller'].append(se / len(rows))
        if len(self.hist['controller']) >= self.o['epochs_ctrl'] and 'controller' not in self.done:
            self.done.append('controller')
        return self.hist['controller']

    def nets(self):
        return {'emu': self.emu, 'ctrl': self.ctrl, 'scale': self.scale, 'UN': self.UN, 'D': self.D}

    def ctrl_spec(self, learn=True):
        """The loop's ctrl for compose: the inverse controller with these networks."""
        ct = dict(self.lp.get('ctrl') or {})
        ct.update({'type': 'inv_nn', 'nets': self.nets(), 'alpha': self.o['alpha'], 'max_step': self.o['max_step'], 'learn': bool(learn),
                   'lr_emu': self.o['lr_emu_online'], 'lr_ctrl': self.o['lr_ctrl_online']})
        return ct

    def online(self, learn=True):
        """Phase 4: the project with the inverse controller in the loop (it adapts online whenever the circuit runs)."""
        if 'controller' not in self.done:
            raise ValueError('Πρώτα ο ελεγκτής.')
        from .core import Project
        L = json.loads(json.dumps(self.loops))
        L[self.li]['ctrl'] = self.ctrl_spec(learn)
        if 'online' not in self.done:
            self.done.append('online')
        pr, desc = compose(self.data, L, self.actuator, self.clock)
        return Project(pr, name='inv_nn'), desc

    def run_all(self, progress=None):
        """All the phases; progress(step_id, fraction). Returns online(): the project and the description."""
        self.excite()
        if progress:
            progress('excite', 1.0)
        for name, f, tot in (('emulator', self.emulator, self.o['epochs_emu']), ('controller', self.controller, self.o['epochs_ctrl'])):
            for _ in range(tot):
                f(1)
                if progress:
                    progress(name, len(self.hist[name]) / tot)
        return self.online()


class RLTrainer:
    """Reinforcement learning by policy search on the circuit (3.16, ROADMAP §38 stage 2): evolution strategies
    (antithetic Gaussian perturbations of θ, rank-shaped returns, Adam), each candidate one episode of the same scenario
    in the same circuit. The return is −(IAE/IAE_PI + w_os·overshoot/100 + w_ise·ISE/ISE_PI) of the outermost loop, so
    the PI (θ with zero output) scores −1 − w_os·OS_PI/100. With variants=[{'M1.TL': …}, …] each candidate runs every
    variant (a policy that holds over load changes). The episodes run in parallel: the page's pool in the app, Node
    processes here. Policy search is a black-box RL method: no model of the plant, only episodes and returns."""

    def __init__(self, project, loops, actuator, loop=0, clock=None, t_end=None, base='pi', hidden=8, sigma=0.05, lr=0.05,
                 population=8, seed=1, w_overshoot=1.0, w_ise=0.0, nnmax=None, variants=None, run=None, workers=None):
        self.data = _project_data(project)
        self.loops = json.loads(json.dumps(loops))
        self.actuator, self.clock = actuator, clock
        self.li = loop if isinstance(loop, int) else next(i for i, x in enumerate(self.loops) if x.get('name') == loop)
        lp = self.loops[self.li]
        n_state = len(lp.get('state') or [])
        ys = max(1e-12, abs(_num(lp.get('yscale'), 1.0)))
        sc = [ys] + [abs(_num(v, 1.0)) or 1.0 for v in (lp.get('state_scale') or [1.0] * n_state)]
        self.theta = rl_theta0(n_state, hidden, seed, sc)
        self.o = {'t_end': float(t_end or (self.data.get('sim') or {}).get('stopT') or 0.4), 'base': base, 'sigma': float(sigma), 'lr': float(lr),
                  'population': max(2, int(population) // 2 * 2), 'seed': int(seed), 'w_overshoot': float(w_overshoot), 'w_ise': float(w_ise),
                  'nnmax': nnmax, 'variants': list(variants or [{}]), 'run': dict(run or {}), 'workers': workers}
        self.adam = {'m': [0.0] * len(self.theta['flat']), 'v': [0.0] * len(self.theta['flat']), 'k': 0}
        self.best = {'J': None, 'flat': list(self.theta['flat'])}
        self.baseline = None
        self.hist = []

    def to_dict(self):
        return {'kind': 'rl', 'data': self.data, 'loops': self.loops, 'actuator': self.actuator, 'clock': self.clock, 'li': self.li, 'theta': self.theta,
                'o': self.o, 'adam': self.adam, 'best': self.best, 'baseline': self.baseline, 'hist': self.hist}

    @classmethod
    def from_dict(cls, d):
        t = cls.__new__(cls)
        for k in ('data', 'loops', 'actuator', 'clock', 'li', 'theta', 'o', 'adam', 'best', 'baseline', 'hist'):
            setattr(t, k, d.get(k))
        return t

    def ctrl_spec(self, flat=None):
        ct = dict(self.loops[self.li].get('ctrl') or {})
        ct.update({'type': 'rl', 'theta': {**self.theta, 'flat': list(flat if flat is not None else self.best['flat'])}, 'base': self.o['base']})
        if self.o.get('nnmax') is not None:
            ct['nnmax'] = self.o['nnmax']
        return ct

    def project(self, flat=None):
        """The project (pcl.Project) with the policy (default the best one found) in the loop, and the description."""
        from .core import Project
        L = json.loads(json.dumps(self.loops))
        L[self.li]['ctrl'] = self.ctrl_spec(flat)
        pr, desc = compose(self.data, L, self.actuator, self.clock)
        return Project(pr, name='rl'), desc

    def _queries(self, flats):
        from . import core
        qs, ch = [], None
        for flat in flats:
            pq, desc = self.project(flat)
            pr = pq.data
            if ch is None:
                keys = pq.channels()['keys']
                ch = [_chan(keys, desc[0]['ref']) if desc[0]['ref'] else None, _chan(keys, desc[0]['measure'])]
            for v in self.o['variants']:
                q = core.Project(pr)
                for k, val in v.items():
                    q.set(k, val)
                qs.append(_query(q.data, self.o['t_end'], ch, self.o['run']))
        return qs, ch

    def _scores(self, runner, flats):
        qs, ch = self._queries(flats)
        outs = runner.map(qs)
        nv = len(self.o['variants'])
        res = []
        for i in range(len(flats)):
            ms = []
            for o in outs[i * nv:(i + 1) * nv]:
                if o.get('error'):
                    ms.append(None)
                    continue
                out = o['out']
                ms.append(metrics(out['t'], out['ch'][ch[0]], out['ch'][ch[1]]))
            res.append(ms)
        return res

    def _J(self, ms):
        if any(m is None for m in ms) or not self.baseline:
            return float('inf')
        J = 0.0
        for m, b in zip(ms, self.baseline['metrics']):
            J += m['IAE'] / max(1e-15, b['IAE']) + self.o['w_overshoot'] * m['overshoot_pct'] / 100 + self.o['w_ise'] * m['ISE'] / max(1e-15, b['ISE'])
        return J / len(ms)

    def iterate(self, n=1, progress=None):
        """n iterations: the baseline (θ₀, the PI) once, then per iteration the population and θ itself."""
        runner = _Runner(self.o.get('workers'))
        try:
            if self.baseline is None:
                flat0 = list(self.theta['flat'])
                ms = self._scores(runner, [flat0])[0]
                if any(m is None for m in ms):
                    raise ValueError('Το επεισόδιο αναφοράς (PI) απέτυχε.')
                self.baseline = {'metrics': ms}
                self.baseline['J'] = self._J(ms)
                self.best = {'J': self.baseline['J'], 'flat': flat0}
            th = self.theta['flat']
            d = len(th)
            for _ in range(int(n)):
                it = len(self.hist)
                rng = random.Random(self.o['seed'] * 7919 + it)
                half = self.o['population'] // 2
                eps = [[rng.gauss(0.0, 1.0) for _ in range(d)] for _ in range(half)]
                sg = self.o['sigma']
                cands = [[a + sg * e for a, e in zip(th, ep)] for ep in eps] + [[a - sg * e for a, e in zip(th, ep)] for ep in eps] + [list(th)]
                Js = [self._J(ms) for ms in self._scores(runner, cands)]
                R = [-j for j in Js[:-1]]
                order = sorted(range(len(R)), key=lambda i: R[i])
                util = [0.0] * len(R)
                for rank, i in enumerate(order):
                    util[i] = rank / (len(R) - 1) - 0.5
                g = [sum((util[i] - util[i + half]) * eps[i][j] for i in range(half)) / (len(R) * sg) for j in range(d)]
                a = self.adam
                a['k'] += 1
                b1, b2 = 0.9, 0.999
                for j in range(d):
                    a['m'][j] = b1 * a['m'][j] + (1 - b1) * g[j]
                    a['v'][j] = b2 * a['v'][j] + (1 - b2) * g[j] * g[j]
                    mh, vh = a['m'][j] / (1 - b1 ** a['k']), a['v'][j] / (1 - b2 ** a['k'])
                    th[j] += self.o['lr'] * mh / (math.sqrt(vh) + 1e-8)
                for i, j in enumerate(Js):
                    if j < self.best['J']:
                        self.best = {'J': j, 'flat': list(cands[i])}
                self.hist.append({'iter': it + 1, 'J_theta': Js[-1], 'J_mean': sum(Js[:-1]) / len(R), 'J_min': min(Js[:-1]), 'J_best': self.best['J']})
                if progress:
                    progress(it + 1, self.hist[-1])
        finally:
            runner.close()
        return self.hist


def compare(project, loops, actuator, variants, t_end, clock=None, run=None, workers=None, loop=0):
    """The same circuit and scenario with each controller (3.16, the rule of ROADMAP §38): variants =
    [(name, {loop_name: ctrl, …}), …], each ctrl replacing that loop's (type and its settings). Every run in parallel.
    → rows [{name, IAE, ISE, overshoot_pct, final_error}] of the loop `loop` (the outermost by default) and the
    waveforms {name: (t, r, y)}."""
    from . import core
    project = _project_data(project)
    qs, chs = [], []
    for name, patch in variants:
        L = json.loads(json.dumps(loops))
        for lp in L:
            if lp.get('name') in patch:
                lp['ctrl'] = {**(lp.get('ctrl') or {}), **patch[lp['name']]}
        pr, desc = compose(project, L, actuator, clock)
        keys = core.Project(pr).channels()['keys']
        d = desc[loop if isinstance(loop, int) else next(i for i, x in enumerate(desc) if x['loop'] == loop)]
        ch = [_chan(keys, d['ref']), _chan(keys, d['measure'])]
        chs.append(ch)
        qs.append(_query(pr, t_end, ch, run))
    runner = _Runner(workers)
    try:
        outs = runner.map(qs)
    finally:
        runner.close()
    rows, waves = [], {}
    for (name, _), ch, o in zip(variants, chs, outs):
        if o.get('error'):
            rows.append({'name': name, 'error': o['error']})
            continue
        out = o['out']
        rows.append({'name': name, **metrics(out['t'], out['ch'][ch[0]], out['ch'][ch[1]])})
        waves[name] = (out['t'], out['ch'][ch[0]], out['ch'][ch[1]])
    return rows, waves
