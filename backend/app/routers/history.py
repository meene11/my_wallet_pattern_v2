"""분석 이력 저장 · 조회 + 챌린지 관리"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.history import AnalysisHistory, Challenge
from app.models.user import User
from app.schemas.history import (
    ChallengeOut,
    ChallengeRequest,
    HistoryItem,
    SaveHistoryRequest,
)

router = APIRouter(prefix="/history", tags=["history"])


# ── 분석 이력 ──────────────────────────────────────────────────────────────────

@router.post("", response_model=HistoryItem)
def save_history(
    req: SaveHistoryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """분석 결과를 DB에 저장"""
    record = AnalysisHistory(
        user_id        = current_user.id,
        total          = req.total,
        count          = req.count,
        impulse_score  = req.impulse_score,
        impulse_ratio  = req.impulse_ratio,
        impulse_amount = req.impulse_amount,
        impulse_count  = req.impulse_count,
        cat_ratios     = req.cat_ratios,
        impulse_items  = req.impulse_items,
        action_guide   = req.action_guide,
        thresholds     = req.thresholds,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=list[HistoryItem])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """내 분석 이력 전체 조회 (최신순)"""
    return (
        db.query(AnalysisHistory)
        .filter(AnalysisHistory.user_id == current_user.id)
        .order_by(AnalysisHistory.analyzed_at.desc())
        .all()
    )


# ── 챌린지 ────────────────────────────────────────────────────────────────────

@router.post("/challenge", response_model=ChallengeOut)
def start_challenge(
    req: ChallengeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """챌린지 시작 (기존 active 챌린지 자동 종료 후 신규 생성)"""
    db.query(Challenge).filter(
        Challenge.user_id == current_user.id,
        Challenge.status  == "active",
    ).update({"status": "failed"})

    challenge = Challenge(user_id=current_user.id, target_score=req.target_score)
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge


@router.get("/challenge/active", response_model=ChallengeOut | None)
def get_active_challenge(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """현재 진행 중인 챌린지 조회"""
    return (
        db.query(Challenge)
        .filter(
            Challenge.user_id == current_user.id,
            Challenge.status  == "active",
        )
        .first()
    )
