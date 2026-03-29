import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { dataDir } from './db.js';

const keyPath = process.env.MUFENG_ADMIN_KEY_PATH
  ? path.resolve(process.env.MUFENG_ADMIN_KEY_PATH)
  : path.join(dataDir, 'admin.key');

function ensureAdminKey() {
  if (!fs.existsSync(keyPath)) {
    const key = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyPath, key, { encoding: 'utf8' });
    return key;
  }
  return fs.readFileSync(keyPath, 'utf8').trim();
}

const adminKey = ensureAdminKey();

function requireAdmin(req, res, next) {
  const headerKey = req.headers['x-mufeng-admin-key'];
  if (!headerKey || headerKey !== adminKey) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  return next();
}

export { adminKey, keyPath, requireAdmin };
