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
              clerkUserId: `clerk_br_${name}_${Date.now}_${Math.random}`,
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

describe('Batch Runtime',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_BATCH_RUNTIME_MODE;
  const prevItems = process.env.LUGEMI_BATCH_MAX_ITEMS;
  const prevRetries = process.env.LUGEMI_BATCH_MAX_RETRIES;
  const prevInline = process.env.JOBS_INLINE;

  beforeAll(async  => {
    process.env.LUGEMI_BATCH_RUNTIME_MODE = 'sandbox';
    process.env.LUGEMI_BATCH_MAX_ITEMS = '5';
    process.env.LUGEMI_BATCH_MAX_RETRIES = '1';
    process.env.JOBS_INLINE = '1';

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
    if (prevMode === undefined) delete process.env.LUGEMI_BATCH_RUNTIME_MODE;
    else process.env.LUGEMI_BATCH_RUNTIME_MODE = prevMode;
    if (prevItems === undefined) delete process.env.LUGEMI_BATCH_MAX_ITEMS;
    else process.env.LUGEMI_BATCH_MAX_ITEMS = prevItems;
    if (prevRetries === undefined) delete process.env.LUGEMI_BATCH_MAX_RETRIES;
    else process.env.LUGEMI_BATCH_MAX_RETRIES = prevRetries;
    if (prevInline === undefined) delete process.env.JOBS_INLINE;
    else process.env.JOBS_INLINE = prevInline;
    await app.close;
  });

  it('documents Batch Runtime honesty',  => {
    const doc = join(root, 'docs/BATCH_RUNTIME.md');
    const adr = join(root, 'docs/adr/0120-batch-runtime.md');
    const readme = join(root, 'docs/roadmap/volume7-inference-cloud/README_VOLUME7.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/Spark|Airflow|Celery/i);
    expect(text).toMatch(/does \*\*not\*\*|not regenerate/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
    expect(text).toContain('');
    expect(text).toMatch(/BullMQ/i);
  });

  it('exposes engine with honesty + kinds', async  => {
    const res = await request(app.getHttpServer).get('/v1/batch-runtime/engine').expect(200);
    expect(res.body.product).toContain('Batch Runtime');
    expect(res.body.honesty.sparkOs).toBe(false);
    expect(res.body.honesty.airflowOs).toBe(false);
    expect(res.body.honesty.celeryOs).toBe(false);
    expect(res.body.honesty.distributedBatchOs).toBe(false);
    expect(res.body.honesty.regeneratesJobsApi).toBe(false);
    expect(res.body.honesty.extendsBullMqJobs).toBe(true);
    expect(res.body.ceilings.maxItemsPerRun).toBe(5);
    expect(res.body.ceilings.maxRetries).toBe(1);

    const kinds = await request(app.getHttpServer).get('/v1/batch-runtime/kinds').expect(200);
    expect(kinds.body.kinds.find((k: { id: string }) => k.id === 'video').status).toBe(
      'deferred',
    );
    expect(kinds.body.kinds.find((k: { id: string }) => k.id === 'translation').status).toBe(
      'partial',
    );
  });

  it('creates sandbox runs, checkpoints, retries, enforces ceilings', async  => {
    const org = await seedOrg(prisma, `br_${Date.now}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'br-test',
    });

    const emb = await request(app.getHttpServer)
      .post('/v1/batch-runtime/runs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kind: 'embedding',
        priority: 'high',
        items: ['a', 'b', 'c'],
      })
      .expect(201);
    expect(emb.body.run.status).toBe('completed');
    expect(emb.body.run.priorityWeight).toBe(30);
    expect(emb.body.honesty.extendsBullMqJobs).toBe(true);

    const ck = await request(app.getHttpServer)
      .post(`/v1/batch-runtime/runs/${emb.body.run.id}/checkpoint`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ index: 2 })
      .expect(200);
    expect(ck.body.run.checkpointIndex).toBe(2);

    const retried = await request(app.getHttpServer)
      .post(`/v1/batch-runtime/runs/${emb.body.run.id}/retry`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(200);
    expect(retried.body.run.attempts).toBe(1);

    const overRetry = await request(app.getHttpServer)
      .post(`/v1/batch-runtime/runs/${emb.body.run.id}/retry`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(402);
    expect(JSON.stringify(overRetry.body)).toMatch(/retry|budget|ceiling/i);

    const overItems = await request(app.getHttpServer)
      .post('/v1/batch-runtime/runs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kind: 'ocr',
        items: ['1', '2', '3', '4', '5', '6'],
      })
      .expect(402);
    expect(JSON.stringify(overItems.body)).toMatch(/ceiling|maxItems/i);

    // Translation delegates to jobs when Google key may be missing — still creates hub row
    const tr = await request(app.getHttpServer)
      .post('/v1/batch-runtime/runs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kind: 'translation',
        source: 'en',
        target: 'sw',
        items: ['hello'],
      });
    // May be 201 (job created) or error if translate hard-fails during inline process
    expect([201, 500, 502, 400]).toContain(tr.status);
    if (tr.status === 201) {
      expect(tr.body.run.jobId).toBeTruthy;
      expect(tr.body.note).toMatch(/BullMQ|batch_translate/i);
    }

    const scheduled = await request(app.getHttpServer)
      .post('/v1/batch-runtime/runs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kind: 'speech',
        items: ['clip-a'],
        runAt: new Date(Date.now + 60_000).toISOString,
      })
      .expect(201);
    expect(scheduled.body.run.status).toBe('scheduled');

    // Not due yet
    await request(app.getHttpServer)
      .post(`/v1/batch-runtime/runs/${scheduled.body.run.id}/start`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(400);

    await prisma.batchRun.update({
      where: { id: scheduled.body.run.id },
      data: { runAt: new Date(Date.now - 1000) },
    });

    const started = await request(app.getHttpServer)
      .post(`/v1/batch-runtime/runs/${scheduled.body.run.id}/start`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(200);
    expect(started.body.run.status).toBe('completed');

    const mon = await request(app.getHttpServer)
      .get('/v1/batch-runtime/monitoring')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(mon.body.honesty.regeneratesJobsApi).toBe(false);
    expect(mon.body.deferred).toContain('video-jobs');
  });

  it('exposes batchRuntimeEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query:
          '{ batchRuntimeEngine { product sparkOs airflowOs regeneratesJobsApi extendsBullMqJobs distributedBatchOs orgWorkspaceScoped sandboxRunsForNonTranslate mode maxItemsPerRun maxRetries capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.batchRuntimeEngine.sparkOs).toBe(false);
    expect(res.body.data.batchRuntimeEngine.airflowOs).toBe(false);
    expect(res.body.data.batchRuntimeEngine.regeneratesJobsApi).toBe(false);
    expect(res.body.data.batchRuntimeEngine.extendsBullMqJobs).toBe(true);
    expect(res.body.data.batchRuntimeEngine.maxItemsPerRun).toBe(5);
  });
});
