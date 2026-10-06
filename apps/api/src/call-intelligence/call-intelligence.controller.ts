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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { CallIntelligenceService } from './call-intelligence.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { audioMaxBytes } from '../audio/audio-limits';

type AuthReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/call-intelligence')
export class CallIntelligenceController {
  constructor(private readonly calls: CallIntelligenceService) {}

  @Get('engine')
  engine() {
    return this.calls.engine();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: Request & { translateAuth: TranslateAuthContext }) {
    return this.calls.analytics(req.translateAuth.organizationId);
  }

  @Get('report')
  @UseGuards(TranslateAuthGuard)
  report(@Req() req: Request & { translateAuth: TranslateAuthContext }) {
    return this.calls.report(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('calls')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('limit') limit?: string,
  ) {
    return this.calls.listCalls(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      limit ? Number(limit) : 50,
    );
  }

  @Get('calls/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req() req: Request & { translateAuth: TranslateAuthContext }, @Param('id') id: string) {
    return this.calls.getCall(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      id,
    );
  }

  @Post('calls')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  create(
    @Req() req: AuthReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      transcript?: string;
      language?: string;
      externalRef?: string;
      direction?: string;
      analyze?: string | boolean;
    },
  ) {
    const analyze =
      body.analyze === false || body.analyze === 'false' || body.analyze === '0'
        ? false
        : true;
    return this.calls.createCall({
      transcript: body.transcript,
      language: body.language,
      externalRef: body.externalRef,
      direction: body.direction,
      file,
      analyze,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('calls/:id/analyze')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  analyze(@Req() req: AuthReq, @Param('id') id: string) {
    return this.calls.analyzeCall({
      id,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('analyze/stream')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  async analyzeStream(
    @Req() req: AuthReq,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { transcript?: string; language?: string },
  ) {
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const stream = this.calls.streamAnalyze({
      transcript: body.transcript,
      language: body.language,
      file,
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
