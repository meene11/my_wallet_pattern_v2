"""
file_parser.py — CSV/Excel 카드 거래내역 파싱 + 충동소비 탐지

v1(MyWallet) 분석 로직 계승:
  - 가맹점명 → 카테고리 자동 분류 (80+ 키워드)
  - 5가지 규칙 기반 충동소비 탐지
  - 충동소비 지수 + 감정 소비 비율 산출
"""
from __future__ import annotations

import io
from typing import Any

import pandas as pd

# ── 가맹점 → 카테고리 매핑 ────────────────────────────────────────────────────
MERCHANT_RULES: list[tuple[str, list[str]]] = [
    ("배달", ["배달의민족", "배민", "요기요", "쿠팡이츠", "위메프오", "땡겨요", "배달"]),
    ("카페", ["스타벅스", "투썸", "이디야", "메가커피", "컴포즈", "빽다방", "할리스",
              "탐앤탐스", "커피빈", "파스쿠찌", "카페", "coffee", "bakers"]),
    ("편의점", ["gs25", "cu ", "세븐일레븐", "7eleven", "미니스톱", "씨유", "편의점",
               "emart24", "이마트24"]),
    ("패스트푸드", ["맥도날드", "버거킹", "롯데리아", "kfc", "맘스터치", "서브웨이",
                   "파파이스", "노브랜드버거", "쉐이크쉑"]),
    ("치킨/피자", ["bhc", "교촌", "bbq", "굽네", "네네치킨", "도미노", "피자헛",
                  "피자알볼로", "미스터피자", "치킨", "피자"]),
    ("쇼핑", ["쿠팡", "네이버페이", "카카오페이", "11번가", "지마켓", "옥션",
              "무신사", "에이블리", "지그재그", "올리브영", "다이소", "이케아",
              "h&m", "zara", "유니클로", "스파오"]),
    ("대형마트", ["이마트", "홈플러스", "롯데마트", "코스트코", "트레이더스"]),
    ("식비", ["한식", "중식", "일식", "분식", "삼겹살", "순대", "국밥", "냉면",
              "칼국수", "김밥", "도시락", "뷔페", "식당", "밥집", "맛집"]),
    ("교통", ["택시", "카카오택시", "우버", "타다", "버스", "지하철", "기차",
              "ktx", "코레일", "고속버스", "주유", "gs칼텍스", "sk에너지", "현대오일"]),
    ("의료", ["병원", "약국", "의원", "클리닉", "한의원", "치과", "안과", "피부과",
              "정형외과", "내과", "약"]),
    ("여가", ["cgv", "롯데시네마", "메가박스", "노래방", "pc방", "볼링", "헬스장",
              "피트니스", "요가", "필라테스", "골프", "당구", "방탈출", "수영"]),
    ("구독", ["netflix", "유튜브", "youtube", "spotify", "멜론", "wavve", "tving",
              "coupang play", "왓챠", "디즈니", "apple", "microsoft", "adobe"]),
    ("주류", ["편의점주류", "와인", "맥주", "소주", "위스키", "bar ", "호프", "펍"]),
]

# 충동소비 카테고리 (이 카테고리에서 반복 구매 시 가중 탐지)
IMPULSE_CATEGORIES = {"배달", "편의점", "쇼핑", "패스트푸드", "치킨/피자", "주류"}


def _classify_merchant(name: str) -> str:
    name_l = str(name).lower().strip()
    for category, keywords in MERCHANT_RULES:
        if any(kw.lower() in name_l for kw in keywords):
            return category
    return "기타"


def _detect_column(df: pd.DataFrame, keywords: list[str]) -> str | None:
    """컬럼명 키워드 매칭으로 대상 컬럼 자동 감지"""
    for col in df.columns:
        col_l = str(col).lower()
        if any(kw in col_l for kw in keywords):
            return col
    return None


def _clean_amount(val: Any) -> float | None:
    """금액 문자열 정제: 쉼표·원·공백·부호 제거"""
    try:
        s = str(val).replace(",", "").replace("원", "").replace(" ", "").replace("+", "")
        return float(s)
    except (ValueError, TypeError):
        return None


def parse_file(content: bytes, filename: str) -> pd.DataFrame:
    """
    CSV 또는 Excel 파일을 읽어 표준화된 DataFrame 반환.
    컬럼: date, merchant, amount, category
    """
    ext = filename.lower().rsplit(".", 1)[-1]

    # 파일 읽기
    if ext in ("xlsx", "xls"):
        df_raw = pd.read_excel(io.BytesIO(content), dtype=str)
    else:
        # CP949(EUC-KR) → UTF-8 순으로 시도
        for enc in ("cp949", "utf-8", "utf-8-sig"):
            try:
                df_raw = pd.read_csv(io.BytesIO(content), dtype=str, encoding=enc)
                break
            except (UnicodeDecodeError, Exception):
                continue
        else:
            raise ValueError("파일 인코딩을 인식할 수 없습니다.")

    df_raw.columns = [str(c).strip() for c in df_raw.columns]

    # 컬럼 자동 감지
    date_col     = _detect_column(df_raw, ["날짜", "일자", "거래일", "이용일", "승인일", "date"])
    amount_col   = _detect_column(df_raw, ["금액", "이용금액", "승인금액", "결제금액", "출금", "amount"])
    merchant_col = _detect_column(df_raw, ["가맹점", "사용처", "내용", "적요", "상호", "merchant", "거래처"])

    missing = [n for n, c in [("날짜", date_col), ("금액", amount_col), ("가맹점/내용", merchant_col)] if c is None]
    if missing:
        raise ValueError(f"다음 컬럼을 찾을 수 없습니다: {', '.join(missing)}\n"
                         f"현재 컬럼: {list(df_raw.columns)}")

    df = pd.DataFrame({
        "date":     pd.to_datetime(df_raw[date_col], errors="coerce"),
        "merchant": df_raw[merchant_col].astype(str).str.strip(),
        "amount":   df_raw[amount_col].apply(_clean_amount),
    }).dropna(subset=["date", "amount"])

    # 지출만 (양수 금액)
    df = df[df["amount"] > 0].copy()
    if df.empty:
        raise ValueError("유효한 지출 거래 내역이 없습니다.")

    df["amount"]   = df["amount"].astype(int)
    df["category"] = df["merchant"].apply(_classify_merchant)
    df["hour"]     = df["date"].dt.hour
    df["weekday"]  = df["date"].dt.dayofweek  # 0=월 … 6=일
    df["date_only"] = df["date"].dt.date

    return df


def detect_impulse(
    df: pd.DataFrame,
    cat_multiplier: float = 2.0,
    night_hour: int = 21,
    freq_count: int = 3,
    daily_multiplier: float = 1.5,
) -> pd.DataFrame:
    """
    5가지 규칙으로 충동소비 탐지 후 is_impulse 컬럼 추가.

    탐지 기준:
      1. 카테고리 평균의 N배 초과
      2. 야간(N시 이후) 결제
      3. 충동 카테고리에서 하루 N건 이상
      4. 하루 지출 합계가 일평균의 N배 초과
      5. 주말 + 야간
    """
    result = df.copy()

    # 1. 카테고리 평균 초과
    cat_mean = result.groupby("category")["amount"].transform("mean")
    result["flag_over_cat"] = result["amount"] > cat_mean * cat_multiplier

    # 2. 야간
    result["flag_night"] = result["hour"] >= night_hour

    # 3. 충동 카테고리 하루 N건+
    impulse_mask = result["category"].isin(IMPULSE_CATEGORIES)
    daily_cnt = result[impulse_mask].groupby("date_only")["amount"].transform("count")
    result["flag_freq"] = False
    result.loc[impulse_mask, "flag_freq"] = daily_cnt >= freq_count

    # 4. 하루 지출 일평균 초과
    daily_sum = result.groupby("date_only")["amount"].transform("sum")
    personal_daily_avg = result.groupby("date_only")["amount"].sum().mean()
    result["flag_daily"] = daily_sum > personal_daily_avg * daily_multiplier

    # 5. 주말 야간
    result["flag_weekend_night"] = (result["weekday"] >= 5) & result["flag_night"]

    # 최종 OR 조합
    result["is_impulse"] = (
        result["flag_over_cat"] |
        result["flag_night"] |
        result["flag_freq"] |
        result["flag_daily"] |
        result["flag_weekend_night"]
    )

    # 탐지 이유 텍스트
    def _reason(row: pd.Series) -> str:
        reasons = []
        if row["flag_over_cat"]:     reasons.append("카테고리 평균 초과")
        if row["flag_night"]:        reasons.append("야간 결제")
        if row["flag_freq"]:         reasons.append("동일 카테고리 반복")
        if row["flag_daily"]:        reasons.append("일평균 초과")
        if row["flag_weekend_night"]: reasons.append("주말 야간")
        return " · ".join(reasons) if reasons else ""

    result["impulse_reason"] = result.apply(_reason, axis=1)
    return result


def summarize(df: pd.DataFrame) -> dict[str, Any]:
    """분석 완료된 DataFrame → 요약 딕셔너리 반환"""
    total        = int(df["amount"].sum())
    count        = len(df)
    impulse_df   = df[df["is_impulse"]]
    impulse_amt  = int(impulse_df["amount"].sum())
    impulse_cnt  = len(impulse_df)
    impulse_ratio = round(impulse_amt / total * 100, 1) if total else 0.0

    cat_ratios = (
        df.groupby("category")["amount"].sum() / total * 100
    ).round(1).to_dict()

    # 충동소비 상위 20건 (금액 내림차순)
    top_impulse = (
        impulse_df.sort_values("amount", ascending=False)
        .head(20)[["date_only", "merchant", "amount", "category", "impulse_reason"]]
        .assign(date_only=lambda d: d["date_only"].astype(str))
        .rename(columns={"date_only": "date"})
        .to_dict(orient="records")
    )

    # 충동 소비 지수 (0–100)
    base_score = impulse_ratio
    max_single = int(df["amount"].max())
    avg_amount = df["amount"].mean()
    if avg_amount > 0 and max_single > avg_amount * 3:
        base_score = min(100, base_score * 1.15)
    impulse_score = min(100, int(base_score))

    return {
        "total":          total,
        "count":          count,
        "impulse_count":  impulse_cnt,
        "impulse_amount": impulse_amt,
        "impulse_ratio":  impulse_ratio,
        "impulse_score":  impulse_score,
        "cat_ratios":     cat_ratios,
        "impulse_items":  top_impulse,
    }
