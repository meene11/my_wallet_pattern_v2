"use client";

import { useRef, useState, DragEvent } from "react";
import type { ImpulseThresholds } from "@/lib/types";
import { DEFAULT_THRESHOLDS } from "@/lib/types";

interface Props {
  onAnalyze: (file: File, thresholds: ImpulseThresholds) => void;
  isLoading: boolean;
}

// ── 탐지 기준 설명 데이터 ──────────────────────────────────────────────────────
const CRITERIA = [
  {
    icon: "📊",
    label: "카테고리 평균 초과",
    desc: (t: ImpulseThresholds) =>
      `평소 같은 카테고리 평균의 ${t.catMultiplier}배 넘는 결제`,
  },
  {
    icon: "🌙",
    label: "야간 결제",
    desc: (t: ImpulseThresholds) =>
      `${t.nightHour}시 이후 결제 (충동구매 위험 시간대)`,
  },
  {
    icon: "🔁",
    label: "동일 카테고리 반복",
    desc: (t: ImpulseThresholds) =>
      `하루에 같은 카테고리에서 ${t.freqCount}건 이상 결제`,
  },
  {
    icon: "📈",
    label: "일평균 초과 소비",
    desc: (t: ImpulseThresholds) =>
      `하루 총 지출이 개인 일평균의 ${t.dailyMultiplier}배 넘는 날`,
  },
  {
    icon: "🎉",
    label: "주말 야간 결제",
    desc: () => "토·일요일 야간 시간대 결제 (자동 감지)",
  },
];

// ── 슬라이더 컴포넌트 ─────────────────────────────────────────────────────────
function Slider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span className="text-xs font-bold text-brand-blue">
          {value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #2C4A8A ${((value - min) / (max - min)) * 100}%, #E4EAF4 0%)`,
        }}
      />
      <div className="flex justify-between text-xs text-gray-300 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function UploadCard({ onAnalyze, isLoading }: Props) {
  const [file, setFile]             = useState<File | null>(null);
  const [isDragging, setDrag]       = useState(false);
  const [showCriteria, setShowCrit] = useState(false);
  const [thresholds, setThresholds] = useState<ImpulseThresholds>(DEFAULT_THRESHOLDS);
  const inputRef                    = useRef<HTMLInputElement>(null);

  function set(key: keyof ImpulseThresholds, val: number) {
    setThresholds((prev) => ({ ...prev, [key]: val }));
  }

  function handleFile(f: File) {
    const ext = f.name.toLowerCase().split(".").pop() ?? "";
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      alert("CSV 또는 Excel 파일만 업로드 가능합니다.");
      return;
    }
    setFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="card mb-6">
      <p className="card-title">📂 카드 거래내역 업로드</p>
      <p className="text-xs text-gray-400 mb-4">
        카카오페이 · 신한 · 국민 · 하나 · 우리카드 등 CSV/Excel 내역 지원
      </p>

      {/* 드래그 앤 드롭 */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4
          ${isDragging ? "border-brand-blue bg-brand-light" : "border-gray-200 hover:border-brand-blue hover:bg-gray-50"}`}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {file ? (
          <div>
            <p className="text-2xl mb-2">📄</p>
            <p className="font-semibold text-brand-navy text-sm">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        ) : (
          <div>
            <p className="text-3xl mb-3">☁️</p>
            <p className="text-sm font-medium text-gray-600">파일을 드래그하거나 클릭해서 선택하세요</p>
            <p className="text-xs text-gray-400 mt-1">.csv · .xlsx · .xls (최대 10MB)</p>
          </div>
        )}
      </div>

      {/* ── 탐지 기준 토글 ── */}
      <button
        onClick={() => setShowCrit((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl
                   bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-600
                   hover:bg-brand-light hover:border-brand-blue transition-colors mb-3"
      >
        <span>⚙️ 충동소비 탐지 기준 {showCriteria ? "숨기기" : "보기 · 커스텀"}</span>
        <span className="text-gray-400">{showCriteria ? "▲" : "▼"}</span>
      </button>

      {showCriteria && (
        <div className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50">

          {/* 탐지 기준 설명 */}
          <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">
            5가지 탐지 기준
          </p>
          <div className="space-y-2 mb-5">
            {CRITERIA.map((c, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-base leading-tight">{c.icon}</span>
                <div>
                  <span className="text-xs font-semibold text-brand-navy">{c.label}</span>
                  <span className="text-xs text-gray-400"> — {c.desc(thresholds)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200 my-4" />

          {/* 슬라이더 */}
          <p className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wide">
            기준값 조정
          </p>
          <Slider label="카테고리 평균 배수" value={thresholds.catMultiplier}
            min={1.5} max={5.0} step={0.5} unit="배"
            onChange={(v) => set("catMultiplier", v)} />
          <Slider label="야간 기준 시간" value={thresholds.nightHour}
            min={18} max={23} step={1} unit="시"
            onChange={(v) => set("nightHour", v)} />
          <Slider label="동일 카테고리 반복" value={thresholds.freqCount}
            min={2} max={10} step={1} unit="건"
            onChange={(v) => set("freqCount", v)} />
          <Slider label="일평균 초과 배수" value={thresholds.dailyMultiplier}
            min={1.2} max={3.0} step={0.1} unit="배"
            onChange={(v) => set("dailyMultiplier", v)} />

          <button
            onClick={() => setThresholds(DEFAULT_THRESHOLDS)}
            className="text-xs text-gray-400 hover:text-brand-blue transition-colors"
          >
            ↺ 기본값으로 초기화
          </button>
        </div>
      )}

      {/* 분석 버튼 */}
      <button
        onClick={() => file && onAnalyze(file, thresholds)}
        disabled={!file || isLoading}
        className="btn-primary text-sm"
      >
        {isLoading ? "분석 중…" : "🔍 충동소비 분석하기"}
      </button>

      {file && !isLoading && (
        <button
          onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
          className="w-full mt-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          파일 변경
        </button>
      )}
    </div>
  );
}
