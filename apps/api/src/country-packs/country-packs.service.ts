import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { LocalesService } from '../locales/locales.service';
import { COUNTRY_PACK_SEEDS } from './country-pack-seeds';
import { countryEngineCatalog } from './country-engine.catalog';

@Injectable()
export class CountryPacksService implements OnModuleInit {
  private readonly logger = new Logger(CountryPacksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly locales: LocalesService,
  ) {}

  async onModuleInit() {
    if (!this.prisma.isReady()) {
      this.logger.warn('DATABASE_URL unset — skipping country pack seed');
      return;
    }
    await this.seed();
  }

  engine() {
    return countryEngineCatalog();
  }

  async seed() {
    for (const pack of COUNTRY_PACK_SEEDS) {
      await this.prisma.countryPack.upsert({
        where: { code: pack.code },
        create: {
          code: pack.code,
          nameEn: pack.nameEn,
          region: pack.region,
          currencyCode: pack.currencyCode,
          primaryLanguages: pack.primaryLanguages,
          bcp47Tags: pack.bcp47Tags,
          relatedDialectCodes: pack.relatedDialectCodes ?? [],
          relatedAccentCodes: pack.relatedAccentCodes ?? [],
          dateNotes: pack.dateNotes,
          numberNotes: pack.numberNotes,
          currencyNotes: pack.currencyNotes,
          culturalNotes: pack.culturalNotes,
        },
        update: {
          nameEn: pack.nameEn,
          region: pack.region,
          currencyCode: pack.currencyCode,
          primaryLanguages: pack.primaryLanguages,
          bcp47Tags: pack.bcp47Tags,
          relatedDialectCodes: pack.relatedDialectCodes ?? [],
          relatedAccentCodes: pack.relatedAccentCodes ?? [],
          dateNotes: pack.dateNotes,
          numberNotes: pack.numberNotes,
          currencyNotes: pack.currencyNotes,
          culturalNotes: pack.culturalNotes,
        },
      });
    }
    this.logger.log(
      JSON.stringify({ event: 'country_packs.seeded', count: COUNTRY_PACK_SEEDS.length }),
    );
  }

  async list(region?: string) {
    const rows = await this.prisma.countryPack.findMany({
      where: region
        ? { region: { equals: region, mode: 'insensitive' } }
        : undefined,
      orderBy: [{ region: 'asc' }, { code: 'asc' }],
    });
    return {
      data: rows.map((r) => this.toDto(r)),
      note: 'Curated African-priority country packs. Compose language locale packs — not CLDR/SKU catalog.',
    };
  }

  async get(code: string, opts?: { includeLocales?: boolean }) {
    const row = await this.prisma.countryPack.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!row) {
      throw new ApiException('not_found', 'Country pack not found', HttpStatus.NOT_FOUND);
    }
    const dto = this.toDto(row);
    if (!opts?.includeLocales) return dto;

    const languages = this.asStringArray(row.primaryLanguages);
    const localePacks = [];
    for (const lang of languages) {
      try {
        localePacks.push(await this.locales.get(lang));
      } catch {
        // Language may lack a pack — skip honestly.
      }
    }
    return {
      ...dto,
      localePacks,
      note: 'Includes linked language locale packs where seeded.',
    };
  }

  private toDto(row: {
    id: string;
    code: string;
    nameEn: string;
    region: string | null;
    currencyCode: string | null;
    primaryLanguages: unknown;
    bcp47Tags: unknown;
    relatedDialectCodes: unknown;
    relatedAccentCodes: unknown;
    dateNotes: string | null;
    numberNotes: string | null;
    currencyNotes: string | null;
    culturalNotes: string | null;
  }) {
    return {
      id: row.id,
      code: row.code,
      nameEn: row.nameEn,
      region: row.region,
      currencyCode: row.currencyCode,
      primaryLanguages: this.asStringArray(row.primaryLanguages),
      bcp47Tags: this.asStringArray(row.bcp47Tags),
      relatedDialectCodes: this.asStringArray(row.relatedDialectCodes),
      relatedAccentCodes: this.asStringArray(row.relatedAccentCodes),
      dateNotes: row.dateNotes,
      numberNotes: row.numberNotes,
      currencyNotes: row.currencyNotes,
      culturalNotes: row.culturalNotes,
    };
  }

  private asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  }
}
