import { HttpStatus, Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { defaultFaqVoice } from './faq-prompt';
import { VoiceAudioStore } from './voice-audio.store';
import { PromptsService } from '../prompts/prompts.service';
import { applySoftProsody, getEmotionProfile } from '../emotion-voice/emotion-profiles';

export type VoiceTurnResult = {
  userText: string;
  replyText: string;
  language: string | null;
  audioBase64: string;
  mimeType: string;
  audioId: string;
  voice: string;
  emotionProfile: string | null;
  providers: {
    stt: string | null;
    chat: string;
    tts: string;
  };
  model: string;
};

@Injectable()
export class VoiceAgentService {
  constructor(
    private readonly audio: AudioService,
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly clips: VoiceAudioStore,
    private readonly prompts: PromptsService,
  ) {}

  async turn(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
    /** Prefer audio when present. */
    file?: Express.Multer.File;
    text?: string;
    voice?: string;
    /** Emotion Voice profile for soft prosody on the reply (not trained expressive TTS). */
    emotion?: string;
    format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
  }): Promise<VoiceTurnResult> {
    const emotionProfile = input.emotion?.trim()
      ? getEmotionProfile(input.emotion.trim())
      : undefined;
    const voice =
      input.voice?.trim() ||
      emotionProfile?.preferredVoice ||
      defaultFaqVoice();
    const format = input.format ?? 'mp3';

    let userText = '';
    let language: string | null = null;
    let sttProvider: string | null = null;

    if (input.file) {
      const transcribed = await this.audio.transcribe({
        file: input.file,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      userText = transcribed.text.trim();
      language = transcribed.language;
      sttProvider = transcribed.provider;
    } else if (typeof input.text === 'string' && input.text.trim()) {
      userText = input.text.trim();
    } else {
      throw new ApiException(
        'validation_error',
        'Provide audio file or text for a voice turn',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!userText) {
      throw new ApiException('validation_error', 'Empty user utterance', HttpStatus.BAD_REQUEST);
    }

    const system = await this.prompts.resolve({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      key: 'voice_faq',
    });

    const chat = await this.gateway.chat({
      messages: [
        { role: 'system', content: system.body },
        { role: 'user', content: userText },
      ],
    });

    await this.usage.recordChat({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      tokens: chat.totalTokens,
      provider: chat.provider,
    });

    const replyText = chat.message.content.trim();
    if (!replyText) {
      throw new ApiException('provider_error', 'FAQ model returned empty reply', HttpStatus.BAD_GATEWAY);
    }

    const speakText = emotionProfile
      ? applySoftProsody(replyText, emotionProfile.prosody)
      : replyText;

    const spoken = await this.audio.speak({
      text: speakText,
      voice,
      format,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });

    const audioId = this.clips.put(spoken.audio, spoken.mimeType);
    const audioBase64 = spoken.audio.toString('base64');

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice.faq.completed',
      route: 'voice.agent.turn',
      ip: input.ip,
      metadata: {
        sttProvider,
        chatProvider: chat.provider,
        ttsProvider: spoken.provider,
        model: chat.model,
        voice,
        emotion: emotionProfile?.id ?? null,
        userChars: [...userText].length,
        replyChars: [...replyText].length,
      },
    });

    return {
      userText,
      replyText,
      language,
      audioBase64,
      mimeType: spoken.mimeType,
      audioId,
      voice,
      emotionProfile: emotionProfile?.id ?? null,
      providers: {
        stt: sttProvider,
        chat: chat.provider,
        tts: spoken.provider,
      },
      model: chat.model,
    };
  }
}
