import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { TmService } from '../src/tm/tm.service';
import { lexicalSimilarity } from '../src/tm/tm-similarity';

const root = join(__dirname, '../../..');

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_etm_${name}_${Date.now}_${Math.random}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: [
          { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
          { name: 'Other', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
        ],
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Enterprise Translation Memory Phase 13',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let tm: TmService;
  let rawKey: string;
  let orgId: string;
  let wsA: string;
  let wsB: string;
  let userId: string;

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

    const org = await seedOrg(prisma, 'etm');
    orgId = org.id;
    wsA = org.workspaces[0]!.id;
    wsB = org.workspaces[1]!.id;
    userId = org.memberships[0]!.userId;
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: wsA,
      userId,
      name: 'etm-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async  => {
    await app.close;
  });

  it('ships ADR and docs',  => {
    expect(existsSync(join(root, 'docs/adr/0066-enterprise-translation-memory-phase-13.md'))).toBe(true);
    expect(readFileSync(join(root, 'docs/TM.md'), 'utf8')).toContain('/search');
  });

  it('scores lexical similarity',  => {
    expect(lexicalSimilarity('Official greeting', 'Official greetings')).toBeGreaterThan(0.7);
    expect(lexicalSimilarity('Hello', 'Completely different text')).toBeLessThan(0.4);
  });

  it('exposes catalog with partial vector and shipped similarity', async  => {
    const res = await request(app.getHttpServer).get('/v1/tm').expect(200);
    expect(res.body.product).toMatch(/Translation Memory/i);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'similarity_search' && c.status === 'shipped',
      ),
    ).toBe(true);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'vector_search' && c.status === 'partial',
      ),
    ).toBe(true);
  });

  it('versions on update and supports enterprise exact fallback', async  => {
    const first = await tm.upsertApproved({
      organizationId: orgId,
      workspaceId: wsA,
      userId,
      sourceLang: 'en',
      targetLang: 'sw',
      sourceText: 'Enterprise shared greeting',
      targetText: 'Salamu ya biashara',
      scope: 'enterprise',
    });
    expect(first.version).toBe(1);
    expect(first.scope).toBe('enterprise');

    const second = await tm.upsertApproved({
      organizationId: orgId,
      workspaceId: wsA,
      userId,
      sourceLang: 'en',
      targetLang: 'sw',
      sourceText: 'Enterprise shared greeting',
      targetText: 'Salamu ya kampuni',
      scope: 'enterprise',
    });
    expect(second.version).toBe(2);

    const versions = await tm.versions(orgId, first.id);
    expect(versions.versions.length).toBeGreaterThanOrEqual(1);
    expect(versions.versions[0]!.targetText).toBe('Salamu ya biashara');

    const hit = await tm.lookupExact({
      organizationId: orgId,
      workspaceId: wsB,
      sourceLang: 'en',
      targetLang: 'sw',
      sourceText: 'Enterprise shared greeting',
    });
    expect(hit?.targetText).toBe('Salamu ya kampuni');
    expect(hit?.scope).toBe('enterprise');
  });

  it('searches similar segments via API', async  => {
    await tm.upsertApproved({
      organizationId: orgId,
      workspaceId: wsA,
      userId,
      sourceLang: 'en',
      targetLang: 'sw',
      sourceText: 'Please submit the application form today',
      targetText: 'Tafadhali wasilisha fomu ya maombi leo',
      scope: 'workspace',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/tm/search')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        text: 'Please submit the application form',
        sourceLang: 'en',
        targetLang: 'sw',
        mode: 'lexical',
        minScore: 0.3,
      })
      .expect(200);
    expect(res.body.resultCount).toBeGreaterThan(0);
    expect(res.body.results[0].sourceText).toMatch(/application form/i);
  });

  it('returns analytics and GraphQL tmIntelligence/searchTm', async  => {
    const analytics = await request(app.getHttpServer)
      .get('/v1/tm/analytics')
      .set('Authorization', `Bearer ${rawKey}`)
      .expect(200);
    expect(analytics.body.entries).toBeGreaterThan(0);

    const catalog = await request(app.getHttpServer)
      .post('/graphql')
      .send({ query: '{ tmIntelligence { product shippedCount } }' })
      .expect(200);
    expect(catalog.body.errors).toBeUndefined;
    expect(catalog.body.data.tmIntelligence.shippedCount).toBeGreaterThan(4);

    const search = await request(app.getHttpServer)
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `mutation($input: SearchTmInput!) {
          searchTm(input: $input) { resultCount provider }
        }`,
        variables: {
          input: {
            text: 'Please submit the application',
            sourceLang: 'en',
            targetLang: 'sw',
            mode: 'lexical',
          },
        },
      })
      .expect(200);
    expect(search.body.errors).toBeUndefined;
    expect(search.body.data.searchTm.resultCount).toBeGreaterThan(0);
  });
});
