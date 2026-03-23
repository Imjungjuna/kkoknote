export async function GET() {
  // Serve pre-built bundle so widget consumers can use it without React/Next runtime.
  // `npm run build:widget` must run as part of `next build` (see package.json).
  const fs = await import("node:fs");
  const path = await import("node:path");

  const filePath = path.join(process.cwd(), "public", "kkoknote-widget-sdk.js");

  try {
    const js = fs.readFileSync(filePath, "utf8");
    return new Response(js, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // Development fallback if build output is missing.
    return new Response("window.KkokNote={init(){},identify(){}};", {
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
      status: 503,
    });
  }
}

