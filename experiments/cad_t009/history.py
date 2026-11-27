"""Isolated single-document feature DAG with atomic optimistic regeneration."""
from copy import deepcopy
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
from threading import RLock
from time import monotonic

ROOT = Path(__file__).resolve().parents[2]
BRIDGE = Path(__file__).with_name('solve.mjs')
MAX_DOCUMENT = 65536
MAX_HISTORY = 12


class FeatureError(ValueError):
    def __init__(self, feature, message):
        self.feature = feature
        super().__init__(f'{feature}: {message}')


def encode(value):
    return json.dumps(value,sort_keys=True,allow_nan=False,separators=(',',':'))


def check_cancel(cancel, deadline):
    if cancel is not None and cancel.is_set():
        raise RuntimeError('Regeneration cancelled')
    if monotonic() >= deadline:
        raise TimeoutError('Regeneration deadline exceeded')


def invoke(args, data, cancel, deadline):
    check_cancel(cancel, deadline)
    env = dict(os.environ, OMP_NUM_THREADS='1', OPENBLAS_NUM_THREADS='1', MKL_NUM_THREADS='1')
    with subprocess.Popen(args,cwd=ROOT,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE) as proc:
        try:
            pending = encode(data).encode()
            while True:
                check_cancel(cancel, deadline)
                try:
                    output,_ = proc.communicate(pending,timeout=.05)
                    break
                except subprocess.TimeoutExpired:
                    pending = None
            check_cancel(cancel, deadline)
            if proc.returncode or len(output)>512*1024:
                raise RuntimeError('Geometry subprocess failed or exceeded result limit')
            return json.loads(output)
        finally:
            if proc.poll() is None:
                proc.kill()
                proc.communicate()


def sample():
    model = invoke(['node',str(BRIDGE),'sample'],{},None,monotonic()+10)
    return {'schema':1,'units':'mm','features':[
        {'id':'profile','op':'sketch','model':model},
        {'id':'plate','op':'extrude','profile':'profile','depth_mm':12}], 'output':'plate'}


def validate(doc):
    if len(encode(doc).encode())>MAX_DOCUMENT:
        raise FeatureError('document','Document exceeds 64 KiB')
    if (not isinstance(doc,dict) or set(doc)!={'schema','units','features','output'}
            or type(doc['schema']) is not int or doc['schema']!=1 or doc['units']!='mm'
            or not isinstance(doc['features'],list) or not 1<=len(doc['features'])<=8):
        raise FeatureError('document','Unsupported schema or feature count')
    seen = {}
    for f in doc['features']:
        if not isinstance(f,dict) or not isinstance(f.get('id'),str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{0,63}',f['id']):
            raise FeatureError('document','Invalid feature ID')
        ident = f['id']
        if ident in seen:
            raise FeatureError(ident,'Duplicate feature ID')
        if f.get('op')=='sketch' and set(f)=={'id','op','model'} and isinstance(f['model'],dict):
            pass
        elif f.get('op')=='extrude' and set(f)=={'id','op','profile','depth_mm'}:
            d = f['depth_mm']
            if not isinstance(f['profile'],str) or seen.get(f['profile'])!='sketch':
                raise FeatureError(ident,'Expected an earlier sketch dependency')
            if type(d) not in (int,float) or not math.isfinite(d) or not .1<=d<=1000:
                raise FeatureError(ident,'Depth must be 0.1–1000 mm')
        else:
            raise FeatureError(ident,'Unsupported feature or fields')
        seen[ident]=f['op']
    if not isinstance(doc['output'],str) or seen.get(doc['output'])!='extrude':
        raise FeatureError('document','Output must reference an extrusion')


def regenerate(doc, previous, cancel):
    """Return detached results and cache; never mutate previous committed state."""
    validate(doc)
    deadline = monotonic()+60
    cache, rebuilt, reused = {}, [], []
    for f in doc['features']:
        ident=f['id']
        check_cancel(cancel,deadline)
        request=f if f['op']=='sketch' else {'id':ident,'depth_mm':f['depth_mm'],
                                                'model':cache[f['profile']][1]['model']}
        key=encode(request)
        if ident in previous and previous[ident][0]==key:
            cache[ident]=previous[ident]
            reused.append(ident)
            continue
        try:
            if f['op']=='sketch':
                result=invoke(['node',str(BRIDGE)],f['model'],cancel,deadline)
                if not result['ok']:
                    raise ValueError(result['diagnostics']['message'])
                if result['diagnostics']['dof']!=0:
                    raise ValueError('Profile requires a locally fully constrained sketch')
                value={'model':result['model'],'diagnostics':result['diagnostics']}
            else:
                result=invoke([sys.executable,'-m','experiments.cad_t009.native'],request,cancel,deadline)
                if not result['ok']:
                    raise ValueError(result['error'])
                value=result['mesh']
                if value['brep_valid'] is not True:
                    raise ValueError('Invalid BRep')
        except (ValueError,RuntimeError,TimeoutError) as exc:
            raise FeatureError(ident,str(exc)) from exc
        cache[ident]=(key,value)
        rebuilt.append(ident)
    check_cancel(cancel,deadline)
    return cache, {'rebuilt':rebuilt,'reused':reused}


class History:
    """Versioned definitions plus committed kernel results; optimistic CAS at publish."""
    def _validate(self, doc):
        validate(doc)

    def _regenerate(self, doc, previous, cancel):
        return regenerate(doc, previous, cancel)

    def _sample(self):
        return sample()

    def __init__(self, doc=None):
        self._lock=RLock()
        self._doc=self._sample() if doc is None else deepcopy(doc)
        self._cache,self._stats=self._regenerate(self._doc,{},None)
        self._revision=0
        self._undo,self._redo=[],[]

    def snapshot(self):
        with self._lock:
            return deepcopy({'revision':self._revision,'document':self._doc,
                             'results':{k:v[1] for k,v in self._cache.items()},
                             'regeneration':self._stats,'can_undo':bool(self._undo),'can_redo':bool(self._redo)})

    def _check(self, rev):
        if type(rev) is not int or rev!=self._revision:
            raise FeatureError('document','Stale revision')

    def _change(self, kind, revision, candidate=None, cancel=None):
        with self._lock:
            self._check(revision)
            check_cancel(cancel,monotonic()+1)
            if kind in ('undo','redo'):
                stack=self._undo if kind=='undo' else self._redo
                if not stack:
                    raise FeatureError('history','No '+kind+' available')
                candidate=stack[-1]
            candidate=deepcopy(candidate)
            self._validate(candidate)
            if kind=='edit' and candidate==self._doc:
                return self.snapshot()
            previous={} if kind=='open' else self._cache
        cache,stats=self._regenerate(candidate,previous,cancel)
        with self._lock:
            self._check(revision)  # No publication of a late or cancelled result.
            check_cancel(cancel,monotonic()+1)
            if kind=='undo':
                self._undo.pop(); self._redo.append(self._doc)
            elif kind=='redo':
                self._redo.pop(); self._undo.append(self._doc)
            elif kind=='open':
                self._undo.clear(); self._redo.clear()
            else:
                self._undo.append(self._doc); self._redo.clear()
            self._undo=self._undo[-MAX_HISTORY:]; self._redo=self._redo[-MAX_HISTORY:]
            self._doc,self._cache,self._stats=candidate,cache,stats
            self._revision+=1
            return self.snapshot()

    def apply(self, candidate, expected_revision, cancel=None):
        return self._change('edit',expected_revision,candidate,cancel)

    def undo(self, expected_revision, cancel=None):
        return self._change('undo',expected_revision,cancel=cancel)

    def redo(self, expected_revision, cancel=None):
        return self._change('redo',expected_revision,cancel=cancel)

    def save_text(self):
        with self._lock:
            return encode(self._doc)

    def open_text(self, text, expected_revision, cancel=None):
        if not isinstance(text,str) or len(text.encode())>MAX_DOCUMENT:
            raise FeatureError('document','Document exceeds 64 KiB')
        return self._change('open',expected_revision,json.loads(text),cancel)
