# mufeng

A phone-friendly private access gate for local Codex sessions.

## What it does

- Provides a login + device approval gate in front of your local Codex UI.
- Approved devices can open the upstream panel through a private URL.
- Includes a small desktop control tool to approve/revoke devices.

## How it works

```text
Phone browser
   -> mufeng (login + device approval)
   -> /app proxy to upstream Codex UI
```

## Requirements

- Node.js 22 LTS
- Python 3.11+ (for the desktop control tool)
- nginx for Windows (optional, for reverse proxy)
- a working local Codex UI running on your PC

## Quick start

1. Install dependencies:

```powershell
cd C:\Users\Asuna\mufeng
npm install
```

2. Start mufeng (default port 3101):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-mufeng-stack.ps1
```

3. Open in a desktop browser:

```text
http://127.0.0.1:3101
```

4. Create the first account, then login.

5. Run the desktop control tool to approve devices:

```powershell
python desktop\mufeng_control.py
```

6. On the phone, open the same URL (or your private nginx/Tailscale address), login, and wait for approval.

## Phone access via Tailscale (recommended)

Make sure:

- the PC is logged into Tailscale
- the phone is logged into the same tailnet

Then run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\enable-mufeng-remote.ps1
```

After that, open the private HTTPS address shown by `tailscale serve status` on the phone.

## Web admin console

Open this URL in a desktop browser:

```text
http://127.0.0.1:3101/admin
```

Use the admin key from:

```text
C:\Users\Asuna\mufeng\data\admin.key
```

## Environment variables

- `MUFENG_UPSTREAM_URL` (default: `http://127.0.0.1:3001`)
- `MUFENG_PORT` (default: `3101`)
- `MUFENG_DATA_DIR` (default: `./data` in the project folder)
- `MUFENG_DB_PATH` (default: `./data/mufeng.db`)
- `MUFENG_ADMIN_KEY_PATH` (default: `./data/admin.key`)
- `MUFENG_TAILSCALE` (optional path to tailscale.exe)
- `MUFENG_NODE` (optional path to node.exe)
- `MUFENG_NGINX` (optional path to nginx.exe)
- `MUFENG_ASCII_ALIAS` (optional path for nginx runtime)

## Notes

- The upstream Codex UI must already be running locally.
- mufeng only gates access and does not replace the upstream service.
- Device approval requires the desktop tool to access the admin key.
