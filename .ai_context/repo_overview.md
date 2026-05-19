# Repo Overview

## 系統定位

這個 repo 是一個 3D Warehouse Management System，也就是用 Web 3D 場景呈現倉庫、輸送帶、貨架、吊車與箱子庫存狀態的系統。

核心目標:

- 以 3D 視覺化方式呈現箱子位置與庫存。
- 模擬 inbound / outbound 流程。
- 用輸送帶、吊車、move table、貨架 sensor 追蹤箱子所在設備。
- 透過後端 API 與 PostgreSQL 保存 box、item、position、content。

## 技術棧

Frontend:

- Vite
- React 19
- Three.js
- React Three Fiber
- Drei
- `@react-three/cannon`
- Zustand

Backend:

- Node.js
- Express
- Sequelize
- PostgreSQL
- CORS
- dotenv

Hosting / deployment:

- Firebase Hosting for frontend `dist/`
- README 提到 Render for backend + DB

## 主要執行模式

前端:

```bash
cd /Users/adam/git/3d_warehause/3D_WareHouse_Management_System
npm install
npm run dev
```

後端:

```bash
cd /Users/adam/git/3d_warehause/3D_WareHouse_Management_System/backend
npm install
npm start
```

## 主要資料流

App 啟動:

1. `src/main.jsx` render `App.jsx`。
2. `App.jsx` mount 後呼叫 `useBoxStore.fetchBoxesData()`。
3. `boxStore.fetchBoxesData()` 呼叫後端 `GET /boxPositions/mapFullData`。
4. 後端聚合 Box + BoxPosition + BoxContent + Item。
5. 前端更新 `boxesData`，並在 R3F Canvas 中 render `Box.jsx`。

產品資料:

1. `App.jsx` 呼叫 `useProductStore.fetchProductsAndCategories()`。
2. 前端呼叫 `GET /items` 與 `GET /items/categories`。
3. 後端回傳 Item master data。
4. `BoxCreate.jsx` 使用產品/分類建立 box content。

新增 box:

1. `BoxCreate.jsx` 建立 box payload。
2. `boxStore.handleAddSingleBox()` 呼叫 `boxStore.addBox()`。
3. 前端依序打:
   - `POST /boxes`
   - `POST /boxPositions/box/:boxId`
   - 多次 `POST /boxContents`
4. 成功後更新 local `boxesData`。

Mission:

1. `MissionPanel.jsx` 依 inbound/outbound + port/shelf 選擇 mission template。
2. `missionStore.setMission()` 存任務。
3. `missionStore.runMission()` 逐 task/step 執行。
4. step 依 `functionKey` 呼叫 `craneMissionData.js` 裡的 `stepFunctions`。

Inventory:

1. `Inventory.jsx` mount 呼叫 `boxStore.getInventoryDataAll()`。
2. 前端呼叫 `GET /boxInventory/fullData`。
3. 前端再用 `boxEquipStore.boxCollisionStatus` 推出 box 目前 shelf。
4. 點定位時 `uiStore.setHighlightPosition()`，`App.jsx` render `HighlightSpot`。
