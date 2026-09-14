import io
import os
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont
import app.main as main

client = TestClient(main.app)

def create_mock_certificate_image(student_id: str, student_name: str, doc_type: str, fee_text: str = "") -> bytes:
    """Generate a clean certificate with readable Arial typography and official stamp."""
    font_path = "C:\\Windows\\Fonts\\arial.ttf"
    font = ImageFont.truetype(font_path, 28) if os.path.exists(font_path) else ImageFont.load_default()

    img = Image.new("RGB", (1000, 1200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    draw.rectangle([(20, 20), (980, 1180)], outline=(30, 58, 138), width=3)
    draw.text((60, 60), "VIGNAN UNIVERSITY VFSTR VADLAMUDI", fill=(0, 0, 0), font=font)
    draw.text((60, 120), f"OFFICIAL {doc_type.upper()}", fill=(0, 0, 0), font=font)
    draw.text((60, 180), f"Student Name: {student_name}", fill=(0, 0, 0), font=font)
    draw.text((60, 240), f"Register Number: {student_id}", fill=(0, 0, 0), font=font)
    draw.text((60, 300), "Course: B.Tech Computer Science and Engineering", fill=(0, 0, 0), font=font)
    draw.text((60, 360), "Academic Year: 2026-2027", fill=(0, 0, 0), font=font)
    if fee_text:
        draw.text((60, 420), fee_text, fill=(0, 0, 0), font=font)

    # Red official circular seal
    draw.ellipse([(650, 850), (820, 1020)], fill=(180, 20, 20))
    draw.text((675, 920), "VFSTR", fill=(255, 255, 255), font=font)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_bundle_synthesis_matching_student():
    """Test 1: When all uploaded certificates match the student identity, synthesis PASSES."""
    sid = "261FA04001"
    name = "Tejasai"

    # Register student in test DB
    client.post("/students", json={
        "student_id": sid,
        "name": name,
        "course": "B.Tech Computer Science and Engineering",
        "year": "1st Year",
        "admission_year": "2026",
        "total_fee": 2000000.0,
        "loan_status": "Approved",
        "current_hold_status": "None",
        "current_hold_amount": 0.0
    })

    bonafide_bytes = create_mock_certificate_image(sid, name, "Bonafide Certificate")
    fee_bytes = create_mock_certificate_image(sid, name, "Fee Structure Letter", "Total Approved Fee: Rs. 2000000")
    admission_bytes = create_mock_certificate_image(sid, name, "Admission Confirmation")

    files = [
        ("bonafide_file", ("bonafide.png", bonafide_bytes, "image/png")),
        ("fee_structure_file", ("fee_structure.png", fee_bytes, "image/png")),
        ("admission_letter_file", ("admission.png", admission_bytes, "image/png"))
    ]
    data = {
        "student_id": sid,
        "target_loan_amount": "2000000.0",
        "family_income": "300000.0"
    }

    res = client.post("/verification/bundle-eligibility", data=data, files=files)
    assert res.status_code == 200
    res_data = res.json()

    # 1. Verify real AI forensic audit ran on each document
    assert "audited_documents" in res_data
    assert len(res_data["audited_documents"]) == 3
    for doc in res_data["audited_documents"]:
        assert doc["verdict"] == "VERIFIED"
        assert doc["confidence"] >= 90.0

    # 2. Verify cross-document identity synthesis passed
    assert res_data["cross_doc_identity"]["passed"] is True
    assert "ELIGIBLE" in res_data["overall_verdict"]
    assert res_data["eligibility_score"] >= 80.0
    assert len(res_data["discrepancies"]) == 0


def test_bundle_synthesis_adversarial_mismatch_detected():
    """Test 2: When an uploaded certificate has a DIFFERENT student's ID, synthesis FAILS & FLAGS."""
    sid = "261FA04001"
    name = "Tejasai"
    foreign_sid = "241FA04195" # Conflicting student ID on one of the certificates!

    # Register student
    client.post("/students", json={
        "student_id": sid,
        "name": name,
        "course": "B.Tech Computer Science and Engineering",
        "year": "1st Year",
        "admission_year": "2026",
        "total_fee": 2000000.0,
        "loan_status": "Approved",
        "current_hold_status": "None",
        "current_hold_amount": 0.0
    })

    bonafide_bytes = create_mock_certificate_image(sid, name, "Bonafide Certificate")
    # Adversarial certificate: contains different student ID
    mismatched_fee_bytes = create_mock_certificate_image(foreign_sid, "K. Jagadeesh", "Fee Structure Letter")

    files = [
        ("bonafide_file", ("bonafide.png", bonafide_bytes, "image/png")),
        ("fee_structure_file", ("fee_mismatched.png", mismatched_fee_bytes, "image/png"))
    ]
    data = {
        "student_id": sid,
        "target_loan_amount": "2000000.0",
        "family_income": "300000.0"
    }

    res = client.post("/verification/bundle-eligibility", data=data, files=files)
    assert res.status_code == 200
    res_data = res.json()

    # The synthesis engine MUST catch the cross-student mismatch!
    assert res_data["cross_doc_identity"]["passed"] is False
    assert len(res_data["discrepancies"]) > 0
    # Must flag the conflicting student ID
    assert any(foreign_sid in str(d) for d in res_data["discrepancies"])
    # Verdict must be degraded to REJECTED or DISCREPANCY
    assert "REJECTED" in res_data["overall_verdict"] or "DISCREPANCY" in res_data["overall_verdict"] or "MISMATCH" in res_data["overall_verdict"]
