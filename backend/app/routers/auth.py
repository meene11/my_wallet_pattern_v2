"""POST /auth/login  —  Google id_token 검증 후 앱 JWT 발급"""
from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import GoogleLoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def google_login(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Google id_token 검증 → 사용자 생성/조회 → 앱 JWT 반환"""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    if not google_client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not configured")

    try:
        idinfo = google_id_token.verify_oauth2_token(
            req.id_token,
            google_requests.Request(),
            google_client_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")

    google_id  = idinfo["sub"]
    email      = idinfo.get("email", "")
    name       = idinfo.get("name")
    avatar_url = idinfo.get("picture")

    user = db.query(User).filter(User.id == google_id).first()
    if not user:
        user = User(id=google_id, email=email, name=name, avatar_url=avatar_url)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """현재 로그인 사용자 정보 반환"""
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
    )
