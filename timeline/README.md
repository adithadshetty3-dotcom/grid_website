# GRID Timeline

This folder is the canonical, self-contained Timeline package. It contains the React/Vite frontend, Express API, independent SQLite/PostgreSQL adapters, migration tools, private image storage adapters, tests, and deployment/integration guides. It does not contain or require other GRID sections.

## Requirements

- Node.js 24.x and npm.
- Python is not needed for ordinary setup, development, build, or tests. The optional Flask parity test needs the existing Flask test environment.
- A fresh local setup needs no PostgreSQL, Vercel, Blob, or Upstash account.

## Fresh local setup

```sh
cd timeline
npm ci
cp .env.example .env
```

Edit `.env`: choose a random private `TIMELINE_SECRET_KEY` with at least 32 bytes, and set SQLite and upload paths outside this package (preferably outside the repository). Do not print or commit `.env`.

For a **new local database only**, run:

```sh
npm run db:init
npm run admin:create
```

`db:init` refuses an existing database and creates no account. `admin:create` prompts for a new username/password, requires typed confirmation, and refuses to alter a username that already exists. Neither command resets an account or database.

Start the frontend and API together on macOS by opening `start.command`, or run:

```sh
npm run dev
```

The launcher starts only its Express and Vite child processes and stops them together with Ctrl+C. URLs default to `http://127.0.0.1:5173/` and `http://127.0.0.1:5001/api`; override `TIMELINE_VITE_PORT` and `TIMELINE_PORT` if those ports are occupied. Vite proxies the same-origin `/api/*` requests to Express. The server will not create or migrate an absent database automatically.

## Tests and production build

```sh
npm test
npm run test:parity
npm run build
```

`npm test` runs the React tests and Express HTTP/database/migration tests. Its optional Flask parity case is explicitly reported as skipped unless run with `npm run test:parity`; that command uses the Flask harness/test environment when available. `npm run build` builds the Vite app into `public/` and enables the private Blob upload client for deployment. Node SQLite currently emits its documented experimental warning.

For local API testing against a protected copy of an existing database, first stop Flask and create a separate backup with `npm run db:backup`; never point both servers at the same SQLite database. To run the migration rehearsal on actual local data with temporary protected copies and emulated services, see [database migration](docs/DATABASE_MIGRATION.md). That rehearsal does not contact production or mutate the source.

## Architecture

- React 19 + Vite frontend in `frontend/`.
- Express 5 API in `backend/src/`, with business/authentication routes calling `timelineRepository.js` rather than a driver.
- Local SQLite adapter (`node:sqlite`) for development and tests; PostgreSQL `pg` adapter for production. Vercel production rejects SQLite.
- Local private filesystem adapter for dev; private Vercel Blob storage in production. Admin upload authorization, CSRF, server-side raster validation and published/admin read checks remain in the API.
- Upstash fixed-window shared login throttling in production, failing closed when unavailable.
- PostgreSQL schema and SQLite new-install schema under `migrations/`.

## Standalone Vercel deployment

Timeline is deployed as a separate Vercel project rooted at `timeline/`; the static GRID project remains independent. Vite builds with base `/`, the browser calls the same-origin `/api`, and the Express function handles those API requests. Timeline can be deployed before the main GRID website: set `VITE_TIMELINE_SHOW_STANDALONE_NAV=false` for the first standalone release so its header does not link to pages that do not exist on the Timeline host yet. Once the main site is deployed, set `VITE_TIMELINE_PARENT_URL` to its real origin and turn the standalone navigation back on. The build still rejects a visible standalone navigation when no real parent origin is configured. For project creation, environment setup, Preview verification, and rollout steps, follow [the Vercel deployment guide](docs/VERCEL_DEPLOYMENT.md).

The previous nested `/timeline/` base and API-prefix values remain available only for local integration previews. Do not set them in the standalone Vercel project.

The known-good Flask backend is retained outside this package in the GRID development checkout as the parity/rollback reference. It is not a runtime dependency. The optional Flask comparison requires a separately available Flask checkout and test environment, configured with `TIMELINE_FLASK_DIR` and `TIMELINE_FLASK_PYTHON`; a fresh Timeline clone does not include Python or Flask.

Read [API.md](docs/API.md), [integration guide](docs/INTEGRATION.md), [migration and rollback guide](docs/DATABASE_MIGRATION.md), [Vercel assessment](docs/VERCEL_DEPLOYMENT.md), and [test report](docs/TEST_REPORT.md).

## Current verification limits

Local React/Express parity and a read-only rehearsal of the existing local records/images against pg-mem and temporary in-memory storage have passed. The rehearsal verified aggregate counts and 8/8 image hashes. It is not a real PostgreSQL, Vercel Blob, Upstash, or Preview deployment test. No cloud service credentials or Preview deployment were available; the package must not be described as production-verified until those checks run.
