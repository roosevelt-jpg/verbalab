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

const VOLUME17_DIRS = [
  'control-plane-cloud',
  'organization-control',
  'global-configuration-platform',
  'global-policy-engine',
  'global-deployment-controller',
  'global-routing-controller',
  'secrets-certificate-platform',
  'global-scheduler',
  'control-plane-analytics',
];

const ENGINE_PATHS = [
  '/v1/control-plane-cloud/products',
  '/v1/organization-control/engine',
  '/v1/global-configuration-platform/engine',
  '/v1/global-policy-engine/engine',
  '/v1/global-deployment-controller/engine',
  '/v1/global-routing-controller/engine',
  '/v1/secrets-certificate-platform/engine',
  '/v1/global-scheduler/engine',
  '/v1/control-plane-analytics/engine',
  '/v1/control-plane-cloud/monitoring',
];

const SHIPPED_PRODUCT_IDS = [
  'control-plane-cloud',
  'organization-control',
  'global-configuration-platform',
  'global-policy-engine',
  'global-deployment-controller',
  'global-routing-controller',
  'secrets-certificate-platform',
  'global-scheduler',
  'control-plane-analytics',
  'identity',
  'billing',
  'monitoring',
];

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory) {
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

describe('Control Plane Cloud Production Audit',  => {
  let app: INestApplication<App>;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
  }, 120_000);

  afterAll(async  => {
    await app.close;
  });

  it('ships audit ADR and report pack',  => {
    expect(existsSync(join(root, 'docs/adr/0225-control-plane-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CONTROL_PLANE_CLOUD.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/control-plane-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/control-plane-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/control-plane-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/control-plane-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/control-plane-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/control-plane-cloud-audit/CONTROL_PLANE_CLOUD_READINESS_REPORT.md')),
    ).toBe(true);

    const readiness = readFileSync(
      join(root, 'docs/control-plane-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/executesInference=false/i);
    expect(readiness).toMatch(/encryptedAtRest=true/i);
    expect(readiness).toMatch(/productionDeployRequiresAuthorization=true/i);
    expect(readiness).toMatch(/leastPrivilegeRequired=true/i);
    expect(readiness).toMatch(/dataPlaneOs=false/i);
    expect(readiness).toMatch(/|Volume 17/i);

    const adr = readFileSync(
      join(root, 'docs/adr/0225-control-plane-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/Vitest audit gates|review gate|checklist/i);
    expect(adr).toMatch(/Data Plane|do not invent|Rejected/i);
    expect(adr).toMatch(/Volume 17 closed|–323|closes/i);
  });

  it('has no TODO/FIXME/implement-later markers in Volume 17 source trees',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const name of VOLUME17_DIRS) {
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

  it('exposes all Volume 17 catalogs as shipped with monitoring', async  => {
    for (const path of ENGINE_PATHS) {
      const res = await request(app.getHttpServer).get(path).expect(200);
      expect(res.body).toBeTruthy;
    }

    const hub = await request(app.getHttpServer)
      .get('/v1/control-plane-cloud/products')
      .expect(200);
    expect(hub.body.honesty.executesInference).toBe(false);
    expect(hub.body.honesty.dataPlaneOs).toBe(false);
    expect(hub.body.honesty.regeneratesVolumes1to16).toBe(false);

    const byId = Object.fromEntries(
      hub.body.products.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    for (const id of SHIPPED_PRODUCT_IDS) {
      expect(byId[id]).toBe('shipped');
    }
  });

  it('enforces secrets metadata-only, deploy auth+rollback, least privilege', async  => {
    const secrets = await request(app.getHttpServer)
      .get('/v1/secrets-certificate-platform/engine')
      .expect(200);
    expect(secrets.body.honesty.encryptedAtRest).toBe(true);
    expect(secrets.body.honesty.neverLogPlaintextSecrets).toBe(true);
    expect(secrets.body.honesty.envelopeEncryptionPattern).toBe(true);
    expect(secrets.body.honesty.accessAuditing).toBe(true);
    expect(secrets.body.honesty.hashicorpVaultOs).toBe(false);
    const secretsBlob = JSON.stringify(secrets.body);
    expect(secretsBlob).not.toMatch(/sk_live_|sk_test_|whsec_|BEGIN (RSA |EC )?PRIVATE KEY/i);
    expect(secretsBlob).not.toMatch(/"ciphertext"\s*:/);
    expect(secretsBlob).not.toMatch(/"dekWrapped"\s*:/);

    const meta = await request(app.getHttpServer)
      .get('/v1/secrets-certificate-platform/metadata')
      .expect(200);
    expect(meta.body.secrets[0]).toHaveProperty('name');
    expect(meta.body.secrets[0]).toHaveProperty('version');
    expect(meta.body.secrets[0]).toHaveProperty('rotatedAt');
    expect(meta.body.secrets[0]).not.toHaveProperty('ciphertext');
    expect(meta.body.secrets[0]).not.toHaveProperty('value');

    const blocked = await request(app.getHttpServer)
      .post('/v1/global-deployment-controller/promote')
      .send({ deploymentId: 'dep-api-prod', environment: 'production', authorized: false })
      .expect(201);
    expect(blocked.body.allowed).toBe(false);

    const rollback = await request(app.getHttpServer)
      .get('/v1/global-deployment-controller/rollback')
      .expect(200);
    expect(rollback.body.rollbackPath).toBe(true);
    expect(rollback.body.rollbacks.length).toBeGreaterThan(0);

    const roles = await request(app.getHttpServer)
      .get('/v1/organization-control/roles')
      .expect(200);
    expect(roles.body.leastPrivilegeRequired).toBe(true);
    expect(roles.body.controlPlaneAdminNotDefault).toBe(true);
    expect(roles.body.defaultRole).toBe('viewer');

    const policy = await request(app.getHttpServer)
      .get('/v1/global-policy-engine/engine')
      .expect(200);
    expect(policy.body.honesty.policyRuntimeIntegrated).toBe(true);
    expect(policy.body.honesty.leastPrivilegeRequired).toBe(true);

    const analytics = await request(app.getHttpServer)
      .get('/v1/control-plane-analytics/engine')
      .expect(200);
    expect(analytics.body.computedFromSiblings).toBe(true);
    expect(analytics.body.honesty.executesInference).toBe(false);
  });

  it('rejects unauthenticated Control Plane overview (auth smoke)', async  => {
    const res = await request(app.getHttpServer).get('/v1/control-plane-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  });

  it('exposes GraphQL façades for Control Plane hubs', async  => {
    const started = Date.now;
    const gql = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query: `{
          controlPlaneCloudProducts { id status }
          organizationControlEngine { product leastPrivilegeRequired controlPlaneAdminNotDefault }
          globalConfigurationPlatformEngine { product secretsRefsOnly }
          globalPolicyEngineEngine { product policyRuntimeIntegrated leastPrivilegeRequired }
          globalDeploymentControllerEngine { product productionDeployRequiresAuthorization rollbackPath }
          globalRoutingControllerEngine { product istioOs }
          secretsCertificatePlatformEngine { product encryptedAtRest neverLogPlaintextSecrets hashicorpVaultOs secretCount }
          globalSchedulerEngine { product executesInference }
          controlPlaneAnalyticsEngine { product aggregatesSiblingHubs }
        }`,
      })
      .expect(200);
    expect(Date.now - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined;
    expect(gql.body.data.controlPlaneCloudProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.secretsCertificatePlatformEngine.encryptedAtRest).toBe(true);
    expect(gql.body.data.secretsCertificatePlatformEngine.hashicorpVaultOs).toBe(false);
    expect(gql.body.data.globalDeploymentControllerEngine.productionDeployRequiresAuthorization).toBe(true);
    expect(gql.body.data.globalDeploymentControllerEngine.rollbackPath).toBe(true);
    expect(gql.body.data.organizationControlEngine.leastPrivilegeRequired).toBe(true);
    expect(gql.body.data.organizationControlEngine.controlPlaneAdminNotDefault).toBe(true);
  });

  it('rejects inventing Data Plane in this volume',  => {
    const readiness = readFileSync(
      join(root, 'docs/control-plane-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/dataPlaneOs=false|Data Plane.*deferred|Rejected/i);
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/Control Plane/);
    expect(blueprint).toMatch(/Data Plane.*Volume 18|deferred to Volume 18/i);
  });
});
