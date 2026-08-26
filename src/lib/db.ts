import Database from "better-sqlite3";
import path from "node:path";

// A single file-based SQLite database. Zero setup: cloning the repo and running
// `npm run dev` creates data.db and the schema on first boot, no external
// database service required. In production you'd point DB_PATH at a mounted
// volume so the file survives restarts/deploys.
const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data.db");

declare global {
  var __analyticsDb: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      public_key TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      type TEXT NOT NULL, -- 'pageview' | 'conversion'
      name TEXT,          -- conversion name, e.g. 'signup', null for pageviews
      url TEXT NOT NULL,
      referrer TEXT,
      device TEXT,
      browser TEXT,
      os TEXT,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_site_created ON events(site_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_sites_user ON sites(user_id);
    CREATE INDEX IF NOT EXISTS idx_sites_public_key ON sites(public_key);
  `);
}

export function getDb(): Database.Database {
  if (!global.__analyticsDb) {
    global.__analyticsDb = createDb();
  }
  return global.__analyticsDb;
}
