import pytest

@pytest.mark.asyncio
async def test_register_and_login(client):
    # 1. Register a new user
    register_payload = {
        "email": "testathlete@sportix.com",
        "username": "testathlete",
        "full_name": "Test Athlete",
        "password": "testpassword123",
        "role": "athlete",
        "sport": "Football",
        "sports": ["Football"],
        "position": "GK",
        "experience_level": "beginner",
        "location": "London, UK",
        "city": "London",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "bio": "I am a test athlete profile.",
        "is_open_to_recruit": True
    }
    
    response = await client.post("/api/auth/register", json=register_payload)
    assert response.status_code == 210 or response.status_code == 201, response.text
    data = response.json()
    assert data["username"] == "testathlete"
    assert data["email"] == "testathlete@sportix.com"
    assert data["profile_theme"] == "default"

    # 2. Authenticate login
    login_payload = {
        "username": "testathlete",
        "password": "testpassword123"
    }
    
    response = await client.post("/api/auth/login", data=login_payload)
    assert response.status_code == 200, response.text
    login_data = response.json()
    assert "access_token" in login_data
    assert login_data["username"] == "testathlete"
    assert login_data["role"] == "athlete"
