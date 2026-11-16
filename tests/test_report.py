"""Reports and network studies (4.19.1, ROADMAP §68 point 6, pcl/report.py and pcl/study.py): the report object (sections,
its forms as data, HTML in one file, Markdown), the reports of the network studies against the results they are made of,
the studies as data for the local server with their errors, and the two tutorials of the app without a browser
(tests/js/study_cases.js): the operating point of the optimal power flow that tutorials.js carries against pcl.network, and
the EMT of the drawing against the load flow and against the optimal dispatch.

Reference values that do not come from the code under test: the AC optimal costs of case9 and case30 (Coffrin, Gordon & Scott,
«NESTA, the NICTA Energy System Test Case Archive», arXiv:1411.0359, Table 1), and the loads of the 9-bus case."""
import copy
import json
import math
import re
import shutil
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from http.server import ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from pcl import network as N
from pcl import report as RP
from pcl import study as S
from pcl.report import Report, ReportError, network_report, num

ROOT = Path(__file__).resolve().parents[1]
MW = 1e6
PUBLISHED = {'ieee9': 5296.69, 'case30': 576.89}
VOID = {'meta', 'br', 'hr', 'img', 'input', 'link'}


class Balance(HTMLParser):
    """Every element that opens also closes, in order; counts of the tags."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.count, self.bad, self.attrs = [], {}, [], []

    def handle_starttag(self, tag, attrs):
        self.count[tag] = self.count.get(tag, 0) + 1
        self.attrs += [(tag, k, v) for k, v in attrs]
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.count[tag] = self.count.get(tag, 0) + 1
        self.attrs += [(tag, k, v) for k, v in attrs]

    def handle_endtag(self, tag):
        if not self.stack or self.stack.pop() != tag:
            self.bad.append(tag)


def parsed(html):
    p = Balance()
    p.feed(html)
    p.close()
    return p


def embedded(html):
    """The report object that the HTML file carries inside it."""
    m = re.search(r'<script type="application/json" id="pcl-report">(.*?)</script>', html, re.S)
    assert '<' not in m.group(1)                    # nothing inside can end the element or open a comment
    return json.loads(m.group(1))


def sample():
    r = Report('Δοκιμή', 'όλα τα είδη ενότητας', meta={'Ζυγοί': 3, 'S βάσης (MVA)': 100.0})
    r.heading('Πρώτη').text('Μία παράγραφος.\n\nΚαι δεύτερη, με <b> και & μέσα.').note('Κάτι θέλει προσοχή', 'warning')
    r.facts({'Απώλειες (MW)': 13.393, 'Σύγκλιση': True, 'Επαναλήψεις': 3}, 'Σύνοψη')
    r.table(['Ζυγός', '|V| (pu)', 'P (MW)'], [['1', 1.06, 232.39], ['2', 1.045, None], ['3', 1.01, -94.2]], 'Ζυγοί', [None, 5, 4], {2: 'critical'}, 'μια σημείωση')
    r.heading('Γραφήματα', 3)
    r.chart('bar', ['br1', 'br2', 'br3'], [{'name': 'φόρτιση', 'y': [80.0, 120.0, None]}], 'Φόρτιση', 'Κλάδος', '%', [{'value': 100.0, 'label': 'ονομαστική', 'status': 'critical'}])
    r.chart('dot', ['1', '2', '3'], [{'name': '|V|', 'y': [1.06, 1.045, 1.01]}], 'Τάσεις', 'Ζυγός', 'pu', table=False)
    r.chart('line', [0.0, 0.5, 1.0, 1.5], [{'name': 'a', 'y': [0, 1, 4, 9]}, {'name': 'b', 'y': [0, -1, -2, -3]}], 'Δύο σειρές', 't (s)', 'pu', ymin=-4, ymax=10)
    return r.data('raw', {'x': [1, 2, 3], 'note': 'κλείνει </script> εδώ'})


class ReportObject(unittest.TestCase):
    def test_sections_and_forms_as_data(self):
        r = sample()
        self.assertEqual([s['kind'] for s in r.sections], ['heading', 'text', 'note', 'facts', 'table', 'heading', 'chart', 'chart', 'chart', 'data'])
        self.assertEqual(set(s['kind'] for s in r.sections), set(RP.KINDS))                      # every kind of section is in the sample
        d = r.to_dict()
        self.assertEqual((d['format'], d['version'], d['title'], d['lang']), ('pcl-report', 1, 'Δοκιμή', 'el'))
        json.dumps(d, allow_nan=False)
        # the object → data → object gives the same data, and so the same files
        r2 = Report.from_dict(json.loads(json.dumps(d)))
        self.assertEqual(r2.to_dict(), d)
        self.assertEqual(r2.html(), r.html())
        self.assertEqual(r2.markdown(), r.markdown())
        # every method that adds a section returns the report; extend appends the sections of another report
        a = Report('A').heading('x')
        self.assertIs(a.text('y'), a)
        self.assertEqual(len(a.extend(r).sections), 2 + len(r.sections))
        self.assertEqual(a.sections[2:], r.sections)
        self.assertEqual(Report('t').heading('h', 9).sections[0]['level'], 4)                  # levels 2 to 4 (1 is the title)
        self.assertEqual(Report('t').heading('h', 1).sections[0]['level'], 2)

    def test_files(self):
        r = sample()
        with tempfile.TemporaryDirectory() as d:
            for ext in ('html', 'md', 'json'):
                p = r.save(Path(d) / f'r.{ext}')
                self.assertTrue(p.is_file())
            self.assertEqual((Path(d) / 'r.html').read_text(encoding='utf-8'), r.html())
            self.assertEqual((Path(d) / 'r.md').read_text(encoding='utf-8'), r.markdown())
            self.assertEqual(Report.load(Path(d) / 'r.json').to_dict(), r.to_dict())
            with self.assertRaises(ReportError):
                r.save(Path(d) / 'r.docx')

    def test_input_checks(self):
        r = Report('t')
        for bad in (lambda: r.note('x', 'red'), lambda: r.table(['a', 'b'], [[1]]), lambda: r.table(['a', 'b'], [[1, 2]], digits=[3]),
                    lambda: r.chart('pie', ['a'], [{'y': [1]}]), lambda: r.chart('bar', ['a'], []),
                    lambda: r.chart('bar', ['a'], [{'y': [1]}] * (RP.SERIES + 1)), lambda: r.chart('bar', ['a', 'b'], [{'y': [1]}]),
                    lambda: Report.from_dict({'format': 'other'}), lambda: Report.from_dict([]),
                    lambda: Report.from_dict({'format': 'pcl-report', 'sections': [{'kind': 'video'}]})):
            with self.assertRaises(ReportError):
                bad()
        with self.assertRaises(TypeError):
            r.data('x', {1, 2})                                                                   # only what JSON can hold
        self.assertEqual(r.sections, [])                                                          # a refused section leaves nothing behind

    def test_numbers(self):
        # significant digits, thousands apart with a thin space, decimal comma in Greek, a true minus sign
        self.assertEqual(num(1234.5678), '1 235')
        self.assertEqual(num(1234.5678, 6), '1 234,57')
        self.assertEqual(num(1234.5678, 6, 'en'), '1 234.57')
        self.assertEqual(num(-3.0), '−3,000')
        self.assertEqual(num(-3.0, strip=True), '−3')
        self.assertEqual(num(2.5, 4, 'el', True), '2,5')
        self.assertEqual(num(0.000012345), '1,234e−5')
        self.assertEqual(num(1234567), '1 234 567')
        self.assertEqual(num(0.0), '0')
        self.assertEqual((num(None), num(float('nan')), num(float('inf'))), ('—', '—', '—'))
        self.assertEqual((num(True), num(False), num(True, lang='en')), ('ναι', 'όχι', 'yes'))
        self.assertEqual(num('br1'), 'br1')
        # the axis ticks: round steps (1, 2, 2,5, 5 × 10ⁿ) that cover the range
        self.assertEqual(RP._ticks(0, 10), [0, 2, 4, 6, 8, 10])
        self.assertEqual(RP._ticks(0.95, 1.07), [0.95, 0.975, 1.0, 1.025, 1.05, 1.075])
        self.assertEqual(RP._ticks(0, 120), [0, 25, 50, 75, 100, 125])
        for lo, hi in ((0, 1), (-3.3, 7.1), (1e-5, 3e-5), (5, 5), (0, 1e9)):
            t = RP._ticks(lo, hi)
            self.assertLessEqual(t[0], lo + 1e-12)
            self.assertGreaterEqual(t[-1], hi - 1e-9 * max(1.0, abs(hi)))
            self.assertLessEqual(len(t), 9)

    def test_html_is_one_file(self):
        r = sample()
        h = r.html()
        p = parsed(h)
        self.assertEqual((p.stack, p.bad), ([], []))                                             # every element closes
        # nothing is fetched: no stylesheet, image, frame or script from outside, no url() in the CSS
        self.assertEqual([c for c in ('link', 'img', 'iframe', 'object', 'embed') if p.count.get(c)], [])
        self.assertEqual([a for a in p.attrs if a[1] in ('src', 'href', 'srcset', 'action')], [])
        self.assertNotIn('http', h)
        self.assertNotIn('url(', h)
        self.assertNotIn('@import', h)
        self.assertEqual(p.count['script'], 2)                                                    # the data and the few lines that save them
        # the data of the report inside the file, also when a text holds «</script>»
        self.assertEqual(embedded(h), r.to_dict())
        self.assertEqual(h.count('</script>'), 2)
        # text is escaped
        self.assertIn('με &lt;b&gt; και &amp; μέσα', h)
        self.assertNotIn('<b> και', h)
        tricky = Report('t').text('<!-- <script> a comment that opens a script').data('d', {'s': '</script><script>alert(1)</script>'})
        self.assertEqual(embedded(tricky.html()), tricky.to_dict())
        self.assertEqual((parsed(tricky.html()).count['script'], tricky.html().count('<script')), (2, 2))
        # one drawing per chart, one table per table and per chart that keeps its numbers (the second chart does not)
        self.assertEqual(p.count['svg'], 3)
        self.assertEqual(p.count['table'], 1 + 2)
        self.assertEqual(h.count('data-dl="csv"'), 3)
        self.assertEqual(h.count('data-dl="json"'), 1)
        self.assertEqual(p.count['details'], 2)
        # light and dark from the system of the reader; print is light
        self.assertIn('prefers-color-scheme:dark', h)
        self.assertIn('@media print', h)
        for k, v in RP.LIGHT.items():
            self.assertIn(f'--{k}:{v};', h)
        self.assertIn(f'--surface:{RP.DARK["surface"]};', h)
        self.assertIn('<html lang="el">', h)
        self.assertIn('<title>Δοκιμή</title>', h)
        # a status is said with its word, not only with a colour
        self.assertIn('<b>Προσοχή:</b> Κάτι θέλει προσοχή', h)
        self.assertIn('<td class="st">Παραβίαση</td>', h)
        en = Report('T', lang='en').note('x', 'critical').html()
        self.assertIn('<b>Violation:</b> x', en)
        self.assertIn('<html lang="en">', en)

    def test_charts(self):
        r = sample()
        h = r.html()
        svgs = [ET.fromstring(s) for s in re.findall(r'<svg.*?</svg>', h, re.S)]                 # every drawing is well-formed XML
        bar, dot, line = svgs
        cls = lambda g, c: [e for e in g.iter() if e.get('class') == c]                          # noqa: E731
        # bars: one mark per value that exists, from the zero line, heights in proportion; the limit as a dashed line with its name
        marks = cls(bar, 'mark')
        self.assertEqual(len(marks), 2)
        axis = float(cls(bar, 'axis')[0].get('y1'))
        ys = [[float(q) for q in re.findall(r',([\d.]+)', m.get('d'))] for m in marks]
        tops = [min(q) for q in ys]
        self.assertTrue(all(abs(max(q) - axis) < 0.11 for q in ys))                               # every bar stands on the zero line
        self.assertAlmostEqual((axis - tops[1]) / (axis - tops[0]), 120 / 80, delta=0.01)
        self.assertEqual([t.text for t in cls(bar, 'limt')], ['ονομαστική 100'])
        lim = cls(bar, 'lim')[0]
        self.assertEqual(lim.get('stroke'), 'var(--critical)')
        self.assertAlmostEqual((axis - float(lim.get('y1'))) / (axis - tops[0]), 100 / 80, delta=0.01)
        self.assertIn('0', [t.text for t in cls(bar, 'tick')])
        self.assertEqual(marks[0].find('title').text, 'φόρτιση · br1: 80 %')                       # a tooltip on every mark
        widths = [float(x) for x in re.findall(r'H([\d.]+)', marks[0].get('d'))]
        self.assertLessEqual(widths[0] - float(re.match(r'M([\d.]+)', marks[0].get('d')).group(1)), RP.BAR)
        # points: a profile does not start at zero; one series → no legend
        self.assertEqual(len(cls(dot, 'pt')), 3)
        self.assertEqual(len(cls(dot, 'hit')), 3)
        self.assertNotIn('0', [t.text for t in cls(dot, 'tick')])
        self.assertEqual(cls(dot, 'leg'), [])
        self.assertEqual(cls(dot, 'ln'), [])
        # lines: one polyline per series, a legend with two series, the asked range of the axis
        self.assertEqual(len(cls(line, 'ln')), 2)
        self.assertEqual([t.text for t in cls(line, 'leg')], ['a', 'b'])
        self.assertEqual([e.get('stroke') for e in cls(line, 'ln')], ['var(--s1)', 'var(--s2)'])
        yt = [float(t.text.replace('−', '-').replace(',', '.')) for t in cls(line, 'tick') if t.get('text-anchor') == 'end']
        self.assertLessEqual(min(yt), -4)
        self.assertGreaterEqual(max(yt), 10)
        self.assertEqual(len(cls(line, 'hit')), 8)
        # an empty chart and a chart of one equal value still draw
        e = Report('t').chart('dot', [], [{'name': 'v', 'y': []}]).chart('bar', ['a', 'b'], [{'name': 'v', 'y': [0.0, 0.0]}]).chart('line', [1.0], [{'y': [None]}])
        for s in re.findall(r'<svg.*?</svg>', e.html(), re.S):
            ET.fromstring(s)

    def test_markdown(self):
        md = sample().markdown()
        L = md.split('\n')
        self.assertEqual(L[0], '# Δοκιμή')
        self.assertIn('## Πρώτη', L)
        self.assertIn('### Γραφήματα', L)
        self.assertIn('> **Προσοχή:** Κάτι θέλει προσοχή', L)
        self.assertIn('- Απώλειες (MW): 13,393', L)
        self.assertIn('- Σύγκλιση: ναι', L)
        self.assertIn('| Ζυγός | |V| (pu) | P (MW) |', L)
        self.assertIn('| 1 | 1,0600 | 232,4 |', L)
        self.assertIn('| 2 | 1,0450 | — |', L)
        self.assertIn('| 3 | 1,0100 | −94,20 |', L)
        # a chart as its table, with its limits under it
        self.assertIn('| Κλάδος | φόρτιση (%) |', L)
        self.assertIn('| br2 | 120,00 |', L)
        self.assertIn('- ονομαστική: 100,00', L)
        self.assertIn('| t (s) | a (pu) | b (pu) |', L)
        self.assertEqual(sum(q.startswith('|---') for q in L), 4)                                 # one table and three charts
        self.assertNotIn('<', md.replace('<b>', ''))                                              # no markup of its own


def facts(r):
    return {k: v for s in r.sections if s['kind'] == 'facts' for k, v in s['pairs']}


def tables(r):
    return {s['title']: s for s in r.sections if s['kind'] == 'table'}


def headings(r):
    return [s['text'] for s in r.sections if s['kind'] == 'heading']


class NetworkReports(unittest.TestCase):
    def check_file(self, r):
        h = r.html()
        p = parsed(h)
        self.assertEqual((p.stack, p.bad), ([], []))
        self.assertNotIn('http', h)
        self.assertEqual(embedded(h), json.loads(json.dumps(r.to_dict())))
        self.assertEqual(p.count['svg'], sum(s['kind'] == 'chart' for s in r.sections))
        for s in re.findall(r'<svg.*?</svg>', h, re.S):
            ET.fromstring(s)
        self.assertEqual(Report.from_dict(json.loads(json.dumps(r.to_dict()))).html(), h)
        self.assertEqual(r.sections[-1], {'kind': 'data', 'name': 'study', 'obj': r.sections[-1]['obj']})
        return h

    def test_load_flow(self):
        for case in ('ieee14', 'ieee118', 'case33bw'):
            net = N.case_data(case)
            res = net.power_flow()
            r = net.report('pf', res)
            self.check_file(r)
            self.assertEqual((r.title, r.subtitle), ('Ροή φορτίου', net.name))
            self.assertEqual(headings(r), ['Η επιλογή του engine', 'Τάσεις των ζυγών', 'Κλάδοι'])
            self.assertEqual(r.meta['Ζυγοί'], len(net.buses))
            f = facts(r)
            self.assertEqual((f['Σύγκλιση'], f['Επαναλήψεις']), (True, res['iterations']))
            self.assertAlmostEqual(f['Απώλειες (MW)'], res['losses'] / MW, places=3)
            # the balance of the report closes: production = load + losses (the shunts of the buses are not in these three)
            if case != 'ieee118':
                self.assertAlmostEqual(f['Παραγωγή P (MW)'], f['Φορτίο P (MW)'] + f['Απώλειες (MW)'], delta=0.02)
            # the text of the choice is the reason that the engine gave
            self.assertEqual(r.sections[1]['text'].lower().rstrip('.'), res['advice']['why'].lower())
            t = tables(r)
            self.assertEqual([q[0] for q in t['Ζυγοί']['rows']], list(net.buses))
            for row in t['Ζυγοί']['rows']:
                b = res['buses'][row[0]]
                self.assertEqual(row[1:], [res['types'][row[0]], b['V'], b['angle'], b['P'] / MW, b['Q'] / MW, b['Pload'] / MW, b['Qload'] / MW])
            self.assertEqual(len(t['Ροές']['rows']), len(res['branches']))
            q = res['branches'][0]
            self.assertEqual(t['Ροές']['rows'][0][:5], [q['name'], q['a'], q['b'], q['Pa'] / MW, q['Qa'] / MW])
            ch = [s for s in r.sections if s['kind'] == 'chart']
            self.assertEqual((ch[0]['chart'], ch[0]['x'], ch[0]['series'][0]['y']), ('dot', list(net.buses), [res['buses'][b]['V'] for b in net.buses]))
            self.assertEqual((ch[1]['chart'], len(ch[1]['x'])), ('bar', min(20, len(res['branches']))))
            self.assertEqual(ch[1]['series'][0]['y'], sorted(ch[1]['series'][0]['y'], reverse=True))
        # the limits of the voltage, where the network has them, as lines of the chart and as marked rows
        net = N.case_data('case30')
        r = net.report('pf')
        lim = next(s for s in r.sections if s['kind'] == 'chart')['limits']
        self.assertEqual([(q['label'], q['value']) for q in lim], [('όριο V max', 1.1), ('όριο V min', 0.95)])
        for b in net.buses.values():
            b['Vmax'] = 0.99
        r = net.report('pf')
        V = [q[2] for q in tables(r)['Ζυγοί']['rows']]
        self.assertEqual(sorted(int(k) for k in tables(r)['Ζυγοί']['mark']), [i for i, v in enumerate(V) if v > 0.99 + 1e-6])
        self.assertIn('Προσοχή', r.html())
        # the same report without a result (the study runs inside) and through network_report
        net = N.case_data('ieee14')
        a, b = net.report('pf', method='fdxb'), network_report(net, 'pf', net.power_flow(method='fdxb'))
        self.assertEqual(facts(a)['Μέθοδος που έτρεξε'], facts(b)['Μέθοδος που έτρεξε'])
        self.assertIn('fast-decoupled', facts(a)['Μέθοδος που έτρεξε'])
        self.assertEqual(tables(a)['Ζυγοί']['rows'], tables(b)['Ζυγοί']['rows'])

    def test_a_result_that_did_not_converge_says_so(self):
        net = N.case_data('ieee14')
        res = dict(net.power_flow(), converged=False)
        r = net.report('pf', res)
        self.assertEqual([(s['status'], s['text'][:27]) for s in r.sections if s['kind'] == 'note'], [('critical', 'Η ροή φορτίου δεν συνέκλινε')])
        self.assertIs(facts(r)['Σύγκλιση'], False)
        res = dict(net.opf('ac'), converged=False, message='stalled')
        r = net.report('opf', res)
        n = [s for s in r.sections if s['kind'] == 'note'][0]
        self.assertEqual(n['status'], 'critical')
        self.assertIn('stalled', n['text'])

    def test_contingencies(self):
        net = N.case_data('ieee14')
        for study, kind in (('n1', 'ac'), ('n1dc', 'dc')):
            res = net.contingency(kind)
            r = net.report(study, res)
            self.check_file(r)
            self.assertEqual(headings(r), ['Η επιλογή του engine', 'Οι βαρύτερες διαταραχές'])
            f = facts(r)
            self.assertEqual((f['Διαταραχές'], f['Λύθηκαν'], f['Χωρίζουν το δίκτυο'], f['Δεν συγκλίνουν'], f['Χειρότερη διαταραχή']), (20, 19, 1, 0, res['worst']))
            self.assertEqual('Στους παράγοντες της βάσης' in f, kind == 'ac')
            t = tables(r)['Όλες οι διαταραχές']
            self.assertEqual([q[0] for q in t['rows']], [o['name'] for o in res['outages']])
            self.assertEqual(len(t['columns']), 7 if kind == 'ac' else 5)
            i = next(i for i, o in enumerate(res['outages']) if o['island'])
            self.assertEqual((t['rows'][i][:3], t['mark'][str(i)]), (['br14', 'χωρίζει το δίκτυο', '—'], 'warning'))
            w = next(o for o in res['outages'] if o['name'] == res['worst'])
            self.assertEqual(t['rows'][res['outages'].index(w)][2:4], [w['branch'], w['Smax'] / MW])
            ch = next(s for s in r.sections if s['kind'] == 'chart')
            self.assertEqual((ch['x'][0], ch['ylabel'], ch['limits']), (res['worst'], 'MVA', []))            # no ratings in this file: flows in MVA
            self.assertEqual(ch['series'][0]['y'][0], w['Smax'] / MW)
            self.assertEqual([s['status'] for s in r.sections if s['kind'] == 'note'], ['warning'])
        # with ratings: loading in % against the rating, the overloads marked
        net = N.case_data('case30')
        res = net.contingency('ac')
        r = net.report('n1', res)
        ch = next(s for s in r.sections if s['kind'] == 'chart')
        self.assertEqual((ch['ylabel'], ch['limits'][0]['value'], ch['limits'][0]['status']), ('%', 100.0, 'critical'))
        over = [i for i, o in enumerate(res['outages']) if o['converged'] and o['overloads']]
        self.assertGreater(len(over), 0)
        t = tables(r)['Όλες οι διαταραχές']
        self.assertEqual(sorted(int(k) for k, v in t['mark'].items() if v == 'critical'), over)
        self.assertEqual(facts(r)['Με υπερφόρτιση'], len(over))
        self.assertGreater(max(ch['series'][0]['y']), 100.0)
        # a radial network: the loss of any branch separates it, and the report says it instead of a ranking
        net = N.case_data('case33bw')
        r = net.report('n1')
        f = facts(r)
        self.assertEqual((f['Διαταραχές'], f['Λύθηκαν'], f['Χωρίζουν το δίκτυο'], f['Χειρότερη διαταραχή']), (32, 0, 32, '—'))
        self.check_file(r)

    def test_optimal_power_flow(self):
        for case, study, kind in (('case30', 'opf', 'ac'), ('ieee9', 'opf', 'ac'), ('case30', 'dcopf', 'dc')):
            net = N.case_data(case)
            res = net.opf(kind)
            r = net.report(study, res)
            self.check_file(r)
            f = facts(r)
            self.assertEqual(f['Κόστος (ανά ώρα)'], round(res['cost'], 2))
            if kind == 'ac':
                self.assertAlmostEqual(f['Κόστος (ανά ώρα)'], PUBLISHED[case], delta=0.011)            # the published optimum, to its two decimals
            else:
                self.assertEqual(f['Απώλειες (MW)'], 0.0)                                             # the DC network has no losses
                self.assertLess(f['Κόστος (ανά ώρα)'], PUBLISHED[case])
            self.assertEqual((f['Σύγκλιση'], f['Περιορισμοί που δεσμεύουν'], f['Όρια ροής στο πρόβλημα']), (True, len(res['binding']), res['flow_limits']))
            self.assertEqual(headings(r), ['Η επιλογή του engine', 'Κατανομή της παραγωγής', 'Οριακές τιμές'] + (['Περιορισμοί που δεσμεύουν'] if res['binding'] else []) + ['Κλάδοι'])
            t = tables(r)
            src = t['Πηγές']
            self.assertEqual([q[:4] for q in src['rows']], [[s['name'], s['bus'], s['P'] / MW, s['Q'] / MW] for s in res['sources']])
            self.assertAlmostEqual(sum(q[4] for q in src['rows']), res['cost'], delta=1e-6 * res['cost'])   # the costs of the sources add up to the cost
            # a multiplier is shown only where its limit binds; those sources are marked
            on = {(b['kind'], b['name']) for b in res['binding']}
            for i, q in enumerate(src['rows']):
                hit = [k for k in ('Pmax', 'Pmin', 'Qmax', 'Qmin') if (k, q[0]) in on]
                self.assertEqual([k for k, v in zip(('Pmax', 'Pmin', 'Qmax', 'Qmin'), q[5:9]) if v != 0.0], hit)
                self.assertEqual(str(i) in src['mark'], bool(hit))
            self.assertEqual([q[3] for q in t['Ζυγοί']['rows']], [res['buses'][b]['lmp'] for b in net.buses])
            ch = [s for s in r.sections if s['kind'] == 'chart']
            self.assertEqual(ch[0]['series'][0]['y'], [s['P'] / MW for s in res['sources']])
            self.assertEqual(ch[1]['series'][0]['y'], [res['buses'][b]['lmp'] for b in net.buses])
            if res['binding']:
                self.assertEqual(len(t['']['rows']), len(res['binding']))
        # the nine buses of the drawing: the voltages that sit on their limit of 1,1 pu are in the table of the binding limits
        r = N.ieee9().report('opf')
        self.assertEqual({(q[0], q[1]) for q in tables(r)['']['rows']}, {('|V| στο μέγιστο', '1')} | {(q[0], q[1]) for q in tables(r)['']['rows'] if q[1] != '1'})
        with self.assertRaises(ReportError):
            N.ieee9().report('harmonics')


class Studies(unittest.TestCase):
    def test_every_study_as_data(self):
        for study in S.STUDIES:
            q = S.run({'case': 'ieee14', 'study': study})
            json.dumps(q, allow_nan=False)                                                        # plain JSON: no NumPy, no NaN
            self.assertEqual((q['study'], q['network']), (study, {'name': 'IEEE 14-bus test case', 'case': 'ieee14', 'buses': 14, 'branches': 20}))
            self.assertFalse([k for k in q['result'] if k.startswith('_')])                       # the private arrays of the solver stay inside
        self.assertEqual(S.run({'case': 'ieee14'})['study'], 'pf')                                # the study by default
        net = N.ieee14()
        lf = net.power_flow()
        q = S.run({'case': 'ieee14', 'study': 'pf'})
        s = q['summary']
        self.assertEqual((s['converged'], s['iterations'], s['method'], s['Vmin_bus'], s['Vmax_bus']), (True, lf['iterations'], lf['method'], '3', '8'))
        self.assertAlmostEqual(s['losses_MW'], lf['losses'] / MW, places=9)
        self.assertEqual(q['result']['buses']['5']['V'], lf['buses']['5']['V'])
        self.assertEqual(set(S.run({'case': 'ieee14', 'study': 'advice'})['result']), {'pf', 'n1', 'batch', 'opf', 'dcopf'})
        n1 = net.contingency('ac')
        s = S.run({'case': 'ieee14', 'study': 'n1'})['summary']
        self.assertEqual((s['outages'], s['solved'], s['islands'], s['failed'], s['worst'], s['overloads']), (20, 19, 1, 0, n1['worst'], 0))
        w = next(o for o in n1['outages'] if o['name'] == n1['worst'])
        self.assertAlmostEqual(s['worst_MVA'], w['Smax'] / MW, places=6)
        s = S.run({'case': 'ieee9', 'study': 'opf'})['summary']
        self.assertAlmostEqual(s['cost'], PUBLISHED['ieee9'], delta=0.011)
        self.assertEqual([q['name'] for q in s['sources']], ['G1', 'G2', 'G3'])
        self.assertLessEqual(s['lmp_min'], s['lmp_max'])
        self.assertAlmostEqual(sum(q['P_MW'] for q in s['sources']), 315.0 + s['losses_MW'], places=3)       # the loads of the case: 90 + 100 + 125 MW

    def test_options_and_networks(self):
        # only the options of the study pass, and an empty one is «not given»
        q = S.run({'case': 'ieee14', 'study': 'pf', 'options': {'method': 'fdxb', 'flow_limits': True, 'nonsense': 1, 'tol': ''}})
        self.assertEqual(q['summary']['method'], 'fdxb')
        self.assertEqual(S.run({'case': 'ieee14', 'study': 'pf', 'options': {'method': ''}})['summary']['method'], 'nr_dense')
        a = S.run({'case': 'case30', 'study': 'opf', 'options': {'flow_limits': False}})['summary']
        b = S.run({'case': 'case30', 'study': 'opf', 'options': {'flow_limits': True}})['summary']
        self.assertEqual((a['flow_limits'], b['flow_limits']), (0, 41))
        self.assertLess(a['cost'], b['cost'] - 1e-3)                                              # without the limits of the lines the optimum is cheaper
        # a network as data (pcl.network.to_dict) gives what its name gives
        d = N.to_dict(N.case_data('ieee30'))
        json.dumps(d)
        a, b = S.run({'network': d, 'study': 'pf'}), S.run({'case': 'ieee30', 'study': 'pf'})
        self.assertEqual({k: v['V'] for k, v in a['result']['buses'].items()}, {k: v['V'] for k, v in b['result']['buses'].items()})
        self.assertEqual((a['network']['case'], a['network']['buses']), (None, 30))
        self.assertEqual(S.report({'network': d, 'study': 'pf'})['name'], 'report_network_pf.html')

    def test_errors_have_a_message(self):
        for data, part in (({'study': 'pf'}, 'Δώσε case'), ({'case': 'nope'}, 'Δώσε case'), ({'case': 'ieee9', 'study': 'xx'}, 'study: ένα από'),
                           ({'network': 5}, 'pcl.network.to_dict'), ({'network': {}}, 'δεν διαβάζεται'),
                           ({'case': 'ieee9', 'study': 'pf', 'options': {'method': 'sweep'}}, 'PV')):       # the error of a solver, with its own words
            for f in (S.run, S.report):
                with self.assertRaises(S.StudyError) as e:
                    f(dict(data))
                self.assertIn(part, str(e.exception), data)
        for study in ('advice', 'dc'):                                                            # studies without a report
            with self.assertRaises(S.StudyError) as e:
                S.report({'case': 'ieee9', 'study': study})
            self.assertIn('Αναφορά για', str(e.exception))
        with self.assertRaises(S.StudyError) as e:
            S.report({'report': {'format': 'x'}})
        self.assertIn('δεν διαβάζεται', str(e.exception))
        old = S.MAX_BUSES
        try:
            S.MAX_BUSES = 10
            with self.assertRaises(S.StudyError):
                S.run({'case': 'ieee14'})
            self.assertEqual(S.run({'case': 'ieee9'})['network']['buses'], 9)
        finally:
            S.MAX_BUSES = old

    def test_report_of_a_study_and_of_a_composed_report(self):
        q = S.report({'case': 'case30', 'study': 'opf', 'title': 'Η μελέτη μου'})
        self.assertEqual((q['name'], sorted(q)), ('report_case30_opf.html', ['html', 'name', 'report', 'summary']))
        json.dumps(q, allow_nan=False)
        self.assertIn('<h1>Η μελέτη μου</h1>', q['html'])
        self.assertEqual(Report.from_dict(q['report']).html(), q['html'])                         # the object that comes with the file gives the file
        self.assertEqual(embedded(q['html']), q['report'])
        self.assertAlmostEqual(q['summary']['cost'], PUBLISHED['case30'], delta=0.011)
        self.assertEqual(S.report({'case': 'case30', 'study': 'opf'})['report']['title'], 'Βέλτιστη ροή φορτίου (AC)')
        # a report composed by the user goes through the same door
        r = sample()
        q = S.report({'report': r.to_dict()})
        self.assertEqual((q['html'], q['name'], q['report'], q['summary']), (r.html(), 'report.html', r.to_dict(), {}))

    def test_server_routes(self):
        from run import Handler
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        Thread(target=server.serve_forever, daemon=True).start()

        def post(action, data):
            req = Request(f'http://127.0.0.1:{server.server_port}/api/{action}', data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
            with urlopen(req) as r:
                return json.load(r)
        try:
            q = post('network_study', {'case': 'ieee118', 'study': 'pf', 'options': {'method': 'auto'}})
            self.assertEqual((q['summary']['converged'], q['summary']['method'], q['network']['buses']), (True, 'nr', 118))
            self.assertEqual(q['summary'], {**S.run({'case': 'ieee118', 'study': 'pf'})['summary'], 'time_ms': q['summary']['time_ms']})
            q = post('network_report', {'case': 'ieee9', 'study': 'opf', 'options': {'flow_limits': True}})
            self.assertEqual(q['name'], 'report_ieee9_opf.html')
            self.assertEqual(parsed(q['html']).stack, [])
            self.assertAlmostEqual(q['summary']['cost'], PUBLISHED['ieee9'], delta=0.011)
            for action, data in (('network_study', {'case': 'nope'}), ('network_report', {'case': 'ieee9', 'study': 'dc'})):
                with self.assertRaises(HTTPError) as e:
                    post(action, data)
                self.assertEqual(e.exception.code, 400)
                self.assertTrue(json.load(e.exception)['error'])
        finally:
            server.shutdown()
            server.server_close()


_js = {}


def tutorials():
    if not _js:
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'study_cases.js')], capture_output=True, text=True, timeout=600, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr)
        _js.update(json.loads(out.stdout))
    return _js


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class Tutorials(unittest.TestCase):
    Un = 345e3

    def test_the_cards_ask_only_what_the_engine_has(self):
        T = tutorials()
        for k, studies in (('pf', ('pf', 'n1', 'n1dc')), ('opf', ('opf', 'dcopf'))):
            opt = {o['k']: o for o in T[k]['options']}
            self.assertEqual(T[k]['group'], 'Ροή φορτίου και OPF (4.19.1)')
            self.assertEqual(set(opt['net']['values']) - set(N.CASES), set())                       # every network of the list exists in pcl.network
            self.assertEqual(opt['net']['def'], 'ieee9')
            self.assertEqual(tuple(opt['study' if k == 'pf' else 'kind']['values']), studies)
            self.assertEqual(set(studies) - set(S.STUDIES), set())
            # the request of the project (meta.study) is a request of pcl.study, for every network of the list
            for st in T[k]['studies']:
                self.assertEqual(sorted(st), ['net', 'options', 'study'])
                self.assertEqual(set(st['options']) - set(S.OPTIONS[st['study']]), set())
                q = S.run({'case': st['net'], 'study': st['study'], 'options': st['options']})
                self.assertTrue(q['summary']['converged'], st)
        from pcl import powerflow as PF
        methods = {o['k']: o for o in T['pf']['options']}['method']['values']
        self.assertEqual(methods[0], 'auto')
        self.assertEqual(set(methods) - {'auto'} - set(PF.TXT), set())                             # every method of the list is a method of the engine
        for m in methods:                                                                         # and gives the same voltages on a meshed network (the sweep refuses it)
            if m in ('sweep', 'dc'):
                continue
            a = S.run({'case': 'ieee14', 'study': 'pf', 'options': {'method': m}})
            self.assertTrue(a['summary']['converged'], m)
            self.assertAlmostEqual(a['result']['buses']['14']['V'], 1.0355, places=4, msg=m)        # bus 14 of the IEEE 14 case: 1,036 pu in its file
        self.assertTrue(S.run({'case': 'case33bw', 'study': 'pf', 'options': {'method': 'sweep'}})['summary']['converged'])
        # what the tasks of the tutorial say about the two feeders is what the engine says: the 69-bus one is deep (the sparse
        # Newton), the 33-bus one is small (the dense one)
        a33, a69 = N.case_data('case33bw').advice('pf'), N.case_data('case69').advice('pf')
        self.assertEqual((a33['method'], a69['method']), ('nr_dense', 'nr'))
        self.assertIn('μικρό δίκτυο', a33['why'])
        self.assertIn('βαθύ δίκτυο (69 ζυγοί σε 26 επίπεδα)', a69['why'])

    def test_operating_point_of_the_optimal_power_flow(self):
        """IEEE9_OPF of tutorials.js (the point from which the EMT of opf_study starts) is the AC optimal power flow of
        pcl.network.ieee9(): the six buses of the generators and of the loads, to the six decimals that the file keeps."""
        T = tutorials()
        tut = T['opfEmt']['meta']['lf']
        self.assertEqual((T['opfEmt']['meta']['emtFrom'], T['opf']['meta']['emtFrom']), ('opf', 'lf'))
        self.assertEqual(sorted(tut), ['1', '2', '3', '5', '7', '9'])
        res = N.ieee9().opf('ac', tol=1e-10)
        self.assertTrue(res['converged'])
        self.assertAlmostEqual(res['cost'], PUBLISHED['ieee9'], delta=0.011)
        for b, (V, ang) in tut.items():
            self.assertAlmostEqual(V, res['buses'][b]['V'], delta=1.5e-6, msg=b)
            self.assertAlmostEqual(ang, res['buses'][b]['angle'], delta=1.5e-6, msg=b)
        loose = N.ieee9().opf('ac')                                                               # at the tolerance of the card: the same point within 10⁻⁴ pu, 10⁻³ °
        for b, (V, ang) in tut.items():
            self.assertAlmostEqual(V, loose['buses'][b]['V'], delta=1e-4, msg=b)
            self.assertAlmostEqual(ang, loose['buses'][b]['angle'], delta=1e-3, msg=b)
        # without that choice both tutorials start from the load flow, the one of ieee9_emt
        lf = N.ieee9().power_flow()
        for k in ('pf', 'opf'):
            for b, (V, ang) in T[k]['meta']['lf'].items():
                self.assertAlmostEqual(V, lf['buses'][b]['V'], delta=1e-6, msg=b)
                self.assertAlmostEqual(ang, lf['buses'][b]['angle'], delta=1e-6, msg=b)

    def emt(self, run, res, P, Q=None):
        o = run['out']
        self.assertEqual(run['warn'], [])
        self.assertEqual(len(run['keys']), 10)                                                    # every channel exists
        for i, g in enumerate(('G1', 'G2', 'G3')):                                                # the powers of the generators, pu on 100 MVA
            self.assertAlmostEqual(o[f'Y:{g}:pe']['mean'], P[i], delta=1e-4, msg=g)
            self.assertLess(o[f'Y:{g}:pe']['amp'], 1e-6, g)                                       # and they do not move
            if Q:
                self.assertAlmostEqual(o[f'Y:{g}:qe']['mean'], Q[i], delta=5e-4, msg=g)
        # the instruments of the drawing against the same study: the voltage of buses 8 and 5 (phase to ground, peak), the current of
        # the line 8–7 at bus 8 and of the load of bus 5 (constant impedance equal to the load at that voltage: 90 MW, 30 Mvar)
        pk = self.Un * math.sqrt(2 / 3)
        V8, V5 = res['buses']['8']['V'], res['buses']['5']['V']
        self.assertAlmostEqual(o['Y:M87V']['amp'] / pk, V8, delta=2e-5)
        self.assertAlmostEqual(o['Y:M5V']['amp'] / pk, V5, delta=2e-5)
        br = next(q for q in res['branches'] if {q['a'], q['b']} == {'7', '8'})
        S8 = math.hypot(br['Pb'], br['Qb']) if br['b'] == '8' else math.hypot(br['Pa'], br['Qa'])
        self.assertAlmostEqual(o['Y:M87A']['amp'] / math.sqrt(2) / (S8 / (math.sqrt(3) * V8 * self.Un)), 1.0, delta=2e-4)
        self.assertAlmostEqual(o['Y:M5A']['amp'] / math.sqrt(2) / (math.hypot(90e6, 30e6) / (math.sqrt(3) * V5 * self.Un)), 1.0, delta=2e-4)
        for k in ('Y:M87A', 'Y:M87V', 'Y:M5A', 'Y:M5V'):
            self.assertLess(abs(o[k]['mean']), 1e-6 * o[k]['amp'], k)                             # no DC component: the start is the steady state

    def test_emt_of_the_drawing_holds_the_load_flow(self):
        """pf_study: the nine buses in EMT from their load flow, with the instruments: the generators give 0,7164, 1,63 and 0,85 pu."""
        T = tutorials()
        lf = N.ieee9().power_flow()
        P = [lf['buses'][b]['P'] / 100e6 for b in '123']
        for a, b in zip(P, (0.7164, 1.63, 0.85)):
            self.assertAlmostEqual(a, b, places=4)
        self.emt(T['pf'], lf, P, [lf['buses'][b]['Q'] / 100e6 for b in '123'])
        self.assertEqual(T['pf']['panes'][-2:], [['Y:M87A', 'Y:M5A'], ['Y:M87V', 'Y:M5V']])        # the instruments have their own panes of the scope
        self.assertEqual(T['pf']['meta']['study'], {'net': 'ieee9', 'study': 'pf', 'options': {'method': 'auto'}})

    def test_emt_of_the_drawing_holds_the_optimal_dispatch(self):
        """opf_study with «the EMT starts from the optimal dispatch»: the generators give the powers of the optimal power flow
        (0,898, 1,3432 and 0,9419 pu) and the instruments the voltages and currents of that point."""
        T = tutorials()
        res = N.ieee9().opf('ac', tol=1e-10)
        P = [s['P'] / 100e6 for s in res['sources']]
        for a, b in zip(P, (0.898, 1.3432, 0.9419)):
            self.assertAlmostEqual(a, b, places=4)
        self.emt(T['opfEmt'], res, P, [s['Q'] / 100e6 for s in res['sources']])
        self.assertEqual(T['opfEmt']['meta']['study'], {'net': 'ieee9', 'study': 'opf', 'options': {'flow_limits': True}})
        self.assertTrue(T['opfEmt']['meta']['noAF'])                                              # the card does not compare this point with the book
        # the loads are impedances at the voltage of the optimum, so the generators also cover the same losses
        self.assertAlmostEqual(sum(T['opfEmt']['out'][f'Y:G{i}:pe']['mean'] for i in (1, 2, 3)) * 100, 315.0 + res['losses'] / MW, delta=0.02)


if __name__ == '__main__':
    unittest.main(verbosity=2)
