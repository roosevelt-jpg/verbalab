import { Injectable } from '@nestjs/common';
import { goldenPathPlatformEngineCatalog } from './golden-path-platform.catalog';

@Injectable
export class GoldenPathPlatformService {
  engine {
    return goldenPathPlatformEngineCatalog;
  }

  list(query?: string) {
    const catalog = this.engine as {
      templates: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim.toLowerCase;
    const rows = catalog.templates.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
    });
    return {
      templates: rows,
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
      mode: 'golden-path-platform',
      count: (catalog as { templates: unknown[] }).templates.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'GoldenPathPlatform monitoring snapshot.',
    };
  }
}
