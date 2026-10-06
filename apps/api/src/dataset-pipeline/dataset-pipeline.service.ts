import { Injectable } from '@nestjs/common';
import { datasetPipelineEngineCatalog } from './dataset-pipeline.catalog';

@Injectable()
export class DatasetPipelineService {
  engine() {
    return datasetPipelineEngineCatalog();
  }

  runs(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const pipelineRuns = catalog.pipelineRuns.filter((r) => {
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.stage.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q)
      );
    });
    return {
      pipelineRuns,
      count: pipelineRuns.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
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
      mode: 'dataset',
      capabilityCount: catalog.capabilities.length,
      runCount: catalog.pipelineRuns.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Dataset Pipeline monitoring snapshot (VL-282).',
    };
  }
}
