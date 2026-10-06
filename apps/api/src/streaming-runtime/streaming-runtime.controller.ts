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
import { StreamingRuntimeService } from './streaming-runtime.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/streaming-runtime')
export class StreamingRuntimeController {
  constructor(private readonly streaming: StreamingRuntimeService) {}

  @Get('engine')
  engine {
    return this.streaming.engine;
  }

  @Get('surfaces')
  surfaces(@Query('kind') kind?: string) {
    return this.streaming.surfaces(kind);
  }

  @Get('transports')
  transports {
    return this.streaming.transports;
  }

  @Get('sessions')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req req: AuthedReq,
    @Query('status') status?: string,
    @Query('kind') kind?: string,
  ) {
    return this.streaming.listSessions({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      status,
      kind,
    });
  }

  @Post('sessions')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req req: AuthedReq,
    @Body body: { kind?: string; label?: string; text?: string },
  ) {
    return this.streaming.createSession({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('sessions/:id/close')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  close(@Req req: AuthedReq, @Param('id') id: string) {
    return this.streaming.closeSession({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
    });
  }

  @Post('stream')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  stream(
    @Req req: AuthedReq,
    @Res res: Response,
    @Body
    body: {
      kind?: string;
      text?: string;
      sessionId?: string;
      chunkDelayMs?: number;
    },
  ) {
    return this.streaming.writeStream(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
        ...body,
      },
      res,
    );
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.streaming.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.streaming.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
