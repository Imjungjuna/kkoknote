import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

const allowedStatuses = new Set(["pending", "progress", "done"]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ feedbackId: string }> }
) {
  const { feedbackId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rec = body as Record<string, unknown>;
  const status = typeof rec.status === "string" ? rec.status : undefined;
  if (!status || !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("feedbacks")
    .update({ status })
    .eq("id", feedbackId)
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, feedback: data });
}

