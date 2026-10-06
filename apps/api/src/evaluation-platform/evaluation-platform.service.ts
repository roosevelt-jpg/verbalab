import { Injectable } from '@nestjs/common';
import { evaluationPlatformEngineCatalog } from './evaluation-platform.catalog';

@Injectable()
export class EvaluationPlatformService {
  engine() {
    return evaluationPlatformEngineCatalog();
  }

  capabilities(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const capabilities = catalog.capabilities.filter((c) => {
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
      );
    });
    return {
      capabilities,
      count: capabilities.length,
      extends: catalog.extends,
      honesty: catalog.honesty,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.capabilities(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'evaluation',
      capabilityCount: catalog.capabilities.length,
      honesty: catalog.honesty,
      note: 'Evaluation Platform monitoring snapshot (VL-275).',
    };
  }
}
