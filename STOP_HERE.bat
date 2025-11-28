@echo off
echo.
echo ========================================
echo    STOPPING HEY POTU POS SYSTEM
echo ========================================
echo.

cd /d "%~dp0"

docker-compose down

echo.
echo ========================================
echo      SYSTEM HAS BEEN STOPPED!
echo ========================================
echo.
echo The POS system is now stopped.
echo To start it again, just double-click START_HERE.bat
echo.
pause
