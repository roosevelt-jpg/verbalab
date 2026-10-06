export type LocalizationCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type LocalizationCapability = {
  id: string;
  name: string;
  status: LocalizationCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 9 → Lugemi Localization Platform (VL-141). */
export function localizationPlatformCatalog() {
  return {
    product: 'Enterprise Localization Platform',
    note:
      'Software-string localization over JSON/YAML + ICU + locale packs. Not a website/game/mobile TMS (Phrase/Lokalise competitor).',
    capabilities: [
      {
        id: 'software_strings',
        name: 'Software strings',
        status: 'shipped',
        api: 'POST /v1/localize',
        notes: 'Key-stable JSON/YAML MT with ICU passthrough.',
      },
      {
        id: 'pluralization',
        name: 'Pluralization',
        status: 'shipped',
        api: 'POST /v1/icu/validate|format',
        notes: 'ICU plural protect + validate/format (Intl.PluralRules).',
      },
      {
        id: 'gender_rules',
        name: 'Gender rules',
        status: 'partial',
        api: 'POST /v1/icu/format',
        notes: 'ICU select arms + honorific notes — not morphological gender.',
      },
      {
        id: 'currency',
        name: 'Currency',
        status: 'shipped',
        api: 'POST /v1/locales/format',
        notes: 'Intl currency via locale pack currencyCode.',
      },
      {
        id: 'timezone',
        name: 'Timezone',
        status: 'shipped',
        api: 'POST /v1/locales/format',
        notes: 'IANA timeZone on Intl.DateTimeFormat (VL-141).',
      },
      {
        id: 'date_formats',
        name: 'Date formats',
        status: 'shipped',
        api: 'POST /v1/locales/format',
        notes: 'Intl date/time formatting.',
      },
      {
        id: 'rtl_layout',
        name: 'RTL layout',
        status: 'shipped',
        api: 'GET /v1/locales/:code/layout',
        notes: 'dir/rtl/script metadata from language registry.',
      },
      {
        id: 'localization_qa',
        name: 'Localization QA',
        status: 'shipped',
        api: 'POST /v1/localize/qa',
        notes: 'Key parity, ICU, empty/identical checks — not screenshot QA.',
      },
      {
        id: 'applications',
        name: 'Applications',
        status: 'partial',
        api: 'POST /v1/localize',
        notes: 'i18n resource files only — not app store packaging.',
      },
      {
        id: 'documents',
        name: 'Documents',
        status: 'partial',
        api: 'POST /v1/documents/translate',
        notes: 'Covered by Translation Engine / document jobs.',
      },
      {
        id: 'media',
        name: 'Media',
        status: 'partial',
        api: 'POST /v1/translate/formats',
        notes: 'SRT + speech APIs elsewhere — not a media localization suite.',
      },
      {
        id: 'websites',
        name: 'Websites',
        status: 'deferred',
        api: null,
        notes: 'No crawl/CMS localization product.',
      },
      {
        id: 'mobile_apps',
        name: 'Mobile apps',
        status: 'deferred',
        api: null,
        notes: 'No Xcode/Android string catalog pipeline.',
      },
      {
        id: 'desktop_apps',
        name: 'Desktop apps',
        status: 'deferred',
        api: null,
        notes: 'No desktop resource pipeline.',
      },
      {
        id: 'games',
        name: 'Games',
        status: 'deferred',
        api: null,
        notes: 'No game asset localization pipeline.',
      },
    ] satisfies LocalizationCapability[],
    engines: {
      localization: { status: 'shipped', api: 'POST /v1/localize' },
      icu: { status: 'shipped', api: '/v1/icu/*' },
      localePacks: { status: 'shipped', api: '/v1/locales' },
      qa: { status: 'shipped', api: 'POST /v1/localize/qa' },
      rest: { status: 'shipped' },
      graphql: { status: 'shipped', notes: 'localize + ICU ops (VL-141)' },
      sdk: { status: 'shipped', package: '@lugemi/sdk' },
      analytics: { status: 'partial', api: 'GET /v1/analytics/overview', notes: 'Org translate analytics' },
      monitoring: { status: 'partial', api: 'GET /v1/metrics/translate' },
    },
    links: {
      dashboard: '/localization',
      localize: '/localize',
      locales: '/locales',
      docs: '/docs/LOCALIZATION.md',
    },
  };
}
