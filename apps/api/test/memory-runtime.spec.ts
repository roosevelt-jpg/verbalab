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
              clerkUserId: `clerk_mr_${name}_${Date.now()}_${Math.random()}`,
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

describe('Memory Runtime (VL-215)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMax = process.env.LUGEMI_KERNEL_MEMORY_MAX_ENTRIES;
  const prevMode = process.env.LUGEMI_MEMORY_RUNTIME_MODE;

  beforeAll(async () => {
    process.env.LUGEMI_MEMORY_RUNTIME_MODE = 'sandbox';
    process.env.LUGEMI_KERNEL_MEMORY_MAX_ENTRIES = '5';

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
    if (prevMax === undefined) delete process.env.LUGEMI_KERNEL_MEMORY_MAX_ENTRIES;
    else process.env.LUGEMI_KERNEL_MEMORY_MAX_ENTRIES = prevMax;
    if (prevMode === undefined) delete process.env.LUGEMI_MEMORY_RUNTIME_MODE;
    else process.env.LUGEMI_MEMORY_RUNTIME_MODE = prevMode;
    await app.close();
  });

  it('documents Memory Runtime honesty (kernel over Memory Cloud; not Mem0 OS)', () => {
    const doc = join(root, 'docs/MEMORY_RUNTIME.md');
    const adr = join(root, 'docs/adr/0126-memory-runtime.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/Mem0/i);
    expect(text).toMatch(/Memory Cloud/i);
    expect(text).toMatch(/VL-183/);
    expect(text).toMatch(/kernel/i);
    expect(text).toMatch(/replication/i);
  });

  it('exposes engine with honest flags', async () => {
    const res = await request(app.getHttpServer()).get('/v1/memory-runtime/engine').expect(200);
    expect(res.body.product).toContain('Memory Runtime');
    expect(res.body.honesty.mem0Os).toBe(false);
    expect(res.body.honesty.replicationOs).toBe(false);
    expect(res.body.honesty.regeneratesMemoryCloud).toBe(false);
    expect(res.body.honesty.regeneratesKnowledgeMemory).toBe(false);
    expect(res.body.honesty.extendsMemoryCloud).toBe(true);
    expect(res.body.honesty.kernelLayerOnly).toBe(true);
    expect(res.body.honesty.vectorSemanticOs).toBe(false);
    expect(res.body.ceilings.maxEntriesPerWorkspace).toBe(5);
    expect(res.body.links.console).toBe('/memory-runtime');

    const scopes = await request(app.getHttpServer())
      .get('/v1/memory-runtime/scopes')
      .expect(200);
    expect(scopes.body.scopes.some((s: { id: string }) => s.id === 'workspace')).toBe(true);
    expect(scopes.body.kinds.some((k: { id: string }) => k.id === 'short_term')).toBe(true);
    expect(scopes.body.layer).toBe('kernel');
  });

  it('puts, revises, searches, compresses, snapshots; isolates from Memory Cloud rows', async () => {
    const org = await seedOrg(prisma, 'mr');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'mr-key',
    });

    const put = await request(app.getHttpServer())
      .post('/v1/memory-runtime/put')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        scope: 'workspace',
        kind: 'long_term',
        content: 'Kernel fact: HQ is Nairobi.',
      })
      .expect(201);
    expect(put.body.memory.id).toBeTruthy();
    expect(put.body.honesty.extendsMemoryCloud).toBe(true);

    const row = await prisma.memoryRecord.findUnique({ where: { id: put.body.memory.id } });
    expect((row?.metadata as { layer?: string } | null)?.layer).toBe('kernel');

    const revised = await request(app.getHttpServer())
      .post('/v1/memory-runtime/revise')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        id: put.body.memory.id,
        content: 'Kernel fact: HQ is Nairobi, Kenya.',
      })
      .expect(200);
    expect(revised.body.memory.version).toBeGreaterThanOrEqual(2);

    const search = await request(app.getHttpServer())
      .post('/v1/memory-runtime/search')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'Nairobi' })
      .expect(200);
    expect(search.body.honesty.vectorSemanticOs).toBe(false);
    expect(search.body.results.some((r: { id: string }) => r.id === put.body.memory.id)).toBe(
      true,
    );

    const compressed = await request(app.getHttpServer())
      .post('/v1/memory-runtime/compress')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ id: put.body.memory.id, maxChars: 40 })
      .expect(200);
    expect(compressed.body.afterChars).toBeLessThanOrEqual(40);

    // Plain Memory Cloud (no layer=kernel) must not appear in kernel list.
    await request(app.getHttpServer())
      .post('/v1/memory-cloud/memories')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ scope: 'workspace', kind: 'long_term', content: 'Intelligence-only memory row.' })
      .expect(201);

    const listed = await request(app.getHttpServer())
      .get('/v1/memory-runtime/memories')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(
      listed.body.memories.some((m: { content: string }) =>
        m.content.includes('Intelligence-only'),
      ),
    ).toBe(false);

    const snap = await request(app.getHttpServer())
      .post('/v1/memory-runtime/snapshots')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ label: 'test-snap' })
      .expect(201);
    expect(snap.body.snapshot.label).toBe('test-snap');

    const analytics = await request(app.getHttpServer())
      .get('/v1/memory-runtime/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.total).toBeGreaterThanOrEqual(1);
  });

  it('enforces hard entry ceiling with 402', async () => {
    const org = await seedOrg(prisma, 'mr_ceil');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'mr-ceil',
    });

    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/v1/memory-runtime/put')
        .set('Authorization', `Bearer ${key.secret}`)
        .send({ content: `ceiling entry ${i}`, kind: 'long_term' })
        .expect(201);
    }

    const over = await request(app.getHttpServer())
      .post('/v1/memory-runtime/put')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ content: 'overflow', kind: 'long_term' })
      .expect(402);
    expect(over.body.error ?? over.body.code ?? over.body.message).toBeTruthy();

    const evicted = await request(app.getHttpServer())
      .post('/v1/memory-runtime/evict')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ policy: 'ttl_and_ceiling' })
      .expect(200);
    expect(evicted.body.ceilings.maxEntriesPerWorkspace).toBe(5);
  });

  it('exposes memoryRuntimeEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ memoryRuntimeEngine { product mem0Os regeneratesMemoryCloud extendsMemoryCloud kernelLayerOnly vectorSemanticOs replicationOs mode maxEntriesPerWorkspace capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.memoryRuntimeEngine.product).toContain('Memory Runtime');
    expect(res.body.data.memoryRuntimeEngine.mem0Os).toBe(false);
    expect(res.body.data.memoryRuntimeEngine.extendsMemoryCloud).toBe(true);
    expect(res.body.data.memoryRuntimeEngine.kernelLayerOnly).toBe(true);
    expect(res.body.data.memoryRuntimeEngine.capabilities.length).toBeGreaterThan(5);
  });
});
