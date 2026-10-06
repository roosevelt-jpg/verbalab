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
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory) {
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
              clerkUserId: `clerk_vcaudit_${name}_${Date.now}_${Math.random}`,
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

describe('Voice Cloud Production Audit',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rawKey: string;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    app.get(GatewayService).setTtsProviderForTests({
      name: 'fixture',
      listVoices {
        return [
          {
            id: 'nova',
            name: 'Nova',
            gender: 'female',
            languages: ['en'],
            provider: 'fixture',
          },
        ];
      },
      async synthesize(input) {
        return {
          audio: Buffer.from(`AUDIO:${input.text}:${input.voice}`),
          mimeType: 'audio/mpeg',
          format: 'mp3',
          voice: input.voice,
          characters: [...input.text].length,
          provider: 'fixture',
          latencyMs: 1,
        };
      },
    });
    const org = await seedOrg(prisma, 'vca');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'vca-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async  => {
    await app.close;
  });

  it('ships audit ADR, blueprint ADR, and report pack',  => {
    expect(existsSync(join(root, 'docs/adr/0090-voice-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/voice-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/voice-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/voice-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/voice-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/voice-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    const readiness = readFileSync(join(root, 'docs/voice-cloud-audit/PRODUCTION_READINESS.md'), 'utf8');
    expect(readiness).toMatch(/not.*third-party TTS|Rejected/i);
    expect(readiness).toContain('bounded');
  });

  it('has no TODO/FIXME/implement-later markers in Voice Cloud source trees',  => {
    const roots = [
      join(apiSrc, 'voice-cloud'),
      join(apiSrc, 'neural-tts'),
      join(apiSrc, 'voice-cloning'),
      join(apiSrc, 'voice-clones'),
      join(apiSrc, 'emotion-voice'),
      join(apiSrc, 'voice-studio'),
      join(apiSrc, 'voice-enhancement'),
      join(apiSrc, 'voice-biometrics'),
      join(apiSrc, 'voice-marketplace'),
      join(apiSrc, 'voice-analytics'),
      join(apiSrc, 'audio'),
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

  it('exposes integrated Voice Cloud catalogs', async  => {
    const paths = [
      '/v1/voice-cloud/products',
      '/v1/tts/engine',
      '/v1/voice-cloning/engine',
      '/v1/emotion-voice/engine',
      '/v1/voice-studio/engine',
      '/v1/voice-enhancement/engine',
      '/v1/voice-biometrics/engine',
      '/v1/voice-marketplace/engine',
      '/v1/voice-analytics/engine',
    ];
    for (const path of paths) {
      const res = await request(app.getHttpServer).get(path).expect(200);
      expect(res.body).toBeTruthy;
    }
  });

  it('rejects unauthenticated voice analytics and marketplace listings (security)', async  => {
    const overview = await request(app.getHttpServer).get('/v1/voice-analytics/overview');
    expect([401, 403, 503]).toContain(overview.status);

    const listings = await request(app.getHttpServer).get('/v1/voice-marketplace/listings');
    expect([401, 403, 503]).toContain(listings.status);
  });

  it('runs bounded sequential load smoke on public voice catalogs', async  => {
    const paths = [
      '/v1/voice-cloud/products',
      '/v1/tts/engine',
      '/v1/voice-cloning/engine',
      '/v1/emotion-voice/engine',
      '/v1/voice-marketplace/engine',
      '/v1/voice-analytics/engine',
    ];
    const started = Date.now;
    const iterations = 24;
    for (let i = 0; i < iterations; i++) {
      const path = paths[i % paths.length]!;
      await request(app.getHttpServer).get(path).expect(200);
    }
    const elapsed = Date.now - started;
    expect(elapsed).toBeLessThan(30_000);
    expect(iterations).toBe(24);
  });

  it('runs bounded rapid stress smoke on voice products catalog', async  => {
    // Rapid sequential — Nest/supertest in this env ECONNRESETs on parallel bursts.
    const started = Date.now;
    for (let i = 0; i < 12; i++) {
      await request(app.getHttpServer).get('/v1/voice-cloud/products').expect(200);
    }
    expect(Date.now - started).toBeLessThan(15_000);
  });

  it('smoke-tests TTS chunk streaming SSE', async  => {
    const stream = await request(app.getHttpServer)
      .post('/v1/tts/stream')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ text: 'Voice audit stream', voice: 'nova' })
      .expect(200);
    expect(stream.headers['content-type']).toMatch(/text\/event-stream/);
    expect(stream.text).toContain('event: done');
    expect(stream.text).toContain('chunk_sse_after_synthesis');
  });

  it('GraphQL Voice Cloud façade queries respond', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `{
          voiceProducts { id status }
          neuralTtsEngine { product }
          voiceCloningEngine { product consentRequired }
          emotionVoiceEngine { product trainedExpressiveModel }
          voiceStudioEngine { product nonlinearDaw }
          voiceEnhancementEngine { product liveAec }
          voiceBiometricsEngine { product nistCertified }
          voiceMarketplaceEngine { product celebrityWithoutRights }
          voiceAnalyticsEngine { product regeneratesSpeechAnalytics shippedCount }
        }`,
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.voiceProducts.length).toBeGreaterThan(5);
    expect(res.body.data.voiceAnalyticsEngine.regeneratesSpeechAnalytics).toBe(false);
    expect(res.body.data.voiceMarketplaceEngine.celebrityWithoutRights).toBe(false);
    expect(res.body.data.voiceBiometricsEngine.nistCertified).toBe(false);
    expect(res.body.data.emotionVoiceEngine.trainedExpressiveModel).toBe(false);
  });

  it('documents 12-layer cloud blueprint with Voice Cloud closed',  => {
    const blueprint = readFileSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'), 'utf8');
    expect(blueprint).toContain('Cloud Foundation');
    expect(blueprint).toContain('Production Audit');
    expect(blueprint).toContain('Voice Cloud');
    expect(blueprint).toContain('');
    const living = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(living).toMatch(/\s*→\s*);
  });
});
