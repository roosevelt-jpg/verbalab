import { Injectable } from '@nestjs/common';
import { internalDeveloperPortalEngineCatalog } from './internal-developer-portal.catalog';

@Injectable()
export class InternalDeveloperPortalService {
  engine() {
    return internalDeveloperPortalEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine() as {
      portal: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.portal.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      portal: rows,
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
      mode: 'internal-developer-portal',
      count: (catalog as { portal: unknown[] }).portal.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'InternalDeveloperPortal monitoring snapshot (VL-303).',
    };
  }
}
