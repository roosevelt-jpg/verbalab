import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/** Baseline HTTP security headers for the API (no CSP — JSON API). */
export function applyHttpSecurity(app: INestApplication) {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
}
