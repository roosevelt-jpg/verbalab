import { Injectable } from '@nestjs/common';
import { trainingPipelineEngineCatalog } from './training-pipeline.catalog';

@Injectable
export class TrainingPipelineService {
  engine {
    return trainingPipelineEngineCatalog;
  }

  jobs(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const jobs = catalog.jobs.filter((j) => {
      if (!q) return true;
      return (
        j.id.toLowerCase.includes(q) ||
        j.name.toLowerCase.includes(q) ||
        j.method.toLowerCase.includes(q) ||
        j.notes.toLowerCase.includes(q)
      );
    });
    return {
      jobs,
      count: jobs.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.jobs(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'training',
      methodCount: catalog.methods.length,
      jobCount: catalog.jobs.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Training Pipeline monitoring snapshot.',
    };
  }
}
