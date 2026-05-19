# Backend Functions and Routes

## `backend/index.js`

Purpose:

- Express app entry.
- Enables JSON body parsing.
- Enables CORS for all origins.
- Mounts route modules.
- Authenticates DB.
- Runs `sequelize.sync({ alter: true })`.
- Starts server.

Mounted routes:

- `/test1`
- `/boxes`
- `/items`
- `/boxPositions`
- `/boxContents`
- `/boxInventory`

Important risk:

- `sequelize.sync({ alter: true })` runs on startup. This is convenient in development but risky in production.

## `backend/models/index.js`

Purpose:

- Loads `.env`.
- Chooses DB config based on `DB_ENV`.
- Creates Sequelize connection.
- Initializes models.
- Defines associations.

DB env:

- `DB_ENV=local` uses `PG_HOST_LOCAL`, `PG_PORT_LOCAL`, `PG_DATABASE_LOCAL`, `PG_USER_LOCAL`, `PG_PASSWORD_LOCAL`, `PG_DIALECT_LOCAL`.
- `DB_ENV=cloud` uses `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`, `PG_DIALECT`.

Associations:

- `Box.hasOne(BoxPosition)`
- `BoxPosition.belongsTo(Box)`
- `Box.hasMany(BoxContent)`
- `BoxContent.belongsTo(Box)`
- `Item.hasMany(BoxContent)`
- `BoxContent.belongsTo(Item)`

## `backend/routes/boxesRoutes.js`

Functions are route handlers:

- `POST /`
  - Calls `Box.create(req.body)`.
  - Used by frontend `addBoxInitDataToServer()`.

- `GET /`
  - Calls `Box.findAll()`.

- `GET /:id`
  - Calls `Box.findByPk(req.params.id)`.

- `PUT /:id`
  - Finds by pk, then `box.update(req.body)`.

- `DELETE /:id`
  - Finds by pk, then `box.destroy()`.

- `PATCH /:id/remove`
  - Calls `Box.update({ isRemoved: true }, { where: { box_id: req.params.id } })`.

- `PATCH /all/remove`
  - Calls `Box.update({ isRemoved: true }, { where: {} })`.
  - Risk: route order likely makes this unreachable because `/:id/remove` appears earlier.

## `backend/routes/itemsRoutes.js`

Functions are route handlers:

- `POST /`
  - Creates item.

- `GET /`
  - Returns all items.
  - Used by `productStore.fetchProductsAndCategories()`.

- `GET /categories`
  - Uses Sequelize grouping to return distinct categories.
  - Used by `productStore.fetchProductsAndCategories()`.

- `GET /:id`
  - Finds item by `item_id`.

- `PUT /:id`
  - Updates item by `item_id`.

- `DELETE /:id`
  - Deletes item by `item_id`.

- `GET /category/:category`
  - Returns items in category.

## `backend/routes/boxPositionRoutes.js`

Functions are route handlers:

- `POST /`
  - Creates raw position row.

- `GET /`
  - Returns all position rows.

- `GET /map`
  - Queries BoxPosition with included Box where `isRemoved=false`.
  - Returns `{ [box_id]: { id, position } }`.

- `GET /mapFullData`
  - Queries Box with BoxPosition, BoxContent, Item.
  - Filters out removed boxes and deleted content.
  - Returns map object keyed by `box_id`.
  - Used by `boxStore.fetchBoxesData()`.

- `GET /:id`
  - Finds by `boxPosition_id`.

- `PUT /:id`
  - Updates by `boxPosition_id`.

- `DELETE /:id`
  - Deletes by `boxPosition_id`.

- `GET /box/:boxId`
  - Finds position by `box_id`.

- `POST /box/:boxId`
  - Creates position for a box if one does not already exist.
  - Used by `boxStore.updateBoxInitPositionServer()`.

- `PATCH /box/:boxId`
  - Updates position fields by `box_id`.
  - Used by `boxStore.updateBoxCurrentPositionServer()`.

## `backend/routes/boxContentRoutes.js`

Functions are route handlers:

- `POST /`
  - Creates box content row.
  - Used by `boxStore.updateBoxContentToServer()`.

- `GET /`
  - Returns all content rows.

- `GET /:id`
  - Finds by `boxContent_id`.

- `PUT /:id`
  - Updates by `boxContent_id`.

- `DELETE /:id`
  - Deletes by `boxContent_id`.

- `GET /box/:boxId`
  - Returns active contents for one box.

## `backend/routes/boxInventoryRoutes.js`

Purpose:

- Aggregated read/update endpoints for full box inventory data.

Handlers:

- `GET /:boxId/full`
  - Uses `Box.findByPk(boxId, { include: [BoxPosition, BoxContent -> Item] })`.
  - Returns `{ id, position, content, isRemoved }`.
  - Fills empty content with an `empty` object.

- `GET /fullData`
  - Uses `Box.findAll({ where: { isRemoved: false }, include: [...] })`.
  - Returns array of full box data.
  - Used by `boxStore.getInventoryDataAll()`.

- `PUT /:boxId/position`
  - Upserts position by `box_id` using `{ x, y, z }`.

- `PUT /:boxId/content/:itemId`
  - Updates `quantity` and `isContentDelete`.

## Backend design notes

- Routes directly use Sequelize models; there is no service layer.
- Full-data aggregation logic is duplicated in `boxPositionRoutes.js` and `boxInventoryRoutes.js`.
- Request validation is minimal.
- Error responses are inconsistent.
- No migrations are present.
- No backend tests are present.
