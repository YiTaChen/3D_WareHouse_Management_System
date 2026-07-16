# Agent Entrypoint

你正在維護的是一個 3D Warehouse Management System。前端是 Vite + React + React Three Fiber + Cannon physics，後端是 Express + Sequelize + PostgreSQL。

先讀這些:

1. `repo_overview.md`
2. `repo_structure.md`
3. `known_risks.md`
4. 若任務涉及 3D 效能、physics、conveyor、roller、crane 或 shelf culling，先讀 `performance_optimization.md`。
5. 若任務涉及改善、重構、TDD、todo list 或長期規劃，先讀 `improve_plan/todo_list.md` 與相關 `improve_plan/todo_list_planAndFeature/*.md`。
6. 依任務讀:
   - 改 UI/3D 場景: `functions/frontend.md`
   - 改 Zustand state/mission: `functions/stores_and_missions.md`
   - 改 API/DB: `api_routes.md`, `data_model.md`, `functions/backend.md`
   - 改功能流程: `feature_map.md`

重要提醒:

- 實際 repo root 是包含 `.ai_context/` 的目錄；不要依賴文件中的舊機器絕對路徑。
- 前端 root package 與後端 `backend/package.json` 是兩個 npm 專案，不要混裝 dependency。
- 修改 API contract 時，同步檢查 `src/stores/boxStore.js`、`src/stores/productStore.js`、`backend/routes/*.js`、README。
- 主要 box store 是 `src/stores/boxStore.js`；`src/stores/useBoxStore.js` 是另一套舊/實驗 store，容易誤用。
- 主要 mission flow 是 `MissionPanel.jsx` / `MissionHighLevelPanel.jsx` + `missionBuilder.js` + `productionMissionFactory.js` + `missionStore.js` + `missionRunner.js` + adapter `stepFunctions.js`。
- GLTF 模型子物件名稱是邏輯依賴，改模型時要同步檢查 traversal 名稱。
- 修改前先看 `known_risks.md`，裡面有會造成 build/runtime/API 問題的點。
- 修改 conveyor/roller 前必須保留 GLTF local-Y 軸心契約，並執行 `performance_optimization.md` 的 conveyor regression checklist。
- 執行改善或重構時，必須以 `improve_plan/` 裡的 todo 與細部 plan 作為溝通、拆分、實作與追蹤基準；若偏離 plan，要在回覆中說明原因並同步更新 plan。

常見任務入口:

- 新增庫存欄位: `data_model.md` -> `api_routes.md` -> `functions/backend.md` -> `functions/stores_and_missions.md` -> `BoxCreate.jsx` / `Inventory.jsx`
- 改 3D box 行為: `functions/frontend.md` 的 `Box.jsx`、`BoxBindingUpdater.jsx`，再看 `boxStore.js`
- 改輸送帶: `layoutData.js`、`ConveyorWithPhysics.jsx`、`ConveyorExtras.jsx`、`conveyorStore.js`
- 改吊車/移動平台: `CraneData.js`、`Crane.jsx`、`MoveTable.jsx`、`craneStore.js`
- 改 inbound/outbound 任務: `MissionPanel.jsx`、`MissionHighLevelPanel.jsx`、`missionBuilder.js`、`productionMissionFactory.js`、`taskBuilders.js`、`missionStore.js`
