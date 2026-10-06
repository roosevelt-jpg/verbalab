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
              clerkUserId: `clerk_kcaudit_${name}_${Date.now()}_${Math.random()}`,
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

describe('Knowledge Cloud Production Audit (VL-203)', () => {
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
    const org = await seedOrg(prisma, 'kca');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'kca-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships audit ADR, blueprint ADR, and report pack', () => {
    expect(existsSync(join(root, 'docs/adr/0114-knowledge-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/knowledge-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/knowledge-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/knowledge-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/knowledge-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/knowledge-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    const readiness = readFileSync(
      join(root, 'docs/knowledge-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/not.*Confluence|Rejected/i);
    expect(readiness).toContain('bounded');
    expect(readiness).toMatch(/Inference Cloud/i);
  });

  it('has no TODO/FIXME/implement-later markers in Knowledge Cloud source trees', () => {
    const roots = [
      join(apiSrc, 'knowledge-cloud'),
      join(apiSrc, 'knowledge-base'),
      join(apiSrc, 'enterprise-search'),
      join(apiSrc, 'ontology-platform'),
      join(apiSrc, 'taxonomy-platform'),
      join(apiSrc, 'enterprise-rag'),
      join(apiSrc, 'knowledge-memory'),
      join(apiSrc, 'knowledge-intelligence'),
      join(apiSrc, 'knowledge-apis'),
      join(apiSrc, 'knowledge-analytics'),
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

  it('exposes integrated Knowledge Cloud catalogs', async () => {
    const paths = [
      '/v1/knowledge-cloud/products',
      '/v1/knowledge-base/engine',
      '/v1/enterprise-search/engine',
      '/v1/ontology/engine',
      '/v1/taxonomy/engine',
      '/v1/enterprise-rag/engine',
      '/v1/knowledge-memory/engine',
      '/v1/knowledge-intelligence/engine',
      '/v1/knowledge-apis/engine',
      '/v1/knowledge-analytics/engine',
    ];
    for (const path of paths) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }
  });

  it('rejects unauthenticated knowledge analytics and knowledge memory list (security)', async () => {
    const overview = await request(app.getHttpServer()).get('/v1/knowledge-analytics/overview');
    expect([401, 403, 503]).toContain(overview.status);

    const memories = await request(app.getHttpServer()).get('/v1/knowledge-memory/memories');
    expect([401, 403, 503]).toContain(memories.status);
  });

  it('runs bounded sequential load smoke on public knowledge catalogs', async () => {
    const paths = [
      '/v1/knowledge-cloud/products',
      '/v1/knowledge-base/engine',
      '/v1/enterprise-search/engine',
      '/v1/ontology/engine',
      '/v1/taxonomy/engine',
      '/v1/enterprise-rag/engine',
      '/v1/knowledge-memory/engine',
      '/v1/knowledge-intelligence/engine',
      '/v1/knowledge-apis/engine',
      '/v1/knowledge-analytics/engine',
    ];
    const started = Date.now();
    const iterations = 24;
    for (let i = 0; i < iterations; i++) {
      const path = paths[i % paths.length]!;
      await request(app.getHttpServer()).get(path).expect(200);
    }
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(30_000);
    expect(iterations).toBe(24);
  });

  it('runs bounded rapid stress smoke on knowledge products catalog', async () => {
    const started = Date.now();
    for (let i = 0; i < 12; i++) {
      await request(app.getHttpServer()).get('/v1/knowledge-cloud/products').expect(200);
    }
    expect(Date.now() - started).toBeLessThan(15_000);
  });

  it('GraphQL Knowledge Cloud façade queries respond with honesty flags', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `{
          knowledgeProducts { id status }
          knowledgeBaseEngine { product confluenceOs orgWorkspaceScoped }
          enterpriseSearchEngine { product elasticOs extendsVl062 }
          ontologyEngine { product owlOs extendsVl184 }
          taxonomyEngine { product enterpriseTaxonomyOs mlAutoClassification }
          enterpriseRagEngine { product langchainOs agenticRagOs extendsVl062 }
          knowledgeMemoryEngine { product mem0Os regeneratesMemoryCloud distinctFromMemoryCloud }
          knowledgeIntelligenceEngine { product biOs regeneratesIntelligenceAnalytics }
          knowledgeApisEngine { product grpcOs kafkaEventStreamingOs sdkGeneratorOs }
          knowledgeAnalytics { product regeneratesIntelligenceAnalytics biDashboardOs aggregatesOnly }
        }`,
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.knowledgeProducts.length).toBeGreaterThan(8);
    expect(res.body.data.knowledgeBaseEngine.confluenceOs).toBe(false);
    expect(res.body.data.enterpriseSearchEngine.elasticOs).toBe(false);
    expect(res.body.data.ontologyEngine.owlOs).toBe(false);
    expect(res.body.data.taxonomyEngine.enterpriseTaxonomyOs).toBe(false);
    expect(res.body.data.enterpriseRagEngine.langchainOs).toBe(false);
    expect(res.body.data.knowledgeMemoryEngine.mem0Os).toBe(false);
    expect(res.body.data.knowledgeIntelligenceEngine.biOs).toBe(false);
    expect(res.body.data.knowledgeApisEngine.grpcOs).toBe(false);
    expect(res.body.data.knowledgeAnalytics.biDashboardOs).toBe(false);
    expect(res.body.data.knowledgeAnalytics.aggregatesOnly).toBe(true);
  });

  it('documents 12-layer cloud blueprint with Knowledge Cloud closed', () => {
    const blueprint = readFileSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'), 'utf8');
    expect(blueprint).toContain('Cloud Foundation');
    expect(blueprint).toContain('Production Audit');
    expect(blueprint).toContain('Knowledge');
    expect(blueprint).toContain('VL-203');
    const living = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(living).toMatch(/VL-193\s*→\s*VL-203/);
  });
});
