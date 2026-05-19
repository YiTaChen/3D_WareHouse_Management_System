# Change Guidelines for Future Agents

## Before editing

1. Read `agent_entrypoint.md`.
2. Read `known_risks.md`.
3. Identify whether the task touches:
   - frontend 3D scene
   - Zustand state
   - mission flow
   - backend API
   - DB schema
4. If the task is an improvement, refactor, TDD/testing effort, or todo-list item, read `improve_plan/todo_list.md` and the relevant file under `improve_plan/todo_list_planAndFeature/`.
5. Open the relevant `functions/*.md` file.

## Improve plan alignment

- Treat `improve_plan/` as the shared communication baseline for planned improvements.
- Before implementing a todo-list item, identify the matching plan document and follow its phase, task list, suggested tests, definition of done, and open questions.
- If the requested change conflicts with an existing plan, explain the conflict before editing and either update the plan or document why the change intentionally diverges.
- When completing or materially changing a planned item, update `improve_plan/todo_list.md` or the relevant plan file so later agents can continue from the latest state.
- Keep implementation PRs/commits scoped to the smallest useful phase whenever possible.

## General rules

- Keep frontend and backend npm projects separate.
- Do not modify `dist/` as source; rebuild it when needed.
- Do not assume `node_modules/` being present means dependency is correctly declared.
- Match import casing exactly.
- Prefer existing Zustand patterns.
- Prefer existing R3F/Cannon patterns for 3D/physics behavior.
- Update `.ai_context` files when you discover new facts or change behavior.

## Frontend changes

For UI/3D scene changes:

- Check `src/App.jsx`.
- Check `src/components/Scene.jsx`.
- Check the component specific file.
- Check related store under `src/stores/`.
- If model assets are involved, check `public/` and GLTF child names.

For state changes:

- Prefer the main store file. Example: `src/stores/boxStore.js`.
- Search imports before editing similarly named stores.
- Avoid adding new global stores unless there is a real cross-component need.

For mission changes:

- Main production path is:
  - `MissionPanel.jsx`
  - `missionStore.js`
  - `craneMissionData.js`
- Avoid advanced mission path unless specifically requested or repairing it.
- For mission flow refactor/TDD work, use `improve_plan/todo_list_planAndFeature/mission_flow_refactor_plan.md` as the primary plan and tracking reference.

## Backend changes

For API contract changes:

1. Update Sequelize model if schema changes.
2. Update route handler.
3. Update frontend store mapping.
4. Update UI consumer if needed.
5. Update `api_routes.md`, `data_model.md`, and relevant `functions/*.md`.

For DB schema changes:

- Be careful with `sequelize.sync({ alter: true })`.
- Prefer adding a migration system before larger schema changes.
- Document migration expectations.

For new endpoints:

- Add route to the relevant router or create a new router.
- Mount it in `backend/index.js`.
- Validate request body.
- Return consistent JSON.
- Add notes to `api_routes.md`.

## Verification

Minimum useful checks:

- Frontend: `npm run lint`
- Frontend: `npm run build`
- Backend: `npm start` and `GET /`
- Manual flow for changed feature

Known limitation:

- There is no real test suite today.

## Documentation upkeep

When changing:

- Folder structure -> update `repo_structure.md`
- Feature flow -> update `feature_map.md`
- API -> update `api_routes.md`
- DB -> update `data_model.md`
- Function behavior -> update `function_index.md` and `functions/*.md`
- Risks -> update `known_risks.md`
