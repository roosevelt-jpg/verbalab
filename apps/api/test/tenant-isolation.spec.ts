import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { JobsService } from '../src/jobs/jobs.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { applyHttpSecurity } from '../src/common/security/http-security';
import { generateApiKeySecret, hashApiKey, looksLikeApiKey } from '../src/common/crypto/api-keys';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_sec_${name}_${Date.now}_${Math.random}`,
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

async function waitForJob(jobs: JobsService, organizationId: string, jobId: string) {
  const start = Date.now;
  while (Date.now - start < 5000) {
    const job = await jobs.get(organizationId, jobId);
    if (job.status === 'succeeded' || job.status === 'failed') return job;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`Job ${jobId} timed out`);
}

describe('Security baseline',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let jobs: JobsService;
  let storageDir: string;

  beforeAll(async  => {
    storageDir = await mkdtemp(join(tmpdir, 'lugemi-sec-'));
    process.env.DOCUMENT_STORAGE_DIR = storageDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    applyHttpSecurity(app);
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    jobs = app.get(JobsService);

    app.get(GatewayService).setProviderForTests({
      name: 'fixture',
      async translate(input) {
        return {
          text: `[${input.target}] ${input.text}`,
          source: input.source,
          target: input.target,
          provider: 'fixture',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });
    app.get(GatewayService).setEmbeddingProviderForTests({
      name: 'fixture_embeddings',
      async embed(input) {
        const texts = Array.isArray(input.input) ? input.input : [input.input];
        return {
          data: texts.map((_, index) => ({
            index,
            embedding: Array.from({ length: 1536 }, (__, i) => (i === 0 ? index + 1 : 0)),
          })),
          model: 'fixture-embed',
          provider: 'fixture_embeddings',
          promptTokens: texts.length,
          totalTokens: texts.length,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async  => {
    await app.close;
    await rm(storageDir, { recursive: true, force: true });
  });

  it('sets security headers on responses', async  => {
    const res = await request(app.getHttpServer).get('/health').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']?.toLowerCase).toMatch(/deny|sameorigin/);
  });

  it('hashes API keys (SHA-256) and never stores the secret',  => {
    const generated = generateApiKeySecret;
    expect(looksLikeApiKey(generated.secret)).toBe(true);
    expect(generated.hash).toBe(hashApiKey(generated.secret));
    expect(generated.hash).toHaveLength(64);
    expect(generated.hash).not.toContain(generated.secret);
  });

  it('org B cannot read org A jobs by id', async  => {
    const orgA = await seedOrg(prisma, 'isoA');
    const orgB = await seedOrg(prisma, 'isoB');
    const keyA = await apiKeys.create({
      organizationId: orgA.id,
      workspaceId: orgA.workspaces[0]!.id,
      userId: orgA.memberships[0]!.userId,
      name: 'a-key',
    });
    const keyB = await apiKeys.create({
      organizationId: orgB.id,
      workspaceId: orgB.workspaces[0]!.id,
      userId: orgB.memberships[0]!.userId,
      name: 'b-key',
    });

    const created = await request(app.getHttpServer)
      .post('/v1/jobs')
      .set('Authorization', `Bearer ${keyA.secret}`)
      .send({
        type: 'batch_translate',
        input: { source: 'en', target: 'sw', items: [{ id: '1', text: 'Hello' }] },
      })
      .expect(201);

    await waitForJob(jobs, orgA.id, created.body.id);

    await request(app.getHttpServer)
      .get(`/v1/jobs/${created.body.id}`)
      .set('Authorization', `Bearer ${keyB.secret}`)
      .expect(404);

    await request(app.getHttpServer)
      .get(`/v1/jobs/${created.body.id}`)
      .set('Authorization', `Bearer ${keyA.secret}`)
      .expect(200);
  });

  it('org B cannot read or delete org A knowledge documents', async  => {
    const orgA = await seedOrg(prisma, 'knowA');
    const orgB = await seedOrg(prisma, 'knowB');
    const keyA = await apiKeys.create({
      organizationId: orgA.id,
      workspaceId: orgA.workspaces[0]!.id,
      userId: orgA.memberships[0]!.userId,
      name: 'know-a',
    });
    const keyB = await apiKeys.create({
      organizationId: orgB.id,
      workspaceId: orgB.workspaces[0]!.id,
      userId: orgB.memberships[0]!.userId,
      name: 'know-b',
    });

    const upload = await request(app.getHttpServer)
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${keyA.secret}`)
      .attach('file', Buffer.from('Confidential tenant A document.'), 'a.txt')
      .expect(201);

    await request(app.getHttpServer)
      .get(`/v1/knowledge/documents/${upload.body.id}`)
      .set('Authorization', `Bearer ${keyB.secret}`)
      .expect(404);

    await request(app.getHttpServer)
      .delete(`/v1/knowledge/documents/${upload.body.id}`)
      .set('Authorization', `Bearer ${keyB.secret}`)
      .expect(404);

    const listB = await request(app.getHttpServer)
      .get('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${keyB.secret}`)
      .expect(200);
    expect(listB.body.data.some((d: { id: string }) => d.id === upload.body.id)).toBe(false);
  });

  it('org B cannot revoke org A API keys', async  => {
    const orgA = await seedOrg(prisma, 'keyA');
    const orgB = await seedOrg(prisma, 'keyB');
    const keyA = await apiKeys.create({
      organizationId: orgA.id,
      workspaceId: orgA.workspaces[0]!.id,
      userId: orgA.memberships[0]!.userId,
      name: 'victim',
    });
    await apiKeys.create({
      organizationId: orgB.id,
      workspaceId: orgB.workspaces[0]!.id,
      userId: orgB.memberships[0]!.userId,
      name: 'attacker',
    });

    await expect(apiKeys.revoke(orgB.id, keyA.id)).rejects.toMatchObject({
      code: 'not_found',
    });

    const listed = await apiKeys.list(orgA.id);
    expect(listed.some((k) => k.id === keyA.id && !k.revokedAt)).toBe(true);
  });
});
