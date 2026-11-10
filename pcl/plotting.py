"""Figures for publication from CSV files (3.15, ROADMAP §36): the app's results, EMTP/ATP, PLECS or any CSV with time
in the first column, a mapping file compatible with label_mapping.csv of the Lightning Impulse Manager, presets as JSON
files shared with MATLAB (pcl/presets/*.json, matlab/pcl_style.m), 2-D groups and a 3-D waterfall, a table of extremes.

    from pcl import plotting as pp
    pp.figure({'files': ['out.csv'], 'mapping': 'label_mapping.csv', 'preset': 'ieee', 'out': 'fig.pdf'})
    python -m pcl plot spec.json

A spec (JSON or dict):
    files      CSV files (one tab per file in the GUI; one line per file in a waterfall)
    mapping    a label_mapping.csv, or a list of rows {VariableName, PlotLabel, Unit, Multiplier, LegendName, GroupName,
               GroupPriority, Plot, Transform, Color, LineStyle, Axis}
    preset     ieee, thesis, slides, lab, or a path to a JSON preset; overrides in 'style'
    time       {label, unit, multiplier, range: [a, b]} (default: t in the unit that suits the range)
    kind       '2d' (one axes per group, stacked) or 'waterfall' (one signal from every file, 3-D)
    signal     the signal of a waterfall
    title, out (pdf, svg, eps or png: by the extension), table (CSV or .tex with the extremes)
matplotlib is needed for the figures (pip install matplotlib); reading, mapping and the table work without it.
"""
import csv
import io
import json
import math
import re
from pathlib import Path

PRESETS = Path(__file__).resolve().parent / 'presets'
CM = 1 / 2.54
TRANSFORMS = {'none': lambda v: v, '': lambda v: v, 'abs': abs, '-x': lambda v: -v, 'neg': lambda v: -v,
              'real': lambda v: v.real if isinstance(v, complex) else v, 'imag': lambda v: v.imag if isinstance(v, complex) else 0.0}
_SI = [(1e-9, 'n'), (1e-6, 'μ'), (1e-3, 'm'), (1, '')]
QTY = {'V': 'τάση', 'A': 'ρεύμα', 'W': 'ισχύς', 'rad/s': 'ταχύτητα', 'N·m': 'ροπή', 'Wb': 'ροή', 'J': 'ενέργεια'}


def preset(name_or_path='ieee', **override):
    p = Path(name_or_path)
    f = p if p.suffix == '.json' and p.is_file() else PRESETS / f'{name_or_path}.json'
    if not f.is_file():
        raise ValueError(f'Άγνωστο πρότυπο «{name_or_path}»: ' + ', '.join(x.stem for x in sorted(PRESETS.glob('*.json'))))
    d = json.loads(f.read_text(encoding='utf-8'))
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(d.get(k), dict):
            d[k] = {**d[k], **v}
        else:
            d[k] = v
    return d


def presets():
    return {f.stem: json.loads(f.read_text(encoding='utf-8')).get('title', f.stem) for f in sorted(PRESETS.glob('*.json'))}


# ---------------------------------------------------------------- reading
def _num(s, decimal='.'):
    s = s.strip()
    if not s:
        return float('nan')
    if decimal == ',':
        s = s.replace('.', '').replace(',', '.') if s.count(',') == 1 and s.count('.') >= 1 else s.replace(',', '.')
    try:
        return float(s)
    except ValueError:
        try:
            return complex(s.replace('i', 'j'))
        except ValueError:
            return float('nan')


def read_table(path_or_text):
    """{'columns': [names], 'units': {name: unit}, 'data': {name: [values]}, 'time': name, 'meta': {...}} from a CSV:
    the app's (units in [] in the header, '#' metadata), EMTP/ATP or PLECS exports (time first), ';' with a decimal comma."""
    text = str(path_or_text) if '\n' in str(path_or_text) else Path(path_or_text).read_text(encoding='utf-8-sig')
    meta, lines = {}, []
    for ln in text.splitlines():
        if ln.startswith('#'):
            m = re.match(r'#\s*([^:]+):\s*(.*)$', ln)
            if m:
                try:
                    meta[m.group(1).strip()] = json.loads(m.group(2))
                except ValueError:
                    meta[m.group(1).strip()] = m.group(2)
            continue
        if ln.strip():
            lines.append(ln)
    if not lines:
        raise ValueError('Άδειο αρχείο.')
    head = lines[0]
    sep = ';' if head.count(';') > head.count(',') else '\t' if head.count('\t') > head.count(',') else ','
    decimal = ',' if sep == ';' and any(re.search(r'\d,\d', x) for x in lines[1:4]) else '.'
    cols, units = [], {}
    for c in next(csv.reader([head], delimiter=sep)):
        c = c.strip().strip('"')
        m = re.match(r'^(.*?)\s*\[(.*)\]$', c)
        name, unit = (m.group(1), m.group(2)) if m else (c, '')
        cols.append(name)
        units[name] = unit
    data = {c: [] for c in cols}
    for row in csv.reader(lines[1:], delimiter=sep):
        for c, v in zip(cols, row):
            data[c].append(_num(v, decimal))
    tcol = next((c for c in cols if re.fullmatch(r'(?i)t(ime)?|χρόνος|t \(s\)', c.strip())), cols[0])
    if not units.get(tcol):
        units[tcol] = 's'
    return {'columns': cols, 'units': units, 'data': data, 'time': tcol, 'meta': meta}


MAP_COLS = ('Plot', 'VariableName', 'PlotLabel', 'Unit', 'Multiplier', 'Transform', 'LegendName', 'GroupName', 'GroupPriority',
            'Color', 'LineStyle', 'Axis', 'Latex')


def read_mapping(path_or_rows):
    """The rows of a label_mapping.csv (';', as the Lightning Impulse Manager writes it), with the extra columns
    of §36 when present (Plot, Transform, Color, LineStyle, Axis, Latex). Missing values get their defaults."""
    if isinstance(path_or_rows, (list, tuple)):
        rows = [dict(r) for r in path_or_rows]
    else:
        text = Path(path_or_rows).read_text(encoding='utf-8-sig')
        sep = ';' if text.splitlines()[0].count(';') >= text.splitlines()[0].count(',') else ','
        rows = list(csv.DictReader(text.splitlines(), delimiter=sep))
    out = []
    for r in rows:
        v = (r.get('VariableName') or '').strip()
        if not v:
            continue
        mult = _num(str(r.get('Multiplier') or '1'))
        pr = _num(str(r.get('GroupPriority') or 'nan'))
        plot = str(r.get('Plot', '1')).strip().lower()
        out.append({'VariableName': v, 'PlotLabel': (r.get('PlotLabel') or v).strip(), 'Unit': (r.get('Unit') or '').strip(),
                    'Multiplier': 1.0 if not isinstance(mult, float) or math.isnan(mult) else mult,
                    'Transform': (r.get('Transform') or 'none').strip().lower(), 'LegendName': (r.get('LegendName') or '').strip(),
                    'GroupName': (r.get('GroupName') or '').strip(), 'GroupPriority': pr if isinstance(pr, float) else float('nan'),
                    'Plot': plot not in ('0', 'false', 'no', 'όχι'), 'Color': (r.get('Color') or '').strip(), 'LineStyle': (r.get('LineStyle') or '').strip(),
                    'Axis': (r.get('Axis') or 'left').strip().lower(), 'Latex': (r.get('Latex') or '').strip()})
    return out


def write_mapping(path, rows):
    """A mapping file with all the columns (';'), that the Lightning Impulse Manager also reads (it skips the extra ones)."""
    with open(path, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, delimiter=';')
        w.writerow(MAP_COLS)
        for r in read_mapping(rows):
            w.writerow([('1' if r['Plot'] else '0') if c == 'Plot' else ('NaN' if c == 'GroupPriority' and math.isnan(r[c]) else r[c]) for c in MAP_COLS])
    return path


def default_mapping(table):
    """One row per column (not the time), unit from the header, group by unit (V, A, …) as the app's scope."""
    return [{'VariableName': c, 'PlotLabel': c, 'Unit': table['units'].get(c, ''), 'Multiplier': 1.0, 'Transform': 'none', 'LegendName': c,
             'GroupName': table['units'].get(c, '') or 'σήματα', 'GroupPriority': float('nan'), 'Plot': True, 'Color': '', 'LineStyle': '',
             'Axis': 'left', 'Latex': ''} for c in table['columns'] if c != table['time']]


def signals(table, mapping=None):
    """The mapped signals of a table: [{row of the mapping, 'y': values (multiplier and transform applied)}]."""
    rows = read_mapping(mapping) if mapping else default_mapping(table)
    out = []
    for r in rows:
        if not r['Plot'] or r['VariableName'] not in table['data']:
            continue
        f = TRANSFORMS.get(r['Transform'], TRANSFORMS['none'])
        y = [f(v) * r['Multiplier'] if not (isinstance(v, float) and math.isnan(v)) else v for v in table['data'][r['VariableName']]]
        out.append({**r, 'y': [v.real if isinstance(v, complex) else v for v in y]})
    return out


def groups(sigs):
    """Signals by GroupName, groups in GroupPriority order (then as they come)."""
    order, by = [], {}
    for s in sigs:
        g = s['GroupName'] or s['Unit'] or 'σήματα'
        if g not in by:
            by[g] = []
            order.append(g)
        by[g].append(s)

    def pri(g):
        p = [s['GroupPriority'] for s in by[g] if not math.isnan(s['GroupPriority'])]
        return (min(p) if p else math.inf, order.index(g))
    return [(g, by[g]) for g in sorted(order, key=pri)]


def time_axis(t, spec=None):
    """(multiplier, label) for the time: the given one, or s, ms, μs, ns by the range."""
    spec = spec or {}
    if 'multiplier' in spec:
        return float(spec['multiplier']), spec.get('label') or f't ({spec.get("unit", "s")})'
    span = (max(t) - min(t)) if t else 1
    for m, p in _SI:
        if span < 1000 * m:
            return 1 / m, spec.get('label') or f't ({p}s)'
    return 1.0, spec.get('label') or 't (s)'


def extremes(table, mapping=None, file=None):
    """Max, min, mean, RMS and the time of the peak |y| per signal (the tool's table of maxima, §36 item 6)."""
    t = table['data'][table['time']]
    out = []
    for s in signals(table, mapping):
        pts = [(ti, y) for ti, y in zip(t, s['y']) if isinstance(y, float) and not math.isnan(y)]
        if not pts:
            continue
        ys = [y for _, y in pts]
        area = sq = dur = 0.0
        for (t0, y0), (t1, y1) in zip(pts, pts[1:]):
            h = t1 - t0
            area += h * (y0 + y1) / 2
            sq += h * (y0 * y0 + y0 * y1 + y1 * y1) / 3
            dur += h
        ip = max(range(len(ys)), key=lambda i: abs(ys[i]))
        out.append({'file': file or '', 'signal': s['PlotLabel'], 'unit': s['Unit'], 'max': max(ys), 'min': min(ys),
                    'mean': area / dur if dur else ys[0], 'rms': math.sqrt(sq / dur) if dur else abs(ys[0]), 't_peak': pts[ip][0], 'peak': ys[ip]})
    return out


def table_text(rows, fmt='csv'):
    cols = ['file', 'signal', 'unit', 'max', 'min', 'mean', 'rms', 't_peak']
    if fmt == 'tex':
        h = ['\\begin{tabular}{llr' + 'r' * 5 + '}', '\\hline', ' & '.join(['Αρχείο', 'Σήμα', 'Μονάδα', 'max', 'min', 'μέση', 'RMS', '$t_{peak}$']) + ' \\\\', '\\hline']
        for r in rows:
            h.append(' & '.join([str(r['file']), str(r['signal']), str(r['unit'])] + [f'{r[c]:.4g}' for c in cols[3:]]) + ' \\\\')
        return '\n'.join(h + ['\\hline', '\\end{tabular}']) + '\n'
    b = io.StringIO()
    w = csv.writer(b)
    w.writerow(cols)
    for r in rows:
        w.writerow([r[c] for c in cols])
    return b.getvalue()


# ---------------------------------------------------------------- figures (matplotlib)
def _mpl(style):
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError as e:
        raise RuntimeError('Οι γραφικές θέλουν το matplotlib: pip install matplotlib') from e
    from matplotlib import font_manager
    have = {f.name for f in font_manager.fontManager.ttflist}
    fam = next((f for f in [style['font']] + style.get('font_fallback', []) if f in have or f in ('serif', 'sans-serif')), 'DejaVu Sans')
    s = style['size']
    plt.rcParams.update({'font.family': fam, 'font.size': s['base'], 'axes.titlesize': s['title'], 'axes.labelsize': s['label'],
                         'xtick.labelsize': s['tick'], 'ytick.labelsize': s['tick'], 'legend.fontsize': s['legend'],
                         'lines.linewidth': style['linewidth'], 'lines.markersize': style['markersize'], 'axes.grid': style['grid'],
                         'grid.alpha': style['grid_alpha'], 'svg.hashsalt': 'pcl', 'svg.fonttype': 'none', 'pdf.fonttype': 42,
                         'text.usetex': False, 'axes.prop_cycle': matplotlib.cycler(color=style['colors'])})
    return plt


def _style(spec):
    st = spec.get('preset', 'ieee')
    return preset(st, **(spec.get('style') or {})) if isinstance(st, str) else st


def figure(spec):
    """Draws the spec and writes spec['out'] (and spec['table']). Returns {'out', 'size_cm', 'groups', 'extremes', 'files'}."""
    spec = json.loads(Path(spec).read_text(encoding='utf-8')) if isinstance(spec, (str, Path)) else dict(spec)
    style = _style(spec)
    files = spec.get('files') or []
    if not files:
        raise ValueError('Το spec θέλει files: [...].')
    tables = [(Path(f).stem if not isinstance(f, dict) else f.get('name', 'δεδομένα'), read_table(f if not isinstance(f, dict) else f['text'])) for f in files]
    mapping = spec.get('mapping')
    plt = _mpl(style)
    W, H = style['width_cm'] * CM, style['height_cm'] * CM
    ext = []
    if spec.get('kind') == 'waterfall':
        fig = plt.figure(figsize=(W, H))
        ax = fig.add_subplot(111, projection='3d')
        name = spec.get('signal')
        for k, (fname, tb) in enumerate(tables):
            sg = signals(tb, mapping)
            s = next((x for x in sg if name in (x['VariableName'], x['PlotLabel'])), sg[0] if sg else None)
            if s is None:
                continue
            m, tl = time_axis(tb['data'][tb['time']], spec.get('time'))
            ax.plot([v * m for v in tb['data'][tb['time']]], [k] * len(s['y']), s['y'], color=style['colors'][k % len(style['colors'])], lw=style['linewidth'])
            ext += extremes(tb, mapping, fname)
        ax.set_yticks(range(len(tables)))
        ax.set_yticklabels([n for n, _ in tables])
        ax.set_xlabel(tl)
        ax.set_zlabel(f'{s["PlotLabel"]} ({s["Unit"]})' if s and s['Unit'] else (s['PlotLabel'] if s else ''))
        v = spec.get('view') or [25, -60]
        ax.view_init(elev=v[0], azim=v[1])
        gnames = [name or 'waterfall']
    else:
        allg = []
        for fname, tb in tables:
            for g, ss in groups(signals(tb, mapping)):
                allg.append((g, fname, tb, ss))
            ext += extremes(tb, mapping, fname)
        names = list(dict.fromkeys(g for g, *_ in allg))
        if not names:
            raise ValueError('Καμία στήλη των αρχείων δεν υπάρχει στο mapping (VariableName). Στήλες: ' + ', '.join(c for _, tb in tables for c in tb['columns'][:12]))
        fig, axes = plt.subplots(len(names), 1, figsize=(W, H), sharex=True, squeeze=False)
        r0 = (spec.get('time') or {}).get('range')
        for i, g in enumerate(names):
            ax = axes[i][0]
            k = 0
            right = None
            for gg, fname, tb, ss in allg:
                if gg != g:
                    continue
                m, tl = time_axis(tb['data'][tb['time']], spec.get('time'))
                tt = [v * m for v in tb['data'][tb['time']]]
                for s in ss:
                    lab = s['LegendName'] or s['PlotLabel']
                    if len(tables) > 1:
                        lab += f' ({fname})'
                    a = ax
                    if s['Axis'] == 'right':
                        right = right or ax.twinx()
                        a = right
                    a.plot(tt, s['y'], label=lab, color=s['Color'] or style['colors'][k % len(style['colors'])],
                           linestyle=s['LineStyle'] or style['linestyles'][(k // len(style['colors'])) % len(style['linestyles'])])
                    k += 1
                unit = ss[0]['Unit']
            ax.set_ylabel(f'{g} ({unit})' if unit and unit != g else f'{QTY[unit]} ({unit})' if unit in QTY else g)
            if style.get('box') is False:
                ax.spines['top'].set_visible(False)
                ax.spines['right'].set_visible(False)
            if k > 1 or len(tables) > 1:
                ax.legend(loc=style.get('legend', 'best'))
            if r0:
                ax.set_xlim(r0[0], r0[1])
        axes[-1][0].set_xlabel(tl)
        gnames = names
    if spec.get('title'):
        fig.suptitle(spec['title'])
    fig.tight_layout()
    out = spec.get('out')
    if out:
        fmt = Path(out).suffix.lstrip('.').lower() or 'pdf'
        fig.savefig(out, format=fmt, dpi=style['dpi'], metadata={'Date': None} if fmt == 'svg' else ({'CreationDate': None} if fmt == 'pdf' else None))
    if spec.get('table'):
        Path(spec['table']).write_text(table_text(ext, 'tex' if str(spec['table']).endswith('.tex') else 'csv'), encoding='utf-8')
    size = [x / CM for x in fig.get_size_inches()]
    plt.close(fig)
    return {'out': out, 'size_cm': size, 'groups': gnames, 'extremes': ext, 'files': [n for n, _ in tables], 'preset': style['name']}
