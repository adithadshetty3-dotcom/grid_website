# Image storage boundary

Runtime storage is implemented in `backend/src/imageStorage.js` and selected by configuration. Local development uses private files outside the repository. Production uses Vercel private Blob; it does not depend on this directory or Vercel Function filesystem persistence.

This directory intentionally contains no uploaded data. Never add user photos, local databases, tokens, or production backups here.
