import { readFileSync, writeFileSync } from 'node:fs';
import { MCP_PROTOCOL_VERSION, MCP_SERVER_INFO } from './tools.js';

export type LugemiMcpConfig = {
  apiKey: string;
  baseUrl: string;
};

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export class LugemiMcpApi {
  constructor(private readonly config: LugemiMcpConfig) {}

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      Accept: 'application/json',
      ...extra,
    };
  }

  async json<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | undefined>,
  ): Promise<T> {
    const base = this.config.baseUrl.endsWith('/') ? this.config.baseUrl : `${this.config.baseUrl}/`;
    const url = new URL(path.replace(/^\//, ''), base);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== '') url.searchParams.set(k, v);
      }
    }
    const res = await fetch(url, {
      method,
      headers: this.headers(body !== undefined ? { 'Content-Type': 'application/json' } : undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(errBody.error?.message ?? `Lugemi API ${method} ${path} failed (${res.status})`);
    }
    return (await res.json()) as T;
  }

  async form<T = unknown>(path: string, form: FormData): Promise<T> {
    const base = this.config.baseUrl.endsWith('/') ? this.config.baseUrl : `${this.config.baseUrl}/`;
    const url = new URL(path.replace(/^\//, ''), base);
    const res = await fetch(url, { method: 'POST', headers: this.headers(), body: form });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(errBody.error?.message ?? `Lugemi API POST ${path} failed (${res.status})`);
    }
    return (await res.json()) as T;
  }

  async speechBytes(input: {
    text: string;
    voice: string;
    language?: string;
    format?: string;
    accentId?: string;
  }): Promise<{
    audio: Uint8Array;
    mimeType: string;
    voice?: string;
    provider?: string;
    characters?: number;
    watermarkApplied?: boolean;
  }> {
    const base = this.config.baseUrl.endsWith('/') ? this.config.baseUrl : `${this.config.baseUrl}/`;
    const url = new URL('v1/audio/speech', base);
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json', Accept: '*/*' }),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(errBody.error?.message ?? `TTS failed (${res.status})`);
    }
    const audio = new Uint8Array(await res.arrayBuffer());
    return {
      audio,
      mimeType: res.headers.get('content-type') ?? 'audio/mpeg',
      voice: res.headers.get('x-lugemi-voice') ?? undefined,
      provider: res.headers.get('x-lugemi-provider') ?? undefined,
      characters: Number(res.headers.get('x-lugemi-characters') ?? '') || undefined,
      watermarkApplied: res.headers.get('x-lugemi-watermark') === 'required',
    };
  }
}

export function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export function resolveAudioBlob(args: Record<string, unknown>): { blob: Blob; filename: string } {
  const filePath = args.filePath ? String(args.filePath) : '';
  if (filePath) {
    const buf = readFileSync(filePath);
    const filename =
      (args.filename ? String(args.filename) : '') || filePath.split(/[/\\]/).pop() || 'audio.wav';
    return { blob: new Blob([buf]), filename };
  }
  const b64 = args.audioBase64 ? String(args.audioBase64) : '';
  if (!b64) throw new Error('Provide audioBase64 (+ filename) or filePath');
  const filename = args.filename ? String(args.filename) : 'audio.wav';
  return { blob: new Blob([Buffer.from(b64, 'base64')]), filename };
}

export async function handleMcpTool(
  api: LugemiMcpApi,
  name: string,
  args: Record<string, unknown>,
  opts?: { allowOutPath?: boolean },
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const allowOutPath = opts?.allowOutPath ?? true;

  const synthesize = async (synthArgs: Record<string, unknown>) => {
    const speech = await api.speechBytes({
      text: String(synthArgs.text ?? ''),
      voice: String(synthArgs.voice ?? 'own:ak-gh-female'),
      language: synthArgs.language ? String(synthArgs.language) : undefined,
      format: synthArgs.format ? String(synthArgs.format) : 'mp3',
      accentId: synthArgs.accentId ? String(synthArgs.accentId) : undefined,
    });
    const outPath = allowOutPath && synthArgs.outPath ? String(synthArgs.outPath) : null;
    if (outPath) writeFileSync(outPath, speech.audio);
    return {
      mimeType: speech.mimeType,
      voice: speech.voice,
      provider: speech.provider,
      characters: speech.characters,
      watermarkApplied: speech.watermarkApplied,
      audioBase64: toBase64(speech.audio),
      byteLength: speech.audio.byteLength,
      outPath,
      modelFamily: 'Echo',
    };
  };

  try {
    switch (name) {
      case 'lugemi_translate': {
        const result = await api.json<Json>('POST', '/v1/translate', {
          text: String(args.text ?? ''),
          source: String(args.source ?? 'auto'),
          target: String(args.target ?? 'ak'),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify({ ...(result as object), modelFamily: 'Baobab' }, null, 2) }],
        };
      }
      case 'lugemi_tts_synthesize':
      case 'lugemi_speech_synthesize':
        return { content: [{ type: 'text', text: JSON.stringify(await synthesize(args), null, 2) }] };
      case 'lugemi_transcribe': {
        const { blob, filename } = resolveAudioBlob(args);
        const form = new FormData();
        form.append('file', blob, filename);
        if (args.language) form.append('language', String(args.language));
        const result = await api.form<Json>('/v1/audio/transcriptions', form);
        return {
          content: [{ type: 'text', text: JSON.stringify({ ...(result as object), modelFamily: 'Echo' }, null, 2) }],
        };
      }
      case 'lugemi_mix_transcribe_translate': {
        const target = String(args.target ?? '');
        if (!target) throw new Error('target is required');
        const form = new FormData();
        form.append('target', target);
        if (args.textHint) form.append('textHint', String(args.textHint));
        if (args.varietyId) form.append('varietyId', String(args.varietyId));
        if (Array.isArray(args.sourceHints)) form.append('sourceHints', (args.sourceHints as string[]).join(','));
        if (args.audioBase64 || args.filePath) {
          const { blob, filename } = resolveAudioBlob(args);
          form.append('file', blob, filename);
        }
        const result = await api.form<Json>('/v1/mix/transcribe-translate', form);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ ...(result as object), modelFamily: 'Echo + Baobab (Mix)' }, null, 2),
          }],
        };
      }
      case 'lugemi_video_voice_line': {
        const target = String(args.target ?? 'ak');
        const translated = (await api.json('POST', '/v1/translate', {
          text: String(args.text ?? ''),
          source: String(args.source ?? 'auto'),
          target,
        })) as { text: string; source?: string; characters?: number };
        const locale = args.locale ? String(args.locale) : target;
        const accentId = args.accentId ? String(args.accentId) : undefined;
        const speechVariety = args.speechVariety ? String(args.speechVariety) : undefined;
        type IdentityPack = {
          id?: string;
          echoVoiceId?: string;
          bcp47?: string;
          cultural_identity?: string;
          speech_variety?: string;
          lifestyle_tags?: string[];
        };
        let pack: IdentityPack | null = null;
        try {
          if (accentId) {
            pack = (await api.json('GET', `/v1/accents/identity/${encodeURIComponent(accentId)}`)) as IdentityPack;
          } else if (speechVariety) {
            const list = (await api.json('GET', '/v1/accents/identity', undefined, {
              speechVariety,
            })) as { data?: IdentityPack[] };
            pack = list.data?.[0] ?? null;
          } else {
            const list = (await api.json('GET', '/v1/accents/identity', undefined, {
              q: locale,
            })) as { data?: IdentityPack[]; culturalEnglishDefaults?: Record<string, { accentIdentityId: string }> };
            const defaults = list.culturalEnglishDefaults?.[locale];
            if (defaults?.accentIdentityId) {
              pack = (await api.json(
                'GET',
                `/v1/accents/identity/${encodeURIComponent(defaults.accentIdentityId)}`,
              )) as IdentityPack;
            } else {
              pack = list.data?.find((p) => p.bcp47 === locale) ?? list.data?.[0] ?? null;
            }
          }
        } catch {
          pack = null;
        }
        const voice = (args.voice ? String(args.voice) : undefined) || pack?.echoVoiceId || 'own:ak-gh-female';
        const audio = await synthesize({
          text: translated.text,
          voice,
          language: pack?.bcp47 || target,
          format: args.format,
          outPath: args.outPath,
          accentId: pack?.id ?? accentId,
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              translated: translated.text,
              source: translated.source,
              target,
              characters: translated.characters,
              modelFamily: 'Baobab + Echo',
              cultural_identity: pack?.cultural_identity ?? null,
              speech_variety: pack?.speech_variety ?? null,
              lifestyle_tags: pack?.lifestyle_tags ?? null,
              accentIdentityId: pack?.id ?? null,
              voice,
              audio,
            }, null, 2),
          }],
        };
      }
      case 'lugemi_voices_list':
        return { content: [{ type: 'text', text: JSON.stringify(await api.json('GET', '/v1/audio/voices'), null, 2) }] };
      case 'lugemi_voice_clones_list':
        return { content: [{ type: 'text', text: JSON.stringify(await api.json('GET', '/v1/voice-clones'), null, 2) }] };
      case 'lugemi_languages_list':
        return { content: [{ type: 'text', text: JSON.stringify(await api.json('GET', '/v1/languages'), null, 2) }] };
      case 'lugemi_accents_list': {
        const accents = await api.json('GET', '/v1/accents', undefined, {
          language: args.language ? String(args.language) : undefined,
          includeIdentity: args.includeIdentity === true || args.includeIdentity === 'true' ? 'true' : undefined,
        });
        return { content: [{ type: 'text', text: JSON.stringify(accents, null, 2) }] };
      }
      case 'lugemi_accent_identity_list': {
        const packs = await api.json('GET', '/v1/accents/identity', undefined, {
          country: args.country ? String(args.country) : undefined,
          region: args.region ? String(args.region) : undefined,
          language: args.language ? String(args.language) : undefined,
          q: args.q ? String(args.q) : undefined,
        });
        return { content: [{ type: 'text', text: JSON.stringify(packs, null, 2) }] };
      }
      case 'lugemi_accent_identity_play': {
        const id = String(args.id ?? '');
        if (!id) throw new Error('id is required');
        const meta = (await api.json('GET', `/v1/accents/identity/${encodeURIComponent(id)}/demo`)) as Record<string, unknown>;
        let audio: unknown = null;
        if (args.synthesize === true || args.synthesize === 'true') {
          audio = await synthesize({
            text: String(meta.samplePhrase ?? ''),
            voice: String(meta.echoVoiceId || meta.demoVoiceKey || 'own:ak-gh-female'),
            language: meta.languageCode ? String(meta.languageCode) : undefined,
            format: args.format,
            accentId: id,
            outPath: args.outPath,
          });
        }
        return { content: [{ type: 'text', text: JSON.stringify({ ...meta, audio, modelFamily: 'Echo' }, null, 2) }] };
      }
      case 'lugemi_models_list': {
        const live = await api.json<{ features?: Array<{ feature: string; models: unknown[] }>; disclaimer?: string }>(
          'GET',
          '/v1/models/live',
        );
        const feature = args.feature ? String(args.feature) : '';
        const features = feature ? (live.features ?? []).filter((f) => f.feature === feature) : live.features;
        const firstParty = (features ?? []).map((f) => ({
          ...f,
          models: (f.models as Array<{ kind?: string; provider?: string }>).filter(
            (m) => m.kind === 'lugemi' || m.provider === 'lugemi',
          ),
        }));
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ families: ['Baobab', 'Echo', 'Atlas'], disclaimer: live.disclaimer, features: firstParty }, null, 2),
          }],
        };
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: err instanceof Error ? err.message : 'Tool failed' }],
      isError: true,
    };
  }
}

export function mcpInitializeResult() {
  return {
    protocolVersion: MCP_PROTOCOL_VERSION,
    serverInfo: MCP_SERVER_INFO,
    capabilities: { tools: {} },
  };
}
