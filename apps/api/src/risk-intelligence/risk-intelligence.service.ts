import { Injectable } from '@nestjs/common';
import { riskIntelligenceEngineCatalog } from './risk-intelligence.catalog';

@Injectable
export class RiskIntelligenceService {
  engine {
    return riskIntelligenceEngineCatalog;
  }

  list(query?: string) {
    const catalog = this.engine as {
      scores: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim.toLowerCase;
    const rows = catalog.scores.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
    });
    return {
      scores: rows,
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
      mode: 'risk',
      count: (catalog as { scores: unknown[] }).scores.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'RiskIntelligence monitoring snapshot.',
    };
  }
}
