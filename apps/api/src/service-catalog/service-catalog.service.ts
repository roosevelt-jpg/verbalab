import { Injectable } from '@nestjs/common';
import { serviceCatalogEngineCatalog } from './service-catalog.catalog';

@Injectable()
export class ServiceCatalogService {
  engine() {
    return serviceCatalogEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine() as {
      services: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.services.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      services: rows,
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
      mode: 'service-catalog',
      count: (catalog as { services: unknown[] }).services.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'ServiceCatalog monitoring snapshot (VL-304).',
    };
  }
}
