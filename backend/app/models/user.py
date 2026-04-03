from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, String

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(String, primary_key=True)   # Google sub (고유 ID)
    email      = Column(String, unique=True, nullable=False)
    name       = Column(String)
    avatar_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
