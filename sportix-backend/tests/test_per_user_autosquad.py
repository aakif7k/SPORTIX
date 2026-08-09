import pytest
import asyncio
from unittest.mock import MagicMock, patch
from app.core.config import settings
from app.services import ai_squad_service
from app.schemas.ai import AutoSquadRequest

@pytest.mark.asyncio
async def test_per_user_daily_quota_isolation():
    settings.max_autosquad_generations = 5
    user_a = "user_alpha_111"
    user_b = "user_beta_222"
    user_c = "user_gamma_333"

    mock_db_docs = []

    def mock_list_documents(db_id, col_id, queries=None):
        user_id_param = None
        for q in (queries or []):
            if hasattr(q, 'attribute') and q.attribute == 'user_id':
                user_id_param = q.values[0] if hasattr(q, 'values') and q.values else None

        filtered = [d for d in mock_db_docs if d.get("user_id") == user_id_param] if user_id_param else mock_db_docs
        return {"documents": filtered, "total": len(filtered)}

    def mock_create_document(db_id, col_id, doc_id, data):
        doc = {"$id": doc_id, "$createdAt": "2026-08-09T00:00:00.000Z", **data}
        mock_db_docs.append(doc)
        return doc

    def mock_get_document(db_id, col_id, doc_id):
        return {"$id": doc_id, "full_name": f"User {doc_id}", "experience_level": "pro", "sport": "Football"}

    with patch("app.services.ai_squad_service.db.list_documents", side_effect=mock_list_documents), \
         patch("app.services.ai_squad_service.db.create_document", side_effect=mock_create_document), \
         patch("app.services.ai_squad_service.db.get_document", side_effect=mock_get_document):

        # 1. Initially, all users have 5 remaining
        rem_a = await ai_squad_service.get_remaining(user_a)
        rem_b = await ai_squad_service.get_remaining(user_b)
        rem_c = await ai_squad_service.get_remaining(user_c)

        assert rem_a["remaining"] == 5
        assert rem_b["remaining"] == 5
        assert rem_c["remaining"] == 5

        # 2. User A uses 5 generations
        payload = AutoSquadRequest(sport="Football", radius_km=25.0)
        for i in range(5):
            await ai_squad_service.generate(user_a, payload)

        rem_a_after = await ai_squad_service.get_remaining(user_a)
        rem_b_after = await ai_squad_service.get_remaining(user_b)
        rem_c_after = await ai_squad_service.get_remaining(user_c)

        # User A has 0 remaining
        assert rem_a_after["remaining"] == 0

        # User B and User C MUST still have 5 remaining!
        assert rem_b_after["remaining"] == 5
        assert rem_c_after["remaining"] == 5

        # 3. User A attempting 6th generation throws limit error
        with pytest.raises(ValueError) as exc:
            await ai_squad_service.generate(user_a, payload)
        assert "limit reached" in str(exc.value).lower()

        # 4. User B generates once -> User B has 4 remaining, User A stays 0, User C stays 5
        await ai_squad_service.generate(user_b, payload)

        rem_a_final = await ai_squad_service.get_remaining(user_a)
        rem_b_final = await ai_squad_service.get_remaining(user_b)
        rem_c_final = await ai_squad_service.get_remaining(user_c)

        assert rem_a_final["remaining"] == 0
        assert rem_b_final["remaining"] == 4
        assert rem_c_final["remaining"] == 5
