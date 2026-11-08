import base64
import json
import struct
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener

MAX_GLB_BYTES = 25 * 1024 * 1024


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


OPENER = build_opener(ProxyHandler({}), NoRedirect())


def reconstruct(image):
    payload = {
        "image": base64.b64encode(image).decode("ascii"),
        "texture": True,
        "type": "glb",
        "seed": 42,
        "num_inference_steps": 30,
        "face_count": 40000,
    }
    request = Request(
        "http://127.0.0.1:8081/generate",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with OPENER.open(request, timeout=600) as response:
        model = response.read(MAX_GLB_BYTES + 1)
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
    # GLB images and buffers must be embedded. The worker may return an
    # untextured mesh on paint failure even though it responded with HTTP 200.
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
