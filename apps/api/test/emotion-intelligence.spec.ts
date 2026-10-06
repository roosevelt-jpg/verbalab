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
import { analyzeSpeechEmotion } from '../src/emotion-intelligence/emotion-signals';

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
              clerkUserId: `clerk_emo_${name}_${Date.now()}_${Math.random()}`,
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

describe('Emotion Intelligence (VL-154)', () => {
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

  it('documents Emotion Intelligence honesty', () => {
    const doc = join(root, 'docs/EMOTION_INTELLIGENCE.md');
    const adr = join(root, 'docs/adr/0073-emotion-intelligence.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('urgency');
    expect(text).toMatch(/deferred/i);
    expect(text).not.toMatch(/trained SER.*shipped/i);
  });

  it('exposes emotion engine with required labels', async () => {
    const res = await request(app.getHttpServer()).get('/v1/emotion/engine').expect(200);
    expect(res.body.product).toContain('Emotion');
    expect(res.body.labels).toEqual(
      expect.arrayContaining([
        'happy',
        'sad',
        'angry',
        'fear',
        'neutral',
        'stress',
        'confidence',
        'excitement',
        'urgency',
      ]),
    );
    const acoustic = res.body.capabilities.find((c: { id: string }) => c.id === 'acoustic-ser');
    expect(acoustic.status).toBe('deferred');
  });

  it('detects emotion from text and records analytics', async () => {
    const org = await seedOrg(prisma, 'emo');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'emo-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/emotion/detect')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: "I'm so excited and this is urgent ASAP!" })
      .expect(200);

    expect(['excitement', 'urgency', 'happy']).toContain(res.body.label);
    expect(res.body.confidence).toBeGreaterThan(0.4);
    expect(res.body.scores.length).toBeGreaterThan(3);

    const analytics = await request(app.getHttpServer())
      .get('/v1/emotion/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.detects).toBeGreaterThanOrEqual(1);
  });

  it('streams SSE emotion events', async () => {
    const org = await seedOrg(prisma, 'stream');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'stream-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/emotion/stream')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'I am furious and angry about this.' })
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('event: start');
    expect(res.text).toContain('event: done');
  });

  it('exposes emotionEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ emotionEngine { product labels capabilities { id status } } }' })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.emotionEngine.labels).toContain('stress');
  });

  it('scores cue lexicon helpers', () => {
    const sad = analyzeSpeechEmotion('I feel so sad and miserable today');
    expect(sad.label).toBe('sad');
    const fear = analyzeSpeechEmotion('I am terrified and afraid');
    expect(fear.label).toBe('fear');
  });
});
