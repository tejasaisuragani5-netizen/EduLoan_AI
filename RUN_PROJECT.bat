@echo off
title EduLoan AI Portal
start /min cmd /c "cd /d %~dp0backend ^& python -m uvicorn app.main:app --host 0.0.0.0 --port 8080"
if exist "%~dp0cloudflared.exe" (
    start /min cmd /c "cd /d %~dp0 ^& cloudflared.exe tunnel --url http://localhost:8080 --no-autoupdate"
) else if exist "%~dp0..\cloudflared.exe" (
    start /min cmd /c "cd /d %~dp0.. ^& cloudflared.exe tunnel --url http://localhost:8080 --no-autoupdate"
)
timeout /t 3 /nobreak >nul
start http://localhost:8080
exit
