# Data Model

The backend data model is implemented with Sequelize in `backend/models`.

## `Box`

File: `backend/models/Box.js`

Table: `boxes`

Fields:

- `box_id`: string primary key.
- `isRemoved`: boolean, default `false`. Used for soft delete.

Relationships:

- `Box.hasOne(BoxPosition, { foreignKey: 'box_id', onDelete: 'CASCADE' })`
- `Box.hasMany(BoxContent, { foreignKey: 'box_id', onDelete: 'CASCADE' })`

## `BoxPosition`

File: `backend/models/BoxPosition.js`

Table: `boxPosition`

Fields:

- `boxPosition_id`: integer auto-increment primary key.
- `box_id`: string, required.
- `position_x`: float.
- `position_y`: float.
- `position_z`: float.

Relationship:

- `BoxPosition.belongsTo(Box, { foreignKey: 'box_id' })`

Important assumption:

- Service logic assumes one position per box, but `box_id` is not marked unique in the model.

## `BoxContent`

File: `backend/models/BoxContent.js`

Table: `boxContent`

Fields:

- `boxContent_id`: integer auto-increment primary key.
- `box_id`: string, required.
- `item_id`: string, required.
- `quantity`: integer, required.
- `isContentDelete`: boolean, default `false`. Used for content-level soft delete.

Relationships:

- `BoxContent.belongsTo(Box, { foreignKey: 'box_id' })`
- `BoxContent.belongsTo(Item, { foreignKey: 'item_id' })`

Important assumption:

- There is no uniqueness constraint for `(box_id, item_id)`, so duplicate content rows are possible if the same request is repeated.

## `Item`

File: `backend/models/Item.js`

Table: `items`

Fields:

- `item_id`: string primary key.
- `item_name`: string, required.
- `category`: string.

Relationship:

- `Item.hasMany(BoxContent, { foreignKey: 'item_id', onDelete: 'CASCADE' })`

## `Test1`

File: `backend/models/test1.js`

Table: `test1`

Purpose:

- Early DB/API test model.
- Not part of the core WMS data model.

## Persistence vs runtime state

DB persists:

- Box existence and soft delete status.
- Box position when explicitly saved.
- Box content and item master data.

Frontend runtime owns:

- Current physics position while the simulation runs.
- Box-to-equipment collision status.
- Crane and move table current/target positions.
- Conveyor sensor state and light color.

If a feature needs accurate saved box location, call `boxStore.updateBoxCurrentPositionServer()` after movement finishes.
