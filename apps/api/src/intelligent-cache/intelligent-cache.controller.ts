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
import { IntelligentCacheService } from './intelligent-cache.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/intelligent-cache')
export class IntelligentCacheController {
  constructor(private readonly cache: IntelligentCacheService) {}

  @Get('engine')
  engine {
    return this.cache.engine;
  }

  @Get('namespaces')
  namespaces {
    return this.cache.namespaces;
  }

  @Get('ceilings')
  ceilings {
    return this.cache.ceilings;
  }

  @Get('entries')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req req: AuthedReq,
    @Query('namespace') namespace?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cache.listEntries({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      namespace,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('put')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  put(
    @Req req: AuthedReq,
    @Body
    body: {
      namespace?: string;
      key?: string;
      text?: string;
      value?: unknown;
      ttlSec?: number;
      labels?: string[];
    },
  ) {
    return this.cache.put({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('lookup')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  lookup(
    @Req req: AuthedReq,
    @Body body: { namespace?: string; key?: string; text?: string },
  ) {
    return this.cache.lookup({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('invalidate')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  invalidate(
    @Req req: AuthedReq,
    @Body
    body: {
      id?: string;
      namespace?: string;
      key?: string;
      text?: string;
      allInNamespace?: boolean;
    },
  ) {
    return this.cache.invalidate({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.cache.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.cache.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
