"""POST /analyze — 소비 분석 엔드포인트"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.spending import AnalyzeRequest, AnalyzeResponse
from app.services.action_guide import get_action_guide
from app.services.analyzer import analyze_spending

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze(body: AnalyzeRequest) -> AnalyzeResponse:
    """
    소비 기록 리스트를 받아 감정 기반 분석 + 행동 가이드를 반환합니다.
    """
    raw_entries = [e.model_dump() for e in body.entries]

    analysis = analyze_spending(raw_entries)
    if not analysis:
        raise HTTPException(status_code=422, detail="분석할 데이터가 없습니다.")

    guide = get_action_guide(analysis)

    return AnalyzeResponse(
        total=analysis["total"],
        count=analysis["count"],
        emotion_ratios=analysis["emotion_ratios"],
        cat_ratios=analysis["cat_ratios"],
        spending_type_key=analysis["spending_type_key"],
        spending_type=analysis["spending_type"],
        impulse_score=analysis["impulse_score"],
        emotion_spending_ratio=analysis["emotion_spending_ratio"],
        dominant_emotion=analysis["dominant_emotion"],
        action_guide=guide,
    )
