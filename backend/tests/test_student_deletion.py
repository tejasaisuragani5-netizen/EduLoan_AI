import pytest
from fastapi.testclient import TestClient
import sqlite3
import os
from datetime import datetime
import app.main as main

client = TestClient(main.app)

def test_delete_student_cascade():
    test_sid = 'TEST_DEL_999'
    now_iso = datetime.now().isoformat()

    # 1. Create student
    student_payload = {
        'student_id': test_sid,
        'name': 'Delete Test Student',
        'course': 'B.Tech CSE',
        'year': '2nd Year',
        'admission_year': '2024',
        'total_fee': 250000.0,
        'loan_status': 'Approved',
        'current_hold_status': 'None',
        'current_hold_amount': 0.0
    }
    r = client.post('/students', json=student_payload)
    assert r.status_code in (200, 201)

    # 2. Populate dependent records and files
    fake_doc_path = os.path.join(main.DOCS_DIR, f'test_doc_{test_sid}.pdf')
    with open(fake_doc_path, 'w', encoding='utf-8') as f:
        f.write('dummy pdf content')

    fake_verif_path = os.path.join(main.DOCS_DIR, f'test_verif_{test_sid}.png')
    with open(fake_verif_path, 'w', encoding='utf-8') as f:
        f.write('dummy png content')

    fake_dossier_path = os.path.join(main.DOCS_DIR, f'test_bundle_{test_sid}_dossier.pdf')
    with open(fake_dossier_path, 'w', encoding='utf-8') as f:
        f.write('dummy dossier content')

    conn = sqlite3.connect(main.DATABASE)
    conn.execute(
        'INSERT INTO document_requests (student_id, document_type, description, request_date, status) VALUES (?, ?, ?, ?, ?)',
        (test_sid, 'Bonafide Certificate', 'Bank Loan Request', now_iso, 'Pending')
    )
    conn.execute(
        'INSERT INTO documents (student_id, document_type, verification_code, issued_date, file_path) VALUES (?, ?, ?, ?, ?)',
        (test_sid, 'Bonafide Certificate', 'VCODE999', now_iso, fake_doc_path)
    )
    conn.execute(
        'INSERT INTO disbursements (student_id, bank_name, loan_amount, disbursed_date, reconciled, utr_number) VALUES (?, ?, ?, ?, ?, ?)',
        (test_sid, 'SBI', 50000.0, now_iso, 1, 'UTR999DEL')
    )
    conn.execute(
        'INSERT INTO verification_requests (student_id, document_type, filename, file_path, ai_verdict, confidence, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (test_sid, 'Fee Structure', 'fee.png', fake_verif_path, 'VERIFIED', 0.99, 'Approved', now_iso)
    )
    conn.execute(
        'INSERT INTO bundle_eligibility_evaluations (student_id, overall_verdict, eligibility_score, created_at, dossier_pdf_path) VALUES (?, ?, ?, ?, ?)',
        (test_sid, 'RECOMMENDED', 95.0, now_iso, fake_dossier_path)
    )
    conn.commit()
    conn.close()

    assert os.path.exists(fake_doc_path)
    assert os.path.exists(fake_verif_path)
    assert os.path.exists(fake_dossier_path)

    # 3. Call DELETE /students/{test_sid}
    del_res = client.delete(f'/students/{test_sid}')
    assert del_res.status_code == 200
    res_data = del_res.json()
    assert 'deleted permanently' in res_data['message']

    # 4. Check all 6 tables - must have 0 records
    conn = sqlite3.connect(main.DATABASE)
    for table in ['students', 'document_requests', 'documents', 'disbursements', 'verification_requests', 'bundle_eligibility_evaluations']:
        cnt = conn.execute(f'SELECT COUNT(*) FROM {table} WHERE UPPER(TRIM(student_id)) = UPPER(?)', (test_sid,)).fetchone()[0]
        assert cnt == 0, f'Table {table} still has {cnt} rows for {test_sid}!'

    # 5. Check blacklist
    del_cnt = conn.execute('SELECT COUNT(*) FROM deleted_students WHERE student_id = ?', (test_sid,)).fetchone()[0]
    assert del_cnt == 1
    conn.close()

    # 6. Check disk files cleaned
    assert not os.path.exists(fake_doc_path), 'Doc file was not removed from disk!'
    assert not os.path.exists(fake_verif_path), 'Verif file was not removed from disk!'
    assert not os.path.exists(fake_dossier_path), 'Dossier file was not removed from disk!'

    # 7. Ensure restart / create_tables does not revive student
    main.create_tables()
    conn = sqlite3.connect(main.DATABASE)
    assert conn.execute('SELECT COUNT(*) FROM students WHERE student_id = ?', (test_sid,)).fetchone()[0] == 0
    conn.close()
