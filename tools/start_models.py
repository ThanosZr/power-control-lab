"""4.19.2 (ROADMAP §68 point 5): the small start models that come with the application, for the networks of the tutorial of
the optimal power flow. Each is trained here on our own solutions (pcl.nnstart.train) and written as an ONNX file in
pcl/data/start/. Only small networks: every other model is trained on the machine of the user (python -m pcl nnstart …).

    python tools/start_models.py            trains and writes the files (about two minutes)
    python tools/start_models.py --check    every file loads, is for the present data of its network (fingerprint) and still
                                            earns iterations on scenarios it has not seen

The training is NumPy: the last bits of the weights depend on the machine, so --check judges the models, not their bytes."""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pcl import network as N  # noqa: E402
from pcl import nnstart as NS  # noqa: E402

CASES = [('ieee9', 300), ('ieee14', 300), ('case30', 300)]          # (data case, load scenarios asked for)
FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pcl', 'data', 'start')


def gain(net, model, k=8, seed=123):
    """Mean iterations of k new load scenarios from the normal start and from the proposal, and how many were accepted."""
    case = net.case()
    ib = NS.layout(net, case, 'opf')[0]
    rng = np.random.default_rng(seed)
    S, sp = case.load[ib, 2], model.meta['spread']
    cold, warm, used = [], [], 0
    for _ in range(4 * k):
        d = np.zeros(case.n, complex)
        d[ib] = -((rng.uniform(1 - sp, 1 + sp, len(ib)) - 1) * S.real + 1j * (rng.uniform(1 - sp, 1 + sp, len(ib)) - 1) * S.imag)
        r0 = net.opf('ac', dS=d * net.S_base, max_iter=NS.MAX_IT)
        if not r0['converged']:
            continue
        r1 = net.opf('ac', dS=d * net.S_base, start=model)
        if abs(r1['cost'] - r0['cost']) > 1e-5 * abs(r0['cost']):
            raise SystemExit(f"{model.meta['network']}: another optimum from the proposal ({r1['cost']} against {r0['cost']})")
        cold.append(r0['iterations'])
        warm.append(r1['iterations'])
        used += r1['start'] == 'warm'
        if len(cold) == k:
            break
    return float(np.mean(cold)), float(np.mean(warm)), used, len(cold)


def main(argv):
    check = '--check' in argv
    bad = 0
    os.makedirs(FOLDER, exist_ok=True)
    for name, samples in CASES:
        path = os.path.join(FOLDER, f'{name}_opf.onnx')
        net = N.case_data(name)
        if check:
            m = NS.Model.load(path)
            why = m.applies(net, net.case(), 'opf')
            c, w, used, k = gain(net, m)
            ok = why is None and used == k and w < c - 1
            bad += not ok
            print(f"{name}: {'εντάξει' if ok else 'ΟΧΙ'} · {why or 'αποτύπωμα ίδιο'} · {c:.1f} → {w:.1f} επαναλήψεις σε {k} νέα σενάρια ({used} δεκτές)")
        else:
            m = NS.train(net, 'opf', samples=samples, name=name)
            m.meta.pop('time', None)
            m.save(path)
            print('\n'.join(NS.summary(m)) + f'\n  {path} ({os.path.getsize(path) / 1024:.0f} KB)')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
