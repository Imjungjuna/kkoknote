import { create } from "zustand";
import { createClient } from "../../lib/supabase/client";

export type AdminFeedback = {
  id: string;
  project_id: string;
  content: string;
  status: "pending" | "progress" | "done";
  upvotes: number;
};

type AdminState = {
  selectedProjectId: string | null;
  feedbacks: AdminFeedback[];
  updates: Array<{ id: string; project_id: string; title: string; content: string; created_at: string }>;
  loading: boolean;

  loadProjectData: (projectId: string) => Promise<void>;
  setFeedbackStatus: (feedbackId: string, status: AdminFeedback["status"]) => Promise<void>;
  applyRealtimeEvent: (eventType: "INSERT" | "UPDATE", row: Record<string, unknown>) => void;
};

export const useAdminStore = create<AdminState>((set, get) => ({
  selectedProjectId: null,
  feedbacks: [],
  updates: [],
  loading: false,

  loadProjectData: async (projectId) => {
    set({ selectedProjectId: projectId, loading: true });

    const supabase = createClient();

    try {
      const [{ data: feedbacks, error: feedbacksError }, { data: updates, error: updatesError }] =
        await Promise.all([
          supabase
            .from("feedbacks")
            .select("id, project_id, content, status, upvotes")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false }),
          supabase
            .from("updates")
            .select("id, project_id, title, content, created_at")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false }),
        ]);

      if (feedbacksError || updatesError) return;

      set({
        feedbacks: (feedbacks ?? []).map((x) => {
          const rec = x as unknown as Record<string, unknown>;
          return {
            id: String(rec.id),
            project_id: String(rec.project_id),
            content: String(rec.content),
            status: rec.status as AdminFeedback["status"],
            upvotes: Number(rec.upvotes ?? 0),
          };
        }),
        updates: (updates ?? []).map((x) => {
          const rec = x as unknown as Record<string, unknown>;
          return {
            id: String(rec.id),
            project_id: String(rec.project_id),
            title: String(rec.title),
            content: String(rec.content),
            created_at: String(rec.created_at),
          };
        }),
        loading: false,
      });
    } finally {
      set({ loading: false });
    }
  },

  setFeedbackStatus: async (_feedbackId, _status) => {
    const feedbackId = String(_feedbackId);
    const status = _status;

    const res = await fetch(
      `/api/admin/feedbacks/${encodeURIComponent(feedbackId)}/status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );

    if (!res.ok) return;

    set({
      feedbacks: get().feedbacks.map((f) =>
        f.id === feedbackId ? { ...f, status } : f
      ),
    });
  },

  applyRealtimeEvent: (eventType, row) => {
    const feedback: AdminFeedback = {
      id: String(row.id),
      project_id: String(row.project_id),
      content: String(row.content),
      status: row.status as AdminFeedback["status"],
      upvotes: Number(row.upvotes ?? 0),
    };

    if (eventType === "INSERT") {
      // 이미 있으면 무시 (optimistic 중복 방지)
      if (get().feedbacks.some((f) => f.id === feedback.id)) return;
      set({ feedbacks: [feedback, ...get().feedbacks] });
    } else {
      set({
        feedbacks: get().feedbacks.map((f) =>
          f.id === feedback.id ? feedback : f
        ),
      });
    }
  },
}));

