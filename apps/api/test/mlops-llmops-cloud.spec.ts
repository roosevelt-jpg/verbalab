import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      out.push(...walkTsFiles(p));
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

describe('MLOps & LLMOps Cloud (VL-281)', () => {
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

  it('ships ADR and product doc', () => {
    expect(existsSync(join(root, 'docs/adr/0183-mlops-llmops-cloud.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/MLOPS_LLMOPS_CLOUD.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers in hub source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, 'mlops-llmops-cloud');
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine/products with honesty gates', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/mlops-llmops-cloud/products')
      .expect(200);
    expect(res.body.product).toBeTruthy();

    expect(res.body.honesty.kubeflowOs).toBe(false);
    expect(res.body.honesty.sageMakerOs).toBe(false);
    expect(res.body.honesty.vertexOs).toBe(false);
    expect(res.body.honesty.weightsAndBiasesOs).toBe(false);
    expect(res.body.honesty.mlflowOs).toBe(false);
    expect(res.body.honesty.langSmithOs).toBe(false);
    expect(res.body.honesty.rayClusterOs).toBe(false);
    expect(res.body.honesty.trustCloudOs).toBe(false);
    expect(res.body.honesty.humanApprovalRequiredBeforePromote).toBe(true);
    expect(res.body.honesty.poisonedInputGuard).toBe(true);
    expect(res.body.honesty.requiresDriftClear).toBe(true);
    expect(res.body.honesty.requiresContinuousEvalPass).toBe(true);
    expect(res.body.honesty.policyViolationsVisible).toBe(true);
    expect(res.body.honesty.regeneratesVolumes1to13).toBe(false);
  });

  it('exposes monitoring', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/mlops-llmops-cloud/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy();
  });

  it('rejects unauthenticated overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/mlops-llmops-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  });
});
