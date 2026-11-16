"""Network files and changes of a network as data (4.19.4, ROADMAP §73, pcl/netfile.py): a network written as a file and read
back gives the same load flow, a file from outside is read with what it leaves out said, and a list of changes makes a changed
copy that every study, the picture and the report use. The files of the tests are written here from the networks of the
project: no file of a third party is read."""
import json
import unittest

import numpy as np

from pcl import netfile as F
from pcl import network as N
from pcl import study as S


def flow(net):
    r = net.power_flow()
    return np.array([[d['V'], d['angle']] for d in r['buses'].values()]), r['losses']


class Files(unittest.TestCase):
    def test_a_network_written_as_matpower_reads_back_as_itself(self):
        for c in N.CASES:
            net = N.case_data(c)
            text = F.write(net, 'matpower')
            back = F.read(text, c + '.m')
            self.assertEqual(back.name, c)
            self.assertEqual((len(back.buses), len(back.elements)), (len(net.buses), len(net.elements)), c)
            (a, la), (b, lb) = flow(net), flow(back)
            self.assertEqual(float(np.abs(a - b).max()), 0.0, c)                                    # every number reads back as the same number
            self.assertEqual(la, lb, c)
            self.assertEqual(F.summary(back)['warnings'], [], c)
        net, back = N.case_data('case30'), F.read(F.write(N.case_data('case30'), 'matpower'), 'case30.m')
        self.assertEqual(back.opf()['cost'], net.opf()['cost'])                                    # with its costs and its ratings

    def test_our_json(self):
        net = N.ieee9()
        back = F.read(F.write(net, 'pcl'), 'nine.json')
        self.assertEqual(N.to_dict(back), N.to_dict(net))
        self.assertEqual(F.sniff(F.write(net, 'pcl')), 'pcl')
        d = N.to_dict(N.case_data('ieee14'))
        d['name'] = ''
        self.assertEqual(F.read(json.dumps(d), 'my file.json').name, 'my file')                    # a network without a name takes the name of its file

    def test_the_format_is_found_from_the_text(self):
        m = F.write(N.case_data('ieee14'), 'matpower')
        self.assertEqual((F.sniff(m), F.sniff(m, 'x.txt'), F.sniff('  {"buses": {}}')), ('matpower', 'matpower', 'pcl'))
        self.assertEqual(F.sniff('0, 100.0, 33, 0, 0, 60.0 / a case', 'x.txt'), 'raw')
        self.assertEqual(F.sniff('anything', 'grid.raw'), 'raw')
        with self.assertRaises(F.FileError):
            F.sniff('one two three')

    def test_what_a_file_from_outside_may_carry(self):
        text = F.write(N.case_data('case30'), 'matpower')
        lines = text.split('\n')
        k = next(i for i, ln in enumerate(lines) if ln.startswith('\t26\t'))                      # bus 26 out of service: with its load and its branch
        f = lines[k].split('\t')
        f[2] = '4'
        lines[k] = '\t'.join(f)
        g0 = next(i for i, ln in enumerate(lines) if ln.startswith('mpc.gencost')) + 1
        lines[g0] = '\t1\t0\t0\t2\t0\t0\t80\t200;'                                                # a piecewise linear cost: not read
        out = '\n'.join(lines) + 'mpc.dcline = [\n\t1\t2\t1\t10\t9\t0\t0\t1\t1\t0\t100\t0\t0\t0\t0\t0\t0;\n];\n'
        net = F.read(out, 'outside.m')
        s = F.summary(net)
        self.assertEqual((s['buses'], s['branches'], s['loads'], s['generators']), (29, 40, 19, 6))
        self.assertEqual(len(s['warnings']), 3)
        self.assertIn('τύπος 4', s['warnings'][0])
        self.assertIn('χωρίς κόστος', s['warnings'][1])
        self.assertIn('DC', s['warnings'][2])
        self.assertEqual(s['costs'], 5)
        self.assertTrue(net.power_flow()['converged'])

    def test_what_is_not_a_network(self):
        for text, name, word in (('', 'a.m', 'κενό'), ('hello', 'a.m', 'mpc.bus'), ('{"a": 1}', 'a.json', 'buses'), ('{"a": ', 'a.json', 'JSON'),
                                 ('one two', 'a.dat', 'δεν αναγνωρίζεται'), (None, 'a.m', 'κενό')):
            with self.assertRaises(F.FileError) as e:
                F.read(text, name)
            self.assertIn(word, str(e.exception), (text, name))
        no_slack = F.write(N.case_data('ieee14'), 'matpower').replace('\t1\t3\t', '\t1\t1\t', 1)
        with self.assertRaises(F.FileError) as e:
            F.read(no_slack, 'a.m')
        self.assertIn('ζυγό ταλάντωσης', str(e.exception))
        net = N.Network()                                                                          # a network of lines in ohms is kept only by our JSON
        net.bus('A', 20e3, 'slack')
        net.bus('B', 20e3)
        net.feeder('A', Sk=500e6)
        net.line('A', 'B', R=0.1, X=0.3, length=5)
        net.load('B', 1e6, 0.2e6)
        with self.assertRaises(F.FileError) as e:
            F.write(net, 'matpower')
        self.assertIn('JSON', str(e.exception))
        back = F.read(F.write(net, 'pcl'), 'two.json')
        self.assertEqual(back.power_flow()['losses'], net.power_flow()['losses'])

    def test_the_summary(self):
        s = F.summary(N.case_data('case30'))
        self.assertEqual((s['buses'], s['branches'], s['generators'], s['loads'], s['shunts'], s['rated'], s['costs']), (30, 41, 6, 20, 2, 41, 6))
        self.assertAlmostEqual(s['load_MW'], 189.2, places=6)
        self.assertEqual(s['levels_kV'], [135.0])


class Changes(unittest.TestCase):
    def setUp(self):
        self.net = N.case_data('case30')

    def test_every_change_and_its_sentence(self):
        before = json.dumps(N.to_dict(self.net))
        net, done = F.apply(self.net, [{'op': 'load', 'bus': '8', 'P_MW': 45}, {'op': 'load', 'bus': '11', 'P_MW': 5, 'Q_Mvar': 1}, {'op': 'load', 'bus': '7', 'scale': 0.5},
                                       {'op': 'gen', 'bus': '2', 'P_MW': 70, 'V_pu': 1.02}, {'op': 'rating', 'branch': 'br10', 'rating_MVA': 40},
                                       {'op': 'rating', 'branch': 'br11', 'rating_MVA': None}, {'op': 'outage', 'element': 'br5'}])
        self.assertEqual(json.dumps(N.to_dict(self.net)), before)                                  # the network that was given is not changed
        self.assertEqual(len(done), 7)
        d = F.describe(net)
        self.assertEqual(d['load']['8'], [45.0, 45.0])                                             # without Q the power factor stays (30 MW and 30 Mvar before)
        self.assertEqual(d['load']['11'], [5.0, 1.0])                                              # a bus without a load gets one
        self.assertEqual(d['load']['7'], [11.4, 5.45])
        self.assertEqual(d['gen']['2'], [['G2', 70.0, 1.02, 0.0, 80.0, False]])
        self.assertEqual((d['rating']['br10'], d['rating']['br11']), (40.0, None))
        self.assertNotIn('br5', d['rating'])
        self.assertEqual(done[0], 'Φορτίο του ζυγού 8: 30 MW και 30 Mvar → 45 MW και 45 Mvar.')
        self.assertEqual(done[3], 'Γεννήτρια G2 (ζυγός 2): P 60,97 → 70 MW, V 1 → 1,02 pu.')
        self.assertEqual(done[4], 'Όριο του κλάδου br10: 32 MVA → 40 MVA.')
        self.assertEqual(done[5], 'Όριο του κλάδου br11: 65 MVA → χωρίς όριο.')
        self.assertEqual(done[6], 'Κλάδος br5 (2 – 5): εκτός λειτουργίας.')
        self.assertEqual(F.out_of_service([{'op': 'outage', 'element': 'br5'}, {'op': 'load', 'bus': '8', 'scale': 1}, {'op': 'outage', 'branch': 'br7'}]), ['br5', 'br7'])

    def test_a_later_change_of_the_same_thing_wins_and_no_change_is_no_copy(self):
        net, done = F.apply(self.net, [{'op': 'load', 'bus': '8', 'P_MW': 45}, {'op': 'load', 'bus': '8', 'P_MW': 10, 'Q_Mvar': 2}])
        self.assertEqual(F.describe(net)['load']['8'], [10.0, 2.0])
        self.assertIs(F.apply(self.net, [])[0], self.net)
        self.assertIs(F.apply(self.net, None)[0], self.net)

    def test_scale(self):
        net, done = F.apply(self.net, [{'op': 'scale', 'load': 1.1, 'gen': 1.1}])
        a, b = F.summary(self.net), F.summary(net)
        self.assertAlmostEqual(b['load_MW'], 1.1 * a['load_MW'], places=9)
        g0, g1 = F.describe(self.net)['gen'], F.describe(net)['gen']
        for bus in g0:
            for q0, q1 in zip(g0[bus], g1[bus]):
                self.assertAlmostEqual(q1[1], min(1.1 * q0[1], q0[4]), places=5)                   # up to the maximum of each generator
        self.assertIn('× 1,1', done[0])

    def test_a_generator_out_of_service(self):
        net, done = F.apply(self.net, [{'op': 'outage', 'element': 'G2'}])
        self.assertEqual(net.buses['2']['type'], 'PQ')                                             # nothing holds the voltage of its bus any more
        self.assertEqual(done, ['Γεννήτρια G2 (ζυγός 2): εκτός λειτουργίας.'])
        self.assertTrue(net.power_flow()['converged'])

    def test_what_is_refused(self):
        for edits, word in (([{'op': 'load', 'bus': '99', 'P_MW': 1}], 'ζυγός 99'), ([{'op': 'outage', 'element': 'G1'}], 'ζυγού ταλάντωσης'), ([{'op': 'gen', 'bus': '2'}], 'P_MW'),
                            ([{'op': 'paint'}], 'op'), ([{'op': 'rating', 'branch': 'zz', 'rating_MVA': 1}], 'κλάδος zz'), ([{'op': 'load', 'bus': '8', 'P_MW': 'a'}], 'αριθμός'),
                            ([{'op': 'load', 'bus': '8'}], 'λείπει'), ([{'op': 'gen', 'name': 'G9', 'P_MW': 1}], 'G9'), ([{'op': 'gen', 'bus': '2', 'V_pu': 3}], 'όρια'),
                            ([{'op': 'gen', 'bus': '2', 'Pmin_MW': 90}], 'Pmin'), ([{'op': 'scale'}], 'load ή gen'), ([{'op': 'outage', 'element': 'nothing'}], 'nothing'),
                            ('load', 'λίστα'), ([{'op': 'load', 'bus': '8', 'P_MW': float('nan')}], 'όρια')):
            with self.assertRaises(F.FileError) as e:
                F.apply(self.net, edits)
            self.assertIn(word, str(e.exception), edits)


class Studies(unittest.TestCase):
    EDITS = [{'op': 'load', 'bus': '8', 'P_MW': 45, 'Q_Mvar': 30}, {'op': 'outage', 'element': 'br10'}]

    def test_a_study_runs_on_the_changed_copy(self):
        a = S.run({'case': 'case30', 'study': 'pf'})
        b = S.run({'case': 'case30', 'study': 'pf', 'edits': self.EDITS})
        self.assertNotIn('edits', a['network'])
        self.assertEqual(len(b['network']['edits']), 2)
        self.assertEqual((a['network']['branches'], b['network']['branches']), (41, 40))
        net, _ = F.apply(N.case_data('case30'), self.EDITS)
        self.assertEqual(b['result']['losses'], net.power_flow()['losses'])                        # the same as the changes made in code
        self.assertLess(b['result']['buses']['8']['V'], a['result']['buses']['8']['V'] - 0.05)     # more load behind one branch less
        for study in ('n1', 'n1dc', 'opf', 'dcopf'):
            self.assertEqual(len(S.run({'case': 'case30', 'study': study, 'edits': self.EDITS})['network']['edits']), 2, study)
        with self.assertRaises(S.StudyError) as e:
            S.run({'case': 'case30', 'study': 'pf', 'edits': [{'op': 'outage', 'element': 'G1'}]})
        self.assertIn('ζυγού ταλάντωσης', str(e.exception))

    def test_the_picture_keeps_its_places(self):
        a = S.run({'case': 'case30', 'study': 'pf', 'view': 'only'})
        b = S.run({'case': 'case30', 'study': 'pf', 'view': 'only', 'edits': self.EDITS})
        self.assertEqual([(q['id'], q['x'], q['y']) for q in a['view']['buses']], [(q['id'], q['x'], q['y']) for q in b['view']['buses']])
        self.assertEqual([q['name'] for q in b['view']['branches'] if q.get('off')], ['br10'])     # out of service, still in the picture
        self.assertFalse(any(q.get('off') for q in a['view']['branches']))
        self.assertEqual(len(b['view']['branches']), 41)
        j = [q['name'] for q in b['view']['branches']].index('br10')
        flow_layer = next(q for q in b['layers'] if q['layer'] == 'flow')
        self.assertIsNone(flow_layer['branch_v'][j])                                               # and without a value
        self.assertEqual(b['edit']['load']['8'], [45.0, 30.0])                                     # what the panel of the bus shows next
        self.assertNotIn('br10', b['edit']['rating'])
        self.assertEqual(sorted(a['edit']), ['gen', 'load', 'rating'])

    def test_the_files_of_a_changed_network(self):
        q = {'case': 'case30', 'study': 'pf', 'edits': self.EDITS}
        svg = S.view({**q, 'format': 'svg'})
        self.assertEqual(svg['text'].count('stroke-dasharray'), 1)
        self.assertIn('br10: 6 – 8 · εκτός λειτουργίας', svg['text'])
        dxf = S.view({**q, 'format': 'dxf'})['text'].split('\n')
        self.assertEqual(sum(1 for a, b in zip(dxf, dxf[1:]) if a == '8' and b == 'OUT_OF_SERVICE'), 1)
        rep = S.report(q)
        self.assertIn('Αλλαγές στο δίκτυο πριν από τη μελέτη (2)', rep['html'])
        self.assertEqual(rep['report']['sections'][0]['kind'], 'note')
        self.assertNotIn('Αλλαγές στο δίκτυο', S.report({'case': 'case30', 'study': 'pf'})['html'])
        for fmt, ext in (('pcl', '.json'), ('matpower', '.m')):
            f = S.save_file({**q, 'format': fmt})
            self.assertEqual(f['name'], 'case30' + ext)
            back = F.read(f['text'], f['name'])
            self.assertEqual(F.describe(back)['load']['8'], [45.0, 30.0])                          # the file carries the changes
            self.assertEqual(sum(e['kind'] == 'branch' for e in back.elements), 40)
        with self.assertRaises(S.StudyError):
            S.save_file({'case': 'case30', 'format': 'xls'})

    def test_a_network_from_a_file_through_the_requests(self):
        o = S.open_file({'name': 'my grid.m', 'text': F.write(N.case_data('ieee118'), 'matpower')})
        self.assertEqual((o['summary']['name'], o['summary']['buses'], o['summary']['branches']), ('my grid', 118, 186))
        json.dumps(o)                                                                              # plain data, as the server sends it
        r = S.run({'network': o['network'], 'study': 'n1dc', 'view': 'only', 'edits': [{'op': 'outage', 'element': 'br3'}]})
        self.assertEqual((r['network']['name'], r['network']['case'], r['layer']), ('my grid', None, 'n1'))
        self.assertEqual(S.view({'network': o['network'], 'study': 'pf', 'format': 'dxf'})['name'], 'network_my_grid_pf.dxf')
        self.assertEqual(S.report({'network': o['network'], 'study': 'pf'})['name'], 'report_my_grid_pf.html')
        for bad in ({'name': 'a.m', 'text': 'nothing'}, {'name': 'a.m'}, {'name': 'a.json', 'text': '{}'}):
            with self.assertRaises(S.StudyError):
                S.open_file(bad)

    def test_the_actions_of_the_server(self):
        import run
        for a in ('network_open', 'network_save', 'network_study', 'network_report', 'network_view'):
            self.assertIn(a, run.ACTIONS)
        o = run.ACTIONS['network_open']({'name': 'x.m', 'text': F.write(N.case_data('ieee14'), 'matpower')})
        self.assertEqual(o['summary']['buses'], 14)
        with self.assertRaises(run.InputError):
            run.ACTIONS['network_open']({'name': 'x.m', 'text': 'nothing'})
        with self.assertRaises(run.InputError):
            run.ACTIONS['network_study']({'case': 'ieee14', 'study': 'pf', 'edits': [{'op': 'load', 'bus': 'none', 'P_MW': 1}]})


if __name__ == '__main__':
    unittest.main()
