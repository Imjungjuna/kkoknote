const DUMMY_FEEDBACKS = [
  { id: "1", content: "다크모드 지원해주세요", upvotes: 24, status: "pending", voted: true },
  { id: "2", content: "슬랙 알림 연동이 있으면 좋겠어요", upvotes: 11, status: "progress", voted: false },
  { id: "3", content: "CSV 내보내기 기능 추가 부탁드려요", upvotes: 6, status: "pending", voted: false },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: "대기중",
    className: "bg-zinc-100 text-zinc-500",
  },
  progress: {
    label: "개발중",
    className: "bg-blue-50 text-blue-500",
  },
  done: {
    label: "완료",
    className: "bg-emerald-50 text-emerald-600",
  },
};

export default function WidgetMockup() {
  return (
    <div className="w-72 bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-zinc-900">피드백</span>
        <span className="text-[11px] font-medium tracking-tight text-zinc-400">
          KkokNote
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100">
        <button className="flex-1 py-2.5 text-[12px] font-medium text-zinc-900 border-b-2 border-zinc-900">
          피드백
        </button>
        <button className="flex-1 py-2.5 text-[12px] text-zinc-400">
          업데이트
        </button>
      </div>

      {/* Feedback list */}
      <div className="p-3 flex flex-col gap-2">
        {DUMMY_FEEDBACKS.map((item) => {
          const status = STATUS_CONFIG[item.status];
          return (
            <div
              key={item.id}
              className="border border-zinc-100 rounded-xl p-3 flex gap-3 items-start"
            >
              {/* Upvote button */}
              <button
                className={`shrink-0 flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg border text-[10px] font-semibold transition-colors ${
                  item.voted
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-400"
                }`}
              >
                ▲
                <span>{item.upvotes}</span>
              </button>

              {/* Content */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <p className="text-[12px] font-semibold text-zinc-800 leading-snug">
                  {item.content}
                </p>
                <span
                  className={`self-start text-[10px] font-medium px-1.5 py-0.5 rounded-md ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input row */}
      <div className="px-3 pb-3 flex gap-2">
        <div className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-[11px] text-zinc-400">
          피드백을 남겨주세요…
        </div>
        <button className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
