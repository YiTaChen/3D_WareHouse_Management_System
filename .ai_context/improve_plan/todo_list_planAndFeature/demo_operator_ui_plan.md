# Demo Operator UI Plan

目標: 把目前偏工程控制台的 UI 整理成適合 demo / 面試展示的操作員介面。第一眼要簡單、可理解、可操作，讓觀眾看懂「自動化倉儲入庫、出庫、庫存查詢」這條故事線，而不是被工程細節分散注意力。

最後更新: 2026-06-10

## Demo Narrative

建議展示流程:

1. 使用者打開 app，只看到簡化後的 operator panel。
2. 在 `Inbound` 選擇目標 shelf，按 `Run Inbound`。
3. 系統依 shelf 自動決定 inbound port，在 mission 開始時建立 default box，並執行入庫。
4. 在 `Inventory` 看到 box / shelf 狀態更新。
5. 在 `Outbound` 選擇有 box 的 shelf，場景同步 highlight 該 shelf。
6. 按 `Run Outbound`，系統自動選擇 outbound port 並執行出庫。

核心訊息:

- 3D visualization shows the warehouse state.
- Mission automation moves boxes through conveyors/cranes.
- Inventory state is connected to the warehouse operation.

## UX Principles

- 所有 UI 文案使用英文。
- 第一層只保留 `Inbound` / `Outbound` / `Inventory` 三個 tab。
- 不展示 crane/conveyor/physics/debug 等工程細節。
- 不讓 demo 使用者選 port；port 應由系統根據 shelf / mission direction 決定。
- Inbound 不放 `Create Demo Box` 按鈕；按 `Run Inbound` 時才建立 default box 並執行任務。
- 操作後要有明確狀態文字，例如 `Ready`, `Box created`, `Mission running`, `Mission completed`, `Mission failed`。
- 互動應該和 3D 場景連動，尤其是 shelf highlight。

## Current UI Problems

- `SubPanelProduction` 目前包含 `MissionPanel`, `BoxCreate`, `Inventory`，展示時入口太多。
- `MissionPanel` 同時暴露 direction、port、shelf、add box、load mission、run mission 等細節，對 demo 使用者不直覺。
- `SubPanel` 的 engineer testing panel 對展示沒有幫助，應先隱藏。
- `BoxCreate` 是自定義建立 box 的流程，適合測試/管理，不適合第一層 demo。
- Outbound 目前讓使用者選 port 的價值不高；demo 中可由系統固定或依規則決定。

## Target Information Architecture

### Main Screen

- 只顯示一個主要按鈕: `Open Control Panel` 或直接顯示 operator panel。
- 隱藏 `Show Engineer Testing Panel`。
- 若未來需要工程功能，改成 hidden/debug entry，例如:
  - keyboard shortcut
  - query flag
  - small `Engineer Mode` toggle hidden under settings

### Operator Panel Tabs

- `Inbound`
- `Outbound`
- `Inventory`

## Phase 1: Panel Shell Simplification

Goal: 讓展示入口乾淨，只保留一般操作員功能。

Tasks:

- [x] 隱藏或移除主畫面上的 engineer panel button。
- [x] 將 production panel tab 改成 `Inbound`, `Outbound`, `Inventory`。
- [x] 移除 `BoxCreate` 分頁作為第一層入口。
- [x] 所有可見文字改成英文。
- [x] 保留現有底層 stores / mission builder / runner，不改 3D/physics 行為。

Definition of done:

- 使用者進入 app 後不會看到工程測試入口。
- Control panel 只顯示三個 demo tabs。
- 不需要理解 crane / conveyor / port 就能開始操作。

## Phase 2: Inbound Demo Flow

Goal: 一個簡單動作完成 default box 建立與入庫。

User-facing controls:

- [x] `Destination Shelf` dropdown
- [x] `Run Inbound` button
- [x] Mission status display

Behavior:

- [x] Dropdown 只列出適合 inbound 的空 shelf。
- [x] 使用者選擇 shelf 後，不需要選 port。
- [x] 按 `Run Inbound` 時:
  - 根據 shelf z / config 決定 inbound port。
  - 在該 inbound port 建立 default box。
  - 使用該 box id 與 shelf position 建立 inbound mission。
  - 執行 mission。
- [x] `Run Inbound` 在必要資料不足或 mission running 時 disabled。

Suggested implementation notes:

- 優先重用 `MissionPanel.jsx` 目前的:
  - `getInboundShelfZPositions()`
  - `getPortSpawnPosition()`
  - `getPortConveyorId()`
  - `buildInboundMission()`
  - `addSingleBox()`
- 新增 helper 將 shelf position / shelf z 對應到 inbound port。
- 若同一 shelf z 有固定 port mapping，先用 config-based static mapping，避免引入 graph routing。

Definition of done:

- Demo 使用者只選 shelf 就能啟動 inbound。
- default box 會在正確 port 建立。
- mission 能沿用 production builder + runner。

## Phase 3: Outbound Demo Flow

Goal: 選 shelf、看 highlight、執行出庫。

User-facing controls:

- [x] `Source Shelf` dropdown
- [x] `Highlight Shelf` button, optional if dropdown already auto-highlights
- [x] `Run Outbound` button
- [x] Mission status display

Behavior:

- [x] Dropdown 只列出目前有 box 的 shelf。
- [x] 選擇 shelf 時自動 highlight 該 shelf。
- [x] `Highlight Shelf` 可作為 secondary action，用來重新聚焦場景。
- [x] 使用者不需要選 outbound port。
- [x] 按 `Run Outbound` 時:
  - 根據 shelf z / config 決定 outbound port，或先使用現有固定 port mapping。
  - 取得 shelf 上的 box id。
  - 使用 production `buildOutboundMission()` 建立 mission。
  - 執行 mission。

Suggested implementation notes:

- 優先重用:
  - `useBoxEquipStore.getAllShelfId()`
  - `useBoxEquipStore.getBoxIdbyEquipId()`
  - `useShelfStore.getShelfPosition()`
  - `useUIStore` 的 highlight state
  - `buildOutboundMission()`
- 如果 shelf highlight 已有 `HighlightSpot`，先沿用，不重做視覺效果。

Definition of done:

- 選 shelf 後 3D 場景有明確 highlight。
- 不需選 port 也能出庫。
- mission 能沿用 production builder + runner。

## Phase 4: Inventory Demo View

Goal: Inventory 不只是表格，而是展示 automation 結果與 3D 場景狀態。

Recommended UI:

- [x] Summary row:
  - `Total Boxes`
  - `Occupied Shelves`
  - `Available Shelves`
- [x] Table:
  - `Box ID`
  - `Shelf`
  - `Item`
  - `Quantity`
  - `Status`
- [x] Row action:
  - click row to highlight shelf
  - optional `Outbound` action to jump to outbound tab with shelf selected

Behavior:

- [ ] Inventory refreshes after inbound/outbound mission completes.
- [x] Clicking a row highlights the corresponding shelf in the 3D scene.
- [x] Empty state should be friendly, e.g. `No boxes in storage yet`.

Suggested implementation notes:

- Start by improving existing `Inventory.jsx`; do not create a second inventory system.
- Reuse current box/shelf/equipment stores.
- Keep table compact and readable for demo.

Definition of done:

- Demo viewer can understand warehouse state from Inventory without reading debug data.
- Inventory can drive scene highlight.
- Inventory supports the demo story after inbound and before outbound.

## Phase 5: Demo Polish and Safety

Goal: 讓 demo 過程穩定、可理解、可恢復。

Tasks:

- [ ] Add clear button states: disabled, running, completed, failed.
- [ ] Add concise mission progress text.
- [ ] Prevent duplicate mission runs while a mission is already running.
- [ ] Ensure inbound/outbound selected shelf remains valid after inventory changes.
- [ ] Add friendly fallback if backend is not running.
- [ ] Keep engineering features hidden but not deleted.

Definition of done:

- 面試 demo 時不需要解釋內部 debug controls。
- 即使 backend 沒開，UI 不應白屏。
- Mission failure should show a readable message.

## Phase 6: Verification

Checks:

- [x] `npm run build`
- [x] `npm run test:mission-builder`
- [x] `npm run test:mission-runner`
- [x] `npm run test:mission-production-factory`
- [ ] Manual browser check:
  - open app
  - run inbound
  - inspect inventory
  - highlight outbound shelf
  - run outbound

Known lint status:

- `npm run lint` currently fails on pre-existing repo-wide issues. Do not treat existing lint debt as blocking this UI slice unless newly touched files introduce new avoidable issues.

## Non-goals for This Demo UI Slice

- Do not redesign 3D models.
- Do not change physics behavior.
- Do not introduce new backend schema.
- Do not rebuild route planning from graph data yet.
- Do not expose advanced crane/conveyor controls in the primary demo UI.
- Do not keep custom `BoxCreate` as a top-level demo tab.

## Open Questions

- Should the operator panel be open by default on app load?
- Should `Highlight Shelf` be a separate button, or should shelf dropdown selection always highlight automatically?
- Should Inventory include an explicit `Refresh` button, or refresh only after mission completion?
- Should demo mode use fixed sample item content for default boxes?
- Should engineer controls be accessible through a hidden toggle or remain code-only for now?

## Progress Notes

### 2026-06-10 - Planning

- Captured the demo UI direction:
  - simple English operator UI
  - tabs: `Inbound`, `Outbound`, `Inventory`
  - inbound creates default box only when `Run Inbound` is clicked
  - outbound hides port selection and focuses on shelf selection/highlight/run
  - engineer panel hidden for demo
- Added this plan so future implementation can be tracked in small phases.

### 2026-06-10 - Phase 1-4 initial implementation

- Added `src/components/subPages/OperatorPanel.jsx` as the demo-facing operator UI.
- Updated `SubPanelProduction.jsx` to show the operator panel instead of the previous `MissionPanel` / `BoxCreate` / `Inventory` tab mix.
- Updated `App.jsx` to hide the engineer testing panel button and expose a single `Open Control Panel` entry.
- Added shelf-Z-to-port helpers in `src/missions/config/portConfigs.js` so demo UI can hide port selection.
- Implemented Inbound demo flow:
  - select destination shelf
  - create default demo box when `Run Inbound` is clicked
  - auto-select inbound port
  - build/run production inbound mission
- Implemented Outbound demo flow:
  - select occupied source shelf
  - auto-highlight selected shelf
  - hide outbound port selection
  - build/run production outbound mission
- Simplified `Inventory.jsx` for demo:
  - summary cards
  - compact table
  - click row / `Highlight` action to highlight current position
- Verification:
  - `npm run test:mission-builder` passed.
  - `npm run test:mission-runner` passed.
  - `npm run test:mission-production-factory` passed.
  - `npm run build` passed.
  - Dev server was started on port `5175` because the usual port may be occupied; served modules confirmed the new operator panel and demo controls are loaded.

Remaining:

- Manual browser flow still needs a full end-to-end check with backend/physics running: inbound -> inventory refresh -> outbound.
- Inventory refresh after mission completion may need a tighter trigger once manual flow is verified.
