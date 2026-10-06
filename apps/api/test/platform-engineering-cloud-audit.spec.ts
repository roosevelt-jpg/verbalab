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

const VOLUME16_DIRS = [
  'platform-engineering-cloud',
  'internal-developer-portal',
  'service-catalog',
  'golden-path-platform',
  'gitops-platform',
  'release-engineering',
  'reliability-engineering',
  'finops-platform',
  'supply-chain-security',
  'developer-experience-platform',
  'platform-engineering-analytics',
];

const ENGINE_PATHS = [
  '/v1/platform-engineering-cloud/products',
  '/v1/internal-developer-portal/engine',
  '/v1/service-catalog/engine',
  '/v1/golden-path-platform/engine',
  '/v1/gitops-platform/engine',
  '/v1/release-engineering/engine',
  '/v1/reliability-engineering/engine',
  '/v1/finops-platform/engine',
  '/v1/supply-chain-security/engine',
  '/v1/developer-experience-platform/engine',
  '/v1/platform-engineering-analytics/engine',
  '/v1/platform-engineering-cloud/monitoring',
];

const SHIPPED_PRODUCT_IDS = [
  'platform-engineering-cloud',
  'internal-developer-portal',
  'service-catalog',
  'golden-path-platform',
  'infrastructure-platform',
  'gitops-platform',
  'cicd',
  'developer-experience-platform',
  'observability',
  'release-engineering',
  'reliability-engineering',
  'finops-platform',
  'supply-chain-security',
  'platform-engineering-analytics',
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

describe('Platform Engineering Cloud Production Audit', () => {
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
    expect(existsSync(join(root, 'docs/adr/0215-platform-engineering-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/PLATFORM_ENGINEERING_CLOUD.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/platform-engineering-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/platform-engineering-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/platform-engineering-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/platform-engineering-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/platform-engineering-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/platform-engineering-cloud-audit/PLATFORM_ENGINEERING_CLOUD_READINESS_REPORT.md')),
    ).toBe(true);

    const readiness = readFileSync(
      join(root, 'docs/platform-engineering-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/gpuBudgetAlertsEnabled/i);
    expect(readiness).toMatch(/snykOs=false/i);
    expect(readiness).toMatch(/argoCdOs=false/i);
    expect(readiness).toMatch(/controlPlaneOs=false/i);
    expect(readiness).toMatch(/|Volume 16/i);

    const adr = readFileSync(
      join(root, 'docs/adr/0215-platform-engineering-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/Vitest audit gates|review gate|checklist/i);
    expect(adr).toMatch(/Control Plane|Data Plane|AI Cloud OS|do not invent|Rejected/i);
    expect(adr).toMatch(/Volume 16 closed|–313|closes/i);
  });

  it('has no TODO/FIXME/implement-later markers in Volume 16 source trees', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const name of VOLUME16_DIRS) {
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

  it('exposes all Volume 16 catalogs as shipped with monitoring', async () => {
    for (const path of ENGINE_PATHS) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }

    const hub = await request(app.getHttpServer())
      .get('/v1/platform-engineering-cloud/products')
      .expect(200);
    expect(hub.body.honesty.controlPlaneOs).toBe(false);
    expect(hub.body.honesty.dataPlaneOs).toBe(false);
    expect(hub.body.honesty.aiCloudOs).toBe(false);
    expect(hub.body.honesty.backstageOs).toBe(false);
    expect(hub.body.honesty.argoCdOs).toBe(false);
    expect(hub.body.honesty.fluxOs).toBe(false);
    expect(hub.body.honesty.snykOs).toBe(false);
    expect(hub.body.honesty.datadogOs).toBe(false);
    expect(hub.body.honesty.finopsOs).toBe(false);
    expect(hub.body.honesty.regeneratesPriorLayers).toBe(false);

    const byId = Object.fromEntries(
      hub.body.products.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    for (const id of SHIPPED_PRODUCT_IDS) {
      expect(byId[id]).toBe('shipped');
    }
  });

  it('enforces FinOps GPU alerts, supply-chain findings, GitOps honesty', async () => {
    const finops = await request(app.getHttpServer())
      .get('/v1/finops-platform/engine')
      .expect(200);
    expect(finops.body.honesty.finopsOs).toBe(false);
    expect(finops.body.gpuBudgetAlertsEnabled).toBe(true);
    expect(finops.body.budgets.some((b: { kind: string }) => b.kind === 'gpu')).toBe(true);
    expect(
      finops.body.alerts.some((a: { kind: string; enabled: boolean }) => a.kind === 'gpu' && a.enabled),
    ).toBe(true);

    const alerts = await request(app.getHttpServer())
      .get('/v1/finops-platform/alerts')
      .expect(200);
    expect(alerts.body.gpuBudgetAlertsEnabled).toBe(true);
    expect(alerts.body.gpuAlerts.length).toBeGreaterThan(0);

    const supply = await request(app.getHttpServer())
      .get('/v1/supply-chain-security/engine')
      .expect(200);
    expect(supply.body.honesty.snykOs).toBe(false);
    expect(supply.body.findings.length).toBeGreaterThan(0);

    const scan = await request(app.getHttpServer())
      .get('/v1/supply-chain-security/scan')
      .expect(200);
    expect(scan.body.packages.length).toBeGreaterThan(0);
    expect(scan.body.findings.length).toBeGreaterThan(0);

    const findings = await request(app.getHttpServer())
      .get('/v1/supply-chain-security/findings')
      .expect(200);
    expect(findings.body.findings.length).toBeGreaterThan(0);

    const gitops = await request(app.getHttpServer())
      .get('/v1/gitops-platform/engine')
      .expect(200);
    expect(gitops.body.honesty.argoCdOs).toBe(false);
    expect(gitops.body.honesty.fluxOs).toBe(false);

    const analytics = await request(app.getHttpServer())
      .get('/v1/platform-engineering-analytics/engine')
      .expect(200);
    expect(analytics.body.computedFromSiblings).toBe(true);
    expect(analytics.body.snapshot.cost.gpuBudgetAlertsEnabled).toBe(true);
    expect(analytics.body.snapshot.gitops.argoCdOs).toBe(false);
    expect(analytics.body.snapshot.supplyChain.snykOs).toBe(false);
  });

  it('rejects unauthenticated Platform Engineering overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/platform-engineering-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  });

  it('exposes GraphQL façades for Platform Engineering hubs', async () => {
    const started = Date.now();
    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          platformEngineeringCloudProducts { id status }
          internalDeveloperPortalEngine { product backstageOs }
          serviceCatalogEngine { product serviceMeshOs }
          goldenPathPlatformEngine { product scaffoldingOs }
          gitopsPlatformEngine { product argoCdOs fluxOs }
          releaseEngineeringEngine { product spinnakerOs }
          reliabilityEngineeringEngine { product datadogOs }
          finopsPlatformEngine { product finopsOs gpuBudgetAlertsEnabled }
          supplyChainSecurityEngine { product snykOs findingCount }
          developerExperiencePlatformEngine { product ideOs }
          platformEngineeringAnalyticsEngine { product devopsIntelligenceOs }
        }`,
      })
      .expect(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.platformEngineeringCloudProducts.length).toBeGreaterThan(10);
    expect(gql.body.data.finopsPlatformEngine.gpuBudgetAlertsEnabled).toBe(true);
    expect(gql.body.data.finopsPlatformEngine.finopsOs).toBe(false);
    expect(gql.body.data.supplyChainSecurityEngine.snykOs).toBe(false);
    expect(gql.body.data.supplyChainSecurityEngine.findingCount).toBeGreaterThan(0);
    expect(gql.body.data.gitopsPlatformEngine.argoCdOs).toBe(false);
    expect(gql.body.data.gitopsPlatformEngine.fluxOs).toBe(false);
  });

  it('rejects inventing Control Plane / Data Plane / AI Cloud OS in this volume', () => {
    const readiness = readFileSync(
      join(root, 'docs/platform-engineering-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/controlPlaneOs=false|Control Plane.*deferred|Rejected/i);
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/Platform Engineering/);
    expect(blueprint).toMatch(/Control Plane.*Volume 17|deferred to Volume 17/i);
  });
});
