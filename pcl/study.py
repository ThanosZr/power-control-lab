"""Network studies as data (4.19.1, ROADMAP §68 point 6): one request in, one JSON result out, for the local server (the
tutorials of the app and its button «Εξαγωγή αναφοράς») and for any other program.

    run({'case': 'ieee118', 'study': 'pf', 'options': {'method': 'auto'}})      → the result of the study, JSON-ready
    report({'case': 'case30', 'study': 'opf'})                                   → {'html', 'name', 'report', 'summary'}
    report({'report': <a report as a dict>})                                     → the HTML of a report composed elsewhere

The network: 'case' (a name of pcl.network.CASES) or 'network' (a network as written by pcl.network.to_dict).
Studies: 'advice' (what the engine proposes, for every study), 'pf', 'dc', 'n1', 'n1dc', 'opf', 'dcopf', 'scopf' (4.19.4), 'cpf' (4.19.5:
the continuation load flow), 'se' (4.19.5: state estimation from measurements), 'harmonic' (4.19.5: the harmonic load flow).

4.19.5: 'unbalanced' is the three-phase load flow of a feeder (pcl.unbalanced): its network is a 'case' of pcl.unbalanced.CASES or a
'feeder' as data (pcl.unbalanced.Feeder.to_dict), not a pcl.network.Network.

4.19.4 (ROADMAP §73): 'edits' = a list of changes of the network (pcl.netfile.apply: a load, a generator, a rating, an element
out of service), made on a copy before the study; and a network from a file:

    open_file({'name': 'case118.m', 'text': …})     → {'network' (as data, to send back as 'network'), 'summary'}
    save_file({'case': 'ieee14', 'edits': […], 'format': 'matpower'})   → {'name', 'text', 'mime'}: the changed network as a file
"""
import math

import numpy as np

from . import network as N
from .report import Report, network_report

STUDIES = ('advice', 'pf', 'dc', 'n1', 'n1dc', 'opf', 'dcopf', 'scopf', 'cpf', 'se', 'harmonic', 'acdc')
FEEDER_STUDIES = ('unbalanced',)                          # 4.19.5: studies of a three-phase feeder (pcl.unbalanced), not of a Network
STARTS = ('auto', 'mid', 'pf', 'nn')
OPTIONS = {'pf': ('method', 'tol', 'max_iter', 'q_limits', 'flat'), 'dc': (), 'n1': ('tol', 'q_limits', 'backend', 'how'), 'n1dc': (), 'opf': ('flow_limits', 'start', 'tol', 'max_iter'),
           'dcopf': ('flow_limits', 'tol', 'max_iter'), 'scopf': ('emergency', 'tol', 'max_iter', 'max_rounds'),
           'cpf': ('direction', 'q_limits', 'step', 'dV', 'lower', 'stop', 'V_stop', 'max_points', 'tol'),
           'se': ('measurements', 'plan', 'noise', 'seed', 'sigma', 'bad', 'zero_injections', 'detect', 'threshold', 'confidence', 'max_bad', 'tol', 'max_iter', 'start',
                  'pmu', 'currents', 'emt'),
           'harmonic': ('sources', 'harmonics', 'load_model', 'line_model', 'pulse', 'filters', 'scan_bus', 'scan_to', 'scan_step', 'tol', 'spectra'),
           'unbalanced': ('regulators', 'spread', 'tol', 'max_iter'), 'advice': (), 'acdc': ('method', 'tol', 'max_iter', 'flat', 'q_limits', 'limits', 'set', 'out', 'mode', 'flow_limits', 'start', 'outages')}
MAX_BUSES = 20000


class StudyError(ValueError):
    pass


def _clean(o):
    """Numbers and containers of NumPy as plain JSON (NaN and ±inf as None); private keys ('_V') left out."""
    if isinstance(o, dict):
        return {str(k): _clean(v) for k, v in o.items() if not str(k).startswith('_')}
    if isinstance(o, (list, tuple)):
        return [_clean(v) for v in o]
    if isinstance(o, np.ndarray):
        return _clean(o.tolist())
    if isinstance(o, (np.bool_, bool)):
        return bool(o)
    if isinstance(o, np.integer):
        return int(o)
    if isinstance(o, (float, np.floating)):
        return float(o) if math.isfinite(o) else None
    if isinstance(o, complex):
        return [o.real, o.imag]
    return o


def _base_network(data):
    """The network of a request before its changes: a case by its name, or a network as data."""
    if data.get('network') is not None:
        if not isinstance(data['network'], dict):
            raise StudyError('network: ένα δίκτυο όπως το γράφει το pcl.network.to_dict')
        try:
            net = N.from_dict(data['network'])
        except (KeyError, TypeError, N.NetworkError) as e:
            raise StudyError(f'Το δίκτυο δεν διαβάζεται: {e}') from e
    else:
        name = data.get('case')
        if data.get('feeder') is not None:
            raise StudyError('Το δίκτυο είναι τροφοδότης τριών φάσεων: μελετιέται με την ασύμμετρη ροή φορτίου (study «unbalanced»).')
        if name not in N.CASES + N.MORE:
            raise StudyError('Δώσε case (ένα από: ' + ', '.join(N.CASES + N.MORE) + ') ή network.')
        net = N.case_data(name)
    if len(net.buses) > MAX_BUSES:
        raise StudyError(f'Πάνω από {MAX_BUSES} ζυγούς.')
    return net


def _networks_of(data):
    """(the network as given, the network with the changes of 'edits', one sentence per change)."""
    from . import netfile
    net0 = _base_network(data)
    try:
        net, done = netfile.apply(net0, data.get('edits'))
    except N.NetworkError as e:
        raise StudyError(str(e)) from e
    return net0, net, done


def network_of(data):
    """The network a study runs on: 'case' or 'network', with the changes of 'edits' (4.19.4)."""
    return _networks_of(data)[1]


def open_file(data):
    """A network from the text of a file (MATPOWER .m, PSS/E RAW, our JSON): {'name', 'text'} → {'network': the network as data
    (pcl.network.to_dict), 'summary': what it holds and what was left out of the file}."""
    from . import netfile
    fd = _feeder_text(data.get('text'))
    if fd is not None:                                     # 4.19.5: the JSON of a three-phase feeder (pcl.unbalanced), for the study 'unbalanced'
        return {'feeder': _clean(fd.to_dict()), 'summary': {'name': fd.name or 'feeder', 'feeder': True, 'buses': len(fd.buses), 'branches': len(fd.lines) + len(fd.switches) + len(fd.transformers) + len(fd.regulators),
                                                            'generators': 0, 'load_MW': (sum(sum(e['kW']) for e in fd.loads) + sum(sum(e['kW']) for e in fd.spread)) / 1e3, 'rated': 0, 'costs': False, 'warnings': []}}
    try:
        net = netfile.read(data.get('text'), str(data.get('name') or ''), data.get('format') or None)
    except N.NetworkError as e:
        raise StudyError(str(e)) from e
    if len(net.buses) > MAX_BUSES:
        raise StudyError(f'Πάνω από {MAX_BUSES} ζυγούς.')
    return {'network': _clean(N.to_dict(net)), 'summary': _clean(netfile.summary(net))}


def _feeder_text(text):
    """The feeder of a file when the text is the JSON of one (format 'pcl-feeder'), else None."""
    import json
    if not isinstance(text, str) or '"pcl-feeder"' not in text[:400000]:
        return None
    from . import unbalanced as U
    try:
        d = json.loads(text)
        if not isinstance(d, dict) or d.get('format') != 'pcl-feeder':
            return None
        fd = U.Feeder.from_dict(d)
    except (KeyError, TypeError, ValueError) as e:
        raise StudyError(f'Ο τροφοδότης δεν διαβάζεται: {e}') from e
    if len(fd.buses) > MAX_BUSES:
        raise StudyError(f'Πάνω από {MAX_BUSES} ζυγούς.')
    return fd


def save_file(data):
    """The network of a request, with its changes, as the text of a file: {'case' | 'network', 'edits', 'format': 'pcl' (JSON),
    'matpower' or 'raw'} → {'name', 'text', 'mime'}."""
    from . import netfile
    if data.get('study') in FEEDER_STUDIES:                # 4.19.5: a feeder has one format, its own JSON
        import json
        if (data.get('format') or 'pcl') != 'pcl':
            raise StudyError('Ένας τροφοδότης τριών φάσεων σώζεται μόνο ως JSON (pcl).')
        fd = _feeder(data, solve=False)[0]
        return {'name': (data.get('case') or 'feeder') + '.json', 'text': json.dumps(fd.to_dict(), ensure_ascii=False, indent=1), 'mime': 'application/json'}
    net = network_of(data)
    fmt = data.get('format') or 'pcl'
    if fmt not in netfile.FORMATS:
        raise StudyError('format: ' + ', '.join(netfile.FORMATS))
    try:
        text = netfile.write(net, fmt)
    except N.NetworkError as e:
        raise StudyError(str(e)) from e
    return {'name': _stem(data, net) + {'pcl': '.json', 'matpower': '.m', 'raw': '.raw'}[fmt], 'text': text, 'mime': 'application/json' if fmt == 'pcl' else 'text/plain'}


def _picture(net0, net, data):
    """The view of a request: the places come from the network as given, so that a change does not move the picture; what
    the changes took out of service is marked."""
    from . import netfile, netview
    return netview.view(net0, off=netfile.out_of_service(data.get('edits')))


def _study(net, study, opt):
    if study not in STUDIES:
        raise StudyError('study: ένα από ' + ', '.join(STUDIES))
    opt = {k: v for k, v in (opt or {}).items() if k in OPTIONS[study] and v is not None and v != ''}
    if study == 'harmonic' and opt.get('scan_bus') is None and '3' in net.buses and net.name.startswith('Harmonic test system 1'):
        opt['scan_bus'] = '3'                              # the test system is looked at from its HVDC bus, as in the paper
    if 'start' in opt and opt['start'] not in STARTS:      # 4.19.2: 'nn' = the start model of this network, if there is one
        raise StudyError('start: ένα από ' + ', '.join(STARTS))
    try:
        if study == 'advice':
            return {k: net.advice(k) for k in ('pf', 'n1', 'batch', 'opf', 'dcopf')}
        if study == 'pf':
            return net.power_flow(**opt)
        if study == 'dc':
            return net.dc_flow()
        if study in ('n1', 'n1dc'):
            return net.contingency('ac' if study == 'n1' else 'dc', **opt)
        if study == 'scopf':                               # 4.19.4: the DC optimal power flow with security against every single outage
            return net.scopf(**opt)
        if study == 'cpf':                                 # 4.19.5: the continuation load flow (the P–V curve and the loading margin)
            return net.cpf(**opt)
        if study == 'se':                                  # 4.19.5: state estimation (weighted least squares, bad data)
            return net.estimate(**opt)
        if study == 'harmonic':                            # 4.19.5: the harmonic load flow (current injection, frequency scan)
            return net.harmonics(**opt)
        if study == 'acdc':                                # 4.20: the sequential AC/DC load flow with the DC grids of the network
            chg = {k: opt.pop(k) for k in ('set', 'out') if k in opt}
            if chg:                                        # a new power of converters ('set': {name: W}), converters or DC lines out ('out')
                net = N.from_dict(N.to_dict(net))
                for name, v in (chg.get('set') or {}).items():
                    e = net.element(name)
                    if e['kind'] == 'dcdc':                # 4.21: a DC/DC converter: its power, voltage, droop or law
                        for k, x in (v.items() if isinstance(v, dict) else (('P', v),)):
                            if k not in ('P', 'V', 'droop', 'R', 'control'):
                                raise StudyError(f'set: {name}.{k}: ένα από P, V, droop, R, control')
                            if k == 'control' and x not in ('P', 'V', 'droop'):
                                raise StudyError(f'set: {name}.control: ένα από P, V, droop')
                            e[k] = x if k == 'control' else float(x)
                            if k == 'droop':
                                e.pop('R', None)
                        continue
                    if e['kind'] != 'vsc':
                        raise StudyError(f'set: {name} δεν είναι μετατροπέας')
                    for k, x in (v.items() if isinstance(v, dict) else (('P', v),)):
                        if k not in ('P', 'V', 'droop', 'R', 'Q', 'Vac', 'control', 'Imax', 'Ucmax', 'Ucmin', 'Qmin', 'Qmax'):
                            raise StudyError(f'set: {name}.{k}: ένα από P, V, droop, R, Q, Vac, control, Imax, Ucmax, Ucmin, Qmin, Qmax')
                        if k == 'control':                 # 4.20.1: the law of the station (a droop needs droop or R, and P_rated)
                            if x not in ('P', 'V', 'droop', 'idroop', 'I'):
                                raise StudyError(f'set: {name}.control: ένα από P, V, droop, idroop, I')
                            e[k] = x
                            continue
                        e[k] = None if x is None and k in ('Imax', 'Ucmax', 'Ucmin', 'Qmin', 'Qmax') else float(x)     # 4.21: a limit of the station, or none
                        if k == 'droop':                   # a new droop replaces a gain given directly
                            e.pop('R', None)
                for name in chg.get('out') or []:
                    if net.element(name)['kind'] not in ('vsc', 'dc_line', 'dcdc', 'dc_dispatcher'):
                        raise StudyError(f'out: {name} δεν είναι μετατροπέας, μετατροπέας DC/DC, κεντρικός ελεγκτής ή γραμμή DC')
                    net.remove(name)
            mode = opt.pop('mode', 'flow')                 # 4.21: the optimal power flow AC/DC, or N−1 AC/DC, on the same network
            if mode == 'opf':
                return net.acdc_opf(**{k: v for k, v in opt.items() if k in ('flow_limits', 'start', 'tol', 'max_iter')})
            if mode == 'n1':
                return net.acdc_contingency(**{k: v for k, v in opt.items() if k in ('outages', 'limits', 'tol', 'method')})
            if mode != 'flow':
                raise StudyError("mode: ένα από 'flow', 'opf', 'n1'")
            return net.acdc_flow(**{k: v for k, v in opt.items() if k not in ('flow_limits', 'start', 'outages')})
        return net.opf('ac' if study == 'opf' else 'dc', **opt)
    except (N.NetworkError, ValueError) as e:              # the errors of the solvers are ValueErrors with a message
        raise StudyError(str(e)) from e


def summary(study, res):
    """The few numbers of a result that the card of a tutorial shows."""
    if study == 'pf':
        V = [(b, d['V']) for b, d in res['buses'].items()]
        lo, hi = min(V, key=lambda q: q[1]), max(V, key=lambda q: q[1])
        return {'converged': res['converged'], 'iterations': res['iterations'], 'method': res.get('method'), 'path': res.get('path'), 'why': res['advice']['why'],
                'losses_MW': res['losses'] / 1e6, 'Vmin': lo[1], 'Vmin_bus': lo[0], 'Vmax': hi[1], 'Vmax_bus': hi[0], 'time_ms': res['time'] * 1e3,
                **({'q_side': res['q_side']} if 'q_side' in res else {})}          # 4.21: q_limits 'side'
    if study in ('n1', 'n1dc'):
        ok = [o for o in res['outages'] if o['converged']]
        w = next((o for o in ok if o['name'] == res['worst']), None)
        return {'outages': len(res['outages']), 'solved': len(ok), 'islands': len(res['islands']), 'failed': len(res['failed']), 'worst': res['worst'],
                'worst_branch': w and w['branch'], 'worst_MVA': w and w['Smax'] / 1e6, 'worst_loading': w and w['loading'], 'overloads': sum(bool(o['overloads']) for o in ok),
                'chord': res.get('chord'), 'newton': res.get('newton'), 'why': res['advice']['why'], 'time_ms': res['time'] * 1e3,
                'backend': res.get('backend'), 'how': res.get('how'), 'backend_why': res.get('backend_why')}
    if study in ('opf', 'dcopf', 'scopf'):
        lmp = [d['lmp'] for d in res['buses'].values()]
        out = {'converged': res['converged'], 'iterations': res['iterations'], 'cost': res['cost'], 'losses_MW': res['losses'] / 1e6, 'binding': len(res['binding']),
                'flow_limits': res.get('flow_limits'), 'lmp_min': min(lmp), 'lmp_max': max(lmp), 'why': res['advice']['why'], 'message': res.get('message'),
                'start': res.get('start'), 'start_path': res.get('start_path') or [],
                'sources': [{'name': s['name'], 'bus': s['bus'], 'P_MW': s['P'] / 1e6, 'Q_Mvar': s['Q'] / 1e6} for s in res['sources'][:12]], 'time_ms': res['time'] * 1e3}
        if study == 'scopf':                               # what the security costs, what binds, what no dispatch covers
            s = res['security']
            out['security'] = {k: s.get(k) for k in ('secure', 'outages', 'monitored', 'rounds', 'constraints', 'emergency', 'cost_base', 'cost_security', 'insecure_before',
                                                     'worst_before', 'worst_after', 'ac')}
            out['security'].update(islands=len(s['islands']), binding=s['binding'][:8], n_binding=len(s['binding']), unsecured=s['unsecured'][:8], n_unsecured=len(s['unsecured']))
        return out
    if study == 'cpf':                                     # 4.19.5: the margin, the weakest bus, what happened on the way, and one curve to draw
        ns, wk = res['nose'], res['nose']['bus']
        every = max(1, -(-res['points'] // 240))           # the curve of the weakest bus, thinned to 240 points at most (the nose stays in)
        keep = sorted(set(range(0, res['points'], every)) | {ns['point'], res['points'] - 1})
        return {'converged': res['converged'], 'kind': ns['kind'], 'refined': ns['refined'], 'lambda': ns['lambda'], 'margin': ns['margin'], 'margin_MW': ns['margin_MW'],
                'margin_Mvar': ns['margin_Mvar'], 'load_MW': res['base']['load_MW'], 'nose_MW': ns['load_MW'], 'bus': wk, 'V': ns['V'], 'V0': res['buses'][wk]['V0'],
                'Vmin': ns['Vmin'], 'Vmin_bus': ns['Vmin_bus'], 'points': res['points'], 'q_limits': res['q_limits'], 'events': len(res['events']),
                'first': [{k: e[k] for k in ('lambda', 'bus', 'limit', 'to')} for e in res['events'] if e['point'] > 0][:6],
                'at_start': sum(e['point'] == 0 for e in res['events']), 'last': next((e['bus'] for e in res['events'] if e['point'] == ns['point']), None),
                'weak': [q['bus'] for q in res['weak'][:5]], 'growth': res['growth'], 'steps': res['steps'], 'why': res['advice']['why'], 'message': res['message'],
                'curve': {'bus': wk, 'lambda': [res['lambda'][j] for j in keep], 'V': [res['V'][wk][j] for j in keep], 'nose': keep.index(ns['point'])},
                'time_ms': res['time'] * 1e3}
    if study == 'se':                                      # 4.19.5: how many measurements, the tests, what was taken out, how far from the load flow
        fi, sg = res.get('first') or {}, lambda b: b['error'] / b['sigma']      # noqa: E731
        return {'converged': res['converged'], 'observable': res['observable'], 'iterations': res['iterations'], 'rounds': res['rounds'], 'm': res['m'], 'n': res['n'],
                'constraints': res['constraints'], 'redundancy': res['redundancy'], 'plan': res.get('plan'), 'counts': res.get('counts'), 'J': res.get('J'), 'dof': res.get('dof'),
                'chi2': res.get('chi2'), 'suspect': res.get('suspect'), 'largest': res.get('largest'), 'J_first': fi.get('J'), 'chi2_first': fi.get('chi2'),
                'suspect_first': fi.get('suspect'), 'largest_first': fi.get('largest'), 'dof_first': fi.get('dof'), 'threshold': res['threshold'], 'confidence': res['confidence'],
                'bad': [{'type': b['type'], 'at': b['at'], 'rN': b['rN'], 'sigmas': sg(b), 'value': b['value'], 'corrected': b['corrected'], 'planted': b['index'] in res['planted']} for b in res['bad'][:8]],
                'n_bad': len(res['bad']), 'planted': len(res['planted']), 'found': sum(b['index'] in res['planted'] for b in res['bad']), 'critical': len(res['critical']),
                'error': res.get('error'), 'islands': len(res.get('islands') or []), 'uncovered': (res.get('uncovered') or [])[:8], 'losses_MW': None if res.get('losses') is None else res['losses'] / 1e6,
                'why': res['advice']['why'], 'message': res['message'], 'time_ms': res['time'] * 1e3,
                **({'start': res.get('start'), 'absolute': res.get('absolute')} if 'absolute' in res else {}),          # 4.21: phasors and |I|
                **({'tve': {k: v for k, v in res['tve'].items() if k != 'points'}} if res.get('tve') else {})}
    if study == 'harmonic':                                # 4.19.5: the worst distortion, what is above its limit, the scan to draw
        if not res['converged']:
            return {'converged': False, 'message': res['message'], 'why': '', 'time_ms': res['time'] * 1e3}
        B, sc = res['buses'], res.get('scan')
        top = sorted(B, key=lambda b: -B[b]['THD'])[:6]
        row = lambda b: {'bus': b, 'THD': B[b]['THD'], 'limit_thd': B[b]['limit_thd'], 'limit': B[b]['limit'], 'worst': B[b]['worst'], 'worst_pct': B[b]['worst_pct'],      # noqa: E731
                         'kV': B[b]['Un'] / 1e3, 'over': B[b]['over']}
        out = {'converged': True, 'sources': [{'load': q['load'], 'bus': q['bus'], 'I1': q['I1'], 'delta': q['delta'], **({'spec': q['spec']} if 'spec' in q else {})} for q in res['sources']], 'orders': res['harmonics'],
               'skipped': res['skipped'], 'worst': row(res['worst']['bus']), 'top': [row(b) for b in top], 'over': len(res['over']), 'over_buses': res['over'][:10], 'buses': len(B),
               'load_model': res['load_model'], 'line_model': res['line_model'], 'pulse': res['pulse'], 'filters': res['filters'], 'losses_MW': res['lf']['losses'] / 1e6,
               'why': res['advice']['why'], 'message': res['message'], 'time_ms': res['time'] * 1e3}
        if sc:
            every = max(1, -(-len(sc['h']) // 400))        # the scan thinned to 400 points at most, with its peaks kept
            keep = sorted(set(range(0, len(sc['h']), every)) | {sc['h'].index(h) for h, _ in sc['peaks']} | {len(sc['h']) - 1})
            out['scan'] = {'bus': sc['bus'], 'h': [sc['h'][j] for j in keep], 'Z': [sc['Z'][j] for j in keep], 'peaks': sorted(sc['peaks'], key=lambda q: -q[1])[:6]}
            out['at'] = dict(row(sc['bus']), Vh={str(h): 100 * v / B[sc['bus']]['V'] for h, v in B[sc['bus']]['Vh'].items()})
        return out
    if study == 'acdc' and 'outages' in res:               # 4.21: N−1 AC/DC
        ok = [o for o in res['outages'] if o['converged']]
        w = next((o for o in ok if o['name'] == res['worst']), None)
        return {'mode': 'n1', 'outages': len(res['outages']), 'solved': len(ok), 'failed': res['failed'], 'worst': res['worst'], 'worst_where': w and w['where'],
                'worst_loading': w and w['loading'], 'base_loading': res['base']['loading'], 'overloads': sum(bool(o['overloads']) for o in ok),
                'limits': sorted({n for o in ok for n in o['limits']}), 'time_ms': res['time'] * 1e3,
                'list': [{k: o[k] for k in ('name', 'kind', 'converged', 'loading', 'where', 'Vmin', 'Vdc_min', 'Vdc_max', 'message')} for o in res['outages']]}
    if study == 'acdc' and res.get('kind') == 'acdc':      # 4.21: the optimal power flow AC/DC
        dc = res['dc']
        return {'mode': 'opf', 'converged': res['converged'], 'iterations': res['iterations'], 'cost': res['cost'], 'message': res.get('message'),
                'losses_MW': res['losses'] / 1e6, 'losses_dc_MW': res['losses_dc'] / 1e6, 'losses_conv_MW': res['losses_conv'] / 1e6, 'binding': len(res['binding']),
                'sources': [{'name': q['name'], 'bus': q['bus'], 'P_MW': q['P'] / 1e6, 'Q_Mvar': q['Q'] / 1e6} for q in res['sources']],
                'stations': [{'name': n, 'bus': c['bus'], 'dc': c['dc'], 'Ps_MW': c['Ps'] / 1e6, 'Qs_Mvar': c['Qs'] / 1e6, 'Pdc_MW': c['Pdc'] / 1e6,
                              'Udc_kV': c['Udc'] / 1e3, 'Uc': c['Uc'], 'Ic_kA': c['Ic'] / 1e3, 'loss_MW': c['loss'] / 1e6} for n, c in res['converters'].items()],
                'dc': [{'bus': b, 'U_kV': d['U'] / 1e3, 'V': d['V'], 'P_MW': d['P'] / 1e6, 'lmp': d['lmp']} for b, d in dc['buses'].items()], 'time_ms': res['time'] * 1e3}
    if study == 'acdc':                                    # 4.20: the AC/DC iterations, the DC grid, every converter
        dc, C = res['dc'] or {}, res['converters']
        Vd = [(b, d['V']) for b, d in (dc.get('buses') or {}).items()]
        V = [(b, d['V']) for b, d in res['buses'].items()]
        return {'converged': res['converged'], 'outer': res['outer'], 'method': res.get('method'), 'why': (res.get('advice') or {}).get('why'),
                'losses_MW': res['losses'] / 1e6, 'losses_dc_MW': (res['losses_dc'] or 0.0) / 1e6, 'losses_conv_MW': res['losses_conv'] / 1e6,
                'converters': len(C), 'dc_buses': len(Vd), 'Vdc_min': min(Vd, key=lambda q: q[1]) if Vd else None, 'Vdc_max': max(Vd, key=lambda q: q[1]) if Vd else None,
                'Vmin': min(V, key=lambda q: q[1]), 'Vmax': max(V, key=lambda q: q[1]),
                'dc': [{'bus': b, 'U_kV': d['U'] / 1e3, 'V': d['V'], 'P_MW': d['P'] / 1e6} for b, d in (dc.get('buses') or {}).items()],
                'stations': [{'name': n, 'bus': c['bus'], 'dc': c['dc'], 'control': c['control'], 'Ps_MW': c['Ps'] / 1e6, 'Qs_Mvar': c['Qs'] / 1e6,
                              'Pdc_MW': c['Pdc'] / 1e6, 'Udc_kV': (c['Udc'] or 0.0) / 1e3, 'loss_MW': c['loss'] / 1e6, 'Ic_kA': c['Ic'] / 1e3} for n, c in C.items()],
                # 4.21: the DC/DC converters and the dispatchers (only when the network has them)
                **({'dcdc': [{'name': n, 'a': d['a'], 'b': d['b'], 'control': d['control'], 'P_MW': d['P'] / 1e6, 'Ua_kV': d['Ua'] / 1e3, 'Ub_kV': d['Ub'] / 1e3,
                              'loading': d['loading']} for n, d in dc['dcdc'].items()]} if dc.get('dcdc') else {}),
                **({'dispatchers': [{'name': n, 'x_MW': d['x'] / 1e6, 'V': d['V'], 'Vref': d['Vref'], 'members': {m: p / 1e6 for m, p in d['members'].items()}}
                                    for n, d in dc['dispatchers'].items()]} if dc.get('dispatchers') else {}),
                # 4.21: the limits of the stations (only when they were checked): which one a limit holds, and how
                **({'limits': [{'name': n, 'held': C[n].get('held'), 'over': C[n].get('over'), 'Qmin_Mvar': None if C[n].get('Qmin') is None else C[n]['Qmin'] / 1e6,
                                'Qmax_Mvar': None if C[n].get('Qmax') is None else C[n]['Qmax'] / 1e6} for n in res['limits']]} if 'limits' in res else {}),
                'time_ms': res['time'] * 1e3}
    return {}


def _feeder(data, solve=True):
    """The feeder of a request, its load flow and what its file publishes: (feeder, result, published or None)."""
    from . import unbalanced as U
    opt = {k: v for k, v in (data.get('options') or {}).items() if k in OPTIONS['unbalanced'] and v is not None and v != ''}
    try:
        if data.get('feeder') is not None:
            if not isinstance(data['feeder'], dict):
                raise StudyError('feeder: ένας τροφοδότης όπως τον γράφει το pcl.unbalanced.Feeder.to_dict')
            fd, pub = U.Feeder.from_dict(data['feeder']), data['feeder'].get('published')
        else:
            if data.get('network') is not None:
                raise StudyError('Η ασύμμετρη ροή φορτίου θέλει τροφοδότη τριών φάσεων (το JSON του pcl.unbalanced), όχι δίκτυο θετικής ακολουθίας.')
            if data.get('case') not in U.CASES:
                raise StudyError('Δώσε case (ένα από: ' + ', '.join(U.CASES) + ') ή feeder.')
            fd, pub = U.case_data(data['case']), U.case_solution(data['case'])
        if len(fd.buses) > MAX_BUSES:
            raise StudyError(f'Πάνω από {MAX_BUSES} ζυγούς.')
        return fd, (U.run(fd, **opt) if solve else None), pub
    except (KeyError, TypeError, ValueError) as e:
        if isinstance(e, StudyError):
            raise
        raise StudyError(str(e)) from e


def _feeder_summary(fd, res, pub):
    if not res['converged']:
        return {'converged': False, 'message': res['message'], 'why': '', 'time_ms': res['time'] * 1e3}
    B = res['buses']
    prof = [{'bus': b, **{p: (d['phases'][p]['V'] if p in d['phases'] else None) for p in 'abc'}, 'unbalance': d.get('unbalance')} for b, d in B.items() if not d['made']]
    out = {'converged': True, 'iterations': res['iterations'], 'rounds': res['rounds'], 'nodes': res['nodes'], 'buses': len(prof), 'low': res['worst']['low'], 'high': res['worst']['high'],
           'unbalance': res['worst']['unbalance'], 'losses_kW': res['losses_kW'], 'input': res['input'], 'load_kW': res['load_kW'], 'load_kvar': res['load_kvar'], 'cap_kvar': res['cap_kvar'],
           'taps': res['taps'], 'relay': res['relay'], 'band': res['band'], 'settled': res['settled'], 'regulators': res['regulators'], 'spread': res['spread'], 'profile': prof, 'why': res['advice']['why'], 'message': res['message'],
           'time_ms': res['time'] * 1e3}
    from . import unbalanced as U
    cmp = U.against(res, pub)                              # against what the file of the feeder publishes, when the taps are the published ones
    if cmp:
        out['published'] = cmp
    elif pub and pub.get('taps'):
        out['published_taps'] = pub['taps']
    return out


def _feeder_run(data, with_report=False):
    from . import unbalanced as U
    fd, res, pub = _feeder(data)
    net = U.as_network(fd)
    out = {'study': 'unbalanced', 'network': {'name': fd.name, 'case': data.get('case'), 'buses': len(fd.buses), 'branches': len(fd.lines) + len(fd.switches) + len(fd.transformers) + len(fd.regulators)},
           'result': _clean(res), 'summary': _clean(_feeder_summary(fd, res, pub))}
    if with_report:
        r = network_report(net, 'unbalanced', dict(res, published=pub), data.get('title') or None)
        return {'html': r.html(), 'name': f'report_{_stem(data, net)}_unbalanced.html', 'report': _clean(r.to_dict()), 'summary': out['summary']}
    if data.get('view'):
        from . import netview
        v = netview.view(net)
        out['view'], out['layers'] = v, netview.pack(v, out['result'])
        have = [q['layer'] for q in out['layers']]
        out['layer'] = 'unbalance' if 'unbalance' in have else 'base'
        if data.get('view') == 'only':
            out.pop('result')
    return out


def run(data):
    """{'case' | 'network', 'study', 'options'} → {'study', 'network': {name, buses, branches}, 'result', 'summary'}.
    With 'view': True (4.19.4) also the picture of the network as data: 'view' (buses, branches and their places,
    pcl.netview.view) and 'layers' (what every layer shows from this result, pcl.netview.pack), 'layer' (the one to open),
    and 'edit' (what can be changed from the picture, as it is now: pcl.netfile.describe). With 'edits' the study runs on
    the changed network and 'network' says what was changed ('edits': one sentence each). 4.21: 'layer' names the layer to
    open with (when the result feeds it)."""
    if data.get('study') in FEEDER_STUDIES:                # 4.19.5: a three-phase feeder has its own network and its own load flow
        return _feeder_run(data)
    net0, net, done = _networks_of(data)
    study = data.get('study') or 'pf'
    res = _study(net, study, data.get('options'))
    out = {'study': study, 'network': {'name': net.name, 'case': data.get('case'), 'buses': len(net.buses),
                                       'branches': sum(e['kind'] in ('line', 'branch', 'transformer') for e in net.elements)},
           'result': _clean(res), 'summary': _clean(summary(study, res))}
    if done:
        out['network']['edits'] = done
    if data.get('view'):
        from . import netfile, netview
        v = _picture(net0, net, data)
        out['edit'] = netfile.describe(net)
        out['view'], out['layers'] = v, netview.pack(v, out['result'])
        have = [q['layer'] for q in out['layers']]
        first = netview.DEFAULT.get(study)
        if study == 'acdc':                                # 4.21: the modes of the AC/DC study open on their own layer
            first = {'n1': 'n1', 'opf': 'lmp'}.get((data.get('options') or {}).get('mode'), first)
        if data.get('layer') in have:                      # 4.21: the layer to open with, when the request names one
            first = data['layer']
        out['layer'] = first if first in have else ('voltage' if 'voltage' in have else 'base')
        if data.get('view') == 'only':
            out.pop('result')
    return out


def view(data):
    """The picture of the network of a study as a file: {'case' | 'network', 'study', 'options', 'format': 'dxf' | 'svg',
    'layer' (SVG) or 'layers' (DXF)} → {'name', 'text', 'mime'}."""
    from . import netview
    study = data.get('study') or 'pf'
    fmt = data.get('format') or 'dxf'
    if fmt not in ('dxf', 'svg'):
        raise StudyError('format: dxf ή svg')
    if study in FEEDER_STUDIES:                            # 4.19.5: the picture of a feeder is that of its positive-sequence network
        from . import unbalanced as U
        fd, res, _ = _feeder(data)
        net0 = net = U.as_network(fd)
        res = _clean(res)
        data = dict(data, layers=data.get('layers') or ['voltage', 'angle', 'unbalance'])
    else:
        net0, net, _ = _networks_of(data)
        res = _clean(_study(net, study, data.get('options')))
    v = _picture(net0, net, data)
    stem = f'network_{_stem(data, net)}_{study}'
    try:
        if fmt == 'svg':
            layer = data.get('layer') or netview.DEFAULT.get(study, 'voltage')
            body = netview.svg(v, res, layer, width=1600, labels=len(v['buses']) <= 400, standalone=True)
            return {'name': f'{stem}_{layer}.svg', 'mime': 'image/svg+xml', 'text': '<?xml version="1.0" encoding="UTF-8"?>\n' + body + '\n'}
        layers = data.get('layers') or ['voltage', 'angle', 'flow', 'loading', 'lmp']
        return {'name': f'{stem}.dxf', 'mime': 'application/dxf', 'text': netview.dxf(v, res, layers)}
    except netview.ViewError as e:
        raise StudyError(str(e)) from e


def _stem(data, net):
    """The part of a file name that says which network: the case, or the name of the network of a file (letters, digits, _ and -)."""
    import re
    return data.get('case') or re.sub(r'[^0-9A-Za-z_-]+', '_', str(net.name or 'network')).strip('_')[:40] or 'network'


def report(data):
    """A report as one HTML file: of a study ({'case' | 'network', 'study', 'options', 'title'}), or of a report object composed
    elsewhere ({'report': dict}). Returns {'html', 'name' (a file name), 'report' (the object as a dict), 'summary'}."""
    if data.get('report') is not None:
        try:
            r = Report.from_dict(data['report'])
        except (KeyError, TypeError, ValueError) as e:
            raise StudyError(f'Η αναφορά δεν διαβάζεται: {e}') from e
        return {'html': r.html(), 'name': 'report.html', 'report': r.to_dict(), 'summary': {}}
    if data.get('study') in FEEDER_STUDIES:
        return _feeder_run(data, with_report=True)
    net0, net, done = _networks_of(data)
    study = data.get('study') or 'pf'
    if study in ('advice', 'dc'):
        raise StudyError('Αναφορά για: pf, n1, n1dc, opf, dcopf, scopf, cpf, se, harmonic.')
    res = _study(net, study, data.get('options'))
    r = network_report(net, study, res, data.get('title') or None, picture=_picture(net0, net, data) if done else None)
    if done:                                               # what was changed, right after the title of the report
        r.note('Αλλαγές στο δίκτυο πριν από τη μελέτη (' + str(len(done)) + '): ' + ' '.join(done), 'warning')
        r.sections.insert(0, r.sections.pop())
    name = f'report_{_stem(data, net)}_{study}.html'
    return {'html': r.html(), 'name': name, 'report': _clean(r.to_dict()), 'summary': _clean(summary(study, res))}


__all__ = ['run', 'report', 'view', 'open_file', 'save_file', 'summary', 'network_of', 'StudyError', 'STUDIES', 'FEEDER_STUDIES']
