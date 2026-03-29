const statusEl = document.getElementById('status');
const pendingList = document.getElementById('pending-list');
const trustedList = document.getElementById('trusted-list');
const keyInput = document.getElementById('admin-key');
const saveKeyBtn = document.getElementById('save-key');
const langBtn = document.getElementById('lang-btn');

const keyStorage = 'mufeng_admin_key';
const langKey = 'mufeng_lang';
const translations = {
  en: {
    admin_title: 'mufeng admin',
    admin_desc: 'Approve or revoke devices. Admin key required.',
    save_btn: 'Save',
    pending_title: 'Pending devices',
    trusted_title: 'Trusted devices',
    admin_key: 'Admin key',
    none: 'None',
    approve: 'Approve',
    revoke: 'Revoke',
    connected: 'Connected'
  },
  zh: {
    admin_title: 'mufeng 管理',
    admin_desc: '审批或撤销设备，需要管理员密钥。',
    save_btn: '保存',
    pending_title: '待审批设备',
    trusted_title: '已信任设备',
    admin_key: '管理员密钥',
    none: '暂无',
    approve: '批准',
    revoke: '撤销',
    connected: '已连接'
  }
};

function setStatus(text, ok = true) {
  statusEl.textContent = text;
  statusEl.className = ok ? 'status ok' : 'status error';
}

function getLang() {
  return sessionStorage.getItem(langKey) || 'zh';
}

function setLang(value) {
  sessionStorage.setItem(langKey, value);
}

function t(key) {
  const dict = translations[getLang()] || translations.zh;
  return dict[key] || key;
}

function applyLang() {
  const dict = translations[getLang()] || translations.zh;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.setAttribute('placeholder', dict[key]);
  });
  if (langBtn) langBtn.textContent = getLang() === 'zh' ? 'English' : '中文';
}

function getKey() {
  return sessionStorage.getItem(keyStorage) || '';
}

function setKey(value) {
  sessionStorage.setItem(keyStorage, value);
}

async function fetchJson(url, opts = {}) {
  const key = getKey();
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Mufeng-Admin-Key': key
    },
    ...opts
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function renderList(el, items, actions) {
  el.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = t('none');
    el.appendChild(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement('li');
    const info = document.createElement('div');
    info.className = 'info';
    info.textContent = `${item.device_name} | ${item.device_id} | ${item.last_ip || ''}`;
    li.appendChild(info);
    const btnRow = document.createElement('div');
    btnRow.className = 'actions';
    for (const action of actions) {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.addEventListener('click', () => action.onClick(item));
      btnRow.appendChild(btn);
    }
    li.appendChild(btnRow);
    el.appendChild(li);
  }
}

async function refresh() {
  try {
    const data = await fetchJson('/mufeng-api/admin/status');
    renderList(pendingList, data.pending_devices || [], [
      {
        label: t('approve'),
        onClick: async (item) => {
          await fetchJson('/mufeng-api/admin/approve', {
            method: 'POST',
            body: JSON.stringify({ device_id: item.device_id })
          });
          refresh();
        }
      }
    ]);
    renderList(trustedList, data.trusted_devices || [], [
      {
        label: t('revoke'),
        onClick: async (item) => {
          await fetchJson('/mufeng-api/admin/revoke', {
            method: 'POST',
            body: JSON.stringify({ device_id: item.device_id })
          });
          refresh();
        }
      }
    ]);
    setStatus(t('connected'));
  } catch (err) {
    setStatus(err.message, false);
  }
}

saveKeyBtn.addEventListener('click', () => {
  setKey(keyInput.value.trim());
  refresh();
});

keyInput.value = getKey();
applyLang();
if (langBtn) {
  langBtn.addEventListener('click', () => {
    const next = getLang() === 'zh' ? 'en' : 'zh';
    setLang(next);
    applyLang();
    refresh();
  });
}
refresh();
setInterval(refresh, 5000);
