import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { audioMaxBytes } from '../audio/audio-limits';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import {
  parseIndustryPacks,
  parseStringList,
  SpeechRecognitionService,
} from './speech-recognition.service';

@Controller('v1/speech')
export class SpeechRecognitionController {
  constructor(private readonly speech: SpeechRecognitionService) {}

  @Get('engine')
  engine() {
    return this.speech.engine();
  }

  @Get('engine/analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
    },
  ) {
    return this.speech.analytics(req.translateAuth.organizationId);
  }

  @Get('vocabulary/packs')
  vocabularyPacks() {
    return this.speech.listIndustryPacks();
  }

  @Get('vocabulary')
  @UseGuards(TranslateAuthGuard)
  listVocabulary(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
    },
  ) {
    return this.speech.listCustomVocabulary(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Post('vocabulary')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  addVocabulary(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body() body: { phrase?: string },
  ) {
    if (typeof body.phrase !== 'string') {
      throw new ApiException('validation_error', 'phrase is required', HttpStatus.BAD_REQUEST);
    }
    return this.speech.addCustomVocabulary({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      phrase: body.phrase,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Delete('vocabulary/:id')
  @UseGuards(TranslateAuthGuard)
  removeVocabulary(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Param('id') id: string,
  ) {
    return this.speech.removeCustomVocabulary({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('recognize')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  recognize(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      language?: string;
      industryPacks?: string;
      vocabulary?: string;
      punctuate?: string;
      capitalize?: string;
      useWorkspaceVocabulary?: string;
    },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.speech.recognize({
      file,
      language: body.language,
      industryPacks: parseIndustryPacks(body.industryPacks),
      vocabulary: parseStringList(body.vocabulary),
      punctuate: body.punctuate !== 'false',
      capitalize: body.capitalize !== 'false',
      useWorkspaceVocabulary: body.useWorkspaceVocabulary !== 'false',
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('stream')
  @UseGuards(TranslateAuthGuard)
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
    @Body()
    body: {
      language?: string;
      industryPacks?: string;
      vocabulary?: string;
    },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }

    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const stream = this.speech.streamRecognize({
      file,
      language: body.language,
      industryPacks: parseIndustryPacks(body.industryPacks),
      vocabulary: parseStringList(body.vocabulary),
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

  @Post('subtitles')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  subtitles(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      language?: string;
      format?: string;
      industryPacks?: string;
      vocabulary?: string;
    },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.speech.subtitles({
      file,
      language: body.language,
      format: body.format === 'vtt' ? 'vtt' : 'srt',
      industryPacks: parseIndustryPacks(body.industryPacks),
      vocabulary: parseStringList(body.vocabulary),
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
