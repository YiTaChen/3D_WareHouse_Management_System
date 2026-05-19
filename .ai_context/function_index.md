# Function Index

This file is a quick index. Detailed notes live in `functions/*.md`.

## Frontend components

- `src/App.jsx`
  - `App()` -> main app, data bootstrap, panels, Canvas/Physics.
- `src/components/Scene.jsx`
  - `Scene()` -> renders ground, conveyors, shelves, cranes.
- `src/components/Box.jsx`
  - `Box({ id, initialPosition })` -> GLTF box + dynamic physics body + store ref registration.
- `src/components/ConveyorWithPhysics.jsx`
  - `ConveyorWithPhysics({ id, position, rotation })` -> GLTF conveyor + rollers + sensors.
  - `getRotatedSize()`, `getRotatedSizeNew()`, `getRotatedVector()` -> geometry/rotation helpers.
- `src/components/RollerCylinder.jsx`
  - `RollerCylinder(...)` -> kinematic roller body.
- `src/components/ConveyorExtras.jsx`
  - `ConveyorExtras(...)` -> conveyor sensors and light color.
- `src/components/Crane.jsx`
  - `Crane({ id, modelPath, position, rotation })` -> crane body movement + move table + sensor.
  - `getLocalBoundingBoxSize()` -> local bbox helper.
- `src/components/MoveTable.jsx`
  - `MoveTable({ id, craneWorldPosition, craneWorldRotation })` -> crane move table physics body.
- `src/components/CraneInvisibleBulkSensor.jsx`
  - `CraneInvisibleBulkSensor(...)` -> crane sensor collision logic.
- `src/components/BoxBindingUpdater.jsx`
  - `BoxBindingUpdater()` -> syncs bound boxes to move table every frame.
- `src/components/Shelf.jsx`
  - `Shelf(...)` -> one shelf visual/physics/sensor.
  - `BatchedShelfLoader(...)` / exported variants -> shelf batch rendering.
- `src/components/Materials.jsx`
  - `Materials()` -> Cannon contact material setup.
- `src/components/effect/HighlightSpot.jsx`
  - `HighlightSpot({ position })` -> inventory highlight marker.

## Panel components

- `src/components/SubPanelProduction.jsx`
  - `SubPanelProduction({ setShowSubPanel })` -> main function panel.
- `src/components/SubPanel.jsx`
  - `SubPanel({ setShowEngineerSubPanel })` -> engineer testing panel.
- `src/components/subPages/BoxCreate.jsx`
  - `generateNewItem()` -> default item row for box content UI.
  - `BoxCreate({ tabId })` -> create box form.
- `src/components/subPages/Inventory.jsx`
  - `Inventory()` -> inventory table and highlight action.
- `src/components/subPages/MissionPanel.jsx`
  - `MissionPanel()` -> production mission UI.
- `src/components/subPages/ConveyorControlPanel.jsx`
  - `ConveyorControlPanel()` -> conveyor control UI.
- `src/components/subPages/Test.jsx`
  - `CraneControlPanel()` -> crane testing UI.
- `src/components/subPages/BoxControlPanel.jsx`
  - `BoxControlPanel()` -> box physics/control UI.
- `src/components/subPages/ObjectBindingTest.jsx`
  - `ObjectBindingTest()` -> experimental binding UI with known mismatch.

## Stores

- `src/stores/boxStore.js`
  - `fetchBoxesData()`
  - `getInventoryDataAll()`
  - `softDeleteAllBoxesData()`
  - `softDeleteOneBoxData(boxId)`
  - `updateBoxContentToServer(boxId, contentObj)`
  - `setBoxesData(id, data)`
  - `setAllBoxesData(boxesObj)`
  - `setBoxRef(id, ref)`
  - `getBoxData(boxId)`
  - `getBoxRef(id)`
  - `handleAddSingleBox(boxId, boxContentData)`
  - `addBox(id, data)`
  - `removeBox(boxId)`
  - `updateBoxData(boxId, newData)`
  - `getBoxWorldPosition(boxId)`
  - `updateBoxInitPositionServer(boxId, pos)`
  - `updateBoxCurrentPositionServer(boxId)`
  - `addBoxInitDataToServer(boxId)`
  - `getBoxSleepStatus(boxId)`
  - `wakeUpBox(boxId)`
  - `moveBoxUp(boxId, amount)`
  - `setStaticBox(boxId)`
  - `setPassiveBox(boxId)`
  - `setBoxBoundToMoveplate(boxId, moveTableId)`
  - `clearBoxBoundToMoveplate(boxId)`
  - `getBoxBoundMoveplate(boxId)`
  - `getBoxVelocity(boxId)`
  - `setBoxVelocity(boxId, velocity)`
  - `setBoxAngularVelocity(boxId, angularVelocity)`
  - `stopBoxMotion(boxId)`

- `src/stores/conveyorStore.js`
  - `initializeConveyorStates()`
  - `calculateLightColor(conveyorState)`
  - `setConveyorRotate(id, isRotate)`
  - `setConveyorSpeed(id, value)`
  - `setSensorDetected(id, sensorKey, detected)`
  - `getConveyorState(id)`

- `src/stores/craneStore.js`
  - `getDefaultCraneState()`
  - `initializeCraneStates()`
  - `setCraneRef(id, ref)`
  - `setMoveTableRef(craneId, moveTableData)`
  - `getMoveTableApi(craneId)`
  - `isMoveTableReady(craneId)`
  - `getMoveTableRef(craneId)`
  - `setCraneSensorDetected(id, sensorKey, detected)`
  - `getCraneState(id)`
  - `setCraneTargetPosition(id, targetPosition, speed)`
  - `updateCraneCurrentPosition(id, currentPositionArray)`
  - `updateMoveTableCurrentLocalOffset(id, currentOffset)`
  - `setMoveTableTargetLocalOffset(id, relativeOffset, speed)`

- `src/stores/productStore.js`
  - `fetchProductsAndCategories()`
  - `getProductsByCategory(category)`
  - `getProductById(productId)`

- `src/stores/missionStore.js`
  - `setMission(mission)`
  - `runMission()`
  - `runCurrentTask()`
  - `runCurrentStep()`

## Backend routes

See `api_routes.md` and `functions/backend.md`.
