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

const VOLUME20_HUBS = ["enterprise-engineering-system", "engineering-governance", "architecture-governance", "repository-standards", "engineering-quality-platform", "ai-engineering-standards", "api-engineering-standards", "database-engineering-standards", "infrastructure-engineering-standards"];
const STANDARDS_HUBS = ["engineering-governance", "architecture-governance", "repository-standards", "engineering-quality-platform", "ai-engineering-standards", "api-engineering-standards", "database-engineering-standards", "infrastructure-engineering-standards"];

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

describe('Enterprise Engineering System Production Audit', () => {
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

  it('ships audit pack and ADR-0255', () => {
    expect(existsSync(join(root, 'docs/adr/0255-enterprise-engineering-system-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ENTERPRISE_ENGINEERING_SYSTEM.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/ARCHITECTURE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/PERFORMANCE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/COVERAGE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/DEPLOYMENT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/ENGINEERING_READINESS_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/ENTERPRISE_ENGINEERING_SYSTEM_READINESS_REPORT.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers across Volume 20 hubs', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const slug of VOLUME20_HUBS) {
      const dir = join(apiSrc, slug);
      if (!existsSync(dir)) {
        hits.push(`missing:${slug}`);
        continue;
      }
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('foundation catalogs all shipped products with honesty gates', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/enterprise-engineering-system/products')
      .expect(200);
    expect(res.body.honesty.engineeringOsForHumansAndCursor).toBe(true);
    expect(res.body.honesty.customerFacingProductCloud).toBe(false);
    expect(res.body.honesty.architectureKnowledgeBaseOs).toBe(false);
    expect(res.body.honesty.adrFactoryOs).toBe(false);
    const ids = res.body.products.map((p: { id: string }) => p.id);
    for (const slug of STANDARDS_HUBS) {
      expect(ids).toContain(slug);
    }
    expect(ids).toContain('enterprise-engineering-system');
  });

  it('each standards hub has honesty and non-empty routesTo', async () => {
    for (const slug of STANDARDS_HUBS) {
      const res = await request(app.getHttpServer())
        .get(`/v1/${slug}/engine`)
        .expect(200);
      expect(res.body.honesty.engineeringOsForHumansAndCursor).toBe(true);
      expect(res.body.honesty.customerFacingProductCloud).toBe(false);
      expect(res.body.honesty.architectureKnowledgeBaseOs).toBe(false);
      expect(res.body.honesty.adrFactoryOs).toBe(false);
      expect(res.body.routesTo.length).toBeGreaterThan(0);
    }
  });

  it('retroactive checks present for Vol 11/12/17', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/ai-engineering-standards/check/list')
      .expect(200);
    expect(res.body.fakeComplianceCertification).toBe(false);
    const topics = res.body.retroactiveChecks.map((c: { topic: string; volume: number }) => `${c.volume}:${c.topic}`);
    expect(topics.some((t: string) => t.includes('11') && t.includes('payments'))).toBe(true);
    expect(topics.some((t: string) => t.includes('12') && t.includes('healthcare'))).toBe(true);
    expect(topics.some((t: string) => t.includes('12') && t.includes('financial'))).toBe(true);
    expect(topics.some((t: string) => t.includes('12') && t.includes('consent'))).toBe(true);
    expect(topics.some((t: string) => t.includes('17') && t.includes('secrets'))).toBe(true);
    for (const c of res.body.retroactiveChecks) {
      expect(c.checkedAgainstStandards).toBe(true);
      expect(['pass', 'gap']).toContain(c.finding);
    }
  });

  it('rejects Architecture Knowledge Base / mass ADR factory', () => {
    const readiness = readFileSync(
      join(root, 'docs/enterprise-engineering-system-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/Architecture Knowledge Base|Rejected inventions/i);
    expect(readiness).toMatch(/adrFactoryOs=false|Mass ADR factory/i);
    const adr = readFileSync(
      join(root, 'docs/adr/0255-enterprise-engineering-system-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/architectureKnowledgeBaseOs=false|Architecture Knowledge Base/i);
    const foundation = readFileSync(
      join(apiSrc, 'enterprise-engineering-system/enterprise-engineering-system.catalog.ts'),
      'utf8',
    );
    expect(foundation).toMatch(/architectureKnowledgeBaseOs:\s*false/);
    expect(foundation).toMatch(/adrFactoryOs:\s*false/);
  });

  it('infrastructure GPU/secrets honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/infrastructure-engineering-standards/engine')
      .expect(200);
    expect(res.body.honesty.kubernetesOs).toBe(false);
    expect(res.body.honesty.gpuBudgetLimitsRequired).toBe(true);
    expect(res.body.honesty.secretsEnvelopeHonesty).toBe(true);
  });

  it('auth smoke on overview', async () => {
    const res = await request(app.getHttpServer()).get('/v1/enterprise-engineering-system/overview');
    expect([401, 403, 503]).toContain(res.status);
  });

  it('GraphQL honesty fields', async () => {
    const started = Date.now();
    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          enterpriseEngineeringSystemProducts { id name status }
          engineeringGovernanceEngine { product note engineeringOsForHumansAndCursor customerFacingProductCloud architectureKnowledgeBaseOs adrFactoryOs }
          architectureGovernanceEngine { product note engineeringOsForHumansAndCursor customerFacingProductCloud architectureKnowledgeBaseOs adrFactoryOs }
          repositoryStandardsEngine { product note engineeringOsForHumansAndCursor customerFacingProductCloud architectureKnowledgeBaseOs adrFactoryOs }
          engineeringQualityPlatformEngine { product note engineeringOsForHumansAndCursor customerFacingProductCloud architectureKnowledgeBaseOs adrFactoryOs }
          aiEngineeringStandardsEngine { product note engineeringOsForHumansAndCursor customerFacingProductCloud architectureKnowledgeBaseOs adrFactoryOs }
          apiEngineeringStandardsEngine { product note engineeringOsForHumansAndCursor customerFacingProductCloud architectureKnowledgeBaseOs adrFactoryOs }
          databaseEngineeringStandardsEngine { product note engineeringOsForHumansAndCursor customerFacingProductCloud architectureKnowledgeBaseOs adrFactoryOs }
          infrastructureEngineeringStandardsEngine { product note engineeringOsForHumansAndCursor customerFacingProductCloud architectureKnowledgeBaseOs adrFactoryOs }
        }`,
      })
      .expect(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.enterpriseEngineeringSystemProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.engineeringGovernanceEngine.engineeringOsForHumansAndCursor).toBe(true);
    expect(gql.body.data.architectureGovernanceEngine.adrFactoryOs).toBe(false);
    expect(gql.body.data.architectureGovernanceEngine.architectureKnowledgeBaseOs).toBe(false);
    expect(gql.body.data.aiEngineeringStandardsEngine.customerFacingProductCloud).toBe(false);
    expect(gql.body.data.infrastructureEngineeringStandardsEngine.architectureKnowledgeBaseOs).toBe(false);
  });

  it('documents EES in CLOUD_BLUEPRINT and PROGRESS', () => {
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/Enterprise Engineering System/);
    expect(blueprint).toMatch(/);
    const progress = readFileSync(join(root, 'PROGRESS.md'), 'utf8');
    expect(progress).toMatch(/);
    expect(progress).toMatch(/Volume 20 closed/);
  });
});
