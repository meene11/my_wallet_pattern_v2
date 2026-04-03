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
