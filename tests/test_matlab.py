"""MATLAB/Octave functions of the pcl package (3.14, ROADMAP §30), run in Octave when it is installed."""
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HAS = shutil.which('octave') is not None and shutil.which('node') is not None


def octave(code):
    r = subprocess.run(['octave', '--no-gui', '--quiet', '--eval', f"addpath('{(ROOT / 'matlab').as_posix()}'); {code}"],
                       capture_output=True, text=True, timeout=600, cwd=str(ROOT))
    if r.returncode:
        raise RuntimeError(r.stderr + r.stdout)
    out = [x for x in r.stdout.splitlines() if x.startswith('JSON ')]
    return json.loads(out[-1][5:]) if out else r.stdout


@unittest.skipIf(not HAS, 'Octave (και Node.js) δεν είναι εγκατεστημένα· στον CI τρέχει σε δική του εργασία.')
class Octave(unittest.TestCase):
    def test_run_and_measure(self):
        o = octave("r = pcl_run('tutorial:buck?start=steady', {'L1.L', 47e-6}, struct('t_end', 1e-3, 'channels', {{'V:C1', 'I:L1'}}, "
                   "'measure', {{'Vo', 'V:C1', 'avg', 10}})); "
                   "printf('JSON %s\\n', jsonencode(struct('n', numel(r.t), 'vars', {r.vars}, 'vo', r.measure.Vo, 'last', r.V_C1(end), 'L', r.meta.changes.L1_L)));")
        self.assertGreater(o['n'], 10000)
        self.assertEqual(o['vars'], ['V_C1', 'I_L1'])
        self.assertAlmostEqual(o['vo'], 12, delta=0.1)
        self.assertEqual(o['L'], 47e-6)
        import pcl                                           # the same numbers as the Python package
        r = pcl.tutorial('buck', start='steady').set('L1.L', 47e-6).run(t_end=1e-3, channels=['V:C1', 'I:L1'])
        self.assertAlmostEqual(o['last'], r['V:C1'][-1], delta=1e-13 * abs(r['V:C1'][-1]))   # Octave's jsondecode can miss the last bit

    def test_run_saves_and_resumes(self):
        # 3.16: save_state, then resume to a later end time; the same numbers as one run of the Python package
        d = Path(tempfile.mkdtemp())
        try:
            o = octave(f"cd('{d.as_posix()}'); a = pcl_run('tutorial:buck', {{}}, struct('t_end', 1e-3, 'channels', {{{{'V:C1'}}}}, 'save_state', 'run.state')); "
                       "b = pcl_run('tutorial:buck', {}, struct('t_end', 2e-3, 'resume', 'run.state')); "
                       "printf('JSON %s\\n', jsonencode(struct('na', numel(a.t), 'nb', numel(b.t), 'last', b.V_C1(end), 't0', b.t(1))));")
            self.assertTrue((d / 'run.state').is_file())
            import pcl
            r = pcl.tutorial('buck').run(t_end=2e-3, channels=['V:C1'])
            self.assertEqual(o['na'] + o['nb'], len(r.t))
            self.assertAlmostEqual(o['last'], r['V:C1'][-1], delta=1e-13 * abs(r['V:C1'][-1]))
            self.assertGreater(o['t0'], 1e-3)
        finally:
            shutil.rmtree(d, ignore_errors=True)

    def test_sweep_ripple(self):
        o = octave("r = pcl_sweep('tutorial:buck?start=steady', {'L1.L', [50e-6 100e-6 200e-6]}, "
                   "struct('t_end', 8e-3, 'measure', {{'Vo', 'V:C1', 'avg', 10; 'dI', 'I:L1', 'pp', 10}})); "
                   "printf('JSON %s\\n', jsonencode(struct('L', r.L1_L, 'vo', r.Vo, 'di', r.dI)));")
        for L, vo, di in zip(o['L'], o['vo'], o['di']):
            th = vo * 0.5 / (L * 100e3)
            self.assertAlmostEqual(di, th, delta=0.03 * th)

    def test_bifurcation(self):
        # 3.15: the diagram through Octave, the same numbers as the Python package (and the app)
        o = octave("r = pcl_bifurcation('tutorial:pcm_chaos', 'IC.v', [1.5 2.5], struct('channel', 'Y:AM1', 'stat', 'end', 'transient', 300, 'record', 64)); "
                   "printf('JSON %s\\n', jsonencode(struct('p', r.period, 'sz', size(r.Y), 'y', r.Y(2, :))));")
        self.assertEqual(o['p'], [1, 4])
        self.assertEqual(o['sz'], [2, 64])
        import pcl
        b = pcl.tutorial('pcm_chaos').bifurcation('IC.v', [2.5], channel='Y:AM1', stat='end', transient=300, record=64, workers=1)
        for a, x in zip(o['y'], b.y[0]):                    # Octave's jsonencode writes 15–16 digits
            self.assertAlmostEqual(a, x, delta=1e-14 * abs(x))

    def test_link_to_the_app(self):
        # 3.15: MATLAB/Octave see the app through the link (PclApp over pcl_link): a server here, and a page that answers
        # as the app does (the real page is tested in tests/ui/addons_flow.js)
        import os
        import threading
        from http.server import ThreadingHTTPServer
        from run import Handler, LINK
        srv = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        home = Path(tempfile.mkdtemp(prefix='pcl-link-'))
        old = os.environ.get('PCL_HOME')
        os.environ['PCL_HOME'] = str(home)
        LINK.write_file(f'http://127.0.0.1:{srv.server_port}')
        params, seen, stop = {'R1.R': 10}, [], threading.Event()

        def page():
            while not stop.is_set():
                c = LINK.next(0.5)
                if not c:
                    continue
                m, a = c['method'], c['args']
                seen.append((m, a))
                if m == 'info':
                    res = {'tutorial': 'buck', 'T': 1e-5}
                elif m == 'get':
                    res = params[a['key']]
                elif m == 'set':
                    params[a['key']] = a['value']
                    res = {'key': a['key'], 'value': a['value']}
                elif m == 'run':
                    res = {'keys': ['V:C1'], 't': [0, 1e-3, 2e-3], 'ch': {'V:C1': [0, 6, 12]}, 'measure': {m2['name']: 12.0 for m2 in a.get('measure', [])}, 'meta': {'steps': 3}}
                else:
                    res = True
                LINK.reply(c['id'], {'result': res})
        th = threading.Thread(target=page, daemon=True)
        th.start()
        try:
            o = octave("app = PclApp('Octave test'); i = app.info(); app.setParam('R1.R', 20); v = app.param('R1.R'); "
                       "r = app.run('t_end', 2e-3, 'channels', {'V:C1'}, 'measure', {'Vo', 'V:C1', 'avg', 10}); "
                       "printf('JSON %s\\n', jsonencode(struct('tut', i.tutorial, 'v', v, 'n', numel(r.t), 'last', r.V_C1(end), 'vo', r.measure.Vo)));")
        finally:
            stop.set()
            th.join(2)
            srv.shutdown()
            srv.server_close()
            if old is None:
                os.environ.pop('PCL_HOME', None)
            else:
                os.environ['PCL_HOME'] = old
            shutil.rmtree(home, ignore_errors=True)
        self.assertEqual(o, {'tut': 'buck', 'v': 20, 'n': 3, 'last': 12, 'vo': 12})
        run = [a for m, a in seen if m == 'run'][0]
        self.assertEqual(run['measure'], [{'name': 'Vo', 'key': 'V:C1', 'stat': 'avg', 'periods': 10}])
        self.assertEqual(run['channels'], ['V:C1'])

    def test_plant_matches_python(self):
        # 4.8.1 (ROADMAP §48): a controller written in MATLAB/Octave closes the loop around a circuit of the lab
        # (PclPlant over python -m pcl plant): the same PI in Python on pcl.workbench gives the same numbers; a live change
        # of the load and reset as in Python
        o = octave("p = PclPlant('tutorial:dc_drive?mode=open', 'input', 'PWM1:d', 'measure', 'M1:w', 'state', {'AM1:y'}, "
                   "'u_range', [0 1], 'params', {'M1.TL', 0}, 'hdiv', 50); cs = struct('Kp', 0.004, 'Ki', 0.1, 'lo', 0, 'hi', 1); "
                   "a = p.loop(@pcl_pi, 100 * ones(150, 1), 2e-3, cs); p.setParam('M1.TL', 2); b = p.loop(@pcl_pi, 100 * ones(50, 1), 2e-3, a.cs); "
                   "p.reset(); y0 = p.y; y1 = p.step(0.5, 2e-3); keys = p.keys; inp = p.input; p.close(); "
                   "printf('JSON %s\\n', jsonencode(struct('y', [a.y; b.y], 'u', [a.u; b.u], 'i', [a.m(:, 2); b.m(:, 2)], 't', b.t(end), "
                   "'y0', y0, 'y1', y1, 'keys', {keys}, 'inp', inp)));")
        import pcl
        import pcl.workbench as wb
        P = wb.plant_class(pcl.tutorial('dc_drive', mode='open').set('M1.TL', 0), input='PWM1:d', measure='M1:w', state=['AM1:y'],
                           u_range=(0, 1), solver={'hdiv': 50})
        pl = P()
        x, ys, us, cur = 0.0, [], [], []
        for k in range(200):                                  # pcl_pi, the same arithmetic
            if k == 150:
                pl.set_live({'M1.TL': 2})
            e = 100.0 - pl.output()
            xn = x + 0.1 * 2e-3 * e
            u = 0.0 + 0.004 * e + xn
            if u > 1:
                u, xn = 1.0, (x if e > 0 else xn)
            elif u < 0:
                u, xn = 0.0, (x if e < 0 else xn)
            x = xn
            ys.append(pl.step(u, 2e-3))
            us.append(pl.last_u)
            cur.append(float(pl.measured()[1]))
        pl.reset_state()
        y1 = pl.step(0.5, 2e-3)
        pl.close()
        self.assertEqual((o['keys'], o['inp'], o['y0']), (['Y:M1', 'Y:AM1'], 'WBU', 0))
        self.assertAlmostEqual(o['t'], 0.4, delta=1e-12)
        for a, b in zip(o['y'] + o['u'] + o['i'] + [o['y1']], ys + us + cur + [y1]):
            self.assertAlmostEqual(a, b, delta=1e-12 * max(1.0, abs(b)))
        self.assertGreater(ys[149], 97)                        # the PI follows 100 rad/s; the load of 2 N·m makes it dip
        self.assertLess(min(ys[150:170]), ys[149] - 0.3)

    @unittest.skipIf(shutil.which('xvfb-run') is None, 'xvfb-run: χωρίς οθόνη δεν ανοίγει το παράθυρο.')
    def test_plant_window(self):
        # 4.8.1: the window of the template (figure + uicontrol, the same in MATLAB and Octave): opens the circuit, runs
        # 200 samples, the load from its slider, ▶ again for 200
        code = ("graphics_toolkit('qt'); f = pcl_plant_gui(struct('steps', 200)); S = getappdata(f, 'S'); "
                "cb = get(S.ui.dist, 'Callback'); set(S.ui.dist, 'Value', 2); cb(S.ui.dist, []); "
                "cb = get(S.ui.go, 'Callback'); cb(S.ui.go, []); S = getappdata(f, 'S'); "
                "info = get(S.ui.info, 'String'); if iscell(info), info = strjoin(info, ' '); end; "
                "printf('JSON %s\\n', jsonencode(struct('n', size(S.buf, 1), 'y', S.buf(end, 3), 'dip', min(S.buf(201:260, 3)), 'u', S.buf(end, 4), "
                "'info', info))); cb = get(f, 'CloseRequestFcn'); cb(f, []);")
        r = subprocess.run(['xvfb-run', '-a', 'octave', '--no-gui', '--quiet', '--eval', f"addpath('{(ROOT / 'matlab').as_posix()}'); {code}"],
                           capture_output=True, text=True, timeout=600, cwd=str(ROOT))
        out = [x for x in r.stdout.splitlines() if x.startswith('JSON ')]
        if not out and ('graphics_toolkit' in r.stderr or 'qt' in r.stderr.lower()):
            self.skipTest('Το Octave δεν έχει γραφικά Qt εδώ.')
        self.assertTrue(out, r.stderr[-2000:])
        o = json.loads(out[-1][5:])
        self.assertEqual(o['n'], 400)
        self.assertAlmostEqual(o['y'], 100, delta=0.5)
        self.assertLess(o['dip'], 99.7)
        self.assertGreater(o['u'], 0.45)
        self.assertIn('IAE', o['info'])

    def test_read_csv_json_mat(self):
        import pcl
        d = Path(tempfile.mkdtemp(prefix='pcl-oct-'))
        try:
            r = pcl.tutorial('buck', start='steady').run(t_end=2e-4, channels=['V:C1', 'I:L1'])
            r.to_csv(d / 'a.csv')
            r.to_csv(d / 'b.csv', sep=';', decimal=',')
            r.to_json(d / 'a.json')
            r.to_mat(d / 'a.mat')
            o = octave("x = {}; for f = {'a.csv', 'b.csv', 'a.json', 'a.mat'}, q = pcl_read(fullfile('%s', f{1})); "
                       "x{end + 1} = [numel(q.t), q.V_C1(end), q.I_L1(1)]; end; printf('JSON %%s\\n', jsonencode(x));" % d.as_posix())
            for n, v, i0 in o:
                self.assertEqual(n, len(r.t))
                self.assertAlmostEqual(v, r['V:C1'][-1], places=9)
                self.assertAlmostEqual(i0, r['I:L1'][0], places=9)
        finally:
            shutil.rmtree(d, ignore_errors=True)

    def test_errors_come_back(self):
        out = octave("try, pcl_run('tutorial:buck', {'Q9.R', 1}, struct('t_end', 1e-4)); catch e, printf('JSON %s\\n', jsonencode(e.message)); end")
        self.assertIn('Δεν υπάρχει στοιχείο', out)


if __name__ == '__main__':
    unittest.main()
