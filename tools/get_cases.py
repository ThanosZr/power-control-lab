"""The test networks of pcl/data from the case files distributed with MATPOWER (4.19.1, ROADMAP §68).

    python tools/get_cases.py [folder with the .m files]

Without a folder the files are downloaded from the public MATPOWER repository. The case files are data converted from
public sources (the IEEE Common Data Format archive of the University of Washington; Baran & Wu for the radial feeders;
Alsac & Stott for the 30-bus case with line ratings; the PEGASE project for the 1354-bus case, whose file is licensed
CC BY 4.0); the licence of MATPOWER says that they are not covered by its BSD licence. Only the numbers go into pcl/data, with their source in each file; the .m files do not enter the repo.

What is written per case: buses (U_n = base kV, type, the voltages of the file = the published load-flow solution),
loads, shunts, generators (P, V, reactive limits, P limits and the polynomial cost for the optimal power flow) and
branches in per unit (tap, shift, rating). The 9- and 14-bus files of 4.2 keep everything they had (frequency, nominal
voltages, typical short-circuit data, name) and only get the limits, the costs and the ratings.
"""
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from pcl import network as N    # noqa: E402

URL = 'https://raw.githubusercontent.com/MATPOWER/matpower/master/data/'
IEEE = 'Public IEEE test case data (IEEE Common Data Format, University of Washington archive), as distributed with MATPOWER ({m}.m). '
GEN = 'Generators: rating = mBase and x″d = 0,2 pu are typical values for the short circuit, not part of the data. '
OPF = 'Generator costs and limits as in the MATPOWER file (they are not part of the IEEE data).'
CASES = {
    # our name: (MATPOWER file, f, name, source)
    'ieee9': ('case9', None, None, None),
    'ieee14': ('case14', None, None, None),
    'ieee30': ('case_ieee30', 60.0, 'IEEE 30-bus test case', IEEE + GEN + OPF),
    'ieee57': ('case57', 60.0, 'IEEE 57-bus test case', IEEE + GEN + OPF),
    'ieee118': ('case118', 60.0, 'IEEE 118-bus test case', IEEE + GEN + OPF),
    'ieee300': ('case300', 60.0, 'IEEE 300-bus test case', IEEE + GEN + OPF),
    'case30': ('case30', 60.0, '30-bus case with line ratings (Alsac & Stott)',
               'Data of O. Alsac, B. Stott, «Optimal load flow with steady-state security», IEEE Trans. PAS-93(3), 1974, with the '
               'generator costs and limits and the line ratings as distributed with MATPOWER ({m}.m). ' + GEN),
    'case33bw': ('case33bw', 50.0, '33-bus radial distribution feeder (Baran & Wu)',
                 'Data of M. E. Baran, F. F. Wu, «Network reconfiguration in distribution systems for loss reduction and load '
                 'balancing», IEEE Trans. Power Delivery 4(2), 1989, as distributed with MATPOWER ({m}.m); the five tie '
                 'switches are open (not in the file here). ' + GEN),
    'case69': ('case69', 50.0, '69-bus radial distribution feeder (Baran & Wu)',
               'Data of M. E. Baran, F. F. Wu, «Optimal capacitor placement on radial distribution systems», IEEE Trans. Power '
               'Delivery 4(1), 1989, as distributed with MATPOWER ({m}.m). ' + GEN),
    # 4.19.3 (decision 264): a large network with an open licence (the case file states it: CC BY 4.0)
    'pegase1354': ('case1354pegase', 50.0, 'PEGASE 1354-bus case (part of the European high-voltage network, fictitious data)',
                   'Data of the PEGASE project (Pan European Grid Advanced Simulation and State Estimation, 7th Framework '
                   'Programme of the European Union): C. Josz, S. Fliscounakis, J. Maeght, P. Panciatici, «AC power flow data in '
                   'MATPOWER and QCQP format: iTesla, RTE snapshots, and PEGASE», arXiv:1603.01533, 2016; S. Fliscounakis, '
                   'P. Panciatici, F. Capitanescu, L. Wehenkel, «Contingency ranking with respect to overloads in very large power '
                   'systems taking into account uncertainty, preventive and corrective actions», IEEE Trans. Power Systems 28(4), '
                   '2013. As distributed with MATPOWER ({m}.m), © 2015, 2016 by the authors of the first reference, licensed under '
                   'the Creative Commons Attribution 4.0 International licence (https://creativecommons.org/licenses/by/4.0/). '
                   'Changes here: converted to the format of this project (elements in per unit); no value was changed. The data '
                   'are fictitious: they have the size and the complexity of a part of the European 380 and 220 kV network and do '
                   'not describe the real one. ' + GEN),
}


def text_of(m, folder):
    if folder:
        return (Path(folder) / f'{m}.m').read_text(encoding='utf-8', errors='replace')
    with urllib.request.urlopen(URL + m + '.m', timeout=60) as r:
        return r.read().decode('utf-8', errors='replace')


def main(folder=None):
    for name, (m, f, title, source) in CASES.items():
        text = text_of(m, folder) + '\n'
        net = N.read_matpower(text)
        if 'convert branch impedances from Ohms to p.u.' in text:
            # the two feeders: the matrices of the file are in Ω and kW, and the file converts them in code
            zb = net.buses[next(iter(net.buses))]['Un'] ** 2 / net.S_base
            for e in net.elements:
                if e['kind'] == 'branch':
                    e['r'], e['x'] = e['r'] / zb, e['x'] / zb
                elif e['kind'] == 'load':
                    e['P'], e['Q'] = e['P'] / 1e3, e['Q'] / 1e3
        new = N.to_dict(net)
        # the bus voltages of the file (magnitude in pu, angle in degrees): the published load-flow solution, where the file has one
        bus = N._matrix(text, 'bus')
        sol = {str(int(r[0])): [r[7], r[8]] for r in bus}
        solved = len({round(v[1], 6) for v in sol.values()}) > 2
        path = N.DATA / f'{name}.json'
        if f is None:
            # the files of 4.2: keep them, add only the data of the optimal power flow, element by element
            d = json.loads(path.read_text(encoding='utf-8'))
            by = {e['name']: e for e in new['elements']}
            for e in d['elements']:
                for k in ('Pmin', 'Pmax', 'cost', 'rating'):
                    if k in by.get(e['name'], {}):
                        e[k] = by[e['name']][k]
            d['source'] = d['source'].replace(f' ({m}.m, 3-clause BSD)', f' ({m}.m)').replace(' ' + OPF, '').rstrip() + ' ' + OPF
        else:
            d = {**new, 'f': f, 'name': title, 'source': source.format(m=m)}
        d.pop('solution', None)
        if solved:
            d['solution'] = sol
        # (4.19.3: a network of over a thousand buses in one line per file, a third smaller)
        big = len(d['buses']) > 1000
        path.write_text(json.dumps(d, ensure_ascii=False, **({'separators': (',', ':')} if big else {'indent': 1})) + '\n', encoding='utf-8')
        print(f'{name}: {len(d["buses"])} ζυγοί, {sum(e["kind"] == "branch" for e in d["elements"])} κλάδοι, '
              f'{sum(e["kind"] == "generator" for e in d["elements"])} γεννήτριες → {path.relative_to(ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else None))
