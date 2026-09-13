import pytest
import os
import app.main as main

@pytest.fixture(autouse=True)
def use_test_db(tmp_path, monkeypatch):
    test_db = str(tmp_path / "test_students.db")
    monkeypatch.setattr(main, "DATABASE", test_db)
    main.create_tables()
    yield
