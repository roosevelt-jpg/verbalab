import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/** Baseline HTTP security headers for the API (no CSP — JSON API). */
export function applyHttpSecurity(app: INestApplication) {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      // Browser Studio (different origin/port) must be able to read JSON responses.
      // Helmet's default CORP `same-origin` causes WebKit `TypeError: Load failed`
      // on cross-origin credentialed fetches even when CORS ACAO is set.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
}
