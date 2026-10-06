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
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { KnowledgeBaseService } from './knowledge-base.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBase: KnowledgeBaseService) {}

  @Get('engine')
  engine() {
    return this.knowledgeBase.engine();
  }

  @Get('content-kinds')
  contentKinds() {
    return this.knowledgeBase.contentKinds();
  }

  @Get('collections')
  @UseGuards(TranslateAuthGuard)
  collections(@Req() req: AuthedReq) {
    return this.knowledgeBase.collections(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.knowledgeBase.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.knowledgeBase.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('documents')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req() req: AuthedReq,
    @Query('collection') collection?: string,
    @Query('tag') tag?: string,
    @Query('contentKind') contentKind?: string,
  ) {
    return this.knowledgeBase.listDocuments(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      { collection, tag, contentKind },
    );
  }

  @Get('documents/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.knowledgeBase.getDocument(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      id,
    );
  }

  @Post('documents/:id/revise-meta')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  reviseMeta(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body()
    body: { collection?: string; tags?: string[]; contentKind?: string },
  ) {
    return this.knowledgeBase.reviseMeta({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      collection: body.collection,
      tags: body.tags,
      contentKind: body.contentKind,
    });
  }
}
