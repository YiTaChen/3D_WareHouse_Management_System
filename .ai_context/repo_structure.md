# Repo Structure

Root: `/Users/adam/git/3d_warehause/3D_WareHouse_Management_System`

## Root files

- `package.json`：前端 Vite + React 專案設定。scripts 包含 `dev`, `build`, `lint`, `preview`。
- `package-lock.json`：前端 npm lockfile。
- `index.html`：Vite HTML entry，掛載 `#root` 並載入 `/src/main.jsx`。
- `vite.config.js`：Vite 設定，目前只啟用 React plugin。
- `eslint.config.js`：ESLint flat config，含 JS recommended、React Hooks、React Refresh。
- `firebase.json`：Firebase Hosting 設定，public 目錄為 `dist/`，所有 route rewrite 到 `/index.html`。
- `.firebaserc`：Firebase project 為 `r3f-gravity-apply-test`。
- `.gitignore`：忽略 node_modules、env、logs、Firebase cache 等。
- `README.md`：人類閱讀用專案介紹、架構、API 文件。注意部分 API path 與實作已不一致。
- `LICENSE`：授權檔。

## `src/`

前端原始碼。

- `src/main.jsx`：React root render。
- `src/App.jsx`：主 UI、Canvas、Physics、資料初始化、panel 顯示。
- `src/index.css`：Vite 預設全域樣式。
- `src/App.css`：舊/預設 app 樣式，目前不確定是否有被 import。

## `src/components/`

3D 場景與面板元件。

- `Scene.jsx`：組裝 Ground、conveyors、shelves、cranes。
- `Box.jsx`：單一 box GLTF 與 physics body。
- `ConveyorWithPhysics.jsx`：輸送帶 GLTF、rollers、sensor/light parts。
- `RollerCylinder.jsx`：輸送帶 roller 的 kinematic physics cylinder。
- `ConveyorExtras.jsx`：輸送帶 sensor 與燈號。
- `Crane.jsx`：吊車主體 kinematic body 與移動邏輯。
- `MoveTable.jsx`：吊車移動平台。
- `CraneInvisibleBulkSensor.jsx`：吊車隱形 sensor。
- `BoxBindingUpdater.jsx`：box 綁定到 move table 後，每 frame 同步位置。
- `Shelf.jsx`：貨架批次渲染、collider、sensor。
- `ShelveMultiInstances.jsx`：多實例貨架實驗/替代渲染。
- `Materials.jsx`：Cannon material/contact material。
- `Ground.jsx`：地板。
- `SubPanelProduction.jsx`：主功能面板。
- `SubPanel.jsx`：工程測試面板。
- `effect/HighlightSpot.jsx`：庫存定位高亮球。

## `src/components/subPages/`

Panel tab 頁面。

- `BoxCreate.jsx`：建立 box 與 box content。
- `Inventory.jsx`：庫存表格與定位。
- `MissionPanel.jsx`：主要 inbound/outbound mission 控制。
- `MissionHighLevelPanel.jsx`：advanced mission UI，目前不是主流程。
- `ConveyorControlPanel.jsx`：工程用輸送帶控制。
- `Test.jsx`：工程用吊車控制。
- `BoxControlPanel.jsx`：box 物理與 soft delete 控制。
- `ObjectBindingTest.jsx`：物件綁定測試，目前與 hook/store 有不一致。

## `src/stores/`

Zustand stores。

- `boxStore.js`：主要 box state/API/physics ref store。
- `conveyorStore.js`：conveyor rotate/speed/sensor/light state。
- `craneStore.js`：crane 與 move table position/target/ref state。
- `missionStore.js`：主要 mission runner。
- `missionAdvancedStore.js`：advanced mission generator/executor，部分依賴已失效。
- `productStore.js`：items/categories API 與 product lookup。
- `shelfStore.js`：shelf sensor state 與 shelf 查詢。
- `boxEquipStore.js`：box -> equipment collision status。
- `equipBoxStore.js`：equipment -> box ids 反向 mapping。
- `bindingStore.js`：舊 binding action store，目前主流程不依賴。
- `uiStore.js`：UI 暫態，目前主要是 `highlightPosition`。
- `useBoxStore.js`, `boxStore.impl.js`, `boxStore.types.js`：另一套簡化/舊版 box store，避免誤用。

## `src/data/`

靜態配置資料。

- `layoutData.js`：conveyor layout，共 `conv1` 到 `conv19`。
- `CraneData.js`：三台 crane 的位置、旋轉與 move table offset。
- `ShelfData.js`：程式產生 shelf grid。
- `PortData.js`：inbound/outbound port 與 conveyor/crane 對應。
- `ProductList.js`：產品 fallback/static data。

## `src/missions/`

任務流程資料與 step functions。

- `craneMissionData.js`：主要 production mission 使用的 stepFunctions 與 mission templates。
- `missionTaskTemplates.js`：advanced mission templates。
- `stepFunctions.js`：advanced mission 使用的 stepFunctions；目前有依賴不存在 function 的風險。

## `src/hooks/`

- `useObjectBindingPosition.js`：位置同步式 box-to-crane binding hook。
- `useObjectBinding.js`：早期 constraint binding hook，目前不可直接啟用。

## `backend/`

後端 Express + Sequelize。

- `backend/package.json`：後端 npm 專案。
- `backend/index.js`：Express app entry，掛載 routes，DB authenticate/sync 後 listen。
- `backend/models/index.js`：dotenv、Sequelize connection、model init、associations。
- `backend/models/Box.js`：`boxes` model。
- `backend/models/Item.js`：`items` model。
- `backend/models/BoxPosition.js`：`boxPosition` model。
- `backend/models/BoxContent.js`：`boxContent` model。
- `backend/models/test1.js`：早期 DB 測試 model。
- `backend/routes/boxesRoutes.js`：Box CRUD / soft delete。
- `backend/routes/itemsRoutes.js`：Item CRUD / categories。
- `backend/routes/boxPositionRoutes.js`：BoxPosition CRUD / map data。
- `backend/routes/boxContentRoutes.js`：BoxContent CRUD。
- `backend/routes/boxInventoryRoutes.js`：聚合 box inventory/full data。
- `backend/routes/test1Routes.js`：早期測試 route。

## Assets and build output

- `public/`：runtime GLTF/BIN 模型資產。`useGLTF('/xxx.gltf')` 主要從這裡讀。
- `src/assets/`：有部分 GLTF/BIN 與 React SVG，但主 runtime 多使用 `public/`。
- `dist/`：Vite build output，也是 Firebase Hosting 目標。不要把它當原始碼修改。
- `demo_resource_for_readme/`：README demo gif/png。
