/**
 * AI Gateway for the Lugemi API (translate, STT, TTS, detect, chat, embeddings).
 * Default path = first-party Lugemi model families (Baobab / Atlas / Echo / Vector).
 * Optional vendor adapters remain as silent fallbacks when env keys are present —
 * they are never the public product brand.
 */
import { Injectable, Logger } from '@nestjs/common';
import { GoogleTranslateAdapter } from './google-translate.adapter';
import { OpenAiWhisperAdapter } from './openai-whisper.adapter';
import { OpenAiTtsAdapter } from './openai-tts.adapter';
import {
  createOwnTtsAdapter,
  isOwnTtsVoice,
  ownTtsConfigured,
  resolveOwnTtsVoice,
} from './own-tts.adapter';
import {
  baseTtsLanguage,
  findNativeVoice,
  nativeVoiceUnavailable,
  ttsLanguageName,
  voiceSpeaksNatively,
} from './native-voice';
import { GoogleVisionOcrAdapter } from './google-vision-ocr.adapter';
import { GoogleDetectAdapter } from './google-detect.adapter';
import { FrancDetectAdapter } from './franc-detect.adapter';
import { OpenAiChatAdapter } from './openai-chat.adapter';
import { createOpenRouterChatAdapter } from './openai-compatible-chat.adapter';
import { createLugemiMtAdapter } from './lugemi-mt.adapter';
import { createLugemiChatAdapter } from './lugemi-chat.adapter';
import { createLugemiAsrAdapter } from './lugemi-asr.adapter';
import { createLugemiEmbedAdapter } from './lugemi-embed.adapter';
import { TranslateInput, TranslateOutput, TranslationProvider } from './translation-provider';
import { SttInput, SttOutput, SttProvider } from './stt-provider';
import { TtsInput, TtsOutput, TtsProvider, TtsVoice } from './tts-provider';
import { OcrInput, OcrOutput, OcrProvider } from './ocr-provider';
import { DetectInput, DetectOutput, LanguageDetectProvider } from './detect-provider';
import { ChatInput, ChatOutput, ChatProvider } from './chat-provider';
import { EmbedInput, EmbedOutput, EmbeddingProvider } from './embedding-provider';
import { OpenAiEmbeddingsAdapter } from './openai-embeddings.adapter';
import type { FineTuneTranslateAdapter } from '../finetunes/finetune-translate.adapter';
import type { ReadyFineTuneRoute } from '../finetunes/finetune.types';
import { ApiException } from '../common/errors/api-exception';

type FineTuneRouting = {
  resolve: (source: string, target: string) => ReadyFineTuneRoute | null;
  adapter: FineTuneTranslateAdapter;
};

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private provider: TranslationProvider;
  private vendorTranslate: TranslationProvider | null;
  private sttProvider: SttProvider;
  private vendorStt: SttProvider | null;
  private ttsProvider: TtsProvider;
  private ownTtsProvider: TtsProvider;
  private ocrProvider: OcrProvider;
  private detectPrimary: LanguageDetectProvider;
  private detectFallback: LanguageDetectProvider;
  private detectOverride: LanguageDetectProvider | null = null;
  private chatProvider: ChatProvider;
  private chatFallback: ChatProvider | null;
  private embeddingProvider: EmbeddingProvider;
  private vendorEmbedding: EmbeddingProvider | null;
  private fineTuneRouting: FineTuneRouting | null = null;
  private skipFineTuneForTests = false;

  constructor() {
    const googleKey =
      process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY || '';
    const translateKey = process.env.GOOGLE_TRANSLATE_API_KEY ?? '';
    const openaiKey = process.env.OPENAI_API_KEY ?? '';

    this.provider = createLugemiMtAdapter();
    this.vendorTranslate = translateKey.trim()
      ? new GoogleTranslateAdapter(translateKey)
      : null;

    this.sttProvider = createLugemiAsrAdapter();
    this.vendorStt = openaiKey.trim() ? new OpenAiWhisperAdapter(openaiKey) : null;

    this.ttsProvider = new OpenAiTtsAdapter(openaiKey);
    this.ownTtsProvider = createOwnTtsAdapter();
    this.ocrProvider = new GoogleVisionOcrAdapter(googleKey);

    this.detectPrimary = new FrancDetectAdapter();
    this.detectFallback = new GoogleDetectAdapter(translateKey);

    this.chatProvider = createLugemiChatAdapter();
    const openAiChat = openaiKey.trim() ? new OpenAiChatAdapter(openaiKey) : null;
    const openRouter = createOpenRouterChatAdapter(process.env.OPENROUTER_API_KEY ?? '');
    this.chatFallback = openAiChat ?? openRouter;

    this.embeddingProvider = createLugemiEmbedAdapter();
    this.vendorEmbedding = openaiKey.trim()
      ? new OpenAiEmbeddingsAdapter(openaiKey)
      : null;
  }

  setFineTuneRouting(routing: FineTuneRouting | null) {
    this.fineTuneRouting = routing;
  }

  setProviderForTests(provider: TranslationProvider) {
    this.provider = provider;
    this.vendorTranslate = null;
    this.skipFineTuneForTests = true;
  }

  allowFineTuneRoutingForTests() {
    this.skipFineTuneForTests = false;
  }

  setSttProviderForTests(provider: SttProvider) {
    this.sttProvider = provider;
    this.vendorStt = null;
  }

  setTtsProviderForTests(provider: TtsProvider) {
    this.ttsProvider = provider;
  }

  setOwnTtsProviderForTests(provider: TtsProvider) {
    this.ownTtsProvider = provider;
  }

  setOcrProviderForTests(provider: OcrProvider) {
    this.ocrProvider = provider;
  }

  setDetectProviderForTests(provider: LanguageDetectProvider) {
    this.detectOverride = provider;
  }

  setChatProviderForTests(provider: ChatProvider) {
    this.chatProvider = provider;
  }

  setChatFallbackForTests(provider: ChatProvider | null) {
    this.chatFallback = provider;
  }

  setEmbeddingProviderForTests(provider: EmbeddingProvider) {
    this.embeddingProvider = provider;
    this.vendorEmbedding = null;
  }

  async detect(input: DetectInput): Promise<DetectOutput> {
    if (this.detectOverride) {
      return this.detectOverride.detect(input);
    }

    const hasVendorDetect = Boolean(process.env.GOOGLE_TRANSLATE_API_KEY?.trim());
    if (hasVendorDetect) {
      try {
        const result = await this.detectFallback.detect(input);
        this.logger.log(
          JSON.stringify({
            event: 'gateway.detect',
            provider: 'lugemi_lid',
            via: result.provider,
            language: result.language,
            confidence: result.confidence,
          }),
        );
        return { ...result, provider: 'lugemi_lid' };
      } catch (error) {
        this.logger.warn(
          JSON.stringify({
            event: 'gateway.detect.fallback',
            reason: error instanceof Error ? error.message : 'detect failed',
          }),
        );
      }
    }

    const result = await this.detectPrimary.detect(input);
    this.logger.log(
      JSON.stringify({
        event: 'gateway.detect',
        provider: 'lugemi_lid',
        via: result.provider,
        language: result.language,
        confidence: result.confidence,
      }),
    );
    return { ...result, provider: 'lugemi_lid' };
  }

  async chat(input: ChatInput): Promise<ChatOutput> {
    try {
      const result = await this.chatProvider.complete(input);
      this.logger.log(
        JSON.stringify({
          event: 'gateway.chat',
          provider: result.provider,
          model: result.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          latencyMs: result.latencyMs,
        }),
      );
      return result;
    } catch (error) {
      if (!this.chatFallback || !this.shouldFallbackChat(error)) {
        throw error;
      }
      this.logger.warn(
        JSON.stringify({
          event: 'gateway.chat.fallback',
          from: this.chatProvider.name,
          to: this.chatFallback.name,
          reason: error instanceof Error ? error.message : 'chat failed',
        }),
      );
      const result = await this.chatFallback.complete(input);
      this.logger.log(
        JSON.stringify({
          event: 'gateway.chat',
          provider: result.provider,
          model: result.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          latencyMs: result.latencyMs,
          viaFallback: true,
        }),
      );
      return result;
    }
  }

  private shouldFallbackChat(error: unknown): boolean {
    if (!(error instanceof ApiException)) return true;
    return error.code === 'provider_error' || error.code === 'provider_not_configured';
  }

  async embed(input: EmbedInput): Promise<EmbedOutput> {
    try {
      const result = await this.embeddingProvider.embed(input);
      this.logger.log(
        JSON.stringify({
          event: 'gateway.embed',
          provider: result.provider,
          model: result.model,
          vectors: result.data.length,
          promptTokens: result.promptTokens,
          latencyMs: result.latencyMs,
        }),
      );
      return result;
    } catch (error) {
      if (!this.vendorEmbedding) throw error;
      this.logger.warn(
        JSON.stringify({
          event: 'gateway.embed.fallback',
          reason: error instanceof Error ? error.message : 'embed failed',
        }),
      );
      const result = await this.vendorEmbedding.embed(input);
      this.logger.log(
        JSON.stringify({
          event: 'gateway.embed',
          provider: result.provider,
          model: result.model,
          vectors: result.data.length,
          viaFallback: true,
        }),
      );
      return result;
    }
  }

  async translate(input: TranslateInput): Promise<TranslateOutput> {
    const route =
      this.skipFineTuneForTests
        ? null
        : (this.fineTuneRouting?.resolve(input.source, input.target) ?? null);
    if (route && this.fineTuneRouting) {
      try {
        const result = await this.fineTuneRouting.adapter.translate(input, route);
        this.logger.log(
          JSON.stringify({
            event: 'gateway.translate',
            provider: result.provider,
            modelSlug: route.slug,
            source: result.source,
            target: result.target,
            characters: result.characters,
            latencyMs: result.latencyMs,
          }),
        );
        return result;
      } catch (error) {
        this.logger.warn(
          JSON.stringify({
            event: 'gateway.translate.finetune_fallback',
            pair: `${input.source}-${input.target}`,
            reason: error instanceof Error ? error.message : 'finetune failed',
          }),
        );
      }
    }

    try {
      const result = await this.provider.translate(input);
      this.logger.log(
        JSON.stringify({
          event: 'gateway.translate',
          provider: result.provider,
          source: result.source,
          target: result.target,
          characters: result.characters,
          latencyMs: result.latencyMs,
        }),
      );
      return result;
    } catch (error) {
      if (!this.vendorTranslate) throw error;
      this.logger.warn(
        JSON.stringify({
          event: 'gateway.translate.vendor_fallback',
          reason: error instanceof Error ? error.message : 'lugemi mt failed',
        }),
      );
      const result = await this.vendorTranslate.translate(input);
      this.logger.log(
        JSON.stringify({
          event: 'gateway.translate',
          provider: result.provider,
          source: result.source,
          target: result.target,
          characters: result.characters,
          latencyMs: result.latencyMs,
          viaFallback: true,
        }),
      );
      return result;
    }
  }

  async transcribe(input: SttInput): Promise<SttOutput> {
    try {
      const result = await this.sttProvider.transcribe(input);
      this.logger.log(
        JSON.stringify({
          event: 'gateway.transcribe',
          provider: result.provider,
          language: result.language,
          durationSeconds: result.durationSeconds,
          characters: [...result.text].length,
          latencyMs: result.latencyMs,
        }),
      );
      return result;
    } catch (error) {
      if (!this.vendorStt) throw error;
      this.logger.warn(
        JSON.stringify({
          event: 'gateway.transcribe.fallback',
          reason: error instanceof Error ? error.message : 'asr failed',
        }),
      );
      const result = await this.vendorStt.transcribe(input);
      this.logger.log(
        JSON.stringify({
          event: 'gateway.transcribe',
          provider: result.provider,
          language: result.language,
          viaFallback: true,
        }),
      );
      return result;
    }
  }

  listVoices(): TtsVoice[] {
    return [...this.ownTtsProvider.listVoices(), ...this.ttsProvider.listVoices()];
  }

  /** Best native Lugemi voice for a language (live voices first), or undefined if none exists. */
  nativeVoiceFor(language: string | undefined): TtsVoice | undefined {
    return findNativeVoice(this.ownTtsProvider.listVoices(), language?.trim() || 'en');
  }

  /** Enforces the native-speaker rule before any audio is produced. */
  private resolveNativeInput(input: TtsInput): TtsInput {
    const language = baseTtsLanguage(input.language);
    if (!input.voice) {
      const native = this.nativeVoiceFor(input.language);
      if (!native) throw nativeVoiceUnavailable(input.language ?? 'en');
      return { ...input, voice: native.id };
    }
    if (isOwnTtsVoice(input.voice)) {
      const voice = resolveOwnTtsVoice(input.voice);
      if (voice && !voiceSpeaksNatively(voice, input.language)) {
        throw nativeVoiceUnavailable(
          input.language,
          `${voice.name} is a native ${ttsLanguageName(voice.locale ?? voice.languages[0]!)} voice`,
        );
      }
      return input;
    }
    if (language && language !== 'en') {
      throw nativeVoiceUnavailable(input.language, `stock voice "${input.voice}" is not a native speaker`);
    }
    return input;
  }

  async synthesize(rawInput: TtsInput): Promise<TtsOutput> {
    const input = this.resolveNativeInput(rawInput);
    const result = isOwnTtsVoice(input.voice)
      ? await this.ownTtsProvider.synthesize(input)
      : await this.ttsProvider.synthesize(input).catch(async (error) => {
          if (!ownTtsConfigured()) throw error;
          this.logger.warn(
            JSON.stringify({
              event: 'gateway.synthesize.fallback_own',
              reason: error instanceof Error ? error.message : 'stock tts failed',
            }),
          );
          const native = this.nativeVoiceFor(input.language);
          if (!native) throw error;
          return this.ownTtsProvider.synthesize({ ...input, voice: native.id });
        });
    this.logger.log(
      JSON.stringify({
        event: 'gateway.synthesize',
        provider: result.provider,
        voice: result.voice,
        characters: result.characters,
        bytes: result.audio.length,
        latencyMs: result.latencyMs,
      }),
    );
    return result;
  }

  async ocr(input: OcrInput): Promise<OcrOutput> {
    const result = await this.ocrProvider.extract(input);
    this.logger.log(
      JSON.stringify({
        event: 'gateway.ocr',
        provider: result.provider,
        pages: result.pages,
        characters: [...result.text].length,
        latencyMs: result.latencyMs,
      }),
    );
    return result;
  }
}
