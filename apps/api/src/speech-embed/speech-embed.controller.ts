import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SpeechEmbedService } from './speech-embed.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/speech-embed')
export class SpeechEmbedController {
  constructor(private readonly embeds: SpeechEmbedService) {}

  @Post()
  @UseGuards(TranslateAuthGuard)
  async create(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body()
    body: {
      title?: string;
      text?: string;
      voice?: string;
      language?: string;
    },
  ) {
    if (typeof body.text !== 'string' || typeof body.voice !== 'string') {
      throw new ApiException(
        'validation_error',
        'text and voice are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.embeds.create({
      title: body.title,
      text: body.text,
      voice: body.voice,
      language: body.language,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Get(':id')
  getPublic(@Param('id') id: string) {
    return this.embeds.getPublic(id);
  }

  @Post(':id/audio')
  @UseGuards(TranslateAuthGuard)
  async audio(
    @Param('id') id: string,
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Res() res: Response,
  ) {
    const result = await this.embeds.synthesizeAudio({
      id,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('X-Lugemi-Provider', result.provider);
    res.setHeader('X-Lugemi-Voice', result.voice);
    res.setHeader('X-Lugemi-Characters', String(result.characters));
    res.setHeader('X-Lugemi-Synthetic-Speech', 'true');
    res.status(HttpStatus.OK).send(result.audio);
  }
}
