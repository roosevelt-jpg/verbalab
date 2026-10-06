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

describe('Engineering Quality Platform (VL-348)', () => {
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
    expect(existsSync(join(root, 'docs/adr/0250-engineering-quality-platform.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ENGINEERING_QUALITY_PLATFORM.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers in hub source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, 'engineering-quality-platform');
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine/products with honesty gates', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/engineering-quality-platform/engine')
      .expect(200);
    expect(res.body.product).toBeTruthy();
    expect(res.body.honesty.qualityCatalogNotSonarOs).toBe(true);

    expect(res.body.honesty.engineeringOsForHumansAndCursor).toBe(true);
    expect(res.body.honesty.customerFacingProductCloud).toBe(false);
    expect(res.body.honesty.architectureKnowledgeBaseOs).toBe(false);
    expect(res.body.honesty.adrFactoryOs).toBe(false);
    expect(res.body.engineeringOsForHumansAndCursor).toBe(true);
    expect(res.body.customerFacingProductCloud).toBe(false);
    expect(Array.isArray(res.body.routesTo)).toBe(true);
    expect(res.body.routesTo.length).toBeGreaterThan(0);
    expect(JSON.stringify(res.body.routesTo)).toContain('supply-chain-security');
    expect(JSON.stringify(res.body.routesTo)).toContain('reliability-engineering');
    expect(JSON.stringify(res.body.routesTo)).toContain('developer-experience-platform');

    const route = await request(app.getHttpServer())
      .get('/v1/engineering-quality-platform/route')
      .expect(200);
    expect(route.body.engineeringOsForHumansAndCursor).toBe(true);
    expect(route.body.architectureKnowledgeBaseOs).toBe(false);
    expect(route.body.adrFactoryOs).toBe(false);
    expect(route.body.upstreamStatus.length).toBeGreaterThan(0);

    expect(res.body.honesty.sonarqubeOs).toBe(false);
    expect(res.body.qualityDashboard.sonarqubeOs).toBe(false);

  });

  it('exposes monitoring', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/engineering-quality-platform/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy();
  });
});
