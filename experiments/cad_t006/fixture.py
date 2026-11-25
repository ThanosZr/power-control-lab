"""Rebuild the bundled public T005 shaft fixture, excluding process metadata."""
import json
from pathlib import Path
from experiments.cad_t003.document import shaft
from experiments.cad_t005.demo import coordinator, wait


def main():
    doc = shaft()
    with coordinator() as c:
        session = c.open(doc.snapshot())
        result = wait(c, c.submit(session, doc.snapshot(), work_bytes=256*1024**2))
        if result.status != "success":
            raise RuntimeError(result.status)
        data = json.loads(result.payload)
        del data["worker_pid"]
        Path(__file__).with_name("sample.json").write_text(json.dumps(data, separators=(",", ":"))+"\n")


if __name__ == "__main__":
    main()
