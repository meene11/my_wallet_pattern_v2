import type {
  AnalyzeResponse, SpendingEntry, UploadAnalyzeResponse,
  ImpulseThresholds, HistoryItem, ChallengeOut,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function analyzeSpending(
  entries: SpendingEntry[]
): Promise<AnalyzeResponse> {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `API error ${res.status}`);
  }

  return res.json() as Promise<AnalyzeResponse>;
}

export async function analyzeFile(
  file: File,
  thresholds: ImpulseThresholds
): Promise<UploadAnalyzeResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("cat_multiplier",   String(thresholds.catMultiplier));
  form.append("night_hour",       String(thresholds.nightHour));
  form.append("freq_count",       String(thresholds.freqCount));
  form.append("daily_multiplier", String(thresholds.dailyMultiplier));

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `API error ${res.status}`);
  }

  return res.json() as Promise<UploadAnalyzeResponse>;
}

// ── 인증이 필요한 API 공통 헬퍼 ───────────────────────────────────────────────

async function authFetch(url: string, token: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── 분석 이력 ─────────────────────────────────────────────────────────────────

export async function saveHistory(
  result: UploadAnalyzeResponse,
  token: string,
  thresholds?: ImpulseThresholds,
): Promise<HistoryItem> {
  return authFetch(`${BASE_URL}/history`, token, {
    method: "POST",
    body: JSON.stringify({ ...result, thresholds }),
  });
}

export async function getHistory(token: string): Promise<HistoryItem[]> {
  return authFetch(`${BASE_URL}/history`, token);
}

// ── 챌린지 ────────────────────────────────────────────────────────────────────

export async function startChallenge(targetScore: number, token: string): Promise<ChallengeOut> {
  return authFetch(`${BASE_URL}/history/challenge`, token, {
    method: "POST",
    body: JSON.stringify({ target_score: targetScore }),
  });
}

export async function getActiveChallenge(token: string): Promise<ChallengeOut | null> {
  try {
    return await authFetch(`${BASE_URL}/history/challenge/active`, token);
  } catch {
    return null;
  }
}
