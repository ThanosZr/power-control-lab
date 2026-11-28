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
from experiments.cad_t012.history import sample as schema4
from experiments.cad_t013.contract import dependencies, validate
from experiments.cad_t013.history import History, sample
from experiments.cad_t013.server import Server
from experiments.cad_t013.worker import build


def recipe(doc, target):
    by_id = {f['id']:f for f in doc['features']}; needed = set()
    def visit(ident):
        if ident not in needed:
            needed.add(ident)
            for dep in dependencies(by_id[ident]): visit(dep)
    visit(target)
    return {**doc,'schema':5,'features':[f for f in doc['features'] if f['id'] in needed],'output':target}


class PatternsShell(unittest.TestCase):
    def test_analytic_native_patterns_mirror_shell(self):
        h=History(); r=h.snapshot()['results']
        for key,volume,center in [('block',6000,(15,10,5)),('linear',16000,(40,10,5)),
                                  ('circular',24000,(0,0,5)),('reflected',6000,(-15,10,5)),
                                  ('hollow',6000-26*16*8,None)]:
            with self.subTest(key=key):
                result=r[key];self.assertTrue(result['brep_valid']);self.assertTrue(result['triangles'])
                self.assertAlmostEqual(result['volume_mm3'],volume,places=6)
                if center:
                    for a,b in zip(result['center_mm'],center):self.assertAlmostEqual(a,b,places=6)
                self.assertEqual(len({x['ref'] for x in result['faces']}),len(result['faces']))
                self.assertTrue(all(set(f['edge_refs'])<= {e['ref'] for e in result['edges']} for f in result['faces']))
        self.assertEqual(len(r['block']['faces']),6)
        self.assertEqual(r['block']['faces'],build(recipe(sample(),'block'))['faces'])
        self.assertEqual(r['hollow']['native_steps'],2)

    def test_oblique_mirror_arbitrary_axis_and_circular_shell(self):
        d=sample();q=math.sqrt(.5)
        # The datum normal is (x+z)/sqrt(2) and the plane passes through (1,0,0).
        d['features'][2].update(origin=[1,0,0],normal=[q,0,q])
        r=build(recipe(d,'reflected'))
        for a,b in zip(r['center_mm'],(-4,10,-14)): self.assertAlmostEqual(a,b,places=6)
        # Rotate about a translated/reversed Z axis, rather than world +Z.
        d['features'][4].update(origin=[30,20,0],axis=[0,0,-2])
        r=build(recipe(d,'circular'))
        self.assertAlmostEqual(r['volume_mm3'],24000,places=6)
        for a,b in zip(r['center_mm'],(30,20,5)):self.assertAlmostEqual(a,b,places=6)
        d['features'][0]['model']=fixed_circle(5)
        r=build(recipe(d,'hollow'))
        self.assertAlmostEqual(r['volume_mm3'],(250-9*8)*math.pi,places=5)
        self.assertTrue(r['brep_valid'])

    def test_regeneration_dependencies_undo_redo_and_roundtrip(self):
        h=History();d=sample();d['features'][3]['count']=2
        s=h.apply(d,0)
        self.assertEqual(s['regeneration']['rebuilt'],['linear'])
        self.assertAlmostEqual(s['results']['linear']['volume_mm3'],11000,places=6)
        d['features'][2]['origin']=[5,0,0]
        s=h.apply(d,1);self.assertEqual(s['regeneration']['rebuilt'],['datum','reflected'])
        self.assertAlmostEqual(s['results']['reflected']['center_mm'][0],-5,places=6)
        d['features'][1]['depth_mm']=12
        s=h.apply(d,2);self.assertEqual(s['regeneration']['rebuilt'],['block','linear','circular','reflected','hollow'])
        self.assertAlmostEqual(s['results']['hollow']['volume_mm3'],7200-26*16*10,places=6)
        key=s['results']['hollow']['geometry_key']
        d['output']='linear';s=h.apply(d,3);self.assertFalse(s['regeneration']['rebuilt'])
        self.assertEqual(h.undo(4)['document']['output'],'hollow')
        self.assertEqual(h.redo(5)['document'],d)
        saved=h.save_text();self.assertEqual(json.loads(saved),d)
        s=h.open_text(saved,6);self.assertEqual(s['results']['hollow']['geometry_key'],key)
        self.assertFalse(s['can_undo']);self.assertFalse(s['can_redo'])

    def test_generic_face_reference_reselection_and_downstream_boolean(self):
        d=sample();d['features']=d['features'][:4];d['output']='linear';h=History(d)
        def top(r):return next(f['ref'] for f in r['faces'] if f['normal'][2]>.99)
        ref=top(h.snapshot()['results']['linear']);self.assertTrue(ref.startswith('f:'))
        d['features'].append({'id':'patternShell','op':'shell','body':'linear','faces':[ref],'thickness_mm':2});d['output']='patternShell'
        s=h.apply(d,0);self.assertAlmostEqual(s['results']['patternShell']['volume_mm3'],16000-76*16*8,places=6)
        d['features'][3]['count']=2
        with self.assertRaisesRegex(FeatureError,'Missing or ambiguous native face'): h.apply(d,1)
        self.assertEqual(s,h.snapshot())
        d['features'][-1]['faces']=[top(build(recipe(d,'linear')))];s=h.apply(d,1)
        self.assertAlmostEqual(s['results']['patternShell']['volume_mm3'],11000-51*16*8,places=6)
        d['features'].append({'id':'intersection','op':'intersect','left':'linear','right':'patternShell'});d['output']='intersection'
        s=h.apply(d,2);self.assertAlmostEqual(s['results']['intersection']['volume_mm3'],s['results']['patternShell']['volume_mm3'],places=6)

    def test_multiple_removed_faces_and_legacy_edge_chain(self):
        d=sample();d['features'][-1]['faces']=['s:profile:base-face','s:profile:top-face']
        r=build(recipe(d,'hollow'));self.assertAlmostEqual(r['volume_mm3'],6000-26*16*10,places=6)
        d=sample();h=History(d)
        ref=next(e['ref'] for e in h.snapshot()['results']['reflected']['edges'] if e['kind']=='line' and all(abs(p[0]+30)<1e-7 and abs(p[1]-20)<1e-7 for p in e['points']))
        d['features'].append({'id':'finish','op':'chamfer','body':'reflected','edges':[ref],'distance_mm':1});d['output']='finish'
        s=h.apply(d,0);self.assertAlmostEqual(s['results']['finish']['volume_mm3'],5995,places=6)

    def test_schema_validation_limits_and_legacy_closed_contracts(self):
        cases=[(3,'count',True),(3,'count',9),(3,'step',[0,0,0]),(3,'step',[1001,0,0]),
               (4,'axis',[0,0,0]),(4,'angle_deg',120),(4,'angle_deg',True),(4,'origin',[1e7,0,0]),
               (5,'plane','block'),(5,'plane','hollow'),(6,'body','profile'),(6,'faces',[]),
               (6,'faces',['s:profile:top-face']*2),(6,'faces',['s:profile:top-face']*5),(6,'thickness_mm',False)]
        for index,key,value in cases:
            d=sample();d['features'][index][key]=value
            with self.subTest(key=key,value=value),self.assertRaises(FeatureError):validate(d)
        d=sample();d['features']=[*d['features'][:3],*({'id':f'p{i}','op':'linear_pattern','body':'block','count':8,'step':[1,0,0]} for i in range(4))];d['output']='p3'
        with self.assertRaisesRegex(FeatureError,'copy budget'):validate(d)
        for schema in range(1,5):
            d=sample();d['schema']=schema
            with self.assertRaises(FeatureError):validate(d)
        h=History(schema1());self.assertEqual(h.snapshot()['document']['schema'],1)
        for rev,doc in enumerate((schema2(),schema3(),schema4())):
            s=h.open_text(json.dumps(doc),rev);self.assertEqual(s['document'],doc)
            self.assertTrue(s['results'][doc['output']]['brep_valid'])

    def test_native_failure_atomic_and_cancel_stale(self):
        h=History();initial=h.snapshot()
        for i,key,value in [(3,'step',[100,0,0]),(6,'faces',['f:'+'0'*64]),(6,'thickness_mm',500)]:
            d=sample();d['features'][i][key]=value
            with self.subTest(key=key),self.assertRaises(FeatureError):h.apply(d,0)
            self.assertEqual(h.snapshot(),initial)
        # Axially symmetric valid copy is redundant, not a pattern.
        d=sample();d['features'][0]['model']=fixed_circle(5)
        with self.assertRaisesRegex(ValueError,'redundant'):build(recipe(d,'circular'))
        with self.assertRaisesRegex(FeatureError,'Stale'):h.apply(sample(),1)
        c=Event();c.set()
        with self.assertRaisesRegex(RuntimeError,'cancelled'):h.apply(sample(),0,c)
        self.assertEqual(h.snapshot(),initial)

    def test_actual_native_worker_cancel_and_admission(self):
        h=History();before=h.snapshot();d=sample();d['features'][3]['count']=4
        with Server(('127.0.0.1',0),h) as server:
            t=Thread(target=server.serve_forever,daemon=True);t.start();out=[]
            root=f'http://127.0.0.1:{server.server_port}'
            def call(path,data=None):
                req=Request(root+path,data=None if data is None else json.dumps(data).encode(),headers={'Content-Type':'application/json'})
                try:
                    with urlopen(req,timeout=65) as res:return res.status,json.load(res)
                except HTTPError as e:return e.code,json.load(e)
            edit=Thread(target=lambda:out.append(call('/api/command',{'action':'apply','revision':0,'request_id':'pattern','document':d})),daemon=True)
            started=Event();children=[];popen=subprocess.Popen
            def tracked(*args,**kwargs):
                proc=popen(*args,**kwargs)
                if args[0][-1]=='experiments.cad_t013.worker':children.append(proc);started.set()
                return proc
            try:
                with patch('experiments.cad_t009.history.subprocess.Popen',side_effect=tracked):
                    edit.start();self.assertTrue(started.wait(10))
                    self.assertEqual(call('/api/activity')[1]['active'],'pattern')
                    self.assertFalse(call('/api/cancel',{'request_id':'wrong'})[1]['accepted'])
                    self.assertEqual(call('/api/command',{'action':'undo','revision':0,'request_id':'other'})[0],422)
                    self.assertTrue(call('/api/cancel',{'request_id':'pattern'})[1]['accepted'])
                    edit.join(65);self.assertFalse(edit.is_alive());self.assertEqual(out[0][0],422)
                    self.assertIn('cancelled',out[0][1]['error']);self.assertEqual(h.snapshot(),before)
                    self.assertEqual(len(children),1);self.assertIsNotNone(children[0].poll())
            finally:server.shutdown();t.join(5)


if __name__=='__main__':unittest.main()
