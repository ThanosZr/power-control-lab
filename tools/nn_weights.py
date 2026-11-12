"""Weights of the inverse model in the tutorial «Έλεγχος με νευρωνικό δίκτυο: σύγκριση» (4.7, nn_compare, option
«αντίστροφο μοντέλο»), trained offline from a simulation, and written into web/studio/tutorials.js (NN_DC_INV).

1. Data: the tutorial's machine under its PI alone, with a reference that steps every 0.4 s to values between 0 and
   160 rad/s (a fixed sequence), 16 s with the app's solver (pcl, browser solver). At every sample of the 1 kHz clock:
   the speed ω, its derivative α = (τ_e − τ_L − b·ω)/J from the machine's own outputs, and the voltage v applied.
2. Training: the network of the block (2 inputs ω/150 and α/3000, 8 tanh, linear output ×100 V) learns v from (ω, α),
   Adam with the block's arithmetic (engine.batch._nn_learn), 40 passes over the data in a fixed shuffled order.
   This is the machine's inverse model (generalized inverse learning). In the tutorial it gets the reference (ω_r, α_r)
   instead of the measured values, and the PI corrects what it does not know.

Usage: python tools/nn_weights.py           train and write NN_DC_INV
       python tools/nn_weights.py --check   train and compare with what tutorials.js has (the CI)
"""
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from engine.batch import _nn_fwd, _nn_learn          # noqa: E402
from pcl import tutorial                               # noqa: E402
from pcl.control import _mulberry32, nn_init, nn_text  # noqa: E402

TUT = ROOT / 'web' / 'studio' / 'tutorials.js'
XS, YS = (150.0, 3000.0), 100.0


def data():
    r = _mulberry32(2026)
    steps = ['0:0'] + [f'{0.4 * k:.1f}:{round(160 * r())}' for k in range(1, 40)]
    p = tutorial('nn_compare', ctrl='pi', load='fan')
    p.set('KW.v', ', '.join(steps))
    meta = p.data.get('meta') or {}
    J, b = meta.get('J', .02), meta.get('bm', .002)
    res = p.run(t_end=16.0, channels=['Y:M1', 'Y:M1:te', 'Y:TLX', 'Y:SAT1'], hdiv=20, max_points=10 ** 7)
    t, w, te, tl, v = res.t, res['Y:M1'], res['Y:M1:te'], res['Y:TLX'], res['Y:SAT1']
    X, Y, k, n = [], [], 1, len(t)
    for i in range(n):                                  # the samples of the 1 kHz clock
        if t[i] + 1e-9 >= k * 1e-3:
            a = (te[i] - tl[i] - b * w[i]) / J
            X.append([w[i] / XS[0], a / XS[1]])
            Y.append(v[i] / YS)
            k += 1
    return X, Y


def train(X, Y, epochs=40, lr=3e-3):
    net = nn_init([2, 8, 1], 1, False)
    npar = sum(len(L) * len(L[0]) for L in net['W']) + sum(len(q) for q in net['b'])
    opt = {'k': 0, 'm': [0.0] * npar, 'v': [0.0] * npar}
    r = _mulberry32(7)
    idx = list(range(len(X)))
    for _ in range(epochs):
        for i in range(len(idx) - 1, 0, -1):            # Fisher–Yates with the fixed generator
            j = int(r() * (i + 1))
            idx[i], idx[j] = idx[j], idx[i]
        for i in idx:
            acts = _nn_fwd(net, X[i])
            _nn_learn(net, opt, acts, acts[-1][0] - Y[i], lr, 5.0, 0.0, 'adam')
    err = math.sqrt(sum((_nn_fwd(net, x)[-1][0] - y) ** 2 for x, y in zip(X, Y)) / len(X)) * YS
    return net, err


LINE = re.compile(r'^ const NN_DC_INV=.*;$', re.M)


def main():
    X, Y = data()
    net, err = train(X, Y)
    text = nn_text(net)
    src = TUT.read_text(encoding='utf-8')
    if not LINE.search(src):
        raise SystemExit('Δεν βρέθηκε η γραμμή NN_DC_INV στο tutorials.js.')
    print(f'{len(X)} δείγματα, RMS σφάλμα του αντίστροφου μοντέλου {err:.2f} V')
    if '--check' in sys.argv:
        have = json.loads(LINE.search(src).group(0).split('=', 1)[1].rstrip(';'))
        new = json.loads(text)
        d = max(abs(a - c) for La, Lc in zip(have['W'] + [have['b']], new['W'] + [new['b']]) for ra, rc in zip(La, Lc) for a, c in zip(ra, rc))
        if d > 1e-6:
            raise SystemExit(f'Τα βάρη στο tutorials.js διαφέρουν από την εκπαίδευση (max {d:.2e}): python tools/nn_weights.py')
        print('Τα βάρη συμφωνούν (max διαφορά %.1e).' % d)
        return
    TUT.write_text(LINE.sub(' const NN_DC_INV=' + text + ';', src), encoding='utf-8')
    print('Γράφτηκε το NN_DC_INV στο web/studio/tutorials.js.')


if __name__ == '__main__':
    main()
