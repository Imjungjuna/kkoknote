const DUMMY_FEEDBACKS = [
  { id: "1", content: "다크모드 지원해주세요", upvotes: 24, status: "pending" },
  { id: "2", content: "슬랙 알림 연동이 있으면 좋겠어요", upvotes: 11, status: "progress" },
  { id: "3", content: "CSV 내보내기 기능 추가 부탁드려요", upvotes: 6, status: "pending" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "대기중",
  progress: "개발중",
  done: "완료",
};

export default function WidgetMockup() {
  return (
    <div className="w-72 bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-zinc-900">피드백</span>
        <span className="text-[11px] text-zinc-400">KkokNote</span>
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
        {DUMMY_FEEDBACKS.map((item) => (
          <div
            key={item.id}
            className="border border-zinc-100 rounded-xl p-3 flex flex-col gap-2"
          >
            <p className="text-[12px] text-zinc-700 leading-snug">{item.content}</p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded border border-zinc-200 text-zinc-500">
                ▲ {item.upvotes}
              </span>
              <span className="text-[11px] text-zinc-400">
                {STATUS_LABEL[item.status]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input row */}
      <div className="px-3 pb-3 flex gap-2">
        <div className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-[11px] text-zinc-400">
          피드백을 남겨주세요…
        </div>
        <button className="w-8 h-8 rounded-lg bg-zinc-900 text-white text-[11px] flex items-center justify-center shrink-0">
          →
        </button>
      </div>
    </div>
  );
}
