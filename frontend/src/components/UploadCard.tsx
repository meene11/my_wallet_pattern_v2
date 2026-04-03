"use client";

import { useRef, useState, DragEvent } from "react";

interface Props {
  onAnalyze: (file: File) => void;
  isLoading: boolean;
}

export default function UploadCard({ onAnalyze, isLoading }: Props) {
  const [file, setFile]       = useState<File | null>(null);
  const [isDragging, setDrag] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

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

      {/* 드래그 앤 드롭 영역 */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${isDragging
            ? "border-brand-blue bg-brand-light"
            : "border-gray-200 hover:border-brand-blue hover:bg-gray-50"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <div>
            <p className="text-2xl mb-2">📄</p>
            <p className="font-semibold text-brand-navy text-sm">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-3xl mb-3">☁️</p>
            <p className="text-sm font-medium text-gray-600">
              파일을 드래그하거나 클릭해서 선택하세요
            </p>
            <p className="text-xs text-gray-400 mt-1">.csv · .xlsx · .xls (최대 10MB)</p>
          </div>
        )}
      </div>

      {/* 분석 버튼 */}
      <button
        onClick={() => file && onAnalyze(file)}
        disabled={!file || isLoading}
        className="btn-primary text-sm mt-4"
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
