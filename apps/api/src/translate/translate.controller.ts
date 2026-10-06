import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { TranslateService } from './translate.service';
import { TranslateFormatsService } from './formats/translate-formats.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1')
export class TranslateController {
  constructor(
    private readonly translateService: TranslateService,
    private readonly formats: TranslateFormatsService,
  ) {}

  @Get('translate/engine')
  engine() {
    return this.formats.engine();
  }

  @Post('detect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  detect(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body() body: { text?: string },
  ) {
    if (typeof body.text !== 'string' || body.text.length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }

    return this.translateService.detect({
      text: body.text,
      organizationId: req.translateAuth.organizationId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  translate(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body() body: { text?: string; source?: string; target?: string },
  ) {
    if (typeof body.text !== 'string' || body.text.length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.source !== 'string' || !body.source) {
      throw new ApiException('validation_error', 'source is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.target !== 'string' || !body.target) {
      throw new ApiException('validation_error', 'target is required', HttpStatus.BAD_REQUEST);
    }

    return this.translateService.translate({
      text: body.text,
      source: body.source,
      target: body.target,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('translate/formats')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  translateFormat(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body() body: { format?: string; content?: string; source?: string; target?: string },
  ) {
    if (typeof body.source !== 'string' || !body.source) {
      throw new ApiException('validation_error', 'source is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.target !== 'string' || !body.target) {
      throw new ApiException('validation_error', 'target is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.content !== 'string') {
      throw new ApiException('validation_error', 'content is required', HttpStatus.BAD_REQUEST);
    }
    const format = this.formats.parseFormat(body.format);
    return this.formats.translateFormat({
      format,
      content: body.content,
      source: body.source,
      target: body.target,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('translate/chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  translateChat(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body()
    body: {
      messages?: Array<{ role?: string; content?: string }>;
      source?: string;
      target?: string;
    },
  ) {
    if (typeof body.source !== 'string' || !body.source) {
      throw new ApiException('validation_error', 'source is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.target !== 'string' || !body.target) {
      throw new ApiException('validation_error', 'target is required', HttpStatus.BAD_REQUEST);
    }
    const messages = (body.messages ?? []).map((m) => ({
      role: m.role ?? 'user',
      content: m.content ?? '',
    }));
    return this.formats.translateChat({
      messages,
      source: body.source,
      target: body.target,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('translate/stream')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async translateStream(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Res() res: Response,
    @Body() body: { text?: string; source?: string; target?: string },
  ) {
    if (typeof body.text !== 'string' || body.text.length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.source !== 'string' || !body.source) {
      throw new ApiException('validation_error', 'source is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.target !== 'string' || !body.target) {
      throw new ApiException('validation_error', 'target is required', HttpStatus.BAD_REQUEST);
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      for await (const event of this.formats.streamTranslate({
        text: body.text,
        source: body.source,
        target: body.target,
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      })) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'stream_failed';
      res.write(`data: ${JSON.stringify({ event: 'error', message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
