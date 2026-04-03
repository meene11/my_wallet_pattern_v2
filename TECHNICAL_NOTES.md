# MyWallet v2 — 기술 설계 노트

> 왜 이 기술을 선택했는지, 왜 이렇게 만들었는지에 대한 개인 기록

---

## 1. 전체 아키텍처 선택: Next.js + FastAPI 분리

### 왜 분리했나?

처음에는 Next.js만으로 만들 수 있었다. Next.js의 API Route를 쓰면 백엔드 없이도 된다.

하지만 다음 이유로 분리했다:

**Python만 가능한 것들이 있다**
- `pandas`: CSV/Excel 파일을 행 단위로 분석하는 건 Python이 압도적으로 편하다
- `openpyxl`: Excel 파싱은 Python 생태계가 훨씬 성숙했다
- `google-auth`: Google id_token 서버 검증도 Python 라이브러리가 잘 돼 있다

**배포 분리로 유연성 확보**
- 프론트(Vercel): CDN 엣지 배포, 자동 HTTPS, 도메인
- 백엔드(Render): Python 런타임 지원, 무료 플랜 가능

**실제 서비스 구조를 경험**
- 실무에서 프론트/백엔드 분리는 표준이다
- API 계약(Contract)을 명시적으로 정의하는 연습이 된다

---

## 2. Next.js 14 App Router 선택

### Pages Router vs App Router

Next.js에는 두 가지 라우팅 방식이 있다:
- **Pages Router** (구): `pages/` 폴더 기반, 오래된 방식
- **App Router** (신): `app/` 폴더 기반, React Server Components 지원

App Router를 선택한 이유:
- Next.js의 공식 미래 방향
- 레이아웃 중첩이 직관적 (`layout.tsx`)
- `use client` / `use server` 명시적 구분으로 코드 의도가 명확

### 왜 `"use client"`를 많이 쓰는가

이 프로젝트는 사용자 인터랙션이 많다 (입력, 클릭, 상태관리). 그래서 대부분 컴포넌트가 클라이언트 컴포넌트다. Server Component의 이점(데이터 페칭 최적화)은 마이페이지 정도에서만 의미 있지만, 단순화를 위해 클라이언트 방식으로 통일했다.

---

## 3. 인증: NextAuth.js + 백엔드 JWT 이중 구조

### 왜 NextAuth.js를 썼나

Google OAuth를 직접 구현하면:
1. 인증 URL 생성
2. 콜백 처리
3. 토큰 교환
4. 세션 관리

이걸 다 직접 하면 코드가 200줄 넘고 보안 실수 가능성도 높다. NextAuth는 이걸 10줄로 줄여준다.

### 왜 토큰이 두 개인가?

```
Google id_token (NextAuth 관리)
        ↓ POST /auth/login 으로 전달
백엔드 앱 JWT (우리가 발급)
        ↓ 이후 모든 API 요청에 사용
```

**Google id_token만 쓰면 안 되나?**
- Google id_token은 구글 서버에서만 검증 가능하다
- 모든 API 요청마다 구글 서버에 검증 요청하면 느리고 의존성이 생긴다
- 우리 백엔드 JWT를 발급하면: 독립적으로 검증 가능 + 만료 시간 직접 제어

**JWT 시크릿 키 주의사항**
- `load_dotenv()`는 반드시 모든 import보다 먼저 실행해야 한다
- Python 모듈은 import 시점에 모듈 레벨 코드가 실행된다
- `SECRET_KEY = os.getenv(...)` 이 코드가 import 시 실행되므로, 그 전에 `.env`가 로드돼야 한다

```python
# main.py — 반드시 이 순서
from dotenv import load_dotenv
load_dotenv()  # ← 여기서 바로 실행

# 그 다음에 import
from app.routers import auth  # 이 안에서 os.getenv() 호출함
```

---

## 4. 데이터베이스: SQLite 선택

### PostgreSQL 대신 SQLite를 쓴 이유

| | SQLite | PostgreSQL |
|--|--------|-----------|
| 설치 | 불필요 (파일) | 서버 필요 |
| 로컬 개발 | 파일 하나로 끝 | DB 서버 실행 필요 |
| 비용 | 무료 | Render 유료 or 별도 서비스 |
| 동시 접속 | 약함 | 강함 |

이 프로젝트는 개인 미니 프로젝트다. 동시 사용자가 수백 명을 넘지 않는다면 SQLite로 충분하다. 나중에 트래픽이 늘면 SQLAlchemy 연결 URL만 바꾸면 PostgreSQL로 마이그레이션된다.

```python
# SQLite → PostgreSQL 전환 시 이 줄만 변경
SQLALCHEMY_DATABASE_URL = "sqlite:///./mywallet.db"
# →
SQLALCHEMY_DATABASE_URL = "postgresql://user:pass@host/dbname"
```

### SQLAlchemy ORM을 쓴 이유

Raw SQL 대신 ORM을 쓰면:
- Python 객체로 DB를 다룰 수 있어 직관적
- DB 종류 변경 시 코드 수정 최소화
- Pydantic과 `model_config = {"from_attributes": True}` 설정으로 ORM 객체 → 스키마 자동 변환

---

## 5. 충동소비 탐지 알고리즘

### 왜 ML이 아닌 규칙 기반인가

충동소비 탐지에 머신러닝을 쓰지 않은 이유:
1. 레이블링된 훈련 데이터가 없다
2. 규칙이 사용자에게 설명 가능해야 한다 (투명성)
3. 사용자가 임계값을 직접 조정할 수 있어야 한다

5가지 규칙은 행동경제학 연구에서 충동구매와 상관관계가 높다고 알려진 패턴들이다:
- **야간 결제**: 피로감으로 인한 자제력 저하
- **주말 야간**: 사회적 활동 + 알코올 효과
- **카테고리 평균 초과**: 평소 대비 이상 지출
- **반복 결제**: 같은 자극에 반복 노출
- **일평균 초과**: 하루 전체 소비 이상 감지

### 충동소비 지수 계산

```python
base_score = impulse_ratio  # 충동소비 금액 / 전체 금액 × 100

# 고액 단건 보정: 평균의 3배 넘는 결제가 있으면 15% 가중
if max_single > avg_amount * 3:
    base_score = min(100, base_score * 1.15)

impulse_score = min(100, int(base_score))
```

단순히 비율만 쓰면 소액 다건과 고액 단건을 구분 못한다. 고액 단건이 더 위험하기 때문에 보정 계수를 넣었다.

---

## 6. 파일 파서 설계

### 가맹점 → 카테고리 자동 분류

카드사마다 가맹점명이 다르다. "스타벅스"가 "STARBUCKS"로 올 수도 있고, "스타벅스코리아(주)"로 올 수도 있다.

해결 방법:
```python
# 키워드 포함 여부 확인 (소문자 변환 후)
def _classify_merchant(name: str) -> str:
    name_l = str(name).lower().strip()
    for category, keywords in MERCHANT_RULES:
        if any(kw.lower() in name_l for kw in keywords):
            return category
    return "기타"
```

`in` 연산자로 부분 문자열 매칭. 80개 이상의 키워드를 관리한다.

### 컬럼 자동 감지

카드사마다 컬럼명이 다르다:
- 신한: "이용일시", "이용금액", "가맹점명"
- 국민: "거래일시", "결제금액", "사용처"
- 일반 은행: "거래 일시", "거래 금액", "적요"

```python
# 키워드 목록으로 컬럼명 패턴 매칭
date_col = _detect_column(df_raw, ["날짜", "일자", "일시", "거래일", "이용일", "승인일", "date"])
```

실패 시 어떤 컬럼이 없는지 에러 메시지로 알려줘서 디버깅을 쉽게 했다.

---

## 7. UX 설계 결정들

### AI 코치 가이드 Reveal UX

처음엔 분석 결과와 함께 바로 가이드를 보여줬다. 문제는:
- 정보 과부하 — 화면이 너무 많다
- "행동 가이드"가 핵심 기능인데 덜 특별해 보인다

해결: 버튼 클릭 후 공개하는 방식으로 변경
- 사용자가 준비됐을 때 정보를 받는다 (능동적 참여)
- 드라마틱한 다크 카드 + 글로우 버튼 → 핵심 기능임을 시각적으로 강조
- 클릭 행위 자체가 "가이드를 받겠다"는 의지 표현

### BlurGate 패턴

비회원에게 모든 기능을 숨기면 서비스가 뭔지 알 수 없다. 반대로 다 보여주면 가입 이유가 없다.

BlurGate 해결책:
- 분석 요약(숫자)은 보여줌 → "오, 이런 서비스구나"
- 상세 내용은 blur → "더 보려면 가입해야 해"

```tsx
// 비회원: blur + 오버레이 배너
// 회원: children 그대로 렌더
export default function BlurGate({ children, label }) {
  if (isLoggedIn) return <>{children}</>;
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none">{children}</div>
      <div className="absolute inset-0 ...">🔒 회원 전용</div>
    </div>
  );
}
```

### 한 줄 진단 배너

분석 결과에 숫자만 있으면 "그래서 뭐?"라는 감정이 생긴다. 사람은 숫자보다 이야기(narrative)에 반응한다.

```
당신은 '스트레스 해소형 소비 패턴'입니다
힘든 순간 소비로 감정을 달래는 경향이 있어요.
충동 소비 지수 72점 — 위험 😟
```

이 한 줄이 "이 서비스가 나를 이해한다"는 느낌을 준다.

---

## 8. GPT-4o mini 선택 이유

### 왜 GPT-4가 아닌 mini인가

| 모델 | 장점 | 단점 |
|------|------|------|
| GPT-4o | 더 정확, 더 자연스러운 문장 | 비싸다 (~$15/1M tokens) |
| GPT-4o mini | 충분히 좋음, 빠름 | 약간 덜 창의적 |

이 서비스의 행동 가이드는:
- 창의성이 필요 없다 (정해진 패턴)
- 짧은 텍스트다 (300토큰 이하)
- 많은 사람이 쓰면 비용이 중요하다

GPT-4o mini가 이 용도에 최적이다.

### Hallucination 방지 프롬프트

```python
prompt = """
위 데이터만 근거로 분석해주세요. 데이터에 없는 내용은 절대 언급하지 마세요.
아래 형식을 정확히 지켜주세요:
경고1: ...
경고2: ...
조언1: ...
"""
```

포맷을 강제하면 두 가지 이점이 있다:
1. 파싱이 쉬워진다 (줄별로 `startswith("경고")` 체크)
2. 모델이 구조를 따르면서 자연스럽게 할루시네이션이 줄어든다

---

## 9. Claude Code 하네스 엔지니어링

### 하네스란

Claude Code가 파일을 수정할 때마다 자동으로 실행되는 훅(hook) 시스템이다.
`.claude/settings.json`에 `PostToolUse` 이벤트로 설정한다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "..." }]
      }
    ]
  }
}
```

파일이 저장되는 순간 → 린트/타입체크가 자동 실행 → 오류 즉시 감지.
사람이 직접 `ruff .` 또는 `tsc --noEmit`을 실행할 필요가 없다.

### Windows에서 jq 대신 Python을 쓴 이유

훅 커맨드는 `stdin`으로 JSON을 받아 파일 경로를 추출해야 한다.
Linux/Mac에서는 `jq`를 쓰지만, **Windows에는 기본 설치되지 않는다.**

```bash
# Linux/Mac (jq 사용)
jq -r '.tool_input.file_path'

# Windows (Python으로 대체)
python -c "
import json, sys
data = json.load(sys.stdin)
path = data.get('tool_input', {}).get('file_path', '')
print(path)
"
```

Python은 백엔드 개발 환경에 이미 설치돼 있으므로 추가 설치 없이 동작한다.

### 이 프로젝트의 훅 3개

| 트리거 | 실행 내용 |
|--------|-----------|
| `backend/**/*.py` 수정 | `ruff` 린트 → 오류 시 경고 출력 |
| `frontend/src/**/*.ts(x)` 수정 | `tsc --noEmit` 타입 체크 |
| `test_*.py` / `*.test.ts` 수정 | "테스트 실행하세요" 알림 |

### 하네스가 실제로 잡아준 것들

이번 프로젝트에서 하네스가 런타임 전에 잡아준 오류들:

| 오류 | 발견 시점 |
|------|-----------|
| `load_dotenv()` import 순서 문제 | ruff 경고로 즉시 감지 |
| TypeScript 타입 불일치 | tsc가 파일 저장 즉시 에러 출력 |
| `useState` 중복 import | 파일 저장 즉시 감지 |

하네스 없이 개발했다면 이 오류들이 브라우저 런타임이나 서버 실행 시에야 발견됐을 것이다.
특히 `load_dotenv()` 순서 문제는 서버가 정상 실행되어도 env 값이 빈값으로 읽히는 문제라
런타임에서 재현하기 어려운 버그였다.

### 하네스의 한계

- 훅이 실패해도 Claude Code 작업이 중단되지 않는다 (알림만)
- 테스트 자동 실행은 알림만 주고 실제 실행은 개발자가 직접 해야 한다
- Windows 경로 처리 시 슬래시 방향에 주의 필요

---

## 10. 에러 처리 전략

### 백엔드 폴백 체계

```
OPENAI_API_KEY 있음 → GPT-4o mini 시도
        ↓ 실패 시
규칙 기반 가이드 (점수별 3단계)
```

`try/except Exception: pass`로 LLM 실패를 조용히 처리한다. 사용자는 규칙 기반 가이드를 받지만, LLM이 안 됐다는 걸 알 필요 없다.

### 프론트엔드 토큰 검증

```typescript
// 앱 시작 시 캐시된 토큰 유효성 확인
const res = await fetch(`/auth/me`, { headers: { Authorization: `Bearer ${cached}` } });
if (!res.ok) {
  // DB 초기화 등으로 토큰이 무효화된 경우 자동 처리
  sessionStorage.removeItem("appToken");
  // 재로그인 흐름으로
}
```

DB를 리셋하거나 토큰이 만료됐을 때 "User not found" 에러 대신 자동으로 재로그인 흐름으로 넘어간다.

---

## 10. 배포 전 체크리스트

### 환경변수 (절대 GitHub에 올리면 안 되는 것들)
- [ ] `OPENAI_API_KEY`
- [ ] `JWT_SECRET_KEY` (긴 랜덤 문자열로 변경)
- [ ] `NEXTAUTH_SECRET` (긴 랜덤 문자열로 변경)
- [ ] `GOOGLE_CLIENT_SECRET`

### Render 배포 시
- [ ] Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] `ALLOWED_ORIGINS`에 Vercel 도메인 추가
- [ ] SQLite는 Render 무료 플랜에서 재시작 시 초기화됨 → 추후 PostgreSQL 고려

### Vercel 배포 시
- [ ] Root Directory: `frontend` 설정
- [ ] `NEXTAUTH_URL`을 실제 Vercel 도메인으로 변경
- [ ] Google Cloud Console에서 프로덕션 도메인을 리디렉션 URI에 추가

### Google Cloud Console
- [ ] 승인된 JavaScript 원본에 `https://your-app.vercel.app` 추가
- [ ] 승인된 리디렉션 URI에 `https://your-app.vercel.app/api/auth/callback/google` 추가

---

## 11. 알려진 제한사항

**SQLite + Render 무료 플랜**
- Render 무료 플랜은 서비스가 idle 상태에서 재시작될 때 파일시스템이 초기화될 수 있다
- SQLite DB가 날아갈 수 있음 → 지속적인 사용이면 PostgreSQL로 전환 필요
- 전환 방법: `database.py`의 `SQLALCHEMY_DATABASE_URL` 한 줄만 변경

**Google OAuth**
- 현재 Google Cloud 앱이 "테스트" 상태면 100명 제한
- 실제 서비스: Google에 앱 검수 신청 필요 (또는 내부 사용만이면 테스터 등록)

**파일 파서**
- 인식 못하는 카드사 형식이 있을 수 있음
- 오류 메시지에 현재 컬럼명이 표시되므로, 매핑 추가 가능

---

*이 문서는 미래의 나를 위한 기록입니다.*
