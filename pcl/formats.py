"""Parquet and HDF5 for large results and sweeps (3.15, ROADMAP §30).

Parquet is written here, in pure Python (one row group, PLAIN encoding, GZIP or none), so it works in the app's
panel too (Pyodide) and needs neither pyarrow nor pandas. pandas/pyarrow, Polars, DuckDB and MATLAB (parquetread)
read it. Columns are optional (null where a value is missing): doubles (float64) and texts (UTF-8).

HDF5 needs h5py (pip install h5py): one dataset per column, the metadata as an attribute (JSON text).
"""
import gzip
import json
import struct
from pathlib import Path

# ---------------------------------------------------------------- Thrift compact protocol (the Parquet footer)
_T_TRUE, _T_FALSE, _T_I32, _T_I64, _T_BIN, _T_LIST, _T_STRUCT = 1, 2, 5, 6, 8, 9, 12


def _varint(n):
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)


def _zz(n):
    return (n << 1) ^ (n >> 63)


class _Struct:
    """Fields are written in increasing id order: a short header (delta << 4 | type) when the delta is 1…15."""

    def __init__(self):
        self.buf = bytearray()
        self.last = 0

    def _head(self, fid, t):
        d = fid - self.last
        if 0 < d <= 15:
            self.buf.append((d << 4) | t)
        else:
            self.buf.append(t)
            self.buf += _varint(_zz(fid))
        self.last = fid

    def i32(self, fid, v):
        self._head(fid, _T_I32)
        self.buf += _varint(_zz(int(v)))
        return self

    def i64(self, fid, v):
        self._head(fid, _T_I64)
        self.buf += _varint(_zz(int(v)))
        return self

    def string(self, fid, s):
        b = s.encode('utf-8') if isinstance(s, str) else bytes(s)
        self._head(fid, _T_BIN)
        self.buf += _varint(len(b)) + b
        return self

    def struct(self, fid, st):
        self._head(fid, _T_STRUCT)
        self.buf += st.end()
        return self

    def lst(self, fid, etype, items):
        self._head(fid, _T_LIST)
        n = len(items)
        self.buf.append((n << 4) | etype if n < 15 else 0xF0 | etype)
        if n >= 15:
            self.buf += _varint(n)
        for it in items:
            if etype == _T_I32:
                self.buf += _varint(_zz(int(it)))
            elif etype == _T_BIN:
                b = it.encode('utf-8')
                self.buf += _varint(len(b)) + b
            else:                         # structs
                self.buf += it.end()
        return self

    def end(self):
        return bytes(self.buf) + b'\0'


# ---------------------------------------------------------------- Parquet
_DOUBLE, _BYTE_ARRAY = 5, 6
_PLAIN, _RLE = 0, 3
_OPTIONAL = 1
_UTF8 = 0
_CODEC = {None: 0, 'none': 0, 'gzip': 2}


def _kind(values):
    """'double' or 'text': a column with any text is text (numbers written as text)."""
    for v in values:
        if v is None:
            continue
        if isinstance(v, str):
            return 'text'
    return 'double'


def _levels(defined):
    """Definition levels (0 = null, 1 = value) as the RLE/bit-packed hybrid with bit width 1: runs only."""
    out = bytearray()
    i, n = 0, len(defined)
    while i < n:
        j = i
        while j < n and defined[j] == defined[i]:
            j += 1
        out += _varint((j - i) << 1) + bytes([1 if defined[i] else 0])
        i = j
    return struct.pack('<I', len(out)) + bytes(out)


def _page_values(kind, values):
    if kind == 'double':
        xs = [float(v) for v in values if v is not None]
        return struct.pack(f'<{len(xs)}d', *xs)
    out = bytearray()
    for v in values:
        if v is None:
            continue
        b = (v if isinstance(v, str) else format(v, '.17g') if isinstance(v, float) else str(v)).encode('utf-8')
        out += struct.pack('<I', len(b)) + b
    return bytes(out)


def write_parquet(path, columns, meta=None, compression='gzip', created_by='pcl'):
    """columns: [(name, values)] of equal length; values are numbers (None or NaN allowed) or texts.
    meta: a dict stored as JSON under the key 'pcl' of the file's key-value metadata."""
    if compression not in _CODEC:
        raise ValueError('compression: "gzip" ή None')
    codec = _CODEC[compression]
    names = [str(n) for n, _ in columns]
    if len(set(names)) != len(names):
        raise ValueError('Διπλά ονόματα στηλών: ' + ', '.join(sorted({n for n in names if names.count(n) > 1})))
    nrows = len(columns[0][1]) if columns else 0
    out = bytearray(b'PAR1')
    chunks, schema = [], [_Struct().string(4, 'schema').i32(5, len(columns))]
    total = 0
    for name, values in columns:
        values = list(values)
        if len(values) != nrows:
            raise ValueError(f'Η στήλη «{name}» έχει {len(values)} τιμές αντί για {nrows}.')
        kind = _kind(values)
        body = _levels([v is not None for v in values]) + _page_values(kind, values)
        data = gzip.compress(body, mtime=0) if codec == 2 else body
        dph = _Struct().i32(1, nrows).i32(2, _PLAIN).i32(3, _RLE).i32(4, _RLE)
        head = _Struct().i32(1, 0).i32(2, len(body)).i32(3, len(data)).struct(5, dph).end()
        off = len(out)
        out += head + data
        usize, csize = len(head) + len(body), len(head) + len(data)
        total += usize
        cmd = (_Struct().i32(1, _DOUBLE if kind == 'double' else _BYTE_ARRAY).lst(2, _T_I32, [_PLAIN, _RLE]).lst(3, _T_BIN, [name])
               .i32(4, codec).i64(5, nrows).i64(6, usize).i64(7, csize).i64(9, off))
        chunks.append(_Struct().i64(2, off).struct(3, cmd))
        el = _Struct().i32(1, _DOUBLE if kind == 'double' else _BYTE_ARRAY).i32(3, _OPTIONAL).string(4, name)
        if kind == 'text':
            el.i32(6, _UTF8).struct(10, _Struct().struct(1, _Struct()))     # converted type UTF8 and logical type STRING
        schema.append(el)
    rg = _Struct().lst(1, _T_STRUCT, chunks).i64(2, total).i64(3, nrows)
    fm = _Struct().i32(1, 1).lst(2, _T_STRUCT, schema).i64(3, nrows).lst(4, _T_STRUCT, [rg])
    if meta is not None:
        fm.lst(5, _T_STRUCT, [_Struct().string(1, 'pcl').string(2, json.dumps(meta, ensure_ascii=False))])
    fm.string(6, created_by)
    foot = fm.end()
    out += foot + struct.pack('<I', len(foot)) + b'PAR1'
    Path(path).write_bytes(bytes(out))
    return path


# ---------------------------------------------------------------- HDF5 (h5py)
def write_hdf5(path, columns, meta=None, matrices=None):
    """One dataset per column at the root (texts as UTF-8 strings), `matrices` {name: rows} as 2-D datasets,
    the metadata as the attribute 'meta' (JSON) and the column names in order as the attribute 'columns'."""
    try:
        import h5py
        import numpy as np
    except ImportError as e:
        import sys
        where = ' (στον browser δεν υπάρχει: γράψε .parquet ή .mat)' if sys.platform == 'emscripten' else ''
        raise RuntimeError('Το HDF5 θέλει το h5py: pip install h5py' + where) from e
    used = set()
    with h5py.File(path, 'w') as f:
        order = []
        for name, values in columns:
            ds = _h5name(name, used)
            values = list(values)
            if _kind(values) == 'text':
                f.create_dataset(ds, data=np.array(['' if v is None else str(v) for v in values], dtype=h5py.string_dtype('utf-8')))
            else:
                f.create_dataset(ds, data=np.array([np.nan if v is None else float(v) for v in values], dtype='f8'), compression='gzip')
            if ds != name:
                f[ds].attrs['name'] = name
            order.append(ds)
        for name, rows in (matrices or {}).items():
            ds = _h5name(name, used)
            w = max((len(r) for r in rows), default=0)
            a = np.full((len(rows), w), np.nan)
            for i, r in enumerate(rows):
                a[i, :len(r)] = [np.nan if v is None else v for v in r]
            f.create_dataset(ds, data=a, compression='gzip')
        f.attrs['columns'] = json.dumps(order, ensure_ascii=False)
        if meta is not None:
            f.attrs['meta'] = json.dumps(meta, ensure_ascii=False)
    return path


def _h5name(name, used):
    """A dataset name without '/' (V:C1 stays V:C1; a path separator becomes '∕'), unique."""
    n = str(name).replace('/', '∕') or '_'
    while n in used:
        n += '_'
    used.add(n)
    return n
