# AgentWork — One-Click Demo Launcher (Real Mode)
param([int]$Runs = 1, [switch]$SkipValidation)
$ErrorActionPreference = "Stop"
$RootDir = $PSScriptRoot
if ($null -eq $RootDir) { $RootDir = Get-Location }

Write-Host "🚀 Launching AgentWork Real-Mode Demo..." -ForegroundColor Cyan

# 1. Start Express Gateway
Write-Host "[1/4] Starting Express Gateway..." -ForegroundColor Yellow
$agentProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start:agents:express" -PassThru -NoNewWindow
Start-Sleep -Seconds 5

# 2. Wait for Health
Write-Host "[2/4] Waiting for agents..." -ForegroundColor Yellow
$ports = @(4021, 4022, 4023, 4024)
foreach ($port in $ports) {
    Write-Host "   Checking port $port..." -ForegroundColor Gray
    $healthy = $false
    for ($i=0; $i -lt 10; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:$port/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($resp.StatusCode -eq 200) { $healthy = $true; break }
        } catch {}
        Start-Sleep -Seconds 1
    }
    if (-not $healthy) { Write-Host "   Warning: Port $port not healthy" -ForegroundColor Red }
}

# 3. Run Orchestrator
Write-Host "[3/4] Running orchestrator ($Runs runs)..." -ForegroundColor Yellow
$env:DEMO_RUNS = $Runs.ToString()
npm run dev:orchestrator

# 4. Cleanup
Write-Host "[4/4] Cleanup..." -ForegroundColor Yellow
Stop-Process -Id $agentProc.Id -Force -ErrorAction SilentlyContinue
Write-Host "Demo Complete" -ForegroundColor Green
