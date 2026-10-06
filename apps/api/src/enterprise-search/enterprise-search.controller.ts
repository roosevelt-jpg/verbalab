import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { EnterpriseSearchService } from './enterprise-search.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/enterprise-search')
export class EnterpriseSearchController {
  constructor(private readonly enterpriseSearch: EnterpriseSearchService) {}

  @Get('engine')
  engine() {
    return this.enterpriseSearch.engine();
  }

  @Get('modes')
  modes() {
    return this.enterpriseSearch.modes();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.enterpriseSearch.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.enterpriseSearch.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('suggest')
  @UseGuards(TranslateAuthGuard)
  suggest(@Req() req: AuthedReq, @Query('q') q?: string, @Query('limit') limit?: string) {
    return this.enterpriseSearch.suggest({
      q: q ?? '',
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  search(
    @Req() req: AuthedReq,
    @Body()
    body: {
      query?: string;
      mode?: string;
      k?: number;
      collection?: string;
      tag?: string;
      contentKind?: string;
      documentId?: string;
      minScore?: number;
    },
  ) {
    return this.enterpriseSearch.search({
      query: body.query ?? '',
      mode: body.mode,
      k: body.k,
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
}
