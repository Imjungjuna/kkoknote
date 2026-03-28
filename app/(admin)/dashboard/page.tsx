"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAdminStore, type AdminFeedback } from "@/src/store/useAdminStore";

const STATUS_COLUMNS: { key: AdminFeedback["status"]; label: string; color: string }[] = [
  { key: "pending",  label: "대기중",  color: "#f3f4f6" },
  { key: "progress", label: "개발중",  color: "#eff6ff" },
  { key: "done",     label: "완료",    color: "#f0fdf4" },
];

const STATUS_BADGE: Record<AdminFeedback["status"], string> = {
  pending:  "bg-gray-100 text-gray-500",
  progress: "bg-blue-50 text-blue-600",
  done:     "bg-green-50 text-green-600",
};

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), []);

  const selectedProjectId = useAdminStore((s) => s.selectedProjectId);
  const feedbacks = useAdminStore((s) => s.feedbacks);
  const updates = useAdminStore((s) => s.updates);
  const loading = useAdminStore((s) => s.loading);
  const loadProjectData = useAdminStore((s) => s.loadProjectData);
  const setFeedbackStatus = useAdminStore((s) => s.setFeedbackStatus);
  const applyRealtimeEvent = useAdminStore((s) => s.applyRealtimeEvent);

  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  // 프로젝트 목록 로드
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .order("created_at", { ascending: false });

      setProjects(
        (data ?? []).map((x) => {
          const rec = x as unknown as Record<string, unknown>;
          return { id: String(rec.id), name: String(rec.name) };
        })
      );
    })();
  }, [supabase]);

  // 첫 프로젝트 자동 선택
  useEffect(() => {
    if (selectedProjectId) return;
    if (projects.length > 0) void loadProjectData(projects[0].id);
  }, [loadProjectData, projects, selectedProjectId]);

  // Realtime 구독: 위젯에서 새 피드백 제출 시 즉시 반영
  useEffect(() => {
    if (!selectedProjectId) return;

    const channel = supabase
      .channel(`admin:feedbacks:${selectedProjectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedbacks", filter: `project_id=eq.${selectedProjectId}` },
        (payload) => {
          const row = (payload as { new?: Record<string, unknown> }).new;
          if (row) applyRealtimeEvent("INSERT", row);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "feedbacks", filter: `project_id=eq.${selectedProjectId}` },
        (payload) => {
          const row = (payload as { new?: Record<string, unknown> }).new;
          if (row) applyRealtimeEvent("UPDATE", row);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, selectedProjectId, applyRealtimeEvent]);

  const feedbacksByStatus = useMemo(() => {
    const map: Record<AdminFeedback["status"], AdminFeedback[]> = {
      pending: [],
      progress: [],
      done: [],
    };
    for (const f of feedbacks) {
      map[f.status].push(f);
    }
    return map;
  }, [feedbacks]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <h1 className="text-base font-semibold text-gray-900">콕노트 어드민</h1>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-500">프로젝트</span>
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
            value={selectedProjectId ?? ""}
            onChange={(e) => void loadProjectData(e.target.value)}
            disabled={projects.length === 0}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {loading && <span className="text-xs text-gray-400">불러오는 중...</span>}
        </div>
      </div>

      <div className="px-6 py-6">
        {/* 칸반 보드 */}
        <div className="grid grid-cols-3 gap-4">
          {STATUS_COLUMNS.map((col) => {
            const cards = feedbacksByStatus[col.key];
            return (
              <div key={col.key} className="flex flex-col gap-3">
                {/* 컬럼 헤더 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                  <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {cards.length}
                  </span>
                </div>

                {/* 카드 목록 */}
                <div className="flex flex-col gap-2 min-h-32">
                  {cards.map((f) => (
                    <div
                      key={f.id}
                      className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {f.content}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-400">▲ {f.upvotes}</span>
                        <div className="flex gap-1.5">
                          {STATUS_COLUMNS.filter((c) => c.key !== col.key).map((target) => (
                            <button
                              key={target.key}
                              type="button"
                              className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                              onClick={() => void setFeedbackStatus(f.id, target.key)}
                            >
                              → {target.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {cards.length === 0 && !loading && (
                    <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-100 rounded-xl">
                      <span className="text-xs text-gray-300">없음</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 업데이트 섹션 */}
        {updates.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">업데이트 내역</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {updates.map((u) => (
                <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-900">{u.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(u.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {u.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
