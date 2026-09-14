$ErrorActionPreference = 'Stop'
$submissionPath = Split-Path $PSScriptRoot -Parent
$runtimePath = $submissionPath
python -m venv (Join-Path $runtimePath '.venv')
if ($LASTEXITCODE -ne 0) { throw 'Python environment setup failed' }
& (Join-Path $runtimePath '.venv/Scripts/python.exe') -m pip install -r (Join-Path $submissionPath 'backend/requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed' }
Push-Location (Join-Path $submissionPath 'frontend')
try {
    npm.cmd ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed' }
} finally { Pop-Location }
Write-Host 'Setup complete. Run Start-Backend.ps1 and Start-Frontend.ps1 in separate terminals.'
