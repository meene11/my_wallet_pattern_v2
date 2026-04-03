"use client";

import { useState } from "react";
import type { ActionGuideDetail } from "@/lib/types";

interface Props {
  guide: ActionGuideDetail;
}

export default function ActionGuide({ guide }: Props) {
  const [challenged, setChallenged] = useState(false);

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
        </div>
      ) : (
        <button
          onClick={() => setChallenged(true)}
          className="btn-primary text-sm"
        >
          🎯 {guide.challenge} 챌린지 시작
        </button>
      )}
    </div>
  );
}
