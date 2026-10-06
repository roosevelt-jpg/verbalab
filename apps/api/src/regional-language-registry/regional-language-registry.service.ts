import { Injectable } from '@nestjs/common';
import {
  languagesForRegion,
  parseWorldRegion,
  regionalCountsByRegion,
  regionalLanguageRegistryEngineCatalog,
  WORLD_REGIONS,
} from './regional-language-registry.catalog';

@Injectable()
export class RegionalLanguageRegistryService {
  engine() {
    return regionalLanguageRegistryEngineCatalog();
  }

  regions() {
    const counts = regionalCountsByRegion();
    return {
      regions: WORLD_REGIONS.map((r) => ({ ...r, count: counts[r.id] })),
      counts,
      africaFirst: true,
      defaultDemoPair: { source: 'en', target: 'ak', locale: 'ak-GH' },
    };
  }

  languages(regionRaw?: string, query?: string) {
    const region = parseWorldRegion(regionRaw);
    const q = (query ?? '').trim().toLowerCase();
    const languages = languagesForRegion(region).filter((l) => {
      if (!q) return true;
      return (
        l.code.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        (l.nativeName ?? '').toLowerCase().includes(q) ||
        l.family.toLowerCase().includes(q) ||
        l.dialects.some((d) => d.toLowerCase().includes(q)) ||
        l.accents.some((a) => a.toLowerCase().includes(q)) ||
        (l.lifestyle?.habits ?? []).some((h) => h.toLowerCase().includes(q)) ||
        (l.lifestyle?.routines ?? []).some((h) => h.toLowerCase().includes(q))
      );
    });
    const honesty = this.engine().honesty;
    return {
      region,
      languages,
      count: languages.length,
      counts: regionalCountsByRegion(),
      coverageComplete: honesty.coverageComplete,
      honesty,
      docs: '/docs/AFRICAN_LANGUAGE_REGISTRY.md',
    };
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'registry',
      languageCount: catalog.languages.length,
      counts: catalog.counts,
      honesty: catalog.honesty,
      note: 'Regional Language Registry monitoring snapshot.',
    };
  }
}
