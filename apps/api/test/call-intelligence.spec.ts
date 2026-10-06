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
import { analyzeCallTranscript } from '../src/call-intelligence/call-analysis';

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
              clerkUserId: `clerk_call_${name}_${Date.now()}_${Math.random()}`,
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

describe('Call Intelligence (VL-158)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Call Intelligence honesty', () => {
    const doc = join(root, 'docs/CALL_INTELLIGENCE.md');
    const adr = join(root, 'docs/adr/0077-call-intelligence.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/Voice FAQ/i);
    expect(text).toMatch(/deferred/i);
    expect(text).not.toMatch(/Gong.*shipped/i);
  });

  it('exposes call engine with realtime CCaaS deferred', async () => {
    const res = await request(app.getHttpServer()).get('/v1/call-intelligence/engine').expect(200);
    expect(res.body.product).toContain('Call');
    const rt = res.body.capabilities.find((c: { id: string }) => c.id === 'realtime-ccaas');
    expect(rt.status).toBe('deferred');
  });

  it('ingests transcript, analyzes, and reports', async () => {
    const org = await seedOrg(prisma, 'call');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'call-key',
    });

    const created = await request(app.getHttpServer())
      .post('/v1/call-intelligence/calls')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        transcript:
          'Hello, I am frustrated about my billing invoice and need a refund. This call is recorded for quality. We will follow up tomorrow. Thank you.',
        direction: 'inbound',
        analyze: true,
      })
      .expect(201);

    expect(created.body.status).toBe('analyzed');
    expect(created.body.summary).toBeTruthy();
    expect(created.body.analysis.sentiment.label).toBeTruthy();
    expect(created.body.analysis.qa.score).toBeGreaterThan(0);
    expect(created.body.analysis.topics.length).toBeGreaterThan(0);

    const listed = await request(app.getHttpServer())
      .get('/v1/call-intelligence/calls')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(listed.body.data.length).toBeGreaterThanOrEqual(1);

    const report = await request(app.getHttpServer())
      .get('/v1/call-intelligence/report')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(report.body.totalCalls).toBeGreaterThanOrEqual(1);

    const analytics = await request(app.getHttpServer())
      .get('/v1/call-intelligence/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.total).toBeGreaterThanOrEqual(1);
  });

  it('streams SSE analyze events', async () => {
    const org = await seedOrg(prisma, 'stream');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'stream-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/call-intelligence/analyze/stream')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ transcript: 'Hi, thanks for the great support today. Goodbye.' })
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('event: start');
    expect(res.text).toContain('event: done');
  });

  it('exposes callIntelligenceEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ callIntelligenceEngine { product capabilities { id status } } }' })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.callIntelligenceEngine.product).toContain('Call');
  });

  it('analyzes transcripts for topics and compliance', () => {
    const analysis = analyzeCallTranscript(
      'I hate this billing charge on card 4111 1111 1111 1111. Please refund.',
    );
    expect(analysis.topics.some((t) => t.id === 'billing')).toBe(true);
    expect(analysis.compliance.flags.some((f) => f.id === 'pci-card')).toBe(true);
    expect(analysis.coaching.length).toBeGreaterThan(0);
  });
});
