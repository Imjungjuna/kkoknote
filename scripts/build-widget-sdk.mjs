import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outfile = path.join(root, "public", "kkoknote-widget-sdk.js");
const entry = path.join(root, "components", "widget", "sdk-entry.ts");

// Ensure output directory exists.
fs.mkdirSync(path.dirname(outfile), { recursive: true });

await esbuild.build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2017"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
    "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
    "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
    ),
  },
  sourcemap: false,
  logLevel: "info",
  loader: {
    ".ts": "ts",
    ".tsx": "tsx",
    ".css": "text",
  },
});

console.log(`[build-widget-sdk] Wrote: ${path.relative(root, outfile)}`);

