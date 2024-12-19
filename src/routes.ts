/**
 * List of public routes (without authentication)
 * @type {string[]}
 */
export const publicRoutes = ["/auth/verify-email"];

/**
 * List of routes for user authentication
 * the authentification user will be redirected to the default redirect route
 * @type {string[]}
 */
export const authRoutes = [
  "/",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/auth/error",
];

/**
 * Api authentication routes prefix
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * Default redirect route for authenticated users
 * @type {string}
 */
export const DEFAULT_LOGGED_IN_REDIRECT = "/dashboard";

/**
 * List of navigation items
 */
export const navItems = [
  {
    name: "Sign In",
    href: "/",
    protectedPath: false,
  },
  {
    name: "Sign Up",
    href: "/sign-up",
    protectedPath: false,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    protectedPath: true,
  },
];
