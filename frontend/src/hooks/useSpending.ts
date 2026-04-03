"use client";

import { useState, useCallback } from "react";
import { analyzeSpending } from "@/lib/api";
import type {
  AnalyzeResponse,
  Category,
  Emotion,
  SpendingEntryWithMeta,
} from "@/lib/types";

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function nowHHMM(): string {
  return new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export interface UseSpendingReturn {
  entries:    SpendingEntryWithMeta[];
  analysis:   AnalyzeResponse | null;
  isLoading:  boolean;
  error:      string | null;
  addEntry:   (amount: number, category: Category, emotion: Emotion) => void;
  removeEntry:(id: string) => void;
  clearAll:   () => void;
  runAnalysis:() => Promise<void>;
}

export function useSpending(): UseSpendingReturn {
  const [entries,   setEntries]   = useState<SpendingEntryWithMeta[]>([]);
  const [analysis,  setAnalysis]  = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const addEntry = useCallback(
    (amount: number, category: Category, emotion: Emotion) => {
      setEntries((prev) => [
        ...prev,
        { id: uid(), time: nowHHMM(), amount, category, emotion },
      ]);
      setAnalysis(null); // 새 항목 추가 시 이전 결과 초기화
    },
    []
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setAnalysis(null);
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    setAnalysis(null);
    setError(null);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (entries.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeSpending(
        entries.map(({ amount, category, emotion }) => ({ amount, category, emotion }))
      );
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [entries]);

  return { entries, analysis, isLoading, error, addEntry, removeEntry, clearAll, runAnalysis };
}
