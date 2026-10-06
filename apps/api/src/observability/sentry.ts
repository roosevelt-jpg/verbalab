import * as Sentry from '@sentry/node';

let initialized = false;

export function initApiSentry {
  const dsn = process.env.SENTRY_DSN?.trim;
  if (!dsn || initialized) return false;
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
  initialized = true;
  return true;
}

export function captureApiException(error: unknown, context?: Record<string, unknown>) {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

export function isSentryEnabled {
  return initialized;
}
