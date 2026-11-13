# Timeline verification report

Recorded from the canonical `timeline/` package on 12 November 2026 after the alternate-port launcher update. Commands were run from this directory. No production services were contacted.

| Test area | Result | Tests passed | Tests failed | Not tested / reason |
|---|---|---:|---:|---|
| Frontend | Pass | 120 | 0 | Browser-rendered component automation unavailable; existing frontend tests include source/design/API behavior tests |
| Backend | Pass | 19 | 0 | One additional parity case is explicitly skipped by default and passed separately; local SQLite and in-memory PostgreSQL emulator; see real PostgreSQL limitation |
| Authentication | Pass | Included above | 0 | Express HTTP tests cover login/session/CSRF/logout, authz, rate-limit behavior; actual existing admin login was manually confirmed on Flask by the owner |
| Flask parity | Pass | 1 | 0 | `npm run test:parity`; runs isolated Flask test app and Express API comparison |
| Existing-data migration rehearsal | Pass | 1 rehearsal | 0 | Actual local DB was opened read-only, backed up to protected temp storage and migrated into pg-mem/in-memory image adapter; 1 admin, 5 sessions, 6 milestones, 8 metadata rows/settings verified and 8/8 image bytes hash-verified; not real PostgreSQL/Blob |
| Image handling | Pass (local/emulated) | Included above | 0 | API upload validation/privacy and direct private Blob token/finalize/signed-read behavior tested with adapters; no live Blob credentials |
| Integration | Pass (local API) | Included above | 0 | React API client contracts and Express HTTP/database tests pass; no full browser runtime available |
| Responsive testing | Not tested in browser | 0 | 0 | Source/design assertions cover scoped breakpoints; no Playwright/browser executable available for viewport emulation |
| Accessibility | Partial source checks | Included in frontend | 0 | Keyboard and semantic design assertions exist; no axe/screen-reader/browser audit executed |
| Production build | Pass | 1 | 0 | `npm run build`, generated `public/`; Vercel Preview not deployed |
| Dependency audit | Pass | — | 0 | Final `npm audit --omit=dev` reached npm and reported 0 production vulnerabilities |
| Fresh isolated package copy | Pass | 139 | 0 | Source copied without external files/dependencies, installed with `npm ci --offline`; default test result 139 pass/1 explicit skip and production build passed |
| Real PostgreSQL | Not tested | 0 | 0 | No disposable PostgreSQL server/client or endpoint available; adapter behavior tested with pg-mem |
| Vercel Preview | Not tested | 0 | 0 | No Vercel credentials/CLI or cloud environment available |

## Commands

```sh
npm ci
npm test
npm run test:parity
npm run build
npm audit --omit=dev
```

Final canonical package run after the launcher update: `npm ci --offline` installed 178 packages; `npm test` — 140 tests, 139 passed, 0 failed, 1 explicitly skipped (optional Flask parity); `npm run test:parity` — 1 passed, 0 failed, 0 skipped; `npm run test:frontend` — 120 passed; `npm run build` — passed (39 modules); `npm audit --omit=dev` — 0 vulnerabilities. Together, default and explicit parity runs: 140 passed, 0 failed, 0 skipped. The isolated fresh package copy (not a Git worktree/clone) had previously completed clean install, test suite and build; its explicit parity command requires the retained Flask checkout. Local startup was reverified with a new disposable SQLite database on ports 5002/5174: frontend and proxied API returned HTTP 200 and Ctrl+C stopped both child processes. The backup CLI also created and schema-verified a protected backup from a disposable database without writing to its source. Node emitted its standard experimental SQLite warning.

During package verification, Vite 8 rejected the prior `--root` flag; both build and dev scripts now pass the frontend root positionally. Fresh-copy validation also found and fixed a path guard that assumed Timeline remained nested under the old repository layout. The launcher detects an existing listener on either child port and exits before starting processes, rather than creating overlapping servers.

## Manual device checklist for the GRID team

Run this after a Preview is available. This checklist is not a claim of physical-device testing in this workspace.

- [ ] iPhone Safari at 320–375 px and a typical 390–430 px viewport: no horizontal overflow, nav overlap, clipped cards or unreadable text.
- [ ] iPhone/iPad Safari: open a milestone and each image; confirm full aspect ratio, previous/next, swipe, close, page scroll lock and focus/scroll restoration.
- [ ] Android Chrome at small/large phone sizes: menus, touch controls, editor controls and image uploads work without hover.
- [ ] Tablet portrait and landscape: timeline columns/rail, admin dashboard and settings remain usable.
- [ ] Laptop and desktop: keyboard tab order, visible focus, Enter/Space activation, arrow-key photo navigation, Escape close, and dialog focus return.
- [ ] Admin session: sign in, create/edit a disposable draft, publish, verify public display, reorder, save starfield state, then logout and confirm protected pages reject access.
- [ ] With reduced motion enabled: ambient/star motion is suppressed or reduced and the setting remains readable/usable.
- [ ] Test one image and a gallery, plus a long milestone/editor form; confirm dialogs scroll independently and controls remain visible above the on-screen keyboard.
- [ ] Repeat with the parent GRID navigation/footer and the configured API proxy, including a page reload at the nested Timeline URL.
