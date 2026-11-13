# Existing-data migration and rollback

## Safety boundary

The migration utilities never change the source SQLite database. `db:backup` opens it read-only, creates a separate SQLite online backup outside the Timeline package (keep it outside the repository for additional protection), marks it with a SHA-256 sidecar, and validates schema revision 0005. Migration commands require that marker and read the backup in read-only mode. Never test against the original file or a live PostgreSQL destination. Stop the Flask writer before the final backup.

No owner password is required or read. The admin hash and session rows are copied as opaque data. Migration verification checks deterministic row digests for the complete tables and compares image bytes to metadata hashes. Admin login and shared session behavior still require normal post-migration verification with the owner in a controlled environment.

## Rehearse existing local data safely

When the development database and image folder are available locally, this command creates a mode-protected temporary backup/copy, migrates only into pg-mem and an in-memory object adapter, reports aggregate counts and hashes, then removes the temporary copy:

```sh
TIMELINE_REHEARSE_EXISTING_DATA=YES \
TIMELINE_REHEARSE_SOURCE_SQLITE=/absolute/path/to/timeline-admin.sqlite3 \
TIMELINE_REHEARSE_SOURCE_IMAGES=/absolute/path/to/grid-timeline-images \
npm run rehearse:existing-data
```

It is a local consistency rehearsal, **not** PostgreSQL or Blob verification. It accepts only ordinary image files with the existing 32-hex `.img` keys. It never writes the source database or upload directory and does not print row values or image bytes.

## Production migration steps

1. Confirm approvals and maintenance window. Stop Flask and any process that can write to the source SQLite DB. Preserve the original DB and image directory without changes.
2. Create a new protected SQLite backup using `npm run db:backup`; set `TIMELINE_BACKUP_SOURCE_SQLITE_URL` to the source and `TIMELINE_BACKUP_OUTPUT` to a new outside-repo path. The output and marker are mode 0600. Open/verify the backup and preserve a second offline copy before proceeding.
3. Copy the image folder to a separate protected image backup, preserving file names/bytes. Do not upload local images to a public Blob store.
4. Provision a **new empty** managed PostgreSQL database and apply `migrations/postgresql/0005_timeline_schema.sql` using the provider's secure SQL console/CLI. Use a TLS-verified connection URL (`sslmode=verify-full`) for application and migration connections. Do not point at a nonempty production database.
5. Set the source backup marker/path and a disposable destination URL, then run `npm run migrate:sqlite-to-postgres`. The migration copies admins/hash/session state, milestones/publication/order/timestamps, image metadata and settings transactionally; it preserves IDs and compares normalized per-table SHA-256 digests. Exact retries report `already-migrated`; a different nonempty target is rejected.
6. Point `TIMELINE_DATABASE_URL` at a **separate disposable** PostgreSQL target containing the migrated metadata. Set `TIMELINE_SQLITE_BACKUP`, `TIMELINE_IMAGE_BACKUP_DIR`, `TIMELINE_SQLITE_BACKUP_CONFIRMED=yes`, and private Blob credentials, then run `npm run migrate:images-to-private-blob`. This is repeat-safe: existing matching bytes are skipped; different bytes are never overwritten. It checks each source file's actual size/hash, destination metadata, and private Blob read-back size/hash.
7. Require every `timeline_images` row to have a verified object before declaring image migration complete. Test private/draft denial, admin reads, published reads, browser image rendering, admin login, CRUD, ordering, settings and logout on the disposable target.
8. Only after real PostgreSQL/Blob and Vercel Preview tests pass should the team lead schedule a cutover. Do not remove Flask before the production route is deliberately switched and rollback is ready.

Actual production database/image migration has **not** been run. The local owner-data rehearsal passed against pg-mem and temporary in-memory storage only.

## Retry and rollback

- Metadata migration is one PostgreSQL transaction. If it fails, it rolls back the destination transaction; inspect only the sanitized failure and use a newly provisioned disposable target for another rehearsal.
- Image migration leaves source and target untouched on mismatch. On partial upload failure, rerun against the same verified backup and target; matching existing objects are hash-checked and skipped.
- No migration command deletes Blob objects. Private orphans can remain after a failed finalization; reconcile them with the metadata ledger before any manual cleanup.
- For rollback before Express writes, stop Express and return the routing to the unchanged Flask service and original database/image directory.
- If Express has accepted writes, preserve both datasets and reconcile before switching back. Do not restore a backup over a newer database or delete sessions/images to force equality.
- Existing Flask pre-login CSRF signatures are not interchangeable with Express bootstrap CSRF. Require a fresh login/bootstrap after switching the frontend. Do not weaken CSRF to preserve a browser session.
