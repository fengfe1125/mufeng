import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from './db.js';

function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function createUser(username, password) {
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
  const info = stmt.run(username, hash);
  return { id: info.lastInsertRowid, username };
}

function verifyUser(username, password) {
  const user = getUserByUsername(username);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.password_hash);
  return ok ? user : null;
}

function createSession(userId, deviceId) {
  const token = nanoid(32);
  db.prepare('INSERT INTO sessions (token, user_id, device_id) VALUES (?, ?, ?)')
    .run(token, userId, deviceId);
  return token;
}

function getSession(token) {
  return db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
}

function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function hasAnyUser() {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  return row.count > 0;
}

export {
  getUserByUsername,
  createUser,
  verifyUser,
  createSession,
  getSession,
  deleteSession,
  hasAnyUser
};
