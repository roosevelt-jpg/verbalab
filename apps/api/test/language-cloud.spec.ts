import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { LanguageCloudService } from '../src/language-cloud/language-cloud.service';
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
              clerkUserId: `clerk_lang_${name}_${Date.now()}_${Math.random()}`,
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

describe('Language Cloud Foundation', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let languageCloud: LanguageCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    languageCloud = app.get(LanguageCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Language Cloud mapping (no dialect/grammar/GraphQL fake)', () => {
    const doc = join(root, 'docs/LANGUAGE_CLOUD.md');
    const adr = join(root, 'docs/adr/0051-language-cloud-foundation.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Dialect Detection');
    expect(text).toContain('GraphQL');
    expect(text).toContain('CQRS');
    expect(text).toContain('Terraform');
    expect(text).toContain('af-south-1');
    expect(text).not.toMatch(/unlimited dialects.*shipped/i);
  });

  it('exposes public product catalog', async () => {
    const res = await request(app.getHttpServer()).get('/v1/language/products').expect(200);
    expect(res.body.architecture.graphql).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.architecture.terraform).toBe(true);
    expect(res.body.architecture.kubernetes).toBe(true);
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');
    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining(['translate', 'detect', 'glossary', 'tm', 'dialect', 'grammar']),
    );
    const dialect = res.body.products.find((p: { id: string }) => p.id === 'dialect');
    expect(dialect.status).toBe('shipped');
    const accent = res.body.products.find((p: { id: string }) => p.id === 'accent');
    expect(accent.status).toBe('shipped');
    const grammar = res.body.products.find((p: { id: string }) => p.id === 'grammar');
    expect(grammar.status).toBe('shipped');
    const style = res.body.products.find((p: { id: string }) => p.id === 'style');
    expect(style.status).toBe('shipped');
    const countries = res.body.products.find((p: { id: string }) => p.id === 'country-packs');
    expect(countries.status).toBe('shipped');
    const translate = res.body.products.find((p: { id: string }) => p.id === 'translate');
    expect(translate.status).toBe('shipped');
  });

  it('returns org language overview with workspace counts', async () => {
    const org = await seedOrg(prisma, `lang_${Date.now()}`);
    await prisma.glossaryTerm.create({
      data: {
        organizationId: org.id,
        workspaceId: org.workspaces[0].id,
        sourceLang: 'en',
        targetLang: 'sw',
        sourceTerm: 'hello',
        targetTerm: 'habari',
      },
    });

    const overview = await languageCloud.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_lang',
      role: 'owner',
    });

    expect(overview.registry.languages).toBeGreaterThan(10);
    expect(overview.workspace.glossaryTerms).toBeGreaterThanOrEqual(1);
    expect(overview.deferred.dialectDetection).toBe(false);
    expect(overview.deferred.accentDetection).toBe(false);
    expect(overview.deferred.grammarAi).toBe(false);
    expect(overview.deferred.writingStyleAi).toBe(false);
    expect(overview.deferred.countryPacks).toBe(false);
    expect(overview.deferred.graphql).toBe(false);
    expect(overview.deferred.cqrs).toBe(false);
    expect(overview.deferred.terraform).toBe(false);
    expect(overview.deferred.kubernetes).toBe(false);
    expect(overview.links.translate).toBe('/translate');
    expect(overview.links.dialects).toBe('/dialects');
    expect(overview.links.accents).toBe('/accents');
    expect(overview.links.grammar).toBe('/grammar');
    expect(overview.links.style).toBe('/style');
    expect(overview.links.countries).toBe('/countries');
    expect(overview.links.graphql).toBe('/graphql');
  });
});
