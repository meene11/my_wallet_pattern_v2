from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String

from app.db.database import Base


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    user_id        = Column(String, ForeignKey("users.id"), nullable=False)
    analyzed_at    = Column(DateTime, default=datetime.utcnow)

    # 요약 수치
    total          = Column(Integer)
    count          = Column(Integer)
    impulse_score  = Column(Integer)
    impulse_ratio  = Column(Float)
    impulse_amount = Column(Integer)
    impulse_count  = Column(Integer)

    # JSON 블롭
    cat_ratios     = Column(JSON)
    impulse_items  = Column(JSON)
    action_guide   = Column(JSON)
    thresholds     = Column(JSON)   # 분석에 쓰인 임계값


class Challenge(Base):
    __tablename__ = "challenges"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    started_at   = Column(DateTime, default=datetime.utcnow)
    target_score = Column(Integer)                    # 목표 충동 소비 지수
    status       = Column(String, default="active")   # active | completed | failed
