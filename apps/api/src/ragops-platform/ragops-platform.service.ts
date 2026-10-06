import { Injectable } from '@nestjs/common';
import { ragopsPlatformEngineCatalog } from './ragops-platform.catalog';

@Injectable
export class RagopsPlatformService {
  engine {
    return ragopsPlatformEngineCatalog;
  }

  pipelines(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const pipelines = catalog.pipelines.filter((p) => {
      if (!q) return true;
      return (
        p.id.toLowerCase.includes(q) ||
        p.name.toLowerCase.includes(q) ||
        p.stage.toLowerCase.includes(q) ||
        p.notes.toLowerCase.includes(q)
      );
    });
    return {
      pipelines,
      count: pipelines.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.pipelines(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'ragops',
      capabilityCount: catalog.capabilities.length,
      pipelineCount: catalog.pipelines.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'RAGOps Platform monitoring snapshot.',
    };
  }
}
