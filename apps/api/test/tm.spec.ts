import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { TmService } from '../src/tm/tm.service';
import { BillingService } from '../src/billing/billing.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { hashTmSegment, normalizeTmSegment } from '../src/tm/tm-hash';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_tm_${name}_${Date.now}_${Math.random}`,
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

describe('Translation memory',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let tm: TmService;
  let billing: BillingService;
  let gatewayCalls: number;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    tm = app.get(TmService);
    billing = app.get(BillingService);
    gatewayCalls = 0;

    app.get(GatewayService).setProviderForTests({
      name: 'fixture',
      async translate(input) {
        gatewayCalls += 1;
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

  afterAll(async  => {
    await app.close;
  });

  it('normalizes whitespace for hashing',  => {
    expect(normalizeTmSegment(' Hello world \n')).toBe('Hello world');
    expect(hashTmSegment('Hello world')).toBe(hashTmSegment(' Hello world '));
  });

  it('bypasses vendor on exact TM hit and skips quota', async  => {
    const org = await seedOrg(prisma, 'tmhit');
    await billing.applyEntitlementForTests({
      organizationId: org.id,
      plan: 'free',
      characterQuota: 5,
    });

    await tm.upsertApproved({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      sourceLang: 'en',
      targetLang: 'sw',
      sourceText: 'Official greeting',
      targetText: 'Salamu rasmi',
    });

    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'tm-key',
    });

    const before = gatewayCalls;
    const res = await request(app.getHttpServer)
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Official greeting', source: 'en', target: 'sw' })
      .expect(200);

    expect(res.body).toMatchObject({
      text: 'Salamu rasmi',
      provider: 'tm',
      tmHit: true,
    });
    expect(gatewayCalls).toBe(before);

    // Long text would exceed quota of 5 if it went to MT
    const long = await request(app.getHttpServer)
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Official greeting', source: 'en', target: 'sw' })
      .expect(200);
    expect(long.body.tmHit).toBe(true);
  });

  it('calls vendor when no TM match', async  => {
    const org = await seedOrg(prisma, 'tmmiss');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'miss-key',
    });

    const before = gatewayCalls;
    const res = await request(app.getHttpServer)
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'No memory yet', source: 'en', target: 'yo' })
      .expect(200);

    expect(res.body.tmHit).toBe(false);
    expect(res.body.provider).toBe('fixture');
    expect(gatewayCalls).toBe(before + 1);
  });
});
