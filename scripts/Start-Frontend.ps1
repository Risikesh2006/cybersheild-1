$ErrorActionPreference = 'Stop'
$submissionPath = Split-Path $PSScriptRoot -Parent
$env:NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8001'
Push-Location (Join-Path $submissionPath 'frontend')
try { npm.cmd run dev -- --port 3002 }
finally { Pop-Location }
