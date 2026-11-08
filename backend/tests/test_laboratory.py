import json
import struct
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

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
    def setUp(self):
        folder = TemporaryDirectory(dir=settings.BASE_DIR)
        self.addCleanup(folder.cleanup)
        self.root = Path(folder.name)
        for name in ("run.py", "python.exe", "config.yaml", "model.safetensors"):
            (self.root / name).touch()
        config = override_settings(
            FOOD_LAB_SF3D_DIR=str(self.root),
            FOOD_LAB_SF3D_PYTHON=str(self.root / "python.exe"),
            FOOD_LAB_SF3D_WEIGHTS=str(self.root),
            FOOD_LAB_SF3D_DEVICE="cpu",
        )
        config.enable()
        self.addCleanup(config.disable)

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

    @patch("laboratory.reconstruction.subprocess.run")
    def test_sends_original_bytes_to_local_model_and_returns_textured_glb(self, run):
        model = glb({
            "materials": [{"pbrMetallicRoughness": {"baseColorTexture": {"index": 0}}}],
            "textures": [{"source": 0}],
            "images": [{"bufferView": 0, "mimeType": "image/png"}],
        })
        def export(command, **options):
            self.assertEqual(command[:2], [str(self.root / "python.exe"), str(self.root / "run.py")])
            source = Path(command[2])
            self.assertEqual(source.read_bytes(), PNG)
            self.assertEqual(source.suffix, ".png")
            self.assertEqual(command[command.index("--device") + 1], "cpu")
            self.assertEqual(options["env"]["SF3D_USE_CPU"], "1")
            self.assertTrue(options["check"])
            output = Path(command[command.index("--output-dir") + 1]) / "0"
            output.mkdir(parents=True)
            (output / "mesh.glb").write_bytes(model)

        run.side_effect = export
        response = self.submit()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, model)
        self.assertEqual(response.headers["Cache-Control"], "no-store")
        self.assertEqual(response.headers["Content-Type"], "model/gltf-binary")
        self.assertFalse(Path(run.call_args.args[0][2]).exists())

    @patch("laboratory.reconstruction.subprocess.run")
    def test_rejects_untextured_or_external_results_and_handles_worker_failure(self, run):
        for model in (b"bad", glb({}), glb({
            "materials": [{"pbrMetallicRoughness": {"baseColorTexture": {"index": 0}}}],
            "images": [{"uri": "https://example.invalid/texture.png"}],
        })):
            def export(command, **options):
                output = Path(command[command.index("--output-dir") + 1]) / "0"
                output.mkdir(parents=True)
                (output / "mesh.glb").write_bytes(model)

            run.side_effect = export
            self.assertEqual(self.submit().status_code, 502)
        run.side_effect = OSError("internal detail")
        response = self.submit()
        self.assertEqual(response.status_code, 503)
        self.assertNotContains(response, "internal detail", status_code=503)
