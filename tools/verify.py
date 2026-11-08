"""Verification report: the browser solver against independent references (closed-form results, standards,
textbook problems, the SciPy solver). Runs the solver cases in Node and writes docs/VERIFICATION.md.

    python tools/verify.py            # run and write the report
    python tools/verify.py --check    # run, fail (exit 1) if any value is outside its tolerance

Every expected value below is computed here, in Python, from the formula or the standard it cites, never taken from
the solver itself. The full test suite (python -m unittest discover -s tests) checks more; the table at the end maps
each test to its reference.
"""
import json
import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from engine import __version__  # noqa: E402

CASES = ROOT / 'tests' / 'js' / 'sim_cases.js'
OUT = ROOT / 'docs' / 'VERIFICATION.md'


def run_cases():
    r = subprocess.run(['node', str(CASES)], capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise SystemExit(r.stderr)
    return json.loads(r.stdout)


def checks(o):
    """Rows: (area, quantity, reference, expected, simulated, tolerance (absolute), unit)."""
    rows = []
    add = lambda *a: rows.append(a)
    # DC-DC converters, closed form
    add('DC-DC', 'buck CCM: V_o', 'V_o = D·V_in', 12.0, o['buck_ccm']['vo'], .01, 'V')
    add('DC-DC', 'buck CCM: Δi_L', 'Δi = (V_in − V_o)·D/(L·f_s)', (24 - 12) * .5 / (100e-6 * 100e3), o['buck_ccm']['il']['pp'], .002, 'A')
    K = 2 * 10e-6 / (50 / 100e3)
    add('DC-DC', 'buck DCM: V_o', 'V_o = 2V_in/(1 + √(1 + 4K/D²)), K = 2L/(RT)', 24 * 2 / (1 + math.sqrt(1 + 4 * K / .3 ** 2)), o['buck_dcm']['vo'], .02, 'V')
    K = 2 * 10e-6 / (100 / 50e3)
    add('DC-DC', 'boost DCM: V_o', 'V_o = V_in·(1 + √(1 + 4D²/K))/2', 12 * (1 + math.sqrt(1 + 4 * .3 ** 2 / K)) / 2, o['boost_dcm']['vo'], .05, 'V')
    add('DC-DC', 'flyback CCM: V_o', 'V_o = V_in·n·D/(1 − D)', 24 * .5 * .4 / .6, o['flyback']['vo'], .03, 'V')
    # rectifiers
    a = math.radians(60)
    add('Ανορθωτές', 'γέφυρα θυρίστορ, R, α = 60°', 'V_d = (V_m/π)·(1 + cos α)', 325 / math.pi * (1 + math.cos(a)), o['scr1']['vR'], .3, 'V')
    add('Ανορθωτές', 'γέφυρα θυρίστορ, R–L, α = 60°', 'V_d = (2V_m/π)·cos α', 2 * 325 / math.pi * math.cos(a), o['scr1']['vRL'], .3, 'V')
    vd = 3 * math.sqrt(3) / math.pi * 325
    add('Ανορθωτές', 'τριφασική γέφυρα 6 παλμών', 'V_d = 3√3·V_m/π', vd, o['bridge3']['vd'], .002 * vd, 'V')
    # control phenomena
    m2 = 24 * .6 / 50e-6
    add('Έλεγχος', 'peak current-mode, D = 0,6, ράμπα m₂/2: κορυφή', 'Î = i_c − m_a·D·T', 5 - .5 * m2 * .6 * 1e-5, o['pcm_0.6_0.5_500']['pk'][-1], 5e-4, 'A')
    add('Σήματα', 'τετραγωνικός ±5 A: THD', 'THD = √(π²/8 − 1)', 100 * math.sqrt(math.pi ** 2 / 8 - 1), o['harm']['thdAll'], .05, '%')
    add('Σήματα', 'τετραγωνικός ±5 A: θεμελιώδης', 'A₁ = 4·5/π', 20 / math.pi, o['harm']['A1'], 2e-3, 'A')
    # machines
    add('Μηχανές', 'μηχανή ΣΡ, μόνιμη ταχύτητα με φορτίο', 'ω = (V·ψ − R_a·τ_L)/(ψ² + R_a·b)', (100 - .5 * 20) / (1 + .5 * .002), o['dcm']['sched'][-1][1], .01, 'rad/s')
    # lightning current, IEC 62305-1
    lg = o['lightning']['10/350']
    add('Κεραυνικά', '10/350 μs, 200 kA: φορτίο', 'IEC 62305-1, Πίνακας 3: Q = 100 C', 100, lg['Q'], 3, 'C')
    add('Κεραυνικά', '10/350 μs, 200 kA: ειδική ενέργεια', 'IEC 62305-1: W/R = 10 MJ/Ω', 10e6, lg['W'], .5e6, 'J/Ω')
    add('Κεραυνικά', '10/350 μs: T1', 'T1 = 1,25·(t₉₀ − t₁₀)', 10e-6, lg['T1'], .2e-6, 's')
    f = o['lightning']['fit']
    add('Κεραυνικά', 'προσαρμογή 10/350: τ₁', 'IEC 62305-1, Παράρτημα Β: τ₁ = 19 μs', 19e-6, f['tau1'], .5e-6, 's')
    add('Κεραυνικά', 'προσαρμογή 10/350: η', 'IEC 62305-1: η = 0,93', .93, f['eta'], .002, '')
    # traveling waves (3.8): lattice written out: E = 1 V behind 200 Ω, Z = 400 Ω, R_L = 1200 Ω
    t = o['tl38']
    a0, gs, gl = 2 / 3, -1 / 3, .5
    add('Οδεύοντα κύματα', 'v_B στο 1,5τ (πρώτη άφιξη)', 'v⁺·(1 + Γ_L), v⁺ = E·Z/(R_s + Z)', a0 * (1 + gl), t['v'][1][1], 1e-6, 'V')
    add('Οδεύοντα κύματα', 'v_B στο 3,5τ', '+ v⁺·Γ_s·Γ_L·(1 + Γ_L)', a0 * (1 + gl) * (1 + gs * gl), t['v'][2][1], 1e-6, 'V')
    add('Οδεύοντα κύματα', 'v_A στο 3,5τ', 'v⁺·(1 + Γ_L·(1 + Γ_s))', a0 * (1 + gl * (1 + gs)), t['v'][2][0], 1e-6, 'V')
    add('Οδεύοντα κύματα', 'τελική τιμή', 'E·R_L/(R_s + R_L)', 1200 / 1400, t['v'][-1][1], 1e-6, 'V')
    li = t['imp']['1.2/50']
    add('Κρουστική τάση', '1,2/50: α', 'Voltage Impulse GUI 1.1 (test): α = 1,46591·10⁴ s⁻¹', 1.46591e4, li['alpha'], 5e-4 * 1.46591e4, 's⁻¹')
    add('Κρουστική τάση', '1,2/50: β', 'Voltage Impulse GUI 1.1: β = 2,46893·10⁶ s⁻¹', 2.46893e6, li['beta'], 5e-4 * 2.46893e6, 's⁻¹')
    add('Κρουστική τάση', '1,2/50 στην προσομοίωση: T1', 'IEC 60060-1: T1 = 1,67·(t₉₀ − t₃₀)', 1.2e-6, t['li']['T1'], 1e-9, 's')
    add('Κρουστική τάση', '1,2/50 στην προσομοίωση: T2', 'IEC 60060-1: T2 από την εικονική αρχή', 50e-6, t['li']['T2'], 1e-8, 's')
    # unconnected and floating parts (3.7)
    i = o['solve37']['isl']
    add('Επίλυση', 'δευτερεύον χωρίς γείωση: τάση στο R₂', 'n·V_m·R₂/(R₂ + R₃)', 5.0, i['auto']['vR2'], 1e-6, 'V')
    add('Επίλυση', '«αυτόματα»: τάση κόμβου ως προς τη γη', 'μέση τάση του τμήματος 0 V', -1.25, i['auto']['vp'], 1e-6, 'V')
    add('Επίλυση', 'ασύνδετο R και πηγή ρεύματος σε ανοιχτό', 'ίδιο ρεύμα πηνίου με το κύκλωμα χωρίς αυτά', 0.0, o['solve37']['r']['warn']['dI'], 1e-7, 'A')
    return rows


TESTS = [
    ('tests/test_studio_sim.py', 'λύτης του browser', 'κλειστοί τύποι DC-DC και ανορθωτών, ανεξάρτητες ΔΕ (μηχανές ΣΡ, επαγωγής, σύγχρονη, SRM, συζευγμένα πηνία), IEC 62305-1, IEC 60060-1, πλέγμα Bewley, δειγματοληψία, μπλοκ σημάτων'),
    ('tests/test_tutorials.py', 'tutorials όπως ανοίγουν στην εφαρμογή', 'θεωρία των καρτών, ισοδύναμα κυκλώματα, MTPA, ισοζύγιο ενέργειας SRM, μέθοδος των χαρακτηριστικών, άσκηση 15.4.9 του βιβλίου «Υψηλές Τάσεις»'),
    ('tests/test_batch.py', 'λύτης SciPy (solve_ivp) στο ίδιο netlist', 'δεύτερος, ανεξάρτητος λύτης: ίδιες κυματομορφές σε 1e-4 … 1e-5'),
    ('tests/test_templates.py, test_engine.py', 'συμβολική λύση και templates', 'λύσεις των ασκήσεων (PE2, Άσκηση 2) με SymPy'),
    ('tests/ui/*.js', 'περιβάλλον (Playwright)', 'σχέδιο, scopes, πάνελ, εργαλείο σύρματος, ζωντανές παράμετροι'),
]

LIMITS = [
    'Η γραμμή μεταφοράς είναι χωρίς απώλειες, και δεν υπάρχει ακόμη στον λύτη SciPy. Επαληθεύεται με τη μέθοδο των χαρακτηριστικών και με κλειστούς τύπους.',
    'Δεν υπάρχουν ακόμη μη γραμμική αντίσταση (MOV), σπινθηριστής, κορεσμός πυρήνα μετασχηματιστή, γραμμές εξαρτώμενες από τη συχνότητα (ROADMAP §26, §31, §37).',
    'Οι μηχανές έχουν τυπικές τιμές όπου λείπουν δεδομένα (π.χ. διπλωματική ). Ελέγχονται απέναντι σε ανεξάρτητες ΔΕ, όχι σε μετρήσεις.',
    'Ο λύτης είναι πυκνός και τρέχει σε ένα thread (ROADMAP §32).',
]


def fmt(v, unit):
    if unit in ('', '%', 's⁻¹'):                     # no SI prefixes for these
        return (f'{v:.6g}'.replace('.', ',') + (' ' + unit if unit else '')).replace('e+0', '·10^').replace('e-0', '·10^-')
    if v == 0:
        return '0' + (' ' + unit if unit else '')
    a = abs(v)
    for k, p in ((1e9, 'G'), (1e6, 'M'), (1e3, 'k'), (1, ''), (1e-3, 'm'), (1e-6, 'μ'), (1e-9, 'n'), (1e-12, 'p')):
        if a >= k * .9999995:
            return f'{v / k:.5g} {p}{unit}'.replace('.', ',').strip()
    return f'{v:.4g} {unit}'.replace('.', ',')


def report(rows):
    ok = all(abs(s - e) <= tol for _, _, _, e, s, tol, _ in rows)
    out = [
        '# Αναφορά επαλήθευσης',
        '',
        f'Έκδοση {__version__}. Παράγεται με `python tools/verify.py`. Ο CI τρέχει `python tools/verify.py --check` και σταματά αν κάποια τιμή βγει εκτός ανοχής.',
        '',
        '**Πώς διαβάζεται:**',
        '- Η «Αναφορά» είναι ανεξάρτητη από τον λύτη: κλειστός τύπος, πρότυπο, πρόβλημα βιβλίου ή εργαλείο τρίτου.',
        '- Η «Αναμενόμενη» τιμή υπολογίζεται στο `tools/verify.py` από αυτήν, όχι από τον κώδικα του λύτη.',
        '- Η «Προσομοίωση» είναι ο λύτης του browser (`web/studio/mna.js`), τρεγμένος στο Node.',
        '',
        f'**Αποτέλεσμα:** {sum(abs(s - e) <= tol for _, _, _, e, s, tol, _ in rows)} από {len(rows)} μέσα στην ανοχή.' + ('' if ok else ' **Υπάρχουν τιμές εκτός ανοχής.**'),
        '',
        '| Περιοχή | Μέγεθος | Αναφορά | Αναμενόμενη | Προσομοίωση | Διαφορά | Ανοχή | |',
        '|---|---|---|---:|---:|---:|---:|---|',
    ]
    for area, q, ref, e, s, tol, u in rows:
        d = s - e
        ds = '≈ 0' if abs(d) < 1e-4 * tol else fmt(d, u)
        out.append(f'| {area} | {q} | {ref} | {fmt(e, u)} | {fmt(s, u)} | {ds} | {fmt(tol, u)} | {"✓" if abs(d) <= tol else "✗"} |')
    out += ['', '## Τι καλύπτουν τα υπόλοιπα tests', '', '| Αρχείο | Τι ελέγχει | Αναφορές |', '|---|---|---|']
    out += [f'| `{a}` | {b} | {c} |' for a, b, c in TESTS]
    out += ['', 'Μαζί 148+ tests. Τρέχουν σε κάθε push στον CI του GitHub (`.github/workflows/ci.yml`).', '',
            '## Γνωστοί περιορισμοί', '']
    out += [f'- {x}' for x in LIMITS]
    out += ['', '## Λάθη που βρήκε ο έλεγχος σε υλικό αναφοράς', '',
            '- «Υψηλές Τάσεις», άσκηση 15.4.4 (Ferranti): η λύση βάζει το μήκος δύο φορές, cos(7,2°·1,2·120). Σωστό: 75 kV / cos 8,64° = 75,86 kV αντί για 102,89 kV.',
            '- «Υψηλές Τάσεις», άσκηση 15.4.9: στη λύση το B στο 2τ λογίζεται με α_B = −0,47 και το A στο 3τ με το ίδιο κύμα ανακλασμένο με −1. Λείπει και το κύμα που ξεκινά από το B όταν ανάβει το αλεξικέραυνο. Οι ακριβείς τιμές είναι στο tutorial «Οδεύοντα κύματα».',
            '']
    return '\n'.join(out), ok


def main():
    o = run_cases()
    rows = checks(o)
    text, ok = report(rows)
    bad = [r for r in rows if abs(r[4] - r[3]) > r[5]]
    for r in bad:
        print(f'εκτός ανοχής: {r[0]} · {r[1]}: αναμενόμενη {r[3]}, προσομοίωση {r[4]}, ανοχή {r[5]}', file=sys.stderr)
    if '--check' in sys.argv:
        print(f'{len(rows) - len(bad)}/{len(rows)} μέσα στην ανοχή')
        sys.exit(1 if bad else 0)
    OUT.write_text(text + '\n', encoding='utf-8')
    print(f'Γράφτηκε {OUT.relative_to(ROOT)}: {len(rows) - len(bad)}/{len(rows)} μέσα στην ανοχή')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
