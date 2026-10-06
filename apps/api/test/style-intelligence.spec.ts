import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { GatewayService } from '../src/gateway/gateway.service';

const root = join(__dirname, '../../..');

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_si_${name}_${Date.now()}_${Math.random()}`,
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

describe('Style Intelligence Phase 11 (VL-143)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rawKey: string;
  let prevOpenAi: string | undefined;

  beforeAll(async () => {
    prevOpenAi = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    app.get(GatewayService).setDetectProviderForTests({
      name: 'fixture_detect',
      async detect() {
        return { language: 'en', confidence: 0.95, provider: 'fixture_detect' };
      },
    });

    const org = await seedOrg(prisma, 'si');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'si-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async () => {
    if (prevOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevOpenAi;
    await app.close();
  });

  it('ships ADR and docs', () => {
    expect(existsSync(join(root, 'docs/adr/0064-style-intelligence-phase-11.md'))).toBe(true);
    expect(readFileSync(join(root, 'docs/STYLE.md'), 'utf8')).toContain('/detect');
    expect(readFileSync(join(root, 'docs/STYLE.md'), 'utf8')).toContain('/transfer');
  });

  it('exposes intelligence catalog with partial marketing/legal', async () => {
    const res = await request(app.getHttpServer()).get('/v1/style/intelligence').expect(200);
    expect(res.body.product).toMatch(/Style/i);
    expect(
      res.body.capabilities.some((c: { id: string; status: string }) => c.id === 'tone_detection' && c.status === 'shipped'),
    ).toBe(true);
    expect(
      res.body.capabilities.some((c: { id: string; status: string }) => c.id === 'marketing' && c.status === 'partial'),
    ).toBe(true);
    expect(
      res.body.capabilities.some((c: { id: string; status: string }) => c.id === 'style_transfer' && c.status === 'partial'),
    ).toBe(true);
  });

  it('lists expanded profiles including formal/business/marketing/technical', async () => {
    const res = await request(app.getHttpServer()).get('/v1/style/profiles').expect(200);
    const ids = res.body.data.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'formal',
        'professional',
        'business',
        'marketing',
        'technical',
        'medical',
        'legal',
        'government',
        'casual',
      ]),
    );
  });

  it('detects marketing tone from cues', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/style/detect')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ text: 'Buy now and unlock this limited time campaign CTA!' })
      .expect(200);
    expect(res.body.detectedTone).toBe('marketing');
    expect(res.body.confidence).toBeGreaterThan(0.4);
  });

  it('transforms tone to formal', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/style/transform')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ text: "I'm gonna finish this, yeah?", targetTone: 'formal', language: 'en' })
      .expect(200);
    expect(res.body.targetTone).toBe('formal');
    expect(res.body.rewritten).toMatch(/I am/);
    expect(res.body.rewritten).toMatch(/going to/);
    expect(res.body.changed).toBe(true);
  });

  it('transfers style from casual cues to professional with disclaimer profiles intact', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/style/transfer')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ text: "I'm gonna get this ASAP, yeah?", targetProfile: 'business', language: 'en' })
      .expect(200);
    expect(res.body.sourceTone).toBeTruthy();
    expect(res.body.targetProfile).toBe('business');
    expect(res.body.rewritten.toLowerCase()).toContain('as soon as possible');
    expect(res.body.operation).toBe('style_transfer');
  });

  it('returns analytics for the org', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/style/analytics')
      .set('Authorization', `Bearer ${rawKey}`)
      .expect(200);
    expect(res.body.windowDays).toBe(30);
    expect(res.body.toneDetections + res.body.toneTransforms + res.body.styleTransfers).toBeGreaterThan(0);
  });

  it('exposes GraphQL styleIntelligence and detectTone', async () => {
    const catalog = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ styleIntelligence { product shippedCount } }' })
      .expect(200);
    expect(catalog.body.errors).toBeUndefined();
    expect(catalog.body.data.styleIntelligence.shippedCount).toBeGreaterThan(5);

    const detect = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `mutation($input: DetectToneInput!) {
          detectTone(input: $input) { detectedTone confidence suggestedProfile }
        }`,
        variables: { input: { text: 'Refactor the API endpoint schema for lower latency' } },
      })
      .expect(200);
    expect(detect.body.errors).toBeUndefined();
    expect(detect.body.data.detectTone.detectedTone).toBe('technical');
  });
});
