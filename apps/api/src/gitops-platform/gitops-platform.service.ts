import { Injectable } from '@nestjs/common';
import { gitopsPlatformEngineCatalog } from './gitops-platform.catalog';

@Injectable()
export class GitopsPlatformService {
  engine() {
    return gitopsPlatformEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine() as {
      readiness: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.readiness.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      readiness: rows,
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
      mode: 'gitops-platform',
      count: (catalog as { readiness: unknown[] }).readiness.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'GitopsPlatform monitoring snapshot.',
    };
  }
}
