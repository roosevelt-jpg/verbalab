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
import { OcrService, ocrMaxBytes } from './ocr.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1')
export class OcrController {
  constructor(private readonly ocr: OcrService) {}

  @Post('ocr')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: ocrMaxBytes },
    }),
  )
  extract(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile file: Express.Multer.File | undefined,
    @Body
    body: {
      languageHint?: string;
      source?: string;
      target?: string;
    },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.ocr.extract({
      file,
      languageHint: body.languageHint,
      source: body.source,
      target: body.target,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
