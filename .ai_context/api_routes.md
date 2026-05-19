# API Routes

Base URL is supplied by frontend env `VITE_API_BASE_URL`.

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
  - Risk: route order currently places this after `/:id/remove`, so Express may match `all` as an id before this route.

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
- There is little request body validation.
- Some routes have incomplete try/catch coverage.
- Full-data aggregation logic is duplicated between `boxPositionRoutes.js` and `boxInventoryRoutes.js`.
