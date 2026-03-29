$workspace = Split-Path -Parent $PSScriptRoot

$nodeCmd = if ($env:MUFENG_NODE) {
  Get-Item $env:MUFENG_NODE -ErrorAction Stop
} else {
  Get-Command node -ErrorAction SilentlyContinue
}

$nginxCmd = if ($env:MUFENG_NGINX) {
  Get-Item $env:MUFENG_NGINX -ErrorAction Stop
} else {
  Get-Command nginx -ErrorAction SilentlyContinue
}

$tailscalePath = if ($env:MUFENG_TAILSCALE) {
  $env:MUFENG_TAILSCALE
} else {
  'C:\Program Files\Tailscale\tailscale.exe'
}

[PSCustomObject]@{
  Workspace = $workspace
  Node = if ($nodeCmd) { $nodeCmd.Path } else { $null }
  Nginx = if ($nginxCmd) { $nginxCmd.Path } else { $null }
  Tailscale = if (Test-Path $tailscalePath) { $tailscalePath } else { $null }
  DataDir = if ($env:MUFENG_DATA_DIR) { $env:MUFENG_DATA_DIR } else { Join-Path $workspace 'data' }
  Upstream = if ($env:MUFENG_UPSTREAM_URL) { $env:MUFENG_UPSTREAM_URL } else { 'http://127.0.0.1:3001' }
  Port = if ($env:MUFENG_PORT) { $env:MUFENG_PORT } else { 3101 }
} | Format-List
