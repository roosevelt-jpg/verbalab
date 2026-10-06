import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import {
  ACCENT_IDENTITY_SEEDS,
  COUNTRY_LABELS,
  countryFlag,
  type AccentIdentitySeed,
} from './accent-identity-seeds';

export type AccentIdentityDto = AccentIdentitySeed & {
  countryLabel: string;
  countryFlag: string;
  echoModelDisplayName: string | null;
  demoVoiceKey: string | null;
};

@Injectable()
export class AccentIdentityService {
  list(filters?: { country?: string; region?: string; language?: string; q?: string }) {
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

    const q = filters?.q?.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.id.includes(q) ||
          r.nameEn.toLowerCase().includes(q) ||
          r.identityProfile.toLowerCase().includes(q) ||
          r.samplePhrase.toLowerCase().includes(q) ||
          r.regionTags.some((t) => t.toLowerCase().includes(q)) ||
          r.pronunciationMarkers.some((m) => m.toLowerCase().includes(q)),
      );
    }

    const countries = [...new Set(ACCENT_IDENTITY_SEEDS.map((s) => s.country))].sort();
    const regions = [
      ...new Set(ACCENT_IDENTITY_SEEDS.flatMap((s) => s.regionTags)),
    ].sort();

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
      note:
        'Accent Identity Packs link tribe, culture, and religion context to Lugemi Echo Voice pronunciation demos. Plain-text metadata — not unlimited acoustic coverage.',
      product: 'Lugemi Accent Identity',
    };
  }

  get(id: string) {
    const seed = this.findSeed(id);
    return this.toDto(seed);
  }

  resolveForPlayback(input: { accentId?: string; dialectId?: string }) {
    const accentId = input.accentId?.trim();
    const dialectId = input.dialectId?.trim();

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

    throw new ApiException(
      'not_found',
      'Accent identity pack not found for the given accentId or dialectId',
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
      echoVoiceId: pack.echoVoiceId ?? null,
      languageCode: pack.languageCode,
      bcp47: pack.bcp47 ?? null,
      echoModelDisplayName: pack.echoModelDisplayName,
      note: 'Demo playback via Lugemi Echo Voice (first-party TTS). Use POST /v1/tts/synthesize with accentId for identity-aware synthesis.',
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
    return {
      ...seed,
      countryLabel: COUNTRY_LABELS[seed.country] ?? seed.country,
      countryFlag: countryFlag(seed.country),
      echoModelDisplayName: variantSlug
        ? `Lugemi Echo Voice · ${seed.nameEn.replace(/\s*\([^)]*\)\s*/g, ' ').trim()}`
        : null,
      demoVoiceKey: seed.echoVoiceId?.replace(/^own:/, '') ?? null,
    };
  }
}
