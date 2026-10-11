import { Body, Controller, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { VoiceDesignService } from './voice-design.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/voice-design')
export class VoiceDesignController {
  constructor(private readonly design: VoiceDesignService) {}

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
      prompt?: string;
      language?: string;
      gender?: string;
      limit?: number;
    },
  ) {
    if (typeof body.prompt !== 'string') {
      throw new ApiException('validation_error', 'prompt is required', HttpStatus.BAD_REQUEST);
    }
    return this.design.design({
      prompt: body.prompt,
      language: body.language,
      gender: body.gender,
      limit: body.limit,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
