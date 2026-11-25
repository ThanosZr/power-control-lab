import json
import math
import os
import unittest

from experiments.cad_t003.document import shaft
from experiments.cad_t005.demo import coordinator, wait


class NativeTests(unittest.TestCase):
    def submit(self,c,s,d):
        return c.submit(s,d.snapshot(),work_bytes=256*1024**2)

    def test_exact_revisions_cache(self):
        d=shaft()
        with coordinator() as c:
            s=c.open(d.snapshot())
            first=wait(c,self.submit(c,s,d))
            self.assertEqual(first.status,"success",first)
            mesh=json.loads(first.payload)
            self.assertNotEqual(mesh["worker_pid"],os.getpid())
            self.assertTrue(mesh["brep_valid"])
            self.assertAlmostEqual(mesh["volume_mm3"],math.pi*100*100,places=6)
            for actual, expected in zip(mesh["center_mm"],[0,0,50]):
                self.assertAlmostEqual(actual,expected,places=6)
            self.assertLess(mesh["mesh_volume_rel_error"],0.005)
            d.set_parameters({"diameter":32,"length":180},expected_revision=0)
            c.advance(s,d.snapshot())
            second=wait(c,self.submit(c,s,d))
            self.assertEqual(second.status,"success",second)
            self.assertAlmostEqual(json.loads(second.payload)["volume_mm3"],math.pi*256*180,places=6)
            d.undo(expected_revision=1)
            c.advance(s,d.snapshot())
            third=wait(c,self.submit(c,s,d))
            self.assertTrue(third.cached)
            self.assertEqual(first.payload,third.payload)
            self.assertEqual(third.revision,2)

    def test_cancel_and_stale(self):
        d=shaft()
        with coordinator() as c:
            s=c.open(d.snapshot())
            j=self.submit(c,s,d)
            self.assertTrue(c.cancel(j))
            self.assertEqual(wait(c,j).status,"cancelled")
            self.assertEqual(c.stats()["running"],0)
            j=self.submit(c,s,d)
            d.set_parameters({"diameter":24},expected_revision=0)
            c.advance(s,d.snapshot())
            self.assertEqual(wait(c,j).status,"stale")
            self.assertEqual(c.stats()["cache_entries"],0)
            self.assertEqual(wait(c,self.submit(c,s,d)).status,"success")


if __name__=="__main__":
    unittest.main()
