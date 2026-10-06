import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/errors/api-exception.filter';
import { initApiSentry } from './observability/sentry';
import { structuredLog } from './common/logging/structured-logger';
import { applyHttpSecurity } from './common/security/http-security';

async function bootstrap() {
  const sentryOn = initApiSentry();
  const app = await NestFactory.create(AppModule, { rawBody: true });
  applyHttpSecurity(app);
  app.useGlobalFilters(new ApiExceptionFilter());

  // Accept comma-separated origins; always allow localhost↔127.0.0.1 twins for local consoles.
  // Production brand hosts are always allowed (Fly app names like lugemi-web ≠ public domain).
  const productionCorsOrigins = [
    'https://lugemi.com',
    'https://www.lugemi.com',
    'https://api.lugemi.com',
  ];
  const corsRaw = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const corsOrigins = new Set(
    [
      ...corsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      ...productionCorsOrigins,
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
  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || corsOrigins.has(requestOrigin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  });

  // Fly proxy routes to internal_port; bind all interfaces and honor process.env.PORT.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  const host = '0.0.0.0';
  await app.listen(port, host);
  structuredLog.info('api.started', {
    event: 'api.started',
    host,
    port,
    sentry: sentryOn,
  });
}

void bootstrap();
