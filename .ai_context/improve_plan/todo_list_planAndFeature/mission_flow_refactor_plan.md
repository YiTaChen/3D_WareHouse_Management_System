# Mission Flow Refactor Plan

目標: 把目前實際執行中的 hard-coded mission flow 拆成可測試、可追蹤、可逐步替換的架構，同時保留現有 inbound / outbound 行為。

最後更新: 2026-05-19

## Current Production Flow

目前實際執行路徑:

1. `src/components/SubPanelProduction.jsx`
   - 掛載 `MissionPanel` 作為 production 任務 UI。
2. `src/components/subPages/MissionPanel.jsx`
   - 負責 UI 選項、port/shelf/box 查詢、mission template 選擇、參數注入。
3. `src/missions/builders/missionBuilder.js`
   - 根據 port config 選擇 production param template 與 task-builder mission factory。
4. `src/missions/builders/productionMissionFactory.js`
   - 用 composable task builders 產生 inbound / outbound mission object。
   - 保留 Crane002 conveyor speed sequence 等 production quirks。
5. `src/stores/missionStore.js`
   - 按 `mission.tasks[].steps[]` 順序執行。
   - 用 runtime runner 與 adapter `stepFunctions` 執行 side effects。

另一套 advanced flow:

- `src/components/subPages/MissionHighLevelPanel.jsx` 已改接 production builder + `missionStore` runner。
- 舊的 `missionAdvancedStore.js`、`missionTaskTemplates.js`、`src/missions/stepFunctions.js` 已移除，避免雙 mission 系統漂移。

## Hard-Code Inventory

優先拆分這些 hard-code:

- Port 選項:
  - `MissionPanel.jsx` 裡的 `portOptions`
  - inbound: `Port1`, `Port3`, `Port4`
  - outbound: `Port2`, `Port3`, `Port5`
- Port spawn position:
  - `MissionPanel.jsx` 的 `getPortPosition()`
- Port -> conveyor 對應:
  - `MissionPanel.jsx` 的 `getPortConveyorName()`
- Port -> mission template 對應:
  - `MissionPanel.jsx` 的 `customMission01_in/out`, `customMission02_in/out`, `customMission03_in/out`
- Crane / conveyor route / origin position:
  - `craneMissionData.js` 的 `crane001InboundMissionParamTemplate`
  - `crane002InboundMissionParamTemplate`
  - `crane003InboundMissionParamTemplate`
  - `crane001_OutboundMissionTemplate`
  - `crane002_OutboundMissionTemplate`
  - `crane003_OutboundMissionTemplate`
- Shelf z -> crane z / platform side rule:
  - `inboundTemplateFunction()`
  - `inboundTemplateFunctionForCrane2()`
  - `outboundTemplateFunction()`
  - `outboundTemplateFunctionForCrane2()`
- Mission execution coupling:
  - `missionStore.js` directly imports `stepFunctions` from `craneMissionData.js`

## Target Architecture

Recommended target shape:

- `config`
  - 描述倉庫設備、port、route、crane、shelf rule。
  - 不呼叫 Zustand，不碰 React。
- `builders`
  - 根據 user selection 與 config 產生 mission object。
  - 可用 unit test 驗證。
- `runtime`
  - 執行 mission object。
  - 不知道 crane/conveyor/box 的實作細節，只呼叫 injected step functions。
- `adapters`
  - 包裝實際 side effects。
  - 例如呼叫 Zustand store: craneStore, conveyorStore, boxStore, boxEquipStore。

Suggested files:

- `src/missions/config/portConfigs.js`
- `src/missions/config/routeConfigs.js`
- `src/missions/config/shelfRules.js`
- `src/missions/builders/missionBuilder.js`
- `src/missions/builders/taskBuilders.js`
- `src/missions/runtime/missionRunner.js`
- `src/missions/adapters/stepFunctions.js`

## Migration Principles

- 保留現有 behavior，避免一次重寫整套 mission system。
- 先抽純資料和純函式，再改 UI wiring。
- 每一步都應能 build，且 production mission UI 仍可使用。
- 避免同時重構 advanced flow；先穩定 production path。
- 不要在第一階段改 3D/physics 行為。
- 新 builder 產生的 mission object 應先和現有格式相容。

## Phase 1: Extract Config

Goal: 把散在 UI/template 裡的固定對應移到 config。

Tasks:

- [x] 新增 `src/missions/config/portConfigs.js`
  - include port id, direction, spawnPosition, craneId, conveyor path, pickup/drop conveyor.
- [x] 新增 `src/missions/config/routeConfigs.js`
  - include inbound/outbound conveyor route arrays.
- [x] 新增 `src/missions/config/shelfRules.js`
  - include shelf z -> side rule and shelf z -> crane operating z rule.
- [x] 讓 `MissionPanel.jsx` 從 config 取得 port options。
- [x] 讓 `MissionPanel.jsx` 從 config 取得 add-box spawn position。
- [x] 保留舊 template functions 先不刪，降低風險。

Suggested tests:

- `portConfigs` has all current production ports.
- `Port1` inbound route equals `conv1 -> conv2 -> conv3`.
- `Port5` outbound route equals `conv13 -> conv14 -> conv16 -> conv17 -> conv18 -> conv19`.
- shelf z rules match current behavior for `-8`, `-4`, `-2`, `2`, `4`.

Definition of done:

- MissionPanel no longer hard-codes port option arrays.
- Add-box position still matches previous Port1/Port3/Port4 behavior.
- Existing mission buttons still work.

### Progress Notes

#### 2026-05-19 - Phase 1, step 1

- Created `src/missions/config/portConfigs.js` with current production port direction options, add-box spawn positions, inbound shelf z filters, conveyor ids, and crane ids.
- Created `src/missions/config/routeConfigs.js` with current inbound/outbound conveyor route arrays and crane port positions for each production port.
- Created `src/missions/config/shelfRules.js` with current shelf z -> platform side and shelf z -> crane operating z rules.
- Updated `MissionPanel.jsx` to read port options, add-box spawn position, inbound empty-shelf z filters, and port conveyor ids from config.
- Left existing mission template functions in place; no mission task/step generation behavior intentionally changed in this step.

#### 2026-05-19 - Phase 1, step 2

- Updated `craneMissionData.js` to use `getShelfIsTakeLeft()` and `getCraneOperatingZ()` from `src/missions/config/shelfRules.js`.
- Removed duplicated shelf z switch blocks from inbound, inbound crane2, outbound, and outbound crane2 template functions.
- Preserved existing fallback behavior: unknown shelf z still defaults to platform-left and crane operating z `0`.
- Verification: `npm run build` passed after this step. `npm run lint` was also checked after step 1 and still fails on pre-existing repo-wide issues unrelated to this extraction, including backend CommonJS globals, unused variables, and existing React hook rule violations.

Observed but intentionally not changed yet:

- `dynamicSetMission()` in `MissionPanel.jsx` appears unused and has stale/inconsistent inbound port mapping.
- `crane002InboundMissionParamTemplate.startPort` is `Port2`, while the exported/static mission and UI behavior use `Port3`.
- `crane003_OutboundMissionTemplate.startPort` is `Port3`, while the UI labels that route as outbound to `Port5`; the actual exit conveyor remains `conv19`.

## Phase 2: Introduce Mission Builder

Goal: UI stops mutating exported template objects directly.

Tasks:

- [x] Add `buildInboundMission({ portId, boxId, shelfPosition })`.
- [x] Add `buildOutboundMission({ portId, boxId, shelfPosition })`.
- [x] Builder internally uses existing `inboundTemplateFunction` / `outboundTemplateFunction` first.
- [x] Replace `customMission01_in/out`, `customMission02_in/out`, `customMission03_in/out` with generic builder calls.
- [x] Avoid mutating `crane001InboundMissionParamTemplate` and similar exported objects in `MissionPanel.jsx`.

Suggested tests:

- [x] inbound builder maps configured inbound ports and injects runtime input.
- [x] outbound builder maps configured outbound ports and injects runtime input.
- [x] builder deep-clones the base template before calling template function.
- [x] missing `boxId`, `portId`, or `shelfPosition` throws a clear validation error.
- [x] unsupported inbound/outbound ports throw clear validation errors.

Definition of done:

- `MissionPanel.jsx` delegates mission creation to builder functions.
- No direct mutation of exported mission param templates remains in `MissionPanel.jsx`.
- Builder tests pass.

### Progress Notes

#### 2026-05-19 - Phase 2, step 1

- Added `src/missions/builders/missionBuilder.js`.
- Added `buildInboundMission({ portId, boxId, shelfPosition })` and `buildOutboundMission({ portId, boxId, shelfPosition })`.
- Builder preserves the current production mapping:
  - inbound `Port1` -> crane001 + `inboundTemplateFunction`
  - inbound `Port3` -> crane002 + `inboundTemplateFunctionForCrane2`
  - inbound `Port4` -> crane003 + `inboundTemplateFunction`
  - outbound `Port2` -> crane001 + `outboundTemplateFunction`
  - outbound `Port3` -> crane002 + `outboundTemplateFunctionForCrane2`
  - outbound `Port5` -> crane003 + `outboundTemplateFunction`
- Builder deep-clones existing param templates and merges runtime `boxId` / `shelfPosition`, so `MissionPanel.jsx` no longer mutates imported template singletons.
- Updated `MissionPanel.jsx` to call `loadInboundMission(portId)` and `loadOutboundMission(portId)`, delegating mission construction to the builder.
- Removed unused local template injection code from `MissionPanel.jsx`.
- Verification: `node --check src/missions/builders/missionBuilder.js` passed.
- Verification: `npm run build` passed after integrating `MissionPanel.jsx` with the builder.
- Subagent execution:
  - Explorer subagent completed read-only Phase 2 plan/risk review.
  - Worker subagent added `missionBuilder.js` and verified it with `node --check`.

#### 2026-05-19 - Phase 2, step 2

- Split builder pure logic into `src/missions/builders/missionBuilderCore.js`.
- Kept `src/missions/builders/missionBuilder.js` as production wiring around existing `craneMissionData.js` templates/functions.
- Added `src/missions/builders/missionBuilderCore.test.js` using Node's built-in `node:test`, so builder validation does not import `craneMissionData.js`, Zustand stores, or Vite runtime globals.
- Added `npm run test:mission-builder`.
- Verification: `npm run test:mission-builder` passed with 6 tests.
- Verification: `node --check` passed for `missionBuilderCore.js` and `missionBuilderCore.test.js`.
- Verification: `npm run build` passed after the core/test split.

## Phase 3: Extract Pure Mission Runner

Goal: Mission execution can be tested without Zustand or 3D scene.

Tasks:

- [x] Add `src/missions/runtime/missionRunner.js`.
- [x] Implement `runMission(mission, stepFunctions, callbacks?)`.
- [x] Move task/step sequencing logic out of `missionStore.js`.
- [x] Keep `missionStore.js` responsible for Zustand state only.
- [x] Allow injecting fake `stepFunctions` in tests.

Suggested tests:

- [x] Runs all steps in order.
- [x] Awaits async steps before moving to next step.
- [x] Stops on a step returning `false`.
- [x] Marks unknown `functionKey` as failed/error.
- [x] Stops on thrown step errors.
- [x] Updates task and mission status correctly.

Definition of done:

- `missionStore.js` no longer contains recursive task/step execution details.
- Runner tests pass without rendering React.

### Progress Notes

#### 2026-05-19 - Phase 3, step 1

- Added `src/missions/runtime/missionRunner.js`.
- Added pure async `runMission(mission, stepFunctions, callbacks?)`.
- Updated `src/stores/missionStore.js` to keep only Zustand state wiring and inject production `stepFunctions` from `craneMissionData.js`.
- Removed task/step recursion from `missionStore.js`; status transitions and step sequencing now live in the runtime runner.
- Added `src/missions/runtime/missionRunner.test.js` using Node's built-in `node:test`.
- Added `npm run test:mission-runner`.
- Verification: `npm run test:mission-runner` passed with 6 tests.
- Verification: `npm run test:mission-builder` still passed with 6 tests.
- Verification: `node --check src/missions/runtime/missionRunner.js` passed.
- Verification: `npm run build` passed after runner extraction.
- Subagent execution:
  - Worker subagent implemented the runner/test/store wiring slice and ran focused validation before returning.

## Phase 4: Split Step Function Adapters

Goal: Separate action adapters from mission data/templates.

Tasks:

- [x] Move `stepFunctions` out of `craneMissionData.js`.
- [x] Create `src/missions/adapters/stepFunctions.js`.
- [x] Keep function names compatible:
  - `moveCrane`
  - `moveCraneTable`
  - `craneBindingBox`
  - `craneUnBindingBox`
  - `startConveyorRotate`
  - `stopConveyorRotate`
  - `setConveyorRotateSpeedPositive`
  - `setConveyorRotateSpeedNagetive`
  - `setConveyorRotateSpeed`
  - `checkBoxOnEquipment`
  - `updateBoxCurrentPositionServerHandler`
  - `removeBoxCurrentPositionServerHandler`
- [x] Update imports in `missionStore.js` or runner wiring.

Suggested tests:

- Use mocked store actions where feasible.
- Verify each adapter calls the expected store action with expected arguments.
- Avoid requiring real R3F/Cannon physics in unit tests.

Definition of done:

- `craneMissionData.js` contains mission/template logic only.
- Side-effect step functions live in adapter module.

### Progress Notes

#### 2026-05-19 - Phase 4, step 1

- Added `src/missions/adapters/stepFunctions.js`.
- Moved production side-effect step functions and `checkBoxOnEquipment()` out of `src/missions/craneMissionData.js`.
- Updated `src/stores/missionStore.js` to import production `stepFunctions` from `src/missions/adapters/stepFunctions.js`.
- Kept existing function keys compatible with current mission templates.
- `craneMissionData.js` now focuses on mission/template data and shelf-rule helpers.
- Verification: `node --check src/missions/adapters/stepFunctions.js` passed.
- Verification: `npm run test:mission-runner` passed with 6 tests.
- Verification: `npm run test:mission-builder` passed with 6 tests.
- Verification: `npm run build` passed after adapter extraction.
- Subagent execution:
  - Worker subagent moved the adapter code and ran focused validation before returning.

## Phase 5: Replace Large Template Functions With Task Builders

Goal: Make mission steps composable and easier to review.

Tasks:

- [x] Add task builder helpers:
  - `conveyorMoveUntilBoxArrives()`
  - `craneMoveTo()`
  - `cranePickFromConveyor()`
  - `cranePutOnShelf()`
  - `cranePickFromShelf()`
  - `cranePutOnConveyor()`
  - `conveyorMoveToExit()`
  - `updateBoxPosition()`
  - `softDeleteBoxAfterOutbound()`
  - `craneReturnHome()`
- [x] Rebuild inbound mission from task builders.
- [x] Rebuild outbound mission from task builders.
- [x] Compare generated mission shape with previous production missions.

Suggested tests:

- Each task builder returns stable task ids and expected step functionKeys.
- Full inbound builder output has same important functionKey sequence as old flow.
- Full outbound builder output has same important functionKey sequence as old flow.

Definition of done:

- Old huge inbound/outbound template functions are no longer the primary builder path.
- New task builders cover all production mission buttons.

### Progress Notes

#### 2026-05-19 - Phase 5, step 1

- Added `src/missions/builders/taskBuilders.js` with composable task/step helpers for conveyor movement, crane moves, crane pick/put operations, server position update, outbound soft delete, and crane return-home.
- Added `src/missions/builders/productionMissionFactory.js`.
- Updated `src/missions/builders/missionBuilder.js` so production inbound/outbound mission creation now uses the task-builder factory instead of calling the large legacy template functions directly.
- Preserved production quirks intentionally:
  - `Port3` inbound still uses the Crane002 positive-speed conveyor sequence.
  - `Port3` outbound still uses the Crane002 negative-speed conveyor sequence, including `pass` conveyor ids where the adapter skips work.
  - Outbound update + soft-delete still happen after exit arrival and before conveyor stop steps.
- Kept legacy template functions in `src/missions/craneMissionData.js` as fixtures/reference data for this migration step.
- Added `src/missions/builders/productionMissionFactory.test.js` to compare task ids, step ids, function keys, names, statuses, and important params between the new factory and the previous production template functions.
- Added `npm run test:mission-production-factory`.
- Verification: `npm run test:mission-production-factory` passed with 4 tests.
- Verification: `npm run test:mission-builder`, `npm run test:mission-runner`, and `npm run build` passed after wiring production builder to the task-builder factory.

## Phase 6: Decide Advanced Flow Future

Goal: Avoid two mission systems drifting forever.

Options:

- Option A: Remove or archive advanced flow if unused.
- Option B: Rewire advanced UI to use the new builder + runner.

Tasks:

- [x] Confirm whether `MissionHighLevelPanel` is still desired.
- [x] If keeping it, make it call the same builder and runner as production flow.
- [x] Delete dead advanced-flow imports/files and update `.ai_context/known_risks.md`.

Definition of done:

- Repo has one production mission architecture.
- `.ai_context` documents the final path clearly.

### Progress Notes

#### 2026-05-19 - Phase 6, step 1

- Kept `src/components/subPages/MissionHighLevelPanel.jsx`, but rewired it to use production `buildInboundMission()` / `buildOutboundMission()` and `useMissionStore().runMission()`.
- Removed the old advanced mission executor and template files:
  - `src/stores/missionAdvancedStore.js`
  - `src/missions/missionTaskTemplates.js`
  - `src/missions/stepFunctions.js`
- Removed stale `MissionHighLevelPanel` imports/commented tab references from panel wrappers where the high-level panel was not active.
- Updated `.ai_context/known_risks.md`, `.ai_context/repo_structure.md`, `.ai_context/feature_map.md`, and `.ai_context/functions/stores_and_missions.md` so future agents see one mission architecture.
- Verification: `rg "missionAdvancedStore|missionTaskTemplates|missions/stepFunctions" src` returned no source references.
- Verification: `npm run test:mission-builder`, `npm run test:mission-runner`, `npm run test:mission-production-factory`, and `npm run build` passed.
- Verification: `npm run lint` still fails on pre-existing repo-wide issues, including backend CommonJS globals, unused variables, React hook rule violations, `useObjectBinding.js` undefined names, and existing store/config issues. No lint errors were reported in the new `taskBuilders.js`, `productionMissionFactory.js`, or `productionMissionFactory.test.js` files.

## TDD Strategy

Start with pure tests:

1. Config tests.
2. Builder tests.
3. Runner tests.
4. Adapter tests with mocked store actions.

Avoid early heavy tests:

- Do not start by testing full 3D physics flow.
- Do not require real collision sensors for unit tests.
- Add browser/integration tests only after builder/runner are stable.

Recommended test stack:

- Use the repo's existing JS tooling if a test runner already exists.
- If no test runner exists, consider adding Vitest because the frontend is Vite based.
- Keep first tests under mission modules, for example:
  - `src/missions/config/*.test.js`
  - `src/missions/builders/*.test.js`
  - `src/missions/runtime/*.test.js`

## Agent Execution Checklist

Before editing:

- [x] Read `.ai_context/agent_entrypoint.md`.
- [x] Read `.ai_context/known_risks.md`.
- [x] Read this file.
- [x] Confirm current branch is not `main` unless explicitly requested.
- [x] Run `git status -sb`.

For each phase:

- [x] Make a small scoped change.
- [x] Add or update tests for that scope.
- [x] Run relevant checks.
- [x] Update this checklist or `todo_list.md` if scope changes.
- [x] Do not silently modify unrelated files.

Useful verification:

- `npm run lint`
- `npm run build`
- If tests are added: `npm test` or the configured test command.

## Open Questions

- Should mission ids remain exactly the same for UI display/history compatibility?
- Should invalid mission input throw errors or return `{ ok: false, error }`?
- Should outbound soft-delete happen immediately after box reaches exit conveyor, or after all conveyors stop?
- Should route config eventually be generated from conveyor graph data instead of static arrays?
