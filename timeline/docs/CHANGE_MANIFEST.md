# Timeline change manifest

## Canonical package

`timeline/` now owns the complete independently runnable Timeline frontend and Express API: React/Vite source, API client, shared auth/business routes, independent SQLite and PostgreSQL adapters, SQL schemas, protected SQLite backup and data migration tools, private image adapters and byte migration, shared rate-limit adapter, tests, launcher, Vercel entry/configuration, environment template and operator/integration documentation.

The React source was copied and verified into this package before the old `react-pilot/` React/Vite and `node-backend/` paths were relocated out of the repository. A source-preservation snapshot remains outside the repository. The retained Flask implementation in `react-pilot/backend/` remains the rollback and parity reference.

## Repository integration paths

- `start-grid-timeline.command`: compatibility launcher forwarding to `timeline/start.command`. The package launcher checks ports, supports `TIMELINE_PORT`/`TIMELINE_VITE_PORT`, and stops only child processes it started.
- `react-pilot/README.md`: points contributors at the canonical package and retained Flask reference.
- `react-pilot/INTEGRATION.md`: points to `timeline/docs/INTEGRATION.md`.
- `react-pilot/backend/README.md`: distinguishes Flask reference use from canonical Timeline development and describes the isolated parity harness.

The shared root `style.css`, Home, About Us, Core Team, FAQ, Contact, shared nav, and root Vercel configuration were not modified. No integration route or navigation link was added to the parent site; the integration guide provides the concrete same-origin proxy and independent-deployment options for the lead.

## Not part of a delivery change

The active development branch also contains preserved pre-existing work and handoff documents outside the package. No delivery branch was created because real PostgreSQL, private Blob/Upstash, Vercel Preview, browser and device gates remain open. A final PR must be prepared from the latest `origin/main` and include only the canonical `timeline/` package plus the reviewed Timeline path-relocation/launcher changes.
