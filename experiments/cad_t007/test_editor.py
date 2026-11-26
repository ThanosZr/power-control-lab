import math
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from experiments.cad_t003.document import ContractError
from experiments.cad_t007.editor import Editor


def key(state):
    return dict(session=state["session"], revision=state["document"]["revision"])


class EditorTests(unittest.TestCase):
    def test_native_edit_history_persistence_and_rollback(self):
        with Editor() as e:
            start = e.state()
            edit = e.edit({"diameter":32,"length":180}, **key(start))
            self.assertAlmostEqual(edit["mesh"]["volume_mm3"], math.pi*256*180, places=6)
            self.assertEqual(edit["document"]["revision"],1)
            self.assertEqual(e.edit({"length":180}, **key(edit)),edit)
            with self.assertRaises(ContractError):
                e.edit({"diameter":0}, **key(edit))
            with self.assertRaises(ContractError):
                e.edit({"length":200}, **key(start))
            with patch.object(e,"_build",side_effect=RuntimeError("forced failure")):
                with self.assertRaises(RuntimeError):
                    e.edit({"length":220}, **key(edit))
                with self.assertRaises(RuntimeError):
                    e.undo(**key(edit))
            self.assertEqual(e.state(),edit)
            undo=e.undo(**key(edit))
            self.assertEqual(undo["mesh"],start["mesh"])
            redo=e.redo(**key(undo))
            self.assertEqual(redo["mesh"],edit["mesh"])
            self.assertEqual(redo["document"]["revision"],3)
            with TemporaryDirectory() as directory:
                file=Path(directory)/"shaft.cad.json"
                e.save(file)
                e.edit({"length":200}, **key(redo))
                opened=e.open(file, **key(e.state()))
                self.assertEqual(opened["document"],redo["document"])
                self.assertEqual(opened["mesh"],redo["mesh"])
                self.assertNotEqual(opened["session"],redo["session"])
                with self.assertRaises(ContractError):
                    e.undo(**key(opened))
                with self.assertRaises(ContractError):
                    e.edit({"length":150}, **key(redo))
                with self.assertRaises(ContractError):
                    e.open_text("{}",**key(opened))
                self.assertEqual(e.state(),opened)


if __name__ == "__main__":
    unittest.main()
