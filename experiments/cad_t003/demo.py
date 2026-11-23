"""Run from the repository root: python -m experiments.cad_t003.demo"""

import json

from .document import content_key, dumps, loads, shaft, Document


def main():
    doc = shaft()
    initial = doc.plan()
    doc.set_parameters({"diameter": 32, "length": 180}, expected_revision=0)
    saved = dumps(doc.snapshot())
    reopened = Document(loads(saved))
    print(json.dumps({"initial_plan": initial, "edited_document": reopened.snapshot(),
                      "edited_plan": reopened.plan(), "content_key": content_key(reopened.snapshot())}, indent=2))


if __name__ == "__main__":
    main()
