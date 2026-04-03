from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class SaveHistoryRequest(BaseModel):
    source:         str            # "input" | "upload"
    total:          int
    count:          int
    impulse_score:  int
    cat_ratios:     dict[str, float]
    action_guide:   dict

    # 파일 업로드 전용 (선택)
    impulse_ratio:  float | None = None
    impulse_amount: int   | None = None
    impulse_count:  int   | None = None
    impulse_items:  list[dict]   = []
    thresholds:     dict  | None = None

    # 직접 입력 전용 (선택)
    emotion_ratios:         dict[str, float] | None = None
    emotion_spending_ratio: float            | None = None
    dominant_emotion:       str              | None = None
    spending_type_key:      str              | None = None
    spending_type:          dict             | None = None


class HistoryItem(BaseModel):
    id:          int
    analyzed_at: datetime
    source:      str
    total:       int
    count:       int
    impulse_score: int
    cat_ratios:  dict[str, float]
    action_guide: dict

    # 파일 업로드 전용
    impulse_ratio:  float      | None = None
    impulse_amount: int        | None = None
    impulse_count:  int        | None = None
    impulse_items:  list[dict] = []
    thresholds:     dict       | None = None

    # 직접 입력 전용
    emotion_ratios:         dict[str, float] | None = None
    emotion_spending_ratio: float            | None = None
    dominant_emotion:       str              | None = None
    spending_type_key:      str              | None = None
    spending_type:          dict             | None = None

    model_config = {"from_attributes": True}


class ChallengeRequest(BaseModel):
    target_score: int


class ChallengeOut(BaseModel):
    id:           int
    started_at:   datetime
    target_score: int
    status:       str

    model_config = {"from_attributes": True}
