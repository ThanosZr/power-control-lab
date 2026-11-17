"""Unbalanced (three-phase) load flow of a distribution feeder (4.19.5, ROADMAP §81, THEORY §8Π): every phase of every
node on its own, with lines of one, two and three phases, loads between a phase and the neutral or between two phases, and
step voltage regulators.

- The feeder is written in the phase frame (Kersting 2002): a line section is its phase impedance matrix and its shunt
  admittance matrix over the phases it has; a transformer (grounded star – grounded star) is a series impedance per phase with
  its ratio; a regulator is an ideal ratio per phase, 1 + 0,00625 per tap; a capacitor is a susceptance.
- A load is of constant power, constant current or constant impedance, in star (phase to neutral) or in delta (phase to phase);
  a load spread along a section is put, exactly for the voltage drop and for the losses, as two thirds at a quarter of the
  section and one third at its end.
- The solution is the fixed point of the currents the loads draw at the voltages of the network: the admittance matrix of the
  nodes is factorized once, and every iteration is one solve. It does not need a radial feeder.
- The taps of a regulator are given, or found by its line-drop compensator (the voltage of the relay within its band).

Volts, amperes, watts; per unit of the phase-to-neutral voltage of each bus. Only NumPy and SciPy."""
import json
import math
import time

import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla

PH = 'abc'
MODELS = ('PQ', 'I', 'Z')
STEP = 0.00625                                              # one tap of a step regulator: 5/8 %
TAPS = 16
FT_PER_MILE = 5280.0
A120 = np.exp(-2j * np.pi / 3 * np.arange(3))               # the angles of a balanced source: 0°, −120°, 120°


class FeederError(ValueError):
    pass


def _phases(p):
    p = ''.join(sorted(set(str(p).lower())))
    if not p or any(c not in PH for c in p):
        raise FeederError(f'phases: some of a, b, c (got {p!r})')
    return p


class Feeder:
    """A three-phase feeder as data. Voltages are line-to-line kV, lengths in feet, impedances in Ω per mile and susceptances in
    µS per mile (the units of the test feeders), powers in kW and kvar."""

    def __init__(self, name='', f=60.0):
        self.name, self.f = name, f
        self.buses, self.source, self.configs = {}, None, {}
        self.published = None                                 # what the file of a test feeder publishes (case_data); it is not written back
        self.lines, self.switches, self.transformers, self.regulators, self.loads, self.spread, self.caps = [], [], [], [], [], [], []

    def bus(self, name, kV):
        self.buses[str(name)] = {'kV': float(kV)}
        return str(name)

    def _bus(self, b):
        if str(b) not in self.buses:
            raise FeederError(f'unknown bus {b!r}')
        return str(b)

    def set_source(self, bus, V=1.0):
        """The bus that holds its voltage (balanced, V per unit, phase a at 0°)."""
        self.source = {'bus': self._bus(bus), 'V': float(V)}

    def config(self, name, phases, Z, B=None):
        """A line configuration: the phases it has (in the order of the rows of its matrices), its phase impedance matrix in Ω per
        mile (complex) and its shunt susceptance matrix in µS per mile."""
        ph = [c for c in str(phases).lower()]
        if sorted(ph) != sorted(set(ph)) or any(c not in PH for c in ph):
            raise FeederError('config: phases as a string of a, b, c')
        Z = np.array(Z, complex).reshape(len(ph), len(ph))
        B = np.zeros((len(ph), len(ph))) if B is None else np.array(B, float).reshape(len(ph), len(ph))
        order = np.argsort(ph)                                 # kept in the order a, b, c
        self.configs[str(name)] = {'phases': ''.join(sorted(ph)), 'Z': Z[np.ix_(order, order)], 'B': B[np.ix_(order, order)]}

    def line(self, a, b, length, config, name=None):
        if str(config) not in self.configs:
            raise FeederError(f'unknown line configuration {config!r}')
        self.lines.append({'name': name or f'{a}-{b}', 'a': self._bus(a), 'b': self._bus(b), 'length': float(length), 'config': str(config)})

    def switch(self, a, b, phases='abc', name=None):
        self.switches.append({'name': name or f'{a}-{b}', 'a': self._bus(a), 'b': self._bus(b), 'phases': _phases(phases)})

    def transformer(self, hv, lv, kVA, R, X, phases='abc', name=None):
        """Grounded star – grounded star: R and X in per cent on its kVA; the ratio is that of the nominal voltages of its buses."""
        self.transformers.append({'name': name or f'{hv}-{lv}', 'a': self._bus(hv), 'b': self._bus(lv), 'kVA': float(kVA), 'R': float(R), 'X': float(X), 'phases': _phases(phases)})

    def regulator(self, a, b, taps=None, phases='abc', pt=20.0, ct=700.0, R=0.0, X=0.0, level=120.0, band=2.0, name=None):
        """Single-phase step regulators in star between a and b (b is the regulated side). taps: {phase: tap} to hold them there;
        without it they are found by the line-drop compensator: pt (ratio of the potential transformer), ct (primary rating of the
        current transformer, A), R and X (volts), level (volts on the 120 V base) and band (volts)."""
        ph = _phases(phases)
        self.regulators.append({'name': name or f'{a}-{b}', 'a': self._bus(a), 'b': self._bus(b), 'phases': ph,
                                'taps': None if taps is None else {p: int(taps[p]) for p in ph}, 'pt': float(pt), 'ct': float(ct), 'R': float(R), 'X': float(X),
                                'level': float(level), 'band': float(band)})

    def load(self, bus, connection, model, kW, kvar, name=None):
        """A spot load. connection 'Y' (the three values are of the phases a, b, c to the neutral) or 'D' (of a–b, b–c, c–a); model
        'PQ', 'I' or 'Z'; kW and kvar at the nominal voltage."""
        if connection not in ('Y', 'D') or model not in MODELS:
            raise FeederError("load: connection 'Y' or 'D', model 'PQ', 'I' or 'Z'")
        self.loads.append({'name': name or f'load{len(self.loads) + 1}', 'bus': self._bus(bus), 'connection': connection, 'model': model,
                           'kW': [float(x) for x in kW], 'kvar': [float(x) for x in kvar]})

    def distributed(self, a, b, connection, model, kW, kvar, name=None):
        """A load spread evenly along the line section a–b."""
        if connection not in ('Y', 'D') or model not in MODELS:
            raise FeederError("load: connection 'Y' or 'D', model 'PQ', 'I' or 'Z'")
        self.spread.append({'name': name or f'spread{len(self.spread) + 1}', 'a': self._bus(a), 'b': self._bus(b), 'connection': connection, 'model': model,
                            'kW': [float(x) for x in kW], 'kvar': [float(x) for x in kvar]})

    def capacitor(self, bus, kvar, name=None):
        """Capacitors in star: kvar of the phases a, b, c at the nominal voltage."""
        self.caps.append({'name': name or f'cap{len(self.caps) + 1}', 'bus': self._bus(bus), 'kvar': [float(x) for x in kvar]})

    # ---------------------------------------------------------------- as data
    def to_dict(self):
        cf = {k: {'phases': c['phases'], 'Z': [[[z.real, z.imag] for z in row] for row in c['Z']], 'B': c['B'].tolist()} for k, c in self.configs.items()}
        return {'format': 'pcl-feeder', 'version': 1, 'name': self.name, 'f': self.f, 'buses': self.buses, 'source': self.source, 'configs': cf, 'lines': self.lines,
                'switches': self.switches, 'transformers': self.transformers, 'regulators': self.regulators, 'loads': self.loads, 'distributed': self.spread, 'capacitors': self.caps}

    @classmethod
    def from_dict(cls, d):
        if d.get('format') != 'pcl-feeder':
            raise FeederError('not a feeder (format pcl-feeder)')
        fd = cls(d.get('name', ''), d.get('f', 60.0))
        for b, q in d['buses'].items():
            fd.bus(b, q['kV'])
        for k, c in d.get('configs', {}).items():
            fd.config(k, c['phases'], [[complex(*z) for z in row] for row in c['Z']], c['B'])
        for e in d.get('lines', []):
            fd.line(e['a'], e['b'], e['length'], e['config'], e.get('name'))
        for e in d.get('switches', []):
            fd.switch(e['a'], e['b'], e.get('phases', 'abc'), e.get('name'))
        for e in d.get('transformers', []):
            fd.transformer(e['a'], e['b'], e['kVA'], e['R'], e['X'], e.get('phases', 'abc'), e.get('name'))
        for e in d.get('regulators', []):
            fd.regulator(e['a'], e['b'], e.get('taps'), e.get('phases', 'abc'), e.get('pt', 20.0), e.get('ct', 700.0), e.get('R', 0.0), e.get('X', 0.0), e.get('level', 120.0),
                         e.get('band', 2.0), e.get('name'))
        for e in d.get('loads', []):
            fd.load(e['bus'], e['connection'], e['model'], e['kW'], e['kvar'], e.get('name'))
        for e in d.get('distributed', []):
            fd.distributed(e['a'], e['b'], e['connection'], e['model'], e['kW'], e['kvar'], e.get('name'))
        for e in d.get('capacitors', []):
            fd.capacitor(e['bus'], e['kvar'], e.get('name'))
        if d.get('source'):
            fd.set_source(d['source']['bus'], d['source'].get('V', 1.0))
        fd.published = d.get('published')
        return fd

    def run(self, **kw):
        return run(self, **kw)

    def report(self, title=None, **kw):
        """The report of the load flow (pcl.report.Report): the voltage of every phase, the unbalance, the regulators, the sections,
        and the published results where the feeder carries them. kw: the options of run."""
        from .report import network_report
        return network_report(as_network(self), 'unbalanced', dict(run(self, **kw), published=self.published), title)


CASES = ('feeder13',)


def case_data(name):
    """A test feeder of pcl/data by its name: 'feeder13', the IEEE 13 node test feeder."""
    from .network import DATA
    f = DATA / f'{name}.json'
    if name not in CASES or not f.exists():
        raise FeederError(f'unknown feeder {name!r}: one of {", ".join(CASES)}')
    return Feeder.from_dict(json.loads(f.read_text(encoding='utf-8')))


def case_solution(name):
    """The published results that the file of a test feeder carries (its key 'published')."""
    return case_data(name).published


# -------------------------------------------------------------------- the network of the nodes
class _Net:
    """The feeder as nodes (bus, phase) and their admittance matrix; the loads as functions of the voltages."""

    def __init__(self, fd, taps, spread='exact'):
        if fd.source is None:
            raise FeederError('the feeder has no source bus')
        self.fd = fd
        self.vln = {b: q['kV'] * 1e3 / math.sqrt(3) for b, q in fd.buses.items()}
        self.sections = []                                   # every series element as (name, kind, a, b, phases, stamp data)
        self.extra = {}                                      # buses made here (the quarter point of a section with a spread load)
        loads = [dict(e) for e in fd.loads]
        split = {}
        for e in fd.spread:                                  # two thirds at a quarter of the section, one third at its end
            ln = next((q for q in fd.lines if {q['a'], q['b']} == {e['a'], e['b']}), None)
            if ln is None:
                raise FeederError(f'distributed load {e["name"]}: no line section {e["a"]}–{e["b"]}')
            mid = f'{ln["a"]}/{ln["b"]}'
            split[ln['name']] = mid
            self.extra[mid] = ln['a']
            self.vln[mid] = self.vln[ln['a']]
            if spread == 'exact':
                loads.append(dict(e, bus=mid, kW=[2 * x / 3 for x in e['kW']], kvar=[2 * x / 3 for x in e['kvar']], name=e['name'] + ' (2/3)'))
                loads.append(dict(e, bus=ln['b'], kW=[x / 3 for x in e['kW']], kvar=[x / 3 for x in e['kvar']], name=e['name'] + ' (1/3)'))
            else:                                            # all of it at the middle of the section
                loads.append(dict(e, bus=mid))
        for ln in fd.lines:
            c = fd.configs[ln['config']]
            if ln['name'] in split:
                mid = split[ln['name']]
                k = 0.25 if spread == 'exact' else 0.5
                self.sections.append((ln['name'] + (' (1/4)' if spread == 'exact' else ' (1/2)'), 'line', ln['a'], mid, c['phases'], (c, k * ln['length']), ln['name']))
                self.sections.append((ln['name'] + (' (3/4)' if spread == 'exact' else ' (2/2)'), 'line', mid, ln['b'], c['phases'], (c, (1 - k) * ln['length']), ln['name']))
            else:
                self.sections.append((ln['name'], 'line', ln['a'], ln['b'], c['phases'], (c, ln['length']), ln['name']))
        for e in fd.switches:
            self.sections.append((e['name'], 'switch', e['a'], e['b'], e['phases'], None, e['name']))
        for e in fd.transformers:
            self.sections.append((e['name'], 'transformer', e['a'], e['b'], e['phases'], e, e['name']))
        for e in fd.regulators:
            self.sections.append((e['name'], 'regulator', e['a'], e['b'], e['phases'], taps[e['name']], e['name']))
        # the phases of every bus: those of the sections that reach it
        ph = {b: set() for b in list(fd.buses) + list(self.extra)}
        for s in self.sections:
            ph[s[2]] |= set(s[4])
            ph[s[3]] |= set(s[4])
        ph[fd.source['bus']] |= set(PH) if not ph[fd.source['bus']] else set()
        self.ph = {b: ''.join(sorted(p)) for b, p in ph.items()}
        self.nodes = [(b, p) for b in ph for p in self.ph[b]]
        self.ix = {q: i for i, q in enumerate(self.nodes)}
        n = len(self.nodes)
        Y = sp.lil_matrix((n, n), dtype=complex)
        self.el = []                                         # per section: (index arrays a, b; the 2k × 2k admittance block)
        for name, kind, a, b, phs, data, parent in self.sections:
            ia, ib = [self.ix[(a, p)] for p in phs], [self.ix[(b, p)] for p in phs]
            k = len(phs)
            if kind == 'line':
                c, length = data
                Z = c['Z'] * length / FT_PER_MILE
                Ysh = 1j * c['B'] * 1e-6 * length / FT_PER_MILE
                Ys = np.linalg.inv(Z)
                blk = np.block([[Ys + Ysh / 2, -Ys], [-Ys, Ys + Ysh / 2]])
            elif kind == 'switch':
                Ys = np.eye(k) / 1e-4                         # closed: a tenth of a milliohm
                blk = np.block([[Ys, -Ys], [-Ys, Ys]])
            elif kind == 'transformer':
                nr = self.vln[a] / self.vln[b]
                z = complex(data['R'], data['X']) / 100 * (fd.buses[a]['kV'] * 1e3) ** 2 / (data['kVA'] * 1e3)       # Ω on the high-voltage side
                y = np.eye(k) / z
                blk = np.block([[y, -nr * y], [-nr * y, nr * nr * y]])
            else:                                            # a regulator: the ratio of each phase, behind a very small impedance
                r = np.array([1 + STEP * data[p] for p in phs])
                y = 1 / 1e-5
                blk = np.block([[np.diag(r * r) * y, -np.diag(r) * y], [-np.diag(r) * y, np.eye(k) * y]])
            idx = np.r_[ia, ib]
            for i, gi in enumerate(idx):
                for j, gj in enumerate(idx):
                    Y[gi, gj] += blk[i, j]
            self.el.append((np.array(ia), np.array(ib), blk))
        for e in fd.caps:                                    # capacitors in star: a susceptance per phase
            for p, q in zip(PH, e['kvar']):
                if q:
                    if (e['bus'], p) not in self.ix:
                        raise FeederError(f'capacitor {e["name"]}: bus {e["bus"]} has no phase {p}')
                    i = self.ix[(e['bus'], p)]
                    Y[i, i] += 1j * q * 1e3 / self.vln[e['bus']] ** 2
        self.Y = Y.tocsc()
        self.loads = []
        for e in loads:
            vn = self.vln[e['bus']]
            for k, (p, q) in enumerate(zip(e['kW'], e['kvar'])):
                if not (p or q):
                    continue
                pair = (PH[k],) if e['connection'] == 'Y' else (PH[k], PH[(k + 1) % 3])
                if any((e['bus'], c) not in self.ix for c in pair):
                    raise FeederError(f'load {e["name"]}: bus {e["bus"]} has no phase {" or ".join(pair)}')
                self.loads.append({'name': e['name'], 'bus': e['bus'], 'nodes': [self.ix[(e['bus'], c)] for c in pair], 'S': complex(p, q) * 1e3, 'model': e['model'],
                                   'Vn': vn if e['connection'] == 'Y' else vn * math.sqrt(3), 'where': '–'.join(pair), 'connection': e['connection']})
        src = fd.source['bus']
        self.fixed = np.array([self.ix[(src, p)] for p in self.ph[src]])
        self.free = np.array([i for i in range(n) if i not in set(self.fixed.tolist())])
        self.Vs = np.array([fd.source['V'] * self.vln[src] * A120[PH.index(p)] for p in self.ph[src]])
        self.lu = spla.splu(self.Y[self.free][:, self.free].tocsc())
        self.Yfs = self.Y[self.free][:, self.fixed]

    def load_currents(self, V):
        """The current every load draws at the voltages V: (per load: its current, its power), and the injection per node."""
        I = np.zeros(len(self.nodes), complex)
        out = []
        for e in self.loads:
            nd = e['nodes']
            v = V[nd[0]] - (V[nd[1]] if len(nd) == 2 else 0.0)
            if e['model'] == 'PQ':
                i = np.conj(e['S'] / v)
            elif e['model'] == 'I':                           # the magnitude of the nominal current, at the power factor of the load
                i = abs(e['S']) / e['Vn'] * np.exp(1j * (np.angle(v) - np.angle(e['S'])))
            else:
                i = v * np.conj(e['S']) / e['Vn'] ** 2
            I[nd[0]] -= i
            if len(nd) == 2:
                I[nd[1]] += i
            out.append((i, v * np.conj(i)))
        return I, out

    def solve(self, tol, max_iter):
        n = len(self.nodes)
        V = np.zeros(n, complex)
        V[self.fixed] = self.Vs
        for i in self.free:                                  # a flat start: every node at the nominal voltage of its phase
            b, p = self.nodes[i]
            V[i] = self.vln[b] * A120[PH.index(p)]
        base = np.array([self.vln[b] for b, _ in self.nodes])
        for it in range(1, max_iter + 1):
            I, _ = self.load_currents(V)
            new = self.lu.solve(I[self.free] - self.Yfs @ self.Vs)
            d = np.max(np.abs(new - V[self.free]) / base[self.free])
            V[self.free] = new
            if not np.all(np.isfinite(new)):
                return V, it, False
            if d < tol:
                return V, it, True
        return V, max_iter, False

    def flows(self, V):
        """The currents into every section at its two ends (A, complex)."""
        return [(blk[:len(ia)] @ np.r_[V[ia], V[ib]], blk[len(ia):] @ np.r_[V[ia], V[ib]]) for ia, ib, blk in self.el]


def _relay(net, V):
    """What the relay of every regulator sees (volts on the 120 V base): the regulated voltage through the potential transformer
    less the drop of the compensator, (R + jX) volts at the rated current of the current transformer."""
    fl, out = net.flows(V), {}
    for e in net.fd.regulators:
        k = next(i for i, s in enumerate(net.sections) if s[0] == e['name'])
        _, ib, _ = net.el[k]
        out[e['name']] = {p: float(abs(V[ib[j]] / e['pt'] - complex(e['R'], e['X']) * (-fl[k][1][j]) / e['ct'])) for j, p in enumerate(e['phases'])}
    return out


def as_network(fd):
    """The feeder as a positive-sequence pcl.network.Network of the same buses and sections (the impedance and the susceptance of
    a section: the mean of its own values less the mean of its mutual ones; the loads with their totals and their model): for
    the picture of the feeder, and for a first look with the other studies. For a balanced feeder it is the same load flow; for
    any other it is not what the three-phase load flow solves."""
    from . import network as N
    Sb = 1e6
    net = N.Network(fd.f, Sb, name=fd.name)
    for b, q in fd.buses.items():
        net.bus(b, q['kV'] * 1e3)
    net.feeder(fd.source['bus'], Sk=1e15, V=fd.source['V'], slack=True, name='source')

    def pos(M):
        k = len(M)
        return np.trace(M) / k - ((M.sum() - np.trace(M)) / (k * (k - 1)) if k > 1 else 0.0)

    for e in fd.lines:
        c = fd.configs[e['config']]
        z1, b1 = pos(c['Z']) * e['length'] / FT_PER_MILE, pos(c['B']) * 1e-6 * e['length'] / FT_PER_MILE
        zb = (fd.buses[e['a']]['kV'] * 1e3) ** 2 / Sb
        net.branch_pu(e['a'], e['b'], z1.real / zb, max(z1.imag / zb, 1e-9), float(b1 * zb), name=e['name'])
    for e in fd.switches:
        net.branch_pu(e['a'], e['b'], 0.0, 1e-6, name=e['name'])
    for e in fd.transformers:
        net.branch_pu(e['a'], e['b'], e['R'] / 100 * Sb / (e['kVA'] * 1e3), e['X'] / 100 * Sb / (e['kVA'] * 1e3), name=e['name'])
    for e in fd.regulators:
        t = 0.0 if e['taps'] is None else sum(e['taps'].values()) / len(e['taps'])
        net.branch_pu(e['a'], e['b'], 0.0, 1e-6, ratio=1 / (1 + STEP * t), name=e['name'])
    zip_of = {'Z': (1.0, 0.0, 0.0), 'I': (0.0, 1.0, 0.0), 'PQ': (0.0, 0.0, 1.0)}
    for e in fd.loads:
        net.load(e['bus'], sum(e['kW']) * 1e3, sum(e['kvar']) * 1e3, zip=zip_of[e['model']], name=e['name'])
    for e in fd.spread:
        net.load(e['b'], sum(e['kW']) * 1e3, sum(e['kvar']) * 1e3, zip=zip_of[e['model']], name=e['name'])
    for e in fd.caps:
        net.shunt(e['bus'], Q=-sum(e['kvar']) * 1e3, name=e['name'])
    return net


def against(res, published):
    """A result against what the file of its feeder publishes: {'values' (how many phase voltages), 'dV' (pu) and 'dangle' (°),
    the largest differences, 'losses_kW' and 'taps' as published}. None when nothing is published, when the load flow did not
    converge, or when the taps of the result are not those of the published solution: the two are then different operating
    points."""
    if not published or not published.get('V') or not res.get('converged'):
        return None
    if published.get('taps') and not any(t == published['taps'] for t in res['taps'].values()):
        return None
    B = res['buses']
    pairs = [(B[b]['phases'][p], q) for b, rows in published['V'].items() if b in B for p, q in zip(PH, rows) if q and p in B[b]['phases']]
    if not pairs:
        return None
    return {'values': len(pairs), 'dV': max(abs(x['V'] - q[0]) for x, q in pairs), 'dangle': max(abs(x['angle'] - q[1]) for x, q in pairs), 'losses_kW': published.get('losses_kW'),
            'taps': published.get('taps')}


def sequence(Va, Vb, Vc):
    """The zero, positive and negative sequence components of three phasors."""
    a = np.exp(2j * np.pi / 3)
    return (Va + Vb + Vc) / 3, (Va + a * Vb + a * a * Vc) / 3, (Va + a * a * Vb + a * Vc) / 3


def run(feeder, regulators='given', spread='exact', tol=1e-9, max_iter=200):
    """The load flow of a three-phase feeder. regulators: 'given' (the taps written in the feeder; a regulator without taps is
    found by its control), 'control' (every tap found by its line-drop compensator: from the neutral position, one tap at a time
    on every phase whose relay voltage is outside its band, as the device moves) or 'neutral' (every tap at zero). spread: a load
    spread along a section as 'exact' (two thirds at a quarter of the section, one third at its end) or 'middle' (all of it at
    the middle: the same voltage drop, half as much again in losses).

    Returns {'converged', 'iterations', 'buses' {bus: {phase: {V (pu), angle (°), volts}}, with 'unbalance' (%, negative over
    positive sequence) at the buses of three phases}, 'sections' [{name, kind, a, b, phases, I (A, at a) and angle per phase,
    loss_kW per phase and total}], 'loads' [{name, bus, where, kW, kvar}], 'capacitors', 'input' {kW, kvar per phase and total},
    'losses_kW', 'taps' {regulator: {phase: tap}}, 'relay' {regulator: {phase: volts the relay sees}}, 'band' {regulator: [lowest, highest volts of its band]}, 'settled', 'worst' (lowest
    and highest phase voltage, largest unbalance), 'message', 'time'}."""
    t0 = time.perf_counter()
    if not isinstance(feeder, Feeder):
        raise FeederError('a Feeder is needed (pcl.unbalanced.Feeder, or case_data)')
    if regulators not in ('given', 'control', 'neutral'):
        raise FeederError("regulators: 'given', 'control' or 'neutral'")
    if spread not in ('exact', 'middle'):
        raise FeederError("spread: 'exact' (two thirds at a quarter of the section, one third at its end) or 'middle'")
    taps, auto = {}, []
    for e in feeder.regulators:
        if regulators == 'neutral' or (regulators == 'control') or e['taps'] is None:
            taps[e['name']] = {p: 0 for p in e['phases']}
            if regulators != 'neutral':
                auto.append(e)
        else:
            taps[e['name']] = dict(e['taps'])
    rounds, its, settled = 0, 0, True
    relay = {}
    while True:
        net = _Net(feeder, taps, spread)
        V, it, ok = net.solve(tol, max_iter)
        its += it
        rounds += 1
        if not ok:
            break
        relay = _relay(net, V)
        move = {}
        for e in auto:                                       # one tap at a time on every phase whose relay is outside its band, as the device does
            lo, hi = e['level'] - e['band'] / 2, e['level'] + e['band'] / 2
            for p in e['phases']:
                t, vr = taps[e['name']][p], relay[e['name']][p]
                new = min(TAPS, t + 1) if vr < lo else max(-TAPS, t - 1) if vr > hi else t
                if new != t:
                    move[(e['name'], p)] = new
        if not move:
            break
        if rounds > 2 * TAPS + 2:                            # a band narrower than one tap: the regulator hunts; the result is the last position solved
            settled = False
            break
        for (k, p), new in move.items():
            taps[k][p] = new
    out = {'converged': bool(ok), 'iterations': its, 'rounds': rounds, 'taps': taps, 'relay': relay, 'band': {e['name']: [e['level'] - e['band'] / 2, e['level'] + e['band'] / 2] for e in feeder.regulators}, 'settled': settled, 'regulators': regulators, 'message': '', 'name': feeder.name}
    if not settled:
        out['message'] = 'the taps of the regulators did not settle: the band of a regulator is narrower than the voltage of one tap'
    if not ok:
        out.update(message=f'the load flow did not converge in {max_iter} iterations', time=time.perf_counter() - t0)
        return out
    buses = {}
    for b in list(feeder.buses) + list(net.extra):
        q = {}
        for p in net.ph[b]:
            v = V[net.ix[(b, p)]]
            q[p] = {'V': float(abs(v) / net.vln[b]), 'angle': float(np.degrees(np.angle(v))), 'volts': float(abs(v))}
        d = {'phases': q, 'kV': net.fd.buses[net.extra.get(b, b)]['kV'], 'made': b in net.extra}
        if len(q) == 3:
            v0, v1, v2 = sequence(*(V[net.ix[(b, p)]] for p in PH))
            d['unbalance'] = float(100 * abs(v2) / abs(v1))
            d['zero'] = float(100 * abs(v0) / abs(v1))
        d['Vmin'], d['Vmax'] = min(x['V'] for x in q.values()), max(x['V'] for x in q.values())
        d['V'], d['angle'] = d['Vmin'], q[min(q)]['angle'] - {'a': 0.0, 'b': -120.0, 'c': 120.0}[min(q)]      # for the picture: the lowest phase, the angle of the first against its own reference
        buses[b] = d
    fl = net.flows(V)
    secs, loss = [], 0.0
    for (name, kind, a, b, phs, _, parent), (ia, ib, _), (Ia, Ib) in zip(net.sections, net.el, fl):
        pa, pb = (V[ia] * np.conj(Ia)).real, (V[ib] * np.conj(Ib)).real      # what goes in at a, what goes in at b (negative: comes out)
        lk = (pa + pb) / 1e3
        loss += float(lk.sum())
        secs.append({'name': name, 'kind': kind, 'a': a, 'b': b, 'phases': phs, 'parent': parent,
                     'I': {p: float(abs(Ia[j])) for j, p in enumerate(phs)}, 'angle': {p: float(np.degrees(np.angle(Ia[j]))) for j, p in enumerate(phs)},
                     'I_b': {p: float(abs(Ib[j])) for j, p in enumerate(phs)}, 'angle_b': {p: float(np.degrees(np.angle(-Ib[j]))) for j, p in enumerate(phs)},
                     'loss_kW': {p: float(lk[j]) for j, p in enumerate(phs)}, 'loss': float(lk.sum()),
                     'kW': {p: float(pa[j] / 1e3) for j, p in enumerate(phs)}, 'kvar': {p: float((V[ia] * np.conj(Ia)).imag[j] / 1e3) for j, p in enumerate(phs)}})
    _, lc = net.load_currents(V)
    loads = [{'name': e['name'], 'bus': e['bus'], 'where': e['where'], 'connection': e['connection'], 'model': e['model'], 'kW': float(s.real / 1e3), 'kvar': float(s.imag / 1e3),
              'A': float(abs(i))} for e, (i, s) in zip(net.loads, lc)]
    caps = []
    for e in feeder.caps:
        for p, q in zip(PH, e['kvar']):
            if q:
                v = abs(V[net.ix[(e['bus'], p)]])
                caps.append({'name': e['name'], 'bus': e['bus'], 'phase': p, 'kvar': float(q * (v / net.vln[e['bus']]) ** 2)})
    src = feeder.source['bus']
    Iin = net.Y[net.fixed] @ V                               # what the source gives to the feeder, per phase
    Sin = net.Vs * np.conj(Iin)
    inp = {'kW': {p: float(Sin[j].real / 1e3) for j, p in enumerate(net.ph[src])}, 'kvar': {p: float(Sin[j].imag / 1e3) for j, p in enumerate(net.ph[src])},
           'A': {p: float(abs(Iin[j])) for j, p in enumerate(net.ph[src])}, 'kW_total': float(Sin.real.sum() / 1e3), 'kvar_total': float(Sin.imag.sum() / 1e3)}
    allv = [(x['V'], b, p) for b, d in buses.items() for p, x in d['phases'].items()]
    lo, hi = min(allv), max(allv)
    ub = max(((d['unbalance'], b) for b, d in buses.items() if 'unbalance' in d), default=(None, None))
    out.update(buses=buses, sections=secs, loads=loads, capacitors=caps, input=inp, losses_kW=loss, load_kW=sum(q['kW'] for q in loads), load_kvar=sum(q['kvar'] for q in loads),
               cap_kvar=sum(q['kvar'] for q in caps), worst={'low': {'V': lo[0], 'bus': lo[1], 'phase': lo[2]}, 'high': {'V': hi[0], 'bus': hi[1], 'phase': hi[2]},
                                                              'unbalance': {'value': ub[0], 'bus': ub[1]}}, nodes=len(net.nodes), _V=V, _net=net)
    out['spread'] = spread
    out['advice'] = {'why': f'{len(net.nodes)} κόμβοι φάσης σε {len(feeder.buses)} ζυγούς: ο πίνακας αγωγιμοτήτων των φάσεων παραγοντοποιείται μία φορά και τα ρεύματα των φορτίων '
                            f'επαναλαμβάνονται ως το σταθερό σημείο ({its} επαναλήψεις' + (f', {rounds} γύροι για τις λήψεις των ρυθμιστών' if auto else '') + ')'}
    out['time'] = time.perf_counter() - t0
    return out


__all__ = ['FeederError', 'Feeder', 'CASES', 'case_data', 'case_solution', 'as_network', 'against', 'sequence', 'run', 'STEP', 'MODELS']
