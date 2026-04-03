import type { AnalyzeResponse, SpendingEntry, UploadAnalyzeResponse, ImpulseThresholds } from "./types";

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
