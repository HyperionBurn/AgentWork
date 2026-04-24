Write-Host "🧹 Stopping all AgentWork processes..." -ForegroundColor Yellow

# Kill all node processes on specific ports
Get-Process node -ErrorAction SilentlyContinue | Where-Object { 
    $id = $_.Id
    $ports = netstat -ano | Select-String "LISTENING" | Select-String "$id"
    $ports -match "3001" -or $ports -match "3002" -or $ports -match "3003" -or $ports -match "402"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✅ Cleanup complete." -ForegroundColor Green
