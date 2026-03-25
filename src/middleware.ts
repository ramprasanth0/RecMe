import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/home", "/personalize", "/profile"];

export function middleware(request: NextRequest) {
  const userId = request.cookies.get("recme_user_id")?.value;
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users from protected routes to landing
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !userId) {
    return NextResponse.redirect(new URL("/?error=unauthenticated", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/personalize/:path*", "/profile/:path*"],
};
