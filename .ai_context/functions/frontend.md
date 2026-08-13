# Frontend Functions and Components

## `src/App.jsx`

`App()`

- Main frontend root.
- Initializes box data with `fetchBoxesData()`.
- Initializes product/category data with `fetchProductsAndCategories()`.
- Shows/hides main production panel and engineer panel.
- Creates R3F `<Canvas>`, lights, `<Physics>`, materials, ground, boxes, scene, binding updater, and highlight marker.
- Renders boxes from `useBoxStore(state => state.boxesData)`.

Performance behavior:

- Uses demand rendering with `FrameRateLimiter` capped at 30 FPS.
- Caps DPR at 1.5 on desktop and 1.25 on coarse-pointer/small-screen devices.
- Disables antialiasing and shadows on low-power devices.
- Configures Cannon with sleeping, SAP broadphase, two max substeps, a 1/30 step, and `shouldInvalidate={false}`.
- Mounts `Ground` through `Scene` only; do not add a duplicate ground body in `App`.

## `src/components/Scene.jsx`

`Scene()`

- Composes the 3D warehouse scene.
- Renders:
  - `Ground`
  - conveyors from `layoutData.conveyors`
  - shelves from `ShelfData.shelves`
  - cranes from `CraneData.cranes`
- Uses `VisualCullingShelfBatch` from `Shelf.jsx`.

Common change points:

- Add/remove conveyor: `src/data/layoutData.js`
- Add/remove crane: `src/data/CraneData.js`
- Add/remove shelf: `src/data/ShelfData.js`

## `src/components/Box.jsx`

`Box({ id, initialPosition })`

- Loads `/box_ver1.gltf` with `useGLTF`.
- Clones the GLTF scene per box instance.
- Creates a dynamic Cannon box body using `useBox`.
- Stores `{ ref, api, isReady, id }` into `boxStore.setBoxRef(id, fullRef)`.
- Uses `boxData.position` from `boxStore`, not the `initialPosition` prop directly.

Important runtime detail:

- Actual position while moving is owned by Cannon API/ref.
- Persisting position requires `boxStore.updateBoxCurrentPositionServer()`.

## `src/components/ConveyorWithPhysics.jsx`

`ConveyorWithPhysics({ id, position, rotation })`

- Loads `/plateform_conveyor_ver5.gltf`.
- Clones and positions the conveyor model.
- Finds children named `Roller_*`, creates a `RollerCylinder` for each.
- Finds `InvisibleBulkSensor` and `Light_bulb_0` and passes them to `ConveyorExtras`. The unused `Sensor_0`/`Sensor_1` physics bodies are intentionally not created.
- Reads conveyor state from `useConveyorStore.getConveyorState(id)`.
- Animates the GLTF roller visuals in `useFrame` only while the conveyor is running.

Helpers:

- `getRotatedSize(size, rotation)` computes rotated bounding size.
- `getRotatedSizeNew(size, rotation)` uses quaternion rotation for bounding size.
- `getRotatedVector(vector, rotation)` rotates an angular velocity vector.

Critical model/rotation contract:

- Depends on GLTF child names. Renaming model children will break logic.
- The GLTF cylinder geometry's long axis is local Y; the roller node is already pre-rotated into conveyor space.
- Visual spin must remain `roller.rotateOnAxis(ROLLER_LOCAL_AXIS, rotationStep)` with `ROLLER_LOCAL_AXIS = new THREE.Vector3(0, 1, 0)`.
- Do not use `roller.rotation.z += rotationStep`, guess another Euler axis, or overwrite the authored quaternion. Those changes make turned/sloped rollers tumble around the wrong pivot.
- Each collider receives the roller's exact world position and world quaternion. See `performance_optimization.md` before changing this path.

## `src/components/RollerCylinder.jsx`

`RollerCylinder({ rollerPosition, rotation, radius, length, angularVelocity, rotate })`

- Creates one exact 16-segment cylinder body for each roller.
- Uses a `Static` body while stopped and a `Kinematic` body while running.
- Applies angular velocity only while the conveyor is running.
- Returns no visible mesh; the cloned GLTF roller is the visual representation.
- Used by `ConveyorWithPhysics`.

Do not replace stopped rollers with one box collider. That optimization was tested and reverted because its square leading edge blocked inbound and outbound box transfers between conveyor sections.

## `src/components/ConveyorExtras.jsx`

`ConveyorExtras(...)`

- Creates invisible/sensor physics pieces for conveyor.
- Handles collision begin/end.
- Creates only the retained `InvisibleBulkSensor`; the 38 unused `Sensor_0`/`Sensor_1` bodies were removed as part of the performance work.
- Updates:
  - `conveyorStore.setSensorDetected(id, 'BulkSensorDetected', true/false)`
  - `boxEquipStore.clearBoxCollision(boxId)`
  - `boxEquipStore.setBoxCollidingWithEquipment(boxId, conveyorId)`
- Updates light bulb material color based on `conveyorStore.lightColor`.

## `src/components/Crane.jsx`

`Crane({ id, modelPath, position, rotation })`

- Loads `/Crane_ver1.gltf` by default.
- Clones crane scene and removes `movePlate` and `CraneInvisibleBulkSensor` from the visual body.
- Creates a kinematic box body for crane.
- Uses `useFrame` to move toward `targetCranePosition`.
- Renders `MoveTable` and `CraneInvisibleBulkSensor`.

Helper:

- `getLocalBoundingBoxSize(mesh)` returns a local bounding box size array.

Store dependencies:

- `useCraneStore.getCraneState(id)`
- `updateCraneCurrentPosition(id, position)`
- `setCraneSensorDetected(id, sensorKey, detected)`

## `src/components/MoveTable.jsx`

`MoveTable({ id, craneWorldPosition, craneWorldRotation })`

- Loads `/moveTable_ver2.gltf`.
- Builds kinematic body for the crane move table.
- Registers its ref/api with `craneStore.setMoveTableRef(id, data)`.
- Uses current crane position plus local offset to compute move table world position.
- Works with `BoxBindingUpdater` for box carrying.

## `src/components/CraneInvisibleBulkSensor.jsx`

`CraneInvisibleBulkSensor({ id, modelPath, craneWorldPosition, craneWorldRotation })`

- Follows crane world position.
- Uses GLTF child sensor geometry.
- Collision events update crane sensor state and box/equipment mapping.

## `src/components/BoxBindingUpdater.jsx`

`BoxBindingUpdater()`

- Runs inside Canvas/Physics.
- Reads `boxStore.boxBoundToMoveplate`.
- For each bound box, finds the crane move table ref and box physics api.
- Forces box position to move table world position plus vertical offset.

This is the current practical binding mechanism used by missions.

## `src/components/Shelf.jsx`

Key exports:

- `Shelf(...)`
- `BatchedShelfLoader(...)`
- `QuickShelfBatch(...)`
- `VisualCullingShelfBatch(...)`

Purpose:

- Loads shelf model.
- Batches shelf rendering to reduce initial cost.
- Builds static colliders for shelf table/legs.
- Builds sensor trigger for shelf occupancy.
- Collision updates shelf sensor state and box/equipment mapping.

Model contract:

- Depends on child names such as `ShelfInvisibleBulkSensor`, `table`, `Leg_`.

## `src/components/Materials.jsx`

`Materials()`

- Defines Cannon materials/contact materials.
- Tunes friction/restitution for:
  - roller-box
  - box-shelfTable
  - box-craneTable

## Panels

`SubPanelProduction({ setShowSubPanel })`

- Main function panel.
- Tabs: `MissionPanel`, `BoxCreate`, `Inventory`.
- Draggable DOM panel.

`SubPanel({ setShowEngineerSubPanel })`

- Engineer testing panel.
- Tabs: `ConveyorControlPanel`, `Test`, `ObjectBindingTest`, `BoxControlPanel`.
- Draggable DOM panel.

## Subpages

`BoxCreate({ tabId })`

- Lets user add item rows and create a box.
- Reads product/category data from `productStore`.
- Calls `boxStore.handleAddSingleBox()`.

`Inventory()`

- Loads inventory via `boxStore.getInventoryDataAll()`.
- Displays flattened inventory rows.
- Calls `uiStore.setHighlightPosition()` for locate/highlight.

`MissionPanel()`

- Production mission UI.
- Gets port options/spawn positions from `src/missions/config/portConfigs.js`.
- Builds production missions through `src/missions/builders/missionBuilder.js`.
- The builder wraps existing templates in `craneMissionData.js` while avoiding UI-side mutation of exported template objects.
- Focused builder tests run with `npm run test:mission-builder`.
- Calls `missionStore.setMission()` and `missionStore.runMission()`.
- Mission step sequencing now lives in `src/missions/runtime/missionRunner.js`; focused runner tests run with `npm run test:mission-runner`.
- Production side-effect step adapters live in `src/missions/adapters/stepFunctions.js`.

`ConveyorControlPanel()`

- Engineer UI for conveyor rotate/speed.
- Calls `conveyorStore.setConveyorRotate()` and `setConveyorSpeed()`.

`CraneControlPanel()` in `Test.jsx`

- Engineer UI for crane/move table.
- Calls `craneStore.setCraneTargetPosition()` and `setMoveTableTargetLocalOffset()`.
- Risk: some buttons hardcode `crane001`.

`BoxControlPanel()`

- Box inspection and physics control.
- Can wake/move/stop/set static/passive/soft-delete selected box.

`ObjectBindingTest()`

- Experimental binding UI.
- Known mismatch with `useObjectBindingPosition`.

## 2026-08-13 fitted AS/RS crane update

The following supersedes the older crane/move-table descriptions above:

- Crane loads public/asrs_stacker_crane_body.glb from CraneData and keeps the body at ground-rail Y=0 during production missions.
- MoveTable loads public/asrs_fork_table.glb. Its movePlate root lifts on local Y and extends toward either rack on local Z.
- CraneInvisibleBulkSensor follows the moving fork offset, not just the crane body.
- BoxBindingUpdater uses the configured 0.58 m Pallet_Load_Anchor offset, keeping a 1 m load centered between 1.22 m-spaced mast inner faces.
- CraneRail loads independent public/asrs_single_guide_rail_4m.glb segments and repeats them every 4 m along X. Add segments to extend a route; do not scale or bind the rail to the crane. The visually heavier public/asrs_ground_rail_4m.glb remains a preserved alternative and is not active at runtime.
- The fitted fork collider is 0.86 x 0.12 x 0.90 m, with visible double tines only 0.60 m wide.
- The operator inbound flow snaps and sleeps a released box at the selected shelf center after the physics mission, persists that settled position, and records the selected destination. Outbound wakes it through the normal crane/conveyor flow and clears that occupancy after exit. This prevents residual motion or transient overlapping sensor events from selecting the wrong crane lane.
