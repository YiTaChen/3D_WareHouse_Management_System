# Known Risks and Technical Debt

## Build/runtime risks

- `zustand` is imported throughout `src/stores/*`, but root `package.json` does not list it as direct dependency.
  - Add it explicitly to avoid install drift.

- `productStore.js` fallback has a bug.
  - Catch block uses `defaultProductList`, but that variable is not in function scope.
  - Use `get().defaultProductList` or `ProductList.ProductList`.

- `src/main.jsx` may not import `src/index.css` / `src/App.css`.
  - Confirm intended styling behavior before UI work.

## Backend/API risks

- `PATCH /boxes/all/remove` is declared after `PATCH /boxes/:id/remove`.
  - Express can match `/boxes/all/remove` as `id = all`.
  - Move `/all/remove` before `/:id/remove`.

- README API path mismatch:
  - README mentions `/boxes/:boxId/full`, implementation is `/boxInventory/:boxId/full`.
  - README mentions `/boxes/fullData`, implementation is `/boxInventory/fullData`.

- `sequelize.sync({ alter: true })` runs on backend startup.
  - Risky for production schema changes.
  - No migration system exists.

- No request validation.
  - Route handlers pass request bodies directly to Sequelize in several places.

- No auth/authorization.

- CORS is fully open with `app.use(cors())`.

- Add box flow is not transactional.
  - `POST /boxes`
  - `POST /boxPositions/box/:boxId`
  - many `POST /boxContents`
  - Any middle failure can leave partial data.

- `BoxPosition.box_id` is not unique, but service logic assumes one position per box.

- `BoxContent` does not prevent duplicate `(box_id, item_id)` rows.

- Soft delete naming is inconsistent:
  - Box: `isRemoved`
  - Content: `isContentDelete`

- Aggregated full box logic is duplicated between `boxPositionRoutes.js` and `boxInventoryRoutes.js`.

- `PATCH /boxPositions/box/:boxId` claims partial update, but sends all three position fields in update object.
  - Missing fields may cause unintended values depending on Sequelize behavior.

- Some route handlers lack try/catch.

- Response shapes are inconsistent.

- No pagination/filtering for `findAll()` endpoints.

## Frontend architecture risks

- Two box stores exist:
  - Main: `src/stores/boxStore.js`
  - Old/simplified: `src/stores/useBoxStore.js` plus `boxStore.impl.js`
  - Import carefully.

- Mission execution now has one production runtime path:
  - `MissionPanel.jsx` / `MissionHighLevelPanel.jsx` -> mission builder -> `missionStore.js` -> runtime runner -> adapter `stepFunctions`.
  - The old advanced executor/templates were removed during the hard-code optimization work.

- `useObjectBindingPosition.js` and `ObjectBindingTest.jsx` do not match.
  - Hook returns different names than UI expects.
  - Hook calls nonexistent `removeBoxBoundToMoveplate`.

- `useObjectBinding.js` is currently unsafe.
  - References undefined `boxId`.
  - Uses a constraint hook mismatch.
  - Related `CraneBindingLogic.jsx` logic is commented out.

- `Test.jsx` crane control UI can select crane, but some buttons hardcode `crane001`.

- Inventory shelf id depends on runtime collision state.
  - Reloading can show incomplete shelf association until sensors fire.

- Box position in DB is not continuously synchronized.
  - Use `updateBoxCurrentPositionServer()` after movement/mission steps.

- GLTF child names are application logic contracts.
  - Model edits can silently break sensors/rollers/move tables/shelves.

### Conveyor roller axis and transfer contract

- The roller cylinder geometry in `plateform_conveyor_ver5.gltf` is authored along local Y and the roller node is already rotated into conveyor space.
- Visual roller animation must use `roller.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationStep)` or the shared `ROLLER_LOCAL_AXIS` constant.
- Do not replace that with `roller.rotation.x/y/z += ...`, and do not overwrite the authored quaternion in `useFrame`. Euler rotation around an assumed world axis makes sloped/turned rollers tumble or orbit around the wrong pivot instead of spinning around their own axle.
- Physics colliders must preserve each roller's exact world position/quaternion and 16 cylinder segments. The rejected single-box stopped-conveyor collider blocked transfers at conveyor seams, and reducing the cylinder to 8 segments caused transfer instability.
- Stopped rollers are `Static`; running rollers are `Kinematic`. Outbound destination conveyors (`conv4`, `conv7`, `conv19`) must briefly run to pull the box fully onto the exit, then stop immediately.
- Before changing any of this behavior, read `performance_optimization.md` and run its full conveyor regression checklist. A visually plausible straight conveyor is not sufficient verification.

- UI panels use fixed width and inline absolute positioning.
  - Small screens may overflow.

## Testing gaps

- Focused Node tests exist for mission building, the production mission factory, and the mission runner.
- No React component tests, browser end-to-end suite, or deterministic physics/conveyor tests exist.
- No backend tests found.
- Backend `npm test` is placeholder.
- No CI config found.
- No API regression tests for route order, aggregation, or soft delete.
- No DB migration tests.
- No transaction/partial failure tests.
