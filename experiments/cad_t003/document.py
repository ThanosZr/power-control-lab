"""Isolated, kernel-neutral CAD document contract v1 (no PCL/runtime imports)."""

from copy import deepcopy
import hashlib
import json
import math
import re


SCHEMA = "pcl.cad.document"
VERSION = 1
HISTORY_LIMIT = 64
_ID = re.compile(r"[A-Za-z][A-Za-z0-9_.-]{0,63}\Z")


class ContractError(ValueError):
    """Invalid or unsupported document/command; no state has been changed."""


class RevisionConflict(ContractError):
    """The caller edited a stale revision."""


def _fields(obj, keys):
    if not isinstance(obj, dict) or set(obj) != set(keys.split()):
        raise ContractError(f"Expected fields: {keys}")


def _id(value):
    if not isinstance(value, str) or not _ID.fullmatch(value):
        raise ContractError("Invalid stable ID")
    return value


def _number(value):
    if type(value) not in (int, float):
        raise ContractError("Expected finite real number")
    try:
        result = float(value)
    except OverflowError as exc:
        raise ContractError("Number outside supported range") from exc
    if not math.isfinite(result):
        raise ContractError("Expected finite real number")
    return result


def _positive(value):
    value = _number(value)
    if value <= 0:
        raise ContractError("Expected positive number")
    return value


def _revision(value):
    if type(value) is not int or not 0 <= value <= 2**53 - 1:
        raise ContractError("Invalid revision (JSON-safe integer required)")
    return value


def _index(items):
    if not isinstance(items, list):
        raise ContractError("Expected list")
    result = {}
    for item in items:
        if not isinstance(item, dict):
            raise ContractError("Expected record")
        key = _id(item.get("id"))
        if key in result:
            raise ContractError(f"Duplicate ID: {key}")
        result[key] = item
    return result


def _resolve(expr, parameters):
    # Typed, length-only references; no code evaluation or expression parser.
    if isinstance(expr, dict):
        _fields(expr, "parameter scale")
        key = _id(expr["parameter"])
        if key not in parameters:
            raise ContractError(f"Unknown parameter: {key}")
        return _number(parameters[key]["value"] * _number(expr["scale"]))
    return _number(expr)


def _vector(items, parameters):
    if not isinstance(items, list) or len(items) != 3:
        raise ContractError("Expected three coordinates")
    return [_resolve(item, parameters) for item in items]


def _canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)


def _unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ContractError(f"Duplicate JSON property: {key}")
        result[key] = value
    return result


def validate(document):
    """Validate closed v1 schema and return a detached, resolved operation plan.

    Features are supplied in dependency order. A reference to a later feature
    is invalid (including cycles). All lengths are mm; material density kg/m³.
    No geometry or computed mass is persisted in this contract.
    """
    _fields(document, "schema version id revision component parameters features output ports")
    if document["schema"] != SCHEMA or type(document["version"]) is not int or document["version"] != VERSION:
        raise ContractError("Unsupported CAD schema/version; explicit migration required")
    _id(document["id"])
    _revision(document["revision"])
    component = document["component"]
    _fields(component, "id template template_version material")
    _id(component["id"])
    _id(component["template"])
    if type(component["template_version"]) is not int or not 1 <= component["template_version"] <= 2**53 - 1:
        raise ContractError("Invalid template version")
    material = component["material"]
    _fields(material, "id density_kg_m3")
    _id(material["id"])
    _positive(material["density_kg_m3"])
    parameters = _index(document["parameters"])
    for p in parameters.values():
        _fields(p, "id type unit value min max")
        if p["type"] != "length" or p["unit"] != "mm":
            raise ContractError("v1 supports length parameters in mm only")
        low, high, value = _positive(p["min"]), _positive(p["max"]), _number(p["value"])
        if not low <= value <= high:
            raise ContractError(f"Parameter outside bounds: {p['id']}")

    features = _index(document["features"])
    plan = {}
    for key, f in features.items():
        _fields(f, "id op inputs args")
        inputs = f["inputs"]
        if not isinstance(inputs, list) or any(_id(i) not in plan for i in inputs) or len(set(inputs)) != len(inputs):
            raise ContractError(f"Invalid or forward dependency: {key}")
        args = f["args"]
        if f["op"] == "cylinder":
            _fields(args, "radius height origin")
            if inputs:
                raise ContractError("Cylinder takes no feature inputs")
            resolved = {"radius_mm": _positive(_resolve(args["radius"], parameters)),
                        "height_mm": _positive(_resolve(args["height"], parameters)),
                        "origin_mm": _vector(args["origin"], parameters)}
        elif f["op"] == "union":
            _fields(args, "")
            if len(inputs) < 2:
                raise ContractError("Union requires at least two unique inputs")
            resolved = {}
        else:
            raise ContractError(f"Unsupported operation: {f['op']}")
        plan[key] = {"id": key, "op": f["op"], "inputs": list(inputs), "args": resolved}
    output = _id(document["output"])
    if output not in plan:
        raise ContractError("Unknown output feature")

    ports = []
    for key, port in _index(document["ports"]).items():
        _fields(port, "id kind origin axis")
        if port["kind"] != "mechanical.rotational" or port["axis"] != [0, 0, 1] or any(type(n) not in (int, float) for n in port["axis"]):
            raise ContractError("v1 rotational ports must align with global +Z")
        ports.append({"id": key, "kind": port["kind"], "origin_mm": _vector(port["origin"], parameters), "axis": [0, 0, 1]})
    return {"document_id": document["id"], "revision": document["revision"],
            "features": list(plan.values()), "output": output, "ports": ports,
            "material": deepcopy(material)}


def dumps(document):
    validate(document)
    return _canonical(document)


def loads(text):
    try:
        document = json.loads(text, object_pairs_hook=_unique_pairs)
    except (TypeError, ValueError) as exc:
        raise ContractError(f"Invalid CAD JSON: {exc}") from exc
    validate(document)
    return document


def content_key(document):
    """Document identity, excluding revision; not a complete kernel cache key."""
    validate(document)
    payload = {k: v for k, v in document.items() if k != "revision"}
    return hashlib.sha256(_canonical(payload).encode("utf-8")).hexdigest()


class Document:
    """Single-owner, in-memory transaction API; not thread-safe or a scheduler."""

    def __init__(self, document):
        validate(document)
        self._document = deepcopy(document)
        self._undo = []
        self._redo = []

    def snapshot(self):
        return deepcopy(self._document)

    def plan(self):
        return validate(self._document)

    def _check(self, expected_revision):
        if _revision(expected_revision) != self._document["revision"]:
            raise RevisionConflict("Stale document revision")

    def _next(self, candidate):
        candidate = deepcopy(candidate)
        candidate["revision"] = self._document["revision"] + 1
        validate(candidate)
        return candidate

    @staticmethod
    def _remember(history, document):
        history.append(document)
        if len(history) > HISTORY_LIMIT:
            del history[0]

    def set_parameters(self, changes, *, expected_revision):
        self._check(expected_revision)
        if not isinstance(changes, dict) or not changes:
            raise ContractError("Expected non-empty parameter changes")
        candidate = self.snapshot()
        parameters = _index(candidate["parameters"])
        for key, value in changes.items():
            if _id(key) not in parameters:
                raise ContractError(f"Unknown parameter: {key}")
            parameters[key]["value"] = _number(value)
        if candidate == self._document:
            return self.snapshot()
        candidate = self._next(candidate)
        self._remember(self._undo, self._document)
        self._redo.clear()
        self._document = candidate
        return self.snapshot()

    def _restore(self, source, destination, expected_revision):
        self._check(expected_revision)
        if not source:
            raise ContractError("No history entry")
        candidate = self._next(source[-1])
        self._remember(destination, self._document)
        source.pop()
        self._document = candidate
        return self.snapshot()

    def undo(self, *, expected_revision):
        return self._restore(self._undo, self._redo, expected_revision)

    def redo(self, *, expected_revision):
        return self._restore(self._redo, self._undo, expected_revision)


def shaft(document_id="shaft-example", *, diameter_mm=20, length_mm=100):
    """Synthetic straight cylindrical shaft; no BRep, mesh or solver execution."""
    data = {"schema": SCHEMA, "version": VERSION, "id": document_id, "revision": 0,
            "component": {"id": "shaft", "template": "straight-shaft", "template_version": 1,
                          "material": {"id": "generic-steel", "density_kg_m3": 7850}},
            "parameters": [{"id": "diameter", "type": "length", "unit": "mm", "value": _number(diameter_mm), "min": 1, "max": 1000},
                           {"id": "length", "type": "length", "unit": "mm", "value": _number(length_mm), "min": 1, "max": 10000}],
            "features": [{"id": "shaft-body", "op": "cylinder", "inputs": [],
                          "args": {"radius": {"parameter": "diameter", "scale": 0.5},
                                   "height": {"parameter": "length", "scale": 1}, "origin": [0, 0, 0]}}],
            "output": "shaft-body",
            "ports": [{"id": "end-a", "kind": "mechanical.rotational", "origin": [0, 0, 0], "axis": [0, 0, 1]},
                      {"id": "end-b", "kind": "mechanical.rotational", "origin": [0, 0, {"parameter": "length", "scale": 1}], "axis": [0, 0, 1]}]}
    return Document(data)
