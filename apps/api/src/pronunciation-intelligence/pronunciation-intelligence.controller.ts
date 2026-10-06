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
import { PronunciationIntelligenceService } from './pronunciation-intelligence.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { audioMaxBytes } from '../audio/audio-limits';

type AuthReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/pronunciation')
export class PronunciationIntelligenceController {
  constructor(private readonly pronunciation: PronunciationIntelligenceService) {}

  @Get('engine')
  engine {
    return this.pronunciation.engine;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: Request & { translateAuth: TranslateAuthContext }) {
    return this.pronunciation.analytics(req.translateAuth.organizationId);
  }

  @Post('assess')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: audioMaxBytes },
    }),
  )
  assess(
    @Req req: AuthReq,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { reference?: string; hypothesis?: string; language?: string },
  ) {
    return this.pronunciation.assess({
      ...this.ctx(req, body, file),
    });
  }

  @Post('score')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: audioMaxBytes },
    }),
  )
  score(
    @Req req: AuthReq,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { reference?: string; hypothesis?: string; language?: string },
  ) {
    return this.pronunciation.score({
      ...this.ctx(req, body, file),
    });
  }

  @Post('coach')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: audioMaxBytes },
    }),
  )
  coach(
    @Req req: AuthReq,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { reference?: string; hypothesis?: string; language?: string },
  ) {
    return this.pronunciation.coach({
      ...this.ctx(req, body, file),
    });
  }

  @Post('phonemes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  phonemes(@Body body: { text?: string; language?: string }) {
    return this.pronunciation.phonemes({
      text: body.text ?? '',
      language: body.language,
    });
  }

  @Post('fluency')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: audioMaxBytes },
    }),
  )
  fluency(
    @Req req: AuthReq,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { reference?: string; language?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.pronunciation.fluency({
      file,
      reference: body.reference,
      language: body.language,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('assess/stream')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: audioMaxBytes },
    }),
  )
  async assessStream(
    @Req req: AuthReq,
    @Res res: Response,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { reference?: string; hypothesis?: string; language?: string },
  ) {
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.;

    const stream = this.pronunciation.streamAssess({
      ...this.ctx(req, body, file),
    });

    for await (const chunk of stream) {
      res.write(`event: ${chunk.event}\ndata: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.event === 'error' || chunk.event === 'done') break;
    }
    res.end;
  }

  private ctx(
    req: AuthReq,
    body: { reference?: string; hypothesis?: string; language?: string },
    file?: Express.Multer.File,
  ) {
    const reference = typeof body.reference === 'string' ? body.reference : '';
    if (!reference.trim) {
      throw new ApiException(
        'validation_error',
        'reference is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return {
      reference,
      hypothesis: typeof body.hypothesis === 'string' ? body.hypothesis : undefined,
      language: body.language,
      file,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    };
  }
}
