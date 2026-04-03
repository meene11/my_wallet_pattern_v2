"""단위 테스트 — 분석 서비스 로직"""
import pytest

from app.services.analyzer import analyze_spending, SPENDING_TYPES


# ── fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def stress_entries():
    return [
        {"amount": 18_000, "category": "배달", "emotion": "스트레스"},
        {"amount": 5_000,  "category": "편의점", "emotion": "스트레스"},
        {"amount": 3_000,  "category": "카페",   "emotion": "필요"},
    ]


@pytest.fixture
def impulse_entries():
    return [
        {"amount": 50_000, "category": "쇼핑",  "emotion": "충동"},
        {"amount": 12_000, "category": "식비",  "emotion": "충동"},
        {"amount": 8_000,  "category": "카페",  "emotion": "보상"},
    ]


@pytest.fixture
def balanced_entries():
    return [
        {"amount": 10_000, "category": "식비",  "emotion": "필요"},
        {"amount": 8_000,  "category": "교통",  "emotion": "필요"},
        {"amount": 5_000,  "category": "카페",  "emotion": "보상"},
    ]


# ── tests ─────────────────────────────────────────────────────────────────────

def test_empty_entries_returns_empty():
    assert analyze_spending([]) == {}


def test_stress_type_detected(stress_entries):
    result = analyze_spending(stress_entries)
    assert result["spending_type_key"] == "stress"


def test_impulse_type_detected(impulse_entries):
    result = analyze_spending(impulse_entries)
    assert result["spending_type_key"] == "impulse"


def test_balanced_type_detected(balanced_entries):
    result = analyze_spending(balanced_entries)
    assert result["spending_type_key"] == "balanced"


def test_total_is_sum_of_amounts(stress_entries):
    result = analyze_spending(stress_entries)
    expected = sum(e["amount"] for e in stress_entries)
    assert result["total"] == expected


def test_impulse_score_is_0_to_100(stress_entries):
    result = analyze_spending(stress_entries)
    assert 0 <= result["impulse_score"] <= 100


def test_emotion_ratios_sum_to_100(stress_entries):
    result = analyze_spending(stress_entries)
    total_ratio = sum(result["emotion_ratios"].values())
    assert abs(total_ratio - 100.0) < 0.5  # floating point tolerance


def test_cat_ratios_sum_to_100(stress_entries):
    result = analyze_spending(stress_entries)
    total_ratio = sum(result["cat_ratios"].values())
    assert abs(total_ratio - 100.0) < 0.5


def test_all_spending_types_defined():
    for key in ("stress", "reward", "impulse", "balanced"):
        assert key in SPENDING_TYPES
        t = SPENDING_TYPES[key]
        assert "name" in t
        assert "summary" in t
        assert "characteristics" in t


def test_single_entry():
    entries = [{"amount": 10_000, "category": "식비", "emotion": "필요"}]
    result = analyze_spending(entries)
    assert result["count"] == 1
    assert result["total"] == 10_000
    assert result["emotion_spending_ratio"] == 0.0  # 필요 제외
