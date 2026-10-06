import { Controller, Get, Param } from '@nestjs/common';
import { LanguagesService } from './languages.service';

@Controller('v1/languages')
export class LanguagesController {
  constructor(private readonly languages: LanguagesService) {}

  @Get('engine')
  engine() {
    return this.languages.engine();
  }

  @Get()
  async list() {
    const items = await this.languages.list();
    return {
      data: items.map((lang) => ({
        code: lang.code,
        name: lang.nameEn,
        nativeName: lang.nameNative,
        script: lang.script,
        familyCode: lang.familyCode,
        familyName: lang.family?.nameEn ?? null,
        rtl: lang.rtl,
        tier: lang.tier,
      })),
    };
  }

  @Get(':code')
  async get(@Param('code') code: string) {
    const lang = await this.languages.get(code);
    return {
      code: lang.code,
      name: lang.nameEn,
      nativeName: lang.nameNative,
      script: lang.script,
      familyCode: lang.familyCode,
      family: lang.family
        ? { code: lang.family.code, nameEn: lang.family.nameEn, notes: lang.family.notes }
        : null,
      rtl: lang.rtl,
      tier: lang.tier,
      localePack: lang.localePack
        ? {
            bcp47: lang.localePack.bcp47,
            currencyCode: lang.localePack.currencyCode,
            culturalNotes: lang.localePack.culturalNotes,
          }
        : null,
      dialects: lang.dialects.map((d) => ({
        code: d.code,
        nameEn: d.nameEn,
        region: d.region,
      })),
      accents: lang.accents.map((a) => ({
        code: a.code,
        nameEn: a.nameEn,
        region: a.region,
      })),
      linguisticRules: lang.linguisticRules.map((r) => ({
        code: r.code,
        kind: r.kind,
        nameEn: r.nameEn,
      })),
    };
  }
}
