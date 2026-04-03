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

from app.routers import analyze

load_dotenv()

app = FastAPI(
    title="MyWallet v3 API",
    description="감정 소비 분석 + 행동 가이드 API",
    version="3.0.0",
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


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "3.0.0"}
