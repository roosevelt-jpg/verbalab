import { Body, Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { GatewayService } from '../gateway/gateway.service';
import { capabilityForVoice } from '../gateway/voice-capability-registry';
import { NativeSpeechEngineService } from '../native-speech-engine/nse.service';
import { DEMO_CATALOGUE } from './demo-catalogue';

const MAX_CHARS = 300;
const WINDOW_MS = 10 * 60_000;
/** Accent Identity has 200+ packs — allow browsing without tripping mid-session. */
const MAX_PER_WINDOW = 400;

/** Public marketing-site demo speech — routes through Native Speech Engine. */
@Controller('v1/demo')
export class DemoSpeechController {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly gateway: GatewayService,
    private readonly nse: NativeSpeechEngineService,
  ) {}

  private allow(ip: string): boolean {
    const now = Date.now();
    if (this.hits.size > 10_000) {
      for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key);
    }
    const entry = this.hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }
    entry.count += 1;
    return entry.count <= MAX_PER_WINDOW;
  }

  @Get('speech/capabilities')
  capabilities() {
    const liveById = new Map(this.gateway.listVoices().map((v) => [v.id, v] as const));
    const engine = this.nse.capabilities();
    return {
      product: 'lugemi-demo-speech',
      engine: 'native_speech_engine',
      note:
        'Customer-facing demos play via Native Speech Engine: verified eSpeak or neural-live paths. Identity packs without native weights remap to the cultural English/French variety of the same country — never formant noise.',
      catalogue: DEMO_CATALOGUE,
      engineHonesty: engine.honesty,
      voices: DEMO_CATALOGUE.map((entry) => {
        const live = liveById.get(entry.voiceId);
        const neuralLive =
          live?.verificationStatus === 'neural_unreviewed' ||
          live?.verificationStatus === 'native_reviewed' ||
          live?.synthEngine === 'neural_kokoro' ||
          live?.synthEngine === 'neural_piper' ||
          live?.status === 'live';
        const cap = capabilityForVoice({
          voiceId: entry.voiceId,
          locale: entry.locale,
          neuralLive,
        });
        return {
          ...entry,
          ...cap,
          status: live?.status ?? cap.verificationStatus,
          synthEngine: live?.synthEngine ?? cap.localEngine,
        };
      }),
    };
  }

  @Post('speech')
  async speak(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { text?: unknown; language?: unknown; voice?: unknown },
  ) {
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const language = typeof body.language === 'string' ? body.language.trim() : '';
    if (!text || !language) {
      throw new ApiException('validation_error', 'text and language are required', HttpStatus.BAD_REQUEST);
    }
    if ([...text].length > MAX_CHARS) {
      throw new ApiException(
        'validation_error',
        `Demo text is limited to ${MAX_CHARS} characters`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const ip = (req.headers['fly-client-ip'] as string | undefined) ?? clientIp(req) ?? 'unknown';
    if (!this.allow(ip)) {
      throw new ApiException(
        'rate_limited',
        'Too many demo requests — try again in a few minutes',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const voiceHint = typeof body.voice === 'string' ? body.voice.trim() : undefined;
    const result = await this.nse.synthesize({
      text: text.slice(0, MAX_CHARS),
      language,
      voice: voiceHint,
      format: 'mp3',
      requireIntelligible: true,
      demoRemap: true,
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Lugemi-Voice', result._headers.voice);
    res.setHeader('X-Lugemi-Provider', result._headers.provider);
    res.setHeader('X-Lugemi-Engine', 'native_speech_engine');
    res.setHeader('X-Lugemi-Job-Id', result.jobId);
    if (result._headers.synthEngine) res.setHeader('X-Lugemi-Synth-Engine', result._headers.synthEngine);
    if (result._headers.verificationStatus) {
      res.setHeader('X-Lugemi-Verification-Status', result._headers.verificationStatus);
    }
    res.setHeader('X-Lugemi-Synthetic-Speech', 'true');
    res.setHeader('X-Lugemi-Capability-Status', result.capabilityStatus);
    if (result._headers.remapped) {
      res.setHeader('X-Lugemi-Demo-Remapped', 'true');
      if (result._headers.requestedVoice) {
        res.setHeader('X-Lugemi-Requested-Voice', result._headers.requestedVoice);
      }
      res.setHeader('X-Lugemi-Requested-Language', result._headers.requestedLanguage);
      if (result._headers.remapNote) {
        res.setHeader('X-Lugemi-Demo-Note', result._headers.remapNote.slice(0, 200));
      }
    }
    res.status(HttpStatus.OK).send(result._audio);
  }
}
