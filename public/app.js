const qs = (sel) => document.querySelector(sel);
const bootstrapCard = qs('#bootstrap-card');
const loginCard = qs('#login-card');
const pendingCard = qs('#pending-card');
const readyCard = qs('#ready-card');
const errorCard = qs('#error-card');
const errorText = qs('#error-text');

const deviceIdKey = 'mufeng_device_id';
const deviceId = (() => {
  const existing = localStorage.getItem(deviceIdKey);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  localStorage.setItem(deviceIdKey, generated);
  return generated;
})();

function show(card) {
  [bootstrapCard, loginCard, pendingCard, readyCard, errorCard].forEach((c) => {
    c.hidden = c !== card;
  });
}

function showError(message) {
  errorText.textContent = message;
  show(errorCard);
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function checkBootstrap() {
  const data = await fetchJson('/api/bootstrap/status');
  if (!data.hasUser) {
    show(bootstrapCard);
  } else {
    show(loginCard);
  }
}

qs('#bootstrap-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value.trim();
  try {
    await fetchJson('/api/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    show(loginCard);
  } catch (err) {
    showError(err.message);
  }
});

qs('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value.trim();
  const device_name = form.device_name.value.trim();
  try {
    const data = await fetchJson('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, device_id: deviceId, device_name })
    });
    if (data.approved) {
      show(readyCard);
    } else {
      show(pendingCard);
    }
  } catch (err) {
    showError(err.message);
  }
});

async function checkApproval() {
  try {
    const data = await fetchJson(`/api/approval-status?device_id=${encodeURIComponent(deviceId)}`);
    if (data.approved) {
      show(readyCard);
    }
  } catch (err) {
    showError(err.message);
  }
}

qs('#retry-btn').addEventListener('click', checkApproval);
qs('#reset-btn').addEventListener('click', () => show(loginCard));
qs('#logout-btn').addEventListener('click', async () => {
  try {
    await fetchJson('/api/logout', { method: 'POST' });
    show(loginCard);
  } catch (err) {
    showError(err.message);
  }
});

checkBootstrap();
