# Timeline Admin API foundation

This is a separate Flask API for the GRID Timeline only. It does not modify or connect to the current React Admin Preview, IndexedDB milestone repository, localStorage page settings, another website section, or a shared GRID authentication/database system.

## Requirements and local setup

- Python 3.11 or newer.
- A virtual environment keeps Python packages separate from the system installation.

From this `backend/` directory:

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Windows PowerShell:

```powershell
py -3 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Set a fresh secret for local development. Do not reuse this value for production.

macOS/Linux:

```bash
export TIMELINE_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_hex(32))')"
```

Windows PowerShell:

```powershell
$env:TIMELINE_SECRET_KEY = python -c "import secrets; print(secrets.token_hex(32))"
```

The default SQLite database is created outside the repository under the current user's application data directory (`~/.local/share/grid-timeline/timeline-admin.sqlite3` on macOS/Linux, or `%LOCALAPPDATA%\grid-timeline\timeline-admin.sqlite3` on Windows). No database file is stored in tracked source folders.

Apply migrations, then create the first admin interactively:

```bash
flask --app app:create_app db upgrade
flask --app app:create_app create-admin
```

The CLI prompts for the username and prompts twice for a hidden password. Passwords must contain 12–1024 characters, matching the login limit. No public registration endpoint exists, and passwords are stored with Werkzeug's scrypt password hash.

Run the API's local development server in one terminal (this is not a production WSGI server):

```bash
python -m app
```

It listens on `127.0.0.1:5000`. In another terminal, run the Timeline Vite development server from `react-pilot/` with `npm run dev`. Vite proxies `/api` requests to the Flask server. The authenticated admin dashboard uses the auth, milestone and image endpoints. Public rendering merges published API milestones with read-only IndexedDB records; API failures retain the local fallback. Imported duplicates are suppressed from display by their stable source IDs, while local records and Blob photos remain unchanged.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TIMELINE_SECRET_KEY` | Yes | Random secret used to sign the CSRF bootstrap token. Generate a unique secret and keep it outside source control. Authentication state itself is stored server-side. |
| `TIMELINE_DATABASE_URL` | No | SQLAlchemy database URL. Defaults to the user-data SQLite file described above. Keep SQLite data outside tracked source files. |
| `TIMELINE_ENV` | No | Defaults to `development`. Set to `production` to enable `Secure` on both cookies. Production startup fails if Secure cookies are disabled or the limiter is not configured with shared Redis storage. Production must use HTTPS. |
| `TIMELINE_RATE_LIMIT_STORAGE_URI` | No locally; required in production | Flask-Limiter storage URL. Defaults to process-local `memory://` for development. Production accepts `redis://` or `rediss://` only, so all workers use shared rate-limit state. The `redis` Python package is included in `requirements.txt`. |

### Production configuration requirements

Production must provide a unique secret, set `TIMELINE_ENV=production`, use HTTPS, and configure a shared Redis endpoint through `TIMELINE_RATE_LIMIT_STORAGE_URI`. Use a Redis service configured with persistence appropriate to the deployment; use `rediss://` when the service requires TLS. Supply actual endpoint credentials through the deployment environment/secret manager, never source files. No deployment host or credentials are configured by this project. Start the app with a production WSGI server behind a correctly configured HTTPS proxy; do not expose Flask's development server or Vite's development proxy. Configure trusted proxy handling only for the actual proxy topology so clients cannot spoof the IP used by the per-IP limiter.

The production app factory refuses to start when either Secure cookie enforcement is off or the rate-limit URI is missing, `memory://`, or not Redis. It validates the configured Redis scheme but cannot inspect the remote service's persistence policy; that setting must be confirmed in the deployment environment. Local development retains the convenient in-memory limiter. The login route enforces both five attempts per normalized username/IP pair and twenty attempts per client IP per minute; shared Redis storage makes these limits consistent across workers.

SQLite paths inside the repository are rejected so local data cannot be accidentally tracked with source. Newly created parent directories receive owner-only permissions (POSIX `0700`; Windows ACL restricted to the current account), and newly created database files receive POSIX `0600` or a current-account-only Windows ACL. Existing directory and database permissions are left unchanged. Use a private persistent database directory outside the repository and protect its backups according to the deployment environment.

The admin cookie is an opaque random token; only its SHA-256 digest, admin association and expiry are stored in `timeline_admin_sessions`. It is HttpOnly, SameSite=Lax, scoped to `/api`, expires after 12 hours and is revocable on logout. A separate signed Flask cookie stores the CSRF bootstrap state only; it never contains the admin identity or login state and is also scoped to `/api`. Authenticated writes also require the per-session CSRF token returned on login. JSON request bodies are limited to 32 KiB; password login values longer than 1024 characters are rejected.

Unknown usernames still incur a dummy scrypt verification and receive the same generic login response as wrong passwords. Forwarded client IP headers must only be trusted when supplied by a correctly configured trusted proxy.

## API foundation

- `GET /api/auth/csrf` — issue the pre-login CSRF token.
- `POST /api/auth/login` — JSON `{ "username": "...", "password": "..." }`, with `X-CSRFToken` from the CSRF endpoint.
- `GET /api/auth/session` — report whether the opaque server-side admin session is valid. This endpoint does not delete or otherwise mutate stale rows.
- `POST /api/auth/logout` — revoke the current database session; requires the authenticated session's CSRF token.
- `GET /api/admin/ping` — example admin-only endpoint, returns 401 without a valid active admin session.

All matched `/api/` write requests have centralized CSRF validation, separate from authorization; this also covers future API blueprints. Every route in the `/api/admin/` namespace is centrally checked for an existing, unexpired session whose admin is active and whose session version is current; protected route handlers can also use the reusable `@admin_required` guard. No registration endpoint is provided.

Account lifecycle operations are kept in `app/accounts.py`. Use `set_admin_active()` when deactivating/reactivating an admin, `change_admin_password()` for password changes, or `revoke_admin_sessions()` for explicit revocation, and commit the account update and revocation in one transaction. These operations advance the session version and delete all session records, so old cookies cannot become valid again after reactivation. There are no account-management HTTP endpoints in this phase.

## Timeline milestone API (Phase 2)

The content API is isolated to Timeline milestones. The authenticated Timeline dashboard and public published-milestone read are connected. Public rendering merges published API items with read-only IndexedDB records; it does not modify or delete local rows. No demo/historical milestones are seeded automatically while the public API is healthy. Browser data is imported only through the explicit administrator review flow below. New milestones are drafts by default (`isPublished: false`); public API reads include published milestones only. Responses never expose admin/session internals.

| Method and path | Access | Contract |
| --- | --- | --- |
| `GET /api/timeline/milestones` | Public | `{ "milestones": [...] }`, published items only. Imported items also include their stable `sourceId` so the public adapter can suppress the still-preserved local display copy. |
| `GET /api/admin/timeline/milestones` | Active Timeline admin | `{ "milestones": [...] }`, including drafts. |
| `POST /api/admin/timeline/milestones` | Active admin + CSRF | Create a draft by default; returns `{ "milestone": {...} }` with status 201. The ID is generated server-side and new content is appended to the ordering. |
| `PATCH /api/admin/timeline/milestones/<id>` | Active admin + CSRF | Partial update of writable content/publication fields; returns `{ "milestone": {...} }`. IDs and ordering cannot be patched here. |
| `DELETE /api/admin/timeline/milestones/<id>` | Active admin + CSRF | Delete one milestone; returns `{ "deleted": true }`. |
| `POST /api/admin/timeline/milestones/reorder` | Active admin + CSRF | `{ "ids": ["<id>", ...] }`; list every existing milestone exactly once, including drafts. Returns the canonical ordered IDs. The operation is transactional. |

Create requires `title`, `category`, `date`, `summary`, and `description`. Optional writable fields are `time`, `location`, `images`, `isDemo`, and `isPublished`. PATCH accepts any non-empty subset of those fields and required fields. `sortOrder`, `createdAt`, `updatedAt`, and `id` are response-only. Milestone IDs are UUIDs. Ordering is stable by `sortOrder`, then date, time, and ID as deterministic tie-breakers. The reorder endpoint assigns zero-based sort positions and rejects malformed, duplicate, missing, or extra IDs before updating any row.

Server validation matches the existing Timeline editor: title up to 90 characters; category exactly one of `Events`, `Workshops`, `Achievements`, `Projects`, or `Community`; a real `YYYY-MM-DD` date; optional 24-hour `HH:MM` time; location up to 100 characters; summary up to 180; description up to 6000; and at most 8 photos. Unknown fields are rejected. Create returns 201; malformed content/reorder returns 400 (`invalid_milestone` and field errors); missing/invalid IDs return 404; unauthenticated or stale admin sessions return 401; and CSRF failures return 400. GET routes do not mutate content or auth records.

The browser editor stores photos as IndexedDB Blob objects (`{ blob, name, type }`). Timeline image uploads are handled separately from milestone JSON; JSON contains only `{ "url": "/api/timeline/images/<uuid>", "name": "photo.webp", "type": "image/webp" }` references. External same-origin paths and HTTPS references remain supported subject to the milestone validator. SVG, `file:`, `data:`, `blob:`, protocol-relative paths, traversal and credential-bearing URLs are rejected.

### Timeline image storage (Phase 3.1)

- `POST /api/admin/timeline/images` accepts one multipart `file`, requires an active Timeline admin session and CSRF token, and returns an opaque image reference. The server verifies decoded JPEG, PNG, WebP, GIF or AVIF content, not just the client MIME/extension. Files are limited to 10 MiB each, dimensions to 8,000 pixels per side and 32 million pixels, with an 8-image / 40 MiB milestone limit enforced when references are saved.
- `GET /api/timeline/images/<uuid>` serves a managed image only to an authenticated Timeline admin or when a published milestone references it. Draft/unlinked images return 404 to public visitors. The storage directory is outside the repository (`TIMELINE_UPLOAD_DIR`, defaulting to the user's application-data `grid-timeline/images` directory), created with private permissions. Names are random and files are not exposed as a static directory.
- Deleting or unpublishing milestones does not delete image files. This intentionally avoids destroying shared/reused photos; orphan cleanup needs a separately designed retention process.
- `POST /api/admin/timeline/imports` accepts a `milestone` multipart JSON part and repeated `photos` parts. It preserves the supplied local fields and permitted URL references, stores Blob photos as separate managed images, creates the server ID/timestamps, forces the imported record to draft, and uses a unique `sourceId` for retry-safe idempotency. The browser UI requires an authenticated administrator to review and select local records first. It reads IndexedDB with a readonly transaction and never deletes the source record or Blob.
- Local disk is for development only. Production requires durable shared object storage or a persistent shared volume accessible to every application worker, plus backup, retention, and deployment-specific access controls. Ephemeral single-worker disk is not production-ready. No provider or credentials are configured here.

The public React Timeline displays published API data together with local IndexedDB records until the existing browser records have been reviewed and an approved import/cutover is completed. Imported duplicates are omitted from display only when the public API returns their stable `sourceId`; the local source row and photo remain untouched. The importer does not run automatically. API unavailability falls back to local content, with demo seeding only through the existing fallback behavior when the local store is empty. No local record or photo is overwritten or deleted.

The admin list and all writes use both the app-wide namespace/session checks and the reusable `@admin_required` guard. CSRF validation remains independent and applies to every API mutation. Public routes are read-only; no public registration or individual content-write route exists outside the protected namespace. JSON request bodies are capped at 32 KiB. The API does not expose page configuration; that remains localStorage until a separately scoped decision.

## Migrations

The checked-in migrations create Timeline-local admin/session tables and the milestone table. Migration `0002_admin_session_revocation` adds a version to admins and sessions; existing session rows start at version zero. Migration `0003_timeline_milestones` creates the content table, category/order constraints and public ordering index without inserting sample events. Apply pending migrations with `flask --app app:create_app db upgrade`. After changing a model, generate a migration with `flask --app app:create_app db migrate -m "describe the change"`, inspect the generated migration, and apply it with `db upgrade`.

## Tests

From this `backend/` directory, with dependencies installed:

```bash
python -m unittest discover -s tests -v
```

These tests cover rejected and oversized passwords, dummy verification for unknown users, unauthenticated and authenticated access, expired/inactive/revoked sessions, deactivation/reactivation and password-change revocation, invalid login/write CSRF, GET read-only behavior, missing public registration, password hashing and maximums, production cookie/limiter configuration, per-account and per-IP rate limits, SQLite file permissions, logout invalidation and interactive admin creation. Milestone API tests cover public published-only reads, denied public writes, authenticated CRUD, expiry/inactive/revoked sessions, CSRF, safe IDs, field and image-reference validation, deterministic/atomic reordering, and read-only GETs. The main test apps use in-memory SQLite and in-memory rate-limit storage. The file-permission test uses only temporary directories/databases and verifies existing modes are preserved; no test touches the developer database.
