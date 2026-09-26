@echo off
title LifeAdmin Runner
echo ==========================================
echo Starting LifeAdmin Platform...
echo ==========================================

echo Starting Backend Server on http://localhost:5000 ...
start "LifeAdmin Backend (Port 5000)" cmd /k "cd /d "%~dp0server" && npm run dev"

echo Starting Frontend UI on http://localhost:5173 ...
start "LifeAdmin Frontend (Port 5173)" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo Both services are booting up!
echo - Backend:  http://localhost:5000
echo - Frontend: http://localhost:5173
echo.
timeout /t 4 /nobreak >nul
start http://localhost:5173
exit
