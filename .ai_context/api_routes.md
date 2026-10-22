# API Routes

Base URL is supplied by frontend env `VITE_API_BASE_URL` when `VITE_DEMO_MODE=false`. By default `src/api/client.js` routes active store calls to a private in-memory page-session API; no shared API writes occur.

Backend entry: `backend/index.js`

Mounted routers:

- `/test1`
- `/boxes`
- `/items`
- `/boxPositions`
- `/boxContents`
- `/boxInventory`

## Health

- `GET /`
  - File: `backend/index.js`
  - Returns `Server is working!`

## Boxes

File: `backend/routes/boxesRoutes.js`

- `POST /boxes`
  - Creates a Box.
  - Typical body: `{ "box_id": "box-001" }`
  - Called by `boxStore.addBoxInitDataToServer()`.

- `GET /boxes`
  - Returns all boxes, including soft-deleted boxes.

- `GET /boxes/:id`
  - Returns one box by `box_id`.

- `PUT /boxes/:id`
  - Updates one box.

- `DELETE /boxes/:id`
  - Hard deletes one box.

- `PATCH /boxes/:id/remove`
  - Soft deletes one box by setting `isRemoved=true`.
  - Called by `boxStore.softDeleteOneBoxData()`.

- `PATCH /boxes/all/remove`
  - Intended to soft delete all boxes.
  - Declared before `/:id/remove`; requires administrator authorization on the backend.

## Items

File: `backend/routes/itemsRoutes.js`

- `POST /items`
  - Creates an item.
  - Body: `{ item_id, item_name, category }`

- `GET /items`
  - Returns all items.
  - Called by `productStore.fetchProductsAndCategories()`.

- `GET /items/categories`
  - Returns distinct category values.
  - Called by `productStore.fetchProductsAndCategories()`.

- `GET /items/:id`
  - Returns item by `item_id`.

- `PUT /items/:id`
  - Updates item by `item_id`.

- `DELETE /items/:id`
  - Hard deletes item by `item_id`.

- `GET /items/category/:category`
  - Returns items in one category.

## Box Positions

File: `backend/routes/boxPositionRoutes.js`

- `POST /boxPositions`
  - Creates raw BoxPosition.

- `GET /boxPositions`
  - Returns all positions.

- `GET /boxPositions/map`
  - Returns `{ [box_id]: { id, position: [x,y,z] } }`.
  - Filters out `Box.isRemoved=true`.

- `GET /boxPositions/mapFullData`
  - Returns full map for active boxes:
    `{ [box_id]: { id, position, content } }`
  - Joins Box, BoxPosition, BoxContent, Item.
  - Called by `boxStore.fetchBoxesData()`.

- `GET /boxPositions/:id`
  - Returns one position by `boxPosition_id`.

- `PUT /boxPositions/:id`
  - Updates by `boxPosition_id`.

- `DELETE /boxPositions/:id`
  - Hard deletes by `boxPosition_id`.

- `GET /boxPositions/box/:boxId`
  - Gets position by `box_id`.

- `POST /boxPositions/box/:boxId`
  - Creates position for a box.
  - Body: `{ position_x, position_y, position_z }`
  - Called by `boxStore.updateBoxInitPositionServer()`.

- `PATCH /boxPositions/box/:boxId`
  - Updates position for a box.
  - Body: `{ position_x, position_y, position_z }`
  - Called by `boxStore.updateBoxCurrentPositionServer()`.

## Box Contents

File: `backend/routes/boxContentRoutes.js`

- `POST /boxContents`
  - Creates box content row.
  - Body: `{ box_id, item_id, quantity }`
  - Called by `boxStore.updateBoxContentToServer()`.

- `GET /boxContents`
  - Returns all content rows.

- `GET /boxContents/:id`
  - Returns one content row by `boxContent_id`.

- `PUT /boxContents/:id`
  - Updates one content row.

- `DELETE /boxContents/:id`
  - Hard deletes one content row.

- `GET /boxContents/box/:boxId`
  - Returns active content rows for one box.

## Box Inventory

File: `backend/routes/boxInventoryRoutes.js`

- `GET /boxInventory/:boxId/full`
  - Returns one box with position and content.
  - Output: `{ id, position, content, isRemoved }`
  - README currently documents this as `/boxes/:boxId/full`, but implementation is `/boxInventory/:boxId/full`.

- `GET /boxInventory/fullData`
  - Returns array of active boxes with position and content.
  - Called by `boxStore.getInventoryDataAll()`.
  - README currently documents this as `/boxes/fullData`, but implementation is `/boxInventory/fullData`.

- `PUT /boxInventory/:boxId/position`
  - Upsert-style update of position using body `{ x, y, z }`.
  - Current frontend primarily uses `/boxPositions/box/:boxId` instead.

- `PUT /boxInventory/:boxId/content/:itemId`
  - Updates quantity / soft delete flag for content.

## Contract notes

- Response shapes are not fully standardized.
- Shared writes require administrator Bearer authentication and strict field/type/range validation.
- Some routes have incomplete try/catch coverage.
- Full-data aggregation logic is duplicated between `boxPositionRoutes.js` and `boxInventoryRoutes.js`.

## Security contract (2026-10-21)

- `GET /health`: public `{ status, api, securityRevision }`; no secrets/runtime version.
- Every non-read method requires `WAREHOUSE_ADMIN_TOKEN` (at least 32 chars) before JSON parsing.
- JSON is limited to 16 KiB and compression is disabled; invalid JSON/oversize/encoding requests return bounded 400/413/415 responses.
- `backend/middleware/validation.js` rejects unknown fields, malformed identifiers, reserved object keys, nonfinite/out-of-range coordinates and invalid quantities.
- `/db/status`, `/db/test`, `/db/switch` always reject cloud/production. Local admin additionally needs `ENABLE_DB_SWITCHER=true`, direct loopback without forwarded headers, and the Bearer token. A Host header is never authorization.
- DB request payloads cannot choose an arbitrary SQLite file; API responses omit DB credentials/addresses and server error details.
- CORS is an exact-origin allowlist, not authorization. Public reads are intentionally readable.
- `src/api/demoApi.js` implements the subset used by the active stores for isolated demo boxes/products/positions/contents/inventory; its tests verify independent sessions and normal create/move/remove flows.
