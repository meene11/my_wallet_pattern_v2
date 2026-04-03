# 💸 MyWallet v2 — AI 감정 소비 분석 서비스

> 지출 + 감정 데이터로 소비 습관을 진단하고, AI 코치가 행동 변화까지 유도하는 개인 소비 관리 서비스

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)

---

## 📌 프로젝트 소개

**"결과 보여주는 앱"이 아닌 "행동을 바꾸는 앱"** 을 목표로 설계했습니다.

두 가지 방식으로 소비를 분석합니다:

- **직접 입력**: 금액 + 카테고리 + 감정(스트레스/보상/충동/필요) → 소비 유형 진단
- **파일 업로드**: 카드 거래내역 CSV/Excel → 충동소비 자동 탐지 + AI 코치

---

## 🎯 핵심 기능

### 📥 두 가지 분석 모드

| 모드 | 입력 | 분석 내용 |
|------|------|-----------|
| **직접 입력** | 금액 + 카테고리 + 감정 | 소비 유형 캐릭터화, 감정 소비 비율, 충동 지수 |
| **파일 업로드** | CSV / Excel 거래내역 | 5가지 규칙 기반 충동소비 탐지, 카테고리 분석 |

### 🔍 충동소비 5가지 탐지 기준 (슬라이더 커스텀 가능)

| 기준 | 설명 | 기본값 |
|------|------|--------|
| 카테고리 평균 초과 | 같은 카테고리 평균의 N배 넘는 결제 | 2.0배 |
| 야간 결제 | N시 이후 결제 | 21시 |
| 동일 카테고리 반복 | 하루 N건 이상 같은 카테고리 결제 | 3건 |
| 일평균 초과 | 하루 총 지출이 개인 일평균의 N배 초과 | 1.5배 |
| 주말 야간 | 토·일 야간 결제 자동 감지 | 고정 |

### 🤖 AI 소비 코치 가이드
- 버튼 클릭 시 공개되는 드라마틱한 reveal UX
- 행동 항목 체크리스트 (클릭 토글 + 진행률 바)
- 챌린지 시작 → 마이페이지에서 목표 달성 추적

### 👤 회원 기능 (Google 로그인)

| 구분 | 비회원 | 회원 |
|------|--------|------|
| 소비 분석 결과 요약 | ✅ | ✅ |
| 소비 패턴 시각화 | 🔒 blur | ✅ |
| 충동소비 의심 항목 | 🔒 blur | ✅ |
| AI 행동 가이드 | 🔒 blur | ✅ |
| 분석 이력 저장 | ❌ | ✅ |
| 마이페이지 (추이 차트) | ❌ | ✅ |
| 챌린지 진행 추적 | ❌ | ✅ |

### 📈 마이페이지
- 분석 이력 목록 (날짜별 카드, 클릭 시 상세 펼침)
- 충동소비 지수 추이 꺾은선 차트
- 챌린지 현황 프로그레스바
- 직접입력 / 파일업로드 출처별 표시

---

## 🧱 기술 스택

### Frontend (Vercel 배포)
| 기술 | 역할 |
|------|------|
| **Next.js 14** (App Router) | React 프레임워크 |
| **TypeScript** | 타입 안전성 |
| **Tailwind CSS** | 유틸리티 기반 스타일링 |
| **NextAuth.js v4** | Google OAuth 인증 |
| **Recharts** | 소비 패턴 시각화 |

### Backend (Render 배포)
| 기술 | 역할 |
|------|------|
| **FastAPI** | REST API 서버 |
| **Pydantic v2** | 요청/응답 스키마 검증 |
| **SQLAlchemy + SQLite** | 회원 데이터 저장 |
| **python-jose** | JWT 발급/검증 |
| **google-auth** | Google id_token 검증 |
| **Pandas + openpyxl** | CSV/Excel 거래내역 파싱 |
| **OpenAI GPT-4o mini** | 개인화 행동 가이드 (선택) |

---

## 🏗️ 전체 아키텍처

```
[Browser — Next.js 14 / Vercel]
    │
    ├── 직접 입력   → POST /analyze   → 감정 기반 소비 유형 분석
    ├── 파일 업로드 → POST /upload    → 충동소비 탐지 (pandas)
    ├── 로그인      → POST /auth/login → Google id_token 검증 → JWT 발급
    └── 이력 저장   → POST /history   → SQLite 저장
                                        ↓
                              [FastAPI — Render]
                                ├── /analyze   규칙 기반 + GPT-4o mini
                                ├── /upload    pandas 5가지 탐지 규칙
                                ├── /auth      Google OAuth + JWT
                                └── /history   SQLAlchemy CRUD
```

---

## 📁 프로젝트 구조

```
mywallet_v2/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── api/auth/[...nextauth]/route.ts   # NextAuth 핸들러
│       │   ├── mypage/page.tsx                    # 마이페이지
│       │   ├── layout.tsx                         # SessionProvider 래핑
│       │   └── page.tsx                           # 메인 (직접입력/파일업로드 탭)
│       ├── components/
│       │   ├── Hero.tsx
│       │   ├── InputCard.tsx                      # 직접 입력
│       │   ├── ResultCard.tsx                     # 한 줄 진단 + 결과 카드
│       │   ├── Charts.tsx
│       │   ├── ActionGuide.tsx                    # AI 코치 reveal UX ⭐
│       │   ├── UploadCard.tsx                     # 파일업로드 + 슬라이더
│       │   ├── UploadResult.tsx                   # 파일분석 결과
│       │   ├── AuthButton.tsx                     # 로그인/로그아웃
│       │   └── BlurGate.tsx                       # 비회원 blur 처리
│       ├── context/
│       │   └── AuthContext.tsx                    # 인증 상태 전역 관리
│       └── lib/
│           ├── types.ts
│           └── api.ts
│
└── backend/
    └── app/
        ├── main.py
        ├── core/
        │   ├── security.py                        # JWT 발급/검증
        │   └── deps.py                            # 인증 의존성
        ├── db/database.py                         # SQLAlchemy SQLite
        ├── models/
        │   ├── user.py
        │   └── history.py                         # 분석이력 + 챌린지
        ├── routers/
        │   ├── analyze.py                         # POST /analyze
        │   ├── upload.py                          # POST /upload
        │   ├── auth.py                            # POST /auth/login
        │   └── history.py                         # GET/POST /history
        ├── schemas/
        └── services/
            ├── analyzer.py
            ├── action_guide.py
            └── file_parser.py                     # 80+ 가맹점 키워드
```

---

## ⚙️ 로컬 실행

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

`.env` 설정:
```
OPENAI_API_KEY=sk-...              # 선택 (없으면 규칙 기반)
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
```

```bash
uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm install
```

`.env` 설정:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

```bash
npm run dev
# → http://localhost:3000
```

### Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) → OAuth 2.0 클라이언트 ID 생성
2. 승인된 JavaScript 원본: `http://localhost:3000`
3. 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`

---

## 🚀 배포

### Frontend → Vercel

1. GitHub 저장소 연결
2. Root Directory: `frontend`
3. Environment Variables:
```
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Backend → Render

1. Root Directory: `backend`
2. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Environment Variables:
```
ALLOWED_ORIGINS=https://your-app.vercel.app
OPENAI_API_KEY=sk-...
JWT_SECRET_KEY=your-secret
GOOGLE_CLIENT_ID=your-client-id
```

---

## 🤖 AI 분석 구조

```
[직접 입력 분석]
소비 데이터 (금액 + 감정 + 카테고리)
        ↓
1단계: 규칙 기반
  - 감정별 소비 비율 계산
  - 지배적 감정으로 소비 유형 결정 (≥40% 기준)
  - 충동 소비 지수 산출 (0~100점)
        ↓
2단계: GPT-4o mini (API 키 있을 때)
  - 데이터 기반 개인화 프롬프트
  - hallucination 방지 규칙 내장
        ↓
AI 소비 코치 가이드 공개 (reveal UX)

[파일 업로드 분석]
CSV/Excel 거래내역
        ↓
pandas 파싱 (80+ 가맹점 키워드 자동 분류)
        ↓
5가지 충동소비 탐지 규칙 (커스텀 임계값 적용)
        ↓
충동소비 지수 + AI 코치 멘트
```

**소비 유형 4종:**

| 유형 | 판별 기준 |
|------|-----------|
| 🔥 스트레스 해소형 | 스트레스 감정 ≥ 40% |
| 🎁 보상 추구형 | 보상 감정 ≥ 40% |
| ⚡ 충동 소비형 | 충동 감정 ≥ 40% |
| ⚖️ 균형 소비형 | 단일 감정 < 40% |

**충동소비 지수 등급:**

| 점수 | 등급 | 이모지 |
|------|------|--------|
| 0–30 | 안전 | 😊 |
| 31–50 | 주의 | 😐 |
| 51–70 | 위험 | 😟 |
| 71–100 | 매우 위험 | 😡 |

---

## 📊 v1 → v2 발전 비교

| 항목 | v1 (Streamlit) | v2 (React+FastAPI) |
|------|---------------|---------------------|
| 프레임워크 | Streamlit | Next.js 14 + FastAPI |
| 배포 | Streamlit Cloud | Vercel + Render |
| 인증 | 없음 | Google OAuth + JWT |
| 데이터 저장 | 없음 | SQLite (분석이력, 챌린지) |
| 분석 방식 | 파일 업로드 | 직접입력 + 파일업로드 |
| 결과 UX | 텍스트 나열 | 한 줄 진단 + 체크리스트 |
| 회원 기능 | 없음 | 마이페이지 + 추이 차트 |

---

## 🔗 관련

- **v1**: [meene11/my_wallet_pattern](https://github.com/meene11/my_wallet_pattern)

*Built with Claude Code*
