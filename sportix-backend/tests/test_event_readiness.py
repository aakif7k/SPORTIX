import pytest
from unittest.mock import patch, MagicMock
from app.services.event_readiness_service import (
    get_target_squad_size,
    get_event_readiness,
    check_and_notify_event_readiness,
)

def test_target_squad_size_calculation():
    assert get_target_squad_size("Football", "11v11") == 11
    assert get_target_squad_size("Football", "5v5") == 5
    assert get_target_squad_size("Basketball", "5v5") == 5
    assert get_target_squad_size("Basketball", "3x3") == 3
    assert get_target_squad_size("Volleyball", "6v6") == 6
    assert get_target_squad_size("Padel", "doubles") == 2
    assert get_target_squad_size("Tennis", "singles") == 2

@pytest.mark.asyncio
async def test_event_readiness_locked_under_10_athletes():
    mock_event = {"$id": "event_101", "sport": "Football", "format": "5v5", "max_participants": 32}
    mock_participants = [{"user_id": f"u_{i}", "status": "confirmed"} for i in range(7)]

    def mock_get_doc(db_id, col_id, doc_id):
        return mock_event

    def mock_list_docs(db_id, col_id, queries=None):
        return {"documents": mock_participants, "total": len(mock_participants)}

    with patch("app.services.event_readiness_service.db.get_document", side_effect=mock_get_doc), \
         patch("app.services.event_readiness_service.db.list_documents", side_effect=mock_list_docs):
        
        readiness = await get_event_readiness("event_101", "u_0")
        assert readiness["eligible_count"] == 7
        assert readiness["is_autosquad_ready"] is False
        assert readiness["readiness_state"] == "WAITING_FOR_PLAYERS"

@pytest.mark.asyncio
async def test_event_readiness_unlocked_at_10_athletes():
    mock_event = {"$id": "event_102", "sport": "Football", "format": "5v5", "max_participants": 32}
    mock_participants = [{"user_id": f"u_{i}", "status": "confirmed"} for i in range(10)]

    def mock_get_doc(db_id, col_id, doc_id):
        if col_id == "events":
            return mock_event
        return {"$id": doc_id, "level": 10, "experience_level": "amateur", "pulse_score": 500}

    def mock_list_docs(db_id, col_id, queries=None):
        return {"documents": mock_participants, "total": len(mock_participants)}

    with patch("app.services.event_readiness_service.db.get_document", side_effect=mock_get_doc), \
         patch("app.services.event_readiness_service.db.list_documents", side_effect=mock_list_docs):
        
        readiness = await get_event_readiness("event_102", "u_0")
        assert readiness["eligible_count"] == 10
        assert readiness["is_autosquad_ready"] is True
        assert readiness["readiness_state"] == "AUTOSQUAD_READY"

@pytest.mark.asyncio
async def test_idempotent_event_readiness_notifications():
    created_notifications = []

    def mock_list_docs(db_id, col_id, queries=None):
        if col_id == "event_participants":
            return {"documents": [{"user_id": f"u_{i}", "status": "confirmed"} for i in range(10)], "total": 10}
        if col_id == "notifications":
            # Return existing notifications list
            return {"documents": [n for n in created_notifications if n.get("type") == "event_autosquad_ready"], "total": len(created_notifications)}
        return {"documents": [], "total": 0}

    def mock_create_doc(db_id, col_id, doc_id, data):
        doc = {"$id": doc_id, **data}
        created_notifications.append(doc)
        return doc

    with patch("app.services.event_readiness_service.db.list_documents", side_effect=mock_list_docs), \
         patch("app.services.event_readiness_service.db.create_document", side_effect=mock_create_doc):

        # First trigger at 10 athletes -> creates notifications
        notified = await check_and_notify_event_readiness("event_102")
        assert notified is True
        assert len(created_notifications) == 10

        # Second trigger at 11 athletes -> idempotent, returns False without duplicating
        notified_again = await check_and_notify_event_readiness("event_102")
        assert notified_again is False
        assert len(created_notifications) == 10
