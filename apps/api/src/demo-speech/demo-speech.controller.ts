import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { GatewayService } from '../gateway/gateway.service';
import { nativeVoiceUnavailable } from '../gateway/native-voice';
import { isOwnTtsVoice } from '../gateway/own-tts.adapter';

const MAX_CHARS = 300;
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 30;

/** Public marketing-site demo speech: Lugemi native voices only, per-IP limited. */
@Controller('v1/demo/speech')
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

  @Post()
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
      throw new ApiException('validation_error', `Demo text is limited to ${MAX_CHARS} characters`, HttpStatus.BAD_REQUEST);
    }
    const ip = (req.headers['fly-client-ip'] as string | undefined) ?? clientIp(req) ?? 'unknown';
    if (!this.allow(ip)) {
      throw new ApiException('rate_limited', 'Too many demo requests — try again in a few minutes', HttpStatus.TOO_MANY_REQUESTS);
    }

    const requested = typeof body.voice === 'string' && isOwnTtsVoice(body.voice) ? body.voice : undefined;
    const voice = requested ?? this.gateway.nativeVoiceFor(language)?.id;
    if (!voice) throw nativeVoiceUnavailable(language);

    const out = await this.gateway.synthesize({ text, voice, language, format: 'mp3' });
    res.setHeader('Content-Type', out.mimeType);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Lugemi-Voice', out.voice);
    res.status(HttpStatus.OK).send(out.audio);
  }
}
