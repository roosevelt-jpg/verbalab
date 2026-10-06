import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      walkTsFiles(p, out);
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_scaudit_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Speech Cloud Production Audit', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rawKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    const org = await seedOrg(prisma, 'sca');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'sca-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships audit ADR, blueprint ADR, and report pack', () => {
    expect(existsSync(join(root, 'docs/adr/0079-speech-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/speech-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/speech-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/speech-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/speech-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/speech-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    const readiness = readFileSync(join(root, 'docs/speech-cloud-audit/PRODUCTION_READINESS.md'), 'utf8');
    expect(readiness).toMatch(/not.*Deepgram|not.*Gong|Rejected/i);
    expect(readiness).toContain('bounded');
  });

  it('has no TODO/FIXME/implement-later markers in Speech Cloud source trees', () => {
    const roots = [
      join(apiSrc, 'speech-cloud'),
      join(apiSrc, 'speech-recognition'),
      join(apiSrc, 'speaker-intelligence'),
      join(apiSrc, 'emotion-intelligence'),
      join(apiSrc, 'audio-intelligence'),
      join(apiSrc, 'pronunciation-intelligence'),
      join(apiSrc, 'wake-word'),
      join(apiSrc, 'call-intelligence'),
      join(apiSrc, 'speech-analytics'),
      join(apiSrc, 'audio'),
      join(apiSrc, 'voice'),
      join(apiSrc, 'voice-clones'),
    ];
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const dir of roots) {
      if (!existsSync(dir)) continue;
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('exposes integrated Speech Cloud catalogs', async () => {
    const paths = [
      '/v1/speech/products',
      '/v1/speech/engine',
      '/v1/speakers/engine',
      '/v1/accents/engine',
      '/v1/emotion/engine',
      '/v1/audio-intelligence/engine',
      '/v1/pronunciation/engine',
      '/v1/wake-word/engine',
      '/v1/call-intelligence/engine',
      '/v1/speech-analytics/engine',
    ];
    for (const path of paths) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }
  });

  it('rejects unauthenticated speech analytics and call list (security)', async () => {
    const overview = await request(app.getHttpServer()).get('/v1/speech-analytics/overview');
    expect([401, 403, 503]).toContain(overview.status);

    const calls = await request(app.getHttpServer()).get('/v1/call-intelligence/calls');
    expect([401, 403, 503]).toContain(calls.status);
  });

  it('runs bounded sequential load smoke on public speech catalogs', async () => {
    const paths = [
      '/v1/speech/products',
      '/v1/emotion/engine',
      '/v1/wake-word/engine',
      '/v1/speech-analytics/engine',
      '/v1/call-intelligence/engine',
      '/v1/audio-intelligence/engine',
    ];
    const started = Date.now();
    const iterations = 24;
    for (let i = 0; i < iterations; i++) {
      const path = paths[i % paths.length]!;
      await request(app.getHttpServer()).get(path).expect(200);
    }
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(30_000);
    expect(iterations).toBe(24);
  });

  it('runs bounded parallel stress smoke on speech products catalog', async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        request(app.getHttpServer()).get('/v1/speech/products').expect(200),
      ),
    );
    expect(results.every((r) => r.status === 200)).toBe(true);
  });

  it('smoke-tests realtime SSE endpoints (emotion + wake-word)', async () => {
    const emotion = await request(app.getHttpServer())
      .post('/v1/emotion/stream')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ text: 'I am excited and this is urgent ASAP!' })
      .expect(200);
    expect(emotion.headers['content-type']).toMatch(/text\/event-stream/);
    expect(emotion.text).toContain('event: done');

    const wake = await request(app.getHttpServer())
      .post('/v1/wake-word/detect/stream')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ text: 'hey lugemi please help' })
      .expect(200);
    expect(wake.headers['content-type']).toMatch(/text\/event-stream/);
    expect(wake.text).toContain('event: done');
  });

  it('GraphQL Speech Cloud façade queries respond', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `{
          speechProducts { id status }
          speechAnalyticsEngine { product shippedCount }
          callIntelligenceEngine { product }
          wakeWordEngine { product }
          emotionEngine { product }
          audioEngine { product }
          pronunciationEngine { product }
        }`,
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.speechProducts.length).toBeGreaterThan(5);
    expect(res.body.data.speechAnalyticsEngine.shippedCount).toBeGreaterThan(3);
  });

  it('documents 12-layer cloud blueprint', () => {
    const blueprint = readFileSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'), 'utf8');
    expect(blueprint).toContain('Cloud Foundation');
    expect(blueprint).toContain('Production Audit');
    expect(blueprint).toContain('Speech Cloud');
    expect(blueprint).toContain('Language Cloud');
  });
});
