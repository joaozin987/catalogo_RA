import base64
import json
import struct
from unittest.mock import patch
from urllib.error import URLError

from django.conf import settings
from django.test import Client, SimpleTestCase, override_settings

URL = "/api/laboratorio-3d/reconstruir"
PNG = (settings.PROJECT_DIR / "static/images/classico-recorte.png").read_bytes()


def glb(document):
    chunk = json.dumps(document).encode()
    chunk += b" " * (-len(chunk) % 4)
    return struct.pack("<4sIII4s", b"glTF", 2, 20 + len(chunk), len(chunk), b"JSON") + chunk


@override_settings(FOOD_LAB_ENABLED=True)
class LaboratoryTests(SimpleTestCase):
    def submit(self, image=PNG, content_type="image/png", **headers):
        return self.client.post(URL, image, content_type=content_type, **headers)

    def test_disabled_and_non_loopback_requests_are_hidden(self):
        with override_settings(FOOD_LAB_ENABLED=False):
            self.assertEqual(self.submit().status_code, 404)
        self.assertEqual(self.submit(REMOTE_ADDR="192.0.2.1").status_code, 404)

    def test_requires_csrf(self):
        client = Client(enforce_csrf_checks=True)
        response = client.get("/laboratorio-3d")
        self.assertIn("csrftoken", response.cookies)
        self.assertEqual(client.post(URL, PNG, content_type="image/png").status_code, 403)

    def test_rejects_invalid_and_oversized_images_before_inference(self):
        self.assertEqual(self.submit(b"invalid").status_code, 400)
        self.assertEqual(self.submit(content_type="image/jpeg").status_code, 400)
        self.assertEqual(self.submit(b"x" * (8 * 1024 * 1024 + 1)).status_code, 413)

    @patch("laboratory.reconstruction.OPENER")
    def test_sends_original_bytes_to_local_model_and_returns_textured_glb(self, opener):
        model = glb({
            "materials": [{"pbrMetallicRoughness": {"baseColorTexture": {"index": 0}}}],
            "textures": [{"source": 0}],
            "images": [{"bufferView": 0, "mimeType": "image/png"}],
        })
        opener.open.return_value.__enter__.return_value.read.return_value = model
        response = self.submit()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, model)
        self.assertEqual(response.headers["Cache-Control"], "no-store")
        self.assertEqual(response.headers["Content-Type"], "model/gltf-binary")
        request = opener.open.call_args.args[0]
        self.assertEqual(request.full_url, "http://127.0.0.1:8081/generate")
        payload = json.loads(request.data)
        self.assertEqual(base64.b64decode(payload["image"]), PNG)
        self.assertTrue(payload["texture"])

    @patch("laboratory.reconstruction.OPENER")
    def test_rejects_untextured_or_external_results_and_handles_worker_failure(self, opener):
        result = opener.open.return_value.__enter__.return_value
        for model in (b"bad", glb({}), glb({
            "materials": [{"pbrMetallicRoughness": {"baseColorTexture": {"index": 0}}}],
            "images": [{"uri": "https://example.invalid/texture.png"}],
        })):
            result.read.return_value = model
            self.assertEqual(self.submit().status_code, 502)
        opener.open.side_effect = URLError("internal detail")
        response = self.submit()
        self.assertEqual(response.status_code, 503)
        self.assertNotContains(response, "internal detail", status_code=503)
