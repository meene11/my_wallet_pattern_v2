"use client";

import { useState } from "react";
import type { Category, Emotion, SpendingEntryWithMeta } from "@/lib/types";
import { CATEGORIES, EMOTIONS } from "@/lib/types";

interface Props {
  onAdd:      (amount: number, category: Category, emotion: Emotion) => void;
  onAnalyze:  () => void;
  onClear:    () => void;
  isLoading:  boolean;
  entries:    SpendingEntryWithMeta[];
}

const EMOTION_EMOJI: Record<Emotion, string> = {
  스트레스: "😤",
  보상:     "🎁",
  충동:     "⚡",
  필요:     "🧾",
};

export default function InputCard({ onAdd, onAnalyze, onClear, isLoading, entries }: Props) {
  const [amount,   setAmount]   = useState<string>("");
  const [category, setCategory] = useState<Category>("식비");
  const [emotion,  setEmotionS] = useState<Emotion>("스트레스");
  const [error,    setError]    = useState<string>("");

  function handleAdd() {
    const num = parseInt(amount.replace(/,/g, ""), 10);
    if (!num || num <= 0) {
      setError("금액을 올바르게 입력해주세요.");
      return;
    }
    setError("");
    onAdd(num, category, emotion);
    setAmount("");
  }

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="card mb-6">
      <p className="card-title">📝 오늘의 소비 입력</p>

      {/* 3열 입력 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* 금액 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">💰 금액 (원)</label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setAmount(raw ? parseInt(raw, 10).toLocaleString("ko-KR") : "");
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="15,000"
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        </div>

        {/* 카테고리 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">📂 카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-blue/30 bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* 감정 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">🧠 감정 상태</label>
          <select
            value={emotion}
            onChange={(e) => setEmotionS(e.target.value as Emotion)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-blue/30 bg-white"
          >
            {EMOTIONS.map((em) => (
              <option key={em} value={em}>
                {EMOTION_EMOJI[em]} {em}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

      {/* 버튼 행 */}
      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          className="btn-secondary text-sm flex-shrink-0 w-auto px-5 py-3"
        >
          ➕ 추가
        </button>
        <button
          onClick={onAnalyze}
          disabled={entries.length === 0 || isLoading}
          className="btn-primary flex-1 text-sm"
          style={{ paddingTop: "12px", paddingBottom: "12px" }}
        >
          {isLoading
            ? "분석 중…"
            : entries.length === 0
              ? "소비를 먼저 입력해주세요"
              : `🔍 ${entries.length}건 소비 분석하기`}
        </button>
      </div>

      {/* 입력된 내역 */}
      {entries.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-500">
              📋 입력 내역 ({entries.length}건 · 합계 {totalAmount.toLocaleString()}원)
            </span>
            <button
              onClick={onClear}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              🗑 초기화
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between text-sm
                           bg-gray-50 rounded-xl px-3 py-2"
              >
                <span className="font-bold text-brand-navy">
                  {e.amount.toLocaleString("ko-KR")}원
                </span>
                <span className="text-gray-500 text-xs">{e.category}</span>
                <span className="text-gray-500 text-xs">
                  {EMOTION_EMOJI[e.emotion]} {e.emotion}
                </span>
                <span className="text-gray-400 text-xs">{e.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
