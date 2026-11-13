# Standalone Vercel deployment

Timeline is an independent Vercel project. The existing GRID site remains a separate static HTML/CSS/JS project. Do not configure a reverse proxy or change the root project's deployment settings for this rollout.

This guide was checked against the official Vercel documentation on 12 November 2026. The dedicated `grid-timeline` Vercel project, Preview/Production Neon branches, private Blob store, and one Free Upstash Redis database have been provisioned for this rollout. The Upstash database is connected to both Preview and Production; the app namespaces rate-limit keys by Vercel environment so Preview counters do not affect Production. No Vercel deployment has happened yet. Local build/tests do not establish that a cloud deployment is production-ready.

## Project settings

Create a **new Vercel project** from the GRID repository and set:

| Setting | Value |
|---|---|
| Root Directory | `timeline` |
| Framework Preset | Express, if Vercel detects the root `server.js`; otherwise use the Vercel-supported Node/Other setup and verify that `server.js` is included as the function entrypoint |
| Node.js version | `24.x` |
| Install Command | `npm ci` (or leave automatic detection enabled; the package root has `package-lock.json`) |
| Build Command | `npm run build` (override if needed; this runs Vite and writes the client into `public/`) |
| Static assets | `public/**`; Vercel serves this directory via its CDN, not through Express `express.static()` |
| Output Directory | For the Express preset, leave the output-directory override disabled; `public/` is the package's static-asset directory. If the project uses the Other preset and Vercel requires an explicit output directory, set it to `public` and confirm Preview still exposes the `server.js` function. |

The root `server.js` default-exports the Express app from `backend/src/server.js`, which is a supported Express entrypoint shape. That backend deliberately skips its local `express.static()` and SPA fallback when `VERCEL` is set. Thus `/api/*` is handled by Express, while generated `/assets/*`, `/`, and `index.html` are static CDN assets. The app's API fallback returns JSON `404`; it does not rewrite unknown API routes to the frontend HTML. Direct `/` loads and refreshes use the static `public/index.html`. The UI does not use client-side path routes.

Vercel's Express integration packages the app as a Function and serves files in `public/**` through its CDN. Do not assume local Express static behavior applies in production. The API function has a 60 second configured maximum (`timeline/vercel.json`); Vercel's actual maximum also depends on the selected plan/runtime configuration. Function request and response bodies are limited to 4.5 MB, so production image upload uses the private Blob direct-upload flow rather than sending image bytes through Express. The legacy multipart image/import endpoints remain available for local operation and small requests; they are subject to the platform limit on Vercel.

### Standalone URL configuration

For Vercel Preview and Production builds:

- `VITE_TIMELINE_BASE=/` (or unset; `/` is the Vite default).
- `VITE_TIMELINE_API_BASE=` (empty; API requests and managed image URLs use same-origin `/api/...`).
- For the first standalone release, set `VITE_TIMELINE_SHOW_STANDALONE_NAV=false` in Preview and Production. This avoids parent-page links resolving to missing files on the separate Timeline host.
- After the main GRID site is deployed, set `VITE_TIMELINE_PARENT_URL` to its actual origin (including `https://`, with no guessed path) and set `VITE_TIMELINE_SHOW_STANDALONE_NAV=true`. This is a build-time, public navigation value—not a secret. A Production build rejects visible standalone navigation when the parent URL is missing. Never set a guessed domain.

Timeline's own Timeline link stays on the current app at `/`. The API, login, logout, sessions, CSRF cookie, and image references remain on the Timeline deployment origin. The API sets HttpOnly, Secure, SameSite=Lax cookies with `Path=/api` in production. Parent-site navigation links are ordinary outbound links and do not share admin cookies. Do not set `VITE_TIMELINE_API_BASE` or `TIMELINE_COOKIE_PATH` to the old integrated-preview prefixes in this standalone project.

The nested `/timeline/` asset base and API proxy prefix remain usable only for local integration-preview builds. To restore a local nested build, set `VITE_TIMELINE_BASE=/timeline/`; to restore local API proxying, configure its paired `VITE_TIMELINE_API_BASE`, proxy target and cookie path as documented in [INTEGRATION.md](INTEGRATION.md). Do not copy those values into Vercel project settings.

## Production infrastructure

Provision separate non-production resources for Preview and Production resources for the production environment. Do not point Preview at production data. The app fails fast if it starts on Vercel outside production mode, without an explicit Timeline PostgreSQL URL, or without Blob/Upstash credentials; Vercel must not fall back to local SQLite or filesystem image storage.

| Variable | Required | Purpose |
|---|---|---|
| `TIMELINE_ENV=production` | Yes, Preview and Production | Enables production security and managed adapters. Vercel normally supplies `NODE_ENV=production`, but set this explicitly for deterministic behavior. |
| `TIMELINE_SECRET_KEY` | Yes | Random secret of at least 32 bytes; use a different value for Preview and Production. |
| `TIMELINE_DATABASE_URL` | Yes | Timeline-specific managed PostgreSQL connection URL. The production config requires this explicit variable; generic `DATABASE_URL`/`POSTGRES_URL` alone is not enough. Use the provider's TLS-verified connection URL and a pooled/serverless endpoint suited to Functions. |
| `TIMELINE_DATABASE_POOL_MAX` | Optional (default `5`) | Pool limit, integer 1–10. Keep modest for serverless concurrency and provider connection limits. |
| `BLOB_READ_WRITE_TOKEN` | Yes | Token for a private Vercel Blob store. Private image reads are authorized by the API and redirect to short-lived signed URLs. |
| `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_KV_REST_API_URL` | Yes | Upstash Redis REST endpoint for shared login throttling. The Vercel Marketplace integration with the `UPSTASH_REDIS_REST` custom prefix supplies the longer `..._KV_REST_API_URL` name. |
| `UPSTASH_REDIS_REST_TOKEN` or `UPSTASH_REDIS_REST_KV_REST_API_TOKEN` | Yes | Matching Upstash REST token. Rate-limit failure is closed (503), never bypassed. The Vercel Marketplace integration supplies the longer `..._KV_REST_API_TOKEN` name. |
| `VITE_TIMELINE_BASE=/` | Set in build environment or rely on default | Keeps JS/CSS asset links at root for the independent project. |
| `VITE_TIMELINE_API_BASE=` | Keep empty/unset | Keeps browser API and private-image routes same-origin. |
| `VITE_TIMELINE_PARENT_URL` | Required when standalone nav is visible | Actual main GRID website origin, provided by the team lead. No value is embedded in source. |
| `VITE_TIMELINE_SHOW_STANDALONE_NAV=false` | Set for the first standalone release | Hides parent-site links until the main GRID website is deployed; switch to `true` together with the real parent URL later. |

Set server secrets only in the Vercel project's Preview or Production Environment Variables. `VITE_*` values are embedded in public client assets and must never contain secrets. Configure each value in the correct Vercel environment and redeploy after changing it.

Connect/provision the services in Vercel or their provider consoles; this guide does not create them:

1. Create a managed PostgreSQL database for each environment and connect with its provider-issued TLS-verified URL. Apply `migrations/postgresql/0005_timeline_schema.sql` to a new empty database, or rehearse the documented migration against a protected copy before importing existing data. Verify provider SSL, schema permissions and pool behavior in Preview.
2. Create a private Vercel Blob store per environment and configure its `BLOB_READ_WRITE_TOKEN`.
3. Connect Upstash Redis to Preview and Production. On the Free tier, the integration may provide one database shared by both environments; the app namespaces Preview and Production rate-limit keys separately. For strict infrastructure isolation, use separate Upstash databases/accounts when the plan permits.
4. Generate separate `TIMELINE_SECRET_KEY` values. Keep Preview accounts and content disposable.

The function filesystem is read-only except for temporary `/tmp` scratch space, which is not durable. Persistent application data uses PostgreSQL; image bytes use private Blob. The local filesystem image adapter is selected only outside production. PostgreSQL, Blob, and Upstash are mandatory in Vercel production configuration.

## Preview-first rollout

1. Create the separate project with Root Directory `timeline`; leave the existing parent GRID Vercel project untouched.
2. Configure Preview infrastructure and variables. For the standalone-first rollout, keep `VITE_TIMELINE_SHOW_STANDALONE_NAV=false` until the main GRID website has a real deployed origin. Keep the standalone base `/` and API base empty.
3. Deploy a Vercel Preview. Confirm `/` and `/assets/*` return the built app/assets, `/api/timeline/milestones` returns JSON, an unknown `/api/...` route returns JSON 404 (never `index.html`), and refreshing `/` still loads Timeline.
4. With a disposable Preview admin, verify CSRF rejection/acceptance, login/logout/session persistence, authorized and unauthorized operations, draft isolation, milestone changes and order, settings, direct Blob upload, private image access/signature expiry, and rate-limit behavior. Inspect cookie attributes (`Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/api`). Verify image/API URLs remain on the Timeline origin.
5. Verify migration and backup/restore procedures, provider TLS, Blob permissions, Upstash failure behavior, logs, and the supported upload size. Resolve every Preview issue before production.
6. Provision Production resources, deploy the standalone Timeline with its parent navigation hidden, and create the first production admin using the secure create-only operator process against the intended database; do not place admin credentials in build variables or source. After the main GRID website is deployed, enter its actual origin in `VITE_TIMELINE_PARENT_URL`, enable `VITE_TIMELINE_SHOW_STANDALONE_NAV=true`, and redeploy Timeline.
7. After the Timeline URL is known and verified, send that URL to the main GRID website team so they can update the Timeline navigation link in their own project. This package does not edit parent-site files.

## Current verification limits

Local tests and the production Vite build can verify the package behavior and generated paths, but cannot establish Vercel's built function routing, provider TLS/pooling, Blob token permissions, Upstash quotas, cookie behavior on the deployed domain, or actual Preview success. Those remain Preview acceptance checks. This workspace has not created services or deployed anything.

## Official references

- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) — supported entrypoints, CDN `public/**`, and `express.static()` limitation.
- [Vercel Express deployment guide](https://vercel.com/kb/guide/ship-a-express-app-on-vercel) — current zero-configuration Express project settings.
- [Vercel Node.js runtime](https://vercel.com/docs/functions/runtimes) — read-only filesystem and temporary `/tmp` storage.
- [Function limits](https://vercel.com/docs/functions/limitations) — request/response size and duration limits.
- [Build configuration](https://vercel.com/docs/builds/configure-a-build) — build and output directory settings.
- [Private Blob storage](https://vercel.com/docs/vercel-blob/private-storage) and [client uploads](https://vercel.com/docs/vercel-blob/client-upload).
- [Upstash rate-limit SDK](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview).
