import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { AccentsService } from './accents.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { audioMaxBytes } from '../audio/audio-limits';

@Controller('v1/accents')
export class AccentsController {
  constructor(private readonly accents: AccentsService) {}

  @Get('engine')
  engine {
    return this.accents.engine;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
    },
  ) {
    return this.accents.analytics(req.translateAuth.organizationId);
  }

  @Get
  list(@Query('language') language?: string) {
    return this.accents.list(language?.trim || undefined);
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
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { text?: string; language?: string },
  ) {
    const text = typeof body.text === 'string' ? body.text : undefined;
    if ((!text || text.trim.length === 0) && !file) {
      throw new ApiException(
        'validation_error',
        'text or file is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.accents.detect({
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

  @Post('classify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: audioMaxBytes },
    }),
  )
  classify(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { text?: string; language?: string },
  ) {
    const text = typeof body.text === 'string' ? body.text : undefined;
    if ((!text || text.trim.length === 0) && !file) {
      throw new ApiException(
        'validation_error',
        'text or file is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.accents.classify({
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

  @Get(':code')
  get(@Param('code') code: string) {
    return this.accents.get(code);
  }
}
