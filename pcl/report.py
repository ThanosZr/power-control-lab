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
    'opf' / 'dcopf' (optimal power flow), 'scopf' (4.19.4: the DC optimal power flow with security against every single outage),
    'cpf' (4.19.5: the continuation load flow, the P–V curve and the loading margin), 'se' (4.19.5: state estimation), 'harmonic' (4.19.5: the harmonic load flow), 'unbalanced' (4.19.5: the three-phase load flow of a feeder; net is then
    pcl.unbalanced.as_network of the feeder and result the result of pcl.unbalanced.run). result: the result of the study if it has run already (else it runs here with kw).
    The sections can be extended or re-ordered afterwards as with any Report. picture (4.19.4): a view of pcl.netview.view to
    draw on instead of the view of this network (the same places when the network is a changed copy of another)."""
    MW = 1e6
    given = kw.pop('picture', None)
    name = net.name or 'δίκτυο'
    gens = sum(e['kind'] in ('generator', 'unit') for e in net.elements)
    nbr = sum(e['kind'] in ('line', 'branch', 'transformer') for e in net.elements)
    head = {'pf': 'Ροή φορτίου', 'n1': 'Ανάλυση N−1 (AC)', 'n1dc': 'Ανάλυση N−1 (σάρωση DC)', 'opf': 'Βέλτιστη ροή φορτίου (AC)', 'dcopf': 'Βέλτιστη ροή φορτίου (DC)',
            'scopf': 'Βέλτιστη ροή φορτίου με ασφάλεια N−1 (DC)', 'cpf': 'Συνεχιζόμενη ροή φορτίου: καμπύλη P–V και περιθώριο φόρτισης',
            'se': 'Εκτίμηση κατάστασης: ελάχιστα τετράγωνα με βάρη και εντοπισμός λανθασμένων μετρήσεων',
            'harmonic': 'Αρμονική ροή φορτίου: παραμόρφωση τάσης και συντονισμοί', 'unbalanced': 'Ασύμμετρη (τριφασική) ροή φορτίου τροφοδότη'}
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
    elif study == 'cpf':
        res = result or net.cpf(**kw)
        advice(res.get('advice') or net.advice('pf'))
        _cpf(r, net, res, MW, picture)
    elif study == 'se':
        res = result or net.estimate(**kw)
        r.heading('Το πρόβλημα')
        r.text(f'{res["advice"]["why"][0].upper()}{res["advice"]["why"][1:]}.')
        _se(r, net, res, MW, picture)
    elif study == 'harmonic':
        res = result or net.harmonics(**kw)
        if res.get('advice'):
            r.heading('Η μέθοδος')
            r.text(f'{res["advice"]["why"][0].upper()}{res["advice"]["why"][1:]}.')
        _harmonic(r, net, res, MW, picture)
    elif study == 'unbalanced':
        if result is None:
            raise ReportError('network_report: the three-phase load flow needs its result (pcl.unbalanced.run of the feeder)')
        res = result
        if res.get('advice'):
            r.heading('Η μέθοδος')
            r.text(f'{res["advice"]["why"][0].upper()}{res["advice"]["why"][1:]}.')
        _unbalanced(r, net, res, picture)
    else:
        res = result or (net.scopf(**kw) if study == 'scopf' else net.opf('ac' if study == 'opf' else 'dc', **kw))
        advice(res.get('advice') or net.advice('dcopf' if study == 'scopf' else study))
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
        if study == 'scopf':
            _security(r, res, MW)
        picture(res, *(('security', 'loading', 'lmp') if study == 'scopf' else ('loading', 'lmp')))
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


def _security(r, res, MW):
    """4.19.4: what the security against every single outage costs, which pairs bind, and what no dispatch covers."""
    s = res['security']
    pct = lambda x: None if x is None else round(100 * x, 2)      # noqa: E731
    wb, wa = s.get('worst_before') or {}, s.get('worst_after') or {}
    r.heading('Ασφάλεια N−1')
    r.facts([('Ασφαλής κατανομή', bool(s.get('secure'))), ('Διαταραχές που ελέγχθηκαν', int(s['outages'])), ('Διαταραχές που χωρίζουν το δίκτυο (εκτός ελέγχου)', len(s['islands'])),
             ('Όριο μετά από διαταραχή (× ονομαστική)', s['emergency']), ('Κόστος χωρίς ασφάλεια (ανά ώρα)', round(s['cost_base'], 2)),
             ('Κόστος της ασφάλειας (ανά ώρα)', None if s.get('cost_security') is None else round(s['cost_security'], 3)),
             ('Γύροι', int(s['rounds'])), ('Περιορισμοί που προστέθηκαν', int(s['constraints'])), ('Διαταραχές με υπερφόρτιση πριν', int(s['insecure_before'])),
             ('Χειρότερη φόρτιση πριν (%)', pct(wb.get('loading'))), ('Χειρότερη φόρτιση μετά (%)', pct(wa.get('loading')))])
    r.text('Το μοντέλο είναι το γραμμικό (DC) και για τη βασική κατάσταση και για κάθε διαταραχή, και η κατανομή δεν αλλάζει μετά τη διαταραχή (προληπτική ασφάλεια). '
           'Οι φορτίσεις «μετά από διαταραχή» είναι ποσοστό του ορίου που επιτρέπεται τότε.')
    if wb:
        r.note(f'Χωρίς ασφάλεια, η απώλεια του {wb["outage"]} φορτίζει τον {wb["branch"]} στο {pct(wb["loading"])} %'.replace('.', ',')
               + (f'· με ασφάλεια, η χειρότερη διαταραχή ({wa["outage"]}) φορτίζει τον {wa["branch"]} στο {pct(wa["loading"])} %.'.replace('.', ',', 1) if wa else '.'),
               'info' if s.get('secure') else 'warning')
    if s['binding']:
        r.table(['Κλάδος', 'Διαταραχή (απώλεια του)', 'Πολλαπλασιαστής (ανά MWh)', 'Φόρτιση μετά (%)'], [[q['branch'], q['outage'], q['mu'], 100 * q['loading']] for q in s['binding'][:40]],
                'Περιορισμοί ασφάλειας που δεσμεύουν' + (f' (οι 40 από {len(s["binding"])})' if len(s['binding']) > 40 else ''), [None, None, 5, 5])
    if s['unsecured']:
        r.note(f'{len(s["unsecured"])} ζεύγη κλάδου και διαταραχής μένουν πάνω από το όριο: καμία κατανομή της παραγωγής δεν τα καλύπτει. Θέλουν αλλαγή στο δίκτυο ή διορθωτικές κινήσεις μετά τη διαταραχή.', 'critical')
        r.table(['Κλάδος', 'Διαταραχή (απώλεια του)', 'Υπερφόρτιση που μένει (MW)', 'Φόρτιση μετά (%)'],
                [[q['branch'], q['outage'], q['overload'] / MW, 100 * q['loading']] for q in s['unsecured'][:40]], 'Τι δεν καλύπτεται', [None, None, 5, 5], {i: 'critical' for i in range(40)})
    ac = s.get('ac')
    if ac:
        if ac.get('converged'):
            r.note(f'Έλεγχος με ροή φορτίου AC της κατανομής: απώλειες {ac["losses"] / MW:.3f} MW, τάσεις {ac["Vmin"]:.4f}–{ac["Vmax"]:.4f} pu, '.replace('.', ',')
                   + (f'{ac["overloads"]} κλάδοι πάνω από την ονομαστική στη βασική κατάσταση (ο χειρότερος: {ac["worst_branch"]}, {100 * ac["worst_loading"]:.1f} %).'.replace('.', ',', 1)
                      if ac['overloads'] else f'κανένας κλάδος πάνω από την ονομαστική (ο πιο φορτισμένος: {ac["worst_branch"]}, {100 * ac["worst_loading"]:.1f} %).'.replace('.', ',', 1))
                   + ' Το γραμμικό μοντέλο δεν βλέπει απώλειες και άεργο.', 'warning' if ac['overloads'] else 'info')
        else:
            r.note('Έλεγχος με ροή φορτίου AC της κατανομής: ' + str(ac.get('message')), 'warning')


def _cpf(r, net, res, MW, picture):
    """4.19.5: the continuation load flow: the loading margin, the curve of the weakest buses, the index, what the generators did."""
    ns, gr, ev = res['nose'], res['growth'], res['events']
    kind = {'fold': 'μύτη της καμπύλης (ιδιόμορφος πίνακας της ροής φορτίου)', 'limit': 'αλλαγή τύπου ζυγού σε όριο αέργου (άμεση αστάθεια)'}.get(ns['kind'], '—')
    r.facts([('Το όριο φόρτισης βρέθηκε', bool(res['converged'])), ('Είδος του ορίου', kind), ('λ στο όριο', round(ns['lambda'], 5)),
             ('Φορτίο σήμερα (MW)', round(res['base']['load_MW'], 2)), ('Φορτίο στο όριο (MW)', round(ns['load_MW'], 2)), ('Περιθώριο φόρτισης (MW)', round(ns['margin_MW'], 2)),
             ('Περιθώριο (% του σημερινού φορτίου)', None if ns['margin'] is None else round(100 * ns['margin'], 2)), ('Πιο αδύναμος ζυγός', ns['bus']),
             ('Τάση του στο όριο (pu)', round(ns['V'], 4)), ('Χαμηλότερη τάση στο όριο (pu)', round(ns['Vmin'], 4)), ('στον ζυγό', ns['Vmin_bus']),
             ('Όρια αέργου των γεννητριών', bool(res['q_limits'])), ('Αλλαγές τύπου ζυγού στη διαδρομή', sum(e['point'] > 0 for e in ev)),
             ('Σημεία της καμπύλης', int(res['points'])), ('Χρόνος (ms)', round(res['time'] * 1e3, 1))])
    f = lambda x, d=1: f'{x:.{d}f}'.replace('.', ',')             # noqa: E731
    r.text(f'Το φορτίο του δικτύου μεγαλώνει με την παράμετρο λ από τη σημερινή του τιμή (λ = 0): ανά μονάδα του λ, {f(gr["load_MW"])} MW και {f(gr["load_Mvar"])} Mvar φορτίου '
           f'και {f(gr["gen_MW"])} MW παραγωγής εκτός του ζυγού ταλάντωσης, που καλύπτει τα υπόλοιπα. Το όριο φόρτισης είναι το μεγαλύτερο λ για το οποίο η ροή φορτίου έχει λύση.')
    if not res['converged']:
        r.note('Το όριο φόρτισης δεν βρέθηκε: ' + res['message'] + '.', 'critical')
    elif ns['kind'] == 'limit':
        r.note('Το όριο δεν είναι μύτη της καμπύλης: τη στιγμή που ο ζυγός ' + str(next((e['bus'] for e in ev if e['point'] == ns['point']), ns['bus'])) + ' αλλάζει τύπο σε όριο αέργου, '
               'οι λύσεις με περισσότερο φορτίο παύουν να υπάρχουν (άμεση αστάθεια στο όριο). Η απλή ροή φορτίου με όρια αέργου μπορεί να δώσει «λύση» και λίγο πιο πάνω, '
               'με τη γεννήτρια στο άνω όριό της και την τάση πάνω από την τιμή ρύθμισης: τέτοιο σημείο δεν είναι κατάσταση λειτουργίας.', 'warning')
    elif not ns['refined']:
        r.note(res['message'] + '.', 'warning')
    has = any(e.get('Qmax') is not None or e.get('Qmin') is not None for e in net.elements if e['kind'] in ('generator', 'unit'))
    if has and not res['q_limits']:
        r.note('Τα όρια αέργου των γεννητριών δεν εφαρμόστηκαν (q_limits): με αυτά το όριο φόρτισης έρχεται συνήθως νωρίτερα.', 'info')
    start = [e['bus'] for e in ev if e['point'] == 0]
    if start:
        r.note('Σε όριο αέργου ήδη στο σημερινό φορτίο: ' + ', '.join(start[:30]) + (' …' if len(start) > 30 else '') + '.', 'info')
    picture(res, 'collapse', 'voltage')
    # the curve: the voltage of the weakest buses against the load of the network (against λ when only reactive load grows)
    byP = abs(gr['load_MW']) > 1e-9
    x = res['load_MW'] if byP else res['lambda']
    xl = 'Φορτίο του δικτύου (MW)' if byP else 'λ'
    top = [q['bus'] for q in res['weak'][:SERIES]] or [ns['Vmin_bus']]
    r.heading('Καμπύλη P–V')
    r.chart('line', x, [{'name': f'ζυγός {b}', 'y': res['V'][b]} for b in top], 'Τάση των πιο αδύναμων ζυγών καθώς μεγαλώνει το φορτίο (πάνω και κάτω μέρος της καμπύλης)', xl, 'pu')
    j = ns['point'] + 1
    if any(v is not None for v in res['index'][:j]):
        r.heading('Δείκτης ευστάθειας τάσης', 3)
        r.chart('line', x[:j], [{'name': 'δείκτης', 'y': res['index'][:j]}], 'Πόσο φορτίο αντιστοιχεί σε πτώση τάσης 1 pu του πιο αδύναμου ζυγού: μηδενίζεται στη μύτη', xl,
                res.get('index_unit', 'MW/pu'), ymin=0.0, table=False)
    r.heading('Οι πιο αδύναμοι ζυγοί')
    r.table(['Ζυγός', '|V| σήμερα (pu)', '|V| στο όριο (pu)', 'Πτώση (pu)', 'Μερίδιο στην εφαπτομένη'], [[q['bus'], q['V0'], q['V'], q['drop'], q['share']] for q in res['weak']], '',
            [None, 5, 5, 5, 4], note='Μερίδιο: η μεταβολή της τάσης του ζυγού στην εφαπτομένη της καμπύλης στο όριο, ως προς τη μεγαλύτερη (1 = ο πιο αδύναμος ζυγός).')
    moved = [e for e in ev if e['point'] > 0]
    if moved:
        r.heading('Γεννήτριες και όρια αέργου στη διαδρομή')
        lim = {'max': 'άνω', 'min': 'κάτω'}
        mark = {i: ('critical' if e['point'] == ns['point'] and ns['kind'] == 'limit' else 'warning') for i, e in enumerate(moved[:200]) if e['point'] <= ns['point'] and e['to'] == 'PQ'}
        r.table(['λ', 'Φορτίο (MW)', 'Ζυγός', 'Όριο', 'Τι έγινε', 'Μέρος της καμπύλης'],
                [[e['lambda'], res['load_MW'][e['point']], e['bus'], lim[e['limit']], 'δεν κρατά πια την τάση του' if e['to'] == 'PQ' else 'κρατά ξανά την τάση του',
                  'πάνω' if e['point'] <= ns['point'] else 'κάτω'] for e in moved[:200]],
                'Αλλαγές τύπου ζυγού' + (f' (οι 200 από {len(moved)})' if len(moved) > 200 else ''), [5, 5, None, None, None, None], mark)
    r.heading('Ζυγοί')
    order = list(res['buses'])
    r.table(['Ζυγός', 'Τύπος στο όριο', 'Όριο αέργου', '|V| σήμερα (pu)', '|V| στο όριο (pu)', 'Γωνία στο όριο (°)', 'Πτώση (pu)', 'Μερίδιο'],
            [[b, d['type'], {'max': 'άνω', 'min': 'κάτω'}.get(d['limit'], ''), d['V0'], d['V'], d['angle'], d['drop'], d['share']] for b, d in ((b, res['buses'][b]) for b in order)],
            '', [None, None, None, 5, 5, 5, 5, 4])


def _se(r, net, res, MW, picture):
    """4.19.5: state estimation: the measurements, the tests, what was taken out, the estimate against the load flow."""
    from .se import TXT as KIND, PLAN_TXT
    f = lambda x, d=2: '—' if x is None else f'{x:.{d}f}'.replace('.', ',')             # noqa: E731
    meas, bad, fi = res['measurements'], res['bad'], res.get('first') or {}
    where = lambda m: m.get('bus', m.get('branch'))                                     # noqa: E731
    r.facts([('Η εκτίμηση συνέκλινε', bool(res['converged'])), ('Οι μετρήσεις ορίζουν την κατάσταση', bool(res['observable'])), ('Μετρήσεις', int(res['m'])),
             ('Άγνωστοι (γωνίες και μέτρα τάσης)', int(res['n'])), ('Ισότητες μηδενικής έγχυσης', int(res['constraints'])), ('Περίσσεια (εξισώσεις ανά άγνωστο)', round(res['redundancy'], 2)),
             ('Επαναλήψεις', int(res['iterations'])), ('Εκτιμήσεις (μία ανά μέτρηση που βγήκε, και η πρώτη)', int(res['rounds'])),
             ('J στην πρώτη εκτίμηση', None if fi.get('J') is None else round(fi['J'], 2)), ('J στην τελική', None if res.get('J') is None else round(res['J'], 2)),
             ('Βαθμοί ελευθερίας', res.get('dof')), (f'Κατώφλι χ² ({f(100 * res["confidence"], 0)} %)', None if res.get('chi2') is None else round(res['chi2'], 2)),
             ('Μεγαλύτερο κανονικοποιημένο υπόλοιπο που μένει', None if res.get('largest') is None else round(res['largest'], 2)), ('Κατώφλι του', res['threshold']),
             ('Μετρήσεις που βγήκαν ως λανθασμένες', len(bad)), ('Κρίσιμες μετρήσεις', len(res['critical'])), ('Χρόνος (ms)', round(res['time'] * 1e3, 1))])
    if res.get('plan'):
        r.text(f'Οι μετρήσεις φτιάχτηκαν από τη ροή φορτίου του δικτύου με τυχαία σφάλματα: {PLAN_TXT[res["plan"]]}. Η εκτίμηση δεν ξέρει τη ροή φορτίου· ξέρει μόνο τις μετρήσεις, '
               'την τυπική απόκλιση καθεμιάς και το δίκτυο.')
    r.text('Η εκτίμηση είναι οι τάσεις που ελαχιστοποιούν το J = Σ (μέτρηση − εκτίμηση)²/σ². Αν τα σφάλματα είναι τυχαία με τις σ που δηλώθηκαν, το J ακολουθεί κατανομή χ² με '
           'βαθμούς ελευθερίας τις εξισώσεις που περισσεύουν: J πάνω από το κατώφλι σημαίνει ότι κάποια μέτρηση είναι λανθασμένη. Ποια, το λέει το κανονικοποιημένο υπόλοιπο: '
           'το υπόλοιπο κάθε μέτρησης διαιρεμένο με την τυπική απόκλιση που θα είχε αν όλα ήταν σωστά. Η μέτρηση με το μεγαλύτερο, αν περνά το κατώφλι, βγαίνει και η εκτίμηση επαναλαμβάνεται.')
    if not res['observable']:
        isl = res.get('islands') or []
        r.note('Οι μετρήσεις δεν ορίζουν την κατάσταση του δικτύου: ' + res['message'] + '.', 'critical')
        if len(isl) > 1:
            r.table(['Νησίδα', 'Ζυγοί', 'Ποιοι'], [[i + 1, len(q), ', '.join(q[:25]) + (' …' if len(q) > 25 else '')] for i, q in enumerate(isl[:40])],
                    'Παρατηρήσιμες νησίδες: μέσα σε καθεμιά οι ροές βρίσκονται, ανάμεσά τους όχι', [None, None, None])
        return
    if not res['converged']:
        r.note('Η εκτίμηση δεν συνέκλινε: ' + res['message'] + '.', 'critical')
        return
    if fi.get('suspect') and not bad:
        r.note(f'Ο έλεγχος χ² δείχνει λανθασμένα δεδομένα (J = {f(fi["J"])} πάνω από {f(fi["chi2"])}), αλλά κανένα κανονικοποιημένο υπόλοιπο δεν περνά το κατώφλι {f(res["threshold"], 1)}: '
               'το σφάλμα μπορεί να είναι σε κρίσιμη μέτρηση ή μοιρασμένο σε πολλές.', 'warning')
    if bad:
        hit = sum(b['index'] in res['planted'] for b in bad)
        r.note((f'Ο έλεγχος χ² της πρώτης εκτίμησης: J = {f(fi["J"])} απέναντι σε κατώφλι {f(fi["chi2"])}' + (' (λανθασμένα δεδομένα)' if fi.get('suspect') else ' (δεν τα έδειξε)') + '. '
                if fi.get('J') is not None else '') + (f'Βγήκαν {len(bad)} μετρήσεις' if len(bad) > 1 else 'Βγήκε μία μέτρηση') + ' με τον έλεγχο του μεγαλύτερου κανονικοποιημένου υπολοίπου'
               + (f'· από τα {len(res["planted"])} σφάλματα που μπήκαν επίτηδες βρέθηκαν τα {hit}' if res['planted'] else '') + '.', 'warning')
    if res['planted'] and not all(i in [b['index'] for b in bad] for i in res['planted']):
        miss = [meas[i] for i in res['planted'] if i not in [b['index'] for b in bad]]
        r.note('Σφάλμα που μπήκε επίτηδες και δεν βρέθηκε: ' + ', '.join(f'{m["type"]} στο {where(m)}' + (' (κρίσιμη μέτρηση: το σφάλμα της δεν φαίνεται)' if m.get('critical') else '') for m in miss) + '.', 'critical')
    if res['message']:
        r.note(res['message'] + '.', 'warning')
    if res['critical']:
        r.note(f'{len(res["critical"])} μετρήσεις είναι κρίσιμες: χωρίς καθεμιά η κατάσταση δεν ορίζεται, το υπόλοιπό τους είναι πάντα μηδέν και ένα σφάλμα τους περνά στην εκτίμηση χωρίς να φαίνεται.', 'info')
    picture(res, 'residual', 'voltage')
    if bad:
        r.heading('Μετρήσεις που βγήκαν')
        r.table(['Μέτρηση', 'Πού', 'Τιμή (pu)', 'σ (pu)', 'Κανον. υπόλοιπο', 'Σφάλμα, εκτίμηση (σ)', 'Διορθωμένη (pu)', 'Μπήκε (σ)'],
                [[KIND[b['type']], b['at'], b['value'], b['sigma'], b['rN'], b['error'] / b['sigma'], b['corrected'], meas[b['index']].get('gross')] for b in bad], '',
                [None, None, 5, 4, 3, 3, 5, 3], {i: 'critical' for i in range(len(bad))},
                note='Με τη σειρά που βγήκαν. Η εκτίμηση του σφάλματος είναι το υπόλοιπο επί σ²/Ω, όπου Ω η διακύμανση του υπολοίπου· η διορθωμένη τιμή είναι η μέτρηση μείον αυτό. «Μπήκε»: το χονδρικό σφάλμα που προστέθηκε επίτηδες, όπου υπάρχει.')
    used = [m for m in meas if m['used'] and m['rN'] is not None]
    edges = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
    cnt = [sum(a <= m['rN'] < b for m in used) for a, b in zip(edges, edges[1:])] + [sum(m['rN'] >= 3.0 for m in used)]
    from math import erf, sqrt
    cdf = lambda x: erf(x / sqrt(2))                                                    # noqa: E731
    exp = [len(used) * (cdf(b) - cdf(a)) for a, b in zip(edges, edges[1:])] + [len(used) * (1 - cdf(3.0))]
    r.heading('Κανονικοποιημένα υπόλοιπα')
    r.chart('bar', [f'{f(a, 1)}–{f(b, 1)}' for a, b in zip(edges, edges[1:])] + ['πάνω από 3,0'], [{'name': 'μετρήσεις', 'y': cnt}, {'name': 'αναμενόμενες αν όλα τα σφάλματα είναι τυχαία', 'y': exp}],
            'Πόσες μετρήσεις έχουν κανονικοποιημένο υπόλοιπο σε κάθε περιοχή (τελική εκτίμηση)', 'κανονικοποιημένο υπόλοιπο', 'μετρήσεις')
    top = sorted(used, key=lambda m: -m['rN'])[:15]
    r.table(['Μέτρηση', 'Πού', 'Τιμή (pu)', 'Εκτίμηση (pu)', 'Υπόλοιπο (pu)', 'σ (pu)', 'Κανονικοποιημένο υπόλοιπο'],
            [[KIND[m['type']], where(m), m['value'], m['estimate'], m['residual'], m['sigma'], m['rN']] for m in top], 'Οι 15 μετρήσεις με το μεγαλύτερο', [None, None, 5, 5, 4, 4, 3],
            {i: 'warning' for i, m in enumerate(top) if m['rN'] > res['threshold']})
    r.heading('Οι μετρήσεις ανά είδος')
    rows = []
    for t, c in (res.get('counts') or {}).items():
        mm = [m for m in meas if m['type'] == t]
        us = [m for m in mm if m['used'] and m['residual'] is not None]
        rows.append([KIND[t], c, len(mm) - sum(m['used'] for m in mm), sum(m['critical'] for m in mm), mm[0]['sigma'],
                     None if not us else (sum((m['residual'] / m['sigma']) ** 2 for m in us) / len(us)) ** 0.5])
    r.table(['Είδος', 'Πλήθος', 'Βγήκαν', 'Κρίσιμες', 'σ (pu)', 'RMS υπολοίπου (σ)'], rows, '', [None, None, None, None, 4, 3])
    er = res.get('error')
    order = list(res['buses'])
    if er:
        r.heading('Η εκτίμηση απέναντι στη ροή φορτίου')
        r.facts([('Μεγαλύτερη διαφορά |V| (pu)', round(er['V_max'], 5)), ('στον ζυγό', er['V_bus']), ('Μεγαλύτερη διαφορά γωνίας (°)', round(er['angle_max'], 4)), ('στον ζυγό ', er['angle_bus']),
                 ('RMS διαφοράς |V| (pu)', round(er['V_rms'], 5)), ('Μεγαλύτερη διαφορά |V| στην πρώτη εκτίμηση (pu)', round(er['first_V_max'], 5)),
                 ('Μεγαλύτερο σφάλμα μέτρησης (σ)', round(er['measured_max_sigma'], 2))])
        r.text('Η ροή φορτίου είναι η «αλήθεια» από την οποία βγήκαν οι μετρήσεις. Σε πραγματικό δίκτυο δεν υπάρχει: εκεί η εκτίμηση είναι ό,τι καλύτερο ξέρουμε για την κατάσταση.')
        r.chart('dot', order, [{'name': 'εκτίμηση − ροή φορτίου', 'y': [res['buses'][b].get('dV') for b in order]}], 'Διαφορά του μέτρου τάσης ανά ζυγό', 'ζυγός', 'pu', table=False)
    r.heading('Ζυγοί')
    r.table(['Ζυγός', '|V| εκτίμηση (pu)', 'Γωνία (°)'] + (['|V| ροής φορτίου (pu)', 'Γωνία ροής φορτίου (°)', 'Διαφορά |V| (pu)'] if er else []) + ['P (MW)', 'Q (Mvar)'],
            [[b, d['V'], d['angle']] + ([d.get('V_true'), d.get('angle_true'), d.get('dV')] if er else []) + [(d['P'] - d['Pload']) / MW, (d['Q'] - d['Qload']) / MW]
             for b, d in ((b, res['buses'][b]) for b in order)], '', [None, 5, 4] + ([5, 4, 5] if er else []) + [4, 4],
            note='P και Q: η έγχυση του ζυγού προς το δίκτυο (παραγωγή μείον φορτίο) όπως βγαίνει από την εκτίμηση.')


def _harmonic(r, net, res, MW, picture):
    """4.19.5: the harmonic load flow: the distortion of every bus against its limit, the spectrum where it is worst, the scan."""
    from .harmonic import LOAD_TXT, LINE_TXT, SPECTRUM_TXT
    f = lambda x, d=2: '—' if x is None else f'{x:.{d}f}'.replace('.', ',')             # noqa: E731
    if not res['converged']:
        r.note('Η αρμονική ροή φορτίου δεν έγινε: ' + res['message'] + '.', 'critical')
        return
    B, orders, sc = res['buses'], res['harmonics'], res.get('scan')
    w = res['worst']['bus']
    r.facts([('Πηγές αρμονικών', len(res['sources'])), ('Τάξεις που λύθηκαν', ', '.join(str(h) for h in orders)), ('Μεγαλύτερη παραμόρφωση τάσης, THD (%)', round(res['worst']['THD'], 3)),
             ('στον ζυγό', w), ('Όριο του ζυγού αυτού (%)', B[w]['limit_thd']), ('Ζυγοί πάνω από το όριό τους', len(res['over'])), ('από', len(B)),
             ('Γραμμές', LINE_TXT[res['line_model']]), ('Φορτία', LOAD_TXT[res['load_model']]), ('Απώλειες της θεμελιώδους (MW)', round(res['lf']['losses'] / MW, 3)),
             ('Χρόνος (ms)', round(res['time'] * 1e3, 1))])
    r.text('Κάθε μη γραμμικό φορτίο τραβά ρεύμα που δεν είναι ημιτονικό. Η ροή φορτίου δίνει τη θεμελιώδη του· οι αρμονικές του βγαίνουν από το φάσμα του, με μέτρο ανάλογο της θεμελιώδους '
           'και γωνία μετατοπισμένη μαζί της. Για κάθε τάξη το δίκτυο είναι γραμμικό κύκλωμα: οι επαγωγικές αντιδράσεις μεγαλώνουν με την τάξη, οι χωρητικές μικραίνουν, και όπου '
           'οι δύο αναιρούνται η εμπέδηση που βλέπει η πηγή γίνεται μεγάλη (παράλληλος συντονισμός). THD ενός ζυγού: η ενεργός τιμή των αρμονικών της τάσης του ως προς τη θεμελιώδη.')
    if res['skipped']:
        r.note('Δεν λύθηκαν οι τάξεις ' + ', '.join(str(h) for h in res['skipped']) + ': σε συμμετρικό δίκτυο είναι ομοπολικές και θέλουν το δίκτυο μηδενικής ακολουθίας.', 'info')
    if not res['filters']:
        r.note('Χωρίς τα συντονισμένα φίλτρα του δικτύου: η ροή φορτίου έτρεξε και αυτή χωρίς την άεργό τους.', 'info')
    if res['pulse'] == 6:
        r.note('Κάθε πηγή λογίστηκε πίσω από μετασχηματιστή αστέρα–αστέρα: οι αρμονικές δύο γεφυρών προστίθενται και στις τάξεις 5, 7, 17, 19.', 'info')
    if res['over']:
        r.note((f'{len(res["over"])} ζυγοί είναι' if len(res['over']) > 1 else 'Ένας ζυγός είναι') + ' πάνω από το όριο παραμόρφωσης τάσης του IEEE Std 519-2014 για την τάση του: '
               + ', '.join(res['over'][:30]) + (' …' if len(res['over']) > 30 else '') + '.', 'warning')
    else:
        r.note('Κανένας ζυγός δεν περνά το όριο παραμόρφωσης τάσης του IEEE Std 519-2014 για την τάση του.', 'good')
    picture(res, 'thd', 'voltage')
    r.heading('Παραμόρφωση τάσης ανά ζυγό')
    order = list(B)
    r.chart('bar', order, [{'name': 'THD', 'y': [B[b]['THD'] for b in order]}, {'name': 'όριο του ζυγού', 'y': [B[b]['limit_thd'] for b in order]}],
            'Ολική αρμονική παραμόρφωση της τάσης κάθε ζυγού και το όριό της', 'ζυγός', '%')
    mark = {i: 'warning' for i, b in enumerate(order) if B[b]['over']}
    r.table(['Ζυγός', 'U_n (kV)', '|V| θεμελιώδους (pu)', 'THD (%)', 'Όριο THD (%)', 'Μεγαλύτερη αρμονική', 'Τιμή της (%)', 'Όριο ανά αρμονική (%)'],
            [[b, B[b]['Un'] / 1e3, B[b]['V'], B[b]['THD'], B[b]['limit_thd'], f'{B[b]["worst"]}η', B[b]['worst_pct'], B[b]['limit']] for b in order], '', [None, 4, 5, 4, 3, None, 4, 3], mark,
            note='Όρια: IEEE Std 519-2014, Πίνακας 1, κατά την ονομαστική τάση του ζυγού.')
    at = [w] + ([sc['bus']] if sc and sc['bus'] != w else [])
    r.heading('Φάσμα της τάσης')
    r.chart('bar', [f'{h}η' for h in orders], [{'name': f'ζυγός {b}', 'y': [100 * B[b]['Vh'][h] / B[b]['V'] for h in orders]} for b in at],
            'Κάθε αρμονική της τάσης ως ποσοστό της θεμελιώδους', 'τάξη', '%')
    if sc:
        r.heading('Σάρωση συχνότητας')
        r.chart('line', sc['h'], [{'name': f'|Z| από τον ζυγό {sc["bus"]}', 'y': sc['Z']}], f'Η εμπέδηση που φαίνεται από τον ζυγό {sc["bus"]} ως προς την τάξη', 'τάξη αρμονικής', 'pu', table=False)
        pk = sorted(sc['peaks'], key=lambda q: -q[1])[:8]
        if pk:
            near = lambda h: min(orders, key=lambda o: abs(o - h))        # noqa: E731
            r.table(['Τάξη συντονισμού', '|Z| (pu)', 'Πλησιέστερη αρμονική των πηγών', 'Απόσταση (τάξεις)'], [[h, z, f'{near(h)}η', abs(near(h) - h)] for h, z in sorted(pk)],
                    'Παράλληλοι συντονισμοί (κορυφές της σάρωσης)', [4, 4, None, 3], note='Ένας συντονισμός κοντά σε τάξη που εγχέουν οι πηγές μεγαλώνει την αρμονική αυτή της τάσης.')
    r.heading('Πηγές αρμονικών')
    spec = {e['name']: e.get('spectrum') for e in net.elements if e['kind'] == 'load'}
    r.table(['Φορτίο', 'Ζυγός', 'Ρεύμα θεμελιώδους (pu)', 'Φάσμα', 'Πίσω από Y–Δ', 'Μεγαλύτερη αρμονική (pu)'],
            [[q['load'], q['bus'], q['I1'], SPECTRUM_TXT.get(spec.get(q['load']), 'δοσμένο') if isinstance(spec.get(q['load']), str) or spec.get(q['load']) is None else 'δοσμένο',
              'ναι' if q['delta'] else 'όχι', max(q['Ih'].values(), default=0.0)] for q in res['sources']], '', [None, None, 4, None, None, 4])
    br = sorted((q for q in res['branches'] if q['THD'] is not None), key=lambda q: -q['THD'])[:15]
    if br:
        r.heading('Κλάδοι με το πιο παραμορφωμένο ρεύμα')
        r.table(['Κλάδος', 'Από', 'Προς', 'Ρεύμα θεμελιώδους (pu)', 'THD ρεύματος (%)', 'Ενεργός τιμή (pu)', 'Μεγαλύτερη αρμονική'],
                [[q['name'], q['a'], q['b'], q['I1'], q['THD'], q['Irms'], f'{max(q["Ih"], key=q["Ih"].get)}η'] for q in br], '', [None, None, None, 4, 4, 4, None])


def _unbalanced(r, net, res, picture):
    """4.19.5: the three-phase load flow of a feeder: the voltage of every phase, the unbalance, the sections, the regulators, and
    the published profile where the feeder carries one."""
    f = lambda x, d=2: '—' if x is None else f'{x:.{d}f}'.replace('.', ',')             # noqa: E731
    if not res['converged']:
        r.note('Η ροή φορτίου δεν συνέκλινε: ' + res['message'] + '.', 'critical')
        return
    B, w, inp, pub = res['buses'], res['worst'], res['input'], res.get('published') or {}
    names = [b for b, d in B.items() if not d['made']]
    r.facts([('Σύγκλιση', True), ('Επαναλήψεις', int(res['iterations'])), ('Κόμβοι φάσης', int(res['nodes'])), ('Ζυγοί', len(names)),
             ('Χαμηλότερη τάση φάσης (pu)', round(w['low']['V'], 4)), ('στον ζυγό, φάση', f'{w["low"]["bus"]}, {w["low"]["phase"]}'), ('Ψηλότερη τάση φάσης (pu)', round(w['high']['V'], 4)),
             ('στον ζυγό, φάση ', f'{w["high"]["bus"]}, {w["high"]["phase"]}'), ('Μεγαλύτερη ασυμμετρία τάσης (%)', None if w['unbalance']['value'] is None else round(w['unbalance']['value'], 3)),
             ('στον ζυγό', w['unbalance']['bus']), ('Ισχύς εισόδου (kW)', round(inp['kW_total'], 2)), ('Φορτίο (kW)', round(res['load_kW'], 2)), ('Απώλειες (kW)', round(res['losses_kW'], 3)),
             ('Πυκνωτές (kvar)', round(res['cap_kvar'], 2)), ('Χρόνος (ms)', round(res['time'] * 1e3, 1))])
    r.text('Κάθε φάση κάθε κόμβου λύνεται χωριστά. Οι γραμμές δεν είναι αντιμετατεθειμένες και τα φορτία δεν είναι ίσα στις τρεις φάσεις, άρα οι τάσεις των φάσεων διαφέρουν, '
           'και μια φάση μπορεί να έχει ψηλότερη τάση στο τέλος του τροφοδότη από ό,τι στην αρχή του, από τη σύζευξη με τις άλλες δύο. Ασυμμετρία τάσης: η αρνητική ακολουθία των τριών '
           'τάσεων ως προς τη θετική.')
    if res['spread'] == 'middle':
        r.note('Τα κατανεμημένα φορτία μπήκαν ολόκληρα στο μέσο του τμήματός τους (όχι με το ακριβές ισοδύναμο δύο τρίτα στο ένα τέταρτο, ένα τρίτο στο άκρο).', 'info')
    from . import unbalanced as U
    cmp = U.against(res, pub)
    if cmp:
        r.note(f'Απέναντι στα δημοσιευμένα αποτελέσματα του τροφοδότη ({cmp["values"]} τάσεις φάσης): μέγιστη διαφορά {f(cmp["dV"], 5)} pu και {f(cmp["dangle"], 3)}°'
               + (f'· απώλειες {f(res["losses_kW"], 3)} kW, δημοσιευμένες {f(cmp["losses_kW"], 3)} kW' if cmp.get('losses_kW') is not None else '') + '. Οι δημοσιευμένες τάσεις έχουν τέσσερα δεκαδικά.',
               'good' if cmp['dV'] < 5e-4 else 'warning')
    elif pub.get('taps'):
        r.note('Τα δημοσιευμένα αποτελέσματα του τροφοδότη είναι για τις λήψεις ' + ', '.join(f'{p} {t}' for p, t in pub['taps'].items()) + ' του ρυθμιστή του: με άλλες λήψεις είναι άλλο σημείο λειτουργίας και δεν συγκρίνονται.', 'info')
    picture(res, 'unbalance', 'voltage')
    r.heading('Τάση ανά φάση')
    r.chart('dot', names, [{'name': f'φάση {p}', 'y': [B[b]['phases'][p]['V'] if p in B[b]['phases'] else None for b in names]} for p in 'abc'],
            'Μέτρο της τάσης κάθε φάσης σε κάθε ζυγό (κενό: ο ζυγός δεν έχει τη φάση)', 'ζυγός', 'pu', limits=[{'value': 0.95, 'label': '0,95 pu', 'status': 'warning'}, {'value': 1.05, 'label': '1,05 pu', 'status': 'warning'}])
    cols = ['Ζυγός', 'kV', '|V_a| (pu)', '∠a (°)', '|V_b| (pu)', '∠b (°)', '|V_c| (pu)', '∠c (°)', 'Ασυμμετρία (%)']
    rows = []
    for b in names:
        d = B[b]
        rows.append([b, d['kV']] + [x for p in 'abc' for x in ((d['phases'][p]['V'], d['phases'][p]['angle']) if p in d['phases'] else (None, None))] + [d.get('unbalance')])
    r.table(cols, rows, '', [None, 3, 5, 4, 5, 4, 5, 4, 3], {i: 'warning' for i, b in enumerate(names) if B[b]['Vmin'] < 0.95 or B[b]['Vmax'] > 1.05},
            note='Τάσεις φάσης προς ουδέτερο, ως προς την ονομαστική του ζυγού. Η ασυμμετρία δίνεται στους ζυγούς τριών φάσεων.')
    if cmp:
        r.heading('Απέναντι στη δημοσίευση', 3)
        prow = []
        for b, vals in pub['V'].items():
            if b not in B:
                continue
            for p, q in zip('abc', vals):
                if q and p in B[b]['phases']:
                    x = B[b]['phases'][p]
                    prow.append([b, p, x['V'], q[0], x['V'] - q[0], x['angle'], q[1], x['angle'] - q[1]])
        r.table(['Ζυγός', 'Φάση', '|V| εδώ (pu)', '|V| δημοσίευση (pu)', 'Διαφορά (pu)', 'Γωνία εδώ (°)', 'Γωνία δημοσίευση (°)', 'Διαφορά (°)'], prow, '', [None, None, 5, 5, 2, 4, 5, 2])
    if res['taps']:
        r.heading('Ρυθμιστές τάσης')
        how = {'given': 'οι λήψεις είναι δοσμένες', 'control': 'οι λήψεις βρέθηκαν από τον αντισταθμιστή πτώσης γραμμής, μία λήψη τη φορά από την ουδέτερη θέση', 'neutral': 'όλες οι λήψεις στο μηδέν'}[res['regulators']]
        band = res.get('band') or {}
        rows = [[k, p, t, 1 + 0.00625 * t, (res['relay'].get(k) or {}).get(p), ' – '.join(f(x, 1) for x in band[k]) if k in band else None] for k, tp in res['taps'].items() for p, t in tp.items()]
        out = {i: 'warning' for i, q in enumerate(rows) if q[4] is not None and q[0] in band and not band[q[0]][0] <= q[4] <= band[q[0]][1]}
        r.table(['Ρυθμιστής', 'Φάση', 'Λήψη', 'Λόγος', 'Τάση ρελέ (V)', 'Ζώνη (V)'], rows, how[0].upper() + how[1:], [None, None, None, 5, 5, None], out,
                note='Κάθε λήψη είναι 0,625 %. Το ρελέ βλέπει τη ρυθμιζόμενη τάση (στη βάση των 120 V) μείον την πτώση του αντισταθμιστή· ο ρυθμιστής κινείται όσο η τάση αυτή είναι έξω από τη ζώνη του. '
                     'Μέσα στη ζώνη χωρούν συνήθως δύο ή τρεις θέσεις λήψης: ποια βγαίνει εξαρτάται από πού ξεκίνησε ο ρυθμιστής.')
        if not res.get('settled', True):
            r.note('Οι λήψεις δεν ισορρόπησαν: η ζώνη ενός ρυθμιστή είναι στενότερη από την τάση μιας λήψης και ο ρυθμιστής ταλαντεύεται ανάμεσα σε δύο θέσεις.', 'warning')
    r.heading('Είσοδος ανά φάση')
    ph = list(inp['kW'])
    r.table(['Φάση', 'kW', 'kvar', 'A'], [[p, inp['kW'][p], inp['kvar'][p], inp['A'][p]] for p in ph] + [['σύνολο', inp['kW_total'], inp['kvar_total'], None]], '', [None, 6, 6, 5])
    r.heading('Τμήματα')
    srow = []
    for s in res['sections']:
        srow.append([s['name'], {'line': 'γραμμή', 'switch': 'διακόπτης', 'transformer': 'μετασχηματιστής', 'regulator': 'ρυθμιστής'}[s['kind']], s['a'], s['b']]
                    + [s['I'].get(p) for p in 'abc'] + [s['loss']] + [s['loss_kW'].get(p) for p in 'abc'])
    r.table(['Τμήμα', 'Είδος', 'Από', 'Προς', 'I_a (A)', 'I_b (A)', 'I_c (A)', 'Απώλειες (kW)', 'φάση a', 'φάση b', 'φάση c'], srow, '', [None, None, None, None, 5, 5, 5, 4, 4, 4, 4],
            note='Οι απώλειες ανά φάση είναι ό,τι μπαίνει στη φάση μείον ό,τι βγαίνει από αυτήν: μια φάση μπορεί να βγάζει αρνητικό αριθμό, γιατί παίρνει ισχύ από τις άλλες μέσω της σύζευξης. Το άθροισμα είναι οι απώλειες του τμήματος.')
    r.heading('Φορτία και πυκνωτές')
    r.table(['Φορτίο', 'Ζυγός', 'Ανάμεσα', 'Μοντέλο', 'kW', 'kvar', 'A'], [[q['name'], q['bus'], q['where'], {'PQ': 'σταθερή ισχύς', 'I': 'σταθερό ρεύμα', 'Z': 'σταθερή εμπέδηση'}[q['model']], q['kW'], q['kvar'], q['A']]
                                                                       for q in res['loads']], '', [None, None, None, None, 5, 5, 5])
    if res['capacitors']:
        r.table(['Πυκνωτής', 'Ζυγός', 'Φάση', 'kvar'], [[q['name'], q['bus'], q['phase'], q['kvar']] for q in res['capacitors']], '', [None, None, None, 5])


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
