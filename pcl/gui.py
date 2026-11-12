"""The external Python GUI for control with neural networks (4.7, ROADMAP «Τι προτείνω» 4.7.4, §46, §48).

    python -m pcl gui              with the app open (python run.py): reads its machines and sends it the circuit
    python -m pcl gui --offline    without the app: the machines from web/studio/parts.js, the runs with pcl in Node

Pick a machine (the list comes from the app, so a machine added later shows up by itself), what the control should
achieve (goals with weights, several at once) and the kind of controller (or «Αυτόματα»). «Σύνθεση» builds the circuit
for that kind of machine with real wires; «Εκπαίδευση και τρέξιμο» trains the inverse model when needed, runs the
candidates in parallel and sorts them by the weighted cost against the base PI; «Στείλε στην εφαρμογή» loads the chosen
one into the app (through the link, «Αποδοχή» there), where it can be run, changed and kept learning.
The logic is in pcl/designer.py (tested without a screen); this file is only the window, in the manner of the Control
Workbench (tkinter + matplotlib).
"""
import json
import queue
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from . import designer as D
from .core import PclError

try:
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
    from matplotlib.figure import Figure
except ImportError:                                   # the window still works, without the charts
    FigureCanvasTkAgg = Figure = None

COLS = [('label', 'Εκδοχή', 250), ('J', 'J', 60), ('iae', 'IAE', 70), ('ise', 'ISE', 70), ('overshoot', 'υπέρβαση %', 80),
        ('settle', 'αποκατάσταση s', 95), ('effort', 'ενέργεια ελέγχου', 105), ('load', 'πτώση στο φορτίο', 105)]


def _fmt(v):
    if isinstance(v, str):
        return v
    a = abs(v)
    return f'{v:.3g}' if a < 1e4 else f'{v:.3e}'


class DesignerGUI(tk.Tk):
    def __init__(self, app=None, offline=False):
        super().__init__()
        self.title('Power & Control Lab · σύνθεση ελέγχου με νευρωνικά δίκτυα')
        self.geometry('1280x820')
        self.app, self.offline = app, offline
        self.q = queue.Queue()
        self.machines, self.result, self.selected, self.busy = [], None, None, False
        self.machine_var, self.ctrl_var = tk.StringVar(), tk.StringVar(value=D.CONTROLLERS[-1][1])
        self.cycles_var, self.status = tk.IntVar(value=3), tk.StringVar(value='')
        self.goal_on = {k: tk.BooleanVar(value=k in ('iae', 'overshoot')) for k, _ in D.GOALS}
        self.goal_w = {k: tk.DoubleVar(value={'iae': 1.0, 'overshoot': .5}.get(k, .5)) for k, _ in D.GOALS}
        self.param_vars = {}
        self._build()
        self.after(50, self._load_machines)
        if app is not None and not offline:
            self.after(80, self.connect)
        self.after(100, self._poll)

    # ---------------------------------------------------------------- layout
    def _build(self):
        bar = ttk.Frame(self)
        bar.pack(side=tk.TOP, fill=tk.X, padx=8, pady=6)
        self.conn_lbl = ttk.Label(bar, text='…')
        self.conn_lbl.pack(side=tk.LEFT)
        ttk.Button(bar, text='Σύνδεση με την εφαρμογή', command=self.connect).pack(side=tk.LEFT, padx=6)
        ttk.Label(bar, text='Μηχανή').pack(side=tk.LEFT, padx=(16, 2))
        self.machine_cb = ttk.Combobox(bar, textvariable=self.machine_var, state='readonly', width=46)
        self.machine_cb.pack(side=tk.LEFT)
        self.machine_cb.bind('<<ComboboxSelected>>', lambda e: self._on_machine())
        ttk.Label(bar, text='Ελεγκτής').pack(side=tk.LEFT, padx=(16, 2))
        ttk.Combobox(bar, textvariable=self.ctrl_var, state='readonly', width=40, values=[n for _, n in D.CONTROLLERS]).pack(side=tk.LEFT)
        ttk.Label(bar, text='Κύκλοι αναφοράς').pack(side=tk.LEFT, padx=(16, 2))
        ttk.Spinbox(bar, from_=1, to=8, textvariable=self.cycles_var, width=4).pack(side=tk.LEFT)

        body = ttk.Frame(self)
        body.pack(side=tk.TOP, fill=tk.BOTH, expand=True, padx=8)
        left = ttk.Frame(body, width=360)
        left.pack(side=tk.LEFT, fill=tk.Y)
        right = ttk.Frame(body)
        right.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(8, 0))

        gf = ttk.LabelFrame(left, text='Τι θέλεις να επιτύχει (βάρη)')
        gf.pack(side=tk.TOP, fill=tk.X, pady=4)
        for k, name in D.GOALS:
            row = ttk.Frame(gf)
            row.pack(side=tk.TOP, fill=tk.X, padx=6, pady=1)
            ttk.Checkbutton(row, text=name, variable=self.goal_on[k], width=30).pack(side=tk.LEFT)
            ttk.Scale(row, from_=0, to=1, variable=self.goal_w[k], length=110).pack(side=tk.LEFT)
        ttk.Label(gf, text='J = Σ w·(μέγεθος / μέγεθος του PI βάσης): ο PI βάσης έχει J ≈ Σ w, μικρότερο είναι καλύτερο.',
                  wraplength=330, foreground='#5b6f69').pack(side=tk.TOP, padx=6, pady=(2, 6))

        self.pf = ttk.LabelFrame(left, text='Παράμετροι της μηχανής')
        self.pf.pack(side=tk.TOP, fill=tk.X, pady=4)
        self.desc = ttk.Label(left, text='', wraplength=340, justify=tk.LEFT)
        self.desc.pack(side=tk.TOP, fill=tk.X, pady=6)

        btns = ttk.Frame(left)
        btns.pack(side=tk.TOP, fill=tk.X, pady=4)
        ttk.Button(btns, text='Σύνθεση', command=self.compose).pack(side=tk.LEFT, padx=2)
        self.run_btn = ttk.Button(btns, text='Εκπαίδευση και τρέξιμο', command=self.run_design)
        self.run_btn.pack(side=tk.LEFT, padx=2)
        btn2 = ttk.Frame(left)
        btn2.pack(side=tk.TOP, fill=tk.X, pady=2)
        ttk.Button(btn2, text='Στείλε στην εφαρμογή', command=self.send).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn2, text='Αποθήκευση…', command=self.save).pack(side=tk.LEFT, padx=2)

        if Figure is not None:
            self.fig = Figure(figsize=(8, 5.2), dpi=100)
            self.ax_w = self.fig.add_subplot(2, 1, 1)
            self.ax_m = self.fig.add_subplot(2, 1, 2)
            self.fig.subplots_adjust(hspace=.45, left=.08, right=.98, top=.95, bottom=.1)
            self.canvas = FigureCanvasTkAgg(self.fig, master=right)
            self.canvas.get_tk_widget().pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        else:
            ttk.Label(right, text='Χωρίς matplotlib δεν υπάρχουν γραφικές (pip install matplotlib).').pack()
        self.tree = ttk.Treeview(right, columns=[c for c, _, _ in COLS], show='headings', height=8)
        for c, name, w in COLS:
            self.tree.heading(c, text=name)
            self.tree.column(c, width=w, anchor=tk.W if c == 'label' else tk.E)
        self.tree.pack(side=tk.TOP, fill=tk.X, pady=4)
        self.tree.bind('<<TreeviewSelect>>', lambda e: self._on_row())
        ttk.Label(self, textvariable=self.status, relief=tk.SUNKEN, anchor=tk.W).pack(side=tk.BOTTOM, fill=tk.X)

    # ---------------------------------------------------------------- the app and the machines
    def connect(self):
        """The link of 3.15: the first call asks the app («Αποδοχή»), so it waits in a thread, not in the window."""
        self.status.set('Σύνδεση: πάτα «Αποδοχή» στην εφαρμογή…')

        def work():
            try:
                from . import link
                app = link.connect(client='Python (pcl.gui)')
                ms = app.machines()
                self.q.put(('machines', (app, ms)))
            except Exception as e:                  # noqa: BLE001
                self.q.put(('noapp', str(e)))
        threading.Thread(target=work, daemon=True).start()

    def _load_machines(self, ms=None):
        if ms is None:
            try:
                ms = D.machines()
            except PclError as e:
                ms = []
                self.status.set(str(e))
        self.machines = ms
        self.conn_lbl.config(text='Εφαρμογή: συνδεδεμένη' if self.app not in (None, True) and not self.offline else 'Χωρίς εφαρμογή (μηχανές από το parts.js)')
        names = [f'{m["name"]} [{m["type"]}]' + ('' if D.supported(m) else ' (χωρίς κανόνα ακόμη)') for m in self.machines]
        self.machine_cb.config(values=names)
        if names and not self.machine_var.get():
            self.machine_cb.current(0)
        self._on_machine()

    def machine(self):
        i = self.machine_cb.current()
        return self.machines[i] if 0 <= i < len(self.machines) else None

    def _on_machine(self):
        for w in self.pf.winfo_children():
            w.destroy()
        self.param_vars = {}
        m = self.machine()
        if not m:
            return
        self.desc.config(text=D.describe(m))
        nums = [q for q in m.get('params', []) if q.get('type') == 'num'][:8]
        for q in nums:
            row = ttk.Frame(self.pf)
            row.pack(side=tk.TOP, fill=tk.X, padx=6, pady=1)
            ttk.Label(row, text=q['label'] + (f' ({q["unit"]})' if q.get('unit') else ''), width=34).pack(side=tk.LEFT)
            v = tk.StringVar(value='')
            ttk.Entry(row, textvariable=v, width=10).pack(side=tk.LEFT)
            self.param_vars[q['k']] = v
        ttk.Label(self.pf, text='Κενό = η τιμή του κυκλώματος βάσης.', foreground='#5b6f69').pack(side=tk.TOP, padx=6, pady=2)

    def params(self):
        out = {}
        for k, v in self.param_vars.items():
            s = v.get().strip()
            if s:
                try:
                    out[k] = float(s)
                except ValueError:
                    out[k] = s
        return out

    def weights(self):
        return {k: self.goal_w[k].get() for k, _ in D.GOALS if self.goal_on[k].get()}

    def controller(self):
        name = self.ctrl_var.get()
        return next((k for k, n in D.CONTROLLERS if n == name), 'auto')

    # ---------------------------------------------------------------- actions
    def compose(self):
        m = self.machine()
        if not m or not D.supported(m):
            messagebox.showinfo('Σύνθεση', D.describe(m) if m else 'Δεν υπάρχει μηχανή.')
            return
        c = self.controller()
        try:
            p = D.compose(m, 'pinn' if c == 'auto' else c, params=self.params(), cycles=self.cycles_var.get(),
                          inv_net=self._inv_placeholder() if c == 'inv' else None)
        except PclError as e:
            messagebox.showerror('Σύνθεση', str(e))
            return
        self.selected = p
        n, w = len(p.data['components']), len(p.data['wires'])
        added = [x['id'] for x in p.data['components'] if x['id'] in ('NLP', 'NDA', 'NGA', 'NN1', 'NNS')]
        self.status.set(f'Συντέθηκε: {n} στοιχεία, {w} σύρματα· νέα: {", ".join(added) or "—"}. «Στείλε στην εφαρμογή» για να το δεις.')

    def _inv_placeholder(self):
        from .control import nn_init
        return nn_init([2, 8, 1], 1, True)

    def run_design(self):
        m = self.machine()
        if self.busy or not m:
            return
        if not D.supported(m):
            messagebox.showinfo('Σύνθεση', D.describe(m))
            return
        self.busy = True
        self.run_btn.config(state=tk.DISABLED)
        args = (m, self.weights(), self.controller(), self.cycles_var.get(), self.params())

        def work():
            try:
                out = D.design(*args[:2], controller=args[2], cycles=args[3], params=args[4], progress=lambda s: self.q.put(('status', s)))
                self.q.put(('done', out))
            except Exception as e:                  # noqa: BLE001
                self.q.put(('error', str(e)))
        threading.Thread(target=work, daemon=True).start()
        self.status.set('Ξεκινά…')

    def _poll(self):
        try:
            while True:
                kind, x = self.q.get_nowait()
                if kind == 'status':
                    self.status.set(x)
                elif kind == 'machines':
                    self.app, self.offline = x[0], False
                    self._load_machines(x[1])
                    self.status.set(f'Συνδέθηκε με την εφαρμογή: {len(x[1])} μηχανές.')
                elif kind == 'noapp':
                    self.app, self.offline = None, True
                    self.status.set('Χωρίς εφαρμογή: ' + x)
                elif kind == 'error':
                    self.busy = False
                    self.run_btn.config(state=tk.NORMAL)
                    messagebox.showerror('Σύνθεση', x)
                elif kind == 'done':
                    self.busy = False
                    self.run_btn.config(state=tk.NORMAL)
                    self.show(x)
        except queue.Empty:
            pass
        self.after(150, self._poll)

    def show(self, out):
        self.result = out
        self.tree.delete(*self.tree.get_children())
        for i, r in enumerate(out['results']):
            m = r['metrics']
            vals = [r['label'] + (' (βάση)' if r.get('base') else '')] + [_fmt(r['J'])] + [_fmt(m[k]) for k in ('iae', 'ise', 'overshoot', 'settle', 'effort', 'load')]
            self.tree.insert('', tk.END, iid=str(i), values=vals)
        self.tree.selection_set('0')
        best = out['best']
        msg = f'Καλύτερη για τους στόχους: {best["label"]} (J = {best["J"]:.3g}, PI βάσης {out["baseline"]["J"]:.3g}).'
        if out.get('inverse_error') is not None:
            msg += f' Αντίστροφο μοντέλο: RMS σφάλμα {out["inverse_error"]:.3g}.'
        self.status.set(msg)

    def _on_row(self):
        if not self.result:
            return
        sel = self.tree.selection()
        if not sel:
            return
        r = self.result['results'][int(sel[0])]
        self.selected = r['project']
        self.plot(r)

    def plot(self, r):
        if Figure is None:
            return
        b = self.result['baseline']
        self.ax_w.clear()
        self.ax_w.plot(b['t'], b['wr'], color='#7b8e88', lw=1, label='ω_r (αναφορά)')
        self.ax_w.plot(b['t'], b['w'], color='#c47a1c', lw=1.2, label='ω, PI βάσης')
        self.ax_w.plot(r['t'], r['w'], color='#147966', lw=1.4, label='ω, ' + r['label'])
        self.ax_w.set_xlabel('t / s')
        self.ax_w.set_ylabel('ω / (rad/s)')
        self.ax_w.legend(loc='lower right', fontsize=8)
        self.ax_w.grid(alpha=.3)
        self.ax_m.clear()
        ks = [k for k, _ in D.GOALS]
        P, wmax = b['project'].data['meta']['designer']['P'], b['project'].data['meta']['designer']['wmax']
        floor = {'overshoot': 5.0, 'settle': .02 * P, 'load': .01 * wmax}
        base = [max(b['metrics'][k], floor.get(k, 1e-12), 1e-12) for k in ks]
        self.ax_m.bar([x - .2 for x in range(len(ks))], [b['metrics'][k] / q for k, q in zip(ks, base)], width=.4, color='#c47a1c', label='PI βάσης')
        self.ax_m.bar([x + .2 for x in range(len(ks))], [r['metrics'][k] / q for k, q in zip(ks, base)], width=.4, color='#147966', label=r['label'])
        self.ax_m.set_xticks(range(len(ks)), ['IAE', 'ISE', 'υπέρβαση', 'αποκατάσταση', 'ενέργεια', 'φορτίο'], fontsize=8)
        self.ax_m.set_ylabel('ως προς τον PI βάσης')
        self.ax_m.legend(fontsize=8)
        self.ax_m.grid(alpha=.3, axis='y')
        self.canvas.draw_idle()

    def send(self):
        if self.selected is None:
            messagebox.showinfo('Αποστολή', 'Κάνε πρώτα «Σύνθεση» ή διάλεξε μια γραμμή από τον πίνακα.')
            return
        if self.app in (None, True) or self.offline:
            messagebox.showinfo('Αποστολή', 'Δεν υπάρχει σύνδεση με την εφαρμογή: «Σύνδεση με την εφαρμογή», ή «Αποθήκευση…» και άνοιγμα του αρχείου εκεί.')
            return
        try:
            self.app.load(self.selected.data)
            self.app.notify('Το κύκλωμα ήρθε από το pcl.gui (σύνθεση ελέγχου με νευρωνικά). ▶ για να τρέξει.')
            self.status.set('Στάλθηκε στην εφαρμογή.')
        except Exception as e:                      # noqa: BLE001
            messagebox.showerror('Αποστολή', str(e))

    def save(self):
        if self.selected is None:
            return
        path = filedialog.asksaveasfilename(defaultextension='.pcl.json', filetypes=[('Power & Control Lab', '*.json')])
        if path:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(self.selected.data, f, ensure_ascii=False, indent=1)
            self.status.set('Αποθηκεύτηκε: ' + path)


def main(offline=False):
    """The window; with the app (not offline) it asks for the link in the background and meanwhile lists the machines
    of parts.js (the same list for the same version)."""
    w = DesignerGUI(app=None if offline else True, offline=offline)
    w.mainloop()
