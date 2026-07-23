"""
Shared pytest fixtures — mocks Appwrite database and overrides FastAPI dependencies.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app
from app.core.dependencies import get_current_user, get_optional_user

MOCK_USER = {"id": "user123", "email": "player@sportix.com", "name": "Test Player"}


async def override_get_current_user():
    return MOCK_USER


async def override_get_optional_user():
    return MOCK_USER


@pytest.fixture(autouse=True)
def override_dependencies():
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_optional_user] = override_get_optional_user
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def mock_appwrite_client():
    """
    Auto-use fixture that patches the Appwrite database client
    for all tests. This prevents real network calls during testing.
    """
    mock_db = MagicMock()
    mock_db.list_documents.return_value = {"documents": [], "total": 0}
    mock_db.get_document.return_value = {}
    mock_db.create_document.return_value = {"$id": "mock_doc_id"}
    mock_db.update_document.return_value = {"$id": "mock_doc_id"}
    mock_db.delete_document.return_value = {}

    mock_users = MagicMock()
    mock_storage = MagicMock()

    with patch("app.core.appwrite.db", mock_db), \
         patch("app.core.appwrite.users_svc", mock_users), \
         patch("app.core.appwrite.storage_svc", mock_storage):
        yield mock_db


@pytest.fixture
def client():
    return TestClient(app)
