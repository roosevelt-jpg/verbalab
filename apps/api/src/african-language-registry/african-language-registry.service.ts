import { Injectable } from '@nestjs/common';
import {
  africanLanguageRegistryEngineCatalog,
  africanLanguageSeed,
  africanLanguageFamilies,
} from './african-language-registry.catalog';

@Injectable()
export class AfricanLanguageRegistryService {
  engine() {
    return africanLanguageRegistryEngineCatalog();
  }

  languages(query?: string) {
    const q = (query ?? '').trim().toLowerCase();
    const languages = africanLanguageSeed().filter((l) => {
      if (!q) return true;
      return (
        l.code.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.family.toLowerCase().includes(q)
      );
    });
    return {
      languages,
      count: languages.length,
      coverageComplete: false,
      honesty: this.engine().honesty,
      docs: '/docs/AFRICAN_LANGUAGE_REGISTRY.md',
    };
  }

  families() {
    return {
      families: africanLanguageFamilies(),
      coverageComplete: false,
      honesty: this.engine().honesty,
    };
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'registry',
      languageCount: catalog.languages.length,
      honesty: catalog.honesty,
      note: 'African Language Registry monitoring snapshot (VL-261).',
    };
  }
}
