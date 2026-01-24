import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auth routes (login/register/onboarding pages)
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || 
                      request.nextUrl.pathname.startsWith("/register") ||
                      request.nextUrl.pathname.startsWith("/onboarding") ||
                      request.nextUrl.pathname.startsWith("/firm/login") ||
                      request.nextUrl.pathname.startsWith("/firm/register") ||
                      request.nextUrl.pathname.startsWith("/firm/onboarding");
  
  // Public routes (accessible without auth)
  const isPublicRoute = request.nextUrl.pathname === "/" ||
                        request.nextUrl.pathname.startsWith("/for-firms") ||
                        request.nextUrl.pathname.startsWith("/pricing") ||
                        request.nextUrl.pathname.startsWith("/api/auth") ||
                        request.nextUrl.pathname.startsWith("/api/dev") ||
                        request.nextUrl.pathname.startsWith("/invite") ||
                        request.nextUrl.pathname.startsWith("/share"); // Public share links

  if (!user && !isAuthRoute && !isPublicRoute) {
    // No user, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    // User logged in, redirect to dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
