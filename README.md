# 💸 MyWallet v2 — 감정 소비 분석 서비스

> 지출 + 감정 데이터를 기반으로 소비 습관을 진단하고, 행동 변화까지 유도하는 개인 소비 코치

---

## 📌 프로젝트 소개

단순히 결과를 보여주는 앱이 아닙니다.

**"결과 보여주는 앱" → "행동 바꾸는 앱"** 을 목표로 설계했습니다.

소비 금액과 당시 감정(스트레스 / 보상 / 충동)을 입력하면:
- 소비 유형을 캐릭터화 (🔥 스트레스 해소형 등)
- 충동 소비 지수 + 감정 소비 비율을 수치로 제공
- 행동 가이드 + 챌린지로 실제 변화를 유도

---

## 🎯 핵심 기능

| 섹션 | 기능 |
|------|------|
| **Hero** | 서비스 컨셉 전달 + Before/After 메시지 |
| **Input** | 금액 / 카테고리 / 감정 3단 입력 카드 |
| **Result** | 소비 유형 캐릭터화 + 충동 소비 지수 + 감정 소비 비율 |
| **Charts** | 카테고리 도넛 차트 + 감정 막대 차트 |
| **Action Guide** | 유형별 맞춤 행동 가이드 + 챌린지 버튼 |
| **Re-engagement** | 재방문 유도 + 추가 기록 CTA |

---

## 🧱 기술 스택

### Frontend (Vercel 배포)
| 기술 | 역할 |
|------|------|
| **Next.js 14** (App Router) | React 프레임워크 |
| **TypeScript** | 타입 안전성 |
| **Tailwind CSS** | 유틸리티 기반 스타일링 |
| **Recharts** | 소비 패턴 시각화 |
| **Vitest** | 단위 테스트 |

### Backend (Render 배포)
| 기술 | 역할 |
|------|------|
| **FastAPI** | REST API 서버 |
| **Pydantic v2** | 요청/응답 스키마 검증 |
| **Pandas** | 소비 데이터 집계 분석 |
| **OpenAI GPT-4o mini** | 개인화 행동 가이드 생성 (선택) |
| **pytest** | 단위 + 통합 테스트 |

---

## 🏗️ 전체 아키텍처

```
[Browser]
    │  Next.js 14 (Vercel)
    │  React + TypeScript + Tailwind
    │
    │  POST /analyze
    ▼
[FastAPI] (Render)
    ├── Pydantic v2 스키마 검증
    ├── 1단계: 규칙 기반 분석
    │     감정 비율 / 소비 유형 / 충동 지수
    └── 2단계: GPT-4o mini (API 키 있을 때)
              개인화 행동 가이드 생성
```

### API 계약

```
POST /analyze
Body:  { "entries": [{ "amount": 15000, "category": "배달", "emotion": "스트레스" }] }
Response: {
  "spending_type_key": "stress",
  "spending_type": { "name": "🔥 스트레스 해소형", ... },
  "impulse_score": 72,
  "emotion_spending_ratio": 65.0,
  "action_guide": { "warnings": [...], "actions": [...], "challenge": "..." }
}
```

---

## 📁 프로젝트 구조

```
my_wallet_pattern_v2/
├── frontend/                          # Next.js 앱 (Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # 단일 페이지 (6섹션)
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── Hero.tsx               # [1] 히어로 섹션
│   │   │   ├── InputCard.tsx          # [2] 소비 입력 카드
│   │   │   ├── ResultCard.tsx         # [3] 분석 결과 요약
│   │   │   ├── Charts.tsx             # [4] 도넛 + 막대 차트
│   │   │   ├── ActionGuide.tsx        # [5] 행동 가이드 ⭐
│   │   │   └── ReEngagement.tsx       # [6] 재방문 유도
│   │   ├── hooks/
│   │   │   └── useSpending.ts         # 소비 상태 관리 훅
│   │   ├── lib/
│   │   │   ├── types.ts               # TypeScript 타입 정의
│   │   │   └── api.ts                 # fetch 클라이언트
│   │   └── __tests__/
│   │       └── api.test.ts            # Vitest API 테스트
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                           # FastAPI 서버 (Render)
│   ├── app/
│   │   ├── main.py                    # 앱 진입점 + CORS 설정
│   │   ├── routers/
│   │   │   └── analyze.py             # POST /analyze
│   │   ├── schemas/
│   │   │   └── spending.py            # Pydantic v2 스키마
│   │   └── services/
│   │       ├── analyzer.py            # 규칙 기반 분석 로직
│   │       └── action_guide.py        # 행동 가이드 (규칙 + LLM)
│   ├── tests/
│   │   ├── test_analyzer.py           # 단위 테스트 9개
│   │   └── test_api.py                # 통합 테스트 6개
│   └── requirements.txt
│
├── .claude/
│   └── settings.json                  # Claude Code 하네스 훅
└── .gitignore
```

---

## ⚙️ 로컬 실행

### 1. Backend

```bash
cd backend

# 가상환경 생성 (선택)
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux

# 패키지 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에서 OPENAI_API_KEY 입력 (선택 — 없으면 규칙 기반 동작)

# 서버 실행
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs 에서 Swagger UI 확인 가능
```

### 2. Frontend

```bash
cd frontend

# 패키지 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000

# 개발 서버 실행
npm run dev
# → http://localhost:3000
```

---

## 🧪 테스트

```bash
# Backend 테스트 (pytest)
cd backend
pytest tests/ -v

# Frontend 테스트 (Vitest)
cd frontend
npm test

# TypeScript 타입 검사
npm run type-check
```

**Backend 테스트 커버리지:**
- `test_analyzer.py` — 분석 로직 단위 테스트 9개 (유형 판별, 점수 계산, 비율 합산 등)
- `test_api.py` — FastAPI 통합 테스트 6개 (정상 응답, 유효성 검사, 응답 구조 검증)

---

## 🚀 배포

### Frontend → Vercel

1. Vercel에서 이 저장소 연결
2. **Root Directory**: `frontend`
3. **Environment Variables** 추가:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com
   ```

### Backend → Render

1. Render에서 새 Web Service 생성
2. **Root Directory**: `backend`
3. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables** 추가:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app
   OPENAI_API_KEY=sk-...   # 선택사항
   ```

---

## 🤖 AI 분석 구조

v1(MyWallet)의 하이브리드 AI 전략을 계승:

```
소비 입력 (금액 + 감정 + 카테고리)
        │
        ▼
[1단계: 규칙 기반 분석]
 ├── 감정별 소비 비율 계산
 ├── 지배적 감정으로 소비 유형 결정 (40% 이상 기준)
 └── 충동 소비 지수 산출 (감정 위험 가중치 × 금액 보정)
        │
        ▼
[2단계: GPT-4o mini] ← OPENAI_API_KEY 있을 때 자동 활성화
 ├── 소비 데이터 기반 개인화 프롬프트
 ├── hallucination 방지: 데이터에 없는 항목 언급 금지 규칙
 └── temperature=0.7 (창의성 ↔ 정확성 균형)
        │
        ▼
[행동 가이드 출력]
 ├── 경고 메시지 (유형별 맞춤)
 ├── 행동 추천 2개
 └── 챌린지 버튼
```

**소비 유형 4종:**

| 유형 | 기준 | 특징 |
|------|------|------|
| 🔥 스트레스 해소형 | 스트레스 감정 ≥ 40% | 식비·배달 비중 높음 |
| 🎁 보상 추구형 | 보상 감정 ≥ 40% | 쇼핑·여가 집중 |
| ⚡ 충동 소비형 | 충동 감정 ≥ 40% | 소액 다건, 카테고리 분산 |
| ⚖️ 균형 소비형 | 단일 감정 < 40% | 필요 중심, 계획적 소비 |

---

## 🔧 Claude Code 하네스

`.claude/settings.json`에 PostToolUse 훅 3개 설정:

| 트리거 | 자동 실행 |
|--------|-----------|
| `backend/**/*.py` 수정 | `ruff` 린트 검사 → 오류 시 알림 |
| `frontend/src/**/*.ts(x)` 수정 | `tsc --noEmit` 타입 체크 → 오류 시 알림 |
| `test_*.py` / `*.test.ts` 수정 | "테스트 실행하세요" 알림 |

---

## 📊 v1 → v2 발전 비교

| 항목 | v1 (MyWallet) | v2 (MyWallet v2) |
|------|--------------|-----------------|
| 입력 방식 | CSV/Excel 파일 업로드 | 실시간 직접 입력 |
| 프레임워크 | Streamlit (Python) | Next.js + FastAPI |
| 분석 기준 | 거래 이력 기반 | 감정 + 카테고리 기반 |
| 결과 표현 | 텍스트 코칭 | 유형 캐릭터화 + 점수화 |
| 배포 | Streamlit Cloud | Vercel + Render |
| 테스트 | 없음 | pytest 15개 + Vitest |
| 핵심 차별화 | 충동소비 탐지 | 행동 가이드 + 챌린지 |

---

## 🔗 관련 저장소

- **v1 (MyWallet)**: [meene11/my_wallet_pattern](https://github.com/meene11/my_wallet_pattern)

---

*Built with Claude Code*
