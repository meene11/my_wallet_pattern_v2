// ── 입력 타입 ────────────────────────────────────────────────────────────────

export const EMOTIONS = ["스트레스", "보상", "충동", "필요"] as const;
export const CATEGORIES = [
  "식비", "배달", "카페", "쇼핑", "편의점",
  "교통", "구독", "의료", "여가", "기타",
] as const;

export type Emotion   = typeof EMOTIONS[number];
export type Category  = typeof CATEGORIES[number];

export interface SpendingEntry {
  amount:   number;
  category: Category;
  emotion:  Emotion;
}

export interface SpendingEntryWithMeta extends SpendingEntry {
  id:   string;   // local UUID for list keys
  time: string;   // "HH:MM"
}

// ── 충동소비 탐지 임계값 ──────────────────────────────────────────────────────

export interface ImpulseThresholds {
  catMultiplier:   number;   // 카테고리 평균 배수 (1.5~5.0, default 2.0)
  nightHour:       number;   // 야간 기준 시간 (18~23, default 21)
  freqCount:       number;   // 동일 카테고리 반복 건수 (2~10, default 3)
  dailyMultiplier: number;   // 일평균 배수 (1.2~3.0, default 1.5)
}

export const DEFAULT_THRESHOLDS: ImpulseThresholds = {
  catMultiplier:   2.0,
  nightHour:       21,
  freqCount:       3,
  dailyMultiplier: 1.5,
};

// ── 파일 업로드 분석 타입 ──────────────────────────────────────────────────────

export interface ImpulseItem {
  date:           string;
  merchant:       string;
  amount:         number;
  category:       string;
  impulse_reason: string;
}

export interface UploadAnalyzeResponse {
  total:          number;
  count:          number;
  impulse_count:  number;
  impulse_amount: number;
  impulse_ratio:  number;
  impulse_score:  number;
  cat_ratios:     Record<string, number>;
  impulse_items:  ImpulseItem[];
  action_guide:   ActionGuideDetail;
}

// ── 분석 이력 / 챌린지 타입 ──────────────────────────────────────────────────

export interface HistoryItem {
  id:           number;
  analyzed_at:  string;
  source:       "input" | "upload";
  total:        number;
  count:        number;
  impulse_score: number;
  cat_ratios:   Record<string, number>;
  action_guide: ActionGuideDetail;

  // 파일 업로드 전용
  impulse_ratio?:  number;
  impulse_amount?: number;
  impulse_count?:  number;
  impulse_items?:  ImpulseItem[];
  thresholds?:     ImpulseThresholds | null;

  // 직접 입력 전용
  emotion_ratios?:         Record<string, number>;
  emotion_spending_ratio?: number;
  dominant_emotion?:       string;
  spending_type_key?:      string;
  spending_type?:          SpendingTypeDetail;
}

export interface ChallengeOut {
  id:           number;
  started_at:   string;
  target_score: number;
  status:       "active" | "completed" | "failed";
}

// ── API 응답 타입 ─────────────────────────────────────────────────────────────

export interface SpendingTypeDetail {
  name:            string;
  summary:         string;
  characteristics: string[];
}

export interface ActionGuideDetail {
  warnings:  string[];
  actions:   string[];
  challenge: string;
  source:    "rule" | "llm";
}

export interface AnalyzeResponse {
  total:                   number;
  count:                   number;
  emotion_ratios:          Record<string, number>;
  cat_ratios:              Record<string, number>;
  spending_type_key:       string;
  spending_type:           SpendingTypeDetail;
  impulse_score:           number;
  emotion_spending_ratio:  number;
  dominant_emotion:        string;
  action_guide:            ActionGuideDetail;
}
