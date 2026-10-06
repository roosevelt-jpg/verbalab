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
import { NotificationsService } from '../src/notifications/notifications.service';
import { EmailProvider, SendEmailInput, SendEmailResult } from '../src/notifications/email-provider';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { AuditService } from '../src/audit/audit.service';

class MemoryEmailProvider implements EmailProvider {
  readonly name = 'memory';
  readonly sent: SendEmailInput[] = [];

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    this.sent.push(input);
    return { id: `mem_${this.sent.length}`, provider: this.name };
  }
}

async function seedOrg(prisma: PrismaService, name: string, quota = 50000) {
  return prisma.organization.create({
    data: {
      name,
      characterQuota: quota,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_notif_${name}_${Date.now()}_${Math.random()}`,
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
  const start = Date.now();
  while (Date.now() - start < 5000) {
    const job = await jobs.get(organizationId, jobId);
    if (job.status === 'succeeded' || job.status === 'failed') return job;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`Job ${jobId} timed out`);
}

describe('Notifications', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let jobs: JobsService;
  let notifications: NotificationsService;
  let audit: AuditService;
  let mailbox: MemoryEmailProvider;

  beforeAll(async () => {
    process.env.JOBS_INLINE = '1';
    process.env.RESEND_API_KEY = 're_test_fixture';
    process.env.EMAIL_FROM = 'Lugemi <noreply@example.com>';
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
    notifications = app.get(NotificationsService);
    audit = app.get(AuditService);

    mailbox = new MemoryEmailProvider();
    notifications.setProviderForTests(mailbox);

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

  it('emails owners when a job succeeds', async () => {
    mailbox.sent.length = 0;
    const org = await seedOrg(prisma, 'notifJob');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'notif-job-key',
    });

    const created = await request(app.getHttpServer())
      .post('/v1/jobs')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        type: 'batch_translate',
        input: { source: 'en', target: 'sw', items: [{ id: '1', text: 'Hello' }] },
      })
      .expect(201);

    await waitForJob(jobs, org.id, created.body.id);
    // fire-and-forget may lag one tick
    await new Promise((r) => setTimeout(r, 50));

    expect(mailbox.sent.some((m) => String(m.subject).includes('succeeded'))).toBe(true);
    expect(mailbox.sent.some((m) => String(m.to).includes('notifJob@example.com') || (Array.isArray(m.to) && m.to.includes('notifJob@example.com')))).toBe(true);
  });

  it('sends a one-time 80% usage threshold email', async () => {
    mailbox.sent.length = 0;
    const org = await seedOrg(prisma, 'notifQuota', 100);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'notif-quota-key',
    });

    // 80 chars → 80% of 100
    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'x'.repeat(80), source: 'en', target: 'sw' })
      .expect(200);

    await new Promise((r) => setTimeout(r, 50));

    const thresholdMails = mailbox.sent.filter((m) => String(m.subject).includes('80%'));
    expect(thresholdMails).toHaveLength(1);

    // second translate should not re-send 80%
    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'y'.repeat(5), source: 'en', target: 'sw' })
      .expect(200);

    await new Promise((r) => setTimeout(r, 50));
    expect(mailbox.sent.filter((m) => String(m.subject).includes('80%'))).toHaveLength(1);

    const events = await audit.listForOrg(org.id, 50);
    expect(events.some((e) => e.action === 'usage.threshold_80')).toBe(true);
  });

  it('sends member-added email on new membership', async () => {
    mailbox.sent.length = 0;
    const org = await seedOrg(prisma, 'notifMember');
    await notifications.notifyMemberAdded({
      organizationId: org.id,
      organizationName: org.name,
      email: 'newbie@example.com',
      role: 'member',
    });
    expect(mailbox.sent).toHaveLength(1);
    expect(mailbox.sent[0]!.to).toBe('newbie@example.com');
    expect(String(mailbox.sent[0]!.subject)).toContain('added');
    expect(String(mailbox.sent[0]!.html)).toContain('/brand/lugemi-email-logo.png');
    expect(String(mailbox.sent[0]!.html)).toContain('Lugemi');
  });
});
