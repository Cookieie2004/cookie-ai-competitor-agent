import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app, root


class BackendBrandingTests(unittest.TestCase):
    def test_public_api_uses_cookie_and_qwen_branding(self):
        self.assertEqual(app.title, "曲奇 Cookie AI 竞品情报工作台 API")
        self.assertEqual(root()["name"], "曲奇 Cookie AI 竞品情报工作台 API")

    def test_docs_loads_swagger_assets_from_this_server(self):
        response = TestClient(app).get("/docs")

        self.assertEqual(response.status_code, 200)
        self.assertIn('/static/swagger-ui/swagger-ui-bundle.js', response.text)
        self.assertIn('/static/swagger-ui/swagger-ui.css', response.text)
        self.assertNotIn('cdn.jsdelivr.net', response.text)

    def test_public_project_text_uses_cookie_qwen_and_codex(self):
        root_dir = Path(__file__).resolve().parents[2]
        text_files = [
            root_dir / "README.md",
            root_dir / "CONTRIBUTING.md",
            root_dir / "requirements.txt",
            root_dir / "restart.sh",
            root_dir / "stop.sh",
            root_dir / "docs" / "ARCHITECTURE.md",
            root_dir / "docs" / "AGENTS.md",
            root_dir / "docs" / "DEPLOYMENT.md",
            root_dir / "frontend" / "README.md",
            root_dir / "backend" / ".env.example",
            root_dir / "api" / ".env.example",
        ]
        old_terms = ("青野", "Verda", "智谱", "GLM", "TRAE", "Trae")
        text = "\n".join(path.read_text(encoding="utf-8") for path in text_files)

        for term in old_terms:
            self.assertNotIn(term, text)


if __name__ == "__main__":
    unittest.main()
