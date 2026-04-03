"use client";

import { useState } from "react";
import type { ActionGuideDetail } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { startChallenge } from "@/lib/api";

interface Props {
  guide: ActionGuideDetail;
}

export default function ActionGuide({ guide }: Props) {
  const [revealed,   setRevealed]   = useState(false);
  const [checked,    setChecked]    = useState<Set<number>>(new Set());
  const [challenged, setChallenged] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const { isLoggedIn, appToken, login } = useAuth();

  function toggleCheck(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function handleChallenge() {
    if (!isLoggedIn) { login(); return; }
    if (!appToken) return;
    setLoading(true);
    try {
      await startChallenge(50, appToken);
      setChallenged(true);
    } catch {
      setChallenged(true);
    } finally {
      setLoading(false);
    }
  }

  const doneCount  = checked.size;
  const totalCount = guide.actions.length;

  /* ── 미공개 상태: 드라마틱한 CTA ── */
  if (!revealed) {
    return (
      <div className="mb-6">
        <div
          className="rounded-2xl p-8 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #2C4A8A 60%, #1A6B5C 100%)" }}
        >
          {/* 배경 글로우 */}
          <div className="absolute inset-0 opacity-20"
               style={{ background: "radial-gradient(circle at 50% 50%, #5DEBB8 0%, transparent 70%)" }} />

          <div className="relative z-10">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-white font-black text-lg mb-1">AI 소비 코치가 준비됐어요</p>
            <p className="text-white/60 text-sm mb-6">
              당신의 소비 패턴을 분석한<br />맞춤 행동 가이드를 확인해보세요
            </p>

            <button
              onClick={() => setRevealed(true)}
              className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl
                         font-black text-base transition-all duration-200
                         active:scale-95"
              style={{
                background: "linear-gradient(135deg, #5DEBB8, #27AE60)",
                color: "#1B2A4A",
                boxShadow: "0 8px 32px rgba(93,235,184,0.45)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(93,235,184,0.65)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(93,235,184,0.45)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              <span className="text-xl">✨</span>
              AI 소비 코치 가이드 받기
              <span className="text-xl">→</span>
            </button>

            {guide.source === "llm" && (
              <p className="text-white/40 text-xs mt-4">GPT-4o 기반 맞춤 분석</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── 공개 상태: 가이드 본문 ── */
  return (
    <div className="card mb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <p className="card-title mb-0">🤖 AI 소비 코치 가이드</p>
        {guide.source === "llm" && (
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
            ✨ AI 맞춤
          </span>
        )}
      </div>

      {/* 경고 메시지 */}
      <div className="space-y-2 mb-5">
        {guide.warnings.map((w, i) => (
          <div key={i} className="warn-box">⚠️ {w}</div>
        ))}
      </div>

      {/* 체크리스트 */}
      <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">
        오늘 실천할 행동 ({doneCount}/{totalCount} 완료)
      </p>
      <div className="space-y-2 mb-4">
        {guide.actions.map((a, i) => (
          <div
            key={i}
            onClick={() => toggleCheck(i)}
            className={`checklist-item ${checked.has(i) ? "checked" : ""}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
              checked.has(i) ? "bg-green-500 border-green-500" : "border-gray-300"
            }`}>
              {checked.has(i) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p className={`text-sm transition-colors ${
              checked.has(i) ? "line-through text-gray-400" : "text-brand-navy"
            }`}>
              {a}
            </p>
          </div>
        ))}
      </div>

      {/* 진행률 바 */}
      {totalCount > 0 && (
        <div className="mb-5">
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${(doneCount / totalCount) * 100}%`,
                background: "linear-gradient(to right, #2C4A8A, #1A6B5C)",
              }}
            />
          </div>
        </div>
      )}

      {/* 챌린지 버튼 */}
      {challenged ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-4 text-center">
          <p className="text-green-700 font-bold text-sm">🎉 챌린지 시작!</p>
          <p className="text-green-600 text-xs mt-1">오늘 하루 의식적인 소비를 실천해보세요</p>
          {isLoggedIn && (
            <p className="text-xs text-green-500 mt-1">마이페이지에서 진행 상황을 확인할 수 있어요</p>
          )}
        </div>
      ) : (
        <button
          onClick={handleChallenge}
          disabled={loading}
          className="btn-primary text-sm"
        >
          {loading ? "저장 중…" : `🎯 ${guide.challenge} 챌린지 시작`}
        </button>
      )}

      {!isLoggedIn && !challenged && (
        <p className="text-center text-xs text-gray-400 mt-2">
          로그인하면 챌린지 진행 상황을 추적할 수 있어요
        </p>
      )}
    </div>
  );
}
