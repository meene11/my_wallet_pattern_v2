"use client";

import { useState } from "react";
import Hero          from "@/components/Hero";
import InputCard     from "@/components/InputCard";
import ResultCard    from "@/components/ResultCard";
import Charts        from "@/components/Charts";
import ActionGuide   from "@/components/ActionGuide";
import ReEngagement  from "@/components/ReEngagement";
import UploadCard    from "@/components/UploadCard";
import UploadResult  from "@/components/UploadResult";
import { useSpending } from "@/hooks/useSpending";
import { analyzeFile } from "@/lib/api";
import type { UploadAnalyzeResponse, ImpulseThresholds } from "@/lib/types";

type Mode = "input" | "upload";

export default function Home() {
  const [mode, setMode] = useState<Mode>("input");

  // 직접 입력 모드 상태
  const {
    entries, analysis, isLoading, error,
    addEntry, clearAll, runAnalysis,
  } = useSpending();

  // 파일 업로드 모드 상태
  const [uploadResult,  setUploadResult]  = useState<UploadAnalyzeResponse | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError,   setUploadError]   = useState<string | null>(null);

  async function handleFileAnalyze(file: File, thresholds: ImpulseThresholds) {
    setUploadLoading(true);
    setUploadError(null);
    try {
      const result = await analyzeFile(file, thresholds);
      setUploadResult(result);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setUploadLoading(false);
    }
  }

  function handleModeChange(m: Mode) {
    setMode(m);
    // 모드 전환 시 이전 결과 초기화
    if (m === "input") { setUploadResult(null); setUploadError(null); }
    if (m === "upload") clearAll();
  }

  return (
    <main>
      {/* ── [1] HERO ─────────────────────────────────────── */}
      <Hero />

      {/* ── 모드 탭 ──────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm">
        <button
          onClick={() => handleModeChange("input")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === "input"
              ? "text-white shadow-sm"
              : "text-gray-500 hover:text-brand-navy"
          }`}
          style={mode === "input"
            ? { background: "linear-gradient(135deg, #2C4A8A, #1A6B5C)" }
            : {}}
        >
          ✏️ 직접 입력
        </button>
        <button
          onClick={() => handleModeChange("upload")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === "upload"
              ? "text-white shadow-sm"
              : "text-gray-500 hover:text-brand-navy"
          }`}
          style={mode === "upload"
            ? { background: "linear-gradient(135deg, #2C4A8A, #1A6B5C)" }
            : {}}
        >
          📂 파일 업로드
        </button>
      </div>

      {/* ── [2-A] 직접 입력 모드 ─────────────────────────── */}
      {mode === "input" && (
        <>
          <InputCard
            entries={entries}
            onAdd={addEntry}
            onAnalyze={runAnalysis}
            onClear={clearAll}
            isLoading={isLoading}
          />

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              ⚠️ {error}
            </div>
          )}

          {analysis && (
            <>
              <ResultCard  analysis={analysis} />
              <Charts      analysis={analysis} />
              <ActionGuide guide={analysis.action_guide} />
              <ReEngagement
                onAddMore={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                onReset={clearAll}
              />
            </>
          )}
        </>
      )}

      {/* ── [2-B] 파일 업로드 모드 ───────────────────────── */}
      {mode === "upload" && (
        <>
          {!uploadResult && (
            <UploadCard
              onAnalyze={handleFileAnalyze}
              isLoading={uploadLoading}
            />
          )}

          {uploadError && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              ⚠️ {uploadError}
            </div>
          )}

          {uploadResult && (
            <UploadResult
              result={uploadResult}
              onReset={() => { setUploadResult(null); setUploadError(null); }}
            />
          )}
        </>
      )}
    </main>
  );
}
