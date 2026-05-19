# Stores and Missions

## `src/stores/boxStore.js`

Main box store. Prefer this over `src/stores/useBoxStore.js`.

State:

- `boxesData`: object keyed by box id.
- `boxRefs`: object keyed by box id, storing Cannon ref/api.
- `inventoryData`: flattened inventory rows for UI.
- `boxBoundToMoveplate`: box-to-crane/move table binding map.
- `isLoadingInventory`, `inventoryError`.

Important actions:

- `fetchBoxesData()`
  - Calls `GET ${VITE_API_BASE_URL}/boxPositions/mapFullData`.
  - Sets `boxesData`.

- `getInventoryDataAll()`
  - Calls `GET /boxInventory/fullData`.
  - Combines response with `useBoxEquipStore.getState().boxCollisionStatus`.
  - Only includes rows with shelf id inferred from collision state.

- `softDeleteAllBoxesData()`
  - Calls `PATCH /boxes/all/remove`.
  - Backend route has route-order risk.

- `softDeleteOneBoxData(boxId)`
  - Calls `PATCH /boxes/:boxId/remove`.

- `updateBoxContentToServer(boxId, contentObj)`
  - Iterates content items and calls `POST /boxContents`.

- `handleAddSingleBox(boxId, boxContentData)`
  - Builds default/new box data, then calls `addBox()`.

- `addBox(id, data)`
  - Calls `addBoxInitDataToServer()`.
  - Calls `updateBoxInitPositionServer()`.
  - Calls `updateBoxContentToServer()` if content exists.
  - Updates local `boxesData`.

- `getBoxWorldPosition(boxId)`
  - Reads current world position from Three/Cannon ref.
  - Use this when you need actual runtime position.

- `updateBoxCurrentPositionServer(boxId)`
  - Gets current world position and PATCHes `/boxPositions/box/:boxId`.
  - Adds `0.5` to y position before saving.

- `setBoxBoundToMoveplate(boxId, moveTableId)`
  - Marks box as bound to crane/move table.

- `clearBoxBoundToMoveplate(boxId)`
  - Removes binding.

- `setStaticBox(boxId)` / `setPassiveBox(boxId)`
  - Changes Cannon mass and local `boxType`.

- `stopBoxMotion(boxId)`
  - Clears velocity/angular velocity and sleeps body.

## `src/stores/conveyorStore.js`

State:

- `conveyorStates`: object keyed by conveyor id.

Each conveyor state:

- `rotate`
- `speed`
- `BulkSensorDetected`
- `sensor1Detected`
- `sensor2Detected`
- `lightColor`

Helpers:

- `initializeConveyorStates()`
  - Builds state from `layoutData.conveyors`.

- `calculateLightColor(conveyorState)`
  - Green when running and clear.
  - Red when running and occupied.
  - Orange when stopped and occupied.
  - Gray when stopped and clear.

Actions:

- `setConveyorRotate(id, isRotate)`
- `setConveyorSpeed(id, value)`
- `setSensorDetected(id, sensorKey, detected)`
- `getConveyorState(id)`

## `src/stores/craneStore.js`

State:

- `craneStates`: object keyed by crane id.
- `craneRefs`

Each crane state:

- `BulkSensorDetected`
- `currentCranePosition`
- `targetCranePosition`
- `craneMoveSpeed`
- `rotation`
- `currentMoveTableLocalOffset`
- `targetMoveTableLocalOffset`
- `moveTableSpeed`
- `isCraneMoving`
- `isMoveTableMoving`
- `moveTableRef`

Helpers:

- `getDefaultCraneState()`
- `initializeCraneStates()`

Actions:

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

Motion guardrails:

- Crane cannot move while move table is moving.
- Move table cannot move while crane is moving.

## `src/stores/productStore.js`

State:

- `products`
- `categories`
- `isLoading`
- `error`
- `defaultProductList`

Actions:

- `fetchProductsAndCategories()`
  - Calls `GET /items`.
  - Calls `GET /items/categories`.
  - Maps backend fields:
    - `item_id` -> `id`
    - `item_name` -> `ProductName`
  - Risk: fallback catch uses undefined `defaultProductList`.

- `getProductsByCategory(category)`
- `getProductById(productId)`

## `src/stores/boxEquipStore.js`

Purpose:

- Runtime mapping of which equipment a box is currently colliding with / located on.

State:

- `boxCollisionStatus`: `{ [boxId]: equipmentId }`

Used by:

- `ConveyorExtras.jsx`
- `CraneInvisibleBulkSensor.jsx`
- `Shelf.jsx`
- `Inventory.jsx`

## `src/stores/equipBoxStore.js`

Purpose:

- Reverse equipment-to-boxIds mapping.
- Appears less central than `boxEquipStore`.

## `src/stores/shelfStore.js`

Purpose:

- Shelf sensor state and shelf lookup helpers.

Important usage:

- Mission UI uses shelf position/empty shelf helpers.

## `src/stores/uiStore.js`

State:

- `highlightPosition`

Action:

- `setHighlightPosition(position)`
  - Sets highlight position.
  - Clears it after 5 seconds.

Used by:

- `Inventory.jsx`
- `App.jsx`
- `HighlightSpot.jsx`

## Main mission flow

Files:

- `src/components/subPages/MissionPanel.jsx`
- `src/stores/missionStore.js`
- `src/missions/craneMissionData.js`

`missionStore.js`

- `setMission(mission)` stores selected mission.
- `runMission()` starts execution.
- `runCurrentTask()` executes task sequence.
- `runCurrentStep()` executes each step.
- Step execution looks up `craneMissionData.stepFunctions[functionKey]`.

`craneMissionData.js`

Important step functions include:

- Move crane table.
- Move crane.
- Bind/unbind box to crane.
- Start/stop conveyor.
- Set conveyor speed.
- Check whether box is on equipment.
- Update box position to server.
- Remove/soft-delete box.

Mission templates:

- Inbound templates for crane001/crane002/crane003.
- Outbound templates for crane001/crane002/crane003.
- `cranePickupMission`.

## Advanced mission flow

Files:

- `src/components/subPages/MissionHighLevelPanel.jsx`
- `src/stores/missionAdvancedStore.js`
- `src/missions/missionTaskTemplates.js`
- `src/missions/stepFunctions.js`

Status:

- Not the main production path.
- Has known breakage: `stepFunctions.js` calls `boxStore.setBoxPosition`, which does not exist in main `boxStore.js`.

Recommendation:

- For feature work, use main mission flow unless deliberately repairing advanced flow.
