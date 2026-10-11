import { Body, Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { GatewayService } from '../gateway/gateway.service';
import { nativeVoiceUnavailable } from '../gateway/native-voice';
import { capabilityForVoice } from '../gateway/voice-capability-registry';
import { DEMO_CATALOGUE } from './demo-catalogue';
import { resolveDemoSpeechTarget } from './demo-resolve';

const MAX_CHARS = 300;
const WINDOW_MS = 10 * 60_000;
/** Accent Identity has 200+ packs — allow browsing without tripping mid-session. */
const MAX_PER_WINDOW = 400;

/** Public marketing-site demo speech: Lugemi native voices only, per-IP limited. */
@Controller('v1/demo')
export class DemoSpeechController {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly gateway: GatewayService) {}

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

  /**
   * Honest capability catalogue for marketing demos.
   * Only voices with eSpeak or neural checkpoints are demoSafe.
   */
  @Get('speech/capabilities')
  capabilities() {
    return {
      product: 'lugemi-demo-speech',
      note:
        'Customer-facing demos play verified eSpeak or neural-live paths. Identity packs without native weights remap to the cultural English/French variety of the same country — never formant noise.',
      catalogue: DEMO_CATALOGUE,
      voices: DEMO_CATALOGUE.map((entry) => {
        const cap = capabilityForVoice({
          voiceId: entry.voiceId,
          locale: entry.locale,
        });
        return { ...entry, ...cap };
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
    const target = resolveDemoSpeechTarget({ text, language, voice: voiceHint });
    if (!target.voice) throw nativeVoiceUnavailable(language);

    const out = await this.gateway.synthesize({
      text: target.text.slice(0, MAX_CHARS),
      voice: target.voice,
      language: target.language,
      format: 'mp3',
      requireIntelligible: true,
    });

    // Reject non-audio payloads (e.g. JSON/HTML/fixture text) before browser playback.
    if (!looksLikeAudio(out.audio, out.mimeType)) {
      throw new ApiException(
        'provider_error',
        'Speech engine returned a non-audio payload; refusing to play',
        HttpStatus.BAD_GATEWAY,
      );
    }

    res.setHeader('Content-Type', out.mimeType);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Lugemi-Voice', out.voice);
    res.setHeader('X-Lugemi-Provider', out.provider);
    if (out.synthEngine) res.setHeader('X-Lugemi-Synth-Engine', out.synthEngine);
    if (out.verificationStatus) {
      res.setHeader('X-Lugemi-Verification-Status', out.verificationStatus);
    }
    res.setHeader('X-Lugemi-Synthetic-Speech', 'true');
    if (target.remapped) {
      res.setHeader('X-Lugemi-Demo-Remapped', 'true');
      if (target.requestedVoice) res.setHeader('X-Lugemi-Requested-Voice', target.requestedVoice);
      res.setHeader('X-Lugemi-Requested-Language', target.requestedLanguage);
      if (target.note) res.setHeader('X-Lugemi-Demo-Note', target.note.slice(0, 200));
    }
    res.status(HttpStatus.OK).send(out.audio);
  }
}

function looksLikeAudio(buf: Buffer, mimeType: string): boolean {
  if (!buf || buf.length < 64) return false;
  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('json') || mime.includes('text') || mime.includes('html')) return false;
  // WAV
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE') return true;
  // MP3 frame sync or ID3
  if (buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0) return true;
  if (buf.toString('ascii', 0, 3) === 'ID3') return true;
  // Ogg
  if (buf.toString('ascii', 0, 4) === 'OggS') return true;
  // If mime claims audio/* and payload is substantial, accept (remote engines may use containers)
  if (mime.startsWith('audio/') && buf.length > 256) return true;
  return false;
}
