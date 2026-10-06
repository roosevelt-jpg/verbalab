import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');
const webApp = join(root, 'apps/web/app');

const VOLUME13_DIRS = [
  'research-cloud',
  'experiment-platform',
  'synthetic-data-platform',
  'benchmark-platform',
  'evaluation-platform',
  'ai-publication-platform',
  'patent-innovation-platform',
  'open-science-platform',
  'research-analytics',
];

const ENGINE_PATHS = [
  '/v1/research-cloud/products',
  '/v1/research-cloud/monitoring',
  '/v1/experiment-platform/engine',
  '/v1/synthetic-data-platform/engine',
  '/v1/benchmark-platform/engine',
  '/v1/evaluation-platform/engine',
  '/v1/ai-publication-platform/engine',
  '/v1/patent-innovation-platform/engine',
  '/v1/open-science-platform/engine',
  '/v1/research-analytics/engine',
];

const SHIPPED_PRODUCT_IDS = [
  'research-cloud',
  'experiment-platform',
  'synthetic-data-platform',
  'benchmark-platform',
  'evaluation-platform',
  'ai-publication-platform',
  'patent-innovation-platform',
  'open-science-platform',
  'research-analytics',
];

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      walkTsFiles(p, out);
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    } else if (name.name.endsWith('.tsx')) {
      out.push(p);
    }
  }
  return out;
}

describe('Research Cloud Production Audit (VL-280)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships audit ADR and report pack', () => {
    expect(existsSync(join(root, 'docs/adr/0182-research-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/RESEARCH_CLOUD.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/research-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/research-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/research-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/research-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/research-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/research-cloud-audit/RESEARCH_CLOUD_READINESS_REPORT.md')),
    ).toBe(true);

    const readiness = readFileSync(
      join(root, 'docs/research-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/syntheticLabelRequired|isSynthetic/i);
    expect(readiness).toMatch(/traditionalKnowledgeConsentRequired|consent/i);
    expect(readiness).toMatch(/AI Sovereignty|Rejected/i);
    expect(readiness).toMatch(/VL-271|Volume 13/i);

    const adr = readFileSync(
      join(root, 'docs/adr/0182-research-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/review gate|checklist/i);
    expect(adr).toMatch(/AI Sovereignty|do not invent|Rejected/i);
    expect(adr).toMatch(/Volume 13 closed|VL-271–280|closes/i);
  });

  it('has no TODO/FIXME/implement-later markers in Volume 13 source trees', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const name of VOLUME13_DIRS) {
      const dir = join(apiSrc, name);
      if (!existsSync(dir)) {
        hits.push(`missing:${name}`);
        continue;
      }
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
      const webDir = join(webApp, name);
      if (existsSync(webDir)) {
        for (const file of walkTsFiles(webDir)) {
          const text = readFileSync(file, 'utf8');
          if (banned.test(text)) hits.push(file.replace(root, ''));
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('exposes all Volume 13 catalogs as shipped with monitoring', async () => {
    for (const path of ENGINE_PATHS) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }

    const hub = await request(app.getHttpServer()).get('/v1/research-cloud/products').expect(200);
    expect(hub.body.honesty.weightsAndBiasesOs).toBe(false);
    expect(hub.body.honesty.mlflowOs).toBe(false);
    expect(hub.body.honesty.huggingFaceHubOs).toBe(false);
    expect(hub.body.honesty.doiRegistryOs).toBe(false);
    expect(hub.body.honesty.usptoOs).toBe(false);
    expect(hub.body.honesty.aiSovereigntyOs).toBe(false);
    expect(hub.body.honesty.syntheticLabelRequired).toBe(true);
    expect(hub.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);
    expect(hub.body.honesty.regeneratesVolumes1to12).toBe(false);

    const byId = Object.fromEntries(
      hub.body.products.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    for (const id of SHIPPED_PRODUCT_IDS) {
      expect(byId[id]).toBe('shipped');
    }
  });

  it('keeps synthetic labeling and open-science consent gates', async () => {
    const synthetic = await request(app.getHttpServer())
      .get('/v1/synthetic-data-platform/engine')
      .expect(200);
    expect(synthetic.body.honesty.syntheticLabelRequired).toBe(true);
    expect(synthetic.body.artifacts.every((a: { isSynthetic: boolean }) => a.isSynthetic)).toBe(
      true,
    );

    const openSci = await request(app.getHttpServer())
      .get('/v1/open-science-platform/engine')
      .expect(200);
    expect(openSci.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);

    const blocked = await request(app.getHttpServer())
      .get('/v1/open-science-platform/check')
      .query({ id: 'os-dataset-restricted' })
      .expect(200);
    expect(blocked.body.allowed).toBe(false);

    const unverified = await request(app.getHttpServer())
      .get('/v1/open-science-platform/check')
      .query({ id: 'os-dataset-unverified' })
      .expect(200);
    expect(unverified.body.allowed).toBe(false);

    const pubs = await request(app.getHttpServer())
      .get('/v1/ai-publication-platform/engine')
      .expect(200);
    expect(pubs.body.honesty.doiRegistryOs).toBe(false);

    const patents = await request(app.getHttpServer())
      .get('/v1/patent-innovation-platform/engine')
      .expect(200);
    expect(patents.body.honesty.usptoOs).toBe(false);

    const benches = await request(app.getHttpServer())
      .get('/v1/benchmark-platform/engine')
      .expect(200);
    expect(benches.body.honesty.publicLeaderboardOs).toBe(false);
  });

  it('rejects unauthenticated Research Cloud overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/research-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  });

  it('exposes GraphQL façades for Research Cloud hubs', async () => {
    const started = Date.now();
    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          researchCloudProducts { id status }
          experimentPlatformEngine { product weightsAndBiasesOs }
          syntheticDataPlatformEngine { product syntheticLabelRequired }
          benchmarkPlatformEngine { product publicLeaderboardOs }
          evaluationPlatformEngine { product regeneratesModelEvaluationPlatform }
          aiPublicationPlatformEngine { product doiRegistryOs }
          patentInnovationPlatformEngine { product usptoOs }
          openSciencePlatformEngine { product traditionalKnowledgeConsentRequired }
          researchAnalyticsEngine { product aiSovereigntyOs }
        }`,
      })
      .expect(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.researchCloudProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.experimentPlatformEngine.weightsAndBiasesOs).toBe(false);
    expect(gql.body.data.syntheticDataPlatformEngine.syntheticLabelRequired).toBe(true);
    expect(gql.body.data.benchmarkPlatformEngine.publicLeaderboardOs).toBe(false);
    expect(gql.body.data.evaluationPlatformEngine.regeneratesModelEvaluationPlatform).toBe(false);
    expect(gql.body.data.aiPublicationPlatformEngine.doiRegistryOs).toBe(false);
    expect(gql.body.data.patentInnovationPlatformEngine.usptoOs).toBe(false);
    expect(gql.body.data.openSciencePlatformEngine.traditionalKnowledgeConsentRequired).toBe(true);
    expect(gql.body.data.researchAnalyticsEngine.aiSovereigntyOs).toBe(false);
  });
});
