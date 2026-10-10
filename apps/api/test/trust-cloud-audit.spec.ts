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

const VOLUME15_DIRS = [
  'trust-cloud',
  'ai-safety-platform',
  'ai-governance-platform',
  'explainability-platform',
  'privacy-platform',
  'compliance-platform',
  'risk-intelligence',
  'identity-federation',
  'trust-analytics',
];

const ENGINE_PATHS = [
  '/v1/trust-cloud/products',
  '/v1/trust-cloud/monitoring',
  '/v1/ai-safety-platform/engine',
  '/v1/ai-governance-platform/engine',
  '/v1/explainability-platform/engine',
  '/v1/privacy-platform/engine',
  '/v1/compliance-platform/engine',
  '/v1/risk-intelligence/engine',
  '/v1/identity-federation/engine',
  '/v1/trust-analytics/engine',
];

const SHIPPED_PRODUCT_IDS = [
  'trust-cloud',
  'ai-safety-platform',
  'ai-governance-platform',
  'explainability-platform',
  'privacy-platform',
  'compliance-platform',
  'trust-audit',
  'risk-intelligence',
  'policy-integration',
  'identity-federation',
  'responsible-ai',
  'trust-analytics',
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

describe('Trust Cloud Production Audit', () => {
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
    expect(existsSync(join(root, 'docs/adr/0203-trust-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/TRUST_CLOUD.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/trust-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/trust-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/trust-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/trust-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/trust-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/trust-cloud-audit/TRUST_CLOUD_READINESS_REPORT.md'))).toBe(true);

    const readiness = readFileSync(
      join(root, 'docs/trust-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/policyRuntimeIntegrated/i);
    expect(readiness).toMatch(/traditionalKnowledgeConsentRequired/i);
    expect(readiness).toMatch(/humanSignOffRequired/i);
    expect(readiness).toMatch(/complianceToolingNotCertification/i);
    expect(readiness).toMatch(/Platform Engineering|Rejected/i);
    expect(readiness).toMatch(/Volume 15/i);

    const adr = readFileSync(join(root, 'docs/adr/0203-trust-cloud-production-audit.md'), 'utf8');
    expect(adr).toMatch(/review gate|checklist|Vitest audit gates/i);
    expect(adr).toMatch(/Platform Engineering|do not invent|Rejected/i);
    expect(adr).toMatch(/Volume 15 closed|–301|closes/i);
  });

  it('has no TODO/FIXME/implement-later markers in Volume 15 source trees', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const name of VOLUME15_DIRS) {
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

  it('exposes all Volume 15 catalogs as shipped with monitoring', async () => {
    for (const path of ENGINE_PATHS) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }

    const hub = await request(app.getHttpServer()).get('/v1/trust-cloud/products').expect(200);
    expect(hub.body.honesty.platformEngineeringOs).toBe(false);
    expect(hub.body.honesty.oktaOs).toBe(false);
    expect(hub.body.honesty.grcSuiteOs).toBe(false);
    expect(hub.body.honesty.certificationOs).toBe(false);
    expect(hub.body.honesty.siemOs).toBe(false);
    expect(hub.body.honesty.complianceToolingNotCertification).toBe(true);
    expect(hub.body.honesty.notCertifiedCompliant).toBe(true);
    expect(hub.body.honesty.policyRuntimeIntegrated).toBe(true);
    expect(hub.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);
    expect(hub.body.honesty.humanSignOffRequired).toBe(true);
    expect(hub.body.honesty.regeneratesPriorLayers).toBe(false);

    const byId = Object.fromEntries(
      hub.body.products.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    for (const id of SHIPPED_PRODUCT_IDS) {
      expect(byId[id]).toBe('shipped');
    }
  });

  it('enforces safety↔policy, privacy consent, governance sign-off, compliance honesty', async () => {
    const safety = await request(app.getHttpServer())
      .get('/v1/ai-safety-platform/engine')
      .expect(200);
    expect(safety.body.honesty.policyRuntimeIntegrated).toBe(true);
    expect(safety.body.policyRuntimeIntegrated).toBe(true);
    expect(safety.body.policyRuntime).toBeTruthy();

    const check = await request(app.getHttpServer())
      .get('/v1/ai-safety-platform/check')
      .query({ id: 'safe-jb-001' })
      .expect(200);
    expect(check.body.policyRuntimeIntegrated).toBe(true);
    expect(check.body.blocked).toBe(true);

    const gov = await request(app.getHttpServer())
      .get('/v1/ai-governance-platform/engine')
      .expect(200);
    expect(gov.body.honesty.humanSignOffRequired).toBe(true);
    expect(gov.body.honesty.postFactoLogOnly).toBe(false);

    const pending = await request(app.getHttpServer())
      .get('/v1/ai-governance-platform/status/gov-policy-001')
      .expect(200);
    expect(['pending', 'approved', 'rejected']).toContain(pending.body.status);
    expect(pending.body.humanSignOffRequired).toBe(true);

    const privacyBlocked = await request(app.getHttpServer())
      .get('/v1/privacy-platform/consent-check')
      .query({ id: 'priv-tk-restricted' })
      .expect(200);
    expect(privacyBlocked.body.allowed).toBe(false);
    expect(privacyBlocked.body.traditionalKnowledgeConsentRequired).toBe(true);

    await request(app.getHttpServer())
      .get('/v1/privacy-platform/release')
      .query({ id: 'priv-tk-unverified' })
      .expect(400);

    const compliance = await request(app.getHttpServer())
      .get('/v1/compliance-platform/engine')
      .expect(200);
    expect(compliance.body.honesty.complianceToolingNotCertification).toBe(true);
    expect(compliance.body.honesty.notCertifiedCompliant).toBe(true);
    expect(compliance.body.honesty.lawyersAuditorsStillRequired).toBe(true);

    const identity = await request(app.getHttpServer())
      .get('/v1/identity-federation/engine')
      .expect(200);
    expect(identity.body.honesty.oktaOs).toBe(false);
    expect(identity.body.honesty.samlIdpOs).toBe(false);

    const analytics = await request(app.getHttpServer())
      .get('/v1/trust-analytics/engine')
      .expect(200);
    expect(analytics.body.honesty.siemOs).toBe(false);
    expect(analytics.body.computedFromSiblings).toBe(true);
    expect(analytics.body.snapshot.safetyIncidents.policyRuntimeIntegrated).toBe(true);
  });

  it('rejects unauthenticated Trust Cloud overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/trust-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  });

  it('exposes GraphQL façades for Trust Cloud hubs', async () => {
    const started = Date.now();
    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          trustCloudProducts { id status }
          aiSafetyPlatformEngine { product policyRuntimeIntegrated }
          aiGovernancePlatformEngine { product humanSignOffRequired }
          explainabilityPlatformEngine { product shapOs }
          privacyPlatformEngine { product traditionalKnowledgeConsentRequired }
          compliancePlatformEngine { product complianceToolingNotCertification }
          riskIntelligenceEngine { product grcSuiteOs }
          identityFederationEngine { product oktaOs }
          trustAnalyticsEngine { product siemOs }
        }`,
      })
      .expect(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.trustCloudProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.aiSafetyPlatformEngine.policyRuntimeIntegrated).toBe(true);
    expect(gql.body.data.aiGovernancePlatformEngine.humanSignOffRequired).toBe(true);
    expect(gql.body.data.explainabilityPlatformEngine.shapOs).toBe(false);
    expect(gql.body.data.privacyPlatformEngine.traditionalKnowledgeConsentRequired).toBe(true);
    expect(gql.body.data.compliancePlatformEngine.complianceToolingNotCertification).toBe(true);
    expect(gql.body.data.riskIntelligenceEngine.grcSuiteOs).toBe(false);
    expect(gql.body.data.identityFederationEngine.oktaOs).toBe(false);
    expect(gql.body.data.trustAnalyticsEngine.siemOs).toBe(false);
  });

  it('rejects inventing Platform Engineering Cloud in this volume', () => {
    const readiness = readFileSync(
      join(root, 'docs/trust-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/platformEngineeringOs=false|Platform Engineering Cloud deferred|Rejected/i);
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/Trust Cloud/);
    expect(blueprint).toMatch(/Platform Engineering.*Volume 16|deferred to Volume 16/i);
  });
});
