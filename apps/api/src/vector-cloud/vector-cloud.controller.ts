import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { VectorCloudService } from './vector-cloud.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/vector-cloud')
export class VectorCloudController {
  constructor(private readonly vectorCloud: VectorCloudService) {}

  @Get('engine')
  engine() {
    return this.vectorCloud.engine();
  }

  @Get('collections')
  @UseGuards(TranslateAuthGuard)
  collections(@Req() req: AuthedReq) {
    return this.vectorCloud.collections(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('namespaces')
  @UseGuards(TranslateAuthGuard)
  namespaces(@Req() req: AuthedReq) {
    return this.vectorCloud.namespaces(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('indexes')
  indexes() {
    return this.vectorCloud.indexes();
  }

  @Get('stats')
  @UseGuards(TranslateAuthGuard)
  stats(@Req() req: AuthedReq) {
    return this.vectorCloud.stats(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.vectorCloud.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.vectorCloud.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  search(
    @Req() req: AuthedReq,
    @Body()
    body: { query?: string; k?: number; documentId?: string; minScore?: number },
  ) {
    return this.vectorCloud.search({
      query: body.query ?? '',
      k: body.k,
      documentId: body.documentId,
      minScore: body.minScore,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
