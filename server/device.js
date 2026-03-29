import { db } from './db.js';

function isTrusted(deviceId) {
  const row = db.prepare('SELECT device_id FROM trusted_devices WHERE device_id = ?').get(deviceId);
  return !!row;
}

function upsertPending(deviceId, deviceName, ip) {
  db.prepare(`
    INSERT INTO pending_devices (device_id, device_name, last_ip)
    VALUES (?, ?, ?)
    ON CONFLICT(device_id) DO UPDATE SET
      device_name = excluded.device_name,
      last_ip = excluded.last_ip,
      requested_at = CURRENT_TIMESTAMP
  `).run(deviceId, deviceName, ip || null);
}

function approveDevice(deviceId) {
  const pending = db.prepare('SELECT * FROM pending_devices WHERE device_id = ?').get(deviceId);
  if (!pending) return false;
  db.prepare(`
    INSERT INTO trusted_devices (device_id, device_name, last_ip)
    VALUES (?, ?, ?)
    ON CONFLICT(device_id) DO UPDATE SET
      device_name = excluded.device_name,
      last_ip = excluded.last_ip,
      approved_at = CURRENT_TIMESTAMP
  `).run(pending.device_id, pending.device_name, pending.last_ip);
  db.prepare('DELETE FROM pending_devices WHERE device_id = ?').run(deviceId);
  return true;
}

function revokeDevice(deviceId) {
  db.prepare('DELETE FROM trusted_devices WHERE device_id = ?').run(deviceId);
  db.prepare('DELETE FROM pending_devices WHERE device_id = ?').run(deviceId);
}

function listPending() {
  return db.prepare('SELECT * FROM pending_devices ORDER BY requested_at DESC').all();
}

function listTrusted() {
  return db.prepare('SELECT * FROM trusted_devices ORDER BY approved_at DESC').all();
}

export {
  isTrusted,
  upsertPending,
  approveDevice,
  revokeDevice,
  listPending,
  listTrusted
};
