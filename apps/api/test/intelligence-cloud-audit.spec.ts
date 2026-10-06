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
              clerkUserId: `clerk_icaudit_${name}_${Date.now()}_${Math.random()}`,
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

describe('Intelligence Cloud Production Audit', () => {
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
    const org = await seedOrg(prisma, 'ica');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ica-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships audit ADR, blueprint ADR, and report pack', () => {
    expect(existsSync(join(root, 'docs/adr/0103-intelligence-cloud-production-audit.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/intelligence-cloud-audit/PRODUCTION_READINESS.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/intelligence-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/intelligence-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/intelligence-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/intelligence-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    const readiness = readFileSync(
      join(root, 'docs/intelligence-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/not.*custom AI kernel|Rejected/i);
    expect(readiness).toContain('bounded');
    expect(readiness).toMatch(/Intelligence Graph/i);
  });

  it('has no TODO/FIXME/implement-later markers in Intelligence Cloud source trees', () => {
    const roots = [
      join(apiSrc, 'intelligence-cloud'),
      join(apiSrc, 'embedding-cloud'),
      join(apiSrc, 'vector-cloud'),
      join(apiSrc, 'memory-cloud'),
      join(apiSrc, 'knowledge-graph'),
      join(apiSrc, 'context-engine'),
      join(apiSrc, 'reasoning-cloud'),
      join(apiSrc, 'recommendation-engine'),
      join(apiSrc, 'prompt-intelligence'),
      join(apiSrc, 'decision-engine'),
      join(apiSrc, 'ai-orchestration'),
      join(apiSrc, 'intelligence-analytics'),
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

  it('exposes integrated Intelligence Cloud catalogs', async () => {
    const paths = [
      '/v1/intelligence-cloud/products',
      '/v1/embedding-cloud/engine',
      '/v1/vector-cloud/engine',
      '/v1/memory-cloud/engine',
      '/v1/knowledge-graph/engine',
      '/v1/context-engine/engine',
      '/v1/reasoning-cloud/engine',
      '/v1/recommendation-engine/engine',
      '/v1/prompt-intelligence/engine',
      '/v1/decision-engine/engine',
      '/v1/ai-orchestration/engine',
      '/v1/intelligence-analytics/engine',
    ];
    for (const path of paths) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }
  });

  it('rejects unauthenticated intelligence analytics and memory list (security)', async () => {
    const overview = await request(app.getHttpServer()).get(
      '/v1/intelligence-analytics/overview',
    );
    expect([401, 403, 503]).toContain(overview.status);

    const memories = await request(app.getHttpServer()).get('/v1/memory-cloud/memories');
    expect([401, 403, 503]).toContain(memories.status);
  });

  it('runs bounded sequential load smoke on public intelligence catalogs', async () => {
    const paths = [
      '/v1/intelligence-cloud/products',
      '/v1/embedding-cloud/engine',
      '/v1/vector-cloud/engine',
      '/v1/memory-cloud/engine',
      '/v1/reasoning-cloud/engine',
      '/v1/decision-engine/engine',
      '/v1/ai-orchestration/engine',
      '/v1/intelligence-analytics/engine',
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

  it('runs bounded rapid stress smoke on intelligence products catalog', async () => {
    const started = Date.now();
    for (let i = 0; i < 12; i++) {
      await request(app.getHttpServer()).get('/v1/intelligence-cloud/products').expect(200);
    }
    expect(Date.now() - started).toBeLessThan(15_000);
  });

  it('GraphQL Intelligence Cloud façade queries respond with honesty flags', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `{
          intelligenceProducts { id status }
          embeddingCloudEngine { product multimodalOs }
          vectorCloudEngine { product managedVectorDbOs }
          memoryCloudEngine { product infinitePersonalizationOs }
          knowledgeGraphEngine { product neo4jParity preferRag }
          contextEngine { product infiniteContextWindow }
          reasoningCloudEngine { product customReasonerKernel }
          recommendationEngine { product retailRecommenderOs lightRankers }
          promptIntelligence { product autoPromptResearchLab }
          decisionEngine { product enterpriseBrms lightRules }
          aiOrchestration { product multiCloudAgentOs loadBearingE2e }
          intelligenceAnalytics { product regeneratesSpeechAnalytics aggregatesOnly }
        }`,
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.intelligenceProducts.length).toBeGreaterThan(8);
    expect(res.body.data.reasoningCloudEngine.customReasonerKernel).toBe(false);
    expect(res.body.data.recommendationEngine.retailRecommenderOs).toBe(false);
    expect(res.body.data.decisionEngine.enterpriseBrms).toBe(false);
    expect(res.body.data.aiOrchestration.multiCloudAgentOs).toBe(false);
    expect(res.body.data.intelligenceAnalytics.regeneratesSpeechAnalytics).toBe(false);
    expect(res.body.data.knowledgeGraphEngine.preferRag).toBe(true);
  });

  it('documents 12-layer cloud blueprint with Intelligence Cloud closed', () => {
    const blueprint = readFileSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'), 'utf8');
    expect(blueprint).toContain('Cloud Foundation');
    expect(blueprint).toContain('Production Audit');
    expect(blueprint).toContain('Intelligence');
    expect(blueprint).toContain('');
    const living = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(living).toMatch(/\s*→\s*);
  });
});
