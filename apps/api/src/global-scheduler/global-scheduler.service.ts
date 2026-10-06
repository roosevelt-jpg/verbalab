import { Injectable } from '@nestjs/common';
import { globalSchedulerEngineCatalog } from './global-scheduler.catalog';

@Injectable()
export class GlobalSchedulerService {
  engine() {
    return globalSchedulerEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine() as {
      schedules: Array<Record<string, unknown> & { id: string; notes?: string }>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    };
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.schedules.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      schedules: rows,
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
      mode: 'global-scheduler',
      count: (catalog as { schedules: unknown[] }).schedules.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'GlobalScheduler monitoring snapshot (VL-321).',
    };
  }
}
