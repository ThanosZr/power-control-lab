import json
import math
import subprocess
from threading import Event, Thread
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from experiments.cad_t009.history import FeatureError, sample as schema1
from experiments.cad_t010.history import sample as schema2
from experiments.cad_t011.history import fixed_circle, sample as schema3
from experiments.cad_t012.contract import validate
from experiments.cad_t012.history import History, sample
from experiments.cad_t012.server import Server
from experiments.cad_t012.worker import build


def recipe(doc, output):
    from experiments.cad_t012.contract import dependencies
    items = {f['id']: f for f in doc['features']}
    ids = set()
    def visit(ident):
        if ident not in ids:
            ids.add(ident)
            for dep in dependencies(items[ident]):
                visit(dep)
    visit(output)
    return {**doc, 'schema': 4, 'features': [f for f in doc['features'] if f['id'] in ids], 'output': output}


class EdgeFeatures(unittest.TestCase):
    def test_native_fillet_and_multiple_chamfers_analytic(self):
        h = History()
        r = h.snapshot()['results']
        self.assertAlmostEqual(r['block']['volume_mm3'], 6000, places=7)
        self.assertAlmostEqual(r['rounded']['volume_mm3'], 6000-10*(4-math.pi), places=7)
        self.assertAlmostEqual(r['beveled']['volume_mm3'], 5960, places=7)
        for name in ('block', 'rounded', 'beveled'):
            self.assertTrue(r[name]['brep_valid'])
            self.assertTrue(r[name]['triangles'])
            self.assertTrue(r[name]['edges'])
            self.assertEqual(len({e['ref'] for e in r[name]['edges']}), len(r[name]['edges']))
        self.assertEqual(len(r['block']['edges']), 12)
        self.assertEqual(r['block']['edges'], build(recipe(sample(), 'block'))['edges'])
        self.assertTrue(all(e['ref'].startswith('g:') for e in r['rounded']['edges']))

    def test_circle_rim_seam_exclusion_and_oblique_datum(self):
        q = math.sqrt(.5)
        doc = {'schema':4,'units':'mm','features':[
            {'id':'datum','op':'plane','origin':[1,2,3],'x':[0,1,0],'normal':[q,0,q]},
            {'id':'p','op':'sketch','plane':'datum','model':fixed_circle(5)},
            {'id':'c','op':'extrude','profile':'p','depth_mm':10},
            {'id':'ch','op':'chamfer','body':'c','edges':['s:p:top-circle:c'],'distance_mm':1}],
            'output':'ch'}
        base = build(recipe(doc, 'c'))
        self.assertEqual({e['ref'] for e in base['edges']}, {'s:p:base-circle:c', 's:p:top-circle:c'})
        self.assertTrue(all(e['kind']=='circle' and len(e['points'])==33 for e in base['edges']))
        result = build(doc)
        self.assertAlmostEqual(result['volume_mm3'], 250*math.pi-(5-1/3)*math.pi, places=5)
        doc['features'][-1] = {'id':'ch','op':'fillet','body':'c','edges':['s:p:top-circle:c'],'radius_mm':1}
        result = build(doc)
        self.assertTrue(0 < result['volume_mm3'] < base['volume_mm3'])

    def test_semantic_references_follow_edit_and_independent_reuse(self):
        h = History()
        d = sample()
        d['features'][1]['depth_mm'] = 20
        result = h.apply(d, 0)
        self.assertEqual(result['regeneration']['rebuilt'], ['block', 'rounded', 'beveled'])
        self.assertEqual(result['regeneration']['reused'], ['profile'])
        self.assertAlmostEqual(result['results']['rounded']['volume_mm3'], 12000-20*(4-math.pi), places=6)
        d['features'][2]['radius_mm'] = 3
        result = h.apply(d, 1)
        self.assertEqual(result['regeneration']['rebuilt'], ['rounded'])
        self.assertEqual(result['regeneration']['reused'], ['profile','block','beveled'])
        rounded_key = result['results']['rounded']['geometry_key']
        self.assertAlmostEqual(result['results']['rounded']['volume_mm3'], 12000-20*9*(1-math.pi/4), places=6)
        d['output'] = 'beveled'
        result = h.apply(d, 2)
        self.assertFalse(result['regeneration']['rebuilt'])
        self.assertEqual(h.undo(3)['document']['output'], 'rounded')
        self.assertEqual(h.redo(4)['document'], d)
        saved = h.save_text()
        self.assertEqual(json.loads(saved), d)
        reopened = h.open_text(saved, 5)
        self.assertEqual(reopened['results']['rounded']['geometry_key'], rounded_key)
        self.assertFalse(reopened['can_undo'])
        self.assertEqual(reopened['document'], d)

    def test_reference_on_modified_body_and_missing_reference_rollback(self):
        d = sample()
        d['features'] = d['features'][:3]
        h = History(d)
        # Select an unchanged, independent vertical edge of the rounded body
        # by its native reference, not a mesh index or an OCCT ordinal.
        edge = next(e for e in h.snapshot()['results']['rounded']['edges']
                    if e['kind']=='line' and all(abs(p[0]-30)<1e-7 and abs(p[1]-20)<1e-7 for p in e['points']))
        ref = edge['ref']
        d['features'].append({'id':'finish','op':'chamfer','body':'rounded','edges':[ref],'distance_mm':1})
        d['output'] = 'finish'
        s = h.apply(d, 0)
        self.assertAlmostEqual(s['results']['finish']['volume_mm3'], 6000-10*(4-math.pi)-5, places=6)
        # Changing an unrelated dimension of the fillet retains this exact edge.
        d['features'][2]['radius_mm'] = 3
        s = h.apply(d, 1)
        self.assertEqual(s['regeneration']['rebuilt'], ['rounded', 'finish'])
        # A depth change alters the exact geometry of this generic reference.
        d['features'][1]['depth_mm'] = 12
        with self.assertRaisesRegex(FeatureError, 'Missing or ambiguous'):
            h.apply(d, 2)
        self.assertEqual(h.snapshot(), s)
        changed = build(recipe(d, 'rounded'))
        new_ref = next(e['ref'] for e in changed['edges'] if e['kind']=='line' and
                       all(abs(p[0]-30)<1e-7 and abs(p[1]-20)<1e-7 for p in e['points']))
        self.assertNotEqual(new_ref, ref)
        d['features'][-1]['edges'] = [new_ref]
        self.assertTrue(h.apply(d, 2)['results']['finish']['brep_valid'])

    def test_semantic_ids_survive_sketch_dimension_change_not_deletion(self):
        h = History()
        d = sample()
        model = d['features'][0]['model']
        model['points'][0]['x'] = -2
        model['constraints'][0]['x'] = -2
        s = h.apply(d, 0)
        self.assertEqual(s['regeneration']['rebuilt'], ['profile','block','rounded','beveled'])
        self.assertIn('s:profile:side:p0', {e['ref'] for e in s['results']['block']['edges']})
        model['points'][0]['id'] = 'replacement'
        model['constraints'][0]['point'] = 'replacement'
        for l in model['lines']:
            for key in ('a','b'):
                if l[key]=='p0': l[key]='replacement'
        with self.assertRaisesRegex(FeatureError, 'Missing or ambiguous'):
            h.apply(d, 1)
        self.assertEqual(h.snapshot(), s)

    def test_bad_fields_missing_edge_and_native_failure_atomic(self):
        h = History()
        initial = h.snapshot()
        for key,value in [('body','profile'), ('body','beveled'), ('edges',[]), ('edges',[0]),
                          ('edges',['s:profile:side:p0']*2), ('edges',['s:profile:side:p0']*17),
                          ('radius_mm',True), ('radius_mm',0), ('radius_mm',1001)]:
            d = sample(); d['features'][2][key] = value
            with self.subTest(key=key,value=value), self.assertRaises(FeatureError):
                validate(d)
        for key,value in [('edges',['g:'+'0'*64]), ('radius_mm',500)]:
            d = sample(); d['features'][2][key] = value
            with self.subTest(key=key), self.assertRaises(FeatureError):
                h.apply(d, 0)
            self.assertEqual(h.snapshot(), initial)
        d = sample(); d['schema'] = 3
        with self.assertRaises(FeatureError): validate(d)
        with self.assertRaisesRegex(FeatureError,'Stale'): h.apply(sample(),1)
        cancel = Event();cancel.set()
        with self.assertRaisesRegex(RuntimeError,'cancelled'): h.apply(sample(),0,cancel)
        self.assertEqual(h.snapshot(),initial)

    def test_legacy_and_boolean_downstream(self):
        h=History(schema1())
        self.assertEqual(h.snapshot()['document']['schema'],1)
        s=h.open_text(json.dumps(schema2()),0)
        self.assertAlmostEqual(s['results']['result']['volume_mm3'],11000*math.pi,places=5)
        s=h.open_text(json.dumps(schema3()),1)
        self.assertAlmostEqual(s['results']['swept']['volume_mm3'],40*math.pi**2,places=6)
        d=sample()
        d['features'].append({'id':'inside','op':'intersect','left':'block','right':'rounded'})
        d['output']='inside'
        s=h.apply(d,2)
        self.assertAlmostEqual(s['results']['inside']['volume_mm3'],6000-10*(4-math.pi),places=6)

    def test_actual_worker_cancel_and_admission(self):
        h=History(); initial=h.snapshot(); d=sample(); d['features'][2]['radius_mm']=3
        with Server(('127.0.0.1',0),h) as server:
            t=Thread(target=server.serve_forever,daemon=True);t.start();out=[]
            root=f'http://127.0.0.1:{server.server_port}'
            def call(path,data=None):
                req=Request(root+path,data=None if data is None else json.dumps(data).encode(),
                            headers={'Content-Type':'application/json'})
                try:
                    with urlopen(req,timeout=65) as res:return res.status,json.load(res)
                except HTTPError as e:return e.code,json.load(e)
            edit=Thread(target=lambda:out.append(call('/api/command',
                {'action':'apply','revision':0,'request_id':'edit','document':d})),daemon=True)
            started=Event(); children=[]; popen=subprocess.Popen
            def tracked(*args,**kwargs):
                proc=popen(*args,**kwargs)
                if args[0][-1]=='experiments.cad_t012.worker': children.append(proc); started.set()
                return proc
            try:
                with patch('experiments.cad_t009.history.subprocess.Popen',side_effect=tracked):
                    edit.start();self.assertTrue(started.wait(10))
                    self.assertEqual(call('/api/activity')[1]['active'],'edit')
                    self.assertFalse(call('/api/cancel',{'request_id':'wrong'})[1]['accepted'])
                    self.assertEqual(call('/api/command',{'action':'undo','revision':0,'request_id':'other'})[0],422)
                    self.assertTrue(call('/api/cancel',{'request_id':'edit'})[1]['accepted'])
                    edit.join(65);self.assertFalse(edit.is_alive());self.assertEqual(out[0][0],422)
                    self.assertIn('cancelled',out[0][1]['error']);self.assertEqual(h.snapshot(),initial)
                    self.assertEqual(len(children),1);self.assertIsNotNone(children[0].poll())
            finally:server.shutdown();t.join(5)


if __name__ == '__main__':
    unittest.main()
