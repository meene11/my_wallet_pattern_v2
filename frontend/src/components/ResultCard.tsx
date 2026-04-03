import type { AnalyzeResponse } from "@/lib/types";

interface Props {
  analysis: AnalyzeResponse;
}

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="rotate-[-90deg]">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke="#5DEBB8" strokeWidth="6"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ResultCard({ analysis }: Props) {
  const { spending_type, impulse_score, emotion_spending_ratio, total, count } = analysis;

  return (
    <div className="gradient-card mb-6">
      {/* 타입 + 설명 */}
      <h2 className="text-2xl font-black mb-2">{spending_type.name}</h2>
      <p className="text-white/75 text-sm mb-6">{spending_type.summary}</p>

      {/* 지표 3개 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center">
          <ScoreRing score={impulse_score} />
          <span className="metric-value text-2xl mt-1">{impulse_score}점</span>
          <span className="text-white/60 text-xs mt-1 text-center">충동 소비 지수</span>
        </div>
        <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
          <span className="metric-value">{emotion_spending_ratio}%</span>
          <span className="text-white/60 text-xs mt-1 text-center">감정 소비 비율</span>
        </div>
        <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
          <span className="metric-value text-2xl">{(total / 10000).toFixed(1)}만</span>
          <span className="text-white/60 text-xs mt-1 text-center">
            총 소비 ({count}건)
          </span>
        </div>
      </div>

      {/* 특성 리스트 */}
      <div className="bg-white/10 rounded-xl p-4 space-y-1.5">
        {spending_type.characteristics.map((c, i) => (
          <p key={i} className="text-white/80 text-sm">• {c}</p>
        ))}
      </div>
    </div>
  );
}
