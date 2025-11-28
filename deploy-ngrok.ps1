# Hey Potu POS - Ngrok Deployment Script
# This script deploys both frontend and backend using ngrok

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Hey Potu POS - Ngrok Deployment         " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Ngrok auth token
$NGROK_AUTH_TOKEN = "360EwDtUiPxZJSHS50wL3vk5qn3_wRstmCihRbTk2eTuTrWd"

# Check if ngrok is installed
Write-Host "Checking ngrok installation..." -ForegroundColor Yellow
try {
    ngrok version | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK Ngrok is installed" -ForegroundColor Green
    }
    else {
        throw "Ngrok not found"
    }
}
catch {
    Write-Host "ERROR Ngrok is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download ngrok from: https://ngrok.com/download" -ForegroundColor White
    Write-Host "Or install via chocolatey: choco install ngrok" -ForegroundColor White
    Write-Host ""
    pause
    exit
}

# Configure ngrok with auth token
Write-Host ""
Write-Host "Configuring ngrok auth token..." -ForegroundColor Yellow
ngrok config add-authtoken $NGROK_AUTH_TOKEN

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Auth token configured successfully" -ForegroundColor Green
}
else {
    Write-Host "ERROR Failed to configure auth token" -ForegroundColor Red
    pause
    exit
}

# Check if Docker containers are running
Write-Host ""
Write-Host "Checking if application is running..." -ForegroundColor Yellow
$running = docker-compose ps -q

if (-not $running) {
    Write-Host "WARNING Application is not running!" -ForegroundColor Yellow
    Write-Host "Starting application first..." -ForegroundColor Yellow
    Write-Host ""
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR Failed to start application" -ForegroundColor Red
        pause
        exit
    }
    
    Write-Host "OK Application started" -ForegroundColor Green
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}
else {
    Write-Host "OK Application is already running" -ForegroundColor Green
}

# Start ngrok tunnels in separate PowerShell windows
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Starting Ngrok Tunnels...               " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing ngrok processes
Write-Host "Stopping any existing ngrok tunnels..." -ForegroundColor Yellow
taskkill /F /IM ngrok.exe 2>$null | Out-Null
Start-Sleep -Seconds 2

# Start backend tunnel
Write-Host "Starting BACKEND tunnel (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'BACKEND API Tunnel' -ForegroundColor Cyan; ngrok http 5000"
Start-Sleep -Seconds 3

# Start frontend tunnel
Write-Host "Starting FRONTEND tunnel (Port 1111)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'FRONTEND Tunnel' -ForegroundColor Green; ngrok http 1111"
Start-Sleep -Seconds 5

# Get tunnel URLs
Write-Host ""
Write-Host "Fetching tunnel URLs..." -ForegroundColor Yellow
try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "   DEPLOYMENT SUCCESSFUL!                  " -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    
    foreach ($tunnel in $tunnels.tunnels) {
        if ($tunnel.config.addr -like "*:5000*") {
            Write-Host "BACKEND API URL:" -ForegroundColor Yellow
            Write-Host "  $($tunnel.public_url)" -ForegroundColor White
            $backendUrl = $tunnel.public_url
        }
        elseif ($tunnel.config.addr -like "*:1111*") {
            Write-Host ""
            Write-Host "FRONTEND URL:" -ForegroundColor Yellow
            Write-Host "  $($tunnel.public_url)" -ForegroundColor White
            $frontendUrl = $tunnel.public_url
        }
    }
    
    Write-Host ""
    Write-Host "IMPORTANT: Update frontend API URL" -ForegroundColor Red
    Write-Host "The frontend needs to know the backend URL." -ForegroundColor White
    Write-Host ""
    Write-Host "Option 1: Set environment variable"  -ForegroundColor Cyan
    Write-Host "  `$env:VITE_API_URL = '$backendUrl'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Update .env file" -ForegroundColor Cyan
    Write-Host "  Add: VITE_API_URL=$backendUrl" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then rebuild frontend: docker-compose restart frontend" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "--------------------------------------------" -ForegroundColor Gray
    Write-Host "Ngrok Dashboard: http://localhost:4040" -ForegroundColor Cyan
    Write-Host "--------------------------------------------" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Keep the ngrok windows open to maintain tunnels!" -ForegroundColor Yellow
    Write-Host ""
    
}
catch {
    Write-Host "ERROR Could not fetch tunnel URLs" -ForegroundColor Red
    Write-Host "Please check http://localhost:4040 manually" -ForegroundColor Yellow
}

pause
