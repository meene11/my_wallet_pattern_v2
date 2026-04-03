"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { getHistory, getActiveChallenge } from "@/lib/api";
import type { ChallengeOut, HistoryItem } from "@/lib/types";

// ── 점수 → 이모지/색상 ────────────────────────────────────────────────────────
function scoreInfo(score: number) {
  if (score <= 30) return { emoji: "😊", label: "안전",      color: "#27AE60" };
  if (score <= 50) return { emoji: "😐", label: "주의",      color: "#F5A623" };
  if (score <= 70) return { emoji: "😟", label: "위험",      color: "#E67E22" };
  return           { emoji: "😡", label: "매우 위험", color: "#E74C3C" };
}

// ── 날짜 포맷 ────────────────────────────────────────────────────────────────
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

// ── 이력 카드 ─────────────────────────────────────────────────────────────────
function HistoryCard({ item }: { item: HistoryItem }) {
  const [open, setOpen] = useState(false);
  const info = scoreInfo(item.impulse_score);

  return (
    <div className="card mb-3">
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.emoji}</span>
          <div className="text-left">
            <p className="text-xs text-gray-400">{fmt(item.analyzed_at)}</p>
            <p className="text-sm font-bold text-brand-navy">
              {item.total.toLocaleString()}원 · {item.count}건
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400">충동지수</p>
            <p className="text-lg font-black" style={{ color: info.color }}>
              {item.impulse_score}점
            </p>
          </div>
          <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {/* 카테고리 비율 */}
          <p className="text-xs font-bold text-gray-500 mb-2">카테고리별 지출</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Object.entries(item.cat_ratios)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([k, v]) => (
                <span key={k} className="text-xs bg-brand-light text-brand-blue px-2 py-0.5 rounded-full font-semibold">
                  {k} {v.toFixed(0)}%
                </span>
              ))}
          </div>

          {/* 충동소비 항목 */}
          {item.impulse_items.length > 0 && (
            <>
              <p className="text-xs font-bold text-gray-500 mb-2">충동소비 의심 상위 3건</p>
              <div className="space-y-1.5 mb-4">
                {item.impulse_items.slice(0, 3).map((imp, i) => (
                  <div key={i} className="flex justify-between bg-red-50 rounded-lg px-3 py-2 text-xs">
                    <span className="font-semibold text-brand-navy">{imp.merchant}</span>
                    <span className="text-red-500 font-bold">{imp.amount.toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 행동 가이드 */}
          <p className="text-xs font-bold text-gray-500 mb-2">받은 행동 가이드</p>
          <div className="space-y-1">
            {item.action_guide.warnings?.map((w: string, i: number) => (
              <p key={i} className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5">⚠️ {w}</p>
            ))}
            {item.action_guide.actions?.map((a: string, i: number) => (
              <p key={i} className="text-xs text-brand-navy bg-brand-light rounded-lg px-3 py-1.5">👉 {a}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 메인 마이페이지 ───────────────────────────────────────────────────────────
export default function MyPage() {
  const { user, appToken, isLoggedIn, isLoading, logout } = useAuth();
  const router = useRouter();

  const [history,   setHistory]   = useState<HistoryItem[]>([]);
  const [challenge, setChallenge] = useState<ChallengeOut | null>(null);
  const [fetching,  setFetching]  = useState(true);

  // 비로그인 → 메인으로 리다이렉트
  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace("/");
  }, [isLoading, isLoggedIn, router]);

  // 이력 + 챌린지 로드
  useEffect(() => {
    if (!appToken) return;
    (async () => {
      try {
        const [h, c] = await Promise.all([
          getHistory(appToken),
          getActiveChallenge(appToken),
        ]);
        setHistory(h);
        setChallenge(c);
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    })();
  }, [appToken]);

  if (isLoading || !isLoggedIn) return null;

  // 추이 차트 데이터
  const chartData = [...history]
    .reverse()
    .map((h) => ({
      date:  fmt(h.analyzed_at),
      score: h.impulse_score,
    }));

  // 개선율 계산
  const improvement = history.length >= 2
    ? history[history.length - 1].impulse_score - history[0].impulse_score
    : null;

  return (
    <main>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-brand-navy transition-colors">
          ← 메인으로
        </Link>
        <button onClick={logout} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
          로그아웃
        </button>
      </div>

      {/* ── 프로필 카드 ── */}
      <div
        className="rounded-2xl p-6 text-white mb-6"
        style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #2C4A8A 55%, #1A6B5C 100%)" }}
      >
        <div className="flex items-center gap-4">
          {user?.avatar_url ? (
            <Image src={user.avatar_url} alt="avatar" width={56} height={56}
              className="rounded-full border-2 border-white/30" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {user?.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <p className="font-black text-xl">{user?.name ?? "사용자"}</p>
            <p className="text-white/60 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* 요약 수치 */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-brand-mint">{history.length}</p>
            <p className="text-white/60 text-xs mt-0.5">분석 횟수</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-brand-mint">
              {history.length > 0 ? scoreInfo(history[0].impulse_score).emoji : "—"}
            </p>
            <p className="text-white/60 text-xs mt-0.5">최근 상태</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black" style={{
              color: improvement === null ? "#5DEBB8"
                   : improvement < 0 ? "#27AE60"
                   : "#E74C3C"
            }}>
              {improvement === null ? "—"
               : improvement < 0 ? `↓${Math.abs(improvement)}`
               : `↑${improvement}`}
            </p>
            <p className="text-white/60 text-xs mt-0.5">점수 변화</p>
          </div>
        </div>
      </div>

      {/* ── 챌린지 현황 ── */}
      {challenge && (
        <div className="card mb-6 border-l-4 border-brand-blue">
          <p className="card-title">🎯 진행 중인 챌린지</p>
          <p className="text-sm text-gray-600">
            시작일: {fmt(challenge.started_at)} · 목표 지수: <strong>{challenge.target_score}점 이하</strong>
          </p>
          {history.length > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>현재 {history[0].impulse_score}점</span>
                <span>목표 {challenge.target_score}점</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0,
                      ((history[0].impulse_score - challenge.target_score) /
                       history[0].impulse_score) * 100
                    ))}%`,
                    background: "linear-gradient(to right, #27AE60, #5DEBB8)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 충동소비 추이 차트 ── */}
      {chartData.length >= 2 && (
        <div className="card mb-6">
          <p className="card-title">📈 충동소비 지수 추이</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v: number) => [`${v}점`, "충동지수"]}
                contentStyle={{ fontSize: 12 }}
              />
              {challenge && (
                <ReferenceLine y={challenge.target_score} stroke="#27AE60"
                  strokeDasharray="4 4" label={{ value: "목표", fontSize: 10, fill: "#27AE60" }} />
              )}
              <Line
                type="monotone" dataKey="score"
                stroke="#2C4A8A" strokeWidth={2.5}
                dot={{ fill: "#2C4A8A", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── 분석 이력 목록 ── */}
      <p className="card-title mb-3">🗂 분석 이력</p>
      {fetching ? (
        <p className="text-sm text-gray-400 text-center py-8">불러오는 중…</p>
      ) : history.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-3xl mb-3">📂</p>
          <p className="text-sm text-gray-500">아직 저장된 분석 이력이 없어요</p>
          <Link href="/" className="mt-3 inline-block text-xs text-brand-blue font-semibold hover:underline">
            파일 업로드 분석 시작하기 →
          </Link>
        </div>
      ) : (
        history.map((item) => <HistoryCard key={item.id} item={item} />)
      )}
    </main>
  );
}
