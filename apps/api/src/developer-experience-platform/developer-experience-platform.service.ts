import { Injectable } from '@nestjs/common';
import { developerExperiencePlatformEngineCatalog } from './developer-experience-platform.catalog';

@Injectable()
export class DeveloperExperiencePlatformService {
  engine() {
    return developerExperiencePlatformEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine() as {
      devex: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.devex.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      devex: rows,
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

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'developer-experience-platform',
      count: (catalog as { devex: unknown[] }).devex.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'DeveloperExperiencePlatform monitoring snapshot (VL-311).',
    };
  }
}
