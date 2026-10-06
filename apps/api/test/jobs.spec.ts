import { createServer, IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { JobsService } from '../src/jobs/jobs.service';
import { WebhookService } from '../src/jobs/webhook.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_jobs_${name}_${Date.now()}_${Math.random()}`,
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

async function waitForJob(
  jobs: JobsService,
  organizationId: string,
  jobId: string,
  opts: { timeoutMs?: number; awaitWebhook?: boolean } = {},
) {
  const timeoutMs = opts.timeoutMs ?? 5000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await jobs.get(organizationId, jobId);
    const terminal = job.status === 'succeeded' || job.status === 'failed';
    if (terminal) {
      if (!opts.awaitWebhook || job.webhookStatus === 'delivered' || job.webhookStatus === 'failed') {
        return job;
      }
    }
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`Job ${jobId} did not finish in time`);
}

describe('Jobs + webhooks (VL-044)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let jobs: JobsService;
  let webhooks: WebhookService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    jobs = app.get(JobsService);
    webhooks = app.get(WebhookService);

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('signs and verifies webhook payloads', async () => {
    const secret = 'whsec_test';
    const timestamp = '1710000000';
    const body = '{"event":"job.succeeded"}';
    const signature = webhooks.signPayload(secret, timestamp, body);
    expect(webhooks.verifySignature(secret, timestamp, body, signature)).toBe(true);
    expect(webhooks.verifySignature(secret, timestamp, body, 'v1=deadbeef')).toBe(false);
  });

  it('creates batch_translate job, processes inline, polls status', async () => {
    const org = await seedOrg(prisma, 'batch');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'jobs-key',
    });

    const created = await request(app.getHttpServer())
      .post('/v1/jobs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        type: 'batch_translate',
        input: {
          source: 'en',
          target: 'sw',
          items: [
            { id: 'a', text: 'Hello' },
            { id: 'b', text: 'World' },
          ],
        },
      })
      .expect(201);

    expect(created.body.status).toBe('queued');
    expect(created.body.id).toBeTruthy();

    const done = await waitForJob(jobs, org.id, created.body.id);
    expect(done.status).toBe('succeeded');
    expect(done.result).toMatchObject({
      provider: 'fixture',
      characters: 10,
      items: [
        { id: 'a', text: '[sw] Hello', characters: 5 },
        { id: 'b', text: '[sw] World', characters: 5 },
      ],
    });

    const polled = await request(app.getHttpServer())
      .get(`/v1/jobs/${created.body.id}`)
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(polled.body.status).toBe('succeeded');

    const listed = await request(app.getHttpServer())
      .get('/v1/jobs')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(listed.body.some((j: { id: string }) => j.id === created.body.id)).toBe(true);
  });

  it('delivers signed webhook on success', async () => {
    const received: Array<{
      headers: IncomingMessage['headers'];
      body: string;
    }> = [];

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        received.push({
          headers: req.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
        res.writeHead(200);
        res.end('ok');
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const { port } = server.address() as AddressInfo;
    const webhookUrl = `http://127.0.0.1:${port}/hook`;

    try {
      const org = await seedOrg(prisma, 'hook');
      const key = await apiKeys.create({
        organizationId: org.id,
        workspaceId: org.workspaces[0]!.id,
        userId: org.memberships[0]!.userId,
        name: 'hook-key',
      });

      const created = await request(app.getHttpServer())
        .post('/v1/jobs')
        .set('Authorization', `Bearer ${key.secret}`)
        .send({
          type: 'batch_translate',
          webhookUrl,
          input: {
            source: 'en',
            target: 'yo',
            items: [{ id: '1', text: 'Hi' }],
          },
        })
        .expect(201);

      const done = await waitForJob(jobs, org.id, created.body.id, { awaitWebhook: true });
      expect(done.status).toBe('succeeded');
      expect(done.webhookStatus).toBe('delivered');

      expect(received.length).toBe(1);
      const payload = JSON.parse(received[0]!.body) as {
        event: string;
        data: { id: string };
      };
      expect(payload.event).toBe('job.succeeded');
      expect(payload.data.id).toBe(created.body.id);

      const timestamp = String(received[0]!.headers['x-lugemi-timestamp']);
      const signature = String(received[0]!.headers['x-lugemi-signature']);
      const orgRow = await prisma.organization.findUniqueOrThrow({ where: { id: org.id } });
      expect(orgRow.webhookSigningSecret).toBeTruthy();
      expect(
        webhooks.verifySignature(
          orgRow.webhookSigningSecret!,
          timestamp,
          received[0]!.body,
          signature,
        ),
      ).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it('rejects invalid job payloads', async () => {
    const org = await seedOrg(prisma, 'bad');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'bad-key',
    });

    await request(app.getHttpServer())
      .post('/v1/jobs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ type: 'nope', input: { source: 'en', target: 'sw', items: [] } })
      .expect(400);

    await request(app.getHttpServer())
      .post('/v1/jobs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        type: 'batch_translate',
        input: { source: 'en', target: 'sw', items: [] },
      })
      .expect(400);
  });
});
