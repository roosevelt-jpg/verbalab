import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import {
  ACCENT_IDENTITY_SEEDS,
  COUNTRY_LABELS,
  countryFlag,
  type AccentIdentitySeed,
} from './accent-identity-seeds';
import {
  CULTURAL_ENGLISH_BCP47_DEFAULTS,
  deriveCulturalIdentityLabel,
  deriveLifestyleTags,
  deriveSpeechVariety,
} from './cultural-identity';

export type AccentIdentityDto = AccentIdentitySeed & {
  countryLabel: string;
  countryFlag: string;
  echoModelDisplayName: string | null;
  demoVoiceKey: string | null;
  /** Always populated — explicit seed or derived. */
  culturalIdentity: string;
  speechVariety: string;
  lifestyleTags: string[];
  /** API contract aliases (snake_case) for clients that prefer them. */
  cultural_identity: string;
  speech_variety: string;
  lifestyle_tags: string[];
};

@Injectable()
export class AccentIdentityService {
  list(filters?: {
    country?: string;
    region?: string;
    language?: string;
    q?: string;
    speechVariety?: string;
  }) {
    let rows = ACCENT_IDENTITY_SEEDS.map((s) => this.toDto(s));

    const country = filters?.country?.trim().toUpperCase();
    if (country) {
      rows = rows.filter((r) => r.country === country);
    }

    const region = filters?.region?.trim().toLowerCase();
    if (region) {
      rows = rows.filter((r) =>
        r.regionTags.some((t) => t.toLowerCase().includes(region)),
      );
    }

    const language = filters?.language?.trim().toLowerCase();
    if (language) {
      rows = rows.filter((r) => r.languageCode === language);
    }

    const speechVariety = filters?.speechVariety?.trim().toLowerCase();
    if (speechVariety) {
      rows = rows.filter((r) => r.speechVariety === speechVariety);
    }

    const q = filters?.q?.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.id.includes(q) ||
          r.nameEn.toLowerCase().includes(q) ||
          r.identityProfile.toLowerCase().includes(q) ||
          r.samplePhrase.toLowerCase().includes(q) ||
          r.culturalIdentity.toLowerCase().includes(q) ||
          r.speechVariety.toLowerCase().includes(q) ||
          r.lifestyleTags.some((t) => t.toLowerCase().includes(q)) ||
          r.regionTags.some((t) => t.toLowerCase().includes(q)) ||
          r.pronunciationMarkers.some((m) => m.toLowerCase().includes(q)),
      );
    }

    const countries = [...new Set(ACCENT_IDENTITY_SEEDS.map((s) => s.country))].sort();
    const regions = [
      ...new Set(ACCENT_IDENTITY_SEEDS.flatMap((s) => s.regionTags)),
    ].sort();
    const speechVarieties = [...new Set(rows.map((r) => r.speechVariety))].sort();

    return {
      data: rows,
      count: rows.length,
      total: ACCENT_IDENTITY_SEEDS.length,
      countries: countries.map((c) => ({
        code: c,
        label: COUNTRY_LABELS[c] ?? c,
        flag: countryFlag(c),
        packCount: ACCENT_IDENTITY_SEEDS.filter((s) => s.country === c).length,
      })),
      regions,
      speechVarieties,
      culturalEnglishDefaults: CULTURAL_ENGLISH_BCP47_DEFAULTS,
      note:
        'Accent Identity Packs link culture, lifestyle, and speech variety to Lugemi Echo Voice. cultural_identity / speech_variety / lifestyle_tags are first-class routing metadata — acoustic fidelity depends on published Echo weights for each pack.',
      product: 'Lugemi Accent Identity',
    };
  }

  get(id: string) {
    const seed = this.findSeed(id);
    return this.toDto(seed);
  }

  /** Prefer cultural English / Pidgin defaults when given a BCP-47 or locale tag. */
  resolveForLocale(localeOrBcp47: string): AccentIdentityDto | null {
    const key = localeOrBcp47.trim();
    const direct = CULTURAL_ENGLISH_BCP47_DEFAULTS[key];
    if (direct) {
      return this.toDto(this.findSeed(direct.accentIdentityId));
    }
    const upper = key.toUpperCase();
    const byBcp = ACCENT_IDENTITY_SEEDS.find((s) => s.bcp47?.toUpperCase() === upper);
    if (byBcp) return this.toDto(byBcp);
    return null;
  }

  resolveForPlayback(input: {
    accentId?: string;
    dialectId?: string;
    speechVariety?: string;
    locale?: string;
  }) {
    const accentId = input.accentId?.trim();
    const dialectId = input.dialectId?.trim();
    const speechVariety = input.speechVariety?.trim().toLowerCase();
    const locale = input.locale?.trim();

    if (accentId) {
      const byId = ACCENT_IDENTITY_SEEDS.find((s) => s.id === accentId);
      if (byId) return this.toDto(byId);
      const byAccent = ACCENT_IDENTITY_SEEDS.find((s) => s.accentCode === accentId);
      if (byAccent) return this.toDto(byAccent);
    }

    if (dialectId) {
      const byDialect = ACCENT_IDENTITY_SEEDS.find((s) => s.dialectCode === dialectId);
      if (byDialect) return this.toDto(byDialect);
    }

    if (speechVariety) {
      const byVariety = ACCENT_IDENTITY_SEEDS.find((s) => {
        const dto = this.toDto(s);
        return dto.speechVariety === speechVariety;
      });
      if (byVariety) return this.toDto(byVariety);
    }

    if (locale) {
      const byLocale = this.resolveForLocale(locale);
      if (byLocale) return byLocale;
    }

    throw new ApiException(
      'not_found',
      'Accent identity pack not found for the given accentId, dialectId, speechVariety, or locale',
      HttpStatus.NOT_FOUND,
    );
  }

  demoMeta(id: string) {
    const pack = this.toDto(this.findSeed(id));
    return {
      id: pack.id,
      nameEn: pack.nameEn,
      samplePhrase: pack.samplePhrase,
      pronunciationMarkers: pack.pronunciationMarkers,
      identityProfile: pack.identityProfile,
      culturalIdentity: pack.culturalIdentity,
      cultural_identity: pack.cultural_identity,
      speechVariety: pack.speechVariety,
      speech_variety: pack.speech_variety,
      lifestyleTags: pack.lifestyleTags,
      lifestyle_tags: pack.lifestyle_tags,
      echoVoiceId: pack.echoVoiceId ?? null,
      languageCode: pack.languageCode,
      bcp47: pack.bcp47 ?? null,
      echoModelDisplayName: pack.echoModelDisplayName,
      note: 'Demo playback via Lugemi Echo Voice (first-party TTS). Use POST /v1/tts/synthesize with accentId or speechVariety for identity-aware synthesis.',
    };
  }

  private findSeed(id: string): AccentIdentitySeed {
    const hit = ACCENT_IDENTITY_SEEDS.find((s) => s.id === id);
    if (!hit) {
      throw new ApiException('not_found', 'Accent identity pack not found', HttpStatus.NOT_FOUND);
    }
    return hit;
  }

  private toDto(seed: AccentIdentitySeed): AccentIdentityDto {
    const variantSlug = seed.echoModelVariant;
    const countryLabel = COUNTRY_LABELS[seed.country] ?? seed.country;
    const speechVariety =
      seed.speechVariety ??
      deriveSpeechVariety({
        id: seed.id,
        nameEn: seed.nameEn,
        languageCode: seed.languageCode,
        country: seed.country,
        dialectCode: seed.dialectCode,
      });
    const culturalIdentity =
      seed.culturalIdentity ??
      deriveCulturalIdentityLabel({
        nameEn: seed.nameEn,
        country: seed.country,
        countryLabel,
        regionTags: seed.regionTags,
      });
    const lifestyleTags =
      seed.lifestyleTags?.length
        ? seed.lifestyleTags
        : deriveLifestyleTags({
            id: seed.id,
            regionTags: seed.regionTags,
            country: seed.country,
            languageCode: seed.languageCode,
          });

    return {
      ...seed,
      countryLabel,
      countryFlag: countryFlag(seed.country),
      echoModelDisplayName: variantSlug
        ? `Lugemi Echo Voice · ${seed.nameEn.replace(/\s*\([^)]*\)\s*/g, ' ').trim()}`
        : null,
      demoVoiceKey: seed.echoVoiceId?.replace(/^own:/, '') ?? null,
      culturalIdentity,
      speechVariety,
      lifestyleTags,
      cultural_identity: culturalIdentity,
      speech_variety: speechVariety,
      lifestyle_tags: lifestyleTags,
    };
  }
}
