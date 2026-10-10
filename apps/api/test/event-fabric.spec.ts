import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EventFabricService } from '../src/event-fabric/event-fabric.service';
import { EventFabricBus } from '../src/event-fabric/event-fabric.bus';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkTsFiles(full));
    else if (full.endsWith('.ts')) out.push(full);
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
              clerkUserId: `clerk_ef_${name}_${Date.now()}_${Math.random()}`,
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

describe('Event Fabric', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let fabric: EventFabricService;
  let bus: EventFabricBus;

  beforeAll(async () => {
    process.env.EVENT_FABRIC_MEMORY = '1';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    fabric = app.get(EventFabricService);
    bus = app.get(EventFabricBus);
    bus.resetForTests();
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Event Fabric honesty (Redis Streams, not Kafka OS)', () => {
    const doc = join(root, 'docs/EVENT_FABRIC.md');
    const adr = join(root, 'docs/adr/0142-event-fabric.md');
    const phase = join(
      root,
      'docs/roadmap/volume10-ai-fabric/phases/phase_01_107_Event_Fabric.md',
    );
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(phase)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/Redis Streams/i);
    expect(text).toMatch(/CloudEvents/i);
    expect(text).toMatch(/not\*\* a Kafka|NOT a Kafka|not a Kafka/i);
    expect(text).toMatch(/hard gate|hard-gate/i);
    expect(text).toMatch(/Kafka|NATS|Rabbit/i);
  });

  it('has no TODO/FIXME/implement-later markers in Event Fabric source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'event-fabric'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes public catalog with Redis Streams honesty + deferred brokers', async () => {
    const res = await request(app.getHttpServer()).get('/v1/event-fabric/products').expect(200);
    expect(res.body.product).toBe('Lugemi Event Fabric');
    expect(res.body.architecture.customerFacingProduct).toBe(false);
    expect(res.body.architecture.kafkaHyperscalerOs).toBe(false);
    expect(res.body.architecture.redisStreamsActive).toBe(true);
    expect(res.body.architecture.kafkaAdapterDeferred).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.honesty.memoryFallbackWhenRedisUnavailable).toBe(true);
    expect(res.body.safety.fabricWidePolicyHardGateRequired).toBe(true);
    expect(res.body.docs).toBe('/docs/EVENT_FABRIC.md');

    const redis = res.body.products.find((p: { id: string }) => p.id === 'redis-streams');
    expect(redis.status).toBe('shipped');
    const kafka = res.body.brokers.find((b: { id: string }) => b.id === 'kafka');
    expect(kafka.status).toBe('deferred');
  });

  it('publishes, polls, fails to DLQ, retries, and replays on memory backend', async () => {
    bus.resetForTests();
    const topic = `ef_${Date.now()}`;

    const published = await request(app.getHttpServer())
      .post('/v1/event-fabric/events')
      .send({
        topic,
        type: 'com.lugemi.test.ping',
        data: { n: 1 },
        eventVersion: '1',
      })
      .expect(201);

    expect(published.body.event.specversion).toBe('1.0');
    expect(published.body.event.type).toBe('com.lugemi.test.ping');
    expect(published.body.backend).toBe('memory');

    const polled = await request(app.getHttpServer())
      .get(`/v1/event-fabric/events?topic=${topic}&count=5`)
      .expect(200);
    expect(polled.body.events.length).toBe(1);
    expect(polled.body.events[0].id).toBe(published.body.event.id);

    const streamId = published.body.event.streamId as string;

    // Exhaust retries into DLQ (maxAttempts=2 → attempt 1 retry, attempt 2 dlq)
    await request(app.getHttpServer())
      .post(`/v1/event-fabric/events/${streamId}/fail`)
      .send({ topic, maxAttempts: 2, event: published.body.event })
      .expect(200);

    const fail2 = await request(app.getHttpServer())
      .post(`/v1/event-fabric/events/${streamId}/fail`)
      .send({
        topic,
        maxAttempts: 2,
        event: { ...published.body.event, attempt: 1 },
      })
      .expect(200);
    expect(fail2.body.action).toBe('dlq');

    const dlq = await request(app.getHttpServer())
      .get(`/v1/event-fabric/dlq?topic=${topic}`)
      .expect(200);
    expect(dlq.body.events.length).toBeGreaterThan(0);

    const dlqId = dlq.body.events[0].streamId as string;
    const retried = await request(app.getHttpServer())
      .post('/v1/event-fabric/dlq/retry')
      .send({ topic, streamId: dlqId })
      .expect(200);
    expect(retried.body.event).toBeTruthy();

    const replay = await request(app.getHttpServer())
      .post('/v1/event-fabric/replay')
      .send({ topic, afterId: '0-0', count: 10 })
      .expect(200);
    expect(replay.body.events.length).toBeGreaterThan(0);

    const analytics = await request(app.getHttpServer())
      .get('/v1/event-fabric/analytics')
      .expect(200);
    expect(analytics.body.totals.published).toBeGreaterThan(0);

    const monitoring = await request(app.getHttpServer())
      .get('/v1/event-fabric/monitoring')
      .expect(200);
    expect(monitoring.body.backend).toBe('memory');
  });

  it('exposes org overview and GraphQL CQRS façades', async () => {
    const org = await seedOrg(prisma, `ef_${Date.now()}`);
    const overview = await fabric.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_ef',
      role: 'owner',
    });
    expect(overview.deferred.kafkaAdapter).toBe(true);
    expect(overview.deferred.contextFabric).toBe(false);
    expect(overview.deferred.knowledgeFabric).toBe(false);
    expect(overview.deferred.promptFabric).toBe(false);
    expect(overview.deferred.reasoningFabric).toBe(false);
    expect(overview.deferred.policyFabric).toBe(false);
    expect(overview.links.eventFabric).toBe('/event-fabric');
    expect(overview.honesty.redisStreamsActive).toBe(true);

    const caps = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ eventFabricCapabilities { id name status api notes } }',
      })
      .expect(200);
    expect(caps.body.errors).toBeUndefined();
    expect(caps.body.data.eventFabricCapabilities.length).toBeGreaterThan(5);

    const brokers = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ eventFabricBrokers { id name status protocol notes } }',
      })
      .expect(200);
    expect(brokers.body.errors).toBeUndefined();
    expect(
      brokers.body.data.eventFabricBrokers.some((b: { id: string }) => b.id === 'redis_streams'),
    ).toBe(true);
  });
});
