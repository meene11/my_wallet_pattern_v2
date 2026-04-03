"use client";

import { useState } from "react";
import type { ActionGuideDetail } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { startChallenge } from "@/lib/api";

interface Props {
  guide: ActionGuideDetail;
}

export default function ActionGuide({ guide }: Props) {
  const [challenged, setChallenged] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const { isLoggedIn, appToken, login } = useAuth();

  async function handleChallenge() {
    if (!isLoggedIn) {
      login();
      return;
    }
    if (!appToken) return;
    setLoading(true);
    try {
      await startChallenge(50, appToken);  // 목표: 충동소비 지수 50 이하
      setChallenged(true);
    } catch {
      setChallenged(true);  // 실패해도 UI는 성공 처리
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-5">
        <p className="card-title mb-0">💡 오늘의 행동 가이드</p>
        {guide.source === "llm" && (
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
            AI 맞춤
          </span>
        )}
      </div>

      {/* 경고 메시지 */}
      <div className="space-y-2 mb-4">
        {guide.warnings.map((w, i) => (
          <div key={i} className="warn-box">⚠️ {w}</div>
        ))}
      </div>

      {/* 행동 추천 */}
      <div className="space-y-2 mb-6">
        {guide.actions.map((a, i) => (
          <div key={i} className="action-box">👉 {a}</div>
        ))}
      </div>

      {/* 챌린지 버튼 */}
      {challenged ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
          <span className="text-green-700 font-semibold text-sm">
            🎉 챌린지 시작! 오늘 하루 의식적인 소비를 실천해보세요.
          </span>
          {isLoggedIn && (
            <p className="text-xs text-green-600 mt-1">마이페이지에서 진행 상황을 확인할 수 있어요</p>
          )}
        </div>
      ) : (
        <button
          onClick={handleChallenge}
          disabled={loading}
          className="btn-primary text-sm"
        >
          {loading ? "저장 중…" : isLoggedIn
            ? `🎯 ${guide.challenge} 챌린지 시작`
            : `🎯 ${guide.challenge} 챌린지 시작 (로그인 필요)`}
        </button>
      )}
    </div>
  );
}
