import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Session refresh + JWT validation.
  // NOTE: We'll fully implement redirects/guards in the next to-do.
  const { data } = await supabase.auth.getClaims();
  const userClaims = data?.claims;
  const isUserPresent = Boolean(userClaims);

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/login" || pathname.startsWith("/auth");
  const isWidgetRoute = pathname.startsWith("/api/widget");

  // MVP: only protect admin pages; keep widget endpoints public.
  const isProtectedAdminRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/admin");

  if (!isUserPresent && isProtectedAdminRoute) {
    if (!isWidgetRoute && !isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // If authenticated user hits login, send them to dashboard.
  if (isUserPresent && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

