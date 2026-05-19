# Development Workflow

## Frontend

```bash
cd /Users/adam/git/3d_warehause/3D_WareHouse_Management_System
npm install
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
npm run preview
```

Required frontend env:

```env
VITE_API_BASE_URL=http://localhost:3002
```

Vite client env must use the `VITE_` prefix.

## Backend

```bash
cd /Users/adam/git/3d_warehause/3D_WareHouse_Management_System/backend
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

1. `npm run lint`
2. `npm run build`
3. Backend smoke check with `GET /`
4. Manual UI flow for touched feature

Current test status:

- Frontend has ESLint config but no unit/integration test framework.
- Backend `npm test` is placeholder and intentionally fails.
- No CI config was found.
