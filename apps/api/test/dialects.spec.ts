import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
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
              clerkUserId: `clerk_dial_${name}_${Date.now}_${Math.random}`,
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

describe('Dialect detection',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    const gateway = app.get(GatewayService);
    gateway.setDetectProviderForTests({
      name: 'fixture_detect',
      async detect {
        return { language: 'sw', confidence: 0.95, provider: 'fixture_detect' };
      },
    });
  });

  afterAll(async  => {
    await app.close;
  });

  it('GET /v1/dialects lists curated registry', async  => {
    const res = await request(app.getHttpServer).get('/v1/dialects').expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);
    expect(res.body.data.some((d: { code: string }) => d.code === 'sw-ke')).toBe(true);
  });

  it('GET /v1/dialects?language=sw filters', async  => {
    const res = await request(app.getHttpServer).get('/v1/dialects?language=sw').expect(200);
    expect(res.body.data.every((d: { languageCode: string }) => d.languageCode === 'sw')).toBe(true);
  });

  it('POST /v1/dialects/detect scores Kenyan Swahili cues', async  => {
    const org = await seedOrg(prisma, 'dial');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'dial-key',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/dialects/detect')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Sasa bro, uko aje? Poa sana.', language: 'sw' })
      .expect(200);

    expect(res.body.language).toBe('sw');
    expect(res.body.dialect).toBe('sw-ke');
    expect(res.body.provider).toBe('cues');
    expect(res.body.confidence).toBeGreaterThan(0.15);
  });

  it('POST /v1/dialects/detect auto-detects language when hint omitted', async  => {
    const org = await seedOrg(prisma, 'dialauto');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'dial-auto-key',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/dialects/detect')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Habari yako, asante sana' })
      .expect(200);

    expect(res.body.language).toBe('sw');
    expect(res.body.languageProvider).toBe('fixture_detect');
  });
});
