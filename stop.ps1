# Hey Potu POS - Stop Script

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Hey Potu POS System - Stopping...       " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Application stopped successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Error stopping application" -ForegroundColor Red
    Write-Host ""
}

pause
