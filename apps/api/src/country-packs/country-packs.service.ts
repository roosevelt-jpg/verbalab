import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { LocalesService } from '../locales/locales.service';
import { COUNTRY_PACK_COUNT, COUNTRY_PACK_SEEDS } from './country-pack-seeds';
import { countryEngineCatalog } from './country-engine.catalog';
import { africaFirstCountrySort, ISO_COUNTRIES } from './iso-countries';

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

  /** Lightweight ISO list for Studio country pickers (residency, branding, admin). */
  pickerList(region?: string) {
    const rows = ISO_COUNTRIES.filter((c) =>
      region ? c.region.toLowerCase().includes(region.trim().toLowerCase()) : true,
    )
      .slice()
      .sort(africaFirstCountrySort)
      .map((c) => ({
        code: c.code,
        nameEn: c.nameEn,
        region: c.region,
        currencyCode: c.currencyCode,
      }));
    return {
      data: rows,
      count: rows.length,
      total: ISO_COUNTRIES.length,
      note: 'Full ISO country list for pickers. Africa-first order.',
    };
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
      JSON.stringify({ event: 'country_packs.seeded', count: COUNTRY_PACK_COUNT }),
    );
  }

  async list(region?: string) {
    if (!this.prisma.isReady()) {
      const rows = COUNTRY_PACK_SEEDS.filter((p) =>
        region ? p.region.toLowerCase() === region.toLowerCase() : true,
      );
      return {
        data: rows.map((p) => ({
          id: `seed-${p.code}`,
          code: p.code,
          nameEn: p.nameEn,
          region: p.region,
          currencyCode: p.currencyCode,
          primaryLanguages: p.primaryLanguages,
          bcp47Tags: p.bcp47Tags,
          relatedDialectCodes: p.relatedDialectCodes ?? [],
          relatedAccentCodes: p.relatedAccentCodes ?? [],
          dateNotes: p.dateNotes,
          numberNotes: p.numberNotes,
          currencyNotes: p.currencyNotes,
          culturalNotes: p.culturalNotes,
        })),
        note: 'Seed catalog (database unavailable).',
      };
    }
    const rows = await this.prisma.countryPack.findMany({
      where: region
        ? { region: { contains: region, mode: 'insensitive' } }
        : undefined,
    });
    const data = rows
      .map((r) => this.toDto(r))
      .sort((a, b) =>
        africaFirstCountrySort(
          { region: a.region ?? '', code: a.code },
          { region: b.region ?? '', code: b.code },
        ),
      );
    return {
      data,
      count: data.length,
      total: COUNTRY_PACK_COUNT,
      note:
        'Full ISO country packs (Africa-first). Compose language locale packs where seeded — not CLDR dialect completeness or billing SKUs.',
    };
  }

  async get(code: string, opts?: { includeLocales?: boolean }) {
    const normalized = code.trim().toUpperCase();
    if (!this.prisma.isReady()) {
      const seed = COUNTRY_PACK_SEEDS.find((p) => p.code === normalized);
      if (!seed) {
        throw new ApiException('not_found', 'Country pack not found', HttpStatus.NOT_FOUND);
      }
      return {
        id: `seed-${seed.code}`,
        code: seed.code,
        nameEn: seed.nameEn,
        region: seed.region,
        currencyCode: seed.currencyCode,
        primaryLanguages: seed.primaryLanguages,
        bcp47Tags: seed.bcp47Tags,
        relatedDialectCodes: seed.relatedDialectCodes ?? [],
        relatedAccentCodes: seed.relatedAccentCodes ?? [],
        dateNotes: seed.dateNotes,
        numberNotes: seed.numberNotes,
        currencyNotes: seed.currencyNotes,
        culturalNotes: seed.culturalNotes,
        ...(opts?.includeLocales ? { localePacks: [], note: 'Seed catalog (database unavailable).' } : {}),
      };
    }
    const row = await this.prisma.countryPack.findUnique({
      where: { code: normalized },
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
