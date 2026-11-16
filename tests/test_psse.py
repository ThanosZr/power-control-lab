"""PSS/E RAW files (4.19.4, ROADMAP §73, pcl/psse.py): a network written as a RAW file reads back as itself; a small network
written here by hand in the layouts of the versions 30, 33, 34 and 35 gives the same network from each; the conversions of a
transformer (the codes CW, CZ, CM, a turns ratio on the second winding, three windings) against the same quantities worked
out here; what a file has and the network does not carry is said. Every file of these tests is written here: no file of a
third party is read."""
import math
import unittest

import numpy as np

from pcl import netfile as F
from pcl import network as N
from pcl import psse as P
from pcl import study as S


def flow(net, **kw):
    r = net.power_flow(**kw)
    return {b: (d['V'], d['angle']) for b, d in r['buses'].items()}, r


# ------------------------------------------------------------------ a small network in the layout of a version
BUSES = [(1, 'ALPHA', 220.0, 3, 1.02, 0.0), (2, 'BETA', 220.0, 1, 1.0, -1.0), (3, 'GAMMA', 110.0, 1, 1.0, -3.0), (4, 'DELTA', 20.0, 2, 1.013, 28.0),
         (5, 'EPSILON', 110.0, 1, 0.99, -5.0), (6, 'OUT', 110.0, 4, 1.0, 0.0), (7, 'TERT', 20.0, 1, 1.0, -2.0)]
T23 = dict(CW=1, CZ=1, CM=1, MAG=(0.0, 0.0), z=(0.002, 0.1, 100.0), w1=(1.05, 0.0, 0.0), w2=(1.0, 0.0))


def raw(ver, t23=None, stat3=1, marks=True, sbase=100.0):
    """The text of a RAW file of version ver. t23: the record of the transformer between the buses 2 and 3; stat3: the status
    of the three-winding transformer; marks: with the comments that name the sections."""
    t = dict(T23, **(t23 or {}))
    o = [f'0, {sbase}, {ver}, 0, 0, 50.0 / a test' if ver != 30 else f'0, {sbase} / PSS/E-30.0 a test', 'first title', 'second title']
    end = lambda a, b=None: o.append(f'0 / END OF {a} DATA' + (f', BEGIN {b} DATA' if b else '') if marks else '0')     # noqa: E731
    if ver >= 34:
        o += ['@!GENERAL, THRSHZ, …', 'GENERAL, THRSHZ=0.0001, PQBRAK=0.7, BLOWUP=5.0', 'GAUSS, ITMX=100, ACCP=1.6', 'RATING, 1, "RATE1 ", "RATING SET 1"']
        end('SYSTEM-WIDE', 'BUS')
        o.append("@!   I,'NAME        ', BASKV, IDE,AREA,ZONE,OWNER, VM, VA, NVHI, NVLO, EVHI, EVLO")
    for i, nm, kv, ide, vm, va in BUSES:
        if ver <= 30:                                     # the shunt of the bus in its record: 10 Mvar at bus 3
            o.append(f"{i},'{nm:<12}',{kv},{ide}, 0.0, {10.0 if i == 3 else 0.0}, 1, 1, {vm}, {va}, 1")
        else:
            o.append(f"{i},'{nm:<12}',{kv},{ide}, 1, 1, 1, {vm}, {va}" + (', 1.1, 0.9, 1.1, 0.9' if ver >= 33 else ''))
    end('BUS', 'LOAD')
    tail = {30: '', 31: ', 1', 32: ', 1', 33: ', 1, 0', 34: ', 1, 0', 35: ", 1, 0, 0.0, 0.0, 0, 'LOADTYPE'"}[ver]
    o += [f"3,'1 ',1,1,1, 50.0, 20.0, 10.0, 4.0, 5.0, -2.0, 1{tail}", f"5,'1 ',1,1,1, 30.0, 10.0, 0.0, 0.0, 0.0, 0.0, 1{tail}", f"6,'1 ',1,1,1, 99.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1{tail}",
          f"2,'9 ',0,1,1, 77.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1{tail}"]
    if ver >= 31:
        end('LOAD', 'FIXED SHUNT')
        o += ["3,'1 ',1, 0.0, 10.0", "2,'1 ',0, 0.0, 50.0"]
        end('FIXED SHUNT', 'GENERATOR')
    else:
        end('LOAD', 'GENERATOR')
    nreg, basl = (' 0,', ', 0') if ver >= 35 else ('', '')
    o += [f"1,'1 ', 0.0, 0.0, 200.0, -100.0, 1.02, 0,{nreg} 300.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1, 100.0, 250.0, 0.0{basl}, 1, 1.0",
          f"4,'1 ', 40.0, 0.0, 30.0, -20.0, 1.0, 3,{nreg} 60.0, 0.0, 0.2, 0.0, 0.0, 1.0, 1, 100.0, 50.0, 5.0{basl}, 1, 1.0",          # regulates bus 3
          f"5,'W ', 10.0, 5.0, 5.0, 5.0, 1.0, 0,{nreg} 20.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1, 100.0, 10.0, 0.0{basl}, 1, 1.0",            # equal limits: holds nothing
          f"5,'X ', 7.0, 0.0, 9.0, -9.0, 1.0, 0,{nreg} 20.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0, 100.0, 10.0, 0.0{basl}, 1, 1.0"]            # out of service
    end('GENERATOR', 'BRANCH')
    if ver >= 34:
        r12 = ', '.join(['300.0'] + ['0.0'] * 11)
        o += [f"1, 2,'1 ', 0.01, 0.05, 0.1, 'LINE ONE', {r12}, 0.0, 0.0, 0.0, 0.0, 1, 1, 10.0, 1, 1.0",
              f"3, 5,'1 ', 0.02, 0.08, 0.02, '        ', ********, {', '.join(['0.0'] * 11)}, 0.0, 0.01, 0.0, 0.0, 1, 1, 0.0, 1, 1.0",
              f"3, 5,'2 ', 0.02, 0.08, 0.02, '        ', {r12}, 0.0, 0.0, 0.0, 0.0, 0, 1, 0.0, 1, 1.0",
              f"2, 6,'1 ', 0.02, 0.08, 0.02, '        ', {r12}, 0.0, 0.0, 0.0, 0.0, 1, 1, 0.0, 1, 1.0"]
        end('BRANCH', 'SYSTEM SWITCHING DEVICE')
        o.append("1, 2,'S1', 0.0001, 0.0, 0.0, 0.0, 1, 1, 2, 'SWITCH'")
        end('SYSTEM SWITCHING DEVICE', 'TRANSFORMER')
    else:
        o += ["1, 2,'1 ', 0.01, 0.05, 0.1, 300.0, 300.0, 300.0, 0.0, 0.0, 0.0, 0.0, 1, 1, 10.0, 1, 1.0",
              "3, -5,'1 ', 0.02, 0.08, 0.02, ********, 0.0, 0.0, 0.0, 0.01, 0.0, 0.0, 1, 1, 0.0, 1, 1.0",                             # a rating that did not fit; a line shunt at its first end
              "3, 5,'2 ', 0.02, 0.08, 0.02, 100.0, 100.0, 100.0, 0.0, 0.0, 0.0, 0.0, 0, 1, 0.0, 1, 1.0",                                # out of service
              "2, 6,'1 ', 0.02, 0.08, 0.02, 100.0, 100.0, 100.0, 0.0, 0.0, 0.0, 0.0, 1, 1, 0.0, 1, 1.0"]                                # to the bus that is out
        end('BRANCH', 'TRANSFORMER')
    rat = (lambda x: ', '.join([str(x)] + ['0.0'] * 11)) if ver >= 34 else (lambda x: f'{x}, {x}, {x}')
    wl = lambda w, v, a, x: f'{w}, {v}, {a}, {rat(x)}, 0, 0, 1.1, 0.9, 1.1, 0.9, 33, 0, 0.0, 0.0' + (', 0.0' if ver >= 32 else '')     # noqa: E731
    vg = ", 'YNyn0       '" if ver >= 33 else ''
    o += [f"2, 3, 0,'1 ', {t['CW']}, {t['CZ']}, {t['CM']}, {t['MAG'][0]}, {t['MAG'][1]}, 2,'T23         ', 1, 1, 1.0{vg}", '%s, %s, %s' % t['z'], wl(*t['w1'], 250.0), '%s, %s' % t['w2'],
          f"4, 3, 0,'1 ', 1, 1, 1, 0.0, 0.0, 2,'T43         ', 1, 1, 1.0{vg}", '0.0, 0.2, 100.0', wl(1.0, 0.0, 30.0, 60.0), '1.0, 0.0',
          f"1, 3, 7,'1 ', 1, 1, 1, 0.001, -0.01, 2,'T137        ', {stat3}, 1, 1.0{vg}", '0.002, 0.12, 100.0, 0.003, 0.06, 100.0, 0.004, 0.2, 100.0, 1.0, -2.5',
          wl(1.0, 0.0, 0.0, 200.0), wl(1.025, 0.0, 0.0, 200.0), wl(1.0, 0.0, 30.0, 50.0)]
    end('TRANSFORMER', 'AREA')
    o.append("1, 1, 0.0, 10.0,'AREA ONE    '")
    end('AREA', 'TWO-TERMINAL DC')
    o += ["'DC ONE', 1, 5.0, 100.0, 400.0, 0.0, 0.0, 0.0, 'I', 0.0, 20, 1.0" if ver >= 33 else "1, 1, 5.0, 100.0, 400.0, 0.0, 0.0, 0.0, 'I', 0.0, 20, 1.0",
          '1, 2, 20.0, 15.0, 0.0, 3.0, 220.0, 1.0, 1.0, 1.1, 0.9, 0.01, 0, 0, 0, 1, 0.0', '2, 2, 20.0, 15.0, 0.0, 3.0, 220.0, 1.0, 1.0, 1.1, 0.9, 0.01, 0, 0, 0, 1, 0.0']
    end('TWO-TERMINAL DC', 'VSC DC LINE')
    sw = {30: "5, 1, 1.05, 0.95, 0, 100.0, '            ', 15.0, 1, 15.0", 31: "5, 1, 1.05, 0.95, 0, 100.0, '            ', 15.0, 1, 15.0",
          35: "5, '1 ', 1, 0, 1, 1.05, 0.95, 0, 0, 100.0, '            ', 15.0, 1, 15.0"}.get(ver, "5, 1, 0, 1, 1.05, 0.95, 0, 100.0, '            ', 15.0, 1, 15.0")
    if ver <= 30:
        end('VSC DC LINE', 'SWITCHED SHUNT')
        o.append(sw)
        for a, b in (('SWITCHED SHUNT', 'IMPEDANCE CORRECTION'), ('IMPEDANCE CORRECTION', 'MULTI-TERMINAL DC'), ('MULTI-TERMINAL DC', 'MULTI-SECTION LINE'), ('MULTI-SECTION LINE', 'ZONE')):
            end(a, b)
        o.append("1,'ZONE ONE    '")
        for a, b in (('ZONE', 'INTER-AREA TRANSFER'), ('INTER-AREA TRANSFER', 'OWNER'), ('OWNER', 'FACTS DEVICE'), ('FACTS DEVICE', None)):
            end(a, b)
    else:
        for a, b in (('VSC DC LINE', 'IMPEDANCE CORRECTION'), ('IMPEDANCE CORRECTION', 'MULTI-TERMINAL DC'), ('MULTI-TERMINAL DC', 'MULTI-SECTION LINE'), ('MULTI-SECTION LINE', 'ZONE')):
            end(a, b)
        o.append("1,'ZONE ONE    '")
        for a, b in (('ZONE', 'INTER-AREA TRANSFER'), ('INTER-AREA TRANSFER', 'OWNER'), ('OWNER', 'FACTS DEVICE'), ('FACTS DEVICE', 'SWITCHED SHUNT')):
            end(a, b)
        o.append(sw)
        end('SWITCHED SHUNT', 'GNE')
        end('GNE', 'INDUCTION MACHINE')
        end('INDUCTION MACHINE', None)
    o.append('Q')
    return '\n'.join(o) + '\n'


class RoundTrip(unittest.TestCase):
    def test_a_network_written_as_raw_reads_back_as_itself(self):
        for c in N.CASES:
            net = N.case_data(c)
            back = F.read(P.write(net), c + '.raw')
            self.assertEqual(back.warnings, [], c)
            self.assertEqual(len(back.buses), len(net.buses), c)
            (a, ra), (b, rb) = flow(net), flow(back)
            self.assertLess(max(abs(a[k][0] - b[k][0]) for k in a), 1e-11, c)                     # the same voltages (the order of the elements is another)
            self.assertLess(max(abs(a[k][1] - b[k][1]) for k in a), 1e-9, c)
            self.assertAlmostEqual(ra['losses'], rb['losses'], delta=1e-3, msg=c)                 # W
        self.assertEqual(F.summary(F.read(P.write(N.case_data('case30')), 'x.raw'))['costs'], 0)   # the format has no place for the costs
        self.assertEqual(F.summary(F.read(P.write(N.case_data('case30')), 'x.raw'))['rated'], 41)

    def test_the_names_of_the_buses_are_labels(self):
        net = P.read(raw(33))
        self.assertEqual((net.buses['1']['label'], net.buses['5']['label']), ('ALPHA', 'EPSILON'))
        self.assertNotIn('label', N.case_data('ieee14').buses['1'])                               # a network without labels is written as before
        self.assertEqual(N.from_dict(N.to_dict(net)).buses['3']['label'], 'GAMMA')
        from pcl import netview
        v = netview.view(net)
        self.assertEqual(next(q for q in v['buses'] if q['id'] == '3')['label'], 'GAMMA')
        back = P.read(P.write(F.read(F.write(N.case_data('ieee14'), 'pcl').replace('"1": {', '"1": {"label": "NORTH", ', 1), 'a.json')))
        self.assertEqual(back.buses['1']['label'], 'NORTH')                                        # a label is written as the name of the bus

    def test_what_cannot_be_written(self):
        net = N.Network()
        net.bus('A', 20e3, 'slack')
        net.bus('B', 20e3)
        net.feeder('A', Sk=500e6)
        net.line('A', 'B', R=0.1, X=0.3, length=5)
        with self.assertRaises(P.RawError) as e:
            P.write(net)
        self.assertIn('JSON', str(e.exception))
        with self.assertRaises(P.RawError):
            P.write(N.case_data('ieee14'), version=35)


class Records(unittest.TestCase):
    def test_the_fields_of_a_record(self):
        f = lambda s: [t for t, _ in P.fields(s)]                                                 # noqa: E731
        self.assertEqual(f("  101,'NORTH/SOUTH 1', 110.0000,1,  -5.5 / a comment, with a comma"), ['101', 'NORTH/SOUTH 1', '110.0000', '1', '-5.5'])
        self.assertEqual(f("0 / END OF BUS DATA, BEGIN LOAD DATA"), ['0'])
        self.assertEqual(f("1 2 '1 ' 0.01 0.05"), ['1', '2', '1', '0.01', '0.05'])                # free format with blanks
        self.assertEqual(f("3,, 5,"), ['3', '', '5', ''])                                         # an empty field keeps its place
        self.assertEqual(P.fields("7,'A B '")[1], ('A B', True))
        self.assertEqual(f(''), [])
        r = P._Rec(P.fields('1, , ********, 2.5D1, x'))
        P._Rec.stars = 0
        self.assertEqual((r.f(0), r.f(1, 9.0), r.f(2, 7.0), r.f(3), r.f(9, 4.0), P._Rec.stars), (1.0, 9.0, 7.0, 25.0, 4.0, 1))
        with self.assertRaises(P.RawError):
            r.f(4)


class Small(unittest.TestCase):
    """The network of raw(): what is read, and that every version gives the same network."""

    def test_what_is_read(self):
        net = P.read(raw(33))
        s = F.summary(net)
        self.assertEqual((s['buses'], s['generators'], s['f'], s['S_base_MVA']), (7, 3, 50.0, 100.0))          # 6 buses in service and the star of the three windings
        el = {e['name']: e for e in net.elements}
        self.assertNotIn('6', net.buses)
        self.assertEqual(sorted(k for k in el if k.startswith(('L', 'T')) and el[k]['kind'] == 'branch'), ['L1-2-1', 'L3-5-1', 'T1-3-7-1.1', 'T1-3-7-1.2', 'T1-3-7-1.3', 'T2-3-1', 'T4-3-1'])
        # the three parts of a load: constant power, current, admittance (YQ < 0 is inductive)
        self.assertEqual([(el[k]['P'], el[k]['Q'], el[k]['zip']) for k in ('load3-1', 'load3-1.I', 'load3-1.Z')],
                         [(50e6, 20e6, (0.0, 0.0, 1.0)), (10e6, 4e6, (0.0, 1.0, 0.0)), (5e6, 2e6, (1.0, 0.0, 0.0))])
        self.assertNotIn('load2-9', el)                                                           # out of service
        self.assertEqual((el['sh3-1']['P'], el['sh3-1']['Q']), (0.0, -10e6))                      # a capacitor of 10 Mvar
        self.assertEqual(el['sw5']['Q'], -15e6)                                                   # the switched shunt at its initial value
        self.assertEqual((el['L3-5-1.i']['bus'], el['L3-5-1.i']['Q']), ('3', -1e6))               # the line shunt BI = 0.01 pu at the first end
        self.assertEqual((el['L1-2-1']['rating'], el['L3-5-1'].get('rating')), (300e6, None))      # asterisks: no rating
        self.assertEqual((el['T1-3-7-1.m']['P'], el['T1-3-7-1.m']['Q']), (0.1e6, 1e6))            # magnetising: G = 0.001, B = −0.01 pu
        # machines: the slack holds its set-point; a machine that regulates another bus holds its own at the voltage of the file;
        # equal reactive limits: no voltage, the reactive power of the file beside it
        self.assertEqual((el['G1-1']['slack'], el['G1-1']['V']), (True, 1.02))
        self.assertEqual((el['G4-1']['V'], el['G4-1']['P'], el['G4-1']['Qmin'], el['G4-1']['Qmax'], el['G4-1']['Pmin'], el['G4-1']['Pmax']), (1.013, 40e6, -20e6, 30e6, 5e6, 50e6))
        self.assertEqual((el['G5-W']['V'], el['G5-W']['P'], el['G5-W.Q']['Q']), (None, 10e6, -5e6))
        self.assertNotIn('G5-X', el)
        t = el['T4-3-1']
        self.assertEqual((t['a'], t['b'], t['x'], t['ratio'], t['angle'], t['rating']), ('4', '3', 0.2, 1.0, 30.0, 60e6))
        w = net.warnings
        self.assertEqual(len(w), 6)
        for word, line in zip(('τύπος 4', 'BINIT', 'άλλου ζυγού', 'δεν ρυθμίζουν τάση', 'γραμμές DC δύο άκρων (1)', 'αστερίσκοι'), w):
            self.assertIn(word, line)
        r = net.power_flow()
        self.assertTrue(r['converged'])
        self.assertAlmostEqual(r['buses']['4']['angle'] - r['buses']['3']['angle'], 30.0, delta=6.0)   # the shift of the step-up transformer, less its loading

    def test_every_version_gives_the_same_network(self):
        ref = P.read(raw(33))
        V0, r0 = flow(ref)
        for ver, marks in ((30, False), (30, True), (31, True), (32, True), (33, False), (34, True), (35, True), (34, False)):
            net = P.read(raw(ver, marks=marks))
            V, r = flow(net)
            self.assertEqual(sorted(V), sorted(V0), (ver, marks))
            self.assertLess(max(abs(V[k][0] - V0[k][0]) + abs(V[k][1] - V0[k][1]) for k in V), 1e-9, (ver, marks))
            self.assertAlmostEqual(r['losses'], r0['losses'], delta=1e-2, msg=str((ver, marks)))
            names = sorted(e['name'] for e in net.elements)
            want = sorted(e['name'] for e in ref.elements)
            if ver <= 30:                                                                         # the shunt of bus 3 is in the bus record
                want = sorted('sh3' if q == 'sh3-1' else q for q in want)
            self.assertEqual(names, want, (ver, marks))
            self.assertEqual(net.element('L1-2-1')['rating'], 300e6, ver)
            self.assertEqual(net.element('T2-3-1')['rating'], 250e6, ver)
            self.assertEqual(sum('διακόπτες' in q for q in net.warnings), int(ver >= 34), ver)
        self.assertEqual(F.read(raw(32), 'small.raw').name, 'small')                              # through the reader of network files
        self.assertEqual(S.open_file({'name': 'small.raw', 'text': raw(35)})['summary']['buses'], 7)

    def test_what_is_refused(self):
        for text, word in ((raw(33).replace(', 33, 0, 0,', ', 28, 0, 0,'), 'έκδοση 28'), ('one\ntwo\n', 'τέσσερις'), ('0, 0.0, 33, 0, 0, 50\na\nb\n0\nQ\n', 'SBASE'),
                           ('0, 100.0, 33, 0, 0, 50\na\nb\n0 / END OF BUS DATA\nQ\n', 'ζυγούς'), ('x, y, z\na\nb\nc\nd\n', 'επικεφαλίδα'),
                           (raw(33).replace("5,'EPSILON     '", "3,'EPSILON     '"), 'δύο φορές'), (raw(33).replace('1.025, 0.0, 0.0, 200.0', 'abc, 0.0, 0.0, 200.0'), 'αριθμός')):
            with self.assertRaises(N.NetworkError) as e:
                F.read(text, 'a.raw')
            self.assertIn(word, str(e.exception), word)
        half = raw(33).split("1, 3, 7,'1 '")[0] + "1, 3, 7,'1 ', 1, 1, 1, 0.0, 0.0, 2,'T137', 1, 1, 1.0\n0.002, 0.12, 100.0, 0.003, 0.06, 100.0, 0.004, 0.2, 100.0, 1.0, 0.0\n0\nQ\n"
        with self.assertRaises(P.RawError) as e:
            P.read(half)
        self.assertIn('μισή', str(e.exception))


class Transformers(unittest.TestCase):
    def t23(self, **kw):
        return P.read(raw(33, t23=kw)).element('T2-3-1')

    def test_the_units_of_the_turns_ratio(self):
        a = self.t23()                                                                            # CW = 1: per unit of the bus base voltage
        self.assertEqual((a['ratio'], a['r'], a['x'], a['angle']), (1.05, 0.002, 0.1, 0.0))
        b = self.t23(CW=2, w1=(231.0, 0.0, 0.0), w2=(110.0, 0.0))                                 # CW = 2: kV (231 kV on a 220 kV bus)
        self.assertAlmostEqual(b['ratio'], 1.05, places=12)
        c = self.t23(CW=3, w1=(1.0, 231.0, 0.0), w2=(1.0, 110.0))                                 # CW = 3: per unit of the nominal voltage of the winding
        self.assertAlmostEqual(c['ratio'], 1.05, places=12)
        d = self.t23(CW=3, w1=(1.02, 0.0, 0.0), w2=(1.0, 0.0))                                    # no nominal voltage given: the base voltage of the bus
        self.assertAlmostEqual(d['ratio'], 1.02, places=12)

    def test_a_ratio_on_the_second_winding(self):
        e = self.t23(w1=(1.05, 0.0, 0.0), w2=(0.95, 0.0))
        self.assertAlmostEqual(e['ratio'], 1.05 / 0.95, places=12)                                # t1/t2 at the first bus
        self.assertAlmostEqual(e['x'], 0.1 * 0.95 ** 2, places=12)                                # and Z·t2² on the side of the second
        self.assertAlmostEqual(e['r'], 0.002 * 0.95 ** 2, places=12)
        # the same two-port, worked out from the model of the format: an ideal t1 : 1, the impedance, an ideal 1 : t2
        t1, t2, z = 1.05, 0.95, complex(0.002, 0.1)
        Y = np.array([[1 / (z * t1 * t1), -1 / (z * t1 * t2)], [-1 / (z * t1 * t2), 1 / (z * t2 * t2)]])
        zb, tau = complex(e['r'], e['x']), e['ratio']
        Yb = np.array([[1 / (zb * tau * tau), -1 / (zb * tau)], [-1 / (zb * tau), 1 / zb]])
        self.assertLess(float(np.abs(Y - Yb).max()), 1e-12)

    def test_the_units_of_the_impedance(self):
        a = self.t23(CZ=2, z=(0.001, 0.05, 50.0))                                                 # per unit of the winding base, 50 MVA: twice on 100 MVA
        self.assertAlmostEqual(a['r'], 0.002, places=12)
        self.assertAlmostEqual(a['x'], 0.1, places=12)
        b = self.t23(CZ=3, z=(250000.0, 0.05, 50.0))                                              # load loss 250 kW and |Z| = 0.05 pu on 50 MVA
        r = 250000.0 / 50e6
        self.assertAlmostEqual(b['r'], 2 * r, places=12)
        self.assertAlmostEqual(b['x'], 2 * math.sqrt(0.05 ** 2 - r ** 2), places=12)

    def test_the_magnetising_admittance(self):
        el = {e['name']: e for e in P.read(raw(33, t23=dict(MAG=(0.002, -0.03)))).elements}
        self.assertEqual((el['T2-3-1.m']['bus'], el['T2-3-1.m']['P']), ('2', 0.2e6))
        self.assertAlmostEqual(el['T2-3-1.m']['Q'], 3e6, places=6)
        # CM = 2: no-load loss in W and exciting current in pu of the winding base (50 MVA)
        el = {e['name']: e for e in P.read(raw(33, t23=dict(CM=2, MAG=(100000.0, 0.02), z=(0.001, 0.05, 50.0), CZ=2))).elements}
        self.assertAlmostEqual(el['T2-3-1.m']['P'], 100000.0, places=6)                           # the loss at 1 pu
        self.assertAlmostEqual(el['T2-3-1.m']['Q'], math.sqrt((0.02 * 50e6) ** 2 - 100000.0 ** 2), places=4)

    def test_three_windings(self):
        net = P.read(raw(33))
        el = {e['name']: e for e in net.elements}
        z12, z23, z31 = complex(0.002, 0.12), complex(0.003, 0.06), complex(0.004, 0.2)
        z = [(z12 + z31 - z23) / 2, (z12 + z23 - z31) / 2, (z23 + z31 - z12) / 2]
        for k, (bus, ratio, ang, rate) in enumerate((('1', 1.0, 0.0, 200e6), ('3', 1.025, 0.0, 200e6), ('7', 1.0, 30.0, 50e6))):
            e = el[f'T1-3-7-1.{k + 1}']
            self.assertEqual((e['a'], e['b'], e['ratio'], e['angle'], e['rating']), (bus, 'T1-3-7-1*', ratio, ang, rate))
            self.assertAlmostEqual(complex(e['r'], e['x']), z[k], places=12)
        self.assertEqual((net.buses['T1-3-7-1*']['V'], net.buses['T1-3-7-1*']['angle']), (1.0, -2.5))   # the star starts from the voltage of the file
        # with nothing on the third winding the other two see Z12: the same voltages as a two-winding transformer of Z12
        text = raw(33).replace("'T137        ', 1,", "'T137        ', 3,")                           # the status that takes the third winding out
        self.assertNotIn('T1-3-7-1.3', {e['name'] for e in P.read(text).elements})
        three = F.read(text, 'three.raw')                                                         # bus 7 hangs on nothing now: the reader of network files leaves it out and says so
        self.assertNotIn('7', three.buses)
        self.assertIn('δεν συνδέονται με ζυγό ταλάντωσης', three.warnings[-1])
        two = text.split("1, 3, 7,'1 '")
        rest = two[1].split('\n', 5)[5]
        two = F.read(two[0] + "1, 3, 0,'1 ', 1, 1, 1, 0.001, -0.01, 2,'T13         ', 1, 1, 1.0\n0.002, 0.12, 100.0\n1.0, 0.0, 0.0, 200.0, 200.0, 200.0, 0, 0, 1.1, 0.9, 1.1, 0.9, 33, 0, 0.0, 0.0, 0.0\n1.025, 0.0\n" + rest, 'two.raw')
        (a, _), (b, _) = flow(three, tol=1e-12), flow(two, tol=1e-12)
        self.assertLess(max(abs(a[k][0] - b[k][0]) + abs(a[k][1] - b[k][1]) for k in b), 1e-9)
        # the other statuses: the second winding out, the first out (then no magnetising branch either)
        self.assertEqual(sorted(e['name'] for e in P.read(raw(33, stat3=2)).elements if e['name'].startswith('T1-3-7')), ['T1-3-7-1.1', 'T1-3-7-1.3', 'T1-3-7-1.m'])
        self.assertEqual(sorted(e['name'] for e in P.read(raw(33, stat3=4)).elements if e['name'].startswith('T1-3-7')), ['T1-3-7-1.2', 'T1-3-7-1.3'])
        self.assertEqual([e['name'] for e in P.read(raw(33, stat3=0)).elements if e['name'].startswith('T1-3-7')], [])


if __name__ == '__main__':
    unittest.main()
