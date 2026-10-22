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
npm run test:shelf-layout
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
4. `npm run test:shelf-layout`
5. `npm run lint`
6. `npm run build`
7. Backend smoke check with `GET /`
8. Manual UI flow for touched feature

For any conveyor, roller, physics, crane, or shelf-culling change, also run the browser regression checklist in `performance_optimization.md`. Build and mission tests cannot detect a wrong visual axle or a box blocked at a conveyor seam.

Current test status:

- Focused Node tests cover the mission builder, production mission factory, and mission runner.
- No React component, browser end-to-end, or deterministic physics/conveyor test suite exists.
- Backend `npm test` runs security regression tests with an isolated SQLite file; no production credentials are needed.
- No CI config was found.

## Security modes and release checks

Use patched Node 22.23.4 from the root/backend `.node-version`. The default frontend is an isolated demo (`VITE_DEMO_MODE=true`) for both development and production. Set false only to opt a trusted client into real API reads; backend administrative writes need `WAREHOUSE_ADMIN_TOKEN` and are never enabled by adding a frontend secret. DB administration requires explicit local opt-in, a direct loopback request, and administrator authentication, and is always off on Render/production.

Before release run `npm run test:demo`, `npm --prefix backend test`, both npm audits, existing focused frontend tests/lint, and build. Verify browser models/physics worker load under Firebase CSP, and create/move/remove isolated demo data without backend requests. Deploy only Firebase project/site `r3f-gravity-apply-test`.

Render root is `backend/`. Dashboard `NODE_VERSION` has precedence over `backend/.node-version` and `backend/package.json` engines; verify the startup log after fresh deployment. `/health` can verify the app revision but cannot establish the actual Node patch. PostgreSQL SSL uses certificate verification and optional `PG_SSL_CA`.
