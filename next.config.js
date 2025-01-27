const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  // Forcefully disable reactStrictMode on development
  // to prevent UseEffect running twice which closing websocket connection
  reactStrictMode: process.env.NODE_ENV !== "development",
};

// Make sure adding Sentry options is the last code to run before exporting
module.exports = withSentryConfig(nextConfig, {
  org: "pennysave",
  project: "app",

  // An auth token is required for uploading source maps.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: false, // Can be used to suppress logs
});
