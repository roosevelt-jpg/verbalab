import { Injectable } from '@nestjs/common';
import { researchAnalyticsEngineCatalog } from './research-analytics.catalog';
import { experimentPlatformEngineCatalog } from '../experiment-platform/experiment-platform.catalog';
import { aiPublicationPlatformEngineCatalog } from '../ai-publication-platform/ai-publication-platform.catalog';
import { patentInnovationPlatformEngineCatalog } from '../patent-innovation-platform/patent-innovation-platform.catalog';
import { benchmarkPlatformEngineCatalog } from '../benchmark-platform/benchmark-platform.catalog';
import { researchCloudProductCatalog } from '../research-cloud/research-cloud.catalog';

@Injectable()
export class ResearchAnalyticsService {
  engine() {
    const base = researchAnalyticsEngineCatalog();
    const experiments = experimentPlatformEngineCatalog();
    const publications = aiPublicationPlatformEngineCatalog();
    const patents = patentInnovationPlatformEngineCatalog();
    const benchmarks = benchmarkPlatformEngineCatalog();
    const products = researchCloudProductCatalog();
    return {
      ...base,
      snapshot: {
        ...base.snapshot,
        experiments: {
          trackedRuns: experiments.runs.length,
          completed: experiments.runs.filter((r) => r.status === 'completed').length,
          running: experiments.runs.filter((r) => r.status === 'running').length,
        },
        publications: {
          records: publications.publications.length,
          withDoi: publications.publications.filter((p) => p.doi).length,
          doiRegistryOs: false,
        },
        patents: {
          portfolioItems: patents.portfolio.length,
          usptoOs: false,
        },
        researchRoi: {
          mode: 'catalog_proxy',
          note: 'ROI is a catalog proxy from shipped Research Cloud surfaces — not finance-grade ROI.',
          shippedProducts: products.filter((p) => p.status === 'shipped').length,
        },
        benchmarkImprovements: {
          translationBleuSeed:
            benchmarks.leaderboard.find((r) => r.suiteId === 'translation')?.score ?? null,
          speechWerSeed: benchmarks.leaderboard.find((r) => r.suiteId === 'speech')?.score ?? null,
          publicLeaderboardOs: false,
        },
      },
      computedFromSiblings: true,
    };
  }

  snapshot(_query?: string) {
    const engine = this.engine();
    return {
      snapshot: engine.snapshot,
      honesty: engine.honesty,
      note: engine.note,
      docs: engine.docs,
      computedFromSiblings: true,
    };
  }

  query(query?: string) {
    return this.snapshot(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'analytics',
      shippedProducts: researchCloudProductCatalog().filter((p) => p.status === 'shipped').length,
      honesty: catalog.honesty,
      note: 'Research Analytics monitoring snapshot (VL-279).',
    };
  }
}
