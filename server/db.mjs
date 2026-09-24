import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

/** Calea bazei de date. În producție este setată din unitatea systemd. */
export const DB_PATH = process.env.DANEN_DB ?? '/var/lib/danen/messages.db'

mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new DatabaseSync(DB_PATH)

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at    TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user'
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at   TEXT NOT NULL,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL,
    organisation TEXT NOT NULL DEFAULT '',
    topic        TEXT NOT NULL DEFAULT '',
    message      TEXT NOT NULL,
    read_at      TEXT,
    status       TEXT NOT NULL DEFAULT 'primit',
    user_id      INTEGER REFERENCES users (id) ON DELETE SET NULL
  )
`)

/** Migrări pentru bazele create înainte de introducerea conturilor. */
const columns = (table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
for (const [column, definition] of [
  ['status', "TEXT NOT NULL DEFAULT 'primit'"],
  ['user_id', 'INTEGER REFERENCES users (id) ON DELETE SET NULL'],
]) {
  if (!columns('messages').includes(column)) {
    db.exec(`ALTER TABLE messages ADD COLUMN ${column} ${definition}`)
  }
}

if (!columns('users').includes('role')) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")
}

// Sesiunile au acum două feluri (admin / cont de client); tabelul vechi se reface.
if (columns('sessions').length && !columns('sessions').includes('kind')) {
  db.exec('DROP TABLE sessions')
}

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    kind       TEXT NOT NULL,
    user_id    INTEGER REFERENCES users (id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )
`)

db.exec('CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC)')
db.exec('CREATE INDEX IF NOT EXISTS idx_messages_user ON messages (user_id)')

export const STATUSES = ['primit', 'în lucru', 'ofertat', 'închis']

const q = {
  insertMessage: db.prepare(`
    INSERT INTO messages (created_at, name, email, organisation, topic, message, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  listMessages: db.prepare(`
    SELECT m.*, u.email AS owner_email
    FROM messages m LEFT JOIN users u ON u.id = m.user_id
    ORDER BY m.created_at DESC LIMIT ?
  `),
  listForUser: db.prepare(`
    SELECT id, created_at, topic, message, status
    FROM messages WHERE user_id = ? ORDER BY created_at DESC
  `),
  markRead: db.prepare('UPDATE messages SET read_at = ? WHERE id = ?'),
  setStatus: db.prepare('UPDATE messages SET status = ? WHERE id = ?'),
  removeMessage: db.prepare('DELETE FROM messages WHERE id = ?'),
  insertUser: db.prepare(
    'INSERT INTO users (created_at, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
  ),
  updateCredentials: db.prepare(
    'UPDATE users SET password_hash = ?, name = ?, role = ? WHERE id = ?',
  ),
  countAdmins: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'"),
  userByEmail: db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE'),
  userById: db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?'),
  insertSession: db.prepare(
    'INSERT INTO sessions (token, kind, user_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
  ),
  session: db.prepare(
    "SELECT kind, user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')",
  ),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
  deleteUserSessions: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
  pruneSessions: db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')"),
}

export const messages = {
  add: (m, userId = null) =>
    q.insertMessage.run(
      new Date().toISOString(),
      m.name,
      m.email,
      m.organisation ?? '',
      m.topic ?? '',
      m.message,
      userId,
    ),
  list: (limit = 500) => q.listMessages.all(limit),
  listForUser: (userId) => q.listForUser.all(userId),
  markRead: (id) => q.markRead.run(new Date().toISOString(), id),
  setStatus: (id, status) => q.setStatus.run(status, id),
  remove: (id) => q.removeMessage.run(id),
}

export const users = {
  /** Rolul nu vine niciodată din formular: înregistrarea publică creează doar 'user'. */
  create: (email, name, passwordHash, role = 'user') =>
    q.insertUser.run(new Date().toISOString(), email, name, passwordHash, role),
  update: (id, { passwordHash, name, role }) =>
    q.updateCredentials.run(passwordHash, name, role, id),
  byEmail: (email) => q.userByEmail.get(email),
  byId: (id) => q.userById.get(id),
  adminCount: () => q.countAdmins.get().n,
}

export const sessions = {
  create(token, { kind, userId = null, hours = 12 }) {
    const now = new Date()
    q.insertSession.run(
      token,
      kind,
      userId,
      now.toISOString(),
      new Date(now.getTime() + hours * 3600_000).toISOString(),
    )
  },
  get: (token) => (token ? q.session.get(token) : undefined),
  destroy: (token) => q.deleteSession.run(token),
  /** Toate sesiunile unui cont — folosită la schimbarea parolei. */
  destroyForUser: (userId) => q.deleteUserSessions.run(userId),
  prune: () => q.pruneSessions.run(),
}
