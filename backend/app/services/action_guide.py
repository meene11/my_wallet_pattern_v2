"""
action_guide.py — 행동 가이드 생성

v1 RAG 전략 계승 (단순화):
  1단계: 규칙 기반 (API 키 없어도 완전 동작)
  2단계: GPT-4o mini (OPENAI_API_KEY 있을 때 자동 활성화)
"""
from __future__ import annotations

import os
from typing import Any

_RULES: dict[str, dict[str, Any]] = {
    "stress": {
        "warnings": [
            "스트레스 소비가 높게 감지되었습니다",
            "감정이 소비를 이끌고 있는 패턴입니다",
        ],
        "actions": [
            "쇼핑 앱 열기 전, 20분 산책 또는 스트레칭을 먼저 해보세요",
            "야식·배달 충동 시 단백질 간식(견과류 등)으로 대체해보세요",
            "스트레스 상황에서 구매 대신 5분 호흡 명상을 실험해보세요",
        ],
        "challenge": "오늘 소비 줄이기",
    },
    "reward": {
        "warnings": [
            "보상 목적 소비 비중이 높습니다",
            "계획적 보상 예산 설정을 추천합니다",
        ],
        "actions": [
            "주간 보상 예산을 미리 정해두세요 (예: 3만원)",
            "구매 전 24시간 대기 규칙 — 하루 뒤에도 원하면 구매하세요",
            "소비 대신 활동으로 보상하는 습관을 만들어보세요 (영화, 운동 등)",
        ],
        "challenge": "이번 주 보상 예산 지키기",
    },
    "impulse": {
        "warnings": [
            "충동 소비가 높게 나타납니다",
            "계획 없는 소비 패턴이 감지되었습니다",
        ],
        "actions": [
            "구매 전 '이게 정말 필요한가?' 3초 체크 습관을 만들어보세요",
            "장바구니에 담고 24시간 뒤 재확인 — 욕구가 사라지면 삭제",
            "주간 소비 카테고리별 한도를 미리 적어두세요",
        ],
        "challenge": "충동 구매 없는 하루",
    },
    "balanced": {
        "warnings": [
            "현재 소비 패턴이 안정적입니다",
            "지금 흐름을 유지하면서 저축 비율을 점검해보세요",
        ],
        "actions": [
            "이 좋은 패턴을 유지하세요 — 월 저축률을 한 단계 높여볼 시기입니다",
            "카테고리별 월간 예산 상한을 설정하면 더욱 탄탄해집니다",
            "비상금 목표를 세우고 매달 소액씩 적립해보세요",
        ],
        "challenge": "이번 달 저축 늘리기",
    },
}


def get_action_guide(analysis: dict[str, Any]) -> dict[str, Any]:
    """분석 결과를 받아 행동 가이드 반환. API 키 있으면 LLM 사용."""
    type_key: str = analysis.get("spending_type_key", "balanced")
    rules = _RULES.get(type_key, _RULES["balanced"])

    if os.getenv("OPENAI_API_KEY"):
        try:
            return _llm_guide(analysis, rules)
        except Exception:
            pass  # LLM 실패 시 규칙 기반 폴백

    return {**rules, "source": "rule"}


def _llm_guide(analysis: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    """GPT-4o mini 기반 개인화 행동 가이드 (v1 프롬프트 엔지니어링 전략 계승)"""
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    emotion_str = ", ".join(f"{k} {v}%" for k, v in analysis.get("emotion_ratios", {}).items())
    cat_str = ", ".join(f"{k} {v}%" for k, v in analysis.get("cat_ratios", {}).items())

    prompt = f"""당신은 친근하고 실용적인 소비 코치입니다.

소비 분석 결과:
- 소비 유형: {analysis.get('spending_type', {}).get('name', '')}
- 총 소비: {analysis.get('total', 0):,}원 ({analysis.get('count', 0)}건)
- 감정별 비율: {emotion_str}
- 카테고리별 비율: {cat_str}
- 충동 소비 지수: {analysis.get('impulse_score', 0)}점
- 감정 소비 비율: {analysis.get('emotion_spending_ratio', 0)}%

위 데이터에만 근거한 구체적인 행동 가이드 2개를 한국어로 작성하세요.
데이터에 없는 카테고리나 감정은 절대 언급하지 마세요.

형식 (정확히 지키세요):
행동1: (한 문장)
행동2: (한 문장)"""

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=200,
    )

    lines = resp.choices[0].message.content.strip().splitlines()
    actions = [
        ln.split(":", 1)[-1].strip()
        for ln in lines
        if ln.startswith("행동") and ":" in ln
    ]

    if len(actions) < 2:
        return {**fallback, "source": "rule"}

    return {
        "warnings": fallback["warnings"],
        "actions": actions,
        "challenge": fallback["challenge"],
        "source": "llm",
    }
