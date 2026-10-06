import { Injectable } from '@nestjs/common';
import { educationIntelligenceEngineCatalog } from './education-intelligence.catalog';

@Injectable()
export class EducationIntelligenceService {
  engine() {
    return educationIntelligenceEngineCatalog();
  }

  terms(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const terms = catalog.terms.filter((t) => {
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q)
      );
    });
    return {
      terms,
      count: terms.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.terms(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'domain',
      domain: 'education',
      termCount: catalog.terms.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Education Intelligence monitoring snapshot.',
    };
  }
}
