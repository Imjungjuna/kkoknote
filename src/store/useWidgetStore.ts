import { create } from "zustand";
import { createClient } from "../../lib/supabase/client";

export type IdentifiedUser = {
  id: string;
  email?: string | null;
};

type WidgetFeedback = {
  id: string;
  content: string;
  status: "pending" | "progress" | "done";
  upvotes: number;
};

type WidgetState = {
  projectKey: string | null;
  themeColor: string | null;
  identifiedUser: IdentifiedUser | null;
  feedbacks: WidgetFeedback[];
  realtimeReady: boolean;
  isVoting: boolean;

  initWidget: (projectKey: string) => Promise<void>;
  identify: (args: IdentifiedUser) => void;
  createFeedback: (content: string) => Promise<void>;
  fetchInitial: () => Promise<void>;
  vote: (feedbackId: string) => Promise<void>;
  applyRealtimeUpdate: (payload: unknown) => void;
};

export const useWidgetStore = create<WidgetState>((set, get) => ({
  projectKey: null,
  themeColor: null,
  identifiedUser: null,
  feedbacks: [],
  realtimeReady: false,
  isVoting: false,

  initWidget: async (projectKey) => {
    set({ projectKey, realtimeReady: false });

    // Ensure anon/identified user exists for user_identifier usage.
    try {
      const raw = localStorage.getItem("kkoknote:identify");
      const parsed = raw
        ? (JSON.parse(raw) as Record<string, unknown>)
        : (null as Record<string, unknown> | null);

      const existingId =
        parsed && typeof parsed.id === "string" ? (parsed.id as string) : null;
      const existingEmail =
        parsed && typeof parsed.email === "string" ? (parsed.email as string) : null;

      if (existingId) {
        set({
          identifiedUser: {
            id: existingId,
            email: existingEmail,
          },
        });
      } else {
        const anonId = generateAnonId();
        const next = { id: anonId, email: null as string | null };
        localStorage.setItem("kkoknote:identify", JSON.stringify(next));
        set({ identifiedUser: { id: anonId, email: null } });
      }
    } catch {
      // If storage fails, skip auto-identify and rely on later calls.
    }

    // Fetch tenant theme from our config endpoint.
    try {
      const res = await fetch(
        `/api/widget/config?projectKey=${encodeURIComponent(projectKey)}`
      );
      const json = (await res.json()) as { themeColor?: string; ok?: boolean };
      if (json?.themeColor) set({ themeColor: json.themeColor });
      else set({ themeColor: "#111827" });
    } catch {
      set({ themeColor: "#111827" });
    }

    await get().fetchInitial();
  },

  identify: (args) => {
    set({ identifiedUser: args });

    // Persist so that initWidget can rehydrate state.
    try {
      localStorage.setItem(
        "kkoknote:identify",
        JSON.stringify({ id: args.id, email: args.email ?? null })
      );
    } catch {
      // ignore
    }
  },

  createFeedback: async (content: string) => {
    const projectKey = get().projectKey;
    if (!projectKey) return;

    const userId = get().identifiedUser?.id;
    if (!userId) return;

    const trimmed = content.trim();
    if (!trimmed) return;

    const tempId = `temp-${Date.now()}`;

    // Optimistic insert (minimize perceived latency).
    set({
      feedbacks: [
        {
          id: tempId,
          content: trimmed,
          status: "pending",
          upvotes: 0,
        },
        ...get().feedbacks,
      ],
    });

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("feedbacks")
        .insert({
          project_id: projectKey,
          content: trimmed,
          status: "pending",
          upvotes: 0,
          user_identifier: userId,
        })
        .select("id, content, status, upvotes")
        .single();

      if (error) throw error;

      const rec = data as unknown as Record<string, unknown>;

      set({
        feedbacks: get().feedbacks.map((f) =>
          f.id === tempId
            ? {
                id: String(rec.id),
                content: String(rec.content ?? trimmed),
                status: (rec.status as WidgetFeedback["status"]) ?? "pending",
                upvotes: Number(rec.upvotes ?? 0),
              }
            : f
        ),
      });
    } catch {
      // Rollback optimistic entry.
      set({ feedbacks: get().feedbacks.filter((f) => f.id !== tempId) });
      throw new Error("피드백 제출에 실패했어");
    }
  },

  fetchInitial: async () => {
    const projectKey = get().projectKey;
    if (!projectKey) return;

    const supabase = createClient();

    const { data, error } = await supabase
      .from("feedbacks")
      .select("id, content, status, upvotes")
      .eq("project_id", projectKey)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // RLS mismatch or network issues.
      return;
    }

    const feedbacks = (data ?? []).map((x) => {
      const rec = x as unknown as Record<string, unknown>;
      return {
        id: String(rec.id),
        content: String(rec.content),
        status: rec.status as WidgetFeedback["status"],
        upvotes: Number(rec.upvotes ?? 0),
      };
    });

    set({ feedbacks });
  },

  vote: async (_feedbackId) => {
    const projectKey = get().projectKey;
    if (!projectKey) return;

    const feedbackId = String(_feedbackId);
    const localKey = `kkoknote:votes:${projectKey}:${feedbackId}`;

    // Client-side dedupe (MVP requirement).
    try {
      if (localStorage.getItem(localKey)) return;
      localStorage.setItem(localKey, "1");
    } catch {
      // If storage fails, still try mutation.
    }

    const supabase = createClient();
    set({ isVoting: true });

    try {
      // Read-modify-write (Supabase client doesn't support SQL expressions in update values).
      const { data: row, error: readError } = await supabase
        .from("feedbacks")
        .select("upvotes")
        .eq("id", feedbackId)
        .single();
      if (readError) return;

      const rec = row as unknown as Record<string, unknown> | null;
      const nextUpvotes = Number(rec?.upvotes ?? 0) + 1;

      // Optimistic UI update.
      set({
        feedbacks: get().feedbacks.map((f) =>
          f.id === feedbackId ? { ...f, upvotes: nextUpvotes } : f
        ),
      });

      await supabase.from("feedbacks").update({ upvotes: nextUpvotes }).eq("id", feedbackId);
    } finally {
      set({ isVoting: false });
    }
  },

  applyRealtimeUpdate: (payload) => {
    const p = payload as
      | {
          new?: Record<string, unknown>;
          record?: Record<string, unknown>;
        }
      | null;

    // Supabase realtime payload shape: { eventType, new, old, ... }
    const nextRow = p?.new ?? p?.record ?? null;
    if (!nextRow) return;

    const idValue = nextRow.id;
    const id = idValue ? String(idValue) : null;
    if (!id) return;

    const nextFeedback: WidgetFeedback = {
      id,
      content:
        nextRow.content !== undefined ? String(nextRow.content) : "",
      status:
        (nextRow.status as WidgetFeedback["status"] | undefined) ?? "pending",
      upvotes:
        nextRow.upvotes !== undefined ? Number(nextRow.upvotes ?? 0) : 0,
    };

    set({
      feedbacks: get().feedbacks.some((f) => f.id === id)
        ? get().feedbacks.map((f) =>
            f.id === id
              ? {
                  ...f,
                  content: nextRow.content !== undefined ? String(nextRow.content) : f.content,
                  status: nextFeedback.status ?? f.status,
                  upvotes:
                    nextRow.upvotes !== undefined
                      ? Number(nextRow.upvotes ?? 0)
                      : f.upvotes,
                }
              : f
          )
        : (() => {
            const temps = get().feedbacks;
            // Replace optimistic "temp-*" entry if it matches this insert.
            const tempIdx = temps.findIndex(
              (f) =>
                f.id.startsWith("temp-") &&
                f.content === nextFeedback.content &&
                f.status === "pending" &&
                f.upvotes === 0
            );
            if (tempIdx >= 0) {
              const next = [...temps];
              next[tempIdx] = nextFeedback;
              return next;
            }
            return [nextFeedback, ...temps];
          })(),
    });
  },
}));

function generateAnonId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `anon-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

