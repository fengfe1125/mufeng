import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.MUFENG_DATA_DIR
  ? path.resolve(process.env.MUFENG_DATA_DIR)
  : path.resolve(path.join(here, '..', 'data'));

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.MUFENG_DB_PATH
  ? path.resolve(process.env.MUFENG_DB_PATH)
  : path.join(dataDir, 'mufeng.db');

const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS trusted_devices (
  device_id TEXT PRIMARY KEY,
  device_name TEXT NOT NULL,
  last_ip TEXT,
  approved_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS pending_devices (
  device_id TEXT PRIMARY KEY,
  device_name TEXT NOT NULL,
  last_ip TEXT,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

export { db, dataDir, dbPath };
