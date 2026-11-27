import json
import math
from threading import Event
import unittest

from experiments.cad_t009.history import FeatureError, sample as old_sample
from experiments.cad_t010.history import History, fixed_polygon, sample, validate


class TestNativeFeatures(unittest.TestCase):
    def setUp(self):
        self.h=History()

    def edit(self,doc):
        return self.h.apply(doc,self.h.snapshot()['revision'])

    def test_native_revolve_and_subtract(self):
        s=self.h.snapshot(); r=s['results']
        for key,factor in [('body',16000),('tool',8250),('result',11000)]:
            self.assertAlmostEqual(r[key]['volume_mm3'],factor*math.pi,places=5)
            self.assertTrue(r[key]['brep_valid']); self.assertTrue(r[key]['triangles'])
        self.assertEqual(r['result']['native_steps'],3)
        self.assertAlmostEqual(r['result']['center_mm'][1],10,places=6)

    def test_boolean_union_intersection_and_transitive_rebuild(self):
        doc=sample(); doc['features'][4]['op']='union'
        t=self.edit(doc); self.assertEqual(t['regeneration']['rebuilt'],['result'])
        self.assertAlmostEqual(t['results']['result']['volume_mm3'],19250*math.pi,places=5)
        doc['features'].append({'id':'common','op':'intersect','left':'result','right':'body'}); doc['output']='common'
        t=self.edit(doc); self.assertEqual(t['regeneration']['rebuilt'],['common'])
        self.assertAlmostEqual(t['results']['common']['volume_mm3'],16000*math.pi,places=5)
        self.assertEqual(t['results']['common']['native_steps'],4)
        doc['features'][1]['angle_deg']=180
        t=self.edit(doc); self.assertEqual(t['regeneration'],{'rebuilt':['body','result','common'],'reused':['profile','toolProfile','tool']})
        self.assertAlmostEqual(t['results']['common']['volume_mm3'],8000*math.pi,places=5)

    def test_independent_revolve_partial_and_history(self):
        doc=sample(); doc['features'][1]['angle_deg']=180
        s=self.edit(doc)
        self.assertEqual(s['regeneration']['rebuilt'],['body','result'])
        self.assertAlmostEqual(s['results']['result']['volume_mm3'],5500*math.pi,places=5)
        self.assertEqual(self.edit(doc),s)
        self.assertEqual(self.h.undo(1)['document'],sample())
        self.assertEqual(self.h.redo(2)['document'],doc)
        saved=self.h.save_text(); reopened=self.h.open_text(saved,3)
        self.assertEqual(reopened['document'],doc); self.assertFalse(reopened['can_undo'])

    def test_native_failure_and_atomic_rollback(self):
        s=self.h.snapshot(); doc=sample()
        doc['features'][2]['model']=fixed_polygon([(40,5),(50,5),(50,15),(40,15)])
        doc['features'][4]['op']='union'
        with self.assertRaisesRegex(FeatureError,'result:.*valid native solid'): self.edit(doc)
        doc['features'][4]['op']='intersect'
        with self.assertRaisesRegex(FeatureError,'result:.*valid native solid'): self.edit(doc)
        doc=sample(); doc['features'][0]['model']=fixed_polygon([(-10,0),(30,0),(30,20),(-10,20)])
        with self.assertRaisesRegex(FeatureError,'body:.*positive X'): self.edit(doc)
        self.assertEqual(self.h.snapshot(),s)

    def test_invalid_dependencies_cancel_and_stale(self):
        doc=sample(); doc['features'][4]['right']='profile'
        with self.assertRaisesRegex(FeatureError,'earlier solid'): validate(doc)
        doc=sample(); doc['features'][4]['right']='body'
        with self.assertRaisesRegex(FeatureError,'distinct'): validate(doc)
        doc=sample(); doc['features'][1]['angle_deg']=361
        with self.assertRaisesRegex(FeatureError,'angle_deg'): validate(doc)
        s=self.h.snapshot(); doc=sample(); doc['features'][1]['angle_deg']=180
        cancel=Event(); cancel.set()
        with self.assertRaisesRegex(RuntimeError,'cancelled'): self.h.apply(doc,0,cancel)
        with self.assertRaisesRegex(FeatureError,'Stale'): self.h.apply(doc,1)
        self.assertEqual(self.h.snapshot(),s)

    def test_legacy_schema_and_extrude_boolean(self):
        d=old_sample(); t=self.h.open_text(json.dumps(d),0)
        self.assertAlmostEqual(t['results']['plate']['volume_mm3'],(80*45-100*math.pi)*12,places=5)
        d={'schema':2,'units':'mm','features':[
            {'id':'a','op':'sketch','model':fixed_polygon([(0,0),(20,0),(20,20),(0,20)])},
            {'id':'b','op':'extrude','profile':'a','depth_mm':10},
            {'id':'c','op':'sketch','model':fixed_polygon([(10,0),(30,0),(30,20),(10,20)])},
            {'id':'d','op':'extrude','profile':'c','depth_mm':10},
            {'id':'e','op':'union','left':'b','right':'d'}], 'output':'e'}
        t=self.edit(d); self.assertAlmostEqual(t['results']['e']['volume_mm3'],6000,places=6)


if __name__=='__main__': unittest.main()
