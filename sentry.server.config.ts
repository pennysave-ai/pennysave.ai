import * as Sentry from "@sentry/nextjs";
// init only for prod and staging
if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
  Sentry.init({
    dsn: "https://d2a79c96b176e245df77f4329d90cd49@o4508647362461696.ingest.de.sentry.io/4508647365148752",

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    // We recommend adjusting this value in production
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
    tracesSampleRate: 1.0,

    // ...

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps
  });
}
