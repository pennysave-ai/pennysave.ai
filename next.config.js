const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Forcefully disable reactStrictMode on development
  // to prevent UseEffect running twice which closing websocket connection
  reactStrictMode: process.env.NODE_ENV !== "development",
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "redis"],
  },
};

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry webpack plugin options
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // Sentry SDK options
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,

    // ✅ Skip source map upload during build (prevents timeout)
    disableSourceMapUpload: process.env.VERCEL_ENV === "production",
  }
);
