@echo off
echo.
echo ========================================
echo    HEY POTU POS SYSTEM STARTER
echo ========================================
echo.
echo Starting the POS system...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo.
    echo Please start Docker Desktop first, then run this file again.
    echo.
    pause
    exit /b 1
)

echo Docker is running...
echo.

REM Navigate to the hey directory
cd /d "%~dp0"

echo Building and starting containers...
docker-compose up -d

echo.
echo ========================================
echo    POS SYSTEM IS STARTING!
echo ========================================
echo.
echo Please wait 10-15 seconds for the system to fully start...
echo.
timeout /t 15 /nobreak >nul

echo Opening your POS system in the browser...
start http://localhost:1111

echo.
echo ========================================
echo         SYSTEM IS NOW RUNNING!
echo ========================================
echo.
echo Your POS system is now available at:
echo http://localhost:1111
echo.
echo To STOP the system, close this window or run STOP_HERE.bat
echo.
echo Press any key to keep this window open (don't close it while using the system)
pause >nul
