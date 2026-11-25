"""Isolated T004 reference coordinator; cooperative synthetic thread workers only."""

from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
import hashlib
import json
import math
from threading import Event, get_ident
from uuid import uuid4

from experiments.cad_t003.document import content_key, dumps, validate


class JobError(ValueError):
    pass


class Backpressure(JobError):
    pass


class Cancelled(Exception):
    pass


def _encode(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def _digest(value):
    return hashlib.sha256(_encode(value)).hexdigest()


def _integer(value, minimum=1):
    if type(value) is not int or value < minimum:
        raise JobError("Invalid integer resource limit")
    return value


@dataclass(frozen=True)
class Adapter:
    name: str
    version: str
    kernel: str
    kernel_version: str
    tolerance_mm: float

    def __post_init__(self):
        for value in (self.name, self.version, self.kernel, self.kernel_version):
            if not isinstance(value, str) or not 1 <= len(value) <= 128:
                raise JobError("Versioned adapter identity required")
        v = self.tolerance_mm
        try:
            finite = type(v) in (int, float) and math.isfinite(v) and v > 0
        except OverflowError:
            finite = False
        if not finite:
            raise JobError("Finite positive tolerance required")
        object.__setattr__(self, "tolerance_mm", float(v))


@dataclass(frozen=True)
class Budget:
    total_cpu: int = 4
    live_cpu: int = 2
    total_bytes: int = 64 * 1024 * 1024
    live_bytes: int = 32 * 1024 * 1024
    cache_bytes: int = 2 * 1024 * 1024
    max_cache_entries: int = 128
    max_outstanding: int = 16
    max_sessions: int = 8
    max_input_bytes: int = 64 * 1024
    max_result_bytes: int = 64 * 1024

    def __post_init__(self):
        for name, val in vars(self).items():
            _integer(val, 0 if name in {"live_cpu", "live_bytes", "cache_bytes"} else 1)
        if self.worker_cpu < 1 or self.worker_bytes < 1:
            raise JobError("No CAD capacity after live/cache/transport reservations")

    @property
    def worker_cpu(self):
        return self.total_cpu - self.live_cpu

    @property
    def worker_bytes(self):
        # Worst-case retained payloads, including queued inputs and unread results.
        return (self.total_bytes - self.live_bytes - self.cache_bytes
                - self.max_outstanding * (self.max_input_bytes + self.max_result_bytes))


@dataclass(frozen=True)
class Request:
    job_id: str
    session_id: str
    document_id: str
    revision: int
    content_key: str
    cache_key: str
    plan: bytes
    work_bytes: int


@dataclass(frozen=True)
class Completion:
    job_id: str
    session_id: str
    document_id: str
    revision: int
    status: str  # success, failed, cancelled, stale
    cache_key: str
    payload: bytes | None = None
    cached: bool = False
    error: str | None = None


@dataclass
class _Job:
    request: Request
    token: Event
    future: object = None
    reason: str | None = None
    completion: Completion | None = None


def _identity(snapshot, adapter, max_bytes):
    if len(dumps(snapshot).encode()) > max_bytes:
        raise JobError("Snapshot exceeds input limit")
    content = content_key(snapshot)
    plan = validate(snapshot)
    # Revision and document ID are delivery identity, not resolved plan identity.
    plan.pop("revision")
    plan.pop("document_id")
    dependencies = {}
    for f in plan["features"]:
        dependencies[f["id"]] = _digest({"feature": f, "inputs": [dependencies[i] for i in f["inputs"]]})
    key = _digest({"contract": 1, "content": content, "adapter": vars(adapter),
                   "dependencies": dependencies, "purpose": "build-reference"})
    payload = _encode(plan)
    if len(payload) > max_bytes:
        raise JobError("Resolved plan exceeds input limit")
    return content, key, payload


def checkpoint(token):
    if token.is_set():
        raise Cancelled()


def synthetic_adapter(plan, token):
    """Return resolved-feature metadata, NOT native geometry or physics."""
    features = json.loads(plan)["features"]
    results = []
    for f in features:
        checkpoint(token)
        results.append({"id": f["id"], "op": f["op"], "args": f["args"]})
    checkpoint(token)
    return _encode({"kind": "synthetic-feature-plan", "features": results})


class Coordinator:
    """Single-owner API with FIFO admission; workers never mutate coordinator state.

    Results are consumed via poll(). Budget accounts for reservations and retained
    byte payloads, not Python object overhead, allocation peaks or OS-enforced RAM.
    Cancellation of a running worker is cooperative; reserve until it exits.
    """

    def __init__(self, budget=Budget(), adapter=Adapter("synthetic", "1", "none", "1", 1e-6),
                 execute=synthetic_adapter):
        self._budget, self._adapter, self._execute_adapter = budget, adapter, execute
        self._owner = get_ident()
        self._pool = ThreadPoolExecutor(max_workers=budget.worker_cpu)
        self._sessions = {}
        self._jobs = OrderedDict()
        self._cache = OrderedDict()
        self._cache_bytes = 0
        self._closed = False

    @property
    def budget(self):
        return self._budget

    @property
    def adapter(self):
        return self._adapter

    def _check(self):
        if self._closed or get_ident() != self._owner:
            raise JobError("Coordinator closed or accessed outside owner thread")

    def open(self, snapshot):
        self._check()
        if len(self._sessions) >= self.budget.max_sessions:
            raise Backpressure("Session limit")
        content, _, _ = _identity(snapshot, self.adapter, self.budget.max_input_bytes)
        session = uuid4().hex
        self._sessions[session] = (snapshot["id"], snapshot["revision"], content)
        return session

    def advance(self, session, snapshot):
        self._check()
        old = self._sessions.get(session)
        if old is None:
            raise JobError("Unknown session")
        content, _, _ = _identity(snapshot, self.adapter, self.budget.max_input_bytes)
        current = (snapshot["id"], snapshot["revision"], content)
        if current[0] != old[0] or current[1] < old[1] or (current[1] == old[1] and current != old):
            raise JobError("Document or revision conflict; reopen for a new session")
        self._sessions[session] = current
        self._invalidate(session)
        self._tick()

    def close_session(self, session):
        self._check()
        if session not in self._sessions:
            raise JobError("Unknown session")
        del self._sessions[session]
        self._invalidate(session)
        self._tick()

    def _current(self, request):
        return self._sessions.get(request.session_id) == (request.document_id, request.revision, request.content_key)

    def _invalidate(self, session):
        for job in self._jobs.values():
            if job.request.session_id == session and not self._current(job.request):
                job.reason = "stale"
                job.token.set()
                if job.future is None or job.completion is not None:
                    self._complete(job, "stale")

    def submit(self, session, snapshot, *, work_bytes):
        self._check()
        _integer(work_bytes)
        if work_bytes > self.budget.worker_bytes:
            raise Backpressure("Job cannot fit CAD work budget")
        if len(self._jobs) >= self.budget.max_outstanding:
            raise Backpressure("Outstanding job limit; consume completions")
        content, key, payload = _identity(snapshot, self.adapter, self.budget.max_input_bytes)
        request = Request(uuid4().hex, session, snapshot["id"], snapshot["revision"], content, key, payload, work_bytes)
        if not self._current(request):
            raise JobError("Stale or unregistered snapshot")
        job = _Job(request, Event())
        self._jobs[request.job_id] = job
        self._tick()
        return request.job_id

    def cancel(self, job_id):
        self._check()
        job = self._jobs.get(job_id)
        if job is None:
            raise JobError("Unknown job")
        if job.completion is not None or job.reason is not None:
            return False
        job.reason = "cancelled"
        job.token.set()
        if job.future is None:
            self._complete(job, "cancelled")
        self._tick()
        return True

    @staticmethod
    def _complete(job, status, payload=None, cached=False, error=None):
        r = job.request
        job.completion = Completion(r.job_id, r.session_id, r.document_id, r.revision,
                                    status, r.cache_key, payload, cached, error)
        job.future = None

    def _remember(self, key, payload):
        if not payload or len(payload) > self.budget.cache_bytes:
            return
        old = self._cache.pop(key, None)
        if old is not None:
            self._cache_bytes -= len(old)
        while (self._cache_bytes + len(payload) > self.budget.cache_bytes
               or len(self._cache) >= self.budget.max_cache_entries):
            _, evicted = self._cache.popitem(last=False)
            self._cache_bytes -= len(evicted)
        self._cache[key] = payload
        self._cache_bytes += len(payload)

    def _execute(self, request, token):
        checkpoint(token)
        payload = self._execute_adapter(request.plan, token)
        checkpoint(token)
        if type(payload) is not bytes or len(payload) > self.budget.max_result_bytes:
            raise JobError("Invalid or oversized result")
        return payload

    def _tick(self):
        for job in self._jobs.values():
            if job.future is None or not job.future.done():
                continue
            if job.reason or not self._current(job.request):
                self._complete(job, job.reason or "stale")
                continue
            try:
                payload = job.future.result()
            except Cancelled:
                self._complete(job, "cancelled")
            except Exception as exc:
                # Keep payload/error retention bounded; no original traceback stored.
                self._complete(job, "failed", error=type(exc).__name__[:128])
            else:
                self._remember(job.request.cache_key, payload)
                self._complete(job, "success", payload)
        count, used = self._running()
        for job in self._jobs.values():
            if job.future is not None or job.completion is not None:
                continue
            r = job.request
            if not self._current(r):
                self._complete(job, "stale")
                continue
            if r.cache_key in self._cache:
                self._cache.move_to_end(r.cache_key)
                self._complete(job, "success", self._cache[r.cache_key], cached=True)
                continue
            if count >= self.budget.worker_cpu or used + r.work_bytes > self.budget.worker_bytes:
                break  # strict FIFO for uncached jobs; no starvation by smaller jobs
            job.future = self._pool.submit(self._execute, r, job.token)
            count += 1
            used += r.work_bytes

    def _running(self):
        active = [j for j in self._jobs.values() if j.future is not None]
        return len(active), sum(j.request.work_bytes for j in active)

    def stats(self):
        self._check()
        self._tick()
        running, reserved = self._running()
        return {"running": running, "work_reserved_bytes": reserved,
                "queued": sum(j.future is None and j.completion is None for j in self._jobs.values()),
                "outstanding": len(self._jobs), "cache_bytes": self._cache_bytes,
                "cache_entries": len(self._cache), "sessions": len(self._sessions)}

    def poll(self):
        self._check()
        self._tick()
        results = []
        for job_id, job in list(self._jobs.items()):
            if job.completion is not None:
                if not self._current(job.request):
                    self._complete(job, "stale")
                results.append(job.completion)
                del self._jobs[job_id]
        return results

    def close(self):
        self._check()
        for job in self._jobs.values():
            job.token.set()
        self._pool.shutdown(wait=True, cancel_futures=True)
        self._jobs.clear()
        self._sessions.clear()
        self._cache.clear()
        self._cache_bytes = 0
        self._closed = True

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()
