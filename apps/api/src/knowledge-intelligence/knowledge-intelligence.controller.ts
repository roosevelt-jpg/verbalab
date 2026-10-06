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
import { KnowledgeIntelligenceService } from './knowledge-intelligence.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/knowledge-intelligence')
export class KnowledgeIntelligenceController {
  constructor(private readonly knowledgeIntel: KnowledgeIntelligenceService) {}

  @Get('engine')
  engine {
    return this.knowledgeIntel.engine;
  }

  @Get('insight')
  @UseGuards(TranslateAuthGuard)
  insight(@Req req: AuthedReq) {
    return this.knowledgeIntel.insight(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('evolution')
  @UseGuards(TranslateAuthGuard)
  evolution(@Req req: AuthedReq) {
    return this.knowledgeIntel.evolution(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.knowledgeIntel.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.knowledgeIntel.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Post('discover')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  discover(
    @Req req: AuthedReq,
    @Body body: { query?: string; limit?: number },
  ) {
    return this.knowledgeIntel.discover({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      query: body.query,
      limit: body.limit,
    });
  }

  @Post('link')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  link(
    @Req req: AuthedReq,
    @Body body: { documentId?: string; limit?: number },
  ) {
    return this.knowledgeIntel.link({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      documentId: body.documentId,
      limit: body.limit,
    });
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  recommend(
    @Req req: AuthedReq,
    @Body body: { query?: string; limit?: number },
  ) {
    return this.knowledgeIntel.recommend({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      query: body.query,
      limit: body.limit,
    });
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  validate(@Req req: AuthedReq, @Body body: { documentId?: string }) {
    return this.knowledgeIntel.validate({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      documentId: body.documentId,
    });
  }

  @Post('duplicates')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  duplicates(@Req req: AuthedReq, @Body body: { limit?: number }) {
    return this.knowledgeIntel.duplicates({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      limit: body.limit,
    });
  }

  @Post('confidence')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  confidence(
    @Req req: AuthedReq,
    @Body body: { documentId?: string; limit?: number },
  ) {
    return this.knowledgeIntel.confidence({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      documentId: body.documentId,
      limit: body.limit,
    });
  }
}
