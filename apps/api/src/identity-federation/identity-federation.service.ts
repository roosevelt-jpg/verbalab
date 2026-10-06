import { Injectable } from '@nestjs/common';
import { identityFederationEngineCatalog } from './identity-federation.catalog';

@Injectable
export class IdentityFederationService {
  engine {
    return identityFederationEngineCatalog;
  }

  list(query?: string) {
    const catalog = this.engine as {
      federation: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim.toLowerCase;
    const rows = catalog.federation.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
    });
    return {
      federation: rows,
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
      mode: 'identity',
      count: (catalog as { federation: unknown[] }).federation.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'IdentityFederation monitoring snapshot.',
    };
  }
}
