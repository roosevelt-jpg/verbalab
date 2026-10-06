import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import {
  ROYALTY_HAND_CHECK_SCENARIOS,
  splitRevenue,
} from '../src/creator-economy/creator-economy.catalog';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');
const webApp = join(root, 'apps/web/app');

const ECOSYSTEM_DIRS = [
  'ecosystem-cloud',
  'plugin-marketplace',
  'model-marketplace',
  'dataset-marketplace',
  'prompt-marketplace',
  'agent-marketplace',
  'workflow-marketplace',
  'connector-marketplace',
  'voice-language-marketplace',
  'creator-economy',
];

const ENGINE_PATHS = [
  '/v1/ecosystem-cloud/products',
  '/v1/ecosystem-cloud/monitoring',
  '/v1/plugin-marketplace/engine',
  '/v1/plugin-marketplace/monitoring',
  '/v1/model-marketplace/engine',
  '/v1/model-marketplace/monitoring',
  '/v1/dataset-marketplace/engine',
  '/v1/dataset-marketplace/monitoring',
  '/v1/prompt-marketplace/engine',
  '/v1/prompt-marketplace/monitoring',
  '/v1/agent-marketplace/engine',
  '/v1/agent-marketplace/monitoring',
  '/v1/workflow-marketplace/engine',
  '/v1/workflow-marketplace/monitoring',
  '/v1/connector-marketplace/engine',
  '/v1/connector-marketplace/monitoring',
  '/v1/voice-language-marketplace/engine',
  '/v1/voice-language-marketplace/monitoring',
  '/v1/creator-economy/engine',
  '/v1/creator-economy/monitoring',
];

const SHIPPED_PRODUCT_IDS = [
  'plugin-marketplace',
  'model-marketplace',
  'dataset-marketplace',
  'prompt-marketplace',
  'agent-marketplace',
  'workflow-marketplace',
  'connector-marketplace',
  'voice-language-marketplace',
  'creator-economy',
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

describe('Ecosystem Cloud Production Audit',  => {
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
    expect(existsSync(join(root, 'docs/adr/0161-ecosystem-cloud-production-audit.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ecosystem-cloud-audit/PRODUCTION_READINESS.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/ecosystem-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/ecosystem-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/ecosystem-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ecosystem-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/ecosystem-cloud-audit/ECOSYSTEM_CLOUD_READINESS_REPORT.md')),
    ).toBe(true);

    const readiness = readFileSync(
      join(root, 'docs/ecosystem-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/Stripe|storesRawCardData/i);
    expect(readiness).toMatch(/sandbox|Policy/i);
    expect(readiness).toMatch(/Rejected|not a payment-processor/i);
    expect(readiness).toMatch(/Digital Twin|Volume 12/i);
    expect(readiness).toMatch(/|Volume 11/i);

    const adr = readFileSync(
      join(root, 'docs/adr/0161-ecosystem-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/review gate|checklist/i);
    expect(adr).toMatch(/do not implement|Rejected|not implement/i);
    expect(adr).toMatch(/Volume 11 closes|–259|closes/i);
  });

  it('has no TODO/FIXME/implement-later markers in Volume 11 source trees',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const name of ECOSYSTEM_DIRS) {
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

  it('exposes all marketplace + economy catalogs as shipped with monitoring', async  => {
    for (const path of ENGINE_PATHS) {
      const res = await request(app.getHttpServer).get(path).expect(200);
      expect(res.body).toBeTruthy;
    }

    const hub = await request(app.getHttpServer)
      .get('/v1/ecosystem-cloud/products')
      .expect(200);
    expect(hub.body.honesty.storesRawCardData).toBe(false);
    expect(hub.body.honesty.stripeOrEquivalentRequired).toBe(true);
    expect(hub.body.honesty.paymentProcessorOs).toBe(false);
    expect(hub.body.honesty.pluginAgentSandboxRequired).toBe(true);
    expect(hub.body.honesty.taxHandlingComplete).toBe(false);
    expect(hub.body.honesty.disputeChargebackComplete).toBe(false);

    const byId = Object.fromEntries(
      hub.body.products.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    for (const id of SHIPPED_PRODUCT_IDS) {
      expect(byId[id]).toBe('shipped');
    }
  });

  it('keeps plugin/agent/workflow sandbox honesty (no live execution OS)', async  => {
    const plugin = await request(app.getHttpServer)
      .get('/v1/plugin-marketplace/engine')
      .expect(200);
    expect(plugin.body.honesty.liveCodeExecution).toBe(false);
    expect(plugin.body.honesty.storesRawCardData).toBe(false);

    const agent = await request(app.getHttpServer)
      .get('/v1/agent-marketplace/engine')
      .expect(200);
    expect(agent.body.honesty.liveToolExecution).toBe(false);
    expect(agent.body.honesty.sandboxRequired).toBe(true);

    const workflow = await request(app.getHttpServer)
      .get('/v1/workflow-marketplace/engine')
      .expect(200);
    expect(workflow.body.honesty.liveStepExecution).toBe(false);
    expect(workflow.body.honesty.sandboxRequired).toBe(true);

    const connector = await request(app.getHttpServer)
      .get('/v1/connector-marketplace/engine')
      .expect(200);
    expect(connector.body.honesty.liveConnectorExecution).toBe(false);
    expect(connector.body.honesty.ipaasOs).toBe(false);

    const voiceLang = await request(app.getHttpServer)
      .get('/v1/voice-language-marketplace/engine')
      .expect(200);
    expect(voiceLang.body.honesty.thirdPartyVoiceOs).toBe(false);
    expect(voiceLang.body.honesty.celebrityWithoutRights).toBe(false);
  });

  it('hand-checks Creator Economy royalty math (real-money gate)', async  => {
    for (const s of ROYALTY_HAND_CHECK_SCENARIOS) {
      const split = splitRevenue({ amountCents: s.amountCents, feeBps: s.feeBps });
      expect(split.applicationFeeCents).toBe(s.fee);
      expect(split.publisherNetCents).toBe(s.net);
    }
    const res = await request(app.getHttpServer)
      .get('/v1/creator-economy/royalty/scenarios')
      .expect(200);
    expect(res.body.allHandChecksPassed).toBe(true);
    expect(res.body.honesty.creatorPayoutMathVerifiedLive).toBe(false);
    expect(res.body.honesty.storesRawCardData).toBe(false);

    const tax = await request(app.getHttpServer).get('/v1/creator-economy/tax').expect(200);
    expect(tax.body.honesty.taxHandlingComplete).toBe(false);
    const disputes = await request(app.getHttpServer)
      .get('/v1/creator-economy/disputes')
      .expect(200);
    expect(disputes.body.honesty.disputeChargebackComplete).toBe(false);
  });

  it('rejects unauthenticated sensitive ecosystem routes (security smoke)', async  => {
    const paths = [
      { method: 'get', path: '/v1/ecosystem-cloud/overview' },
      { method: 'get', path: '/v1/plugin-marketplace/listings' },
      { method: 'get', path: '/v1/model-marketplace/listings' },
      { method: 'get', path: '/v1/creator-economy/sales' },
      { method: 'post', path: '/v1/creator-economy/royalty/preview' },
      { method: 'get', path: '/v1/marketplace/connect/status' },
    ] as const;
    for (const item of paths) {
      const res =
        item.method === 'post'
          ? await request(app.getHttpServer).post(item.path).send({ amountCents: 1000 })
          : await request(app.getHttpServer).get(item.path);
      expect([401, 403, 503]).toContain(res.status);
    }
  });

  it('exposes GraphQL engine façades for ecosystem hubs', async  => {
    const started = Date.now;
    const gql = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query: `{
          ecosystemProducts { id status }
          pluginMarketplaceEngine { product liveCodeExecution sandboxRequired }
          creatorEconomyEngine {
            product
            paymentProcessorOs
            taxHandlingComplete
            creatorPayoutMathHandCheckedInTests
            storesRawCardData
          }
          connectorMarketplaceEngine { product ipaasOs liveConnectorExecution }
        }`,
      })
      .expect(200);
    expect(Date.now - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined;
    expect(gql.body.data.ecosystemProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.pluginMarketplaceEngine.liveCodeExecution).toBe(false);
    expect(gql.body.data.pluginMarketplaceEngine.sandboxRequired).toBe(true);
    expect(gql.body.data.creatorEconomyEngine.paymentProcessorOs).toBe(false);
    expect(gql.body.data.creatorEconomyEngine.taxHandlingComplete).toBe(false);
    expect(gql.body.data.creatorEconomyEngine.creatorPayoutMathHandCheckedInTests).toBe(true);
    expect(gql.body.data.connectorMarketplaceEngine.ipaasOs).toBe(false);
  });
});
