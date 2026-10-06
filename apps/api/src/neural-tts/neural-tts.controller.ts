import {
  Body,
  Controller,
  Get,
  Header,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { NeuralTtsService } from './neural-tts.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/tts')
export class NeuralTtsController {
  constructor(private readonly tts: NeuralTtsService) {}

  @Get('engine')
  engine() {
    return this.tts.engine();
  }

  @Get('engine/analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
    },
  ) {
    return this.tts.analytics(req.translateAuth.organizationId);
  }

  @Get('voices')
  @Header('Cache-Control', 'public, max-age=60')
  voices(
    @Query('gender') gender?: string,
    @Query('language') language?: string,
    @Query('personality') personality?: string,
    @Query('dialect') dialect?: string,
    @Query('accent') accent?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('toneStyle') toneStyle?: string,
    @Query('category') category?: string,
    @Query('ageGroup') ageGroup?: string,
    @Query('enterprise') enterprise?: string,
  ) {
    return this.tts.listVoices({
      gender,
      language,
      personality,
      dialect,
      accent,
      region,
      country,
      toneStyle,
      category,
      ageGroup,
      enterprise,
    });
  }

  @Get('voices/workspace')
  @UseGuards(TranslateAuthGuard)
  workspaceVoices(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
    },
    @Query('gender') gender?: string,
    @Query('language') language?: string,
    @Query('personality') personality?: string,
    @Query('dialect') dialect?: string,
    @Query('accent') accent?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('toneStyle') toneStyle?: string,
    @Query('category') category?: string,
    @Query('ageGroup') ageGroup?: string,
    @Query('enterprise') enterprise?: string,
  ) {
    return this.tts.listVoices(
      {
        gender,
        language,
        personality,
        dialect,
        accent,
        region,
        country,
        toneStyle,
        category,
        ageGroup,
        enterprise,
      },
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
      },
    );
  }

  @Post('synthesize')
  @UseGuards(TranslateAuthGuard)
  async synthesize(
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

    const result = await this.tts.synthesize({
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
    res.setHeader('X-Lugemi-Provider', result.provider);
    res.setHeader('X-Lugemi-Voice', result.voice);
    res.setHeader('X-Lugemi-Characters', String(result.characters));
    res.setHeader('X-Lugemi-Mode', 'batch');
    if (result.watermarkApplied) {
      res.setHeader('X-Lugemi-Watermark', 'required');
    }
    res.status(HttpStatus.OK).send(result.audio);
  }

  @Post('stream')
  @UseGuards(TranslateAuthGuard)
  async stream(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Res() res: Response,
    @Body()
    body: {
      text?: string;
      voice?: string;
      language?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
  ) {
    if (typeof body.text !== 'string') {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.voice !== 'string') {
      throw new ApiException('validation_error', 'voice is required', HttpStatus.BAD_REQUEST);
    }

    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Lugemi-Mode', 'chunk_sse');
    res.flushHeaders?.();

    const stream = this.tts.streamSynthesize({
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

    for await (const chunk of stream) {
      res.write(`event: ${chunk.event}\ndata: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.event === 'error' || chunk.event === 'done') break;
    }
    res.end();
  }
}
