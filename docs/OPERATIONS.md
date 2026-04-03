# Mufeng Operations Guide / 运维指南

## Purpose / 项目目的

EN:
Mufeng provides secure mobile access to the Codex desktop UI. It adds a login gate, device approval, and a management page, then reverse-proxies the upstream Codex UI so you can use it safely on a phone via Tailscale or LAN.

ZH:
Mufeng 用于在手机上安全访问电脑上的 Codex UI。它提供登录门禁、设备审批和管理页面，并反向代理上游 Codex UI，从而可通过 Tailscale 或局域网安全访问。

## How It Works / 原理

EN:
1) Mufeng (Node/Express + SQLite) runs on port 3101 and serves login/admin pages.
2) After login + device approval, Mufeng proxies all non-`/mufeng-api` requests to the upstream Codex UI on port 3001.
3) Nginx (port 8180) fronts Mufeng for stable access and Tailscale Serve.
4) Tailscale Serve exposes `http://127.0.0.1:8180` to your tailnet.

ZH:
1) Mufeng（Node/Express + SQLite）运行在 3101，提供登录与管理页面。
2) 登录并审批后，Mufeng 将非 `/mufeng-api` 的请求反向代理到上游 Codex UI（3001）。
3) Nginx（8180）作为前置入口，便于稳定访问和 Tailscale Serve。
4) Tailscale Serve 将 `http://127.0.0.1:8180` 暴露给 Tailnet。

## Quick Access / 常用入口

EN:
- Mufeng (local): `http://127.0.0.1:3101`
- Mufeng (nginx): `http://127.0.0.1:8180`
- Mufeng (Tailscale IP): `http://100.97.203.6:8180`
- Admin: `http://127.0.0.1:3101/admin`
- Codex UI (upstream): `http://127.0.0.1:3001`
- Tailscale URL (HTTPS): `https://feng.tail49d4d5.ts.net` (requires correct system time)

ZH:
- Mufeng 本地：`http://127.0.0.1:3101`
- Mufeng nginx：`http://127.0.0.1:8180`
- Mufeng Tailscale IP：`http://100.97.203.6:8180`
- 管理页：`http://127.0.0.1:3101/admin`
- 上游 Codex UI：`http://127.0.0.1:3001`
- Tailscale HTTPS：`https://feng.tail49d4d5.ts.net`（需要系统时间同步）

## Start/Stop / 启停

EN:
Start Mufeng stack (Node + nginx):
```
$env:MUFENG_NGINX='C:\Users\Asuna\mobileCodexHelper\tmp\nginx-1.24.0\nginx.exe';
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\Asuna\mufeng\scripts\start-mufeng-stack.ps1
```

Stop Mufeng stack:
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\Asuna\mufeng\scripts\stop-mufeng-stack.ps1
```

ZH:
启动 Mufeng（Node + nginx）：
```
$env:MUFENG_NGINX='C:\Users\Asuna\mobileCodexHelper\tmp\nginx-1.24.0\nginx.exe';
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\Asuna\mufeng\scripts\start-mufeng-stack.ps1
```

停止 Mufeng：
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\Asuna\mufeng\scripts\stop-mufeng-stack.ps1
```

## Device Approval / 设备审批

EN:
- Mufeng device approval: Admin page `http://127.0.0.1:3101/admin`.
- Codex UI device approval: Use the admin button **“Approve Codex Devices”** or run:
```
powershell -ExecutionPolicy Bypass -File C:\Users\Asuna\mobileCodexHelper\scripts\approve-codex-devices.ps1
```

ZH:
- Mufeng 设备审批：管理页 `http://127.0.0.1:3101/admin`。
- Codex UI 设备审批：管理页点击“批准 Codex 设备”，或运行：
```
powershell -ExecutionPolicy Bypass -File C:\Users\Asuna\mobileCodexHelper\scripts\approve-codex-devices.ps1
```

## Tailscale Serve / 远程访问

EN:
If HTTPS fails, use the tailnet IP + HTTP:
`http://100.97.203.6:8180`

Check serve status (admin required):
```
"C:\Program Files\Tailscale\tailscale.exe" serve status
```

ZH:
如果 HTTPS 失败，先用 Tailscale IP + HTTP：
`http://100.97.203.6:8180`

查看 Serve 状态（需管理员）：
```
"C:\Program Files\Tailscale\tailscale.exe" serve status
```

## Troubleshooting / 常见问题

EN:
1) **Tailscale HTTPS打不开**
- Cause: Windows time unsynced or NTP blocked.
- Fix: Enable time sync and ensure NTP/UDP 123 is allowed. If still failing, use HTTP via tailnet IP.

2) **Codex UI login failed after long wait**
- Cause: Request body got consumed by global `express.json()` in Mufeng, deviceId missing.
- Fix: JSON parser only on `/mufeng-api` (already fixed in this repo).

3) **Approve Codex Devices returns HTTP 404**
- Cause: Approval script path does not exist for the current checkout.
- Fix: Set `MUFENG_CODEX_APPROVE_SCRIPT` to the PowerShell script path, or keep the default repo layout next to `mobileCodexHelper`.

4) **Login loop / Unauthorized**
- Cause: Cookie path or proxy auth misconfig.
- Fix: Ensure cookie `path=/` and proxy only after session exists (already fixed).

ZH:
1) **Tailscale HTTPS打不开**
- 原因：系统时间未同步或 NTP 被阻断。
- 处理：开启时间同步并放行 NTP/UDP 123；临时用 Tailscale IP 的 HTTP 访问。

2) **Codex UI 登录卡住后失败**
- 原因：Mufeng 全局 `express.json()` 把请求体吃掉，导致 deviceId 丢失。
- 处理：仅在 `/mufeng-api` 上解析 JSON（本仓库已修复）。

3) **批准 Codex 设备返回 404**
- 原因：当前目录下找不到审批脚本路径。
- 处理：设置 `MUFENG_CODEX_APPROVE_SCRIPT` 指向 PowerShell 脚本，或保持与 `mobileCodexHelper` 相邻的默认仓库布局。

4) **登录循环 / Unauthorized**
- 原因：Cookie path 或代理鉴权配置问题。
- 处理：cookie `path=/`，且仅在会话存在时代理（已修复）。
