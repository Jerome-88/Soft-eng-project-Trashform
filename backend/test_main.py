from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200

def test_analyze_endpoint_without_file():
    response = client.post("/analyze")
    assert response.status_code in [400, 422]
