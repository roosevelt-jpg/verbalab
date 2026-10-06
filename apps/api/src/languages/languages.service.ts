import { Injectable, OnModuleInit } from '@nestjs/common';
import { LanguageTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LANGUAGE_SEEDS } from './language-seeds';
import { ApiException } from '../common/errors/api-exception';
import { HttpStatus } from '@nestjs/common';
import { seedFamiliesAndScripts } from '../registry/registry-seed';
import { languageEngineCatalog } from './language-engine.catalog';

@Injectable()
export class LanguagesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (!this.prisma.isReady()) {
      return;
    }
    await this.seedSafe();
  }

  engine() {
    return languageEngineCatalog();
  }

  /** Public entry used by dialects/accents — never throws on FK races. */
  async seed() {
    await this.seedSafe();
  }

  private async seedSafe() {
    try {
      await this.seedUnsafe();
    } catch (err) {
       
      console.warn(
        '[languages] seed skipped:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async seedUnsafe() {
    // Families must exist before language.family_code FK writes.
    await seedFamiliesAndScripts(this.prisma);

    for (const lang of LANGUAGE_SEEDS) {
      await this.prisma.language.upsert({
        where: { code: lang.code },
        create: {
          code: lang.code,
          nameEn: lang.nameEn,
          nameNative: lang.nameNative,
          script: lang.script,
          familyCode: lang.familyCode,
          rtl: lang.rtl ?? false,
          tier: lang.tier === 'strategic_african' ? LanguageTier.strategic_african : LanguageTier.vendor,
        },
        update: {
          nameEn: lang.nameEn,
          nameNative: lang.nameNative,
          script: lang.script,
          familyCode: lang.familyCode,
          rtl: lang.rtl ?? false,
          tier: lang.tier === 'strategic_african' ? LanguageTier.strategic_african : LanguageTier.vendor,
        },
      });
    }
  }

  list() {
    // Soft catalog when Prisma is skipped (Fly first boot / missing DATABASE_URL)
    // so public coverage and language pickers still return the full 204-code registry.
    if (!this.prisma.isReady()) {
      return LANGUAGE_SEEDS.map((lang) => ({
        code: lang.code,
        nameEn: lang.nameEn,
        nameNative: lang.nameNative,
        script: lang.script,
        familyCode: lang.familyCode,
        family: null as { code: string; nameEn: string; notes: string | null } | null,
        rtl: lang.rtl ?? false,
        tier:
          lang.tier === 'strategic_african'
            ? LanguageTier.strategic_african
            : LanguageTier.vendor,
      }));
    }
    return this.prisma.language.findMany({
      orderBy: { code: 'asc' },
      include: { family: true },
    });
  }

  /**
   * Accept ISO 639 codes and BCP-47 locales (e.g. ak-GH → ak).
   * Script/region tags are stripped for registry lookup; the primary language subtag remains.
   */
  normalizeCode(code: string): string {
    const trimmed = code.trim();
    if (!trimmed || trimmed === 'auto') return trimmed;
    const primary = trimmed.split(/[-_]/)[0]?.toLowerCase() ?? trimmed.toLowerCase();
    return primary || trimmed.toLowerCase();
  }

  async get(code: string) {
    const normalized = this.normalizeCode(code);
    const language = await this.prisma.language.findUnique({
      where: { code: normalized },
      include: {
        family: true,
        localePack: true,
        dialects: { orderBy: { code: 'asc' } },
        accents: { orderBy: { code: 'asc' } },
        linguisticRules: { orderBy: { code: 'asc' } },
      },
    });
    if (!language) {
      throw new ApiException('not_found', `Language "${code}" not found`, HttpStatus.NOT_FOUND);
    }
    return language;
  }

  async assertSupported(code: string) {
    const normalized = this.normalizeCode(code);
    const language = await this.prisma.language.findUnique({ where: { code: normalized } });
    if (!language) {
      throw new ApiException(
        'unsupported_language',
        `Language code "${code}" is not in the registry`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return language;
  }
}
