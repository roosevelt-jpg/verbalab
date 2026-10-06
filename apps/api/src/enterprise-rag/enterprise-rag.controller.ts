import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { EnterpriseRagService } from './enterprise-rag.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/enterprise-rag')
export class EnterpriseRagController {
  constructor(private readonly enterpriseRag: EnterpriseRagService) {}

  @Get('engine')
  engine {
    return this.enterpriseRag.engine;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.enterpriseRag.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.enterpriseRag.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Post('chunk')
  @HttpCode(HttpStatus.OK)
  chunk(@Body body: { text?: string; size?: number; overlap?: number }) {
    return this.enterpriseRag.chunk(body);
  }

  @Post('retrieve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  retrieve(
    @Req req: AuthedReq,
    @Body
    body: {
      query?: string;
      mode?: string;
      k?: number;
      maxChars?: number;
      collection?: string;
      tag?: string;
      contentKind?: string;
      documentId?: string;
      minScore?: number;
    },
  ) {
    return this.enterpriseRag.retrieve({
      query: body.query ?? '',
      mode: body.mode,
      k: body.k,
      maxChars: body.maxChars,
      collection: body.collection,
      tag: body.tag,
      contentKind: body.contentKind,
      documentId: body.documentId,
      minScore: body.minScore,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  query(
    @Req req: AuthedReq,
    @Body
    body: {
      question?: string;
      mode?: string;
      k?: number;
      maxChars?: number;
      collection?: string;
      tag?: string;
      contentKind?: string;
      documentId?: string;
    },
  ) {
    return this.enterpriseRag.query({
      question: body.question ?? '',
      mode: body.mode,
      k: body.k,
      maxChars: body.maxChars,
      collection: body.collection,
      tag: body.tag,
      contentKind: body.contentKind,
      documentId: body.documentId,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
