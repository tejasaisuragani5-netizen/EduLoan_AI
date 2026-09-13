from fastapi.testclient import TestClient
from app.main import app
import io
from PIL import Image

client = TestClient(app)

def test_ai_status():
    res = client.get('/ai/status')
    assert res.status_code == 200
    data = res.json()
    assert 'active_engine' in data
    assert 'model' in data
    assert data['model'] != 'gemini-2.5-flash'
    assert data['ready'] is True

def test_document_verification_upload():
    # 1. Add a test student
    client.post('/students', json={
        'student_id': 'TEST_VERIF_001',
        'name': 'Test Student',
        'course': 'B.Tech Computer Science',
        'year': '3rd Year',
        'admission_year': '2023',
        'total_fee': 150000.0
    })

    # 2. Create in-memory test image
    img = Image.new('RGB', (800, 1000), color=(240, 240, 250))
    img_bytes_io = io.BytesIO()
    img.save(img_bytes_io, format='JPEG')
    img_bytes_io.seek(0)

    # 3. Upload document photo
    files = {
        'file': ('bonafide_sample.jpg', img_bytes_io, 'image/jpeg')
    }
    data = {
        'student_id': 'TEST_VERIF_001',
        'document_type': 'Bonafide Certificate'
    }
    upload_res = client.post('/verification/upload', data=data, files=files)
    assert upload_res.status_code == 200, upload_res.text
    res_data = upload_res.json()
    assert res_data['ai_verdict'] in {'VERIFIED', 'REJECTED', 'REVIEW'}
    assert res_data['confidence'] > 50
    assert 'engine' in res_data['ai_engine'].lower() or 'agent' in res_data['ai_engine'].lower() or 'gemini' in res_data['ai_engine'].lower()
    assert 'scorecard' in res_data and len(res_data['scorecard']) == 9
    assert 'scorecard_text' in res_data and 'VIGNAN DOCUMENT VERIFICATION' in res_data['scorecard_text']

    # 4. Check verification requests list
    list_res = client.get('/verification/requests')
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(item['student_id'] == 'TEST_VERIF_001' for item in items)

    # 5. Clean up test student immediately so real database is never polluted
    client.delete('/students/TEST_VERIF_001')


def test_fake_student_verification_scorecard():
    # Test fake / unregistered student document upload
    img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
    img_bytes_io = io.BytesIO()
    img.save(img_bytes_io, format='JPEG')
    img_bytes_io.seek(0)

    files = {
        'file': ('fake_certificate.jpg', img_bytes_io, 'image/jpeg')
    }
    data = {
        'student_id': 'FAKE_REG_999',
        'document_type': 'Bonafide Certificate'
    }
    upload_res = client.post('/verification/upload', data=data, files=files)
    assert upload_res.status_code == 200
    res_data = upload_res.json()
    assert res_data['ai_verdict'] == 'REJECTED'
    assert res_data['status'] == 'Rejected'
    assert 'Issuance details could not be verified' in res_data['reason']
    
    # Check scorecard items
    scorecard_map = {item['label']: item['value'] for item in res_data['scorecard']}
    assert 'NOT FOUND' in scorecard_map['Student Register No']
    assert 'INVALID' in scorecard_map['Document Number']
    assert 'INVALID' in scorecard_map['QR / Barcode']
    assert 'DETECTED' in scorecard_map['Tampering Indicators']

    # Clean up test verification record so database stays clean
    try:
        import sqlite3
        conn = sqlite3.connect('students.db')
        conn.execute("DELETE FROM verification_requests WHERE student_id = 'FAKE_REG_999'")
        conn.commit()
        conn.close()
    except Exception:
        pass


def test_vfstr_register_number_generation_by_year():
    # Test year 2024 -> 241FA...
    res24 = client.get('/students/next-reg-no?admission_year=2024&course=B.Tech+CSE')
    assert res24.status_code == 200
    assert res24.json()['suggested_student_id'].startswith('241FA04')

    # Test year 2025 -> 251FA...
    res25 = client.get('/students/next-reg-no?admission_year=2025&course=B.Tech+CSE')
    assert res25.status_code == 200
    assert res25.json()['suggested_student_id'].startswith('251FA04')

    # Test year 2026 -> 261FA...
    res26 = client.get('/students/next-reg-no?admission_year=2026&course=B.Tech+CSE')
    assert res26.status_code == 200
    assert res26.json()['suggested_student_id'].startswith('261FA04')


def test_cascading_student_deletion():
    sid = "251FA04099"
    # 1. Add student
    client.post('/students', json={
        'student_id': sid,
        'name': 'Cascade Test Student',
        'course': 'B.Tech CSE',
        'year': '1st Year',
        'admission_year': '2025',
        'total_fee': 200000.0
    })

    # 2. Add document request
    req_res = client.post('/document-requests', json={
        'student_id': sid,
        'document_type': 'Bonafide Certificate',
        'description': 'Loan application'
    })
    req_id = req_res.json()['id']

    # 3. Generate document
    client.post('/documents/generate', json={'request_id': req_id})

    # 4. Upload verification
    img = Image.new('RGB', (600, 800), color=(255, 255, 255))
    b = io.BytesIO()
    img.save(b, format='JPEG')
    b.seek(0)
    client.post('/verification/upload', data={
        'student_id': sid,
        'document_type': 'Bonafide Certificate'
    }, files={'file': ('test.jpg', b, 'image/jpeg')})

    # 5. Delete student
    del_res = client.delete(f'/students/{sid}')
    assert del_res.status_code == 200
    assert del_res.json()['deleted_counts']['students'] == 1
    assert del_res.json()['deleted_counts']['document_requests'] >= 1
    assert del_res.json()['deleted_counts']['documents'] >= 1
    assert del_res.json()['deleted_counts']['verification_requests'] >= 1

    # Verify student is completely gone
    assert client.get(f'/students/{sid}').status_code == 404
    # Verify child tables no longer have this student
    all_reqs = client.get('/document-requests').json()
    assert not any(r['student_id'] == sid for r in all_reqs)
    all_verifs = client.get('/verification/requests').json()
    assert not any(v['student_id'] == sid for v in all_verifs)


def test_student_id_mandatory_barcode_requirement():
    """Verify that uploading back photo with barcode is strictly mandatory for Student ID Proof."""
    img = Image.new('RGB', (400, 300), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)

    # Missing back_file must fail with HTTP 400
    res = client.post(
        '/verification/upload',
        data={'student_id': '241FA04001', 'document_type': 'Student ID Proof'},
        files={'file': ('id_front.jpg', buf.getvalue(), 'image/jpeg')}
    )
    assert res.status_code == 400
    assert 'mandatory' in res.json()['detail'].lower()


def test_scan_barcode_endpoint_and_student_details():
    """Verify /verification/scan-barcode decodes barcode and returns real-time student details."""
    import zxingcpp
    import cv2
    import numpy as np

    sid = "TEST_BC_777"
    client.post('/students', json={
        'student_id': sid,
        'name': 'Barcode Test Student',
        'course': 'B.Tech Information Technology',
        'year': '2nd Year',
        'admission_year': '2024',
        'total_fee': 180000.0
    })

    try:
        # Generate barcode image for this student
        bc = zxingcpp.create_barcode(sid, zxingcpp.BarcodeFormat.Code128)
        img = zxingcpp.write_barcode_to_image(bc)
        nparr = np.array(img)
        _, buf = cv2.imencode('.png', nparr)

        res = client.post(
            '/verification/scan-barcode',
            files={'file': ('barcode.png', buf.tobytes(), 'image/png')}
        )
        assert res.status_code == 200
        data = res.json()
        assert data['success'] is True
        assert data['barcode'] == sid
        assert data['student'] is not None
        assert data['student']['name'] == 'Barcode Test Student'
        assert data['student']['student_id'] == sid
        assert data['student']['course'] == 'B.Tech Information Technology'
        assert data['student']['total_fee'] == 180000.0
    finally:
        client.delete(f'/students/{sid}')



