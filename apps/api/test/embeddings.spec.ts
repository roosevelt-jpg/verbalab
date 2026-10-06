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
              clerkUserId: `clerk_emb_${name}_${Date.now()}_${Math.random()}`,
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

describe('Embeddings API (VL-063)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    app.get(GatewayService).setEmbeddingProviderForTests({
      name: 'fixture_embeddings',
      async embed(input) {
        const texts = Array.isArray(input.input) ? input.input : [input.input];
        return {
          data: texts.map((text, index) => ({
            index,
            embedding: [text.length, index, 0.5],
          })),
          model: input.model ?? 'fixture-embed',
          provider: 'fixture_embeddings',
          promptTokens: texts.length * 3,
          totalTokens: texts.length * 3,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('embeds a single string and meters tokens', async () => {
    const org = await seedOrg(prisma, 'emb');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'emb-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/embeddings')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ input: 'Habari' })
      .expect(200);

    expect(res.body.object).toBe('list');
    expect(res.body.provider).toBe('fixture_embeddings');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].embedding).toEqual([6, 0, 0.5]);
    expect(res.body.usage.total_tokens).toBe(3);

    const events = await prisma.usageEvent.findMany({
      where: { organizationId: org.id, feature: 'embeddings' },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.units).toBe(3);
  });

  it('embeds a batch of strings', async () => {
    const org = await seedOrg(prisma, 'embbatch');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'batch-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/embeddings')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ input: ['one', 'two'] })
      .expect(200);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[1].index).toBe(1);
  });

  it('rejects empty input', async () => {
    const org = await seedOrg(prisma, 'embbad');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'bad-key',
    });

    await request(app.getHttpServer())
      .post('/v1/embeddings')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ input: '   ' })
      .expect(400);
  });
});
