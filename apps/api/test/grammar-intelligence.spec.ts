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
              clerkUserId: `clerk_gi_${name}_${Date.now}_${Math.random}`,
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

describe('Grammar Intelligence Phase 10',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rawKey: string;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    const org = await seedOrg(prisma, 'gi');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'gi-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async  => {
    await app.close;
  });

  it('ships ADR and docs',  => {
    expect(existsSync(join(root, 'docs/adr/0063-grammar-intelligence-phase-10.md'))).toBe(true);
    expect(readFileSync(join(root, 'docs/GRAMMAR.md'), 'utf8')).toContain('/suggest');
  });

  it('exposes intelligence catalog with partial medical/legal', async  => {
    const res = await request(app.getHttpServer).get('/v1/grammar/intelligence').expect(200);
    expect(res.body.product).toMatch(/Grammar/i);
    expect(
      res.body.capabilities.some((c: { id: string; status: string }) => c.id === 'spell_checking' && c.status === 'shipped'),
    ).toBe(true);
    expect(
      res.body.capabilities.some((c: { id: string; status: string }) => c.id === 'medical_writing' && c.status === 'partial'),
    ).toBe(true);
  });

  it('spell-checks curated misspellings', async  => {
    const res = await request(app.getHttpServer)
      .post('/v1/grammar/spell')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ text: 'teh writting is wierd' })
      .expect(200);
    expect(res.body.corrected.toLowerCase).toContain('the');
    expect(res.body.corrected.toLowerCase).toContain('writing');
    expect(res.body.issueCount).toBeGreaterThan(0);
  });

  it('corrects sentences via grammar pipeline', async  => {
    const res = await request(app.getHttpServer)
      .post('/v1/grammar/correct')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ text: 'i has teh book' })
      .expect(200);
    expect(res.body.corrected.toLowerCase).toContain('have');
    expect(res.body.changed).toBe(true);
  });

  it('suggests writing with style profile disclaimer for medical', async  => {
    const profiles = await request(app.getHttpServer).get('/v1/style/profiles').expect(200);
    expect(profiles.body.data.some((p: { id: string }) => p.id === 'medical')).toBe(true);

    const res = await request(app.getHttpServer)
      .post('/v1/grammar/suggest')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ text: 'teh patient gonna get a checkup', styleProfile: 'medical' })
      .expect(200);
    expect(res.body.styleProfile).toBe('medical');
    expect(res.body.styleDisclaimer).toMatch(/not clinical/i);
    expect(res.body.suggestionCount).toBeGreaterThan(0);
  });

  it('returns analytics for the org', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/grammar/analytics')
      .set('Authorization', `Bearer ${rawKey}`)
      .expect(200);
    expect(res.body.windowDays).toBe(30);
    expect(res.body.grammarChecks + res.body.spellChecks).toBeGreaterThan(0);
  });

  it('exposes GraphQL grammarIntelligence and suggestWriting', async  => {
    const catalog = await request(app.getHttpServer)
      .post('/graphql')
      .send({ query: '{ grammarIntelligence { product shippedCount } }' })
      .expect(200);
    expect(catalog.body.errors).toBeUndefined;
    expect(catalog.body.data.grammarIntelligence.shippedCount).toBeGreaterThan(3);

    const suggest = await request(app.getHttpServer)
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `mutation($input: SuggestWritingInput!) {
          suggestWriting(input: $input) { styleRewritten suggestionCount styleProfile }
        }`,
        variables: { input: { text: 'teh report', styleProfile: 'professional' } },
      })
      .expect(200);
    expect(suggest.body.errors).toBeUndefined;
    expect(suggest.body.data.suggestWriting.suggestionCount).toBeGreaterThan(0);
  });
});
