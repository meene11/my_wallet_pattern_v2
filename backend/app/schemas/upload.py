"""파일 업로드 분석 응답 스키마"""
from __future__ import annotations
from pydantic import BaseModel
from app.schemas.spending import ActionGuideDetail


class ImpulseItem(BaseModel):
    date:           str
    merchant:       str
    amount:         int
    category:       str
    impulse_reason: str


class UploadAnalyzeResponse(BaseModel):
    total:           int
    count:           int
    impulse_count:   int
    impulse_amount:  int
    impulse_ratio:   float    # 충동소비 비율 (%)
    impulse_score:   int      # 충동 소비 지수 0–100
    cat_ratios:      dict[str, float]
    impulse_items:   list[ImpulseItem]
    action_guide:    ActionGuideDetail
