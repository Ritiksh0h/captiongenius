import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = ["ritikshah6633@gmail.com"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as any;

    // Admin routes — require admin email, redirect everyone else to home
    if (pathname.startsWith("/admin")) {
      if (!ADMIN_EMAILS.includes(token?.email ?? "")) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/history/:path*",
    "/favourites/:path*",
    "/api/billing/:path*",
  ],
};
