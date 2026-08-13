import { NextResponse } from "next/server";

const COOKIE_NAME = "oss-token";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public endpoints/pages.
  if (pathname === "/api/auth" && ["POST", "DELETE"].includes(request.method)) {
    return NextResponse.next();
  }
  if (pathname === "/api/health" && request.method === "GET") {
    return NextResponse.next();
  }
  if (pathname === "/api/admission" && request.method === "POST") {
    return NextResponse.next();
  }
  if (pathname === "/api/clubs" && request.method === "GET") {
    return NextResponse.next();
  }

  // Middleware only checks whether a session cookie exists. Full JWT verification
  // and user/role validation happens in the server-side auth layer and each API.
  // This prevents middleware/runtime differences from creating login redirect loops.
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
