import { Injectable } from '@nestjs/common';
import { patentInnovationPlatformEngineCatalog } from './patent-innovation-platform.catalog';

@Injectable
export class PatentInnovationPlatformService {
  engine {
    return patentInnovationPlatformEngineCatalog;
  }

  portfolio(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const portfolio = catalog.portfolio.filter((p) => {
      if (!q) return true;
      return (
        p.id.toLowerCase.includes(q) ||
        p.title.toLowerCase.includes(q) ||
        p.disclosureStatus.toLowerCase.includes(q) ||
        p.notes.toLowerCase.includes(q)
      );
    });
    return {
      portfolio,
      count: portfolio.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.portfolio(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'patent',
      portfolioCount: catalog.portfolio.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Patent & Innovation Platform monitoring snapshot.',
    };
  }
}
