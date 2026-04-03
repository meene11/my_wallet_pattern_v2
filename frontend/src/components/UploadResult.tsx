"use client";

import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import type { ImpulseThresholds, UploadAnalyzeResponse } from "@/lib/types";
import ActionGuide from "@/components/ActionGuide";
import BlurGate from "@/components/BlurGate";
import { useAuth } from "@/context/AuthContext";
import { saveUploadHistory } from "@/lib/api";

interface Props {
  result:     UploadAnalyzeResponse;
  thresholds?: ImpulseThresholds;
  onReset:    () => void;
}

const BRAND_COLORS = [
  "#1B2A4A", "#2C4A8A", "#3A6BC9", "#5B9BD5",
  "#1A6B5C", "#27AE60", "#5DEBB8", "#A8D8C8",
];

function scoreInfo(score: number) {
  if (score <= 30) return { emoji: "😊", label: "안전",      color: "#27AE60" };
  if (score <= 50) return { emoji: "😐", label: "주의",      color: "#F5A623" };
  if (score <= 70) return { emoji: "😟", label: "위험",      color: "#E67E22" };
  return           { emoji: "😡", label: "매우 위험", color: "#E74C3C" };
}

function ScoreRing({ score }: { score: number }) {
  const r = 26, circ = 2 * Math.PI * r;
  const { color } = scoreInfo(score);
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" className="rotate-[-90deg]">
      <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
      <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

export default function UploadResult({ result, thresholds, onReset }: Props) {
  const [showAll, setShowAll]   = useState(false);
  const [saved,   setSaved]     = useState(false);
  const { appToken, isLoggedIn } = useAuth();

  async function handleSave() {
    if (!appToken) return;
    try {
      await saveUploadHistory(result, appToken, thresholds);
      setSaved(true);
    } catch (e) {
      console.error("이력 저장 실패:", e);
    }
  }

  const {
    total, count, impulse_count, impulse_amount,
    impulse_ratio, impulse_score, cat_ratios,
    impulse_items, action_guide,
  } = result;

  const catData = Object.entries(cat_ratios).map(([name, value]) => ({ name, value }));
  const impulseData = [
    { name: "충동소비", value: impulse_ratio },
    { name: "일반소비", value: Math.max(0, 100 - impulse_ratio) },
  ];
  const IMPULSE_COLORS = ["#E74C3C", "#E8EDF5"];

  const displayed = showAll ? impulse_items : impulse_items.slice(0, 5);

  return (
    <div>
      {/* ── 요약 카드 ── */}
      <div
        className="rounded-2xl p-7 text-white mb-6"
        style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #2C4A8A 55%, #1A6B5C 100%)" }}
      >
        <h2 className="text-2xl font-black mb-1">📊 한 달 소비 분석 결과</h2>
        <p className="text-white/70 text-sm mb-6">
          총 {count.toLocaleString()}건 · {total.toLocaleString()}원
        </p>

        <div className="grid grid-cols-3 gap-3">
          {/* 충동 소비 지수 */}
          <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center">
            <ScoreRing score={impulse_score} />
            <span className="text-3xl font-black mt-1" style={{ color: scoreInfo(impulse_score).color }}>
              {impulse_score}점
            </span>
            <span className="text-xl mt-0.5">{scoreInfo(impulse_score).emoji}</span>
            <span className="text-white/60 text-xs mt-0.5 text-center font-semibold">
              {scoreInfo(impulse_score).label}
            </span>
          </div>
          {/* 충동소비 금액 */}
          <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-brand-mint">
              {(impulse_amount / 10000).toFixed(1)}만
            </span>
            <span className="text-white/60 text-xs mt-1 text-center">
              충동소비 ({impulse_ratio}%)
            </span>
          </div>
          {/* 충동소비 건수 */}
          <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-brand-mint">{impulse_count}건</span>
            <span className="text-white/60 text-xs mt-1 text-center">충동소비 건수</span>
          </div>
        </div>
      </div>

      {/* ── 이력 저장 버튼 (로그인 회원) ── */}
      {isLoggedIn && !saved && (
        <button
          onClick={handleSave}
          className="w-full mb-4 py-2.5 rounded-xl border border-brand-blue text-brand-blue
                     text-sm font-semibold hover:bg-brand-light transition-colors"
        >
          💾 분석 결과 저장하기
        </button>
      )}
      {saved && (
        <div className="mb-4 text-center text-xs text-green-600 font-semibold">
          ✅ 마이페이지에 저장되었습니다
        </div>
      )}

      {/* ── 차트 ── */}
      <BlurGate label="소비 패턴 시각화는 회원 전용 기능입니다">
      <div className="card mb-6">
        <p className="card-title">📊 소비 패턴 시각화</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 카테고리 파이 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 text-center">카테고리별 지출 비율</p>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" outerRadius={85} innerRadius={38}
                  dataKey="value" labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
                    if (percent < 0.08) return null;
                    const r = innerRadius + (outerRadius - innerRadius) * 0.6;
                    const x = cx + r * Math.cos(-midAngle * Math.PI / 180);
                    const y = cy + r * Math.sin(-midAngle * Math.PI / 180);
                    return <text x={x} y={y} fill="#fff" textAnchor="middle"
                      dominantBaseline="central" fontSize={10} fontWeight={600}>
                      {name} {(percent * 100).toFixed(0)}%
                    </text>;
                  }}>
                  {catData.map((_, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "비율"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 충동 vs 일반 도넛 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 text-center">충동소비 vs 일반소비</p>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={impulseData} cx="50%" cy="50%" outerRadius={85} innerRadius={38}
                  dataKey="value" labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
                    if (percent < 0.05) return null;
                    const r = innerRadius + (outerRadius - innerRadius) * 0.6;
                    const x = cx + r * Math.cos(-midAngle * Math.PI / 180);
                    const y = cy + r * Math.sin(-midAngle * Math.PI / 180);
                    return <text x={x} y={y} fill="#fff" textAnchor="middle"
                      dominantBaseline="central" fontSize={10} fontWeight={600}>
                      {name} {(percent * 100).toFixed(0)}%
                    </text>;
                  }}>
                  {impulseData.map((_, i) => <Cell key={i} fill={IMPULSE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "비율"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      </BlurGate>

      {/* ── 충동소비 항목 목록 ── */}
      {impulse_items.length > 0 && (
      <BlurGate label="충동소비 의심 항목은 회원 전용 기능입니다">
        <div className="card mb-6">
          <p className="card-title">🚨 충동소비 의심 항목</p>
          <p className="text-xs text-gray-400 mb-4">
            금액 기준 상위 {impulse_items.length}건 · 총 {impulse_amount.toLocaleString()}원
          </p>
          <div className="space-y-2">
            {displayed.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-navy truncate">{item.merchant}</p>
                  <p className="text-xs text-gray-400">{item.date} · {item.category}</p>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="text-sm font-bold text-red-500">
                    {item.amount.toLocaleString()}원
                  </p>
                  <p className="text-xs text-gray-400">{item.impulse_reason}</p>
                </div>
              </div>
            ))}
          </div>
          {impulse_items.length > 5 && (
            <button
              onClick={() => setShowAll((p) => !p)}
              className="w-full mt-3 text-xs text-brand-blue hover:underline"
            >
              {showAll ? "접기 ▲" : `나머지 ${impulse_items.length - 5}건 더 보기 ▼`}
            </button>
          )}
        </div>
      </BlurGate>
      )}

      {/* ── AI 코치 ── */}
      <BlurGate label="오늘의 행동 가이드는 회원 전용 기능입니다">
        <ActionGuide guide={action_guide} />
      </BlurGate>

      {/* ── 다시 분석 ── */}
      <button onClick={onReset} className="btn-secondary text-sm mb-8">
        🔄 다른 파일 분석하기
      </button>
    </div>
  );
}
