"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWidgetStore } from "../../src/store/useWidgetStore";
import { createClient } from "../../lib/supabase/client";

export default function WidgetUI({ projectKey }: { projectKey: string }) {
  const initWidget = useWidgetStore((s) => s.initWidget);
  const identifiedUser = useWidgetStore((s) => s.identifiedUser);
  const applyRealtimeUpdate = useWidgetStore((s) => s.applyRealtimeUpdate);
  const feedbacks = useWidgetStore((s) => s.feedbacks);
  const createFeedback = useWidgetStore((s) => s.createFeedback);
  const vote = useWidgetStore((s) => s.vote);

  useEffect(() => {
    void initWidget(projectKey);
  }, [initWidget, projectKey]);

  const [draft, setDraft] = useState("");
  const [submitInFlight, setSubmitInFlight] = useState(false);
  const [voteInFlightForId, setVoteInFlightForId] = useState<string | null>(
    null
  );
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

  const consumeRate = (
    queueRef: { current: number[] },
    nowMs: number
  ) => {
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

  const disabledBecauseRate = useMemo(() => {
    return {
      submit: submitRemainingSec > 0,
      vote: voteRemainingSec > 0,
    };
  }, [submitRemainingSec, voteRemainingSec]);

  // Countdown for rate-limited UI
  useEffect(() => {
    if (submitRemainingSec <= 0) return;
    const t = window.setInterval(() => {
      setSubmitRemainingSec((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [submitRemainingSec]);

  useEffect(() => {
    if (voteRemainingSec <= 0) return;
    const t = window.setInterval(() => {
      setVoteRemainingSec((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [voteRemainingSec]);

  const onSubmitFeedback = async () => {
    if (submitInFlight) return;

    const content = draft.trim();
    if (!content) {
      showToast("내용을 입력해줘");
      return;
    }

    const now = Date.now();
    const res = consumeRate(submitQueueRef, now);
    if (!res.allowed) {
      setSubmitRemainingSec(res.remainingSec);
      showToast("너무 자주 보냈어. 잠시만 쉬어줘");
      return;
    }

    setSubmitInFlight(true);
    setSubmitRemainingSec(0);
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

    // Local dedupe: 이미 투표 -> API 호출 없이 종료.
    try {
      if (localStorage.getItem(voteLocalKey(feedbackId))) {
        showToast("이미 투표했어");
        return;
      }
    } catch {
      // ignore storage errors
    }

    const now = Date.now();
    const res = consumeRate(voteQueueRef, now);
    if (!res.allowed) {
      setVoteRemainingSec(res.remainingSec);
      showToast("너무 자주 보냈어. 잠시만 쉬어줘");
      return;
    }

    setVoteRemainingSec(0);
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
    // Subscribe to realtime feedback status/upvote updates for this tenant.
    const supabase = createClient();

    const channel = supabase
      .channel(`kkoknote:feedbacks:${projectKey}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "feedbacks",
          filter: `project_id=eq.${projectKey}`,
        },
        (payload) => {
          applyRealtimeUpdate(payload);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feedbacks",
          filter: `project_id=eq.${projectKey}`,
        },
        (payload) => {
          applyRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applyRealtimeUpdate, projectKey]);

  return (
    <div className="kkoknote-widget">
      <div style={{ padding: 10, width: 280 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>콕노트</div>
          <div style={{ marginLeft: "auto", fontSize: 11, opacity: 0.75 }}>
            {identifiedUser ? `id: ${identifiedUser.id}` : "익명"}
          </div>
        </div>

        {toastMsg ? (
          <div
            className="kkoknote-toast"
            style={{
              // Shadow DOM scoped styles also provide base look.
            }}
            role="status"
          >
            {toastMsg}
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
            피드백 작성
          </div>
          <textarea
            className="kkoknote-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="원하는 기능/개선점을 적어주세요"
            rows={3}
            style={{
              resize: "vertical",
            }}
            disabled={submitInFlight}
          />
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              type="button"
              className="kkoknote-button"
              onClick={() => void onSubmitFeedback()}
              disabled={submitInFlight || disabledBecauseRate.submit}
              style={{
                opacity: submitInFlight || disabledBecauseRate.submit ? 0.6 : 1,
              }}
            >
              {submitInFlight
                ? "제출 중..."
                : disabledBecauseRate.submit
                  ? `제출 제한: ${submitRemainingSec}s`
                  : "제출"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
            피드백 목록
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {feedbacks.map((f) => (
              <div
                key={f.id}
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.12)",
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
                  status: {f.status}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.35,
                  }}
                >
                  {f.content}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    업보트: {f.upvotes}
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="kkoknote-button"
                      onClick={() => void onVote(f.id)}
                      disabled={
                        voteInFlightForId === f.id || disabledBecauseRate.vote
                      }
                      style={{
                        opacity:
                          voteInFlightForId === f.id ||
                          disabledBecauseRate.vote
                            ? 0.6
                            : 1,
                      }}
                    >
                      {voteInFlightForId === f.id
                        ? "투표 중..."
                        : disabledBecauseRate.vote
                          ? `투표 제한: ${voteRemainingSec}s`
                          : "업보트"}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {feedbacks.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                아직 피드백이 없어요.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

