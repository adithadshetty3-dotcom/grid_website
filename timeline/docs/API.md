# Timeline API

All endpoints are same-origin under `/api`. JSON uses UTF-8. The frontend uses cookie credentials and sends `X-CSRFToken` on writes.

| Method | Path | Access | Body / result |
|---|---|---|---|
| GET | `/api/auth/csrf` | Public | Returns `csrf_token` and sets the pre-login CSRF cookie. |
| POST | `/api/auth/login` | Pre-login CSRF | `{ "username": "…", "password": "…" }`; returns authenticated admin and session CSRF. |
| GET | `/api/auth/session` | Public/session | Returns authenticated status; authenticated result includes admin and session CSRF. |
| POST | `/api/auth/logout` | Admin + session CSRF | Revokes the current session and clears cookies. |
| GET | `/api/admin/ping` | Admin | Identity confirmation. |
| GET | `/api/timeline/milestones` | Public | Published milestones, ordered by saved order/date/time. |
| GET | `/api/admin/timeline/milestones` | Admin | All milestones, including drafts. |
| POST | `/api/admin/timeline/milestones` | Admin + CSRF | Create a milestone. `isPublished` controls public visibility. |
| PATCH | `/api/admin/timeline/milestones/:id` | Admin + CSRF | Update allowed milestone fields. |
| DELETE | `/api/admin/timeline/milestones/:id` | Admin + CSRF | Delete a milestone. |
| POST | `/api/admin/timeline/milestones/reorder` | Admin + CSRF | `{ "ids": [every milestone UUID in order] }`. |
| GET | `/api/timeline/settings` | Public | Shared starfield setting; false on a fresh schema. |
| PUT | `/api/admin/timeline/settings` | Admin + CSRF | `{ "starfieldEnabled": boolean }`. |
| POST | `/api/admin/timeline/images` | Admin + CSRF | Multipart local upload (`file`); development filesystem path. |
| POST | `/api/admin/timeline/images/upload-token` | Admin + CSRF | Vercel Blob client token; exact generated pathname and raster types only. |
| POST | `/api/admin/timeline/images/finalize` | Admin + CSRF | `{ "pathname": "…32 hex chars.img", "originalName": "…" }`; server reads and validates private bytes. |
| POST | `/api/admin/timeline/imports` | Admin + CSRF | Multipart local import; production client first uploads photos privately and then submits image references. Imports are drafts and idempotent by `sourceId`. |
| GET | `/api/timeline/images/:id` | Admin or published linkage | Admins can read private drafts; anonymous access only if the image belongs to a published milestone. Vercel returns a short-lived private signed GET redirect. |

Login/session authorization is enforced server-side. Session cookies are HttpOnly and Secure in production. Login requires a signed pre-login CSRF cookie/header pair; all other mutations require the authenticated session CSRF token. Admin UI visibility is not a security boundary.

Production rate limiting uses shared Upstash windows: 5 attempts per username+IP and 20 per IP per minute. Local tests use process-local limiting. Provider failure returns 503 rather than allowing unthrottled authentication.

Validation errors use HTTP 400, missing/invalid sessions 401, absent private/unpublished images 404, rate limits 429, upload-size errors 413/400, and unexpected failures use sanitized `internal_error` responses.
