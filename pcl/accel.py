"""What accelerator this machine has, and what it gives (4.19.2, ROADMAP §68 point 5):

    python -m pcl accel [--quick] [--save] [--case FILE.m …] [--scenarios 1000,10000] [--json FILE]

Prints the system, CuPy and the card (or the reason there is none), ONNX Runtime and its providers; then times the batch of
load flows (pcl.powerflow.batch) on the CPU and, when there is a card, on the GPU* with the three solves of pcl.backend,
and checks every GPU solution against that of the CPU (largest voltage difference, largest mismatch computed on the CPU).
--save writes the measurement where pcl.backend.choose('auto') reads it: only then «auto» may choose the GPU*.

* The GPU path is experimental: there is no GPU in the CI of the project. This script is its only check, and its output
is a block of text to paste back. Windows and Linux; nothing here is specific to one of them.
"""
import argparse
import json
import platform
import subprocess
import sys
import time

import numpy as np

from . import backend as BK
from . import network as NW
from . import powerflow as PF

DV_OK, RES_OK = 1e-6, 1e-7        # a GPU solution counts only if it is this close to the CPU one and this well converged


def best(f, k=2):
    t, r = 1e30, None
    for _ in range(k):
        t0 = time.perf_counter()
        r = f()
        t = min(t, time.perf_counter() - t0)
    return t, r


def system():
    """The machine as text lines and as data."""
    import scipy
    d = {'os': f'{platform.system()} {platform.release()}', 'machine': platform.machine(), 'python': platform.python_version(),
         'numpy': np.__version__, 'scipy': scipy.__version__, 'cpus': __import__('os').cpu_count(), 'smi': None, 'ort': None}
    try:                                                                        # the name and the driver as the vendor's tool gives them
        r = subprocess.run(['nvidia-smi', '--query-gpu=name,driver_version,memory.total', '--format=csv,noheader'],
                           capture_output=True, text=True, timeout=20)
        d['smi'] = r.stdout.strip().splitlines()[0] if r.returncode == 0 and r.stdout.strip() else None
    except Exception:
        pass
    try:
        import onnxruntime as ort
        d['ort'] = {'version': ort.__version__, 'providers': list(ort.get_available_providers())}
    except Exception:
        pass
    d['gpu'] = BK.probe(fresh=True)
    return d


def residual(case, V, dS):
    """The largest mismatch (pu) of the solutions V (B × n) of the scenarios dS, computed on the CPU."""
    pv, pq, _ = case.sets(None)
    Vt = V.T
    mis = Vt * np.conj(case.Y @ Vt) - (case.Sg[:, None] + dS.T - (case.load[:, 0:1] * np.abs(Vt) ** 2 + case.load[:, 1:2] * np.abs(Vt)
                                                                    + case.load[:, 2:3]))
    return float(max(np.abs(mis.real[np.r_[pv, pq]]).max(initial=0.0), np.abs(mis.imag[pq]).max(initial=0.0)))


def measure(name, net, B, seed=1, gpu=True, say=lambda s: None):
    """One row: the batch of B load scenarios (±20 % per bus) of a network on the CPU and on the GPU* in three ways."""
    case = net.case()
    V0 = PF.newton(case, case.start(True), tol=1e-11)[0]
    N = case.jac(case.typ).N
    rng = np.random.default_rng(seed)
    dS = -(rng.uniform(0.8, 1.2, (B, case.n)) - 1) * case.load[:, 2][None, :]
    tc, rc = best(lambda: PF.batch(case, dS, V0=V0, backend='cpu', fallback=False))
    okc = rc['converged']
    row = {'net': name, 'n': int(case.n), 'N': int(N), 'B': int(B), 'cpu': tc, 'solved': int(okc.sum()), 'gpu': None, 'how': None,
           'all': {}, 'dV': None, 'res': None, 'ok': False, 'note': None}
    say(f'  {name}: {case.n} ζυγοί, {N} άγνωστοι, {B} σενάρια · CPU {tc * 1e3:.1f} ms ({tc / B * 1e6:.1f} μs ανά σενάριο), '
        f'λύθηκαν {int(okc.sum())}')
    if not gpu:
        return row
    for how in BK.HOW:
        try:
            PF.batch(case, dS[:min(B, 64)], V0=V0, backend='gpu', how=how, fallback=False)           # the first call compiles kernels
            tg, rg = best(lambda: PF.batch(case, dS, V0=V0, backend='gpu', how=how, fallback=False))
        except Exception as e:                                                                      # noqa: BLE001
            row['all'][how] = {'error': f'{type(e).__name__}: {str(e)[:120]}'}
            say(f'    GPU* {how}: {row["all"][how]["error"]}')
            continue
        if rg['backend'] != 'gpu':
            row['all'][how] = {'error': rg['why']}
            say(f'    GPU* {how}: {rg["why"]}')
            continue
        both = okc & rg['converged']
        dV = float(np.abs(rg['V'][both] - rc['V'][both]).max(initial=0.0))
        res = residual(case, rg['V'][rg['converged']], dS[rg['converged']]) if rg['converged'].any() else float('nan')
        good = bool(dV < DV_OK and res < RES_OK and (rg['converged'] == okc).all())
        row['all'][how] = {'t': tg, 'dV': dV, 'res': res, 'solved': int(rg['converged'].sum()), 'ok': good}
        say(f'    GPU* {how:6s} {tg * 1e3:8.1f} ms (×{tc / tg:.2f}) · μέγιστη διαφορά τάσης {dV:.1e} pu · μέγιστο υπόλοιπο {res:.1e} pu · '
            f'{"εντάξει" if good else "ΔΙΑΦΕΡΕΙ"}')
        if good and (row['gpu'] is None or tg < row['gpu']):
            row.update(gpu=tg, how=how, dV=dV, res=res, ok=True)
    return row


def mixed(N=2000, B=512):
    """Only a measurement (the solvers stay in double precision): the product of a dense N × N matrix with B right-hand sides
    on the device in float64 and in float32."""
    try:
        bk = BK.gpu()
        xp = bk.xp
        rng = np.random.default_rng(0)
        A, R = xp.asarray(rng.standard_normal((N, N))), xp.asarray(rng.standard_normal((N, B)))
        out = {}
        for nm, dt in (('float64', xp.float64), ('float32', xp.float32)):
            a, r = A.astype(dt), R.astype(dt)
            float(xp.asnumpy((a @ r).sum()))
            out[nm] = best(lambda: float(xp.asnumpy((a @ r).sum())), 5)[0]
        return out
    except Exception as e:                                                                          # noqa: BLE001
        return {'error': f'{type(e).__name__}: {str(e)[:120]}'}


def run(cases=(), scenarios=(1000, 10000), quick=False, save=False, out=print):
    """The whole measurement. Returns the data that --json writes."""
    s = system()
    g = s['gpu']
    out('===== pcl accel (Power & Control Lab ' + __import__('engine').__version__ + ') =====')
    out(f"σύστημα: {s['os']} ({s['machine']}), {s['cpus']} πυρήνες · Python {s['python']}, NumPy {s['numpy']}, SciPy {s['scipy']}")
    out(f"nvidia-smi: {s['smi'] or 'δεν βρέθηκε'}")
    if g['reason']:
        out(f"GPU*: όχι · {g['reason']}" + (f" (CuPy {g['cupy']})" if g['cupy'] else ''))
    else:
        out(f"GPU*: {g['device']} · μνήμη {g['memory'] / 2 ** 30:.1f} GiB (ελεύθερη {g['free'] / 2 ** 30:.1f}) · compute capability "
            f"{g['capability']} · CUDA runtime {g['cuda']} · CuPy {g['cupy']}")
    out('ONNX Runtime: ' + (f"{s['ort']['version']}, πάροχοι {', '.join(s['ort']['providers'])}" if s['ort'] else 'δεν είναι εγκατεστημένο'))
    nets = [('ieee118', NW.case_data('ieee118'))] + ([] if quick else [('ieee300', NW.case_data('ieee300'))])
    for p in cases:
        nets.append((str(p).replace('\\', '/').split('/')[-1].rsplit('.', 1)[0], NW.read_matpower(p)))
    rows = []
    out('παρτίδα ροών φορτίου (φορτία ±20 % ανά ζυγό, ανοχή 1e-8 pu, διπλή ακρίβεια):')
    for name, net in nets:
        for B in ((scenarios[0],) if quick else scenarios):
            rows.append(measure(name, net, int(B), gpu=not g['reason'], say=out))
    mx = None
    if not g['reason']:
        mx = mixed()
        out('μικτή ακρίβεια, μόνο ως μέτρηση (γινόμενο πυκνού 2000 × 2000 με 512 δεξιά μέλη): ' +
            (mx['error'] if 'error' in mx else f"float64 {mx['float64'] * 1e3:.2f} ms, float32 {mx['float32'] * 1e3:.2f} ms "
                                               f"(×{mx['float64'] / mx['float32']:.1f})"))
    okr = [r for r in rows if r['ok']]
    work = BK.rule(okr) if okr else None
    data = {'format': 'pcl-accel', 'version': 1, 'date': time.strftime('%Y-%m-%d %H:%M'), 'device': g['device'], 'system': s, 'rows': rows,
            'work': work, 'mixed': mx}
    if g['reason']:
        out('συμπέρασμα: δεν υπάρχει GPU*· όλα τρέχουν στη CPU.')
    elif work:
        out(f'συμπέρασμα: η GPU* κερδίζει (τουλάχιστον ×{BK.GAIN}) από {work:.3g} αγνώστους × σενάρια και πάνω.')
    else:
        out('συμπέρασμα: η GPU* δεν ήταν ταχύτερη (ή δεν έδωσε τις ίδιες λύσεις) σε ό,τι μετρήθηκε· το «Αυτόματα» μένει στη CPU.')
    if save:
        if g['reason'] or not okr:
            out('--save: δεν γράφτηκε μέτρηση (δεν υπάρχει έγκυρη μέτρηση GPU*).')
        else:
            p = BK.home() / BK.FILE
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
            out(f'--save: η μέτρηση γράφτηκε στο {p} (το «Αυτόματα» τη διαβάζει από εκεί).')
    out(BK.EXPERIMENTAL)
    out('===== τέλος =====')
    return data


def main(argv=None):
    ap = argparse.ArgumentParser(prog='python -m pcl accel', description='Τι επιταχυντή έχει αυτό το μηχάνημα και τι δίνει (GPU*: πειραματικό).')
    add_arguments(ap)
    return command(ap.parse_args(argv))


def add_arguments(ap):
    ap.add_argument('--quick', action='store_true', help='μόνο το IEEE 118 με τον πρώτο αριθμό σεναρίων')
    ap.add_argument('--save', action='store_true', help='γράφει τη μέτρηση για το «Αυτόματα» (μόνο αν η GPU* έδωσε τις ίδιες λύσεις)')
    ap.add_argument('--case', action='append', default=[], help='αρχείο δικτύου σε μορφή MATPOWER (.m), π.χ. τα μεγάλα του branch ref-materials')
    ap.add_argument('--scenarios', default='1000,10000', help='αριθμοί σεναρίων, με κόμμα')
    ap.add_argument('--json', help='γράφει και τα δεδομένα της μέτρησης σε αρχείο JSON')


def command(args):
    try:
        sc = tuple(int(v) for v in str(args.scenarios).split(',') if v.strip())
    except ValueError:
        print('--scenarios: ακέραιοι με κόμμα, π.χ. 1000,10000', file=sys.stderr)
        return 2
    data = run(args.case, sc or (1000,), args.quick, args.save)
    if args.json:
        with open(args.json, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
    return 0


if __name__ == '__main__':
    sys.exit(main())
