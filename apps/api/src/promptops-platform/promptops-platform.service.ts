import { Injectable } from '@nestjs/common';
import { promptopsPlatformEngineCatalog } from './promptops-platform.catalog';

@Injectable()
export class PromptopsPlatformService {
  engine() {
    return promptopsPlatformEngineCatalog();
  }

  prompts(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const prompts = catalog.prompts.filter((p) => {
      if (!q) return true;
      return (
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q)
      );
    });
    return {
      prompts,
      count: prompts.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.prompts(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'promptops',
      capabilityCount: catalog.capabilities.length,
      promptCount: catalog.prompts.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'PromptOps Platform monitoring snapshot.',
    };
  }
}
