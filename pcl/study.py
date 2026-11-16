"""Network studies as data (4.19.1, ROADMAP §68 point 6): one request in, one JSON result out, for the local server (the
tutorials of the app and its button «Εξαγωγή αναφοράς») and for any other program.

    run({'case': 'ieee118', 'study': 'pf', 'options': {'method': 'auto'}})      → the result of the study, JSON-ready
    report({'case': 'case30', 'study': 'opf'})                                   → {'html', 'name', 'report', 'summary'}
    report({'report': <a report as a dict>})                                     → the HTML of a report composed elsewhere

The network: 'case' (a name of pcl.network.CASES) or 'network' (a network as written by pcl.network.to_dict).
Studies: 'advice' (what the engine proposes, for every study), 'pf', 'dc', 'n1', 'n1dc', 'opf', 'dcopf'.
"""
import math

import numpy as np

from . import network as N
from .report import Report, network_report

STUDIES = ('advice', 'pf', 'dc', 'n1', 'n1dc', 'opf', 'dcopf')
OPTIONS = {'pf': ('method', 'tol', 'max_iter', 'q_limits', 'flat'), 'dc': (), 'n1': ('tol', 'q_limits'), 'n1dc': (), 'opf': ('flow_limits', 'start', 'tol', 'max_iter'),
           'dcopf': ('flow_limits', 'tol', 'max_iter'), 'advice': ()}
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


def network_of(data):
    if data.get('network') is not None:
        if not isinstance(data['network'], dict):
            raise StudyError('network: ένα δίκτυο όπως το γράφει το pcl.network.to_dict')
        try:
            net = N.from_dict(data['network'])
        except (KeyError, TypeError, N.NetworkError) as e:
            raise StudyError(f'Το δίκτυο δεν διαβάζεται: {e}') from e
    else:
        name = data.get('case')
        if name not in N.CASES:
            raise StudyError('Δώσε case (ένα από: ' + ', '.join(N.CASES) + ') ή network.')
        net = N.case_data(name)
    if len(net.buses) > MAX_BUSES:
        raise StudyError(f'Πάνω από {MAX_BUSES} ζυγούς.')
    return net


def _study(net, study, opt):
    if study not in STUDIES:
        raise StudyError('study: ένα από ' + ', '.join(STUDIES))
    opt = {k: v for k, v in (opt or {}).items() if k in OPTIONS[study] and v is not None and v != ''}
    try:
        if study == 'advice':
            return {k: net.advice(k) for k in ('pf', 'n1', 'batch', 'opf', 'dcopf')}
        if study == 'pf':
            return net.power_flow(**opt)
        if study == 'dc':
            return net.dc_flow()
        if study in ('n1', 'n1dc'):
            return net.contingency('ac' if study == 'n1' else 'dc', **opt)
        return net.opf('ac' if study == 'opf' else 'dc', **opt)
    except (N.NetworkError, ValueError) as e:              # the errors of the solvers are ValueErrors with a message
        raise StudyError(str(e)) from e


def summary(study, res):
    """The few numbers of a result that the card of a tutorial shows."""
    if study == 'pf':
        V = [(b, d['V']) for b, d in res['buses'].items()]
        lo, hi = min(V, key=lambda q: q[1]), max(V, key=lambda q: q[1])
        return {'converged': res['converged'], 'iterations': res['iterations'], 'method': res.get('method'), 'path': res.get('path'), 'why': res['advice']['why'],
                'losses_MW': res['losses'] / 1e6, 'Vmin': lo[1], 'Vmin_bus': lo[0], 'Vmax': hi[1], 'Vmax_bus': hi[0], 'time_ms': res['time'] * 1e3}
    if study in ('n1', 'n1dc'):
        ok = [o for o in res['outages'] if o['converged']]
        w = next((o for o in ok if o['name'] == res['worst']), None)
        return {'outages': len(res['outages']), 'solved': len(ok), 'islands': len(res['islands']), 'failed': len(res['failed']), 'worst': res['worst'],
                'worst_branch': w and w['branch'], 'worst_MVA': w and w['Smax'] / 1e6, 'worst_loading': w and w['loading'], 'overloads': sum(bool(o['overloads']) for o in ok),
                'chord': res.get('chord'), 'newton': res.get('newton'), 'why': res['advice']['why'], 'time_ms': res['time'] * 1e3}
    if study in ('opf', 'dcopf'):
        lmp = [d['lmp'] for d in res['buses'].values()]
        return {'converged': res['converged'], 'iterations': res['iterations'], 'cost': res['cost'], 'losses_MW': res['losses'] / 1e6, 'binding': len(res['binding']),
                'flow_limits': res.get('flow_limits'), 'lmp_min': min(lmp), 'lmp_max': max(lmp), 'why': res['advice']['why'], 'message': res.get('message'),
                'sources': [{'name': s['name'], 'bus': s['bus'], 'P_MW': s['P'] / 1e6, 'Q_Mvar': s['Q'] / 1e6} for s in res['sources'][:12]], 'time_ms': res['time'] * 1e3}
    return {}


def run(data):
    """{'case' | 'network', 'study', 'options'} → {'study', 'network': {name, buses, branches}, 'result', 'summary'}."""
    net = network_of(data)
    study = data.get('study') or 'pf'
    res = _study(net, study, data.get('options'))
    return {'study': study, 'network': {'name': net.name, 'case': data.get('case'), 'buses': len(net.buses),
                                        'branches': sum(e['kind'] in ('line', 'branch', 'transformer') for e in net.elements)},
            'result': _clean(res), 'summary': _clean(summary(study, res))}


def report(data):
    """A report as one HTML file: of a study ({'case' | 'network', 'study', 'options', 'title'}), or of a report object composed
    elsewhere ({'report': dict}). Returns {'html', 'name' (a file name), 'report' (the object as a dict), 'summary'}."""
    if data.get('report') is not None:
        try:
            r = Report.from_dict(data['report'])
        except (KeyError, TypeError, ValueError) as e:
            raise StudyError(f'Η αναφορά δεν διαβάζεται: {e}') from e
        return {'html': r.html(), 'name': 'report.html', 'report': r.to_dict(), 'summary': {}}
    net = network_of(data)
    study = data.get('study') or 'pf'
    if study in ('advice', 'dc'):
        raise StudyError('Αναφορά για: pf, n1, n1dc, opf, dcopf.')
    res = _study(net, study, data.get('options'))
    r = network_report(net, study, res, data.get('title') or None)
    name = f'report_{data.get("case") or "network"}_{study}.html'
    return {'html': r.html(), 'name': name, 'report': _clean(r.to_dict()), 'summary': _clean(summary(study, res))}


__all__ = ['run', 'report', 'summary', 'network_of', 'StudyError', 'STUDIES']
