import { newUuid, parseJson } from './validation.js';

const nowSql = () => new Date().toISOString().replace('T', ' ').replace('Z', '');
const json = (value) => JSON.stringify(value);

export function createTimelineRepository(database) {
  return {
    findAdminByUsername(username) {
      return database.prepare('SELECT id, username, password_hash, is_active, session_version FROM timeline_admins WHERE lower(username) = lower(?)').get(username);
    },
    createAdminSession({ tokenHash, csrfToken, adminId, sessionVersion, expiresAt }) {
      return database.prepare(`INSERT INTO timeline_admin_sessions
        (token_hash, csrf_token, admin_id, session_version, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`).run(tokenHash, csrfToken, adminId, sessionVersion, expiresAt, nowSql());
    },
    findAdminSession(tokenHash) {
      return database.prepare(`SELECT s.id AS session_id, s.csrf_token, s.admin_id, s.session_version,
        s.expires_at, a.username, a.is_active, a.session_version AS admin_session_version
        FROM timeline_admin_sessions s JOIN timeline_admins a ON a.id = s.admin_id WHERE s.token_hash = ?`).get(tokenHash);
    },
    deleteAdminSession(sessionId) { return database.prepare('DELETE FROM timeline_admin_sessions WHERE id = ?').run(sessionId); },
    listMilestones(publishedOnly = false) {
      const where = publishedOnly ? 'WHERE is_published = TRUE' : '';
      return database.prepare(`SELECT * FROM timeline_milestones ${where} ORDER BY sort_order, date, time, id`).all();
    },
    findMilestone(id) { return database.prepare('SELECT * FROM timeline_milestones WHERE id = ?').get(id); },
    async createMilestone(fields, { sourceId = null, id = newUuid() } = {}) {
      const max = (await database.prepare('SELECT MAX(sort_order) AS max_order FROM timeline_milestones').get()).max_order;
      const at = nowSql();
      await database.prepare(`INSERT INTO timeline_milestones
        (id, title, category, date, time, location, summary, description, source_id, images,
         is_demo, is_published, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, fields.title, fields.category, fields.date, fields.time, fields.location, fields.summary,
          fields.description, sourceId, json(fields.images), fields.is_demo, fields.is_published, max === null ? 0 : max + 1, at, at);
      return database.prepare('SELECT * FROM timeline_milestones WHERE id = ?').get(id);
    },
    async updateMilestone(id, fields) {
      await database.prepare(`UPDATE timeline_milestones SET title=?, category=?, date=?, time=?, location=?, summary=?, description=?,
        images=?, is_demo=?, is_published=?, updated_at=? WHERE id=?`)
        .run(fields.title, fields.category, fields.date, fields.time, fields.location, fields.summary,
          fields.description, json(fields.images), fields.is_demo, fields.is_published, nowSql(), id);
      return database.prepare('SELECT * FROM timeline_milestones WHERE id = ?').get(id);
    },
    async deleteMilestone(id) {
      if (!await database.prepare('SELECT id FROM timeline_milestones WHERE id = ?').get(id)) return false;
      await database.prepare('DELETE FROM timeline_milestones WHERE id = ?').run(id);
      return true;
    },
    async reorderMilestones(ids) {
      const existing = (await database.prepare('SELECT id FROM timeline_milestones').all()).map((row) => row.id);
      if (ids.length !== existing.length || ids.some((id) => !existing.includes(id))) return false;
      await database.transaction(async (tx) => {
        for (const [index, id] of ids.entries()) await tx.prepare('UPDATE timeline_milestones SET sort_order=? WHERE id=?').run(index, id);
      });
      return true;
    },
    findImageSize(id) { return database.prepare('SELECT size_bytes FROM timeline_images WHERE id = ?').get(id); },
    createImage(image) {
      return database.prepare(`INSERT INTO timeline_images
        (id, storage_key, original_name, mime_type, size_bytes, width, height, sha256, uploaded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(image.id, image.storageKey, image.originalName, image.mime, image.size, image.width, image.height, image.sha256, image.adminId, nowSql());
    },
    async deleteImage(id) { return database.prepare('DELETE FROM timeline_images WHERE id = ?').run(id); },
    findImage(id) { return database.prepare('SELECT * FROM timeline_images WHERE id = ?').get(id); },
    findImageByStorageKey(key) { return database.prepare('SELECT id FROM timeline_images WHERE storage_key = ?').get(key); },
    findMilestoneBySourceId(sourceId) { return database.prepare('SELECT * FROM timeline_milestones WHERE source_id = ?').get(sourceId); },
    async starfieldEnabled() { return Boolean((await database.prepare('SELECT starfield_enabled FROM timeline_site_settings WHERE id = ?').get('global'))?.starfield_enabled); },
    setStarfieldEnabled(enabled) {
      return database.prepare(`INSERT INTO timeline_site_settings (id, starfield_enabled, updated_at) VALUES ('global', ?, ?)
        ON CONFLICT(id) DO UPDATE SET starfield_enabled=excluded.starfield_enabled, updated_at=excluded.updated_at`).run(enabled, nowSql());
    },
    async isImagePublic(reference) {
      const milestones = await database.prepare('SELECT images FROM timeline_milestones WHERE is_published = TRUE').all();
      return milestones.some((row) => parseJson(row.images, []).some((item) => item.url === reference));
    },
  };
}
