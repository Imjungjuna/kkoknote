import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Proxy should only run when it can affect authenticated requests.
// The matcher logic is implemented in `src/lib/supabase/proxy.ts` (SSR auth refresh).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/widget|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

