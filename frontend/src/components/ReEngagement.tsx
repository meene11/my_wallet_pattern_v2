interface Props {
  onAddMore: () => void;
  onReset:   () => void;
}

export default function ReEngagement({ onAddMore, onReset }: Props) {
  return (
    <div className="mb-8">
      {/* 재방문 유도 배너 */}
      <div
        className="rounded-2xl p-7 text-center text-white mb-5"
        style={{ background: "linear-gradient(135deg, #1A6B5C, #2C4A8A)" }}
      >
        <p className="text-xl font-bold mb-2">📅 소비를 계속 기록하세요</p>
        <p className="text-white/70 text-sm">
          매일 기록할수록 더 정확한 패턴 분석이 가능합니다
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={onAddMore} className="btn-primary text-sm">
          ➕ 소비 더 추가하기
        </button>
        <button onClick={onReset} className="btn-secondary text-sm">
          🔄 처음부터 다시
        </button>
      </div>
    </div>
  );
}
