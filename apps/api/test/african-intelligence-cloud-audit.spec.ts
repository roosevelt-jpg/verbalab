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

const VOLUME12_DIRS = [
  'african-intelligence-cloud',
  'african-language-registry',
  'cultural-intelligence',
  'african-knowledge-graph',
  'government-intelligence',
  'healthcare-intelligence',
  'financial-intelligence',
  'education-intelligence',
  'agricultural-intelligence',
  'tourism-heritage-intelligence',
];

const ENGINE_PATHS = [
  '/v1/african-intelligence-cloud/products',
  '/v1/african-intelligence-cloud/monitoring',
  '/v1/african-language-registry/engine',
  '/v1/african-language-registry/monitoring',
  '/v1/cultural-intelligence/engine',
  '/v1/cultural-intelligence/monitoring',
  '/v1/african-knowledge-graph/engine',
  '/v1/african-knowledge-graph/monitoring',
  '/v1/government-intelligence/engine',
  '/v1/healthcare-intelligence/engine',
  '/v1/financial-intelligence/engine',
  '/v1/education-intelligence/engine',
  '/v1/agricultural-intelligence/engine',
  '/v1/tourism-heritage-intelligence/engine',
];

const SHIPPED_PRODUCT_IDS = [
  'african-intelligence-cloud',
  'african-language-registry',
  'cultural-intelligence',
  'african-knowledge-graph',
  'government-intelligence',
  'healthcare-intelligence',
  'financial-intelligence',
  'education-intelligence',
  'agricultural-intelligence',
  'tourism-heritage-intelligence',
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

describe('African Intelligence Cloud Production Audit', () => {
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
    expect(
      existsSync(join(root, 'docs/adr/0172-african-intelligence-cloud-production-audit.md')),
    ).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/AFRICAN_INTELLIGENCE_CLOUD.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/african-intelligence-cloud-audit/PRODUCTION_READINESS.md')),
    ).toBe(true);
    expect(
      existsSync(join(root, 'docs/african-intelligence-cloud-audit/ARCHITECTURE_REPORT.md')),
    ).toBe(true);
    expect(
      existsSync(join(root, 'docs/african-intelligence-cloud-audit/PERFORMANCE_REPORT.md')),
    ).toBe(true);
    expect(
      existsSync(join(root, 'docs/african-intelligence-cloud-audit/COVERAGE_REPORT.md')),
    ).toBe(true);
    expect(
      existsSync(join(root, 'docs/african-intelligence-cloud-audit/DEPLOYMENT_GUIDE.md')),
    ).toBe(true);
    expect(
      existsSync(
        join(
          root,
          'docs/african-intelligence-cloud-audit/AFRICAN_INTELLIGENCE_CLOUD_READINESS_REPORT.md',
        ),
      ),
    ).toBe(true);

    const readiness = readFileSync(
      join(root, 'docs/african-intelligence-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/traditionalKnowledgeConsentRequired|consent/i);
    expect(readiness).toMatch(/notMedicalAdvice|consult/i);
    expect(readiness).toMatch(/Global Intelligence|Rejected/i);
    expect(readiness).toMatch(/Volume 12/i);

    const adr = readFileSync(
      join(root, 'docs/adr/0172-african-intelligence-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/review gate|checklist/i);
    expect(adr).toMatch(/Global Intelligence|do not invent|Rejected/i);
    expect(adr).toMatch(/Volume 12 closed|–270|closes/i);
  });

  it('has no TODO/FIXME/implement-later markers in Volume 12 source trees', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const name of VOLUME12_DIRS) {
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

  it('exposes all Volume 12 catalogs as shipped with monitoring', async () => {
    for (const path of ENGINE_PATHS) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }

    const hub = await request(app.getHttpServer())
      .get('/v1/african-intelligence-cloud/products')
      .expect(200);
    expect(hub.body.honesty.neo4jOs).toBe(false);
    expect(hub.body.honesty.digitalTwinOs).toBe(false);
    expect(hub.body.honesty.globalIntelligenceOs).toBe(false);
    expect(hub.body.honesty.worldsLargestScrapeOs).toBe(false);
    expect(hub.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);
    expect(hub.body.honesty.regeneratesPriorLayers).toBe(false);
    expect(hub.body.honesty.notMedicalAdvice).toBe(true);
    expect(hub.body.honesty.notInvestmentAdvice).toBe(true);
    expect(hub.body.honesty.officialGuidanceMustBeSourced).toBe(true);

    const byId = Object.fromEntries(
      hub.body.products.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    for (const id of SHIPPED_PRODUCT_IDS) {
      expect(byId[id]).toBe('shipped');
    }
  });

  it('keeps cultural/graph/domain honesty flags', async () => {
    const cultural = await request(app.getHttpServer())
      .get('/v1/cultural-intelligence/engine')
      .expect(200);
    expect(cultural.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);
    expect(cultural.body.honesty.extractiveTraditionalKnowledgeScrape).toBe(false);
    expect(cultural.body.entries.every((e: { provenance: string; sourceCommunity: string; consentStatus: string }) =>
      e.provenance && e.sourceCommunity && e.consentStatus,
    )).toBe(true);

    const graph = await request(app.getHttpServer())
      .get('/v1/african-knowledge-graph/engine')
      .expect(200);
    expect(graph.body.honesty.neo4jOs).toBe(false);
    const nodes = await request(app.getHttpServer())
      .get('/v1/african-knowledge-graph/nodes')
      .expect(200);
    expect(nodes.body.neo4jOs).toBe(false);
    expect(nodes.body.count).toBeGreaterThan(5);

    const lang = await request(app.getHttpServer())
      .get('/v1/african-language-registry/engine')
      .expect(200);
    expect(lang.body.honesty.coverageComplete).toBe(true);

    const health = await request(app.getHttpServer())
      .get('/v1/healthcare-intelligence/engine')
      .expect(200);
    expect(health.body.honesty.notMedicalAdvice).toBe(true);
    expect(health.body.safety.notMedicalAdvice).toBe(true);
    expect(String(health.body.safety.note)).toMatch(/consult|not diagnosis|professional/i);

    const finance = await request(app.getHttpServer())
      .get('/v1/financial-intelligence/engine')
      .expect(200);
    expect(finance.body.honesty.notInvestmentAdvice).toBe(true);
    expect(finance.body.honesty.fairLendingConsiderationsFlagged).toBe(true);

    const gov = await request(app.getHttpServer())
      .get('/v1/government-intelligence/engine')
      .expect(200);
    expect(gov.body.honesty.officialGuidanceMustBeSourced).toBe(true);
    expect(gov.body.honesty.staleGuidanceRiskNoted).toBe(true);
  });

  it('rejects unauthenticated African Intelligence overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get(
      '/v1/african-intelligence-cloud/overview',
    );
    expect([401, 403, 503]).toContain(res.status);
  });

  it('exposes GraphQL façades for African Intelligence hubs', async () => {
    const started = Date.now();
    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          africanIntelligenceCloudProducts { id status }
          africanLanguageRegistryEngine { product coverageComplete }
          culturalIntelligenceEngine { product traditionalKnowledgeConsentRequired }
          africanKnowledgeGraphEngine { product neo4jOs }
          governmentIntelligenceEngine { product officialGuidanceMustBeSourced }
          healthcareIntelligenceEngine { product notMedicalAdvice }
          financialIntelligenceEngine { product notInvestmentAdvice }
          educationIntelligenceEngine { product verticalOperationsOs }
          agriculturalIntelligenceEngine { product verticalOperationsOs }
          tourismHeritageIntelligenceEngine { product traditionalKnowledgeConsentRequired }
        }`,
      })
      .expect(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.africanIntelligenceCloudProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.africanLanguageRegistryEngine.coverageComplete).toBe(true);
    expect(gql.body.data.culturalIntelligenceEngine.traditionalKnowledgeConsentRequired).toBe(
      true,
    );
    expect(gql.body.data.africanKnowledgeGraphEngine.neo4jOs).toBe(false);
    expect(gql.body.data.healthcareIntelligenceEngine.notMedicalAdvice).toBe(true);
    expect(gql.body.data.financialIntelligenceEngine.notInvestmentAdvice).toBe(true);
    expect(gql.body.data.governmentIntelligenceEngine.officialGuidanceMustBeSourced).toBe(true);
  });
});
