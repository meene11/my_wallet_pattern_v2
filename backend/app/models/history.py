from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String

from app.db.database import Base


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    source      = Column(String, default="upload")   # "input" | "upload"

    # 공통 수치
    total         = Column(Integer)
    count         = Column(Integer)
    impulse_score = Column(Integer)

    # 파일 업로드 전용
    impulse_ratio  = Column(Float,   nullable=True)
    impulse_amount = Column(Integer, nullable=True)
    impulse_count  = Column(Integer, nullable=True)

    # JSON 블롭 (공통)
    cat_ratios   = Column(JSON)
    action_guide = Column(JSON)

    # JSON 블롭 (파일 업로드)
    impulse_items = Column(JSON, nullable=True)
    thresholds    = Column(JSON, nullable=True)

    # JSON 블롭 (직접 입력)
    emotion_ratios         = Column(JSON,    nullable=True)
    emotion_spending_ratio = Column(Float,   nullable=True)
    dominant_emotion       = Column(String,  nullable=True)
    spending_type_key      = Column(String,  nullable=True)
    spending_type          = Column(JSON,    nullable=True)


class Challenge(Base):
    __tablename__ = "challenges"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    started_at   = Column(DateTime, default=datetime.utcnow)
    target_score = Column(Integer)                    # 목표 충동 소비 지수
    status       = Column(String, default="active")   # active | completed | failed
