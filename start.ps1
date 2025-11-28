# Hey Potu POS - Quick Start Script
# Run this script to start the application

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Hey Potu POS System - Starting...       " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Red
    pause
    exit
}

# Check if containers are already running
Write-Host ""
Write-Host "Checking existing containers..." -ForegroundColor Yellow
$running = docker-compose ps -q

if ($running) {
    Write-Host "Containers are already running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access the application at:" -ForegroundColor Cyan
    Write-Host "  → http://localhost:1111" -ForegroundColor White
    Write-Host "  → http://192.168.0.199:1111" -ForegroundColor White
    Write-Host ""
    pause
    exit
}

# Build and start containers
Write-Host ""
Write-Host "Building and starting containers..." -ForegroundColor Yellow
Write-Host "(This may take 5-10 minutes on first run)" -ForegroundColor Gray
Write-Host ""

docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "   ✓ Application started successfully!     " -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access the application at:" -ForegroundColor Cyan
    Write-Host "  → http://localhost:1111" -ForegroundColor White
    Write-Host "  → http://192.168.0.199:1111 (network)" -ForegroundColor White
    Write-Host ""
    Write-Host "To stop the application, run:" -ForegroundColor Yellow
    Write-Host "  docker-compose down" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "   ✗ Error starting application            " -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Docker Desktop is running" -ForegroundColor White
    Write-Host "2. Ports 1111, 5000, 5432 are available" -ForegroundColor White
    Write-Host "3. Run 'docker-compose logs' for details" -ForegroundColor White
    Write-Host ""
}

pause
