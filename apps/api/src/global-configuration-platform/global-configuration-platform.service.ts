import { Injectable } from '@nestjs/common';
import { globalConfigurationPlatformEngineCatalog } from './global-configuration-platform.catalog';

@Injectable
export class GlobalConfigurationPlatformService {
  engine {
    return globalConfigurationPlatformEngineCatalog;
  }

  list(query?: string) {
    const catalog = this.engine as {
      configurations: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim.toLowerCase;
    const rows = catalog.configurations.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
    });
    return {
      configurations: rows,
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
      mode: 'global-configuration-platform',
      count: (catalog as { configurations: unknown[] }).configurations.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'GlobalConfigurationPlatform monitoring snapshot.',
    };
  }
}
