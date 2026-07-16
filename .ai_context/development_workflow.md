# Development Workflow

## Frontend

```bash
# Run from the repository root (the directory containing .ai_context/).
npm install
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
npm run test:mission-builder
npm run test:mission-production-factory
npm run test:mission-runner
npm run preview
```

Run frontend and backend together from the repository root:

```bash
npm run dev:all
```

Required frontend env:

```env
VITE_API_BASE_URL=http://localhost:3002
```

Vite client env must use the `VITE_` prefix.

## Backend

```bash
cd backend
npm install
npm start
```

Required backend env for local DB:

```env
DB_ENV=local
PG_HOST_LOCAL=
PG_PORT_LOCAL=
PG_DATABASE_LOCAL=
PG_USER_LOCAL=
PG_PASSWORD_LOCAL=
PG_DIALECT_LOCAL=postgres
PORT_LOCAL=3002
```

Required backend env for cloud DB:

```env
DB_ENV=cloud
PG_HOST=
PG_PORT=
PG_DATABASE=
PG_USER=
PG_PASSWORD=
PG_DIALECT=postgres
PORT=
```

Health check:

```text
GET /
```

Expected response:

```text
Server is working!
```

## Deployment

Frontend:

1. Root 執行 `npm run build`。
2. Firebase Hosting deploys `dist/`。
3. `firebase.json` rewrites all routes to `/index.html`.

Backend:

1. Deploy `backend/` as a Node app.
2. Set DB env vars.
3. Make frontend `VITE_API_BASE_URL` point to backend public URL.

## Verification priority

After code changes, prefer:

1. `npm run test:mission-builder`
2. `npm run test:mission-production-factory`
3. `npm run test:mission-runner`
4. `npm run lint`
5. `npm run build`
6. Backend smoke check with `GET /`
7. Manual UI flow for touched feature

For any conveyor, roller, physics, crane, or shelf-culling change, also run the browser regression checklist in `performance_optimization.md`. Build and mission tests cannot detect a wrong visual axle or a box blocked at a conveyor seam.

Current test status:

- Focused Node tests cover the mission builder, production mission factory, and mission runner.
- No React component, browser end-to-end, or deterministic physics/conveyor test suite exists.
- Backend `npm test` is placeholder and intentionally fails.
- No CI config was found.
