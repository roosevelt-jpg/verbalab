import { Injectable, OnModuleInit, OnApplicationBootstrap, HttpStatus } from '@nestjs/common';
import { LinguisticRuleKind, WritingSystemKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { seedFamiliesAndScripts, seedLinguisticRules } from './registry-seed';

export type RegistryValidateInput = {
  language?: string;
  dialect?: string;
  accent?: string;
  locale?: string;
  script?: string;
  family?: string;
  rule?: string;
  bcp47?: string;
};

@Injectable()
export class RegistryService implements OnModuleInit, OnApplicationBootstrap {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (!this.prisma.isReady()) {
      return;
    }
    await seedFamiliesAndScripts(this.prisma);
  }

  /** Rules reference language codes — run after LanguagesService seeds. */
  async onApplicationBootstrap() {
    if (!this.prisma.isReady()) {
      return;
    }
    await seedLinguisticRules(this.prisma);
  }

  async overview() {
    const [
      languages,
      families,
      writingSystems,
      dialects,
      accents,
      locales,
      countries,
      rules,
      alphabets,
      pronunciationRules,
      grammarRules,
      phoneticRules,
      morphologyRules,
    ] = await Promise.all([
      this.prisma.language.count(),
      this.prisma.languageFamily.count(),
      this.prisma.writingSystem.count(),
      this.prisma.dialect.count(),
      this.prisma.accent.count(),
      this.prisma.localePack.count(),
      this.prisma.countryPack.count(),
      this.prisma.linguisticRule.count(),
      this.prisma.writingSystem.count({ where: { kind: WritingSystemKind.alphabet } }),
      this.prisma.linguisticRule.count({ where: { kind: LinguisticRuleKind.pronunciation } }),
      this.prisma.linguisticRule.count({ where: { kind: LinguisticRuleKind.grammar } }),
      this.prisma.linguisticRule.count({ where: { kind: LinguisticRuleKind.phonetic } }),
      this.prisma.linguisticRule.count({ where: { kind: LinguisticRuleKind.morphology } }),
    ]);

    return {
      product: 'Enterprise Language Registry',
      note:
        'Curated enterprise catalog of every registered language, dialect, writing system, locale, and linguistic rule — not Ethnologue / CLDR parity.',
      counts: {
        languages,
        families,
        writingSystems,
        scripts: writingSystems,
        alphabets,
        dialects,
        accents,
        locales,
        countries,
        linguisticRules: rules,
        pronunciationRules,
        grammarRules,
        phoneticRules,
        morphologyRules,
      },
      links: {
        languages: '/v1/languages',
        families: '/v1/registry/families',
        scripts: '/v1/registry/scripts',
        writingSystems: '/v1/registry/writing-systems',
        alphabets: '/v1/registry/alphabets',
        dialects: '/v1/dialects',
        accents: '/v1/accents',
        locales: '/v1/locales',
        countries: '/v1/country-packs',
        rules: '/v1/registry/rules',
        validate: '/v1/registry/validate',
        analytics: '/v1/registry/analytics',
        health: '/v1/registry/health',
        console: '/registry',
        docs: '/docs/LANGUAGE_REGISTRY.md',
      },
    };
  }

  listFamilies() {
    return this.prisma.languageFamily.findMany({ orderBy: { code: 'asc' } });
  }

  async getFamily(code: string) {
    const family = await this.prisma.languageFamily.findUnique({
      where: { code: code.toLowerCase() },
      include: { languages: { orderBy: { code: 'asc' } } },
    });
    if (!family) {
      throw new ApiException('not_found', `Family "${code}" not found`, HttpStatus.NOT_FOUND);
    }
    return {
      code: family.code,
      nameEn: family.nameEn,
      parentCode: family.parentCode,
      notes: family.notes,
      languages: family.languages.map((l) => ({
        code: l.code,
        nameEn: l.nameEn,
        script: l.script,
        tier: l.tier,
      })),
    };
  }

  listWritingSystems(kind?: WritingSystemKind) {
    return this.prisma.writingSystem.findMany({
      where: kind ? { kind } : undefined,
      orderBy: { code: 'asc' },
    });
  }

  async getWritingSystem(code: string) {
    const script = await this.prisma.writingSystem.findUnique({
      where: { code },
    });
    if (!script) {
      throw new ApiException('not_found', `Writing system "${code}" not found`, HttpStatus.NOT_FOUND);
    }
    const languages = await this.prisma.language.findMany({
      where: { script: script.code },
      orderBy: { code: 'asc' },
      select: { code: true, nameEn: true, tier: true, rtl: true },
    });
    return { ...script, languages };
  }

  listRules(filters: { kind?: LinguisticRuleKind; language?: string }) {
    return this.prisma.linguisticRule.findMany({
      where: {
        kind: filters.kind,
        languageCode: filters.language || undefined,
      },
      orderBy: { code: 'asc' },
    });
  }

  async getRule(code: string) {
    const rule = await this.prisma.linguisticRule.findUnique({ where: { code } });
    if (!rule) {
      throw new ApiException('not_found', `Rule "${code}" not found`, HttpStatus.NOT_FOUND);
    }
    return rule;
  }

  async validate(input: RegistryValidateInput) {
    const errors: string[] = [];
    const resolved: Record<string, unknown> = {};

    if (input.language) {
      const lang = await this.prisma.language.findUnique({ where: { code: input.language } });
      if (!lang) errors.push(`language "${input.language}" is not in the registry`);
      else resolved.language = lang;
    }
    if (input.dialect) {
      const dialect = await this.prisma.dialect.findUnique({ where: { code: input.dialect } });
      if (!dialect) errors.push(`dialect "${input.dialect}" is not in the registry`);
      else {
        resolved.dialect = dialect;
        if (input.language && dialect.languageCode !== input.language) {
          errors.push(
            `dialect "${input.dialect}" belongs to ${dialect.languageCode}, not ${input.language}`,
          );
        }
      }
    }
    if (input.accent) {
      const accent = await this.prisma.accent.findUnique({ where: { code: input.accent } });
      if (!accent) errors.push(`accent "${input.accent}" is not in the registry`);
      else {
        resolved.accent = accent;
        if (input.language && accent.languageCode !== input.language) {
          errors.push(
            `accent "${input.accent}" belongs to ${accent.languageCode}, not ${input.language}`,
          );
        }
      }
    }
    if (input.locale) {
      const locale = await this.prisma.localePack.findUnique({
        where: { languageCode: input.locale },
      });
      if (!locale) errors.push(`locale pack "${input.locale}" is not in the registry`);
      else resolved.locale = locale;
    }
    if (input.script) {
      const script = await this.prisma.writingSystem.findUnique({ where: { code: input.script } });
      if (!script) errors.push(`script "${input.script}" is not in the registry`);
      else resolved.script = script;
    }
    if (input.family) {
      const family = await this.prisma.languageFamily.findUnique({
        where: { code: input.family.toLowerCase() },
      });
      if (!family) errors.push(`family "${input.family}" is not in the registry`);
      else resolved.family = family;
    }
    if (input.rule) {
      const rule = await this.prisma.linguisticRule.findUnique({ where: { code: input.rule } });
      if (!rule) errors.push(`rule "${input.rule}" is not in the registry`);
      else resolved.rule = rule;
    }
    if (input.bcp47) {
      const tag = input.bcp47.trim();
      const langPart = tag.split(/[-_]/)[0]?.toLowerCase();
      if (!langPart) errors.push('bcp47 tag is empty');
      else {
        const lang = await this.prisma.language.findUnique({ where: { code: langPart } });
        if (!lang) errors.push(`bcp47 language subtag "${langPart}" is not in the registry`);
        else resolved.bcp47Language = lang;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      resolved,
      note: 'Validates codes against the curated Lugemi registry only.',
    };
  }

  async analytics() {
    const [byTier, byFamily, byScript, byRuleKind, byWritingKind] = await Promise.all([
      this.prisma.language.groupBy({ by: ['tier'], _count: { _all: true } }),
      this.prisma.language.groupBy({ by: ['familyCode'], _count: { _all: true } }),
      this.prisma.language.groupBy({ by: ['script'], _count: { _all: true } }),
      this.prisma.linguisticRule.groupBy({ by: ['kind'], _count: { _all: true } }),
      this.prisma.writingSystem.groupBy({ by: ['kind'], _count: { _all: true } }),
    ]);

    const overview = await this.overview();
    return {
      asOf: new Date().toISOString(),
      counts: overview.counts,
      languagesByTier: byTier.map((r) => ({ tier: r.tier, count: r._count._all })),
      languagesByFamily: byFamily.map((r) => ({
        familyCode: r.familyCode,
        count: r._count._all,
      })),
      languagesByScript: byScript.map((r) => ({ script: r.script, count: r._count._all })),
      rulesByKind: byRuleKind.map((r) => ({ kind: r.kind, count: r._count._all })),
      writingSystemsByKind: byWritingKind.map((r) => ({ kind: r.kind, count: r._count._all })),
      note: 'Registry coverage analytics — not org usage metering (see /v1/analytics).',
    };
  }

  async health() {
    const languages = await this.prisma.language.findMany({
      select: { code: true, script: true, familyCode: true },
    });
    const scripts = new Set(
      (await this.prisma.writingSystem.findMany({ select: { code: true } })).map((s) => s.code),
    );
    const families = new Set(
      (await this.prisma.languageFamily.findMany({ select: { code: true } })).map((f) => f.code),
    );

    const issues: string[] = [];
    for (const lang of languages) {
      if (lang.script && !scripts.has(lang.script)) {
        issues.push(`language script not in writing_systems: ${lang.code}:${lang.script}`);
      }
      if (lang.familyCode && !families.has(lang.familyCode)) {
        issues.push(`language family not in language_families: ${lang.code}:${lang.familyCode}`);
      }
    }

    const overview = await this.overview();
    return {
      status: issues.length === 0 ? ('ok' as const) : ('degraded' as const),
      issues,
      counts: overview.counts,
      checkedAt: new Date().toISOString(),
    };
  }
}
