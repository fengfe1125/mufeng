$workspace = Split-Path -Parent $PSScriptRoot
$node = if ($env:MUFENG_NODE) { $env:MUFENG_NODE } else { (Get-Command node -ErrorAction Stop).Path }
$logDir = Join-Path $workspace 'tmp\logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stdoutLog = Join-Path $logDir 'mufeng.stdout.log'
$stderrLog = Join-Path $logDir 'mufeng.stderr.log'
Add-Content -Path $stdoutLog -Value ("`n==== START {0} ====`n" -f (Get-Date -Format s))
Add-Content -Path $stderrLog -Value ("`n==== START {0} ====`n" -f (Get-Date -Format s))

Set-Location $workspace
& $node 'server/index.js' 1>> $stdoutLog 2>> $stderrLog
