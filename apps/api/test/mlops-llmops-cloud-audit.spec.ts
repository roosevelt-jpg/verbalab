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

const VOLUME14_DIRS = [
  'mlops-llmops-cloud',
  'dataset-pipeline',
  'training-pipeline',
  'continuous-evaluation',
  'promptops-platform',
  'ragops-platform',
  'agentops-platform',
  'ai-drift-detection',
  'continuous-learning',
  'ai-operations-dashboard',
];

const ENGINE_PATHS = [
  '/v1/mlops-llmops-cloud/products',
  '/v1/mlops-llmops-cloud/monitoring',
  '/v1/dataset-pipeline/engine',
  '/v1/training-pipeline/engine',
  '/v1/continuous-evaluation/engine',
  '/v1/promptops-platform/engine',
  '/v1/ragops-platform/engine',
  '/v1/agentops-platform/engine',
  '/v1/ai-drift-detection/engine',
  '/v1/continuous-learning/engine',
  '/v1/ai-operations-dashboard/engine',
];

const SHIPPED_PRODUCT_IDS = [
  'mlops-llmops-cloud',
  'dataset-pipeline',
  'training-pipeline',
  'continuous-evaluation',
  'promptops-platform',
  'ragops-platform',
  'agentops-platform',
  'ai-drift-detection',
  'continuous-learning',
  'ai-operations-dashboard',
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

describe('MLOps & LLMOps Cloud Production Audit (VL-291)', () => {
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
    expect(existsSync(join(root, 'docs/adr/0193-mlops-llmops-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/MLOPS_LLMOPS_CLOUD.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/mlops-llmops-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/mlops-llmops-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/mlops-llmops-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/mlops-llmops-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/mlops-llmops-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/mlops-llmops-cloud-audit/MLOPS_LLMOPS_CLOUD_READINESS_REPORT.md')),
    ).toBe(true);

    const readiness = readFileSync(
      join(root, 'docs/mlops-llmops-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/humanApprovalRequiredBeforePromote/i);
    expect(readiness).toMatch(/poisonedInputGuard/i);
    expect(readiness).toMatch(/policyViolationsVisible/i);
    expect(readiness).toMatch(/Trust Cloud|Rejected/i);
    expect(readiness).toMatch(/VL-281|Volume 14/i);

    const adr = readFileSync(
      join(root, 'docs/adr/0193-mlops-llmops-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/review gate|checklist/i);
    expect(adr).toMatch(/Trust Cloud|do not invent|Rejected/i);
    expect(adr).toMatch(/Volume 14 closed|VL-281–291|closes/i);
  });

  it('has no TODO/FIXME/implement-later markers in Volume 14 source trees', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const name of VOLUME14_DIRS) {
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

  it('exposes all Volume 14 catalogs as shipped with monitoring', async () => {
    for (const path of ENGINE_PATHS) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }

    const hub = await request(app.getHttpServer())
      .get('/v1/mlops-llmops-cloud/products')
      .expect(200);
    expect(hub.body.honesty.kubeflowOs).toBe(false);
    expect(hub.body.honesty.sageMakerOs).toBe(false);
    expect(hub.body.honesty.vertexOs).toBe(false);
    expect(hub.body.honesty.weightsAndBiasesOs).toBe(false);
    expect(hub.body.honesty.mlflowOs).toBe(false);
    expect(hub.body.honesty.langSmithOs).toBe(false);
    expect(hub.body.honesty.rayClusterOs).toBe(false);
    expect(hub.body.honesty.trustCloudOs).toBe(false);
    expect(hub.body.honesty.humanApprovalRequiredBeforePromote).toBe(true);
    expect(hub.body.honesty.poisonedInputGuard).toBe(true);
    expect(hub.body.honesty.requiresDriftClear).toBe(true);
    expect(hub.body.honesty.requiresContinuousEvalPass).toBe(true);
    expect(hub.body.honesty.policyViolationsVisible).toBe(true);
    expect(hub.body.honesty.regeneratesVolumes1to13).toBe(false);

    const byId = Object.fromEntries(
      hub.body.products.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    for (const id of SHIPPED_PRODUCT_IDS) {
      expect(byId[id]).toBe('shipped');
    }
  });

  it('enforces Continuous Learning promote gates and AgentOps policy visibility', async () => {
    const drift = await request(app.getHttpServer())
      .get('/v1/ai-drift-detection/check')
      .expect(200);
    expect(typeof drift.body.driftClear).toBe('boolean');

    const gates = await request(app.getHttpServer())
      .get('/v1/continuous-evaluation/gate-status')
      .expect(200);
    expect(typeof gates.body.continuousEvalPass).toBe('boolean');

    const ready = await request(app.getHttpServer())
      .get('/v1/continuous-learning/promote-check')
      .query({ id: 'promo-ready-001' })
      .expect(200);
    expect(ready.body.allowed).toBe(true);
    expect(ready.body.autoPromote).toBe(false);
    expect(ready.body.humanApprovalRequiredBeforePromote).toBe(true);
    expect(ready.body.poisonedInputGuard).toBe(true);
    expect(ready.body.requiresDriftClear).toBe(true);
    expect(ready.body.requiresContinuousEvalPass).toBe(true);

    const blockedHuman = await request(app.getHttpServer())
      .get('/v1/continuous-learning/promote-check')
      .query({ id: 'promo-blocked-human-001' })
      .expect(200);
    expect(blockedHuman.body.allowed).toBe(false);

    const blockedPoison = await request(app.getHttpServer())
      .get('/v1/continuous-learning/promote-check')
      .query({ id: 'promo-blocked-poison-001' })
      .expect(200);
    expect(blockedPoison.body.allowed).toBe(false);

    await request(app.getHttpServer())
      .get('/v1/continuous-learning/promote')
      .query({ id: 'promo-blocked-poison-001' })
      .expect(400);

    const agentops = await request(app.getHttpServer())
      .get('/v1/agentops-platform/engine')
      .expect(200);
    expect(agentops.body.honesty.policyViolationsVisible).toBe(true);
    expect(agentops.body.policyViolations.length).toBeGreaterThan(0);

    const agentMon = await request(app.getHttpServer())
      .get('/v1/agentops-platform/monitoring')
      .expect(200);
    expect(agentMon.body.policyViolationsVisible).toBe(true);
    expect(agentMon.body.policyViolations.length).toBeGreaterThan(0);

    const training = await request(app.getHttpServer())
      .get('/v1/training-pipeline/engine')
      .expect(200);
    expect(training.body.honesty.distributedTrainingOs).toBe(false);
  });

  it('rejects unauthenticated MLOps overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/mlops-llmops-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  });

  it('exposes GraphQL façades for MLOps & LLMOps Cloud hubs', async () => {
    const started = Date.now();
    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          mlopsLlmopsCloudProducts { id status }
          datasetPipelineEngine { product regeneratesDatasetMarketplace }
          trainingPipelineEngine { product distributedTrainingOs }
          continuousEvaluationEngine { product continuousEvalPass }
          promptopsPlatformEngine { product langSmithOs }
          ragopsPlatformEngine { product vectorDbOs }
          agentopsPlatformEngine { product policyViolationsVisible }
          aiDriftDetectionEngine { product driftClear }
          continuousLearningEngine { product humanApprovalRequiredBeforePromote }
          aiOperationsDashboardEngine { product trustCloudOs }
        }`,
      })
      .expect(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.mlopsLlmopsCloudProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.datasetPipelineEngine.regeneratesDatasetMarketplace).toBe(false);
    expect(gql.body.data.trainingPipelineEngine.distributedTrainingOs).toBe(false);
    expect(typeof gql.body.data.continuousEvaluationEngine.continuousEvalPass).toBe('boolean');
    expect(gql.body.data.promptopsPlatformEngine.langSmithOs).toBe(false);
    expect(gql.body.data.ragopsPlatformEngine.vectorDbOs).toBe(false);
    expect(gql.body.data.agentopsPlatformEngine.policyViolationsVisible).toBe(true);
    expect(typeof gql.body.data.aiDriftDetectionEngine.driftClear).toBe('boolean');
    expect(gql.body.data.continuousLearningEngine.humanApprovalRequiredBeforePromote).toBe(true);
    expect(gql.body.data.aiOperationsDashboardEngine.trustCloudOs).toBe(false);
  });
});
