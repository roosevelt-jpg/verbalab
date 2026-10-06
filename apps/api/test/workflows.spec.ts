import { randomUUID } from 'crypto';
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
import { WorkflowsService } from '../src/workflows/workflows.service';
import { LocalStorageService } from '../src/documents/local-storage.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { EmailProvider, SendEmailInput, SendEmailResult } from '../src/notifications/email-provider';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

class MemoryEmailProvider implements EmailProvider {
  readonly name = 'memory';
  readonly sent: SendEmailInput[] = [];

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    this.sent.push(input);
    return { id: `mem_${this.sent.length}`, provider: this.name };
  }
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
              clerkUserId: `clerk_wf_${name}_${Date.now()}_${Math.random()}`,
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

function tinyWav(): Buffer {
  const dataSize = 64;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(8000, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

async function waitForJob(jobs: JobsService, organizationId: string, jobId: string) {
  const start = Date.now();
  while (Date.now() - start < 8000) {
    const job = await jobs.get(organizationId, jobId);
    if (job.status === 'succeeded' || job.status === 'failed') return job;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`Job ${jobId} timed out`);
}

describe('Workflows (VL-083)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let jobs: JobsService;
  let workflows: WorkflowsService;
  let storage: LocalStorageService;
  let mailbox: MemoryEmailProvider;

  beforeAll(async () => {
    process.env.JOBS_INLINE = '1';
    process.env.RESEND_API_KEY = 're_test_fixture';
    process.env.EMAIL_FROM = 'VerbaLab <noreply@example.com>';
    delete process.env.NOTIFICATIONS_DISABLED;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    jobs = app.get(JobsService);
    workflows = app.get(WorkflowsService);
    storage = app.get(LocalStorageService);
    mailbox = new MemoryEmailProvider();
    app.get(NotificationsService).setProviderForTests(mailbox);

    const gateway = app.get(GatewayService);
    gateway.setProviderForTests({
      name: 'fixture',
      async translate(input) {
        return {
          text: `[${input.target}] ${input.text}`,
          source: input.source === 'auto' ? 'en' : input.source,
          target: input.target,
          provider: 'fixture',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });
    gateway.setSttProviderForTests({
      name: 'fixture_stt',
      async transcribe() {
        return {
          text: 'Hello friend',
          language: 'en',
          durationSeconds: 2,
          provider: 'fixture_stt',
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs transcribe → translate → notify via POST /v1/jobs', async () => {
    const org = await seedOrg(prisma, `wf_pipe_${Date.now()}`);
    const workspaceId = org.workspaces[0].id;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId,
      name: 'wf',
      userId: org.memberships[0].userId,
    });

    const storageKey = `${org.id}/${randomUUID()}-clip.wav`;
    const buf = tinyWav();
    await storage.writeBuffer(storageKey, buf);
    const doc = await prisma.document.create({
      data: {
        organizationId: org.id,
        workspaceId,
        kind: 'source',
        filename: 'clip.wav',
        mimeType: 'audio/wav',
        sizeBytes: buf.length,
        storageKey,
      },
    });

    const before = mailbox.sent.length;
    const created = await request(app.getHttpServer())
      .post('/v1/jobs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        type: 'workflow',
        input: {
          name: 'demo',
          steps: [
            { id: 's1', op: 'transcribe', documentId: doc.id },
            {
              id: 's2',
              op: 'translate',
              source: 'auto',
              target: 'sw',
              text: '{{s1.text}}',
            },
            {
              id: 's3',
              op: 'notify',
              channel: 'email',
              message: 'Done: {{s2.text}}',
              subject: 'Workflow done',
            },
          ],
        },
      })
      .expect(201);

    const finished = await waitForJob(jobs, org.id, created.body.id);
    expect(finished.status).toBe('succeeded');
    const result = finished.result as {
      steps: Array<{ id: string; op: string; output: Record<string, unknown> }>;
    };
    expect(result.steps).toHaveLength(3);
    expect(result.steps[0].output.text).toBe('Hello friend');
    expect(result.steps[1].output.text).toBe('[sw] Hello friend');
    expect(result.steps[2].output.delivered).toBe(true);
    expect(mailbox.sent.length).toBeGreaterThan(before);
    expect(mailbox.sent.some((m) => String(m.text).includes('[sw] Hello friend'))).toBe(true);
  });

  it('saves a definition and runs it by workflowId', async () => {
    const org = await seedOrg(prisma, `wf_def_${Date.now()}`);
    const workspaceId = org.workspaces[0].id;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId,
      name: 'wf',
      userId: org.memberships[0].userId,
    });

    const def = await workflows.create({
      organizationId: org.id,
      workspaceId,
      name: 'Translate only',
      steps: [
        {
          id: 't1',
          op: 'translate',
          source: 'en',
          target: 'fr',
          text: 'Bonjour',
        },
      ],
    });

    const created = await request(app.getHttpServer())
      .post(`/v1/workflows/${def.id}/run`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(201);

    expect(created.body.type).toBe('workflow');
    const finished = await waitForJob(jobs, org.id, created.body.id);
    expect(finished.status).toBe('succeeded');
    const result = finished.result as {
      workflowId: string;
      steps: Array<{ output: Record<string, unknown> }>;
    };
    expect(result.workflowId).toBe(def.id);
    expect(result.steps[0].output.text).toBe('[fr] Bonjour');
  });

  it('rejects invalid workflow payloads', async () => {
    const org = await seedOrg(prisma, `wf_bad_${Date.now()}`);
    const workspaceId = org.workspaces[0].id;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId,
      name: 'wf',
      userId: org.memberships[0].userId,
    });

    await request(app.getHttpServer())
      .post('/v1/jobs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ type: 'workflow', input: { steps: [] } })
      .expect(400);

    await request(app.getHttpServer())
      .post('/v1/jobs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        type: 'workflow',
        input: { steps: [{ id: 'x', op: 'explode' }] },
      })
      .expect(400);
  });
});
