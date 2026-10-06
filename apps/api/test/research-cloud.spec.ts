import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkTsFiles(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('Research Cloud (VL-271)', () => {
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

  it('documents Research Cloud + ADR', () => {
    expect(existsSync(join(root, 'docs/RESEARCH_CLOUD.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0173-research-cloud.md'))).toBe(true);
    const text = readFileSync(join(root, 'docs/RESEARCH_CLOUD.md'), 'utf8');
    expect(text).toContain('VL-271');
  });

  it('has no TODO/FIXME/implement-later markers', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'research-cloud'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/research-cloud/products')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Research Cloud');

    expect(res.body.honesty.weightsAndBiasesOs).toBe(false);
    expect(res.body.honesty.mlflowOs).toBe(false);
    expect(res.body.honesty.huggingFaceHubOs).toBe(false);
    expect(res.body.honesty.doiRegistryOs).toBe(false);
    expect(res.body.honesty.usptoOs).toBe(false);
    expect(res.body.honesty.aiSovereigntyOs).toBe(false);
    expect(res.body.honesty.syntheticLabelRequired).toBe(true);
    expect(res.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);
    expect(res.body.honesty.regeneratesVolumes1to12).toBe(false);

  });
});
