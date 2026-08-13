"""Generate AS/RS assets fitted to this repository's 2 m shelf grid.

Repository contract (Three.js coordinates after glTF export):
  X: crane travel and 4 m rail repeat axis
  Y: vertical lift
  Z: fork extension toward either shelf row

Run from the repository root:
  blender --background --factory-startup --python tools/blender/create_fitted_asrs_assets.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
BLENDER_DIR = ROOT / "assets" / "blender"
PREVIEW_DIR = ROOT / "assets" / "previews"

BODY_GLB = PUBLIC / "asrs_stacker_crane_body.glb"
FORK_GLB = PUBLIC / "asrs_fork_table.glb"
RAIL_GLB = PUBLIC / "asrs_ground_rail_4m.glb"
MANIFEST = PUBLIC / "asrs_asset_manifest.json"
BLEND = BLENDER_DIR / "asrs_stacker_crane_fitted.blend"
PREVIEW = PREVIEW_DIR / "asrs_stacker_crane_fitted.png"


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def collection(name: str) -> bpy.types.Collection:
    result = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(result)
    return result


def material(
    name: str,
    color: tuple[float, float, float, float],
    metallic: float = 0.0,
    roughness: float = 0.4,
) -> bpy.types.Material:
    result = bpy.data.materials.new(name)
    result.diffuse_color = color
    result.use_nodes = True
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return result


def materials() -> dict[str, bpy.types.Material]:
    return {
        "yellow": material("ASRS Yellow", (0.96, 0.52, 0.012, 1.0), 0.55, 0.30),
        "yellow_dark": material("ASRS Dark Yellow", (0.58, 0.25, 0.006, 1.0), 0.52, 0.34),
        "charcoal": material("ASRS Charcoal", (0.025, 0.032, 0.036, 1.0), 0.78, 0.28),
        "black": material("ASRS Black", (0.008, 0.010, 0.012, 1.0), 0.45, 0.42),
        "silver": material("ASRS Steel", (0.42, 0.46, 0.48, 1.0), 0.92, 0.20),
        "rail": material("Rail Grey", (0.16, 0.18, 0.20, 1.0), 0.90, 0.25),
        "rail_side": material("Rail Side", (0.07, 0.08, 0.09, 1.0), 0.82, 0.32),
        "sleeper": material("Rail Sleeper", (0.30, 0.31, 0.32, 1.0), 0.30, 0.52),
        "blue": material("Control Blue", (0.018, 0.10, 0.16, 1.0), 0.48, 0.34),
        "white": material("Cabinet White", (0.82, 0.84, 0.82, 1.0), 0.12, 0.43),
        "green": material("Indicator Green", (0.02, 0.62, 0.12, 1.0), 0.12, 0.28),
        "red": material("Emergency Red", (0.74, 0.025, 0.018, 1.0), 0.35, 0.30),
        "collider": material("Collider", (0.02, 0.52, 1.0, 0.18), 0.0, 0.7),
    }


def link_only(obj: bpy.types.Object, target: bpy.types.Collection) -> None:
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    target.objects.link(obj)


def empty(
    name: str,
    target: bpy.types.Collection,
    parent: bpy.types.Object | None = None,
    size: float = 0.25,
) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = size
    obj.parent = parent
    target.objects.link(obj)
    return obj


def cube(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    mat: bpy.types.Material,
    target: bpy.types.Collection,
    parent: bpy.types.Object | None = None,
    bevel_width: float = 0.025,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel_width:
        modifier = obj.modifiers.new("Edge softening", "BEVEL")
        modifier.width = bevel_width
        modifier.segments = 2
    obj.data.materials.append(mat)
    obj.parent = parent
    link_only(obj, target)
    return obj


def cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    mat: bpy.types.Material,
    target: bpy.types.Collection,
    parent: bpy.types.Object | None = None,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    vertices: int = 20,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    bevel_modifier = obj.modifiers.new("Edge softening", "BEVEL")
    bevel_modifier.width = min(radius * 0.12, 0.02)
    bevel_modifier.segments = 2
    obj.data.materials.append(mat)
    obj.parent = parent
    link_only(obj, target)
    return obj


def beam_between(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    thickness: float,
    mat: bpy.types.Material,
    target: bpy.types.Collection,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    a = Vector(start)
    b = Vector(end)
    delta = b - a
    obj = cube(name, tuple((a + b) * 0.5), (thickness, thickness, delta.length), mat, target, parent)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = delta.to_track_quat("Z", "Y")
    return obj


def build_body(target: bpy.types.Collection, collider_target: bpy.types.Collection | None = None) -> bpy.types.Object:
    mat = materials()
    root = empty("ASRS_Crane_Body", target, size=0.42)
    root["asset_type"] = "warehouse_fitted_asrs_crane_body"
    root["units"] = "meters"
    root["origin"] = "rail_center_at_floor"
    root["threejs_travel_axis"] = "X"
    root["threejs_vertical_axis"] = "Y"
    root["threejs_fork_axis"] = "Z"
    root["shelf_grid_m"] = 2.0
    root["box_envelope_m"] = [1.0, 1.0, 1.0]
    root["body_dimensions_threejs_m"] = [1.8, 7.2, 1.28]
    root["mast_inner_clearance_m"] = 1.22

    # Chassis is less than the 2 m aisle cell and follows the 0.9 m rail gauge.
    cube("CraneBase", (0.0, 0.0, 0.38), (1.80, 1.24, 0.42), mat["charcoal"], target, root, 0.07)
    cube("CraneBaseYellow", (0.0, 0.0, 0.64), (1.66, 1.10, 0.22), mat["yellow"], target, root, 0.055)
    for y in (-0.45, 0.45):
        for x in (-0.62, 0.62):
            cylinder(
                f"RailWheel_{x}_{y}",
                (x, y, 0.24),
                0.16,
                0.14,
                mat["rail"],
                target,
                root,
                rotation=(math.radians(90), 0.0, 0.0),
                vertices=24,
            )
            cylinder(
                f"RailWheelHub_{x}_{y}",
                (x, y, 0.24),
                0.06,
                0.17,
                mat["silver"],
                target,
                root,
                rotation=(math.radians(90), 0.0, 0.0),
                vertices=18,
            )

    # The columns flank the 1 m cargo along X. Their inner faces sit at
    # +/-0.61 m, leaving 0.11 m per side around a centered 1 m load.
    for x in (-0.72, 0.72):
        side = "L" if x < 0 else "R"
        cube(f"MastColumn_{side}", (x, 0.28, 3.86), (0.22, 0.34, 6.62), mat["yellow"], target, root, 0.04)
        cube(f"LiftGuide_{side}", (x * 0.84, 0.08, 3.82), (0.065, 0.075, 6.38), mat["silver"], target, root, 0.014)
        cube(f"GuideBacking_{side}", (x * 0.84, 0.13, 3.82), (0.13, 0.13, 6.46), mat["charcoal"], target, root, 0.014)
    cube("MastTopCrossbeam", (0.0, 0.28, 7.12), (1.66, 0.48, 0.26), mat["yellow_dark"], target, root, 0.06)
    cube("MastLowerCrossbeam", (0.0, 0.28, 0.91), (1.66, 0.50, 0.30), mat["yellow_dark"], target, root, 0.05)
    beam_between("RearBrace_A", (-0.82, 0.51, 1.05), (0.82, 0.51, 1.82), 0.09, mat["charcoal"], target, root)
    beam_between("RearBrace_B", (0.82, 0.51, 1.82), (-0.82, 0.51, 2.59), 0.09, mat["charcoal"], target, root)
    beam_between("RearBrace_C", (-0.82, 0.51, 2.59), (0.82, 0.51, 3.36), 0.09, mat["charcoal"], target, root)

    cylinder(
        "LiftTopSheave",
        (0.0, 0.02, 6.88),
        0.21,
        0.50,
        mat["charcoal"],
        target,
        root,
        rotation=(0.0, math.radians(90), 0.0),
        vertices=28,
    )
    cylinder(
        "LiftTopSheaveHub",
        (0.0, 0.02, 6.88),
        0.07,
        0.56,
        mat["silver"],
        target,
        root,
        rotation=(0.0, math.radians(90), 0.0),
        vertices=18,
    )
    cube("Counterweight", (0.0, 0.50, 4.05), (0.45, 0.20, 1.05), mat["charcoal"], target, root, 0.055)

    cube("ControlCabinet", (0.0, 0.45, 1.35), (0.78, 0.30, 0.92), mat["white"], target, root, 0.065)
    cube("ControlScreen", (0.17, 0.285, 1.48), (0.22, 0.025, 0.16), mat["blue"], target, root, 0.02)
    for index, lamp_mat in enumerate((mat["green"], mat["yellow"], mat["red"])):
        cylinder(
            f"StatusLamp_{index}",
            (-0.23 + 0.12 * index, 0.275, 1.61),
            0.03,
            0.03,
            lamp_mat,
            target,
            root,
            rotation=(math.radians(90), 0.0, 0.0),
            vertices=14,
        )
    for x in (-0.68, 0.68):
        cube(f"EmergencyBuffer_F_{x}", (x, -0.64, 0.40), (0.25, 0.16, 0.24), mat["black"], target, root, 0.06)
        cube(f"EmergencyBuffer_B_{x}", (x, 0.64, 0.40), (0.25, 0.16, 0.24), mat["black"], target, root, 0.06)

    if collider_target is not None:
        collider_root = empty("Crane_Collision_Proxies", collider_target, root)
        proxies = [
            cube("COL_Base", (0.0, 0.0, 0.42), (1.80, 1.24, 0.70), mat["collider"], collider_target, collider_root, 0.0),
            cube("COL_Mast_L", (-0.72, 0.28, 3.86), (0.24, 0.40, 6.70), mat["collider"], collider_target, collider_root, 0.0),
            cube("COL_Mast_R", (0.72, 0.28, 3.86), (0.24, 0.40, 6.70), mat["collider"], collider_target, collider_root, 0.0),
        ]
        for proxy in proxies:
            proxy.display_type = "WIRE"
            proxy.hide_render = True
            proxy["is_collider"] = True
    return root


def build_fork(target: bpy.types.Collection, collider_target: bpy.types.Collection | None = None) -> bpy.types.Object:
    mat = materials()
    root = empty("movePlate", target, size=0.28)
    root["asset_type"] = "warehouse_fitted_double_tine_fork"
    root["origin"] = "load_bottom_center"
    root["units"] = "meters"
    root["threejs_extension_axis"] = "Z"
    root["fork_outer_width_m"] = 0.60
    root["fork_tine_length_m"] = 0.90
    root["supported_box_m"] = [1.0, 1.0, 1.0]

    # X is fork spacing, Y becomes Three.js Z, and Z becomes Three.js Y.
    cube("ForkCarrier", (0.0, 0.0, -0.13), (1.08, 0.84, 0.16), mat["yellow_dark"], target, root, 0.04)
    cube("ForkCarrierCenter", (0.0, 0.0, -0.045), (0.56, 0.72, 0.08), mat["charcoal"], target, root, 0.025)
    for x in (-0.25, 0.25):
        side = "L" if x < 0 else "R"
        cube(f"ForkLowerRail_{side}", (x, 0.0, -0.02), (0.13, 0.88, 0.07), mat["rail_side"], target, root, 0.018)
        cube(f"ForkTelescopicStage_{side}", (x, 0.0, 0.025), (0.11, 0.86, 0.055), mat["silver"], target, root, 0.016)
        cube(f"ForkTine_{side}", (x, 0.0, 0.065), (0.10, 0.90, 0.055), mat["yellow"], target, root, 0.016)
        cube(f"ForkTip_Pos_{side}", (x, 0.42, 0.07), (0.115, 0.08, 0.045), mat["yellow"], target, root, 0.014)
        cube(f"ForkTip_Neg_{side}", (x, -0.42, 0.07), (0.115, 0.08, 0.045), mat["yellow"], target, root, 0.014)
    cube("ForkMovingCrossbar", (0.0, 0.0, 0.02), (0.70, 0.20, 0.17), mat["yellow"], target, root, 0.035)
    cube("ForkLoadSensorVisual", (0.0, 0.0, 0.11), (0.23, 0.24, 0.055), mat["blue"], target, root, 0.02)
    anchor = empty("Pallet_Load_Anchor", target, root, size=0.18)
    anchor["supported_load_m"] = [1.0, 1.0, 1.0]
    anchor["binding_vertical_offset_m"] = 0.58

    if collider_target is not None:
        collider_root = empty("Fork_Collision_Proxies", collider_target, root)
        proxy = cube("COL_ForkSupport", (0.0, 0.0, -0.03), (0.86, 0.90, 0.12), mat["collider"], collider_target, collider_root, 0.0)
        proxy.display_type = "WIRE"
        proxy.hide_render = True
        proxy["is_collider"] = True
    return root


def build_rail(target: bpy.types.Collection, collider_target: bpy.types.Collection | None = None) -> bpy.types.Object:
    mat = materials()
    root = empty("ASRS_Ground_Rail_4m", target, size=0.25)
    root["asset_type"] = "warehouse_fitted_modular_rail"
    root["origin"] = "segment_center_at_floor"
    root["units"] = "meters"
    root["threejs_repeat_axis"] = "X"
    root["segment_length_m"] = 4.0
    root["rail_gauge_m"] = 0.90
    root["placement_rule"] = "segment center X = n * 4.0"

    for index, x in enumerate((-1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75)):
        cube(f"Sleeper_{index:02d}", (x, 0.0, 0.055), (0.18, 1.42, 0.11), mat["sleeper"], target, root, 0.025)
        for y in (-0.45, 0.45):
            cylinder(f"RailBolt_{index:02d}_{y}", (x, y, 0.16), 0.03, 0.05, mat["silver"], target, root, vertices=12)
    for y in (-0.45, 0.45):
        side = "L" if y < 0 else "R"
        cube(f"RunningRailFoot_{side}", (0.0, y, 0.10), (4.0, 0.20, 0.06), mat["rail_side"], target, root, 0.01)
        cube(f"RunningRailWeb_{side}", (0.0, y, 0.17), (4.0, 0.10, 0.16), mat["rail_side"], target, root, 0.01)
        cube(f"RunningRailHead_{side}", (0.0, y, 0.27), (4.0, 0.16, 0.07), mat["rail"], target, root, 0.016)
    cube("CenterPositionChannel", (0.0, 0.0, 0.08), (3.96, 0.18, 0.11), mat["rail_side"], target, root, 0.015)
    for x in (-1.5, -0.5, 0.5, 1.5):
        cube(f"PositionMarker_{x}", (x, 0.0, 0.15), (0.05, 0.13, 0.02), mat["silver"], target, root, 0.005)

    if collider_target is not None:
        collider_root = empty("Rail_Collision_Proxies", collider_target, root)
        for y in (-0.45, 0.45):
            proxy = cube(f"COL_Rail_{y}", (0.0, y, 0.18), (4.0, 0.18, 0.28), mat["collider"], collider_target, collider_root, 0.0)
            proxy.display_type = "WIRE"
            proxy.hide_render = True
            proxy["is_collider"] = True
    return root


def export_collection(target: bpy.types.Collection, path: Path) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in target.all_objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_animations=False,
        export_extras=True,
    )
    bpy.ops.object.select_all(action="DESELECT")


def point_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def build_preview_environment(target: bpy.types.Collection) -> None:
    concrete = material("Preview Concrete", (0.14, 0.15, 0.16, 1.0), 0.03, 0.72)
    rack_blue = material("Preview Rack Blue", (0.025, 0.14, 0.36, 1.0), 0.62, 0.31)
    rack_orange = material("Preview Rack Orange", (0.92, 0.25, 0.018, 1.0), 0.48, 0.33)
    carton = material("Preview Carton", (0.53, 0.30, 0.12, 1.0), 0.0, 0.67)
    wood = material("Preview Pallet", (0.43, 0.23, 0.07, 1.0), 0.0, 0.62)
    cube("PreviewFloor", (4.0, 0.0, -0.08), (12.0, 7.0, 0.16), concrete, target, bevel_width=0.02)
    for y in (-2.0, 2.0):
        # Posts sit on cell boundaries. The fork/load at X=4 remains centered
        # in the 2 m bay bounded by X=3 and X=5.
        for x in (1.0, 3.0, 5.0, 7.0):
            cube(f"RackPost_{x}_{y}", (x, y, 3.45), (0.14, 0.14, 6.90), rack_blue, target, bevel_width=0.015)
        for z in (2.0, 4.0, 6.0):
            cube(f"RackBeam_{y}_{z}", (4.0, y, z), (6.2, 0.18, 0.16), rack_orange, target, bevel_width=0.015)
    # A 1 m cargo envelope on the extended fork makes clearance visible.
    cube("PreviewPallet", (4.0, -1.55, 4.20), (1.0, 0.86, 0.12), wood, target, bevel_width=0.025)
    cube("PreviewCargo", (4.0, -1.55, 4.77), (1.0, 1.0, 1.0), carton, target, bevel_width=0.04)

    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.025, 0.032, 0.042, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.26

    for name, location, energy, size, color in (
        ("KeyLight", (9.0, -6.0, 10.0), 1500.0, 4.0, (1.0, 0.78, 0.58)),
        ("FillLight", (-2.0, -3.0, 7.0), 1100.0, 4.5, (0.45, 0.67, 1.0)),
        ("RimLight", (4.0, 5.0, 9.0), 1400.0, 3.5, (1.0, 0.66, 0.34)),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.size = size
        data.color = color
        obj = bpy.data.objects.new(name, data)
        obj.location = location
        point_at(obj, (4.0, 0.0, 3.2))
        target.objects.link(obj)

    camera_data = bpy.data.cameras.new("PreviewCamera")
    camera = bpy.data.objects.new("PreviewCamera", camera_data)
    camera.location = (11.5, -10.5, 8.0)
    camera_data.lens = 58
    point_at(camera, (4.0, 0.0, 3.25))
    target.objects.link(camera)
    bpy.context.scene.camera = camera


def write_manifest() -> None:
    data = {
        "warehouse_contract": {
            "shelf_grid_m": 2.0,
            "box_envelope_m": [1.0, 1.0, 1.0],
            "aisle_clear_width_m": 2.0,
            "axes_threejs": {"travel": "X", "vertical": "Y", "fork": "Z"},
        },
        "body": {
            "file": BODY_GLB.name,
            "root": "ASRS_Crane_Body",
            "dimensions_threejs_m": [1.8, 7.2, 1.28],
            "mast_inner_clearance_m": 1.22,
        },
        "fork": {
            "file": FORK_GLB.name,
            "root": "movePlate",
            "load_anchor": "Pallet_Load_Anchor",
            "outer_width_m": 0.60,
            "tine_length_m": 0.90,
            "physics_collider_threejs_m": [0.86, 0.12, 0.90],
            "box_binding_vertical_offset_m": 0.58,
        },
        "rail": {
            "file": RAIL_GLB.name,
            "root": "ASRS_Ground_Rail_4m",
            "repeat_axis_threejs": "X",
            "segment_length_m": 4.0,
            "rail_gauge_m": 0.90,
            "placement": "segment center X = n * 4.0 with identical Y/Z/rotation/scale",
            "runtime_centers_x_m": [-4, 0, 4, 8, 12],
            "runtime_extent_x_m": [-6, 14],
            "last_shelf_cell_outer_edge_x_m": 13,
        },
        "clearance": {
            "centered_box_to_each_mast_m": 0.11,
            "fork_to_each_mast_m": 0.31,
            "body_to_adjacent_2m_cell_boundary_m": 0.10,
            "fork_width_margin_inside_1m_box_each_side_m": 0.20,
            "fork_length_margin_inside_1m_box_each_end_m": 0.05,
        },
    }
    MANIFEST.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    BLENDER_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    reset_scene()
    body_collection = collection("ASRS_BODY_ASSET")
    fork_collection = collection("ASRS_FORK_ASSET")
    rail_collection = collection("ASRS_RAIL_ASSET")
    collider_collection = collection("ASRS_COLLISION_PROXIES")
    environment_collection = collection("PREVIEW_ONLY")

    body = build_body(body_collection, collider_collection)
    fork = build_fork(fork_collection, collider_collection)
    build_rail(rail_collection, collider_collection)
    fork.location = (4.0, -1.55, 4.10)
    body.location.x = 4.0
    for segment_x in (0.0, 4.0, 8.0):
        segment_collection = collection(f"RAIL_PREVIEW_{int(segment_x)}")
        rail = build_rail(segment_collection)
        rail.location.x = segment_x

    # Export clean source collections before preview transforms can matter.
    body.location.x = 0.0
    fork.location = (0.0, 0.0, 0.0)
    export_collection(body_collection, BODY_GLB)
    export_collection(fork_collection, FORK_GLB)
    export_collection(rail_collection, RAIL_GLB)

    body.location.x = 4.0
    fork.location = (4.0, -1.55, 4.10)
    build_preview_environment(environment_collection)
    write_manifest()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW)
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND), check_existing=False)

    print(f"Created {BODY_GLB}")
    print(f"Created {FORK_GLB}")
    print(f"Created {RAIL_GLB}")
    print(f"Created {MANIFEST}")
    print(f"Created {BLEND}")
    print(f"Created {PREVIEW}")


if __name__ == "__main__":
    main()
