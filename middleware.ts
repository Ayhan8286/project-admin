import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude static files, api routes, Next.js internals, and _next from middleware
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const roleCookie = request.cookies.get("auth_role");
  const isAuthenticated = !!roleCookie;

  // If user is trying to access login page
  if (pathname === "/login") {
    if (isAuthenticated && request.method === "GET") {
      // Redirect authenticated users away from login
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // If user is trying to access any other page but is not authenticated
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Optional: Route protections based on role
  // e.g. If supervisor tries to access /students, redirect to /supervisors
  // We'll trust the Sidebar restriction for now, but server-side protection is best.
  if (roleCookie?.value === "supervisor") {
    const supervisorIdCookie = request.cookies.get("supervisor_id");
    const supervisorId = supervisorIdCookie?.value;

    // A supervisor must have a supervisor_id to be valid in this flow
    if (!supervisorId) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_role");
      return response;
    }

    // Supervisors are allowed on:
    // 1. Their own profile page
    // 2. All student pages (list and detail)
    // 3. Attendance pages
    // 4. Specific teacher detail pages
    const isAllowedPath = 
      pathname === `/supervisors/${supervisorId}` ||
      pathname.startsWith("/students") ||
      pathname.startsWith("/attendance") ||
      pathname.startsWith("/teachers/");
    
    if (!isAllowedPath && pathname !== "/login") {
       return NextResponse.redirect(new URL(`/supervisors/${supervisorId}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
