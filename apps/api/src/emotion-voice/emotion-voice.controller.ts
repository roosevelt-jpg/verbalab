import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EmotionVoiceService } from './emotion-voice.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/emotion-voice')
export class EmotionVoiceController {
  constructor(private readonly emotionVoice: EmotionVoiceService) {}

  @Get('engine')
  engine {
    return this.emotionVoice.engine;
  }

  @Get('profiles')
  profiles {
    return this.emotionVoice.profiles;
  }

  @Get('engine/analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
    },
  ) {
    return this.emotionVoice.analytics(req.translateAuth.organizationId);
  }

  @Post('synthesize')
  @UseGuards(TranslateAuthGuard)
  async synthesize(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body
    body: {
      text?: string;
      emotion?: string;
      voice?: string;
      language?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
    @Res res: Response,
  ) {
    if (typeof body.text !== 'string') {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.emotion !== 'string') {
      throw new ApiException('validation_error', 'emotion is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.emotionVoice.synthesize({
      text: body.text,
      emotion: body.emotion,
      voice: body.voice,
      language: body.language,
      format: body.format,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Length', String(result.audio.length));
    res.setHeader('Content-Disposition', `inline; filename="emotion-speech.${result.format}"`);
    res.setHeader('X-Lugemi-Provider', result.provider);
    res.setHeader('X-Lugemi-Voice', result.voice);
    res.setHeader('X-Lugemi-Emotion', result.emotion);
    res.setHeader('X-Lugemi-Emotion-Mode', result.mode);
    res.setHeader('X-Lugemi-Characters', String(result.characters));
    if (result.watermarkApplied) {
      res.setHeader('X-Lugemi-Watermark', 'required');
    }
    res.status(HttpStatus.OK).send(result.audio);
  }

  @Post('stream')
  @UseGuards(TranslateAuthGuard)
  async stream(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Res res: Response,
    @Body
    body: {
      text?: string;
      emotion?: string;
      voice?: string;
      language?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
  ) {
    if (typeof body.text !== 'string') {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.emotion !== 'string') {
      throw new ApiException('validation_error', 'emotion is required', HttpStatus.BAD_REQUEST);
    }

    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Lugemi-Emotion', body.emotion);
    res.flushHeaders?.;

    const stream = this.emotionVoice.streamSynthesize({
      text: body.text,
      emotion: body.emotion,
      voice: body.voice,
      language: body.language,
      format: body.format,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });

    for await (const chunk of stream) {
      res.write(`event: ${chunk.event}\ndata: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.event === 'error' || chunk.event === 'done') break;
    }
    res.end;
  }
}
