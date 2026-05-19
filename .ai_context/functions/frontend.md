# Frontend Functions and Components

## `src/App.jsx`

`App()`

- Main frontend root.
- Initializes box data with `fetchBoxesData()`.
- Initializes product/category data with `fetchProductsAndCategories()`.
- Shows/hides main production panel and engineer panel.
- Creates R3F `<Canvas>`, lights, `<Physics>`, materials, ground, boxes, scene, binding updater, and highlight marker.
- Renders boxes from `useBoxStore(state => state.boxesData)`.

Important notes:

- Imports `./components/Subpanel`, but actual file is `SubPanel.jsx`. This can break on case-sensitive filesystems.
- Contains legacy/unused conveyor control state and handlers.

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
- Finds `InvisibleBulkSensor`, `Sensor_0`, `Sensor_1`, `Light_bulb_0` and passes them to `ConveyorExtras`.
- Reads conveyor state from `useConveyorStore.getConveyorState(id)`.

Helpers:

- `getRotatedSize(size, rotation)` computes rotated bounding size.
- `getRotatedSizeNew(size, rotation)` uses quaternion rotation for bounding size.
- `getRotatedVector(vector, rotation)` rotates an angular velocity vector.

Model contract:

- Depends on GLTF child names. Renaming model children will break logic.

## `src/components/RollerCylinder.jsx`

`RollerCylinder({ roller_position, equip_position, rotation, size, rotate, key11, radius, length, roller_rotate_deg_Array })`

- Creates a kinematic cylinder body for each roller.
- Applies angular velocity when conveyor `rotate` is true.
- Used by `ConveyorWithPhysics`.

## `src/components/ConveyorExtras.jsx`

`ConveyorExtras(...)`

- Creates invisible/sensor physics pieces for conveyor.
- Handles collision begin/end.
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
- Builds mission from templates in `craneMissionData.js`.
- Calls `missionStore.setMission()` and `missionStore.runMission()`.

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
