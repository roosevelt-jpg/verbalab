import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LanguagesService } from '../languages/languages.service';
import { LocalesService } from '../locales/locales.service';
import { EvalService } from '../eval/eval.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  languageArchitectureNotes,
  languageProductCatalog,
} from './language-products.catalog';

@Injectable()
export class LanguageCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly languages: LanguagesService,
    private readonly locales: LocalesService,
    private readonly evalService: EvalService,
  ) {}

  products() {
    return {
      products: languageProductCatalog(),
      architecture: languageArchitectureNotes(),
      docs: '/docs/LANGUAGE_CLOUD.md',
    };
  }

  /** Language Cloud hub engine — parent map over language products. */
  engine() {
    const products = languageProductCatalog();
    return {
      product: 'Lugemi Language Cloud',
      note:
        'Parent hub for Translate, detection, dialects, accents, locales, country packs, grammar, style, and Language Intelligence. Does not regenerate those modules.',
      capabilities: products.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        api: p.api,
        notes: p.notes,
      })),
      architecture: languageArchitectureNotes(),
      honesty: {
        multiVendorMtParity: false,
        ethnologueParity: false,
        regeneratesTranslate: false,
        regeneratesSpeechCloud: false,
      },
      links: {
        console: '/language',
        languagesEngine: '/v1/languages/engine',
        translateEngine: '/v1/translate/engine',
        accentsEngine: '/v1/accents/engine',
        countryEngine: '/v1/country-packs/engine',
        modelsEngine: '/v1/models/engine',
        docs: '/docs/LANGUAGE_CLOUD.md',
        openapi: '/v1/openapi.json',
      },
    };
  }

  async overview(session: SessionContext) {
    const [langs, localePacks, coverage, glossaryCount, tmCount, reviewCount] =
      await Promise.all([
        this.languages.list(),
        this.locales.list(),
        this.evalService.coverageMatrix(),
        this.prisma.glossaryTerm.count({
          where: { organizationId: session.organizationId },
        }),
        this.prisma.translationMemoryEntry.count({
          where: { organizationId: session.organizationId },
        }),
        this.prisma.translationReview.count({
          where: { organizationId: session.organizationId },
        }),
      ]);

    const rtlCount = langs.filter((l) => l.rtl).length;
    const africanCount = langs.filter((l) => l.tier === 'strategic_african').length;

    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      registry: {
        languages: langs.length,
        rtlLanguages: rtlCount,
        strategicAfrican: africanCount,
        localePacks: localePacks.length,
      },
      workspace: {
        glossaryTerms: glossaryCount,
        tmEntries: tmCount,
        qualityReviews: reviewCount,
      },
      coverage: {
        asOf: coverage.asOf,
        focusPairs: coverage.focusPairs?.length ?? 0,
        disclaimer: coverage.disclaimer,
      },
      products: languageProductCatalog(),
      architecture: languageArchitectureNotes(),
      deferred: {
        dialectDetection: false,
        accentDetection: false,
        grammarAi: false,
        writingStyleAi: false,
        countryPacks: false,
        graphql: false,
        cqrs: false,
        terraform: false,
        kubernetes: false,
      },
      links: {
        translate: '/translate',
        dialects: '/dialects',
        accents: '/accents',
        grammar: '/grammar',
        style: '/style',
        countries: '/countries',
        registry: '/registry',
        graphql: '/graphql',
        glossary: '/glossary',
        tm: '/tm',
        reviews: '/reviews',
        localize: '/localize',
        locales: '/locales',
        coverage: '/coverage',
        analytics: '/analytics',
        playground: '/playground',
      },
      docs: '/docs/LANGUAGE_CLOUD.md',
    };
  }
}
