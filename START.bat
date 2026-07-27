@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo   E-Attend - Project Start
echo ========================================
echo.

echo [1/2] Backend start ho raha hai...
start "E-Attend Backend" cmd /k "cd /d %~dp0backend-ready && npm install && npm start"

timeout /t 4 /nobreak >nul

echo [2/2] Frontend start ho raha hai...
start "E-Attend Frontend" cmd /k "cd /d %~dp0frontend-ready && npm install && npm start"

echo.
echo Dono servers alag windows mein khulenge.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:3000
echo.
pause
