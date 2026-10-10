import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/errors/api-exception.filter';
import { initApiSentry } from './observability/sentry';
import { structuredLog } from './common/logging/structured-logger';
import { applyHttpSecurity } from './common/security/http-security';

async function bootstrap() {
  const sentryOn = initApiSentry();
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp?.set === 'function') {
    expressApp.set('json spaces', 2);
  }
  applyHttpSecurity(app);
  app.useGlobalFilters(new ApiExceptionFilter());

  // Accept comma-separated origins; always allow localhost↔127.0.0.1 twins for local consoles.
  // Production brand hosts are always allowed (Fly app names like lugemi-web ≠ public domain).
  // Studio local ports (43125) are always allowed so a mis-set CORS_ORIGIN cannot brick the browser.
  const productionCorsOrigins = [
    'https://lugemi.com',
    'https://www.lugemi.com',
    'https://api.lugemi.com',
    // Live Clerk keys require a lugemi.com subdomain on HTTPS :443 (see Clerk prod-keys-in-dev guide).
    'https://local.lugemi.com',
    'http://local.lugemi.com',
  ];
  // Local Studio ports + legacy Next (:3000) — keep reachable even if CORS_ORIGIN is incomplete.
  // Agents often spin Studio on 43123–43130; missing one origin surfaces as browser "Cannot reach API".
  const localStudioCorsOrigins: string[] = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
  ];
  for (let port = 43123; port <= 43130; port += 1) {
    localStudioCorsOrigins.push(`http://127.0.0.1:${port}`, `http://localhost:${port}`);
  }
  const corsRaw = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const corsOrigins = new Set(
    [
      ...corsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      ...productionCorsOrigins,
      ...localStudioCorsOrigins,
    ],
  );
  for (const origin of [...corsOrigins]) {
    try {
      const u = new URL(origin);
      if (u.hostname === 'localhost') {
        corsOrigins.add(`${u.protocol}//127.0.0.1${u.port ? `:${u.port}` : ''}`);
      } else if (u.hostname === '127.0.0.1') {
        corsOrigins.add(`${u.protocol}//localhost${u.port ? `:${u.port}` : ''}`);
      }
    } catch {
      /* ignore malformed CORS_ORIGIN entries */
    }
  }

  // Chrome Private Network Access: public/less-private pages calling loopback APIs.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers['access-control-request-private-network'] === 'true') {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
  });

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || corsOrigins.has(requestOrigin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Lugemi-Workspace-Id',
      'X-Lugemi-Organization-Id',
      'X-Request-Id',
      'X-Api-Key',
      'X-DealBridge-Actor-Id',
      'X-VoiceBridge-Actor-Id',
    ],
  });

  // Fly proxy routes to internal_port; bind all interfaces (never localhost/::1).
  // Nest's default getUrl() log can still show [::1] — trust structured api.started.host.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  const host = (process.env.HOST ?? '0.0.0.0').trim() || '0.0.0.0';
  await app.listen(port, host);
  structuredLog.info('api.started', {
    event: 'api.started',
    host,
    port,
    sentry: sentryOn,
  });
}

void bootstrap();
