"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAdminStore, type AdminFeedback } from "@/src/store/useAdminStore";

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), []);

  const selectedProjectId = useAdminStore((s) => s.selectedProjectId);
  const feedbacks = useAdminStore((s) => s.feedbacks);
  const updates = useAdminStore((s) => s.updates);
  const loading = useAdminStore((s) => s.loading);
  const loadProjectData = useAdminStore((s) => s.loadProjectData);
  const setFeedbackStatus = useAdminStore((s) => s.setFeedbackStatus);

  const [projects, setProjects] = useState<
    Array<{ id: string; name: string; theme_color: string }>
  >([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, theme_color")
        .order("created_at", { ascending: false });

      setProjects(
        (data ?? []).map((x) => {
          const rec = x as unknown as Record<string, unknown>;
          return {
            id: String(rec.id),
            name: String(rec.name),
            theme_color: String(rec.theme_color),
          };
        })
      );
    })();
  }, [supabase]);

  useEffect(() => {
    if (selectedProjectId) return;
    if (projects.length > 0) void loadProjectData(projects[0].id);
  }, [loadProjectData, projects, selectedProjectId]);

  const statusOptions: AdminFeedback["status"][] = ["pending", "progress", "done"];

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <div className="mt-4 flex items-center gap-3">
        <div className="text-sm text-zinc-600">Project</div>
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={selectedProjectId ?? ""}
          onChange={(e) => void loadProjectData(e.target.value)}
          disabled={projects.length === 0}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {loading ? <div className="text-xs text-zinc-500">loading...</div> : null}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Feedbacks</h2>
          <div className="mt-2 space-y-3">
            {feedbacks.map((f) => (
              <div
                key={f.id}
                className="border rounded-lg p-3 bg-white dark:bg-zinc-900"
              >
                <div className="text-xs text-zinc-500">id: {f.id}</div>
                <div className="mt-2 text-sm whitespace-pre-wrap">{f.content}</div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <div className="text-xs text-zinc-500">status</div>
                    <select
                      className="border rounded-md px-2 py-1 text-sm mt-1"
                      value={f.status}
                      onChange={(e) =>
                        void setFeedbackStatus(
                          f.id,
                          e.target.value as AdminFeedback["status"]
                        )
                      }
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm">
                    <div className="text-xs text-zinc-500">upvotes</div>
                    <div>{f.upvotes}</div>
                  </div>
                </div>
              </div>
            ))}
            {feedbacks.length === 0 && !loading ? (
              <div className="text-sm text-zinc-600 mt-4">No feedbacks.</div>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Updates</h2>
          <div className="mt-2 space-y-3">
            {updates.map((u) => (
              <div
                key={u.id}
                className="border rounded-lg p-3 bg-white dark:bg-zinc-900"
              >
                <div className="text-sm font-medium">{u.title}</div>
                <div className="text-xs text-zinc-500 mt-1">{u.created_at}</div>
                <div className="mt-2 text-sm whitespace-pre-wrap">{u.content}</div>
              </div>
            ))}
            {updates.length === 0 && !loading ? (
              <div className="text-sm text-zinc-600 mt-4">No updates.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

