$workspace = Split-Path -Parent $PSScriptRoot
$env:MUFENG_NGINX = 'C:\Users\Asuna\mobileCodexHelper\tmp\nginx-1.24.0\nginx.exe'

powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $workspace 'scripts\start-mufeng-stack.ps1')
