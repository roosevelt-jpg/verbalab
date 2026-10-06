import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { MixService } from './mix.service';
import { audioMaxBytes } from '../audio/audio.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/mix')
export class MixController {
  constructor(private readonly mix: MixService) {}

  @Get('engine')
  engine() {
    return this.mix.engine();
  }

  @Post('transcribe-translate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  transcribeTranslate(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      target?: string;
      audioRef?: string;
      textHint?: string;
      sourceHints?: string | string[];
      varietyId?: string;
      glossaryVersion?: string;
    },
  ) {
    const target = body.target?.trim();
    if (!target) {
      throw new ApiException('validation_error', 'target is required', HttpStatus.BAD_REQUEST);
    }
    const sourceHints = Array.isArray(body.sourceHints)
      ? body.sourceHints
      : typeof body.sourceHints === 'string' && body.sourceHints.trim()
        ? body.sourceHints.split(',').map((s) => s.trim())
        : undefined;

    return this.mix.transcribeTranslate({
      file,
      audioRef: body.audioRef,
      textHint: body.textHint,
      target,
      sourceHints,
      varietyId: body.varietyId,
      glossaryVersion: body.glossaryVersion,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
