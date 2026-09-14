$ErrorActionPreference = 'Stop'
$submissionPath = Split-Path $PSScriptRoot -Parent
$pythonPath = Join-Path $submissionPath '.venv/Scripts/python.exe'
if (!(Test-Path $pythonPath)) { throw 'Run scripts/Setup.ps1 first.' }
$env:FRONTEND_URL = 'http://localhost:3002'
$env:GOOGLE_OAUTH_REDIRECT = 'http://localhost:8001/auth/google/callback'
Push-Location (Join-Path $submissionPath 'backend')
try { & $pythonPath -m uvicorn main:app --host 127.0.0.1 --port 8001 }
finally { Pop-Location }
