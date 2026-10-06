import { Injectable } from '@nestjs/common';
import { LanguagesService } from '../../languages/languages.service';
import { LocalesService } from '../../locales/locales.service';
import { CountryPacksService } from '../../country-packs/country-packs.service';
import { StyleService } from '../../style/style.service';
import { languageProductCatalog } from '../language-products.catalog';
import type { LanguageRegistryPort, LanguageRow, LocaleRow, CountryRow, StyleProfileRow } from './ports';

@Injectable
export class NestLanguageRegistryAdapter implements LanguageRegistryPort {
  constructor(
    private readonly languages: LanguagesService,
    private readonly locales: LocalesService,
    private readonly countryPacks: CountryPacksService,
    private readonly style: StyleService,
  ) {}

  async listLanguages: Promise<LanguageRow[]> {
    const rows = await this.languages.list;
    return rows.map((r) => ({
      code: r.code,
      nameEn: r.nameEn,
      nameNative: r.nameNative,
      script: r.script,
      familyCode: r.familyCode,
      rtl: r.rtl,
      tier: r.tier,
    }));
  }

  async listLocalePacks: Promise<LocaleRow[]> {
    const rows = await this.locales.list;
    return rows.map((r) => ({
      languageCode: r.languageCode,
      bcp47: r.bcp47,
      currencyCode: r.currencyCode,
      culturalNotes: r.culturalNotes,
    }));
  }

  async listCountryPacks(region?: string): Promise<CountryRow[]> {
    const res = await this.countryPacks.list(region);
    return res.data.map((p) => ({
      code: p.code,
      nameEn: p.nameEn,
      region: p.region,
      currencyCode: p.currencyCode,
      primaryLanguages: p.primaryLanguages,
      bcp47Tags: p.bcp47Tags,
    }));
  }

  listStyleProfiles: StyleProfileRow[] {
    return this.style.profiles.data;
  }

  listLanguageProducts {
    return languageProductCatalog;
  }
}
