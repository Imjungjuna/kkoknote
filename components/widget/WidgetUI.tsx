"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWidgetStore } from "../../src/store/useWidgetStore";
import { createClient } from "../../lib/supabase/client";

export default function WidgetUI({ projectKey }: { projectKey: string }) {
  const initWidget = useWidgetStore((s) => s.initWidget);
  const identifiedUser = useWidgetStore((s) => s.identifiedUser);
  const applyRealtimeUpdate = useWidgetStore((s) => s.applyRealtimeUpdate);
  const feedbacks = useWidgetStore((s) => s.feedbacks);
  const updates = useWidgetStore((s) => s.updates);
  const createFeedback = useWidgetStore((s) => s.createFeedback);
  const vote = useWidgetStore((s) => s.vote);

  useEffect(() => {
    void initWidget(projectKey);
  }, [initWidget, projectKey]);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"feedback" | "updates">("feedback");
  const [draft, setDraft] = useState("");
  const [submitInFlight, setSubmitInFlight] = useState(false);
  const [voteInFlightForId, setVoteInFlightForId] = useState<string | null>(null);
  const [submitRemainingSec, setSubmitRemainingSec] = useState(0);
  const [voteRemainingSec, setVoteRemainingSec] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const submitQueueRef = useRef<number[]>([]);
  const voteQueueRef = useRef<number[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const consumeRate = (queueRef: { current: number[] }, nowMs: number) => {
    const windowMs = 60_000;
    const limit = 5;
    const q = queueRef.current;
    const cutoff = nowMs - windowMs;
    while (q.length > 0 && q[0] < cutoff) q.shift();
    if (q.length >= limit) {
      const earliest = q[0] ?? nowMs;
      const remainingMs = windowMs - (nowMs - earliest);
      const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
      return { allowed: false as const, remainingSec };
    }
    q.push(nowMs);
    return { allowed: true as const, remainingSec: 0 };
  };

  const voteLocalKey = (feedbackId: string) =>
    `kkoknote:votes:${projectKey}:${feedbackId}`;

  const disabledBecauseRate = useMemo(
    () => ({ submit: submitRemainingSec > 0, vote: voteRemainingSec > 0 }),
    [submitRemainingSec, voteRemainingSec]
  );

  useEffect(() => {
    if (submitRemainingSec <= 0) return;
    const t = window.setInterval(() => setSubmitRemainingSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [submitRemainingSec]);

  useEffect(() => {
    if (voteRemainingSec <= 0) return;
    const t = window.setInterval(() => setVoteRemainingSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [voteRemainingSec]);

  const onSubmitFeedback = async () => {
    if (submitInFlight) return;
    const content = draft.trim();
    if (!content) { showToast("내용을 입력해줘"); return; }
    const now = Date.now();
    const res = consumeRate(submitQueueRef, now);
    if (!res.allowed) {
      setSubmitRemainingSec(res.remainingSec);
      showToast("너무 자주 보냈어. 잠시만 쉬어줘");
      return;
    }
    setSubmitInFlight(true);
    try {
      await createFeedback(content);
      setDraft("");
      showToast("제출 완료");
    } catch {
      showToast("제출에 실패했어");
    } finally {
      setSubmitInFlight(false);
    }
  };

  const onVote = async (feedbackId: string) => {
    if (voteInFlightForId === feedbackId) return;
    try {
      if (localStorage.getItem(voteLocalKey(feedbackId))) {
        showToast("이미 투표했어");
        return;
      }
    } catch { /* ignore */ }
    const now = Date.now();
    const res = consumeRate(voteQueueRef, now);
    if (!res.allowed) {
      setVoteRemainingSec(res.remainingSec);
      showToast("너무 자주 보냈어. 잠시만 쉬어줘");
      return;
    }
    setVoteInFlightForId(feedbackId);
    try {
      await vote(feedbackId);
    } catch {
      showToast("투표에 실패했어");
    } finally {
      setVoteInFlightForId(null);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`kkoknote:feedbacks:${projectKey}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "feedbacks", filter: `project_id=eq.${projectKey}` }, (payload) => applyRealtimeUpdate(payload))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feedbacks", filter: `project_id=eq.${projectKey}` }, (payload) => applyRealtimeUpdate(payload))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [applyRealtimeUpdate, projectKey]);

  const statusLabel = (s: string) => {
    if (s === "pending") return "대기중";
    if (s === "progress") return "개발중";
    if (s === "done") return "완료";
    return s;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
    } catch { return iso; }
  };

  return (
    <div className="kkoknote-host">
      {isOpen && (
        <div className="kkoknote-panel">
          {/* 헤더 */}
          <div className="kkoknote-panel-header">
            <span className="kkoknote-panel-title">콕노트</span>
            <span className="kkoknote-panel-user">
              {identifiedUser ? identifiedUser.id.slice(0, 8) : "익명"}
            </span>
          </div>

          {/* 탭 바 */}
          <div className="kkoknote-tab-bar">
            <button
              type="button"
              className={`kkoknote-tab${activeTab === "feedback" ? " active" : ""}`}
              onClick={() => setActiveTab("feedback")}
            >
              피드백
            </button>
            <button
              type="button"
              className={`kkoknote-tab${activeTab === "updates" ? " active" : ""}`}
              onClick={() => setActiveTab("updates")}
            >
              업데이트
            </button>
          </div>

          {/* 패널 콘텐츠 */}
          <div className="kkoknote-panel-inner">
            {toastMsg && (
              <div className="kkoknote-toast" role="status">{toastMsg}</div>
            )}

            {activeTab === "feedback" && (
              <>
                {/* 피드백 입력 */}
                <div style={{ marginTop: 12 }}>
                  <textarea
                    className="kkoknote-textarea"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="버그 리포트나 아이디어를 남겨주세요"
                    rows={3}
                    disabled={submitInFlight}
                  />
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="kkoknote-button"
                      onClick={() => void onSubmitFeedback()}
                      disabled={submitInFlight || disabledBecauseRate.submit}
                    >
                      {submitInFlight
                        ? "제출 중..."
                        : disabledBecauseRate.submit
                          ? `${submitRemainingSec}s 후 가능`
                          : "제출"}
                    </button>
                  </div>
                </div>

                {/* 피드백 목록 */}
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {feedbacks.map((f) => (
                    <div key={f.id} className="kkoknote-feedback-card">
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span className={`kkoknote-status-badge ${f.status}`}>{statusLabel(f.status)}</span>
                      </div>
                      <div style={{ fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.45, color: "#374151" }}>
                        {f.content}
                      </div>
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>▲ {f.upvotes}</span>
                        <button
                          type="button"
                          className="kkoknote-button"
                          onClick={() => void onVote(f.id)}
                          disabled={voteInFlightForId === f.id || disabledBecauseRate.vote}
                          style={{ padding: "4px 10px", fontSize: 11 }}
                        >
                          {voteInFlightForId === f.id
                            ? "..."
                            : disabledBecauseRate.vote
                              ? `${voteRemainingSec}s`
                              : "투표"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {feedbacks.length === 0 && (
                    <div className="kkoknote-empty">아직 피드백이 없어요.</div>
                  )}
                </div>
              </>
            )}

            {activeTab === "updates" && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 0 }}>
                {updates.map((u) => (
                  <div key={u.id} className="kkoknote-update-item">
                    <div className="kkoknote-update-title">{u.title}</div>
                    <div className="kkoknote-update-date">{formatDate(u.created_at)}</div>
                    <div className="kkoknote-update-body">{u.content}</div>
                  </div>
                ))}
                {updates.length === 0 && (
                  <div className="kkoknote-empty">업데이트 내역이 없어요.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 플로팅 토글 버튼 */}
      <button
        type="button"
        className="kkoknote-toggle-btn"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "위젯 닫기" : "피드백 남기기"}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
