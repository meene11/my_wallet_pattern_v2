export default function Hero() {
  return (
    <div className="gradient-card mb-7 text-center">
      {/* 배지 */}
      <span className="inline-block mb-5 px-4 py-1.5 rounded-full text-xs font-medium
                       bg-white/15 border border-white/30 text-white/90 tracking-wide">
        ✨ 감정 소비 분석 서비스 v2
      </span>

      {/* 타이틀 */}
      <h1 className="text-4xl font-black leading-tight mb-4 text-white">
        내 소비는<br />감정 때문일까?
      </h1>

      {/* 서브텍스트 */}
      <p className="text-white/75 text-base leading-relaxed">
        지출 패턴 + 감정 데이터를 기반으로<br />
        당신의 소비 습관을 진단합니다
      </p>

      {/* Before / After 메시지 */}
      <div className="mt-6 flex justify-center gap-6 text-sm text-white/70">
        <span>❌ 그냥 소비함</span>
        <span className="text-brand-mint font-semibold">→</span>
        <span className="text-brand-mint font-semibold">✅ 이유를 알고 소비함</span>
      </div>
    </div>
  );
}
