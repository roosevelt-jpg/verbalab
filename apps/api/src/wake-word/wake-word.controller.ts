import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { WakeWordService } from './wake-word.service';
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

@Controller('v1/wake-word')
export class WakeWordController {
  constructor(private readonly wake: WakeWordService) {}

  @Get('engine')
  engine {
    return this.wake.engine;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: Request & { translateAuth: TranslateAuthContext }) {
    return this.wake.analytics(req.translateAuth.organizationId);
  }

  @Get('keywords')
  @UseGuards(TranslateAuthGuard)
  listKeywords(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('kind') kind?: string,
  ) {
    return this.wake.listKeywords(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      kind,
    );
  }

  @Post('keywords')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  addKeyword(
    @Req req: AuthReq,
    @Body body: { phrase?: string; kind?: string },
  ) {
    if (!body.phrase?.trim) {
      throw new ApiException('validation_error', 'phrase is required', HttpStatus.BAD_REQUEST);
    }
    return this.wake.addKeyword({
      phrase: body.phrase,
      kind: body.kind,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Delete('keywords/:id')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  removeKeyword(@Req req: AuthReq, @Param('id') id: string) {
    return this.wake.removeKeyword({
      id,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('detect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: audioMaxBytes },
    }),
  )
  detect(
    @Req req: AuthReq,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { text?: string; language?: string; includeDefaults?: string },
  ) {
    return this.wake.detect({
      text: body.text,
      language: body.language,
      file,
      includeDefaults: body.includeDefaults !== 'false' && body.includeDefaults !== '0',
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('spot')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: audioMaxBytes },
    }),
  )
  spot(
    @Req req: AuthReq,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { text?: string; language?: string; keywords?: string | string[] },
  ) {
    const keywords = Array.isArray(body.keywords)
      ? body.keywords.map((k) => String(k).trim).filter(Boolean)
      : typeof body.keywords === 'string'
        ? body.keywords.split(',').map((k) => k.trim).filter(Boolean)
        : undefined;
    return this.wake.spot({
      text: body.text,
      language: body.language,
      file,
      keywords,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('triggers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: audioMaxBytes },
    }),
  )
  triggers(
    @Req req: AuthReq,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { text?: string; language?: string },
  ) {
    return this.wake.triggers({
      text: body.text,
      language: body.language,
      file,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('detect/stream')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: audioMaxBytes },
    }),
  )
  async detectStream(
    @Req req: AuthReq,
    @Res res: Response,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { text?: string; language?: string },
  ) {
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.;

    const stream = this.wake.streamDetect({
      text: body.text,
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
    res.end;
  }
}
