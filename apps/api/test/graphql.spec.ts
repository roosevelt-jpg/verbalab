import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
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
              clerkUserId: `clerk_gql_${name}_${Date.now()}_${Math.random()}`,
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

describe('GraphQL Language Cloud', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let prevOpenAi: string | undefined;

  beforeAll(async () => {
    prevOpenAi = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  });

  afterAll(async () => {
    if (prevOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevOpenAi;
    await app.close();
  });

  it('query languages and languageProducts', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('apollo-require-preflight', 'true')
      .send({
        query: `{
          languages { code nameEn }
          languageProducts { id status }
          countryPacks { code }
        }`,
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.languages.length).toBeGreaterThan(5);
    expect(res.body.data.languageProducts.some((p: { id: string }) => p.id === 'dialect')).toBe(
      true,
    );
    expect(res.body.data.countryPacks.some((p: { code: string }) => p.code === 'KE')).toBe(true);
  });

  it('mutation checkGrammar requires auth and works with API key', async () => {
    const org = await seedOrg(prisma, 'gql');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'gql-key',
    });

    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${key.secret}`)
      .set('apollo-require-preflight', 'true')
      .send({
        query: `mutation($input: CheckGrammarInput!) {
          checkGrammar(input: $input) {
            corrected
            changed
            provider
            issueCount
          }
        }`,
        variables: { input: { text: 'i has teh book', language: 'en' } },
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.checkGrammar.changed).toBe(true);
    expect(res.body.data.checkGrammar.provider).toBe('rules');
    expect(res.body.data.checkGrammar.corrected).toMatch(/I have/);
  });
});
