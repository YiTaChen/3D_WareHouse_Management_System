# Dependency Map

## Frontend package

File: `package.json`

Scripts:

- `dev`: Vite dev server
- `build`: Vite production build
- `lint`: ESLint
- `preview`: Vite preview

Direct dependencies listed:

- `react`
- `react-dom`
- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/cannon`
- `immer`

Important observed dependency:

- `zustand` is imported throughout `src/stores/*`, but is not listed as a root direct dependency in `package.json`. It appears in `node_modules`/lockfile as a transitive dependency. Treat this as a dependency hygiene issue.

Dev dependencies:

- `vite`
- `@vitejs/plugin-react`
- `eslint`
- `@eslint/js`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `@types/react`
- `@types/react-dom`

## Backend package

File: `backend/package.json`

Scripts:

- `start`: `node index.js`
- `test`: placeholder, always exits with failure

Dependencies:

- `express`: REST server
- `cors`: CORS middleware
- `dotenv`: env loading
- `sequelize`: ORM
- `pg`: PostgreSQL driver
- `pg-hstore`: PostgreSQL hstore support

## Cross-cutting dependencies

- Frontend requires `VITE_API_BASE_URL`.
- Backend requires DB env selected by `DB_ENV`.
- Frontend model loading requires public GLTF/BIN assets to be present and named correctly.
- Firebase hosting requires built `dist/`.
