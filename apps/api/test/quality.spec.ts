import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { QualityService } from '../src/quality/quality.service';
import { TmService } from '../src/tm/tm.service';
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
              clerkUserId: `clerk_qe_${name}_${Date.now()}_${Math.random()}`,
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

describe('Quality reviews (VL-052)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let quality: QualityService;
  let tm: TmService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    quality = app.get(QualityService);
    tm = app.get(TmService);

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

  it('returns quality fields on translate and accepts into TM', async () => {
    const org = await seedOrg(prisma, 'qe');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'qe-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Good morning', source: 'en', target: 'sw' })
      .expect(200);

    expect(res.body.reviewId).toBeTruthy();
    expect(typeof res.body.qualityScore).toBe('number');
    expect(typeof res.body.needsReview).toBe('boolean');

    const accepted = await quality.accept({
      organizationId: org.id,
      reviewId: res.body.reviewId,
      userId: org.memberships[0]!.userId,
      addToTm: true,
    });
    expect(accepted.status).toBe('accepted');
    expect(accepted.tmEntryId).toBeTruthy();

    const listed = await tm.list(org.id, org.workspaces[0]!.id, { source: 'en', target: 'sw' });
    expect(listed.some((e) => e.sourceText === 'Good morning')).toBe(true);

    const hit = await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Good morning', source: 'en', target: 'sw' })
      .expect(200);
    expect(hit.body.tmHit).toBe(true);
    expect(hit.body.qualityScore).toBeGreaterThanOrEqual(95);
  });

  it('rejects a pending review', async () => {
    const org = await seedOrg(prisma, 'qerej');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'rej-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Reject me', source: 'en', target: 'yo' })
      .expect(200);

    const rejected = await quality.reject({
      organizationId: org.id,
      reviewId: res.body.reviewId,
      userId: org.memberships[0]!.userId,
      note: 'bad',
    });
    expect(rejected.status).toBe('rejected');
  });
});
