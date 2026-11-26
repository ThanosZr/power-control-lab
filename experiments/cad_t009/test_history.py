import json
import math
from threading import Event, Thread
import unittest
from unittest.mock import patch

from experiments.cad_t009.history import FeatureError, History, regenerate, sample


def fixed_polygon(points, closed=True):
    vertices=[{'id':f'p{i}','x':x,'y':y} for i,(x,y) in enumerate(points)]
    lines=[{'id':f'l{i}','a':f'p{i}','b':f'p{(i+1)%len(points)}'}
           for i in range(len(points) if closed else len(points)-1)]
    return {'schema':1,'points':vertices,'lines':lines,'circles':[],
            'constraints':[{'id':f'f{i}','type':'fixed','point':v['id'],'x':v['x'],'y':v['y']}
                           for i,v in enumerate(vertices)]}


class TestHistory(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.initial=sample()

    def setUp(self):
        self.h=History(self.initial)

    def edit(self,doc):
        return self.h.apply(doc,self.h.snapshot()['revision'])

    def test_native_plate(self):
        s=self.h.snapshot(); m=s['results']['plate']
        self.assertTrue(m['brep_valid']); self.assertTrue(m['vertices']); self.assertTrue(m['triangles'])
        self.assertAlmostEqual(m['volume_mm3'],(80*45-math.pi*100)*12,places=6)
        self.assertAlmostEqual(m['center_mm'][2],6,places=6)
        s['document']['features'][1]['depth_mm']=99
        self.assertEqual(self.h.snapshot()['document']['features'][1]['depth_mm'],12)

    def test_upstream_change_and_history(self):
        s=self.h.snapshot(); doc=s['document']
        next(c for c in doc['features'][0]['model']['constraints'] if c['id']=='width')['value']=100
        t=self.edit(doc)
        self.assertEqual(t['regeneration']['rebuilt'],['profile','plate'])
        self.assertAlmostEqual(t['results']['plate']['volume_mm3'],(100*45-math.pi*100)*12,places=4)
        u=self.h.undo(1); self.assertEqual(u['document'],self.initial)
        r=self.h.redo(2); self.assertEqual(r['document'],doc); self.assertEqual(r['revision'],3)

    def test_incremental_independent_extrusions(self):
        doc=self.h.snapshot()['document']; doc['features'].append({'id':'second','op':'extrude','profile':'profile','depth_mm':8})
        t=self.edit(doc); self.assertEqual(t['regeneration']['rebuilt'],['second'])
        doc['features'][1]['depth_mm']=22; t=self.edit(doc)
        self.assertEqual(t['regeneration'],{'rebuilt':['plate'],'reused':['profile','second']})
        self.assertEqual(self.edit(doc),t)

    def test_open_profile_rolls_back(self):
        s=self.h.snapshot(); doc=s['document'].copy(); doc=json.loads(json.dumps(doc))
        doc['features'][0]['model']=fixed_polygon([(0,0),(30,0),(30,30),(0,30)],False)
        with self.assertRaisesRegex(FeatureError,'plate:.*closed'): self.edit(doc)
        self.assertEqual(self.h.snapshot(),s)

    def test_self_intersection_and_hole_outside(self):
        s=self.h.snapshot(); doc=json.loads(self.h.save_text())
        doc['features'][0]['model']=fixed_polygon([(0,0),(40,40),(0,40),(30,0)])
        with self.assertRaisesRegex(FeatureError,'plate:.*intersect'): self.edit(doc)
        doc=json.loads(self.h.save_text())
        next(c for c in doc['features'][0]['model']['constraints'] if c['id']=='holeRadius')['value']=40
        with self.assertRaisesRegex(FeatureError,'plate:.*inside'): self.edit(doc)
        self.assertEqual(self.h.snapshot(),s)

    def test_circle_and_polygon_profiles(self):
        doc=json.loads(self.h.save_text())
        doc['features'][0]['model']={'schema':1,'points':[{'id':'O','x':2,'y':3}], 'lines':[],
            'circles':[{'id':'C','center':'O','radius':7}], 'constraints':[
                {'id':'fixed','type':'fixed','point':'O','x':2,'y':3}, {'id':'radius','type':'radius','circle':'C','value':7}]}
        t=self.edit(doc); self.assertAlmostEqual(t['results']['plate']['volume_mm3'],math.pi*49*12,places=6)
        doc['features'][0]['model']=fixed_polygon([(0,0),(30,0),(30,20),(10,20),(10,40),(0,40)])
        t=self.edit(doc); self.assertAlmostEqual(t['results']['plate']['volume_mm3'],800*12,places=6)

    def test_invalid_graph_sketch_and_stale(self):
        s=self.h.snapshot(); doc=json.loads(self.h.save_text()); doc['features'].reverse()
        with self.assertRaisesRegex(FeatureError,'earlier sketch'): self.edit(doc)
        doc=json.loads(self.h.save_text()); doc['features'][0]['model']['constraints'].pop()
        with self.assertRaisesRegex(FeatureError,'fully constrained'): self.edit(doc)
        with self.assertRaisesRegex(FeatureError,'Stale'): self.h.apply(self.initial,1)
        self.assertEqual(self.h.snapshot(),s)

    def test_roundtrip_and_redo_invalidation(self):
        saved=self.h.save_text(); doc=json.loads(saved); doc['features'][1]['depth_mm']=20
        self.edit(doc); self.h.undo(1); doc['features'][1]['depth_mm']=21; self.edit(doc)
        self.assertFalse(self.h.snapshot()['can_redo']); s=self.h.open_text(saved,3)
        self.assertEqual(s['document'],self.initial); self.assertFalse(s['can_undo']); self.assertEqual(s['revision'],4)

    def test_cancel_and_late_result(self):
        s=self.h.snapshot(); doc=json.loads(self.h.save_text()); doc['features'][1]['depth_mm']=20
        cancel=Event(); cancel.set()
        with self.assertRaisesRegex(RuntimeError,'cancelled'): self.h.apply(doc,0,cancel)
        self.assertEqual(self.h.snapshot(),s)
        # Delay a real completed build at the publication boundary; a newer open wins.
        ready,release=Event(),Event(); errors=[]
        def delayed(*args):
            result=regenerate(*args)
            if args[0]==doc:
                ready.set(); release.wait(20)
            return result
        def run():
            try: self.h.apply(doc,0)
            except Exception as exc: errors.append(exc)
        with patch('experiments.cad_t009.history.regenerate',side_effect=delayed):
            thread=Thread(target=run); thread.start()
            try:
                self.assertTrue(ready.wait(25)); current=self.h.open_text(self.h.save_text(),0)
            finally:
                release.set(); thread.join(25)
        self.assertEqual(len(errors),1); self.assertIn('Stale',str(errors[0])); self.assertEqual(self.h.snapshot(),current)


if __name__=='__main__': unittest.main()
