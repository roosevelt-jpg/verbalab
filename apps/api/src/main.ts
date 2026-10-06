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

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({ origin: corsOrigin });

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  structuredLog.info('api.started', {
    event: 'api.started',
    port,
    sentry: sentryOn,
  });
}

void bootstrap();
