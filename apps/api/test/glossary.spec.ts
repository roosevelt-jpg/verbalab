import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { GlossaryService } from '../src/glossary/glossary.service';
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
              clerkUserId: `clerk_gloss_${name}_${Date.now()}_${Math.random()}`,
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

describe('Glossary', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let glossary: GlossaryService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    glossary = app.get(GlossaryService);

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

  it('creates terms and applies them on translate', async () => {
    const org = await seedOrg(prisma, 'gloss');
    const workspaceId = org.workspaces[0]!.id;

    await glossary.create({
      organizationId: org.id,
      workspaceId,
      sourceLang: 'en',
      targetLang: 'sw',
      sourceTerm: 'M-Pesa',
      targetTerm: 'M-Pesa',
      caseSensitive: false,
      wholeWord: true,
    });

    const listed = await glossary.list(org.id, workspaceId, { source: 'en', target: 'sw' });
    expect(listed).toHaveLength(1);

    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId,
      userId: org.memberships[0]!.userId,
      name: 'gloss-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Pay with M-Pesa today', source: 'en', target: 'sw' })
      .expect(200);

    expect(res.body.glossaryApplied).toBe(1);
    expect(res.body.text).toBe('[sw] Pay with M-Pesa today');
    expect(res.body.text).not.toContain('⟦VL');
  });

  it('rejects duplicate source terms for a pair', async () => {
    const org = await seedOrg(prisma, 'dup');
    await glossary.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      sourceLang: 'en',
      targetLang: 'yo',
      sourceTerm: 'Hello',
      targetTerm: 'Bawo',
    });
    await expect(
      glossary.create({
        organizationId: org.id,
        workspaceId: org.workspaces[0]!.id,
        sourceLang: 'en',
        targetLang: 'yo',
        sourceTerm: 'Hello',
        targetTerm: 'Pẹlẹ',
      }),
    ).rejects.toMatchObject({ code: 'conflict' });
  });
});
