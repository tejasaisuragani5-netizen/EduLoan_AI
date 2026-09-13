#!/bin/bash
# Starts backend (FastAPI) and frontend (Next.js) together.
# Run this from the project root: ./start.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting backend..."
cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt --quiet
uvicorn app.main:app --reload --port 8080 &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies (first run only)..."
  npm install
fi

echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend running at  http://127.0.0.1:8080  (docs at /docs)"
echo "Frontend running at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
