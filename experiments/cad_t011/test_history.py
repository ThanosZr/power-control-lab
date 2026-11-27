import json
import math
from threading import Event, Thread
import unittest
from unittest.mock import patch
import subprocess
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from experiments.cad_t009.history import FeatureError, sample as schema1
from experiments.cad_t010.history import fixed_polygon, sample as schema2
from experiments.cad_t011.contract import validate
from experiments.cad_t011.history import History, arc_points, fixed_circle, sample
from experiments.cad_t011.server import Server
from experiments.cad_t011.worker import build


class NativeHistoryTests(unittest.TestCase):
    def test_curved_sweep_loft_and_oblique_frame(self):
        h=History(); s=h.snapshot(); r=s['results']
        self.assertAlmostEqual(r['swept']['volume_mm3'],40*math.pi**2,places=6)
        self.assertAlmostEqual(r['lofted']['volume_mm3'],10*28*math.pi/3,places=6)
        for k in ('lofted','swept'):
            self.assertTrue(r[k]['brep_valid']); self.assertTrue(r[k]['triangles'])
        d=sample(); q=math.sqrt(.5)
        d['features'][0].update(origin=[1,2,3],x=[0,1,0],normal=[q,0,q])
        t=h.apply(d,0); self.assertEqual(t['regeneration']['rebuilt'],[f['id'] for f in d['features']])
        self.assertAlmostEqual(t['results']['swept']['volume_mm3'],40*math.pi**2,places=6)
        c=t['results']['lofted']['center_mm']; z=10*17/28
        for v,w in zip(c,[1+z*q,2,3+z*q]): self.assertAlmostEqual(v,w,places=6)

    def test_sweep_holes_and_offset_section(self):
        doc=sample(); doc['features']=doc['features'][:4]
        m=fixed_polygon([(-3,-3),(3,-3),(3,3),(-3,3)]); m['points'].append({'id':'hole','x':0,'y':0})
        m['circles'].append({'id':'c','center':'hole','radius':1}); m['constraints'] += [
            {'id':'fh','type':'fixed','point':'hole','x':0,'y':0},{'id':'rh','type':'radius','circle':'c','value':1}]
        doc['features'][1]['model']=m
        result=build(doc);self.assertAlmostEqual(result['volume_mm3'],(36-math.pi)*10*math.pi,places=6)
        doc['features'][1]['model']=fixed_circle(2,(3,0))
        result=build(doc);self.assertAlmostEqual(result['volume_mm3'],4*math.pi*17*math.pi/2,places=6)
        doc['features'][2].update(kind='line',points=[[0,0,0],[0,0,10]])
        self.assertAlmostEqual(build(doc)['volume_mm3'],40*math.pi,places=6)

    def test_compatible_loft_and_smooth_sections(self):
        doc=sample(); doc['features']=[f for f in doc['features'] if f['id'] not in ('spine','swept')]; doc['output']='lofted'
        doc['features'][1]['model']=fixed_polygon([(-1,-1),(1,-1),(1,1),(-1,1)])
        doc['features'][3]['model']=fixed_polygon([(-2,-2),(2,-2),(2,2),(-2,2)])
        self.assertAlmostEqual(build(doc)['volume_mm3'],280/3,places=6)
        doc['features'][1]['model']=fixed_circle(2); doc['features'][3]['model']=fixed_circle(3)
        doc['features'].insert(-1,{'id':'thirdPlane','op':'plane','parent':'datum','origin':[0,0,20],'x':[1,0,0],'normal':[0,0,1]})
        doc['features'].insert(-1,{'id':'thirdSection','op':'sketch','plane':'thirdPlane','model':fixed_circle(4)})
        doc['features'][-1].update(profiles=['section','endSection','thirdSection'],ruled=False)
        self.assertAlmostEqual(build(doc)['volume_mm3'],20*28*math.pi/3,places=5)
        doc['features'][-1]['profiles'].reverse()
        with self.assertRaisesRegex(ValueError,'strictly ordered'): build(doc)

    def test_dependency_reuse_history_and_save_open(self):
        h=History(); d=sample(); d['features'][2]['points']=arc_points(30)
        t=h.apply(d,0); self.assertEqual(t['regeneration']['rebuilt'],['spine','swept'])
        self.assertEqual(t['regeneration']['reused'],['datum','section','endPlane','endSection','lofted'])
        self.assertAlmostEqual(t['results']['swept']['volume_mm3'],60*math.pi**2,places=6)
        key=t['results']['lofted']['geometry_key'];d['output']='lofted'; t=h.apply(d,1);self.assertFalse(t['regeneration']['rebuilt'])
        self.assertEqual(h.apply(d,2),t)
        self.assertEqual(h.undo(2)['document']['output'],'swept')
        self.assertEqual(h.redo(3)['document'],d)
        saved=h.save_text(); self.assertEqual(json.loads(saved),d)
        t=h.open_text(saved,4);self.assertEqual(t['document'],d);self.assertFalse(t['can_undo']);self.assertEqual(len(t['regeneration']['rebuilt']),7)
        self.assertEqual(t['results']['lofted']['geometry_key'],key)

    def test_typed_references_and_atomic_failures(self):
        h=History(); s=h.snapshot()
        for key,value in [('profile','spine'),('path','missing')]:
            d=sample();d['features'][3][key]=value
            with self.subTest(key=key),self.assertRaises(FeatureError): h.apply(d,0)
        d=sample();d['features'][2]['points']=[[0,0,0],[0,0,1],[0,0,2]]
        with self.assertRaisesRegex(FeatureError,'collinear'): h.apply(d,0)
        d=sample();d['features'][0]['normal']=[1,0,0]
        with self.assertRaisesRegex(FeatureError,'perpendicular'): h.apply(d,0)
        d=sample();d['features'][2]['points']=arc_points(1)
        with self.assertRaisesRegex(FeatureError,'curvature radius'): h.apply(d,0)
        d=sample();d['features'][2].update(kind='line',points=[[0,0,0],[0,10,0]])
        with self.assertRaisesRegex(FeatureError,'positive normal'): h.apply(d,0)
        d=sample();d['features'][6]['profiles']=['endSection','section']
        with self.assertRaisesRegex(FeatureError,'strictly ordered'): h.apply(d,0)
        d=sample();d['features'][1]['model']=fixed_polygon([(0,0),(2,2),(0,2),(2,0)])
        with self.assertRaises(FeatureError): h.apply(d,0)
        d=sample();d['features'][2]['extra']=True
        with self.assertRaisesRegex(FeatureError,'fields'): validate(d)
        self.assertEqual(h.snapshot(),s)
        with self.assertRaisesRegex(FeatureError,'Stale'): h.apply(sample(),1)
        stop=Event();stop.set()
        with self.assertRaisesRegex(RuntimeError,'cancelled'): h.apply(sample(),0,stop)
        self.assertEqual(h.snapshot(),s)

    def test_general_plane_extrude_revolve_and_shared_boolean(self):
        doc=sample();doc['features']=doc['features'][:4]; doc['features'][2].update(kind='line',points=[[0,0,0],[0,0,10]])
        doc['features'][0].update(origin=[1,2,3],x=[0,1,0],normal=[1,0,0]);doc['features'].extend([
            {'id':'prism','op':'extrude','profile':'section','depth_mm':10},
            {'id':'common','op':'intersect','left':'prism','right':'swept'}]);doc['output']='common'
        h=History(doc);s=h.snapshot();r=s['results']['common']
        self.assertAlmostEqual(r['volume_mm3'],40*math.pi,places=6);self.assertEqual(r['recipe_steps'],6)
        for v,w in zip(r['center_mm'],[6,2,3]):self.assertAlmostEqual(v,w,places=6)
        doc['features']=[doc['features'][0],{'id':'rsk','op':'sketch','plane':'datum','model':fixed_polygon([(2,0),(4,0),(4,5),(2,5)])},
                         {'id':'rev','op':'revolve','profile':'rsk','angle_deg':360}];doc['output']='rev'
        t=h.apply(doc,0);self.assertAlmostEqual(t['results']['rev']['volume_mm3'],60*math.pi,places=6)
        for v,w in zip(t['results']['rev']['center_mm'],[1,2,5.5]):self.assertAlmostEqual(v,w,places=6)

    def test_legacy_schema_roundtrip(self):
        h=History(schema1());s=h.snapshot();self.assertEqual(s['document']['schema'],1)
        self.assertAlmostEqual(s['results']['plate']['volume_mm3'],(80*45-100*math.pi)*12,places=5)
        t=h.open_text(json.dumps(schema2()),0);self.assertEqual(t['document']['schema'],2)
        self.assertAlmostEqual(t['results']['result']['volume_mm3'],11000*math.pi,places=5)

    def test_http_worker_cancellation_and_single_admission(self):
        h=History(); initial=h.snapshot(); d=sample(); d['features'][2]['points']=arc_points(30)
        with Server(('127.0.0.1',0),h) as server:
            t=Thread(target=server.serve_forever,daemon=True);t.start();out=[]
            base=f'http://127.0.0.1:{server.server_port}'
            def call(path,data=None):
                req=Request(base+path,data=None if data is None else json.dumps(data).encode(),headers={'Content-Type':'application/json'})
                try:
                    with urlopen(req,timeout=65) as res:return res.status,json.load(res)
                except HTTPError as exc:return exc.code,json.load(exc)
            edit=Thread(target=lambda:out.append(call('/api/command',{'action':'apply','revision':0,'request_id':'edit','document':d})),daemon=True)
            started=Event(); children=[]; popen=subprocess.Popen
            def tracked(*args,**kwargs):
                proc=popen(*args,**kwargs)
                if args[0][-1]=='experiments.cad_t011.worker': children.append(proc); started.set()
                return proc
            try:
                with patch('experiments.cad_t009.history.subprocess.Popen',side_effect=tracked):
                    edit.start();self.assertTrue(started.wait(10),'Real native worker never started')
                    self.assertEqual(call('/api/activity')[1]['active'],'edit')
                    self.assertEqual(call('/api/cancel',{'request_id':'wrong'})[1],{'accepted':False})
                    self.assertEqual(call('/api/command',{'action':'undo','revision':0,'request_id':'other'})[0],422)
                    self.assertEqual(call('/api/cancel',{'request_id':'edit'})[1],{'accepted':True})
                    edit.join(65);self.assertFalse(edit.is_alive());self.assertEqual(out[0][0],422)
                    self.assertIn('cancelled',out[0][1]['error']);self.assertEqual(h.snapshot(),initial)
                    self.assertEqual(len(children),1);self.assertNotEqual(children[0].poll(),None)
            finally:server.shutdown();t.join(5)


if __name__=='__main__': unittest.main()
