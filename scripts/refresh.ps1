# ============================================================
# AgentWork — Environment Refresh Script (v2)
# ============================================================
# Kills existing processes on dashboard/agent ports and restarts them.
# ============================================================

$ports = @(3000, 3003, 4021, 4022, 4023, 4024)

Write-Host "🔄 Refreshing AgentWork Environment..." -ForegroundColor Cyan

# 1. Kill processes on ports
foreach ($port in $ports) {
    Write-Host "   Checking port $port..." -ForegroundColor Gray
    $netstat = netstat -ano | findstr ":$port"
    if ($netstat) {
        $pids_found = $netstat | ForEach-Object { $_.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)[-1] } | Select-Object -Unique
        foreach ($p_id in $pids_found) {
            try {
                Stop-Process -Id $p_id -Force -ErrorAction SilentlyContinue
                Write-Host "      Killed PID $p_id on port $port" -ForegroundColor Yellow
            } catch {
                Write-Host "      Failed to kill PID $p_id" -ForegroundColor Red
            }
        }
    }
}

Write-Host "✅ Ports cleared." -ForegroundColor Green

# 2. Start Dashboard
Write-Host "🚀 Starting Dashboard (packages/dashboard)..." -ForegroundColor Yellow
$dashProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev", "--workspace=packages/dashboard" -PassThru -NoNewWindow
Write-Host "   Dashboard PID: $($dashProc.Id)" -ForegroundColor Gray

# 3. Start Agents
$agents = @(
    @{ Name = "Research"; Script = "start:research" },
    @{ Name = "Code";     Script = "start:code" },
    @{ Name = "Test";     Script = "start:test" },
    @{ Name = "Review";   Script = "start:review" }
)

Write-Host "🚀 Starting specialist agents..." -ForegroundColor Yellow
foreach ($agent in $agents) {
    $proc = Start-Process -FilePath "npm.cmd" -ArgumentList "run", $agent.Script -PassThru -NoNewWindow
    Write-Host "   $($agent.Name) Agent PID: $($proc.Id)" -ForegroundColor Gray
}

Write-Host "✨ Environment Refresh Complete!" -ForegroundColor Green
Write-Host "   Dashboard: http://localhost:3003" -ForegroundColor Cyan
Write-Host "   Agents: Ports 4021-4024" -ForegroundColor Cyan
