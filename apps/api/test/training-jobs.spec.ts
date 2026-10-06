import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BillingService } from '../src/billing/billing.service';
import { FineTunesService } from '../src/finetunes/finetunes.service';
import { FixtureTrainingLauncher, ModalTrainingLauncher } from '../src/training/training-launchers';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { ApiException } from '../src/common/errors/api-exception';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_tj_${name}_${Date.now()}_${Math.random()}`,
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

describe('Training jobs (VL-111)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let finetunes: FineTunesService;
  const prevFixture = process.env.TRAINING_FIXTURE;

  beforeAll(async () => {
    process.env.TRAINING_FIXTURE = '1';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    billing = app.get(BillingService);
    finetunes = app.get(FineTunesService);
  });

  afterAll(async () => {
    process.env.TRAINING_FIXTURE = prevFixture;
    await app.close();
  });

  it('reports launcher configuration without inventing Modal readiness', () => {
    const status = finetunes.launcherStatus();
    expect(status.launchers.find((l) => l.name === 'manual')?.configured).toBe(true);
    expect(status.launchers.find((l) => l.name === 'fixture')?.configured).toBe(true);
    expect(status.callbackUrl).toContain('/v1/training-jobs/callback');
  });

  it('Modal launcher refuses when launch URL is missing', async () => {
    const modal = new ModalTrainingLauncher();
    await expect(
      modal.launch({
        jobId: 'j1',
        organizationId: 'o1',
        sourceLang: 'en',
        targetLang: 'sw',
        baseModel: 'nllb',
        trainingPackPath: '/tmp/x.jsonl',
        callbackUrl: 'http://localhost/cb',
        callbackToken: 'tok',
      }),
    ).rejects.toMatchObject({ code: 'provider_not_configured' } satisfies Partial<ApiException>);
  });

  it('fixture launch runs then callback completes and promotes', async () => {
    const org = await seedOrg(prisma, `tjfix_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: org.id, plan: 'pro' });
    finetunes.setLauncherForTests(new FixtureTrainingLauncher());

    const created = await finetunes.createJob({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      sourceLang: 'en',
      targetLang: 'yo',
      launcher: 'fixture',
    });

    const launched = await finetunes.launchJob({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      jobId: created.id,
    });
    expect(launched.status).toBe('running');
    expect(launched.externalJobId).toMatch(/^fixture:/);
    expect(launched.callbackToken).toBeTruthy();

    const res = await request(app.getHttpServer())
      .post('/v1/training-jobs/callback')
      .set('X-VerbaLab-Training-Token', launched.callbackToken as string)
      .send({
        jobId: created.id,
        status: 'succeeded',
        artifactKind: 'phrase_map',
        useGoldenPhraseMap: true,
        promote: true,
      });

    expect(res.status).toBeLessThan(300);
    const job = await prisma.fineTuneJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(job.status).toBe('succeeded');
    expect(job.finishedAt).toBeTruthy();

    const model = await prisma.modelRegistryEntry.findFirst({
      where: { fineTuneJobId: created.id, status: 'ready' },
    });
    expect(model?.kind).toBe('finetune');
    expect(model?.sourceLang).toBe('en');
    expect(model?.targetLang).toBe('yo');

    await finetunes.retireModel({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      modelId: model!.id,
    });

    finetunes.setLauncherForTests(null);
  });

  it('rejects bad callback tokens', async () => {
    await request(app.getHttpServer())
      .post('/v1/training-jobs/callback')
      .send({
        jobId: 'missing',
        callbackToken: 'nope',
        status: 'succeeded',
      })
      .expect(401);
  });
});
