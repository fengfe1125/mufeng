# mufeng

EN: A phone-friendly, private access gate for local Codex UI with login, device approval, and reverse proxy.
ZH: 一个用于手机安全访问本地 Codex UI 的私有入口，包含登录、设备审批与反向代理。

---

## Purpose / 项目目的

EN:
Mufeng allows you to access the Codex UI running on your PC from a phone securely. It adds a login gate and device approval workflow, then proxies the upstream UI after authentication.

ZH:
Mufeng 用于让你在手机上安全访问电脑上的 Codex UI。它提供登录门禁与设备审批流程，通过认证后再反向代理上游 UI。

## How It Works / 原理

EN:
- Mufeng (Node/Express + SQLite) runs on `3101` and serves login/admin pages.
- After login + device approval, it proxies requests to upstream Codex UI (`3001`).
- Nginx (optional) fronts Mufeng on `8180` for stable access.
- Tailscale Serve exposes `http://127.0.0.1:8180` to your tailnet.

ZH:
- Mufeng（Node/Express + SQLite）运行在 `3101`，提供登录与管理页面。
- 登录并审批后，转发请求到上游 Codex UI（`3001`）。
- 可选用 Nginx 在 `8180` 作为前置入口。
- Tailscale Serve 将 `http://127.0.0.1:8180` 暴露给 tailnet。

## Requirements / 环境依赖

EN:
- Node.js 22 LTS
- Python 3.11+ (desktop control tool)
- Nginx for Windows (optional)
- A working local Codex UI on the PC

ZH:
- Node.js 22 LTS
- Python 3.11+（桌面控制工具）
- Windows 版 Nginx（可选）
- 电脑本地已可运行 Codex UI

## Quick Start / 快速开始

EN:
1. Install deps
```
cd C:\Users\Asuna\mufeng
npm install
```
2. Start mufeng (Node + nginx)
```
$env:MUFENG_NGINX='C:\Users\Asuna\mobileCodexHelper\tmp\nginx-1.24.0\nginx.exe';
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-mufeng-stack.ps1
```
3. Open in browser
```
http://127.0.0.1:3101
```

ZH:
1. 安装依赖
```
cd C:\Users\Asuna\mufeng
npm install
```
2. 启动 mufeng（Node + nginx）
```
$env:MUFENG_NGINX='C:\Users\Asuna\mobileCodexHelper\tmp\nginx-1.24.0\nginx.exe';
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-mufeng-stack.ps1
```
3. 浏览器打开
```
http://127.0.0.1:3101
```

## Admin / 管理

EN:
Admin page:
```
http://127.0.0.1:3101/admin
```
Admin key path:
```
C:\Users\Asuna\mufeng\data\admin.key
```

ZH:
管理页面：
```
http://127.0.0.1:3101/admin
```
管理员密钥路径：
```
C:\Users\Asuna\mufeng\data\admin.key
```

## Remote Access / 远程访问

EN:
If HTTPS fails due to time/NTP, use tailnet IP + HTTP:
```
http://100.97.203.6:8180
```

ZH:
如果 HTTPS 因时间/NTP 问题不可用，可用 tailnet IP + HTTP：
```
http://100.97.203.6:8180
```

## Docs / 文档

EN:
- Operations guide: `docs/OPERATIONS.md`
- Access info (local): `docs/ACCESS_INFO.txt`

ZH:
- 运维指南：`docs/OPERATIONS.md`
- 访问与密钥清单：`docs/ACCESS_INFO.txt`

## Troubleshooting / 常见问题

EN:
- HTTPS not working: system time not synced or UDP 123 blocked → use tailnet IP + HTTP.
- Codex login hangs then fails: request body consumed by global JSON parser → fixed in this repo.
- Approve Codex devices returns 404: approval script path not found → set `MUFENG_CODEX_APPROVE_SCRIPT` or keep the default repo layout.

ZH:
- HTTPS 无法访问：系统时间未同步或 UDP 123 被阻断 → 先用 tailnet IP + HTTP。
- Codex 登录卡住后失败：请求体被全局 JSON 解析吃掉 → 本仓库已修复。
- 批准 Codex 设备返回 404：审批脚本路径不存在 → 设置 `MUFENG_CODEX_APPROVE_SCRIPT` 或保持默认仓库目录结构。
