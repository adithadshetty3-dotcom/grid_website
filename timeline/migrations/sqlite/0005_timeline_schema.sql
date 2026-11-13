PRAGMA foreign_keys = ON;
BEGIN IMMEDIATE;
CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL);
INSERT INTO alembic_version(version_num) VALUES ('0005_timeline_starfield_setting');
CREATE TABLE timeline_admins (
  id INTEGER PRIMARY KEY, username VARCHAR(80) NOT NULL UNIQUE, password_hash VARCHAR(256) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1, session_version INTEGER NOT NULL DEFAULT 0, created_at DATETIME NOT NULL
);
CREATE TABLE timeline_admin_sessions (
  id INTEGER PRIMARY KEY, token_hash VARCHAR(64) NOT NULL UNIQUE, csrf_token VARCHAR(64) NOT NULL,
  admin_id INTEGER NOT NULL REFERENCES timeline_admins(id) ON DELETE CASCADE,
  session_version INTEGER NOT NULL DEFAULT 0, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL
);
CREATE INDEX ix_timeline_admin_sessions_admin_id ON timeline_admin_sessions(admin_id);
CREATE INDEX ix_timeline_admin_sessions_expires_at ON timeline_admin_sessions(expires_at);
CREATE TABLE timeline_milestones (
  id VARCHAR(36) PRIMARY KEY, title VARCHAR(90) NOT NULL, category VARCHAR(24) NOT NULL,
  date VARCHAR(10) NOT NULL, time VARCHAR(5) NOT NULL DEFAULT '', location VARCHAR(100) NOT NULL DEFAULT '',
  summary VARCHAR(180) NOT NULL, description VARCHAR(6000) NOT NULL, source_id VARCHAR(255) UNIQUE,
  images JSON NOT NULL DEFAULT '[]', is_demo BOOLEAN NOT NULL DEFAULT 0, is_published BOOLEAN NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK(sort_order >= 0), created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  CHECK(category IN ('Events','Workshops','Achievements','Projects','Community'))
);
CREATE INDEX ix_timeline_milestones_public_order ON timeline_milestones(is_published, sort_order, date, id);
CREATE TABLE timeline_images (
  id VARCHAR(36) PRIMARY KEY, storage_key VARCHAR(40) NOT NULL UNIQUE, original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(32) NOT NULL, size_bytes INTEGER NOT NULL CHECK(size_bytes > 0),
  width INTEGER NOT NULL CHECK(width > 0), height INTEGER NOT NULL CHECK(height > 0), sha256 VARCHAR(64) NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES timeline_admins(id) ON DELETE RESTRICT, created_at DATETIME NOT NULL
);
CREATE INDEX ix_timeline_images_uploaded_by ON timeline_images(uploaded_by);
CREATE TABLE timeline_site_settings (
  id VARCHAR(24) PRIMARY KEY, starfield_enabled BOOLEAN NOT NULL DEFAULT 0, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMIT;
