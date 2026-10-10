import {
  allRegionalLanguageEntries,
  languagesForRegion,
  regionalCountsByRegion,
} from './region-catalogs';
import { WORLD_REGIONS, type WorldRegionId } from './regional-language-registry.types';

export function regionalLanguageRegistryEngineCatalog() {
  const languages = allRegionalLanguageEntries();
  const counts = regionalCountsByRegion();
  return {
    product: 'Lugemi Regional Language Registry',
    note:
      'World regional language registry with Africa-first prominence. Browse Africa, SEA, MENA, EU, UK, LATAM, NA, and Global. Default demo pair remains English → Twi (ak / ak-GH). Catalog membership enables selection — task quality is tracked in internal quality fields.',
    capabilities: [
      {
        id: 'region-tabs',
        name: 'Region Tabs',
        api: 'GET /v1/regional-language-registry/regions',
        notes: 'Africa | SEA | MENA | EU | UK | LATAM | NA | Global.',
      },
      {
        id: 'language-catalog',
        name: 'Language Catalog',
        api: 'GET /v1/regional-language-registry/languages?region=africa',
        notes: 'Regional languages with dialects, accents, and lifestyle context.',
      },
      {
        id: 'counts',
        name: 'Region Counts',
        api: 'GET /v1/regional-language-registry/engine',
        notes: 'Per-region language counts for UI tabs.',
      },
    ],
    regions: WORLD_REGIONS,
    counts,
    languages,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsAfricanLanguageRegistry: true,
      regeneratesPriorLayers: false,
      africaFirst: true,
    },
    honesty: {
      africaFirst: true,
      coverageComplete: false,
      qualityCertifiedPerTask: false,
      regeneratesPriorLayers: false,
      extendsDialectsLocales: true,
      everyAfricanLanguageRegistered: true,
    },
    docs: '/docs/AFRICAN_LANGUAGE_REGISTRY.md',
  };
}

export function parseWorldRegion(raw?: string): WorldRegionId {
  const v = (raw ?? 'africa').trim().toLowerCase();
  const allowed: WorldRegionId[] = ['africa', 'sea', 'mena', 'eu', 'uk', 'latam', 'na', 'global'];
  if (allowed.includes(v as WorldRegionId)) return v as WorldRegionId;
  return 'africa';
}

export { languagesForRegion, regionalCountsByRegion, allRegionalLanguageEntries, WORLD_REGIONS };
