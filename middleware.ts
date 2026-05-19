import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass auth callbacks and API routes through without session overhead
  if (pathname.startsWith("/auth/") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Always refresh the session — keeps Supabase auth cookies fresh
  const { supabaseResponse, user } = await updateSession(request);

  // Redirect authenticated users away from the login page
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Public routes that don't require authentication
  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/p/")) {
    return supabaseResponse;
  }

  // Everything else requires a session
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
