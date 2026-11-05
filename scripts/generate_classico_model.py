import json
import math
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PHOTO = ROOT / "static" / "images" / "classico-recorte.png"
OUTPUT = ROOT / "static" / "models" / "classico-aproximado.glb"

buffer = bytearray()
buffer_views = []
accessors = []
meshes = []
nodes = []
materials = []


def align_buffer():
    buffer.extend(b"\0" * (-len(buffer) % 4))


def add_buffer_view(data, target=None):
    align_buffer()
    offset = len(buffer)
    buffer.extend(data)
    view = {"buffer": 0, "byteOffset": offset, "byteLength": len(data)}
    if target is not None:
        view["target"] = target
    buffer_views.append(view)
    return len(buffer_views) - 1


def add_accessor(view, component_type, count, value_type, minimum=None, maximum=None):
    accessor = {
        "bufferView": view,
        "componentType": component_type,
        "count": count,
        "type": value_type,
    }
    if minimum is not None:
        accessor["min"] = minimum
        accessor["max"] = maximum
    accessors.append(accessor)
    return len(accessors) - 1


def make_material(name, color, roughness=0.82):
    materials.append({
        "name": name,
        "pbrMetallicRoughness": {
            "baseColorFactor": color,
            "metallicFactor": 0,
            "roughnessFactor": roughness,
        },
    })
    return len(materials) - 1


def vertex_normals(vertices, triangles):
    normals = [[0.0, 0.0, 0.0] for _ in vertices]
    for a, b, c in triangles:
        ab = [vertices[b][i] - vertices[a][i] for i in range(3)]
        ac = [vertices[c][i] - vertices[a][i] for i in range(3)]
        cross = [
            ab[1] * ac[2] - ab[2] * ac[1],
            ab[2] * ac[0] - ab[0] * ac[2],
            ab[0] * ac[1] - ab[1] * ac[0],
        ]
        for index in (a, b, c):
            for axis in range(3):
                normals[index][axis] += cross[axis]
    for normal in normals:
        length = math.sqrt(sum(value * value for value in normal)) or 1
        for axis in range(3):
            normal[axis] /= length
    return normals


def add_mesh(name, vertices, triangles, material, uvs=None):
    normals = vertex_normals(vertices, triangles)
    flat_positions = [value for vertex in vertices for value in vertex]
    flat_normals = [value for normal in normals for value in normal]
    position_view = add_buffer_view(struct.pack("<" + "f" * len(flat_positions), *flat_positions), 34962)
    normal_view = add_buffer_view(struct.pack("<" + "f" * len(flat_normals), *flat_normals), 34962)
    indices = [index for triangle in triangles for index in triangle]
    index_view = add_buffer_view(struct.pack("<" + "I" * len(indices), *indices), 34963)

    attributes = {
        "POSITION": add_accessor(
            position_view,
            5126,
            len(vertices),
            "VEC3",
            [min(v[i] for v in vertices) for i in range(3)],
            [max(v[i] for v in vertices) for i in range(3)],
        ),
        "NORMAL": add_accessor(normal_view, 5126, len(vertices), "VEC3"),
    }
    if uvs is not None:
        uv_view = add_buffer_view(struct.pack("<" + "f" * (len(uvs) * 2), *(v for uv in uvs for v in uv)), 34962)
        attributes["TEXCOORD_0"] = add_accessor(uv_view, 5126, len(uvs), "VEC2")

    index_accessor = add_accessor(index_view, 5125, len(indices), "SCALAR")
    meshes.append({
        "name": name,
        "primitives": [{
            "attributes": attributes,
            "indices": index_accessor,
            "material": material,
        }],
    })
    nodes.append({"name": name, "mesh": len(meshes) - 1})


def add_ellipsoid(name, center, radii, material, segments=48, rings=20):
    vertices = []
    triangles = []
    for row in range(rings + 1):
        latitude = -math.pi / 2 + math.pi * row / rings
        for column in range(segments):
            longitude = 2 * math.pi * column / segments
            vertices.append((
                center[0] + radii[0] * math.cos(latitude) * math.cos(longitude),
                center[1] + radii[1] * math.sin(latitude),
                center[2] + radii[2] * math.cos(latitude) * math.sin(longitude),
            ))
    for row in range(rings):
        for column in range(segments):
            a = row * segments + column
            b = row * segments + (column + 1) % segments
            c = (row + 1) * segments + column
            d = (row + 1) * segments + (column + 1) % segments
            triangles.extend(((a, c, b), (b, c, d)))
    add_mesh(name, vertices, triangles, material)


def add_layer(name, center_y, radius_x, radius_z, height, material, segments=64):
    vertices = []
    triangles = []
    for y in (center_y - height / 2, center_y + height / 2):
        for i in range(segments):
            angle = 2 * math.pi * i / segments
            wobble = 1 + 0.018 * math.sin(5 * angle) + 0.012 * math.cos(9 * angle)
            vertices.append((
                radius_x * wobble * math.cos(angle),
                y + 0.012 * math.sin(3 * angle),
                radius_z * wobble * math.sin(angle),
            ))
    for i in range(segments):
        next_i = (i + 1) % segments
        triangles.extend(((i, next_i, segments + i), (next_i, segments + next_i, segments + i)))
    add_mesh(name, vertices, triangles, material)


def add_front_strip(name, points, width, material):
    vertices = []
    triangles = []
    for i, (x, y) in enumerate(points):
        previous = points[max(0, i - 1)]
        following = points[min(len(points) - 1, i + 1)]
        dx, dy = following[0] - previous[0], following[1] - previous[1]
        length = math.hypot(dx, dy) or 1
        nx, ny = -dy / length, dx / length
        for side in (-1, 1):
            px, py = x + nx * width * side / 2, y + ny * width * side / 2
            depth = 0.48 * math.sqrt(max(0.06, 1 - (px / 0.82) ** 2))
            vertices.append((px, py, depth + 0.025))
    for i in range(len(points) - 1):
        a = i * 2
        triangles.extend(((a, a + 1, a + 2), (a + 1, a + 3, a + 2)))
    add_mesh(name, vertices, triangles, material)


def add_photo_surface(material):
    rows, columns = 36, 32
    vertices = []
    uvs = []
    triangles = []
    for row in range(rows + 1):
        v = row / rows
        y = 0.03 + 1.88 * v
        for column in range(columns + 1):
            u = column / columns
            x = -0.82 + 1.64 * u
            depth = 0.56 * math.sqrt(max(0.015, 1 - (x / 0.86) ** 2 - ((y - 0.97) / 1.05) ** 2))
            vertices.append((x, y, depth + 0.5))
            uvs.append((u, v))
    for row in range(rows):
        for column in range(columns):
            a = row * (columns + 1) + column
            b = a + 1
            c = a + columns + 1
            d = c + 1
            triangles.extend(((a, b, c), (b, d, c)))
    add_mesh("Foto original curva na frente", vertices, triangles, material, uvs)


def build_glb():
    bun = make_material("Pao dourado", [0.72, 0.30, 0.08, 1])
    bun_edge = make_material("Borda do pao", [0.45, 0.17, 0.045, 1])
    patty = make_material("Carne grelhada", [0.25, 0.12, 0.075, 1])
    bacon = make_material("Bacon", [0.55, 0.17, 0.075, 1])
    bacon_light = make_material("Bacon tostado", [0.73, 0.34, 0.12, 1])
    cheese = make_material("Queijo cheddar", [1.0, 0.63, 0.04, 1])
    stick = make_material("Palito", [0.77, 0.67, 0.38, 1])

    add_ellipsoid("Pao inferior", (0, 0.25, 0), (0.78, 0.2, 0.55), bun)
    add_layer("Carne", 0.68, 0.7, 0.51, 0.31, patty)
    add_layer("Queijo entre camadas", 0.88, 0.73, 0.54, 0.09, cheese)
    add_layer("Bacon em volta", 1.01, 0.75, 0.55, 0.16, bacon)
    add_layer("Queijo superior", 1.13, 0.74, 0.54, 0.11, cheese)
    add_layer("Bacon superior", 1.26, 0.75, 0.54, 0.18, bacon_light)
    add_ellipsoid("Pao superior", (0, 1.48, 0), (0.79, 0.36, 0.56), bun)

    for index in range(3):
        points = []
        for step in range(25):
            x = -0.68 + step * 1.36 / 24
            y = 1.10 + index * 0.13 + 0.055 * math.sin(step * 0.55 + index * 1.7)
            points.append((x, y))
        add_front_strip("Fatia de bacon %d" % index, points, 0.11, bacon_light if index == 1 else bacon)

    add_ellipsoid("Palito", (0, 1.78, 0), (0.035, 0.26, 0.035), stick, segments=16, rings=8)

    image_bytes = PHOTO.read_bytes()
    image_view = add_buffer_view(image_bytes)
    materials.append({
        "name": "Foto real do pedido",
        "pbrMetallicRoughness": {
            "baseColorFactor": [1, 1, 1, 1],
            "baseColorTexture": {"index": 0},
            "metallicFactor": 0,
            "roughnessFactor": 1,
        },
        "alphaMode": "BLEND",
        "doubleSided": True,
    })
    photo_material = len(materials) - 1
    add_photo_surface(photo_material)

    document = {
        "asset": {"version": "2.0", "generator": "Menu em foco - modelo aproximado baseado na foto"},
        "scene": 0,
        "scenes": [{"nodes": list(range(len(nodes)))}],
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "textures": [{"sampler": 0, "source": 0}],
        "images": [{"bufferView": image_view, "mimeType": "image/png", "name": "Foto original do hambúrguer"}],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(buffer)}],
    }

    json_bytes = json.dumps(document, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    json_bytes += b" " * (-len(json_bytes) % 4)
    align_buffer()
    total_length = 12 + 8 + len(json_bytes) + 8 + len(buffer)
    glb = (
        struct.pack("<4sII", b"glTF", 2, total_length)
        + struct.pack("<I4s", len(json_bytes), b"JSON")
        + json_bytes
        + struct.pack("<I4s", len(buffer), b"BIN\0")
        + buffer
    )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(glb)
    return OUTPUT, len(nodes), len(glb)


if __name__ == "__main__":
    path, mesh_count, size = build_glb()
    print("Created %s (%d meshes, %d bytes)" % (path, mesh_count, size))
