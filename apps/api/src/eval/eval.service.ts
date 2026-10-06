import { Injectable } from '@nestjs/common';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { GatewayService } from '../gateway/gateway.service';
import { LanguagesService } from '../languages/languages.service';
import { GOLDEN_PAIRS, pairKey, type GoldenPair } from './goldens';
import { scorePair, type PairScoreSummary } from './metrics';

export type EvalRunMode = 'fixture' | 'live' | 'reference_oracle';

export type CoveragePairRow = {
  sourceLang: string;
  targetLang: string;
  inRegistry: boolean;
  hasGolden: boolean;
  evalStatus: 'unevaluated' | 'evaluated';
  segmentCount: number;
  exactMatchRate: number | null;
  meanCharSimilarity: number | null;
  mode: EvalRunMode | null;
  asOf: string | null;
};

export type CoverageSnapshot = {
  asOf: string;
  mode: EvalRunMode;
  disclaimer: string;
  focusPairs: string[];
  pairs: Array<{
    sourceLang: string;
    targetLang: string;
    segmentCount: number;
    exactMatchRate: number;
    meanCharSimilarity: number;
  }>;
};

const DISCLAIMER =
  'Scores are automatic reference metrics on small golden sets (exact match + character similarity). They measure harness output against references — not market leadership or human quality.';

@Injectable()
export class EvalService {
  private lastSnapshot: CoverageSnapshot | null = null;

  constructor(
    private readonly gateway: GatewayService,
    private readonly languages: LanguagesService,
  ) {
    this.lastSnapshot = this.readCommittedSnapshot();
  }

  listGoldenPairs(): GoldenPair[] {
    return GOLDEN_PAIRS;
  }

  resultsPath() {
    return join(process.cwd(), 'eval', 'results', 'latest.json');
  }

  private readCommittedSnapshot(): CoverageSnapshot | null {
    try {
      const path = this.resultsPath();
      if (!existsSync(path)) return null;
      return JSON.parse(readFileSync(path, 'utf8')) as CoverageSnapshot;
    } catch {
      return null;
    }
  }

  writeSnapshot(snapshot: CoverageSnapshot) {
    const path = this.resultsPath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    this.lastSnapshot = snapshot;
    return snapshot;
  }

  getSnapshot(): CoverageSnapshot | null {
    return this.lastSnapshot ?? this.readCommittedSnapshot();
  }

  async runPair(
    pair: GoldenPair,
    mode: EvalRunMode = 'fixture',
  ): Promise<PairScoreSummary> {
    const rows: { id: string; hypothesis: string; reference: string }[] = [];

    for (const segment of pair.segments) {
      let hypothesis: string;
      if (mode === 'reference_oracle') {
        hypothesis = segment.reference;
      } else {
        const result = await this.gateway.translate({
          text: segment.source,
          source: pair.sourceLang,
          target: pair.targetLang,
        });
        hypothesis = result.text;
      }
      rows.push({
        id: segment.id,
        hypothesis,
        reference: segment.reference,
      });
    }

    return scorePair({
      sourceLang: pair.sourceLang,
      targetLang: pair.targetLang,
      rows,
    });
  }

  async runAll(mode: EvalRunMode = 'fixture'): Promise<CoverageSnapshot> {
    const summaries: PairScoreSummary[] = [];
    for (const pair of GOLDEN_PAIRS) {
      summaries.push(await this.runPair(pair, mode));
    }

    const snapshot: CoverageSnapshot = {
      asOf: new Date().toISOString(),
      mode,
      disclaimer: DISCLAIMER,
      focusPairs: GOLDEN_PAIRS.map((p) => pairKey(p.sourceLang, p.targetLang)),
      pairs: summaries.map((s) => ({
        sourceLang: s.sourceLang,
        targetLang: s.targetLang,
        segmentCount: s.segmentCount,
        exactMatchRate: Number(s.exactMatchRate.toFixed(4)),
        meanCharSimilarity: Number(s.meanCharSimilarity.toFixed(4)),
      })),
    };

    return this.writeSnapshot(snapshot);
  }

  async coverageMatrix() {
    const langs = await this.languages.list();
    const codes = new Set(langs.map((l) => l.code));
    const snapshot = this.getSnapshot();
    const evaluated = new Map(
      (snapshot?.pairs ?? []).map((p) => [pairKey(p.sourceLang, p.targetLang), p]),
    );

    const focus = GOLDEN_PAIRS.map((pair) => {
      const key = pairKey(pair.sourceLang, pair.targetLang);
      const scored = evaluated.get(key);
      return {
        sourceLang: pair.sourceLang,
        targetLang: pair.targetLang,
        inRegistry: codes.has(pair.sourceLang) && codes.has(pair.targetLang),
        hasGolden: true,
        evalStatus: scored ? ('evaluated' as const) : ('unevaluated' as const),
        segmentCount: scored?.segmentCount ?? pair.segments.length,
        exactMatchRate: scored?.exactMatchRate ?? null,
        meanCharSimilarity: scored?.meanCharSimilarity ?? null,
        mode: scored ? snapshot!.mode : null,
        asOf: scored ? snapshot!.asOf : null,
      } satisfies CoveragePairRow;
    });

    const strategic = langs.filter((l) => l.tier === 'strategic_african');

    return {
      disclaimer: DISCLAIMER,
      asOf: snapshot?.asOf ?? null,
      lastEvalMode: snapshot?.mode ?? null,
      focusPairs: focus,
      languages: {
        total: langs.length,
        strategicAfrican: strategic.length,
        codes: langs.map((l) => ({
          code: l.code,
          name: l.nameEn,
          tier: l.tier,
          script: l.script,
        })),
      },
      note:
        'Translate is available for registry languages via the vendor gateway. Only focusPairs currently have golden sets and scored runs.',
    };
  }
}
