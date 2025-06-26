import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  DEFAULT_LOGGED_IN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

// const { auth } = NextAuth(authConfig);

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { nextUrl } = req;

  // const isLoggedIn = !!req.auth;
  const isLoggedIn = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);

  // Create a response object
  const response = NextResponse.next();

  // Set custom header with current path
  // This is used to get current path in server side rendered pages
  // response.headers.set("x-current-path", nextUrl.pathname);

  // Allow API routes to be accessed without authentication
  if (isApiAuthRoute) {
    return response;
  }
  if (isAuthRoute) {
    // If user is authenticated redirect user from login or register pages
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(DEFAULT_LOGGED_IN_REDIRECT, nextUrl)
      );
    }
    return response;
  }

  // Redirect to login page if user is not authenticated
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
