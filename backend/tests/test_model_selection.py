import unittest

from app.core.config import resolve_task_model
from app.main import CreateTaskBody


class ModelSelectionTests(unittest.TestCase):
    def test_manual_qwen_model_is_accepted_and_preserved(self):
        body = CreateTaskBody(query="测试竞品", model="qwen3.6-plus")

        self.assertEqual(body.model, "qwen3.6-plus")
        self.assertEqual(resolve_task_model(body.model), "qwen3.6-plus")

    def test_auto_or_unknown_model_uses_tiered_backend_routing(self):
        self.assertIsNone(resolve_task_model(None))
        self.assertIsNone(resolve_task_model("unknown-model"))


if __name__ == "__main__":
    unittest.main()
