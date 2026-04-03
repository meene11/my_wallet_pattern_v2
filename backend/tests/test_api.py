"""통합 테스트 — FastAPI 엔드포인트"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_analyze_success():
    payload = {
        "entries": [
            {"amount": 15000, "category": "배달", "emotion": "스트레스"},
            {"amount": 5000,  "category": "편의점", "emotion": "충동"},
        ]
    }
    resp = client.post("/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "spending_type_key" in data
    assert "impulse_score" in data
    assert "action_guide" in data
    assert 0 <= data["impulse_score"] <= 100


def test_analyze_empty_entries_rejected():
    resp = client.post("/analyze", json={"entries": []})
    assert resp.status_code == 422


def test_analyze_invalid_emotion_rejected():
    payload = {
        "entries": [{"amount": 10000, "category": "식비", "emotion": "분노"}]
    }
    resp = client.post("/analyze", json=payload)
    assert resp.status_code == 422


def test_analyze_invalid_amount_rejected():
    payload = {
        "entries": [{"amount": 0, "category": "식비", "emotion": "필요"}]
    }
    resp = client.post("/analyze", json=payload)
    assert resp.status_code == 422


def test_analyze_response_shape():
    payload = {
        "entries": [
            {"amount": 30000, "category": "쇼핑", "emotion": "보상"},
        ]
    }
    resp = client.post("/analyze", json=payload)
    data = resp.json()
    required_keys = {
        "total", "count", "emotion_ratios", "cat_ratios",
        "spending_type_key", "spending_type", "impulse_score",
        "emotion_spending_ratio", "dominant_emotion", "action_guide",
    }
    assert required_keys.issubset(data.keys())
    assert set(data["spending_type"].keys()) == {"name", "summary", "characteristics"}
    assert set(data["action_guide"].keys()) == {"warnings", "actions", "challenge", "source"}
