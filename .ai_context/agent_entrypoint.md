# Agent Entrypoint

你正在維護的是一個 3D Warehouse Management System。前端是 Vite + React + React Three Fiber + Cannon physics，後端是 Express + Sequelize + PostgreSQL。

先讀這些:

1. `repo_overview.md`
2. `repo_structure.md`
3. `known_risks.md`
4. 依任務讀:
   - 改 UI/3D 場景: `functions/frontend.md`
   - 改 Zustand state/mission: `functions/stores_and_missions.md`
   - 改 API/DB: `api_routes.md`, `data_model.md`, `functions/backend.md`
   - 改功能流程: `feature_map.md`

重要提醒:

- 實際 repo root 是 `/Users/adam/git/3d_warehause/3D_WareHouse_Management_System`，不是外層 `/Users/adam/git/3d_warehause`。
- 前端 root package 與後端 `backend/package.json` 是兩個 npm 專案，不要混裝 dependency。
- 修改 API contract 時，同步檢查 `src/stores/boxStore.js`、`src/stores/productStore.js`、`backend/routes/*.js`、README。
- 主要 box store 是 `src/stores/boxStore.js`；`src/stores/useBoxStore.js` 是另一套舊/實驗 store，容易誤用。
- 主要 mission flow 是 `MissionPanel.jsx` + `missionStore.js` + `craneMissionData.js`；advanced mission flow 有未修 bug。
- GLTF 模型子物件名稱是邏輯依賴，改模型時要同步檢查 traversal 名稱。
- 修改前先看 `known_risks.md`，裡面有會造成 build/runtime/API 問題的點。

常見任務入口:

- 新增庫存欄位: `data_model.md` -> `api_routes.md` -> `functions/backend.md` -> `functions/stores_and_missions.md` -> `BoxCreate.jsx` / `Inventory.jsx`
- 改 3D box 行為: `functions/frontend.md` 的 `Box.jsx`、`BoxBindingUpdater.jsx`，再看 `boxStore.js`
- 改輸送帶: `layoutData.js`、`ConveyorWithPhysics.jsx`、`ConveyorExtras.jsx`、`conveyorStore.js`
- 改吊車/移動平台: `CraneData.js`、`Crane.jsx`、`MoveTable.jsx`、`craneStore.js`
- 改 inbound/outbound 任務: `MissionPanel.jsx`、`missionStore.js`、`craneMissionData.js`
