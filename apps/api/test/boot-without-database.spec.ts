import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readFileSync, renameSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

const root = join(__dirname, '../../..');
const apiEnv = join(root, 'apps/api/.env');
const apiEnvBak = join(root, 'apps/api/.env.boot-test.bak');
const rootEnv = join(root, '.env');
const rootEnvBak = join(root, '.env.boot-test.bak');

describe('Boot without DATABASE_URL (Fly first boot)', () => {
  let app: INestApplication<App>;
  let prevDatabaseUrl: string | undefined;
  let prevRedisUrl: string | undefined;
  let hidApiEnv = false;
  let hidRootEnv = false;

  beforeAll(async () => {
    prevDatabaseUrl = process.env.DATABASE_URL;
    prevRedisUrl = process.env.REDIS_URL;
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;

    // PrismaClient auto-loads apps/api/.env into process.env — hide it for this suite.
    if (existsSync(apiEnv)) {
      renameSync(apiEnv, apiEnvBak);
      hidApiEnv = true;
    }
    if (existsSync(rootEnv)) {
      renameSync(rootEnv, rootEnvBak);
      hidRootEnv = true;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  }, 60_000);

  afterAll(async () => {
    if (prevDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDatabaseUrl;
    if (prevRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = prevRedisUrl;
    await app?.close();
    if (hidApiEnv && existsSync(apiEnvBak)) renameSync(apiEnvBak, apiEnv);
    if (hidRootEnv && existsSync(rootEnvBak)) renameSync(rootEnvBak, rootEnv);
  });

  it('starts Nest and serves /health without DATABASE_URL', async () => {
    const prisma = app.get(PrismaService);
    expect(prisma.isReady()).toBe(false);

    const health = await request(app.getHttpServer()).get('/health').expect(200);
    expect(health.body.status).toBe('ok');
    expect(health.body.database).toBe('skipped');
  });

  it('keeps Fly API internal_port matched to PORT=3001 with /health checks', () => {
    for (const rel of [
      'fly.toml',
      'apps/api/fly.toml',
      'infra/fly/api.jnb.toml',
      'infra/fly/api.toml',
      'infra/fly/api.eu.toml',
    ]) {
      const toml = readFileSync(join(root, rel), 'utf8');
      expect(toml).toContain("PORT = '3001'");
      expect(toml).toContain("HOST = '0.0.0.0'");
      expect(toml).toContain('internal_port = 3001');
      expect(toml).toContain("path = '/health'");
      expect(toml).toContain("grace_period = '60s'");
    }

    const main = readFileSync(join(root, 'apps/api/src/main.ts'), 'utf8');
    expect(main).toContain('await app.listen(port, host)');
    expect(main).toContain("process.env.HOST ?? '0.0.0.0'");
    expect(main).toContain('process.env.PORT');
  });
});
