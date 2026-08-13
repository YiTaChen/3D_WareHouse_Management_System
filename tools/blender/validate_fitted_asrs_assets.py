"""Validate fitted AS/RS GLB geometry in Blender.

Run from repository root:
  blender --background --factory-startup --python tools/blender/validate_fitted_asrs_assets.py
"""

from __future__ import annotations

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def import_glb(filename: str) -> None:
    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(PUBLIC / filename))


def object_bounds(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return (
        Vector((min(point.x for point in corners), min(point.y for point in corners), min(point.z for point in corners))),
        Vector((max(point.x for point in corners), max(point.y for point in corners), max(point.z for point in corners))),
    )


def scene_mesh_bounds() -> tuple[Vector, Vector]:
    bounds = [object_bounds(obj) for obj in bpy.context.scene.objects if obj.type == "MESH"]
    return (
        Vector(tuple(min(item[0][axis] for item in bounds) for axis in range(3))),
        Vector(tuple(max(item[1][axis] for item in bounds) for axis in range(3))),
    )


def require(name: str) -> bpy.types.Object:
    obj = bpy.data.objects.get(name)
    assert obj is not None, f"missing object: {name}"
    return obj


def assert_no_exported_collision_proxies() -> None:
    names = [obj.name for obj in bpy.context.scene.objects]
    assert not any(name.startswith("COL_") for name in names), names


def validate_body() -> None:
    import_glb("asrs_stacker_crane_body.glb")
    require("ASRS_Crane_Body")
    left = require("MastColumn_L")
    right = require("MastColumn_R")
    left_bounds = object_bounds(left)
    right_bounds = object_bounds(right)
    mast_gap = right_bounds[0].x - left_bounds[1].x
    scene_bounds = scene_mesh_bounds()
    body_width = scene_bounds[1].x - scene_bounds[0].x
    assert mast_gap >= 1.20, mast_gap
    assert body_width <= 1.81, body_width
    assert_no_exported_collision_proxies()


def validate_fork() -> None:
    import_glb("asrs_fork_table.glb")
    require("movePlate")
    require("Pallet_Load_Anchor")
    tine_bounds = [
        object_bounds(require("ForkTine_L")),
        object_bounds(require("ForkTine_R")),
    ]
    fork_width = max(bounds[1].x for bounds in tine_bounds) - min(bounds[0].x for bounds in tine_bounds)
    fork_length = max(bounds[1].y for bounds in tine_bounds) - min(bounds[0].y for bounds in tine_bounds)
    assert fork_width <= 0.61, fork_width
    assert fork_length <= 0.91, fork_length
    assert_no_exported_collision_proxies()


def validate_rail() -> None:
    import_glb("asrs_ground_rail_4m.glb")
    require("ASRS_Ground_Rail_4m")
    rail_bounds = scene_mesh_bounds()
    rail_length = rail_bounds[1].x - rail_bounds[0].x
    assert 3.99 <= rail_length <= 4.01, rail_length
    assert_no_exported_collision_proxies()


def validate_single_guide_rail() -> None:
    import_glb("asrs_single_guide_rail_4m.glb")
    require("ASRS_Single_Guide_Rail_4m")
    require("GuideFoundation")
    require("GuideWeb")
    require("GuideHead")
    guide_bounds = scene_mesh_bounds()
    guide_length = guide_bounds[1].x - guide_bounds[0].x
    guide_width = guide_bounds[1].y - guide_bounds[0].y
    guide_height = guide_bounds[1].z - guide_bounds[0].z
    assert 3.99 <= guide_length <= 4.01, guide_length
    assert guide_width <= 0.35, guide_width
    assert guide_height <= 0.15, guide_height
    assert_no_exported_collision_proxies()


def main() -> None:
    validate_body()
    validate_fork()
    validate_rail()
    validate_single_guide_rail()
    print("AS/RS GLB validation passed: fitted crane/fork, preserved double rail, active low-profile single guide rail")


if __name__ == "__main__":
    main()
