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

describe('Agricultural Intelligence (VL-268)', () => {
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

  it('documents Agricultural Intelligence + ADR', () => {
    expect(existsSync(join(root, 'docs/AGRICULTURAL_INTELLIGENCE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0170-agricultural-intelligence.md'))).toBe(true);
    const text = readFileSync(join(root, 'docs/AGRICULTURAL_INTELLIGENCE.md'), 'utf8');
    expect(text).toContain('VL-268');
  });

  it('has no TODO/FIXME/implement-later markers', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'agricultural-intelligence'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/agricultural-intelligence/engine')
      .expect(200);
    expect(res.body.product).toBe('VerbaLab Agricultural Intelligence');

  });
});
