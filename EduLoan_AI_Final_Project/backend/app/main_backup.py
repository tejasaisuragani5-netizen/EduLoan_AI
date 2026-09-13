from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3


# =================================================
# APPLICATION
# =================================================

app = FastAPI(
    title="Education Loan Support Agent",
    description="Student Records and Document Request API",
    version="1.0.0"
)


# =================================================
# CORS
# =================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =================================================
# DATABASE
# =================================================

DATABASE = "students.db"


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


# =================================================
# CREATE TABLES
# =================================================

def create_tables():

    connection = get_connection()

    # Students table
    connection.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            course TEXT NOT NULL,
            year TEXT NOT NULL,
            admission_year TEXT NOT NULL,
            total_fee REAL NOT NULL
        )
    """)

    # Document requests table
    connection.execute("""
        CREATE TABLE IF NOT EXISTS document_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            document_type TEXT NOT NULL,
            description TEXT,
            request_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending'
        )
    """)

    connection.commit()
    connection.close()


create_tables()


# =================================================
# MODELS
# =================================================

class Student(BaseModel):
    student_id: str
    name: str
    course: str
    year: str
    admission_year: str
    total_fee: float


class DocumentRequest(BaseModel):
    student_id: str
    document_type: str
    description: str = ""


class RequestStatus(BaseModel):
    status: str


# =================================================
# HOME
# =================================================

@app.get("/")
def home():

    return {
        "message": "Education Loan Support Agent Backend is running"
    }


# =================================================
# STUDENT APIs
# =================================================

@app.get("/students")
def get_students():

    connection = get_connection()

    students = connection.execute("""
        SELECT *
        FROM students
        ORDER BY id DESC
    """).fetchall()

    connection.close()

    return [dict(student) for student in students]


@app.get("/students/{student_id}")
def get_student(student_id: str):

    connection = get_connection()

    student = connection.execute("""
        SELECT *
        FROM students
        WHERE student_id = ?
    """, (student_id,)).fetchone()

    connection.close()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return dict(student)


@app.post("/students")
def add_student(student: Student):

    connection = get_connection()

    try:

        cursor = connection.execute("""
            INSERT INTO students
            (
                student_id,
                name,
                course,
                year,
                admission_year,
                total_fee
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            student.student_id,
            student.name,
            student.course,
            student.year,
            student.admission_year,
            student.total_fee
        ))

        connection.commit()

        new_id = cursor.lastrowid

        connection.close()

        return {
            "message": "Student added successfully",
            "id": new_id
        }

    except sqlite3.IntegrityError:

        connection.close()

        raise HTTPException(
            status_code=400,
            detail="Student ID already exists"
        )


@app.delete("/students/{student_id}")
def delete_student(student_id: str):

    connection = get_connection()

    cursor = connection.execute("""
        DELETE FROM students
        WHERE student_id = ?
    """, (student_id,))

    connection.commit()

    deleted = cursor.rowcount

    connection.close()

    if deleted == 0:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return {
        "message": "Student deleted successfully"
    }


# =================================================
# DOCUMENT REQUEST APIs
# =================================================

@app.get("/document-requests")
def get_document_requests():

    connection = get_connection()

    requests = connection.execute("""
        SELECT
            dr.id,
            dr.student_id,
            s.name AS student_name,
            dr.document_type,
            dr.description,
            dr.request_date,
            dr.status
        FROM document_requests dr
        LEFT JOIN students s
        ON dr.student_id = s.student_id
        ORDER BY dr.id DESC
    """).fetchall()

    connection.close()

    return [dict(request) for request in requests]


@app.post("/document-requests")
def create_document_request(request: DocumentRequest):

    connection = get_connection()

    # Check student exists
    student = connection.execute("""
        SELECT *
        FROM students
        WHERE student_id = ?
    """, (request.student_id,)).fetchone()

    if student is None:

        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Get current date
    from datetime import date

    request_date = str(date.today())

    cursor = connection.execute("""
        INSERT INTO document_requests
        (
            student_id,
            document_type,
            description,
            request_date,
            status
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        request.student_id,
        request.document_type,
        request.description,
        request_date,
        "Pending"
    ))

    connection.commit()

    new_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Document request created successfully",
        "id": new_id
    }


@app.patch("/document-requests/{request_id}")
def update_request_status(
    request_id: int,
    request_status: RequestStatus
):

    allowed_statuses = [
        "Pending",
        "Approved",
        "Rejected"
    ]

    if request_status.status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    connection = get_connection()

    cursor = connection.execute("""
        UPDATE document_requests
        SET status = ?
        WHERE id = ?
    """, (
        request_status.status,
        request_id
    ))

    connection.commit()

    updated = cursor.rowcount

    connection.close()

    if updated == 0:

        raise HTTPException(
            status_code=404,
            detail="Document request not found"
        )

    return {
        "message": "Request status updated successfully"
    }
