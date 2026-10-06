import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { EmotionIntelligenceService } from './emotion-intelligence.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { audioMaxBytes } from '../audio/audio-limits';

@Controller('v1/emotion')
export class EmotionIntelligenceController {
  constructor(private readonly emotion: EmotionIntelligenceService) {}

  @Get('engine')
  engine() {
    return this.emotion.engine();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(
    @Req()
    req: Request & { translateAuth: TranslateAuthContext },
  ) {
    return this.emotion.analytics(req.translateAuth.organizationId);
  }

  @Post('detect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  detect(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { text?: string; language?: string },
  ) {
    const text = typeof body.text === 'string' ? body.text : undefined;
    if ((!text || !text.trim()) && !file) {
      throw new ApiException(
        'validation_error',
        'text or file is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.emotion.detect({
      text,
      language: body.language,
      file,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('stream')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  async stream(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { text?: string; language?: string },
  ) {
    const text = typeof body.text === 'string' ? body.text : undefined;
    if ((!text || !text.trim()) && !file) {
      throw new ApiException(
        'validation_error',
        'text or file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const stream = this.emotion.streamDetect({
      text,
      language: body.language,
      file,
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
    res.end();
  }
}
