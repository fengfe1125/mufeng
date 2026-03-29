const statusEl = document.getElementById('status');
const pendingList = document.getElementById('pending-list');
const trustedList = document.getElementById('trusted-list');
const keyInput = document.getElementById('admin-key');
const saveKeyBtn = document.getElementById('save-key');

const keyStorage = 'mufeng_admin_key';

function setStatus(text, ok = true) {
  statusEl.textContent = text;
  statusEl.className = ok ? 'status ok' : 'status error';
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
    li.textContent = 'None';
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
    const data = await fetchJson('/api/admin/status');
    renderList(pendingList, data.pending_devices || [], [
      {
        label: 'Approve',
        onClick: async (item) => {
          await fetchJson('/api/admin/approve', {
            method: 'POST',
            body: JSON.stringify({ device_id: item.device_id })
          });
          refresh();
        }
      }
    ]);
    renderList(trustedList, data.trusted_devices || [], [
      {
        label: 'Revoke',
        onClick: async (item) => {
          await fetchJson('/api/admin/revoke', {
            method: 'POST',
            body: JSON.stringify({ device_id: item.device_id })
          });
          refresh();
        }
      }
    ]);
    setStatus('Connected');
  } catch (err) {
    setStatus(err.message, false);
  }
}

saveKeyBtn.addEventListener('click', () => {
  setKey(keyInput.value.trim());
  refresh();
});

keyInput.value = getKey();
refresh();
setInterval(refresh, 5000);
