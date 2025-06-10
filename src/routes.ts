/**
 * List of public routes (without authentication)
 * @type {string[]}
 */
export const publicRoutes = [
  "/robots.txt",
  "/sitemap.xml",
  "/privacy-policy",
  "/terms-of-service",
  "/auth/verify-email",
  "/api/webhooks/stripe",
  "/api/webhooks/cron/update-exchange-rates",
  "/api/webhooks/cron/fill-monthly-reports",
  "/api/webhooks/cron/send-reports",
  "/api/webhooks/monthly-reports/create",
  "/api/webhooks/monthly-reports/send",
  "/api/webhooks/monthly-reports/process-user",
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
