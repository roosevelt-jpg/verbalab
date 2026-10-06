import { Injectable } from '@nestjs/common';
import { TranslateService } from '../translate/translate.service';
import { AudioService } from '../audio/audio.service';
import { MixService } from '../mix/mix.service';
import { AccentsService } from '../accents/accents.service';
import { AccentIdentityService } from '../accents/accent-identity.service';
import { VoiceClonesService } from '../voice-clones/voice-clones.service';
import { LanguagesService } from '../languages/languages.service';
import { ModelsService } from '../models/models.service';
import { MCP_TOOLS, MCP_SERVER_INFO, MCP_PROTOCOL_VERSION } from './mcp.tools';
import type { TranslateAuthContext } from '../common/guards/translate-auth.guard';

type JsonRpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

@Injectable()
export class McpService {
  constructor(
    private readonly translate: TranslateService,
    private readonly audio: AudioService,
    private readonly mix: MixService,
    private readonly accents: AccentsService,
    private readonly identity: AccentIdentityService,
    private readonly clones: VoiceClonesService,
    private readonly languages: LanguagesService,
    private readonly models: ModelsService,
  ) {}

  async handleMessage(
    msg: JsonRpc,
    auth: TranslateAuthContext | null,
    meta?: { userId?: string; ip?: string },
  ): Promise<{ id: string | number | null; result?: unknown; error?: { code: number; message: string } }> {
    const id = msg.id ?? null;
    if (msg.method === 'initialize') {
      return {
        id,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          serverInfo: MCP_SERVER_INFO,
          capabilities: { tools: {} },
        },
      };
    }
    if (msg.method === 'notifications/initialized' || msg.method === 'initialized') return { id, result: {} };
    if (msg.method === 'tools/list') return { id, result: { tools: MCP_TOOLS } };
    if (msg.method === 'ping') return { id, result: {} };
    if (msg.method === 'tools/call') {
      if (!auth) {
        return {
          id,
          result: {
            content: [
              {
                type: 'text',
                text: 'Authorization: Bearer lg_live_… (or lg_test_…) required for Lugemi MCP tool calls.',
              },
            ],
            isError: true,
          },
        };
      }
      const name = String(msg.params?.name ?? '');
      const args = (msg.params?.arguments as Record<string, unknown>) ?? {};
      try {
        return { id, result: await this.callTool(name, args, auth, meta) };
      } catch (err) {
        return {
          id,
          result: {
            content: [{ type: 'text', text: err instanceof Error ? err.message : 'Tool failed' }],
            isError: true,
          },
        };
      }
    }
    return { id, error: { code: -32601, message: `Method not found: ${msg.method ?? 'unknown'}` } };
  }

  private ok(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  }

  private async synthesize(
    args: Record<string, unknown>,
    auth: TranslateAuthContext,
    meta?: { userId?: string; ip?: string },
  ) {
    const speech = await this.audio.speak({
      text: String(args.text ?? ''),
      voice: String(args.voice ?? 'own:ak-gh-female'),
      language: args.language ? String(args.language) : undefined,
      format: (args.format as 'mp3' | 'wav' | 'opus' | 'aac' | 'flac' | undefined) ?? 'mp3',
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: meta?.userId,
      ip: meta?.ip,
    });
    return {
      mimeType: `audio/${speech.format || 'mpeg'}`,
      voice: speech.voice,
      provider: speech.provider,
      characters: speech.characters,
      watermarkApplied: speech.watermarkApplied,
      audioBase64: Buffer.from(speech.audio).toString('base64'),
      byteLength: speech.audio.length,
      modelFamily: 'Echo',
    };
  }

  private multerFromArgs(args: Record<string, unknown>): Express.Multer.File | undefined {
    const b64 = args.audioBase64 ? String(args.audioBase64) : '';
    if (!b64) return undefined;
    const filename = args.filename ? String(args.filename) : 'audio.wav';
    const buffer = Buffer.from(b64, 'base64');
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'wav';
    const mime =
      ext === 'mp3'
        ? 'audio/mpeg'
        : ext === 'wav'
          ? 'audio/wav'
          : ext === 'ogg'
            ? 'audio/ogg'
            : ext === 'webm'
              ? 'audio/webm'
              : 'application/octet-stream';
    return {
      fieldname: 'file',
      originalname: filename,
      encoding: '7bit',
      mimetype: mime,
      size: buffer.length,
      buffer,
      destination: '',
      filename,
      path: '',
      stream: undefined as unknown as Express.Multer.File['stream'],
    };
  }

  private async callTool(
    name: string,
    args: Record<string, unknown>,
    auth: TranslateAuthContext,
    meta?: { userId?: string; ip?: string },
  ) {
    switch (name) {
      case 'lugemi_translate': {
        const result = await this.translate.translate({
          text: String(args.text ?? ''),
          source: String(args.source ?? 'auto'),
          target: String(args.target ?? 'ak'),
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          apiKeyId: auth.apiKeyId,
          userId: meta?.userId,
          ip: meta?.ip,
        });
        return this.ok({ ...result, modelFamily: 'Baobab' });
      }
      case 'lugemi_tts_synthesize':
      case 'lugemi_speech_synthesize':
        return this.ok(await this.synthesize(args, auth, meta));
      case 'lugemi_transcribe': {
        const file = this.multerFromArgs(args);
        if (!file) {
          return {
            content: [{ type: 'text', text: 'Provide audioBase64 and filename for transcription.' }],
            isError: true,
          };
        }
        const result = await this.audio.transcribe({
          file,
          language: args.language ? String(args.language) : undefined,
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          apiKeyId: auth.apiKeyId,
          userId: meta?.userId,
          ip: meta?.ip,
        });
        return this.ok({ ...result, modelFamily: 'Echo' });
      }
      case 'lugemi_mix_transcribe_translate': {
        const target = String(args.target ?? '');
        if (!target) return { content: [{ type: 'text', text: 'target is required' }], isError: true };
        const file = this.multerFromArgs(args);
        const result = await this.mix.transcribeTranslate({
          file,
          textHint: args.textHint ? String(args.textHint) : undefined,
          target,
          sourceHints: Array.isArray(args.sourceHints) ? (args.sourceHints as string[]) : undefined,
          varietyId: args.varietyId ? String(args.varietyId) : undefined,
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          apiKeyId: auth.apiKeyId,
          userId: meta?.userId,
          ip: meta?.ip,
        });
        return this.ok({ ...result, modelFamily: 'Echo + Baobab (Mix)' });
      }
      case 'lugemi_video_voice_line': {
        const target = String(args.target ?? 'ak');
        const translated = await this.translate.translate({
          text: String(args.text ?? ''),
          source: String(args.source ?? 'auto'),
          target,
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          apiKeyId: auth.apiKeyId,
          userId: meta?.userId,
          ip: meta?.ip,
        });
        const audio = await this.synthesize(
          { text: translated.text, voice: args.voice, language: target, format: args.format },
          auth,
          meta,
        );
        return this.ok({
          translated: translated.text,
          source: translated.source,
          target,
          characters: translated.characters,
          modelFamily: 'Baobab + Echo',
          audio,
        });
      }
      case 'lugemi_voices_list':
        return this.ok(this.audio.listVoices());
      case 'lugemi_voice_clones_list': {
        const clones = await this.clones.list(auth.organizationId, auth.workspaceId);
        return this.ok({ data: clones });
      }
      case 'lugemi_languages_list': {
        const items = await this.languages.list();
        return this.ok({
          data: items.map((lang) => ({
            code: lang.code,
            name: lang.nameEn,
            nativeName: lang.nameNative,
            script: lang.script,
            familyCode: lang.familyCode,
            rtl: lang.rtl,
            tier: lang.tier,
          })),
        });
      }
      case 'lugemi_accents_list': {
        const language = args.language ? String(args.language) : undefined;
        const base = await this.accents.list(language);
        if (args.includeIdentity === true || args.includeIdentity === 'true') {
          const packs = this.identity.list({ language });
          return this.ok({ ...base, identityPacks: packs.data, identityCount: packs.count });
        }
        return this.ok(base);
      }
      case 'lugemi_accent_identity_list':
        return this.ok(
          this.identity.list({
            country: args.country ? String(args.country) : undefined,
            region: args.region ? String(args.region) : undefined,
            language: args.language ? String(args.language) : undefined,
            q: args.q ? String(args.q) : undefined,
          }),
        );
      case 'lugemi_accent_identity_play': {
        const packId = String(args.id ?? '');
        if (!packId) return { content: [{ type: 'text', text: 'id is required' }], isError: true };
        const demo = this.identity.demoMeta(packId);
        let audio: unknown = null;
        if (args.synthesize === true || args.synthesize === 'true') {
          audio = await this.synthesize(
            {
              text: demo.samplePhrase,
              voice: demo.echoVoiceId || 'own:ak-gh-female',
              language: demo.languageCode,
              format: args.format,
              accentId: packId,
            },
            auth,
            meta,
          );
        }
        return this.ok({ ...demo, audio, modelFamily: 'Echo' });
      }
      case 'lugemi_models_list': {
        const live = await this.models.liveMatrix();
        const feature = args.feature ? String(args.feature) : '';
        const features = (live.features ?? [])
          .filter((f: { feature: string }) => !feature || f.feature === feature)
          .map((f: { feature: string; models: Array<{ kind?: string; provider?: string }> }) => ({
            ...f,
            models: f.models.filter((m) => m.kind === 'lugemi' || m.provider === 'lugemi'),
          }));
        return this.ok({ families: ['Baobab', 'Echo', 'Atlas'], disclaimer: live.disclaimer, features });
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  }
}
