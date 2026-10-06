import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      walkTsFiles(p, out);
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_lcaudit_${name}_${Date.now()}_${Math.random()}`,
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

describe('Language Cloud Production Audit', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rawKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    const org = await seedOrg(prisma, 'lca');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'lca-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships audit ADR and report pack', () => {
    expect(existsSync(join(root, 'docs/adr/0068-language-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/language-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/language-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/language-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/language-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/language-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(readFileSync(join(root, 'docs/language-cloud-audit/PRODUCTION_READINESS.md'), 'utf8')).toContain(
      'not comparable',
    );
  });

  it('has no TODO/FIXME/implement-later markers in Language Cloud source trees', () => {
    const roots = [
      join(apiSrc, 'language-cloud'),
      join(apiSrc, 'language-intelligence'),
      join(apiSrc, 'translate'),
      join(apiSrc, 'localize'),
      join(apiSrc, 'grammar'),
      join(apiSrc, 'style'),
      join(apiSrc, 'tm'),
      join(apiSrc, 'glossary'),
      join(apiSrc, 'dialects'),
      join(apiSrc, 'accents'),
      join(apiSrc, 'analytics'),
      join(apiSrc, 'registry'),
      join(apiSrc, 'country-packs'),
      join(apiSrc, 'quality'),
    ];
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const dir of roots) {
      if (!existsSync(dir)) continue;
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('exposes integrated Language Cloud catalogs', async () => {
    const paths = [
      '/v1/language/products',
      '/v1/translate/engine',
      '/v1/localization',
      '/v1/grammar/intelligence',
      '/v1/style/intelligence',
      '/v1/language-intelligence',
      '/v1/tm',
      '/v1/analytics',
      '/v1/registry',
    ];
    for (const path of paths) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }
  });

  it('rejects unauthenticated Language Analytics overview (security)', async () => {
    const overview = await request(app.getHttpServer()).get('/v1/analytics/overview');
    // 401 when auth configured; 503 when Clerk keys missing in local/CI (guard fails closed).
    expect([401, 403, 503]).toContain(overview.status);

    const search = await request(app.getHttpServer()).post('/v1/tm/search').send({ text: 'x' });
    expect([401, 403, 503]).toContain(search.status);
  });

  it('runs bounded sequential load smoke on public catalogs', async () => {
    const paths = [
      '/v1/language/products',
      '/v1/tm',
      '/v1/analytics',
      '/v1/grammar/intelligence',
      '/v1/style/intelligence',
      '/v1/language-intelligence',
    ];
    const started = Date.now();
    const iterations = 24;
    for (let i = 0; i < iterations; i++) {
      const path = paths[i % paths.length]!;
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.status).toBe(200);
    }
    const elapsed = Date.now() - started;
    // Honest smoke bound — not a k6 SLA certificate.
    expect(elapsed).toBeLessThan(30_000);
    expect(iterations).toBe(24);
  });

  it('GraphQL Language Cloud façade queries respond', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `{
          languageAnalytics { product shippedCount }
          tmIntelligence { product shippedCount }
          grammarIntelligence { product shippedCount }
          styleIntelligence { product shippedCount }
          languageIntelligence { product shippedCount }
        }`,
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.languageAnalytics.shippedCount).toBeGreaterThan(3);
    expect(res.body.data.tmIntelligence.shippedCount).toBeGreaterThan(3);
  });
});
