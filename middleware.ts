import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the path the user is trying to access
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === "/signin" || path === "/signup";

  // Get the token from cookies - adjust this according to your auth implementation
  const token = request.cookies.get("auth-token")?.value || "";

  // Redirect logic
  if (!token && !isPublicPath) {
    // Redirect to signin if trying to access protected route without auth
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (token && isPublicPath) {
    // Redirect to home if trying to access auth pages while logged in
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
