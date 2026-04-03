from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    id_token: str   # Google OAuth id_token (프론트에서 NextAuth 통해 획득)


class TokenResponse(BaseModel):
    access_token: str
    user_id:      str
    email:        str
    name:         str | None
    avatar_url:   str | None


class UserOut(BaseModel):
    id:         str
    email:      str
    name:       str | None
    avatar_url: str | None
