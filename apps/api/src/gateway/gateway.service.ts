/**
 * AI Gateway for the Lugemi API (translate, STT, TTS, detect, chat, embeddings).
 * Google / OpenAI / third-party TTS classes in this folder are historical scaffolding for
 * local or legacy fallbacks — they are not the public product. Intended production
 * speech is OWN_TTS_URL (`own:*`). Do not treat fixtures as live GPU.
 */
import { Injectable, Logger } from '@nestjs/common';
import { GoogleTranslateAdapter } from './google-translate.adapter';
import { OpenAiWhisperAdapter } from './openai-whisper.adapter';
import { OpenAiTtsAdapter } from './openai-tts.adapter';
import { createOwnTtsAdapter, isOwnTtsVoice } from './own-tts.adapter';
import { GoogleVisionOcrAdapter } from './google-vision-ocr.adapter';
import { GoogleDetectAdapter } from './google-detect.adapter';
import { FrancDetectAdapter } from './franc-detect.adapter';
import { OpenAiChatAdapter } from './openai-chat.adapter';
import { createOpenRouterChatAdapter } from './openai-compatible-chat.adapter';
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
  private sttProvider: SttProvider;
  /** Default / stock TTS (OpenAI). Overridable in tests via setTtsProviderForTests. */
  private ttsProvider: TtsProvider;
  /** Rented open-weight TTS (VL-121). */
  private ownTtsProvider: TtsProvider;
  private ocrProvider: OcrProvider;
  private detectPrimary: LanguageDetectProvider;
  private detectFallback: LanguageDetectProvider;
  private detectOverride: LanguageDetectProvider | null = null;
  private chatProvider: ChatProvider;
  private chatFallback: ChatProvider | null;
  private embeddingProvider: EmbeddingProvider;
  private fineTuneRouting: FineTuneRouting | null = null;
  /** When true (after setProviderForTests), skip pair fine-tunes so fixtures are not shadowed. */
  private skipFineTuneForTests = false;

  constructor() {
    const googleKey =
      process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY || '';
    const translateKey = process.env.GOOGLE_TRANSLATE_API_KEY ?? '';
    const openaiKey = process.env.OPENAI_API_KEY ?? '';
    this.provider = new GoogleTranslateAdapter(translateKey);
    this.sttProvider = new OpenAiWhisperAdapter(openaiKey);
    this.ttsProvider = new OpenAiTtsAdapter(openaiKey);
    this.ownTtsProvider = createOwnTtsAdapter();
    this.ocrProvider = new GoogleVisionOcrAdapter(googleKey);
    this.detectPrimary = new GoogleDetectAdapter(translateKey);
    this.detectFallback = new FrancDetectAdapter();
    this.chatProvider = new OpenAiChatAdapter(openaiKey);
    this.chatFallback = createOpenRouterChatAdapter(process.env.OPENROUTER_API_KEY ?? '');
    this.embeddingProvider = new OpenAiEmbeddingsAdapter(openaiKey);
  }

  /** Wired by FineTunesService onModuleInit — pair-routed fine-tune adapter. */
  setFineTuneRouting(routing: FineTuneRouting | null) {
    this.fineTuneRouting = routing;
  }

  /** Test hook only — inject a fixture provider; never used in production bootstrap. */
  setProviderForTests(provider: TranslationProvider) {
    this.provider = provider;
    this.skipFineTuneForTests = true;
  }

  /** Test hook — re-enable pair fine-tune routing after setProviderForTests. */
  allowFineTuneRoutingForTests() {
    this.skipFineTuneForTests = false;
  }

  /** Test hook only. */
  setSttProviderForTests(provider: SttProvider) {
    this.sttProvider = provider;
  }

  /** Test hook only. */
  setTtsProviderForTests(provider: TtsProvider) {
    this.ttsProvider = provider;
  }

  /** Test hook only — inject own/rented TTS adapter. */
  setOwnTtsProviderForTests(provider: TtsProvider) {
    this.ownTtsProvider = provider;
  }

  /** Test hook only. */
  setOcrProviderForTests(provider: OcrProvider) {
    this.ocrProvider = provider;
  }

  /** Test hook only. */
  setDetectProviderForTests(provider: LanguageDetectProvider) {
    this.detectOverride = provider;
  }

  /** Test hook only. */
  setChatProviderForTests(provider: ChatProvider) {
    this.chatProvider = provider;
  }

  /** Test hook only — inject OpenRouter / OpenAI-compatible chat fallback. */
  setChatFallbackForTests(provider: ChatProvider | null) {
    this.chatFallback = provider;
  }

  /** Test hook only. */
  setEmbeddingProviderForTests(provider: EmbeddingProvider) {
    this.embeddingProvider = provider;
  }

  async detect(input: DetectInput): Promise<DetectOutput> {
    if (this.detectOverride) {
      return this.detectOverride.detect(input);
    }

    const hasGoogleKey = Boolean(process.env.GOOGLE_TRANSLATE_API_KEY);
    if (hasGoogleKey) {
      try {
        const result = await this.detectPrimary.detect(input);
        this.logger.log(
          JSON.stringify({
            event: 'gateway.detect',
            provider: result.provider,
            language: result.language,
            confidence: result.confidence,
          }),
        );
        return result;
      } catch (error) {
        this.logger.warn(
          JSON.stringify({
            event: 'gateway.detect.fallback',
            reason: error instanceof Error ? error.message : 'detect failed',
          }),
        );
      }
    }

    const result = await this.detectFallback.detect(input);
    this.logger.log(
      JSON.stringify({
        event: 'gateway.detect',
        provider: result.provider,
        language: result.language,
        confidence: result.confidence,
      }),
    );
    return result;
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
  }

  async transcribe(input: SttInput): Promise<SttOutput> {
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
  }

  listVoices(): TtsVoice[] {
    return [...this.ttsProvider.listVoices(), ...this.ownTtsProvider.listVoices()];
  }

  async synthesize(input: TtsInput): Promise<TtsOutput> {
    const result = isOwnTtsVoice(input.voice)
      ? await this.ownTtsProvider.synthesize(input)
      : await this.ttsProvider.synthesize(input);
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
