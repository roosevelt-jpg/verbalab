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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LiveService } from './live.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/live')
export class LiveController {
  constructor(private readonly live: LiveService) {}

  @Get('engine')
  engine() {
    return this.live.engine();
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  create(
    @Req() req: AuthedReq,
    @Body()
    body: {
      sampleRate?: number;
      channels?: number;
      sourceLanguage?: string;
      targetLanguage?: string;
      glossaryVersion?: string;
      permissions?: string[];
      transport?: 'sse' | 'websocket';
    },
  ) {
    return this.live.createSession({
      ...body,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Get('sessions/:id')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  get(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.live.getSession(id, req.translateAuth.organizationId);
  }

  @Post('sessions/:id/audio')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  audio(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body()
    body: {
      sourceSequence?: number;
      textHint?: string;
      pcmBase64?: string;
      endOfUtterance?: boolean;
    },
  ) {
    return this.live.ingestAudio({
      sessionId: id,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('sessions/:id/repair')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  repair(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { segmentId?: string; correctedText?: string },
  ) {
    if (!body.segmentId?.trim() || !body.correctedText?.trim()) {
      throw new ApiException(
        'validation_error',
        'segmentId and correctedText are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.live.repair({
      sessionId: id,
      organizationId: req.translateAuth.organizationId,
      segmentId: body.segmentId.trim(),
      correctedText: body.correctedText.trim(),
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('sessions/:id/ack')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  ack(@Req() req: AuthedReq, @Param('id') id: string, @Body() body: { eventId?: string }) {
    if (!body.eventId?.trim()) {
      throw new ApiException('validation_error', 'eventId is required', HttpStatus.BAD_REQUEST);
    }
    return this.live.ack({
      sessionId: id,
      organizationId: req.translateAuth.organizationId,
      eventId: body.eventId.trim(),
    });
  }

  @Get('sessions/:id/events')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  events(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Query('after') after: string | undefined,
    @Res() res: Response,
  ) {
    return this.live.streamEvents(
      {
        sessionId: id,
        organizationId: req.translateAuth.organizationId,
        afterEventId: after,
      },
      res,
    );
  }
}
