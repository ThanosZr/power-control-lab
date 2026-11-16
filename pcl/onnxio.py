"""ONNX files without a new dependency (4.19.2, ROADMAP §68 point 5, THEORY §8Θ): a small writer and reader of the protobuf
wire format for the part of ONNX that a feed-forward network needs, and an evaluation of such a graph with NumPy.

A model is a dict:
    {'inputs': [(name, shape)], 'outputs': [(name, shape)],          shape: ints, or a string for a free dimension ('batch')
     'nodes': [{'op', 'inputs', 'outputs', 'attrs'}],                 in the order of evaluation
     'init': {name: array},                                           the constants (weights)
     'meta': {key: text},                                             metadata_props of the file
     'opset': 13, 'producer': '…'}

write(path, model) and read(path) are inverse to each other. run(model, {input: array}) evaluates the operators OPS: what
the networks written here use (MatMul, Add, Sub, Mul, Div, Tanh) and what a network trained elsewhere and exported by the
usual tools contains for the same layers (Gemm, Relu, Sigmoid, Identity, Neg, Flatten of two-dimensional data). A file with any
other operator is refused with its name. The files are standard ONNX: the CI checks them with the reference checker and
compares the numbers with ONNX Runtime (tests/test_nnstart.py); neither is needed to use them.
"""
import struct

import numpy as np

OPS = ('MatMul', 'Gemm', 'Add', 'Sub', 'Mul', 'Div', 'Tanh', 'Relu', 'Sigmoid', 'Identity', 'Neg', 'Flatten')
IR_VERSION, OPSET = 7, 13
DTYPES = {1: np.float32, 11: np.float64, 7: np.int64, 6: np.int32}        # TensorProto.DataType → NumPy
CODES = {np.dtype(v): k for k, v in DTYPES.items()}


class OnnxError(ValueError):
    pass


# ---------------------------------------------------------------------------------------------- protobuf, writing
def _varint(v):
    v &= (1 << 64) - 1
    out = bytearray()
    while True:
        b = v & 0x7F
        v >>= 7
        out.append(b | (0x80 if v else 0))
        if not v:
            return bytes(out)


def _int(field, v):
    return _varint(field << 3) + _varint(int(v))


def _bytes(field, b):
    b = b.encode('utf-8') if isinstance(b, str) else bytes(b)
    return _varint((field << 3) | 2) + _varint(len(b)) + b


def _tensor(name, a):
    a = np.asarray(a)
    if a.dtype not in CODES:
        raise OnnxError(f'tensor {name}: dtype {a.dtype}')
    return b''.join(_int(1, d) for d in a.shape) + _int(2, CODES[a.dtype]) + _bytes(8, name) + _bytes(9, a.astype(a.dtype.newbyteorder('<')).tobytes())


def _value(name, shape, code):
    dims = b''.join(_bytes(1, _bytes(2, d) if isinstance(d, str) else _int(1, d)) for d in shape)
    return _bytes(1, name) + _bytes(2, _bytes(1, _int(1, code) + _bytes(2, dims)))


def _attr(name, v):
    if isinstance(v, bool) or isinstance(v, (int, np.integer)):
        return _bytes(1, name) + _int(3, v) + _int(20, 2)
    if isinstance(v, (float, np.floating)):
        return _bytes(1, name) + _varint((2 << 3) | 5) + struct.pack('<f', float(v)) + _int(20, 1)
    if isinstance(v, str):
        return _bytes(1, name) + _bytes(4, v) + _int(20, 3)
    raise OnnxError(f'attribute {name}: {type(v).__name__}')


def dumps(model):
    """The bytes of the file."""
    init = {k: np.asarray(v) for k, v in model.get('init', {}).items()}
    code = CODES[np.dtype(model.get('dtype', np.float64))]
    g = b''
    for i, n in enumerate(model['nodes']):
        if n['op'] not in OPS:
            raise OnnxError(f"operator {n['op']}: only {', '.join(OPS)}")
        g += _bytes(1, b''.join(_bytes(1, s) for s in n['inputs']) + b''.join(_bytes(2, s) for s in n['outputs']) + _bytes(3, n.get('name') or f"n{i}")
                    + _bytes(4, n['op']) + b''.join(_bytes(5, _attr(k, v)) for k, v in sorted((n.get('attrs') or {}).items())))
    g += _bytes(2, model.get('name', 'pcl'))
    g += b''.join(_bytes(5, _tensor(k, v)) for k, v in init.items())
    g += b''.join(_bytes(11, _value(nm, sh, code)) for nm, sh in model['inputs'])
    g += b''.join(_bytes(12, _value(nm, sh, code)) for nm, sh in model['outputs'])
    out = _int(1, IR_VERSION) + _bytes(2, model.get('producer', 'Power & Control Lab')) + _bytes(3, model.get('producer_version', ''))
    out += _bytes(7, g) + _bytes(8, _bytes(1, '') + _int(2, model.get('opset', OPSET)))
    out += b''.join(_bytes(14, _bytes(1, k) + _bytes(2, v)) for k, v in sorted((model.get('meta') or {}).items()))
    return out


def write(path, model):
    with open(path, 'wb') as f:
        f.write(dumps(model))
    return path


# ---------------------------------------------------------------------------------------------- protobuf, reading
def _fields(b):
    """(field, wire type, value) of one message: an int for a varint, bytes for the rest."""
    i, n = 0, len(b)
    while i < n:
        key, s = 0, 0
        while True:
            c = b[i]
            i += 1
            key |= (c & 0x7F) << s
            s += 7
            if not c & 0x80:
                break
        f, w = key >> 3, key & 7
        if w == 0:
            v, s = 0, 0
            while True:
                c = b[i]
                i += 1
                v |= (c & 0x7F) << s
                s += 7
                if not c & 0x80:
                    break
        elif w == 1:
            v, i = b[i:i + 8], i + 8
        elif w == 5:
            v, i = b[i:i + 4], i + 4
        elif w == 2:
            ln, s = 0, 0
            while True:
                c = b[i]
                i += 1
                ln |= (c & 0x7F) << s
                s += 7
                if not c & 0x80:
                    break
            v, i = b[i:i + ln], i + ln
            if len(v) != ln:
                raise OnnxError('the file ends inside a field')
        else:
            raise OnnxError(f'wire type {w}')
        yield f, w, v


def _signed(v):
    return v - (1 << 64) if v >= 1 << 63 else v


def _ints(w, v):
    """A repeated integer field: one value, or a packed run of them."""
    if w == 0:
        return [_signed(v)]
    out, cur, s = [], 0, 0
    for c in v:
        cur |= (c & 0x7F) << s
        s += 7
        if not c & 0x80:
            out.append(_signed(cur))
            cur, s = 0, 0
    return out


def _read_tensor(b):
    dims, code, name, raw, packs = [], 1, '', None, {}
    for f, w, v in _fields(b):
        if f == 1:
            dims += _ints(w, v)
        elif f == 2:
            code = v
        elif f == 8:
            name = v.decode('utf-8')
        elif f == 9:
            raw = v
        elif f in (4, 10, 7, 5):                       # float_data, double_data, int64_data, int32_data
            packs.setdefault(f, []).append((w, v))
    if code not in DTYPES:
        raise OnnxError(f'tensor {name}: data type {code}')
    dt = np.dtype(DTYPES[code])
    if raw is not None:
        a = np.frombuffer(raw, dt.newbyteorder('<')).astype(dt)
    elif 4 in packs:
        a = np.concatenate([np.frombuffer(v, '<f4') for _, v in packs[4]]).astype(dt)
    elif 10 in packs:
        a = np.concatenate([np.frombuffer(v, '<f8') for _, v in packs[10]]).astype(dt)
    elif 7 in packs or 5 in packs:
        a = np.array([x for w, v in packs.get(7, packs.get(5)) for x in _ints(w, v)], dt)
    else:
        a = np.zeros(0, dt)
    return name, a.reshape(dims)


def _read_value(b):
    name, shape = '', []
    for f, w, v in _fields(b):
        if f == 1:
            name = v.decode('utf-8')
        elif f == 2:
            for f2, _, v2 in _fields(v):
                if f2 == 1:                            # tensor_type
                    for f3, _, v3 in _fields(v2):
                        if f3 == 2:                    # shape
                            for f4, _, v4 in _fields(v3):
                                d = None
                                for f5, _, v5 in _fields(v4):
                                    d = _signed(v5) if f5 == 1 else (v5.decode('utf-8') if f5 == 2 else d)
                                shape.append('?' if d is None else d)
    return name, tuple(shape)


def _read_attr(b):
    name, val = '', None
    for f, w, v in _fields(b):
        if f == 1:
            name = v.decode('utf-8')
        elif f == 2:
            val = struct.unpack('<f', v)[0]
        elif f == 3:
            val = _signed(v)
        elif f == 4:
            val = v.decode('utf-8', 'replace')
        elif f == 8:
            val = (val if isinstance(val, list) else []) + _ints(w, v)
    return name, val


def loads(data):
    """The model of the bytes of a file."""
    m = {'inputs': [], 'outputs': [], 'nodes': [], 'init': {}, 'meta': {}, 'opset': None, 'producer': '', 'name': ''}
    graph = None
    try:
        for f, w, v in _fields(bytes(data)):
            if f == 2:
                m['producer'] = v.decode('utf-8', 'replace')
            elif f == 7:
                graph = v
            elif f == 8:
                dom, ver = '', None
                for f2, _, v2 in _fields(v):
                    dom, ver = (v2.decode('utf-8'), ver) if f2 == 1 else ((dom, v2) if f2 == 2 else (dom, ver))
                if dom in ('', 'ai.onnx'):
                    m['opset'] = ver
            elif f == 14:
                kv = {f2: v2.decode('utf-8', 'replace') for f2, _, v2 in _fields(v)}
                m['meta'][kv.get(1, '')] = kv.get(2, '')
        if graph is None:
            raise OnnxError('no graph in the file')
        for f, w, v in _fields(graph):
            if f == 1:
                n = {'op': '', 'inputs': [], 'outputs': [], 'attrs': {}, 'name': ''}
                for f2, _, v2 in _fields(v):
                    if f2 == 1:
                        n['inputs'].append(v2.decode('utf-8'))
                    elif f2 == 2:
                        n['outputs'].append(v2.decode('utf-8'))
                    elif f2 == 3:
                        n['name'] = v2.decode('utf-8')
                    elif f2 == 4:
                        n['op'] = v2.decode('utf-8')
                    elif f2 == 5:
                        k, a = _read_attr(v2)
                        n['attrs'][k] = a
                m['nodes'].append(n)
            elif f == 2:
                m['name'] = v.decode('utf-8', 'replace')
            elif f == 5:
                k, a = _read_tensor(v)
                m['init'][k] = a
            elif f == 11:
                m['inputs'].append(_read_value(v))
            elif f == 12:
                m['outputs'].append(_read_value(v))
    except (IndexError, struct.error, UnicodeDecodeError) as e:
        raise OnnxError(f'not an ONNX file ({type(e).__name__})') from None
    m['inputs'] = [q for q in m['inputs'] if q[0] not in m['init']]          # older exporters list the weights as inputs too
    bad = sorted({n['op'] for n in m['nodes']} - set(OPS))
    if bad:
        raise OnnxError(f"operators that are not supported here: {', '.join(bad)} (supported: {', '.join(OPS)})")
    if not m['nodes'] or not m['inputs'] or not m['outputs']:
        raise OnnxError('the graph has no nodes, inputs or outputs')
    return m


def read(path):
    with open(path, 'rb') as f:
        return loads(f.read())


# ---------------------------------------------------------------------------------------------- evaluation
def run(model, feeds):
    """The outputs of the graph for the inputs feeds ({name: array}, or one array for a graph with one input), with NumPy
    in the precision of the constants. Returns {output name: array}."""
    if not isinstance(feeds, dict):
        feeds = {model['inputs'][0][0]: feeds}
    v = dict(model['init'])
    for nm, _ in model['inputs']:
        if nm not in feeds:
            raise OnnxError(f'input {nm} is missing')
        v[nm] = np.asarray(feeds[nm])
    for n in model['nodes']:
        try:
            a = [v[k] for k in n['inputs'] if k]
        except KeyError as e:
            raise OnnxError(f"node {n.get('name') or n['op']}: {e.args[0]} is not computed before it") from None
        op, at = n['op'], n.get('attrs') or {}
        if op == 'MatMul':
            y = a[0] @ a[1]
        elif op == 'Gemm':
            A = a[0].T if at.get('transA') else a[0]
            Bm = a[1].T if at.get('transB') else a[1]
            y = at.get('alpha', 1.0) * (A @ Bm) + (at.get('beta', 1.0) * a[2] if len(a) > 2 else 0.0)
        elif op == 'Add':
            y = a[0] + a[1]
        elif op == 'Sub':
            y = a[0] - a[1]
        elif op == 'Mul':
            y = a[0] * a[1]
        elif op == 'Div':
            y = a[0] / a[1]
        elif op == 'Tanh':
            y = np.tanh(a[0])
        elif op == 'Relu':
            y = np.maximum(a[0], 0)
        elif op == 'Sigmoid':
            y = 1 / (1 + np.exp(-a[0]))
        elif op == 'Neg':
            y = -a[0]
        elif op == 'Flatten':
            if a[0].ndim != 2:
                raise OnnxError('Flatten: only of two-dimensional data')
            y = a[0]
        else:                                            # Identity
            y = a[0]
        v[n['outputs'][0]] = y
    return {nm: v[nm] for nm, _ in model['outputs']}


def mlp(W, b, x_mean, x_scale, y_mean, y_scale, meta=None, act='Tanh', dtype=np.float64):
    """The model of a feed-forward network y = y_mean + y_scale·f((x − x_mean)/x_scale): layers h ← act(h·W_k + b_k), the last
    one linear. W_k: inputs × outputs."""
    dt = np.dtype(dtype)
    init = {'x_mean': np.asarray(x_mean, dt), 'x_scale': np.asarray(x_scale, dt), 'y_mean': np.asarray(y_mean, dt), 'y_scale': np.asarray(y_scale, dt)}
    nodes = [{'op': 'Sub', 'inputs': ['x', 'x_mean'], 'outputs': ['xc']}, {'op': 'Div', 'inputs': ['xc', 'x_scale'], 'outputs': ['h0']}]
    h = 'h0'
    for k, (Wk, bk) in enumerate(zip(W, b)):
        init[f'W{k}'], init[f'b{k}'] = np.asarray(Wk, dt), np.asarray(bk, dt)
        nodes += [{'op': 'MatMul', 'inputs': [h, f'W{k}'], 'outputs': [f'm{k}']}, {'op': 'Add', 'inputs': [f'm{k}', f'b{k}'], 'outputs': [f'a{k}']}]
        h = f'a{k}'
        if k < len(W) - 1:
            nodes.append({'op': act, 'inputs': [h], 'outputs': [f'h{k + 1}']})
            h = f'h{k + 1}'
    nodes += [{'op': 'Mul', 'inputs': [h, 'y_scale'], 'outputs': ['ys']}, {'op': 'Add', 'inputs': ['ys', 'y_mean'], 'outputs': ['y']}]
    return {'inputs': [('x', ('batch', int(np.asarray(W[0]).shape[0])))], 'outputs': [('y', ('batch', int(np.asarray(W[-1]).shape[1])))], 'nodes': nodes,
            'init': init, 'meta': dict(meta or {}), 'opset': OPSET, 'dtype': dt, 'producer': 'Power & Control Lab'}


__all__ = ['OPS', 'OPSET', 'IR_VERSION', 'OnnxError', 'dumps', 'loads', 'write', 'read', 'run', 'mlp']
