import json
import os
import threading
import time
import urllib.request
import urllib.error
import tkinter as tk
from tkinter import messagebox
from pathlib import Path

APP_TITLE = "mufeng control"
DEFAULT_URL = "http://127.0.0.1:3101"
REFRESH_SECONDS = 5
ADMIN_API_BASE = "/mufeng-api/admin"


def get_admin_key_path() -> Path:
    configured = os.environ.get("MUFENG_ADMIN_KEY_PATH")
    if configured:
        return Path(configured)
    project_root = Path(__file__).resolve().parent.parent
    return project_root / "data" / "admin.key"


def get_server_url() -> str:
    return os.environ.get("MUFENG_URL", DEFAULT_URL)


def http_json(method: str, url: str, data: dict | None, admin_key: str):
    payload = None
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=payload, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Mufeng-Admin-Key", admin_key)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        raise RuntimeError(f"HTTP {exc.code}: {body}")


def load_admin_key() -> str:
    key_path = get_admin_key_path()
    if not key_path.exists():
        raise RuntimeError(f"admin key not found: {key_path}")
    return key_path.read_text(encoding="utf-8").strip()


class MufengControl:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title(APP_TITLE)
        self.server_url = get_server_url()
        self.admin_key = load_admin_key()
        self.pending_devices = []

        header = tk.Frame(root)
        header.pack(fill=tk.X, padx=12, pady=12)
        tk.Label(header, text=APP_TITLE, font=("Segoe UI", 14, "bold")).pack(side=tk.LEFT)
        tk.Label(header, text=self.server_url, fg="#555").pack(side=tk.RIGHT)

        self.status_label = tk.Label(root, text="Checking status...", anchor="w")
        self.status_label.pack(fill=tk.X, padx=12)

        self.pending_list = tk.Listbox(root, height=8)
        self.pending_list.pack(fill=tk.BOTH, expand=True, padx=12, pady=8)

        buttons = tk.Frame(root)
        buttons.pack(fill=tk.X, padx=12, pady=8)
        tk.Button(buttons, text="Approve selected", command=self.approve_selected).pack(side=tk.LEFT)
        tk.Button(buttons, text="Revoke selected", command=self.revoke_selected).pack(side=tk.LEFT, padx=8)
        tk.Button(buttons, text="Refresh", command=self.refresh_once).pack(side=tk.RIGHT)

        self.running = True
        threading.Thread(target=self.auto_refresh, daemon=True).start()

    def auto_refresh(self):
        while self.running:
            self.refresh_once()
            time.sleep(REFRESH_SECONDS)

    def refresh_once(self):
        try:
            data = http_json("GET", f"{self.server_url}{ADMIN_API_BASE}/status", None, self.admin_key)
            pending = data.get("pending_devices", [])
            trusted = data.get("trusted_devices", [])
            self.pending_devices = pending
            self.pending_list.delete(0, tk.END)
            for item in pending:
                label = f"{item['device_name']} | {item['device_id']} | {item.get('last_ip','')}"
                self.pending_list.insert(tk.END, label)
            self.status_label.config(text=f"Pending: {len(pending)} | Trusted: {len(trusted)}")
        except Exception as exc:
            self.status_label.config(text=str(exc))

    def selected_device_id(self) -> str | None:
        idx = self.pending_list.curselection()
        if not idx:
            return None
        entry = self.pending_devices[idx[0]]
        return entry["device_id"]

    def approve_selected(self):
        device_id = self.selected_device_id()
        if not device_id:
            messagebox.showinfo(APP_TITLE, "Select a pending device first.")
            return
        try:
            http_json("POST", f"{self.server_url}{ADMIN_API_BASE}/approve", {"device_id": device_id}, self.admin_key)
            self.refresh_once()
        except Exception as exc:
            messagebox.showerror(APP_TITLE, str(exc))

    def revoke_selected(self):
        device_id = self.selected_device_id()
        if not device_id:
            messagebox.showinfo(APP_TITLE, "Select a pending device first.")
            return
        try:
            http_json("POST", f"{self.server_url}{ADMIN_API_BASE}/revoke", {"device_id": device_id}, self.admin_key)
            self.refresh_once()
        except Exception as exc:
            messagebox.showerror(APP_TITLE, str(exc))


if __name__ == "__main__":
    root = tk.Tk()
    app = MufengControl(root)
    root.protocol("WM_DELETE_WINDOW", root.destroy)
    root.mainloop()
