import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login"];
const TOKEN_COOKIE = "xiqma_access_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  // ---- Unauthenticated user trying to access protected route ----
  if (!isPublicRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    // Preserve intended destination so we can redirect back after login
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ---- Authenticated user trying to access login page ----
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico, icon files, apple-icon
     * - public assets (png, jpg, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon.*|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
