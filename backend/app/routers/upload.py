"""POST /upload — CSV/Excel 카드 거래내역 분석 엔드포인트"""
from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.schemas.upload import UploadAnalyzeResponse
from app.services.file_parser import parse_file, detect_impulse, summarize

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _get_llm_guide(summary: dict) -> dict:
    """GPT-4o mini 기반 AI 코치 멘트 (파일 분석용)"""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        top_cats = sorted(summary["cat_ratios"].items(), key=lambda x: x[1], reverse=True)[:3]
        cat_str  = ", ".join(f"{k}({v}%)" for k, v in top_cats)
        top_merchants = list({item["merchant"] for item in summary["impulse_items"][:5]})

        prompt = f"""당신은 친근하고 솔직한 개인 재무 코치입니다.

[한 달 카드 거래 분석 결과]
- 총 지출: {summary['total']:,}원 ({summary['count']}건)
- 충동소비 의심: {summary['impulse_amount']:,}원 ({summary['impulse_ratio']}%, {summary['impulse_count']}건)
- 충동 소비 지수: {summary['impulse_score']}점 (100점 만점)
- 지출 많은 카테고리: {cat_str}
- 충동소비 주요 가맹점: {', '.join(top_merchants) if top_merchants else '없음'}

위 데이터만 근거로 분석해주세요. 데이터에 없는 내용은 절대 언급하지 마세요.

아래 형식을 정확히 지켜주세요:
경고1: (데이터 기반 핵심 문제 한 문장)
경고2: (두 번째 문제 한 문장)
조언1: (구체적 행동 조언 한 문장)
조언2: (구체적 행동 조언 한 문장)
조언3: (구체적 행동 조언 한 문장)"""

        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=300,
        )

        lines = resp.choices[0].message.content.strip().splitlines()
        warnings, actions = [], []
        for ln in lines:
            if ln.startswith("경고") and ":" in ln:
                warnings.append(ln.split(":", 1)[-1].strip())
            elif ln.startswith("조언") and ":" in ln:
                actions.append(ln.split(":", 1)[-1].strip())

        if warnings and actions:
            return {"warnings": warnings, "actions": actions,
                    "challenge": "이번 달 충동 소비 줄이기", "source": "llm"}
    except Exception:
        pass
    return None


def _rule_guide(summary: dict) -> dict:
    """규칙 기반 AI 코치 멘트"""
    ratio = summary["impulse_ratio"]
    score = summary["impulse_score"]

    if score >= 70:
        warnings = [
            f"충동소비 비율이 {ratio}%로 매우 높습니다",
            f"한 달 동안 {summary['impulse_count']}건의 충동소비가 감지되었습니다",
        ]
        actions = [
            "카드 결제 전 24시간 대기 규칙을 실천해보세요",
            "배달·쇼핑 앱 알림을 야간(21시 이후) 차단 설정하세요",
            "주간 지출 한도를 설정하고 가계부 앱으로 추적하세요",
        ]
    elif score >= 40:
        warnings = [
            f"충동소비 비율 {ratio}% — 개선이 필요한 수준입니다",
            "야간이나 주말 소비 비중을 점검해보세요",
        ]
        actions = [
            "충동소비가 많은 카테고리 1개를 골라 이번 달 50% 절감 목표를 세워보세요",
            "구매 전 '정말 필요한가?' 3초 체크 습관을 만들어보세요",
            "월초에 카테고리별 예산을 미리 설정해두세요",
        ]
    else:
        warnings = [
            f"충동소비 비율 {ratio}% — 양호한 수준입니다",
            "현재 소비 습관을 유지하면서 저축 비율도 점검해보세요",
        ]
        actions = [
            "이 좋은 패턴을 유지하세요 — 저축률을 한 단계 높여볼 시기입니다",
            "비상금 3~6개월치 목표를 세우고 자동이체를 설정해보세요",
            "카테고리별 지출 추이를 매달 기록해서 변화를 관찰해보세요",
        ]

    return {
        "warnings":  warnings,
        "actions":   actions,
        "challenge": "이번 달 충동 소비 줄이기",
        "source":    "rule",
    }


@router.post("", response_model=UploadAnalyzeResponse)
async def analyze_file(
    file: UploadFile = File(...),
    cat_multiplier:   float = Form(2.0),   # 카테고리 평균 배수 (1.5~5.0)
    night_hour:       int   = Form(21),    # 야간 기준 시간 (18~23)
    freq_count:       int   = Form(3),     # 동일 카테고리 반복 건수 (2~10)
    daily_multiplier: float = Form(1.5),   # 일평균 배수 (1.2~3.0)
) -> UploadAnalyzeResponse:
    """
    CSV 또는 Excel 카드 거래내역을 업로드하면
    충동소비 탐지 + AI 코치 분석 결과를 반환합니다.
    탐지 임계값은 Form 파라미터로 커스터마이즈 가능합니다.
    """
    ext = (file.filename or "").lower().rsplit(".", 1)[-1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="CSV 또는 Excel 파일만 업로드 가능합니다.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다.")

    try:
        df = parse_file(content, file.filename or "upload.csv")
        df = detect_impulse(
            df,
            cat_multiplier=cat_multiplier,
            night_hour=night_hour,
            freq_count=freq_count,
            daily_multiplier=daily_multiplier,
        )
        summary = summarize(df)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 처리 중 오류: {str(e)}")

    # AI 코치
    guide = None
    if os.getenv("OPENAI_API_KEY"):
        guide = _get_llm_guide(summary)
    if guide is None:
        guide = _rule_guide(summary)

    return UploadAnalyzeResponse(
        total=summary["total"],
        count=summary["count"],
        impulse_count=summary["impulse_count"],
        impulse_amount=summary["impulse_amount"],
        impulse_ratio=summary["impulse_ratio"],
        impulse_score=summary["impulse_score"],
        cat_ratios=summary["cat_ratios"],
        impulse_items=summary["impulse_items"],
        action_guide=guide,
    )
