"""Command line of the pcl package (3.13, ROADMAP §30).

  python -m pcl tutorials
  python -m pcl tutorial buck --opt load=R --out buck.json
  python -m pcl channels buck.json
  python -m pcl run buck.json --set L1.L=47u --t-end 5m --channels V:C1,I:L1 --out out.csv
  python -m pcl run buck.json --t-end 5m --step var --rtol 1e-5 --out out.mat
  python -m pcl run buck.json --t-end 5m --solver scipy --method Radau --out out.json
  python -m pcl sweep buck.json --grid L1.L=22u,47u,100u --grid R1.R=5:20:4 --measure Vo=V:C1:avg:10 --measure I:L1:pp:10 --t-end 5m --out sweep.csv
  python -m pcl sweep tutorial:buck --grid L1.L=22u:220u:10 --measure I:L1:pp:10 --t-end 5m --out sweep.parquet
  python -m pcl plot out.csv --preset ieee --mapping label_mapping.csv --table maxima.tex --out fig.pdf
  python -m pcl bifurcation tutorial:pcm_chaos IC.v --values 1.4:3:33 --channel Y:AM1 --stat end --transient 300 --record 64 --out bif.mat
  python -m pcl job request.json --out result.json      (MATLAB/Octave, 3.14: the request as JSON, see pcl/core.py job)
"""
import argparse
import json
from pathlib import Path
import sys

from .core import PclError, _clean, job, load, parse_value, tutorial, tutorials


def _dumps(o):
    """JSON with null for NaN/Inf (MATLAB's jsondecode and the browser read it)."""
    return json.dumps(_clean(o), ensure_ascii=False)


def _project(src):
    if src.startswith('tutorial:'):                     # tutorial:buck or tutorial:buck?load=R&start=steady
        tid, _, q = src[9:].partition('?')
        opts = dict(x.split('=', 1) for x in q.split('&') if '=' in x)
        return tutorial(tid, **opts)
    return load(src)


def _kv(items):
    out = {}
    for it in items or []:
        if '=' not in it:
            raise PclError(f'«{it}»: γράψε <id>.<παράμετρος>=<τιμή>')
        k, v = it.split('=', 1)
        out[k.strip()] = v.strip()
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(prog='python -m pcl', description='Power Converter Lab: σενάρια από κώδικα (αλλαγή παραμέτρων, προσομοίωση, εξαγωγή).',
                                 formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('tutorials', help='τα tutorials και οι επιλογές τους')
    a = sub.add_parser('tutorial', help='το project ενός tutorial σε αρχείο JSON')
    a.add_argument('id')
    a.add_argument('--opt', action='append', help='επιλογή του tutorial, π.χ. load=R')
    a.add_argument('--out', required=True)
    a = sub.add_parser('job', help='ένα αίτημα σε JSON (run, sweep ή bifurcation), όπως το στέλνουν το MATLAB και το Octave')
    a.add_argument('spec', help='αρχείο JSON: {project | tutorial, set, run | sweep}')
    a.add_argument('--out', help='αποτέλεσμα σε JSON (αλλιώς στην έξοδο)')
    a = sub.add_parser('channels', help='τα κανάλια ενός project')
    a.add_argument('project', help='αρχείο JSON ή tutorial:<id>')
    for name, hlp in (('run', 'μία προσομοίωση'), ('sweep', 'σάρωση παραμέτρων με μετρήσεις')):
        a = sub.add_parser(name, help=hlp)
        a.add_argument('project', help='αρχείο JSON (αποθήκευση από την εφαρμογή) ή tutorial:<id>[?επιλογή=τιμή&…]')
        a.add_argument('--set', action='append', help='<id>.<παράμετρος>=<τιμή>, π.χ. L1.L=47u (και solve.step=var)')
        a.add_argument('--t-end', required=name == 'sweep', help='διάρκεια σε s, π.χ. 5m (προεπιλογή: η διάρκεια του tutorial)')
        a.add_argument('--solver', default='browser', choices=('browser', 'scipy'))
        a.add_argument('--hdiv', type=int, help='βήμα T/N του λύτη του browser')
        a.add_argument('--method', help='TR, BDF2, BE (browser)· Radau, BDF, LSODA, RK45 (scipy)')
        a.add_argument('--step', choices=('fixed', 'var'), help='σταθερό ή μεταβλητό βήμα (browser)')
        a.add_argument('--rtol', help='ανοχή του μεταβλητού βήματος (browser) ή του solve_ivp (scipy)')
        a.add_argument('--hmax', help='μέγιστο βήμα: T/N με N (browser) ή σε s (scipy)')
        a.add_argument('--channels', help='κανάλια με κόμμα, π.χ. V:C1,I:L1')
        a.add_argument('--from', dest='t_from', default='0', help='γράφει από αυτή τη στιγμή και μετά')
        a.add_argument('--measure', action='append', help='[όνομα=]<κανάλι>:<avg|rms|min|max|pp|end|thd>[:περίοδοι] ή <κανάλι>:at:<t>')
        a.add_argument('--sep', default=',', help='διαχωριστικό CSV (; για ελληνικό Excel)')
        a.add_argument('--decimal', default='.', help='δεκαδικό CSV (, για ελληνικό Excel)')
        a.add_argument('--out', help='.csv, .json, .mat, .parquet ή .h5')
        if name == 'sweep':
            a.add_argument('--grid', action='append', required=True, help='<id>.<παράμετρος>=τιμή1,τιμή2,… ή από:έως:πλήθος')
            a.add_argument('--zip', action='store_true', help='οι λίστες πάνε μαζί (σημείο i με σημείο i), όχι όλοι οι συνδυασμοί')
            a.add_argument('--workers', type=int, help='παράλληλες προσομοιώσεις')
    a = sub.add_parser('bifurcation', help='διάγραμμα διακλάδωσης: ένα δείγμα ανά περίοδο για κάθε τιμή της παραμέτρου (3.15)')
    a.add_argument('project', help='αρχείο JSON ή tutorial:<id>[?επιλογή=τιμή&…]')
    a.add_argument('param', help='<id>.<παράμετρος>, π.χ. IC.v')
    a.add_argument('--values', required=True, help='τιμή1,τιμή2,… ή από:έως:πλήθος')
    a.add_argument('--channel', required=True, help='κανάλι, π.χ. Y:AM1 ή I:L1')
    a.add_argument('--stat', default='min', choices=('min', 'max', 'avg', 'end'))
    a.add_argument('--transient', type=int, default=200, help='περίοδοι μεταβατικού')
    a.add_argument('--record', type=int, default=50, help='περίοδοι με δείγμα')
    a.add_argument('--set', action='append', help='<id>.<παράμετρος>=<τιμή>')
    a.add_argument('--workers', type=int, help='παράλληλες διεργασίες Node')
    a.add_argument('--out', help='.csv, .json, .mat, .parquet ή .h5')
    a = sub.add_parser('plot', help='γραφική για δημοσίευση από CSV (3.15): spec σε JSON, ή αρχεία με --preset/--mapping')
    a.add_argument('spec', nargs='+', help='spec.json, ή ένα ή περισσότερα CSV')
    a.add_argument('--preset', help='ieee, thesis, slides, lab ή αρχείο JSON')
    a.add_argument('--mapping', help='label_mapping.csv')
    a.add_argument('--kind', choices=('2d', 'waterfall'))
    a.add_argument('--signal', help='το σήμα του waterfall')
    a.add_argument('--table', help='πίνακας ακροτάτων (.csv ή .tex)')
    a.add_argument('--out', help='.pdf, .svg, .eps ή .png')
    args = ap.parse_args(argv)
    if args.cmd == 'plot':
        from . import plotting
        try:
            spec = json.loads(Path(args.spec[0]).read_text(encoding='utf-8')) if args.spec[0].endswith('.json') else {'files': args.spec}
            for k in ('preset', 'mapping', 'kind', 'signal', 'table', 'out'):
                if getattr(args, k):
                    spec[k] = getattr(args, k)
            spec.setdefault('out', 'figure.pdf')
            r = plotting.figure(spec)
        except (ValueError, RuntimeError, OSError) as e:
            print(f'pcl: {e}', file=sys.stderr)
            return 2
        print(f"{r['out']}: {r['size_cm'][0]:.1f} × {r['size_cm'][1]:.1f} cm, πρότυπο {r['preset']}, ομάδες: {', '.join(r['groups'])}")
        return 0
    try:
        if args.cmd == 'tutorials':
            for t in tutorials():
                print(f"{t['id']:<14} {t['title']}")
                for o in t['options']:
                    ch = f" [{', '.join(map(str, o['choices']))}]" if o.get('choices') else ''
                    print(f"{'':<16}{o['k']}={o['def']}{ch}")
            return 0
        if args.cmd == 'tutorial':
            p = tutorial(args.id, **_kv(args.opt))
            p.save(args.out)
            print(f'{args.out}: {len(p.data["components"])} στοιχεία')
            return 0
        if args.cmd == 'job':
            with open(args.spec, encoding='utf-8') as f:
                spec = json.load(f)
            out = _dumps(job(spec))
            if args.out:
                with open(args.out, 'w', encoding='utf-8') as f:
                    f.write(out)
                print(args.out)
            else:
                print(out)
            return 0
        if args.cmd == 'channels':
            r = _project(args.project).channels()
            print(f"T = {r['T']:.6g} s")
            print('\n'.join(r['keys']))
            return 0
        p = _project(args.project)
        for k, v in _kv(args.set).items():
            p.set(k, v)
        if args.cmd == 'bifurcation':
            b = p.bifurcation(args.param, args.values, channel=args.channel, stat=args.stat, transient=args.transient, record=args.record,
                              workers=args.workers, progress=lambda i, n: print(f'\r{i}/{n}', end='', file=sys.stderr))
            print(file=sys.stderr)
            for v, q in b.changes():
                print(f'από {v:.6g}: ' + (f'{q}T' if q else 'χωρίς περίοδο (χάος ή αργό μεταβατικό)'))
            if args.out:
                b.save(args.out)
                print(args.out)
            return 0
        kw = dict(solver=args.solver, hdiv=args.hdiv, method=args.method if args.solver == 'browser' else None, step=args.step,
                  rtol=parse_value(args.rtol) if args.rtol else None, t_from=float(parse_value(args.t_from)),
                  channels=args.channels.split(',') if args.channels else None)
        if args.solver == 'scipy':
            kw['scipy_method'] = args.method or 'Radau'
            kw['hmax'] = parse_value(args.hmax) if args.hmax else None
        elif args.hmax:
            kw['hmax'] = float(args.hmax)
        meas = {(m.split('=', 1)[0] if '=' in m else m): (m.split('=', 1)[1] if '=' in m else m) for m in args.measure} if args.measure else None
        t_end = parse_value(args.t_end) if args.t_end else None
        if args.cmd == 'run':
            r = p.run(t_end=t_end, measure=meas, **kw)
            for k, v in r.measured.items():
                print(f'{k} = {v:.6g}')
            for d in r.diag:
                if d['sev'] in ('error', 'warn'):
                    print(f"[{d['sev']}] {d['msg']}" + (f" → {d['fix']}" if d.get('fix') else ''), file=sys.stderr)
            m = r.meta
            print(f"{len(r.t)} σημεία, {m.get('steps', m.get('points'))} βήματα, {m.get('wall_s')} s, λύτης {m['solver']}", file=sys.stderr)
            if args.out:
                r.save(args.out, **({'sep': args.sep, 'decimal': args.decimal} if args.out.lower().endswith('.csv') else {}))
                print(args.out)
            return 0
        grid = {}
        for g in args.grid:
            k, v = g.split('=', 1)
            grid[k.strip()] = v
        if not meas:
            raise PclError('Η σάρωση θέλει τουλάχιστον μία --measure.')
        sw = p.sweep(grid=grid, t_end=t_end, measure=meas, workers=args.workers, mode='zip' if args.zip else 'grid',
                     progress=lambda i, n: print(f'\r{i}/{n}', end='', file=sys.stderr), **kw)
        print(file=sys.stderr)
        cols = sw.params + sw.names
        print('\t'.join(cols))
        for r in sw.rows:
            print('\t'.join(f'{r[c]:.6g}' if isinstance(r.get(c), (int, float)) else str(r.get(c, '')) for c in cols) + (f"\t{r['error']}" if 'error' in r else ''))
        if args.out:
            sw.save(args.out, **({'sep': args.sep, 'decimal': args.decimal} if args.out.lower().endswith('.csv') else {}))
            print(args.out)
        return 0
    except PclError as e:
        print(f'pcl: {e}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
