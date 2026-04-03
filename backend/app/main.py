"""
FastAPI 앱 진입점

실행:
  uvicorn app.main:app --reload --port 8000

배포 (Render):
  Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
"""
from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.models import history as _history_models  # noqa: F401 — 테이블 등록
from app.models import user as _user_models        # noqa: F401 — 테이블 등록
from app.routers import analyze, auth, history, upload

load_dotenv()

# 테이블 자동 생성 (SQLite)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MyWallet v2 API",
    description="감정 소비 분석 + 파일 업로드 충동소비 탐지 + 회원 이력 API",
    version="2.1.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 라우터 ────────────────────────────────────────────────────────────────────
app.include_router(analyze.router)
app.include_router(upload.router)
app.include_router(auth.router)
app.include_router(history.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "3.0.0"}
