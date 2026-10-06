import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync } from 'fs';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BillingService } from '../src/billing/billing.service';
import { FineTunesService } from '../src/finetunes/finetunes.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { EvalService } from '../src/eval/eval.service';
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
              clerkUserId: `clerk_ft_${name}_${Date.now}_${Math.random}`,
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

describe('Fine-tunes',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let finetunes: FineTunesService;
  let gateway: GatewayService;
  let evalService: EvalService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    billing = app.get(BillingService);
    finetunes = app.get(FineTunesService);
    gateway = app.get(GatewayService);
    evalService = app.get(EvalService);

    gateway.setProviderForTests({
      name: 'fixture',
      async translate(input) {
        return {
          text: `FIXTURE:${input.text}`,
          source: input.source,
          target: input.target,
          provider: 'fixture',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });

    await evalService.runAll('fixture');
    gateway.allowFineTuneRoutingForTests;
  });

  afterAll(async  => {
    await app.close;
  });

  it('lists failed-pair candidates from coverage thresholds',  => {
    const result = finetunes.listCandidates;
    expect(result.candidates.length).toBeGreaterThanOrEqual(1);
    expect(result.candidates.some((c) => c.pairKey === 'en-sw')).toBe(true);
    expect(result.thresholds.exactMatchRateMax).toBe(0.5);
  });

  it('rejects free-plan job creation', async  => {
    const org = await seedOrg(prisma, `ftfree_${Date.now}`);
    await expect(
      finetunes.createJob({
        organizationId: org.id,
        userId: org.memberships[0].userId,
        role: 'owner',
        sourceLang: 'en',
        targetLang: 'sw',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });

  it('creates a job, exports pack, completes with phrase map, and routes translate', async  => {
    const org = await seedOrg(prisma, `ftpro_${Date.now}`);
    await billing.applyEntitlementForTests({ organizationId: org.id, plan: 'pro' });

    const created = await finetunes.createJob({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      sourceLang: 'en',
      targetLang: 'sw',
      launcher: 'manual',
    });
    expect(created.status).toBe('queued');
    expect(existsSync(created.trainingPack!.jsonlPath)).toBe(true);
    expect(existsSync(created.trainingPack!.phraseMapPath)).toBe(true);

    const launched = await finetunes.launchJob({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      jobId: created.id,
    });
    expect(launched.status).toBe('awaiting_gpu');
    expect(launched.externalJobId).toMatch(/^manual:/);

    const completed = await finetunes.completeJob({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      jobId: created.id,
      artifactKind: 'phrase_map',
      useGoldenPhraseMap: true,
      promote: true,
    });
    expect(completed.job.status).toBe('succeeded');
    expect(completed.model?.status).toBe('ready');

    const hit = await gateway.translate({
      text: 'Hello',
      source: 'en',
      target: 'sw',
    });
    expect(hit.provider).toBe('finetune');
    expect(hit.text).toBe('Habari');

    const miss = await gateway.translate({
      text: 'Something unknown',
      source: 'en',
      target: 'sw',
    });
    expect(miss.provider).toBe('fixture');
    expect(miss.text).toContain('FIXTURE:');

    await finetunes.retireModel({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      modelId: completed.model!.id,
    });

    const afterRetire = await gateway.translate({
      text: 'Hello',
      source: 'en',
      target: 'sw',
    });
    expect(afterRetire.provider).toBe('fixture');
  });
});
