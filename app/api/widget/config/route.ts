import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectKey = url.searchParams.get("projectKey") ?? "";

  const origin = req.headers.get("origin") ?? "";
  const corsHeaders: Record<string, string> = origin
    ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
    : {};
  if (!projectKey) {
    return Response.json({ error: "projectKey is required" }, { status: 400, headers: corsHeaders });
  }
  if (!origin) {
    return Response.json({ error: "Origin header is required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          return fetch(input, {
            ...init,
            headers: {
              ...(init?.headers as Record<string, string> | undefined),
              origin,
            },
          });
        },
      },
    }
  );

  const { data, error } = await supabase
    .from("projects")
    .select("id, theme_color")
    .eq("id", projectKey)
    .maybeSingle();

  if (error || !data) {
    // RLS origin mismatch or missing project.
    return Response.json(
      {
        projectKey,
        themeColor: "#111827",
        // Avoid leaking whether projectKey exists.
        ok: false,
      },
      { status: 404, headers: corsHeaders }
    );
  }

  return Response.json(
    {
      projectKey,
      themeColor: data.theme_color,
      ok: true,
    },
    { headers: corsHeaders }
  );
}

