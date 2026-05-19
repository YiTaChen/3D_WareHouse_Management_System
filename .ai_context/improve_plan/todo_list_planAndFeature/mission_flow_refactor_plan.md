# Mission Flow Refactor Plan

目標: 把目前實際執行中的 hard-coded mission flow 拆成可測試、可追蹤、可逐步替換的架構，同時保留現有 inbound / outbound 行為。

最後更新: 2026-05-19

## Current Production Flow

目前實際執行路徑:

1. `src/components/SubPanelProduction.jsx`
   - 掛載 `MissionPanel` 作為 production 任務 UI。
2. `src/components/subPages/MissionPanel.jsx`
   - 負責 UI 選項、port/shelf/box 查詢、mission template 選擇、參數注入。
3. `src/missions/craneMissionData.js`
   - 定義 `stepFunctions`。
   - 定義 inbound / outbound template function。
   - hard-code crane id、conveyor id、port position、shelf z 規則、task/step 順序。
4. `src/stores/missionStore.js`
   - 按 `mission.tasks[].steps[]` 順序執行。
   - 用 `step.functionKey` 查 `craneMissionData.stepFunctions`。

另一套 advanced flow:

- `src/components/subPages/MissionHighLevelPanel.jsx`
- `src/stores/missionAdvancedStore.js`
- `src/missions/missionTaskTemplates.js`
- `src/missions/stepFunctions.js`

目前 advanced flow 不是 production 入口，且已有已知破損風險。除非任務明確要求，不應優先改它。

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

- [ ] 新增 `src/missions/config/portConfigs.js`
  - include port id, direction, spawnPosition, craneId, conveyor path, pickup/drop conveyor.
- [ ] 新增 `src/missions/config/routeConfigs.js`
  - include inbound/outbound conveyor route arrays.
- [ ] 新增 `src/missions/config/shelfRules.js`
  - include shelf z -> side rule and shelf z -> crane operating z rule.
- [ ] 讓 `MissionPanel.jsx` 從 config 取得 port options。
- [ ] 讓 `MissionPanel.jsx` 從 config 取得 add-box spawn position。
- [ ] 保留舊 template functions 先不刪，降低風險。

Suggested tests:

- `portConfigs` has all current production ports.
- `Port1` inbound route equals `conv1 -> conv2 -> conv3`.
- `Port5` outbound route equals `conv13 -> conv14 -> conv16 -> conv17 -> conv18 -> conv19`.
- shelf z rules match current behavior for `-8`, `-4`, `-2`, `2`, `4`.

Definition of done:

- MissionPanel no longer hard-codes port option arrays.
- Add-box position still matches previous Port1/Port3/Port4 behavior.
- Existing mission buttons still work.

## Phase 2: Introduce Mission Builder

Goal: UI stops mutating exported template objects directly.

Tasks:

- [ ] Add `buildInboundMission({ portId, shelfId, boxId, shelfPosition })`.
- [ ] Add `buildOutboundMission({ portId, shelfId, boxId, shelfPosition })`.
- [ ] Builder internally uses existing `inboundTemplateFunction` / `outboundTemplateFunction` first.
- [ ] Replace `customMission01_in/out`, `customMission02_in/out`, `customMission03_in/out` with generic builder calls.
- [ ] Avoid mutating `crane001InboundMissionParamTemplate` and similar exported objects in `MissionPanel.jsx`.

Suggested tests:

- inbound Port1 builds a mission named `Crane001 Inbound Mission`.
- inbound Port3 builds crane002 mission with `conv7`, `conv8`, `conv9`.
- outbound Port2 builds crane001 mission ending at `conv4`.
- outbound Port5 builds crane003 mission ending at `conv19`.
- missing `boxId`, `portId`, or `shelfPosition` returns a clear error or throws a clear validation error.

Definition of done:

- `MissionPanel.jsx` delegates mission creation to builder functions.
- No direct mutation of exported mission param templates remains in `MissionPanel.jsx`.
- Builder tests pass.

## Phase 3: Extract Pure Mission Runner

Goal: Mission execution can be tested without Zustand or 3D scene.

Tasks:

- [ ] Add `src/missions/runtime/missionRunner.js`.
- [ ] Implement `runMission(mission, stepFunctions, callbacks?)`.
- [ ] Move task/step sequencing logic out of `missionStore.js`.
- [ ] Keep `missionStore.js` responsible for Zustand state only.
- [ ] Allow injecting fake `stepFunctions` in tests.

Suggested tests:

- Runs all steps in order.
- Awaits async steps before moving to next step.
- Stops on a step returning `false`.
- Marks unknown `functionKey` as failed/error.
- Updates task and mission status correctly.

Definition of done:

- `missionStore.js` no longer contains recursive task/step execution details.
- Runner tests pass without rendering React.

## Phase 4: Split Step Function Adapters

Goal: Separate action adapters from mission data/templates.

Tasks:

- [ ] Move `stepFunctions` out of `craneMissionData.js`.
- [ ] Create `src/missions/adapters/stepFunctions.js`.
- [ ] Keep function names compatible:
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
- [ ] Update imports in `missionStore.js` or runner wiring.

Suggested tests:

- Use mocked store actions where feasible.
- Verify each adapter calls the expected store action with expected arguments.
- Avoid requiring real R3F/Cannon physics in unit tests.

Definition of done:

- `craneMissionData.js` contains mission/template logic only.
- Side-effect step functions live in adapter module.

## Phase 5: Replace Large Template Functions With Task Builders

Goal: Make mission steps composable and easier to review.

Tasks:

- [ ] Add task builder helpers:
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
- [ ] Rebuild inbound mission from task builders.
- [ ] Rebuild outbound mission from task builders.
- [ ] Compare generated mission shape with previous production missions.

Suggested tests:

- Each task builder returns stable task ids and expected step functionKeys.
- Full inbound builder output has same important functionKey sequence as old flow.
- Full outbound builder output has same important functionKey sequence as old flow.

Definition of done:

- Old huge inbound/outbound template functions are no longer the primary builder path.
- New task builders cover all production mission buttons.

## Phase 6: Decide Advanced Flow Future

Goal: Avoid two mission systems drifting forever.

Options:

- Option A: Remove or archive advanced flow if unused.
- Option B: Rewire advanced UI to use the new builder + runner.

Tasks:

- [ ] Confirm whether `MissionHighLevelPanel` is still desired.
- [ ] If keeping it, make it call the same builder and runner as production flow.
- [ ] If removing it, delete dead imports and update `.ai_context/known_risks.md`.

Definition of done:

- Repo has one production mission architecture.
- `.ai_context` documents the final path clearly.

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

- [ ] Read `.ai_context/agent_entrypoint.md`.
- [ ] Read `.ai_context/known_risks.md`.
- [ ] Read this file.
- [ ] Confirm current branch is not `main` unless explicitly requested.
- [ ] Run `git status -sb`.

For each phase:

- [ ] Make a small scoped change.
- [ ] Add or update tests for that scope.
- [ ] Run relevant checks.
- [ ] Update this checklist or `todo_list.md` if scope changes.
- [ ] Do not silently modify unrelated files.

Useful verification:

- `npm run lint`
- `npm run build`
- If tests are added: `npm test` or the configured test command.

## Open Questions

- Should mission ids remain exactly the same for UI display/history compatibility?
- Should invalid mission input throw errors or return `{ ok: false, error }`?
- Should outbound soft-delete happen immediately after box reaches exit conveyor, or after all conveyors stop?
- Should route config eventually be generated from conveyor graph data instead of static arrays?

