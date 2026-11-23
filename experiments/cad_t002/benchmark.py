"""Isolated synthetic CAD-T002 evaluation; no PCL imports or dependencies.

Run separately for each wrapper with the same Python/OCP versions.
Geometry is a centered plate (mm) with five analytic cylindrical through-holes.
"""
import argparse
import importlib.metadata as metadata
import json
import math
import platform
import resource
import statistics
import tempfile
import time
from pathlib import Path


def centers(radius):
    return [(0, 0, radius), *[(x, y, 3) for x in (-30, 30) for y in (-20, 20)]]


def reference(t, radius):
    volume = 80 * 60 * t
    moments = [volume * (60**2 + t**2) / 12,
               volume * (80**2 + t**2) / 12,
               volume * (80**2 + 60**2) / 12]
    for x, y, r in centers(radius):
        v = math.pi * r**2 * t
        volume -= v
        moments[0] -= v * ((3*r*r + t*t)/12 + y*y)
        moments[1] -= v * ((3*r*r + t*t)/12 + x*x)
        moments[2] -= v * (r*r/2 + x*x + y*y)
    return volume, moments


def exact(shape, t, radius):
    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.BRepGProp import BRepGProp
    from OCP.GProp import GProp_GProps
    assert BRepCheck_Analyzer(shape.wrapped).IsValid(), "invalid BRep"
    p = GProp_GProps()
    BRepGProp.VolumeProperties_s(shape.wrapped, p, True, False, False)
    v, moments = reference(t, radius)
    m = p.MatrixOfInertia()
    assert math.isclose(p.Mass(), v, rel_tol=1e-8, abs_tol=1e-6)
    c = p.CentreOfMass()
    assert max(abs(c.X()), abs(c.Y()), abs(c.Z())) < 1e-6
    for i in range(1, 4):
        for j in range(1, 4):
            assert math.isclose(m.Value(i, j), moments[i-1] if i == j else 0,
                                rel_tol=1e-8, abs_tol=1e-5)
    return p.Mass()


def mesh_check(vertices, triangles, exact_volume):
    vs = [tuple(v) for v in vertices]
    assert vs and triangles
    assert all(math.isfinite(c) for v in vs for c in v)
    assert all(len(set(tri)) == 3 and min(tri) >= 0 and max(tri) < len(vs)
               for tri in triangles)
    # Oriented triangle volume (mm^3); exact BRep remains authoritative.
    signed = 0.0
    for i, j, k in triangles:
        a, b, c = vs[i], vs[j], vs[k]
        signed += a[0]*(b[1]*c[2]-b[2]*c[1]) + a[1]*(b[2]*c[0]-b[0]*c[2]) + a[2]*(b[0]*c[1]-b[1]*c[0])
    error = abs(abs(signed / 6) - exact_volume) / exact_volume
    assert error < 0.005, ("mesh volume error", error)
    return {"vertices": len(vs), "triangles": len(triangles), "volume_rel_error": error}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("wrapper", choices=["cadquery", "build123d"])
    parser.add_argument("--runs", type=int, default=15)
    args = parser.parse_args()
    if args.runs < 3:
        parser.error("need at least three measured runs")
    start = time.perf_counter()
    if args.wrapper == "cadquery":
        import cadquery as api

        def build(t, radius):
            body = api.Solid.makeBox(80, 60, t, (-40, -30, -t/2))
            cutters = [api.Solid.makeCylinder(r, t+2, (x, y, -t/2-1))
                       for x, y, r in centers(radius)]
            return body.cut(*cutters)

        def count(shape): return len(shape.Solids())
        def export(shape, path): api.exporters.export(shape, str(path))
        def load(path): return api.importers.importStep(str(path)).val()
    else:
        import build123d as api

        def build(t, radius):
            body = api.Box(80, 60, t)
            cutters = [api.Pos(x, y, 0) * api.Cylinder(r, t+2)
                       for x, y, r in centers(radius)]
            return body.cut(*cutters)

        def count(shape): return len(shape.solids())
        def export(shape, path): assert api.export_step(shape, path)
        def load(path): return api.import_step(path)

    import_ms = (time.perf_counter() - start) * 1000
    build_times, mesh_times, metadata_rows = [], [], []
    # Warm-up and deterministic parameter changes with freshly built shapes.
    with tempfile.TemporaryDirectory(prefix="cad-t002-") as directory:
        for index in range(-2, args.runs):
            t, radius = [(10, 12), (12, 10), (8, 14)][index % 3]
            start = time.perf_counter()
            shape = build(t, radius)
            build_ms = (time.perf_counter() - start) * 1000
            assert count(shape) == 1
            v = exact(shape, t, radius)
            start = time.perf_counter()
            vertices, triangles = shape.tessellate(0.05, 0.1)
            mesh_ms = (time.perf_counter() - start) * 1000
            mesh = mesh_check(vertices, triangles, v)
            # Export is outside build/mesh timers. Check every parameter variant.
            if 0 <= index < 3:
                path = Path(directory) / f"plate-{index}.step"
                export(shape, path)
                assert path.stat().st_size > 0
                imported = load(path)
                assert count(imported) == 1
                exact(imported, t, radius)
                metadata_rows.append({"thickness_mm": t, "hole_radius_mm": radius,
                                      "volume_mm3": v, "step_bytes": path.stat().st_size, **mesh})
            if index >= 0:
                build_times.append(build_ms)
                mesh_times.append(mesh_ms)

    def stats(values):
        ordered = sorted(values)
        return {"median_ms": statistics.median(ordered),
                "p95_ms": ordered[math.ceil(0.95*len(ordered))-1],
                "samples_ms": values}

    print(json.dumps({"wrapper": args.wrapper, "wrapper_version": metadata.version(args.wrapper),
                      "ocp_version": metadata.version("cadquery-ocp"),
                      "python": platform.python_version(), "platform": platform.platform(),
                      "runs": args.runs, "import_ms": import_ms,
                      "build": stats(build_times), "tessellation": stats(mesh_times),
                      "peak_rss_kib_linux": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                      "variants": metadata_rows}, indent=2))


if __name__ == "__main__":
    main()
