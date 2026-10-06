import { LANGUAGE_SEEDS } from '../languages/language-seeds';
import { LOCALE_PACK_SEEDS, LOCALE_VARIANT_SEEDS } from '../locales/locale-pack-seeds';
import { COUNTRY_PACK_SEEDS } from '../country-packs/country-pack-seeds';
import type { DialectSeed } from './dialect-seeds';

function bcp47ToDialectCode(bcp47: string): string {
  return bcp47.trim().toLowerCase().replace(/_/g, '-');
}

function parseRegion(bcp47: string): string | undefined {
  const parts = bcp47.split(/[-_]/);
  const region = parts[1];
  return region && /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : undefined;
}

/**
 * Locale/country-derived dialect rows that fill gaps in curated DIALECT_SEEDS.
 * Does not replace curated cue-rich entries — only adds missing codes / languages.
 */
export function buildLocaleDialectSeeds(existingCodes: Set<string>): DialectSeed[] {
  const byCode = new Map<string, DialectSeed>();

  const upsert = (input: {
    code: string;
    languageCode: string;
    region?: string;
    nameEn?: string;
    nameNative?: string;
    cueTerms?: string[];
    notes?: string;
    hint?: string;
  }) => {
    if (!LANGUAGE_SEEDS.some((l) => l.code === input.languageCode)) return;
    const code = bcp47ToDialectCode(input.code);
    if (!code || existingCodes.has(code) || byCode.has(code)) return;
    const lang = LANGUAGE_SEEDS.find((l) => l.code === input.languageCode);
    const place = input.region ?? '';
    const nameEn =
      input.nameEn ??
      (input.hint && !/locale pack/i.test(input.hint)
        ? input.hint.replace(/\.$/, '').trim()
        : place
          ? `${lang?.nameEn ?? input.languageCode} (${place})`
          : (lang?.nameEn ?? input.languageCode));
    byCode.set(code, {
      code,
      languageCode: input.languageCode,
      nameEn,
      nameNative: input.nameNative ?? lang?.nameNative,
      region: input.region,
      cueTerms: input.cueTerms ?? [],
      notes:
        input.notes ??
        'Dialect label from language/locale registry — lexical cue heuristics, not speech accent ID.',
    });
  };

  for (const pack of LOCALE_PACK_SEEDS) {
    if (!pack.bcp47) continue;
    upsert({
      code: pack.bcp47,
      languageCode: pack.languageCode,
      region: parseRegion(pack.bcp47),
      hint: pack.culturalNotes,
    });
  }

  for (const variant of LOCALE_VARIANT_SEEDS) {
    upsert({
      code: variant.bcp47,
      languageCode: variant.languageCode,
      region: parseRegion(variant.bcp47),
      hint: variant.culturalNotes,
    });
  }

  for (const country of COUNTRY_PACK_SEEDS) {
    for (const tag of country.bcp47Tags ?? []) {
      const languageCode = tag.split(/[-_]/)[0]?.toLowerCase();
      if (!languageCode) continue;
      upsert({
        code: tag,
        languageCode,
        region: country.code,
        hint: `${country.nameEn} ${LANGUAGE_SEEDS.find((l) => l.code === languageCode)?.nameEn ?? languageCode}`,
      });
    }
  }

  const coveredLangs = new Set<string>([
    ...[...existingCodes].map((c) => c.split('-')[0] ?? c),
    ...[...byCode.values()].map((d) => d.languageCode),
  ]);
  // existingCodes are dialect codes not language codes — recompute from caller via langsCovered param better
  void coveredLangs;

  return [...byCode.values()].sort((a, b) => {
    const langCmp = a.languageCode.localeCompare(b.languageCode);
    return langCmp !== 0 ? langCmp : a.code.localeCompare(b.code);
  });
}

/** Ensure every LANGUAGE_SEEDS entry has ≥1 dialect (fallback when locale-derived set still misses). */
export function buildFallbackDialectSeeds(langsCovered: Set<string>): DialectSeed[] {
  const out: DialectSeed[] = [];
  for (const lang of LANGUAGE_SEEDS) {
    if (langsCovered.has(lang.code)) continue;
    const pack = LOCALE_PACK_SEEDS.find((p) => p.languageCode === lang.code);
    const code = pack?.bcp47 ? bcp47ToDialectCode(pack.bcp47) : lang.code;
    out.push({
      code,
      languageCode: lang.code,
      nameEn: lang.nameEn,
      nameNative: lang.nameNative,
      region: pack?.bcp47 ? parseRegion(pack.bcp47) : undefined,
      cueTerms: [],
      notes: 'Fallback dialect for registry language — lexical cue heuristics, not speech accent ID.',
    });
  }
  return out;
}

export function expandDialectSeeds(curated: DialectSeed[]): DialectSeed[] {
  const byCode = new Map<string, DialectSeed>();
  for (const d of curated) {
    if (!d?.languageCode) continue;
    byCode.set(d.code, d);
  }
  for (const d of buildLocaleDialectSeeds(new Set(byCode.keys()))) {
    if (!byCode.has(d.code)) byCode.set(d.code, d);
  }
  const langsCovered = new Set([...byCode.values()].map((d) => d.languageCode));
  for (const d of buildFallbackDialectSeeds(langsCovered)) {
    if (!byCode.has(d.code)) byCode.set(d.code, d);
  }
  return [...byCode.values()].sort((a, b) => {
    const langCmp = a.languageCode.localeCompare(b.languageCode);
    return langCmp !== 0 ? langCmp : a.code.localeCompare(b.code);
  });
}
