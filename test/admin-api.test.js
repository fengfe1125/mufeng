import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import test, { after } from 'node:test';

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mufeng-test-'));
process.env.MUFENG_DATA_DIR = tempDir;
process.env.MUFENG_UPSTREAM_URL = 'http://127.0.0.1:65535';

const [{ createApp }, { adminKey }, { db }] = await Promise.all([
  import('../server/index.js'),
  import('../server/admin.js'),
  import('../server/db.js')
]);

const server = createApp().listen(0);
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  db.close();
  await rm(tempDir, { recursive: true, force: true });
});

async function requestJson(urlPath, options = {}) {
  const response = await fetch(`${baseUrl}${urlPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

test('desktop helpers must call the /mufeng-api/admin routes', async () => {
  const legacy = await fetch(`${baseUrl}/api/admin/status`, {
    headers: { 'X-Mufeng-Admin-Key': adminKey }
  });
  assert.equal(legacy.status, 401);

  const current = await requestJson('/mufeng-api/admin/status', {
    headers: { 'X-Mufeng-Admin-Key': adminKey }
  });
  assert.equal(current.response.status, 200);
  assert.equal(current.body.ok, true);
  assert.deepEqual(current.body.pending_devices, []);
  assert.deepEqual(current.body.trusted_devices, []);
});

test('device approval flow moves devices between pending and trusted lists', async () => {
  const bootstrap = await requestJson('/mufeng-api/bootstrap', {
    method: 'POST',
    body: JSON.stringify({ username: 'root', password: 'secret' })
  });
  assert.equal(bootstrap.response.status, 200);

  const firstLogin = await requestJson('/mufeng-api/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'root',
      password: 'secret',
      device_id: 'phone-1',
      device_name: 'Pixel'
    })
  });
  assert.equal(firstLogin.response.status, 200);
  assert.equal(firstLogin.body.approved, false);

  const pendingStatus = await requestJson('/mufeng-api/admin/status', {
    headers: { 'X-Mufeng-Admin-Key': adminKey }
  });
  assert.equal(pendingStatus.body.pending_devices.length, 1);
  assert.equal(pendingStatus.body.pending_devices[0].device_id, 'phone-1');

  const approve = await requestJson('/mufeng-api/admin/approve', {
    method: 'POST',
    headers: { 'X-Mufeng-Admin-Key': adminKey },
    body: JSON.stringify({ device_id: 'phone-1' })
  });
  assert.equal(approve.response.status, 200);
  assert.equal(approve.body.ok, true);

  const approvedStatus = await requestJson('/mufeng-api/approval-status?device_id=phone-1');
  assert.equal(approvedStatus.response.status, 200);
  assert.equal(approvedStatus.body.approved, true);

  const secondLogin = await requestJson('/mufeng-api/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'root',
      password: 'secret',
      device_id: 'phone-1',
      device_name: 'Pixel'
    })
  });
  assert.equal(secondLogin.response.status, 200);
  assert.equal(secondLogin.body.approved, true);
  assert.match(secondLogin.response.headers.get('set-cookie') || '', /mufeng_session=/);

  const revoke = await requestJson('/mufeng-api/admin/revoke', {
    method: 'POST',
    headers: { 'X-Mufeng-Admin-Key': adminKey },
    body: JSON.stringify({ device_id: 'phone-1' })
  });
  assert.equal(revoke.response.status, 200);
  assert.equal(revoke.body.ok, true);

  const revokedStatus = await requestJson('/mufeng-api/approval-status?device_id=phone-1');
  assert.equal(revokedStatus.response.status, 200);
  assert.equal(revokedStatus.body.approved, false);
});
