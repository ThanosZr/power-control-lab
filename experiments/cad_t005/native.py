"""Isolated native OCCT adapter for a single v1 cylinder, in a child process."""

import importlib.metadata as metadata
import json
import math
import os
import subprocess
import sys
from pathlib import Path
from time import monotonic

from experiments.cad_t004.worker import Adapter, checkpoint

ROOT = Path(__file__).resolve().parents[2]
MAX_BYTES = 512 * 1024
TIMEOUT = 45


def identity():
    return Adapter("native-cylinder", "1", "OCCT/build123d",
                   f'{metadata.version("cadquery-ocp")}/{metadata.version("build123d")}', 0.05)


def build(plan):
    # Import the heavy kernel exclusively inside the child.
    from build123d import Align, Cylinder, Pos
    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.BRepGProp import BRepGProp
    from OCP.GProp import GProp_GProps

    features = plan["features"]
    if len(features) != 1 or features[0]["op"] != "cylinder" or features[0]["inputs"] or features[0]["id"] != plan["output"]:
        raise ValueError("Only one output cylinder is supported")
    f = features[0]
    r, h, origin = (f["args"][k] for k in ("radius_mm", "height_mm", "origin_mm"))
    if not (0.5 <= r <= 500 and 1 <= h <= 10000 and len(origin) == 3
            and all(math.isfinite(x) and abs(x) <= 10000 for x in origin)):
        raise ValueError("Outside the prototype dimension envelope")
    shape = Pos(*origin) * Cylinder(r, h, align=(Align.CENTER, Align.CENTER, Align.MIN))
    if len(shape.solids()) != 1 or not BRepCheck_Analyzer(shape.wrapped).IsValid():
        raise ValueError("Invalid native solid")
    p = GProp_GProps()
    BRepGProp.VolumeProperties_s(shape.wrapped, p, True, False, False)
    expected = math.pi * r*r*h
    center = [origin[0], origin[1], origin[2]+h/2]
    c = p.CentreOfMass()
    actual_center = [c.X(), c.Y(), c.Z()]
    moments = [expected*(3*r*r+h*h)/12]*2 + [expected*r*r/2]
    matrix = p.MatrixOfInertia()
    inertia = [[matrix.Value(i, j) for j in range(1, 4)] for i in range(1, 4)]
    if not (math.isclose(p.Mass(), expected, rel_tol=1e-8, abs_tol=1e-6)
            and all(math.isclose(a,b,rel_tol=0,abs_tol=1e-6) for a,b in zip(center,actual_center))
            and all(math.isclose(inertia[i][j], moments[i] if i==j else 0,
                                 rel_tol=1e-8, abs_tol=max(1e-5, max(moments)*1e-10))
                    for i in range(3) for j in range(3))):
        raise ValueError("Native properties fail analytical comparison")
    vertices, triangles = shape.tessellate(0.05, 0.1)
    vs, ts = [list(v) for v in vertices], [list(t) for t in triangles]
    if not vs or not ts or not all(math.isfinite(x) for v in vs for x in v):
        raise ValueError("Empty or nonfinite mesh")
    signed = 0.0
    # Relative to cylinder origin reduces translation cancellation in volume check.
    for t in ts:
        if len(set(t)) != 3 or min(t) < 0 or max(t) >= len(vs):
            raise ValueError("Invalid mesh index")
        a,b,c = ([vs[i][j]-origin[j] for j in range(3)] for i in t)
        signed += a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0])
    error = abs(abs(signed/6)-expected)/expected
    if error >= 0.005:
        raise ValueError("Tessellation volume outside tolerance")
    return {"kind":"native-cylinder-mesh", "version":1, "units":"mm", "feature_id":f["id"],
            "kernel":identity().kernel_version, "worker_pid":os.getpid(), "brep_valid":True,
            "radius_mm":r, "height_mm":h, "origin_mm":origin, "volume_mm3":p.Mass(),
            "center_mm":actual_center, "inertia_mm5":inertia, "mesh_volume_rel_error":error,
            "vertices":vs, "triangles":ts}


def execute(plan, token):
    """T004 adapter: cancel/timeout kills the owned process and reaps it."""
    checkpoint(token)
    if len(plan) > 64*1024:
        raise ValueError("Native request exceeds limit")
    deadline = monotonic()+TIMEOUT
    env = dict(os.environ, OMP_NUM_THREADS="1", OPENBLAS_NUM_THREADS="1", MKL_NUM_THREADS="1")
    with subprocess.Popen([sys.executable, "-m", "experiments.cad_t005.native"], cwd=ROOT,
                          env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                          stderr=None) as child:
        try:
            pending = plan
            while True:
                checkpoint(token)
                if monotonic() >= deadline:
                    raise TimeoutError("Native CAD deadline")
                try:
                    stdout, _ = child.communicate(input=pending, timeout=0.05)
                    break
                except subprocess.TimeoutExpired:
                    pending = None
            checkpoint(token)
            if child.returncode or len(stdout) > MAX_BYTES:
                raise RuntimeError(f"Native CAD child failed (exit={child.returncode}, stdout_bytes={len(stdout)})")
            return stdout
        finally:
            if child.poll() is None:
                child.kill()
                child.communicate()


def main():
    data = sys.stdin.buffer.read(64*1024+1)
    if len(data) > 64*1024:
        raise ValueError("Request limit")
    result = json.dumps(build(json.loads(data)), allow_nan=False, separators=(",", ":")).encode()
    if len(result) > MAX_BYTES:
        raise ValueError("Result limit")
    sys.stdout.buffer.write(result)


if __name__ == "__main__":
    main()
