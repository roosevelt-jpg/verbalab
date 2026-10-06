import { Injectable } from '@nestjs/common';
import { releaseEngineeringEngineCatalog } from './release-engineering.catalog';

@Injectable()
export class ReleaseEngineeringService {
  engine() {
    return releaseEngineeringEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine() as {
      releases: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.releases.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      releases: rows,
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
      mode: 'release-engineering',
      count: (catalog as { releases: unknown[] }).releases.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'ReleaseEngineering monitoring snapshot.',
    };
  }
}
