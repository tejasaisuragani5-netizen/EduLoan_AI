@echo off
title EduLoan AI Portal
start /min cmd /c "cd /d C:\Users\tejas\Downloads\EduLoan_AI_Final_Project\backend ^& python -m uvicorn app.main:app --host 0.0.0.0 --port 8080"
start /min cmd /c "cd /d C:\Users\tejas\Downloads\EduLoan_AI_Final_Project\frontend ^& npm run dev"
timeout /t 4 /nobreak >nul
start http://localhost:3000
exit
