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
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LanguageIntelligenceService } from './language-intelligence.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/language-intelligence')
export class LanguageIntelligenceController {
  constructor(private readonly intel: LanguageIntelligenceService) {}

  @Get()
  catalog() {
    return this.intel.catalog();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  analytics(@Req() req: AuthedReq) {
    return this.intel.analytics(req.translateAuth.organizationId);
  }

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  analyze(
    @Req() req: AuthedReq,
    @Body()
    body: {
      text?: string;
      language?: string;
      includeDialect?: boolean;
      includeAccent?: boolean;
    },
  ) {
    if (typeof body.text !== 'string' || body.text.trim().length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    return this.intel.analyze({
      text: body.text,
      language: body.language,
      includeDialect: body.includeDialect,
      includeAccent: body.includeAccent,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('analyze/stream')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/event-stream')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async analyzeStream(
    @Req() req: AuthedReq,
    @Res() res: Response,
    @Body()
    body: {
      text?: string;
      language?: string;
      includeDialect?: boolean;
      includeAccent?: boolean;
    },
  ) {
    if (typeof body.text !== 'string' || body.text.trim().length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      for await (const chunk of this.intel.analyzeStream({
        text: body.text,
        language: body.language,
        includeDialect: body.includeDialect,
        includeAccent: body.includeAccent,
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      })) {
        res.write(`event: ${chunk.event}\ndata: ${JSON.stringify(chunk.data)}\n\n`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'stream failed';
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Post('sentiment')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  sentiment(@Req() req: AuthedReq, @Body() body: { text?: string }) {
    return this.signalText(req, body, (text) =>
      this.intel.sentiment({
        text,
        organizationId: req.translateAuth.organizationId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      }),
    );
  }

  @Post('emotion')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  emotion(@Req() req: AuthedReq, @Body() body: { text?: string }) {
    return this.signalText(req, body, (text) =>
      this.intel.emotion({
        text,
        organizationId: req.translateAuth.organizationId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      }),
    );
  }

  @Post('intent')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  intent(@Req() req: AuthedReq, @Body() body: { text?: string }) {
    return this.signalText(req, body, (text) =>
      this.intel.intent({
        text,
        organizationId: req.translateAuth.organizationId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      }),
    );
  }

  @Post('readability')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  readability(@Req() req: AuthedReq, @Body() body: { text?: string }) {
    return this.signalText(req, body, (text) =>
      this.intel.readability({
        text,
        organizationId: req.translateAuth.organizationId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      }),
    );
  }

  @Post('complexity')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  complexity(@Req() req: AuthedReq, @Body() body: { text?: string }) {
    return this.signalText(req, body, (text) =>
      this.intel.complexity({
        text,
        organizationId: req.translateAuth.organizationId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      }),
    );
  }

  @Post('translation-confidence')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  translationConfidence(
    @Req() req: AuthedReq,
    @Body()
    body: {
      sourceText?: string;
      targetText?: string;
      sourceLang?: string;
      targetLang?: string;
      provider?: string;
    },
  ) {
    if (typeof body.sourceText !== 'string' || !body.sourceText.trim()) {
      throw new ApiException('validation_error', 'sourceText is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.targetText !== 'string' || !body.targetText.trim()) {
      throw new ApiException('validation_error', 'targetText is required', HttpStatus.BAD_REQUEST);
    }
    return this.intel.translationConfidence({
      sourceText: body.sourceText,
      targetText: body.targetText,
      sourceLang: body.sourceLang ?? '',
      targetLang: body.targetLang ?? '',
      provider: body.provider,
      organizationId: req.translateAuth.organizationId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('speech-confidence')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  speechConfidence(
    @Req() req: AuthedReq,
    @Body()
    body: { transcript?: string; durationSeconds?: number; sttConfidence?: number },
  ) {
    if (typeof body.transcript !== 'string' || !body.transcript.trim()) {
      throw new ApiException('validation_error', 'transcript is required', HttpStatus.BAD_REQUEST);
    }
    return this.intel.speechConfidence({
      transcript: body.transcript,
      durationSeconds: body.durationSeconds,
      sttConfidence: body.sttConfidence,
      organizationId: req.translateAuth.organizationId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  private signalText(
    _req: AuthedReq,
    body: { text?: string },
    run: (text: string) => Promise<unknown>,
  ) {
    if (typeof body.text !== 'string' || body.text.trim().length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    return run(body.text);
  }
}
