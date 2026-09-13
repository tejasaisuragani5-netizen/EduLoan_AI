@echo off
REM Starts backend (FastAPI) and frontend (Next.js) together on Windows.
REM Run this from the project root: start.bat

echo Starting backend...
cd backend
if not exist .venv (
    python -m venv .venv
)
call .venv\Scripts\activate
echo Checking and installing Python dependencies...
python -m pip install -r requirements.txt
start "Backend" cmd /k "python -m uvicorn app.main:app --reload --port 8080"
cd ..

cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo Backend running at  http://127.0.0.1:8080  (docs at /docs)
echo Frontend running at http://localhost:3000
echo.
echo Close the two new terminal windows to stop.
