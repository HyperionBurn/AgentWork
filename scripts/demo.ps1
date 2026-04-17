# ============================================================
# AgentWork — One-Click Demo Launcher
# ============================================================
# Validates env, starts agents, waits for health, runs orchestrator.
# Usage: .\scripts\demo.ps1 [-Runs 10] [-SkipValidation]
# ============================================================

param(
    [int]$Runs = 10,
    [switch]$SkipValidation
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "          AgentWork Demo Launcher" -ForegroundColor Cyan  
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Validate environment
if (-not $SkipValidation) {
    Write-Host "[1/5] Validating environment..." -ForegroundColor Yellow
    Push-Location $RootDir
    npm run validate-env
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Environment validation failed. Fix .env and retry." -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "   Environment OK" -ForegroundColor Green
} else {
    Write-Host "[1/5] Skipping validation (-SkipValidation)" -ForegroundColor Gray
}

# Step 2: Start agents in background
Write-Host ""
Write-Host "[2/5] Starting specialist agents..." -ForegroundColor Yellow

$agents = @(
    @{ Name = "Research"; Port = 4021; Script = "start:research" },
    @{ Name = "Code";     Port = 4022; Script = "start:code" },
    @{ Name = "Test";     Port = 4023; Script = "start:test" },
    @{ Name = "Review";   Port = 4024; Script = "start:review" }
)

# Ensure evidence directory exists for log redirects
$evidenceDir = Join-Path $RootDir "evidence"
if (-not (Test-Path $evidenceDir)) {
    New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null
}

$agentProcesses = @()
foreach ($agent in $agents) {
    $proc = Start-Process -FilePath "npm" -ArgumentList "run", $agent.Script -PassThru -NoNewWindow -RedirectStandardOutput "$evidenceDir\agent-$($agent.Name).log" -RedirectStandardError "$evidenceDir\agent-$($agent.Name)-err.log"
    $agentProcesses += $proc
    Write-Host "   $($agent.Name) Agent (port $($agent.Port)) — PID $($proc.Id)" -ForegroundColor Gray
}

# Step 3: Wait for health checks
Write-Host ""
Write-Host "[3/5] Waiting for agents to be healthy..." -ForegroundColor Yellow

$maxWait = 15
$waited = 0
$allHealthy = $false

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 1
    $waited++
    
    $healthy = 0
    foreach ($agent in $agents) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($agent.Port)/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) { $healthy++ }
        } catch { }
    }
    
    if ($healthy -eq $agents.Count) {
        $allHealthy = $true
        break
    }
    
    Write-Host "   Waiting... ($healthy/$($agents.Count) healthy, ${waited}s)" -ForegroundColor Gray
}

if (-not $allHealthy) {
    Write-Host "   Warning: Only $healthy/$($agents.Count) agents healthy after ${maxWait}s" -ForegroundColor Yellow
    Write-Host "   Continuing anyway — some payments may fail" -ForegroundColor Yellow
} else {
    Write-Host "   All agents healthy!" -ForegroundColor Green
}

# Step 4: Run orchestrator
Write-Host ""
Write-Host "[4/5] Running orchestrator ($Runs run(s))..." -ForegroundColor Yellow
$env:DEMO_RUNS = $Runs.ToString()

Push-Location $RootDir
npm run dev:orchestrator
$orchResult = $LASTEXITCODE
Pop-Location

if ($orchResult -ne 0) {
    Write-Host "   Orchestrator failed with exit code $orchResult" -ForegroundColor Red
}

# Step 5: Summary
Write-Host ""
Write-Host "[5/5] Demo Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Check evidence/ directory for session recordings" -ForegroundColor Cyan
Write-Host "  View transactions: https://testnet.arcscan.io" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Cleanup: stop agents
Write-Host ""
Write-Host "Stopping agents..." -ForegroundColor Gray
foreach ($proc in $agentProcesses) {
    if (-not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Done." -ForegroundColor Gray

if ($orchResult -ne 0) { exit $orchResult }
