import type { AnalyzeResponse } from "@/lib/types";

interface Props {
  analysis: AnalyzeResponse;
}

// ── 충동 지수 → 레벨 정보 ─────────────────────────────────────────────────────
function scoreLevel(score: number) {
  if (score <= 30) return { label: "안전",      color: "#27AE60", bg: "bg-green-50",  text: "text-green-700",  emoji: "😊" };
  if (score <= 50) return { label: "주의",      color: "#F5A623", bg: "bg-amber-50",  text: "text-amber-700",  emoji: "😐" };
  if (score <= 70) return { label: "위험",      color: "#E67E22", bg: "bg-orange-50", text: "text-orange-700", emoji: "😟" };
  return           { label: "매우 위험", color: "#E74C3C", bg: "bg-red-50",    text: "text-red-700",    emoji: "😡" };
}

// ── 소비 유형 → 한 줄 진단 ───────────────────────────────────────────────────
const DIAGNOSIS: Record<string, { title: string; sub: string }> = {
  stress:   { title: "스트레스 해소형 소비 패턴",   sub: "힘든 순간 소비로 감정을 달래는 경향이 있어요." },
  reward:   { title: "보상 심리형 소비 패턴",       sub: "스스로에게 보상을 주는 소비가 반복되고 있어요." },
  impulse:  { title: "충동 구매 주의형 소비 패턴",  sub: "계획 없는 즉흥 소비가 지갑을 위협하고 있어요." },
  balanced: { title: "균형 잡힌 소비 패턴",         sub: "지출 조절이 잘 되고 있어요. 이 패턴을 유지하세요!" },
};

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="rotate-[-90deg]">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

export default function ResultCard({ analysis }: Props) {
  const { spending_type, spending_type_key, impulse_score, emotion_spending_ratio, total, count } = analysis;
  const level = scoreLevel(impulse_score);
  const dx = DIAGNOSIS[spending_type_key] ?? { title: spending_type.name, sub: spending_type.summary };

  return (
    <>
      {/* ── 한 줄 진단 배너 ── */}
      <div className={`rounded-2xl px-5 py-4 mb-4 border ${level.bg} border-opacity-60`}
           style={{ borderColor: level.color + "40" }}>
        <div className="flex items-start gap-3">
          <span className="text-3xl mt-0.5">{level.emoji}</span>
          <div>
            <p className="font-black text-brand-navy text-base leading-snug">
              당신은 &lsquo;<span style={{ color: level.color }}>{dx.title}</span>&rsquo;입니다
            </p>
            <p className="text-sm text-gray-500 mt-1">{dx.sub}</p>
            <span className={`inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full ${level.bg} ${level.text}`}>
              충동 소비 지수 {impulse_score}점 — {level.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── 메인 결과 카드 ── */}
      <div className="gradient-card mb-6">
        <h2 className="text-2xl font-black mb-1">{spending_type.name}</h2>
        <p className="text-white/75 text-sm mb-6">{spending_type.summary}</p>

        {/* 지표 3개 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center">
            <ScoreRing score={impulse_score} color={level.color} />
            <span className="text-3xl font-black mt-1" style={{ color: level.color }}>
              {impulse_score}점
            </span>
            <span className="text-white/60 text-xs mt-1 text-center">충동 소비 지수</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-brand-mint">{emotion_spending_ratio}%</span>
            <span className="text-white/60 text-xs mt-1 text-center">🧠 감정 소비</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-brand-mint">{(total / 10000).toFixed(1)}만</span>
            <span className="text-white/60 text-xs mt-1 text-center">💰 총 소비 ({count}건)</span>
          </div>
        </div>

        {/* 특성 리스트 */}
        <div className="bg-white/10 rounded-xl p-4 space-y-1.5">
          {spending_type.characteristics.map((c, i) => (
            <p key={i} className="text-white/80 text-sm">• {c}</p>
          ))}
        </div>
      </div>
    </>
  );
}
