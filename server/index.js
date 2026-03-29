import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbPath } from './db.js';
import {
  createUser,
  verifyUser,
  createSession,
  getSession,
  deleteSession,
  hasAnyUser
} from './auth.js';
import {
  isTrusted,
  upsertPending,
  approveDevice,
  revokeDevice,
  listPending,
  listTrusted
} from './device.js';
import { adminKey, keyPath, requireAdmin } from './admin.js';
import { upstreamUrl, buildProxy } from './proxy.js';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.set('trust proxy', true);
const port = Number(process.env.MUFENG_PORT || 3101);

app.use(express.json());
app.use(cookieParser());

const staticDir = path.join(__dirname, '..', 'public');
app.use('/static', express.static(staticDir, {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
}

function requireAuth(req, res, next) {
  const token = req.cookies.mufeng_session;
  if (!token) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const session = getSession(token);
  if (!session) return res.status(401).json({ ok: false, error: 'unauthorized' });
  req.session = session;
  return next();
}

const upstreamProxy = buildProxy();

app.get('/mufeng-api/health', (req, res) => {
  res.json({ ok: true, db: dbPath, upstream: upstreamUrl });
});

app.get('/mufeng-api/bootstrap/status', (req, res) => {
  res.json({ hasUser: hasAnyUser() });
});

app.post('/mufeng-api/bootstrap', (req, res) => {
  if (hasAnyUser()) return res.status(400).json({ ok: false, error: 'already_initialized' });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ ok: false, error: 'missing_fields' });
  const user = createUser(username, password);
  res.json({ ok: true, user: { id: user.id, username: user.username } });
});

app.post('/mufeng-api/login', (req, res) => {
  const { username, password, device_id, device_name } = req.body || {};
  if (!username || !password || !device_id) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }
  const user = verifyUser(username, password);
  if (!user) return res.status(401).json({ ok: false, error: 'invalid_credentials' });

  const ip = getClientIp(req);
  if (!isTrusted(device_id)) {
    upsertPending(device_id, device_name || 'Unknown device', ip);
    return res.json({ ok: true, approved: false });
  }

  const token = createSession(user.id, device_id);
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('mufeng_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isHttps
  });
  res.json({ ok: true, approved: true });
});

app.get('/mufeng-api/approval-status', (req, res) => {
  const deviceId = req.query.device_id;
  if (!deviceId) return res.status(400).json({ ok: false, error: 'missing_device_id' });
  res.json({ ok: true, approved: isTrusted(deviceId) });
});

app.post('/mufeng-api/logout', requireAuth, (req, res) => {
  deleteSession(req.cookies.mufeng_session);
  res.clearCookie('mufeng_session');
  res.json({ ok: true });
});

app.get('/mufeng-api/admin/status', requireAdmin, (req, res) => {
  res.json({
    ok: true,
    pending_devices: listPending(),
    trusted_devices: listTrusted(),
    upstream: upstreamUrl,
    admin_key_path: keyPath
  });
});

app.post('/mufeng-api/admin/approve-codex-devices', requireAdmin, (req, res) => {
  const configured = process.env.MUFENG_CODEX_APPROVE_SCRIPT;
  const defaultPath = path.resolve(process.cwd(), '..', 'mobileCodexHelper', 'scripts', 'approve-codex-devices.ps1');
  const scriptPath = configured ? path.resolve(configured) : defaultPath;

  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ ok: false, error: 'script_not_found', script: scriptPath });
  }

  const result = spawnSync('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scriptPath,
  ], { encoding: 'utf-8' });

  if (result.error) {
    return res.status(500).json({ ok: false, error: result.error.message, script: scriptPath });
  }

  if (result.status !== 0) {
    return res.status(500).json({
      ok: false,
      error: 'script_failed',
      code: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      script: scriptPath,
    });
  }

  return res.json({
    ok: true,
    stdout: result.stdout,
    stderr: result.stderr,
    script: scriptPath,
  });
});

app.post('/mufeng-api/admin/approve', requireAdmin, (req, res) => {
  const { device_id } = req.body || {};
  if (!device_id) return res.status(400).json({ ok: false, error: 'missing_device_id' });
  const ok = approveDevice(device_id);
  res.json({ ok });
});

app.post('/mufeng-api/admin/revoke', requireAdmin, (req, res) => {
  const { device_id } = req.body || {};
  if (!device_id) return res.status(400).json({ ok: false, error: 'missing_device_id' });
  revokeDevice(device_id);
  res.json({ ok: true });
});

app.get('/admin', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(staticDir, 'admin.html'));
});

app.get('/', (req, res) => {
  const token = req.cookies.mufeng_session;
  if (token && getSession(token)) {
    return upstreamProxy(req, res);
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.sendFile(path.join(staticDir, 'index.html'));
});

app.use((req, res, next) => {
  if (req.path.startsWith('/mufeng-api') || req.path.startsWith('/admin') || req.path.startsWith('/static')) {
    return next();
  }
  const token = req.cookies.mufeng_session;
  if (!token || !getSession(token)) {
    return res.status(401).send('Unauthorized');
  }
  return upstreamProxy(req, res, next);
});

app.listen(port, () => {
  console.log(`mufeng server listening on http://127.0.0.1:${port}`);
  console.log(`upstream target: ${upstreamUrl}`);
  console.log(`admin key: ${adminKey}`);
  console.log(`admin key path: ${keyPath}`);
});
