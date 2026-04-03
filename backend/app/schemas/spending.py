"""Pydantic v2 스키마 — API 요청/응답 타입 정의"""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


# ── 요청 ─────────────────────────────────────────────────────────────────────

VALID_EMOTIONS = {"스트레스", "보상", "충동", "필요"}
VALID_CATEGORIES = {"식비", "배달", "카페", "쇼핑", "편의점", "교통", "구독", "의료", "여가", "기타"}


class SpendingEntry(BaseModel):
    amount: int = Field(..., gt=0, description="소비 금액 (원)")
    category: str = Field(..., description="소비 카테고리")
    emotion: str = Field(..., description="소비 당시 감정")

    @field_validator("emotion")
    @classmethod
    def validate_emotion(cls, v: str) -> str:
        if v not in VALID_EMOTIONS:
            raise ValueError(f"emotion must be one of {VALID_EMOTIONS}")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {VALID_CATEGORIES}")
        return v


class AnalyzeRequest(BaseModel):
    entries: list[SpendingEntry] = Field(..., min_length=1, description="소비 기록 목록")


# ── 응답 ─────────────────────────────────────────────────────────────────────

class SpendingTypeDetail(BaseModel):
    name: str
    summary: str
    characteristics: list[str]


class ActionGuideDetail(BaseModel):
    warnings: list[str]
    actions: list[str]
    challenge: str
    source: str  # "rule" | "llm"


class AnalyzeResponse(BaseModel):
    total: int
    count: int
    emotion_ratios: dict[str, float]
    cat_ratios: dict[str, float]
    spending_type_key: str
    spending_type: SpendingTypeDetail
    impulse_score: int
    emotion_spending_ratio: float
    dominant_emotion: str
    action_guide: ActionGuideDetail
