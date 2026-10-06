import { Injectable } from '@nestjs/common';
import { compliancePlatformEngineCatalog } from './compliance-platform.catalog';

@Injectable
export class CompliancePlatformService {
  engine {
    return compliancePlatformEngineCatalog;
  }

  list(query?: string) {
    const catalog = this.engine as {
      controls: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim.toLowerCase;
    const rows = catalog.controls.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
    });
    return {
      controls: rows,
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
      mode: 'compliance',
      count: (catalog as { controls: unknown[] }).controls.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'CompliancePlatform monitoring snapshot.',
    };
  }
}
