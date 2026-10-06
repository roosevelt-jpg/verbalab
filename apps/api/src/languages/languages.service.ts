import { Injectable, OnModuleInit } from '@nestjs/common';
import { LanguageTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LANGUAGE_SEEDS } from './language-seeds';
import { ApiException } from '../common/errors/api-exception';
import { HttpStatus } from '@nestjs/common';
import { seedFamiliesAndScripts } from '../registry/registry-seed';

@Injectable()
export class LanguagesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
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
    return this.prisma.language.findMany({
      orderBy: { code: 'asc' },
      include: { family: true },
    });
  }

  async get(code: string) {
    const language = await this.prisma.language.findUnique({
      where: { code },
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
    const language = await this.prisma.language.findUnique({ where: { code } });
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
