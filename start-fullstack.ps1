# ============================================================
# AgentWork — Full-Stack Launcher
# ============================================================
# Starts all components required for the live demo.
# 1. Specialist Agents (Python/Flask @ 4021-4024)
# 2. Backend Dashboard (Next.js @ 3003)
# 3. Landing Page (Vite @ 3002)
# 4. Frontend Dashboard (Vite @ 3001)
# ============================================================

$RootDir = $PSScriptRoot
if ($null -eq $RootDir) { $RootDir = Get-Location }

Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Cyan
# Aggressive cleanup of all node processes on target ports
$ports = @(3001, 3002, 3003, 4021, 4022, 4023, 4024)
foreach ($port in $ports) {
    $netstat = netstat -ano | Select-String "LISTENING" | Select-String ":$port\s" | Select-Object -First 1
    if ($netstat) {
        $processId = $netstat.ToString().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)[-1]
        if ($processId) {
            Write-Host "   Stopping process on port $port (PID $processId)..." -ForegroundColor Gray
            taskkill /F /T /PID $processId 2>$null
        }
    }
}

Write-Host "🚀 Launching AgentWork Full-Stack..." -ForegroundColor Cyan

# 1. Start Specialist Agents (Real Mode Express Gateway)
Write-Host "   [1/4] Starting Agents (Express Gateway - Real Mode)..." -ForegroundColor Yellow
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start:agents:express" -NoNewWindow

# 2. Start Backend Dashboard (Port 3003)
Write-Host "   [2/4] Starting Backend Dashboard (Port 3003)..." -ForegroundColor Yellow
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev", "--workspace=packages/dashboard" -NoNewWindow

# 3. Start New Landing Page (Port 3002)
Write-Host "   [3/4] Starting New Landing Page (Port 3002)..." -ForegroundColor Yellow
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev", "--workspace=newlandingpage" -NoNewWindow

# 4. Start Frontend Dashboard (Port 3001)
Write-Host "   [4/4] Starting Frontend Dashboard (Port 3001)..." -ForegroundColor Yellow
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev", "--workspace=newgemdashboard" -NoNewWindow

Write-Host ""
Write-Host "✅ All systems initializing." -ForegroundColor Green
Write-Host "   - Backend Dashboard: http://localhost:3003" -ForegroundColor Gray
Write-Host "   - New Landing Page:  http://localhost:3002" -ForegroundColor Gray
Write-Host "   - New Gem Dashboard: http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "Check the 'Task Feed' in the dashboards for real-time orchestration logs." -ForegroundColor Cyan

