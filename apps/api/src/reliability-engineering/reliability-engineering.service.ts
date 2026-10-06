import { Injectable } from '@nestjs/common';
import { reliabilityEngineeringEngineCatalog } from './reliability-engineering.catalog';

@Injectable()
export class ReliabilityEngineeringService {
  engine() {
    return reliabilityEngineeringEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine() as {
      reliability: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.reliability.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      reliability: rows,
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
      mode: 'reliability-engineering',
      count: (catalog as { reliability: unknown[] }).reliability.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'ReliabilityEngineering monitoring snapshot.',
    };
  }
}
