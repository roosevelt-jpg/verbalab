import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { enrichVoice } from '../neural-tts/voice-enrichment';

export type VoiceDesignMatch = {
  id: string;
  name: string;
  gender: string;
  languages: string[];
  accent?: string | null;
  personality?: string | null;
  score: number;
  rationale: string[];
};

/**
 * Prompt → ranked catalog matches for Voice Design.
 * Does not invent synthetic voice IDs; maps creative briefs onto live Lugemi Echo voices.
 */
@Injectable()
export class VoiceDesignService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
  ) {}

  async design(input: {
    prompt: string;
    language?: string;
    gender?: string;
    limit?: number;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const prompt = input.prompt?.trim();
    if (!prompt) {
      throw new ApiException('validation_error', 'prompt is required', HttpStatus.BAD_REQUEST);
    }
    if ([...prompt].length > 2_000) {
      throw new ApiException('validation_error', 'prompt exceeds 2000 characters', HttpStatus.BAD_REQUEST);
    }

    await this.billing.assertProductQuota(input.organizationId, 'tts', Math.max(1, [...prompt].length));

    const parsed = parseBrief(prompt, input.language, input.gender);
    const catalog = this.gateway.listVoices().map((v) => enrichVoice(v));
    const scored: VoiceDesignMatch[] = catalog
      .map((v) => scoreVoice(v, parsed))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score);

    const limit = Math.min(12, Math.max(1, Math.floor(input.limit ?? 6)));
    const matches = (scored.length > 0 ? scored : fallbackMatches(catalog, parsed)).slice(0, limit);

    await this.usage.recordChat({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      tokens: Math.max(1, [...prompt].length),
      provider: 'lugemi_voice_design',
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_design.completed',
      route: 'POST /v1/voice-design',
      ip: input.ip,
      metadata: {
        matches: matches.length,
        language: parsed.language ?? null,
        gender: parsed.gender ?? null,
      },
    });

    return {
      product: 'lugemi_voice_design',
      prompt,
      brief: parsed,
      matches,
      next: {
        preview: 'POST /v1/tts/synthesize with voice from matches[].id',
        clone: 'POST /v1/voice-clones when you need a consent-gated custom enrollment',
        creative: '/creative/voice-design',
      },
    };
  }
}

type Brief = {
  language?: string;
  gender?: string;
  age?: string;
  tones: string[];
  accents: string[];
  keywords: string[];
};

function parseBrief(prompt: string, language?: string, gender?: string): Brief {
  const lower = prompt.toLowerCase();
  const tones = [
    'warm',
    'calm',
    'authoritative',
    'playful',
    'serious',
    'friendly',
    'news',
    'narration',
    'conversational',
    'energetic',
  ].filter((t) => lower.includes(t));
  const accents = [
    'ghanaian',
    'nigerian',
    'kenyan',
    'south african',
    'british',
    'american',
    'french',
    'swahili',
    'yoruba',
    'twi',
    'akan',
    'amharic',
    'zulu',
    'hausa',
    'igbo',
  ].filter((a) => lower.includes(a));
  let age: string | undefined;
  if (/\b(child|kid|young)\b/.test(lower)) age = 'child';
  else if (/\b(elder|mature|older)\b/.test(lower)) age = 'adult';
  else if (/\badult\b/.test(lower)) age = 'adult';

  let g = gender?.toLowerCase();
  if (!g) {
    if (/\b(female|woman|girl|she)\b/.test(lower)) g = 'female';
    else if (/\b(male|man|boy|he)\b/.test(lower)) g = 'male';
  }

  const langHint =
    language ||
    (lower.includes('swahili') || lower.includes('kiswahili')
      ? 'sw'
      : lower.includes('yoruba')
        ? 'yo'
        : lower.includes('twi') || lower.includes('akan')
          ? 'ak'
          : lower.includes('french')
            ? 'fr'
            : lower.includes('amharic')
              ? 'am'
              : lower.includes('hausa')
                ? 'ha'
                : lower.includes('igbo')
                  ? 'ig'
                  : lower.includes('zulu')
                    ? 'zu'
                    : undefined);

  const keywords = lower
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3)
    .slice(0, 24);

  return { language: langHint, gender: g, age, tones, accents, keywords };
}

function scoreVoice(
  v: ReturnType<typeof enrichVoice>,
  brief: Brief,
): VoiceDesignMatch {
  let score = 1;
  const rationale: string[] = [];

  if (brief.gender && v.gender === brief.gender) {
    score += 4;
    rationale.push(`gender:${v.gender}`);
  } else if (brief.gender && v.gender !== 'neutral') {
    score -= 2;
  }

  if (brief.language) {
    const hit = (v.languages ?? []).some(
      (l) =>
        l.toLowerCase().startsWith(brief.language!) ||
        l.toLowerCase().includes(brief.language!),
    );
    if (hit) {
      score += 5;
      rationale.push(`language:${brief.language}`);
    }
  }

  const accentBlob = `${v.accent ?? ''} ${v.region ?? ''} ${v.country ?? ''} ${v.name}`.toLowerCase();
  for (const a of brief.accents) {
    if (accentBlob.includes(a) || accentBlob.includes(a.replace(/\s+/g, ''))) {
      score += 3;
      rationale.push(`accent:${a}`);
    }
  }

  const toneBlob = `${v.personality ?? ''} ${(v.toneStyles ?? []).join(' ')} ${v.name}`.toLowerCase();
  for (const t of brief.tones) {
    if (toneBlob.includes(t)) {
      score += 2;
      rationale.push(`tone:${t}`);
    }
  }

  if (brief.age && (v.ageGroup === brief.age || (brief.age === 'adult' && !v.ageGroup))) {
    score += 1;
    rationale.push(`age:${brief.age}`);
  }

  for (const kw of brief.keywords) {
    if (toneBlob.includes(kw) || accentBlob.includes(kw)) score += 0.35;
  }

  if (v.status === 'live') score += 1.5;
  if (v.category === 'own') score += 0.5;

  return {
    id: v.id,
    name: v.name,
    gender: v.gender,
    languages: v.languages ?? [],
    accent: v.accent ?? null,
    personality: v.personality ?? null,
    score: Math.round(score * 10) / 10,
    rationale,
  };
}

function fallbackMatches(
  catalog: ReturnType<typeof enrichVoice>[],
  brief: Brief,
): VoiceDesignMatch[] {
  return catalog.slice(0, 6).map((v) => ({
    id: v.id,
    name: v.name,
    gender: v.gender,
    languages: v.languages ?? [],
    accent: v.accent ?? null,
    personality: v.personality ?? null,
    score: 1,
    rationale: brief.language ? ['catalog_fallback'] : ['broad_match'],
  }));
}
