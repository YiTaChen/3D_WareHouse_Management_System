# Hooks, Assets, and Static Config

## Hooks

### `src/hooks/useObjectBindingPosition.js`

Purpose:

- Position-sync style binding between a box and crane move table.
- Intended to place box on move table and then rely on `BoxBindingUpdater` to keep it there.

Important functions:

- `forceBind()`
  - Moves a box to the crane move table position.
  - Calls `boxStore.setBoxBoundToMoveplate(boxId, craneId)`.

- `handleUnbind()`
  - Intended to unbind the box.
  - Risk: calls `removeBoxBoundToMoveplate`, but actual store action is `clearBoxBoundToMoveplate`.

Known mismatch:

- UI expects `toggleBinding` and `isBinding`.
- Hook returns `forceBind`, `handleUnbind`, and `isBound` style data.

### `src/hooks/useObjectBinding.js`

Purpose:

- Older/experimental constraint-based binding hook.

Status:

- Not safe to enable directly.
- References `boxId` without definition.
- Uses `useConstraint` while import references `useLockConstraint`.
- `CraneBindingLogic.jsx` currently has logic commented out.

## Static config

### `src/data/layoutData.js`

Purpose:

- Defines conveyor layout.
- Currently includes `conv1` to `conv19`.
- Conveyor records include id, type, position, rotation, etc.

Used by:

- `Scene.jsx`
- `conveyorStore.js`

### `src/data/CraneData.js`

Purpose:

- Defines crane configs.
- Current cranes:
  - `crane001`
  - `crane002`
  - `crane003`

Fields include:

- `position`
- `rotation`
- `movePlateOffset`
- `moveTableInitialPosition`

Used by:

- `Scene.jsx`
- `craneStore.js`
- mission templates

### `src/data/ShelfData.js`

Purpose:

- Generates shelf grid.
- z positions from -8 to 8, skipping some lanes.
- Each z has 3 levels x 6 shelves.

Used by:

- `Scene.jsx`
- `shelfStore.js`
- mission UI

### `src/data/PortData.js`

Purpose:

- Defines inbound/outbound ports and their crane/conveyor mapping.

Inbound ports:

- `port1`
- `port3`
- `port4`

Outbound ports:

- `port2`
- `port3`
- `port5`

Used by:

- Mission UI and mission generation.

### `src/data/ProductList.js`

Purpose:

- Static product fallback data.

Used by:

- `productStore.js`, but fallback currently has a variable scope bug.

## Assets

Runtime models are primarily loaded from `public/`:

- `/box_ver1.gltf`
- `/plateform_conveyor_ver5.gltf`
- `/Crane_ver1.gltf`
- `/moveTable_ver2.gltf`
- `/Shelf_ver1.gltf`

Important:

- GLTF files reference `.bin` files. Keep them together.
- `src/assets/` and `dist/` also contain model files, but runtime `useGLTF('/name.gltf')` resolves to `public/`.
- Do not update `dist/` manually for source changes. Rebuild instead.

Model child-name contracts:

- Conveyor:
  - `Roller_`
  - `InvisibleBulkSensor`
  - `Sensor_0`
  - `Sensor_1`
  - `Light_bulb_0`
- Crane:
  - `movePlate`
  - `CraneInvisibleBulkSensor`
- Shelf:
  - `ShelfInvisibleBulkSensor`
  - `table`
  - `Leg_`
