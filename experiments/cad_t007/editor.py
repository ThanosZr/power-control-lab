"""Single-owner transactional editing over T003/T004/T005."""
from copy import deepcopy
import json
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import uuid4

from experiments.cad_t003.document import ContractError, Document, dumps, loads, shaft
from experiments.cad_t005.demo import coordinator, wait

MAX_DOCUMENT = 64 * 1024
WORK_BYTES = 256 * 1024**2


def checked_document(text):
    if not isinstance(text, str) or len(text.encode("utf-8")) > MAX_DOCUMENT:
        raise ContractError("CAD document exceeds 64 KiB")
    data = loads(text)
    # This editor supports only the exact T003 shaft template, not arbitrary v1 DAGs.
    params = {p["id"]: p["value"] for p in data["parameters"]}
    if set(params) != {"diameter", "length"}:
        raise ContractError("Expected straight shaft parameters")
    expected = shaft(data["id"], diameter_mm=params["diameter"],
                     length_mm=params["length"]).snapshot()
    expected["revision"] = data["revision"]
    if data != expected:
        raise ContractError("Unsupported shaft template")
    return Document(data)


class Editor:
    """Owner-thread API. Native candidate builds use the T004/T005 worker.

    Commit the document and mesh together only after success. The coordinator
    uses a temporary session for each candidate, with cache shared between
    candidates. The editing session is separate and changes on open.
    """
    def __init__(self):
        self._worker = coordinator()
        self._session = uuid4().hex
        self._document = shaft()
        try:
            self._mesh = self._build(self._document)
        except BaseException:
            self._worker.close()
            raise

    def _build(self, doc):
        snapshot = doc.snapshot()
        session = self._worker.open(snapshot)
        try:
            job = self._worker.submit(session, snapshot, work_bytes=WORK_BYTES)
            result = wait(self._worker, job)
            if (result.status != "success" or result.job_id != job
                    or result.session_id != session
                    or result.document_id != snapshot["id"]
                    or result.revision != snapshot["revision"]):
                raise RuntimeError("Native rebuild failed: " + str(result.status))
            mesh = json.loads(result.payload)
            if mesh.get("brep_valid") is not True:
                raise RuntimeError("Invalid native BRep")
            return mesh
        finally:
            self._worker.close_session(session)
            self._worker.poll()

    def state(self):
        return {"session": self._session, "document": self._document.snapshot(),
                "mesh": deepcopy(self._mesh)}

    def _check(self, session, revision):
        if session != self._session or type(revision) is not int or revision != self._document.snapshot()["revision"]:
            raise ContractError("Stale editing session or revision")

    def _apply(self, command, session, revision, changes=None):
        self._check(session, revision)
        candidate = deepcopy(self._document)
        if command == "edit":
            candidate.set_parameters(changes, expected_revision=revision)
        elif command == "undo":
            candidate.undo(expected_revision=revision)
        elif command == "redo":
            candidate.redo(expected_revision=revision)
        else:
            raise ContractError("Unsupported command")
        if candidate.snapshot()["revision"] != revision:
            mesh = self._build(candidate)
            self._document, self._mesh = candidate, mesh
        return self.state()

    def edit(self, changes, *, session, revision):
        return self._apply("edit", session, revision, changes)

    def undo(self, *, session, revision):
        return self._apply("undo", session, revision)

    def redo(self, *, session, revision):
        return self._apply("redo", session, revision)

    def open_text(self, text, *, session, revision):
        self._check(session, revision)
        candidate = checked_document(text)
        mesh = self._build(candidate)
        self._document, self._mesh = candidate, mesh
        self._session = uuid4().hex
        return self.state()

    def save_text(self):
        return dumps(self._document.snapshot())

    def save(self, path):
        """Atomic same-directory replacement; no native mesh or history saved."""
        path = Path(path)
        temp = None
        try:
            with NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                    delete=False) as f:
                temp = f.name
                f.write(self.save_text())
                f.flush()
                os.fsync(f.fileno())
            os.replace(temp, path)
        finally:
            if temp is not None and os.path.exists(temp):
                os.unlink(temp)

    def open(self, path, *, session, revision):
        with Path(path).open("rb") as f:
            data = f.read(MAX_DOCUMENT + 1)
        if len(data) > MAX_DOCUMENT:
            raise ContractError("CAD document exceeds 64 KiB")
        return self.open_text(data.decode("utf-8"), session=session, revision=revision)

    def close(self):
        self._worker.close()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()
