import json
from threading import Event, Thread
from time import monotonic, sleep
import unittest

from experiments.cad_t003.document import shaft
from experiments.cad_t004.worker import (
    Adapter, Backpressure, Budget, Coordinator, JobError, _identity,
    checkpoint, synthetic_adapter,
)


def wait_for(coordinator, count=1):
    results = []
    deadline = monotonic() + 5
    while len(results) < count and monotonic() < deadline:
        results.extend(coordinator.poll())
        if len(results) < count:
            sleep(0.001)
    if len(results) != count:
        raise AssertionError(f"Expected {count} completions, got {results}")
    return {r.job_id: r for r in results}


class WorkerTests(unittest.TestCase):
    def test_shaft_and_cache_after_undo(self):
        doc = shaft()
        with Coordinator() as c:
            s = c.open(doc.snapshot())
            j = c.submit(s, doc.snapshot(), work_bytes=64)
            first = wait_for(c)[j]
            self.assertEqual(first.status, "success")
            self.assertFalse(first.cached)
            self.assertEqual(json.loads(first.payload)["features"][0]["args"]["radius_mm"], 10)
            doc.set_parameters({"diameter": 32}, expected_revision=0)
            c.advance(s, doc.snapshot())
            j = c.submit(s, doc.snapshot(), work_bytes=64)
            second = wait_for(c)[j]
            self.assertNotEqual(first.cache_key, second.cache_key)
            self.assertEqual(json.loads(second.payload)["features"][0]["args"]["radius_mm"], 16)
            doc.undo(expected_revision=1)
            c.advance(s, doc.snapshot())
            j = c.submit(s, doc.snapshot(), work_bytes=64)
            last = wait_for(c)[j]
            self.assertTrue(last.cached)
            self.assertEqual((last.revision, last.cache_key, last.payload), (2, first.cache_key, first.payload))

    def test_adapter_kernel_tolerance_and_dependencies(self):
        snap = shaft().snapshot()
        def key(adapter, snapshot=snap):
            return _identity(snapshot, adapter, 65536)[1]
        base = Adapter("a", "1", "k", "1", 1e-6)
        keys = {key(base), key(Adapter("a", "2", "k", "1", 1e-6)),
                key(Adapter("a", "1", "k", "2", 1e-6)), key(Adapter("a", "1", "k", "1", 1e-5))}
        self.assertEqual(len(keys), 4)
        snap["features"].append({"id": "other", "op": "cylinder", "inputs": [],
                                 "args": {"radius": 5, "height": 5, "origin": [0, 0, 0]}})
        snap["features"].append({"id": "joined", "op": "union", "inputs": ["shaft-body", "other"], "args": {}})
        snap["output"] = "joined"
        combined = key(base)
        snap["features"][1]["args"]["radius"] = 6
        self.assertNotEqual(combined, key(base))

    def test_session_conflicts_and_reopen(self):
        d = shaft()
        with Coordinator() as c:
            a = c.open(d.snapshot())
            b = c.open(d.snapshot())
            self.assertNotEqual(a, b)
            wrong = shaft(d.snapshot()["id"], diameter_mm=21).snapshot()
            with self.assertRaises(JobError):
                c.advance(a, wrong)
            with self.assertRaises(JobError):
                c.submit(a, wrong, work_bytes=1)
            c.close_session(a)
            with self.assertRaises(JobError):
                c.submit(a, d.snapshot(), work_bytes=1)
            j = c.submit(b, d.snapshot(), work_bytes=1)
            self.assertEqual(wait_for(c)[j].session_id, b)

    def test_running_cancellation_keeps_reservation_until_exit(self):
        started, release, observed = Event(), Event(), Event()
        def execute(plan, token):
            started.set()
            release.wait(4)
            if token.is_set():
                observed.set()
            checkpoint(token)
            return synthetic_adapter(plan, token)
        with Coordinator(execute=execute) as c:
            d = shaft().snapshot()
            s = c.open(d)
            j = c.submit(s, d, work_bytes=100)
            try:
                self.assertTrue(started.wait(2))
                self.assertTrue(c.cancel(j))
                self.assertEqual(c.stats()["work_reserved_bytes"], 100)
                self.assertEqual(c.poll(), [])
            finally:
                release.set()
            self.assertEqual(wait_for(c)[j].status, "cancelled")
            self.assertTrue(observed.is_set())
            self.assertEqual(c.stats()["work_reserved_bytes"], 0)
            self.assertEqual(c.stats()["cache_entries"], 0)

    def test_advance_invalidates_running_queued_and_unread(self):
        release, started = Event(), Event()
        def execute(plan, token):
            started.set()
            release.wait(4)
            return b"old"  # even ignoring token the coordinator rejects stale delivery
        with Coordinator(Budget(total_cpu=2, live_cpu=1), execute=execute) as c:
            d = shaft()
            s = c.open(d.snapshot())
            j = c.submit(s, d.snapshot(), work_bytes=1)
            q = c.submit(s, d.snapshot(), work_bytes=1)
            try:
                self.assertTrue(started.wait(2))
                d.set_parameters({"length": 150}, expected_revision=0)
                c.advance(s, d.snapshot())
                results = c.poll()
                self.assertEqual([(r.job_id, r.status) for r in results], [(q, "stale")])
            finally:
                release.set()
            self.assertEqual(wait_for(c)[j].status, "stale")
            self.assertEqual(c.stats()["cache_entries"], 0)
            unread = c.submit(s, d.snapshot(), work_bytes=1)
            deadline = monotonic() + 3
            while c.stats()["running"] and monotonic() < deadline:
                sleep(0.001)
            self.assertEqual(c.stats()["running"], 0)
            c.close_session(s)
            r = wait_for(c)[unread]
            self.assertEqual((r.status, r.payload), ("stale", None))

    def test_memory_cpu_fifo_and_queued_cancel(self):
        gate = Event()
        def execute(plan, token):
            gate.wait(4)
            return synthetic_adapter(plan, token)
        budget = Budget(total_cpu=4, live_cpu=2)
        with Coordinator(budget, execute=execute) as c:
            snaps = [shaft(f"s-{i}").snapshot() for i in range(4)]
            sessions = [c.open(d) for d in snaps]
            try:
                a = c.submit(sessions[0], snaps[0], work_bytes=budget.worker_bytes - 1)
                b = c.submit(sessions[1], snaps[1], work_bytes=2)
                small = c.submit(sessions[2], snaps[2], work_bytes=1)
                self.assertEqual((c.stats()["running"], c.stats()["queued"]), (1, 2))
                self.assertTrue(c.cancel(b))
                self.assertEqual((c.stats()["running"], c.stats()["queued"]), (2, 0))
                self.assertEqual(c.stats()["work_reserved_bytes"], budget.worker_bytes)
                with self.assertRaises(Backpressure):
                    c.submit(sessions[3], snaps[3], work_bytes=budget.worker_bytes + 1)
                self.assertEqual(c.poll()[0].status, "cancelled")
            finally:
                gate.set()
            self.assertEqual(set(wait_for(c, 2)), {a, small})

    def test_backpressure_includes_unread_results_and_sessions(self):
        budget = Budget(max_outstanding=1, max_sessions=1)
        with Coordinator(budget) as c:
            d = shaft().snapshot()
            s = c.open(d)
            j = c.submit(s, d, work_bytes=1)
            with self.assertRaises(Backpressure):
                c.submit(s, d, work_bytes=1)
            with self.assertRaises(Backpressure):
                c.open(d)
            wait_for(c)[j]
            j = c.submit(s, d, work_bytes=1)
            self.assertTrue(wait_for(c)[j].cached)

    def test_failure_oversize_not_cached_retry(self):
        calls = []
        def execute(plan, token):
            calls.append(1)
            if len(calls) == 1:
                raise RuntimeError("synthetic failure")
            if len(calls) == 2:
                return b"x" * 9
            return b"ok"
        with Coordinator(Budget(max_result_bytes=8), execute=execute) as c:
            d = shaft().snapshot()
            s = c.open(d)
            for error in ("RuntimeError", "JobError"):
                j = c.submit(s, d, work_bytes=1)
                r = wait_for(c)[j]
                self.assertEqual((r.status, r.error, r.payload), ("failed", error, None))
                self.assertEqual(c.stats()["cache_entries"], 0)
            j = c.submit(s, d, work_bytes=1)
            r = wait_for(c)[j]
            self.assertEqual(r.payload, b"ok")

    def test_lru_byte_bound_and_cache_disable(self):
        with Coordinator(Budget(cache_bytes=8), execute=lambda p, t: b"1234") as c:
            docs = [shaft(f"d-{i}").snapshot() for i in range(3)]
            sessions = [c.open(d) for d in docs]
            def submit(i):
                j = c.submit(sessions[i], docs[i], work_bytes=1)
                return wait_for(c)[j]
            self.assertFalse(submit(0).cached)
            self.assertFalse(submit(1).cached)
            self.assertTrue(submit(0).cached)
            self.assertFalse(submit(2).cached)
            self.assertEqual(c.stats()["cache_bytes"], 8)
            self.assertTrue(submit(0).cached)
            self.assertFalse(submit(1).cached)
        with Coordinator(Budget(cache_bytes=0)) as c:
            d = shaft().snapshot()
            s = c.open(d)
            for _ in range(2):
                j = c.submit(s, d, work_bytes=1)
                self.assertFalse(wait_for(c)[j].cached)

    def test_input_budget_and_owner_thread(self):
        with self.assertRaises(JobError):
            Budget(total_cpu=2, live_cpu=2)
        with self.assertRaises(JobError):
            Budget(total_bytes=1)
        with Coordinator(Budget(max_input_bytes=64)) as c:
            with self.assertRaises(JobError):
                c.open(shaft().snapshot())
            errors = []
            def other_thread():
                try:
                    c.stats()
                except JobError:
                    errors.append(True)
            t = Thread(target=other_thread)
            t.start()
            t.join(2)
            self.assertEqual(errors, [True])

    def test_cache_entry_bound(self):
        with Coordinator(Budget(max_cache_entries=1), execute=lambda p, t: b"x") as c:
            a, b = shaft("one").snapshot(), shaft("two").snapshot()
            s1, s2 = c.open(a), c.open(b)
            for session, snapshot in ((s1, a), (s2, b), (s1, a)):
                job = c.submit(session, snapshot, work_bytes=1)
                self.assertFalse(wait_for(c)[job].cached)
                self.assertEqual(c.stats()["cache_entries"], 1)


if __name__ == "__main__":
    unittest.main()
