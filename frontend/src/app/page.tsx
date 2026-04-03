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
import { analyzeFile, saveInputHistory } from "@/lib/api";
import type { UploadAnalyzeResponse, ImpulseThresholds } from "@/lib/types";
import AuthButton from "@/components/AuthButton";
import { useAuth } from "@/context/AuthContext";

type Mode = "input" | "upload";

export default function Home() {
  const [mode, setMode] = useState<Mode>("input");
  const { appToken, isLoggedIn } = useAuth();

  // 직접 입력 모드 상태
  const {
    entries, analysis, isLoading, error,
    addEntry, clearAll, runAnalysis,
  } = useSpending();
  const [inputSaved,  setInputSaved]  = useState(false);
  const [inputSaving, setInputSaving] = useState(false);

  // 파일 업로드 모드 상태
  const [uploadResult,     setUploadResult]     = useState<UploadAnalyzeResponse | null>(null);
  const [uploadThresholds, setUploadThresholds] = useState<ImpulseThresholds | undefined>();
  const [uploadLoading,    setUploadLoading]    = useState(false);
  const [uploadError,      setUploadError]      = useState<string | null>(null);

  async function handleFileAnalyze(file: File, thresholds: ImpulseThresholds) {
    setUploadLoading(true);
    setUploadError(null);
    setUploadThresholds(thresholds);
    try {
      const result = await analyzeFile(file, thresholds);
      setUploadResult(result);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleSaveInput() {
    if (!appToken || !analysis) return;
    setInputSaving(true);
    try {
      await saveInputHistory(analysis, appToken);
      setInputSaved(true);
    } catch (e) {
      console.error("저장 실패:", e);
    } finally {
      setInputSaving(false);
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
      {/* ── 헤더: 로그인 버튼 ── */}
      <div className="flex justify-end mb-2">
        <AuthButton />
      </div>

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
              {/* 섹션 구분 */}
              <div className="section-divider">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
                  분석 결과
                </span>
              </div>

              <ResultCard analysis={analysis} />
              <Charts     analysis={analysis} />
              <ActionGuide guide={analysis.action_guide} />

              {/* 이력 저장 버튼 */}
              {isLoggedIn && (
                <div className="mb-4">
                  {inputSaved ? (
                    <p className="text-center text-xs text-green-600 font-semibold py-2">
                      ✅ 마이페이지에 저장되었습니다
                    </p>
                  ) : (
                    <button
                      onClick={handleSaveInput}
                      disabled={inputSaving}
                      className="w-full py-2.5 rounded-xl border border-brand-blue text-brand-blue
                                 text-sm font-semibold hover:bg-brand-light transition-colors"
                    >
                      {inputSaving ? "저장 중…" : "💾 분석 결과 저장하기"}
                    </button>
                  )}
                </div>
              )}

              <ReEngagement
                onAddMore={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                onReset={() => { clearAll(); setInputSaved(false); }}
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
              thresholds={uploadThresholds}
              onReset={() => { setUploadResult(null); setUploadError(null); }}
            />
          )}
        </>
      )}
    </main>
  );
}
