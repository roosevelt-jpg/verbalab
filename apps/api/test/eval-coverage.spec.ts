import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { GatewayService } from '../src/gateway/gateway.service';
import { EvalService } from '../src/eval/eval.service';
import { GOLDEN_PAIRS } from '../src/eval/goldens';
import { charSimilarity, exactMatch, normalizeForEval } from '../src/eval/metrics';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

describe('Coverage + eval harness',  => {
  let app: INestApplication<App>;
  let gateway: GatewayService;
  let evalService: EvalService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    gateway = app.get(GatewayService);
    evalService = app.get(EvalService);

    gateway.setProviderForTests({
      name: 'fixture_eval',
      async translate(input) {
        return {
          text: `[${input.target}] ${input.text}`,
          source: input.source,
          target: input.target,
          provider: 'fixture_eval',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async  => {
    await app.close;
  });

  it('scores exact match and character similarity',  => {
    expect(normalizeForEval(' Habari! ')).toBe('habari');
    expect(exactMatch('Habari', 'habari')).toBe(true);
    expect(charSimilarity('Habari', 'Habari yako')).toBeGreaterThan(0.4);
    expect(charSimilarity('Habari', 'Habari')).toBe(1);
  });

  it('ships golden sets for en→sw, en→yo, en→am',  => {
    const keys = GOLDEN_PAIRS.map((p) => `${p.sourceLang}-${p.targetLang}`);
    expect(keys).toEqual(['en-sw', 'en-yo', 'en-am']);
    for (const pair of GOLDEN_PAIRS) {
      expect(pair.segments.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('reference oracle reaches perfect scores', async  => {
    const snapshot = await evalService.runAll('reference_oracle');
    expect(snapshot.mode).toBe('reference_oracle');
    expect(snapshot.pairs).toHaveLength(3);
    for (const pair of snapshot.pairs) {
      expect(pair.exactMatchRate).toBe(1);
      expect(pair.meanCharSimilarity).toBe(1);
    }
  });

  it('fixture gateway run writes imperfect but valid scores', async  => {
    const snapshot = await evalService.runAll('fixture');
    expect(snapshot.mode).toBe('fixture');
    for (const pair of snapshot.pairs) {
      expect(pair.segmentCount).toBeGreaterThan(0);
      expect(pair.exactMatchRate).toBeLessThan(1);
      expect(pair.meanCharSimilarity).toBeGreaterThanOrEqual(0);
      expect(pair.meanCharSimilarity).toBeLessThanOrEqual(1);
    }
  });

  it('GET /v1/coverage is public and includes focus pairs', async  => {
    const res = await request(app.getHttpServer).get('/v1/coverage').expect(200);
    expect(res.body.disclaimer).toMatch(/not market leadership/i);
    expect(res.body.focusPairs).toHaveLength(3);
    expect(res.body.focusPairs.every((p: { hasGolden: boolean }) => p.hasGolden)).toBe(true);
    expect(res.body.languages.strategicAfrican).toBeGreaterThanOrEqual(3);
  });
});
