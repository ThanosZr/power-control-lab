"""4.21 (ROADMAP §87): the spectrum of a source from an EMT run for the harmonic load flow (pcl.harmonic.spectrum_from, the bridge of
§80 to the EMT of the studio). The tutorial harm_emt runs headless (tests/js/harm_emt_cases.js): a six-pulse bridge with a level
direct current behind the inductance L_s of commutation, and the Fourier blocks of 4.19.6 on the current of phase a. The references:
the spectrum of the ideal bridge of the study (pcl.harmonic.six_pulse, 1/h with its signs) without L_s; with L_s the waveform of a
level direct current through the commutation (our own derivation from L_s·di/dt = (v_a − v_c)/2: i_a = √3·V̂/(2ωL_s)·(cos α −
cos(θ − 30°)) over the overlap μ, cos α − cos(α + μ) = 2ωL_s·I_d/(√3·V̂)), its Fourier series by quadrature; the harmonic load flow
with the spectrum of the ideal bridge."""
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

from pcl import harmonic as H
from pcl import network as N
from pcl import study as S

ROOT = Path(__file__).resolve().parents[1]


def overlap(Vpk, f, Ls, alpha, Id, orders, n=200000):
    """The Fourier phasors (peak, phase on sin from t = 0) of the current of phase a of a six-pulse bridge with a level direct
    current Id, delay alpha (°) and commutation through Ls, fed by v_a = V̂·sin ωt (positive sequence)."""
    w, a = 2 * math.pi * f, math.radians(alpha)
    mu = math.acos(math.cos(a) - 2 * w * Ls * Id / (math.sqrt(3) * Vpk)) - a if Ls > 0 else 0.0
    th = np.arange(n) * 2 * math.pi / n

    def rise(x):                                  # from 0 to Id over the overlap, from the start of the commutation
        if Ls == 0:
            return np.where(x >= 0, Id, 0.0)
        return np.where(x < 0, 0.0, np.where(x > mu, Id, math.sqrt(3) * Vpk / (2 * w * Ls) * (math.cos(a) - np.cos(x + a))))

    t = np.mod(th - math.radians(30) - a, 2 * math.pi)
    i = rise(t) - rise(t - 2 * math.pi / 3) - rise(t - math.pi) + rise(t - math.pi - 2 * math.pi / 3)
    out = {}
    for h in orders:
        A, B = 2 * np.mean(i * np.sin(h * th)), 2 * np.mean(i * np.cos(h * th))
        out[h] = (math.hypot(A, B), math.degrees(math.atan2(B, A)))
    return out, math.degrees(mu)


def wrap(a):
    return (a + 180.0) % 360.0 - 180.0


class SpectrumFrom(unittest.TestCase):
    def test_the_convention(self):
        # a waveform moved in time keeps its spectrum; the same waveform on the cosine gives the same spectrum; the six-pulse series
        # on the sine of the books (sin ωt − sin 5ωt/5 − sin 7ωt/7 + sin 11ωt/11 + …) gives the spectrum of the study
        book = {1: (1.0, 0.0), 5: (0.2, 180.0), 7: (1 / 7, 180.0), 11: (1 / 11, 0.0), 13: (1 / 13, 0.0)}
        sp = H.spectrum_from(book)
        ideal = H.six_pulse()
        for h in book:
            self.assertAlmostEqual(sp[h][0], ideal[h][0], places=12)
            self.assertAlmostEqual(wrap(sp[h][1] - ideal[h][1]), 0.0, places=9)
        for d in (17.0, -123.0):
            moved = {h: (m * 3.0, p + h * d) for h, (m, p) in book.items()}
            cos = {h: (m, p - 90.0) for h, (m, p) in moved.items()}
            for other in (H.spectrum_from(moved), H.spectrum_from(cos, 'cos')):
                for h in book:
                    self.assertAlmostEqual(other[h][0], sp[h][0], places=12)
                    self.assertAlmostEqual(wrap(other[h][1] - sp[h][1]), 0.0, places=9)

    def test_refusals(self):
        for bad in ({5: (0.2, 0)}, {1: (0.0, 0.0)}, {1: (1.0, float('nan'))}, {1: (1, 0), 0: (1, 0)}, 'x'):
            with self.assertRaises(H.HarmonicError):
                H.spectrum_from(bad)
        with self.assertRaises(H.HarmonicError):
            H.spectrum_from({1: (1, 0)}, 'tan')
        with self.assertRaises(H.HarmonicError):
            N.case_data('harmonic14').harmonics(spectra={'nobody': 'six_pulse'})


@unittest.skipUnless(shutil.which('node'), 'node not installed')
class Tutorial(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        out = subprocess.run(['node', str(ROOT / 'tests' / 'js' / 'harm_emt_cases.js')], capture_output=True, text=True, timeout=1800, cwd=ROOT)
        if out.returncode:
            raise RuntimeError(out.stderr[-2000:])
        cls.js = json.loads(out.stdout)

    def test_every_run_against_the_commutation(self):
        # measured: magnitudes within 0.0014 of the fundamental (the ripple of the direct current, largest at α = 40°), phases
        # within 0.32°; the overlap from 0 to 21.5° (diodes, L_s = 2 mH)
        self.assertEqual(len(self.js['runs']), 9)
        for r in self.js['runs']:
            self.assertEqual(r['warn'], [], (r['Ls'], r['dev']))
            self.assertEqual(r['keys'], r['panes'])
            m = r['meta']
            self.assertAlmostEqual(r['Id'], m['Id'], delta=0.002 * m['Id'])                  # the direct current of the card
            orders = [int(h) for h in r['four']]
            th, mu = overlap(m['Vpk'], m['f'], m['Ls'], m['alpha'], r['Id'], orders)
            got, ref = H.spectrum_from(r['four']), H.spectrum_from(th)
            for h in orders:
                self.assertAlmostEqual(got[h][0], ref[h][0], delta=0.0015, msg=(r['Ls'], r['dev'], h))
                self.assertAlmostEqual(wrap(got[h][1] - ref[h][1]), 0.0, delta=0.5, msg=(r['Ls'], r['dev'], h))
            if m['Ls'] == 0:
                ideal = H.six_pulse()
                for h in orders:
                    self.assertAlmostEqual(got[h][0], ideal[h][0], delta=0.0015)
                    self.assertAlmostEqual(wrap(got[h][1] - ideal[h][1]), 0.0, delta=0.5)
        mus = {(r['Ls'], r['dev']): overlap(r['meta']['Vpk'], r['meta']['f'], r['meta']['Ls'], r['meta']['alpha'], r['Id'], [1])[1] for r in self.js['runs']}
        self.assertAlmostEqual(mus[('0.002', 'diode')], 21.48, delta=0.05)
        self.assertLess(mus[('0.002', '40')], mus[('0.002', '15')])

    def test_the_study_with_the_spectrum_of_the_run(self):
        # the ideal bridge from the EMT against the ideal bridge of the study: the same distortion to the rounding of the measurement
        ideal = [r for r in self.js['runs'] if r['Ls'] == '0' and r['dev'] == 'diode'][0]
        e = ideal['emt']
        spectra = {name: {'fourier': ideal['four'], 'ref': 'sin'} for name in e['loads']}
        got = S.run({'case': 'harmonic14', 'study': 'harmonic', 'options': {'spectra': spectra}})['summary']
        cut = {h: v for h, v in H.six_pulse().items() if str(h) in ideal['four']}             # the same orders as the run measures
        ref = S.run({'case': 'harmonic14', 'study': 'harmonic', 'options': {'spectra': {name: cut for name in e['loads']}}})['summary']
        self.assertTrue(got['converged'])
        self.assertAlmostEqual(got['worst']['THD'], ref['worst']['THD'], delta=0.01 * ref['worst']['THD'])
        self.assertEqual(got['worst']['bus'], ref['worst']['bus'])
        src = {q['load']: q for q in got['sources']}
        self.assertEqual(set(src), {'hvdc1', 'hvdc2', 'tcr'})
        self.assertNotIn('spec', src['tcr'])
        self.assertAlmostEqual(src['hvdc1']['spec']['5'][0], 0.2, delta=0.0015)                 # (the orders as JSON keys)
        # with L_s = 2 mH the higher orders fall, and so does the distortion
        lo = [r for r in self.js['runs'] if r['Ls'] == '0.002' and r['dev'] == 'diode'][0]
        less = S.run({'case': 'harmonic14', 'study': 'harmonic', 'options': {'spectra': {n: {'fourier': lo['four']} for n in e['loads']}}})['summary']
        self.assertLess(less['worst']['THD'], got['worst']['THD'])

    def test_the_card(self):
        c = self.js['card']
        self.assertEqual([q['k'] for q in c['options']], ['Ls', 'dev'])
        e = self.js['runs'][0]['emt']
        self.assertEqual(sorted(int(h) for h in e['orders']), [1, 5, 7, 11, 13, 17, 19, 23, 25])
        self.assertEqual(e['loads'], [s['load'] for s in H.sources_of(N.case_data('harmonic14')) if s['spectrum'] == 'hvdc'])


if __name__ == '__main__':
    unittest.main()
