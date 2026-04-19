# AgentWork — Demo Recording Helper
# Run from project root: .\scripts\record-demo.ps1
# Prerequisites: docker-compose up (agents + dashboard running)

param(
    [int]$Runs = 15,
    [switch]$SkipBuild,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot | Split-Path -Parent

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  AgentWork — Demo Recording Helper" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Pre-flight checks
Write-Host "[1/5] Pre-flight checks..." -ForegroundColor Yellow

$dockerOk = $false
try {
    $null = docker info 2>&1
    $dockerOk = $true
    Write-Host "  ✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Docker not available" -ForegroundColor Red
}

# Check dashboard is accessible
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✅ Dashboard is live (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Dashboard not accessible at localhost:3000" -ForegroundColor Red
    Write-Host "     Run: docker-compose up --build" -ForegroundColor Gray
}

# Step 2: Build if needed
if (-not $SkipBuild -and $dockerOk) {
    Write-Host ""
    Write-Host "[2/5] Building containers..." -ForegroundColor Yellow
    Push-Location $Root
    docker-compose build 2>&1 | ForEach-Object { Write-Host "  $_" }
    Pop-Location
    Write-Host "  ✅ Build complete" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[2/5] Skipping build (--SkipBuild or Docker unavailable)" -ForegroundColor Gray
}

# Step 3: Start services
Write-Host ""
Write-Host "[3/5] Starting services..." -ForegroundColor Yellow
if ($dockerOk -and -not $DryRun) {
    Push-Location $Root
    docker-compose up -d 2>&1 | ForEach-Object { Write-Host "  $_" }
    Pop-Location
    Write-Host "  ✅ Services starting" -ForegroundColor Green
    Write-Host "  ⏳ Waiting 15s for services to be ready..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
} elseif ($DryRun) {
    Write-Host "  🏃 DRY RUN — skipping service start" -ForegroundColor Gray
}

# Step 4: Open browser
Write-Host ""
Write-Host "[4/5] Opening dashboard..." -ForegroundColor Yellow
if (-not $DryRun) {
    Start-Process "http://localhost:3000"
    Write-Host "  ✅ Dashboard opened in browser" -ForegroundColor Green
    Write-Host ""
    Write-Host "  📹 READY TO RECORD!" -ForegroundColor Cyan
    Write-Host "  → Start screen recording (OBS/Loom)" -ForegroundColor White
    Write-Host "  → Click '🚀 Run Demo' with $Runs runs" -ForegroundColor White
    Write-Host "  → Wait for transactions to waterfall in" -ForegroundColor White
    Write-Host "  → Click arcscan links to show real txns" -ForegroundColor White
    Write-Host "  → Navigate to Evidence page (/evidence)" -ForegroundColor White
    Write-Host ""
    Write-Host "  Press any key to stop services after recording..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Step 5: Cleanup
Write-Host ""
Write-Host "[5/5] Cleanup..." -ForegroundColor Yellow
if ($dockerOk -and -not $DryRun) {
    Push-Location $Root
    docker-compose down 2>&1 | ForEach-Object { Write-Host "  $_" }
    Pop-Location
    Write-Host "  ✅ Services stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Done! Demo recording complete." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
