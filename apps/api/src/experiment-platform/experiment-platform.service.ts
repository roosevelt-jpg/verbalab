import { Injectable } from '@nestjs/common';
import { experimentPlatformEngineCatalog } from './experiment-platform.catalog';

@Injectable()
export class ExperimentPlatformService {
  engine() {
    return experimentPlatformEngineCatalog();
  }

  runs(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const runs = catalog.runs.filter((r) => {
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.datasetId.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q)
      );
    });
    return {
      runs,
      count: runs.length,
      honesty: catalog.honesty,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.runs(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'experiment',
      runCount: catalog.runs.length,
      honesty: catalog.honesty,
      note: 'Experiment Platform monitoring snapshot (VL-272).',
    };
  }
}
