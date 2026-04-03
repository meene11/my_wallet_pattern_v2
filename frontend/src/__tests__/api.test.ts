/**
 * API 클라이언트 단위 테스트
 * 실제 네트워크 호출 없이 fetch를 mock으로 대체
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeSpending } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";

const mockResponse: AnalyzeResponse = {
  total: 20000,
  count: 2,
  emotion_ratios:  { "스트레스": 75, "충동": 25 },
  cat_ratios:      { "배달": 75, "편의점": 25 },
  spending_type_key: "stress",
  spending_type: {
    name: "🔥 스트레스 해소형",
    summary: "스트레스 시 소비 증가",
    characteristics: ["식비 비중 높음"],
  },
  impulse_score:          85,
  emotion_spending_ratio: 100,
  dominant_emotion:       "스트레스",
  action_guide: {
    warnings:  ["스트레스 소비가 감지되었습니다"],
    actions:   ["20분 산책을 추천합니다"],
    challenge: "오늘 소비 줄이기",
    source:    "rule",
  },
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok:   true,
      json: () => Promise.resolve(mockResponse),
    })
  );
});

describe("analyzeSpending", () => {
  it("올바른 URL과 payload로 POST 요청을 보낸다", async () => {
    await analyzeSpending([{ amount: 15000, category: "배달", emotion: "스트레스" }]);
    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/analyze");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0].amount).toBe(15000);
  });

  it("서버 응답을 AnalyzeResponse 형태로 반환한다", async () => {
    const result = await analyzeSpending([
      { amount: 15000, category: "배달", emotion: "스트레스" },
      { amount: 5000,  category: "편의점", emotion: "충동" },
    ]);
    expect(result.spending_type_key).toBe("stress");
    expect(result.impulse_score).toBe(85);
    expect(result.action_guide.source).toBe("rule");
  });

  it("4xx/5xx 응답 시 Error를 throw한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok:   false,
        status: 422,
        json: () => Promise.resolve({ detail: "잘못된 요청" }),
      })
    );
    await expect(
      analyzeSpending([{ amount: 0, category: "식비", emotion: "필요" }])
    ).rejects.toThrow("잘못된 요청");
  });
});
