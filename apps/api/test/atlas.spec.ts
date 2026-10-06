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
    if (statSync(full).isDirectory) out.push(...walkTsFiles(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('Atlas scaffold',  => {
  let app: INestApplication<App>;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
  });

  afterAll(async  => {
    await app.close;
  });

  it('documents Atlas honesty (scaffold, no trained weights)',  => {
    const doc = join(root, 'docs/ATLAS.md');
    const adr = join(root, 'docs/adr/0140-atlas-scaffold.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('');
    expect(text).toMatch(/not trained|scaffold/i);
    expect(text).toContain('CQRS');
    expect(text).toMatch(/shipsTrainedAtlasWeights/i);
  });

  it('has no TODO/FIXME/implement-later markers in Atlas source',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'atlas'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes public engine with honest capabilities', async  => {
    const res = await request(app.getHttpServer).get('/v1/atlas/engine').expect(200);
    expect(res.body.product).toBe('Lugemi Atlas');
    expect(res.body.honesty.shipsTrainedAtlasWeights).toBe(false);
    expect(res.body.honesty.scaffoldOnly).toBe(true);
    expect(res.body.honesty.openAiReplacementOs).toBe(false);
    expect(res.body.architecture.trainsCompetitiveFoundationWeights).toBe(false);
    expect(res.body.safety.noFakeTrainedWeights).toBe(true);
    expect(res.body.docs).toBe('/docs/ATLAS.md');

    const reasoning = res.body.capabilities.find((c: { id: string }) => c.id === 'reasoning');
    expect(reasoning.status).toBe('partial');
    const coding = res.body.capabilities.find((c: { id: string }) => c.id === 'coding');
    expect(coding.status).toBe('deferred');
  });

  it('exposes atlasCapabilities via GraphQL CQRS façade', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({ query: '{ atlasCapabilities { id name status api notes } }' })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.atlasCapabilities.length).toBeGreaterThan(10);
    expect(
      res.body.data.atlasCapabilities.some((c: { id: string }) => c.id === 'reasoning'),
    ).toBe(true);
  });
});
