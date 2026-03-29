const qs = (sel) => document.querySelector(sel);
const langBtn = qs('#lang-btn');
const bootstrapCard = qs('#bootstrap-card');
const loginCard = qs('#login-card');
const pendingCard = qs('#pending-card');
const readyCard = qs('#ready-card');
const errorCard = qs('#error-card');
const errorText = qs('#error-text');

const deviceIdKey = 'mufeng_device_id';
const langKey = 'mufeng_lang';
const translations = {
  en: {
    bootstrap_title: 'mufeng setup',
    bootstrap_desc: 'Create the first local account.',
    bootstrap_btn: 'Create account',
    login_title: 'mufeng login',
    login_desc: 'Sign in to access the private panel.',
    login_btn: 'Sign in',
    login_hint: 'Device approval is required on first login.',
    pending_title: 'Waiting for approval',
    pending_desc: 'This device needs approval from the PC console.',
    pending_btn: 'Check again',
    ready_title: 'Access granted',
    ready_desc: 'Your device is approved. Open the private panel.',
    ready_open: 'Open panel',
    ready_logout: 'Logout',
    error_title: 'Something went wrong',
    error_btn: 'Back to login',
    username: 'Username',
    password: 'Password',
    device_name: 'Device name (optional)'
  },
  zh: {
    bootstrap_title: 'mufeng 初始化',
    bootstrap_desc: '创建第一个本地账号。',
    bootstrap_btn: '创建账号',
    login_title: 'mufeng 登录',
    login_desc: '登录以访问私有面板。',
    login_btn: '登录',
    login_hint: '首次登录需要电脑端审批。',
    pending_title: '等待审批',
    pending_desc: '该设备需要电脑端控制台批准。',
    pending_btn: '重新检查',
    ready_title: '已通过',
    ready_desc: '设备已获批准，现在可打开面板。',
    ready_open: '打开面板',
    ready_logout: '退出登录',
    error_title: '发生错误',
    error_btn: '返回登录',
    username: '用户名',
    password: '密码',
    device_name: '设备名称（可选）'
  }
};
function generateDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const rand = Math.random().toString(36).slice(2);
  return `mufeng-${Date.now().toString(36)}-${rand}`;
}

const deviceId = (() => {
  const existing = localStorage.getItem(deviceIdKey);
  if (existing) return existing;
  const generated = generateDeviceId();
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

function getLang() {
  return localStorage.getItem(langKey) || 'zh';
}

function setLang(lang) {
  localStorage.setItem(langKey, lang);
}

function applyLang(lang) {
  const dict = translations[lang] || translations.zh;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.setAttribute('placeholder', dict[key]);
  });
  if (langBtn) langBtn.textContent = lang === 'zh' ? 'English' : '中文';
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
  const data = await fetchJson('/mufeng-api/bootstrap/status');
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
    await fetchJson('/mufeng-api/bootstrap', {
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
    const data = await fetchJson('/mufeng-api/login', {
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
    const data = await fetchJson(`/mufeng-api/approval-status?device_id=${encodeURIComponent(deviceId)}`);
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
    await fetchJson('/mufeng-api/logout', { method: 'POST' });
    show(loginCard);
  } catch (err) {
    showError(err.message);
  }
});

checkBootstrap();

if (langBtn) {
  const initial = getLang();
  applyLang(initial);
  langBtn.addEventListener('click', () => {
    const next = getLang() === 'zh' ? 'en' : 'zh';
    setLang(next);
    applyLang(next);
  });
} else {
  applyLang(getLang());
}
