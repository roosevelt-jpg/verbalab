import { Injectable } from '@nestjs/common';
import { globalRoutingControllerEngineCatalog } from './global-routing-controller.catalog';

@Injectable
export class GlobalRoutingControllerService {
  engine {
    return globalRoutingControllerEngineCatalog;
  }

  list(query?: string) {
    const catalog = this.engine as {
      routes: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim.toLowerCase;
    const rows = catalog.routes.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
    });
    return {
      routes: rows,
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
      mode: 'global-routing-controller',
      count: (catalog as { routes: unknown[] }).routes.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'GlobalRoutingController monitoring snapshot.',
    };
  }
}
