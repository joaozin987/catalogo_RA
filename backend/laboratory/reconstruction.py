import json
import os
import struct
import subprocess  # nosec B404
from pathlib import Path
from tempfile import TemporaryDirectory

from django.conf import settings

MAX_GLB_BYTES = 25 * 1024 * 1024


def reconstruct(image, suffix):
    directory = Path(settings.FOOD_LAB_SF3D_DIR)
    python = Path(settings.FOOD_LAB_SF3D_PYTHON)
    weights = Path(settings.FOOD_LAB_SF3D_WEIGHTS)
    device = settings.FOOD_LAB_SF3D_DEVICE
    if not all(path.is_absolute() for path in (directory, python, weights)):
        raise OSError("SF3D paths must be absolute")
    script = directory / "run.py"
    required_files = (script, python, weights / "config.yaml", weights / "model.safetensors")
    if device not in {"cpu", "cuda", "mps"} or not all(path.is_file() for path in required_files):
        raise OSError("SF3D installation is incomplete")

    environment = {
        **os.environ,
        "HF_HUB_OFFLINE": "1",
        "SF3D_USE_CPU": "1" if device == "cpu" else "0",
    }
    with TemporaryDirectory(prefix="food-lab-") as folder:
        source = Path(folder) / f"reference.{suffix}"
        source.write_bytes(image)
        output = Path(folder) / "output"
        command = [
            str(python), str(script), str(source), "--output-dir", str(output),
            "--device", device, "--pretrained-model", str(weights),
        ]
        # The request supplies only the bytes written to the generated path.
        subprocess.run(  # nosec B603
            command, cwd=directory, env=environment, check=True, timeout=600,
            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        try:
            with (output / "0" / "mesh.glb").open("rb") as result:
                model = result.read(MAX_GLB_BYTES + 1)
        except FileNotFoundError as exc:
            raise ValueError("SF3D did not export a mesh") from exc
    validate_glb(model)
    return model


def validate_glb(model):
    if not 20 <= len(model) <= MAX_GLB_BYTES:
        raise ValueError("GLB size")
    magic, version, total, chunk_size, chunk_type = struct.unpack_from("<4sIII4s", model)
    if (magic, version, total, chunk_type) != (b"glTF", 2, len(model), b"JSON"):
        raise ValueError("GLB header")
    if chunk_size % 4 or not 0 < chunk_size <= len(model) - 20:
        raise ValueError("GLB JSON chunk")
    document = json.loads(model[20:20 + chunk_size])
    # GLB images and buffers must be embedded.
    try:
        images = document.get("images", [])
        buffers = document.get("buffers", [])
        if any("uri" in resource for resource in (*images, *buffers)):
            raise ValueError("GLB external resource")
        materials = document.get("materials", [])
        for material in materials:
            texture = material.get("pbrMetallicRoughness", {}).get("baseColorTexture")
            if texture is not None:
                index = texture["index"]
                if type(index) is not int or index < 0:
                    raise ValueError("GLB texture index")
                source = document["textures"][index]["source"]
                if type(source) is not int or source < 0:
                    raise ValueError("GLB image index")
                if "bufferView" in images[source]:
                    return
    except (AttributeError, IndexError, KeyError, TypeError) as exc:
        raise ValueError("GLB metadata") from exc
    raise ValueError("GLB missing embedded color texture")
