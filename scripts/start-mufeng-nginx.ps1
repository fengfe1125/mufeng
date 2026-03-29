$workspace = Split-Path -Parent $PSScriptRoot
$asciiAlias = if ($env:MUFENG_ASCII_ALIAS) {
  $env:MUFENG_ASCII_ALIAS
} else {
  Join-Path $workspace 'ascii'
}

if (-not (Test-Path $asciiAlias)) {
  New-Item -ItemType Directory -Force -Path $asciiAlias | Out-Null
}

$nginxCmd = if ($env:MUFENG_NGINX) {
  $env:MUFENG_NGINX
} else {
  $found = Get-Command nginx -ErrorAction SilentlyContinue
  if (-not $found) { throw 'nginx not found on PATH. Set MUFENG_NGINX if needed.' }
  $found.Path
}

$nginxRoot = Join-Path $asciiAlias '.runtime\nginx'
$confRoot = Join-Path $nginxRoot 'conf'
$logsRoot = Join-Path $nginxRoot 'logs'
$tempRoot = Join-Path $nginxRoot 'temp'
New-Item -ItemType Directory -Force -Path $confRoot | Out-Null
New-Item -ItemType Directory -Force -Path $logsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

Copy-Item -Force (Join-Path $workspace 'deploy\nginx-mufeng.conf') (Join-Path $confRoot 'mufeng-nginx.conf')
Copy-Item -Force (Join-Path $workspace 'deploy\nginx-mime.types') (Join-Path $confRoot 'mime.types')

Start-Process -FilePath $nginxCmd -ArgumentList @('-p', $nginxRoot, '-c', 'conf/mufeng-nginx.conf') -WindowStyle Hidden | Out-Null
