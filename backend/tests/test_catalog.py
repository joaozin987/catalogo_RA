import json
import tempfile
from pathlib import Path

from django.test import SimpleTestCase, override_settings


class CatalogApiTests(SimpleTestCase):
    def test_catalog_preserves_product_and_does_not_cache(self):
        response = self.client.get("/api/products")
        self.assertEqual(response.status_code, 200)
        products = response.json()
        self.assertEqual(len(products), 1)
        self.assertEqual(products[0]["id"], "classico")
        self.assertEqual(products[0]["name"], "Clássico")
        self.assertEqual(products[0]["price"], "R$ 29,90")
        self.assertEqual(products[0]["glb"], "/static/models/hamburguer-teste.glb")
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_catalog_is_read_only(self):
        for method in ("post", "put", "patch", "delete"):
            with self.subTest(method=method):
                response = getattr(self.client, method)("/api/products")
                self.assertEqual(response.status_code, 405)

    def test_unknown_api_route_is_not_frontend_html(self):
        self.assertEqual(self.client.get("/api/unknown").status_code, 404)

    def test_json_data_matches_legacy_catalog(self):
        # Snapshot usado também pelos testes JS contra o catálogo legado.
        source = Path(__file__).resolve().parents[1] / "catalog" / "products.json"
        self.assertEqual(self.client.get("/api/products").json(), json.loads(source.read_text(encoding="utf-8")))


class FrontendRoutesTests(SimpleTestCase):
    def test_preserves_all_three_frontend_routes(self):
        with tempfile.TemporaryDirectory() as folder:
            index = Path(folder) / "index.html"
            index.write_text('<div id="app"></div>', encoding="utf-8")
            with override_settings(FRONTEND_INDEX=index):
                for route in ("/", "/camera?id=classico", "/ar?id=classico"):
                    with self.subTest(route=route):
                        response = self.client.get(route)
                        self.assertContains(response, '<div id="app"></div>')
                        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_missing_build_has_actionable_service_error(self):
        with override_settings(FRONTEND_INDEX=Path("missing-build/index.html")):
            response = self.client.get("/")
            self.assertEqual(response.status_code, 503)
            self.assertContains(response, "npm run build", status_code=503)

    def test_unknown_frontend_route_is_404(self):
        self.assertEqual(self.client.get("/nao-existe").status_code, 404)

    def test_asset_path_traversal_is_rejected(self):
        response = self.client.get("/assets/../package.json")
        self.assertEqual(response.status_code, 404)
