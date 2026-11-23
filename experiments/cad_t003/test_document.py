"""Run explicitly from repo root; no app or OCCT dependency."""

import unittest

from experiments.cad_t003.document import (
    ContractError, Document, HISTORY_LIMIT, RevisionConflict, content_key, dumps, loads, shaft, validate,
)


class CadDocumentContractTests(unittest.TestCase):
    def test_default_shaft(self):
        doc = shaft()
        plan = doc.plan()
        self.assertEqual(plan["features"][0]["args"], {
            "radius_mm": 10, "height_mm": 100, "origin_mm": [0, 0, 0]})
        self.assertEqual(plan["ports"][1]["origin_mm"], [0, 0, 100])
        self.assertEqual(plan["material"]["density_kg_m3"], 7850)

    def test_edit_resolves_geometry_and_ports_with_stable_ids(self):
        doc = shaft()
        old = doc.plan()
        doc.set_parameters({"diameter": 32, "length": 180}, expected_revision=0)
        new = doc.plan()
        self.assertEqual(new["revision"], 1)
        self.assertEqual(new["features"][0]["args"]["radius_mm"], 16)
        self.assertEqual(new["features"][0]["args"]["height_mm"], 180)
        self.assertEqual(new["ports"][1]["origin_mm"], [0, 0, 180])
        self.assertEqual(old["output"], new["output"])
        self.assertEqual([p["id"] for p in old["ports"]], [p["id"] for p in new["ports"]])

    def test_atomic_failure(self):
        doc = shaft()
        before = doc.snapshot()
        for changes in ({"diameter": 30, "length": -1}, {"missing": 1},
                        {"length": float("nan")}, {"length": float("inf")},
                        {"length": True}, {"length": "100"}, {"length": 10**400}):
            with self.subTest(changes=changes), self.assertRaises(ContractError):
                doc.set_parameters(changes, expected_revision=0)
            self.assertEqual(doc.snapshot(), before)
        with self.assertRaises(ContractError):
            doc.undo(expected_revision=0)

    def test_revision_and_undo_redo(self):
        doc = shaft()
        original_key = content_key(doc.snapshot())
        doc.set_parameters({"length": 200}, expected_revision=0)
        edited_key = content_key(doc.snapshot())
        self.assertNotEqual(original_key, edited_key)
        with self.assertRaises(RevisionConflict):
            doc.set_parameters({"length": 50}, expected_revision=0)
        self.assertEqual(doc.undo(expected_revision=1)["revision"], 2)
        self.assertEqual(content_key(doc.snapshot()), original_key)
        self.assertEqual(doc.redo(expected_revision=2)["revision"], 3)
        self.assertEqual(content_key(doc.snapshot()), edited_key)
        doc.undo(expected_revision=3)
        doc.set_parameters({"length": 300}, expected_revision=4)
        with self.assertRaises(ContractError):
            doc.redo(expected_revision=5)

    def test_noop(self):
        doc = shaft()
        self.assertEqual(doc.set_parameters({"length": 100}, expected_revision=0)["revision"], 0)
        with self.assertRaises(ContractError):
            doc.undo(expected_revision=0)

    def test_snapshot_and_plan_detached(self):
        data = shaft().snapshot()
        doc = Document(data)
        data["parameters"][0]["value"] = 50
        snapshot = doc.snapshot()
        snapshot["features"][0]["args"]["radius"] = 1
        plan = doc.plan()
        plan["features"][0]["args"]["radius_mm"] = 2
        self.assertEqual(doc.plan()["features"][0]["args"]["radius_mm"], 10)

    def test_round_trip_and_reopen(self):
        doc = shaft()
        doc.set_parameters({"length": 250}, expected_revision=0)
        encoded = dumps(doc.snapshot())
        reopened = Document(loads(encoded))
        self.assertEqual(dumps(reopened.snapshot()), encoded)
        self.assertEqual(reopened.plan(), doc.plan())
        # History belongs to the session, not the v1 persisted snapshot.
        with self.assertRaises(ContractError):
            reopened.undo(expected_revision=1)

    def test_invalid_document_variants(self):
        cases = [lambda d: d.update(version=2), lambda d: d.update(revision=True),
                 lambda d: d.update(output="missing"), lambda d: d.update(extra=True),
                 lambda d: d["parameters"][0].update(unit="m"),
                 lambda d: d["parameters"].append(d["parameters"][0]),
                 lambda d: d["features"][0]["args"].update(radius={"parameter": "missing", "scale": 1}),
                 lambda d: d["features"][0]["args"].update(radius=-1),
                 lambda d: d["features"][0].update(op="python"),
                 lambda d: d["ports"][0].update(axis=[0, 1, 0]),
                 lambda d: d["component"]["material"].update(density_kg_m3=0)]
        for mutate in cases:
            doc = shaft().snapshot()
            mutate(doc)
            with self.assertRaises(ContractError):
                validate(doc)

    def test_invalid_json(self):
        for raw in ('{"id":"a","id":"b"}', '[]', '{', 'null'):
            with self.assertRaises(ContractError):
                loads(raw)

    def test_dependency_order_and_union(self):
        doc = shaft().snapshot()
        doc["features"].extend([
            {"id": "second", "op": "cylinder", "inputs": [],
             "args": {"radius": 5, "height": 10, "origin": [0, 0, 95]}},
            {"id": "fused", "op": "union", "inputs": ["shaft-body", "second"], "args": {}},
        ])
        doc["output"] = "fused"
        self.assertEqual(validate(doc)["features"][-1]["inputs"], ["shaft-body", "second"])
        # Forward/cyclic and duplicate dependencies are rejected, not silently reordered.
        doc["features"][-1]["inputs"] = ["fused", "second"]
        with self.assertRaises(ContractError):
            validate(doc)
        doc["features"][-1]["inputs"] = ["second", "second"]
        with self.assertRaises(ContractError):
            validate(doc)

    def test_revision_overflow_atomic(self):
        data = shaft().snapshot()
        data["revision"] = 2**53 - 1
        doc = Document(data)
        with self.assertRaises(ContractError):
            doc.set_parameters({"length": 300}, expected_revision=data["revision"])
        self.assertEqual(doc.snapshot(), data)

    def test_bounded_session_history(self):
        doc = shaft()
        for rev in range(HISTORY_LIMIT + 1):
            doc.set_parameters({"length": 200 + rev}, expected_revision=rev)
        for rev in range(HISTORY_LIMIT + 1, 2 * HISTORY_LIMIT + 1):
            doc.undo(expected_revision=rev)
        self.assertEqual(doc.plan()["features"][0]["args"]["height_mm"], 200)
        with self.assertRaises(ContractError):
            doc.undo(expected_revision=2 * HISTORY_LIMIT + 1)


if __name__ == "__main__":
    unittest.main()
