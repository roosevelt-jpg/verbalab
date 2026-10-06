import {
  Body,
  Controller,
  Get,
  Header,
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
import { Request, Response } from 'express';
import { AudioService, audioMaxBytes } from './audio.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1/audio')
export class AudioController {
  constructor(private readonly audio: AudioService) {}

  @Get('voices')
  @Header('Cache-Control', 'public, max-age=300')
  voices() {
    return this.audio.listVoices();
  }

  @Post('transcriptions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  transcribe(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { language?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.audio.transcribe({
      file,
      language: body.language,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('speech')
  @UseGuards(TranslateAuthGuard)
  async speech(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body()
    body: {
      text?: string;
      voice?: string;
      language?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
    @Res() res: Response,
  ) {
    if (typeof body.text !== 'string') {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.voice !== 'string') {
      throw new ApiException('validation_error', 'voice is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.audio.speak({
      text: body.text,
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
    res.setHeader('Content-Disposition', `inline; filename="speech.${result.format}"`);
    res.setHeader('X-VerbaLab-Provider', result.provider);
    res.setHeader('X-VerbaLab-Voice', result.voice);
    res.setHeader('X-VerbaLab-Characters', String(result.characters));
    if (result.watermarkApplied) {
      res.setHeader('X-VerbaLab-Watermark', 'required');
    }
    res.status(HttpStatus.OK).send(result.audio);
  }
}
