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
              clerkUserId: `clerk_ic_${name}_${Date.now}_${Math.random}`,
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

describe('Intelligent Cache',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_INTELLIGENT_CACHE_MODE;
  const prevMax = process.env.LUGEMI_CACHE_MAX_ENTRIES;

  beforeAll(async  => {
    process.env.LUGEMI_INTELLIGENT_CACHE_MODE = 'sandbox';
    process.env.LUGEMI_CACHE_MAX_ENTRIES = '3';

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
    if (prevMode === undefined) delete process.env.LUGEMI_INTELLIGENT_CACHE_MODE;
    else process.env.LUGEMI_INTELLIGENT_CACHE_MODE = prevMode;
    if (prevMax === undefined) delete process.env.LUGEMI_CACHE_MAX_ENTRIES;
    else process.env.LUGEMI_CACHE_MAX_ENTRIES = prevMax;
    await app.close;
  });

  it('documents Intelligent Cache honesty',  => {
    const doc = join(root, 'docs/INTELLIGENT_CACHE.md');
    const adr = join(root, 'docs/adr/0121-intelligent-cache.md');
    const readme = join(root, 'docs/roadmap/volume7-inference-cloud/README_VOLUME7.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/Redis|vector|CDN/i);
    expect(text).toMatch(/does \*\*not\*\*|not auto-wire/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
    expect(text).toContain('');
  });

  it('exposes engine with honesty + namespaces', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/intelligent-cache/engine')
      .expect(200);
    expect(res.body.product).toContain('Intelligent Cache');
    expect(res.body.honesty.redisClusterOs).toBe(false);
    expect(res.body.honesty.vectorSemanticOs).toBe(false);
    expect(res.body.honesty.cdnOs).toBe(false);
    expect(res.body.honesty.autoWiresGatewayResponses).toBe(false);
    expect(res.body.honesty.regeneratesAiGateway).toBe(false);
    expect(res.body.honesty.exactKeyLookup).toBe(true);
    expect(res.body.ceilings.maxEntriesPerWorkspace).toBe(3);

    const ns = await request(app.getHttpServer)
      .get('/v1/intelligent-cache/namespaces')
      .expect(200);
    expect(ns.body.namespaces.map((n: { id: string }) => n.id)).toEqual(
      expect.arrayContaining([
        'semantic',
        'translation',
        'embedding',
        'speech',
        'voice',
        'document',
        'prompt',
        'context',
      ]),
    );
  });

  it('puts, lookups, invalidates, and enforces entry ceiling', async  => {
    const org = await seedOrg(prisma, `ic_${Date.now}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'ic-test',
    });

    const miss = await request(app.getHttpServer)
      .post('/v1/intelligent-cache/lookup')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ namespace: 'translation', key: 'en:sw:hello' })
      .expect(200);
    expect(miss.body.hit).toBe(false);

    await request(app.getHttpServer)
      .post('/v1/intelligent-cache/put')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        namespace: 'translation',
        key: 'en:sw:hello',
        value: { text: 'habari' },
      })
      .expect(201);

    const hit = await request(app.getHttpServer)
      .post('/v1/intelligent-cache/lookup')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ namespace: 'translation', key: 'en:sw:hello' })
      .expect(200);
    expect(hit.body.hit).toBe(true);
    expect(hit.body.entry.value.text).toBe('habari');
    expect(hit.body.honesty.autoWiresGatewayResponses).toBe(false);

    // Semantic normalized hash: same text different spacing
    await request(app.getHttpServer)
      .post('/v1/intelligent-cache/put')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        namespace: 'semantic',
        text: 'Hello World',
        value: { answer: 1 },
      })
      .expect(201);
    const sem = await request(app.getHttpServer)
      .post('/v1/intelligent-cache/lookup')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ namespace: 'semantic', text: 'hello world' })
      .expect(200);
    expect(sem.body.hit).toBe(true);

    await request(app.getHttpServer)
      .post('/v1/intelligent-cache/put')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ namespace: 'embedding', key: 'e1', value: { v: [1] } })
      .expect(201);

    const over = await request(app.getHttpServer)
      .post('/v1/intelligent-cache/put')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ namespace: 'prompt', key: 'p1', value: { x: 1 } })
      .expect(402);
    expect(JSON.stringify(over.body)).toMatch(/ceiling|maxEntries/i);

    const inv = await request(app.getHttpServer)
      .post('/v1/intelligent-cache/invalidate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ namespace: 'translation', allInNamespace: true })
      .expect(200);
    expect(inv.body.deleted).toBeGreaterThanOrEqual(1);

    const mon = await request(app.getHttpServer)
      .get('/v1/intelligent-cache/monitoring')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(mon.body.honesty.vectorSemanticOs).toBe(false);
  });

  it('exposes intelligentCacheEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query:
          '{ intelligentCacheEngine { product redisClusterOs vectorSemanticOs cdnOs autoWiresGatewayResponses regeneratesAiGateway orgWorkspaceScoped sandboxEntries exactKeyLookup mode maxEntriesPerWorkspace defaultTtlSec capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.intelligentCacheEngine.redisClusterOs).toBe(false);
    expect(res.body.data.intelligentCacheEngine.vectorSemanticOs).toBe(false);
    expect(res.body.data.intelligentCacheEngine.autoWiresGatewayResponses).toBe(false);
    expect(res.body.data.intelligentCacheEngine.exactKeyLookup).toBe(true);
    expect(res.body.data.intelligentCacheEngine.maxEntriesPerWorkspace).toBe(3);
  });
});
