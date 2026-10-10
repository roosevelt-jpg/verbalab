export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  // Skip Sentry entirely when unset — importing @sentry/nextjs pulls
  // require-in-the-middle and surfaces Next.js "1 Issue" (Critical dependency).
  if (!dsn?.trim()) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
