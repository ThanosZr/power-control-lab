"""Reports (4.19.1, ROADMAP §68 point 6): a report object of the engine, made of sections (heading, text, note, facts,
table, chart, data), that every study can fill and that the user composes from code; it is written out as one HTML file
(inline SVG charts, the tables, and the data of the report inside the file), as Markdown, or as JSON.

    from pcl.report import Report
    r = Report('Ροή φορτίου', 'IEEE 14 ζυγών')
    r.heading('Τάσεις').chart('dot', x=names, series=[{'name': '|V|', 'y': v}], ylabel='pu', limits=[{'value': 1.06, 'label': 'V max'}])
    r.table(['Ζυγός', '|V| (pu)'], rows, digits=[None, 4])
    r.save('report.html')            # or .md, .json; Report.load('report.json') reads it back

No new dependency: the charts are drawn here as SVG. Their look follows a few fixed rules: the form from the job of the
data (bars from zero for magnitudes, points or a line for a profile), thin marks with a gap between them, one axis,
grid and axes in the background, a legend whenever there are two or more series, limits as dashed lines with their name
in words (never by colour alone), a tooltip on every mark, and the numbers of every chart as a table under it. The colours
are a categorical palette checked for colour-blind separation on a light and on a dark surface (the file follows the
theme of the reader's system; print is light).

Network studies: network_report(net, study) fills a report for a load flow, an N−1 analysis or an optimal power flow
(Network.report calls it), so the button «Εξαγωγή αναφοράς» of the app and a script give the same file.
"""
import html as _html
import json
import math
from pathlib import Path

VERSION = 1
KINDS = ('heading', 'text', 'note', 'facts', 'table', 'chart', 'network', 'data')
SERIES = 4                                    # series per chart (more: split the chart)
BAR = 44                                      # the widest bar (px of the 760 px drawing)
LIGHT = {'surface': '#fcfcfb', 'page': '#f9f9f7', 'ink': '#0b0b0b', 'ink2': '#52514e', 'muted': '#898781', 'grid': '#e1e0d9', 'axis': '#c3c2b7',
         's1': '#2a78d6', 's2': '#eb6834', 's3': '#1baf7a', 's4': '#eda100', 'good': '#0ca30c', 'warning': '#fab219', 'critical': '#d03b3b'}
DARK = {'surface': '#1a1a19', 'page': '#0d0d0d', 'ink': '#f0efec', 'ink2': '#c3c2b7', 'muted': '#898781', 'grid': '#2c2c2a', 'axis': '#383835',
        's1': '#3987e5', 's2': '#d95926', 's3': '#199e70', 's4': '#c98500', 'good': '#0ca30c', 'warning': '#fab219', 'critical': '#d03b3b'}


class ReportError(ValueError):
    pass


def num(v, digits=4, lang='el', strip=False):
    """A number as text: significant digits, thousands apart, decimal comma in Greek. strip: without trailing zeros (for a
    value that stands alone; in a table column the digits stay, so that the decimals line up)."""
    if v is None or (isinstance(v, float) and not math.isfinite(v)):
        return '—'
    if isinstance(v, bool):
        return ('ναι' if v else 'όχι') if lang == 'el' else ('yes' if v else 'no')
    if isinstance(v, int):
        s = f'{v:,}'
    elif isinstance(v, float):
        if v == 0:
            s = '0'
        else:
            e = math.floor(math.log10(abs(v)))
            s = f'{v:.{max(0, digits - 1)}e}' if (e < -4 or e >= 9) else f'{v:,.{max(0, digits - 1 - e)}f}'
            if strip and '.' in s and 'e' not in s:
                s = s.rstrip('0').rstrip('.')
    else:
        return str(v)
    if lang == 'el':
        s = s.replace(',', '\u2009').replace('.', ',')
    else:
        s = s.replace(',', '\u2009')
    return s.replace('e-0', 'e-').replace('e+0', 'e').replace('e+', 'e').replace('-', '−')


def _ticks(lo, hi, n=5):
    if not (math.isfinite(lo) and math.isfinite(hi)):
        return [0.0, 1.0]
    if hi <= lo:
        hi = lo + (abs(lo) or 1.0)
    raw = (hi - lo) / max(1, n)
    mag = 10 ** math.floor(math.log10(raw))
    step = next(m * mag for m in (1, 2, 2.5, 5, 10) if m * mag >= raw)
    t0 = math.floor(lo / step + 1e-9) * step
    out = []
    v = t0
    while v <= hi + step * (1 + 1e-9):
        out.append(round(v, 12))
        if v >= hi - 1e-12 * max(1.0, abs(hi)):
            break
        v += step
    return out


class Report:
    """A report as a list of sections. Every method that adds a section returns the report, so calls can be chained."""

    def __init__(self, title, subtitle='', lang='el', meta=None):
        self.title, self.subtitle, self.lang = str(title), str(subtitle or ''), lang
        self.meta = dict(meta or {})
        self.sections = []

    # ---------------------------------------------------------------- sections
    def _add(self, kind, **kw):
        self.sections.append({'kind': kind, **kw})
        return self

    def heading(self, text, level=2):
        return self._add('heading', text=str(text), level=int(min(4, max(2, level))))

    def text(self, body):
        """A paragraph (plain text; an empty line starts a new paragraph)."""
        return self._add('text', text=str(body))

    def note(self, body, status='info'):
        """A remark set apart: status 'info', 'good', 'warning' or 'critical' (shown with its word, not only its colour)."""
        if status not in ('info', 'good', 'warning', 'critical'):
            raise ReportError("note: status 'info', 'good', 'warning' or 'critical'")
        return self._add('note', text=str(body), status=status)

    def facts(self, pairs, title=''):
        """A short list of name: value (a dict or a list of pairs); numbers are formatted."""
        pairs = list(pairs.items()) if isinstance(pairs, dict) else [tuple(p) for p in pairs]
        return self._add('facts', title=str(title), pairs=[[str(k), v] for k, v in pairs])

    def table(self, columns, rows, title='', digits=4, mark=None, note=''):
        """columns: names (with the unit in the name); rows: lists of values; digits: significant digits, one number or one per
        column (None: as given); mark: {row index: 'warning' | 'critical' | 'good'} for rows that stand out (a word is added)."""
        cols = [str(c) for c in columns]
        rows = [list(r) for r in rows]
        if any(len(r) != len(cols) for r in rows):
            raise ReportError('table: every row needs one value per column')
        dg = list(digits) if isinstance(digits, (list, tuple)) else [digits] * len(cols)
        if len(dg) != len(cols):
            raise ReportError('table: digits, one number or one per column')
        return self._add('table', title=str(title), columns=cols, rows=rows, digits=dg, mark={str(k): v for k, v in (mark or {}).items()}, note=str(note))

    def chart(self, kind, x, series, title='', xlabel='', ylabel='', limits=None, ymin=None, ymax=None, table=True):
        """kind: 'bar' (magnitudes per category, from zero), 'dot' (a value per category, as points: a profile whose range does not
        start at zero) or 'line' (y against a numeric x). x: categories or numbers; series: [{'name', 'y'}] (up to 4);
        limits: [{'value', 'label', 'status': 'warning' | 'critical'}] horizontal lines; table: the numbers under the chart."""
        if kind not in ('bar', 'dot', 'line'):
            raise ReportError("chart: kind 'bar', 'dot' or 'line'")
        series = [{'name': str(s.get('name', '')), 'y': [None if v is None else float(v) for v in s['y']]} for s in series]
        if not series or len(series) > SERIES:
            raise ReportError(f'chart: one to {SERIES} series (more: another chart)')
        x = [float(v) for v in x] if kind == 'line' else [str(v) for v in x]
        if any(len(s['y']) != len(x) for s in series):
            raise ReportError('chart: every series needs one y per x')
        lim = [{'value': float(q['value']), 'label': str(q.get('label', '')), 'status': q.get('status', 'warning')} for q in (limits or [])]
        return self._add('chart', chart=kind, x=x, series=series, title=str(title), xlabel=str(xlabel), ylabel=str(ylabel), limits=lim,
                         ymin=ymin, ymax=ymax, table=bool(table))

    def network(self, view, layer, title=''):
        """The picture of a network (4.19.4): view = the places of the buses and the branches (pcl.netview.view), layer = what
        the picture shows (pcl.netview.values: colours, values, legend). The section keeps the data; the picture is drawn
        from them when the report is written."""
        if not isinstance(view, dict) or not isinstance(layer, dict) or 'buses' not in view or 'branches' not in view:
            raise ReportError('network: a view of pcl.netview.view and a layer of pcl.netview.values')
        json.dumps([view, layer])
        return self._add('network', view=view, layer=layer, title=str(title))

    def data(self, name, obj):
        """Data kept inside the file under a name (anything JSON can hold): for whoever reads the report with a program."""
        json.dumps(obj)
        return self._add('data', name=str(name), obj=obj)

    def extend(self, other):
        """The sections of another report after those of this one."""
        self.sections += [dict(s) for s in other.sections]
        return self

    # ---------------------------------------------------------------- as data
    def to_dict(self):
        return {'format': 'pcl-report', 'version': VERSION, 'title': self.title, 'subtitle': self.subtitle, 'lang': self.lang, 'meta': self.meta,
                'sections': self.sections}

    @classmethod
    def from_dict(cls, d):
        if not isinstance(d, dict) or d.get('format') != 'pcl-report':
            raise ReportError('not a report (format pcl-report)')
        r = cls(d.get('title', ''), d.get('subtitle', ''), d.get('lang', 'el'), d.get('meta'))
        for s in d.get('sections', []):
            k = s.get('kind')
            if k == 'heading':
                r.heading(s['text'], s.get('level', 2))
            elif k == 'text':
                r.text(s['text'])
            elif k == 'note':
                r.note(s['text'], s.get('status', 'info'))
            elif k == 'facts':
                r.facts(s['pairs'], s.get('title', ''))
            elif k == 'table':
                r.table(s['columns'], s['rows'], s.get('title', ''), s.get('digits', 4), {int(a): b for a, b in (s.get('mark') or {}).items()}, s.get('note', ''))
            elif k == 'chart':
                r.chart(s['chart'], s['x'], s['series'], s.get('title', ''), s.get('xlabel', ''), s.get('ylabel', ''), s.get('limits'), s.get('ymin'),
                        s.get('ymax'), s.get('table', True))
            elif k == 'network':
                r.network(s['view'], s['layer'], s.get('title', ''))
            elif k == 'data':
                r.data(s['name'], s['obj'])
            else:
                raise ReportError(f'unknown section {k!r}: one of {", ".join(KINDS)}')
        return r

    def save(self, path):
        """Writes the report: .html (one file), .md (Markdown: text and tables; a chart as its table) or .json (the object)."""
        p = Path(path)
        ext = p.suffix.lower()
        if ext in ('.html', '.htm'):
            p.write_text(self.html(), encoding='utf-8')
        elif ext == '.md':
            p.write_text(self.markdown(), encoding='utf-8')
        elif ext == '.json':
            p.write_text(json.dumps(self.to_dict(), ensure_ascii=False, indent=1), encoding='utf-8')
        else:
            raise ReportError('save: a file .html, .md or .json')
        return p

    @classmethod
    def load(cls, path):
        return cls.from_dict(json.loads(Path(path).read_text(encoding='utf-8')))

    # ---------------------------------------------------------------- Markdown
    def markdown(self):
        L = self.lang
        out = [f'# {self.title}', '']
        if self.subtitle:
            out += [self.subtitle, '']

        def tab(cols, rows, dg):
            t = ['| ' + ' | '.join(cols) + ' |', '|' + '|'.join('---' for _ in cols) + '|']
            for r in rows:
                t.append('| ' + ' | '.join(num(v, dg[j] or 6, L) if dg[j] is not None or isinstance(v, (float, bool)) else str(v) for j, v in enumerate(r)).replace('\n', ' ') + ' |')
            return t
        for s in self.sections:
            k = s['kind']
            if k == 'heading':
                out += ['#' * s['level'] + ' ' + s['text'], '']
            elif k == 'text':
                out += [s['text'], '']
            elif k == 'note':
                out += [f'> **{_STATUS[L][s["status"]]}:** {s["text"]}', '']
            elif k == 'facts':
                out += ([f'**{s["title"]}**', ''] if s['title'] else []) + [f'- {a}: {num(b, 6, L, True)}' for a, b in s['pairs']] + ['']
            elif k == 'table':
                out += ([f'**{s["title"]}**', ''] if s['title'] else []) + tab(s['columns'], s['rows'], s['digits']) + ([s['note']] if s['note'] else []) + ['']
            elif k == 'chart':
                cols = [s['xlabel'] or 'x'] + [(q['name'] or 'y') + (f' ({s["ylabel"]})' if s['ylabel'] else '') for q in s['series']]
                rows = [[x] + [q['y'][i] for q in s['series']] for i, x in enumerate(s['x'])]
                out += ([f'**{s["title"]}**', ''] if s['title'] else []) + tab(cols, rows, [None] + [5] * len(s['series']))
                out += [f'- {q["label"]}: {num(q["value"], 5, L)}' for q in s['limits']] + ['']
            elif k == 'network':
                # Markdown holds no picture: what the picture shows, in words (the HTML file has it)
                v, q = s['view'], s['layer']
                out += [f'**{s["title"] or q.get("title", "")}**', '', f'*Διάγραμμα του δικτύου ({len(v["buses"])} ζυγοί, {len(v["branches"])} κλάδοι): στο αρχείο HTML της αναφοράς.*', '']
                out += [f'- {text}' for _, text in (q.get('legend') or [])] + ['']
        return '\n'.join(out).rstrip() + '\n'

    # ---------------------------------------------------------------- HTML
    def html(self):
        L = self.lang
        e = _html.escape
        body = []
        ntab = 0
        for s in self.sections:
            k = s['kind']
            if k == 'heading':
                body.append(f'<h{s["level"]}>{e(s["text"])}</h{s["level"]}>')
            elif k == 'text':
                body += [f'<p>{e(p)}</p>' for p in s['text'].split('\n\n') if p.strip()]
            elif k == 'note':
                body.append(f'<p class="note {s["status"]}"><b>{e(_STATUS[L][s["status"]])}:</b> {e(s["text"])}</p>')
            elif k == 'facts':
                body.append((f'<h4>{e(s["title"])}</h4>' if s['title'] else '') + '<dl class="facts">' +
                            ''.join(f'<div><dt>{e(a)}</dt><dd>{e(num(b, 6, L, True))}</dd></div>' for a, b in s['pairs']) + '</dl>')
            elif k == 'table':
                ntab += 1
                body.append(self._table(s['columns'], s['rows'], s['digits'], s['title'], s['mark'], s['note'], ntab))
            elif k == 'network':
                from . import netview
                try:
                    pic = netview.svg(s['view'], L=s['layer'], width=980, title=s['title'] or None)
                except (KeyError, TypeError, ValueError) as err:
                    raise ReportError(f'network: the view does not draw ({err})') from err
                body.append(f'<figure class="network">{pic}</figure>')
            elif k == 'chart':
                body.append(self._chart(s))
                if s['table']:
                    ntab += 1
                    cols = [s['xlabel'] or 'x'] + [(q['name'] or 'y') + (f' ({s["ylabel"]})' if s['ylabel'] else '') for q in s['series']]
                    rows = [[x] + [q['y'][i] for q in s['series']] for i, x in enumerate(s['x'])]
                    body.append(f'<details class="chart-data"><summary>{e(_T[L]["numbers"])}</summary>' +
                                self._table(cols, rows, [None] + [5] * len(s['series']), '', {}, '', ntab) + '</details>')
        css = _CSS.replace('/*LIGHT*/', ''.join(f'--{k}:{v};' for k, v in LIGHT.items())).replace('/*DARK*/', ''.join(f'--{k}:{v};' for k, v in DARK.items()))
        # the data inside a script element: no «<» at all (a text with «</script>», or with «<!--» and «<script», would end or
        # swallow the element), written as the JSON escape \u003c, which reads back as the same character
        data = json.dumps(self.to_dict(), ensure_ascii=False).replace('<', '\\u003c')
        sub = f'<p class="sub">{e(self.subtitle)}</p>' if self.subtitle else ''
        meta = ' · '.join(f'{e(str(a))}: {e(num(b, 6, L, True))}' for a, b in self.meta.items())
        return (f'<!DOCTYPE html>\n<html lang="{e(L)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
                f'<title>{e(self.title)}</title><style>{css}</style></head><body><main><header><h1>{e(self.title)}</h1>{sub}'
                f'{f"<p class=meta>{meta}</p>" if meta else ""}<p class="tools"><button type="button" data-dl="json">{e(_T[L]["json"])}</button></p></header>\n'
                + '\n'.join(body) + f'\n<footer>{e(_T[L]["footer"])}</footer></main>\n<script type="application/json" id="pcl-report">{data}</script>\n'
                f'<script>{_JS}</script></body></html>\n')

    def _table(self, cols, rows, dg, title, mark, note, n):
        L, e = self.lang, _html.escape
        numeric = [all(isinstance(r[j], (int, float)) and not isinstance(r[j], bool) or r[j] is None for r in rows) and bool(rows) for j in range(len(cols))]
        h = ''.join(f'<th{" class=n" if numeric[j] else ""}>{e(c)}</th>' for j, c in enumerate(cols))
        b = []
        for i, r in enumerate(rows):
            st = mark.get(str(i))
            tds = ''.join(f'<td{" class=n" if numeric[j] else ""}>{e(num(v, dg[j] or 6, L) if (dg[j] is not None or isinstance(v, (float, bool)) or v is None) else str(v))}</td>'
                          for j, v in enumerate(r))
            b.append(f'<tr{f" class={st}" if st else ""}>{tds}' + (f'<td class="st">{e(_STATUS[L][st])}</td>' if st else ('<td class="st"></td>' if mark else '')) + '</tr>')
        return (f'<figure class="tab" data-table="{n}">' + (f'<figcaption>{e(title)}</figcaption>' if title else '') +
                f'<div class="scroll"><table><thead><tr>{h}{"<th></th>" if mark else ""}</tr></thead><tbody>{"".join(b)}</tbody></table></div>' +
                (f'<p class="tnote">{e(note)}</p>' if note else '') + f'<p class="tools"><button type="button" data-dl="csv" data-n="{n}">CSV</button></p></figure>')

    def _chart(self, s):
        L, e = self.lang, _html.escape
        W, H, ml, mr, mb = 760, 300, 58, 20, 46
        ns = len(s['series'])
        mt = 30 if ns > 1 else 12
        pw, ph = W - ml - mr, H - mt - mb
        ys = [v for q in s['series'] for v in q['y'] if v is not None and math.isfinite(v)] + [q['value'] for q in s['limits']]
        if not ys:
            ys = [0.0, 1.0]
        lo, hi = min(ys), max(ys)
        if s['chart'] == 'bar':
            lo, hi = min(lo, 0.0), max(hi, 0.0)
        else:
            pad = 0.06 * ((hi - lo) or abs(hi) or 1.0)
            lo, hi = lo - pad, hi + pad
        lo = s['ymin'] if s['ymin'] is not None else lo
        hi = s['ymax'] if s['ymax'] is not None else hi
        tk = _ticks(lo, hi)
        lo, hi = min(lo, tk[0]), max(hi, tk[-1])
        Y = lambda v: mt + ph * (1 - (v - lo) / (hi - lo))                                       # noqa: E731
        n = len(s['x'])
        o = [f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="{e(s["title"] or s["ylabel"])}">']
        for t in tk:
            o.append(f'<line class="grid" x1="{ml}" x2="{W - mr}" y1="{Y(t):.1f}" y2="{Y(t):.1f}"/><text class="tick" x="{ml - 8}" y="{Y(t) + 4:.1f}" text-anchor="end">{e(num(t, 4, L, True))}</text>')
        if s['ylabel']:
            o.append(f'<text class="axt" transform="translate(14 {mt + ph / 2:.0f}) rotate(-90)" text-anchor="middle">{e(s["ylabel"])}</text>')
        if s['xlabel']:
            o.append(f'<text class="axt" x="{ml + pw / 2:.0f}" y="{H - 6}" text-anchor="middle">{e(s["xlabel"])}</text>')
        if s['chart'] == 'line':
            xs = s['x']
            x0, x1 = (min(xs), max(xs)) if xs else (0.0, 1.0)
            xt = _ticks(x0, x1, 6)
            x0, x1 = min(x0, xt[0]), max(x1, xt[-1])
            X = lambda v: ml + pw * (v - x0) / ((x1 - x0) or 1.0)                                # noqa: E731
            for t in xt:
                o.append(f'<text class="tick" x="{X(t):.1f}" y="{mt + ph + 16}" text-anchor="middle">{e(num(t, 4, L, True))}</text>')
            xp = [X(v) for v in xs]
            lab = [num(v, 5, L) for v in xs]
        else:
            band = pw / max(1, n)
            xp = [ml + band * (i + 0.5) for i in range(n)]
            every = max(1, math.ceil(n * 7 * max(3, max((len(c) for c in s['x']), default=1)) / pw))
            for i, c in enumerate(s['x']):
                if i % every == 0:
                    o.append(f'<text class="tick" x="{xp[i]:.1f}" y="{mt + ph + 16}" text-anchor="middle">{e(c)}</text>')
            lab = s['x']
        base = Y(max(lo, min(hi, 0.0)))
        o.append(f'<line class="axis" x1="{ml}" x2="{W - mr}" y1="{(base if s["chart"] == "bar" else mt + ph):.1f}" y2="{(base if s["chart"] == "bar" else mt + ph):.1f}"/>')
        unit = f' {s["ylabel"]}' if s['ylabel'] else ''
        for j, q in enumerate(s['series']):
            col = f'var(--s{j + 1})'
            tip = lambda i, v: f'<title>{e((q["name"] + " · ") if q["name"] else "")}{e(str(lab[i]))}: {e(num(v, 5, L, True))}{e(unit)}</title>'      # noqa: E731,B023
            if s['chart'] == 'bar':
                band = pw / max(1, n)
                bw = min(BAR, max(1.0, (band - 2) / ns - (2 if ns > 1 else 0)))             # thin marks: a bar never wider than BAR
                off = (band - ns * bw - (ns - 1) * 2) / 2
                for i, v in enumerate(q['y']):
                    if v is None:
                        continue
                    xl = ml + band * i + off + j * (bw + 2)
                    yv, r = Y(v), min(4.0, bw / 2, abs(Y(v) - base))
                    d = (f'M{xl:.1f},{base:.1f}V{yv + r:.1f}Q{xl:.1f},{yv:.1f} {xl + r:.1f},{yv:.1f}H{xl + bw - r:.1f}Q{xl + bw:.1f},{yv:.1f} {xl + bw:.1f},{yv + r:.1f}V{base:.1f}Z' if v >= 0 else
                         f'M{xl:.1f},{base:.1f}V{yv - r:.1f}Q{xl:.1f},{yv:.1f} {xl + r:.1f},{yv:.1f}H{xl + bw - r:.1f}Q{xl + bw:.1f},{yv:.1f} {xl + bw:.1f},{yv - r:.1f}V{base:.1f}Z')
                    o.append(f'<path class="mark" fill="{col}" d="{d}">{tip(i, v)}</path>')
            else:
                pts = [(xp[i], Y(v), i, v) for i, v in enumerate(q['y']) if v is not None]
                if s['chart'] == 'line' and len(pts) > 1:
                    o.append(f'<polyline class="ln" stroke="{col}" points="{" ".join(f"{a:.1f},{b:.1f}" for a, b, _, _ in pts)}"/>')
                rad = 4 if len(pts) <= 60 else (2.5 if len(pts) <= 160 else 1.8)
                for a, b, i, v in pts:
                    if s['chart'] == 'dot' or len(pts) <= 60:
                        o.append(f'<circle class="pt" fill="{col}" cx="{a:.1f}" cy="{b:.1f}" r="{rad}"/>')
                    o.append(f'<circle class="hit" cx="{a:.1f}" cy="{b:.1f}" r="{max(6.0, rad + 3)}">{tip(i, v)}</circle>')
        for q in s['limits']:
            y = Y(q['value'])
            st = q['status'] if q['status'] in ('warning', 'critical', 'good') else 'warning'
            o.append(f'<line class="lim" stroke="var(--{st})" x1="{ml}" x2="{W - mr}" y1="{y:.1f}" y2="{y:.1f}"/>'
                     f'<text class="limt" x="{W - mr - 4}" y="{y - 5:.1f}" text-anchor="end">{e(q["label"])} {e(num(q["value"], 4, L, True))}</text>')
        if ns > 1:
            x = ml
            for j, q in enumerate(s['series']):
                o.append(f'<rect x="{x}" y="8" width="12" height="12" rx="3" fill="var(--s{j + 1})"/><text class="leg" x="{x + 17}" y="18">{e(q["name"])}</text>')
                x += 17 + 7.2 * len(q['name']) + 22
        o.append('</svg>')
        return f'<figure class="chart">' + (f'<figcaption>{e(s["title"])}</figcaption>' if s['title'] else '') + ''.join(o) + '</figure>'


_STATUS = {'el': {'info': 'Σημείωση', 'good': 'Εντάξει', 'warning': 'Προσοχή', 'critical': 'Παραβίαση'},
           'en': {'info': 'Note', 'good': 'OK', 'warning': 'Warning', 'critical': 'Violation'}}
_T = {'el': {'numbers': 'Οι αριθμοί του γραφήματος', 'json': 'Δεδομένα της αναφοράς (JSON)', 'footer': 'Power & Control Lab · αναφορά από το αντικείμενο αναφοράς του engine (pcl.report)'},
      'en': {'numbers': 'The numbers of the chart', 'json': 'Data of the report (JSON)', 'footer': 'Power & Control Lab · report from the report object of the engine (pcl.report)'}}
_CSS = """:root{/*LIGHT*/color-scheme:light dark}@media (prefers-color-scheme:dark){:root{/*DARK*/}}@media print{:root{/*LIGHT*/}.tools,details.chart-data>summary{display:none}details.chart-data{display:none}}
*{box-sizing:border-box}body{margin:0;background:var(--page);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:980px;margin:0 auto;padding:28px 24px 48px;background:var(--surface);min-height:100vh}
h1{font-size:26px;margin:0 0 4px}h2{font-size:19px;margin:30px 0 8px;padding-top:14px;border-top:1px solid var(--grid)}h3{font-size:16px;margin:22px 0 6px}h4{font-size:14px;margin:16px 0 4px;color:var(--ink2)}
p{margin:8px 0;max-width:76ch}.sub{color:var(--ink2);font-size:16px}.meta,.tnote,footer{color:var(--ink2);font-size:13px}footer{margin-top:36px;padding-top:12px;border-top:1px solid var(--grid)}
.note{padding:8px 12px;border-left:3px solid var(--axis);background:var(--page)}.note.good{border-color:var(--good)}.note.warning{border-color:var(--warning)}.note.critical{border-color:var(--critical)}
dl.facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px 18px;margin:10px 0}dl.facts div{border-top:1px solid var(--grid);padding-top:4px}
dt{color:var(--ink2);font-size:12.5px}dd{margin:0;font-size:17px;font-variant-numeric:tabular-nums}
figure{margin:14px 0}figcaption{font-weight:600;font-size:14px;margin-bottom:4px}.scroll{overflow-x:auto;max-height:520px;overflow-y:auto}
table{border-collapse:collapse;font-size:13.5px;font-variant-numeric:tabular-nums}th,td{padding:3px 10px;text-align:left;border-bottom:1px solid var(--grid);white-space:nowrap}
th{position:sticky;top:0;background:var(--surface);color:var(--ink2);font-weight:600;border-bottom:1px solid var(--axis)}.n{text-align:right}
tr.warning td:first-child{box-shadow:inset 3px 0 var(--warning)}tr.critical td:first-child{box-shadow:inset 3px 0 var(--critical)}tr.good td:first-child{box-shadow:inset 3px 0 var(--good)}td.st{color:var(--ink2);font-size:12px}
svg{width:100%;height:auto;display:block}svg text{font:11px system-ui,sans-serif;fill:var(--muted)}svg .axt{fill:var(--ink2)}svg .leg,svg .limt{fill:var(--ink)}
.grid{stroke:var(--grid);stroke-width:1}.axis{stroke:var(--axis);stroke-width:1}.ln{fill:none;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.pt{stroke:var(--surface);stroke-width:2}.hit{fill:transparent}.hit:hover{fill:var(--ink);fill-opacity:.12}.mark:hover{opacity:.75}.lim{stroke-width:1.5;stroke-dasharray:6 4}
details.chart-data{margin:-6px 0 14px}summary{cursor:pointer;color:var(--ink2);font-size:13px}.tools{margin:6px 0}
button{font:inherit;font-size:12.5px;padding:3px 10px;border:1px solid var(--axis);border-radius:6px;background:var(--surface);color:var(--ink);cursor:pointer}button:hover{background:var(--page)}"""
_JS = """(function(){var D=JSON.parse(document.getElementById('pcl-report').textContent);
function dl(name,text,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type}));a.download=name;document.body.appendChild(a);a.click();a.remove();}
function slug(s){return (s||'report').toLowerCase().replace(/[^a-z0-9\\u0370-\\u03ff]+/g,'_').replace(/^_|_$/g,'')||'report';}
document.addEventListener('click',function(ev){var b=ev.target.closest('button[data-dl]');if(!b)return;
 if(b.dataset.dl==='json')return dl(slug(D.title)+'.json',JSON.stringify(D,null,1),'application/json');
 var t=b.closest('figure').querySelector('table'),rows=[].map.call(t.rows,function(r){return [].map.call(r.cells,function(c){var v=c.textContent.replace(/\\u2009/g,'').replace(/\\u2212/g,'-');return /[";\\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}).join(';');});
 dl(slug(D.title)+'_'+b.dataset.n+'.csv','\\ufeff'+rows.join('\\n'),'text/csv');});})();"""


# -------------------------------------------------------------------- reports of the network studies
def network_report(net, study='pf', result=None, title=None, **kw):
    """A report for a study of a pcl.network.Network: study 'pf' (load flow), 'n1' / 'n1dc' (N−1 in AC / with the DC screening),
    'opf' / 'dcopf' (optimal power flow). result: the result of the study if it has run already (else it runs here with kw).
    The sections can be extended or re-ordered afterwards as with any Report. picture (4.19.4): a view of pcl.netview.view to
    draw on instead of the view of this network (the same places when the network is a changed copy of another)."""
    MW = 1e6
    given = kw.pop('picture', None)
    name = net.name or 'δίκτυο'
    gens = sum(e['kind'] in ('generator', 'unit') for e in net.elements)
    nbr = sum(e['kind'] in ('line', 'branch', 'transformer') for e in net.elements)
    head = {'pf': 'Ροή φορτίου', 'n1': 'Ανάλυση N−1 (AC)', 'n1dc': 'Ανάλυση N−1 (σάρωση DC)', 'opf': 'Βέλτιστη ροή φορτίου (AC)', 'dcopf': 'Βέλτιστη ροή φορτίου (DC)'}
    if study not in head:
        raise ReportError(f'network_report: study one of {", ".join(head)}')
    r = Report(title or head[study], name, meta={'Ζυγοί': len(net.buses), 'Κλάδοι': nbr, 'Γεννήτριες': gens, 'S βάσης (MVA)': net.S_base / MW})
    order = list(net.buses)

    def picture(res, *layers):
        # 4.19.4: the network that was studied, with what the study found on it (pcl.netview); a layer the result cannot feed is left out
        from . import netview
        try:
            v = given or netview.view(net)
        except Exception:                                    # a network that has no load-flow case draws nothing; the report goes on
            return
        shown = False
        for layer in layers:
            q = netview.values(v, res, layer)
            if q['note']:
                continue
            if not shown:
                r.heading('Διάγραμμα του δικτύου')
                shown = True
            r.network(v, q, q['title'])

    def advice(a):
        r.heading('Η επιλογή του engine')
        r.text(f'{a["why"][0].upper()}{a["why"][1:]}.')
    if study == 'pf':
        res = result or net.power_flow(**kw)
        advice(res.get('advice') or net.advice('pf'))
        from .powerflow import TXT
        r.facts([('Μέθοδος που έτρεξε', TXT.get(res.get('method'), res.get('method', 'Newton–Raphson'))), ('Σύγκλιση', bool(res['converged'])), ('Επαναλήψεις', int(res['iterations'])),
                 ('Απώλειες (MW)', round(res['losses'] / MW, 3)), ('Παραγωγή P (MW)', round(sum(b['P'] for b in res['buses'].values()) / MW, 2)),
                 ('Φορτίο P (MW)', round(sum(b['Pload'] for b in res['buses'].values()) / MW, 2))] + ([('Χρόνος (ms)', round(res['time'] * 1e3, 2))] if 'time' in res else []))
        if not res['converged']:
            r.note('Η ροή φορτίου δεν συνέκλινε: οι τιμές παρακάτω είναι της τελευταίας επανάληψης.', 'critical')
        if len(res.get('path', [])) > 1:
            r.note('Διαδρομή: ' + ' → '.join(res['path']), 'info')
        V = [res['buses'][b]['V'] for b in order]
        lim = []
        vmin = [net.buses[b].get('Vmin') for b in order if net.buses[b].get('Vmin') is not None]
        vmax = [net.buses[b].get('Vmax') for b in order if net.buses[b].get('Vmax') is not None]
        if vmax and vmin:
            lim = [{'value': max(vmax), 'label': 'όριο V max', 'status': 'warning'}, {'value': min(vmin), 'label': 'όριο V min', 'status': 'warning'}]
        picture(res, 'voltage', 'flow')
        r.heading('Τάσεις των ζυγών').chart('dot', order, [{'name': '|V|', 'y': V}], 'Μέτρο τάσης ανά ζυγό', 'Ζυγός', 'pu', lim)
        mark = {i: 'warning' for i, b in enumerate(order) if (net.buses[b].get('Vmax') is not None and V[i] > net.buses[b]['Vmax'] + 1e-6) or
                (net.buses[b].get('Vmin') is not None and V[i] < net.buses[b]['Vmin'] - 1e-6)}
        r.table(['Ζυγός', 'Τύπος', '|V| (pu)', 'Γωνία (°)', 'P παραγωγής (MW)', 'Q παραγωγής (Mvar)', 'P φορτίου (MW)', 'Q φορτίου (Mvar)'],
                [[b, res['types'][b], d['V'], d['angle'], d['P'] / MW, d['Q'] / MW, d['Pload'] / MW, d['Qload'] / MW] for b, d in ((b, res['buses'][b]) for b in order)],
                'Ζυγοί', [None, None, 5, 5, 5, 5, 5, 5], mark)
        _branches(r, net, res['branches'], MW)
    elif study in ('n1', 'n1dc'):
        res = result or net.contingency('ac' if study == 'n1' else 'dc', **kw)
        advice(res.get('advice') or net.advice('n1'))
        ok = [o for o in res['outages'] if o['converged']]
        r.facts([('Διαταραχές', len(res['outages'])), ('Λύθηκαν', len(ok)), ('Χωρίζουν το δίκτυο', len(res['islands'])), ('Δεν συγκλίνουν', len(res['failed'])),
                 ('Χειρότερη διαταραχή', res['worst'] or '—'), ('Με υπερφόρτιση', sum(bool(o['overloads']) for o in ok)), ('Χρόνος (ms)', round(res['time'] * 1e3, 1))] +
                ([('Στους παράγοντες της βάσης', res['chord']), ('Με πλήρη Newton', res['newton'])] if res['kind'] == 'ac' else []))
        if res['failed']:
            r.note('Δεν συγκλίνουν (πιθανή κατάρρευση τάσης): ' + ', '.join(res['failed'][:20]) + (' …' if len(res['failed']) > 20 else ''), 'critical')
        if res['islands']:
            r.note('Η απώλειά τους χωρίζει το δίκτυο (δεν λύνονται): ' + ', '.join(res['islands'][:30]) + (' …' if len(res['islands']) > 30 else ''), 'warning')
        if res.get('backend') == 'gpu':                    # 4.19.2: the batch ran on the experimental path
            from .backend import EXPERIMENTAL
            r.note(f"Η παρτίδα έτρεξε σε GPU* ({res.get('backend_why') or ''}). {EXPERIMENTAL}.", 'info')
        elif str(res.get('backend_why') or '').startswith('CPU, γιατί'):      # the GPU* was asked for, or chosen, and was not there
            r.note('Η παρτίδα έτρεξε στη ' + res['backend_why'] + '.', 'info')
        rated = any(o.get('loading') is not None for o in ok)
        top = sorted(ok, key=lambda o: -(o['loading'] if rated and o['loading'] is not None else o['Smax'] if not rated else 0.0))[:20]
        picture(res, 'n1')
        r.heading('Οι βαρύτερες διαταραχές')
        r.chart('bar', [o['name'] for o in top], [{'name': 'φόρτιση' if rated else 'μέγιστη ροή', 'y': [(100 * o['loading']) if rated else o['Smax'] / MW for o in top]}],
                'Ο πιο φορτισμένος κλάδος μετά από κάθε διαταραχή (οι 20 βαρύτερες)', 'Κλάδος που βγαίνει', '%' if rated else 'MVA',
                [{'value': 100.0, 'label': 'ονομαστική', 'status': 'critical'}] if rated else None)
        cols = ['Κλάδος που βγαίνει', 'Κατάσταση', 'Πιο φορτισμένος κλάδος', 'Ροή (MVA)', 'Φόρτιση (%)'] + (['V min (pu)', 'στον ζυγό'] if res['kind'] == 'ac' else [])
        rows, mark = [], {}
        for i, o in enumerate(res['outages']):
            if not o['converged']:
                rows.append([o['name'], 'χωρίζει το δίκτυο' if o['island'] else 'δεν συγκλίνει', '—', None, None] + ([None, '—'] if res['kind'] == 'ac' else []))
                mark[i] = 'warning' if o['island'] else 'critical'
                continue
            rows.append([o['name'], 'λύθηκε', o['branch'], o['Smax'] / MW, None if o['loading'] is None else 100 * o['loading']] +
                        ([o['Vmin'], o['Vmin_bus']] if res['kind'] == 'ac' else []))
            if o['overloads']:
                mark[i] = 'critical'
        r.table(cols, rows, 'Όλες οι διαταραχές', [None, None, None, 5, 4] + ([5, None] if res['kind'] == 'ac' else []), mark)
    else:
        res = result or net.opf('ac' if study == 'opf' else 'dc', **kw)
        advice(res.get('advice') or net.advice(study))
        r.facts([('Κόστος (ανά ώρα)', round(res['cost'], 2)), ('Σύγκλιση', bool(res['converged'])), ('Επαναλήψεις', int(res['iterations'])), ('Απώλειες (MW)', round(res['losses'] / MW, 3)),
                 ('Περιορισμοί που δεσμεύουν', len(res['binding'])), ('Όρια ροής στο πρόβλημα', res.get('flow_limits', 0)), ('Χρόνος (ms)', round(res['time'] * 1e3, 1))])
        if not res['converged']:
            r.note(f'Το πρόβλημα δεν λύθηκε ({res["message"]}): οι τιμές παρακάτω δεν είναι βέλτιστες.', 'critical')
        if res.get('start') == 'warm' or res.get('start_path'):          # 4.19.2: a proposed starting point, verified by the solver
            r.note('Εκκίνηση του λύτη: ' + ('από προτεινόμενο σημείο' if res.get('start') == 'warm' else 'κανονική')
                   + (' (' + ' · '.join(res.get('start_path') or []) + ')' if res.get('start_path') else '') + '. Το βέλτιστο είναι το ίδιο μέσα στην ανοχή.', 'info')
        for n in res.get('notes', []):
            r.note(n, 'info')
        src = res['sources']
        picture(res, 'loading', 'lmp')
        r.heading('Κατανομή της παραγωγής')
        if len(src) <= 60:
            r.chart('bar', [s['name'] for s in src], [{'name': 'P', 'y': [s['P'] / MW for s in src]}], 'Ενεργός ισχύς ανά πηγή', 'Πηγή', 'MW')
        on = {(b['kind'], b['name']) for b in res['binding']}

        def mu(s, k):                       # a multiplier that does not bind is the residue of the interior point: shown as 0
            return s['mu_' + k] if (k, s['name']) in on else 0.0
        mark = {i: 'warning' for i, s in enumerate(src) if any((k, s['name']) in on for k in ('Pmax', 'Pmin', 'Qmax', 'Qmin'))}
        r.table(['Πηγή', 'Ζυγός', 'P (MW)', 'Q (Mvar)', 'Κόστος (ανά ώρα)', 'μ P max', 'μ P min', 'μ Q max', 'μ Q min'],
                [[s['name'], s['bus'], s['P'] / MW, s['Q'] / MW, s['cost'], mu(s, 'Pmax'), mu(s, 'Pmin'), mu(s, 'Qmax'), mu(s, 'Qmin')] for s in src],
                'Πηγές', [None, None, 5, 5, 6, 4, 4, 4, 4], mark, 'μ: πολλαπλασιαστής του ορίου (κόστος ανά MWh ή Mvar·h)· σημειώνονται οι πηγές πάνω σε όριο.')
        r.heading('Οριακές τιμές')
        lmp = [res['buses'][b]['lmp'] for b in order]
        r.chart('dot', order, [{'name': 'οριακή τιμή P', 'y': lmp}], 'Οριακή τιμή ενεργού ισχύος ανά ζυγό', 'Ζυγός', 'ανά MWh')
        r.table(['Ζυγός', '|V| (pu)', 'Γωνία (°)', 'Οριακή τιμή P (ανά MWh)', 'Οριακή τιμή Q (ανά Mvar·h)', 'P φορτίου (MW)'],
                [[b, d['V'], d['angle'], d['lmp'], d['lmp_Q'], d['Pload'] / MW] for b, d in ((b, res['buses'][b]) for b in order)], 'Ζυγοί', [None, 5, 5, 6, 4, 5])
        if res['binding']:
            kinds = {'Pmax': 'P στο μέγιστο', 'Pmin': 'P στο ελάχιστο', 'Qmax': 'Q στο μέγιστο', 'Qmin': 'Q στο ελάχιστο', 'Vmax': '|V| στο μέγιστο', 'Vmin': '|V| στο ελάχιστο',
                     'flow': 'ροή στο όριο του κλάδου'}
            r.heading('Περιορισμοί που δεσμεύουν')
            r.table(['Περιορισμός', 'Στοιχείο', 'Πολλαπλασιαστής'], [[kinds.get(b['kind'], b['kind']), b['name'], b['mu']] for b in res['binding']], '', [None, None, 5])
        _branches(r, net, res['branches'], MW)
    r.data('study', {'study': study, 'network': name})
    return r


def _branches(r, net, branches, MW):
    rated = [q for q in branches if q.get('loading') is not None]
    r.heading('Κλάδοι')
    top = sorted(rated or branches, key=lambda q: -(q['loading'] if rated else q['S']))[:20]
    r.chart('bar', [q['name'] for q in top], [{'name': 'φόρτιση' if rated else '|S|', 'y': [100 * q['loading'] if rated else q['S'] / MW for q in top]}],
            'Οι 20 πιο φορτισμένοι κλάδοι', 'Κλάδος', '%' if rated else 'MVA', [{'value': 100.0, 'label': 'ονομαστική', 'status': 'critical'}] if rated else None)
    mark = {i: 'critical' for i, q in enumerate(branches) if q.get('loading') is not None and q['loading'] > 1 + 1e-6}
    r.table(['Κλάδος', 'Από', 'Προς', 'P από (MW)', 'Q από (Mvar)', 'P προς (MW)', 'Q προς (Mvar)', 'Απώλειες (MW)', 'Φόρτιση (%)'],
            [[q['name'], q['a'], q['b'], q['Pa'] / MW, q['Qa'] / MW, q['Pb'] / MW, q['Qb'] / MW, q['loss'] / MW, None if q.get('loading') is None else 100 * q['loading']] for q in branches],
            'Ροές', [None, None, None, 5, 5, 5, 5, 4, 4], mark)


__all__ = ['Report', 'ReportError', 'network_report', 'num', 'KINDS']
