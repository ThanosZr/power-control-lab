"""Run a real revisioned native cylinder build; optionally export display mesh."""
import argparse
import json
from pathlib import Path
from time import monotonic, sleep

from experiments.cad_t003.document import shaft
from experiments.cad_t004.worker import Budget, Coordinator
from experiments.cad_t005.native import MAX_BYTES, execute, identity


def coordinator():
    return Coordinator(Budget(total_bytes=512*1024**2, live_bytes=128*1024**2,
                              total_cpu=2, live_cpu=1, max_result_bytes=MAX_BYTES),
                       identity(), execute)


def wait(c, job):
    deadline = monotonic()+50
    while monotonic() < deadline:
        for result in c.poll():
            if result.job_id == job:
                return result
        sleep(0.01)
    raise TimeoutError("No completion")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--mesh", type=Path)
    p.add_argument("--diameter", type=float, default=20)
    p.add_argument("--length", type=float, default=100)
    args = p.parse_args()
    d = shaft(diameter_mm=args.diameter,length_mm=args.length)
    with coordinator() as c:
        session = c.open(d.snapshot())
        start = monotonic()
        result = wait(c,c.submit(session,d.snapshot(),work_bytes=256*1024**2))
        assert result.status == "success", result
        data = json.loads(result.payload)
        print(json.dumps({k:v for k,v in data.items() if k not in {"vertices","triangles"}},indent=2))
        print(f"wall_ms={(monotonic()-start)*1000:.1f} payload_bytes={len(result.payload)} vertices={len(data['vertices'])} triangles={len(data['triangles'])}")
        if args.mesh:
            args.mesh.write_bytes(result.payload)


if __name__ == "__main__":
    main()
