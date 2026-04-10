@echo off

rem Kill processes on ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1

rem Start api-server
cd /d D:\Useful\Projects\no-BS\artifacts\api-server
start /B pnpm dev >nul 2>&1

rem Wait for API (3001)
:wait_api
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul
if errorlevel 1 (
    timeout /t 1 >nul
    goto wait_api
)

rem Start frontend
cd /d D:\Useful\Projects\no-BS\artifacts\no-bs-ide
start /B pnpm dev >nul 2>&1

rem Wait for frontend (5173)
:wait_frontend
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
    timeout /t 1 >nul
    goto wait_frontend
)

rem Start Electron app
cd /d D:\Useful\Projects\no-BS
pnpm start