/**
 * List of public routes (without authentication)
 * @type {string[]}
 */
export const publicRoutes = [
  "/robots.txt",
  "/privacy-policy",
  "/auth/verify-email",
  "/api/webhooks/stripe",
  "/api/webhooks/plaid",
  "/api/webhooks/cron/update-exchange-rates",
  "/api/webhooks/cron/fill-monthly-reports",
  "/api/webhooks/monthly-reports/create",
  "/api/webhooks/monthly-reports/send",
];

/**
 * List of routes for user authentication
 * the authentification user will be redirected to the default redirect route
 * @type {string[]}
 */
export const authRoutes = [
  "/",
  "/auth/error",
  "/auth/sign-up",
  "/auth/sign-in",
  "/auth/reset-password",
  "/auth/new-password",
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
  },
  {
    name: "Sign Up",
    href: "/auth/sign-up",
  },
];
