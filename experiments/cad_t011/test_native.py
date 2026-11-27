import math
import unittest
from experiments.cad_t011.native import build


def plane(i='p', **kw):
    return {'id': i, 'op': 'plane', 'origin': [0,0,0], 'x': [1,0,0], 'normal': [0,0,1], **kw}


def square(i, p, side):
    return {'id': i, 'op': 'profile', 'plane': p, 'points': [[0,0],[side,0],[side,side],[0,side]]}


def path(a, b):
    return {'id': 'path', 'op': 'path', 'points': [a,b]}


class NativeTests(unittest.TestCase):
    def test_sweep_rotated_plane(self):
        f = [plane(origin=[1,2,3], x=[0,1,0], normal=[1,0,0]), square('s','p',2),
             path([1,2,3],[11,2,3]), {'id':'out','op':'sweep','profile':'s','path':'path'}]
        result = build(f,'out')
        self.assertAlmostEqual(result['volume_mm3'],40,places=6)
        for actual, expected in zip(result['center_mm'],[6,3,4]):
            self.assertAlmostEqual(actual,expected,places=6)

    def test_oblique_sweep(self):
        q = math.sqrt(.5)
        f = [plane(x=[q,0,-q],normal=[q,0,q]), square('s','p',3),
             path([0,0,0],[5*q,0,5*q]), {'id':'out','op':'sweep','profile':'s','path':'path'}]
        self.assertAlmostEqual(build(f,'out')['volume_mm3'],45,places=6)

    def test_ruled_loft_parent_frame(self):
        f = [plane(x=[0,1,0],normal=[1,0,0]), plane('p2',parent='p',origin=[0,0,10]),
             square('a','p',2), square('b','p2',4), {'id':'out','op':'loft','profiles':['a','b']}]
        self.assertAlmostEqual(build(f,'out')['volume_mm3'],10*(4+8+16)/3,places=6)
        f[1]['origin']=[0,0,20]
        self.assertAlmostEqual(build(f,'out')['volume_mm3'],20*(4+8+16)/3,places=6)

    def test_invalid_references_and_planes(self):
        for f in ([plane(parent='missing')], [plane(normal=[1,0,0])],
                  [square('s','p',2),plane()], [plane(),plane()]):
            with self.subTest(f=f), self.assertRaises(ValueError):
                build(f,'out')

    def test_invalid_profile_path(self):
        bad = square('s','p',2)
        bad['points']=[[0,0],[2,2],[0,2],[2,0]]
        with self.assertRaises(ValueError):
            build([plane(),bad],'out')
        f = [plane(),square('s','p',2),path([0,0,1],[0,0,10]),
             {'id':'out','op':'sweep','profile':'s','path':'path'}]
        with self.assertRaises(ValueError):
            build(f,'out')


if __name__ == '__main__':
    unittest.main()
