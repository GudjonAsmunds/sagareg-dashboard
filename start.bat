@echo off
echo ==============================
echo Starting SagaReg Dashboard
echo ==============================

start "Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ==================================
echo SagaReg Dashboard is running!
echo ==================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Close both command windows to stop
echo ==================================
pause
