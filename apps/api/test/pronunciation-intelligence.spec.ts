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
import { alignWords, tokenize } from '../src/pronunciation-intelligence/pronunciation-score';
import { analyzePhonemes } from '../src/pronunciation-intelligence/pronunciation-phonemes';

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
              clerkUserId: `clerk_pron_${name}_${Date.now}_${Math.random}`,
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

describe('Pronunciation Intelligence',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  });

  afterAll(async  => {
    await app.close;
  });

  it('documents Pronunciation Intelligence honesty',  => {
    const doc = join(root, 'docs/PRONUNCIATION_INTELLIGENCE.md');
    const adr = join(root, 'docs/adr/0075-pronunciation-intelligence.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/deferred/i);
    expect(text).toContain('Forced alignment');
    expect(text).not.toMatch(/ELSA.*shipped/i);
  });

  it('exposes pronunciation engine with forced alignment deferred', async  => {
    const res = await request(app.getHttpServer).get('/v1/pronunciation/engine').expect(200);
    expect(res.body.product).toContain('Pronunciation');
    const fa = res.body.capabilities.find((c: { id: string }) => c.id === 'forced-alignment');
    expect(fa.status).toBe('deferred');
    expect(res.body.capabilities.some((c: { id: string }) => c.id === 'pronunciation-assessment')).toBe(
      true,
    );
  });

  it('assesses text hypothesis and records analytics', async  => {
    const org = await seedOrg(prisma, 'pron');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'pron-key',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/pronunciation/assess')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        reference: 'Hello world thank you',
        hypothesis: 'Hello world thank you',
        language: 'en',
      })
      .expect(200);

    expect(res.body.scores.overall).toBeGreaterThan(80);
    expect(res.body.scores.accuracy).toBe(100);
    expect(res.body.coaching.length).toBeGreaterThan(0);

    const score = await request(app.getHttpServer)
      .post('/v1/pronunciation/score')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        reference: 'Hello world',
        hypothesis: 'Hello word',
        language: 'en',
      })
      .expect(200);
    expect(score.body.scores.accuracy).toBeLessThan(100);

    const phonemes = await request(app.getHttpServer)
      .post('/v1/pronunciation/phonemes')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'hello world', language: 'en' })
      .expect(200);
    expect(phonemes.body.words.length).toBe(2);
    expect(phonemes.body.words[0].phonemes.length).toBeGreaterThan(0);

    const analytics = await request(app.getHttpServer)
      .get('/v1/pronunciation/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.total).toBeGreaterThanOrEqual(2);
  });

  it('streams SSE assess events', async  => {
    const org = await seedOrg(prisma, 'stream');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'stream-key',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/pronunciation/assess/stream')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        reference: 'Good morning',
        hypothesis: 'Good morning',
        language: 'en',
      })
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('event: start');
    expect(res.text).toContain('event: done');
  });

  it('exposes pronunciationEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({ query: '{ pronunciationEngine { product capabilities { id status } } }' })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.pronunciationEngine.product).toContain('Pronunciation');
  });

  it('aligns words and analyzes phonemes',  => {
    const alignment = alignWords(tokenize('hello world'), tokenize('hello word'));
    expect(alignment.some((a) => a.status === 'substitution' || a.status === 'correct')).toBe(true);
    const phones = analyzePhonemes('hello swahili', 'sw');
    expect(phones[0]?.source).toBe('dictionary');
    expect(phones[1]?.stress.primaryIndex).toBeGreaterThanOrEqual(0);
  });
});
