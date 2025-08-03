import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import {
  DEFAULT_LOGGED_IN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);

  // Create a response object
  const response = NextResponse.next();

  // Set custom header with current path
  // This is used to get current path in server side rendered pages
  response.headers.set("x-current-path", nextUrl.pathname);

  // Allow ALL API routes to pass through (auth handled in individual routes)
  if (nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow API routes to be accessed without authentication
  if (isApiAuthRoute) {
    return response;
  }
  if (isAuthRoute) {
    // If user is authenticated redirect user from login or register pages
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGGED_IN_REDIRECT, nextUrl));
    }
    return response;
  }
  // Redirect to login page if user is not authenticated
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/", nextUrl));
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
