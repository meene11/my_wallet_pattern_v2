"use client";

import Hero         from "@/components/Hero";
import InputCard    from "@/components/InputCard";
import ResultCard   from "@/components/ResultCard";
import Charts       from "@/components/Charts";
import ActionGuide  from "@/components/ActionGuide";
import ReEngagement from "@/components/ReEngagement";
import { useSpending } from "@/hooks/useSpending";

export default function Home() {
  const {
    entries,
    analysis,
    isLoading,
    error,
    addEntry,
    clearAll,
    runAnalysis,
  } = useSpending();

  const showResults = !!analysis;

  return (
    <main>
      {/* ── [1] HERO ─────────────────────────────────────────── */}
      <Hero />

      {/* ── [2] INPUT ────────────────────────────────────────── */}
      <InputCard
        entries={entries}
        onAdd={addEntry}
        onAnalyze={runAnalysis}
        onClear={clearAll}
        isLoading={isLoading}
      />

      {/* 오류 메시지 */}
      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ── [3] RESULT SUMMARY ───────────────────────────────── */}
      {showResults && (
        <>
          <ResultCard analysis={analysis} />

          {/* ── [4] VISUALIZATION ──────────────────────────── */}
          <Charts analysis={analysis} />

          {/* ── [5] ACTION GUIDE ───────────────────────────── */}
          <ActionGuide guide={analysis.action_guide} />

          {/* ── [6] RE-ENGAGEMENT ──────────────────────────── */}
          <ReEngagement
            onAddMore={() => {
              /* 추가 입력 모드 — analysis 초기화는 addEntry가 처리 */
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onReset={clearAll}
          />
        </>
      )}
    </main>
  );
}
