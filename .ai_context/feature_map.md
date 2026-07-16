# Feature Map

## App startup and scene load

Files:

- `src/main.jsx`
- `src/App.jsx`
- `src/stores/boxStore.js`
- `src/stores/productStore.js`
- `backend/routes/boxPositionRoutes.js`
- `backend/routes/itemsRoutes.js`

Flow:

1. `main.jsx` renders `App`.
2. `App.jsx` calls `fetchBoxesData()` and `fetchProductsAndCategories()`.
3. `fetchBoxesData()` hits `GET /boxPositions/mapFullData`.
4. `fetchProductsAndCategories()` hits `GET /items` and `GET /items/categories`.
5. `boxesData` drives `<Box />` rendering.

## 3D scene composition

Files:

- `src/components/Scene.jsx`
- `src/data/layoutData.js`
- `src/data/ShelfData.js`
- `src/data/CraneData.js`
- `src/components/ConveyorWithPhysics.jsx`
- `src/components/Shelf.jsx`
- `src/components/Crane.jsx`

Flow:

- `Scene.jsx` maps static data arrays to 3D components.

Common changes:

- Add conveyor: edit `layoutData.js`, then check `conveyorStore.js`.
- Add crane: edit `CraneData.js`, then check `craneStore.js`, mission templates.
- Add shelf layout: edit `ShelfData.js`, then check `shelfStore.js`, mission UI.

Current shelf scale:

- `ShelfData.js` creates 18 x 5 x 5 = 450 shelf locations.
- `Shelf.jsx` draws them with five instanced meshes and aggregates physics into 25 rows / approximately 50 bodies.
- `shelfLayout.js` preserves exact shelf IDs inside each aggregated row; run `npm run test:shelf-layout` after layout or sensor changes.
- Do not restore table/sensor bodies per shelf. The resulting approximately 900 bodies caused inbound physics to lag and fail at `conv3` even while render FPS appeared normal.

## Box creation

Files:

- `src/components/subPages/BoxCreate.jsx`
- `src/stores/productStore.js`
- `src/stores/boxStore.js`
- `backend/routes/boxesRoutes.js`
- `backend/routes/boxPositionRoutes.js`
- `backend/routes/boxContentRoutes.js`

Flow:

1. User selects category/product/quantity/position.
2. `BoxCreate.jsx` builds box data.
3. `boxStore.handleAddSingleBox()` calls `boxStore.addBox()`.
4. API calls create Box, Position, Content.
5. Local `boxesData` is updated.

Risk:

- Creation is not transactional. Partial failures can leave incomplete DB rows.

## Inventory table and box highlight

Files:

- `src/components/subPages/Inventory.jsx`
- `src/stores/boxStore.js`
- `src/stores/boxEquipStore.js`
- `src/stores/uiStore.js`
- `src/components/effect/HighlightSpot.jsx`
- `backend/routes/boxInventoryRoutes.js`

Flow:

1. Inventory calls `boxStore.getInventoryDataAll()`.
2. API returns all box full data.
3. Frontend filters/annotates with runtime collision state from `boxEquipStore`.
4. `Check Box Position` sets `highlightPosition`.
5. `App.jsx` renders `HighlightSpot`.

Risk:

- Shelf id depends on runtime sensor collision state. After reload, collision state may not be complete until physics events occur.

## Conveyor control and sensors

Files:

- `src/components/subPages/ConveyorControlPanel.jsx`
- `src/stores/conveyorStore.js`
- `src/components/ConveyorWithPhysics.jsx`
- `src/components/RollerCylinder.jsx`
- `src/components/ConveyorExtras.jsx`
- `src/stores/boxEquipStore.js`

Flow:

1. UI sets conveyor rotate/speed.
2. `ConveyorWithPhysics` reads conveyor state.
3. The cloned GLTF rollers spin around their authored local-Y axle with `rotateOnAxis`; do not replace this with direct x/y/z Euler increments.
4. `RollerCylinder` uses exact 16-segment bodies, `Static` while stopped and `Kinematic` while running, and applies angular velocity.
5. `ConveyorExtras` keeps only the `InvisibleBulkSensor`; its collision events update sensor state and box/equipment mapping.
6. `conveyorStore` recalculates light color.

Performance/correctness contract:

- Read `performance_optimization.md` before changing conveyor visuals, roller bodies, sensors, physics settings, or transfer behavior.
- The local-Y roller axis, exact collider transforms, 16 segments, and per-roller stopped surfaces are regression-sensitive. Straight, turned, reversed, and sloped conveyors must all be tested.

## Crane and move table

Files:

- `src/components/Crane.jsx`
- `src/components/MoveTable.jsx`
- `src/components/CraneInvisibleBulkSensor.jsx`
- `src/stores/craneStore.js`
- `src/data/CraneData.js`

Flow:

1. UI or mission sets crane target position / move table offset.
2. `Crane.jsx` moves crane body in `useFrame`.
3. `MoveTable.jsx` follows crane world position plus local offset.
4. Sensor collision updates crane/equipment state.

## Box binding to crane

Files:

- `src/stores/boxStore.js`
- `src/components/BoxBindingUpdater.jsx`
- `src/hooks/useObjectBindingPosition.js`
- `src/missions/craneMissionData.js`

Flow:

1. Mission step `craneBindingBox` calls `setBoxBoundToMoveplate(boxId, craneId)`.
2. `BoxBindingUpdater` moves bound box to move table world position each frame.
3. Mission step `craneUnBindingBox` calls `clearBoxBoundToMoveplate(boxId)`.

Risk:

- `useObjectBindingPosition.js` has stale action names and UI mismatch. Mission path is more reliable than ObjectBindingTest path.

## Mission execution

Files:

- `src/components/subPages/MissionPanel.jsx`
- `src/missions/builders/missionBuilder.js`
- `src/missions/config/portConfigs.js`
- `src/missions/config/routeConfigs.js`
- `src/missions/config/shelfRules.js`
- `src/missions/runtime/missionRunner.js`
- `src/missions/adapters/stepFunctions.js`
- `src/stores/missionStore.js`
- `src/missions/craneMissionData.js`
- `src/data/PortData.js`
- `src/data/ShelfData.js`
- `src/stores/craneStore.js`
- `src/stores/conveyorStore.js`
- `src/stores/boxStore.js`

Flow:

1. User selects inbound/outbound mission inputs.
2. UI resolves selected port/shelf/box context.
3. `missionBuilder.js` builds a mission through the production task-builder factory without mutating exported template params.
4. `missionStore.runMission()` injects production adapters from `src/missions/adapters/stepFunctions.js`.
5. `missionRunner.runMission()` runs tasks/steps and reports state changes back to the store.
6. Starting a conveyor wakes the selected outbound box so a sleeping Cannon body can move again.
7. Outbound missions briefly run the final destination conveyor (`conv4`, `conv7`, or `conv19`), wait for confirmed arrival, and stop it immediately afterward.
8. A failed step propagates an error through step/task/mission state; the UI must not report a failed transfer as completed.

Avoid confusion:

- The old advanced mission executor/templates were removed; mission UI should use the production builder + `missionStore` runner path.

## API / DB changes

Files:

- `backend/models/*.js`
- `backend/models/index.js`
- `backend/routes/*.js`
- `src/stores/boxStore.js`
- `src/stores/productStore.js`
- `src/components/subPages/BoxCreate.jsx`
- `src/components/subPages/Inventory.jsx`

Rule:

- Any DB/API contract change should update backend model, route, frontend store mapping, UI consumer, and this `.ai_context` documentation.
