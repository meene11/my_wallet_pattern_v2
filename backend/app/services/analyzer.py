"""
analyzer.py — 감정 소비 분석 로직 (규칙 기반)

하이브리드 AI 전략:
  1단계: 규칙 기반 → 감정 비율 / 소비 유형 / 충동 지수
  2단계: LLM → action_guide.py에서 주입 (선택)
"""
from __future__ import annotations

from typing import Any

import pandas as pd

SPENDING_TYPES: dict[str, dict[str, Any]] = {
    "stress": {
        "name": "🔥 스트레스 해소형",
        "summary": "스트레스를 받을 때 소비가 증가하는 패턴입니다.",
        "characteristics": [
            "감정 해소 수단으로 소비를 사용",
            "식비·배달·카페 비중 높음",
            "소비 후 죄책감 사이클 반복 가능",
        ],
    },
    "reward": {
        "name": "🎁 보상 추구형",
        "summary": "스스로에게 보상하기 위해 소비하는 패턴입니다.",
        "characteristics": [
            "쇼핑·여가 비중 높음",
            "이벤트(주말, 월급날) 집중 소비",
            "구매 자체에서 만족감을 찾음",
        ],
    },
    "impulse": {
        "name": "⚡ 충동 소비형",
        "summary": "계획 없이 즉흥적으로 소비하는 패턴입니다.",
        "characteristics": [
            "다양한 카테고리에 분산 소비",
            "소액 다건 패턴",
            "구매 전 검토 시간 부족",
        ],
    },
    "balanced": {
        "name": "⚖️ 균형 소비형",
        "summary": "감정보다 필요에 의한 안정적인 소비 패턴입니다.",
        "characteristics": [
            "카테고리 균등 분산",
            "일정하고 예측 가능한 소비",
            "계획적 소비 경향",
        ],
    },
}

EMOTION_RISK_WEIGHT: dict[str, float] = {
    "스트레스": 1.0,
    "충동": 1.0,
    "보상": 0.6,
    "필요": 0.0,
}


def analyze_spending(entries: list[dict[str, Any]]) -> dict[str, Any]:
    """
    소비 기록 리스트를 받아 분석 결과 딕셔너리 반환.

    Parameters
    ----------
    entries : list of dict with keys: amount (int), category (str), emotion (str)

    Returns
    -------
    dict with keys:
        total, count, emotion_ratios, cat_ratios,
        spending_type_key, spending_type,
        impulse_score, emotion_spending_ratio, dominant_emotion
    """
    if not entries:
        return {}

    df = pd.DataFrame(entries)
    total: int = int(df["amount"].sum())

    # 감정별 / 카테고리별 집계
    emotion_totals = df.groupby("emotion")["amount"].sum()
    emotion_ratios: dict[str, float] = (emotion_totals / total * 100).round(1).to_dict()

    cat_totals = df.groupby("category")["amount"].sum()
    cat_ratios: dict[str, float] = (cat_totals / total * 100).round(1).to_dict()

    # 지배적 감정
    dominant_emotion: str = emotion_totals.idxmax()
    dominant_ratio: float = float(emotion_ratios.get(dominant_emotion, 0))

    # 소비 유형 결정 (40% 이상이어야 단독 확정)
    type_map = {"스트레스": "stress", "보상": "reward", "충동": "impulse"}
    spending_type_key = (
        type_map[dominant_emotion]
        if dominant_emotion in type_map and dominant_ratio >= 40
        else "balanced"
    )

    # 충동 소비 지수 (0–100)
    weighted_risk = sum(
        float(df.loc[df["emotion"] == em, "amount"].sum()) * w
        for em, w in EMOTION_RISK_WEIGHT.items()
    )
    base_score = weighted_risk / total * 100 if total > 0 else 0.0

    avg_amount = float(df["amount"].mean())
    high_single = bool((df["amount"] > avg_amount * 3).any())
    impulse_score: int = min(100, int(base_score) + (10 if high_single else 0))

    # 감정 소비 비율 (필요 제외)
    emotional_total = float(df[df["emotion"] != "필요"]["amount"].sum())
    emotion_spending_ratio: float = round(emotional_total / total * 100, 1) if total > 0 else 0.0

    return {
        "total": total,
        "count": len(entries),
        "emotion_ratios": emotion_ratios,
        "cat_ratios": cat_ratios,
        "spending_type_key": spending_type_key,
        "spending_type": SPENDING_TYPES[spending_type_key],
        "impulse_score": impulse_score,
        "emotion_spending_ratio": emotion_spending_ratio,
        "dominant_emotion": dominant_emotion,
    }
