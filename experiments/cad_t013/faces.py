"""Conservative native planar face references. No mesh indices or proximity search."""
from collections import defaultdict
from hashlib import sha256
import math

from experiments.cad_t009.history import encode
from experiments.cad_t011.contract import XY, dot, sub, world
from experiments.cad_t012.edges import eligible as edges, quant, signature, xyz


def eligible(solid, step, by_id, frames):
    from build123d import CenterOf, GeomType
    candidates = defaultdict(list)
    for face in solid.faces():
        if face.geom_type != GeomType.PLANE:
            continue
        sigs = [signature(e) for e in face.edges()]
        if not sigs or any(s is None for s in sigs):
            continue
        # Boundary curves plus plane and area distinguish trimmed planar faces.
        # Normal sign and OCCT ordering do not contribute identity.
        center = tuple(face.center(CenterOf.MASS)); normal = tuple(face.normal_at())
        qn = xyz(normal); qn = min(qn, tuple(-v for v in qn))
        sig = (qn, xyz(center), quant(face.area), tuple(sorted(sigs)))
        candidates[sig].append((face, center, normal))
    if len(candidates) > 128:
        raise ValueError('Native planar face catalogue exceeds 128 candidates')
    roles = defaultdict(list)
    if step['op'] == 'extrude':
        sketch = by_id[step['profile']]; frame = frames.get(sketch.get('plane'), XY)
        for sig, matches in candidates.items():
            for _, center, normal in matches:
                if abs(abs(dot(normal, frame[3]))-1) > 1e-7:
                    continue
                for role, z in (('base-face', 0), ('top-face', step['depth_mm'])):
                    if abs(dot(sub(center, world(frame, (0,0,z))), frame[3])) <= 1e-7:
                        roles[sig].append(f"s:{sketch['id']}:{role}")
    counts = defaultdict(int)
    for names in roles.values():
        for name in names: counts[name] += 1
    result = {}
    for sig, matches in candidates.items():
        if len(matches) != 1:
            continue
        names = roles.get(sig, [])
        if len(names) > 1 or (names and counts[names[0]] != 1):
            continue
        key = names[0] if names else 'f:'+sha256(encode(sig).encode()).hexdigest()
        result[key] = matches[0][0]
    return result


def catalog(solid, step, by_id, frames):
    from build123d import CenterOf
    edge_map = edges(solid, step, by_id, frames)
    result = []
    for ref, face in sorted(eligible(solid, step, by_id, frames).items()):
        center = list(face.center(CenterOf.MASS)); normal = list(face.normal_at())
        if not all(math.isfinite(v) and abs(v) <= 1e6 for v in center+normal):
            raise ValueError('Invalid face display coordinates')
        # Only a display outline; shell resolves the actual BRep face separately.
        boundary = face.edges()
        edge_refs = [key for key, (edge, _) in sorted(edge_map.items())
                     if any(edge.wrapped.IsSame(e.wrapped) for e in boundary)]
        result.append({'ref':ref, 'area_mm2':face.area, 'center_mm':center,
                       'normal':normal, 'edge_refs':edge_refs})
    return result
