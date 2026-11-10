"""Add-ons, the link to outside programs and the impulse tools (3.15, ROADMAP §35, §36)."""
import base64
import io
import json
import shutil
import sys
import tempfile
import threading
import unittest
import zipfile
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from engine import addons as A  # noqa: E402
from pcl import impulse as I  # noqa: E402

# a row of each of the reference tools' CSV files (branch ref-materials), as the tools wrote them
LIM_CSV = ('name,H_mode,H_input,H_used,Im_A,peak_guess_A,n,tau1_guess_us,tau2_guess_us,tau1_opt_us,tau2_opt_us,T1_target_us,T2_target_us,'
           'T1_guess_calc_us,T2_guess_calc_us,T1_guess_err_pct,T2_guess_err_pct,Peak_guess_err_pct,peak_opt_A,T1_opt_calc_us,T2_opt_calc_us,'
           'T1_opt_err_pct,T2_opt_err_pct,Peak_opt_err_pct,source,created_at\n'
           'T1_1_T2_200_Ip_-100000,AutoH,0.93,0.986296525678929,-100000,-100000,10,1.8319,284.844,1.83192713504729,284.843991112265,1,200,'
           '0.999985243086879,199.999973507989,0.00147569131210279,1.32460052668648e-05,0,-100000,0.999999999998843,199.999999999599,'
           '1.15707443626434e-10,2.00586214305076e-10,1.45519152283669e-14,computed,2026-09-15 12:18:24\n')
VIG_HEAD = ('name,standard_code,standard_name,fit_method,polarity,Vp_target_kV,Vpeak_calc_kV,alpha_s_inv,beta_s_inv,K,target_X_us,target_Y_us,'
            'selected_X_calc_us,selected_Y_calc_us,selected_X_err_pct,selected_Y_err_pct,peak_err_pct,T1_IEC_us,T2_IEC_us,Tp_virtual_us,'
            'Tp_AnnexF_us,t10_90_us,t50_actual_us,t_peak_actual_us,virtual_origin_us,t30_us,t90_us,T1_sampled_us,T2_sampled_us,'
            'analytic_sample_T1_diff_pct,analytic_sample_T2_diff_pct,tol_peak_pct,tol_X_pct,tol_Y_pct,dt_effective_s,tend_effective_s,'
            'overall_pass,standard_note,source,created_at\n')
VIG_LI = (VIG_HEAD + 'V_100_kV_X_1p2_Y_50_IEC_T1_T2,IEC2025_LI,IEC 60060-1:2025 full lightning impulse 1.2/50 us,IEC_T1_T2,Positive,100,'
          '99.9999999284624,14659.1086811327,2468926.6530487,1.03725220061775,1.2,50,1.20000000000291,49.9999999999634,2.42287671407363e-10,'
          '-7.32143234927207e-11,-7.15376273774382e-08,1.20000000000291,49.9999999999634,2.3093569732393,1.74623932800422,0.818111018364941,'
          '49.7794441838297,2.08880115710557,-0.220555816133733,0.139444183867139,0.859444183868884,1.20000001825348,49.9999997488279,'
          '1.52088122047195e-06,-5.02270886557792e-07,3,30,20,1e-09,0.0001,1,Current standard LI: T1 by 30%-90% virtual-front geometry.,computed,2026-09-14 15:21:51\n')


class Impulse(unittest.TestCase):
    """pcl.impulse against the reference tools' own results (their CSV files)."""

    def test_heidler_as_the_lightning_impulse_manager(self):
        r = I.fit_heidler(1e-6, 200e-6, -100000, 10, 'auto')
        ref = I.read_heidler_csv(LIM_CSV)[0]['params']
        for k in ('tau1', 'tau2', 'eta'):
            self.assertAlmostEqual(r[k], ref[k], delta=1e-5 * ref[k])           # the tool measures on 1 ns samples, here analytically
        self.assertAlmostEqual(r['peak'], -100000, delta=1e-6)
        self.assertLess(abs(r['T1_err_pct']) + abs(r['T2_err_pct']), 1e-6)
        f = I.fit_heidler(1e-6, 200e-6, -100000, 10, 'fixed', 0.93)            # FixedH: the same shape, peak I_m·max/η
        self.assertAlmostEqual(f['tau1'], r['tau1'], delta=1e-12)
        self.assertAlmostEqual(f['peak'], -100000 * r['eta'] / 0.93, delta=1e-3)
        # IEC 62305-1 10/350: τ₁ ≈ 19 μs, τ₂ ≈ 485 μs, η ≈ 0.93 (the table of the standard, rounded)
        s = I.fit_heidler(10e-6, 350e-6, 200e3)
        self.assertAlmostEqual(s['tau1'], 19e-6, delta=0.2e-6)
        self.assertAlmostEqual(s['eta'], 0.93, delta=0.002)

    def test_voltage_as_the_voltage_impulse_gui(self):
        li = I.fit_profile('IEC2025_LI', 100e3)
        ref = I.read_voltage_csv(VIG_LI)[0]['params']
        for k in ('alpha', 'beta', 'K'):
            self.assertAlmostEqual(li[k], ref[k], delta=1e-8 * ref[k])
        self.assertTrue(li['check']['pass'])
        si = I.fit_profile('IEC2010_SI_LEGACY', 30e3)                           # Tp/T2: 250/2500 (the tool's second CSV)
        self.assertAlmostEqual(si['alpha'], 316.955654538579, delta=1e-6 * 317)
        self.assertAlmostEqual(si['beta'], 16004.3786899236, delta=1e-6 * 16004)
        self.assertAlmostEqual(si['K'], 1.1043334671077, delta=1e-7)
        # the three bases give the same wave for the same shape
        t = I.fit_voltage(li['t10_90'], li['t50'], 1, 'T10_90_T50')
        self.assertAlmostEqual(t['alpha'], li['alpha'], delta=1e-6 * li['alpha'])
        # a 1.2/50 wave checked against the switching-impulse profile fails, and a front 40 % off fails the LI check
        self.assertFalse(I.check_voltage(li['alpha'], li['beta'], li['K'], 100e3, 'IEC2025_SI')['pass'])
        far = I.fit_voltage(1.2e-6 * 1.4, 50e-6, 100e3)
        c = I.check_voltage(far['alpha'], far['beta'], far['K'], 100e3, 'IEC2025_LI')
        self.assertFalse(c['pass'])
        self.assertEqual([x['name'] for x in c['criteria'] if not x['pass']], ['T1'])

    def test_sources_take_the_parameters_as_they_are(self):
        # the app's sources (shape 'direct') with the tools' parameters give the tools' times
        import subprocess
        js = ("global.window=globalThis;const P=require('./web/studio/parts.js');"
              "const w=P.lightningWave({shape:'direct',Ipk:-100000,tau1:'1.83192713504729e-6',tau2:'284.843991112265e-6',eta:'0.986296525678929',n:10});"
              "const v=P.impulseWave({shape:'direct',Vpk:100e3,alpha:14659.1086811327,beta:2468926.6530487,K:1.03725220061775});"
              "console.log(JSON.stringify({i:[w.T1,w.T2,w.I0/w.eta*w.peak],v:[v.T1,v.T2,v.I0/v.eta*v.peak]}));")
        o = json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, cwd=str(ROOT), check=True).stdout)
        self.assertAlmostEqual(o['i'][0], 1e-6, delta=1e-11)
        self.assertAlmostEqual(o['i'][1], 200e-6, delta=1e-9)
        self.assertAlmostEqual(o['i'][2], -100000, delta=0.01)
        self.assertAlmostEqual(o['v'][0], 1.2e-6, delta=1e-12)
        self.assertAlmostEqual(o['v'][1], 50e-6, delta=1e-10)
        self.assertAlmostEqual(o['v'][2], 100e3, delta=1e-6)


def _zip(files):
    b = io.BytesIO()
    with zipfile.ZipFile(b, 'w') as z:
        for n, t in files.items():
            z.writestr(n, t)
    return base64.b64encode(b.getvalue()).decode()


class Addons(unittest.TestCase):
    def setUp(self):
        self.home = Path(tempfile.mkdtemp(prefix='pcl-home-'))
        self.keep = (A.HOME, A.USER)
        A.HOME, A.USER = self.home, self.home / 'addons'

    def tearDown(self):
        A.HOME, A.USER = self.keep
        shutil.rmtree(self.home, ignore_errors=True)

    def test_builtin_listing(self):
        L = {a['id']: a for a in A.listing()}
        a = L['impulse-params']
        self.assertTrue(a['builtin'])
        self.assertEqual({t['type'] for t in a['targets']}, {'ILG', 'VIMP'})
        self.assertIn('project.write', a['permissions'])

    def test_install_and_remove(self):
        man = {'id': 'my-tool', 'name': 'Δικό μου', 'version': '0.1', 'entry': 'index.html', 'permissions': ['project.read', 'root']}
        a = A.install({'zip': _zip({'my-tool/pcl-addon.json': json.dumps(man), 'my-tool/index.html': '<p>x</p>', 'my-tool/ui.js': ''})})
        self.assertEqual(a['id'], 'my-tool')
        self.assertEqual(a['permissions'], ['project.read'])          # unknown permissions are dropped
        self.assertTrue((A.USER / 'my-tool' / 'ui.js').is_file())
        self.assertIsNotNone(A.user_file('my-tool/index.html'))
        self.assertIsNone(A.user_file('my-tool/../../etc/passwd'))
        self.assertIn('my-tool', [x['id'] for x in A.listing()])
        A.remove({'id': 'my-tool'})
        self.assertNotIn('my-tool', [x['id'] for x in A.listing()])
        for bad in ({'pcl-addon.json': json.dumps({**man, 'id': 'Bad Id'}), 'index.html': ''},
                    {'pcl-addon.json': json.dumps(man), '../evil.py': '', 'index.html': ''},
                    {'pcl-addon.json': json.dumps({**man, 'id': 'impulse-params'}), 'index.html': ''},
                    {'pcl-addon.json': json.dumps({**man, 'entry': 'nothing.html'})}):
            with self.assertRaises(A.AddonError):
                A.install({'zip': _zip(bad)})
        self.assertFalse(any(p.name.startswith('.install') for p in self.home.iterdir()))

    def test_link(self):
        L = A.Link()
        with self.assertRaises(A.AddonError):                          # no page asks for calls
            L.call('info', {})
        got = []

        def page():                                                   # what the page does: take a call, answer it
            c = L.next(5)
            got.append(c)
            L.reply(c['id'], {'result': {'echo': c['args'], 'm': c['method']}})
        L.seen = __import__('time').time()
        t = threading.Thread(target=page)
        t.start()
        out = L.call('set', {'key': 'R1.R', 'value': 5}, timeout=5)
        t.join()
        self.assertEqual(out['result'], {'echo': {'key': 'R1.R', 'value': 5}, 'm': 'set'})
        # a page that closed while it waited does not take the next call
        self.assertIsNone(L.next(0.2, alive=lambda: False))
        with self.assertRaises(A.AddonError):
            L.call('rm -rf', {})


class Server(unittest.TestCase):
    """The server's side: only this computer, the Host header checked (no DNS rebinding), the token."""

    @classmethod
    def setUpClass(cls):
        from run import Handler, LINK
        cls.LINK = LINK
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def req(self, path, data=None, host=None):
        h = {'Content-Type': 'application/json'}
        if host:
            h['Host'] = host
        r = Request(self.url + path, data=json.dumps(data).encode() if data is not None else None, headers=h)
        try:
            with urlopen(r, timeout=30) as x:
                body = x.read()
                return x.status, (json.loads(body) if 'json' in (x.headers.get('Content-Type') or '') and body else body)
        except HTTPError as e:
            return e.code, json.load(e)

    def test_addons_and_link(self):
        s, j = self.req('/api/addons')
        self.assertEqual(s, 200)
        self.assertIn('impulse-params', [a['id'] for a in j['addons']])
        s, _ = self.req('/api/addons', host='evil.example:80')
        self.assertEqual(s, 403)
        s, j = self.req('/api/link/token')
        self.assertEqual(j['token'], self.LINK.token)
        s, j = self.req('/api/link/call', {'token': 'wrong', 'method': 'info'})
        self.assertEqual(s, 403)
        s, j = self.req('/api/link/call', {'token': self.LINK.token, 'method': 'info'})   # no page: an explanation, not a hang
        self.assertEqual(s, 400)
        self.assertIn('Σύνδεση', j['error'])
        # a page answers through the server
        tok = self.LINK.token

        def page():
            st, c = self.req('/api/link/next?token=' + tok)
            self.req('/api/link/reply', {'token': tok, 'id': c['id'], 'result': {'ok': c['method']}})
        self.LINK.seen = __import__('time').time()
        t = threading.Thread(target=page)
        t.start()
        s, j = self.req('/api/link/call', {'token': tok, 'method': 'info', 'timeout': 10})
        t.join()
        self.assertEqual((s, j), (200, {'result': {'ok': 'info'}}))
        s, _ = self.req('/addons/impulse-params/pcl-addon.json')
        self.assertEqual(s, 200)
        s, _ = self.req('/pcl/impulse.py')
        self.assertEqual(s, 200)
        s, _ = self.req('/pcl/__main__.py')
        self.assertEqual(s, 404)


if __name__ == '__main__':
    unittest.main()
