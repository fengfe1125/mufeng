$workspace = Split-Path -Parent $PSScriptRoot
$asciiAlias = if ($env:MUFENG_ASCII_ALIAS) { $env:MUFENG_ASCII_ALIAS } else { Join-Path $workspace 'ascii' }
$nginxRoot = Join-Path $asciiAlias '.runtime\nginx'

$nginxCmd = if ($env:MUFENG_NGINX) { $env:MUFENG_NGINX } else { (Get-Command nginx -ErrorAction SilentlyContinue).Path }
if ($nginxCmd -and (Test-Path $nginxRoot)) {
  & $nginxCmd -p $nginxRoot -c conf/mufeng-nginx.conf -s quit | Out-Null
}

$port = if ($env:MUFENG_PORT) { [int]$env:MUFENG_PORT } else { 3101 }
$procIds = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
foreach ($procId in $procIds) {
  if (-not $procId -or $procId -eq 0) { continue }
  try { Stop-Process -Id $procId -Force } catch {}
}
