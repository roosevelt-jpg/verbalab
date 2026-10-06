import {
  Body,
  Controller,
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
import { Request } from 'express';
import { InterpretService } from './interpret.service';
import { audioMaxBytes } from '../audio/audio.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1')
export class InterpretController {
  constructor(private readonly interpret: InterpretService) {}

  @Post('interpret')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  run(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      target?: string;
      source?: string;
      language?: string;
      voice?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }

    return this.interpret.interpret({
      file,
      target: body.target ?? '',
      source: body.source,
      language: body.language,
      voice: body.voice ?? '',
      format: body.format,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
