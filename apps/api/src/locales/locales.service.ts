import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { GlossaryTermLike } from '../glossary/glossary-apply';
import { LOCALE_PACK_SEEDS, type HonorificEntry } from './locale-pack-seeds';
import {
  formatLocaleCurrency,
  formatLocaleDate,
  formatLocaleDateTime,
  formatLocaleNumber,
} from './locale-format';

@Injectable
export class LocalesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit {
    await this.seed;
  }

  async seed {
    for (const pack of LOCALE_PACK_SEEDS) {
      const language = await this.prisma.language.findUnique({
        where: { code: pack.languageCode },
      });
      if (!language) continue;

      await this.prisma.localePack.upsert({
        where: { languageCode: pack.languageCode },
        create: {
          languageCode: pack.languageCode,
          bcp47: pack.bcp47,
          dateNotes: pack.dateNotes,
          numberNotes: pack.numberNotes,
          currencyCode: pack.currencyCode,
          currencyNotes: pack.currencyNotes,
          honorifics: pack.honorifics as unknown as Prisma.InputJsonValue,
          doNotTranslate: pack.doNotTranslate as unknown as Prisma.InputJsonValue,
          culturalNotes: pack.culturalNotes,
        },
        update: {
          bcp47: pack.bcp47,
          dateNotes: pack.dateNotes,
          numberNotes: pack.numberNotes,
          currencyCode: pack.currencyCode,
          currencyNotes: pack.currencyNotes,
          honorifics: pack.honorifics as unknown as Prisma.InputJsonValue,
          doNotTranslate: pack.doNotTranslate as unknown as Prisma.InputJsonValue,
          culturalNotes: pack.culturalNotes,
        },
      });
    }
  }

  private serialize(row: {
    languageCode: string;
    bcp47: string | null;
    dateNotes: string | null;
    numberNotes: string | null;
    currencyCode: string | null;
    currencyNotes: string | null;
    honorifics: Prisma.JsonValue;
    doNotTranslate: Prisma.JsonValue;
    culturalNotes: string | null;
    updatedAt: Date;
    language?: { nameEn: string; nameNative: string | null; tier: string; script: string | null; rtl: boolean };
  }) {
    return {
      languageCode: row.languageCode,
      bcp47: row.bcp47,
      dateNotes: row.dateNotes,
      numberNotes: row.numberNotes,
      currencyCode: row.currencyCode,
      currencyNotes: row.currencyNotes,
      honorifics: (row.honorifics as HonorificEntry[] | null) ?? [],
      doNotTranslate: (row.doNotTranslate as string[] | null) ?? [],
      culturalNotes: row.culturalNotes,
      updatedAt: row.updatedAt,
      language: row.language
        ? {
            code: row.languageCode,
            name: row.language.nameEn,
            nativeName: row.language.nameNative,
            tier: row.language.tier,
            script: row.language.script,
            rtl: row.language.rtl,
          }
        : null,
    };
  }

  async list {
    const rows = await this.prisma.localePack.findMany({
      include: {
        language: {
          select: { nameEn: true, nameNative: true, tier: true, script: true, rtl: true },
        },
      },
      orderBy: { languageCode: 'asc' },
    });
    return rows.map((r) => this.serialize(r));
  }

  async get(code: string) {
    const row = await this.prisma.localePack.findUnique({
      where: { languageCode: code },
      include: {
        language: {
          select: { nameEn: true, nameNative: true, tier: true, script: true, rtl: true },
        },
      },
    });
    if (!row) {
      throw new ApiException('not_found', `No locale pack for language ${code}`, HttpStatus.NOT_FOUND);
    }
    return this.serialize(row);
  }

  /** Entities kept through MT (source === target) for glossary-style protect. */
  async doNotTranslateTerms(languageCode: string): Promise<GlossaryTermLike[]> {
    const pack = await this.prisma.localePack.findUnique({
      where: { languageCode },
      select: { doNotTranslate: true },
    });
    const entities = (pack?.doNotTranslate as string[] | null) ?? [];
    return entities
      .filter((e) => typeof e === 'string' && e.trim)
      .map((sourceTerm) => ({
        sourceTerm: sourceTerm.trim,
        targetTerm: sourceTerm.trim,
        caseSensitive: false,
        wholeWord: true,
      }));
  }

  async formatExamples(code: string) {
    const pack = await this.get(code);
    const bcp47 = pack.bcp47 || code;
    const sampleDate = new Date('2026-09-07T12:00:00.000Z');
    return {
      languageCode: code,
      bcp47,
      date: formatLocaleDate(sampleDate, bcp47),
      dateTimeUtc: formatLocaleDateTime(sampleDate, bcp47, 'UTC'),
      dateTimeJohannesburg: formatLocaleDateTime(sampleDate, bcp47, 'Africa/Johannesburg'),
      number: formatLocaleNumber(1234567.89, bcp47),
      currency: pack.currencyCode
        ? formatLocaleCurrency(1234.5, bcp47, pack.currencyCode)
        : null,
    };
  }

  async layout(code: string) {
    const row = await this.prisma.localePack.findUnique({
      where: { languageCode: code },
      include: {
        language: {
          select: { nameEn: true, nameNative: true, tier: true, script: true, rtl: true },
        },
      },
    });
    if (row) {
      const pack = this.serialize(row);
      const rtl = Boolean(pack.language?.rtl);
      return {
        languageCode: code,
        bcp47: pack.bcp47,
        script: pack.language?.script ?? null,
        rtl,
        dir: rtl ? 'rtl' : 'ltr',
        note: 'Layout metadata for clients — not a CSS framework.',
      };
    }

    const language = await this.prisma.language.findUnique({ where: { code } });
    if (!language) {
      throw new ApiException('not_found', `No language ${code} in registry`, HttpStatus.NOT_FOUND);
    }
    return {
      languageCode: code,
      bcp47: code,
      script: language.script,
      rtl: language.rtl,
      dir: language.rtl ? 'rtl' : 'ltr',
      note: 'Layout from language registry (no locale pack seeded for this code).',
    };
  }

  async format(input: {
    code: string;
    date?: string;
    number?: number;
    currencyValue?: number;
    timeZone?: string;
  }) {
    const pack = await this.get(input.code);
    const bcp47 = pack.bcp47 || input.code;
    const result: Record<string, unknown> = {
      languageCode: input.code,
      bcp47,
      timeZone: input.timeZone ?? null,
    };

    if (input.date) {
      try {
        result.date = formatLocaleDate(input.date, bcp47);
        result.dateTime = formatLocaleDateTime(input.date, bcp47, input.timeZone);
      } catch {
        throw new ApiException('validation_error', 'Invalid date', HttpStatus.BAD_REQUEST);
      }
    }
    if (typeof input.number === 'number') {
      result.number = formatLocaleNumber(input.number, bcp47);
    }
    if (typeof input.currencyValue === 'number') {
      if (!pack.currencyCode) {
        throw new ApiException(
          'validation_error',
          `Locale pack ${input.code} has no currencyCode`,
          HttpStatus.BAD_REQUEST,
        );
      }
      result.currency = formatLocaleCurrency(input.currencyValue, bcp47, pack.currencyCode);
      result.currencyCode = pack.currencyCode;
    }
    return result;
  }
}
