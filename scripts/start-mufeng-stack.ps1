$workspace = Split-Path -Parent $PSScriptRoot

Start-Process -FilePath 'powershell' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',(Join-Path $workspace 'scripts\start-mufeng.ps1')) -WindowStyle Hidden | Out-Null
Start-Sleep -Seconds 2
powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $workspace 'scripts\start-mufeng-nginx.ps1') | Out-Null
