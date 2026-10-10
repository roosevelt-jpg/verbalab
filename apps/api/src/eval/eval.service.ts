import { Injectable } from '@nestjs/common';
import { LanguageTier } from '@prisma/client';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { GatewayService } from '../gateway/gateway.service';
import { LanguagesService } from '../languages/languages.service';
import { LANGUAGE_SEEDS } from '../languages/language-seeds';
import {
  allRegionalLanguageEntries,
  regionalCountsByRegion,
} from '../regional-language-registry/region-catalogs';
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
    // Prefer DB/seed registry; never fail the public matrix if Prisma is soft-skipped or empty.
    let langs: Array<{
      code: string;
      nameEn: string;
      tier: LanguageTier | string;
      script: string | null | undefined;
    }> = [];
    try {
      langs = await this.languages.list();
    } catch {
      langs = [];
    }
    if (!langs.length) {
      langs = LANGUAGE_SEEDS.map((lang) => ({
        code: lang.code,
        nameEn: lang.nameEn,
        tier:
          lang.tier === 'strategic_african'
            ? LanguageTier.strategic_african
            : LanguageTier.vendor,
        script: lang.script ?? null,
      }));
    }

    const tierByCode = new Map(langs.map((l) => [l.code, l]));
    const regional = allRegionalLanguageEntries();
    const regionalCounts = regionalCountsByRegion();

    // Worldwide live set: regional registry (Africa-first sort) merged with core seed tiers.
    // Regional entries cover Africa + SEA/MENA/EU/UK/LATAM/NA; seeds fill any remaining codes.
    const seen = new Set<string>();
    const codes: Array<{
      code: string;
      name: string;
      tier: string;
      script: string | null;
      worldRegions: string[];
    }> = [];

    for (const row of regional) {
      seen.add(row.code);
      const seeded = tierByCode.get(row.code);
      codes.push({
        code: row.code,
        name: row.name,
        tier: String(seeded?.tier ?? (row.worldRegions.includes('africa') ? 'strategic_african' : 'vendor')),
        script: seeded?.script ?? row.writingSystems[0] ?? null,
        worldRegions: row.worldRegions,
      });
    }
    for (const lang of langs) {
      if (seen.has(lang.code)) continue;
      seen.add(lang.code);
      codes.push({
        code: lang.code,
        name: lang.nameEn,
        tier: String(lang.tier),
        script: lang.script ?? null,
        worldRegions: lang.tier === LanguageTier.strategic_african || lang.tier === 'strategic_african'
          ? ['africa', 'global']
          : ['global'],
      });
    }

    const registryCodes = new Set(codes.map((c) => c.code));
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
        inRegistry: registryCodes.has(pair.sourceLang) && registryCodes.has(pair.targetLang),
        hasGolden: true,
        evalStatus: scored ? ('evaluated' as const) : ('unevaluated' as const),
        segmentCount: scored?.segmentCount ?? pair.segments.length,
        exactMatchRate: scored?.exactMatchRate ?? null,
        meanCharSimilarity: scored?.meanCharSimilarity ?? null,
        mode: scored ? snapshot!.mode : null,
        asOf: scored ? snapshot!.asOf : null,
      } satisfies CoveragePairRow;
    });

    const strategicAfrican = codes.filter(
      (l) => l.tier === 'strategic_african' || l.worldRegions.includes('africa'),
    ).length;

    return {
      disclaimer: DISCLAIMER,
      asOf: snapshot?.asOf ?? null,
      lastEvalMode: snapshot?.mode ?? null,
      focusPairs: focus,
      languages: {
        total: codes.length,
        strategicAfrican,
        africaFirst: true,
        regionalCounts,
        codes,
      },
      source: 'live_registry',
      note:
        'Worldwide live registry (Africa-first) spanning Africa, SEA, MENA, EU, UK, LATAM, and NA. Translate is available for registry languages via the vendor gateway. Only focusPairs currently have golden sets and scored runs.',
    };
  }
}
