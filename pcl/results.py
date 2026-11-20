"""The results of a study folder, and of the files of other programs, from code (5.0, ROADMAP §91, THEORY §8ΩΕ, GUIDE §36).

    import pcl.results as R
    s = R.open('D:/Μελέτες/γραμμή')          # a study folder (its last run), a run, <name>m.m of the EMTP, .inf of PSCAD, a CSV
    s.channels                                # [{'key', 'name', 'unit', 'kind', 'comp', 'label', …}]
    d = s.read(['I:L1', 'V:C1'], t0=0, t1=0.02)   # {'t': array, 'I:L1': array, …}
    s.to_csv('out.csv', ['I:L1'])
    R.runs('D:/Μελέτες/γραμμή')               # the runs of a study: number, title, status, rows

The same readers as the viewer (engine/studyfolder.py): a run is read while it is written (the complete rows). Experimental
in the 5.0: the format may still grow with the infrastructure of the digital twins (5.0.x)."""
import sys
from pathlib import Path

_root = str(Path(__file__).resolve().parent.parent)
if _root not in sys.path:
    sys.path.insert(0, _root)
from engine import studyfolder as _sf  # noqa: E402


class Source:
    """A run, or a file of the EMTP, of PSCAD or a CSV: its channels and its arrays."""

    def __init__(self, path):
        self.path = str(path)
        self._s = _sf.source(self.path)

    @property
    def info(self):
        return self._s.info()

    @property
    def channels(self):
        return self._s.info()['channels']

    @property
    def keys(self):
        return [c['key'] for c in self.channels]

    def read(self, keys=None, t0=None, t1=None):
        """{'t': array, key: array, …} of [t0, t1] (all of it when not given), as float64 (a copy)."""
        import numpy as np
        t, col, get = self._s.arrays()
        want = list(keys) if keys else list(col)
        for k in want:
            if k not in col:
                raise KeyError(f'Άγνωστο κανάλι «{k}». Μερικά: {", ".join(list(col)[:12])}')
        a = int(np.searchsorted(t, t0, side='left')) if t0 is not None else 0
        b = int(np.searchsorted(t, t1, side='right')) if t1 is not None else len(t)
        out = {'t': np.array(t[a:b], dtype=float)}
        for k in want:
            out[k] = np.array(get(col[k])[a:b], dtype=float)
        return out

    def range(self, t0, t1, keys=None, n=1000):
        """What the viewer draws: per pixel column first, minimum, maximum, mean and last (engine/studyfolder.py read_range)."""
        return _sf.read_range(self._s, t0, t1, keys, n)

    def events(self):
        return self._s.events()['rows'] if hasattr(self._s, 'events') else []

    def to_csv(self, path, keys=None, t0=None, t1=None, sep=','):
        d = self.read(keys, t0, t1)
        names = list(d)
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(sep.join('t (s)' if k == 't' else k for k in names) + '\n')
            for i in range(len(d['t'])):
                f.write(sep.join(repr(float(d[k][i])) for k in names) + '\n')
        return path

    def __repr__(self):
        i = self.info
        return f'<pcl.results {i["kind"]} {i["path"]}: {len(i["channels"])} κανάλια, {i["rows"]} γραμμές>'


def open(path):  # noqa: A001 - the name of the ROADMAP (§45: «από κώδικα»)
    """The source at a path: a study folder (its last run), a run folder, <name>m.m of the EMTP, <name>.inf of PSCAD, a CSV."""
    return Source(Path(path).expanduser().resolve())


def runs(study):
    """The runs of a study folder: [{'run', 'n', 'title', 'status', 'started', 'finished', 'tag', 'channels', 'rows', 'bytes'}]."""
    return _sf.list_runs(Path(study).expanduser().resolve())


def diff(a, ka, b, kb, t0, t1, n=1000):
    """A − B on the times of A (B interpolated), reduced as the viewer draws it, with its largest and rms value."""
    return _sf.read_diff(a._s, ka, b._s, kb, t0, t1, n)
