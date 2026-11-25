"""Reproducible synthetic contract demonstration, no geometry computation."""

import json
from time import monotonic, sleep

from experiments.cad_t003.document import shaft
from experiments.cad_t004.worker import Coordinator


def _build(c, session, doc):
    job = c.submit(session, doc.snapshot(), work_bytes=1024 * 1024)
    deadline = monotonic() + 5
    while monotonic() < deadline:
        for r in c.poll():
            if r.job_id == job:
                assert r.status == "success", r
                radius = json.loads(r.payload)["features"][0]["args"]["radius_mm"]
                print(f"revision={r.revision} radius_mm={radius:g} cached={r.cached}")
                return r
        sleep(0.001)
    raise TimeoutError("Synthetic job did not finish")


def main():
    d = shaft()
    with Coordinator() as c:
        session = c.open(d.snapshot())
        first = _build(c, session, d)
        d.set_parameters({"diameter": 32, "length": 180}, expected_revision=0)
        c.advance(session, d.snapshot())
        second = _build(c, session, d)
        d.undo(expected_revision=1)
        c.advance(session, d.snapshot())
        third = _build(c, session, d)
        assert first.cache_key == third.cache_key != second.cache_key
        assert third.cached and not first.cached and not second.cached
        print(f"CAD CPU slots={c.budget.worker_cpu}, work budget bytes={c.budget.worker_bytes}")
        print(json.dumps(c.stats(), sort_keys=True))


if __name__ == "__main__":
    main()
