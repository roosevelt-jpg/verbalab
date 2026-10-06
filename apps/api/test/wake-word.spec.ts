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
import { spotPhrases } from '../src/wake-word/wake-spotter';

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
              clerkUserId: `clerk_wake_${name}_${Date.now()}_${Math.random()}`,
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

describe('Wake Word Engine', () => {
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

  it('documents Wake Word honesty', () => {
    const doc = join(root, 'docs/WAKE_WORD.md');
    const adr = join(root, 'docs/adr/0076-wake-word.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/deferred/i);
    expect(text).toContain('Porcupine');
    expect(text).not.toMatch(/Porcupine.*shipped/i);
  });

  it('exposes wake engine with on-device DNN deferred', async () => {
    const res = await request(app.getHttpServer()).get('/v1/wake-word/engine').expect(200);
    expect(res.body.product).toContain('Wake');
    expect(res.body.defaultWakePhrases).toEqual(
      expect.arrayContaining(['hey lugemi', 'ok lugemi', 'lugemi']),
    );
    const dnn = res.body.capabilities.find((c: { id: string }) => c.id === 'on-device-dnn');
    expect(dnn.status).toBe('deferred');
  });

  it('detects default wake phrases and manages custom keywords', async () => {
    const org = await seedOrg(prisma, 'wake');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'wake-key',
    });

    const detect = await request(app.getHttpServer())
      .post('/v1/wake-word/detect')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hey Lugemi please help me' })
      .expect(200);
    expect(detect.body.wakeDetected).toBe(true);
    expect(detect.body.hits.length).toBeGreaterThan(0);

    const created = await request(app.getHttpServer())
      .post('/v1/wake-word/keywords')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ phrase: 'escalate to human', kind: 'trigger' })
      .expect(201);
    expect(created.body.kind).toBe('trigger');

    const triggers = await request(app.getHttpServer())
      .post('/v1/wake-word/triggers')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Please escalate to human immediately' })
      .expect(200);
    expect(triggers.body.fired.length).toBeGreaterThanOrEqual(1);

    const spot = await request(app.getHttpServer())
      .post('/v1/wake-word/spot')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'refund policy please', keywords: ['refund', 'billing'] })
      .expect(200);
    expect(spot.body.hitCount).toBeGreaterThanOrEqual(1);

    await request(app.getHttpServer())
      .delete(`/v1/wake-word/keywords/${created.body.id}`)
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);

    const analytics = await request(app.getHttpServer())
      .get('/v1/wake-word/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.total).toBeGreaterThanOrEqual(3);
  });

  it('streams SSE detect events', async () => {
    const org = await seedOrg(prisma, 'stream');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'stream-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/wake-word/detect/stream')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'ok lugemi start listening' })
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('event: start');
    expect(res.text).toContain('event: done');
  });

  it('exposes wakeWordEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ wakeWordEngine { product defaultWakePhrases capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.wakeWordEngine.defaultWakePhrases).toContain('hey lugemi');
  });

  it('spots phrases with word boundaries', () => {
    const hits = spotPhrases('please hey lugemi now', [
      { phrase: 'hey lugemi', kind: 'wake_word' },
    ]);
    expect(hits.length).toBe(1);
    expect(hits[0]!.matched).toContain('hey lugemi');
  });
});
