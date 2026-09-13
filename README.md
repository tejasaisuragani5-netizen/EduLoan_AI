# VFSTR Education Loan Support & AI Document Verification System

**Vignan's Foundation for Science, Technology & Research (Deemed to be University)**
Comprehensive Education Loan Lifecycle Management & AI Multimodal Document Authenticity Verification.

---

## 📁 Project Structure

`
EduLoan_AI_Final_Project/
├── backend/                  # FastAPI (Python 3.10+) Backend API
│   ├── app/
│   │   └── main.py          # Complete API with ReportLab Stamps & AI Verification
│   ├── tests/               # Pytest verification test suite
│   ├── students.db          # Clean SQLite database (0 fake rows, ready for real data)
│   └── requirements.txt     # Python dependencies
├── frontend/                 # Next.js 14 (React 18 + TypeScript) Web Portal
│   ├── src/app/page.tsx     # Admin Dashboard, Loan Tracker & Verification Radar
│   └── package.json         # Node.js dependencies
├── start.bat                 # One-Click Run Script for Windows
├── start.sh                  # One-Click Run Script for Linux / macOS
└── README.md                 # Documentation & Run Guide
`

---

## 🚀 Quick Start (Windows)

### Option 1: One-Click Launch (Recommended)
Double-click start.bat or run in terminal:
`cmd
start.bat
`
This automatically:
1. Sets up virtual environment and installs Python dependencies.
2. Starts FastAPI backend on http://127.0.0.1:8080.
3. Installs frontend packages and starts Next.js on http://localhost:3000.

### Option 2: Manual Launch

#### 1. Start Backend:
`cmd
cd backend
python -m venv .venv
call .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8080
`
- API Docs: http://localhost:8080/docs
- Health: http://localhost:8080/health

#### 2. Start Frontend:
`cmd
cd frontend
npm install
npm run dev
`
- Open browser: http://localhost:3000

---

## ✨ Key Features & Clean State

- **100% Clean Database:** No pre-seeded dummy records. You can directly enter your real student details.
- **Official VFSTR Authenticity Scorecard:** Evaluates Institution Name, Register No, Student Name, Program/Branch, Document Number, Barcode/QR, University Circular Seal, Template Layout, and Tampering Indicators.
- **Student ID Barcode Verification:** Mandatory back side upload for student ID cards with real-time barcode decoding.
- **No Fabricated Matches:** Clean rejection indicators (✗ NOT FOUND, ✗ UNVERIFIED, ✗ NOT DETECTED) when unregistered documents are uploaded.
- **Zero Technical Debug Artifacts:** Completely user-ready without debug placeholders or engine badges.
