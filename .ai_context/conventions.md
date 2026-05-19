# Conventions

## Code style

- Frontend uses ES modules.
- Backend uses CommonJS.
- Stores are usually exported as `export const useXStore = create(...)`.
- Components are function components.
- Much of UI styling is inline style in JSX.

## State conventions

- Use Zustand for shared app state.
- Main box store is `src/stores/boxStore.js`.
- Avoid importing `src/stores/useBoxStore.js` unless you intentionally work on the old/simplified store.
- Runtime physics state often lives in Cannon refs/api, not only Zustand.

## Asset conventions

- Runtime GLTF paths are public absolute paths, for example `/box_ver1.gltf`.
- If adding or renaming models, update `public/` and check matching `.bin` files.
- Do not treat `dist/` as source of truth.

## API conventions

- Frontend stores call REST endpoints directly with `fetch`.
- Backend routes return mixed shapes today: model instances, arrays, `{ message }`, `{ error }`.
- When adding new API, prefer consistent JSON shape and validate request body.

## Naming

- DB column naming is snake/camel mixed because existing schema uses names like `box_id`, `isRemoved`, `isContentDelete`.
- Keep existing names unless doing a deliberate migration.
- Import casing must match actual file casing. This matters in Linux/Firebase/CI.

## Documentation update rule

When changing behavior, update the closest file:

- Folder/file purpose: `repo_structure.md`
- Feature flow: `feature_map.md`
- API: `api_routes.md`
- DB schema: `data_model.md`
- Function/store/component details: `functions/*.md`
- Risk/tech debt: `known_risks.md`
