import { Injectable } from '@nestjs/common';
import { explainabilityPlatformEngineCatalog } from './explainability-platform.catalog';

@Injectable
export class ExplainabilityPlatformService {
  engine {
    return explainabilityPlatformEngineCatalog;
  }

  list(query?: string) {
    const catalog = this.engine as {
      explanations: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim.toLowerCase;
    const rows = catalog.explanations.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
    });
    return {
      explanations: rows,
      count: rows.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'explainability',
      count: (catalog as { explanations: unknown[] }).explanations.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'ExplainabilityPlatform monitoring snapshot.',
    };
  }
}
